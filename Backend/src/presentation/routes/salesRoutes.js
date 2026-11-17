// src/presentation/routes/salesRoutes.js
const express = require('express');
const { salesController } = require('../../container');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// GET /api/sales/csv-template - Tải file mẫu chuẩn Excel/CSV POS
router.get('/csv-template', (req, res, next) => salesController.getCsvTemplate(req, res, next));

// POST /api/sales/validate-csv - Kiểm tra và đánh giá chất lượng file CSV/Excel trước khi nhập (Phụ lục A1 PDF)
router.post('/validate-csv', (req, res, next) => salesController.validateCsv(req, res, next));

// POST /api/sales/import-csv - Nhập chính thức các giao dịch hợp lệ vào CSDL sales_history bằng Transaction SQL
router.post(
  '/import-csv',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER', 'CASHIER']),
  (req, res, next) => salesController.importCsv(req, res, next)
);

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
