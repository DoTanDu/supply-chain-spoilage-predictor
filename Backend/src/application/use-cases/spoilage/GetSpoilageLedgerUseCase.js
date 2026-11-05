// src/application/use-cases/spoilage/GetSpoilageLedgerUseCase.js
/**
 * Use Case: Tra cứu Sổ Hao hụt Tài chính & Thống kê Thiệt hại Lãng phí (Rule 6)
 */
class GetSpoilageLedgerUseCase {
  constructor({ spoilageRepository }) {
    this.spoilageRepository = spoilageRepository;
  }

  async execute({ limit = 50, startDate = null, endDate = null }) {
    const records = await this.spoilageRepository.findRecentRecords(limit);
    const summary = await this.spoilageRepository.getLossSummary(startDate, endDate);

    return {
      success: true,
      summary,
      data: records
    };
  }
}

module.exports = GetSpoilageLedgerUseCase;
