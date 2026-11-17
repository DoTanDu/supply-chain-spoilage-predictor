import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  UserCog,
  Building2,
  Sliders,
  RotateCcw
} from 'lucide-react';
import * as api from '../api';
import {
  MANAGEABLE_PAGES,
  normalizeRole,
  getDefaultPagesForRole,
  normalizePagePermissions,
  computeEffectivePages
} from '../utils/pagePermissions';

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
  const [storeId, setStoreId] = useState('1');
  const [stores, setStores] = useState([]);
  const [pageCatalog, setPageCatalog] = useState(MANAGEABLE_PAGES);
  const [pagePermissions, setPagePermissions] = useState({ grant: [], revoke: [] });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const closeTimerRef = useRef(null);

  const isEditingSelf = currentUser?.id === targetUser?.id || currentUser?.username === targetUser?.username;
  const normalizedRole = normalizeRole(roleCode);
  const isRoleAdmin = normalizedRole === 'ADMIN';

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen && targetUser) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      const initRole = normalizeRole(targetUser.roleCode || 'CASHIER');
      setFullName(targetUser.fullName || '');
      setEmail(targetUser.email || '');
      setPhone(targetUser.phone || '');
      setRoleCode(initRole);
      setStoreId(targetUser.storeId ? String(targetUser.storeId) : '1');
      setPagePermissions(normalizePagePermissions(targetUser.pagePermissions, initRole));
      setErrorMessage('');
      setSuccessMessage('');

      let mounted = true;
      api.apiGetAllStores()
        .then(list => {
          if (mounted && Array.isArray(list) && list.length > 0) {
            setStores(list);
          }
        })
        .catch(() => {});

      api.apiGetPageCatalog()
        .then(res => {
          if (mounted && res?.success && Array.isArray(res?.data?.pages) && res.data.pages.length > 0) {
            setPageCatalog(res.data.pages);
          }
        })
        .catch(() => {});

      return () => {
        mounted = false;
      };
    }
  }, [isOpen, targetUser]);

  const defaultPageSet = useMemo(() => new Set(getDefaultPagesForRole(normalizedRole)), [normalizedRole]);
  const effectivePageSet = useMemo(
    () => new Set(computeEffectivePages(normalizedRole, pagePermissions)),
    [normalizedRole, pagePermissions]
  );

  const handleRoleChange = (nextRole) => {
    const cleanRole = normalizeRole(nextRole);
    setRoleCode(cleanRole);
    setPagePermissions(prev => normalizePagePermissions(prev, cleanRole));
  };

  const handleTogglePage = (pageId) => {
    if (isRoleAdmin || isLoading) return;
    const isCurrentlyEnabled = effectivePageSet.has(pageId);
    const willEnable = !isCurrentlyEnabled;
    const isDefault = defaultPageSet.has(pageId);

    const grantSet = new Set(pagePermissions.grant || []);
    const revokeSet = new Set(pagePermissions.revoke || []);

    if (willEnable) {
      revokeSet.delete(pageId);
      if (!isDefault) {
        grantSet.add(pageId);
      }
    } else {
      grantSet.delete(pageId);
      if (isDefault) {
        revokeSet.add(pageId);
      }
    }

    setPagePermissions(
      normalizePagePermissions(
        { grant: Array.from(grantSet), revoke: Array.from(revokeSet) },
        normalizedRole
      )
    );
  };

  const handleResetPagePermissions = () => {
    if (isLoading) return;
    setPagePermissions({ grant: [], revoke: [] });
  };

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
      const normalizedPerms = isRoleAdmin
        ? { grant: [], revoke: [] }
        : normalizePagePermissions(pagePermissions, normalizedRole);

      const res = await api.apiUpdateUser(targetUser.id, {
        fullName: fullName.trim(),
        email: email ? email.trim() : '',
        phone: phone ? phone.trim() : '',
        roleCode: normalizedRole,
        storeId: isRoleAdmin ? null : Number(storeId || 1),
        pagePermissions: normalizedPerms
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
        maxWidth: '680px',
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
                      if (!isDisabled) handleRoleChange(r.code);
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
              <div style={{ fontSize: '0.7rem', color: '#b45309', marginTop: '6px' }}>
                Lưu ý: Bạn đang xem tài khoản của chính mình. Quản trị viên không thể tự thay đổi vai trò để tránh mất quyền quản trị.
              </div>
            )}
          </div>

          {/* Chi nhánh công tác (BOLA Store Scope) */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', fontWeight: 700, marginBottom: '6px' }}>
              <Building2 size={14} color="#4f46e5" />
              <span>Chi nhánh công tác (Phạm vi dữ liệu BOLA):</span>
            </label>
            {isRoleAdmin ? (
              <div style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #ddd6fe',
                background: '#f5f3ff',
                color: '#6d28d9',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                Toàn chuỗi (ALL) — Chủ Chuỗi / Admin quản lý toàn bộ chi nhánh trong hệ thống
              </div>
            ) : (
              <select
                value={storeId}
                onChange={e => setStoreId(e.target.value)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {(stores.length > 0
                  ? stores
                  : [
                      { id: 1, storeName: 'Chi nhánh #1' },
                      { id: 2, storeName: 'Chi nhánh #2' },
                      { id: 3, storeName: 'Chi nhánh #3' }
                    ]
                ).map(st => (
                  <option key={st.id} value={String(st.id)}>
                    {`Chi nhánh #${st.id} — ${st.storeName || st.name || `Chi nhánh #${st.id}`}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Phân quyền Trang truy cập (Bật/Tắt ngoại lệ cho từng nhân sự) */}
          <div style={{
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '12px',
            padding: '14px',
            background: 'var(--bg-subtle, #f8fafc)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '10px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800 }}>
                  <Sliders size={14} color="#4f46e5" />
                  <span>Phân quyền Trang truy cập (Bật / Tắt từng trang)</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                  {isRoleAdmin
                    ? 'Tài khoản OWNER có toàn quyền 9/9 trang và quản lý nhân sự.'
                    : `Khả dụng ${effectivePageSet.size}/${pageCatalog.length} trang • +${pagePermissions.grant.length} cấp thêm • -${pagePermissions.revoke.length} đã tắt`}
                </div>
              </div>

              {!isRoleAdmin && (pagePermissions.grant.length > 0 || pagePermissions.revoke.length > 0) && (
                <button
                  type="button"
                  onClick={handleResetPagePermissions}
                  disabled={isLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Khôi phục mặc định</span>
                </button>
              )}
            </div>

            {isRoleAdmin ? (
              <div style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                color: '#6d28d9',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                Chủ chuỗi (OWNER) truy cập toàn bộ 9/9 trang và không thể tắt từng trang.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '8px'
              }}>
                {pageCatalog.map(page => {
                  const isEnabled = effectivePageSet.has(page.id);
                  const isDefault = defaultPageSet.has(page.id);
                  const isGranted = (pagePermissions.grant || []).includes(page.id);
                  const isRevoked = (pagePermissions.revoke || []).includes(page.id);

                  let statusBadge = { text: 'Chưa cấp', bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
                  if (isGranted) {
                    statusBadge = { text: '+ Cấp thêm', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
                  } else if (isRevoked) {
                    statusBadge = { text: '- Đã tắt', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
                  } else if (isDefault && isEnabled) {
                    statusBadge = { text: 'Mặc định', bg: '#eef2ff', color: '#4f46e5', border: '#c7d2fe' };
                  }

                  return (
                    <button
                      key={page.id}
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      disabled={isLoading}
                      onClick={() => handleTogglePage(page.id)}
                      style={{
                        textAlign: 'left',
                        padding: '9px 11px',
                        borderRadius: '10px',
                        border: '1.5px solid',
                        borderColor: isRevoked
                          ? '#fca5a5'
                          : isGranted
                            ? '#6ee7b7'
                            : isEnabled
                              ? '#cbd5e1'
                              : '#e2e8f0',
                        background: isEnabled ? '#ffffff' : '#f8fafc',
                        opacity: isEnabled ? 1 : 0.78,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.775rem',
                            fontWeight: 700,
                            color: isEnabled ? '#0f172a' : '#64748b',
                            textDecoration: isRevoked ? 'line-through' : 'none'
                          }}>
                            {page.label}
                          </span>
                          <span style={{
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '999px',
                            background: statusBadge.bg,
                            color: statusBadge.color,
                            border: `1px solid ${statusBadge.border}`
                          }}>
                            {statusBadge.text}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '0.675rem',
                          color: 'var(--text-muted, #64748b)',
                          marginTop: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {page.description}
                        </div>
                      </div>

                      <div style={{
                        width: '34px',
                        height: '20px',
                        borderRadius: '999px',
                        background: isEnabled ? (isGranted ? '#10b981' : '#4f46e5') : '#cbd5e1',
                        position: 'relative',
                        flexShrink: 0,
                        transition: 'background 0.15s ease'
                      }}>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          position: 'absolute',
                          top: '3px',
                          left: isEnabled ? '17px' : '3px',
                          transition: 'left 0.15s ease',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted, #64748b)', marginTop: '8px' }}>
              * Trang Quản lý Tài khoản chỉ dành riêng cho ADMIN. Ràng buộc cô lập chi nhánh (BOLA) vẫn được giữ nguyên kể cả khi cấp thêm trang.
            </div>
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
