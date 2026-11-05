import React, { useState, useEffect } from 'react';
import {
  Building2,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Store,
  ShoppingCart,
  Truck,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Eye,
  EyeOff,
  Database,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Monitor,
  KeyRound
} from 'lucide-react';
import { apiLogin, apiCheckHealth } from '../api';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('lhu_remembered_username') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return Boolean(localStorage.getItem('lhu_remembered_username'));
  });
  const [showRoleGuide, setShowRoleGuide] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dbHealth, setDbHealth] = useState({
    checking: true,
    online: false,
    database: 'Microsoft SQL Server LocalDB (retail_spoilage_db)',
    storeCode: 'RETAIL-STORE-01'
  });

  useEffect(() => {
    let mounted = true;
    const checkServer = async () => {
      try {
        const res = await apiCheckHealth();
        if (mounted && res && res.success) {
          setDbHealth({
            checking: false,
            online: true,
            database: res.database || 'Microsoft SQL Server LocalDB (retail_spoilage_db)',
            storeCode: res.storeCode || 'RETAIL-STORE-01'
          });
        } else if (mounted) {
          setDbHealth(prev => ({ ...prev, checking: false, online: false }));
        }
      } catch (e) {
        if (mounted) {
          setDbHealth(prev => ({ ...prev, checking: false, online: false }));
        }
      }
    };
    checkServer();
    return () => {
      mounted = false;
    };
  }, []);

  // 3 Nhóm người dùng (3 Actor: OWNER, MANAGER, STAFF)
  const rbacRoles = [
    {
      roleCode: 'ADMIN',
      actorGroup: 'OWNER',
      roleName: 'Chủ chuỗi / Quản trị viên',
      user: 'admin',
      name: 'Quản trị viên (Admin)',
      defaultRoute: '/dashboard',
      device: 'PC / Laptop',
      color: '#8b5cf6',
      icon: Shield,
      desc: 'Quản trị chuỗi 3 chi nhánh, cấu hình tham số, danh mục FMCG & nhân sự'
    },
    {
      roleCode: 'STORE_MANAGER',
      actorGroup: 'MANAGER',
      roleName: 'Cửa hàng trưởng',
      user: 'manager',
      name: 'Đỗ Tấn Du',
      defaultRoute: '/dashboard',
      device: 'PC / Tablet',
      color: '#10b981',
      icon: Store,
      desc: 'Điều hành KPI tài chính, giảm giá xả hàng 15-50%, duyệt tiêu hủy & đặt hàng DC'
    },
    {
      roleCode: 'CASHIER',
      actorGroup: 'STAFF',
      roleName: 'Nhân viên cửa hàng (POS & Kho kệ)',
      user: 'cashier',
      name: 'Đoàn Minh Quân',
      defaultRoute: '/pos-checkout',
      device: 'Máy POS + PDA Kho',
      color: '#3b82f6',
      icon: ShoppingCart,
      desc: 'Bán lẻ POS chuẩn FEFO, tiếp nhận hàng DC, đảo kệ mặt tiền & bàn giao ca trực'
    }
  ];

  const handleSelectRole = (acc) => {
    setUsername(acc.user);
    setPassword('');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiLogin(trimmedUser, password);
      if (res.success && res.data) {
        if (rememberMe) {
          localStorage.setItem('lhu_remembered_username', trimmedUser);
        } else {
          localStorage.removeItem('lhu_remembered_username');
        }
        onLoginSuccess(res.data.user, res.data.token, rememberMe);
      } else {
        setErrorMsg(res.message || 'Đăng nhập không thành công.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Không thể kết nối tới máy chủ Backend API (http://localhost:5000).');
    } finally {
      setLoading(false);
    }
  };

  const isLight = true;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: isLight
        ? 'radial-gradient(ellipse at top, #f1f5f9 0%, #e2e8f0 100%)'
        : 'radial-gradient(ellipse at top, #0f172a 0%, #070b14 100%)',
      color: isLight ? '#0f172a' : '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Top Standalone Header Bar (/login) */}
      <header style={{
        width: '100%',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
        background: isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}>
            <Building2 size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                LHU MART
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                {dbHealth.storeCode}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
              Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Live SQL Server Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 12px',
            borderRadius: '999px',
            fontSize: '0.74rem',
            fontWeight: 600,
            background: dbHealth.online
              ? 'rgba(16, 185, 129, 0.12)'
              : 'rgba(239, 68, 68, 0.12)',
            border: dbHealth.online
              ? '1px solid rgba(16, 185, 129, 0.35)'
              : '1px solid rgba(239, 68, 68, 0.35)',
            color: dbHealth.online ? '#10b981' : '#ef4444'
          }}>
            <Database size={14} />
            <span>
              {dbHealth.checking
                ? 'Đang kiểm tra kết nối SQL Server...'
                : dbHealth.online
                ? 'SQL Server LocalDB: ONLINE'
                : 'Backend API: OFFLINE'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: showRoleGuide ? '1040px' : '460px',
          display: 'grid',
          gridTemplateColumns: showRoleGuide ? '1fr 1.15fr' : '1fr',
          background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.9)',
          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          boxShadow: isLight
            ? '0 20px 45px -15px rgba(15, 23, 42, 0.12)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          transition: 'max-width 0.25s ease'
        }}>
          {/* Primary Column: Dedicated Login Form (/login) */}
          <div style={{
            padding: '36px 34px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: showRoleGuide
              ? (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)')
              : 'none'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                fontSize: '0.72rem',
                fontWeight: 700,
                marginBottom: '12px'
              }}>
                <KeyRound size={13} />
                <span>CỔNG ĐĂNG NHẬP XÁC THỰC TẬP TRUNG (/login)</span>
              </div>

              <h1 style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: isLight ? '#0f172a' : '#ffffff',
                margin: '0 0 6px 0',
                letterSpacing: '-0.02em'
              }}>
                Đăng nhập ca làm việc
              </h1>
              <p style={{
                margin: '0 0 22px 0',
                fontSize: '0.82rem',
                color: isLight ? '#475569' : '#94a3b8',
                lineHeight: 1.5
              }}>
                Xác thực tài khoản nhân sự để cấp phiên <strong>JWT Token</strong> và điều hướng vào phân hệ theo vai trò RBAC.
              </p>

              {errorMsg && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: errorMsg.includes('bị khóa')
                    ? 'rgba(239, 68, 68, 0.2)'
                    : errorMsg.includes('lần thử')
                    ? 'rgba(245, 158, 11, 0.16)'
                    : 'rgba(239, 68, 68, 0.14)',
                  border: errorMsg.includes('bị khóa')
                    ? '1px solid #ef4444'
                    : errorMsg.includes('lần thử')
                    ? '1px solid #f59e0b'
                    : '1px solid rgba(239, 68, 68, 0.4)',
                  color: errorMsg.includes('bị khóa')
                    ? (isLight ? '#b91c1c' : '#fca5a5')
                    : errorMsg.includes('lần thử')
                    ? (isLight ? '#b45309' : '#fde68a')
                    : (isLight ? '#dc2626' : '#f87171'),
                  fontSize: '0.815rem',
                  lineHeight: '1.45',
                  marginBottom: '18px'
                }}>
                  {errorMsg.includes('bị khóa') ? (
                    <ShieldAlert size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                  ) : errorMsg.includes('lần thử') ? (
                    <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
                  ) : (
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                  )}
                  <span style={{ fontWeight: 600 }}>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.79rem',
                    fontWeight: 700,
                    color: isLight ? '#334155' : '#cbd5e1',
                    marginBottom: '6px'
                  }}>
                    Tên đăng nhập (Username)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      display: 'flex'
                    }}>
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nhập username (vd: admin, manager, cashier)"
                      autoComplete="username"
                      style={{
                        width: '100%',
                        padding: '11px 12px 11px 38px',
                        borderRadius: '10px',
                        background: isLight ? '#f8fafc' : 'rgba(0, 0, 0, 0.35)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.14)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.875rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.79rem',
                    fontWeight: 700,
                    color: isLight ? '#334155' : '#cbd5e1',
                    marginBottom: '6px'
                  }}>
                    Mật khẩu (Password)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      display: 'flex'
                    }}>
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu xác thực..."
                      autoComplete="current-password"
                      style={{
                        width: '100%',
                        padding: '11px 40px 11px 38px',
                        borderRadius: '10px',
                        background: isLight ? '#f8fafc' : 'rgba(0, 0, 0, 0.35)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.14)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.875rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        padding: '4px'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Role Helper Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginTop: '2px'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '0.76rem',
                    color: isLight ? '#475569' : '#94a3b8',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: '#10b981', cursor: 'pointer' }}
                    />
                    <span>Ghi nhớ tài khoản trên máy này</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowRoleGuide(prev => !prev)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#10b981',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    <span>{showRoleGuide ? 'Ẩn bảng 3 vai trò' : 'Xem 3 vai trò RBAC'}</span>
                    {showRoleGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '6px',
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: loading
                      ? '#475569'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {loading ? (
                    <span>Đang xác thực JWT & phân quyền...</span>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Đăng nhập hệ thống</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Security Policy Footer inside Login Form */}
            <div style={{
              marginTop: '24px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.72rem',
              color: isLight ? '#475569' : '#94a3b8',
              lineHeight: 1.5
            }}>
              <div style={{ fontWeight: 700, color: isLight ? '#0f172a' : '#e2e8f0', marginBottom: '2px' }}>
                Chính sách bảo mật phiên đăng nhập:
              </div>
              Nhập sai mật khẩu quá <strong>5 lần liên tiếp</strong> sẽ tự động khóa tài khoản tạm thời <strong>15 phút</strong> và ghi cảnh báo vào bảng <code>AuditLogs</code>.
            </div>
          </div>

          {/* Secondary Column: 3 RBAC Roles (3 Actors) Quick Selector */}
          {showRoleGuide && (
            <div style={{
              padding: '32px',
              background: isLight ? '#f8fafc' : 'rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <h2 style={{
                    fontSize: '1.02rem',
                    fontWeight: 800,
                    color: isLight ? '#0f172a' : '#f1f5f9',
                    margin: 0
                  }}>
                    3 Nhóm người dùng trong hệ thống (RBAC)
                  </h2>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#3b82f6'
                  }}>
                    3 Actor = 3 Role
                  </span>
                </div>
                <p style={{
                  fontSize: '0.78rem',
                  color: isLight ? '#475569' : '#94a3b8',
                  lineHeight: 1.45,
                  margin: '0 0 16px 0'
                }}>
                  Nhấn vào một nhóm người dùng bên dưới để điền nhanh <code>username</code> (mật khẩu luôn do người dùng tự nhập để đảm bảo an toàn):
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {rbacRoles.map((acc) => {
                    const isSelected = username === acc.user;
                    const Icon = acc.icon;
                    return (
                      <div
                        key={acc.user}
                        onClick={() => handleSelectRole(acc)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: isSelected
                            ? (isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.14)')
                            : (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)'),
                          border: isSelected
                            ? '1.5px solid #10b981'
                            : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.07)'),
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '11px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '9px',
                            background: `${acc.color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: acc.color,
                            flexShrink: 0,
                            marginTop: '2px'
                          }}>
                            <Icon size={17} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '3px' }}>
                              <span style={{
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                color: isLight ? '#0f172a' : '#ffffff'
                              }}>
                                {acc.roleName}
                              </span>
                              <span style={{
                                fontSize: '0.64rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: `${acc.color}22`,
                                color: acc.color,
                                fontWeight: 700
                              }}>
                                {acc.roleCode}
                              </span>
                              <span style={{
                                fontSize: '0.62rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                                color: isLight ? '#475569' : '#cbd5e1',
                                fontWeight: 600
                              }}>
                                Actor: {acc.actorGroup}
                              </span>
                            </div>
                            <p style={{
                              margin: '0 0 5px 0',
                              fontSize: '0.73rem',
                              color: isLight ? '#475569' : '#94a3b8',
                              lineHeight: 1.35
                            }}>
                              {acc.desc}
                            </p>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: '0.68rem',
                              color: isLight ? '#64748b' : '#64748b'
                            }}>
                              <span>TK: <strong style={{ color: isLight ? '#334155' : '#cbd5e1' }}>{acc.user}</strong> ({acc.name})</span>
                              <span>•</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Monitor size={11} /> {acc.defaultRoute}
                              </span>
                            </div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '4px' }} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.7rem',
                color: '#64748b'
              }}>
                <span>Khoa CNTT - Trường Đại học Lạc Hồng (LHU)</span>
                <span>GVHD: ThS. Lê Minh Nhật</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Standalone Footer */}
      <footer style={{
        padding: '12px 24px',
        textAlign: 'center',
        fontSize: '0.73rem',
        color: isLight ? '#64748b' : '#64748b',
        borderTop: isLight ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        SVTH: Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946) — Mô hình Cửa hàng Bán lẻ LHU Mart liên kết Kho tổng DC Biên Hòa
      </footer>
    </div>
  );
}
