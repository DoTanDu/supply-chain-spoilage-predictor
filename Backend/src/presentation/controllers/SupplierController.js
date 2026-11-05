// src/presentation/controllers/SupplierController.js
/**
 * Controller: Quản lý Nhà cung cấp & Trung tâm Phân phối DC theo Mục 5, Mục 6 & 17.4 Đặc tả SSOT
 */
const SqlSupplierRepository = require('../../infrastructure/database/repositories/SqlSupplierRepository');
const SqlAuditLogRepository = require('../../infrastructure/database/repositories/SqlAuditLogRepository');

const supplierRepo = new SqlSupplierRepository();
const auditRepo = new SqlAuditLogRepository();

class SupplierController {
  static async getSuppliers(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true' || req.query.includeInactive === '1';
      const suppliers = await supplierRepo.findAll({ includeInactive });
      res.json({
        success: true,
        count: suppliers.length,
        data: suppliers
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSupplierById(req, res, next) {
    try {
      const { id } = req.params;
      const supplier = await supplierRepo.findById(id);
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy nhà cung cấp với ID [${id}].`
        });
      }
      res.json({
        success: true,
        data: supplier
      });
    } catch (err) {
      next(err);
    }
  }

  static async createSupplier(req, res, next) {
    try {
      const { code, name, contactName, phone, email, address, leadTimeDays, isActive } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tên nhà cung cấp / Trung tâm phân phối không được để trống.'
        });
      }

      let finalCode = (code || '').trim().toUpperCase();
      if (!finalCode) {
        finalCode = `SUP-${Date.now().toString().slice(-6)}`;
      }

      const existing = await supplierRepo.findByCode(finalCode);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Mã nhà cung cấp "${finalCode}" đã tồn tại trong hệ thống.`
        });
      }

      const newSupplier = await supplierRepo.create({
        code: finalCode,
        name: name.trim(),
        contactName: contactName ? contactName.trim() : '',
        phone: phone ? phone.trim() : '',
        email: email ? email.trim() : '',
        address: address ? address.trim() : '',
        leadTimeDays: Math.max(1, Number(leadTimeDays) || 1),
        isActive: isActive !== undefined ? Boolean(isActive) : true
      });

      try {
        const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
        await auditRepo.log({
          userId: req.user ? req.user.id : null,
          userName: req.user ? (req.user.fullName || req.user.username) : 'Quản trị viên',
          action: 'CREATE_SUPPLIER',
          entityName: 'suppliers',
          entityId: String(newSupplier.id),
          description: `Thêm nhà cung ứng mới [${newSupplier.code}] "${newSupplier.name}" - Lead Time: ${newSupplier.leadTimeDays} ngày`,
          ipAddress
        });
      } catch (auditErr) {
        console.warn('Ghi nhận AuditLog CREATE_SUPPLIER thất bại:', auditErr.message);
      }

      res.status(201).json({
        success: true,
        message: `Tạo mới nhà cung cấp "${newSupplier.name}" thành công.`,
        data: newSupplier
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async updateSupplier(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existing = await supplierRepo.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy nhà cung cấp với ID [${id}].`
        });
      }

      if (updateData.code && updateData.code.trim().toUpperCase() !== existing.code) {
        const dup = await supplierRepo.findByCode(updateData.code.trim().toUpperCase());
        if (dup && Number(dup.id) !== Number(id)) {
          return res.status(400).json({
            success: false,
            message: `Mã nhà cung cấp "${updateData.code}" đã bị trùng lặp.`
          });
        }
        updateData.code = updateData.code.trim().toUpperCase();
      }

      if (updateData.leadTimeDays !== undefined) {
        const lt = Number(updateData.leadTimeDays);
        if (isNaN(lt) || lt < 1) {
          return res.status(400).json({
            success: false,
            message: 'Thời gian giao hàng tiêu chuẩn (Lead Time) phải lớn hơn hoặc bằng 1 ngày.'
          });
        }
      }

      const updated = await supplierRepo.update(id, updateData);

      try {
        const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
        await auditRepo.log({
          userId: req.user ? req.user.id : null,
          userName: req.user ? (req.user.fullName || req.user.username) : 'Quản trị viên',
          action: 'UPDATE_SUPPLIER',
          entityName: 'suppliers',
          entityId: String(id),
          description: `Cập nhật thông tin nhà cung ứng #${id} [${updated.code}] "${updated.name}" - Lead Time: ${updated.leadTimeDays} ngày, Trạng thái: ${updated.isActive ? 'Hoạt động' : 'Tạm ngưng'}`,
          ipAddress
        });
      } catch (auditErr) {
        console.warn('Ghi nhận AuditLog UPDATE_SUPPLIER thất bại:', auditErr.message);
      }

      res.json({
        success: true,
        message: `Cập nhật nhà cung cấp "${updated.name}" thành công.`,
        data: updated
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async deleteSupplier(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await supplierRepo.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy nhà cung cấp với ID [${id}].`
        });
      }

      await supplierRepo.delete(id);

      try {
        const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
        await auditRepo.log({
          userId: req.user ? req.user.id : null,
          userName: req.user ? (req.user.fullName || req.user.username) : 'Quản trị viên',
          action: 'DELETE_SUPPLIER',
          entityName: 'suppliers',
          entityId: String(id),
          description: `Xóa nhà cung ứng #${id} [${existing.code}] "${existing.name}" khỏi hệ thống`,
          ipAddress
        });
      } catch (auditErr) {
        console.warn('Ghi nhận AuditLog DELETE_SUPPLIER thất bại:', auditErr.message);
      }

      res.json({
        success: true,
        message: `Đã xóa nhà cung ứng [${existing.code}] "${existing.name}" thành công.`
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = SupplierController;

