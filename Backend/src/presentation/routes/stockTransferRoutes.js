// src/presentation/routes/stockTransferRoutes.js
const express = require('express');
const stockTransferRepo = require('../../infrastructure/database/repositories/SqlStockTransferRepository');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// GET /api/stock-transfers/ai-matrix - Ma trận Cân bằng Cung-Cầu 3 Chi nhánh (Pre-trained LightGBM + OR-Tools MILP)
router.get('/ai-matrix', async (req, res, next) => {
  try {
    const weather = req.query.weather || 'NORMAL';
    const isHoliday = req.query.isHoliday === 'true' || req.query.isHoliday === '1';
    const data = await stockTransferRepo.getAiSupplyChainMatrix({ weather, isHoliday });
    res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/stock-transfers/ai-inference - Kiểm thử trực tiếp Pre-trained Model (.pkl) trên tập sample_retail_dataset.csv
router.post('/ai-inference', async (req, res, next) => {
  try {
    const limit = Number(req.body?.limit || req.query?.limit || 10);
    const result = await stockTransferRepo.runLivePklInference(limit);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/stock-transfers - Danh sách phiếu điều chuyển liên cửa hàng (dbo.stock_transfers)
router.get('/', async (req, res, next) => {
  try {
    const { status, storeId } = req.query;
    const transfers = await stockTransferRepo.getAllTransfers({ status, storeId });
    res.json({
      success: true,
      count: transfers.length,
      data: transfers
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/stock-transfers - Tạo phiếu đề xuất điều chuyển liên cửa hàng (OWNER / MANAGER)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN', 'STORE_MANAGER']),
  async (req, res, next) => {
    try {
      const userId = req.user?.id || 2;
      const userRole = req.user?.roleCode || req.user?.role || 'STORE_MANAGER';
      const autoApprove = req.body.autoApprove === true && userRole === 'ADMIN';
      const created = await stockTransferRepo.createTransfer({
        ...req.body,
        requestedBy: userId,
        autoApprove
      });
      res.status(201).json({
        success: true,
        message: 'Đã khởi tạo phiếu điều chuyển liên cửa hàng thành công!',
        data: created
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/stock-transfers/:id/status - Cập nhật trạng thái điều chuyển 5 bước (PROPOSED -> APPROVED -> IN_TRANSIT -> RECEIVED / CANCELLED)
router.patch(
  '/:id/status',
  authMiddleware,
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const { status, notes } = req.body;
      const userId = req.user?.id || 1;
      const userRole = req.user?.roleCode || req.user?.role || 'STAFF';

      const updated = await stockTransferRepo.updateTransferStatus({
        id,
        status,
        userId,
        userRole,
        notes
      });
      res.json({
        success: true,
        message: `Đã cập nhật phiếu điều chuyển sang trạng thái ${status}!`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

