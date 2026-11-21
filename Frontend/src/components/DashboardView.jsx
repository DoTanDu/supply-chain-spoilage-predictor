// src/components/DashboardView.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  ArrowLeftRight,
  AlertTriangle,
  Package,
  DollarSign,
  TrendingDown,
  Clock,
  CheckCircle2,
  Building2,
  ArrowRight,
  Zap,
  RotateCw,
  Trash2,
  FileCheck,
  Sparkles,
  BarChart3
} from 'lucide-react';
import {
  fetchAiSupplyChainMatrix,
  fetchRopForecast,
  fetchPurchaseOrders,
  fetchStockTransfers
} from '../api';
import { canAccessPage, normalizeRole } from '../utils/pagePermissions';

function getMonotoneSplinePath(points, baselineY) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  if (points.length === 2) return `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)},${points[1].y.toFixed(1)}`;

  const n = points.length;
  const dx = [];
  const dy = [];
  const m = [];
  for (let i = 0; i < n - 1; i++) {
    const deltaX = points[i + 1].x - points[i].x;
    const deltaY = points[i + 1].y - points[i].y;
    dx.push(deltaX);
    dy.push(deltaY);
    m.push(deltaY / (deltaX || 1e-6));
  }

  const d = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) d.push(0);
    else d.push((3 * dx[i - 1] + 3 * dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]));
  }
  d.push(m[n - 2]);

  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(dy[i]) < 1e-6) {
      d[i] = 0;
      d[i + 1] = 0;
    } else {
      const a = d[i] / m[i];
      const b = d[i + 1] / m[i];
      const h = Math.hypot(a, b);
      if (h > 3) {
        const factor = 3 / h;
        d[i] = factor * a * m[i];
        d[i + 1] = factor * b * m[i];
      }
    }
  }

  let path = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const span = dx[i] / 3;
    const cp1x = p1.x + span;
    const cp1y = Math.min(baselineY, Math.max(10, p1.y + d[i] * span));
    const cp2x = p2.x - span;
    const cp2y = Math.min(baselineY, Math.max(10, p2.y - d[i + 1] * span));
    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return path;
}

