// src/application/use-cases/batch/GetBatchAlertsUseCase.js
/**
 * Use Case: Truy vấn Danh sách Lô hàng & Giám sát 3 Cấp màu Cảnh báo (Rule 4 & Rule 5)
 * Tận dụng View hiệu năng cao vw_Batches_ShelfLife_Alerts trên SQL Server
 */
class GetBatchAlertsUseCase {
  constructor({ batchRepository }) {
    this.batchRepository = batchRepository;
  }

  async execute(filter = {}) {
    const batches = await this.batchRepository.findAllWithAlerts(filter);

    // Tính toán số lượng theo từng màu cảnh báo
    const counts = {
      total: batches.length,
      greenCount: batches.filter(b => b.alertColor === 'GREEN').length,
      yellowCount: batches.filter(b => b.alertColor === 'YELLOW').length,
      redCount: batches.filter(b => b.alertColor === 'RED').length,
      expiredCount: batches.filter(b => b.alertColor === 'EXPIRED').length,
      totalInventoryCost: batches.reduce((sum, b) => sum + Number(b.totalInventoryCost || 0), 0),
      totalAtRiskCost: batches.reduce((sum, b) => sum + Number(b.atRiskCost || 0), 0)
    };

    return {
      success: true,
      counts,
      data: batches
    };
  }
}

module.exports = GetBatchAlertsUseCase;
