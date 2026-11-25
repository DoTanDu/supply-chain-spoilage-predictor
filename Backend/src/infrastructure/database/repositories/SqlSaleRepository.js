// src/infrastructure/database/repositories/SqlSaleRepository.js
const SqlConnection = require('../sqlConnection');
const ISaleRepository = require('../../../domain/interfaces/ISaleRepository');
const { formatLocalDateYMD } = require('../../../domain/utils/dateUtils');
const FefoAllocationPolicy = require('../../../domain/services/FefoAllocationPolicy');
const LightGbmForecastEngine = require('../../services/LightGbmForecastEngine');

class SqlSaleRepository extends ISaleRepository {
  /**
   * Thực thi giao dịch Bán lẻ POS an toàn với SQL Server Transaction và khóa UPDLOCK (Rule 2 & Rule 3)
   */
  async executeFefoCheckoutTransaction({ saleOrder, batchDeductions = [] }) {
    const txnCode = SqlConnection.escapeSql(saleOrder.transactionCode);
    const safeCashier = saleOrder.cashierId ? Number(saleOrder.cashierId) : 'NULL';
    const safeDate = SqlConnection.escapeSql(formatLocalDateYMD(saleOrder.saleDate || new Date()));
    const safeDayOfWeek = SqlConnection.escapeSql(saleOrder.dayOfWeek || 'MONDAY');
    const safeWeather = SqlConnection.escapeSql(saleOrder.weather || 'SUNNY');
    const safeHoliday = saleOrder.isHoliday ? 1 : 0;

    // Chuẩn bị các câu lệnh UPDATE batches và INSERT sales_history
    const batchUpdates = [];
    const salesInserts = [];
    const items = (saleOrder.items && saleOrder.items.length) ? saleOrder.items : batchDeductions;

    for (const item of items) {
      const bId = Number(item.batchId);
      const pId = Number(item.productId);
      const qty = Number(item.quantitySold);
      const price = Number(item.salePrice);
      const total = Number(item.lineTotal);

      // 1. Khóa dòng và trừ số lượng tồn kho (bảo vệ chống âm kho & tranh chấp đồng thời bằng UPDLOCK, ROWLOCK - Rule 3, Rule 5 & Mục 10)
      batchUpdates.push(`
        UPDATE batches WITH (UPDLOCK, ROWLOCK)
        SET current_quantity = current_quantity - ${qty}
        WHERE id = ${bId}
          AND current_quantity >= ${qty}
          AND status IN ('ACTIVE', 'WARNING')
          AND expiry_date > CAST(GETDATE() AS DATE);
        IF @@ROWCOUNT = 0
          THROW 50001, N'Tranh chấp tồn kho đồng thời (Rule 3): Lô hàng không còn đủ số lượng khả dụng để xuất bán!', 1;
      `);

      const safeStoreId = Number(saleOrder.storeId || 1);
      // 2. Chèn bản ghi lịch sử bán hàng đích danh theo mã lô & chi nhánh
      salesInserts.push(`
        INSERT INTO sales_history (
          transaction_code, store_id, product_id, batch_id, quantity_sold, sale_price,
          total_amount, sale_date, day_of_week, weather, is_holiday,
          cashier_id, created_at
        )
        VALUES (
          ${txnCode}, ${safeStoreId}, ${pId}, ${bId}, ${qty}, ${price},
          ${total}, ${safeDate}, ${safeDayOfWeek}, ${safeWeather}, ${safeHoliday},
          ${safeCashier}, GETDATE()
        );
      `);
    }

    // Ghép vào 1 Transaction T-SQL nguyên khối
    const transactionSql = `
      BEGIN TRANSACTION;
      BEGIN TRY
        ${batchUpdates.join('\n')}
        ${salesInserts.join('\n')}
        COMMIT TRANSACTION;
        SELECT 'SUCCESS' AS resultStatus;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
      END CATCH;
    `;

    try {
      await SqlConnection.executeSql(transactionSql);
    } catch (sqlErr) {
      const msg = sqlErr.message || '';
      if (msg.includes('50001') || msg.includes('Tranh chấp tồn kho đồng thời')) {
        const conflictErr = new Error('Tranh chấp tồn kho đồng thời (Rule 3): Lô hàng không còn đủ số lượng khả dụng để xuất bán!');
        conflictErr.statusCode = 409;
        conflictErr.code = 'ERR_CONCURRENCY_CONFLICT';
        throw conflictErr;
      }
      throw sqlErr;
    }
    return {
      success: true,
      transactionCode: saleOrder.transactionCode,
      totalItems: saleOrder.getTotalQuantity(),
      totalAmount: saleOrder.getTotalAmount()
    };
  }

