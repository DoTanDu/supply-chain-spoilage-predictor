// src/presentation/routes/purchaseOrderRoutes.js
/**
 * Router: Quản lý Đơn đặt hàng Bổ sung gửi DC Biên Hòa theo Mục 22.8 Đặc tả SSOT
 * GET /api/purchase-orders
 * GET /api/purchase-orders/:id
 * POST /api/purchase-orders
 * POST /api/purchase-orders/:id/send-to-dc
 * PATCH /api/purchase-orders/:id/status
 */
const express = require('express');
const { forecastController } = require('../../container');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();
const poReadGuard = roleMiddleware(['ADMIN', 'STORE_MANAGER', 'CASHIER'], {
  allowedPages: ['smart-ordering', 'inventory-management']
});
const poManageGuard = roleMiddleware(['ADMIN', 'STORE_MANAGER'], { pageKey: 'smart-ordering' });

// GET /api/purchase-orders - Danh sách đơn đặt hàng gửi DC (Mục 22.8 SSOT)
router.get('/', poReadGuard, (req, res, next) => forecastController.getAllPO(req, res, next));

// GET /api/purchase-orders/:id - Chi tiết đơn PO
router.get('/:id', poReadGuard, (req, res, next) => forecastController.getPOById(req, res, next));

// POST /api/purchase-orders - Lập đơn PO mới gửi DC Biên Hòa (Chỉ ADMIN & STORE_MANAGER)
router.post(
  '/',
  authMiddleware,
  poManageGuard,
  (req, res, next) => forecastController.createPO(req, res, next)
);

// POST /api/purchase-orders/:id/send-to-dc - Gửi đơn đặt hàng đến DC Biên Hòa (Mục 22.8 SSOT)
router.post(
  '/:id/send-to-dc',
  authMiddleware,
  poManageGuard,
  (req, res, next) => forecastController.sendPOToDC(req, res, next)
);

// PATCH /api/purchase-orders/:id/status - Cập nhật trạng thái đơn PO
router.patch(
  '/:id/status',
  authMiddleware,
  poReadGuard,
  (req, res, next) => forecastController.updatePOStatus(req, res, next)
);

module.exports = router;

