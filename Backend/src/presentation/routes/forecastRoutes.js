// src/presentation/routes/forecastRoutes.js
const express = require('express');
const { forecastController } = require('../../container');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();
const aiForecastGuard = roleMiddleware(['ADMIN', 'STORE_MANAGER'], {
  allowedPages: ['ai-forecast', 'smart-ordering'],
  grantUnlocksRole: true
});
const reorderReadGuard = roleMiddleware(['ADMIN', 'STORE_MANAGER', 'CASHIER'], {
  allowedPages: ['smart-ordering', 'ai-forecast', 'inventory-management']
});
const reorderManageGuard = roleMiddleware(['ADMIN', 'STORE_MANAGER'], { pageKey: 'smart-ordering' });

// GET /api/forecast/environment - Thời tiết & lịch lễ thực tế (Open-Meteo + Nager.Date VN)
router.get('/environment', (req, res, next) => forecastController.getEnvironment(req, res, next));

// GET /api/forecast/rop - Dự báo 7 ngày & Điểm đặt hàng (ROP)
router.get('/rop', aiForecastGuard, (req, res, next) => forecastController.getROPForecast(req, res, next));
router.get('/risk-analysis', aiForecastGuard, (req, res, next) => forecastController.getROPForecast(req, res, next));
router.get('/', aiForecastGuard, (req, res, next) => forecastController.getROPForecast(req, res, next));

// POST /api/forecast/snapshot - Lưu kết quả dự báo vào dbo.ai_forecasts để kiểm chứng
router.post('/snapshot', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER'], { allowedPages: ['ai-forecast', 'smart-ordering'] }), (req, res, next) => forecastController.saveSnapshot(req, res, next));

// Purchase Orders (Quản lý đơn đặt hàng gửi DC Biên Hòa)
router.get('/purchase-orders', reorderReadGuard, (req, res, next) => forecastController.getAllPO(req, res, next));
router.get('/purchase-orders/:id', reorderReadGuard, (req, res, next) => forecastController.getPOById(req, res, next));

// POST /api/forecast/purchase-orders (Tạo PO gửi DC, chỉ ADMIN & STORE_MANAGER)
router.post(
  '/purchase-orders',
  authMiddleware,
  reorderManageGuard,
  (req, res, next) => forecastController.createPO(req, res, next)
);

// POST /api/forecast/purchase-orders/:id/send-to-dc - Gửi đơn đặt hàng đến DC Biên Hòa (Mục 22.8 SSOT)
router.post(
  '/purchase-orders/:id/send-to-dc',
  authMiddleware,
  reorderManageGuard,
  (req, res, next) => forecastController.sendPOToDC(req, res, next)
);

// PATCH /api/forecast/purchase-orders/:id/status (Phê duyệt/Cập nhật trạng thái PO, cho phép Nhân viên cửa hàng xác nhận DELIVERED khi nhận hàng)
router.patch(
  '/purchase-orders/:id/status',
  authMiddleware,
  reorderReadGuard,
  (req, res, next) => forecastController.updatePOStatus(req, res, next)
);

module.exports = router;
