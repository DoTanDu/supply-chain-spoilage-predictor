import React, { useState, useMemo } from 'react';
import { 
  ScrollText, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Filter, 
  Activity, 
  User, 
  Calendar, 
  Tag, 
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Download
} from 'lucide-react';
import { exportAuditLogsToExcel } from '../utils/exportUtils';

// Helper: Chuẩn hóa chuỗi tiếng Việt không dấu để tìm kiếm
function stripVietnamese(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

// Helper: Chuẩn hóa và ánh xạ từng bản ghi Audit Log từ CSDL
function normalizeLogRecord(raw) {
  if (!raw) return null;
  const rawDesc = raw.description || raw.details || '';
  const match = rawDesc.match(/^\[(.*?)\]\s*(.*)$/);
  
  let user = raw.user || raw.userName || '';
  let details = rawDesc;
  
  if (match) {
    if (!user) user = match[1];
    details = match[2];
  } else if (!user) {
    if (raw.userId === 1) user = 'Quản Trị Viên (Admin)';
    else if (raw.userId === 2) user = 'Đỗ Tấn Du (Quản Lý Cửa Hàng)';
    else if (raw.userId === 3 || raw.userId === 4) user = 'Đoàn Minh Quân (Nhân Viên Cửa Hàng)';
    else user = 'Hệ Thống LHU Mart';
  }

  const rawAction = raw.actionType || raw.action || 'INFO';
  const rawTime = raw.createdAt || raw.created_at || raw.time;
  const ip = raw.ipAddress || raw.ip_address || '127.0.0.1';

  let formattedTime = '—';
  if (rawTime) {
    try {
      const d = new Date(rawTime);
      formattedTime = d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      formattedTime = String(rawTime);
    }
  }

  return {
    id: raw.id,
    time: formattedTime,
    rawTime,
    user,
    action: rawAction,
    details: details || 'Không có mô tả chi tiết.',
    ip,
    entityName: raw.entityName || '',
    entityId: raw.entityId || ''
  };
}

// Cấu hình nhãn và phong cách hiển thị cho từng loại nghiệp vụ (Chuẩn Light Mode tương phản cao WCAG AA)
function getActionBadgeStyle(action) {
  const act = (action || '').toUpperCase();
  switch (act) {
    case 'POS_CHECKOUT':
      return { 
        label: 'Xuất Bán POS (FEFO)', 
        bg: '#ecfdf5', 
        color: '#047857', 
        border: '#a7f3d0' 
      };
    case 'DC_INBOUND':
      return { 
        label: 'Tiếp Nhận DC Biên Hòa', 
        bg: '#eff6ff', 
        color: '#1d4ed8', 
        border: '#bfdbfe' 
      };
    case 'QUICK_MARKDOWN':
      return { 
        label: 'Quick Markdown Giảm Giá', 
        bg: '#fffbeb', 
        color: '#b45309', 
        border: '#fde68a' 
      };
    case 'ROTATE_SHELF_FEFO':
      return { 
        label: 'Đảo Kệ Mặt Tiền (FEFO)', 
        bg: '#faf5ff', 
        color: '#7e22ce', 
        border: '#e9d5ff' 
      };
    case 'SPOILAGE_DISPOSAL':
      return { 
        label: 'Hủy Hàng & Sổ Hao Hụt', 
        bg: '#fff1f2', 
        color: '#be123c', 
        border: '#fecdd3' 
      };
    case 'DELETE_PRODUCT':
      return { 
        label: 'Ngừng Kinh Doanh (Xóa mềm)', 
        bg: '#fff1f2', 
        color: '#be123c', 
        border: '#fecdd3' 
      };
    case 'CREATE_PRODUCT':
      return { 
        label: 'Tạo Mới Sản Phẩm', 
        bg: '#ecfdf5', 
        color: '#047857', 
        border: '#a7f3d0' 
      };
    case 'UPDATE_PRODUCT':
      return { 
        label: 'Cập Nhật Sản Phẩm / Giá', 
        bg: '#eff6ff', 
        color: '#1d4ed8', 
        border: '#bfdbfe' 
      };
    case 'CREATE_PURCHASE_ORDER':
    case 'UPDATE_PO_STATUS':
      return { 
        label: 'Đơn Đặt Hàng DC', 
        bg: '#fffbeb', 
        color: '#b45309', 
        border: '#fde68a' 
      };
    case 'SHIFT_HANDOVER':
      return { 
        label: 'Ký Bàn Giao Ca Trực', 
        bg: '#f0f9ff', 
        color: '#0369a1', 
        border: '#bae6fd' 
      };
    case 'LOGIN':
      return { 
        label: 'Đăng Nhập Thành Công', 
        bg: '#eef2ff', 
        color: '#4338ca', 
        border: '#c7d2fe' 
      };
    case 'LOGIN_FAILED':
      return { 
        label: 'ĐĂNG NHẬP THẤT BẠI', 
        bg: '#fff1f2', 
        color: '#be123c', 
        border: '#fecdd3' 
      };
    case 'ACCOUNT_LOCKED_FAILED_ATTEMPTS':
      return { 
        label: 'TỰ ĐỘNG KHÓA (BRUTE-FORCE)', 
        bg: '#ffe4e6', 
        color: '#9f1239', 
        border: '#fda4af' 
      };
    case 'RESET_PASSWORD':
      return { 
        label: 'Đặt Lại Mật Khẩu', 
        bg: '#fff7ed', 
        color: '#c2410c', 
        border: '#fed7aa' 
      };
    case 'CHANGE_PASSWORD':
      return { 
        label: 'Đổi Mật Khẩu Cá Nhân', 
        bg: '#ecfdf5', 
        color: '#047857', 
        border: '#a7f3d0' 
      };
    case 'CREATE_USER':
      return { 
        label: 'Tạo Mới Nhân Sự', 
        bg: '#f5f3ff', 
        color: '#6d28d9', 
        border: '#ddd6fe' 
      };
    case 'UPDATE_USER':
      return { 
        label: 'Cập Nhật Nhân Sự & Vai Trò', 
        bg: '#f5f3ff', 
        color: '#6d28d9', 
        border: '#ddd6fe' 
      };
    case 'LOCK_USER':
      return { 
        label: 'Khóa Tài Khoản', 
        bg: '#fff1f2', 
        color: '#be123c', 
        border: '#fecdd3' 
      };
    case 'UNLOCK_USER':
      return { 
        label: 'Mở Khóa Tài Khoản', 
        bg: '#ecfdf5', 
        color: '#047857', 
        border: '#a7f3d0' 
      };
    case 'UPDATE_STORE_PROFILE':
      return { 
        label: 'Cập Nhật Tham Số DC', 
        bg: '#eff6ff', 
        color: '#1d4ed8', 
        border: '#bfdbfe' 
      };
    default:
      return { 
        label: action || 'Hoạt động', 
        bg: 'var(--bg-subtle)', 
        color: 'var(--text-secondary)', 
        border: 'var(--border-subtle)' 
      };
  }
}

export default function AuditLogView({ auditLogs = [], isAdmin = false, onRequestAdminLogin }) {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{
        padding: '50px 30px',
        textAlign: 'center',
        maxWidth: '680px',
        margin: '40px auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        border: '1px solid #fecdd3',
        background: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)',
        borderRadius: '20px',
        boxShadow: 'var(--shadow-elevated)'
      }}>
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '22px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--critical-red)',
          boxShadow: '0 8px 25px rgba(239, 68, 68, 0.25)'
        }}>
          <ShieldAlert size={40} />
        </div>

        <div>
          <span className="badge badge-danger" style={{ fontSize: '0.75rem', marginBottom: '12px', padding: '4px 10px' }}>
            🔒 TRUY CẬP BỊ GIỚI HẠN BẢO MẬT
          </span>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '10px 0', color: 'var(--text-main)' }}>
            Yêu Cầu Quyền Quản Trị Viên (Admin)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6', maxWidth: '520px', margin: '0 auto' }}>
            Phân hệ <strong>Nhật ký Kiểm toán (System Audit Trail)</strong> lưu trữ bất biến toàn bộ vết giao dịch, IP thiết bị, lịch sử bán FEFO, tiêu hủy và can thiệp danh mục của cửa hàng LHU Mart.
            <br />
            Chỉ vai trò <strong>Quản trị viên (Admin / Cửa Hàng Trưởng)</strong> mới có thẩm quyền tra cứu dữ liệu kiểm toán này.
          </p>
        </div>

        <button
          onClick={onRequestAdminLogin}
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 28px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 18px rgba(139, 92, 246, 0.45)',
            transition: 'all 0.2s'
          }}
        >
          <Lock size={16} />
          <span>Đăng nhập Admin để mở khóa</span>
        </button>
      </div>
    );
  }

  // Chuẩn hóa toàn bộ danh sách audit logs
  const normalizedLogs = useMemo(() => {
    return (auditLogs || []).map(normalizeLogRecord).filter(Boolean);
  }, [auditLogs]);

  // Bộ lọc dữ liệu theo nhóm hành động và từ khóa tìm kiếm
  const filteredLogs = useMemo(() => {
    return normalizedLogs.filter(log => {
      // Lọc theo nhóm hành vi
      if (selectedFilter !== 'ALL') {
        const act = (log.action || '').toUpperCase();
        if (selectedFilter === 'POS' && act !== 'POS_CHECKOUT') return false;
        if (selectedFilter === 'DC' && !['DC_INBOUND', 'CREATE_PURCHASE_ORDER', 'UPDATE_PO_STATUS'].includes(act)) return false;
        if (selectedFilter === 'DISPOSAL' && act !== 'SPOILAGE_DISPOSAL') return false;
        if (selectedFilter === 'SHELF' && !['ROTATE_SHELF_FEFO', 'QUICK_MARKDOWN'].includes(act)) return false;
        if (selectedFilter === 'CATALOG' && !['CREATE_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT'].includes(act)) return false;
        if (selectedFilter === 'SHIFT' && act !== 'SHIFT_HANDOVER') return false;
        if (selectedFilter === 'SECURITY' && !['LOGIN_FAILED', 'ACCOUNT_LOCKED_FAILED_ATTEMPTS', 'LOGIN', 'RESET_PASSWORD', 'CHANGE_PASSWORD', 'CREATE_USER', 'UPDATE_USER', 'LOCK_USER', 'UNLOCK_USER', 'UPDATE_STORE_PROFILE'].includes(act)) return false;
      }

      // Lọc theo từ khóa tìm kiếm đa trường
      if (!search.trim()) return true;
      const normSearch = stripVietnamese(search);
      const normUser = stripVietnamese(log.user);
      const normAction = stripVietnamese(log.action);
      const normDetails = stripVietnamese(log.details);
      const normIp = stripVietnamese(log.ip);
      const tokens = normSearch.split(/\s+/).filter(Boolean);

      return tokens.every(tok => 
        normUser.includes(tok) || 
        normAction.includes(tok) || 
        normDetails.includes(tok) ||
        normIp.includes(tok)
      );
    });
  }, [normalizedLogs, search, selectedFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header & Controls Panel */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
              <ScrollText size={22} color="var(--safe-green)" />
              Nhật Ký Kiểm Toán Hệ Thống (System Audit Trail)
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Truy vết toàn bộ thao tác nhập hàng DC, xuất bán FEFO, phê duyệt tiêu hủy và can thiệp danh mục.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => exportAuditLogsToExcel(filteredLogs)}
              title="Xuất Sổ nhật ký kiểm toán bất biến ra file Excel CSV (UTF-8 with BOM)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 15px',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Download size={15} color="var(--safe-green)" />
              <span>Xuất Excel ({filteredLogs.length})</span>
            </button>

            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input"
                style={{ paddingLeft: '36px', height: '40px', fontSize: '0.85rem' }}
                placeholder="Tìm log, người làm, SKU, IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
            <Filter size={14} /> Phân loại:
          </span>
          {[
            { id: 'ALL', label: `Tất cả (${normalizedLogs.length})` },
            { id: 'POS', label: 'Xuất Bán FEFO' },
            { id: 'DC', label: 'Tiếp Nhận DC & Đơn Hàng' },
            { id: 'DISPOSAL', label: 'Tiêu Hủy Hàng' },
            { id: 'SHELF', label: 'Đảo Kệ & Markdown' },
            { id: 'CATALOG', label: 'Danh Mục Sản Phẩm' },
            { id: 'SHIFT', label: 'Bàn Giao Ca' },
            { id: 'SECURITY', label: '🛡️ An Ninh & Bảo Mật' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: selectedFilter === tab.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: selectedFilter === tab.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: selectedFilter === tab.id ? '#ffffff' : 'var(--text-main)',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table Panel */}
      <div className="glass-panel" style={{ overflow: 'hidden', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', width: '180px' }}>
                  Thời Điểm & IP
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', width: '220px' }}>
                  Người Thực Hiện
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', width: '210px' }}>
                  Loại Hành Động
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Chi Tiết Giao Dịch & Vết Dữ Liệu
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <ScrollText size={36} style={{ opacity: 0.4 }} />
                      <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Không tìm thấy bản ghi kiểm toán phù hợp.</span>
                      <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Thử đổi từ khóa tìm kiếm hoặc bấm tab "Tất cả".</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const badge = getActionBadgeStyle(log.action);
                  return (
                    <tr 
                      key={log.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Cột 1: Thời điểm & IP */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {log.time}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                          IP: {log.ip}
                        </div>
                      </td>

                      {/* Cột 2: Người thực hiện */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                          <span>{log.user}</span>
                        </div>
                      </td>

                      {/* Cột 3: Loại hành động */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          whiteSpace: 'nowrap'
                        }}>
                          {badge.label}
                        </span>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'monospace' }}>
                          #{log.action}
                        </div>
                      </td>

                      {/* Cột 4: Chi tiết giao dịch */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                        <div>{log.details}</div>
                        {log.entityName && (
                          <div style={{ marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                            <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                              Thực thể: {log.entityName} {log.entityId ? `#${log.entityId}` : ''}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
