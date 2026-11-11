// src/application/use-cases/spoilage/GetSpoilageLedgerUseCase.js
/**
 * Use Case: Tra cứu Sổ Hao hụt Tài chính & Thống kê Thiệt hại Lãng phí (Rule 6)
 */
class GetSpoilageLedgerUseCase {
  constructor({ spoilageRepository }) {
    this.spoilageRepository = spoilageRepository;
  }

  async execute({ limit = 50, startDate = null, endDate = null, storeId = null }) {
    const records = await this.spoilageRepository.findRecentRecords(limit, storeId);
    const summary = await this.spoilageRepository.getLossSummary(startDate, endDate, storeId);

    return {
      success: true,
      summary,
      reasonBreakdown: summary?.reasonBreakdown || [],
      data: records
    };
  }
}

module.exports = GetSpoilageLedgerUseCase;
