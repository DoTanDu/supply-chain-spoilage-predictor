/**
 * EXPORT & PRINT UTILITIES CHO LHU MART (RETAIL-STORE-01)
 * Hỗ trợ xuất dữ liệu ra file Excel CSV UTF-8 with BOM (\uFEFF)
 * Tương thích 100% Microsoft Excel trên Windows (không bao giờ lỗi font tiếng Việt)
 * Tuân thủ tiêu chuẩn RFC 4180 và 11 Core Business Rules SSOT
 */

/**
 * Kích hoạt tải file an toàn từ trình duyệt
 */
export function downloadFile(content, filename, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper format ngày giờ chuẩn VN cho tên file
 */
function getTimestampString() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  return `${dateStr}_${timeStr}`;
}

/**
 * Escape chuỗi an toàn cho định dạng CSV RFC 4180
 */
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * 1. Xuất Sổ Hao Hụt Tài Chính ra file Excel CSV có UTF-8 BOM (Rule 6 SSOT)
 * @param {Array} disposals - Danh sách các biên bản tiêu hủy
 */
export function exportSpoilageLedgerToExcel(disposals = []) {
  if (!disposals || disposals.length === 0) {
    alert('Không có dữ liệu biên bản tiêu hủy để xuất file Excel!');
    return;
  }

  const BOM = '\uFEFF';
  const headers = [
    'STT',
    'Mã Biên Bản',
    'Ngày Tiêu Hủy',
    'Mã Lô Hàng',
    'Mã SKU',
    'Tên Sản Phẩm',
    'Số Lượng Hủy',
    'Đơn Vị',
    'Đơn Giá Vốn (VND)',
    'Tổng Thiệt Hại CostLoss (VND)',
    'Lý Do Tiêu Hủy',
    'Ghi Chú',
    'Người Đề Xuất',
    'Người Phê Duyệt',
    'Trạng Thái'
  ];

  let totalQty = 0;
  let totalCost = 0;

  const rows = disposals.map((item, index) => {
    const qty = Number(item.quantity || item.quantityDisposed) || 0;
    const price = Number(item.costPrice || item.importPrice) || (qty > 0 && item.totalLoss ? Math.round(item.totalLoss / qty) : 0);
    const loss = Number(item.totalLoss || item.costLoss) || (qty * price);
    totalQty += qty;
    totalCost += loss;

    const statusText = item.status === 'APPROVED' ? 'Đã phê duyệt' : 'Chờ phê duyệt';
    let reasonText = item.reason || 'EXPIRED';
    if (reasonText === 'EXPIRED') reasonText = 'Hết hạn sử dụng';
    else if (reasonText === 'DAMAGED') reasonText = 'Hư hỏng bao bì / vỡ';
    else if (reasonText === 'SPOILED') reasonText = 'Hỏng do bảo quản';

    return [
      index + 1,
      escapeCsv(item.recordCode || item.id || `DISP-${index + 1}`),
      escapeCsv(item.disposedDate || item.date || ''),
      escapeCsv(item.batchCode || ''),
      escapeCsv(item.productSku || item.sku || ''),
      escapeCsv(item.productName || item.name || ''),
      qty,
      escapeCsv(item.unit || 'đơn vị'),
      price,
      loss,
      escapeCsv(reasonText),
      escapeCsv(item.notes || ''),
      escapeCsv(item.performedByName || item.performedBy || 'Nhân viên ca trực'),
      escapeCsv(item.approvedByName || item.approvedBy || (item.status === 'APPROVED' ? 'Cửa hàng trưởng' : 'Chờ duyệt')),
      escapeCsv(statusText)
    ].join(',');
  });

  const lines = [
    '# BÁO CÁO SỔ HAO HỤT TÀI CHÍNH BẤT BIẾN - LHU MART (RETAIL-STORE-01)',
    `# Tiêu chuẩn: Rule 6 Đặc tả Chuỗi Cung Ứng Chống Lãng Phí`,
    `# Thời điểm trích xuất: ${new Date().toLocaleString('vi-VN')}`,
    `# Tổng số biên bản ghi nhận: ${disposals.length}`,
    `# TỔNG SỐ LƯỢNG TIÊU HỦY: ${totalQty.toLocaleString('vi-VN')}`,
    `# TỔNG THIỆT HẠI TÀI CHÍNH: ${totalCost.toLocaleString('vi-VN')} VND`,
    '',
    headers.join(','),
    ...rows,
    '',
    `"TỔNG CỘNG","","","","","",${totalQty},"","",${totalCost},"","","","",""`
  ];

  const csvContent = BOM + lines.join('\r\n');
  const filename = `So_Hao_Hut_Tai_Chinh_LHUMart_${getTimestampString()}.csv`;
  downloadFile(csvContent, filename);
}

