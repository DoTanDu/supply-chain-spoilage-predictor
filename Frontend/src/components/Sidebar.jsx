import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Clock, 
  ShoppingCart, 
  PackagePlus, 
  Trash2, 
  TrendingUp, 
  ScrollText,
  Shield,
  User,
  Store,
  Truck,
  Package,
  ClipboardCheck,
  Users,
  Sliders,
  ArrowLeftRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  currentRole = 'ADMIN', 
  currentUser,
  criticalCount = 0 
}) {
  const roleCode = currentRole?.toUpperCase() || 'STAFF';

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('lhu_sidebar_collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('lhu_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Danh mục menu chuẩn mực
  const allMenuItems = [
    {
      id: 'dashboard',
      label: 'Tổng quan điều hành',
      icon: LayoutDashboard,
      allowedRoles: ['ADMIN', 'STORE_MANAGER']
    },
    {
      id: 'pos-checkout',
      label: 'Quầy Bán lẻ POS',
      icon: ShoppingCart,
      allowedRoles: ['ADMIN', 'STORE_MANAGER', 'CASHIER'],
      highlight: roleCode === 'CASHIER' || roleCode === 'STAFF'
    },
    {
      id: 'fefo-monitor',
      label: 'Giám sát Date & FEFO',
      icon: Clock,
      badge: criticalCount > 0 ? `${criticalCount} khẩn` : null,
      allowedRoles: ['ADMIN', 'STORE_MANAGER', 'CASHIER']
    },
    {
      id: 'dc-intake',
      label: 'Tiếp nhận hàng DC',
      icon: PackagePlus,
      allowedRoles: ['ADMIN', 'STORE_MANAGER', 'CASHIER']
    },
    {
      id: 'product-catalog',
      label: 'Danh mục Sản phẩm',
      icon: Package,
      allowedRoles: ['ADMIN', 'STORE_MANAGER', 'CASHIER']
    },
    {
      id: 'spoilage-disposal',
      label: 'Tiêu hủy & Sổ hao hụt',
      icon: Trash2,
      allowedRoles: ['ADMIN', 'STORE_MANAGER', 'CASHIER']
    },
    {
      id: 'shift-handover',
      label: 'Bàn giao Ca trực',
      icon: ClipboardCheck,
      allowedRoles: ['ADMIN', 'STORE_MANAGER', 'CASHIER']
    },
    {
      id: 'reorder-predictor',
      label: 'Dự báo ROP & Đơn DC',
      icon: TrendingUp,
      allowedRoles: ['ADMIN', 'STORE_MANAGER', 'CASHIER']
    },
    {
      id: 'stock-transfer',
      label: 'Điều phối Liên cửa hàng',
      icon: ArrowLeftRight,
      allowedRoles: ['ADMIN', 'STORE_MANAGER', 'CASHIER']
    },
    {
      id: 'audit-log',
      label: 'Nhật ký Kiểm toán',
      icon: ScrollText,
      allowedRoles: ['ADMIN', 'STORE_MANAGER']
    },
    {
      id: 'store-settings',
      label: 'Cấu hình Cửa hàng & DC',
      icon: Sliders,
      allowedRoles: ['ADMIN', 'STORE_MANAGER']
    },
    {
      id: 'user-management',
      label: 'Quản trị Tài khoản & Khóa',
      icon: Users,
      allowedRoles: ['ADMIN']
    }
  ];

  // Lọc menu hiển thị nghiêm ngặt theo Ma trận Phân quyền RBAC
  const visibleMenuItems = allMenuItems.filter(item => {
    if (roleCode === 'ADMIN') return true;
    return item.allowedRoles.includes(roleCode);
  });

  const getRoleBadge = () => {
    switch (roleCode) {
      case 'ADMIN':
        return { label: 'CHỦ CHUỖI / ADMIN', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: Shield };
      case 'STORE_MANAGER':
        return { label: 'QUẢN LÝ CỬA HÀNG', color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', icon: Store };
      case 'CASHIER':
      case 'STAFF':
        return { label: 'NHÂN VIÊN CỬA HÀNG', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: ShoppingCart };
      default:
        return { label: 'NHÂN VIÊN', color: '#475569', bg: '#f1f5f9', border: '#e2e8f0', icon: User };
    }
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;

  return (
    <aside style={{
      width: isCollapsed ? '68px' : '250px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: isCollapsed ? '16px 8px' : '16px 12px',
      minHeight: 'calc(100vh - 70px)',
      transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), padding 0.22s ease, background-color 0.2s ease, border-color 0.2s ease',
      position: 'relative'
    }}>
      {/* Menu List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Header Toggle */}
        <div style={{
          padding: isCollapsed ? '0 0 10px' : '0 6px 10px',
          display: 'flex',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '6px'
        }}>
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                letterSpacing: '0.06em'
              }}>
                Nghiệp vụ ca trực
              </span>
              <span style={{
                fontSize: '0.625rem',
                padding: '1px 6px',
                borderRadius: '4px',
                background: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                fontWeight: 600
              }}>
                {visibleMenuItems.length}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapse}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title={isCollapsed ? 'Mở rộng thanh menu (250px)' : 'Thu gọn thanh menu (68px)'}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                padding: isCollapsed ? '10px 0' : '9px 12px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: isActive ? 'var(--primary-border)' : 'transparent',
                background: isActive 
                  ? 'var(--primary-bg)' 
                  : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%',
                fontWeight: isActive ? 700 : 500,
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-subtle)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={18} />
                </div>
                {!isCollapsed && (
                  <span style={{ fontSize: '0.845rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                )}
              </div>

              {/* Badge: hiển thị chữ khi mở rộng, chấm đỏ góc khi thu gọn */}
              {item.badge && !isCollapsed && (
                <span style={{
                  fontSize: '0.675rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'var(--danger-red-bg)',
                  color: 'var(--danger-red)',
                  border: '1px solid var(--danger-red-border)',
                  fontWeight: 700
                }}>
                  {item.badge}
                </span>
              )}
              {item.badge && isCollapsed && (
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '12px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--danger-red)',
                  boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)'
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Role Footer Card */}
      <div 
        title={isCollapsed ? `${roleInfo.label} • ${currentUser?.fullName || 'Đang hoạt động'}` : undefined}
        style={{
          marginTop: '16px',
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
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: roleInfo.bg,
          border: `1px solid ${roleInfo.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: roleInfo.color,
          flexShrink: 0
        }}>
          <RoleIcon size={16} />
        </div>
        {!isCollapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: roleInfo.color, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {roleInfo.label}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.fullName || 'Đang hoạt động'}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
