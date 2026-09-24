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

export default function DcIntakeView({ 
  products, 
  onAddBatch, 
  onAddNewProduct, 
  recentIntakes 
}) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 1);
  const [batchCode, setBatchCode] = useState(`BAT-DC-${Date.now().toString().slice(-6)}`);
  const [importDate, setImportDate] = useState('2026-09-24');
  const [expiryDate, setExpiryDate] = useState('2026-11-24');
  const [quantity, setQuantity] = useState(30);
  const [costPrice, setCostPrice] = useState(28000);
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

  // Extract unique categories from products
  const categories = ['ALL', ...new Set(products.map(p => p.category))];

  // Filter products for dropdown
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchProduct.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchProduct.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Auto adjust cost price when product changes
  const handleProductChange = (productId) => {
    setSelectedProductId(Number(productId));
    const prod = products.find(p => p.id === Number(productId));
    if (prod) {
      setCostPrice(prod.costPrice);
      const imp = new Date(importDate);
      imp.setDate(imp.getDate() + (prod.shelfLifeDays || 30));
      setExpiryDate(imp.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = (e) => {
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
      category: prod.category
    };

    onAddBatch(newBatch);
    setSuccessMsg(`Nhập thành công Lô ${batchCode} cho sản phẩm ${prod.name} vào SQL Server!`);
    setBatchCode(`BAT-DC-${Date.now().toString().slice(-6)}`);
  };

  // Handle Save New Product to Database
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    if (onAddNewProduct) {
      await onAddNewProduct({
        name: newProdName.trim(),
        categoryId: Number(newProdCategory),
        unit: newProdUnit,
        costPrice: Number(newProdCost),
        sellingPrice: Number(newProdPrice),
        shelfLifeDays: Number(newProdShelfLife),
        minStock: 15
      });
      setShowAddProductModal(false);
      setNewProdName('');
      setSuccessMsg(`Đã tạo thành công sản phẩm mới "${newProdName}" vào CSDL SQL Server!`);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '520px 1fr', gap: '24px', alignItems: 'start' }}>
      
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
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '10px 14px', borderRadius: '10px', fontSize: '0.825rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '10px 14px', borderRadius: '10px', fontSize: '0.825rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {successMsg}
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
                placeholder="Lọc nhanh theo tên hoặc SKU..."
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Số lượng tiếp nhận:
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

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Giá vốn nhập (VNĐ):
              </label>
              <input 
                type="number" 
                className="form-input"
                min="1000"
                step="500"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '4px' }}
          >
            <ArrowDownToLine size={18} /> Xác Nhận Tiếp Nhận Lô Hàng Vào SQL
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
                <th>Tổng Tiền Vốn</th>
              </tr>
            </thead>
            <tbody>
              {recentIntakes.map((b, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: '#ffffff' }}>{b.batchCode}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.productName}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{b.category}</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{b.importDate}</td>
                  <td style={{ color: 'var(--safe-green)', fontWeight: 600 }}>{b.expiryDate}</td>
                  <td><strong>{b.initialQuantity || b.quantity}</strong></td>
                  <td>{((b.initialQuantity || b.quantity) * b.costPrice).toLocaleString('vi-VN')} đ</td>
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
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Tên sản phẩm:
                </label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="VD: Sữa chua phô mai Đà Lạt 100g..."
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
                  onClick={() => setShowAddProductModal(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 2 }}
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
