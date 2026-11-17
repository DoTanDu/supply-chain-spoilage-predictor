// src/domain/entities/Product.js
class Product {
  constructor({
    id,
    sku,
    name,
    normalizedName,
    categoryId,
    categoryName,
    supplierId,
    supplierName,
    unit = 'Hộp',
    costPrice = 0,
    sellingPrice = 0,
    standardShelfLifeDays,
    packSize = 1,
    minStockLevel = 15,
    maxStockLevel = 150,
    customWarningDays = null,
    categoryDefaultWarningDays = 7,
    storageTemperature = 'Nhiệt độ phòng (25°C)',
    imageUrl = null,
    isActive = true,
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.sku = (sku || '').trim().toUpperCase();
    this.name = (name || '').trim();
    this.normalizedName = normalizedName || Product.normalize(this.name);
    this.categoryId = Number(categoryId);
    this.categoryName = categoryName;
    this.supplierId = Number(supplierId);
    this.supplierName = supplierName;
    this.unit = unit;
    this.costPrice = Number(costPrice) || 0;
    this.sellingPrice = Number(sellingPrice) || 0;
    this.standardShelfLifeDays = Number(standardShelfLifeDays);
    this.packSize = Math.max(1, Number(packSize) || 1);
    this.minStockLevel = Number(minStockLevel) || 15;
    this.maxStockLevel = Number(maxStockLevel) || 150;
    this.customWarningDays = customWarningDays !== null && customWarningDays !== undefined ? Number(customWarningDays) : null;
    this.categoryDefaultWarningDays = Number(categoryDefaultWarningDays) || 7;
    this.storageTemperature = storageTemperature || 'Nhiệt độ phòng (25°C)';
    this.imageUrl = imageUrl;
    this.isActive = Boolean(isActive);
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt;
  }

  static normalize(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  getEffectiveWarningDays(categoryDefaultWarningDays = 7) {
    if (this.customWarningDays !== null && this.customWarningDays !== undefined) {
      return this.customWarningDays;
    }
    return categoryDefaultWarningDays;
  }
}

module.exports = Product;
