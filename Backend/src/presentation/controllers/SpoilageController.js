// src/presentation/controllers/SpoilageController.js
const { resolveStoreScope, assertStoreOwnership, normalizeRoleCode } = require('../middlewares/storeScope');

class SpoilageController {
  constructor({ disposeSpoiledGoodsUseCase, getSpoilageLedgerUseCase, spoilageRepository, batchRepository, auditLogRepository }) {
    this.disposeSpoiledGoodsUseCase = disposeSpoiledGoodsUseCase;
    this.getSpoilageLedgerUseCase = getSpoilageLedgerUseCase;
    this.spoilageRepository = spoilageRepository;
    this.batchRepository = batchRepository || disposeSpoiledGoodsUseCase?.batchRepository;
    this.auditLogRepository = auditLogRepository;
  }

  _getBatchRepository() {
    if (!this.batchRepository && this.disposeSpoiledGoodsUseCase?.batchRepository) {
      this.batchRepository = this.disposeSpoiledGoodsUseCase.batchRepository;
    }
    return this.batchRepository;
  }

  async recordBulkDisposal(req, res, next) {
    try {
      const { items, reason = 'EXP_SPOILAGE', notes = '' } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          errorCode: 'ERR_EMPTY_ITEMS',
          message: 'Danh sách lô hàng cần tiêu hủy không được rỗng!'
        });
      }

      const scope = resolveStoreScope(req, req.body?.storeId, { allowAll: false, adminDefault: 1 });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }

      const batchRepo = this._getBatchRepository();
      if (batchRepo) {
        for (const item of items) {
          const batchId = item.batchId || item.id;
          if (!batchId) continue;
          const batch = await batchRepo.findById(batchId);
          if (batch) {
            const ownership = assertStoreOwnership(req.user, batch.storeId, `lô hàng #${batchId}`);
            if (!ownership.ok) {
              return res.status(ownership.statusCode).json(ownership.error);
            }
          }
        }
      }

      // Kiểm tra hợp lệ toàn bộ danh sách trước khi thực thi ghi nhận
      const normalizedItems = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i] || {};
        const batchId = item.batchId || item.id;
        const qty = Number(item.quantityDisposed !== undefined ? item.quantityDisposed : item.quantity);
        if (!batchId || !Number.isInteger(qty) || qty <= 0) {
          return res.status(400).json({
            success: false,
            errorCode: 'ERR_INVALID_QUANTITY',
            message: `Dòng thứ ${i + 1} không hợp lệ (batchId hoặc số lượng nguyên > 0 bị thiếu/sai).`
          });
        }
        normalizedItems.push({ ...item, batchId, qty });
      }

      const performedBy = req.user ? req.user.id : (req.body.performedBy || 3);
      const performedByName = req.user ? (req.user.fullName || req.user.username) : (req.body.performedByName || 'Nhân viên ca trực');
      const normalizedRole = normalizeRoleCode(req.user ? req.user.roleCode : '');
      const canAutoApprove = normalizedRole === 'ADMIN' || normalizedRole === 'STORE_MANAGER';
      const approvedBy = canAutoApprove ? (req.user ? req.user.id : (req.body.approvedBy || 2)) : null;
      const approvedByName = canAutoApprove ? (req.user ? (req.user.fullName || req.user.username) : 'Cửa hàng trưởng LHU Mart') : null;

      const records = [];
      let totalLoss = 0;
      let totalQuantity = 0;

      for (const item of normalizedItems) {
        const { batchId, qty } = item;

        const itemReason = item.reason || reason;
        const itemNotes = item.notes !== undefined && item.notes !== '' ? item.notes : notes;

        const record = await this.disposeSpoiledGoodsUseCase.execute({
          batchId,
          quantityDisposed: qty,
          reason: itemReason,
          notes: itemNotes,
          performedBy,
          performedByName,
          approvedBy,
          approvedByName
        });
        records.push(record);
        totalLoss += Number(record.costLoss || (qty * Number(record.importPrice || 0)));
        totalQuantity += qty;
      }

      res.status(201).json({
        success: true,
        message: `Đã lập ${canAutoApprove ? 'và duyệt tiêu hủy' : 'đề xuất tiêu hủy'} thành công ${records.length} lô hàng! Tổng tổn thất: ${totalLoss.toLocaleString('vi-VN')} đ`,
        data: {
          records,
          totalLoss,
          totalQuantity,
          isAutoApproved: canAutoApprove
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async recordDisposal(req, res, next) {
    try {
      if (Array.isArray(req.body.items) && req.body.items.length > 0) {
        return await this.recordBulkDisposal(req, res, next);
      }

      const scope = resolveStoreScope(req, req.body?.storeId, { allowAll: false, adminDefault: 1 });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }

      const { batchId, quantityDisposed, quantity, reason, notes } = req.body;
      const batchRepo = this._getBatchRepository();
      if (batchId && batchRepo) {
        const batch = await batchRepo.findById(batchId);
        if (batch) {
          const ownership = assertStoreOwnership(req.user, batch.storeId, `lô hàng #${batchId}`);
          if (!ownership.ok) {
            return res.status(ownership.statusCode).json(ownership.error);
          }
        }
      }

      const finalQty = quantityDisposed !== undefined ? quantityDisposed : quantity;
      const performedBy = req.user ? req.user.id : (req.body.performedBy || 3);
      const performedByName = req.user ? (req.user.fullName || req.user.username) : (req.body.performedByName || 'Nhân viên ca trực');

      // Tuân thủ nguyên tắc Tách biệt trách nhiệm (SoD - Mục 4 & 16 SSOT):
      // Chỉ ADMIN và STORE_MANAGER mới có thẩm quyền tự phê duyệt ngay khi lập phiếu;
      // CASHIER (Nhân viên cửa hàng) lập phiếu ở trạng thái PENDING (approvedBy = null) chờ Quản lý duyệt.
      const normalizedRole = normalizeRoleCode(req.user ? req.user.roleCode : '');
      const canAutoApprove = normalizedRole === 'ADMIN' || normalizedRole === 'STORE_MANAGER';
      const approvedBy = canAutoApprove ? (req.user ? req.user.id : (req.body.approvedBy || 2)) : null;
      const approvedByName = canAutoApprove ? (req.user ? (req.user.fullName || req.user.username) : 'Cửa hàng trưởng LHU Mart') : null;

      const result = await this.disposeSpoiledGoodsUseCase.execute({
        batchId,
        quantityDisposed: finalQty,
        reason: reason || 'EXPIRED',
        notes: notes || '',
        performedBy,
        performedByName,
        approvedBy,
        approvedByName
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async approveDisposal(req, res, next) {
    try {
      const { id } = req.params;
      const approverId = req.user ? req.user.id : 2;
      const approverName = req.user ? (req.user.fullName || req.user.username) : 'Cửa hàng trưởng';

      if (!this.spoilageRepository && this.disposeSpoiledGoodsUseCase?.spoilageRepository) {
        this.spoilageRepository = this.disposeSpoiledGoodsUseCase.spoilageRepository;
      }
      if (!this.auditLogRepository && this.disposeSpoiledGoodsUseCase?.auditLogRepository) {
        this.auditLogRepository = this.disposeSpoiledGoodsUseCase.auditLogRepository;
      }

      if (typeof this.spoilageRepository.findRecordByIdOrCode === 'function') {
        const existing = await this.spoilageRepository.findRecordByIdOrCode(id);
        if (!existing) {
          return res.status(404).json({
            success: false,
            message: `Không tìm thấy biên bản tiêu hủy [${id}] để phê duyệt.`
          });
        }
        const ownership = assertStoreOwnership(req.user, existing.storeId, `biên bản tiêu hủy [${id}]`);
        if (!ownership.ok) {
          return res.status(ownership.statusCode).json(ownership.error);
        }
      }

      const updated = await this.spoilageRepository.approveRecord(id, approverId);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy biên bản tiêu hủy [${id}] để phê duyệt.`
        });
      }

      if (this.auditLogRepository && !updated.alreadyApproved) {
        await this.auditLogRepository.log({
          userId: approverId,
          userName: approverName,
          action: 'APPROVE_SPOILAGE',
          entityName: 'SPOILAGE_RECORDS',
          entityId: String(updated.recordCode || id),
          description: `[Phê duyệt tiêu hủy] ${approverName} (${req.user?.roleCode}) đã ký duyệt biên bản tiêu hủy [${updated.recordCode || id}] và chốt Sổ hao hụt tài chính.`
        });
      }

      res.json({
        success: true,
        message: updated.alreadyApproved
          ? `Biên bản tiêu hủy [${updated.recordCode || id}] đã được phê duyệt trước đó.`
          : `Đã phê duyệt biên bản tiêu hủy [${updated.recordCode || id}] và chốt Sổ hao hụt tài chính!`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  async getLedger(req, res, next) {
    try {
      const limit = Number(req.query.limit || 50);
      const { startDate, endDate, storeId: requestedStoreId } = req.query;
      const scope = resolveStoreScope(req, requestedStoreId, { adminDefault: 'ALL' });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }

      const result = await this.getSpoilageLedgerUseCase.execute({
        limit,
        startDate: startDate || null,
        endDate: endDate || null,
        storeId: scope.storeId
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getLossSummary(req, res, next) {
    try {
      const scope = resolveStoreScope(req, req.query?.storeId, { adminDefault: 'ALL' });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }

      if (!this.spoilageRepository && this.getSpoilageLedgerUseCase?.spoilageRepository) {
        this.spoilageRepository = this.getSpoilageLedgerUseCase.spoilageRepository;
      }
      const { startDate, endDate } = req.query;
      const summary = await this.spoilageRepository.getLossSummary(
        startDate || null,
        endDate || null,
        scope.storeId
      );
      res.json({
        success: true,
        data: summary
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SpoilageController;
