import React, { useState } from 'react';
import { 
  PackagePlus, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownToLine, 
  History, 
  PlusCircle, 
  Search, 
  Filter, 
  X, 
  Save 
} from 'lucide-react';

// Helper: Normalize Vietnamese strings without diacritics
function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

// Helper: Strip specific packaging and volume words to extract core product identity
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

// Helper: Find duplicate or near-duplicate product
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

export default function DcIntakeView({ 
  products, 
  onAddBatch, 
  onAddNewProduct, 
  recentIntakes 
}) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 1);
  const selectedProd = products.find(p => p.id === selectedProductId) || products[0];

  const [batchCode, setBatchCode] = useState(`BAT-DC-${Date.now().toString().slice(-6)}`);
  const [importDate, setImportDate] = useState('2026-09-24');
  const [expiryDate, setExpiryDate] = useState('2026-11-24');
  const [quantity, setQuantity] = useState(30);
  const [costPrice, setCostPrice] = useState(selectedProd?.costPrice || 28000);
  const [retailPrice, setRetailPrice] = useState(selectedProd?.price || 36000);
  const [updateRetailPrice, setUpdateRetailPrice] = useState(false);
  const [newRetailPrice, setNewRetailPrice] = useState(selectedProd?.price || 36000);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Filtering states for product selector
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal State for Adding New Product
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState(1);
  const [newProdUnit, setNewProdUnit] = useState('Hộp');
  const [newProdCost, setNewProdCost] = useState(25000);
  const [newProdPrice, setNewProdPrice] = useState(35000);
  const [newProdShelfLife, setNewProdShelfLife] = useState(30);
  const [modalError, setModalError] = useState('');

  // Live duplicate detector when user types new product name
  const detectedDuplicate = findDuplicateProduct(newProdName, products);

  // Extract unique categories from products
  const categories = ['ALL', ...new Set(products.map(p => p.category))];

  // Smart token-based unaccented filter
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    if (!searchProduct.trim()) return matchesCat;

    const normSearch = stripVietnamese(searchProduct);
    const normName = stripVietnamese(p.name);
    const normSku = p.sku.toLowerCase();
    const tokens = normSearch.split(/\s+/).filter(Boolean);
    const matchesSearch = tokens.every(tok => normName.includes(tok) || normSku.includes(tok));
    return matchesCat && matchesSearch;
  });

  // Auto adjust cost price and retail price when product changes
  const handleProductChange = (productId) => {
    setSelectedProductId(Number(productId));
    const prod = products.find(p => p.id === Number(productId));
    if (prod) {
      setCostPrice(prod.costPrice);
      setRetailPrice(prod.price);
      setNewRetailPrice(prod.price);
      setUpdateRetailPrice(false);
      const imp = new Date(importDate);
      imp.setDate(imp.getDate() + (prod.shelfLifeDays || 30));
      setExpiryDate(imp.toISOString().split('T')[0]);
    }
  };

  // Quick select an existing product from duplicate warning
  const handleSelectExistingProduct = (prod) => {
    setShowAddProductModal(false);
    setNewProdName('');
    setModalError('');
    setSelectedCategory('ALL');
    setSearchProduct('');
    handleProductChange(prod.id);
    setSuccessMsg(`Đã chọn sản phẩm "${prod.name}" từ danh mục để tiếp nhận lô hàng!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (new Date(expiryDate) <= new Date(importDate)) {
      setErrorMsg('Lỗi ràng buộc: Hạn sử dụng (EXP) bắt buộc phải lớn hơn Ngày nhập (Import Date)!');
      return;
    }

    if (quantity <= 0 || costPrice <= 0) {
      setErrorMsg('Số lượng nhập và giá vốn phải lớn hơn 0!');
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) {
      setErrorMsg('Vui lòng chọn một sản phẩm hợp lệ!');
      return;
    }

    setIsSubmitting(true);

    const newBatch = {
      id: Date.now(),
      productId: prod.id,
      productName: prod.name,
      batchCode: batchCode,
      importDate: importDate,
      expiryDate: expiryDate,
      initialQuantity: Number(quantity),
      quantity: Number(quantity),
      costPrice: Number(costPrice),
      status: 'SAFE',
      category: prod.category,
      updateSellingPrice: updateRetailPrice,
      sellingPrice: updateRetailPrice ? Number(newRetailPrice) : prod.price
    };

    try {
      const res = await onAddBatch(newBatch);
      if (res && res.success === false) {
        setErrorMsg(res.message || 'Lỗi ghi nhận lô hàng vào CSDL!');
      } else {
        const priceNotice = updateRetailPrice 
          ? ` và đồng bộ Giá bán lẻ POS thành ${Number(newRetailPrice).toLocaleString('vi-VN')} đ`
          : '';
        setSuccessMsg(`Tiếp nhận thành công Lô ${batchCode} cho sản phẩm "${prod.name}" (${quantity} ${prod.unit}, giá vốn ${Number(costPrice).toLocaleString('vi-VN')} đ/SP)${priceNotice}!`);
        setBatchCode(`BAT-DC-${Date.now().toString().slice(-6)}`);
      }
    } catch (err) {
      setErrorMsg(`Lỗi kết nối CSDL: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Save New Product to Database
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!newProdName.trim()) return;

    if (detectedDuplicate) {
      setModalError(`Sản phẩm này đã tồn tại hoặc gần giống với "${detectedDuplicate.name}" trong danh mục CSDL. Vui lòng chọn sản phẩm có sẵn!`);
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
        setModalError(res.message || 'Không thể thêm sản phẩm do lỗi kiểm tra từ hệ thống!');
        return;
      }

      setShowAddProductModal(false);
      setNewProdName('');
      setModalError('');
      setSuccessMsg(`Đã tạo thành công sản phẩm mới "${newProdName}" vào CSDL SQL Server!`);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '540px 1fr', gap: '24px', alignItems: 'start' }}>
      
      {/* Intake Form */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PackagePlus size={22} color="var(--safe-green)" />
              Tiếp Nhận Lô Hàng Từ Kho Tổng (DC)
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Danh mục hiện có: <strong style={{ color: 'var(--safe-green)' }}>{products.length} sản phẩm</strong> từ Kho tổng.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'var(--safe-green)', color: 'var(--safe-green)' }}
            onClick={() => setShowAddProductModal(true)}
            title="Thêm một sản phẩm mới toanh chưa có trong danh mục vào CSDL"
          >
            <PlusCircle size={14} /> Thêm SP mới
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '12px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '12px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Product Filter & Selection */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                Chọn Sản phẩm tiếp nhận ({filteredProducts.length} kết quả):
              </label>
            </div>

            {/* Quick Filters */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              <button
                type="button"
                className={`btn ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                onClick={() => setSelectedCategory('ALL')}
              >
                Tất cả
              </button>
              {categories.filter(c => c !== 'ALL').map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.7rem', padding: '3px 8px', whiteSpace: 'nowrap' }}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search within dropdown */}
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 12px 6px 30px', fontSize: '0.8rem' }}
                placeholder="Lọc nhanh (VD: sua vinamilk, banh mi, coca...)"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
              />
            </div>

            {/* Product Select Box */}
            <select 
              className="form-select"
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              size={5}
              style={{ maxHeight: '140px' }}
            >
              {filteredProducts.map(p => (
                <option key={p.id} value={p.id} style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  {p.image} {p.name} [{p.category}] - SKU: {p.sku} ({p.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Mã Lô hàng (In trên thùng/bao bì):
            </label>
            <input 
              type="text" 
              className="form-input"
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Ngày nhập hàng:
              </label>
              <input 
                type="date" 
                className="form-input"
                value={importDate}
                onChange={(e) => setImportDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Hạn sử dụng (EXP):
              </label>
              <input 
                type="date" 
                className="form-input"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Số lượng tiếp nhận ({selectedProd?.unit || 'Hộp'}):
            </label>
            <input 
              type="number" 
              className="form-input"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          {/* Pricing Architecture: Cost Price vs Retail POS Price */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--safe-green)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                💰 Hạch Toán: Giá Vốn Nhập Kho vs Giá Bán Lẻ POS
              </span>
              <span style={{ fontSize: '0.725rem', color: 'var(--safe-green)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                Đơn vị: VNĐ / {selectedProd?.unit || 'SP'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'start' }}>
              {/* Cost Price Card */}
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', padding: '10px' }}>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#60a5fa', marginBottom: '4px', display: 'block' }}>
                  1. Giá vốn nhập Lô này (Cost):
                </label>
                <input 
                  type="number" 
                  className="form-input"
                  min="500"
                  step="500"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  style={{ fontWeight: 700, color: '#ffffff', borderColor: '#3b82f6' }}
                  required
                />
                <span style={{ fontSize: '0.7rem', color: '#93c5fd', marginTop: '4px', display: 'block', lineHeight: '1.3' }}>
                  Tiền vốn cửa hàng trả cho Kho DC. Lưu riêng cho Lô {batchCode}.
                </span>
              </div>

              {/* Retail Selling Price Card */}
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '10px' }}>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#34d399', marginBottom: '4px', display: 'block' }}>
                  2. Giá bán lẻ niêm yết (POS):
                </label>
                <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', fontWeight: 800, color: 'var(--safe-green)', fontSize: '1rem' }}>
                  {updateRetailPrice ? Number(newRetailPrice).toLocaleString('vi-VN') : Number(retailPrice).toLocaleString('vi-VN')} đ
                </div>
                <span style={{ fontSize: '0.7rem', color: '#6ee7b7', marginTop: '4px', display: 'block', lineHeight: '1.3' }}>
                  Giá khách hàng chi trả khi quét mã thanh toán tại quầy POS.
                </span>
              </div>
            </div>

            {/* Price Decision Choices */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.785rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
                Bạn muốn áp dụng Giá bán lẻ tại quầy POS như thế nào?
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setUpdateRetailPrice(false)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: !updateRetailPrice ? '2px solid var(--safe-green)' : '1px solid var(--border-color)',
                    background: !updateRetailPrice ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.2)',
                    color: !updateRetailPrice ? '#ffffff' : 'var(--text-muted)',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.785rem', color: !updateRetailPrice ? 'var(--safe-green)' : 'inherit' }}>
                    ● Giữ nguyên giá bán {Number(retailPrice).toLocaleString('vi-VN')} đ
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Lãi: {(retailPrice - costPrice).toLocaleString('vi-VN')} đ/SP
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUpdateRetailPrice(true)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: updateRetailPrice ? '2px solid #38bdf8' : '1px solid var(--border-color)',
                    background: updateRetailPrice ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0,0,0,0.2)',
                    color: updateRetailPrice ? '#ffffff' : 'var(--text-muted)',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.785rem', color: updateRetailPrice ? '#38bdf8' : 'inherit' }}>
                    {updateRetailPrice ? '●' : '○'} Đổi Giá bán lẻ mới cho POS
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Đồng bộ giá mới sang quầy thu ngân
                  </div>
                </button>
              </div>

              {updateRetailPrice && (
                <div style={{ marginTop: '12px', background: 'rgba(56, 189, 248, 0.08)', padding: '12px', borderRadius: '8px', border: '1px dashed #38bdf8' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7dd3fc', display: 'block', marginBottom: '4px' }}>
                        Nhập Giá bán lẻ POS mới (VNĐ):
                      </label>
                      <input 
                        type="number"
                        className="form-input"
                        value={newRetailPrice}
                        onChange={(e) => setNewRetailPrice(e.target.value)}
                        min={costPrice}
                        step="500"
                        style={{ borderColor: '#38bdf8', fontWeight: 700 }}
                        required
                      />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Lãi gộp dự kiến: <strong style={{ color: 'var(--safe-green)' }}>{(Number(newRetailPrice) - Number(costPrice)).toLocaleString('vi-VN')} đ</strong>
                      <div>Biên LN: <strong style={{ color: '#ffffff' }}>{Number(newRetailPrice) > 0 ? (((Number(newRetailPrice) - Number(costPrice)) / Number(newRetailPrice)) * 100).toFixed(1) : 0}%</strong></div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '10px', lineHeight: '1.4' }}>
                💡 <em><strong>Kế toán FEFO:</strong> Khi bán hàng, các lô cũ (giá vốn cũ) luôn được tự động xuất bán trước. Khi hết lô cũ, hệ thống sẽ tự động trừ kho sang lô mới (giá vốn {Number(costPrice).toLocaleString('vi-VN')} đ).</em>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '4px', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>⏳ Đang ghi nhận vào SQL Server...</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ArrowDownToLine size={18} /> Xác Nhận Tiếp Nhận Lô Hàng Vào SQL
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Recent Intakes Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="var(--safe-green)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              Lịch Sử Các Đợt Hàng Nhập Gần Nhất
            </h3>
          </div>
          <span className="badge badge-safe">Live SQL Batches</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Mã Lô</th>
                <th>Sản Phẩm</th>
                <th>Ngày Nhập</th>
                <th>HSD</th>
                <th>Số Lượng</th>
                <th>Giá Vốn Lô</th>
                <th>Tổng Vốn</th>
              </tr>
            </thead>
            <tbody>
              {recentIntakes.map((b, idx) => (
                <tr key={idx} style={{ background: idx === 0 ? 'rgba(16, 185, 129, 0.06)' : 'transparent' }}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {b.batchCode}
                      {idx === 0 && (
                        <span className="badge badge-safe" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                          Mới nhập
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.productName}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{b.category}</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{b.importDate}</td>
                  <td style={{ color: 'var(--safe-green)', fontWeight: 600 }}>{b.expiryDate}</td>
                  <td><strong>{b.initialQuantity || b.quantity}</strong></td>
                  <td style={{ color: '#cbd5e1' }}>{Number(b.costPrice).toLocaleString('vi-VN')} đ</td>
                  <td style={{ fontWeight: 700, color: 'var(--safe-green)' }}>
                    {((b.initialQuantity || b.quantity) * b.costPrice).toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Product to System */}
      {showAddProductModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '24px', background: '#111827', border: '1px solid var(--safe-green)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={20} color="var(--safe-green)" />
                Thêm Sản Phẩm Mới Vào Danh Mục CSDL
              </h3>
              <button 
                onClick={() => setShowAddProductModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {modalError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '10px 14px', borderRadius: '10px', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> {modalError}
                </div>
              )}

              {detectedDuplicate && (
                <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '10px', padding: '12px 14px', color: '#fbbf24' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                    <AlertCircle size={18} color="#fbbf24" />
                    Sản phẩm này đã có sẵn trong danh mục CSDL!
                  </div>
                  <p style={{ margin: '0 0 10px 0', color: '#e2e8f0', fontSize: '0.8rem', lineHeight: '1.4' }}>
                    Tên bạn nhập trùng/gần giống với: <strong style={{ color: '#fbbf24' }}>"{detectedDuplicate.name}"</strong> (SKU: {detectedDuplicate.sku} - {detectedDuplicate.category}).
                    Bạn không cần tạo mới hay gõ lại chi tiết dung tích/thông số!
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '8px 12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => handleSelectExistingProduct(detectedDuplicate)}
                  >
                    👉 Chọn Ngay Sản Phẩm Này Để Nhập Lô Hàng
                  </button>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Tên sản phẩm:
                </label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="VD: Sữa chua phô mai Đà Lạt, Bánh mì kẹp..."
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Ngành hàng:
                  </label>
                  <select 
                    className="form-select"
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(Number(e.target.value))}
                  >
                    <option value={1}>Sữa & Chế phẩm</option>
                    <option value={2}>Bánh mì & Đồ ăn nhanh</option>
                    <option value={3}>Nước giải khát</option>
                    <option value={4}>Thực phẩm khô</option>
                    <option value={5}>Thực phẩm chế biến</option>
                    <option value={6}>Rau củ quả sạch</option>
                    <option value={7}>Thịt tươi mát</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Đơn vị tính:
                  </label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Hộp, Gói, Lon, Khay..."
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Giá vốn mua (VNĐ):
                  </label>
                  <input 
                    type="number"
                    className="form-input"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Giá bán niêm yết (VNĐ):
                  </label>
                  <input 
                    type="number"
                    className="form-input"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Hạn sử dụng tiêu chuẩn (Số ngày):
                </label>
                <input 
                  type="number"
                  className="form-input"
                  value={newProdShelfLife}
                  onChange={(e) => setNewProdShelfLife(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowAddProductModal(false);
                    setModalError('');
                  }}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ 
                    flex: 2,
                    opacity: detectedDuplicate ? 0.5 : 1,
                    cursor: detectedDuplicate ? 'not-allowed' : 'pointer'
                  }}
                  disabled={!!detectedDuplicate}
                  title={detectedDuplicate ? 'Sản phẩm tương tự đã có sẵn trong danh mục, không thể lưu trùng lặp' : 'Lưu sản phẩm mới vào SQL Server'}
                >
                  <Save size={16} /> Lưu Vào SQL Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
