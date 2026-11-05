import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  Calculator, 
  Info,
  RotateCw,
  HelpCircle,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  Zap,
  Lock,
  Search,
  Filter,
  ShieldAlert,
  Boxes,
  Truck,
  Sun,
  CloudRain,
  Flame,
  Calendar,
  X,
  ArrowRight,
  FileText,
  Eye,
  Check,
  Clock,
  Printer,
  ShoppingBag,
  ArrowUpRight
} from 'lucide-react';
import { 
  fetchPurchaseOrders, 
  apiCreatePurchaseOrder, 
  apiUpdatePOStatus 
} from '../api';
import PurchaseOrdersSubView from './PurchaseOrdersSubView';

// Helper: Chuẩn hóa tiếng Việt không dấu
function normalizeText(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

// 7 Ngành hàng FMCG
const FMCG_CATEGORIES = [
  { id: 1, name: 'Sữa tươi & Sữa chua' },
  { id: 2, name: 'Thịt cá tươi sống' },
  { id: 3, name: 'Rau củ quả tươi' },
  { id: 4, name: 'Thực phẩm chế biến & Đóng hộp' },
  { id: 5, name: 'Bánh mì & Tráng miệng' },
  { id: 6, name: 'Đồ uống & Giải khát' },
  { id: 7, name: 'Gia vị & Khô' }
];

export default function ReorderPredictorView({ 
  products = [], 
  batches = [], 
  storeProfile = null,
  onSendPo,
  onQuickDiscount,
  isAdmin = false,
  currentRole = 'STORE_MANAGER',
  onRequestAdminLogin,
  setActiveTab
}) {
  const canManagePo = isAdmin || currentRole === 'ADMIN' || currentRole === 'STORE_MANAGER';
  const [activeViewTab, setActiveViewTab] = useState('forecast'); // 'forecast' | 'po-orders'
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [poStatusFilter, setPoStatusFilter] = useState('ALL');
  const [poSearch, setPoSearch] = useState('');
  const [selectedPoModal, setSelectedPoModal] = useState(null);
  const [isUpdatingPoStatus, setIsUpdatingPoStatus] = useState(false);

  const [leadTime, setLeadTime] = useState(1); // Lead time chuẩn từ DC Biên Hòa: 1 ngày
  const [weather, setWeather] = useState('NORMAL'); // NORMAL | SUNNY | RAINY
  const [isHoliday, setIsHoliday] = useState(false); // Cờ ngày lễ / cuối tuần cao điểm (+30%)
  const [createdPoMsg, setCreatedPoMsg] = useState('');
  const [loadingProductId, setLoadingProductId] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Load danh sách đơn PO từ CSDL SQL Server
  const loadPurchaseOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetchPurchaseOrders();
      if (res && res.data) {
        setPurchaseOrders(res.data);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách đơn PO:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  // Bộ lọc & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL'); // ALL, REORDER_NEEDED, SPOILAGE_RISK, BALANCED

  // Tính toán chỉ số phân tích tồn kho & ROP đa biến cho từng sản phẩm
  const calculateStockAnalysis = (prod) => {
    // Tồn kho khả dụng của các lô chưa hết hạn
    const availableStock = batches
      .filter(b => b.productId === prod.id && b.status !== 'EXPIRED' && b.alertColor !== 'EXPIRED')
      .reduce((sum, b) => sum + (b.currentQuantity !== undefined ? b.currentQuantity : (b.quantity || 0)), 0);

    // Tìm lô cận date nhất đang còn tồn kho
    const activeBatches = batches
      .filter(b => b.productId === prod.id && b.status !== 'EXPIRED' && b.alertColor !== 'EXPIRED' && (b.currentQuantity ?? b.quantity) > 0)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    const nearestBatch = activeBatches[0];
    let dueDays = 999;
    if (nearestBatch) {
      if (nearestBatch.daysLeft !== undefined && nearestBatch.daysLeft !== null) {
        dueDays = Math.max(0, Number(nearestBatch.daysLeft));
      } else {
        const exp = new Date(nearestBatch.expiryDate);
        const now = new Date();
        dueDays = Math.max(0, Math.ceil((exp - now) / (1000 * 60 * 60 * 24)));
      }
    }

    // 1. Tốc độ bán cơ sở 14 ngày (d_base)
    const dailyDemand = Number(prod.dailyDemand || Math.max(2, Math.round((prod.minStockLevel || 15) * 0.25)));

    // 2. Hệ số thời tiết W_factor theo ngành hàng
    const catNorm = normalizeText(prod.category || prod.categoryName || '');
    const catId = Number(prod.categoryId || 0);
    let wFactor = 1.00;
    if (weather === 'SUNNY') {
      if (catId === 6 || catNorm.includes('do uong') || catNorm.includes('giai khat')) wFactor = 1.30;
      else if (catId === 1 || catNorm.includes('sua')) wFactor = 1.15;
      else if (catId === 7 || catId === 4 || catNorm.includes('kho') || catNorm.includes('gia vi')) wFactor = 0.90;
      else wFactor = 1.05;
    } else if (weather === 'RAINY') {
      if (catId === 5 || catNorm.includes('banh') || catNorm.includes('trang mieng')) wFactor = 1.25;
      else if (catId === 7 || catId === 4 || catNorm.includes('kho') || catNorm.includes('che bien')) wFactor = 1.20;
      else if (catId === 6 || catNorm.includes('do uong')) wFactor = 0.80;
      else wFactor = 1.00;
    }

    // 3. Hệ số ngày lễ H_factor (+30%)
    const hFactor = isHoliday ? 1.30 : 1.00;

    // 4. Tốc độ bán điều chỉnh ngoại cảnh: d_adjusted = d_base * W_factor * H_factor
    const dAdjusted = Number((dailyDemand * wFactor * hFactor).toFixed(2));

    // Nếu lô gần nhất đã kích hoạt giảm giá xả hàng, tốc độ bán được kích cầu tăng 50% (K_discount = 1.5)
    const isDiscounted = nearestBatch?.isDiscounted || (nearestBatch?.discountPercent > 0);
    const effectiveDemand = isDiscounted ? Number((dAdjusted * 1.5).toFixed(2)) : dAdjusted;

    // Days of Supply: DOS = Tồn kho / Tốc độ bán điều chỉnh
    const dos = effectiveDemand > 0 ? Number((availableStock / effectiveDemand).toFixed(1)) : 0;

    // ROP = ceil((d_adjusted * LeadTime) + SafetyStock)
    const safetyStock = prod.safetyStock || Math.round((prod.minStockLevel || 15) * 0.4);
    const calculatedRop = Math.ceil((dAdjusted * leadTime) + safetyStock);

    // Cần tái đặt hàng khi tồn kho <= ROP
    const isReorderNeeded = availableStock <= calculatedRop;

    // Nguy cơ Spoilage (lãng phí date) khi DOS > DUE (Số ngày bán hết tồn kho lớn hơn số ngày còn hạn sử dụng)
    const isSpoilageRisk = (dos > dueDays || (availableStock / dAdjusted > dueDays && !isDiscounted)) && availableStock > 0 && dueDays <= 7;

    // Giải thích minh bạch AI/ROP
    const suggestedQty = Math.max(safetyStock, calculatedRop * 2 - availableStock);
    const aiExplanation = isReorderNeeded
      ? `Tồn (${availableStock}) ≤ ROP (${calculatedRop}) [d=${dailyDemand} × W=${wFactor} × H=${hFactor} → d_adj=${dAdjusted}]. Đề xuất đặt +${suggestedQty} ${prod.unit}`
      : isSpoilageRisk
        ? `Nguy cơ ứ đọng: DOS (${dos}d) > DUE (${dueDays}d). Khuyến nghị giảm giá Quick Markdown kích cầu`
        : `d_adj=${dAdjusted}/ngày (W=${wFactor}, H=${hFactor}) • Tồn an toàn (${availableStock} > ROP ${calculatedRop})`;

    return {
      availableStock,
      dailyDemand,
      wFactor,
      hFactor,
      dAdjusted,
      effectiveDemand,
      safetyStock,
      calculatedRop,
      suggestedQty,
      dos,
      dueDays,
      nearestBatch,
      isDiscounted,
      isReorderNeeded,
      isSpoilageRisk,
      aiExplanation
    };
  };

  // Thống kê tổng hợp KPI
  const stats = useMemo(() => {
    let reorderCount = 0;
    let spoilageRiskCount = 0;
    let balancedCount = 0;

    products.forEach(p => {
      const a = calculateStockAnalysis(p);
      if (a.isReorderNeeded) reorderCount++;
      if (a.isSpoilageRisk) spoilageRiskCount++;
      if (!a.isReorderNeeded && !a.isSpoilageRisk) balancedCount++;
    });

    return {
      totalProducts: products.length,
      reorderCount,
      spoilageRiskCount,
      balancedCount
    };
  }, [products, batches, leadTime, weather, isHoliday]);

  // Lọc sản phẩm theo tiêu chí
  const filteredProducts = useMemo(() => {
    return products.filter(prod => {
      // Lọc ngành hàng
      if (selectedCategory !== 'ALL') {
        const catId = Number(selectedCategory);
        if (prod.categoryId !== catId) return false;
      }

      const analysis = calculateStockAnalysis(prod);

      // Lọc trạng thái rủi ro
      if (riskFilter === 'REORDER_NEEDED' && !analysis.isReorderNeeded) return false;
      if (riskFilter === 'SPOILAGE_RISK' && !analysis.isSpoilageRisk) return false;
      if (riskFilter === 'BALANCED' && (analysis.isReorderNeeded || analysis.isSpoilageRisk)) return false;

      // Lọc tìm kiếm
      if (searchTerm.trim()) {
        const term = normalizeText(searchTerm);
        const nameNorm = normalizeText(prod.name);
        const skuNorm = normalizeText(prod.sku);
        if (!nameNorm.includes(term) && !skuNorm.includes(term)) return false;
      }

      return true;
    });
  }, [products, batches, leadTime, selectedCategory, riskFilter, searchTerm]);

  // Thống kê KPI Đơn đặt hàng PO
  const poStats = useMemo(() => {
    let pendingCount = 0;
    let shippingCount = 0;
    let completedCount = 0;
    let totalCost = 0;

    purchaseOrders.forEach(po => {
      if (po.status === 'PENDING' || po.status === 'APPROVED' || po.status === 'DRAFT') pendingCount++;
      else if (po.status === 'SHIPPING') shippingCount++;
      else if (po.status === 'COMPLETED') completedCount++;
      totalCost += Number(po.totalEstimatedCost || 0);
    });

    return {
      total: purchaseOrders.length,
      pendingCount,
      shippingCount,
      completedCount,
      totalCost
    };
  }, [purchaseOrders]);

  // Lọc danh sách Đơn đặt hàng PO
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      let matchesStatus = true;
      if (poStatusFilter !== 'ALL') {
        if (poStatusFilter === 'PENDING') {
          matchesStatus = po.status === 'PENDING' || po.status === 'APPROVED' || po.status === 'DRAFT';
        } else {
          matchesStatus = po.status === poStatusFilter;
        }
      }
      if (!poSearch.trim()) return matchesStatus;

      const norm = normalizeText(poSearch);
      const codeNorm = (po.orderCode || '').toLowerCase();
      const supNorm = normalizeText(po.supplierName || '');
      const itemMatch = po.items?.some(it => normalizeText(it.productName || '').includes(norm) || (it.productSku || '').toLowerCase().includes(norm));

      return matchesStatus && (codeNorm.includes(norm) || supNorm.includes(norm) || itemMatch);
    });
  }, [purchaseOrders, poStatusFilter, poSearch]);

  // Gửi lệnh đặt hàng PO về DC Biên Hòa
  const handleOrderFromDc = async (prod, suggestedQty) => {
    if (!canManagePo) {
      alert('Chỉ Quản trị viên (Admin) hoặc Cửa hàng trưởng mới có thẩm quyền tạo và phê duyệt đơn đặt hàng PO gửi Kho tổng DC!');
      if (onRequestAdminLogin) onRequestAdminLogin();
      return;
    }
    setLoadingProductId(prod.id);
    try {
      const poPayload = {
        supplierId: 1,
        expectedDeliveryDate: new Date(Date.now() + leadTime * 86400000).toISOString().split('T')[0],
        notes: `Đơn đặt hàng ROP bổ sung cho ${prod.name} (Tồn kho: ${prod.currentStock || 0}, Đề xuất: ${suggestedQty})`,
        items: [{
          productId: prod.id,
          currentStockAtOrder: prod.currentStock || 0,
          suggestedQuantity: Number(suggestedQty),
          approvedQuantity: Number(suggestedQty),
          unitCost: prod.costPrice || 25000,
          totalLineCost: Number(suggestedQty) * (prod.costPrice || 25000)
        }]
      };

      const res = await apiCreatePurchaseOrder(poPayload);
      if (res && (res.success || res.orderId || res.data)) {
        const orderCode = res.data?.orderCode || res.orderCode || `PO-DC-${Date.now().toString().slice(-6)}`;
        setCreatedPoMsg(`✓ Đã tạo thành công Đơn Đặt Hàng PO [${orderCode}] gửi về Kho tổng DC Biên Hòa (+${suggestedQty} ${prod.unit} "${prod.name}")!`);
        await loadPurchaseOrders();
      } else {
        const fallbackRes = await onSendPo(prod, suggestedQty);
        setCreatedPoMsg(`✓ Đã tạo lệnh tiếp tế PO gửi DC Biên Hòa cho ${suggestedQty} ${prod.unit} "${prod.name}"!`);
        await loadPurchaseOrders();
      }
    } catch (err) {
      setCreatedPoMsg(`Lỗi khi tạo đơn PO: ${err.message}`);
    } finally {
      setLoadingProductId(null);
      setTimeout(() => setCreatedPoMsg(''), 7000);
    }
  };

  // Cập nhật trạng thái vòng đời đơn PO (PENDING -> SHIPPING -> COMPLETED)
  const handleUpdatePoStatus = async (orderId, newStatus) => {
    if (!canManagePo) {
      alert('Chỉ Quản trị viên hoặc Cửa hàng trưởng mới có quyền thay đổi trạng thái đơn PO!');
      if (onRequestAdminLogin) onRequestAdminLogin();
      return;
    }

    setIsUpdatingPoStatus(true);
    try {
      const res = await apiUpdatePOStatus(orderId, newStatus, `Cập nhật sang trạng thái ${newStatus}`);
      if (res && res.success !== false) {
        setCreatedPoMsg(`✓ Đã cập nhật đơn PO #${orderId} sang trạng thái "${newStatus}"!`);
        await loadPurchaseOrders();
        if (selectedPoModal && selectedPoModal.id === orderId) {
          setSelectedPoModal(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        alert(res?.message || 'Không thể cập nhật trạng thái đơn PO!');
      }
    } catch (err) {
      alert(`Lỗi cập nhật: ${err.message}`);
    } finally {
      setIsUpdatingPoStatus(false);
      setTimeout(() => setCreatedPoMsg(''), 6000);
    }
  };

  // Kích hoạt Quick Markdown xả hàng
  const handleApplyDiscount = async (prod, batch) => {
    if (!canManagePo) {
      alert('Chỉ Quản trị viên hoặc Cửa hàng trưởng mới có quyền phê duyệt chính sách giảm giá xả hàng Quick Markdown!');
      if (onRequestAdminLogin) onRequestAdminLogin();
      return;
    }
    if (!batch || !onQuickDiscount) return;
    setLoadingProductId(prod.id);
    try {
      await onQuickDiscount(batch.id);
      setCreatedPoMsg(`⚡ Đã kích hoạt GIẢM GIÁ 30% xả hàng cho Lô ${batch.batchCode} (${prod.name})! Tốc độ bán được kích cầu tăng 50% để giải phóng hàng trước khi quá hạn.`);
    } catch (err) {
      setCreatedPoMsg(`Lỗi khi kích hoạt giảm giá: ${err.message}`);
    } finally {
      setLoadingProductId(null);
      setTimeout(() => setCreatedPoMsg(''), 7000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '16px 20px',
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'var(--safe-green-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--safe-green)',
            border: '1px solid var(--safe-green-border)'
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Dự Báo Tái Đặt Hàng & Cảnh Báo Ứ Đọng (ROP Forecast)
              </h2>
              <span style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'var(--primary-bg)',
                color: 'var(--primary)',
                fontWeight: 600,
                border: '1px solid var(--primary-border)'
              }}>
                AI Demand Forecast
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Tích hợp công thức chuẩn ROP = (d × L) + SS và phát hiện nghịch đảo DOS &gt; DUE ngăn chặn lãng phí date
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Cấu hình Thời Tiết (W_factor - Rule 8) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-subtle)',
            padding: '6px 10px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '0.82rem'
          }}>
            {weather === 'SUNNY' ? <Sun size={16} color="var(--warning-yellow)" /> : weather === 'RAINY' ? <CloudRain size={16} color="var(--primary)" /> : <Sun size={16} color="var(--text-secondary)" />}
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Thời tiết:</span>
            <select
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="NORMAL">Bình thường (W=1.0)</option>
              <option value="SUNNY">Nắng nóng (Đồ uống +30%, Sữa +15%)</option>
              <option value="RAINY">Mưa bão (Bánh mì +25%, Đồ khô +20%)</option>
            </select>
          </div>

          {/* Cờ Ngày Lễ (H_factor - Rule 8) */}
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: isHoliday ? 'var(--warning-yellow-bg)' : 'var(--bg-subtle)',
            padding: '6px 10px',
            borderRadius: '8px',
            border: `1px solid ${isHoliday ? 'var(--warning-yellow-border)' : 'var(--border-color)'}`,
            fontSize: '0.8rem',
            fontWeight: 700,
            color: isHoliday ? 'var(--warning-yellow)' : 'var(--text-secondary)',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={isHoliday}
              onChange={(e) => setIsHoliday(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
            <Calendar size={14} />
            <span>Ngày lễ (+30%)</span>
          </label>

          {/* Cấu hình Lead Time */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-subtle)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '0.82rem'
          }}>
            <Truck size={16} color="var(--primary)" />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Lead Time DC:</span>
            <select
              value={leadTime}
              onChange={(e) => setLeadTime(Number(e.target.value))}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.84rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value={1}>1 ngày (Chuẩn DC Biên Hòa)</option>
              <option value={2}>2 ngày (Dự phòng lễ/mưa)</option>
              <option value={3}>3 ngày (Sự cố vận tải)</option>
            </select>
          </div>

          <button
            onClick={() => setShowExplanation(!showExplanation)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <HelpCircle size={15} color="var(--primary)" />
            <span>{showExplanation ? 'Ẩn công thức ROP' : 'Xem công thức ROP'}</span>
            {showExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Thông báo thao tác PO thành công */}
      {createdPoMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: 'var(--safe-green)',
          padding: '12px 18px',
          borderRadius: '10px',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CheckCircle2 size={20} color="var(--safe-green)" />
          <span style={{ flex: 1, fontWeight: 500 }}>{createdPoMsg}</span>
          <button
            onClick={() => setCreatedPoMsg('')}
            style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* THANH TAB CHUYỂN ĐỔI CHẾ ĐỘ: DỰ BÁO ROP vs QUẢN LÝ ĐƠN HÀNG PO */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '12px',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveViewTab('forecast')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: activeViewTab === 'forecast' ? 'var(--primary-border)' : 'var(--border-subtle)',
              background: activeViewTab === 'forecast' ? 'var(--primary-bg)' : 'var(--bg-surface)',
              color: activeViewTab === 'forecast' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Calculator size={16} />
            <span>Dự Báo Nhu Cầu & Bảng Tính ROP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('po-orders')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: activeViewTab === 'po-orders' ? 'var(--primary-border)' : 'var(--border-subtle)',
              background: activeViewTab === 'po-orders' ? 'var(--primary-bg)' : 'var(--bg-surface)',
              color: activeViewTab === 'po-orders' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <FileText size={16} />
            <span>Quản Lý Đơn Đặt Hàng PO Gửi DC</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '999px',
              background: activeViewTab === 'po-orders' ? 'var(--primary)' : 'var(--bg-subtle)',
              color: activeViewTab === 'po-orders' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 800
            }}>
              {purchaseOrders.length}
            </span>
          </button>
        </div>

        {activeViewTab === 'po-orders' && (
          <button
            type="button"
            onClick={loadPurchaseOrders}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '0.785rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RotateCw size={13} className={loadingOrders ? 'spin' : ''} />
            <span>Làm mới danh sách PO</span>
          </button>
        )}
      </div>

      {/* NỘI DUNG TAB 1: DỰ BÁO ROP */}
      {activeViewTab === 'forecast' && (
        <>
          {/* Box giải thích công thức ROP & Hệ số ngoại cảnh (Collapsible) */}
      {showExplanation && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '18px 22px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '18px',
          fontSize: '0.84rem',
          boxShadow: 'var(--shadow-card)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div>
            <div style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calculator size={16} /> 1. Tốc độ bán hàng ngày (d - Daily Demand)
            </div>
            <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Tốc độ tiêu thụ trung bình trong 14 ngày gần nhất tại quầy POS. Hệ thống tự động nhân hệ số thời tiết (nắng nóng +40% cho nước giải khát) và ngày lễ (+30% thực phẩm tươi).
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--warning-yellow)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PackageCheck size={16} /> 2. Tồn kho an toàn (SS - Safety Stock)
            </div>
            <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Lượng hàng đệm dự phòng tối thiểu dưới đáy kệ để tránh nguy cơ đứt hàng khi khách mua đột biến hoặc xe DC giao trễ: <code>SS = 40% × minStockLevel</code>.
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--safe-green)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={16} /> 3. Điểm đặt hàng ROP & Rủi ro DOS &gt; DUE
            </div>
            <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong>ROP = (d × L) + SS</strong>. Khi <code>Tồn kho ≤ ROP</code>, hệ thống kích hoạt nút đặt hàng PO gửi DC. Nếu <code>DOS &gt; DUE</code> (bán không kịp trước khi hết date), hệ thống cảnh báo xả hàng Quick Markdown.
            </div>
          </div>
        </div>
      )}

      {/* 4 Cards KPI Thống Kê ROP */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Tổng SKU */}
        <div style={{
          padding: '18px 20px',
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: 'var(--primary-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            border: '1px solid var(--primary-border)'
          }}>
            <Boxes size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Tổng SKU Theo Dõi ROP
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {stats.totalProducts} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>mặt hàng</span>
            </div>
          </div>
        </div>

        {/* Card 2: Cần tái đặt hàng */}
        <div style={{
          padding: '18px 20px',
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: `1px solid ${stats.reorderCount > 0 ? 'var(--warning-yellow-border)' : 'var(--border-subtle)'}`,
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: stats.reorderCount > 0 ? 'var(--warning-yellow-bg)' : 'var(--safe-green-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: stats.reorderCount > 0 ? 'var(--warning-yellow)' : 'var(--safe-green)',
            border: `1px solid ${stats.reorderCount > 0 ? 'var(--warning-yellow-border)' : 'var(--safe-green-border)'}`
          }}>
            <Truck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Cần Tái Đặt Hàng (Stock ≤ ROP)
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: stats.reorderCount > 0 ? 'var(--warning-yellow)' : 'var(--text-main)', marginTop: '2px' }}>
              {stats.reorderCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>mã cần đặt</span>
            </div>
          </div>
        </div>

        {/* Card 3: Nguy cơ lãng phí DOS > DUE */}
        <div style={{
          padding: '18px 20px',
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: `1px solid ${stats.spoilageRiskCount > 0 ? 'var(--danger-red-border)' : 'var(--border-subtle)'}`,
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: stats.spoilageRiskCount > 0 ? 'var(--danger-red-bg)' : 'var(--safe-green-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: stats.spoilageRiskCount > 0 ? 'var(--danger-red)' : 'var(--safe-green)',
            border: `1px solid ${stats.spoilageRiskCount > 0 ? 'var(--danger-red-border)' : 'var(--safe-green-border)'}`
          }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Nguy Cơ Ứ Đọng (DOS &gt; DUE)
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: stats.spoilageRiskCount > 0 ? 'var(--danger-red)' : 'var(--text-main)', marginTop: '2px' }}>
              {stats.spoilageRiskCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>mã rủi ro</span>
            </div>
          </div>
        </div>

        {/* Card 4: Cân bằng tối ưu */}
        <div style={{
          padding: '18px 20px',
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: 'var(--safe-green-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--safe-green)',
            border: '1px solid var(--safe-green-border)'
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Tồn Kho Cân Bằng Tối Ưu
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {stats.balancedCount} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--safe-green)' }}>an toàn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Bộ Lọc & Tìm Kiếm */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        padding: '14px 18px',
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 14px',
          borderRadius: '8px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-color)',
          flex: '1 1 280px',
          maxWidth: '420px'
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Tìm theo mã SKU, tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '0.88rem',
              width: '100%'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Ngành hàng */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Ngành hàng:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Tất cả ngành hàng</option>
              {FMCG_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Phân loại rủi ro */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Trạng thái:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="REORDER_NEEDED">Cần tái đặt hàng (Stock ≤ ROP)</option>
              <option value="SPOILAGE_RISK">Nguy cơ ứ đọng date (DOS &gt; DUE)</option>
              <option value="BALANCED">Cân bằng tối ưu</option>
            </select>
          </div>

          <div style={{
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            padding: '5px 12px',
            borderRadius: '6px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            fontWeight: 500
          }}>
            Hiển thị <strong style={{ color: 'var(--primary)' }}>{filteredProducts.length}</strong> / {products.length} mặt hàng
          </div>
        </div>
      </div>

      {/* Main Analysis Table */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{
                background: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <th style={{ padding: '14px 18px', width: '260px' }}>Sản Phẩm & ĐVT</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Tốc Độ Bán (d)</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Tồn An Toàn (SS)</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Điểm Đặt Hàng (ROP)</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Tồn Thực Tế</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Số Ngày Bán (DOS)</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Hạn Gần Nhất (DUE)</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Đánh Giá Rủi Ro</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Hành Động Khuyến Nghị</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={36} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Không tìm thấy mặt hàng nào phù hợp bộ lọc</div>
                      <div style={{ fontSize: '0.82rem' }}>Thử tìm từ khóa khác hoặc chuyển tiêu chí lọc trạng thái.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const analysis = calculateStockAnalysis(prod);
                  const isItemLoading = loadingProductId === prod.id;

                  return (
                    <tr
                      key={prod.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Sản phẩm */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                          {prod.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{prod.sku}</span>
                          <span>•</span>
                          <span>ĐVT: {prod.unit}</span>
                          <span>•</span>
                          <span>HSD chuẩn: <strong>{prod.shelfLifeDays || 30}d</strong></span>
                        </div>
                        <div style={{ marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          🤖 AI: {analysis.aiExplanation}
                        </div>
                      </td>

                      {/* Tốc độ bán */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                          {analysis.dAdjusted} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>{prod.unit}/ngày</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                          d₀={analysis.dailyDemand} × W={analysis.wFactor} × H={analysis.hFactor}
                        </div>
                        {analysis.isDiscounted && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--warning-yellow)', fontWeight: 600, marginTop: '2px' }}>
                            ⚡ Kích cầu: {analysis.effectiveDemand}
                          </div>
                        )}
                      </td>

                      {/* Safety Stock */}
                      <td style={{ padding: '14px 18px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {analysis.safetyStock} {prod.unit}
                      </td>

                      {/* ROP */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'var(--primary-bg)',
                          color: 'var(--primary)',
                          border: '1px solid var(--primary-border)'
                        }}>
                          ROP = {analysis.calculatedRop}
                        </span>
                      </td>

                      {/* Tồn thực tế */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '1rem',
                          color: analysis.isReorderNeeded ? 'var(--warning-yellow)' : 'var(--safe-green)'
                        }}>
                          {analysis.availableStock} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>{prod.unit}</span>
                        </div>
                      </td>

                      {/* DOS */}
                      <td style={{ padding: '14px 18px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)' }}>
                        {analysis.dos} ngày
                      </td>

                      {/* DUE */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {analysis.dueDays < 900 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              color: analysis.dueDays <= 3 ? 'var(--danger-red)' : analysis.dueDays <= 7 ? 'var(--warning-yellow)' : 'var(--text-main)'
                            }}>
                              {analysis.dueDays} ngày
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              ({analysis.nearestBatch?.batchCode})
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Chưa có lô</span>
                        )}
                      </td>

                      {/* Đánh giá rủi ro */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {analysis.isSpoilageRisk ? (
                          <span style={{
                            fontSize: '0.74rem',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            background: 'var(--danger-red-bg)',
                            color: 'var(--danger-red)',
                            border: '1px solid var(--danger-red-border)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <AlertTriangle size={12} /> DOS &gt; DUE (Nguy cơ hủy)
                          </span>
                        ) : analysis.isReorderNeeded ? (
                          <span style={{
                            fontSize: '0.74rem',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            background: 'var(--warning-yellow-bg)',
                            color: 'var(--warning-yellow)',
                            border: '1px solid var(--warning-yellow-border)'
                          }}>
                            ⚠️ Cần Tái Đặt Hàng
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.74rem',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            background: 'var(--safe-green-bg)',
                            color: 'var(--safe-green)',
                            border: '1px solid var(--safe-green-border)'
                          }}>
                            ✓ Cân Bằng Tối Ưu
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {analysis.isReorderNeeded ? (
                          canManagePo ? (
                            <button
                              onClick={() => handleOrderFromDc(prod, analysis.calculatedRop * 2)}
                              disabled={isItemLoading}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'var(--primary)',
                                color: '#ffffff',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: 'var(--shadow-sm)'
                              }}
                            >
                              {isItemLoading ? (
                                <>
                                  <RotateCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                                  <span>Đang đặt...</span>
                                </>
                              ) : (
                                <>
                                  <Send size={13} />
                                  <span>Đặt DC (+{analysis.calculatedRop * 2})</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Nhân viên kho xem cảnh báo ROP để chuẩn bị vị trí lưu kho; Cửa hàng trưởng sẽ duyệt đơn PO."
                            >
                              <Lock size={12} />
                              <span>Chuẩn bị kệ nhận ({analysis.calculatedRop * 2})</span>
                            </span>
                          )
                        ) : analysis.isSpoilageRisk ? (
                          analysis.isDiscounted ? (
                            <span style={{
                              fontSize: '0.76rem',
                              color: 'var(--warning-yellow)',
                              fontWeight: 700,
                              background: 'var(--warning-yellow-bg)',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--warning-yellow-border)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Zap size={13} /> Đã Giảm 30%
                            </span>
                          ) : canManagePo ? (
                            <button
                              onClick={() => handleApplyDiscount(prod, analysis.nearestBatch)}
                              disabled={isItemLoading}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'var(--danger-red)',
                                color: '#ffffff',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: 'var(--shadow-sm)'
                              }}
                            >
                              <Zap size={13} />
                              <span>Xả Hàng -30%</span>
                            </button>
                          ) : (
                            <span style={{
                              fontSize: '0.74rem',
                              color: 'var(--danger-red)',
                              fontWeight: 600,
                              background: 'var(--danger-red-bg)',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--danger-red-border)'
                            }}>
                              Ưu tiên đảo kệ mặt tiền
                            </span>
                          )
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            Tồn kho an toàn
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* NỘI DUNG TAB 2: QUẢN LÝ ĐƠN ĐẶT HÀNG PO */}
      {activeViewTab === 'po-orders' && (
        <PurchaseOrdersSubView
          orders={purchaseOrders}
          loading={loadingOrders}
          storeProfile={storeProfile}
          onRefresh={loadPurchaseOrders}
          onUpdateStatus={handleUpdatePoStatus}
          isAdmin={canManagePo}
          onRequestAdminLogin={onRequestAdminLogin}
          onNavigateToIntake={(po) => {
            if (setActiveTab) setActiveTab('dc-intake');
          }}
        />
      )}

    </div>
  );
}
