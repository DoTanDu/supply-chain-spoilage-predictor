import React, { useState, useEffect, useRef } from 'react';
import { 
  KeyRound, 
  X, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  User, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import * as api from '../api';

export default function ResetPasswordModal({ 
  isOpen, 
  onClose, 
  targetUser, 
  onSuccess 
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const closeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Reset form khi modal mở/đóng hoặc đổi user
  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage('');
      setSuccessMessage('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, targetUser]);

  // Phím Escape để đóng modal
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

  // Điền nhanh mật khẩu mặc định an toàn của dự án
  const handleSetDefaultPassword = () => {
    const defaultPass = 'Password123@';
    setNewPassword(defaultPass);
    setConfirmPassword(defaultPass);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPassword) {
      setErrorMessage('Vui lòng nhập mật khẩu mới.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.apiResetUserPassword(targetUser.id, newPassword, confirmPassword);
      if (res && res.success) {
        setSuccessMessage(res.message || 'Đặt lại mật khẩu thành công!');
        closeTimerRef.current = setTimeout(() => {
          if (onSuccess) onSuccess(res);
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res?.message || 'Không thể đặt lại mật khẩu.');
      }
    } catch (err) {
      console.error('Lỗi đặt lại mật khẩu:', err);
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ khi gửi yêu cầu đặt lại mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

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
        maxWidth: '480px',
        border: '1px solid var(--border-color, #cbd5e1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
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
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(234, 88, 12, 0.12)',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <KeyRound size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.975rem', fontWeight: 800 }}>ĐẶT LẠI MẬT KHẨU NHÂN SỰ</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748b)' }}>
                Cấp lại mật khẩu truy cập hệ thống dành cho Quản trị viên (Giai đoạn 1)
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
        <form onSubmit={handleSubmit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Thông tin nhân viên được chọn */}
          <div style={{
            background: 'var(--bg-app, #f1f5f9)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                {targetUser.fullName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '2px', fontFamily: 'monospace' }}>
                Tên đăng nhập: <strong>@{targetUser.username}</strong>
              </div>
            </div>

            <span style={{
              fontSize: '0.725rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(124, 58, 237, 0.1)',
              color: '#7c3aed',
              border: '1px solid rgba(124, 58, 237, 0.25)'
            }}>
              {targetUser.roleCode}
            </span>
          </div>

          {/* Nút Điền Nhanh Mật Khẩu Mặc Định */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleSetDefaultPassword}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px dashed #ea580c',
                background: 'rgba(234, 88, 12, 0.08)',
                color: '#ea580c',
                fontSize: '0.725rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Điền sẵn mật khẩu mặc định Password123@"
            >
              <Sparkles size={12} />
              <span>Dùng mật khẩu mặc định: Password123@</span>
            </button>
          </div>

          {/* Ô Nhập Mật Khẩu Mới */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, marginBottom: '6px' }}>
              Mật khẩu mới: <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập tối thiểu 6 ký tự..."
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '9px 38px 9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
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
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #64748b)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Ô Xác Nhận Mật Khẩu Mới */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, marginBottom: '6px' }}>
              Xác nhận mật khẩu mới: <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu mới..."
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '9px 38px 9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
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
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #64748b)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Cảnh báo kiểm toán Rule 11 */}
          <div style={{
            fontSize: '0.725rem',
            color: 'var(--text-muted, #64748b)',
            background: 'var(--bg-subtle, #f8fafc)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            lineHeight: 1.4
          }}>
            🛡️ <strong>Nhật ký kiểm toán:</strong> Hành động đặt lại mật khẩu sẽ được hệ thống mã hóa bằng bcrypt (10 rounds) và tự động ghi nhận vào <code>system_audit_logs</code>.
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
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: '#ea580c',
                color: '#ffffff',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(234, 88, 12, 0.3)',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Đang Cập Nhật...</span>
                </>
              ) : (
                <>
                  <KeyRound size={15} />
                  <span>Xác Nhận Đặt Lại</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
