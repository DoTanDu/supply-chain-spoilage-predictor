// src/application/use-cases/sales/GetSalesHistoryUseCase.js
/**
 * Use Case: Truy vấn Lịch sử Giao dịch Bán lẻ POS & Doanh số
 */
class GetSalesHistoryUseCase {
  constructor({ saleRepository }) {
    this.saleRepository = saleRepository;
  }

  async execute({ limit = 50 }) {
    const transactions = await this.saleRepository.getRecentTransactions(limit);
    const todaySummary = await this.saleRepository.getTodaySalesSummary();

    return {
      success: true,
      todaySummary,
      data: transactions
    };
  }
}

module.exports = GetSalesHistoryUseCase;
