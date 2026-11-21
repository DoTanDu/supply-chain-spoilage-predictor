const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function handleUnauthorizedResponse(res, skipAuthRedirect = false) {
  if (res && res.status === 401 && !skipAuthRedirect) {
    const hadSession = Boolean(localStorage.getItem('token') || localStorage.getItem('user'));
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (hadSession && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('auth:expired', {
          detail: { message: 'Phiên đăng nhập đã hết hạn hoặc tài khoản đã bị khóa.' }
        })
      );
    }
  }
}

async function parseJsonSafe(res, skipAuthRedirect = false) {
  handleUnauthorizedResponse(res, skipAuthRedirect);
  try {
    return await res.json();
  } catch (err) {
    return {
      success: false,
      status: res?.status || 500,
      message: `Lỗi phản hồi từ máy chủ (HTTP ${res?.status || 500})`
    };
  }
}

export async function apiCheckHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return await parseJsonSafe(res, true);
}

// Header xác thực dùng cho các API đọc (Backend yêu cầu Bearer token trên mọi route /api trừ login & health)
function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function fetchDashboardStats(storeId = null) {
  const token = localStorage.getItem('token');
  const query = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
  const res = await fetch(`${API_BASE}/dashboard/stats${query}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  const json = await parseJsonSafe(res);
  return json.data || json;
}

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products`, { headers: authHeaders() });
  const json = await parseJsonSafe(res);
  return json.data || [];
}

export async function fetchBatches(storeId = null) {
  const token = localStorage.getItem('token');
  const query = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
  const res = await fetch(`${API_BASE}/batches${query}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  const json = await parseJsonSafe(res);
  return json.data || [];
}

export async function fetchDisposals(storeId = null) {
  const token = localStorage.getItem('token');
  const query = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
  const res = await fetch(`${API_BASE}/disposals${query}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  const json = await parseJsonSafe(res);
  return json.data || [];
}

export async function fetchAuditLogs(storeId = null) {
  const token = localStorage.getItem('token');
  const qs = storeId && String(storeId).toUpperCase() !== 'ALL'
    ? `?storeId=${encodeURIComponent(storeId)}`
    : '';
  const res = await fetch(`${API_BASE}/audit-logs${qs}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  const json = await parseJsonSafe(res);
  return json.data || [];
}

export async function apiAddBatch(batchData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/batches`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(batchData)
  });
  return await parseJsonSafe(res);
}

export async function apiCreateProduct(productData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(productData)
  });
  return await parseJsonSafe(res);
}

export async function apiUpdateProduct(id, productData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(productData)
  });
  return await parseJsonSafe(res);
}

export async function apiDeleteProduct(id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

export async function apiCreateDisposal(disposalData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/spoilage`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(disposalData)
  });
  return await parseJsonSafe(res);
}

export async function apiCreateBulkDisposal(bulkData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/spoilage/bulk`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(bulkData)
  });
  return await parseJsonSafe(res);
}

export async function apiApproveDisposal(disposalId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/spoilage/${encodeURIComponent(disposalId)}/approve`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

export async function apiApplyDiscount(batchId, percent = 30) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/batches/${batchId}/discount`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ percent })
  });
  return await parseJsonSafe(res);
}

export async function apiRotateShelf(batchId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/batches/${batchId}/rotate`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

// ==============================================================================
// 3 FOUNDATION CLEAN ARCHITECTURE MODULES
// ==============================================================================

// Module 1: Auth & User
export async function apiLogin(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const json = await parseJsonSafe(res, true);
  if (json.success && json.data && json.data.token) {
    localStorage.setItem('token', json.data.token);
    localStorage.setItem('user', JSON.stringify(json.data.user));
  }
  return json;
}

export async function apiGetMe() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

// Module 2: Store Profile (Hỗ trợ Chuỗi 3 chi nhánh MVP & Cửa hàng độc lập)
export async function apiGetStoreProfile(storeId = null) {
  const query = storeId ? `/${storeId}` : '';
  const res = await fetch(`${API_BASE}/store-profile${query}`, { headers: authHeaders() });
  const json = await parseJsonSafe(res);
  return json.data;
}

export async function apiGetAllStores() {
  const res = await fetch(`${API_BASE}/store-profile/all`, { headers: authHeaders() });
  const json = await parseJsonSafe(res);
  return json.data || [];
}

export async function apiCreateStoreProfile(data) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/store-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  return await parseJsonSafe(res);
}

export async function apiUpdateStoreProfile(data, storeId = null) {
  const token = localStorage.getItem('token');
  const targetId = storeId || data?.id;
  const path = targetId ? `/${targetId}` : '';
  const res = await fetch(`${API_BASE}/store-profile${path}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  return await parseJsonSafe(res);
}

// Module 3: Categories FMCG
export async function apiGetCategories() {
  const res = await fetch(`${API_BASE}/catalog/categories`, { headers: authHeaders() });
  const json = await parseJsonSafe(res);
  return json.data || [];
}

export async function apiCreateCategory(categoryData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/catalog/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(categoryData)
  });
  return await parseJsonSafe(res);
}

