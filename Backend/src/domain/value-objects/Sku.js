// src/domain/value-objects/Sku.js
class Sku {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('Mã SKU không được để trống.');
    }
    const trimmed = value.trim().toUpperCase();
    if (trimmed.length < 3 || trimmed.length > 50) {
      throw new Error('Mã SKU phải có độ dài từ 3 đến 50 ký tự.');
    }
    this.value = trimmed;
  }

  toString() {
    return this.value;
  }
}

module.exports = Sku;
