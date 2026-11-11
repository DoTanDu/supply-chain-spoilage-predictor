// src/presentation/controllers/SpoilageController.js
class SpoilageController {
  constructor({ disposeSpoiledGoodsUseCase, getSpoilageLedgerUseCase, spoilageRepository, auditLogRepository }) {
    this.disposeSpoiledGoodsUseCase = disposeSpoiledGoodsUseCase;
    this.getSpoilageLedgerUseCase = getSpoilageLedgerUseCase;
    this.spoilageRepository = spoilageRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async recordDisposal(req, res, next) {
    try {
      const { batchId, quantityDisposed, quantity, reason, notes } = req.body;
      const finalQty = quantityDisposed !== undefined ? quantityDisposed : quantity;
      const performedBy = req.user ? req.user.id : (req.body.performedBy || 3);
      const performedByName = req.user ? (req.user.fullName || req.user.username) : (req.body.performedByName || 'Nhân viên ca trực');

      // Tuân thủ nguyên tắc Tách biệt trách nhiệm (SoD - Mục 4 & 16 SSOT):
      // Chỉ ADMIN và STORE_MANAGER mới có thẩm quyền tự phê duyệt ngay khi lập phiếu;
      // CASHIER (Nhân viên cửa hàng) lập phiếu ở trạng thái PENDING (approvedBy = null) chờ Quản lý duyệt.
      const userRole = req.user ? req.user.roleCode : '';
      const canAutoApprove = userRole === 'ADMIN' || userRole === 'STORE_MANAGER';
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

      const updated = await this.spoilageRepository.approveRecord(id, approverId);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy biên bản tiêu hủy [${id}] để phê duyệt.`
        });
      }

      if (this.auditLogRepository) {
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
        message: `Đã phê duyệt biên bản tiêu hủy [${updated.recordCode || id}] và chốt Sổ hao hụt tài chính!`,
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
      const userRole = String(req.user?.roleCode || '').toUpperCase();
      const userStoreId = Number(req.user?.storeId || 1);

      if (requestedStoreId && userRole && userRole !== 'ADMIN' && userRole !== 'OWNER') {
        if (String(requestedStoreId).toUpperCase() === 'ALL' || Number(requestedStoreId) !== userStoreId) {
          return res.status(403).json({
            success: false,
            errorCode: 'ERR_STORE_SCOPE_FORBIDDEN',
            message: `Phạm vi dữ liệu bị từ chối: Bạn chỉ được phép truy cập dữ liệu của Chi nhánh #${userStoreId}!`
          });
        }
      }
      const effectiveStoreId = (userRole === 'ADMIN' || userRole === 'OWNER')
        ? (requestedStoreId || 'ALL')
        : (requestedStoreId || userStoreId);

      const result = await this.getSpoilageLedgerUseCase.execute({
        limit,
        startDate: startDate || null,
        endDate: endDate || null,
        storeId: effectiveStoreId
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getLossSummary(req, res, next) {
    try {
      if (!this.spoilageRepository && this.getSpoilageLedgerUseCase?.spoilageRepository) {
        this.spoilageRepository = this.getSpoilageLedgerUseCase.spoilageRepository;
      }
      const summary = await this.spoilageRepository.getLossSummary();
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
