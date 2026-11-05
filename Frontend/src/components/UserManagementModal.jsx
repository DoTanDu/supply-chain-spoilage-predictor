import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Search, 
  RefreshCw, 
  Store, 
  ShoppingCart, 
  Truck, 
  User, 
  Clock, 
  Filter,
  ShieldAlert,
  Info,
  UserPlus
} from 'lucide-react';
import * as api from '../api';
import CreateUserModal from './CreateUserModal';

export default function UserManagementModal({ 
  isOpen, 
  onClose, 
  currentUser,
  onUserStatusChanged 
}) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [confirmTarget, setConfirmTarget] = useState(null); // { user, action: 'LOCK' | 'UNLOCK' }
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null); // { type: 'success' | 'error', text }
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setAlertMessage(null);
      setConfirmTarget(null);
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.apiGetUsers();
      if (res && res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setAlertMessage({ type: 'error', text: res?.message || 'Không thể tải danh sách tài khoản.' });
      }
    } catch (err) {
      console.error('Lỗi tải người dùng:', err);
      setAlertMessage({ type: 'error', text: 'Lỗi kết nối máy chủ khi lấy danh sách nhân sự.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmTarget) return;
    const { user, action } = confirmTarget;
    const newActive = action === 'UNLOCK';

    setActionLoading(true);
    setAlertMessage(null);

    try {
      const res = await api.apiToggleUserStatus(user.id, newActive);
      if (res && res.success) {
        setAlertMessage({ 
          type: 'success', 
          text: action === 'LOCK' 
            ? `Đã khóa thành công tài khoản "${user.fullName}" (${user.username}). Hành động đã được ghi vào Nhật ký kiểm toán.` 
            : `Đã mở khóa thành công cho tài khoản "${user.fullName}" (${user.username}).`
        });
        setConfirmTarget(null);
        await loadUsers();
        if (onUserStatusChanged) onUserStatusChanged();
      } else {
        setAlertMessage({ type: 'error', text: res?.message || 'Thao tác không thành công.' });
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái người dùng:', err);
      setAlertMessage({ type: 'error', text: err.message || 'Lỗi kết nối khi gửi yêu cầu khóa/mở khóa.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

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
      case 'WAREHOUSE_STAFF':
        return { label: 'Nhân Viên Cửa Hàng', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: ShoppingCart };
      default:
        return { label: roleCode || 'Nhân Viên', color: '#475569', bg: '#f1f5f9', border: '#e2e8f0', icon: User };
    }
  };

  const totalCount = users.length;
  const activeCount = users.filter(u => u.isActive).length;
  const lockedCount = users.filter(u => !u.isActive).length;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'var(--modal-backdrop, rgba(0, 0, 0, 0.65))',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '960px',
        width: '100%',
        background: 'var(--bg-surface-elevated, #ffffff)',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        boxShadow: 'var(--shadow-elevated, 0 20px 25px -5px rgba(0, 0, 0, 0.2))',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        overflow: 'hidden',
        color: 'var(--text-main, #1e293b)'
      }}>
        
        {/* Header Modal */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-subtle, #f8fafc)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#f5f3ff',
              border: '1px solid #ddd6fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7c3aed'
            }}>
              <Users size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                Quản Trị Nhân Sự & Khóa Tài Khoản (RBAC)
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                Kiểm soát quyền truy cập, danh tính và trạng thái tài khoản theo Ma trận Phân quyền
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Đóng cửa sổ"
          >
            <X size={20} />
          </button>
        </div>

        {/* Thống kê nhanh & Filter Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle, #e2e8f0)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Thẻ thống kê */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>Tổng số tài khoản</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>{totalCount}</div>
              </div>
              <Users size={20} color="var(--text-muted, #64748b)" />
            </div>

            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Đang hoạt động</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{activeCount}</div>
              </div>
              <CheckCircle2 size={20} color="#10b981" />
            </div>

            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Đã khóa tài khoản</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>{lockedCount}</div>
              </div>
              <Lock size={20} color="#ef4444" />
            </div>
          </div>

          {/* Alert Message Toast */}
          {alertMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: alertMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${alertMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: alertMessage.type === 'success' ? '#059669' : '#dc2626',
              fontSize: '0.825rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {alertMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{alertMessage.text}</span>
            </div>
          )}

          {/* Tìm kiếm & Bộ lọc vai trò */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={16} color="var(--text-muted, #94a3b8)" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="text"
                placeholder="Tìm kiếm nhân sự theo họ tên, username hoặc email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  background: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} color="var(--text-muted, #64748b)" />
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  background: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="ADMIN">Chủ Chuỗi / Admin</option>
                <option value="STORE_MANAGER">Quản Lý Cửa Hàng</option>
                <option value="CASHIER">Nhân Viên Cửa Hàng</option>
              </select>
            </div>

              <button
                onClick={loadUsers}
                disabled={isLoading}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  background: 'var(--bg-subtle, #f1f5f9)',
                  color: 'var(--text-main, #334155)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600
                }}
                title="Làm mới danh sách"
              >
                <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
                <span>Tải lại</span>
              </button>

              {currentUser?.roleCode === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#7c3aed',
                    color: '#ffffff',
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
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

        {/* Nội dung danh sách nhân sự */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {isLoading && users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted, #64748b)' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
              <div>Đang tải danh sách tài khoản từ SQL Server...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted, #64748b)' }}>
              <Users size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
              <div>Không tìm thấy tài khoản nào phù hợp với bộ lọc.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle, #e2e8f0)', color: 'var(--text-muted, #64748b)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Nhân viên</th>
                  <th style={{ padding: '10px 12px' }}>Tên đăng nhập</th>
                  <th style={{ padding: '10px 12px' }}>Vai trò RBAC</th>
                  <th style={{ padding: '10px 12px' }}>Đăng nhập cuối</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Thao tác Admin</th>
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
                        borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
                        background: !user.isActive ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Nhân viên */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: roleBadge.bg,
                            border: `1px solid ${roleBadge.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: roleBadge.color
                          }}>
                            <RoleIcon size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                              {user.fullName}
                              {isCurrent && (
                                <span style={{
                                  marginLeft: '6px',
                                  fontSize: '0.675rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: 'var(--primary-bg, #ede9fe)',
                                  color: 'var(--primary, #6d28d9)',
                                  fontWeight: 700
                                }}>
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748b)' }}>
                              {user.email || user.phone || 'Không có email'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td style={{ padding: '12px' }}>
                        <code style={{
                          padding: '3px 6px',
                          borderRadius: '4px',
                          background: 'var(--bg-subtle, #f1f5f9)',
                          border: '1px solid var(--border-subtle, #e2e8f0)',
                          fontSize: '0.8rem',
                          color: 'var(--text-main, #334155)',
                          fontFamily: 'monospace',
                          fontWeight: 600
                        }}>
                          {user.username}
                        </code>
                      </td>

                      {/* Vai trò */}
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: roleBadge.bg,
                          color: roleBadge.color,
                          border: `1px solid ${roleBadge.border}`,
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          <RoleIcon size={12} />
                          <span>{roleBadge.label}</span>
                        </span>
                      </td>

                      {/* Lần đăng nhập cuối */}
                      <td style={{ padding: '12px', color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>
                        {user.lastLogin ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            <span>{new Date(user.lastLogin).toLocaleString('vi-VN')}</span>
                          </div>
                        ) : (
                          <span>Chưa có lượt đăng nhập</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {user.isActive ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            fontSize: '0.725rem',
                            fontWeight: 700
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                            <span>Đang hoạt động</span>
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            fontSize: '0.725rem',
                            fontWeight: 700
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                            <span>Đã bị khóa</span>
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {isCurrent ? (
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted, #94a3b8)',
                            fontStyle: 'italic',
                            padding: '4px 8px'
                          }}>
                            Tài khoản hiện tại
                          </span>
                        ) : user.isActive ? (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ user, action: 'LOCK' })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              background: 'rgba(239, 68, 68, 0.08)',
                              color: '#dc2626',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title={`Khóa quyền truy cập của nhân viên ${user.fullName}`}
                          >
                            <Lock size={13} />
                            <span>Khóa tài khoản</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ user, action: 'UNLOCK' })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              background: 'rgba(16, 185, 129, 0.08)',
                              color: '#059669',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title={`Mở khóa quyền truy cập cho nhân viên ${user.fullName}`}
                          >
                            <Unlock size={13} />
                            <span>Mở khóa</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Modal */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-subtle, #e2e8f0)',
          background: 'var(--bg-subtle, #f8fafc)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted, #64748b)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={14} color="#7c3aed" />
            <span>
              Mọi hành vi Khóa hoặc Mở khóa tài khoản đều được ghi nhận vào <strong>Sổ Nhật ký Kiểm toán</strong> để đối soát an ninh.
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle, #cbd5e1)',
              background: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-main, #334155)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>

        {/* Modal Xác nhận Khóa / Mở khóa (Confirmation Modal) */}
        {confirmTarget && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 10000
          }}>
            <div style={{
              maxWidth: '460px',
              width: '100%',
              background: 'var(--bg-surface-elevated, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              padding: '24px',
              boxShadow: 'var(--shadow-elevated, 0 20px 25px -5px rgba(0,0,0,0.3))',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: confirmTarget.action === 'LOCK' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  border: `1px solid ${confirmTarget.action === 'LOCK' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: confirmTarget.action === 'LOCK' ? '#ef4444' : '#10b981'
                }}>
                  {confirmTarget.action === 'LOCK' ? <Lock size={22} /> : <Unlock size={22} />}
                </div>

                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                    {confirmTarget.action === 'LOCK' ? 'Xác nhận Khóa Tài Khoản?' : 'Xác nhận Mở Khóa Tài Khoản?'}
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.775rem', color: 'var(--text-muted, #64748b)' }}>
                    Nhân viên: <strong style={{ color: 'var(--text-main, #0f172a)' }}>{confirmTarget.user.fullName}</strong> ({confirmTarget.user.username})
                  </p>
                </div>
              </div>

              <div style={{
                padding: '12px',
                borderRadius: '8px',
                background: confirmTarget.action === 'LOCK' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(16, 185, 129, 0.06)',
                border: `1px solid ${confirmTarget.action === 'LOCK' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                fontSize: '0.8rem',
                lineHeight: 1.5,
                color: 'var(--text-main, #334155)'
              }}>
                {confirmTarget.action === 'LOCK' ? (
                  <>
                    ⚠️ Khi tài khoản bị <strong>KHÓA</strong>: Nhân viên này sẽ không thể đăng nhập vào quầy POS hay hệ thống kho hàng LHU Mart. Phiên làm việc sẽ bị chấm dứt ngay lập tức.
                  </>
                ) : (
                  <>
                    ✅ Khi được <strong>MỞ KHÓA</strong>: Nhân viên sẽ có thể đăng nhập bình thường vào hệ thống với vai trò <strong>{confirmTarget.user.roleCode}</strong>.
                  </>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setConfirmTarget(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle, #cbd5e1)',
                    background: 'var(--bg-subtle, #f1f5f9)',
                    color: 'var(--text-main, #334155)',
                    fontSize: '0.825rem',
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
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: confirmTarget.action === 'LOCK' ? '#ef4444' : '#10b981',
                    color: '#ffffff',
                    fontSize: '0.825rem',
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
                      <span>Đang xử lý...</span>
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

      </div>
    </div>
  );
}
