// src/domain/entities/SaleOrder.js
const WeatherCondition = require('../value-objects/WeatherCondition');

/**
 * Entity Giao dịch Bán lẻ tại quầy POS (Bán hàng = Xuất kho FEFO)
 * Lưu trữ chi tiết các lô bị bẻ cùng ngữ cảnh ngoại cảnh
 */
class SaleOrder {
  constructor({
    transactionCode = null,
    cashierId = null,
    saleDate = new Date(),
    weather = 'NORMAL',
    isHoliday = false,
    items = []
  }) {
    this.transactionCode = transactionCode || this.generateTransactionCode();
    this.cashierId = cashierId ? Number(cashierId) : null;
    this.saleDate = new Date(saleDate);
    this.weatherCondition = new WeatherCondition(weather);
    this.weather = this.weatherCondition.value;
    this.isHoliday = Boolean(isHoliday);
    this.items = [];

    // Tự động suy ra thứ trong tuần (Monday, Tuesday...)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.dayOfWeek = days[this.saleDate.getDay()];

    if (Array.isArray(items) && items.length > 0) {
      items.forEach(item => this.addItem(item));
    }
  }

  generateTransactionCode() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `TXN-POS-${dateStr}-${rand}`;
  }

  addItem({
    productId,
    batchId,
    batchCode = '',
    productName = '',
    quantitySold,
    salePrice,
    originalPrice = null,
    discountPercent = 0
  }) {
    const qty = Number(quantitySold);
    const price = Number(salePrice);
    if (qty <= 0) {
      throw new Error('Số lượng bán của từng mặt hàng phải lớn hơn 0!');
    }
    if (price < 0) {
      throw new Error('Đơn giá bán không được nhỏ hơn 0!');
    }

    this.items.push({
      productId: Number(productId),
      batchId: Number(batchId),
      batchCode: String(batchCode),
      productName: String(productName),
      quantitySold: qty,
      salePrice: price,
      originalPrice: originalPrice !== null ? Number(originalPrice) : price,
      discountPercent: Number(discountPercent || 0),
      lineTotal: Math.round(qty * price)
    });
  }

  getTotalAmount() {
    return this.items.reduce((sum, item) => sum + item.lineTotal, 0);
  }

  getTotalQuantity() {
    return this.items.reduce((sum, item) => sum + item.quantitySold, 0);
  }
}

module.exports = SaleOrder;