  /**
   * Lấy lịch sử số lượng bán trong N ngày gần nhất (phục vụ dự báo ROP Rule 8)
   */
  async getSalesHistoryByProduct(productId, days = 14, storeId = null) {
    const safeProdId = Number(productId);
    const safeDays = Number(days);
    const hasStore = storeId && Number(storeId) > 0;
    const storeFilter = hasStore ? `AND store_id = ${Number(storeId)}` : '';

    const sql = `
      SELECT 
        sale_date AS saleDate,
        SUM(quantity_sold) AS dailyQuantity
      FROM sales_history
      WHERE product_id = ${safeProdId}
        AND sale_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))
        ${storeFilter}
      GROUP BY sale_date
      ORDER BY sale_date ASC;
    `;
    const rows = await SqlConnection.queryJson(sql);
    return rows.map(r => Number(r.dailyQuantity || 0));
  }

  /**
   * Lấy lịch sử số lượng bán N ngày của toàn bộ sản phẩm trong 1 truy vấn duy nhất (có thể lọc theo storeId)
   */
  async getSalesHistoryAllProducts(days = 14, storeId = null) {
    const statsMap = await this.getSalesHistoryStatsAllProducts(days, storeId);
    const map = {};
    for (const [pId, stat] of Object.entries(statsMap)) {
      map[pId] = stat.dailyQuantities;
    }
    return map;
  }

  /**
   * Lấy thống kê chi tiết lịch sử bán N ngày (chuỗi sản lượng ngày, số ngày có giao dịch, số giao dịch)
   */
  async getSalesHistoryStatsAllProducts(days = 14, storeId = null) {
    const safeDays = Number(days);
    const hasStore = storeId && Number(storeId) > 0;
    const storeFilter = hasStore ? `AND store_id = ${Number(storeId)}` : '';
    const sql = `
      SELECT 
        product_id AS productId,
        CONVERT(VARCHAR(10), sale_date, 23) AS saleDay,
        SUM(quantity_sold) AS dailyQuantity,
        COUNT(*) AS txCount
      FROM sales_history
      WHERE sale_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))
        ${storeFilter}
      GROUP BY product_id, CONVERT(VARCHAR(10), sale_date, 23)
      ORDER BY product_id ASC, saleDay ASC;
    `;
    const rows = await SqlConnection.queryJson(sql);
    const map = {};
    for (const r of rows) {
      const pId = Number(r.productId);
      if (!map[pId]) {
        map[pId] = {
          dailyQuantities: [],
          historyDaysCount: 0,
          transactionCount: 0,
          totalUnitsSold: 0
        };
      }
      const qty = Number(r.dailyQuantity || 0);
      map[pId].dailyQuantities.push(qty);
      map[pId].historyDaysCount += 1;
      map[pId].transactionCount += Number(r.txCount || 0);
      map[pId].totalUnitsSold += qty;
    }
    return map;
  }

  /**
   * Lấy Top sản phẩm có tốc độ bán nhanh nhất (Mục 11.2 Đặc tả SSOT)
   */
  async getTopSellingProducts(limit = 5, storeId = null) {
    const hasStore = storeId && String(storeId).toUpperCase() !== 'ALL' && !isNaN(Number(storeId));
    const storeFilter = hasStore ? `WHERE ISNULL(sh.store_id, 1) = ${Number(storeId)}` : '';
    const sql = `
      SELECT TOP (${Number(limit)})
        p.id AS productId,
        p.sku AS productSku,
        p.name AS productName,
        p.unit AS unit,
        c.name AS categoryName,
        COALESCE(SUM(sh.quantity_sold), 0) AS totalQuantitySold,
        COALESCE(SUM(sh.total_amount), 0) AS totalRevenue,
        COUNT(DISTINCT sh.transaction_code) AS orderCount,
        CAST(ROUND(COALESCE(SUM(sh.quantity_sold), 0) * 1.0 / 14.0, 2) AS DECIMAL(10, 2)) AS dailyVelocity
      FROM sales_history sh
      INNER JOIN products p ON sh.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${storeFilter}
      GROUP BY p.id, p.sku, p.name, p.unit, c.name
      ORDER BY SUM(sh.quantity_sold) DESC, SUM(sh.total_amount) DESC;
    `;
    return await SqlConnection.queryJson(sql);
  }