/**
 * 2. Xuất Danh Sách Tồn Kho & Vòng Đời Lô Hàng FEFO (Rule 2 & Rule 4 SSOT)
 * @param {Array} batches - Danh sách các lô hàng đang lưu kho
 */
export function exportBatchesFefoToExcel(batches = []) {
  if (!batches || batches.length === 0) {
    alert('Không có dữ liệu lô hàng để xuất file Excel!');
    return;
  }

  const BOM = '\uFEFF';
  const headers = [
    'STT',
    'Mã Lô Hàng (BatchCode)',
    'Mã SKU',
    'Tên Sản Phẩm',
    'Ngành Hàng FMCG',
    'Số Lượng Ban Đầu',
    'Tồn Khả Dụng',
    'Đơn Vị',
    'Đơn Giá Vốn (VND)',
    'Giá Bán Lẻ (VND)',
    'Tổng Vốn Lưu Kho (VND)',
    'Ngày Sản Xuất (MFG)',
    'Hạn Sử Dụng (EXP)',
    'Số Ngày Còn Lại',
    'Cấp Màu Cảnh Báo (Rule 4)',
    'Chiết Khấu Quick Markdown (%)',
    'Đã Đảo Kệ Mặt Tiền (SOP 5 Bước)',
    'Trạng Thái Lô'
  ];

  let totalAvailableStock = 0;
  let totalInventoryVal = 0;
  let totalAtRiskVal = 0;

  const rows = batches.map((b, index) => {
    const initQty = Number(b.initialQuantity !== undefined ? b.initialQuantity : b.quantity) || 0;
    const curQty = Number(b.currentQuantity !== undefined ? b.currentQuantity : b.quantity) || 0;
    const costPrice = Number(b.importPrice ?? b.costPrice) || 0;
    const salePrice = Number(b.sellingPrice ?? b.price) || 0;
    const invVal = curQty * costPrice;

    totalAvailableStock += curQty;
    totalInventoryVal += invVal;

    const alertColor = b.alertColor || (b.daysLeft <= 0 ? 'EXPIRED' : (b.daysLeft <= 3 ? 'RED' : (b.daysLeft <= 7 ? 'YELLOW' : 'GREEN')));
    if (alertColor === 'RED' || alertColor === 'YELLOW') {
      totalAtRiskVal += invVal;
    }

    let alertColorText = 'VÙNG XANH (An toàn - Bán nguyên giá)';
    if (alertColor === 'YELLOW') alertColorText = 'VÙNG VÀNG (Cảnh báo - Giảm 15%-30% & Đảo kệ)';
    else if (alertColor === 'RED') alertColorText = 'VÙNG ĐỎ (Khẩn cấp - Giảm 40%-50% xả ngay)';
    else if (alertColor === 'EXPIRED') alertColorText = 'QUÁ HẠN (Khóa cứng POS - Chờ tiêu hủy)';

    return [
      index + 1,
      escapeCsv(b.batchCode || `LOT-${b.id}`),
      escapeCsv(b.productSku || b.sku || ''),
      escapeCsv(b.productName || b.name || ''),
      escapeCsv(b.categoryName || b.category || ''),
      initQty,
      curQty,
      escapeCsv(b.unit || 'đơn vị'),
      costPrice,
      salePrice,
      invVal,
      escapeCsv(b.manufactureDate ? String(b.manufactureDate).slice(0, 10) : ''),
      escapeCsv(b.expiryDate ? String(b.expiryDate).slice(0, 10) : ''),
      Number(b.daysLeft || 0),
      escapeCsv(alertColorText),
      Number(b.discountPercent || 0),
      escapeCsv(b.isShelfRotated ? 'Đã đảo kệ ra mặt tiền' : 'Chưa đảo kệ'),
      escapeCsv(b.status || 'ACTIVE')
    ].join(',');
  });

  const lines = [
    '# BÁO CÁO GIÁM SÁT TỒN KHO & VÒNG ĐỜI LÔ HÀNG FEFO - LHU MART (RETAIL-STORE-01)',
    `# Tiêu chuẩn: First Expired, First Out (FEFO) & Cảnh báo 3 cấp màu Rule 4`,
    `# Thời điểm trích xuất: ${new Date().toLocaleString('vi-VN')}`,
    `# Tổng số lô hàng: ${batches.length}`,
    `# TỔNG TỒN KHẢ DỤNG: ${totalAvailableStock.toLocaleString('vi-VN')} đơn vị`,
    `# TỔNG VỐN LƯU KHO: ${totalInventoryVal.toLocaleString('vi-VN')} VND`,
    `# VỐN CẬN DATE CÓ RỦI RO (VÀNG + ĐỎ): ${totalAtRiskVal.toLocaleString('vi-VN')} VND`,
    '',
    headers.join(','),
    ...rows,
    '',
    `"TỔNG CỘNG","","","","",0,${totalAvailableStock},"","","",${totalInventoryVal},"","","","","","",""`
  ];

  const csvContent = BOM + lines.join('\r\n');
  const filename = `Ton_Kho_Vong_Doi_FEFO_LHUMart_${getTimestampString()}.csv`;
  downloadFile(csvContent, filename);
}

