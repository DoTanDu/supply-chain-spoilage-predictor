import React, { useState } from 'react';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { apiChangePassword } from '../api';

export default function ChangePasswordModal({ isOpen, onClose, currentUser }) {
  if (!isOpen) return null;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isLengthValid = newPassword.length >= 6;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isNotSameAsOld = newPassword.length > 0 && oldPassword.length > 0 && newPassword !== oldPassword;

  const handleReset = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
    setShowOldPass(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!oldPassword.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (!newPassword) {
      setErrorMsg('Vui lòng nhập mật khẩu mới.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự để đảm bảo an toàn.');
      return;
    }

    if (newPassword === oldPassword) {
      setErrorMsg('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiChangePassword(oldPassword, newPassword, confirmPassword);
      if (res && res.success) {
        setSuccessMsg(res.message || 'Đổi mật khẩu thành công!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          handleClose();
        }, 1800);
      } else {
        setErrorMsg(res?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ khi thực hiện đổi mật khẩu.');
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
      zIndex: 110,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
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
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6'
            }}>
              <KeyRound size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Đổi mật khẩu tài khoản
              </h3>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Bảo vệ an toàn ca trực
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

        {/* Current User Card */}
        <div style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <UserCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {currentUser?.fullName || 'Người dùng ca trực'}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Tài khoản: <strong style={{ color: 'var(--text-main)' }}>@{currentUser?.username || 'user'}</strong>
              </div>
            </div>
          </div>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '6px',
            background: 'var(--primary-bg)',
            color: 'var(--primary)',
            border: '1px solid var(--primary-border)'
          }}>
            {currentUser?.roleCode || 'USER'}
          </span>
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

        {/* Change Password Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Old Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Mật khẩu hiện tại: <span style={{ color: 'var(--danger-red)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={15} />
              </div>
              <input
                type={showOldPass ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu ca trực hiện tại..."
                disabled={loading}
                autoFocus
                style={{
                  width: '100%',
                  padding: '9px 38px 9px 38px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowOldPass(!showOldPass)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                tabIndex="-1"
              >
                {showOldPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Mật khẩu mới (Tối thiểu 6 ký tự): <span style={{ color: 'var(--danger-red)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={15} />
              </div>
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '9px 38px 9px 38px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle)',
                  border: `1px solid ${newPassword.length > 0 && !isLengthValid ? 'var(--danger-red)' : 'var(--border-color)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                tabIndex="-1"
              >
                {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {newPassword.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '5px',
                fontSize: '0.72rem',
                color: isLengthValid ? '#10b981' : 'var(--danger-red)'
              }}>
                <CheckCircle2 size={13} />
                <span>{isLengthValid ? 'Độ dài đạt chuẩn an toàn (≥ 6 ký tự)' : 'Chưa đủ 6 ký tự'}</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Xác nhận mật khẩu mới: <span style={{ color: 'var(--danger-red)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <ShieldCheck size={15} />
              </div>
              <input
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '9px 38px 9px 38px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle)',
                  border: `1px solid ${confirmPassword.length > 0 && !isMatch ? 'var(--danger-red)' : 'var(--border-color)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                tabIndex="-1"
              >
                {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '5px',
                fontSize: '0.72rem',
                color: isMatch ? '#10b981' : 'var(--danger-red)'
              }}>
                <CheckCircle2 size={13} />
                <span>{isMatch ? 'Mật khẩu xác nhận trùng khớp' : 'Mật khẩu xác nhận chưa khớp'}</span>
              </div>
            )}
          </div>

          {/* Security Note */}
          <div style={{
            fontSize: '0.72rem',
            color: 'var(--text-dim)',
            lineHeight: 1.4,
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border-subtle)'
          }}>
            Lưu ý: Mật khẩu mới sẽ có hiệu lực ngay lập tức cho các lần đăng nhập tiếp theo và được ghi vết vào Nhật ký kiểm toán hệ thống.
          </div>

          {/* Action Buttons */}
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
              disabled={loading || !isLengthValid || !isMatch}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: loading || !isLengthValid || !isMatch ? 'var(--text-dim)' : 'var(--primary)',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: loading || !isLengthValid || !isMatch ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              {loading ? (
                <span>Đang xử lý...</span>
              ) : (
                <>
                  <KeyRound size={15} />
                  <span>Xác nhận đổi mật khẩu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
