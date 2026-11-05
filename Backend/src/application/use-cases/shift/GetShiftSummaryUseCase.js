// src/application/use-cases/shift/GetShiftSummaryUseCase.js
const ShiftHandover = require('../../../domain/entities/ShiftHandover');

/**
 * Use Case: Lấy dữ liệu tổng hợp ca trực thời gian thực phục vụ đối soát tự động (Mục 15.1 SSOT)
 */
class GetShiftSummaryUseCase {
  constructor({ saleRepository, batchRepository, spoilageRepository, userRepository }) {
    this.saleRepository = saleRepository;
    this.batchRepository = batchRepository;
    this.spoilageRepository = spoilageRepository;
    this.userRepository = userRepository;
  }

  async execute() {
    const now = new Date();
    const hour = now.getHours();
    const shiftType = ShiftHandover.determineShiftType(now);
    const shiftLabel = ShiftHandover.SHIFTS[shiftType].label;

    const [todaySales, batches, pendingDisposals, users] = await Promise.all([
      this.saleRepository?.getTodaySalesSummary ? this.saleRepository.getTodaySalesSummary() : Promise.resolve({ todayTotalRevenue: 0, todayTransactionsCount: 0 }),
      this.batchRepository?.findAllWithAlerts ? this.batchRepository.findAllWithAlerts() : Promise.resolve([]),
      this.spoilageRepository?.getPendingDisposals ? this.spoilageRepository.getPendingDisposals() : Promise.resolve([]),
      this.userRepository?.findAll ? this.userRepository.findAll() : Promise.resolve([])
    ]);

    const redBatches = (batches || []).filter(b => (b.alertColor === 'RED' || b.status === 'CRITICAL') && Number(b.currentQuantity ?? b.quantity ?? 0) > 0);
    const yellowBatches = (batches || []).filter(b => (b.alertColor === 'YELLOW' || b.status === 'WARNING') && Number(b.currentQuantity ?? b.quantity ?? 0) > 0);
    const unrotatedBatches = (batches || []).filter(b => (b.alertColor === 'YELLOW' || b.alertColor === 'RED') && !b.isShelfRotated && Number(b.currentQuantity ?? b.quantity ?? 0) > 0);

    const wasteItemsCount = (pendingDisposals || []).reduce((sum, d) => sum + Number(d.quantityDisposed || d.quantity || 0), 0);
    const wasteCostLoss = (pendingDisposals || []).reduce((sum, d) => sum + Number(d.totalLoss || d.costLoss || 0), 0);

    const activeStaff = (users || [])
      .filter(u => u.isActive !== false)
      .map(u => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        roleCode: u.roleCode
      }));

    return {
      success: true,
      data: {
        shiftType,
        shiftLabel,
        currentHour: hour,
        todaySalesRevenue: Number(todaySales.todayTotalRevenue || 0),
        todaySalesTransactions: Number(todaySales.todayTransactionsCount || 0),
        redBatchesCount: redBatches.length,
        yellowBatchesCount: yellowBatches.length,
        unrotatedBatchesCount: unrotatedBatches.length,
        wasteItemsCount,
        wasteCostLoss,
        activeStaff
      }
    };
  }
}

module.exports = GetShiftSummaryUseCase;

