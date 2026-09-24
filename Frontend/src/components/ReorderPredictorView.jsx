import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, Send, CheckCircle2, Calculator, Info } from 'lucide-react';

export default function ReorderPredictorView({ products, batches, onSendPo }) {
  const [leadTime] = useState(2); // Lead time from DC: 2 days
  const [createdPoMsg, setCreatedPoMsg] = useState('');

  const calculateStockAnalysis = (prod) => {
    const availableStock = batches
      .filter(b => b.productId === prod.id && b.status !== 'EXPIRED')
      .reduce((sum, b) => sum + b.quantity, 0);

    // Calculate nearest expiry batch
    const activeBatches = batches
      .filter(b => b.productId === prod.id && b.status !== 'EXPIRED' && b.quantity > 0)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    const nearestBatch = activeBatches[0];
    let dueDays = 999;
    if (nearestBatch) {
      const exp = new Date(nearestBatch.expiryDate);
      const now = new Date('2026-09-24');
      dueDays = Math.max(0, Math.ceil((exp - now) / (1000 * 60 * 60 * 24)));
    }

    // Days of Supply
    const dos = Number((availableStock / (prod.dailyDemand || 1)).toFixed(1));

    // ROP = (d * L) + SS
    const calculatedRop = Math.round((prod.dailyDemand * leadTime) + prod.safetyStock);

    const isReorderNeeded = availableStock <= calculatedRop;
    const isSpoilageRisk = dos > dueDays;

    return {
      availableStock,
      calculatedRop,
      dos,
      dueDays,
      nearestBatch,
      isReorderNeeded,
      isSpoilageRisk
    };
  };

  const handleOrderFromDc = (prod, suggestedQty) => {
    onSendPo(prod, suggestedQty);
    setCreatedPoMsg(`Đã tạo Đơn Đặt Hàng DC-PO-${Date.now().toString().slice(-5)} cho ${suggestedQty} ${prod.unit} ${prod.name}!`);
    setTimeout(() => setCreatedPoMsg(''), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={22} color="var(--safe-green)" />
              Dự Báo Tái Đặt Hàng & Cảnh Báo Nguy Cơ Lãng Phí (ROP / AI Forecast)
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Tích hợp công thức chuẩn: ROP = (d × L) + SS và điều kiện nghịch đảo DOS &gt; DUE để ngăn lãng phí trước khi quá hạn.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
            Thời gian giao từ Kho tổng (Lead Time L): <strong style={{ color: 'var(--safe-green)' }}>{leadTime} ngày</strong>
          </div>
        </div>

        {createdPoMsg && (
          <div style={{ marginTop: '16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '10px 14px', borderRadius: '10px', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {createdPoMsg}
          </div>
        )}
      </div>

      {/* Analysis Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Sản Phẩm & ĐVT</th>
                <th>Tốc Độ Bán (d)</th>
                <th>Tồn An Toàn (SS)</th>
                <th>Điểm Đặt Hàng (ROP)</th>
                <th>Tồn Kho Hiện Tại</th>
                <th>Số Ngày Bán (DOS)</th>
                <th>Hạn Gần Nhất (DUE)</th>
                <th>Đánh Giá Rủi Ro</th>
                <th style={{ textAlign: 'right' }}>Hành Động Khuyến Nghị</th>
              </tr>
            </thead>
            <tbody>
              {products.map(prod => {
                const analysis = calculateStockAnalysis(prod);

                return (
                  <tr key={prod.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{prod.image}</span>
                        <span>{prod.name}</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                        Đơn vị tính: {prod.unit} | SKU: {prod.sku}
                      </div>
                    </td>
                    <td><strong>{prod.dailyDemand}</strong> {prod.unit}/ngày</td>
                    <td>{prod.safetyStock} {prod.unit}</td>
                    <td>
                      <span className="badge badge-blue">
                        ROP = {analysis.calculatedRop}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '1rem', color: analysis.isReorderNeeded ? '#f59e0b' : '#ffffff' }}>
                        {analysis.availableStock} {prod.unit}
                      </strong>
                    </td>
                    <td>
                      <strong>{analysis.dos} ngày</strong>
                    </td>
                    <td>
                      {analysis.dueDays < 900 ? (
                        <span style={{ fontWeight: 700, color: analysis.dueDays <= 3 ? '#ef4444' : '#ffffff' }}>
                          {analysis.dueDays} ngày ({analysis.nearestBatch?.batchCode})
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Chưa có lô</span>
                      )}
                    </td>
                    <td>
                      {analysis.isSpoilageRisk && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700 }}>
                          <AlertTriangle size={14} /> Nguy cơ Spoilage (DOS &gt; DUE)
                        </div>
                      )}

                      {analysis.isReorderNeeded && !analysis.isSpoilageRisk && (
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                          Cần Tái Đặt Hàng
                        </span>
                      )}

                      {!analysis.isReorderNeeded && !analysis.isSpoilageRisk && (
                        <span className="badge badge-safe" style={{ fontSize: '0.65rem' }}>
                          Cân Bằng Tối Ưu
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {analysis.isReorderNeeded ? (
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                          onClick={() => handleOrderFromDc(prod, analysis.calculatedRop * 2)}
                        >
                          <Send size={13} /> Đặt DC (+{analysis.calculatedRop * 2})
                        </button>
                      ) : analysis.isSpoilageRisk ? (
                        <button
                          className="btn btn-warning"
                          style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                          onClick={() => alert(`Khuyến nghị xả hàng: Đã gửi thông báo đẩy bán khuyến mãi 20% cho sản phẩm ${prod.name}!`)}
                        >
                          Giảm giá kích cầu
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Ổn định</span>
                      )}
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
