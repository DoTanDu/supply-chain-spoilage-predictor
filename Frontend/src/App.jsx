import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import FefoMonitorView from './components/FefoMonitorView';
import PosCheckoutView from './components/PosCheckoutView';
import DcIntakeView from './components/DcIntakeView';
import SpoilageDisposalView from './components/SpoilageDisposalView';
import ReorderPredictorView from './components/ReorderPredictorView';
import StockTransferView from './components/StockTransferView';
import AuditLogView from './components/AuditLogView';
import LoginView from './components/LoginView';
import ProductCatalogView from './components/ProductCatalogView';
import ShiftHandoverView from './components/ShiftHandoverView';
import UserManagementView from './components/UserManagementView';
import StoreSettingsView from './components/StoreSettingsView';
import AdminLoginModal from './components/AdminLoginModal';
import ErrorBoundary from './components/ErrorBoundary';

import * as api from './api';
import { fetchRealtimeWeatherBienHoa } from './utils/weatherService';

const VALID_TABS = [
  'dashboard',
  'fefo-monitor',
  'pos-checkout',
  'dc-intake',
  'product-catalog',
  'spoilage-disposal',
  'shift-handover',
  'reorder-predictor',
  'stock-transfer',
  'audit-log',
  'store-settings',
  'user-management'
];

const TAB_ALLOWED_ROLES = {
  'dashboard': ['ADMIN', 'STORE_MANAGER'],
  'pos-checkout': ['ADMIN', 'STORE_MANAGER', 'CASHIER', 'WAREHOUSE_STAFF'],
  'fefo-monitor': ['ADMIN', 'STORE_MANAGER', 'CASHIER', 'WAREHOUSE_STAFF'],
  'dc-intake': ['ADMIN', 'STORE_MANAGER', 'CASHIER', 'WAREHOUSE_STAFF'],
  'product-catalog': ['ADMIN', 'STORE_MANAGER', 'CASHIER', 'WAREHOUSE_STAFF'],
  'spoilage-disposal': ['ADMIN', 'STORE_MANAGER', 'CASHIER', 'WAREHOUSE_STAFF'],
  'shift-handover': ['ADMIN', 'STORE_MANAGER', 'CASHIER', 'WAREHOUSE_STAFF'],
  'reorder-predictor': ['ADMIN', 'STORE_MANAGER', 'CASHIER', 'WAREHOUSE_STAFF'],
  'stock-transfer': ['ADMIN', 'STORE_MANAGER', 'CASHIER', 'WAREHOUSE_STAFF'],
  'audit-log': ['ADMIN', 'STORE_MANAGER'],
  'store-settings': ['ADMIN', 'STORE_MANAGER'],
  'user-management': ['ADMIN']
};

function getDefaultTabForRole(roleCode) {
  if (roleCode === 'CASHIER' || roleCode === 'WAREHOUSE_STAFF') return 'pos-checkout';
  return 'dashboard';
}

