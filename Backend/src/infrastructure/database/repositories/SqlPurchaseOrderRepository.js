// src/infrastructure/database/repositories/SqlPurchaseOrderRepository.js
const SqlConnection = require('../sqlConnection');
const IPurchaseOrderRepository = require('../../../domain/interfaces/IPurchaseOrderRepository');

class SqlPurchaseOrderRepository extends IPurchaseOrderRepository {
  /**
   * Tạo đơn đặt hàng PO và các dòng chi tiết ROP trong 1 Transaction nguyên khối
   */
  async createOrderWithItems(purchaseOrder) {
    const code = SqlConnection.escapeSql(purchaseOrder.orderCode);
    const supId = Number(purchaseOrder.supplierId);
    const crBy = Number(purchaseOrder.createdBy);
    const apBy = purchaseOrder.approvedBy ? Number(purchaseOrder.approvedBy) : 'NULL';
    const statusStr = SqlConnection.escapeSql(purchaseOrder.status || 'DRAFT');
    const cost = Number(purchaseOrder.totalEstimatedCost || 0);
    const expDeliv = purchaseOrder.expectedDeliveryDate
      ? SqlConnection.escapeSql(new Date(purchaseOrder.expectedDeliveryDate).toISOString().slice(0, 10))
      : 'NULL';
    const noteStr = SqlConnection.escapeSql(purchaseOrder.notes || '');

    const itemInserts = [];
    for (const item of purchaseOrder.items) {
      const pId = Number(item.productId);
      const stock = Number(item.currentStockAtOrder);
      const sugg = Number(item.suggestedQuantity);
      const appr = Number(item.approvedQuantity !== undefined ? item.approvedQuantity : item.suggestedQuantity);
      const unit = Number(item.unitCost);
      const lineCost = Number(item.totalLineCost || (appr * unit));

      itemInserts.push(`
        INSERT INTO purchase_order_items (
          order_id, product_id, current_stock_at_order, suggested_quantity,
          approved_quantity, unit_cost, total_line_cost
        ) VALUES (
          @NewOrderId, ${pId}, ${stock}, ${sugg},
          ${appr}, ${unit}, ${lineCost}
        );
      `);
    }

    const transactionSql = `
      BEGIN TRANSACTION;
      BEGIN TRY
        DECLARE @NewOrderId INT;

        INSERT INTO purchase_orders (
          order_code, supplier_id, created_by, approved_by, status,
          total_estimated_cost, expected_delivery_date, notes, created_at, updated_at
        ) VALUES (
          ${code}, ${supId}, ${crBy}, ${apBy}, ${statusStr},
          ${cost}, ${expDeliv}, ${noteStr}, GETDATE(), GETDATE()
        );

        SET @NewOrderId = SCOPE_IDENTITY();

        ${itemInserts.join('\n')}

        COMMIT TRANSACTION;
        SELECT @NewOrderId AS orderId, ${code} AS orderCode FOR JSON PATH;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
      END CATCH;
    `;

    const rows = await SqlConnection.queryJson(transactionSql);
    return rows.length > 0 
      ? { id: rows[0].orderId, orderId: rows[0].orderId, orderCode: rows[0].orderCode || purchaseOrder.orderCode }
      : { id: null, orderId: null, orderCode: purchaseOrder.orderCode };
  }

  async findById(orderId) {
    const id = Number(orderId);
    const orderSql = `
      SELECT 
        po.id,
        po.order_code AS orderCode,
        po.supplier_id AS supplierId,
        s.name AS supplierName,
        po.created_by AS createdBy,
        u1.full_name AS createdByName,
        po.approved_by AS approvedBy,
        u2.full_name AS approvedByName,
        po.status,
        po.total_estimated_cost AS totalEstimatedCost,
        po.expected_delivery_date AS expectedDeliveryDate,
        po.notes,
        po.created_at AS createdAt,
        po.updated_at AS updatedAt
      FROM purchase_orders po
      INNER JOIN suppliers s ON po.supplier_id = s.id
      INNER JOIN users u1 ON po.created_by = u1.id
      LEFT JOIN users u2 ON po.approved_by = u2.id
      WHERE po.id = ${id};
    `;
    const orderRows = await SqlConnection.queryJson(orderSql);
    if (orderRows.length === 0) return null;

    const order = orderRows[0];

    // Lấy chi tiết các dòng items
    const itemsSql = `
      SELECT 
        poi.id,
        poi.product_id AS productId,
        p.name AS productName,
        p.sku AS productSku,
        poi.current_stock_at_order AS currentStockAtOrder,
        poi.suggested_quantity AS suggestedQuantity,
        poi.approved_quantity AS approvedQuantity,
        poi.unit_cost AS unitCost,
        poi.total_line_cost AS totalLineCost
      FROM purchase_order_items poi
      INNER JOIN products p ON poi.product_id = p.id
      WHERE poi.order_id = ${id};
    `;
    order.items = await SqlConnection.queryJson(itemsSql);
    return order;
  }

  async findRecentOrders(limit = 50) {
    const sql = `
      SELECT TOP (${Number(limit)})
        po.id,
        po.order_code AS orderCode,
        po.supplier_id AS supplierId,
        s.name AS supplierName,
        po.created_by AS createdBy,
        u1.full_name AS createdByName,
        po.approved_by AS approvedBy,
        u2.full_name AS approvedByName,
        po.status,
        po.total_estimated_cost AS totalEstimatedCost,
        po.expected_delivery_date AS expectedDeliveryDate,
        po.notes,
        po.created_at AS createdAt,
        (SELECT COUNT(1) FROM purchase_order_items WHERE order_id = po.id) AS totalItemsCount,
        (
          SELECT 
            poi.id,
            poi.product_id AS productId,
            p.name AS productName,
            p.sku AS productSku,
            p.unit AS unit,
            poi.suggested_quantity AS suggestedQuantity,
            poi.approved_quantity AS approvedQuantity,
            poi.unit_cost AS unitCost,
            poi.total_line_cost AS totalLineCost
          FROM purchase_order_items poi
          INNER JOIN products p ON poi.product_id = p.id
          WHERE poi.order_id = po.id
          FOR JSON PATH
        ) AS items
      FROM purchase_orders po
      INNER JOIN suppliers s ON po.supplier_id = s.id
      INNER JOIN users u1 ON po.created_by = u1.id
      LEFT JOIN users u2 ON po.approved_by = u2.id
      ORDER BY po.id DESC
      FOR JSON PATH;
    `;
    const rows = await SqlConnection.queryJson(sql);
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
      ...r,
      items: Array.isArray(r.items) ? r.items : []
    }));
  }

  async findAll() {
    return await this.findRecentOrders(100);
  }

  async updateOrderStatus(orderId, status, managerId = null) {
    const id = Number(orderId);
    const statusStr = SqlConnection.escapeSql(status);
    const mgrUpdate = (managerId && status === 'APPROVED') ? `, approved_by = ${Number(managerId)}` : '';

    const sql = `
      UPDATE purchase_orders
      SET status = ${statusStr},
          updated_at = GETDATE()
          ${mgrUpdate}
      WHERE id = ${id};
    `;
    await SqlConnection.executeSql(sql);
    return true;
  }
}

module.exports = SqlPurchaseOrderRepository;
