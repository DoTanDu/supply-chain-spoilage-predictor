// src/presentation/middlewares/storeScope.js
/**
 * Tiện ích chuẩn hóa kiểm soát phạm vi dữ liệu theo Chi nhánh (OWASP API1:2023 - BOLA/IDOR)
 * - ADMIN / OWNER: Toàn quyền truy cập đa chi nhánh (hoặc lọc 'ALL')
 * - STORE_MANAGER / CASHIER / STAFF: Bắt buộc cô lập tuyệt đối theo req.user.storeId
 */

function normalizeRoleCode(role) {
  const r = String(role || '').toUpperCase().trim();
  if (r === 'OWNER' || r === 'ADMIN') return 'ADMIN';
  if (r === 'MANAGER' || r === 'STORE_MANAGER') return 'STORE_MANAGER';
  if (r === 'STAFF' || r === 'CASHIER' || r === 'INVENTORY_STAFF' || r === 'WAREHOUSE_STAFF') return 'CASHIER';
  return r;
}

function isChainOwner(userOrRole) {
  const rawRole = typeof userOrRole === 'string'
    ? userOrRole
    : (userOrRole?.roleCode || userOrRole?.role || '');
  return normalizeRoleCode(rawRole) === 'ADMIN';
}

function buildScopeError(statusCode, code, message) {
  return {
    success: false,
    statusCode,
    code,
    errorCode: code,
    message
  };
}

function parsePositiveInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : NaN;
}

/**
 * Xác định và xác thực phạm vi storeId hợp lệ cho request.
 * Không cho phép non-ADMIN truyền storeId='ALL' hoặc storeId của chi nhánh khác.
 */
function resolveStoreScope(req, requestedStoreId, options = {}) {
  const { adminDefault = 'ALL', allowAll = true } = options;

  if (!req?.user || !req.user.roleCode) {
    return {
      ok: false,
      statusCode: 401,
      error: buildScopeError(401, 'ERR_UNAUTHORIZED', 'Yêu cầu xác thực. Vui lòng đăng nhập để tiếp tục.')
    };
  }

  const isOwner = isChainOwner(req.user);
  const rawReq = requestedStoreId !== undefined && requestedStoreId !== null
    ? String(requestedStoreId).trim()
    : '';
  const hasExplicit = rawReq !== '';

  if (isOwner) {
    if (!hasExplicit) {
      return { ok: true, isOwner: true, storeId: adminDefault };
    }
    if (rawReq.toUpperCase() === 'ALL') {
      if (!allowAll) {
        return { ok: true, isOwner: true, storeId: adminDefault === 'ALL' ? 1 : adminDefault };
      }
      return { ok: true, isOwner: true, storeId: 'ALL' };
    }
    const sid = parsePositiveInt(rawReq);
    if (Number.isNaN(sid) || !sid) {
      return {
        ok: false,
        statusCode: 400,
        error: buildScopeError(400, 'ERR_INVALID_STORE_ID', `Mã chi nhánh không hợp lệ: [${requestedStoreId}].`)
      };
    }
    return { ok: true, isOwner: true, storeId: sid };
  }

  // Non-ADMIN bắt buộc có storeId cố định hợp lệ
  const userStoreId = parsePositiveInt(req.user.storeId);
  if (!userStoreId || Number.isNaN(userStoreId)) {
    return {
      ok: false,
      statusCode: 403,
      error: buildScopeError(
        403,
        'ERR_STORE_SCOPE_FORBIDDEN',
        'Từ chối truy cập (403 Forbidden): Tài khoản của bạn chưa được gắn với chi nhánh vận hành hợp lệ.'
      )
    };
  }

  if (hasExplicit) {
    if (rawReq.toUpperCase() === 'ALL') {
      return {
        ok: false,
        statusCode: 403,
        error: buildScopeError(
          403,
          'ERR_STORE_SCOPE_FORBIDDEN',
          `Từ chối truy cập phạm vi toàn chuỗi (storeId=ALL). Tài khoản của bạn thuộc Chi nhánh #${userStoreId}, chỉ được phép truy cập dữ liệu của Chi nhánh #${userStoreId}.`
        )
      };
    }
    const reqSid = parsePositiveInt(rawReq);
    if (Number.isNaN(reqSid) || !reqSid) {
      return {
        ok: false,
        statusCode: 400,
        error: buildScopeError(400, 'ERR_INVALID_STORE_ID', `Mã chi nhánh không hợp lệ: [${requestedStoreId}].`)
      };
    }
    if (reqSid !== userStoreId) {
      return {
        ok: false,
        statusCode: 403,
        error: buildScopeError(
          403,
          'ERR_STORE_SCOPE_FORBIDDEN',
          `Từ chối truy cập dữ liệu liên chi nhánh (403 Forbidden). Tài khoản của bạn thuộc Chi nhánh #${userStoreId}, không có quyền truy cập dữ liệu của Chi nhánh #${reqSid}.`
        )
      };
    }
  }

  return { ok: true, isOwner: false, storeId: userStoreId };
}

/**
 * Kiểm tra quyền sở hữu tài nguyên cấp đối tượng (Object-Level Authorization).
 */
function assertStoreOwnership(user, resourceStoreId, resourceLabel = 'tài nguyên') {
  if (!user || !user.roleCode) {
    return {
      ok: false,
      statusCode: 401,
      error: buildScopeError(401, 'ERR_UNAUTHORIZED', 'Yêu cầu xác thực danh tính.')
    };
  }

  if (isChainOwner(user)) {
    return { ok: true, isOwner: true };
  }

  const userStoreId = parsePositiveInt(user.storeId);
  const targetStoreId = parsePositiveInt(resourceStoreId);

  if (!userStoreId || Number.isNaN(userStoreId) || !targetStoreId || Number.isNaN(targetStoreId) || targetStoreId !== userStoreId) {
    return {
      ok: false,
      statusCode: 403,
      error: buildScopeError(
        403,
        'ERR_STORE_SCOPE_FORBIDDEN',
        `Từ chối truy cập liên chi nhánh (403 Forbidden): Bạn thuộc Chi nhánh #${userStoreId || 'N/A'}, không được phép thao tác ${resourceLabel} của Chi nhánh #${targetStoreId || 'Chuỗi/Khác'}.`
      )
    };
  }

  return { ok: true, isOwner: false };
}

module.exports = {
  normalizeRoleCode,
  isChainOwner,
  resolveStoreScope,
  assertStoreOwnership
};