  /**
   * Lấy danh sách giao dịch bán lẻ gần nhất (hỗ trợ lọc theo storeId)
   */
  async getRecentTransactions(limit = 50, storeId = null) {
    let storeWhere = '1=1';
    if (storeId && String(storeId).toUpperCase() !== 'ALL' && !isNaN(Number(storeId))) {
      storeWhere = `COALESCE(sh.store_id, b.store_id, 1) = ${Number(storeId)}`;
    }
    const sql = `
      SELECT TOP (${Number(limit)})
        sh.id,
        sh.transaction_code AS transactionCode,
        COALESCE(sh.store_id, b.store_id, 1) AS storeId,
        sp.store_code AS storeCode,
        sp.store_name AS storeName,
        sh.product_id AS productId,
        p.name AS productName,
        p.sku AS productSku,
        p.unit AS unit,
        sh.batch_id AS batchId,
        b.batch_code AS batchCode,
        b.expiry_date AS expiryDate,
        b.discount_percent AS discountPercent,
        sh.quantity_sold AS quantitySold,
        sh.sale_price AS salePrice,
        sh.total_amount AS totalAmount,
        sh.sale_date AS saleDate,
        sh.day_of_week AS dayOfWeek,
        sh.weather,
        sh.is_holiday AS isHoliday,
        u.full_name AS cashierName,
        sh.created_at AS createdAt
      FROM sales_history sh
      INNER JOIN products p ON sh.product_id = p.id
      INNER JOIN batches b ON sh.batch_id = b.id
      LEFT JOIN store_profile sp ON COALESCE(sh.store_id, b.store_id, 1) = sp.id
      LEFT JOIN users u ON sh.cashier_id = u.id
      WHERE ${storeWhere}
      ORDER BY sh.id DESC;
    `;
    return await SqlConnection.queryJson(sql);
  }

