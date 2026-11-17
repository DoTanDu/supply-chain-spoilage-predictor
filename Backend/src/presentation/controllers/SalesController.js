// src/presentation/controllers/SalesController.js
const { resolveStoreScope, assertStoreOwnership } = require('../middlewares/storeScope');

class SalesController {
  constructor({ processFefoSaleUseCase, getSalesHistoryUseCase, getSaleReceiptUseCase, saleRepository, auditLogRepository }) {
    this.processFefoSaleUseCase = processFefoSaleUseCase;
    this.getSalesHistoryUseCase = getSalesHistoryUseCase;
    this.getSaleReceiptUseCase = getSaleReceiptUseCase;
    this.saleRepository = saleRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async processSale(req, res, next) {
    try {
      const scope = resolveStoreScope(req, req.body?.storeId, { allowAll: false, adminDefault: 1 });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }

      const { items, weather, isHoliday, saleDate, transactionCode } = req.body;
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && item.storeId !== undefined && item.storeId !== null) {
            const itemScope = resolveStoreScope(req, item.storeId, { allowAll: false, adminDefault: scope.storeId });
            if (!itemScope.ok) {
              return res.status(itemScope.statusCode).json(itemScope.error);
            }
          }
        }
      }

      const cashierId = req.user ? req.user.id : (req.body.cashierId || 3);
      const cashierName = req.user ? req.user.fullName : (req.body.cashierName || 'Nhân viên cửa hàng');

      const weatherCondition = typeof weather === 'object' && weather !== null
        ? (weather.condition || 'NORMAL')
        : (weather || 'NORMAL');
      const holidayFlag = typeof weather === 'object' && weather !== null
        ? Boolean(weather.isHoliday ?? isHoliday)
        : Boolean(isHoliday);

      const result = await this.processFefoSaleUseCase.execute({
        items,
        storeId: scope.storeId,
        saleDate: saleDate || null,
        transactionCode: transactionCode || null,
        weather: weatherCondition,
        isHoliday: holidayFlag,
        cashierId,
        cashierName
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const limit = Number(req.query.limit || 50);
      const scope = resolveStoreScope(req, req.query.storeId || null, { adminDefault: 'ALL' });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }

      const result = await this.getSalesHistoryUseCase.execute({ limit, storeId: scope.storeId });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async importSales(req, res, next) {
    try {
      const scope = resolveStoreScope(req, req.body?.storeId, { allowAll: false, adminDefault: 1 });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }

      const rows = Array.isArray(req.body?.rows) ? req.body.rows : (Array.isArray(req.body) ? req.body : []);
      const userId = req.user ? req.user.id : 1;
      const userName = req.user ? (req.user.fullName || req.user.username) : 'Quản trị viên';

      const result = await this.saleRepository.importPosSalesRows(rows, userId, scope.isOwner ? null : scope.storeId);

      if (this.auditLogRepository) {
        await this.auditLogRepository.log({
          userId,
          userName,
          action: 'IMPORT_POS_SALES',
          entityName: 'SALES_HISTORY',
          entityId: `BATCH_IMPORT_${result.importedCount}`,
          description: `[Đồng bộ POS Excel/CSV] ${userName} đã nạp thành công ${result.importedCount} bản ghi lịch sử bán hàng POS vào hệ thống (Từ chối: ${result.rejectedCount} dòng lỗi).`
        });
      }

      res.status(201).json({
        success: true,
        message: `Đã nạp thành công ${result.importedCount} bản ghi doanh số bán hàng POS vào cơ sở dữ liệu!`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getReceipt(req, res, next) {
    try {
      const { txnCode } = req.params;
      const result = await this.getSaleReceiptUseCase.execute({ transactionCode: txnCode });
      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }
      const ownership = assertStoreOwnership(req.user, result.data?.storeId, `hóa đơn [${txnCode}]`);
      if (!ownership.ok) {
        return res.status(ownership.statusCode).json(ownership.error);
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SalesController;
