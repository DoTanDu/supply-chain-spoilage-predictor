// src/presentation/routes/storeProfileRoutes.js
const express = require('express');
const StoreProfileController = require('../controllers/StoreProfileController');
const SqlStoreProfileRepository = require('../../infrastructure/database/repositories/SqlStoreProfileRepository');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();
const storeRepo = new SqlStoreProfileRepository();

// GET /api/store-profile/all (Danh sách toàn bộ các chi nhánh trong chuỗi MVP)
router.get('/all', async (req, res, next) => {
  try {
    const stores = await storeRepo.getAllStores();
    res.json({
      success: true,
      count: stores.length,
      data: stores
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/store-profile/:id (Lấy hồ sơ theo ID chi nhánh)
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return StoreProfileController.getProfile(req, res, next);
    const profile = await storeRepo.getProfile(id);
    res.json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/store-profile (Công khai hoặc mọi vai trò, mặc định chi nhánh 1)
router.get('/', StoreProfileController.getProfile);

// PUT /api/store-profile/:id (Chỉ ADMIN & STORE_MANAGER)
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), StoreProfileController.updateProfile);

// PUT /api/store-profile (Chỉ ADMIN & STORE_MANAGER)
router.put('/', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), StoreProfileController.updateProfile);

module.exports = router;
