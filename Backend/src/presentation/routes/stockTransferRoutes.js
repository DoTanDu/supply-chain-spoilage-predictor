// src/presentation/routes/stockTransferRoutes.js
const express = require('express');
const stockTransferRepo = require('../../infrastructure/database/repositories/SqlStockTransferRepository');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { resolveStoreScope } = require('../middlewares/storeScope');

const router = express.Router();
const transferReadGuard = roleMiddleware(['ADMIN', 'STORE_MANAGER', 'CASHIER'], { pageKey: 'stock-transfer' });
const transferManageGuard = roleMiddleware(['ADMIN', 'STORE_MANAGER'], { pageKey: 'stock-transfer' });

// GET /api/stock-transfers/ai-matrix - Ma trận Cân bằng Cung-Cầu từ SQL Server + Thời tiết & Lịch lễ thực tế
router.get('/ai-matrix', transferReadGuard, async (req, res, next) => {
  try {
    const scope = resolveStoreScope(req, req.query?.storeId, { adminDefault: 'ALL' });
    if (!scope.ok) {
      return res.status(scope.statusCode).json(scope.error);
    }

    const weather = req.query.weather || 'AUTO';
    const isHoliday = (req.query.isHoliday === undefined || req.query.isHoliday === 'auto')
      ? 'auto'
      : (req.query.isHoliday === 'true' || req.query.isHoliday === '1');
    const data = await stockTransferRepo.getAiSupplyChainMatrix({ weather, isHoliday });

    if (!scope.isOwner && data && Array.isArray(data.orToolsTransferProposals)) {
      const myStore = Number(scope.storeId);
      data.orToolsTransferProposals = data.orToolsTransferProposals.filter(
        p => Number(p.fromStoreId) === myStore || Number(p.toStoreId) === myStore
      );
    }

    res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/stock-transfers/ai-inference - Kiểm thử trực tiếp Model (.pkl) trên dữ liệu SQL Server + thời tiết Open-Meteo
// Spawn tiến trình Python nên chỉ ADMIN & STORE_MANAGER được gọi; limit là số nguyên dương có trần.
router.post('/ai-inference', transferManageGuard, async (req, res, next) => {
  try {
    const parsedLimit = Number.parseInt(req.body?.limit ?? req.query?.limit ?? 10, 10);
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 50) : 10;
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
router.get('/', transferReadGuard, async (req, res, next) => {
  try {
    const scope = resolveStoreScope(req, req.query?.storeId, { adminDefault: 'ALL' });
    if (!scope.ok) {
      return res.status(scope.statusCode).json(scope.error);
    }

    const { status } = req.query;
    const effectiveStoreId = scope.isOwner && scope.storeId === 'ALL' ? null : scope.storeId;
    const transfers = await stockTransferRepo.getAllTransfers({ status, storeId: effectiveStoreId });
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
  transferManageGuard,
  async (req, res, next) => {
    try {
      const scope = resolveStoreScope(req, req.body?.fromStoreId, { allowAll: false, adminDefault: 1 });
      if (!scope.ok) {
        return res.status(scope.statusCode).json(scope.error);
      }

      const userId = req.user?.id || 2;
      const userRole = String(req.user?.roleCode || req.user?.role || 'STORE_MANAGER').toUpperCase();
      const autoApprove = req.body.autoApprove === true && (userRole === 'ADMIN' || userRole === 'OWNER');
      const created = await stockTransferRepo.createTransfer({
        ...req.body,
        fromStoreId: req.body?.fromStoreId !== undefined ? Number(req.body.fromStoreId) : scope.storeId,
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
  transferReadGuard,
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const { status, notes } = req.body;
      const userId = req.user?.id || 1;
      const userRole = req.user?.roleCode || req.user?.role || 'CASHIER';
      const userStoreId = req.user?.storeId || null;

      const updated = await stockTransferRepo.updateTransferStatus({
        id,
        status,
        userId,
        userRole,
        userStoreId,
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

