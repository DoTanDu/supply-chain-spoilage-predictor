// src/presentation/controllers/ForecastController.js
const { resolveStoreScope, assertStoreOwnership, isChainOwner } = require('../middlewares/storeScope');
const SqlConnection = require('../../infrastructure/database/sqlConnection');
const ensureSmartSupplySchema = require('../../infrastructure/database/ensureSmartSupplySchema');
const RealEnvironmentService = require('../../infrastructure/services/RealEnvironmentService');

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
      const todayStr = new Date().toISOString().slice(0, 10);

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
            ${SqlConnection.escapeSql(it.modelName || 'LightGBM-M5-Pretrained')},
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
      const nextStatusUpper = String(status || req.body.newStatus || '').toUpperCase().trim();
      const approvedBy = req.user ? req.user.id : (req.body.approvedBy || 2);
      const approvedByName = req.user ? req.user.fullName : (req.body.approvedByName || 'Cửa hàng trưởng');

      // Kiểm tra hạn mức thẩm quyền duyệt PO của MANAGER (theo enterprise_config)
      if (!isChainOwner(req.user) && (nextStatusUpper === 'APPROVED' || nextStatusUpper === 'SUBMITTED')) {
        await ensureSmartSupplySchema();
        const cfgRows = await SqlConnection.queryJson(`
          SELECT TOP 1 CAST(manager_po_approval_limit AS FLOAT) AS limitAmount
          FROM dbo.enterprise_config WHERE id = 1;
        `).catch(() => []);
        const mgrLimit = Number(cfgRows[0]?.limitAmount ?? 5000000);
        const orderCost = Number(existingOrder.totalEstimatedCost || 0);
        if (orderCost > mgrLimit) {
          return res.status(403).json({
            success: false,
            code: 'ERR_PO_EXCEEDS_MANAGER_LIMIT',
            message: `Đơn PO ${existingOrder.orderCode} có giá trị ${orderCost.toLocaleString('vi-VN')} đ vượt hạn mức duyệt của Quản lý (${mgrLimit.toLocaleString('vi-VN')} đ). Vui lòng chuyển Chủ chuỗi (OWNER) phê duyệt.`
          });
        }
      }

      const result = await this.updatePurchaseOrderStatusUseCase.execute({
        orderId: id,
        status: status || req.body.newStatus,
        newStatus: status || req.body.newStatus,
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
