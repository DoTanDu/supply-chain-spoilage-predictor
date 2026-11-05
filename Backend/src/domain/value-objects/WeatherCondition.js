// src/domain/value-objects/WeatherCondition.js
/**
 * Value Object xử lý biến ngoại cảnh thời tiết theo Đặc tả SSOT (Rule 8)
 * Ảnh hưởng đến hệ số nhu cầu W_factor khi tính toán điểm đặt hàng ROP
 */
class WeatherCondition {
  static NORMAL = 'NORMAL'; // Thời tiết bình thường: W_factor = 1.00
  static SUNNY = 'SUNNY';   // Nắng nóng: W_factor tăng cho nước giải khát, sữa chua, đồ mát
  static RAINY = 'RAINY';   // Mưa bão: W_factor tăng cho thực phẩm tiện lợi, đồ khô, bánh mì

  static VALID_CONDITIONS = [this.NORMAL, this.SUNNY, this.RAINY];

  constructor(condition = 'NORMAL') {
    const normalized = String(condition || 'NORMAL').trim().toUpperCase();
    if (!WeatherCondition.VALID_CONDITIONS.includes(normalized)) {
      throw new Error(`Điều kiện thời tiết không hợp lệ: ${condition}. Chỉ chấp nhận: NORMAL, SUNNY, RAINY`);
    }
    this.value = normalized;
  }

  /**
   * Tính toán hệ số nhu cầu thời tiết W_factor dựa trên mã ngành hàng FMCG
   * @param {string} categoryCode Mã ngành hàng (BEVERAGE, DAIRY, BAKERY, DRY_FOOD, MEAT)
   * @returns {number} Hệ số nhân ngoại cảnh W_factor (ví dụ 1.25)
   */
  getDemandFactor(categoryCode = '') {
    const cat = String(categoryCode || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toUpperCase();

    const isBeverage = cat.includes('BEVERAGE') || cat.includes('DO UONG') || cat.includes('GIAI KHAT');
    const isDairy = cat.includes('DAIRY') || cat.includes('SUA');
    const isBakery = cat.includes('BAKERY') || cat.includes('BANH') || cat.includes('TRANG MIENG');
    const isDry = cat.includes('DRY') || cat.includes('KHO') || cat.includes('GIA VI') || cat.includes('CHE BIEN') || cat.includes('DONG HOP');

    switch (this.value) {
      case WeatherCondition.SUNNY:
        if (isBeverage) return 1.30; // Nước giải khát tăng 30%
        if (isDairy) return 1.15;    // Sữa chua/sữa mát tăng 15%
        if (isDry) return 0.90;      // Đồ khô giảm nhẹ 10%
        return 1.05;

      case WeatherCondition.RAINY:
        if (isBakery) return 1.25;   // Bánh mì/thực phẩm tiện lợi tăng 25%
        if (isDry) return 1.20;      // Mì gói/đồ khô ăn liền tăng 20%
        if (isBeverage) return 0.80; // Nước lạnh giảm 20%
        return 1.00;

      case WeatherCondition.NORMAL:
      default:
        return 1.00; // Bình thường giữ nguyên 1.00
    }
  }

  toString() {
    return this.value;
  }
}

module.exports = WeatherCondition;
