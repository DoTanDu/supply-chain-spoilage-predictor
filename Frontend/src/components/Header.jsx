import React from 'react';
import { 
  Building2, 
  Sun, 
  CloudRain, 
  Calendar, 
  AlertTriangle, 
  UserCheck, 
  ShieldAlert, 
  Database 
} from 'lucide-react';

export default function Header({ 
  currentRole, 
  setCurrentRole, 
  criticalCount, 
  weather, 
  setWeather 
}) {
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
          
          {/* Weather & External Factors Simulator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '6px 14px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            fontSize: '0.825rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: weather.temp > 30 ? '#fbbf24' : '#60a5fa' }}>
              {weather.condition === 'SUNNY' ? <Sun size={18} /> : <CloudRain size={18} />}
              <span style={{ fontWeight: 700 }}>{weather.temp}°C {weather.condition === 'SUNNY' ? 'Nắng nóng' : 'Mưa rào'}</span>
            </div>
            <div style={{ height: '14px', width: '1px', background: 'var(--border-color)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
              <Calendar size={14} />
              <span>{weather.isHoliday ? 'Ngày Lễ (K=1.6)' : 'Ngày thường (K=1.0)'}</span>
            </div>
          </div>

          {/* Critical Alert Counter */}
          {criticalCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              padding: '6px 14px',
              borderRadius: '12px',
              color: '#f87171',
              fontSize: '0.825rem',
              fontWeight: 700
            }}>
              <AlertTriangle size={16} />
              <span>{criticalCount} lô cận date khẩn cấp!</span>
            </div>
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
    </header>
  );
}
