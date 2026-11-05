// src/domain/value-objects/ShelfLife.js
const AlertLevel = require('./AlertLevel');

/**
 * Value Object quản lý vòng đời Hạn sử dụng của lô hàng (Shelf-Life)
 * Tuân thủ công thức toán học Mục 7, Rule 4, Rule 5 & Rule 7 của Đặc tả SSOT
 */
class ShelfLife {
  constructor(manufactureDate, expiryDate, currentDate = new Date()) {
    this.manufactureDate = new Date(manufactureDate);
    this.expiryDate = new Date(expiryDate);
    this.currentDate = new Date(currentDate);

    // Chuẩn hóa về đầu ngày (00:00:00) để tính khoảng cách số ngày chính xác
    this.manufactureDate.setHours(0, 0, 0, 0);
    this.expiryDate.setHours(0, 0, 0, 0);
    this.currentDate.setHours(0, 0, 0, 0);

    if (this.expiryDate <= this.manufactureDate) {
      throw new Error('Hạn sử dụng (ExpiryDate) bắt buộc phải lớn hơn Ngày sản xuất (ManufactureDate)!');
    }
  }

  /**
   * Tổng số ngày vòng đời tiêu chuẩn: TotalLife = ExpiryDate - ManufactureDate
   */
  getTotalDays() {
    const diffMs = this.expiryDate.getTime() - this.manufactureDate.getTime();
    return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }

  /**
   * Số ngày còn lại: DaysLeft = ExpiryDate - CurrentDate
   */
  getDaysLeft() {
    const diffMs = this.expiryDate.getTime() - this.currentDate.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Tỷ lệ phần trăm hạn dùng còn lại: RSL = (DaysLeft / TotalDays) * 100%
   */
  getRslPercent() {
    const total = this.getTotalDays();
    const left = this.getDaysLeft();
    if (left <= 0) return 0.0;
    return Number(((left / total) * 100).toFixed(2));
  }

  /**
   * Kiểm định tiêu chuẩn nhận date từ xe tải Kho tổng DC (Rule 7: RSL >= 70%)
   * RSL_inbound = (ExpiryDate - ImportDate) / TotalDays >= 70%
   */
  validateInboundFreshness(importDate = new Date(), minRslPercent = 70.0) {
    const imp = new Date(importDate);
    imp.setHours(0, 0, 0, 0);
    const remainingMs = this.expiryDate.getTime() - imp.getTime();
    const remainingDays = Math.round(remainingMs / (1000 * 60 * 60 * 24));
    const totalDays = this.getTotalDays();
    const inboundRsl = Number(((remainingDays / totalDays) * 100).toFixed(2));

    return {
      isAcceptable: inboundRsl >= minRslPercent,
      inboundRslPercent: inboundRsl,
      requiredMinPercent: minRslPercent,
      totalDays,
      remainingDays
    };
  }

  /**
   * Đánh giá cấp độ cảnh báo rủi ro 3 vùng màu (Rule 4 & Rule 5)
   * @param {number} warningThresholdDays Ngưỡng cảnh báo cận date của sản phẩm/ngành hàng
   */
  evaluateAlertLevel(warningThresholdDays = 7) {
    const daysLeft = this.getDaysLeft();

    if (daysLeft <= 0) {
      return AlertLevel.EXPIRED; // Hết hạn -> Khóa cứng bán POS (Rule 5)
    }
    if (daysLeft <= 3) {
      return AlertLevel.RED;     // Nguy kịch (0 < DaysLeft <= 3)
    }
    if (daysLeft <= warningThresholdDays) {
      return AlertLevel.YELLOW;  // Cảnh báo (3 < DaysLeft <= WarningDays)
    }
    return AlertLevel.GREEN;     // An toàn (DaysLeft > WarningDays)
  }
}

module.exports = ShelfLife;
