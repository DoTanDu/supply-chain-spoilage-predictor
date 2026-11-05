import React, { useState } from 'react';
import { 
  Building2, 
  Sun, 
  Moon,
  CloudRain, 
  Calendar, 
  Bell, 
  ChevronDown, 
  User, 
  Shield, 
  Store, 
  ShoppingCart, 
  Truck, 
  LogOut, 
  Database,
  Lock,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  X,
  Zap,
  RotateCw,
  ArrowRight,
  Cloud,
  Users
} from 'lucide-react';
import UserManagementModal from './UserManagementModal';
import ChangePasswordModal from './ChangePasswordModal';

export default function Header({ 
  currentUser, 
  currentRole, 
  onLogout,
  onSwitchUser,
  criticalCount = 0, 
  weather, 
  setWeather,
  batches = [],
  onNavigateToFefo,
  onQuickDiscount,
  onRotateShelf,
  storeProfile,
  onUpdateStoreStatus,
  onSyncWeather,
  isSyncingWeather = false,
  theme = 'light',
  onToggleTheme,
  onNavigateToUserManagement
}) {
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  // State quản lý trạng thái cửa hàng LHU Mart
  const [showStoreStatusModal, setShowStoreStatusModal] = useState(false);
  const [storeStatusUpdating, setStoreStatusUpdating] = useState(false);
  const [showWeatherMenu, setShowWeatherMenu] = useState(false);

  // States xác thực mật khẩu khi chuyển đổi ca trực
  const [switchTargetUser, setSwitchTargetUser] = useState(null);
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchLoading, setSwitchLoading] = useState(false);
  const [switchError, setSwitchError] = useState('');
  
  const currentStoreName = storeProfile?.storeName || 'Cửa hàng Bán lẻ Tiện lợi LHU Mart';
  const currentStoreStatus = storeProfile?.status || 'OPEN';
  const roleCode = currentRole?.toUpperCase() || 'STAFF';

  const getStoreStatusConfig = (status) => {
    switch (status) {
      case 'OPEN':
        return {
          label: 'Đang Mở Cửa',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.3)',
          dot: '#10b981',
          desc: 'Quầy POS xuất bán bình thường'
        };
      case 'CLOSED':
        return {
          label: 'Đóng Ca Đêm',
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.3)',
          dot: '#ef4444',
          desc: 'Tự động khóa thanh toán POS'
        };
      case 'INVENTORY':
        return {
          label: 'Kiểm Kê Kho',
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.1)',
          border: 'rgba(245, 158, 11, 0.3)',
          dot: '#f59e0b',
          desc: 'Tạm khóa POS để kiểm kê'
        };
      case 'SUSPENDED':
        return {
          label: 'Tạm Dừng',
          color: '#94a3b8',
          bg: 'rgba(148, 163, 184, 0.1)',
          border: 'rgba(148, 163, 184, 0.3)',
          dot: '#94a3b8',
          desc: 'Bảo trì kỹ thuật'
        };
      default:
        return {
          label: 'Đang Mở Cửa',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.3)',
          dot: '#10b981',
          desc: 'Quầy POS xuất bán bình thường'
        };
    }
  };

  const storeStatusConfig = getStoreStatusConfig(currentStoreStatus);

  // 3 Tài khoản chuẩn theo mô hình 3 Actor (Chủ chuỗi, Quản lý Cửa hàng, Nhân viên Cửa hàng)
  const quickDemoAccounts = [
    { username: 'admin', fullName: 'Quản trị viên (Admin)', roleCode: 'ADMIN', roleName: 'Chủ chuỗi / Quản trị viên', color: '#7c3aed' },
    { username: 'manager', fullName: 'Đỗ Tấn Du (Cửa Hàng Trưởng)', roleCode: 'STORE_MANAGER', roleName: 'Quản lý cửa hàng', color: '#4f46e5' },
    { username: 'cashier', fullName: 'Đoàn Minh Quân (Nhân Viên)', roleCode: 'CASHIER', roleName: 'Nhân viên cửa hàng (POS & Kho kệ)', color: '#2563eb' }
  ];

  const getRoleStyle = (code) => {
    switch (code) {
      case 'ADMIN': return { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe', icon: Shield };
      case 'STORE_MANAGER': return { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe', icon: Store };
      case 'CASHIER':
      case 'STAFF': return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', icon: ShoppingCart };
      default: return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', icon: User };
    }
  };

  const roleStyle = getRoleStyle(roleCode);
  const CurrentRoleIcon = roleStyle.icon;

  const criticalBatches = batches.filter(b => 
    b.alertColor === 'RED' || 
    b.status === 'CRITICAL' || 
    ((b.currentQuantity ?? b.quantity) > 0 && b.daysLeft !== undefined && b.daysLeft <= 3 && b.daysLeft > 0)
  );

  return (
    <header style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: 'var(--shadow-sm)',
      transition: 'background-color 0.2s ease, border-color 0.2s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        
        {/* Brand & Store Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)'
          }}>
            <Building2 size={22} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                LHU MART
              </span>

              {/* Status Badge: OPEN | CLOSED | INVENTORY | SUSPENDED */}
              <button
                type="button"
                onClick={() => {
                  if (roleCode === 'ADMIN' || roleCode === 'STORE_MANAGER') {
                    setShowStoreStatusModal(true);
                  }
                }}
                style={{
                  fontSize: '0.675rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: storeStatusConfig.bg,
                  color: storeStatusConfig.color,
                  border: `1px solid ${storeStatusConfig.border}`,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: (roleCode === 'ADMIN' || roleCode === 'STORE_MANAGER') ? 'pointer' : 'default',
                  transition: 'all 0.15s ease'
                }}
                title={(roleCode === 'ADMIN' || roleCode === 'STORE_MANAGER') ? "Cửa hàng trưởng: Bấm để đổi trạng thái cửa hàng" : `Trạng thái: ${storeStatusConfig.label}`}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: storeStatusConfig.dot }} />
                <span>{storeStatusConfig.label}</span>
                {(roleCode === 'ADMIN' || roleCode === 'STORE_MANAGER') && (
                  <ChevronDown size={10} style={{ marginLeft: '1px', opacity: 0.8 }} />
                )}
              </button>
            </div>
            
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '1px' }}>
              {storeProfile?.storeName || 'LHU Mart Bửu Long'} • Chuỗi 3 Chi Nhánh
            </div>
          </div>
        </div>

        {/* Center / Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Status Pill: Weather & Holiday */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-subtle)',
            padding: '4px 10px',
            borderRadius: '999px',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.785rem',
            position: 'relative'
          }}>
            {/* Weather Button & Live Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setShowWeatherMenu(!showWeatherMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '6px'
                }}
                title="Bấm để chọn kịch bản thời tiết hoặc xem dự báo Open-Meteo"
              >
                {weather?.condition === 'RAINY' ? <CloudRain size={16} color="#2563eb" /> : weather?.condition === 'SUNNY' ? <Sun size={16} color="#d97706" /> : <Cloud size={16} color="var(--text-muted)" />}
                <span>{weather?.temp || 30}°C</span>
                <span style={{
                  fontSize: '0.675rem',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: weather?.condition === 'RAINY' ? 'rgba(37, 99, 235, 0.12)' : weather?.condition === 'SUNNY' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                  color: weather?.condition === 'RAINY' ? '#2563eb' : weather?.condition === 'SUNNY' ? '#d97706' : 'var(--text-muted)',
                  fontWeight: 700
                }}>
                  {weather?.condition === 'RAINY' ? 'Mưa K=0.8' : weather?.condition === 'SUNNY' ? 'Nắng K=1.4' : 'K=1.0'}
                </span>
                <ChevronDown size={12} style={{ opacity: 0.6 }} />
              </button>

              {/* Nút đồng bộ thời tiết Open-Meteo API thời gian thực */}
              {onSyncWeather && (
                <button
                  type="button"
                  onClick={onSyncWeather}
                  disabled={isSyncingWeather}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: isSyncingWeather ? 'var(--accent-primary)' : 'var(--text-muted)',
                    cursor: isSyncingWeather ? 'wait' : 'pointer',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'all 0.15s ease'
                  }}
                  title="Đồng bộ ngay dữ liệu thời tiết thời gian thực từ Open-Meteo API TP. Biên Hòa"
                >
                  <RotateCw size={13} style={{ animation: isSyncingWeather ? 'spin 1s linear infinite' : 'none' }} />
                </button>
              )}
            </div>

            {/* Weather Dropdown Menu */}
            {showWeatherMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '6px',
                boxShadow: 'var(--shadow-card)',
                zIndex: 100,
                width: '260px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ padding: '6px 8px', fontSize: '0.72rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600 }}>
                  NGOẠI CẢNH THỜI TIẾT • TP. BIÊN HÒA
                </div>

                {onSyncWeather && (
                  <button
                    type="button"
                    onClick={() => { onSyncWeather(); setShowWeatherMenu(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'rgba(99, 102, 241, 0.08)',
                      color: 'var(--accent-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <RotateCw size={14} style={{ animation: isSyncingWeather ? 'spin 1s linear infinite' : 'none' }} />
                    <div>
                      <div>Đồng bộ Open-Meteo Realtime</div>
                      <span style={{ fontSize: '0.675rem', fontWeight: 400, opacity: 0.8 }}>Tọa độ 10.95°N, 106.84°E</span>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { setWeather({ ...weather, condition: 'SUNNY', temp: 34 }); setShowWeatherMenu(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: weather?.condition === 'SUNNY' ? 'rgba(217, 119, 6, 0.12)' : 'transparent',
                    color: weather?.condition === 'SUNNY' ? '#d97706' : 'var(--text-main)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Sun size={15} color="#d97706" />
                  <div>
                    <div>Nắng nóng 34°C (K=1.4)</div>
                    <span style={{ fontSize: '0.675rem', fontWeight: 400, color: 'var(--text-muted)' }}>Tăng tiêu thụ Nước giải khát +40%</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setWeather({ ...weather, condition: 'RAINY', temp: 24 }); setShowWeatherMenu(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: weather?.condition === 'RAINY' ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                    color: weather?.condition === 'RAINY' ? '#2563eb' : 'var(--text-main)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <CloudRain size={15} color="#2563eb" />
                  <div>
                    <div>Mưa mát 24°C (K=0.8)</div>
                    <span style={{ fontSize: '0.675rem', fontWeight: 400, color: 'var(--text-muted)' }}>Giảm lưu lượng khách -20%</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setWeather({ ...weather, condition: 'NORMAL', temp: 28 }); setShowWeatherMenu(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: weather?.condition === 'NORMAL' ? 'var(--bg-subtle)' : 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Cloud size={15} color="var(--text-muted)" />
                  <div>
                    <div>Thời tiết bình thường 28°C (K=1.0)</div>
                    <span style={{ fontSize: '0.675rem', fontWeight: 400, color: 'var(--text-muted)' }}>Mức tiêu chuẩn</span>
                  </div>
                </button>
              </div>
            )}

            <div style={{ height: '14px', width: '1px', background: 'var(--border-subtle)' }} />

            {/* Holiday Toggle Button */}
            <button
              onClick={() => {
                if (!setWeather) return;
                setWeather({ ...weather, isHoliday: !weather.isHoliday });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'transparent',
                border: 'none',
                color: weather?.isHoliday ? '#d97706' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '6px'
              }}
              title="Chuyển đổi ngày lễ (Bình thường -> Ngày Lễ)"
            >
              <Calendar size={14} />
              <span>{weather?.isHoliday ? 'Ngày Lễ (1.35x)' : 'Ngày thường'}</span>
            </button>
          </div>
          {/* Critical Alert Bell Button - Tinh gọn dạng Icon Chuông kèm Badge đè góc */}
          <button
            type="button"
            onClick={() => setShowNotifModal(true)}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: criticalCount > 0 ? 'var(--danger-red-bg)' : 'var(--bg-subtle)',
              border: `1px solid ${criticalCount > 0 ? 'var(--danger-red-border)' : 'var(--border-subtle)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: criticalCount > 0 ? 'var(--danger-red)' : 'var(--text-muted)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease'
            }}
            title={criticalCount > 0 ? `Có ${criticalCount} lô hàng cận date cần xử lý khẩn cấp` : 'Không có cảnh báo hạn dùng'}
            onMouseEnter={(e) => { e.currentTarget.style.background = criticalCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-subtle)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = criticalCount > 0 ? 'var(--danger-red-bg)' : 'var(--bg-subtle)'; }}
          >
            <Bell size={16} color={criticalCount > 0 ? 'var(--danger-red)' : 'var(--text-muted)'} />
            {criticalCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                minWidth: '17px',
                height: '17px',
                borderRadius: '999px',
                background: 'var(--danger-red)',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
                boxShadow: '0 0 6px rgba(239, 68, 68, 0.7)'
              }}>
                {criticalCount}
              </span>
            )}
          </button>

          {/* Admin User Management Quick Button - Tinh gọn */}
          {roleCode === 'ADMIN' && (
            <button
              type="button"
              onClick={() => setShowUserModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                padding: '5px 11px',
                borderRadius: '999px',
                color: '#7c3aed',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Quản trị nhân sự & Khóa / Mở khóa tài khoản"
            >
              <Users size={14} />
              <span>Nhân sự</span>
            </button>
          )}

          {/* User Profile & Role Switcher */}
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--bg-subtle)',
                padding: '5px 14px',
                borderRadius: '10px',
                border: `1px solid ${roleStyle.border}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Role Avatar */}
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                background: roleStyle.bg,
                border: `1px solid ${roleStyle.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: roleStyle.text
              }}>
                <CurrentRoleIcon size={16} />
              </div>

              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                  {(currentUser?.fullName || 'Người dùng').replace(/\s*\(.*?\)\s*/g, '')}
                </div>
                <div style={{ fontSize: '0.675rem', color: roleStyle.text, fontWeight: 600 }}>
                  {roleCode === 'ADMIN' ? 'Chủ chuỗi / Admin' : roleCode === 'STORE_MANAGER' ? 'Quản lý cửa hàng' : 'Nhân viên cửa hàng'}
                </div>
              </div>

              <ChevronDown size={14} color="var(--text-muted)" />
            </div>

            {/* Dropdown Menu for Switching Role / Logout */}
            {showUserDropdown && (
              <div style={{
                position: 'absolute',
                top: '115%',
                right: 0,
                width: '280px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-elevated)',
                padding: '10px',
                zIndex: 100
              }}>
                {/* Admin Management Option */}
                {roleCode === 'ADMIN' && (
                  <div style={{ padding: '0 0 8px 0', borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        setShowUserModal(true);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'rgba(124, 58, 237, 0.08)',
                        border: '1px solid rgba(124, 58, 237, 0.25)',
                        color: '#7c3aed',
                        cursor: 'pointer',
                        fontSize: '0.785rem',
                        fontWeight: 700
                      }}
                    >
                      <Users size={15} />
                      <span>Quản lý Nhân sự & Khóa</span>
                    </button>
                  </div>
                )}

                <div style={{ padding: '6px 8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Chuyển vai trò (Yêu cầu mật khẩu):
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '8px 0' }}>
                  {quickDemoAccounts.map(acc => {
                    const isCurrent = currentUser?.username === acc.username;
                    return (
                      <button
                        key={acc.username}
                        onClick={() => {
                          if (isCurrent) {
                            setShowUserDropdown(false);
                            return;
                          }
                          setShowUserDropdown(false);
                          setSwitchTargetUser(acc);
                          setSwitchPassword('');
                          setSwitchError('');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: isCurrent ? 'var(--primary-bg)' : 'transparent',
                          border: isCurrent ? '1px solid var(--primary-border)' : '1px solid transparent',
                          color: 'var(--text-main)',
                          cursor: isCurrent ? 'default' : 'pointer',
                          textAlign: 'left',
                          fontSize: '0.775rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{acc.fullName}</div>
                          <div style={{ fontSize: '0.675rem', color: acc.color }}>{acc.roleName}</div>
                        </div>
                        {isCurrent ? (
                          <CheckCircle2 size={14} color="var(--primary)" />
                        ) : (
                          <Lock size={12} color="var(--text-dim)" title="Yêu cầu mật khẩu" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowChangePasswordModal(true);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      fontSize: '0.785rem',
                      fontWeight: 600,
                      transition: 'all 0.15s ease'
                    }}
                    title="Đổi mật khẩu tài khoản đang đăng nhập"
                  >
                    <KeyRound size={14} color="var(--primary)" />
                    <span>Đổi mật khẩu tài khoản</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      if (onLogout) onLogout();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'var(--danger-red-bg)',
                      border: '1px solid var(--danger-red-border)',
                      color: 'var(--danger-red)',
                      cursor: 'pointer',
                      fontSize: '0.785rem',
                      fontWeight: 600
                    }}
                  >
                    <LogOut size={14} />
                    <span>Đăng xuất tài khoản</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Notification Center Modal */}
      {showNotifModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--modal-backdrop)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            padding: '24px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-elevated)',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--danger-red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={18} color="var(--danger-red)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    Cảnh Báo Cận Date Khẩn Cấp
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--danger-red)' }}>
                    Có {criticalBatches.length} lô hàng HSD ≤ 3 ngày cần xử lý
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNotifModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {criticalBatches.map(b => (
                <div key={b.id} style={{
                  background: 'var(--danger-red-bg)',
                  border: '1px solid var(--danger-red-border)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>{b.productName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Lô: <strong style={{ color: 'var(--text-main)' }}>{b.batchCode}</strong> • HSD: <strong style={{ color: 'var(--danger-red)' }}>{b.expiryDate}</strong> (Còn {b.daysLeft ?? 2} ngày)
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => { if (onQuickDiscount) onQuickDiscount(b.id); }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        background: 'var(--primary)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Zap size={12} style={{ display: 'inline', marginRight: '3px' }} /> Giảm 30%
                    </button>
                    <button
                      onClick={() => { if (onRotateShelf) onRotateShelf(b.id); }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <RotateCw size={12} style={{ display: 'inline', marginRight: '3px' }} /> Đảo Kệ
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowNotifModal(false);
                  if (onNavigateToFefo) onNavigateToFefo();
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.785rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Xem trên Bảng Giám Sát FEFO</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác thực Mật khẩu khi Chuyển đổi Ca trực */}
      {switchTargetUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--modal-backdrop)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-elevated)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
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
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    Xác thực Chuyển ca trực
                  </h3>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    Bảo mật quyền hạn ca trực (RBAC)
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSwitchTargetUser(null);
                  setSwitchPassword('');
                  setSwitchError('');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Tài khoản ca trực đích:
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {switchTargetUser.fullName}
              </div>
              <div style={{ fontSize: '0.75rem', color: switchTargetUser.color, fontWeight: 600, marginTop: '2px' }}>
                {switchTargetUser.roleName} (@{switchTargetUser.username})
              </div>
            </div>

            {switchError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'var(--danger-red-bg)',
                border: '1px solid var(--danger-red-border)',
                color: 'var(--danger-red)',
                fontSize: '0.775rem',
                marginBottom: '14px'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{switchError}</span>
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!switchPassword.trim()) {
                setSwitchError('Vui lòng nhập mật khẩu tài khoản đích.');
                return;
              }
              setSwitchLoading(true);
              setSwitchError('');
              try {
                const res = await onSwitchUser(switchTargetUser.username, switchPassword);
                if (res && res.success) {
                  setSwitchTargetUser(null);
                  setSwitchPassword('');
                } else {
                  setSwitchError(res?.message || 'Mật khẩu không chính xác.');
                }
              } catch (err) {
                setSwitchError(err.message || 'Lỗi kết nối máy chủ.');
              } finally {
                setSwitchLoading(false);
              }
            }}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Nhập mật khẩu tài khoản để xác nhận:
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Lock size={15} />
                  </div>
                  <input
                    type="password"
                    value={switchPassword}
                    onChange={(e) => setSwitchPassword(e.target.value)}
                    placeholder="Mật khẩu của tài khoản..."
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '8px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSwitchTargetUser(null);
                    setSwitchPassword('');
                    setSwitchError('');
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={switchLoading}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    background: switchLoading ? 'var(--text-dim)' : 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: switchLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {switchLoading ? 'Đang xác thực...' : 'Xác nhận chuyển'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chuyển Đổi Trạng Thái Cửa Hàng LHU Mart */}
      {showStoreStatusModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '460px',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={18} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Thiết Lập Trạng Thái Hoạt Động Cửa Hàng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStoreStatusModal(false)}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Chọn trạng thái vận hành của <strong>{currentStoreName}</strong>. Khi chuyển sang Đóng ca hoặc Kiểm kê, quầy POS sẽ tự động khóa xuất bán để bảo vệ an toàn dữ liệu tồn kho.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {[
                  {
                    status: 'OPEN',
                    label: 'Đang Mở Cửa (OPEN)',
                    sub: 'Cửa hàng hoạt động bình thường, cho phép quầy POS bán lẻ.',
                    color: '#10b981',
                    bg: 'rgba(16, 185, 129, 0.1)',
                    border: 'rgba(16, 185, 129, 0.3)'
                  },
                  {
                    status: 'CLOSED',
                    label: 'Đóng Ca Đêm (CLOSED)',
                    sub: 'Hết ca phục vụ. Quầy POS tự động khóa chức năng thanh toán.',
                    color: '#ef4444',
                    bg: 'rgba(239, 68, 68, 0.1)',
                    border: 'rgba(239, 68, 68, 0.3)'
                  },
                  {
                    status: 'INVENTORY',
                    label: 'Kiểm Kê Kho (INVENTORY)',
                    sub: 'Đang kiểm đếm hàng tồn. POS tạm khóa xuất bán tránh lệch kho.',
                    color: '#f59e0b',
                    bg: 'rgba(245, 158, 11, 0.1)',
                    border: 'rgba(245, 158, 11, 0.3)'
                  },
                  {
                    status: 'SUSPENDED',
                    label: 'Tạm Dừng Hoạt Động (SUSPENDED)',
                    sub: 'Bảo trì hệ thống hoặc sự cố cơ sở vật chất.',
                    color: '#94a3b8',
                    bg: 'rgba(148, 163, 184, 0.1)',
                    border: 'rgba(148, 163, 184, 0.3)'
                  }
                ].map((item) => {
                  const isCurrent = currentStoreStatus === item.status;
                  return (
                    <button
                      key={item.status}
                      type="button"
                      disabled={storeStatusUpdating}
                      onClick={async () => {
                        if (isCurrent) {
                          setShowStoreStatusModal(false);
                          return;
                        }
                        if (onUpdateStoreStatus) {
                          setStoreStatusUpdating(true);
                          await onUpdateStoreStatus(item.status);
                          setStoreStatusUpdating(false);
                          setShowStoreStatusModal(false);
                        }
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: `1.5px solid ${isCurrent ? item.color : 'var(--border-subtle)'}`,
                        background: isCurrent ? item.bg : 'var(--bg-secondary)',
                        cursor: storeStatusUpdating ? 'wait' : 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: isCurrent ? item.color : 'var(--text-main)' }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {item.sub}
                          </div>
                        </div>
                      </div>

                      {isCurrent && (
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: item.color,
                          color: '#ffffff',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          Hiện tại
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowStoreStatusModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal (RBAC - Khóa / Mở khóa tài khoản nhân viên) */}
      <UserManagementModal 
        isOpen={showUserModal} 
        onClose={() => setShowUserModal(false)} 
        currentUser={currentUser} 
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        currentUser={currentUser}
      />

    </header>
  );
}
