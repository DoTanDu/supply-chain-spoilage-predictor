// src/domain/interfaces/ISpoilageRepository.js
/**
 * Interface Định nghĩa Hợp đồng Sổ Hao hụt Tài chính & Biên bản Tiêu hủy (Rule 6)
 */
class ISpoilageRepository {
  async createSpoilageRecordTransaction({ spoilageRecord, batchId, quantityDisposed }) {
    throw new Error('Method not implemented.');
  }

  async findRecentRecords(limit = 50) {
    throw new Error('Method not implemented.');
  }

  async getLossSummary(startDate, endDate) {
    throw new Error('Method not implemented.');
  }
}

module.exports = ISpoilageRepository;
