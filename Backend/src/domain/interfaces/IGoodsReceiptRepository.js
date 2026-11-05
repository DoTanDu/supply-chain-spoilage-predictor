// src/domain/interfaces/IGoodsReceiptRepository.js
/**
 * Interface Hợp đồng Tiếp nhận Hàng từ Kho tổng DC (Goods Receipts)
 */
class IGoodsReceiptRepository {
  async createReceiptWithBatches({ goodsReceipt, batchList }) {
    throw new Error('Method not implemented.');
  }

  async findById(id) {
    throw new Error('Method not implemented.');
  }

  async findRecent(limit = 50) {
    throw new Error('Method not implemented.');
  }
}

module.exports = IGoodsReceiptRepository;
