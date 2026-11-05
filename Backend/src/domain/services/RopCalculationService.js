// src/domain/services/RopCalculationService.js
const WeatherCondition = require('../value-objects/WeatherCondition');

/**
 * Domain Service: Dự báo Điểm Đặt Hàng Bổ Sung (Reorder Point - ROP)
 * Tích hợp đa biến ngoại cảnh (Tốc độ bán 14 ngày + Thời tiết + Ngày lễ)
 * Phân tích nguy cơ ứ đọng quá hạn (DOS > DUE) theo Rule 8 của Đặc tả SSOT
 */
class RopCalculationService {
  /**
   * Tính toán dự báo ROP cho sản phẩm
   * @param {Object} params
   * @param {number} params.productId ID sản phẩm
   * @param {string} params.productName Tên sản phẩm
   * @param {string} params.categoryCode Mã ngành hàng FMCG
   * @param {number} params.currentStock Số lượng tồn kho hiện tại
   * @param {number} params.minStockLevel Ngưỡng an toàn tối thiểu (Safety Stock)
   * @param {number} params.maxStockLevel Ngưỡng tồn kho tối đa
   * @param {number} params.leadTimeDays Thời gian giao hàng chuẩn của DC Biên Hòa (mặc định 1 ngày)
   * @param {Array<number>} params.salesHistory14Days Mảng số lượng bán của 14 ngày gần nhất
   * @param {string} params.weather Điều kiện thời tiết (NORMAL, SUNNY, RAINY)
   * @param {boolean} params.isHoliday Cờ ngày lễ hoặc cuối tuần cao điểm
   * @param {number} params.earliestBatchDaysLeft Số ngày còn lại của lô cận date nhất (DUE)
   * @returns {Object} Kết quả tính toán ROP và đề xuất đặt hàng gửi DC
   */
  static calculateROP({
    productId,
    productName = '',
    categoryCode = '',
    currentStock = 0,
    minStockLevel = 15,
    maxStockLevel = 150,
    leadTimeDays = 1,
    salesHistory14Days = [],
    weather = 'NORMAL',
    isHoliday = false,
    earliestBatchDaysLeft = null
  }) {
    const stock = Math.max(0, Number(currentStock));
    const ss = Math.max(1, Number(minStockLevel));
    const maxStock = Math.max(ss, Number(maxStockLevel));
    const lt = Math.max(1, Number(leadTimeDays));

    // 1. Tính tốc độ bán bình quân 14 ngày (d_base)
    let totalSales14 = 0;
    let d_base = 0;
    if (Array.isArray(salesHistory14Days) && salesHistory14Days.length > 0) {
      totalSales14 = salesHistory14Days.reduce((sum, q) => sum + Math.max(0, Number(q)), 0);
      const daysCount = Math.max(1, salesHistory14Days.length);
      d_base = Number((totalSales14 / daysCount).toFixed(2));
    }
    if (d_base <= 0) {
      // Định mức tiêu thụ cơ sở nếu mặt hàng chưa phát sinh giao dịch trong 14 ngày qua
      d_base = Math.max(1.5, Number((ss * 0.25).toFixed(2)));
    }

    // 2. Xác định các hệ số ngoại cảnh
    const weatherObj = new WeatherCondition(weather);
    const w_factor = weatherObj.getDemandFactor(categoryCode);
    const h_factor = isHoliday ? 1.30 : 1.00; // Ngày lễ nhu cầu tăng 30%

    // 3. Tốc độ bán điều chỉnh ngoại cảnh (d_adjusted)
    const d_adjusted = Math.max(0.1, Number((d_base * w_factor * h_factor).toFixed(2)));

    // 4. Tính Điểm đặt hàng: ROP = (d_adjusted * LeadTime) + SafetyStock
    const rop = Math.ceil((d_adjusted * lt) + ss);

    // 5. Tính Ngày tồn kho ước tính (Days of Supply - DOS)
    // DOS = Tồn hiện tại / Tốc độ bán điều chỉnh ngày
    const dos = d_adjusted > 0 ? Number((stock / d_adjusted).toFixed(1)) : 999;

    // 6. Đánh giá rủi ro ứ đọng quá hạn (DOS > DUE)
    // DUE: Số ngày còn lại của lô có HSD ngắn nhất
    let isRiskOfSpoilage = false;
    let spoilageWarningMessage = null;

    if (earliestBatchDaysLeft !== null && earliestBatchDaysLeft > 0) {
      const due = Number(earliestBatchDaysLeft);
      if (dos > due) {
        isRiskOfSpoilage = true;
        spoilageWarningMessage = (
          `CẢNH BÁO NGUY CƠ Ứ ĐỌNG (DOS > DUE): Với tốc độ bán hiện tại (${d_adjusted} SP/ngày), ` +
          `cần ${dos} ngày để tiêu thụ hết lượng tồn (${stock} SP), trong khi lô cận date chỉ còn ${due} ngày! ` +
          `Nguy cơ hàng bị quá hạn trước khi bán hết.`
        );
      }
    }

    // 7. Xác định trạng thái cần đặt hàng và Số lượng đề xuất (Suggested Quantity)
    const isReorderNeeded = stock <= rop;
    let suggestedQuantity = 0;

    if (isReorderNeeded) {
      // Đề xuất đặt bù đủ đến MaxStockLevel
      suggestedQuantity = Math.max(ss, maxStock - stock);

      // Nếu đang có nguy cơ ứ đọng date, giảm số lượng đặt hàng đề xuất để tránh tích tụ tồn kho
      if (isRiskOfSpoilage) {
        suggestedQuantity = Math.max(ss, Math.round(suggestedQuantity * 0.5));
      }
    }

    // 8. Giải thích minh bạch quyết định AI/ROP (theo định hướng SmartSupply AI)
    const weatherLabel = weatherObj.toString() === 'SUNNY' ? 'Nắng nóng' : (weatherObj.toString() === 'RAINY' ? 'Mưa bão' : 'Bình thường');
    const aiExplanation = isReorderNeeded
      ? `Tồn kho (${stock}) <= ROP (${rop}). Tốc độ chuẩn d_base=${d_base}/ngày × Thời tiết ${weatherLabel} (W=${w_factor}) × Lễ (H=${h_factor}) => d_adj=${d_adjusted}/ngày. Đề xuất đặt bù +${suggestedQuantity} đơn vị từ DC Biên Hòa (LeadTime=${lt} ngày).`
      : isRiskOfSpoilage
        ? `Cảnh báo ứ đọng: Số ngày bán hết tồn DOS (${dos} ngày) > Hạn lô gần nhất DUE (${earliestBatchDaysLeft} ngày). Tạm dừng đặt mới, ưu tiên giảm giá Quick Markdown để kích cầu.`
        : `Tồn kho an toàn (${stock} > ROP ${rop}), DOS (${dos} ngày) <= DUE (${earliestBatchDaysLeft ?? '—'} ngày). Chưa cần đặt hàng bổ sung.`;

    return {
      productId: Number(productId),
      productName,
      categoryCode,
      currentStock: stock,
      safetyStock: ss,
      maxStockLevel: maxStock,
      leadTimeDays: lt,
      averageDailyDemandBase: d_base,
      weatherFactor: w_factor,
      holidayFactor: h_factor,
      adjustedDailyDemand: d_adjusted,
      reorderPoint: rop,
      daysOfSupply: dos,
      earliestBatchDaysLeft: earliestBatchDaysLeft !== null ? Number(earliestBatchDaysLeft) : null,
      isRiskOfSpoilage,
      spoilageWarningMessage,
      isReorderNeeded,
      suggestedOrderQuantity: suggestedQuantity,
      orderUrgency: stock <= ss ? 'HIGH' : (isReorderNeeded ? 'MEDIUM' : 'LOW'),
      aiExplanation
    };
  }
}

module.exports = RopCalculationService;
