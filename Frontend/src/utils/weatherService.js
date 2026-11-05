/**
 * Dịch vụ đồng bộ thời tiết thời gian thực tại TP. Biên Hòa, Tỉnh Đồng Nai (Mục 26.2 SSOT)
 * Sử dụng Open-Meteo API (Miễn phí, không cần API Key, hỗ trợ CORS trình duyệt).
 * Tọa độ TP. Biên Hòa: Vĩ độ 10.9574 N, Kinh độ 106.8427 E.
 */

export async function fetchRealtimeWeatherBienHoa() {
  const LAT = 10.9574;
  const LON = 106.8427;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current_weather=true`;

  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Open-Meteo API trả về mã lỗi HTTP ${res.status}`);
    }
    const data = await res.json();
    const current = data.current_weather;

    if (!current) {
      throw new Error('Không tìm thấy dữ liệu current_weather từ API!');
    }

    const temp = Math.round(current.temperature);
    const code = Number(current.weathercode);

    // Ánh xạ mã WMO Weather Code sang 3 trạng thái của mô hình SSOT
    // 0: Trời quang đãng, 1: Nắng/Ít mây
    // 2: Mây rải rác, 3: U ám / Nhiều mây
    // 51-67, 80-82, 95-99: Mưa rào, mưa dông
    let condition = 'NORMAL';
    let label = 'Bình thường';
    let kFactor = 1.0;

    if (code === 0 || code === 1 || temp >= 32) {
      condition = 'SUNNY';
      label = 'Nắng nóng';
      kFactor = 1.4;
    } else if (code >= 51 && code <= 99) {
      condition = 'RAINY';
      label = 'Mưa mát';
      kFactor = 0.8;
    } else {
      condition = 'NORMAL';
      label = 'Nhiều mây / Dịu mát';
      kFactor = 1.0;
    }

    return {
      success: true,
      condition,
      temp,
      label,
      kFactor,
      location: 'TP. Biên Hòa',
      coordinates: `${LAT}°N, ${LON}°E`,
      rawCode: code,
      updatedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
  } catch (err) {
    console.warn('[Open-Meteo] Lỗi lấy thời tiết thời gian thực:', err.message);
    return {
      success: false,
      condition: 'NORMAL',
      temp: 30,
      label: 'Bình thường (Offline)',
      kFactor: 1.0,
      location: 'TP. Biên Hòa',
      error: err.message
    };
  }
}
