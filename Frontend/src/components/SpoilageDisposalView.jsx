import React, { useState, useEffect } from 'react';
import {
  Trash2,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  FileText,
  TrendingDown,
  Lock,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Package,
  X,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowRight,
  Boxes,
  History,
  DollarSign,
  Download,
  FileSpreadsheet,
  Printer,
  Plus
} from 'lucide-react';
import { exportSpoilageLedgerToExcel } from '../utils/exportUtils';
import PrintSpoilageReceiptModal from './PrintSpoilageReceiptModal';
import DisposalFormModal from './DisposalFormModal';

// Helper: Chuẩn hóa chuỗi tiếng Việt không dấu
function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

// Helper: Icon ngành hàng
function getCategoryIcon(catName) {
  if (!catName) return '📦';
  if (catName.includes('Sữa')) return '🥛';
  if (catName.includes('Bánh')) return '🍞';
  if (catName.includes('Nước')) return '🥤';
  if (catName.includes('Thịt') || catName.includes('Cá') || catName.includes('Trứng')) return '🥩';
  if (catName.includes('Rau') || catName.includes('Trái')) return '🥗';
  if (catName.includes('chế biến')) return '🌭';
  if (catName.includes('khô')) return '🍜';
  return '📦';
}

export default function SpoilageDisposalView({
  disposals = [],
  batches = [],
  products = [],
  currentUser = null,
  currentRole = 'STAFF',
  isAdmin = false,
  storeProfile = null,
  onCreateDisposal,
  onApproveDisposal,
  preselectedBatchId,
  onRequestAdminLogin
}) {
  // Lô hàng có tồn > 0 và chưa tiêu hủy
  const availableBatches = batches.filter(b => (Number(b.currentQuantity ?? b.quantity ?? 0) > 0) && b.status !== 'DISPOSED');

  // Lô nguy cơ: Quá hạn, Vùng Đỏ cận date, Vùng Vàng
  const atRiskBatches = availableBatches.filter(b =>
    b.status === 'EXPIRED' || b.status === 'CRITICAL' || b.status === 'WARNING'
  );

  // Tabs: 'risk-batches' (Lô cần xử lý) | 'disposal-records' (Sổ biên bản tiêu hủy)
  const [activeTab, setActiveTab] = useState('risk-batches');

  // Bộ lọc cho danh sách lô
  const [batchSearch, setBatchSearch] = useState('');
  const [batchFilterMode, setBatchFilterMode] = useState('RISK'); // RISK, EXPIRED, CRITICAL, WARNING, ALL

  // Bộ lọc cho sổ biên bản
  const [recordSearch, setRecordSearch] = useState('');
  const [recordStatusFilter, setRecordStatusFilter] = useState('ALL'); // ALL, APPROVED, PENDING

  // State Modal Lập Phiếu Tiêu Hủy
  const [isDisposalModalOpen, setIsDisposalModalOpen] = useState(false);
  const [modalInitialBatchId, setModalInitialBatchId] = useState(null);

  // Banner thông báo kết quả
  const [bannerMsg, setBannerMsg] = useState('');
  const [selectedRecordToPrint, setSelectedRecordToPrint] = useState(null);

  // Tự động mở modal nếu được điều hướng từ FEFO Monitor kèm preselectedBatchId
  useEffect(() => {
    if (preselectedBatchId) {
      setModalInitialBatchId(Number(preselectedBatchId));
      setIsDisposalModalOpen(true);
    }
  }, [preselectedBatchId]);

  // Lọc danh sách Lô
  const filteredBatches = availableBatches.filter(b => {
    let matchesMode = true;
    if (batchFilterMode === 'RISK') {
      matchesMode = b.status === 'EXPIRED' || b.status === 'CRITICAL' || b.status === 'WARNING';
    } else if (batchFilterMode !== 'ALL') {
      matchesMode = b.status === batchFilterMode;
    }

    if (!batchSearch.trim()) return matchesMode;

    const normSearch = stripVietnamese(batchSearch);
    const normName = stripVietnamese(b.productName);
    const normCode = (b.batchCode || '').toLowerCase();
    return matchesMode && (normName.includes(normSearch) || normCode.includes(normSearch));
  });

  // Lọc sổ biên bản
  const filteredRecords = disposals.filter(d => {
    const matchesStatus = recordStatusFilter === 'ALL' || d.status === recordStatusFilter;
    if (!recordSearch.trim()) return matchesStatus;

    const normSearch = stripVietnamese(recordSearch);
    const normId = (d.id || d.recordCode || '').toLowerCase();
    const normProd = stripVietnamese(d.productName || '');
    const normBatch = (d.batchCode || '').toLowerCase();
    return matchesStatus && (normId.includes(normSearch) || normProd.includes(normSearch) || normBatch.includes(normSearch));
  });

  // Thống kê tài chính
  const totalFinancialLoss = disposals.reduce((sum, d) => sum + (d.totalLoss || d.costLoss || 0), 0);
  const totalDisposedItems = disposals.reduce((sum, d) => sum + (d.quantity || d.quantityDisposed || 0), 0);
  const approvedCount = disposals.filter(d => d.status === 'APPROVED').length;
  const pendingCount = disposals.filter(d => d.status === 'PENDING').length;

  // Xử lý gửi phiếu từ Modal
  const handleModalSubmit = async (recordData) => {
    if (onCreateDisposal) {
      const res = await onCreateDisposal(recordData);
      if (res && res.success === false) {
        throw new Error(res.message || 'Lỗi ghi nhận CSDL');
      }
      const finalCode = res?.recordCode || recordData.id;
      setBannerMsg(recordData.status === 'APPROVED'
        ? `✓ Đã lập biên bản ${finalCode} và DUYỆT trừ kho thành công! CostLoss: ${recordData.costLoss.toLocaleString('vi-VN')} đ`
        : `✓ Đã lập đề xuất tiêu hủy ${finalCode}! Biên bản đang ở trạng thái Chờ duyệt.`);
      setTimeout(() => setBannerMsg(''), 6000);

      // Mở modal in biên bản
      setSelectedRecordToPrint({
        ...recordData,
        recordCode: finalCode,
        id: finalCode
      });
    }
  };

  const handleOpenDisposalForBatch = (b) => {
    setModalInitialBatchId(b ? b.id : null);
    setIsDisposalModalOpen(true);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      minHeight: 'calc(100vh - 115px)'
    }}>

      {/* HEADER & THANH ĐIỀU PHỐI CHÍNH (FULL-WIDTH) */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        flexShrink: 0
      }}>
        {/* Tiêu đề & Thông tin cửa hàng */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '9px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <Trash2 size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                Sổ Hao Hụt Tài Chính & Tiêu Hủy Hàng Hỏng
              </h2>
              
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Cơ sở: <strong style={{ color: 'var(--primary)' }}>{storeProfile?.storeCode || 'RETAIL-STORE-01'}</strong> ({storeProfile?.storeName || 'LHU Mart'}) 
            </div>
          </div>
        </div>

        {/* Cụm Nút Thao Tác: Lập Phiếu Tiêu Hủy & Xuất Excel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => exportSpoilageLedgerToExcel(filteredRecords)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '0.785rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Xuất dữ liệu Sổ hao hụt tài chính ra file Excel CSV"
          >
            <Download size={14} color="#10b981" />
            <span>Xuất Excel</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDisposalForBatch(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              background: '#ef4444',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
            }}
          >
            <Plus size={16} />
            <span>+ Lập Phiếu Tiêu Hủy Mới</span>
          </button>
        </div>
      </div>

      {/* BANNER THÔNG BÁO TÁC VỤ */}
      {bannerMsg && (
        <div style={{
          background: bannerMsg.startsWith('❌') ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
          border: bannerMsg.startsWith('❌') ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
          color: bannerMsg.startsWith('❌') ? '#dc2626' : '#047857',
          padding: '8px 14px',
          borderRadius: '8px',
          fontSize: '0.8rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {bannerMsg.startsWith('❌') ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{bannerMsg}</span>
          </div>
          <button onClick={() => setBannerMsg('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* DẢI 3 CHỈ SỐ KPI TÀI CHÍNH HAO HỤT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', flexShrink: 0 }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Tổng Tổn Thất Hao Hụt (CostLoss)
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
              {totalFinancialLoss.toLocaleString('vi-VN')} đ
            </div>
          </div>
          <DollarSign size={24} color="#dc2626" style={{ opacity: 0.8 }} />
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Hàng Đã Tiêu Hủy
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
              {totalDisposedItems} món
            </div>
          </div>
          <Package size={24} color="#d97706" style={{ opacity: 0.8 }} />
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Tình Trạng Phê Duyệt Sổ
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#047857', marginTop: '4px', display: 'flex', gap: '10px' }}>
              <span>✓ {approvedCount} đã chốt</span>
              {pendingCount > 0 && <span style={{ color: '#d97706' }}>⏳ {pendingCount} chờ duyệt</span>}
            </div>
          </div>
          <ShieldCheck size={24} color="#047857" style={{ opacity: 0.8 }} />
        </div>
      </div>

      {/* CONTAINER CHÍNH CHỨA 2 TABS TO RỘNG 100% FULL-WIDTH */}
      <div style={{
        flex: 1,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Tab Switcher Toolbar */}
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          background: 'var(--bg-subtle)'
        }}>
          {/* 2 Tabs chuyển đổi */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('risk-batches')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.825rem',
                background: activeTab === 'risk-batches' ? 'rgba(239, 68, 68, 0.14)' : 'transparent',
                color: activeTab === 'risk-batches' ? '#dc2626' : 'var(--text-muted)',
                outline: activeTab === 'risk-batches' ? '1px solid #dc2626' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <AlertTriangle size={15} />
              <span>Lô Cần Xử Lý ({atRiskBatches.length} Lô)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('disposal-records')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.825rem',
                background: activeTab === 'disposal-records' ? 'rgba(16, 185, 129, 0.14)' : 'transparent',
                color: activeTab === 'disposal-records' ? '#047857' : 'var(--text-muted)',
                outline: activeTab === 'disposal-records' ? '1px solid #059669' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <FileText size={15} />
              <span>Sổ Biên Bản Tiêu Hủy ({disposals.length} Phiếu)</span>
            </button>
          </div>

          {/* Ô Tìm Kiếm theo ngữ cảnh của Tab đang chọn */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeTab === 'risk-batches' ? (
              <>
                <div style={{ position: 'relative', width: '260px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{
                      width: '100%',
                      paddingLeft: '30px',
                      paddingRight: '10px',
                      height: '32px',
                      fontSize: '0.785rem',
                      borderRadius: '6px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Tìm mã lô (LOT-...), tên sp..."
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { id: 'RISK', label: 'Cần xử lý', count: atRiskBatches.length },
                    { id: 'EXPIRED', label: 'Quá hạn', count: availableBatches.filter(b => b.status === 'EXPIRED').length },
                    { id: 'CRITICAL', label: 'Cận date', count: availableBatches.filter(b => b.status === 'CRITICAL').length },
                    { id: 'ALL', label: 'Tất cả lô', count: availableBatches.length }
                  ].map(chip => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setBatchFilterMode(chip.id)}
                      style={{
                        fontSize: '0.72rem',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: batchFilterMode === chip.id ? '1px solid #dc2626' : '1px solid var(--border-subtle)',
                        background: batchFilterMode === chip.id ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-surface)',
                        color: batchFilterMode === chip.id ? '#dc2626' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: batchFilterMode === chip.id ? 700 : 500
                      }}
                    >
                      {chip.label} ({chip.count})
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{
                      width: '100%',
                      paddingLeft: '30px',
                      paddingRight: '10px',
                      height: '32px',
                      fontSize: '0.785rem',
                      borderRadius: '6px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Tìm mã phiếu (DISP-...), tên sản phẩm..."
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                  />
                </div>

                <select
                  className="form-select"
                  style={{
                    width: '150px',
                    height: '32px',
                    padding: '0 8px',
                    fontSize: '0.785rem',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                  value={recordStatusFilter}
                  onChange={(e) => setRecordStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="APPROVED">Đã phê duyệt</option>
                  <option value="PENDING">Chờ duyệt</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* NỘI DUNG TAB 1: BẢNG LÔ CẦN XỬ LÝ (100% FULL-WIDTH) */}
        {/* ========================================================================= */}
        {activeTab === 'risk-batches' && (
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
            <table className="modern-table" style={{ margin: 0, width: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)' }}>
                <tr>
                  <th style={{ width: '140px', padding: '10px 14px' }}>Mã Lô</th>
                  <th style={{ padding: '10px 14px' }}>Sản Phẩm & Ngành Hàng</th>
                  <th style={{ width: '110px', padding: '10px 14px' }}>Hạn Dùng</th>
                  <th style={{ width: '90px', padding: '10px 14px' }}>Tồn Kho</th>
                  <th style={{ width: '100px', padding: '10px 14px' }}>Giá Vốn</th>
                  <th style={{ width: '120px', textAlign: 'right', padding: '10px 14px' }}>Thiệt Hại Lô</th>
                  <th style={{ width: '100px', textAlign: 'center', padding: '10px 14px' }}>Trạng Thái</th>
                  <th style={{ width: '120px', textAlign: 'center', padding: '10px 14px' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Không có lô hàng nào cần xử lý hoặc khớp điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => {
                    const stockQty = Number(b.currentQuantity ?? b.quantity ?? 0);
                    const estLoss = stockQty * (b.importPrice || b.costPrice || 25000);
                    return (
                      <tr key={b.id}>
                        {/* Batch Code */}
                        <td style={{ padding: '8px 14px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.825rem' }}>
                            {b.batchCode}
                          </span>
                        </td>

                        {/* Product & Category */}
                        <td style={{ padding: '8px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.1rem' }}>{getCategoryIcon(b.category)}</span>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                                {b.productName}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {b.category}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Expiry Date */}
                        <td style={{ padding: '8px 14px' }}>
                          <span style={{
                            fontSize: '0.825rem',
                            fontWeight: 700,
                            color: b.status === 'EXPIRED' ? '#dc2626' : b.status === 'CRITICAL' ? '#ea580c' : '#d97706'
                          }}>
                            {b.expiryDate}
                          </span>
                        </td>

                        {/* Stock */}
                        <td style={{ padding: '8px 14px' }}>
                          <strong style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                            {stockQty}
                          </strong>
                        </td>

                        {/* Cost Price */}
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '8px 14px' }}>
                          {(b.importPrice || b.costPrice || 25000).toLocaleString('vi-VN')} đ
                        </td>

                        {/* Est Loss */}
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626', fontSize: '0.85rem', padding: '8px 14px' }}>
                          {estLoss.toLocaleString('vi-VN')} đ
                        </td>

                        {/* Status Badge */}
                        <td style={{ textAlign: 'center', padding: '8px 14px' }}>
                          <span className={`badge ${b.status === 'EXPIRED' ? 'badge-danger' : b.status === 'CRITICAL' ? 'badge-danger' : b.status === 'WARNING' ? 'badge-warning' : 'badge-safe'}`} style={{ fontSize: '0.675rem' }}>
                            {b.status}
                          </span>
                        </td>

                        {/* Action: Bấm mở Modal Tiêu Hủy */}
                        <td style={{ textAlign: 'center', padding: '8px 14px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenDisposalForBatch(b)}
                            style={{
                              fontSize: '0.75rem',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid #fecdd3',
                              background: '#fff1f2',
                              color: '#be123c',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                            title="Mở cửa sổ lập phiếu tiêu hủy cho lô này"
                          >
                            <Trash2 size={12} />
                            <span>Lập Hủy</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================================= */}
        {/* NỘI DUNG TAB 2: SỔ BIÊN BẢN TIÊU HỦY & HẠCH TOÁN (100% FULL-WIDTH) */}
        {/* ========================================================================= */}
        {activeTab === 'disposal-records' && (
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
            <table className="modern-table" style={{ margin: 0, width: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)' }}>
                <tr>
                  <th style={{ width: '150px', padding: '10px 14px' }}>Mã Biên Bản & Ngày</th>
                  <th style={{ padding: '10px 14px' }}>Sản Phẩm & Lô Hàng</th>
                  <th style={{ width: '130px', padding: '10px 14px' }}>SL × Giá Vốn</th>
                  <th style={{ padding: '10px 14px' }}>Lý Do & Ghi Chú</th>
                  <th style={{ width: '160px', padding: '10px 14px' }}>Người Lập / Ký Duyệt</th>
                  <th style={{ width: '130px', textAlign: 'right', padding: '10px 14px' }}>Thiệt hại vốn</th>
                  <th style={{ width: '150px', textAlign: 'center', padding: '10px 14px' }}>Trạng Thái / Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Chưa có biên bản tiêu hủy nào khớp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item) => {
                    const qtyDisposed = item.quantityDisposed ?? item.quantity ?? 0;
                    const impPrice = item.importPrice ?? item.costPrice ?? 0;
                    const lossVal = item.costLoss ?? item.totalLoss ?? (qtyDisposed * impPrice);
                    const reasonLabel = item.reason === 'EXPIRED'
                      ? 'EXPIRED (Hết hạn)'
                      : item.reason === 'DAMAGED'
                        ? 'DAMAGED (Hỏng bao bì)'
                        : item.reason === 'SPOILED'
                          ? 'SPOILED (Biến chất)'
                          : item.reason;

                    return (
                      <tr key={item.id || item.recordCode}>
                        {/* ID & Date */}
                        <td style={{ padding: '8px 14px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '0.825rem' }}>
                            {item.recordCode || item.id}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {item.disposedDate || item.date}
                          </div>
                        </td>

                        {/* Product & Batch */}
                        <td style={{ padding: '8px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>{item.productName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontFamily: 'monospace' }}>Lô: {item.batchCode}</div>
                        </td>

                        {/* Quantity x Price */}
                        <td style={{ padding: '8px 14px' }}>
                          <div>
                            <strong style={{ color: '#ef4444', fontSize: '0.85rem' }}>-{qtyDisposed}</strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '3px' }}>
                              {item.unit || 'hộp'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            × {Number(impPrice).toLocaleString('vi-VN')} đ
                          </div>
                        </td>

                        {/* Reason & Notes */}
                        <td style={{ padding: '8px 14px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: item.reason === 'EXPIRED' ? '#dc2626' : '#d97706' }}>
                            {reasonLabel}
                          </div>
                          {item.notes && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {item.notes}
                            </div>
                          )}
                        </td>

                        {/* PerformedBy & ApprovedBy */}
                        <td style={{ padding: '8px 14px', fontSize: '0.725rem' }}>
                          <div style={{ color: 'var(--text-main)' }}>
                            Lập: <strong>{item.performedByName || 'Nhân viên ca'}</strong>
                          </div>
                          <div style={{ color: item.status === 'APPROVED' ? '#047857' : '#d97706', marginTop: '2px' }}>
                            Duyệt: <strong>{item.approvedByName || item.approvedBy || 'Chờ duyệt'}</strong>
                          </div>
                        </td>

                        {/* CostLoss */}
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626', fontSize: '0.875rem', padding: '8px 14px' }}>
                          {Number(lossVal).toLocaleString('vi-VN')} đ
                        </td>

                        {/* Status & Actions */}
                        <td style={{ textAlign: 'center', padding: '8px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            {item.status === 'APPROVED' ? (
                              <span className="badge badge-safe" style={{ fontSize: '0.675rem', padding: '2px 8px' }}>✓ Đã Chốt Sổ</span>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Chờ Duyệt</span>
                                {(isAdmin || currentRole === 'ADMIN' || currentRole === 'STORE_MANAGER') && (
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '5px' }}
                                    onClick={async () => {
                                      if (onApproveDisposal) {
                                        const res = await onApproveDisposal(item.recordCode || item.id);
                                        if (res && res.success === false) {
                                          setBannerMsg(`❌ Lỗi phê duyệt: ${res.message}`);
                                          return;
                                        }
                                      }
                                      setBannerMsg(`✓ Đã ký phê duyệt biên bản ${item.recordCode || item.id} và chốt Sổ hao hụt tài chính!`);
                                      setTimeout(() => setBannerMsg(''), 5000);
                                    }}
                                  >
                                    <ShieldCheck size={12} /> Duyệt
                                  </button>
                                )}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedRecordToPrint(item)}
                              style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                borderRadius: '5px',
                                padding: '3px 8px',
                                fontSize: '0.675rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Xem và in biên bản tiêu hủy chuẩn K80"
                            >
                              <Printer size={11} /> In K80
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
        )}
      </div>

      {/* CỬA SỔ BẬT RA (MODAL): LẬP PHIẾU TIÊU HỦY */}
      <DisposalFormModal
        isOpen={isDisposalModalOpen}
        onClose={() => {
          setIsDisposalModalOpen(false);
          setModalInitialBatchId(null);
        }}
        availableBatches={availableBatches}
        initialBatchId={modalInitialBatchId}
        storeProfile={storeProfile}
        currentUser={currentUser}
        currentRole={currentRole}
        isAdmin={isAdmin}
        onSubmitDisposal={handleModalSubmit}
      />

      {/* CỬA SỔ BẬT RA (MODAL): IN BIÊN BẢN TIÊU HỦY K80 */}
      <PrintSpoilageReceiptModal
        isOpen={Boolean(selectedRecordToPrint)}
        onClose={() => setSelectedRecordToPrint(null)}
        record={selectedRecordToPrint}
        storeProfile={storeProfile}
      />

    </div>
  );
}
