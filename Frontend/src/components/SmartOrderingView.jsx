// src/components/SmartOrderingView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  FileText,
  Send,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowLeftRight,
  Zap,
  RefreshCw,
  Info,
  Plus
} from 'lucide-react';
import {
  fetchRopForecast,
  fetchPurchaseOrders,
  apiCreatePurchaseOrder,
  apiUpdatePOStatus,
  apiGetSuppliers
} from '../api';
import PurchaseOrdersSubView from './PurchaseOrdersSubView';
import ModalDialog from './ui/ModalDialog';
import { normalizeRole } from '../utils/pagePermissions';

function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

export default function SmartOrderingView({
  products = [],
  batches = [],
  storeProfile = null,
  enterpriseConfig = null,
  currentUser = null,
  currentRole = 'STORE_MANAGER',
  isAdmin = false,
  selectedStoreId = 'ALL',
  onSelectStore,
  storesList = [],
  weather = { condition: 'NORMAL', isHoliday: false },
  isSingleStore = false,
  onRequestAdminLogin,
  onRefreshData,
  setActiveTab,
  initialSubTab = 'proposals'
}) {
  const roleCode = normalizeRole(currentRole || currentUser?.roleCode);
  const canManagePo = isAdmin || roleCode === 'ADMIN' || roleCode === 'STORE_MANAGER';

  const [subTab, setSubTab] = useState(initialSubTab || 'proposals');
  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]);

  const [ropItems, setRopItems] = useState([]);
  const [ropSummary, setRopSummary] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIONABLE'); // ALL, ACTIONABLE, REORDER, OVERSTOCK
  const [selectedIds, setSelectedIds] = useState([]);
  const [customQtys, setCustomQtys] = useState({});
  const [selectedSupplierId, setSelectedSupplierId] = useState(1);
  const [poNotes, setPoNotes] = useState('');
  const [submittingPo, setSubmittingPo] = useState(false);
  const [toast, setToast] = useState(null);
  const [explainItem, setExplainItem] = useState(null);

  const wCond = weather?.condition || 'NORMAL';
  const isHoliday = Boolean(weather?.isHoliday);

  const loadAll = async () => {
    setLoading(true);
    setLoadingOrders(true);
    try {
      const [ropRes, poRes, supRes] = await Promise.all([
        fetchRopForecast(wCond, isHoliday, selectedStoreId),
        fetchPurchaseOrders(selectedStoreId),
        apiGetSuppliers(false).catch(() => [])
      ]);
      if (ropRes && ropRes.success) {
        const list = ropRes.allForecasts || ropRes.data || [];
        setRopItems(list);
        setRopSummary(ropRes.summary || {});
        const initQtys = {};
        list.forEach(item => {
          initQtys[item.productId] = Number(item.netSuggestedOrderQuantity ?? item.suggestedOrderQuantity ?? 0);
        });
        setCustomQtys(initQtys);
      }
      if (poRes && Array.isArray(poRes.data)) {
        setPurchaseOrders(poRes.data);
      }
      if (Array.isArray(supRes) && supRes.length > 0) {
        setSuppliers(supRes);
        setSelectedSupplierId(supRes[0].id);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu Smart Ordering:', err);
    } finally {
      setLoading(false);
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [selectedStoreId, wCond, isHoliday]);

  const filteredItems = useMemo(() => {
    const q = stripVietnamese(search);
    return ropItems.filter(item => {
      const needOrder = Number(item.netSuggestedOrderQuantity ?? item.suggestedOrderQuantity ?? 0) > 0 && item.netAvailableStock <= item.reorderPoint;
      const hasOverstockRisk = Boolean(item.isRiskOfSpoilage || item.spoilageRiskQty > 0);
      if (statusFilter === 'ACTIONABLE' && !needOrder && !hasOverstockRisk) return false;
      if (statusFilter === 'REORDER' && !needOrder) return false;
      if (statusFilter === 'OVERSTOCK' && !hasOverstockRisk) return false;
      if (q) {
        const hay = `${stripVietnamese(item.productName)} ${stripVietnamese(item.productSku)} ${stripVietnamese(item.categoryName)}`;
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [ropItems, search, statusFilter]);

  const toggleSelect = (prodId) => {
    setSelectedIds(prev => prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]);
  };

  const getRowOrderQty = (item) => {
    const suggested = Number(item.netSuggestedOrderQuantity ?? item.suggestedOrderQuantity ?? 0);
    if (customQtys[item.productId] === undefined) return suggested;
    if (customQtys[item.productId] === '') return 0;
    return Number(customQtys[item.productId]);
  };

  const handleCreateSinglePo = async (item) => {
    if (!canManagePo) return;
    const qty = getRowOrderQty(item);
    if (isNaN(qty) || qty <= 0) {
      setToast({ type: 'error', text: `Sản phẩm "${item.productName}" có SL đặt = 0, không cần tạo đơn PO.` });
      return;
    }
    await submitPurchaseOrder([
      {
        productId: item.productId,
        currentStockAtOrder: Number(item.currentStock || 0),
        suggestedQuantity: Number(item.netSuggestedOrderQuantity ?? item.suggestedOrderQuantity ?? qty),
        approvedQuantity: qty,
        unitCost: Number(item.costPrice || 0),
        totalLineCost: qty * Number(item.costPrice || 0)
      }
    ], `Đơn đặt hàng bổ sung ROP cho ${item.productName} (+${qty} ${item.unit || 'ĐV'})`);
  };

  const handleCreateBatchPo = async () => {
    if (!canManagePo || selectedIds.length === 0) return;
    const items = selectedIds
      .map(id => ropItems.find(r => Number(r.productId) === Number(id)))
      .filter(Boolean)
      .map(item => {
        const qty = getRowOrderQty(item);
        return {
          productId: item.productId,
          currentStockAtOrder: Number(item.currentStock || 0),
          suggestedQuantity: Number(item.netSuggestedOrderQuantity ?? item.suggestedOrderQuantity ?? qty),
          approvedQuantity: qty,
          unitCost: Number(item.costPrice || 0),
          totalLineCost: qty * Number(item.costPrice || 0)
        };
      })
      .filter(it => !isNaN(it.approvedQuantity) && it.approvedQuantity > 0);
    if (items.length === 0) {
      setToast({ type: 'error', text: 'Các sản phẩm được chọn đều có SL đặt = 0.' });
      return;
    }
    await submitPurchaseOrder(items, poNotes.trim() || `Đơn đặt hàng ROP tổng hợp ${items.length} mặt hàng`);
  };

  const submitPurchaseOrder = async (items, defaultNote) => {
    setSubmittingPo(true);
    setToast(null);
    try {
      const targetStoreId = selectedStoreId !== 'ALL' ? Number(selectedStoreId) : Number(currentUser?.storeId || 1);
      const expectedDate = new Date(Date.now() + Number(storeProfile?.defaultLeadTimeDays || 1) * 86400000).toISOString().slice(0, 10);
      const res = await apiCreatePurchaseOrder({
        storeId: targetStoreId,
        supplierId: Number(selectedSupplierId || 1),
        expectedDeliveryDate: expectedDate,
        notes: defaultNote,
        items
      });
      if (res && res.success) {
        setSelectedIds([]);
        setPoNotes('');
        setToast({
          type: 'success',
          text: `Đã tạo thành công đơn đặt hàng ${res.orderCode || res.data?.orderCode || ''} gồm ${items.length} mặt hàng!`
        });
        await loadAll();
        if (onRefreshData) await onRefreshData();
        setSubTab('purchase-orders');
      } else {
        setToast({ type: 'error', text: res?.message || 'Không thể tạo đơn đặt hàng PO.' });
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Lỗi kết nối khi tạo đơn PO.' });
    } finally {
      setSubmittingPo(false);
    }
  };

  const handleUpdatePoStatus = async (orderId, nextStatus) => {
    try {
      const res = await apiUpdatePOStatus(orderId, nextStatus);
      if (res && res.success) {
        setToast({ type: 'success', text: res.message || `Đã cập nhật đơn PO sang ${nextStatus}.` });
        await loadAll();
        if (onRefreshData) await onRefreshData();
      } else {
        setToast({ type: 'error', text: res?.message || 'Không thể cập nhật trạng thái đơn PO.' });
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message });
    }
  };

  const actionableReorderCount = ropItems.filter(r => Number(r.netSuggestedOrderQuantity ?? r.suggestedOrderQuantity ?? 0) > 0 && r.netAvailableStock <= r.reorderPoint).length;
  const overstockRiskCount = ropItems.filter(r => r.isRiskOfSpoilage || r.spoilageRiskQty > 0).length;
  const totalIncomingUnits = ropItems.reduce((s, r) => s + Number(r.incomingQuantity || 0), 0);
  const pendingPoCount = purchaseOrders.filter(o => ['DRAFT', 'PENDING'].includes(String(o.status).toUpperCase())).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Page Header */}
      <div className="ss-page-header">
        <div>
          <h1 className="ss-page-title">Đề xuất Nhập hàng & Duyệt Đơn</h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="ss-btn ss-btn-secondary" onClick={loadAll} disabled={loading}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Làm mới
          </button>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: toast.type === 'error' ? 'var(--danger-red-bg)' : 'var(--safe-green-bg)',
            border: `1px solid ${toast.type === 'error' ? 'var(--danger-red-border)' : 'var(--safe-green-border)'}`,
            color: toast.type === 'error' ? 'var(--danger-red-light)' : 'var(--safe-green-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.text}
          </span>
          <button type="button" onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}>
            Đóng
          </button>
        </div>
      )}

      {/* KPI Row */}
      <div className="ss-kpi-grid">
        <div className="ss-card ss-card-pad">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>SKU cần nhập thêm</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
            {actionableReorderCount} mặt hàng
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Khả dụng ròng ≤ Điểm đặt hàng ROP
          </div>
        </div>

        <div className="ss-card ss-card-pad">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Hàng đang trên đường giao</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-blue-light)', marginTop: '4px' }}>
            {totalIncomingUnits.toLocaleString('vi-VN')} ĐV
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Đã tự động trừ khỏi lượng khuyến nghị nhập
          </div>
        </div>

        <div className="ss-card ss-card-pad">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cảnh báo ứ đọng (DOS &gt; DUE)</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: overstockRiskCount > 0 ? 'var(--warning-yellow-light)' : 'var(--safe-green-light)', marginTop: '4px' }}>
            {overstockRiskCount} mặt hàng
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Khuyến nghị dừng nhập & xả hàng
          </div>
        </div>

        <div className="ss-card ss-card-pad">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Đơn PO chờ duyệt / Tổng đơn</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '4px' }}>
            {pendingPoCount} / {purchaseOrders.length} đơn
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Tổng ngân sách dự kiến: {Number(ropSummary?.totalEstimatedBudget || 0).toLocaleString('vi-VN')} đ
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <section className="ss-card" style={{ overflow: 'hidden' }}>
        <div role="tablist" aria-label="Quản lý đề xuất và đơn đặt hàng" className="ss-tablist">
          <button type="button" role="tab" id="ord-tab-proposals" aria-selected={subTab === 'proposals'} className="ss-tab" onClick={() => setSubTab('proposals')}>
            <ShoppingBag size={15} /> Gợi ý Nhập hàng & So sánh Phương án ({filteredItems.length})
          </button>
          <button type="button" role="tab" id="ord-tab-po" aria-selected={subTab === 'purchase-orders'} className="ss-tab" onClick={() => setSubTab('purchase-orders')}>
            <FileText size={15} /> Danh sách & Duyệt Đơn PO ({purchaseOrders.length})
          </button>
        </div>

        <div style={{ padding: '18px 20px' }}>
          {/* PANEL 1: ĐỀ XUẤT NHẬP HÀNG */}
          <div role="tabpanel" aria-labelledby="ord-tab-proposals" hidden={subTab !== 'proposals'}>
            <search>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                  <input
                    type="search"
                    aria-label="Tìm sản phẩm đề xuất nhập hàng"
                    placeholder="Tìm tên sản phẩm, SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: '300px' }}
                  />
                  <select
                    aria-label="Lọc trạng thái đề xuất"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: 'auto' }}
                  >
                    <option value="ACTIONABLE">Cần xử lý (Thiếu ROP hoặc Ứ đọng)</option>
                    <option value="REORDER">Chỉ SKU cần đặt hàng thêm</option>
                    <option value="OVERSTOCK">Chỉ SKU nguy cơ ứ đọng DOS &gt; DUE</option>
                    <option value="ALL">Tất cả sản phẩm ({ropItems.length})</option>
                  </select>
                </div>

                {canManagePo && selectedIds.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <select
                      aria-label="Chọn nhà cung cấp / DC"
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      style={{ width: 'auto' }}
                    >
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <button
                      type="button"
                      className="ss-btn ss-btn-primary"
                      disabled={submittingPo}
                      onClick={handleCreateBatchPo}
                    >
                      <Send size={14} /> Tạo Đơn PO Gộp ({selectedIds.length} SKU)
                    </button>
                  </div>
                )}
              </div>
            </search>

            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Bảng gợi ý đặt hàng thông minh">
              <table className="ss-table ss-table-responsive">
                <thead>
                  <tr>
                    {canManagePo && <th scope="col" style={{ width: '36px' }}>Chọn</th>}
                    <th scope="col">Sản phẩm</th>
                    <th scope="col">Tồn + Đang giao vs Ngưỡng đặt</th>
                    <th scope="col">Ngày bán vs HSD</th>
                    <th scope="col">Phương án Khuyến nghị</th>
                    <th scope="col">SL Đặt (Quy cách)</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Giải thích & Lập đơn</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={canManagePo ? 7 : 6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        Không có sản phẩm nào khớp điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map(item => {
                      const suggestedNet = Number(item.netSuggestedOrderQuantity ?? item.suggestedOrderQuantity ?? 0);
                      const rowOrderQty = getRowOrderQty(item);
                      const inputQtyVal = customQtys[item.productId] !== undefined ? customQtys[item.productId] : String(suggestedNet);
                      const isOverstock = Boolean(item.isRiskOfSpoilage || item.spoilageRiskQty > 0);
                      const rec = item.aiDecisionComparison?.recommendedOption;
                      const isTransferRec = !isSingleStore && rec === 'INTER_STORE_TRANSFER';
                      const dosLabel = item.daysOfSupply !== null && item.daysOfSupply !== undefined ? `${item.daysOfSupply}d` : '—';
                      const dueLabel = item.earliestBatchDaysLeft !== null && item.earliestBatchDaysLeft !== undefined
                        ? `HSD ${item.earliestBatchDaysLeft}d`
                        : 'Chưa có lô';

                      return (
                        <tr key={item.productId}>
                          {canManagePo && (
                            <td data-label="Chọn">
                              <input
                                type="checkbox"
                                aria-label={`Chọn ${item.productName}`}
                                disabled={rowOrderQty <= 0}
                                checked={selectedIds.includes(item.productId)}
                                onChange={() => toggleSelect(item.productId)}
                                style={{ width: 'auto' }}
                              />
                            </td>
                          )}
                          <td data-label="Sản phẩm">
                            <div style={{ fontWeight: 700 }}>{item.productName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                              {item.productSku} • Dự báo 7d: {item.predictedSales7d} {item.unit}
                            </div>
                          </td>
                          <td data-label="Cân đối ROP" className="num-tabular">
                            <div>
                              Tồn: <strong>{item.currentStock}</strong> + Giao: <strong style={{ color: 'var(--accent-blue-light)' }}>{item.incomingQuantity || 0}</strong>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              Khả dụng: <strong>{item.netAvailableStock ?? item.currentStock}</strong> / ROP: <strong>{item.reorderPoint}</strong>
                            </div>
                          </td>
                          <td data-label="DOS vs DUE" className="num-tabular">
                            <span className={`ss-badge ${isOverstock ? 'ss-badge-warning' : (item.earliestBatchDaysLeft == null ? 'ss-badge-neutral' : 'ss-badge-safe')}`}>
                              {dosLabel} / {dueLabel}
                            </span>
                          </td>
                          <td data-label="Phương án">
                            {isOverstock ? (
                              <span className="ss-badge ss-badge-warning">
                                <Zap size={12} /> Dừng nhập & Xả hàng
                              </span>
                            ) : isTransferRec ? (
                              <span className="ss-badge ss-badge-indigo">
                                <ArrowLeftRight size={12} /> Điều chuyển CN (B)
                              </span>
                            ) : suggestedNet > 0 ? (
                              <span className="ss-badge ss-badge-info">
                                <Truck size={12} /> {rec === 'CENTRAL_WAREHOUSE_PO' ? 'Cấp từ Kho tổng (C)' : 'Nhập từ NCC (A)'}
                              </span>
                            ) : (
                              <span className="ss-badge ss-badge-neutral">Đủ tồn — Giữ nguyên</span>
                            )}
                          </td>
                          <td data-label="SL Đặt" style={{ width: '150px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="text"
                                inputMode="numeric"
                                aria-label={`Số lượng đặt cho ${item.productName}`}
                                disabled={!canManagePo}
                                value={inputQtyVal}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const cleaned = raw === '' ? '' : String(Number(raw.replace(/\D+/g, '') || '0'));
                                  setCustomQtys({ ...customQtys, [item.productId]: cleaned });
                                }}
                                style={{ padding: '5px 8px', width: '84px' }}
                              />
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                                x{item.packSize || 1}
                              </span>
                            </div>
                          </td>
                          <td data-label="Thao tác" style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="ss-btn ss-btn-secondary ss-btn-sm"
                                onClick={() => setExplainItem(item)}
                                title="Xem giải thích nguồn dữ liệu & so sánh 3 phương án"
                              >
                                <Info size={13} /> Giải thích
                              </button>
                              {isTransferRec && !isSingleStore && (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-secondary ss-btn-sm"
                                  onClick={() => setActiveTab && setActiveTab('stock-transfer')}
                                >
                                  Điều chuyển
                                </button>
                              )}
                              {canManagePo && (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-primary ss-btn-sm"
                                  disabled={submittingPo || rowOrderQty <= 0}
                                  title={rowOrderQty <= 0 ? 'Không tạo đơn khi SL đặt = 0' : 'Lập đơn PO cho sản phẩm này'}
                                  onClick={() => handleCreateSinglePo(item)}
                                >
                                  <Plus size={13} /> Tạo PO
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PANEL 2: QUẢN LÝ & DUYỆT ĐƠN PO */}
          <div role="tabpanel" aria-labelledby="ord-tab-po" hidden={subTab !== 'purchase-orders'}>
            <PurchaseOrdersSubView
              orders={purchaseOrders}
              loading={loadingOrders}
              onRefresh={loadAll}
              onUpdateStatus={handleUpdatePoStatus}
              isAdmin={canManagePo}
              isOwner={isAdmin || roleCode === 'ADMIN'}
              managerApprovalLimit={Number(enterpriseConfig?.managerPoApprovalLimit ?? 5000000)}
              onRequestAdminLogin={onRequestAdminLogin}
              storeProfile={storeProfile}
              storesList={storesList}
            />
          </div>
        </div>
      </section>

      {/* Explanation & 3-Option Decision Comparison Dialog */}
      <ModalDialog
        isOpen={Boolean(explainItem)}
        onClose={() => setExplainItem(null)}
        title={explainItem ? `Giải thích Đề xuất: ${explainItem.productName}` : ''}
        subtitle={explainItem ? `SKU: ${explainItem.productSku} • Nguồn: ${explainItem.demandSource === 'ACTUAL_SALES' ? 'Lịch sử bán 14 ngày' : 'Định mức cơ sở'}` : ''}
      >
        {explainItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="ss-card-subtle" style={{ padding: '12px 14px', fontSize: '0.84rem', lineHeight: 1.55 }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{explainItem.aiExplanation}</p>
              <div style={{ marginTop: '8px', display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Tồn: <strong>{explainItem.currentStock}</strong></span>
                <span>Đang giao: <strong>{explainItem.incomingQuantity || 0}</strong></span>
                <span>Dự trữ an toàn: <strong>{explainItem.safetyStock}</strong></span>
                <span>Quy cách: <strong>{explainItem.packSize || 1} {explainItem.unit}/kiện</strong></span>
              </div>
            </div>

            {explainItem.aiDecisionComparison && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>So sánh 3 Phương án Bổ sung & Xử lý:</div>
                {[
                  explainItem.aiDecisionComparison.optionA_OrderPO,
                  explainItem.aiDecisionComparison.optionB_Transfer,
                  explainItem.aiDecisionComparison.optionC_CentralWarehouse,
                  explainItem.aiDecisionComparison.optionC_Hold
                ]
                  .filter(opt => opt && opt.available !== false)
                  .map(opt => {
                    const isBest = explainItem.aiDecisionComparison.recommendedOption === opt.code;
                    return (
                      <div
                        key={opt.code}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${isBest ? 'var(--primary)' : 'var(--border-subtle)'}`,
                          background: isBest ? 'var(--primary-bg)' : 'var(--bg-surface)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.84rem' }}>{opt.label}</strong>
                          {isBest && <span className="ss-badge ss-badge-indigo">Khuyến nghị tối ưu</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {opt.note} • SL: <strong>{opt.suggestedQty}</strong> • Chi phí ước tính: <strong>{Number(opt.estimatedCost || 0).toLocaleString('vi-VN')} đ</strong>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </ModalDialog>
    </div>
  );
}
