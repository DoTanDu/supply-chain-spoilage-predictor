// src/application/use-cases/batch/RotateShelfFefoUseCase.js
/**
 * Use Case: Xác nhận Hoàn tất SOP Đảo kệ 5 bước theo chuẩn FEFO (Mục 21.4 & Rule 10)
 * Lưu vết thời gian và tên nhân viên thực hiện đảo lô cận date ra mặt tiền trưng bày
 */
class RotateShelfFefoUseCase {
  constructor({ batchRepository, auditLogRepository }) {
    this.batchRepository = batchRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute({ batchId, staffId, staffName = 'Nhân viên kho' }) {
    if (!batchId) {
      throw new Error('Mã lô hàng (batchId) là bắt buộc!');
    }

    const batch = await this.batchRepository.findById(batchId);
    if (!batch) {
      const err = new Error(`Lô hàng với ID [${batchId}] không tồn tại!`);
      err.statusCode = 404;
      throw err;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(batch.expiryDate);
    exp.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0 || batch.status === 'EXPIRED' || batch.status === 'DISPOSED') {
      const err = new Error(`Lô hàng ${batch.batchCode} đã hết hạn sử dụng! Không được đảo ra mặt tiền kệ mà phải rút khỏi kệ chuyển sang khu cách ly tiêu hủy (Rule 5).`);
      err.statusCode = 400;
      err.code = 'ERR_BATCH_EXPIRED';
      throw err;
    }

    // Xác nhận đã đảo kệ
    await this.batchRepository.confirmShelfRotation(batchId);

    // Ghi nhật ký kiểm toán bất biến
    if (this.auditLogRepository) {
      await this.auditLogRepository.log({
        userId: staffId ? Number(staffId) : null,
        userName: staffName,
        action: 'ROTATE_SHELF_FEFO',
        entityName: 'BATCHES',
        entityId: String(batchId),
        description: `Xác nhận hoàn tất SOP 5 bước đảo Lô ${batch.batchCode} ra sát mép mặt tiền kệ trưng bày.`
      });
    }

    return {
      success: true,
      batchId: Number(batchId),
      batchCode: batch.batchCode,
      isShelfRotated: true,
      message: `Đã xác nhận đảo Lô ${batch.batchCode} ra mặt tiền quầy kệ theo chuẩn FEFO thành công!`
    };
  }
}

module.exports = RotateShelfFefoUseCase;
