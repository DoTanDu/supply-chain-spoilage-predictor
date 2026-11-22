// src/infrastructure/database/repositories/SqlGoodsReceiptRepository.js
const SqlConnection = require('../sqlConnection');
const IGoodsReceiptRepository = require('../../../domain/interfaces/IGoodsReceiptRepository');
const { formatLocalDateYMD } = require('../../../domain/utils/dateUtils');

class SqlGoodsReceiptRepository extends IGoodsReceiptRepository {
  /**
   * Tạo phiếu tiếp nhận hàng từ xe tải DC và tạo các lô hàng mới trong 1 Transaction nguyên khối
   */
  async createReceiptWithBatches(params = {}) {
    const rc = params.goodsReceipt || params;
    const receiptNumber = rc.receiptNumber;
    const supplierId = rc.supplierId;
    const storeId = Number(rc.storeId || params.storeId || 1);
    const purchaseOrderId = (rc.purchaseOrderId || params.purchaseOrderId)
      ? Number(rc.purchaseOrderId || params.purchaseOrderId)
      : 'NULL';
    const receivedBy = rc.receivedBy;
    const receiptDate = rc.receiptDate || new Date();
    const totalCost = rc.totalCost || 0;
    const notes = rc.notes || '';
    const batches = params.batchList || params.batches || rc.batches || [];

    const num = SqlConnection.escapeSql(receiptNumber);
    const supId = Number(supplierId);
    const recBy = Number(receivedBy);
    const recDate = SqlConnection.escapeSql(formatLocalDateYMD(receiptDate));
    const cost = Number(totalCost);
    const noteStr = SqlConnection.escapeSql(notes || '');

    // Kiểm tra trùng mã lô trong chính payload đầu vào và trong CSDL trước khi INSERT
    const seenCodes = new Set();
    for (const b of batches) {
      const codeNorm = String(b.batchCode || '').trim().toUpperCase();
      if (seenCodes.has(codeNorm)) {
        const err = new Error(`Mã lô hàng [${b.batchCode}] bị trùng lặp trong cùng phiếu nhập kho!`);
        err.statusCode = 409;
        err.code = 'ERR_DUPLICATE_BATCH_CODE';
        throw err;
      }
      seenCodes.add(codeNorm);
    }

    const batchCodesSql = batches.map(b => SqlConnection.escapeSql(b.batchCode)).join(', ');
    if (batchCodesSql) {
      const dupRows = await SqlConnection.queryJson(`
        SELECT TOP 1 batch_code AS batchCode FROM batches WHERE batch_code IN (${batchCodesSql});
      `);
      if (dupRows && dupRows.length > 0) {
        const err = new Error(`Mã lô hàng [${dupRows[0].batchCode}] đã tồn tại trong kho. Vui lòng đổi mã lô khác!`);
        err.statusCode = 409;
        err.code = 'ERR_DUPLICATE_BATCH_CODE';
        throw err;
      }
    }

    // Tạo các câu SQL cho batches và cập nhật giá vốn sản phẩm
    const batchInserts = [];
    const productCostUpdates = [];

    for (const b of batches) {
      const code = SqlConnection.escapeSql(b.batchCode);
      const pId = Number(b.productId);
      const bStoreId = Number(b.storeId || storeId || 1);
      const impD = SqlConnection.escapeSql(formatLocalDateYMD(b.importDate));
      const mfgD = SqlConnection.escapeSql(formatLocalDateYMD(b.manufactureDate));
      const expD = SqlConnection.escapeSql(formatLocalDateYMD(b.expiryDate));
      const qty = Number(b.initialQuantity);
      const prc = Number(b.importPrice);

      batchInserts.push(`
        INSERT INTO batches (
          receipt_id, batch_code, product_id, store_id, import_date, manufacture_date,
          expiry_date, initial_quantity, current_quantity, import_price,
          discount_percent, status, is_shelf_rotated, created_at
        ) VALUES (
          @NewReceiptId, ${code}, ${pId}, ${bStoreId}, ${impD}, ${mfgD},
          ${expD}, ${qty}, ${qty}, ${prc},
          0, 'ACTIVE', 0, GETDATE()
        );
      `);

      productCostUpdates.push(`
        UPDATE products
        SET cost_price = CASE WHEN ${prc} > 0 AND ${prc} <= selling_price THEN ${prc} ELSE cost_price END,
            updated_at = GETDATE()
        WHERE id = ${pId};
      `);
    }

    const transactionSql = `
      BEGIN TRANSACTION;
      BEGIN TRY
        DECLARE @NewReceiptId INT;

        INSERT INTO goods_receipts (
          receipt_number, supplier_id, store_id, purchase_order_id, received_by, receipt_date,
          total_cost, status, notes, created_at
        ) VALUES (
          ${num}, ${supId}, ${storeId}, ${purchaseOrderId}, ${recBy}, ${recDate},
          ${cost}, 'COMPLETED', ${noteStr}, GETDATE()
        );

        SET @NewReceiptId = SCOPE_IDENTITY();

        ${batchInserts.join('\n')}
        ${productCostUpdates.join('\n')}

        COMMIT TRANSACTION;
        SELECT @NewReceiptId AS receiptId, ${num} AS receiptNumber FOR JSON PATH;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
      END CATCH;
    `;

    const rows = await SqlConnection.queryJson(transactionSql);
    return rows.length > 0 
      ? { id: rows[0].receiptId, receiptId: rows[0].receiptId, receiptNumber: rows[0].receiptNumber || receiptNumber }
      : { id: null, receiptId: null, receiptNumber };
  }

