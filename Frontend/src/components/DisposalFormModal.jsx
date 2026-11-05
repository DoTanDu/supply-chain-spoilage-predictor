import React, { useState, useEffect } from 'react';
import {
  Trash2,
  AlertTriangle,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Package,
  Layers,
  DollarSign
} from 'lucide-react';

// Helper: Normalize Vietnamese string
function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

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

export default function DisposalFormModal({
  isOpen,
  onClose,
  availableBatches = [],
  initialBatchId = null,
  storeProfile = null,
  currentUser = null,
  currentRole = 'STAFF',
  isAdmin = false,
  onSubmitDisposal
}) {
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId);
  const [searchBatch, setSearchBatch] = useState('');
  const [disposalQty, setDisposalQty] = useState(1);
  const [reason, setReason] = useState('EXPIRED');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cập nhật khi mở modal hoặc thay đổi initialBatchId
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      const targetId = initialBatchId || (availableBatches[0]?.id ?? null);
      setSelectedBatchId(targetId);
      const b = availableBatches.find(x => x.id === Number(targetId));
      if (b) {
        const stock = Number(b.currentQuantity ?? b.quantity ?? 1);
        setDisposalQty(stock > 0 ? stock : 1);
        if (b.status === 'EXPIRED') setReason('EXPIRED');
        else if (b.status === 'CRITICAL') setReason('SPOILED');
        else setReason('DAMAGED');
      } else {
        setDisposalQty(1);
        setReason('EXPIRED');
      }
      setNotes('');
    }
  }, [isOpen, initialBatchId, availableBatches]);

  if (!isOpen) return null;

  const currentBatch = availableBatches.find(b => b.id === Number(selectedBatchId)) || availableBatches[0] || null;

  // Lọc danh sách lô khi tìm kiếm
  const filteredBatches = availableBatches.filter(b => {
    if (!searchBatch.trim()) return true;
    const norm = stripVietnamese(searchBatch);
    return stripVietnamese(b.productName).includes(norm) || (b.batchCode || '').toLowerCase().includes(norm);
  });

  const handleQtyChange = (val) => {
    if (val === '') {
      setDisposalQty('');
      return;
    }
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setDisposalQty('');
      return;
    }
    const max = Number(currentBatch?.currentQuantity ?? currentBatch?.quantity ?? 1);
    if (num > max) setDisposalQty(max);
    else setDisposalQty(num);
  };

  const handleSelectBatch = (b) => {
    if (!b) return;
    setSelectedBatchId(b.id);
    const stock = Number(b.currentQuantity ?? b.quantity ?? 1);
    setDisposalQty(stock > 0 ? stock : 1);
    if (b.status === 'EXPIRED') setReason('EXPIRED');
    else if (b.status === 'CRITICAL') setReason('SPOILED');
    else setReason('DAMAGED');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentBatch) {
      setErrorMsg('Không có lô hàng hợp lệ được chọn.');
      return;
    }
    const availableStock = currentBatch.currentQuantity !== undefined ? currentBatch.currentQuantity : (currentBatch.quantity || 0);
    const qty = Number(disposalQty);
    if (!qty || qty <= 0 || qty > availableStock) {
      setErrorMsg(`Số lượng hủy phải từ 1 đến ${availableStock}!`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const isAuthorized = isAdmin || currentRole === 'ADMIN' || currentRole === 'STORE_MANAGER';
      const unitCost = currentBatch.importPrice !== undefined
        ? Number(currentBatch.importPrice)
        : Number(currentBatch.costPrice || 25000);

      const normReason = reason === 'EXPIRED' ? 'EXPIRED' : (reason === 'DAMAGED' ? 'DAMAGED' : 'SPOILED');
      const defaultNoteByReason = normReason === 'EXPIRED'
        ? 'Rút khỏi kệ do quá hạn sử dụng'
        : (normReason === 'DAMAGED' ? 'Hàng móp méo/vỡ rách bao bì tại quầy' : 'Hàng biến chất, chua hỏng bảo quản lạnh');

      const finalNotes = notes?.trim() || defaultNoteByReason;

      if (onSubmitDisposal) {
        await onSubmitDisposal({
          batchId: currentBatch.id,
          batchCode: currentBatch.batchCode,
          productId: currentBatch.productId,
          productName: currentBatch.productName,
          category: currentBatch.category,
          quantity: qty,
          quantityDisposed: qty,
          unit: currentBatch.unit || 'hộp',
          unitCost,
          importPrice: unitCost,
          costLoss: qty * unitCost,
          totalLoss: qty * unitCost,
          reason: normReason,
          notes: finalNotes,
          status: isAuthorized ? 'APPROVED' : 'PENDING',
          performedBy: currentUser?.id || 1,
          performedByName: currentUser?.fullName || currentUser?.username || 'Thu ngân ca trực',
          approvedBy: isAuthorized ? (currentUser?.id || 1) : null,
          approvedByName: isAuthorized ? (currentUser?.fullName || 'Quản lý cửa hàng') : null,
          disposedDate: new Date().toISOString().split('T')[0]
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(`Lỗi xử lý: ${err.message || 'Không thể ghi nhận phiếu hủy'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAuthorized = isAdmin || currentRole === 'ADMIN' || currentRole === 'STORE_MANAGER';
  const unitPrice = currentBatch?.importPrice ?? currentBatch?.costPrice ?? 25000;
  const totalCostLoss = (Number(disposalQty) || 0) * unitPrice;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--modal-backdrop, rgba(15, 23, 42, 0.45))',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border-color, #cbd5e1)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header Modal */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-subtle, #f1f5f9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e11d48'
            }}>
              <Trash2 size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                Lập Phiếu Tiêu Hủy Hàng Hỏng
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #475569)' }}>
                Cơ sở: <strong style={{ color: 'var(--primary, #4f46e5)' }}>{storeProfile?.storeCode || 'RETAIL-STORE-01'}</strong> • Hạch toán Sổ hao hụt
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '0.675rem',
              padding: '3px 8px',
              borderRadius: '6px',
              fontWeight: 700,
              background: isAuthorized ? '#ecfdf5' : '#fffbeb',
              color: isAuthorized ? '#047857' : '#b45309',
              border: isAuthorized ? '1px solid #a7f3d0' : '1px solid #fde68a'
            }}>
              {isAuthorized ? '👑 Duyệt & Trừ Kho Ngay' : '👤 Đề Xuất Chờ Duyệt'}
            </span>
            <button
              onClick={onClose}
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #475569)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '80vh', overflowY: 'auto' }}>
          {errorMsg && (
            <div style={{
              background: '#fff1f2',
              border: '1px solid #fda4af',
              color: '#be123c',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.775rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Chọn Lô hàng */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                Lô hàng cần xử lý tiêu hủy:
              </label>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #475569)' }}>
                {availableBatches.length} lô tồn kho khả dụng
              </span>
            </div>

            <div style={{ position: 'relative', marginBottom: '6px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted, #475569)' }} />
              <input
                type="text"
                className="form-input"
                style={{
                  width: '100%',
                  paddingLeft: '30px',
                  paddingRight: '10px',
                  height: '32px',
                  fontSize: '0.775rem',
                  borderRadius: '6px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  borderColor: 'var(--border-subtle, #cbd5e1)',
                  boxSizing: 'border-box'
                }}
                placeholder="Tìm mã lô hoặc tên sản phẩm..."
                value={searchBatch}
                onChange={(e) => setSearchBatch(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              value={selectedBatchId || ''}
              onChange={(e) => {
                const b = availableBatches.find(x => x.id === Number(e.target.value));
                if (b) handleSelectBatch(b);
              }}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 10px',
                fontSize: '0.8rem',
                borderRadius: '7px',
                fontWeight: 600,
                background: 'var(--bg-subtle, #f8fafc)',
                borderColor: 'var(--border-subtle, #cbd5e1)',
                boxSizing: 'border-box'
              }}
            >
              {filteredBatches.length === 0 ? (
                <option value="">Không có lô nào khớp</option>
              ) : (
                filteredBatches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batchCode} - {b.productName} (Tồn: {b.quantity} | {b.status})
                  </option>
                ))
              )}
            </select>

            {/* Active Batch Preview Card */}
            {currentBatch && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: currentBatch.status === 'EXPIRED' ? '#fff1f2' : '#fffbeb',
                border: currentBatch.status === 'EXPIRED' ? '1px solid #fecdd3' : '1px solid #fde68a',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{getCategoryIcon(currentBatch.category)}</span>
                    <span>{currentBatch.productName}</span>
                  </div>
                  <span className={`badge ${currentBatch.status === 'EXPIRED' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                    {currentBatch.status}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.7rem', color: 'var(--text-muted, #475569)' }}>
                  <span style={{ fontFamily: 'monospace', color: '#334155', fontWeight: 600 }}>Mã: {currentBatch.batchCode}</span>
                  <span>•</span>
                  <span>HSD: <strong style={{ color: currentBatch.status === 'EXPIRED' ? '#be123c' : '#b45309' }}>{currentBatch.expiryDate}</strong></span>
                  <span>•</span>
                  <span>Tồn khả dụng: <strong style={{ color: '#0284c7' }}>{currentBatch.quantity}</strong></span>
                  <span>•</span>
                  <span>Giá vốn: <strong style={{ color: '#0f172a' }}>{unitPrice.toLocaleString('vi-VN')} đ</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Nhập số lượng hủy */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                Số lượng tiêu hủy (Tối đa: {currentBatch?.quantity || 0}):
              </label>
              {currentBatch && currentBatch.quantity > 0 && (
                <button
                  type="button"
                  onClick={() => setDisposalQty(currentBatch.quantity)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  Hủy sạch lô ({currentBatch.quantity})
                </button>
              )}
            </div>

            <input
              type="number"
              className="form-input"
              min="1"
              max={currentBatch?.quantity || 1}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                borderRadius: '7px',
                color: '#be123c',
                background: 'var(--bg-subtle, #f8fafc)',
                borderColor: 'var(--border-subtle, #cbd5e1)',
                boxSizing: 'border-box'
              }}
              value={disposalQty}
              onChange={(e) => handleQtyChange(e.target.value)}
              required
            />
          </div>

          {/* Lý do tiêu hủy */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '4px', display: 'block' }}>
              Lý do tiêu hủy:
            </label>
            <select
              className="form-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 10px',
                fontSize: '0.8rem',
                borderRadius: '7px',
                background: 'var(--bg-subtle, #f8fafc)',
                borderColor: 'var(--border-subtle, #cbd5e1)',
                boxSizing: 'border-box'
              }}
            >
              <option value="EXPIRED">EXPIRED — Hết hạn sử dụng (Rút khỏi kệ cách ly)</option>
              <option value="DAMAGED">DAMAGED — Móp méo / vỡ rách bao bì</option>
              <option value="SPOILED">SPOILED — Biến chất / chua hỏng / lỗi bảo quản lạnh</option>
            </select>
          </div>

          {/* Ghi chú mô tả */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '4px', display: 'block' }}>
              Ghi chú mô tả hiện trạng:
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Rút khỏi kệ ca sáng, bao bì phồng rộp..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                height: '34px',
                padding: '0 10px',
                fontSize: '0.8rem',
                borderRadius: '7px',
                background: 'var(--bg-subtle, #f8fafc)',
                borderColor: 'var(--border-subtle, #cbd5e1)',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.675rem', color: 'var(--text-muted, #475569)', marginTop: '4px' }}>
              <span>Người lập: <strong style={{ color: '#0f172a' }}>{currentUser?.fullName || currentUser?.username || 'Nhân viên ca trực'}</strong></span>
              <span>Ký duyệt: <strong style={{ color: isAuthorized ? '#047857' : '#b45309' }}>{isAuthorized ? 'Quản lý ký ngay' : 'Chờ Cửa hàng trưởng'}</strong></span>
            </div>
          </div>

          {/* Preview Thiệt hại tài chính */}
          <div style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            padding: '10px 14px',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted, #475569)', display: 'block' }}>
                Ước tính thiệt hại tài chính (CostLoss):
              </span>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #475569)' }}>
                {Number(disposalQty) || 0} món × {unitPrice.toLocaleString('vi-VN')} đ
              </div>
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#be123c' }}>
              {totalCostLoss.toLocaleString('vi-VN')} đ
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                height: '40px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                background: '#ffffff',
                color: 'var(--text-secondary, #334155)',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !currentBatch || currentBatch.quantity <= 0}
              style={{
                flex: 2,
                height: '40px',
                borderRadius: '8px',
                border: 'none',
                background: isAuthorized ? '#ef4444' : 'var(--primary, #6366f1)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: (isSubmitting || !currentBatch || currentBatch.quantity <= 0) ? 'not-allowed' : 'pointer',
                opacity: (isSubmitting || !currentBatch || currentBatch.quantity <= 0) ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Trash2 size={16} />
              <span>
                {isSubmitting
                  ? 'Đang Ghi Nhận CSDL...'
                  : (isAuthorized ? 'Phê Duyệt & Tiêu Hủy Ngay' : 'Gửi Đề Xuất Tiêu Hủy')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

