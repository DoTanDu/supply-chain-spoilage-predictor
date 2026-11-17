// src/infrastructure/services/RealEnvironmentService.js
const SqlConnection = require('../database/sqlConnection');

const geocodeCache = new Map();
const weatherCache = new Map();
const holidayCache = new Map();

const WEATHER_TTL_MS = 10 * 60 * 1000; // 10 phút cache cho dữ liệu thực Open-Meteo
const HOLIDAY_TTL_MS = 12 * 60 * 60 * 1000;

function stripVietnamese(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

function extractCityQuery(address = '') {
  const raw = String(address || '').trim();
  if (!raw) return null;
  const knownPlaces = [
    { match: /bi[êe]n\s*h[oò]a/i, query: 'Bien Hoa', display: 'TP. Biên Hòa' },
    { match: /h[oồ]\s*ch[ií]\s*minh|tp\.?\s*hcm|s[aà]i\s*g[oò]n|qu[ậa]n\s*\d+/i, query: 'Ho Chi Minh City', display: 'TP. Hồ Chí Minh' },
    { match: /h[aà]\s*n[ộo]i/i, query: 'Hanoi', display: 'Hà Nội' },
    { match: /[đd][aà]\s*n[ẵa]ng/i, query: 'Da Nang', display: 'Đà Nẵng' },
    { match: /c[ầa]n\s*th[ơo]/i, query: 'Can Tho', display: 'Cần Thơ' },
    { match: /h[ảa]i\s*ph[oò]ng/i, query: 'Hai Phong', display: 'Hải Phòng' },
    { match: /b[ìi]nh\s*d[ươ]ng|th[ủu]\s*d[ầa]u\s*m[ộo]t|d[ĩi]\s*an|thu[ậa]n\s*an/i, query: 'Thu Dau Mot', display: 'Bình Dương' },
    { match: /[đd][ồo]ng\s*nai/i, query: 'Bien Hoa', display: 'Đồng Nai' },
    { match: /nha\s*trang|kh[aá]nh\s*h[oò]a/i, query: 'Nha Trang', display: 'Nha Trang' },
    { match: /v[ũu]ng\s*t[aà]u|b[àa]\s*r[ịi]a/i, query: 'Vung Tau', display: 'Vũng Tàu' },
    { match: /[đd][àa]\s*l[ạa]t|l[âa]m\s*[đd][ồo]ng/i, query: 'Da Lat', display: 'Đà Lạt' }
  ];
  for (const k of knownPlaces) {
    if (k.match.test(raw)) return k;
  }
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  const candidate = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  const cleaned = candidate.replace(/^(TP\.?|Thành phố|Tỉnh|Quận|Huyện|Thị xã)\s+/i, '').trim();
  return { query: stripVietnamese(cleaned) || 'Bien Hoa', display: candidate || 'Việt Nam' };
}

function classifyWmoWeather(code, tempC, apparentTempC = tempC, precipMm = 0) {
  const c = Number(code);
  const temp = Number(tempC);
  const appTemp = Number(apparentTempC ?? tempC);
  const precip = Number(precipMm || 0);

  let label = 'Nhiều mây';
  if (c === 0) label = 'Trời quang';
  else if (c === 1) label = 'Ít mây';
  else if (c === 2) label = 'Mây rải rác';
  else if (c === 3) label = 'Nhiều mây';
  else if (c === 45 || c === 48) label = 'Sương mù';
  else if (c >= 51 && c <= 57) label = 'Mưa phùn';
  else if (c === 61 || c === 80) label = 'Mưa nhỏ';
  else if (c === 63 || c === 81) label = 'Mưa vừa';
  else if (c === 65 || c === 66 || c === 67 || c === 82) label = 'Mưa to';
  else if (c >= 95) label = 'Mưa dông';

  let condition = 'NORMAL';
  if ((c >= 51 && c <= 99) || precip >= 0.2) {
    condition = 'RAINY';
  } else if ((c <= 2 && temp >= 32) || appTemp >= 36) {
    condition = 'SUNNY';
  }

  return { label, condition };
}

async function geocodePlace(placeQuery, displayHint) {
  const cacheKey = String(placeQuery || '').toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(placeQuery)}&count=3&language=vi&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!res.ok) {
    throw new Error(`Geocoding API HTTP ${res.status}`);
  }
  const json = await res.json();
  const list = Array.isArray(json.results) ? json.results : [];
  const vnMatch = list.find(r => r.country_code === 'VN') || list[0];
  if (!vnMatch) {
    throw new Error(`Không tìm thấy tọa độ địa lý thực tế cho "${displayHint || placeQuery}".`);
  }
  const resolved = {
    lat: Number(vnMatch.latitude),
    lon: Number(vnMatch.longitude),
    locationName: displayHint || vnMatch.name
  };
  geocodeCache.set(cacheKey, resolved);
  return resolved;
}

