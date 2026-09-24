import React, { useState } from 'react';
import { 
  Building2, 
  Sun, 
  CloudRain, 
  Calendar, 
  AlertTriangle, 
  UserCheck, 
  ShieldAlert, 
  Database,
  Bell,
  X,
  Zap,
  RotateCw,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function Header({ 
  currentRole, 
  setCurrentRole, 
  criticalCount, 
  weather, 
  setWeather,
  batches = [],
  onNavigateToFefo,
  onQuickDiscount,
  onRotateShelf
}) {
  const [showNotifModal, setShowNotifModal] = useState(false);

  const criticalBatches = batches.filter(b => 
    b.status === 'CRITICAL' || 
    (b.quantity > 0 && Math.ceil((new Date(b.expiryDate) - new Date('2026-09-24')) / (1000 * 3600 * 24)) <= 3)
  );
  return (
    <header className="glass-panel" style={{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderTop: 'none', padding: '14px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* System Title & Store */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
          }}>
            <Building2 size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                SUPPLY CHAIN SPOILAGE PREDICTOR
              </h1>
              <span className="badge badge-safe" style={{ fontSize: '0.65rem' }}>
                <Database size={10} /> LocalDB Active
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Cửa hàng: <strong style={{ color: '#ffffff' }}>VinMart+ LHU Store #01</strong> | GVHD: ThS. Lê Minh Nhật
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          
          {/* Weather & External Factors Simulator (Interactive Click to Toggle) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px 8px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            fontSize: '0.825rem'
          }}>
            {/* Weather Toggle Button */}
            <button
              onClick={() => {
                const nextCondition = weather.condition === 'SUNNY' ? 'RAINY' : weather.condition === 'RAINY' ? 'NORMAL' : 'SUNNY';
                const nextTemp = nextCondition === 'SUNNY' ? 34 : nextCondition === 'RAINY' ? 24 : 28;
                setWeather({ ...weather, condition: nextCondition, temp: nextTemp });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                border: 'none',
                color: weather.temp > 30 ? '#fbbf24' : weather.condition === 'RAINY' ? '#60a5fa' : '#34d399',
                cursor: 'pointer',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              title="Nhấp để chuyển đổi thời tiết (Nắng nóng -> Mưa bão -> Bình thường)"
            >
              {weather.condition === 'SUNNY' ? <Sun size={17} /> : weather.condition === 'RAINY' ? <CloudRain size={17} /> : <Sun size={17} />}
              <span>{weather.temp}°C {weather.condition === 'SUNNY' ? 'Nắng nóng (K=1.4)' : weather.condition === 'RAINY' ? 'Mưa bão (K=0.75)' : 'Mát mẻ (K=1.0)'}</span>
            </button>

            <div style={{ height: '14px', width: '1px', background: 'var(--border-color)' }}></div>

            {/* Holiday Toggle Button */}
            <button
              onClick={() => setWeather({ ...weather, isHoliday: !weather.isHoliday })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                border: 'none',
                color: weather.isHoliday ? '#f43f5e' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: weather.isHoliday ? 700 : 500,
                padding: '4px 8px',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              title="Nhấp để bật/tắt Ngày Lễ / Tết (Hệ số K=1.60)"
            >
              <Calendar size={14} />
              <span>{weather.isHoliday ? '🎉 Ngày Lễ (K=1.6)' : 'Ngày thường'}</span>
            </button>
          </div>

          {/* Critical Alert Counter & Notification Button */}
          {criticalCount > 0 && (
            <button
              onClick={() => setShowNotifModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                padding: '6px 14px',
                borderRadius: '12px',
                color: '#f87171',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                animation: 'pulse 2s infinite',
                transition: 'all 0.2s'
              }}
              title="Nhấn để xem danh sách thông báo chi tiết các sản phẩm sắp hết hạn và xử lý ngay"
            >
              <Bell size={16} color="#ef4444" />
              <span>{criticalCount} lô cận date khẩn cấp!</span>
            </button>
          )}

          {/* Quick Role Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '4px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => setCurrentRole('STORE_MANAGER')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.785rem',
                fontWeight: 700,
                background: currentRole === 'STORE_MANAGER' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                color: currentRole === 'STORE_MANAGER' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
              title="Đỗ Tấn Du - Toàn quyền quản trị, duyệt hủy hàng, xem KPI tài chính"
            >
              <UserCheck size={14} /> Cửa hàng trưởng (Du)
            </button>

            <button
              onClick={() => setCurrentRole('STORE_STAFF')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.785rem',
                fontWeight: 700,
                background: currentRole === 'STORE_STAFF' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'transparent',
                color: currentRole === 'STORE_STAFF' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
              title="Đoàn Minh Quân - Thao tác bán hàng POS, nhận hàng từ DC, lập phiếu hủy"
            >
              <ShieldAlert size={14} /> Thu ngân (Quân)
            </button>
          </div>

        </div>

      </div>

      {/* Notification Center Modal for Expiring Batches */}
      {showNotifModal && (
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
          zIndex: 99999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '640px', width: '100%', padding: '24px', background: '#111827', border: '1px solid #ef4444', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={20} color="#f87171" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    Trung Tâm Cảnh Báo Cận Date Tức Thời
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.775rem', color: '#f87171', fontWeight: 600 }}>
                    🚨 Phát hiện {criticalBatches.length} lô hàng có hạn sử dụng dưới 3 ngày!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNotifModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {criticalBatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--safe-green)' }}>
                  <CheckCircle2 size={36} style={{ margin: '0 auto 8px' }} />
                  <div>Tuyệt vời! Hiện không có lô hàng nào rơi vào vùng cận date đỏ.</div>
                </div>
              ) : (
                criticalBatches.map(b => {
                  const daysLeft = Math.ceil((new Date(b.expiryDate) - new Date('2026-09-24')) / (1000 * 3600 * 24));
                  return (
                    <div 
                      key={b.id}
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        padding: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>{b.productName}</span>
                          <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Mã: {b.batchCode}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '14px' }}>
                          <span>HSD: <strong style={{ color: '#f87171' }}>{b.expiryDate}</strong></span>
                          <span>Còn lại: <strong style={{ color: '#ef4444' }}>{daysLeft > 0 ? `${daysLeft} ngày` : 'Hôm nay!'}</strong></span>
                          <span>Tồn kho: <strong style={{ color: '#ffffff' }}>{b.quantity}</strong></span>
                        </div>
                        {b.isShelfRotated ? (
                          <div style={{ fontSize: '0.7rem', color: 'var(--safe-green)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> Đã xếp đầu kệ mặt tiền
                          </div>
                        ) : null}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          className="btn btn-warning"
                          style={{ fontSize: '0.725rem', padding: '5px 8px', opacity: b.isDiscounted ? 0.6 : 1 }}
                          onClick={() => {
                            if (onQuickDiscount) onQuickDiscount(b.id);
                          }}
                          disabled={b.isDiscounted}
                          title="Xả hàng giảm giá 30%"
                        >
                          <Zap size={13} /> {b.isDiscounted ? 'Đã giảm' : 'Giảm 30%'}
                        </button>

                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '0.725rem', padding: '5px 8px', color: b.isShelfRotated ? 'var(--safe-green)' : 'inherit' }}
                          onClick={() => {
                            if (onRotateShelf) onRotateShelf(b.id);
                          }}
                          title="Đảo ra vị trí đầu kệ"
                        >
                          <RotateCw size={13} /> {b.isShelfRotated ? 'Đã ở đầu kệ' : 'Đảo kệ'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                💡 Tự động kích hoạt khi hạn sử dụng còn ≤ 3 ngày
              </span>
              <button
                className="btn btn-primary"
                style={{ fontSize: '0.775rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setShowNotifModal(false);
                  if (onNavigateToFefo) onNavigateToFefo();
                }}
              >
                <span>Xem trên Bảng Giám sát FEFO</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
