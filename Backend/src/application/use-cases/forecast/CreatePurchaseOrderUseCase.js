// src/application/use-cases/forecast/CreatePurchaseOrderUseCase.js
const PurchaseOrder = require('../../../domain/entities/PurchaseOrder');

/**
 * Use Case: Tạo Đơn Đặt Hàng Bổ Sung gửi Kho tổng DC Biên Hòa (Purchase Orders)
 * Tự động tạo từ đề xuất của thuật toán ROP (Rule 8)
 */
class CreatePurchaseOrderUseCase {
  constructor({ purchaseOrderRepository, auditLogRepository }) {
    this.purchaseOrderRepository = purchaseOrderRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute({
    supplierId = 1,
    createdBy,
    createdByName = 'Cửa hàng trưởng',
    items = [],
    expectedDeliveryDate = null,
    notes = ''
  }) {
    if (!createdBy) {
      throw new Error('ID người lập đơn (createdBy) là bắt buộc!');
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Đơn đặt hàng phải có ít nhất một sản phẩm!');
    }

    // Khởi tạo Entity PurchaseOrder
    const po = new PurchaseOrder({
      supplierId: Number(supplierId),
      createdBy: Number(createdBy),
      expectedDeliveryDate,
      notes,
      status: 'DRAFT'
    });

    for (const it of items) {
      po.addItem({
        productId: it.productId,
        productName: it.productName,
        currentStockAtOrder: it.currentStockAtOrder || 0,
        suggestedQuantity: it.suggestedQuantity,
        approvedQuantity: it.approvedQuantity !== undefined ? it.approvedQuantity : it.suggestedQuantity,
        unitCost: it.unitCost
      });
    }

    // Lưu đơn vào CSDL SQL Server trong 1 Transaction
    const result = await this.purchaseOrderRepository.createOrderWithItems(po);

    // Ghi nhật ký kiểm toán bất biến
    if (this.auditLogRepository) {
      await this.auditLogRepository.log({
        userId: Number(createdBy),
        userName: createdByName,
        action: 'CREATE_PURCHASE_ORDER',
        entityName: 'PURCHASE_ORDERS',
        entityId: String(result.orderId || po.orderCode),
        description: `Tạo đơn đặt hàng ${po.orderCode} gồm ${po.items.length} mặt hàng. Tổng dự toán: ${po.totalEstimatedCost.toLocaleString('vi-VN')} đ.`
      });
    }

    return {
      success: true,
      orderId: result.orderId,
      orderCode: po.orderCode,
      totalItemsCount: po.items.length,
      totalEstimatedCost: po.totalEstimatedCost,
      status: po.status,
      message: `Đã tạo đơn đặt hàng bổ sung ${po.orderCode} thành công! Đang chờ Cửa hàng trưởng phê duyệt gửi DC.`
    };
  }
}

module.exports = CreatePurchaseOrderUseCase;
