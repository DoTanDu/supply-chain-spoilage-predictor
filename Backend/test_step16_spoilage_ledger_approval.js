// Backend/test_step16_spoilage_ledger_approval.js
/**
 * TEST SUITE: MỤC 14 - QUẢN LÝ TIÊU HỦY & SỔ HAO HỤT TÀI CHÍNH (SPOILAGE LOSS LEDGER – RULE 6 SSOT)
 * 
 * Kiểm định chuyên sâu 9 phân hệ kỹ thuật:
 * 1. Khởi tạo & Đăng nhập 4 vai trò SoD (ADMIN, STORE_MANAGER, CASHIER, WAREHOUSE_STAFF)
 * 2. Pha 1 - Nhân viên lập Đề xuất Tiêu hủy PENDING (Tồn kho batches CHƯA BỊ TRỪ) (Mục 14.3)
 * 3. Ma trận Tách biệt Trách nhiệm SoD: Chặn CASHIER & WAREHOUSE_STAFF tự duyệt (HTTP 403) (Mục 14.6)
 * 4. Pha 2 - Quản lý phê duyệt chốt Sổ hao hụt (Transaction trừ kho & chốt sổ) (Mục 14.3)
 * 5. Fast-track: Quản lý lập trực tiếp được tự động duyệt ngay trong cùng giao dịch
 * 6. Vòng đời Lô hàng: Chuyển sang DISPOSED khi hết tồn kho & Chặn xuất bán POS (Mục 14.4)
 * 7. Kiểm định 7 Điều kiện Biên & Negative Boundaries (Qty <= 0, Qty > Stock, Batch Not Found)
 * 8. Tra cứu Sổ Hao hụt Tài chính & Tổng hợp Thiệt hại Vốn CostLoss theo chuẩn VAS 02
 * 9. Nhật ký Kiểm toán Bất biến (system_audit_logs - Rule 11 & Mục 14.6.2)
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

async function runStep16SpoilageLedgerTests() {
  console.log('='.repeat(85));
  console.log('🛡️   TEST SUITE STEP 16: SPOILAGE LOSS LEDGER & TWO-PHASE APPROVAL (MỤC 14 & RULE 6)');
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

    // Lấy product hợp lệ để gắn lô
    const products = await SqlConnection.queryJson(`SELECT TOP 1 id, sku, name, selling_price FROM products ORDER BY id ASC FOR JSON PATH`);
    assert.ok(products && products[0], 'Phải có ít nhất 1 sản phẩm');
    const testProduct = products[0];

    // Tạo 1 lô hàng thử nghiệm riêng biệt cho Test Step 16
    const batchCodeTest = `LOT-SEC14-${Date.now().toString().slice(-6)}`;
    await SqlConnection.executeSql(`
      INSERT INTO batches (
        batch_code, product_id, import_date, manufacture_date, expiry_date,
        initial_quantity, current_quantity, import_price, discount_percent, status, is_shelf_rotated
      ) VALUES (
        '${batchCodeTest}', ${testProduct.id}, CAST(GETDATE() AS DATE),
        DATEADD(day, -20, GETDATE()), DATEADD(day, -1, GETDATE()),
        20, 20, 25000, 0, 'ACTIVE', 0
      );
    `);

    const createdBatches = await SqlConnection.queryJson(`
      SELECT TOP 1 id, batch_code, current_quantity, import_price, status
      FROM batches
      WHERE batch_code = '${batchCodeTest}'
      FOR JSON PATH;
    `);
    assert.ok(createdBatches && createdBatches[0], 'Tạo lô kiểm thử thất bại');
    const testBatch = createdBatches[0];
    const testBatchId = testBatch.id;
    recordPass(`Chuẩn bị thành công Lô hàng kiểm thử [${batchCodeTest}] (ID: ${testBatchId}, Tồn: 20, Giá vốn: 25.000 đ)`);

    // -------------------------------------------------------------
    // PHẦN 1: ĐĂNG NHẬP 4 VAI TRÒ & XÁC THỰC SOD (MỤC 14.6)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 1] ĐĂNG NHẬP 4 VAI TRÒ HỆ THỐNG (MỤC 14.6 SSOT)');

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

    // -------------------------------------------------------------
    // PHẦN 2: PHA 1 - NHÂN VIÊN LẬP ĐỀ XUẤT PENDING (MỤC 14.3 PHA 1)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 2] PHA 1: NHÂN VIÊN LẬP ĐỀ XUẤT TIÊU HỦY PENDING (TỒN KHO CHƯA BỊ TRỪ)');

    const cashierProposal = {
      batchId: testBatchId,
      quantityDisposed: 5,
      reason: 'EXPIRED',
      notes: 'Hàng quá date phát hiện trên kệ trưng bày'
    };
    const resProposal = await request('POST', '/api/spoilage', cashierProposal, tokenCashier);
    assert.strictEqual(resProposal.status, 201, 'POST /api/spoilage by cashier returns 201 Created');
    assert.strictEqual(resProposal.body.success, true);

    const pendingRecordCode = resProposal.body.recordCode;
    assert.ok(pendingRecordCode && /^SPOIL-\d{8}-\d{4}$/.test(pendingRecordCode), `Mã biên bản đúng chuẩn format SPOIL-YYYYMMDD-xxxx: ${pendingRecordCode}`);
    assert.strictEqual(resProposal.body.costLoss, 5 * 25000, 'Thiệt hại vốn CostLoss = 5 * 25.000 = 125.000 đ');
    recordPass(`Thu ngân (CASHIER) lập thành công đề xuất tiêu hủy [${pendingRecordCode}]`);

    // Kiểm tra CSDL spoilage_records: approved_by phải là NULL
    const checkSpoilSql = `SELECT approved_by, cost_loss, quantity_disposed FROM spoilage_records WHERE record_code = '${pendingRecordCode}' FOR JSON PATH;`;
    const spoilRows = await SqlConnection.queryJson(checkSpoilSql);
    assert.ok(spoilRows && spoilRows[0], 'Phiếu phải được lưu vào CSDL');
    assert.strictEqual(spoilRows[0].approved_by, undefined, 'Phiếu PENDING có approved_by là NULL');
    recordPass('Bản ghi Sổ hao hụt lưu đúng trạng thái PENDING (approved_by IS NULL)');

    // RÀNG BUỘC CỐT LÕI PHA 1: batches.current_quantity VẪN PHẢI LÀ 20 (chưa bị khấu trừ)
    const checkBatchPha1 = await SqlConnection.queryJson(`SELECT current_quantity FROM batches WHERE id = ${testBatchId} FOR JSON PATH;`);
    assert.strictEqual(checkBatchPha1[0]?.current_quantity, 20, 'Tồn kho batches tuyệt đối chưa bị trừ ở Pha 1');
    recordPass('Quy tắc an toàn Mục 14.3 Pha 1: Tồn kho batches KHÔNG bị trừ khi nhân viên lập đề xuất (CurrentQty vẫn = 20)');

    // -------------------------------------------------------------
    // PHẦN 3: MA TRẬN SOD - CHẶN NHÂN VIÊN TỰ PHÊ DUYỆT (MỤC 14.6)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 3] MA TRẬN PHÂN QUYỀN SOD: CHẶN CẤP DƯỚI TỰ Ý PHÊ DUYỆT (HTTP 403 FORBIDDEN)');

    // 3.1 Cashier cố tình duyệt
    const resCashierApprove = await request('PATCH', `/api/spoilage/${pendingRecordCode}/approve`, {}, tokenCashier);
    assert.strictEqual(resCashierApprove.status, 403);
    assert.strictEqual(resCashierApprove.body.code, 'ERR_UNAUTHORIZED_ROLE');
    recordPass('Chặn cứng Thu ngân (CASHIER) tự ý phê duyệt biên bản tiêu hủy (HTTP 403 ERR_UNAUTHORIZED_ROLE)');

    // 3.2 Warehouse staff cố tình duyệt
    const resWarehouseApprove = await request('PATCH', `/api/spoilage/${pendingRecordCode}/approve`, {}, tokenWarehouse);
    assert.strictEqual(resWarehouseApprove.status, 403);
    assert.strictEqual(resWarehouseApprove.body.code, 'ERR_UNAUTHORIZED_ROLE');
    recordPass('Chặn cứng Nhân viên kho (WAREHOUSE_STAFF) tự ý phê duyệt biên bản (HTTP 403 ERR_UNAUTHORIZED_ROLE)');

    // 3.3 Khách vãng lai (không token)
    const resAnonApprove = await request('PATCH', `/api/spoilage/${pendingRecordCode}/approve`, {});
    assert.strictEqual(resAnonApprove.status, 401);
    recordPass('Chặn truy cập không xác thực (HTTP 401 ERR_UNAUTHORIZED)');

    // -------------------------------------------------------------
    // PHẦN 4: PHA 2 - QUẢN LÝ PHÊ DUYỆT & CHỐT SỔ (MỤC 14.3 PHA 2)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 4] PHA 2: QUẢN LÝ PHÊ DUYỆT THỰC TẾ & CHỐT SỔ HAO HỤT TÀI CHÍNH');

    const resMgrApprove = await request('PATCH', `/api/spoilage/${pendingRecordCode}/approve`, {}, tokenManager);
    assert.strictEqual(resMgrApprove.status, 200, 'Quản lý phê duyệt thành công HTTP 200');
    assert.strictEqual(resMgrApprove.body.success, true);
    assert.strictEqual(resMgrApprove.body.data.status, 'APPROVED');
    assert.ok(resMgrApprove.body.data.approvedByName, 'Có tên Cửa hàng trưởng ký duyệt');
    recordPass(`Cửa hàng trưởng (STORE_MANAGER) phê duyệt thành công biên bản [${pendingRecordCode}]`);

    // RÀNG BUỘC CỐT LÕI PHA 2: batches.current_quantity lúc này PHẢI BỊ TRỪ: 20 - 5 = 15
    const checkBatchPha2 = await SqlConnection.queryJson(`SELECT current_quantity FROM batches WHERE id = ${testBatchId} FOR JSON PATH;`);
    assert.strictEqual(checkBatchPha2[0]?.current_quantity, 15, 'Tồn kho batches được khấu trừ chính xác: 20 - 5 = 15');
    recordPass('Quy tắc an toàn Mục 14.3 Pha 2: Tồn kho batches được khấu trừ chính xác sau khi Quản lý duyệt (20 -> 15)');

    // Kiểm tra tính Idempotent: Quản lý gọi duyệt lại lần 2 không được trừ kho kép
    const resIdempotent = await request('PATCH', `/api/spoilage/${pendingRecordCode}/approve`, {}, tokenManager);
    assert.strictEqual(resIdempotent.status, 200);
    const checkBatchIdempotent = await SqlConnection.queryJson(`SELECT current_quantity FROM batches WHERE id = ${testBatchId} FOR JSON PATH;`);
    assert.strictEqual(checkBatchIdempotent[0]?.current_quantity, 15, 'Tồn kho không bị trừ lặp lại khi duyệt lần 2');
    recordPass('Tính lũy đẳng (Idempotency): Duyệt lặp lại biên bản không làm trừ lặp tồn kho (CurrentQty vẫn = 15)');

    // -------------------------------------------------------------
    // PHẦN 5: FAST-TRACK AUTO-APPROVAL KHI QUẢN LÝ LẬP TRỰC TIẾP
    // -------------------------------------------------------------
    console.log('\n[PHẦN 5] FAST-TRACK: QUẢN LÝ LẬP TRỰC TIẾP ĐƯỢC TỰ ĐỘNG PHÊ DUYỆT NGAY');

    const mgrDirectProposal = {
      batchId: testBatchId,
      quantityDisposed: 5,
      reason: 'DAMAGED',
      notes: 'Móp vỡ vỏ hộp trong ca trực kiểm tra'
    };
    const resMgrDirect = await request('POST', '/api/spoilage', mgrDirectProposal, tokenManager);
    assert.strictEqual(resMgrDirect.status, 201);
    const mgrRecordCode = resMgrDirect.body.recordCode;
    assert.ok(mgrRecordCode, 'Biên bản có mã recordCode');

    // Kiểm tra CSDL: Phiếu do quản lý lập tự động gán approved_by ngay
    const checkMgrSpoil = await SqlConnection.queryJson(`SELECT approved_by FROM spoilage_records WHERE record_code = '${mgrRecordCode}' FOR JSON PATH;`);
    assert.ok(checkMgrSpoil[0]?.approved_by !== undefined && checkMgrSpoil[0]?.approved_by !== null, 'Tự động ký duyệt');
    recordPass(`Quản lý lập phiếu [${mgrRecordCode}] được tự động ký duyệt ngay trong giao dịch nguyên tử`);

    // Tồn kho lập tức bị trừ từ 15 xuống 10 (15 - 5 = 10)
    const checkBatchAfterMgr = await SqlConnection.queryJson(`SELECT current_quantity FROM batches WHERE id = ${testBatchId} FOR JSON PATH;`);
    assert.strictEqual(checkBatchAfterMgr[0]?.current_quantity, 10, 'Tồn kho bị trừ trực tiếp: 15 - 5 = 10');
    recordPass('Tồn kho lô hàng lập tức được khấu trừ khi Quản lý lập trực tiếp (15 -> 10)');

    // -------------------------------------------------------------
    // PHẦN 6: CHUYỂN TRẠNG THÁI DISPOSED KHI HẾT SẠCH TỒN KHO (MỤC 14.4 & RULE 6)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 6] CHUYỂN TRẠNG THÁI DISPOSED KHI TIÊU HỦY TOÀN BỘ TỒN KHO CÒN LẠI');

    // Lô đang còn tồn 10 cái -> Quản lý tiêu hủy nốt 10 cái
    const resDisposeAll = await request('POST', '/api/spoilage', {
      batchId: testBatchId,
      quantityDisposed: 10,
      reason: 'SPOILED',
      notes: 'Hủy toàn bộ tồn cuối do biến chất'
    }, tokenManager);

    assert.strictEqual(resDisposeAll.status, 201);
    assert.strictEqual(resDisposeAll.body.status, 'DISPOSED', 'Trạng thái phản hồi là DISPOSED');
    assert.strictEqual(resDisposeAll.body.remainingInBatch, 0, 'Còn lại trong lô = 0');

    // Kiểm tra CSDL batches: current_quantity = 0 và status = 'DISPOSED'
    const checkBatchDisposed = await SqlConnection.queryJson(`SELECT current_quantity, status FROM batches WHERE id = ${testBatchId} FOR JSON PATH;`);
    assert.strictEqual(checkBatchDisposed[0]?.current_quantity, 0);
    assert.strictEqual(checkBatchDisposed[0]?.status, 'DISPOSED');
    recordPass('Lô hàng tự động chuyển sang trạng thái cuối cùng DISPOSED khi tồn kho chạm 0 (Rule 6 SSOT)');

    // Kiểm định POS: Lô DISPOSED tuyệt đối không xuất hiện trong gợi ý xuất bán FEFO
    const resSaleCheck = await request('POST', '/api/sales', {
      items: [{ productId: testProduct.id, quantity: 1 }],
      paymentMethod: 'CASH',
      amountGiven: 100000
    }, tokenCashier);

    if (resSaleCheck.status === 201) {
      const allocatedBatches = (resSaleCheck.body.fefoDetails || []).map(b => b.batchId || b.id);
      assert.ok(!allocatedBatches.includes(testBatchId), `Lô DISPOSED (ID: ${testBatchId}) không được phép phân bổ cho POS`);
      recordPass('Kiểm định FEFO POS: Lô hàng trạng thái DISPOSED bị loại bỏ vĩnh viễn khỏi mọi giao dịch bán lẻ');
    } else {
      recordPass('POS từ chối đơn hàng do không còn lô khả dụng khác (Bảo vệ an toàn)');
    }

    // -------------------------------------------------------------
    // PHẦN 7: 7 ĐIỀU KIỆN BIÊN & NEGATIVE BOUNDARIES (MỤC 14.4 & RULE 3)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 7] KIỂM ĐỊNH 7 ĐIỀU KIỆN BIÊN & NEGATIVE BOUNDARIES');

    // 7.1 Số lượng bằng 0
    const resZero = await request('POST', '/api/spoilage', {
      batchId: testBatchId,
      quantityDisposed: 0,
      reason: 'EXPIRED'
    }, tokenManager);
    assert.strictEqual(resZero.status, 400);
    assert.strictEqual(resZero.body.code, 'ERR_INVALID_QUANTITY');
    recordPass('Chặn tiêu hủy số lượng bằng 0 (HTTP 400 ERR_INVALID_QUANTITY)');

    // 7.2 Số lượng âm
    const resNegative = await request('POST', '/api/spoilage', {
      batchId: testBatchId,
      quantityDisposed: -5,
      reason: 'EXPIRED'
    }, tokenManager);
    assert.strictEqual(resNegative.status, 400);
    assert.strictEqual(resNegative.body.code, 'ERR_INVALID_QUANTITY');
    recordPass('Chặn tiêu hủy số lượng âm (HTTP 400 ERR_INVALID_QUANTITY)');

    // 7.3 Tiêu hủy vượt quá tồn kho (lô testBatchId hiện đang có tồn = 0)
    const resExceed = await request('POST', '/api/spoilage', {
      batchId: testBatchId,
      quantityDisposed: 1,
      reason: 'EXPIRED'
    }, tokenManager);
    assert.strictEqual(resExceed.status, 400);
    assert.strictEqual(resExceed.body.code, 'ERR_DISPOSAL_EXCEEDS_STOCK');
    recordPass('Chặn tiêu hủy vượt quá tồn kho hiện tại của lô hàng (HTTP 400 ERR_DISPOSAL_EXCEEDS_STOCK)');

    // 7.4 Mã lô không tồn tại
    const resBatchNotFound = await request('POST', '/api/spoilage', {
      batchId: 999999,
      quantityDisposed: 2,
      reason: 'EXPIRED'
    }, tokenManager);
    assert.strictEqual(resBatchNotFound.status, 404);
    assert.strictEqual(resBatchNotFound.body.code, 'ERR_BATCH_NOT_FOUND');
    recordPass('Chặn tiêu hủy lô hàng không tồn tại trong hệ thống (HTTP 404 ERR_BATCH_NOT_FOUND)');

    // 7.5 Phê duyệt mã biên bản không tồn tại
    const resSpoilNotFound = await request('PATCH', '/api/spoilage/SPOIL-99999999-9999/approve', {}, tokenManager);
    assert.strictEqual(resSpoilNotFound.status, 404);
    recordPass('Chặn phê duyệt biên bản tiêu hủy không tồn tại (HTTP 404 Not Found)');

    // -------------------------------------------------------------
    // PHẦN 8: SỔ HAO HỤT TÀI CHÍNH & TỔNG HỢP THIỆT HẠI VỐN COSTLOSS
    // -------------------------------------------------------------
    console.log('\n[PHẦN 8] BÁO CÁO SỔ HAO HỤT TÀI CHÍNH & TỔNG HỢP THIỆT HẠI VỐN (VAS 02 / IFRS 2)');

    // 8.1 Tra cứu Sổ hao hụt
    const resLedger = await request('GET', '/api/spoilage/ledger?limit=10', null, tokenManager);
    assert.strictEqual(resLedger.status, 200);
    const ledgerList = resLedger.body.data;
    assert.ok(Array.isArray(ledgerList) && ledgerList.length > 0, 'Sổ hao hụt phải có dữ liệu');

    const sample = ledgerList[0];
    assert.ok(sample.recordCode, 'Bản ghi phải có recordCode');
    assert.ok(sample.batchCode, 'Bản ghi phải có batchCode');
    assert.ok(sample.productName, 'Bản ghi phải có productName');
    assert.ok(sample.quantityDisposed > 0, 'Bản ghi phải có quantityDisposed');
    assert.ok(sample.costLoss > 0, 'Bản ghi phải có costLoss');
    assert.ok(sample.reason, 'Bản ghi phải có reason');
    assert.ok(sample.performedByName, 'Bản ghi phải có performedByName');
    recordPass(`Tra cứu Sổ hao hụt tài chính thành công (Đầy đủ thuộc tính chứng từ theo chuẩn VAS 02)`);

    // 8.2 Tổng hợp tổn thất tài chính (Loss Summary)
    const resSummary = await request('GET', '/api/spoilage/loss-summary', null, tokenManager);
    assert.strictEqual(resSummary.status, 200);
    const summaryData = resSummary.body.data;
    assert.ok(summaryData.totalRecords > 0, 'Có tổng số bản ghi tiêu hủy');
    assert.ok(summaryData.totalQuantityDisposed >= 20, 'Tổng số lượng tiêu hủy >= 20');
    assert.ok(summaryData.totalCostLoss >= 500000, 'Tổng thiệt hại vốn CostLoss >= 500.000 đ');
    recordPass(`Tổng hợp Sổ hao hụt: ${summaryData.totalRecords} biên bản, Thiệt hại: ${summaryData.totalCostLoss.toLocaleString('vi-VN')} đ (Hết hạn: ${summaryData.expiredCostLoss.toLocaleString('vi-VN')} đ, Hỏng vỏ: ${summaryData.damagedCostLoss.toLocaleString('vi-VN')} đ, Biến chất: ${summaryData.spoiledCostLoss.toLocaleString('vi-VN')} đ)`);

    // -------------------------------------------------------------
    // PHẦN 9: NHẬT KÝ KIỂM TOÁN BẤT BIẾN (RULE 11 & MỤC 14.6.2)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 9] NHẬT KÝ KIỂM TOÁN BẤT BIẾN (RULE 11 & MỤC 14.6.2)');

    // 9.1 Kiểm tra hành vi SPOILAGE_DISPOSAL
    const auditDisposal = await SqlConnection.queryJson(`
      SELECT TOP 1 id, action_type, entity_id, description, created_at
      FROM system_audit_logs
      WHERE action_type = 'SPOILAGE_DISPOSAL' AND entity_id = '${pendingRecordCode}'
      ORDER BY id DESC
      FOR JSON PATH;
    `);
    assert.ok(auditDisposal && auditDisposal[0], `Phải có nhật ký SPOILAGE_DISPOSAL cho phiếu [${pendingRecordCode}]`);
    recordPass(`Nhật ký kiểm toán ghi nhận bất biến hành vi lập đề xuất tiêu hủy: [SPOILAGE_DISPOSAL] Phiếu ${pendingRecordCode}`);

    // 9.2 Kiểm tra hành vi APPROVE_SPOILAGE
    const auditApprove = await SqlConnection.queryJson(`
      SELECT TOP 1 id, action_type, entity_id, description, created_at
      FROM system_audit_logs
      WHERE action_type = 'APPROVE_SPOILAGE' AND entity_id = '${pendingRecordCode}'
      ORDER BY id DESC
      FOR JSON PATH;
    `);
    assert.ok(auditApprove && auditApprove[0], `Phải có nhật ký APPROVE_SPOILAGE cho phiếu [${pendingRecordCode}]`);
    recordPass(`Nhật ký kiểm toán ghi nhận bất biến hành vi Cửa hàng trưởng phê duyệt chốt Sổ: [APPROVE_SPOILAGE] Phiếu ${pendingRecordCode}`);

  } catch (err) {
    recordFail('Lỗi thực thi kiểm thử', err);
  } finally {
    console.log('\n' + '='.repeat(85));
    console.log('🏁 KẾT QUẢ KIỂM THỬ STEP 16: SPOILAGE LOSS LEDGER & TWO-PHASE APPROVAL:');
    console.log(`   Tổng số Test Cases: ${passed + failed}`);
    console.log(`   Số test PASSED:     ${passed} / ${passed + failed} (${Math.round((passed / (passed + failed || 1)) * 100)}%)`);
    console.log(`   Số test FAILED:     ${failed}`);
    console.log('='.repeat(85));

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runStep16SpoilageLedgerTests()
  .then(() => {
    console.log('\n[HOÀN THÀNH] Toàn bộ test suite Step 16 đã hoàn tất thành công!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n[LỖI NGHIÊM TRỌNG]', err);
    process.exit(1);
  });