async function fetchPublicHolidaysForYear(year) {
  const cached = holidayCache.get(year);
  if (cached && Date.now() - cached.ts < HOLIDAY_TTL_MS) {
    return cached.map;
  }
  const map = new Map();
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/VN`, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const arr = await res.json();
      if (Array.isArray(arr)) {
        for (const h of arr) {
          if (h?.date) {
            map.set(h.date, h.localName || h.name || 'Ngày lễ');
          }
        }
      }
    }
  } catch {
    // Nếu mạng tạm gián đoạn API lễ Nager.Date, fallback tối thiểu các ngày lễ cố định Dương lịch VN
  }
  if (map.size === 0) {
    map.set(`${year}-01-01`, 'Tết Dương lịch');
    map.set(`${year}-04-30`, 'Giải phóng miền Nam');
    map.set(`${year}-05-01`, 'Quốc tế Lao động');
    map.set(`${year}-09-02`, 'Quốc khánh');
  }
  holidayCache.set(year, { ts: Date.now(), map });
  return map;
}

function getVnTodayStr() {
  const now = new Date();
  const vnStr = now.toLocaleString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
  return vnStr.slice(0, 10);
}

class RealEnvironmentService {
  static async resolveCoordinates({ storeId = 1, lat = null, lon = null, locationName = '' } = {}) {
    if (lat !== null && lon !== null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))) {
      return {
        lat: Number(lat),
        lon: Number(lon),
        locationName: locationName?.trim() || `GPS (${Number(lat).toFixed(2)}°N, ${Number(lon).toFixed(2)}°E)`
      };
    }

    const safeStoreId = Number(storeId) > 0 ? Number(storeId) : 1;
    const storeRows = await SqlConnection.queryJson(`
      SELECT TOP 1 store_name AS storeName, address
      FROM dbo.store_profile
      WHERE id = ${safeStoreId};
    `).catch(() => []);

    const address = storeRows[0]?.address || '';
    const extracted = extractCityQuery(address);
    if (!extracted) {
      throw new Error('Chi nhánh chưa có địa chỉ trong CSDL để xác định thời tiết thực tế.');
    }
    return await geocodePlace(extracted.query, extracted.display);
  }

  static async getLiveEnvironment({ storeId = 1, lat = null, lon = null, locationName = '' } = {}) {
    const coords = await this.resolveCoordinates({ storeId, lat, lon, locationName });
    const cKey = `${coords.lat.toFixed(2)},${coords.lon.toFixed(2)}`;
    const cachedWeather = weatherCache.get(cKey);

    let weatherData;
    if (cachedWeather && Date.now() - cachedWeather.ts < WEATHER_TTL_MS) {
      weatherData = cachedWeather.data;
    } else {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Asia%2FHo_Chi_Minh&forecast_days=8`;
      const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (!res.ok) {
        throw new Error(`Open-Meteo trả về HTTP ${res.status}`);
      }
      weatherData = await res.json();
      if (!weatherData?.current) {
        throw new Error('Open-Meteo không trả về dữ liệu current weather.');
      }
      weatherCache.set(cKey, { ts: Date.now(), data: weatherData });
    }

    const cur = weatherData.current;
    const temp = Number(Number(cur.temperature_2m).toFixed(1));
    const apparentTemp = Number(Number(cur.apparent_temperature ?? temp).toFixed(1));
    const humidity = Math.round(Number(cur.relative_humidity_2m ?? 0));
    const precipitation = Number(Number(cur.precipitation ?? 0).toFixed(1));
    const windSpeed = Number(Number(cur.wind_speed_10m ?? 0).toFixed(1));
    const weatherCode = Number(cur.weather_code ?? 0);
    const isDay = Number(cur.is_day ?? 1) === 1;
    const currentClass = classifyWmoWeather(weatherCode, temp, apparentTemp, precipitation);

    const todayStr = getVnTodayStr();
    const currentYear = Number(todayStr.slice(0, 4));
    const [holidaysCurr, holidaysNext] = await Promise.all([
      fetchPublicHolidaysForYear(currentYear),
      fetchPublicHolidaysForYear(currentYear + 1)
    ]);
    const getHolidayName = (dateStr) => holidaysCurr.get(dateStr) || holidaysNext.get(dateStr) || null;

    const todayObj = new Date(`${todayStr}T12:00:00+07:00`);
    const todayDow = todayObj.getDay();
    const isTodayWeekend = todayDow === 0 || todayDow === 6;
    const todayHolidayName = getHolidayName(todayStr);
    const isTodayPublicHoliday = Boolean(todayHolidayName);
    const isTodayHoliday = isTodayPublicHoliday || isTodayWeekend;

    const dailyRaw = weatherData.daily || {};
    const times = Array.isArray(dailyRaw.time) ? dailyRaw.time : [];
    const dowLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dailyForecast = [];

    for (let i = 0; i < times.length; i++) {
      const dateStr = times[i];
      if (dateStr <= todayStr) continue;
      if (dailyForecast.length >= 7) break;

      const dObj = new Date(`${dateStr}T12:00:00+07:00`);
      const dDowIdx = dObj.getDay();
      const dWeekend = dDowIdx === 0 || dDowIdx === 6;
      const dHolidayName = getHolidayName(dateStr);
      const tMax = Number(Number(dailyRaw.temperature_2m_max?.[i] ?? temp).toFixed(1));
      const tMin = Number(Number(dailyRaw.temperature_2m_min?.[i] ?? temp).toFixed(1));
      const pSum = Number(Number(dailyRaw.precipitation_sum?.[i] ?? 0).toFixed(1));
      const pProb = Math.round(Number(dailyRaw.precipitation_probability_max?.[i] ?? 0));
      const wCode = Number(dailyRaw.weather_code?.[i] ?? weatherCode);
      const dClass = classifyWmoWeather(wCode, tMax, tMax, pSum);

      dailyForecast.push({
        date: dateStr,
        dayLabel: `${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)}`,
        dow: dowLabels[dDowIdx],
        weatherCode: wCode,
        label: dClass.label,
        condition: dClass.condition,
        tempMin: tMin,
        tempMax: tMax,
        precipSum: pSum,
        precipProb: pProb,
        isWeekend: dWeekend,
        isPublicHoliday: Boolean(dHolidayName),
        holidayName: dHolidayName,
        isHoliday: Boolean(dHolidayName) || dWeekend
      });
    }

    return {
      success: true,
      source: 'Open-Meteo + Nager.Date VN',
      locationName: coords.locationName,
      coordinates: { lat: coords.lat, lon: coords.lon },
      current: {
        time: cur.time,
        temp,
        apparentTemp,
        humidity,
        precipitation,
        windSpeed,
        weatherCode,
        isDay,
        label: currentClass.label,
        condition: currentClass.condition
      },
      calendar: {
        todayDate: todayStr,
        isWeekend: isTodayWeekend,
        isPublicHoliday: isTodayPublicHoliday,
        holidayName: todayHolidayName,
        isHoliday: isTodayHoliday,
        label: todayHolidayName || (isTodayWeekend ? 'Cuối tuần' : 'Ngày thường')
      },
      dailyForecast,
      fetchedAt: new Date().toISOString()
    };
  }
}

module.exports = RealEnvironmentService;
