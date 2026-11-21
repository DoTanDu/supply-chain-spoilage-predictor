// src/components/SpoilageAlertsView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Zap,
  RotateCw,
  Trash2,
  Printer,
  CheckCircle2,
  AlertCircle,
  Download,
  Plus,
  ArrowLeftRight,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { fetchRopForecast } from '../api';
import ModalDialog from './ui/ModalDialog';
import QuickMarkdownModal from './QuickMarkdownModal';
import PrintDiscountStickerModal from './PrintDiscountStickerModal';
import DisposalFormModal from './DisposalFormModal';
import PrintSpoilageReceiptModal from './PrintSpoilageReceiptModal';
import { exportBatchesFefoToExcel, exportSpoilageLedgerToExcel } from '../utils/exportUtils';
import { normalizeRole } from '../utils/pagePermissions';

function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

function formatDateVN(dateStr) {
  if (!dateStr) return '—';
  const raw = String(dateStr).slice(0, 10);
  const parts = raw.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : raw;
}

const ROTATION_SOP_STEPS = [
  'Kiểm tra tình trạng bao bì, độ lạnh và nhãn mác của lô cận hạn.',
  'Đưa các sản phẩm thuộc lô cận hạn ra mặt tiền kệ (hàng đầu tiên, ngang tầm mắt).',
  'Đẩy các lô có hạn sử dụng dài hơn ra phía sau theo đúng chuẩn FEFO.',
  'Dán tem khuyến mãi / Quick Markdown (nếu đã kích hoạt giảm giá) rõ ràng.',
  'Xác nhận hoàn tất quy trình đảo kệ lên nhật ký vận hành điện tử.'
];

const REASON_LABELS = {
  EXP_SPOILAGE: 'Quá hạn tự nhiên',
  EXPIRED: 'Quá hạn sử dụng',
  PKG_DAMAGE: 'Lỗi bao bì / Rách móp',
  DAMAGED: 'Hư hỏng vật lý',
  TEMP_ABUSE: 'Sự cố chuỗi lạnh',
  SPOILED: 'Hư hỏng bảo quản',
  INTERNAL_SHRINK: 'Hao hụt kiểm kê',
  QUALITY_REJECT: 'Không đạt chất lượng'
};

