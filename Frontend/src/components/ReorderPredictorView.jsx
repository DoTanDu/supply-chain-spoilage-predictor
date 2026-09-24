import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  Calculator, 
  Info,
  RotateCw,
  HelpCircle,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';

export default function ReorderPredictorView({ 
  products, 
  batches, 
  onSendPo,
  onQuickDiscount 
}) {
  const [leadTime] = useState(2); // Lead time from DC: 2 days
  const [createdPoMsg, setCreatedPoMsg] = useState('');
  const [loadingProductId, setLoadingProductId] = useState(null);
  const [showExplanation, setShowExplanation] = useState(true);

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

    // If nearest batch is discounted, sales velocity is boosted by 50% (K_discount = 1.5)
    const isDiscounted = nearestBatch?.isDiscounted || (nearestBatch?.discountPercent > 0);
    const effectiveDemand = isDiscounted ? (prod.dailyDemand * 1.5) : (prod.dailyDemand || 1);

    // Days of Supply: DOS = Stock / dailyDemand
    const dos = Number((availableStock / effectiveDemand).toFixed(1));

    // ROP = (dailyDemand * LeadTime) + SafetyStock
    const calculatedRop = Math.round((prod.dailyDemand * leadTime) + prod.safetyStock);

    const isReorderNeeded = availableStock <= calculatedRop;
    // Spoilage risk exists if standard DOS > dueDays and not yet discounted, or even with discount DOS > dueDays
    const isSpoilageRisk = (dos > dueDays || (availableStock / (prod.dailyDemand || 1) > dueDays && !isDiscounted)) && availableStock > 0 && dueDays <= 7;

    return {
      availableStock,
      calculatedRop,
      dos,
      dueDays,
      nearestBatch,
      isDiscounted,
      isReorderNeeded,
      isSpoilageRisk
    };
  };

  const handleOrderFromDc = async (prod, suggestedQty) => {
    setLoadingProductId(prod.id);
    try {
      const res = await onSendPo(prod, suggestedQty);
      if (res && res.success) {
        setCreatedPoMsg(`✓ Đã tiếp nhận Lô hàng mới từ Kho tổng DC: Cấp +${suggestedQty} ${prod.unit} "${prod.name}" (Lô: ${res.batchCode}, HSD chuẩn: ${prod.shelfLifeDays || 30} ngày) vào SQL Server! Tồn kho đã tăng từ 0 lên ${suggestedQty}.`);
      } else {
        setCreatedPoMsg(`✓ Đã tạo lệnh PO tiếp tế gửi về Kho tổng DC cho ${suggestedQty} ${prod.unit} "${prod.name}"!`);
      }
    } catch (err) {
      setCreatedPoMsg(`Lỗi tiếp nhận hàng DC: ${err.message}`);
    } finally {
      setLoadingProductId(null);
      setTimeout(() => setCreatedPoMsg(''), 7000);
    }
  };

  const handleApplyDiscount = async (prod, batch) => {
    if (!batch || !onQuickDiscount) return;
    setLoadingProductId(prod.id);
    try {
      await onQuickDiscount(batch.id);
      setCreatedPoMsg(`⚡ Đã kích hoạt GIẢM GIÁ 30% xả hàng cho Lô ${batch.batchCode} (${prod.name}) vào SQL Server! Tốc độ bán được kích cầu tăng 50% để giải phóng hàng trước khi quá hạn.`);
    } catch (err) {
      setCreatedPoMsg(`Lỗi khi kích hoạt giảm giá: ${err.message}`);
    } finally {
      setLoadingProductId(null);
      setTimeout(() => setCreatedPoMsg(''), 7000);
    }
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
              Thời gian giao từ Kho tổng (Lead Time L): <strong style={{ color: 'var(--safe-green)' }}>{leadTime} ngày</strong>
            </div>
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <HelpCircle size={15} color="#38bdf8" />
              <span>{showExplanation ? 'Ẩn giải thích công thức' : 'Xem công thức ROP'}</span>
              {showExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Educational Explanatory Box */}
        {showExplanation && (
          <div style={{
            marginTop: '18px',
            background: 'rgba(56, 189, 248, 0.06)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            fontSize: '0.825rem'
          }}>
            <div>
              <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calculator size={16} /> 1. Tốc độ bán hàng ngày (d - Daily Demand)
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Số lượng sản phẩm trung bình cửa hàng bán ra trong 1 ngày, tính dựa trên lịch sử giao dịch quầy POS và được nhân hệ số thời tiết (K = 1.4 khi nắng nóng kích cầu đồ giải khát).
              </div>
            </div>

            <div>
              <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PackageCheck size={16} /> 2. Tồn kho an toàn (SS - Safety Stock)
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Lượng hàng đệm dự phòng tối thiểu dưới đáy kệ để tránh bị "đứt hàng" khi khách mua đột biến vào ngày nghỉ/lễ hoặc khi xe giao hàng từ Kho tổng (DC) bị trễ.
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--safe-green)', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} /> 3. Điểm đặt hàng (ROP - Reorder Point)
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
                <strong>ROP = (d × L) + SS</strong>. Khi tồn kho ≤ ROP, hệ thống bật nút <strong>Đặt DC</strong>. Hạn sử dụng của lô nhập mới được lấy chính xác theo hạn chuẩn từng sản phẩm (VD: Bánh mì 7 ngày, Sữa 180 ngày).
              </div>
            </div>
          </div>
        )}

        {createdPoMsg && (
          <div style={{
            marginTop: '16px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#a7f3d0',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={18} color="var(--safe-green)" />
            <span>{createdPoMsg}</span>
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
                const isItemLoading = loadingProductId === prod.id;

                return (
                  <tr key={prod.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{prod.image}</span>
                        <span>{prod.name}</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'flex', gap: '8px' }}>
                        <span>ĐVT: {prod.unit}</span>
                        <span>• SKU: {prod.sku}</span>
                        <span>• HSD chuẩn: <strong style={{ color: '#38bdf8' }}>{prod.shelfLifeDays || 30} ngày</strong></span>
                      </div>
                    </td>
                    <td>
                      <strong>{prod.dailyDemand}</strong> {prod.unit}/ngày
                      {analysis.isDiscounted && (
                        <div style={{ fontSize: '0.675rem', color: '#f59e0b', fontWeight: 600 }}>
                          (Đã kích cầu: {(prod.dailyDemand * 1.5).toFixed(1)}/ngày)
                        </div>
                      )}
                    </td>
                    <td>{prod.safetyStock} {prod.unit}</td>
                    <td>
                      <span className="badge badge-blue">
                        ROP = {analysis.calculatedRop}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '1rem', color: analysis.isReorderNeeded ? '#f59e0b' : 'var(--safe-green)' }}>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700 }}>
                            <AlertTriangle size={14} /> Nguy cơ Spoilage (DOS &gt; DUE)
                          </div>
                          {analysis.isDiscounted && (
                            <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                              ⚡ Đã Xả Hàng -30%
                            </span>
                          )}
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
                          disabled={isItemLoading}
                        >
                          {isItemLoading ? (
                            <>
                              <RotateCw size={13} className="animate-spin" /> Đang cấp hàng...
                            </>
                          ) : (
                            <>
                              <Send size={13} /> Đặt DC (+{analysis.calculatedRop * 2})
                            </>
                          )}
                        </button>
                      ) : analysis.isSpoilageRisk ? (
                        analysis.isDiscounted ? (
                          <span style={{ fontSize: '0.725rem', color: '#f59e0b', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Zap size={13} /> Đã Giảm 30%
                          </span>
                        ) : (
                          <button
                            className="btn btn-warning"
                            style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                            onClick={() => handleApplyDiscount(prod, analysis.nearestBatch)}
                            disabled={isItemLoading}
                          >
                            {isItemLoading ? (
                              <>
                                <RotateCw size={13} className="animate-spin" /> Đang giảm...
                              </>
                            ) : (
                              <>
                                <Zap size={13} /> Giảm giá kích cầu
                              </>
                            )}
                          </button>
                        )
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--safe-green)', fontWeight: 600 }}>
                          ✓ Ổn định
                        </span>
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
