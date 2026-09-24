import React, { useState } from 'react';
import { PackagePlus, CheckCircle2, AlertCircle, ArrowDownToLine, History } from 'lucide-react';

export default function DcIntakeView({ products, onAddBatch, recentIntakes }) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 1);
  const [batchCode, setBatchCode] = useState(`BAT-DC-${Date.now().toString().slice(-6)}`);
  const [importDate, setImportDate] = useState('2026-09-24');
  const [expiryDate, setExpiryDate] = useState('2026-11-24');
  const [quantity, setQuantity] = useState(30);
  const [costPrice, setCostPrice] = useState(28000);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto adjust cost price when product changes
  const handleProductChange = (productId) => {
    setSelectedProductId(Number(productId));
    const prod = products.find(p => p.id === Number(productId));
    if (prod) {
      setCostPrice(prod.costPrice);
      // Auto estimate expiry date based on shelfLifeDays
      const imp = new Date(importDate);
      imp.setDate(imp.getDate() + prod.shelfLifeDays);
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
    setSuccessMsg(`Nhập thành công Lô ${batchCode} cho sản phẩm ${prod.name}!`);
    // Generate next batch code
    setBatchCode(`BAT-DC-${Date.now().toString().slice(-6)}`);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '480px 1fr', gap: '24px', alignItems: 'start' }}>
      
      {/* Intake Form */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackagePlus size={22} color="var(--safe-green)" />
            Tiếp Nhận Lô Hàng Từ Kho Tổng (DC)
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Ghi nhận đợt hàng mới từ xe tải DC về cửa hàng, tự động kích hoạt vòng đời FEFO.
          </p>
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
          
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Sản phẩm tiếp nhận:
            </label>
            <select 
              className="form-select"
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category}) - SKU: {p.sku}
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
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
          >
            <ArrowDownToLine size={18} /> Xác Nhận Tiếp Nhận Lô Hàng
          </button>
        </form>
      </div>

      {/* Recent Intakes Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <History size={18} color="var(--safe-green)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
            Lịch Sử Các Đợt Hàng Nhập Gần Nhất
          </h3>
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
                  <td style={{ fontWeight: 700 }}>{b.batchCode}</td>
                  <td>{b.productName}</td>
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

    </div>
  );
}
