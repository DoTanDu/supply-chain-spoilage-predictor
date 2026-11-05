import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  Zap, 
  RotateCw, 
  Trash2, 
  CheckCircle2, 
  Lock,
  Layers,
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  PackageX,
  ChevronDown,
  Check,
  X,
  Sparkles,
  Box,
  ShieldAlert,
  ArrowRight,
  ClipboardCheck,
  Store,
  Tag,
  Printer,
  Download
} from 'lucide-react';
import PrintDiscountStickerModal from './PrintDiscountStickerModal';
import PrintBatchLabelModal from './PrintBatchLabelModal';
import QuickMarkdownModal from './QuickMarkdownModal';
import { exportBatchesFefoToExcel } from '../utils/exportUtils';

// Helper: Chuẩn hóa chuỗi tiếng Việt không dấu phục vụ tìm kiếm linh hoạt
function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

export default function FefoMonitorView({ 
  batches = [], 
  products = [],
  storeProfile,
  currentUser,
  currentRole = 'GUEST',
  onQuickDiscount, 
  onRotateShelf, 
  onOpenDisposalModal,
  isAdmin = false,
  onRequestAdminLogin
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // State Modal Quy trình Đảo Kệ Mặt Tiền 5 Bước (SOP Chuẩn Tự Động)
  const [shelfModalBatch, setShelfModalBatch] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([true, false, false, false, false]);
  const [isSubmittingRotation, setIsSubmittingRotation] = useState(false);

  // State Modal Quick Markdown Xả Hàng Chuyên Biệt
  const [quickMarkdownModalBatch, setQuickMarkdownModalBatch] = useState(null);
  const [activeDiscountBatchId, setActiveDiscountBatchId] = useState(null);
  const discountMenuRef = useRef(null);

  // State Modal In Sticker Giảm Giá Xả Hàng
  const [printStickerModalData, setPrintStickerModalData] = useState(null);
  // State Modal In Tem Nhãn Lô Hàng Barcode
  const [printBatchLabelData, setPrintBatchLabelData] = useState(null);
  const [actionToast, setActionToast] = useState('');

  // Đóng popover Quick Markdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (discountMenuRef.current && !discountMenuRef.current.contains(event.target)) {
        setActiveDiscountBatchId(null);
      }
    };
    if (activeDiscountBatchId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDiscountBatchId]);

  // Tính số ngày còn lại (DaysLeft)
  const getDaysRemaining = (batch) => {
    if (batch && batch.daysLeft !== undefined && batch.daysLeft !== null) {
      return Number(batch.daysLeft);
    }
    const now = new Date();
    const exp = new Date(batch.expiryDate);
    const diffTime = exp - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Tính % Vòng đời còn lại (RSL %)
  const getRslPercentage = (batch) => {
    if (batch && batch.rslPercent !== undefined && batch.rslPercent !== null) {
      return Number(batch.rslPercent);
    }
    const imp = new Date(batch.importDate || new Date());
    const exp = new Date(batch.expiryDate);
    const now = new Date();
    const totalLife = Math.max(1, (exp - imp) / (1000 * 60 * 60 * 24));
    const remainingLife = Math.max(0, (exp - now) / (1000 * 60 * 60 * 24));
    return Math.min(100, Math.round((remainingLife / totalLife) * 100));
  };

  // Định nghĩa phân vùng cảnh báo 3 cấp màu theo
  const isBatchCritical = (b) => b.alertColor === 'RED' || b.status === 'CRITICAL' || (getDaysRemaining(b) > 0 && getDaysRemaining(b) <= 3);
  const isBatchWarning = (b) => b.alertColor === 'YELLOW' || b.status === 'WARNING';
  const isBatchSafe = (b) => b.alertColor === 'GREEN' || b.status === 'SAFE';
  const isBatchExpired = (b) => b.alertColor === 'EXPIRED' || b.status === 'EXPIRED' || getDaysRemaining(b) <= 0;

  // Lọc danh sách lô
  const filteredBatches = batches.filter(batch => {
    let matchesFilter = true;
    const stock = batch.currentQuantity !== undefined ? batch.currentQuantity : (batch.quantity || 0);
    if (statusFilter === 'CRITICAL') matchesFilter = isBatchCritical(batch);
    else if (statusFilter === 'WARNING') matchesFilter = isBatchWarning(batch);
    else if (statusFilter === 'SAFE') matchesFilter = isBatchSafe(batch);
    else if (statusFilter === 'EXPIRED') matchesFilter = isBatchExpired(batch);
    else if (statusFilter === 'NEED_ROTATION') matchesFilter = (isBatchCritical(batch) || isBatchWarning(batch)) && !batch.isShelfRotated && !isBatchExpired(batch) && stock > 0;

    if (!search.trim()) return matchesFilter;

    const normSearch = stripVietnamese(search);
    const normName = stripVietnamese(batch.productName);
    const normCode = (batch.batchCode || '').toLowerCase();
    const tokens = normSearch.split(/\s+/).filter(Boolean);

    const matchesSearch = tokens.every(tok => normName.includes(tok) || normCode.includes(tok));
    return matchesFilter && matchesSearch;
  });

  // Thống kê số lượng theo 3 ngưỡng an toàn + quá hạn + cần đảo kệ
  const countCritical = batches.filter(b => isBatchCritical(b) && ((b.currentQuantity !== undefined ? b.currentQuantity : b.quantity) > 0)).length;
  const countWarning = batches.filter(b => isBatchWarning(b) && ((b.currentQuantity !== undefined ? b.currentQuantity : b.quantity) > 0)).length;
  const countSafe = batches.filter(b => isBatchSafe(b) && ((b.currentQuantity !== undefined ? b.currentQuantity : b.quantity) > 0)).length;
  const countExpired = batches.filter(b => isBatchExpired(b) && ((b.currentQuantity !== undefined ? b.currentQuantity : b.quantity) > 0)).length;
  const countNeedRotation = batches.filter(b => (isBatchCritical(b) || isBatchWarning(b)) && !b.isShelfRotated && !isBatchExpired(b) && ((b.currentQuantity !== undefined ? b.currentQuantity : b.quantity) > 0)).length;

  // Tổng giá trị vốn tồn kho & Vốn có rủi ro tổn thất hao hụt (AtRiskCost - AI 2 Spoilage Risk)
  const totalInventoryCost = batches.reduce((sum, b) => {
    const qty = Number(b.currentQuantity ?? b.quantity ?? 0);
    const cost = Number(b.importPrice ?? 0);
    return sum + (qty * cost);
  }, 0);

  const atRiskBatches = batches.filter(b => (isBatchCritical(b) || isBatchWarning(b)) && !isBatchExpired(b) && ((b.currentQuantity ?? b.quantity ?? 0) > 0));
  const totalAtRiskCost = atRiskBatches.reduce((sum, b) => {
    if (b.atRiskCost !== undefined && b.atRiskCost !== null && Number(b.atRiskCost) > 0) {
      return sum + Number(b.atRiskCost);
    }
    const qty = Number(b.currentQuantity ?? b.quantity ?? 0);
    const cost = Number(b.importPrice ?? 0);
    return sum + (qty * cost);
  }, 0);

  // Mở Modal Đảo Kệ 5 bước cho 1 lô
  const handleOpenRotateModal = (batch) => {
    setShelfModalBatch(batch);
    setCompletedSteps([true, false, false, false, false]);
  };

  // Xác nhận hoàn thành quy trình đảo kệ 5 bước
  const handleConfirmShelfRotation = async () => {
    if (!shelfModalBatch) return;
    setIsSubmittingRotation(true);
    try {
      let res = null;
      if (onRotateShelf) {
        res = await onRotateShelf(shelfModalBatch.id);
      }
      if (res && res.success === false) {
        alert(`Lỗi xác nhận đảo kệ: ${res.message}`);
        return;
      }
      setActionToast(`✓ Đã hoàn tất SOP 5 bước và ký xác nhận đảo Lô ${shelfModalBatch.batchCode} ra mặt tiền kệ!`);
      setTimeout(() => setActionToast(''), 5500);
      setShelfModalBatch(null);
    } catch (err) {
      alert(`Lỗi xác nhận đảo kệ: ${err.message}`);
    } finally {
      setIsSubmittingRotation(false);
    }
  };

  const canApplyMarkdown = isAdmin || currentRole === 'STORE_MANAGER' || currentUser?.roleCode === 'STORE_MANAGER';
  const canRotateShelf = isAdmin || currentRole === 'STORE_MANAGER' || currentRole === 'WAREHOUSE_STAFF' || currentRole === 'CASHIER' || currentUser?.roleCode === 'STORE_MANAGER' || currentUser?.roleCode === 'WAREHOUSE_STAFF' || currentUser?.roleCode === 'CASHIER';

  // Áp dụng mức giảm giá Quick Markdown (15%, 30%, 40%, 50% hoặc 0% về nguyên giá)
  const handleApplyMarkdown = async (batchId, percent) => {
    if (!canApplyMarkdown) {
      alert('Chỉ tài khoản Quản trị viên / Cửa hàng trưởng mới có quyền duyệt Quick Markdown xả hàng!\nVui lòng đăng nhập với tài khoản có thẩm quyền.');
      if (onRequestAdminLogin) onRequestAdminLogin();
      return;
    }
    try {
      let res = null;
      if (onQuickDiscount) {
        res = await onQuickDiscount(batchId, percent);
      }
      if (res && res.success === false) {
        alert(`Lỗi giảm giá Quick Markdown: ${res.message}`);
        return;
      }
      const targetBatch = batches.find(b => b.id === batchId);
      setActionToast(
        percent > 0
          ? `⚡ Đã kích hoạt Quick Markdown giảm ${percent}% cho Lô ${targetBatch?.batchCode || batchId}. Giá khuyến mãi đã có hiệu lực tức thì tại POS!`
          : `✓ Đã khôi phục nguyên giá niêm yết (0%) cho Lô ${targetBatch?.batchCode || batchId}.`
      );
      setTimeout(() => setActionToast(''), 5500);
      setActiveDiscountBatchId(null);
    } catch (err) {
      alert(`Lỗi giảm giá Quick Markdown: ${err.message}`);
    }
  };

  // Danh mục 5 bước SOP Đảo Kệ Mặt Tiền
  const sopSteps = [
    {
      step: 1,
      title: 'Bước 1: Mở danh sách Lô hàng cần đảo kệ trên phần mềm',
      desc: 'Đối chiếu mã lô cận date (Vùng Vàng / Vùng Đỏ), hạn sử dụng và số lượng tồn kệ thực tế.'
    },
    {
      step: 2,
      title: 'Bước 2: Dời tạm các lô hàng date xa (Vùng Xanh) ra ngoài',
      desc: 'Đến quầy kệ vật lý, tạm thời dời các lô date xa ra khỏi mặt trước kệ để giải phóng vị trí mặt tiền.'
    },
    {
      step: 3,
      title: 'Bước 3: Đưa lô cận date (Vùng Vàng / Đỏ) ra sát mép mặt tiền kệ',
      desc: 'Xếp toàn bộ sản phẩm của lô cận date ra hàng đầu tiên ngang tầm mắt để khách hàng dễ lấy trước.'
    },
    {
      step: 4,
      title: 'Bước 4: Xếp các lô date xa trở lại phía sau lưng lô cận date',
      desc: 'Đưa các lô hạn dài lùi về phía sau theo chuẩn FEFO và dán tem giảm giá Quick Markdown (nếu có).'
    },
    {
      step: 5,
      title: `Bước 5: Xác nhận đảo kệ điện tử (${currentUser?.fullName || 'Nhân viên kho'})`,
      desc: 'Bấm xác nhận hoàn tất trên phần mềm để lưu vết thời gian và tên nhân viên thực hiện vào Sổ kiểm toán.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: 'calc(100vh - 105px)', overflow: 'hidden' }}>
      
      {/* 4 Cards Thống Kê 3 Cấp Màu & Quá Hạn */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', flexShrink: 0 }}>
        
        {/* Vùng Đỏ: Cận Date Nguy Kịch */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid',
            borderColor: statusFilter === 'CRITICAL' ? 'var(--danger-red)' : 'var(--border-subtle)',
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: statusFilter === 'CRITICAL' ? '0 0 0 1px var(--danger-red)' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--danger-red)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Vùng Đỏ (≤ 3 ngày)
            </span>
            <AlertOctagon size={16} color="var(--danger-red)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--danger-red)', lineHeight: 1 }}>
              {countCritical}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>lô nguy kịch</span>
          </div>
          <p style={{ margin: '5px 0 0', fontSize: '0.685rem', color: 'var(--text-muted)' }}>
            Giảm kịch sàn 40%-50% • Gom xả trong ngày
          </p>
        </div>

        {/* Vùng Vàng: Cảnh Báo Sớm */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'WARNING' ? 'ALL' : 'WARNING')}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid',
            borderColor: statusFilter === 'WARNING' ? 'var(--warning-yellow)' : 'var(--border-subtle)',
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: statusFilter === 'WARNING' ? '0 0 0 1px var(--warning-yellow)' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--warning-yellow)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Vùng Vàng (Cảnh Báo)
            </span>
            <AlertTriangle size={16} color="var(--warning-yellow)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--warning-yellow)', lineHeight: 1 }}>
              {countWarning}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>lô cần xử lý</span>
          </div>
          <p style={{ margin: '5px 0 0', fontSize: '0.685rem', color: 'var(--text-muted)' }}>
            Giảm giá 15%-30% • Đảo lô mặt tiền kệ
          </p>
        </div>

        {/* Vùng Xanh: An Toàn */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'SAFE' ? 'ALL' : 'SAFE')}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid',
            borderColor: statusFilter === 'SAFE' ? 'var(--primary)' : 'var(--border-subtle)',
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: statusFilter === 'SAFE' ? '0 0 0 1px var(--primary)' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Vùng Xanh (An Toàn)
            </span>
            <ShieldCheck size={16} color="var(--primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
              {countSafe}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>lô date dài</span>
          </div>
          <p style={{ margin: '5px 0 0', fontSize: '0.685rem', color: 'var(--text-muted)' }}>
            Bán nguyên giá • Xuất kho tự động FEFO
          </p>
        </div>

        {/* Khóa Cứng: Quá Hạn Cần Tiêu Hủy */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'EXPIRED' ? 'ALL' : 'EXPIRED')}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid',
            borderColor: statusFilter === 'EXPIRED' ? 'var(--expired-purple)' : 'var(--border-subtle)',
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: statusFilter === 'EXPIRED' ? '0 0 0 1px var(--expired-purple)' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--expired-purple)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Khóa Cứng (Hết Hạn)
            </span>
            <PackageX size={16} color="var(--expired-purple)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--expired-purple)', lineHeight: 1 }}>
              {countExpired}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>lô khóa bán</span>
          </div>
          <p style={{ margin: '5px 0 0', fontSize: '0.685rem', color: 'var(--text-muted)' }}>
            Cấm quét POS • Chờ lập phiếu tiêu hủy
          </p>
        </div>

      </div>

      {/* Banner Cảnh Báo Rủi Ro Lãng Phí Tài Chính (AI 2 Spoilage Risk từ SmartSupply AI) */}
      {totalAtRiskCost > 0 && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.12), rgba(245, 158, 11, 0.12))',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '10px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>DỰ BÁO RỦI RO LÃNG PHÍ TÀI CHÍNH:</span>
                <span style={{ color: '#e11d48', fontSize: '0.95rem' }}>
                  {totalAtRiskCost.toLocaleString('vi-VN')} đ
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #475569)', fontWeight: 500 }}>
                  (Chiếm {totalInventoryCost > 0 ? ((totalAtRiskCost / totalInventoryCost) * 100).toFixed(1) : 0}% tổng vốn tồn kho {totalInventoryCost.toLocaleString('vi-VN')} đ)
                </span>
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary, #334155)', marginTop: '2px' }}>
                Phát hiện <strong>{atRiskBatches.length} lô cận date</strong> cần ưu tiên xả hàng hoặc đảo kệ mặt tiền.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setStatusFilter(statusFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <AlertOctagon size={13} /> Lọc Lô Đỏ ({countCritical})
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'NEED_ROTATION' ? 'ALL' : 'NEED_ROTATION')}
              style={{
                background: 'rgba(8, 145, 178, 0.2)',
                color: '#06b6d4',
                border: '1px solid #0891b2',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RotateCw size={13} /> Lô Cần Đảo Kệ ({countNeedRotation})
            </button>
          </div>
        </div>
      )}

      {/* Thanh Điều Hướng Bộ Lọc & Tìm Kiếm */}
      <div className="glass-panel" style={{ padding: '12px 16px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        
        {/* Bộ Lọc Tabs Trạng Thái */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : ''}`}
            style={{ 
              fontSize: '0.785rem', 
              padding: '5px 12px', 
              borderRadius: '7px',
              background: statusFilter === 'ALL' ? 'var(--primary)' : 'var(--bg-subtle)',
              color: statusFilter === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)'
            }}
            onClick={() => setStatusFilter('ALL')}
          >
            <Layers size={13} /> Tất cả ({batches.length})
          </button>
          
          <button
            style={{ 
              fontSize: '0.785rem', 
              padding: '5px 12px', 
              borderRadius: '7px',
              background: statusFilter === 'CRITICAL' ? 'var(--danger-red-bg)' : 'var(--bg-subtle)',
              color: statusFilter === 'CRITICAL' ? 'var(--danger-red)' : 'var(--text-secondary)',
              border: statusFilter === 'CRITICAL' ? '1px solid var(--danger-red-border)' : '1px solid var(--border-subtle)',
              fontWeight: statusFilter === 'CRITICAL' ? 700 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setStatusFilter('CRITICAL')}
          >
            <AlertOctagon size={13} color="var(--danger-red)" /> Cận date khẩn cấp ({countCritical})
          </button>

          <button
            style={{ 
              fontSize: '0.785rem', 
              padding: '5px 12px', 
              borderRadius: '7px',
              background: statusFilter === 'WARNING' ? 'var(--warning-yellow-bg)' : 'var(--bg-subtle)',
              color: statusFilter === 'WARNING' ? 'var(--warning-yellow)' : 'var(--text-secondary)',
              border: statusFilter === 'WARNING' ? '1px solid var(--warning-yellow-border)' : '1px solid var(--border-subtle)',
              fontWeight: statusFilter === 'WARNING' ? 700 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setStatusFilter('WARNING')}
          >
            <AlertTriangle size={13} color="var(--warning-yellow)" /> Cảnh báo vàng ({countWarning})
          </button>

          <button
            style={{ 
              fontSize: '0.785rem', 
              padding: '5px 12px', 
              borderRadius: '7px',
              background: statusFilter === 'SAFE' ? 'var(--primary-bg)' : 'var(--bg-subtle)',
              color: statusFilter === 'SAFE' ? 'var(--primary)' : 'var(--text-secondary)',
              border: statusFilter === 'SAFE' ? '1px solid var(--primary-border)' : '1px solid var(--border-subtle)',
              fontWeight: statusFilter === 'SAFE' ? 700 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setStatusFilter('SAFE')}
          >
            <ShieldCheck size={13} color="var(--primary)" /> An toàn ({countSafe})
          </button>

          <button
            style={{ 
              fontSize: '0.785rem', 
              padding: '5px 12px', 
              borderRadius: '7px',
              background: statusFilter === 'EXPIRED' ? 'var(--expired-purple-bg)' : 'var(--bg-subtle)',
              color: statusFilter === 'EXPIRED' ? 'var(--expired-purple)' : 'var(--text-muted)',
              border: statusFilter === 'EXPIRED' ? '1px solid var(--expired-purple-border)' : '1px solid var(--border-subtle)',
              fontWeight: statusFilter === 'EXPIRED' ? 700 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setStatusFilter('EXPIRED')}
          >
            <PackageX size={13} color="var(--expired-purple)" /> Đã hết hạn ({countExpired})
          </button>

          <button
            style={{ 
              fontSize: '0.785rem', 
              padding: '5px 12px', 
              borderRadius: '7px',
              background: statusFilter === 'NEED_ROTATION' ? 'rgba(6, 182, 212, 0.14)' : 'var(--bg-subtle)',
              color: statusFilter === 'NEED_ROTATION' ? '#0891b2' : 'var(--text-secondary)',
              border: statusFilter === 'NEED_ROTATION' ? '1px solid #06b6d4' : '1px solid var(--border-subtle)',
              fontWeight: statusFilter === 'NEED_ROTATION' ? 700 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setStatusFilter('NEED_ROTATION')}
            title="Bước 1 SOP Đảo kệ: Lọc danh sách các lô Vùng Đỏ / Vùng Vàng chưa đảo ra mặt tiền kệ"
          >
            <RotateCw size={13} color="#0891b2" /> Cần Đảo Kệ ({countNeedRotation})
          </button>
        </div>

        {/* Cụm Thao Tác & Tìm Kiếm */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => exportBatchesFefoToExcel(filteredBatches)}
            title="Xuất danh sách tồn kho & hạn sử dụng lô hàng ra file Excel CSV (UTF-8 with BOM)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: '7px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.785rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={14} color="var(--primary)" />
            <span>Xuất Excel ({filteredBatches.length})</span>
          </button>

          {/* Ô Tìm Kiếm Nhanh */}
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              style={{
                width: '100%',
                padding: '7px 12px 7px 34px',
                fontSize: '0.8rem',
                borderRadius: '7px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Tìm theo mã lô hoặc tên sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '7px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Banner phản hồi thao tác Quick Markdown / Đảo kệ SOP */}
      {actionToast && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid #10b981',
          color: '#059669',
          padding: '8px 14px',
          borderRadius: '8px',
          fontSize: '0.8rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={15} />
            <span>{actionToast}</span>
          </div>
          <button
            onClick={() => setActionToast('')}
            style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', padding: '2px' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Bảng Theo Dõi Vòng Đời Lô Hàng (FEFO Table) */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '12px' }}>
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <table className="modern-table" style={{ margin: 0, width: '100%' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-subtle)' }}>
              <tr>
                <th style={{ width: '135px', padding: '10px 14px' }}>Mã Lô</th>
                <th style={{ padding: '10px 14px' }}>Sản Phẩm & Ngành Hàng</th>
                <th style={{ width: '110px', padding: '10px 14px' }}>Ngày Nhập</th>
                <th style={{ width: '190px', padding: '10px 14px' }}>Hạn Dùng & Còn Lại</th>
                <th style={{ width: '140px', padding: '10px 14px' }}>Vòng Đời (RSL)</th>
                <th style={{ width: '90px', padding: '10px 14px' }}>Tồn Kệ</th>
                <th style={{ width: '130px', padding: '10px 14px' }}>Trạng Thái FEFO</th>
                <th style={{ textAlign: 'right', minWidth: '190px', padding: '10px 14px' }}>Hành Động Khắc Phục</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Không tìm thấy lô hàng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredBatches.map(batch => {
                  const daysLeft = getDaysRemaining(batch);
                  const rsl = getRslPercentage(batch);
                  const isCritical = isBatchCritical(batch);
                  const isWarning = isBatchWarning(batch);
                  const isExpired = isBatchExpired(batch);
                  const currentStock = batch.currentQuantity !== undefined ? batch.currentQuantity : (batch.quantity || 0);

                  return (
                    <tr 
                      key={batch.id} 
                      style={{ 
                        background: isCritical 
                          ? 'rgba(225, 29, 72, 0.04)' 
                          : isExpired 
                            ? 'rgba(147, 51, 234, 0.04)' 
                            : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Mã Lô & Nút In Tem Nhãn Lô Hàng Barcode */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '0.825rem' }}>
                            {batch.batchCode}
                          </span>
                          {canRotateShelf && (
                            <button
                              type="button"
                              onClick={() => setPrintBatchLabelData(batch)}
                              style={{
                                background: 'rgba(99, 102, 241, 0.12)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                color: '#6366f1',
                                borderRadius: '4px',
                                padding: '2px 5px',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                              title="In tem nhãn mã vạch Barcode dán khay/thùng lô hàng"
                            >
                              <Tag size={10} /> Tem Lô
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            ID: #{batch.id}
                          </span>
                          {batch.importPrice > 0 && (
                            <span style={{ fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                              • Vốn: {Number(batch.importPrice).toLocaleString('vi-VN')}đ
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tên Sản Phẩm */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                          {batch.productName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            {batch.category || batch.categoryName || 'FMCG Tiêu chuẩn'}
                          </span>
                          {batch.sellingPrice > 0 && (
                            <span style={{ fontSize: '0.7rem', color: (batch.isDiscounted || batch.discountPercent > 0) ? '#d97706' : 'var(--text-muted)', fontWeight: 700 }}>
                              • Giá POS: {Number(batch.discountedPrice || batch.sellingPrice).toLocaleString('vi-VN')}đ
                              {(batch.isDiscounted || batch.discountPercent > 0) && (
                                <span style={{ textDecoration: 'line-through', color: 'var(--text-dim)', marginLeft: '4px', fontWeight: 400 }}>
                                  {Number(batch.sellingPrice).toLocaleString('vi-VN')}đ
                                </span>
                              )}
                            </span>
                          )}
                          {(batch.isDiscounted || batch.discountPercent > 0) && (
                            <span style={{
                              fontSize: '0.675rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: 'var(--warning-yellow-bg)',
                              color: 'var(--warning-yellow)',
                              border: '1px solid var(--warning-yellow-border)',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}>
                              <Zap size={10} /> Giảm {batch.discountPercent}%
                            </span>
                          )}
                          {batch.isShelfRotated && (
                            <span style={{
                              fontSize: '0.675rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: 'var(--primary-bg)',
                              color: 'var(--primary)',
                              border: '1px solid var(--primary-border)',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}>
                              <CheckCircle2 size={10} /> Mặt tiền kệ
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ngày Nhập */}
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {batch.importDate}
                      </td>

                      {/* Hạn Sử Dụng & Còn Lại */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: daysLeft <= 3 ? 'var(--danger-red)' : 'var(--text-main)', fontSize: '0.825rem' }}>
                            {batch.expiryDate}
                          </span>
                          {isExpired ? (
                            <span className="badge badge-expired" style={{ fontSize: '0.675rem', padding: '1px 6px' }}>
                              <Lock size={10} style={{ marginRight: '2px' }} /> Quá {Math.abs(daysLeft)} ngày
                            </span>
                          ) : daysLeft <= 3 ? (
                            <span className="badge badge-danger" style={{ fontSize: '0.675rem', padding: '1px 6px' }}>
                              Còn {daysLeft} ngày
                            </span>
                          ) : daysLeft <= 10 ? (
                            <span className="badge badge-warning" style={{ fontSize: '0.675rem', padding: '1px 6px' }}>
                              Còn {daysLeft} ngày
                            </span>
                          ) : (
                            <span className="badge badge-safe" style={{ fontSize: '0.675rem', padding: '1px 6px' }}>
                              Còn {daysLeft} ngày
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Vòng Đời RSL */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${rsl}%`,
                              background: isExpired 
                                ? 'var(--expired-purple)' 
                                : isCritical 
                                  ? 'var(--danger-red)' 
                                  : isWarning 
                                    ? 'var(--warning-yellow)' 
                                    : 'var(--primary)',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.725rem', fontWeight: 700, width: '32px', color: 'var(--text-muted)' }}>
                            {rsl}%
                          </span>
                        </div>
                      </td>

                      {/* Tồn Kệ & Giá Trị Vốn / Rủi Ro (AI 2 Spoilage Risk) */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                          <strong style={{ fontSize: '0.95rem', color: currentStock === 0 ? 'var(--text-dim)' : 'var(--text-main)' }}>
                            {currentStock}
                          </strong>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            {batch.unit || 'hộp'}
                          </span>
                        </div>
                        {currentStock > 0 && batch.importPrice > 0 && (
                          <div style={{ fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                            Vốn: {(currentStock * Number(batch.importPrice)).toLocaleString('vi-VN')}đ
                          </div>
                        )}
                        {(isCritical || isWarning) && currentStock > 0 && !isExpired && (
                          <div style={{
                            fontSize: '0.625rem',
                            color: isCritical ? 'var(--danger-red, #ef4444)' : 'var(--warning-yellow, #f59e0b)',
                            fontWeight: 700,
                            marginTop: '2px'
                          }} title="Vốn có rủi ro mất mát nếu không bán hết trước hạn (AI 2 Spoilage Risk)">
                            ⚠️ Rủi ro: {(batch.atRiskCost ? Number(batch.atRiskCost) : (currentStock * Number(batch.importPrice || 0))).toLocaleString('vi-VN')}đ
                          </div>
                        )}
                      </td>

                      {/* Trạng Thái FEFO */}
                      <td>
                        {currentStock <= 0 ? (
                          <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                            Hết hàng
                          </span>
                        ) : isExpired ? (
                          <span className="badge badge-expired">Khóa Bán POS</span>
                        ) : isCritical ? (
                          <span className="badge badge-danger">Cận Date Đỏ</span>
                        ) : isWarning ? (
                          <span className="badge badge-warning">Cảnh Báo Vàng</span>
                        ) : (
                          <span className="badge badge-safe">An Toàn</span>
                        )}
                      </td>

                      {/* Hành Động Khắc Phục (Quick Markdown & Đảo Kệ & Hủy) */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {currentStock <= 0 ? (
                            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>Không còn hàng</span>
                          ) : (
                            <>
                              {/* Cụm Quick Markdown (Rule 4 & Chuẩn Tự Động: Mở Cửa Sổ Bật Ra Quick Markdown) */}
                              {canApplyMarkdown && (isCritical || isWarning || batch.isDiscounted || (batch.discountPercent && batch.discountPercent > 0)) && !isExpired && (
                                <button
                                  type="button"
                                  onClick={() => setQuickMarkdownModalBatch(batch)}
                                  style={{
                                    fontSize: '0.725rem',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid',
                                    borderColor: batch.isDiscounted ? 'var(--warning-yellow-border)' : 'var(--border-subtle)',
                                    background: batch.isDiscounted ? 'var(--warning-yellow-bg)' : 'var(--bg-surface)',
                                    color: batch.isDiscounted ? 'var(--warning-yellow)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 600,
                                    transition: 'all 0.15s ease'
                                  }}
                                  title="Mở cửa sổ Quick Markdown xả hàng (15%, 30%, 40%, 50%)"
                                >
                                  <Zap size={12} color="var(--warning-yellow)" />
                                  <span>{batch.isDiscounted ? `Giảm ${batch.discountPercent}%` : 'Xả Hàng'}</span>
                                </button>
                              )}

                              {/* Nút In Sticker Giảm Giá Xả Hàng (Mục 4.4: Admin, Quản lý, Nhân viên kho) */}
                              {canRotateShelf && (isCritical || isWarning || batch.isDiscounted || (batch.discountPercent && batch.discountPercent > 0)) && !isExpired && (
                                <button
                                  type="button"
                                  onClick={() => setPrintStickerModalData({ batch, initialDiscount: batch.discountPercent || 30 })}
                                  style={{
                                    fontSize: '0.725rem',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #ea580c',
                                    background: 'rgba(234, 88, 12, 0.12)',
                                    color: '#ea580c',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 700,
                                    transition: 'all 0.15s ease'
                                  }}
                                  title="In tem sticker giảm giá xả hàng dán mặt tiền kệ (Bước 4 SOP Đảo kệ )"
                                >
                                  <Printer size={12} />
                                  <span>In Tem</span>
                                </button>
                              )}

                              {/* Nút Đảo Kệ Mặt Tiền (Mở Modal 5 bước SOP - Chỉ Admin, Quản lý, Nhân viên kho) */}
                              {canRotateShelf && (isCritical || isWarning) && !isExpired && (
                                <button
                                  onClick={() => handleOpenRotateModal(batch)}
                                  style={{
                                    fontSize: '0.725rem',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid',
                                    borderColor: batch.isShelfRotated ? 'var(--primary-border)' : 'var(--border-subtle)',
                                    background: batch.isShelfRotated ? 'var(--primary-bg)' : 'var(--bg-surface)',
                                    color: batch.isShelfRotated ? 'var(--primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 600,
                                    transition: 'all 0.15s ease'
                                  }}
                                  title="Thực hiện SOP 5 bước đảo lô ra mặt tiền kệ"
                                >
                                  <RotateCw size={12} />
                                  <span>{batch.isShelfRotated ? 'Đã Đảo Kệ' : 'Đảo Kệ'}</span>
                                </button>
                              )}

                              {/* Nếu là CASHIER xem lô cận date (chưa hết hạn): Hiển thị nút Lập đề xuất hủy hỏng bao bì hoặc nhãn Tra cứu */}
                              {!canRotateShelf && !isExpired && (
                                <button
                                  onClick={() => onOpenDisposalModal(batch)}
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                    background: 'var(--bg-subtle)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 600
                                  }}
                                  title="Thu ngân báo cáo sản phẩm móp méo, vỡ hỏng phát sinh tại quầy"
                                >
                                  <Trash2 size={11} /> Báo Hỏng Quầy
                                </button>
                              )}

                              {/* Nút Hủy Lô Quá Hạn */}
                              {isExpired && (
                                <button
                                  onClick={() => onOpenDisposalModal(batch)}
                                  style={{
                                    fontSize: '0.725rem',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--danger-red-border)',
                                    background: 'var(--danger-red-bg)',
                                    color: 'var(--danger-red)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 700
                                  }}
                                  title="Chuyển sang lập phiếu tiêu hủy và hạch toán sổ hao hụt"
                                >
                                  <Trash2 size={12} /> Hủy Lô
                                </button>
                              )}
                            </>
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
      </div>

      {/* MODAL QUY TRÌNH ĐẢO KỆ MẶT TIỀN 5 BƯỚC (SOP Chuẩn Tự Động) */}
      {shelfModalBatch && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--modal-backdrop)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: 'var(--shadow-elevated)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header Modal */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  background: 'var(--primary-bg)',
                  border: '1px solid var(--primary-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <ClipboardCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    SOP Quy Trình Đảo Kệ Mặt Tiền (5 Bước)
                  </h3>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    Tiêu chuẩn vận hành trưng bày FEFO • LHU Mart
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShelfModalBatch(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Thông tin Lô Cần Đảo */}
            <div style={{ padding: '14px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                fontSize: '0.785rem',
                background: 'var(--bg-subtle)',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Sản phẩm: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{shelfModalBatch.productName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Mã lô: </span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{shelfModalBatch.batchCode}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Hạn sử dụng: </span>
                  <strong style={{ color: 'var(--danger-red)' }}>{shelfModalBatch.expiryDate} (Còn {getDaysRemaining(shelfModalBatch)} ngày)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Tồn kệ cần xếp: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{shelfModalBatch.currentQuantity ?? shelfModalBatch.quantity} {shelfModalBatch.unit || 'hộp'}</strong>
                </div>
              </div>
            </div>

            {/* Checklist 5 Bước SOP */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              {sopSteps.map((s, idx) => {
                const isChecked = completedSteps[idx];
                return (
                  <div
                    key={s.step}
                    onClick={() => {
                      const next = [...completedSteps];
                      next[idx] = !next[idx];
                      setCompletedSteps(next);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isChecked ? 'var(--primary-border)' : 'var(--border-subtle)',
                      background: isChecked ? 'var(--primary-bg)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '5px',
                      border: '1px solid',
                      borderColor: isChecked ? 'var(--primary)' : 'var(--border-color)',
                      background: isChecked ? 'var(--primary)' : 'var(--bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      marginTop: '2px',
                      flexShrink: 0
                    }}>
                      {isChecked && <Check size={14} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: isChecked ? 'var(--primary)' : 'var(--text-main)'
                      }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                        {s.desc}
                      </div>

                      {/* Nút In Sticker trực tiếp ở Bước 4 SOP */}
                      {idx === 3 && (
                        <div style={{ marginTop: '8px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrintStickerModalData({ batch: shelfModalBatch, initialDiscount: 30 });
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: '1px solid #ea580c',
                              background: '#ea580c',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              boxShadow: '0 2px 4px rgba(234, 88, 12, 0.3)'
                            }}
                          >
                            <Printer size={13} />
                            <span>In Sticker Giảm Giá Ngay</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Modal Action */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Đã hoàn thành: <strong>{completedSteps.filter(Boolean).length}/5</strong> bước
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShelfModalBatch(null)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy Bỏ
                </button>

                <button
                  type="button"
                  onClick={handleConfirmShelfRotation}
                  disabled={isSubmittingRotation || completedSteps.filter(Boolean).length < 5}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '7px',
                    border: 'none',
                    background: completedSteps.filter(Boolean).length === 5 ? 'var(--primary)' : 'var(--border-hover)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: completedSteps.filter(Boolean).length === 5 ? 'pointer' : 'not-allowed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: completedSteps.filter(Boolean).length === 5 ? '0 2px 4px rgba(79, 70, 229, 0.25)' : 'none',
                    opacity: isSubmittingRotation ? 0.7 : 1
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>{isSubmittingRotation ? 'Đang Lưu...' : 'Xác Nhận Đã Đảo Kệ (Ký Số)'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Xem Trước & In Sticker Giảm Giá Xả Hàng Mặt Tiền Kệ */}
      <PrintDiscountStickerModal
        isOpen={!!printStickerModalData}
        onClose={() => setPrintStickerModalData(null)}
        batch={printStickerModalData?.batch}
        products={products}
        storeProfile={storeProfile}
        initialDiscount={printStickerModalData?.initialDiscount || 30}
      />

      {/* Modal Xem Trước & In Tem Nhãn Lô Hàng Barcode */}
      <PrintBatchLabelModal
        isOpen={!!printBatchLabelData}
        onClose={() => setPrintBatchLabelData(null)}
        batch={printBatchLabelData}
        storeProfile={storeProfile}
      />

      {/* Cửa Sổ Bật Ra Quick Markdown Xả Hàng */}
      <QuickMarkdownModal
        isOpen={!!quickMarkdownModalBatch}
        onClose={() => setQuickMarkdownModalBatch(null)}
        batch={quickMarkdownModalBatch}
        onApplyMarkdown={handleApplyMarkdown}
        onOpenPrintSticker={(b, pct) => setPrintStickerModalData({ batch: b, initialDiscount: pct })}
        canApplyMarkdown={canApplyMarkdown}
      />

    </div>
  );
}
