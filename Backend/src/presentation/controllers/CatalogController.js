// src/presentation/controllers/CatalogController.js
const SqlCategoryRepository = require('../../infrastructure/database/repositories/SqlCategoryRepository');
const SqlProductRepository = require('../../infrastructure/database/repositories/SqlProductRepository');
const SqlBatchRepository = require('../../infrastructure/database/repositories/SqlBatchRepository');
const SqlAuditLogRepository = require('../../infrastructure/database/repositories/SqlAuditLogRepository');

const GetCategoriesUseCase = require('../../application/use-cases/catalog/GetCategoriesUseCase');
const GetProductsUseCase = require('../../application/use-cases/catalog/GetProductsUseCase');
const CreateProductUseCase = require('../../application/use-cases/catalog/CreateProductUseCase');
const ProductDeduplicationService = require('../../domain/services/ProductDeduplicationService');
const ProductDTO = require('../../application/dtos/ProductDTO');

const categoryRepo = new SqlCategoryRepository();
const productRepo = new SqlProductRepository();
const batchRepo = new SqlBatchRepository();
const auditRepo = new SqlAuditLogRepository();

const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepo);
const getProductsUseCase = new GetProductsUseCase(productRepo);
const createProductUseCase = new CreateProductUseCase(productRepo, categoryRepo, auditRepo);

class CatalogController {
  static async getCategories(req, res, next) {
    try {
      const categories = await getCategoriesUseCase.execute();
      res.json({
        success: true,
        data: categories
      });
    } catch (err) {
      next(err);
    }
  }

  static async createCategory(req, res, next) {
    try {
      const { code, name, storageTemperature, defaultWarningDays, description } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Tên ngành hàng không được để trống.' });
      }

      // Tự động sinh mã code nếu chưa có
      const cleanCode = (code && code.trim()) ? code.trim().toUpperCase() : name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20);

      // Kiểm tra trùng mã code
      const existing = await categoryRepo.findByCode(cleanCode);
      if (existing) {
        return res.status(400).json({ success: false, message: `Mã ngành hàng "${cleanCode}" đã tồn tại trên hệ thống.` });
      }

      const created = await categoryRepo.create({
        code: cleanCode,
        name: name.trim(),
        storageTemperature: storageTemperature || 'Nhiệt độ phòng (25°C)',
        defaultWarningDays: Number(defaultWarningDays) || 7,
        description: description || ''
      });

      if (auditRepo) {
        try {
          const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
          await auditRepo.log({
            userId: req.user ? req.user.id : null,
            userName: req.user ? (req.user.fullName || req.user.username) : 'Quản trị viên',
            action: 'CREATE_CATEGORY',
            entityName: 'categories',
            entityId: String(created.id),
            description: `Tạo mới ngành hàng FMCG #${created.id} [${created.code}] "${created.name}" - Nhiệt độ: ${created.storageTemperature}, Cảnh báo: ${created.defaultWarningDays} ngày`,
            ipAddress
          });
        } catch (auditErr) {
          console.warn('Ghi nhận AuditLog thất bại:', auditErr.message);
        }
      }

