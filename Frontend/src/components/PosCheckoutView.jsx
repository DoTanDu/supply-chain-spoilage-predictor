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
  CloudRain,
  Search,
  AlertTriangle,
  X,
  Receipt,
  RotateCw,
  PackageX
} from 'lucide-react';

// Helper: Normalize Vietnamese strings without diacritics
function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

export default function PosCheckoutView({ 
  products, 
  batches, 
  onProcessSale, 
  weather 
}) {
  const [cart, setCart] = useState([]);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Extract categories for filter
  const categories = ['ALL', ...new Set(products.map(p => p.category))];

  // Helper: compute unexpired available stock for a product
  const getAvailableStock = (productId) => {
    return batches
      .filter(b => b.productId === productId && b.status !== 'EXPIRED' && b.quantity > 0)
      .reduce((sum, b) => sum + b.quantity, 0);
  };

  // Add product to cart
  const addToCart = (product) => {
    setCheckoutError('');
    const availableStock = getAvailableStock(product.id);

    if (availableStock <= 0) {
      setCheckoutError(`Sản phẩm "${product.name}" hiện đã HẾT HÀNG trong kho (Tồn: 0)!`);
      return;
    }

    const existing = cart.find(item => item.productId === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (currentQtyInCart + 1 > availableStock) {
      setCheckoutError(`Không thể thêm vào giỏ! Tồn kho khả dụng của "${product.name}" chỉ còn ${availableStock} ${product.unit}.`);
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
    setCheckoutError('');
    const availableStock = getAvailableStock(productId);

    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (delta > 0 && newQty > availableStock) {
          setCheckoutError(`Không thể tăng thêm! Tồn kho khả dụng của "${item.name}" chỉ còn ${availableStock} ${item.unit}.`);
          return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCheckoutError('');
    setCart(cart.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Check if cart has any item that is invalid (0 stock or exceeds stock)
  const cartIssues = cart.map(item => {
    const stock = getAvailableStock(item.productId);
    if (stock <= 0) {
      return { item, issue: 'ZERO_STOCK', message: `Đã hết hàng (Tồn: 0 ${item.unit})` };
    }
    if (item.quantity > stock) {
      return { item, issue: 'OVER_STOCK', message: `Vượt tồn kho (Cần ${item.quantity}, còn ${stock} ${item.unit})` };
    }
    return null;
  }).filter(Boolean);

  const hasStockError = cartIssues.length > 0;

  // Execute checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutError('');

    // Pre-check stock
    if (hasStockError) {
      const issueDetails = cartIssues.map(ci => `"${ci.item.name}": ${ci.message}`).join(', ');
      setCheckoutError(`Thanh toán thất bại! Lý do thiếu hàng trong kho: ${issueDetails}. Vui lòng xóa bớt hoặc giảm số lượng.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onProcessSale(cart, weather);
      if (result && result.success) {
        setLastReceipt(result);
        setCart([]);
        setCheckoutError('');
      } else {
        setCheckoutError(result?.message || 'Có lỗi xảy ra trong quá trình xuất kho FEFO.');
      }
    } catch (err) {
      setCheckoutError(err.message || 'Lỗi kết nối máy chủ thanh toán.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    if (!searchQuery.trim()) return matchesCat;

    const normSearch = stripVietnamese(searchQuery);
    const normName = stripVietnamese(p.name);
    const normSku = (p.sku || '').toLowerCase();
    const tokens = normSearch.split(/\s+/).filter(Boolean);

    const matchesSearch = tokens.every(tok => normName.includes(tok) || normSku.includes(tok));
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', alignItems: 'start' }}>
      
      {/* Product Grid & Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Banner */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={22} color="var(--safe-green)" />
              Quầy Bán Lẻ POS - Tự Động Trừ Kho FEFO
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Thu ngân quét mã hoặc chọn món → Hệ thống tự động phân bổ trừ kho vào các lô có hạn gần nhất trước.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Sparkles size={16} color="#fbbf24" />
            <span>Hệ số kích cầu hôm nay: <strong>{weather.temp > 30 ? 'K = 1.40 (Nắng nóng)' : 'K = 1.00'}</strong></span>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '36px', height: '40px', fontSize: '0.875rem' }}
              placeholder="Tìm nhanh sản phẩm theo tên hoặc mã SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '11px' }} />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <select
            className="form-select"
            style={{ width: '180px', height: '40px', fontSize: '0.85rem' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'Tất cả ngành hàng' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Product Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {filteredProducts.map(prod => {
            const availableStock = getAvailableStock(prod.id);
            const isLowStock = availableStock > 0 && availableStock <= prod.reorderPoint;
            const isOutOfStock = availableStock === 0;

            return (
              <div 
                key={prod.id} 
                className="glass-panel glass-panel-interactive" 
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  opacity: isOutOfStock ? 0.75 : 1,
                  border: isOutOfStock ? '1px dashed rgba(239, 68, 68, 0.4)' : undefined
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '2rem' }}>{prod.image}</span>
                    <span className={`badge ${isOutOfStock ? 'badge-expired' : isLowStock ? 'badge-warning' : 'badge-safe'}`}>
                      {isOutOfStock ? 'Hết hàng (Tồn: 0)' : `Tồn: ${availableStock} ${prod.unit}`}
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
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isOutOfStock ? 'var(--text-dim)' : 'var(--safe-green)' }}>
                      {prod.price.toLocaleString('vi-VN')} đ
                    </div>
                    <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Giá bán lẻ POS</span>
                  </div>

                  <div style={{ fontSize: '0.685rem', color: '#94a3b8', background: 'rgba(255,255,255,0.03)', padding: '3px 6px', borderRadius: '6px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    Giá vốn nhập: <strong style={{ color: '#cbd5e1' }}>{prod.costPrice ? prod.costPrice.toLocaleString('vi-VN') + ' đ' : 'N/A'}</strong>
                  </div>

                  <button
                    className={`btn ${isOutOfStock ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
                    onClick={() => addToCart(prod)}
                    disabled={isOutOfStock}
                  >
                    {isOutOfStock ? (
                      <>
                        <PackageX size={15} /> Tạm hết hàng
                      </>
                    ) : (
                      <>
                        <Plus size={16} /> Thêm vào đơn
                      </>
                    )}
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

        {/* Global Checkout Error Banner */}
        {checkoutError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '14px',
            fontSize: '0.825rem',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'start',
            gap: '8px'
          }}>
            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', color: '#ffffff', marginBottom: '2px' }}>Không thể thanh toán!</strong>
              <span>{checkoutError}</span>
            </div>
            <button
              onClick={() => setCheckoutError('')}
              style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Chưa có sản phẩm nào trong giỏ.<br/>Hãy chọn sản phẩm từ quầy để bán lẻ.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
            {cart.map(item => {
              const currentStock = getAvailableStock(item.productId);
              const isItemOutOfStock = currentStock === 0;
              const isItemOverStock = item.quantity > currentStock;

              return (
                <div 
                  key={item.productId}
                  style={{
                    padding: '10px',
                    background: (isItemOutOfStock || isItemOverStock) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: (isItemOutOfStock || isItemOverStock) ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                    borderRadius: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                        disabled={item.quantity >= currentStock}
                      >
                        <Plus size={12} />
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px', width: '26px', height: '26px', color: '#ef4444' }}
                        onClick={() => removeFromCart(item.productId)}
                        title="Xóa khỏi giỏ"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Warning on item if stock issue */}
                  {isItemOutOfStock && (
                    <div style={{ fontSize: '0.725rem', color: '#ef4444', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} /> Đã hết hàng trong kho (Tồn: 0)! Vui lòng xóa món này.
                    </div>
                  )}

                  {!isItemOutOfStock && isItemOverStock && (
                    <div style={{ fontSize: '0.725rem', color: '#fbbf24', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} /> Vượt tồn kho khả dụng! Hiện chỉ còn {currentStock} {item.unit}.
                    </div>
                  )}
                </div>
              );
            })}
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

            {hasStockError && (
              <div style={{ fontSize: '0.75rem', color: '#ef4444', textAlign: 'center', marginBottom: '10px', fontWeight: 600 }}>
                ⚠️ Không thể thanh toán do có sản phẩm hết hàng hoặc số lượng vượt tồn kho.
              </div>
            )}

            <button 
              className="btn btn-primary" 
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem',
                opacity: (hasStockError || isSubmitting) ? 0.6 : 1,
                cursor: (hasStockError || isSubmitting) ? 'not-allowed' : 'pointer'
              }}
              onClick={handleCheckout}
              disabled={hasStockError || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RotateCw size={18} className="animate-spin" /> Đang hạch toán FEFO vào SQL...
                </>
              ) : (
                <>
                  <CreditCard size={18} /> Thanh Toán & Trừ Kho FEFO
                </>
              )}
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
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '24px', background: '#111827', border: '1px solid var(--safe-green)', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--safe-green)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <CheckCircle size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Thanh Toán Bán Lẻ Thành Công!</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Mã giao dịch: <strong style={{ color: 'var(--safe-green)' }}>{lastReceipt.orderCode}</strong> | Ngày: 24/09/2026
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '14px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--safe-green)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ✓ Minh chứng Trừ Kho Thuật Toán FEFO (First Expired, First Out):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {lastReceipt.fefoDetails && lastReceipt.fefoDetails.length > 0 ? (
                  lastReceipt.fefoDetails.map((det, idx) => (
                    <div key={idx} style={{ fontSize: '0.825rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
                      <span>
                        <strong>{det.productName}</strong><br/>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                          Lô xuất: {det.batchCode} (HSD: {det.expiryDate})
                        </span>
                      </span>
                      <span style={{ fontWeight: 700, color: '#f59e0b' }}>
                        -{det.deductedQty} {det.unit}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Đã phân bổ trừ kho thành công vào CSDL SQL Server.</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '1.1rem', fontWeight: 800 }}>
              <span>Tổng tiền đã thu:</span>
              <span style={{ color: 'var(--safe-green)' }}>{lastReceipt.totalAmount?.toLocaleString('vi-VN')} đ</span>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '10px' }}
              onClick={() => setLastReceipt(null)}
            >
              Hoàn tất & In Hóa đơn
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
