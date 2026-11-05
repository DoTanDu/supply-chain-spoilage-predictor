import React, { useState, useEffect } from 'react';
import { 
  PackagePlus, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownToLine, 
  History, 
  PlusCircle, 
  Search, 
  X,
  Boxes,
  Layers,
  Sparkles,
  Info,
  Calendar,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Gauge,
  Tag,
  Truck,
  RotateCw,
  Camera,
  Printer,
  FileText,
  Download,
  Eye,
  Check
} from 'lucide-react';
import BarcodeScannerModal from './BarcodeScannerModal';
import PrintBatchLabelModal from './PrintBatchLabelModal';
import DcIntakeModal from './DcIntakeModal';
import { fetchPurchaseOrders, apiUpdatePOStatus, apiRejectDCInbound, apiGetGoodsReceipts } from '../api';

// Helper: Chuẩn hóa chuỗi tiếng Việt không dấu phục vụ tìm kiếm linh hoạt
function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

// Helper: Làm sạch từ khóa đóng gói và dung tích để so sánh sản phẩm trùng lặp
function cleanKeywords(str) {
  if (!str) return '';
  let clean = stripVietnamese(str);
  clean = clean.replace(/\b\d+(\.\d+)?\s*(ml|l|lit|g|gram|kg|lon|chai|hop|khay|mieng|cay|goi|thung|can|thanh|qua)\b/gi, ' ');
  clean = clean.replace(/\b\d+%\b/gi, ' ');
  clean = clean.replace(/\b\d+\b/gi, ' ');
  clean = clean.replace(/\b(tiet trung|thanh trung|truyen thong|nguyen chat|tuoi|sach|chuan|huu co|khong duong|co duong|it duong)\b/gi, ' ');
  clean = clean.replace(/[^a-z0-9]/gi, ' ');
  return clean.replace(/\s+/g, ' ').trim();
}

// Helper: Phát hiện sản phẩm trùng lặp hoặc tương đồng >= 85%
function findDuplicateProduct(name, productList) {
  if (!name || name.trim().length < 2) return null;
  const s1 = stripVietnamese(name);
  const c1 = cleanKeywords(name);

  for (const p of productList) {
    const s2 = stripVietnamese(p.name);
    const c2 = cleanKeywords(p.name);

    if (s1 === s2) return p;
    if (s1.length >= 4 && s2.length >= 4 && (s1.includes(s2) || s2.includes(s1))) return p;
    if (c1 && c2 && c1.length >= 3 && c2.length >= 3) {
      if (c1 === c2 || c1.includes(c2) || c2.includes(c1)) return p;
    }
  }
  return null;
}

// Helper: Icon Ngành hàng
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

