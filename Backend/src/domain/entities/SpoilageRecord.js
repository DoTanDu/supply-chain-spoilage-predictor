// src/domain/entities/SpoilageRecord.js
/**
 * Entity Biên bản Tiêu hủy & Sổ Hao hụt Tài chính bất biến (Rule 6)
 * CostLoss = QuantityDisposed * ImportPrice
 */
class SpoilageRecord {
  static REASONS = ['EXPIRED', 'DAMAGED', 'SPOILED'];

  constructor({
    id = null,
    recordCode = null,
    batchId,
    disposedDate = new Date(),
    quantityDisposed,
    importPrice,
    costLoss = null,
    reason = 'EXPIRED',
    notes = '',
    performedBy,
    approvedBy = null,
    createdAt = new Date()
  }) {
    if (!batchId) {
      throw new Error('Mã lô hàng (batchId) bắt buộc phải có khi lập biên bản tiêu hủy!');
    }
    if (!performedBy) {
      throw new Error('Người thực hiện lập đề xuất (performedBy) là bắt buộc!');
    }

    const qty = Number(quantityDisposed);
    const price = Number(importPrice);
    if (qty <= 0) {
      throw new Error('Số lượng tiêu hủy phải lớn hơn 0!');
    }
    if (price < 0) {
      throw new Error('Giá vốn nhập hàng không được nhỏ hơn 0!');
    }

    const reasonNormalized = String(reason || 'EXPIRED').toUpperCase();
    if (!SpoilageRecord.REASONS.includes(reasonNormalized)) {
      throw new Error(`Lý do tiêu hủy không hợp lệ: ${reason}. Chỉ chấp nhận: EXPIRED, DAMAGED, SPOILED`);
    }

    this.id = id;
    this.recordCode = recordCode || this.generateRecordCode();
    this.batchId = Number(batchId);
    this.disposedDate = new Date(disposedDate);
    this.quantityDisposed = qty;
    this.importPrice = price;
    // Tự động tính tổn thất tài chính nếu chưa cung cấp
    this.costLoss = costLoss !== null ? Number(costLoss) : Number((qty * price).toFixed(2));
    this.reason = reasonNormalized;
    this.notes = String(notes || '');
    this.performedBy = Number(performedBy);
    this.approvedBy = approvedBy ? Number(approvedBy) : null;
    this.createdAt = new Date(createdAt);
  }

  generateRecordCode() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SPOIL-${dateStr}-${rand}`;
  }

  approve(storeManagerId) {
    if (!storeManagerId) {
      throw new Error('Cần ID của Cửa hàng trưởng để ký duyệt chốt sổ hao hụt!');
    }
    this.approvedBy = Number(storeManagerId);
  }

  isApproved() {
    return this.approvedBy !== null;
  }
}

module.exports = SpoilageRecord;
