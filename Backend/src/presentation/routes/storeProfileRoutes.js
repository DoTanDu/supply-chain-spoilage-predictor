// src/presentation/routes/storeProfileRoutes.js
const express = require('express');
const StoreProfileController = require('../controllers/StoreProfileController');
const SqlStoreProfileRepository = require('../../infrastructure/database/repositories/SqlStoreProfileRepository');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { resolveStoreScope } = require('../middlewares/storeScope');

const router = express.Router();
const storeRepo = new SqlStoreProfileRepository();

// GET /api/store-profile/all (Danh sách chi nhánh trong phạm vi quyền truy cập)
router.get('/all', authMiddleware, async (req, res, next) => {
  try {
    const scope = resolveStoreScope(req, req.query?.storeId, { adminDefault: 'ALL' });
    if (!scope.ok) {
      return res.status(scope.statusCode).json(scope.error);
    }

    const stores = await storeRepo.getAllStores();
    const activeStores = stores.filter(s => String(s.status || 'OPEN').toUpperCase() !== 'SUSPENDED');
    const scopedStores = scope.isOwner
      ? (scope.storeId === 'ALL' ? stores : stores.filter(s => Number(s.id) === Number(scope.storeId)))
      : stores.filter(s => Number(s.id) === Number(scope.storeId));

    res.json({
      success: true,
      count: scopedStores.length,
      chainStoreCount: activeStores.length,
      isSingleStore: activeStores.length <= 1,
      data: scopedStores
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/store-profile/enterprise - Cấu hình Doanh nghiệp & Kho trung tâm tùy chọn
router.get('/enterprise', authMiddleware, StoreProfileController.getEnterpriseConfig);

// PUT /api/store-profile/enterprise - Chỉ OWNER/ADMIN cập nhật cấu hình doanh nghiệp
router.put('/enterprise', authMiddleware, roleMiddleware(['ADMIN']), StoreProfileController.updateEnterpriseConfig);

// GET /api/store-profile/:id (Lấy hồ sơ theo ID chi nhánh - Cô lập BOLA theo storeId)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return StoreProfileController.getProfile(req, res, next);
    const scope = resolveStoreScope(req, id, { allowAll: false, adminDefault: 1 });
    if (!scope.ok) {
      return res.status(scope.statusCode).json(scope.error);
    }
    const profile = await storeRepo.getProfile(scope.storeId);
    res.json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/store-profile (Trả về hồ sơ chi nhánh thuộc quyền người dùng, ADMIN mặc định Chi nhánh 1)
router.get('/', authMiddleware, StoreProfileController.getProfile);

// POST /api/store-profile (Chỉ ADMIN/OWNER được phép tạo chi nhánh mới)
router.post('/', authMiddleware, roleMiddleware(['ADMIN']), StoreProfileController.createProfile);

// PUT /api/store-profile/:id (ADMIN & STORE_MANAGER hoặc nhân sự được cấp quyền trang store-management)
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER'], { pageKey: 'store-management', grantUnlocksRole: true }), StoreProfileController.updateProfile);

// PUT /api/store-profile (ADMIN & STORE_MANAGER hoặc nhân sự được cấp quyền trang store-management)
router.put('/', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER'], { pageKey: 'store-management', grantUnlocksRole: true }), StoreProfileController.updateProfile);

module.exports = router;
