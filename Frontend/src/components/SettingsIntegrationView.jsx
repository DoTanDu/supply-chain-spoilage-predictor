// src/components/SettingsIntegrationView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Users,
  Truck,
  Sliders,
  ScrollText,
  KeyRound,
  Plus,
  Edit3,
  Lock,
  Unlock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sun,
  CloudRain,
  Cloud,
  Calendar,
  Save
} from 'lucide-react';
import * as api from '../api';
import ModalDialog from './ui/ModalDialog';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import ResetPasswordModal from './ResetPasswordModal';
import ChangePasswordModal from './ChangePasswordModal';
import { exportAuditLogsToExcel, downloadFile } from '../utils/exportUtils';
import { parsePosSpreadsheetFile } from '../utils/spreadsheetParser';
import { canAccessPage, normalizeRole } from '../utils/pagePermissions';

function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

export default function SettingsIntegrationView({
  currentUser = null,
  isAdmin = false,
  storeProfile = null,
  enterpriseConfig = null,
  onEnterpriseUpdated,
  storesList = [],
  products = [],
  auditLogs = [],
  weather = { condition: 'NORMAL', isHoliday: false, temp: 30 },
  setWeather,
  onSyncWeather,
  isSyncingWeather = false,
  onProfileUpdated,
  onRefreshData,
  initialSubTab = 'pos-integration'
}) {
  const roleCode = normalizeRole(currentUser?.roleCode);
  const isOwner = isAdmin || roleCode === 'ADMIN';
  const isManager = roleCode === 'STORE_MANAGER';
  const canManageSuppliers = isOwner || isManager;
  const canViewAudit = isOwner || isManager;
  const canImportPos = isOwner || isManager || canAccessPage(currentUser, 'settings-integration');

  const safeInitSubTab = initialSubTab === 'audit-logs' || initialSubTab === 'store-config'
    ? 'enterprise-audit'
    : (initialSubTab || 'pos-integration');
  const [subTab, setSubTab] = useState(safeInitSubTab);
  useEffect(() => {
    if (initialSubTab) {
      setSubTab(
        initialSubTab === 'audit-logs' || initialSubTab === 'store-config'
          ? 'enterprise-audit'
          : initialSubTab
      );
    }
  }, [initialSubTab]);

  const [toast, setToast] = useState(null);

  // --- 1. POS INTEGRATION (CSV/EXCEL) ---
  const [csvRows, setCsvRows] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvError, setCsvError] = useState('');
  const [importingCsv, setImportingCsv] = useState(false);

  const skuLookup = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      map.set(String(p.sku || '').toUpperCase().trim(), p);
    }
    return map;
  }, [products]);

  const handleDownloadTemplate = () => {
    const sku1 = products[0]?.sku || '8934567890101';
    const sku2 = products[1]?.sku || '8934567890201';
    const storeCode = storeProfile?.storeCode || 'RETAIL-STORE-01';
    const today = new Date().toISOString().slice(0, 10);
    const content = '\uFEFFstore_code,sku,sale_date,quantity_sold,sale_price\n' +
      `${storeCode},${sku1},${today},12,${products[0]?.sellingPrice || 32000}\n` +
      `${storeCode},${sku2},${today},8,${products[1]?.sellingPrice || 25000}\n`;
    downloadFile(content, 'Mau_Dong_Bo_POS_SmartSupply_AI.csv');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError('');
    setCsvFileName(file.name);
    try {
      const { rows } = await parsePosSpreadsheetFile(file);
      if (!rows || rows.length < 2) {
        setCsvError('File không có dữ liệu (cần 1 dòng tiêu đề và ít nhất 1 dòng dữ liệu).');
        setCsvRows([]);
        return;
      }
      const parsed = rows.slice(1).map((cols, idx) => {
        const storeCode = cols[0] || storeProfile?.storeCode || 'RETAIL-STORE-01';
        const sku = String(cols[1] || '').toUpperCase().trim();
        const saleDate = cols[2] || new Date().toISOString().slice(0, 10);
        const quantitySold = Number(cols[3] || 0);
        const salePrice = Number(cols[4] || 0);
        const matchedProd = skuLookup.get(sku);
        const issues = [];
        if (!matchedProd) issues.push('SKU không tồn tại');
        if (!Number.isFinite(quantitySold) || quantitySold <= 0) issues.push('SL <= 0');
        if (!Number.isFinite(salePrice) || salePrice <= 0) issues.push('Giá <= 0');
        return {
          rowNum: idx + 1,
          storeCode,
          sku,
          productName: matchedProd?.name || 'Không xác định',
          saleDate,
          quantitySold,
          salePrice,
          isValid: issues.length === 0,
          issues
        };
      });
      setCsvRows(parsed);
    } catch (err) {
      setCsvError(err.message || 'Không thể đọc file Excel/CSV.');
      setCsvRows([]);
    }
  };

  const handleConfirmPosImport = async () => {
    const validRows = csvRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setCsvError('Không có dòng hợp lệ nào để đồng bộ.');
      return;
    }
    setImportingCsv(true);
    setCsvError('');
    try {
      const res = await api.apiImportPosSales(validRows);
      if (res && res.success) {
        setToast({ type: 'success', text: res.message || `Đã đồng bộ thành công ${validRows.length} dòng doanh số POS!` });
        setCsvRows([]);
        setCsvFileName('');
        if (onRefreshData) await onRefreshData();
      } else {
        setCsvError(res?.message || 'Lỗi khi đồng bộ dữ liệu POS.');
      }
    } catch (err) {
      setCsvError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setImportingCsv(false);
    }
  };

  // --- 2. USERS & RBAC ---
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editUserTarget, setEditUserTarget] = useState(null);
  const [resetPwdTarget, setResetPwdTarget] = useState(null);
  const [showChangePwd, setShowChangePwd] = useState(false);

  const loadUsers = async () => {
    if (!isOwner && !isManager) return;
    setLoadingUsers(true);
    try {
      const res = await api.apiGetUsers();
      if (res && res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch {}
    finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (subTab === 'users-rbac') loadUsers();
  }, [subTab]);

  // --- 3. SUPPLIERS & DC ---
  const [suppliers, setSuppliers] = useState([]);
  const [supplierModalMode, setSupplierModalMode] = useState(null); // null | CREATE | EDIT
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supForm, setSupForm] = useState({ code: '', name: '', contactName: '', phone: '', email: '', address: '', leadTimeDays: 1 });
  const [supError, setSupError] = useState('');

  const loadSuppliers = async () => {
    try {
      const list = await api.apiGetSuppliers(true);
      if (Array.isArray(list)) setSuppliers(list);
    } catch {}
  };

  useEffect(() => {
    if (subTab === 'suppliers') loadSuppliers();
  }, [subTab]);

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    setSupError('');
    try {
      const res = supplierModalMode === 'CREATE'
        ? await api.apiCreateSupplier(supForm)
        : await api.apiUpdateSupplier(editingSupplier.id, supForm);
      if (res && res.success) {
        setSupplierModalMode(null);
        setToast({ type: 'success', text: res.message || 'Lưu nhà cung cấp thành công!' });
        await loadSuppliers();
      } else {
        setSupError(res?.message || 'Không thể lưu nhà cung cấp.');
      }
    } catch (err) {
      setSupError(err.message);
    }
  };

  // --- 4. ENTERPRISE CONFIG & AUDIT LOGS ---
  const [entForm, setEntForm] = useState({
    enterpriseName: enterpriseConfig?.enterpriseName || 'SmartSupply AI Retail Chain',
    hasCentralWarehouse: enterpriseConfig?.hasCentralWarehouse !== false,
    centralWarehouseName: enterpriseConfig?.centralWarehouseName || 'Kho trung tâm (DC)',
    managerPoApprovalLimit: Number(enterpriseConfig?.managerPoApprovalLimit ?? 5000000)
  });
  const [savingEnt, setSavingEnt] = useState(false);

  useEffect(() => {
    if (enterpriseConfig) {
      setEntForm({
        enterpriseName: enterpriseConfig.enterpriseName || 'SmartSupply AI Retail Chain',
        hasCentralWarehouse: enterpriseConfig.hasCentralWarehouse !== false,
        centralWarehouseName: enterpriseConfig.centralWarehouseName || 'Kho trung tâm (DC)',
        managerPoApprovalLimit: Number(enterpriseConfig.managerPoApprovalLimit ?? 5000000)
      });
    }
  }, [enterpriseConfig]);

  const handleSaveEnterprise = async (e) => {
    e.preventDefault();
    setSavingEnt(true);
    try {
      const res = await api.apiUpdateEnterpriseConfig(entForm);
      if (res && res.success) {
        setToast({ type: 'success', text: res.message || 'Đã lưu cấu hình doanh nghiệp.' });
        if (onEnterpriseUpdated && res.data) onEnterpriseUpdated(res.data);
      } else {
        setToast({ type: 'error', text: res?.message || 'Không thể lưu cấu hình.' });
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message });
    } finally {
      setSavingEnt(false);
    }
  };

  // --- 5. AUDIT LOGS ---
  const [auditSearch, setAuditSearch] = useState('');
  const filteredAuditLogs = useMemo(() => {
    const q = stripVietnamese(auditSearch);
    if (!q) return auditLogs;
    return auditLogs.filter(log => {
      const hay = `${stripVietnamese(log.userName || log.user)} ${stripVietnamese(log.actionType || log.action)} ${stripVietnamese(log.description || log.details)}`;
      return hay.includes(q);
    });
  }, [auditLogs, auditSearch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div className="ss-page-header">
        <div>
          <h1 className="ss-page-title">Cài đặt & Tích hợp Hệ thống</h1>
        </div>

        <button type="button" className="ss-btn ss-btn-secondary" onClick={() => setShowChangePwd(true)}>
          <KeyRound size={15} /> Đổi mật khẩu
        </button>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: toast.type === 'error' ? 'var(--danger-red-bg)' : 'var(--safe-green-bg)',
            border: `1px solid ${toast.type === 'error' ? 'var(--danger-red-border)' : 'var(--safe-green-border)'}`,
            color: toast.type === 'error' ? 'var(--danger-red-light)' : 'var(--safe-green-light)',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.text}
          </span>
          <button type="button" onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}>
            Đóng
          </button>
        </div>
      )}

      {/* Main Sub-Tabs */}
      <section className="ss-card" style={{ overflow: 'hidden' }}>
        <div role="tablist" aria-label="Các mục cài đặt và tích hợp" className="ss-tablist">
          {canImportPos && (
            <button type="button" role="tab" id="set-tab-pos" aria-selected={subTab === 'pos-integration'} className="ss-tab" onClick={() => setSubTab('pos-integration')}>
              <FileSpreadsheet size={15} /> Kết nối POS (Excel/CSV)
            </button>
          )}
          <button type="button" role="tab" id="set-tab-users" aria-selected={subTab === 'users-rbac'} className="ss-tab" onClick={() => setSubTab('users-rbac')}>
            <Users size={15} /> Tài khoản & Phân quyền
          </button>
          {canManageSuppliers && (
            <button type="button" role="tab" id="set-tab-suppliers" aria-selected={subTab === 'suppliers'} className="ss-tab" onClick={() => setSubTab('suppliers')}>
              <Truck size={15} /> Nhà cung cấp / Kho
            </button>
          )}
          {(isOwner || canViewAudit) && (
            <button type="button" role="tab" id="set-tab-ent" aria-selected={subTab === 'enterprise-audit'} className="ss-tab" onClick={() => setSubTab('enterprise-audit')}>
              <Sliders size={15} /> Chuỗi & Nhật ký ({auditLogs.length})
            </button>
          )}
        </div>

        <div style={{ padding: '18px 20px' }}>
          {/* PANEL 1: KẾT NỐI POS EXCEL/CSV & NGOẠI CẢNH */}
          {canImportPos && (
            <div role="tabpanel" aria-labelledby="set-tab-pos" hidden={subTab !== 'pos-integration'}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '18px' }}>
                <div className="ss-card-subtle" style={{ padding: '16px' }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px' }}>
                    Nhập Dữ liệu Bán hàng POS (Excel / CSV)
                  </h2>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Cột chuẩn: <code>store_code, sku, sale_date, quantity_sold, sale_price</code>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button type="button" className="ss-btn ss-btn-secondary ss-btn-sm" onClick={handleDownloadTemplate}>
                      <Download size={14} /> Tải File Mẫu
                    </button>
                    <label className="ss-btn ss-btn-primary ss-btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                      <Upload size={14} /> Chọn file .XLSX / .CSV
                      <input type="file" accept=".xlsx,.csv,.txt" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                    {csvFileName && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{csvFileName}</span>}
                  </div>
                </div>

                <div className="ss-card-subtle" style={{ padding: '16px' }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px' }}>
                    Thời tiết & Ngày lễ (Phục vụ Dự báo)
                  </h2>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Nhiệt độ hiện tại: <strong>{weather?.temp || 30}°C</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {onSyncWeather && (
                      <button type="button" className="ss-btn ss-btn-primary ss-btn-sm" onClick={onSyncWeather} disabled={isSyncingWeather}>
                        <RefreshCw size={14} style={{ animation: isSyncingWeather ? 'spin 1s linear infinite' : 'none' }} /> Đồng bộ Open-Meteo
                      </button>
                    )}
                    <button
                      type="button"
                      className={`ss-btn ss-btn-sm ${weather?.isHoliday ? 'ss-btn-warning' : 'ss-btn-secondary'}`}
                      onClick={() => setWeather && setWeather({ ...weather, isHoliday: !weather?.isHoliday })}
                    >
                      <Calendar size={14} /> {weather?.isHoliday ? 'Đang bật Ngày lễ (+30%)' : 'Ngày thường'}
                    </button>
                  </div>
                </div>
              </div>

              {csvError && (
                <div role="alert" style={{ padding: '10px 12px', borderRadius: '6px', background: 'var(--danger-red-bg)', border: '1px solid var(--danger-red-border)', color: 'var(--danger-red-light)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '12px' }}>
                  {csvError}
                </div>
              )}

              {csvRows.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                      Kết quả kiểm tra trước khi nạp: <span style={{ color: 'var(--safe-green-light)' }}>{csvRows.filter(r => r.isValid).length} dòng hợp lệ</span> • <span style={{ color: 'var(--danger-red-light)' }}>{csvRows.filter(r => !r.isValid).length} dòng lỗi</span>
                    </div>
                    <button
                      type="button"
                      className="ss-btn ss-btn-primary"
                      disabled={importingCsv || csvRows.filter(r => r.isValid).length === 0}
                      onClick={handleConfirmPosImport}
                    >
                      {importingCsv ? 'Đang đồng bộ...' : `Xác nhận Đồng bộ ${csvRows.filter(r => r.isValid).length} dòng`}
                    </button>
                  </div>
                  <div className="table-wrapper">
                    <table className="ss-table">
                      <thead>
                        <tr>
                          <th scope="col">Dòng</th>
                          <th scope="col">Chi nhánh</th>
                          <th scope="col">SKU & Sản phẩm</th>
                          <th scope="col">Ngày bán</th>
                          <th scope="col">Số lượng</th>
                          <th scope="col">Đơn giá</th>
                          <th scope="col">Kiểm tra</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.map(r => (
                          <tr key={r.rowNum}>
                            <td className="num-tabular">{r.rowNum}</td>
                            <td style={{ fontFamily: 'monospace' }}>{r.storeCode}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{r.productName}</div>
                              <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-dim)' }}>{r.sku}</div>
                            </td>
                            <td className="num-tabular">{r.saleDate}</td>
                            <td className="num-tabular">{r.quantitySold}</td>
                            <td className="num-tabular">{Number(r.salePrice || 0).toLocaleString('vi-VN')} đ</td>
                            <td>
                              {r.isValid ? (
                                <span className="ss-badge ss-badge-safe">Hợp lệ</span>
                              ) : (
                                <span className="ss-badge ss-badge-danger">{r.issues.join(', ')}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PANEL 2: TÀI KHOẢN & PHÂN QUYỀN */}
          <div role="tabpanel" aria-labelledby="set-tab-users" hidden={subTab !== 'users-rbac'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  {isOwner ? 'Quản trị Tài khoản Nhân sự & Phân quyền Trang (3 Actor)' : 'Thông tin Tài khoản & Quyền hạn hiện tại'}
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Tài khoản đang đăng nhập: <strong>{currentUser?.fullName}</strong> ({currentUser?.roleCode}) • Chi nhánh #{currentUser?.storeId || 'Toàn chuỗi'}
                </p>
              </div>
              {isOwner && (
                <button type="button" className="ss-btn ss-btn-primary" onClick={() => setShowCreateUser(true)}>
                  <Plus size={15} /> Thêm Tài khoản mới
                </button>
              )}
            </div>

            {(isOwner || isManager) ? (
              <div className="table-wrapper" tabIndex={0} role="region" aria-label="Danh sách tài khoản hệ thống">
                <table className="ss-table ss-table-responsive">
                  <thead>
                    <tr>
                      <th scope="col">Tài khoản & Họ tên</th>
                      <th scope="col">Vai trò (Actor)</th>
                      <th scope="col">Chi nhánh</th>
                      <th scope="col">Trạng thái</th>
                      {isOwner && <th scope="col" style={{ textAlign: 'right' }}>Quản trị</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Đang tải danh sách nhân sự...</td></tr>
                    ) : users.map(u => {
                      const norm = normalizeRole(u.roleCode);
                      const isSelf = Number(u.id) === Number(currentUser?.id);
                      return (
                        <tr key={u.id}>
                          <td data-label="Nhân sự">
                            <div style={{ fontWeight: 700 }}>{u.fullName}</div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>@{u.username} • {u.email || '—'}</div>
                          </td>
                          <td data-label="Vai trò">
                            <span className={`ss-badge ${norm === 'ADMIN' ? 'ss-badge-indigo' : norm === 'STORE_MANAGER' ? 'ss-badge-info' : 'ss-badge-safe'}`}>
                              {norm === 'ADMIN' ? 'OWNER / Admin' : norm === 'STORE_MANAGER' ? 'MANAGER / Quản lý CH' : 'STAFF / Nhân viên'}
                            </span>
                          </td>
                          <td data-label="Chi nhánh">{u.storeName || (norm === 'ADMIN' ? 'Toàn chuỗi' : `CN #${u.storeId || 1}`)}</td>
                          <td data-label="Trạng thái">
                            <span className={`ss-badge ${u.isActive ? 'ss-badge-safe' : 'ss-badge-danger'}`}>
                              {u.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                            </span>
                          </td>
                          {isOwner && (
                            <td data-label="Quản trị" style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button type="button" className="ss-btn ss-btn-secondary ss-btn-sm" onClick={() => setEditUserTarget(u)}>
                                  <Edit3 size={13} /> Phân quyền
                                </button>
                                <button type="button" className="ss-btn ss-btn-secondary ss-btn-sm" onClick={() => setResetPwdTarget(u)}>
                                  <KeyRound size={13} /> Đặt MK
                                </button>
                                {!isSelf && (
                                  <button
                                    type="button"
                                    className="ss-btn ss-btn-secondary ss-btn-sm"
                                    onClick={async () => {
                                      const res = await api.apiToggleUserStatus(u.id, !u.isActive);
                                      if (res && res.success) {
                                        setToast({ type: 'success', text: `Đã ${u.isActive ? 'khóa' : 'mở khóa'} tài khoản ${u.username}.` });
                                        await loadUsers();
                                      }
                                    }}
                                  >
                                    {u.isActive ? <Lock size={13} /> : <Unlock size={13} />}
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ss-card-subtle" style={{ padding: '16px', fontSize: '0.85rem' }}>
                Bạn đang sử dụng tài khoản nhân viên (STAFF). Liên hệ Chủ chuỗi (OWNER) nếu cần thay đổi phạm vi phân quyền hoặc mở khóa trang chức năng.
              </div>
            )}
          </div>

          {/* PANEL 3: NHÀ CUNG CẤP & KHO TỔNG DC */}
          {canManageSuppliers && (
            <div role="tabpanel" aria-labelledby="set-tab-suppliers" hidden={subTab !== 'suppliers'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Danh sách Nhà cung cấp & Kho tổng DC</h2>
                <button
                  type="button"
                  className="ss-btn ss-btn-primary"
                  onClick={() => {
                    setEditingSupplier(null);
                    setSupForm({ code: `SUP-${Date.now().toString().slice(-4)}`, name: '', contactName: '', phone: '', email: '', address: '', leadTimeDays: 1 });
                    setSupError('');
                    setSupplierModalMode('CREATE');
                  }}
                >
                  <Plus size={15} /> Thêm Nhà cung cấp
                </button>
              </div>

              <div className="table-wrapper" tabIndex={0} role="region" aria-label="Danh sách nhà cung cấp">
                <table className="ss-table ss-table-responsive">
                  <thead>
                    <tr>
                      <th scope="col">Mã & Tên Nhà cung cấp</th>
                      <th scope="col">Liên hệ & Địa chỉ</th>
                      <th scope="col">Lead Time</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col" style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map(s => (
                      <tr key={s.id}>
                        <td data-label="Nhà cung cấp">
                          <div style={{ fontWeight: 700 }}>{s.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{s.code}</div>
                        </td>
                        <td data-label="Liên hệ" style={{ fontSize: '0.79rem', color: 'var(--text-muted)' }}>
                          <div>{s.contactName || '—'} • {s.phone || '—'}</div>
                          <div>{s.address || '—'}</div>
                        </td>
                        <td data-label="Lead Time" className="num-tabular">{s.leadTimeDays || 1} ngày</td>
                        <td data-label="Trạng thái">
                          <span className={`ss-badge ${s.isActive ? 'ss-badge-safe' : 'ss-badge-neutral'}`}>
                            {s.isActive ? 'Đang hợp tác' : 'Ngừng'}
                          </span>
                        </td>
                        <td data-label="Thao tác" style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="ss-btn ss-btn-secondary ss-btn-sm"
                            onClick={() => {
                              setEditingSupplier(s);
                              setSupForm({
                                code: s.code || '',
                                name: s.name || '',
                                contactName: s.contactName || '',
                                phone: s.phone || '',
                                email: s.email || '',
                                address: s.address || '',
                                leadTimeDays: Number(s.leadTimeDays || 1)
                              });
                              setSupError('');
                              setSupplierModalMode('EDIT');
                            }}
                          >
                            <Edit3 size={13} /> Sửa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PANEL 4: CẤU HÌNH CHUỖI & NHẬT KÝ HOẠT ĐỘNG */}
          {(isOwner || canViewAudit) && (
            <div role="tabpanel" aria-labelledby="set-tab-ent" hidden={subTab !== 'enterprise-audit'}>
              {isOwner && (
                <form onSubmit={handleSaveEnterprise} className="ss-card-subtle" style={{ padding: '16px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h2 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0 }}>Cấu hình Doanh nghiệp & Mô hình Chuỗi</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div className="ss-field">
                      <label className="ss-label" htmlFor="ent-name">Tên doanh nghiệp / Chuỗi</label>
                      <input id="ent-name" type="text" required value={entForm.enterpriseName} onChange={(e) => setEntForm({ ...entForm, enterpriseName: e.target.value })} />
                    </div>
                    <div className="ss-field">
                      <label className="ss-label" htmlFor="ent-limit">Hạn mức Manager tự duyệt PO (đ)</label>
                      <input id="ent-limit" type="number" min="0" step="500000" value={entForm.managerPoApprovalLimit} onChange={(e) => setEntForm({ ...entForm, managerPoApprovalLimit: Number(e.target.value) })} />
                    </div>
                    <div className="ss-field">
                      <label className="ss-label" htmlFor="ent-dc-mode">Kho trung tâm (tùy chọn)</label>
                      <select id="ent-dc-mode" value={entForm.hasCentralWarehouse ? 'YES' : 'NO'} onChange={(e) => setEntForm({ ...entForm, hasCentralWarehouse: e.target.value === 'YES' })}>
                        <option value="YES">Có dùng Kho trung tâm</option>
                        <option value="NO">Không dùng (Đặt thẳng NCC)</option>
                      </select>
                    </div>
                    {entForm.hasCentralWarehouse && (
                      <div className="ss-field">
                        <label className="ss-label" htmlFor="ent-dc-name">Tên Kho trung tâm</label>
                        <input id="ent-dc-name" type="text" value={entForm.centralWarehouseName} onChange={(e) => setEntForm({ ...entForm, centralWarehouseName: e.target.value })} />
                      </div>
                    )}
                  </div>
                  <div>
                    <button type="submit" className="ss-btn ss-btn-primary ss-btn-sm" disabled={savingEnt}>
                      <Save size={14} /> {savingEnt ? 'Đang lưu...' : 'Lưu cấu hình chuỗi'}
                    </button>
                  </div>
                </form>
              )}

              {canViewAudit && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                    <input
                      type="search"
                      aria-label="Tìm kiếm nhật ký thao tác"
                      placeholder="Tìm theo tài khoản, hành động, chi tiết..."
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      style={{ maxWidth: '340px' }}
                    />
                    <button type="button" className="ss-btn ss-btn-secondary ss-btn-sm" onClick={() => exportAuditLogsToExcel(filteredAuditLogs)}>
                      <Download size={14} /> Xuất Nhật ký
                    </button>
                  </div>

                  <div className="table-wrapper" tabIndex={0} role="region" aria-label="Nhật ký thao tác hệ thống">
                    <table className="ss-table ss-table-responsive">
                      <thead>
                        <tr>
                          <th scope="col">Thời gian</th>
                          <th scope="col">Tài khoản</th>
                          <th scope="col">Hành động</th>
                          <th scope="col">Chi tiết nghiệp vụ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAuditLogs.slice(0, 60).map(log => (
                          <tr key={log.id}>
                            <td data-label="Thời gian" className="num-tabular" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                              {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : (log.time || '—')}
                            </td>
                            <td data-label="Tài khoản" style={{ fontWeight: 600 }}>
                              {log.userName || log.user || (log.userId ? `User #${log.userId}` : 'Hệ thống')}
                            </td>
                            <td data-label="Hành động">
                              <span className="ss-badge ss-badge-indigo" style={{ fontFamily: 'monospace' }}>{log.actionType || log.action}</span>
                              {log.entityName && (
                                <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                                  [{log.entityName}{log.entityId ? `#${log.entityId}` : ''}]
                                </span>
                              )}
                            </td>
                            <td data-label="Chi tiết" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.description || log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Supplier Dialog */}
      <ModalDialog
        isOpen={Boolean(supplierModalMode)}
        onClose={() => setSupplierModalMode(null)}
        title={supplierModalMode === 'CREATE' ? 'Thêm Nhà cung cấp / DC mới' : `Sửa Nhà cung cấp: ${editingSupplier?.code}`}
      >
        <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
            <div className="ss-field">
              <label className="ss-label" htmlFor="sup-code">Mã NCC</label>
              <input id="sup-code" type="text" required value={supForm.code} onChange={(e) => setSupForm({ ...supForm, code: e.target.value })} />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="sup-name">Tên Nhà cung cấp *</label>
              <input id="sup-name" type="text" required value={supForm.name} onChange={(e) => setSupForm({ ...supForm, name: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div className="ss-field">
              <label className="ss-label" htmlFor="sup-contact">Người liên hệ</label>
              <input id="sup-contact" type="text" value={supForm.contactName} onChange={(e) => setSupForm({ ...supForm, contactName: e.target.value })} />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="sup-phone">Điện thoại</label>
              <input id="sup-phone" type="text" value={supForm.phone} onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })} />
            </div>
            <div className="ss-field">
              <label className="ss-label" htmlFor="sup-lead">Lead Time (ngày)</label>
              <input id="sup-lead" type="number" min="1" value={supForm.leadTimeDays} onChange={(e) => setSupForm({ ...supForm, leadTimeDays: Number(e.target.value) })} />
            </div>
          </div>
          <div className="ss-field">
            <label className="ss-label" htmlFor="sup-addr">Địa chỉ</label>
            <input id="sup-addr" type="text" value={supForm.address} onChange={(e) => setSupForm({ ...supForm, address: e.target.value })} />
          </div>
          {supError && (
            <div role="alert" style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--danger-red-bg)', color: 'var(--danger-red-light)', fontSize: '0.82rem', fontWeight: 600 }}>
              {supError}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="ss-btn ss-btn-secondary" onClick={() => setSupplierModalMode(null)}>Hủy</button>
            <button type="submit" className="ss-btn ss-btn-primary">Lưu Nhà cung cấp</button>
          </div>
        </form>
      </ModalDialog>

      <CreateUserModal
        isOpen={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        onUserCreated={() => { loadUsers(); setToast({ type: 'success', text: 'Đã tạo tài khoản mới thành công!' }); }}
      />
      <EditUserModal
        isOpen={Boolean(editUserTarget)}
        onClose={() => setEditUserTarget(null)}
        targetUser={editUserTarget}
        currentUser={currentUser}
        onUserUpdated={() => { loadUsers(); setToast({ type: 'success', text: 'Đã cập nhật thông tin & phân quyền nhân sự!' }); }}
      />
      <ResetPasswordModal
        isOpen={Boolean(resetPwdTarget)}
        onClose={() => setResetPwdTarget(null)}
        targetUser={resetPwdTarget}
        onSuccess={() => setToast({ type: 'success', text: 'Đã đặt lại mật khẩu thành công!' })}
      />
      <ChangePasswordModal
        isOpen={showChangePwd}
        onClose={() => setShowChangePwd(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
