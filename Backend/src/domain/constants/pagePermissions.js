// src/domain/constants/pagePermissions.js
// Danh mục phân quyền chuẩn 9 trang SmartSupply AI & 3 Actor (OWNER, MANAGER, STAFF)

const MANAGEABLE_PAGES = Object.freeze([
  {
    id: 'dashboard',
    label: '01. Dashboard',
    description: 'Tổng quan toàn chuỗi, doanh số, nguy cơ lãng phí',
    defaultRoles: ['ADMIN', 'STORE_MANAGER']
  },
  {
    id: 'store-management',
    label: '02. Store Management',
    description: 'Quản lý chi nhánh và so sánh hiệu quả',
    defaultRoles: ['ADMIN', 'STORE_MANAGER']
  },
  {
    id: 'inventory-management',
    label: '03. Inventory Management',
    description: 'Tồn kho, lô hàng, hạn sử dụng, nhập/xuất & kiểm kê',
    defaultRoles: ['ADMIN', 'STORE_MANAGER', 'CASHIER']
  },
  {
    id: 'ai-forecast',
    label: '04. AI Forecast',
    description: 'Dự báo nhu cầu trong 7 ngày',
    defaultRoles: ['ADMIN', 'STORE_MANAGER', 'CASHIER']
  },
  {
    id: 'smart-ordering',
    label: '05. Smart Ordering',
    description: 'Gợi ý nhập hàng, duyệt đơn',
    defaultRoles: ['ADMIN', 'STORE_MANAGER', 'CASHIER']
  },
  {
    id: 'stock-transfer',
    label: '06. Stock Transfer',
    description: 'Đề xuất và theo dõi điều chuyển',
    defaultRoles: ['ADMIN', 'STORE_MANAGER', 'CASHIER']
  },
  {
    id: 'spoilage-alerts',
    label: '07. Spoilage Alerts',
    description: 'Cảnh báo và xử lý hàng có nguy cơ hủy',
    defaultRoles: ['ADMIN', 'STORE_MANAGER', 'CASHIER']
  },
  {
    id: 'reports-analytics',
    label: '08. Reports & Analytics',
    description: 'Báo cáo lãng phí, độ chính xác AI và hiệu quả vận hành',
    defaultRoles: ['ADMIN', 'STORE_MANAGER']
  },
  {
    id: 'settings-integration',
    label: '09. Settings & Integration',
    description: 'Tài khoản, phân quyền, kết nối POS, nhà cung cấp',
    defaultRoles: ['ADMIN', 'STORE_MANAGER', 'CASHIER']
  }
]);

const LEGACY_TO_NEW_PAGE_MAP = Object.freeze({
  'pos-checkout': 'inventory-management',
  'dc-intake': 'inventory-management',
  'product-catalog': 'inventory-management',
  'fefo-monitor': 'spoilage-alerts',
  'spoilage-disposal': 'spoilage-alerts',
  'reorder-predictor': 'smart-ordering',
  'store-settings': 'store-management',
  'audit-log': 'settings-integration'
});

const OWNER_ONLY_PAGES = Object.freeze(['user-management']);
const MANAGEABLE_PAGE_IDS = Object.freeze(MANAGEABLE_PAGES.map(p => p.id));
const MANAGEABLE_PAGE_MAP = Object.freeze(
  MANAGEABLE_PAGES.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {})
);

function mapPageId(rawPageId) {
  const clean = String(rawPageId || '').trim();
  return LEGACY_TO_NEW_PAGE_MAP[clean] || clean;
}

function normalizeRole(roleCode) {
  const r = String(roleCode || 'CASHIER').toUpperCase().trim();
  if (r === 'OWNER' || r === 'ADMIN') return 'ADMIN';
  if (r === 'MANAGER' || r === 'STORE_MANAGER') return 'STORE_MANAGER';
  if (r === 'STAFF' || r === 'CASHIER' || r === 'WAREHOUSE_STAFF' || r === 'INVENTORY_STAFF') return 'CASHIER';
  return r;
}

function getDefaultPagesForRole(roleCode) {
  const role = normalizeRole(roleCode);
  if (role === 'ADMIN') {
    return [...MANAGEABLE_PAGE_IDS];
  }
  return MANAGEABLE_PAGES
    .filter(p => p.defaultRoles.includes(role))
    .map(p => p.id);
}

function parsePagePermissions(raw) {
  if (!raw) return { grant: [], revoke: [] };
  let obj = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return { grant: [], revoke: [] };
    try {
      obj = JSON.parse(trimmed);
    } catch (_e) {
      return { grant: [], revoke: [] };
    }
  }
  if (!obj || typeof obj !== 'object') {
    return { grant: [], revoke: [] };
  }
  return {
    grant: Array.isArray(obj.grant) ? obj.grant.map(mapPageId) : [],
    revoke: Array.isArray(obj.revoke) ? obj.revoke.map(mapPageId) : []
  };
}