  /**
   * Nhập hàng loạt dữ liệu lịch sử bán hàng POS từ Excel/CSV (Phase 6)
   * Có phân bổ trừ kho FEFO thật với khóa dòng UPDLOCK, ROWLOCK và từ chối dòng vượt tồn khả dụng.
   */
  async importPosSalesRows(rows = [], cashierId = 1, enforcedStoreId = null) {
    if (!Array.isArray(rows) || rows.length === 0) {
      const err = new Error('Danh sách dữ liệu nhập POS không được để trống!');
      err.statusCode = 400;
      throw err;
    }

    const metaSql = `
      SELECT id, sku, name, selling_price AS sellingPrice, CAST(is_active AS BIT) AS isActive FROM products;
    `;
    const batchSql = `
      SELECT
        id, batch_code AS batchCode, product_id AS productId, ISNULL(store_id, 1) AS storeId,
        expiry_date AS expiryDate, current_quantity AS currentQuantity,
        ISNULL(discount_percent, 0) AS discountPercent,
        CAST(import_price AS FLOAT) AS importPrice, status
      FROM batches
      WHERE current_quantity > 0
        AND status IN ('ACTIVE', 'WARNING')
        AND expiry_date > CAST(GETDATE() AS DATE)
      ORDER BY expiry_date ASC, id ASC;
    `;
    const storeSql = `
      SELECT id, store_code AS storeCode, ISNULL(status, 'OPEN') AS status FROM store_profile;
    `;
    const [products, batches, stores] = await Promise.all([
      SqlConnection.queryJson(metaSql),
      SqlConnection.queryJson(batchSql),
      SqlConnection.queryJson(storeSql)
    ]);

    const skuMap = {};
    const prodIdMap = {};
    for (const p of (products || [])) {
      skuMap[String(p.sku || '').toUpperCase().trim()] = p;
      prodIdMap[Number(p.id)] = p;
    }

    const storeCodeMap = {};
    const storeStatusMap = {};
    for (const s of (stores || [])) {
      storeCodeMap[String(s.storeCode || '').toUpperCase().trim()] = Number(s.id);
      storeStatusMap[Number(s.id)] = String(s.status || 'OPEN').toUpperCase();
    }

    const scopedSid = enforcedStoreId !== null && enforcedStoreId !== undefined ? Number(enforcedStoreId) : null;
    if (scopedSid) {
      for (let i = 0; i < rows.length; i++) {
        const raw = rows[i] || {};
        const rawSid = raw.storeId !== undefined && raw.storeId !== null ? String(raw.storeId).trim() : '';
        const rawSCode = String(raw.storeCode || '').toUpperCase().trim();
        if (rawSid !== '') {
          if (rawSid.toUpperCase() === 'ALL' || Number(rawSid) !== scopedSid) {
            const err = new Error(`Từ chối nhập dữ liệu liên chi nhánh (403 Forbidden) tại dòng ${i + 1}: Bạn chỉ được phép nhập doanh số cho Chi nhánh #${scopedSid}.`);
            err.statusCode = 403;
            err.code = 'ERR_STORE_SCOPE_FORBIDDEN';
            throw err;
          }
        }
        if (rawSCode !== '') {
          const mappedSid = storeCodeMap[rawSCode];
          if (!mappedSid || mappedSid !== scopedSid) {
            const err = new Error(`Từ chối nhập dữ liệu liên chi nhánh (403 Forbidden) tại dòng ${i + 1}: Mã cửa hàng [${rawSCode}] không thuộc Chi nhánh #${scopedSid}.`);
            err.statusCode = 403;
            err.code = 'ERR_STORE_SCOPE_FORBIDDEN';
            throw err;
          }
        }
      }
    }

    // Bản sao working batches để trừ tuần tự chính xác khi nhiều dòng CSV trùng cùng 1 SKU tại cùng chi nhánh
    const workingBatchesByKey = new Map();
    for (const b of (batches || [])) {
      const k = `${Number(b.storeId || 1)}_${Number(b.productId)}`;
      if (!workingBatchesByKey.has(k)) workingBatchesByKey.set(k, []);
      workingBatchesByKey.get(k).push({ ...b, currentQuantity: Number(b.currentQuantity || 0) });
    }

    const batchUpdates = [];
    const salesInserts = [];
    const errors = [];
    let importedRowsCount = 0;
    let totalUnitsDeducted = 0;
    const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const batchStamp = Date.now().toString().slice(-6);

    rows.forEach((raw, idx) => {
      const rowNum = idx + 1;
      const rawSku = String(raw.sku || raw.productSku || '').toUpperCase().trim();
      const prod = rawSku ? skuMap[rawSku] : prodIdMap[Number(raw.productId)];
      if (!prod) {
        errors.push({ row: rowNum, sku: rawSku, message: `Mã SKU [${rawSku || raw.productId}] không tồn tại trong Danh mục Sản phẩm.` });
        return;
      }
      if (prod.isActive === false || prod.isActive === 0) {
        errors.push({ row: rowNum, sku: prod.sku, message: `Sản phẩm [${prod.sku}] đã ngừng kinh doanh.` });
        return;
      }

      const qty = Number(raw.quantitySold ?? raw.quantity ?? 0);
      if (!Number.isInteger(qty) || qty <= 0) {
        errors.push({ row: rowNum, sku: prod.sku, message: `Số lượng bán (${raw.quantitySold ?? raw.quantity}) phải là số nguyên dương (> 0).` });
        return;
      }

      const rawStoreCode = String(raw.storeCode || '').toUpperCase().trim();
      const targetStoreId = scopedSid || Number(raw.storeId) || storeCodeMap[rawStoreCode] || 1;
      const storeSt = storeStatusMap[targetStoreId] || 'OPEN';
      if (storeSt !== 'OPEN') {
        errors.push({ row: rowNum, sku: prod.sku, message: `Chi nhánh #${targetStoreId} đang ở trạng thái [${storeSt}], khóa xuất bán POS.` });
        return;
      }

      const explicitPrice = (raw.salePrice !== undefined && raw.salePrice !== null && String(raw.salePrice).trim() !== '')
        ? Number(raw.salePrice)
        : null;
      const fallbackSellingPrice = explicitPrice !== null ? explicitPrice : Number(prod.sellingPrice);
      if (!Number.isFinite(fallbackSellingPrice) || fallbackSellingPrice <= 0) {
        errors.push({ row: rowNum, sku: prod.sku, message: `Sản phẩm [${prod.sku}] không có giá bán hợp lệ.` });
        return;
      }

      const storeProdBatches = workingBatchesByKey.get(`${targetStoreId}_${Number(prod.id)}`) || [];
      let allocationResult;
      try {
        allocationResult = FefoAllocationPolicy.allocate({
          productId: prod.id,
          productName: prod.name,
          requestedQuantity: qty,
          sellingPrice: Number(prod.sellingPrice || fallbackSellingPrice),
          availableBatches: storeProdBatches
        });
      } catch (allocErr) {
        errors.push({ row: rowNum, sku: prod.sku, message: allocErr.message });
        return;
      }

      const parsedDate = raw.saleDate ? new Date(raw.saleDate) : new Date();
      const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      const dateStr = formatLocalDateYMD(validDate);
      const dow = daysOfWeek[validDate.getDay()] || 'MONDAY';
      const txnCode = raw.transactionCode
        ? String(raw.transactionCode).trim()
        : `IMP-POS-${dateStr.replace(/-/g, '')}-${batchStamp}-${rowNum}`;

      for (const line of allocationResult.allocations) {
        const targetWorkingBatch = storeProdBatches.find(b => Number(b.id) === Number(line.batchId));
        if (targetWorkingBatch) {
          targetWorkingBatch.currentQuantity -= Number(line.quantityAllocated);
        }

        const unitPrice = explicitPrice !== null ? explicitPrice : Number(line.unitPrice);
        const totalAmount = Math.round(Number(line.quantityAllocated) * unitPrice);

        batchUpdates.push(`
          UPDATE batches WITH (UPDLOCK, ROWLOCK)
          SET current_quantity = current_quantity - ${Number(line.quantityAllocated)}
          WHERE id = ${Number(line.batchId)}
            AND current_quantity >= ${Number(line.quantityAllocated)}
            AND status IN ('ACTIVE', 'WARNING')
            AND expiry_date > CAST(GETDATE() AS DATE);
          IF @@ROWCOUNT = 0
            THROW 50001, N'Tranh chấp tồn kho đồng thời khi đồng bộ POS CSV (Rule 3): Lô hàng không còn đủ tồn khả dụng!', 1;
        `);

        salesInserts.push(`
          INSERT INTO sales_history (
            transaction_code, store_id, product_id, batch_id, quantity_sold,
            sale_price, total_amount, sale_date, day_of_week, weather, is_holiday,
            cashier_id, created_at
          ) VALUES (
            ${SqlConnection.escapeSql(txnCode)},
            ${targetStoreId},
            ${Number(prod.id)},
            ${Number(line.batchId)},
            ${Number(line.quantityAllocated)},
            ${unitPrice},
            ${totalAmount},
            ${SqlConnection.escapeSql(dateStr)},
            ${SqlConnection.escapeSql(dow)},
            N'NORMAL',
            0,
            ${Number(cashierId || 1)},
            GETDATE()
          );
        `);
      }

      importedRowsCount += 1;
      totalUnitsDeducted += qty;
    });

    if (salesInserts.length === 0) {
      const err = new Error('Không có dòng dữ liệu hợp lệ nào để nạp & trừ kho FEFO vào hệ thống!');
      err.statusCode = 400;
      err.details = errors;
      throw err;
    }

    const txSql = `
      BEGIN TRANSACTION;
      BEGIN TRY
        ${batchUpdates.join('\n')}
        ${salesInserts.join('\n')}
        COMMIT TRANSACTION;
        SELECT ${importedRowsCount} AS importedCount FOR JSON PATH;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
      END CATCH;
    `;
    await SqlConnection.queryJson(txSql);
    LightGbmForecastEngine.clearCache();

    return {
      importedCount: importedRowsCount,
      rejectedCount: errors.length,
      totalUnitsDeducted,
      totalBatchLines: salesInserts.length,
      errors
    };
  }

