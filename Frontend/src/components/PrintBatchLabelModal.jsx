import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  Tag, 
  Calendar, 
  ShieldCheck, 
  Package, 
  Truck, 
  Sparkles,
  QrCode,
  Copy,
  Check
} from 'lucide-react';

/**
 * Component Modal Xem Trước & In Tem Nhãn Lô Hàng DC
 * Kích thước tem nhãn nhiệt tiêu chuẩn dán lên thùng hàng tiếp nhận từ DC Biên Hòa
 */
export default function PrintBatchLabelModal({
  isOpen,
  onClose,
  batch,
  storeProfile
}) {
  const [printCopies, setPrintCopies] = useState(1);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !batch) return null;

  const storeName = storeProfile?.storeName || 'Cửa hàng Bán lẻ LHU Mart';
  const batchCode = batch.batchCode || `LOT-DC-${batch.id || '001'}`;
  const productName = batch.productName || batch.name || 'Sản phẩm tiêu chuẩn';
  const sku = batch.sku || batch.productSku || 'SKU-FMCG';
  const mfgDate = batch.manufactureDate || batch.mfgDate || '---';
  const expDate = batch.expiryDate || batch.expDate || '---';
  const importDate = batch.importDate || new Date().toISOString().split('T')[0];
  const quantity = batch.quantity || batch.initialQuantity || batch.currentQuantity || 1;
  const unit = batch.unit || 'Đơn vị';
  const rslPercent = batch.rslPercent !== undefined ? batch.rslPercent : 95;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(batchCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
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
        maxWidth: '580px',
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
              background: 'rgba(79, 70, 229, 0.12)',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Tag size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>IN TEM NHÃN LÔ HÀNG DC</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748b)' }}>
                Tem barcode dán thùng pallet tiếp nhận từ Kho tổng DC Biên Hòa
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
          >
            <X size={18} />
          </button>
        </div>

        {/* Nội dung Preview Tem Nhãn */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'var(--bg-app, #f1f5f9)',
          gap: '16px'
        }}>

          {/* Thanh công cụ chỉnh số lượng bản in */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '480px',
            background: 'var(--bg-surface, #ffffff)',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            fontSize: '0.8rem'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>
              Số lượng tem cần in:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {[1, 2, 5, Math.min(10, quantity)].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPrintCopies(num)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '5px',
                    border: '1px solid',
                    borderColor: printCopies === num ? '#4f46e5' : '#cbd5e1',
                    background: printCopies === num ? '#4f46e5' : '#ffffff',
                    color: printCopies === num ? '#ffffff' : '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {num} tem
                </button>
              ))}
            </div>
          </div>

          {/* KHUNG TEM NHÃN IN (ID cách ly in ấn: print-batch-label-container) */}
          <div
            id="print-batch-label-container"
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '8px',
              border: '2px solid #0f172a',
              padding: '16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontFamily: "'Courier New', Courier, monospace",
              position: 'relative',
              boxSizing: 'border-box'
            }}
          >
            {/* Header Tem Nhãn */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '8px',
              marginBottom: '10px'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em', color: '#475569' }}>
                  KHO TỔNG DC BIÊN HÒA ➔ {storeName.toUpperCase()}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                  {batchCode}
                </div>
              </div>
              <div style={{
                background: '#0f172a',
                color: '#ffffff',
                padding: '3px 7px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 800
              }}>
                RSL {rslPercent}% • ĐẠT
              </div>
            </div>

            {/* Chi tiết Sản phẩm */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>TÊN MẶT HÀNG:</div>
              <div style={{
                fontSize: '1.05rem',
                fontWeight: 900,
                color: '#0f172a',
                lineHeight: 1.25,
                fontFamily: "'Be Vietnam Pro', sans-serif"
              }}>
                {productName}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                MÃ SKU: <strong>{sku}</strong> • SỐ LƯỢNG: <strong>{quantity} {unit}</strong>
              </div>
            </div>

            {/* Bảng Ngày tháng MFG / EXP / IMPORT */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '8px',
              marginBottom: '12px'
            }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>NGÀY SX (MFG):</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{mfgDate}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#dc2626', fontWeight: 800 }}>HẠN DÙNG (EXP):</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#dc2626' }}>{expDate}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>NHẬP KHO:</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{importDate}</div>
              </div>
            </div>

            {/* Khung Barcode đồ họa mô phỏng Code-128 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderTop: '1px dashed #cbd5e1',
              paddingTop: '10px'
            }}>
              {/* Sọc mã vạch Barcode SVG */}
              <svg width="280" height="42" viewBox="0 0 280 42" style={{ maxWidth: '100%' }}>
                <rect width="280" height="42" fill="#ffffff" />
                {/* Các vạch barcode đan xen */}
                {[
                  3, 7, 12, 14, 19, 24, 28, 33, 38, 42, 47, 52, 57, 63, 67, 72, 78, 83, 89, 94, 99,
                  104, 110, 115, 121, 126, 132, 137, 143, 148, 154, 160, 166, 172, 178, 184, 190,
                  196, 202, 208, 214, 220, 226, 232, 238, 244, 250, 256, 262, 268, 274
                ].map((x, idx) => (
                  <rect
                    key={idx}
                    x={x}
                    y="0"
                    width={idx % 3 === 0 ? 3.5 : idx % 2 === 0 ? 2 : 1.2}
                    height="42"
                    fill="#0f172a"
                  />
                ))}
              </svg>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.2em',
                color: '#0f172a',
                marginTop: '4px'
              }}>
                *{batchCode}*
              </div>
            </div>

            {/* Footer Tem Nhãn */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '10px',
              paddingTop: '6px',
              borderTop: '1px solid #e2e8f0',
              fontSize: '0.625rem',
              color: '#64748b'
            }}>
              <span>LƯU TRỮ MÁT 2°C - 8°C • XUẤT KHO FEFO</span>
              <span>LHU MART SCSP</span>
            </div>
          </div>

          <div style={{
            fontSize: '0.725rem',
            color: 'var(--text-muted, #64748b)',
            textAlign: 'center'
          }}>
            Khổ tem nhãn chuẩn tương thích máy in nhiệt cầm tay Xprinter, Gprinter và HPRT
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-subtle, #f8fafc)'
        }}>
          <button
            type="button"
            onClick={handleCopyCode}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-secondary, #475569)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép mã lô'}</span>
          </button>

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
                background: '#4f46e5',
                color: '#ffffff',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)'
              }}
            >
              <Printer size={15} />
              <span>In Tem Ngay ({printCopies} bản)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
