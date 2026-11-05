// src/presentation/controllers/ShiftHandoverController.js
/**
 * Controller: Quản lý Ca trực & Bàn giao ca làm việc điện tử (Mục 15 SSOT)
 */
class ShiftHandoverController {
  constructor({ submitShiftHandoverUseCase, getShiftSummaryUseCase, getShiftHandoverHistoryUseCase }) {
    this.submitShiftHandoverUseCase = submitShiftHandoverUseCase;
    this.getShiftSummaryUseCase = getShiftSummaryUseCase;
    this.getShiftHandoverHistoryUseCase = getShiftHandoverHistoryUseCase;
  }

  async getSummary(req, res, next) {
    try {
      const result = await this.getShiftSummaryUseCase.execute();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const limit = Number(req.query.limit || 100);
      const result = await this.getShiftHandoverHistoryUseCase.execute({ limit });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async submitHandover(req, res, next) {
    try {
      const {
        shiftType = 'MORNING',
        handoverPerson,
        receiverPerson,
        posSalesAmount = 0,
        cashInDrawer = 0,
        cashDifference = null,
        redBatchesCount = 0,
        yellowBatchesCount = 0,
        wasteCount = 0,
        notes = ''
      } = req.body;

      const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await this.submitShiftHandoverUseCase.execute({
        shiftType,
        handoverPerson,
        receiverPerson,
        posSalesAmount,
        cashInDrawer,
        cashDifference,
        redBatchesCount,
        yellowBatchesCount,
        wasteCount,
        notes,
        ipAddress
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ShiftHandoverController;
