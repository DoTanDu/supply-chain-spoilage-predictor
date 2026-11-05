// src/infrastructure/database/repositories/SqlSaleRepository.js
const SqlConnection = require('../sqlConnection');
const ISaleRepository = require('../../../domain/interfaces/ISaleRepository');

class SqlSaleRepository extends ISaleRepository {
  /**
   * Thực thi giao dịch Bán lẻ POS an toàn với SQL Server Transaction và khóa UPDLOCK (Rule 2 & Rule 3)
   */
  async executeFefoCheckoutTransaction({ saleOrder, batchDeductions = [] }) {
    const txnCode = SqlConnection.escapeSql(saleOrder.transactionCode);
    const safeCashier = saleOrder.cashierId ? Number(saleOrder.cashierId) : 'NULL';
    const safeDate = SqlConnection.escapeSql(new Date(saleOrder.saleDate || new Date()).toISOString().slice(0, 10));
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

      // 1. Khóa dòng và trừ số lượng tồn kho (bảo vệ chống âm kho & tranh chấp đồng thời bằng UPDLOCK, ROWLOCK - Rule 3 & Mục 10)
      batchUpdates.push(`
        UPDATE batches WITH (UPDLOCK, ROWLOCK)
        SET current_quantity = current_quantity - ${qty}
        WHERE id = ${bId} AND current_quantity >= ${qty} AND status IN ('ACTIVE', 'WARNING');
        IF @@ROWCOUNT = 0
          THROW 50001, N'Tranh chấp tồn kho đồng thời (Rule 3): Lô hàng không còn đủ số lượng khả dụng để xuất bán!', 1;
      `);

      // 2. Chèn bản ghi lịch sử bán hàng đích danh theo mã lô
      salesInserts.push(`
        INSERT INTO sales_history (
          transaction_code, product_id, batch_id, quantity_sold, sale_price,
          total_amount, sale_date, day_of_week, weather, is_holiday,
          cashier_id, created_at
        )
        VALUES (
          ${txnCode}, ${pId}, ${bId}, ${qty}, ${price},
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
  async getSalesHistoryByProduct(productId, days = 14) {
    const safeProdId = Number(productId);
    const safeDays = Number(days);

    const sql = `
      SELECT 
        sale_date AS saleDate,
        SUM(quantity_sold) AS dailyQuantity
      FROM sales_history
      WHERE product_id = ${safeProdId}
        AND sale_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))
      GROUP BY sale_date
      ORDER BY sale_date ASC;
    `;
    const rows = await SqlConnection.queryJson(sql);
    return rows.map(r => Number(r.dailyQuantity || 0));
  }

  /**
   * Lấy lịch sử số lượng bán 14 ngày của toàn bộ sản phẩm trong 1 truy vấn duy nhất (Tối ưu hóa tốc độ ROP)
   */
  async getSalesHistoryAllProducts(days = 14) {
    const safeDays = Number(days);
    const sql = `
      SELECT 
        product_id AS productId,
        sale_date AS saleDate,
        SUM(quantity_sold) AS dailyQuantity
      FROM sales_history
      WHERE sale_date >= DATEADD(day, -${safeDays}, CAST(GETDATE() AS DATE))
      GROUP BY product_id, sale_date
      ORDER BY product_id ASC, sale_date ASC;
    `;
    const rows = await SqlConnection.queryJson(sql);
    const map = {};
    for (const r of rows) {
      const pId = Number(r.productId);
      if (!map[pId]) map[pId] = [];
      map[pId].push(Number(r.dailyQuantity || 0));
    }
    return map;
  }

  /**
   * Lấy Top sản phẩm có tốc độ bán nhanh nhất (Mục 11.2 Đặc tả SSOT)
   */
  async getTopSellingProducts(limit = 5) {
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
      GROUP BY p.id, p.sku, p.name, p.unit, c.name
      ORDER BY SUM(sh.quantity_sold) DESC, SUM(sh.total_amount) DESC;
    `;
    return await SqlConnection.queryJson(sql);
  }

  /**
   * Lấy danh sách giao dịch bán lẻ gần nhất
   */
  async getRecentTransactions(limit = 50) {
    const sql = `
      SELECT TOP (${Number(limit)})
        sh.id,
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
        u.full_name AS cashierName,
        sh.created_at AS createdAt
      FROM sales_history sh
      INNER JOIN products p ON sh.product_id = p.id
      INNER JOIN batches b ON sh.batch_id = b.id
      LEFT JOIN users u ON sh.cashier_id = u.id
      ORDER BY sh.id DESC;
    `;
    return await SqlConnection.queryJson(sql);
  }

  /**
   * Tính tổng doanh số bán lẻ trong ngày hôm nay cho Dashboard
   */
  async getTodaySalesSummary() {
    const sql = `
      SELECT 
        COUNT(DISTINCT transaction_code) AS todayTransactionsCount,
        COALESCE(SUM(quantity_sold), 0) AS todayTotalQuantity,
        COALESCE(SUM(total_amount), 0) AS todayTotalRevenue
      FROM sales_history
      WHERE sale_date = CAST(GETDATE() AS DATE);
    `;
    const rows = await SqlConnection.queryJson(sql);
    return rows.length > 0 ? rows[0] : { todayTransactionsCount: 0, todayTotalQuantity: 0, todayTotalRevenue: 0 };
  }

  /**
   * Lấy tổng doanh số và số hóa đơn bán lẻ tích lũy toàn thời gian (phục vụ tính Spoilage Rate % Mục 11.1)
   */
  async getTotalSalesSummary() {
    const sql = `
      SELECT 
        COUNT(DISTINCT transaction_code) AS totalTransactionsCount,
        COALESCE(SUM(quantity_sold), 0) AS totalQuantitySold,
        COALESCE(SUM(total_amount), 0) AS totalSalesRevenue
      FROM sales_history;
    `;
    const rows = await SqlConnection.queryJson(sql);
    return rows.length > 0 ? rows[0] : { totalTransactionsCount: 0, totalQuantitySold: 0, totalSalesRevenue: 0 };
  }

  /**
   * Lấy xu hướng doanh số bán hàng trong N ngày gần nhất phục vụ biểu đồ Trend
   */
  async getDailySalesTrend(days = 14) {
    const safeDays = Number(days);
    const sql = `
      SELECT 
        CONVERT(VARCHAR(10), sale_date, 23) AS saleDate,
        COALESCE(SUM(total_amount), 0) AS totalRevenue,
        COALESCE(SUM(quantity_sold), 0) AS totalQuantitySold,
        COUNT(DISTINCT transaction_code) AS transactionCount
      FROM sales_history
      WHERE sale_date >= DATEADD(day, -${safeDays - 1}, CAST(GETDATE() AS DATE))
      GROUP BY sale_date
      ORDER BY sale_date ASC;
    `;
    return await SqlConnection.queryJson(sql);
  }

  /**
   * Truy vấn chi tiết hóa đơn bán lẻ POS theo mã giao dịch (Mục 22.6 Đặc tả SSOT: GET /api/sales/receipt/:txnCode)
   */
  async getReceiptByTxnCode(txnCode) {
    const safeTxn = SqlConnection.escapeSql(String(txnCode || '').trim());
    const sql = `
      SELECT 
        sh.id,
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
