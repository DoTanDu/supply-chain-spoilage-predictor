// src/presentation/middlewares/authMiddleware.js
const TokenService = require('../../infrastructure/security/TokenService');
const SqlUserRepository = require('../../infrastructure/database/repositories/SqlUserRepository');

const userRepo = new SqlUserRepository();

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  let targetUserId = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = TokenService.verifyToken(token);
    if (decoded && decoded.userId) {
      targetUserId = decoded.userId;
    } else {
      return res.status(401).json({
        success: false,
        message: 'Token xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
      });
    }
  }

  // Không có Bearer token hợp lệ
  if (!targetUserId) {
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu xác thực. Vui lòng cung cấp Access Token hợp lệ (Bearer token).'
    });
  }

  try {
    const user = await userRepo.findById(targetUserId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại hoặc đã bị khóa.'
      });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authMiddleware;

