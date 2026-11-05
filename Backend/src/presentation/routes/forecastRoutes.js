// src/presentation/routes/forecastRoutes.js
const express = require('express');
const { forecastController } = require('../../container');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// GET /api/forecast/rop - Dự báo Điểm đặt hàng bổ sung (ROP) kết hợp Thời tiết & Ngày lễ & Cảnh báo DOS > DUE
router.get('/rop', (req, res, next) => forecastController.getROPForecast(req, res, next));
router.get('/risk-analysis', (req, res, next) => forecastController.getROPForecast(req, res, next));
router.get('/', (req, res, next) => forecastController.getROPForecast(req, res, next));

// Purchase Orders (Quản lý đơn đặt hàng gửi DC Biên Hòa)
router.get('/purchase-orders', (req, res, next) => forecastController.getAllPO(req, res, next));
router.get('/purchase-orders/:id', (req, res, next) => forecastController.getPOById(req, res, next));

// POST /api/forecast/purchase-orders (Tạo PO gửi DC, chỉ ADMIN & STORE_MANAGER)
router.post(
  '/purchase-orders',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER']),
  (req, res, next) => forecastController.createPO(req, res, next)
);

// POST /api/forecast/purchase-orders/:id/send-to-dc - Gửi đơn đặt hàng đến DC Biên Hòa (Mục 22.8 SSOT)
router.post(
  '/purchase-orders/:id/send-to-dc',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER']),
  (req, res, next) => forecastController.sendPOToDC(req, res, next)
);

// PATCH /api/forecast/purchase-orders/:id/status (Phê duyệt/Cập nhật trạng thái PO, cho phép Nhân viên cửa hàng xác nhận DELIVERED khi nhận hàng)
router.patch(
  '/purchase-orders/:id/status',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER', 'CASHIER']),
  (req, res, next) => forecastController.updatePOStatus(req, res, next)
);

module.exports = router;
