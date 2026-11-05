// src/presentation/routes/batchRoutes.js
const express = require('express');
const { batchController } = require('../../container');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// GET /api/batches - Lấy danh sách lô hàng kèm cảnh báo 3 cấp màu (View SQL Server)
router.get('/', (req, res, next) => batchController.getAllWithAlerts(req, res, next));

// GET /api/batches/alerts-3-colors - Cảnh báo hạn dùng 3 cấp màu (Mục 22.5 SSOT)
router.get('/alerts-3-colors', (req, res, next) => batchController.getAllWithAlerts(req, res, next));

// GET /api/batches/:id - Chi tiết 1 lô hàng
router.get('/:id', (req, res, next) => batchController.getById(req, res, next));

// POST /api/batches/receive-inbound hoặc POST /api/batches/inbound - Tiếp nhận đợt hàng DC (RSL >= 70%)
router.post(
  '/receive-inbound',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF', 'CASHIER']),
  (req, res, next) => batchController.receiveInboundDC(req, res, next)
);
router.post(
  '/inbound',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF', 'CASHIER']),
  (req, res, next) => batchController.receiveInboundDC(req, res, next)
);
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF', 'CASHIER']),
  (req, res, next) => batchController.receiveInboundDC(req, res, next)
);

// POST /api/batches/reject-inbound - Lập Biên bản Từ chối Nhận hàng DC khi RSL < 70%
router.post(
  '/reject-inbound',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF', 'CASHIER']),
  (req, res, next) => batchController.rejectInboundDC(req, res, next)
);

// PATCH /api/batches/:id/discount - Kích hoạt Quick Markdown 15%, 30%, 40%, 50% (Chỉ ADMIN & STORE_MANAGER)
router.patch(
  '/:id/discount',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER']),
  (req, res, next) => batchController.applyMarkdown(req, res, next)
);

// PATCH /api/batches/:id/rotate - Xác nhận hoàn tất SOP Đảo kệ mặt tiền theo FEFO
router.patch(
  '/:id/rotate',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF', 'CASHIER']),
  (req, res, next) => batchController.confirmRotation(req, res, next)
);

module.exports = router;
