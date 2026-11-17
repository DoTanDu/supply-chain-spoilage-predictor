// src/components/ReportsAnalyticsView.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ShoppingBag,
  ArrowLeftRight,
  CheckCircle2
} from 'lucide-react';
import { fetchReportsAnalytics } from '../api';
import { exportReportsAnalyticsToExcel } from '../utils/exportUtils';

const REASON_LABELS = {
  EXP_SPOILAGE: 'Quá hạn tự nhiên',
  EXPIRED: 'Quá hạn sử dụng',
  PKG_DAMAGE: 'Lỗi bao bì / Rách móp',
  DAMAGED: 'Hư hỏng vật lý',
  TEMP_ABUSE: 'Sự cố chuỗi lạnh',
  SPOILED: 'Hỏng bảo quản',
  INTERNAL_SHRINK: 'Hao hụt kiểm kê'
};

export default function ReportsAnalyticsView({
  isAdmin = false,
  selectedStoreId = 'ALL',
  onSelectStore,
  storesList = []
}) {
  const [periodDays, setPeriodDays] = useState(30);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadReports = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchReportsAnalytics(selectedStoreId, periodDays);
      if (res && res.success) {
        setReport(res);
      } else {
        setErrorMsg(res?.message || 'Không thể tải dữ liệu báo cáo.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối khi tải báo cáo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedStoreId, periodDays]);

  const fa = report?.forecastAccuracy || {};
  const sp = report?.spoilageMetrics || {};
  const sh = report?.stockHealthMetrics || {};
  const ord = report?.orderingEfficiency || {};
  const trf = report?.transferEconomics || {};
  const trfNet = Number(trf.netBenefit || 0);
  const dailySeries = report?.dailySeries || [];
  const storeComparison = report?.storeComparison || [];

  const scopeLabel = selectedStoreId === 'ALL'
    ? 'Toàn chuỗi'
    : (storesList.find(s => String(s.id) === String(selectedStoreId))?.storeName || `Chi nhánh #${selectedStoreId}`);

  const maxDailyRev = Math.max(1, ...dailySeries.map(d => Math.max(Number(d.salesRevenue || 0), Number(d.spoilageCost || 0))));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div className="ss-page-header">
        <div>
          <h1 className="ss-page-title">Báo cáo & Phân tích Hiệu quả</h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {isAdmin && storesList.length > 0 && (
            <select
              aria-label="Phạm vi báo cáo"
              value={selectedStoreId || 'ALL'}
              onChange={(e) => onSelectStore && onSelectStore(e.target.value)}
              style={{ width: 'auto', minWidth: '180px' }}
            >
              <option value="ALL">Toàn chuỗi ({storesList.length} CN)</option>
              {storesList.map(st => (
                <option key={st.id} value={String(st.id)}>{st.storeCode} — {st.storeName}</option>
              ))}
            </select>
          )}
          <select
            aria-label="Kỳ phân tích"
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            style={{ width: 'auto' }}
          >
            <option value={7}>7 ngày gần nhất</option>
            <option value={14}>14 ngày gần nhất</option>
            <option value={30}>30 ngày gần nhất</option>
            <option value={90}>90 ngày gần nhất</option>
          </select>
          <button type="button" className="ss-btn ss-btn-secondary" onClick={loadReports} disabled={loading}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Làm mới
          </button>
          <button type="button" className="ss-btn ss-btn-primary" disabled={!report} onClick={() => exportReportsAnalyticsToExcel(report, scopeLabel)}>
            <Download size={15} /> Xuất Báo cáo (.CSV)
          </button>
        </div>
      </div>

      {errorMsg && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--danger-red-bg)', border: '1px solid var(--danger-red-border)', color: 'var(--danger-red-light)', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* 5 Metric Pillars Summary */}
      <div className="ss-kpi-grid-aligned">
        {/* 1. Sai số dự báo */}
        <article
          className="ss-card ss-kpi-card"
          title={!fa.isDataSufficient ? (fa.warning || undefined) : `MAE: ${fa.mae} • RMSE: ${fa.rmse} • ${fa.sufficientHistoryPairs} mã đủ lịch sử`}
        >
          <header className="ss-kpi-header">
            <h2>1. Sai số dự báo AI</h2>
            <TrendingUp size={15} color="var(--primary)" aria-hidden="true" />
          </header>
          <p className="ss-kpi-value num-tabular" style={{ color: fa.isDataSufficient ? 'var(--primary)' : 'var(--warning-yellow-light)' }}>
            {fa.isDataSufficient ? `MAPE ${fa.mapePct}%` : 'Chưa đủ dữ liệu'}
          </p>
          <p className="ss-kpi-meta">
            {fa.isDataSufficient
              ? `Lệch ±${fa.mae} ĐV • ${fa.sufficientHistoryPairs} mã`
              : 'Cần tối thiểu 7 ngày bán'}
          </p>
        </article>

        {/* 2. Thiệt hại hàng hủy */}
        <article className="ss-card ss-kpi-card">
          <header className="ss-kpi-header">
            <h2>2. Thiệt hại hàng hủy</h2>
            <TrendingDown size={15} color="var(--danger-red)" aria-hidden="true" />
          </header>
          <p className="ss-kpi-value num-tabular" style={{ color: 'var(--danger-red-light)' }}>
            {Number(sp.totalCostLoss || 0).toLocaleString('vi-VN')} đ
          </p>
          <p className="ss-kpi-meta">
            <strong>{Number(sp.totalDisposedUnits || 0)} ĐV</strong> • Lãng phí <strong>{sp.spoilageRatePercent || 0}%</strong>
          </p>
        </article>

        {/* 3. Thiếu hàng & Cứu hàng */}
        <article className="ss-card ss-kpi-card" title={`SKU chạm định mức tối thiểu: ${sh.stockoutRiskRatePercent || 0}%`}>
          <header className="ss-kpi-header">
            <h2>3. Thiếu &amp; Cứu hàng</h2>
            <AlertTriangle size={15} color="var(--warning-yellow)" aria-hidden="true" />
          </header>
          <p className="ss-kpi-value num-tabular" style={{ color: 'var(--text-main)' }}>
            {sh.actualStockoutRatePercent ?? 0}% hết hàng
          </p>
          <p className="ss-kpi-meta" style={{ color: 'var(--safe-green-light)', fontWeight: 600 }}>
            Cứu {Number(sh.totalRescuedValue || 0).toLocaleString('vi-VN')}đ ({sh.rescueRatePercent || 0}%)
          </p>
        </article>

        {/* 4. Hiệu quả đặt hàng PO */}
        <article className="ss-card ss-kpi-card" title={`Thời gian xử lý TB: ${Number(ord.avgProcessingDays ?? 0).toFixed(1)} ngày`}>
          <header className="ss-kpi-header">
            <h2>4. Hiệu quả đơn PO</h2>
            <ShoppingBag size={15} color="var(--accent-blue)" aria-hidden="true" />
          </header>
          <p className="ss-kpi-value num-tabular" style={{ color: 'var(--accent-blue-light)' }}>
            {ord.totalOrders || 0} đơn PO
          </p>
          <p className="ss-kpi-meta">
            Xong <strong>{ord.poCompletionRatePercent || 0}%</strong> • <strong>{Number(ord.totalBudget || 0).toLocaleString('vi-VN')}đ</strong>
          </p>
        </article>

        {/* 5. Lợi ích điều chuyển */}
        <article className="ss-card ss-kpi-card" title={`Giá trị cứu: ${Number(trf.savedValue || 0).toLocaleString('vi-VN')}đ − Phí ship: ${Number(trf.totalShippingCost || 0).toLocaleString('vi-VN')}đ`}>
          <header className="ss-kpi-header">
            <h2>5. Lợi ích điều chuyển</h2>
            <ArrowLeftRight size={15} color="var(--safe-green)" aria-hidden="true" />
          </header>
          <p className="ss-kpi-value num-tabular" style={{ color: trfNet < 0 ? 'var(--danger-red-light)' : 'var(--safe-green-light)' }}>
            {trfNet > 0 ? '+' : ''}{trfNet.toLocaleString('vi-VN')} đ
          </p>
          <p className="ss-kpi-meta">
            <strong>{trf.receivedCount || 0} phiếu</strong> • Ship {Number(trf.totalShippingCost || 0).toLocaleString('vi-VN')}đ
          </p>
        </article>
      </div>

      {/* Charts & Breakdown Row */}
      <div className="ss-two-col">
        {/* Daily Revenue vs Spoilage Bars */}
        <section className="ss-card ss-card-pad" style={{ gridColumn: 'span 7', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 2px' }}>
                Diễn biến Doanh thu vs Thiệt hại Hủy theo Ngày ({periodDays} ngày)
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Phát sinh giao dịch trên <strong>{dailySeries.length}</strong> ngày trong {periodDays} ngày gần nhất
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--primary)' }}>
                <span style={{ width: '10px', height: '4px', background: 'var(--primary)', borderRadius: '2px' }} /> Doanh thu
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--danger-red-light)' }}>
                <span style={{ width: '10px', height: '4px', background: 'var(--danger-red)', borderRadius: '2px' }} /> Thiệt hại hủy
              </span>
            </div>
          </div>

          {dailySeries.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Chưa có dữ liệu giao dịch hoặc tiêu hủy trong khoảng {periodDays} ngày gần nhất.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {dailySeries.map((d, idx) => {
                const revW = Number(d.salesRevenue || 0) > 0 ? Math.max(3, Math.round((Number(d.salesRevenue || 0) / maxDailyRev) * 100)) : 0;
                const spoilW = Number(d.spoilageCost || 0) > 0 ? Math.max(3, Math.round((Number(d.spoilageCost || 0) / maxDailyRev) * 100)) : 0;
                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '88px 1fr 126px', gap: '10px', alignItems: 'center', fontSize: '0.79rem', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="num-tabular" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{d.dayStr}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {revW > 0 && <div style={{ height: '7px', width: `${revW}%`, background: 'var(--primary)', borderRadius: '4px' }} />}
                      {spoilW > 0 && <div style={{ height: '6px', width: `${spoilW}%`, background: 'var(--danger-red)', borderRadius: '4px' }} />}
                    </div>
                    <div className="num-tabular" style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{Number(d.salesRevenue || 0).toLocaleString('vi-VN')}đ</span>
                      {Number(d.spoilageCost || 0) > 0 && (
                        <div style={{ color: 'var(--danger-red-light)', fontSize: '0.72rem' }}>-{Number(d.spoilageCost).toLocaleString('vi-VN')}đ</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(() => {
            const totalRev = Number(sp.totalRevenue || 0);
            const totalLoss = Number(sp.totalCostLoss || 0);
            const netDiff = totalRev - totalLoss;
            return (
              <div className="ss-card-subtle" style={{ marginTop: 'auto', padding: '12px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>Tổng thu ({sp.totalUnitsSold || 0} ĐV)</div>
                  <div className="num-tabular" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                    {totalRev.toLocaleString('vi-VN')} đ
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>Thiệt hại hủy ({sp.totalDisposedUnits || 0} ĐV)</div>
                  <div className="num-tabular" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--danger-red-light)', marginTop: '2px' }}>
                    -{totalLoss.toLocaleString('vi-VN')} đ
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>Chênh lệch Thu – Hủy</div>
                  <div className="num-tabular" style={{ fontSize: '0.92rem', fontWeight: 800, color: netDiff >= 0 ? 'var(--safe-green-light)' : 'var(--danger-red-light)', marginTop: '2px' }}>
                    {netDiff >= 0 ? '+' : ''}{netDiff.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Breakdown by Reason & Top Spoiled Products */}
        <section className="ss-card ss-card-pad" style={{ gridColumn: 'span 5', minWidth: 0 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 12px' }}>
            Phân tích Nguyên nhân & Mặt hàng Hao hụt Cao nhất
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Theo nguyên nhân tiêu hủy
            </div>
            {(sp.byReason || []).length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Chưa phát sinh tiêu hủy trong kỳ.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sp.byReason.map((r, i) => (
                  <div key={i} className="ss-card-subtle" style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>{REASON_LABELS[r.reason] || r.reason} ({r.recordCount} phiếu)</span>
                    <strong className="num-tabular" style={{ color: 'var(--danger-red-light)' }}>
                      {Number(r.totalLoss || 0).toLocaleString('vi-VN')} đ ({r.totalUnits} ĐV)
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Top sản phẩm bị hủy nhiều nhất
            </div>
            {(sp.topSpoiledProducts || []).length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Chưa có dữ liệu.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sp.topSpoiledProducts.slice(0, 5).map(p => (
                  <div key={p.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '5px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontWeight: 600 }}>{p.productName}</span>
                    <span className="num-tabular" style={{ color: 'var(--danger-red-light)', fontWeight: 700 }}>
                      {p.disposedUnits} ĐV ({Number(p.costLoss || 0).toLocaleString('vi-VN')} đ)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Store Comparison Table */}
      <section className="ss-card ss-card-pad">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 12px' }}>
          Bảng Tổng hợp Kết quả theo Chi nhánh ({periodDays} ngày)
        </h2>

        <div className="table-wrapper" tabIndex={0} role="region" aria-label="Báo cáo so sánh theo chi nhánh">
          <table className="ss-table ss-table-responsive">
            <thead>
              <tr>
                <th scope="col">Chi nhánh</th>
                <th scope="col">Doanh thu bán lẻ</th>
                <th scope="col">Thiệt hại hủy (SL)</th>
                <th scope="col">Tỷ lệ lãng phí</th>
                <th scope="col">Vốn tồn kho</th>
                <th scope="col">Cứu nhờ Markdown</th>
                <th scope="col">Ròng điều chuyển</th>
                <th scope="col">Số đơn PO</th>
              </tr>
            </thead>
            <tbody>
              {storeComparison.map(st => (
                <tr key={st.storeId}>
                  <td data-label="Chi nhánh">
                    <div style={{ fontWeight: 700 }}>{st.storeName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{st.storeCode}</div>
                  </td>
                  <td data-label="Doanh thu" className="num-tabular" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {Number(st.salesRevenue || 0).toLocaleString('vi-VN')} đ
                  </td>
                  <td data-label="Thiệt hại" className="num-tabular" style={{ color: 'var(--danger-red-light)', fontWeight: 600 }}>
                    {Number(st.spoilageLoss || 0).toLocaleString('vi-VN')} đ ({st.disposedUnits} ĐV)
                  </td>
                  <td data-label="Tỷ lệ hủy" className="num-tabular">
                    <span className={`ss-badge ${st.spoilageRatePercent > 5 ? 'ss-badge-danger' : 'ss-badge-safe'}`}>
                      {st.spoilageRatePercent}%
                    </span>
                  </td>
                  <td data-label="Vốn tồn" className="num-tabular">{Number(st.inventoryCost || 0).toLocaleString('vi-VN')} đ</td>
                  <td data-label="Cứu Markdown" className="num-tabular" style={{ color: 'var(--safe-green-light)', fontWeight: 600 }}>
                    {Number(st.markdownRescued || 0).toLocaleString('vi-VN')} đ
                  </td>
                  <td data-label="Ròng chuyển" className="num-tabular" style={{ color: 'var(--safe-green-light)', fontWeight: 600 }}>
                    +{Number(st.transferNetSaved || 0).toLocaleString('vi-VN')} đ
                  </td>
                  <td data-label="Số PO" className="num-tabular">{st.poCount} đơn</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
