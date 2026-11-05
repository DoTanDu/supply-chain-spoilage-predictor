import React, { useEffect } from 'react';
import { 
  Printer, 
  X, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  Store, 
  FileText,
  AlertTriangle,
  QrCode,
  Copy,
  Check
} from 'lucide-react';

/**
 * Helper chuyển đổi số tiền sang chữ tiếng Việt chuẩn hóa
 */
function moneyToVietnameseWords(amount) {
  if (!amount || isNaN(amount) || amount <= 0) return 'Không đồng';
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'ngàn', 'triệu', 'tỷ'];

  const readThreeDigits = (n, isHighest) => {
    let hundred = Math.floor(n / 100);
    let ten = Math.floor((n % 100) / 10);
    let unit = n % 10;
    let res = '';

    if (hundred > 0 || !isHighest) {
      res += digits[hundred] + ' trăm ';
    }

    if (ten > 1) {
      res += digits[ten] + ' mươi ';
      if (unit === 1) res += 'mốt ';
      else if (unit === 5) res += 'lăm ';
      else if (unit > 0) res += digits[unit] + ' ';
    } else if (ten === 1) {
      res += 'mười ';
      if (unit === 5) res += 'lăm ';
      else if (unit > 0) res += digits[unit] + ' ';
    } else {
      if (hundred > 0 && unit > 0) res += 'lẻ ';
      if (unit > 0) res += digits[unit] + ' ';
    }
    return res.trim();
  };

  let num = Math.round(Number(amount));
  let groups = [];
  while (num > 0) {
    groups.push(num % 1000);
    num = Math.floor(num / 1000);
  }

  let words = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] > 0) {
      let part = readThreeDigits(groups[i], i === groups.length - 1);
      words.push(part + (units[i] ? ' ' + units[i] : ''));
    }
  }

  let result = words.join(' ').trim();
  result = result.charAt(0).toUpperCase() + result.slice(1) + ' đồng chẵn';
  return result;
}

/**
 * Modal Xem Trước & In Biên Bản Tiêu Hủy Hàng Hóa K80 / A4
 */
