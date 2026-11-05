import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  X, 
  Zap, 
  Tag, 
  Sparkles, 
  Check, 
  Clock, 
  AlertTriangle,
  RotateCw,
  Layers,
  Store,
  Barcode
} from 'lucide-react';

/**
 * Component Modal Xem Trước & In Sticker Giảm Giá Xả Hàng Mặt Tiền Kệ
 * Chuẩn SOP Đảo Kệ & Quick Markdown 15% - 50%
 */
export default function PrintDiscountStickerModal({
  isOpen,
  onClose,
  batch,
  products = [],
  storeProfile,
  initialDiscount = 30
}) {
  const [selectedDiscount, setSelectedDiscount] = useState(initialDiscount);
  const [printCopies, setPrintCopies] = useState(1);

  // Cập nhật mức giảm giá khi lô thay đổi
  useEffect(() => {
    if (batch) {
      const currentDisc = batch.discountPercent || batch.discount_percent || initialDiscount;
      setSelectedDiscount(currentDisc > 0 ? currentDisc : initialDiscount);
      const stock = batch.currentQuantity !== undefined ? batch.currentQuantity : (batch.quantity || 1);
      setPrintCopies(Math.min(5, Math.max(1, stock)));
    }
  }, [batch, initialDiscount]);

  // Đóng bằng phím Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !batch) return null;

  const storeName = storeProfile?.storeName || storeProfile?.store_name || 'Cửa hàng Bán lẻ Tiện lợi LHU Mart';
  const batchCode = batch.batchCode || batch.batch_code || `BAT-${batch.id || '01'}`;
  const prodId = batch.productId || batch.product_id;
  
  // Tìm thông tin sản phẩm trong danh mục
  const matchedProd = products.find(p => 
    (prodId && p.id === prodId) || 
    (batch.productName && p.name === batch.productName) ||
    (batch.product_name && p.name === batch.product_name)
  );

  const productName = matchedProd?.name || batch.productName || batch.product_name || batch.name || 'Sản phẩm cận date';
  const sku = matchedProd?.sku || batch.sku || batch.productSku || 'SKU-FMCG';
  const unit = matchedProd?.unit || batch.unit || 'gói';
  const originalPrice = Number(matchedProd?.price || batch.price || batch.salePrice || batch.sale_price || 35000);
  const discountedPrice = Math.round((originalPrice * (100 - selectedDiscount)) / 100);
  const savingsAmount = originalPrice - discountedPrice;

  // Xử lý hạn sử dụng
  const rawExp = batch.expiryDate || batch.expiry_date || batch.expDate;
  const expDateFormatted = rawExp 
    ? new Date(rawExp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '---';

  const daysLeft = batch.daysLeft !== undefined 
    ? Number(batch.daysLeft) 
    : (batch.days_left !== undefined ? Number(batch.days_left) : 3);

  const currentStock = batch.currentQuantity !== undefined 
    ? Number(batch.currentQuantity) 
    : Number(batch.quantity || 1);

  const handlePrint = () => {
    window.print();
  };

  // Render nội dung của 1 tem nhãn
  const renderStickerCardContent = (isForPrint = false) => (
    <div 
      className={isForPrint ? "print-discount-sticker-item" : ""}
      style={{
        width: '100%',
        maxWidth: isForPrint ? '85mm' : '380px',
        background: '#ffffff',
        borderRadius: isForPrint ? '8px' : '16px',
        border: '3px solid #ea580c',
        padding: '14px',
        boxShadow: isForPrint ? 'none' : '0 10px 25px -5px rgba(234, 88, 12, 0.2)',
        position: 'relative',
        textAlign: 'center',
        boxSizing: 'border-box',
        color: '#0f172a'
      }}
    >
      {/* Huy hiệu % Giảm Giá Rực Rỡ */}
      <div style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #ea580c 100%)',
        color: '#ffffff',
        borderRadius: '8px',
        padding: '6px 10px',
        fontWeight: 900,
        fontSize: '1.25rem',
        letterSpacing: '0.02em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.25)',
        marginBottom: '10px'
      }}>
        <Zap size={20} fill="#ffffff" />
        <span>GIẢM GIÁ XẢ HÀNG -{selectedDiscount}%</span>
      </div>

      {/* Tên Sản Phẩm & Quy Cách */}
      <div style={{
        fontSize: '1rem',
        fontWeight: 800,
        color: '#0f172a',
        lineHeight: 1.3,
        marginBottom: '4px',
        fontFamily: "'Be Vietnam Pro', -apple-system, sans-serif"
      }}>
        {productName}
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '8px', 
        fontSize: '0.7rem', 
        color: '#64748b', 
        marginBottom: '10px', 
        fontFamily: 'monospace' 
      }}>
        <span>MÃ LÔ: <strong>{batchCode}</strong></span>
        <span>•</span>
        <span>SKU: <strong>{sku}</strong></span>
        <span>•</span>
        <span>ĐVT: <strong>{unit}</strong></span>
      </div>

      {/* Khung So Sánh Giá Cũ và Giá Mới Xả Hàng */}
      <div style={{
        background: '#fef2f2',
        border: '1.5px dashed #f87171',
        borderRadius: '10px',
        padding: '10px 12px',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'line-through', fontWeight: 600 }}>
            {originalPrice.toLocaleString('vi-VN')} đ
          </span>
          <span style={{ fontSize: '1.45rem', color: '#dc2626', fontWeight: 900, letterSpacing: '-0.02em' }}>
            {discountedPrice.toLocaleString('vi-VN')} đ
          </span>
        </div>
        <div style={{ fontSize: '0.725rem', color: '#ea580c', fontWeight: 800, marginTop: '3px' }}>
          TIẾT KIỆM NGAY {savingsAmount.toLocaleString('vi-VN')} đ / {unit}
        </div>
      </div>

      {/* Thông tin Hạn sử dụng Cận Date */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontSize: '0.75rem',
        fontWeight: 800,
        color: daysLeft <= 3 ? '#dc2626' : '#d97706',
        marginBottom: '10px',
        background: daysLeft <= 3 ? '#fee2e2' : '#fef3c7',
        padding: '5px 8px',
        borderRadius: '6px'
      }}>
        <Clock size={13} />
        <span>HẠN DÙNG: {expDateFormatted} ({daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Cận date nguy kịch'})</span>
      </div>

      {/* Barcode Code128 giả lập cho máy POS quét tại quầy */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '6px',
        borderTop: '1px solid #e2e8f0'
      }}>
        <svg width="210" height="28" viewBox="0 0 210 28" style={{ display: 'block' }}>
          <rect width="210" height="28" fill="#ffffff" />
          {[2, 5, 8, 12, 16, 20, 25, 29, 33, 37, 42, 47, 51, 56, 61, 66, 71, 76, 81, 87, 92, 97, 102, 108, 113, 118, 124, 129, 135, 141, 146, 152, 158, 164, 170, 176, 182, 188, 194, 200, 205].map((x, idx) => (
            <rect key={idx} x={x} y="0" width={idx % 3 === 0 ? 3 : (idx % 2 === 0 ? 2 : 1)} height="28" fill="#0f172a" />
          ))}
        </svg>
        <div style={{ fontSize: '0.625rem', color: '#475569', fontWeight: 700, letterSpacing: '0.04em', marginTop: '3px' }}>
          CHỐNG LÃNG PHÍ THỰC PHẨM • {storeName.toUpperCase()}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* VÙNG IN THỰC TẾ TRÊN MÁY IN NHIỆT (@media print) */}
      <div id="print-discount-sticker-container" style={{ display: 'none' }}>
        {Array.from({ length: printCopies }).map((_, idx) => (
          <div key={idx}>
            {renderStickerCardContent(true)}
          </div>
        ))}
      </div>

      {/* MODAL GIAO DIỆN XEM TRƯỚC VÀ ĐIỀU CHỈNH */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px'
      }}>
        <div style={{
          background: 'var(--bg-surface-elevated, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '540px',
          border: '1px solid var(--border-color, #cbd5e1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}>

          {/* Header Modal */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle, #f8fafc)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>IN STICKER GIẢM GIÁ XẢ HÀNG</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748b)' }}>
                  Tem dán mặt tiền kệ xả hàng cận date
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #64748b)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px'
              }}
              title="Đóng (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nội dung xem trước & điều khiển */}
          <div style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'var(--bg-app, #f1f5f9)',
            gap: '16px'
          }}>

            {/* Chọn Mức Giảm Giá & Số Lượng Tem */}
            <div style={{
              width: '100%',
              maxWidth: '440px',
              background: 'var(--bg-surface, #ffffff)',
              borderRadius: '10px',
              padding: '12px 14px',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: '6px' }}>
                  CHỌN MỨC GIẢM GIÁ QUICK MARKDOWN:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[15, 30, 40, 50].map(pct => {
                    const isSelected = selectedDiscount === pct;
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setSelectedDiscount(pct)}
                        style={{
                          padding: '7px 4px',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: isSelected ? '#ea580c' : '#cbd5e1',
                          background: isSelected ? '#ea580c' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#0f172a',
                          fontWeight: 800,
                          fontSize: '0.825rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        -{pct}%
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>
                  Số lượng tem in:
                </span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {[1, 2, 5, 10, Math.min(50, Math.max(1, currentStock))].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPrintCopies(num)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '5px',
                        border: '1px solid',
                        borderColor: printCopies === num ? '#ea580c' : '#cbd5e1',
                        background: printCopies === num ? '#ea580c' : '#ffffff',
                        color: printCopies === num ? '#ffffff' : '#0f172a',
                        fontWeight: 700,
                        fontSize: '0.725rem',
                        cursor: 'pointer'
                      }}
                    >
                      {num === Math.min(50, Math.max(1, currentStock)) && num > 10 ? `Toàn bộ (${num})` : num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* KHUNG STICKER XEM TRƯỚC TRÊN MÀN HÌNH */}
            {renderStickerCardContent(false)}

            <div style={{
              fontSize: '0.725rem',
              color: 'var(--text-muted, #64748b)',
              textAlign: 'center',
              lineHeight: 1.4
            }}>
              Sticker khổ 85mm tiêu chuẩn phù hợp dán trực tiếp lên nắp chai, thân hộp hoặc góc bao bì thực phẩm
            </div>

          </div>

          {/* Footer Actions */}
          <div style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle, #f8fafc)'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
              Lô: <strong>{batchCode}</strong> • Tồn: <strong>{currentStock} {unit}</strong>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-secondary, #475569)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={handlePrint}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ea580c',
                  color: '#ffffff',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(234, 88, 12, 0.3)'
                }}
              >
                <Printer size={15} />
                <span>In Tem ({printCopies} bản)</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
