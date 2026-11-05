// src/presentation/controllers/StoreProfileController.js
const SqlStoreProfileRepository = require('../../infrastructure/database/repositories/SqlStoreProfileRepository');
const SqlAuditLogRepository = require('../../infrastructure/database/repositories/SqlAuditLogRepository');
const GetStoreProfileUseCase = require('../../application/use-cases/store/GetStoreProfileUseCase');
const UpdateStoreProfileUseCase = require('../../application/use-cases/store/UpdateStoreProfileUseCase');

const storeRepo = new SqlStoreProfileRepository();
const auditRepo = new SqlAuditLogRepository();
const getStoreProfileUseCase = new GetStoreProfileUseCase(storeRepo);
const updateStoreProfileUseCase = new UpdateStoreProfileUseCase(storeRepo, auditRepo);

class StoreProfileController {
  static async getProfile(req, res, next) {
    try {
      const profile = await getStoreProfileUseCase.execute();
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
      const updateData = { ...req.body };
      if (req.params?.id) {
        updateData.id = Number(req.params.id);
      }
      const ipAddress = req.ip || req.connection.remoteAddress;
      const updated = await updateStoreProfileUseCase.execute(updateData, req.user, ipAddress);
      res.json({
        success: true,
        message: `Cập nhật thông tin chi nhánh [${updated.storeCode} - ${updated.storeName}] thành công.`,
        data: updated
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
}

module.exports = StoreProfileController;
