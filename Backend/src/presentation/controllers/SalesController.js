// src/presentation/controllers/SalesController.js
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
      const { items, weather, isHoliday } = req.body;
      const cashierId = req.user ? req.user.id : (req.body.cashierId || 3);
      const cashierName = req.user ? req.user.fullName : (req.body.cashierName || 'Thu ngân quầy POS');

      const weatherCondition = typeof weather === 'object' && weather !== null
        ? (weather.condition || 'NORMAL')
        : (weather || 'NORMAL');
      const holidayFlag = typeof weather === 'object' && weather !== null
        ? Boolean(weather.isHoliday ?? isHoliday)
        : Boolean(isHoliday);

      const result = await this.processFefoSaleUseCase.execute({
        items,
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
      const requestedStoreId = req.query.storeId || null;
      const userRole = String(req.user?.roleCode || '').toUpperCase();
      const userStoreId = Number(req.user?.storeId || 1);

      if (requestedStoreId && userRole && userRole !== 'ADMIN' && userRole !== 'OWNER') {
        if (String(requestedStoreId).toUpperCase() === 'ALL' || Number(requestedStoreId) !== userStoreId) {
          return res.status(403).json({
            success: false,
            errorCode: 'ERR_STORE_SCOPE_FORBIDDEN',
            message: `Phạm vi dữ liệu bị từ chối: Bạn chỉ được phép truy cập lịch sử bán hàng của Chi nhánh #${userStoreId}!`
          });
        }
      }
      const effectiveStoreId = (userRole === 'ADMIN' || userRole === 'OWNER')
        ? (requestedStoreId || 'ALL')
        : (requestedStoreId || userStoreId);

      const result = await this.getSalesHistoryUseCase.execute({ limit, storeId: effectiveStoreId });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async importSales(req, res, next) {
    try {
      const rows = Array.isArray(req.body?.rows) ? req.body.rows : (Array.isArray(req.body) ? req.body : []);
      const userId = req.user ? req.user.id : 1;
      const userName = req.user ? (req.user.fullName || req.user.username) : 'Quản trị viên';

      const result = await this.saleRepository.importPosSalesRows(rows, userId);

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
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SalesController;
