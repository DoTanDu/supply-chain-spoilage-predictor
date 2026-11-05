// Backend/test_step10_pos_fefo_alignment.js
/**
 * TEST SUITE: MỤC 8 - CHỨC NĂNG BÁN LẺ POS THEO NGUYÊN TẮC FEFO & CHỐNG TỒN KHO ÂM
 * Quy chuẩn: Clean Architecture, SSOT 11 Core Business Rules, SoD 4 Actor & AI Context
 */
const http = require('http');
const assert = require('assert');
const SqlConnection = require('./src/infrastructure/database/sqlConnection');
const FefoAllocationPolicy = require('./src/domain/services/FefoAllocationPolicy');

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

async function runStep10PosFefoTests() {
  console.log('='.repeat(80));
  console.log('🛒 TEST SUITE STEP 10: POS CHECKOUT FEFO & CONCURRENCY ALIGNMENT');
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

  // Tokens
  let cashierToken = null;
  let managerToken = null;
  let warehouseToken = null;

  try {
    // =========================================================================
    // KHỐI 1: THUẬT TOÁN DOMAIN FEFO ALLOCATION POLICY (RULE 2 & MÃ GIẢ MỤC 8.2)
    // =========================================================================
    console.log('\n--- KHỐI 1: DOMAIN SERVICE - THUẬT TOÁN BẺ ĐƠN FEFO (FefoAllocationPolicy) ---');

    // 1.1 Phân bổ 1 lô đơn lẻ khi lượng mua <= tồn kho lô cận date nhất
    try {
      const mockBatches = [
        { id: 101, batchCode: 'LOT-01', expiryDate: new Date('2026-11-10'), currentQuantity: 10, discountPercent: 0 },
        { id: 102, batchCode: 'LOT-02', expiryDate: new Date('2026-11-20'), currentQuantity: 20, discountPercent: 0 }
      ];
      const alloc1 = FefoAllocationPolicy.allocate({
        productId: 1,
        productName: 'Sữa tươi',
        requestedQuantity: 5,
        sellingPrice: 10000,
        availableBatches: mockBatches
      });
      assert.strictEqual(alloc1.allocations.length, 1);
      assert.strictEqual(alloc1.allocations[0].batchId, 101);
      assert.strictEqual(alloc1.allocations[0].quantityAllocated, 5);
      assert.strictEqual(alloc1.isSplitOrder, false);
      assert.strictEqual(alloc1.totalAmount, 50000);
      recordPass('Phân bổ đơn hàng từ 1 lô cận date nhất khi lượng mua <= tồn kho');
    } catch (e) { recordFail('Phân bổ đơn hàng từ 1 lô', e); }

    // 1.2 Bẻ nhỏ đơn hàng qua 2 lô (Split Order Scenario)
    try {
      const mockBatches = [
        { id: 101, batchCode: 'LOT-01', expiryDate: new Date('2026-11-10'), currentQuantity: 3, discountPercent: 30 },
        { id: 102, batchCode: 'LOT-02', expiryDate: new Date('2026-11-20'), currentQuantity: 10, discountPercent: 0 }
      ];
      const alloc2 = FefoAllocationPolicy.allocate({
        productId: 1,
        productName: 'Sữa tươi',
        requestedQuantity: 5,
        sellingPrice: 10000,
        availableBatches: mockBatches
      });
      assert.strictEqual(alloc2.allocations.length, 2);
      assert.strictEqual(alloc2.isSplitOrder, true);
      assert.strictEqual(alloc2.allocations[0].batchId, 101);
      assert.strictEqual(alloc2.allocations[0].quantityAllocated, 3);
      assert.strictEqual(alloc2.allocations[0].unitPrice, 7000); // Giảm 30%
      assert.strictEqual(alloc2.allocations[0].lineTotal, 21000);
      assert.strictEqual(alloc2.allocations[1].batchId, 102);
      assert.strictEqual(alloc2.allocations[1].quantityAllocated, 2);
      assert.strictEqual(alloc2.allocations[1].unitPrice, 10000); // Nguyên giá
      assert.strictEqual(alloc2.allocations[1].lineTotal, 20000);
      assert.strictEqual(alloc2.totalAmount, 41000); // 21k + 20k
      recordPass('Tự động bẻ đơn hàng qua nhiều lô (Split Order) và tính đúng giá Quick Markdown');
    } catch (e) { recordFail('Tự động bẻ đơn qua nhiều lô', e); }

    // 1.3 Tự động loại bỏ các lô đã hết hạn (DaysLeft <= 0 hoặc EXPIRED)
    try {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const mockBatchesExpired = [
        { id: 201, batchCode: 'LOT-EXP', expiryDate: pastDate, currentQuantity: 10, discountPercent: 50 },
        { id: 202, batchCode: 'LOT-OK', expiryDate: futureDate, currentQuantity: 5, discountPercent: 0 }
      ];
      const alloc3 = FefoAllocationPolicy.allocate({
        productId: 1,
        productName: 'Sữa tươi',
        requestedQuantity: 3,
        sellingPrice: 10000,
        availableBatches: mockBatchesExpired
      });
      assert.strictEqual(alloc3.allocations.length, 1);
      assert.strictEqual(alloc3.allocations[0].batchId, 202); // Bỏ qua LOT-EXP
      recordPass('Tự động loại bỏ các lô hết hạn (DaysLeft <= 0), không xuất bán (Rule 5 SSOT)');
    } catch (e) { recordFail('Bỏ qua lô hết hạn', e); }

    // 1.4 Ném lỗi InsufficientStockError khi tồn kho không đủ
    try {
      let threw = false;
      try {
        FefoAllocationPolicy.allocate({
          productId: 1,
          productName: 'Bánh mì',
          requestedQuantity: 50,
          sellingPrice: 15000,
          availableBatches: [
            { id: 301, batchCode: 'LOT-BM', expiryDate: new Date('2026-11-15'), currentQuantity: 10, discountPercent: 0 }
          ]
        });
      } catch (err) {
        threw = true;
        assert(err.message.includes('Không đủ tồn kho khả dụng'));
      }
      assert(threw, 'Phải ném ngoại lệ khi mua vượt số lượng khả dụng');
      recordPass('Ném ngoại lệ InsufficientStockError chuẩn xác khi vượt tồn kho khả dụng');
    } catch (e) { recordFail('Ném ngoại lệ InsufficientStockError', e); }

    // 1.5 Ném lỗi khi số lượng mua <= 0
    try {
      let threw = false;
      try {
        FefoAllocationPolicy.allocate({
          productId: 1,
          requestedQuantity: 0,
          sellingPrice: 10000,
          availableBatches: []
        });
      } catch (err) {
        threw = true;
        assert(err.message.includes('không hợp lệ'));
      }
      assert(threw);
      recordPass('Chặn số lượng mua <= 0 hoặc NaN ở tầng Domain');
    } catch (e) { recordFail('Chặn số lượng <= 0', e); }

    // =========================================================================
    // KHỐI 2: ĐĂNG NHẬP & PHÂN QUYỀN 4 ACTOR (SOD MATRIX MỤC 8.7)
    // =========================================================================
    console.log('\n--- KHỐI 2: XÁC THỰC & MA TRẬN PHÂN QUYỀN SOD QUẦY POS (Mục 8.7) ---');

    // 2.1 Đăng nhập Thu ngân (CASHIER)
    try {
      const res = await request('POST', '/api/auth/login', { username: 'cashier', password: 'Password123@' });
      assert.strictEqual(res.status, 200);
      cashierToken = res.body.data.token;
      assert(cashierToken);
      recordPass('Thu ngân (CASHIER) đăng nhập thành công và nhận JWT Token');
    } catch (e) { recordFail('Thu ngân đăng nhập', e); }

    // 2.2 Đăng nhập Cửa hàng trưởng (STORE_MANAGER)
    try {
      const res = await request('POST', '/api/auth/login', { username: 'manager', password: 'Password123@' });
      assert.strictEqual(res.status, 200);
      managerToken = res.body.data.token;
      assert(managerToken);
      recordPass('Cửa hàng trưởng (STORE_MANAGER) đăng nhập thành công');
    } catch (e) { recordFail('Cửa hàng trưởng đăng nhập', e); }

    // 2.3 Đăng nhập Nhân viên kho (WAREHOUSE_STAFF)
    try {
      const res = await request('POST', '/api/auth/login', { username: 'warehouse', password: 'Password123@' });
      assert.strictEqual(res.status, 200);
      warehouseToken = res.body.data.token;
      assert(warehouseToken);
      recordPass('Nhân viên kho (WAREHOUSE_STAFF) đăng nhập thành công');
    } catch (e) { recordFail('Nhân viên kho đăng nhập', e); }

    // 2.4 Chặn xuất bán khi không có Token (HTTP 401)
    try {
      const res = await request('POST', '/api/sales', { items: [{ productId: 1, quantity: 1 }] });
      assert.strictEqual(res.status, 401);
      recordPass('Chặn truy cập xuất bán POS khi không có Bearer Token (HTTP 401)');
    } catch (e) { recordFail('Chặn không có token', e); }

    // 2.5 Chặn Nhân viên kho xuất bán POS (SoD Matrix: HTTP 403 Forbidden)
    try {
      const res = await request('POST', '/api/sales', { items: [{ productId: 1, quantity: 1 }] }, warehouseToken);
      assert.strictEqual(res.status, 403);
      recordPass('Chặn Nhân viên kho (WAREHOUSE_STAFF) xuất bán POS (HTTP 403 - SoD Matrix)');
    } catch (e) { recordFail('Chặn thủ kho bán POS', e); }

    // =========================================================================
    // KHỐI 3: BẢO VỆ TRẠNG THÁI CỬA HÀNG (STORE PROFILE GUARD - RULE 1 & MỤC 10)
    // =========================================================================
    console.log('\n--- KHỐI 3: BẢO VỆ TRẠNG THÁI CỬA HÀNG (Store Profile Guard) ---');

    // 3.1 Khóa quầy POS khi cửa hàng đóng ca đêm (CLOSED)
    try {
      await request('PUT', '/api/store-profile', { status: 'CLOSED' }, managerToken);
      const res = await request('POST', '/api/sales', { items: [{ productId: 1, quantity: 1 }] }, cashierToken);
      assert.strictEqual(res.status, 400);
      assert(res.body.message.includes('CLOSED') || res.body.message.includes('Cửa hàng hiện đang'));
      recordPass('Khóa xuất bán POS khi Cửa hàng ở trạng thái Đóng ca đêm [CLOSED] (HTTP 400)');
    } catch (e) { recordFail('Khóa POS khi CLOSED', e); }

    // 3.2 Khóa quầy POS khi cửa hàng kiểm kê kho (INVENTORY)
    try {
      await request('PUT', '/api/store-profile', { status: 'INVENTORY' }, managerToken);
      const res = await request('POST', '/api/sales', { items: [{ productId: 1, quantity: 1 }] }, cashierToken);
      assert.strictEqual(res.status, 400);
      assert(res.body.message.includes('INVENTORY') || res.body.message.includes('kiểm kê'));
      recordPass('Khóa xuất bán POS khi Cửa hàng ở trạng thái Kiểm kê kho [INVENTORY] (HTTP 400)');
    } catch (e) { recordFail('Khóa POS khi INVENTORY', e); }

    // 3.3 Mở lại cửa hàng (OPEN) phục vụ bán lẻ
    try {
      const res = await request('PUT', '/api/store-profile', { status: 'OPEN' }, managerToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.status, 'OPEN');
      recordPass('Mở lại Cửa hàng hoạt động bình thường [OPEN] (HTTP 200)');
    } catch (e) { recordFail('Mở lại cửa hàng OPEN', e); }

    // =========================================================================
    // KHỐI 4: GIAO DỊCH BÁN LẺ POS THỰC TẾ & BẺ LÔ THEO FEFO (RULE 2)
    // =========================================================================
    console.log('\n--- KHỐI 4: GIAO DỊCH BÁN LẺ POS & BẺ LÔ TRỰC TIẾP TRONG CSDL ---');

    let savedTxnCode = null;
    let preBatches = null;

    // 4.1 Lấy danh sách lô khả dụng của sản phẩm ID 1 trước khi xuất bán
    try {
      const sql = `
        SELECT id, batch_code, current_quantity, expiry_date, discount_percent 
        FROM batches 
        WHERE product_id = 1 AND current_quantity > 0 AND status IN ('ACTIVE', 'WARNING')
        ORDER BY expiry_date ASC, id ASC;
      `;
      preBatches = await SqlConnection.queryJson(sql);
      assert(Array.isArray(preBatches) && preBatches.length > 0, 'Phải có ít nhất 1 lô khả dụng cho sản phẩm 1');
      recordPass(`Sản phẩm ID 1 có ${preBatches.length} lô khả dụng theo chuẩn FEFO`);
    } catch (e) { recordFail('Lấy danh sách lô ID 1', e); }

    // 4.2 Thực hiện giao dịch bán lẻ POS với ngữ cảnh thời tiết AI (weather = RAINY, isHoliday = true)
    try {
      const salePayload = {
        items: [
          { productId: 1, quantity: 2 }
        ],
        weather: 'RAINY',
        isHoliday: true
      };
      const res = await request('POST', '/api/sales', salePayload, cashierToken);
      assert.strictEqual(res.status, 201);
      assert(res.body.success, 'Giao dịch POS phải thành công');
      savedTxnCode = res.body.transactionCode;
      assert(savedTxnCode && savedTxnCode.startsWith('TXN-POS-'), 'Mã hóa đơn phải có tiền tố TXN-POS-');
      assert.strictEqual(res.body.weather, 'RAINY');
      assert.strictEqual(res.body.isHoliday, true);
      assert(res.body.fefoDetails && res.body.fefoDetails.length >= 1);
      recordPass(`Giao dịch POS thành công: Mã HĐ [${savedTxnCode}], ghi nhận đúng cờ Thời tiết RAINY & Ngày lễ`);
    } catch (e) { recordFail('Giao dịch POS RAINY', e); }

    // 4.3 Kiểm tra trừ kho current_quantity đúng lô cận date nhất trong CSDL
    try {
      const targetBatchId = preBatches[0].id;
      const checkSql = `SELECT current_quantity FROM batches WHERE id = ${targetBatchId};`;
      const postBatch = await SqlConnection.queryJson(checkSql);
      const expectedQty = preBatches[0].current_quantity - 2;
      assert.strictEqual(postBatch[0].current_quantity, expectedQty);
      recordPass(`Lô cận date nhất (#${targetBatchId}) đã bị trừ chính xác 2 đơn vị (Còn lại: ${expectedQty})`);
    } catch (e) { recordFail('Trừ kho lô cận date', e); }

    // 4.4 Kiểm tra bản ghi trong bảng sales_history
    try {
      const sql = `SELECT * FROM sales_history WHERE transaction_code = N'${savedTxnCode}';`;
      const rows = await SqlConnection.queryJson(sql);
      assert.strictEqual(rows.length, 1);
      assert.strictEqual(rows[0].product_id, 1);
      assert.strictEqual(rows[0].batch_id, preBatches[0].id);
      assert.strictEqual(rows[0].quantity_sold, 2);
      assert.strictEqual(rows[0].weather, 'RAINY');
      assert.strictEqual(Boolean(rows[0].is_holiday), true);
      assert(rows[0].total_amount > 0);
      recordPass('Bản ghi sales_history lưu trữ đầy đủ biến ngoại cảnh (weather, is_holiday, day_of_week) cho AI 1');
    } catch (e) { recordFail('Kiểm tra sales_history', e); }

    // 4.5 Kiểm tra Audit Log đã ghi vết nghiệp vụ POS
    try {
      const sql = `SELECT TOP 1 * FROM system_audit_logs WHERE action_type IN ('POS_CHECKOUT', 'POS_CHECKOUT_FEFO') ORDER BY id DESC;`;
      const logs = await SqlConnection.queryJson(sql);
      assert(logs.length > 0);
      assert(logs[0].entity_id === savedTxnCode || logs[0].description.includes(savedTxnCode));
      recordPass('Nhật ký kiểm toán AuditLog ghi nhận hành vi POS_CHECKOUT bất biến (Rule 11 SSOT)');
    } catch (e) { recordFail('Kiểm tra AuditLog POS', e); }

    // =========================================================================
    // KHỐI 5: TRA CỨU HÓA ĐƠN & QUY CHUẨN BIÊN LAI K80 (MỤC 8.8)
    // =========================================================================
    console.log('\n--- KHỐI 5: API LỊCH SỬ BÁN LẺ & TRUY VẤN BIÊN LAI K80 (Mục 8.8) ---');

    // 5.1 Tra cứu danh sách lịch sử bán hàng
    try {
      const res = await request('GET', '/api/sales/history?limit=10', null, cashierToken);
      assert.strictEqual(res.status, 200);
      assert(res.body.success);
      assert(Array.isArray(res.body.data) && res.body.data.length > 0);
      assert(res.body.todaySummary && res.body.todaySummary.todayTransactionsCount >= 1);
      recordPass('API /api/sales/history trả về danh sách hóa đơn và tổng kết doanh số hôm nay');
    } catch (e) { recordFail('Lấy lịch sử bán hàng', e); }

    // 5.2 Tra cứu chi tiết hóa đơn theo mã giao dịch
    try {
      const res = await request('GET', `/api/sales/receipt/${savedTxnCode}`, null, cashierToken);
      assert.strictEqual(res.status, 200);
      assert(res.body.success);
      const data = res.body.data;
      assert.strictEqual(data.transactionCode, savedTxnCode);
      assert(data.lines && data.lines.length >= 1);
      assert(data.store && data.store.storeCode === 'RETAIL-STORE-01');
      assert.strictEqual(data.weather, 'RAINY');
      recordPass(`API /api/sales/receipt/${savedTxnCode} trả về đầy đủ định dạng biên lai K80 chi tiết`);
    } catch (e) { recordFail('Lấy chi tiết biên lai', e); }

    // 5.3 Tra cứu hóa đơn không tồn tại trả về 404
    try {
      const res = await request('GET', '/api/sales/receipt/TXN-NONEXISTENT-999', null, cashierToken);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      recordPass('Tra cứu hóa đơn không tồn tại trả về đúng mã lỗi HTTP 404');
    } catch (e) { recordFail('Tra cứu HĐ không tồn tại', e); }

    // =========================================================================
    // KHỐI 6: KIỂM SOÁT TRANH CHẤP ĐỒNG THỜI (CONCURRENCY CONTROL - RULE 3)
    // =========================================================================
    console.log('\n--- KHỐI 6: KIỂM SOÁT TRANH CHẤP ĐỒNG THỜI (CONCURRENCY CONTROL - RULE 3) ---');

    try {
      // Tạo một sản phẩm thử nghiệm riêng
      const tempSku = `SKU-CC-${Date.now().toString().slice(-4)}`;
      const createProdSql = `
        INSERT INTO products (
          sku, name, normalized_name, category_id, default_supplier_id, unit,
          cost_price, selling_price, standard_shelf_life_days, min_stock_level,
          max_stock_level, is_active
        )
        VALUES (
          N'${tempSku}', N'Sản phẩm Concurrency Test', N'san pham concurrency test',
          1, 1, N'Hộp', 20000, 30000, 30, 5, 20, 1
        );
      `;
      await SqlConnection.executeSql(createProdSql);
      const prodRows = await SqlConnection.queryJson(`SELECT id FROM products WHERE sku = N'${tempSku}';`);
      const tempProdId = prodRows[0].id;
      assert(tempProdId, 'Tạo sản phẩm thử nghiệm concurrency thành công');

      // Tạo một lô hàng thử nghiệm độc lập có tồn kho đúng 5 cái
      const tempBatchCode = `LOT-CC-${Date.now().toString().slice(-4)}`;
      const createBatchSql = `
        INSERT INTO batches (
          batch_code, product_id, import_date, manufacture_date, expiry_date,
          initial_quantity, current_quantity, import_price, discount_percent,
          is_shelf_rotated, status, created_at
        )
        VALUES (
          N'${tempBatchCode}', ${tempProdId}, CAST(GETDATE() AS DATE),
          DATEADD(day, -5, CAST(GETDATE() AS DATE)),
          DATEADD(day, 20, CAST(GETDATE() AS DATE)),
          5, 5, 20000, 0, 0, 'ACTIVE', GETDATE()
        );
      `;
      await SqlConnection.executeSql(createBatchSql);
      const batchRows = await SqlConnection.queryJson(`SELECT id FROM batches WHERE batch_code = N'${tempBatchCode}';`);
      const tempBatchId = batchRows[0].id;
      assert(tempBatchId, 'Tạo lô thử nghiệm concurrency thành công');

      // Bắn 2 request đồng thời qua Promise.all, mỗi request mua 4 cái
      // Tổng tồn chỉ có 5: Chỉ duy nhất 1 request được thành công, request kia phải bị từ chối 400!
      const req1Promise = request('POST', '/api/sales', {
        items: [{ productId: tempProdId, quantity: 4 }],
        weather: 'SUNNY'
      }, cashierToken);

      const req2Promise = request('POST', '/api/sales', {
        items: [{ productId: tempProdId, quantity: 4 }],
        weather: 'SUNNY'
      }, cashierToken);

      const [res1, res2] = await Promise.all([req1Promise, req2Promise]);

      const successCount = (res1.status === 201 ? 1 : 0) + (res2.status === 201 ? 1 : 0);
      const failCount = ((res1.status === 400 || res1.status === 409) ? 1 : 0) + ((res2.status === 400 || res2.status === 409) ? 1 : 0);

      assert.strictEqual(successCount, 1, 'Chỉ đúng 1 giao dịch được thành công (HTTP 201)');
      assert.strictEqual(failCount, 1, 'Giao dịch đồng thời thứ hai phải bị từ chối (HTTP 400 hoặc 409)');

      // Kiểm tra tồn kho cuối cùng: Bắt buộc là 1 (5 - 4 = 1), tuyệt đối không bị âm!
      const finalBatch = await SqlConnection.queryJson(`SELECT current_quantity FROM batches WHERE id = ${tempBatchId};`);
      assert.strictEqual(finalBatch[0].current_quantity, 1, 'Tồn kho cuối cùng phải là 1, không bị âm kho');

      // Dọn dẹp dữ liệu kiểm thử
      await SqlConnection.executeSql(`DELETE FROM sales_history WHERE product_id = ${tempProdId};`);
      await SqlConnection.executeSql(`DELETE FROM batches WHERE id = ${tempBatchId};`);
      await SqlConnection.executeSql(`DELETE FROM products WHERE id = ${tempProdId};`);

      recordPass('Kiểm soát tranh chấp đồng thời (UPDLOCK, ROWLOCK): 2 request cùng mua 4/5 chỉ 1 được duyệt, kho còn 1 không bị âm (Rule 3 SSOT)');
    } catch (e) { recordFail('Kiểm soát tranh chấp đồng thời', e); }

  } catch (globalErr) {
    console.error('Lỗi nghiêm trọng trong quá trình chạy test:', globalErr);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`🏁 KẾT QUẢ KIỂM THỬ STEP 10: POS CHECKOUT FEFO & CONCURRENCY ALIGNMENT:`);
  console.log(`   Tổng số Test Cases: ${passed + failed}`);
  console.log(`   Số test PASSED:     ${passed} / ${passed + failed} (${Math.round((passed / (passed + failed || 1)) * 100)}%)`);
  console.log(`   Số test FAILED:     ${failed}`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStep10PosFefoTests();
