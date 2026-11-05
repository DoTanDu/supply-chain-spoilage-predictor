// src/presentation/routes/shiftHandoverRoutes.js
/**
 * Router: Quản lý Ca trực & Bàn giao ca làm việc (Mục 15 Đặc tả SSOT)
 * Quy trình bàn giao 4 bước & 3 Chế tài kỷ luật (Mục 15.1 - 15.5 SSOT)
 */
const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { shiftHandoverController } = require('../../container');

const router = express.Router();

// GET /api/shift-handover/summary - Lấy dữ liệu ca trực thời gian thực phục vụ đối soát tự động (Mục 15.1 SSOT)
router.get('/summary', (req, res, next) => shiftHandoverController.getSummary(req, res, next));

// GET /api/shift-handover/history - Lấy danh sách lịch sử bàn giao ca trực (Mục 15.4 SSOT)
router.get('/history', (req, res, next) => shiftHandoverController.getHistory(req, res, next));

// POST /api/shift-handover - Lưu và ký xác nhận điện tử biên bản bàn giao ca (Yêu cầu đăng nhập - Mục 15.1 SSOT)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER', 'CASHIER']),
  (req, res, next) => shiftHandoverController.submitHandover(req, res, next)
);

module.exports = router;
