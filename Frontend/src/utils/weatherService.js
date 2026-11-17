// src/utils/weatherService.js
/**
 * Dịch vụ đồng bộ thời tiết & lịch lễ thực tế theo thời gian thực (Open-Meteo + Nager.Date VN)
 * Không sử dụng bất kỳ nhiệt độ hoặc trạng thái giả lập nào khi mất kết nối.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export async function fetchRealtimeEnvironment({ storeId = null, lat = null, lon = null, locationName = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (storeId && String(storeId).toUpperCase() !== 'ALL') {
      params.set('storeId', String(storeId));
    }
    if (lat !== null && lon !== null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))) {
      params.set('lat', String(lat));
      params.set('lon', String(lon));
    }
    if (locationName) {
      params.set('locationName', locationName);
    }

    const token = localStorage.getItem('token');
    const qs = params.toString();
    const res = await fetch(`${API_BASE}/forecast/environment${qs ? `?${qs}` : ''}`, {
      cache: 'no-cache',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !data.success || !data.current) {
      throw new Error(data?.message || `HTTP ${res.status}`);
    }

    return {
      success: true,
      online: true,
      source: data.source || 'Open-Meteo Live API',
      condition: data.current.condition,
      temp: data.current.temp,
      apparentTemp: data.current.apparentTemp,
      humidity: data.current.humidity,
      precipitation: data.current.precipitation,
      windSpeed: data.current.windSpeed,
      weatherCode: data.current.weatherCode,
      label: data.current.label,
      location: data.locationName,
      coordinates: data.coordinates,
      isHoliday: Boolean(data.calendar?.isHoliday),
      isPublicHoliday: Boolean(data.calendar?.isPublicHoliday),
      isWeekend: Boolean(data.calendar?.isWeekend),
      holidayName: data.calendar?.holidayName || null,
      calendarLabel: data.calendar?.label || 'Ngày thường',
      dailyForecast: Array.isArray(data.dailyForecast) ? data.dailyForecast : [],
      updatedAt: new Date(data.fetchedAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
  } catch (err) {
    return {
      success: false,
      online: false,
      condition: null,
      temp: null,
      apparentTemp: null,
      humidity: null,
      precipitation: null,
      windSpeed: null,
      label: 'Mất kết nối thời tiết',
      location: locationName || 'Chưa xác định',
      isHoliday: false,
      calendarLabel: 'Ngày thường',
      dailyForecast: [],
      error: err.message
    };
  }
}
