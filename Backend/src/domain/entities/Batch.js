// src/domain/entities/Batch.js
const ShelfLife = require('../value-objects/ShelfLife');
const AlertLevel = require('../value-objects/AlertLevel');

/**
 * Entity Quản lý Lô hàng & Vòng đời hạn sử dụng (Shelf-Life Management)
 * Trọng tâm thực thi nguyên tắc FEFO và kiểm soát 3 vùng màu
 */
class Batch {
  constructor({
    id = null,
    receiptId = null,
    batchCode,
    productId,
    importDate,
    manufactureDate,
    expiryDate,
    initialQuantity,
    currentQuantity = null,
    importPrice,
    discountPercent = 0,
    status = 'ACTIVE',
    isShelfRotated = false,
    createdAt = new Date()
  }) {
    if (!batchCode || !productId) {
      throw new Error('Mã lô hàng (batchCode) và Sản phẩm (productId) là bắt buộc!');
    }
    if (initialQuantity <= 0) {
      throw new Error('Số lượng ban đầu (initialQuantity) phải lớn hơn 0!');
    }
    if (importPrice < 0) {
      throw new Error('Giá nhập (importPrice) không được nhỏ hơn 0!');
    }

    this.id = id;
    this.receiptId = receiptId;
    this.batchCode = String(batchCode).trim();
    this.productId = Number(productId);
    this.importDate = new Date(importDate);
    this.manufactureDate = new Date(manufactureDate);
    this.expiryDate = new Date(expiryDate);
    this.initialQuantity = Number(initialQuantity);
    this.currentQuantity = currentQuantity !== null ? Number(currentQuantity) : this.initialQuantity;
    this.importPrice = Number(importPrice);
    this.discountPercent = Number(discountPercent || 0);
    this.status = status || 'ACTIVE';
    this.isShelfRotated = Boolean(isShelfRotated);
    this.createdAt = new Date(createdAt);

    // Khởi tạo Value Object ShelfLife để tính toán ngày
    this.shelfLife = new ShelfLife(this.manufactureDate, this.expiryDate);

    // Kiểm tra Rule 3 & Rule 5 ngay khi khởi tạo
    if (this.currentQuantity < 0) {
      throw new Error(`Tồn kho âm không hợp lệ cho lô ${this.batchCode}: ${this.currentQuantity}`);
    }
    if (this.shelfLife.getDaysLeft() <= 0 && this.status !== 'DISPOSED') {
      this.status = AlertLevel.EXPIRED;
    }
  }

  getDaysLeft() {
    return this.shelfLife.getDaysLeft();
  }

  getRslPercent() {
    return this.shelfLife.getRslPercent();
  }

  getAlertLevel(warningDays = 7) {
    return this.shelfLife.evaluateAlertLevel(warningDays);
  }

  /**
   * Kiểm tra lô hàng có đủ điều kiện bán lẻ tại quầy POS không (Rule 5)
   */
  isAvailableForSale() {
    return (
      this.currentQuantity > 0 &&
      this.getDaysLeft() > 0 &&
      this.status !== 'EXPIRED' &&
      this.status !== 'DISPOSED'
    );
  }

  /**
   * Khấu trừ số lượng tồn kho (Rule 3: Chống tồn kho âm)
   * @param {number} quantity Số lượng cần xuất bán
   */
  deductQuantity(quantity) {
    const qty = Number(quantity);
    if (qty <= 0) {
      throw new Error('Số lượng xuất kho phải lớn hơn 0!');
    }
    if (this.currentQuantity < qty) {
      throw new Error(`Lô ${this.batchCode} không đủ tồn kho! Hiện có: ${this.currentQuantity}, Yêu cầu xuất: ${qty}`);
    }
    if (!this.isAvailableForSale()) {
      throw new Error(`Lô ${this.batchCode} đã hết hạn hoặc không khả dụng để xuất bán POS!`);
    }

    this.currentQuantity -= qty;
    return this.currentQuantity;
  }

  /**
   * Kích hoạt giảm giá xả hàng Quick Markdown (Rule 10: 15%, 30%, 40%, 50%)
   */
  applyQuickMarkdown(percent) {
    const validPercents = [0, 15, 30, 40, 50];
    const pct = Number(percent);
    if (!validPercents.includes(pct)) {
      throw new Error(`Mức giảm giá không hợp lệ: ${percent}%. Chỉ chấp nhận: 15%, 30%, 40%, 50%`);
    }
    if (this.getDaysLeft() <= 0) {
      throw new Error('Không thể áp dụng giảm giá xả hàng cho lô đã hết hạn!');
    }

    this.discountPercent = pct;
    if (pct > 0) {
      this.status = 'WARNING';
    }
  }

  /**
   * Xác nhận hoàn tất quy trình 5 bước đảo kệ mặt tiền (Rule 10)
   */
  confirmShelfRotation() {
    this.isShelfRotated = true;
  }

  /**
   * Tính đơn giá bán lẻ sau chiết khấu xả hàng
   * @param {number} baseSellingPrice Giá bán niêm yết của sản phẩm
   */
  calculateEffectivePrice(baseSellingPrice) {
    const base = Number(baseSellingPrice);
    if (this.discountPercent <= 0) return base;
    return Math.round(base * (1.0 - (this.discountPercent / 100.0)));
  }

  /**
   * Tiêu hủy lô hàng hỏng/quá hạn (Rule 6)
   */
  dispose(quantityToDispose) {
    const qty = Number(quantityToDispose);
    if (qty <= 0 || qty > this.currentQuantity) {
      throw new Error(`Số lượng tiêu hủy không hợp lệ: ${qty}. Tồn hiện tại: ${this.currentQuantity}`);
    }
    this.currentQuantity -= qty;
    if (this.currentQuantity === 0) {
      this.status = 'DISPOSED';
    }
  }
}

module.exports = Batch;
