// src/App.jsx
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import StoreManagementView from './components/StoreManagementView';
import InventoryManagementView from './components/InventoryManagementView';
import AiForecastView from './components/AiForecastView';
import SmartOrderingView from './components/SmartOrderingView';
import StockTransferView from './components/StockTransferView';
import SpoilageAlertsView from './components/SpoilageAlertsView';
import ReportsAnalyticsView from './components/ReportsAnalyticsView';
import SettingsIntegrationView from './components/SettingsIntegrationView';
import AdminLoginModal from './components/AdminLoginModal';
import ErrorBoundary from './components/ErrorBoundary';

import * as api from './api';
import { fetchRealtimeEnvironment } from './utils/weatherService';
import {
  VALID_TABS,
  canAccessPage,
  getDefaultTabForUser,
  getSafeTabForUser,
  resolveLegacyRoute,
  normalizeRole
} from './utils/pagePermissions';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (saved && token) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const initialRoute = resolveLegacyRoute(window.location.pathname);

  const [activeTab, setActiveTab] = useState(() => {
    let savedUserObj = null;
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) savedUserObj = JSON.parse(savedUser);
    } catch {}
    if (initialRoute.tab) {
      return savedUserObj ? getSafeTabForUser(initialRoute.tab, savedUserObj) : initialRoute.tab;
    }
    if (savedUserObj) return getDefaultTabForUser(savedUserObj);
    return 'dashboard';
  });

  const [routeSubTab, setRouteSubTab] = useState(initialRoute.subTab);

  const roleCode = normalizeRole(currentUser?.roleCode || currentUser?.actorCode);
  const isAdmin = roleCode === 'ADMIN';
  const currentRole = currentUser?.roleCode || 'GUEST';

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    const r = normalizeRole(currentUser?.roleCode || currentUser?.actorCode);
    return r === 'ADMIN' ? 'ALL' : String(currentUser?.storeId || 1);
  });
  const effectiveSelectedStoreId = isAdmin ? selectedStoreId : String(currentUser?.storeId || 1);

  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [disposals, setDisposals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [storesList, setStoresList] = useState([]);
  const [pendingTransfersCount, setPendingTransfersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [liveStats, setLiveStats] = useState(null);
  const [storeProfile, setStoreProfile] = useState(null);
  const [enterpriseConfig, setEnterpriseConfig] = useState({
    enterpriseName: 'SmartSupply AI Retail Chain',
    hasCentralWarehouse: true,
    centralWarehouseName: 'Kho trung tâm (DC)',
    managerPoApprovalLimit: 5000000
  });

  const activeStoresCount = storesList.filter(s => String(s.status || 'OPEN').toUpperCase() !== 'SUSPENDED').length;
  const isSingleStore = Boolean(
    (storesList.length > 0 && activeStoresCount <= 1) ||
    storeProfile?.isSingleStore ||
    (storeProfile?.chainStoreCount !== undefined && Number(storeProfile.chainStoreCount) <= 1)
  );

  // Đồng bộ URL với trang đang mở (9 trang SmartSupply AI)
  useEffect(() => {
    if (!currentUser) {
      if (window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
      document.title = 'Đăng nhập | SmartSupply AI';
    } else {
      const safeTab = getSafeTabForUser(activeTab, currentUser, isSingleStore);
      if (safeTab !== activeTab) {
        setActiveTab(safeTab);
        window.history.replaceState(null, '', `/${safeTab}`);
        return;
      }
      const targetPath = `/${safeTab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
      document.title = `SmartSupply AI (${roleCode === 'ADMIN' ? 'OWNER' : roleCode === 'STORE_MANAGER' ? 'MANAGER' : 'STAFF'})`;
    }
  }, [currentUser, activeTab, isSingleStore, roleCode]);

  useEffect(() => {
    const handlePopState = () => {
      const slug = window.location.pathname.replace(/^\/+/, '');
      if (slug === 'login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentUser(null);
        return;
      }
      const resolved = resolveLegacyRoute(slug);
      if (resolved.tab) {
        setRouteSubTab(resolved.subTab);
        const safe = currentUser ? getSafeTabForUser(resolved.tab, currentUser, isSingleStore) : resolved.tab;
        setActiveTab(safe);
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
  }, [currentUser, isSingleStore]);

  // Kiểm tra phiên JWT khi khởi động
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
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const [gpsCoords, setGpsCoords] = useState(null);
  const [weather, setWeather] = useState({
    temp: null,
    apparentTemp: null,
    humidity: null,
    precipitation: null,
    windSpeed: null,
    condition: 'AUTO',
    isHoliday: false,
    calendarLabel: 'Đang đồng bộ...',
    location: 'Đang định vị...',
    label: 'Chưa đồng bộ',
    dailyForecast: [],
    online: false,
    updatedAt: null
  });
  const [isSyncingWeather, setIsSyncingWeather] = useState(false);

  const handleSyncRealtimeWeather = async (overrideGps = gpsCoords) => {
    setIsSyncingWeather(true);
    try {
      const targetStore = isAdmin ? selectedStoreId : String(currentUser?.storeId || 1);
      const live = await fetchRealtimeEnvironment({
        storeId: targetStore,
        lat: overrideGps?.lat ?? null,
        lon: overrideGps?.lon ?? null,
        locationName: overrideGps?.locationName || ''
      });
      if (live && live.success) {
        setWeather({
          ...live,
          lat: overrideGps?.lat ?? live.coordinates?.lat ?? null,
          lon: overrideGps?.lon ?? live.coordinates?.lon ?? null
        });
      } else if (live) {
        setWeather(prev => ({
          ...prev,
          online: false,
          temp: null,
          label: live.label || 'Mất kết nối thời tiết',
          error: live.error
        }));
      }
    } catch {}
    finally {
      setIsSyncingWeather(false);
    }
  };

  const handleUseDeviceLocation = () => {
    if (!navigator.geolocation) {
      setWeather(prev => ({ ...prev, error: 'Trình duyệt không hỗ trợ GPS.' }));
      return;
    }
    setIsSyncingWeather(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(4)),
          lon: Number(pos.coords.longitude.toFixed(4)),
          locationName: 'Vị trí hiện tại (GPS)'
        };
        setGpsCoords(coords);
        handleSyncRealtimeWeather(coords);
      },
      () => {
        setIsSyncingWeather(false);
        setWeather(prev => ({ ...prev, error: 'Không thể truy cập vị trí GPS.' }));
      },
      { enableHighAccuracy: false, timeout: 7000 }
    );
  };

  const effectivePagesKey = Array.isArray(currentUser?.effectivePages)
    ? currentUser.effectivePages.join(',')
    : '';

  const loadLiveDatabaseData = async (storeScopeOverride = null) => {
    try {
      const effectiveStoreScope = storeScopeOverride !== null
        ? storeScopeOverride
        : (isAdmin ? selectedStoreId : String(currentUser?.storeId || 1));

      const canReadDashboard = canAccessPage(currentUser, 'dashboard', isSingleStore);
      const canReadAudit = isAdmin || roleCode === 'STORE_MANAGER' || canAccessPage(currentUser, 'settings-integration', isSingleStore);
      const canReadDisposals = canAccessPage(currentUser, 'spoilage-alerts', isSingleStore) || canReadDashboard;

      const [prods, bats, disps, logs, stats, storeProf, allStores, trfRes, entRes] = await Promise.all([
        api.fetchProducts().catch(() => []),
        api.fetchBatches(effectiveStoreScope).catch(() => []),
        canReadDisposals ? api.fetchDisposals(effectiveStoreScope).catch(() => []) : Promise.resolve([]),
        canReadAudit ? api.fetchAuditLogs().catch(() => []) : Promise.resolve([]),
        canReadDashboard ? api.fetchDashboardOverview(effectiveStoreScope).catch(() => null) : Promise.resolve(null),
        api.apiGetStoreProfile(effectiveStoreScope === 'ALL' ? null : effectiveStoreScope).catch(() => null),
        api.apiGetAllStores().catch(() => []),
        api.fetchStockTransfers('ALL').catch(() => null),
        api.apiGetEnterpriseConfig().catch(() => null)
      ]);

      if (Array.isArray(prods)) setProducts(prods);
      if (Array.isArray(bats)) setBatches(bats);
      if (Array.isArray(disps)) setDisposals(disps);
      if (Array.isArray(logs)) setAuditLogs(logs);
      if (stats) setLiveStats(stats);
      if (storeProf) setStoreProfile(storeProf);
      if (Array.isArray(allStores)) setStoresList(allStores);
      if (entRes && entRes.success && entRes.data) setEnterpriseConfig(entRes.data);
      if (trfRes && Array.isArray(trfRes.data)) {
        setPendingTransfersCount(
          trfRes.data.filter(t => ['PROPOSED', 'PENDING'].includes(String(t.status).toUpperCase())).length
        );
      }
    } catch (err) {
      console.warn('Lỗi tải dữ liệu hệ thống:', err);
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
    }, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.roleCode, selectedStoreId, effectivePagesKey]);

  const handleLoginSuccess = (user, token) => {
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setCurrentUser(user);
    const nextStoreScope = normalizeRole(user?.roleCode || user?.actorCode) === 'ADMIN'
      ? 'ALL'
      : String(user?.storeId || 1);
    setSelectedStoreId(nextStoreScope);
    const nextTab = getDefaultTabForUser(user, isSingleStore);
    setActiveTab(nextTab);
    setRouteSubTab(null);
    window.history.pushState(null, '', `/${nextTab}`);
    loadLiveDatabaseData(nextStoreScope);
  };

  const handleLogout = async () => {
    try {
      await api.apiLogout();
    } catch {}
    finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setCurrentUser(null);
      window.history.pushState(null, '', '/login');
    }
  };

  const handleSwitchUser = async (targetUsername, password) => {
    try {
      const res = await api.apiLogin(targetUsername, password);
      if (res && res.success && res.data) {
        handleLoginSuccess(res.data.user, res.data.token);
        return { success: true };
      }
      return { success: false, message: res?.message || 'Mật khẩu không chính xác.' };
    } catch (e) {
      return { success: false, message: e.message || 'Lỗi kết nối máy chủ.' };
    }
  };

  const handleNavigate = (tabId, subTab = null) => {
    setRouteSubTab(subTab);
    setActiveTab(tabId);
  };

  // Handlers CRUD nghiệp vụ
  const handleAddBatch = async (payload) => {
    const res = payload?.batches
      ? await api.apiReceiveDCInbound(payload)
      : await api.apiAddBatch(payload);
    if (res && res.success) await loadLiveDatabaseData();
    return res;
  };

  const handleQuickDiscount = async (batchId, percent = 30) => {
    const res = await api.apiApplyDiscount(batchId, percent);
    if (res && res.success) await loadLiveDatabaseData();
    return res;
  };

  const handleRotateShelf = async (batchId) => {
    const res = await api.apiRotateShelf(batchId);
    if (res && res.success) await loadLiveDatabaseData();
    return res;
  };

  const handleCreateDisposal = async (payload) => {
    const res = await api.apiCreateDisposal(payload);
    if (res && res.success) await loadLiveDatabaseData();
    return res;
  };

  const handleBulkDisposal = async (payload) => {
    const res = await api.apiCreateBulkDisposal(payload);
    if (res && res.success) await loadLiveDatabaseData();
    return res;
  };

  const handleApproveDisposal = async (disposalId) => {
    const res = await api.apiApproveDisposal(disposalId);
    if (res && res.success) await loadLiveDatabaseData();
    return res;
  };

  const handleAddNewProduct = async (productData) => {
    const res = await api.apiCreateProduct(productData);
    if (res && res.success) await loadLiveDatabaseData();
    return res;
  };

  const handleUpdateProduct = async (id, productData) => {
    const res = await api.apiUpdateProduct(id, productData);
    if (res && res.success) await loadLiveDatabaseData();
    return res;
  };

  const handleDeleteProduct = async (id) => {
    const res = await api.apiDeleteProduct(id);
    if (res && res.success) await loadLiveDatabaseData();
    return res;
  };

  const criticalCount = batches.filter(
    b => (b.status === 'CRITICAL' || b.alertColor === 'RED') && (b.currentQuantity ?? b.quantity ?? 0) > 0
  ).length;

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="ss-shell">
      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        activeTab={activeTab}
        onSelectTab={(tab) => handleNavigate(tab)}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        criticalCount={criticalCount}
        weather={weather}
        setWeather={setWeather}
        batches={batches}
        storeProfile={storeProfile}
        enterpriseConfig={enterpriseConfig}
        storesList={storesList}
        selectedStoreId={effectiveSelectedStoreId}
        onSelectStore={(val) => {
          setGpsCoords(null);
          setSelectedStoreId(val);
        }}
        isSingleStore={isSingleStore}
        onSyncWeather={() => handleSyncRealtimeWeather(gpsCoords)}
        onUseDeviceLocation={handleUseDeviceLocation}
        isSyncingWeather={isSyncingWeather}
        onQuickDiscount={handleQuickDiscount}
        onRotateShelf={handleRotateShelf}
      />

      <div className="ss-shell-body">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => handleNavigate(tab)}
          currentRole={currentRole}
          currentUser={currentUser}
          criticalCount={criticalCount}
          pendingTransferCount={pendingTransfersCount}
          isSingleStore={isSingleStore}
        />

        <main className="ss-main">
          <ErrorBoundary key={activeTab}>
            {isLoading && products.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '14px' }}>
                <div style={{ width: '38px', height: '38px', border: '3px solid var(--primary-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600 }}>
                  Đang nạp dữ liệu SmartSupply AI từ SQL Server...
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
                    setActiveTab={(tab) => handleNavigate(tab)}
                    onQuickDiscount={handleQuickDiscount}
                    onRotateShelf={handleRotateShelf}
                    currentUser={currentUser}
                    currentRole={currentRole}
                    isAdmin={isAdmin}
                    selectedStoreId={effectiveSelectedStoreId}
                    onSelectStore={setSelectedStoreId}
                    storesList={storesList}
                    weather={weather}
                    isSingleStore={isSingleStore}
                  />
                )}

                {activeTab === 'store-management' && (
                  <StoreManagementView
                    currentUser={currentUser}
                    isAdmin={isAdmin}
                    liveStats={liveStats}
                    storesList={storesList}
                    selectedStoreId={effectiveSelectedStoreId}
                    onSelectStore={setSelectedStoreId}
                    onStoresChanged={loadLiveDatabaseData}
                    setActiveTab={(tab) => handleNavigate(tab)}
                  />
                )}

                {activeTab === 'inventory-management' && (
                  <InventoryManagementView
                    products={products}
                    batches={batches}
                    storeProfile={storeProfile}
                    storesList={storesList}
                    weather={weather}
                    currentUser={currentUser}
                    currentRole={currentRole}
                    isAdmin={isAdmin}
                    selectedStoreId={effectiveSelectedStoreId}
                    onAddBatch={handleAddBatch}
                    onAddNewProduct={handleAddNewProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                    onRefreshData={loadLiveDatabaseData}
                    setActiveTab={(tab) => handleNavigate(tab)}
                    initialSubTab={routeSubTab || 'batches'}
                  />
                )}

                {activeTab === 'ai-forecast' && (
                  <AiForecastView
                    products={products}
                    batches={batches}
                    currentUser={currentUser}
                    currentRole={currentRole}
                    isAdmin={isAdmin}
                    selectedStoreId={effectiveSelectedStoreId}
                    onSelectStore={setSelectedStoreId}
                    storesList={storesList}
                    weather={weather}
                    setWeather={setWeather}
                    onSyncWeather={() => handleSyncRealtimeWeather(gpsCoords)}
                    onUseDeviceLocation={handleUseDeviceLocation}
                    isSyncingWeather={isSyncingWeather}
                    gpsCoords={gpsCoords}
                    isSingleStore={isSingleStore}
                    setActiveTab={(tab) => handleNavigate(tab)}
                  />
                )}

                {activeTab === 'smart-ordering' && (
                  <SmartOrderingView
                    products={products}
                    batches={batches}
                    storeProfile={storeProfile}
                    enterpriseConfig={enterpriseConfig}
                    currentUser={currentUser}
                    currentRole={currentRole}
                    isAdmin={isAdmin}
                    selectedStoreId={effectiveSelectedStoreId}
                    onSelectStore={setSelectedStoreId}
                    storesList={storesList}
                    weather={weather}
                    isSingleStore={isSingleStore}
                    onRequestAdminLogin={() => setShowAdminModal(true)}
                    onRefreshData={loadLiveDatabaseData}
                    setActiveTab={(tab) => handleNavigate(tab)}
                    initialSubTab={routeSubTab || 'proposals'}
                  />
                )}

                {activeTab === 'stock-transfer' && (
                  <StockTransferView
                    currentUser={currentUser}
                    currentRole={currentRole}
                    weather={weather}
                    isSingleStore={isSingleStore}
                    storesList={storesList}
                    onRefreshData={loadLiveDatabaseData}
                  />
                )}

                {activeTab === 'spoilage-alerts' && (
                  <SpoilageAlertsView
                    batches={batches}
                    products={products}
                    disposals={disposals}
                    storeProfile={storeProfile}
                    currentUser={currentUser}
                    currentRole={currentRole}
                    isAdmin={isAdmin}
                    selectedStoreId={effectiveSelectedStoreId}
                    weather={weather}
                    isSingleStore={isSingleStore}
                    onQuickDiscount={handleQuickDiscount}
                    onRotateShelf={handleRotateShelf}
                    onCreateDisposal={handleCreateDisposal}
                    onBulkDisposal={handleBulkDisposal}
                    onApproveDisposal={handleApproveDisposal}
                    onRefreshData={loadLiveDatabaseData}
                    setActiveTab={(tab) => handleNavigate(tab)}
                    initialSubTab={routeSubTab || 'alerts'}
                  />
                )}

                {activeTab === 'reports-analytics' && (
                  <ReportsAnalyticsView
                    isAdmin={isAdmin}
                    selectedStoreId={effectiveSelectedStoreId}
                    onSelectStore={setSelectedStoreId}
                    storesList={storesList}
                  />
                )}

                {activeTab === 'settings-integration' && (
                  <SettingsIntegrationView
                    currentUser={currentUser}
                    isAdmin={isAdmin}
                    storeProfile={storeProfile}
                    enterpriseConfig={enterpriseConfig}
                    onEnterpriseUpdated={(cfg) => setEnterpriseConfig(cfg)}
                    storesList={storesList}
                    products={products}
                    auditLogs={auditLogs}
                    weather={weather}
                    setWeather={setWeather}
                    onSyncWeather={() => handleSyncRealtimeWeather(gpsCoords)}
                    isSyncingWeather={isSyncingWeather}
                    onProfileUpdated={(updated) => {
                      setStoreProfile(updated);
                      loadLiveDatabaseData();
                    }}
                    onRefreshData={loadLiveDatabaseData}
                    initialSubTab={routeSubTab || 'pos-integration'}
                  />
                )}
              </>
            )}
          </ErrorBoundary>
        </main>
      </div>

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
