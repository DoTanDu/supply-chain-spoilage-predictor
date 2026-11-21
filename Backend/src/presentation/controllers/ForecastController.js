// src/presentation/controllers/ForecastController.js
const { resolveStoreScope, assertStoreOwnership, isChainOwner, normalizeRoleCode } = require('../middlewares/storeScope');
const { formatLocalDateYMD } = require('../../domain/utils/dateUtils');
const SqlConnection = require('../../infrastructure/database/sqlConnection');
const ensureSmartSupplySchema = require('../../infrastructure/database/ensureSmartSupplySchema');
const RealEnvironmentService = require('../../infrastructure/services/RealEnvironmentService');

const PO_STATUS_MAP = Object.freeze({
  PENDING: 'DRAFT',
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  SHIPPING: 'SUBMITTED',
  SUBMITTED: 'SUBMITTED',
  COMPLETED: 'DELIVERED',
  RECEIVED: 'DELIVERED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
});

class ForecastController {
  constructor({
    calculateROPForecastUseCase,
    createPurchaseOrderUseCase,
    updatePurchaseOrderStatusUseCase,
    purchaseOrderRepository
  }) {
    this.calculateROPForecastUseCase = calculateROPForecastUseCase;
    this.createPurchaseOrderUseCase = createPurchaseOrderUseCase;
    this.updatePurchaseOrderStatusUseCase = updatePurchaseOrderStatusUseCase;
    this.purchaseOrderRepository = purchaseOrderRepository;
  }

  async getEnvironment(req, res, next) {
    try {
      const storeId = req.query?.storeId && req.query.storeId !== 'ALL' ? Number(req.query.storeId) : (req.user?.storeId || 1);
      const lat = req.query?.lat !== undefined ? req.query.lat : null;
      const lon = req.query?.lon !== undefined ? req.query.lon : null;
      const locationName = req.query?.locationName || '';
      const env = await RealEnvironmentService.getLiveEnvironment({ storeId, lat, lon, locationName });
      res.json(env);
    } catch (err) {
      res.status(503).json({
        success: false,
        source: 'Open-Meteo (Unavailable)',
        current: null,
        calendar: null,
        dailyForecast: [],
        message: `Không thể đồng bộ dữ liệu thời tiết thực tế: ${err.message}`
      });
    }
  }