  /**
   * Tính tổng doanh số bán lẻ trong ngày hôm nay cho Dashboard
   */
  async getTodaySalesSummary(storeId = null) {
    const hasStore = storeId && String(storeId).toUpperCase() !== 'ALL' && !isNaN(Number(storeId));
    const storeFilter = hasStore ? `AND ISNULL(store_id, 1) = ${Number(storeId)}` : '';
    const sql = `
      SELECT 
        COUNT(DISTINCT transaction_code) AS todayTransactionsCount,
        COALESCE(SUM(quantity_sold), 0) AS todayTotalQuantity,
        COALESCE(SUM(total_amount), 0) AS todayTotalRevenue
      FROM sales_history
      WHERE sale_date = CAST(GETDATE() AS DATE)
        ${storeFilter};
    `;
    const rows = await SqlConnection.queryJson(sql);
    return rows.length > 0 ? rows[0] : { todayTransactionsCount: 0, todayTotalQuantity: 0, todayTotalRevenue: 0 };
  }

  /**
   * Lấy tổng doanh số và số hóa đơn bán lẻ tích lũy toàn thời gian (phục vụ tính Spoilage Rate % Mục 11.1)
   */
  async getTotalSalesSummary(storeId = null) {
    const hasStore = storeId && String(storeId).toUpperCase() !== 'ALL' && !isNaN(Number(storeId));
    const storeFilter = hasStore ? `WHERE ISNULL(store_id, 1) = ${Number(storeId)}` : '';
    const sql = `
      SELECT 
        COUNT(DISTINCT transaction_code) AS totalTransactionsCount,
        COALESCE(SUM(quantity_sold), 0) AS totalQuantitySold,
        COALESCE(SUM(total_amount), 0) AS totalSalesRevenue
      FROM sales_history
      ${storeFilter};
    `;
    const rows = await SqlConnection.queryJson(sql);
    return rows.length > 0 ? rows[0] : { totalTransactionsCount: 0, totalQuantitySold: 0, totalSalesRevenue: 0 };
  }

