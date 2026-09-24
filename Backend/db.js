const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function executeSql(query) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(__dirname, `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.sql`);
    fs.writeFileSync(tempFile, 'SET NOCOUNT ON;\n' + query, 'utf8');

    const cmd = `sqlcmd -f 65001 -y 0 -S "(localdb)\\mssqllocaldb" -d retail_spoilage_db -i "${tempFile}"`;

    exec(cmd, { encoding: 'utf8', maxBuffer: 25 * 1024 * 1024 }, (error, stdout, stderr) => {
      try { fs.unlinkSync(tempFile); } catch (e) {}
      if (error) {
        return reject(error);
      }
      resolve(stdout);
    });
  });
}

async function queryJson(query) {
  const jsonQuery = `${query} FOR JSON PATH`;
  const raw = await executeSql(jsonQuery);
  const lines = raw.split(/\r?\n/).filter(l => !l.startsWith('JSON_') && !l.startsWith('---'));
  const jsonStr = lines.join('').trim();
  if (!jsonStr) return [];
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON from SQL:", e.message, jsonStr.slice(0, 100));
    return [];
  }
}

// 1. Get Products with Live Stock Count from Batches
async function getProducts() {
  const sql = `
    SELECT 
      p.id,
      p.sku,
      p.name,
      c.name AS category,
      p.unit,
      p.cost_price AS costPrice,
      p.selling_price AS price,
      p.standard_shelf_life_days AS shelfLifeDays,
      p.min_stock_level AS reorderPoint,
      CAST(ROUND(p.min_stock_level * 0.4, 0) AS INT) AS safetyStock,
      ROUND(ISNULL((SELECT AVG(CAST(quantity_sold AS FLOAT)) FROM sales_history WHERE product_id = p.id), 6.5), 1) AS dailyDemand,
      ISNULL((SELECT SUM(current_quantity) FROM batches WHERE product_id = p.id AND status != 'EXPIRED' AND current_quantity > 0), 0) AS totalStock,
      CASE 
        WHEN c.code = 'DAIRY' THEN N'🥛'
        WHEN c.code = 'BAKERY' THEN N'🍞'
        WHEN c.code = 'BEVERAGE' THEN N'🥤'
        WHEN c.code = 'MEAT_POULTRY' THEN N'🥩'
        WHEN c.code = 'FRESH_PRODUCE' THEN N'🥗'
        WHEN c.code = 'PROCESSED_MEAT' THEN N'🌭'
        WHEN c.code = 'DRY_FOOD' THEN N'🍜'
        ELSE N'📦'
      END AS image
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
  `;
  return await queryJson(sql);
}

// 2. Get Batches with Live Expiry Calculations
async function getBatches() {
  const sql = `
    SELECT 
      b.id,
      b.product_id AS productId,
      p.name AS productName,
      c.name AS category,
      b.batch_code AS batchCode,
      CONVERT(VARCHAR(10), b.import_date, 120) AS importDate,
      CONVERT(VARCHAR(10), b.expiry_date, 120) AS expiryDate,
      b.initial_quantity AS initialQuantity,
      b.current_quantity AS quantity,
      b.import_price AS costPrice,
      b.discount_percent AS discountPercent,
      CASE WHEN b.discount_percent > 0 THEN 1 ELSE 0 END AS isDiscounted,
      ISNULL(b.is_shelf_rotated, 0) AS isShelfRotated,
      CASE 
        WHEN b.current_quantity <= 0 THEN 'DISPOSED'
        WHEN DATEDIFF(day, GETDATE(), b.expiry_date) < 0 THEN 'EXPIRED'
        WHEN DATEDIFF(day, GETDATE(), b.expiry_date) <= 3 THEN 'CRITICAL'
        WHEN DATEDIFF(day, GETDATE(), b.expiry_date) <= 7 THEN 'WARNING'
        ELSE 'SAFE'
      END AS status
    FROM batches b
    JOIN products p ON b.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    ORDER BY b.expiry_date ASC, b.id ASC
  `;
  return await queryJson(sql);
}

// Rotate Batch on Shelf (Mark as front-facing according to FEFO)
async function rotateBatch(batchId) {
  const sql = `
    UPDATE batches 
    SET is_shelf_rotated = 1 
    WHERE id = ${batchId};

    INSERT INTO system_audit_logs (user_id, action_type, description, ip_address)
    SELECT 2, N'Đảo hàng FEFO', 
      N'Nhân viên đã đảo Lô ' + batch_code + N' ra mặt tiền đầu kệ trưng bày để khách mua trước', '127.0.0.1'
    FROM batches WHERE id = ${batchId};
  `;
  await executeSql(sql);
  return { success: true };
}

