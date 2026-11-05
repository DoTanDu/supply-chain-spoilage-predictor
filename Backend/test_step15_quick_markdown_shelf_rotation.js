// Backend/test_step15_quick_markdown_shelf_rotation.js
/**
 * TEST SUITE: MỤC 13 - QUẢN LÝ XẢ HÀNG GIẢM GIÁ (QUICK MARKDOWN) & ĐẢO KỆ THEO FEFO
 * (Rule 10, Rule 4, Rule 5, Rule 11 & SoD Matrix)
 * 
 * Kiểm định chuyên sâu 6 phân hệ kỹ thuật:
 * 1. Ma trận Phân quyền & Tách biệt Trách nhiệm SoD (Mục 13.5)
 * 2. Động cơ 4 Mức Chiết Khấu Chuẩn Hóa & Khôi phục 0% (Mục 13.1)
 * 3. Kiểm định Điều kiện Biên & Chống Gian Lận Giá (Negative Boundaries)
 * 4. Quy trình SOP Đảo Kệ Mặt Tiền theo Chuẩn FEFO (Mục 13.2)
 * 5. Tích hợp Quầy POS FEFO Nhận Diện Đơn Giá Xả Hàng Thời Gian Thực (Mục 13.4)
 * 6. Nhật Ký Kiểm Toán Bất Biến (System Audit Logs - Rule 11 & Mục 13.6)
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

async function runStep15QuickMarkdownTests() {
  console.log('='.repeat(85));
  console.log('⚡  TEST SUITE STEP 15: QUICK MARKDOWN & SHELF ROTATION (MỤC 13 & RULE 10 SSOT)');
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
    // CHUẨN BỊ DỮ LIỆU LÔ HÀNG KIỂM THỬ TRÊN CSDL
    // -------------------------------------------------------------
    console.log('\n[BƯỚC 0] KHỞI TẠO DỮ LIỆU LÔ HÀNG KIỂM THỬ TRÊN CSDL SQL SERVER');

    // Tìm hoặc tạo 1 lô hàng còn hạn hợp lệ (DaysLeft > 0)
    const validBatches = await SqlConnection.queryJson(`
      SELECT TOP 1 id, batch_code, product_id, current_quantity, discount_percent, status,
             DATEDIFF(day, CAST(GETDATE() AS DATE), expiry_date) AS days_left
      FROM batches
      WHERE current_quantity > 0 AND expiry_date > GETDATE() AND status != 'EXPIRED'
      ORDER BY expiry_date ASC, id ASC
      FOR JSON PATH
    `);

    let testBatch = validBatches && validBatches[0];
    if (!testBatch) {
      // Nếu chưa có lô, chèn tạm 1 lô hợp lệ
      await SqlConnection.executeSql(`
        INSERT INTO batches (batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status, is_shelf_rotated)
        VALUES ('LOT-TEST-MD-01', 1, CAST(GETDATE() AS DATE), DATEADD(day, -10, GETDATE()), DATEADD(day, 20, GETDATE()), 50, 50, 20000, 0, 'ACTIVE', 0)
      `);
      const inserted = await SqlConnection.queryJson(`SELECT TOP 1 id, batch_code, current_quantity FROM batches WHERE batch_code = 'LOT-TEST-MD-01' FOR JSON PATH`);
      testBatch = inserted[0];
    }
    const testBatchId = testBatch.id;

    // Tìm hoặc tạo 1 lô hàng đã hết hạn (DaysLeft <= 0)
    let expiredBatches = await SqlConnection.queryJson(`
      SELECT TOP 1 id, batch_code, current_quantity, status,
             DATEDIFF(day, CAST(GETDATE() AS DATE), expiry_date) AS days_left
      FROM batches
      WHERE expiry_date <= GETDATE() OR status = 'EXPIRED'
      ORDER BY id DESC
      FOR JSON PATH
    `);

    let expiredBatchId;
    if (expiredBatches && expiredBatches[0]) {
      expiredBatchId = expiredBatches[0].id;
    } else {
      await SqlConnection.executeSql(`
        INSERT INTO batches (batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status, is_shelf_rotated)
        VALUES ('LOT-TEST-EXP-01', 1, DATEADD(day, -30, GETDATE()), DATEADD(day, -35, GETDATE()), DATEADD(day, -2, GETDATE()), 10, 10, 20000, 0, 'EXPIRED', 0)
      `);
      const expInserted = await SqlConnection.queryJson(`SELECT TOP 1 id FROM batches WHERE batch_code = 'LOT-TEST-EXP-01' FOR JSON PATH`);
      expiredBatchId = expInserted[0].id;
    }

    recordPass(`Chuẩn bị thành công Lô kiểm thử hợp lệ (ID: ${testBatchId}) và Lô hết hạn (ID: ${expiredBatchId})`);

    // -------------------------------------------------------------
    // PHẦN 1: MA TRẬN PHÂN QUYỀN & TÁCH BIỆT TRÁCH NHIỆM SOD (MỤC 13.5)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 1] KIỂM ĐỊNH MA TRẬN PHÂN QUYỀN SOD (MỤC 13.5 & RULE 10)');

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

    // 1.2 SoD: CASHIER bị chặn tuyệt đối quyền kích hoạt Quick Markdown
    const resCashierMarkdown = await request('PATCH', `/api/batches/${testBatchId}/discount`, { percent: 30 }, tokenCashier);
    assert.strictEqual(resCashierMarkdown.status, 403, 'Cashier must be forbidden from markdown');
    assert.strictEqual(resCashierMarkdown.body.code, 'ERR_UNAUTHORIZED_ROLE');
    recordPass('SoD Matrix: Thu ngân (CASHIER) bị chặn đổi giá Quick Markdown (HTTP 403 ERR_UNAUTHORIZED_ROLE)');

    // 1.3 SoD: WAREHOUSE_STAFF bị chặn quyền kích hoạt Quick Markdown
    const resWarehouseMarkdown = await request('PATCH', `/api/batches/${testBatchId}/discount`, { percent: 30 }, tokenWarehouse);
    assert.strictEqual(resWarehouseMarkdown.status, 403, 'Warehouse staff must be forbidden from markdown');
    assert.strictEqual(resWarehouseMarkdown.body.code, 'ERR_UNAUTHORIZED_ROLE');
    recordPass('SoD Matrix: Nhân viên kho (WAREHOUSE_STAFF) bị chặn đổi giá Quick Markdown (HTTP 403 ERR_UNAUTHORIZED_ROLE)');

    // 1.4 SoD: CASHIER bị chặn quyền xác nhận đảo kệ mặt tiền
    const resCashierRotate = await request('PATCH', `/api/batches/${testBatchId}/rotate`, {}, tokenCashier);
    assert.strictEqual(resCashierRotate.status, 403, 'Cashier must be forbidden from shelf rotation');
    assert.strictEqual(resCashierRotate.body.code, 'ERR_UNAUTHORIZED_ROLE');
    recordPass('SoD Matrix: Thu ngân (CASHIER) bị chặn gọi PATCH /rotate (HTTP 403 ERR_UNAUTHORIZED_ROLE)');

    // -------------------------------------------------------------
    // PHẦN 2: KIỂM ĐỊNH 4 MỨC CHIẾT KHẤU CHUẨN & KHÔI PHỤC 0% (MỤC 13.1)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 2] KIỂM ĐỊNH 4 MỨC CHIẾT KHẤU CHUẨN (15%, 30%, 40%, 50%) & KHÔI PHỤC 0%');

    // 2.1 Cửa hàng trưởng áp dụng mức 15%
    const resDisc15 = await request('PATCH', `/api/batches/${testBatchId}/discount`, { percent: 15 }, tokenManager);
    assert.strictEqual(resDisc15.status, 200);
    assert.strictEqual(resDisc15.body.discountPercent, 15);
    recordPass('Áp dụng thành công Quick Markdown 15% (Vùng Vàng nhẹ)');

    // 2.2 Cửa hàng trưởng áp dụng mức 30%
    const resDisc30 = await request('PATCH', `/api/batches/${testBatchId}/discount`, { percent: 30 }, tokenManager);
    assert.strictEqual(resDisc30.status, 200);
    assert.strictEqual(resDisc30.body.discountPercent, 30);
    recordPass('Áp dụng thành công Quick Markdown 30% (Vùng Vàng sát Vùng Đỏ)');

    // 2.3 Quản trị viên áp dụng mức 40%
    const resDisc40 = await request('PATCH', `/api/batches/${testBatchId}/discount`, { percent: 40 }, tokenAdmin);
    assert.strictEqual(resDisc40.status, 200);
    assert.strictEqual(resDisc40.body.discountPercent, 40);
    recordPass('Áp dụng thành công Quick Markdown 40% (Vùng Đỏ nguy kịch)');

    // 2.4 Quản trị viên áp dụng mức 50%
    const resDisc50 = await request('PATCH', `/api/batches/${testBatchId}/discount`, { percent: 50 }, tokenAdmin);
    assert.strictEqual(resDisc50.status, 200);
    assert.strictEqual(resDisc50.body.discountPercent, 50);
    recordPass('Áp dụng thành công Quick Markdown 50% (Vùng Đỏ kịch sàn trong ngày)');

    // 2.5 Khôi phục nguyên giá (0%)
    const resDisc0 = await request('PATCH', `/api/batches/${testBatchId}/discount`, { percent: 0 }, tokenManager);
    assert.strictEqual(resDisc0.status, 200);
    assert.strictEqual(resDisc0.body.discountPercent, 0);
    recordPass('Khôi phục thành công nguyên giá niêm yết (0%)');

    // -------------------------------------------------------------
    // PHẦN 3: KIỂM ĐỊNH ĐIỀU KIỆN BIÊN & CHỐNG GIAN LẬN GIÁ (NEGATIVE BOUNDARIES)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 3] KIỂM ĐỊNH ĐIỀU KIỆN BIÊN & CHỐNG GIAN LẬN GIÁ (NEGATIVE BOUNDARIES)');

    // 3.1 Chặn mức chiết khấu tùy tiện không thuộc {0, 15, 30, 40, 50} (Ví dụ: 25%)
    const resInvalid25 = await request('PATCH', `/api/batches/${testBatchId}/discount`, { percent: 25 }, tokenManager);
    assert.strictEqual(resInvalid25.status, 400);
    assert.strictEqual(resInvalid25.body.code, 'ERR_INVALID_MARKDOWN');
    recordPass('Chặn đứng chiết khấu không hợp lệ 25% (HTTP 400 ERR_INVALID_MARKDOWN)');

    // 3.2 Chặn mức chiết khấu vượt trần (Ví dụ: 70%)
    const resInvalid70 = await request('PATCH', `/api/batches/${testBatchId}/discount`, { percent: 70 }, tokenManager);
    assert.strictEqual(resInvalid70.status, 400);
    assert.strictEqual(resInvalid70.body.code, 'ERR_INVALID_MARKDOWN');
    recordPass('Chặn đứng chiết khấu vượt trần 70% (HTTP 400 ERR_INVALID_MARKDOWN)');

    // 3.3 Chặn mức chiết khấu âm (Ví dụ: -15%)
    const resInvalidNeg = await request('PATCH', `/api/batches/${testBatchId}/discount`, { percent: -15 }, tokenManager);
    assert.strictEqual(resInvalidNeg.status, 400);
    assert.strictEqual(resInvalidNeg.body.code, 'ERR_INVALID_MARKDOWN');
    recordPass('Chặn đứng chiết khấu số âm -15% (HTTP 400 ERR_INVALID_MARKDOWN)');

    // 3.4 Khóa cứng cấm áp dụng Quick Markdown trên lô hàng đã hết hạn (Rule 5)
    const resExpMarkdown = await request('PATCH', `/api/batches/${expiredBatchId}/discount`, { percent: 50 }, tokenManager);
    assert.strictEqual(resExpMarkdown.status, 400);
    assert.strictEqual(resExpMarkdown.body.code, 'ERR_BATCH_EXPIRED');
    recordPass('Rule 5 Guard: Khóa cứng cấm giảm giá lô đã hết hạn (HTTP 400 ERR_BATCH_EXPIRED)');

    // 3.5 Báo lỗi 404 nếu lô hàng không tồn tại
    const resNotFound = await request('PATCH', '/api/batches/999999/discount', { percent: 30 }, tokenManager);
    assert.strictEqual(resNotFound.status, 404);
    recordPass('Trả về lỗi HTTP 404 khi lô hàng không tồn tại trên hệ thống');

    // -------------------------------------------------------------
    // PHẦN 4: QUY TRÌNH SOP ĐẢO KỆ MẶT TIỀN (MỤC 13.2 & RULE 10)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 4] KIỂM ĐỊNH QUY TRÌNH SOP ĐẢO KỆ MẶT TIỀN (MỤC 13.2 & RULE 10)');

    // 4.1 WAREHOUSE_STAFF xác nhận hoàn tất SOP đảo kệ
    const resRotate = await request('PATCH', `/api/batches/${testBatchId}/rotate`, {}, tokenWarehouse);
    assert.strictEqual(resRotate.status, 200);
    assert.strictEqual(resRotate.body.isShelfRotated, true);
    recordPass('Nhân viên kho (WAREHOUSE_STAFF) xác nhận hoàn tất SOP đảo kệ (is_shelf_rotated = 1)');

    // 4.2 Khóa cấm đảo kệ lô hàng đã hết hạn
    const resExpRotate = await request('PATCH', `/api/batches/${expiredBatchId}/rotate`, {}, tokenWarehouse);
    assert.strictEqual(resExpRotate.status, 400);
    assert.strictEqual(resExpRotate.body.code, 'ERR_BATCH_EXPIRED');
    recordPass('Rule 5 Guard: Khóa cấm đảo ra mặt tiền kệ đối với lô hàng đã hết hạn (HTTP 400 ERR_BATCH_EXPIRED)');

    // -------------------------------------------------------------
    // PHẦN 5: TÍCH HỢP QUẦY POS FEFO TỰ ĐỘNG NHẬN DIỆN GIÁ XẢ HÀNG (MỤC 13.4)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 5] KIỂM ĐỊNH TÍCH HỢP QUẦY THU NGÂN POS FEFO NHẬN DIỆN GIÁ XẢ HÀNG (MỤC 13.4)');

    // Đặt giảm giá 30% cho testBatch
    await request('PATCH', `/api/batches/${testBatchId}/discount`, { percent: 30 }, tokenManager);

    // Thu ngân quét bán sản phẩm testBatch.product_id
    const prodInfo = (await SqlConnection.queryJson(`SELECT id, name, selling_price FROM products WHERE id = ${testBatch.product_id} FOR JSON PATH`))[0];
    const originalPrice = Number(prodInfo.selling_price);
    const expectedDiscountedPrice = Math.round(originalPrice * (1.0 - 0.3));

    // Thu ngân thực hiện giao dịch POS
    const resSale = await request('POST', '/api/sales', {
      paymentMethod: 'CASH',
      items: [
        {
          productId: testBatch.product_id,
          quantity: 1
        }
      ]
    }, tokenCashier);

    assert.strictEqual(resSale.status, 201, 'Sale transaction must return 201 Created');
    const saleAlloc = resSale.body.fefoDetails[0];
    assert.strictEqual(saleAlloc.batchId, testBatchId, 'FEFO must allocate the test batch first');
    assert.strictEqual(saleAlloc.discountPercent, 30, 'Allocation must inherit 30% discount');
    assert.strictEqual(saleAlloc.unitPrice, expectedDiscountedPrice, `Unit price must match effective price ${expectedDiscountedPrice}`);
    recordPass(`Quầy POS xuất bán tự động nhận diện giá xả hàng: ${originalPrice} đ -> ${expectedDiscountedPrice} đ (-30%)`);

    // -------------------------------------------------------------
    // PHẦN 6: NHẬT KÝ KIỂM TOÁN BẤT BIẾN (SYSTEM AUDIT LOGS - RULE 11 & MỤC 13.6)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 6] KIỂM ĐỊNH NHẬT KÝ KIỂM TOÁN BẤT BIẾN (SYSTEM AUDIT LOGS - RULE 11)');

    const auditMarkdown = await SqlConnection.queryJson(`
      SELECT TOP 1 action_type, entity_name, entity_id, description
      FROM system_audit_logs
      WHERE action_type = 'QUICK_MARKDOWN' AND entity_id = '${testBatchId}'
      ORDER BY id DESC
      FOR JSON PATH
    `);
    assert(auditMarkdown && auditMarkdown.length > 0, 'Must have QUICK_MARKDOWN log record');
    assert.strictEqual(auditMarkdown[0].action_type, 'QUICK_MARKDOWN');
    recordPass(`Nhật ký kiểm toán lưu vết thành công hành động QUICK_MARKDOWN: [${auditMarkdown[0].description}]`);

    const auditRotate = await SqlConnection.queryJson(`
      SELECT TOP 1 action_type, entity_name, entity_id, description
      FROM system_audit_logs
      WHERE action_type = 'ROTATE_SHELF_FEFO' AND entity_id = '${testBatchId}'
      ORDER BY id DESC
      FOR JSON PATH
    `);
    assert(auditRotate && auditRotate.length > 0, 'Must have ROTATE_SHELF_FEFO log record');
    assert.strictEqual(auditRotate[0].action_type, 'ROTATE_SHELF_FEFO');
    recordPass(`Nhật ký kiểm toán lưu vết thành công hành động ROTATE_SHELF_FEFO: [${auditRotate[0].description}]`);

    // -------------------------------------------------------------
    // TỔNG KẾT
    // -------------------------------------------------------------
    console.log('\n' + '='.repeat(85));
    console.log(`🎉 TEST SUITE STEP 15 HOÀN TẤT THÀNH CÔNG: ${passed} PASSED, ${failed} FAILED`);
    console.log('='.repeat(85));

  } catch (err) {
    recordFail('Lỗi ngoại lệ trong quá trình thực thi Test Suite Step 15', err);
  } finally {
    process.exit(failed > 0 ? 1 : 0);
  }
}

runStep15QuickMarkdownTests();
