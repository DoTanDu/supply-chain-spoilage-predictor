// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import {
  Building2,
  Sun,
  CloudRain,
  Cloud,
  Calendar,
  Bell,
  ChevronDown,
  Shield,
  Store,
  User,
  LogOut,
  Lock,
  CheckCircle2,
  KeyRound,
  RotateCw,
  Menu,
  ArrowRight,
  Zap,
  TrendingUp,
  MapPin,
  Droplets,
  Wind
} from 'lucide-react';
import ModalDialog from './ui/ModalDialog';
import ChangePasswordModal from './ChangePasswordModal';
import { MENU_CONFIG } from './Sidebar';
import { canAccessPage, normalizeRole } from '../utils/pagePermissions';

function getShortBranchLocation(profile) {
  const addr = String(profile?.address || '').trim();
  const addrMatch = addr.match(/(?:P\.|Phường|Xã|Thị trấn|Quận|Q\.)\s*([^,]+)/i);
  if (addrMatch && addrMatch[1]) {
    return addrMatch[1].trim();
  }
  const name = String(profile?.storeName || '').trim();
  const nameMatch = name.match(/Chi nhánh\s+([^(-]+)/i);
  if (nameMatch && nameMatch[1]) {
    return nameMatch[1].trim();
  }
  return '';
}

export default function Header({
  currentUser,
  currentRole,
  activeTab,
  onSelectTab,
  onLogout,
  onSwitchUser,
  criticalCount = 0,
  weather,
  setWeather,
  batches = [],
  storeProfile,
  enterpriseConfig = null,
  storesList = [],
  selectedStoreId = 'ALL',
  onSelectStore,
  isSingleStore = false,
  onSyncWeather,
  onUseDeviceLocation,
  isSyncingWeather = false,
  onQuickDiscount,
  onRotateShelf
}) {
  const roleCode = normalizeRole(currentRole || currentUser?.roleCode);
  const isOwner = roleCode === 'ADMIN';

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showWeatherMenu, setShowWeatherMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const [switchTargetUser, setSwitchTargetUser] = useState(null);
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchLoading, setSwitchLoading] = useState(false);
  const [switchError, setSwitchError] = useState('');

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const closeMenus = () => {
      setShowUserDropdown(false);
      setShowWeatherMenu(false);
    };
    window.addEventListener('click', closeMenus);
    return () => window.removeEventListener('click', closeMenus);
  }, []);

  const chainStoreCount = Number(storeProfile?.chainStoreCount || 0);
  const listActiveCount = storesList.filter(s => String(s.status || 'OPEN').toUpperCase() !== 'SUSPENDED').length;
  const activeStoresCount = chainStoreCount > 0 ? chainStoreCount : (listActiveCount || (isSingleStore ? 1 : 3));

  const parsedSelected = Number(selectedStoreId);
  const contextStoreId = isOwner
    ? (selectedStoreId && selectedStoreId !== 'ALL' && Number.isInteger(parsedSelected) && parsedSelected > 0 ? parsedSelected : 1)
    : Number(currentUser?.storeId || 1);

  const branchAccountsByStore = {
    1: {
      manager: { username: 'manager', fullName: 'Đỗ Tấn Du (MANAGER)', roleName: 'Quản lý CN #1' },
      staff: { username: 'cashier', fullName: 'Đoàn Minh Quân (STAFF)', roleName: 'Nhân viên CN #1' }
    },
    2: {
      manager: { username: 'manager2', fullName: 'Quản lý CN #2', roleName: 'CN #2 • Tân Phong' },
      staff: { username: 'staff2', fullName: 'Nhân viên CN #2', roleName: 'CN #2 • Tân Phong' }
    },
    3: {
      manager: { username: 'manager3', fullName: 'Quản lý CN #3', roleName: 'CN #3 • Trảng Dài' },
      staff: { username: 'staff3', fullName: 'Nhân viên CN #3', roleName: 'CN #3 • Trảng Dài' }
    }
  };
  const selectedBranchAcc = branchAccountsByStore[contextStoreId] || branchAccountsByStore[1];

  const systemAccounts = [
    { username: 'admin', fullName: 'Quản trị viên (OWNER)', roleCode: 'ADMIN', roleName: `Chủ chuỗi (${activeStoresCount} CN)`, color: '#4f46e5' },
    { ...selectedBranchAcc.manager, roleCode: 'STORE_MANAGER', color: '#2563eb' },
    { ...selectedBranchAcc.staff, roleCode: 'CASHIER', color: '#047857' }
  ];

  const getRoleBadgeStyle = (code) => {
    switch (code) {
      case 'ADMIN':
        return { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe', icon: Shield, label: 'OWNER • Chủ chuỗi' };
      case 'STORE_MANAGER':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', icon: Store, label: 'MANAGER • Quản lý CH' };
      default:
        return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', icon: User, label: 'STAFF • Nhân viên CH' };
    }
  };

  const roleStyle = getRoleBadgeStyle(roleCode);
  const CurrentRoleIcon = roleStyle.icon;

  const criticalBatches = batches.filter(
    b =>
      (b.alertColor === 'RED' ||
        b.status === 'CRITICAL' ||
        ((b.currentQuantity ?? b.quantity ?? 0) > 0 && b.daysLeft !== undefined && Number(b.daysLeft) <= 3 && Number(b.daysLeft) > 0)) &&
      (b.currentQuantity ?? b.quantity ?? 0) > 0
  );

  const currentStoreLabel = isOwner
    ? (selectedStoreId === 'ALL'
      ? `Toàn chuỗi (${activeStoresCount} cửa hàng)`
      : (storesList.find(s => String(s.id) === String(selectedStoreId))?.storeName || storeProfile?.storeName || `Chi nhánh #${selectedStoreId}`))
    : (storeProfile?.storeName || `Chi nhánh #${currentUser?.storeId || 1}`);

  const handleConfirmSwitch = async (e) => {
    e.preventDefault();
    if (!switchTargetUser || !onSwitchUser) return;
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
      setSwitchError(err.message || 'Lỗi xác thực tài khoản.');
    } finally {
      setSwitchLoading(false);
    }
  };

  const mobileMenuItems = MENU_CONFIG.filter(item => {
    if (item.id === 'stock-transfer' && isSingleStore) return false;
    return currentUser ? canAccessPage(currentUser, item.id, isSingleStore) : true;
  });

  return (
    <>
      <header
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '10px 20px',
          height: '64px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Left: Mobile Menu + SmartSupply AI Brand + Scope Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <button
            type="button"
            className="ss-btn ss-btn-secondary ss-btn-sm ss-mobile-menu-trigger"
            onClick={() => setShowMobileNav(true)}
            aria-label="Mở menu điều hướng"
            style={{ padding: '7px 9px' }}
          >
            <Menu size={18} />
          </button>

          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <TrendingUp size={20} strokeWidth={2.4} aria-hidden="true" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  {enterpriseConfig?.enterpriseName || 'SmartSupply AI'}
                </span>
                <span className="ss-badge ss-badge-indigo" style={{ fontSize: '0.66rem', padding: '1px 7px' }}>
                  {isSingleStore ? '1 Cửa hàng' : `Chuỗi ${activeStoresCount} CN`}
                </span>
              </div>
              <div style={{ fontSize: '0.71rem', color: 'var(--text-dim)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                {currentStoreLabel}
              </div>
            </div>
          </button>

          {/* 2-Level Store Scope Switcher (OWNER chọn Toàn chuỗi / từng Chi nhánh) */}
          {isOwner ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                marginLeft: '6px'
              }}
            >
              <Building2 size={14} color="var(--primary)" aria-hidden="true" />
              <label htmlFor="header-store-scope" className="ss-label" style={{ fontSize: '0.74rem', margin: 0, whiteSpace: 'nowrap' }}>
                Phạm vi:
              </label>
              <select
                id="header-store-scope"
                aria-label="Chọn phạm vi cửa hàng"
                value={selectedStoreId || 'ALL'}
                onChange={(e) => onSelectStore && onSelectStore(e.target.value)}
                style={{
                  width: 'auto',
                  minWidth: '175px',
                  maxWidth: '260px',
                  padding: '3px 6px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-main)'
                }}
              >
                <option value="ALL">Toàn chuỗi ({activeStoresCount} chi nhánh)</option>
                {storesList.map(st => (
                  <option key={st.id} value={String(st.id)}>
                    {st.storeCode}: {st.storeName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div
              className="ss-badge ss-badge-info"
              style={{
                marginLeft: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                maxWidth: '380px',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
              title={storeProfile?.address ? `CN #${currentUser?.storeId || 1} — ${storeProfile.storeName || ''} (${storeProfile.address})` : currentStoreLabel}
            >
              <Building2 size={12} aria-hidden="true" style={{ flexShrink: 0 }} />
              <span>
                CN #{currentUser?.storeId || 1}
                {(() => {
                  const loc = getShortBranchLocation(storeProfile);
                  return loc ? ` • ${loc}` : '';
                })()}
              </span>
            </div>
          )}
        </div>

        {/* Right: Weather Context, Critical Alerts, User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Weather & Holiday Context Pill */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'var(--bg-subtle)',
              padding: '3px 8px',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle)',
              position: 'relative'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowUserDropdown(false);
                setShowWeatherMenu(prev => !prev);
              }}
              aria-expanded={showWeatherMenu}
              title="Yếu tố thời tiết phục vụ AI Forecast & Smart Ordering"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.78rem',
                padding: '3px 6px',
                fontFamily: 'inherit'
              }}
            >
              {weather?.condition === 'RAINY' ? (
                <CloudRain size={15} color="#2563eb" aria-hidden="true" />
              ) : weather?.condition === 'SUNNY' ? (
                <Sun size={15} color="#d97706" aria-hidden="true" />
              ) : (
                <Cloud size={15} color="#64748b" aria-hidden="true" />
              )}
              <span className="num-tabular">
                {weather?.temp !== null && weather?.temp !== undefined ? `${weather.temp}°C` : '--°C'}
              </span>
              <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>
                {weather?.label || 'Đang đồng bộ'}
              </span>
              <ChevronDown size={12} aria-hidden="true" />
            </button>

            {onSyncWeather && (
              <button
                type="button"
                onClick={onSyncWeather}
                disabled={isSyncingWeather}
                aria-label="Đồng bộ thời tiết thực tế"
                title="Đồng bộ thời tiết thực tế (Open-Meteo)"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: isSyncingWeather ? 'var(--primary)' : 'var(--text-dim)',
                  cursor: isSyncingWeather ? 'wait' : 'pointer',
                  padding: '3px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <RotateCw size={13} style={{ animation: isSyncingWeather ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            )}

            <span aria-hidden="true" style={{ width: '1px', height: '14px', background: 'var(--border-color)' }} />

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: weather?.isHoliday ? 'var(--warning-yellow-bg)' : 'transparent',
                color: weather?.isHoliday ? 'var(--warning-yellow-light)' : 'var(--text-muted)',
                borderRadius: '9999px',
                padding: '3px 8px',
                fontSize: '0.76rem',
                fontWeight: 600
              }}
              title="Trạng thái lịch thực tế tại Việt Nam"
            >
              <Calendar size={13} aria-hidden="true" />
              <span>{weather?.calendarLabel || 'Ngày thường'}</span>
            </span>

            {showWeatherMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '295px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px',
                  boxShadow: 'var(--shadow-elevated)',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span>THỜI TIẾT THỰC • {weather?.location || 'Chưa định vị'}</span>
                  {weather?.updatedAt && <span>{weather.updatedAt}</span>}
                </div>

                {weather?.online && weather?.temp !== null ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                      <strong className="num-tabular" style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>{weather.temp}°C</strong>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{weather.label}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '0.73rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '6px 8px', borderRadius: '6px' }}>
                      <span className="num-tabular"><Droplets size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> {weather.humidity ?? '--'}%</span>
                      <span className="num-tabular">Mưa: {weather.precipitation ?? 0}mm</span>
                      <span className="num-tabular"><Wind size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> {weather.windSpeed ?? 0}km/h</span>
                    </div>
                    {Array.isArray(weather.dailyForecast) && weather.dailyForecast.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.74rem' }}>
                        {weather.dailyForecast.slice(0, 3).map((d, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>{d.dow} {d.dayLabel} ({d.label})</span>
                            <strong className="num-tabular">{d.tempMin}–{d.tempMax}°C</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: 'var(--danger-red-light)', padding: '4px 0' }}>
                    {weather?.error || 'Chưa lấy được số liệu Open-Meteo.'}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '6px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
                  {onUseDeviceLocation && (
                    <button
                      type="button"
                      className="ss-btn ss-btn-secondary ss-btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => { onUseDeviceLocation(); setShowWeatherMenu(false); }}
                    >
                      <MapPin size={12} /> Vị trí GPS
                    </button>
                  )}
                  {onSyncWeather && (
                    <button
                      type="button"
                      className="ss-btn ss-btn-primary ss-btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => { onSyncWeather(); setShowWeatherMenu(false); }}
                    >
                      <RotateCw size={12} /> Đồng bộ
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Alert Bell */}
          <button
            type="button"
            onClick={() => setShowNotifModal(true)}
            aria-label={`Cảnh báo cận hạn: ${criticalCount} lô khẩn cấp`}
            title={criticalCount > 0 ? `${criticalCount} lô hàng vùng Đỏ (≤ 3 ngày HSD)` : 'Không có lô nguy kịch'}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9999px',
              background: criticalCount > 0 ? 'var(--danger-red-bg)' : 'var(--bg-subtle)',
              border: `1px solid ${criticalCount > 0 ? 'var(--danger-red-border)' : 'var(--border-subtle)'}`,
              color: criticalCount > 0 ? 'var(--danger-red)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <Bell size={16} aria-hidden="true" />
            {criticalCount > 0 && (
              <span
                className="num-tabular"
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '9999px',
                  background: 'var(--danger-red)',
                  color: '#ffffff',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px'
                }}
              >
                {criticalCount}
              </span>
            )}
          </button>

          {/* User Switcher & Account Menu */}
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                setShowWeatherMenu(false);
                setShowUserDropdown(prev => !prev);
              }}
              aria-expanded={showUserDropdown}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                background: 'var(--bg-subtle)',
                padding: '4px 11px',
                borderRadius: '10px',
                border: `1px solid ${roleStyle.border}`,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: roleStyle.bg,
                  color: roleStyle.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CurrentRoleIcon size={15} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                  {(currentUser?.fullName || 'Người dùng').replace(/\s*\(.*?\)\s*/g, '')}
                </div>
                <div style={{ fontSize: '0.68rem', color: roleStyle.text, fontWeight: 600 }}>
                  {roleStyle.label}
                </div>
              </div>
              <ChevronDown size={14} color="var(--text-dim)" aria-hidden="true" />
            </button>

            {showUserDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '280px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-elevated)',
                  padding: '10px',
                  zIndex: 100
                }}
              >
                <div style={{ padding: '4px 8px 8px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                  Chuyển đổi Actor (Xác thực mật khẩu)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '8px 0' }}>
                  {systemAccounts.map(acc => {
                    const isCurrent = currentUser?.username === acc.username;
                    return (
                      <button
                        key={acc.username}
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          if (!isCurrent) {
                            setSwitchTargetUser(acc);
                            setSwitchPassword('');
                            setSwitchError('');
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: isCurrent ? 'var(--primary-bg)' : 'transparent',
                          border: `1px solid ${isCurrent ? 'var(--primary-border)' : 'transparent'}`,
                          cursor: isCurrent ? 'default' : 'pointer',
                          textAlign: 'left',
                          fontFamily: 'inherit'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.79rem', fontWeight: 600, color: 'var(--text-main)' }}>{acc.fullName}</div>
                          <div style={{ fontSize: '0.69rem', color: acc.color, fontWeight: 600 }}>{acc.roleName}</div>
                        </div>
                        {isCurrent ? (
                          <CheckCircle2 size={14} color="var(--primary)" />
                        ) : (
                          <Lock size={12} color="var(--text-dim)" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    className="ss-btn ss-btn-secondary ss-btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowChangePasswordModal(true);
                    }}
                  >
                    <KeyRound size={14} color="var(--primary)" /> Đổi mật khẩu cá nhân
                  </button>
                  <button
                    type="button"
                    className="ss-btn ss-btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      background: 'var(--danger-red-bg)',
                      color: 'var(--danger-red-light)',
                      border: '1px solid var(--danger-red-border)'
                    }}
                    onClick={() => {
                      setShowUserDropdown(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    <LogOut size={14} /> Đăng xuất hệ thống
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer Dialog */}
      <ModalDialog
        isOpen={showMobileNav}
        onClose={() => setShowMobileNav(false)}
        title="Điều hướng SmartSupply AI"
        subtitle={currentStoreLabel}
        size="sm"
      >
        <nav aria-label="Menu di động">
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {mobileMenuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => {
                      onSelectTab && onSelectTab(item.id);
                      setShowMobileNav(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isActive ? 'var(--primary-border)' : 'var(--border-subtle)'}`,
                      background: isActive ? 'var(--primary-bg)' : 'var(--bg-surface)',
                      color: isActive ? 'var(--primary-hover)' : 'var(--text-main)',
                      fontWeight: isActive ? 700 : 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </ModalDialog>

      {/* Critical Spoilage Quick Alert Dialog */}
      <ModalDialog
        isOpen={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        title="Cảnh báo Lô Hàng Nguy Cơ Hủy (Vùng Đỏ)"
        subtitle={`Phát hiện ${criticalBatches.length} lô hàng còn ≤ 3 ngày sử dụng`}
        footer={
          <>
            <button type="button" className="ss-btn ss-btn-secondary" onClick={() => setShowNotifModal(false)}>
              Đóng
            </button>
            <button
              type="button"
              className="ss-btn ss-btn-primary"
              onClick={() => {
                setShowNotifModal(false);
                onSelectTab && onSelectTab('spoilage-alerts');
              }}
            >
              Mở trang Spoilage Alerts <ArrowRight size={15} />
            </button>
          </>
        }
      >
        {criticalBatches.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Hiện không có lô hàng nào trong Vùng Đỏ cần xử lý khẩn cấp.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {criticalBatches.slice(0, 12).map(b => (
              <div
                key={b.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'var(--danger-red-bg)',
                  border: '1px solid var(--danger-red-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>{b.productName}</div>
                  <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Lô <strong style={{ fontFamily: 'monospace' }}>{b.batchCode}</strong> • Tồn: <strong>{b.currentQuantity ?? b.quantity}</strong> • HSD: <strong style={{ color: 'var(--danger-red-light)' }}>{String(b.expiryDate || '').slice(0, 10)}</strong> (còn {b.daysLeft} ngày)
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(roleCode === 'ADMIN' || roleCode === 'STORE_MANAGER') && onQuickDiscount && (
                    <button
                      type="button"
                      className="ss-btn ss-btn-primary ss-btn-sm"
                      onClick={() => onQuickDiscount(b.id, 40)}
                    >
                      <Zap size={13} /> Giảm 40%
                    </button>
                  )}
                  {!b.isShelfRotated && onRotateShelf && (
                    <button
                      type="button"
                      className="ss-btn ss-btn-secondary ss-btn-sm"
                      onClick={() => onRotateShelf(b.id)}
                    >
                      <RotateCw size={13} /> Đảo kệ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalDialog>

      {/* Switch Role Password Confirmation Dialog */}
      <ModalDialog
        isOpen={Boolean(switchTargetUser)}
        onClose={() => setSwitchTargetUser(null)}
        title="Xác thực Chuyển đổi Tài khoản"
        subtitle={switchTargetUser ? `Đăng nhập với vai trò ${switchTargetUser.fullName}` : ''}
        size="sm"
      >
        <form onSubmit={handleConfirmSwitch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="ss-field">
            <label className="ss-label" htmlFor="switch-role-username">Tài khoản mục tiêu</label>
            <input id="switch-role-username" type="text" value={switchTargetUser?.username || ''} readOnly disabled />
          </div>
          <div className="ss-field">
            <label className="ss-label" htmlFor="switch-role-password">Mật khẩu xác nhận</label>
            <input
              id="switch-role-password"
              type="password"
              autoFocus
              required
              autoComplete="current-password"
              placeholder="Nhập mật khẩu tài khoản..."
              value={switchPassword}
              onChange={(e) => {
                setSwitchPassword(e.target.value);
                if (switchError) setSwitchError('');
              }}
            />
          </div>
          {switchError && (
            <div role="alert" style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--danger-red-bg)', border: '1px solid var(--danger-red-border)', color: 'var(--danger-red-light)', fontSize: '0.8rem', fontWeight: 600 }}>
              {switchError}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button type="button" className="ss-btn ss-btn-secondary" onClick={() => setSwitchTargetUser(null)}>
              Hủy
            </button>
            <button type="submit" className="ss-btn ss-btn-primary" disabled={switchLoading}>
              {switchLoading ? 'Đang xác thực...' : 'Xác nhận chuyển ca'}
            </button>
          </div>
        </form>
      </ModalDialog>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        currentUser={currentUser}
      />
    </>
  );
}
