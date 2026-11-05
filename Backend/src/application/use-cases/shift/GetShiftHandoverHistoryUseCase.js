// src/application/use-cases/shift/GetShiftHandoverHistoryUseCase.js
/**
 * Use Case: Tra cứu Lịch sử các phiên Bàn giao Ca trực đã ký (Mục 15.4 & Rule 11 SSOT)
 */
class GetShiftHandoverHistoryUseCase {
  constructor({ auditLogRepository }) {
    this.auditLogRepository = auditLogRepository;
  }

  async execute({ limit = 100 } = {}) {
    const logs = await this.auditLogRepository.findRecent(Number(limit) || 100);

    const handoverLogs = (logs || [])
      .filter(l => l.actionType === 'SHIFT_HANDOVER' || l.action === 'SHIFT_HANDOVER')
      .map(l => {
        let parsed = null;
        if (l.description && l.description.includes('HANDOVER_JSON:')) {
          try {
            const rawJson = l.description.split('HANDOVER_JSON:')[1];
            parsed = JSON.parse(rawJson);
          } catch (e) {
            parsed = null;
          }
        }

        if (parsed) {
          return {
            id: l.id,
            handoverCode: parsed.handoverCode || `SH-${String(l.id).padStart(6, '0')}`,
            shiftType: parsed.shiftType || 'MORNING',
            shiftLabel: parsed.shiftLabel || (parsed.shiftType === 'MORNING' ? 'Ca Sáng (06:00 - 14:00)' : 'Ca Chiều (14:00 - 22:00)'),
            handoverPerson: parsed.handoverPerson || 'Thu ngân ca trước',
            receiverPerson: parsed.receiverPerson || 'Thu ngân ca sau',
            posSalesAmount: Number(parsed.posSalesAmount) || 0,
            cashInDrawer: Number(parsed.cashInDrawer) || 0,
            cashDifference: Number(parsed.cashDifference) || 0,
            redBatchesCount: Number(parsed.redBatchesCount) || 0,
            yellowBatchesCount: Number(parsed.yellowBatchesCount) || 0,
            wasteCount: Number(parsed.wasteCount) || 0,
            notes: parsed.notes || '',
            createdAt: parsed.timestamp || l.createdAt,
            ipAddress: l.ipAddress
          };
        }

        return {
          id: l.id,
          handoverCode: `SH-${String(l.id).padStart(6, '0')}`,
          shiftType: l.description?.includes('Ca Chiều') ? 'AFTERNOON' : 'MORNING',
          shiftLabel: l.description?.includes('Ca Chiều') ? 'Ca Chiều (14:00 - 22:00)' : 'Ca Sáng (06:00 - 14:00)',
          handoverPerson: 'Nhân viên giao',
          receiverPerson: 'Nhân viên nhận',
          posSalesAmount: 0,
          cashInDrawer: 0,
          cashDifference: 0,
          redBatchesCount: 0,
          yellowBatchesCount: 0,
          wasteCount: 0,
          notes: l.description || '',
          createdAt: l.createdAt,
          ipAddress: l.ipAddress
        };
      });

    return {
      success: true,
      count: handoverLogs.length,
      data: handoverLogs
    };
  }
}

module.exports = GetShiftHandoverHistoryUseCase;