export default function SpoilageAlertsView({
  batches = [],
  products = [],
  disposals = [],
  storeProfile = null,
  currentUser = null,
  currentRole = 'CASHIER',
  isAdmin = false,
  selectedStoreId = 'ALL',
  weather = { condition: 'NORMAL', isHoliday: false },
  isSingleStore = false,
  onQuickDiscount,
  onRotateShelf,
  onCreateDisposal,
  onBulkDisposal,
  onApproveDisposal,
  onRefreshData,
  setActiveTab,
  initialSubTab = 'alerts'
}) {
  const roleCode = normalizeRole(currentRole || currentUser?.roleCode);
  const canApproveAndMarkdown = isAdmin || roleCode === 'ADMIN' || roleCode === 'STORE_MANAGER';

  const [subTab, setSubTab] = useState(initialSubTab || 'alerts');
  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]);

  const [toast, setToast] = useState(null);
  const [aiRiskMap, setAiRiskMap] = useState({});

  // Bộ lọc Sub-tab 1: Cảnh báo cận hạn
  const [zoneFilter, setZoneFilter] = useState('AT_RISK'); // AT_RISK, EXPIRED, RED, YELLOW, NEED_ROTATE, ALL
  const [searchAlert, setSearchAlert] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);

  // Modals Sub-tab 1
  const [quickMarkdownBatch, setQuickMarkdownBatch] = useState(null);
  const [stickerBatch, setStickerBatch] = useState(null);
  const [rotateModalBatch, setRotateModalBatch] = useState(null);
  const [rotateSteps, setRotateSteps] = useState([true, false, false, false, false]);
  const [submittingRotate, setSubmittingRotate] = useState(false);

  // Modals Tiêu hủy & Sổ hao hụt
  const [disposalModalOpen, setDisposalModalOpen] = useState(false);
  const [disposalInitialBatchId, setDisposalInitialBatchId] = useState(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkReason, setBulkReason] = useState('EXP_SPOILAGE');
  const [bulkNotes, setBulkNotes] = useState('');
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [printRecord, setPrintRecord] = useState(null);

  // Bộ lọc Sub-tab 2: Sổ hao hụt
  const [recordSearch, setRecordSearch] = useState('');
  const [recordStatusFilter, setRecordStatusFilter] = useState('ALL');

  useEffect(() => {
    let mounted = true;
    fetchRopForecast(weather?.condition || 'NORMAL', Boolean(weather?.isHoliday), selectedStoreId)
      .then(res => {
        if (!mounted || !res) return;
        const map = {};
        for (const item of (res.allForecasts || res.data || [])) {
          map[Number(item.productId)] = item;
        }
        setAiRiskMap(map);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [selectedStoreId, weather?.condition, weather?.isHoliday]);

  const inStockBatches = useMemo(() => {
    return batches.filter(b => Number(b.currentQuantity ?? b.quantity ?? 0) > 0 && String(b.status).toUpperCase() !== 'DISPOSED');
  }, [batches]);

  const isExpired = (b) => b.alertColor === 'EXPIRED' || b.status === 'EXPIRED' || Number(b.daysLeft ?? 99) <= 0;
  const isRed = (b) => !isExpired(b) && (b.alertColor === 'RED' || b.status === 'CRITICAL' || Number(b.daysLeft ?? 99) <= 3);
  const isYellow = (b) => !isExpired(b) && !isRed(b) && (b.alertColor === 'YELLOW' || b.status === 'WARNING');

  const countExpired = inStockBatches.filter(isExpired).length;
  const countRed = inStockBatches.filter(isRed).length;
  const countYellow = inStockBatches.filter(isYellow).length;
  const countNeedRotate = inStockBatches.filter(b => (isRed(b) || isYellow(b)) && !b.isShelfRotated).length;

  const filteredAlertBatches = useMemo(() => {
    const q = stripVietnamese(searchAlert);
    return inStockBatches
      .filter(b => {
        if (zoneFilter === 'AT_RISK' && !isExpired(b) && !isRed(b) && !isYellow(b)) return false;
        if (zoneFilter === 'EXPIRED' && !isExpired(b)) return false;
        if (zoneFilter === 'RED' && !isRed(b)) return false;
        if (zoneFilter === 'YELLOW' && !isYellow(b)) return false;
        if (zoneFilter === 'NEED_ROTATE' && !((isRed(b) || isYellow(b)) && !b.isShelfRotated)) return false;
        if (q) {
          const hay = `${stripVietnamese(b.productName)} ${stripVietnamese(b.batchCode)} ${stripVietnamese(b.productSku || b.sku)}`;
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => Number(a.daysLeft ?? 99) - Number(b.daysLeft ?? 99));
  }, [inStockBatches, zoneFilter, searchAlert]);

  const filteredDisposals = useMemo(() => {
    const q = stripVietnamese(recordSearch);
    return disposals.filter(d => {
      if (recordStatusFilter !== 'ALL' && String(d.status).toUpperCase() !== recordStatusFilter) return false;
      if (q) {
        const hay = `${stripVietnamese(d.recordCode || d.id)} ${stripVietnamese(d.productName)} ${stripVietnamese(d.batchCode)}`;
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [disposals, recordSearch, recordStatusFilter]);

  const handleConfirmRotation = async () => {
    if (!rotateModalBatch || !onRotateShelf) return;
    setSubmittingRotate(true);
    try {
      const res = await onRotateShelf(rotateModalBatch.id);
      if (res && res.success) {
        setToast({ type: 'success', text: `Đã xác nhận đảo kệ mặt tiền cho lô ${rotateModalBatch.batchCode}!` });
        setRotateModalBatch(null);
      } else {
        setToast({ type: 'error', text: res?.message || 'Không thể xác nhận đảo kệ.' });
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message });
    } finally {
      setSubmittingRotate(false);
    }
  };

  const handleConfirmBulkDisposal = async (e) => {
    e.preventDefault();
    if (!onBulkDisposal || selectedBatchIds.length === 0) return;
    setSubmittingBulk(true);
    try {
      const items = selectedBatchIds
        .map(id => inStockBatches.find(b => Number(b.id) === Number(id)))
        .filter(Boolean)
        .map(b => ({
          batchId: b.id,
          quantity: Number(b.currentQuantity ?? b.quantity ?? 0)
        }));
      const res = await onBulkDisposal({
        items,
        reason: bulkReason,
        notes: bulkNotes.trim() || `Tiêu hủy hàng loạt ${items.length} lô theo kiểm tra Spoilage Alerts`
      });
      if (res && res.success) {
        setSelectedBatchIds([]);
        setBulkModalOpen(false);
        setBulkNotes('');
        setToast({ type: 'success', text: res.message || `Đã xử lý tiêu hủy ${items.length} lô hàng.` });
        if (onRefreshData) await onRefreshData();
        setSubTab('disposals');
      } else {
        setToast({ type: 'error', text: res?.message || 'Không thể tiêu hủy hàng loạt.' });
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message });
    } finally {
      setSubmittingBulk(false);
    }
  };

  const totalLoss = disposals.reduce((s, d) => s + Number(d.totalLoss || d.costLoss || 0), 0);
  const totalDisposedUnits = disposals.reduce((s, d) => s + Number(d.quantity || d.quantityDisposed || 0), 0);
  const pendingDisposalsCount = disposals.filter(d => String(d.status).toUpperCase() === 'PENDING').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div className="ss-page-header">
        <div>
          <h1 className="ss-page-title">Cảnh báo Hết hạn & Xử lý Hủy</h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="ss-btn ss-btn-danger"
            onClick={() => {
              setDisposalInitialBatchId(null);
              setDisposalModalOpen(true);
            }}
          >
            <Plus size={15} /> Lập Phiếu Tiêu hủy
          </button>
          <button type="button" className="ss-btn ss-btn-secondary" onClick={() => exportSpoilageLedgerToExcel(disposals)}>
            <Download size={15} /> Xuất Sổ Hao hụt
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
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
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

      {/* 4 Interactive Zone Filter Cards */}
      <div className="ss-kpi-grid">
        <button
          type="button"
          className="ss-card ss-card-pad"
          onClick={() => { setSubTab('alerts'); setZoneFilter('EXPIRED'); }}
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            borderColor: zoneFilter === 'EXPIRED' ? 'var(--expired-purple)' : 'var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--expired-purple)', textTransform: 'uppercase' }}>Đã quá hạn (Khóa POS)</div>
          <div className="num-tabular" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{countExpired} lô</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Rút khỏi kệ & lập phiếu hủy ngay</div>
        </button>

        <button
          type="button"
          className="ss-card ss-card-pad"
          onClick={() => { setSubTab('alerts'); setZoneFilter('RED'); }}
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            borderColor: zoneFilter === 'RED' ? 'var(--danger-red)' : 'var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger-red-light)', textTransform: 'uppercase' }}>Vùng Đỏ Nguy kịch (≤ 3 ngày)</div>
          <div className="num-tabular" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger-red-light)', marginTop: '4px' }}>{countRed} lô</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Giảm 40–50% hoặc điều chuyển khẩn</div>
        </button>

        <button
          type="button"
          className="ss-card ss-card-pad"
          onClick={() => { setSubTab('alerts'); setZoneFilter('YELLOW'); }}
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            borderColor: zoneFilter === 'YELLOW' ? 'var(--warning-yellow)' : 'var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning-yellow-light)', textTransform: 'uppercase' }}>Vùng Vàng Cảnh báo</div>
          <div className="num-tabular" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warning-yellow-light)', marginTop: '4px' }}>{countYellow} lô</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Giảm 15–30% & đảo mặt tiền ({countNeedRotate} chờ đảo)</div>
        </button>

        <button
          type="button"
          className="ss-card ss-card-pad"
          onClick={() => setSubTab('disposals')}
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            borderColor: subTab === 'disposals' ? 'var(--primary)' : 'var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tổng Thiệt hại Hủy hàng</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            {totalLoss.toLocaleString('vi-VN')} đ
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {totalDisposedUnits} ĐV đã hủy • <strong>{pendingDisposalsCount} phiếu chờ duyệt</strong>
          </div>
        </button>
      </div>

      {/* Main Tabbed Content */}
      <section className="ss-card" style={{ overflow: 'hidden' }}>
        <div role="tablist" aria-label="Cảnh báo lãng phí và sổ tiêu hủy" className="ss-tablist">
          <button type="button" role="tab" id="sp-tab-alerts" aria-selected={subTab === 'alerts'} className="ss-tab" onClick={() => setSubTab('alerts')}>
            <AlertTriangle size={15} /> Lô Nguy cơ Hủy & Phương án Xử lý ({filteredAlertBatches.length})
          </button>
          <button type="button" role="tab" id="sp-tab-disposals" aria-selected={subTab === 'disposals'} className="ss-tab" onClick={() => setSubTab('disposals')}>
            <Trash2 size={15} /> Biên bản Tiêu hủy & Sổ Hao hụt ({disposals.length})
          </button>
        </div>

        <div style={{ padding: '18px 20px' }}>
          {/* PANEL 1: LÔ NGUY CƠ HỦY */}
          <div role="tabpanel" aria-labelledby="sp-tab-alerts" hidden={subTab !== 'alerts'}>
            <search>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                  <input
                    type="search"
                    aria-label="Tìm lô hàng có nguy cơ hủy"
                    placeholder="Tìm tên sản phẩm, mã lô, SKU..."
                    value={searchAlert}
                    onChange={(e) => setSearchAlert(e.target.value)}
                    style={{ maxWidth: '300px' }}
                  />
                  <select
                    aria-label="Lọc mức cảnh báo"
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter(e.target.value)}
                    style={{ width: 'auto' }}
                  >
                    <option value="AT_RISK">Tất cả lô có rủi ro (Đỏ + Vàng + Quá hạn)</option>
                    <option value="EXPIRED">Chỉ lô Quá hạn (≤ 0 ngày)</option>
                    <option value="RED">Chỉ Vùng Đỏ (1–3 ngày)</option>
                    <option value="YELLOW">Chỉ Vùng Vàng</option>
                    <option value="NEED_ROTATE">Cần đảo kệ mặt tiền</option>
                    <option value="ALL">Toàn bộ lô đang tồn ({inStockBatches.length})</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedBatchIds.length > 0 && (
                    <button type="button" className="ss-btn ss-btn-danger ss-btn-sm" onClick={() => setBulkModalOpen(true)}>
                      <Trash2 size={14} /> Tiêu hủy hàng loạt ({selectedBatchIds.length} lô)
                    </button>
                  )}
                  <button type="button" className="ss-btn ss-btn-secondary ss-btn-sm" onClick={() => exportBatchesFefoToExcel(filteredAlertBatches)}>
                    <Download size={14} /> Xuất danh sách
                  </button>
                </div>
              </div>
            </search>

            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Bảng cảnh báo lô cận hạn">
              <table className="ss-table ss-table-responsive">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '36px' }}>Chọn</th>
                    <th scope="col">Số lô & Sản phẩm</th>
                    <th scope="col">Hạn dùng & DaysLeft</th>
                    <th scope="col">Lượng tồn & Nguy cơ tồn đọng (AI 2)</th>
                    <th scope="col">Phương án xử lý đề xuất</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlertBatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        Không có lô hàng nào trong bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredAlertBatches.map(b => {
                      const exp = isExpired(b);
                      const red = isRed(b);
                      const yellow = isYellow(b);
                      const qty = Number(b.currentQuantity ?? b.quantity ?? 0);
                      const aiInfo = aiRiskMap[Number(b.productId)];
                      const estDaily = Number(aiInfo?.adjustedDailyDemand ?? 0);
                      const daysLeft = Number(b.daysLeft ?? 0);
                      const estSellBeforeExp = daysLeft > 0 ? Math.round(estDaily * daysLeft) : 0;
                      const estSpoilageQty = exp ? qty : Math.max(0, qty - estSellBeforeExp);

                      let recommendedAction = 'Theo dõi bán bình thường theo FEFO';
                      if (exp) recommendedAction = 'Rút khỏi quầy ngay & lập biên bản tiêu hủy';
                      else if (red) recommendedAction = Number(b.discountPercent || 0) > 0 ? `Đang giảm ${b.discountPercent}% — Ưu tiên bán/điều chuyển` : 'Giảm giá 40–50% hoặc điều chuyển ngay';
                      else if (yellow) recommendedAction = !b.isShelfRotated ? 'Đảo kệ mặt tiền 5 bước & giảm 15–30%' : 'Giảm 15–30% kích cầu trước hạn';

                      return (
                        <tr key={b.id}>
                          <td data-label="Chọn">
                            <input
                              type="checkbox"
                              aria-label={`Chọn lô ${b.batchCode}`}
                              checked={selectedBatchIds.includes(b.id)}
                              onChange={() => setSelectedBatchIds(prev => prev.includes(b.id) ? prev.filter(id => id !== b.id) : [...prev, b.id])}
                              style={{ width: 'auto' }}
                            />
                          </td>
                          <td data-label="Lô & Sản phẩm">
                            <div style={{ fontWeight: 700 }}>{b.productName}</div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                              {b.batchCode} • {b.storeName || `CN #${b.storeId || 1}`}
                            </div>
                          </td>
                          <td data-label="HSD">
                            <div className="num-tabular" style={{ fontWeight: 600 }}>{formatDateVN(b.expiryDate)}</div>
                            <span className={`ss-badge ${exp ? 'ss-badge-expired' : red ? 'ss-badge-danger' : yellow ? 'ss-badge-warning' : 'ss-badge-safe'}`} style={{ marginTop: '3px' }}>
                              {exp ? `Quá hạn (${daysLeft}d)` : `Còn ${daysLeft} ngày`}
                            </span>
                          </td>
                          <td data-label="Tồn & Rủi ro" className="num-tabular">
                            <div>Tồn lô: <strong>{qty} {b.unit || 'ĐV'}</strong></div>
                            {estSpoilageQty > 0 ? (
                              <div style={{ fontSize: '0.74rem', color: 'var(--danger-red-light)', fontWeight: 600 }}>
                                Ước tính tồn đọng: ~{estSpoilageQty} ĐV ({(estSpoilageQty * Number(b.importPrice || 0)).toLocaleString('vi-VN')} đ)
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.74rem', color: 'var(--safe-green-light)' }}>Khả năng bán hết trước hạn</div>
                            )}
                          </td>
                          <td data-label="Phương án" style={{ maxWidth: '250px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            <div>{recommendedAction}</div>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                              {Number(b.discountPercent || 0) > 0 && (
                                <span className="ss-badge ss-badge-indigo">Đang giảm -{b.discountPercent}%</span>
                              )}
                              {b.isShelfRotated && (
                                <span className="ss-badge ss-badge-safe">Đã đảo kệ</span>
                              )}
                            </div>
                          </td>
                          <td data-label="Thao tác" style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {!exp && canApproveAndMarkdown && (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-primary ss-btn-sm"
                                  onClick={() => setQuickMarkdownBatch(b)}
                                >
                                  <Zap size={13} /> Giảm giá
                                </button>
                              )}
                              {!exp && !b.isShelfRotated && (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-secondary ss-btn-sm"
                                  onClick={() => {
                                    setRotateModalBatch(b);
                                    setRotateSteps([true, false, false, false, false]);
                                  }}
                                >
                                  <RotateCw size={13} /> Đảo kệ
                                </button>
                              )}
                              {Number(b.discountPercent || 0) > 0 && (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-secondary ss-btn-sm"
                                  onClick={() => setStickerBatch(b)}
                                >
                                  <Printer size={13} /> Tem
                                </button>
                              )}
                              {!exp && !isSingleStore && daysLeft >= 2 && (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-secondary ss-btn-sm"
                                  onClick={() => setActiveTab && setActiveTab('stock-transfer')}
                                  title="Chuyển sang điều phối sang chi nhánh thiếu hàng"
                                >
                                  <ArrowLeftRight size={13} />
                                </button>
                              )}
                              <button
                                type="button"
                                className="ss-btn ss-btn-secondary ss-btn-sm"
                                style={{ color: 'var(--danger-red-light)' }}
                                onClick={() => {
                                  setDisposalInitialBatchId(b.id);
                                  setDisposalModalOpen(true);
                                }}
                                title="Lập biên bản tiêu hủy"
                              >
                                <Trash2 size={13} /> Hủy
                              </button>
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

          {/* PANEL 2: SỔ HAO HỤT & BIÊN BẢN TIÊU HỦY */}
          <div role="tabpanel" aria-labelledby="sp-tab-disposals" hidden={subTab !== 'disposals'}>
            <search>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                  <input
                    type="search"
                    aria-label="Tìm biên bản tiêu hủy"
                    placeholder="Tìm mã biên bản, tên sản phẩm, mã lô..."
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                    style={{ maxWidth: '300px' }}
                  />
                  <select
                    aria-label="Lọc trạng thái duyệt tiêu hủy"
                    value={recordStatusFilter}
                    onChange={(e) => setRecordStatusFilter(e.target.value)}
                    style={{ width: 'auto' }}
                  >
                    <option value="ALL">Tất cả biên bản ({disposals.length})</option>
                    <option value="PENDING">Chờ duyệt ({pendingDisposalsCount})</option>
                    <option value="APPROVED">Đã duyệt chốt sổ</option>
                  </select>
                </div>
                <button type="button" className="ss-btn ss-btn-danger ss-btn-sm" onClick={() => { setDisposalInitialBatchId(null); setDisposalModalOpen(true); }}>
                  <Plus size={14} /> Lập Biên bản mới
                </button>
              </div>
            </search>

            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Sổ hao hụt tài chính tiêu hủy">
              <table className="ss-table ss-table-responsive">
                <thead>
                  <tr>
                    <th scope="col">Mã Biên bản & Ngày</th>
                    <th scope="col">Sản phẩm & Mã lô</th>
                    <th scope="col">SL Hủy</th>
                    <th scope="col">Thiệt hại CostLoss</th>
                    <th scope="col">Nguyên nhân</th>
                    <th scope="col">Trạng thái duyệt</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDisposals.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        Chưa có biên bản tiêu hủy nào khớp điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredDisposals.map(d => {
                      const isPending = String(d.status).toUpperCase() === 'PENDING';
                      return (
                        <tr key={d.dbId || d.id}>
                          <td data-label="Mã BB">
                            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{d.recordCode || d.id}</div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)' }}>{formatDateVN(d.disposedDate || d.date)}</div>
                          </td>
                          <td data-label="Sản phẩm">
                            <div style={{ fontWeight: 700 }}>{d.productName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                              {d.batchCode} • {d.storeName || `CN #${d.storeId || 1}`}
                            </div>
                          </td>
                          <td data-label="SL Hủy" className="num-tabular">{d.quantity || d.quantityDisposed} {d.unit || 'ĐV'}</td>
                          <td data-label="Thiệt hại" className="num-tabular" style={{ fontWeight: 700, color: 'var(--danger-red-light)' }}>
                            {Number(d.totalLoss || d.costLoss || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td data-label="Nguyên nhân">{REASON_LABELS[d.reason] || d.reason || 'Hết hạn'}</td>
                          <td data-label="Trạng thái">
                            <span className={`ss-badge ${isPending ? 'ss-badge-warning' : 'ss-badge-safe'}`}>
                              {isPending ? 'Chờ duyệt' : `Đã chốt (${d.approvedByName || 'Quản lý'})`}
                            </span>
                          </td>
                          <td data-label="Thao tác" style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {isPending && canApproveAndMarkdown && onApproveDisposal && (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-primary ss-btn-sm"
                                  onClick={async () => {
                                    const res = await onApproveDisposal(d.id || d.recordCode);
                                    if (res && res.success) {
                                      setToast({ type: 'success', text: `Đã phê duyệt tiêu hủy biên bản ${d.recordCode || d.id}!` });
                                    } else {
                                      setToast({ type: 'error', text: res?.message || 'Không thể phê duyệt.' });
                                    }
                                  }}
                                >
                                  Duyệt chốt sổ
                                </button>
                              )}
                              <button type="button" className="ss-btn ss-btn-secondary ss-btn-sm" onClick={() => setPrintRecord(d)}>
                                <Printer size={13} /> In
                              </button>
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
        </div>
      </section>

      {/* SOP 5-Step Shelf Rotation Dialog */}
      <ModalDialog
        isOpen={Boolean(rotateModalBatch)}
        onClose={() => setRotateModalBatch(null)}
        title="Quy trình Đảo Kệ Mặt Tiền 5 Bước (FEFO SOP)"
        subtitle={rotateModalBatch ? `${rotateModalBatch.productName} • Lô ${rotateModalBatch.batchCode}` : ''}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ROTATION_SOP_STEPS.map((step, idx) => (
            <label
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: rotateSteps[idx] ? 'var(--primary-bg)' : 'var(--bg-surface)',
                cursor: 'pointer',
                fontSize: '0.84rem'
              }}
            >
              <input
                type="checkbox"
                checked={rotateSteps[idx]}
                onChange={() => {
                  const next = [...rotateSteps];
                  next[idx] = !next[idx];
                  setRotateSteps(next);
                }}
                style={{ width: 'auto', marginTop: '2px' }}
              />
              <span><strong>Bước {idx + 1}:</strong> {step}</span>
            </label>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button type="button" className="ss-btn ss-btn-secondary" onClick={() => setRotateModalBatch(null)}>Hủy</button>
            <button
              type="button"
              className="ss-btn ss-btn-primary"
              disabled={submittingRotate || !rotateSteps.every(Boolean)}
              onClick={handleConfirmRotation}
            >
              {submittingRotate ? 'Đang xác nhận...' : 'Xác nhận Đảo kệ Hoàn tất'}
            </button>
          </div>
        </div>
      </ModalDialog>

      {/* Bulk Disposal Dialog */}
      <ModalDialog
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title={`Tiêu hủy Hàng loạt (${selectedBatchIds.length} lô)`}
        subtitle="Ghi nhận đồng thời vào Sổ hao hụt tài chính theo giá vốn nhập kho."
        size="sm"
      >
        <form onSubmit={handleConfirmBulkDisposal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="ss-field">
            <label className="ss-label" htmlFor="bulk-reason">Nguyên nhân tiêu hủy</label>
            <select id="bulk-reason" value={bulkReason} onChange={(e) => setBulkReason(e.target.value)}>
              <option value="EXP_SPOILAGE">Quá hạn tự nhiên</option>
              <option value="PKG_DAMAGE">Lỗi bao bì / Rách móp</option>
              <option value="TEMP_ABUSE">Sự cố chuỗi lạnh</option>
              <option value="INTERNAL_SHRINK">Hao hụt kiểm kê</option>
            </select>
          </div>
          <div className="ss-field">
            <label className="ss-label" htmlFor="bulk-notes">Ghi chú kiểm tra</label>
            <textarea id="bulk-notes" rows={3} value={bulkNotes} onChange={(e) => setBulkNotes(e.target.value)} placeholder="Ghi chú lý do xử lý hàng loạt..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="ss-btn ss-btn-secondary" onClick={() => setBulkModalOpen(false)}>Hủy</button>
            <button type="submit" className="ss-btn ss-btn-danger" disabled={submittingBulk}>
              {submittingBulk ? 'Đang xử lý...' : 'Xác nhận Tiêu hủy'}
            </button>
          </div>
        </form>
      </ModalDialog>

      <QuickMarkdownModal
        isOpen={Boolean(quickMarkdownBatch)}
        onClose={() => setQuickMarkdownBatch(null)}
        batch={quickMarkdownBatch}
        canApplyMarkdown={canApproveAndMarkdown}
        onApplyMarkdown={async (batchId, percent) => {
          const res = await onQuickDiscount(batchId, percent);
          if (res && res.success) {
            setToast({ type: 'success', text: `Đã kích hoạt giảm giá -${percent}% thành công!` });
            setQuickMarkdownBatch(null);
          }
          return res;
        }}
        onOpenPrintSticker={(b) => {
          setQuickMarkdownBatch(null);
          setStickerBatch(b);
        }}
      />

      <PrintDiscountStickerModal
        isOpen={Boolean(stickerBatch)}
        onClose={() => setStickerBatch(null)}
        batch={stickerBatch}
        products={products}
        storeProfile={storeProfile}
      />

      <DisposalFormModal
        isOpen={disposalModalOpen}
        onClose={() => setDisposalModalOpen(false)}
        availableBatches={inStockBatches}
        initialBatchId={disposalInitialBatchId}
        storeProfile={storeProfile}
        currentUser={currentUser}
        currentRole={currentRole}
        isAdmin={isAdmin}
        onSubmitDisposal={async (payload) => {
          const res = await onCreateDisposal(payload);
          if (res && res.success) {
            setDisposalModalOpen(false);
            setToast({ type: 'success', text: res.message || 'Đã ghi nhận phiếu tiêu hủy vào Sổ hao hụt!' });
            setSubTab('disposals');
          }
          return res;
        }}
      />

      <PrintSpoilageReceiptModal
        isOpen={Boolean(printRecord)}
        onClose={() => setPrintRecord(null)}
        record={printRecord}
        storeProfile={storeProfile}
      />
    </div>
  );
}
