// src/application/dtos/ProductDTO.js
class ProductDTO {
  static toResponse(productEntity, totalStock = 0) {
    return {
      id: productEntity.id,
      sku: productEntity.sku,
      name: productEntity.name,
      normalizedName: productEntity.normalizedName,
      category: productEntity.categoryName || 'FMCG',
      categoryId: productEntity.categoryId,
      supplier: productEntity.supplierName || 'Kho DC Biên Hòa',
      supplierId: productEntity.supplierId,
      unit: productEntity.unit,
      costPrice: productEntity.costPrice,
      price: productEntity.sellingPrice,
      sellingPrice: productEntity.sellingPrice,
      shelfLifeDays: productEntity.standardShelfLifeDays,
      standardShelfLifeDays: productEntity.standardShelfLifeDays,
      reorderPoint: productEntity.minStockLevel,
      minStockLevel: productEntity.minStockLevel,
      maxStockLevel: productEntity.maxStockLevel,
      safetyStock: Math.round(productEntity.minStockLevel * 0.4),
      customWarningDays: productEntity.customWarningDays,
      categoryDefaultWarningDays: productEntity.categoryDefaultWarningDays || 7,
      effectiveWarningDays: productEntity.getEffectiveWarningDays(productEntity.categoryDefaultWarningDays || 7),
      storageTemperature: productEntity.storageTemperature || 'Nhiệt độ phòng (25°C)',
      image: productEntity.imageUrl || '📦',
      imageUrl: productEntity.imageUrl,
      totalStock: totalStock,
      isActive: productEntity.isActive
    };
  }

  static fromEntity(productEntity, totalStock = 0) {
    return this.toResponse(productEntity, totalStock);
  }
}

module.exports = ProductDTO;
