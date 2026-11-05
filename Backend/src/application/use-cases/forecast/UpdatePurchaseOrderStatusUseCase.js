// src/application/use-cases/forecast/UpdatePurchaseOrderStatusUseCase.js
/**
 * Use Case: Phê duyệt & Gửi Đơn Đặt Hàng về Kho tổng DC Biên Hòa
 * Quản lý vòng đời trạng thái đơn: DRAFT -> APPROVED -> SUBMITTED (Đã gửi DC)
 */
class UpdatePurchaseOrderStatusUseCase {
  constructor({ purchaseOrderRepository, auditLogRepository }) {
    this.purchaseOrderRepository = purchaseOrderRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute({ orderId, status, newStatus, approvedBy, managerId, managerName = 'Cửa hàng trưởng', notes = '' }) {
    const targetStatus = status || newStatus;
    const targetManagerId = approvedBy || managerId;

    if (!orderId || !targetStatus) {
      throw new Error('Mã đơn hàng (orderId) và Trạng thái mới (status) là bắt buộc!');
    }

    const order = await this.purchaseOrderRepository.findById(orderId);
    if (!order) {
      throw new Error(`Đơn đặt hàng với ID [${orderId}] không tồn tại!`);
    }

    const rawNorm = String(targetStatus).toUpperCase().trim();
    // Đồng bộ tên trạng thái vòng đời đơn PO với ràng buộc CHECK của SQL Server ('DRAFT', 'APPROVED', 'SUBMITTED', 'DELIVERED', 'CANCELLED')
    const STATUS_MAP = {
      PENDING: 'DRAFT',
      DRAFT: 'DRAFT',
      APPROVED: 'APPROVED',
      SHIPPING: 'SUBMITTED',
      SUBMITTED: 'SUBMITTED',
      COMPLETED: 'DELIVERED',
      RECEIVED: 'DELIVERED',
      DELIVERED: 'DELIVERED',
      CANCELLED: 'CANCELLED'
    };
    const statusNorm = STATUS_MAP[rawNorm];
    if (!statusNorm) {
      const err = new Error(`Trạng thái đơn đặt hàng [${targetStatus}] không hợp lệ! Chỉ chấp nhận: DRAFT, APPROVED, SUBMITTED, DELIVERED, CANCELLED.`);
      err.statusCode = 400;
      err.code = 'ERR_INVALID_PO_STATUS';
      throw err;
    }

    // Cập nhật trạng thái
    await this.purchaseOrderRepository.updateOrderStatus(orderId, statusNorm, targetManagerId);

    // Ghi nhật ký kiểm toán bất biến
    if (this.auditLogRepository) {
      const actionMsg = statusNorm === 'SUBMITTED'
        ? `Gửi đơn đặt hàng ${order.orderCode} sang Kho tổng DC Biên Hòa.`
        : `Cập nhật trạng thái đơn ${order.orderCode} thành [${statusNorm}].`;

      await this.auditLogRepository.log({
        userId: managerId ? Number(managerId) : null,
        userName: managerName,
        action: 'UPDATE_PO_STATUS',
        entityName: 'PURCHASE_ORDERS',
        entityId: String(orderId),
        description: actionMsg
      });
    }

    return {
      success: true,
      orderId: Number(orderId),
      orderCode: order.orderCode,
      status: statusNorm,
      message: statusNorm === 'SUBMITTED'
        ? `Đã gửi thành công đơn đặt hàng ${order.orderCode} về Kho tổng DC Biên Hòa!`
        : `Đã cập nhật trạng thái đơn hàng thành ${statusNorm}!`
    };
  }
}

module.exports = UpdatePurchaseOrderStatusUseCase;
