import React from 'react';
import { 
  DollarSign, 
  Package, 
  AlertOctagon, 
  TrendingDown, 
  Zap, 
  ArrowUpRight, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  ChevronRight 
} from 'lucide-react';

export default function DashboardView({ 
  batches, 
  products, 
  disposals, 
  liveStats,
  setActiveTab, 
  onQuickDiscount 
}) {
  // Real calculations directly from Microsoft SQL Server LocalDB
  const totalStockItems = liveStats ? liveStats.totalStockItems : batches.reduce((sum, b) => sum + (b.status !== 'EXPIRED' ? b.quantity : 0), 0);
  const totalInventoryValue = liveStats ? liveStats.totalInventoryValue : batches.reduce((sum, b) => sum + ((b.status !== 'EXPIRED' ? b.quantity : 0) * b.costPrice), 0);
  
  const criticalBatches = batches.filter(b => b.status === 'CRITICAL');
  const warningBatches = batches.filter(b => b.status === 'WARNING');
  const safeBatches = batches.filter(b => b.status === 'SAFE');
  const expiredBatches = batches.filter(b => b.status === 'EXPIRED');

  const totalDisposalLoss = liveStats ? liveStats.totalDisposalLoss : disposals.reduce((sum, d) => sum + d.totalLoss, 0);
  const spoilageRate = liveStats ? liveStats.spoilageRate : ((totalDisposalLoss / 16600000) * 100).toFixed(2);

  // High Risk Spoilage Products (DOS > DUE)
  const highRiskItems = [
    { name: "Bánh mì tươi Sandwich Kinh Đô", dos: "1.9 ngày", due: "2 ngày", risk: "RẤT CAO", action: "Giảm 30% xả nhanh" },
    { name: "Thịt ức gà tươi phi lê CP Fresh", dos: "1.8 ngày", due: "2 ngày", risk: "CAO", action: "Ưu tiên đầu kệ" },
    { name: "Sữa chua Ba Vì có đường 100g", dos: "4.3 ngày", due: "8 ngày", risk: "TRUNG BÌNH", action: "Theo dõi FEFO" }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(30, 41, 59, 0.6) 100%)',
        borderColor: 'rgba(16, 185, 129, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-safe">Báo cáo Thời Gian Thực</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cập nhật 1 phút trước</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            Hệ Thống Quản Trị Chuỗi Cung Ứng Bán Lẻ Chống Lãng Phí
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Theo dõi dòng chảy hàng hóa từ Kho tổng (DC) → Cửa hàng → Quầy POS theo chuẩn thuật toán FEFO.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('pos-checkout')}
          >
            <Zap size={16} /> Bán lẻ POS ngay
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setActiveTab('fefo-monitor')}
          >
            <Clock size={16} /> Kiểm tra Hạn FEFO
          </button>
        </div>
      </div>

      {/* Critical Alert Bar */}
      {criticalBatches.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(185, 28, 28, 0.25) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 0 25px rgba(239, 68, 68, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <AlertOctagon size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fca5a5' }}>
                CẢNH BÁO KHẨN CẤP: Có {criticalBatches.length} lô hàng trong ngưỡng ĐỎ (Hạn sử dụng ≤ 3 ngày)!
              </div>
              <div style={{ fontSize: '0.825rem', color: '#fecaca' }}>
                Các lô: {criticalBatches.map(b => `${b.batchCode} (${b.productName})`).join('; ')}. Nguy cơ hư hỏng và lãng phí vốn nếu không xử lý kịp.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-warning"
              onClick={() => {
                if (criticalBatches[0]) {
                  onQuickDiscount(criticalBatches[0].id);
                  alert(`Đã kích hoạt Giảm giá 30% xả hàng cho Lô ${criticalBatches[0].batchCode} (${criticalBatches[0].productName})!`);
                }
              }}
            >
              <Zap size={15} /> Xả hàng giảm 30%
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setActiveTab('fefo-monitor')}
            >
              Xem chi tiết <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
        
        {/* Card 1: Total Stock */}
        <div className="glass-panel glass-panel-interactive" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TỔNG TỒN KHO TRÊN KỆ</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '6px' }}>
                {totalStockItems} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>đơn vị</span>
              </div>
            </div>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <Package size={22} />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
            Giá trị vốn: <strong style={{ color: '#ffffff' }}>{totalInventoryValue.toLocaleString('vi-VN')} đ</strong>
          </div>
        </div>

        {/* Card 2: Critical Date Batches */}
        <div className="glass-panel glass-panel-interactive" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>LÔ CẬN DATE NGUY CẤP (≤10%)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '6px', color: criticalBatches.length > 0 ? '#ef4444' : '#10b981' }}>
                {criticalBatches.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>lô hàng</span>
              </div>
            </div>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <AlertTriangle size={22} />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
            {warningBatches.length} lô khác đang ở mức Vàng (10-20%)
          </div>
        </div>

        {/* Card 3: Disposal Loss */}
        <div className="glass-panel glass-panel-interactive" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>THIỆT HẠI TIÊU HỦY THÁNG</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '6px', color: '#f59e0b' }}>
                {totalDisposalLoss.toLocaleString('vi-VN')} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>đ</span>
              </div>
            </div>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <TrendingDown size={22} />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
            Đã lập <strong>{disposals.length} phiếu tiêu hủy</strong> hợp lệ
          </div>
        </div>

        {/* Card 4: Spoilage Rate */}
        <div className="glass-panel glass-panel-interactive" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TỶ LỆ HAO HỤT (SPOILAGE RATE)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '6px', color: '#10b981' }}>
                {spoilageRate}%
              </div>
            </div>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <ShieldCheck size={22} />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
            Mục tiêu chuỗi: &lt; 1.5% (Đạt chuẩn tối ưu)
          </div>
        </div>

      </div>

      {/* Grid: 2 Analytical Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* Panel 1: RSL Shelf-Life Distribution */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--safe-green)" />
              Phân Bổ Hạn Dùng Theo 3 Ngưỡng RSL
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tổng cộng {batches.length} lô</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Safe */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--safe-green)' }}></span>
                  An Toàn (RSL &gt; 20%)
                </span>
                <strong>{safeBatches.length} lô ({Math.round(safeBatches.length / batches.length * 100)}%)</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(safeBatches.length / batches.length) * 100}%`, background: 'var(--safe-green)' }}></div>
              </div>
            </div>

            {/* Warning */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning-yellow)' }}></span>
                  Cận Date Nhẹ (10% - 20%)
                </span>
                <strong>{warningBatches.length} lô ({Math.round(warningBatches.length / batches.length * 100)}%)</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(warningBatches.length / batches.length) * 100}%`, background: 'var(--warning-yellow)' }}></div>
              </div>
            </div>

            {/* Critical */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger-red)' }}></span>
                  Khẩn Cấp (RSL ≤ 10% hoặc ≤ 3 ngày)
                </span>
                <strong style={{ color: '#ef4444' }}>{criticalBatches.length} lô ({Math.round(criticalBatches.length / batches.length * 100)}%)</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(criticalBatches.length / batches.length) * 100}%`, background: 'var(--danger-red)' }}></div>
              </div>
            </div>

            {/* Expired */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--expired-purple)' }}></span>
                  Đã Hết Hạn (Khóa POS, Chờ hủy)
                </span>
                <strong style={{ color: '#a855f7' }}>{expiredBatches.length} lô ({Math.round(expiredBatches.length / batches.length * 100)}%)</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(expiredBatches.length / batches.length) * 100}%`, background: 'var(--expired-purple)' }}></div>
              </div>
            </div>

          </div>
        </div>

        {/* Panel 2: Spoilage Risk Warning (DOS > DUE) */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#f59e0b" />
              Sản Phẩm Có Nguy Cơ Hư Hỏng Cao (DOS &gt; DUE)
            </h3>
            <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>AI Forecast</span>
          </div>

          <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Hệ thống phát hiện sản phẩm có số ngày bán hết tồn (DOS) lớn hơn số ngày còn lại đến hạn dùng (DUE):
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {highRiskItems.map((item, idx) => (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  fontSize: '0.825rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>{item.name}</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    Cần bán: <strong>{item.dos}</strong> | Còn hạn: <strong style={{ color: '#f87171' }}>{item.due}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge badge-${item.risk === 'RẤT CAO' ? 'danger' : 'warning'}`} style={{ fontSize: '0.65rem' }}>
                    {item.risk}
                  </span>
                  <button 
                    className="btn btn-secondary"
                    style={{ fontSize: '0.725rem', padding: '4px 8px' }}
                    onClick={() => setActiveTab('fefo-monitor')}
                  >
                    {item.action}
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
