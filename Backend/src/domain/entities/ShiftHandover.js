// src/domain/entities/ShiftHandover.js
/**
 * Entity: Biên bản Bàn giao Ca trực Điện tử (Mục 15 SSOT)
 * Chuẩn hóa cấu trúc phiên bàn giao ca, đối soát tiền két và các chỉ số rủi ro cận date
 */
class ShiftHandover {
  static SHIFTS = {
    MORNING: { code: 'MORNING', label: 'Ca Sáng (06:00 - 14:00)' },
    AFTERNOON: { code: 'AFTERNOON', label: 'Ca Chiều (14:00 - 22:00)' }
  };

  constructor({
    handoverCode = null,
    shiftType = 'MORNING',
    shiftLabel = null,
    handoverPerson,
    receiverPerson,
    posSalesAmount = 0,
    cashInDrawer = 0,
    cashDifference = null,
    redBatchesCount = 0,
    yellowBatchesCount = 0,
    wasteCount = 0,
    notes = '',
    timestamp = new Date()
  }) {
    if (!handoverPerson || !String(handoverPerson).trim()) {
      const err = new Error('Vui lòng cung cấp tên Người bàn giao ca!');
      err.statusCode = 400;
      err.code = 'ERR_MISSING_HANDOVER_PERSON';
      throw err;
    }
    if (!receiverPerson || !String(receiverPerson).trim()) {
      const err = new Error('Vui lòng cung cấp tên Người tiếp nhận ca!');
      err.statusCode = 400;
      err.code = 'ERR_MISSING_RECEIVER_PERSON';
      throw err;
    }

    const normShift = String(shiftType || 'MORNING').toUpperCase();
    this.shiftType = ShiftHandover.SHIFTS[normShift] ? normShift : 'MORNING';
    this.shiftLabel = shiftLabel || ShiftHandover.SHIFTS[this.shiftType].label;

    this.handoverPerson = String(handoverPerson).trim();
    this.receiverPerson = String(receiverPerson).trim();

    this.posSalesAmount = Number(posSalesAmount) || 0;
    this.cashInDrawer = Number(cashInDrawer) || 0;
    this.cashDifference = (cashDifference !== null && cashDifference !== undefined) ? Number(cashDifference) : (this.cashInDrawer - this.posSalesAmount);

    this.redBatchesCount = Math.max(0, Number(redBatchesCount) || 0);
    this.yellowBatchesCount = Math.max(0, Number(yellowBatchesCount) || 0);
    this.wasteCount = Math.max(0, Number(wasteCount) || 0);

    this.notes = String(notes || '').trim();
    this.timestamp = new Date(timestamp);
    this.handoverCode = handoverCode || this.generateHandoverCode();
  }

  generateHandoverCode() {
    const now = this.timestamp || new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `SH-${dateStr}-${rand}`;
  }

  isBalanced() {
    return this.cashDifference === 0;
  }

  isDeficit() {
    return this.cashDifference < 0;
  }

  isSurplus() {
    return this.cashDifference > 0;
  }

  static determineShiftType(date = new Date()) {
    const hour = date.getHours();
    return hour >= 6 && hour < 14 ? 'MORNING' : 'AFTERNOON';
  }

  toJSON() {
    return {
      handoverCode: this.handoverCode,
      shiftType: this.shiftType,
      shiftLabel: this.shiftLabel,
      handoverPerson: this.handoverPerson,
      receiverPerson: this.receiverPerson,
      posSalesAmount: this.posSalesAmount,
      cashInDrawer: this.cashInDrawer,
      cashDifference: this.cashDifference,
      redBatchesCount: this.redBatchesCount,
      yellowBatchesCount: this.yellowBatchesCount,
      wasteCount: this.wasteCount,
      notes: this.notes,
      timestamp: this.timestamp.toISOString()
    };
  }
}

module.exports = ShiftHandover;
