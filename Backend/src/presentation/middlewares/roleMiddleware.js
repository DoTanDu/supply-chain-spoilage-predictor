// src/presentation/middlewares/roleMiddleware.js
const {
  normalizeRoleCode,
  isChainOwner,
  resolveStoreScope,
  assertStoreOwnership
} = require('./storeScope');
const {
  MANAGEABLE_PAGE_MAP,
  hasPagePermission,
  isPageExplicitlyGranted
} = require('../../domain/constants/pagePermissions');

function roleMiddleware(allowedRoles = [], options = {}) {
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

    // Kiểm tra cô lập dữ liệu Chi nhánh (OWASP API1:2023 - BOLA/IDOR)
    // Không cho phép non-ADMIN truyền storeId='ALL' hoặc storeId của chi nhánh khác qua query/body
    if (!isChainOwner(normalizedUserRole)) {
      const candidates = [req.query?.storeId, req.body?.storeId]
        .filter(v => v !== undefined && v !== null && String(v).trim() !== '');
      for (const candidate of candidates) {
        const scope = resolveStoreScope(req, candidate, { allowAll: false });
        if (!scope.ok) {
          return res.status(scope.statusCode).json(scope.error);
        }
      }
      const fallbackScope = resolveStoreScope(req, undefined, { allowAll: false });
      if (!fallbackScope.ok) {
        return res.status(fallbackScope.statusCode).json(fallbackScope.error);
      }
      req.scopedStoreId = fallbackScope.storeId;
    }

    // OWNER / ADMIN luôn có toàn quyền tối cao
    if (normalizedUserRole === 'ADMIN') {
      return next();
    }

    const requiredPages = Array.isArray(options?.allowedPages)
      ? options.allowedPages.filter(Boolean)
      : (options?.pageKey ? [options.pageKey] : []);

    const hasExplicitGrant = Boolean(
      options?.grantUnlocksRole &&
      requiredPages.length > 0 &&
      requiredPages.some(pageId => isPageExplicitlyGranted(req.user, pageId))
    );

    if (allowedRoles.length > 0 && !hasExplicitGrant) {
      const normalizedAllowedRoles = allowedRoles.map(normalizeRoleCode);

      if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
        return res.status(403).json({
          success: false,
          statusCode: 403,
          code: 'ERR_UNAUTHORIZED_ROLE',
          message: `Từ chối truy cập (403 Forbidden). Chức năng này yêu cầu quyền: [${allowedRoles.join(', ')}]. Vai trò hiện tại của bạn là: [${req.user.roleCode}].`
        });
      }
    }

    if (requiredPages.length > 0) {
      const hasAnyPage = requiredPages.some(pageId => hasPagePermission(req.user, pageId));
      if (!hasAnyPage) {
        const pageLabels = requiredPages
          .map(id => MANAGEABLE_PAGE_MAP[id]?.label || id)
          .join(', ');
        return res.status(403).json({
          success: false,
          statusCode: 403,
          code: 'ERR_PAGE_PERMISSION_DENIED',
          requiredPages,
          message: `Tài khoản của bạn đã bị tắt quyền truy cập trang [${pageLabels}]. Vui lòng liên hệ Quản trị viên để được cấp lại.`
        });
      }
    }

    next();
  };
}

roleMiddleware.normalizeRoleCode = normalizeRoleCode;
roleMiddleware.isChainOwner = isChainOwner;
roleMiddleware.resolveStoreScope = resolveStoreScope;
roleMiddleware.assertStoreOwnership = assertStoreOwnership;
module.exports = roleMiddleware;
