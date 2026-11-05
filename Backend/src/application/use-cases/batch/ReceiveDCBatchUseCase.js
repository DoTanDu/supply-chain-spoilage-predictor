// src/application/use-cases/batch/ReceiveDCBatchUseCase.js
const ShelfLife = require('../../../domain/value-objects/ShelfLife');

/**
 * Use Case: Tiếp nhận đợt hàng từ xe tải Kho tổng DC Biên Hòa (Mục 21.2 & Rule 7)
 * Tiêu chuẩn nhận date nghiêm ngặt: RSL_inbound >= 70%
 */
class ReceiveDCBatchUseCase {
  constructor({ goodsReceiptRepository, productRepository, storeProfileRepository, purchaseOrderRepository, auditLogRepository }) {
    this.goodsReceiptRepository = goodsReceiptRepository;
    this.productRepository = productRepository;
    this.storeProfileRepository = storeProfileRepository;
    this.purchaseOrderRepository = purchaseOrderRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute({
    supplierId = 1,
    receivedBy,
    receivedByName = 'Nhân viên kho',
    receiptDate = new Date(),
    notes = '',
    purchaseOrderId = null,
    batches = []
  }) {
    if (!Array.isArray(batches) || batches.length === 0) {
      throw new Error('Danh sách hàng tiếp nhận từ DC không được để trống!');
    }
    if (!receivedBy) {
      throw new Error('ID nhân viên nhận hàng (receivedBy) là bắt buộc!');
    }

    // Lấy cấu hình ngưỡng RSL tối thiểu của cửa hàng (mặc định 70%)
    const storeProfile = await this.storeProfileRepository.getProfile();
    const minRslPercent = storeProfile ? Number(storeProfile.minInboundRslPercent || 70.0) : 70.0;

    const validatedBatches = [];
    let calculatedTotalCost = 0;

    for (let i = 0; i < batches.length; i++) {
      const b = batches[i];
      const prod = await this.productRepository.findById(b.productId);
      if (!prod) {
        throw new Error(`Sản phẩm với ID [${b.productId}] không tồn tại trong danh mục hệ thống!`);
      }

      const mfgRaw = b.manufactureDate || b.manufacturingDate;
      const expRaw = b.expiryDate || b.expirationDate;

      if (!mfgRaw) {
        throw new Error(`Lô hàng ${b.batchCode || prod.name}: Ngày sản xuất (manufactureDate) không được để trống!`);
      }
      if (!expRaw) {
        throw new Error(`Lô hàng ${b.batchCode || prod.name}: Hạn sử dụng (expiryDate) không được để trống!`);
      }

      const mfg = new Date(mfgRaw);
      const exp = new Date(expRaw);
      const imp = new Date(receiptDate || new Date());

      if (isNaN(mfg.getTime()) || isNaN(exp.getTime())) {
        throw new Error(`Lô hàng ${b.batchCode || prod.name}: Định dạng ngày sản xuất hoặc ngày hết hạn không hợp lệ!`);
      }

      // 1. Kiểm tra ngày hết hạn bắt buộc phải lớn hơn ngày sản xuất
      if (exp <= mfg) {
        throw new Error(`Lô hàng ${b.batchCode || prod.name}: Hạn sử dụng (${expRaw}) phải lớn hơn Ngày sản xuất (${mfgRaw})!`);
      }

      // 1.1 Khóa cứng hàng đã hết hạn trước hoặc ngay thời điểm tiếp nhận (Rule 5 & Rule 7 SSOT)
      if (exp <= imp) {
        throw new Error(
          `TỪ CHỐI NHẬN HÀNG (RULE 5 & RULE 7): Lô hàng "${prod.name}" đã hết hạn sử dụng tại thời điểm giao hàng ` +
          `(HSD: ${expRaw} <= Ngày nhận: ${imp.toISOString().slice(0, 10)}). Nghiêm cấm nhập hàng hết hạn vào cửa hàng!`
        );
      }

      // 2. Kiểm định tiêu chuẩn nhận date (Rule 7: RSL_inbound >= 70%)
      const shelfLife = new ShelfLife(mfg, exp);
      const freshnessCheck = shelfLife.validateInboundFreshness(imp, minRslPercent);

      if (!freshnessCheck.isAcceptable) {
        throw new Error(
          `TỪ CHỐI NHẬN HÀNG (RULE 7): Lô hàng "${prod.name}" chỉ đạt RSL ${freshnessCheck.inboundRslPercent}%, ` +
          `dưới tiêu chuẩn tiếp nhận tối thiểu ${minRslPercent}% của cửa hàng LHU Mart! ` +
          `Hệ thống khóa lưu phiếu để ngăn chặn Kho tổng DC đẩy hàng cận date về cửa hàng.`
        );
      }

      // 3. Tự động sinh mã lô theo quy chuẩn LOT-DC-[SKU]-[YYYYMMDD]-[Số thứ tự]-[Hậu tố] nếu chưa có
      const datePart = imp.toISOString().slice(0, 10).replace(/-/g, '');
      const uniqueSuffix = Date.now().toString().slice(-4);
      const defaultBatchCode = `LOT-DC-${prod.sku}-${datePart}-${i + 1}-${uniqueSuffix}`;
      const finalBatchCode = b.batchCode ? String(b.batchCode).trim() : defaultBatchCode;

      const qty = Number(b.initialQuantity || b.quantity || b.quantityReceived);
      if (isNaN(qty) || qty <= 0) {
        throw new Error(`Số lượng nhập của sản phẩm "${prod.name}" phải là số lớn hơn 0!`);
      }

      const cost = Number(b.importPrice !== undefined ? b.importPrice : prod.costPrice);
      if (isNaN(cost) || cost < 0) {
        throw new Error(`Đơn giá vốn của sản phẩm "${prod.name}" phải là số không âm!`);
      }
      calculatedTotalCost += (qty * cost);

      validatedBatches.push({
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        batchCode: finalBatchCode,
        manufactureDate: mfg,
        expiryDate: exp,
        importDate: imp,
        initialQuantity: qty,
        importPrice: cost,
        inboundRslPercent: freshnessCheck.inboundRslPercent
      });
    }

    // 4. Tạo phiếu nhập và chèn các lô hàng mới vào CSDL trong 1 Transaction
    const receiptNumber = `GR-DC-${Date.now().toString().slice(-8)}`;
    const receiptResult = await this.goodsReceiptRepository.createReceiptWithBatches({
      receiptNumber,
      supplierId: Number(supplierId),
      receivedBy: Number(receivedBy),
      receiptDate: new Date(receiptDate),
      totalCost: Math.round(calculatedTotalCost),
      notes: notes || `Tiếp nhận xe tải DC Biên Hòa - Đạt chuẩn RSL >= ${minRslPercent}%`,
      batches: validatedBatches
    });

    // 4.1. Nếu tiếp nhận theo Đơn đặt hàng PO, tự động chuyển trạng thái PO sang DELIVERED
    if (purchaseOrderId && this.purchaseOrderRepository) {
      try {
        await this.purchaseOrderRepository.updateOrderStatus(Number(purchaseOrderId), 'DELIVERED', Number(receivedBy));
      } catch (poErr) {
        console.warn('Không thể cập nhật trạng thái PO sang DELIVERED:', poErr.message);
      }
    }

    // 5. Ghi nhật ký kiểm toán bất biến
    if (this.auditLogRepository) {
      await this.auditLogRepository.log({
        userId: Number(receivedBy),
        userName: receivedByName,
        action: 'DC_INBOUND',
        entityName: 'GOODS_RECEIPTS',
        entityId: String(receiptResult.receiptId || receiptNumber),
        description: `Tiếp nhận ${validatedBatches.length} lô hàng từ DC Biên Hòa (Phiếu ${receiptNumber}${purchaseOrderId ? `, thuộc PO #${purchaseOrderId}` : ''}). Tổng vốn: ${calculatedTotalCost.toLocaleString('vi-VN')} đ.`
      });
    }

    return {
      success: true,
      receiptId: receiptResult.receiptId,
      receiptNumber,
      totalCost: Math.round(calculatedTotalCost),
      totalBatchesReceived: validatedBatches.length,
      batches: validatedBatches,
      data: validatedBatches[0] || null
    };
  }
}

module.exports = ReceiveDCBatchUseCase;
