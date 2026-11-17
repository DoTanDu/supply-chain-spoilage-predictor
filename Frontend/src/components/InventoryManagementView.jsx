// src/components/InventoryManagementView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  PackagePlus,
  Package,
  Download,
  Printer,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  FileText
} from 'lucide-react';
import * as api from '../api';
import ModalDialog from './ui/ModalDialog';
import DcIntakeModal from './DcIntakeModal';
import BarcodeScannerModal from './BarcodeScannerModal';
import PrintBatchLabelModal from './PrintBatchLabelModal';
import { exportBatchesFefoToExcel, exportSalesHistoryToExcel } from '../utils/exportUtils';
import { parseGs1Barcode } from '../utils/gs1Parser';
import { canAccessPage, normalizeRole } from '../utils/pagePermissions';

function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

function sanitizeIntInput(raw) {
  if (raw === '' || raw === null || raw === undefined) return '';
  const digits = String(raw).replace(/\D+/g, '');
  if (digits === '') return '';
  return String(Number(digits));
}

function formatDateVN(dateStr) {
  if (!dateStr) return '—';
  const raw = String(dateStr).slice(0, 10);
  const parts = raw.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : raw;
}

const ZONE_DISPLAY_ORDER = {
  GREEN: 0,
  YELLOW: 1,
  RED: 2,
  EXPIRED: 3,
  DISPOSED: 4
};

function getBatchAlertMeta(batch) {
  const days = Number(batch.daysLeft ?? 99);
  const color = String(batch.alertColor || '').toUpperCase();
  const status = String(batch.status || '').toUpperCase();
  if (status === 'DISPOSED' || color === 'DISPOSED') {
    return { key: 'DISPOSED', label: 'Đã tiêu hủy', badgeClass: 'ss-badge-neutral' };
  }
  if (color === 'EXPIRED' || status === 'EXPIRED' || days <= 0) {
    return { key: 'EXPIRED', label: 'Quá hạn (Khóa)', badgeClass: 'ss-badge-expired' };
  }
  if (color === 'RED' || status === 'CRITICAL' || days <= 3) {
    return { key: 'RED', label: `Vùng Đỏ (${days}d)`, badgeClass: 'ss-badge-danger' };
  }
  if (color === 'YELLOW' || status === 'WARNING') {
    return { key: 'YELLOW', label: `Vùng Vàng (${days}d)`, badgeClass: 'ss-badge-warning' };
  }
  return { key: 'GREEN', label: `Vùng Xanh (${days}d)`, badgeClass: 'ss-badge-safe' };
}

