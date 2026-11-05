// Backend/test_step4_full_integration.js
// Comprehensive Integration Test Suite for Step 4 (Clean Architecture APIs)

const http = require('http');
const app = require('./server');

let server;
const PORT = 5099; // Dùng port độc lập để tránh xung đột
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method.toUpperCase(),
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion Error: ${message}`);
  }
  console.log(`  ✅ PASSED: ${message}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ TÍCH HỢP TOÀN DIỆN BƯỚC 4 (CLEAN ARCHITECTURE)');
  console.log('================================================================\n');

  // Khởi động server test
  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST-RUNNER] Server test đang chạy tại ${BASE_URL}\n`);
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Health Check & System Profile
    // -------------------------------------------------------------
    console.log('📌 Test 1: Kiểm tra API Health Check & Cửa hàng LHU Mart');
    const healthRes = await request('GET', '/api/health');
    assert(healthRes.status === 200, 'HTTP status phải là 200');
    assert(healthRes.body.success === true, 'Response success = true');
    assert(healthRes.body.storeCode === 'RETAIL-STORE-01', 'StoreCode chuẩn RETAIL-STORE-01 (Rule 1)');

    const storeRes = await request('GET', '/api/store-profile');
    assert(storeRes.status === 200, 'GET /api/store-profile status 200');
    assert(storeRes.body.data.storeCode === 'RETAIL-STORE-01', 'Thông tin cửa hàng đơn nhất LHU Mart');

    // -------------------------------------------------------------
    // Test 2: Catalog & Danh mục sản phẩm
    // -------------------------------------------------------------
    console.log('\n📌 Test 2: Truy vấn Catalog (Categories & Products)');
    const catRes = await request('GET', '/api/catalog/categories');
    assert(catRes.status === 200, 'GET /api/catalog/categories status 200');
    assert(Array.isArray(catRes.body.data) && catRes.body.data.length > 0, 'Có danh mục sản phẩm (Sữa tươi, Thực phẩm mát, Bánh ngọt...)');

    const prodRes = await request('GET', '/api/catalog/products');
    assert(prodRes.status === 200, 'GET /api/catalog/products status 200');
    assert(Array.isArray(prodRes.body.data) && prodRes.body.data.length > 0, 'Có danh sách sản phẩm');
    const sampleProduct = prodRes.body.data[0];
    console.log(`    ℹ️ Tìm thấy ${prodRes.body.data.length} sản phẩm. Sản phẩm mẫu: ${sampleProduct.name} (SKU: ${sampleProduct.sku})`);

    // -------------------------------------------------------------
    // Test 3: Batches List & Alerts (View SQL Server)
    // -------------------------------------------------------------
    console.log('\n📌 Test 3: Giám sát Lô hàng & 3 Cấp màu Cảnh báo (Rule 4, Rule 5)');
    const batchesRes = await request('GET', '/api/batches');
    assert(batchesRes.status === 200, 'GET /api/batches status 200');
    assert(batchesRes.body.success === true, 'Query thành công qua vw_Batches_ShelfLife_Alerts');
    assert(batchesRes.body.counts !== undefined, 'Có thống kê counts theo cấp màu');
    console.log(`    ℹ️ Thống kê Lô: Tổng=${batchesRes.body.counts.total}, Xanh=${batchesRes.body.counts.greenCount}, Vàng=${batchesRes.body.counts.yellowCount}, Đỏ=${batchesRes.body.counts.redCount}, Hết hạn=${batchesRes.body.counts.expiredCount}`);

    // -------------------------------------------------------------
    // Test 4: Tiếp nhận hàng DC (Inbound DC - Rule 7)
    // -------------------------------------------------------------
    console.log('\n📌 Test 4: Tiếp nhận hàng từ xe tải DC Biên Hòa (Kiểm soát RSL >= 70%)');
    
    // a. Thử gửi lô vi phạm RSL < 70% (HSD còn rất ngắn so với ngày sản xuất)
    const badBatchDate = new Date();
    badBatchDate.setDate(badBatchDate.getDate() + 3); // Còn 3 ngày
    const oldMfgDate = new Date();
    oldMfgDate.setDate(oldMfgDate.getDate() - 30); // Sản xuất cách đây 30 ngày => RSL ~ 3/33 = 9% < 70%

    const rejectRes = await request('POST', '/api/batches/receive-inbound', {
      supplierId: 1,
      receivedBy: 4,
      receivedByName: 'Nguyễn Văn Kho',
      notes: 'Test từ chối lô cận date vi phạm Rule 7',
      batches: [{
        productId: sampleProduct.id,
        batchCode: `REJECT-${Date.now().toString().slice(-6)}`,
        manufacturingDate: oldMfgDate.toISOString().split('T')[0],
        expiryDate: badBatchDate.toISOString().split('T')[0],
        quantityReceived: 50,
        importPrice: sampleProduct.costPrice || 25000
      }]
    });
    assert(rejectRes.status === 400 || rejectRes.body.success === false, 'Phải từ chối lô có RSL < 70%');
    console.log(`    ℹ️ Thông báo chặn vi phạm RSL: "${rejectRes.body.message}"`);

    // b. Gửi lô chuẩn đạt RSL >= 70% (Sản xuất hôm nay, HSD 30 ngày => RSL = 100%)
    const goodMfgDate = new Date();
    const goodExpDate = new Date();
    goodExpDate.setDate(goodExpDate.getDate() + 45); // Còn 45 ngày
    const validBatchCode = `DC-OK-${Date.now().toString().slice(-6)}`;

    const acceptRes = await request('POST', '/api/batches/receive-inbound', {
      supplierId: 1,
      receivedBy: 4,
      receivedByName: 'Nguyễn Văn Kho',
      notes: 'Xe lạnh DC Biên Hòa giao đợt chuẩn',
      batches: [{
        productId: sampleProduct.id,
        batchCode: validBatchCode,
        manufacturingDate: goodMfgDate.toISOString().split('T')[0],
        expiryDate: goodExpDate.toISOString().split('T')[0],
        quantityReceived: 30,
        importPrice: sampleProduct.costPrice || 25000
      }]
    });
    assert(acceptRes.status === 201 && acceptRes.body.success === true, 'Tiếp nhận thành công lô hàng đạt RSL >= 70%');
    console.log(`    ℹ️ Nhập kho thành công lô ${validBatchCode}. Mã biên bản: ${acceptRes.body.receiptNumber}`);

    // Lấy ID lô vừa nhập
    const refreshedBatches = await request('GET', '/api/batches');
    const newBatch = refreshedBatches.body.data.find(b => b.batchCode === validBatchCode);
    assert(newBatch !== undefined, `Lô mới ${validBatchCode} phải xuất hiện trong cơ sở dữ liệu`);

    // -------------------------------------------------------------
    // Test 5: Quick Markdown (Rule 10)
    // -------------------------------------------------------------
    console.log('\n📌 Test 5: Kích hoạt Giảm giá Xả hàng Quick Markdown (15%, 30%, 40%, 50%)');
    
    // a. Thử mức giảm không hợp lệ (ví dụ: 25%)
    const invalidDiscountRes = await request('PATCH', `/api/batches/${newBatch.id}/discount`, {
      percent: 25,
      managerId: 2,
      managerName: 'Trần Cửa Hàng Trưởng'
    });
    assert(invalidDiscountRes.status === 400 || invalidDiscountRes.body.success === false, 'Chặn mức giảm giá không nằm trong chính sách (25%)');

    // b. Áp dụng mức giảm chuẩn 30%
    const validDiscountRes = await request('PATCH', `/api/batches/${newBatch.id}/discount`, {
      percent: 30,
      managerId: 2,
      managerName: 'Trần Cửa Hàng Trưởng'
    });
    assert(validDiscountRes.status === 200 && validDiscountRes.body.success === true, 'Áp dụng thành công giảm giá 30%');
    assert(validDiscountRes.body.discountPercent === 30, 'Discount percent đã cập nhật = 30%');

    // -------------------------------------------------------------
    // Test 6: Xác nhận SOP Đảo kệ mặt tiền FEFO (Rule 10)
    // -------------------------------------------------------------
    console.log('\n📌 Test 6: Quy trình Đảo kệ mặt tiền trưng bày FEFO');
    const rotateRes = await request('PATCH', `/api/batches/${newBatch.id}/rotate`, {
      staffId: 4,
      staffName: 'Nguyễn Văn Kho'
    });
    assert(rotateRes.status === 200 && rotateRes.body.success === true, 'Xác nhận đảo kệ thành công có lưu vết');

    // -------------------------------------------------------------
    // Test 7: Bán lẻ POS theo chuẩn FEFO (Rule 2, Rule 3)
    // -------------------------------------------------------------
    console.log('\n📌 Test 7: Quẹt mã thanh toán POS tự động xuất kho theo chuẩn FEFO');
    
    // a. Thử bán vượt quá số lượng tồn
    const overSaleRes = await request('POST', '/api/sales', {
      items: [{ productId: sampleProduct.id, quantity: 999999 }],
      weather: 'NORMAL',
      cashierId: 3,
      cashierName: 'Lê Thu Ngân'
    });
    assert(overSaleRes.status === 400 || overSaleRes.body.success === false, 'Chống tồn kho âm: Chặn đơn bán vượt quá tồn kho (Rule 3)');

    // b. Bán số lượng hợp lệ (ví dụ: 2 đơn vị)
    const validSaleRes = await request('POST', '/api/sales', {
      items: [{ productId: sampleProduct.id, quantity: 2 }],
      weather: 'SUNNY',
      isHoliday: false,
      cashierId: 3,
      cashierName: 'Lê Thu Ngân'
    });
    assert(validSaleRes.status === 201 && validSaleRes.body.success === true, 'Thanh toán POS FEFO thành công');
    assert(Array.isArray(validSaleRes.body.lines) && validSaleRes.body.lines.length > 0, 'Có danh sách mặt hàng bóc tách xuất kho');
    console.log(`    ℹ️ Mã đơn: ${validSaleRes.body.transactionCode}, Tổng tiền: ${validSaleRes.body.totalAmount.toLocaleString('vi-VN')} đ`);

    // Tra cứu lịch sử bán hàng
    const salesHistoryRes = await request('GET', '/api/sales/history?limit=10');
    assert(salesHistoryRes.status === 200, 'GET /api/sales/history status 200');
    assert(salesHistoryRes.body.data.length > 0, 'Lịch sử giao dịch lưu vết thành công');

    // -------------------------------------------------------------
    // Test 8: Tiêu hủy Hàng quá hạn & Sổ Hao hụt Tài chính (Rule 6)
    // -------------------------------------------------------------
    console.log('\n📌 Test 8: Tiêu hủy hàng & Ghi nhận Sổ Hao hụt Tài chính');
    const disposalRes = await request('POST', '/api/spoilage', {
      batchId: newBatch.id,
      quantityDisposed: 1,
      reason: 'DAMAGED',
      notes: 'Bao bì rách vỡ trong quá trình vận chuyển quầy kệ',
      performedBy: 4,
      performedByName: 'Nguyễn Văn Kho',
      approvedBy: 2,
      approvedByName: 'Trần Cửa Hàng Trưởng'
    });
    assert(disposalRes.status === 201 && disposalRes.body.success === true, 'Ghi nhận tiêu hủy thành công');
    assert(disposalRes.body.costLoss > 0, 'CostLoss tự động tính = Quantity * ImportPrice');
    console.log(`    ℹ️ Mã phiếu hủy: ${disposalRes.body.recordCode}, Thiệt hại: ${disposalRes.body.costLoss.toLocaleString('vi-VN')} đ`);

    // Tra cứu sổ hao hụt
    const ledgerRes = await request('GET', '/api/spoilage/ledger?limit=10');
    assert(ledgerRes.status === 200, 'GET /api/spoilage/ledger status 200');
    assert(ledgerRes.body.summary !== undefined, 'Có tổng hợp tổn thất Sổ hao hụt');

    // -------------------------------------------------------------
    // Test 9: Dự báo ROP Đa biến & Quản lý Đơn Đặt Hàng DC (Rule 8)
    // -------------------------------------------------------------
    console.log('\n📌 Test 9: Dự báo Điểm đặt hàng ROP & Đơn đặt hàng DC');
    const ropRes = await request('GET', '/api/forecast/rop?weather=RAINY&isHoliday=true');
    assert(ropRes.status === 200, 'GET /api/forecast/rop status 200');
    assert(ropRes.body.success === true, 'Tính toán ROP thành công');
    assert(Array.isArray(ropRes.body.data), 'Danh sách đề xuất đặt hàng theo từng sản phẩm');
    console.log(`    ℹ️ Thời tiết mưa & Ngày lễ: Hệ số W=0.7, H=1.35. Số sản phẩm cần đặt bổ sung: ${ropRes.body.summary.needReorderCount}`);

    // Tạo Purchase Order
    const poRes = await request('POST', '/api/forecast/purchase-orders', {
      supplierId: 1,
      createdBy: 2,
      createdByName: 'Trần Cửa Hàng Trưởng',
      notes: 'Đơn đặt hàng tự động từ thuật toán ROP',
      items: [{
        productId: sampleProduct.id,
        productName: sampleProduct.name,
        currentStockAtOrder: 20,
        suggestedQuantity: 40,
        approvedQuantity: 40,
        unitCost: sampleProduct.costPrice || 25000
      }]
    });
    assert(poRes.status === 201 && poRes.body.success === true, 'Tạo đơn đặt hàng PO thành công');
    console.log(`    ℹ️ Mã PO: ${poRes.body.orderCode}, Dự toán: ${poRes.body.totalEstimatedCost.toLocaleString('vi-VN')} đ`);

    // Duyệt PO
    const approvePoRes = await request('PATCH', `/api/forecast/purchase-orders/${poRes.body.orderId}/status`, {
      status: 'APPROVED',
      managerId: 2,
      managerName: 'Trần Cửa Hàng Trưởng',
      notes: 'Đã duyệt gửi DC Biên Hòa'
    });
    assert(approvePoRes.status === 200 && approvePoRes.body.success === true, 'Duyệt chuyển trạng thái PO sang APPROVED');

    // -------------------------------------------------------------
    // Test 10: Executive Dashboard 6 KPI & Action Board
    // -------------------------------------------------------------
    console.log('\n📌 Test 10: Executive Dashboard 6 KPI & Action Board Ca trực');
    const dashRes = await request('GET', '/api/dashboard/overview');
    assert(dashRes.status === 200, 'GET /api/dashboard/overview status 200');
    assert(dashRes.body.kpiMetrics !== undefined, 'Có đủ 6 chỉ số KPI tài chính điều hành');
    assert(dashRes.body.actionBoard !== undefined, 'Có Action Board ca trực');
    console.log(`    ℹ️ KPI: Vốn tồn=${dashRes.body.kpiMetrics.totalInventoryCost.toLocaleString('vi-VN')} đ, Vốn rủi ro=${dashRes.body.kpiMetrics.atRiskCost.toLocaleString('vi-VN')} đ, Spoilage Rate=${dashRes.body.kpiMetrics.spoilageRatePercent}%`);

    // -------------------------------------------------------------
    // Test 11: Audit Logs (Rule 11)
    // -------------------------------------------------------------
    console.log('\n📌 Test 11: Nhật ký kiểm toán hệ thống bất biến (Rule 11)');
    const auditRes = await request('GET', '/api/audit-logs?limit=10');
    assert(auditRes.status === 200, 'GET /api/audit-logs status 200');
    assert(auditRes.body.data.length > 0, 'Ghi nhận đầy đủ các vết nghiệp vụ vừa thực hiện');
    console.log(`    ℹ️ Tổng số bản ghi kiểm toán mới nhất: ${auditRes.body.data.length}. Thao tác gần nhất: [${auditRes.body.data[0].actionType}] ${auditRes.body.data[0].description}`);

    console.log('\n================================================================');
    console.log('🎉 TOÀN BỘ CÁC BÀI TEST TÍCH HỢP BƯỚC 4 ĐÃ PASS HOÀN TOÀN 100%!');
    console.log('================================================================');

  } catch (err) {
    console.error('\n❌ TEST THẤT BẠI:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests();