// 3. Get Disposals from Database
async function getDisposals() {
  const sql = `
    SELECT 
      s.record_code AS id,
      CONVERT(VARCHAR(10), s.disposed_date, 120) AS date,
      s.batch_id AS batchId,
      b.batch_code AS batchCode,
      p.name AS productName,
      s.quantity_disposed AS quantity,
      CAST(s.cost_loss / NULLIF(s.quantity_disposed, 0) AS DECIMAL(18,2)) AS costPrice,
      s.cost_loss AS totalLoss,
      s.reason,
      u.full_name AS approvedBy,
      'APPROVED' AS status
    FROM spoilage_records s
    JOIN batches b ON s.batch_id = b.id
    JOIN products p ON b.product_id = p.id
    LEFT JOIN users u ON s.performed_by = u.id
    ORDER BY s.created_at DESC
  `;
  return await queryJson(sql);
}

// 4. Get Audit Logs
async function getAuditLogs() {
  const sql = `
    SELECT TOP 30
      l.id,
      CONVERT(VARCHAR(19), l.created_at, 120) AS time,
      ISNULL(u.full_name, N'Hệ thống AI') AS [user],
      l.action_type AS [action],
      l.description AS details
    FROM system_audit_logs l
    LEFT JOIN users u ON l.user_id = u.id
    ORDER BY l.created_at DESC
  `;
  return await queryJson(sql);
}

// 5. Get Real Dashboard Stats
async function getDashboardStats() {
  const sql = `
    SELECT 
      ISNULL((SELECT SUM(current_quantity) FROM batches WHERE status != 'EXPIRED' AND current_quantity > 0), 0) AS totalStockItems,
      ISNULL((SELECT SUM(current_quantity * import_price) FROM batches WHERE status != 'EXPIRED' AND current_quantity > 0), 0) AS totalInventoryValue,
      ISNULL((SELECT COUNT(*) FROM batches WHERE current_quantity > 0 AND DATEDIFF(day, GETDATE(), expiry_date) >= 0 AND DATEDIFF(day, GETDATE(), expiry_date) <= 3), 0) AS criticalBatchesCount,
      ISNULL((SELECT COUNT(*) FROM batches WHERE current_quantity > 0 AND DATEDIFF(day, GETDATE(), expiry_date) > 3 AND DATEDIFF(day, GETDATE(), expiry_date) <= 7), 0) AS warningBatchesCount,
      ISNULL((SELECT COUNT(*) FROM batches WHERE current_quantity > 0 AND DATEDIFF(day, GETDATE(), expiry_date) > 7), 0) AS safeBatchesCount,
      ISNULL((SELECT COUNT(*) FROM batches WHERE DATEDIFF(day, GETDATE(), expiry_date) < 0 OR status = 'EXPIRED'), 0) AS expiredBatchesCount,
      ISNULL((SELECT SUM(cost_loss) FROM spoilage_records), 0) AS totalDisposalLoss,
      ISNULL((SELECT SUM(total_cost) FROM goods_receipts), 16600000) AS totalReceiptCost
  `;
  const res = await queryJson(sql);
  const data = res[0] || {};
  const spoilageRate = data.totalReceiptCost > 0 
    ? ((data.totalDisposalLoss / data.totalReceiptCost) * 100).toFixed(2) 
    : "0.00";

  return {
    ...data,
    spoilageRate
  };
}

// 6. Receive Batch from DC into SQL Server
async function insertBatch(batch) {
  const updateProductSql = batch.updateSellingPrice && Number(batch.sellingPrice) > 0
    ? `UPDATE products SET selling_price = ${batch.sellingPrice}, cost_price = ${batch.costPrice} WHERE id = ${batch.productId};`
    : `UPDATE products SET cost_price = ${batch.costPrice} WHERE id = ${batch.productId};`;

  const priceLogDesc = batch.updateSellingPrice && Number(batch.sellingPrice) > 0
    ? `, Cập nhật giá bán lẻ POS: ${Number(batch.sellingPrice).toLocaleString('vi-VN')} đ`
    : '';

  const sql = `
    BEGIN TRANSACTION;
      INSERT INTO batches (
        receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date,
        initial_quantity, current_quantity, import_price, discount_percent, status
      ) VALUES (
        1, N'${batch.batchCode}', ${batch.productId}, '${batch.importDate}', '${batch.importDate}', '${batch.expiryDate}',
        ${batch.quantity}, ${batch.quantity}, ${batch.costPrice}, 0, 'ACTIVE'
      );

      ${updateProductSql}

      INSERT INTO system_audit_logs (user_id, action_type, description, ip_address)
      VALUES (
        2, N'Nhập lô từ DC',
        N'Đã nhập lô ${batch.batchCode} cho SP ID ${batch.productId} (${batch.quantity} cái, giá vốn: ${Number(batch.costPrice).toLocaleString('vi-VN')} đ)${priceLogDesc}', '127.0.0.1'
      );
    COMMIT TRANSACTION;
  `;
  await executeSql(sql);
  return { success: true };
}

