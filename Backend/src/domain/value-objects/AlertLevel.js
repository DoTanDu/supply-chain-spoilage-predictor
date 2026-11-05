// src/domain/value-objects/AlertLevel.js
/**
 * 4 Cấp độ cảnh báo rủi ro hạn sử dụng bất biến theo Đặc tả SSOT (Rule 4 & Rule 5)
 */
class AlertLevel {
  static GREEN = 'GREEN';       // An toàn (> WarningDays): Bán nguyên giá niêm yết
  static YELLOW = 'YELLOW';     // Cảnh báo (3 < DaysLeft <= WarningDays): Giảm 15%-30%, đảo kệ mặt tiền
  static RED = 'RED';           // Nguy kịch (0 < DaysLeft <= 3): Giảm kịch sàn 40%-50%, gom xả trong ngày
  static EXPIRED = 'EXPIRED';   // Quá hạn (DaysLeft <= 0): Khóa cứng xuất bán POS, chờ tiêu hủy

  static isValid(level) {
    return [this.GREEN, this.YELLOW, this.RED, this.EXPIRED].includes(level);
  }

  static getBadgeColor(level) {
    switch (level) {
      case this.GREEN:
        return '#10B981'; // Xanh lá
      case this.YELLOW:
        return '#F59E0B'; // Vàng cam
      case this.RED:
        return '#EF4444'; // Đỏ rực
      case this.EXPIRED:
        return '#6B7280'; // Xám đậm / Khóa
      default:
        return '#9CA3AF';
    }
  }
}

module.exports = AlertLevel;
