// src/infrastructure/database/repositories/SqlBatchRepository.js
const SqlConnection = require('../sqlConnection');
const IBatchRepository = require('../../../domain/interfaces/IBatchRepository');

class SqlBatchRepository extends IBatchRepository {
  async findById(id) {
    const sql = `
      SELECT TOP 1 
        id, receipt_id AS receiptId, batch_code AS batchCode, product_id AS productId,
        import_date AS importDate, manufacture_date AS manufactureDate, expiry_date AS expiryDate,
        initial_quantity AS initialQuantity, current_quantity AS currentQuantity,
        import_price AS importPrice, discount_percent AS discountPercent,
        status, is_shelf_rotated AS isShelfRotated, created_at AS createdAt
      FROM batches
      WHERE id = ${Number(id)};
    `;
    const rows = await SqlConnection.queryJson(sql);
    return rows.length > 0 ? rows[0] : null;
  }

  async findByBatchCode(batchCode) {
    const safeCode = SqlConnection.escapeSql(batchCode);
    const sql = `
      SELECT TOP 1 
        id, receipt_id AS receiptId, batch_code AS batchCode, product_id AS productId,
        import_date AS importDate, manufacture_date AS manufactureDate, expiry_date AS expiryDate,
        initial_quantity AS initialQuantity, current_quantity AS currentQuantity,
        import_price AS importPrice, discount_percent AS discountPercent,
        status, is_shelf_rotated AS isShelfRotated, created_at AS createdAt
      FROM batches
      WHERE batch_code = ${safeCode};
    `;
    const rows = await SqlConnection.queryJson(sql);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Truy vấn toàn bộ danh sách các lô của một sản phẩm (kể cả lô đã hết hạn hoặc hết hàng)
   */
  async findByProductId(productId) {
    const sql = `
      SELECT 
        id, batch_code AS batchCode, product_id AS productId,
        import_date AS importDate, manufacture_date AS manufactureDate, expiry_date AS expiryDate,
        initial_quantity AS initialQuantity, current_quantity AS currentQuantity,
        import_price AS importPrice, discount_percent AS discountPercent,
        status, is_shelf_rotated AS isShelfRotated,
        DATEDIFF(day, CAST(GETDATE() AS DATE), expiry_date) AS daysLeft
      FROM batches
      WHERE product_id = ${Number(productId)}
      ORDER BY expiry_date ASC, id ASC;
    `;
    return await SqlConnection.queryJson(sql);
  }

  /**
   * Truy vấn các lô hàng khả dụng theo chuẩn FEFO (Rule 2: ExpiryDate ASC, id ASC)
   */
  async findAvailableByProductIdFefo(productId) {
    const sql = `
      SELECT 
        id, batch_code AS batchCode, product_id AS productId,
        import_date AS importDate, manufacture_date AS manufactureDate, expiry_date AS expiryDate,
        initial_quantity AS initialQuantity, current_quantity AS currentQuantity,
        import_price AS importPrice, discount_percent AS discountPercent,
        status, is_shelf_rotated AS isShelfRotated,
        DATEDIFF(day, CAST(GETDATE() AS DATE), expiry_date) AS daysLeft
      FROM batches WITH (INDEX(IX_Batches_FEFO))
      WHERE product_id = ${Number(productId)}
        AND status IN ('ACTIVE', 'WARNING')
        AND current_quantity > 0
        AND expiry_date >= CAST(GETDATE() AS DATE)
      ORDER BY expiry_date ASC, id ASC;
    `;
    return await SqlConnection.queryJson(sql);
  }

  /**
   * Truy vấn danh sách toàn bộ các lô kết hợp View 3 màu cảnh báo và bộ lọc
   */
  async findAllWithAlerts(filter = {}) {
    // Rule 5 SSOT: Tự động khóa cứng các lô có DaysLeft <= 0 sang trạng thái EXPIRED
    await SqlConnection.executeSql(`
      UPDATE batches
      SET status = 'EXPIRED'
      WHERE expiry_date <= CAST(GETDATE() AS DATE)
        AND status IN ('ACTIVE', 'WARNING')
        AND current_quantity > 0;
    `);

    let whereClauses = ['1=1'];

    if (filter.alertColor) {
      whereClauses.push(`v.alert_color = ${SqlConnection.escapeSql(filter.alertColor.toUpperCase())}`);
    }
    if (filter.status) {
      whereClauses.push(`v.status = ${SqlConnection.escapeSql(filter.status.toUpperCase())}`);
    }
    if (filter.categoryCode) {
      whereClauses.push(`v.category_code = ${SqlConnection.escapeSql(filter.categoryCode)}`);
    }
    if (filter.storeId && String(filter.storeId).toUpperCase() !== 'ALL') {
      whereClauses.push(`ISNULL(b.store_id, 1) = ${Number(filter.storeId)}`);
    }
    if (filter.search) {
      const safeSearch = String(filter.search).replace(/'/g, "''");
      whereClauses.push(`(v.product_name LIKE N'%${safeSearch}%' OR v.batch_code LIKE N'%${safeSearch}%' OR v.product_sku LIKE N'%${safeSearch}%')`);
    }

    const sql = `
      SELECT 
        v.batch_id AS id,
        v.batch_code AS batchCode,
        v.product_id AS productId,
        v.product_sku AS productSku,
        v.product_name AS productName,
        p.unit AS unit,
        ISNULL(b.store_id, 1) AS storeId,
        ISNULL(sp.store_code, N'RETAIL-STORE-01') AS storeCode,
        ISNULL(sp.store_name, N'Cửa hàng Bán lẻ Tiện lợi LHU Mart') AS storeName,
        v.category_name AS categoryName,
        v.category_code AS categoryCode,
        CONVERT(VARCHAR(10), v.import_date, 23) AS importDate,
        CONVERT(VARCHAR(10), v.manufacture_date, 23) AS manufactureDate,
        CONVERT(VARCHAR(10), DATEADD(day, -ISNULL(v.warning_threshold_days, 7), v.expiry_date), 23) AS alertDate,
        CONVERT(VARCHAR(10), DATEADD(day, -3, v.expiry_date), 23) AS removalDate,
        CONVERT(VARCHAR(10), DATEADD(day, -1, v.expiry_date), 23) AS bestBeforeDate,
        CONVERT(VARCHAR(10), v.expiry_date, 23) AS expiryDate,
        v.initial_quantity AS initialQuantity,
        v.current_quantity AS currentQuantity,
        v.import_price AS importPrice,
        v.selling_price AS sellingPrice,
        v.discount_percent AS discountPercent,
        v.discounted_price AS discountedPrice,
        v.is_shelf_rotated AS isShelfRotated,
        v.status AS dbStatus,
        v.days_left AS daysLeft,
        v.total_shelf_life_days AS totalShelfLifeDays,
        v.rsl_percent AS rslPercent,
        v.warning_threshold_days AS warningThresholdDays,
        v.alert_color AS alertColor,
        v.total_inventory_cost AS totalInventoryCost,
        v.at_risk_cost AS atRiskCost
      FROM vw_Batches_ShelfLife_Alerts v
      LEFT JOIN products p ON v.product_id = p.id
      LEFT JOIN batches b ON v.batch_id = b.id
      LEFT JOIN store_profile sp ON ISNULL(b.store_id, 1) = sp.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY v.days_left ASC, v.batch_id ASC;
    `;
    const rows = await SqlConnection.queryJson(sql);
    return (rows || []).map(row => {
      const currentQty = Number(row.currentQuantity || 0);
      const discPct = Number(row.discountPercent || 0);
      const impPrice = Number(row.importPrice || 0);
      const sellPrice = Number(row.sellingPrice || 0);
      const daysLeftNum = Number(row.daysLeft);
      const warnDays = Number(row.warningThresholdDays || 7);
      const isDisposed = row.dbStatus === 'DISPOSED' || currentQty === 0;
      const alertColor = isDisposed ? 'DISPOSED' : (row.alertColor || 'GREEN');

      let uiStatus = 'SAFE';
      let lifecycleState = 'SAFE';
      if (isDisposed) {
        uiStatus = 'DISPOSED';
        lifecycleState = 'DISPOSED';
      } else if (alertColor === 'EXPIRED' || row.dbStatus === 'EXPIRED' || daysLeftNum <= 0) {
        uiStatus = 'EXPIRED';
        lifecycleState = 'EXPIRED';
      } else if (alertColor === 'RED') {
        uiStatus = 'CRITICAL';
        lifecycleState = 'CRITICAL';
      } else if (alertColor === 'YELLOW') {
        uiStatus = 'WARNING';
        lifecycleState = 'NEARING_EXPIRY';
      }

      // Wasteless Dynamic Micro-markdown formula: RiskQty = max(0, Q_avail - v_sales * DaysLeft)
      const estDailyVelocity = Math.max(2, Math.round(Number(row.initialQuantity || 30) / Math.max(7, Number(row.totalShelfLifeDays || 14))));
      const riskQuantity = daysLeftNum > 0
        ? Math.max(0, currentQty - estDailyVelocity * daysLeftNum)
        : currentQty;

      let suggestedMarkdownPercent = 0;
      if (lifecycleState === 'CRITICAL') {
        suggestedMarkdownPercent = riskQuantity > currentQty * 0.5 ? 50 : 40;
      } else if (lifecycleState === 'NEARING_EXPIRY') {
        const rawRate = 0.3 * (1 - daysLeftNum / Math.max(1, warnDays)) + 0.2 * (riskQuantity / Math.max(1, currentQty));
        suggestedMarkdownPercent = rawRate >= 0.22 ? 30 : 15;
      }

      const effectiveDisc = discPct > 0 ? discPct : suggestedMarkdownPercent;
      const expectedRescuedRevenue = Math.round(currentQty * sellPrice * (1 - effectiveDisc / 100));

      return {
        ...row,
        unit: row.unit || 'Hộp',
        category: row.categoryName || 'FMCG Tiêu chuẩn',
        currentQuantity: currentQty,
        quantity: currentQty,
        importPrice: impPrice,
        costPrice: impPrice,
        sellingPrice: sellPrice,
        discountPercent: discPct,
        isDiscounted: discPct > 0,
        discountedPrice: Number(row.discountedPrice || Math.round(sellPrice * (1 - discPct / 100))),
        isShelfRotated: Boolean(row.isShelfRotated),
        dbStatus: row.dbStatus,
        status: uiStatus,
        lifecycleState,
        daysLeft: daysLeftNum,
        rslPercent: Math.max(0, Math.min(100, Math.round(Number(row.rslPercent || 0)))),
        warningThresholdDays: warnDays,
        alertColor: alertColor,
        totalInventoryCost: Number(row.totalInventoryCost || 0),
        atRiskCost: Number(row.atRiskCost || 0),
        estDailyVelocity,
        riskQuantity,
        suggestedMarkdownPercent,
        expectedRescuedRevenue
      };
    });
  }

  /**
   * Tạo lô hàng mới khi nhận hàng từ DC (Rule 7)
   */
  async create({
    receiptId = null,
    batchCode,
    productId,
    importDate,
    manufactureDate,
    expiryDate,
    initialQuantity,
    importPrice,
    discountPercent = 0,
    status = 'ACTIVE'
  }) {
    const safeReceipt = receiptId ? Number(receiptId) : 'NULL';
    const safeCode = SqlConnection.escapeSql(batchCode);
    const safeProd = Number(productId);
    const safeImpDate = SqlConnection.escapeSql(new Date(importDate).toISOString().slice(0, 10));
    const safeMfgDate = SqlConnection.escapeSql(new Date(manufactureDate).toISOString().slice(0, 10));
    const safeExpDate = SqlConnection.escapeSql(new Date(expiryDate).toISOString().slice(0, 10));
    const qty = Number(initialQuantity);
    const price = Number(importPrice);
    const disc = Number(discountPercent || 0);
    const safeStatus = SqlConnection.escapeSql(status || 'ACTIVE');

    const sql = `
      DECLARE @tmpBatch TABLE (id INT, batchCode NVARCHAR(100));
      INSERT INTO batches (
        receipt_id, batch_code, product_id, import_date, manufacture_date,
        expiry_date, initial_quantity, current_quantity, import_price,
        discount_percent, status, is_shelf_rotated, created_at
      )
      OUTPUT INSERTED.id, INSERTED.batch_code INTO @tmpBatch
      VALUES (
        ${safeReceipt}, ${safeCode}, ${safeProd}, ${safeImpDate}, ${safeMfgDate},
        ${safeExpDate}, ${qty}, ${qty}, ${price},
        ${disc}, ${safeStatus}, 0, GETDATE()
      );
      SELECT id, batchCode FROM @tmpBatch FOR JSON PATH;
    `;
    const rows = await SqlConnection.queryJson(sql);
    return rows && rows.length ? rows[0] : null;
  }

  /**
   * Cập nhật số lượng tồn hiện tại của lô hàng (Rule 3: Chống âm kho)
   */
  async updateCurrentQuantity(batchId, newQuantity) {
    const safeId = Number(batchId);
    const safeQty = Number(newQuantity);
    const sql = `
      UPDATE batches
      SET current_quantity = ${safeQty},
          status = CASE WHEN ${safeQty} = 0 THEN 'DISPOSED' ELSE status END
      WHERE id = ${safeId};
    `;
    await SqlConnection.executeSql(sql);
    return true;
  }

  /**
   * Kích hoạt Quick Markdown xả hàng (Rule 10)
   */
  async updateDiscount(batchId, discountPercent) {
    const safeId = Number(batchId);
    const safePct = Number(discountPercent);
    const newStatus = safePct > 0 ? 'WARNING' : 'ACTIVE';

    const sql = `
      UPDATE batches
      SET discount_percent = ${safePct},
          status = CASE WHEN status = 'EXPIRED' THEN 'EXPIRED' ELSE '${newStatus}' END
      WHERE id = ${safeId};
    `;
    await SqlConnection.executeSql(sql);
    return true;
  }

  /**
   * Xác nhận hoàn tất SOP đảo kệ 5 bước (Rule 10)
   */
  async confirmShelfRotation(batchId) {
    const safeId = Number(batchId);
    const sql = `
      UPDATE batches
      SET is_shelf_rotated = 1
      WHERE id = ${safeId};
    `;
    await SqlConnection.executeSql(sql);
    return true;
  }

  async updateStatus(batchId, status) {
    const safeId = Number(batchId);
    const safeStatus = SqlConnection.escapeSql(status);
    const sql = `
      UPDATE batches
      SET status = ${safeStatus}
      WHERE id = ${safeId};
    `;
    await SqlConnection.executeSql(sql);
    return true;
  }
}

module.exports = SqlBatchRepository;
