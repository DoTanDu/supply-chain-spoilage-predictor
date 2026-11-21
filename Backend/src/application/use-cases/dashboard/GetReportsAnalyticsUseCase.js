// src/application/use-cases/dashboard/GetReportsAnalyticsUseCase.js
const SqlConnection = require('../../../infrastructure/database/sqlConnection');

/**
 * Use Case: Tổng hợp Báo cáo & Phân tích 5 Nhóm Chỉ số Hiệu quả Chuỗi Cung ứng (Mục 08 SmartSupply AI)
 */
class GetReportsAnalyticsUseCase {
  constructor({ storeProfileRepository }) {
    this.storeProfileRepository = storeProfileRepository;
  }

  async execute({ storeId = 'ALL', days = 14 } = {}) {
    const isSpecificStore = storeId && String(storeId).toUpperCase() !== 'ALL';
    const numericStoreId = isSpecificStore ? Number(storeId) : null;
    const safeDays = Math.max(7, Math.min(90, Number(days) || 14));

    const batchScope = isSpecificStore ? `ISNULL(b.store_id, 1) = ${numericStoreId}` : '1=1';
    const salesScope = isSpecificStore ? `ISNULL(sh.store_id, 1) = ${numericStoreId}` : '1=1';
    const poScope = isSpecificStore ? `ISNULL(po.store_id, 1) = ${numericStoreId}` : '1=1';
    const trfScope = isSpecificStore ? `(st.from_store_id = ${numericStoreId} OR st.to_store_id = ${numericStoreId})` : '1=1';
    const aiScope = isSpecificStore ? `af.store_id = ${numericStoreId}` : '1=1';

    const [
      salesSummaryRows,
      spoilageSummaryRows,
      spoilageByReasonRows,
      spoilageByProductRows,
      dailyTrendRows,
      batchHealthRows,
      poSummaryRows,
      transferSummaryRows,
      aiCoverageRows,
      storeComparisonRows
    ] = await Promise.all([
      SqlConnection.queryJson(`
        SELECT
          ISNULL(SUM(sh.total_amount), 0) AS totalRevenue,
          ISNULL(SUM(sh.quantity_sold), 0) AS totalUnitsSold,
          COUNT(DISTINCT sh.transaction_code) AS totalTransactions
        FROM dbo.sales_history sh
        WHERE ${salesScope}
          AND sh.sale_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE));
      `),
      SqlConnection.queryJson(`
        SELECT
          COUNT(*) AS totalRecords,
          SUM(CASE WHEN sr.approved_by IS NOT NULL THEN 1 ELSE 0 END) AS approvedRecords,
          SUM(CASE WHEN sr.approved_by IS NULL THEN 1 ELSE 0 END) AS pendingRecords,
          ISNULL(SUM(sr.quantity_disposed), 0) AS totalDisposedUnits,
          ISNULL(SUM(sr.cost_loss), 0) AS totalCostLoss,
          ISNULL(SUM(CASE WHEN sr.approved_by IS NOT NULL THEN sr.cost_loss ELSE 0 END), 0) AS approvedCostLoss
        FROM dbo.spoilage_records sr
        INNER JOIN dbo.batches b ON sr.batch_id = b.id
        WHERE ${batchScope}
          AND sr.disposed_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE));
      `),
      SqlConnection.queryJson(`
        SELECT
          ISNULL(sr.reason, N'EXP_SPOILAGE') AS reason,
          COUNT(*) AS recordCount,
          ISNULL(SUM(sr.quantity_disposed), 0) AS totalUnits,
          ISNULL(SUM(sr.cost_loss), 0) AS totalLoss
        FROM dbo.spoilage_records sr
        INNER JOIN dbo.batches b ON sr.batch_id = b.id
        WHERE ${batchScope}
          AND sr.approved_by IS NOT NULL
          AND sr.disposed_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))
        GROUP BY ISNULL(sr.reason, N'EXP_SPOILAGE')
        ORDER BY SUM(sr.cost_loss) DESC;
      `),
      SqlConnection.queryJson(`
        SELECT TOP 8
          p.id AS productId,
          p.sku,
          p.name AS productName,
          c.name AS categoryName,
          ISNULL(SUM(sr.quantity_disposed), 0) AS disposedUnits,
          ISNULL(SUM(sr.cost_loss), 0) AS costLoss
        FROM dbo.spoilage_records sr
        INNER JOIN dbo.batches b ON sr.batch_id = b.id
        INNER JOIN dbo.products p ON b.product_id = p.id
        LEFT JOIN dbo.categories c ON p.category_id = c.id
        WHERE ${batchScope}
          AND sr.approved_by IS NOT NULL
          AND sr.disposed_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))
        GROUP BY p.id, p.sku, p.name, c.name
        ORDER BY SUM(sr.cost_loss) DESC;
      `),
      SqlConnection.queryJson(`
        SELECT
          d.dayStr,
          ISNULL(s.revenue, 0) AS salesRevenue,
          ISNULL(s.unitsSold, 0) AS unitsSold,
          ISNULL(sp.costLoss, 0) AS spoilageCost,
          ISNULL(sp.disposedUnits, 0) AS disposedUnits
        FROM (
          SELECT DISTINCT CONVERT(VARCHAR(10), sale_date, 23) AS dayStr
          FROM dbo.sales_history
          WHERE sale_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))
          UNION
          SELECT DISTINCT CONVERT(VARCHAR(10), disposed_date, 23) AS dayStr
          FROM dbo.spoilage_records
          WHERE approved_by IS NOT NULL
            AND disposed_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))
        ) d
        LEFT JOIN (
          SELECT CONVERT(VARCHAR(10), sh.sale_date, 23) AS dayStr, SUM(sh.total_amount) AS revenue, SUM(sh.quantity_sold) AS unitsSold
          FROM dbo.sales_history sh
          WHERE ${salesScope}
          GROUP BY CONVERT(VARCHAR(10), sh.sale_date, 23)
        ) s ON d.dayStr = s.dayStr
        LEFT JOIN (
          SELECT CONVERT(VARCHAR(10), sr.disposed_date, 23) AS dayStr, SUM(sr.cost_loss) AS costLoss, SUM(sr.quantity_disposed) AS disposedUnits
          FROM dbo.spoilage_records sr
          INNER JOIN dbo.batches b ON sr.batch_id = b.id
          WHERE ${batchScope}
            AND sr.approved_by IS NOT NULL
          GROUP BY CONVERT(VARCHAR(10), sr.disposed_date, 23)
        ) sp ON d.dayStr = sp.dayStr
        ORDER BY d.dayStr ASC;
      `),
      SqlConnection.queryJson(`
        SELECT
          COUNT(DISTINCT p.id) AS totalSkus,
          ISNULL(SUM(CASE WHEN b.current_quantity > 0 AND b.status IN ('ACTIVE', 'WARNING') THEN b.current_quantity ELSE 0 END), 0) AS availableUnits,
          ISNULL(SUM(CASE WHEN b.current_quantity > 0 AND b.status IN ('ACTIVE', 'WARNING') THEN b.current_quantity * b.import_price ELSE 0 END), 0) AS inventoryCost,
          ISNULL(SUM(CASE WHEN b.current_quantity > 0 AND DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date) BETWEEN 1 AND 7 THEN b.current_quantity * b.import_price ELSE 0 END), 0) AS nearExpiryRiskCost,
          ISNULL((
            SELECT SUM(sh.quantity_sold * b2.import_price)
            FROM dbo.sales_history sh
            INNER JOIN dbo.batches b2 ON sh.batch_id = b2.id
            WHERE ${isSpecificStore ? `ISNULL(b2.store_id, 1) = ${numericStoreId}` : '1=1'}
              AND b2.discount_percent > 0
              AND sh.sale_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))
          ), 0) AS markdownRescuedValue,
          ISNULL(SUM(CASE WHEN b.current_quantity > 0 AND DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date) <= 0 THEN 1 ELSE 0 END), 0) AS expiredBatchCount
        FROM dbo.products p
        LEFT JOIN dbo.batches b ON p.id = b.product_id AND (${batchScope})
        WHERE p.is_active = 1;
      `),
      SqlConnection.queryJson(`
        SELECT
          COUNT(*) AS totalOrders,
          SUM(CASE WHEN po.status IN ('DRAFT', 'PENDING') THEN 1 ELSE 0 END) AS draftCount,
          SUM(CASE WHEN po.status = 'APPROVED' THEN 1 ELSE 0 END) AS approvedCount,
          SUM(CASE WHEN po.status IN ('SUBMITTED', 'SHIPPING') THEN 1 ELSE 0 END) AS submittedCount,
          SUM(CASE WHEN po.status IN ('DELIVERED', 'COMPLETED', 'RECEIVED') THEN 1 ELSE 0 END) AS deliveredCount,
          SUM(CASE WHEN po.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledCount,
          ISNULL(SUM(CASE WHEN po.status <> 'CANCELLED' THEN po.total_estimated_cost ELSE 0 END), 0) AS totalBudget,
          AVG(CAST(DATEDIFF(hour, po.created_at, ISNULL(po.updated_at, po.created_at)) AS FLOAT) / 24.0) AS avgProcessingDays
        FROM dbo.purchase_orders po
        WHERE ${poScope}
          AND po.created_at >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE));
      `),
      SqlConnection.queryJson(`
        SELECT
          COUNT(*) AS totalTransfers,
          SUM(CASE WHEN st.status IN ('PROPOSED', 'PENDING') THEN 1 ELSE 0 END) AS pendingCount,
          SUM(CASE WHEN st.status IN ('APPROVED', 'IN_TRANSIT') THEN 1 ELSE 0 END) AS activeCount,
          SUM(CASE WHEN st.status = 'RECEIVED' THEN 1 ELSE 0 END) AS receivedCount,
          SUM(CASE WHEN st.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledCount,
          ISNULL(SUM(CASE WHEN st.status = 'RECEIVED' THEN st.transfer_quantity ELSE 0 END), 0) AS receivedUnits,
          ISNULL(SUM(CASE WHEN st.status IN ('APPROVED', 'IN_TRANSIT', 'RECEIVED') THEN st.transfer_quantity * ISNULL(b.import_price, ISNULL(p.cost_price, 0)) ELSE 0 END), 0) AS savedValue,
          ISNULL(SUM(CASE WHEN st.status IN ('APPROVED', 'IN_TRANSIT', 'RECEIVED') THEN st.shipping_cost ELSE 0 END), 0) AS totalShippingCost
        FROM dbo.stock_transfers st
        LEFT JOIN dbo.batches b ON st.source_batch_id = b.id
        LEFT JOIN dbo.products p ON st.product_id = p.id
        WHERE ${trfScope}
          AND st.created_at >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE));
      `),
      SqlConnection.queryJson(`
        SELECT
          COUNT(DISTINCT CONCAT(af.store_id, '_', af.product_id)) AS forecastPairs,
          AVG(CASE WHEN af.model_name <> N'LightGBM-HistGBT-v2.1' THEN af.mae_metric ELSE NULL END) AS avgMae,
          MAX(CASE WHEN af.model_name <> N'LightGBM-HistGBT-v2.1' THEN af.model_name ELSE NULL END) AS modelName,
          (
            SELECT COUNT(*) FROM (
              SELECT sh.store_id, sh.product_id
              FROM dbo.sales_history sh
              WHERE ${salesScope}
                AND sh.sale_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))
              GROUP BY sh.store_id, sh.product_id
              HAVING COUNT(DISTINCT CAST(sh.sale_date AS DATE)) >= 7
            ) suf
          ) AS sufficientHistoryPairs
        FROM dbo.ai_forecasts af
        WHERE ${aiScope};
      `),
      SqlConnection.queryJson(`
        SELECT
          sp.id AS storeId,
          sp.store_code AS storeCode,
          sp.store_name AS storeName,
          sp.status,
          sp.default_lead_time_days AS leadTimeDays,
          ISNULL((SELECT SUM(sh.total_amount) FROM dbo.sales_history sh WHERE ISNULL(sh.store_id, 1) = sp.id AND sh.sale_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))), 0) AS salesRevenue,
          ISNULL((SELECT SUM(sr.cost_loss) FROM dbo.spoilage_records sr INNER JOIN dbo.batches b ON sr.batch_id = b.id WHERE ISNULL(b.store_id, 1) = sp.id AND sr.approved_by IS NOT NULL AND sr.disposed_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))), 0) AS spoilageLoss,
          ISNULL((SELECT SUM(sr.quantity_disposed) FROM dbo.spoilage_records sr INNER JOIN dbo.batches b ON sr.batch_id = b.id WHERE ISNULL(b.store_id, 1) = sp.id AND sr.approved_by IS NOT NULL AND sr.disposed_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))), 0) AS disposedUnits,
          ISNULL((SELECT SUM(b.current_quantity * b.import_price) FROM dbo.batches b WHERE ISNULL(b.store_id, 1) = sp.id AND b.current_quantity > 0 AND b.status IN ('ACTIVE', 'WARNING')), 0) AS inventoryCost,
          ISNULL((SELECT SUM(sh.quantity_sold * b.import_price) FROM dbo.sales_history sh INNER JOIN dbo.batches b ON sh.batch_id = b.id WHERE ISNULL(b.store_id, 1) = sp.id AND b.discount_percent > 0 AND sh.sale_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))), 0) AS markdownRescued,
          ISNULL((SELECT SUM(st.transfer_quantity * ISNULL(b.import_price, ISNULL(p.cost_price, 0)) - st.shipping_cost) FROM dbo.stock_transfers st LEFT JOIN dbo.batches b ON st.source_batch_id = b.id LEFT JOIN dbo.products p ON st.product_id = p.id WHERE st.from_store_id = sp.id AND st.status IN ('APPROVED', 'IN_TRANSIT', 'RECEIVED') AND st.created_at >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))), 0) AS transferNetSaved,
          ISNULL((SELECT COUNT(*) FROM dbo.purchase_orders po WHERE ISNULL(po.store_id, 1) = sp.id AND po.status <> 'CANCELLED' AND po.created_at >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))), 0) AS poCount
        FROM dbo.store_profile sp
        ${isSpecificStore ? `WHERE sp.id = ${numericStoreId}` : ''}
        ORDER BY sp.id ASC;
      `)
    ]);

    const sales = salesSummaryRows[0] || {};
    const spoil = spoilageSummaryRows[0] || {};
    const batch = batchHealthRows[0] || {};
    const po = poSummaryRows[0] || {};
    const trf = transferSummaryRows[0] || {};
    const ai = aiCoverageRows[0] || {};

    const totalRevenue = Number(sales.totalRevenue || 0);
    const totalCostLoss = Number(spoil.totalCostLoss || 0);
    const approvedCostLoss = Number(spoil.approvedCostLoss || 0);
    const denom = totalRevenue + approvedCostLoss;
    const spoilageRatePercent = denom > 0 ? Number(((approvedCostLoss / denom) * 100).toFixed(2)) : 0;

    const savedTransferVal = Number(trf.savedValue || 0);
    const shippingCost = Number(trf.totalShippingCost || 0);
    const transferNetBenefit = savedTransferVal - shippingCost;
    const markdownRescuedValue = Number(batch.markdownRescuedValue || 0);
    const totalRescuedValue = markdownRescuedValue + savedTransferVal;
    const rescueDenom = totalRescuedValue + approvedCostLoss;
    const rescueRatePercent = rescueDenom > 0 ? Number(((totalRescuedValue / rescueDenom) * 100).toFixed(1)) : 0;

    // Đếm SKU dưới ROP (stockout risk) từ bảng products + batches hiện tại
    const stockoutCheckRows = await SqlConnection.queryJson(`
      SELECT
        p.id,
        p.min_stock_level AS minStockLevel,
        ISNULL(SUM(CASE WHEN b.current_quantity > 0 AND b.status IN ('ACTIVE', 'WARNING') THEN b.current_quantity ELSE 0 END), 0) AS curStock
      FROM dbo.products p
      LEFT JOIN dbo.batches b ON p.id = b.product_id AND (${batchScope})
      WHERE p.is_active = 1
      GROUP BY p.id, p.min_stock_level;
    `);
    const totalActiveSkus = stockoutCheckRows.length;
    const lowStockSkus = stockoutCheckRows.filter(r => Number(r.curStock || 0) <= Number(r.minStockLevel || 15)).length;
    const zeroStockSkus = stockoutCheckRows.filter(r => Number(r.curStock || 0) === 0).length;
    const stockoutRiskRatePercent = totalActiveSkus > 0 ? Number(((lowStockSkus / totalActiveSkus) * 100).toFixed(1)) : 0;
    const actualStockoutRatePercent = totalActiveSkus > 0 ? Number(((zeroStockSkus / totalActiveSkus) * 100).toFixed(1)) : 0;

    const totalOrders = Number(po.totalOrders || 0);
    const deliveredOrders = Number(po.deliveredCount || 0);
    const activeNonCancelOrders = Math.max(1, totalOrders - Number(po.cancelledCount || 0));
    const poCompletionRatePercent = totalOrders > 0 ? Number(((deliveredOrders / activeNonCancelOrders) * 100).toFixed(1)) : 0;

    const sufficientPairs = Number(ai.sufficientHistoryPairs || 0);
    let realMae = ai.avgMae !== null && ai.avgMae !== undefined ? Number(Number(ai.avgMae).toFixed(2)) : null;
    let realRmse = null;
    let realMape = null;
    let realConf = null;

    if (sufficientPairs > 0) {
      const wfRows = await SqlConnection.queryJson(`
        SELECT
          ISNULL(sh.store_id, 1) AS storeId,
          sh.product_id AS productId,
          CONVERT(VARCHAR(10), sh.sale_date, 23) AS dayStr,
          SUM(sh.quantity_sold) AS dailyQty
        FROM dbo.sales_history sh
        WHERE ${salesScope}
          AND sh.sale_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))
        GROUP BY ISNULL(sh.store_id, 1), sh.product_id, CONVERT(VARCHAR(10), sh.sale_date, 23)
        ORDER BY storeId ASC, productId ASC, dayStr ASC;
      `).catch(() => []);

      const grouped = new Map();
      for (const r of (wfRows || [])) {
        const key = `${r.storeId}_${r.productId}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(Number(r.dailyQty || 0));
      }
      const absErrs = [];
      const sqErrs = [];
      const pctErrs = [];
      for (const arr of grouped.values()) {
        if (arr.length < 7) continue;
        const split = Math.floor(arr.length / 2);
        const trainMean = arr.slice(0, split).reduce((s, v) => s + v, 0) / Math.max(1, split);
        for (const actual of arr.slice(split)) {
          const e = Math.abs(actual - trainMean);
          absErrs.push(e);
          sqErrs.push(e * e);
          if (actual > 0) pctErrs.push((e / actual) * 100);
        }
      }
      if (absErrs.length > 0) {
        realMae = Number((absErrs.reduce((s, v) => s + v, 0) / absErrs.length).toFixed(2));
        realRmse = Number(Math.sqrt(sqErrs.reduce((s, v) => s + v, 0) / sqErrs.length).toFixed(2));
        if (pctErrs.length > 0) {
          realMape = Number((pctErrs.reduce((s, v) => s + v, 0) / pctErrs.length).toFixed(2));
          realConf = Number(Math.max(0, Math.min(1, 1 - realMape / 100)).toFixed(3));
        }
      }
    }

    const isForecastDataSufficient = sufficientPairs > 0 && realMae !== null;

    return {
      success: true,
      scope: isSpecificStore ? `STORE_${numericStoreId}` : 'ALL_STORES',
      periodDays: safeDays,
      generatedAt: new Date().toISOString(),
      // Nhóm 1: Sai số dự báo AI thực đo
      forecastAccuracy: {
        isDataSufficient: isForecastDataSufficient,
        sufficientHistoryPairs: sufficientPairs,
        forecastPairsCount: Number(ai.forecastPairs || 0),
        modelName: ai.modelName || 'ROP-Live-Sales-Weather',
        mae: isForecastDataSufficient ? realMae : null,
        rmse: isForecastDataSufficient ? realRmse : null,
        mapePct: isForecastDataSufficient ? realMape : null,
        confidenceScore: isForecastDataSufficient ? realConf : null,
        warning: isForecastDataSufficient
          ? null
          : 'Chưa đủ dữ liệu bán hàng tối thiểu 7 ngày lịch sử trong phạm vi đã chọn để đánh giá sai số mô hình.'
      },
      // Nhóm 2: Giá trị và khối lượng hàng bị hủy
      spoilageMetrics: {
        totalRevenue,
        totalUnitsSold: Number(sales.totalUnitsSold || 0),
        totalTransactions: Number(sales.totalTransactions || 0),
        totalRecords: Number(spoil.totalRecords || 0),
        approvedRecords: Number(spoil.approvedRecords || 0),
        pendingRecords: Number(spoil.pendingRecords || 0),
        totalDisposedUnits: Number(spoil.totalDisposedUnits || 0),
        totalCostLoss,
        approvedCostLoss: Number(spoil.approvedCostLoss || 0),
        spoilageRatePercent,
        byReason: spoilageByReasonRows || [],
        topSpoiledProducts: spoilageByProductRows || []
      },
      // Nhóm 3: Tỷ lệ thiếu hàng / Tồn đọng & Giá trị cứu hàng
      stockHealthMetrics: {
        totalActiveSkus,
        lowStockSkus,
        zeroStockSkus,
        stockoutRiskRatePercent,
        actualStockoutRatePercent,
        availableUnits: Number(batch.availableUnits || 0),
        inventoryCost: Number(batch.inventoryCost || 0),
        nearExpiryRiskCost: Number(batch.nearExpiryRiskCost || 0),
        expiredBatchCount: Number(batch.expiredBatchCount || 0),
        markdownRescuedValue,
        totalRescuedValue,
        rescueRatePercent
      },
      // Nhóm 4: Hiệu quả lập đơn nhập hàng PO
      orderingEfficiency: {
        totalOrders,
        draftCount: Number(po.draftCount || 0),
        approvedCount: Number(po.approvedCount || 0),
        submittedCount: Number(po.submittedCount || 0),
        deliveredCount: deliveredOrders,
        cancelledCount: Number(po.cancelledCount || 0),
        poCompletionRatePercent,
        totalBudget: Number(po.totalBudget || 0),
        avgProcessingDays: totalOrders > 0 ? Number((po.avgProcessingDays ?? 0).toFixed(1)) : 0
      },
      // Nhóm 5: Chi phí và lợi ích ròng điều phối
      transferEconomics: {
        totalTransfers: Number(trf.totalTransfers || 0),
        pendingCount: Number(trf.pendingCount || 0),
        activeCount: Number(trf.activeCount || 0),
        receivedCount: Number(trf.receivedCount || 0),
        cancelledCount: Number(trf.cancelledCount || 0),
        receivedUnits: Number(trf.receivedUnits || 0),
        savedValue: savedTransferVal,
        totalShippingCost: shippingCost,
        netBenefit: transferNetBenefit
      },
      dailySeries: dailyTrendRows || [],
      storeComparison: (storeComparisonRows || []).map(st => {
        const rev = Number(st.salesRevenue || 0);
        const loss = Number(st.spoilageLoss || 0);
        const stDenom = rev + loss;
        return {
          storeId: Number(st.storeId),
          storeCode: st.storeCode,
          storeName: st.storeName,
          status: st.status || 'OPEN',
          leadTimeDays: Number(st.leadTimeDays || 1),
          salesRevenue: rev,
          spoilageLoss: loss,
          disposedUnits: Number(st.disposedUnits || 0),
          spoilageRatePercent: stDenom > 0 ? Number(((loss / stDenom) * 100).toFixed(2)) : 0,
          inventoryCost: Number(st.inventoryCost || 0),
          markdownRescued: Number(st.markdownRescued || 0),
          transferNetSaved: Number(st.transferNetSaved || 0),
          poCount: Number(st.poCount || 0)
        };
      })
    };
  }
}

module.exports = GetReportsAnalyticsUseCase;
