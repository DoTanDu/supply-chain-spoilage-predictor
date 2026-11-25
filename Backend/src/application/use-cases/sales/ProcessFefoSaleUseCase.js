// src/application/use-cases/sales/ProcessFefoSaleUseCase.js
const SaleOrder = require('../../../domain/entities/SaleOrder');
const FefoAllocationPolicy = require('../../../domain/services/FefoAllocationPolicy');
const LightGbmForecastEngine = require('../../../infrastructure/services/LightGbmForecastEngine');

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
    storeId = 1,
    saleDate = null,
    transactionCode = null,
    weather = 'NORMAL',
    isHoliday = false,
    cashierId = null,
    cashierName = 'Nhân viên cửa hàng'
  }) {
    if (!Array.isArray(items) || items.length === 0) {
      const err = new Error('Danh sách sản phẩm xuất bán rỗng! Vui lòng chọn ít nhất một sản phẩm.');
      err.statusCode = 400;
      err.code = 'ERR_INVALID_QUANTITY';
      throw err;
    }

    const targetStoreId = Number(storeId || 1);
    const storeProfile = await this.storeProfileRepository.getProfile(targetStoreId);
    if (storeProfile && !storeProfile.isOpenForSales()) {
      const isInventory = storeProfile.status === 'INVENTORY_AUDIT' || storeProfile.status === 'INVENTORY';
      const code = isInventory ? 'ERR_STORE_INVENTORY' : 'ERR_STORE_CLOSED';
      const msg = isInventory
        ? `Chi nhánh đang trong phiên kiểm kê [${storeProfile.status}]. Tạm khóa ghi nhận bán hàng!`
        : `Chi nhánh hiện đang ở trạng thái [${storeProfile.status}], tạm khóa xuất bán hàng!`;
      const err = new Error(msg);
      err.statusCode = 400;
      err.code = code;
      throw err;
    }

    const saleOrder = new SaleOrder({
      transactionCode: transactionCode || null,
      storeId: targetStoreId,
      cashierId,
      saleDate: saleDate ? new Date(saleDate) : new Date(),
      weather,
      isHoliday
    });

    const detailedAllocationsSummary = [];
    const fefoDetails = [];

    // 3. Xác thực từng dòng giỏ hàng (tách riêng dòng đích danh lô vs dòng FEFO tự động)
    const aggregatedList = [];
    const aggregatedIdxByKey = new Map();
    const productCache = new Map();
    const batchesCache = new Map();

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

      let product = productCache.get(pId);
      if (!product) {
        product = await this.productRepository.findById(pId);
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
        productCache.set(pId, product);
      }

      let allBatches = batchesCache.get(pId);
      if (!allBatches) {
        allBatches = (typeof this.batchRepository.findByProductId === 'function')
          ? await this.batchRepository.findByProductId(pId, targetStoreId)
          : [];
        batchesCache.set(pId, allBatches);
      }

      const prefBatchId = cartItem.batchId ? Number(cartItem.batchId) : null;
      const prefBatchCode = cartItem.batchCode ? String(cartItem.batchCode).trim() : null;

      // Nếu chỉ định đích danh mã lô (từ quét GS1-128 / tem giảm giá) -> xác thực tồn tại & chưa hết hạn (Rule 5)
      if (prefBatchId || prefBatchCode) {
        const targetBatch = allBatches.find(b =>
          (prefBatchId && Number(b.id) === prefBatchId) ||
          (prefBatchCode && String(b.batchCode || b.batch_code || '').trim().toUpperCase() === prefBatchCode.toUpperCase())
        );
        if (!targetBatch) {
          const err = new Error(`Không tìm thấy mã lô [${prefBatchCode || prefBatchId}] của sản phẩm "${product.name}" tại Chi nhánh #${targetStoreId}!`);
          err.statusCode = 404;
          err.code = 'ERR_BATCH_NOT_FOUND';
          throw err;
        }
        const daysLeft = Number(targetBatch.daysLeft !== undefined ? targetBatch.daysLeft : 0);
        if (daysLeft <= 0 || targetBatch.status === 'EXPIRED') {
          const err = new Error(`Lô hàng [${targetBatch.batchCode || targetBatch.batch_code}] đã hết hạn sử dụng (DaysLeft <= 0). Khóa cứng xuất bán POS theo Rule 5!`);
          err.statusCode = 400;
          err.code = 'ERR_BATCH_EXPIRED';
          throw err;
        }
        if (targetBatch.status === 'DISPOSED') {
          const err = new Error(`Lô hàng [${targetBatch.batchCode || targetBatch.batch_code}] đã tiêu hủy hoặc xuất hết!`);
          err.statusCode = 400;
          err.code = 'ERR_INSUFFICIENT_STOCK';
          throw err;
        }
      }

      const aggKey = `${pId}::${prefBatchId || prefBatchCode || 'FEFO'}::${cartItem.strictBatch ? '1' : '0'}`;
      if (aggregatedIdxByKey.has(aggKey)) {
        const entry = aggregatedList[aggregatedIdxByKey.get(aggKey)];
        entry.qty += qty;
      } else {
        aggregatedIdxByKey.set(aggKey, aggregatedList.length);
        aggregatedList.push({
          pId,
          qty,
          preferredBatchId: prefBatchId,
          preferredBatchCode: prefBatchCode,
          strictBatch: Boolean(cartItem.strictBatch)
        });
      }
    }

    // 3.1 Phân bổ FEFO (hoặc ưu tiên lô được quét đích danh) theo từng nhóm sản phẩm
    const consumedMap = new Map();
    for (const entry of aggregatedList) {
      const { pId, qty, preferredBatchId, preferredBatchCode, strictBatch } = entry;
      const product = productCache.get(pId);
      const allBatches = batchesCache.get(pId) || [];

      const rawAvailableBatches = await this.batchRepository.findAvailableByProductIdFefo(pId, targetStoreId);
      const availableBatches = (rawAvailableBatches || []).map(b => ({
        ...b,
        currentQuantity: Math.max(0, Number(b.currentQuantity ?? b.current_quantity ?? 0) - Number(consumedMap.get(Number(b.id)) || 0))
      }));

      if (!availableBatches || availableBatches.length === 0) {
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

      const allocationResult = FefoAllocationPolicy.allocate({
        productId: product.id,
        productName: product.name,
        requestedQuantity: qty,
        sellingPrice: product.sellingPrice,
        availableBatches,
        preferredBatchId,
        preferredBatchCode,
        strictBatch
      });

      for (const line of allocationResult.allocations) {
        consumedMap.set(Number(line.batchId), Number(consumedMap.get(Number(line.batchId)) || 0) + Number(line.quantityAllocated));
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
      LightGbmForecastEngine.clearCache();
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
        storeName: storeProfile ? storeProfile.storeName : 'SmartSupply Store',
        cashier: cashierName,
        message: 'Đã ghi nhận xuất bán FEFO thành công.'
      }
    };
  }
}

module.exports = ProcessFefoSaleUseCase;
