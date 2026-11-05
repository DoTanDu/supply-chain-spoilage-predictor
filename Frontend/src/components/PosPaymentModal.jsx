import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle,
  X,
  Layers,
  Sparkles,
  Printer,
  RotateCw,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShoppingCart,
  Minus,
  Plus,
  Trash2
} from 'lucide-react';

export default function PosPaymentModal({
  isOpen,
  onClose,
  cart = [],
  totalAmount = 0,
  totalSavedAmount = 0,
  customerPaid,
  setCustomerPaid,
  onConfirmCheckout,
  isSubmitting = false,
  checkoutError = '',
  storeProfile = null,
  currentUser = null,
  allocateFefoPreview,
  updateQuantity,
  removeFromCart,
  clearCart,
  getAvailableStock
}) {
  if (!isOpen) return null;

  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'VIETQR'
  const cashInputRef = useRef(null);

  const customerPaidNumber = Number(String(customerPaid).replace(/\D/g, '')) || 0;
  const changeDue = customerPaidNumber >= totalAmount ? customerPaidNumber - totalAmount : 0;
  const shortageAmount = customerPaidNumber > 0 && customerPaidNumber < totalAmount ? totalAmount - customerPaidNumber : 0;
  const totalItemsCount = cart.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    // Focus vào ô nhập tiền khi mở modal ở chế độ tiền mặt
    if (paymentMethod === 'CASH') {
      setTimeout(() => {
        if (cashInputRef.current) {
          cashInputRef.current.focus();
          cashInputRef.current.select();
        }
      }, 100);
    }
  }, [paymentMethod]);

  // Lắng nghe phím tắt trong modal (Enter để xác nhận, Esc để đóng, F8 đủ tiền)
  useEffect(() => {
    const handleModalKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        setCustomerPaid(totalAmount);
        return;
      }
      if (e.key === 'Enter' && !isSubmitting && cart.length > 0) {
        // Nếu ở tiền mặt và khách đưa đủ hoặc bằng QR code -> xác nhận
        if (paymentMethod === 'VIETQR' || customerPaidNumber >= totalAmount || customerPaidNumber === 0) {
          e.preventDefault();
          onConfirmCheckout();
        }
      }
    };
    window.addEventListener('keydown', handleModalKeyDown);
    return () => window.removeEventListener('keydown', handleModalKeyDown);
  }, [customerPaidNumber, totalAmount, paymentMethod, isSubmitting, onConfirmCheckout, onClose, setCustomerPaid, cart.length]);

  // Sinh link mã VietQR động chuẩn Napas247
  const vietQrUrl = `https://api.vietqr.io/image/970422-0901234567-compact2.jpg?amount=${totalAmount}&addInfo=${encodeURIComponent(`LHU MART POS ${Date.now().toString().slice(-4)}`)}&accountName=${encodeURIComponent('LHU MART RETAIL')}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99990,
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '840px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--border-subtle)',
          overflow: 'hidden',
          animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--primary-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                border: '1px solid var(--primary-border)'
              }}
            >
              <ShoppingCart size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  Hóa Đơn Giỏ Hàng & Thanh Toán POS
                </h2>
                <span style={{ fontSize: '0.675rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', background: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid var(--primary-border)' }}>
                  Xuất kho FEFO
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Thu ngân: <strong>{currentUser?.fullName || 'Thu ngân LHU'}</strong> • Cửa hàng: {storeProfile?.storeCode || 'RETAIL-STORE-01'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {cart.length > 0 && clearCart && (
              <button
                type="button"
                onClick={clearCart}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger-red)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
                title="Xóa toàn bộ giỏ hàng"
              >
                Xóa Hết
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Đóng cửa sổ (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Thân Modal: Bố cục 2 cột cân đối */}
        <div
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '18px',
            alignItems: 'start'
          }}
        >
          {/* CỘT 1: QUẢN LÝ GIỎ HÀNG & PHÂN BỔ BẺ LÔ FEFO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Danh Sách Sản Phẩm ({totalItemsCount} món):
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Bóc tách lô tự động theo FEFO
              </span>
            </div>

            {/* Danh Sách Món Trong Giỏ Hàng Có Bộ Tăng/Giảm/Xóa */}
            <div
              style={{
                maxHeight: '380px',
                overflowY: 'auto',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                background: 'var(--bg-subtle)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {cart.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 10px',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <ShoppingCart size={32} style={{ opacity: 0.3 }} />
                  <div>Chưa có sản phẩm nào trong giỏ hàng.</div>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      marginTop: '6px',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: '1px solid var(--primary-border)',
                      background: 'var(--primary-bg)',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ← Quay lại chọn sản phẩm
                  </button>
                </div>
              ) : (
                cart.map(item => {
                  const fefoAlloc = allocateFefoPreview ? allocateFefoPreview(item.productId, item.quantity, item.price) : { allocations: [], totalAmount: item.price * item.quantity };
                  const maxStock = getAvailableStock ? getAvailableStock(item.productId) : 999;
                  const isMax = item.quantity >= maxStock;

                  return (
                    <div
                      key={item.productId}
                      style={{
                        padding: '10px',
                        borderRadius: '9px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', marginTop: '2px' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                              {(fefoAlloc.totalAmount || item.price * item.quantity).toLocaleString('vi-VN')} đ
                            </span>
                            {fefoAlloc.totalSaved > 0 && (
                              <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', fontSize: '0.675rem' }}>
                                {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                              </span>
                            )}
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.675rem' }}>
                              ({item.price.toLocaleString('vi-VN')}đ/{item.unit})
                            </span>
                          </div>
                        </div>

                        {/* Bộ Tăng Giảm & Xóa */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {updateQuantity && (
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, -1)}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '5px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Minus size={11} />
                            </button>
                          )}

                          <span className="num-tabular" style={{ width: '26px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {item.quantity}
                          </span>

                          {updateQuantity && (
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, 1)}
                              disabled={isMax}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '5px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-main)',
                                cursor: isMax ? 'not-allowed' : 'pointer',
                                opacity: isMax ? 0.35 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Plus size={11} />
                            </button>
                          )}

                          {removeFromCart && (
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.productId)}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '5px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-subtle)',
                                color: 'var(--danger-red)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: '2px'
                              }}
                              title="Xóa món"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Các lô bẻ FEFO */}
                      {fefoAlloc.allocations && fefoAlloc.allocations.length > 0 && (
                        <div style={{
                          background: 'var(--bg-subtle)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          border: '1px dashed var(--border-subtle)',
                          fontSize: '0.675rem'
                        }}>
                          {fefoAlloc.isSplitOrder && (
                            <div style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                              <Layers size={10} />
                              <span>Tự động bẻ đơn qua {fefoAlloc.allocations.length} lô</span>
                            </div>
                          )}
                          {fefoAlloc.allocations.map((alloc, aIdx) => (
                            <div
                              key={aIdx}
                              style={{
                                fontSize: '0.675rem',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '1px'
                              }}
                            >
                              <span>
                                • Lô <strong>{alloc.batchCode}</strong> (HSD: {String(alloc.expiryDate || '').slice(0, 10)})
                                {alloc.discountPercent > 0 && (
                                  <strong style={{ color: '#d97706', marginLeft: '4px' }}>[-{alloc.discountPercent}%]</strong>
                                )}
                              </span>
                              <span className="num-tabular" style={{ fontWeight: 600 }}>
                                {alloc.quantityAllocated} {item.unit} × {alloc.unitPrice.toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CỘT 2: PHƯƠNG THỨC THANH TOÁN & BỘ TÍNH TIỀN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Hộp Tổng Tiền Lớn */}
            <div
              style={{
                background: 'var(--primary-bg)',
                border: '1px solid var(--primary-border)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Tổng Tiền Cần Thanh Toán (FEFO)
              </div>
              <div
                className="num-tabular"
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  color: 'var(--primary)',
                  margin: '3px 0',
                  letterSpacing: '-0.02em'
                }}
              >
                {totalAmount.toLocaleString('vi-VN')} <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>đ</span>
              </div>
              {totalSavedAmount > 0 && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#d97706',
                    background: 'rgba(217, 119, 6, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}
                >
                  <Sparkles size={11} />
                  <span>Tiết kiệm xả hàng: -{totalSavedAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
            </div>

            {/* Lựa chọn phương thức thanh toán */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                borderRadius: '9px',
                padding: '3px',
                display: 'flex',
                gap: '6px',
                border: '1px solid var(--border-color)'
              }}
            >
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  background: paymentMethod === 'CASH' ? 'var(--primary)' : 'transparent',
                  color: paymentMethod === 'CASH' ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.785rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Banknote size={15} />
                <span>Tiền Mặt</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('VIETQR')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  background: paymentMethod === 'VIETQR' ? '#0284c7' : 'transparent',
                  color: paymentMethod === 'VIETQR' ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.785rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <QrCode size={15} />
                <span>VietQR Napas247</span>
              </button>
            </div>

            {/* TAB TIỀN MẶT */}
            {paymentMethod === 'CASH' && (
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    💵 Tiền khách đưa:
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomerPaid(totalAmount)}
                    style={{
                      background: 'var(--primary-bg)',
                      border: '1px solid var(--primary-border)',
                      borderRadius: '5px',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Đủ tiền [F8] ({totalAmount.toLocaleString('vi-VN')}đ)
                  </button>
                </div>

                <input
                  ref={cashInputRef}
                  type="text"
                  value={customerPaid ? Number(String(customerPaid).replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setCustomerPaid(val);
                  }}
                  placeholder="Nhập số tiền mặt khách đưa..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />

                {/* Các nút mệnh giá nhanh */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[50000, 100000, 200000, 500000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCustomerPaid(amt)}
                      style={{
                        padding: '6px 2px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>

                {/* Khung hiển thị Tiền Thừa / Thiếu */}
                <div
                  style={{
                    marginTop: '2px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: customerPaidNumber >= totalAmount
                      ? 'var(--safe-green-bg)'
                      : (shortageAmount > 0 ? 'var(--warning-yellow-bg)' : 'var(--bg-surface)'),
                    border: '1px solid',
                    borderColor: customerPaidNumber >= totalAmount
                      ? 'var(--safe-green-border)'
                      : (shortageAmount > 0 ? 'var(--warning-yellow-border)' : 'var(--border-subtle)'),
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Tiền thối lại khách:
                  </span>
                  {customerPaidNumber >= totalAmount ? (
                    <span className="num-tabular" style={{ fontWeight: 900, color: 'var(--safe-green)', fontSize: '1.1rem' }}>
                      {changeDue.toLocaleString('vi-VN')} đ
                    </span>
                  ) : shortageAmount > 0 ? (
                    <span className="num-tabular" style={{ fontWeight: 800, color: 'var(--warning-yellow)', fontSize: '0.825rem' }}>
                      Khách còn thiếu: {shortageAmount.toLocaleString('vi-VN')} đ
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.725rem' }}>
                      Chưa nhập tiền mặt
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* TAB CHUYỂN KHOẢN VIETQR */}
            {paymentMethod === 'VIETQR' && (
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '6px'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
                  Quét mã Napas247 VietQR bằng ứng dụng Ngân hàng / MoMo
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    padding: '6px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <img
                    src={vietQrUrl}
                    alt="Mã QR Napas247 VietQR"
                    style={{ width: '150px', height: '150px', display: 'block', borderRadius: '6px' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Số tiền chuyển khoản: <strong style={{ color: '#0284c7' }}>{totalAmount.toLocaleString('vi-VN')} đ</strong>
                </div>
              </div>
            )}

            {/* Thông báo lỗi nếu có */}
            {checkoutError && (
              <div
                style={{
                  background: 'var(--danger-red-bg)',
                  border: '1px solid var(--danger-red-border)',
                  color: 'var(--danger-red)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <AlertTriangle size={15} flexShrink={0} />
                <span>{checkoutError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Modal: Nút Thao Tác Hoàn Tất */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ← Tiếp Tục Chọn Món
          </button>

          <button
            type="button"
            onClick={onConfirmCheckout}
            disabled={isSubmitting || cart.length === 0}
            style={{
              padding: '8px 24px',
              borderRadius: '8px',
              border: 'none',
              background: cart.length === 0 ? 'var(--text-dim)' : 'var(--primary)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: (isSubmitting || cart.length === 0) ? 'not-allowed' : 'pointer',
              opacity: (isSubmitting || cart.length === 0) ? 0.6 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {isSubmitting ? (
              <>
                <RotateCw size={16} className="animate-spin" />
                <span>Đang xuất kho FEFO...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>Xác Nhận & In Hóa Đơn (Enter)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
