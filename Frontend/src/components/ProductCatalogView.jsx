import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  TrendingUp, 
  Layers, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  Save, 
  RefreshCw, 
  Copy, 
  Tag, 
  Barcode, 
  Info, 
  Calendar,
  Boxes,
  Check,
  ChevronRight,
  Thermometer,
  Eye,
  FolderPlus,
  Settings,
  Folder,
  Truck,
  Phone,
  Mail,
  MapPin,
  Clock
} from 'lucide-react';
import { 
  apiGetCategories, 
  apiCreateCategory, 
  apiUpdateCategory, 
  apiDeleteCategory,
  apiGetSuppliers,
  apiCreateSupplier,
  apiUpdateSupplier,
  apiDeleteSupplier
} from '../api';

// Danh sách Đơn vị tính chuẩn hóa cho ngành bán lẻ FMCG
const STANDARD_UNITS = [
  'Hộp', 'Chai', 'Gói', 'Hũ', 'Khay', 'Lon', 'Túi', 'Bịch', 'Kg', 'Lốc', 'Thùng', 'Vỉ'
];

// Helper: Chuẩn hóa chuỗi tiếng Việt không dấu
function normalizeText(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

// Helper: Tính Levenshtein Distance & Tỷ lệ Tương đồng
function calculateSimilarity(str1, str2) {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return (maxLen - distance) / maxLen;
}

// Danh mục ngành hàng FMCG chuẩn khớp CSDL SQL Server
const DEFAULT_FMCG_CATEGORIES = [
  { id: 1, code: 'DAIRY', name: 'Sữa & Chế phẩm từ sữa', storageTemperature: 'Mát (2 - 4°C)', defaultWarningDays: 7 },
  { id: 2, code: 'BAKERY', name: 'Bánh mì & Đồ ăn nhanh', storageTemperature: 'Nhiệt độ phòng (25°C)', defaultWarningDays: 2 },
  { id: 3, code: 'BEVERAGE', name: 'Nước giải khát', storageTemperature: 'Nhiệt độ phòng (25°C)', defaultWarningDays: 15 },
  { id: 4, code: 'DRY_FOOD', name: 'Thực phẩm khô đóng gói', storageTemperature: 'Khô ráo thoáng mát', defaultWarningDays: 30 },
  { id: 5, code: 'PROCESSED_MEAT', name: 'Thực phẩm chế biến sẵn', storageTemperature: 'Đông lạnh (-18°C)', defaultWarningDays: 5 },
  { id: 6, code: 'MEAT_POULTRY', name: 'Thịt tươi & Thủy hải sản mát', storageTemperature: 'Đông lạnh (-18°C)', defaultWarningDays: 5 },
  { id: 7, code: 'FRESH_PRODUCE', name: 'Rau củ & Trái cây sạch', storageTemperature: 'Mát (8 - 12°C)', defaultWarningDays: 3 }
];

export default function ProductCatalogView({
  products = [],
  onAddNewProduct,
  onUpdateProduct,
  onDeleteProduct,
  isAdmin = false,
  currentRole = 'ADMIN'
}) {
  const canManageCatalog = isAdmin || currentRole === 'ADMIN' || currentRole === 'STORE_MANAGER';
  const [categories, setCategories] = useState(DEFAULT_FMCG_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL'); // ALL, LOW, OUT, HEALTHY

  const [suppliers, setSuppliers] = useState([]);

  const reloadSuppliers = async () => {
    try {
      const sups = await apiGetSuppliers(true);
      if (Array.isArray(sups)) {
        setSuppliers(sups);
      }
    } catch (e) {
      console.warn('Tải lại nhà cung cấp thất bại:', e.message);
    }
  };

  useEffect(() => {
    let mounted = true;
    apiGetCategories()
      .then((cats) => {
        if (mounted && Array.isArray(cats) && cats.length > 0) {
          setCategories(cats);
        }
      })
      .catch(() => {});

    apiGetSuppliers(true)
      .then((sups) => {
        if (mounted && Array.isArray(sups)) {
          setSuppliers(sups);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  // Modal State: Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = Add, object = Edit
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    categoryId: 1,
    supplierId: 1,
    unit: 'Hộp',
    costPrice: '',
    sellingPrice: '',
    standardShelfLifeDays: 30,
    minStockLevel: 15,
    maxStockLevel: 150,
    customWarningDays: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedSku, setCopiedSku] = useState(null);

  // Modal State: Confirm Soft Delete
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  const [activeCatalogTab, setActiveCatalogTab] = useState('PRODUCTS'); // 'PRODUCTS' hoặc 'CATEGORIES'

  // Quản lý State CRUD Ngành Hàng FMCG
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catFormData, setCatFormData] = useState({
    code: '',
    name: '',
    storageTemperature: 'Mát (2 - 4°C)',
    defaultWarningDays: 7,
    description: ''
  });
  const [catFormError, setCatFormError] = useState('');
  const [isCatSubmitting, setIsCatSubmitting] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [isCatDeleting, setIsCatDeleting] = useState(false);

  const reloadCategories = async () => {
    try {
      const cats = await apiGetCategories();
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats);
      }
    } catch (e) {
      console.warn('Tải lại danh mục thất bại:', e.message);
    }
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatFormData({
      code: '',
      name: '',
      storageTemperature: 'Mát (2 - 4°C)',
      defaultWarningDays: 7,
      description: ''
    });
    setCatFormError('');
    setIsCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatFormData({
      code: cat.code || '',
      name: cat.name || '',
      storageTemperature: cat.storageTemperature || 'Nhiệt độ phòng (25°C)',
      defaultWarningDays: cat.defaultWarningDays || 7,
      description: cat.description || ''
    });
    setCatFormError('');
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catFormData.name || !catFormData.name.trim()) {
      setCatFormError('Tên ngành hàng không được để trống.');
      return;
    }
    const days = Number(catFormData.defaultWarningDays);
    if (isNaN(days) || days < 1 || days > 90) {
      setCatFormError('Số ngày cảnh báo hạn mặc định phải từ 1 đến 90 ngày.');
      return;
    }

    setIsCatSubmitting(true);
    setCatFormError('');
    try {
      let res;
      if (editingCategory) {
        res = await apiUpdateCategory(editingCategory.id, catFormData);
      } else {
        res = await apiCreateCategory(catFormData);
      }

      if (res && res.success) {
        setIsCatModalOpen(false);
        await reloadCategories();
        showToast('success', res.message || (editingCategory ? 'Cập nhật ngành hàng thành công.' : 'Tạo mới ngành hàng thành công.'));
      } else {
        setCatFormError(res?.message || 'Không thể lưu ngành hàng.');
      }
    } catch (err) {
      setCatFormError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsCatSubmitting(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    setIsCatDeleting(true);
    try {
      const res = await apiDeleteCategory(deletingCategory.id);
      if (res && res.success) {
        setDeletingCategory(null);
        await reloadCategories();
        showToast('success', res.message || `Đã xóa ngành hàng "${deletingCategory.name}".`);
      } else {
        showToast('error', res?.message || 'Không thể xóa ngành hàng.');
      }
    } catch (err) {
      showToast('error', err.message || 'Lỗi máy chủ khi xóa ngành hàng.');
    } finally {
      setIsCatDeleting(false);
    }
  };

  // Quản lý State CRUD Nhà Cung Cấp & Trung Tâm DC
  const [isSupModalOpen, setIsSupModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supFormData, setSupFormData] = useState({
    code: '',
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    leadTimeDays: 1,
    isActive: true
  });
  const [supFormError, setSupFormError] = useState('');
  const [isSupSubmitting, setIsSupSubmitting] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [isSupDeleting, setIsSupDeleting] = useState(false);

  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupFormData({
      code: `SUP-${Date.now().toString().slice(-4)}`,
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      leadTimeDays: 1,
      isActive: true
    });
    setSupFormError('');
    setIsSupModalOpen(true);
  };

  const handleOpenEditSupplier = (sup) => {
    setEditingSupplier(sup);
    setSupFormData({
      code: sup.code || '',
      name: sup.name || '',
      contactName: sup.contactName || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      leadTimeDays: sup.leadTimeDays || 1,
      isActive: sup.isActive !== undefined ? sup.isActive : true
    });
    setSupFormError('');
    setIsSupModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!supFormData.name || !supFormData.name.trim()) {
      setSupFormError('Tên nhà cung cấp / Trung tâm phân phối không được để trống.');
      return;
    }
    const lt = Number(supFormData.leadTimeDays);
    if (isNaN(lt) || lt < 1) {
      setSupFormError('Thời gian giao hàng tiêu chuẩn (Lead Time) phải lớn hơn hoặc bằng 1 ngày.');
      return;
    }

    setIsSupSubmitting(true);
    setSupFormError('');
    try {
      let res;
      if (editingSupplier) {
        res = await apiUpdateSupplier(editingSupplier.id, supFormData);
      } else {
        res = await apiCreateSupplier(supFormData);
      }

      if (res && res.success) {
        setIsSupModalOpen(false);
        await reloadSuppliers();
        showToast('success', res.message || (editingSupplier ? 'Cập nhật nhà cung cấp thành công.' : 'Tạo mới nhà cung cấp thành công.'));
      } else {
        setSupFormError(res?.message || 'Không thể lưu nhà cung cấp.');
      }
    } catch (err) {
      setSupFormError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsSupSubmitting(false);
    }
  };

  const handleConfirmDeleteSupplier = async () => {
    if (!deletingSupplier) return;
    setIsSupDeleting(true);
    try {
      const res = await apiDeleteSupplier(deletingSupplier.id);
      if (res && res.success) {
        setDeletingSupplier(null);
        await reloadSuppliers();
        showToast('success', res.message || `Đã xóa nhà cung ứng "${deletingSupplier.name}".`);
      } else {
        showToast('error', res?.message || 'Không thể xóa nhà cung ứng.');
      }
    } catch (err) {
      showToast('error', err.message || 'Lỗi máy chủ khi xóa nhà cung ứng.');
    } finally {
      setIsSupDeleting(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Copy SKU to clipboard
  const handleCopySku = (sku) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      name: '',
      categoryId: 1,
      supplierId: suppliers.length > 0 ? suppliers[0].id : 1,
      unit: 'Hộp',
      costPrice: '',
      sellingPrice: '',
      standardShelfLifeDays: 30,
      minStockLevel: 15,
      maxStockLevel: 150,
      customWarningDays: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      sku: prod.sku || '',
      name: prod.name || '',
      categoryId: prod.categoryId || 1,
      supplierId: prod.supplierId || (suppliers.length > 0 ? suppliers[0].id : 1),
      unit: prod.unit || 'Hộp',
      costPrice: prod.costPrice || '',
      sellingPrice: prod.sellingPrice || prod.price || '',
      standardShelfLifeDays: prod.standardShelfLifeDays || prod.shelfLifeDays || 30,
      minStockLevel: prod.minStockLevel || prod.reorderPoint || 15,
      maxStockLevel: prod.maxStockLevel || 150,
      customWarningDays: prod.customWarningDays !== null && prod.customWarningDays !== undefined ? prod.customWarningDays : ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Live Margin Calculation
  const costNum = Number(formData.costPrice) || 0;
  const sellingNum = Number(formData.sellingPrice) || 0;
  const marginPercent = sellingNum > 0 ? (((sellingNum - costNum) / sellingNum) * 100).toFixed(1) : 0;
  const isLoss = sellingNum > 0 && costNum > 0 && sellingNum < costNum;

  // Live Deduplication Check
  const deduplicationWarning = useMemo(() => {
    if (!formData.name && !formData.sku) return null;

    const trimmedSku = formData.sku.trim().toUpperCase();
    const currentId = editingProduct ? editingProduct.id : null;

    for (const p of products) {
      if (p.id === currentId) continue; // Bỏ qua chính nó khi sửa

      // 1. Kiểm tra SKU trùng
      if (trimmedSku && p.sku && p.sku.toUpperCase() === trimmedSku) {
        return {
          type: 'SKU_DUPLICATE',
          message: `Mã SKU [${trimmedSku}] đã tồn tại cho sản phẩm "${p.name}". Vui lòng đổi mã SKU khác!`,
          isBlocking: true
        };
      }

      // 2. Kiểm tra tên tương đồng >= 85%
      if (formData.name.trim().length >= 3) {
        const sim = calculateSimilarity(formData.name, p.name);
        if (sim >= 0.85) {
          const simPct = (sim * 100).toFixed(0);
          return {
            type: 'NAME_SIMILAR',
            message: `Tên sản phẩm tương đồng ${simPct}% với sản phẩm hiện có: "${p.name}" (SKU: ${p.sku}). Chuẩn Tự Động chặn tạo/sửa sản phẩm tương đồng >= 85% để tránh phân tán dữ liệu lô hàng.`,
            isBlocking: true
          };
        }
      }
    }
    return null;
  }, [formData.sku, formData.name, editingProduct, products]);

  // Handle Form Submit (Add or Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.sku.trim()) {
      setFormError('Mã SKU không được để trống.');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Tên sản phẩm không được để trống.');
      return;
    }
    if (costNum <= 0) {
      setFormError('Giá vốn nhập hàng phải lớn hơn 0 ₫.');
      return;
    }
    if (sellingNum <= 0) {
      setFormError('Giá bán lẻ niêm yết phải lớn hơn 0 ₫.');
      return;
    }
    if (sellingNum < costNum) {
      setFormError('Giá bán lẻ không được thấp hơn giá vốn (Tránh lỗ vốn rủi ro tài chính).');
      return;
    }
    if (Number(formData.standardShelfLifeDays) <= 0) {
      setFormError('Vòng đời hạn sử dụng tiêu chuẩn phải lớn hơn 0 ngày.');
      return;
    }

    if (deduplicationWarning && deduplicationWarning.isBlocking) {
      setFormError(deduplicationWarning.message);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        sku: formData.sku.trim().toUpperCase(),
        name: formData.name.trim(),
        categoryId: Number(formData.categoryId),
        supplierId: Number(formData.supplierId || (suppliers.length > 0 ? suppliers[0].id : 1)),
        unit: formData.unit.trim(),
        costPrice: costNum,
        sellingPrice: sellingNum,
        price: sellingNum,
        standardShelfLifeDays: Number(formData.standardShelfLifeDays),
        minStockLevel: Number(formData.minStockLevel),
        maxStockLevel: Number(formData.maxStockLevel),
        customWarningDays: formData.customWarningDays !== '' ? Number(formData.customWarningDays) : null
      };

      let res;
      if (editingProduct) {
        if (!onUpdateProduct) throw new Error('Hàm onUpdateProduct chưa được cung cấp.');
        res = await onUpdateProduct(editingProduct.id, payload);
      } else {
        if (!onAddNewProduct) throw new Error('Hàm onAddNewProduct chưa được cung cấp.');
        res = await onAddNewProduct(payload);
      }

      if (res && res.success) {
        setIsModalOpen(false);
      } else {
        setFormError(res?.message || 'Thao tác không thành công.');
      }
    } catch (err) {
      setFormError(err.message || 'Lỗi kết nối máy chủ khi lưu sản phẩm.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Soft Delete
  const handleConfirmDelete = async () => {
    if (!deletingProduct || !onDeleteProduct) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      const prodName = deletingProduct.name;
      const res = await onDeleteProduct(deletingProduct.id);
      if (res && res.success) {
        setDeletingProduct(null);
        showToast('success', `Đã ngừng kinh doanh "${prodName}". Sản phẩm đã được ẩn khỏi POS bán lẻ và ghi vào Sổ Kiểm Toán.`);
      } else {
        const errMsg = res?.message || 'Không thể ngừng kinh doanh sản phẩm.';
        setDeleteError(errMsg);
        showToast('error', errMsg);
      }
    } catch (err) {
      const errMsg = err.message || 'Lỗi máy chủ khi thao tác.';
      setDeleteError(errMsg);
      showToast('error', errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Bỏ qua sản phẩm đã bị soft-delete nếu có flag isActive = false
      if (prod.isActive === false) return false;

      // Filter category
      if (selectedCategory !== 'ALL') {
        const catId = Number(selectedCategory);
        if (prod.categoryId !== catId) return false;
      }

      // Filter stock status
      const totalStock = prod.totalStock || 0;
      const minStock = prod.minStockLevel || prod.reorderPoint || 15;
      if (stockStatusFilter === 'OUT' && totalStock > 0) return false;
      if (stockStatusFilter === 'LOW' && (totalStock === 0 || totalStock >= minStock)) return false;
      if (stockStatusFilter === 'HEALTHY' && totalStock < minStock) return false;

      // Filter search
      if (searchTerm.trim()) {
        const term = normalizeText(searchTerm);
        const nameNorm = normalizeText(prod.name);
        const skuNorm = normalizeText(prod.sku);
        if (!nameNorm.includes(term) && !skuNorm.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, stockStatusFilter, searchTerm]);

  // Statistics KPI
  const stats = useMemo(() => {
    const activeList = products.filter(p => p.isActive !== false);
    const totalCount = activeList.length;

    let totalValuation = 0;
    let totalMarginSum = 0;
    let lowStockCount = 0;

    activeList.forEach((p) => {
      const stock = p.totalStock || 0;
      const cost = p.costPrice || 0;
      const sell = p.sellingPrice || p.price || 0;
      const minStock = p.minStockLevel || p.reorderPoint || 15;

      totalValuation += stock * cost;

      if (sell > 0) {
        totalMarginSum += ((sell - cost) / sell) * 100;
      }

      if (stock < minStock) {
        lowStockCount++;
      }
    });

    const avgMargin = totalCount > 0 ? (totalMarginSum / totalCount).toFixed(1) : 0;

    return {
      totalCount,
      totalValuation,
      avgMargin,
      lowStockCount
    };
  }, [products]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          padding: '12px 18px',
          borderRadius: '10px',
          background: toast.type === 'success' ? '#064e3b' : '#7f1d1d',
          border: `1px solid ${toast.type === 'success' ? 'var(--safe-green)' : 'var(--critical-red)'}`,
          color: '#ffffff',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeIn 0.25s ease-out',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} color="var(--safe-green)" /> : <AlertTriangle size={18} color="var(--critical-red)" />}
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, marginLeft: '8px', display: 'flex', alignItems: 'center' }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Header & Page Title */}
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
            {activeCatalogTab === 'PRODUCTS' ? <Package size={24} /> : activeCatalogTab === 'CATEGORIES' ? <Layers size={24} /> : <Truck size={24} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                {activeCatalogTab === 'PRODUCTS' 
                  ? 'Danh Mục Sản Phẩm & Giá Bán Lẻ' 
                  : activeCatalogTab === 'CATEGORIES' 
                    ? 'Quản Lý Danh Mục Ngành Hàng FMCG' 
                    : 'Quản Lý Nhà Cung Cấp & Kho Tổng DC'}
              </h2>
              <span style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--safe-green)',
                fontWeight: 600,
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                FMCG {categories.length} Ngành Hàng • {suppliers.length} Nhà Cung Ứng
              </span>
              {!canManageCatalog && (
                <span style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: 'var(--warning-amber)',
                  fontWeight: 600,
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Eye size={12} />
                  Chế độ Tra cứu Sản phẩm & Bảo quản (STAFF - Chỉ đọc)
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {activeCatalogTab === 'PRODUCTS'
                ? 'Kiểm soát điều kiện bảo quản, ngưỡng cảnh báo hạn dùng và ngăn chặn trùng lặp SKU/Tên ≥ 85%'
                : activeCatalogTab === 'CATEGORIES'
                  ? 'Cấu hình mã ngành, nhiệt độ bảo quản yêu cầu và thời gian cảnh báo date mặc định'
                  : 'Quản lý Kho tổng DC Biên Hòa, thời gian giao hàng Lead Time (ngày) và các nhà cung ứng FMCG đối tác'}
            </p>
          </div>
        </div>

        {/* Cụm Điều Khiển: Tab Switcher & Nút Tạo Mới */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setActiveCatalogTab('PRODUCTS')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeCatalogTab === 'PRODUCTS' ? 'var(--accent-primary)' : 'transparent',
                color: activeCatalogTab === 'PRODUCTS' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Package size={15} />
              <span>Sản Phẩm ({stats.totalCount})</span>
            </button>
            <button
              onClick={() => setActiveCatalogTab('CATEGORIES')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeCatalogTab === 'CATEGORIES' ? 'var(--accent-primary)' : 'transparent',
                color: activeCatalogTab === 'CATEGORIES' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={15} />
              <span>Ngành Hàng ({categories.length})</span>
            </button>
            <button
              onClick={() => setActiveCatalogTab('SUPPLIERS')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeCatalogTab === 'SUPPLIERS' ? 'var(--accent-primary)' : 'transparent',
                color: activeCatalogTab === 'SUPPLIERS' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Truck size={15} />
              <span>Nhà Cung Ứng ({suppliers.length})</span>
            </button>
          </div>

          {canManageCatalog && (
            activeCatalogTab === 'PRODUCTS' ? (
              <button
                onClick={handleOpenAdd}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={16} />
                <span>Thêm Sản Phẩm</span>
              </button>
            ) : activeCatalogTab === 'CATEGORIES' ? (
              <button
                onClick={handleOpenAddCategory}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                <FolderPlus size={16} />
                <span>Thêm Ngành Hàng Mới</span>
              </button>
            ) : (
              <button
                onClick={handleOpenAddSupplier}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={16} />
                <span>Thêm Nhà Cung Ứng / DC</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* NỘI DUNG TAB 1: DANH MỤC SẢN PHẨM & GIÁ BÁN LẺ */}
      {activeCatalogTab === 'PRODUCTS' && (
        <>
          {/* Dải Danh mục Ngành hàng FMCG & Điều kiện bảo quản */}
          <div style={{
            padding: '14px 18px',
            background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
            <Thermometer size={16} color="var(--accent-primary)" />
            <span>Danh mục Ngành hàng FMCG & Chuẩn Nhiệt độ Bảo quản (Nhấn để lọc nhanh)</span>
          </div>
          {selectedCategory !== 'ALL' && (
            <button
              onClick={() => setSelectedCategory('ALL')}
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Xem tất cả ngành hàng
            </button>
          )}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '10px'
        }}>
          {categories.map((cat) => {
            const isSelected = String(selectedCategory) === String(cat.id);
            const countInCat = products.filter(p => p.isActive !== false && p.categoryId === cat.id).length;
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? 'ALL' : String(cat.id))}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(99, 102, 241, 0.14)' : 'var(--bg-secondary)',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-main)' }}>
                    {cat.name}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: 'var(--accent-primary)'
                  }}>
                    {countInCat} SKU
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                  <span>🌡️ {cat.storageTemperature || 'Nhiệt độ phòng 25°C'}</span>
                  <span>⚠️ Cảnh báo: {cat.defaultWarningDays || 7} ngày</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 Cards KPI Thống Kê Danh Mục */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Tổng SKU */}
        <div style={{
          padding: '18px 20px',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)'
          }}>
            <Boxes size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Tổng SKU Hoạt động
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              {stats.totalCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>mã</span>
            </div>
          </div>
        </div>

        {/* Card 2: Giá trị tồn kho danh mục */}
        <div style={{
          padding: '18px 20px',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--safe-green)'
          }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Giá trị Tồn theo Giá vốn
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              {stats.totalValuation.toLocaleString('vi-VN')} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>₫</span>
            </div>
          </div>
        </div>

        {/* Card 3: Biên lợi nhuận trung bình */}
        <div style={{
          padding: '18px 20px',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--warning-amber)'
          }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Biên Lợi nhuận Trung bình
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              {stats.avgMargin}% <span style={{ fontSize: '0.8rem', color: 'var(--safe-green)', fontWeight: 600 }}>Margin</span>
            </div>
          </div>
        </div>

        {/* Card 4: Dưới ngưỡng tồn an toàn */}
        <div style={{
          padding: '18px 20px',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: stats.lowStockCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: stats.lowStockCount > 0 ? 'var(--critical-red)' : 'var(--safe-green)'
          }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Dưới Ngưỡng An toàn (ROP)
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: stats.lowStockCount > 0 ? 'var(--critical-red)' : 'var(--text-main)', marginTop: '2px' }}>
              {stats.lowStockCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>mặt hàng</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        padding: '14px 18px',
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 14px',
          borderRadius: '8px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          flex: '1 1 280px',
          maxWidth: '420px'
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text"
            placeholder="Tìm theo SKU, tên sản phẩm (gõ không dấu)..."
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
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Ngành hàng */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Ngành hàng:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Tất cả ngành hàng</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.storageTemperature || '25°C'})</option>
              ))}
            </select>
          </div>

          {/* Trạng thái tồn */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Tồn kho:</span>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="HEALTHY">Đầy đủ (Đạt ROP)</option>
              <option value="LOW">Cảnh báo thiếu (Dưới ROP)</option>
              <option value="OUT">Hết hàng (Stock = 0)</option>
            </select>
          </div>

          <div style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'var(--bg-secondary)'
          }}>
            Hiển thị <strong>{filteredProducts.length}</strong> / {stats.totalCount} mặt hàng
          </div>
        </div>
      </div>

      {/* Main Table: Product Catalog */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <th style={{ padding: '14px 18px', width: '130px' }}>Mã SKU</th>
                <th style={{ padding: '14px 18px' }}>Tên Sản Phẩm & Ngành Hàng</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Giá Vốn DC</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Giá Bán POS</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Biên Lợi Nhuận</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Hạn Chuẩn</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Tồn Thực Tế / ROP</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Package size={36} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Không tìm thấy sản phẩm nào phù hợp</div>
                      <div style={{ fontSize: '0.82rem' }}>Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các tiêu chí lọc.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const cost = prod.costPrice || 0;
                  const sell = prod.sellingPrice || prod.price || 0;
                  const margin = sell > 0 ? (((sell - cost) / sell) * 100).toFixed(1) : 0;
                  const stock = prod.totalStock || 0;
                  const minStock = prod.minStockLevel || prod.reorderPoint || 15;
                  const isStockLow = stock < minStock;
                  const isOutOfStock = stock === 0;

                  return (
                    <tr 
                      key={prod.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Cột 1: SKU */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            color: 'var(--accent-primary)',
                            background: 'rgba(99, 102, 241, 0.08)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(99, 102, 241, 0.2)'
                          }}>
                            {prod.sku}
                          </span>
                          <button
                            onClick={() => handleCopySku(prod.sku)}
                            title="Sao chép SKU"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: copiedSku === prod.sku ? 'var(--safe-green)' : 'var(--text-muted)',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            {copiedSku === prod.sku ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                      {/* Cột 2: Tên & Ngành hàng */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                          {prod.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-muted)',
                            fontWeight: 500,
                            border: '1px solid var(--border-subtle)'
                          }}>
                            {prod.category || 'FMCG'}
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(59, 130, 246, 0.08)',
                            color: '#60a5fa',
                            fontWeight: 600,
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                          }}>
                            🌡️ {prod.storageTemperature || 'Nhiệt độ phòng 25°C'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ĐVT: <strong>{prod.unit || 'Cái'}</strong>
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(168, 85, 247, 0.08)',
                            color: '#c084fc',
                            fontWeight: 600,
                            border: '1px solid rgba(168, 85, 247, 0.2)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            🏭 {prod.supplier || 'Kho DC'}
                          </span>
                        </div>
                      </td>

                      {/* Cột 3: Giá Vốn */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {cost.toLocaleString('vi-VN')} ₫
                      </td>

                      {/* Cột 4: Giá Bán */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                        {sell.toLocaleString('vi-VN')} ₫
                      </td>

                      {/* Cột 5: Biên Lợi Nhuận */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: Number(margin) >= 20 ? 'rgba(16, 185, 129, 0.12)' : Number(margin) > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: Number(margin) >= 20 ? 'var(--safe-green)' : Number(margin) > 0 ? 'var(--warning-amber)' : 'var(--critical-red)',
                          border: `1px solid ${Number(margin) >= 20 ? 'rgba(16, 185, 129, 0.3)' : Number(margin) > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}>
                          +{margin}%
                        </span>
                      </td>

                      {/* Cột 6: Hạn Chuẩn & Cảnh báo */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.84rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            <Calendar size={14} color="var(--text-muted)" />
                            <span>{prod.standardShelfLifeDays || prod.shelfLifeDays || 30} ngày</span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--warning-amber)', fontWeight: 600 }}>
                            Cảnh báo: ≤ {prod.effectiveWarningDays || prod.customWarningDays || 7} ngày
                          </span>
                        </div>
                      </td>

                      {/* Cột 7: Tồn thực tế / ROP */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: isOutOfStock ? 'var(--critical-red)' : isStockLow ? 'var(--warning-amber)' : 'var(--safe-green)'
                          }}>
                            {stock} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {minStock} {prod.unit}</span>
                          </span>
                          {/* Mini Progress Bar */}
                          <div style={{
                            width: '80px',
                            height: '5px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            border: '1px solid var(--border-subtle)'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.min(100, Math.round((stock / (minStock * 2 || 30)) * 100))}%`,
                              background: isOutOfStock ? 'var(--critical-red)' : isStockLow ? 'var(--warning-amber)' : 'var(--safe-green)',
                              borderRadius: '3px'
                            }} />
                          </div>
                        </div>
                      </td>

                      {/* Cột 8: Thao tác */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {canManageCatalog ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleOpenEdit(prod)}
                              title="Chỉnh sửa sản phẩm"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-subtle)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                e.currentTarget.style.color = 'var(--accent-primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                e.currentTarget.style.color = 'var(--text-main)';
                              }}
                            >
                              <Edit3 size={14} />
                              <span>Sửa</span>
                            </button>

                            <button
                              onClick={() => {
                                setDeletingProduct(prod);
                                setDeleteError('');
                              }}
                              title="Ngừng kinh doanh (Xóa mềm)"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                background: 'rgba(239, 68, 68, 0.08)',
                                color: 'var(--critical-red)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                            >
                              <Trash2 size={14} />
                              <span>Ngừng bán</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Eye size={13} />
                            Chỉ xem
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

  {/* NỘI DUNG TAB 2: QUẢN LÝ DANH MỤC NGÀNH HÀNG FMCG (MỤC 6 ĐẶC TẢ) */}
  {activeCatalogTab === 'CATEGORIES' && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Banner Giới Thiệu Chuẩn Bảo Quản Chuỗi FMCG */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Tiêu Chuẩn Điều Kiện Bảo Quản & Vòng Đời FMCG
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Mỗi nhóm ngành hàng gắn liền với nhiệt độ bảo quản và số ngày cảnh báo cận date tự động (Xanh / Vàng / Đỏ).
            </div>
          </div>
        </div>

        {canManageCatalog && (
          <button
            onClick={handleOpenAddCategory}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
            }}
          >
            <FolderPlus size={16} />
            <span>Thêm Ngành Hàng Mới</span>
          </button>
        )}
      </div>

      {/* Bảng Danh Sách Ngành Hàng FMCG */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 16px', width: '60px' }}>STT</th>
                <th style={{ padding: '12px 16px', width: '130px' }}>Mã Ngành (Code)</th>
                <th style={{ padding: '12px 16px' }}>Tên Ngành Hàng FMCG</th>
                <th style={{ padding: '12px 16px' }}>Nhiệt Độ Bảo Quản</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Cảnh Báo Date Mặc Định</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Số Sản Phẩm</th>
                <th style={{ padding: '12px 16px' }}>Mô Tả Nghiệp Vụ</th>
                {canManageCatalog && <th style={{ padding: '12px 16px', textAlign: 'right', width: '140px' }}>Thao Tác</th>}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => {
                const prodCount = cat.productCount !== undefined 
                  ? cat.productCount 
                  : products.filter(p => p.isActive !== false && p.categoryId === cat.id).length;
                const isCold = (cat.storageTemperature || '').includes('Đông lạnh');
                const isChilled = (cat.storageTemperature || '').includes('Mát');

                return (
                  <tr key={cat.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500 }}>
                      #{idx + 1}
                    </td>

                    {/* Mã ngành code */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--accent-primary)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        {cat.code}
                      </span>
                    </td>

                    {/* Tên ngành hàng */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        {cat.name}
                      </div>
                    </td>

                    {/* Nhiệt độ bảo quản */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.785rem',
                        fontWeight: 600,
                        background: isCold ? 'rgba(99, 102, 241, 0.12)' : (isChilled ? 'rgba(14, 165, 233, 0.12)' : 'var(--bg-secondary)'),
                        color: isCold ? 'var(--accent-primary)' : (isChilled ? '#0284c7' : 'var(--text-muted)'),
                        border: `1px solid ${isCold ? 'rgba(99, 102, 241, 0.25)' : (isChilled ? 'rgba(14, 165, 233, 0.25)' : 'var(--border-subtle)')}`
                      }}>
                        <Thermometer size={14} />
                        {cat.storageTemperature}
                      </span>
                    </td>

                    {/* Cảnh báo date mặc định */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.785rem',
                        fontWeight: 700,
                        background: cat.defaultWarningDays <= 3 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: cat.defaultWarningDays <= 3 ? 'var(--critical-red)' : 'var(--warning-amber)',
                        border: `1px solid ${cat.defaultWarningDays <= 3 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
                      }}>
                        {cat.defaultWarningDays} ngày
                      </span>
                    </td>

                    {/* Số sản phẩm */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '0.785rem',
                        fontWeight: 700,
                        background: prodCount > 0 ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-secondary)',
                        color: prodCount > 0 ? 'var(--safe-green)' : 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        {prodCount} sản phẩm
                      </span>
                    </td>

                    {/* Mô tả */}
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '240px' }}>
                      {cat.description || 'Theo dõi chu kỳ hạn dùng FMCG'}
                    </td>

                    {/* Cụm Thao tác */}
                    {canManageCatalog && (
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            title="Chỉnh sửa thông số ngành hàng"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-main)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Edit3 size={14} color="var(--accent-primary)" />
                            <span>Sửa</span>
                          </button>

                          <button
                            onClick={() => setDeletingCategory(cat)}
                            disabled={prodCount > 0}
                            title={prodCount > 0 ? `Đang có ${prodCount} sản phẩm thuộc ngành này, không thể xóa để bảo toàn dữ liệu ngoại khóa!` : 'Xóa ngành hàng'}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: prodCount > 0 ? 'var(--bg-secondary)' : 'rgba(239, 68, 68, 0.12)',
                              border: `1px solid ${prodCount > 0 ? 'var(--border-subtle)' : 'rgba(239, 68, 68, 0.3)'}`,
                              color: prodCount > 0 ? 'var(--text-dim)' : 'var(--critical-red)',
                              cursor: prodCount > 0 ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              opacity: prodCount > 0 ? 0.6 : 1,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Trash2 size={14} />
                            <span>Xóa</span>
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

    </div>
  )}

  {/* NỘI DUNG TAB 3: QUẢN LÝ NHÀ CUNG CẤP & KHO TỔNG DC (MỤC 5 & MỤC 17.4) */}
  {activeCatalogTab === 'SUPPLIERS' && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Banner Giới Thiệu Mô Hình DC Kho Tổng Chuỗi Bán Lẻ */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
            <Truck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Mô Hình Kho Trung Tâm Phân Phối DC & Nhà Cung Ứng FMCG
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Cửa hàng liên kết trực tiếp với Kho Phân phối DC Biên Hòa (Lead Time 1 ngày, RSL ≥ 70%) và các nhà cung cấp được ủy quyền.
            </div>
          </div>
        </div>

        {canManageCatalog && (
          <button
            onClick={handleOpenAddSupplier}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
            }}
          >
            <Plus size={16} />
            <span>Thêm Nhà Cung Ứng / DC</span>
          </button>
        )}
      </div>

      {/* Bảng Danh Sách Nhà Cung Cấp */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 16px', width: '50px' }}>STT</th>
                <th style={{ padding: '12px 16px', width: '130px' }}>Mã Đơn Vị</th>
                <th style={{ padding: '12px 16px' }}>Tên Đơn Vị Cung Ứng</th>
                <th style={{ padding: '12px 16px' }}>Đại Diện & Liên Hệ</th>
                <th style={{ padding: '12px 16px' }}>Địa Chỉ Kho / Trụ Sở</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Lead Time</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Hàng Cung Ứng</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Trạng Thái</th>
                {canManageCatalog && <th style={{ padding: '12px 16px', textAlign: 'right', width: '130px' }}>Thao Tác</th>}
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={canManageCatalog ? 9 : 8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Chưa có dữ liệu nhà cung ứng nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                suppliers.map((sup, idx) => {
                  const isDC = (sup.code || '').startsWith('DC') || (sup.name || '').toLowerCase().includes('kho tổng') || (sup.name || '').toLowerCase().includes('phân phối');
                  const pCount = sup.productCount || 0;
                  const poCnt = sup.poCount || 0;

                  return (
                    <tr key={sup.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        #{idx + 1}
                      </td>

                      {/* Mã code */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isDC ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-secondary)',
                          color: isDC ? 'var(--accent-primary)' : 'var(--text-main)',
                          border: `1px solid ${isDC ? 'rgba(99, 102, 241, 0.25)' : 'var(--border-subtle)'}`
                        }}>
                          {sup.code}
                        </span>
                      </td>

                      {/* Tên nhà cung ứng */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {sup.name}
                        </div>
                        <div style={{ marginTop: '3px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: isDC ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: isDC ? '#60a5fa' : 'var(--safe-green)',
                            border: `1px solid ${isDC ? 'rgba(59, 130, 246, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
                          }}>
                            {isDC ? 'Kho Trung Tâm Phân Phối DC' : 'Nhà Sản Xuất FMCG Trực Tiếp'}
                          </span>
                        </div>
                      </td>

                      {/* Đại diện & Liên hệ */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.84rem' }}>
                          {sup.contactName || 'Chưa cập nhật'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {sup.phone && <span>📞 {sup.phone}</span>}
                          {sup.email && <span>✉️ {sup.email}</span>}
                        </div>
                      </td>

                      {/* Địa chỉ */}
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: '180px' }}>
                        {sup.address || 'Khu công nghiệp Biên Hòa, Đồng Nai'}
                      </td>

                      {/* Lead Time */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: sup.leadTimeDays <= 1 ? 'var(--safe-green)' : 'var(--warning-amber)',
                          background: sup.leadTimeDays <= 1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: `1px solid ${sup.leadTimeDays <= 1 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
                        }}>
                          {sup.leadTimeDays} ngày
                        </span>
                      </td>

                      {/* Mặt hàng cung ứng */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                          {pCount} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>SKU</span>
                        </div>
                        {poCnt > 0 && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', marginTop: '2px' }}>
                            {poCnt} đơn PO
                          </div>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: sup.isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: sup.isActive ? 'var(--safe-green)' : 'var(--critical-red)',
                          border: `1px solid ${sup.isActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                        }}>
                          {sup.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                        </span>
                      </td>

                      {/* Thao tác */}
                      {canManageCatalog && (
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenEditSupplier(sup)}
                              title="Chỉnh sửa thông tin nhà cung cấp"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Edit3 size={14} color="var(--accent-primary)" />
                              <span>Sửa</span>
                            </button>

                            <button
                              onClick={() => setDeletingSupplier(sup)}
                              disabled={pCount > 0 || poCnt > 0}
                              title={pCount > 0 ? `Đang có ${pCount} sản phẩm liên kết với NCC này, không thể xóa để bảo toàn dữ liệu ngoại khóa!` : poCnt > 0 ? `Đang có ${poCnt} đơn PO liên kết, không thể xóa!` : 'Xóa nhà cung ứng'}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                background: (pCount > 0 || poCnt > 0) ? 'var(--bg-secondary)' : 'rgba(239, 68, 68, 0.12)',
                                border: `1px solid ${(pCount > 0 || poCnt > 0) ? 'var(--border-subtle)' : 'rgba(239, 68, 68, 0.3)'}`,
                                color: (pCount > 0 || poCnt > 0) ? 'var(--text-dim)' : 'var(--critical-red)',
                                cursor: (pCount > 0 || poCnt > 0) ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                opacity: (pCount > 0 || poCnt > 0) ? 0.6 : 1,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Trash2 size={14} />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )}

      {/* ============================================================================== */}
      {/* MODAL THÊM MỚI / CHỈNH SỬA SẢN PHẨM */}
      {/* ============================================================================== */}
      {isModalOpen && (
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
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)'
                }}>
                  {editingProduct ? <Edit3 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {editingProduct ? `Chỉnh sửa Sản Phẩm: ${editingProduct.sku}` : 'Thêm Sản Phẩm Mới vào Danh Mục'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {editingProduct ? 'Cập nhật giá, hạn dùng và thông số chuỗi cung ứng' : 'Kiểm soát chặt chẽ giá vốn/giá bán và chống trùng lặp tên/SKU'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Cảnh báo lỗi Form */}
                {formError && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--critical-red)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={18} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Cảnh báo chống trùng lặp Rule 9 (Deduplication Live Warning) */}
                {deduplicationWarning && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: deduplicationWarning.isBlocking ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    border: `1px solid ${deduplicationWarning.isBlocking ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                    color: deduplicationWarning.isBlocking ? 'var(--critical-red)' : 'var(--warning-amber)',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {deduplicationWarning.type === 'SKU_DUPLICATE' ? 'Phát hiện Trùng Mã SKU' : 'Cảnh báo Tương đồng Tên Sản Phẩm'}
                      </div>
                      <div style={{ marginTop: '2px', lineHeight: 1.4 }}>
                        {deduplicationWarning.message}
                      </div>
                    </div>
                  </div>
                )}

                {/* KHỐI 1: NHẬN DIỆN SẢN PHẨM */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    1. Thông tin Nhận diện Sản phẩm
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
                    {/* SKU */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Mã SKU <span style={{ color: 'var(--critical-red)' }}>*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder="vd: MILK-001"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-main)',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>

                    {/* Tên sản phẩm */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Tên Sản Phẩm <span style={{ color: 'var(--critical-red)' }}>*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder="vd: Sữa tươi tiệt trùng Vinamilk 100% 1L"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-main)',
                          fontSize: '0.88rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '14px', marginTop: '12px' }}>
                    {/* Ngành hàng */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Ngành Hàng FMCG <span style={{ color: 'var(--critical-red)' }}>*</span>
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-main)',
                          fontSize: '0.88rem',
                          outline: 'none',
                          cursor: 'pointer',
                          boxSizing: 'border-box'
                        }}
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name} — {c.storageTemperature || '25°C'} (Cảnh báo {c.defaultWarningDays || 7} ngày)</option>
                        ))}
                      </select>
                    </div>

                    {/* Nhà cung ứng mặc định */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Nhà Cung Ứng / Kho DC <span style={{ color: 'var(--critical-red)' }}>*</span>
                      </label>
                      <select
                        value={formData.supplierId || 1}
                        onChange={(e) => setFormData({ ...formData, supplierId: Number(e.target.value) })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-main)',
                          fontSize: '0.88rem',
                          outline: 'none',
                          cursor: 'pointer',
                          boxSizing: 'border-box'
                        }}
                      >
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.code}) — Lead Time {s.leadTimeDays}d
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Đơn vị tính chuẩn hóa Mục 6 */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Đơn Vị Tính (ĐVT)
                      </label>
                      <input 
                        type="text"
                        list="standard-units-list"
                        placeholder="Hộp, Chai, Gói..."
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-main)',
                          fontSize: '0.88rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <datalist id="standard-units-list">
                        {STANDARD_UNITS.map(u => (
                          <option key={u} value={u} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* KHỐI 2: TÀI CHÍNH & GIÁ (KIỂM SOÁT BIÊN LỢI NHUẬN) */}
                <div style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    2. Tài chính & Định giá Bán lẻ
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {/* Giá vốn */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Giá Vốn Nhập DC (₫) <span style={{ color: 'var(--critical-red)' }}>*</span>
                      </label>
                      <input 
                        type="number"
                        min="1"
                        placeholder="25000"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>

                    {/* Giá bán niêm yết */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Giá Niêm Yết POS (₫) <span style={{ color: 'var(--critical-red)' }}>*</span>
                      </label>
                      <input 
                        type="number"
                        min="1"
                        placeholder="35000"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: isLoss ? '1px solid var(--critical-red)' : '1px solid var(--border-subtle)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Live Margin Indicator */}
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: isLoss ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.1)',
                    border: `1px solid ${isLoss ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.25)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                      <TrendingUp size={16} color={isLoss ? 'var(--critical-red)' : 'var(--safe-green)'} />
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                        {isLoss ? 'Cảnh báo bán lỗ vốn:' : 'Biên lợi nhuận gộp dự kiến:'}
                      </span>
                    </div>
                    <div style={{
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      color: isLoss ? 'var(--critical-red)' : 'var(--safe-green)'
                    }}>
                      {isLoss ? `Lỗ -${Math.abs(marginPercent)}%` : `+${marginPercent}%`}
                    </div>
                  </div>
                </div>

                {/* KHỐI 3: VÒNG ĐỜI HẠN DÙNG & CHUỖI CUNG ỨNG */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    3. Vòng đời Hạn dùng & Ngưỡng Chuỗi cung ứng
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    {/* Shelf-life */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Hạn Chuẩn (Ngày) <span style={{ color: 'var(--critical-red)' }}>*</span>
                      </label>
                      <input 
                        type="number"
                        min="1"
                        placeholder="30"
                        value={formData.standardShelfLifeDays}
                        onChange={(e) => setFormData({ ...formData, standardShelfLifeDays: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-main)',
                          fontSize: '0.88rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>

                    {/* Min Stock / ROP */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Min Stock (ROP)
                      </label>
                      <input 
                        type="number"
                        min="0"
                        placeholder="15"
                        value={formData.minStockLevel}
                        onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-main)',
                          fontSize: '0.88rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Custom Warning Days */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Cảnh Báo Sớm (Ngày)
                      </label>
                      <input 
                        type="number"
                        min="0"
                        placeholder="Mặc định: 15% shelf"
                        value={formData.customWarningDays}
                        onChange={(e) => setFormData({ ...formData, customWarningDays: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-main)',
                          fontSize: '0.88rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoss || (deduplicationWarning && deduplicationWarning.isBlocking)}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: (isLoss || (deduplicationWarning && deduplicationWarning.isBlocking)) ? 'var(--text-muted)' : 'var(--accent-primary)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: (isLoss || (deduplicationWarning && deduplicationWarning.isBlocking)) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{editingProduct ? 'Cập Nhật Sản Phẩm' : 'Tạo Sản Phẩm Mới'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL XÁC NHẬN NGỪNG KINH DOANH (SOFT DELETE & AUDIT LOG RULE 11) */}
      {/* ============================================================================== */}
      {deletingProduct && (
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
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '480px',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--critical-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={26} />
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Xác nhận Ngừng Kinh Doanh?
                </h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Bạn có chắc chắn muốn ngừng kinh doanh sản phẩm <strong style={{ color: 'var(--text-main)' }}>"{deletingProduct.name}"</strong> (SKU: {deletingProduct.sku})?
                </p>
              </div>

              {(deletingProduct.totalStock || 0) > 0 ? (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  fontSize: '0.82rem',
                  color: 'var(--critical-red)',
                  lineHeight: 1.45
                }}>
                  🚫 <strong>Khóa thao tác:</strong>
                  <div style={{ marginTop: '4px' }}>
                    Sản phẩm này hiện đang còn <strong>{Number(deletingProduct.totalStock).toLocaleString('vi-VN')} {deletingProduct.unit}</strong> tồn kho khả dụng tại cửa hàng. Bạn không thể ngừng kinh doanh sản phẩm cho đến khi số lượng tồn này được xuất bán hết qua POS hoặc lập phiếu tiêu hủy thanh lý kho!
                  </div>
                </div>
              ) : (
                <div style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)'
                }}>
                  ℹ️ Sản phẩm hiện đã hết hàng tồn kho. Thao tác ngừng kinh doanh sẽ được ghi nhận vào <strong>Sổ Nhật Ký Kiểm Toán (AuditLogs)</strong> của hệ thống.
                </div>
              )}

              {deleteError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid var(--critical-red)',
                  fontSize: '0.84rem',
                  color: 'var(--critical-red)',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <AlertCircle size={16} />
                  <span>{deleteError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setDeletingProduct(null)}
                  disabled={isDeleting}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Giữ lại
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting || (deletingProduct.totalStock || 0) > 0}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: (deletingProduct.totalStock || 0) > 0 ? 'var(--border-subtle)' : 'var(--critical-red)',
                    color: (deletingProduct.totalStock || 0) > 0 ? 'var(--text-muted)' : '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: (deletingProduct.totalStock || 0) > 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title={(deletingProduct.totalStock || 0) > 0 ? "Khóa thao tác: Sản phẩm vẫn còn tồn kho khả dụng" : "Xác nhận ngừng kinh doanh"}
                >
                  {isDeleting ? 'Đang xử lý...' : (deletingProduct.totalStock || 0) > 0 ? 'Đang còn tồn kho' : 'Xác nhận Ngừng bán'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL THÊM MỚI / CHỈNH SỬA NGÀNH HÀNG FMCG (MỤC 6 ĐẶC TẢ) */}
      {/* ============================================================================== */}
      {isCatModalOpen && (
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
          zIndex: 9998,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)'
                }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {editingCategory ? 'Chỉnh Sửa Ngành Hàng FMCG' : 'Thêm Ngành Hàng FMCG Mới'}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Định hình chuẩn bảo quản và số ngày cảnh báo cận date mặc định
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsCatModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCategory} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Mã code & Tên ngành */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Mã Ngành (Code)
                  </label>
                  <input
                    type="text"
                    value={catFormData.code}
                    onChange={(e) => setCatFormData({ ...catFormData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: SNACK"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      fontWeight: 700
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Tên Ngành Hàng <span style={{ color: 'var(--critical-red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={catFormData.name}
                    onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                    placeholder="VD: Đồ ăn vặt & Bánh kẹo"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  />
                </div>
              </div>

              {/* Nhiệt độ bảo quản & Ngày cảnh báo mặc định */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Nhiệt Độ Bảo Quản Chuẩn
                  </label>
                  <select
                    value={catFormData.storageTemperature}
                    onChange={(e) => setCatFormData({ ...catFormData, storageTemperature: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="Mát (2 - 4°C)">Mát (2 - 4°C) — Sữa tươi, chế phẩm</option>
                    <option value="Đông lạnh (-18°C)">Đông lạnh (-18°C) — Thịt cá, hải sản, kem</option>
                    <option value="Mát (8 - 12°C)">Mát (8 - 12°C) — Rau củ, trái cây sạch</option>
                    <option value="Nhiệt độ phòng (25°C)">Nhiệt độ phòng (25°C) — Bánh mì, nước ngọt</option>
                    <option value="Khô ráo thoáng mát">Khô ráo thoáng mát — Thực phẩm khô, mì gói</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Cảnh Báo Cận Date
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={catFormData.defaultWarningDays}
                      onChange={(e) => setCatFormData({ ...catFormData, defaultWarningDays: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 30px 8px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ngày
                    </span>
                  </div>
                </div>
              </div>

              {/* Mô tả chi tiết */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Mô Tả Quy Định Lưu Kho
                </label>
                <textarea
                  rows="2"
                  value={catFormData.description}
                  onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                  placeholder="Ghi chú quy trình kiểm tra date hoặc điều kiện bảo quản đặc thù..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Error Message */}
              {catFormError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid var(--critical-red)',
                  fontSize: '0.82rem',
                  color: 'var(--critical-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>{catFormError}</span>
                </div>
              )}

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  disabled={isCatSubmitting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCatSubmitting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Save size={16} />
                  <span>{isCatSubmitting ? 'Đang lưu...' : (editingCategory ? 'Lưu Thay Đổi' : 'Thêm Ngành Hàng')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL XÁC NHẬN XÓA NGÀNH HÀNG FMCG (BẢO VỆ RÀNG BUỘC NGOẠI KHÓA) */}
      {/* ============================================================================== */}
      {deletingCategory && (
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
            background: 'var(--bg-card)',
            border: '1px solid var(--critical-red)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--critical-red)'
              }}>
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--critical-red)' }}>
                  Xác Nhận Xóa Ngành Hàng
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Bảo vệ tính toàn vẹn dữ liệu danh mục SQL Server
                </div>
              </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa ngành hàng <strong>[{deletingCategory.code}] {deletingCategory.name}</strong> không?
              </p>

              <div style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                lineHeight: 1.4,
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'var(--bg-secondary)'
              }}>
                ℹ️ Thao tác sẽ được ghi nhận vào <strong>Sổ Nhật Ký Kiểm Toán (AuditLogs)</strong> của hệ thống.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  disabled={isCatDeleting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCategory}
                  disabled={isCatDeleting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--critical-red)',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isCatDeleting ? 'Đang xóa...' : 'Xác Nhận Xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL THÊM MỚI / CHỈNH SỬA NHÀ CUNG CẤP & KHO DC (MỤC 5 & MỤC 17.4) */}
      {/* ============================================================================== */}
      {isSupModalOpen && (
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
          zIndex: 9998,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)'
                }}>
                  <Truck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {editingSupplier ? 'Chỉnh Sửa Nhà Cung Cấp / DC' : 'Thêm Nhà Cung Cấp / Kho DC Mới'}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Quản lý chuỗi cung ứng hàng hóa và thời gian giao hàng Lead Time
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsSupModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSupplier} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Mã code & Tên nhà cung ứng */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Mã Đơn Vị (Code)
                  </label>
                  <input
                    type="text"
                    value={supFormData.code}
                    onChange={(e) => setSupFormData({ ...supFormData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: DC-BIENHOA"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      fontWeight: 700
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Tên Đơn Vị Cung Ứng <span style={{ color: 'var(--critical-red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={supFormData.name}
                    onChange={(e) => setSupFormData({ ...supFormData, name: e.target.value })}
                    placeholder="VD: Kho Trung Tâm Phân Phối DC Biên Hòa"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  />
                </div>
              </div>

              {/* Đại diện & Liên hệ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Người Phụ Trách / Đại Diện
                  </label>
                  <input
                    type="text"
                    value={supFormData.contactName}
                    onChange={(e) => setSupFormData({ ...supFormData, contactName: e.target.value })}
                    placeholder="VD: Nguyễn Văn Kho"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Số Điện Thoại Liên Lạc
                  </label>
                  <input
                    type="text"
                    value={supFormData.phone}
                    onChange={(e) => setSupFormData({ ...supFormData, phone: e.target.value })}
                    placeholder="VD: 0901234567"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {/* Email & Lead Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Email Giao Dịch
                  </label>
                  <input
                    type="email"
                    value={supFormData.email}
                    onChange={(e) => setSupFormData({ ...supFormData, email: e.target.value })}
                    placeholder="VD: dc_bienhoa@retail.vn"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Lead Time Giao Hàng <span style={{ color: 'var(--critical-red)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={supFormData.leadTimeDays}
                      onChange={(e) => setSupFormData({ ...supFormData, leadTimeDays: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 32px 8px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ngày
                    </span>
                  </div>
                </div>
              </div>

              {/* Địa chỉ kho */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Địa Chỉ Kho Hàng / Trụ Sở
                </label>
                <input
                  type="text"
                  value={supFormData.address}
                  onChange={(e) => setSupFormData({ ...supFormData, address: e.target.value })}
                  placeholder="VD: Khu công nghiệp Biên Hòa 2, TP. Biên Hòa, Đồng Nai"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* Trạng thái hoạt động */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <input
                  type="checkbox"
                  id="sup-is-active"
                  checked={supFormData.isActive}
                  onChange={(e) => setSupFormData({ ...supFormData, isActive: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="sup-is-active" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}>
                  Kích hoạt sẵn sàng giao dịch và đặt hàng bổ sung (PO)
                </label>
              </div>

              {/* Error Message */}
              {supFormError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid var(--critical-red)',
                  fontSize: '0.82rem',
                  color: 'var(--critical-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>{supFormError}</span>
                </div>
              )}

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsSupModalOpen(false)}
                  disabled={isSupSubmitting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSupSubmitting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Save size={16} />
                  <span>{isSupSubmitting ? 'Đang lưu...' : (editingSupplier ? 'Lưu Thay Đổi' : 'Thêm Nhà Cung Cấp')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL XÁC NHẬN XÓA NHÀ CUNG CẤP (BẢO VỆ RÀNG BUỘC NGOẠI KHÓA) */}
      {/* ============================================================================== */}
      {deletingSupplier && (
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
            background: 'var(--bg-card)',
            border: '1px solid var(--critical-red)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--critical-red)'
              }}>
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--critical-red)' }}>
                  Xác Nhận Xóa Nhà Cung Cấp
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Bảo vệ tính toàn vẹn dữ liệu chuỗi cung ứng SQL Server
                </div>
              </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa nhà cung cấp <strong>[{deletingSupplier.code}] {deletingSupplier.name}</strong> không?
              </p>

              <div style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                lineHeight: 1.4,
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'var(--bg-secondary)'
              }}>
                ℹ️ Thao tác sẽ được ghi nhận vào <strong>Sổ Nhật Ký Kiểm Toán (AuditLogs)</strong> của hệ thống.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setDeletingSupplier(null)}
                  disabled={isSupDeleting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSupplier}
                  disabled={isSupDeleting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--critical-red)',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isSupDeleting ? 'Đang xóa...' : 'Xác Nhận Xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
