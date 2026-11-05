// src/application/use-cases/forecast/CalculateROPForecastUseCase.js
const RopCalculationService = require('../../../domain/services/RopCalculationService');

/**
 * Use Case: Phân tích Dự báo Điểm Đặt Hàng Bổ Sung (ROP) & Cảnh báo Nguy cơ Ứ đọng (Rule 8)
 * Tích hợp đa yếu tố: Tốc độ bán thực tế 14 ngày + Thời tiết (W_factor) + Cờ ngày lễ (H_factor)
 * So sánh Ngày tồn kho (DOS) với Hạn dùng ngắn nhất (DUE)
 */
class CalculateROPForecastUseCase {
  constructor({ productRepository, saleRepository, batchRepository, storeProfileRepository }) {
    this.productRepository = productRepository;
    this.saleRepository = saleRepository;
    this.batchRepository = batchRepository;
    this.storeProfileRepository = storeProfileRepository;
  }

  async execute({ weather = 'NORMAL', isHoliday = false }) {
    // 1. Lấy Lead Time chuẩn từ StoreProfile (mặc định 1 ngày)
    const storeProfile = await this.storeProfileRepository.getProfile();
    const leadTimeDays = storeProfile ? Number(storeProfile.defaultLeadTimeDays || 1) : 1;

    // 2. Lấy toàn bộ danh sách sản phẩm, lịch sử bán 14 ngày và danh sách lô khả dụng
    const [productsWithStock, salesMap14Days, allBatches] = await Promise.all([
      this.productRepository.findAll(),
      this.saleRepository.getSalesHistoryAllProducts
        ? this.saleRepository.getSalesHistoryAllProducts(14)
        : Promise.resolve({}),
      this.batchRepository.findAllWithAlerts()
    ]);

    const forecastResults = [];

    // 3. Phân tích từng sản phẩm
    for (const item of productsWithStock) {
      const p = item.entity;
      const currentStock = Number(item.totalStock || 0);

      // Lấy lịch sử số lượng bán 14 ngày gần nhất
      const salesHistory14Days = salesMap14Days[p.id] || [];

      // Tìm lô có hạn dùng gần nhất còn tồn kho khả dụng (DUE)
      const activeBatches = allBatches
        .filter(b => Number(b.productId) === Number(p.id) && b.alertColor !== 'EXPIRED' && b.status !== 'EXPIRED' && b.status !== 'DISPOSED' && Number(b.currentQuantity) > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      let earliestBatchDaysLeft = null;
      let earliestBatchCode = null;
      if (activeBatches.length > 0) {
        earliestBatchDaysLeft = Number(activeBatches[0].daysLeft);
        earliestBatchCode = activeBatches[0].batchCode;
      }

      // Gọi Domain Service tính toán ROP và đánh giá DOS > DUE
      const ropAnalysis = RopCalculationService.calculateROP({
        productId: p.id,
        productName: p.name,
        categoryCode: p.categoryName || 'FMCG',
        currentStock,
        minStockLevel: p.minStockLevel || 15,
        maxStockLevel: p.maxStockLevel || 150,
        leadTimeDays,
        salesHistory14Days,
        weather,
        isHoliday: Boolean(isHoliday),
        earliestBatchDaysLeft
      });

      // Bổ sung thông tin giá vốn, đơn vị tính và mã lô gần nhất
      ropAnalysis.costPrice = p.costPrice;
      ropAnalysis.productSku = p.sku;
      ropAnalysis.unit = p.unit || 'đơn vị';
      ropAnalysis.categoryName = p.categoryName || 'FMCG';
      ropAnalysis.earliestBatchCode = earliestBatchCode;
      ropAnalysis.estimatedOrderCost = ropAnalysis.suggestedOrderQuantity * p.costPrice;

      forecastResults.push(ropAnalysis);
    }

    // 4. Lọc các danh sách trọng tâm
    const itemsNeedReorder = forecastResults.filter(r => r.isReorderNeeded);
    const itemsAtRiskOfSpoilage = forecastResults.filter(r => r.isRiskOfSpoilage);

    const totalEstimatedBudget = itemsNeedReorder.reduce((sum, r) => sum + r.estimatedOrderCost, 0);

    return {
      success: true,
      parameters: {
        weather,
        isHoliday: Boolean(isHoliday),
        leadTimeDays,
        analysisDate: new Date().toISOString()
      },
      summary: {
        totalProductsAnalyzed: forecastResults.length,
        reorderCount: itemsNeedReorder.length,
        needReorderCount: itemsNeedReorder.length,
        spoilageRiskCount: itemsAtRiskOfSpoilage.length,
        totalEstimatedBudget
      },
      itemsNeedReorder,
      itemsAtRiskOfSpoilage,
      allForecasts: forecastResults,
      data: forecastResults
    };
  }
}

module.exports = CalculateROPForecastUseCase;
