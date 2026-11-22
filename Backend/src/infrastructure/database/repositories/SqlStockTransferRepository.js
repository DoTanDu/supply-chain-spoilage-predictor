// src/infrastructure/database/repositories/SqlStockTransferRepository.js
const path = require('path');
const { spawn } = require('child_process');
const SqlConnection = require('../sqlConnection');
const WeatherCondition = require('../../../domain/value-objects/WeatherCondition');
const RealEnvironmentService = require('../../services/RealEnvironmentService');

const PREDICT_CLI_PATH = path.join(__dirname, '../../../../ai_engine/predict_cli.py');
const OPTIMIZE_TRANSFER_CLI_PATH = path.join(__dirname, '../../../../ai_engine/optimize_transfer_cli.py');

class SqlStockTransferRepository {
  /**
   * Chạy kiểm thử trực tiếp file .pkl trên dữ liệu bán hàng thực tế trong SQL Server + thời tiết Open-Meteo
   */
  async runLivePklInference(limit = 12) {
    const safeLimit = Math.max(1, Math.min(50, Number(limit) || 12));
    const [liveEnv, dbRows] = await Promise.all([
      RealEnvironmentService.getLiveEnvironment({ storeId: 1 }).catch(() => null),
      SqlConnection.queryJson(`
        SELECT TOP (${safeLimit})
          ISNULL(sh.store_id, 1) AS store_id,
          ISNULL(sp.store_code, 'RETAIL-STORE-01') AS store_code,
          p.id AS product_id,
          p.sku,
          p.name AS product_name,
          ISNULL(p.standard_shelf_life_days, 14) AS shelf_life_days,
          ISNULL((SELECT MAX(b.discount_percent) FROM dbo.batches b WHERE b.product_id = p.id AND b.store_id = ISNULL(sh.store_id, 1) AND b.current_quantity > 0), 0) AS discount_pct,
          CAST(ISNULL(SUM(CASE WHEN sh.sale_date >= DATEADD(day, -7, CAST(GETDATE() AS DATE)) THEN sh.quantity_sold ELSE 0 END), 0) / 7.0 AS FLOAT) AS rolling_mean_7d,
          CAST(ISNULL(SUM(CASE WHEN sh.sale_date >= DATEADD(day, -14, CAST(GETDATE() AS DATE)) THEN sh.quantity_sold ELSE 0 END), 0) / 14.0 AS FLOAT) AS rolling_mean_14d,
          CAST(ISNULL((SELECT TOP 1 SUM(s2.quantity_sold) FROM dbo.sales_history s2 WHERE s2.product_id = p.id AND ISNULL(s2.store_id, 1) = ISNULL(sh.store_id, 1) GROUP BY s2.sale_date ORDER BY s2.sale_date DESC), 0) AS FLOAT) AS lag_1d,
          CAST(ISNULL(SUM(sh.quantity_sold) / NULLIF(COUNT(DISTINCT CONVERT(VARCHAR(10), sh.sale_date, 23)), 0), 0) AS FLOAT) AS actual_demand
        FROM dbo.sales_history sh
        INNER JOIN dbo.products p ON sh.product_id = p.id
        LEFT JOIN dbo.store_profile sp ON ISNULL(sh.store_id, 1) = sp.id
        GROUP BY ISNULL(sh.store_id, 1), sp.store_code, p.id, p.sku, p.name, p.standard_shelf_life_days
        ORDER BY SUM(sh.quantity_sold) DESC;
      `).catch(() => [])
    ]);

    if (!dbRows || dbRows.length === 0) {
      throw new Error('Chưa có dữ liệu giao dịch bán hàng thực tế trong SQL Server để kiểm định mô hình .pkl.');
    }

    const now = new Date();
    // Đồng bộ encoding thứ trong tuần với Python datetime.weekday() (0 = Thứ 2 .. 6 = Chủ nhật)
    const dow = (now.getDay() + 6) % 7;
    const liveTemp = liveEnv?.current?.temp ?? 28;
    const cond = liveEnv?.current?.condition || 'NORMAL';
    const wCode = cond === 'RAINY' ? 2 : cond === 'SUNNY' ? 1 : 0;
    const isHoliday = liveEnv?.calendar?.isPublicHoliday ? 1 : 0;

    const payloadRows = dbRows.map(r => ({
      store_id: Number(r.store_id || 1),
      store_code: r.store_code || 'RETAIL-STORE-01',
      product_id: Number(r.product_id),
      sku: r.sku,
      product_name: r.product_name,
      day_of_week: dow,
      is_weekend: (dow === 5 || dow === 6) ? 1 : 0,
      is_holiday: isHoliday,
      weather_code: wCode,
      temperature_c: Number(liveTemp),
      discount_pct: Number(r.discount_pct || 0),
      shelf_life_days: Number(r.shelf_life_days || 14),
      lag_1d: Number(r.lag_1d || 0),
      lag_7d: Number(r.rolling_mean_7d || 0),
      rolling_mean_7d: Number(r.rolling_mean_7d || 0),
      rolling_mean_14d: Number(r.rolling_mean_14d || 0),
      actual_demand: Number(r.actual_demand || 0)
    }));

    return new Promise((resolve, reject) => {
      const pyBin = process.platform === 'win32' ? 'py' : 'python3';
      const child = spawn(pyBin, [PREDICT_CLI_PATH], { windowsHide: true });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', d => { stdout += d.toString(); });
      child.stderr.on('data', d => { stderr += d.toString(); });
      child.on('error', err => reject(err));
      child.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(stderr || `Python process exited with code ${code}`));
        }
        try {
          resolve(JSON.parse(stdout.trim()));
        } catch (parseErr) {
          reject(new Error('Lỗi phân tích kết quả JSON từ Python AI CLI: ' + parseErr.message));
        }
      });
      child.stdin.write(JSON.stringify({ rows: payloadRows }));
      child.stdin.end();
    });
  }

  /**
   * Gọi Google OR-Tools MILP (Python SCIP/CBC) để tối ưu phương án điều chuyển liên chi nhánh
   */
  async runOrToolsTransferOptimizer(payload) {
    return new Promise((resolve, reject) => {
      const pyBin = process.platform === 'win32' ? 'py' : 'python3';
      const child = spawn(pyBin, [OPTIMIZE_TRANSFER_CLI_PATH], { windowsHide: true });
      let stdout = '';
      let stderr = '';
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          try { child.kill(); } catch {}
          reject(new Error('Google OR-Tools optimizer timeout (> 8000ms)'));
        }
      }, 8000);

      child.stdout.on('data', d => { stdout += d.toString(); });
      child.stderr.on('data', d => { stderr += d.toString(); });
      child.on('error', err => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err);
        }
      });
      child.on('close', (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (code !== 0) {
          return reject(new Error(stderr || `OR-Tools CLI exited with code ${code}`));
        }
        try {
          resolve(JSON.parse(stdout.trim()));
        } catch (parseErr) {
          reject(new Error('Lỗi phân tích JSON từ Google OR-Tools CLI: ' + parseErr.message));
        }
      });

      child.stdin.write(JSON.stringify(payload));
      child.stdin.end();
    });
  }

  /**
   * Ma trận Cân bằng Cung - Cầu các Chi nhánh hoàn toàn từ SQL Server + Thời tiết & Lịch lễ thực tế
   */
  async getAiSupplyChainMatrix({ weather = 'AUTO', isHoliday = 'auto' } = {}) {
    const [stores, products, batchSummary, fefoBatchRows, salesRows14d, liveEnv] = await Promise.all([
      SqlConnection.queryJson(`
        SELECT id, store_code AS storeCode, store_name AS storeName, address, phone, status
        FROM dbo.store_profile
        WHERE ISNULL(status, 'OPEN') <> 'SUSPENDED'
        ORDER BY id ASC
      `),
      SqlConnection.queryJson(`
        SELECT p.id AS product_id, p.sku, p.name, p.standard_shelf_life_days AS shelf_life,
               p.cost_price AS cost, p.selling_price AS price,
               p.min_stock_level AS minStockLevel, ISNULL(c.name, N'FMCG') AS categoryName,
               COALESCE(c.storage_temperature, N'Nhiệt độ phòng (25°C)') AS storageTemperature
        FROM dbo.products p
        LEFT JOIN dbo.categories c ON p.category_id = c.id
        WHERE p.is_active = 1
        ORDER BY p.id ASC
      `),
      SqlConnection.queryJson(`
        SELECT
          b.store_id AS storeId,
          b.product_id AS productId,
          SUM(b.current_quantity) AS totalStock,
          SUM(CASE WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date) BETWEEN 1 AND 7 THEN b.current_quantity ELSE 0 END) AS nearExpiryStock,
          MIN(DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date)) AS minDaysLeft
        FROM dbo.batches b
        WHERE b.current_quantity > 0
          AND b.status IN ('ACTIVE', 'WARNING')
          AND b.expiry_date > CAST(GETDATE() AS DATE)
        GROUP BY b.store_id, b.product_id
      `),
      SqlConnection.queryJson(`
        SELECT
          b.id,
          b.store_id AS storeId,
          b.product_id AS productId,
          b.batch_code AS batchCode,
          b.current_quantity AS currentQuantity,
          DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date) AS daysLeft
        FROM dbo.batches b
        WHERE b.current_quantity > 0
          AND b.status IN ('ACTIVE', 'WARNING')
          AND DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date) >= 2
        ORDER BY b.expiry_date ASC, b.id ASC
      `),
      SqlConnection.queryJson(`
        SELECT
          ISNULL(sh.store_id, 1) AS storeId,
          sh.product_id AS productId,
          SUM(sh.quantity_sold) AS totalSold14d,
          COUNT(DISTINCT CONVERT(VARCHAR(10), sh.sale_date, 23)) AS activeDays
        FROM dbo.sales_history sh
        WHERE sh.sale_date >= DATEADD(day, -14, CAST(GETDATE() AS DATE))
        GROUP BY ISNULL(sh.store_id, 1), sh.product_id
      `).catch(() => []),
      RealEnvironmentService.getLiveEnvironment({ storeId: 1 }).catch(() => null)
    ]);

    const reqW = String(weather || 'AUTO').toUpperCase();
    const wKey = ['NORMAL', 'SUNNY', 'RAINY'].includes(reqW) ? reqW : (liveEnv?.current?.condition || 'NORMAL');
    const isAutoHoliday = isHoliday === 'auto' || isHoliday === undefined || isHoliday === null;
    const forceHoliday = !isAutoHoliday && (isHoliday === true || String(isHoliday).toLowerCase() === 'true');
    const forceNoHoliday = !isAutoHoliday && (isHoliday === false || String(isHoliday).toLowerCase() === 'false');
    const effHoliday = forceHoliday ? true : (forceNoHoliday ? false : Boolean(liveEnv?.calendar?.isHoliday));

    const storeList = Array.isArray(stores) ? stores : [];
    const storeCount = storeList.length;
    const isSingleStore = storeCount <= 1;

    const batchMap = new Map();
    for (const row of (batchSummary || [])) {
      batchMap.set(`${row.storeId}_${row.productId}`, row);
    }

    const salesMap = new Map();
    let sufficientPairsCount = 0;
    for (const r of (salesRows14d || [])) {
      salesMap.set(`${r.storeId}_${r.productId}`, r);
      if (Number(r.activeDays || 0) >= 7) sufficientPairsCount++;
    }
    const hasSufficientHistory = sufficientPairsCount > 0;

    const fefoBatchesByKey = new Map();
    for (const b of (fefoBatchRows || [])) {
      const k = `${b.storeId}_${b.productId}`;
      if (!fefoBatchesByKey.has(k)) fefoBatchesByKey.set(k, []);
      fefoBatchesByKey.get(k).push(b);
    }

    const dailyEnvList = Array.isArray(liveEnv?.dailyForecast) && liveEnv.dailyForecast.length === 7
      ? liveEnv.dailyForecast
      : Array.from({ length: 7 }, (_, idx) => {
          const d = new Date();
          d.setDate(d.getDate() + idx);
          const dayNum = d.getDay();
          return { condition: wKey, isHoliday: dayNum === 0 || dayNum === 6 };
        });

    const productContexts = [];
    const orToolsPayloadProducts = [];

    for (const prod of (products || [])) {
      const storeCells = [];
      for (const st of storeList) {
        const sStat = salesMap.get(`${st.id}_${prod.product_id}`);
        const dBase14 = sStat ? Number(sStat.totalSold14d || 0) / 14.0 : 0;

        const dailySeries = dailyEnvList.map(day => {
          if (dBase14 <= 0) return 0;
          const wf = new WeatherCondition(day.condition || wKey).getDemandFactor(prod.categoryName || 'FMCG');
          let hf = 1.0;
          if (forceHoliday) {
            hf = 1.30;
          } else if (forceNoHoliday) {
            hf = 1.0;
          } else {
            hf = day.isHoliday ? 1.30 : 1.0;
          }
          return Math.round(dBase14 * wf * hf);
        });
        const predictedDemand7d = Math.round(dailySeries.reduce((s, v) => s + v, 0) * 10) / 10;
        const safetyStock = Math.max(0, Number(prod.minStockLevel || 15));

        const liveBatch = batchMap.get(`${st.id}_${prod.product_id}`);
        const storeFefoBatches = fefoBatchesByKey.get(`${st.id}_${prod.product_id}`) || [];
        const firstFefoBatch = storeFefoBatches[0] || null;
        const currentStock = liveBatch ? Number(liveBatch.totalStock || 0) : 0;
        const nearExpiryQty = liveBatch ? Number(liveBatch.nearExpiryStock || 0) : 0;
        const requiredTotal = Math.round(predictedDemand7d + safetyStock);
        const netBalance = Math.round(currentStock - requiredTotal);

        const spoilageRiskProb = currentStock > 0 && (netBalance > 0 || nearExpiryQty > 0)
          ? Math.min(1, Math.round(((Math.max(0, netBalance) + nearExpiryQty * 0.8) / Math.max(currentStock, 1)) * 100) / 100)
          : 0;

        storeCells.push({
          storeId: st.id,
          storeCode: st.storeCode,
          storeName: st.storeName,
          currentStock,
          nearExpiryQty,
          predictedDemand7d,
          dailySeries,
          safetyStock,
          requiredTotal,
          netBalance,
          surplusQty: netBalance > 0 ? netBalance : 0,
          deficitQty: netBalance < 0 ? Math.abs(netBalance) : 0,
          spoilageRiskProb,
          earliestBatchId: firstFefoBatch?.id || null,
          earliestBatchCode: firstFefoBatch?.batchCode || null,
          earliestBatchQty: firstFefoBatch ? Number(firstFefoBatch.currentQuantity || 0) : 0,
          fefoBatches: storeFefoBatches
        });
      }

      const surplusStores = isSingleStore ? [] : storeCells.filter(c => c.surplusQty >= 6).sort((a, b) => b.surplusQty - a.surplusQty);
      const deficitStores = isSingleStore ? [] : storeCells.filter(c => c.deficitQty >= 6).sort((a, b) => b.deficitQty - a.deficitQty);
      const storageTemp = String(prod.storageTemperature || 'Nhiệt độ phòng (25°C)');
      const isColdChain = /(lạnh|mát|đông|0°c|2°c|4°c|8°c|-18|2-8|0-4)/i.test(storageTemp);
      const estShippingCost = isColdChain ? 35000 : 25000;

      if (!isSingleStore && surplusStores.length > 0 && deficitStores.length > 0) {
        const surplusBatches = [];
        for (const sStore of surplusStores) {
          for (const b of (sStore.fefoBatches || [])) {
            const bQty = Number(b.currentQuantity || 0);
            if (bQty >= 6 && Number(b.daysLeft || 0) >= 2) {
              surplusBatches.push({
                storeId: sStore.storeId,
                storeCode: sStore.storeCode,
                storeName: sStore.storeName,
                maxStoreSurplus: sStore.surplusQty,
                batchId: b.id,
                batchCode: b.batchCode,
                batchQty: bQty,
                daysLeft: Number(b.daysLeft),
                shippingCost: estShippingCost
              });
            }
          }
        }
        if (surplusBatches.length > 0) {
          orToolsPayloadProducts.push({
            productId: prod.product_id,
            unitCost: Number(prod.cost || 0),
            minTransferQty: 6,
            surplusBatches,
            deficitStores: deficitStores.map(d => ({
              storeId: d.storeId,
              storeCode: d.storeCode,
              storeName: d.storeName,
              deficitQty: d.deficitQty,
              shippingCost: estShippingCost
            }))
          });
        }
      }

      productContexts.push({ prod, storeCells, surplusStores, deficitStores, storageTemp, isColdChain, estShippingCost });
    }

    let solverResult = null;
    if (orToolsPayloadProducts.length > 0) {
      try {
        solverResult = await this.runOrToolsTransferOptimizer({ products: orToolsPayloadProducts });
      } catch (err) {
        console.warn('[AI 3 FALLBACK] Google OR-Tools CLI unavailable, using FEFO-Chain-Rebalance:', err.message);
        solverResult = null;
      }
    }

    const usedOrTools = Boolean(solverResult && solverResult.success && solverResult.proposalsByProduct);
    const matrixByProduct = [];
    const orToolsTransferProposals = [];

    for (const ctx of productContexts) {
      const { prod, storeCells, surplusStores, deficitStores, storageTemp, isColdChain, estShippingCost } = ctx;
      let totalTransferredForProd = 0;
      const productTransfers = [];
      const pidKey = String(prod.product_id);

      if (!isSingleStore && usedOrTools && Array.isArray(solverResult.proposalsByProduct[pidKey])) {
        const solvedList = solverResult.proposalsByProduct[pidKey];
        for (const sp of solvedList) {
          const transferQty = Number(sp.transferQuantity || 0);
          if (transferQty < 1) continue;

          const sCell = storeCells.find(c => c.storeId === Number(sp.fromStoreId));
          const dCell = storeCells.find(c => c.storeId === Number(sp.toStoreId));
          const availBefore = sCell ? sCell.surplusQty : transferQty;
          const neededBefore = dCell ? dCell.deficitQty : transferQty;
          if (sCell) sCell.surplusQty = Math.max(0, sCell.surplusQty - transferQty);
          if (dCell) dCell.deficitQty = Math.max(0, dCell.deficitQty - transferQty);
          totalTransferredForProd += transferQty;

          const shipCost = Number(sp.shippingCost || estShippingCost);
          const savedVal = Number(sp.savedSpoilageValue || 0);
          const netBenefit = Number(sp.netFinancialBenefit ?? (savedVal - shipCost));
          if (netBenefit <= 0) continue;

          const proposal = {
            productId: prod.product_id,
            sku: prod.sku,
            productName: prod.name,
            storageTemperature: storageTemp,
            isColdChain,
            unitCost: Number(prod.cost || 0),
            unitPrice: Number(prod.price || 0),
            fromStoreId: Number(sp.fromStoreId),
            fromStoreCode: sp.fromStoreCode,
            fromStoreName: sp.fromStoreName,
            toStoreId: Number(sp.toStoreId),
            toStoreCode: sp.toStoreCode,
            toStoreName: sp.toStoreName,
            sourceBatchId: Number(sp.sourceBatchId),
            sourceBatchCode: sp.sourceBatchCode,
            sourceBatchDaysLeft: Number(sp.sourceBatchDaysLeft),
            transferQuantity: transferQty,
            shippingCost: shipCost,
            savedSpoilageValue: savedVal,
            netFinancialBenefit: netBenefit,
            aiReason: `${sp.fromStoreName} dư ${availBefore} ĐV, ${sp.toStoreName} thiếu ${neededBefore} ĐV. OR-Tools MILP tối ưu chuyển ${transferQty} ĐV từ lô ${sp.sourceBatchCode} (còn ${sp.sourceBatchDaysLeft} ngày HSD • ${storageTemp} • Phí ${shipCost.toLocaleString('vi-VN')}đ).`
          };
          productTransfers.push(proposal);
          orToolsTransferProposals.push(proposal);
        }
      } else if (!isSingleStore) {
        for (const sStore of surplusStores) {
          for (const dStore of deficitStores) {
            const avail = sStore.surplusQty;
            const needed = dStore.deficitQty;
            if (avail >= 6 && needed >= 6 && Array.isArray(sStore.fefoBatches) && sStore.fefoBatches.length > 0) {
              const desiredQty = Math.min(avail, needed);
              const chosenBatch =
                sStore.fefoBatches.find(b => Number(b.currentQuantity) >= desiredQty) ||
                sStore.fefoBatches.slice().sort((a, b) => Number(b.currentQuantity) - Number(a.currentQuantity))[0];

              const transferQty = chosenBatch ? Math.min(desiredQty, Number(chosenBatch.currentQuantity || 0)) : 0;
              if (!chosenBatch || transferQty < 1) continue;

              const shippingCost = estShippingCost;
              const savedSpoilageValue = Math.round(transferQty * Number(prod.cost || 0));
              const netBenefit = savedSpoilageValue - shippingCost;

              if (netBenefit > 0) {
                sStore.surplusQty -= transferQty;
                dStore.deficitQty -= transferQty;
                chosenBatch.currentQuantity = Math.max(0, Number(chosenBatch.currentQuantity) - transferQty);
                totalTransferredForProd += transferQty;

                const proposal = {
                  productId: prod.product_id,
                  sku: prod.sku,
                  productName: prod.name,
                  storageTemperature: storageTemp,
                  isColdChain,
                  unitCost: Number(prod.cost || 0),
                  unitPrice: Number(prod.price || 0),
                  fromStoreId: sStore.storeId,
                  fromStoreCode: sStore.storeCode,
                  fromStoreName: sStore.storeName,
                  toStoreId: dStore.storeId,
                  toStoreCode: dStore.storeCode,
                  toStoreName: dStore.storeName,
                  sourceBatchId: chosenBatch.id,
                  sourceBatchCode: chosenBatch.batchCode,
                  sourceBatchDaysLeft: Number(chosenBatch.daysLeft),
                  transferQuantity: transferQty,
                  shippingCost,
                  savedSpoilageValue,
                  netFinancialBenefit: netBenefit,
                  aiReason: `${sStore.storeName} dư ${avail} ĐV, ${dStore.storeName} thiếu ${needed} ĐV. Điều chuyển ${transferQty} ĐV từ lô ${chosenBatch.batchCode} (còn ${chosenBatch.daysLeft} ngày HSD • ${storageTemp} • Phí ${shippingCost.toLocaleString('vi-VN')}đ).`
                };
                productTransfers.push(proposal);
                orToolsTransferProposals.push(proposal);
              }
            }
          }
        }
      }

      const remainingDeficit = storeCells.reduce((acc, c) => acc + c.deficitQty, 0);
      const remainingSurplus = storeCells.reduce((acc, c) => acc + c.surplusQty, 0);
      const markdownFallbackRecommended = Boolean(!isSingleStore && remainingSurplus >= 6 && remainingDeficit >= 6 && totalTransferredForProd === 0);

      matrixByProduct.push({
        productId: prod.product_id,
        sku: prod.sku,
        productName: prod.name,
        storageTemperature: storageTemp,
        shelfLifeDays: prod.shelf_life,
        unitCost: Number(prod.cost || 0),
        unitPrice: Number(prod.price || 0),
        stores: storeCells,
        totalChainStock: storeCells.reduce((s, c) => s + c.currentStock, 0),
        totalChainDemand7d: Math.round(storeCells.reduce((s, c) => s + c.predictedDemand7d, 0) * 10) / 10,
        optimalInternalTransferQty: totalTransferredForProd,
        optimalDcOrderQty: remainingDeficit,
        markdownClearanceQty: remainingSurplus,
        markdownFallbackRecommended,
        transferProposals: productTransfers
      });
    }

    const resolvedMetrics = hasSufficientHistory
      ? { mae: null, rmse: null, mapePct: null, confidenceScore: null, isDataSufficient: true, warning: null }
      : {
          mae: null,
          rmse: null,
          mapePct: null,
          confidenceScore: null,
          isDataSufficient: false,
          warning: 'Chưa đủ dữ liệu bán hàng thực tế tối thiểu 7 ngày — hệ thống không gán độ chính xác giả tạo.'
        };

    return {
      modelVersion: 'LightGBM + ROP-Live-Sales-Weather',
      optimizerEngine: usedOrTools ? solverResult.optimizerEngine : 'FEFO-Chain-Rebalance',
      datasetFile: 'SQL Server retail_spoilage_db + Open-Meteo',
      totalDatasetRows: (salesRows14d || []).length,
      metrics: resolvedMetrics,
      isSingleStore,
      storeCount,
      weather: wKey,
      isHoliday: Boolean(effHoliday),
      stores: storeList,
      matrixByProduct,
      orToolsTransferProposals
    };
  }

  /**
   * Truy vấn danh sách toàn bộ Phiếu điều chuyển liên cửa hàng từ bảng dbo.stock_transfers
   */
  async getAllTransfers({ status, storeId } = {}) {
    let whereClauses = ['1=1'];
    if (status && status !== 'ALL') {
      whereClauses.push(`st.status = ${SqlConnection.escapeSql(String(status).toUpperCase())}`);
    }
    if (storeId) {
      const sid = Number(storeId);
      whereClauses.push(`(st.from_store_id = ${sid} OR st.to_store_id = ${sid})`);
    }

    const sql = `
      SELECT 
        st.id,
        st.transfer_code AS transferCode,
        st.from_store_id AS fromStoreId,
        fs.store_code AS fromStoreCode,
        fs.store_name AS fromStoreName,
        st.to_store_id AS toStoreId,
        ts.store_code AS toStoreCode,
        ts.store_name AS toStoreName,
        st.product_id AS productId,
        p.sku,
        p.name AS productName,
        COALESCE(c.storage_temperature, N'Nhiệt độ phòng (25°C)') AS storageTemperature,
        p.selling_price AS unitPrice,
        st.source_batch_id AS sourceBatchId,
        b.batch_code AS sourceBatchCode,
        b.expiry_date AS sourceBatchExpiry,
        b.import_price AS importPrice,
        st.transfer_quantity AS transferQuantity,
        st.shipping_cost AS shippingCost,
        (st.transfer_quantity * ISNULL(b.import_price, p.selling_price * 0.75)) AS savedSpoilageValue,
        st.status,
        st.ai_recommendation_note AS aiRecommendationNote,
        st.requested_by AS requestedById,
        uReq.full_name AS requestedByName,
        st.approved_by AS approvedById,
        uApp.full_name AS approvedByName,
        st.created_at AS createdAt,
        st.received_at AS receivedAt
      FROM dbo.stock_transfers st
      INNER JOIN dbo.store_profile fs ON st.from_store_id = fs.id
      INNER JOIN dbo.store_profile ts ON st.to_store_id = ts.id
      INNER JOIN dbo.products p ON st.product_id = p.id
      LEFT JOIN dbo.categories c ON p.category_id = c.id
      INNER JOIN dbo.batches b ON st.source_batch_id = b.id
      INNER JOIN dbo.users uReq ON st.requested_by = uReq.id
      LEFT JOIN dbo.users uApp ON st.approved_by = uApp.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY st.id DESC
    `;
    return await SqlConnection.queryJson(sql);
  }

  /**
   * Tạo phiếu đề xuất điều chuyển liên cửa hàng mới (PROPOSED / APPROVED)
   * Bắt buộc kiểm tra lô nguồn hợp lệ cùng chi nhánh xuất, đúng sản phẩm, còn hạn và đủ tồn kho (CHƯA trừ kho ở bước tạo).
   */
  async createTransfer({
    fromStoreId,
    toStoreId,
    productId,
    sourceBatchId,
    transferQuantity,
    shippingCost = 0,
    aiRecommendationNote = '',
    requestedBy = 2,
    autoApprove = false
  }) {
    const fId = Number(fromStoreId);
    const tId = Number(toStoreId);
    const pId = Number(productId);
    const qty = Number(transferQuantity);
    const shipCost = (shippingCost === undefined || shippingCost === null || shippingCost === '')
      ? 0
      : Number(shippingCost);
    const reqUserId = Number(requestedBy || 2);

    const activeStoresRes = await SqlConnection.queryJson(`
      SELECT COUNT(*) AS activeCount FROM dbo.store_profile WHERE ISNULL(status, 'OPEN') <> 'SUSPENDED'
    `);
    if (Number(activeStoresRes?.[0]?.activeCount || 0) <= 1) {
      const err = new Error('Chế độ Cửa hàng độc lập (1 chi nhánh) không hỗ trợ tạo phiếu điều chuyển liên chi nhánh.');
      err.statusCode = 400;
      err.code = 'ERR_SINGLE_STORE_NO_TRANSFER';
      throw err;
    }

    if (!Number.isInteger(fId) || fId <= 0 || !Number.isInteger(tId) || tId <= 0) {
      const err = new Error('Mã chi nhánh xuất và chi nhánh nhận phải là số nguyên dương hợp lệ!');
      err.statusCode = 400;
      throw err;
    }
    if (fId === tId) {
      const err = new Error('Cửa hàng xuất và Cửa hàng nhận phải khác nhau (CK_stock_transfers_diff_stores)!');
      err.statusCode = 400;
      throw err;
    }
    if (!Number.isInteger(pId) || pId <= 0) {
      const err = new Error('Mã sản phẩm điều chuyển không hợp lệ!');
      err.statusCode = 400;
      throw err;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      const err = new Error('Số lượng điều chuyển phải là số nguyên lớn hơn 0!');
      err.statusCode = 400;
      throw err;
    }
    if (!Number.isFinite(shipCost) || shipCost < 0) {
      const err = new Error('Chi phí vận chuyển không được âm!');
      err.statusCode = 400;
      throw err;
    }

    const [storesCheck, activeChainRows, prodCheck] = await Promise.all([
      SqlConnection.queryJson(`SELECT id, ISNULL(status, 'OPEN') AS status FROM dbo.store_profile WHERE id IN (${fId}, ${tId})`),
      SqlConnection.queryJson(`SELECT COUNT(*) AS activeCount FROM dbo.store_profile WHERE ISNULL(status, 'OPEN') <> 'SUSPENDED'`),
      SqlConnection.queryJson(`SELECT TOP 1 id, name FROM dbo.products WHERE id = ${pId}`)
    ]);

    const activeStoreCount = Number(activeChainRows?.[0]?.activeCount || 0);
    if (activeStoreCount <= 1) {
      const err = new Error('Hệ thống đang vận hành ở chế độ Cửa hàng độc lập (1 chi nhánh), không hỗ trợ điều chuyển liên cửa hàng (Mục A3 #1)!');
      err.statusCode = 400;
      throw err;
    }

    const storeStatusMap = new Map((storesCheck || []).map(s => [Number(s.id), String(s.status || 'OPEN').toUpperCase()]));
    if (!storeStatusMap.has(fId) || !storeStatusMap.has(tId)) {
      const err = new Error(`Không tìm thấy chi nhánh xuất (#${fId}) hoặc chi nhánh nhận (#${tId}) trong hệ thống!`);
      err.statusCode = 404;
      throw err;
    }
    if (storeStatusMap.get(fId) === 'SUSPENDED' || storeStatusMap.get(tId) === 'SUSPENDED') {
      const err = new Error('Chi nhánh xuất hoặc nhận đang tạm ngưng hoạt động (SUSPENDED), không thể điều chuyển!');
      err.statusCode = 400;
      throw err;
    }
    if (!prodCheck || prodCheck.length === 0) {
      const err = new Error(`Không tìm thấy sản phẩm #${pId}!`);
      err.statusCode = 404;
      throw err;
    }

    let resolvedBatchId = null;
    if (sourceBatchId !== undefined && sourceBatchId !== null && String(sourceBatchId).trim() !== '') {
      const sBatchId = Number(sourceBatchId);
      if (!Number.isInteger(sBatchId) || sBatchId <= 0) {
        const err = new Error('Mã lô nguồn (sourceBatchId) không hợp lệ!');
        err.statusCode = 400;
        throw err;
      }

      const batchRows = await SqlConnection.queryJson(`
        SELECT TOP 1
          id,
          ISNULL(store_id, 1) AS storeId,
          product_id AS productId,
          batch_code AS batchCode,
          current_quantity AS currentQuantity,
          status,
          DATEDIFF(day, CAST(GETDATE() AS DATE), expiry_date) AS daysLeft
        FROM dbo.batches
        WHERE id = ${sBatchId}
      `);
      if (!batchRows || batchRows.length === 0) {
        const err = new Error(`Không tìm thấy lô hàng nguồn #${sBatchId}!`);
        err.statusCode = 404;
        throw err;
      }
      const batch = batchRows[0];
      if (Number(batch.storeId) !== fId) {
        const err = new Error(`Lô hàng #${sBatchId} thuộc Chi nhánh #${batch.storeId}, không thể xuất từ Chi nhánh #${fId}!`);
        err.statusCode = 403;
        err.code = 'ERR_STORE_SCOPE_FORBIDDEN';
        throw err;
      }
      if (Number(batch.productId) !== pId) {
        const err = new Error(`Lô hàng ${batch.batchCode} (#${sBatchId}) không thuộc sản phẩm #${pId}!`);
        err.statusCode = 400;
        throw err;
      }
      if (!['ACTIVE', 'WARNING'].includes(String(batch.status || '').toUpperCase()) || Number(batch.daysLeft) <= 0) {
        const err = new Error(`Lô hàng ${batch.batchCode} đã hết hạn hoặc ngừng lưu hành (Rule 5), không thể điều chuyển!`);
        err.statusCode = 400;
        throw err;
      }
      if (Number(batch.daysLeft) < 2) {
        const err = new Error(`Lô hàng ${batch.batchCode} chỉ còn ${batch.daysLeft} ngày HSD (cần tối thiểu 2 ngày để vận chuyển và bán tại chi nhánh nhận) — hãy giảm giá xả tại chỗ!`);
        err.statusCode = 400;
        throw err;
      }
      if (Number(batch.currentQuantity) < qty) {
        const err = new Error(`Lô hàng ${batch.batchCode} chỉ còn ${batch.currentQuantity} ĐV khả dụng, không đủ để điều chuyển ${qty} ĐV!`);
        err.statusCode = 400;
        throw err;
      }
      resolvedBatchId = sBatchId;
    } else {
      // Tự động chọn lô FEFO còn hạn (>= 2 ngày) và đủ số lượng tại ĐÚNG chi nhánh xuất & ĐÚNG sản phẩm
      const fefoRows = await SqlConnection.queryJson(`
        SELECT TOP 1 id, batch_code AS batchCode, current_quantity AS currentQuantity
        FROM dbo.batches b
        WHERE b.product_id = ${pId}
          AND ISNULL(b.store_id, 1) = ${fId}
          AND b.status IN ('ACTIVE', 'WARNING')
          AND DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date) >= 2
          AND (
            b.current_quantity - ISNULL((
              SELECT SUM(st2.transfer_quantity)
              FROM dbo.stock_transfers st2
              WHERE st2.source_batch_id = b.id
                AND st2.status IN ('PROPOSED', 'PENDING', 'APPROVED')
            ), 0)
          ) >= ${qty}
        ORDER BY b.expiry_date ASC, b.id ASC
      `);
      if (!fefoRows || fefoRows.length === 0) {
        const err = new Error(
          `Chi nhánh #${fId} không có lô hàng sản phẩm #${pId} nào còn hạn và đủ ${qty} ĐV khả dụng để tạo lệnh điều chuyển!`
        );
        err.statusCode = 400;
        throw err;
      }
      resolvedBatchId = Number(fefoRows[0].id);
    }

    const uniqueSuffix = `${Date.now().toString(36).toUpperCase().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;
    const transferCode = `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${uniqueSuffix}`;
    const initStatus = autoApprove ? 'APPROVED' : 'PROPOSED';
    const appUserSql = autoApprove ? reqUserId : 'NULL';
    const safeNote = SqlConnection.escapeSql(
      aiRecommendationNote || `[OR-Tools Optimization] Đề xuất điều chuyển ${qty} đơn vị từ Store #${fId} sang Store #${tId} theo nguyên tắc FEFO.`
    );

    const sql = `
      BEGIN TRANSACTION;
      BEGIN TRY
        DECLARE @newId INT;

        DECLARE @reservedQty INT = 0;
        SELECT @reservedQty = ISNULL(SUM(transfer_quantity), 0)
        FROM dbo.stock_transfers WITH (HOLDLOCK)
        WHERE source_batch_id = ${resolvedBatchId}
          AND status IN ('PROPOSED', 'PENDING', 'APPROVED');

        IF NOT EXISTS (
          SELECT 1 FROM dbo.batches WITH (UPDLOCK, ROWLOCK)
          WHERE id = ${resolvedBatchId}
            AND ISNULL(store_id, 1) = ${fId}
            AND product_id = ${pId}
            AND status IN ('ACTIVE', 'WARNING')
            AND expiry_date > CAST(GETDATE() AS DATE)
            AND (current_quantity - @reservedQty) >= ${qty}
        )
          THROW 50003, N'Lô hàng nguồn không còn đủ tồn kho khả dụng (sau khi trừ lượng đã giữ cho phiếu điều chuyển khác) hoặc đã hết hạn!', 1;

        INSERT INTO dbo.stock_transfers (
          transfer_code, from_store_id, to_store_id, product_id, source_batch_id,
          transfer_quantity, shipping_cost, status, ai_recommendation_note, requested_by, approved_by
        )
        VALUES (
          ${SqlConnection.escapeSql(transferCode)},
          ${fId}, ${tId}, ${pId}, ${resolvedBatchId},
          ${qty}, ${shipCost}, ${SqlConnection.escapeSql(initStatus)},
          ${safeNote}, ${reqUserId}, ${appUserSql}
        );

        SET @newId = SCOPE_IDENTITY();

        INSERT INTO dbo.system_audit_logs (user_id, action_type, entity_name, entity_id, description, ip_address, created_at)
        VALUES (
          ${reqUserId},
          N'CREATE_STOCK_TRANSFER',
          N'StockTransfer',
          CAST(@newId AS NVARCHAR(50)),
          N'Khởi tạo phiếu điều chuyển liên cửa hàng ' + ${SqlConnection.escapeSql(transferCode)} + N' (CN #' + CAST(${fId} AS NVARCHAR(10)) + N' -> CN #' + CAST(${tId} AS NVARCHAR(10)) + N', Lô #' + CAST(${resolvedBatchId} AS NVARCHAR(10)) + N', Số lượng: ${qty}, Trạng thái: ${initStatus})',
          N'127.0.0.1',
          GETDATE()
        );

        COMMIT TRANSACTION;

        SELECT 
          st.id,
          st.transfer_code AS transferCode,
          st.from_store_id AS fromStoreId,
          st.to_store_id AS toStoreId,
          st.product_id AS productId,
          st.source_batch_id AS sourceBatchId,
          st.transfer_quantity AS transferQuantity,
          st.shipping_cost AS shippingCost,
          st.status,
          st.ai_recommendation_note AS aiRecommendationNote,
          st.requested_by AS requestedById,
          st.approved_by AS approvedById,
          st.created_at AS createdAt
        FROM dbo.stock_transfers st
        WHERE st.id = @newId
        FOR JSON PATH;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
      END CATCH;
    `;

    try {
      const rows = await SqlConnection.queryJson(sql);
      return rows[0] || null;
    } catch (sqlErr) {
      if ((sqlErr.message || '').includes('50003')) {
        const conflictErr = new Error('Lô hàng nguồn không còn đủ tồn kho khả dụng hoặc đã hết hạn để tạo phiếu điều chuyển!');
        conflictErr.statusCode = 409;
        throw conflictErr;
      }
      throw sqlErr;
    }
  }

  /**
   * Cập nhật trạng thái Phiếu điều chuyển theo quy trình 5 bước Khép kín & Toàn vẹn Tồn kho trong SQL Transaction:
   * PROPOSED/PENDING -> APPROVED (chưa đụng kho) -> IN_TRANSIT (trừ lô nguồn với UPDLOCK) -> RECEIVED (tạo lô đích kế thừa HSD) / CANCELLED (hoàn lô nguồn nếu đang IN_TRANSIT)
   */
  async updateTransferStatus({ id, status, userId = 1, userRole = 'ADMIN', userStoreId = null, notes = '' }) {
    const transferId = Number(id);
    if (!Number.isInteger(transferId) || transferId <= 0) {
      const err = new Error(`Mã phiếu điều chuyển '${id}' không hợp lệ!`);
      err.statusCode = 400;
      throw err;
    }

    const nextStatus = String(status || '').trim().toUpperCase();
    const validStatuses = ['PROPOSED', 'PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'];

    if (!validStatuses.includes(nextStatus)) {
      const err = new Error(`Trạng thái điều chuyển '${nextStatus}' không hợp lệ!`);
      err.statusCode = 400;
      throw err;
    }

    const normRole = String(userRole || '').toUpperCase();
    const isOwner = normRole === 'ADMIN' || normRole === 'OWNER';
    const isManager = isOwner || normRole === 'STORE_MANAGER' || normRole === 'MANAGER';

    // Kiểm tra phân quyền RBAC: Gửi chờ duyệt / Phê duyệt / Hủy lệnh điều chuyển yêu cầu OWNER (ADMIN) hoặc STORE_MANAGER
    if ((nextStatus === 'PENDING' || nextStatus === 'APPROVED' || nextStatus === 'CANCELLED') && !isManager) {
      const err = new Error(`Vi phạm phân quyền RBAC: Chỉ Chủ chuỗi (OWNER/ADMIN) hoặc Quản lý (STORE_MANAGER) mới được chuyển trạng thái sang ${nextStatus}!`);
      err.statusCode = 403;
      err.code = 'ERR_UNAUTHORIZED_ROLE';
      throw err;
    }

    const existingRows = await SqlConnection.queryJson(`
      SELECT id, transfer_code AS transferCode, from_store_id AS fromStoreId, to_store_id AS toStoreId,
             product_id AS productId, status, source_batch_id AS sourceBatchId, transfer_quantity AS transferQuantity
      FROM dbo.stock_transfers
      WHERE id = ${transferId}
    `);

    if (!existingRows || existingRows.length === 0) {
      const err = new Error(`Không tìm thấy phiếu điều chuyển #${transferId}!`);
      err.statusCode = 404;
      throw err;
    }

    const current = existingRows[0];

    if (!isOwner) {
      const sid = Number(userStoreId);
      const fromSid = Number(current.fromStoreId);
      const toSid = Number(current.toStoreId);
      if (!Number.isInteger(sid) || sid <= 0 || (sid !== fromSid && sid !== toSid)) {
        const err = new Error(`Từ chối truy cập liên chi nhánh (403 Forbidden): Phiếu điều chuyển #${transferId} thuộc Store #${fromSid} -> Store #${toSid}, không thuộc Chi nhánh #${userStoreId}!`);
        err.statusCode = 403;
        err.code = 'ERR_STORE_SCOPE_FORBIDDEN';
        throw err;
      }
      if ((nextStatus === 'APPROVED' || nextStatus === 'IN_TRANSIT') && sid !== fromSid) {
        const err = new Error(`Chỉ Chi nhánh xuất hàng (#${fromSid}) hoặc Chủ chuỗi mới được xác nhận trạng thái ${nextStatus}!`);
        err.statusCode = 403;
        err.code = 'ERR_STORE_SCOPE_FORBIDDEN';
        throw err;
      }
      if (nextStatus === 'RECEIVED' && sid !== toSid) {
        const err = new Error(`Chỉ Chi nhánh nhận hàng (#${toSid}) hoặc Chủ chuỗi mới được xác nhận đã nhận hàng (RECEIVED)!`);
        err.statusCode = 403;
        err.code = 'ERR_STORE_SCOPE_FORBIDDEN';
        throw err;
      }
    }

    const ALLOWED_TRANSITIONS = {
      PROPOSED: ['PENDING', 'APPROVED', 'CANCELLED'],
      PENDING: ['APPROVED', 'CANCELLED'],
      APPROVED: ['IN_TRANSIT', 'CANCELLED'],
      IN_TRANSIT: ['RECEIVED', 'CANCELLED'],
      RECEIVED: [],
      CANCELLED: []
    };
    const curStatusUpper = String(current.status || '').trim().toUpperCase();
    if (!(ALLOWED_TRANSITIONS[curStatusUpper] || []).includes(nextStatus)) {
      const err = new Error(
        `Không thể chuyển phiếu ${current.transferCode} từ trạng thái [${curStatusUpper}] sang [${nextStatus}]. Chu trình hợp lệ: PROPOSED -> PENDING -> APPROVED -> IN_TRANSIT -> RECEIVED (hoặc CANCELLED).`
      );
      err.statusCode = 409;
      err.code = 'ERR_INVALID_TRANSFER_TRANSITION';
      throw err;
    }

    const safeUserId = Number(userId || 1);
    const safeNotes = SqlConnection.escapeSql(notes || `Chuyển trạng thái sang ${nextStatus}`);
    const safeNextStatus = SqlConnection.escapeSql(nextStatus);

    let transitionInventorySql = '';
    if (nextStatus === 'PENDING') {
      transitionInventorySql = `
        IF @curStatus <> N'PROPOSED'
          THROW 50002, N'Xung đột trạng thái: Chỉ phiếu PROPOSED mới được chuyển sang Chờ duyệt (PENDING)!', 1;
      `;
    } else if (nextStatus === 'APPROVED') {
      transitionInventorySql = `
        IF @curStatus NOT IN (N'PROPOSED', N'PENDING')
          THROW 50002, N'Xung đột trạng thái: Chỉ phiếu PROPOSED hoặc PENDING mới được phê duyệt (APPROVED)!', 1;

        IF NOT EXISTS (
          SELECT 1 FROM dbo.batches WITH (UPDLOCK, ROWLOCK)
          WHERE id = @sourceBatchId
            AND ISNULL(store_id, 1) = @fromStoreId
            AND product_id = @productId
            AND status IN ('ACTIVE', 'WARNING')
            AND expiry_date > CAST(GETDATE() AS DATE)
            AND current_quantity >= @qty
        )
          THROW 50003, N'Không thể phê duyệt: Lô hàng nguồn không còn đủ tồn kho khả dụng hoặc đã hết hạn!', 1;
      `;
    } else if (nextStatus === 'IN_TRANSIT') {
      transitionInventorySql = `
        IF @curStatus <> N'APPROVED'
          THROW 50002, N'Xung đột trạng thái: Phiếu phải ở trạng thái APPROVED mới được xuất kho vận chuyển (IN_TRANSIT)!', 1;

        DECLARE @srcCode NVARCHAR(50), @srcRemain INT;
        SELECT @srcCode = batch_code
        FROM dbo.batches WITH (UPDLOCK, ROWLOCK)
        WHERE id = @sourceBatchId;

        UPDATE dbo.batches WITH (UPDLOCK, ROWLOCK)
        SET current_quantity = current_quantity - @qty
        WHERE id = @sourceBatchId
          AND ISNULL(store_id, 1) = @fromStoreId
          AND product_id = @productId
          AND status IN ('ACTIVE', 'WARNING')
          AND expiry_date > CAST(GETDATE() AS DATE)
          AND current_quantity >= @qty;

        IF @@ROWCOUNT = 0
          THROW 50003, N'Không thể xuất kho điều chuyển: Lô nguồn không còn đủ tồn kho khả dụng, sai chi nhánh hoặc đã hết hạn (Rule 3 & Rule 5)!', 1;

        SELECT @srcRemain = current_quantity FROM dbo.batches WHERE id = @sourceBatchId;
        SET @auditExtra = N' | Xuất kho CN #' + CAST(@fromStoreId AS NVARCHAR(10)) + N': -' + CAST(@qty AS NVARCHAR(10)) + N' ĐV từ lô ' + ISNULL(@srcCode, N'') + N' (còn ' + CAST(@srcRemain AS NVARCHAR(10)) + N' ĐV)';
      `;
    } else if (nextStatus === 'RECEIVED') {
      transitionInventorySql = `
        IF @curStatus <> N'IN_TRANSIT'
          THROW 50002, N'Xung đột trạng thái: Phiếu phải ở trạng thái IN_TRANSIT mới được xác nhận đã nhận hàng (RECEIVED)!', 1;

        DECLARE @srcBatchCode NVARCHAR(50),
                @mfgDate DATE,
                @expDate DATE,
                @impPrice DECIMAL(18, 2),
                @discPct INT,
                @daysLeft INT,
                @warnDays INT,
                @destStatus NVARCHAR(20);

        SELECT
          @srcBatchCode = b.batch_code,
          @mfgDate = b.manufacture_date,
          @expDate = b.expiry_date,
          @impPrice = b.import_price,
          @discPct = ISNULL(b.discount_percent, 0),
          @daysLeft = DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date),
          @warnDays = COALESCE(p.custom_warning_days, c.default_warning_days, 7)
        FROM dbo.batches b WITH (UPDLOCK, ROWLOCK)
        INNER JOIN dbo.products p ON b.product_id = p.id
        INNER JOIN dbo.categories c ON p.category_id = c.id
        WHERE b.id = @sourceBatchId;

        IF @srcBatchCode IS NULL
          THROW 50004, N'Không tìm thấy lô hàng nguồn để tạo lô nhập kho tại chi nhánh đích!', 1;

        IF @daysLeft <= 0
          SET @destStatus = N'EXPIRED';
        ELSE IF @discPct > 0 OR @daysLeft <= @warnDays
          SET @destStatus = N'WARNING';
        ELSE
          SET @destStatus = N'ACTIVE';

        SET @destBatchCode = LEFT(@transferCode + N'-' + @srcBatchCode, 50);
        IF EXISTS (SELECT 1 FROM dbo.batches WHERE batch_code = @destBatchCode)
          SET @destBatchCode = LEFT(N'B' + CAST(@transferId AS NVARCHAR(10)) + N'-' + @transferCode, 50);

        DECLARE @insDest TABLE (id INT);
        INSERT INTO dbo.batches (
          receipt_id, store_id, batch_code, product_id,
          import_date, manufacture_date, expiry_date,
          initial_quantity, current_quantity, import_price,
          discount_percent, status, is_shelf_rotated, created_at
        )
        OUTPUT INSERTED.id INTO @insDest
        VALUES (
          NULL, @toStoreId, @destBatchCode, @productId,
          CAST(GETDATE() AS DATE), @mfgDate, @expDate,
          @qty, @qty, @impPrice,
          @discPct, @destStatus, 0, GETDATE()
        );

        SELECT TOP 1 @destBatchId = id FROM @insDest;
        SET @auditExtra = N' | Nhập kho CN #' + CAST(@toStoreId AS NVARCHAR(10)) + N': +' + CAST(@qty AS NVARCHAR(10)) + N' ĐV vào lô mới ' + @destBatchCode + N' (ID=' + CAST(@destBatchId AS NVARCHAR(10)) + N', HSD=' + CONVERT(VARCHAR(10), @expDate, 23) + N')';
      `;
    } else if (nextStatus === 'CANCELLED') {
      transitionInventorySql = `
        IF @curStatus NOT IN (N'PROPOSED', N'PENDING', N'APPROVED', N'IN_TRANSIT')
          THROW 50002, N'Xung đột trạng thái: Không thể hủy phiếu điều chuyển đã kết thúc!', 1;

        IF @curStatus = N'IN_TRANSIT'
        BEGIN
          DECLARE @cancelWarnDays INT = 7;
          SELECT @cancelWarnDays = COALESCE(p.custom_warning_days, c.default_warning_days, 7)
          FROM dbo.batches b
          INNER JOIN dbo.products p ON b.product_id = p.id
          INNER JOIN dbo.categories c ON p.category_id = c.id
          WHERE b.id = @sourceBatchId;

          UPDATE dbo.batches WITH (UPDLOCK, ROWLOCK)
          SET current_quantity = current_quantity + @qty,
              initial_quantity = CASE
                WHEN current_quantity + @qty > initial_quantity THEN current_quantity + @qty
                ELSE initial_quantity
              END,
              status = CASE
                WHEN status = 'DISPOSED' THEN
                  CASE
                    WHEN expiry_date <= CAST(GETDATE() AS DATE) THEN 'EXPIRED'
                    WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), expiry_date) <= ISNULL(@cancelWarnDays, 7) THEN 'WARNING'
                    ELSE 'ACTIVE'
                  END
                ELSE status
              END
          WHERE id = @sourceBatchId
            AND ISNULL(store_id, 1) = @fromStoreId;

          IF @@ROWCOUNT = 0
            THROW 50003, N'Không thể hoàn trả tồn kho cho lô nguồn khi hủy phiếu đang vận chuyển!', 1;

          SET @auditExtra = N' | Hoàn trả +' + CAST(@qty AS NVARCHAR(10)) + N' ĐV về lô nguồn #' + CAST(@sourceBatchId AS NVARCHAR(10));
        END
      `;
    }

    const sql = `
      BEGIN TRANSACTION;
      BEGIN TRY
        DECLARE @transferId INT = ${transferId},
                @curStatus NVARCHAR(30),
                @fromStoreId INT,
                @toStoreId INT,
                @productId INT,
                @sourceBatchId INT,
                @qty INT,
                @transferCode NVARCHAR(50),
                @destBatchId INT = NULL,
                @destBatchCode NVARCHAR(50) = NULL,
                @auditExtra NVARCHAR(500) = N'';

        SELECT
          @curStatus = UPPER(LTRIM(RTRIM(status))),
          @fromStoreId = from_store_id,
          @toStoreId = to_store_id,
          @productId = product_id,
          @sourceBatchId = source_batch_id,
          @qty = transfer_quantity,
          @transferCode = transfer_code
        FROM dbo.stock_transfers WITH (UPDLOCK, ROWLOCK)
        WHERE id = ${transferId};

        IF @curStatus IS NULL
          THROW 50004, N'Không tìm thấy phiếu điều chuyển!', 1;

        ${transitionInventorySql}

        UPDATE dbo.stock_transfers WITH (UPDLOCK, ROWLOCK)
        SET 
          status = ${safeNextStatus},
          approved_by = CASE WHEN ${safeNextStatus} = N'APPROVED' THEN ${safeUserId} ELSE approved_by END,
          received_at = CASE WHEN ${safeNextStatus} = N'RECEIVED' THEN GETDATE() ELSE received_at END
        WHERE id = ${transferId};

        INSERT INTO dbo.system_audit_logs (user_id, action_type, entity_name, entity_id, description, ip_address, created_at)
        VALUES (
          ${safeUserId},
          N'STOCK_TRANSFER_' + ${safeNextStatus},
          N'StockTransfer',
          @transferCode,
          N'Cập nhật phiếu điều chuyển ' + @transferCode + N' từ ' + @curStatus + N' sang ' + ${safeNextStatus} + @auditExtra + N'. Ghi chú: ' + ${safeNotes},
          N'127.0.0.1',
          GETDATE()
        );

        COMMIT TRANSACTION;

        SELECT 
          st.id,
          st.transfer_code AS transferCode,
          st.from_store_id AS fromStoreId,
          st.to_store_id AS toStoreId,
          st.product_id AS productId,
          st.source_batch_id AS sourceBatchId,
          st.transfer_quantity AS transferQuantity,
          st.shipping_cost AS shippingCost,
          st.status,
          st.ai_recommendation_note AS aiRecommendationNote,
          st.approved_by AS approvedById,
          st.created_at AS createdAt,
          st.received_at AS receivedAt,
          @destBatchId AS destinationBatchId,
          @destBatchCode AS destinationBatchCode
        FROM dbo.stock_transfers st
        WHERE st.id = ${transferId}
        FOR JSON PATH;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
      END CATCH;
    `;

    try {
      const updated = await SqlConnection.queryJson(sql);
      return updated[0] || null;
    } catch (sqlErr) {
      const msg = sqlErr.message || '';
      if (msg.includes('50002') || msg.includes('50003')) {
        const cleanMsg = msg.includes('50002')
          ? 'Xung đột trạng thái phiếu điều chuyển hoặc đã được cập nhật đồng thời!'
          : 'Tồn kho lô nguồn không đủ khả dụng, đã hết hạn hoặc sai ràng buộc để thực hiện thao tác điều chuyển!';
        const conflictErr = new Error(cleanMsg);
        conflictErr.statusCode = 409;
        conflictErr.code = msg.includes('50002') ? 'ERR_INVALID_TRANSFER_TRANSITION' : 'ERR_INSUFFICIENT_TRANSFER_STOCK';
        throw conflictErr;
      }
      if (msg.includes('50004')) {
        const notFoundErr = new Error('Không tìm thấy phiếu điều chuyển hoặc lô hàng nguồn!');
        notFoundErr.statusCode = 404;
        throw notFoundErr;
      }
      throw sqlErr;
    }
  }
}

module.exports = new SqlStockTransferRepository();