export async function apiUpdateCategory(id, categoryData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/catalog/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(categoryData)
  });
  return await parseJsonSafe(res);
}

export async function apiDeleteCategory(id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/catalog/categories/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

// ==============================================================================
// ADVANCED CLEAN ARCHITECTURE DOMAIN MODULES
// ==============================================================================

// Module 4: Executive Dashboard (6 KPI tài chính & Action Board ca trực)
export async function fetchDashboardOverview(storeId = null) {
  const token = localStorage.getItem('token');
  const query = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
  const res = await fetch(`${API_BASE}/dashboard/overview${query}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

export async function fetchReportsAnalytics(storeId = null, days = 30) {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  if (storeId) params.set('storeId', storeId);
  if (days) params.set('days', String(days));
  const res = await fetch(`${API_BASE}/dashboard/reports?${params.toString()}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

// Module 5: Tiếp nhận hàng nhập kho (Kiểm soát RSL >= 70%)
export async function apiReceiveDCInbound(payload) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/batches/receive-inbound`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  return await parseJsonSafe(res);
}

export async function apiRejectDCInbound(payload) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/batches/reject-inbound`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  return await parseJsonSafe(res);
}

// Module 6: Ghi nhận xuất bán FEFO & lịch sử bán
export async function apiProcessFefoSale(cartItems, weather = 'NORMAL', isHoliday = false, options = {}) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const res = await fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      items: cartItems,
      storeId: options?.storeId || user.storeId || 1,
      saleDate: options?.saleDate || undefined,
      transactionCode: options?.transactionCode || undefined,
      weather,
      isHoliday,
      cashierId: user.id || 3,
      cashierName: user.fullName || 'Nhân viên cửa hàng'
    })
  });
  return await parseJsonSafe(res);
}

// Kiểm kê tồn kho & Xuất kho thủ công theo lô
export async function apiRecordBatchStocktake(batchId, payload) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/batches/${batchId}/stocktake`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  return await parseJsonSafe(res);
}

export async function fetchBatchAdjustments(storeId = null) {
  const token = localStorage.getItem('token');
  const query = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
  const res = await fetch(`${API_BASE}/batches/adjustments${query}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

// Cấu hình Doanh nghiệp & Chuỗi (Kho trung tâm / Hạn mức duyệt PO)
export async function apiGetEnterpriseConfig() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/store-profile/enterprise`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

export async function apiUpdateEnterpriseConfig(data) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/store-profile/enterprise`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  return await parseJsonSafe(res);
}

export async function fetchSalesHistory(limit = 50, storeId = null) {
  const token = localStorage.getItem('token');
  const storeParam = storeId ? `&storeId=${encodeURIComponent(storeId)}` : '';
  const res = await fetch(`${API_BASE}/sales/history?limit=${limit}${storeParam}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

export async function apiImportPosSales(rows = []) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/sales/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ rows })
  });
  return await parseJsonSafe(res);
}

// Module 7: Sổ hao hụt tài chính & Tiêu hủy hàng (CostLoss = Qty * ImportPrice)
export async function fetchSpoilageLedger(limit = 50, storeId = null) {
  const token = localStorage.getItem('token');
  const storeParam = storeId ? `&storeId=${encodeURIComponent(storeId)}` : '';
  const res = await fetch(`${API_BASE}/spoilage/ledger?limit=${limit}${storeParam}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

// Module 8: Dự báo 7 ngày, ROP & Đơn đặt hàng
export async function fetchRopForecast(weather = 'AUTO', isHoliday = 'auto', storeId = null, isPromo = false, coords = null) {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  if (weather) params.set('weather', weather);
  if (isHoliday !== undefined && isHoliday !== null) params.set('isHoliday', String(isHoliday));
  params.set('isPromo', String(Boolean(isPromo)));
  if (storeId) params.set('storeId', String(storeId));
  if (coords && Number.isFinite(Number(coords.lat)) && Number.isFinite(Number(coords.lon))) {
    params.set('lat', String(coords.lat));
    params.set('lon', String(coords.lon));
    if (coords.locationName) params.set('locationName', coords.locationName);
  }
  const res = await fetch(`${API_BASE}/forecast/rop?${params.toString()}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

export async function apiSaveForecastSnapshot(payload) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/forecast/snapshot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  return await parseJsonSafe(res);
}

export async function fetchPurchaseOrders(storeId = 'ALL') {
  const token = localStorage.getItem('token');
  const qs = storeId && storeId !== 'ALL' ? `?storeId=${encodeURIComponent(storeId)}` : '';
  const res = await fetch(`${API_BASE}/forecast/purchase-orders${qs}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

export async function apiCreatePurchaseOrder(poData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/forecast/purchase-orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(poData)
  });
  return await parseJsonSafe(res);
}

export async function apiUpdatePOStatus(orderId, status, notes = '') {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/forecast/purchase-orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ status, notes })
  });
  return await parseJsonSafe(res);
}