export default function InventoryManagementView({
  products = [],
  batches = [],
  storeProfile = null,
  storesList = [],
  weather = { condition: 'NORMAL', isHoliday: false },
  currentUser = null,
  currentRole = 'CASHIER',
  isAdmin = false,
  selectedStoreId = 'ALL',
  onAddBatch,
  onAddNewProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRefreshData,
  setActiveTab,
  initialSubTab = 'batches'
}) {
  const roleCode = normalizeRole(currentRole || currentUser?.roleCode);
  const canManageCatalog = isAdmin || roleCode === 'ADMIN' || roleCode === 'STORE_MANAGER';
  const canDoIntake = !currentUser || canAccessPage(currentUser, 'inventory-management');
  const canViewCatalog = !currentUser || canAccessPage(currentUser, 'inventory-management');
  const canViewSales = !currentUser || canAccessPage(currentUser, 'inventory-management');

  const safeInitSubTab = initialSubTab === 'sales-history' ? 'inbound' : (initialSubTab || 'batches');
  const [subTab, setSubTab] = useState(safeInitSubTab);
  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab === 'sales-history' ? 'inbound' : initialSubTab);
  }, [initialSubTab]);

  const [toast, setToast] = useState(null);

  // --- SUB-TAB 1: TỒN KHO & LÔ HẠN DÙNG ---
  const [batchSearch, setBatchSearch] = useState('');
  const [batchZoneFilter, setBatchZoneFilter] = useState('ALL'); // ALL, GREEN, YELLOW, RED, EXPIRED
  const [batchStockFilter, setBatchStockFilter] = useState('IN_STOCK'); // IN_STOCK, ALL
  const [printBatchLabelData, setPrintBatchLabelData] = useState(null);

  // --- SUB-TAB 2: NHẬP KHO & TIẾP NHẬN DC ---
  const minRslThreshold = Number(storeProfile?.minInboundRslPercent || 70);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [goodsReceipts, setGoodsReceipts] = useState([]);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 1);
  const buildBatchCode = (skuOrId, dateStr) => {
    const cleanSku = String(skuOrId || 'SKU').replace(/[^A-Za-z0-9_-]/g, '');
    const day = String(dateStr || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    const rand = `${Date.now().toString(36).toUpperCase().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    return `LOT-DC-${cleanSku}-${day}-${rand}`;
  };

  const [batchCode, setBatchCode] = useState(() => buildBatchCode(products[0]?.sku || 'SKU'));
  const [quantity, setQuantity] = useState(24);
  const [importDate, setImportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manufactureDate, setManufactureDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 18);
    return d.toISOString().slice(0, 10);
  });
  const [costPrice, setCostPrice] = useState(products[0]?.costPrice || 22000);
  const [isSubmittingIntake, setIsSubmittingIntake] = useState(false);
  const [isRejectingIntake, setIsRejectingIntake] = useState(false);
  const [intakeError, setIntakeError] = useState('');

  // --- SUB-TAB 3: DANH MỤC SẢN PHẨM & NHÓM HÀNG ---
  const [categories, setCategories] = useState([]);
  const [prodSearch, setProdSearch] = useState('');
  const [prodCatFilter, setProdCatFilter] = useState('ALL');
  const [productModalMode, setProductModalMode] = useState(null); // null | CREATE | EDIT
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    sku: '',
    name: '',
    categoryId: 1,
    unit: 'Hộp',
    packSize: 1,
    costPrice: 20000,
    sellingPrice: 28000,
    shelfLifeDays: 14,
    minStockLevel: 15,
    maxStockLevel: 150,
    customWarningDays: 5
  });
  const [productFormError, setProductFormError] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ code: '', name: '', storageTemperature: 'Nhiệt độ phòng (25°C)', defaultWarningDays: 7 });
  const [catError, setCatError] = useState('');

  // --- SUB-TAB 4: GHI NHẬN XUẤT BÁN FEFO & KIỂM KÊ / XUẤT KHO ---
  const [salesHistory, setSalesHistory] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesSearch, setSalesSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleForm, setSaleForm] = useState({
    storeId: selectedStoreId !== 'ALL' ? Number(selectedStoreId) : Number(currentUser?.storeId || 1),
    productId: products[0]?.id || 1,
    quantity: 1,
    saleDate: new Date().toISOString().slice(0, 10),
    transactionCode: ''
  });
  const [saleError, setSaleError] = useState('');
  const [submittingSale, setSubmittingSale] = useState(false);

  const [adjustments, setAdjustments] = useState([]);
  const [adjForm, setAdjForm] = useState({
    batchId: '',
    adjustmentType: 'STOCKTAKE',
    actualQuantity: '',
    quantity: '1',
    reason: ''
  });
  const [adjSubmitting, setAdjSubmitting] = useState(false);

  const loadAuxData = async () => {
    try {
      const [poRes, grRes, catRes, adjRes] = await Promise.all([
        api.fetchPurchaseOrders(selectedStoreId).catch(() => null),
        api.apiGetGoodsReceipts(selectedStoreId).catch(() => []),
        api.apiGetCategories().catch(() => []),
        api.fetchBatchAdjustments(selectedStoreId).catch(() => null)
      ]);
      if (poRes && Array.isArray(poRes.data)) setPurchaseOrders(poRes.data);
      if (Array.isArray(grRes)) setGoodsReceipts(grRes);
      if (Array.isArray(catRes)) setCategories(catRes);
      if (adjRes && Array.isArray(adjRes.data)) setAdjustments(adjRes.data);
    } catch {}
  };

  const loadSales = async () => {
    setLoadingSales(true);
    try {
      const res = await api.fetchSalesHistory(80, selectedStoreId);
      if (res && res.success) {
        setSalesHistory(Array.isArray(res.data) ? res.data : []);
      }
    } catch {}
    finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    loadAuxData();
  }, [selectedStoreId]);

  useEffect(() => {
    if (subTab === 'inbound') {
      loadSales();
    }
    if (subTab === 'stocktake') {
      loadAuxData();
    }
  }, [subTab, selectedStoreId]);

  useEffect(() => {
    if (products.length > 0 && !products.some(p => Number(p.id) === Number(selectedProductId))) {
      setSelectedProductId(products[0].id);
      setCostPrice(products[0].costPrice || 22000);
    }
  }, [products]);

  // Tính toán RSL_inbound cho modal tiếp nhận DC (kiểm tra chặt thứ tự Ngày SX <= Ngày giao < Hạn dùng)
  const { totalLifeDays, remainingDays, daysPassed, inboundRsl, isRslQualified, intakeDateError } = useMemo(() => {
    const parseDayMs = (s) => {
      if (!s) return NaN;
      const parts = String(s).slice(0, 10).split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return NaN;
      return Date.UTC(parts[0], parts[1] - 1, parts[2]);
    };
    const mfgMs = parseDayMs(manufactureDate);
    const impMs = parseDayMs(importDate);
    const expMs = parseDayMs(expiryDate);

    if (isNaN(mfgMs) || isNaN(impMs) || isNaN(expMs)) {
      return {
        totalLifeDays: 0,
        remainingDays: 0,
        daysPassed: 0,
        inboundRsl: 0,
        isRslQualified: false,
        intakeDateError: 'Vui lòng nhập đầy đủ Ngày SX, Ngày giao và Hạn dùng.'
      };
    }
    if (expMs <= mfgMs) {
      return {
        totalLifeDays: 0,
        remainingDays: 0,
        daysPassed: Math.max(0, Math.round((impMs - mfgMs) / 86400000)),
        inboundRsl: 0,
        isRslQualified: false,
        intakeDateError: 'Hạn dùng (EXP) bắt buộc phải lớn hơn Ngày SX (MFG).'
      };
    }
    if (mfgMs > impMs) {
      return {
        totalLifeDays: Math.round((expMs - mfgMs) / 86400000),
        remainingDays: Math.round((expMs - impMs) / 86400000),
        daysPassed: 0,
        inboundRsl: 0,
        isRslQualified: false,
        intakeDateError: 'Ngày SX (MFG) không thể lớn hơn Ngày xe tải giao.'
      };
    }

    const total = Math.round((expMs - mfgMs) / 86400000);
    const rem = Math.round((expMs - impMs) / 86400000);
    const passed = Math.max(0, Math.round((impMs - mfgMs) / 86400000));
    const rsl = rem <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((rem / total) * 100)));
    return {
      totalLifeDays: total,
      remainingDays: rem,
      daysPassed: passed,
      inboundRsl: rsl,
      isRslQualified: rsl >= minRslThreshold && rem > 0,
      intakeDateError: ''
    };
  }, [manufactureDate, importDate, expiryDate, minRslThreshold]);

  const getProductLiveStock = (prodId) => {
    return batches
      .filter(b => Number(b.productId) === Number(prodId) && b.status !== 'EXPIRED' && b.status !== 'DISPOSED')
      .reduce((s, b) => s + Number(b.currentQuantity ?? b.quantity ?? 0), 0);
  };

  const handleIntakeProductChange = (prodId) => {
    setSelectedProductId(Number(prodId));
    const p = products.find(item => Number(item.id) === Number(prodId));
    if (p) {
      setCostPrice(p.costPrice || 22000);
      const life = Number(p.shelfLifeDays || 14);
      const impD = new Date(importDate || new Date());
      const mfgD = new Date(impD);
      mfgD.setDate(mfgD.getDate() - 1);
      const expD = new Date(mfgD);
      expD.setDate(expD.getDate() + life);
      setManufactureDate(mfgD.toISOString().slice(0, 10));
      setExpiryDate(expD.toISOString().slice(0, 10));
      setBatchCode(buildBatchCode(p.sku || prodId, importDate));
      if (selectedPoId) {
        const activePo = purchaseOrders.find(o => String(o.id) === String(selectedPoId));
        const matchedItem = activePo?.items?.find(it => Number(it.productId) === Number(prodId));
        if (matchedItem) {
          setQuantity(matchedItem.approvedQuantity || matchedItem.suggestedQuantity || 20);
        }
      }
    }
  };

  const openIntakeModal = () => {
    setIntakeError('');
    setSelectedPoId('');
    const currentProd = products.find(p => Number(p.id) === Number(selectedProductId)) || products[0];
    if (currentProd) {
      setSelectedProductId(Number(currentProd.id));
      setCostPrice(currentProd.costPrice || 22000);
      setBatchCode(buildBatchCode(currentProd.sku || currentProd.id, importDate));
    } else {
      setBatchCode(buildBatchCode('SKU', importDate));
    }
    setShowIntakeModal(true);
  };

  const handleSubmitIntake = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIntakeError('');
    if (intakeDateError) {
      setIntakeError(intakeDateError);
      return;
    }
    if (!isRslQualified) {
      setIntakeError(`Lô hàng có RSL_inbound = ${inboundRsl}% (< ${minRslThreshold}%). Vui lòng lập Biên bản Từ chối nhận hàng!`);
      return;
    }
    setIsSubmittingIntake(true);
    try {
      const targetStoreId = selectedStoreId !== 'ALL' ? Number(selectedStoreId) : Number(currentUser?.storeId || 1);
      const payload = {
        storeId: targetStoreId,
        supplierId: 1,
        purchaseOrderId: selectedPoId ? Number(selectedPoId) : null,
        receiptDate: importDate,
        batches: [
          {
            productId: Number(selectedProductId),
            batchCode: batchCode.trim(),
            manufactureDate,
            expiryDate,
            quantity: Number(quantity),
            importPrice: Number(costPrice)
          }
        ]
      };
      const res = onAddBatch ? await onAddBatch(payload) : await api.apiReceiveDCInbound(payload);
      if (res && res.success) {
        if (selectedPoId) {
          await api.apiUpdatePOStatus(Number(selectedPoId), 'DELIVERED', 'Đã tiếp nhận đủ vào kho').catch(() => {});
          setSelectedPoId('');
        }
        setShowIntakeModal(false);
        setToast({ type: 'success', text: res.message || `Đã nhập thành công lô ${batchCode} (+${quantity} ĐV) với RSL ${inboundRsl}%.` });
        const curProd = products.find(p => Number(p.id) === Number(selectedProductId));
        setBatchCode(buildBatchCode(curProd?.sku || selectedProductId, importDate));
        await loadAuxData();
        if (onRefreshData) await onRefreshData();
      } else {
        setIntakeError(res?.message || 'Không thể nhập lô hàng từ DC.');
      }
    } catch (err) {
      setIntakeError(err.message || 'Lỗi kết nối máy chủ khi nhập kho.');
    } finally {
      setIsSubmittingIntake(false);
    }
  };

  const handleRejectIntake = async () => {
    setIntakeError('');
    setIsRejectingIntake(true);
    try {
      const targetStoreId = selectedStoreId !== 'ALL' ? Number(selectedStoreId) : Number(currentUser?.storeId || 1);
      const prod = products.find(p => Number(p.id) === Number(selectedProductId));
      const res = await api.apiRejectDCInbound({
        storeId: targetStoreId,
        productId: Number(selectedProductId),
        productName: prod?.name,
        productSku: prod?.sku,
        batchCode,
        manufactureDate,
        importDate,
        expiryDate,
        quantity: Number(quantity),
        reason: `RSL_inbound = ${inboundRsl}% thấp hơn ngưỡng chuẩn ${minRslThreshold}%`
      });
      if (res && res.success) {
        setShowIntakeModal(false);
        setToast({ type: 'success', text: res.message || `Đã lập Biên bản Từ chối nhận hàng RSL = ${inboundRsl}% (< ${minRslThreshold}%).` });
      } else {
        setIntakeError(res?.message || 'Không thể lập biên bản từ chối.');
      }
    } catch (err) {
      setIntakeError(err.message);
    } finally {
      setIsRejectingIntake(false);
    }
  };

  // Bộ lọc & sắp xếp lô hàng (Thứ tự hiển thị: Xanh -> Vàng -> Đỏ -> Quá hạn)
  const filteredBatches = useMemo(() => {
    const q = stripVietnamese(batchSearch);
    const list = batches.filter(b => {
      const curQty = Number(b.currentQuantity ?? b.quantity ?? 0);
      if (batchStockFilter === 'IN_STOCK' && (curQty <= 0 || String(b.status).toUpperCase() === 'DISPOSED')) {
        return false;
      }
      const meta = getBatchAlertMeta(b);
      if (batchZoneFilter !== 'ALL' && meta.key !== batchZoneFilter) {
        return false;
      }
      if (q) {
        const hay = `${stripVietnamese(b.productName)} ${stripVietnamese(b.batchCode)} ${stripVietnamese(b.productSku || b.sku)} ${stripVietnamese(b.storeName)}`;
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const metaA = getBatchAlertMeta(a);
      const metaB = getBatchAlertMeta(b);
      const rankA = ZONE_DISPLAY_ORDER[metaA.key] ?? 9;
      const rankB = ZONE_DISPLAY_ORDER[metaB.key] ?? 9;
      if (rankA !== rankB) return rankA - rankB;
      if (metaA.key === 'GREEN') {
        return Number(b.id || 0) - Number(a.id || 0);
      }
      if (metaA.key === 'EXPIRED') {
        return Number(b.daysLeft ?? 0) - Number(a.daysLeft ?? 0);
      }
      return Number(a.daysLeft ?? 0) - Number(b.daysLeft ?? 0);
    });
  }, [batches, batchSearch, batchZoneFilter, batchStockFilter]);

  // Bộ lọc sản phẩm
  const filteredProducts = useMemo(() => {
    const q = stripVietnamese(prodSearch);
    return products.filter(p => {
      if (prodCatFilter !== 'ALL' && String(p.categoryId) !== String(prodCatFilter)) return false;
      if (q) {
        const hay = `${stripVietnamese(p.name)} ${stripVietnamese(p.sku)} ${stripVietnamese(p.categoryName || p.category)}`;
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, prodSearch, prodCatFilter]);

  // Bộ lọc lịch sử bán lẻ POS
  const filteredSales = useMemo(() => {
    const q = stripVietnamese(salesSearch);
    if (!q) return salesHistory;
    return salesHistory.filter(s => {
      const hay = `${stripVietnamese(s.transactionCode)} ${stripVietnamese(s.productName)} ${stripVietnamese(s.batchCode)} ${stripVietnamese(s.productSku)}`;
      return hay.includes(q);
    });
  }, [salesHistory, salesSearch]);

  const openCreateProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      name: '',
      categoryId: categories[0]?.id || 1,
      unit: 'Hộp',
      packSize: 1,
      costPrice: 20000,
      sellingPrice: 28000,
      shelfLifeDays: 14,
      minStockLevel: 15,
      maxStockLevel: 150,
      customWarningDays: 5
    });
    setProductFormError('');
    setProductModalMode('CREATE');
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      sku: prod.sku || '',
      name: prod.name || '',
      categoryId: Number(prod.categoryId || 1),
      unit: prod.unit || 'Hộp',
      packSize: Math.max(1, Number(prod.packSize || 1)),
      costPrice: Number(prod.costPrice || 0),
      sellingPrice: Number(prod.sellingPrice || prod.price || 0),
      shelfLifeDays: Number(prod.shelfLifeDays || 14),
      minStockLevel: Number(prod.minStockLevel || 15),
      maxStockLevel: Number(prod.maxStockLevel || 150),
      customWarningDays: Number(prod.customWarningDays || 5)
    });
    setProductFormError('');
    setProductModalMode('EDIT');
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setCatError('');
    try {
      const res = editingCat
        ? await api.apiUpdateCategory(editingCat.id, catForm)
        : await api.apiCreateCategory(catForm);
      if (res && res.success) {
        setToast({ type: 'success', text: res.message || 'Đã lưu nhóm hàng.' });
        setEditingCat(null);
        setCatForm({ code: '', name: '', storageTemperature: 'Nhiệt độ phòng (25°C)', defaultWarningDays: 7 });
        await loadAuxData();
      } else {
        setCatError(res?.message || 'Không thể lưu nhóm hàng.');
      }
    } catch (err) {
      setCatError(err.message);
    }
  };

  const handleRecordQuickSale = async (e) => {
    e.preventDefault();
    setSaleError('');
    setSubmittingSale(true);
    try {
      const targetSid = selectedStoreId !== 'ALL' ? Number(selectedStoreId) : Number(saleForm.storeId || currentUser?.storeId || 1);
      const res = await api.apiProcessFefoSale(
        [{ productId: Number(saleForm.productId), quantity: Number(saleForm.quantity) }],
        weather?.condition || 'NORMAL',
        Boolean(weather?.isHoliday),
        {
          storeId: targetSid,
          saleDate: saleForm.saleDate,
          transactionCode: saleForm.transactionCode.trim() || undefined
        }
      );
      if (res && res.success) {
        setShowSaleModal(false);
        setToast({ type: 'success', text: `Đã ghi nhận xuất bán ${saleForm.quantity} ĐV theo FEFO (${res.transactionCode}).` });
        await loadSales();
        if (onRefreshData) await onRefreshData();
      } else {
        setSaleError(res?.message || 'Không thể ghi nhận xuất bán.');
      }
    } catch (err) {
      setSaleError(err.message || 'Lỗi kết nối.');
    } finally {
      setSubmittingSale(false);
    }
  };

  const handleRecordAdjustment = async (e) => {
    e.preventDefault();
    if (!adjForm.batchId) {
      setToast({ type: 'error', text: 'Vui lòng chọn lô hàng cần kiểm kê/xuất kho.' });
      return;
    }
    if (adjForm.adjustmentType === 'STOCKTAKE' && adjForm.actualQuantity === '') {
      setToast({ type: 'error', text: 'Vui lòng nhập số lượng tồn thực tế sau kiểm kê.' });
      return;
    }
    if (adjForm.adjustmentType === 'STOCK_OUT' && (adjForm.quantity === '' || Number(adjForm.quantity) < 1)) {
      setToast({ type: 'error', text: 'Số lượng xuất kho phải từ 1 trở lên.' });
      return;
    }
    setAdjSubmitting(true);
    try {
      const payload = adjForm.adjustmentType === 'STOCKTAKE'
        ? { adjustmentType: 'STOCKTAKE', actualQuantity: Number(adjForm.actualQuantity), reason: adjForm.reason }
        : { adjustmentType: 'STOCK_OUT', quantity: Number(adjForm.quantity), reason: adjForm.reason };
      const res = await api.apiRecordBatchStocktake(Number(adjForm.batchId), payload);
      if (res && res.success) {
        setToast({ type: 'success', text: res.message || 'Đã cập nhật tồn kho.' });
        setAdjForm(prev => ({ ...prev, reason: '' }));
        await loadAuxData();
        if (onRefreshData) await onRefreshData();
      } else {
        setToast({ type: 'error', text: res?.message || 'Lỗi khi ghi nhận điều chỉnh kho.' });
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message });
    } finally {
      setAdjSubmitting(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setProductFormError('');
    setSavingProduct(true);
    try {
      const res = productModalMode === 'CREATE'
        ? await onAddNewProduct(productForm)
        : await onUpdateProduct(editingProduct.id, productForm);
      if (res && res.success) {
        setProductModalMode(null);
        setToast({ type: 'success', text: res.message || 'Lưu sản phẩm thành công!' });
      } else {
        setProductFormError(res?.message || 'Không thể lưu sản phẩm (kiểm tra trùng SKU/tên >= 85%).');
      }
    } catch (err) {
      setProductFormError(err.message || 'Lỗi kết nối.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleOpenReceiptDetail = async (txnCode) => {
    try {
      const res = await api.apiGetReceipt(txnCode);
      if (res && res.success && res.data) {
        setSelectedReceipt(res.data);
      }
    } catch {}
  };

  const availableUnitsCount = batches
    .filter(b => b.status !== 'EXPIRED' && b.status !== 'DISPOSED')
    .reduce((s, b) => s + Number(b.currentQuantity ?? b.quantity ?? 0), 0);
  const totalInvValue = batches
    .filter(b => b.status !== 'EXPIRED' && b.status !== 'DISPOSED')
    .reduce((s, b) => s + (Number(b.currentQuantity ?? b.quantity ?? 0) * Number(b.importPrice ?? 0)), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Page Header */}
      <div className="ss-page-header">
        <div>
          <h1 className="ss-page-title">Tồn kho, Lô hàng & Hạn sử dụng</h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canDoIntake && (
            <>
              <button type="button" className="ss-btn ss-btn-primary" onClick={openIntakeModal}>
                <PackagePlus size={16} /> Nhập kho
              </button>
              <button
                type="button"
                className="ss-btn ss-btn-secondary"
                onClick={() => {
                  setSaleError('');
                  setSaleForm(prev => ({
                    ...prev,
                    storeId: selectedStoreId !== 'ALL' ? Number(selectedStoreId) : Number(currentUser?.storeId || 1),
                    productId: products[0]?.id || 1
                  }));
                  setShowSaleModal(true);
                }}
              >
                <Plus size={15} /> Ghi nhận xuất bán
              </button>
            </>
          )}
          <button type="button" className="ss-btn ss-btn-secondary" onClick={() => exportBatchesFefoToExcel(filteredBatches)}>
            <Download size={15} /> Xuất Excel
          </button>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: toast.type === 'error' ? 'var(--danger-red-bg)' : 'var(--safe-green-bg)',
            border: `1px solid ${toast.type === 'error' ? 'var(--danger-red-border)' : 'var(--safe-green-border)'}`,
            color: toast.type === 'error' ? 'var(--danger-red-light)' : 'var(--safe-green-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.text}
          </span>
          <button type="button" onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}>
            Đóng
          </button>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="ss-kpi-grid">
        <div className="ss-card ss-card-pad">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Danh mục đang kinh doanh</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '4px' }}>{products.length} SKU</div>
        </div>
        <div className="ss-card ss-card-pad">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tổng tồn khả dụng</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
            {availableUnitsCount.toLocaleString('vi-VN')} ĐV
          </div>
        </div>
        <div className="ss-card ss-card-pad">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Giá trị vốn lưu kho</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '4px' }}>
            {totalInvValue.toLocaleString('vi-VN')} đ
          </div>
        </div>
        <div className="ss-card ss-card-pad">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Phiếu nhập DC đã ghi nhận</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-blue-light)', marginTop: '4px' }}>
            {goodsReceipts.length} phiếu
          </div>
        </div>
      </div>

      {/* Main Sub-Tabs Container */}
      <section className="ss-card" style={{ overflow: 'hidden' }}>
        <div role="tablist" aria-label="Các phân hệ quản lý kho" className="ss-tablist">
          <button type="button" role="tab" id="inv-tab-batches" aria-selected={subTab === 'batches'} className="ss-tab" onClick={() => setSubTab('batches')}>
            <Boxes size={15} /> Kho lô & HSD ({batches.length})
          </button>
          {canDoIntake && (
            <button type="button" role="tab" id="inv-tab-inbound" aria-selected={subTab === 'inbound'} className="ss-tab" onClick={() => setSubTab('inbound')}>
              <PackagePlus size={15} /> Nhập & Xuất bán ({goodsReceipts.length})
            </button>
          )}
          <button type="button" role="tab" id="inv-tab-stocktake" aria-selected={subTab === 'stocktake'} className="ss-tab" onClick={() => setSubTab('stocktake')}>
            <CheckCircle2 size={15} /> Kiểm kê & Xuất kho ({adjustments.length})
          </button>
          {canViewCatalog && (
            <button type="button" role="tab" id="inv-tab-catalog" aria-selected={subTab === 'catalog'} className="ss-tab" onClick={() => setSubTab('catalog')}>
              <Package size={15} /> Sản phẩm & Nhóm hàng ({products.length})
            </button>
          )}
        </div>

        <div style={{ padding: '18px 20px' }}>
          {/* PANEL 1: TỒN KHO & LÔ HẠN DÙNG */}
          <div role="tabpanel" aria-labelledby="inv-tab-batches" hidden={subTab !== 'batches'}>
            <search>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
                  <input
                    type="search"
                    aria-label="Tìm kiếm lô hàng theo tên sản phẩm, mã lô hoặc SKU"
                    placeholder="Tìm tên sản phẩm, mã lô, SKU, chi nhánh..."
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    aria-label="Lọc theo mức cảnh báo hạn dùng"
                    value={batchZoneFilter}
                    onChange={(e) => setBatchZoneFilter(e.target.value)}
                    style={{ width: 'auto' }}
                  >
                    <option value="ALL">Tất cả cấp màu</option>
                    <option value="GREEN">Vùng Xanh (An toàn)</option>
                    <option value="YELLOW">Vùng Vàng (Cảnh báo)</option>
                    <option value="RED">Vùng Đỏ (≤ 3 ngày)</option>
                    <option value="EXPIRED">Quá hạn (Khóa)</option>
                  </select>
                  <select
                    aria-label="Lọc theo tình trạng tồn"
                    value={batchStockFilter}
                    onChange={(e) => setBatchStockFilter(e.target.value)}
                    style={{ width: 'auto' }}
                  >
                    <option value="IN_STOCK">Chỉ lô còn tồn kệ</option>
                    <option value="ALL">Tất cả lô (kể cả hết/hủy)</option>
                  </select>
                </div>
              </div>
            </search>

            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Bảng chi tiết lô hàng tồn kho">
              <table className="ss-table ss-table-responsive">
                <thead>
                  <tr>
                    <th scope="col">Mã Lô & Chi nhánh</th>
                    <th scope="col">Sản phẩm</th>
                    <th scope="col">NSX → HSD</th>
                    <th scope="col">RSL %</th>
                    <th scope="col">Tồn / Đầu vào</th>
                    <th scope="col">Giá nhập / Giá bán</th>
                    <th scope="col">Trạng thái HSD</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Tem nhãn</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        Không tìm thấy lô hàng phù hợp với điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map(b => {
                      const meta = getBatchAlertMeta(b);
                      const curQty = Number(b.currentQuantity ?? b.quantity ?? 0);
                      const initQty = Number(b.initialQuantity ?? curQty);
                      const rsl = Number(b.rslPercent ?? 0);
                      return (
                        <tr key={b.id}>
                          <td data-label="Mã Lô">
                            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{b.batchCode}</div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)' }}>{b.storeName || `CN #${b.storeId || 1}`}</div>
                          </td>
                          <td data-label="Sản phẩm">
                            <div style={{ fontWeight: 700 }}>{b.productName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{b.productSku || b.sku}</div>
                          </td>
                          <td data-label="NSX → HSD" className="num-tabular" style={{ fontSize: '0.79rem' }}>
                            <div>{formatDateVN(b.manufactureDate)} → <strong>{formatDateVN(b.expiryDate)}</strong></div>
                          </td>
                          <td data-label="RSL %" className="num-tabular">
                            <span style={{ fontWeight: 700, color: rsl >= 70 ? 'var(--safe-green-light)' : rsl >= 30 ? 'var(--warning-yellow-light)' : 'var(--danger-red-light)' }}>
                              {rsl}%
                            </span>
                          </td>
                          <td data-label="Tồn" className="num-tabular">
                            <strong>{curQty}</strong> <span style={{ color: 'var(--text-dim)' }}>/ {initQty} {b.unit || 'ĐV'}</span>
                          </td>
                          <td data-label="Giá" className="num-tabular" style={{ fontSize: '0.79rem' }}>
                            <div>Vốn: {Number(b.importPrice || 0).toLocaleString('vi-VN')} đ</div>
                            <div>
                              Bán: <strong>{Number(b.discountedPrice || b.sellingPrice || 0).toLocaleString('vi-VN')} đ</strong>
                              {Number(b.discountPercent || 0) > 0 && (
                                <span className="ss-badge ss-badge-warning" style={{ marginLeft: '5px', fontSize: '0.66rem' }}>-{b.discountPercent}%</span>
                              )}
                            </div>
                          </td>
                          <td data-label="Cảnh báo">
                            <span className={`ss-badge ${meta.badgeClass}`}>{meta.label}</span>
                          </td>
                          <td data-label="Tem nhãn" style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="ss-btn ss-btn-secondary ss-btn-sm"
                              onClick={() => setPrintBatchLabelData(b)}
                              title="In tem nhãn lô hàng"
                            >
                              <Printer size={13} /> In tem
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

          {/* PANEL 2: NHẬP KHO & XUẤT BÁN FEFO */}
          {canDoIntake && (
            <div role="tabpanel" aria-labelledby="inv-tab-inbound" hidden={subTab !== 'inbound'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', padding: '10px 14px', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  <ShieldCheck size={18} color="var(--primary)" aria-hidden="true" />
                  <span>Hạn sử dụng còn lại khi nhập kho tối thiểu: RSL ≥ {minRslThreshold}%</span>
                </div>
                <button type="button" className="ss-btn ss-btn-primary ss-btn-sm" onClick={openIntakeModal}>
                  <PackagePlus size={15} /> Nhập kho mới
                </button>
              </div>

              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '10px' }}>
                Phiếu nhập kho ({goodsReceipts.length})
              </h3>
              <div className="table-wrapper" tabIndex={0} role="region" aria-label="Danh sách phiếu nhập kho" style={{ marginBottom: '22px' }}>
                <table className="ss-table ss-table-responsive">
                  <thead>
                    <tr>
                      <th scope="col">Số phiếu</th>
                      <th scope="col">Ngày nhập</th>
                      <th scope="col">Nguồn nhập</th>
                      <th scope="col">Người nhận</th>
                      <th scope="col">Số lô</th>
                      <th scope="col">Tổng giá trị</th>
                      <th scope="col">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goodsReceipts.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                          Chưa có phiếu nhập kho nào.
                        </td>
                      </tr>
                    ) : (
                      goodsReceipts.map(gr => (
                        <tr key={gr.id}>
                          <td data-label="Số phiếu" style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{gr.receiptNumber}</td>
                          <td data-label="Ngày nhập" className="num-tabular">{formatDateVN(gr.receiptDate || gr.createdAt)}</td>
                          <td data-label="Nguồn nhập">{gr.supplierName || 'Kho tổng / NCC'}</td>
                          <td data-label="Người nhận">{gr.receivedByName || 'Nhân viên kho'}</td>
                          <td data-label="Số lô" className="num-tabular">{gr.batchCount || 1} lô</td>
                          <td data-label="Giá trị" className="num-tabular" style={{ fontWeight: 700 }}>{Number(gr.totalCost || 0).toLocaleString('vi-VN')} đ</td>
                          <td data-label="Trạng thái"><span className="ss-badge ss-badge-safe">{gr.status || 'COMPLETED'}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {canViewSales && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>
                      Lịch sử xuất bán FEFO ({filteredSales.length})
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <input
                        type="search"
                        aria-label="Tìm lịch sử bán hàng POS"
                        placeholder="Tìm mã đơn, sản phẩm, mã lô..."
                        value={salesSearch}
                        onChange={(e) => setSalesSearch(e.target.value)}
                        style={{ maxWidth: '240px' }}
                      />
                      <button
                        type="button"
                        className="ss-btn ss-btn-primary ss-btn-sm"
                        onClick={() => {
                          setSaleError('');
                          setSaleForm(prev => ({
                            ...prev,
                            storeId: selectedStoreId !== 'ALL' ? Number(selectedStoreId) : Number(currentUser?.storeId || 1),
                            productId: products[0]?.id || 1
                          }));
                          setShowSaleModal(true);
                        }}
                      >
                        <Plus size={14} /> Ghi nhận xuất bán
                      </button>
                      {setActiveTab && (
                        <button type="button" className="ss-btn ss-btn-secondary ss-btn-sm" onClick={() => setActiveTab('settings-integration')}>
                          Nhập Excel POS
                        </button>
                      )}
                      <button type="button" className="ss-btn ss-btn-secondary ss-btn-sm" onClick={loadSales} disabled={loadingSales}>
                        <RefreshCw size={13} style={{ animation: loadingSales ? 'spin 1s linear infinite' : 'none' }} /> Tải lại
                      </button>
                      <button type="button" className="ss-btn ss-btn-secondary ss-btn-sm" onClick={() => exportSalesHistoryToExcel(filteredSales)}>
                        <Download size={13} /> Xuất Excel
                      </button>
                    </div>
                  </div>

                  <div className="table-wrapper" tabIndex={0} role="region" aria-label="Lịch sử giao dịch bán lẻ FEFO">
                    <table className="ss-table ss-table-responsive">
                      <thead>
                        <tr>
                          <th scope="col">Mã Giao dịch</th>
                          <th scope="col">Ngày bán & Chi nhánh</th>
                          <th scope="col">Sản phẩm</th>
                          <th scope="col">Lô FEFO đã trừ</th>
                          <th scope="col">Số lượng</th>
                          <th scope="col">Thành tiền</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Chi tiết</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                              Chưa có giao dịch xuất bán nào.
                            </td>
                          </tr>
                        ) : (
                          filteredSales.map(s => (
                            <tr key={s.id}>
                              <td data-label="Mã GD" style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{s.transactionCode}</td>
                              <td data-label="Ngày & CN">
                                <div>{formatDateVN(s.saleDate || s.createdAt)}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{s.storeName || `CN #${s.storeId || 1}`}</div>
                              </td>
                              <td data-label="Sản phẩm">
                                <div style={{ fontWeight: 600 }}>{s.productName}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{s.productSku}</div>
                              </td>
                              <td data-label="Lô FEFO" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{s.batchCode}</td>
                              <td data-label="SL" className="num-tabular">{s.quantitySold} {s.unit || 'ĐV'}</td>
                              <td data-label="Thành tiền" className="num-tabular" style={{ fontWeight: 700 }}>{Number(s.totalAmount || 0).toLocaleString('vi-VN')} đ</td>
                              <td data-label="Chi tiết" style={{ textAlign: 'right' }}>
                                <button type="button" className="ss-btn ss-btn-secondary ss-btn-sm" onClick={() => handleOpenReceiptDetail(s.transactionCode)}>
                                  <FileText size={13} /> Hóa đơn
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* PANEL 3: DANH MỤC SẢN PHẨM */}
          {canViewCatalog && (
            <div role="tabpanel" aria-labelledby="inv-tab-catalog" hidden={subTab !== 'catalog'}>
              <search>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
                    <input
                      type="search"
                      aria-label="Tìm kiếm sản phẩm theo tên hoặc SKU"
                      placeholder="Tìm tên sản phẩm, mã SKU..."
                      value={prodSearch}
                      onChange={(e) => setProdSearch(e.target.value)}
                      style={{ maxWidth: '320px' }}
                    />
                    <select
                      aria-label="Lọc theo ngành hàng"
                      value={prodCatFilter}
                      onChange={(e) => setProdCatFilter(e.target.value)}
                      style={{ width: 'auto' }}
                    >
                      <option value="ALL">Tất cả ngành hàng ({categories.length})</option>
                      {categories.map(c => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  {canManageCatalog && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="ss-btn ss-btn-secondary"
                        onClick={() => {
                          setCatError('');
                          setEditingCat(null);
                          setCatForm({ code: '', name: '', storageTemperature: 'Nhiệt độ phòng (25°C)', defaultWarningDays: 7 });
                          setShowCatModal(true);
                        }}
                      >
                        Nhóm hàng ({categories.length})
                      </button>
                      <button type="button" className="ss-btn ss-btn-primary" onClick={openCreateProductModal}>
                        <Plus size={15} /> Thêm Sản phẩm
                      </button>
                    </div>
                  )}
                </div>
              </search>

              <div className="table-wrapper" tabIndex={0} role="region" aria-label="Danh mục sản phẩm FMCG">
                <table className="ss-table ss-table-responsive">
                  <thead>
                    <tr>
                      <th scope="col">SKU & Sản phẩm</th>
                      <th scope="col">Ngành hàng</th>
                      <th scope="col">Tồn thực tế</th>
                      <th scope="col">Min / Max Stock</th>
                      <th scope="col">Hạn chuẩn & Cảnh báo</th>
                      <th scope="col">Giá vốn / Giá bán</th>
                      {canManageCatalog && <th scope="col" style={{ textAlign: 'right' }}>Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => {
                      const liveStock = getProductLiveStock(p.id);
                      const isLow = liveStock <= Number(p.minStockLevel || 15);
                      return (
                        <tr key={p.id}>
                          <td data-label="Sản phẩm">
                            <div style={{ fontWeight: 700 }}>{p.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                              {p.sku} • {p.unit || 'ĐV'}{Number(p.packSize || 1) > 1 ? ` (${p.packSize} ĐV/kiện)` : ''}
                            </div>
                          </td>
                          <td data-label="Ngành hàng">{p.categoryName || p.category || 'FMCG'}</td>
                          <td data-label="Tồn thực tế" className="num-tabular">
                            <span className={`ss-badge ${isLow ? 'ss-badge-danger' : 'ss-badge-safe'}`}>
                              {liveStock.toLocaleString('vi-VN')} {p.unit || 'ĐV'}
                            </span>
                          </td>
                          <td data-label="Min/Max" className="num-tabular">{p.minStockLevel || 15} / {p.maxStockLevel || 150}</td>
                          <td data-label="Hạn chuẩn" className="num-tabular">{p.shelfLifeDays || 14}d (Cảnh báo {p.customWarningDays || 5}d)</td>
                          <td data-label="Giá" className="num-tabular">
                            <div>Vốn: {Number(p.costPrice || 0).toLocaleString('vi-VN')} đ</div>
                            <div>Bán: <strong>{Number(p.sellingPrice || p.price || 0).toLocaleString('vi-VN')} đ</strong></div>
                          </td>
                          {canManageCatalog && (
                            <td data-label="Thao tác" style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button type="button" className="ss-btn ss-btn-secondary ss-btn-sm" onClick={() => openEditProductModal(p)}>
                                  <Edit3 size={13} /> Sửa
                                </button>
                                <button
                                  type="button"
                                  className="ss-btn ss-btn-secondary ss-btn-sm"
                                  style={{ color: 'var(--danger-red-light)' }}
                                  onClick={async () => {
                                    if (!window.confirm(`Ngừng kinh doanh sản phẩm "${p.name}"?`)) return;
                                    const res = await onDeleteProduct(p.id);
                                    if (res && res.success) {
                                      setToast({ type: 'success', text: res.message || 'Đã ngừng kinh doanh sản phẩm.' });
                                    } else {
                                      setToast({ type: 'error', text: res?.message || 'Không thể ngừng kinh doanh sản phẩm đang còn tồn lô.' });
                                    }
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PANEL 4: KIỂM KÊ THỰC TẾ & XUẤT KHO */}
          <div role="tabpanel" aria-labelledby="inv-tab-stocktake" hidden={subTab !== 'stocktake'}>
            <form onSubmit={handleRecordAdjustment} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '18px', padding: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', alignItems: 'end' }}>
              <div className="ss-field">
                <label className="ss-label" htmlFor="adj-batch">Lô hàng cần điều chỉnh</label>
                <select
                  id="adj-batch"
                  required
                  value={adjForm.batchId}
                  onChange={(e) => {
                    const bid = e.target.value;
                    const found = batches.find(b => String(b.id) === String(bid));
                    setAdjForm(prev => ({
                      ...prev,
                      batchId: bid,
                      actualQuantity: found ? String(Number(found.currentQuantity ?? 0)) : ''
                    }));
                  }}
                >
                  <option value="">-- Chọn lô hàng --</option>
                  {batches
                    .filter(b => b.status !== 'DISPOSED')
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        {b.batchCode} • {b.productName} (Tồn: {Number(b.currentQuantity ?? 0)})
                      </option>
                    ))}
                </select>
              </div>
              <div className="ss-field">
                <label className="ss-label" htmlFor="adj-type">Nghiệp vụ</label>
                <select
                  id="adj-type"
                  value={adjForm.adjustmentType}
                  onChange={(e) => setAdjForm(prev => ({ ...prev, adjustmentType: e.target.value }))}
                >
                  <option value="STOCKTAKE">Kiểm kê tồn thực tế</option>
                  <option value="STOCK_OUT">Xuất kho khác</option>
                </select>
              </div>
              {adjForm.adjustmentType === 'STOCKTAKE' ? (
                <div className="ss-field">
                  <label className="ss-label" htmlFor="adj-actual">Tồn thực tế sau kiểm kê</label>
                  <input
                    id="adj-actual"
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Nhập số đếm thực tế..."
                    value={adjForm.actualQuantity}
                    onChange={(e) => setAdjForm(prev => ({ ...prev, actualQuantity: sanitizeIntInput(e.target.value) }))}
                  />
                </div>
              ) : (
                <div className="ss-field">
                  <label className="ss-label" htmlFor="adj-out">Số lượng xuất</label>
                  <input
                    id="adj-out"
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Nhập SL xuất..."
                    value={adjForm.quantity}
                    onChange={(e) => setAdjForm(prev => ({ ...prev, quantity: sanitizeIntInput(e.target.value) }))}
                  />
                </div>
              )}
              <div className="ss-field">
                <label className="ss-label" htmlFor="adj-reason">Lý do</label>
                <input
                  id="adj-reason"
                  type="text"
                  required
                  placeholder="VD: Kiểm kê cuối ca / Xuất mẫu..."
                  value={adjForm.reason}
                  onChange={(e) => setAdjForm(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
              <button type="submit" className="ss-btn ss-btn-primary" disabled={adjSubmitting}>
                {adjSubmitting ? 'Đang lưu...' : 'Cập nhật kho'}
              </button>
            </form>

            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Lịch sử kiểm kê và xuất kho">
              <table className="ss-table ss-table-responsive">
                <thead>
                  <tr>
                    <th scope="col">Thời gian</th>
                    <th scope="col">Mã lô</th>
                    <th scope="col">Sản phẩm</th>
                    <th scope="col">Loại</th>
                    <th scope="col">Trước → Sau</th>
                    <th scope="col">Chênh lệch</th>
                    <th scope="col">Lý do</th>
                    <th scope="col">Người thực hiện</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustments.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        Chưa có phiếu kiểm kê / xuất kho nào.
                      </td>
                    </tr>
                  ) : (
                    adjustments.map(a => (
                      <tr key={a.id}>
                        <td data-label="Thời gian" className="num-tabular">{formatDateVN(a.createdAt)}</td>
                        <td data-label="Mã lô" style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{a.batchCode}</td>
                        <td data-label="Sản phẩm">
                          <div style={{ fontWeight: 600 }}>{a.productName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{a.productSku}</div>
                        </td>
                        <td data-label="Loại">
                          <span className={`ss-badge ${a.adjustmentType === 'STOCKTAKE' ? 'ss-badge-info' : 'ss-badge-warning'}`}>
                            {a.adjustmentType === 'STOCKTAKE' ? 'Kiểm kê' : 'Xuất kho'}
                          </span>
                        </td>
                        <td data-label="Trước → Sau" className="num-tabular">{a.systemQuantity ?? 0} → <strong>{a.actualQuantity ?? 0}</strong></td>
                        <td data-label="Chênh lệch" className="num-tabular" style={{ fontWeight: 700, color: Number(a.quantityDelta ?? 0) < 0 ? 'var(--danger-red-light)' : Number(a.quantityDelta ?? 0) > 0 ? 'var(--safe-green-light)' : 'var(--text-muted)' }}>
                          {Number(a.quantityDelta ?? 0) > 0 ? `+${a.quantityDelta}` : (a.quantityDelta ?? 0)}
                        </td>
                        <td data-label="Lý do">{a.reason || '—'}</td>
                        <td data-label="Người TH">{a.performedByName || 'Nhân viên kho'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Modals tái sử dụng */}
      <DcIntakeModal
        isOpen={showIntakeModal}
        onClose={() => setShowIntakeModal(false)}
        products={products}
        selectedProductId={selectedProductId}
        onProductChange={handleIntakeProductChange}
        purchaseOrders={purchaseOrders}
        selectedPoId={selectedPoId}
        onSelectPo={(poId) => {
          setSelectedPoId(poId);
          const foundPo = purchaseOrders.find(o => String(o.id) === String(poId));
          const firstItem = foundPo?.items?.[0];
          if (firstItem) {
            handleIntakeProductChange(firstItem.productId);
            setQuantity(firstItem.approvedQuantity || firstItem.suggestedQuantity || 20);
          }
        }}
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
        dateError={intakeDateError}
        minRslThreshold={minRslThreshold}
        daysPassed={daysPassed}
        remainingDays={remainingDays}
        isSubmitting={isSubmittingIntake}
        isRejecting={isRejectingIntake}
        onSubmit={handleSubmitIntake}
        onReject={handleRejectIntake}
        errorMsg={intakeError}
        setErrorMsg={setIntakeError}
        onOpenBarcodeScanner={() => setShowBarcodeModal(true)}
        getProductLiveStock={getProductLiveStock}
        canManageCatalog={canManageCatalog}
        onOpenAddProduct={() => {
          setShowIntakeModal(false);
          setSubTab('catalog');
          openCreateProductModal();
        }}
      />

      <BarcodeScannerModal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        products={products}
        onScanSuccess={(scanned) => {
          if (typeof scanned === 'string') {
            const parsed = parseGs1Barcode(scanned);
            const matched = products.find(p => String(p.sku || '').trim() === String(parsed.sku || '').trim());
            if (matched) {
              handleIntakeProductChange(matched.id);
              if (parsed.batchCode) setBatchCode(parsed.batchCode);
              if (parsed.expiryDate) setExpiryDate(parsed.expiryDate);
            } else {
              setToast({ type: 'error', text: `Không tìm thấy SKU "${parsed.sku || scanned}" trong danh mục.` });
            }
          } else if (scanned && scanned.id) {
            handleIntakeProductChange(scanned.id);
          }
          setShowBarcodeModal(false);
        }}
      />

      <PrintBatchLabelModal
        isOpen={Boolean(printBatchLabelData)}
        onClose={() => setPrintBatchLabelData(null)}
        batch={printBatchLabelData}
        storeProfile={storeProfile}
      />

      {/* Create / Edit Product Native Dialog */}
      <ModalDialog
        isOpen={Boolean(productModalMode)}
        onClose={() => setProductModalMode(null)}
        title={productModalMode === 'CREATE' ? 'Thêm Sản phẩm mới' : `Sửa Sản phẩm: ${editingProduct?.sku}`}
      >
        <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
            <div className="ss-field">
              <label className="ss-label" htmlFor="prod-sku">Mã SKU *</label>
              <input id="prod-sku" type="text" required value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="prod-name">Tên sản phẩm *</label>
              <input id="prod-name" type="text" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div className="ss-field">
              <label className="ss-label" htmlFor="prod-cat">Ngành hàng</label>
              <select id="prod-cat" value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: Number(e.target.value) })}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="prod-unit">Đơn vị tính</label>
              <input id="prod-unit" type="text" required value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="prod-pack">Quy cách (ĐV/kiện)</label>
              <input id="prod-pack" type="number" min="1" required value={productForm.packSize} onChange={(e) => setProductForm({ ...productForm, packSize: Number(e.target.value) })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div className="ss-field">
              <label className="ss-label" htmlFor="prod-cost">Giá vốn (đ)</label>
              <input id="prod-cost" type="number" min="1000" required value={productForm.costPrice} onChange={(e) => setProductForm({ ...productForm, costPrice: Number(e.target.value) })} />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="prod-price">Giá bán lẻ (đ)</label>
              <input id="prod-price" type="number" min="1000" required value={productForm.sellingPrice} onChange={(e) => setProductForm({ ...productForm, sellingPrice: Number(e.target.value) })} />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="prod-life">Hạn chuẩn (ngày)</label>
              <input id="prod-life" type="number" min="1" required value={productForm.shelfLifeDays} onChange={(e) => setProductForm({ ...productForm, shelfLifeDays: Number(e.target.value) })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div className="ss-field">
              <label className="ss-label" htmlFor="prod-min">Tồn an toàn Min</label>
              <input id="prod-min" type="number" min="1" value={productForm.minStockLevel} onChange={(e) => setProductForm({ ...productForm, minStockLevel: Number(e.target.value) })} />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="prod-max">Tồn tối đa Max</label>
              <input id="prod-max" type="number" min="5" value={productForm.maxStockLevel} onChange={(e) => setProductForm({ ...productForm, maxStockLevel: Number(e.target.value) })} />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="prod-warn">Cảnh báo Vàng (ngày)</label>
              <input id="prod-warn" type="number" min="1" value={productForm.customWarningDays} onChange={(e) => setProductForm({ ...productForm, customWarningDays: Number(e.target.value) })} />
            </div>
          </div>

          {productFormError && (
            <div role="alert" style={{ padding: '10px 12px', borderRadius: '6px', background: 'var(--danger-red-bg)', border: '1px solid var(--danger-red-border)', color: 'var(--danger-red-light)', fontSize: '0.82rem', fontWeight: 600 }}>
              {productFormError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button type="button" className="ss-btn ss-btn-secondary" onClick={() => setProductModalMode(null)}>Hủy</button>
            <button type="submit" className="ss-btn ss-btn-primary" disabled={savingProduct}>
              {savingProduct ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Receipt Detail Dialog */}
      <ModalDialog
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title={`Chi tiết Hóa đơn POS: ${selectedReceipt?.transactionCode || ''}`}
        subtitle={`Chi nhánh #${selectedReceipt?.storeId || 1} • Thu ngân: ${selectedReceipt?.cashierName || 'POS Sync'}`}
      >
        {selectedReceipt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="ss-card-subtle" style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
              <span>Tổng thanh toán:</span>
              <strong className="num-tabular" style={{ color: 'var(--primary)', fontSize: '1rem' }}>
                {Number(selectedReceipt.totalAmount || 0).toLocaleString('vi-VN')} đ
              </strong>
            </div>
            <div className="table-wrapper">
              <table className="ss-table">
                <thead>
                  <tr>
                    <th scope="col">Sản phẩm</th>
                    <th scope="col">Lô FEFO</th>
                    <th scope="col">SL</th>
                    <th scope="col">Đơn giá</th>
                    <th scope="col">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedReceipt.lines || []).map((ln, idx) => (
                    <tr key={idx}>
                      <td>{ln.productName}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.76rem' }}>{ln.batchCode}</td>
                      <td className="num-tabular">{ln.quantitySold}</td>
                      <td className="num-tabular">{Number(ln.salePrice || 0).toLocaleString('vi-VN')} đ</td>
                      <td className="num-tabular" style={{ fontWeight: 700 }}>{Number(ln.lineTotal || 0).toLocaleString('vi-VN')} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ModalDialog>

      {/* Category CRUD Dialog */}
      <ModalDialog
        isOpen={showCatModal}
        onClose={() => setShowCatModal(false)}
        title={editingCat ? `Sửa Nhóm hàng: ${editingCat.name}` : 'Quản lý Nhóm hàng'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <form onSubmit={handleSaveCategory} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'end' }}>
            <div className="ss-field">
              <label className="ss-label" htmlFor="cat-code">Mã nhóm *</label>
              <input id="cat-code" type="text" required value={catForm.code} onChange={(e) => setCatForm(prev => ({ ...prev, code: e.target.value }))} placeholder="VD: DAIRY" />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="cat-name">Tên nhóm hàng *</label>
              <input id="cat-name" type="text" required value={catForm.name} onChange={(e) => setCatForm(prev => ({ ...prev, name: e.target.value }))} placeholder="VD: Sữa & Chế phẩm" />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="cat-temp">Nhiệt độ bảo quản</label>
              <input id="cat-temp" type="text" value={catForm.storageTemperature} onChange={(e) => setCatForm(prev => ({ ...prev, storageTemperature: e.target.value }))} />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="cat-warn">Ngưỡng Vàng (ngày)</label>
              <input id="cat-warn" type="number" min="1" value={catForm.defaultWarningDays} onChange={(e) => setCatForm(prev => ({ ...prev, defaultWarningDays: Number(e.target.value) }))} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="submit" className="ss-btn ss-btn-primary ss-btn-sm">
                {editingCat ? 'Lưu sửa' : 'Thêm mới'}
              </button>
              {editingCat && (
                <button
                  type="button"
                  className="ss-btn ss-btn-secondary ss-btn-sm"
                  onClick={() => {
                    setEditingCat(null);
                    setCatForm({ code: '', name: '', storageTemperature: 'Nhiệt độ phòng (25°C)', defaultWarningDays: 7 });
                  }}
                >
                  Hủy
                </button>
              )}
            </div>
          </form>

          {catError && (
            <div role="alert" style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--danger-red-bg)', border: '1px solid var(--danger-red-border)', color: 'var(--danger-red-light)', fontSize: '0.82rem', fontWeight: 600 }}>
              {catError}
            </div>
          )}

          <div className="table-wrapper" style={{ maxHeight: '260px', overflowY: 'auto' }}>
            <table className="ss-table">
              <thead>
                <tr>
                  <th scope="col">Mã</th>
                  <th scope="col">Tên nhóm</th>
                  <th scope="col">Bảo quản</th>
                  <th scope="col">Vàng</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{c.code}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.storageTemperature || '25°C'}</td>
                    <td className="num-tabular">{c.defaultWarningDays || 7}d</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="ss-btn ss-btn-secondary ss-btn-sm"
                          aria-label={`Sửa nhóm hàng ${c.name}`}
                          onClick={() => {
                            setEditingCat(c);
                            setCatForm({
                              code: c.code || '',
                              name: c.name || '',
                              storageTemperature: c.storageTemperature || 'Nhiệt độ phòng (25°C)',
                              defaultWarningDays: Number(c.defaultWarningDays || 7)
                            });
                          }}
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          type="button"
                          className="ss-btn ss-btn-secondary ss-btn-sm"
                          aria-label={`Xóa nhóm hàng ${c.name}`}
                          style={{ color: 'var(--danger-red-light)' }}
                          onClick={async () => {
                            if (!window.confirm(`Xóa nhóm hàng "${c.name}"?`)) return;
                            try {
                              const res = await api.apiDeleteCategory(c.id);
                              if (res && res.success) {
                                setToast({ type: 'success', text: 'Đã xóa nhóm hàng.' });
                                await loadAuxData();
                              } else {
                                setCatError(res?.message || 'Không thể xóa nhóm hàng đang có sản phẩm.');
                              }
                            } catch (err) {
                              setCatError(err.message);
                            }
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ModalDialog>

      {/* Quick FEFO Sale Modal */}
      <ModalDialog
        isOpen={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        title="Ghi nhận xuất bán (FEFO)"
      >
        <form onSubmit={handleRecordQuickSale} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {selectedStoreId === 'ALL' && storesList.length > 0 && (
            <div className="ss-field">
              <label className="ss-label" htmlFor="sale-store">Chi nhánh</label>
              <select
                id="sale-store"
                value={saleForm.storeId}
                onChange={(e) => setSaleForm(prev => ({ ...prev, storeId: Number(e.target.value) }))}
              >
                {storesList.map(s => (
                  <option key={s.id} value={s.id}>{s.storeName} ({s.storeCode})</option>
                ))}
              </select>
            </div>
          )}

          <div className="ss-field">
            <label className="ss-label" htmlFor="sale-prod">Sản phẩm *</label>
            <select
              id="sale-prod"
              required
              value={saleForm.productId}
              onChange={(e) => setSaleForm(prev => ({ ...prev, productId: Number(e.target.value) }))}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Tồn: {getProductLiveStock(p.id)} {p.unit || 'ĐV'}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="ss-field">
              <label className="ss-label" htmlFor="sale-qty">Số lượng xuất bán *</label>
              <input
                id="sale-qty"
                type="number"
                min="1"
                required
                value={saleForm.quantity}
                onChange={(e) => setSaleForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
              />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="sale-date">Ngày bán</label>
              <input
                id="sale-date"
                type="date"
                required
                value={saleForm.saleDate}
                onChange={(e) => setSaleForm(prev => ({ ...prev, saleDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="ss-field">
            <label className="ss-label" htmlFor="sale-txn">Mã hóa đơn (tùy chọn)</label>
            <input
              id="sale-txn"
              type="text"
              placeholder="Để trống sẽ tự tạo mã"
              value={saleForm.transactionCode}
              onChange={(e) => setSaleForm(prev => ({ ...prev, transactionCode: e.target.value }))}
            />
          </div>

          {saleError && (
            <div role="alert" style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--danger-red-bg)', border: '1px solid var(--danger-red-border)', color: 'var(--danger-red-light)', fontSize: '0.82rem', fontWeight: 600 }}>
              {saleError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button type="button" className="ss-btn ss-btn-secondary" onClick={() => setShowSaleModal(false)}>Hủy</button>
            <button type="submit" className="ss-btn ss-btn-primary" disabled={submittingSale}>
              {submittingSale ? 'Đang xử lý...' : 'Xác nhận xuất FEFO'}
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
