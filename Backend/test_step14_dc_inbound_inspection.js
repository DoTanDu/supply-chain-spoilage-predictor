// Backend/test_step14_dc_inbound_inspection.js
/**
 * TEST SUITE: MỤC 12 - QUẢN LÝ TIẾP NHẬN HÀNG TỪ KHO TỔNG DC
 * (DC Inbound & Date Inspection - Rule 7, Rule 5, Rule 11 & SoD Matrix)
 * 
 * Kiểm định chuyên sâu 7 phân hệ kỹ thuật:
 * 1. Ma trận Phân quyền & Tách biệt Trách nhiệm SoD (Mục 12.5)
 * 2. Động cơ Kiểm định Tươi mới RSL >= 70% & Ràng buộc Hạn dùng (Mục 12.1)
 * 3. Quy trình Lập Biên bản Từ chối Nhận hàng REJECT_DC_INBOUND (Mục 12.3)
 * 4. Giao dịch Tiếp nhận Hàng DC Thành công trong Transaction CSDL (Mục 12.2)
 * 5. Chu trình Tiếp nhận Liên kết Đơn Đặt hàng PO -> DELIVERED (Mục 12.2)
 * 6. Kiểm định Điều kiện Biên Dữ liệu Nhập kho (Negative Boundaries)
 * 7. Kiểm tra Toàn vẹn Dữ liệu Chứng từ Phiếu Nhập & Giá Vốn Sản phẩm
 */

const http = require('http');
const assert = require('assert');
const SqlConnection = require('./src/infrastructure/database/sqlConnection');