      res.status(201).json({
        success: true,
        message: `Tạo mới ngành hàng "${created.name}" thành công.`,
        data: created
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const existing = await categoryRepo.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy ngành hàng.' });
      }

      if (updateData.code && updateData.code.trim().toUpperCase() !== existing.code) {
        const dup = await categoryRepo.findByCode(updateData.code.trim().toUpperCase());
        if (dup && Number(dup.id) !== Number(id)) {
          return res.status(400).json({ success: false, message: `Mã ngành hàng "${updateData.code}" đã bị trùng lặp.` });
        }
        updateData.code = updateData.code.trim().toUpperCase();
      }

      const updated = await categoryRepo.update(id, updateData);

      if (auditRepo) {
        try {
          const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
          await auditRepo.log({
            userId: req.user ? req.user.id : null,
            userName: req.user ? (req.user.fullName || req.user.username) : 'Quản trị viên',
            action: 'UPDATE_CATEGORY',
            entityName: 'categories',
            entityId: String(id),
            description: `Cập nhật ngành hàng #${id} [${updated.code}] "${updated.name}" - Nhiệt độ: ${updated.storageTemperature}, Cảnh báo: ${updated.defaultWarningDays} ngày`,
            ipAddress
          });
        } catch (auditErr) {
          console.warn('Ghi nhận AuditLog thất bại:', auditErr.message);
        }
      }

      res.json({
        success: true,
        message: `Cập nhật ngành hàng "${updated.name}" thành công.`,
        data: updated
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await categoryRepo.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy ngành hàng.' });
      }

      await categoryRepo.delete(id);

      if (auditRepo) {
        try {
          const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
          await auditRepo.log({
            userId: req.user ? req.user.id : null,
            userName: req.user ? (req.user.fullName || req.user.username) : 'Quản trị viên',
            action: 'DELETE_CATEGORY',
            entityName: 'categories',
            entityId: String(id),
            description: `Xóa ngành hàng #${id} - Mã: [${existing.code}] "${existing.name}"`,
            ipAddress
          });
        } catch (auditErr) {
          console.warn('Ghi nhận AuditLog thất bại:', auditErr.message);
        }
      }

      res.json({
        success: true,
        message: `Đã xóa ngành hàng "${existing.name}".`
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getProducts(req, res, next) {
    try {
      const products = await getProductsUseCase.execute();
      res.json({
        success: true,
        data: products
      });
    } catch (err) {
      next(err);
    }
  }

  static async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productRepo.findById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: `Không tìm thấy sản phẩm ID [${id}]!` });
      }
      res.json({
        success: true,
        data: ProductDTO.toResponse(product, product.totalStock || 0)
      });
    } catch (err) {
      next(err);
    }
  }

  static async createProduct(req, res, next) {
    try {
      const productData = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const created = await createProductUseCase.execute(productData, req.user, ipAddress);
      res.status(201).json({
        success: true,
        message: `Tạo mới sản phẩm "${created.name}" thành công.`,
        data: created
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  static async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const existing = await productRepo.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
      }

      if (updateData.sellingPrice !== undefined && updateData.costPrice !== undefined) {
        if (Number(updateData.sellingPrice) < Number(updateData.costPrice)) {
          return res.status(400).json({ success: false, message: 'Giá bán lẻ không được nhỏ hơn giá vốn nhập kho!' });
        }
      }

      // Kiểm tra chống trùng lặp sản phẩm (Rule 9 SSOT: trùng SKU hoặc tên tương đồng >= 85% với sản phẩm khác)
      if (updateData.sku !== undefined || updateData.name !== undefined) {
        const allItems = await productRepo.findAll();
        const otherEntities = allItems
          .map(item => item.entity)
          .filter(ent => Number(ent.id) !== Number(id));

        const dupCheck = ProductDeduplicationService.checkDuplicate(
          {
            sku: updateData.sku !== undefined ? updateData.sku : existing.sku,
            name: updateData.name !== undefined ? updateData.name : existing.name
          },
          otherEntities,
          0.85
        );

        if (dupCheck.isDuplicate) {
          return res.status(400).json({
            success: false,
            message: `[Từ chối cập nhật sản phẩm - Rule 9] ${dupCheck.reason}`
          });
        }
      }

      // Kiểm tra Toàn vẹn Lô hàng (Batch Integrity - Mục 6 SSOT) khi cố ý ngừng kinh doanh (isActive = false)
      if (updateData.isActive !== undefined && (updateData.isActive === false || updateData.isActive === 0 || updateData.isActive === 'false')) {
        const availableBatches = await batchRepo.findAvailableByProductIdFefo(id);
        if (availableBatches && availableBatches.length > 0) {
          const totalStock = availableBatches.reduce((sum, b) => sum + (Number(b.currentQuantity) || 0), 0);
          return res.status(400).json({
            success: false,
            message: `[Vi phạm Toàn vẹn Lô hàng - Mục 6 SSOT] Không thể ngừng kinh doanh sản phẩm "${existing.name}" vì hiện đang còn ${totalStock.toLocaleString('vi-VN')} đơn vị tồn kho khả dụng (thuộc ${availableBatches.length} lô hàng còn hạn). Vui lòng xả bán hết hoặc lập phiếu tiêu hủy thanh lý tồn kho trước khi ngừng kinh doanh!`
          });
        }
      }

      const updated = await productRepo.update(id, updateData);

      if (auditRepo) {
        try {
          const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
          await auditRepo.log({
            userId: req.user ? req.user.id : null,
            userName: req.user ? (req.user.fullName || req.user.username) : 'Quản trị viên',
            action: 'UPDATE_PRODUCT',
            entityName: 'products',
            entityId: String(id),
            description: `Cập nhật sản phẩm #${id} [${updated.sku}] "${updated.name}" - Giá vốn: ${updated.costPrice}đ, Giá bán: ${updated.sellingPrice}đ`,
            ipAddress
          });
        } catch (auditErr) {
          console.warn('Ghi nhận AuditLog thất bại:', auditErr.message);
        }
      }

      res.json({
        success: true,
        message: `Cập nhật sản phẩm "${updated.name}" thành công.`,
        data: ProductDTO.toResponse(updated)
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await productRepo.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
      }

      // Kiểm tra Toàn vẹn Lô hàng (Batch Integrity - Mục 6 SSOT)
      const availableBatches = await batchRepo.findAvailableByProductIdFefo(id);
      if (availableBatches && availableBatches.length > 0) {
        const totalStock = availableBatches.reduce((sum, b) => sum + (Number(b.currentQuantity) || 0), 0);
        return res.status(400).json({
          success: false,
          message: `[Vi phạm Toàn vẹn Lô hàng - Mục 6 SSOT] Không thể ngừng kinh doanh sản phẩm "${existing.name}" vì hiện đang còn ${totalStock.toLocaleString('vi-VN')} đơn vị tồn kho khả dụng (thuộc ${availableBatches.length} lô hàng còn hạn). Vui lòng xả bán hết hoặc lập phiếu tiêu hủy thanh lý tồn kho trước khi ngừng kinh doanh!`
        });
      }

      await productRepo.update(id, { isActive: false });

      if (auditRepo) {
        try {
          const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
          await auditRepo.log({
            userId: req.user ? req.user.id : null,
            userName: req.user ? (req.user.fullName || req.user.username) : 'Quản trị viên',
            action: 'DELETE_PRODUCT',
            entityName: 'products',
            entityId: String(id),
            description: `Ngừng kinh doanh (Soft Delete) sản phẩm #${id} - SKU: [${existing.sku}] "${existing.name}"`,
            ipAddress
          });
        } catch (auditErr) {
          console.warn('Ghi nhận AuditLog thất bại:', auditErr.message);
        }
      }

      res.json({
        success: true,
        message: `Đã ngừng kinh doanh sản phẩm "${existing.name}".`
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = CatalogController;