  async getROPForecast(req, res, next) {
    try {
      const { weather = 'AUTO', isHoliday = 'auto', isPromo = 'false', storeId: requestedStoreId, lat = null, lon = null, locationName = '' } = req.query;
      const scope = resolveStoreScope(req, requestedStoreId, { allowAll: true, adminDefault: 'ALL' });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }

      const result = await this.calculateROPForecastUseCase.execute({
        weather,
        isHoliday,
        isPromo: isPromo === 'true' || isPromo === true,
        storeId: scope.storeId,
        lat,
        lon,
        locationName
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async saveSnapshot(req, res, next) {
    try {
      await ensureSmartSupplySchema();
      const scope = resolveStoreScope(req, req.body?.storeId || req.query?.storeId, { allowAll: false, adminDefault: 1 });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }
      const storeId = Number(scope.storeId);
      const { weather = 'NORMAL', isHoliday = false, isPromo = false } = req.body || {};
      const ropResult = await this.calculateROPForecastUseCase.execute({
        weather,
        isHoliday: Boolean(isHoliday),
        isPromo: Boolean(isPromo),
        storeId
      });

      const items = ropResult.allForecasts || [];
      let savedCount = 0;
      const todayStr = formatLocalDateYMD(new Date());

      for (const it of items) {
        const pId = Number(it.productId);
        const maeVal = it.maeMetric !== null && it.maeMetric !== undefined ? Number(it.maeMetric) : 'NULL';
        const sql = `
          DELETE FROM dbo.ai_forecasts
          WHERE store_id = ${storeId} AND product_id = ${pId} AND forecast_date = ${SqlConnection.escapeSql(todayStr)};
          INSERT INTO dbo.ai_forecasts (
            store_id, product_id, forecast_date, predicted_sales, lower_bound, upper_bound,
            spoilage_risk_qty, suggested_order_qty, model_name, mae_metric, created_at
          ) VALUES (
            ${storeId}, ${pId}, ${SqlConnection.escapeSql(todayStr)},
            ${Number(it.predictedSales7d || 0)},
            ${Number(it.lowerBound || 0)},
            ${Number(it.upperBound || 0)},
            ${Number(it.spoilageRiskQty || 0)},
            ${Number(it.netSuggestedOrderQuantity ?? it.suggestedOrderQuantity ?? 0)},
            ${SqlConnection.escapeSql(it.modelName || 'ROP-Live-Sales-Weather')},
            ${maeVal},
            GETDATE()
          );
        `;
        await SqlConnection.executeSql(sql);
        savedCount++;
      }

      res.status(201).json({
        success: true,
        message: `Đã lưu snapshot dự báo 7 ngày (${savedCount} sản phẩm) cho chi nhánh #${storeId} ngày ${todayStr}.`,
        data: { storeId, forecastDate: todayStr, savedCount }
      });
    } catch (err) {
      next(err);
    }
  }

  async createPO(req, res, next) {
    try {
      const scope = resolveStoreScope(req, req.body?.storeId, { allowAll: false, adminDefault: 1 });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }

      const { supplierId = 1, items, expectedDeliveryDate, notes } = req.body;
      const createdBy = req.user ? req.user.id : (req.body.createdBy || 2);
      const createdByName = req.user ? req.user.fullName : (req.body.createdByName || 'Cửa hàng trưởng');

      const result = await this.createPurchaseOrderUseCase.execute({
        storeId: scope.storeId,
        supplierId,
        createdBy,
        createdByName,
        items,
        expectedDeliveryDate,
        notes
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async _assertManagerPoLimit(reqUser, existingOrder) {
    if (isChainOwner(reqUser)) return null;
    await ensureSmartSupplySchema();
    const cfgRows = await SqlConnection.queryJson(`
      SELECT TOP 1 CAST(manager_po_approval_limit AS FLOAT) AS limitAmount
      FROM dbo.enterprise_config WHERE id = 1;
    `).catch(() => []);
    const mgrLimit = Number(cfgRows[0]?.limitAmount ?? 5000000);
    const orderCost = Number(existingOrder.totalEstimatedCost || 0);
    if (orderCost > mgrLimit) {
      return {
        success: false,
        code: 'ERR_PO_EXCEEDS_MANAGER_LIMIT',
        message: `Đơn PO ${existingOrder.orderCode} có giá trị ${orderCost.toLocaleString('vi-VN')} đ vượt hạn mức duyệt của Quản lý (${mgrLimit.toLocaleString('vi-VN')} đ). Vui lòng chuyển Chủ chuỗi (OWNER) phê duyệt.`
      };
    }
    return null;
  }

  async updatePOStatus(req, res, next) {
    try {
      const { id } = req.params;
      const existingOrder = await this.purchaseOrderRepository.findById(id);
      if (!existingOrder) {
        return res.status(404).json({ success: false, message: `Không tìm thấy đơn đặt hàng ID [${id}]!` });
      }
      const ownership = assertStoreOwnership(req.user, existingOrder.storeId, `đơn đặt hàng PO #${id}`);
      if (!ownership.ok) {
        return res.status(ownership.statusCode).json(ownership.error);
      }

      const { status, notes } = req.body;
      const rawStatusUpper = String(status || req.body.newStatus || '').toUpperCase().trim();
      const normalizedNextStatus = PO_STATUS_MAP[rawStatusUpper];
      if (!normalizedNextStatus) {
        return res.status(400).json({
          success: false,
          code: 'ERR_INVALID_PO_STATUS',
          message: `Trạng thái đơn đặt hàng [${status || req.body.newStatus || ''}] không hợp lệ! Chỉ chấp nhận: DRAFT, APPROVED, SUBMITTED, DELIVERED, CANCELLED.`
        });
      }

      // Khóa SoD: Nhân viên (CASHIER/STAFF) chỉ được phép xác nhận đã nhận hàng (DELIVERED), không được duyệt/gửi/hủy PO
      const normalizedRole = normalizeRoleCode(req.user?.roleCode);
      if (normalizedRole !== 'ADMIN' && normalizedRole !== 'STORE_MANAGER' && normalizedNextStatus !== 'DELIVERED') {
        return res.status(403).json({
          success: false,
          statusCode: 403,
          code: 'ERR_UNAUTHORIZED_ROLE',
          message: `Từ chối truy cập (403 Forbidden). Vai trò [${req.user?.roleCode}] chỉ được phép xác nhận đã nhận hàng (DELIVERED), không có quyền chuyển PO sang [${normalizedNextStatus}].`
        });
      }

      const approvedBy = req.user ? req.user.id : (req.body.approvedBy || 2);
      const approvedByName = req.user ? req.user.fullName : (req.body.approvedByName || 'Cửa hàng trưởng');

      // Kiểm tra hạn mức thẩm quyền duyệt PO của MANAGER (theo enterprise_config)
      if (normalizedNextStatus === 'APPROVED' || normalizedNextStatus === 'SUBMITTED') {
        const limitErr = await this._assertManagerPoLimit(req.user, existingOrder);
        if (limitErr) {
          return res.status(403).json(limitErr);
        }
      }

      const result = await this.updatePurchaseOrderStatusUseCase.execute({
        orderId: id,
        status: normalizedNextStatus,
        newStatus: normalizedNextStatus,
        approvedBy,
        managerId: approvedBy,
        approvedByName,
        managerName: approvedByName,
        notes
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAllPO(req, res, next) {
    try {
      const scope = resolveStoreScope(req, req.query?.storeId, { adminDefault: 'ALL' });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }

      const orders = await this.purchaseOrderRepository.findAll(scope.storeId);
      res.json({
        success: true,
        count: orders.length,
        data: orders
      });
    } catch (err) {
      next(err);
    }
  }

  async getPOById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await this.purchaseOrderRepository.findById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: `Không tìm thấy đơn đặt hàng ID [${id}]!` });
      }
      const ownership = assertStoreOwnership(req.user, order.storeId, `đơn đặt hàng PO #${id}`);
      if (!ownership.ok) {
        return res.status(ownership.statusCode).json(ownership.error);
      }
      res.json({
        success: true,
        data: order
      });
    } catch (err) {
      next(err);
    }
  }

  async sendPOToDC(req, res, next) {
    try {
      const { id } = req.params;
      const existingOrder = await this.purchaseOrderRepository.findById(id);
      if (!existingOrder) {
        return res.status(404).json({ success: false, message: `Không tìm thấy đơn đặt hàng ID [${id}]!` });
      }
      const ownership = assertStoreOwnership(req.user, existingOrder.storeId, `đơn đặt hàng PO #${id}`);
      if (!ownership.ok) {
        return res.status(ownership.statusCode).json(ownership.error);
      }

      const limitErr = await this._assertManagerPoLimit(req.user, existingOrder);
      if (limitErr) {
        return res.status(403).json(limitErr);
      }

      const approvedBy = req.user ? req.user.id : 2;
      const approvedByName = req.user ? (req.user.fullName || req.user.username) : 'Cửa hàng trưởng';

      const result = await this.updatePurchaseOrderStatusUseCase.execute({
        orderId: id,
        status: 'SUBMITTED',
        newStatus: 'SUBMITTED',
        approvedBy,
        managerId: approvedBy,
        approvedByName,
        managerName: approvedByName,
        notes: req.body?.notes || 'Đã gửi đơn đặt hàng'
      });

      res.json({
        success: true,
        message: `Đã gửi đơn đặt hàng [PO #${id}] thành công!`,
        data: result.data || result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ForecastController;
