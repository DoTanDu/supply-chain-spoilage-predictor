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

    // Chuẩn hóa hỗ trợ tương thích WAREHOUSE_STAFF và INVENTORY_STAFF
    const normalizedUserRole = req.user.roleCode === 'INVENTORY_STAFF' ? 'WAREHOUSE_STAFF' : req.user.roleCode;
    const normalizedAllowedRoles = allowedRoles.map(r => r === 'INVENTORY_STAFF' ? 'WAREHOUSE_STAFF' : r);

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
