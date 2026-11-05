import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Sliders, 
  Shield, 
  Truck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Save, 
  RotateCcw, 
  ScrollText, 
  Store, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  Info,
  Boxes,
  Layers
} from 'lucide-react';
import * as api from '../api';

export default function StoreSettingsView({ 
  currentUser, 
  isAdmin, 
  storeProfile, 
  products = [],
  batches = [],
  onProfileUpdated,
  onNavigateToAuditLog 
}) {
  const isManager = currentUser?.roleCode === 'STORE_MANAGER';
  const hasEditPermission = isAdmin || isManager;

  // Tính toán Tỷ lệ Chiếm dụng Quầy kệ Thực tế
  const activeProductsCount = (products || []).filter(p => p.isActive !== false).length;
  const currentUnitsOnShelf = (batches || [])
    .filter(b => b.status !== 'EXPIRED' && b.status !== 'DISPOSED')
    .reduce((sum, b) => sum + (Number(b.currentQuantity !== undefined ? b.currentQuantity : b.quantity) || 0), 0);

  const capacitySkus = Number(storeProfile?.shelfCapacitySkus) || 1500;
  const capacityUnits = Number(storeProfile?.shelfCapacityUnits) || 5000;

  const skuUtilizationPct = Math.min(100, Number(((activeProductsCount / capacitySkus) * 100).toFixed(1)));
  const unitsUtilizationPct = Math.min(100, Number(((currentUnitsOnShelf / capacityUnits) * 100).toFixed(1)));

  const [formData, setFormData] = useState({
    storeCode: 'RETAIL-STORE-01',
    storeName: '',
    address: '',
    phone: '',
    managerId: 4,
    managerName: 'Đỗ Tấn Du (Cửa Hàng Trưởng)',
    openTime: '06:00',
    closeTime: '22:00',
    status: 'OPEN',
    minInboundRslPercent: 70,
    defaultWarningDays: 7,
    criticalWarningDays: 3,
    defaultLeadTimeDays: 1,
    shelfCapacitySkus: 1500,
    shelfCapacityUnits: 5000,
    defaultDcSupplierName: 'Kho Phân Phối DC Biên Hòa',
    availableManagers: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(1);
  const [storesList, setStoresList] = useState([
    { id: 1, storeCode: 'RETAIL-STORE-01', storeName: 'LHU Mart Bửu Long', address: 'Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa', status: 'OPEN' },
    { id: 2, storeCode: 'RETAIL-STORE-02', storeName: 'LHU Mart Tân Phong', address: 'Số 48 Đồng Khởi, P. Tân Phong, TP. Biên Hòa', status: 'OPEN' },
    { id: 3, storeCode: 'RETAIL-STORE-03', storeName: 'LHU Mart Trảng Dài', address: 'Số 125 Bùi Trọng Nghĩa, P. Trảng Dài, TP. Biên Hòa', status: 'OPEN' }
  ]);

  useEffect(() => {
    api.apiGetAllStores().then(res => {
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      if (list.length > 0) {
        setStoresList(list);
      }
    }).catch(() => {});
  }, []);

  const syncFromProfile = (data) => {
    if (!data) return;
    setFormData({
      storeCode: data.storeCode || 'RETAIL-STORE-01',
      storeName: data.storeName || 'Cửa hàng Bán lẻ Tiện lợi LHU Mart',
      address: data.address || 'Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai',
      phone: data.phone || '0251.3952.778',
      managerId: Number(data.managerId) || 4,
      managerName: data.managerName || 'Đỗ Tấn Du (Cửa Hàng Trưởng)',
      openTime: data.openTime || '06:00',
      closeTime: data.closeTime || '22:00',
      status: data.status || 'OPEN',
      minInboundRslPercent: Number(data.minInboundRslPercent) || 70,
      defaultWarningDays: Number(data.defaultWarningDays) || 7,
      criticalWarningDays: Number(data.criticalWarningDays) || 3,
      defaultLeadTimeDays: Number(data.defaultLeadTimeDays) || 1,
      shelfCapacitySkus: Number(data.shelfCapacitySkus) || 1500,
      shelfCapacityUnits: Number(data.shelfCapacityUnits) || 5000,
      defaultDcSupplierName: data.defaultDcSupplierName || 'Kho Phân Phối DC Biên Hòa',
      availableManagers: Array.isArray(data.availableManagers) && data.availableManagers.length > 0
        ? data.availableManagers
        : [
            { id: 4, username: 'manager', fullName: 'Đỗ Tấn Du (Cửa Hàng Trưởng)' },
            { id: 2, username: 'dotandu', fullName: 'Đỗ Tấn Du' }
          ]
    });
  };

  useEffect(() => {
    if (storeProfile && selectedStoreId === 1) {
      syncFromProfile(storeProfile);
    } else {
      loadProfile(selectedStoreId);
    }
  }, [storeProfile]);

  const loadProfile = async (targetId = selectedStoreId) => {
    setIsLoading(true);
    try {
      const data = await api.apiGetStoreProfile(targetId);
      if (data) {
        syncFromProfile(data);
        if (targetId === 1 && onProfileUpdated) onProfileUpdated(data);
      }
    } catch (err) {
      console.error('Lỗi tải cấu hình chi nhánh:', err);
      setToastMessage({ type: 'error', text: 'Lỗi kết nối máy chủ SQL Server khi tải hồ sơ chi nhánh.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStore = async (storeId) => {
    setSelectedStoreId(storeId);
    await loadProfile(storeId);
  };

  const handleResetDefaults = () => {
    if (!isAdmin) return;
    setFormData(prev => ({
      ...prev,
      minInboundRslPercent: 70,
      defaultWarningDays: 7,
      criticalWarningDays: 3,
      defaultLeadTimeDays: 1,
      shelfCapacitySkus: 1500,
      shelfCapacityUnits: 5000,
      openTime: '06:00',
      closeTime: '22:00'
    }));
    setToastMessage({ 
      type: 'info', 
      text: 'Đã điền các tham số mặc định (Min RSL = 70%, Vàng = 7d, Đỏ = 3d, Lead Time = 1d, Sức chứa = 1,500 SKU / 5,000 units, Giờ hoạt động 06:00 - 22:00). Bấm "Lưu Cấu Hình" để ghi nhận.' 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToastMessage(null);

    if (isAdmin) {
      if (!formData.storeName.trim()) {
        setToastMessage({ type: 'error', text: 'Tên cửa hàng bán lẻ không được để trống.' });
        return;
      }

      if (formData.minInboundRslPercent < 50 || formData.minInboundRslPercent > 95) {
        setToastMessage({ type: 'error', text: 'Ngưỡng tiếp nhận xe tải DC (Min RSL) phải nằm trong khoảng từ 50% đến 95%.' });
        return;
      }

      if (formData.criticalWarningDays < 1 || formData.criticalWarningDays > 5) {
        setToastMessage({ type: 'error', text: 'Ngưỡng cảnh báo Vùng Đỏ phải từ 1 đến 5 ngày.' });
        return;
      }

      if (formData.defaultWarningDays < 3 || formData.defaultWarningDays > 30) {
        setToastMessage({ type: 'error', text: 'Ngưỡng cảnh báo Vùng Vàng phải từ 3 đến 30 ngày.' });
        return;
      }

      if (formData.criticalWarningDays >= formData.defaultWarningDays) {
        setToastMessage({ type: 'error', text: 'Ngưỡng cảnh báo Vùng Đỏ (nguy kịch) bắt buộc phải nhỏ hơn ngưỡng Vùng Vàng (cảnh báo).' });
        return;
      }

      if (formData.defaultLeadTimeDays < 1 || formData.defaultLeadTimeDays > 14) {
        setToastMessage({ type: 'error', text: 'Lead Time DC giao hàng phải từ 1 đến 14 ngày.' });
        return;
      }

      if (formData.shelfCapacitySkus < 100 || formData.shelfCapacitySkus > 10000) {
        setToastMessage({ type: 'error', text: 'Sức chứa quầy kệ (SKU) phải từ 100 đến 10.000 SKU.' });
        return;
      }

      if (formData.shelfCapacityUnits < 500 || formData.shelfCapacityUnits > 50000) {
        setToastMessage({ type: 'error', text: 'Sức chứa quầy kệ (đơn vị sản phẩm) phải từ 500 đến 50.000 đơn vị.' });
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = isAdmin
        ? {
            storeName: formData.storeName.trim(),
            address: formData.address.trim(),
            phone: formData.phone.trim(),
            managerId: Number(formData.managerId) || 4,
            openTime: formData.openTime || '06:00',
            closeTime: formData.closeTime || '22:00',
            status: formData.status,
            minInboundRslPercent: Number(formData.minInboundRslPercent),
            defaultWarningDays: Number(formData.defaultWarningDays),
            criticalWarningDays: Number(formData.criticalWarningDays),
            defaultLeadTimeDays: Number(formData.defaultLeadTimeDays),
            shelfCapacitySkus: Number(formData.shelfCapacitySkus),
            shelfCapacityUnits: Number(formData.shelfCapacityUnits)
          }
        : {
            status: formData.status,
            openTime: formData.openTime || '06:00',
            closeTime: formData.closeTime || '22:00'
          };

      const res = await api.apiUpdateStoreProfile(payload, selectedStoreId);
      if (res && res.success) {
        syncFromProfile(res.data);
        setToastMessage({ 
          type: 'success', 
          text: isAdmin
            ? `Đã lưu cấu hình [${res.data?.storeCode || formData.storeCode} - ${res.data?.storeName || formData.storeName}] & Tổng kho DC thành công! Đã ghi nhận vào Nhật ký kiểm toán.`
            : `Đã cập nhật trạng thái vận hành chi nhánh [${res.data?.status}] và giờ mở/đóng ca (${res.data?.openTime} - ${res.data?.closeTime}) thành công!`
        });
        if (selectedStoreId === 1 && onProfileUpdated) onProfileUpdated(res.data);
      } else {
        setToastMessage({ type: 'error', text: res?.message || 'Không thể cập nhật cấu hình cửa hàng.' });
      }
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Lỗi kết nối máy chủ khi lưu cấu hình.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'rgba(79, 70, 229, 0.12)',
            border: '1px solid rgba(79, 70, 229, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4f46e5'
          }}>
            <Sliders size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Cấu Hình Tham Số Cửa Hàng & DC Biên Hòa
              </h2>
              <span style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(79, 70, 229, 0.12)',
                color: '#4f46e5',
                fontWeight: 700,
                border: '1px solid rgba(79, 70, 229, 0.3)'
              }}>
                Chỉ Admin
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Thiết lập động các tiêu chuẩn nhận hàng DC (Min RSL), cảnh báo Shelf-life 3 màu và Lead Time
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onNavigateToAuditLog && (
            <button
              onClick={onNavigateToAuditLog}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Xem nhật ký kiểm toán ghi vết các lần đổi tham số"
            >
              <ScrollText size={16} color="#4f46e5" />
              <span>Sổ Nhật Ký Kiểm Toán</span>
            </button>
          )}

          <button
            onClick={loadProfile}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Tải lại</span>
          </button>
        </div>
      </div>

      {/* Thanh Chọn Chi Nhánh Chuỗi 3 Cửa Hàng (Store Selector Bar) */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--primary-bg)',
            border: '1px solid var(--primary-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Cấu Hình Theo Chi Nhánh Trong Chuỗi
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Chọn chi nhánh để thiết lập riêng biệt diện tích quầy kệ, ca trực và thông tin phụ trách
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {storesList.map(st => {
            const isSelected = selectedStoreId === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => handleSelectStore(st.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border-subtle)',
                  background: isSelected ? 'var(--primary-bg)' : 'var(--bg-subtle)',
                  color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Store size={14} color={isSelected ? 'var(--primary)' : 'var(--text-secondary)'} />
                <span>{st.storeName || st.storeCode}</span>
                <span style={{
                  fontSize: '0.675rem',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: st.status === 'OPEN' ? 'var(--primary-bg)' : 'var(--danger-red-bg)',
                  color: st.status === 'OPEN' ? 'var(--primary)' : 'var(--danger-red)',
                  fontWeight: 700,
                  border: '1px solid',
                  borderColor: st.status === 'OPEN' ? 'var(--primary-border)' : 'var(--danger-red-border)'
                }}>
                  {st.storeCode}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '14px'
      }}>
        {/* Card 1: Min RSL DC */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '14px',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: 600 }}>Tiêu Chuẩn Nhận DC (Min RSL)</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>
              {formData.minInboundRslPercent}%
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Khóa nhận hàng nếu RSL &lt; {formData.minInboundRslPercent}%
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6'
          }}>
            <Truck size={22} />
          </div>
        </div>

        {/* Card 2: Vùng Vàng */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '14px',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>Cảnh Báo Vùng Vàng</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
              {formData.defaultWarningDays} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>ngày</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Giảm 15%-30% &amp; SOP đảo kệ mặt tiền
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b'
          }}>
            <Clock size={22} />
          </div>
        </div>

        {/* Card 3: Vùng Đỏ */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '14px',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>Nguy Kịch Vùng Đỏ</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>
              {formData.criticalWarningDays} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>ngày</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Giảm 40%-50% gom xả khẩn trong ca
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <AlertTriangle size={22} />
          </div>
        </div>

        {/* Card 4: Lead Time DC */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '14px',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>Lead Time Giao Hàng DC</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              {formData.defaultLeadTimeDays} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>ngày</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Thời gian hàng về shop cho công thức ROP
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <ShieldCheck size={22} />
          </div>
        </div>

        {/* Card 5: Sức Chứa Quầy Kệ Chuẩn */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '14px',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#8b5cf6', fontWeight: 600 }}>Sức Chứa Quầy Kệ Chuẩn</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8b5cf6', marginTop: '2px' }}>
              {Number(formData.shelfCapacitySkus || 1500).toLocaleString('vi-VN')} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>SKU</span> • {Number(formData.shelfCapacityUnits || 5000).toLocaleString('vi-VN')} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>sp</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Ngưỡng dung lượng quầy kệ tối đa
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8b5cf6'
          }}>
            <Boxes size={22} />
          </div>
        </div>
      </div>

      {/* WIDGET GIÁM SÁT TỶ LỆ LẤP ĐẦY QUẦY KỆ THỜI GIAN THỰC (MỤC 3.1 & MỤC 5 & MỤC 6) */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
        padding: '16px 20px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: unitsUtilizationPct > 90 ? 'var(--danger-red)' : unitsUtilizationPct > 70 ? 'var(--warning-yellow)' : 'var(--safe-green)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Giám Sát Tải Trọng Quầy Kệ Thực Tế (Live Shelf Utilization)
            </span>
          </div>
          <span style={{
            fontSize: '0.72rem',
            padding: '3px 8px',
            borderRadius: '6px',
            background: unitsUtilizationPct > 90 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            color: unitsUtilizationPct > 90 ? 'var(--danger-red)' : 'var(--safe-green)',
            fontWeight: 700
          }}>
            {unitsUtilizationPct > 90 ? '⚠️ GẦN ĐẦY KỆ (>90%)' : '🟢 DUNG LƯỢNG AN TOÀN'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Thanh 1: Tải Danh Mục SKU */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '5px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Mặt hàng đang kinh doanh (SKU):</span>
              <strong style={{ color: 'var(--text-main)' }}>
                {activeProductsCount} / {capacitySkus.toLocaleString('vi-VN')} SKU <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>({skuUtilizationPct}%)</span>
              </strong>
            </div>
            <div style={{ height: '8px', width: '100%', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${skuUtilizationPct}%`,
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                borderRadius: '4px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Thanh 2: Tải Đơn Vị Sản Phẩm Lưu Kệ */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '5px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Hàng hóa đang bày trên quầy kệ:</span>
              <strong style={{ color: 'var(--text-main)' }}>
                {currentUnitsOnShelf.toLocaleString('vi-VN')} / {capacityUnits.toLocaleString('vi-VN')} đơn vị <span style={{ color: unitsUtilizationPct > 90 ? 'var(--danger-red)' : 'var(--safe-green)', fontWeight: 800 }}>({unitsUtilizationPct}%)</span>
              </strong>
            </div>
            <div style={{ height: '8px', width: '100%', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${unitsUtilizationPct}%`,
                background: unitsUtilizationPct > 90 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #10b981, #059669)',
                borderRadius: '4px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Toast Alert Message */}
      {toastMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: toastMessage.type === 'success' 
            ? 'rgba(16, 185, 129, 0.12)' 
            : toastMessage.type === 'info'
              ? 'rgba(59, 130, 246, 0.12)'
              : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : toastMessage.type === 'info' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: toastMessage.type === 'success' ? '#059669' : toastMessage.type === 'info' ? '#2563eb' : '#dc2626',
          fontSize: '0.875rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : toastMessage.type === 'info' ? <Info size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Section 1 & Section 2 Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          
          {/* Box 1: Tiêu chuẩn tiếp nhận hàng DC Biên Hòa */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6'
              }}>
                <Truck size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    1. Tiêu Chuẩn Tiếp Nhận Hàng DC
                  </h3>
                  {!isAdmin && (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(139, 92, 246, 0.12)',
                      color: '#8b5cf6',
                      border: '1px solid rgba(139, 92, 246, 0.3)'
                    }}>
                      SoD: Chỉ ADMIN cấu hình
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  Hàng rào kiểm soát chất lượng từ Trung tâm Phân phối DC Biên Hòa
                </span>
              </div>
            </div>

            {/* Min RSL Percent Slider & Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Tỷ lệ hạn sử dụng tối thiểu (Min RSL):
                </label>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6' }}>
                  {formData.minInboundRslPercent}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={formData.minInboundRslPercent}
                disabled={!isAdmin || isSaving}
                onChange={(e) => setFormData(prev => ({ ...prev, minInboundRslPercent: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: '#3b82f6', cursor: isAdmin ? 'pointer' : 'not-allowed' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                <span>50% (Dễ tính)</span>
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>70%</span>
                <span>90% (Rất khắt khe)</span>
              </div>
              <div style={{
                marginTop: '8px',
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'var(--bg-subtle)',
                fontSize: '0.725rem',
                color: 'var(--text-dim)',
                lineHeight: 1.4
              }}>
                Quy tắc gác cổng: Xe tải DC giao đến cửa hàng có <strong>RSL &lt; {formData.minInboundRslPercent}%</strong> sẽ bị hệ thống tự động khóa lưu và từ chối nhận hàng để ngăn ngừa nguy cơ tồn kho cận date.
              </div>
            </div>

            {/* Lead Time DC */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Lead Time giao hàng từ DC Biên Hòa về shop:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={formData.defaultLeadTimeDays}
                  disabled={!isAdmin || isSaving}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultLeadTimeDays: Number(e.target.value) }))}
                  style={{
                    width: '90px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>ngày giao hàng</span>
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Áp dụng trực tiếp vào công thức dự báo tái đặt hàng: <code>ROP = (d_adjusted * LeadTime) + SafetyStock</code>
              </div>
            </div>

            {/* Nhà cung cấp DC mặc định */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Tổng kho phân phối liên kết:
              </label>
              <input
                type="text"
                value={formData.defaultDcSupplierName}
                disabled
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.825rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                * Khóa cứng theo mô hình bán lẻ tinh gọn 1 shop duy nhất liên kết Tổng kho DC Biên Hòa
              </span>
            </div>

          </div>

          {/* Box 2: Ngưỡng Vòng Đời Shelf-Life 3 Cấp Màu */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b'
              }}>
                <Clock size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    2. Cảnh Báo Shelf-Life 3 Cấp Màu
                  </h3>
                  {!isAdmin && (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(139, 92, 246, 0.12)',
                      color: '#8b5cf6',
                      border: '1px solid rgba(139, 92, 246, 0.3)'
                    }}>
                      SoD: Chỉ ADMIN cấu hình
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  Phân loại mức độ cấp bách để tự động xả hàng và đảo vị trí quầy kệ
                </span>
              </div>
            </div>

            {/* Warning Days (Vùng Vàng) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Ngưỡng Vùng Vàng (Cận date - Warning):
                </label>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b' }}>
                  {formData.defaultWarningDays} ngày
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="15"
                step="1"
                value={formData.defaultWarningDays}
                disabled={!isAdmin || isSaving}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultWarningDays: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: '#f59e0b', cursor: isAdmin ? 'pointer' : 'not-allowed' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                <span>4 ngày</span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>7 ngày</span>
                <span>15 ngày</span>
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Hành động kích hoạt: Giảm 15%–30% Quick Markdown và thực hiện SOP đảo lô ra mặt tiền kệ.
              </div>
            </div>

            {/* Critical Days (Vùng Đỏ) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Ngưỡng Vùng Đỏ (Nguy kịch - Critical):
                </label>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ef4444' }}>
                  {formData.criticalWarningDays} ngày
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={formData.criticalWarningDays}
                disabled={!isAdmin || isSaving}
                onChange={(e) => setFormData(prev => ({ ...prev, criticalWarningDays: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: '#ef4444', cursor: isAdmin ? 'pointer' : 'not-allowed' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                <span>1 ngày</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>3 ngày</span>
                <span>3 ngày</span>
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Hành động kích hoạt: Giảm kịch sàn 40%–50% để thu hồi vốn lưu động trong ngày.
              </div>
            </div>

            {/* Ràng buộc Vùng Đen / Hết Hạn */}
            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.725rem',
              color: '#dc2626'
            }}>
              <Shield size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Khóa cứng Chuẩn Tự Động:</strong> Khi <code>DaysLeft &le; 0</code>, hệ thống tự động khóa cứng nút xuất bán tại quầy POS, phát âm thanh cảnh báo và buộc gom hàng tiêu hủy vào Sổ hao hụt.
              </span>
            </div>

          </div>

        </div>

        {/* Section 3: Thông tin Pháp Lý & Vận Hành Cửa Hàng */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981'
            }}>
              <Store size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 800, color: 'var(--text-main)' }}>
                3. Hồ Sơ Pháp Lý &amp; Trạng Thái Vận Hành Cửa Hàng
              </h3>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Định danh cơ sở bán lẻ duy nhất liên kết Co.op Smile - Đại học Lạc Hồng (RETAIL-STORE-01)
              </span>
            </div>
          </div>

          {formData.status !== 'OPEN' && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#dc2626',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>
                <strong>Cảnh báo vận hành:</strong> Cửa hàng đang ở trạng thái <code>{formData.status}</code> — Quầy thu ngân POS hiện đang <strong>KHÓA CỨNG chức năng thanh toán</strong> cho đến khi mở lại trạng thái <code>OPEN</code>.
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            
            {/* Store Code */}
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Mã định danh CSDL (Store Code):
              </label>
              <input
                type="text"
                value={formData.storeCode || 'RETAIL-STORE-01'}
                disabled
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                * Bảng StoreProfile duy nhất 1 bản ghi theo kiến trúc
              </span>
            </div>

            {/* Store Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Tên cửa hàng bán lẻ: <span style={{ color: 'var(--danger-red)' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.storeName}
                disabled={!isAdmin || isSaving}
                onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
                placeholder="Tên cửa hàng bán lẻ..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Cửa hàng trưởng phụ trách */}
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Cửa hàng trưởng phụ trách (Store Manager): <span style={{ color: 'var(--danger-red)' }}>*</span>
              </label>
              <select
                value={formData.managerId}
                disabled={!isAdmin || isSaving}
                onChange={(e) => {
                  const selectedId = Number(e.target.value);
                  const found = formData.availableManagers.find(m => Number(m.id) === selectedId);
                  setFormData(prev => ({
                    ...prev,
                    managerId: selectedId,
                    managerName: found ? found.fullName : prev.managerName
                  }));
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: isAdmin ? 'pointer' : 'not-allowed',
                  boxSizing: 'border-box'
                }}
              >
                {formData.availableManagers.map(mgr => (
                  <option key={mgr.id} value={mgr.id}>
                    👤 {mgr.fullName} (@{mgr.username})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                * Chịu trách nhiệm duyệt đơn PO gửi DC &amp; duyệt Sổ hao hụt
              </span>
            </div>

            {/* Trạng thái kinh doanh */}
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Trạng thái hoạt động cửa hàng: <span style={{ color: 'var(--danger-red)' }}>*</span>
              </label>
              <select
                value={formData.status}
                disabled={!hasEditPermission || isSaving}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: hasEditPermission ? 'pointer' : 'not-allowed',
                  boxSizing: 'border-box'
                }}
              >
                <option value="OPEN">🟢 OPEN - Đang Mở Cửa (Xuất bán bình thường)</option>
                <option value="CLOSED">🔴 CLOSED - Đóng Cửa Ca Đêm (Khóa POS)</option>
                <option value="INVENTORY">🟡 INVENTORY - Tạm Ngưng Kiểm Kê Kho (Khóa POS)</option>
                <option value="SUSPENDED">⚪ SUSPENDED - Tạm Ngừng Hoạt Động (Khóa POS)</option>
              </select>
            </div>

            {/* Giờ mở cửa / Giờ đóng cửa */}
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Giờ mở cửa / Giờ đóng cửa (2 Ca trực):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="time"
                  value={formData.openTime}
                  disabled={!hasEditPermission || isSaving}
                  onChange={(e) => setFormData(prev => ({ ...prev, openTime: e.target.value }))}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
                <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>đến</span>
                <input
                  type="time"
                  value={formData.closeTime}
                  disabled={!hasEditPermission || isSaving}
                  onChange={(e) => setFormData(prev => ({ ...prev, closeTime: e.target.value }))}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                * Chuẩn 2 ca: Ca sáng (06:00 - 14:00) &amp; Ca chiều (14:00 - 22:00)
              </span>
            </div>

            {/* Hotline */}
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Số điện thoại liên hệ:
              </label>
              <input
                type="text"
                value={formData.phone}
                disabled={!isAdmin || isSaving}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Số điện thoại..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Sức chứa quầy kệ SKU */}
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Sức chứa quầy kệ danh mục (SKU): <span style={{ color: 'var(--danger-red)' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  value={formData.shelfCapacitySkus}
                  disabled={!isAdmin || isSaving}
                  onChange={(e) => setFormData(prev => ({ ...prev, shelfCapacitySkus: Number(e.target.value) }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>SKU chuẩn</span>
              </div>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                * Chuẩn thiết kế 1,500 mã SKU
              </span>
            </div>

            {/* Sức chứa quầy kệ đơn vị sản phẩm (Units) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Sức chứa đơn vị sản phẩm tối đa (Units): <span style={{ color: 'var(--danger-red)' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="500"
                  max="50000"
                  value={formData.shelfCapacityUnits}
                  disabled={!isAdmin || isSaving}
                  onChange={(e) => setFormData(prev => ({ ...prev, shelfCapacityUnits: Number(e.target.value) }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>đơn vị SP</span>
              </div>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                * Chuẩn thiết kế 5,000 đơn vị lưu kệ
              </span>
            </div>

            {/* Address */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Địa chỉ cơ sở kinh doanh:
              </label>
              <input
                type="text"
                value={formData.address}
                disabled={!isAdmin || isSaving}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Địa chỉ trụ sở cửa hàng..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

          </div>

        </div>

        {/* Action Buttons Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.775rem', color: 'var(--text-dim)' }}>
            <Info size={16} color="#7c3aed" />
            <span>
              Mọi thay đổi tham số được mã hóa ghi vết bất biến vào bảng <code>AuditLogs</code>.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isAdmin && (
              <button
                type="button"
                onClick={handleResetDefaults}
                disabled={isSaving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Khôi phục các ngưỡng chuẩn hệ thống (Min RSL = 70%, Vàng = 7d, Đỏ = 3d, Lead Time = 1d)"
              >
                <RotateCcw size={15} />
                <span>Khôi Phục Mặc Định</span>
              </button>
            )}

            {hasEditPermission ? (
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Đang lưu cấu hình...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{isAdmin ? 'Lưu Cấu Hình Tham Số' : 'Lưu Trạng Thái & Giờ Hoạt Động'}</span>
                  </>
                )}
              </button>
            ) : (
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'var(--bg-subtle)'
              }}>
                Chế độ chỉ xem. Quyền cấu hình thuộc về Admin và Cửa hàng trưởng.
              </div>
            )}
          </div>
        </div>

      </form>

    </div>
  );
}
