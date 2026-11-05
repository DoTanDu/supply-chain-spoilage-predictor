// src/domain/entities/PurchaseOrder.js
/**
 * Entity Đơn đặt hàng bổ sung gửi Kho tổng DC Biên Hòa (Purchase Orders)
 * Tự động tạo từ thuật toán dự báo điểm đặt hàng ROP
 */
class PurchaseOrder {
  static STATUSES = ['DRAFT', 'APPROVED', 'SUBMITTED', 'DELIVERED', 'CANCELLED'];

  constructor({
    id = null,
    orderCode = null,
    supplierId,
    createdBy,
    approvedBy = null,
    status = 'DRAFT',
    totalEstimatedCost = 0,
    expectedDeliveryDate = null,
    notes = '',
    items = [],
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    if (!supplierId || !createdBy) {
      throw new Error('Nhà cung cấp (supplierId) và Người lập đơn (createdBy) là bắt buộc!');
    }

    const statusNorm = String(status || 'DRAFT').toUpperCase();
    if (!PurchaseOrder.STATUSES.includes(statusNorm)) {
      throw new Error(`Trạng thái đơn hàng không hợp lệ: ${status}`);
    }

    this.id = id;
    this.orderCode = orderCode || this.generateOrderCode();
    this.supplierId = Number(supplierId);
    this.createdBy = Number(createdBy);
    this.approvedBy = approvedBy ? Number(approvedBy) : null;
    this.status = statusNorm;
    this.totalEstimatedCost = Number(totalEstimatedCost || 0);
    this.expectedDeliveryDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : null;
    this.notes = String(notes || '');
    this.items = Array.isArray(items) ? items : [];
    this.createdAt = new Date(createdAt);
    this.updatedAt = new Date(updatedAt);
  }

  generateOrderCode() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `PO-DC-${dateStr}-${rand}`;
  }

  addItem({
    productId,
    productName = '',
    currentStockAtOrder,
    suggestedQuantity,
    approvedQuantity = null,
    unitCost
  }) {
    const suggested = Number(suggestedQuantity);
    const approved = approvedQuantity !== null ? Number(approvedQuantity) : suggested;
    const cost = Number(unitCost);

    if (suggested <= 0) {
      throw new Error('Số lượng đề xuất đặt hàng phải lớn hơn 0!');
    }
    if (cost < 0) {
      throw new Error('Đơn giá vốn không được nhỏ hơn 0!');
    }

    const totalLineCost = Math.round(approved * cost);

    this.items.push({
      productId: Number(productId),
      productName: String(productName),
      currentStockAtOrder: Number(currentStockAtOrder),
      suggestedQuantity: suggested,
      approvedQuantity: approved,
      unitCost: cost,
      totalLineCost
    });

    this.totalEstimatedCost = this.items.reduce((sum, item) => sum + item.totalLineCost, 0);
  }

  approve(managerId) {
    if (!managerId) {
      throw new Error('Cần ID của Cửa hàng trưởng để phê duyệt đơn đặt hàng gửi DC!');
    }
    this.approvedBy = Number(managerId);
    this.status = 'APPROVED';
    this.updatedAt = new Date();
  }

  markAsSentToDC() {
    if (this.status !== 'APPROVED') {
      throw new Error('Đơn đặt hàng phải được Cửa hàng trưởng duyệt trước khi gửi về Kho tổng DC!');
    }
    this.status = 'SUBMITTED';
    this.updatedAt = new Date();
  }

  submitToDC() {
    return this.markAsSentToDC();
  }
}

module.exports = PurchaseOrder;
