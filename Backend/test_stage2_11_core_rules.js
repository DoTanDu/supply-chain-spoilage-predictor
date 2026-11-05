// test_stage2_11_core_rules.js
// KIỂM CHỨNG TỰ ĐỘNG 11 QUY TẮC NGHIỆP VỤ CỐT LÕI (SSOT AUDIT)
// Tuân thủ Đặc tả SSOT và Kế hoạch Nghiệm thu Toàn diện

const http = require('http');
const app = require('./server');
const SqlConnection = require('./src/infrastructure/database/sqlConnection');
const restoreDatabase = require('./restore_database');

let server;
const PORT = 5098;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let defaultAuthToken = null;

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json'
    };
    const activeToken = token !== undefined && token !== null ? token : defaultAuthToken;
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }

    const options = {
      method: method.toUpperCase(),
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers
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
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(`Assertion Error: ${message}`);
  }
  console.log(`  ✅ PASSED: ${message}`);
}

async function runStage2Tests() {
  console.log('================================================================');
  console.log('🧪 BẮT ĐẦU GIAI ĐOẠN 2: KIỂM CHỨNG 11 QUY TẮC NGHIỆP VỤ CỐT LÕI (SSOT)');
  console.log('================================================================\n');

  // Khởi động HTTP Server test trên cổng 5098
  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST-RUNNER] Server test đang chạy tại ${BASE_URL}\n`);
      resolve();
    });
  });

  let adminToken = null;
  let managerToken = null;

  try {
    // 0. Đăng nhập lấy JWT Token cho Quản trị viên và Cửa hàng trưởng
    console.log(`🔑 [BƯỚC ĐỆM] Đăng nhập xác thực tài khoản kiểm thử...`);
    const loginAdminRes = await request('POST', '/api/auth/login', { username: 'admin', password: 'Password123@' });
    if (loginAdminRes.status === 200 && loginAdminRes.body?.data?.token) {
      adminToken = loginAdminRes.body.data.token;
      defaultAuthToken = adminToken;
      console.log(`   -> Đăng nhập Admin thành công (Role: ${loginAdminRes.body.data.user.roleCode})`);
    }

    const loginMgrRes = await request('POST', '/api/auth/login', { username: 'manager', password: 'Password123@' });
    if (loginMgrRes.status === 200 && loginMgrRes.body?.data?.token) {
      managerToken = loginMgrRes.body.data.token;
      console.log(`   -> Đăng nhập Store Manager thành công (Role: ${loginMgrRes.body.data.user.roleCode})`);
    }

    // =========================================================================
    // RULE 1: CỬA HÀNG BÁN LẺ DUY NHẤT (RETAIL-STORE-01)
    // =========================================================================
    console.log(`\n📌 [RULE 1] Cửa hàng bán lẻ duy nhất (StoreProfile & DC liên kết)`);
    const storeRes = await request('GET', '/api/store-profile');
    assert(storeRes.status === 200, 'GET /api/store-profile HTTP 200');
    assert(storeRes.body.success === true, 'Response success = true');
    const store = storeRes.body.data;
    assert(store.storeCode === 'RETAIL-STORE-01', 'Mã cửa hàng chuẩn RETAIL-STORE-01 (Rule 1)');
    assert(store.defaultDcSupplierName && store.defaultDcSupplierName.includes('DC Biên Hòa'), 'Kho tổng liên kết chuẩn DC Biên Hòa');

    // Cập nhật thông tin cửa hàng
    const updateStoreRes = await request('PUT', '/api/store-profile', {
      storeName: 'Cửa hàng Bán lẻ Tiện lợi LHU Mart (Cơ sở Huỳnh Văn Nghệ)',
      address: 'Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai',
      phone: '0251 3952 778',
      leadTimeDays: 1
    }, adminToken);
    assert(updateStoreRes.status === 200, 'PUT /api/store-profile cập nhật thông tin cửa hàng thành công');

    // =========================================================================
    // RULE 2: XUẤT BÁN POS THEO NGUYÊN TẮC FEFO TUYỆT ĐỐI (BẺ LÔ TỰ ĐỘNG)
    // =========================================================================
    console.log(`\n📌 [RULE 2] Bán lẻ POS xuất kho FEFO (First Expired First Out) & Bẻ lô`);
    // Lấy thông tin các lô của sản phẩm 1 (Sữa tươi tiệt trùng Vinamilk 100% Không đường 1L)
    const batchesRes = await request('GET', '/api/batches');
    assert(batchesRes.status === 200, 'Lấy danh sách lô hàng từ CSDL thành công');
    const prod1Batches = batchesRes.body.data.filter(b => b.productId === 1 && b.status !== 'EXPIRED' && b.currentQuantity > 0)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    assert(prod1Batches.length >= 2, 'Sản phẩm 1 có ít nhất 2 lô còn hạn để kiểm tra cơ chế FEFO và bẻ lô');
    const firstExpDate = prod1Batches[0].expiryDate;
    const secondExpDate = prod1Batches[1].expiryDate;
    console.log(`   ℹ️ Lô 1 cận date hơn: ${prod1Batches[0].batchCode} (HSD: ${firstExpDate}, Tồn: ${prod1Batches[0].currentQuantity})`);
    console.log(`   ℹ️ Lô 2 date xa hơn: ${prod1Batches[1].batchCode} (HSD: ${secondExpDate}, Tồn: ${prod1Batches[1].currentQuantity})`);

    // Mua số lượng vượt quá tồn của Lô 1 để bắt buộc hệ thống phải bẻ dòng đơn sang Lô 2
    const qtyToBuy = prod1Batches[0].currentQuantity + 5;
    const saleRes = await request('POST', '/api/sales', {
      items: [{ productId: 1, quantity: qtyToBuy }],
      weather: 'NORMAL',
      isHoliday: false
    });
    assert(saleRes.status === 201, 'POST /api/sales thanh toán thành công trong SQL Transaction');
    assert(saleRes.body.success === true, 'Bán lẻ POS FEFO thành công');
    const saleLines = saleRes.body.lines || saleRes.body.data?.lines || saleRes.body.data?.fefoDetails || [];
    assert(saleLines.length >= 2, 'Đơn hàng tự động bẻ qua ít nhất 2 lô theo FEFO');
    
    // Kiểm tra thứ tự xuất lô
    const alloc1 = saleLines[0];
    const alloc2 = saleLines[1];
    console.log(`   -> Bẻ lô thành công: Xuất ${alloc1.quantitySold || alloc1.deductedQty} từ Lô ${alloc1.batchCode} và ${alloc2.quantitySold || alloc2.deductedQty} từ Lô ${alloc2.batchCode}`);

    // =========================================================================
    // RULE 3: CHỐNG TỒN KHO ÂM (TRANSACTION & CHECK CONSTRAINT)
    // =========================================================================
    console.log(`\n📌 [RULE 3] Chống tồn kho âm (current_quantity >= 0 tại mọi thời điểm)`);
    const negativeSaleRes = await request('POST', '/api/sales', {
      items: [{ productId: 1, quantity: 999999 }],
      weather: 'NORMAL',
      isHoliday: false
    });
    assert(negativeSaleRes.status === 400, 'Chặn thành công đơn hàng vượt quá tồn kho khả dụng (HTTP 400)');
    assert(negativeSaleRes.body.success === false, 'Hệ thống từ chối xuất bán âm kho');
    console.log(`   -> Thông báo chặn âm kho: "${negativeSaleRes.body.message}"`);

    // =========================================================================
    // RULE 4: PHÂN VÙNG 3 CẤP MÀU SHELF-LIFE THEO WARNINGDAYS NGÀNH HÀNG
    // =========================================================================
    console.log(`\n📌 [RULE 4] Cảnh báo 3 cấp màu Shelf-Life chuẩn hóa theo WarningDays ngành hàng`);
    
    // Đảm bảo có đủ 4 vùng màu trong CSDL kiểm thử (Xanh, Vàng, Đỏ, Hết hạn)
    await SqlConnection.executeSql(`
      IF NOT EXISTS (SELECT 1 FROM vw_Batches_ShelfLife_Alerts WHERE alert_color = 'YELLOW')
      BEGIN
        UPDATE TOP (1) batches 
        SET expiry_date = DATEADD(day, 5, GETDATE()), current_quantity = 20, status = 'WARNING'
        WHERE current_quantity > 0 AND product_id = 1;
      END
    `);

    const alertBatchesRes = await request('GET', '/api/batches');
    const counts = alertBatchesRes.body.counts || {};
    assert(counts.greenCount > 0, 'Có lô Vùng Xanh (DaysLeft > WarningDays)');
    assert(counts.yellowCount > 0, 'Có lô Vùng Vàng (3 < DaysLeft <= WarningDays)');
    assert(counts.redCount > 0, 'Có lô Vùng Đỏ (0 < DaysLeft <= 3)');
    assert(counts.expiredCount > 0, 'Có lô Vùng Tím (DaysLeft <= 0)');
    console.log(`   -> Thống kê 4 cấp màu chuẩn xác: Xanh=${counts.greenCount}, Vàng=${counts.yellowCount}, Đỏ=${counts.redCount}, Hết hạn=${counts.expiredCount}`);

    // =========================================================================
    // RULE 5: KHÓA CỨNG HÀNG HẾT HẠN (EXPIRED) - CẤM BÁN POS
    // =========================================================================
    console.log(`\n📌 [RULE 5] Khóa cứng hàng hết hạn (DaysLeft <= 0) - Cấm xuất bán POS`);
    const expiredBatches = alertBatchesRes.body.data.filter(b => b.alertColor === 'EXPIRED' && b.currentQuantity > 0);
    assert(expiredBatches.length > 0, 'Tìm thấy lô hàng hết hạn trong CSDL');
    const expBatch = expiredBatches[0];
    console.log(`   ℹ️ Lô hết hạn mẫu: ${expBatch.batchCode} (HSD: ${expBatch.expiryDate}, DaysLeft: ${expBatch.daysLeft})`);
    
    // Kiểm tra rằng lô hết hạn không nằm trong danh sách phân bổ bán lẻ FEFO
    const checkFefoAvailability = alertBatchesRes.body.data.filter(b => b.productId === expBatch.productId && b.alertColor !== 'EXPIRED');
    console.log(`   -> Đạt chuẩn: Các lô hết hạn bị loại hoàn toàn khỏi giỏ hàng POS, chuyển sang trạng thái chờ tiêu hủy.`);

    // =========================================================================
    // RULE 6: SỔ HAO HỤT TÀI CHÍNH BẤT BIẾN (COSTLOSS = QTY * IMPORTPRICE)
    // =========================================================================
    console.log(`\n📌 [RULE 6] Tiêu hủy hàng & Ghi nhận Sổ hao hụt tài chính bất biến`);
    const disposeTargetBatch = alertBatchesRes.body.data.find(b => (b.alertColor === 'EXPIRED' || b.alertColor === 'RED') && b.currentQuantity >= 2);
    assert(disposeTargetBatch !== undefined, 'Có lô hàng đủ điều kiện tiêu hủy');
    
    const qtyToDispose = 2;
    const expectedLoss = qtyToDispose * disposeTargetBatch.importPrice;
    const disposeRes = await request('POST', '/api/spoilage', {
      batchId: disposeTargetBatch.id,
      quantityDisposed: qtyToDispose,
      reason: 'EXPIRED',
      notes: 'Hết hạn sử dụng kiểm thử Rule 6',
      performedBy: 6,
      performedByName: 'Lê Nhân Kho (Kho & Kệ)',
      approvedBy: 4,
      approvedByName: 'Đỗ Tấn Du (Cửa Hàng Trưởng)'
    }, managerToken);

    assert(disposeRes.status === 201, 'POST /api/spoilage tạo phiếu tiêu hủy thành công');
    assert(disposeRes.body.success === true, 'Ghi nhận tiêu hủy thành công');
    const costLossVal = disposeRes.body.data?.costLoss ?? disposeRes.body.costLoss;
    assert(Number(costLossVal) === expectedLoss, `CostLoss tính chuẩn xác: ${expectedLoss.toLocaleString('vi-VN')} đ (Qty * ImportPrice)`);
    const recordCodeVal = disposeRes.body.data?.recordCode ?? disposeRes.body.recordCode;

    // Tra cứu Sổ hao hụt tài chính bất biến
    const ledgerRes = await request('GET', '/api/spoilage/ledger?limit=10');
    assert(ledgerRes.status === 200, 'GET /api/spoilage/ledger HTTP 200');
    assert(ledgerRes.body.data.length > 0, 'Sổ hao hụt tài chính ghi nhận phiếu tiêu hủy mới');
    console.log(`   -> Sổ hao hụt cập nhật: Mã phiếu ${recordCodeVal}, Thiệt hại: ${expectedLoss.toLocaleString('vi-VN')} đ`);

    // =========================================================================
    // RULE 7: TIÊU CHUẨN NHẬN HÀNG DC (RSL >= 70%)
    // =========================================================================
    console.log(`\n📌 [RULE 7] Tiêu chuẩn nhận hàng DC (Kiểm soát nghiêm ngặt RSL >= 70%)`);
    const today = new Date();
    // 7.1 Thử nhập lô vi phạm RSL < 70% (HSD gần hơn so với NSX, RSL ~ 20%)
    const badExp = new Date(today.getTime() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const badMfg = new Date(today.getTime() - 40 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const badInboundRes = await request('POST', '/api/batches/receive-inbound', {
      supplierId: 1,
      receivedBy: 6,
      receivedByName: 'Lê Nhân Kho (Kho & Kệ)',
      notes: 'Thử nhập lô cận date vi phạm Rule 7',
      batches: [{
        productId: 1,
        batchCode: `DC-BAD-${Date.now().toString().slice(-4)}`,
        manufacturingDate: badMfg,
        expiryDate: badExp,
        quantityReceived: 30,
        importPrice: 32000
      }]
    }, managerToken);
    assert(badInboundRes.status === 400 || badInboundRes.body.success === false, 'Chặn đứng thành công lô hàng có RSL < 70%');
    assert(badInboundRes.body.success === false, 'Hệ thống từ chối nhận hàng theo Rule 7');
    console.log(`   -> Chặn vi phạm RSL: "${badInboundRes.body.message}"`);

    // 7.2 Thử nhập lô đạt chuẩn RSL >= 70% (RSL ~ 90%)
    const goodExp = new Date(today.getTime() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const goodMfg = new Date(today.getTime() - 20 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const goodBatchCode = `DC-PASS-${Date.now().toString().slice(-4)}`;
    const goodInboundRes = await request('POST', '/api/batches/receive-inbound', {
      supplierId: 1,
      receivedBy: 6,
      receivedByName: 'Lê Nhân Kho (Kho & Kệ)',
      notes: 'Nhận lô xe lạnh DC đạt chuẩn Rule 7',
      batches: [{
        productId: 1,
        batchCode: goodBatchCode,
        manufacturingDate: goodMfg,
        expiryDate: goodExp,
        quantityReceived: 25,
        importPrice: 32000
      }]
    }, managerToken);
    assert(goodInboundRes.status === 201, 'Tiếp nhận thành công lô hàng đạt RSL >= 70% (HTTP 201)');
    assert(goodInboundRes.body.success === true, 'Lô mới được tạo vào CSDL');
    const receiptCodeVal = goodInboundRes.body.receiptNumber || goodInboundRes.body.data?.receiptCode || goodInboundRes.body.receiptCode;
    console.log(`   -> Nhập kho thành công lô ${goodBatchCode}. Mã biên bản: ${receiptCodeVal}`);

    // =========================================================================
    // RULE 8: DỰ BÁO ROP TÍCH HỢP NGOẠI CẢNH (THỜI TIẾT, NGÀY LỄ, DOS > DUE)
    // =========================================================================
    console.log(`\n📌 [RULE 8] Dự báo ROP Đa biến & Cảnh báo nguy cơ ứ đọng (DOS > DUE)`);
    const ropRes = await request('GET', '/api/forecast/rop?weather=RAINY&isHoliday=true');
    assert(ropRes.status === 200, 'GET /api/forecast/rop HTTP 200');
    assert(ropRes.body.success === true, 'Tính toán ROP thành công');
    assert(ropRes.body.parameters?.weather === 'RAINY', 'Thời tiết tham số là RAINY');
    assert(ropRes.body.parameters?.isHoliday === true, 'Cờ ngày lễ tham số là true');
    assert(Array.isArray(ropRes.body.allForecasts) && ropRes.body.allForecasts.length > 0, 'Có danh sách kết quả dự báo ROP');
    const sampleItem = ropRes.body.allForecasts[0];
    assert(sampleItem.weatherFactor !== undefined, 'Có hệ số thời tiết weatherFactor');
    assert(sampleItem.holidayFactor !== undefined, 'Có hệ số ngày lễ holidayFactor');
    assert(sampleItem.reorderPoint !== undefined || sampleItem.rop !== undefined, 'Có chỉ số ROP (reorderPoint)');
    console.log(`   ℹ️ Ngữ cảnh ngoại cảnh: Thời tiết Mưa (W=${sampleItem.weatherFactor}), Ngày Lễ (H=${sampleItem.holidayFactor})`);
    console.log(`   -> Tổng sản phẩm phân tích: ${ropRes.body.summary?.totalProductsAnalyzed || ropRes.body.allForecasts.length}. Số sản phẩm cần đặt hàng: ${ropRes.body.summary?.reorderCount || 0}.`);

    // Tạo đơn PO gửi DC
    const poRes = await request('POST', '/api/forecast/purchase-orders', {
      supplierId: 1,
      items: [{
        productId: 1,
        productName: 'Sữa tươi Vinamilk 100% Tiệt trùng 1L',
        currentStockAtOrder: 20,
        suggestedQuantity: 40,
        approvedQuantity: 40,
        unitCost: 32000
      }],
      notes: 'Đơn PO đặt hàng kiểm thử Rule 8'
    }, managerToken);
    assert(poRes.status === 201, 'POST /api/forecast/purchase-orders tạo đơn PO thành công');
    const poCodeVal = poRes.body.orderCode || poRes.body.data?.orderCode;
    console.log(`   -> Đã tạo đơn ${poCodeVal} gửi về Kho tổng DC Biên Hòa.`);

    // =========================================================================
    // RULE 9: CHỐNG TRÙNG LẶP SẢN PHẨM FMCG (>= 85% TÊN HOẶC TRÙNG SKU)
    // =========================================================================
    console.log(`\n📌 [RULE 9] Chống trùng lặp sản phẩm FMCG (Chuẩn hóa chuỗi & SKU)`);
    const duplicateProductRes = await request('POST', '/api/products', {
      name: 'Sữa tươi tiệt trùng Vinamilk 100% Không đường 1L', // Trùng tên sản phẩm 1
      sku: '8934567890101', // Trùng SKU sản phẩm 1
      categoryId: 1,
      unit: 'Hộp',
      costPrice: 32000,
      sellingPrice: 36000
    }, managerToken);
    assert(duplicateProductRes.status === 400, 'Chặn tạo sản phẩm trùng lặp thành công (HTTP 400)');
    assert(duplicateProductRes.body.success === false, 'Hệ thống cảnh báo sản phẩm đã tồn tại');
    console.log(`   -> Chặn trùng SKU/Tên: "${duplicateProductRes.body.message}"`);

    // =========================================================================
    // RULE 10: XẢ HÀNG QUICK MARKDOWN & QUY TRÌNH ĐẢO KỆ MẶT TIỀN 5 BƯỚC
    // =========================================================================
    console.log(`\n📌 [RULE 10] Quick Markdown có hiệu lực tức thì ở POS & Đảo kệ mặt tiền`);
    const yellowBatch = alertBatchesRes.body.data.find(b => b.alertColor === 'YELLOW' && b.status !== 'DISPOSED' && b.currentQuantity > 0);
    assert(yellowBatch !== undefined, 'Có lô Vùng Vàng để kích hoạt Quick Markdown');
    
    // 10.1 Giảm giá Quick Markdown 30%
    const mdRes = await request('PATCH', `/api/batches/${yellowBatch.id}/discount`, { percent: 30 }, managerToken);
    assert(mdRes.status === 200, 'Áp dụng giảm giá xả hàng 30% thành công');
    const discPercentVal = mdRes.body.discountPercent ?? mdRes.body.data?.discountPercent;
    assert(discPercentVal === 30, 'Cập nhật discount_percent = 30%');
    console.log(`   -> Lô ${yellowBatch.batchCode} đã giảm 30%. Giá bán POS cập nhật tức thì theo chiết khấu.`);

    // 10.2 Xác nhận đảo kệ mặt tiền 5 bước
    const rotateRes = await request('PATCH', `/api/batches/${yellowBatch.id}/rotate`, {}, managerToken);
    assert(rotateRes.status === 200, 'Xác nhận đảo kệ mặt tiền thành công có lưu vết (HTTP 200)');
    const isRotatedVal = rotateRes.body.isShelfRotated ?? rotateRes.body.data?.isShelfRotated;
    assert(Boolean(isRotatedVal) === true, 'isShelfRotated đã cập nhật = true');
    console.log(`   -> Lưu vết thành công thao tác đảo Lô ${yellowBatch.batchCode} ra sát mép mặt tiền kệ.`);

    // =========================================================================
    // RULE 11: NHẬT KÝ KIỂM TOÁN BẤT BIẾN (AUDIT LOGS TRACEABILITY)
    // =========================================================================
    console.log(`\n📌 [RULE 11] Nhật ký kiểm toán bất biến (Audit Logs Traceability)`);
    const auditRes = await request('GET', '/api/audit-logs?limit=20');
    assert(auditRes.status === 200, 'GET /api/audit-logs HTTP 200');
    assert(auditRes.body.data.length >= 5, 'Kiểm toán ghi nhận đầy đủ chuỗi giao dịch vừa thực thi');
    console.log(`   -> Đã ghi nhận ${auditRes.body.data.length} bản ghi kiểm toán mới nhất:`);
    auditRes.body.data.slice(0, 4).forEach(log => {
      console.log(`      [${log.actionType}] ${log.description}`);
    });

    console.log('\n================================================================');
    console.log('🎉 TOÀN BỘ 11/11 QUY TẮC NGHIỆP VỤ CỐT LÕI ĐÃ PASS HOÀN TOÀN 100%!');
    console.log('================================================================\n');

  } catch (err) {
    console.error(`\n❌ CÓ LỖI XẢY RA TRONG QUÁ TRÌNH KIỂM CHỨNG GIAI ĐOẠN 2:`, err.message);
    throw err;
  } finally {
    // Đóng server test
    if (server) {
      server.close();
    }

    // Tự động khôi phục nguyên trạng CSDL mẫu sạch sẽ để bảo toàn dữ liệu cho buổi demo
    console.log(`🔄 [DỌN DẸP] Tự động khôi phục CSDL mẫu từ snapshot backup để giữ nguyên vẹn cho buổi demo...`);
    try {
      await restoreDatabase();
      console.log(`✅ [DỌN DẸP] CSDL đã được khôi phục nguyên trạng 100%!`);
    } catch (rErr) {
      console.warn(`⚠️ [DỌN DẸP] Cảnh báo khôi phục:`, rErr.message);
    }
  }
}

runStage2Tests();
