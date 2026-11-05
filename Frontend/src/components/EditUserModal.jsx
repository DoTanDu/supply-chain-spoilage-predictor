import React, { useState, useEffect, useRef } from 'react';
import { 
  UserCheck, 
  X, 
  Shield, 
  Store, 
  ShoppingCart, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  User, 
  Mail, 
  Phone,
  Save,
  UserCog
} from 'lucide-react';
import * as api from '../api';

export default function EditUserModal({ 
  isOpen, 
  onClose, 
  targetUser, 
  currentUser,
  onUserUpdated 
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleCode, setRoleCode] = useState('CASHIER');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const closeTimerRef = useRef(null);

  const isEditingSelf = currentUser?.id === targetUser?.id || currentUser?.username === targetUser?.username;

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen && targetUser) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setFullName(targetUser.fullName || '');
      setEmail(targetUser.email || '');
      setPhone(targetUser.phone || '');
      setRoleCode(targetUser.roleCode || 'CASHIER');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, targetUser]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName || fullName.trim().length < 2) {
      setErrorMessage('Họ và tên nhân viên phải có ít nhất 2 ký tự.');
      return;
    }

    if (isEditingSelf && roleCode !== 'ADMIN') {
      setErrorMessage('Quản trị viên không thể tự thay đổi vai trò của chính mình để tránh mất quyền quản trị.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.apiUpdateUser(targetUser.id, {
        fullName: fullName.trim(),
        email: email ? email.trim() : '',
        phone: phone ? phone.trim() : '',
        roleCode
      });

      if (res && res.success) {
        setSuccessMessage(res.message || 'Cập nhật thông tin nhân viên thành công!');
        closeTimerRef.current = setTimeout(() => {
          if (onUserUpdated) onUserUpdated(res.data);
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res?.message || 'Không thể cập nhật thông tin nhân viên.');
      }
    } catch (err) {
      console.error('Lỗi cập nhật nhân viên:', err);
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ khi cập nhật thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { code: 'ADMIN', label: 'Chủ Chuỗi / Admin', icon: Shield, color: '#7c3aed', desc: 'Toàn quyền cấu hình chuỗi chi nhánh, quản trị nhân sự, xem báo cáo' },
    { code: 'STORE_MANAGER', label: 'Quản Lý Cửa Hàng', icon: Store, color: '#4f46e5', desc: 'Điều hành cửa hàng, duyệt giảm giá xả hàng, duyệt tiêu hủy & đặt hàng DC' },
    { code: 'CASHIER', label: 'Nhân Viên Cửa Hàng', icon: ShoppingCart, color: '#2563eb', desc: 'Bán lẻ POS chuẩn FEFO, tiếp nhận hàng DC, đảo kệ mặt tiền & bàn giao ca' }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-surface-elevated, #ffffff)',
        color: 'var(--text-main, #0f172a)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        border: '1px solid var(--border-color, #cbd5e1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '94vh',
        position: 'relative'
      }}>
        {/* Header Modal */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-subtle, #f8fafc)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(79, 70, 229, 0.12)',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserCog size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.975rem', fontWeight: 800 }}>CHỈNH SỬA THÔNG TIN NHÂN SỰ</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748b)' }}>
                Cập nhật hồ sơ & thay đổi vai trò RBAC cho nhân viên (Giai đoạn 3)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #64748b)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
            title="Đóng (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nội dung Form */}
        <form onSubmit={handleSubmit} style={{ padding: '22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Tên đăng nhập (Bất biến) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, marginBottom: '6px' }}>
              Tên đăng nhập (Định danh hệ thống):
            </label>
            <input
              type="text"
              value={`@${targetUser.username}`}
              disabled
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                background: 'var(--bg-app, #f1f5f9)',
                color: 'var(--text-muted, #64748b)',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box',
                cursor: 'not-allowed'
              }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', marginTop: '3px' }}>
              * Tên đăng nhập cố định để đảm bảo tính toàn vẹn của Nhật ký kiểm toán.
            </div>
          </div>

          {/* Họ và Tên */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, marginBottom: '6px' }}>
              Họ và tên nhân sự: <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Nhập họ và tên đầy đủ..."
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #64748b)' }} />
            </div>
          </div>

          {/* Email & Số Điện Thoại */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, marginBottom: '6px' }}>
                Địa chỉ Email:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nhanvien@lhumart.vn"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <Mail size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #64748b)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, marginBottom: '6px' }}>
                Số điện thoại:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="09xx xxx xxx"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <Phone size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #64748b)' }} />
              </div>
            </div>
          </div>

          {/* Chọn Vai Trò RBAC */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, marginBottom: '8px' }}>
              Vai trò & Thẩm quyền RBAC: <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {roles.map(r => {
                const IconComponent = r.icon;
                const isSelected = roleCode === r.code;
                const isDisabled = isEditingSelf && r.code !== 'ADMIN';

                return (
                  <div
                    key={r.code}
                    onClick={() => {
                      if (!isDisabled) setRoleCode(r.code);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid',
                      borderColor: isSelected ? r.color : 'var(--border-subtle, #e2e8f0)',
                      background: isSelected ? `${r.color}10` : 'var(--bg-surface, #ffffff)',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.15s ease',
                      opacity: isDisabled ? 0.5 : 1
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${r.color}20`,
                      color: r.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconComponent size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isSelected ? r.color : 'var(--text-main, #0f172a)' }}>
                        {r.label}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                        {r.desc}
                      </div>
                    </div>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: isSelected ? r.color : '#cbd5e1',
                      background: isSelected ? r.color : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
            {isEditingSelf && (
              <div style={{ fontSize: '0.7rem', color: '#ea580c', marginTop: '6px' }}>
                ⚠️ Bạn đang xem tài khoản của chính mình. Quản trị viên không thể tự thay đổi vai trò để tránh mất quyền quản trị.
              </div>
            )}
          </div>

          {/* Thông báo lỗi */}
          {errorMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#dc2626',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Thông báo thành công */}
          {successMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#059669',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '8px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-subtle, #e2e8f0)'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                background: 'var(--bg-surface, #ffffff)',
                color: 'var(--text-secondary, #475569)',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#4f46e5',
                color: '#ffffff',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Lưu Thay Đổi</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
