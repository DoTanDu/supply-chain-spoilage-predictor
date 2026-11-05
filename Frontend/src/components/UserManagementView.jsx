import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  Store, 
  ShoppingCart, 
  Truck, 
  User, 
  Clock, 
  Filter,
  ShieldCheck,
  ShieldAlert,
  Info,
  ScrollText,
  UserCheck,
  UserX,
  UserPlus,
  KeyRound,
  Edit3
} from 'lucide-react';
import * as api from '../api';
import CreateUserModal from './CreateUserModal';
import ResetPasswordModal from './ResetPasswordModal';
import EditUserModal from './EditUserModal';

export default function UserManagementView({ 
  currentUser, 
  isAdmin, 
  onNavigateToAuditLog 
}) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [confirmTarget, setConfirmTarget] = useState(null); // { user, action: 'LOCK' | 'UNLOCK' }
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null);
  const [editUserTarget, setEditUserTarget] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.apiGetUsers();
      if (res && res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setToastMessage({ type: 'error', text: res?.message || 'Không thể tải danh sách tài khoản từ máy chủ.' });
      }
    } catch (err) {
      console.error('Lỗi tải người dùng:', err);
      setToastMessage({ type: 'error', text: 'Lỗi kết nối máy chủ SQL Server khi tải danh sách nhân sự.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmTarget) return;
    const { user, action } = confirmTarget;
    const newActive = action === 'UNLOCK';

    setActionLoading(true);
    setToastMessage(null);

    try {
      const res = await api.apiToggleUserStatus(user.id, newActive);
      if (res && res.success) {
        setToastMessage({ 
          type: 'success', 
          text: action === 'LOCK' 
            ? `Đã khóa thành công tài khoản "${user.fullName}" (${user.username}). Hành động đã được ghi vào Nhật ký kiểm toán.` 
            : `Đã mở khóa thành công cho tài khoản "${user.fullName}" (${user.username}).`
        });
        setConfirmTarget(null);
        await loadUsers();
      } else {
        setToastMessage({ type: 'error', text: res?.message || 'Thao tác không thành công.' });
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái người dùng:', err);
      setToastMessage({ type: 'error', text: err.message || 'Lỗi kết nối khi gửi yêu cầu khóa/mở khóa.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Lọc danh sách nhân sự
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || u.roleCode === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (roleCode) => {
    switch (roleCode) {
      case 'ADMIN':
        return { label: 'Chủ Chuỗi / Admin', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: Shield };
      case 'STORE_MANAGER':
        return { label: 'Quản Lý Cửa Hàng', color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', icon: Store };
      case 'CASHIER':
      case 'STAFF':
        return { label: 'Nhân Viên Cửa Hàng', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: ShoppingCart };
      default:
        return { label: roleCode || 'Nhân Viên', color: '#475569', bg: '#f1f5f9', border: '#e2e8f0', icon: User };
    }
  };

  const totalCount = users.length;
  const activeCount = users.filter(u => u.isActive).length;
  const lockedCount = users.filter(u => !u.isActive).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      
      {/* Header View */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(124, 58, 237, 0.1)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7c3aed'
          }}>
            <Users size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Quản Trị Tài Khoản & Phân Quyền Nhân Sự (RBAC)
              </h2>
              <span style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(124, 58, 237, 0.12)',
                color: '#7c3aed',
                fontWeight: 700,
                border: '1px solid rgba(124, 58, 237, 0.3)'
              }}>
                Chỉ Admin
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Quản lý tài khoản, danh tính và quyền khóa/mở khóa tức thì phục vụ bảo mật ca trực
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onNavigateToAuditLog && (
            <button
              onClick={onNavigateToAuditLog}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Xem lịch sử ghi vết kiểm toán các thao tác khóa/mở khóa"
            >
              <ScrollText size={16} color="#4f46e5" />
              <span>Sổ Nhật Ký Kiểm Toán</span>
            </button>
          )}

          <button
            onClick={loadUsers}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Đồng Bộ LocalDB</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '10px',
                border: 'none',
                background: '#7c3aed',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.35)',
                transition: 'all 0.15s ease'
              }}
              title="Thêm mới tài khoản nhân sự"
            >
              <UserPlus size={16} />
              <span>+ Thêm Tài Khoản</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Thống kê */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tổng Số Tài Khoản Cửa Hàng</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              {totalCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>nhân sự</span>
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              3 nhóm vai trò (Admin, Quản lý, Nhân viên Cửa hàng)
            </div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}>
            <Users size={24} />
          </div>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Tài Khoản Đang Hoạt Động</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {activeCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#10b981' }}>tài khoản</span>
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Được phép đăng nhập quầy POS & quản trị kho
            </div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <UserCheck size={24} />
          </div>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>Tài Khoản Bị Khóa (Đóng Băng)</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
              {lockedCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#ef4444' }}>tài khoản</span>
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Bị từ chối đăng nhập mọi phân hệ hệ thống
            </div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <UserX size={24} />
          </div>
        </div>
      </div>

      {/* Toast Alert Message */}
      {toastMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: toastMessage.type === 'success' ? '#059669' : '#dc2626',
          fontSize: '0.875rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Filter bar */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'var(--bg-subtle)'
        }}>
          <div style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            maxWidth: '460px'
          }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              placeholder="Tìm kiếm theo họ tên, username, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="var(--text-muted)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Lọc vai trò:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              <option value="ALL">Tất cả ({totalCount})</option>
              <option value="ADMIN">Chủ Chuỗi / Admin</option>
              <option value="STORE_MANAGER">Quản Lý Cửa Hàng</option>
              <option value="CASHIER">Nhân Viên Cửa Hàng</option>
            </select>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#7c3aed',
                  color: '#ffffff',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)',
                  whiteSpace: 'nowrap'
                }}
                title="Tạo tài khoản nhân sự mới"
              >
                <UserPlus size={15} />
                <span>+ Thêm Nhân Sự</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          {isLoading && users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
              <div>Đang tải danh sách tài khoản từ SQL Server...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
              <Users size={36} style={{ opacity: 0.5, marginBottom: '10px' }} />
              <div>Không tìm thấy tài khoản nhân viên nào phù hợp.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  background: 'var(--bg-secondary)'
                }}>
                  <th style={{ padding: '14px 18px' }}>Nhân Viên</th>
                  <th style={{ padding: '14px 18px' }}>Tên Đăng Nhập</th>
                  <th style={{ padding: '14px 18px' }}>Vai Trò RBAC</th>
                  <th style={{ padding: '14px 18px' }}>Đăng Nhập Cuối</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Thao Tác Admin</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const roleBadge = getRoleBadge(user.roleCode);
                  const RoleIcon = roleBadge.icon;
                  const isCurrent = currentUser?.id === user.id || currentUser?.username === user.username;

                  return (
                    <tr 
                      key={user.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border-subtle)',
                        background: !user.isActive ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Nhân viên */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: roleBadge.bg,
                            border: `1px solid ${roleBadge.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: roleBadge.color
                          }}>
                            <RoleIcon size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{user.fullName}</span>
                              {isCurrent && (
                                <span style={{
                                  fontSize: '0.675rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: 'var(--primary-bg)',
                                  color: 'var(--primary)',
                                  fontWeight: 700
                                }}>
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {user.email || user.phone || 'Chưa cập nhật email'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td style={{ padding: '14px 18px' }}>
                        <code style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.825rem',
                          color: 'var(--text-main)',
                          fontFamily: 'monospace',
                          fontWeight: 600
                        }}>
                          {user.username}
                        </code>
                      </td>

                      {/* Vai trò */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: roleBadge.bg,
                          color: roleBadge.color,
                          border: `1px solid ${roleBadge.border}`,
                          fontSize: '0.775rem',
                          fontWeight: 700
                        }}>
                          <RoleIcon size={13} />
                          <span>{roleBadge.label}</span>
                        </span>
                      </td>

                      {/* Lần đăng nhập cuối */}
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                        {user.lastLogin ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={13} />
                            <span>{new Date(user.lastLogin).toLocaleString('vi-VN')}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Chưa đăng nhập lần nào</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {user.isActive ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                            <span>Đang hoạt động</span>
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                            <span>Đã bị khóa</span>
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {isCurrent ? (
                          <span style={{
                            fontSize: '0.775rem',
                            color: 'var(--text-muted)',
                            fontStyle: 'italic',
                            padding: '4px 8px'
                          }}>
                            (Tài khoản hiện tại)
                          </span>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {/* Nút Chỉnh sửa Thông tin & Vai trò (Giai đoạn 3) */}
                            <button
                              type="button"
                              onClick={() => setEditUserTarget(user)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid rgba(79, 70, 229, 0.35)',
                                background: 'rgba(79, 70, 229, 0.08)',
                                color: '#4f46e5',
                                fontSize: '0.775rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title={`Chỉnh sửa thông tin & vai trò của ${user.fullName} (${user.username})`}
                            >
                              <Edit3 size={13} />
                              <span>Sửa</span>
                            </button>

                            {/* Nút Đặt lại Mật khẩu (Giai đoạn 1) */}
                            <button
                              type="button"
                              onClick={() => setResetPasswordTarget(user)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid rgba(234, 88, 12, 0.35)',
                                background: 'rgba(234, 88, 12, 0.08)',
                                color: '#ea580c',
                                fontSize: '0.775rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title={`Đặt lại mật khẩu cho ${user.fullName} (${user.username})`}
                            >
                              <KeyRound size={13} />
                              <span>Đặt lại MK</span>
                            </button>

                            {user.isActive ? (
                              <button
                                type="button"
                                onClick={() => setConfirmTarget({ user, action: 'LOCK' })}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(239, 68, 68, 0.35)',
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  color: '#dc2626',
                                  fontSize: '0.775rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title={`Khóa tài khoản ${user.fullName} (${user.username})`}
                              >
                                <Lock size={14} />
                                <span>Khóa tài khoản</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmTarget({ user, action: 'UNLOCK' })}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                  background: 'rgba(16, 185, 129, 0.08)',
                                  color: '#059669',
                                  fontSize: '0.775rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title={`Mở khóa tài khoản ${user.fullName} (${user.username})`}
                              >
                                <Unlock size={14} />
                                <span>Mở khóa tài khoản</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '14px 20px',
          background: 'var(--bg-subtle)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.775rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Info size={15} color="#7c3aed" />
          <span>
            Quy tắc bảo mật Chuẩn Tự Động: Thao tác Khóa hoặc Mở khóa tài khoản của Quản trị viên được mã hóa ghi vết bất biến vào bảng <code>system_audit_logs</code> với địa chỉ IP và mã người thực hiện.
          </span>
        </div>
      </div>

      {/* Confirmation Dialog Popup */}
      {confirmTarget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--modal-backdrop, rgba(0, 0, 0, 0.6))',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 10000
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: 'var(--bg-surface-elevated, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            padding: '24px',
            boxShadow: 'var(--shadow-elevated, 0 20px 25px -5px rgba(0,0,0,0.3))',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: confirmTarget.action === 'LOCK' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${confirmTarget.action === 'LOCK' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: confirmTarget.action === 'LOCK' ? '#ef4444' : '#10b981'
              }}>
                {confirmTarget.action === 'LOCK' ? <Lock size={24} /> : <Unlock size={24} />}
              </div>

              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                  {confirmTarget.action === 'LOCK' ? 'Xác nhận Khóa Tài Khoản Nhân Viên?' : 'Xác nhận Mở Khóa Tài Khoản?'}
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                  Đối tượng: <strong style={{ color: 'var(--text-main, #0f172a)' }}>{confirmTarget.user.fullName}</strong> ({confirmTarget.user.username})
                </p>
              </div>
            </div>

            <div style={{
              padding: '14px',
              borderRadius: '10px',
              background: confirmTarget.action === 'LOCK' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(16, 185, 129, 0.06)',
              border: `1px solid ${confirmTarget.action === 'LOCK' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
              fontSize: '0.825rem',
              lineHeight: 1.5,
              color: 'var(--text-main, #334155)'
            }}>
              {confirmTarget.action === 'LOCK' ? (
                <>
                  ⚠️ Khi tài khoản bị <strong>KHÓA</strong>: Nhân viên này sẽ không thể đăng nhập vào quầy POS bán lẻ, quản lý kho hoặc truy cập hệ thống LHU Mart. Mọi phiên đăng nhập hiện hữu sẽ bị từ chối truy cập.
                </>
              ) : (
                <>
                  ✅ Khi được <strong>MỞ KHÓA</strong>: Nhân viên này sẽ có thể đăng nhập bình thường vào hệ thống với vai trò <strong>{confirmTarget.user.roleCode}</strong>.
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmTarget(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  background: 'var(--bg-subtle, #f1f5f9)',
                  color: 'var(--text-main, #334155)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleToggleStatus}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: confirmTarget.action === 'LOCK' ? '#ef4444' : '#10b981',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: confirmTarget.action === 'LOCK' 
                    ? '0 2px 6px rgba(239, 68, 68, 0.35)' 
                    : '0 2px 6px rgba(16, 185, 129, 0.35)'
                }}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Đang cập nhật...</span>
                  </>
                ) : confirmTarget.action === 'LOCK' ? (
                  <>
                    <Lock size={14} />
                    <span>Xác nhận Khóa</span>
                  </>
                ) : (
                  <>
                    <Unlock size={14} />
                    <span>Xác nhận Mở khóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={() => loadUsers()}
      />

      {/* Reset Password Modal (Giai đoạn 1: Admin Đặt lại Mật khẩu Nhân sự) */}
      <ResetPasswordModal
        isOpen={!!resetPasswordTarget}
        onClose={() => setResetPasswordTarget(null)}
        targetUser={resetPasswordTarget}
        onSuccess={(res) => {
          setToastMessage({
            type: 'success',
            text: res.message || 'Đã đặt lại mật khẩu nhân viên thành công!'
          });
          loadUsers();
        }}
      />

      {/* Edit User Modal (Giai đoạn 3: Chỉnh sửa thông tin & vai trò nhân sự) */}
      <EditUserModal
        isOpen={!!editUserTarget}
        onClose={() => setEditUserTarget(null)}
        targetUser={editUserTarget}
        currentUser={currentUser}
        onUserUpdated={(updated) => {
          setToastMessage({
            type: 'success',
            text: `Đã cập nhật thành công thông tin nhân viên "${updated.fullName}".`
          });
          loadUsers();
        }}
      />

    </div>
  );
}
