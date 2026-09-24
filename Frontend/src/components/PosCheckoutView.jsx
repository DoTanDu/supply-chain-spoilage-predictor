import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle, 
  Sparkles, 
  CreditCard, 
  ShieldAlert, 
  Sun, 
  CloudRain 
} from 'lucide-react';

export default function PosCheckoutView({ 
  products, 
  batches, 
  onProcessSale, 
  weather 
}) {
  const [cart, setCart] = useState([]);
  const [lastReceipt, setLastReceipt] = useState(null);

  // Add product to cart
  const addToCart = (product) => {
    // Check available stock in non-expired batches
    const availableStock = batches
      .filter(b => b.productId === product.id && b.status !== 'EXPIRED')
      .reduce((sum, b) => sum + b.quantity, 0);

    const existing = cart.find(item => item.productId === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (currentQtyInCart + 1 > availableStock) {
      alert(`Không thể thêm vào giỏ! Tồn kho khả dụng chỉ còn ${availableStock} ${product.unit}.`);
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
        quantity: 1 
      }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    const availableStock = batches
      .filter(b => b.productId === productId && b.status !== 'EXPIRED')
      .reduce((sum, b) => sum + b.quantity, 0);

    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (delta > 0 && newQty > availableStock) {
          alert(`Không thể tăng thêm! Tồn kho khả dụng chỉ còn ${availableStock} ${item.unit}.`);
          return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Process FEFO sale
    const result = onProcessSale(cart, weather);
    if (result.success) {
      setLastReceipt(result);
      setCart([]);
    } else {
      alert(`Lỗi xuất bán: ${result.message}`);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
      
      {/* Product Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Banner */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={22} color="var(--safe-green)" />
              Quầy Bán Lẻ POS - Tự Động Trừ Kho FEFO
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Thu ngân quét mã → Hệ thống tự động phân bổ trừ kho vào các lô có hạn gần nhất trước.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Sparkles size={16} color="#fbbf24" />
            <span>Hệ số kích cầu hôm nay: <strong>{weather.temp > 30 ? 'K = 1.40 (Nắng nóng)' : 'K = 1.00'}</strong></span>
          </div>
        </div>

        {/* Product Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {products.map(prod => {
            const availableStock = batches
              .filter(b => b.productId === prod.id && b.status !== 'EXPIRED')
              .reduce((sum, b) => sum + b.quantity, 0);

            const isLowStock = availableStock <= prod.reorderPoint;

            return (
              <div 
                key={prod.id} 
                className="glass-panel glass-panel-interactive" 
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '2rem' }}>{prod.image}</span>
                    <span className={`badge ${availableStock === 0 ? 'badge-expired' : isLowStock ? 'badge-warning' : 'badge-safe'}`}>
                      Tồn: {availableStock} {prod.unit}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '10px 0 4px', lineHeight: '1.3' }}>
                    {prod.name}
                  </h3>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                    SKU: {prod.sku} | {prod.category}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--safe-green)' }}>
                      {prod.price.toLocaleString('vi-VN')} đ
                    </div>
                    <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Giá bán lẻ POS</span>
                  </div>

                  <div style={{ fontSize: '0.685rem', color: '#94a3b8', background: 'rgba(255,255,255,0.03)', padding: '3px 6px', borderRadius: '6px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    Giá vốn nhập DC: <strong style={{ color: '#cbd5e1' }}>{prod.costPrice ? prod.costPrice.toLocaleString('vi-VN') + ' đ' : 'N/A'}</strong> 
                    <span style={{ color: 'var(--safe-green)', marginLeft: '4px' }}>(Lãi: {(prod.price - (prod.costPrice || 0)).toLocaleString('vi-VN')} đ)</span>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
                    onClick={() => addToCart(prod)}
                    disabled={availableStock === 0}
                  >
                    <Plus size={16} /> Thêm vào đơn
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Cart & Checkout Panel */}
      <div className="glass-panel" style={{ padding: '20px', position: 'sticky', top: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={18} color="var(--safe-green)" />
            Giỏ Hàng Quầy Thu Ngân
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {cart.reduce((sum, i) => sum + i.quantity, 0)} món
          </span>
        </div>

        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Chưa có sản phẩm nào trong giỏ.<br/>Hãy chọn sản phẩm từ quầy để bán lẻ.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto' }}>
            {cart.map(item => (
              <div 
                key={item.productId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px'
                }}
              >
                <div style={{ flex: 1, marginRight: '10px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--safe-green)' }}>
                    {item.price.toLocaleString('vi-VN')} đ / {item.unit}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '4px', width: '26px', height: '26px' }}
                    onClick={() => updateQuantity(item.productId, -1)}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ fontWeight: 700, width: '20px', textAlign: 'center', fontSize: '0.875rem' }}>
                    {item.quantity}
                  </span>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '4px', width: '26px', height: '26px' }}
                    onClick={() => updateQuantity(item.productId, 1)}
                  >
                    <Plus size={12} />
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '4px', width: '26px', height: '26px', color: '#ef4444' }}
                    onClick={() => removeFromCart(item.productId)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total & Checkout */}
        {cart.length > 0 && (
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>Tạm tính:</span>
              <span>{calculateTotal().toLocaleString('vi-VN')} đ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>
              <span>Tổng thanh toán:</span>
              <span style={{ color: 'var(--safe-green)' }}>{calculateTotal().toLocaleString('vi-VN')} đ</span>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
              onClick={handleCheckout}
            >
              <CreditCard size={18} /> Thanh Toán & Trừ Kho FEFO
            </button>
          </div>
        )}

      </div>

      {/* FEFO Deduction Receipt Modal */}
      {lastReceipt && (
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
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--safe-green)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <CheckCircle size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Giao Dịch POS Bán Lẻ Thành Công!</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Hóa đơn: <strong>{lastReceipt.orderCode}</strong> | Ngày: 24/09/2026
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '14px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--safe-green)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ✓ Minh chứng Trừ Kho Thuật Toán FEFO:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lastReceipt.fefoDetails.map((det, idx) => (
                  <div key={idx} style={{ fontSize: '0.825rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
                    <span>
                      <strong>{det.productName}</strong><br/>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                        Lô: {det.batchCode} (HSD: {det.expiryDate})
                      </span>
                    </span>
                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>
                      -{det.deductedQty} {det.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '1.1rem', fontWeight: 800 }}>
              <span>Tổng tiền đã thu:</span>
              <span style={{ color: 'var(--safe-green)' }}>{lastReceipt.totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '10px' }}
              onClick={() => setLastReceipt(null)}
            >
              Hoàn tất giao dịch
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
