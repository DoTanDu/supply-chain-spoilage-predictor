// src/components/StoreManagementView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Edit3,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Boxes
} from 'lucide-react';
import * as api from '../api';
import ModalDialog from './ui/ModalDialog';
import { normalizeRole } from '../utils/pagePermissions';

const STATUS_CONFIG = {
  OPEN: { label: 'Đang mở cửa', badgeClass: 'ss-badge-safe' },
  CLOSED: { label: 'Đóng ca / Nghỉ', badgeClass: 'ss-badge-danger' },
  INVENTORY: { label: 'Đang kiểm kê', badgeClass: 'ss-badge-warning' },
  SUSPENDED: { label: 'Tạm ngưng', badgeClass: 'ss-badge-neutral' }
};

export default function StoreManagementView({
  currentUser,
  isAdmin = false,
  liveStats = null,
  storesList = [],
  selectedStoreId = 'ALL',
  onSelectStore,
  onStoresChanged,
  setActiveTab
}) {
  const roleCode = normalizeRole(currentUser?.roleCode);
  const isOwner = isAdmin || roleCode === 'ADMIN';
  const isManager = roleCode === 'STORE_MANAGER';

  const [stores, setStores] = useState(storesList);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [modalMode, setModalMode] = useState(null); // null | 'CREATE' | 'EDIT'
  const [editingStore, setEditingStore] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [formState, setFormState] = useState({
    storeCode: '',
    storeName: '',
    address: '',
    phone: '',
    managerId: 2,
    status: 'OPEN',
    openTime: '06:00',
    closeTime: '22:00',
    defaultLeadTimeDays: 1,
    minInboundRslPercent: 70,
    defaultWarningDays: 7,
    criticalWarningDays: 3,
    shelfCapacitySkus: 1500,
    shelfCapacityUnits: 5000
  });

  const loadStores = async () => {
    setLoading(true);
    try {
      const list = await api.apiGetAllStores();
      if (Array.isArray(list)) setStores(list);
    } catch (err) {
      console.error('Lỗi tải danh sách chi nhánh:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Array.isArray(storesList) && storesList.length > 0) {
      setStores(storesList);
    } else {
      loadStores();
    }
  }, [storesList]);

  const benchmarkMap = useMemo(() => {
    const map = new Map();
    for (const item of (liveStats?.crossStoreBenchmark || [])) {
      map.set(Number(item.storeId), item);
    }
    return map;
  }, [liveStats?.crossStoreBenchmark]);

  const activeStoresCount = stores.filter(s => String(s.status || 'OPEN').toUpperCase() !== 'SUSPENDED').length;
  const isSingleStore = activeStoresCount <= 1;

  const openCreateModal = () => {
    const nextIdx = stores.length + 1;
    setFormState({
      storeCode: `RETAIL-STORE-0${nextIdx}`,
      storeName: '',
      address: '',
      phone: '',
      managerId: 2,
      status: 'OPEN',
      openTime: '06:00',
      closeTime: '22:00',
      defaultLeadTimeDays: 1,
      minInboundRslPercent: 70,
      defaultWarningDays: 7,
      criticalWarningDays: 3,
      shelfCapacitySkus: 1500,
      shelfCapacityUnits: 5000
    });
    setEditingStore(null);
    setFormError('');
    setModalMode('CREATE');
  };

  const openEditModal = (st) => {
    setEditingStore(st);
    setFormState({
      storeCode: st.storeCode || '',
      storeName: st.storeName || '',
      address: st.address || '',
      phone: st.phone || '',
      managerId: Number(st.managerId || 2),
      status: st.status || 'OPEN',
      openTime: st.openTime || '06:00',
      closeTime: st.closeTime || '22:00',
      defaultLeadTimeDays: Number(st.defaultLeadTimeDays || 1),
      minInboundRslPercent: Number(st.minInboundRslPercent || 70),
      defaultWarningDays: Number(st.defaultWarningDays || 7),
      criticalWarningDays: Number(st.criticalWarningDays || 3),
      shelfCapacitySkus: Number(st.shelfCapacitySkus || 1500),
      shelfCapacityUnits: Number(st.shelfCapacityUnits || 5000)
    });
    setFormError('');
    setModalMode('EDIT');
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      let res;
      if (modalMode === 'CREATE') {
        res = await api.apiCreateStoreProfile(formState);
      } else if (modalMode === 'EDIT' && editingStore) {
        const payload = isOwner
          ? formState
          : {
              status: formState.status,
              openTime: formState.openTime,
              closeTime: formState.closeTime
            };
        res = await api.apiUpdateStoreProfile(payload, editingStore.id);
      }

      if (res && res.success) {
        setToast({
          type: 'success',
          text: res.message || 'Lưu thông tin chi nhánh thành công!'
        });
        setModalMode(null);
        await loadStores();
        if (onStoresChanged) await onStoresChanged();
      } else {
        setFormError(res?.message || 'Không thể lưu thông tin chi nhánh.');
      }
    } catch (err) {
      setFormError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  const maxRevenue = Math.max(1, ...stores.map(s => Number(benchmarkMap.get(Number(s.id))?.totalSalesRevenue || 0)));
  const maxInventory = Math.max(1, ...stores.map(s => Number(benchmarkMap.get(Number(s.id))?.totalInventoryValue || 0)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div className="ss-page-header">
        <div>
          <h1 className="ss-page-title">Quản lý Chi nhánh</h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="ss-btn ss-btn-secondary" onClick={loadStores} disabled={loading}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Làm mới
          </button>
          {isOwner && (
            <button type="button" className="ss-btn ss-btn-primary" onClick={openCreateModal}>
              <Plus size={16} /> Thêm Chi nhánh mới
            </button>
          )}
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

      {/* Store Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '14px' }}>
        {stores.map(st => {
          const bench = benchmarkMap.get(Number(st.id)) || {};
          const statusInfo = STATUS_CONFIG[String(st.status || 'OPEN').toUpperCase()] || STATUS_CONFIG.OPEN;
          const isSelected = String(selectedStoreId) === String(st.id);
          const canEditThis = isOwner || (isManager && Number(currentUser?.storeId) === Number(st.id));

          return (
            <article
              key={st.id}
              className="ss-card ss-card-pad"
              style={{
                borderColor: isSelected ? 'var(--primary)' : 'var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {st.storeCode}
                      </span>
                      <span className={`ss-badge ${statusInfo.badgeClass}`}>{statusInfo.label}</span>
                    </div>
                  </div>
                  {canEditThis && (
                    <button
                      type="button"
                      className="ss-btn ss-btn-secondary ss-btn-sm"
                      onClick={() => openEditModal(st)}
                      title="Cấu hình chi nhánh"
                    >
                      <Edit3 size={13} /> Sửa
                    </button>
                  )}
                </div>

                <h2 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)', margin: '8px 0 6px', lineHeight: 1.35 }}>
                  {st.storeName}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} style={{ flexShrink: 0 }} aria-hidden="true" /> <span>{st.address || 'Chưa cập nhật địa chỉ'}</span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={13} style={{ flexShrink: 0 }} aria-hidden="true" /> <span>{st.phone || '—'} • Quản lý: <strong style={{ color: 'var(--text-secondary)' }}>{st.managerName || 'Cửa hàng trưởng'}</strong></span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} style={{ flexShrink: 0 }} aria-hidden="true" /> <span>Ca trực: {st.openTime || '06:00'} – {st.closeTime || '22:00'} • Min RSL: <strong>{st.minInboundRslPercent || 70}%</strong> • Lead Time: <strong>{st.defaultLeadTimeDays || 1}d</strong></span>
                  </span>
                </div>
              </div>

              {/* Metrics Snapshot + Footer aligned identically across cards */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="ss-card-subtle" style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-dim)' }}>Doanh số POS</div>
                    <strong className="num-tabular" style={{ fontSize: '0.92rem', color: 'var(--primary)' }}>
                      {Number(bench.totalSalesRevenue || 0).toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-dim)' }}>Vốn tồn kệ ({Number(bench.totalAvailableUnits || 0)} ĐV)</div>
                    <strong className="num-tabular" style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                      {Number(bench.totalInventoryValue || 0).toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-dim)' }}>Hao hụt tiêu hủy</div>
                    <strong className="num-tabular" style={{ color: 'var(--danger-red-light)' }}>
                      {Number(bench.totalSpoilageLoss || 0).toLocaleString('vi-VN')} đ ({Number(bench.shrinkageRatePercent || 0)}%)
                    </strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-dim)' }}>Tỷ lệ cứu hàng</div>
                    <strong className="num-tabular" style={{ color: 'var(--safe-green-light)' }}>
                      {Number(bench.rescueRatePercent || 0)}% ({Number(bench.rescuedFinancialValue || 0).toLocaleString('vi-VN')} đ)
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={`ss-badge ${bench.supplyStatus === 'SURPLUS' ? 'ss-badge-warning' : bench.supplyStatus === 'DEFICIT' ? 'ss-badge-danger' : 'ss-badge-safe'}`}>
                    {bench.supplyStatusLabel || 'Đang cân bằng'}
                  </span>
                  {isOwner && (
                    <button
                      type="button"
                      className="ss-btn ss-btn-secondary ss-btn-sm"
                      onClick={() => {
                        if (onSelectStore) onSelectStore(String(st.id));
                        if (setActiveTab) setActiveTab('dashboard');
                      }}
                    >
                      Xem Dashboard <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Benchmark Comparison Table */}
      <section className="ss-card ss-card-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.02rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              So sánh Hiệu quả Chi nhánh
            </h2>
          </div>
          {!isSingleStore && (
            <button type="button" className="ss-btn ss-btn-secondary ss-btn-sm" onClick={() => setActiveTab && setActiveTab('stock-transfer')}>
              Mở Điều phối Dư–Thiếu <ArrowRight size={13} />
            </button>
          )}
        </div>

        <div className="table-wrapper" tabIndex={0} role="region" aria-label="So sánh hiệu quả chi nhánh">
          <table className="ss-table ss-table-responsive">
            <thead>
              <tr>
                <th scope="col">Chi nhánh</th>
                <th scope="col">Doanh số & Tỷ trọng</th>
                <th scope="col">Vốn tồn kho & SL</th>
                <th scope="col">Lô Đỏ / Vàng / Hết hạn</th>
                <th scope="col">Tổn thất hủy</th>
                <th scope="col">Đã cứu (Markdown + Điều chuyển)</th>
                <th scope="col">Phiếu điều chuyển</th>
              </tr>
            </thead>
            <tbody>
              {stores.map(st => {
                const b = benchmarkMap.get(Number(st.id)) || {};
                const rev = Number(b.totalSalesRevenue || 0);
                const inv = Number(b.totalInventoryValue || 0);
                const revPct = Math.round((rev / maxRevenue) * 100);
                const invPct = Math.round((inv / maxInventory) * 100);

                return (
                  <tr key={st.id}>
                    <td data-label="Chi nhánh">
                      <div style={{ fontWeight: 700 }}>{st.storeName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{st.storeCode}</div>
                    </td>
                    <td data-label="Doanh số" style={{ minWidth: '170px' }}>
                      <div className="num-tabular" style={{ fontWeight: 700, color: 'var(--primary)' }}>{rev.toLocaleString('vi-VN')} đ</div>
                      <div style={{ height: '5px', background: 'var(--bg-subtle)', borderRadius: '999px', marginTop: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${revPct}%`, height: '100%', background: 'var(--primary)' }} />
                      </div>
                    </td>
                    <td data-label="Vốn tồn" style={{ minWidth: '160px' }}>
                      <div className="num-tabular" style={{ fontWeight: 600 }}>{inv.toLocaleString('vi-VN')} đ ({Number(b.totalAvailableUnits || 0)} ĐV)</div>
                      <div style={{ height: '5px', background: 'var(--bg-subtle)', borderRadius: '999px', marginTop: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${invPct}%`, height: '100%', background: 'var(--accent-blue)' }} />
                      </div>
                    </td>
                    <td data-label="Cảnh báo">
                      <span className="ss-badge ss-badge-danger" style={{ marginRight: '4px' }}>{Number(b.redBatchesCount || 0)} Đỏ</span>
                      <span className="ss-badge ss-badge-warning" style={{ marginRight: '4px' }}>{Number(b.yellowBatchesCount || 0)} Vàng</span>
                      <span className="ss-badge ss-badge-expired">{Number(b.expiredBatchesCount || 0)} Hết hạn</span>
                    </td>
                    <td data-label="Tổn thất" className="num-tabular" style={{ color: 'var(--danger-red-light)', fontWeight: 600 }}>
                      {Number(b.totalSpoilageLoss || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td data-label="Đã cứu" className="num-tabular" style={{ color: 'var(--safe-green-light)', fontWeight: 700 }}>
                      {Number(b.rescuedFinancialValue || 0).toLocaleString('vi-VN')} đ ({Number(b.rescueRatePercent || 0)}%)
                    </td>
                    <td data-label="Điều chuyển" className="num-tabular">
                      {Number(b.transferOrdersCount || 0)} phiếu
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create / Edit Store Native Dialog */}
      <ModalDialog
        isOpen={Boolean(modalMode)}
        onClose={() => setModalMode(null)}
        title={modalMode === 'CREATE' ? 'Thêm Chi nhánh mới vào Chuỗi' : `Cấu hình Chi nhánh: ${editingStore?.storeCode}`}
        subtitle={isOwner ? 'Chủ chuỗi có toàn quyền thiết lập thông tin và ngưỡng vận hành.' : 'Quản lý chi nhánh được phép cập nhật trạng thái và khung giờ ca trực.'}
      >
        <form onSubmit={handleSaveStore} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
            <div className="ss-field">
              <label className="ss-label" htmlFor="store-code-input">Mã Chi nhánh *</label>
              <input
                id="store-code-input"
                type="text"
                required
                disabled={modalMode === 'EDIT'}
                value={formState.storeCode}
                onChange={(e) => setFormState({ ...formState, storeCode: e.target.value.toUpperCase() })}
                placeholder="VD: RETAIL-STORE-04"
              />
            </div>

            <div className="ss-field">
              <label className="ss-label" htmlFor="store-status-select">Trạng thái hoạt động</label>
              <select
                id="store-status-select"
                value={formState.status}
                onChange={(e) => setFormState({ ...formState, status: e.target.value })}
              >
                <option value="OPEN">OPEN — Đang mở cửa</option>
                <option value="INVENTORY">INVENTORY — Đang kiểm kê</option>
                <option value="CLOSED">CLOSED — Đóng ca</option>
                {isOwner && <option value="SUSPENDED">SUSPENDED — Tạm ngưng</option>}
              </select>
            </div>
          </div>

          <div className="ss-field">
            <label className="ss-label" htmlFor="store-name-input">Tên Chi nhánh *</label>
            <input
              id="store-name-input"
              type="text"
              required
              disabled={!isOwner}
              value={formState.storeName}
              onChange={(e) => setFormState({ ...formState, storeName: e.target.value })}
              placeholder="VD: Chi nhánh Long Bình - Q9"
            />
          </div>

          <div className="ss-field">
            <label className="ss-label" htmlFor="store-addr-input">Địa chỉ *</label>
            <input
              id="store-addr-input"
              type="text"
              required
              disabled={!isOwner}
              value={formState.address}
              onChange={(e) => setFormState({ ...formState, address: e.target.value })}
              placeholder="Số nhà, đường, phường/xã, TP. Biên Hòa..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div className="ss-field">
              <label className="ss-label" htmlFor="store-phone-input">Số điện thoại</label>
              <input
                id="store-phone-input"
                type="text"
                disabled={!isOwner}
                value={formState.phone}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                placeholder="0251.3952.xxx"
              />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="store-open-input">Giờ mở cửa</label>
              <input
                id="store-open-input"
                type="time"
                required
                value={formState.openTime}
                onChange={(e) => setFormState({ ...formState, openTime: e.target.value })}
              />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="store-close-input">Giờ đóng cửa</label>
              <input
                id="store-close-input"
                type="time"
                required
                value={formState.closeTime}
                onChange={(e) => setFormState({ ...formState, closeTime: e.target.value })}
              />
            </div>
          </div>

          {isOwner && (
            <fieldset style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px' }}>
              <legend style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', padding: '0 6px' }}>
                Tham số Vận hành & Ngưỡng An toàn
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '6px' }}>
                <div className="ss-field">
                  <label className="ss-label" htmlFor="store-rsl-input">Min RSL DC (%)</label>
                  <input
                    id="store-rsl-input"
                    type="number"
                    min="50"
                    max="95"
                    value={formState.minInboundRslPercent}
                    onChange={(e) => setFormState({ ...formState, minInboundRslPercent: Number(e.target.value) })}
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label" htmlFor="store-lead-input">Lead Time (ngày)</label>
                  <input
                    id="store-lead-input"
                    type="number"
                    min="1"
                    max="14"
                    value={formState.defaultLeadTimeDays}
                    onChange={(e) => setFormState({ ...formState, defaultLeadTimeDays: Number(e.target.value) })}
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label" htmlFor="store-warn-input">Ngưỡng Vàng (ngày)</label>
                  <input
                    id="store-warn-input"
                    type="number"
                    min="3"
                    max="30"
                    value={formState.defaultWarningDays}
                    onChange={(e) => setFormState({ ...formState, defaultWarningDays: Number(e.target.value) })}
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label" htmlFor="store-crit-input">Ngưỡng Đỏ (ngày)</label>
                  <input
                    id="store-crit-input"
                    type="number"
                    min="1"
                    max="5"
                    value={formState.criticalWarningDays}
                    onChange={(e) => setFormState({ ...formState, criticalWarningDays: Number(e.target.value) })}
                  />
                </div>
              </div>
            </fieldset>
          )}

          {formError && (
            <div role="alert" style={{ padding: '10px 12px', borderRadius: '6px', background: 'var(--danger-red-bg)', border: '1px solid var(--danger-red-border)', color: 'var(--danger-red-light)', fontSize: '0.82rem', fontWeight: 600 }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button type="button" className="ss-btn ss-btn-secondary" onClick={() => setModalMode(null)}>
              Hủy
            </button>
            <button type="submit" className="ss-btn ss-btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : (modalMode === 'CREATE' ? 'Tạo Chi nhánh mới' : 'Lưu thay đổi')}
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
