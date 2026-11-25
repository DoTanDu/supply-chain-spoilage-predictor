// src/utils/pagePermissions.js
// Đồng bộ phân quyền 3 Actor (OWNER, MANAGER, STAFF) & Đúng 9 trang chuẩn SmartSupply AI (01-09)

export const SMARTSUPPLY_PAGES = [
  {
    id: 'dashboard',
    label: '01. Dashboard',
    description: 'Tổng quan chuỗi, doanh số & nguy cơ lãng phí',
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
    defaultRoles: ['ADMIN', 'STORE_MANAGER']
  },
  {
    id: 'smart-ordering',
    label: '05. Smart Ordering',
    description: 'Gợi ý nhập hàng, duyệt đơn',
    defaultRoles: ['ADMIN', 'STORE_MANAGER']
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
    description: 'Báo cáo lãng phí, độ chính xác AI & hiệu quả vận hành',
    defaultRoles: ['ADMIN', 'STORE_MANAGER']
  },
  {
    id: 'settings-integration',
    label: '09. Settings & Integration',
    description: 'Tài khoản, phân quyền, kết nối POS, nhà cung cấp',
    defaultRoles: ['ADMIN']
  }
];

export const MANAGEABLE_PAGES = SMARTSUPPLY_PAGES;
export const OWNER_ONLY_PAGES = ['user-management'];
export const MANAGEABLE_PAGE_IDS = MANAGEABLE_PAGES.map(p => p.id);
export const SMARTSUPPLY_PAGE_IDS = SMARTSUPPLY_PAGES.map(p => p.id);
export const VALID_TABS = [...SMARTSUPPLY_PAGE_IDS];
export const MANAGEABLE_PAGE_MAP = MANAGEABLE_PAGES.reduce((acc, p) => {
  acc[p.id] = p;
  return acc;
}, {});

export const LEGACY_TO_NEW_PAGE_MAP = {
  'pos-checkout': 'inventory-management',
  'dc-intake': 'inventory-management',
  'product-catalog': 'inventory-management',
  'fefo-monitor': 'spoilage-alerts',
  'spoilage-disposal': 'spoilage-alerts',
  'reorder-predictor': 'smart-ordering',
  'store-settings': 'store-management',
  'audit-log': 'settings-integration',
  'user-management': 'settings-integration'
};

export function resolveLegacyRoute(slug) {
  const clean = String(slug || '').replace(/^\/+/, '').trim();
  if (VALID_TABS.includes(clean)) {
    return { tab: clean, subTab: null };
  }
  const mapped = LEGACY_TO_NEW_PAGE_MAP[clean];
  if (mapped) {
    return { tab: mapped, subTab: null };
  }
  return { tab: null, subTab: null };
}

export function mapPageId(rawPageId) {
  const clean = String(rawPageId || '').trim();
  return LEGACY_TO_NEW_PAGE_MAP[clean] || clean;
}

export function normalizeRole(roleCode) {
  const r = String(roleCode || 'CASHIER').toUpperCase().trim();
  if (r === 'OWNER' || r === 'ADMIN') return 'ADMIN';
  if (r === 'MANAGER' || r === 'STORE_MANAGER') return 'STORE_MANAGER';
  if (r === 'STAFF' || r === 'CASHIER' || r === 'WAREHOUSE_STAFF' || r === 'INVENTORY_STAFF') return 'CASHIER';
  return r;
}

export function getActorDisplayName(roleCode) {
  const role = normalizeRole(roleCode);
  if (role === 'ADMIN') return 'OWNER • Chủ chuỗi';
  if (role === 'STORE_MANAGER') return 'MANAGER • Quản lý chi nhánh';
  return 'STAFF • Nhân viên';
}

export function getDefaultPagesForRole(roleCode) {
  const role = normalizeRole(roleCode);
  if (role === 'ADMIN') {
    return [...MANAGEABLE_PAGE_IDS];
  }
  return MANAGEABLE_PAGES
    .filter(p => p.defaultRoles.includes(role))
    .map(p => p.id);
}

export function parsePagePermissions(raw) {
  if (!raw) return { grant: [], revoke: [] };
  let obj = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return { grant: [], revoke: [] };
    try {
      obj = JSON.parse(trimmed);
    } catch {
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

export function normalizePagePermissions(raw, roleCode) {
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

export function computeEffectivePages(roleCode, pagePermissions) {
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

export function isPageExplicitlyGranted(user, rawPageId) {
  if (!user) return false;
  const pageId = mapPageId(rawPageId);
  const role = normalizeRole(user.roleCode || user.actorCode);
  if (role === 'ADMIN') return true;
  const normalized = normalizePagePermissions(user.pagePermissions, role);
  return normalized.grant.includes(pageId);
}

export function hasBackendPagePermission(user, rawPageId) {
  if (!user || !rawPageId) return false;
  const pageId = mapPageId(rawPageId);
  const role = normalizeRole(user.roleCode || user.actorCode);
  if (role === 'ADMIN') return true;
  const effective = Array.isArray(user.effectivePages)
    ? user.effectivePages.map(mapPageId)
    : computeEffectivePages(role, user.pagePermissions);
  return effective.includes(pageId);
}

export function canAccessPage(user, pageId, isSingleStore = false) {
  if (!user || !pageId) return false;
  const role = normalizeRole(user.roleCode || user.actorCode);

  if (pageId === 'stock-transfer' && isSingleStore) {
    return false;
  }

  if (role === 'ADMIN') {
    return VALID_TABS.includes(pageId);
  }

  if (pageId === 'settings-integration') {
    return true; // Mọi user đều có quyền đổi mật khẩu / xem thông tin tài khoản
  }

  return hasBackendPagePermission(user, pageId);
}

export function getDefaultTabForUser(user, isSingleStore = false) {
  const role = normalizeRole(user?.roleCode || user?.actorCode);
  if (role === 'ADMIN') return 'dashboard';

  const preferredOrder = role === 'CASHIER'
    ? [
        'inventory-management',
        'spoilage-alerts',
        'ai-forecast',
        'smart-ordering',
        'stock-transfer',
        'dashboard',
        'settings-integration'
      ]
    : [
        'dashboard',
        'store-management',
        'inventory-management',
        'ai-forecast',
        'smart-ordering',
        'stock-transfer',
        'spoilage-alerts',
        'reports-analytics',
        'settings-integration'
      ];

  for (const tabId of preferredOrder) {
    if (canAccessPage(user, tabId, isSingleStore)) {
      return tabId;
    }
  }
  return 'settings-integration';
}

export function getSafeTabForUser(requestedTab, user, isSingleStore = false) {
  const resolved = resolveLegacyRoute(requestedTab);
  const candidate = resolved.tab || requestedTab;
  if (!user) return VALID_TABS.includes(candidate) ? candidate : 'dashboard';
  if (canAccessPage(user, candidate, isSingleStore)) {
    return candidate;
  }
  return getDefaultTabForUser(user, isSingleStore);
}
