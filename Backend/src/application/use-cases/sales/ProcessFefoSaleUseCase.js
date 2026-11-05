// src/application/use-cases/sales/ProcessFefoSaleUseCase.js
const SaleOrder = require('../../../domain/entities/SaleOrder');
const FefoAllocationPolicy = require('../../../domain/services/FefoAllocationPolicy');

/**
 * Use Case: Thanh toán Bán lẻ tại quầy POS theo chuẩn FEFO (Mục 21.1 & Rule 2, Rule 3)
 * Bán hàng = Xuất kho trực tiếp.
 * Tự động bóc tách các lô HSD gần nhất ra trước.
 * Tự động bẻ nhỏ đơn hàng qua nhiều lô (Split Order Scenario).
 * Bảo vệ chống tồn kho âm bằng Transaction SQL Server và khóa UPDLOCK, ROWLOCK.
 */
class ProcessFefoSaleUseCase {
  constructor({
    saleRepository,
    batchRepository,
    productRepository,
    storeProfileRepository,
    auditLogRepository
  }) {
    this.saleRepository = saleRepository;
    this.batchRepository = batchRepository;
    this.productRepository = productRepository;
    this.storeProfileRepository = storeProfileRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute({
    items = [],
    weather = 'NORMAL',
    isHoliday = false,
    cashierId = null,
    cashierName = 'Thu ngân quầy POS'
  }) {
    if (!Array.isArray(items) || items.length === 0) {
      const err = new Error('Giỏ hàng bán lẻ rỗng! Vui lòng quét ít nhất một sản phẩm.');
      err.statusCode = 400;
      err.code = 'ERR_INVALID_QUANTITY';
      throw err;
    }

    // 1. Kiểm tra trạng thái cửa hàng LHU Mart (Rule 1 & Mục 10.1)
    const storeProfile = await this.storeProfileRepository.getProfile();
    if (storeProfile && !storeProfile.isOpenForSales()) {
      const isInventory = storeProfile.status === 'INVENTORY_AUDIT' || storeProfile.status === 'INVENTORY';
      const code = isInventory ? 'ERR_STORE_INVENTORY' : 'ERR_STORE_CLOSED';
      const msg = isInventory
        ? `Cửa hàng đang trong phiên kiểm kê định kỳ [${storeProfile.status}]. Tạm khóa chức năng bán lẻ tại quầy POS!`
        : `Cửa hàng LHU Mart hiện đang ở trạng thái [${storeProfile.status}]. Quầy thu ngân tạm khóa chức năng thanh toán để phục vụ kiểm kê hoặc ngoài giờ hoạt động!`;
      const err = new Error(msg);
      err.statusCode = 400;
      err.code = code;
      throw err;
    }

    // 2. Khởi tạo SaleOrder
    const saleOrder = new SaleOrder({
      cashierId,
      saleDate: new Date(),
      weather,
      isHoliday
    });

    const detailedAllocationsSummary = [];
    const fefoDetails = [];

    // 3. Xử lý từng sản phẩm trong giỏ hàng: Bóc tách và bẻ lô theo chuẩn FEFO
    for (const cartItem of items) {
      const pId = Number(cartItem.productId || cartItem.id);
      const rawQty = cartItem.quantity !== undefined 
        ? cartItem.quantity 
        : (cartItem.quantitySold !== undefined ? cartItem.quantitySold : 1);
      const qty = Number(rawQty);

      if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
        const err = new Error(`Số lượng mua của sản phẩm ID ${pId} không hợp lệ (${qty}). Phải là số nguyên dương (> 0)!`);
        err.statusCode = 400;
        err.code = 'ERR_INVALID_QUANTITY';
        throw err;
      }

      // Lấy thông tin sản phẩm
      const product = await this.productRepository.findById(pId);
      if (!product) {
        const err = new Error(`Sản phẩm với ID [${pId}] không tồn tại trong hệ thống!`);
        err.statusCode = 404;
        err.code = 'ERR_PRODUCT_NOT_FOUND';
        throw err;
      }
      if (!product.isActive) {
        const err = new Error(`Sản phẩm "${product.name}" hiện đang ngừng kinh doanh, không thể xuất bán!`);
        err.statusCode = 400;
        err.code = 'ERR_PRODUCT_INACTIVE';
        throw err;
      }

      // Lấy toàn bộ các lô của sản phẩm để kiểm tra hạn dùng (Rule 5 & Điều kiện 4 Mục 10)
      const allBatches = (typeof this.batchRepository.findByProductId === 'function')
        ? await this.batchRepository.findByProductId(pId)
        : [];

      // Nếu chỉ định đích danh mã lô mà lô đó đã hết hạn -> Chặn ngay
      if (cartItem.batchId || cartItem.batchCode) {
        const targetBatch = allBatches.find(b =>
          (cartItem.batchId && b.id === Number(cartItem.batchId)) ||
          (cartItem.batchCode && (b.batchCode === cartItem.batchCode || b.batch_code === cartItem.batchCode))
        );
        if (targetBatch) {
          const daysLeft = Number(targetBatch.daysLeft !== undefined ? targetBatch.daysLeft : 0);
          if (daysLeft <= 0 || targetBatch.status === 'EXPIRED') {
            const err = new Error(`Lô hàng [${targetBatch.batchCode || targetBatch.batch_code}] đã hết hạn sử dụng (DaysLeft <= 0). Khóa cứng xuất bán POS theo Rule 5!`);
            err.statusCode = 400;
            err.code = 'ERR_BATCH_EXPIRED';
            throw err;
          }
        }
      }

      // Lấy danh sách các lô khả dụng theo chuẩn FEFO (ExpiryDate ASC, id ASC)
      const availableBatches = await this.batchRepository.findAvailableByProductIdFefo(pId);
      if (!availableBatches || availableBatches.length === 0) {
        // Kiểm tra xem sản phẩm có lô nào còn tồn nhưng đã hết hạn sử dụng không (Rule 5)
        const hasExpiredBatches = allBatches.some(b => 
          Number(b.currentQuantity || b.current_quantity) > 0 && 
          (Number(b.daysLeft) <= 0 || b.status === 'EXPIRED')
        );
        if (hasExpiredBatches) {
          const err = new Error(`Toàn bộ các lô hàng của sản phẩm "${product.name}" đã hết hạn sử dụng (DaysLeft <= 0). Khóa cứng bán POS theo Rule 5!`);
          err.statusCode = 400;
          err.code = 'ERR_BATCH_EXPIRED';
          throw err;
        }

        const err = new Error(`Sản phẩm "${product.name}" hiện đã hết hàng trong kho!`);
        err.statusCode = 400;
        err.code = 'ERR_INSUFFICIENT_STOCK';
        err.details = {
          productId: product.id,
          productName: product.name,
          requestedQuantity: qty,
          availableQuantity: 0,
          shortfall: qty
        };
        throw err;
      }

      // Áp dụng Chính sách phân bổ FEFO (tự động bẻ đơn qua nhiều lô nếu cần)
      const allocationResult = FefoAllocationPolicy.allocate({
        productId: product.id,
        productName: product.name,
        requestedQuantity: qty,
        sellingPrice: product.sellingPrice,
        availableBatches
      });

      // Thêm từng dòng lô đã bẻ vào SaleOrder
      for (const line of allocationResult.allocations) {
        saleOrder.addItem({
          productId: product.id,
          batchId: line.batchId,
          batchCode: line.batchCode,
          productName: product.name,
          quantitySold: line.quantityAllocated,
          salePrice: line.unitPrice,
          originalPrice: line.originalPrice,
          discountPercent: line.discountPercent
        });

        fefoDetails.push({
          productId: product.id,
          productName: product.name,
          unit: product.unit || 'Cái',
          batchId: line.batchId,
          batchCode: line.batchCode,
          expiryDate: line.expiryDate,
          daysLeft: line.daysLeft,
          deductedQty: line.quantityAllocated,
          discountPercent: line.discountPercent,
          originalPrice: line.originalPrice,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          isSplitLine: allocationResult.isSplitOrder
        });
      }

      detailedAllocationsSummary.push(allocationResult);
    }

    // 4. Thực thi Transaction SQL Server với khóa UPDLOCK (Rule 3 & Điều kiện 7 Mục 10)
    let transactionResult;
    try {
      transactionResult = await this.saleRepository.executeFefoCheckoutTransaction({ saleOrder });
    } catch (err) {
      if (err.message && (err.message.includes('Tranh chấp tồn kho') || err.message.includes('50001'))) {
        err.statusCode = 409;
        err.code = 'ERR_CONCURRENCY_CONFLICT';
      }
      throw err;
    }

    // 5. Ghi nhật ký kiểm toán bất biến (Rule 11)
    if (this.auditLogRepository) {
      await this.auditLogRepository.log({
        userId: cashierId ? Number(cashierId) : null,
        userName: cashierName,
        action: 'POS_CHECKOUT',
        entityName: 'SALES_HISTORY',
        entityId: saleOrder.transactionCode,
        description: `Bán lẻ xuất kho FEFO đơn ${saleOrder.transactionCode} (${saleOrder.getTotalQuantity()} SP). Tổng tiền: ${saleOrder.getTotalAmount().toLocaleString('vi-VN')} đ.`
      });
    }

    return {
      success: true,
      transactionCode: saleOrder.transactionCode,
      orderCode: saleOrder.transactionCode,
      saleDate: saleOrder.saleDate.toISOString(),
      dayOfWeek: saleOrder.dayOfWeek,
      weather: saleOrder.weather,
      isHoliday: saleOrder.isHoliday,
      totalQuantity: saleOrder.getTotalQuantity(),
      totalAmount: saleOrder.getTotalAmount(),
      totalRevenue: saleOrder.getTotalAmount(),
      isSplitOrder: detailedAllocationsSummary.some(s => s.isSplitOrder),
      lines: saleOrder.items,
      fefoDetails,
      allocationsSummary: detailedAllocationsSummary,
      receiptDetails: {
        storeName: storeProfile ? storeProfile.storeName : 'Cửa hàng Bán lẻ LHU Mart',
        cashier: cashierName,
        message: 'Cảm ơn quý khách đã mua sắm tại LHU Mart!'
      }
    };
  }
}

module.exports = ProcessFefoSaleUseCase;
