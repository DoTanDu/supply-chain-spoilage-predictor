// src/presentation/middlewares/roleMiddleware.js
function roleMiddleware(allowedRoles = []) {
  if (typeof allowedRoles === 'string') {
    allowedRoles = [allowedRoles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập.'
      });
    }

    if (allowedRoles.length === 0) {
      return next();
    }

    // ADMIN luôn có toàn quyền tối cao
    if (req.user.roleCode === 'ADMIN') {
      return next();
    }

    // Chuẩn hóa mô hình 3 Vai trò (ADMIN, STORE_MANAGER, CASHIER)
    const normalizeRole = (r) => (r === 'INVENTORY_STAFF' || r === 'WAREHOUSE_STAFF' || r === 'STAFF') ? 'CASHIER' : r;
    const normalizedUserRole = normalizeRole(req.user.roleCode);
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        code: 'ERR_UNAUTHORIZED_ROLE',
        message: `Từ chối truy cập (403 Forbidden). Chức năng này yêu cầu quyền: [${allowedRoles.join(', ')}]. Vai trò hiện tại của bạn là: [${req.user.roleCode}].`
      });
    }

    next();
  };
}

module.exports = roleMiddleware;