export default function DcIntakeView({ 
  products = [], 
  batches = [],
  onAddBatch, 
  onAddNewProduct, 
  recentIntakes = [],
  isAdmin = false,
  currentRole = 'CASHIER',
  currentUser = null,
  storeProfile = null,
  onRefreshData = null,
  setActiveTab = null
}) {
  const canManageCatalog = isAdmin || currentRole === 'ADMIN' || currentRole === 'STORE_MANAGER';
  const minRslThreshold = Number(storeProfile?.minInboundRslPercent || 70);

  // State Modal Tiếp Nhận Hàng (Progressive Disclosure - Cửa sổ bật ra)
  const [showIntakeModal, setShowIntakeModal] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 1);
  const selectedProd = products.find(p => p.id === selectedProductId) || products[0];

  const [importDate, setImportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [batchCode, setBatchCode] = useState(() => {
    const skuPart = products[0]?.sku || 'MILK01';
    const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `LOT-DC-${skuPart}-${datePart}-${Date.now().toString().slice(-3)}`;
  });
  const [manufactureDate, setManufactureDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 5);
    return d.toISOString().split('T')[0];
  });
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [quantity, setQuantity] = useState(30);
  const [costPrice, setCostPrice] = useState(selectedProd?.costPrice || 28000);
  const [retailPrice, setRetailPrice] = useState(selectedProd?.price || 36000);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [printBatchModalData, setPrintBatchModalData] = useState(null);
  const [lastCreatedBatch, setLastCreatedBatch] = useState(null);

  // State liên kết đơn đặt hàng PO từ DC
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [intakeMode, setIntakeMode] = useState('manual'); // 'manual' | 'po'
  const [selectedPoId, setSelectedPoId] = useState('');

  // Tải danh sách đơn PO từ CSDL khi khởi động
  const loadPurchaseOrders = () => {
    fetchPurchaseOrders()
      .then(res => {
        if (res && res.data) setPurchaseOrders(res.data);
      })
      .catch(err => console.error("Lỗi nạp đơn PO:", err));
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  // Main Active Tab: 'products' | 'batches' | 'receipts' | 'pos'
  const [activeTab, setActiveMainTab] = useState('products');

  // Filter cho Danh mục sản phẩm
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('ALL');

  // Filter cho Lịch sử nhận lô DC (Tab 4 cấp màu: ALL, SAFE, WARNING, CRITICAL, EXPIRED)
  const [batchSearch, setBatchSearch] = useState('');
  const [batchStatusFilter, setBatchStatusFilter] = useState('ALL');

  // Sổ Biên Bản Nhận Hàng DC (Goods Receipts - Mục 17.12 & Chuẩn Tự Động)
  const [goodsReceipts, setGoodsReceipts] = useState([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [receiptSearch, setReceiptSearch] = useState('');
  const [selectedReceiptModal, setSelectedReceiptModal] = useState(null);

  const loadGoodsReceipts = async () => {
    setLoadingReceipts(true);
    try {
      const data = await apiGetGoodsReceipts();
      if (Array.isArray(data)) {
        setGoodsReceipts(data);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách phiếu nhập kho DC:', err);
    } finally {
      setLoadingReceipts(false);
    }
  };

  useEffect(() => {
    loadGoodsReceipts();
  }, []);

  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Modal State Thêm Sản Phẩm Mới
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState(1);
  const [newProdUnit, setNewProdUnit] = useState('Hộp');
  const [newProdCost, setNewProdCost] = useState(25000);
  const [newProdPrice, setNewProdPrice] = useState(35000);
  const [newProdShelfLife, setNewProdShelfLife] = useState(30);
  const [modalError, setModalError] = useState('');

  // Live duplicate detector
  const detectedDuplicate = findDuplicateProduct(newProdName, products);

  // Extract unique categories
  const categories = ['ALL', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Live stock count cho sản phẩm
  const getProductLiveStock = (prodId) => {
    const liveBatches = batches.filter(b =>
      b.productId === prodId &&
      b.status !== 'EXPIRED' &&
      b.status !== 'DISPOSED' &&
      ((b.currentQuantity ?? b.quantity ?? 0) > 0)
    );
    return liveBatches.reduce((acc, cur) => acc + Number(cur.currentQuantity ?? cur.quantity ?? 0), 0);
  };

  // Tính toán Freshness RSL % cho Lô tiếp nhận hiện tại
  const totalDays = Math.max(1, (new Date(expiryDate) - new Date(manufactureDate)) / (1000 * 3600 * 24));
  const remainingDays = Math.max(0, (new Date(expiryDate) - new Date(importDate)) / (1000 * 3600 * 24));
  const daysPassed = Math.max(0, (new Date(importDate) - new Date(manufactureDate)) / (1000 * 3600 * 24));
  const inboundRsl = Math.min(100, Math.round((remainingDays / totalDays) * 100));
  const isRslQualified = inboundRsl >= minRslThreshold;

  // Danh mục sản phẩm đã lọc
  const filteredCatalogProducts = products.filter(p => {
    const matchesCat = catalogCategory === 'ALL' || p.category === catalogCategory;
    if (!catalogSearch.trim()) return matchesCat;

    const normSearch = stripVietnamese(catalogSearch);
    const normName = stripVietnamese(p.name);
    const normSku = (p.sku || '').toLowerCase();
    const tokens = normSearch.split(/\s+/).filter(Boolean);
    const matchesSearch = tokens.every(tok => normName.includes(tok) || normSku.includes(tok));
    return matchesCat && matchesSearch;
  });

  // Lịch sử nhận lô đã lọc
  const allInboundBatches = (batches && batches.length > 0) ? batches : recentIntakes;
  const filteredBatches = allInboundBatches.filter(b => {
    let matchesStatus = true;
    if (batchStatusFilter === 'SAFE') matchesStatus = b.status === 'SAFE' || b.alertColor === 'GREEN';
    else if (batchStatusFilter === 'WARNING') matchesStatus = b.status === 'WARNING' || b.alertColor === 'YELLOW';
    else if (batchStatusFilter === 'CRITICAL') matchesStatus = b.status === 'CRITICAL' || b.alertColor === 'RED';
    else if (batchStatusFilter === 'EXPIRED') matchesStatus = b.status === 'EXPIRED' || b.alertColor === 'EXPIRED';

    if (!batchSearch.trim()) return matchesStatus;

    const normSearch = stripVietnamese(batchSearch);
    const normCode = (b.batchCode || '').toLowerCase();
    const normProd = stripVietnamese(b.productName || '');
    return matchesStatus && (normCode.includes(normSearch) || normProd.includes(normSearch));
  });

  // Tự động cập nhật đơn giá, ngày và mã lô chuẩn LOT-DC-[SKU]-[YYYYMMDD] khi chuyển sản phẩm
  const handleProductChange = (productId) => {
    const id = Number(productId);
    setSelectedProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setCostPrice(prod.costPrice || 25000);
      setRetailPrice(prod.sellingPrice || prod.price || 35000);
      const imp = new Date(importDate);
      imp.setDate(imp.getDate() + (prod.standardShelfLifeDays || prod.shelfLifeDays || 30));
      setExpiryDate(imp.toISOString().split('T')[0]);
      const dateStr = (importDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');
      setBatchCode(`LOT-DC-${prod.sku}-${dateStr}-${Date.now().toString().slice(-3)}`);
    }
  };

  // Mở modal tiếp nhận cho 1 sản phẩm cụ thể
  const handleOpenIntakeForProduct = (prod) => {
    handleProductChange(prod.id);
    setIntakeMode('manual');
    setSelectedPoId('');
    setErrorMsg('');
    setShowIntakeModal(true);
  };

  // Chọn đơn PO để nạp thông tin tiếp nhận tự động
  const handleSelectPo = (poId) => {
    setSelectedPoId(poId);
    if (!poId) return;
    const po = purchaseOrders.find(p => String(p.id) === String(poId));
    if (po && po.items && po.items.length > 0) {
      const firstItem = po.items[0];
      const prod = products.find(p => p.id === firstItem.productId);
      if (prod) {
        handleProductChange(prod.id);
        const qty = firstItem.approvedQuantity || firstItem.suggestedQuantity || 30;
        setQuantity(qty);
        setCostPrice(firstItem.unitCost || prod.costPrice || 25000);
        const dateStr = (importDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');
        setBatchCode(`LOT-DC-${prod.sku}-${dateStr}-${po.orderCode.slice(-3)}`);
      }
    }
  };

  // Mở modal tiếp nhận từ 1 đơn PO
  const handleOpenIntakeForPo = (po) => {
    setIntakeMode('po');
    handleSelectPo(po.id);
    setShowIntakeModal(true);
  };

  const handleSelectExistingProduct = (prod) => {
    setShowAddProductModal(false);
    setNewProdName('');
    setModalError('');
    handleProductChange(prod.id);
    setShowIntakeModal(true);
  };

  // Quét Barcode tiếp nhận lô hàng DC
  const handleBarcodeScanSuccess = (scannedSku) => {
    if (!scannedSku) return;
    const cleanSku = String(scannedSku).trim().toUpperCase();
    const found = products.find(p =>
      (p.sku && p.sku.toUpperCase() === cleanSku) ||
      (p.barcode && String(p.barcode).trim().toUpperCase() === cleanSku) ||
      (p.id && String(p.id) === cleanSku)
    );

    if (found) {
      handleProductChange(found.id);
      setShowBarcodeScanner(false);
      setShowIntakeModal(true);
      setSuccessMsg(`✓ Đã nhận diện mã [${cleanSku}]: ${found.name}`);
    } else {
      setErrorMsg(`Không tìm thấy sản phẩm có mã Barcode/SKU: "${scannedSku}" trong hệ thống.`);
      setShowBarcodeScanner(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (new Date(expiryDate) <= new Date(manufactureDate)) {
      setErrorMsg('Hạn sử dụng (EXP) bắt buộc phải lớn hơn Ngày sản xuất (MFG)!');
      return;
    }

    if (quantity <= 0 || costPrice <= 0) {
      setErrorMsg('Số lượng tiếp nhận và giá vốn phải lớn hơn 0!');
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) {
      setErrorMsg('Vui lòng chọn một sản phẩm hợp lệ!');
      return;
    }

    // Tiêu chuẩn nhận date
    if (!isRslQualified) {
      setErrorMsg(`TỪ CHỐI NHẬN HÀNG: Lô hàng chỉ đạt RSL ${inboundRsl}%, dưới tiêu chuẩn tối thiểu ${minRslThreshold}% của cửa hàng LHU Mart! Hệ thống khóa lưu phiếu để ngăn chặn Kho tổng DC đẩy hàng cận date.`);
      return;
    }

    setIsSubmitting(true);

    const newBatch = {
      id: Date.now(),
      productId: prod.id,
      productName: prod.name,
      batchCode: batchCode,
      manufactureDate: manufactureDate,
      manufacturingDate: manufactureDate,
      importDate: importDate,
      expiryDate: expiryDate,
      initialQuantity: Number(quantity),
      quantity: Number(quantity),
      quantityReceived: Number(quantity),
      importPrice: Number(costPrice),
      costPrice: Number(costPrice),
      status: 'ACTIVE',
      category: prod.category,
      sellingPrice: prod.sellingPrice || prod.price,
      purchaseOrderId: selectedPoId ? Number(selectedPoId) : null,
      receivedBy: currentUser?.id || 3,
      receivedByName: currentUser?.fullName || 'Nhân viên kho'
    };

    try {
      const res = await onAddBatch(newBatch);
      if (res && res.success === false) {
        setErrorMsg(res.message || 'Lỗi ghi nhận lô hàng vào CSDL!');
      } else {
        const createdBatchData = {
          ...newBatch,
          sku: prod.sku,
          unit: prod.unit,
          rslPercent: inboundRsl
        };
        setLastCreatedBatch(createdBatchData);
        setSuccessMsg(`✓ Tiếp nhận thành công Lô ${batchCode} (${quantity} ${prod.unit}, RSL đạt ${inboundRsl}%) từ Xe tải DC!`);
        setShowIntakeModal(false);

        // Chuẩn bị mã lô tiếp theo
        const dateStr = (importDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');
        setBatchCode(`LOT-DC-${prod.sku}-${dateStr}-${Date.now().toString().slice(-3)}`);

        // Tự động cập nhật danh sách đơn PO nếu có
        if (selectedPoId) {
          try {
            await apiUpdatePOStatus(selectedPoId, 'DELIVERED', `Đã nhập kho Lô ${batchCode}`);
            loadPurchaseOrders();
            setSelectedPoId('');
          } catch (e) {
            console.warn('Lỗi cập nhật PO:', e);
          }
        }

        if (onRefreshData) {
          await onRefreshData();
        }
        loadGoodsReceipts();
      }
    } catch (err) {
      setErrorMsg(`Lỗi kết nối CSDL: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lập Biên bản Từ chối Nhận hàng DC
  const handleRejectInbound = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const prod = products.find(p => p.id === selectedProductId) || selectedProd;
    setIsRejecting(true);
    try {
      const res = await apiRejectDCInbound({
        productId: prod?.id,
        productName: prod?.name,
        productSku: prod?.sku,
        batchCode,
        manufactureDate,
        importDate,
        expiryDate,
        quantity: Number(quantity) || 0,
        reason: `Xe tải DC Biên Hòa giao lô hàng chỉ đạt RSL ${inboundRsl}% (< chuẩn tối thiểu ${minRslThreshold}%)`,
        rejectedBy: currentUser?.fullName || 'Nhân viên kho'
      });
      if (res && res.success) {
        setSuccessMsg(`✓ ĐÃ LẬP BIÊN BẢN TỪ CHỐI [${res.rejectionCode}]: Lô "${prod?.name}" chỉ đạt RSL ${inboundRsl}% (< ${minRslThreshold}%). Đã lưu vào Nhật ký Kiểm toán.`);
        setShowIntakeModal(false);
        if (onRefreshData) {
          await onRefreshData();
        }
      } else {
        setErrorMsg(res?.message || 'Không thể lưu biên bản từ chối nhận hàng DC.');
      }
    } catch (err) {
      setErrorMsg(`Lỗi khi lập biên bản từ chối: ${err.message}`);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!newProdName.trim()) return;

    if (detectedDuplicate) {
      setModalError(`Sản phẩm này đã tồn tại hoặc gần giống với "${detectedDuplicate.name}".`);
      return;
    }

    if (onAddNewProduct) {
      const res = await onAddNewProduct({
        name: newProdName.trim(),
        categoryId: Number(newProdCategory),
        unit: newProdUnit,
        costPrice: Number(newProdCost),
        sellingPrice: Number(newProdPrice),
        shelfLifeDays: Number(newProdShelfLife),
        minStock: 15
      });

      if (res && !res.success) {
        setModalError(res.message || 'Không thể tạo mới sản phẩm!');
        return;
      }

      setShowAddProductModal(false);
      setNewProdName('');
      setModalError('');
      setSuccessMsg(`✓ Đã thêm sản phẩm mới "${newProdName}" vào CSDL!`);
      if (res?.data?.id) {
        handleProductChange(res.data.id);
        setShowIntakeModal(true);
      }
    }
  };

  const pendingPos = purchaseOrders.filter(
    po => po.status !== 'DELIVERED' && po.status !== 'COMPLETED' && po.status !== 'CANCELLED'
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 105px)',
        overflow: 'hidden',
        gap: '12px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* ========================================================================= */}
      {/* THANH TIÊU ĐỀ & HÀNH ĐỘNG MẶT TIỀN (FULL-WIDTH 100%) */}
      {/* ========================================================================= */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'var(--primary-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              border: '1px solid var(--primary-border)'
            }}
          >
            <Truck size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                Tiếp Nhận Hàng DC Biên Hòa
              </h1>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'var(--primary-bg)',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary-border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ShieldCheck size={13} />
                Tiêu Chuẩn RSL ≥ {minRslThreshold}%
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Kiểm tra nghiêm ngặt hạn sử dụng (EXP), độ tươi mới lô hàng trước khi nhập kho cửa hàng LHU Mart
            </div>
          </div>
        </div>

        {/* Cụm Nút Hành Động Nhanh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowBarcodeScanner(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #06b6d4',
              background: 'rgba(6, 182, 212, 0.1)',
              color: '#0891b2',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Quét mã vạch Barcode/QR trên kiện hàng xe tải DC"
          >
            <Camera size={15} />
            <span>Quét Barcode</span>
          </button>

          {canManageCatalog && (
            <button
              type="button"
              onClick={() => setShowAddProductModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Thêm mặt hàng mới vào danh mục CSDL"
            >
              <PlusCircle size={15} color="var(--primary)" />
              <span>+ Thêm SP Mới</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setErrorMsg('');
              setShowIntakeModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--primary)',
              color: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s ease'
            }}
            title="Mở biểu mẫu cửa sổ bật ra để tiếp nhận lô hàng DC mới"
          >
            <PackagePlus size={16} />
            <span>+ Tiếp Nhận Đợt Hàng Mới</span>
          </button>
        </div>
      </div>

      {/* Thông Báo Toast Thành Công / Thất Bại (Nếu có) */}
      {successMsg && (
        <div
          style={{
            background: 'var(--safe-green-bg)',
            border: '1px solid var(--safe-green-border)',
            color: 'var(--safe-green)',
            padding: '10px 14px',
            borderRadius: '9px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={17} flexShrink={0} />
            <span style={{ fontWeight: 600 }}>{successMsg}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {lastCreatedBatch && (
              <button
                type="button"
                onClick={() => setPrintBatchModalData(lastCreatedBatch)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Printer size={13} />
                <span>In Tem Nhãn Lô</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSuccessMsg('')}
              style={{ background: 'none', border: 'none', color: 'var(--safe-green)', cursor: 'pointer', padding: '0 4px' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: 'var(--danger-red-bg)',
            border: '1px solid var(--danger-red-border)',
            color: 'var(--danger-red)',
            padding: '10px 14px',
            borderRadius: '9px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={17} flexShrink={0} />
            <span style={{ lineHeight: 1.4 }}>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            style={{ background: 'none', border: 'none', color: 'var(--danger-red)', cursor: 'pointer' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KHỐI DỮ LIỆU FULL-WIDTH 100%: 4 TAB CHUYÊN BIỆT */}
      {/* ========================================================================= */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
          padding: '14px 18px'
        }}
      >
        {/* Main Tab Switcher Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '10px',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveMainTab('products')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: activeTab === 'products' ? 'var(--primary-border)' : 'var(--border-subtle)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.825rem',
                background: activeTab === 'products' ? 'var(--primary-bg)' : 'var(--bg-subtle)',
                color: activeTab === 'products' ? 'var(--primary)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              <Boxes size={15} />
              <span>Danh Mục Sản Phẩm ({products.length} SP)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('batches')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: activeTab === 'batches' ? 'var(--primary-border)' : 'var(--border-subtle)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.825rem',
                background: activeTab === 'batches' ? 'var(--primary-bg)' : 'var(--bg-subtle)',
                color: activeTab === 'batches' ? 'var(--primary)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              <History size={15} />
              <span>Lịch Sử Nhận Lô DC ({allInboundBatches.length} Lô)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMainTab('receipts');
                loadGoodsReceipts();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: activeTab === 'receipts' ? 'var(--primary-border)' : 'var(--border-subtle)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.825rem',
                background: activeTab === 'receipts' ? 'var(--primary-bg)' : 'var(--bg-subtle)',
                color: activeTab === 'receipts' ? 'var(--primary)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              <FileText size={15} />
              <span>Sổ Phiếu Nhập DC ({goodsReceipts.length} Phiếu)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMainTab('pos');
                loadPurchaseOrders();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: activeTab === 'pos' ? '#3b82f6' : 'var(--border-subtle)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.825rem',
                background: activeTab === 'pos' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-subtle)',
                color: activeTab === 'pos' ? '#2563eb' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              <Truck size={15} />
              <span>Đơn PO Chờ DC Giao ({pendingPos.length} Đơn)</span>
            </button>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Giao diện tinh gọn Full-Width • Click <strong>[+ Nhập Lô]</strong> để mở Cửa Sổ Bật Ra
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 1: DANH MỤC TOÀN BỘ SẢN PHẨM FMCG (FULL-WIDTH 100%) */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Filter Toolbar cho Products */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  style={{
                    width: '100%',
                    paddingLeft: '32px',
                    height: '32px',
                    fontSize: '0.8rem',
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Tìm theo tên sản phẩm, mã SKU hoặc quét barcode..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
              </div>

              <select
                style={{
                  width: '200px',
                  height: '32px',
                  fontSize: '0.785rem',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  padding: '0 8px',
                  boxSizing: 'border-box'
                }}
                value={catalogCategory}
                onChange={(e) => setCatalogCategory(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'Tất cả các ngành hàng' : c}
                  </option>
                ))}
              </select>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Hiển thị: <strong>{filteredCatalogProducts.length}</strong> / {products.length} SP
              </span>
            </div>

            {/* Bảng Dữ Liệu Full-Width Thoáng Đãng */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', borderRadius: '9px', border: '1px solid var(--border-subtle)' }}>
              <table className="modern-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-subtle)' }}>
                  <tr>
                    <th style={{ width: '105px', padding: '9px 12px' }}>Mã SKU</th>
                    <th style={{ minWidth: '320px', padding: '9px 12px' }}>Tên Sản Phẩm</th>
                    <th style={{ width: '135px', padding: '9px 12px' }}>Ngành Hàng</th>
                    <th style={{ width: '85px', padding: '9px 12px', textAlign: 'center' }}>Hạn Chuẩn</th>
                    <th style={{ width: '85px', padding: '9px 12px', textAlign: 'center' }}>Tồn Kệ</th>
                    <th style={{ width: '95px', textAlign: 'right', padding: '9px 12px' }}>Giá Vốn</th>
                    <th style={{ width: '95px', textAlign: 'right', padding: '9px 12px' }}>Giá Bán</th>
                    <th style={{ width: '105px', textAlign: 'center', padding: '9px 12px' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalogProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        Không tìm thấy sản phẩm nào khớp với từ khóa tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredCatalogProducts.map((p) => {
                      const stock = getProductLiveStock(p.id);

                      return (
                        <tr 
                          key={p.id} 
                          style={{ 
                            borderBottom: '1px solid var(--border-subtle)',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {/* SKU */}
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.76rem' }}>
                              {p.sku}
                            </div>
                          </td>

                          {/* Product Name */}
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{getCategoryIcon(p.category)}</span>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.825rem', lineHeight: 1.35 }}>
                                  {p.name}
                                </div>
                                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                                  ĐVT: <strong style={{ color: 'var(--text-main)' }}>{p.unit}</strong>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ 
                              fontSize: '0.7rem', 
                              padding: '2px 7px', 
                              borderRadius: '4px', 
                              background: 'var(--bg-subtle)', 
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-subtle)',
                              whiteSpace: 'nowrap'
                            }}>
                              {p.category}
                            </span>
                          </td>

                          {/* Shelf Life */}
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', padding: '8px 12px', textAlign: 'center' }}>
                            {p.shelfLifeDays || 30}d
                          </td>

                          {/* Stock */}
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <span style={{ 
                              fontSize: '0.725rem', 
                              fontWeight: 700, 
                              padding: '2px 7px', 
                              borderRadius: '4px',
                              background: stock > 15 ? 'var(--primary-bg)' : stock > 0 ? 'var(--warning-yellow-bg)' : 'var(--danger-red-bg)',
                              color: stock > 15 ? 'var(--primary)' : stock > 0 ? 'var(--warning-yellow)' : 'var(--danger-red)',
                              border: `1px solid ${stock > 15 ? 'var(--primary-border)' : stock > 0 ? 'var(--warning-yellow-border)' : 'var(--danger-red-border)'}`,
                              whiteSpace: 'nowrap'
                            }}>
                              {stock} {p.unit}
                            </span>
                          </td>

                          {/* Cost Price */}
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.785rem', padding: '8px 12px' }}>
                            {(p.costPrice || 25000).toLocaleString('vi-VN')} đ
                          </td>

                          {/* Retail Price */}
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.8rem', padding: '8px 12px' }}>
                            {(p.price || 0).toLocaleString('vi-VN')} đ
                          </td>

                          {/* Action Button: Nhập Lô (Mở Modal Popup) */}
                          <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                            <button
                              type="button"
                              style={{ 
                                fontSize: '0.725rem', 
                                padding: '5px 10px', 
                                borderRadius: '5px', 
                                background: 'var(--primary)', 
                                color: '#ffffff', 
                                border: 'none',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: 'var(--shadow-sm)'
                              }}
                              onClick={() => handleOpenIntakeForProduct(p)}
                              title="Bật cửa sổ Modal để tiếp nhận lô hàng DC cho sản phẩm này"
                            >
                              <ArrowDownToLine size={12} />
                              <span>+ Nhập Lô</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 2: LỊCH SỬ TIẾP NHẬN DC VỚI BỘ LỌC 4 TAB CẤP MÀU */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'batches' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Filter Toolbar: Bộ Lọc Tab 4 Cấp Màu */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  style={{
                    width: '100%',
                    paddingLeft: '32px',
                    height: '32px',
                    fontSize: '0.8rem',
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Tìm theo mã lô LOT-DC, tên sản phẩm..."
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                />
              </div>

              {/* 4 Tabs Màu Cảnh Báo Trạng Thái */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setBatchStatusFilter('ALL')}
                  style={{
                    fontSize: '0.75rem',
                    padding: '5px 11px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: batchStatusFilter === 'ALL' ? 'var(--primary-border)' : 'var(--border-subtle)',
                    background: batchStatusFilter === 'ALL' ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: batchStatusFilter === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: batchStatusFilter === 'ALL' ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  Tất cả ({allInboundBatches.length})
                </button>

                <button
                  type="button"
                  onClick={() => setBatchStatusFilter('SAFE')}
                  style={{
                    fontSize: '0.75rem',
                    padding: '5px 11px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: batchStatusFilter === 'SAFE' ? 'var(--primary-border)' : 'var(--border-subtle)',
                    background: batchStatusFilter === 'SAFE' ? 'var(--primary-bg)' : 'var(--bg-subtle)',
                    color: batchStatusFilter === 'SAFE' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: batchStatusFilter === 'SAFE' ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  🟢 An toàn ({allInboundBatches.filter(b => b.status === 'SAFE' || b.alertColor === 'GREEN').length})
                </button>

                <button
                  type="button"
                  onClick={() => setBatchStatusFilter('WARNING')}
                  style={{
                    fontSize: '0.75rem',
                    padding: '5px 11px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: batchStatusFilter === 'WARNING' ? 'var(--warning-yellow-border)' : 'var(--border-subtle)',
                    background: batchStatusFilter === 'WARNING' ? 'var(--warning-yellow-bg)' : 'var(--bg-subtle)',
                    color: batchStatusFilter === 'WARNING' ? 'var(--warning-yellow)' : 'var(--text-secondary)',
                    fontWeight: batchStatusFilter === 'WARNING' ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  🟡 Cảnh báo ({allInboundBatches.filter(b => b.status === 'WARNING' || b.alertColor === 'YELLOW').length})
                </button>

                <button
                  type="button"
                  onClick={() => setBatchStatusFilter('CRITICAL')}
                  style={{
                    fontSize: '0.75rem',
                    padding: '5px 11px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: batchStatusFilter === 'CRITICAL' ? 'var(--danger-red-border)' : 'var(--border-subtle)',
                    background: batchStatusFilter === 'CRITICAL' ? 'var(--danger-red-bg)' : 'var(--bg-subtle)',
                    color: batchStatusFilter === 'CRITICAL' ? 'var(--danger-red)' : 'var(--text-secondary)',
                    fontWeight: batchStatusFilter === 'CRITICAL' ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  🔴 Nguy cơ ({allInboundBatches.filter(b => b.status === 'CRITICAL' || b.alertColor === 'RED').length})
                </button>
              </div>
            </div>

            {/* Bảng Dữ Liệu Lô Hàng Full-Width */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', borderRadius: '9px', border: '1px solid var(--border-subtle)' }}>
              <table className="modern-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-subtle)' }}>
                  <tr>
                    <th style={{ width: '180px', padding: '10px 14px' }}>Mã Lô</th>
                    <th style={{ padding: '10px 14px' }}>Sản Phẩm</th>
                    <th style={{ width: '110px', padding: '10px 14px' }}>Ngày Nhập</th>
                    <th style={{ width: '140px', padding: '10px 14px' }}>Hạn Dùng & RSL</th>
                    <th style={{ width: '110px', padding: '10px 14px', textAlign: 'center' }}>Tồn / Nhập</th>
                    <th style={{ width: '125px', textAlign: 'right', padding: '10px 14px' }}>Giá Trị Tồn</th>
                    <th style={{ width: '110px', textAlign: 'center', padding: '10px 14px' }}>Trạng Thái</th>
                    <th style={{ width: '95px', textAlign: 'center', padding: '10px 14px' }}>In Tem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        Không có lô hàng nào khớp với điều kiện lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((b, idx) => {
                      const curQty = b.currentQuantity ?? b.quantity ?? b.initialQuantity ?? 0;
                      const initQty = b.initialQuantity ?? b.quantity ?? curQty;
                      const unitCost = b.importPrice ?? b.costPrice ?? 25000;
                      const impDateStr = b.importDate ? String(b.importDate).slice(0, 10) : '---';
                      const expDateStr = b.expiryDate ? String(b.expiryDate).slice(0, 10) : '---';
                      const rslVal = b.rslPercent !== undefined ? Math.round(b.rslPercent) : 90;
                      const daysLeftVal = b.daysLeft !== undefined ? b.daysLeft : null;

                      return (
                        <tr 
                          key={b.id || idx} 
                          style={{ 
                            borderBottom: '1px solid var(--border-subtle)',
                            background: idx === 0 ? 'rgba(79, 70, 229, 0.03)' : 'transparent' 
                          }}
                        >
                          {/* Batch Code */}
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span>{b.batchCode}</span>
                              {idx === 0 && (
                                <span style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '3px', background: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid var(--primary-border)', fontWeight: 700 }}>
                                  Mới
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Product Name */}
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.825rem' }}>{b.productName}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.categoryName || b.category}</div>
                          </td>

                          {/* Import Date */}
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.785rem', padding: '10px 14px', fontFamily: 'monospace' }}>
                            {impDateStr}
                          </td>

                          {/* Expiry Date & RSL % */}
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.785rem', fontFamily: 'monospace' }}>
                              {expDateStr}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {daysLeftVal !== null ? `Còn ${daysLeftVal}d • ` : ''}RSL: <strong>{rslVal}%</strong>
                            </div>
                          </td>

                          {/* Quantity */}
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{curQty}</strong>
                            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}> / {initQty}</span>
                          </td>

                          {/* Total Value */}
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)', fontSize: '0.825rem', padding: '10px 14px', fontFamily: 'monospace' }}>
                            {(curQty * unitCost).toLocaleString('vi-VN')} đ
                          </td>

                          {/* Status Badge */}
                          <td style={{ textAlign: 'center', padding: '10px 14px' }}>
                            <span className={`badge badge-${b.status === 'SAFE' || b.alertColor === 'GREEN' ? 'safe' : b.status === 'WARNING' || b.alertColor === 'YELLOW' ? 'warning' : b.status === 'CRITICAL' || b.alertColor === 'RED' ? 'danger' : 'expired'}`} style={{ fontSize: '0.7rem' }}>
                              {b.alertColor || b.status}
                            </span>
                          </td>

                          {/* Action In Tem */}
                          <td style={{ textAlign: 'center', padding: '10px 14px' }}>
                            <button
                              type="button"
                              onClick={() => setPrintBatchModalData(b)}
                              style={{
                                fontSize: '0.725rem',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #6366f1',
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: '#6366f1',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                              title="In tem nhãn barcode dán thùng hàng DC"
                            >
                              <Printer size={12} />
                              <span>In Tem</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 3: SỔ BIÊN BẢN NHẬP KHO DC (GOODS RECEIPTS) */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'receipts' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Filter Toolbar & Xuất CSV */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  style={{
                    width: '100%',
                    paddingLeft: '32px',
                    height: '32px',
                    fontSize: '0.8rem',
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Tìm theo mã biên bản GR-DC, người nhận, nhà cung ứng..."
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={loadGoodsReceipts}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.785rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <RotateCw size={13} className={loadingReceipts ? 'spin' : ''} />
                <span>Làm Mới</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!goodsReceipts.length) return;
                  const headers = ['Mã Biên Bản', 'Ngày Nhập', 'Kho/Nhà Cung Cấp', 'Người Tiếp Nhận', 'Tổng Giá Vốn (VND)', 'Trạng Thái', 'Ghi Chú'];
                  const rows = goodsReceipts.map(r => [
                    `"${r.receiptNumber || ''}"`,
                    `"${r.receiptDate ? new Date(r.receiptDate).toLocaleDateString('vi-VN') : ''}"`,
                    `"${r.supplierName || 'Kho Phân Phối DC Biên Hòa'}"`,
                    `"${r.receivedByName || 'Nguyễn Thủ Kho'}"`,
                    `"${Number(r.totalCost || 0).toLocaleString('vi-VN')}"`,
                    `"${r.status || 'COMPLETED'}"`,
                    `"${(r.notes || '').replace(/"/g, '""')}"`
                  ]);
                  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `So_Bien_Ban_Nhap_Kho_DC_${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                style={{
                  height: '32px',
                  padding: '0 14px',
                  borderRadius: '7px',
                  border: '1px solid var(--primary-border)',
                  background: 'var(--primary-bg)',
                  color: 'var(--primary)',
                  fontSize: '0.785rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Xuất Sổ Biên Bản Tiếp Nhận Ra Excel/CSV"
              >
                <Download size={14} />
                <span>Xuất CSV</span>
              </button>
            </div>

            {/* Quick KPI Stats Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Tổng Số Biên Bản Nhận:</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {goodsReceipts.length} <span style={{ fontSize: '0.785rem', fontWeight: 500 }}>phiếu</span>
                </div>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Tổng Giá Trị Tiền Hàng DC:</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                  {goodsReceipts.reduce((sum, r) => sum + (Number(r.totalCost) || 0), 0).toLocaleString('vi-VN')} <span style={{ fontSize: '0.785rem', fontWeight: 500 }}>₫</span>
                </div>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Tiêu Chuẩn RSL Đầu Vào:</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--safe-green)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <ShieldCheck size={18} />
                  <span>RSL &ge; {minRslThreshold}%</span>
                </div>
              </div>
            </div>

            {/* Goods Receipts Table */}
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '9px', background: 'var(--bg-surface)' }}>
              {loadingReceipts ? (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Đang nạp Sổ biên bản nhận hàng từ Microsoft SQL Server LocalDB...
                </div>
              ) : goodsReceipts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Chưa có biên bản tiếp nhận hàng nào trong hệ thống.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>STT</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Mã Biên Bản</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Ngày Nhập</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Kho Tổng / NCC</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Người Tiếp Nhận</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>Tổng Tiền Vốn</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center' }}>Trạng Thái</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goodsReceipts
                      .filter(r => {
                        if (!receiptSearch.trim()) return true;
                        const s = stripVietnamese(receiptSearch);
                        const matchNum = stripVietnamese(r.receiptNumber).includes(s);
                        const matchSup = stripVietnamese(r.supplierName).includes(s);
                        const matchRec = stripVietnamese(r.receivedByName).includes(s);
                        return matchNum || matchSup || matchRec;
                      })
                      .map((receipt, idx) => (
                        <tr 
                          key={receipt.id || idx} 
                          style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.1s ease' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>#{idx + 1}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-bg)', padding: '3px 8px', borderRadius: '5px', border: '1px solid var(--primary-border)' }}>
                              {receipt.receiptNumber}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                            {receipt.receiptDate ? new Date(receipt.receiptDate).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-main)' }}>
                            {receipt.supplierName || 'Kho Phân Phối DC Biên Hòa'}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                            {receipt.receivedByName || 'Nguyễn Thủ Kho'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                            {Number(receipt.totalCost || 0).toLocaleString('vi-VN')} ₫
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.725rem', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, background: 'var(--safe-green-bg)', color: 'var(--safe-green)', border: '1px solid var(--safe-green-border)' }}>
                              {receipt.status || 'COMPLETED'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptModal(receipt)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-surface)',
                                color: 'var(--text-main)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Eye size={13} />
                              <span>Chi Tiết</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 4: ĐƠN PO CHỜ NHẬN TỪ DC BIÊN HÒA */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'pos' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Danh sách các đơn đặt hàng (Purchase Orders) đang chờ xe tải Kho tổng DC Biên Hòa giao tới cửa hàng. Click <strong>[Tiếp Nhận Đơn Này]</strong> để mở Cửa Sổ Bật Ra nạp sẵn hàng hóa.
            </div>

            <div style={{ flex: 1, overflowY: 'auto', borderRadius: '9px', border: '1px solid var(--border-subtle)' }}>
              {pendingPos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Không có đơn đặt hàng nào đang chờ nhận từ DC. Bạn có thể chọn <strong>[+ Tiếp Nhận Đợt Hàng Mới]</strong> để nhập tự do.
                </div>
              ) : (
                <table className="modern-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-subtle)' }}>
                    <tr>
                      <th style={{ width: '140px', padding: '10px 14px' }}>Mã Đơn PO</th>
                      <th style={{ padding: '10px 14px' }}>Mặt Hàng Dự Kiến</th>
                      <th style={{ width: '120px', padding: '10px 14px', textAlign: 'center' }}>Số Lượng</th>
                      <th style={{ width: '130px', textAlign: 'right', padding: '10px 14px' }}>Tổng Tiền</th>
                      <th style={{ width: '140px', textAlign: 'center', padding: '10px 14px' }}>Trạng Thái</th>
                      <th style={{ width: '160px', textAlign: 'center', padding: '10px 14px' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPos.map(po => {
                      const firstItem = po.items && po.items[0];
                      const totalQty = po.items ? po.items.reduce((s, it) => s + (it.approvedQuantity || it.suggestedQuantity || 0), 0) : 0;
                      const totalVal = po.totalAmount || (po.items ? po.items.reduce((s, it) => s + ((it.approvedQuantity || it.suggestedQuantity || 0) * (it.unitCost || 25000)), 0) : 0);

                      return (
                        <tr 
                          key={po.id}
                          style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        >
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                              {po.orderCode}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                              {firstItem?.productName || 'Nhiều mặt hàng'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Duyệt bởi: <strong>{po.approvedByName || po.createdByName}</strong>
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: 'var(--text-main)' }}>
                            {totalQty} món
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                            {Number(totalVal).toLocaleString('vi-VN')} đ
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{
                              padding: '3px 9px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.725rem',
                              background: po.status === 'SHIPPING' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                              color: po.status === 'SHIPPING' ? '#2563eb' : '#d97706'
                            }}>
                              {po.status === 'SHIPPING' ? '🚚 Xe đang giao' : po.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenIntakeForPo(po)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <ArrowDownToLine size={13} />
                              <span>Tiếp Nhận Đơn Này</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CỬA SỔ BẬT RA: MODAL TIẾP NHẬN HÀNG DC BIÊN HÒA (PROGRESSIVE DISCLOSURE) */}
      {/* ========================================================================= */}
      <DcIntakeModal
        isOpen={showIntakeModal}
        onClose={() => setShowIntakeModal(false)}
        products={products}
        selectedProductId={selectedProductId}
        onProductChange={handleProductChange}
        purchaseOrders={purchaseOrders}
        intakeMode={intakeMode}
        setIntakeMode={setIntakeMode}
        selectedPoId={selectedPoId}
        onSelectPo={handleSelectPo}
        batchCode={batchCode}
        setBatchCode={setBatchCode}
        quantity={quantity}
        setQuantity={setQuantity}
        manufactureDate={manufactureDate}
        setManufactureDate={setManufactureDate}
        importDate={importDate}
        setImportDate={setImportDate}
        expiryDate={expiryDate}
        setExpiryDate={setExpiryDate}
        costPrice={costPrice}
        setCostPrice={setCostPrice}
        inboundRsl={inboundRsl}
        isRslQualified={isRslQualified}
        minRslThreshold={minRslThreshold}
        daysPassed={daysPassed}
        remainingDays={remainingDays}
        isSubmitting={isSubmitting}
        isRejecting={isRejecting}
        onSubmit={handleSubmit}
        onReject={handleRejectInbound}
        errorMsg={errorMsg}
        setErrorMsg={setErrorMsg}
        onOpenBarcodeScanner={() => setShowBarcodeScanner(true)}
        getProductLiveStock={getProductLiveStock}
        canManageCatalog={canManageCatalog}
        onOpenAddProduct={() => setShowAddProductModal(true)}
      />

      {/* Modal Chi Tiết Biên Bản Tiếp Nhận Hàng DC */}
      {selectedReceiptModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{ maxWidth: '520px', width: '100%', padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '14px', boxShadow: 'var(--shadow-elevated)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                  <FileText size={18} color="var(--primary)" />
                  BIÊN BẢN TIẾP NHẬN DC [{selectedReceiptModal.receiptNumber}]
                </h3>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Hạch toán chuẩn hóa CSDL Microsoft SQL Server LocalDB
                </div>
              </div>
              <button 
                onClick={() => setSelectedReceiptModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-subtle)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Cửa Hàng Tiếp Nhận:</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>LHU Mart (RETAIL-STORE-01)</div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-subtle)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Kho Tổng Cung Ứng:</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{selectedReceiptModal.supplierName || 'Kho Phân Phối DC Biên Hòa'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-subtle)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Ngày Tiếp Nhận:</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {selectedReceiptModal.receiptDate ? new Date(selectedReceiptModal.receiptDate).toLocaleDateString('vi-VN') : '—'}
                  </div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-subtle)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Người Tiếp Nhận:</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{selectedReceiptModal.receivedByName || 'Nguyễn Thủ Kho'}</div>
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Tổng Giá Trị Lô Nhập:</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {Number(selectedReceiptModal.totalCost || 0).toLocaleString('vi-VN')} ₫
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, background: 'var(--safe-green)', color: '#ffffff' }}>
                    {selectedReceiptModal.status || 'COMPLETED'}
                  </span>
                </div>
              </div>

              {selectedReceiptModal.notes && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  <strong>Ghi chú:</strong> {selectedReceiptModal.notes}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => setSelectedReceiptModal(null)}
                style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '0.8rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM MẶT HÀNG MỚI VÀO CƠ SỞ DỮ LIỆU */}
      {/* ========================================================================= */}
      {showAddProductModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{ maxWidth: '460px', width: '100%', padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '14px', boxShadow: 'var(--shadow-elevated)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                <PlusCircle size={16} color="var(--primary)" />
                Thêm Sản Phẩm Mới Vào CSDL
              </h3>
              <button 
                onClick={() => setShowAddProductModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {modalError && (
                <div style={{ background: 'var(--danger-red-bg)', border: '1px solid var(--danger-red-border)', color: 'var(--danger-red)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} flexShrink={0} /> {modalError}
                </div>
              )}

              {detectedDuplicate && (
                <div style={{ background: 'var(--warning-yellow-bg)', border: '1px solid var(--warning-yellow-border)', borderRadius: '8px', padding: '8px 10px', color: 'var(--warning-yellow)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '0.785rem', marginBottom: '3px' }}>
                    <AlertCircle size={14} color="var(--warning-yellow)" />
                    Phát hiện sản phẩm tương đồng trong CSDL!
                  </div>
                  <p style={{ margin: '0 0 6px 0', color: 'var(--text-main)', fontSize: '0.725rem' }}>
                    Tên tương đồng với: <strong>"{detectedDuplicate.name}"</strong>
                  </p>
                  <button
                    type="button"
                    style={{ fontSize: '0.725rem', padding: '5px 8px', width: '100%', borderRadius: '5px', background: 'var(--primary)', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => handleSelectExistingProduct(detectedDuplicate)}
                  >
                    Chọn ngay sản phẩm có sẵn này
                  </button>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>
                  Tên sản phẩm:
                </label>
                <input 
                  type="text" 
                  style={{ width: '100%', height: '30px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', padding: '0 8px', boxSizing: 'border-box' }}
                  placeholder="VD: Sữa chua ăn nha đam Vinamilk 100g..."
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>
                    Ngành hàng:
                  </label>
                  <select 
                    style={{ width: '100%', height: '30px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', padding: '0 6px', boxSizing: 'border-box' }}
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                  >
                    <option value={1}>Sữa & Chế phẩm từ sữa</option>
                    <option value={2}>Bánh mì & Đồ ăn nhanh</option>
                    <option value={3}>Nước giải khát</option>
                    <option value={4}>Thực phẩm khô đóng gói</option>
                    <option value={5}>Thịt cá tươi & Trứng</option>
                    <option value={6}>Rau củ & Trái cây sạch</option>
                    <option value={7}>Thực phẩm chế biến sẵn</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>
                    Đơn vị tính:
                  </label>
                  <input 
                    type="text" 
                    style={{ width: '100%', height: '30px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', padding: '0 8px', boxSizing: 'border-box' }}
                    value={newProdUnit}
                    placeholder="Hộp / Chai / Lon / Gói..."
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>
                    Giá vốn nhập DC (đ):
                  </label>
                  <input 
                    type="number" 
                    style={{ width: '100%', height: '30px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', padding: '0 8px', boxSizing: 'border-box' }}
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>
                    Giá bán lẻ POS (đ):
                  </label>
                  <input 
                    type="number" 
                    style={{ width: '100%', height: '30px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', padding: '0 8px', boxSizing: 'border-box' }}
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>
                  Hạn sử dụng chuẩn (ngày):
                </label>
                <input 
                  type="number" 
                  style={{ width: '100%', height: '30px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', padding: '0 8px', boxSizing: 'border-box' }}
                  value={newProdShelfLife}
                  onChange={(e) => setNewProdShelfLife(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  style={{ flex: 1, padding: '7px', borderRadius: '6px', fontSize: '0.785rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setShowAddProductModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '7px', borderRadius: '6px', fontSize: '0.785rem', background: 'var(--primary)', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 700 }}
                >
                  Lưu vào CSDL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quét Mã Vạch Barcode / QR Code xe tải DC bằng Camera */}
      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScanSuccess={handleBarcodeScanSuccess}
        products={products}
        title="QUÉT MÃ VẠCH KIỆN HÀNG DC"
        subtitle="Hướng Camera vào mã Barcode/QR trên thùng hàng DC hoặc chọn mã mô phỏng để nạp vào biểu mẫu"
      />

      {/* Modal Xem Trước & In Tem Nhãn Lô Hàng DC */}
      <PrintBatchLabelModal
        isOpen={!!printBatchModalData}
        onClose={() => setPrintBatchModalData(null)}
        batch={printBatchModalData}
        storeProfile={storeProfile}
      />
    </div>
  );
}
