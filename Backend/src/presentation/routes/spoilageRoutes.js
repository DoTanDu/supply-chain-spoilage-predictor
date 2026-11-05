// src/presentation/routes/spoilageRoutes.js
const express = require('express');
const { spoilageController } = require('../../container');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// POST /api/spoilage - Ghi nhận / Đề xuất tiêu hủy hàng hết hạn/hư hỏng (Mục 4 & 16 SSOT: Cả 3 vai trò đều được lập đề xuất)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER', 'CASHIER']),
  (req, res, next) => spoilageController.recordDisposal(req, res, next)
);
router.post(
  '/dispose',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER', 'CASHIER']),
  (req, res, next) => spoilageController.recordDisposal(req, res, next)
);

// PATCH /api/spoilage/:id/approve - Phê duyệt biên bản tiêu hủy & chốt Sổ hao hụt (Mục 4.2 & 16 SSOT: Chỉ ADMIN & STORE_MANAGER)
router.patch(
  '/:id/approve',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER']),
  (req, res, next) => spoilageController.approveDisposal(req, res, next)
);

// GET /api/spoilage/ledger hoặc /records - Tra cứu Sổ Hao hụt Tài chính bất biến (Mục 22.7 SSOT)
router.get('/ledger', (req, res, next) => spoilageController.getLedger(req, res, next));
router.get('/records', (req, res, next) => spoilageController.getLedger(req, res, next));
router.get('/loss-summary', (req, res, next) => spoilageController.getLossSummary(req, res, next));
router.get('/', (req, res, next) => spoilageController.getLedger(req, res, next));

module.exports = router;
