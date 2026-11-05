// src/infrastructure/database/repositories/SqlGoodsReceiptRepository.js
const SqlConnection = require('../sqlConnection');
const IGoodsReceiptRepository = require('../../../domain/interfaces/IGoodsReceiptRepository');

class SqlGoodsReceiptRepository extends IGoodsReceiptRepository {
  /**
   * Tạo phiếu tiếp nhận hàng từ xe tải DC và tạo các lô hàng mới trong 1 Transaction nguyên khối
   */
  async createReceiptWithBatches(params = {}) {
    const rc = params.goodsReceipt || params;
    const receiptNumber = rc.receiptNumber;
    const supplierId = rc.supplierId;
    const receivedBy = rc.receivedBy;
    const receiptDate = rc.receiptDate || new Date();
    const totalCost = rc.totalCost || 0;
    const notes = rc.notes || '';
    const batches = params.batchList || params.batches || rc.batches || [];

    const num = SqlConnection.escapeSql(receiptNumber);
    const supId = Number(supplierId);
    const recBy = Number(receivedBy);
    const recDate = SqlConnection.escapeSql(new Date(receiptDate).toISOString().slice(0, 10));
    const cost = Number(totalCost);
    const noteStr = SqlConnection.escapeSql(notes || '');

    // Tạo các câu SQL cho batches và cập nhật giá vốn sản phẩm
    const batchInserts = [];
    const productCostUpdates = [];

    for (const b of batches) {
      const code = SqlConnection.escapeSql(b.batchCode);
      const pId = Number(b.productId);
      const impD = SqlConnection.escapeSql(new Date(b.importDate).toISOString().slice(0, 10));
      const mfgD = SqlConnection.escapeSql(new Date(b.manufactureDate).toISOString().slice(0, 10));
      const expD = SqlConnection.escapeSql(new Date(b.expiryDate).toISOString().slice(0, 10));
      const qty = Number(b.initialQuantity);
      const prc = Number(b.importPrice);

      batchInserts.push(`
        INSERT INTO batches (
          receipt_id, batch_code, product_id, import_date, manufacture_date,
          expiry_date, initial_quantity, current_quantity, import_price,
          discount_percent, status, is_shelf_rotated, created_at
        ) VALUES (
          @NewReceiptId, ${code}, ${pId}, ${impD}, ${mfgD},
          ${expD}, ${qty}, ${qty}, ${prc},
          0, 'ACTIVE', 0, GETDATE()
        );
      `);

      productCostUpdates.push(`
        UPDATE products SET cost_price = ${prc}, updated_at = GETDATE() WHERE id = ${pId};
      `);
    }

    const transactionSql = `
      BEGIN TRANSACTION;
      BEGIN TRY
        DECLARE @NewReceiptId INT;

        INSERT INTO goods_receipts (
          receipt_number, supplier_id, received_by, receipt_date,
          total_cost, status, notes, created_at
        ) VALUES (
          ${num}, ${supId}, ${recBy}, ${recDate},
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
      WHERE gr.id = ${Number(id)};
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
}

module.exports = SqlGoodsReceiptRepository;
