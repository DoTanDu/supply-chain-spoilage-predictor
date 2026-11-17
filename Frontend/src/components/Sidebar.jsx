// src/components/Sidebar.jsx
import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Boxes,
  TrendingUp,
  ShoppingBag,
  ArrowLeftRight,
  AlertTriangle,
  BarChart3,
  Settings,
  Shield,
  Store,
  User,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { canAccessPage, normalizeRole } from '../utils/pagePermissions';

export const MENU_CONFIG = [
  { id: 'dashboard', label: '01. Dashboard', icon: LayoutDashboard },
  { id: 'store-management', label: '02. Store Management', icon: Building2 },
  { id: 'inventory-management', label: '03. Inventory Management', icon: Boxes },
  { id: 'ai-forecast', label: '04. AI Forecast', icon: TrendingUp },
  { id: 'smart-ordering', label: '05. Smart Ordering', icon: ShoppingBag },
  { id: 'stock-transfer', label: '06. Stock Transfer', icon: ArrowLeftRight },
  { id: 'spoilage-alerts', label: '07. Spoilage Alerts', icon: AlertTriangle },
  { id: 'reports-analytics', label: '08. Reports & Analytics', icon: BarChart3 },
  { id: 'settings-integration', label: '09. Settings & Integration', icon: Settings }
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentRole = 'ADMIN',
  currentUser,
  criticalCount = 0,
  pendingTransferCount = 0,
  isSingleStore = false
}) {
  const roleCode = normalizeRole(currentRole);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ss_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('ss_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const visibleMenuItems = MENU_CONFIG.filter(item => {
    if (item.id === 'stock-transfer' && isSingleStore) return false;
    if (currentUser) {
      return canAccessPage(currentUser, item.id, isSingleStore);
    }
    return true;
  }).map(item => {
    if (item.id === 'spoilage-alerts' && criticalCount > 0) {
      return { ...item, badge: `${criticalCount} khẩn`, badgeTone: 'danger' };
    }
    if (item.id === 'stock-transfer' && pendingTransferCount > 0) {
      return { ...item, badge: `${pendingTransferCount} chờ`, badgeTone: 'warning' };
    }
    return item;
  });

  const getRoleBadge = () => {
    switch (roleCode) {
      case 'ADMIN':
        return { label: 'OWNER • Chủ chuỗi', color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', icon: Shield };
      case 'STORE_MANAGER':
        return { label: 'MANAGER • Quản lý CH', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: Store };
      default:
        return { label: 'STAFF • Nhân viên CH', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', icon: User };
    }
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;

  return (
    <aside
      className="ss-desktop-sidebar"
      style={{
        width: isCollapsed ? '72px' : '256px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isCollapsed ? '14px 8px' : '14px 12px',
        minHeight: 'calc(100dvh - 64px)',
        transition: 'width 0.18s ease, padding 0.18s ease',
        flexShrink: 0
      }}
    >
      <nav aria-label="Điều hướng chính SmartSupply AI" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div
          style={{
            padding: isCollapsed ? '0 0 10px' : '0 6px 10px',
            display: 'flex',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '6px'
          }}
        >
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-dim)',
                  letterSpacing: '0.05em'
                }}
              >
                Phân hệ quản trị
              </span>
              <span className="ss-badge ss-badge-neutral" style={{ padding: '1px 6px', fontSize: '0.68rem' }}>
                {visibleMenuItems.length}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            className="ss-btn ss-btn-secondary ss-btn-sm"
            style={{ padding: '5px', border: 'none', background: 'transparent', color: 'var(--text-muted)' }}
          >
            {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={isCollapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    gap: '10px',
                    width: '100%',
                    padding: isCollapsed ? '10px 0' : '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--primary-border)' : 'transparent',
                    background: isActive ? 'var(--primary-bg)' : 'transparent',
                    color: isActive ? 'var(--primary-hover)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    position: 'relative',
                    transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease'
                  }}
                >
                  {isActive && !isCollapsed && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: '3px',
                        top: '8px',
                        bottom: '8px',
                        width: '3px',
                        borderRadius: '3px',
                        background: 'var(--primary)'
                      }}
                    />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, paddingLeft: isActive && !isCollapsed ? '4px' : 0 }}>
                    <Icon
                      size={18}
                      aria-hidden="true"
                      style={{ color: isActive ? 'var(--primary)' : 'var(--text-dim)', flexShrink: 0 }}
                    />
                    {!isCollapsed && (
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.84rem',
                            fontWeight: isActive ? 700 : 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.35
                          }}
                        >
                          {item.label}
                        </div>
                      </div>
                    )}
                  </div>

                  {item.badge && !isCollapsed && (
                    <span
                      className={`ss-badge ${item.badgeTone === 'danger' ? 'ss-badge-danger' : 'ss-badge-warning'}`}
                      style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.badge && isCollapsed && (
                    <span
                      aria-label={item.badge}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '12px',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: item.badgeTone === 'danger' ? 'var(--danger-red)' : 'var(--warning-yellow)'
                      }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Role & Scope Card */}
      <div
        title={isCollapsed ? `${roleInfo.label} • ${currentUser?.fullName || ''}` : undefined}
        style={{
          marginTop: '14px',
          padding: isCollapsed ? '10px 0' : '10px 12px',
          borderRadius: '10px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: '10px'
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: roleInfo.bg,
            border: `1px solid ${roleInfo.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: roleInfo.color,
            flexShrink: 0
          }}
        >
          <RoleIcon size={16} aria-hidden="true" />
        </div>
        {!isCollapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: roleInfo.color,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {roleInfo.label}
            </div>
            <div
              style={{
                fontSize: '0.77rem',
                color: 'var(--text-main)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {currentUser?.fullName || 'Đang hoạt động'}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
