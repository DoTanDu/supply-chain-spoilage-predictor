// src/domain/services/FefoAllocationPolicy.js
/**
 * Domain Service: Chính sách Phân bổ Xuất kho Bán lẻ theo chuẩn FEFO (Rule 2 & Rule 3)
 * Tự động bóc tách lô có hạn sử dụng gần nhất ra xuất trước.
 * Tự động bẻ nhỏ đơn hàng qua nhiều lô (Split Order Scenario) khi khách mua số lượng lớn.
 * Chống tồn kho âm tuyệt đối tại mọi thời điểm.
 */
class FefoAllocationPolicy {
  /**
   * Phân bổ số lượng cần bán qua các lô hàng khả dụng theo chuẩn FEFO
   * @param {Object} params
   * @param {number} params.productId Mã ID sản phẩm
   * @param {string} params.productName Tên sản phẩm
   * @param {number} params.requestedQuantity Số lượng khách mua
   * @param {number} params.sellingPrice Giá bán lẻ niêm yết của sản phẩm
   * @param {Array} params.availableBatches Danh sách các lô hàng của sản phẩm
   * @returns {Object} Chi tiết phân bổ các dòng lô kèm giá sau chiết khấu
   */
  static allocate({
    productId,
    productName = '',
    requestedQuantity,
    sellingPrice,
    availableBatches = []
  }) {
    const qtyNeeded = Number(requestedQuantity);
    const basePrice = Number(sellingPrice);

    if (isNaN(qtyNeeded) || qtyNeeded <= 0 || !Number.isInteger(qtyNeeded)) {
      const err = new Error(`Số lượng mua không hợp lệ: ${requestedQuantity}. Phải là số nguyên dương lớn hơn 0!`);
      err.statusCode = 400;
      err.code = 'ERR_INVALID_QUANTITY';
      throw err;
    }
    if (isNaN(basePrice) || basePrice < 0) {
      throw new Error(`Giá niêm yết sản phẩm không hợp lệ: ${sellingPrice}`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Lọc các lô còn tồn và còn hạn sử dụng hợp lệ (Rule 5: DaysLeft > 0)
    const validBatches = availableBatches
      .map(b => {
        const exp = new Date(b.expiryDate || b.expiry_date);
        exp.setHours(0, 0, 0, 0);
        const daysLeft = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const currentQty = Number(b.currentQuantity !== undefined ? b.currentQuantity : b.current_quantity);
        const discountPct = Number(b.discountPercent !== undefined ? b.discountPercent : (b.discount_percent || 0));

        return {
          id: b.id,
          batchCode: b.batchCode || b.batch_code,
          expiryDate: exp,
          daysLeft,
          currentQuantity: currentQty,
          discountPercent: discountPct,
          importPrice: Number(b.importPrice !== undefined ? b.importPrice : b.import_price || 0),
          status: b.status || 'ACTIVE'
        };
      })
      .filter(b => (
        b.currentQuantity > 0 &&
        b.daysLeft > 0 &&
        b.status !== 'EXPIRED' &&
        b.status !== 'DISPOSED'
      ));

    // 2. Sắp xếp thứ tự ưu tiên FEFO: expiryDate ASC (hạn gần ra trước), id ASC
    validBatches.sort((a, b) => {
      const timeDiff = a.expiryDate.getTime() - b.expiryDate.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.id - b.id;
    });

    // 3. Kiểm tra tổng tồn kho khả dụng (Rule 3: Chống tồn kho âm)
    const totalAvailable = validBatches.reduce((sum, b) => sum + b.currentQuantity, 0);
    if (totalAvailable < qtyNeeded) {
      const err = new Error(
        `Không đủ tồn kho khả dụng cho sản phẩm [${productName || productId}]! ` +
        `Yêu cầu: ${qtyNeeded}, Tồn khả dụng còn hạn: ${totalAvailable}`
      );
      err.statusCode = 400;
      err.code = 'ERR_INSUFFICIENT_STOCK';
      err.details = {
        productId: Number(productId),
        productName,
        requestedQuantity: qtyNeeded,
        availableQuantity: totalAvailable,
        shortfall: qtyNeeded - totalAvailable
      };
      throw err;
    }

    // 4. Bóc tách từng lô và bẻ nhỏ đơn hàng (Split Order)
    let remaining = qtyNeeded;
    const allocations = [];

    for (const batch of validBatches) {
      if (remaining <= 0) break;

      const takeQty = Math.min(batch.currentQuantity, remaining);
      
      // Tính đơn giá sau chiết khấu Quick Markdown nếu lô đang xả hàng
      let unitPrice = basePrice;
      if (batch.discountPercent > 0) {
        unitPrice = Math.round(basePrice * (1.0 - (batch.discountPercent / 100.0)));
      }

      const lineTotal = Math.round(takeQty * unitPrice);

      allocations.push({
        batchId: batch.id,
        batchCode: batch.batchCode,
        expiryDate: batch.expiryDate.toISOString().slice(0, 10),
        daysLeft: batch.daysLeft,
        quantityAllocated: takeQty,
        discountPercent: batch.discountPercent,
        originalPrice: basePrice,
        unitPrice,
        lineTotal,
        remainingInBatchAfterSale: batch.currentQuantity - takeQty,
        isSplitLine: takeQty < qtyNeeded
      });

      remaining -= takeQty;
    }

    const totalAmount = allocations.reduce((sum, a) => sum + a.lineTotal, 0);

    return {
      productId: Number(productId),
      productName,
      requestedQuantity: qtyNeeded,
      fulfilledQuantity: qtyNeeded,
      totalAmount,
      isSplitOrder: allocations.length > 1,
      totalBatchesUsed: allocations.length,
      allocations
    };
  }
}

module.exports = FefoAllocationPolicy;
