// src/components/LoginView.jsx
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Lock,
  User,
  Shield,
  Store,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Database,
  ArrowLeftRight,
  AlertTriangle
} from 'lucide-react';
import { apiLogin, apiCheckHealth } from '../api';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState(() => localStorage.getItem('ss_remembered_username') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem('ss_remembered_username')));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dbHealth, setDbHealth] = useState({
    checking: true,
    online: false,
    database: 'SQL Server LocalDB (retail_spoilage_db)'
  });

  useEffect(() => {
    let mounted = true;
    apiCheckHealth()
      .then((res) => {
        if (mounted && res && res.success) {
          setDbHealth({
            checking: false,
            online: true,
            database: res.database || 'SQL Server LocalDB (retail_spoilage_db)'
          });
        } else if (mounted) {
          setDbHealth(prev => ({ ...prev, checking: false, online: false }));
        }
      })
      .catch(() => {
        if (mounted) setDbHealth(prev => ({ ...prev, checking: false, online: false }));
      });
    return () => { mounted = false; };
  }, []);

  const actorCards = [
    {
      actor: 'OWNER',
      roleName: 'Chủ chuỗi / Quản trị hệ thống',
      user: 'admin',
      name: 'Quản trị viên (Admin)',
      color: '#4f46e5',
      bg: '#eef2ff',
      border: '#c7d2fe',
      icon: Shield,
      desc: 'Quản lý toàn chuỗi, mở chi nhánh, duyệt nhập/điều chuyển, phân quyền & báo cáo tổng hợp.'
    },
    {
      actor: 'MANAGER',
      roleName: 'Quản lý Cửa hàng',
      user: 'manager',
      name: 'Đỗ Tấn Du',
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe',
      icon: Store,
      desc: 'Giám sát kho lô chi nhánh, xem dự báo AI, duyệt đặt hàng/điều chuyển & xử lý cận date.'
    },
    {
      actor: 'STAFF',
      roleName: 'Nhân viên Cửa hàng',
      user: 'cashier',
      name: 'Đoàn Minh Quân',
      color: '#047857',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      icon: User,
      desc: 'Nhập kho DC (RSL >= 70%), kiểm kê tồn lô, đảo kệ cảnh báo date & thực hiện giao/nhận điều chuyển.'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiLogin(username.trim(), password);
      if (res && res.success && res.data) {
        if (rememberMe) {
          localStorage.setItem('ss_remembered_username', username.trim());
        } else {
          localStorage.removeItem('ss_remembered_username');
        }
        onLoginSuccess && onLoginSuccess(res.data.user, res.data.token);
      } else {
        setErrorMsg(res?.message || 'Tên đăng nhập hoặc mật khẩu không đúng.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Không thể kết nối tới máy chủ API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1060px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
          alignItems: 'stretch'
        }}
      >
        {/* Left Column: Product Positioning & 4 Pillars */}
        <section
          className="ss-card ss-card-pad"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '28px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '11px',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}
              >
                <TrendingUp size={24} strokeWidth={2.3} aria-hidden="true" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                  SmartSupply AI
                </h1>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Quản trị Chuỗi cung ứng Thực phẩm
                </p>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                Chọn tài khoản dùng thử (3 Vai trò)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {actorCards.map(acc => {
                  const Icon = acc.icon;
                  const isSelected = username === acc.user;
                  return (
                    <button
                      key={acc.user}
                      type="button"
                      onClick={() => {
                        setUsername(acc.user);
                        setPassword('');
                        setErrorMsg('');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${isSelected ? acc.color : 'var(--border-subtle)'}`,
                        background: isSelected ? acc.bg : 'var(--bg-surface)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.15s ease, background-color 0.15s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '7px',
                          background: acc.bg,
                          border: `1px solid ${acc.border}`,
                          color: acc.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Icon size={16} aria-hidden="true" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{acc.name}</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: acc.color }}>({acc.actor})</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.35 }}>
                          {acc.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '18px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.76rem',
              color: 'var(--text-muted)'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Database size={14} aria-hidden="true" />
              {dbHealth.database}
            </span>
            <span className={`ss-badge ${dbHealth.online ? 'ss-badge-safe' : 'ss-badge-warning'}`}>
              {dbHealth.checking ? 'Đang kiểm tra...' : dbHealth.online ? 'Máy chủ sẵn sàng' : 'Mất kết nối API'}
            </span>
          </div>
        </section>

        {/* Right Column: Login Form */}
        <section
          className="ss-card ss-card-pad"
          style={{
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Đăng nhập
            </h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="ss-field">
              <label className="ss-label" htmlFor="login-username">
                Tên đăng nhập <span aria-hidden="true">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="next"
                  placeholder="admin, manager hoặc cashier"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                />
              </div>
            </div>

            <div className="ss-field">
              <label className="ss-label" htmlFor="login-password">
                Mật khẩu <span aria-hidden="true">*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  enterKeyHint="done"
                  placeholder="Nhập mật khẩu tài khoản..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span>Ghi nhớ tên đăng nhập</span>
              </label>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={12} aria-hidden="true" /> JWT RBAC
              </span>
            </div>

            {errorMsg && (
              <div
                role="alert"
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'var(--danger-red-bg)',
                  border: '1px solid var(--danger-red-border)',
                  color: 'var(--danger-red-light)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="ss-btn ss-btn-primary"
              style={{ width: '100%', padding: '11px 16px', fontSize: '0.92rem' }}
            >
              <span>{loading ? 'Đang xác thực...' : 'Đăng nhập vào SmartSupply AI'}</span>
              {!loading && <ArrowRight size={17} />}
            </button>

            <div className="ss-card-subtle" style={{ padding: '10px 12px', fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={15} color="var(--safe-green)" style={{ flexShrink: 0 }} />
              <span>Mật khẩu demo mặc định trong CSDL: <code>123456</code> (hoặc mật khẩu đã cập nhật).</span>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
