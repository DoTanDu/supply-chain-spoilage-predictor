import React, { useState } from 'react';
import {
  Truck,
  X,
  PackagePlus,
  FileText,
  Search,
  Camera,
  ShieldCheck,
  ShieldAlert,
  ArrowDownToLine,
  AlertCircle,
  PlusCircle,
  Sparkles
} from 'lucide-react';

// Helper: Chuẩn hóa tiếng Việt tìm kiếm
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

export default function DcIntakeModal({
  isOpen,
  onClose,
  products = [],
  selectedProductId,
  onProductChange,
  purchaseOrders = [],
  intakeMode,
  setIntakeMode,
  selectedPoId,
  onSelectPo,
  batchCode,
  setBatchCode,
  quantity,
  setQuantity,
  manufactureDate,
  setManufactureDate,
  importDate,
  setImportDate,
  expiryDate,
  setExpiryDate,
  costPrice,
  setCostPrice,
  inboundRsl,
  isRslQualified,
  minRslThreshold = 70,
  daysPassed,
  remainingDays,
  isSubmitting,
  isRejecting,
  onSubmit,
  onReject,
  errorMsg,
  setErrorMsg,
  onOpenBarcodeScanner,
  getProductLiveStock,
  canManageCatalog,
  onOpenAddProduct
}) {
  if (!isOpen) return null;

  const [modalSearchProduct, setModalSearchProduct] = useState('');

  const selectedProd = products.find(p => p.id === Number(selectedProductId)) || products[0];

  const filteredProducts = products.filter(p => {
    if (!modalSearchProduct.trim()) return true;
    const norm = stripVietnamese(modalSearchProduct);
    const nName = stripVietnamese(p.name);
    const nSku = (p.sku || '').toLowerCase();
    return nName.includes(norm) || nSku.includes(norm);
  });

  const availablePos = purchaseOrders.filter(
    po => po.status !== 'DELIVERED' && po.status !== 'COMPLETED' && po.status !== 'CANCELLED'
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99990,
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-subtle)',
          overflow: 'hidden',
          animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--primary-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                border: '1px solid var(--primary-border)'
              }}
            >
              <Truck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                Tiếp Nhận Hàng Kho Tổng DC Biên Hòa
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Kiểm soát độ tươi mới RSL ≥ {minRslThreshold}%
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {canManageCatalog && (
              <button
                type="button"
                className="btn"
                style={{
                  fontSize: '0.725rem',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'var(--primary-bg)',
                  borderColor: 'var(--primary-border)',
                  color: 'var(--primary)',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={onOpenAddProduct}
                title="Thêm mặt hàng mới vào danh mục CSDL"
              >
                <PlusCircle size={13} /> + SP Mới
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Đóng cửa sổ (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Thân Modal (Cuộn nếu nội dung dài) */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {errorMsg && (
            <div
              style={{
                background: 'var(--danger-red-bg)',
                border: '1px solid var(--danger-red-border)',
                color: 'var(--danger-red)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.775rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} flexShrink={0} />
                <span style={{ lineHeight: 1.4 }}>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg('')}
                style={{ background: 'none', border: 'none', color: 'var(--danger-red)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Thanh Chọn Chế Độ Tiếp Nhận: Theo Đơn PO vs Tự Do */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              borderRadius: '9px',
              padding: '3px',
              display: 'flex',
              gap: '6px',
              border: '1px solid var(--border-color)'
            }}
          >
            <button
              type="button"
              onClick={() => setIntakeMode('po')}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: '7px',
                border: 'none',
                background: intakeMode === 'po' ? 'var(--primary)' : 'transparent',
                color: intakeMode === 'po' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.785rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <FileText size={14} />
              <span>Theo Đơn Đặt Hàng PO ({availablePos.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIntakeMode('manual');
                onSelectPo('');
              }}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: '7px',
                border: 'none',
                background: intakeMode === 'manual' ? 'var(--primary)' : 'transparent',
                color: intakeMode === 'manual' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.785rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <PackagePlus size={14} />
              <span>Tiếp Nhận Hàng Tự Do</span>
            </button>
          </div>

          {/* Nếu chọn PO: Dropdown danh sách đơn PO */}
          {intakeMode === 'po' && (
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px dashed #3b82f6',
                borderRadius: '9px',
                padding: '10px 12px'
              }}
            >
              <label
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  color: '#2563eb',
                  marginBottom: '5px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span>Chọn Đơn Đặt Hàng PO từ DC Biên Hòa:</span>
                {selectedPoId && (
                  <button
                    type="button"
                    onClick={() => onSelectPo('')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem' }}
                  >
                    Bỏ chọn
                  </button>
                )}
              </label>
              <select
                value={selectedPoId}
                onChange={(e) => onSelectPo(e.target.value)}
                style={{
                  width: '100%',
                  height: '34px',
                  fontSize: '0.8rem',
                  borderRadius: '7px',
                  fontWeight: 600,
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  border: '1px solid #3b82f6',
                  outline: 'none',
                  padding: '0 10px'
                }}
              >
                <option value="">-- Chọn đơn PO cần nhập kho xe tải DC --</option>
                {availablePos.map(po => {
                  const firstItem = po.items && po.items[0];
                  const itemSummary = firstItem ? `${firstItem.productName} (x${firstItem.approvedQuantity || firstItem.suggestedQuantity})` : '';
                  return (
                    <option key={po.id} value={po.id}>
                      [{po.orderCode}] • {po.status} {itemSummary ? `• ${itemSummary}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Chọn / Tìm kiếm Sản phẩm */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Mặt hàng tiếp nhận:</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {filteredProducts.length}/{products.length} SP
              </span>
            </label>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  style={{
                    width: '100%',
                    paddingLeft: '32px',
                    height: '32px',
                    fontSize: '0.785rem',
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Gõ tìm nhanh theo tên sản phẩm hoặc mã SKU..."
                  value={modalSearchProduct}
                  onChange={(e) => setModalSearchProduct(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={onOpenBarcodeScanner}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '0 12px',
                  height: '32px',
                  borderRadius: '7px',
                  border: '1px solid #06b6d4',
                  background: 'rgba(6, 182, 212, 0.1)',
                  color: '#0891b2',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                title="Quét Barcode / QR thùng hàng DC"
              >
                <Camera size={14} />
                <span>Quét Barcode</span>
              </button>
            </div>

            <select
              value={selectedProductId}
              onChange={(e) => onProductChange(e.target.value)}
              style={{
                width: '100%',
                height: '34px',
                fontSize: '0.825rem',
                borderRadius: '7px',
                fontWeight: 600,
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                outline: 'none',
                padding: '0 10px',
                boxSizing: 'border-box'
              }}
            >
              {filteredProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {getCategoryIcon(p.category)} {p.name} [{p.category}]
                </option>
              ))}
            </select>

            {/* Product Live Info Preview */}
            {selectedProd && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{getCategoryIcon(selectedProd.category)}</span>
                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {selectedProd.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      SKU: <strong style={{ fontFamily: 'monospace' }}>{selectedProd.sku}</strong> • Ngành: {selectedProd.category}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>ĐVT: <strong style={{ color: 'var(--text-main)' }}>{selectedProd.unit}</strong></span>
                  <span>Hạn chuẩn: <strong style={{ color: 'var(--text-main)' }}>{selectedProd.shelfLifeDays || 30} ngày</strong></span>
                  <span>Tồn hiện có: <strong style={{ color: 'var(--primary)' }}>{getProductLiveStock(selectedProd.id)} {selectedProd.unit}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Form Thông Số Lô Tiếp Nhận */}
          <form id="dc-intake-form" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Mã Lô & Số Lượng */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>
                  Mã Lô tiếp nhận (Tự sinh):
                </label>
                <input
                  type="text"
                  style={{
                    width: '100%',
                    height: '32px',
                    fontSize: '0.8rem',
                    borderRadius: '7px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    padding: '0 10px',
                    boxSizing: 'border-box'
                  }}
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>
                  Số lượng ({selectedProd?.unit || 'hộp'}):
                </label>
                <input
                  type="number"
                  min="1"
                  style={{
                    width: '100%',
                    height: '32px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    padding: '0 10px',
                    boxSizing: 'border-box'
                  }}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 3 Trường Ngày: Ngày SX, Ngày Nhập, Hạn Sử Dụng */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>
                  Ngày SX (MFG):
                </label>
                <input
                  type="date"
                  style={{
                    width: '100%',
                    height: '32px',
                    fontSize: '0.775rem',
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    padding: '0 6px',
                    boxSizing: 'border-box'
                  }}
                  value={manufactureDate}
                  onChange={(e) => setManufactureDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>
                  Ngày xe tải giao:
                </label>
                <input
                  type="date"
                  style={{
                    width: '100%',
                    height: '32px',
                    fontSize: '0.775rem',
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    padding: '0 6px',
                    boxSizing: 'border-box'
                  }}
                  value={importDate}
                  onChange={(e) => setImportDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>
                  Hạn dùng (EXP):
                </label>
                <input
                  type="date"
                  style={{
                    width: '100%',
                    height: '32px',
                    fontSize: '0.775rem',
                    borderRadius: '7px',
                    border: '1px solid var(--primary-border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    padding: '0 6px',
                    boxSizing: 'border-box'
                  }}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* THƯỚC ĐO ĐỘ TƯƠI MỚI THANH LỊCH (FRESHNESS GAUGE - ĐANG KHÓA: RSL >= 70%) */}
            <div
              style={{
                background: isRslQualified ? 'var(--primary-bg)' : 'var(--danger-red-bg)',
                border: `1px solid ${isRslQualified ? 'var(--primary-border)' : 'var(--danger-red-border)'}`,
                borderRadius: '10px',
                padding: '10px 14px',
                marginTop: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isRslQualified ? (
                    <ShieldCheck size={16} color="var(--primary)" />
                  ) : (
                    <ShieldAlert size={16} color="var(--danger-red)" />
                  )}
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: isRslQualified ? 'var(--primary)' : 'var(--danger-red)' }}>
                    {isRslQualified ? 'ĐẠT CHUẨN NHẬN HÀNG DC (RSL ≥ 70%)' : 'VI PHẠM TIÊU CHUẨN DATE (RSL < 70%)'}
                  </span>
                </div>
                <span className="num-tabular" style={{ fontSize: '0.95rem', fontWeight: 900, color: isRslQualified ? 'var(--primary)' : 'var(--danger-red)' }}>
                  {inboundRsl}%
                </span>
              </div>

              {/* Thanh Đo Vạch Chia 70% */}
              <div
                style={{
                  position: 'relative',
                  height: '10px',
                  background: 'var(--bg-surface)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, inboundRsl))}%`,
                    background: isRslQualified ? 'var(--primary)' : 'var(--danger-red)',
                    transition: 'width 0.3s ease'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '70%',
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    background: '#ffffff',
                    boxShadow: '0 0 3px rgba(0,0,0,0.5)',
                    zIndex: 2
                  }}
                  title="Ngưỡng tiêu chuẩn tối thiểu 70%"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                <span>Đã trôi qua: <strong style={{ color: 'var(--text-main)' }}>{Math.round(daysPassed)} ngày</strong></span>
                <span style={{ fontWeight: 700, color: isRslQualified ? 'var(--primary)' : 'var(--danger-red)' }}>
                  Mốc chuẩn: 70%
                </span>
                <span>Còn lại: <strong style={{ color: 'var(--text-main)' }}>{Math.round(remainingDays)} ngày</strong></span>
              </div>
            </div>

            {/* Đơn Giá & Tổng Tiền */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                background: 'var(--bg-subtle)',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>
                  Đơn giá vốn nhập DC (đ):
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  style={{
                    width: '100%',
                    height: '28px',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    padding: '0 8px',
                    boxSizing: 'border-box'
                  }}
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  required
                />
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>
                  Tổng giá trị lô hàng:
                </span>
                <div
                  className="num-tabular"
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 900,
                    color: 'var(--primary)',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {(Number(quantity) * Number(costPrice)).toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Modal: Nút Thao Tác */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>

          {!isRslQualified ? (
            <button
              type="button"
              disabled={isRejecting}
              onClick={onReject}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                background: 'var(--danger-red)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: isRejecting ? 'not-allowed' : 'pointer',
                opacity: isRejecting ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <AlertCircle size={15} />
              <span>{isRejecting ? 'Đang lưu biên bản...' : 'Lập Biên Bản Từ Chối Nhận Hàng'}</span>
            </button>
          ) : (
            <button
              type="submit"
              form="dc-intake-form"
              disabled={isSubmitting}
              style={{
                padding: '8px 22px',
                borderRadius: '8px',
                background: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {isSubmitting ? (
                <span>⏳ Đang ghi nhận CSDL...</span>
              ) : (
                <>
                  <ArrowDownToLine size={16} />
                  <span>Xác Nhận Nhập Kho Lô Hàng</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