function normalizePagePermissions(raw, roleCode) {
  const role = normalizeRole(roleCode);
  if (role === 'ADMIN') {
    return { grant: [], revoke: [] };
  }
  const parsed = parsePagePermissions(raw);
  const defaults = new Set(getDefaultPagesForRole(role));

  const grantSet = new Set();
  for (const id of parsed.grant) {
    if (MANAGEABLE_PAGE_MAP[id] && !defaults.has(id)) {
      grantSet.add(id);
    }
  }

  const revokeSet = new Set();
  for (const id of parsed.revoke) {
    if (MANAGEABLE_PAGE_MAP[id] && defaults.has(id) && !grantSet.has(id)) {
      revokeSet.add(id);
    }
  }

  return {
    grant: Array.from(grantSet),
    revoke: Array.from(revokeSet)
  };
}

function validatePagePermissionsInput(raw, roleCode) {
  if (raw === undefined || raw === null) {
    return { ok: true, value: { grant: [], revoke: [] } };
  }
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = raw.trim() ? JSON.parse(raw) : { grant: [], revoke: [] };
    } catch (_e) {
      return { ok: false, message: 'Định dạng JSON phân quyền trang (pagePermissions) không hợp lệ.' };
    }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { ok: false, message: 'Dữ liệu phân quyền trang (pagePermissions) phải là đối tượng { grant, revoke }.' };
  }
  if (obj.grant !== undefined && !Array.isArray(obj.grant)) {
    return { ok: false, message: 'Trường grant trong pagePermissions phải là một mảng mã trang.' };
  }
  if (obj.revoke !== undefined && !Array.isArray(obj.revoke)) {
    return { ok: false, message: 'Trường revoke trong pagePermissions phải là một mảng mã trang.' };
  }

  const allSent = [...(obj.grant || []), ...(obj.revoke || [])].map(mapPageId);
  for (const pageId of allSent) {
    if (OWNER_ONLY_PAGES.includes(pageId)) {
      return {
        ok: false,
        message: `Không thể gán hoặc thu hồi quyền [${pageId}] — quyền quản trị tài khoản chỉ dành cho Chủ chuỗi (OWNER).`
      };
    }
    if (!MANAGEABLE_PAGE_MAP[pageId]) {
      return {
        ok: false,
        message: `Mã trang không hợp lệ trong phân quyền: [${pageId}].`
      };
    }
  }

  return {
    ok: true,
    value: normalizePagePermissions(obj, roleCode)
  };
}

function serializePagePermissions(raw, roleCode) {
  const normalized = normalizePagePermissions(raw, roleCode);
  if (normalized.grant.length === 0 && normalized.revoke.length === 0) {
    return null;
  }
  return JSON.stringify(normalized);
}

function computeEffectivePages(roleCode, pagePermissions) {
  const role = normalizeRole(roleCode);
  if (role === 'ADMIN') {
    return [...MANAGEABLE_PAGE_IDS];
  }
  const defaults = getDefaultPagesForRole(role);
  const { grant, revoke } = normalizePagePermissions(pagePermissions, role);
  const revokeSet = new Set(revoke);
  const effective = new Set(defaults.filter(id => !revokeSet.has(id)));
  for (const id of grant) {
    effective.add(id);
  }
  return MANAGEABLE_PAGE_IDS.filter(id => effective.has(id));
}

function hasPagePermission(user, rawPageId) {
  if (!user) return false;
  const pageId = mapPageId(rawPageId);
  const role = normalizeRole(user.roleCode || user.role);
  if (role === 'ADMIN') return true;
  if (OWNER_ONLY_PAGES.includes(pageId)) return false;
  const effective = Array.isArray(user.effectivePages)
    ? user.effectivePages.map(mapPageId)
    : computeEffectivePages(role, user.pagePermissions);
  return effective.includes(pageId);
}

function isPageExplicitlyGranted(user, rawPageId) {
  if (!user) return false;
  const pageId = mapPageId(rawPageId);
  const role = normalizeRole(user.roleCode || user.role);
  if (role === 'ADMIN') return true;
  const normalized = normalizePagePermissions(user.pagePermissions, role);
  return normalized.grant.includes(pageId);
}

module.exports = {
  MANAGEABLE_PAGES,
  MANAGEABLE_PAGE_IDS,
  MANAGEABLE_PAGE_MAP,
  OWNER_ONLY_PAGES,
  LEGACY_TO_NEW_PAGE_MAP,
  mapPageId,
  normalizeRole,
  getDefaultPagesForRole,
  parsePagePermissions,
  normalizePagePermissions,
  validatePagePermissionsInput,
  serializePagePermissions,
  computeEffectivePages,
  hasPagePermission,
  isPageExplicitlyGranted
};
