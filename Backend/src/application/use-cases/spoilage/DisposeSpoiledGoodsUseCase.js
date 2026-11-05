// src/application/use-cases/spoilage/DisposeSpoiledGoodsUseCase.js
const SpoilageRecord = require('../../../domain/entities/SpoilageRecord');

/**
 * Use Case: Tiêu hủy Hàng hỏng / Hết hạn & Ghi nhận Sổ Hao hụt Tài chính (Mục 14 & Rule 6)
 * Tự động tính toán chính xác giá trị tổn thất: CostLoss = QuantityDisposed * ImportPrice
 * Dữ liệu lưu trữ bất biến phục vụ quyết toán thuế TNDN và thanh tra ATTP
 */
class DisposeSpoiledGoodsUseCase {
  constructor({ spoilageRepository, batchRepository, auditLogRepository }) {
    this.spoilageRepository = spoilageRepository;
    this.batchRepository = batchRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute({
    batchId,
    quantityDisposed,
    reason = 'EXPIRED',
    notes = '',
    performedBy,
    performedByName = 'Nhân viên kho',
    approvedBy = null,
    approvedByName = null
  }) {
    if (!batchId) {
      const err = new Error('Mã lô hàng (batchId) là bắt buộc!');
      err.statusCode = 400;
      err.code = 'ERR_MISSING_BATCH_ID';
      throw err;
    }
    if (!performedBy) {
      const err = new Error('Người thực hiện lập đề xuất (performedBy) là bắt buộc!');
      err.statusCode = 400;
      err.code = 'ERR_MISSING_PERFORMER';
      throw err;
    }

    const qty = Number(quantityDisposed);
    if (isNaN(qty) || qty <= 0) {
      const err = new Error(`Số lượng tiêu hủy không hợp lệ: ${quantityDisposed}. Phải lớn hơn 0!`);
      err.statusCode = 400;
      err.code = 'ERR_INVALID_QUANTITY';
      throw err;
    }

    // 1. Kiểm tra lô hàng
    const batch = await this.batchRepository.findById(batchId);
    if (!batch) {
      const err = new Error(`Lô hàng với ID [${batchId}] không tồn tại trong hệ thống!`);
      err.statusCode = 404;
      err.code = 'ERR_BATCH_NOT_FOUND';
      throw err;
    }

    if (batch.currentQuantity < qty) {
      const err = new Error(
        `Số lượng đề xuất hủy (${qty}) vượt quá số lượng tồn hiện tại của lô ${batch.batchCode} (${batch.currentQuantity})!`
      );
      err.statusCode = 400;
      err.code = 'ERR_DISPOSAL_EXCEEDS_STOCK';
      throw err;
    }

    // Chuẩn hóa lý do tiêu hủy theo 3 nhóm chuẩn Mục 14 Đặc tả (EXPIRED, DAMAGED, SPOILED)
    const rawReason = String(reason || 'EXPIRED').toUpperCase().trim();
    const mappedReason = rawReason === 'DAMAGED_SHELF'
      ? 'DAMAGED'
      : (rawReason === 'COLD_CHAIN_FAIL' || rawReason === 'TRANSIT_DEFECT' ? 'SPOILED' : rawReason);

    // 2. Khởi tạo Entity SpoilageRecord (tự động tính CostLoss = Qty * ImportPrice)
    const isAutoApproved = approvedBy !== null && approvedBy !== undefined;
    const spoilageRecord = new SpoilageRecord({
      batchId: Number(batchId),
      disposedDate: new Date(),
      quantityDisposed: qty,
      importPrice: batch.importPrice,
      reason: mappedReason,
      notes,
      performedBy: Number(performedBy),
      approvedBy: isAutoApproved ? Number(approvedBy) : null
    });

    // 3. Thực thi Transaction SQL Server:
    // - Nếu isAutoApproved (Quản lý trực tiếp lập): Trừ kho lô hàng & Chèn vào Sổ hao hụt
    // - Nếu Chưa duyệt (Pha 1: Nhân viên lập đề xuất): Chỉ chèn vào Sổ hao hụt với approved_by = NULL, CHƯA trừ kho
    const result = await this.spoilageRepository.createSpoilageRecordTransaction({ spoilageRecord });

    // 4. Ghi nhật ký kiểm toán bất biến (Rule 11)
    if (this.auditLogRepository) {
      await this.auditLogRepository.log({
        userId: Number(performedBy),
        userName: performedByName,
        action: 'SPOILAGE_DISPOSAL',
        entityName: 'SPOILAGE_RECORDS',
        entityId: String(result.recordCode || spoilageRecord.recordCode),
        description: (
          `Lập ${isAutoApproved ? 'và duyệt tiêu hủy' : 'đề xuất tiêu hủy'} ${qty} SP từ Lô ${batch.batchCode} (Lý do: ${mappedReason}). ` +
          `Tổn thất tài chính: ${spoilageRecord.costLoss.toLocaleString('vi-VN')} đ.` +
          (approvedByName ? ` Người duyệt: ${approvedByName}.` : '')
        )
      });
    }

    return {
      success: true,
      recordId: result.id,
      recordCode: result.recordCode || spoilageRecord.recordCode,
      batchCode: batch.batchCode,
      quantityDisposed: qty,
      importPrice: batch.importPrice,
      costLoss: spoilageRecord.costLoss,
      reason: mappedReason,
      remainingInBatch: isAutoApproved ? (batch.currentQuantity - qty) : batch.currentQuantity,
      status: isAutoApproved ? ((batch.currentQuantity - qty) === 0 ? 'DISPOSED' : batch.status) : batch.status,
      message: isAutoApproved
        ? `Đã lập biên bản tiêu hủy và ghi nhận thiệt hại ${spoilageRecord.costLoss.toLocaleString('vi-VN')} đ vào Sổ hao hụt tài chính!`
        : `Đã lập đề xuất tiêu hủy lô ${batch.batchCode} (Chờ Cửa hàng trưởng phê duyệt)!`
    };
  }
}

module.exports = DisposeSpoiledGoodsUseCase;
