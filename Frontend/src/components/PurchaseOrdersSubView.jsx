import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  RotateCw, 
  Eye, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  X, 
  ArrowRight,
  Package,
  Calendar,
  DollarSign,
  User,
  ShieldCheck,
  Check,
  Ban
} from 'lucide-react';

/**
 * Component Tab Quản Lý Vòng Đời Đơn Đặt Hàng PO Gửi DC
 * Chuỗi liên kết khép kín: Dự báo ROP -> Đơn PO -> Xe tải DC -> Nhập kho LHU Mart
 */
export default function PurchaseOrdersSubView({
  orders = [],
  loading = false,
  onRefresh,
  onUpdateStatus,
  isAdmin = false,
  onRequestAdminLogin,
  onNavigateToIntake,
  storeProfile = null
}) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPo, setSelectedPo] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Thống kê KPI Đơn Hàng PO
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING' || o.status === 'APPROVED' || o.status === 'DRAFT').length,
    shipping: orders.filter(o => o.status === 'SHIPPING' || o.status === 'SUBMITTED').length,
    completed: orders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED' || o.status === 'RECEIVED').length,
    totalValue: orders.reduce((sum, o) => sum + Number(o.totalEstimatedCost || 0), 0)
  };

  // Lọc danh sách theo Tab trạng thái và Ô tìm kiếm
  const filteredOrders = orders.filter(o => {
    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PENDING') {
        matchesStatus = o.status === 'PENDING' || o.status === 'APPROVED' || o.status === 'DRAFT';
      } else if (statusFilter === 'SHIPPING') {
        matchesStatus = o.status === 'SHIPPING' || o.status === 'SUBMITTED';
      } else if (statusFilter === 'COMPLETED') {
        matchesStatus = o.status === 'COMPLETED' || o.status === 'DELIVERED' || o.status === 'RECEIVED';
      } else {
        matchesStatus = o.status === statusFilter;
      }
    }

    if (!searchQuery.trim()) return matchesStatus;

    const query = searchQuery.toLowerCase().trim();
    const codeMatch = (o.orderCode || '').toLowerCase().includes(query);
    const supplierMatch = (o.supplierName || '').toLowerCase().includes(query);
    const itemMatch = o.items?.some(it => (it.productName || '').toLowerCase().includes(query) || (it.productSku || '').toLowerCase().includes(query));

    return matchesStatus && (codeMatch || supplierMatch || itemMatch);
  });

  const handleActionClick = async (poId, nextStatus) => {
    if (!isAdmin) {
      alert('Chỉ Quản trị viên (Admin) hoặc Cửa hàng trưởng mới có thẩm quyền chuyển trạng thái đơn PO!');
      if (onRequestAdminLogin) onRequestAdminLogin();
      return;
    }
    setUpdatingId(poId);
    try {
      await onUpdateStatus(poId, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
      case 'DRAFT':
        return {
          label: 'Chờ duyệt DC (DRAFT)',
          bg: 'var(--warning-yellow-bg)',
          color: 'var(--warning-yellow)',
          border: 'var(--warning-yellow-border)'
        };
      case 'APPROVED':
        return {
          label: 'Đã duyệt (APPROVED)',
          bg: 'var(--primary-bg)',
          color: 'var(--primary)',
          border: 'var(--primary-border)'
        };
      case 'SHIPPING':
      case 'SUBMITTED':
        return {
          label: 'Đã gửi DC / Đang giao',
          bg: 'var(--expired-purple-bg)',
          color: 'var(--expired-purple)',
          border: 'var(--expired-purple-border)'
        };
      case 'COMPLETED':
      case 'DELIVERED':
      case 'RECEIVED':
        return {
          label: 'Đã nhập kho (DELIVERED)',
          bg: 'var(--safe-green-bg)',
          color: 'var(--safe-green)',
          border: 'var(--safe-green-border)'
        };
      case 'CANCELLED':
        return {
          label: 'Đã hủy (CANCELLED)',
          bg: 'var(--danger-red-bg)',
          color: 'var(--danger-red)',
          border: 'var(--danger-red-border)'
        };
      default:
        return {
          label: status,
          bg: 'var(--bg-subtle)',
          color: 'var(--text-muted)',
          border: 'var(--border-subtle)'
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 4 CARDS KPI VÒNG ĐỜI ĐƠN PO */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        {/* Card 1: Tổng đơn PO */}
        <div style={{
          padding: '16px',
          background: 'var(--bg-surface)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '9px',
            background: 'var(--primary-bg)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TỔNG ĐƠN ĐẶT HÀNG PO</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {stats.total} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>đơn</span>
            </div>
          </div>
        </div>

        {/* Card 2: Chờ DC duyệt & xuất hàng */}
        <div style={{
          padding: '16px',
          background: 'var(--bg-surface)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '9px',
            background: 'var(--warning-yellow-bg)',
            color: 'var(--warning-yellow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--warning-yellow-border)'
          }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CHỜ DC DUYỆT / XUẤT BẾN</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--warning-yellow)', marginTop: '2px' }}>
              {stats.pending} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>đơn</span>
            </div>
          </div>
        </div>

        {/* Card 3: Xe tải DC đang vận chuyển */}
        <div style={{
          padding: '16px',
          background: 'var(--bg-surface)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '9px',
            background: 'var(--expired-purple-bg)',
            color: 'var(--expired-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--expired-purple-border)'
          }}>
            <Truck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>XE TẢI ĐANG CHUYỂN ĐẾN</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--expired-purple)', marginTop: '2px' }}>
              {stats.shipping} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>đơn</span>
            </div>
          </div>
        </div>

        {/* Card 4: Tổng ngân sách tiếp tế */}
        <div style={{
          padding: '16px',
          background: 'var(--bg-surface)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '9px',
            background: 'var(--safe-green-bg)',
            color: 'var(--safe-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--safe-green-border)'
          }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TỔNG DỰ TOÁN NGÂN SÁCH</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--safe-green)', marginTop: '2px' }}>
              {stats.totalValue.toLocaleString('vi-VN')} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR BỘ LỌC TRẠNG THÁI & TÌM KIẾM */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-surface)',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Tabs Trạng thái */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PENDING', label: 'Chờ duyệt / Chuẩn bị' },
            { id: 'SHIPPING', label: 'Xe tải đang giao' },
            { id: 'COMPLETED', label: 'Đã nhập kho' },
            { id: 'CANCELLED', label: 'Đã hủy' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '5px 11px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: statusFilter === tab.id ? 'var(--primary-border)' : 'var(--border-subtle)',
                background: statusFilter === tab.id ? 'var(--primary-bg)' : 'var(--bg-subtle)',
                color: statusFilter === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: statusFilter === tab.id ? 700 : 500,
                fontSize: '0.785rem',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Ô Tìm kiếm nhanh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '8px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Tìm theo mã PO, sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.785rem'
            }}
            title="Tải lại danh sách từ CSDL"
          >
            <RotateCw size={13} className={loading ? 'spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* BẢNG DANH SÁCH ĐƠN ĐẶT HÀNG PO */}
      <div className="glass-panel" style={{
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="modern-table" style={{ margin: 0, width: '100%' }}>
            <thead style={{ background: 'var(--bg-subtle)' }}>
              <tr>
                <th style={{ width: '160px', padding: '10px 14px' }}>Mã Đơn PO</th>
                <th style={{ padding: '10px 14px' }}>Chi Tiết Mặt Hàng Đặt</th>
                <th style={{ width: '120px', padding: '10px 14px' }}>Ngày Tạo</th>
                <th style={{ width: '120px', padding: '10px 14px' }}>Dự Kiến Giao</th>
                <th style={{ width: '130px', textAlign: 'right', padding: '10px 14px' }}>Dự Toán Chi Phí</th>
                <th style={{ width: '140px', textAlign: 'center', padding: '10px 14px' }}>Trạng Thái Vòng Đời</th>
                <th style={{ width: '180px', textAlign: 'right', padding: '10px 14px' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Không tìm thấy đơn đặt hàng PO nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(po => {
                  const badge = getStatusBadge(po.status);
                  const isUpdating = updatingId === po.id;

                  return (
                    <tr key={po.id}>
                      {/* Mã Đơn PO */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {po.orderCode}
                        </div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{storeProfile?.storeCode || 'RETAIL-STORE-01'}</span> → {po.supplierName || storeProfile?.defaultDcSupplierName || 'Kho Tổng DC Biên Hòa'}
                        </div>
                      </td>

                      {/* Chi tiết mặt hàng */}
                      <td style={{ padding: '10px 14px' }}>
                        {po.items && po.items.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {po.items.map((it, idx) => (
                              <div key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 600 }}>• {it.productName}</span>
                                <span style={{
                                  fontSize: '0.7rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: 'var(--bg-subtle)',
                                  color: 'var(--text-secondary)',
                                  fontWeight: 700
                                }}>
                                  +{it.approvedQuantity || it.suggestedQuantity} {it.unit || 'hộp'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {po.totalItemsCount || 1} mặt hàng FMCG
                          </span>
                        )}
                      </td>

                      {/* Ngày Tạo */}
                      <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)', padding: '10px 14px' }}>
                        {po.createdAt ? new Date(po.createdAt).toLocaleDateString('vi-VN') : '---'}
                      </td>

                      {/* Ngày Dự Kiến Giao */}
                      <td style={{ fontSize: '0.775rem', color: 'var(--text-main)', fontWeight: 600, padding: '10px 14px' }}>
                        {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('vi-VN') : 'Trong 24h'}
                      </td>

                      {/* Tổng Dự Toán Chi Phí */}
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem', padding: '10px 14px' }}>
                        {Number(po.totalEstimatedCost || 0).toLocaleString('vi-VN')} đ
                      </td>

                      {/* Trạng Thái */}
                      <td style={{ textAlign: 'center', padding: '10px 14px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          fontWeight: 700,
                          display: 'inline-block'
                        }}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Hành Động */}
                      <td style={{ textAlign: 'right', padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedPo(po)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '5px',
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--bg-surface)',
                              color: 'var(--text-secondary)',
                              fontSize: '0.725rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Xem chi tiết đơn hàng"
                          >
                            <Eye size={12} />
                            <span>Xem</span>
                          </button>

                          {/* Nếu đang chờ duyệt -> Duyệt đơn (APPROVED) hoặc Gửi DC (SUBMITTED) */}
                          {(po.status === 'PENDING' || po.status === 'DRAFT') && (
                            <button
                              type="button"
                              onClick={() => handleActionClick(po.id, 'APPROVED')}
                              disabled={isUpdating}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'var(--primary)',
                                color: '#ffffff',
                                fontSize: '0.725rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: 'var(--shadow-sm)'
                              }}
                              title="Cửa hàng trưởng phê duyệt đơn đặt hàng"
                            >
                              <Check size={12} />
                              <span>Duyệt Đơn</span>
                            </button>
                          )}

                          {/* Nếu đã duyệt -> Gửi DC / Xe Xuất Bến (SUBMITTED) */}
                          {(po.status === 'APPROVED' || po.status === 'PENDING' || po.status === 'DRAFT') && (
                            <button
                              type="button"
                              onClick={() => handleActionClick(po.id, 'SUBMITTED')}
                              disabled={isUpdating}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--primary-border)',
                                background: 'var(--primary-bg)',
                                color: 'var(--primary)',
                                fontSize: '0.725rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Gửi đơn đặt hàng về Kho tổng DC Biên Hòa"
                            >
                              <Truck size={12} />
                              <span>Gửi DC</span>
                            </button>
                          )}

                          {/* Nếu xe đang giao -> Chuyển sang tiếp nhận DC */}
                          {(po.status === 'SHIPPING' || po.status === 'SUBMITTED') && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onNavigateToIntake) {
                                   onNavigateToIntake(po);
                                } else {
                                  handleActionClick(po.id, 'DELIVERED');
                                }
                              }}
                              disabled={isUpdating}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'var(--safe-green)',
                                color: '#ffffff',
                                fontSize: '0.725rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: 'var(--shadow-sm)'
                              }}
                              title="Mở màn hình tiếp nhận hàng DC để nhập lô"
                            >
                              <CheckCircle2 size={12} />
                              <span>Nhận Hàng DC</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT ĐƠN ĐẶT HÀNG PO */}
      {selectedPo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--modal-backdrop)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-surface-elevated)',
            color: 'var(--text-main)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '560px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-elevated)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Header Modal */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--primary-bg)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--primary-border)'
                }}>
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>CHI TIẾT ĐƠN ĐẶT HÀNG PO</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    Mã đơn: <strong style={{ color: 'var(--primary)' }}>{selectedPo.orderCode}</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPo(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Nội dung chi tiết đơn PO */}
            <div style={{ padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.785rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Cơ sở đặt hàng: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{storeProfile?.storeName || 'LHU Mart'} ({storeProfile?.storeCode || 'RETAIL-STORE-01'})</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Kho cung cấp: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{selectedPo.supplierName || storeProfile?.defaultDcSupplierName || 'Kho Tổng DC Biên Hòa'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Địa chỉ nhận: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{storeProfile?.address || 'Khu phố 6, P. Trung Dũng, TP. Biên Hòa'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Trạng thái: </span>
                  <strong style={{ color: getStatusBadge(selectedPo.status).color }}>{getStatusBadge(selectedPo.status).label}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Người lập đơn: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{selectedPo.createdByName || 'Cửa hàng trưởng'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Dự kiến giao: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{selectedPo.expectedDeliveryDate ? new Date(selectedPo.expectedDeliveryDate).toLocaleDateString('vi-VN') : 'Trong 24h'}</strong>
                </div>
              </div>

              {/* Bảng Mặt Hàng */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  DANH SÁCH MẶT HÀNG BỔ SUNG:
                </div>
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table className="modern-table" style={{ margin: 0, width: '100%', fontSize: '0.8rem' }}>
                    <thead style={{ background: 'var(--bg-subtle)' }}>
                      <tr>
                        <th style={{ padding: '8px 10px' }}>Sản phẩm</th>
                        <th style={{ width: '80px', textAlign: 'center', padding: '8px 10px' }}>Số lượng</th>
                        <th style={{ width: '100px', textAlign: 'right', padding: '8px 10px' }}>Đơn giá</th>
                        <th style={{ width: '110px', textAlign: 'right', padding: '8px 10px' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPo.items && selectedPo.items.length > 0 ? (
                        selectedPo.items.map((it, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{it.productName}</div>
                              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>{it.productSku}</div>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-main)', padding: '8px 10px' }}>
                              {it.approvedQuantity || it.suggestedQuantity} {it.unit || 'hộp'}
                            </td>
                            <td style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-secondary)' }}>
                              {(it.unitCost || 25000).toLocaleString('vi-VN')} đ
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)', padding: '8px 10px' }}>
                              {Number(it.totalLineCost || ((it.approvedQuantity || it.suggestedQuantity) * (it.unitCost || 25000))).toLocaleString('vi-VN')} đ
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                            1 mặt hàng FMCG đặt bổ sung
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tổng tiền */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'var(--primary-bg)',
                borderRadius: '8px',
                border: '1px solid var(--primary-border)'
              }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>TỔNG GIÁ TRỊ ĐƠN ĐẶT HÀNG:</span>
                <span style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--primary)' }}>
                  {Number(selectedPo.totalEstimatedCost || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Footer Modal Actions */}
            <div style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-subtle)'
            }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  fontSize: '0.785rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Printer size={14} />
                <span>In Biên Bản PO</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPo(null)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