  /**
   * Lấy xu hướng doanh số bán hàng trong N ngày gần nhất phục vụ biểu đồ Trend
   */
  async getDailySalesTrend(days = 14, storeId = null) {
    const safeDays = Number(days);
    const hasStore = storeId && String(storeId).toUpperCase() !== 'ALL' && !isNaN(Number(storeId));
    const storeFilter = hasStore ? `AND ISNULL(store_id, 1) = ${Number(storeId)}` : '';
    const sql = `
      SELECT 
        CONVERT(VARCHAR(10), sale_date, 23) AS saleDate,
        COALESCE(SUM(total_amount), 0) AS totalRevenue,
        COALESCE(SUM(quantity_sold), 0) AS totalQuantitySold,
        COUNT(DISTINCT transaction_code) AS transactionCount
      FROM sales_history
      WHERE sale_date >= DATEADD(day, -${safeDays - 1}, CAST(GETDATE() AS DATE))
        ${storeFilter}
      GROUP BY sale_date
      ORDER BY sale_date ASC;
    `;
    return await SqlConnection.queryJson(sql);
  }

  /**
   * Truy vấn doanh số thực tế 100% theo 4 ca trực trong ngày từ sales_history
   */
  async getSalesByShift(storeId = null) {
    const hasStore = storeId && String(storeId).toUpperCase() !== 'ALL' && !isNaN(Number(storeId));
    const storeFilter = hasStore ? `WHERE ISNULL(store_id, 1) = ${Number(storeId)}` : '';
    const sql = `
      SELECT 
        CASE 
          WHEN DATEPART(hour, created_at) >= 6 AND DATEPART(hour, created_at) < 11 THEN 'MORNING'
          WHEN DATEPART(hour, created_at) >= 11 AND DATEPART(hour, created_at) < 15 THEN 'NOON'
          WHEN DATEPART(hour, created_at) >= 15 AND DATEPART(hour, created_at) < 19 THEN 'AFTERNOON'
          ELSE 'EVENING'
        END AS shiftCode,
        COUNT(DISTINCT transaction_code) AS billCount,
        COALESCE(SUM(total_amount), 0) AS totalRevenue
      FROM sales_history
      ${storeFilter}
      GROUP BY 
        CASE 
          WHEN DATEPART(hour, created_at) >= 6 AND DATEPART(hour, created_at) < 11 THEN 'MORNING'
          WHEN DATEPART(hour, created_at) >= 11 AND DATEPART(hour, created_at) < 15 THEN 'NOON'
          WHEN DATEPART(hour, created_at) >= 15 AND DATEPART(hour, created_at) < 19 THEN 'AFTERNOON'
          ELSE 'EVENING'
        END;
    `;
    const rows = await SqlConnection.queryJson(sql);
    const shiftMap = {
      MORNING: { shift: 'Ca Sáng (06h - 11h)', revenue: 0, bills: 0 },
      NOON: { shift: 'Ca Trưa (11h - 15h)', revenue: 0, bills: 0 },
      AFTERNOON: { shift: 'Ca Chiều (15h - 19h)', revenue: 0, bills: 0 },
      EVENING: { shift: 'Ca Tối (19h - 22h)', revenue: 0, bills: 0 }
    };
    (rows || []).forEach(r => {
      if (shiftMap[r.shiftCode]) {
        shiftMap[r.shiftCode].revenue = Number(r.totalRevenue || 0);
        shiftMap[r.shiftCode].bills = Number(r.billCount || 0);
      }
    });
    return Object.values(shiftMap);
  }