/**
 * 3. Xuất Lịch Sử Giao Dịch Bán Lẻ POS & Ngoại Cảnh (Rule 2 & Rule 8 SSOT)
 * @param {Array} sales - Danh sách các giao dịch bán lẻ
 */
export function exportSalesHistoryToExcel(sales = []) {
  if (!sales || sales.length === 0) {
    alert('Không có dữ liệu lịch sử bán hàng để xuất file Excel!');
    return;
  }

  const BOM = '\uFEFF';
  const headers = [
    'STT',
    'Mã Hóa Đơn',
    'Thời Điểm Giao Dịch',
    'Thứ',
    'Mã Lô Bóc Tách (FEFO)',
    'Mã SKU',
    'Tên Sản Phẩm',
    'Số Lượng Bán',
    'Đơn Vị',
    'Đơn Giá Gốc (VND)',
    'Chiết Khấu (%)',
    'Đơn Giá Bán (VND)',
    'Thành Tiền (VND)',
    'Thu Ngân Ca Trực',
    'Yếu Tố Thời Tiết',
    'Cờ Ngày Lễ'
  ];

  let totalQty = 0;
  let totalRevenue = 0;

  const rows = sales.map((s, index) => {
    const qty = Number(s.quantitySold || s.quantity) || 0;
    const originalPrice = Number(s.originalPrice || s.salePrice || s.price) || 0;
    const discount = Number(s.discountPercent || 0);
    const salePrice = Number(s.salePrice || s.price) || (discount > 0 ? Math.round(originalPrice * (1 - discount / 100)) : originalPrice);
    const totalAmount = Number(s.totalAmount) || (qty * salePrice);

    totalQty += qty;
    totalRevenue += totalAmount;

    return [
      index + 1,
      escapeCsv(s.transactionCode || s.orderCode || `TXN-${s.id || index + 1}`),
      escapeCsv(s.createdAt || s.saleDate || s.time || ''),
      escapeCsv(s.dayOfWeek || 'MONDAY'),
      escapeCsv(s.batchCode || `LOT-${s.batchId || ''}`),
      escapeCsv(s.productSku || s.sku || ''),
      escapeCsv(s.productName || s.name || ''),
      qty,
      escapeCsv(s.unit || 'đơn vị'),
      originalPrice,
      discount,
      salePrice,
      totalAmount,
      escapeCsv(s.cashierName || s.cashier || 'Thu ngân POS'),
      escapeCsv(s.weather || 'Bình thường'),
      escapeCsv(s.isHoliday ? 'Ngày lễ' : 'Ngày thường')
    ].join(',');
  });

  const lines = [
    '# BÁO CÁO LỊCH SỬ GIAO DỊCH BÁN LẺ POS & BẺ LÔ FEFO - LHU MART (RETAIL-STORE-01)',
    `# Tiêu chuẩn: Rule 2 Bán hàng = Xuất kho trực tiếp tự động bẻ lô & Rule 8 Ngoại cảnh`,
    `# Thời điểm trích xuất: ${new Date().toLocaleString('vi-VN')}`,
    `# Tổng số giao dịch: ${sales.length}`,
    `# TỔNG SỐ LƯỢNG ĐÃ BÁN: ${totalQty.toLocaleString('vi-VN')} đơn vị`,
    `# TỔNG DOANH THU BÁN LẺ: ${totalRevenue.toLocaleString('vi-VN')} VND`,
    '',
    headers.join(','),
    ...rows,
    '',
    `"TỔNG CỘNG","","","","","","",${totalQty},"","","","",${totalRevenue},"","",""`
  ];

  const csvContent = BOM + lines.join('\r\n');
  const filename = `Lich_Su_Ban_Hang_POS_LHUMart_${getTimestampString()}.csv`;
  downloadFile(csvContent, filename);
}

/**
 * 4. Xuất Sổ Nhật Ký Kiểm Toán Hệ Thống Bất Biến (Rule 11 SSOT)
 * @param {Array} logs - Danh sách các bản ghi nhật ký kiểm toán
 */
