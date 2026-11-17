// src/presentation/routes/batchRoutes.js
const express = require('express');
const { batchController } = require('../../container');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();
const inventoryGuard = roleMiddleware(['ADMIN', 'STORE_MANAGER', 'CASHIER'], { pageKey: 'inventory-management' });
const spoilageReadGuard = roleMiddleware(['ADMIN', 'STORE_MANAGER', 'CASHIER'], { pageKey: 'spoilage-alerts' });
const spoilageManageGuard = roleMiddleware(['ADMIN', 'STORE_MANAGER'], { pageKey: 'spoilage-alerts' });

// GET /api/batches - Danh sách lô hàng kèm cảnh báo 3 cấp màu
router.get('/', inventoryGuard, (req, res, next) => batchController.getAllWithAlerts(req, res, next));

// GET /api/batches/alerts-3-colors - Cảnh báo hạn dùng 3 cấp màu
router.get('/alerts-3-colors', spoilageReadGuard, (req, res, next) => batchController.getAllWithAlerts(req, res, next));

// GET /api/batches/adjustments - Lịch sử kiểm kê & xuất kho
router.get('/adjustments', inventoryGuard, (req, res, next) => batchController.getAdjustments(req, res, next));

// GET /api/batches/:id - Chi tiết 1 lô hàng
router.get('/:id', inventoryGuard, (req, res, next) => batchController.getById(req, res, next));

// POST /api/batches/receive-inbound - Tiếp nhận hàng nhập (RSL >= 70%)
router.post('/receive-inbound', authMiddleware, inventoryGuard, (req, res, next) => batchController.receiveInboundDC(req, res, next));
router.post('/inbound', authMiddleware, inventoryGuard, (req, res, next) => batchController.receiveInboundDC(req, res, next));
router.post('/', authMiddleware, inventoryGuard, (req, res, next) => batchController.receiveInboundDC(req, res, next));

// POST /api/batches/reject-inbound - Lập Biên bản Từ chối Nhận hàng khi RSL < 70%
router.post('/reject-inbound', authMiddleware, inventoryGuard, (req, res, next) => batchController.rejectInboundDC(req, res, next));

// POST /api/batches/:id/stocktake - Kiểm kê hoặc Xuất kho theo lô
router.post('/:id/stocktake', authMiddleware, inventoryGuard, (req, res, next) => batchController.recordStocktake(req, res, next));

// PATCH /api/batches/:id/discount - Quick Markdown (Chỉ OWNER & MANAGER)
router.patch('/:id/discount', authMiddleware, spoilageManageGuard, (req, res, next) => batchController.applyMarkdown(req, res, next));

// PATCH /api/batches/:id/rotate - Đảo lô cận hạn ra trước theo FEFO
router.patch('/:id/rotate', authMiddleware, spoilageReadGuard, (req, res, next) => batchController.confirmRotation(req, res, next));

module.exports = router;
