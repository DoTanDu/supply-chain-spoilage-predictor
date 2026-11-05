// src/domain/interfaces/ISaleRepository.js
/**
 * Interface Định nghĩa Hợp đồng Giao dịch Bán lẻ POS & Lịch sử Bán hàng
 */
class ISaleRepository {
  async executeFefoCheckoutTransaction({ saleOrder, batchDeductions }) {
    throw new Error('Method not implemented.');
  }

  async getRecentTransactions(limit = 50) {
    throw new Error('Method not implemented.');
  }

  async getSalesHistoryByProduct(productId, days = 14) {
    throw new Error('Method not implemented.');
  }

  async getTodaySalesSummary() {
    throw new Error('Method not implemented.');
  }

  async getTotalSalesSummary() {
    throw new Error('Method not implemented.');
  }
}

module.exports = ISaleRepository;
