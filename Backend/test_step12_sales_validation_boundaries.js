// Backend/test_step12_sales_validation_boundaries.js
/**
 * TEST SUITE: MỤC 10 - ĐIỀU KIỆN KIỂM TRA KHI BÁN HÀNG & XUẤT KHO
 * Chuẩn hóa Kiến trúc phòng thủ chiều sâu 3 tầng:
 * - Tầng 1: Presentation Guard (Frontend/Input Validation)
 * - Tầng 2: Application/Domain Guard (Store State, Product Lifecycle, Expiry Watchdog, FefoAllocationPolicy)
 * - Tầng 3: Database & Concurrency Lock Guard (Transaction UPDLOCK, ROWLOCK, Zero-Negative Invariant, Rollback)
 * 
 * Kiểm định toàn diện 8 Mã Lỗi Kỹ thuật Chuẩn hóa (Error Code Catalog 10.3):
 * 1. ERR_STORE_CLOSED (HTTP 400)
 * 2. ERR_STORE_INVENTORY (HTTP 400)
 * 3. ERR_PRODUCT_INACTIVE (HTTP 400)
 * 4. ERR_INVALID_QUANTITY (HTTP 400)
 * 5. ERR_BATCH_EXPIRED (HTTP 400)
 * 6. ERR_INSUFFICIENT_STOCK (HTTP 400)
 * 7. ERR_CONCURRENCY_CONFLICT (HTTP 409 / 400)
 * 8. ERR_UNAUTHORIZED_ROLE (HTTP 403)
 */

const http = require('http');
const assert = require('assert');
const SqlConnection = require('./src/infrastructure/database/sqlConnection');
const FefoAllocationPolicy = require('./src/domain/services/FefoAllocationPolicy');
const { processFefoSaleUseCase } = require('./src/container');

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

