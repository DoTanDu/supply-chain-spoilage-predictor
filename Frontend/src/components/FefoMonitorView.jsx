import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  Zap, 
  RotateCw, 
  Trash2, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';

export default function FefoMonitorView({ 
  batches, 
  onQuickDiscount, 
  onRotateShelf, 
  onOpenDisposalModal 
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filter logic
  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.productName.toLowerCase().includes(search.toLowerCase()) || 
                          batch.batchCode.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter === 'ALL' || batch.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate Days Remaining
  const getDaysRemaining = (expiryDate) => {
    const now = new Date('2026-09-24');
    const exp = new Date(expiryDate);
    const diffTime = exp - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate RSL %
  const getRslPercentage = (importDate, expiryDate) => {
    const imp = new Date(importDate);
    const exp = new Date(expiryDate);
    const now = new Date('2026-09-24');
    const totalLife = Math.max(1, (exp - imp) / (1000 * 60 * 60 * 24));
    const remainingLife = Math.max(0, (exp - now) / (1000 * 60 * 60 * 24));
    return Math.min(100, Math.round((remainingLife / totalLife) * 100));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header & Controls */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={22} color="var(--safe-green)" />
              Giám Sát Hạn Sử Dụng & Điều Phối Kệ Hàng (FEFO)
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Tự động phân loại 3 ngưỡng an toàn (RSL). Lô cận date nhất luôn được ưu tiên xuất bán trước.
            </p>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
            <input 
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Tìm theo tên sản phẩm, mã lô..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Badges */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.785rem', padding: '6px 14px' }}
            onClick={() => setStatusFilter('ALL')}
          >
            Tất cả ({batches.length})
          </button>
          <button
            className={`btn ${statusFilter === 'CRITICAL' ? 'btn-danger' : 'btn-secondary'}`}
            style={{ fontSize: '0.785rem', padding: '6px 14px' }}
            onClick={() => setStatusFilter('CRITICAL')}
          >
            🔴 Cận date khẩn cấp (≤10%)
          </button>
          <button
            className={`btn ${statusFilter === 'WARNING' ? 'btn-warning' : 'btn-secondary'}`}
            style={{ fontSize: '0.785rem', padding: '6px 14px' }}
            onClick={() => setStatusFilter('WARNING')}
          >
            🟡 Cảnh báo vàng (10-20%)
          </button>
          <button
            className={`btn ${statusFilter === 'SAFE' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.785rem', padding: '6px 14px' }}
            onClick={() => setStatusFilter('SAFE')}
          >
            🟢 An toàn (&gt;20%)
          </button>
          <button
            className={`btn ${statusFilter === 'EXPIRED' ? 'btn-secondary' : 'btn-secondary'}`}
            style={{ fontSize: '0.785rem', padding: '6px 14px', borderColor: statusFilter === 'EXPIRED' ? 'var(--expired-purple)' : 'var(--border-color)' }}
            onClick={() => setStatusFilter('EXPIRED')}
          >
            🟣 Đã hết hạn (Khóa POS)
          </button>
        </div>
      </div>

      {/* Batches Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Mã Lô & Ngành Hàng</th>
                <th>Tên Sản Phẩm</th>
                <th>Ngày Nhập</th>
                <th>Hạn Sử Dụng (EXP)</th>
                <th>Còn Lại (DUE)</th>
                <th>Vòng Đời (RSL %)</th>
                <th>Tồn Kho</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Hành Động Khắc Phục</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map(batch => {
                const daysLeft = getDaysRemaining(batch.expiryDate);
                const rsl = getRslPercentage(batch.importDate, batch.expiryDate);
                const isCritical = batch.status === 'CRITICAL';
                const isWarning = batch.status === 'WARNING';
                const isExpired = batch.status === 'EXPIRED';

                return (
                  <tr key={batch.id} style={{ background: isCritical ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{batch.batchCode}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{batch.category}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{batch.productName}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                        Giá vốn: {batch.costPrice.toLocaleString('vi-VN')} đ
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{batch.importDate}</td>
                    <td style={{ fontWeight: 600, color: daysLeft <= 3 ? '#f87171' : '#ffffff' }}>
                      {batch.expiryDate}
                    </td>
                    <td>
                      {isExpired ? (
                        <span style={{ color: '#c084fc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={13} /> Quá hạn {Math.abs(daysLeft)} ngày
                        </span>
                      ) : (
                        <span style={{ fontWeight: 700, color: daysLeft <= 3 ? '#ef4444' : daysLeft <= 10 ? '#f59e0b' : '#10b981' }}>
                          {daysLeft} ngày
                        </span>
                      )}
                    </td>
                    <td style={{ minWidth: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${rsl}%`,
                            background: isExpired ? 'var(--expired-purple)' : isCritical ? 'var(--danger-red)' : isWarning ? 'var(--warning-yellow)' : 'var(--safe-green)'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, width: '32px' }}>{rsl}%</span>
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '1rem', color: batch.quantity === 0 ? 'var(--text-dim)' : '#ffffff' }}>
                        {batch.quantity}
                      </strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        {isCritical && <span className="badge badge-danger">Cận Date Đỏ</span>}
                        {isWarning && <span className="badge badge-warning">Cảnh Báo Vàng</span>}
                        {batch.status === 'SAFE' && <span className="badge badge-safe">An Toàn</span>}
                        {isExpired && <span className="badge badge-expired">Khóa Bán POS</span>}
                        {batch.isDiscounted && (
                          <span className="badge badge-warning" style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.25)', borderColor: '#f59e0b' }}>
                            ⚡ -{batch.discountPercent || 30}% Xả Hàng
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {isCritical && (
                          <button
                            className="btn btn-warning"
                            style={{ fontSize: '0.725rem', padding: '4px 10px', opacity: batch.isDiscounted ? 0.6 : 1 }}
                            onClick={() => onQuickDiscount(batch.id)}
                            disabled={batch.isDiscounted}
                            title={batch.isDiscounted ? "Lô hàng đã được áp dụng giảm giá 30%" : "Xả hàng giảm giá 30% kích cầu bán lẻ"}
                          >
                            <Zap size={13} /> {batch.isDiscounted ? "Đã Giảm 30%" : "Giảm 30%"}
                          </button>
                        )}

                        {(isCritical || isWarning) && (
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.725rem', padding: '4px 10px' }}
                            onClick={() => onRotateShelf(batch.id)}
                            title="Đảo lô hàng ra mặt trước kệ để khách mua trước"
                          >
                            <RotateCw size={13} /> Đảo Kệ
                          </button>
                        )}

                        {isExpired && (
                          <button
                            className="btn btn-danger"
                            style={{ fontSize: '0.725rem', padding: '4px 10px' }}
                            onClick={() => onOpenDisposalModal(batch)}
                            title="Lập phiếu tiêu hủy hàng quá hạn"
                          >
                            <Trash2 size={13} /> Hủy Lô
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