  async findById(id) {
    const safeId = Number(id);
    if (!Number.isInteger(safeId) || safeId <= 0) return null;
    const sql = `
      SELECT 
        gr.id,
        gr.receipt_number AS receiptNumber,
        gr.supplier_id AS supplierId,
        s.name AS supplierName,
        gr.received_by AS receivedBy,
        u.full_name AS receivedByName,
        gr.receipt_date AS receiptDate,
        gr.total_cost AS totalCost,
        gr.status,
        gr.notes,
        gr.created_at AS createdAt
      FROM goods_receipts gr
      INNER JOIN suppliers s ON gr.supplier_id = s.id
      INNER JOIN users u ON gr.received_by = u.id
      WHERE gr.id = ${safeId};
    `;
    const rows = await SqlConnection.queryJson(sql);
    return rows.length > 0 ? rows[0] : null;
  }

  async findRecent(limit = 50) {
    const sql = `
      SELECT TOP (${Number(limit)})
        gr.id,
        gr.receipt_number AS receiptNumber,
        gr.supplier_id AS supplierId,
        s.name AS supplierName,
        gr.received_by AS receivedBy,
        u.full_name AS receivedByName,
        gr.receipt_date AS receiptDate,
        gr.total_cost AS totalCost,
        gr.status,
        gr.notes,
        gr.created_at AS createdAt
      FROM goods_receipts gr
      INNER JOIN suppliers s ON gr.supplier_id = s.id
      INNER JOIN users u ON gr.received_by = u.id
      ORDER BY gr.id DESC;
    `;
    return await SqlConnection.queryJson(sql);
  }

  async getReceivedQuantitiesByPurchaseOrder(purchaseOrderId) {
    const poId = Number(purchaseOrderId);
    if (!Number.isInteger(poId) || poId <= 0) return {};
    const rows = await SqlConnection.queryJson(`
      SELECT
        b.product_id AS productId,
        SUM(b.initial_quantity) AS receivedQty
      FROM batches b
      INNER JOIN goods_receipts gr ON b.receipt_id = gr.id
      WHERE gr.purchase_order_id = ${poId}
      GROUP BY b.product_id;
    `);
    const map = {};
    for (const r of (rows || [])) {
      map[Number(r.productId)] = Number(r.receivedQty || 0);
    }
    return map;
  }
}

module.exports = SqlGoodsReceiptRepository;
