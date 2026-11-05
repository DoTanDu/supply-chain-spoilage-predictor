// src/presentation/routes/salesRoutes.js
const express = require('express');
const { salesController } = require('../../container');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// POST /api/sales - Thanh toán bán lẻ tại quầy POS, tự động bẻ lô theo chuẩn FEFO (Chỉ ADMIN, STORE_MANAGER, CASHIER)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER', 'CASHIER']),
  (req, res, next) => salesController.processSale(req, res, next)
);
router.post(
  '/checkout',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER', 'CASHIER']),
  (req, res, next) => salesController.processSale(req, res, next)
);

// GET /api/sales/history - Tra cứu lịch sử bán hàng và tổng kết doanh số hôm nay
router.get('/history', (req, res, next) => salesController.getHistory(req, res, next));
router.get('/', (req, res, next) => salesController.getHistory(req, res, next));

// GET /api/sales/receipt/:txnCode - Truy vấn chi tiết hóa đơn POS & In lại hóa đơn (Mục 22.6 SSOT)
router.get('/receipt/:txnCode', (req, res, next) => salesController.getReceipt(req, res, next));

module.exports = router;
