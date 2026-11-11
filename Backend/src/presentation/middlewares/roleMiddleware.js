// src/presentation/middlewares/roleMiddleware.js
function normalizeRoleCode(role) {
  const r = String(role || '').toUpperCase();
  if (r === 'OWNER' || r === 'ADMIN') return 'ADMIN';
  if (r === 'MANAGER' || r === 'STORE_MANAGER') return 'STORE_MANAGER';
  if (r === 'STAFF' || r === 'CASHIER' || r === 'INVENTORY_STAFF' || r === 'WAREHOUSE_STAFF') return 'CASHIER';
  return r;
}

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

    const normalizedUserRole = normalizeRoleCode(req.user.roleCode);

    // Kiểm tra cô lập dữ liệu Chi nhánh (Data Scoping - Phụ lục A3 SmartSupply AI)
    // Nếu người dùng là MANAGER hoặc STAFF (có storeId cố định) mà cố tình truyền storeId của chi nhánh khác
    if (normalizedUserRole !== 'ADMIN' && req.user.storeId) {
      const requestedStore = req.query?.storeId || req.body?.storeId;
      if (
        requestedStore &&
        String(requestedStore).toUpperCase() !== 'ALL' &&
        Number(requestedStore) !== Number(req.user.storeId)
      ) {
        return res.status(403).json({
          success: false,
          statusCode: 403,
          code: 'ERR_STORE_SCOPE_FORBIDDEN',
          message: `Từ chối truy cập dữ liệu liên chi nhánh (403 Forbidden). Tài khoản của bạn thuộc Chi nhánh #${req.user.storeId}, không có quyền truy cập dữ liệu nội bộ của Chi nhánh #${requestedStore}.`
        });
      }
      req.scopedStoreId = Number(req.user.storeId);
    }

    if (allowedRoles.length === 0) {
      return next();
    }

    // OWNER / ADMIN luôn có toàn quyền tối cao
    if (normalizedUserRole === 'ADMIN') {
      return next();
    }

    const normalizedAllowedRoles = allowedRoles.map(normalizeRoleCode);

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

roleMiddleware.normalizeRoleCode = normalizeRoleCode;
module.exports = roleMiddleware;