function getSafeTabForUser(requestedTab, user) {
  const role = (user?.roleCode || 'CASHIER').toUpperCase();
  if (role === 'ADMIN' && VALID_TABS.includes(requestedTab)) {
    return requestedTab;
  }
  const allowed = TAB_ALLOWED_ROLES[requestedTab];
  if (allowed && allowed.includes(role)) {
    return requestedTab;
  }
  return getDefaultTabForRole(role);
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (saved && token) {
      try { 
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null; // Mặc định vào trang /login (LoginView) nếu chưa có phiên đăng nhập
  });

  // Khóa cố định Giao diện Sáng (100% Light Mode) để trình chiếu rõ nét trên máy chiếu
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('lhu_mart_theme', 'light');
  }, []);

  const [activeTab, setActiveTab] = useState(() => {
    const pathSlug = window.location.pathname.replace(/^\/+/, '');
    let savedUserObj = null;
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        savedUserObj = JSON.parse(savedUser);
      } catch (e) {}
    }
    if (VALID_TABS.includes(pathSlug)) {
      return savedUserObj ? getSafeTabForUser(pathSlug, savedUserObj) : pathSlug;
    }
    if (savedUserObj) {
      return getDefaultTabForRole(savedUserObj?.roleCode);
    }
    return 'dashboard';
  });
  const isAdmin = currentUser?.roleCode === 'ADMIN';
  const currentRole = currentUser?.roleCode || 'GUEST';
  const [showAdminModal, setShowAdminModal] = useState(false);
  
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [disposals, setDisposals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [recentIntakes, setRecentIntakes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liveStats, setLiveStats] = useState(null);
  const [storeProfile, setStoreProfile] = useState(null);
  const [isConnectedToSql, setIsConnectedToSql] = useState(false);

  // Đồng bộ URL trình duyệt với trạng thái đăng nhập (/login), phân hệ đang mở và chốt chặn RBAC
  useEffect(() => {
    if (!currentUser) {
      if (window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
      document.title = 'Đăng nhập (/login) | LHU Mart - Spoilage Predictor';
    } else {
      const safeTab = getSafeTabForUser(activeTab, currentUser);
      if (safeTab !== activeTab) {
        setActiveTab(safeTab);
        window.history.replaceState(null, '', `/${safeTab}`);
        return;
      }
      const targetPath = `/${safeTab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
      document.title = `LHU Mart (${currentUser.roleCode}) | Quản trị Chuỗi cung ứng Chống lãng phí`;
    }
  }, [currentUser, activeTab]);

  // Hỗ trợ nút Back/Forward của trình duyệt, truy cập trực tiếp đường dẫn /login và sự kiện hết hạn JWT (401)
  useEffect(() => {
    const handlePopState = () => {
      const slug = window.location.pathname.replace(/^\/+/, '');
      if (slug === 'login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentUser(null);
      } else if (VALID_TABS.includes(slug)) {
        setActiveTab(prev => {
          const safe = currentUser ? getSafeTabForUser(slug, currentUser) : slug;
          if (safe !== slug) {
            window.history.replaceState(null, '', `/${safe}`);
          }
          return safe;
        });
      }
    };

    const handleAuthExpired = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setCurrentUser(null);
      if (window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [currentUser]);

  // Xác thực lại phiên JWT với máy chủ khi khởi động (Mục 4.0 SSOT)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !currentUser) return;
    let mounted = true;
    api.apiGetMe()
      .then((res) => {
        if (!mounted) return;
        if (res && res.success && res.data) {
          setCurrentUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } else if (res && res.success === false) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setCurrentUser(null);
        }
      })
      .catch(() => {
        // Giữ phiên local nếu Backend đang khởi động
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLoginSuccess = (user, token) => {
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setCurrentUser(user);
    
    // Tự động chuyển tab & URL theo thẩm quyền vai trò (Mục 4 & Mục 16 Đặc tả SSOT)
    const nextTab = getDefaultTabForRole(user.roleCode);
    setActiveTab(nextTab);
    window.history.pushState(null, '', `/${nextTab}`);
    loadLiveDatabaseData();
  };

  const handleLogout = async () => {
    try {
      await api.apiLogout();
    } catch (e) {
      console.warn('Lỗi gọi API đăng xuất:', e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setCurrentUser(null);
      window.history.pushState(null, '', '/login');
    }
  };

  const handleSwitchUser = async (targetUsername, password) => {
    try {
      const res = await api.apiLogin(targetUsername, password);
      if (res.success && res.data) {
        handleLoginSuccess(res.data.user, res.data.token);
        return { success: true };
      }
      return { success: false, message: res.message || 'Mật khẩu không chính xác' };
    } catch (e) {
      console.error('Lỗi chuyển đổi vai trò:', e);
      return { success: false, message: e.message || 'Lỗi kết nối máy chủ khi chuyển đổi ca' };
    }
  };

  const [weather, setWeather] = useState({
    temp: 32,
    condition: 'SUNNY',
    isHoliday: false,
    location: 'TP. Biên Hòa',
    label: 'Nắng nóng (Đồng bộ thời gian thực)'
  });
  const [isSyncingWeather, setIsSyncingWeather] = useState(false);
  const [preselectedDisposalBatchId, setPreselectedDisposalBatchId] = useState(null);

  // Đồng bộ thời tiết thời gian thực TP. Biên Hòa qua Open-Meteo API (Mục 26.2 SSOT)
  const handleSyncRealtimeWeather = async () => {
    setIsSyncingWeather(true);
    try {
      const live = await fetchRealtimeWeatherBienHoa();
      if (live && live.success) {
        setWeather(prev => ({
          ...prev,
          temp: live.temp,
          condition: live.condition,
          label: live.label,
          location: live.location,
          updatedAt: live.updatedAt
        }));
      }
    } catch (e) {
      console.warn("Lỗi đồng bộ thời tiết Open-Meteo:", e);
    } finally {
      setIsSyncingWeather(false);
    }
  };

  // Cập nhật trạng thái cửa hàng LHU Mart (OPEN, CLOSED, INVENTORY, SUSPENDED)
  const handleUpdateStoreStatus = async (newStatus) => {
    try {
      const res = await api.apiUpdateStoreProfile({ status: newStatus });
      if (res && res.success && res.data) {
        setStoreProfile(res.data);
        return { success: true, data: res.data };
      }
      return { success: false, message: res?.message || 'Không thể cập nhật trạng thái cửa hàng!' };
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái cửa hàng:", err);
      return { success: false, message: err.message };
    }
  };

  // Load Real Data from Microsoft SQL Server LocalDB via Backend API
  const loadLiveDatabaseData = async (forceAudit = false) => {
    try {
      const shouldFetchAudit = forceAudit || activeTab === 'audit-log' || isAdmin || currentRole === 'STORE_MANAGER';
      const [prods, bats, disps, logs, stats, storeProf] = await Promise.all([
        api.fetchProducts(),
        api.fetchBatches(),
        api.fetchDisposals(),
        shouldFetchAudit ? api.fetchAuditLogs() : Promise.resolve(null),
        api.fetchDashboardStats(),
        api.apiGetStoreProfile()
      ]);

      if (Array.isArray(prods)) setProducts(prods);
      if (Array.isArray(bats)) {
        setBatches(bats);
        // Sort by id descending so the latest received batches appear first
        const sortedByRecent = [...bats].sort((a, b) => b.id - a.id);
        setRecentIntakes(sortedByRecent);
      }
      if (Array.isArray(disps)) setDisposals(disps);
      if (Array.isArray(logs)) setAuditLogs(logs);
      if (stats) setLiveStats(stats);
      if (storeProf) setStoreProfile(storeProf);
      setIsConnectedToSql(true);
    } catch (err) {
      console.warn("Backend API not reachable:", err);
      setIsConnectedToSql(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    loadLiveDatabaseData();
    handleSyncRealtimeWeather();
    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        loadLiveDatabaseData();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.roleCode]);

  // Calculate critical count
  const criticalCount = batches.filter(b => (b.status === 'CRITICAL' || b.alertColor === 'RED') && (b.currentQuantity ?? b.quantity ?? 0) > 0).length;

  // Handler: Process Sale with FEFO Logic (Write directly to SQL Server)
  const handleProcessSale = async (cart, weatherInfo) => {
    try {
      const weatherCond = weatherInfo?.condition || (typeof weatherInfo === 'string' ? weatherInfo : 'NORMAL');
      const isHol = weatherInfo?.isHoliday || false;
      const result = await api.apiProcessFefoSale(cart, weatherCond, isHol);
      if (result && result.success) {
        await loadLiveDatabaseData();
        return result;
      }
      return { 
        success: false, 
        code: result?.code,
        message: result?.message || 'Giao dịch thanh toán POS thất bại từ phía máy chủ!' 
      };
    } catch (err) {
      console.error("Lỗi xuất kho POS:", err);
      return { 
        success: false, 
        code: err.code || 'ERR_POS_CONNECTION',
        message: err.response?.data?.message || err.message || 'Không thể kết nối đến máy chủ POS!' 
      };
    }
  };

  // Handler: Add new batch from DC Intake (Write to SQL Server)
  const handleAddBatch = async (newBatch) => {
    try {
      const res = await api.apiAddBatch(newBatch);
      await loadLiveDatabaseData();
      return res;
    } catch (err) {
      console.error("Error adding batch:", err);
      return { success: false, message: err.message };
    }
  };

  // Handler: Quick Discount on near-expiry batch (Update in SQL Server)
  const handleQuickDiscount = async (batchId, percent = 30) => {
    try {
      const res = await api.apiApplyDiscount(batchId, percent);
      await loadLiveDatabaseData();
      return res;
    } catch (err) {
      console.error("Lỗi áp dụng giảm giá Quick Markdown:", err);
      return { success: false, message: err.message };
    }
  };

  // Handler: Rotate Shelf (Persist to SQL Server and update UI)
  const handleRotateShelf = async (batchId) => {
    try {
      const res = await api.apiRotateShelf(batchId);
      await loadLiveDatabaseData();
      return res;
    } catch (err) {
      console.error("Lỗi đảo kệ trưng bày:", err);
      return { success: false, message: err.message };
    }
  };

  // Handler: Create Disposal Record (Write to SQL Server)
  const handleCreateDisposal = async (newRecord) => {
    try {
      const res = await api.apiCreateDisposal(newRecord);
      await loadLiveDatabaseData();
      return res;
    } catch (err) {
      console.error("Lỗi lập phiếu tiêu hủy:", err);
      return { success: false, message: err.message };
    }
  };

  // Handler: Approve Disposal (Write to SQL Server via PATCH /api/spoilage/:id/approve)
  const handleApproveDisposal = async (disposalId) => {
    try {
      const res = await api.apiApproveDisposal(disposalId);
      await loadLiveDatabaseData();
      return res;
    } catch (err) {
      console.error("Lỗi phê duyệt tiêu hủy:", err);
      return { success: false, message: err.message };
    }
  };

  // Handler: Add New Product to System Catalog (Write to SQL Server)
  const handleAddNewProduct = async (productData) => {
    try {
      const res = await api.apiCreateProduct(productData);
      if (res && res.success) {
        await loadLiveDatabaseData();
      }
      return res;
    } catch (err) {
      console.error("Failed to create product:", err);
      return { success: false, message: err.message };
    }
  };

  // Handler: Update Product in System Catalog (Write to SQL Server)
  const handleUpdateProduct = async (id, productData) => {
    try {
      const res = await api.apiUpdateProduct(id, productData);
      if (res && res.success) {
        await loadLiveDatabaseData();
      }
      return res;
    } catch (err) {
      console.error("Failed to update product:", err);
      return { success: false, message: err.message };
    }
  };

  // Handler: Soft Delete Product (Set isActive = 0 in SQL Server)
  const handleDeleteProduct = async (id) => {
    try {
      const res = await api.apiDeleteProduct(id);
      if (res && res.success) {
        await loadLiveDatabaseData();
      }
      return res;
    } catch (err) {
      console.error("Failed to delete product:", err);
      return { success: false, message: err.message };
    }
  };

  // Handler: Gửi Đơn Đặt Hàng PO (Purchase Order) về Kho tổng DC Biên Hòa
  const handleSendPo = async (product, qty) => {
    const orderQty = Math.max(1, Number(qty) || 1);
    const unitCost = Number(product?.costPrice) > 0 ? Number(product.costPrice) : 25000;
    const expectedDeliveryDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const poPayload = {
      supplierId: 1,
      expectedDeliveryDate,
      notes: `Đơn đặt hàng bổ sung ROP gửi Kho tổng DC Biên Hòa cho ${product?.name || 'Sản phẩm'} (+${orderQty} ${product?.unit || 'đơn vị'})`,
      items: [
        {
          productId: product.id,
          currentStockAtOrder: Number(product?.currentStock || 0),
          suggestedQuantity: orderQty,
          approvedQuantity: orderQty,
          unitCost,
          totalLineCost: orderQty * unitCost
        }
      ]
    };

    try {
      const res = await api.apiCreatePurchaseOrder(poPayload);
      await loadLiveDatabaseData();
      const orderCode = res?.data?.orderCode || res?.orderCode || `PO-DC-${Date.now().toString().slice(-6)}`;
      return { success: true, orderCode, qty: orderQty, ...res };
    } catch (err) {
      console.error("Lỗi khi tạo đơn đặt hàng PO gửi DC:", err);
      return { success: false, message: err.message };
    }
  };

  // Nếu chưa đăng nhập -> Hiển thị Trang Đăng Nhập Riêng (/login)
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', color: 'var(--text-main)', transition: 'background-color 0.2s ease, color 0.2s ease' }}>
      
      {/* Top Header */}
      <Header 
        currentUser={currentUser}
        currentRole={currentRole}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        criticalCount={criticalCount}
        weather={weather}
        setWeather={setWeather}
        batches={batches}
        storeProfile={storeProfile}
        onUpdateStoreStatus={handleUpdateStoreStatus}
        onSyncWeather={handleSyncRealtimeWeather}
        isSyncingWeather={isSyncingWeather}
        onNavigateToFefo={() => setActiveTab('fefo-monitor')}
        onQuickDiscount={handleQuickDiscount}
        onRotateShelf={handleRotateShelf}
        onNavigateToUserManagement={() => setActiveTab('user-management')}
      />

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* Navigation Sidebar (Tự động lọc menu theo vai trò RBAC) */}
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentRole={currentRole}
          currentUser={currentUser}
          criticalCount={criticalCount}
        />

        {/* Dynamic Workspace */}
        <main style={{ flex: 1, padding: '16px 24px', overflowY: 'auto', maxHeight: 'calc(100vh - 73px)' }}>
          <ErrorBoundary>
            {isLoading && products.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
                <div style={{ width: '42px', height: '42px', border: '3px solid rgba(16, 185, 129, 0.2)', borderTopColor: 'var(--safe-green)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                  Đang nạp dữ liệu từ Microsoft SQL Server LocalDB...
                </div>
              </div>
            ) : (
              <>
              {activeTab === 'dashboard' && (
                <DashboardView 
                  batches={batches}
                  products={products}
                  disposals={disposals}
                  liveStats={liveStats}
                  setActiveTab={setActiveTab}
                  onQuickDiscount={handleQuickDiscount}
                  onRotateShelf={handleRotateShelf}
                  currentUser={currentUser}
                  currentRole={currentRole}
                  isAdmin={isAdmin}
                  onRequestAdminLogin={() => setShowAdminModal(true)}
                />
              )}

              {activeTab === 'fefo-monitor' && (
                <FefoMonitorView 
                  batches={batches}
                  products={products}
                  storeProfile={storeProfile}
                  currentUser={currentUser}
                  currentRole={currentRole}
                  onQuickDiscount={handleQuickDiscount}
                  onRotateShelf={handleRotateShelf}
                  onOpenDisposalModal={(batch) => {
                    setPreselectedDisposalBatchId(batch.id);
                    setActiveTab('spoilage-disposal');
                  }}
                  isAdmin={isAdmin}
                  onRequestAdminLogin={() => setShowAdminModal(true)}
                />
              )}

              {activeTab === 'pos-checkout' && (
                <PosCheckoutView 
                  products={products}
                  batches={batches}
                  onProcessSale={handleProcessSale}
                  weather={weather}
                  setWeather={setWeather}
                  currentUser={currentUser}
                  storeProfile={storeProfile}
                />
              )}

              {activeTab === 'dc-intake' && (
                <DcIntakeView 
                  products={products}
                  batches={batches}
                  onAddBatch={handleAddBatch}
                  onAddNewProduct={handleAddNewProduct}
                  recentIntakes={recentIntakes}
                  isAdmin={isAdmin}
                  currentRole={currentRole}
                  currentUser={currentUser}
                  storeProfile={storeProfile}
                  onRefreshData={loadLiveDatabaseData}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'product-catalog' && (
                <ProductCatalogView 
                  products={products}
                  onAddNewProduct={handleAddNewProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  isAdmin={isAdmin}
                  currentRole={currentRole}
                />
              )}

              {activeTab === 'spoilage-disposal' && (
                <SpoilageDisposalView 
                  disposals={disposals}
                  batches={batches}
                  products={products}
                  currentUser={currentUser}
                  currentRole={currentRole}
                  isAdmin={isAdmin}
                  storeProfile={storeProfile}
                  onCreateDisposal={handleCreateDisposal}
                  onApproveDisposal={handleApproveDisposal}
                  preselectedBatchId={preselectedDisposalBatchId}
                  onRequestAdminLogin={() => setShowAdminModal(true)}
                />
              )}

              {activeTab === 'shift-handover' && (
                <ShiftHandoverView 
                  currentUser={currentUser}
                  batches={batches}
                  disposals={disposals}
                  liveStats={liveStats}
                  storeProfile={storeProfile}
                />
              )}

              {activeTab === 'reorder-predictor' && (
                <ReorderPredictorView 
                  products={products}
                  batches={batches}
                  storeProfile={storeProfile}
                  onSendPo={handleSendPo}
                  onQuickDiscount={handleQuickDiscount}
                  isAdmin={isAdmin}
                  currentRole={currentRole}
                  onRequestAdminLogin={() => setShowAdminModal(true)}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'stock-transfer' && (
                <StockTransferView
                  currentUser={currentUser}
                  currentRole={currentRole}
                  weather={weather}
                  onRefreshData={loadLiveDatabaseData}
                />
              )}

              {activeTab === 'audit-log' && (
                <AuditLogView 
                  auditLogs={auditLogs}
                  isAdmin={isAdmin || currentRole === 'STORE_MANAGER'}
                  onRequestAdminLogin={() => setShowAdminModal(true)}
                />
              )}

              {activeTab === 'store-settings' && (
                <StoreSettingsView 
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  storeProfile={storeProfile}
                  products={products}
                  batches={batches}
                  onProfileUpdated={(updated) => {
                    setStoreProfile(updated);
                    loadLiveDatabaseData();
                  }}
                  onNavigateToAuditLog={() => setActiveTab('audit-log')}
                />
              )}

              {activeTab === 'user-management' && (
                <UserManagementView 
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  onNavigateToAuditLog={() => setActiveTab('audit-log')}
                />
              )}
            </>
          )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Modal Xác thực Quyền Quản trị viên (Admin Login Override) */}
      {showAdminModal && (
        <AdminLoginModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          onSuccess={(user, token) => {
            handleLoginSuccess(user, token);
            setShowAdminModal(false);
          }}
        />
      )}

    </div>
  );
}