export default function DashboardView({
  batches = [],
  products = [],
  disposals = [],
  liveStats,
  setActiveTab,
  onQuickDiscount,
  onRotateShelf,
  currentUser = null,
  currentRole = 'STORE_MANAGER',
  isAdmin = false,
  selectedStoreId = 'ALL',
  onSelectStore,
  storesList = [],
  weather = { condition: 'NORMAL', isHoliday: false },
  isSingleStore = false
}) {
  const roleCode = normalizeRole(currentRole || currentUser?.roleCode);
  const canApprove = roleCode === 'ADMIN' || roleCode === 'STORE_MANAGER';

  const [actionTab, setActionTab] = useState('SPOILAGE');
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState(null);
  const [aiForecastSummary, setAiForecastSummary] = useState(null);
  const [aiMatrix, setAiMatrix] = useState(null);
  const [poList, setPoList] = useState([]);
  const [transferList, setTransferList] = useState([]);
  const [dashFeedback, setDashFeedback] = useState(null);

  useEffect(() => {
    let mounted = true;
    const wCond = weather?.condition || 'NORMAL';
    const isHol = Boolean(weather?.isHoliday);

    Promise.all([
      fetchRopForecast(wCond, isHol, selectedStoreId).catch(() => null),
      (!isSingleStore && (!currentUser || canAccessPage(currentUser, 'stock-transfer', isSingleStore)))
        ? fetchAiSupplyChainMatrix(wCond, isHol).catch(() => null)
        : Promise.resolve(null),
      fetchPurchaseOrders(selectedStoreId).catch(() => null),
      !isSingleStore ? fetchStockTransfers('ALL').catch(() => null) : Promise.resolve(null)
    ]).then(([ropRes, matRes, poRes, trfRes]) => {
      if (!mounted) return;
      if (ropRes && ropRes.success) {
        const list = ropRes.allForecasts || ropRes.data || [];
        const total7d = list.reduce((s, r) => s + Number(r.predictedSales7d || 0), 0);
        const totalLower = list.reduce((s, r) => s + Number(r.lowerBound || 0), 0);
        const totalUpper = list.reduce((s, r) => s + Number(r.upperBound || 0), 0);
        const totalSuggestedOrder = list.reduce((s, r) => s + Number(r.netSuggestedOrderQuantity ?? r.suggestedOrderQuantity ?? 0), 0);
        const totalSpoilRiskQty = list.reduce((s, r) => s + Number(r.spoilageRiskQty || 0), 0);
        setAiForecastSummary({
          ...ropRes.summary,
          total7d,
          totalLower,
          totalUpper,
          totalSuggestedOrder,
          totalSpoilRiskQty
        });
      }
      if (matRes && matRes.success) setAiMatrix(matRes.data);
      if (poRes && Array.isArray(poRes.data)) setPoList(poRes.data);
      if (trfRes && Array.isArray(trfRes.data)) setTransferList(trfRes.data);
    });

    return () => { mounted = false; };
  }, [selectedStoreId, weather?.condition, weather?.isHoliday, isSingleStore]);

  // 1. TÁCH BẠCH SỐ LIỆU THỰC TẾ
  const kpis = liveStats?.kpiMetrics || {};
  const availableBatches = batches.filter(b => b.status !== 'EXPIRED' && b.alertColor !== 'EXPIRED' && (b.currentQuantity ?? b.quantity ?? 0) > 0);
  const totalStockUnits = availableBatches.reduce((sum, b) => sum + Number(b.currentQuantity ?? b.quantity ?? 0), 0);
  const totalInventoryCost = Number(kpis.totalInventoryCost ?? availableBatches.reduce((s, b) => s + (Number(b.currentQuantity ?? b.quantity ?? 0) * Number(b.importPrice ?? 0)), 0));
  const criticalBatches = batches.filter(b => (b.alertColor === 'RED' || b.status === 'CRITICAL') && (b.currentQuantity ?? b.quantity ?? 0) > 0);
  const warningBatches = batches.filter(b => (b.alertColor === 'YELLOW' || b.status === 'WARNING') && (b.currentQuantity ?? b.quantity ?? 0) > 0);
  const safeBatches = batches.filter(b => (b.alertColor === 'GREEN' || b.status === 'SAFE') && (b.currentQuantity ?? b.quantity ?? 0) > 0);
  const expiredBatches = batches.filter(b => (b.alertColor === 'EXPIRED' || b.status === 'EXPIRED') && (b.currentQuantity ?? b.quantity ?? 0) > 0);

  const atRiskCost = Number(kpis.atRiskCost ?? [...criticalBatches, ...warningBatches].reduce((s, b) => s + (Number(b.currentQuantity ?? b.quantity ?? 0) * Number(b.importPrice ?? 0)), 0));
  const totalDisposalCost = Number(kpis.totalDisposalCost ?? disposals.reduce((s, d) => s + Number(d.totalLoss || d.costLoss || 0), 0));
  const spoilageRate = Number(kpis.spoilageRatePercent ?? 0);
  const todayRevenue = Number(kpis.todayTotalRevenue ?? 0);
  const cumulativeRevenue = Number(kpis.cumulativeSalesRevenue ?? 0);
  const rescuedValue = Number(kpis.rescuedFinancialValue ?? 0);

  // 2. SỐ LIỆU TRẠNG THÁI PHÊ DUYỆT
  const pendingPoCount = poList.filter(o => ['DRAFT', 'PENDING'].includes(String(o.status).toUpperCase())).length;
  const activePoCount = poList.filter(o => ['APPROVED', 'SUBMITTED', 'SHIPPING'].includes(String(o.status).toUpperCase())).length;
  const pendingTransfers = transferList.filter(t => ['PROPOSED', 'PENDING'].includes(String(t.status).toUpperCase()));
  const inTransitTransfers = transferList.filter(t => ['APPROVED', 'IN_TRANSIT'].includes(String(t.status).toUpperCase()));
  const pendingDisposals = disposals.filter(d => String(d.status).toUpperCase() === 'PENDING');

  const orToolsProposals = aiMatrix?.orToolsTransferProposals || [];
  const crossStoreBenchmark = liveStats?.crossStoreBenchmark || [];

  // 3. DONUT CHART PHÂN BỔ LÔ HÀNG
  const rawTotalBatches = safeBatches.length + warningBatches.length + criticalBatches.length + expiredBatches.length;
  const totalActiveBatches = Math.max(1, rawTotalBatches);
  const safePct = rawTotalBatches === 0 ? 0 : Math.round((safeBatches.length / totalActiveBatches) * 100);
  const warnPct = rawTotalBatches === 0 ? 0 : Math.round((warningBatches.length / totalActiveBatches) * 100);
  const critPct = rawTotalBatches === 0 ? 0 : Math.round((criticalBatches.length / totalActiveBatches) * 100);
  const expPct = rawTotalBatches === 0 ? 0 : Math.max(0, 100 - safePct - warnPct - critPct);
  const donutSlices = [
    { id: 'safe', label: 'Vùng Xanh (An toàn)', count: safeBatches.length, pct: safePct, color: '#4f46e5' },
    { id: 'warning', label: 'Vùng Vàng (Cảnh báo)', count: warningBatches.length, pct: warnPct, color: '#d97706' },
    { id: 'critical', label: 'Vùng Đỏ (≤ 3 ngày)', count: criticalBatches.length, pct: critPct, color: '#e11d48' },
    { id: 'expired', label: 'Quá hạn (Khóa)', count: expiredBatches.length, pct: expPct, color: '#7e22ce' }
  ];
  const radius = 62;
  const circumference = 2 * Math.PI * radius;

  // 4. BIỂU ĐỒ XU HƯỚNG 14 NGÀY
  const trendData = useMemo(() => {
    if (liveStats?.trend14Days && Array.isArray(liveStats.trend14Days) && liveStats.trend14Days.length > 0) {
      return liveStats.trend14Days;
    }
    const days = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      days.push({
        date: d.toISOString().slice(0, 10),
        displayDate: `${dd}/${mm}`,
        dayOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()],
        salesRevenue: 0,
        spoilageCost: 0
      });
    }
    return days;
  }, [liveStats?.trend14Days]);

  const chartMaxVal = useMemo(() => {
    const raw = Math.max(1000000, ...trendData.map(d => Math.max(Number(d.salesRevenue || 0), Number(d.spoilageCost || 0) * 1.5)));
    return Math.ceil(raw / 1000000) * 1000000;
  }, [trendData]);

  const { salesLineD, salesAreaD, spoilLineD, chartPoints } = useMemo(() => {
    const totalSlots = Math.max(1, trendData.length);
    const baselineY = 230;
    const chartH = 195;
    const sPts = trendData.map((d, i) => ({
      x: ((i + 0.5) / totalSlots) * 1000,
      y: baselineY - (Number(d.salesRevenue || 0) / chartMaxVal) * chartH
    }));
    const spPts = trendData.map((d, i) => ({
      x: ((i + 0.5) / totalSlots) * 1000,
      y: baselineY - (Number(d.spoilageCost || 0) / chartMaxVal) * chartH
    }));
    const sLine = getMonotoneSplinePath(sPts, baselineY);
    const sArea = sPts.length > 0 ? `${sLine} L ${sPts[sPts.length - 1].x.toFixed(1)},${baselineY} L ${sPts[0].x.toFixed(1)},${baselineY} Z` : '';
    const spLine = getMonotoneSplinePath(spPts, baselineY);
    const pts = trendData.map((d, i) => ({
      index: i,
      date: d.displayDate,
      dayOfWeek: d.dayOfWeek,
      leftPct: ((i + 0.5) / totalSlots) * 100,
      slotLeftPct: (i / totalSlots) * 100,
      slotWidthPct: (1 / totalSlots) * 100,
      salesRevenue: Number(d.salesRevenue || 0),
      spoilageCost: Number(d.spoilageCost || 0)
    }));
    return { salesLineD: sLine, salesAreaD: sArea, spoilLineD: spLine, chartPoints: pts };
  }, [trendData, chartMaxVal]);

  const urgentSpoilageList = useMemo(() => {
    return [...criticalBatches, ...warningBatches]
      .sort((a, b) => Number(a.daysLeft ?? 99) - Number(b.daysLeft ?? 99))
      .slice(0, 5);
  }, [criticalBatches, warningBatches]);

  const ropAlerts = liveStats?.actionBoard?.ropAlertItems || [];

  const scopeTitle = selectedStoreId === 'ALL'
    ? 'Tổng quan Toàn chuỗi SmartSupply AI'
    : (storesList.find(s => String(s.id) === String(selectedStoreId))?.storeName || `Chi nhánh #${selectedStoreId}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Page Header */}
      {dashFeedback && (
        <div
          role="status"
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: dashFeedback.type === 'error' ? 'var(--danger-red-bg)' : 'var(--safe-green-bg)',
            color: dashFeedback.type === 'error' ? 'var(--danger-red-light)' : 'var(--safe-green-light)',
            border: `1px solid ${dashFeedback.type === 'error' ? 'var(--danger-red-border)' : 'var(--safe-green-border)'}`,
            fontSize: '0.84rem',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{dashFeedback.text}</span>
          <button type="button" onClick={() => setDashFeedback(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 800 }}>×</button>
        </div>
      )}
      <div className="ss-page-header">
        <div>
          <h1 className="ss-page-title">{scopeTitle}</h1>
        </div>
      </div>

      {/* 4 Thẻ KPI Điều hành Tinh gọn */}
      <div className="ss-kpi-grid">
        {/* 1. Doanh số bán lẻ */}
        <article className="ss-card ss-card-pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Doanh số bán lẻ</span>
            <DollarSign size={16} color="var(--primary)" aria-hidden="true" />
          </div>
          <div>
            <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {cumulativeRevenue.toLocaleString('vi-VN')} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>đ</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              Hôm nay: <strong className="num-tabular" style={{ color: 'var(--text-main)' }}>{todayRevenue.toLocaleString('vi-VN')} đ</strong>
            </div>
          </div>
          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '0.76rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {aiForecastSummary && aiForecastSummary.total7d > 0 ? (
                <>Dự báo 7d: <strong className="num-tabular" style={{ color: 'var(--primary)' }}>{aiForecastSummary.total7d.toLocaleString('vi-VN')} ĐV</strong></>
              ) : (
                <>Vốn tồn kệ: <strong className="num-tabular" style={{ color: 'var(--text-main)' }}>{totalInventoryCost.toLocaleString('vi-VN')} đ</strong></>
              )}
            </span>
            <button type="button" onClick={() => setActiveTab('ai-forecast')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', flexShrink: 0, padding: 0 }}>
              Chi tiết <ArrowRight size={12} />
            </button>
          </div>
        </article>

        {/* 2. Đề xuất nhập hàng */}
        <article className="ss-card ss-card-pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Đề xuất nhập hàng</span>
            <ShoppingBag size={16} color="var(--accent-blue)" aria-hidden="true" />
          </div>
          <div>
            <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {aiForecastSummary?.reorderCount ?? ropAlerts.length} <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>SKU cần nhập</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              Khuyến nghị đặt: <strong className="num-tabular" style={{ color: 'var(--accent-blue-light)' }}>{(aiForecastSummary?.totalSuggestedOrder || 0).toLocaleString('vi-VN')} ĐV</strong>
            </div>
          </div>
          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '0.76rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              <strong>{pendingPoCount}</strong> PO chờ duyệt · <strong>{activePoCount}</strong> đang giao
            </span>
            <button type="button" onClick={() => setActiveTab('smart-ordering')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', flexShrink: 0, padding: 0 }}>
              Duyệt PO <ArrowRight size={12} />
            </button>
          </div>
        </article>

        {/* 3. Điều phối liên chi nhánh */}
        <article className="ss-card ss-card-pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {isSingleStore ? 'Tồn kho cửa hàng' : 'Điều phối chi nhánh'}
            </span>
            <ArrowLeftRight size={16} color="var(--warning-yellow)" aria-hidden="true" />
          </div>
          <div>
            {isSingleStore ? (
              <>
                <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {totalStockUnits.toLocaleString('vi-VN')} <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>ĐV</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Cửa hàng độc lập
                </div>
              </>
            ) : (
              <>
                <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {orToolsProposals.length} <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>đề xuất</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Chờ duyệt: <strong style={{ color: 'var(--warning-yellow-light)' }}>{pendingTransfers.length}</strong> · Đang chuyển: <strong>{inTransitTransfers.length}</strong>
                </div>
              </>
            )}
          </div>
          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '0.76rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isSingleStore ? 'Chế độ đơn lẻ' : `Cân bằng ${storesList.length || 3} chi nhánh`}
            </span>
            {!isSingleStore && (
              <button type="button" onClick={() => setActiveTab('stock-transfer')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', flexShrink: 0, padding: 0 }}>
                Điều phối <ArrowRight size={12} />
              </button>
            )}
          </div>
        </article>

        {/* 4. Vốn rủi ro cận hạn */}
        <article className="ss-card ss-card-pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Vốn rủi ro cận hạn</span>
            <AlertTriangle size={16} color={criticalBatches.length > 0 ? 'var(--danger-red)' : 'var(--safe-green)'} aria-hidden="true" />
          </div>
          <div>
            <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: criticalBatches.length > 0 ? 'var(--danger-red-light)' : 'var(--text-main)' }}>
              {atRiskCost.toLocaleString('vi-VN')} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>đ</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              <strong style={{ color: 'var(--danger-red-light)' }}>{criticalBatches.length} Đỏ</strong> · <strong style={{ color: 'var(--warning-yellow-light)' }}>{warningBatches.length} Vàng</strong> · <strong style={{ color: 'var(--expired-purple)' }}>{expiredBatches.length} Quá hạn</strong>
            </div>
          </div>
          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '0.76rem' }}>
            <span style={{ color: 'var(--text-muted)' }} title={`Tổng giá trị tiêu hủy đã chốt: ${totalDisposalCost.toLocaleString('vi-VN')} đ`}>
              Hao hụt: <strong className="num-tabular">{spoilageRate}%</strong>
            </span>
            <button type="button" onClick={() => setActiveTab('spoilage-alerts')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', flexShrink: 0, padding: 0 }}>
              Xử lý <ArrowRight size={12} />
            </button>
          </div>
        </article>
      </div>

      {/* Charts Row: 14-day Actual Sales vs Spoilage & Batch Lifecycle Distribution */}
      <div className="ss-two-col">
        {/* Left: 14-day Trend */}
        <section className="ss-card ss-card-pad" style={{ gridColumn: 'span 7', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Diễn biến Thực tế 14 Ngày: Doanh số vs Giá trị Tiêu hủy
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Số liệu hạch toán thực tế từ SQL Server (đã cứu: <strong className="num-tabular" style={{ color: 'var(--safe-green-light)' }}>{rescuedValue.toLocaleString('vi-VN')} đ</strong>)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.76rem', fontWeight: 600 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
                <span style={{ width: '10px', height: '3px', background: 'var(--primary)', borderRadius: '2px' }} /> Doanh thu bán lẻ
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--danger-red-light)' }}>
                <span style={{ width: '10px', height: '3px', background: 'var(--danger-red)', borderRadius: '2px' }} /> Tổn thất tiêu hủy
              </span>
            </div>
          </div>

          <div style={{ position: 'relative', height: '240px', width: '100%' }}>
            <svg viewBox="0 0 1000 250" preserveAspectRatio="none" style={{ width: '100%', height: '215px', overflow: 'visible' }}>
              <defs>
                <linearGradient id="ssSalesArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = 230 - ratio * 195;
                return (
                  <line key={ratio} x1="0" y1={y} x2="1000" y2={y} stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                );
              })}
              <line x1="0" y1="230" x2="1000" y2="230" stroke="#cbd5e1" strokeWidth="1" />
              {salesAreaD && <path d={salesAreaD} fill="url(#ssSalesArea)" />}
              {salesLineD && <path d={salesLineD} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />}
              {spoilLineD && <path d={spoilLineD} fill="none" stroke="#e11d48" strokeWidth="2" strokeDasharray="5 4" />}
            </svg>

            {/* Interactive Hover Slots */}
            <div style={{ position: 'absolute', inset: '0 0 25px 0', display: 'flex' }}>
              {chartPoints.map((pt) => (
                <div
                  key={pt.index}
                  onMouseEnter={() => setHoveredTrendIdx(pt.index)}
                  onMouseLeave={() => setHoveredTrendIdx(null)}
                  style={{
                    flex: 1,
                    height: '100%',
                    borderRight: hoveredTrendIdx === pt.index ? '1px dashed var(--primary-border)' : 'none',
                    background: hoveredTrendIdx === pt.index ? 'rgba(79, 70, 229, 0.04)' : 'transparent',
                    position: 'relative',
                    cursor: 'crosshair'
                  }}
                >
                  {hoveredTrendIdx === pt.index && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: pt.index > chartPoints.length / 2 ? 'auto' : '6px',
                        right: pt.index > chartPoints.length / 2 ? '6px' : 'auto',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        boxShadow: 'var(--shadow-elevated)',
                        zIndex: 20,
                        minWidth: '170px',
                        fontSize: '0.75rem',
                        pointerEvents: 'none'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                        {pt.dayOfWeek} ({pt.date})
                      </div>
                      <div style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        Doanh thu: {pt.salesRevenue.toLocaleString('vi-VN')} đ
                      </div>
                      <div style={{ color: 'var(--danger-red-light)', fontWeight: 600 }}>
                        Tiêu hủy: {pt.spoilageCost.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', paddingTop: '4px' }}>
              {chartPoints.map((pt, i) => (
                <span key={pt.index} style={{ visibility: i % 2 === 0 || i === chartPoints.length - 1 ? 'visible' : 'hidden' }}>
                  {pt.date}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Right: Shelf-Life Distribution Donut */}
        <section className="ss-card ss-card-pad" style={{ gridColumn: 'span 5', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Phân bổ Vòng đời Lô hàng (Shelf-Life)
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Theo dõi 3 ngưỡng an toàn và lô quá hạn đã khóa POS
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '16px', margin: '12px 0' }}>
            <svg width="160" height="160" viewBox="0 0 160 160" aria-label="Biểu đồ phân bổ lô hàng theo hạn dùng">
              <circle cx="80" cy="80" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="18" />
              {(() => {
                let offset = 0;
                return donutSlices.map((s) => {
                  const len = (s.pct / 100) * circumference;
                  const el = (
                    <circle
                      key={s.id}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="none"
                      stroke={s.color}
                      strokeWidth="18"
                      strokeDasharray={`${len} ${circumference}`}
                      strokeDashoffset={-offset}
                      transform="rotate(-90 80 80)"
                    />
                  );
                  offset += len;
                  return el;
                });
              })()}
              <text x="80" y="75" textAnchor="middle" fontSize="22" fontWeight="800" fill="#0f172a">
                {safeBatches.length + warningBatches.length + criticalBatches.length + expiredBatches.length}
              </text>
              <text x="80" y="95" textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748b">
                Lô trên kệ
              </text>
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '175px' }}>
              {donutSlices.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
                    {s.label}
                  </span>
                  <strong className="num-tabular" style={{ color: 'var(--text-main)' }}>{s.count} ({s.pct}%)</strong>
                </div>
              ))}
            </div>
          </div>

          <button type="button" className="ss-btn ss-btn-secondary ss-btn-sm" style={{ width: '100%' }} onClick={() => setActiveTab('inventory-management')}>
            <Package size={14} /> Kiểm tra chi tiết từng lô hàng
          </button>
        </section>
      </div>

      {/* Action Board with Explicit Approval Status Separation */}
      <section className="ss-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 0' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Bảng Hành động & Hàng đợi Phê duyệt
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '12px' }}>
            Tách bạch giữa cảnh báo tự động từ hệ thống và các đề xuất đang chờ Quản lý / Chủ chuỗi phê duyệt
          </p>
        </div>

        <div role="tablist" aria-label="Các nhóm hành động ưu tiên" className="ss-tablist">
          <button
            type="button"
            role="tab"
            id="dash-tab-spoilage"
            aria-selected={actionTab === 'SPOILAGE'}
            className="ss-tab"
            onClick={() => setActionTab('SPOILAGE')}
          >
            <AlertTriangle size={15} /> Lô cận hạn cần xử lý ({urgentSpoilageList.length})
          </button>
          {!isSingleStore && (
            <button
              type="button"
              role="tab"
              id="dash-tab-transfers"
              aria-selected={actionTab === 'TRANSFERS'}
              className="ss-tab"
              onClick={() => setActionTab('TRANSFERS')}
            >
              <ArrowLeftRight size={15} /> Phiếu điều chuyển chờ duyệt ({pendingTransfers.length + orToolsProposals.length})
            </button>
          )}
          <button
            type="button"
            role="tab"
            id="dash-tab-rop"
            aria-selected={actionTab === 'ROP'}
            className="ss-tab"
            onClick={() => setActionTab('ROP')}
          >
            <ShoppingBag size={15} /> Cảnh báo đặt hàng ROP ({ropAlerts.length})
          </button>
          <button
            type="button"
            role="tab"
            id="dash-tab-disposal"
            aria-selected={actionTab === 'DISPOSAL'}
            className="ss-tab"
            onClick={() => setActionTab('DISPOSAL')}
          >
            <Trash2 size={15} /> Hết hạn & Chờ duyệt hủy ({expiredBatches.length + pendingDisposals.length})
          </button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* Tab 1: Spoilage Action */}
          <div role="tabpanel" aria-labelledby="dash-tab-spoilage" hidden={actionTab !== 'SPOILAGE'}>
            {urgentSpoilageList.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                Không có lô cận hạn trong Vùng Đỏ hoặc Vùng Vàng.
              </div>
            ) : (
              <div className="table-wrapper" tabIndex={0} role="region" aria-label="Danh sách lô cận hạn">
                <table className="ss-table ss-table-responsive">
                  <thead>
                    <tr>
                      <th scope="col">Lô hàng / Sản phẩm</th>
                      <th scope="col">Cấp độ</th>
                      <th scope="col">Tồn kệ</th>
                      <th scope="col">Trạng thái xử lý</th>
                      <th scope="col" style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urgentSpoilageList.map(b => {
                      const isRed = b.alertColor === 'RED' || b.status === 'CRITICAL' || Number(b.daysLeft) <= 3;
                      const qty = b.currentQuantity ?? b.quantity ?? 0;
                      return (
                        <tr key={b.id}>
                          <td data-label="Sản phẩm">
                            <div style={{ fontWeight: 700 }}>{b.productName}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                              {b.batchCode} • HSD {String(b.expiryDate || '').slice(0, 10)}
                            </div>
                          </td>
                          <td data-label="Cấp độ">
                            <span className={`ss-badge ${isRed ? 'ss-badge-danger' : 'ss-badge-warning'}`}>
                              {isRed ? `Vùng Đỏ (${b.daysLeft}d)` : `Vùng Vàng (${b.daysLeft}d)`}
                            </span>
                          </td>
                          <td data-label="Tồn kệ" className="num-tabular">{qty} {b.unit || 'ĐV'}</td>
                          <td data-label="Trạng thái">
                            <span className={`ss-badge ${Number(b.discountPercent || 0) > 0 ? 'ss-badge-safe' : 'ss-badge-neutral'}`}>
                              {Number(b.discountPercent || 0) > 0 ? `Đã giảm ${b.discountPercent}%` : 'Chưa kích hoạt giảm giá'}
                            </span>
                            {b.isShelfRotated && (
                              <span className="ss-badge ss-badge-indigo" style={{ marginLeft: '6px' }}>Đã đảo kệ</span>
                            )}
                          </td>
                          <td data-label="Thao tác" style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {canApprove && Number(b.discountPercent || 0) === 0 && onQuickDiscount && (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-primary ss-btn-sm"
                                  onClick={async () => {
                                    const pct = isRed ? 40 : 15;
                                    try {
                                      const res = await onQuickDiscount(b.id, pct);
                                      if (res && res.success) {
                                        setDashFeedback({ type: 'success', text: `Đã kích hoạt Quick Markdown -${pct}% cho lô ${b.batchCode}.` });
                                      } else {
                                        setDashFeedback({ type: 'error', text: res?.message || `Không thể áp dụng giảm ${pct}% cho lô ${b.batchCode}.` });
                                      }
                                    } catch (err) {
                                      setDashFeedback({ type: 'error', text: err.message || 'Lỗi khi áp dụng Quick Markdown.' });
                                    }
                                  }}
                                >
                                  <Zap size={13} /> Giảm {isRed ? '40%' : '15%'}
                                </button>
                              )}
                              {!b.isShelfRotated && onRotateShelf && (
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-secondary ss-btn-sm"
                                  onClick={async () => {
                                    try {
                                      const res = await onRotateShelf(b.id);
                                      if (res && res.success) {
                                        setDashFeedback({ type: 'success', text: `Đã xác nhận đảo kệ mặt tiền cho lô ${b.batchCode}.` });
                                      } else {
                                        setDashFeedback({ type: 'error', text: res?.message || `Không thể xác nhận đảo kệ lô ${b.batchCode}.` });
                                      }
                                    } catch (err) {
                                      setDashFeedback({ type: 'error', text: err.message || 'Lỗi khi xác nhận đảo kệ.' });
                                    }
                                  }}
                                >
                                  <RotateCw size={13} /> Đảo kệ
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tab 2: Stock Transfer Approvals */}
          {!isSingleStore && (
            <div role="tabpanel" aria-labelledby="dash-tab-transfers" hidden={actionTab !== 'TRANSFERS'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Hiển thị đề xuất tối ưu OR-Tools và các phiếu điều chuyển đang chờ phê duyệt.
                </span>
                <button type="button" className="ss-btn ss-btn-primary ss-btn-sm" onClick={() => setActiveTab('stock-transfer')}>
                  Mở Stock Transfer <ArrowRight size={13} />
                </button>
              </div>
              {pendingTransfers.length === 0 && orToolsProposals.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                  Tồn kho giữa các chi nhánh đang ở trạng thái cân bằng.
                </div>
              ) : (
                <div className="table-wrapper" tabIndex={0} role="region" aria-label="Đề xuất điều chuyển">
                  <table className="ss-table ss-table-responsive">
                    <thead>
                      <tr>
                        <th scope="col">Nguồn đề xuất / Mã phiếu</th>
                        <th scope="col">Lộ trình điều chuyển</th>
                        <th scope="col">Sản phẩm & Số lượng</th>
                        <th scope="col">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTransfers.slice(0, 5).map(t => (
                        <tr key={`trf-${t.id}`}>
                          <td data-label="Mã phiếu" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{t.transferCode}</td>
                          <td data-label="Lộ trình">{t.fromStoreName} → {t.toStoreName}</td>
                          <td data-label="Sản phẩm">{t.productName} (<strong>{t.transferQuantity} ĐV</strong>)</td>
                          <td data-label="Trạng thái">
                            <span className="ss-badge ss-badge-warning">{t.status === 'PENDING' ? 'Chờ duyệt' : 'Đề xuất'}</span>
                          </td>
                        </tr>
                      ))}
                      {orToolsProposals.slice(0, 5).map((p, idx) => (
                        <tr key={`prop-${idx}`}>
                          <td data-label="Nguồn">
                            <span className="ss-badge ss-badge-indigo"><Sparkles size={11} /> Gợi ý AI OR-Tools</span>
                          </td>
                          <td data-label="Lộ trình">{p.fromStoreName} → {p.toStoreName}</td>
                          <td data-label="Sản phẩm">{p.productName} (<strong>{p.transferQuantity} ĐV</strong> • Cứu {Number(p.savedSpoilageValue || 0).toLocaleString('vi-VN')} đ)</td>
                          <td data-label="Trạng thái">
                            <span className="ss-badge ss-badge-neutral">Chưa lập phiếu</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: ROP Alerts */}
          <div role="tabpanel" aria-labelledby="dash-tab-rop" hidden={actionTab !== 'ROP'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Các mặt hàng có tồn khả dụng chạm điểm đặt hàng lại (ROP).
              </span>
              <button type="button" className="ss-btn ss-btn-primary ss-btn-sm" onClick={() => setActiveTab('smart-ordering')}>
                Lập đơn PO tại Smart Ordering <ArrowRight size={13} />
              </button>
            </div>
            {ropAlerts.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                Không có mặt hàng nào dưới điểm đặt hàng ROP.
              </div>
            ) : (
              <div className="table-wrapper" tabIndex={0} role="region" aria-label="Cảnh báo ROP">
                <table className="ss-table ss-table-responsive">
                  <thead>
                    <tr>
                      <th scope="col">Sản phẩm</th>
                      <th scope="col">Tồn hiện tại</th>
                      <th scope="col">Ngưỡng ROP</th>
                      <th scope="col">Gợi ý đặt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ropAlerts.slice(0, 8).map(item => (
                      <tr key={item.productId}>
                        <td data-label="Sản phẩm">
                          <div style={{ fontWeight: 700 }}>{item.productName}</div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{item.productSku}</div>
                        </td>
                        <td data-label="Tồn hiện tại" className="num-tabular" style={{ color: 'var(--danger-red-light)', fontWeight: 700 }}>{item.currentStock} {item.unit}</td>
                        <td data-label="Ngưỡng ROP" className="num-tabular">{item.reorderPoint} {item.unit}</td>
                        <td data-label="Gợi ý đặt" className="num-tabular" style={{ color: 'var(--primary)', fontWeight: 700 }}>+{item.suggestedOrderQuantity} {item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tab 4: Expired & Pending Disposal */}
          <div role="tabpanel" aria-labelledby="dash-tab-disposal" hidden={actionTab !== 'DISPOSAL'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Lô đã hết hạn bị khóa xuất bán và các biên bản tiêu hủy đang chờ duyệt chốt sổ.
              </span>
              <button type="button" className="ss-btn ss-btn-danger ss-btn-sm" onClick={() => setActiveTab('spoilage-alerts')}>
                Xử lý tiêu hủy <ArrowRight size={13} />
              </button>
            </div>
            {expiredBatches.length === 0 && pendingDisposals.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                Không có lô quá hạn hoặc biên bản tiêu hủy đang chờ duyệt.
              </div>
            ) : (
              <div className="table-wrapper" tabIndex={0} role="region" aria-label="Lô hết hạn chờ xử lý">
                <table className="ss-table ss-table-responsive">
                  <thead>
                    <tr>
                      <th scope="col">Loại chờ xử lý</th>
                      <th scope="col">Mã lô / Biên bản</th>
                      <th scope="col">Sản phẩm</th>
                      <th scope="col">Số lượng & Giá trị</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDisposals.map(d => (
                      <tr key={`disp-${d.id}`}>
                        <td data-label="Loại"><span className="ss-badge ss-badge-warning">Biên bản chờ duyệt</span></td>
                        <td data-label="Mã" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{d.recordCode || d.id}</td>
                        <td data-label="Sản phẩm">{d.productName} ({d.batchCode})</td>
                        <td data-label="Giá trị" className="num-tabular">{d.quantity} ĐV • {Number(d.totalLoss || d.costLoss || 0).toLocaleString('vi-VN')} đ</td>
                      </tr>
                    ))}
                    {expiredBatches.slice(0, 8).map(b => (
                      <tr key={`exp-${b.id}`}>
                        <td data-label="Loại"><span className="ss-badge ss-badge-expired">Quá hạn (Khóa)</span></td>
                        <td data-label="Mã" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.batchCode}</td>
                        <td data-label="Sản phẩm">{b.productName} (HSD {String(b.expiryDate || '').slice(0, 10)})</td>
                        <td data-label="Giá trị" className="num-tabular">{b.currentQuantity ?? b.quantity} ĐV • {((b.currentQuantity ?? b.quantity ?? 0) * (b.importPrice ?? 0)).toLocaleString('vi-VN')} đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
