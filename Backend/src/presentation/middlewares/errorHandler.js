// src/presentation/middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error('[API Error]', err.stack || err.message);

  const lowerMsg = (err.message || '').toLowerCase();
  const isBusinessError = err.statusCode || 
    lowerMsg.includes('từ chối') || 
    lowerMsg.includes('không đủ tồn kho') || 
    lowerMsg.includes('không hợp lệ') || 
    lowerMsg.includes('chỉ đạt rsl') ||
    lowerMsg.includes('rule 7') ||
    lowerMsg.includes('đã tồn tại') ||
    lowerMsg.includes('bắt buộc') ||
    lowerMsg.includes('không được để trống') ||
    lowerMsg.includes('chính xác') ||
    lowerMsg.includes('phải lớn hơn') ||
    lowerMsg.includes('phải là số') ||
    lowerMsg.includes('cửa hàng hiện đang ở trạng thái') ||
    lowerMsg.includes('cửa hàng đang trong phiên kiểm kê') ||
    lowerMsg.includes('ngừng kinh doanh') ||
    lowerMsg.includes('tranh chấp tồn kho') ||
    lowerMsg.includes('giỏ hàng bán lẻ rỗng') ||
    lowerMsg.includes('vượt quá') ||
    lowerMsg.includes('50002') ||
    lowerMsg.includes('50003') ||
    lowerMsg.includes('không tồn tại') ||
    lowerMsg.includes('quá hạn') ||
    lowerMsg.includes('hết hạn') ||
    lowerMsg.includes('hết hàng');
  const statusCode = err.statusCode || (lowerMsg.includes('50003') ? 404 : (isBusinessError ? 400 : 500));

  // Suy diễn fallback error code nếu use case chưa gắn kèm
  let code = err.code;
  if (!code && err.message) {
    if (lowerMsg.includes('kiểm kê định kỳ') || lowerMsg.includes('inventory')) {
      code = 'ERR_STORE_INVENTORY';
    } else if (lowerMsg.includes('cửa hàng') && (lowerMsg.includes('closed') || lowerMsg.includes('trạng thái'))) {
      code = 'ERR_STORE_CLOSED';
    } else if (lowerMsg.includes('ngừng kinh doanh')) {
      code = 'ERR_PRODUCT_INACTIVE';
    } else if (lowerMsg.includes('vượt quá số lượng tồn') || lowerMsg.includes('50002') || lowerMsg.includes('vượt quá')) {
      code = 'ERR_DISPOSAL_EXCEEDS_STOCK';
    } else if (lowerMsg.includes('50003') || (lowerMsg.includes('không tìm thấy') && lowerMsg.includes('tiêu hủy'))) {
      code = 'ERR_SPOILAGE_NOT_FOUND';
    } else if (lowerMsg.includes('số lượng') || lowerMsg.includes('giỏ hàng bán lẻ rỗng') || lowerMsg.includes('phải là số')) {
      code = 'ERR_INVALID_QUANTITY';
    } else if (lowerMsg.includes('ngày sản xuất') || lowerMsg.includes('hạn sử dụng') || lowerMsg.includes('phải lớn hơn')) {
      code = 'ERR_INVALID_DATES';
    } else if (lowerMsg.includes('rule 7') || lowerMsg.includes('chỉ đạt rsl')) {
      code = 'ERR_INBOUND_RSL_REJECTED';
    } else if (lowerMsg.includes('hết hạn sử dụng') || lowerMsg.includes('daysleft <= 0') || lowerMsg.includes('đã hết hạn')) {
      code = 'ERR_BATCH_EXPIRED';
    } else if (lowerMsg.includes('không đủ tồn kho') || lowerMsg.includes('hết hàng')) {
      code = 'ERR_INSUFFICIENT_STOCK';
    } else if (lowerMsg.includes('tranh chấp tồn kho') || lowerMsg.includes('50001')) {
      code = 'ERR_CONCURRENCY_CONFLICT';
    }
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    ...(code ? { code } : {}),
    ...(err.details ? { details: err.details } : {}),
    message: err.message || 'Đã xảy ra lỗi máy chủ nội bộ.',
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;
