// src/application/use-cases/forecast/CalculateROPForecastUseCase.js
const RopCalculationService = require('../../../domain/services/RopCalculationService');
const WeatherCondition = require('../../../domain/value-objects/WeatherCondition');
const SqlConnection = require('../../../infrastructure/database/sqlConnection');
const ensureSmartSupplySchema = require('../../../infrastructure/database/ensureSmartSupplySchema');
const RealEnvironmentService = require('../../../infrastructure/services/RealEnvironmentService');

/**
 * Use Case: Phân tích Dự báo 7 ngày & Điểm đặt hàng (ROP) từ dữ liệu SQL Server + Thời tiết & Lịch lễ thực tế
 */
class CalculateROPForecastUseCase {
  constructor({ productRepository, saleRepository, batchRepository, storeProfileRepository }) {
    this.productRepository = productRepository;
    this.saleRepository = saleRepository;
    this.batchRepository = batchRepository;
    this.storeProfileRepository = storeProfileRepository;
  }

  async execute({ weather = 'AUTO', isHoliday = 'auto', isPromo = false, storeId = 1, lat = null, lon = null, locationName = '' }) {
    await ensureSmartSupplySchema();
    const isAllStores = String(storeId || '').toUpperCase() === 'ALL';
    const targetStoreId = isAllStores
      ? 'ALL'
      : ((storeId && !isNaN(Number(storeId))) ? Number(storeId) : 1);
    const profileStoreId = isAllStores ? 1 : targetStoreId;

    const [storeProfile, activeStoreCount, enterpriseRows, liveEnv] = await Promise.all([
      this.storeProfileRepository.getProfile(profileStoreId),
      this.storeProfileRepository.getActiveStoreCount
        ? this.storeProfileRepository.getActiveStoreCount()
        : Promise.resolve(null),
      SqlConnection.queryJson(`
        SELECT TOP 1
          enterprise_name AS enterpriseName,
          CAST(has_central_warehouse AS BIT) AS hasCentralWarehouse,
          central_warehouse_name AS centralWarehouseName,
          CAST(manager_po_approval_limit AS FLOAT) AS managerPoApprovalLimit
        FROM dbo.enterprise_config
        WHERE id = 1;
      `).catch(() => []),
      RealEnvironmentService.getLiveEnvironment({
        storeId: profileStoreId,
        lat,
        lon,
        locationName
      }).catch((err) => ({
        success: false,
        source: 'Open-Meteo (Unavailable)',
        locationName: 'Chưa xác định',
        current: null,
        calendar: null,
        dailyForecast: [],
        error: err.message
      }))
    ]);

    const entCfg = enterpriseRows[0] || {
      enterpriseName: 'SmartSupply AI Retail Chain',
      hasCentralWarehouse: true,
      centralWarehouseName: 'Kho trung tâm (DC)',
      managerPoApprovalLimit: 5000000
    };
    const leadTimeDays = storeProfile ? Number(storeProfile.defaultLeadTimeDays || 1) : 1;
    const chainStoreCount = Number(activeStoreCount ?? storeProfile?.chainStoreCount ?? 1);
    const isSingleStore = chainStoreCount <= 1;

    const requestedWeather = String(weather || 'AUTO').toUpperCase().trim();
    const effectiveWeather = ['NORMAL', 'SUNNY', 'RAINY'].includes(requestedWeather)
      ? requestedWeather
      : (liveEnv?.current?.condition || 'NORMAL');
    const effectiveHoliday = (isHoliday === 'auto' || isHoliday === undefined || isHoliday === null)
      ? Boolean(liveEnv?.calendar?.isHoliday)
      : (isHoliday === true || isHoliday === 'true');

    // Lấy toàn bộ sản phẩm, lịch sử bán 14 ngày thực tế tại đúng chi nhánh, tồn lô hiện tại, đơn chờ nhập & điều chuyển
    const salesScopeStoreId = isAllStores ? null : targetStoreId;
    const poStoreFilter = isAllStores ? '1=1' : `ISNULL(po.store_id, 1) = ${targetStoreId}`;
    const trfStoreFilter = isAllStores ? '1=1' : `st.to_store_id = ${targetStoreId}`;
    const incomingPoSql = `
      SELECT poi.product_id AS productId, SUM(ISNULL(poi.approved_quantity, poi.suggested_quantity)) AS qty
      FROM purchase_order_items poi
      INNER JOIN purchase_orders po ON poi.order_id = po.id
      WHERE po.status IN ('DRAFT', 'PENDING', 'APPROVED', 'SUBMITTED', 'SHIPPING')
        AND ${poStoreFilter}
      GROUP BY poi.product_id;
    `;
    const incomingTrfSql = `
      SELECT st.product_id AS productId, SUM(st.transfer_quantity) AS qty
      FROM stock_transfers st
      WHERE st.status IN ('APPROVED', 'IN_TRANSIT')
        AND ${trfStoreFilter}
      GROUP BY st.product_id;
    `;

    // Tính dữ liệu bán 30 ngày để kiểm định sai số thật (Walk-forward validation trên dữ liệu bán thực tế)
    const walkForwardStoreFilter = isAllStores ? '' : `AND ISNULL(sh.store_id, 1) = ${targetStoreId}`;
    const recentSales30Sql = `
      SELECT
        sh.product_id AS productId,
        CONVERT(VARCHAR(10), sh.sale_date, 23) AS dayStr,
        SUM(sh.quantity_sold) AS dailyQty
      FROM dbo.sales_history sh
      WHERE sh.sale_date >= DATEADD(day, -30, CAST(GETDATE() AS DATE))
        ${walkForwardStoreFilter}
      GROUP BY sh.product_id, CONVERT(VARCHAR(10), sh.sale_date, 23)
      ORDER BY sh.product_id ASC, dayStr ASC;
    `;

    const [productsWithStock, salesStatsMap14Days, allBatches, incomingPoRows, incomingTrfRows, sales30Rows] = await Promise.all([
      this.productRepository.findAll(),
      this.saleRepository.getSalesHistoryStatsAllProducts
        ? this.saleRepository.getSalesHistoryStatsAllProducts(14, salesScopeStoreId)
        : (this.saleRepository.getSalesHistoryAllProducts
          ? this.saleRepository.getSalesHistoryAllProducts(14, salesScopeStoreId)
          : Promise.resolve({})),
      this.batchRepository.findAllWithAlerts({ storeId: targetStoreId }),
      SqlConnection.queryJson(incomingPoSql).catch(() => []),
      SqlConnection.queryJson(incomingTrfSql).catch(() => []),
      SqlConnection.queryJson(recentSales30Sql).catch(() => [])
    ]);

    const sales30ByProd = {};
    for (const r of (sales30Rows || [])) {
      const pId = Number(r.productId);
      if (!sales30ByProd[pId]) sales30ByProd[pId] = [];
      sales30ByProd[pId].push(Number(r.dailyQty || 0));
    }

    const incomingPoMap = {};
    for (const r of (incomingPoRows || [])) {
      incomingPoMap[Number(r.productId)] = Number(r.qty || 0);
    }
    const incomingTrfMap = {};
    for (const r of (incomingTrfRows || [])) {
      incomingTrfMap[Number(r.productId)] = Number(r.qty || 0);
    }

    // Chuẩn bị khung 7 ngày tới kết hợp thời tiết Open-Meteo & lịch lễ VN thực tế
    const dailyEnvList = (Array.isArray(liveEnv?.dailyForecast) && liveEnv.dailyForecast.length === 7)
      ? liveEnv.dailyForecast
      : Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i + 1);
          const dowIdx = d.getDay();
          return {
            date: d.toISOString().slice(0, 10),
            dayLabel: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
            dow: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dowIdx],
            weatherCode: null,
            label: effectiveWeather === 'SUNNY' ? 'Nắng' : effectiveWeather === 'RAINY' ? 'Mưa' : 'Không rõ',
            condition: effectiveWeather,
            tempMin: null,
            tempMax: null,
            precipSum: null,
            precipProb: null,
            isWeekend: dowIdx === 0 || dowIdx === 6,
            isPublicHoliday: false,
            holidayName: null,
            isHoliday: effectiveHoliday || (dowIdx === 0 || dowIdx === 6)
          };
        });

    const forecastResults = [];

    for (const item of productsWithStock) {
      const p = item.entity;
      const productBatches = (allBatches || []).filter(b =>
        Number(b.productId) === Number(p.id) &&
        (isAllStores || Number(b.storeId || targetStoreId) === targetStoreId)
      );
      const storeActiveBatches = productBatches
        .filter(b => b.alertColor !== 'EXPIRED' && b.status !== 'EXPIRED' && b.status !== 'DISPOSED' && Number(b.currentQuantity) > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      const currentStock = storeActiveBatches.reduce((sum, b) => sum + Number(b.currentQuantity || 0), 0);

      const rawSalesEntry = salesStatsMap14Days[p.id];
      const salesHistory14Days = Array.isArray(rawSalesEntry)
        ? rawSalesEntry
        : (rawSalesEntry?.dailyQuantities || []);
      const historyDaysCount = Array.isArray(rawSalesEntry)
        ? rawSalesEntry.length
        : Number(rawSalesEntry?.historyDaysCount || 0);
      const salesDataPointsCount = Array.isArray(rawSalesEntry)
        ? rawSalesEntry.length
        : Number(rawSalesEntry?.transactionCount || 0);

      let earliestBatchDaysLeft = null;
      let earliestBatchCode = null;
      if (storeActiveBatches.length > 0) {
        earliestBatchDaysLeft = Number(storeActiveBatches[0].daysLeft);
        earliestBatchCode = storeActiveBatches[0].batchCode;
      }

      const ropAnalysis = RopCalculationService.calculateROP({
        productId: p.id,
        productName: p.name,
        categoryCode: p.categoryName || 'FMCG',
        currentStock,
        minStockLevel: p.minStockLevel || 15,
        maxStockLevel: p.maxStockLevel || 150,
        leadTimeDays,
        salesHistory14Days,
        historyDaysCount,
        weather: effectiveWeather,
        isHoliday: effectiveHoliday,
        earliestBatchDaysLeft
      });

      const dBase = ropAnalysis.averageDailyDemandBase;
      const wasStockout = currentStock === 0 && historyDaysCount > 0;
      const stockoutCompFactor = wasStockout ? 1.15 : 1;
      const promoMultiplier = isPromo ? 1.15 : 1;

      // Độ lệch chuẩn thực tế trên chuỗi ngày có bán (nếu đủ dữ liệu) để tính khoảng tin cậy thực tế
      const actualDailyArr = sales30ByProd[Number(p.id)] || salesHistory14Days;
      let stdRatio = 0.2;
      if (actualDailyArr.length >= 3) {
        const mean = actualDailyArr.reduce((s, v) => s + v, 0) / actualDailyArr.length;
        if (mean > 0) {
          const variance = actualDailyArr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / actualDailyArr.length;
          stdRatio = Math.min(0.45, Math.max(0.1, Math.sqrt(variance) / mean));
        }
      }

      // Tính dự báo từng ngày thực tế (7 ngày tới theo thời tiết & ngày lễ từng ngày ngoài đời thực)
      let predictedSales7d = 0;
      const dailyBreakdown = dailyEnvList.map((dayEnv) => {
        const wCondObj = new WeatherCondition(dayEnv.condition || effectiveWeather);
        const dayW = wCondObj.getDemandFactor(p.categoryName || 'FMCG');
        const dayH = dayEnv.isHoliday ? 1.30 : 1.00;
        const dayPred = dBase > 0
          ? Math.round(dBase * dayW * dayH * promoMultiplier * stockoutCompFactor)
          : 0;
        const dayLow = dayPred > 0 ? Math.max(0, Math.round(dayPred * (1 - stdRatio))) : 0;
        const dayHigh = dayPred > 0 ? Math.round(dayPred * (1 + stdRatio)) : 0;
        predictedSales7d += dayPred;
        return {
          ...dayEnv,
          weatherFactor: dayW,
          holidayFactor: dayH,
          predicted: dayPred,
          lower: dayLow,
          upper: dayHigh
        };
      });

      const lowerBound = predictedSales7d > 0 ? dailyBreakdown.reduce((s, d) => s + d.lower, 0) : 0;
      const upperBound = predictedSales7d > 0 ? dailyBreakdown.reduce((s, d) => s + d.upper, 0) : 0;

      // Tính số lượng có nguy cơ quá hạn thực tế theo từng lô FEFO & tốc độ tiêu thụ thật
      let spoilageRiskQty = 0;
      if (storeActiveBatches.length > 0) {
        const dailyVel = ropAnalysis.adjustedDailyDemand;
        let consumed = 0;
        for (const b of storeActiveBatches) {
          const bQty = Number(b.currentQuantity || 0);
          const dLeft = Math.max(0, Number(b.daysLeft || 0));
          if (dailyVel <= 0) {
            if (dLeft <= 7) spoilageRiskQty += bQty;
          } else {
            const maxSellableByExp = Math.floor(dLeft * dailyVel);
            const remainingRoom = Math.max(0, maxSellableByExp - consumed);
            const willExpire = Math.max(0, bQty - remainingRoom);
            spoilageRiskQty += willExpire;
            consumed += Math.min(bQty, remainingRoom);
          }
        }
      }

      let dataQualityStatus = 'SUFFICIENT';
      let isDataSufficient = true;
      let dataQualityWarning = null;
      let confidenceLevel = 'HIGH';
      let maeMetric = null;
      const modelName = 'ROP-Live-Sales-Weather';

      const scopeLabel = isAllStores ? 'Toàn chuỗi' : `Chi nhánh #${targetStoreId}`;
      if (historyDaysCount === 0) {
        dataQualityStatus = 'NO_HISTORY';
        isDataSufficient = false;
        confidenceLevel = 'INSUFFICIENT_DATA';
        dataQualityWarning = `Chưa có giao dịch bán 14 ngày gần nhất tại ${scopeLabel}.`;
      } else if (historyDaysCount < 7) {
        dataQualityStatus = 'LOW_HISTORY';
        isDataSufficient = false;
        confidenceLevel = 'LOW';
        dataQualityWarning = `Mới có ${historyDaysCount}/7 ngày bán gần nhất tại ${scopeLabel} — chưa đủ để đánh giá MAE.`;
      } else {
        confidenceLevel = historyDaysCount >= 10 ? 'HIGH' : 'MEDIUM';
        // Walk-forward MAE thực tế từ lịch sử bán thật của chính sản phẩm trong 30 ngày (nửa đầu dự báo cho nửa sau)
        if (actualDailyArr.length >= 7) {
          const split = Math.floor(actualDailyArr.length / 2);
          const train = actualDailyArr.slice(0, split);
          const test = actualDailyArr.slice(split);
          const trainMean = train.reduce((s, v) => s + v, 0) / Math.max(1, train.length);
          const maeVal = test.reduce((s, v) => s + Math.abs(v - trainMean), 0) / Math.max(1, test.length);
          maeMetric = Number(maeVal.toFixed(2));
        }
      }

      // So sánh 3 phương án & Quy cách đóng gói (packSize)
      const packSize = Math.max(1, Number(p.packSize || 1));
      const incomingOrderQty = Number(incomingPoMap[Number(p.id)] || 0);
      const incomingTransferQty = Number(incomingTrfMap[Number(p.id)] || 0);
      const incomingQuantity = incomingOrderQty + incomingTransferQty;
      const netAvailableStock = currentStock + incomingQuantity;
      const rawOrderQty = Math.max(ropAnalysis.suggestedOrderQuantity || 0, Math.max(0, predictedSales7d - netAvailableStock));
      const rawNetOrder = Math.max(0, rawOrderQty - incomingQuantity);
      const orderQty = rawNetOrder > 0 ? Math.ceil(rawNetOrder / packSize) * packSize : 0;
      const poCost = Math.round(orderQty * Number(p.costPrice || 0));
      const transferQty = isSingleStore ? 0 : orderQty;
      const hasCentralDc = Boolean(entCfg.hasCentralWarehouse);
      const dcLeadHours = Math.max(12, leadTimeDays * 24);
      const supplierLeadHours = Math.max(24, (leadTimeDays + 1) * 24);

      let recommendedOption = 'HOLD_AND_MONITOR';
      if (ropAnalysis.isRiskOfSpoilage || spoilageRiskQty > 0) {
        recommendedOption = 'HOLD_AND_MARKDOWN';
      } else if (netAvailableStock <= ropAnalysis.reorderPoint && !isSingleStore && orderQty > 0 && orderQty <= 20) {
        recommendedOption = 'INTER_STORE_TRANSFER';
      } else if (netAvailableStock <= ropAnalysis.reorderPoint && orderQty > 0) {
        recommendedOption = hasCentralDc ? 'CENTRAL_WAREHOUSE_PO' : 'ORDER_PO_FROM_SUPPLIER';
      }

      ropAnalysis.packSize = packSize;
      ropAnalysis.wasStockout = wasStockout;
      ropAnalysis.isPromo = Boolean(isPromo);
      ropAnalysis.incomingOrderQty = incomingOrderQty;
      ropAnalysis.incomingTransferQty = incomingTransferQty;
      ropAnalysis.incomingQuantity = incomingQuantity;
      ropAnalysis.netAvailableStock = netAvailableStock;
      ropAnalysis.netSuggestedOrderQuantity = orderQty;
      ropAnalysis.costPrice = p.costPrice;
      ropAnalysis.productSku = p.sku;
      ropAnalysis.unit = p.unit || 'đơn vị';
      ropAnalysis.categoryName = p.categoryName || 'FMCG';
      ropAnalysis.earliestBatchCode = earliestBatchCode;
      ropAnalysis.estimatedOrderCost = poCost;
      ropAnalysis.storeId = targetStoreId;
      ropAnalysis.dailyDemand = ropAnalysis.averageDailyDemandBase;
      ropAnalysis.dAdjusted = ropAnalysis.adjustedDailyDemand;
      ropAnalysis.ropThreshold = ropAnalysis.reorderPoint;
      ropAnalysis.availableStock = ropAnalysis.currentStock;
      ropAnalysis.predictedSales7d = predictedSales7d;
      ropAnalysis.lowerBound = lowerBound;
      ropAnalysis.upperBound = upperBound;
      ropAnalysis.dailyBreakdown = dailyBreakdown;
      ropAnalysis.spoilageRiskQty = spoilageRiskQty;
      ropAnalysis.maeMetric = maeMetric;
      ropAnalysis.modelName = modelName;
      ropAnalysis.confidenceLevel = confidenceLevel;
      ropAnalysis.historyDaysCount = historyDaysCount;
      ropAnalysis.salesDataPointsCount = salesDataPointsCount;
      ropAnalysis.dataQualityStatus = dataQualityStatus;
      ropAnalysis.isDataSufficient = isDataSufficient;
      ropAnalysis.dataQualityWarning = dataQualityWarning;
      ropAnalysis.aiDecisionComparison = {
        recommendedOption,
        optionA_OrderPO: {
          code: 'ORDER_PO_FROM_SUPPLIER',
          label: 'Phương án A: Nhập mới từ Nhà cung cấp',
          suggestedQty: orderQty,
          estimatedCost: poCost,
          leadTimeHours: supplierLeadHours,
          note: `Theo quy cách ${packSize} ${p.unit || 'ĐV'}/kiện, giao từ nhà cung cấp`
        },
        ...(isSingleStore
          ? {
              optionB_Transfer: {
                code: 'INTER_STORE_TRANSFER',
                available: false,
                label: 'Phương án B: Điều chuyển chi nhánh (Không khả dụng)',
                suggestedQty: 0,
                estimatedCost: 0,
                leadTimeHours: 0,
                note: 'Đang chạy chế độ 1 cửa hàng độc lập.'
              }
            }
          : {
              optionB_Transfer: {
                code: 'INTER_STORE_TRANSFER',
                available: true,
                label: 'Phương án B: Điều chuyển từ chi nhánh dư tồn',
                suggestedQty: transferQty,
                estimatedCost: 0,
                leadTimeHours: 2,
                note: 'Điều phối tồn kho sẵn có trong chuỗi (không tốn ngân sách mua mới)'
              }
            }),
        optionC_CentralWarehouse: {
          code: 'CENTRAL_WAREHOUSE_PO',
          available: hasCentralDc,
          label: `Phương án C: Cấp hàng từ ${entCfg.centralWarehouseName || 'Kho trung tâm'}`,
          suggestedQty: hasCentralDc ? orderQty : 0,
          estimatedCost: hasCentralDc ? poCost : 0,
          leadTimeHours: hasCentralDc ? dcLeadHours : 0,
          note: hasCentralDc ? 'Đảm bảo tuổi thọ nhập >= 70%, giao theo lịch kho tổng' : 'Doanh nghiệp đang tắt Kho trung tâm'
        },
        optionC_Hold: {
          code: 'HOLD_AND_MARKDOWN',
          label: 'Phương án Dừng nhập & Giảm giá xả hàng',
          suggestedQty: 0,
          estimatedCost: 0,
          spoilageRiskSaved: Math.round(spoilageRiskQty * Number(p.costPrice || 0)),
          note: 'Tránh tồn dư vượt hạn sử dụng'
        }
      };

      forecastResults.push(ropAnalysis);
    }

    const itemsNeedReorder = forecastResults.filter(r => r.isReorderNeeded);
    const itemsAtRiskOfSpoilage = forecastResults.filter(r => r.isRiskOfSpoilage || r.spoilageRiskQty > 0);
    const sufficientMaeItems = forecastResults.filter(r => r.isDataSufficient && r.maeMetric !== null);
    const sufficientDataCount = forecastResults.filter(r => r.dataQualityStatus === 'SUFFICIENT').length;
    const lowHistoryCount = forecastResults.filter(r => r.dataQualityStatus === 'LOW_HISTORY').length;
    const noHistoryCount = forecastResults.filter(r => r.dataQualityStatus === 'NO_HISTORY').length;
    const insufficientDataCount = lowHistoryCount + noHistoryCount;

    const totalEstimatedBudget = itemsNeedReorder.reduce((sum, r) => sum + r.estimatedOrderCost, 0);
    const avgMae = sufficientMaeItems.length > 0
      ? Number((sufficientMaeItems.reduce((s, r) => s + Number(r.maeMetric), 0) / sufficientMaeItems.length).toFixed(2))
      : null;

    return {
      success: true,
      environment: liveEnv,
      parameters: {
        weather: effectiveWeather,
        isHoliday: Boolean(effectiveHoliday),
        isPromo: Boolean(isPromo),
        leadTimeDays,
        storeId: targetStoreId,
        chainStoreCount,
        isSingleStore,
        enterpriseConfig: entCfg,
        modelName: 'ROP-Live-Sales-Weather',
        averageMaeMetric: avgMae,
        hasReliableModelMetrics: sufficientMaeItems.length > 0,
        analysisDate: new Date().toISOString()
      },
      summary: {
        totalProductsAnalyzed: forecastResults.length,
        reorderCount: itemsNeedReorder.length,
        needReorderCount: itemsNeedReorder.length,
        spoilageRiskCount: itemsAtRiskOfSpoilage.length,
        sufficientDataCount,
        lowHistoryCount,
        noHistoryCount,
        insufficientDataCount,
        hasReliableModelMetrics: sufficientMaeItems.length > 0,
        isSingleStore,
        chainStoreCount,
        enterpriseConfig: entCfg,
        totalEstimatedBudget,
        averageMaeMetric: avgMae,
        modelName: 'ROP-Live-Sales-Weather'
      },
      itemsNeedReorder,
      itemsAtRiskOfSpoilage,
      allForecasts: forecastResults,
      data: forecastResults
    };
  }
}

module.exports = CalculateROPForecastUseCase;
