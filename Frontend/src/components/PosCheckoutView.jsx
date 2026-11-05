import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  CreditCard,
  Search,
  AlertTriangle,
  X,
  RotateCw,
  PackageX,
  Printer,
  Receipt,
  Banknote,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  Store,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  CloudRain,
  Cloud,
  Lock,
  Download,
  FileSpreadsheet,
  Camera,
  History,
  Tag,
  Keyboard,
  Wifi,
  WifiOff,
  HelpCircle,
  PanelRightClose,
  PanelRightOpen,
  Maximize2
} from 'lucide-react';
import { exportReceiptToExcel, exportSalesHistoryToExcel } from '../utils/exportUtils';
import BarcodeScannerModal from './BarcodeScannerModal';
import PosPaymentModal from './PosPaymentModal';
import { fetchSalesHistory, apiGetReceipt } from '../api';

// Helper: Chuẩn hóa chuỗi tiếng Việt không dấu phục vụ tìm kiếm linh hoạt
function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

export default function PosCheckoutView({
  products = [],
  batches = [],
  onProcessSale,
  weather = { condition: 'NORMAL', isHoliday: false, temp: 30 },
  setWeather,
  currentUser,
  storeProfile
}) {
  const [cart, setCart] = useState([]);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // State tính tiền thu ngân siêu thị
  const [customerPaid, setCustomerPaid] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isCartCollapsed, setIsCartCollapsed] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeSuccessToast, setBarcodeSuccessToast] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [salesHistoryList, setSalesHistoryList] = useState([]);
  const [todaySalesSummary, setTodaySalesSummary] = useState({ todayTransactionsCount: 0, todayTotalQuantity: 0, todayTotalRevenue: 0 });
  const tabsContainerRef = useRef(null);

  // Phím tắt & Trạng thái phần cứng quầy thu ngân
  const searchInputRef = useRef(null);
  const cashInputRef = useRef(null);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [isTablet, setIsTablet] = useState(typeof window !== 'undefined' ? window.innerWidth <= 1024 : false);
  const [activeMobileTab, setActiveMobileTab] = useState('PRODUCTS'); // 'PRODUCTS' hoặc 'CART' khi màn hình hẹp

  const loadPosSalesHistory = async () => {
    try {
      const res = await fetchSalesHistory(60);
      if (res && res.success) {
        setSalesHistoryList(Array.isArray(res.data) ? res.data : []);
        if (res.todaySummary) setTodaySalesSummary(res.todaySummary);
      }
    } catch (e) {
      console.warn('Không thể tải lịch sử hóa đơn POS:', e);
    }
  };

  // Xem & In lại hóa đơn POS trực tiếp từ API (Mục 22.6: GET /api/sales/receipt/:txnCode)
  const handleOpenReprintReceipt = async (order) => {
    try {
      const res = await apiGetReceipt(order.transactionCode);
      if (res && res.success && res.data) {
        const d = res.data;
        setLastReceipt({
          orderCode: d.transactionCode,
          transactionCode: d.transactionCode,
          totalAmount: d.totalAmount,
          customerPaid: d.totalAmount,
          changeDue: 0,
          checkoutTime: d.createdAt ? new Date(d.createdAt).toLocaleString('vi-VN') : (d.saleDate ? new Date(d.saleDate).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')),
          cashierName: d.cashierName,
          store: d.store,
          weather: d.weather || 'NORMAL',
          isHoliday: d.isHoliday !== undefined ? d.isHoliday : false,
          items: d.lines.map(l => ({
            productId: l.productId,
            name: l.productName,
            quantity: l.quantitySold,
            price: l.unitPrice,
            unit: l.unit || 'sp'
          })),
          fefoDetails: d.lines.map(l => ({
            productId: l.productId,
            productName: l.productName,
            unit: l.unit || 'sp',
            batchId: l.batchId,
            batchCode: l.batchCode,
            expiryDate: l.expiryDate ? String(l.expiryDate).slice(0, 10) : '',
            deductedQty: l.quantitySold,
            discountPercent: Number(l.discountPercent || 0),
            unitPrice: Number(l.unitPrice || 0),
            lineTotal: Number(l.totalRevenue || 0)
          }))
        });
      } else {
        setLastReceipt({
          orderCode: order.transactionCode,
          transactionCode: order.transactionCode,
          totalAmount: order.totalRevenue,
          customerPaid: order.totalRevenue,
          changeDue: 0,
          checkoutTime: order.saleDate ? new Date(order.saleDate).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
          cashierName: order.cashierName,
          weather: order.weather || 'NORMAL',
          isHoliday: order.isHoliday !== undefined ? order.isHoliday : false,
          items: order.lines.map(l => ({
            productId: l.productId,
            name: l.productName,
            quantity: l.quantitySold,
            price: l.unitPrice,
            unit: l.unit || 'sp'
          })),
          fefoDetails: order.lines.map(l => ({
            productId: l.productId,
            productName: l.productName,
            unit: l.unit || 'sp',
            batchId: l.batchId,
            batchCode: l.batchCode,
            expiryDate: l.expiryDate ? String(l.expiryDate).slice(0, 10) : '',
            deductedQty: l.quantitySold,
            discountPercent: Number(l.discountPercent || 0),
            unitPrice: Number(l.unitPrice || 0),
            lineTotal: Number(l.totalRevenue || 0)
          }))
        });
      }
    } catch (e) {
      console.warn('Lỗi lấy hóa đơn từ API, fallback cục bộ:', e);
    } finally {
      setShowHistoryModal(false);
      setShowReceiptModal(true);
    }
  };

  useEffect(() => {
    loadPosSalesHistory();
  }, []);

  const handleScrollTabs = (direction) => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth'
      });
    }
  };

  const handleWheelTabs = (e) => {
    if (tabsContainerRef.current && e.deltaY !== 0) {
      // Cho phép con lăn chuột dọc chuyển thành trượt ngang mượt mà
      tabsContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  // Danh mục ngành hàng tự động từ danh sách sản phẩm
  const rawCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const categories = ['ALL', ...rawCategories];

  // Helper: Tính số lượng tồn kho khả dụng chưa hết hạn của sản phẩm
  const getAvailableStock = (productId) => {
    return batches
      .filter(b =>
        b.productId === productId &&
        b.status !== 'EXPIRED' &&
        b.status !== 'DISPOSED' &&
        b.alertColor !== 'EXPIRED' &&
        ((b.currentQuantity !== undefined ? b.currentQuantity : b.quantity) > 0) &&
        (b.daysLeft === undefined || b.daysLeft > 0)
      )
      .reduce((sum, b) => sum + (b.currentQuantity !== undefined ? b.currentQuantity : (b.quantity || 0)), 0);
  };

  // Helper: Lấy danh sách các lô khả dụng đã sắp xếp chuẩn FEFO
  const getValidFefoBatches = (productId) => {
    return batches
      .filter(b =>
        b.productId === productId &&
        b.status !== 'EXPIRED' &&
        b.status !== 'DISPOSED' &&
        b.alertColor !== 'EXPIRED' &&
        ((b.currentQuantity !== undefined ? b.currentQuantity : b.quantity) > 0) &&
        (b.daysLeft === undefined || b.daysLeft > 0)
      )
      .sort((a, b) => {
        const diff = new Date(a.expiryDate) - new Date(b.expiryDate);
        if (diff !== 0) return diff;
        return (a.id || 0) - (b.id || 0);
      });
  };

  // Helper: Lấy lô cận date nhất sắp xuất bán tiếp theo của sản phẩm (FEFO preview)
  const getNextBatchPreview = (productId) => {
    const validBatches = getValidFefoBatches(productId);
    return validBatches[0] || null;
  };

  // Helper: Mô phỏng phân bổ & bẻ lô FEFO trực tiếp trên Giỏ hàng (Đồng bộ 100% với FefoAllocationPolicy của Backend - Mục 8.2)
  const allocateFefoPreview = (productId, requestedQuantity, basePrice) => {
    const validBatches = getValidFefoBatches(productId);
    let remaining = Number(requestedQuantity) || 0;
    const allocations = [];
    const listPrice = Number(basePrice) || 0;

    for (const batch of validBatches) {
      if (remaining <= 0) break;
      const batchQty = Number(batch.currentQuantity !== undefined ? batch.currentQuantity : batch.quantity) || 0;
      if (batchQty <= 0) continue;

      const takeQty = Math.min(batchQty, remaining);
      const discountPct = Number(batch.discountPercent || 0);
      const unitPrice = discountPct > 0
        ? Math.round(listPrice * (1.0 - discountPct / 100.0))
        : listPrice;
      const lineTotal = Math.round(takeQty * unitPrice);

      allocations.push({
        batchId: batch.id,
        batchCode: batch.batchCode,
        expiryDate: batch.expiryDate ? String(batch.expiryDate).slice(0, 10) : '',
        daysLeft: batch.daysLeft,
        quantityAllocated: takeQty,
        discountPercent: discountPct,
        originalPrice: listPrice,
        unitPrice,
        lineTotal
      });

      remaining -= takeQty;
    }

    const totalAmount = allocations.reduce((sum, a) => sum + a.lineTotal, 0);
    const originalTotalAmount = (Number(requestedQuantity) || 0) * listPrice;

    return {
      allocations,
      totalAmount: allocations.length > 0 ? totalAmount : originalTotalAmount,
      originalTotalAmount,
      totalSaved: Math.max(0, originalTotalAmount - (allocations.length > 0 ? totalAmount : originalTotalAmount)),
      isSplitOrder: allocations.length > 1
    };
  };

  // Trạng thái mở cửa của cửa hàngMục 10
  const storeStatus = storeProfile?.status || 'OPEN';
  const isStoreOpen = storeStatus === 'OPEN';
  const getStoreStatusMeta = (st) => {
    switch (st) {
      case 'CLOSED':
        return { label: 'Đóng ca đêm (CLOSED)', desc: 'Cửa hàng đã kết thúc ca làm việc, tạm khóa quầy xuất bán POS.', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' };
      case 'INVENTORY':
        return { label: 'Tạm ngưng để kiểm kê (INVENTORY)', desc: 'Cửa hàng đang kiểm kê kho hàng định kỳ, tạm ngừng bán lẻ.', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' };
      case 'SUSPENDED':
        return { label: 'Tạm ngừng hoạt động (SUSPENDED)', desc: 'Cửa hàng đang tạm đình chỉ hoạt động kinh doanh.', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.3)' };
      default:
        return { label: 'Đang mở cửa (OPEN)', desc: 'Sẵn sàng phục vụ khách hàng.', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
    }
  };
  const storeStatusMeta = getStoreStatusMeta(storeStatus);

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = (product) => {
    setCheckoutError('');
    const availableStock = getAvailableStock(product.id);

    if (availableStock <= 0) {
      setCheckoutError(`Sản phẩm "${product.name}" hiện đã hết hàng khả dụng trong kho.`);
      return;
    }

    const existing = cart.find(item => item.productId === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (currentQtyInCart + 1 > availableStock) {
      setCheckoutError(`Tồn kho khả dụng của "${product.name}" chỉ còn ${availableStock} ${product.unit}.`);
      return;
    }

    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        sku: product.sku,
        category: product.category,
        quantity: 1
      }]);
    }
  };

  // Xử lý khi quét mã vạch Barcode/QR thành công qua Camera hoặc Đầu đọc
  const handleBarcodeScanSuccess = (scannedSku) => {
    if (!scannedSku) return;
    const cleanSku = String(scannedSku).trim().toUpperCase();
    const found = products.find(p =>
      (p.sku && p.sku.toUpperCase() === cleanSku) ||
      (p.barcode && String(p.barcode).trim().toUpperCase() === cleanSku) ||
      (p.id && String(p.id) === cleanSku)
    );

    if (found) {
      const isAct = found.isActive !== false && found.is_active !== false && found.isActive !== 0 && found.is_active !== 0;
      if (!isAct) {
        setCheckoutError(`[ERR_PRODUCT_INACTIVE] Sản phẩm "${found.name}" (${cleanSku}) hiện đang ngừng kinh doanh hoặc tạm khóa lưu hành!`);
        setShowBarcodeScanner(false);
        return;
      }
      addToCart(found);
      setBarcodeSuccessToast(`✓ Đã quét mã [${cleanSku}]: Thêm thành công "${found.name}" vào giỏ hàng`);
      setTimeout(() => setBarcodeSuccessToast(''), 4500);
      setShowBarcodeScanner(false);
    } else {
      setCheckoutError(`[ERR_PRODUCT_NOT_FOUND] Không tìm thấy sản phẩm có mã Barcode/SKU: "${scannedSku}" trong danh mục sản phẩm kho.`);
      setShowBarcodeScanner(false);
    }
  };

  // Cập nhật số lượng trong giỏ
  const updateQuantity = (productId, delta) => {
    setCheckoutError('');
    const availableStock = getAvailableStock(productId);

    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (delta > 0 && newQty > availableStock) {
          setCheckoutError(`Tồn kho của "${item.name}" chỉ còn ${availableStock} ${item.unit}.`);
          return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  // Xóa sản phẩm khỏi giỏ
  const removeFromCart = (productId) => {
    setCheckoutError('');
    setCart(cart.filter(item => item.productId !== productId));
  };

  // Xóa sạch toàn bộ giỏ
  const clearCart = () => {
    setCart([]);
    setCustomerPaid('');
    setCheckoutError('');
  };

  // Tính tổng tiền giỏ hàng chuẩn FEFO (Đã tính chiết khấu Quick Markdown trên từng lô được bẻ)
  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const alloc = allocateFefoPreview(item.productId, item.quantity, item.price);
      return sum + alloc.totalAmount;
    }, 0);
  };

  const calculateTotalSaved = () => {
    return cart.reduce((sum, item) => {
      const alloc = allocateFefoPreview(item.productId, item.quantity, item.price);
      return sum + alloc.totalSaved;
    }, 0);
  };

  const totalAmount = calculateTotal();
  const totalSavedAmount = calculateTotalSaved();
  const customerPaidNumber = Number(String(customerPaid).replace(/\D/g, '')) || 0;
  const changeDue = customerPaidNumber >= totalAmount ? customerPaidNumber - totalAmount : 0;
  const shortageAmount = customerPaidNumber > 0 && customerPaidNumber < totalAmount ? totalAmount - customerPaidNumber : 0;

  // Kiểm tra các mặt hàng bị lỗi tồn kho trong giỏ
  const cartIssues = cart.map(item => {
    const stock = getAvailableStock(item.productId);
    if (stock <= 0) {
      return { item, issue: 'ZERO_STOCK', message: `Hết hàng (Tồn: 0)` };
    }
    if (item.quantity > stock) {
      return { item, issue: 'OVER_STOCK', message: `Vượt tồn kho (Cần ${item.quantity}, còn ${stock})` };
    }
    return null;
  }).filter(Boolean);

  const hasStockError = cartIssues.length > 0;

  // Thực hiện giao dịch thanh toán POS và trừ kho FEFO
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutError('');

    if (hasStockError) {
      const issueDetails = cartIssues.map(ci => `"${ci.item.name}": ${ci.message}`).join(', ');
      setCheckoutError(`[ERR_INSUFFICIENT_STOCK] Không thể thanh toán: ${issueDetails}. Vui lòng điều chỉnh lại số lượng.`);
      return;
    }

    // Kiểm tra trạng thái hoạt động của cửa hàng duy nhất
    if (!isStoreOpen) {
      const errCode = storeStatus === 'INVENTORY' ? 'ERR_STORE_INVENTORY' : (storeStatus === 'SUSPENDED' ? 'ERR_STORE_SUSPENDED' : 'ERR_STORE_CLOSED');
      setCheckoutError(`[${errCode}] Cửa hàng đang ở trạng thái "${storeStatusMeta.label}". Quầy POS khóa chức năng xuất bán theo quy định vận hành. Vui lòng mở lại cửa hàng trong menu trạng thái trên thanh điều hướng Header.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onProcessSale(cart, {
        condition: weather?.condition || 'NORMAL',
        isHoliday: weather?.isHoliday || false,
        temp: weather?.temp || 30
      });

      if (result && result.success) {
        const finalTotal = result.totalAmount !== undefined ? result.totalAmount : totalAmount;
        const paidAmt = customerPaidNumber > 0 ? customerPaidNumber : finalTotal;
        const finalChange = customerPaidNumber >= finalTotal ? customerPaidNumber - finalTotal : 0;

        // Lưu biên lai và mở modal phiếu in nhiệt
        setLastReceipt({
          ...result,
          orderCode: result.transactionCode || result.orderCode,
          items: [...cart],
          totalAmount: finalTotal,
          customerPaid: paidAmt,
          changeDue: finalChange,
          cashierName: currentUser?.fullName || 'Nhân viên Thu ngân LHU',
          storeName: storeProfile?.storeName || 'Cửa hàng Bán lẻ Tiện lợi LHU Mart',
          weather: weather?.condition || 'NORMAL',
          isHoliday: weather?.isHoliday || false,
          temp: weather?.temp || 30,
          checkoutTime: new Date().toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        });
        setShowReceiptModal(true);
        setShowPaymentModal(false);
        setCart([]);
        setCustomerPaid('');
        setCheckoutError('');
        loadPosSalesHistory();
      } else {
        const codePrefix = result?.code ? `[${result.code}] ` : '';
        setCheckoutError(`${codePrefix}${result?.message || 'Có lỗi xảy ra trong quá trình xuất kho FEFO.'}`);
      }
    } catch (err) {
      const codePrefix = err.code ? `[${err.code}] ` : '';
      setCheckoutError(`${codePrefix}${err.message || 'Lỗi kết nối máy chủ thanh toán.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lắng nghe kích thước màn hình phục vụ Responsive Tablet / Touchscreen
  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 3. Hệ thống Phím Tắt Quầy Thu Ngân POS Siêu Tốc
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F1: Bật / Tắt Bảng Hướng dẫn Phím tắt POS
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcutHelp(prev => !prev);
        return;
      }

      // F2: Đưa con trỏ ngay vào ô Tìm kiếm sản phẩm / Quét Barcode
      if (e.key === 'F2') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
        return;
      }

      // F3: Mở menu chọn Ngữ cảnh Thời tiết & Ngày lễ (AI Context Input - Mục 8.5)
      if (e.key === 'F3') {
        e.preventDefault();
        setShowWeatherMenu(prev => !prev);
        return;
      }

      // F4: Mở Cửa Sổ Bật Ra Thanh Toán & focus ô Tiền Khách
      if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0 && !hasStockError && isStoreOpen) {
          setShowPaymentModal(true);
        }
        return;
      }

      // F7: Mở Modal Lịch sử Hóa đơn ca trực & Nhật ký bẻ lô FEFO
      if (e.key === 'F7') {
        e.preventDefault();
        setShowHistoryModal(prev => !prev);
        return;
      }

      // F8: Tự động điền Đủ tiền mặt theo Tổng tiền FEFO
      if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          setCustomerPaid(totalAmount);
        }
        return;
      }

      // F9 hoặc Ctrl+Enter: Bật Cửa Sổ Thanh Toán FEFO (hoặc Xác nhận nếu đã mở)
      if (e.key === 'F9' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        if (cart.length > 0 && !hasStockError && isStoreOpen) {
          if (!showPaymentModal) {
            setShowPaymentModal(true);
          } else if (!isSubmitting) {
            handleCheckout();
          }
        }
        return;
      }

      // ESC: Đóng các cửa sổ Modal đang mở hoặc Xóa giỏ hàng
      if (e.key === 'Escape') {
        if (showPaymentModal) {
          setShowPaymentModal(false);
          return;
        }
        if (showShortcutHelp) {
          setShowShortcutHelp(false);
          return;
        }
        if (showReceiptModal) {
          setShowReceiptModal(false);
          return;
        }
        if (showHistoryModal) {
          setShowHistoryModal(false);
          return;
        }
        if (showBarcodeScanner) {
          setShowBarcodeScanner(false);
          return;
        }
        if (searchQuery) {
          setSearchQuery('');
          return;
        }
        if (cart.length > 0) {
          clearCart();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    cart,
    totalAmount,
    hasStockError,
    isSubmitting,
    isStoreOpen,
    showShortcutHelp,
    showReceiptModal,
    showHistoryModal,
    showBarcodeScanner,
    searchQuery
  ]);

  // Lọc sản phẩm theo tìm kiếm, tab ngành hàng và trạng thái kinh doanh
  const filteredProducts = products.filter(p => {
    const isAct = p.isActive !== false && p.is_active !== false && p.isActive !== 0 && p.is_active !== 0;
    if (!isAct) return false;

    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    if (!searchQuery.trim()) return matchesCat;

    const normSearch = stripVietnamese(searchQuery);
    const normName = stripVietnamese(p.name);
    const normSku = (p.sku || '').toLowerCase();
    const tokens = normSearch.split(/\s+/).filter(Boolean);

    const matchesSearch = tokens.every(tok => normName.includes(tok) || normSku.includes(tok));
    return matchesCat && matchesSearch;
  });

  const kbdBadgeStyle = {
    fontFamily: 'monospace',
    fontWeight: 700,
    fontSize: '0.68rem',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'var(--bg-subtle)',
    color: 'var(--primary)',
    border: '1px solid var(--border-color)',
    boxShadow: '0 1px 1px rgba(0,0,0,0.06)'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      height: 'calc(100vh - 105px)',
      overflow: 'hidden',
      position: 'relative'
    }}>

      {/* KHU VỰC CHỌN SẢN PHẨM & TABS NGÀNH HÀNG (100% FULL-WIDTH) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', overflow: 'hidden', flex: 1 }}>

        {/* Thanh tiêu đề & Tác vụ điều phối nhanh (Đã tinh giản rác chữ) */}
        <div style={{
          padding: '10px 16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          flexShrink: 0
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
              <ShoppingCart size={19} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  Quầy Thu Ngân POS
                </h2>
                <span style={{ fontSize: '0.675rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', background: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid var(--primary-border)' }}>
                  FEFO Tự Động
                </span>
              </div>
            </div>
          </div>

          {/* Cụm phím tắt & hóa đơn */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Nút Xem Hướng Dẫn Phím Tắt [F1] */}
            <button
              type="button"
              onClick={() => setShowShortcutHelp(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 9px',
                borderRadius: '7px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Xem danh mục phím tắt quầy thu ngân (F1)"
            >
              <Keyboard size={13} color="var(--primary)" />
              <span>Phím tắt [F1]</span>
            </button>

            {/* Nút Lịch sử Hóa đơn POS trong ca trực */}
            <button
              type="button"
              onClick={() => {
                loadPosSalesHistory();
                setShowHistoryModal(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'var(--primary-bg)',
                padding: '5px 10px',
                borderRadius: '7px',
                border: '1px solid var(--primary-border)',
                fontSize: '0.735rem',
                fontWeight: 700,
                color: 'var(--primary)',
                cursor: 'pointer'
              }}
              title="Xem lịch sử hóa đơn bán lẻ POS trong ca trực"
            >
              <History size={13} />
              <span>Lịch sử HĐ ({todaySalesSummary.todayTransactionsCount || 0})</span>
            </button>

            {/* Nút Bật Cửa Sổ Hóa Đơn Giỏ Hàng & Thanh Toán (Modal) */}
            <button
              type="button"
              onClick={() => {
                setCheckoutError('');
                setShowPaymentModal(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: cart.length > 0 ? 'var(--primary)' : 'var(--bg-subtle)',
                color: cart.length > 0 ? '#ffffff' : 'var(--text-main)',
                border: cart.length > 0 ? 'none' : '1px solid var(--border-color)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.785rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: cart.length > 0 ? '0 2px 8px rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title="Mở Cửa Sổ Hóa Đơn Giỏ Hàng & Thanh Toán (F9)"
            >
              <ShoppingCart size={15} />
              <span>Giỏ hàng ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
              {totalAmount > 0 && <span style={{ opacity: 0.9 }}>• {totalAmount.toLocaleString('vi-VN')} đ</span>}
            </button>
          </div>
        </div>

        {/* Banner Cảnh báo Trạng thái Cửa hàng */}
        {!isStoreOpen && (
          <div style={{
            background: storeStatusMeta.bg,
            border: `1px solid ${storeStatusMeta.border}`,
            color: storeStatusMeta.color,
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.815rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            animation: 'fadeIn 0.2s ease',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} />
              <div>
                <strong>LƯU Ý: {storeStatusMeta.label.toUpperCase()}</strong>
                <div style={{ fontSize: '0.735rem', opacity: 0.9, marginTop: '2px' }}>
                  {storeStatusMeta.desc} Chức năng xuất bán POS bị khóa cứng.
                </div>
              </div>
            </div>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: storeStatusMeta.color,
              color: '#ffffff'
            }}>
              ĐANG KHÓA
            </span>
          </div>
        )}

        {/* Banner thông báo quét mã vạch thành công */}
        {barcodeSuccessToast && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10b981',
            color: '#059669',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.785rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease'
          }}>
            <Sparkles size={16} />
            <span>{barcodeSuccessToast}</span>
          </div>
        )}

        {/* Thanh Tìm kiếm & Nút Quét Barcode Camera */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>

          {/* Ô Tìm kiếm nhanh + Nút Quét Camera Barcode */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
              <input
                ref={searchInputRef}
                type="text"
                style={{
                  width: '100%',
                  padding: '9px 36px 9px 34px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.825rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="[F2] Gõ tên sản phẩm, thương hiệu hoặc mã SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Nút mở Camera Quét Mã Vạch */}
            <button
              type="button"
              onClick={() => setShowBarcodeScanner(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #06b6d4',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                color: '#0891b2',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: '0 1px 2px rgba(6, 182, 212, 0.1)'
              }}
              title="Mở Camera quét mã vạch Barcode (EAN-13, QR Code) trên bao bì sản phẩm"
            >
              <Camera size={16} />
              <span>Quét Barcode</span>
            </button>
          </div>

          {/* Thanh Tabs cuộn ngang Danh mục FMCG kèm 2 nút điều hướng Trái / Phải */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            position: 'relative'
          }}>
            {/* Nút Cuộn Trái */}
            <button
              onClick={() => handleScrollTabs('left')}
              title="Cuộn sang trái"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                minWidth: '28px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-border)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Dải Tabs cuộn ngang (Đã ẩn hoàn toàn thanh cuộn thô bên dưới) */}
            <div
              ref={tabsContainerRef}
              onWheel={handleWheelTabs}
              className="hide-scrollbar"
              style={{
                flex: 1,
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '2px',
                scrollBehavior: 'smooth',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {categories.map(cat => {
                const isSelected = selectedCategory === cat;
                const count = cat === 'ALL'
                  ? products.length
                  : products.filter(p => p.category === cat).length;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 13px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--primary-border)' : 'var(--border-subtle)',
                      background: isSelected ? 'var(--primary-bg)' : 'var(--bg-surface)',
                      color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '0.785rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                  >
                    <span>{cat === 'ALL' ? 'Tất cả ngành hàng' : cat}</span>
                    <span style={{
                      fontSize: '0.675rem',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: isSelected ? 'var(--primary)' : 'var(--bg-subtle)',
                      color: isSelected ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: 600
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Nút Cuộn Phải */}
            <button
              onClick={() => handleScrollTabs('right')}
              title="Cuộn sang phải"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                minWidth: '28px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-border)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

        </div>

        {/* Lưới Thẻ Sản Phẩm (Product Card Grid) */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '4px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
          gap: '10px',
          alignContent: 'start'
        }}>
          {filteredProducts.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              padding: '40px 20px',
              textAlign: 'center',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              color: 'var(--text-muted)'
            }}>
              <PackageX size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                Không tìm thấy sản phẩm phù hợp
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                Vui lòng thử tìm kiếm với từ khóa khác hoặc chuyển danh mục.
              </div>
            </div>
          ) : (
            filteredProducts.map(prod => {
              const availableStock = getAvailableStock(prod.id);
              const isOutOfStock = availableStock <= 0;
              const isLowStock = !isOutOfStock && availableStock <= (prod.reorderPoint || 10);
              const inCartItem = cart.find(i => i.productId === prod.id);
              const nextBatch = getNextBatchPreview(prod.id);

              return (
                <div
                  key={prod.id}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'var(--bg-surface)',
                    border: '1px solid',
                    borderColor: inCartItem
                      ? 'var(--primary-border)'
                      : (isOutOfStock ? 'var(--border-subtle)' : 'var(--border-subtle)'),
                    boxShadow: inCartItem ? '0 0 0 1px var(--primary)' : 'var(--shadow-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                    opacity: isOutOfStock ? 0.65 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Thông tin đầu thẻ */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      {/* HSD FEFO pill gọn gàng */}
                      {nextBatch && !isOutOfStock ? (
                        <span style={{
                          fontSize: '0.675rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: nextBatch.daysLeft <= 3 ? 'var(--danger-red-bg)' : (nextBatch.daysLeft <= 7 ? 'var(--warning-yellow-bg)' : 'var(--bg-subtle)'),
                          color: nextBatch.daysLeft <= 3 ? 'var(--danger-red)' : (nextBatch.daysLeft <= 7 ? 'var(--warning-yellow)' : 'var(--text-secondary)'),
                          border: `1px solid ${nextBatch.daysLeft <= 3 ? 'var(--danger-red-border)' : (nextBatch.daysLeft <= 7 ? 'var(--warning-yellow-border)' : 'var(--border-subtle)')}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Clock size={10} />
                          <span>HSD: {String(nextBatch.expiryDate || '').slice(5, 10)} ({nextBatch.daysLeft}d)</span>
                          {Number(nextBatch.discountPercent || 0) > 0 && (
                            <strong style={{ color: '#d97706', marginLeft: '2px' }}>-{nextBatch.discountPercent}%</strong>
                          )}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.675rem', color: 'var(--text-dim)' }}>Hết date</span>
                      )}

                      {/* Tồn kho siêu gọn */}
                      <span style={{
                        fontSize: '0.675rem',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        background: isOutOfStock ? 'var(--danger-red-bg)' : 'var(--bg-subtle)',
                        color: isOutOfStock ? 'var(--danger-red)' : 'var(--text-muted)'
                      }}>
                        {isOutOfStock ? 'Hết hàng' : `Kho: ${availableStock}`}
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      margin: '4px 0 2px',
                      lineHeight: '1.35',
                      color: 'var(--text-main)',
                      minHeight: '2.4em',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {prod.name}
                    </h3>

                    
                  </div>

                  {/* Giá tiền & Nút Thêm */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {(nextBatch && Number(nextBatch.discountPercent || 0) > 0
                            ? Math.round(prod.price * (1 - Number(nextBatch.discountPercent) / 100))
                            : prod.price
                          ).toLocaleString('vi-VN')} <span style={{ fontSize: '0.725rem', fontWeight: 500 }}>đ</span>
                        </div>
                        {nextBatch && Number(nextBatch.discountPercent || 0) > 0 && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            {prod.price.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        /{prod.unit}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(prod)}
                      disabled={isOutOfStock}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: isOutOfStock
                          ? 'var(--bg-subtle)'
                          : (inCartItem ? 'var(--primary-hover)' : 'var(--primary)'),
                        color: isOutOfStock ? 'var(--text-muted)' : '#ffffff',
                        fontSize: '0.785rem',
                        fontWeight: 600,
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {isOutOfStock ? (
                        <>
                          <PackageX size={14} /> Tạm hết hàng
                        </>
                      ) : inCartItem ? (
                        <>
                          <Check size={14} /> Đã chọn {inCartItem.quantity}
                        </>
                      ) : (
                        <>
                          <Plus size={14} /> Thêm vào đơn
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Floating Bottom Bar: Mở Cửa Sổ Hóa Đơn Giỏ Hàng & Thanh Toán */}
      {cart.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setCheckoutError('');
            setShowPaymentModal(true);
          }}
          style={{
            position: 'fixed',
            right: '28px',
            bottom: '24px',
            zIndex: 90,
            padding: '10px 22px',
            borderRadius: '999px',
            background: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.875rem',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
          title="Mở Cửa Sổ Hóa Đơn Giỏ Hàng & Thanh Toán (F9)"
        >
          <ShoppingCart size={18} />
          <span>Hóa đơn Giỏ hàng ({cart.reduce((s, i) => s + i.quantity, 0)} món • {totalAmount.toLocaleString('vi-VN')} đ)</span>
          <CreditCard size={17} style={{ marginLeft: '4px' }} />
          <span>Thanh Toán (F9)</span>
        </button>
      )}

      {/* CỬA SỔ BẬT RA: MODAL HÓA ĐƠN GIỎ HÀNG & THANH TOÁN (Xuất kho FEFO) */}
      <PosPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cart={cart}
        totalAmount={totalAmount}
        totalSavedAmount={totalSavedAmount}
        customerPaid={customerPaid}
        setCustomerPaid={setCustomerPaid}
        onConfirmCheckout={handleCheckout}
        isSubmitting={isSubmitting}
        checkoutError={checkoutError}
        storeProfile={storeProfile}
        currentUser={currentUser}
        allocateFefoPreview={allocateFefoPreview}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        clearCart={clearCart}
        getAvailableStock={getAvailableStock}
      />

      {/* MODAL PHIẾU HÓA ĐƠN IN NHIỆT SIÊU THỊ CHUẨN (THERMAL RECEIPT MODAL) */}
      {showReceiptModal && lastReceipt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--modal-backdrop)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '440px',
            width: '100%',
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-elevated)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #cbd5e1',
            fontFamily: "'Courier New', Courier, monospace"
          }}>

            {/* Thanh tiêu đề thao tác modal */}
            <div style={{
              background: '#f8fafc',
              padding: '10px 16px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: "'Be Vietnam Pro', sans-serif"
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 700, fontSize: '0.85rem' }}>
                <CheckCircle size={16} />
                <span>Thanh Toán Thành Công</span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Thân Hóa Đơn In Nhiệt Mô Phỏng */}
            <div id="pos-printable-receipt" style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '0.825rem',
              lineHeight: 1.4
            }}>
              {/* Header Cửa hàng (Động hóa từ StoreProfile - Mục 5) */}
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #94a3b8', paddingBottom: '12px' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {storeProfile?.storeName || 'CỬA HÀNG BÁN LẺ LHU MART'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700 }}>
                  MÃ ĐƠN VỊ: {storeProfile?.storeCode || 'RETAIL-STORE-01'} • CHỐNG LÃNG PHÍ
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                  ĐC: {storeProfile?.address || 'Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  ĐT: {storeProfile?.phone || '0251.3952.778'} • Kho: {storeProfile?.defaultDcSupplierName || 'DC Biên Hòa'}
                </div>
              </div>

              {/* Thông tin ca trực & Mã đơn */}
              <div style={{ fontSize: '0.75rem', borderBottom: '1px dashed #94a3b8', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Số HĐ:</span>
                  <strong>{lastReceipt.transactionCode || lastReceipt.orderCode}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span>Thu ngân:</span>
                  <span>{lastReceipt.cashierName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span>Thời gian:</span>
                  <span>{lastReceipt.checkoutTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', color: '#475569' }}>
                  <span>Ngữ cảnh AI:</span>
                  <span>
                    {lastReceipt.weather === 'RAINY' ? 'Mưa gió (K=0.8)' : lastReceipt.weather === 'SUNNY' ? 'Nắng nóng (K=1.4)' : 'Bình thường (K=1.0)'}
                    {lastReceipt.isHoliday ? ' • Ngày Lễ' : ' • Ngày Thường'}
                  </span>
                </div>
              </div>

              {/* Chi tiết từng mặt hàng */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderBottom: '1px solid #0f172a', paddingBottom: '4px', marginBottom: '6px' }}>
                  <span style={{ flex: 1 }}>TÊN HÀNG</span>
                  <span style={{ width: '45px', textAlign: 'center' }}>SL</span>
                  <span style={{ width: '70px', textAlign: 'right' }}>ĐƠN GIÁ</span>
                  <span style={{ width: '80px', textAlign: 'right' }}>T.TIỀN</span>
                </div>

                {lastReceipt.fefoDetails && lastReceipt.fefoDetails.length > 0 ? (
                  lastReceipt.fefoDetails.map((det, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.775rem' }}>
                      <span style={{ flex: 1, paddingRight: '4px' }}>
                        {det.productName} <span style={{ fontSize: '0.675rem', color: '#475569' }}>[{det.batchCode}{det.discountPercent > 0 ? ` -${det.discountPercent}%` : ''}]</span>
                      </span>
                      <span style={{ width: '45px', textAlign: 'center' }}>{det.deductedQty}</span>
                      <span style={{ width: '70px', textAlign: 'right' }}>{Number(det.unitPrice || 0).toLocaleString('vi-VN')}</span>
                      <span style={{ width: '80px', textAlign: 'right', fontWeight: 700 }}>
                        {Number(det.lineTotal || (det.unitPrice * det.deductedQty) || 0).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  ))
                ) : (
                  lastReceipt.items && lastReceipt.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.785rem' }}>
                      <span style={{ flex: 1, paddingRight: '4px' }}>{it.name}</span>
                      <span style={{ width: '45px', textAlign: 'center' }}>{it.quantity}</span>
                      <span style={{ width: '70px', textAlign: 'right' }}>{it.price.toLocaleString('vi-VN')}</span>
                      <span style={{ width: '80px', textAlign: 'right', fontWeight: 700 }}>
                        {(it.price * it.quantity).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* BẰNG CHỨNG XUẤT KHO FEFO CHUẨN ĐANG KHÓA */}
              <div style={{
                background: '#f1f5f9',
                borderRadius: '6px',
                padding: '8px 10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.725rem'
              }}>
                <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={12} color="#4f46e5" />
                  <span>XÁC THỰC BẺ LÔ THEO FEFO (LÔ CẬN DATE):</span>
                </div>
                {lastReceipt.fefoDetails && lastReceipt.fefoDetails.length > 0 ? (
                  lastReceipt.fefoDetails.map((det, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', marginTop: '2px' }}>
                      <span>• Lô <strong>{det.batchCode}</strong> (HSD: {String(det.expiryDate || '').slice(0, 10)}{det.discountPercent > 0 ? `, -${det.discountPercent}%` : ''}):</span>
                      <strong>-{det.deductedQty} {det.unit}</strong>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#64748b' }}>Đã xuất trừ kho tự động theo thứ tự hạn dùng gần nhất.</div>
                )}
              </div>

              {/* Tổng kết thanh toán */}
              <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem' }}>
                  <span>TỔNG THANH TOÁN:</span>
                  <span>{lastReceipt.totalAmount?.toLocaleString('vi-VN')} đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: '#475569' }}>
                  <span>Tiền khách đưa:</span>
                  <span>{lastReceipt.customerPaid?.toLocaleString('vi-VN')} đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', color: '#16a34a', fontWeight: 700 }}>
                  <span>Tiền thừa thối lại:</span>
                  <span>{lastReceipt.changeDue?.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              {/* Mã vạch Barcode mô phỏng */}
              <div style={{ textAlign: 'center', marginTop: '6px' }}>
                <svg width="220" height="40" viewBox="0 0 220 40" style={{ margin: '0 auto' }}>
                  <rect x="10" y="5" width="2" height="30" fill="#0f172a" />
                  <rect x="15" y="5" width="4" height="30" fill="#0f172a" />
                  <rect x="22" y="5" width="1" height="30" fill="#0f172a" />
                  <rect x="26" y="5" width="3" height="30" fill="#0f172a" />
                  <rect x="33" y="5" width="2" height="30" fill="#0f172a" />
                  <rect x="39" y="5" width="5" height="30" fill="#0f172a" />
                  <rect x="48" y="5" width="2" height="30" fill="#0f172a" />
                  <rect x="54" y="5" width="3" height="30" fill="#0f172a" />
                  <rect x="61" y="5" width="1" height="30" fill="#0f172a" />
                  <rect x="66" y="5" width="4" height="30" fill="#0f172a" />
                  <rect x="74" y="5" width="2" height="30" fill="#0f172a" />
                  <rect x="80" y="5" width="5" height="30" fill="#0f172a" />
                  <rect x="89" y="5" width="3" height="30" fill="#0f172a" />
                  <rect x="96" y="5" width="1" height="30" fill="#0f172a" />
                  <rect x="101" y="5" width="4" height="30" fill="#0f172a" />
                  <rect x="109" y="5" width="2" height="30" fill="#0f172a" />
                  <rect x="115" y="5" width="3" height="30" fill="#0f172a" />
                  <rect x="122" y="5" width="2" height="30" fill="#0f172a" />
                  <rect x="128" y="5" width="5" height="30" fill="#0f172a" />
                  <rect x="137" y="5" width="1" height="30" fill="#0f172a" />
                  <rect x="142" y="5" width="3" height="30" fill="#0f172a" />
                  <rect x="149" y="5" width="4" height="30" fill="#0f172a" />
                  <rect x="157" y="5" width="2" height="30" fill="#0f172a" />
                  <rect x="163" y="5" width="3" height="30" fill="#0f172a" />
                  <rect x="170" y="5" width="1" height="30" fill="#0f172a" />
                  <rect x="175" y="5" width="5" height="30" fill="#0f172a" />
                  <rect x="184" y="5" width="2" height="30" fill="#0f172a" />
                  <rect x="190" y="5" width="4" height="30" fill="#0f172a" />
                  <rect x="198" y="5" width="2" height="30" fill="#0f172a" />
                  <rect x="204" y="5" width="3" height="30" fill="#0f172a" />
                </svg>
                <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: '2px' }}>
                  *{lastReceipt.orderCode}*
                </div>
              </div>

              {/* Lời cảm ơn */}
              <div style={{ textAlign: 'center', fontSize: '0.725rem', color: '#475569', marginTop: '4px' }}>
                LHU MART CHÂN THÀNH CẢM ƠN QUÝ KHÁCH!<br />
                Chung tay chống lãng phí thực phẩm & bảo vệ môi trường.<br />
                <span style={{ fontSize: '0.675rem', color: '#64748b' }}>(Sản phẩm cận date vui lòng dùng theo khuyến nghị)</span>
              </div>
            </div>

            {/* Các nút hành động cuối modal */}
            <div style={{
              background: '#f8fafc',
              padding: '12px 16px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '10px',
              fontFamily: "'Be Vietnam Pro', sans-serif"
            }}>
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                title="In hóa đơn khổ nhiệt K80 chuẩn siêu thị"
              >
                <Printer size={15} />
                <span>In Hóa Đơn</span>
              </button>

              <button
                onClick={() => exportReceiptToExcel(lastReceipt)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #10b981',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                title="Xuất chi tiết hóa đơn ra file Excel CSV"
              >
                <Download size={15} />
                <span>Xuất Excel</span>
              </button>

              <button
                onClick={() => setShowReceiptModal(false)}
                style={{
                  flex: 1.2,
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={15} />
                <span>Đơn Hàng Mới</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL LỊCH SỬ HÓA ĐƠN CA TRỰC & TRA CỨU BẺ LÔ FEFO (MỤC 8.1 & 8.2) */}
      {showHistoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--modal-backdrop)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '780px',
            width: '100%',
            background: 'var(--bg-surface)',
            color: 'var(--text-main)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-elevated)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="var(--primary)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                    Lịch Sử Hóa Đơn POS Ca Trực & Nhật Ký Bẻ Lô FEFO
                  </h3>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    Truy vết hóa đơn xuất kho tự động theo thứ tự hạn dùng gần nhất
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => exportSalesHistoryToExcel(salesHistoryList)}
                  title="Xuất toàn bộ lịch sử bán hàng và bẻ lô FEFO ra file Excel CSV (UTF-8 with BOM)"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '7px',
                    background: 'var(--primary-bg)',
                    border: '1px solid var(--primary-border)',
                    color: 'var(--primary)',
                    fontSize: '0.785rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Download size={14} />
                  <span>Xuất Excel ({salesHistoryList.length})</span>
                </button>

                <button
                  onClick={() => setShowHistoryModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Thanh KPI Ca trực hôm nay */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              padding: '12px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)'
            }}>
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Số hóa đơn hôm nay</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                  {todaySalesSummary.todayTransactionsCount || 0} đơn
                </div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sản lượng xuất FEFO hôm nay</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {todaySalesSummary.todayTotalQuantity || 0} đơn vị
                </div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Doanh thu POS hôm nay</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                  {Number(todaySalesSummary.todayTotalRevenue || 0).toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>

            {/* Danh sách giao dịch gom theo mã hóa đơn */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(() => {
                const groupedMap = new Map();
                for (const row of salesHistoryList) {
                  const code = row.transactionCode || `TX-${row.id}`;
                  if (!groupedMap.has(code)) {
                    groupedMap.set(code, {
                      transactionCode: code,
                      saleDate: row.saleDate,
                      cashierName: row.cashierName || 'Thu ngân ca trực',
                      totalRevenue: 0,
                      totalQty: 0,
                      lines: []
                    });
                  }
                  const grp = groupedMap.get(code);
                  grp.totalRevenue += Number(row.totalRevenue || 0);
                  grp.totalQty += Number(row.quantitySold || 0);
                  grp.lines.push(row);
                }
                const groupedOrders = Array.from(groupedMap.values());

                if (groupedOrders.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Chưa có hóa đơn POS nào được ghi nhận.
                    </div>
                  );
                }

                return groupedOrders.map(order => {
                  const isSplit = order.lines.length > 1 && new Set(order.lines.map(l => l.batchCode)).size > 1;
                  return (
                    <div
                      key={order.transactionCode}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)' }}>
                            {order.transactionCode}
                          </span>
                          {isSplit && (
                            <span style={{
                              fontSize: '0.675rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--primary-bg)',
                              color: 'var(--primary)',
                              border: '1px solid var(--primary-border)',
                              fontWeight: 700
                            }}>
                              ⚡ Bẻ lô tự động FEFO ({order.lines.length} dòng)
                            </span>
                          )}
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            • {order.cashierName} • {order.saleDate ? new Date(order.saleDate).toLocaleString('vi-VN') : ''}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            {order.totalRevenue.toLocaleString('vi-VN')} đ
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenReprintReceipt(order)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--primary-border)',
                              background: 'var(--bg-surface)',
                              color: 'var(--primary)',
                              fontSize: '0.725rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Printer size={12} />
                            <span>Xem / In lại HĐ</span>
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {order.lines.map((line, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                            <span>
                              <strong>{line.productName}</strong> — Lô <strong>{line.batchCode}</strong>
                              {line.expiryDate ? ` (HSD: ${String(line.expiryDate).slice(0, 10)})` : ''}
                              {Number(line.discountPercent || 0) > 0 ? ` [-${line.discountPercent}%]` : ''}
                            </span>
                            <span className="num-tabular" style={{ fontWeight: 700 }}>
                              {line.quantitySold} {line.unit || 'sp'} × {Number(line.unitPrice || 0).toLocaleString('vi-VN')}đ = {Number(line.totalRevenue || 0).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal Quét Mã Vạch Barcode / QR Code bằng Camera */}
      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScanSuccess={handleBarcodeScanSuccess}
        products={products}
        title="QUÉT MÃ VẠCH TÍNH TIỀN POS"
        subtitle="Hướng Camera vào mã vạch trên sản phẩm hoặc chọn mã mô phỏng để thêm vào giỏ hàng"
      />

      {/* Modal Hướng Dẫn Phím Tắt Quầy Thu Ngân POS */}
      {showShortcutHelp && (
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
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: 'var(--shadow-elevated)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--primary-bg)',
                  border: '1px solid var(--primary-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <Keyboard size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Bảng Phím Tắt Thu Ngân POS Siêu Tốc
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Chuẩn thao tác quầy bán lẻ FMCG - Tối ưu 100% bằng bàn phím
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutHelp(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', width: '130px' }}>Phím Bấm</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', width: '150px' }}>Tác Vụ</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Mô Tả Nghiệp Vụ</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'F1', action: 'Trợ giúp phím tắt', desc: 'Bật / Tắt bảng hướng dẫn phím tắt quầy POS này' },
                    { key: 'F2', action: 'Tìm kiếm / Barcode', desc: 'Đưa con trỏ ngay vào ô nhập SKU hoặc sẵn sàng quét Barcode' },
                    { key: 'F3', action: 'Ngữ cảnh Thời tiết AI', desc: 'Mở menu lựa chọn điều kiện thời tiết và cờ ngày lễ' },
                    { key: 'F4', action: 'Tiền khách đưa', desc: 'Đưa con trỏ vào ô nhập tiền mặt khách hàng đưa' },
                    { key: 'F7', action: 'Lịch sử bẻ lô FEFO', desc: 'Mở bảng tra cứu lịch sử hóa đơn trong ca trực và chi tiết bẻ lô FEFO' },
                    { key: 'F8', action: 'Khách đưa đủ tiền', desc: 'Tự động gán tiền khách đưa = 100% Tổng tiền giỏ hàng FEFO' },
                    { key: 'F9 / Ctrl+Enter', action: 'Thanh toán & Xuất kho', desc: 'Kích hoạt trừ kho FEFO, bẻ lô tự động và sinh hóa đơn bán lẻ' },
                    { key: 'ESC', action: 'Xóa giỏ / Đóng Modal', desc: 'Đóng hộp thoại đang mở hoặc xóa sạch toàn bộ giỏ hàng' }
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <kbd style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          padding: '3px 7px',
                          borderRadius: '5px',
                          background: row.key.includes('F9') ? 'var(--primary)' : 'var(--bg-subtle)',
                          color: row.key.includes('F9') ? '#ffffff' : 'var(--primary)',
                          border: `1px solid ${row.key.includes('F9') ? 'var(--primary)' : 'var(--border-color)'}`,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                        }}>
                          {row.key}
                        </kbd>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {row.action}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '0.785rem' }}>
                        {row.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{
                marginTop: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4
              }}>
                💡 <strong>Mẹo thu ngân:</strong> Khi kết hợp máy quét mã vạch cầm tay, bạn chỉ cần hướng đầu quét vào bao bì sản phẩm (hệ thống tự động kích hoạt phím <code>F2</code>), nhấn <code>F8</code> để lấy đủ tiền và nhấn <code>F9</code> để chốt hóa đơn trong vòng chưa đầy 3 giây.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowShortcutHelp(false)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Đã hiểu [ESC]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
