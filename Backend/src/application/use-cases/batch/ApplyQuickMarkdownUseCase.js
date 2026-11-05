// src/application/use-cases/batch/ApplyQuickMarkdownUseCase.js
const MarkdownPricingPolicy = require('../../../domain/services/MarkdownPricingPolicy');

/**
 * Use Case: Kích hoạt Giảm giá Xả hàng Quick Markdown (Mục 21.3 & Rule 10)
 * Áp dụng 4 mức chiết khấu: 15%, 30%, 40%, 50%
 * Giá khuyến mãi lập tức có hiệu lực tại quầy POS
 */
class ApplyQuickMarkdownUseCase {
  constructor({ batchRepository, auditLogRepository }) {
    this.batchRepository = batchRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute({ batchId, discountPercent, managerId, managerName = 'Cửa hàng trưởng' }) {
    if (!batchId) {
      throw new Error('Mã lô hàng (batchId) là bắt buộc!');
    }
    const pct = Number(discountPercent);
    if (!MarkdownPricingPolicy.isAllowedPercent(pct)) {
      const err = new Error(`Mức giảm giá không hợp lệ: ${discountPercent}%. Chỉ chấp nhận: 0%, 15%, 30%, 40%, 50%`);
      err.statusCode = 400;
      err.code = 'ERR_INVALID_MARKDOWN';
      throw err;
    }

    const batch = await this.batchRepository.findById(batchId);
    if (!batch) {
      const err = new Error(`Lô hàng với ID [${batchId}] không tồn tại!`);
      err.statusCode = 404;
      throw err;
    }

    // Kiểm tra lô hàng đã hết hạn chưa (DaysLeft <= 0 không được bán/giảm)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(batch.expiryDate);
    exp.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0 || batch.status === 'EXPIRED' || batch.status === 'DISPOSED') {
      const err = new Error(`Lô hàng ${batch.batchCode} đã hết hạn sử dụng hoặc đã tiêu hủy! Bắt buộc khóa cứng bán POS và lập biên bản tiêu hủy.`);
      err.statusCode = 400;
      err.code = 'ERR_BATCH_EXPIRED';
      throw err;
    }

    // Cập nhật mức giảm giá vào CSDL
    await this.batchRepository.updateDiscount(batchId, pct);

    // Ghi nhật ký kiểm toán bất biến (Rule 11)
    if (this.auditLogRepository) {
      const actionDesc = pct > 0
        ? `Kích hoạt Quick Markdown giảm ${pct}% cho Lô ${batch.batchCode} (HSD còn ${daysLeft} ngày).`
        : `Hủy giảm giá xả hàng, đưa Lô ${batch.batchCode} về nguyên giá niêm yết.`;

      await this.auditLogRepository.log({
        userId: managerId ? Number(managerId) : null,
        userName: managerName,
        action: 'QUICK_MARKDOWN',
        entityName: 'BATCHES',
        entityId: String(batchId),
        description: actionDesc
      });
    }

    return {
      success: true,
      batchId: Number(batchId),
      batchCode: batch.batchCode,
      discountPercent: pct,
      status: pct > 0 ? 'WARNING' : 'ACTIVE',
      message: `Đã áp dụng giảm giá ${pct}% cho lô ${batch.batchCode}. Giá khuyến mãi đã có hiệu lực tại POS!`
    };
  }
}

module.exports = ApplyQuickMarkdownUseCase;
