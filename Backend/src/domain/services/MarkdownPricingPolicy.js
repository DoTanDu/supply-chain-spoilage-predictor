// src/domain/services/MarkdownPricingPolicy.js
const AlertLevel = require('../value-objects/AlertLevel');

/**
 * Domain Service: Chính sách Xả hàng Giảm giá Quick Markdown (Rule 10)
 * Kiểm soát 4 mức chiết khấu chuẩn: 15%, 30%, 40%, 50%
 * Khuyến nghị mức giảm giá tối ưu theo cấp độ màu rủi ro hạn dùng
 */
class MarkdownPricingPolicy {
  static ALLOWED_PERCENTAGES = [0, 15, 30, 40, 50];

  /**
   * Kiểm tra mức chiết khấu có hợp lệ không
   */
  static isAllowedPercent(percent) {
    return this.ALLOWED_PERCENTAGES.includes(Number(percent));
  }

  /**
   * Gợi ý mức giảm giá tối ưu dựa trên số ngày còn lại (DaysLeft) và vùng màu
   * @param {number} daysLeft Số ngày còn lại của lô
   * @param {number} warningDays Ngưỡng cảnh báo cận date
   * @returns {Object} Gợi ý mức chiết khấu và hành động
   */
  static recommendMarkdown(daysLeft, warningDays = 7) {
    const days = Number(daysLeft);

    if (days <= 0) {
      return {
        recommendedPercent: 0,
        alertLevel: AlertLevel.EXPIRED,
        action: 'LOCK_POS',
        message: 'Lô hàng đã hết hạn sử dụng. Tự động khóa cứng bán POS và lập biên bản tiêu hủy.'
      };
    }

    if (days <= 3) {
      // Vùng Đỏ: Nguy kịch (0 < DaysLeft <= 3) -> Giảm kịch sàn 40% - 50%
      return {
        recommendedPercent: 50,
        alternativePercent: 40,
        alertLevel: AlertLevel.RED,
        action: 'DEEP_DISCOUNT_FLASH_SALE',
        message: 'Vùng Đỏ khẩn cấp! Khuyến nghị giảm kịch sàn 40% - 50% và đảo ra mặt tiền để xả trong ngày.'
      };
    }

    if (days <= warningDays) {
      // Vùng Vàng: Cảnh báo (3 < DaysLeft <= WarningDays) -> Giảm nhẹ 15% - 30%
      return {
        recommendedPercent: 30,
        alternativePercent: 15,
        alertLevel: AlertLevel.YELLOW,
        action: 'ROTATE_AND_MARKDOWN',
        message: 'Vùng Vàng cảnh báo. Khuyến nghị giảm nhẹ 15% - 30% kết hợp SOP đảo kệ mặt tiền trưng bày.'
      };
    }

    // Vùng Xanh: An toàn -> Bán nguyên giá niêm yết
    return {
      recommendedPercent: 0,
      alertLevel: AlertLevel.GREEN,
      action: 'NORMAL_SALE',
      message: 'Vùng Xanh an toàn. Bán theo giá niêm yết chuẩn 100%.'
    };
  }

  /**
   * Tính toán giá bán lẻ sau chiết khấu
   * @param {number} originalPrice Giá bán niêm yết
   * @param {number} discountPercent Phần trăm giảm giá (0, 15, 30, 40, 50)
   */
  static calculateDiscountedPrice(originalPrice, discountPercent) {
    const price = Number(originalPrice);
    const pct = Number(discountPercent);

    if (price < 0) throw new Error('Giá niêm yết không hợp lệ!');
    if (!this.isAllowedPercent(pct)) {
      throw new Error(`Mức giảm giá không hợp lệ: ${discountPercent}%. Chỉ chấp nhận: 0%, 15%, 30%, 40%, 50%`);
    }

    if (pct === 0) return price;
    const discounted = Math.round(price * (1.0 - (pct / 100.0)));
    return discounted;
  }
}

module.exports = MarkdownPricingPolicy;
