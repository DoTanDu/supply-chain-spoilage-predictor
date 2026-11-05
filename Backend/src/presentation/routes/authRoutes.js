// src/presentation/routes/authRoutes.js
const express = require('express');
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// POST /api/auth/login
router.post('/login', AuthController.login);

// POST /api/auth/logout (Đăng xuất & Ghi nhật ký kiểm toán - Mục 22.1 SSOT)
router.post('/logout', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authMiddleware(req, res, () => AuthController.logout(req, res, next));
  }
  return AuthController.logout(req, res, next);
});

// GET /api/auth/me (Yêu cầu đăng nhập)
router.get('/me', authMiddleware, AuthController.getMe);

// GET /api/auth/users (Chỉ ADMIN & STORE_MANAGER)
router.get('/users', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), AuthController.getUsers);

// PATCH /api/auth/users/:id/status (Khóa/Mở khóa tài khoản, chỉ ADMIN)
router.patch('/users/:id/status', authMiddleware, roleMiddleware(['ADMIN']), AuthController.toggleUserStatus);

// POST /api/auth/users (Tạo tài khoản nhân sự mới, chỉ ADMIN - Mục 2.1 SSOT)
router.post('/users', authMiddleware, roleMiddleware(['ADMIN']), AuthController.createUser);

// POST /api/auth/users/:id/reset-password (Admin đặt lại mật khẩu nhân viên, chỉ ADMIN - Giai đoạn 1)
router.post('/users/:id/reset-password', authMiddleware, roleMiddleware(['ADMIN']), AuthController.resetPassword);

// PUT /api/auth/users/:id (Admin cập nhật thông tin và vai trò nhân viên, chỉ ADMIN - Giai đoạn 3)
router.put('/users/:id', authMiddleware, roleMiddleware(['ADMIN']), AuthController.updateUser);

// POST /api/auth/change-password (Tất cả người dùng đã xác thực, RBAC Mục 3 STT 1)
router.post('/change-password', authMiddleware, AuthController.changePassword);

module.exports = router;
