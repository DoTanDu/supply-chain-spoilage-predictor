// src/domain/interfaces/IPurchaseOrderRepository.js
/**
 * Interface Định nghĩa Hợp đồng Đơn Đặt Hàng Gửi Kho Tổng DC (Rule 8)
 */
class IPurchaseOrderRepository {
  async createOrderWithItems(purchaseOrder) {
    throw new Error('Method not implemented.');
  }

  async findById(orderId) {
    throw new Error('Method not implemented.');
  }

  async findRecentOrders(limit = 50) {
    throw new Error('Method not implemented.');
  }

  async findAll() {
    throw new Error('Method not implemented.');
  }

  async updateOrderStatus(orderId, status, managerId = null) {
    throw new Error('Method not implemented.');
  }
}

module.exports = IPurchaseOrderRepository;