  /**
   * Truy vấn chi tiết hóa đơn bán lẻ POS theo mã giao dịch (Mục 22.6 Đặc tả SSOT: GET /api/sales/receipt/:txnCode)
   */
  async getReceiptByTxnCode(txnCode) {
    const safeTxn = SqlConnection.escapeSql(String(txnCode || '').trim());
    const sql = `
      SELECT 
        sh.id,
        ISNULL(sh.store_id, 1) AS storeId,
        sh.transaction_code AS transactionCode,
        sh.product_id AS productId,
        p.name AS productName,
        p.sku AS productSku,
        p.unit AS unit,
        sh.batch_id AS batchId,
        b.batch_code AS batchCode,
        b.expiry_date AS expiryDate,
        b.discount_percent AS discountPercent,
        sh.quantity_sold AS quantitySold,
        sh.sale_price AS salePrice,
        sh.total_amount AS totalAmount,
        sh.sale_date AS saleDate,
        sh.day_of_week AS dayOfWeek,
        sh.weather,
        sh.is_holiday AS isHoliday,
        u.id AS cashierId,
        u.full_name AS cashierName,
        sh.created_at AS createdAt
      FROM sales_history sh
      INNER JOIN products p ON sh.product_id = p.id
      INNER JOIN batches b ON sh.batch_id = b.id
      LEFT JOIN users u ON sh.cashier_id = u.id
      WHERE sh.transaction_code = ${safeTxn}
      ORDER BY sh.id ASC;
    `;
    const rows = await SqlConnection.queryJson(sql);
    if (!rows || rows.length === 0) return null;

    const first = rows[0];
    const totalAmount = rows.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);
    const totalQuantity = rows.reduce((sum, r) => sum + Number(r.quantitySold || 0), 0);

    return {
      transactionCode: first.transactionCode,
      storeId: Number(first.storeId || 1),
      saleDate: first.saleDate,
      createdAt: first.createdAt,
      cashierId: first.cashierId,
      cashierName: first.cashierName || 'Thu ngân LHU Mart',
      weather: first.weather,
      isHoliday: Boolean(first.isHoliday),
      totalAmount,
      totalQuantity,
      itemCount: rows.length,
      lines: rows.map(r => ({
        id: r.id,
        productId: r.productId,
        productName: r.productName,
        productSku: r.productSku,
        unit: r.unit,
        batchId: r.batchId,
        batchCode: r.batchCode,
        expiryDate: r.expiryDate,
        discountPercent: Number(r.discountPercent || 0),
        unitPrice: Number(r.salePrice || 0),
        quantitySold: Number(r.quantitySold || 0),
        totalRevenue: Number(r.totalAmount || 0)
      }))
    };
  }
}

module.exports = SqlSaleRepository;
