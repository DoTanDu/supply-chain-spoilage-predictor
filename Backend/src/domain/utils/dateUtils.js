// src/domain/utils/dateUtils.js
const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh';

/**
 * Chuẩn hóa Date hoặc chuỗi ngày về định dạng YYYY-MM-DD theo múi giờ Việt Nam (UTC+7),
 * tránh lỗi lùi 1 ngày khi gọi .toISOString().slice(0, 10) vào khung 00:00 - 06:59 sáng.
 */
function formatLocalDateYMD(dateInput = new Date()) {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    return dateInput.trim();
  }
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    return formatLocalDateYMD(new Date());
  }
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: VN_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  } catch {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

/**
 * Chuyển ngày về mốc 00:00 UTC của đúng ngày lịch tại Việt Nam (UTC+7) để tính chênh lệch số ngày chính xác.
 */
function toVnDayStartMs(dateInput = new Date()) {
  const ymd = formatLocalDateYMD(dateInput);
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

module.exports = {
  VN_TIME_ZONE,
  formatLocalDateYMD,
  toVnDayStartMs
};
