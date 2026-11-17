// src/presentation/controllers/StoreProfileController.js
const SqlStoreProfileRepository = require('../../infrastructure/database/repositories/SqlStoreProfileRepository');
const SqlAuditLogRepository = require('../../infrastructure/database/repositories/SqlAuditLogRepository');
const GetStoreProfileUseCase = require('../../application/use-cases/store/GetStoreProfileUseCase');
const CreateStoreProfileUseCase = require('../../application/use-cases/store/CreateStoreProfileUseCase');
const UpdateStoreProfileUseCase = require('../../application/use-cases/store/UpdateStoreProfileUseCase');
const SqlConnection = require('../../infrastructure/database/sqlConnection');
const ensureSmartSupplySchema = require('../../infrastructure/database/ensureSmartSupplySchema');
const { resolveStoreScope } = require('../middlewares/storeScope');

const storeRepo = new SqlStoreProfileRepository();
const auditRepo = new SqlAuditLogRepository();
const getStoreProfileUseCase = new GetStoreProfileUseCase(storeRepo);
const createStoreProfileUseCase = new CreateStoreProfileUseCase(storeRepo, auditRepo);
const updateStoreProfileUseCase = new UpdateStoreProfileUseCase(storeRepo, auditRepo);

class StoreProfileController {
  static async createProfile(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
      const created = await createStoreProfileUseCase.execute(req.body || {}, req.user, ipAddress);
      res.status(201).json({
        success: true,
        message: `Đã khởi tạo chi nhánh mới [${created.storeCode} - ${created.storeName}] thành công.`,
        data: created
      });
    } catch (err) {
      res.status(err.statusCode || 400).json({
        success: false,
        code: err.code,
        message: err.message
      });
    }
  }
  static async getProfile(req, res, next) {
    try {
      const requestedId = req.params?.id || req.query?.storeId;
      const scope = resolveStoreScope(req, requestedId, { allowAll: false, adminDefault: 1 });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }

      const profile = await getStoreProfileUseCase.execute(scope.storeId);
      res.json({
        success: true,
        data: profile
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const requestedTargets = [req.params?.id, req.body?.id, req.body?.storeId, req.query?.storeId]
        .filter(v => v !== undefined && v !== null && String(v).trim() !== '');
      for (const candidate of requestedTargets) {
        const check = resolveStoreScope(req, candidate, { allowAll: false, adminDefault: 1 });
        if (!check.ok) {
          return res.status(check.statusCode).json(check.error);
        }
      }
      if (
        req.params?.id !== undefined &&
        req.body?.id !== undefined &&
        String(req.body.id).trim() !== '' &&
        Number(req.params.id) !== Number(req.body.id)
      ) {
        return res.status(400).json({
          success: false,
          message: `Mã chi nhánh trong đường dẫn (${req.params.id}) không khớp với dữ liệu gửi lên (${req.body.id}).`
        });
      }
      const primaryScope = resolveStoreScope(req, requestedTargets[0], { allowAll: false, adminDefault: 1 });
      if (!primaryScope.ok) {
        return res.status(primaryScope.statusCode).json(primaryScope.error);
      }

      const updateData = { ...req.body, id: primaryScope.storeId };
      const ipAddress = req.ip || req.connection.remoteAddress;
      const updated = await updateStoreProfileUseCase.execute(updateData, req.user, ipAddress);
      res.json({
        success: true,
        message: `Cập nhật thông tin chi nhánh [${updated.storeCode} - ${updated.storeName}] thành công.`,
        data: updated
      });
    } catch (err) {
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message
      });
    }
  }

  static async getEnterpriseConfig(req, res, next) {
    try {
      await ensureSmartSupplySchema();
      const rows = await SqlConnection.queryJson(`
        SELECT TOP 1
          id,
          enterprise_name AS enterpriseName,
          CAST(has_central_warehouse AS BIT) AS hasCentralWarehouse,
          central_warehouse_name AS centralWarehouseName,
          CAST(manager_po_approval_limit AS FLOAT) AS managerPoApprovalLimit,
          updated_at AS updatedAt
        FROM dbo.enterprise_config
        WHERE id = 1;
      `);
      const cfg = rows[0] || {
        id: 1,
        enterpriseName: 'SmartSupply AI Retail Chain',
        hasCentralWarehouse: true,
        centralWarehouseName: 'Kho trung tâm (DC)',
        managerPoApprovalLimit: 5000000
      };
      res.json({ success: true, data: cfg });
    } catch (err) {
      next(err);
    }
  }

  static async updateEnterpriseConfig(req, res, next) {
    try {
      await ensureSmartSupplySchema();
      const {
        enterpriseName,
        hasCentralWarehouse,
        centralWarehouseName,
        managerPoApprovalLimit
      } = req.body || {};

      const cleanName = String(enterpriseName || 'SmartSupply AI Retail Chain').trim();
      if (!cleanName) {
        return res.status(400).json({ success: false, message: 'Tên doanh nghiệp không được để trống.' });
      }
      const hasDcBit = hasCentralWarehouse === false || hasCentralWarehouse === 0 || hasCentralWarehouse === 'false' ? 0 : 1;
      const cleanDcName = String(centralWarehouseName || 'Kho trung tâm (DC)').trim() || 'Kho trung tâm (DC)';
      const limitVal = Number(managerPoApprovalLimit);
      if (!Number.isFinite(limitVal) || limitVal < 0) {
        return res.status(400).json({ success: false, message: 'Hạn mức duyệt PO của Manager phải >= 0.' });
      }

      await SqlConnection.executeSql(`
        UPDATE dbo.enterprise_config
        SET enterprise_name = ${SqlConnection.escapeSql(cleanName)},
            has_central_warehouse = ${hasDcBit},
            central_warehouse_name = ${SqlConnection.escapeSql(cleanDcName)},
            manager_po_approval_limit = ${limitVal},
            updated_at = GETDATE()
        WHERE id = 1;
      `);

      if (auditRepo) {
        try {
          await auditRepo.log({
            userId: req.user?.id || null,
            userName: req.user?.fullName || req.user?.username || 'OWNER',
            action: 'UPDATE_ENTERPRISE_CONFIG',
            entityName: 'enterprise_config',
            entityId: '1',
            description: `Cập nhật cấu hình chuỗi [${cleanName}] | Kho trung tâm: ${hasDcBit ? cleanDcName : 'Không dùng'} | Hạn mức Manager PO: ${limitVal.toLocaleString('vi-VN')} đ`,
            ipAddress: req.ip || '127.0.0.1'
          });
        } catch {}
      }

      const rows = await SqlConnection.queryJson(`
        SELECT TOP 1
          id,
          enterprise_name AS enterpriseName,
          CAST(has_central_warehouse AS BIT) AS hasCentralWarehouse,
          central_warehouse_name AS centralWarehouseName,
          CAST(manager_po_approval_limit AS FLOAT) AS managerPoApprovalLimit,
          updated_at AS updatedAt
        FROM dbo.enterprise_config
        WHERE id = 1;
      `);
      res.json({
        success: true,
        message: 'Đã cập nhật cấu hình doanh nghiệp & chuỗi cung ứng.',
        data: rows[0]
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = StoreProfileController;
