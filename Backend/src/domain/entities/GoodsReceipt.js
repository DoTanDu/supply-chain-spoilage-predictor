// src/domain/entities/GoodsReceipt.js
const ShelfLife = require('../value-objects/ShelfLife');

/**
 * Entity Phiếu tiếp nhận hàng từ Trung tâm Phân phối DC Biên Hòa (Rule 7)
 */
class GoodsReceipt {
  constructor({
    id = null,
    receiptNumber,
    supplierId,
    supplierName = '',
    receivedBy,
    receivedByName = '',
    receiptDate = new Date(),
    totalCost = 0,
    status = 'COMPLETED',
    notes = '',
    batches = [],
    createdAt = new Date()
  }) {
    if (!receiptNumber || !supplierId || !receivedBy) {
      throw new Error('Số phiếu (receiptNumber), Nhà cung cấp (supplierId) và Người tiếp nhận (receivedBy) là bắt buộc.');
    }

    this.id = id ? Number(id) : null;
    this.receiptNumber = String(receiptNumber).trim();
    this.supplierId = Number(supplierId);
    this.supplierName = String(supplierName || '');
    this.receivedBy = Number(receivedBy);
    this.receivedByName = String(receivedByName || '');
    this.receiptDate = new Date(receiptDate);
    this.totalCost = Number(totalCost) || 0;
    this.status = String(status || 'COMPLETED').toUpperCase();
    this.notes = String(notes || '');
    this.batches = Array.isArray(batches) ? batches : [];
    this.createdAt = new Date(createdAt);
  }

  addBatch(batch) {
    this.batches.push(batch);
    this.recalculateTotalCost();
  }

  getTotalQuantity() {
    return this.batches.reduce((sum, b) => {
      const qty = Number(b.initialQuantity || b.initial_quantity || b.currentQuantity || b.current_quantity || 0);
      return sum + qty;
    }, 0);
  }

  recalculateTotalCost() {
    this.totalCost = this.batches.reduce((sum, b) => {
      const qty = Number(b.initialQuantity || b.initial_quantity || 0);
      const price = Number(b.importPrice || b.import_price || 0);
      return sum + (qty * price);
    }, 0);
    return this.totalCost;
  }

  /**
   * Kiểm định tiêu chuẩn chất lượng tiếp nhận xe tải DC (Rule 7: RSL >= 70%)
   * @param {number} minRslPercent Ngưỡng RSL tối thiểu (mặc định 70%)
   * @returns {Object} Kết quả kiểm định freshness toàn bộ đợt hàng
   */
  validateInboundFreshness(minRslPercent = 70.0) {
    const rejectedBatches = [];
    const acceptedBatches = [];

    for (const b of this.batches) {
      const mfg = new Date(b.manufactureDate || b.manufacture_date);
      const exp = new Date(b.expiryDate || b.expiry_date);
      const imp = new Date(b.importDate || b.import_date || this.receiptDate);

      const shelfLife = new ShelfLife(mfg, exp, imp);
      const check = shelfLife.validateInboundFreshness(imp, minRslPercent);

      if (!check.isAcceptable) {
        rejectedBatches.push({
          batchCode: b.batchCode || b.batch_code,
          productId: b.productId || b.product_id,
          rslPercent: check.inboundRsl,
          minRslPercent: check.minRslPercent,
          remainingDays: check.remainingDays,
          totalDays: check.totalDays,
          reason: `RSL Inbound chỉ đạt ${check.inboundRsl}%, thấp hơn ngưỡng tối thiểu ${minRslPercent}% của cửa hàng`
        });
      } else {
        acceptedBatches.push({
          batchCode: b.batchCode || b.batch_code,
          rslPercent: check.inboundRsl
        });
      }
    }

    return {
      isAcceptable: rejectedBatches.length === 0,
      totalBatchesChecked: this.batches.length,
      acceptedCount: acceptedBatches.length,
      rejectedCount: rejectedBatches.length,
      rejectedBatches,
      acceptedBatches
    };
  }
}

module.exports = GoodsReceipt;
