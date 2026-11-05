// src/application/use-cases/shift/SubmitShiftHandoverUseCase.js
const ShiftHandover = require('../../../domain/entities/ShiftHandover');

/**
 * Use Case: Ký xác nhận điện tử và lưu trữ Biên bản Bàn giao Ca (Mục 15.1 Bước 4 & Rule 11 SSOT)
 */
class SubmitShiftHandoverUseCase {
  constructor({ auditLogRepository }) {
    this.auditLogRepository = auditLogRepository;
  }

  async execute({
    shiftType = 'MORNING',
    handoverPerson,
    receiverPerson,
    posSalesAmount = 0,
    cashInDrawer = 0,
    cashDifference = null,
    redBatchesCount = 0,
    yellowBatchesCount = 0,
    wasteCount = 0,
    notes = '',
    ipAddress = '127.0.0.1'
  }) {
    // 1. Khởi tạo Domain Entity ShiftHandover (tự động validation & generate mã SH-YYYYMMDD-xxxxxx)
    const handover = new ShiftHandover({
      shiftType,
      handoverPerson,
      receiverPerson,
      posSalesAmount,
      cashInDrawer,
      cashDifference,
      redBatchesCount,
      yellowBatchesCount,
      wasteCount,
      notes
    });

    const handoverData = handover.toJSON();
    const logDesc = `HANDOVER_JSON:${JSON.stringify(handoverData)}`;

    // 2. Ghi nhận bất biến vào system_audit_logs (Rule 11)
    if (this.auditLogRepository) {
      await this.auditLogRepository.log({
        userName: handover.handoverPerson,
        action: 'SHIFT_HANDOVER',
        entityName: 'shifts',
        entityId: handover.handoverCode,
        description: logDesc,
        ipAddress
      });
    }

    return {
      success: true,
      message: `Đã ký xác nhận điện tử và lưu biên bản bàn giao ${handover.shiftLabel} thành công!`,
      data: handoverData
    };
  }
}

module.exports = SubmitShiftHandoverUseCase;

