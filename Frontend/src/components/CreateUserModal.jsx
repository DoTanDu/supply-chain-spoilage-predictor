import React, { useState, useRef, useEffect } from 'react';
import { 
  UserPlus, 
  X, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Shield, 
  Store, 
  ShoppingCart, 
  Truck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { apiCreateUser } from '../api';

export default function CreateUserModal({ isOpen, onClose, onUserCreated }) {
  if (!isOpen) return null;

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [roleCode, setRoleCode] = useState('CASHIER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const closeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const rolesConfig = [
    {
      code: 'CASHIER',
      label: 'Nhân Viên Cửa Hàng',
      roleName: 'Nhân viên cửa hàng (POS & Kho kệ)',
      icon: ShoppingCart,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.3)',
      desc: 'Bán lẻ POS chuẩn FEFO, tiếp nhận xe DC, đảo kệ & bàn giao ca trực'
    },
    {
      code: 'STORE_MANAGER',
      label: 'Quản Lý Cửa Hàng',
      roleName: 'Cửa hàng trưởng',
      icon: Store,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.3)',
      desc: 'Duyệt PO đặt hàng DC, duyệt tiêu hủy & theo dõi 6 KPI'
    },
    {
      code: 'ADMIN',
      label: 'Quản Trị Viên',
      roleName: 'Quản trị viên (Admin)',
      icon: Shield,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.08)',
      border: 'rgba(139, 92, 246, 0.3)',
      desc: 'Toàn quyền cấu hình tham số, quản lý nhân sự & audit log'
    }
  ];

  const isUsernameValid = /^[a-z0-9_.-]{3,30}$/.test(username.trim().toLowerCase());
  const isPasswordValid = password.length >= 6;
  const isPasswordMatch = password.length > 0 && password === confirmPassword;

  const handleReset = () => {
    setUsername('');
    setFullName('');
    setRoleCode('CASHIER');
    setPassword('');
    setConfirmPassword('');
    setEmail('');
    setPhone('');
    setErrorMsg('');
    setSuccessMsg('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    handleReset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      setErrorMsg('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!isUsernameValid) {
      setErrorMsg('Tên đăng nhập phải có từ 3 đến 30 ký tự, chỉ chứa chữ thường, số, dấu gạch dưới hoặc gạch nối.');
      return;
    }

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Vui lòng nhập họ và tên nhân sự (tối thiểu 2 ký tự).');
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg('Mật khẩu khởi tạo phải có tối thiểu 6 ký tự để đảm bảo an toàn.');
      return;
    }

    if (!isPasswordMatch) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: cleanUser,
        fullName: fullName.trim(),
        password,
        roleCode,
        email: email.trim() || null,
        phone: phone.trim() || null
      };

      const res = await apiCreateUser(payload);
      if (res && res.success) {
        setSuccessMsg(res.message || 'Đã tạo tài khoản nhân sự mới thành công!');
        if (onUserCreated) onUserCreated(res.data);
        closeTimerRef.current = setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setErrorMsg(res?.message || 'Không thể tạo tài khoản. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ khi tạo tài khoản nhân sự.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'var(--modal-backdrop)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 120,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-elevated)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(124, 58, 237, 0.1)',
              border: '1px solid rgba(124, 58, 237, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7c3aed'
            }}>
              <UserPlus size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Thêm Mới Tài Khoản Nhân Sự
              </h3>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Khởi tạo danh tính & phân quyền theo chuẩn RBAC
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--danger-red-bg)',
            border: '1px solid var(--danger-red-border)',
            color: 'var(--danger-red)',
            fontSize: '0.785rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            fontSize: '0.785rem'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Row 1: Username & Full Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Tên đăng nhập (Username): <span style={{ color: 'var(--danger-red)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <User size={15} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="ví dụ: cashier_ca2"
                  disabled={loading}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 34px',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle)',
                    border: `1px solid ${username.length > 0 && !isUsernameValid ? 'var(--danger-red)' : 'var(--border-color)'}`,
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                3-30 ký tự (a-z, 0-9, _, -)
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Họ và tên nhân sự: <span style={{ color: 'var(--danger-red)' }}>*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ví dụ: Nguyễn Văn An"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '8px 12px',
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

          {/* Role Selection Cards */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Vai trò & Thẩm quyền ca trực (RBAC): <span style={{ color: 'var(--danger-red)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {rolesConfig.map(r => {
                const isSelected = roleCode === r.code;
                const IconComponent = r.icon;
                return (
                  <div
                    key={r.code}
                    onClick={() => setRoleCode(r.code)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: isSelected ? r.bg : 'var(--bg-subtle)',
                      border: `1.5px solid ${isSelected ? r.color : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconComponent size={15} color={r.color} />
                        <span style={{ fontSize: '0.825rem', fontWeight: 700, color: isSelected ? r.color : 'var(--text-main)' }}>
                          {r.label}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 size={14} color={r.color} />}
                    </div>
                    <div style={{ fontSize: '0.675rem', color: 'var(--text-dim)', lineHeight: 1.3 }}>
                      {r.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 2: Password & Confirm Password */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Mật khẩu khởi tạo: <span style={{ color: 'var(--danger-red)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự..."
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '8px 34px 8px 34px',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle)',
                    border: `1px solid ${password.length > 0 && !isPasswordValid ? 'var(--danger-red)' : 'var(--border-color)'}`,
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '3px'
                  }}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginTop: '4px',
                  fontSize: '0.72rem',
                  color: isPasswordValid ? '#10b981' : 'var(--danger-red)'
                }}>
                  <CheckCircle2 size={12} />
                  <span>{isPasswordValid ? 'Độ dài đạt chuẩn (≥ 6 ký tự)' : 'Chưa đủ 6 ký tự'}</span>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Xác nhận mật khẩu: <span style={{ color: 'var(--danger-red)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Lock size={15} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu..."
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '8px 34px 8px 34px',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle)',
                    border: `1px solid ${confirmPassword.length > 0 && !isPasswordMatch ? 'var(--danger-red)' : 'var(--border-color)'}`,
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '3px'
                  }}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginTop: '4px',
                  fontSize: '0.72rem',
                  color: isPasswordMatch ? '#10b981' : 'var(--danger-red)'
                }}>
                  <CheckCircle2 size={12} />
                  <span>{isPasswordMatch ? 'Mật khẩu xác nhận khớp' : 'Mật khẩu xác nhận chưa khớp'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Email & Phone (Optional) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Email liên hệ:
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nhanvien@lhumart.edu.vn"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 34px',
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

            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Số điện thoại liên hệ:
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Phone size={15} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 34px',
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
          </div>

          {/* Security Note */}
          <div style={{
            fontSize: '0.72rem',
            color: 'var(--text-dim)',
            lineHeight: 1.4,
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border-subtle)'
          }}>
            Hệ thống tự động kích hoạt tài khoản ngay sau khi tạo và ghi vết người thực hiện vào Sổ kiểm toán bất biến.
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: loading ? 'var(--text-dim)' : '#7c3aed',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              {loading ? (
                <span>Đang tạo tài khoản...</span>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>Tạo tài khoản nhân sự</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
