import React from 'react';
import { 
  LayoutDashboard, 
  Clock, 
  ShoppingCart, 
  PackagePlus, 
  Trash2, 
  TrendingUp, 
  ScrollText,
  FileCheck,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentRole, criticalCount }) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Tổng quan điều hành',
      subtitle: 'KPIs, Doanh số & Hao hụt',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'fefo-monitor',
      label: 'Giám sát Date & FEFO',
      subtitle: '3 Ngưỡng cảnh báo RSL',
      icon: Clock,
      badge: criticalCount > 0 ? `${criticalCount} khẩn` : null,
      badgeType: 'danger'
    },
    {
      id: 'pos-checkout',
      label: 'Bán lẻ POS (FEFO)',
      subtitle: 'Thu ngân tự động trừ kho',
      icon: ShoppingCart,
      badge: 'Hot',
      badgeType: 'blue'
    },
    {
      id: 'dc-intake',
      label: 'Nhập lô từ Kho tổng (DC)',
      subtitle: 'Tiếp nhận hàng hóa mới',
      icon: PackagePlus,
      badge: null
    },
    {
      id: 'spoilage-disposal',
      label: 'Tiêu hủy Hàng hỏng',
      subtitle: 'Lập phiếu & Duyệt hao hụt',
      icon: Trash2,
      badge: currentRole === 'STORE_MANAGER' ? 'Cần duyệt' : null,
      badgeType: 'warning'
    },
    {
      id: 'reorder-predictor',
      label: 'Dự báo Tái đặt hàng',
      subtitle: 'Thuật toán ROP & DOS>DUE',
      icon: TrendingUp,
      badge: 'AI',
      badgeType: 'blue'
    },
    {
      id: 'audit-log',
      label: 'Nhật ký Audit Log',
      subtitle: 'Lịch sử giao dịch & vết lỗi',
      icon: ScrollText,
      badge: null
    }
  ];

  return (
    <aside style={{
      width: '280px',
      background: 'rgba(15, 23, 42, 0.95)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 14px',
      minHeight: 'calc(100vh - 73px)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ padding: '0 12px 12px', fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
          Phân hệ Nghiệp vụ Cửa hàng
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: isActive ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
                background: isActive ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.25) 100%)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  color: isActive ? 'var(--safe-green)' : 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#ffffff' : 'var(--text-main)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span className={`badge badge-${item.badgeType || 'safe'}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '14px',
        padding: '14px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--safe-green)', fontWeight: 700 }}>
          <Sparkles size={16} /> AI Engine Active
        </div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Đang áp dụng bộ chuẩn <strong>.agent/skills</strong>: FEFO, 3 Ngưỡng RSL & Clean Architecture.
        </div>
      </div>
    </aside>
  );
}
