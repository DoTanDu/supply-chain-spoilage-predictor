// src/infrastructure/security/TokenService.js
const crypto = require('crypto');
const os = require('os');
const jwt = require('jsonwebtoken');

const MIN_SECRET_LENGTH = 32;

function isProduction() {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production';
}

/**
 * Xác định khóa ký JWT.
 * - Production: BẮT BUỘC có JWT_SECRET (>= 32 ký tự), thiếu thì từ chối khởi động.
 * - Ngoài production: dùng JWT_SECRET nếu có; nếu không, suy ra khóa ổn định theo máy + đường dẫn dự án
 *   (không phải chuỗi công khai trong mã nguồn, không đổi giữa các lần khởi động lại để khỏi bắt đăng nhập lại).
 */
function resolveJwtSecret() {
  const configured = process.env.JWT_SECRET;

  if (isProduction()) {
    if (!configured || configured.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `[SECURITY] Thiếu hoặc quá ngắn biến môi trường JWT_SECRET (cần tối thiểu ${MIN_SECRET_LENGTH} ký tự) khi NODE_ENV=production. Từ chối khởi động.`
      );
    }
    return configured;
  }

  if (configured) {
    return configured;
  }

  let username = 'unknown';
  try {
    username = os.userInfo().username;
  } catch (err) {
    console.warn(`[SECURITY] Không đọc được tên người dùng hệ điều hành, dùng giá trị mặc định: ${err.message}`);
  }
  console.warn('[SECURITY] JWT_SECRET chưa được cấu hình: dùng khóa phát triển suy ra theo máy. Hãy đặt JWT_SECRET trước khi triển khai thật.');
  return crypto
    .createHash('sha256')
    .update(['smartsupply-dev-jwt', os.hostname(), username, __dirname].join('|'))
    .digest('hex');
}

const JWT_SECRET = resolveJwtSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || (isProduction() ? '8h' : '30d');

class TokenService {
  static generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }

  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (err) {
      return null;
    }
  }
}

module.exports = TokenService;