// 7. Record Spoilage Disposal into SQL Server
async function recordDisposal(disposal) {
  const validReason = 
    disposal.reason && disposal.reason.includes('EXPIRED') ? 'EXPIRED' :
    disposal.reason && (disposal.reason.includes('SPOILED') || disposal.reason.includes('COLD')) ? 'SPOILED' : 'DAMAGED';

  const sql = `
    BEGIN TRANSACTION;
      -- 1. Insert Spoilage Record
      INSERT INTO spoilage_records (
        record_code, batch_id, disposed_date, quantity_disposed, cost_loss, reason, notes, performed_by
      ) VALUES (
        N'${disposal.id}', ${disposal.batchId}, '${disposal.date}', ${disposal.quantity},
        ${disposal.totalLoss}, N'${validReason}', N'${disposal.reason || 'Tiêu hủy hàng hỏng'}', 2
      );

      -- 2. Deduct Batch Stock
      UPDATE batches 
      SET 
        current_quantity = CASE WHEN current_quantity - ${disposal.quantity} < 0 THEN 0 ELSE current_quantity - ${disposal.quantity} END,
        status = CASE WHEN current_quantity - ${disposal.quantity} <= 0 THEN 'DISPOSED' ELSE status END
      WHERE id = ${disposal.batchId};

      -- 3. Audit Log
      INSERT INTO system_audit_logs (user_id, action_type, description, ip_address)
      VALUES (
        2, N'Tiêu hủy hàng hỏng',
        N'Tiêu hủy phiếu ${disposal.id} số lượng ${disposal.quantity}, thiệt hại ${disposal.totalLoss} đ', '127.0.0.1'
      );
    COMMIT TRANSACTION;
  `;
  await executeSql(sql);
  return { success: true };
}

// 8. Process FEFO Retail Sale into SQL Server
async function processFefoSale(cartItems, weatherInfo) {
  const transactionCode = `HD-${Date.now().toString().slice(-6)}`;
  let fefoDetails = [];
  let totalAmount = 0;

  for (const item of cartItems) {
    let remainingToDeduct = item.quantity;
    totalAmount += (item.price * item.quantity);

    // Get active batches in SQL sorted by expiry_date ASC
    const batchesSql = `
      SELECT id, batch_code, current_quantity, CONVERT(VARCHAR(10), expiry_date, 120) AS expiry_date
      FROM batches
      WHERE product_id = ${item.productId} AND current_quantity > 0 AND status != 'EXPIRED' AND DATEDIFF(day, GETDATE(), expiry_date) >= 0
      ORDER BY expiry_date ASC, id ASC
    `;
    const availBatches = await queryJson(batchesSql);

    const totalAvailable = availBatches.reduce((s, b) => s + b.current_quantity, 0);
    if (totalAvailable < remainingToDeduct) {
      const prodLabel = item.name ? `"${item.name}"` : `ID ${item.productId}`;
      throw new Error(`Sản phẩm ${prodLabel} không đủ tồn kho khả dụng để xuất theo FEFO! (Yêu cầu: ${remainingToDeduct}, Hiện còn: ${totalAvailable})`);
    }

    for (const b of availBatches) {
      if (remainingToDeduct === 0) break;
      const deduct = Math.min(b.current_quantity, remainingToDeduct);

      // Execute SQL update on batch and record in sales_history
      const updateBatchSql = `
        BEGIN TRANSACTION;
          UPDATE batches 
          SET current_quantity = current_quantity - ${deduct}
          WHERE id = ${b.id};

          INSERT INTO sales_history (
            transaction_code, product_id, batch_id, quantity_sold, sale_price, total_amount,
            sale_date, day_of_week, weather, is_holiday
          ) VALUES (
            N'${transactionCode}', ${item.productId}, ${b.id}, ${deduct}, ${item.price},
            ${deduct * item.price}, CAST(GETDATE() AS DATE), N'Thứ Năm', N'${weatherInfo.condition || 'SUNNY'}', ${weatherInfo.isHoliday ? 1 : 0}
          );
        COMMIT TRANSACTION;
      `;
      await executeSql(updateBatchSql);

      remainingToDeduct -= deduct;
      fefoDetails.push({
        productName: item.name,
        batchCode: b.batch_code,
        expiryDate: b.expiry_date,
        deductedQty: deduct,
        unit: item.unit
      });
    }
  }

  // Audit log for sale
  const auditSql = `
    INSERT INTO system_audit_logs (user_id, action_type, description, ip_address)
    VALUES (
      3, N'Bán hàng POS (FEFO)',
      N'Đơn ${transactionCode}: Thu ${totalAmount} đ, trừ kho ${fefoDetails.length} lượt lô theo FEFO', '127.0.0.1'
    );
  `;
  await executeSql(auditSql);

  return {
    success: true,
    orderCode: transactionCode,
    totalAmount,
    fefoDetails
  };
}

module.exports = {
  executeSql,
  queryJson,
  getProducts,
  getBatches,
  getDisposals,
  getAuditLogs,
  getDashboardStats,
  insertBatch,
  recordDisposal,
  processFefoSale,
  rotateBatch
};
