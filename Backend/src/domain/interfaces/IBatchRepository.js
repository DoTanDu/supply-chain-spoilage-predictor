// src/domain/interfaces/IBatchRepository.js
/**
 * Interface Định nghĩa Hợp đồng Truy xuất Dữ liệu Lô hàng (Batches)
 * Tách biệt hoàn toàn tầng Domain khỏi công nghệ lưu trữ CSDL
 */
class IBatchRepository {
  async findById(id) {
    throw new Error('Method not implemented.');
  }

  async findByBatchCode(batchCode) {
    throw new Error('Method not implemented.');
  }

  async findByProductId(productId) {
    throw new Error('Method not implemented.');
  }

  async findAvailableByProductIdFefo(productId) {
    throw new Error('Method not implemented.');
  }

  async findAllWithAlerts(filter = {}) {
    throw new Error('Method not implemented.');
  }

  async create(batchData) {
    throw new Error('Method not implemented.');
  }

  async updateCurrentQuantity(batchId, newQuantity) {
    throw new Error('Method not implemented.');
  }

  async updateDiscount(batchId, discountPercent) {
    throw new Error('Method not implemented.');
  }

  async confirmShelfRotation(batchId) {
    throw new Error('Method not implemented.');
  }

  async updateStatus(batchId, status) {
    throw new Error('Method not implemented.');
  }
}

module.exports = IBatchRepository;
