// src/application/use-cases/catalog/CreateProductUseCase.js
const Product = require('../../../domain/entities/Product');
const ProductDTO = require('../../dtos/ProductDTO');
const ProductDeduplicationService = require('../../../domain/services/ProductDeduplicationService');

class CreateProductUseCase {
  constructor(productRepository, categoryRepository, auditLogRepository) {
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(productData, currentUser, ipAddress) {
    if (!productData.sku || !productData.name) {
      throw new Error('Mã SKU và Tên sản phẩm là bắt buộc.');
    }

    if (!productData.categoryId) {
      throw new Error('Vui lòng chọn danh mục ngành hàng FMCG.');
    }

    const cost = Number(productData.costPrice || 0);
    const price = Number(productData.sellingPrice || productData.price || 0);
    if (price < cost) {
      throw new Error('Giá bán lẻ không nên nhỏ hơn giá vốn nhập hàng.');
    }

    const shelfLife = Number(productData.standardShelfLifeDays || productData.shelfLifeDays || 30);
    if (shelfLife <= 0) {
      throw new Error('Vòng đời hạn sử dụng tiêu chuẩn phải lớn hơn 0 ngày.');
    }

    // 1. Kiểm tra chống trùng lặp sản phẩm (Deduplication Check)
    const existingList = await this.productRepository.findAll();
    const existingEntities = existingList.map(item => item.entity);

    const dupCheck = ProductDeduplicationService.checkDuplicate(
      { sku: productData.sku, name: productData.name },
      existingEntities,
      0.85
    );

    if (dupCheck.isDuplicate) {
      throw new Error(`[Từ chối tạo sản phẩm] ${dupCheck.reason}`);
    }

    // 2. Tạo Entity Product
    const newProduct = new Product({
      sku: productData.sku,
      name: productData.name,
      categoryId: productData.categoryId,
      supplierId: productData.supplierId || 1,
      unit: productData.unit || 'Hộp',
      costPrice: cost,
      sellingPrice: price,
      standardShelfLifeDays: shelfLife,
      minStockLevel: Number(productData.minStockLevel || productData.reorderPoint || 15),
      maxStockLevel: Number(productData.maxStockLevel || 150),
      customWarningDays: productData.customWarningDays !== undefined ? productData.customWarningDays : null,
      imageUrl: productData.imageUrl || productData.image || '📦'
    });

    // 3. Lưu vào CSDL SQL Server
    const created = await this.productRepository.create(newProduct);

    // 4. Ghi Audit Log
    if (this.auditLogRepository && currentUser) {
      await this.auditLogRepository.log({
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'CREATE_PRODUCT',
        entityName: 'Products',
        entityId: String(created.id),
        description: `Tạo mới sản phẩm SKU: [${created.sku}] - Tên: "${created.name}" - Giá: ${created.sellingPrice} VNĐ`,
        ipAddress
      });
    }

    return ProductDTO.toResponse(created, 0);
  }
}

module.exports = CreateProductUseCase;
