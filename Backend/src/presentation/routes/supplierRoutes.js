// src/presentation/routes/supplierRoutes.js
/**
 * Router: Quản lý Nhà cung cấp & Trung tâm Phân phối DC theo Mục 5, Mục 6 & 17.4 Đặc tả SSOT
 * GET    /api/suppliers
 * GET    /api/suppliers/:id
 * POST   /api/suppliers
 * PUT    /api/suppliers/:id
 * DELETE /api/suppliers/:id
 */
const express = require('express');
const SupplierController = require('../controllers/SupplierController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// GET /api/suppliers
router.get('/', SupplierController.getSuppliers);

// GET /api/suppliers/:id
router.get('/:id', SupplierController.getSupplierById);

// POST /api/suppliers (Chỉ ADMIN và STORE_MANAGER được thêm NCC mới)
router.post('/', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), SupplierController.createSupplier);

// PUT /api/suppliers/:id (Chỉnh sửa thông tin NCC, Lead Time, Trạng thái)
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), SupplierController.updateSupplier);

// DELETE /api/suppliers/:id (Xóa NCC nếu chưa có sản phẩm hoặc PO liên kết)
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), SupplierController.deleteSupplier);

module.exports = router;