export default function PrintSpoilageReceiptModal({
  isOpen,
  onClose,
  record,
  storeProfile
}) {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  const storeName = storeProfile?.storeName || storeProfile?.store_name || 'Cửa hàng Bán lẻ Tiện lợi LHU Mart';
  const storeCode = storeProfile?.storeCode || storeProfile?.store_code || 'RETAIL-STORE-01';
  const address = storeProfile?.address || 'Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai';
  const phone = storeProfile?.phone || storeProfile?.hotline || '0251 3952 778';

  const recordCode = record.recordCode || record.id || `SPOIL-${Date.now().toString().slice(-6)}`;
  const dateStr = record.disposedDate || record.date || new Date().toISOString().slice(0, 10);
  const qty = Number(record.quantityDisposed ?? record.quantity ?? 1);
  const cost = Number(record.importPrice ?? record.costPrice ?? 25000);
  const totalCostLoss = Number(record.costLoss ?? record.totalLoss ?? (qty * cost));
  const isApproved = record.status === 'APPROVED';

  const reasonDesc = record.reason === 'EXPIRED'
    ? 'Hết hạn sử dụng theo date in bao bì'
    : record.reason === 'DAMAGED'
      ? 'Hư hỏng vật lý / móp méo / rách vỡ bao bì'
      : record.reason === 'SPOILED'
        ? 'Biến chất / chua hỏng do đứt chuỗi lạnh'
        : (record.reason || 'Tiêu hủy định kỳ');

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(recordCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        color: '#0f172a',
        width: '100%',
        maxWidth: '430px',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh',
        boxSizing: 'border-box'
      }}>
        
        {/* Modal Header */}
        <div style={{
          padding: '12px 16px',
          background: isApproved ? '#f0fdf4' : '#fffbeb',
          borderBottom: isApproved ? '1px solid #bbf7d0' : '1px solid #fef3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={18} color={isApproved ? '#16a34a' : '#d97706'} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: isApproved ? '#166534' : '#92400e' }}>
                Biên Bản Tiêu Hủy Hàng Hóa K80
              </div>
              <div style={{ fontSize: '0.675rem', color: '#64748b' }}>
                Sổ Hao Hụt Bất Biến
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Printable Body (K80 Receipt Format) */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          flex: 1,
          fontFamily: 'monospace, "Courier New", Courier',
          fontSize: '0.785rem',
          lineHeight: '1.45',
          background: '#ffffff',
          color: '#000000'
        }}>
          {/* Header Store */}
          <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '1px dashed #000000', paddingBottom: '10px' }}>
            <div style={{ fontWeight: 900, fontSize: '0.95rem', textTransform: 'uppercase' }}>
              {storeName}
            </div>
            <div style={{ fontSize: '0.725rem', marginTop: '2px' }}>
              Cơ sở: <strong>{storeCode}</strong> • Hotline: {phone}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: '1px' }}>
              {address}
            </div>
            <div style={{
              fontWeight: 800,
              fontSize: '0.85rem',
              marginTop: '8px',
              padding: '4px 8px',
              background: '#f1f5f9',
              borderRadius: '4px',
              display: 'inline-block'
            }}>
              BIÊN BẢN TIÊU HỦY & HAO HỤT TÀI CHÍNH
            </div>
            <div style={{ fontSize: '0.65rem', fontStyle: 'italic', color: '#475569', marginTop: '2px' }}>
              (Chương trình Quản trị Chuỗi cung ứng Chống lãng phí)
            </div>
          </div>

          {/* Metadata Block */}
          <div style={{ marginBottom: '10px', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Mã biên bản:</span>
              <strong style={{ letterSpacing: '0.5px' }}>{recordCode}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
              <span>Ngày thực hiện:</span>
              <span>{dateStr}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
              <span>Trạng thái:</span>
              <strong style={{ color: isApproved ? '#15803d' : '#b45309' }}>
                {isApproved ? 'ĐÃ PHÊ DUYỆT (APPROVED)' : 'CHỜ DUYỆT (PENDING)'}
              </strong>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000000', margin: '8px 0' }} />

          {/* Item Details */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontWeight: 800, fontSize: '0.825rem', marginBottom: '4px' }}>
              {record.productName || 'Sản phẩm FMCG'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.735rem', color: '#334155' }}>
              <span>Mã lô: <strong>{record.batchCode || '---'}</strong></span>
              <span>ĐVT: {record.unit || 'Đơn vị'}</span>
            </div>
            {record.category && (
              <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                Ngành hàng: {record.category}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.75rem' }}>
              <span>Lý do hủy:</span>
              <strong style={{ color: '#b91c1c' }}>{record.reason || 'EXPIRED'}</strong>
            </div>
            <div style={{ fontSize: '0.685rem', color: '#64748b', fontStyle: 'italic', marginTop: '1px' }}>
              ({reasonDesc})
            </div>
            {record.notes && (
              <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: '3px', background: '#f8fafc', padding: '3px 6px', borderRadius: '4px' }}>
                Ghi chú: {record.notes}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px dashed #000000', margin: '8px 0' }} />

          {/* Financial Calculation */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.765rem' }}>
              <span>Số lượng tiêu hủy:</span>
              <strong>{qty} {record.unit || 'sản phẩm'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.765rem', marginTop: '2px' }}>
              <span>Đơn giá vốn nhập (ImportPrice):</span>
              <span>{cost.toLocaleString('vi-VN')} đ</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.925rem',
              fontWeight: 900,
              marginTop: '6px',
              paddingTop: '6px',
              borderTop: '1px solid #000000',
              color: '#dc2626'
            }}>
              <span>VỐN TỔN THẤT (CostLoss):</span>
              <span>{totalCostLoss.toLocaleString('vi-VN')} đ</span>
            </div>
            <div style={{ fontSize: '0.675rem', fontStyle: 'italic', color: '#475569', marginTop: '3px', textAlign: 'right' }}>
              Bằng chữ: {moneyToVietnameseWords(totalCostLoss)}
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000000', margin: '8px 0' }} />

          {/* Signatures (SoD) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>NGƯỜI ĐỀ XUẤT</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>(Ký, ghi rõ họ tên)</div>
              <div style={{ marginTop: '24px', fontWeight: 800, fontSize: '0.75rem', color: '#0f172a' }}>
                {record.performedByName || 'Đoàn Minh Quân (Staff)'}
              </div>
              <div style={{ fontSize: '0.625rem', color: '#16a34a' }}>✓ Đã xác nhận điện tử</div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>NGƯỜI DUYỆT (QUẢN LÝ)</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>(Ký duyệt chốt sổ)</div>
              <div style={{ marginTop: '24px', fontWeight: 800, fontSize: '0.75rem', color: isApproved ? '#0f172a' : '#d97706' }}>
                {isApproved ? (record.approvedByName || record.approvedBy || 'Đỗ Tấn Du (Store Manager)') : '[Chờ Ký Duyệt]'}
              </div>
              <div style={{ fontSize: '0.625rem', color: isApproved ? '#16a34a' : '#d97706' }}>
                {isApproved ? '✓ Đã ký duyệt điện tử' : '⏳ Chưa hoàn tất'}
              </div>
            </div>
          </div>

          {/* Barcode & Audit Notice */}
          <div style={{ textAlign: 'center', marginTop: '16px', borderTop: '1px dashed #000000', paddingTop: '10px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.675rem',
              color: '#334155',
              background: '#f1f5f9',
              padding: '3px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>
              <QrCode size={13} />
              <span>Mã QR Tra Cứu: LHU-MART-{recordCode}</span>
            </div>
            <div style={{ fontSize: '0.625rem', color: '#64748b', marginTop: '4px' }}>
              Chứng từ kế toán hạch toán hao hụt theo TT 96/2015/TT-BTC & Thanh tra ATTP
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div style={{
          padding: '12px 16px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: '8px'
        }}>
          <button
            type="button"
            onClick={handleCopyCode}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép mã'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              background: '#10b981',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
            }}
          >
            <Printer size={15} />
            <span>In Biên Bản K80</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#64748b',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}