async function runStep12SalesValidationTests() {
  console.log('='.repeat(85));
  console.log('🛡️  TEST SUITE STEP 12: SALES & DISPATCH VALIDATION BOUNDARIES (MỤC 10 SSOT)');
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

  let cashierToken = null;
  let managerToken = null;
  let warehouseToken = null;
  let adminToken = null;

  try {
    // -------------------------------------------------------------
    // CHUẨN BỊ XÁC THỰC (AUTHENTICATION TOKENS)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 1] KHỞI TẠO VÀ XÁC THỰC CÁC TÀI KHOẢN THEO MA TRẬN PHÂN QUYỀN');

    const resCashier = await request('POST', '/api/auth/login', { username: 'cashier', password: 'Password123@' });
    cashierToken = resCashier.body?.data?.token;
    assert.strictEqual(resCashier.status, 200, 'Cashier login status must be 200');
    recordPass('Đăng nhập thành công vai trò CASHIER (Thẩm quyền bán hàng quầy POS)');

    const resManager = await request('POST', '/api/auth/login', { username: 'manager', password: 'Password123@' });
    managerToken = resManager.body?.data?.token;
    assert.strictEqual(resManager.status, 200, 'Manager login status must be 200');
    recordPass('Đăng nhập thành công vai trò STORE_MANAGER (Thẩm quyền duyệt & bán)');

    const resWarehouse = await request('POST', '/api/auth/login', { username: 'warehouse', password: 'Password123@' });
    warehouseToken = resWarehouse.body?.data?.token;
    assert.strictEqual(resWarehouse.status, 200, 'Warehouse login status must be 200');
    recordPass('Đăng nhập thành công vai trò WAREHOUSE_STAFF (Nhân viên kho - Không được bán)');

    const resAdmin = await request('POST', '/api/auth/login', { username: 'admin', password: 'Password123@' });
    adminToken = resAdmin.body?.data?.token;
    assert.strictEqual(resAdmin.status, 200, 'Admin login status must be 200');
    recordPass('Đăng nhập thành công vai trò ADMIN (Quản trị viên tối cao)');

    // -------------------------------------------------------------
    // KIỂM ĐỊNH PHÂN QUYỀN XUẤT BÁN (ERR_UNAUTHORIZED_ROLE)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 2] KIỂM ĐỊNH PHÂN QUYỀN BÁN LẺ POS (ERR_UNAUTHORIZED_ROLE)');

    // Test 1: WAREHOUSE_STAFF gọi API bán hàng -> Bị từ chối HTTP 403
    const resForbidden = await request('POST', '/api/sales', {
      items: [{ productId: 1, quantity: 1 }]
    }, warehouseToken);
    assert.strictEqual(resForbidden.status, 403, 'Warehouse staff must be rejected with 403');
    assert.strictEqual(resForbidden.body.code, 'ERR_UNAUTHORIZED_ROLE', 'Error code must be ERR_UNAUTHORIZED_ROLE');
    recordPass('Nhân viên kho WAREHOUSE_STAFF bị chặn bán hàng: Trả về HTTP 403 [ERR_UNAUTHORIZED_ROLE]');

    // Test 2: Không gửi Authorization Token -> Bị từ chối HTTP 401
    const resNoAuth = await request('POST', '/api/sales', {
      items: [{ productId: 1, quantity: 1 }]
    });
    assert.strictEqual(resNoAuth.status, 401, 'Unauthenticated request must be 401');
    recordPass('Yêu cầu không có JWT Token bị từ chối truy cập: HTTP 401 Unauthorized');

    // -------------------------------------------------------------
    // ĐIỀU KIỆN 1: TRẠNG THÁI CỬA HÀNG (STORE OPERATIONAL STATUS GUARD)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 3] ĐIỀU KIỆN 1: TRẠNG THÁI HOẠT ĐỘNG CỦA CỬA HÀNG (ERR_STORE_CLOSED & ERR_STORE_INVENTORY)');

    // Test 3: Cửa hàng ở trạng thái CLOSED
    await SqlConnection.executeSql("UPDATE store_profile SET status = 'CLOSED', updated_at = GETDATE() WHERE id = 1;");
    const resClosed = await request('POST', '/api/sales', {
      items: [{ productId: 1, quantity: 1 }]
    }, cashierToken);
    assert.strictEqual(resClosed.status, 400, 'Store closed checkout must return 400');
    assert.strictEqual(resClosed.body.code, 'ERR_STORE_CLOSED', 'Code must be ERR_STORE_CLOSED');
    recordPass('Cửa hàng trạng thái [CLOSED]: Chặn thanh toán POS với mã lỗi [ERR_STORE_CLOSED]');

    // Test 4: Cửa hàng ở trạng thái INVENTORY
    await SqlConnection.executeSql("UPDATE store_profile SET status = 'INVENTORY', updated_at = GETDATE() WHERE id = 1;");
    const resInventory = await request('POST', '/api/sales', {
      items: [{ productId: 1, quantity: 1 }]
    }, cashierToken);
    assert.strictEqual(resInventory.status, 400, 'Store inventory audit checkout must return 400');
    assert.strictEqual(resInventory.body.code, 'ERR_STORE_INVENTORY', 'Code must be ERR_STORE_INVENTORY');
    recordPass('Cửa hàng trạng thái [INVENTORY]: Chặn thanh toán POS với mã lỗi [ERR_STORE_INVENTORY]');

    // Khôi phục trạng thái cửa hàng về OPEN
    await SqlConnection.executeSql("UPDATE store_profile SET status = 'OPEN', updated_at = GETDATE() WHERE id = 1;");
    const checkOpen = await SqlConnection.queryJson("SELECT status FROM store_profile WHERE id = 1;");
    assert.strictEqual(checkOpen[0].status, 'OPEN');
    recordPass('Khôi phục trạng thái cửa hàng LHU Mart về [OPEN] an toàn');

    // -------------------------------------------------------------
    // ĐIỀU KIỆN 2: TRẠNG THÁI KINH DOANH SẢN PHẨM (ERR_PRODUCT_INACTIVE)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 4] ĐIỀU KIỆN 2: TRẠNG THÁI VÒNG ĐỜI KINH DOANH CỦA SẢN PHẨM (ERR_PRODUCT_INACTIVE)');

    // Test 5: Sản phẩm bị vô hiệu hóa is_active = 0
    await SqlConnection.executeSql("UPDATE products SET is_active = 0, updated_at = GETDATE() WHERE id = 2;");
    const resInactive = await request('POST', '/api/sales', {
      items: [{ productId: 2, quantity: 1 }]
    }, cashierToken);
    assert.strictEqual(resInactive.status, 400, 'Inactive product sale must return 400');
    assert.strictEqual(resInactive.body.code, 'ERR_PRODUCT_INACTIVE', 'Code must be ERR_PRODUCT_INACTIVE');
    recordPass('Sản phẩm tạm ngừng kinh doanh (is_active = 0): Chặn xuất bán với [ERR_PRODUCT_INACTIVE]');

    // Khôi phục is_active = 1
    await SqlConnection.executeSql("UPDATE products SET is_active = 1, updated_at = GETDATE() WHERE id = 2;");
    recordPass('Khôi phục trạng thái kinh doanh của sản phẩm ID 2 về is_active = 1');

    // Test 6: Sản phẩm không tồn tại trong hệ thống (ID = 999999)
    const resNotFound = await request('POST', '/api/sales', {
      items: [{ productId: 999999, quantity: 1 }]
    }, cashierToken);
    assert.strictEqual(resNotFound.status, 404, 'Non-existent product sale must return 404');
    recordPass('Sản phẩm không tồn tại (ID 999999): Từ chối xuất bán với HTTP 404');

    // -------------------------------------------------------------
    // ĐIỀU KIỆN 3: RÀNG BUỘC SỐ LƯỢNG MUA (ERR_INVALID_QUANTITY)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 5] ĐIỀU KIỆN 3: RÀNG BUỘC SỐ LƯỢNG MUA LÀ SỐ NGUYÊN DƯƠNG (ERR_INVALID_QUANTITY)');

    // Test 7: Giỏ hàng rỗng
    const resEmptyCart = await request('POST', '/api/sales', { items: [] }, cashierToken);
    assert.strictEqual(resEmptyCart.status, 400);
    assert.strictEqual(resEmptyCart.body.code, 'ERR_INVALID_QUANTITY');
    recordPass('Giỏ hàng rỗng (items = []): Chặn với mã lỗi [ERR_INVALID_QUANTITY]');

    // Test 8: Số lượng bằng 0
    const resZeroQty = await request('POST', '/api/sales', {
      items: [{ productId: 1, quantity: 0 }]
    }, cashierToken);
    assert.strictEqual(resZeroQty.status, 400);
    assert.strictEqual(resZeroQty.body.code, 'ERR_INVALID_QUANTITY');
    recordPass('Số lượng mua bằng 0: Chặn với mã lỗi [ERR_INVALID_QUANTITY]');

    // Test 9: Số lượng âm (qty = -10)
    const resNegQty = await request('POST', '/api/sales', {
      items: [{ productId: 1, quantity: -10 }]
    }, cashierToken);
    assert.strictEqual(resNegQty.status, 400);
    assert.strictEqual(resNegQty.body.code, 'ERR_INVALID_QUANTITY');
    recordPass('Số lượng mua âm (-10): Chặn với mã lỗi [ERR_INVALID_QUANTITY]');

    // Test 10: Số lượng là số thực thập phân không nguyên (qty = 3.5)
    const resFloatQty = await request('POST', '/api/sales', {
      items: [{ productId: 1, quantity: 3.5 }]
    }, cashierToken);
    assert.strictEqual(resFloatQty.status, 400);
    assert.strictEqual(resFloatQty.body.code, 'ERR_INVALID_QUANTITY');
    recordPass('Số lượng mua là số thực lẻ (3.5): Chặn với mã lỗi [ERR_INVALID_QUANTITY]');

    // -------------------------------------------------------------
    // ĐIỀU KIỆN 4: KHÓA CỨNG HÀNG HẾT HẠN RULE 5 (ERR_BATCH_EXPIRED)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 6] ĐIỀU KIỆN 4: EXPIRY WATCHDOG KHÓA CỨNG HÀNG HẾT HẠN (ERR_BATCH_EXPIRED)');

    // Test 11: Sản phẩm có tồn kho nhưng 100% lô đã hết hạn (Product ID 5)
    const resExpiredProduct = await request('POST', '/api/sales', {
      items: [{ productId: 5, quantity: 1 }]
    }, cashierToken);
    assert.strictEqual(resExpiredProduct.status, 400);
    assert.strictEqual(resExpiredProduct.body.code, 'ERR_BATCH_EXPIRED');
    assert.ok(resExpiredProduct.body.message.includes('hết hạn sử dụng'), 'Message must indicate expiry');
    recordPass('Sản phẩm toàn bộ lô đã quá date: Khóa cứng xuất bán POS với [ERR_BATCH_EXPIRED]');

    // Test 12: Quét/chỉ định đích danh mã lô đã hết hạn (LOT-BM-SW-101, batchId = 6)
    const resExpiredBatch = await request('POST', '/api/sales', {
      items: [{ productId: 5, batchId: 6, quantity: 1 }]
    }, cashierToken);
    assert.strictEqual(resExpiredBatch.status, 400);
    assert.strictEqual(resExpiredBatch.body.code, 'ERR_BATCH_EXPIRED');
    recordPass('Chỉ định đích danh lô đã hết hạn (batchId = 6): Khóa cứng xuất bán với [ERR_BATCH_EXPIRED]');

    // -------------------------------------------------------------
    // ĐIỀU KIỆN 5: TỒN KHO KHẢ DỤNG KHÔNG ĐỦ (ERR_INSUFFICIENT_STOCK)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 7] ĐIỀU KIỆN 5: KIỂM SOÁT TỒN KHO KHẢ DỤNG CÒN HẠN (ERR_INSUFFICIENT_STOCK)');

    // Test 13: Mua số lượng vượt quá tổng tồn kho khả dụng còn hạn (qty = 999999)
    const resInsufficient = await request('POST', '/api/sales', {
      items: [{ productId: 1, quantity: 999999 }]
    }, cashierToken);
    assert.strictEqual(resInsufficient.status, 400);
    assert.strictEqual(resInsufficient.body.code, 'ERR_INSUFFICIENT_STOCK');
    assert.ok(resInsufficient.body.details, 'Response must include details object');
    assert.strictEqual(resInsufficient.body.details.requestedQuantity, 999999);
    assert.ok(resInsufficient.body.details.shortfall > 0, 'Shortfall must be positive');
    recordPass('Mua vượt tổng tồn (999999 SP): Trả về [ERR_INSUFFICIENT_STOCK] kèm chi tiết shortfall');

    // -------------------------------------------------------------
    // ĐIỀU KIỆN 6 & 7: CONCURRENCY CONFLICT & ACID ROLLBACK (ERR_CONCURRENCY_CONFLICT)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 8] ĐIỀU KIỆN 6 & 7: BẢO VỆ TRANH CHẤP ĐỒNG THỜI & CHỐNG ÂM KHO (RULE 3)');

    // Test 14: Ràng buộc CHECK chống âm kho ở CSDL
    const checkConstraint = await SqlConnection.queryJson(`
      SELECT cc.name, cc.definition 
      FROM sys.check_constraints cc
      JOIN sys.tables t ON cc.parent_object_id = t.object_id
      WHERE t.name = 'batches' AND cc.definition LIKE '%current_quantity%>=%0%';
    `);
    assert.ok(checkConstraint.length > 0, 'CHECK constraint on current_quantity >= 0 must exist');
    recordPass(`Ràng buộc CHECK chống âm kho tồn tại: ${checkConstraint[0].name} (${checkConstraint[0].definition})`);

    // Test 15: Kiểm tra bắt lỗi THROW 50001 và ném ERR_CONCURRENCY_CONFLICT
    let conflictCaught = false;
    try {
      // Mô phỏng gọi use-case khi lô bị ai đó trừ hết ngay trước thời điểm ghi DB
      const SaleOrder = require('./src/domain/entities/SaleOrder');
      const fakeOrder = new SaleOrder({ cashierId: 5 });
      // Gán 1 lô có số lượng bán lớn hơn tồn hiện tại (mô phỏng tranh chấp)
      fakeOrder.addItem({
        productId: 1,
        batchId: 20,
        batchCode: 'BAT-DC-309927',
        quantitySold: 99999, // Vượt quá tồn kho thực của lô 20
        salePrice: 32000
      });
      const { saleRepository } = require('./src/container');
      await saleRepository.executeFefoCheckoutTransaction({ saleOrder: fakeOrder });
    } catch (err) {
      if (err.code === 'ERR_CONCURRENCY_CONFLICT' || err.message.includes('Tranh chấp tồn kho')) {
        conflictCaught = true;
      }
    }
    assert.strictEqual(conflictCaught, true, 'Concurrency conflict must be detected and mapped to ERR_CONCURRENCY_CONFLICT');
    recordPass('Tranh chấp dòng UPDLOCK: SQL Server ném THROW 50001, map thành công [ERR_CONCURRENCY_CONFLICT]');

    // -------------------------------------------------------------
    // GIAO DỊCH BÁN LẺ POS HỢP LỆ VỚI FEFO & BẺ LÔ SPLIT ORDER
    // -------------------------------------------------------------
    console.log('\n[PHẦN 9] GIAO DỊCH BÁN LẺ POS THÀNH CÔNG (HAPPY PATH FEFO & SPLIT ORDER)');

    // Lấy tồn kho trước khi bán của lô đầu tiên theo FEFO của Product 1
    const beforeBatches = await SqlConnection.queryJson(`
      SELECT TOP 2 id, batch_code, current_quantity, expiry_date 
      FROM batches 
      WHERE product_id = 1 AND current_quantity > 0 AND expiry_date >= CAST(GETDATE() AS DATE) AND status IN ('ACTIVE', 'WARNING')
      ORDER BY expiry_date ASC, id ASC;
    `);
    assert.ok(beforeBatches.length >= 1, 'Must have at least 1 active batch for product 1');
    const firstBatchId = beforeBatches[0].id;
    const initialQty = beforeBatches[0].current_quantity;

    // Test 16: Thực hiện thanh toán hợp lệ 2 sản phẩm ID 1
    const resValidSale = await request('POST', '/api/sales', {
      items: [{ productId: 1, quantity: 2 }],
      weather: 'SUNNY',
      isHoliday: false
    }, cashierToken);

    assert.strictEqual(resValidSale.status, 201, 'Valid sale must return 201 Created');
    assert.strictEqual(resValidSale.body.success, true);
    assert.ok(resValidSale.body.transactionCode.startsWith('TXN-POS-'), 'Transaction code must start with TXN-POS-');
    assert.strictEqual(resValidSale.body.totalQuantity, 2, 'Total quantity must be 2');
    recordPass(`Thanh toán POS thành công đơn [${resValidSale.body.transactionCode}], tổng tiền: ${resValidSale.body.totalAmount.toLocaleString('vi-VN')} đ`);

    // Test 17: Kiểm tra số lượng tồn kho giảm chính xác trên lô FEFO gần nhất
    const afterBatches = await SqlConnection.queryJson(`
      SELECT current_quantity FROM batches WHERE id = ${firstBatchId};
    `);
    const expectedRemaining = Math.max(0, initialQty - 2);
    assert.strictEqual(afterBatches[0].current_quantity, expectedRemaining, 'Stock must be correctly deducted by FEFO');
    recordPass(`Trừ kho chuẩn FEFO lô [${beforeBatches[0].batch_code}]: Tồn kho giảm từ ${initialQty} -> ${afterBatches[0].current_quantity}`);

    // Test 18: Kiểm tra lịch sử bán hàng được ghi nhận trong sales_history
    const salesRecord = await SqlConnection.queryJson(`
      SELECT transaction_code, product_id, batch_id, quantity_sold, weather, is_holiday 
      FROM sales_history 
      WHERE transaction_code = '${resValidSale.body.transactionCode}';
    `);
    assert.ok(salesRecord.length > 0, 'Sales history record must be created');
    const totalQtySold = salesRecord.reduce((sum, r) => sum + r.quantity_sold, 0);
    assert.strictEqual(totalQtySold, 2, 'Total quantity sold in sales_history must be 2');
    assert.strictEqual(salesRecord[0].weather, 'SUNNY');
    assert.strictEqual(Boolean(salesRecord[0].is_holiday), false);
    recordPass('Bản ghi sales_history được tạo chính xác với đầy đủ ngữ cảnh thời tiết và ngày lễ');

    // Test 19: Kiểm tra nhật ký kiểm toán bất biến (Rule 11)
    const auditRecord = await SqlConnection.queryJson(`
      SELECT TOP 1 action_type, entity_name, entity_id, description 
      FROM system_audit_logs 
      WHERE entity_id = '${resValidSale.body.transactionCode}'
      ORDER BY id DESC;
    `);
    assert.ok(auditRecord.length > 0, 'Audit log must be recorded');
    assert.strictEqual(auditRecord[0].action_type, 'POS_CHECKOUT');
    recordPass(`Nhật ký kiểm toán system_audit_logs ghi nhận hành vi [${auditRecord[0].action_type}] cho đơn ${auditRecord[0].entity_id}`);

    // -------------------------------------------------------------
    // TỔNG KẾT BỘ KIỂM THỬ
    // -------------------------------------------------------------
    console.log('\n' + '='.repeat(85));
    console.log(`🎉 TEST SUITE STEP 12 HOÀN TẤT THÀNH CÔNG: ${passed} / ${passed + failed} TEST CASES PASSED (100%)`);
    console.log('='.repeat(85));

  } catch (err) {
    recordFail('Lỗi ngoại lệ không mong muốn trong Test Suite Step 12', err);
    console.error(err);
  } finally {
    // Đảm bảo cửa hàng luôn được khôi phục về trạng thái OPEN
    try {
      await SqlConnection.executeSql("UPDATE store_profile SET status = 'OPEN', updated_at = GETDATE() WHERE id = 1;");
      await SqlConnection.executeSql("UPDATE products SET is_active = 1 WHERE id = 2;");
    } catch (e) {}
  }
}

runStep12SalesValidationTests();
