import React, { useState } from 'react';
import { Shield, Lock, X, CheckCircle2 } from 'lucide-react';
import * as api from '../api';

export default function AdminLoginModal({ isOpen, onClose, onSuccess }) {
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      const res = await api.apiLogin(adminUser.trim(), adminPass.trim());
      if (res && res.success && res.data) {
        onSuccess(res.data.user, res.data.token);
        onClose();
      } else {
        setLoginError(res?.message || 'Tài khoản hoặc mật khẩu không chính xác!');
      }
    } catch (err) {
      setLoginError(err.message || 'Lỗi kết nối máy chủ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        padding: '28px',
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.18)',
        borderRadius: '20px',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={() => {
            onClose();
            setLoginError('');
          }}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted, #475569)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Đóng hộp thoại"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)'
          }}>
            <Shield size={24} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Xác thực Quản Trị Viên
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #475569)' }}>
              Đăng nhập để nhận quyền quản trị hệ thống
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '6px' }}>
              Tên tài khoản
            </label>
            <input
              type="text"
              value={adminUser}
              onChange={(e) => setAdminUser(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#0f172a',
                fontSize: '0.9rem',
                outline: 'none'
              }}
              placeholder="Nhập tên tài khoản admin..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '6px' }}>
              Mật khẩu
            </label>
            <input
              type="password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              required
              style={{
                width: '100%',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#0f172a',
                fontSize: '0.9rem',
                outline: 'none'
              }}
              placeholder="Nhập mật khẩu..."
            />
          </div>

          {loginError && (
            <div style={{
              background: '#fff1f2',
              border: '1px solid #fda4af',
              color: '#be123c',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              ⚠ {loginError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                setLoginError('');
              }}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '0.85rem' }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 2,
                padding: '10px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Lock size={15} />
              <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng nhập Toàn Quyền'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