const BASE_URL = 'http://127.0.0.1:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = { raw: data };
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runStep14DcInboundTests() {
  console.log('='.repeat(85));
  console.log('🛡️  TEST SUITE STEP 14: DC INBOUND & DATE INSPECTION (MỤC 12 & RULE 7 SSOT)');
  console.log('   Target Server: ' + BASE_URL);
  console.log('='.repeat(85));

  let passed = 0;
  let failed = 0;

  function recordPass(msg) {
    passed++;
    console.log(`  ✅ [PASS ${passed}] ${msg}`);
  }

  function recordFail(msg, err) {
    failed++;
    console.error(`  ❌ [FAIL ${failed}] ${msg}`);
    if (err) console.error('     -> Details:', err.message || err);
  }

  try {
    // -------------------------------------------------------------
    // PHẦN 1: KHỞI TẠO XÁC THỰC & MA TRẬN PHÂN QUYỀN SOD (MỤC 12.5)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 1] KHỞI TẠO XÁC THỰC & MA TRẬN PHÂN QUYỀN SOD (MỤC 12.5)');

    // 1.1 Đăng nhập 4 vai trò
    const resAdmin = await request('POST', '/api/auth/login', { username: 'admin', password: 'Password123@' });
    assert.strictEqual(resAdmin.status, 200);
    const tokenAdmin = resAdmin.body.data.token;
    recordPass('Đăng nhập Quản trị viên (ADMIN) thành công');

    const resManager = await request('POST', '/api/auth/login', { username: 'manager', password: 'Password123@' });
    assert.strictEqual(resManager.status, 200);
    const tokenManager = resManager.body.data.token;
    recordPass('Đăng nhập Cửa hàng trưởng (STORE_MANAGER) thành công');

    const resWarehouse = await request('POST', '/api/auth/login', { username: 'warehouse', password: 'Password123@' });
    assert.strictEqual(resWarehouse.status, 200);
    const tokenWarehouse = resWarehouse.body.data.token;
    recordPass('Đăng nhập Nhân viên kho (WAREHOUSE_STAFF) thành công');

    const resCashier = await request('POST', '/api/auth/login', { username: 'cashier', password: 'Password123@' });
    assert.strictEqual(resCashier.status, 200);
    const tokenCashier = resCashier.body.data.token;
    recordPass('Đăng nhập Thu ngân (CASHIER) thành công');

    // 1.2 Kiểm tra SoD: CASHIER bị chặn tuyệt đối quyền tiếp nhận kho
    const resCashierInbound = await request('POST', '/api/batches/inbound', {
      productId: 1,
      quantity: 10,
      manufactureDate: '2026-10-01',
      expiryDate: '2026-12-01',
      importPrice: 28000
    }, tokenCashier);
    assert.strictEqual(resCashierInbound.status, 403, 'Cashier must be forbidden with 403');
    assert.strictEqual(resCashierInbound.body.code || resCashierInbound.body.errorCode, 'ERR_UNAUTHORIZED_ROLE');
    recordPass('SoD Matrix: Thu ngân (CASHIER) bị chặn gọi POST /api/batches/inbound (HTTP 403 ERR_UNAUTHORIZED_ROLE)');

    // 1.3 Kiểm tra SoD: CASHIER bị chặn quyền lập biên bản từ chối nhận hàng
    const resCashierReject = await request('POST', '/api/batches/reject-inbound', {
      productId: 1,
      manufactureDate: '2026-08-01',
      expiryDate: '2026-10-31',
      quantity: 10
    }, tokenCashier);
    assert.strictEqual(resCashierReject.status, 403);
    assert.strictEqual(resCashierReject.body.code || resCashierReject.body.errorCode, 'ERR_UNAUTHORIZED_ROLE');
    recordPass('SoD Matrix: Thu ngân (CASHIER) bị chặn lập biên bản từ chối nhận hàng DC (HTTP 403 ERR_UNAUTHORIZED_ROLE)');

    // 1.4 Kiểm tra truy cập không có token bị từ chối
    const resNoToken = await request('POST', '/api/batches/inbound', { productId: 1 });
    assert.strictEqual(resNoToken.status, 401);
    recordPass('Bảo mật: Yêu cầu tiếp nhận hàng không có Bearer Token bị từ chối (HTTP 401 Unauthorized)');

    // -------------------------------------------------------------
    // PHẦN 2: KIỂM ĐỊNH TƯƠI MỚI RSL >= 70% & RÀNG BUỘC HẠN DÙNG (MỤC 12.1)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 2] KIỂM ĐỊNH ĐỘ TƯƠI MỚI RSL >= 70% & RÀNG BUỘC HẠN DÙNG (RULE 7)');

    // 2.1 Hạn sử dụng nhỏ hơn hoặc bằng Ngày sản xuất
    const resExpBeforeMfg = await request('POST', '/api/batches/inbound', {
      productId: 1,
      quantity: 10,
      manufactureDate: '2026-10-25',
      expiryDate: '2026-10-20',
      importPrice: 28000
    }, tokenWarehouse);
    assert.strictEqual(resExpBeforeMfg.status, 400);
    assert.ok(resExpBeforeMfg.body.message.includes('Hạn sử dụng') && resExpBeforeMfg.body.message.includes('lớn hơn Ngày sản xuất'));
    recordPass('Ràng buộc HSD: Chặn lô hàng có HSD <= NSX với lỗi HTTP 400');

    // 2.2 Hàng đã quá hạn sử dụng tại thời điểm giao xe tải
    const resAlreadyExpired = await request('POST', '/api/batches/inbound', {
      productId: 1,
      quantity: 10,
      manufactureDate: '2026-09-01',
      expiryDate: '2026-10-15', // Đã hết hạn trước hôm nay (29/10)
      importPrice: 28000
    }, tokenWarehouse);
    assert.strictEqual(resAlreadyExpired.status, 400);
    assert.ok(resAlreadyExpired.body.message.includes('TỪ CHỐI NHẬN HÀNG') && resAlreadyExpired.body.message.includes('đã hết hạn'));
    recordPass('Rule 5 & 7: Khóa cứng tiếp nhận lô hàng đã hết hạn trước ngày nhận (HTTP 400)');

    // 2.3 Vi phạm tiêu chuẩn nhận date (RSL < 70%)
    // Tổng vòng đời: 100 ngày. Nhận tại ngày 60 -> còn 40 ngày -> RSL = 40% < 70%
    const now = new Date();
    const mfgBad = new Date(now.getTime() - 60 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const expBad = new Date(now.getTime() + 40 * 24 * 3600 * 1000).toISOString().slice(0, 10);

    const resBadRsl = await request('POST', '/api/batches/inbound', {
      productId: 1,
      quantity: 15,
      manufactureDate: mfgBad,
      expiryDate: expBad,
      importPrice: 28000
    }, tokenWarehouse);
    assert.strictEqual(resBadRsl.status, 400);
    assert.ok(resBadRsl.body.message.includes('TỪ CHỐI NHẬN HÀNG (RULE 7)'));
    assert.ok(resBadRsl.body.message.includes('chỉ đạt RSL') && resBadRsl.body.message.includes('70%'));
    recordPass(`Rule 7 SSOT: Khóa cứng lô hàng vi phạm RSL < 70% với thông điệp từ chối tiếp nhận`);

    // -------------------------------------------------------------
    // PHẦN 3: BIÊN BẢN TỪ CHỐI NHẬN HÀNG REJECT_DC_INBOUND (MỤC 12.3)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 3] QUY TRÌNH LẬP BIÊN BẢN TỪ CHỐI NHẬN HÀNG (MỤC 12.3 & RULE 11)');

    const resReject = await request('POST', '/api/batches/reject-inbound', {
      productId: 1,
      batchCode: 'LOT-DC-REJECT-TEST-01',
      manufactureDate: mfgBad,
      expiryDate: expBad,
      quantity: 25,
      reason: 'Xe tải DC Biên Hòa giao hàng cận date không đạt chuẩn RSL 70%'
    }, tokenWarehouse);
    assert.strictEqual(resReject.status, 201);
    assert.strictEqual(resReject.body.success, true);
    assert.ok(resReject.body.rejectionCode.startsWith('REJ-DC-'));
    assert.ok(resReject.body.data.inboundRslPercent < 70, 'Inbound RSL must be < 70%');
    recordPass(`Lập Biên bản Từ chối Nhận hàng thành công: [${resReject.body.rejectionCode}] (RSL=${resReject.body.data.inboundRslPercent}% < 70%)`);

    // Kiểm tra bản ghi kiểm toán trong CSDL
    const auditRows = await SqlConnection.queryJson(`
      SELECT TOP 1 * FROM system_audit_logs 
      WHERE action_type = 'REJECT_DC_INBOUND' AND entity_id = '${resReject.body.rejectionCode}'
      ORDER BY id DESC FOR JSON PATH
    `);
    assert.strictEqual(auditRows.length, 1, 'Audit log entry for rejection must exist');
    assert.strictEqual(auditRows[0].action_type, 'REJECT_DC_INBOUND');
    assert.ok(auditRows[0].description.includes('BIÊN BẢN TỪ CHỐI NHẬN HÀNG DC'));
    recordPass(`Nhật ký kiểm toán system_audit_logs lưu vết bất biến biên bản [${resReject.body.rejectionCode}]`);

    // -------------------------------------------------------------
    // PHẦN 4: GIAO DỊCH TIẾP NHẬN HÀNG DC THÀNH CÔNG (MỤC 12.2)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 4] GIAO DỊCH TIẾP NHẬN HÀNG DC THÀNH CÔNG (MỤC 12.2 & RULE 7)');

    // Tổng vòng đời: 100 ngày. Nhận tại ngày 5 -> còn 95 ngày -> RSL = 95% >= 70%
    const mfgGood = new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const expGood = new Date(now.getTime() + 95 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const targetPrice = 29500;

    const resInboundSuccess = await request('POST', '/api/batches/inbound', {
      productId: 1,
      quantity: 50,
      manufactureDate: mfgGood,
      expiryDate: expGood,
      importPrice: targetPrice,
      notes: 'Lô tiếp nhận chuẩn 95% RSL từ DC Biên Hòa'
    }, tokenWarehouse);

    assert.strictEqual(resInboundSuccess.status, 201);
    assert.strictEqual(resInboundSuccess.body.success, true);
    assert.ok(resInboundSuccess.body.receiptNumber.startsWith('GR-DC-'));
    assert.strictEqual(resInboundSuccess.body.totalBatchesReceived, 1);
    const newBatch = resInboundSuccess.body.batches[0];
    assert.ok(newBatch.batchCode.startsWith('LOT-DC-'));
    assert.strictEqual(newBatch.initialQuantity, 50);
    assert.ok(newBatch.inboundRslPercent >= 70, 'Inbound RSL must be >= 70%');
    recordPass(`Tạo phiếu nhập [${resInboundSuccess.body.receiptNumber}], sinh lô chuẩn [${newBatch.batchCode}] (RSL=${newBatch.inboundRslPercent}% >= 70%)`);

    // Kiểm tra cập nhật giá vốn mới nhất vào bảng products
    const prodUpdated = await SqlConnection.queryJson(`
      SELECT id, cost_price, updated_at FROM products WHERE id = 1 FOR JSON PATH
    `);
    assert.strictEqual(Number(prodUpdated[0].cost_price), targetPrice);
    recordPass(`Tự động đồng bộ giá vốn mới nhất cost_price = ${targetPrice.toLocaleString('vi-VN')} đ vào bảng products`);

    // Kiểm tra tồn kho của lô hàng trong bảng batches
    const batchInDb = await SqlConnection.queryJson(`
      SELECT * FROM batches WHERE batch_code = '${newBatch.batchCode}' FOR JSON PATH
    `);
    assert.strictEqual(batchInDb.length, 1);
    assert.strictEqual(batchInDb[0].current_quantity, 50);
    assert.strictEqual(batchInDb[0].status, 'ACTIVE');
    assert.strictEqual(batchInDb[0].is_shelf_rotated, false);
    recordPass(`Lô hàng chèn vào CSDL thành công: current_quantity=50, status=ACTIVE, is_shelf_rotated=0`);

    // Kiểm tra nhật ký kiểm toán hành vi DC_INBOUND
    const auditInbound = await SqlConnection.queryJson(`
      SELECT TOP 1 * FROM system_audit_logs 
      WHERE action_type = 'DC_INBOUND' AND entity_id = '${resInboundSuccess.body.receiptId}'
      ORDER BY id DESC FOR JSON PATH
    `);
    assert.strictEqual(auditInbound.length, 1);
    recordPass(`Ghi nhận nhật ký kiểm toán [DC_INBOUND] cho phiếu nhập kho ${resInboundSuccess.body.receiptNumber}`);

    // -------------------------------------------------------------
    // PHẦN 5: CHU TRÌNH TIẾP NHẬN LIÊN KẾT ĐƠN ĐẶT HÀNG PO (MỤC 12.2)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 5] TIẾP NHẬN LIÊN KẾT ĐƠN ĐẶT HÀNG PO -> DELIVERED (MỤC 12.2)');

    // 5.1 Tạo 1 đơn PO mới với trạng thái APPROVED
    const poCode = `PO-DC-TEST-${Date.now().toString().slice(-4)}`;
    const createPoRes = await SqlConnection.queryJson(`
      INSERT INTO purchase_orders (
        order_code, supplier_id, created_by, approved_by, status,
        total_estimated_cost, expected_delivery_date, notes, created_at, updated_at
      ) VALUES (
        '${poCode}', 1, 2, 2, 'APPROVED',
        500000, CAST(GETDATE() AS DATE), N'Đơn PO test liên kết tiếp nhận DC', GETDATE(), GETDATE()
      );
      SELECT SCOPE_IDENTITY() AS poId FOR JSON PATH;
    `);
    const testPoId = createPoRes[0].poId;
    recordPass(`Khởi tạo đơn đặt hàng PO #${testPoId} [${poCode}] ở trạng thái APPROVED do Cửa hàng trưởng duyệt`);

    // 5.2 Tiếp nhận hàng liên kết đơn PO này
    const resPoInbound = await request('POST', '/api/batches/inbound', {
      productId: 2,
      quantity: 20,
      manufactureDate: mfgGood,
      expiryDate: expGood,
      importPrice: 30000,
      purchaseOrderId: testPoId,
      notes: `Tiếp nhận đợt hàng theo đơn PO #${testPoId}`
    }, tokenWarehouse);
    assert.strictEqual(resPoInbound.status, 201);
    recordPass(`Nhân viên kho tiếp nhận lô hàng theo PO #${testPoId} thành công`);

    // 5.3 Xác minh PO chuyển sang DELIVERED và bảo toàn approved_by = 2 (Cửa hàng trưởng)
    const poAfterInbound = await SqlConnection.queryJson(`
      SELECT id, order_code, status, approved_by FROM purchase_orders WHERE id = ${testPoId} FOR JSON PATH
    `);
    assert.strictEqual(poAfterInbound[0].status, 'DELIVERED', 'PO status must become DELIVERED');
    assert.strictEqual(poAfterInbound[0].approved_by, 2, 'approved_by must NOT be overwritten by warehouse staff');
    recordPass(`Đơn PO #${testPoId} tự động chuyển sang DELIVERED và bảo toàn vẹn toàn approved_by = 2 (SoD)`);

    // -------------------------------------------------------------
    // PHẦN 6: KIỂM ĐỊNH ĐIỀU KIỆN BIÊN NHẬP KHO (NEGATIVE BOUNDARIES)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 6] KIỂM ĐỊNH ĐIỀU KIỆN BIÊN DỮ LIỆU NHẬP KHO (NEGATIVE TESTS)');

    // 6.1 Danh sách tiếp nhận rỗng
    const resEmptyBatches = await request('POST', '/api/batches/inbound', { batches: [] }, tokenWarehouse);
    assert.strictEqual(resEmptyBatches.status, 400);
    recordPass('Điều kiện biên 1: Chặn gửi danh sách tiếp nhận rỗng (HTTP 400)');

    // 6.2 Số lượng tiếp nhận bằng 0
    const resZeroQty = await request('POST', '/api/batches/inbound', {
      productId: 1,
      quantity: 0,
      manufactureDate: mfgGood,
      expiryDate: expGood,
      importPrice: 28000
    }, tokenWarehouse);
    assert.strictEqual(resZeroQty.status, 400);
    assert.ok(resZeroQty.body.message.includes('lớn hơn 0'));
    recordPass('Điều kiện biên 2: Chặn tiếp nhận số lượng bằng 0 (HTTP 400)');

    // 6.3 Số lượng tiếp nhận âm
    const resNegativeQty = await request('POST', '/api/batches/inbound', {
      productId: 1,
      quantity: -10,
      manufactureDate: mfgGood,
      expiryDate: expGood,
      importPrice: 28000
    }, tokenWarehouse);
    assert.strictEqual(resNegativeQty.status, 400);
    recordPass('Điều kiện biên 3: Chặn tiếp nhận số lượng âm (-10) (HTTP 400)');

    // 6.4 Đơn giá vốn âm
    const resNegativeCost = await request('POST', '/api/batches/inbound', {
      productId: 1,
      quantity: 10,
      manufactureDate: mfgGood,
      expiryDate: expGood,
      importPrice: -5000
    }, tokenWarehouse);
    assert.strictEqual(resNegativeCost.status, 400);
    assert.ok(resNegativeCost.body.message.includes('không âm'));
    recordPass('Điều kiện biên 4: Chặn đơn giá vốn âm (-5.000 đ) (HTTP 400)');

    // 6.5 Sản phẩm không tồn tại
    const resInvalidProd = await request('POST', '/api/batches/inbound', {
      productId: 999999,
      quantity: 10,
      manufactureDate: mfgGood,
      expiryDate: expGood,
      importPrice: 28000
    }, tokenWarehouse);
    assert.strictEqual(resInvalidProd.status, 400);
    assert.ok(resInvalidProd.body.message.includes('không tồn tại'));
    recordPass('Điều kiện biên 5: Chặn tiếp nhận sản phẩm không tồn tại ID 999999 (HTTP 400)');

    // -------------------------------------------------------------
    // PHẦN 7: TÍNH TOÀN VẸN CHỨNG TỪ & ĐỒNG BỘ VIEW BATCHES
    // -------------------------------------------------------------
    console.log('\n[PHẦN 7] TÍNH TOÀN VẸN CHỨNG TỪ & ĐỒNG BỘ VIEW BATCHES');

    // 7.1 Kiểm tra bảng goods_receipts
    const lastGr = await SqlConnection.queryJson(`
      SELECT TOP 1 * FROM goods_receipts ORDER BY id DESC FOR JSON PATH
    `);
    assert.ok(lastGr.length > 0);
    assert.strictEqual(lastGr[0].status, 'COMPLETED');
    assert.ok(Number(lastGr[0].total_cost) > 0);
    recordPass(`Phiếu nhập kho [${lastGr[0].receipt_number}]: Status=COMPLETED, TotalCost=${Number(lastGr[0].total_cost).toLocaleString('vi-VN')} đ`);

    // 7.2 Kiểm tra View cảnh báo vw_Batches_ShelfLife_Alerts nạp được lô mới
    const resBatchesView = await request('GET', '/api/batches', null, tokenWarehouse);
    assert.strictEqual(resBatchesView.status, 200);
    const foundNewBatch = resBatchesView.body.data.find(b => b.batchCode === newBatch.batchCode);
    assert.ok(foundNewBatch, 'New batch must appear in vw_Batches_ShelfLife_Alerts');
    assert.strictEqual(foundNewBatch.alertColor, 'GREEN', 'Fresh batch RSL=95% must be in GREEN zone');
    recordPass(`Lô hàng mới [${newBatch.batchCode}] xuất hiện trong View cảnh báo: alertColor=GREEN (Vùng Xanh an toàn)`);

    // -------------------------------------------------------------
    // TỔNG KẾT BỘ KIỂM THỬ
    // -------------------------------------------------------------
    console.log('\n' + '='.repeat(85));
    console.log(`🎉 TEST SUITE STEP 14 HOÀN TẤT THÀNH CÔNG: ${passed} / ${passed + failed} TEST CASES PASSED (100%)`);
    console.log('='.repeat(85));

  } catch (err) {
    recordFail('Lỗi ngoại lệ trong Test Suite Step 14', err);
  }
}

runStep14DcInboundTests();
