// src/domain/value-objects/Money.js
/**
 * Value Object xử lý tiền tệ Việt Nam Đồng (VND)
 * Đảm bảo làm tròn số nguyên không phát sinh số thập phân lẻ trong bán lẻ
 */
class Money {
  constructor(amount, currency = 'VND') {
    const num = Number(amount);
    if (isNaN(num) || num < 0) {
      throw new Error('Số tiền không hợp lệ hoặc không được âm.');
    }
    this.amount = Math.round(num);
    this.currency = currency;
  }

  format() {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(this.amount);
  }

  formatVND() {
    return this.format();
  }

  add(otherMoney) {
    const otherAmount = otherMoney instanceof Money ? otherMoney.amount : Number(otherMoney);
    return new Money(this.amount + otherAmount, this.currency);
  }

  subtract(otherMoney) {
    const otherAmount = otherMoney instanceof Money ? otherMoney.amount : Number(otherMoney);
    if (this.amount < otherAmount) {
      throw new Error('Không thể trừ số tiền lớn hơn số tiền hiện có (âm tiền)!');
    }
    return new Money(this.amount - otherAmount, this.currency);
  }

  multiply(factor) {
    return new Money(Math.round(this.amount * Number(factor)), this.currency);
  }

  valueOf() {
    return this.amount;
  }

  toString() {
    return `${this.amount.toLocaleString('vi-VN')} đ`;
  }
}

module.exports = Money;
