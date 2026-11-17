// src/infrastructure/security/DemoPasswordPolicy.js
/**
 * Mật khẩu demo dùng để chuyển nhanh giữa các tài khoản khi trình bày với hội đồng.
 * Chỉ hoạt động ngoài môi trường production. Khi NODE_ENV=production sẽ luôn bị vô hiệu hóa,
 * kể cả khi biến ALLOW_DEMO_PASSWORDS được đặt thành 'true'.
 *
 * Tắt thủ công ở môi trường dev: đặt ALLOW_DEMO_PASSWORDS=false
 */
const DEMO_PASSWORDS = Object.freeze(['Password123@', 'admin', '123456']);

function isEnabled() {
  if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
    return false;
  }
  return String(process.env.ALLOW_DEMO_PASSWORDS || 'true').toLowerCase() !== 'false';
}

/**
 * @param {string} plainPassword Mật khẩu người dùng nhập
 * @param {string|null|undefined} storedHash Giá trị cột password_hash hiện lưu trong CSDL
 * @returns {boolean} true nếu được chấp nhận theo cơ chế demo
 */
function matches(plainPassword, storedHash) {
  if (!isEnabled() || !storedHash) return false;
  return storedHash === plainPassword || DEMO_PASSWORDS.includes(plainPassword);
}

module.exports = { isEnabled, matches, DEMO_PASSWORDS };

