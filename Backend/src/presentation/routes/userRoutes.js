// src/presentation/routes/userRoutes.js
/**
 * Router: Quản lý Người dùng & Nhân sự theo Mục 22.2 Đặc tả SSOT
 * GET /api/users
 * GET /api/users/:id
 * POST /api/users
 * PUT /api/users/:id
 * DELETE /api/users/:id
 */
const express = require('express');
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// GET /api/users - Danh sách người dùng (Chỉ ADMIN & STORE_MANAGER)
router.get('/', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), AuthController.getUsers);

// GET /api/users/:id - Chi tiết 1 người dùng (Chỉ ADMIN & STORE_MANAGER)
router.get('/:id', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), AuthController.getUserById);

// POST /api/users - Tạo tài khoản nhân sự mới (Chỉ ADMIN)
router.post('/', authMiddleware, roleMiddleware(['ADMIN']), AuthController.createUser);

// PUT /api/users/:id - Cập nhật người dùng (Chỉ ADMIN)
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN']), AuthController.updateUser);

// DELETE /api/users/:id - Xóa/Vô hiệu hóa người dùng (Chỉ ADMIN)
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), AuthController.deleteUser);

// PATCH /api/users/:id/status - Khóa/Mở khóa tài khoản (Chỉ ADMIN)
router.patch('/:id/status', authMiddleware, roleMiddleware(['ADMIN']), AuthController.toggleUserStatus);

// POST /api/users/:id/reset-password - Đặt lại mật khẩu (Chỉ ADMIN)
router.post('/:id/reset-password', authMiddleware, roleMiddleware(['ADMIN']), AuthController.resetPassword);

module.exports = router;

