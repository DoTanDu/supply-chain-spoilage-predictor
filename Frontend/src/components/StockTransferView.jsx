// src/components/StockTransferView.jsx
import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Truck,
  XCircle,
  Plus,
  RefreshCw,
  Building2,
  Sparkles,
  AlertCircle,
  Send,
  FileText,
  Printer
} from 'lucide-react';
import * as api from '../api';
import ModalDialog from './ui/ModalDialog';
import { normalizeRole } from '../utils/pagePermissions';

function shortStoreLabel(name, fallback = '') {
  const raw = String(name || fallback || '').trim();
  if (!raw) return '—';
  return raw
    .replace(/^Cửa hàng Bán lẻ Tiện lợi\s+/i, '')
    .replace(/^Cửa hàng LHU Mart\s*-\s*Chi nhánh\s*/i, 'CN ')
    .replace(/^Cửa hàng\s+/i, '')
    .trim();
}

export default function StockTransferView({
  currentUser,
  currentRole = 'ADMIN',
  weather,
  isSingleStore = false,
  storesList = [],
  onRefreshData
}) {
  const roleCode = normalizeRole(currentRole || currentUser?.roleCode);
  const isOwnerRole = roleCode === 'ADMIN';
  const canApprove = isOwnerRole || roleCode === 'STORE_MANAGER';
  const myStoreId = Number(currentUser?.storeId || 0);

  const [matrixData, setMatrixData] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);
  const [docModalTransfer, setDocModalTransfer] = useState(null);
  const [docTab, setDocTab] = useState('outbound'); // outbound | transit | receipt

  const [showCreateModal, setShowCreateModal] = useState(false);
  const defaultFromStore = !isOwnerRole && myStoreId > 0 ? myStoreId : 0;
  const [newTransferForm, setNewTransferForm] = useState({
    fromStoreId: defaultFromStore,
    toStoreId: 0,
    productId: 0,
    transferQuantity: 0,
    shippingCost: 0,
    aiRecommendationNote: ''
  });
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!isOwnerRole && myStoreId > 0) {
      setNewTransferForm(prev => ({
        ...prev,
        fromStoreId: myStoreId,
        toStoreId: prev.toStoreId === myStoreId ? 0 : prev.toStoreId
      }));
    }
  }, [isOwnerRole, myStoreId]);

  const weatherCond = weather?.condition || 'NORMAL';
  const isHoliday = Boolean(weather?.isHoliday);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [matRes, trfRes] = await Promise.all([
        api.fetchAiSupplyChainMatrix(weatherCond, isHoliday),
        api.fetchStockTransfers('ALL')
      ]);
      if (matRes && matRes.success) setMatrixData(matRes.data);
      if (trfRes && trfRes.success) setTransfers(trfRes.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu Stock Transfer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [weatherCond, isHoliday]);

  const handleCreateProposalFromOrTools = async (proposal) => {
    setActionMsg(null);
    try {
      const res = await api.apiCreateStockTransfer({
        fromStoreId: proposal.fromStoreId,
        toStoreId: proposal.toStoreId,
        productId: proposal.productId,
        sourceBatchId: proposal.sourceBatchId,
        transferQuantity: proposal.transferQuantity,
        shippingCost: Number(proposal.shippingCost ?? 0),
        aiRecommendationNote: proposal.aiReason,
        autoApprove: false // Luôn khởi tạo ở trạng thái PROPOSED (Đề xuất) để duyệt theo quy trình 5 bước (Mục A3 #2)
      });
      if (res && res.success) {
        setActionMsg({
          type: 'success',
          text: `Đã tạo đề xuất điều chuyển ${res.data?.transferCode || ''} (${proposal.transferQuantity} ĐV ${proposal.productName} từ ${proposal.fromStoreName} → ${proposal.toStoreName}). Tồn kho sẽ không thay đổi cho đến khi xuất/nhận hàng!`
        });
        await loadData();
        if (onRefreshData) onRefreshData();
      } else {
        setActionMsg({ type: 'error', text: res?.message || 'Không thể tạo phiếu điều chuyển!' });
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    }
  };

  const handleManualCreateSubmit = async (e) => {
    e.preventDefault();
    setActionMsg(null);
    setCreateError('');
    const { fromStoreId, toStoreId, productId, transferQuantity } = newTransferForm;
    if (!(fromStoreId > 0) || !(toStoreId > 0)) {
      setCreateError('Vui lòng chọn đầy đủ chi nhánh xuất và chi nhánh nhận.');
      return;
    }
    if (fromStoreId === toStoreId) {
      setCreateError('Chi nhánh xuất và chi nhánh nhận phải khác nhau.');
      return;
    }
    if (!(productId > 0)) {
      setCreateError('Vui lòng chọn sản phẩm cần điều chuyển.');
      return;
    }
    if (!Number.isInteger(transferQuantity) || transferQuantity < 1) {
      setCreateError('Số lượng chuyển phải là số nguyên lớn hơn 0.');
      return;
    }
    try {
      const res = await api.apiCreateStockTransfer({
        ...newTransferForm,
        autoApprove: false
      });
      if (res && res.success) {
        setShowCreateModal(false);
        setActionMsg({
          type: 'success',
          text: `Đã khởi tạo phiếu đề xuất điều chuyển ${res.data?.transferCode || ''} (Trạng thái: Đề xuất).`
        });
        await loadData();
        if (onRefreshData) onRefreshData();
      } else {
        setActionMsg({ type: 'error', text: res?.message || 'Lỗi tạo phiếu điều chuyển!' });
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    }
  };

  const handleUpdateStatus = async (transfer, nextStatus, customNote = '') => {
    setActionMsg(null);
    try {
      const res = await api.apiUpdateStockTransferStatus(transfer.id, nextStatus, customNote);
      if (res && res.success) {
        const destInfo =
          nextStatus === 'RECEIVED' && res.data?.destinationBatchCode
            ? ` Đã nhập lô ${res.data.destinationBatchCode} (+${transfer.transferQuantity} ĐV) tại ${transfer.toStoreName}!`
            : nextStatus === 'IN_TRANSIT'
              ? ` Đã trừ ${transfer.transferQuantity} ĐV khỏi lô ${transfer.sourceBatchCode} tại ${transfer.fromStoreName}!`
              : '';
        setActionMsg({
          type: 'success',
          text: `Phiếu ${transfer.transferCode} đã chuyển sang [${nextStatus}].${destInfo}`
        });
        await loadData();
        if (onRefreshData) onRefreshData();
      } else {
        setActionMsg({ type: 'error', text: res?.message || 'Cập nhật trạng thái thất bại!' });
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    }
  };

  const getStatusBadge = (status) => {
    switch (String(status).toUpperCase()) {
      case 'PROPOSED':
        return { label: '1. Đề xuất', badgeClass: 'ss-badge-indigo', icon: Sparkles };
      case 'PENDING':
        return { label: '2. Chờ duyệt', badgeClass: 'ss-badge-warning', icon: Clock };
      case 'APPROVED':
        return { label: '3. Đã duyệt', badgeClass: 'ss-badge-info', icon: ShieldCheck };
      case 'IN_TRANSIT':
        return { label: '4. Đang chuyển', badgeClass: 'ss-badge-expired', icon: Truck };
      case 'RECEIVED':
        return { label: '5. Đã nhận', badgeClass: 'ss-badge-safe', icon: CheckCircle2 };
      case 'CANCELLED':
        return { label: 'Đã hủy', badgeClass: 'ss-badge-danger', icon: XCircle };
      default:
        return { label: status, badgeClass: 'ss-badge-neutral', icon: Clock };
    }
  };

  const filteredTransfers = transfers.filter(t => {
    if (statusFilter === 'ALL') return true;
    return String(t.status).toUpperCase() === statusFilter;
  });

  const proposals = matrixData?.orToolsTransferProposals || [];
  const singleStoreMode = isSingleStore || Boolean(matrixData?.isSingleStore);
  const storeCols = matrixData?.stores || storesList || [];
  const availableProducts = matrixData?.matrixByProduct || [];

  if (!isLoading && singleStoreMode) {
    return (
      <div className="ss-card ss-card-pad" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'var(--primary-bg)',
            border: '1px solid var(--primary-border)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            marginBottom: '12px'
          }}
        >
          <Building2 size={26} />
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700 }}>
          Chế độ Cửa hàng Độc lập (1 Chi nhánh)
        </h1>
        <p style={{ margin: '0 auto', maxWidth: '560px', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
          Doanh nghiệp hiện chỉ có 1 chi nhánh đang hoạt động. Chức năng Stock Transfer điều phối liên chi nhánh được khóa theo đúng định hướng cho cửa hàng độc lập.
        </p>
      </div>
    );
  }

  const totalSavedVal = proposals.reduce((s, p) => s + Number(p.savedSpoilageValue || 0), 0);
  const totalNetBenefit = proposals.reduce((s, p) => s + Number(p.netFinancialBenefit || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div className="ss-page-header">
        <div>
          <h1 className="ss-page-title">Điều chuyển Hàng hóa Nội bộ</h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canApprove && (
            <button type="button" className="ss-btn ss-btn-primary" onClick={() => { setCreateError(''); setShowCreateModal(true); }}>
              <Plus size={16} /> Tạo Đề xuất
            </button>
          )}
          <button type="button" className="ss-btn ss-btn-secondary" onClick={loadData} disabled={isLoading}>
            <RefreshCw size={15} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} /> Làm mới
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="ss-kpi-grid">
        <div className="ss-card ss-card-pad">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Phương án AI OR-Tools</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
            {proposals.length} đề xuất
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Đã kiểm tra HSD ≥ 2 ngày & lợi ích &gt; phí ship</div>
        </div>
        <div className="ss-card ss-card-pad">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Phiếu điều chuyển hiện có</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '4px' }}>
            {transfers.length} phiếu
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Hoàn tất: <strong>{transfers.filter(t => String(t.status).toUpperCase() === 'RECEIVED').length}</strong> • Chờ xử lý: <strong>{transfers.filter(t => ['PROPOSED', 'PENDING', 'APPROVED', 'IN_TRANSIT'].includes(String(t.status).toUpperCase())).length}</strong>
          </div>
        </div>
        <div className="ss-card ss-card-pad">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Giá trị cứu hàng dự kiến</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--safe-green-light)', marginTop: '4px' }}>
            {totalSavedVal.toLocaleString('vi-VN')} đ
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Lợi ích ròng sau trừ phí ship: <strong>{totalNetBenefit.toLocaleString('vi-VN')} đ</strong>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: actionMsg.type === 'error' ? 'var(--danger-red-bg)' : 'var(--safe-green-bg)',
            border: `1px solid ${actionMsg.type === 'error' ? 'var(--danger-red-border)' : 'var(--safe-green-border)'}`,
            color: actionMsg.type === 'error' ? 'var(--danger-red-light)' : 'var(--safe-green-light)',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {actionMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {actionMsg.text}
          </span>
          <button type="button" onClick={() => setActionMsg(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}>
            Đóng
          </button>
        </div>
      )}

      {/* 1. Ma trận Dư - Thiếu */}
      <section className="ss-card ss-card-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.02rem', fontWeight: 700, margin: 0 }}>
              Tồn kho & Nhu cầu 7 ngày giữa các Chi nhánh
            </h2>
          </div>
          <span className="ss-badge ss-badge-neutral">
            {weatherCond === 'SUNNY' ? 'Nắng' : weatherCond === 'RAINY' ? 'Mưa' : 'Thường'}{isHoliday ? ' • Ngày lễ' : ''}
          </span>
        </div>

        <div className="table-wrapper" tabIndex={0} role="region" aria-label="Ma trận cân bằng tồn kho chi nhánh">
          <table className="ss-table ss-table-responsive">
            <thead>
              <tr>
                <th scope="col">Sản phẩm</th>
                {storeCols.slice(0, 4).map(st => (
                  <th key={st.id} scope="col" title={st.storeName}>{shortStoreLabel(st.storeName, st.storeCode)}</th>
                ))}
                <th scope="col">Đề xuất & Lợi ích</th>
                <th scope="col" style={{ textAlign: 'right' }}>Tạo đề xuất</th>
              </tr>
            </thead>
            <tbody>
              {(matrixData?.matrixByProduct || []).map(item => {
                const primaryProposal = item.transferProposals?.[0] || null;
                return (
                  <tr key={item.productId}>
                    <td data-label="Sản phẩm">
                      <div style={{ fontWeight: 700 }}>{item.productName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{item.sku}</div>
                    </td>
                    {storeCols.slice(0, 4).map((_, sIdx) => {
                      const st = item.stores?.[sIdx];
                      if (!st) return <td key={sIdx}>—</td>;
                      const isSurplus = st.netBalance > 0;
                      const isDeficit = st.netBalance < 0;
                      return (
                        <td key={st.storeId} data-label={st.storeCode}>
                          <div className="num-tabular" style={{ fontWeight: 600 }}>Tồn: {st.currentStock} (Cầu 7d: {st.predictedDemand7d})</div>
                          <span className={`ss-badge ${isSurplus ? 'ss-badge-warning' : isDeficit ? 'ss-badge-danger' : 'ss-badge-safe'}`} style={{ marginTop: '3px' }}>
                            {isSurplus ? `Dư +${st.netBalance}` : isDeficit ? `Thiếu ${st.netBalance}` : 'Cân bằng'}
                          </span>
                        </td>
                      );
                    })}
                    <td data-label="Đề xuất" style={{ maxWidth: '280px' }}>
                      {primaryProposal ? (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.8rem' }}>
                            Chuyển {primaryProposal.transferQuantity} ĐV ({primaryProposal.fromStoreCode} → {primaryProposal.toStoreCode})
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--safe-green-light)', fontWeight: 600 }}>
                            Cứu {Number(primaryProposal.savedSpoilageValue || 0).toLocaleString('vi-VN')}đ • Ròng +{Number(primaryProposal.netFinancialBenefit || 0).toLocaleString('vi-VN')}đ
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          Không cần chuyển • Gợi ý đặt DC: {item.optimalDcOrderQty} ĐV
                        </span>
                      )}
                    </td>
                    <td data-label="Thao tác" style={{ textAlign: 'right' }}>
                      {primaryProposal && canApprove && (isOwnerRole || myStoreId === Number(primaryProposal.fromStoreId)) ? (
                        <button
                          type="button"
                          className="ss-btn ss-btn-primary ss-btn-sm"
                          onClick={() => handleCreateProposalFromOrTools(primaryProposal)}
                        >
                          <Plus size={13} /> Tạo Đề xuất ({primaryProposal.transferQuantity})
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>Ổn định</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Bảng Quản lý Phiếu Điều chuyển 5 Trạng thái */}
      <section className="ss-card ss-card-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontSize: '1.02rem', fontWeight: 700, margin: 0 }}>
            Theo dõi & Phê duyệt Phiếu Điều chuyển Nội bộ
          </h2>

          <div className="ss-pill-tablist" role="tablist" aria-label="Lọc trạng thái phiếu điều chuyển">
            {[
              { key: 'ALL', label: `Tất cả (${transfers.length})` },
              { key: 'PROPOSED', label: 'Đề xuất' },
              { key: 'PENDING', label: 'Chờ duyệt' },
              { key: 'APPROVED', label: 'Đã duyệt' },
              { key: 'IN_TRANSIT', label: 'Đang chuyển' },
              { key: 'RECEIVED', label: 'Đã nhận' },
              { key: 'CANCELLED', label: 'Đã hủy' }
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.key}
                className="ss-pill-tab"
                onClick={() => setStatusFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrapper" tabIndex={0} role="region" aria-label="Danh sách phiếu điều chuyển">
          <table className="ss-table ss-table-responsive">
            <thead>
              <tr>
                <th scope="col">Mã phiếu</th>
                <th scope="col">Lộ trình</th>
                <th scope="col">Sản phẩm & Lô nguồn</th>
                <th scope="col">SL & Ròng</th>
                <th scope="col">Trạng thái</th>
                <th scope="col" style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    Không có phiếu điều chuyển nào ở trạng thái đã chọn.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map(tr => {
                  const badge = getStatusBadge(tr.status);
                  const BadgeIcon = badge.icon;
                  const stUpper = String(tr.status).toUpperCase();
                  const canFromStore = isOwnerRole || (myStoreId > 0 && myStoreId === Number(tr.fromStoreId));
                  const canToStore = isOwnerRole || (myStoreId > 0 && myStoreId === Number(tr.toStoreId));
                  const canCancelParty = isOwnerRole || canFromStore || canToStore;
                  const shipFee = Number(tr.shippingCost || 0);
                  const netSaved = Number(tr.savedSpoilageValue || 0) - shipFee;

                  return (
                    <tr key={tr.id} title={tr.aiRecommendationNote || undefined}>
                      <td data-label="Mã phiếu" style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{tr.transferCode}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{tr.requestedByName || 'Hệ thống'}</div>
                      </td>
                      <td data-label="Lộ trình" style={{ minWidth: '115px' }}>
                        <div style={{ fontWeight: 600 }} title={tr.fromStoreName}>{shortStoreLabel(tr.fromStoreName)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--safe-green-light)', fontWeight: 700 }} title={tr.toStoreName}>
                          → {shortStoreLabel(tr.toStoreName)}
                        </div>
                      </td>
                      <td data-label="Sản phẩm" style={{ minWidth: '160px', maxWidth: '220px' }}>
                        <div style={{ fontWeight: 700 }}>{tr.productName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                          {tr.sourceBatchCode} • HSD {String(tr.sourceBatchExpiry || '').slice(0, 10)}
                        </div>
                      </td>
                      <td data-label="SL & Ròng" className="num-tabular" style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700 }}>{tr.transferQuantity} ĐV</div>
                        <div style={{ fontSize: '0.73rem', color: netSaved > 0 ? 'var(--safe-green-light)' : 'var(--text-muted)' }}>
                          {netSaved >= 0 ? `+${netSaved.toLocaleString('vi-VN')}` : netSaved.toLocaleString('vi-VN')}đ
                          {shipFee > 0 ? ` (Ship ${shipFee.toLocaleString('vi-VN')}đ)` : ''}
                        </div>
                      </td>
                      <td data-label="Trạng thái" style={{ whiteSpace: 'nowrap' }}>
                        <span className={`ss-badge ${badge.badgeClass}`}>
                          <BadgeIcon size={12} /> {badge.label}
                        </span>
                        {tr.approvedByName && (
                          <div style={{ marginTop: '3px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            Duyệt: {tr.approvedByName}
                          </div>
                        )}
                      </td>
                      <td data-label="Thao tác" style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {stUpper === 'PROPOSED' && canApprove && (
                            <>
                              <button
                                type="button"
                                className="ss-btn ss-btn-primary ss-btn-sm"
                                onClick={() => handleUpdateStatus(tr, 'PENDING', 'Gửi đề xuất chờ phê duyệt')}
                              >
                                <Send size={12} /> Gửi duyệt
                              </button>
                              {canCancelParty && (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-secondary ss-btn-sm"
                                  style={{ color: 'var(--danger-red-light)' }}
                                  onClick={() => handleUpdateStatus(tr, 'CANCELLED', 'Hủy đề xuất')}
                                >
                                  Hủy
                                </button>
                              )}
                            </>
                          )}

                          {stUpper === 'PENDING' && canApprove && (
                            <>
                              {canFromStore && (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-primary ss-btn-sm"
                                  onClick={() => handleUpdateStatus(tr, 'APPROVED', 'Quản lý/Chủ chuỗi đã phê duyệt')}
                                >
                                  Phê duyệt
                                </button>
                              )}
                              {canCancelParty && (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-secondary ss-btn-sm"
                                  style={{ color: 'var(--danger-red-light)' }}
                                  onClick={() => handleUpdateStatus(tr, 'CANCELLED', 'Từ chối khi đang chờ duyệt')}
                                >
                                  Hủy
                                </button>
                              )}
                            </>
                          )}

                          {stUpper === 'APPROVED' && (
                            <>
                              {canFromStore ? (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-primary ss-btn-sm"
                                  onClick={() => handleUpdateStatus(tr, 'IN_TRANSIT', 'Đã xuất kho giao vận chuyển nội bộ')}
                                >
                                  <Truck size={12} /> Xuất kho chuyển
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Chờ CN xuất giao</span>
                              )}
                              {canApprove && canCancelParty && (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-secondary ss-btn-sm"
                                  style={{ color: 'var(--danger-red-light)' }}
                                  onClick={() => handleUpdateStatus(tr, 'CANCELLED', 'Hủy trước khi xuất kho')}
                                >
                                  Hủy
                                </button>
                              )}
                            </>
                          )}

                          {stUpper === 'IN_TRANSIT' && (
                            <>
                              {canToStore ? (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-primary ss-btn-sm"
                                  onClick={() => handleUpdateStatus(tr, 'RECEIVED', 'Chi nhánh nhận đã kiểm đếm đủ & nhập kho FEFO')}
                                >
                                  <CheckCircle2 size={12} /> Xác nhận đã nhận
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Đang vận chuyển</span>
                              )}
                              {canApprove && canCancelParty && (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-secondary ss-btn-sm"
                                  style={{ color: 'var(--danger-red-light)' }}
                                  onClick={() => handleUpdateStatus(tr, 'CANCELLED', 'Hủy chuyến — hoàn kho lô nguồn')}
                                >
                                  Hủy & Hoàn kho
                                </button>
                              )}
                            </>
                          )}

                          {(stUpper === 'APPROVED' || stUpper === 'IN_TRANSIT' || stUpper === 'RECEIVED') && (
                            <button
                              type="button"
                              className="ss-btn ss-btn-secondary ss-btn-sm"
                              onClick={() => {
                                setDocModalTransfer(tr);
                                setDocTab(stUpper === 'RECEIVED' ? 'receipt' : stUpper === 'IN_TRANSIT' ? 'transit' : 'outbound');
                              }}
                              title="Xem Phiếu xuất kho, Vận chuyển & Nhận hàng"
                            >
                              <FileText size={12} /> Chứng từ
                            </button>
                          )}
                          {(stUpper === 'RECEIVED' || stUpper === 'CANCELLED') && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Đã xong</span>
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
      </section>

      {/* Manual Create Transfer Native Dialog */}
      <ModalDialog
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo Đề xuất Điều chuyển Hàng Nội bộ"
        subtitle="Hệ thống tự chọn lô FEFO còn ≥ 2 ngày HSD tại chi nhánh xuất. Tồn kho chỉ thay đổi khi xuất và nhận hàng."
      >
        <form onSubmit={handleManualCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="ss-field">
              <label className="ss-label" htmlFor="trf-from-store">Chi nhánh xuất (Dư hàng)</label>
              <select
                id="trf-from-store"
                disabled={!isOwnerRole}
                value={newTransferForm.fromStoreId}
                onChange={(e) => setNewTransferForm({ ...newTransferForm, fromStoreId: Number(e.target.value) })}
              >
                <option value={0} disabled>— Chọn chi nhánh xuất —</option>
                {storeCols.map(st => (
                  <option key={st.id} value={st.id}>{st.storeName}</option>
                ))}
              </select>
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="trf-to-store">Chi nhánh nhận (Thiếu hàng)</label>
              <select
                id="trf-to-store"
                value={newTransferForm.toStoreId}
                onChange={(e) => setNewTransferForm({ ...newTransferForm, toStoreId: Number(e.target.value) })}
              >
                <option value={0} disabled>— Chọn chi nhánh nhận —</option>
                {storeCols.map(st => (
                  <option key={st.id} value={st.id}>{st.storeName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ss-field">
            <label className="ss-label" htmlFor="trf-product">Sản phẩm cần điều chuyển</label>
            <select
              id="trf-product"
              value={newTransferForm.productId}
              onChange={(e) => setNewTransferForm({ ...newTransferForm, productId: Number(e.target.value) })}
            >
              <option value={0} disabled>— Chọn sản phẩm —</option>
              {availableProducts.map(p => (
                <option key={p.productId} value={p.productId}>{p.sku} — {p.productName}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="ss-field">
              <label className="ss-label" htmlFor="trf-qty">Số lượng chuyển</label>
              <input
                id="trf-qty"
                type="number"
                min="1"
                required
                value={newTransferForm.transferQuantity || ''}
                onChange={(e) => setNewTransferForm({ ...newTransferForm, transferQuantity: Number(e.target.value) })}
              />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="trf-ship">Phí vận chuyển dự kiến (đ)</label>
              <input
                id="trf-ship"
                type="number"
                min="0"
                required
                value={newTransferForm.shippingCost}
                onChange={(e) => setNewTransferForm({ ...newTransferForm, shippingCost: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="ss-field">
            <label className="ss-label" htmlFor="trf-note">Giải thích lý do điều chuyển</label>
            <textarea
              id="trf-note"
              rows={2}
              placeholder="Ví dụ: CN Bửu Long dư lô cận hạn, CN Tân Phong dự báo tăng cuối tuần..."
              value={newTransferForm.aiRecommendationNote}
              onChange={(e) => setNewTransferForm({ ...newTransferForm, aiRecommendationNote: e.target.value })}
            />
          </div>

          {createError && (
            <div role="alert" style={{ color: 'var(--danger-red-light, #dc2626)', fontSize: '0.8rem', fontWeight: 600 }}>{createError}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button type="button" className="ss-btn ss-btn-secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
            <button type="submit" className="ss-btn ss-btn-primary">Tạo Đề xuất</button>
          </div>
        </form>
      </ModalDialog>

      {/* 3 Chứng từ Điều phối (Phiếu xuất kho, Vận chuyển, Nhận hàng FEFO) */}
      <ModalDialog
        isOpen={Boolean(docModalTransfer)}
        onClose={() => setDocModalTransfer(null)}
        title={docModalTransfer ? `Chứng từ Điều chuyển: ${docModalTransfer.transferCode}` : ''}
        subtitle={docModalTransfer ? `${docModalTransfer.fromStoreName} → ${docModalTransfer.toStoreName}` : ''}
      >
        {docModalTransfer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="ss-pill-tablist" role="tablist" aria-label="Loại chứng từ điều chuyển">
              <button type="button" role="tab" aria-selected={docTab === 'outbound'} className="ss-pill-tab" onClick={() => setDocTab('outbound')}>
                1. Phiếu Xuất kho
              </button>
              <button type="button" role="tab" aria-selected={docTab === 'transit'} className="ss-pill-tab" onClick={() => setDocTab('transit')}>
                2. Phiếu Vận chuyển
              </button>
              <button type="button" role="tab" aria-selected={docTab === 'receipt'} className="ss-pill-tab" onClick={() => setDocTab('receipt')}>
                3. Phiếu Nhận hàng FEFO
              </button>
            </div>

            <div className="ss-card-subtle" style={{ padding: '14px', fontSize: '0.84rem', lineHeight: 1.65 }}>
              {docTab === 'outbound' && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>PHIẾU XUẤT KHO ĐIỀU CHUYỂN (XK-{docModalTransfer.transferCode})</div>
                  <div>Kho xuất: <strong>{docModalTransfer.fromStoreName}</strong></div>
                  <div>Mặt hàng: <strong>{docModalTransfer.productName}</strong> ({docModalTransfer.sku})</div>
                  <div>Lô xuất (FEFO): <strong style={{ fontFamily: 'monospace' }}>{docModalTransfer.sourceBatchCode}</strong> • HSD: <strong>{String(docModalTransfer.sourceBatchExpiry || '').slice(0, 10)}</strong></div>
                  <div>Số lượng xuất: <strong>{docModalTransfer.transferQuantity} ĐV</strong> • Người duyệt: <strong>{docModalTransfer.approvedByName || 'Quản lý'}</strong></div>
                </div>
              )}
              {docTab === 'transit' && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>PHIẾU VẬN CHUYỂN NỘI BỘ (VC-{docModalTransfer.transferCode})</div>
                  <div>Từ: <strong>{docModalTransfer.fromStoreName}</strong> → Đến: <strong>{docModalTransfer.toStoreName}</strong></div>
                  <div>Điều kiện bảo quản yêu cầu: <strong>{docModalTransfer.storageTemperature || 'Nhiệt độ tiêu chuẩn'}</strong></div>
                  <div>Chi phí vận chuyển: <strong>{Number(docModalTransfer.shippingCost || 0).toLocaleString('vi-VN')} đ</strong></div>
                  <div>Trạng thái hiện tại: <strong>{getStatusBadge(docModalTransfer.status).label}</strong></div>
                </div>
              )}
              {docTab === 'receipt' && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>BIÊN BẢN NHẬN HÀNG FEFO (NH-{docModalTransfer.transferCode})</div>
                  <div>Chi nhánh tiếp nhận: <strong>{docModalTransfer.toStoreName}</strong></div>
                  <div>Sản phẩm & Lô: <strong>{docModalTransfer.productName}</strong> • Lô <strong>{docModalTransfer.sourceBatchCode}</strong></div>
                  <div>Số lượng thực nhận: <strong>{docModalTransfer.transferQuantity} ĐV</strong></div>
                  <div>Thời điểm hoàn tất: <strong>{docModalTransfer.receivedAt ? new Date(docModalTransfer.receivedAt).toLocaleString('vi-VN') : 'Chưa xác nhận nhận'}</strong></div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="ss-btn ss-btn-secondary" onClick={() => window.print()}>
                <Printer size={14} /> In chứng từ
              </button>
              <button type="button" className="ss-btn ss-btn-primary" onClick={() => setDocModalTransfer(null)}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </ModalDialog>
    </div>
  );
}
