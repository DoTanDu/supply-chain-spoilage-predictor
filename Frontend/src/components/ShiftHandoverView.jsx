import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardCheck, 
  DollarSign, 
  AlertTriangle, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  Printer, 
  RotateCw, 
  ShieldCheck, 
  Sparkles, 
  AlertOctagon, 
  Layers, 
  Calculator,
  User,
  Calendar,
  Eye,
  Check,
  X
} from 'lucide-react';
import * as api from '../api';

// Bảng các mệnh giá tiền mặt VND lưu hành tại quầy POS
const DENOMINATIONS = [
  { value: 500000, label: '500.000 ₫' },
  { value: 200000, label: '200.000 ₫' },
  { value: 100000, label: '100.000 ₫' },
  { value: 50000, label: '50.000 ₫' },
  { value: 20000, label: '20.000 ₫' },
  { value: 10000, label: '10.000 ₫' }
];

export default function ShiftHandoverView({
  currentUser,
  batches = [],
  disposals = [],
  liveStats = null,
  storeProfile = null
}) {
  const [activeTab, setActiveTab] = useState('handover-wizard'); // 'handover-wizard' | 'history'
  const [currentStep, setCurrentStep] = useState(1);

  // Ca làm việc & Nhân viên
  const [shiftType, setShiftType] = useState('MORNING'); // 'MORNING' (06:00 - 14:00) | 'AFTERNOON' (14:00 - 22:00)
  const [handoverPerson, setHandoverPerson] = useState(currentUser?.fullName || currentUser?.username || 'Thu ngân ca sáng');
  const [receiverPerson, setReceiverPerson] = useState('Nguyễn Văn An (Thu ngân ca chiều)');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [activeStaffList, setActiveStaffList] = useState([]);
  const [complianceAgreed, setComplianceAgreed] = useState(true);

  // Bước 1: Kiểm đếm tiền mặt trong két
  const [denominationCounts, setDenominationCounts] = useState({
    500000: 5,
    200000: 8,
    100000: 12,
    50000: 15,
    20000: 20,
    10000: 30
  });
  const [otherCash, setOtherCash] = useState(0); // Tiền xu / lẻ khác
  const [customExpectedPosCash, setCustomExpectedPosCash] = useState(null);

  // Tự động đồng bộ ca trực và danh sách nhân viên từ CSDL
  useEffect(() => {
    const loadShiftSummary = async () => {
      try {
        const res = await api.apiGetShiftSummary();
        if (res && res.success && res.data) {
          if (res.data.shiftType) {
            setShiftType(res.data.shiftType);
          }
          if (Array.isArray(res.data.activeStaff) && res.data.activeStaff.length > 0) {
            setActiveStaffList(res.data.activeStaff);
          }
          if (res.data.todaySalesRevenue > 0 && customExpectedPosCash === null) {
            setCustomExpectedPosCash(res.data.todaySalesRevenue);
          }
        }
      } catch (err) {
        console.warn('Lỗi tải tóm tắt ca trực:', err);
      }
    };
    loadShiftSummary();
  }, []);

  // Doanh số POS dự kiến (Ước tính từ liveStats hôm nay hoặc tùy chỉnh)
  const expectedPosCash = useMemo(() => {
    if (customExpectedPosCash !== null) {
      return Number(customExpectedPosCash);
    }
    const liveRevenue = Number(
      liveStats?.kpiMetrics?.todayTotalRevenue ?? 
      liveStats?.kpiMetrics?.todaySalesRevenue ?? 
      liveStats?.todaySalesRevenue ?? 
      liveStats?.todayRevenue ?? 0
    );
    return liveRevenue;
  }, [liveStats, customExpectedPosCash]);

  // Tính tổng tiền mặt đếm thực tế
  const actualCashTotal = useMemo(() => {
    let total = Number(otherCash) || 0;
    Object.entries(denominationCounts).forEach(([denom, count]) => {
      total += Number(denom) * (Number(count) || 0);
    });
    return total;
  }, [denominationCounts, otherCash]);

  // Chênh lệch doanh số (Thừa / Thiếu / Khớp)
  const cashDifference = actualCashTotal - expectedPosCash;

  // Bước 2: Danh sách lô cận date (Đỏ & Vàng)
  const criticalAndWarningBatches = useMemo(() => {
    return batches.filter(b => (b.status === 'CRITICAL' || b.status === 'WARNING') && (b.currentQuantity || b.quantity) > 0);
  }, [batches]);

  const [checkedBatches, setCheckedBatches] = useState({});

  useEffect(() => {
    // Mặc định đánh dấu đã rà soát tất cả lô
    const initialChecked = {};
    criticalAndWarningBatches.forEach(b => {
      initialChecked[b.id] = true;
    });
    setCheckedBatches(initialChecked);
  }, [criticalAndWarningBatches]);

  const toggleCheckBatch = (batchId) => {
    setCheckedBatches(prev => ({
      ...prev,
      [batchId]: !prev[batchId]
    }));
  };

  // Bước 3: Hàng hủy trong khu cách ly chờ tiêu hủy
  const pendingDisposals = useMemo(() => {
    return disposals.filter(d => d.status === 'PENDING' || d.status === 'DRAFT');
  }, [disposals]);

  const totalWasteQuantity = useMemo(() => {
    return pendingDisposals.reduce((sum, d) => sum + (Number(d.quantityDisposed || d.quantity || 0)), 0);
  }, [pendingDisposals]);

  const totalWasteLoss = useMemo(() => {
    return pendingDisposals.reduce((sum, d) => sum + (Number(d.costLoss || d.totalCost || 0)), 0);
  }, [pendingDisposals]);

  const [wasteConfirmed, setWasteConfirmed] = useState(true);

  // Bước 4: Ký xác nhận & In biên bản
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handoverSuccessResult, setHandoverSuccessResult] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Lịch sử bàn giao ca & bộ lọc
  const [handoverHistory, setHandoverHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyShiftFilter, setHistoryShiftFilter] = useState('ALL'); // 'ALL' | 'MORNING' | 'AFTERNOON'
  const [selectedHandoverForPrint, setSelectedHandoverForPrint] = useState(null);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.apiGetShiftHandoverHistory();
      if (res && res.success && Array.isArray(res.data)) {
        setHandoverHistory(res.data);
      }
    } catch (err) {
      console.warn("Không thể tải lịch sử bàn giao:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  // Bộ lọc lịch sử
  const filteredHistory = useMemo(() => {
    return handoverHistory.filter(item => {
      const matchShift = historyShiftFilter === 'ALL' || item.shiftType === historyShiftFilter;
      if (!historySearch.trim()) return matchShift;
      const term = historySearch.toLowerCase().trim();
      const matchText = (item.handoverPerson && item.handoverPerson.toLowerCase().includes(term)) ||
                        (item.receiverPerson && item.receiverPerson.toLowerCase().includes(term)) ||
                        (item.handoverCode && item.handoverCode.toLowerCase().includes(term)) ||
                        (item.notes && item.notes.toLowerCase().includes(term));
      return matchShift && matchText;
    });
  }, [handoverHistory, historySearch, historyShiftFilter]);

  // Thống kê lịch sử ca
  const historyStats = useMemo(() => {
    const total = handoverHistory.length;
    const balanced = handoverHistory.filter(h => h.cashDifference === 0).length;
    const totalRevenue = handoverHistory.reduce((sum, h) => sum + (Number(h.posSalesAmount) || 0), 0);
    return { total, balanced, totalRevenue };
  }, [handoverHistory]);

  // Xử lý nộp biên bản bàn giao
  const handleSubmitHandover = async () => {
    if (!handoverPerson.trim() || !receiverPerson.trim()) {
      alert("Vui lòng nhập đầy đủ tên Người bàn giao và Người tiếp nhận ca.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        shiftType,
        handoverPerson: handoverPerson.trim(),
        receiverPerson: receiverPerson.trim(),
        posSalesAmount: expectedPosCash,
        cashInDrawer: actualCashTotal,
        cashDifference,
        redBatchesCount: criticalAndWarningBatches.filter(b => b.status === 'CRITICAL').length,
        yellowBatchesCount: criticalAndWarningBatches.filter(b => b.status === 'WARNING').length,
        wasteCount: totalWasteQuantity,
        notes: handoverNotes.trim()
      };

      const res = await api.apiSubmitShiftHandover(payload);
      if (res && res.success) {
        setHandoverSuccessResult(res.data);
        setShowPrintModal(true);
      } else {
        alert(res?.message || "Lỗi khi lưu biên bản bàn giao ca.");
      }
    } catch (err) {
      alert(err.message || "Lỗi kết nối máy chủ khi lưu biên bản bàn giao.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form về ban đầu sau khi hoàn tất
  const handleResetForm = () => {
    setHandoverSuccessResult(null);
    setShowPrintModal(false);
    setCurrentStep(1);
    setHandoverNotes('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner & Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '16px 20px',
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
            border: '1px solid rgba(99, 102, 241, 0.25)'
          }}>
            <ClipboardCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Bàn Giao Ca Trực Điện Tử
              </h2>
              <span style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}>
                Quy Trình 4 Bước
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Chốt doanh số tiền két, kiểm đếm lô cận date, rà soát hàng hủy và ký xác nhận điện tử lưu vết kiểm toán
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('handover-wizard')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'handover-wizard' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'handover-wizard' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <RotateCw size={14} />
            <span>Thực hiện Bàn giao Ca</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'history' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'history' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <FileText size={14} />
            <span>Lịch sử Biên bản ({handoverHistory.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'handover-wizard' ? (
        <>
          {/* Stepper Progress Bar 4 Bước */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            background: 'var(--bg-card)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {[
              { step: 1, title: 'Bước 1: Doanh số & Két tiền', desc: 'Kiểm đếm tiền mặt POS', icon: DollarSign },
              { step: 2, title: 'Bước 2: Rà soát Lô cận Date', desc: `${criticalAndWarningBatches.length} lô Đỏ & Vàng`, icon: AlertTriangle },
              { step: 3, title: 'Bước 3: Hàng hủy Khu cách ly', desc: `${totalWasteQuantity} SP chờ tiêu hủy`, icon: Trash2 },
              { step: 4, title: 'Bước 4: Ký xác nhận Điện tử', desc: 'Lưu vết AuditLogs', icon: UserCheck }
            ].map((s) => {
              const isCurrent = currentStep === s.step;
              const isPassed = currentStep > s.step;
              const Icon = s.icon;

              return (
                <div
                  key={s.step}
                  onClick={() => setCurrentStep(s.step)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isCurrent ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    border: isCurrent ? '1px solid var(--accent-primary)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: isPassed ? 'var(--safe-green)' : isCurrent ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: isPassed || isCurrent ? '#ffffff' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}>
                    {isPassed ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: isCurrent ? 'var(--accent-primary)' : isPassed ? 'var(--text-main)' : 'var(--text-muted)'
                    }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {s.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cấu hình chung Ca Trực */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Ca trực bàn giao:</span>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="MORNING">Ca Sáng (06:00 - 14:00)</option>
                  <option value="AFTERNOON">Ca Chiều (14:00 - 22:00)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} color="var(--text-muted)" />
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Ngày thực hiện:</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {new Date().toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '0.74rem',
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--safe-green)',
                fontWeight: 600
              }}>
                🏪 LHU Mart (RETAIL-STORE-01)
              </span>
            </div>
          </div>

          {/* ============================================================================== */}
          {/* NỘI DUNG TỪNG BƯỚC */}
          {/* ============================================================================== */}

          {/* BƯỚC 1: KIỂM ĐẾM TIỀN MẶT TRONG KÉT & ĐỐI SOÁT DOANH SỐ POS */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Thống kê đối soát (Reconciliation Banner) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px'
              }}>
                <div style={{
                  padding: '18px 20px',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Doanh Số Ghi Nhận POS
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const liveRev = Number(liveStats?.kpiMetrics?.todayTotalRevenue ?? liveStats?.todaySalesRevenue ?? 0);
                        setCustomExpectedPosCash(liveRev);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        textDecoration: 'underline'
                      }}
                    >
                      Đồng bộ POS thực
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                    <input
                      type="number"
                      value={expectedPosCash}
                      onChange={(e) => setCustomExpectedPosCash(Number(e.target.value))}
                      style={{
                        fontSize: '1.35rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        fontFamily: 'monospace',
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        width: '160px'
                      }}
                    />
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>₫</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Tính từ các giao dịch POS trong ca (Có thể chỉnh sửa đối soát)
                  </div>
                </div>

                <div style={{
                  padding: '18px 20px',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Tiền Mặt Đếm Thực Tế Trong Két
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '4px', fontFamily: 'monospace' }}>
                    {actualCashTotal.toLocaleString('vi-VN')} ₫
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Tổng cộng các cọc tiền và tiền lẻ
                  </div>
                </div>

                <div style={{
                  padding: '18px 20px',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: `1px solid ${cashDifference === 0 ? 'rgba(16, 185, 129, 0.3)' : cashDifference < 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Chênh Lệch Đối Soát
                  </div>
                  <div style={{
                    fontSize: '1.45rem',
                    fontWeight: 700,
                    marginTop: '4px',
                    fontFamily: 'monospace',
                    color: cashDifference === 0 ? 'var(--safe-green)' : cashDifference < 0 ? 'var(--critical-red)' : 'var(--warning-amber)'
                  }}>
                    {cashDifference > 0 ? `+${cashDifference.toLocaleString('vi-VN')}` : `${cashDifference.toLocaleString('vi-VN')}`} ₫
                  </div>
                  <div style={{
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    marginTop: '4px',
                    color: cashDifference === 0 ? 'var(--safe-green)' : cashDifference < 0 ? 'var(--critical-red)' : 'var(--warning-amber)'
                  }}>
                    {cashDifference === 0 ? '✓ Khớp 100% doanh số POS' : cashDifference < 0 ? '⚠️ Thiếu hụt tiền trong két' : '⚠️ Dư tiền mặt so với bill'}
                  </div>
                </div>
              </div>

              {/* Bảng đếm chi tiết mệnh giá */}
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calculator size={18} color="var(--accent-primary)" />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Bảng Đếm Chi Tiết Mệnh Giá Tiền Mặt (VND)
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setDenominationCounts({ 500000: 0, 200000: 0, 100000: 0, 50000: 0, 20000: 0, 10000: 0 });
                      setOtherCash(0);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Xóa nhập lại từ đầu
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '14px'
                }}>
                  {DENOMINATIONS.map((d) => {
                    const count = denominationCounts[d.value] || 0;
                    const subtotal = d.value * count;

                    return (
                      <div
                        key={d.value}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                            {d.label}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                            = {subtotal.toLocaleString('vi-VN')} ₫
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            min="0"
                            value={count}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setDenominationCounts(prev => ({ ...prev, [d.value]: val }));
                            }}
                            style={{
                              width: '75px',
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-main)',
                              textAlign: 'center',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              outline: 'none'
                            }}
                          />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>tờ</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tiền lẻ khác */}
                <div style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      Tiền xu & Mệnh giá lẻ khác (₫)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Các mệnh giá 5.000đ, 2.000đ, 1.000đ hoặc tiền lẻ trong hộc
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min="0"
                      value={otherCash}
                      onChange={(e) => setOtherCash(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      style={{
                        width: '140px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textAlign: 'right',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>₫</span>
                  </div>
                </div>
              </div>

              {/* Navigation Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  onClick={() => setCurrentStep(2)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                  }}
                >
                  <span>Xác nhận tiền két & Sang Bước 2</span>
                  <ArrowRight size={16} />
                </button>
              </div>

            </div>
          )}

          {/* BƯỚC 2: RÀ SOÁT LÔ CẬN DATE TRÊN KỆ (VÙNG ĐỎ & VÀNG) */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Danh Sách Lô Cận Date Cần Bàn Giao Theo Dõi ({criticalAndWarningBatches.length} Lô)
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Quy định bàn giao: Nhân viên ca sau kiểm tra thực tế trên kệ, xác nhận lô Đỏ đã gắn tem Markdown và lô Vàng đã đảo mặt tiền.
                    </p>
                  </div>

                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--critical-red)'
                  }}>
                    {criticalAndWarningBatches.filter(b => b.status === 'CRITICAL').length} Lô Nguy Kịch (Đỏ)
                  </span>
                </div>

                {criticalAndWarningBatches.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <ShieldCheck size={36} color="var(--safe-green)" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Quầy kệ an toàn tuyệt đối!</div>
                    <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Không có lô nào nằm trong vùng Cảnh báo (Vàng) hoặc Nguy kịch (Đỏ).</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '10px 14px', width: '40px', textAlign: 'center' }}>Xác Nhận</th>
                          <th style={{ padding: '10px 14px' }}>Mã Lô</th>
                          <th style={{ padding: '10px 14px' }}>Sản Phẩm</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center' }}>Hạn Sử Dụng</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center' }}>Còn Lại</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center' }}>Tồn Kệ</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center' }}>Cấp Độ Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {criticalAndWarningBatches.map(b => {
                          const isCritical = b.status === 'CRITICAL';
                          const isChecked = !!checkedBatches[b.id];

                          return (
                            <tr
                              key={b.id}
                              style={{
                                borderBottom: '1px solid var(--border-subtle)',
                                background: isChecked ? 'transparent' : 'rgba(239, 68, 68, 0.04)'
                              }}
                            >
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleCheckBatch(b.id)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                                />
                              </td>
                              <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                {b.batchCode}
                              </td>
                              <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-main)' }}>
                                {b.productName}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: 'monospace' }}>
                                {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('vi-VN') : '---'}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: isCritical ? 'var(--critical-red)' : 'var(--warning-amber)' }}>
                                {b.daysLeft} ngày
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>
                                {b.currentQuantity || b.quantity}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                <span style={{
                                  fontSize: '0.74rem',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontWeight: 700,
                                  background: isCritical ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                  color: isCritical ? 'var(--critical-red)' : 'var(--warning-amber)',
                                  border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                                }}>
                                  {isCritical ? '🔴 Vùng Đỏ (≤3 ngày)' : '🟡 Vùng Vàng'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button
                  onClick={() => setCurrentStep(1)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Quay lại Bước 1</span>
                </button>

                <button
                  onClick={() => setCurrentStep(3)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                  }}
                >
                  <span>Xác nhận rà soát date & Sang Bước 3</span>
                  <ArrowRight size={16} />
                </button>
              </div>

            </div>
          )}

          {/* BƯỚC 3: HÀNG HỦY TRONG KHU CÁCH LY CHỜ TIÊU HỦY */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Kiểm Kê Thùng Hàng Chờ Tiêu Hủy Tại Khu Cách Ly
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Các mặt hàng hỏng, rách bao bì, quá date phát sinh trong ca đã được tách riêng vào thùng lưu trữ cách ly chờ thẩm định.
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--critical-red)', fontFamily: 'monospace' }}>
                      {totalWasteLoss.toLocaleString('vi-VN')} ₫
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Tổng vốn hao hụt dự kiến
                    </div>
                  </div>
                </div>

                {pendingDisposals.length === 0 ? (
                  <div style={{
                    padding: '32px',
                    textAlign: 'center',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px dashed var(--border-subtle)'
                  }}>
                    <CheckCircle2 size={32} color="var(--safe-green)" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Thùng khu cách ly trống</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Không có sản phẩm nào đang chờ tiêu hủy phát sinh trong ca này.
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '10px 14px' }}>Mã Phiếu Hủy</th>
                          <th style={{ padding: '10px 14px' }}>Mã Lô</th>
                          <th style={{ padding: '10px 14px' }}>Sản Phẩm</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center' }}>Số Lượng Hủy</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Vốn Thất Thoát</th>
                          <th style={{ padding: '10px 14px' }}>Lý Do Hư Hỏng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingDisposals.map(d => (
                          <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-muted)' }}>
                              #{d.id}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'var(--accent-primary)', fontWeight: 600 }}>
                              {d.batchCode}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-main)' }}>
                              {d.productName}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: 'var(--critical-red)' }}>
                              {d.quantityDisposed || d.quantity}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                              {(d.costLoss || d.totalCost || 0).toLocaleString('vi-VN')} ₫
                            </td>
                            <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                              {d.reason || 'Hết hạn sử dụng / Hỏng hóc bao bì'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Hộp xác nhận điện tử */}
                <div style={{
                  marginTop: '16px',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <input
                    type="checkbox"
                    id="confirmWasteCheckbox"
                    checked={wasteConfirmed}
                    onChange={(e) => setWasteConfirmed(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                  />
                  <label htmlFor="confirmWasteCheckbox" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}>
                    Tôi xác nhận đã kiểm đếm thực tế số lượng hàng hỏng ({totalWasteQuantity} đơn vị) tại khu cách ly và khớp với số liệu ghi nhận trên phần mềm.
                  </label>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button
                  onClick={() => setCurrentStep(2)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Quay lại Bước 2</span>
                </button>

                <button
                  onClick={() => setCurrentStep(4)}
                  disabled={!wasteConfirmed}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: wasteConfirmed ? 'var(--accent-primary)' : 'var(--text-muted)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: wasteConfirmed ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                  }}
                >
                  <span>Chuyển sang Bước 4 (Ký xác nhận)</span>
                  <ArrowRight size={16} />
                </button>
              </div>

            </div>
          )}

          {/* BƯỚC 4: KÝ BIÊN BẢN BÀN GIAO ĐIỆN TỬ & LƯU VẾT KIỂM TOÁN */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Ký Xác Nhận Biên Bản Bàn Giao Ca Điện Tử
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Sau khi bấm ký, biên bản bàn giao sẽ được lưu trữ bất biến vào hệ thống Nhật ký Kiểm toán (AuditLogs).
                  </p>
                </div>

                {/* Tóm tắt nhanh thông số bàn giao */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ca làm việc:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.92rem', marginTop: '2px' }}>
                      {shiftType === 'MORNING' ? 'Ca Sáng (06:00 - 14:00)' : 'Ca Chiều (14:00 - 22:00)'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tiền két đếm được:</span>
                    <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.92rem', marginTop: '2px', fontFamily: 'monospace' }}>
                      {actualCashTotal.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chênh lệch két:</span>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      marginTop: '2px',
                      fontFamily: 'monospace',
                      color: cashDifference === 0 ? 'var(--safe-green)' : cashDifference < 0 ? 'var(--critical-red)' : 'var(--warning-amber)'
                    }}>
                      {cashDifference > 0 ? `+${cashDifference.toLocaleString('vi-VN')}` : `${cashDifference.toLocaleString('vi-VN')}`} ₫
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lô cận date theo dõi:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.92rem', marginTop: '2px' }}>
                      {criticalAndWarningBatches.length} Lô (Đỏ + Vàng)
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hàng hủy khu cách ly:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.92rem', marginTop: '2px' }}>
                      {totalWasteQuantity} Đơn vị
                    </div>
                  </div>
                </div>

                {/* Form thông tin 2 nhân viên bàn giao */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Người Bàn Giao (Nhân viên ca trước) <span style={{ color: 'var(--critical-red)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      list="active-staff-handover"
                      value={handoverPerson}
                      onChange={(e) => setHandoverPerson(e.target.value)}
                      placeholder="Họ và tên nhân viên giao ca..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <datalist id="active-staff-handover">
                      {activeStaffList.map(s => (
                        <option key={s.id} value={`${s.fullName} (${s.roleCode})`} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Người Tiếp Nhận (Nhân viên ca sau) <span style={{ color: 'var(--critical-red)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      list="active-staff-receiver"
                      value={receiverPerson}
                      onChange={(e) => setReceiverPerson(e.target.value)}
                      placeholder="Họ và tên nhân viên nhận ca..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <datalist id="active-staff-receiver">
                      {activeStaffList.map(s => (
                        <option key={s.id} value={`${s.fullName} (${s.roleCode})`} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Ghi chú bàn giao ca */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                    Ghi Chú & Tồn Đọng Ca Làm Việc (Nếu có)
                  </label>
                  <textarea
                    rows={3}
                    value={handoverNotes}
                    onChange={(e) => setHandoverNotes(e.target.value)}
                    placeholder="Ví dụ: Máy in bill tại quầy POS 1 gần hết giấy, két tiền thừa 2 tờ 20k do khách không lấy tiền thối, lô sữa LOT-01 cần dán thêm tem giảm giá..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Hộp cam kết trách nhiệm & Chế tài ca trực */}
                <div style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '0.82rem',
                  color: 'var(--text-main)',
                  lineHeight: 1.55
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>
                    ⚖️ Cam kết trách nhiệm & Quy định chế tài ca trực:
                  </div>
                  <ul style={{ margin: '0 0 6px', paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    <li><strong>Sơ suất để lọt hàng hết hạn bán cho khách:</strong> Khiển trách, bồi thường 100% đơn hàng.</li>
                    <li><strong>Không thực hiện đảo lô cận date ra mặt tiền:</strong> Trừ điểm chuyên cần tháng.</li>
                    <li><strong>Tự ý vứt bỏ hàng không lập phiếu trên phần mềm:</strong> Bồi thường 100% giá trị vốn thất thoát.</li>
                  </ul>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Hai bên đã cùng đối soát tiền két, rà soát hạn dùng và kiểm kê khu cách ly. Sau khi ký số, trách nhiệm quản lý cửa hàng thuộc về nhân viên tiếp nhận ca.
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', color: complianceAgreed ? 'var(--safe-green)' : 'var(--critical-red)' }}>
                    <input
                      type="checkbox"
                      checked={complianceAgreed}
                      onChange={(e) => setComplianceAgreed(e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <span>Xác nhận: Hai nhân viên ca trực đã rà soát kỹ lưỡng và cam kết tuân thủ 3 chế tài kỷ luật ca trực</span>
                  </label>
                </div>
              </div>

              {/* Navigation & Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Quay lại Bước 3</span>
                </button>

                <button
                  onClick={handleSubmitHandover}
                  disabled={isSubmitting || !complianceAgreed}
                  style={{
                    padding: '11px 26px',
                    borderRadius: '8px',
                    border: 'none',
                    background: (!complianceAgreed || isSubmitting) ? '#64748b' : 'var(--safe-green)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: (!complianceAgreed || isSubmitting) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>Đang ký số & lưu vết...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} />
                      <span>KÝ XÁC NHẬN BÀN GIAO CA ĐIỆN TỬ</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </>
      ) : (
        /* TAB LỊCH SỬ BIÊN BẢN BÀN GIAO CA (MỤC 15) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* 3 KPI Cards Thống Kê Nhanh */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              padding: '16px 18px',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Tổng Phiên Ca Bàn Giao
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {historyStats.total} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>phiên</span>
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              padding: '16px 18px',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--safe-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Khớp Két Tuyệt Đối (0 ₫)
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--safe-green)', marginTop: '2px' }}>
                  {historyStats.balanced} / {historyStats.total} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>phiên</span>
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              padding: '16px 18px',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(234, 179, 8, 0.12)',
                color: 'var(--warning-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarSign size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Doanh Số POS Bàn Giao
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '2px', fontFamily: 'monospace' }}>
                  {historyStats.totalRevenue.toLocaleString('vi-VN')} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>₫</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thanh Công Cụ Tìm Kiếm & Lọc */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            padding: '14px 18px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Tìm theo tên nhân viên, mã SH, ghi chú..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '32px',
                    paddingRight: '12px',
                    height: '34px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Lọc loại ca */}
              <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setHistoryShiftFilter('ALL')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: historyShiftFilter === 'ALL' ? 'var(--accent-primary)' : 'transparent',
                    color: historyShiftFilter === 'ALL' ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Tất Cả Ca
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryShiftFilter('MORNING')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: historyShiftFilter === 'MORNING' ? 'var(--accent-primary)' : 'transparent',
                    color: historyShiftFilter === 'MORNING' ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Ca Sáng
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryShiftFilter('AFTERNOON')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: historyShiftFilter === 'AFTERNOON' ? 'var(--accent-primary)' : 'transparent',
                    color: historyShiftFilter === 'AFTERNOON' ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Ca Chiều
                </button>
              </div>
            </div>

            <button
              onClick={loadHistory}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <RotateCw size={14} />
              <span>Làm mới</span>
            </button>
          </div>

          {/* Bảng Danh Sách Ca Trực */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {isLoadingHistory ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ width: '24px', height: '24px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <span>Đang tải nhật ký kiểm toán ca trực từ CSDL...</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <FileText size={40} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                  Không tìm thấy biên bản bàn giao nào
                </div>
                <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                  {historySearch ? 'Không có ca trực nào khớp với từ khóa tìm kiếm.' : 'Chưa có phiên ca nào được chốt trong hệ thống.'}
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 14px' }}>Mã Ca</th>
                      <th style={{ padding: '12px 14px' }}>Ca Trực & Giờ Chốt</th>
                      <th style={{ padding: '12px 14px' }}>Nhân Viên (Giao ➔ Nhận)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Doanh Số POS</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Tiền Két Thực Kiểm</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Độ Lệch Két</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Lô Cận / Hàng Hủy</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((item) => {
                      const isMorning = item.shiftType === 'MORNING';
                      const isBalanced = item.cashDifference === 0;
                      const isSurplus = item.cashDifference > 0;
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}>
                          <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)' }}>
                            {item.handoverCode}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                padding: '2px 7px',
                                borderRadius: '5px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: isMorning ? 'rgba(234, 179, 8, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                                color: isMorning ? '#b45309' : 'var(--accent-primary)'
                              }}>
                                {isMorning ? '☀️ Ca Sáng' : '🌙 Ca Chiều'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              {new Date(item.createdAt).toLocaleString('vi-VN')}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {item.handoverPerson}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <span>➔</span> <span>{item.receiverPerson}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                            {item.posSalesAmount ? item.posSalesAmount.toLocaleString('vi-VN') + ' ₫' : '—'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)' }}>
                            {item.cashInDrawer ? item.cashInDrawer.toLocaleString('vi-VN') + ' ₫' : '—'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: isBalanced ? 'rgba(16, 185, 129, 0.1)' : isSurplus ? 'rgba(234, 179, 8, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: isBalanced ? 'var(--safe-green)' : isSurplus ? '#b45309' : 'var(--critical-red)'
                            }}>
                              {isBalanced ? '0 ₫ (Khớp)' : `${isSurplus ? '+' : ''}${item.cashDifference.toLocaleString('vi-VN')} ₫`}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ padding: '1px 5px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--critical-red)', fontSize: '0.72rem', fontWeight: 700 }} title="Lô Đỏ nguy kịch">
                                {item.redBatchesCount || 0} Đỏ
                              </span>
                              <span style={{ padding: '1px 5px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.1)', color: '#b45309', fontSize: '0.72rem', fontWeight: 700 }} title="Lô Vàng cảnh báo">
                                {item.yellowBatchesCount || 0} Vàng
                              </span>
                              {item.wasteCount > 0 && (
                                <span style={{ padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700 }} title="Hàng hủy">
                                  {item.wasteCount} Hủy
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedHandoverForPrint(item)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--accent-primary)',
                                background: 'rgba(99, 102, 241, 0.08)',
                                color: 'var(--accent-primary)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                              title="Xem chi tiết và in biên bản bàn giao ca này"
                            >
                              <Printer size={13} />
                              <span>In Biên Bản</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL IN BIÊN BẢN BÀN GIAO CA ĐIỆN TỬ (CHẾ ĐỘ IN A5 / K80 CHUẨN MỰC) */}
      {/* ============================================================================== */}
      {(showPrintModal || selectedHandoverForPrint) && (() => {
        const pData = selectedHandoverForPrint || handoverSuccessResult;
        if (!pData) return null;
        const isBal = pData.cashDifference === 0;
        const isSur = pData.cashDifference > 0;

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '92vh',
              overflowY: 'auto',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              {/* Header Modal Bar */}
              <div style={{
                padding: '16px 22px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
                borderTopLeftRadius: '16px',
                borderTopRightRight: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={22} color="#059669" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      Biên Bản Bàn Giao Ca Trực & Đối Soát Két
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Xác thực số hóa • Lưu vết kiểm toán AuditLogs
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrintModal(false);
                    setSelectedHandoverForPrint(null);
                    if (handoverSuccessResult) handleResetForm();
                  }}
                  style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* KHUNG BIÊN BẢN IN CHÍNH THỨC */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.86rem' }}>
                
                {/* Header đơn vị */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.02em', color: '#0f172a' }}>
                    TRƯỜNG ĐẠI HỌC LẠC HỒNG (LHU)
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#4338ca', marginTop: '2px' }}>
                    CỬA HÀNG BÁN LẺ THỰC PHẨM TINH GỌN (LHU MART - CO.OP SMILE)
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px' }}>
                    Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Tỉnh Đồng Nai
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    BIÊN BẢN BÀN GIAO CA LÀM VIỆC
                  </div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#475569', marginTop: '3px' }}>
                    Số: <strong>{pData.handoverCode}</strong> • Ngày lập: {new Date(pData.createdAt || pData.timestamp).toLocaleString('vi-VN')}
                  </div>
                </div>

                {/* Phần 1: Thông tin nhân sự giao nhận ca */}
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    I. Thông Tin Phiên Làm Việc
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.825rem' }}>
                    <div>Ca trực: <strong>{pData.shiftLabel}</strong></div>
                    <div>Mã phiên: <strong style={{ fontFamily: 'monospace' }}>{pData.handoverCode}</strong></div>
                    <div>Nhân viên giao ca: <strong>{pData.handoverPerson}</strong></div>
                    <div>Nhân viên nhận ca: <strong>{pData.receiverPerson}</strong></div>
                  </div>
                </div>

                {/* Phần 2: Đối soát tài chính tiền két */}
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                    II. Đối Soát Doanh Thu & Tiền Két POS
                  </div>
                  <table style={{ width: '100%', fontSize: '0.825rem', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px dashed #cbd5e1' }}>
                        <td style={{ padding: '5px 0', color: '#475569' }}>1. Doanh số ghi nhận hệ thống POS:</td>
                        <td style={{ padding: '5px 0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                          {Number(pData.posSalesAmount).toLocaleString('vi-VN')} ₫
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px dashed #cbd5e1' }}>
                        <td style={{ padding: '5px 0', color: '#475569' }}>2. Tiền mặt kiểm đếm thực tế trong két:</td>
                        <td style={{ padding: '5px 0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#4338ca' }}>
                          {Number(pData.cashInDrawer).toLocaleString('vi-VN')} ₫
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', fontWeight: 700, color: '#0f172a' }}>3. Chênh lệch kiểm kê (2 - 1):</td>
                        <td style={{
                          padding: '6px 0',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          fontWeight: 900,
                          fontSize: '0.9rem',
                          color: isBal ? '#059669' : isSur ? '#d97706' : '#dc2626'
                        }}>
                          {isBal ? '0 ₫ (Khớp tuyệt đối)' : `${isSur ? '+' : ''}${Number(pData.cashDifference).toLocaleString('vi-VN')} ₫ (${isSur ? 'Thừa' : 'Thiếu'})`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Phần 3: Kiểm soát hạn sử dụng & Hàng hủy */}
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    III. Kiểm Soát Date & Hàng Hủy
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.825rem' }}>
                    <div>Lô Vùng Đỏ (≤ 3 ngày): <strong style={{ color: '#dc2626' }}>{pData.redBatchesCount || 0} Lô</strong></div>
                    <div>Lô Vùng Vàng (Cận date): <strong style={{ color: '#d97706' }}>{pData.yellowBatchesCount || 0} Lô</strong></div>
                    <div>Hàng khu cách ly chờ hủy: <strong style={{ color: '#475569' }}>{pData.wasteCount || 0} Đơn vị</strong></div>
                    <div>Trạng thái FEFO: <strong style={{ color: '#059669' }}>Đã đảo kệ mặt tiền</strong></div>
                  </div>
                  {pData.notes && (
                    <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', fontSize: '0.78rem', color: '#475569' }}>
                      <strong>Ghi chú tồn đọng:</strong> {pData.notes}
                    </div>
                  )}
                </div>

                {/* Phần 4: Quy định trách nhiệm & 3 Chế tài kỷ luật ca trực */}
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.76rem', color: '#334155', lineHeight: 1.55 }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    IV. Cam Kết Trách Nhiệm & 3 Chế Tài Kỷ Luật
                  </div>
                  <div>• <strong>Sơ suất để lọt hàng hết hạn bán cho khách:</strong> Khiển trách, bồi thường 100% giá trị đơn hàng.</div>
                  <div>• <strong>Không thực hiện đảo lô cận date ra mặt tiền:</strong> Trừ điểm chuyên cần tháng của nhân viên ca trực.</div>
                  <div>• <strong>Tự ý vứt bỏ hàng không lập phiếu trên phần mềm:</strong> Bồi thường 100% giá trị vốn thất thoát.</div>
                  <div style={{ marginTop: '5px', fontStyle: 'italic', color: '#64748b', fontSize: '0.72rem' }}>
                    Hai bên giao - nhận xác nhận đã thực hiện đầy đủ quy trình 4 bước và cam kết chịu trách nhiệm theo đúng 3 chế tài trên.
                  </div>
                </div>

                {/* Phần 5: Chữ ký điện tử 3 bên */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  textAlign: 'center',
                  paddingTop: '10px',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <div style={{ padding: '6px', background: '#f8fafc', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                      NGƯỜI GIAO CA
                    </div>
                    <div style={{ margin: '14px 0 6px', color: '#059669', fontSize: '0.72rem', fontWeight: 700 }}>
                      [ĐÃ KÝ SỐ]
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>
                      {pData.handoverPerson}
                    </div>
                  </div>

                  <div style={{ padding: '6px', background: '#f8fafc', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                      NGƯỜI NHẬN CA
                    </div>
                    <div style={{ margin: '14px 0 6px', color: '#059669', fontSize: '0.72rem', fontWeight: 700 }}>
                      [ĐÃ TIẾP NHẬN]
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>
                      {pData.receiverPerson}
                    </div>
                  </div>

                  <div style={{ padding: '6px', background: '#f8fafc', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                      CỬA HÀNG TRƯỞNG
                    </div>
                    <div style={{ margin: '14px 0 6px', color: '#4338ca', fontSize: '0.72rem', fontWeight: 700 }}>
                      [ĐÃ PHÊ DUYỆT]
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>
                      ThS. Lê Minh Nhật
                    </div>
                  </div>
                </div>

                <div style={{
                  textAlign: 'center',
                  fontSize: '0.7rem',
                  color: '#64748b',
                  borderTop: '1px dashed #cbd5e1',
                  paddingTop: '8px'
                }}>
                  Hệ thống Quản trị Chuỗi cung ứng Chống lãng phí • LHU Mart • Lưu vết AuditLogs: {pData.ipAddress || '127.0.0.1'}
                </div>

                {/* Thanh Nút Thao Tác In / Đóng */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      border: '1px solid #4338ca',
                      background: '#4338ca',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 6px -1px rgba(67, 56, 202, 0.3)'
                    }}
                  >
                    <Printer size={16} />
                    <span>In Biên Bản Ngay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPrintModal(false);
                      setSelectedHandoverForPrint(null);
                      if (handoverSuccessResult) handleResetForm();
                    }}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#475569',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Đóng
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
