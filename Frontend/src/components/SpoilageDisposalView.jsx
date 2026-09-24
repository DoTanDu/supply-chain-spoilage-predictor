import React, { useState } from 'react';
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
  X
} from 'lucide-react';

// Helper: Normalize Vietnamese strings without diacritics
function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

export default function SpoilageDisposalView({ 
  disposals, 
  batches, 
  currentRole, 
  onCreateDisposal, 
  onApproveDisposal 
}) {
  // Eligible batches for disposal (has quantity > 0)
  const availableBatches = batches.filter(b => b.quantity > 0);

  // Search & Filter states
  const [searchBatch, setSearchBatch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, EXPIRED, CRITICAL, WARNING, SAFE

  const [selectedBatchId, setSelectedBatchId] = useState(() => {
    // Default to the first expired or critical batch, or first batch
    const priority = availableBatches.find(b => b.status === 'EXPIRED') || 
                     availableBatches.find(b => b.status === 'CRITICAL') || 
                     availableBatches[0];
    return priority ? priority.id : 101;
  });

  const [disposalQty, setDisposalQty] = useState(2);
  const [reason, setReason] = useState('EXPIRED');
  const [notes, setNotes] = useState('');
  const [bannerMsg, setBannerMsg] = useState('');

  // Filtered batches according to search and status filter
  const filteredBatches = availableBatches.filter(b => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    if (!searchBatch.trim()) return matchesStatus;

    const normSearch = stripVietnamese(searchBatch);
    const normName = stripVietnamese(b.productName);
    const normCode = (b.batchCode || '').toLowerCase();
    const tokens = normSearch.split(/\s+/).filter(Boolean);

    const matchesSearch = tokens.every(tok => normName.includes(tok) || normCode.includes(tok));
    return matchesStatus && matchesSearch;
  });

  const currentSelectedBatch = batches.find(b => b.id === Number(selectedBatchId));

  const totalFinancialLoss = disposals.reduce((sum, d) => sum + d.totalLoss, 0);

  const handleSelectBatch = (batch) => {
    setSelectedBatchId(batch.id);
    setDisposalQty(Math.min(batch.quantity, 1));
    if (batch.status === 'EXPIRED') setReason('EXPIRED');
    else if (batch.status === 'CRITICAL') setReason('COLD_CHAIN_FAIL');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentSelectedBatch) return;

    if (disposalQty <= 0 || disposalQty > currentSelectedBatch.quantity) {
      alert(`Số lượng hủy phải từ 1 đến ${currentSelectedBatch.quantity}!`);
      return;
    }

    const newRecord = {
      id: `DISP-${Date.now().toString().slice(-6)}`,
      date: '2026-09-24',
      batchId: currentSelectedBatch.id,
      batchCode: currentSelectedBatch.batchCode,
      productName: currentSelectedBatch.productName,
      quantity: Number(disposalQty),
      costPrice: currentSelectedBatch.costPrice,
      totalLoss: Number(disposalQty) * currentSelectedBatch.costPrice,
      reason: reason === 'EXPIRED' ? 'Quá hạn sử dụng (EXPIRED)' : 
              reason === 'DAMAGED_SHELF' ? 'Rách bao bì trên kệ (DAMAGED_SHELF)' : 
              reason === 'COLD_CHAIN_FAIL' ? 'Lỗi bảo quản lạnh (COLD_CHAIN_FAIL)' : 'Hư hỏng vận chuyển',
      approvedBy: currentRole === 'STORE_MANAGER' ? 'Quản lý Cửa hàng' : 'Chờ phê duyệt',
      status: currentRole === 'STORE_MANAGER' ? 'APPROVED' : 'PENDING'
    };

    onCreateDisposal(newRecord);
    setBannerMsg(currentRole === 'STORE_MANAGER' ? 
      `✓ Đã lập phiếu ${newRecord.id} và PHÊ DUYỆT tiêu hủy thành công! Tồn kho lô ${currentSelectedBatch.batchCode} đã được trừ sạch.` : 
      `✓ Đã lập phiếu đề xuất tiêu hủy ${newRecord.id}! Chờ Cửa hàng trưởng phê duyệt.`);
    
    setTimeout(() => setBannerMsg(''), 7000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: '24px', alignItems: 'start' }}>
      
      {/* Form: Create Disposal Record */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={22} color="#ef4444" />
            Lập Phiếu Tiêu Hủy Hàng Hỏng
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Quy tắc: Hạch toán chính xác số tiền thiệt hại = Số lượng hủy × Giá vốn.
          </p>
        </div>

        {bannerMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--safe-green)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '0.85rem',
            color: '#a7f3d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <span>{bannerMsg}</span>
            <button onClick={() => setBannerMsg('')} style={{ background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Search & Status Filters for Batches */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} color="var(--safe-green)" />
            Tìm kiếm & Lọc Lô Cần Tiêu Hủy:
          </label>
          
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '34px', fontSize: '0.85rem' }}
              placeholder="Gõ mã lô hoặc tên sản phẩm..."
              value={searchBatch}
              onChange={(e) => setSearchBatch(e.target.value)}
            />
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            {searchBatch && (
              <button 
                onClick={() => setSearchBatch('')}
                style={{ position: 'absolute', right: '10px', top: '9px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status filter chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'Tất cả', count: availableBatches.length },
              { id: 'EXPIRED', label: 'Quá hạn (Đỏ)', count: availableBatches.filter(b => b.status === 'EXPIRED').length },
              { id: 'CRITICAL', label: 'Cận date (Đỏ)', count: availableBatches.filter(b => b.status === 'CRITICAL').length },
              { id: 'WARNING', label: 'Cảnh báo (Vàng)', count: availableBatches.filter(b => b.status === 'WARNING').length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  fontSize: '0.725rem',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: statusFilter === tab.id ? '1px solid var(--safe-green)' : '1px solid rgba(255,255,255,0.08)',
                  background: statusFilter === tab.id ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: statusFilter === tab.id ? 'var(--safe-green)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: statusFilter === tab.id ? 700 : 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{tab.label}</span>
                <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Quick-pick list */}
          <div style={{ marginTop: '10px', maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredBatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Không tìm thấy lô hàng nào khớp điều kiện tìm kiếm.
              </div>
            ) : (
              filteredBatches.map(b => {
                const isSelected = b.id === Number(selectedBatchId);
                return (
                  <div
                    key={b.id}
                    onClick={() => handleSelectBatch(b)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--safe-green)' : '1px solid rgba(255,255,255,0.06)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.2)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: isSelected ? '#ffffff' : 'var(--text-color)' }}>
                        {b.productName}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'flex', gap: '6px' }}>
                        <span>Lô: <strong>{b.batchCode}</strong></span>
                        <span>• HSD: {b.expiryDate}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${b.status === 'EXPIRED' ? 'badge-expired' : b.status === 'CRITICAL' ? 'badge-critical' : b.status === 'WARNING' ? 'badge-warning' : 'badge-safe'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                        Tồn: {b.quantity}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Lô hàng được chọn xử lý:
            </label>
            <select 
              className="form-select"
              value={selectedBatchId}
              onChange={(e) => {
                const b = batches.find(x => x.id === Number(e.target.value));
                if (b) handleSelectBatch(b);
              }}
            >
              {availableBatches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.batchCode} - {b.productName} (Tồn: {b.quantity} | {b.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Số lượng tiêu hủy (Tối đa: {currentSelectedBatch?.quantity || 0}):
            </label>
            <input 
              type="number"
              className="form-input"
              min="1"
              max={currentSelectedBatch?.quantity || 1}
              value={disposalQty}
              onChange={(e) => setDisposalQty(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Lý do tiêu hủy:
            </label>
            <select 
              className="form-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="EXPIRED">Quá hạn sử dụng (EXPIRED)</option>
              <option value="DAMAGED_SHELF">Rách/vỡ bao bì trên kệ (DAMAGED_SHELF)</option>
              <option value="COLD_CHAIN_FAIL">Lỗi nhiệt độ bảo quản lạnh (COLD_CHAIN_FAIL)</option>
              <option value="TRANSIT_DEFECT">Hư hỏng do vận chuyển từ DC</option>
            </select>
          </div>

          {currentSelectedBatch && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '12px', fontSize: '0.825rem' }}>
              <div style={{ color: 'var(--text-muted)' }}>Ước tính thiệt hại tài chính:</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>
                {((disposalQty || 0) * currentSelectedBatch.costPrice).toLocaleString('vi-VN')} đ
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Giá vốn nhập: {currentSelectedBatch.costPrice.toLocaleString('vi-VN')} đ / đơn vị
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-danger"
            style={{ width: '100%', padding: '12px', marginTop: '6px' }}
          >
            <FileText size={18} /> Gửi Phiếu Tiêu Hủy
          </button>
        </form>

        <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          * Lưu ý: Nếu thao tác bởi Nhân viên, phiếu sẽ chuyển sang trạng thái <em>Chờ duyệt</em>. Cửa hàng trưởng có quyền bấm phê duyệt ngay.
        </div>
      </div>

      {/* Disposals List & Approval Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Loss Summary Bar */}
        <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TỔNG THIỆT HẠI HÀNG HỦY</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>
              {totalFinancialLoss.toLocaleString('vi-VN')} đ
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-warning">
              Quyền hiện tại: {currentRole === 'STORE_MANAGER' ? 'Cửa hàng trưởng (Có quyền duyệt)' : 'Nhân viên (Chỉ lập phiếu)'}
            </span>
          </div>
        </div>

        {/* Table of Disposals */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--safe-green)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              Danh Sách Phiếu Tiêu Hủy Hàng Hóa & Biên Bản Hạch Toán
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Mã Phiếu & Ngày</th>
                  <th>Sản Phẩm & Lô</th>
                  <th>Số Lượng</th>
                  <th>Lý Do Hủy</th>
                  <th>Thiệt Hại</th>
                  <th>Trạng Thái / Phê Duyệt</th>
                </tr>
              </thead>
              <tbody>
                {disposals.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{item.id}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{item.date}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.productName}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>Lô: {item.batchCode}</div>
                    </td>
                    <td>
                      <strong style={{ color: '#ef4444' }}>-{item.quantity}</strong>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {item.reason}
                    </td>
                    <td>
                      <strong style={{ color: '#f59e0b' }}>{item.totalLoss.toLocaleString('vi-VN')} đ</strong>
                    </td>
                    <td>
                      {item.status === 'APPROVED' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-safe" style={{ fontSize: '0.65rem' }}>Đã Phê Duyệt</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{item.approvedBy}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Chờ Duyệt</span>
                          {currentRole === 'STORE_MANAGER' ? (
                            <button 
                              className="btn btn-primary"
                              style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                              onClick={() => {
                                onApproveDisposal(item.id);
                                setBannerMsg(`✓ Đã phê duyệt phiếu tiêu hủy ${item.id}!`);
                                setTimeout(() => setBannerMsg(''), 5000);
                              }}
                            >
                              <ShieldCheck size={12} /> Duyệt Hủy
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Cần Quản lý</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