// Module 10: Quản trị Tài khoản Nhân sự & Khóa / Mở khóa tài khoản (RBAC - Rule 11 SSOT)
export async function apiGetUsers() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/auth/users`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

export async function apiToggleUserStatus(userId, isActive) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/auth/users/${userId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ isActive })
  });
  return await parseJsonSafe(res);
}

// Module 11: Đổi mật khẩu tài khoản cá nhân (Mục 3 STT 1 RBAC)
export async function apiChangePassword(oldPassword, newPassword, confirmPassword) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ oldPassword, newPassword, confirmPassword })
  });
  return await parseJsonSafe(res);
}

// Module 12: Thêm mới tài khoản nhân sự (Chỉ ADMIN - Mục 2.1 SSOT)
export async function apiCreateUser(userData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/auth/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(userData)
  });
  return await parseJsonSafe(res);
}

// Module 13: Quản trị viên Đặt lại mật khẩu nhân viên (Chỉ ADMIN - Giai đoạn 1)
export async function apiResetUserPassword(userId, newPassword, confirmPassword) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/auth/users/${userId}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ newPassword, confirmPassword })
  });
  return await parseJsonSafe(res);
}

// Module 14: Quản trị viên Cập nhật thông tin, vai trò & phân quyền trang nhân viên (Chỉ ADMIN - Giai đoạn 3)
export async function apiUpdateUser(userId, userData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/auth/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(userData)
  });
  return await parseJsonSafe(res);
}

export async function apiGetPageCatalog() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/auth/users/page-catalog`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

// Module 15: Đăng xuất người dùng & ghi nhật ký kiểm toán (Mục 22.1 SSOT)
export async function apiLogout() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res, true);
}

// Module 16: Lấy chi tiết hóa đơn POS & In lại hóa đơn (Mục 22.6 SSOT)
export async function apiGetReceipt(txnCode) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/sales/receipt/${encodeURIComponent(txnCode)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

// Module 17: Vô hiệu hóa/Xóa tài khoản người dùng (Chỉ ADMIN - Mục 22.2 SSOT)
export async function apiDeleteUser(userId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

// Module 18: Quản lý Nhà cung ứng & Kho tổng DC (Mục 5, 6 & 17.4 SSOT)
export async function apiGetSuppliers(includeInactive = false) {
  const token = localStorage.getItem('token');
  const query = includeInactive ? '?includeInactive=true' : '';
  const res = await fetch(`${API_BASE}/suppliers${query}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  const json = await parseJsonSafe(res);
  return json.data || [];
}

export async function apiCreateSupplier(supplierData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/suppliers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(supplierData)
  });
  return await parseJsonSafe(res);
}

export async function apiUpdateSupplier(id, supplierData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/suppliers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(supplierData)
  });
  return await parseJsonSafe(res);
}

export async function apiDeleteSupplier(id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/suppliers/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

// Module 19: Quản lý Phiếu Nhập Kho DC (Goods Receipts - Mục 17.12 & Rule 7 SSOT)
export async function apiGetGoodsReceipts(storeId = 'ALL') {
  const token = localStorage.getItem('token');
  const qs = storeId && storeId !== 'ALL' ? `?storeId=${encodeURIComponent(storeId)}` : '';
  const res = await fetch(`${API_BASE}/goods-receipts${qs}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  const json = await parseJsonSafe(res);
  return json.data || [];
}

// Module 20: AI Engine & Điều phối Liên cửa hàng (stock_transfers)
export async function fetchAiSupplyChainMatrix(weather = 'AUTO', isHoliday = 'auto') {
  const token = localStorage.getItem('token');
  const holParam = isHoliday === 'auto' ? 'auto' : String(Boolean(isHoliday));
  const res = await fetch(`${API_BASE}/stock-transfers/ai-matrix?weather=${encodeURIComponent(weather || 'AUTO')}&isHoliday=${holParam}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

export async function runAiModelInference(limit = 8) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/stock-transfers/ai-inference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ limit })
  });
  return await parseJsonSafe(res);
}

export async function fetchStockTransfers(status = 'ALL') {
  const token = localStorage.getItem('token');
  const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`${API_BASE}/stock-transfers${query}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

export async function apiCreateStockTransfer(transferData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/stock-transfers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(transferData)
  });
  return await parseJsonSafe(res);
}

export async function apiUpdateStockTransferStatus(transferId, status, notes = '') {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/stock-transfers/${transferId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ status, notes })
  });
  return await parseJsonSafe(res);
}

// ==========================================
// Module 21: AI 4 - SmartSupply AI Assistant
// ==========================================
export async function askAiAssistant(message, apiKey = '', storeId = 'ALL') {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/ai/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ message, apiKey, storeId })
  });
  return await parseJsonSafe(res);
}

export async function fetchAiAssistantQuickInsights(storeId = 'ALL') {
  const token = localStorage.getItem('token');
  const query = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
  const res = await fetch(`${API_BASE}/ai/assistant/quick-insights${query}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}

export async function fetchAiAssistantStatus() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/ai/assistant/status`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  return await parseJsonSafe(res);
}
