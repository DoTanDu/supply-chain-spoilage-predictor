// src/components/AiForecastView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Sun,
  CloudRain,
  Cloud,
  Calendar,
  RefreshCw,
  ArrowRight,
  Play,
  Tag,
  Save,
  MapPin,
  Droplets,
  Wind
} from 'lucide-react';
import { fetchRopForecast, runAiModelInference, apiSaveForecastSnapshot } from '../api';
import ModalDialog from './ui/ModalDialog';
import { normalizeRole } from '../utils/pagePermissions';

function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

export default function AiForecastView({
  products = [],
  batches = [],
  currentUser = null,
  currentRole = 'STORE_MANAGER',
  isAdmin = false,
  selectedStoreId = 'ALL',
  onSelectStore,
  storesList = [],
  weather = { condition: 'AUTO', isHoliday: false },
  setWeather,
  onSyncWeather,
  onUseDeviceLocation,
  isSyncingWeather = false,
  gpsCoords = null,
  isSingleStore = false,
  setActiveTab
}) {
  const roleCode = normalizeRole(currentRole || currentUser?.roleCode);
  const canRunInference = isAdmin || roleCode === 'ADMIN' || roleCode === 'STORE_MANAGER';

  const [forecasts, setForecasts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [liveEnvironment, setLiveEnvironment] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [qualityFilter, setQualityFilter] = useState('ALL'); // ALL, SUFFICIENT, INSUFFICIENT
  const [selectedProdId, setSelectedProdId] = useState(null);
  const [isPromo, setIsPromo] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [snapshotMsg, setSnapshotMsg] = useState('');

  const [inferenceModalOpen, setInferenceModalOpen] = useState(false);
  const [inferenceResult, setInferenceResult] = useState(null);
  const [runningInference, setRunningInference] = useState(false);
  const [inferenceError, setInferenceError] = useState('');

  const envSummary = liveEnvironment?.success ? liveEnvironment : weather;
  const wCond = envSummary?.current?.condition || weather?.condition || 'AUTO';
  const isHoliday = Boolean(envSummary?.calendar?.isHoliday ?? weather?.isHoliday);

  const loadForecasts = async () => {
    setLoading(true);
    try {
      const ropRes = await fetchRopForecast('AUTO', 'auto', selectedStoreId, isPromo, gpsCoords);
      if (ropRes && ropRes.success) {
        const list = ropRes.allForecasts || ropRes.data || [];
        setForecasts(list);
        setSummary(ropRes.summary || {});
        if (ropRes.environment) {
          setLiveEnvironment(ropRes.environment);
          if (ropRes.environment.success && ropRes.environment.current && setWeather) {
            const e = ropRes.environment;
            setWeather(prev => ({
              ...prev,
              online: true,
              temp: e.current.temp,
              apparentTemp: e.current.apparentTemp,
              humidity: e.current.humidity,
              precipitation: e.current.precipitation,
              windSpeed: e.current.windSpeed,
              label: e.current.label,
              condition: e.current.condition,
              location: e.locationName,
              isHoliday: Boolean(e.calendar?.isHoliday),
              calendarLabel: e.calendar?.label || 'Ngày thường',
              dailyForecast: e.dailyForecast || []
            }));
          }
        }
        if (list.length > 0 && !selectedProdId) {
          setSelectedProdId(list[0].productId);
        }
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu dự báo AI:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecasts();
  }, [selectedStoreId, isPromo, gpsCoords?.lat, gpsCoords?.lon]);

  const handleSaveSnapshot = async () => {
    setSavingSnapshot(true);
    setSnapshotMsg('');
    try {
      const targetSid = selectedStoreId !== 'ALL' ? Number(selectedStoreId) : Number(currentUser?.storeId || 1);
      const res = await apiSaveForecastSnapshot({
        storeId: targetSid,
        weather: wCond,
        isHoliday,
        isPromo
      });
      setSnapshotMsg(res?.message || 'Đã lưu kết quả dự báo để kiểm chứng.');
    } catch (err) {
      setSnapshotMsg(err.message || 'Lỗi khi lưu snapshot.');
    } finally {
      setSavingSnapshot(false);
    }
  };

  const handleRunLiveInference = async () => {
    setInferenceModalOpen(true);
    setRunningInference(true);
    setInferenceError('');
    try {
      const res = await runAiModelInference(12);
      if (res && res.success) {
        setInferenceResult(res.data);
      } else {
        setInferenceError(res?.message || 'Không thể chạy kiểm định model LightGBM (.pkl).');
      }
    } catch (err) {
      setInferenceError(err.message || 'Lỗi kết nối tiến trình AI Python.');
    } finally {
      setRunningInference(false);
    }
  };

  const filteredForecasts = useMemo(() => {
    const q = stripVietnamese(search);
    return forecasts.filter(item => {
      if (qualityFilter === 'SUFFICIENT' && !item.isDataSufficient) return false;
      if (qualityFilter === 'INSUFFICIENT' && item.isDataSufficient) return false;
      if (q) {
        const hay = `${stripVietnamese(item.productName)} ${stripVietnamese(item.productSku)} ${stripVietnamese(item.categoryName)}`;
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [forecasts, search, qualityFilter]);

  const selectedItem = useMemo(() => {
    return forecasts.find(f => Number(f.productId) === Number(selectedProdId)) || filteredForecasts[0] || null;
  }, [forecasts, filteredForecasts, selectedProdId]);

  // Chuỗi 7 ngày tới hoàn toàn từ Backend (Open-Meteo 7 ngày thực + Lịch lễ VN thực + Tốc độ bán SQL Server)
  const selectedDailyBars = useMemo(() => {
    if (!selectedItem || !Array.isArray(selectedItem.dailyBreakdown)) return [];
    return selectedItem.dailyBreakdown;
  }, [selectedItem]);

  const maxBarVal = Math.max(1, ...selectedDailyBars.map(b => Number(b.upper || b.predicted || 0)));

  const hasReliableMetrics = Boolean(summary?.hasReliableModelMetrics && summary?.averageMaeMetric !== null);
  const insufficientCount = Number(summary?.insufficientDataCount || 0);
  const total7dUnits = forecasts.reduce((s, f) => s + Number(f.predictedSales7d || 0), 0);
  const totalLower7d = forecasts.reduce((s, f) => s + Number(f.lowerBound || 0), 0);
  const totalUpper7d = forecasts.reduce((s, f) => s + Number(f.upperBound || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div className="ss-page-header">
        <div>
          <h1 className="ss-page-title">Dự báo Sức mua 7 ngày</h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {isAdmin && storesList.length > 0 && (
            <select
              aria-label="Chọn phạm vi cửa hàng dự báo"
              value={selectedStoreId || 'ALL'}
              onChange={(e) => onSelectStore && onSelectStore(e.target.value)}
              style={{ width: 'auto', minWidth: '150px', maxWidth: '210px' }}
            >
              <option value="ALL">Toàn chuỗi ({storesList.length} CN)</option>
              {storesList.map(st => (
                <option key={st.id} value={String(st.id)}>{st.storeCode} — {st.storeName}</option>
              ))}
            </select>
          )}

          {canRunInference && (
            <>
              <button type="button" className="ss-btn ss-btn-secondary" disabled={savingSnapshot} onClick={handleSaveSnapshot}>
                <Save size={14} /> {savingSnapshot ? 'Đang lưu...' : 'Lưu dự báo'}
              </button>
              <button type="button" className="ss-btn ss-btn-secondary" onClick={handleRunLiveInference}>
                <Play size={14} /> Kiểm thử Model
              </button>
            </>
          )}
          <button type="button" className="ss-btn ss-btn-primary" onClick={() => setActiveTab && setActiveTab('smart-ordering')}>
            Đề xuất Nhập hàng <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {snapshotMsg && (
        <div role="status" className="ss-card ss-card-pad" style={{ background: 'var(--safe-green-bg)', borderColor: 'var(--safe-green-border)', color: 'var(--safe-green-light)', fontWeight: 600, fontSize: '0.84rem' }}>
          {snapshotMsg}
        </div>
      )}

      {/* Live Weather & Calendar Context Bar (Open-Meteo + Nager.Date VN) */}
      <div className="ss-card ss-card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '0.82rem' }}>
          <span className="ss-badge ss-badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <MapPin size={13} /> {weather?.location || liveEnvironment?.locationName || 'Chưa định vị'}
          </span>

          {weather?.temp !== null && weather?.temp !== undefined ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-main)' }}>
              {wCond === 'RAINY' ? <CloudRain size={15} color="#2563eb" /> : wCond === 'SUNNY' ? <Sun size={15} color="#d97706" /> : <Cloud size={15} color="#64748b" />}
              <strong className="num-tabular">{weather.temp}°C</strong>
              <span>{weather.label}</span>
              <span style={{ color: 'var(--text-muted)' }}>
                • <Droplets size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> {weather.humidity ?? '--'}%
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                • Mưa {weather.precipitation ?? 0}mm
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                • <Wind size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> {weather.windSpeed ?? 0}km/h
              </span>
            </span>
          ) : (
            <span style={{ color: 'var(--danger-red-light)', fontWeight: 600 }}>
              Chưa lấy được dữ liệu thời tiết Open-Meteo
            </span>
          )}

          <span className={`ss-badge ${isHoliday ? 'ss-badge-warning' : 'ss-badge-neutral'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} /> {weather?.calendarLabel || liveEnvironment?.calendar?.label || 'Ngày thường'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {onUseDeviceLocation && (
            <button type="button" className="ss-btn ss-btn-secondary ss-btn-sm" onClick={onUseDeviceLocation} disabled={isSyncingWeather}>
              <MapPin size={13} /> Vị trí GPS
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsPromo(p => !p)}
            className={`ss-btn ss-btn-sm ${isPromo ? 'ss-btn-primary' : 'ss-btn-secondary'}`}
          >
            <Tag size={14} /> {isPromo ? 'Khuyến mãi (+15%)' : 'Giá thường'}
          </button>
          <button
            type="button"
            className="ss-btn ss-btn-secondary ss-btn-sm"
            onClick={async () => {
              if (onSyncWeather) await onSyncWeather();
              await loadForecasts();
            }}
            disabled={loading || isSyncingWeather}
          >
            <RefreshCw size={14} style={{ animation: (loading || isSyncingWeather) ? 'spin 1s linear infinite' : 'none' }} /> Cập nhật
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="ss-kpi-grid">
        <div className="ss-card ss-card-pad">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tổng cầu dự báo 7 ngày tới</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
            {total7dUnits.toLocaleString('vi-VN')} ĐV
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            Khoảng tin cậy: <strong className="num-tabular">{totalLower7d.toLocaleString('vi-VN')} – {totalUpper7d.toLocaleString('vi-VN')} ĐV</strong>
          </div>
        </div>

        <div className="ss-card ss-card-pad">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Độ sai số mô hình (MAE)</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: hasReliableMetrics ? 'var(--safe-green-light)' : 'var(--warning-yellow-light)', marginTop: '4px' }}>
            {hasReliableMetrics ? `${summary.averageMaeMetric} ĐV/ngày` : 'Chưa đủ dữ liệu'}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            Mô hình: <strong>{summary?.modelName || 'ROP-Live-Sales-Weather'}</strong>
          </div>
        </div>

        <div className="ss-card ss-card-pad">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Độ phủ lịch sử bán ≥ 7 ngày</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '4px' }}>
            {Number(summary?.sufficientDataCount || 0)} / {forecasts.length} SKU
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            Thiếu lịch sử: <strong>{insufficientCount} SKU</strong>
          </div>
        </div>

        <div className="ss-card ss-card-pad">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Sản phẩm cần đặt hàng / Nguy cơ hủy</div>
          <div className="num-tabular" style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '4px' }}>
            <span style={{ color: 'var(--accent-blue-light)' }}>{Number(summary?.reorderCount || 0)} nhập</span>
            <span style={{ color: 'var(--text-dim)', margin: '0 6px' }}>/</span>
            <span style={{ color: 'var(--danger-red-light)' }}>{Number(summary?.spoilageRiskCount || 0)} ứ đọng</span>
          </div>
        </div>
      </div>

      {/* Selected Product 7-Day Forecast Breakdown Chart */}
      {selectedItem && (
        <section className="ss-card ss-card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: '1 1 340px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  Chi tiết Dự báo 7 ngày: {selectedItem.productName}
                </h2>
                <span className="ss-badge ss-badge-indigo" style={{ fontFamily: 'monospace' }}>{selectedItem.productSku}</span>
                <span className={`ss-badge ${selectedItem.isDataSufficient ? 'ss-badge-safe' : 'ss-badge-warning'}`}>
                  {selectedItem.isDataSufficient ? `Đủ dữ liệu (${selectedItem.historyDaysCount}/14 ngày)` : `Thiếu lịch sử (${selectedItem.historyDaysCount}/7 ngày tối thiểu)`}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
                {selectedItem.aiExplanation}
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', flexShrink: 0 }}>
              <div>Dự báo 7 ngày: <strong className="num-tabular" style={{ color: 'var(--primary)', fontSize: '1rem' }}>{selectedItem.predictedSales7d} {selectedItem.unit}</strong></div>
              <div style={{ color: 'var(--text-muted)' }}>Khoảng dao động: <strong>{selectedItem.lowerBound} – {selectedItem.upperBound} {selectedItem.unit}</strong></div>
            </div>
          </div>

          {/* 7-Day Bars with real Open-Meteo daily forecast & VN holiday status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '10px', alignItems: 'start', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            {selectedDailyBars.map((b, idx) => {
              const pred = Number(b.predicted || 0);
              const heightPct = pred > 0 ? Math.max(18, Math.round((pred / maxBarVal) * 110)) : 4;
              const barColor = pred === 0 ? 'var(--border-color)' : (idx === 0 ? 'var(--primary)' : '#818cf8');
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div className="num-tabular" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {pred > 0 ? `${b.lower}–${b.upper}` : '0'}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '56px',
                      height: '120px',
                      background: 'var(--bg-subtle)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: '4px'
                    }}
                  >
                    <div
                      style={{
                        height: `${heightPct}px`,
                        background: barColor,
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: pred > 0 ? '4px' : 0,
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {pred > 0 ? pred : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', lineHeight: 1.25 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {b.dow} {b.dayLabel}
                    </div>
                    {b.tempMax !== null && b.tempMax !== undefined && (
                      <div className="num-tabular" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {b.tempMin}–{b.tempMax}°C
                      </div>
                    )}
                    <div style={{ fontSize: '0.66rem', color: b.condition === 'RAINY' ? 'var(--accent-blue-light)' : 'var(--text-dim)' }}>
                      {b.label}{b.precipProb > 0 ? ` (${b.precipProb}%)` : ''}
                    </div>
                    {b.isHoliday && (
                      <span className="ss-badge ss-badge-warning" style={{ fontSize: '0.6rem', padding: '1px 5px', marginTop: '2px' }}>
                        {b.holidayName || 'Cuối tuần'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Forecast Table */}
      <section className="ss-card ss-card-pad">
        <search>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <input
              type="search"
              aria-label="Tìm sản phẩm trong bảng dự báo"
              placeholder="Tìm tên sản phẩm, mã SKU, ngành hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: '340px' }}
            />
            <select
              aria-label="Lọc theo chất lượng dữ liệu"
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="ALL">Tất cả sản phẩm ({forecasts.length})</option>
              <option value="SUFFICIENT">Đủ dữ liệu lịch sử (≥ 7 ngày)</option>
              <option value="INSUFFICIENT">Thiếu dữ liệu (&lt; 7 ngày)</option>
            </select>
          </div>
        </search>

        <div className="table-wrapper" tabIndex={0} role="region" aria-label="Bảng dự báo sức mua 7 ngày">
          <table className="ss-table ss-table-responsive">
            <thead>
              <tr>
                <th scope="col">Sản phẩm</th>
                <th scope="col">Thực tế: Tồn / Tốc độ 14d</th>
                <th scope="col">Hệ số (W × H) → Ngày mai</th>
                <th scope="col">AI Dự báo 7 ngày</th>
                <th scope="col">Khoảng dự báo</th>
                <th scope="col">Độ tin cậy dữ liệu</th>
              </tr>
            </thead>
            <tbody>
              {filteredForecasts.map(item => {
                const isSelected = selectedItem && Number(selectedItem.productId) === Number(item.productId);
                return (
                  <tr
                    key={item.productId}
                    onClick={() => setSelectedProdId(item.productId)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'var(--primary-bg)' : undefined
                    }}
                  >
                    <td data-label="Sản phẩm">
                      <div style={{ fontWeight: 700, color: isSelected ? 'var(--primary-hover)' : 'var(--text-main)' }}>
                        {item.productName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                        {item.productSku} • {item.categoryName}
                      </div>
                    </td>
                    <td data-label="Thực tế 14d" className="num-tabular">
                      <div>Tồn: <strong>{item.currentStock}</strong> {item.unit}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        d_base = {item.averageDailyDemandBase}/ngày ({item.demandSource === 'ACTUAL_SALES' ? 'Bán thật 14d' : '0 giao dịch 14d'})
                      </div>
                    </td>
                    <td data-label="Ngoại cảnh" className="num-tabular">
                      <div>{item.weatherFactor} × {item.holidayFactor} → <strong>{item.adjustedDailyDemand}</strong>/ngày</div>
                    </td>
                    <td data-label="Dự báo 7d" className="num-tabular" style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      {item.predictedSales7d} {item.unit}
                    </td>
                    <td data-label="Khoảng" className="num-tabular">
                      {item.lowerBound} – {item.upperBound} {item.unit}
                    </td>
                    <td data-label="Độ tin cậy">
                      {item.isDataSufficient ? (
                        <span className="ss-badge ss-badge-safe">
                          Đủ dữ liệu ({item.historyDaysCount}d){item.maeMetric ? ` • MAE ${item.maeMetric}` : ''}
                        </span>
                      ) : (
                        <span className="ss-badge ss-badge-warning" title={item.dataQualityWarning || ''}>
                          Thiếu dữ liệu ({item.historyDaysCount}/7d)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Live .pkl Model Inference Dialog */}
      <ModalDialog
        isOpen={inferenceModalOpen}
        onClose={() => setInferenceModalOpen(false)}
        title="Kiểm định Mô hình LightGBM (.pkl)"
        subtitle="Chạy Python CLI suy luận trực tiếp trên dữ liệu SQL Server & thời tiết Open-Meteo"
        size="lg"
      >
        {runningInference ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Đang chạy tiến trình suy luận Python AI Model...
          </div>
        ) : inferenceError ? (
          <div role="alert" style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--danger-red-bg)', border: '1px solid var(--danger-red-border)', color: 'var(--danger-red-light)', fontWeight: 600 }}>
            {inferenceError}
          </div>
        ) : inferenceResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="ss-card-subtle" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.82rem' }}>
              <span>Model: <strong>{inferenceResult.modelName || 'LightGBM-HistGBT-v2.1-Pretrained'}</strong></span>
              <span>Dataset: <strong>{inferenceResult.totalDatasetRows || 0} dòng</strong></span>
              <span>
                MAE: <strong>{inferenceResult.metrics?.mae ?? '—'}</strong> • RMSE: <strong>{inferenceResult.metrics?.rmse ?? '—'}</strong> • MAPE: <strong>{inferenceResult.metrics?.mape_pct ?? '—'}%</strong>
              </span>
            </div>
            <div className="table-wrapper">
              <table className="ss-table ss-table-responsive">
                <thead>
                  <tr>
                    <th scope="col">Cửa hàng / SKU</th>
                    <th scope="col">TB 14 ngày</th>
                    <th scope="col">Thực tế</th>
                    <th scope="col">Dự báo / ngày</th>
                    <th scope="col">Dự báo 7 ngày</th>
                    <th scope="col">Sai số</th>
                  </tr>
                </thead>
                <tbody>
                  {(inferenceResult.testPredictions || []).map((row, idx) => (
                    <tr key={idx}>
                      <td data-label="Cửa hàng / SKU">
                        <div style={{ fontWeight: 700 }}>{row.storeCode || `Store #${row.storeId}`}</div>
                        <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-dim)' }}>{row.sku}</div>
                      </td>
                      <td data-label="TB 14 ngày" className="num-tabular">{Number(row.rollingMean14d ?? 0).toFixed(2)}</td>
                      <td data-label="Thực tế" className="num-tabular">{Number(row.actualDailyDemand ?? 0).toFixed(2)}</td>
                      <td data-label="Dự báo / ngày" className="num-tabular" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {Number(row.predictedDailyDemand ?? 0).toFixed(2)}
                      </td>
                      <td data-label="Dự báo 7 ngày" className="num-tabular">{Number(row.predictedDemand7d ?? 0).toFixed(1)}</td>
                      <td data-label="Sai số" className="num-tabular">{row.absError !== undefined ? Number(row.absError).toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </ModalDialog>
    </div>
  );
}
