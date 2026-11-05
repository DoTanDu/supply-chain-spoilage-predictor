// test_step8_catalog_fmcg_alignment.js
// Kịch bản Kiểm thử Tự động Giai đoạn 5: Chuẩn hóa Danh mục Ngành hàng FMCG & Sản phẩm (Mục 6 SSOT)
// Tuân thủ 11 Quy tắc Nghiệp vụ Cốt lõi (Rule 4, Rule 9, Rule 11 & Batch Integrity & SoD)

const API_BASE = 'http://localhost:5000/api';

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (err) {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, body: json };
}

async function runCatalogFmcgAlignmentTests() {
  console.log('================================================================================');
  console.log('🚀 KIỂM THỬ GIAI ĐOẠN 5: ĐỒNG BỘ 7 NGÀNH HÀNG FMCG, RULE 9 & BATCH INTEGRITY');
  console.log('================================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  try {
    // ---------------------------------------------------------
    // BƯỚC 0: ĐĂNG NHẬP XÁC THỰC CÁC VAI TRÒ
    // ---------------------------------------------------------
    console.log('--- PHẦN 0: XÁC THỰC DANH TÍNH 4 VAI TRÒ ---');
    const adminLogin = await request('POST', '/auth/login', { username: 'admin', password: 'Password123@' });
    assert(adminLogin.status === 200 && adminLogin.body?.data?.token, 'Đăng nhập vai trò Quản trị viên (ADMIN) thành công');
    const adminToken = adminLogin.body?.data?.token;

    const managerLogin = await request('POST', '/auth/login', { username: 'manager', password: 'Password123@' });
    assert(managerLogin.status === 200 && managerLogin.body?.data?.token, 'Đăng nhập vai trò Cửa hàng trưởng (STORE_MANAGER) thành công');
    const managerToken = managerLogin.body?.data?.token;

    const cashierLogin = await request('POST', '/auth/login', { username: 'cashier', password: 'Password123@' });
    assert(cashierLogin.status === 200 && cashierLogin.body?.data?.token, 'Đăng nhập vai trò Thu ngân POS (CASHIER) thành công');
    const cashierToken = cashierLogin.body?.data?.token;

    const whLogin = await request('POST', '/auth/login', { username: 'warehouse', password: 'Password123@' });
    assert(whLogin.status === 200 && whLogin.body?.data?.token, 'Đăng nhập vai trò Nhân viên kho (WAREHOUSE_STAFF) thành công');
    const whToken = whLogin.body?.data?.token;

    // ---------------------------------------------------------
    // TEST 1: TRUY VẤN DANH MỤC 7 NGÀNH HÀNG FMCG CHUẨN
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 1: TRUY VẤN GET /api/categories ĐỦ 7 NHÓM NGÀNH FMCG CHUẨN ---');
    const getCatsRes = await request('GET', '/categories');
    assert(getCatsRes.status === 200 && getCatsRes.body?.success, 'Truy vấn GET /api/categories thành công (HTTP 200)');
    const categories = getCatsRes.body?.data;
    assert(Array.isArray(categories) && categories.length >= 7, `Hệ thống trả về đủ ${categories?.length} danh mục ngành hàng (chuẩn >= 7 nhóm)`);

    const expectedCodes = ['DAIRY', 'BAKERY', 'BEVERAGE', 'DRY_FOOD', 'PROCESSED_MEAT', 'MEAT_POULTRY', 'FRESH_PRODUCE'];
    const actualCodes = categories.map(c => c.code);
    const hasAll7Codes = expectedCodes.every(code => actualCodes.includes(code));
    assert(hasAll7Codes, `Bao phủ đầy đủ 7 mã ngành FMCG chuẩn mực: [${expectedCodes.join(', ')}]`);

    const firstCat = categories.find(c => c.code === 'DAIRY');
    assert(firstCat && firstCat.storageTemperature?.includes('Mát'), `Ngành hàng DAIRY có cấu hình nhiệt độ bảo quản chuẩn: [${firstCat?.storageTemperature}]`);
    assert(Number(firstCat?.defaultWarningDays) === 7, `Ngành hàng DAIRY có ngưỡng cảnh báo date mặc định = ${firstCat?.defaultWarningDays} ngày (Rule 4 SSOT)`);

    // ---------------------------------------------------------
    // TEST 2: THÊM MỚI, CẬP NHẬT & XÓA AN TOÀN NGÀNH HÀNG TẠM THỜI
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 2: CRUD NGÀNH HÀNG FMCG HỢP LỆ & GHI NHẬN AUDIT LOGS ---');
    const tempCatCode = `CAT_TEST_${Date.now().toString().slice(-4)}`;
    const createCatRes = await request('POST', '/categories', {
      code: tempCatCode,
      name: `Ngành hàng Thử nghiệm ${tempCatCode}`,
      storageTemperature: 'Mát (8 - 12°C)',
      defaultWarningDays: 4,
      description: 'Ngành hàng kiểm thử tự động Giai đoạn 5'
    }, managerToken);
    assert(createCatRes.status === 201 && createCatRes.body?.success, `STORE_MANAGER tạo mới ngành hàng [${tempCatCode}] thành công (HTTP 201)`);
    const createdCatId = createCatRes.body?.data?.id;

    // Cập nhật ngành hàng vừa tạo
    const updateCatRes = await request('PUT', `/categories/${createdCatId}`, {
      name: `Ngành hàng Đã đổi tên ${tempCatCode}`,
      defaultWarningDays: 5
    }, managerToken);
    assert(updateCatRes.status === 200 && updateCatRes.body?.data?.defaultWarningDays === 5,
      `Cập nhật ngành hàng #${createdCatId} thành công (ngưỡng cảnh báo mới = 5 ngày)`);

    // Xóa an toàn ngành hàng vừa tạo (chưa có sản phẩm)
    const deleteCatRes = await request('DELETE', `/categories/${createdCatId}`, null, managerToken);
    assert(deleteCatRes.status === 200 && deleteCatRes.body?.success,
      `Xóa an toàn ngành hàng rỗng #${createdCatId} thành công (HTTP 200)`);

    // ---------------------------------------------------------
    // TEST 3: CHẶN XÓA NGÀNH HÀNG CÓ SẢN PHẨM LƯU HÀNH (FK PROTECTION)
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 3: BẢO VỆ TOÀN VẸN KHÓA NGOẠI (FOREIGN KEY PROTECTION) ---');
    const blockedDeleteCat = await request('DELETE', '/categories/1', null, managerToken);
    assert(
      blockedDeleteCat.status >= 400 &&
      (blockedDeleteCat.body?.message?.includes('sản phẩm') || blockedDeleteCat.body?.message?.includes('Không thể xóa')),
      'Chặn xóa ngành hàng ID 1 (DAIRY) vì đang có sản phẩm liên kết (Bảo vệ toàn vẹn khóa ngoại)'
    );

    // ---------------------------------------------------------
    // TEST 4: CHẶN TẠO SẢN PHẨM BỊ TRÙNG MÃ SKU (RULE 9 SSOT)
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 4: THUẬT TOÁN CHỐNG TRÙNG LẶP SẢN PHẨM (RULE 9 SSOT) ---');
    // Lấy 1 sản phẩm mẫu có sẵn
    const prodsRes = await request('GET', '/catalog/products');
    const existingProd = prodsRes.body?.data?.[0];
    assert(existingProd && existingProd.sku, `Lấy mẫu sản phẩm hiện có: [${existingProd?.name}] (SKU: ${existingProd?.sku})`);

    const dupSkuRes = await request('POST', '/catalog/products', {
      sku: existingProd.sku,
      name: 'Sản phẩm thử nghiệm trùng SKU',
      categoryId: 1,
      costPrice: 20000,
      sellingPrice: 30000,
      standardShelfLifeDays: 90
    }, managerToken);
    assert(
      dupSkuRes.status >= 400 &&
      (dupSkuRes.body?.message?.includes('Trùng mã SKU') || dupSkuRes.body?.message?.includes('trùng')),
      `Hệ thống chặn thành công hành vi tạo sản phẩm bị trùng SKU: [${existingProd.sku}] (Rule 9 SSOT)`
    );

    // ---------------------------------------------------------
    // TEST 5: CHẶN TẠO SẢN PHẨM CÓ TÊN TƯƠNG ĐỒNG >= 85% (LEVENSHTEIN)
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 5: CHẶN TÊN TƯƠNG ĐỒNG >= 85% (LEVENSHTEIN SIMILARITY) ---');
    // Đổi 1-2 ký tự nhỏ trên tên sản phẩm hiện có để độ tương đồng > 85%
    const similarName = existingProd.name + ' '; // Tên gần như y hệt
    const uniqueSku = `SKU-SIM-${Date.now().toString().slice(-4)}`;
    const dupNameRes = await request('POST', '/catalog/products', {
      sku: uniqueSku,
      name: similarName,
      categoryId: 1,
      costPrice: 20000,
      sellingPrice: 30000,
      standardShelfLifeDays: 90
    }, managerToken);
    assert(
      dupNameRes.status >= 400 &&
      (dupNameRes.body?.message?.includes('tương đồng') || dupNameRes.body?.message?.includes('Trùng tên')),
      `Hệ thống chặn thành công sản phẩm có tên tương đồng >= 85% với: "${existingProd.name}" (Rule 9 SSOT)`
    );

    // ---------------------------------------------------------
    // TEST 6: BẢO VỆ TOÀN VẸN LÔ HÀNG (BATCH INTEGRITY PROTECTION - MỤC 6 SSOT)
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 6: BẢO VỆ TOÀN VẸN LÔ HÀNG KHI NGỪNG KINH DOANH (BATCH INTEGRITY) ---');
    // Thử 6.1: Xóa sản phẩm ID 1 (đang có lô hàng khả dụng còn hạn) -> Kỳ vọng BỊ CHẶN LỖI 400
    const blockedDeleteProd = await request('DELETE', `/catalog/products/${existingProd.id}`, null, managerToken);
    assert(
      blockedDeleteProd.status === 400 &&
      blockedDeleteProd.body?.message?.includes('Vi phạm Toàn vẹn Lô hàng') &&
      blockedDeleteProd.body?.message?.includes('tồn kho khả dụng'),
      `Chặn ngừng kinh doanh (DELETE) sản phẩm ID ${existingProd.id} vì vẫn còn hàng tồn khả dụng trong kho (Mục 6 SSOT)`
    );

    // Thử 6.2: Cập nhật isActive = false cho sản phẩm ID 1 -> Kỳ vọng BỊ CHẶN LỖI 400
    const blockedUpdateActive = await request('PUT', `/catalog/products/${existingProd.id}`, {
      isActive: false
    }, managerToken);
    assert(
      blockedUpdateActive.status === 400 &&
      blockedUpdateActive.body?.message?.includes('Vi phạm Toàn vẹn Lô hàng'),
      `Chặn đổi cờ isActive = false cho sản phẩm ID ${existingProd.id} vì vẫn còn hàng tồn khả dụng (Mục 6 SSOT)`
    );

    // ---------------------------------------------------------
    // TEST 7: CHO PHÉP NGỪNG KINH DOANH SẢN PHẨM HẾT HÀNG / RỖNG LÔ & AUDIT LOGS
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 7: NGỪNG KINH DOANH AN TOÀN SẢN PHẨM RỖNG LÔ & GHI NHẬN AUDIT LOGS ---');
    const safeSku = `SKU-SAFE-${Date.now().toString().slice(-4)}`;
    const createSafeProd = await request('POST', '/catalog/products', {
      sku: safeSku,
      name: `Sản phẩm mẫu an toàn ${safeSku}`,
      categoryId: 2,
      costPrice: 12000,
      sellingPrice: 18000,
      standardShelfLifeDays: 7,
      unit: 'Gói'
    }, managerToken);
    assert(createSafeProd.status === 201 && createSafeProd.body?.data?.id,
      `Tạo sản phẩm mẫu không có lô hàng [${safeSku}] thành công (HTTP 201)`);
    const safeProdId = createSafeProd.body?.data?.id;

    if (safeProdId) {
      const deleteSafeProd = await request('DELETE', `/catalog/products/${safeProdId}`, null, managerToken);
      assert(deleteSafeProd.status === 200 && deleteSafeProd.body?.success,
        `Ngừng kinh doanh thành công sản phẩm không còn tồn kho #${safeProdId} (HTTP 200)`);

      // Kiểm tra AuditLogs
      const auditRes = await request('GET', '/audit-logs?limit=5', null, adminToken);
      const deleteLog = auditRes.body?.data?.find(l => (l.actionType === 'DELETE_PRODUCT' || l.action === 'DELETE_PRODUCT') && String(l.entityId) === String(safeProdId));
      assert(deleteLog !== undefined, `Đã ghi nhận AuditLog DELETE_PRODUCT cho sản phẩm #${safeProdId} (Rule 11 SSOT)`);
    }

    // ---------------------------------------------------------
    // TEST 8: PHÂN QUYỀN SOD NGHIÊM NGẶT (CHẶN CASHIER & WAREHOUSE CAN THIỆP)
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 8: BẢO VỆ PHÂN QUYỀN SOD (CHẶN CASHIER & WAREHOUSE CAN THIỆP DANH MỤC) ---');
    // Thử 8.1: CASHIER cố gắng tạo sản phẩm -> Kỳ vọng 403
    const cashierCreateProd = await request('POST', '/catalog/products', { sku: 'TEST-SOD', name: 'Test' }, cashierToken);
    assert(cashierCreateProd.status === 403, 'Chặn vai trò Thu ngân (CASHIER) tự ý tạo sản phẩm mới (HTTP 403 Forbidden)');

    // Thử 8.2: CASHIER cố gắng tạo ngành hàng -> Kỳ vọng 403
    const cashierCreateCat = await request('POST', '/categories', { code: 'TEST_CAT', name: 'Test' }, cashierToken);
    assert(cashierCreateCat.status === 403, 'Chặn vai trò Thu ngân (CASHIER) tự ý tạo ngành hàng mới (HTTP 403 Forbidden)');

    // Thử 8.3: WAREHOUSE_STAFF cố gắng xóa sản phẩm -> Kỳ vọng 403
    const whDeleteProd = await request('DELETE', '/catalog/products/1', null, whToken);
    assert(whDeleteProd.status === 403, 'Chặn vai trò Nhân viên kho (WAREHOUSE_STAFF) tự ý xóa/ngừng kinh doanh sản phẩm (HTTP 403 Forbidden)');

    // Thử 8.4: WAREHOUSE_STAFF cố gắng cập nhật ngành hàng -> Kỳ vọng 403
    const whUpdateCat = await request('PUT', '/categories/1', { name: 'Hack Name' }, whToken);
    assert(whUpdateCat.status === 403, 'Chặn vai trò Nhân viên kho (WAREHOUSE_STAFF) tự ý sửa ngành hàng (HTTP 403 Forbidden)');

    // ---------------------------------------------------------
    // TỔNG KẾT KẾT QUẢ TEST
    // ---------------------------------------------------------
    console.log('\n================================================================================');
    console.log(`🎉 KẾT QUẢ TEST GIAI ĐOẠN 5 (MỤC 6 FMCG CATALOG & PRODUCTS):`);
    console.log(`   Tổng số Test Cases: ${total}`);
    console.log(`   Số test PASSED:     ${passed} / ${total} (${Math.round((passed / total) * 100)}% SUCCESS)`);
    console.log(`   Số test FAILED:     ${total - passed}`);
    console.log('================================================================================\n');

    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }

  } catch (error) {
    console.error('LỖI KHÔNG MONG MUỐN TRONG QUÁ TRÌNH TEST:', error);
    process.exit(1);
  }
}

runCatalogFmcgAlignmentTests();

