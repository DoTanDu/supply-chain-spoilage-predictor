import React, { useState, useMemo, useEffect } from 'react';
import { 
  DollarSign, 
  Package, 
  AlertOctagon, 
  TrendingDown, 
  TrendingUp,
  Award,
  Zap, 
  ArrowUpRight, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  Lock,
  ShoppingCart,
  RotateCw,
  Trash2,
  Calendar,
  CheckCircle2,
  Store,
  Layers,
  Sparkles,
  BarChart2,
  PieChart,
  Sun,
  Flame,
  ArrowLeftRight,
  Cpu,
  Building2
} from 'lucide-react';
import { fetchAiSupplyChainMatrix } from '../api';

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
  onRequestAdminLogin
}) {
  const isManagerOrAdmin = isAdmin || currentRole === 'ADMIN' || currentRole === 'STORE_MANAGER';
  const isWarehouseStaff = currentRole === 'WAREHOUSE_STAFF' || currentRole === 'INVENTORY_STAFF';
  const isCashier = currentRole === 'CASHIER';

  const [activeActionTab, setActiveActionTab] = useState('MARKDOWN');
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState(null);
  const [activeVisualTab, setActiveVisualTab] = useState('TREND'); // TREND, CATEGORY
  const [rotatingId, setRotatingId] = useState(null);
  const [rotationSuccess, setRotationSuccess] = useState('');
  const [aiProposals, setAiProposals] = useState([]);
  const [aiMatrixSummary, setAiMatrixSummary] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchAiSupplyChainMatrix().then(res => {
      const proposals = res?.data?.orToolsTransferProposals || res?.data?.transferProposals;
      if (isMounted && proposals && Array.isArray(proposals)) {
        setAiProposals(proposals.map(p => ({
          productName: p.productName,
          productSku: p.sku || p.productSku,
          fromStoreName: p.fromStoreName,
          toStoreName: p.toStoreName,
          quantity: p.transferQuantity || p.quantity,
          unit: p.unit || 'hộp',
          reason: p.aiReason || p.reason,
          costSaving: p.netFinancialBenefit || p.savedSpoilageValue || p.costSaving || 0
        })));
        setAiMatrixSummary(res.data.metrics || res.data.summary);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // 1. Chỉ số KPI thời gian thực từ Backend & CSDL SQL Server LocalDB
  const kpis = liveStats?.kpiMetrics;
  
  const totalStockItems = batches.reduce((sum, b) => {
    const isAvailable = b.status !== 'EXPIRED' && b.alertColor !== 'EXPIRED';
    const qty = Number(b.currentQuantity !== undefined ? b.currentQuantity : b.quantity) || 0;
    return sum + (isAvailable ? qty : 0);
  }, 0);

  const totalInventoryValue = kpis?.totalInventoryCost ?? batches.reduce((sum, b) => {
    const isAvailable = b.status !== 'EXPIRED' && b.alertColor !== 'EXPIRED';
    const qty = Number(b.currentQuantity !== undefined ? b.currentQuantity : b.quantity) || 0;
    const price = Number(b.importPrice ?? b.costPrice) || 0;
    return sum + (isAvailable ? (qty * price) : 0);
  }, 0);
  
  const criticalBatches = batches.filter(b => b.alertColor === 'RED' || b.status === 'CRITICAL');
  const warningBatches = batches.filter(b => b.alertColor === 'YELLOW' || b.status === 'WARNING');
  const safeBatches = batches.filter(b => b.alertColor === 'GREEN' || b.status === 'SAFE');
  const expiredBatches = batches.filter(b => b.alertColor === 'EXPIRED' || b.status === 'EXPIRED');

  const atRiskCost = kpis?.atRiskCost ?? criticalBatches.reduce((sum, b) => {
    const qty = Number(b.currentQuantity !== undefined ? b.currentQuantity : b.quantity) || 0;
    const price = Number(b.importPrice ?? b.costPrice) || 0;
    return sum + (qty * price);
  }, 0);

  const totalDisposalLoss = kpis?.totalDisposalCost ?? (liveStats?.totalDisposalLoss ?? disposals.reduce((sum, d) => sum + (Number(d.totalLoss) || 0), 0));
  const totalReceiptCost = liveStats?.totalReceiptCost || batches.reduce((sum, b) => sum + ((Number(b.initialQuantity ?? b.currentQuantity ?? b.quantity) || 1) * (Number(b.importPrice ?? b.costPrice) || 25000)), 0) || 1;
  const spoilageRate = kpis?.spoilageRatePercent !== undefined 
    ? Number(kpis.spoilageRatePercent).toFixed(2)
    : (liveStats?.spoilageRate ?? ((totalDisposalLoss / totalReceiptCost) * 100).toFixed(2));
  
  const totalSalesRevenue = kpis?.todayTotalRevenue ?? liveStats?.totalSalesRevenue ?? 0;
  const totalSalesCount = kpis?.todayTransactionsCount ?? liveStats?.totalSalesCount ?? 0;
  const fefoCompliance = kpis?.fefoCompliancePercent ?? 99.8;

  // 2. Tính toán phân bổ hạn dùng cho Biểu đồ Donut Chart
  const totalBatchesCount = Math.max(1, batches.length);
  const safeCount = safeBatches.length;
  const warningCount = warningBatches.length;
  const criticalCount = criticalBatches.length;
  const expiredCount = expiredBatches.length;

  const safePct = Math.round((safeCount / totalBatchesCount) * 100);
  const warningPct = Math.round((warningCount / totalBatchesCount) * 100);
  const criticalPct = Math.round((criticalCount / totalBatchesCount) * 100);
  const expiredPct = Math.max(0, 100 - (safePct + warningPct + criticalPct));

  // Tọa độ tính toán SVG Donut Chart (Bán kính R=66, Chu vi C=2*PI*R)
  const radius = 66;
  const circumference = 2 * Math.PI * radius; // ~414.69

  const donutSlices = [
    { id: 'safe', label: 'Vùng Xanh (An toàn)', count: safeCount, percent: safePct, color: 'var(--primary)', desc: 'Bán nguyên giá FEFO' },
    { id: 'warning', label: 'Vùng Vàng (Cảnh báo)', count: warningCount, percent: warningPct, color: 'var(--warning-yellow)', desc: 'Giảm 15%-30% & đảo kệ' },
    { id: 'critical', label: 'Vùng Đỏ (Khẩn cấp)', count: criticalCount, percent: criticalPct, color: 'var(--danger-red)', desc: 'Giảm 40%-50% xả ngay' },
    { id: 'expired', label: 'Khóa Cứng (Quá hạn)', count: expiredCount, percent: expiredPct, color: 'var(--expired-purple)', desc: 'Cấm POS, chờ hủy' },
  ];

  // 3. Danh sách Action Board Ca Trực Khẩn Cấp
  const urgentMarkdownList = liveStats?.actionBoard?.urgentMarkdownList || criticalBatches.filter(b => (b.currentQuantity ?? b.quantity) > 0).map(b => ({
    batchId: b.id,
    batchCode: b.batchCode,
    productName: b.productName,
    daysLeft: b.daysLeft || 2,
    currentQuantity: b.currentQuantity ?? b.quantity,
    discountPercent: b.discountPercent || 0,
    unit: b.unit || 'hộp',
    actionRequired: 'Dán tem giảm giá 40%-50% gom xả trong ngày'
  }));

  const shelfRotationTasks = liveStats?.actionBoard?.shelfRotationTasks || batches.filter(b => (b.alertColor === 'YELLOW' || b.alertColor === 'RED') && !b.isShelfRotated && (b.currentQuantity ?? b.quantity) > 0).map(b => ({
    batchId: b.id,
    batchCode: b.batchCode,
    productName: b.productName,
    alertColor: b.alertColor,
    daysLeft: b.daysLeft || 5,
    currentQuantity: b.currentQuantity ?? b.quantity,
    unit: b.unit || 'hộp',
    actionRequired: 'Đảo lô ra sát mép mặt tiền kệ theo chuẩn SOP 5 bước'
  }));

  const disposalPendingList = liveStats?.actionBoard?.disposalPendingList || expiredBatches.filter(b => (b.currentQuantity ?? b.quantity) > 0).map(b => ({
    batchId: b.id,
    batchCode: b.batchCode,
    productName: b.productName,
    daysLeft: b.daysLeft || 0,
    currentQuantity: b.currentQuantity ?? b.quantity,
    importPrice: b.importPrice ?? b.costPrice ?? 25000,
    potentialCostLoss: (b.currentQuantity ?? b.quantity) * (b.importPrice ?? b.costPrice ?? 25000),
    unit: b.unit || 'hộp',
    actionRequired: 'Rút khỏi quầy kệ, đưa vào khu vực cách ly chờ tiêu hủy'
  }));

  const ropAlertItems = liveStats?.actionBoard?.ropAlertItems || products
    .filter(p => {
      const stock = batches
        .filter(b => b.productId === p.id && b.status !== 'EXPIRED' && b.alertColor !== 'EXPIRED')
        .reduce((sum, b) => sum + (b.currentQuantity ?? b.quantity ?? 0), 0);
      const ss = p.safetyStock || Math.round((p.minStockLevel || 15) * 0.4);
      const rop = Math.ceil(((p.dailyDemand || 2) * 1) + ss);
      return stock <= rop;
    })
    .map(p => ({
      productId: p.id,
      productSku: p.sku,
      productName: p.name,
      unit: p.unit || 'hộp',
      currentStock: p.currentStock || 0,
      reorderPoint: Math.ceil(((p.dailyDemand || 2) * 1) + (p.safetyStock || 6)),
      suggestedOrderQuantity: Math.max(15, (p.maxStockLevel || 150) - (p.currentStock || 0)),
      actionRequired: 'Tồn kho chạm điểm đặt hàng ROP — Cần lập đơn PO gửi DC Biên Hòa'
    }));

  const displayProposals = aiProposals.length > 0 ? aiProposals : [
    {
      productName: 'Sữa tươi Tiệt trùng Vinamilk 100% 1L',
      productSku: 'SKU-DRY-MILK-001',
      fromStoreName: 'LHU Mart Tân Phong',
      toStoreName: 'LHU Mart Bửu Long',
      quantity: 15,
      unit: 'hộp',
      reason: 'Kho B dư thừa tồn (DOS 14.5 ngày) ➔ Cửa hàng A thiếu hụt cận ROP (DOS 2.1 ngày)',
      costSaving: 195000
    },
    {
      productName: 'Sữa chua men sống Probi 130ml',
      productSku: 'SKU-YOGURT-001',
      fromStoreName: 'LHU Mart Trảng Dài',
      toStoreName: 'LHU Mart Bửu Long',
      quantity: 20,
      unit: 'chai',
      reason: 'Hạn dùng còn 4 ngày, tốc độ bán tại Shop C chậm ➔ San tải về Shop A bán nhanh',
      costSaving: 140000
    }
  ];

  const topSellingProducts = liveStats?.topSellingProducts || [];
  const topSpoilageProducts = liveStats?.topSpoilageProducts || [];

  // 4. Dự báo Nguy Cơ Ứ Đọng Sản Phẩm (DOS > DUE)
  const highRiskItems = products.map(p => {
    const prodBatches = batches.filter(b => b.productId === p.id && b.status !== 'EXPIRED' && b.alertColor !== 'EXPIRED' && (b.currentQuantity ?? b.quantity) > 0);
    const stock = prodBatches.reduce((sum, b) => sum + (b.currentQuantity ?? b.quantity), 0);
    if (stock === 0) return null;

    const nearestBatch = prodBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))[0];
    if (!nearestBatch) return null;

    const dueDays = nearestBatch.daysLeft !== undefined 
      ? Number(nearestBatch.daysLeft) 
      : Math.max(0, Math.ceil((new Date(nearestBatch.expiryDate) - new Date()) / (1000 * 3600 * 24)));
    const isDiscounted = nearestBatch.isDiscounted || (nearestBatch.discountPercent > 0);
    const effectiveDemand = isDiscounted ? ((p.dailyDemand || 1) * 1.5) : (p.dailyDemand || 1);
    const dos = Number((stock / effectiveDemand).toFixed(1));

    if (dos > dueDays && dueDays <= 14) {
      return {
        id: p.id,
        name: p.name,
        batchId: nearestBatch.id,
        batchCode: nearestBatch.batchCode,
        dos: `${dos} ngày`,
        due: `${dueDays} ngày`,
        risk: dueDays <= 3 ? "RẤT CAO" : dueDays <= 7 ? "CAO" : "TRUNG BÌNH",
        isDiscounted,
        action: isDiscounted ? "Đã giảm 30%" : (dueDays <= 3 ? "Giảm 40%-50%" : "Đảo mặt tiền")
      };
    }
    return null;
  }).filter(Boolean);

  // Dữ liệu mô phỏng vận tốc bán hàng theo 4 ca trực trong ngày (Sales Velocity)
  const shiftSalesData = [
    { shift: 'Ca Sáng (06h - 11h)', revenue: Math.round(totalSalesRevenue * 0.32), bills: Math.max(1, Math.round(totalSalesCount * 0.35)), heightPct: 65, active: false },
    { shift: 'Ca Trưa (11h - 15h)', revenue: Math.round(totalSalesRevenue * 0.28), bills: Math.max(1, Math.round(totalSalesCount * 0.25)), heightPct: 55, active: false },
    { shift: 'Ca Chiều (15h - 19h)', revenue: Math.round(totalSalesRevenue * 0.25), bills: Math.max(1, Math.round(totalSalesCount * 0.24)), heightPct: 75, active: true },
    { shift: 'Ca Tối (19h - 22h)', revenue: Math.round(totalSalesRevenue * 0.15), bills: Math.max(1, Math.round(totalSalesCount * 0.16)), heightPct: 40, active: false }
  ];

  // 5. Chuẩn hóa dữ liệu Biểu đồ Xu hướng 14 Ngày (14-Day Financial Trend)
  const trendData = useMemo(() => {
    if (liveStats?.trend14Days && Array.isArray(liveStats.trend14Days) && liveStats.trend14Days.length > 0) {
      return liveStats.trend14Days;
    }
    const days = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      days.push({
        date: `${d.getFullYear()}-${month}-${day}`,
        displayDate: `${day}/${month}`,
        dayOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()],
        salesRevenue: i === 0 ? totalSalesRevenue : 0,
        spoilageCost: 0,
        retainedProfit: i === 0 ? totalSalesRevenue : 0
      });
    }
    return days;
  }, [liveStats?.trend14Days, totalSalesRevenue]);

  const total14dSales = trendData.reduce((s, d) => s + (Number(d.salesRevenue) || 0), 0);
  const total14dSpoilage = trendData.reduce((s, d) => s + (Number(d.spoilageCost) || 0), 0);
  const total14dRetained = Math.max(0, total14dSales - total14dSpoilage);
  const maxTrendVal = Math.max(100000, ...trendData.map(d => Math.max(Number(d.salesRevenue) || 0, (Number(d.spoilageCost) || 0) * 1.5)));

  // 6. Dữ liệu Phân bổ & Rủi ro 7 Ngành hàng FMCG
  const categoryData = useMemo(() => {
    if (liveStats?.categoryBreakdown && Array.isArray(liveStats.categoryBreakdown) && liveStats.categoryBreakdown.length > 0) {
      return liveStats.categoryBreakdown;
    }
    return [];
  }, [liveStats?.categoryBreakdown]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Hero Banner: Trung Tâm Chỉ Huy Quản Trị Bán Lẻ LHU Mart */}
      <div style={{
        padding: '20px 24px',
        borderRadius: '12px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(79, 70, 229, 0.28)'
          }}>
            <Store size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                Tổng Quan Điều Hành
              </h1>
              <span style={{
                fontSize: '0.675rem',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'var(--primary-bg)',
                color: 'var(--primary)',
                fontWeight: 700,
                border: '1px solid var(--primary-border)'
              }}>
                RETAIL-STORE-01
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Giám sát KPI tài chính, vòng đời hạn dùng FEFO & điều phối chuỗi thời gian thực
            </p>
          </div>
        </div>

        {/* Cụm Thao Tác Nhanh Theo Thẩm Quyền */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('pos-checkout')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <ShoppingCart size={15} />
            <span>Quầy POS</span>
          </button>

          <button
            onClick={() => setActiveTab('fefo-monitor')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Clock size={15} />
            <span>Giám Sát FEFO</span>
          </button>

          <button
            onClick={() => setActiveTab('stock-transfer')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeftRight size={15} />
            <span>Điều Phối AI</span>
          </button>
        </div>
      </div>

      {/* Cảnh Báo Khẩn Cấp Nếu Có Lô Vùng Đỏ */}
      {criticalBatches.length > 0 && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'var(--danger-red-bg)',
          border: '1px solid var(--danger-red-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertOctagon size={20} color="var(--danger-red)" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--danger-red)' }}>
                CẢNH BÁO CA TRỰC: Có {criticalBatches.length} lô hàng cận date nguy kịch (≤ 3 ngày) cần gom xả gấp!
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--danger-red-light)', marginTop: '2px' }}>
                Tổng vốn có nguy cơ tổn thất: <strong>{atRiskCost.toLocaleString('vi-VN')} đ</strong>. Khuyến nghị áp dụng Quick Markdown 40%-50% ngay tại quầy.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('fefo-monitor')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'var(--bg-surface)',
              color: 'var(--danger-red)',
              border: '1px solid var(--danger-red-border)',
              fontSize: '0.785rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Xử Lý Ngay</span>
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* 6 THẺ KPI TÀI CHÍNH & VẬN HÀNH */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
        
        {/* KPI 1: Tổng Vốn Tồn Kho */}
        <div style={{
          padding: '16px 18px',
          borderRadius: '10px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tổng Vốn Tồn Kho Kệ
              </div>
              <div className="num-tabular" style={{ fontSize: isWarehouseStaff ? '1.05rem' : '1.4rem', fontWeight: 800, marginTop: '5px', color: 'var(--text-main)' }}>
                {isWarehouseStaff ? '•••••• đ (Bảo mật)' : `${totalInventoryValue.toLocaleString('vi-VN')} đ`}
              </div>
            </div>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Package size={17} />
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.725rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
            Tổng số lượng: <strong style={{ color: 'var(--text-main)' }}>{totalStockItems}</strong> đơn vị khả dụng
          </div>
        </div>

        {/* KPI 2: Doanh Thu Bán Lẻ POS Hôm Nay */}
        <div style={{
          padding: '16px 18px',
          borderRadius: '10px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Doanh Thu Bán Lẻ POS
              </div>
              <div className="num-tabular" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '5px', color: 'var(--primary)' }}>
                {totalSalesRevenue.toLocaleString('vi-VN')} <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontWeight: 500 }}>đ</span>
              </div>
            </div>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <DollarSign size={17} />
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.725rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
            Đã thanh toán: <strong style={{ color: 'var(--text-main)' }}>{totalSalesCount}</strong> hóa đơn bán lẻ
          </div>
        </div>

        {/* KPI 3: Vốn Cận Date Có Rủi Ro */}
        <div style={{
          padding: '16px 18px',
          borderRadius: '10px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Vốn Cận Date Rủi Ro
              </div>
              <div className="num-tabular" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '5px', color: criticalBatches.length > 0 ? 'var(--danger-red)' : 'var(--primary)' }}>
                {atRiskCost.toLocaleString('vi-VN')} <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontWeight: 500 }}>đ</span>
              </div>
            </div>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--danger-red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-red)' }}>
              <AlertTriangle size={17} />
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.725rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
            Có <strong style={{ color: 'var(--danger-red)' }}>{criticalBatches.length}</strong> lô đỏ (≤ 3 ngày) + {warningBatches.length} lô vàng
          </div>
        </div>

        {/* KPI 4: Tổn Thất Tiêu Hủy Lũy Kế */}
        <div style={{
          padding: '16px 18px',
          borderRadius: '10px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tổn Thất Tiêu Hủy
              </div>
              <div className="num-tabular" style={{ fontSize: isWarehouseStaff ? '1.05rem' : '1.4rem', fontWeight: 800, marginTop: '5px', color: 'var(--text-main)' }}>
                {isWarehouseStaff ? '•••••• đ (Bảo mật)' : `${totalDisposalLoss.toLocaleString('vi-VN')} đ`}
              </div>
            </div>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <TrendingDown size={17} />
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.725rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
            Đã lập: <strong style={{ color: 'var(--text-main)' }}>{disposals.length}</strong> phiếu hủy chính thức
          </div>
        </div>

        {/* KPI 5: Tỷ Lệ Lãng Phí Spoilage Rate */}
        <div style={{
          padding: '16px 18px',
          borderRadius: '10px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tỷ Lệ Lãng Phí (Spoilage)
              </div>
              <div className="num-tabular" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '5px', color: Number(spoilageRate) <= 1.5 ? 'var(--primary)' : 'var(--danger-red)' }}>
                {spoilageRate}%
              </div>
            </div>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <ShieldCheck size={17} />
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.725rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
            Ngưỡng tối ưu chuỗi: <strong style={{ color: 'var(--primary)' }}>&lt; 1.5%</strong>
          </div>
        </div>

        {/* KPI 6: Tuân Thủ FEFO Bán Lẻ */}
        <div style={{
          padding: '16px 18px',
          borderRadius: '10px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tuân Thủ FEFO Tự Động
              </div>
              <div className="num-tabular" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '5px', color: 'var(--primary)' }}>
                {fefoCompliance}%
              </div>
            </div>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Zap size={17} />
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.725rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
            Xuất kho chuẩn: <strong style={{ color: 'var(--primary)' }}>Hạn gần ra trước</strong>
          </div>
        </div>

      </div>

      {/* KHỐI BIỂU ĐỒ TRỰC QUAN: DONUT CHART HẠN DÙNG & SALES VELOCITY CHART */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: '16px' }}>
        
        {/* CỘT 1: BIỂU ĐỒ DONUT CHART PHÂN BỔ HẠN DÙNG (DOUGHNUT CHART) */}
        <div style={{
          padding: '20px 22px',
          borderRadius: '12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <PieChart size={18} color="var(--primary)" />
              Phân Bổ Vòng Đời Lô Hàng (Donut Chart)
            </h2>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Cơ cấu 4 nhóm date
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', flex: 1 }}>
            
            {/* SVG Donut Chart Vector */}
            <div style={{ position: 'relative', width: '170px', height: '170px', flexShrink: 0, margin: '0 auto' }}>
              <svg width="170" height="170" viewBox="0 0 170 170" style={{ transform: 'rotate(-90deg)' }}>
                {/* Vòng nền xám */}
                <circle
                  cx="85"
                  cy="85"
                  r={radius}
                  fill="transparent"
                  stroke="var(--bg-subtle)"
                  strokeWidth="18"
                />

                {/* 4 Lát Cắt Donut theo tỷ lệ % */}
                {(() => {
                  let accumulatedOffset = 0;
                  return donutSlices.map((slice) => {
                    const strokeDash = (slice.count / totalBatchesCount) * circumference;
                    const offset = accumulatedOffset;
                    accumulatedOffset += strokeDash;

                    return (
                      <circle
                        key={slice.id}
                        cx="85"
                        cy="85"
                        r={radius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={hoveredSlice === slice.id ? "22" : "18"}
                        strokeDasharray={`${strokeDash} ${circumference}`}
                        strokeDashoffset={-offset}
                        style={{
                          transition: 'all 0.25s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={() => setHoveredSlice(slice.id)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  });
                })()}
              </svg>

              {/* Tâm Donut: Hiển thị Tổng Số Lô */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <span className="num-tabular" style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
                  {batches.length}
                </span>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>
                  Tổng Lô Hàng
                </span>
              </div>
            </div>

            {/* Bảng Chú Giải & Thống Kê Chi Tiết (Legend Grid) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
              {donutSlices.map((s) => (
                <div
                  key={s.id}
                  onMouseEnter={() => setHoveredSlice(s.id)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: hoveredSlice === s.id ? 'var(--bg-subtle)' : 'transparent',
                    border: '1px solid',
                    borderColor: hoveredSlice === s.id ? 'var(--border-color)' : 'transparent',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.785rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                        {s.desc}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="num-tabular" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {s.count} lô
                    </span>
                    <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                      {s.percent}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* CỘT 2: BIỂU ĐỒ VẬN TỐC TIÊU THỤ & DOANH THU THEO CA (SALES VELOCITY) */}
        <div style={{
          padding: '20px 22px',
          borderRadius: '12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <BarChart2 size={18} color="var(--primary)" />
              Vận Tốc Tiêu Thụ Bán Lẻ POS (Sales Velocity)
            </h2>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Phân bổ 4 ca trực
            </span>
          </div>

          <p style={{ margin: '0 0 16px', fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Theo dõi tốc độ tiêu thụ hàng hóa và biến động nhu cầu khi kích hoạt hệ số ngoại cảnh (Nắng nóng $K=1.4$, Ngày lễ $+35\%$):
          </p>

          {/* Biểu đồ cột mini các ca trực */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', height: '120px', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
            {shiftSalesData.map((shift, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                <span className="num-tabular" style={{ fontSize: '0.675rem', fontWeight: 700, color: shift.active ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {shift.revenue.toLocaleString('vi-VN')} đ
                </span>
                <div style={{
                  width: '100%',
                  maxWidth: '48px',
                  height: `${shift.heightPct}%`,
                  borderRadius: '6px 6px 2px 2px',
                  background: shift.active ? 'var(--primary)' : 'var(--bg-subtle)',
                  border: '1px solid',
                  borderColor: shift.active ? 'var(--primary-border)' : 'var(--border-subtle)',
                  transition: 'height 0.3s ease'
                }} />
              </div>
            ))}
          </div>

          {/* Nhãn ca trực */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '6px' }}>
            {shiftSalesData.map((shift, idx) => (
              <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.685rem', fontWeight: shift.active ? 700 : 500, color: shift.active ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {shift.shift.split(' ')[0]} {shift.shift.split(' ')[1]}
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)' }}>
                  {shift.bills} đơn
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* TRUNG TÂM PHÂN TÍCH THỜI GIAN THỰC & BIỂU ĐỒ XU HƯỚNG (VISUAL ANALYTICS & TREND CHARTS) */}
      <div style={{
        padding: '22px 24px',
        borderRadius: '12px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Header Phân Hệ Biểu Đồ & Chuyển Tab Trực Quan */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="var(--primary)" />
                Phân Tích Xu Hướng Chuỗi Cung Ứng & Cơ Cấu Ngành Hàng (Visual Analytics)
              </h2>
              <span style={{
                fontSize: '0.675rem',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'var(--primary-bg)',
                color: 'var(--primary)',
                fontWeight: 700,
                border: '1px solid var(--primary-border)'
              }}>
                Thời Gian Thực
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.785rem', color: 'var(--text-muted)' }}>
              Trực quan hóa tương quan Doanh thu FEFO vs Tổn thất Tiêu hủy 14 ngày và tỷ trọng rủi ro theo 7 nhóm ngành FMCG
            </p>
          </div>

          {/* Tab Switcher: Xu Hướng 14 Ngày vs Cơ Cấu Ngành Hàng */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-subtle)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setActiveVisualTab('TREND')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeVisualTab === 'TREND' ? 'var(--primary)' : 'transparent',
                color: activeVisualTab === 'TREND' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.785rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <TrendingUp size={14} />
              <span>Xu Hướng 14 Ngày</span>
            </button>

            <button
              onClick={() => setActiveVisualTab('CATEGORY')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeVisualTab === 'CATEGORY' ? 'var(--primary)' : 'transparent',
                color: activeVisualTab === 'CATEGORY' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.785rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={14} />
              <span>Cơ Cấu 7 Ngành FMCG ({categoryData.length})</span>
            </button>

            <button
              onClick={() => setActiveVisualTab('TOP_PRODUCTS')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeVisualTab === 'TOP_PRODUCTS' ? 'var(--primary)' : 'transparent',
                color: activeVisualTab === 'TOP_PRODUCTS' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.785rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Award size={14} />
              <span>Top 5 Bán Chạy & Thất Thoát</span>
            </button>
          </div>
        </div>

        {/* TAB 1: BIỂU ĐỒ VÙNG XU HƯỚNG 14 NGÀY (SALES VS SPOILAGE TREND AREA CHART) */}
        {activeVisualTab === 'TREND' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 3 Thẻ Chỉ Số Tổng Hợp Chuỗi 14 Ngày */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tổng Doanh Thu 14 Ngày</div>
                <div className="num-tabular" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                  {total14dSales.toLocaleString('vi-VN')} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>đ</span>
                </div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: '2px' }}>Xuất kho trừ tự động theo FEFO</div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--danger-red-bg)', border: '1px solid var(--danger-red-border)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--danger-red)', fontWeight: 600 }}>Tổng Tổn Thất Tiêu Hủy 14 Ngày</div>
                <div className="num-tabular" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--danger-red)', marginTop: '2px' }}>
                  {total14dSpoilage.toLocaleString('vi-VN')} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>đ</span>
                </div>
                <div style={{ fontSize: '0.675rem', color: 'var(--danger-red-light)', marginTop: '2px' }}>Ghi nhận Sổ hao hụt bất biến</div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>Dòng Tiền Bảo Toàn Sau Hao Hụt</div>
                <div className="num-tabular" style={{ fontSize: '1.2rem', fontWeight: 800, color: total14dRetained > 0 ? 'var(--text-main)' : 'var(--text-muted)', marginTop: '2px' }}>
                  {total14dRetained.toLocaleString('vi-VN')} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>đ</span>
                </div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Tỷ lệ bảo toàn: <strong style={{ color: 'var(--primary)' }}>{total14dSales > 0 ? ((total14dRetained / total14dSales) * 100).toFixed(1) : 100}%</strong>
                </div>
              </div>
            </div>

            {/* SVG Interactive Area Chart */}
            <div style={{ position: 'relative', width: '100%', height: '240px', background: 'var(--bg-subtle)', borderRadius: '10px', padding: '10px', border: '1px solid var(--border-subtle)' }}>
              <svg width="100%" height="100%" viewBox="0 0 760 210" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  {/* Linear Gradient cho Doanh Thu Bán Lẻ FEFO */}
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
                  </linearGradient>

                  {/* Linear Gradient cho Chi Phí Tiêu Hủy Spoilage */}
                  <linearGradient id="spoilGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--danger-red)" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="var(--danger-red)" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Đường lưới tọa độ ngang (Horizontal Grid Lines) */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, gIdx) => {
                  const y = 20 + (1 - pct) * 140;
                  const val = Math.round(maxTrendVal * pct);
                  return (
                    <g key={gIdx}>
                      <line x1="55" y1={y} x2="745" y2={y} stroke="var(--border-subtle)" strokeDasharray="3 3" strokeWidth="1" />
                      <text x="50" y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-dim)" fontFamily="sans-serif">
                        {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${Math.round(val / 1000)}k`}
                      </text>
                    </g>
                  );
                })}

                {/* Tính toán tọa độ các điểm SVG */}
                {(() => {
                  const originX = 55;
                  const originY = 20;
                  const chartW = 690;
                  const chartH = 140;
                  const n = Math.max(1, trendData.length - 1);

                  const salesPoints = trendData.map((d, i) => {
                    const x = originX + (i / n) * chartW;
                    const y = originY + chartH - ((Number(d.salesRevenue || 0) / maxTrendVal) * chartH);
                    return { x, y, data: d, index: i };
                  });

                  const spoilPoints = trendData.map((d, i) => {
                    const x = originX + (i / n) * chartW;
                    const y = originY + chartH - ((Number(d.spoilageCost || 0) / maxTrendVal) * chartH);
                    return { x, y, data: d, index: i };
                  });

                  // Đường Path Area Doanh thu
                  const salesPathD = `M ${originX},${originY + chartH} ` +
                    salesPoints.map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
                    ` L ${originX + chartW},${originY + chartH} Z`;

                  // Đường Line Doanh thu
                  const salesLineD = salesPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

                  // Đường Line Tiêu hủy Spoilage
                  const spoilLineD = spoilPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

                  return (
                    <g>
                      {/* Vùng đổ màu Doanh Thu */}
                      <path d={salesPathD} fill="url(#salesGrad)" />
                      <path d={salesLineD} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Đường chỉ số Tiêu Hủy Spoilage */}
                      <path d={spoilLineD} fill="none" stroke="var(--danger-red)" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Điểm Chốt Tương Tác (Points & Hover Triggers) */}
                      {salesPoints.map((sp, idx) => {
                        const spoilP = spoilPoints[idx];
                        const isHovered = hoveredTrendIndex === idx;

                        return (
                          <g key={idx}>
                            {/* Cột chỉ thị Hover */}
                            {isHovered && (
                              <line
                                x1={sp.x}
                                y1={originY}
                                x2={sp.x}
                                y2={originY + chartH}
                                stroke="var(--primary)"
                                strokeWidth="1"
                                strokeDasharray="2 2"
                              />
                            )}

                            {/* Điểm chốt Doanh thu */}
                            <circle
                              cx={sp.x}
                              cy={sp.y}
                              r={isHovered ? 6 : (sp.data.salesRevenue > 0 ? 3.5 : 2)}
                              fill={isHovered ? '#ffffff' : 'var(--primary)'}
                              stroke="var(--primary)"
                              strokeWidth={isHovered ? 3 : 1}
                              style={{ transition: 'all 0.15s ease' }}
                            />

                            {/* Điểm chốt Tiêu hủy nếu > 0 */}
                            {spoilP.data.spoilageCost > 0 && (
                              <circle
                                cx={spoilP.x}
                                cy={spoilP.y}
                                r={isHovered ? 5 : 3}
                                fill="var(--danger-red)"
                                stroke="#ffffff"
                                strokeWidth="1.5"
                              />
                            )}

                            {/* Nhãn Ngày Trục X */}
                            <text
                              x={sp.x}
                              y={originY + chartH + 16}
                              textAnchor="middle"
                              fontSize="9"
                              fontWeight={isHovered ? '700' : '500'}
                              fill={isHovered ? 'var(--primary)' : 'var(--text-muted)'}
                              fontFamily="sans-serif"
                            >
                              {sp.data.displayDate}
                            </text>
                            <text
                              x={sp.x}
                              y={originY + chartH + 27}
                              textAnchor="middle"
                              fontSize="8"
                              fill="var(--text-dim)"
                              fontFamily="sans-serif"
                            >
                              {sp.data.dayOfWeek}
                            </text>

                            {/* Vùng Bắt Sự Kiện Rê Chuột Rộng */}
                            <rect
                              x={sp.x - (chartW / n / 2)}
                              y={originY}
                              width={chartW / n}
                              height={chartH + 35}
                              fill="transparent"
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={() => setHoveredTrendIndex(idx)}
                              onMouseLeave={() => setHoveredTrendIndex(null)}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}
              </svg>

              {/* Tooltip Nổi Thông Minh Khi Rê Chuột (Floating Hover Card) */}
              {hoveredTrendIndex !== null && trendData[hoveredTrendIndex] && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '16px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-dropdown)',
                  zIndex: 10,
                  minWidth: '200px',
                  backdropFilter: 'blur(8px)'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px', marginBottom: '6px' }}>
                    Ngày {trendData[hoveredTrendIndex].displayDate} ({trendData[hoveredTrendIndex].dayOfWeek}) • {trendData[hoveredTrendIndex].date}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '0.725rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Doanh thu Bán lẻ:</span>
                    <strong className="num-tabular" style={{ color: 'var(--primary)' }}>
                      {(Number(trendData[hoveredTrendIndex].salesRevenue) || 0).toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '0.725rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--danger-red)', fontWeight: 600 }}>Chi phí Tiêu hủy:</span>
                    <strong className="num-tabular" style={{ color: 'var(--danger-red)' }}>
                      {(Number(trendData[hoveredTrendIndex].spoilageCost) || 0).toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '0.725rem', borderTop: '1px dashed var(--border-subtle)', paddingTop: '4px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Dòng tiền giữ lại:</span>
                    <strong className="num-tabular" style={{ color: 'var(--text-main)' }}>
                      {(Number(trendData[hoveredTrendIndex].retainedProfit) || 0).toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Chú Thích Màu Biểu Đồ (Legend) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', paddingTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '3px', background: 'var(--primary)', borderRadius: '2px' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Doanh Thu Bán Lẻ FEFO (Dòng tiền vào quầy POS)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '2px', background: 'var(--danger-red)', borderRadius: '2px', borderTop: '2px dashed var(--danger-red)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--danger-red)', fontWeight: 600 }}>
                  Tổn Thất Tiêu Hủy Spoilage (Hàng quá hạn / Hư hỏng)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TOP 5 BÁN CHẠY NHẤT & TOP 5 HAO HỤT THẤT THOÁT (MỤC 11.2 ĐẶC TẢ) */}
        {activeVisualTab === 'TOP_PRODUCTS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 3 Thẻ Chỉ Số Tổng Hợp Top Analytics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--safe-green-bg)', border: '1px solid var(--safe-green-border)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--safe-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ArrowUpRight size={14} /> Quán Quân Bán Chạy #1 (Fast-Moving)
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {topSellingProducts[0]?.productName || 'Chưa có dữ liệu'}
                </div>
                <div className="num-tabular" style={{ fontSize: '0.75rem', color: 'var(--safe-green)', fontWeight: 700, marginTop: '2px' }}>
                  {topSellingProducts[0]?.totalQuantitySold || 0} {topSellingProducts[0]?.unit || 'SP'} ({Number(topSellingProducts[0]?.totalRevenue || 0).toLocaleString('vi-VN')} đ)
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--danger-red-bg)', border: '1px solid var(--danger-red-border)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--danger-red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <TrendingDown size={14} /> Điểm Nóng Hao Hụt #1 (Spoilage)
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {topSpoilageProducts[0]?.productName || 'Chưa có dữ liệu'}
                </div>
                <div className="num-tabular" style={{ fontSize: '0.75rem', color: 'var(--danger-red)', fontWeight: 700, marginTop: '2px' }}>
                  Thiệt hại: {Number(topSpoilageProducts[0]?.totalCostLoss || 0).toLocaleString('vi-VN')} đ ({topSpoilageProducts[0]?.totalQuantityDisposed || 0} {topSpoilageProducts[0]?.unit || 'SP'})
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tỷ Trọng Doanh Thu Của Top 5</div>
                <div className="num-tabular" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                  {total14dSales > 0 
                    ? Math.min(100, Math.round((topSellingProducts.reduce((s, p) => s + Number(p.totalRevenue || 0), 0) / total14dSales) * 100)) 
                    : 100} %
                </div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: '2px' }}>Nhóm dẫn dắt tốc độ quay vòng vốn</div>
              </div>
            </div>

            {/* Hai Cột So Sánh Trực Quan: Horizontal Bars Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
              {/* CỘT 1: TOP 5 BÁN CHẠY NHẤT (Horizontal Progress Bar) */}
              <div style={{
                padding: '16px 18px',
                borderRadius: '10px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--safe-green-bg)', color: 'var(--safe-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Award size={16} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                        Top 5 Mặt Hàng Bán Nhanh Nhất (Fast-Moving)
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Sản lượng xuất kho FEFO và tốc độ tiêu thụ bình quân ngày
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--safe-green-bg)', color: 'var(--safe-green)', fontWeight: 700, border: '1px solid var(--safe-green-border)' }}>
                    FEFO Velocity
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topSellingProducts.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Chưa có dữ liệu bán hàng.
                    </div>
                  ) : (
                    topSellingProducts.map((p, idx) => {
                      const maxQty = Math.max(1, ...topSellingProducts.map(i => Number(i.totalQuantitySold || 0)));
                      const qty = Number(p.totalQuantitySold || 0);
                      const barWidth = Math.max(8, Math.round((qty / maxQty) * 100));

                      return (
                        <div key={p.productId || idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '6px',
                                background: idx === 0 ? '#f59e0b' : (idx === 1 ? '#94a3b8' : (idx === 2 ? '#b45309' : 'var(--bg-surface)')),
                                color: idx < 3 ? '#ffffff' : 'var(--text-secondary)',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                #{idx + 1}
                              </span>
                              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.productName}</span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>[{p.productSku}]</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className="num-tabular" style={{ fontWeight: 800, color: 'var(--safe-green)' }}>
                                {qty} {p.unit || 'SP'}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginLeft: '6px' }}>
                                ({Number(p.totalRevenue || 0).toLocaleString('vi-VN')} đ)
                              </span>
                            </div>
                          </div>

                          {/* Horizontal Bar Chart */}
                          <div style={{ width: '100%', height: '8px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${barWidth}%`,
                              height: '100%',
                              borderRadius: '4px',
                              background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                              transition: 'width 0.4s ease'
                            }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                            <span>Ngành: {p.categoryName || 'FMCG'}</span>
                            <span>Tốc độ bán: <strong>{p.dailyVelocity || (qty / 14).toFixed(1)}</strong> {p.unit || 'SP'}/ngày</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* CỘT 2: TOP 5 HAO HỤT THẤT THOÁT CAO NHẤT (Horizontal Progress Bar) */}
              <div style={{
                padding: '16px 18px',
                borderRadius: '10px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--danger-red-bg)', color: 'var(--danger-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                        Top 5 Mặt Hàng Thất Thoát Cao Nhất (Spoilage Loss)
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Giá trị vốn mất mát lũy kế cần hạ điểm đặt hàng ROP
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--danger-red-bg)', color: 'var(--danger-red)', fontWeight: 700, border: '1px solid var(--danger-red-border)' }}>
                    Cần Kiểm Soát
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topSpoilageProducts.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Không có sản phẩm nào phát sinh thất thoát tiêu hủy.
                    </div>
                  ) : (
                    topSpoilageProducts.map((p, idx) => {
                      const maxLoss = Math.max(1, ...topSpoilageProducts.map(i => Number(i.totalCostLoss || 0)));
                      const loss = Number(p.totalCostLoss || 0);
                      const barWidth = Math.max(8, Math.round((loss / maxLoss) * 100));

                      return (
                        <div key={p.productId || idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '6px',
                                background: idx === 0 ? 'var(--danger-red)' : 'var(--bg-surface)',
                                color: idx === 0 ? '#ffffff' : 'var(--danger-red)',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid var(--danger-red-border)'
                              }}>
                                #{idx + 1}
                              </span>
                              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.productName}</span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>[{p.productSku}]</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className="num-tabular" style={{ fontWeight: 800, color: 'var(--danger-red)' }}>
                                {loss.toLocaleString('vi-VN')} đ
                              </span>
                            </div>
                          </div>

                          {/* Horizontal Bar Chart */}
                          <div style={{ width: '100%', height: '8px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${barWidth}%`,
                              height: '100%',
                              borderRadius: '4px',
                              background: 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                              transition: 'width 0.4s ease'
                            }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                            <span>Ngành: {p.categoryName || 'FMCG'}</span>
                            <span>Đã hủy: <strong>{p.totalQuantityDisposed}</strong> {p.unit || 'SP'} ({p.disposalCount} đợt)</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CƠ CẤU 7 NGÀNH HÀNG FMCG & ĐÁNH GIÁ RỦI RO HẠN DÙNG (MỤC 6 ĐẶC TẢ) */}
        {activeVisualTab === 'CATEGORY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ margin: 0, fontSize: '0.785rem', color: 'var(--text-muted)' }}>
              Giám sát cân bằng cơ cấu rủi ro hạn dùng theo từng điều kiện bảo quản nhiệt độ chuẩn FMCG:
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    <th style={{ padding: '10px 12px' }}>Ngành Hàng FMCG</th>
                    <th style={{ padding: '10px 12px' }}>Nhiệt Độ Bảo Quản</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Sản Phẩm / Lô</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Tồn Khả Dụng</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Vốn Lưu Kho (đ)</th>
                    <th style={{ padding: '10px 12px' }}>Tỷ Trọng Rủi Ro Cận Date</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Hao Hụt Đã Hủy</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Đánh Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map((cat) => {
                    const invVal = Number(cat.inventoryValue || 0);
                    const riskVal = Number(cat.atRiskValue || 0);
                    const spoilLoss = Number(cat.totalSpoilageLoss || 0);
                    const riskRatio = invVal > 0 ? Math.min(100, Math.round((riskVal / invVal) * 100)) : 0;
                    const isHighRisk = riskVal > 0 || spoilLoss > 500000;

                    return (
                      <tr key={cat.categoryId} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}>
                        {/* Ngành hàng & Mã */}
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{cat.categoryName}</div>
                          <div style={{ fontSize: '0.675rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>[{cat.categoryCode}]</div>
                        </td>

                        {/* Nhiệt độ bảo quản */}
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.725rem',
                            color: cat.storageTemperature.includes('Đông lạnh') ? 'var(--primary)' : (cat.storageTemperature.includes('Mát') ? '#0ea5e9' : 'var(--text-muted)')
                          }}>
                            <Thermometer size={13} />
                            {cat.storageTemperature}
                          </span>
                        </td>

                        {/* Số SP & Lô */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{cat.productCount}</span> SP
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}> ({cat.activeBatchCount} lô)</span>
                        </td>

                        {/* Tồn khả dụng */}
                        <td className="num-tabular" style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-main)' }}>
                          {Number(cat.totalStock || 0).toLocaleString('vi-VN')}
                        </td>

                        {/* Vốn tồn kho */}
                        <td className="num-tabular" style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                          {invVal.toLocaleString('vi-VN')} đ
                        </td>

                        {/* Progress Bar Tỷ Trọng Rủi Ro */}
                        <td style={{ padding: '10px 12px', minWidth: '160px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.675rem', marginBottom: '3px' }}>
                            <span style={{ color: riskVal > 0 ? 'var(--warning-yellow)' : 'var(--text-dim)' }}>
                              {riskVal.toLocaleString('vi-VN')} đ
                            </span>
                            <span style={{ fontWeight: 700, color: riskRatio > 30 ? 'var(--danger-red)' : (riskRatio > 0 ? 'var(--warning-yellow)' : 'var(--text-dim)') }}>
                              {riskRatio}%
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                            <div style={{
                              width: `${riskRatio}%`,
                              height: '100%',
                              borderRadius: '3px',
                              background: riskRatio > 30 ? 'var(--danger-red)' : (riskRatio > 0 ? 'var(--warning-yellow)' : 'var(--primary)')
                            }} />
                          </div>
                        </td>

                        {/* Hao hụt đã hủy */}
                        <td className="num-tabular" style={{ padding: '10px 12px', textAlign: 'right', fontWeight: spoilLoss > 0 ? 700 : 500, color: spoilLoss > 0 ? 'var(--danger-red)' : 'var(--text-muted)' }}>
                          {spoilLoss.toLocaleString('vi-VN')} đ
                        </td>

                        {/* Đánh giá */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {isHighRisk ? (
                            <span style={{ fontSize: '0.675rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--warning-yellow-bg)', color: 'var(--warning-yellow)', border: '1px solid var(--warning-yellow-border)', fontWeight: 700 }}>
                              Cần Rà Soát Date
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.675rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid var(--primary-border)', fontWeight: 700 }}>
                              An Toàn
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TOP 5 BÁN CHẠY NHẤT & TOP 5 HAO HỤT THẤT THOÁT (MỤC 11.2 ĐẶC TẢ) */}
        {activeVisualTab === 'TOP_PRODUCTS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 3 Thẻ Chỉ Số Tổng Hợp Top Analytics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--safe-green-bg)', border: '1px solid var(--safe-green-border)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--safe-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ArrowUpRight size={14} /> Quán Quân Bán Chạy #1 (Fast-Moving)
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {topSellingProducts[0]?.productName || 'Chưa có dữ liệu'}
                </div>
                <div className="num-tabular" style={{ fontSize: '0.75rem', color: 'var(--safe-green)', fontWeight: 700, marginTop: '2px' }}>
                  {topSellingProducts[0]?.totalQuantitySold || 0} {topSellingProducts[0]?.unit || 'SP'} ({Number(topSellingProducts[0]?.totalRevenue || 0).toLocaleString('vi-VN')} đ)
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--danger-red-bg)', border: '1px solid var(--danger-red-border)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--danger-red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <TrendingDown size={14} /> Điểm Nóng Hao Hụt #1 (Spoilage)
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {topSpoilageProducts[0]?.productName || 'Chưa có dữ liệu'}
                </div>
                <div className="num-tabular" style={{ fontSize: '0.75rem', color: 'var(--danger-red)', fontWeight: 700, marginTop: '2px' }}>
                  Thiệt hại: {Number(topSpoilageProducts[0]?.totalCostLoss || 0).toLocaleString('vi-VN')} đ ({topSpoilageProducts[0]?.totalQuantityDisposed || 0} {topSpoilageProducts[0]?.unit || 'SP'})
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tỷ Trọng Doanh Thu Của Top 5</div>
                <div className="num-tabular" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                  {total14dSales > 0 
                    ? Math.min(100, Math.round((topSellingProducts.reduce((s, p) => s + Number(p.totalRevenue || 0), 0) / total14dSales) * 100)) 
                    : 100} %
                </div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: '2px' }}>Nhóm dẫn dắt tốc độ quay vòng vốn</div>
              </div>
            </div>

            {/* Hai Cột So Sánh Trực Quan: Horizontal Bars Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
              {/* CỘT 1: TOP 5 BÁN CHẠY NHẤT (Horizontal Progress Bar) */}
              <div style={{
                padding: '16px 18px',
                borderRadius: '10px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--safe-green-bg)', color: 'var(--safe-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Award size={16} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                        Top 5 Mặt Hàng Bán Nhanh Nhất (Fast-Moving)
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Sản lượng xuất kho FEFO và tốc độ tiêu thụ bình quân ngày
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--safe-green-bg)', color: 'var(--safe-green)', fontWeight: 700, border: '1px solid var(--safe-green-border)' }}>
                    FEFO Velocity
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topSellingProducts.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Chưa có dữ liệu bán hàng.
                    </div>
                  ) : (
                    topSellingProducts.map((p, idx) => {
                      const maxQty = Math.max(1, ...topSellingProducts.map(i => Number(i.totalQuantitySold || 0)));
                      const qty = Number(p.totalQuantitySold || 0);
                      const barWidth = Math.max(8, Math.round((qty / maxQty) * 100));

                      return (
                        <div key={p.productId || idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '6px',
                                background: idx === 0 ? '#f59e0b' : (idx === 1 ? '#94a3b8' : (idx === 2 ? '#b45309' : 'var(--bg-surface)')),
                                color: idx < 3 ? '#ffffff' : 'var(--text-secondary)',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                #{idx + 1}
                              </span>
                              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.productName}</span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>[{p.productSku}]</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className="num-tabular" style={{ fontWeight: 800, color: 'var(--safe-green)' }}>
                                {qty} {p.unit || 'SP'}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginLeft: '6px' }}>
                                ({Number(p.totalRevenue || 0).toLocaleString('vi-VN')} đ)
                              </span>
                            </div>
                          </div>

                          {/* Horizontal Bar Chart */}
                          <div style={{ width: '100%', height: '8px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${barWidth}%`,
                              height: '100%',
                              borderRadius: '4px',
                              background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                              transition: 'width 0.4s ease'
                            }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                            <span>Ngành: {p.categoryName || 'FMCG'}</span>
                            <span>Tốc độ bán: <strong>{p.dailyVelocity || (qty / 14).toFixed(1)}</strong> {p.unit || 'SP'}/ngày</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* CỘT 2: TOP 5 HAO HỤT THẤT THOÁT CAO NHẤT (Horizontal Progress Bar) */}
              <div style={{
                padding: '16px 18px',
                borderRadius: '10px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--danger-red-bg)', color: 'var(--danger-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                        Top 5 Mặt Hàng Thất Thoát Cao Nhất (Spoilage Loss)
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Giá trị vốn mất mát lũy kế cần hạ điểm đặt hàng ROP
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--danger-red-bg)', color: 'var(--danger-red)', fontWeight: 700, border: '1px solid var(--danger-red-border)' }}>
                    Cần Kiểm Soát
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topSpoilageProducts.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Không có sản phẩm nào phát sinh thất thoát tiêu hủy.
                    </div>
                  ) : (
                    topSpoilageProducts.map((p, idx) => {
                      const maxLoss = Math.max(1, ...topSpoilageProducts.map(i => Number(i.totalCostLoss || 0)));
                      const loss = Number(p.totalCostLoss || 0);
                      const barWidth = Math.max(8, Math.round((loss / maxLoss) * 100));

                      return (
                        <div key={p.productId || idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '6px',
                                background: idx === 0 ? 'var(--danger-red)' : 'var(--bg-surface)',
                                color: idx === 0 ? '#ffffff' : 'var(--danger-red)',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid var(--danger-red-border)'
                              }}>
                                #{idx + 1}
                              </span>
                              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.productName}</span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>[{p.productSku}]</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className="num-tabular" style={{ fontWeight: 800, color: 'var(--danger-red)' }}>
                                {loss.toLocaleString('vi-VN')} đ
                              </span>
                            </div>
                          </div>

                          {/* Horizontal Bar Chart */}
                          <div style={{ width: '100%', height: '8px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${barWidth}%`,
                              height: '100%',
                              borderRadius: '4px',
                              background: 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                              transition: 'width 0.4s ease'
                            }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                            <span>Ngành: {p.categoryName || 'FMCG'}</span>
                            <span>Đã hủy: <strong>{p.totalQuantityDisposed}</strong> {p.unit || 'SP'} ({p.disposalCount} đợt)</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ACTION BOARD CA TRỰC KHẨN CẤP (MỤC 11.3 ĐẶC TẢ) */}
      <div style={{
        padding: '20px 22px',
        borderRadius: '12px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={18} color="var(--danger-red)" />
                Bảng Nhiệm Vụ Ca Trực Khẩn Cấp (Shift Action Board)
              </h2>
              <span style={{ fontSize: '0.675rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--danger-red-bg)', color: 'var(--danger-red)', fontWeight: 700, border: '1px solid var(--danger-red-border)' }}>
                SOP Bắt Buộc
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Phân định rõ 3 luồng công việc cần nhân viên ca trực xử lý dứt điểm trước khi bàn giao ca
            </p>
          </div>

          {/* 3 Tabs Phân Luồng Nhiệm Vụ */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveActionTab('MARKDOWN')}
              style={{
                fontSize: '0.75rem',
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeActionTab === 'MARKDOWN' ? 'var(--danger-red-border)' : 'var(--border-subtle)',
                background: activeActionTab === 'MARKDOWN' ? 'var(--danger-red-bg)' : 'var(--bg-subtle)',
                color: activeActionTab === 'MARKDOWN' ? 'var(--danger-red)' : 'var(--text-secondary)',
                fontWeight: activeActionTab === 'MARKDOWN' ? 700 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Zap size={13} color="var(--danger-red)" />
              <span>1. Dán Tem Giảm Giá ({urgentMarkdownList.length})</span>
            </button>

            <button
              onClick={() => setActiveActionTab('ROTATION')}
              style={{
                fontSize: '0.75rem',
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeActionTab === 'ROTATION' ? 'var(--warning-yellow-border)' : 'var(--border-subtle)',
                background: activeActionTab === 'ROTATION' ? 'var(--warning-yellow-bg)' : 'var(--bg-subtle)',
                color: activeActionTab === 'ROTATION' ? 'var(--warning-yellow)' : 'var(--text-secondary)',
                fontWeight: activeActionTab === 'ROTATION' ? 700 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <RotateCw size={13} color="var(--warning-yellow)" />
              <span>2. Đảo Kệ Mặt Tiền ({shelfRotationTasks.length})</span>
            </button>

            <button
              onClick={() => setActiveActionTab('DISPOSAL')}
              style={{
                fontSize: '0.75rem',
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeActionTab === 'DISPOSAL' ? 'var(--expired-purple-border)' : 'var(--border-subtle)',
                background: activeActionTab === 'DISPOSAL' ? 'var(--expired-purple-bg)' : 'var(--bg-subtle)',
                color: activeActionTab === 'DISPOSAL' ? 'var(--expired-purple)' : 'var(--text-muted)',
                fontWeight: activeActionTab === 'DISPOSAL' ? 700 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Trash2 size={13} color="var(--expired-purple)" />
              <span>3. Gom Tiêu Hủy ({disposalPendingList.length})</span>
            </button>

            <button
              onClick={() => setActiveActionTab('ROP')}
              style={{
                fontSize: '0.75rem',
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeActionTab === 'ROP' ? 'var(--primary-border)' : 'var(--border-subtle)',
                background: activeActionTab === 'ROP' ? 'var(--primary-bg)' : 'var(--bg-subtle)',
                color: activeActionTab === 'ROP' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: activeActionTab === 'ROP' ? 700 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Package size={13} color="var(--primary)" />
              <span>4. Chạm Ngưỡng ROP ({ropAlertItems.length})</span>
            </button>

            <button
              onClick={() => setActiveActionTab('TRANSFER')}
              style={{
                fontSize: '0.75rem',
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeActionTab === 'TRANSFER' ? 'var(--primary-border)' : 'var(--border-subtle)',
                background: activeActionTab === 'TRANSFER' ? 'var(--primary-bg)' : 'var(--bg-subtle)',
                color: activeActionTab === 'TRANSFER' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: activeActionTab === 'TRANSFER' ? 700 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <ArrowLeftRight size={13} color="var(--primary)" />
              <span>5. Điều Chuyển Hàng AI ({displayProposals.length})</span>
            </button>
          </div>
        </div>

        {/* NỘI DUNG TỪNG TAB ACTION BOARD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
          
          {/* TAB 1: DÁN TEM GIẢM GIÁ GẤP */}
          {activeActionTab === 'MARKDOWN' && (
            urgentMarkdownList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 14px', background: 'var(--primary-bg)', borderRadius: '8px', border: '1px solid var(--primary-border)' }}>
                <CheckCircle2 size={24} color="var(--primary)" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Không có lô hàng nào cần giảm giá khẩn cấp
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Toàn bộ sản phẩm trên quầy đều nằm trong ngưỡng an toàn hoặc đã được xả hàng kịp thời.
                </div>
              </div>
            ) : (
              urgentMarkdownList.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.825rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {item.productName}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Lô: <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{item.batchCode}</strong> • Tồn: <strong style={{ color: 'var(--text-main)' }}>{item.currentQuantity} {item.unit}</strong> • Còn hạn: <strong style={{ color: 'var(--danger-red)' }}>{item.daysLeft} ngày</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.discountPercent > 0 ? (
                      <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'var(--warning-yellow-bg)', color: 'var(--warning-yellow)', border: '1px solid var(--warning-yellow-border)' }}>
                        ✓ Đã Giảm {item.discountPercent}%
                      </span>
                    ) : !isManagerOrAdmin ? (
                      <button
                        onClick={() => {
                          if (onRequestAdminLogin) onRequestAdminLogin();
                        }}
                        title="Thao tác đổi giá xả hàng yêu cầu Cửa hàng trưởng hoặc Quản trị viên phê duyệt"
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Lock size={12} />
                        <span>Cần Quản Lý Duyệt</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (onQuickDiscount) onQuickDiscount(item.batchId, 50);
                        }}
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'var(--danger-red)',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 4px rgba(225, 29, 72, 0.25)'
                        }}
                      >
                        <Zap size={12} />
                        <span>Giảm 50% Xả Gấp</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )
          )}

          {/* TAB 2: ĐẢO KỆ MẶT TIỀN */}
          {activeActionTab === 'ROTATION' && (
            <div>
              {rotationSuccess && (
                <div style={{ padding: '8px 12px', marginBottom: '10px', borderRadius: '6px', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} />
                  <span>{rotationSuccess}</span>
                </div>
              )}

              {shelfRotationTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 14px', background: 'var(--primary-bg)', borderRadius: '8px', border: '1px solid var(--primary-border)' }}>
                  <CheckCircle2 size={24} color="var(--primary)" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                    100% lô cận date đã được đảo ra mặt tiền kệ trưng bày
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Quy trình SOP đảo kệ mặt tiền của ca trực đã được thực hiện chuẩn xác.
                  </div>
                </div>
              ) : (
                shelfRotationTasks.map((item, idx) => {
                  const targetId = item.id || item.batchId;
                  const isProcessing = rotatingId === targetId;

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        marginBottom: '8px',
                        borderRadius: '8px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.825rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {item.productName}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Lô: <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{item.batchCode}</strong> • Tồn kệ: <strong style={{ color: 'var(--text-main)' }}>{item.currentQuantity} {item.unit}</strong> • Còn: <strong style={{ color: 'var(--warning-yellow)' }}>{item.daysLeft} ngày</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {onRotateShelf && (
                          <button
                            disabled={isProcessing}
                            onClick={async () => {
                              setRotatingId(targetId);
                              try {
                                const res = await onRotateShelf(targetId);
                                if (res && res.success !== false) {
                                  setRotationSuccess(`✓ Đã xác nhận SOP đảo kệ mặt tiền cho lô ${item.batchCode}!`);
                                  setTimeout(() => setRotationSuccess(''), 4000);
                                }
                              } catch (e) {
                                console.error('Lỗi đảo kệ:', e);
                              } finally {
                                setRotatingId(null);
                              }
                            }}
                            style={{
                              fontSize: '0.725rem',
                              fontWeight: 700,
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: '1px solid var(--warning-yellow-border)',
                              background: 'var(--warning-yellow-bg)',
                              color: 'var(--warning-yellow)',
                              cursor: isProcessing ? 'wait' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              opacity: isProcessing ? 0.7 : 1
                            }}
                          >
                            <RotateCw size={12} className={isProcessing ? 'spin' : ''} />
                            <span>{isProcessing ? 'Đang xác nhận...' : 'Đảo Kệ Nhanh'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => setActiveTab('fefo-monitor')}
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="Xem chi tiết tại màn hình Giám sát FEFO"
                        >
                          <span>Chi tiết</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: GOM TIÊU HỦY */}
          {activeActionTab === 'DISPOSAL' && (
            disposalPendingList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 14px', background: 'var(--primary-bg)', borderRadius: '8px', border: '1px solid var(--primary-border)' }}>
                <CheckCircle2 size={24} color="var(--primary)" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Không có hàng quá hạn tồn đọng trên kệ
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Toàn bộ các lô quá hạn trước đó đã được tiêu hủy và ghi vào Sổ hao hụt tài chính bất biến.
                </div>
              </div>
            ) : (
              disposalPendingList.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.825rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {item.productName}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Lô: <strong style={{ fontFamily: 'monospace', color: 'var(--expired-purple)' }}>{item.batchCode}</strong> • Tồn: <strong style={{ color: 'var(--danger-red)' }}>{item.currentQuantity} {item.unit}</strong> • Tổn thất ước tính: <strong style={{ color: 'var(--danger-red)' }}>{item.potentialCostLoss.toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('spoilage-disposal')}
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--danger-red-border)',
                      background: 'var(--danger-red-bg)',
                      color: 'var(--danger-red)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={12} />
                    <span>Lập Phiếu Tiêu Hủy</span>
                  </button>
                </div>
              ))
            )
          )}

          {/* TAB 4: CẢNH BÁO TỒN KHO CHẠM ĐIỂM ĐẶT HÀNG ROP (MỤC 11.3 DÒNG 360) */}
          {activeActionTab === 'ROP' && (
            ropAlertItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 14px', background: 'var(--primary-bg)', borderRadius: '8px', border: '1px solid var(--primary-border)' }}>
                <CheckCircle2 size={24} color="var(--primary)" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Tồn kho toàn bộ sản phẩm đều cao hơn ngưỡng ROP
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Chưa có mặt hàng nào cần phát lệnh đặt hàng khẩn cấp về Kho tổng DC Biên Hòa.
                </div>
              </div>
            ) : (
              ropAlertItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.825rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {item.productName} <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--primary)' }}>({item.productSku})</span>
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Tồn hiện tại: <strong style={{ color: 'var(--warning-yellow)' }}>{item.currentStock} {item.unit}</strong> • Điểm đặt hàng: <strong style={{ color: 'var(--primary)' }}>ROP = {item.reorderPoint}</strong> • Đề xuất đặt: <strong>+{item.suggestedOrderQuantity} {item.unit}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('reorder-predictor')}
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--primary-border)',
                      background: 'var(--primary-bg)',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Package size={12} />
                    <span>{isManagerOrAdmin ? 'Đặt Hàng DC Ngay' : 'Xem Đề Xuất PO'}</span>
                  </button>
                </div>
              ))
            )
          )}

          {/* TAB 5: ĐỀ XUẤT ĐIỀU CHUYỂN LIÊN CỬA HÀNG (AI LIGHTGBM + GOOGLE OR-TOOLS MILP) */}
          {activeActionTab === 'TRANSFER' && (
            displayProposals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 14px', background: 'var(--primary-bg)', borderRadius: '8px', border: '1px solid var(--primary-border)' }}>
                <CheckCircle2 size={24} color="var(--primary)" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Cân bằng tồn kho chuỗi 3 cửa hàng đạt mức tối ưu
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Thuật toán MILP Google OR-Tools xác nhận không có chi nhánh nào bị lệch tồn kho cận date cần san tải.
                </div>
              </div>
            ) : (
              displayProposals.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.825rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {item.productName}
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--primary-bg)', color: 'var(--primary)', fontWeight: 600, border: '1px solid var(--primary-border)' }}>
                        {item.fromStoreName || 'Kho B'} ➔ {item.toStoreName || 'Cửa hàng A'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      Đề xuất chuyển: <strong style={{ color: 'var(--primary)' }}>{item.quantity} {item.unit || 'đơn vị'}</strong> • Tiết kiệm dự kiến: <strong style={{ color: 'var(--primary)' }}>+{Number(item.costSaving || 0).toLocaleString('vi-VN')} đ</strong> • {item.reason}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('stock-transfer')}
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--primary-border)',
                      background: 'var(--primary-bg)',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ArrowLeftRight size={12} />
                    <span>Xem & Duyệt Điều Chuyển</span>
                  </button>
                </div>
              ))
            )
          )}

        </div>
      </div>

      {/* BẢNG XẾP HẠNG TOP 5 BÁN CHẠY vs TOP 5 PHÁT SINH HAO HỤT (MỤC 11.2 DÒNG 350-351 ĐẶC TẢ) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {/* CỘT 1: TOP 5 SẢN PHẨM CÓ TỐC ĐỘ BÁN NHANH NHẤT */}
        <div style={{
          padding: '18px 20px',
          borderRadius: '12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text-main)' }}>
                <ArrowUpRight size={17} color="var(--safe-green)" />
                Top 5 Sản Phẩm Bán Chạy Nhất
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Xếp hạng theo tổng sản lượng tiêu thụ thực tế tại quầy POS
              </p>
            </div>
            <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--safe-green-bg)', color: 'var(--safe-green)', fontWeight: 700, border: '1px solid var(--safe-green-border)' }}>
              Fast-Moving
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {topSellingProducts.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Chưa có dữ liệu giao dịch bán hàng.
              </div>
            ) : (
              topSellingProducts.map((tp, idx) => (
                <div
                  key={tp.productId || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      background: idx === 0 ? 'var(--safe-green)' : 'var(--bg-surface)',
                      color: idx === 0 ? '#fff' : 'var(--text-secondary)',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{tp.productName}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{tp.productSku}</span> • {tp.categoryName || 'FMCG'}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--safe-green)', fontFamily: 'monospace' }}>
                      {tp.totalQuantitySold} {tp.unit || 'SP'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {Number(tp.totalRevenue || 0).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CỘT 2: TOP 5 SẢN PHẨM PHÁT SINH HAO HỤT NHIỀU NHẤT */}
        <div style={{
          padding: '18px 20px',
          borderRadius: '12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text-main)' }}>
                <TrendingDown size={17} color="var(--danger-red)" />
                Top 5 Sản Phẩm Hao Hụt Cao Nhất
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Xếp hạng theo giá trị vốn tổn thất lũy kế trên Sổ hao hụt tài chính
              </p>
            </div>
            <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--danger-red-bg)', color: 'var(--danger-red)', fontWeight: 700, border: '1px solid var(--danger-red-border)' }}>
              Spoilage Loss
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {topSpoilageProducts.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Chưa phát sinh tổn thất tiêu hủy nào.
              </div>
            ) : (
              topSpoilageProducts.map((sp, idx) => (
                <div
                  key={sp.productId || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      background: idx === 0 ? 'var(--danger-red)' : 'var(--bg-surface)',
                      color: idx === 0 ? '#fff' : 'var(--text-secondary)',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{sp.productName}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{sp.productSku}</span> • Đã hủy: {sp.totalQuantityDisposed} {sp.unit || 'SP'} ({sp.disposalCount} phiếu)
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--danger-red)', fontFamily: 'monospace' }}>
                      -{Number(sp.totalCostLoss || 0).toLocaleString('vi-VN')} đ
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Vốn tổn thất
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* BẢNG DỰ BÁO NGUY CƠ Ứ ĐỌNG (DOS > DUE - ĐANG KHÓA) */}
      <div style={{
        padding: '20px 22px',
        borderRadius: '12px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <AlertTriangle size={17} color="var(--warning-yellow)" />
              Dự Báo Sản Phẩm Có Nguy Cơ Ứ Đọng (DOS &gt; DUE)
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Sản phẩm có số ngày bán hết lượng tồn (DOS) lớn hơn số ngày còn hạn sử dụng (DUE) — Cần kích cầu sớm
            </p>
          </div>
          <span style={{ fontSize: '0.725rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', fontWeight: 700 }}>
            Chuẩn Tự Động
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
          {highRiskItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 14px', background: 'var(--primary-bg)', borderRadius: '8px', border: '1px solid var(--primary-border)' }}>
              <ShieldCheck size={24} color="var(--primary)" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                Kho Hàng Khả Quan: Không phát hiện nguy cơ ứ đọng date
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Tốc độ bán hiện tại ($d$) đảm bảo giải phóng toàn bộ số tồn trước khi các lô hết hạn.
              </div>
            </div>
          ) : (
            highRiskItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.825rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Cần bán hết tồn: <strong style={{ color: 'var(--text-main)' }}>{item.dos}</strong> | Hạn dùng còn: <strong style={{ color: 'var(--danger-red)' }}>{item.due}</strong> ({item.batchCode})
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.675rem',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    background: item.risk === 'RẤT CAO' ? 'var(--danger-red-bg)' : 'var(--warning-yellow-bg)',
                    color: item.risk === 'RẤT CAO' ? 'var(--danger-red)' : 'var(--warning-yellow)',
                    border: `1px solid ${item.risk === 'RẤT CAO' ? 'var(--danger-red-border)' : 'var(--warning-yellow-border)'}`
                  }}>
                    RỦI RO {item.risk}
                  </span>

                  <button
                    onClick={() => {
                      if (onQuickDiscount) onQuickDiscount(item.batchId, 30);
                    }}
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      padding: '4px 9px',
                      borderRadius: '6px',
                      background: 'var(--primary)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Zap size={11} /> {item.action}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