export function exportAuditLogsToExcel(logs = []) {
  if (!logs || logs.length === 0) {
    alert('Không có dữ liệu nhật ký kiểm toán để xuất file Excel!');
    return;
  }

  const BOM = '\uFEFF';
  const headers = [
    'STT',
    'ID Bản Ghi',
    'Thời Gian Ghi Nhận',
    'Tài Khoản Thực Hiện',
    'Mã Hành Động (Action)',
    'Phân Hệ / Bảng (Entity)',
    'Mã Đối Tượng (Record ID)',
    'Địa Chỉ IP',
    'Mô Tả Chi Tiết Nghiệp Vụ'
  ];

  const rows = logs.map((log, index) => {
    return [
      index + 1,
      log.id || (index + 1),
      escapeCsv(log.time || log.createdAt || log.created_at || ''),
      escapeCsv(log.user || log.userName || log.user_name || 'Hệ Thống'),
      escapeCsv(log.action || log.actionType || log.action_type || 'INFO'),
      escapeCsv(log.entityName || log.entity_name || log.table || ''),
      escapeCsv(log.entityId || log.entity_id || log.recordId || ''),
      escapeCsv(log.ip || log.ipAddress || log.ip_address || '127.0.0.1'),
      escapeCsv(log.details || log.description || '')
    ].join(',');
  });

  const lines = [
    '# SỔ NHẬT KÝ KIỂM TOÁN HỆ THỐNG BẤT BIẾN (AUDIT LOGS) - LHU MART (RETAIL-STORE-01)',
    `# Tiêu chuẩn: Rule 11 Nhật ký kiểm toán bất biến phục vụ kế toán & thanh tra`,
    `# Thời điểm trích xuất: ${new Date().toLocaleString('vi-VN')}`,
    `# Tổng số bản ghi kiểm toán: ${logs.length}`,
    '',
    headers.join(','),
    ...rows
  ];

  const csvContent = BOM + lines.join('\r\n');
  const filename = `Nhat_Ky_Kiem_Toan_LHUMart_${getTimestampString()}.csv`;
  downloadFile(csvContent, filename);
}

/**
 * 5. Xuất Chi Tiết Hóa Đơn Bán Lẻ POS & Bằng Chứng Bẻ Lô FEFO ra file Excel CSV
 * @param {Object} receipt - Thông tin hóa đơn thanh toán
 */
export function exportReceiptToExcel(receipt) {
  if (!receipt || !receipt.orderCode) {
    alert('Không tìm thấy thông tin hóa đơn để xuất file Excel!');
    return;
  }

  const BOM = '\uFEFF';
  const lines = [
    `# HÓA ĐƠN BÁN LẺ & XÁC THỰC BẺ LÔ FEFO - SIÊU THỊ LHU MART (RETAIL-STORE-01)`,
    `# Mã hóa đơn: ${receipt.orderCode}`,
    `# Thời gian: ${receipt.checkoutTime || receipt.date || new Date().toLocaleString('vi-VN')}`,
    `# Thu ngân: ${receipt.cashierName || receipt.cashier || 'Thu ngân ca trực'}`,
    `# Tổng thanh toán: ${(receipt.totalAmount || 0).toLocaleString('vi-VN')} VND`,
    `# Tiền khách đưa: ${(receipt.customerPaid || 0).toLocaleString('vi-VN')} VND`,
    `# Tiền thối lại: ${(receipt.changeDue || 0).toLocaleString('vi-VN')} VND`,
    '',
    'DANH MỤC MẶT HÀNG BÁN LẺ:',
    'STT,Tên Sản Phẩm,Số Lượng,Đơn Giá (VND),Thành Tiền (VND)'
  ];

  if (receipt.items && receipt.items.length > 0) {
    receipt.items.forEach((it, idx) => {
      lines.push(`${idx + 1},"${(it.name || '').replace(/"/g, '""')}",${it.quantity || 1},${it.price || 0},${(it.price || 0) * (it.quantity || 1)}`);
    });
  }

  lines.push('');
  lines.push('CHI TIẾT XUẤT TRỪ KHO THEO LÔ HÀNG FEFO (LÔ CẬN DATE XUẤT TRƯỚC):');
  lines.push('STT,Mã Lô Hàng,Hạn Sử Dụng,Số Lượng Trừ Kho,Đơn Vị Tính');

  if (receipt.fefoDetails && receipt.fefoDetails.length > 0) {
    receipt.fefoDetails.forEach((f, idx) => {
      lines.push(`${idx + 1},"${f.batchCode}","${f.expiryDate}",${f.deductedQty},"${f.unit || 'Đơn vị'}"`);
    });
  } else {
    lines.push('1,"Lô hệ thống tự động bóc tách theo hạn dùng gần nhất (FEFO)",N/A,Toàn bộ,Sản phẩm');
  }

  const csvContent = BOM + lines.join('\r\n');
  const filename = `Hoa_Don_${receipt.orderCode}.csv`;
  downloadFile(csvContent, filename);
}
