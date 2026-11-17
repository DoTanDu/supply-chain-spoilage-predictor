// src/presentation/controllers/BatchController.js
const ShelfLife = require('../../domain/value-objects/ShelfLife');
const { resolveStoreScope, assertStoreOwnership } = require('../middlewares/storeScope');

class BatchController {
  constructor({
    getBatchAlertsUseCase,
    receiveDCBatchUseCase,
    applyQuickMarkdownUseCase,
    rotateShelfFefoUseCase,
    batchRepository,
    productRepository,
    storeProfileRepository,
    auditLogRepository
  }) {
    this.getBatchAlertsUseCase = getBatchAlertsUseCase;
    this.receiveDCBatchUseCase = receiveDCBatchUseCase;
    this.applyQuickMarkdownUseCase = applyQuickMarkdownUseCase;
    this.rotateShelfFefoUseCase = rotateShelfFefoUseCase;
    this.batchRepository = batchRepository;
    this.productRepository = productRepository;
    this.storeProfileRepository = storeProfileRepository;
    this.auditLogRepository = auditLogRepository;
  }

  _extractUserContext(req) {
    if (req.user) {
      return { roleCode: req.user.roleCode, storeId: req.user.storeId };
    }
    return { roleCode: null, storeId: null };
  }

  async getAllWithAlerts(req, res, next) {
    try {
      const { alertColor, status, categoryCode, search, storeId } = req.query;
      const scope = resolveStoreScope(req, storeId, { adminDefault: 'ALL' });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }

      const result = await this.getBatchAlertsUseCase.execute({
        alertColor,
        status,
        categoryCode,
        search,
        storeId: scope.storeId
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const batch = await this.batchRepository.findById(id);
      if (!batch) {
        return res.status(404).json({ success: false, message: `Lô hàng ID ${id} không tồn tại!` });
      }
      const ownership = assertStoreOwnership(req.user, batch.storeId, `lô hàng #${id}`);
      if (!ownership.ok) {
        return res.status(ownership.statusCode).json(ownership.error);
      }
      res.json({ success: true, data: batch });
    } catch (err) {
      next(err);
    }
  }

  async receiveInboundDC(req, res, next) {
    try {
      const scope = resolveStoreScope(req, req.body?.storeId, { allowAll: false, adminDefault: 1 });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }

      const { supplierId, notes, purchaseOrderId } = req.body;
      const receiptDate = req.body.receiptDate || req.body.importDate || new Date();
      const batches = Array.isArray(req.body.batches)
        ? req.body.batches
        : (req.body && req.body.productId ? [req.body] : []);

      const receivedBy = req.user ? req.user.id : (req.body.receivedBy || 1);
      const receivedByName = req.user ? req.user.fullName : (req.body.receivedByName || 'Nhân viên kho');

      const result = await this.receiveDCBatchUseCase.execute({
        supplierId,
        storeId: scope.storeId,
        receivedBy,
        receivedByName,
        receiptDate,
        notes,
        purchaseOrderId,
        batches
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lập Biên bản Từ chối Nhận hàng DC khi RSL_inbound < 70% (Mục 12.1 & Rule 7, Rule 11)
   */
  async rejectInboundDC(req, res, next) {
    try {
      const {
        productId,
        productName: rawProductName,
        batchCode,
        manufactureDate,
        importDate = new Date(),
        expiryDate,
        quantity = 0,
        reason = ''
      } = req.body;

      if (!manufactureDate || !expiryDate) {
        return res.status(400).json({
          success: false,
          message: 'Ngày sản xuất (manufactureDate) và Hạn sử dụng (expiryDate) là bắt buộc để lập biên bản từ chối nhận hàng!'
        });
      }

      const mfg = new Date(manufactureDate);
      const exp = new Date(expiryDate);
      const imp = new Date(importDate);

      const toUtcDayMs = (d) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      if (isNaN(mfg.getTime()) || isNaN(exp.getTime()) || isNaN(imp.getTime()) || toUtcDayMs(exp) <= toUtcDayMs(mfg)) {
        return res.status(400).json({
          success: false,
          message: 'Hạn sử dụng phải lớn hơn Ngày sản xuất!'
        });
      }
      if (toUtcDayMs(mfg) > toUtcDayMs(imp)) {
        return res.status(400).json({
          success: false,
          message: 'Ngày sản xuất không thể lớn hơn Ngày giao hàng!'
        });
      }

      let prodName = rawProductName || 'Sản phẩm FMCG';
      let prodSku = req.body.productSku || 'UNKNOWN';
      if (productId && this.productRepository) {
        const prod = await this.productRepository.findById(productId);
        if (prod) {
          prodName = prod.name;
          prodSku = prod.sku;
        }
      }

      const scope = resolveStoreScope(req, req.body?.storeId, { allowAll: false, adminDefault: 1 });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }

      const storeProfile = this.storeProfileRepository ? await this.storeProfileRepository.getProfile(scope.storeId) : null;
      const minRslPercent = storeProfile ? Number(storeProfile.minInboundRslPercent || 70) : 70;

      const shelfLife = new ShelfLife(mfg, exp);
      const freshnessCheck = shelfLife.validateInboundFreshness(imp, minRslPercent);

      const rejectionCode = `REJ-DC-${Date.now().toString().slice(-6)}`;
      const staffId = req.user ? req.user.id : 3;
      const staffName = req.user ? (req.user.fullName || req.user.username) : 'Nhân viên kho';

      const description =
        `[BIÊN BẢN TỪ CHỐI NHẬN HÀNG DC - RULE 7] Mã BB: ${rejectionCode} | Sản phẩm: ${prodName} (${prodSku}) | ` +
        `Lô giao: ${batchCode || 'N/A'} | SL: ${quantity} | NSX: ${mfg.toISOString().slice(0, 10)} | HSD: ${exp.toISOString().slice(0, 10)} | ` +
        `Đạt RSL: ${freshnessCheck.inboundRslPercent}% (< Chuẩn tối thiểu ${minRslPercent}%). ` +
        `${reason ? `Ghi chú: ${reason}` : 'Yêu cầu xe tải DC Biên Hòa hoàn trả về kho tổng.'}`;

      if (this.auditLogRepository) {
        await this.auditLogRepository.log({
          userId: Number(staffId),
          userName: staffName,
          action: 'REJECT_DC_INBOUND',
          entityName: 'GOODS_RECEIPTS',
          entityId: rejectionCode,
          description,
          ipAddress: req.ip || '127.0.0.1'
        });
      }

      return res.status(201).json({
        success: true,
        rejectionCode,
        message: `Đã lập và lưu Biên bản Từ chối nhận hàng DC [${rejectionCode}] vào Sổ Kiểm Toán Bất Biến (RSL đạt ${freshnessCheck.inboundRslPercent}% < ${minRslPercent}%).`,
        data: {
          rejectionCode,
          productId: productId || null,
          productName: prodName,
          productSku: prodSku,
          batchCode: batchCode || null,
          manufactureDate: mfg.toISOString().slice(0, 10),
          importDate: imp.toISOString().slice(0, 10),
          expiryDate: exp.toISOString().slice(0, 10),
          quantity: Number(quantity) || 0,
          inboundRslPercent: freshnessCheck.inboundRslPercent,
          minRequiredRslPercent: minRslPercent,
          rejectedBy: staffName,
          createdAt: new Date().toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async applyMarkdown(req, res, next) {
    try {
      const { id } = req.params;
      const existingBatch = await this.batchRepository.findById(id);
      if (existingBatch) {
        const ownership = assertStoreOwnership(req.user, existingBatch.storeId, `lô hàng #${id}`);
        if (!ownership.ok) {
          return res.status(ownership.statusCode).json(ownership.error);
        }
      }

      const percent = req.body.percent !== undefined ? req.body.percent : req.body.discountPercent;
      const managerId = req.user ? req.user.id : (req.body.managerId || null);
      const managerName = req.user ? req.user.fullName : (req.body.managerName || 'Cửa hàng trưởng');

      const result = await this.applyQuickMarkdownUseCase.execute({
        batchId: id,
        discountPercent: percent,
        managerId,
        managerName
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async confirmRotation(req, res, next) {
    try {
      const { id } = req.params;
      const existingBatch = await this.batchRepository.findById(id);
      if (existingBatch) {
        const ownership = assertStoreOwnership(req.user, existingBatch.storeId, `lô hàng #${id}`);
        if (!ownership.ok) {
          return res.status(ownership.statusCode).json(ownership.error);
        }
      }

      const staffId = req.user ? req.user.id : (req.body.staffId || null);
      const staffName = req.user ? req.user.fullName : (req.body.staffName || 'Nhân viên kho');

      const result = await this.rotateShelfFefoUseCase.execute({
        batchId: id,
        staffId,
        staffName
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAdjustments(req, res, next) {
    try {
      const scope = resolveStoreScope(req, req.query?.storeId, { adminDefault: 'ALL' });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }
      const list = await this.batchRepository.findAdjustments({
        storeId: scope.storeId,
        limit: Number(req.query?.limit || 60)
      });
      res.json({ success: true, count: list.length, data: list });
    } catch (err) {
      next(err);
    }
  }

  async recordStocktake(req, res, next) {
    try {
      const batchId = Number(req.params.id);
      const batch = await this.batchRepository.findById(batchId);
      if (!batch) {
        return res.status(404).json({ success: false, message: `Không tìm thấy lô hàng #${batchId}.` });
      }
      const ownership = assertStoreOwnership(req.user, batch.storeId, `lô hàng #${batchId}`);
      if (!ownership.ok) {
        return res.status(ownership.statusCode).json(ownership.error);
      }

      const adjustmentType = String(req.body?.adjustmentType || 'STOCKTAKE').toUpperCase().trim();
      const reason = String(req.body?.reason || '').trim();

      if (adjustmentType === 'STOCKTAKE') {
        const actualQty = Number(req.body?.actualQuantity);
        if (!Number.isInteger(actualQty) || actualQty < 0) {
          return res.status(400).json({ success: false, message: 'Số lượng thực tế kiểm kê phải là số nguyên >= 0.' });
        }
        const adj = await this.batchRepository.recordAdjustment({
          batchId,
          adjustmentType: 'STOCKTAKE',
          actualQuantity: actualQty,
          reason: reason || 'Kiểm kê tồn thực tế theo lô',
          performedBy: req.user?.id || null
        });
        if (this.auditLogRepository && adj) {
          try {
            await this.auditLogRepository.log({
              userId: req.user?.id || null,
              userName: req.user?.fullName || req.user?.username || 'Nhân viên kho',
              action: 'STOCKTAKE_ADJUST',
              entityName: 'BATCHES',
              entityId: String(batchId),
              description: `Kiểm kê lô ${batch.batchCode}: Sổ ${adj.systemQuantity} -> Thực tế ${adj.actualQuantity} (Chênh lệch ${adj.quantityDelta >= 0 ? '+' : ''}${adj.quantityDelta}). Lý do: ${adj.reason}`,
              ipAddress: req.ip || '127.0.0.1'
            });
          } catch {}
        }
        return res.status(201).json({
          success: true,
          message: `Đã ghi nhận kiểm kê lô ${batch.batchCode} (${adj.systemQuantity} → ${adj.actualQuantity}).`,
          data: adj
        });
      }

      if (adjustmentType === 'STOCK_OUT') {
        const outQty = Number(req.body?.quantity);
        if (!Number.isInteger(outQty) || outQty <= 0) {
          return res.status(400).json({ success: false, message: 'Số lượng xuất kho phải là số nguyên dương (> 0).' });
        }
        if (outQty > Number(batch.currentQuantity)) {
          return res.status(400).json({ success: false, message: `Số lượng xuất (${outQty}) vượt quá tồn lô (${batch.currentQuantity}).` });
        }
        const adj = await this.batchRepository.recordAdjustment({
          batchId,
          adjustmentType: 'STOCK_OUT',
          outboundQuantity: outQty,
          reason: reason || 'Xuất kho nội bộ',
          performedBy: req.user?.id || null
        });
        if (this.auditLogRepository && adj) {
          try {
            await this.auditLogRepository.log({
              userId: req.user?.id || null,
              userName: req.user?.fullName || req.user?.username || 'Nhân viên kho',
              action: 'STOCK_OUT_BATCH',
              entityName: 'BATCHES',
              entityId: String(batchId),
              description: `Xuất kho lô ${batch.batchCode}: -${outQty} (Còn ${adj.actualQuantity}). Lý do: ${adj.reason}`,
              ipAddress: req.ip || '127.0.0.1'
            });
          } catch {}
        }
        return res.status(201).json({
          success: true,
          message: `Đã xuất ${outQty} từ lô ${batch.batchCode} (còn ${adj.actualQuantity}).`,
          data: adj
        });
      }

      return res.status(400).json({ success: false, message: 'Loại nghiệp vụ phải là STOCKTAKE hoặc STOCK_OUT.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = BatchController;
