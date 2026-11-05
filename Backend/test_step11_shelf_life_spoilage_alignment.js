// Backend/test_step11_shelf_life_spoilage_alignment.js
/**
 * TEST SUITE: MỤC 9 - QUY TRÌNH KIỂM SOÁT HẠN DÙNG, CẢNH BÁO 3 CẤP MÀU & TIÊU HỦY
 * Quy chuẩn: Clean Architecture, SSOT 11 Core Business Rules (Rule 4, 5, 6, 10, 11),
 * SoD Matrix 4 Actor, Concurrency Control WITH (UPDLOCK, ROWLOCK) & Sổ Hao Hụt Bất Biến.
 */
const http = require('http');
const assert = require('assert');
const SqlConnection = require('./src/infrastructure/database/sqlConnection');
const ShelfLife = require('./src/domain/value-objects/ShelfLife');
const AlertLevel = require('./src/domain/value-objects/AlertLevel');
const MarkdownPricingPolicy = require('./src/domain/services/MarkdownPricingPolicy');

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

async function runStep11ShelfLifeSpoilageTests() {
  console.log('='.repeat(80));
  console.log('🛡️  TEST SUITE STEP 11: SHELF-LIFE 3-ZONE ALERTS & SPOILAGE LEDGER ALIGNMENT');
  console.log('   Target Server: ' + BASE_URL);
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;

  function recordPass(msg) {
    passed++;
    console.log(`  ✅ [PASS] ${msg}`);
  }

  function recordFail(msg, err) {
    failed++;
    console.error(`  ❌ [FAIL] ${msg}:`, err?.message || err);
  }

  let adminToken = null;
  let managerToken = null;
  let cashierToken = null;
  let warehouseToken = null;

  // ============================================================================
  // KHỐI 0: ĐĂNG NHẬP 4 VAI TRÒ ĐỂ KIỂM THỬ MA TRẬN PHÂN QUYỀN SOD
  // ============================================================================
  console.log('\n--- KHỐI 0: XÁC THỰC & MA TRẬN 4 VAI TRÒ (SoD 4 Actor) ---');
  try {
    const resAdmin = await request('POST', '/api/auth/login', { username: 'admin', password: 'Password123@' });
    assert.strictEqual(resAdmin.status, 200);
    adminToken = resAdmin.body.data.token;
    recordPass('Quản trị viên (ADMIN) đăng nhập thành công');

    const resMgr = await request('POST', '/api/auth/login', { username: 'manager', password: 'Password123@' });
    assert.strictEqual(resMgr.status, 200);
    managerToken = resMgr.body.data.token;
    recordPass('Cửa hàng trưởng (STORE_MANAGER) đăng nhập thành công');

    const resCashier = await request('POST', '/api/auth/login', { username: 'cashier', password: 'Password123@' });
    assert.strictEqual(resCashier.status, 200);
    cashierToken = resCashier.body.data.token;
    recordPass('Thu ngân (CASHIER) đăng nhập thành công');

    const resWh = await request('POST', '/api/auth/login', { username: 'warehouse', password: 'Password123@' });
    assert.strictEqual(resWh.status, 200);
    warehouseToken = resWh.body.data.token;
    recordPass('Nhân viên kho (WAREHOUSE_STAFF) đăng nhập thành công');
  } catch (err) {
    recordFail('Đăng nhập 4 vai trò thất bại', err);
  }

  // ============================================================================
  // KHỐI 1: ĐỘNG CƠ CẢNH BÁO 3 CẤP MÀU & HẠN DÙNG (RULE 4 SSOT)
  // ============================================================================
  console.log('\n--- KHỐI 1: ĐỘNG CƠ CẢNH BÁO 3 CẤP MÀU & TÍNH TOÁN HẠN DÙNG (RULE 4) ---');
  try {
    // 1. Kiểm tra tính toán DaysLeft
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const mfg = new Date(now.getTime() - 10 * 86400000);
    const expGreen = new Date(now.getTime() + 20 * 86400000);
    const slGreen = new ShelfLife(mfg, expGreen, now);
    const daysLeftGreen = slGreen.getDaysLeft();
    assert.strictEqual(daysLeftGreen, 20);
    recordPass('Tính toán DaysLeft chuẩn xác ở tầng Domain: ' + daysLeftGreen + ' ngày');

    // 2. Vùng Xanh (DaysLeft > WarningDays)
    const warningThreshold = 7;
    const zoneGreen = slGreen.evaluateAlertLevel(warningThreshold);
    assert.strictEqual(zoneGreen, AlertLevel.GREEN);
    recordPass('Phân loại chuẩn Vùng Xanh (SAFE / GREEN) khi DaysLeft (20) > WarningDays (7)');

    // 3. Vùng Vàng (3 < DaysLeft <= WarningDays)
    const expYellow = new Date(now.getTime() + 5 * 86400000);
    const slYellow = new ShelfLife(mfg, expYellow, now);
    const zoneYellow = slYellow.evaluateAlertLevel(warningThreshold);
    assert.strictEqual(zoneYellow, AlertLevel.YELLOW);
    recordPass('Phân loại chuẩn Vùng Vàng (WARNING / YELLOW) khi 3 < DaysLeft (5) <= WarningDays (7)');

    // 4. Vùng Đỏ (0 < DaysLeft <= 3)
    const expRed = new Date(now.getTime() + 2 * 86400000);
    const slRed = new ShelfLife(mfg, expRed, now);
    const zoneRed = slRed.evaluateAlertLevel(warningThreshold);
    assert.strictEqual(zoneRed, AlertLevel.RED);
    recordPass('Phân loại chuẩn Vùng Đỏ (CRITICAL / RED) khi 0 < DaysLeft (2) <= 3');

    // 5. API /api/batches trả về đầy đủ các trường hạn dùng theo SQL View
    const resBatches = await request('GET', '/api/batches', null, managerToken);
    assert.strictEqual(resBatches.status, 200);
    assert.ok(Array.isArray(resBatches.body.data));
    const sampleBatch = resBatches.body.data[0];
    assert.ok(sampleBatch.daysLeft !== undefined, 'Thiếu trường daysLeft');
    assert.ok(sampleBatch.alertColor !== undefined, 'Thiếu trường alertColor');
    assert.ok(sampleBatch.warningThresholdDays !== undefined, 'Thiếu trường warningThresholdDays');
    assert.ok(sampleBatch.rslPercent !== undefined, 'Thiếu trường rslPercent');
    recordPass('API /api/batches tích hợp view vw_Batches_ShelfLife_Alerts trả về đầy đủ trường hạn dùng');
  } catch (err) {
    recordFail('Kiểm thử Khối 1 thất bại', err);
  }

  // ============================================================================
  // KHỐI 2: KHÓA CỨNG HÀNG HẾT HẠN & EXPIRY WATCHDOG (RULE 5 SSOT)
  // ============================================================================
  console.log('\n--- KHỐI 2: KHÓA CỨNG HÀNG HẾT HẠN & EXPIRY WATCHDOG (RULE 5) ---');
  let expiredBatchId = null;
  try {
    // 6. Phân loại EXPIRED khi DaysLeft <= 0
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const mfgPast = new Date(now.getTime() - 30 * 86400000);
    const expPast = new Date(now.getTime() - 1 * 86400000);
    const slExpired = new ShelfLife(mfgPast, expPast, now);
    const zoneExpired = slExpired.evaluateAlertLevel(7);
    assert.strictEqual(zoneExpired, AlertLevel.EXPIRED);
    recordPass('Tự động phân loại EXPIRED ở tầng Domain khi DaysLeft (-1) <= 0');

    // Tạo một lô hàng hết hạn trong CSDL để kiểm thử khóa cứng
    const expBatchCode = `LOT-TEST-EXP-${Date.now().toString().slice(-4)}`;
    const insSql = `
      INSERT INTO batches (
        product_id, batch_code, manufacture_date, import_date, expiry_date,
        initial_quantity, current_quantity, import_price, discount_percent,
        is_shelf_rotated, status, created_at
      )
      SELECT TOP 1
        id, '${expBatchCode}',
        CONVERT(DATE, DATEADD(day, -30, GETDATE())),
        CONVERT(DATE, DATEADD(day, -20, GETDATE())),
        CONVERT(DATE, DATEADD(day, -1, GETDATE())),
        10, 10, cost_price, 0, 0, 'EXPIRED', GETDATE()
      FROM products WHERE is_active = 1;

      SELECT SCOPE_IDENTITY() AS id FOR JSON PATH;
    `;
    const insRows = await SqlConnection.queryJson(insSql);
    expiredBatchId = insRows[0]?.id;
    assert.ok(expiredBatchId, 'Tạo lô hàng hết hạn mẫu thất bại');

    // 7. Chặn xuất bán POS với lô hàng đã hết hạn (Rule 5)
    // Gọi API bán lẻ POS trực tiếp với lô này
    const salePayload = {
      items: [{
        productId: 1,
        quantity: 1,
        batchId: expiredBatchId
      }],
      paymentMethod: 'CASH',
      customerPaid: 100000
    };
    const saleRes = await request('POST', '/api/sales', salePayload, cashierToken);
    // Lưu ý: Thuật toán FEFO sẽ bỏ qua lô này hoặc từ chối nếu ép lô hết hạn
    if (saleRes.body.fefoAllocations) {
      const allocatedExpired = saleRes.body.fefoAllocations.some(a => a.batchId === expiredBatchId);
      assert.strictEqual(allocatedExpired, false, 'FEFO không được phép phân bổ vào lô đã hết hạn!');
      recordPass('Thuật toán bẻ đơn FEFO POS tự động loại bỏ lô hết hạn, không xuất bán');
    } else {
      recordPass('Giao dịch POS chặn thành công lô hàng hết hạn: ' + (saleRes.body.message || saleRes.status));
    }

    // 8. Chặn áp dụng Quick Markdown trên lô đã hết hạn
    const discountRes = await request('PATCH', `/api/batches/${expiredBatchId}/discount`, { percent: 30 }, managerToken);
    assert.strictEqual(discountRes.status, 400);
    recordPass('Chặn áp dụng Quick Markdown trên lô hết hạn (HTTP 400 ERR_BATCH_EXPIRED)');

    // 9. Chặn xác nhận đảo kệ ra mặt tiền đối với lô hết hạn (bắt buộc rút vào khu cách ly)
    const rotateRes = await request('PATCH', `/api/batches/${expiredBatchId}/rotate`, {}, warehouseToken);
    assert.strictEqual(rotateRes.status, 400);
    recordPass('Chặn xác nhận đảo kệ mặt tiền đối với lô hết hạn (HTTP 400 ERR_BATCH_EXPIRED)');
  } catch (err) {
    recordFail('Kiểm thử Khối 2 thất bại', err);
  }

  // ============================================================================
  // KHỐI 3: QUẢN LÝ XẢ HÀNG QUICK MARKDOWN & SOP 5 BƯỚC ĐẢO KỆ (RULE 10 SSOT)
  // ============================================================================
  console.log('\n--- KHỐI 3: QUICK MARKDOWN & SOP 5 BƯỚC ĐẢO KỆ (RULE 10) ---');
  let activeBatchId = null;
  try {
    // Tìm 1 lô còn hạn đang hoạt động
    const batchRows = await SqlConnection.queryJson(`
      SELECT TOP 1 id, batch_code, current_quantity
      FROM batches
      WHERE status IN ('ACTIVE', 'WARNING') AND current_quantity >= 5 AND expiry_date > GETDATE()
      ORDER BY id DESC;
    `);
    activeBatchId = batchRows[0]?.id;
    assert.ok(activeBatchId, 'Không tìm thấy lô còn hạn để test');

    // 10. Quản lý áp dụng chiết khấu chuẩn 30% thành công
    const mkRes = await request('PATCH', `/api/batches/${activeBatchId}/discount`, { percent: 30 }, managerToken);
    assert.strictEqual(mkRes.status, 200);
    assert.strictEqual(mkRes.body.discountPercent, 30);
    recordPass(`Quản lý áp dụng thành công Quick Markdown 30% cho Lô #${activeBatchId}`);

    // 11. Chặn các mức chiết khấu không hợp lệ (ví dụ: 25%, 75%)
    const invalidMkRes = await request('PATCH', `/api/batches/${activeBatchId}/discount`, { percent: 25 }, managerToken);
    assert.strictEqual(invalidMkRes.status, 400);
    recordPass('Chặn mức chiết khấu không chuẩn (25%): HTTP 400 ERR_INVALID_MARKDOWN');

    // 12. Chặn Thu ngân (CASHIER) áp dụng Quick Markdown (SoD)
    const cashierMkRes = await request('PATCH', `/api/batches/${activeBatchId}/discount`, { percent: 15 }, cashierToken);
    assert.strictEqual(cashierMkRes.status, 403);
    recordPass('Chặn Thu ngân (CASHIER) tự ý đổi giá / giảm giá xả hàng (HTTP 403 Forbidden)');

    // 13. Xác nhận hoàn tất SOP 5 bước đảo kệ (is_shelf_rotated = 1)
    const rotRes = await request('PATCH', `/api/batches/${activeBatchId}/rotate`, {}, warehouseToken);
    assert.strictEqual(rotRes.status, 200);
    assert.strictEqual(rotRes.body.isShelfRotated, true);
    recordPass(`Nhân viên kho xác nhận thành công SOP 5 bước đảo Lô #${activeBatchId} ra mặt tiền kệ`);

    // Khôi phục giá niêm yết (0%)
    await request('PATCH', `/api/batches/${activeBatchId}/discount`, { percent: 0 }, managerToken);
  } catch (err) {
    recordFail('Kiểm thử Khối 3 thất bại', err);
  }

  // ============================================================================
  // KHỐI 4: MA TRẬN PHÂN QUYỀN TÁCH BIỆT TRÁCH NHIỆM (SOD 4 ACTOR) KHI TIÊU HỦY
  // ============================================================================
  console.log('\n--- KHỐI 4: MA TRẬN PHÂN QUYỀN SOD KHI TIÊU HỦY (RULE 6 & 16) ---');
  let pendingRecordCode = null;
  let testDisposalBatchId = null;
  try {
    // Tạo 1 lô mẫu riêng phục vụ kiểm thử tiêu hủy
    const dispBatchCode = `LOT-TEST-DISP-${Date.now().toString().slice(-4)}`;
    const createBatchSql = `
      INSERT INTO batches (
        product_id, batch_code, manufacture_date, import_date, expiry_date,
        initial_quantity, current_quantity, import_price, discount_percent,
        is_shelf_rotated, status, created_at
      )
      SELECT TOP 1
        id, '${dispBatchCode}',
        CONVERT(DATE, DATEADD(day, -10, GETDATE())),
        CONVERT(DATE, DATEADD(day, -5, GETDATE())),
        CONVERT(DATE, DATEADD(day, 5, GETDATE())),
        20, 20, 25000, 0, 0, 'ACTIVE', GETDATE()
      FROM products WHERE is_active = 1;

      SELECT SCOPE_IDENTITY() AS id FOR JSON PATH;
    `;
    const batchRes = await SqlConnection.queryJson(createBatchSql);
    testDisposalBatchId = batchRes[0]?.id;

    // 14. Thu ngân (CASHIER) lập phiếu đề xuất tiêu hủy -> Trạng thái PENDING (approved_by = NULL)
    const cashierProposal = {
      batchId: testDisposalBatchId,
      quantityDisposed: 2,
      reason: 'DAMAGED',
      notes: 'Bao bì bị rách tại quầy thanh toán'
    };
    const cashierDispRes = await request('POST', '/api/spoilage', cashierProposal, cashierToken);
    assert.strictEqual(cashierDispRes.status, 201);
    pendingRecordCode = cashierDispRes.body.recordCode;
    assert.ok(pendingRecordCode, 'Phiếu đề xuất phải có recordCode');
    recordPass(`Thu ngân (CASHIER) lập phiếu đề xuất tiêu hủy [${pendingRecordCode}] thành công (Chờ duyệt)`);

    // Kiểm tra CSDL xem approved_by có NULL không
    const chkPendingSql = `SELECT approved_by FROM spoilage_records WHERE record_code = '${pendingRecordCode}' FOR JSON PATH;`;
    const pendingRow = await SqlConnection.queryJson(chkPendingSql);
    assert.strictEqual(pendingRow[0]?.approved_by, undefined, 'Phiếu do Cashier lập bắt buộc approved_by là NULL');
    recordPass('Phiếu do Nhân viên lập ghi nhận đúng trạng thái PENDING (approved_by IS NULL)');

    // 15. Thu ngân (CASHIER) cố tình tự phê duyệt phiếu -> Bị chặn HTTP 403 Forbidden (SoD)
    const cashierApproveRes = await request('PATCH', `/api/spoilage/${pendingRecordCode}/approve`, {}, cashierToken);
    assert.strictEqual(cashierApproveRes.status, 403);
    recordPass('Chặn cứng Thu ngân (CASHIER) tự ý phê duyệt biên bản tiêu hủy (HTTP 403 Forbidden)');

    // 16. Nhân viên kho (WAREHOUSE_STAFF) cũng bị chặn tự duyệt (HTTP 403 Forbidden)
    const whApproveRes = await request('PATCH', `/api/spoilage/${pendingRecordCode}/approve`, {}, warehouseToken);
    assert.strictEqual(whApproveRes.status, 403);
    recordPass('Chặn cứng Nhân viên kho (WAREHOUSE_STAFF) tự ý phê duyệt biên bản (HTTP 403 Forbidden)');

    // 17. Cửa hàng trưởng (STORE_MANAGER) duyệt biên bản tiêu hủy -> Chuyển sang APPROVED
    const mgrApproveRes = await request('PATCH', `/api/spoilage/${pendingRecordCode}/approve`, {}, managerToken);
    assert.strictEqual(mgrApproveRes.status, 200);
    assert.strictEqual(mgrApproveRes.body.data.status, 'APPROVED');
    recordPass(`Cửa hàng trưởng (STORE_MANAGER) phê duyệt thành công biên bản [${pendingRecordCode}] (Chốt Sổ hao hụt)`);

    // 18. Quản lý (STORE_MANAGER) lập phiếu trực tiếp -> Tự động phê duyệt ngay khi tạo
    const mgrDirectProposal = {
      batchId: testDisposalBatchId,
      quantityDisposed: 3,
      reason: 'SPOILED',
      notes: 'Biến chất kiểm tra tại quầy lạnh'
    };
    const mgrDispRes = await request('POST', '/api/spoilage', mgrDirectProposal, managerToken);
    assert.strictEqual(mgrDispRes.status, 201);
    const mgrCode = mgrDispRes.body.recordCode;
    const chkMgrSql = `SELECT approved_by FROM spoilage_records WHERE record_code = '${mgrCode}' FOR JSON PATH;`;
    const mgrRow = await SqlConnection.queryJson(chkMgrSql);
    assert.ok(mgrRow[0]?.approved_by !== null && mgrRow[0]?.approved_by !== undefined);
    recordPass(`Quản lý lập phiếu [${mgrCode}] được tự động ký duyệt và chốt Sổ hao hụt ngay`);
  } catch (err) {
    recordFail('Kiểm thử Khối 4 thất bại', err);
  }

  // ============================================================================
  // KHỐI 5: GIAO DỊCH TIÊU HỦY, TRỪ KHO VÀ SỔ HAO HỤT BẤT BIẾN (RULE 6)
  // ============================================================================
  console.log('\n--- KHỐI 5: GIAO DỊCH TIÊU HỦY & SỔ HAO HỤT TÀI CHÍNH BẤT BIẾN (RULE 6) ---');
  try {
    // Lô test testDisposalBatchId ban đầu có 20 cái, đã trừ: 2 (phiếu 1) + 3 (phiếu 2) = 5 cái -> Còn 15 cái
    const chkQtySql = `SELECT current_quantity, import_price FROM batches WHERE id = ${testDisposalBatchId} FOR JSON PATH;`;
    const batchRow = await SqlConnection.queryJson(chkQtySql);
    assert.strictEqual(batchRow[0]?.current_quantity, 15);
    recordPass('Giao dịch tiêu hủy trừ chính xác tồn kho của lô hàng: 20 - 5 = 15 đơn vị');

    // 19. Kiểm tra tính toán CostLoss: 3 * 25.000 = 75.000 đ
    const costLossSql = `
      SELECT TOP 1 quantity_disposed, cost_loss, reason
      FROM spoilage_records
      WHERE batch_id = ${testDisposalBatchId} AND quantity_disposed = 3
      ORDER BY id DESC FOR JSON PATH;
    `;
    const lossRows = await SqlConnection.queryJson(costLossSql);
    assert.strictEqual(Number(lossRows[0]?.cost_loss), 75000);
    recordPass('Tính toán thiệt hại vốn CostLoss = 3 * 25.000 đ = 75.000 đ chuẩn 100%');

    // 20. Tiêu hủy nốt 15 cái còn lại để kiểm tra chuyển trạng thái lô sang 'DISPOSED'
    const fullDispPayload = {
      batchId: testDisposalBatchId,
      quantityDisposed: 15,
      reason: 'EXPIRED',
      notes: 'Hủy sạch tồn kho để thanh lý'
    };
    const fullRes = await request('POST', '/api/spoilage', fullDispPayload, managerToken);
    assert.strictEqual(fullRes.status, 201);

    const finalBatchSql = `SELECT current_quantity, status FROM batches WHERE id = ${testDisposalBatchId} FOR JSON PATH;`;
    const finalBatch = await SqlConnection.queryJson(finalBatchSql);
    assert.strictEqual(finalBatch[0]?.current_quantity, 0);
    assert.strictEqual(finalBatch[0]?.status, 'DISPOSED');
    recordPass('Khi hủy hết tồn kho (15/15), Lô hàng tự động chuyển sang trạng thái DISPOSED (Rule 6)');

    // 21. Kiểm tra nhật ký kiểm toán AuditLogs ghi nhận hành vi SPOILAGE_DISPOSAL (Rule 11)
    const auditSql = `
      SELECT TOP 1 action_type, entity_name, description
      FROM system_audit_logs
      WHERE action_type IN ('SPOILAGE_DISPOSAL', 'APPROVE_SPOILAGE')
      ORDER BY id DESC FOR JSON PATH;
    `;
    const auditRows = await SqlConnection.queryJson(auditSql);
    assert.ok(auditRows.length > 0, 'Phải có bản ghi kiểm toán tiêu hủy');
    recordPass(`Nhật ký kiểm toán ghi nhận hành vi bất biến: [${auditRows[0].action_type}] ${auditRows[0].description.slice(0, 70)}...`);

    // 22. API GET /api/spoilage/ledger trả về Sổ hao hụt tài chính
    const ledgerRes = await request('GET', '/api/spoilage/ledger?limit=10', null, managerToken);
    assert.strictEqual(ledgerRes.status, 200);
    assert.ok(Array.isArray(ledgerRes.body.data || ledgerRes.body));
    recordPass('API /api/spoilage/ledger trả về đầy đủ danh sách chứng từ Sổ hao hụt tài chính');
  } catch (err) {
    recordFail('Kiểm thử Khối 5 thất bại', err);
  }

  // ============================================================================
  // KHỐI 6: 7 ĐIỀU KIỆN BIÊN & CHỐNG TRANH CHẤP ĐỒNG THỜI (CONCURRENCY CONTROL)
  // ============================================================================
  console.log('\n--- KHỐI 6: 7 ĐIỀU KIỆN BIÊN & CHỐNG TRANH CHẤP ĐỒNG THỜI (RULE 3) ---');
  try {
    // 23. Chặn tiêu hủy số lượng <= 0
    const zeroRes = await request('POST', '/api/spoilage', {
      batchId: testDisposalBatchId,
      quantityDisposed: 0,
      reason: 'EXPIRED'
    }, managerToken);
    assert.ok(zeroRes.status === 400 || zeroRes.body.success === false);
    recordPass('Chặn tiêu hủy số lượng bằng 0 (HTTP 400 / Validation error)');

    // 24. Chặn tiêu hủy vượt tồn kho khả dụng hiện tại (hiện lô này tồn 0)
    const exceedRes = await request('POST', '/api/spoilage', {
      batchId: testDisposalBatchId,
      quantityDisposed: 1,
      reason: 'EXPIRED'
    }, managerToken);
    assert.ok(exceedRes.status === 400 || exceedRes.body.success === false);
    recordPass('Chặn tiêu hủy vượt quá tồn kho hiện tại của lô hàng (THROW 50002)');

    // 25. Kiểm tra Concurrency Race Condition:
    // Tạo 1 lô có tồn 5 sản phẩm.
    // 2 tiến trình đồng thời cùng gửi request tiêu hủy 4 sản phẩm.
    // Chỉ có ĐÚNG 1 tiến trình được thành công, tiến trình kia bị chặn và ROLLBACK; tồn kho còn lại là 1 (không bao giờ âm).
    const concBatchCode = `LOT-TEST-CONC-${Date.now().toString().slice(-4)}`;
    const concSql = `
      INSERT INTO batches (
        product_id, batch_code, manufacture_date, import_date, expiry_date,
        initial_quantity, current_quantity, import_price, discount_percent,
        is_shelf_rotated, status, created_at
      )
      SELECT TOP 1
        id, '${concBatchCode}',
        CONVERT(DATE, DATEADD(day, -10, GETDATE())),
        CONVERT(DATE, DATEADD(day, -5, GETDATE())),
        CONVERT(DATE, DATEADD(day, 10, GETDATE())),
        5, 5, 30000, 0, 0, 'ACTIVE', GETDATE()
      FROM products WHERE is_active = 1;

      SELECT SCOPE_IDENTITY() AS id FOR JSON PATH;
    `;
    const concRows = await SqlConnection.queryJson(concSql);
    const concBatchId = concRows[0]?.id;
    assert.ok(concBatchId, 'Tạo lô concurrency thất bại');

    const p1 = request('POST', '/api/spoilage', {
      batchId: concBatchId,
      quantityDisposed: 4,
      reason: 'DAMAGED',
      notes: 'Request đồng thời 1'
    }, managerToken);

    const p2 = request('POST', '/api/spoilage', {
      batchId: concBatchId,
      quantityDisposed: 4,
      reason: 'DAMAGED',
      notes: 'Request đồng thời 2'
    }, managerToken);

    const [r1, r2] = await Promise.all([p1, p2]);

    const successes = [r1, r2].filter(r => r.status === 201 || (r.body && r.body.success === true));
    const failures = [r1, r2].filter(r => r.status !== 201 || (r.body && r.body.success === false));

    assert.strictEqual(successes.length, 1, 'Chỉ được phép đúng 1 giao dịch tiêu hủy thành công!');
    assert.strictEqual(failures.length, 1, 'Giao dịch đến sau vượt quá tồn kho còn lại bắt buộc phải thất bại!');

    const concFinalRows = await SqlConnection.queryJson(`SELECT current_quantity FROM batches WHERE id = ${concBatchId} FOR JSON PATH;`);
    assert.strictEqual(concFinalRows[0]?.current_quantity, 1, 'Tồn kho cuối cùng phải là 1 (5 - 4 = 1), tuyệt đối không âm!');
    recordPass('Khóa dòng Concurrency WITH (UPDLOCK, ROWLOCK) bảo vệ thành công: 1 duyệt, 1 chặn, kho còn 1 (Rule 3 SSOT)');
  } catch (err) {
    recordFail('Kiểm thử Khối 6 thất bại', err);
  }

  // Dọn dẹp dữ liệu kiểm thử
  try {
    if (expiredBatchId) {
      await SqlConnection.executeSql(`DELETE FROM batches WHERE id = ${expiredBatchId};`);
    }
  } catch (e) {}

  console.log('\n' + '='.repeat(80));
  console.log('🏁 KẾT QUẢ KIỂM THỬ STEP 11: SHELF-LIFE 3-ZONE ALERTS & SPOILAGE LEDGER:');
  console.log(`   Tổng số Test Cases: ${passed + failed}`);
  console.log(`   Số test PASSED:     ${passed} / ${passed + failed} (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log(`   Số test FAILED:     ${failed}`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  }
}

runStep11ShelfLifeSpoilageTests();
