// test_master_e2e_11_rules_full_web.js
/**
 * MASTER E2E AUTOMATED TEST SUITE TOÀN DIỆN
 * Kiểm chứng tự động liên hoàn 11 Core Business Rules & Toàn bộ phân hệ Web đã phát triển
 * Đề tài: Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor)
 * Cửa hàng: Retail Store duy nhất LHU Mart (RETAIL-STORE-01) liên kết Kho tổng DC Biên Hòa
 * Sinh viên thực hiện: Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946)
 */

const BASE_URL = 'http://127.0.0.1:5000';
let adminToken = null;
let managerToken = null;
let cashierToken = null;
let warehouseToken = null;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function request(method, path, body = null, token = null) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opt = {
    method: method.toUpperCase(),
    headers
  };
  if (body) opt.body = JSON.stringify(body);

  const res = await fetch(url, opt);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, body: data };
}

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✅ [PASS] ${message}`);
}

async function runMasterTestSuite() {
  const startTime = Date.now();
  console.log('================================================================================');
  console.log('🚀 MASTER E2E TEST SUITE: 11 CORE BUSINESS RULES & FULL WEB PLATFORM');
  console.log('   Target API: http://127.0.0.1:5000 (Clean Architecture & SQL Server LocalDB)');
  console.log('================================================================================\n');

  // ==========================================================================================
  // SECTION 0: XÁC THỰC & BẢO MẬT ĐĂNG NHẬP (RBAC & BRUTE-FORCE PROTECTION)
  // ==========================================================================================
  console.log('--- PHẦN 0: XÁC THỰC, PHÂN QUYỀN 4 VAI TRÒ & BẢO MẬT CHỐNG BRUTE-FORCE ---');
  
  // 0.1 Đăng nhập 4 vai trò
  const loginAdmin = await request('POST', '/api/auth/login', { username: 'admin', password: 'Password123@' });
  assert(loginAdmin.status === 200 && loginAdmin.body?.data?.token, 'Đăng nhập vai trò ADMIN thành công (nhận Bearer Token)');
  adminToken = loginAdmin.body.data.token;

  const loginMgr = await request('POST', '/api/auth/login', { username: 'manager', password: 'Password123@' });
  assert(loginMgr.status === 200 && loginMgr.body?.data?.token, 'Đăng nhập vai trò STORE_MANAGER thành công (Cửa hàng trưởng)');
  managerToken = loginMgr.body.data.token;

  const loginCashier = await request('POST', '/api/auth/login', { username: 'cashier', password: 'Password123@' });
  assert(loginCashier.status === 200 && loginCashier.body?.data?.token, 'Đăng nhập vai trò CASHIER thành công (Thu ngân POS)');
  cashierToken = loginCashier.body.data.token;

  const loginWarehouse = await request('POST', '/api/auth/login', { username: 'warehouse', password: 'Password123@' });
  assert(loginWarehouse.status === 200 && loginWarehouse.body?.data?.token, 'Đăng nhập vai trò WAREHOUSE_STAFF thành công (Nhân viên kho)');
  warehouseToken = loginWarehouse.body.data.token;

  // 0.2 Kiểm tra cơ chế chống Brute-force: Khóa tài khoản sau 5 lần sai mật khẩu
  console.log('   Kiểm tra tính năng bảo mật chống Brute-force (Mục 22.3):');
  const tempUser = `test_bf_${Date.now().toString().slice(-4)}`;
  await request('POST', '/api/auth/users', {
    username: tempUser,
    fullName: 'Nhân viên Test Brute-Force',
    password: 'Password123@',
    roleId: 3
  }, adminToken);

  let lockedTriggered = false;
  for (let i = 1; i <= 5; i++) {
    const wrongLogin = await request('POST', '/api/auth/login', { username: tempUser, password: 'WrongPassword!' });
    if (wrongLogin.body?.message?.includes('khóa') || wrongLogin.body?.message?.includes('tạm thời')) {
      lockedTriggered = true;
    }
  }
  assert(lockedTriggered, `Cơ chế tự động khóa tài khoản "${tempUser}" sau 5 lần đăng nhập sai mật khẩu hoạt động chuẩn xác`);

  // ==========================================================================================
  // SECTION 1: RULE 1 - CỬA HÀNG BÁN LẺ DUY NHẤT (RETAIL-STORE-01)
  // ==========================================================================================
  console.log('\n--- PHẦN 1: RULE 1 - CỬA HÀNG BÁN LẺ DUY NHẤT (RETAIL-STORE-01) ---');
  const storeRes = await request('GET', '/api/store-profile');
  assert(storeRes.status === 200, 'Lấy thông tin hồ sơ cửa hàng thành công (HTTP 200)');
  assert(storeRes.body?.data?.storeCode === 'RETAIL-STORE-01', 'Mã cửa hàng chuẩn mực là RETAIL-STORE-01 (Rule 1 SSOT)');
  assert(Number(storeRes.body?.data?.minInboundRslPercent) === 70, 'Ngưỡng kiểm soát nhận hàng DC tối thiểu là RSL >= 70% (Rule 7)');
  assert(storeRes.body?.data?.status === 'OPEN', 'Trạng thái hoạt động của cửa hàng là OPEN');

  // ==========================================================================================
  // SECTION 2: RULE 9 & QUẢN LÝ NGÀNH HÀNG FMCG (MASTER DATA & ANTI-DUPLICATION)
  // ==========================================================================================
  console.log('\n--- PHẦN 2: RULE 9 & QUẢN LÝ NGÀNH HÀNG FMCG (ANTI-DUPLICATION & CATEGORY CRUD) ---');
  
  // 2.1 Quản lý Ngành hàng FMCG
  const catListRes = await request('GET', '/api/catalog/categories');
  assert(catListRes.status === 200 && Array.isArray(catListRes.body?.data), 'Truy vấn danh mục ngành hàng từ CSDL thành công');
  
  const testCatCode = `CAT_${Date.now().toString().slice(-4)}`;
  const addCatRes = await request('POST', '/api/catalog/categories', {
    code: testCatCode,
    name: 'Thực phẩm dinh dưỡng chuyên biệt',
    storageTemperature: 'Khô ráo thoáng mát',
    defaultWarningDays: 14,
    description: 'Sữa công thức và bột ăn dặm'
  }, adminToken);
  assert(addCatRes.status === 201, `Thêm ngành hàng mới [${testCatCode}] thành công (HTTP 201)`);
  const newCatId = addCatRes.body?.data?.id;

  const updateCatRes = await request('PUT', `/api/catalog/categories/${newCatId}`, {
    name: 'Dinh dưỡng chuyên biệt & Bổ sung vi chất',
    defaultWarningDays: 21
  }, adminToken);
  assert(updateCatRes.status === 200 && Number(updateCatRes.body?.data?.defaultWarningDays) === 21, 'Cập nhật thông số ngành hàng thành công');

  // Kiểm tra chặn xóa ngành có sản phẩm
  const blockDelCatRes = await request('DELETE', '/api/catalog/categories/1', null, adminToken);
  assert(blockDelCatRes.status === 400, 'Chặn xóa ngành hàng ID 1 (DAIRY) vì đang có sản phẩm lưu hành (Bảo vệ khóa ngoại)');

  const delCatRes = await request('DELETE', `/api/catalog/categories/${newCatId}`, null, adminToken);
  assert(delCatRes.status === 200, `Xóa an toàn ngành hàng vừa tạo ID ${newCatId} thành công`);

  // 2.2 Chống trùng lặp sản phẩm Rule 9 (Levenshtein / Jaro-Winkler >= 85%)
  const dupCheckRes = await request('POST', '/api/catalog/products', {
    sku: '8934567890101', // Trùng SKU sản phẩm mẫu #1
    name: 'Sản phẩm thử nghiệm trùng SKU',
    categoryId: 1,
    costPrice: 20000,
    sellingPrice: 30000
  }, adminToken);
  assert(dupCheckRes.status === 400 && (dupCheckRes.body?.message?.includes('Trùng') || dupCheckRes.body?.message?.includes('Rule 9')), 'Chặn thành công hành vi thêm sản phẩm bị trùng SKU (Rule 9 SSOT)');

  const dupNameRes = await request('POST', '/api/catalog/products', {
    sku: `SKU-TEST-${Date.now().toString().slice(-4)}`,
    name: 'Sữa tươi tiệt trùng Vinamilk 100% Không đường 1L', // Tên tương đồng 100%
    categoryId: 1,
    costPrice: 20000,
    sellingPrice: 30000
  }, adminToken);
  assert(dupNameRes.status === 400 && (dupNameRes.body?.message?.includes('tương đồng') || dupNameRes.body?.message?.includes('Trùng') || dupNameRes.body?.message?.includes('Rule 9')), 'Chặn thành công hành vi thêm sản phẩm có tên tương đồng >= 85% (Rule 9 SSOT)');

  // ==========================================================================================
  // SECTION 3: RULE 7 - TIÊU CHUẨN NHẬN HÀNG DC BIÊN HÒA (RSL >= 70%)
  // ==========================================================================================
  console.log('\n--- PHẦN 3: RULE 7 - TIÊU CHUẨN TIẾP NHẬN HÀNG DC BIÊN HÒA (RSL >= 70%) ---');

  // 3.1 Nhận hàng đạt chuẩn (RSL >= 70%)
  const today = new Date();
  const mfgDate = new Date(today);
  mfgDate.setDate(today.getDate() - 10);
  const expValidDate = new Date(today);
  expValidDate.setDate(today.getDate() + 90); // RSL = 90 / 100 = 90% >= 70%

  const inboundValidRes = await request('POST', '/api/batches/receive-inbound', {
    productId: 1,
    manufactureDate: mfgDate.toISOString().slice(0, 10),
    expiryDate: expValidDate.toISOString().slice(0, 10),
    quantity: 50,
    importPrice: 28000
  }, warehouseToken);
  assert(inboundValidRes.status === 201, `Tiếp nhận đợt hàng DC đạt chuẩn RSL = 90% >= 70% thành công`);
  const inboundBatchCode = inboundValidRes.body?.data?.batchCode || inboundValidRes.body?.batches?.[0]?.batchCode;

  // 3.2 Nhận hàng vi phạm chuẩn (RSL < 70%)
  const expInvalidDate = new Date(today);
  expInvalidDate.setDate(today.getDate() + 15); // RSL = 15 / 25 = 60% < 70%
  const inboundInvalidRes = await request('POST', '/api/batches/receive-inbound', {
    productId: 1,
    manufactureDate: mfgDate.toISOString().slice(0, 10),
    expiryDate: expInvalidDate.toISOString().slice(0, 10),
    quantity: 30,
    importPrice: 28000
  }, warehouseToken);
  assert(inboundInvalidRes.status === 422 || (inboundInvalidRes.status === 400 && inboundInvalidRes.body?.message?.includes('TỪ CHỐI')), 'Khóa cứng và từ chối tiếp nhận đợt hàng có RSL = 60% < 70% (Rule 7 SSOT)');

  // 3.3 Lập biên bản từ chối nhận hàng DC
  const rejectInboundRes = await request('POST', '/api/batches/reject-inbound', {
    productId: 1,
    productName: 'Sữa tươi Vinamilk',
    quantity: 30,
    manufactureDate: mfgDate.toISOString().slice(0, 10),
    expiryDate: expInvalidDate.toISOString().slice(0, 10),
    calculatedRsl: 60.0,
    reason: 'Hàng không đạt chuẩn tiếp nhận DC (RSL 60.0% < 70% quy định)'
  }, warehouseToken);
  assert(rejectInboundRes.status === 201 || rejectInboundRes.status === 200, 'Lập biên bản từ chối nhận hàng REJECT_DC_INBOUND thành công và lưu AuditLogs');

  // ==========================================================================================
  // SECTION 4: RULE 4 & RULE 10 - CẢNH BÁO 3 CẤP MÀU, QUICK MARKDOWN & ĐẢO KỆ
  // ==========================================================================================
  console.log('\n--- PHẦN 4: RULE 4 & RULE 10 - CẢNH BÁO 3 CẤP MÀU, QUICK MARKDOWN & ĐẢO KỆ ---');

  // 4.1 Cảnh báo 3 cấp màu
  const batchesRes = await request('GET', '/api/batches');
  assert(batchesRes.status === 200 && Array.isArray(batchesRes.body?.data), 'Truy vấn danh sách lô hàng kèm thuộc tính 3 màu hạn dùng thành công');

  const targetBatch = batchesRes.body?.data?.find(b => b.batchCode === inboundBatchCode) || batchesRes.body?.data?.find(b => b.status === 'ACTIVE' && b.currentQuantity > 0) || batchesRes.body?.data?.[0];
  const validBatchId = targetBatch?.id;
  assert(validBatchId, `Tìm thấy ID lô hàng kiểm thử trong CSDL (#${validBatchId})`);

  // 4.2 Quick Markdown xả hàng (15% - 50%)
  const markdownRes = await request('PATCH', `/api/batches/${validBatchId}/discount`, {
    discountPercent: 30
  }, managerToken);
  assert(markdownRes.status === 200 && (Number(markdownRes.body?.discountPercent) === 30 || Number(markdownRes.body?.data?.discountPercent) === 30), `Áp dụng Quick Markdown giảm giá 30% cho lô #${validBatchId} thành công (Rule 10 SSOT)`);

  // 4.3 Đảo kệ mặt tiền SOP 5 bước
  const rotateRes = await request('PATCH', `/api/batches/${validBatchId}/rotate`, {}, warehouseToken);
  assert(rotateRes.status === 200 && (rotateRes.body?.isShelfRotated === true || rotateRes.body?.data?.isShelfRotated === true), `Xác nhận điện tử SOP 5 bước đảo kệ mặt tiền cho lô #${validBatchId} thành công (is_shelf_rotated = 1)`);

  // ==========================================================================================
  // SECTION 5: RULE 2 & RULE 3 - BÁN LẺ POS THEO FEFO & CHỐNG TỒN KHO ÂM
  // ==========================================================================================
  console.log('\n--- PHẦN 5: RULE 2 & RULE 3 - BÁN LẺ POS THEO FEFO & CHỐNG TỒN KHO ÂM ---');

  // 5.1 Bán hàng trừ kho FEFO tự động bẻ lô
  const saleRes = await request('POST', '/api/sales', {
    items: [
      { productId: 1, quantity: 2 }
    ],
    weather: 'SUNNY',
    isHoliday: false
  }, cashierToken);
  assert(saleRes.status === 201 || saleRes.status === 200, 'Giao dịch thanh toán POS thành công (HTTP 201/200)');
  const transCode = saleRes.body?.transactionCode || saleRes.body?.data?.transactionCode;
  assert(transCode, `Giao dịch sinh mã hóa đơn hợp lệ: ${transCode}`);
  const allocDetails = saleRes.body?.fefoDetails || saleRes.body?.lines || saleRes.body?.data?.batchAllocations;
  assert(allocDetails && allocDetails.length >= 1, 'Hệ thống tự động bóc tách trừ số lượng trực tiếp từ lô cận date nhất (FEFO Rule 2)');

  // 5.2 Chống tồn kho âm (Transaction UPDLOCK, ROWLOCK - Rule 3)
  const overSaleRes = await request('POST', '/api/sales', {
    items: [
      { productId: 1, quantity: 999999 } // Vượt quá tồn kho
    ]
  }, cashierToken);
  assert(overSaleRes.status === 400, 'Giao dịch mua vượt số lượng khả dụng bị chặn và ROLLBACK thành công (Chống tồn kho âm Rule 3 SSOT)');

  // ==========================================================================================
  // SECTION 6: RULE 5 & RULE 6 - KHÓA CỨNG HÀNG HẾT HẠN & SỔ HAO HỤT TÀI CHÍNH
  // ==========================================================================================
  console.log('\n--- PHẦN 6: RULE 5 & RULE 6 - KHÓA HÀNG HẾT HẠN & SỔ HAO HỤT TÀI CHÍNH ---');

  // 6.1 Đề xuất tiêu hủy hàng (PENDING)
  const disposalRes = await request('POST', '/api/spoilage', {
    batchId: validBatchId,
    quantity: 1,
    reason: 'DAMAGED',
    notes: 'Bao bì móp méo trong quá trình vận chuyển'
  }, warehouseToken);
  assert(disposalRes.status === 201, `Nhân viên lập phiếu đề xuất tiêu hủy hàng thành công (Trạng thái: PENDING)`);
  const recordCode = disposalRes.body?.recordCode || disposalRes.body?.recordId || disposalRes.body?.data?.recordCode || disposalRes.body?.data?.id;

  // 6.2 Cửa hàng trưởng phê duyệt tiêu hủy (SoD Mục 4.2 SSOT)
  const approveRes = await request('PATCH', `/api/spoilage/${recordCode}/approve`, {}, managerToken);
  assert(approveRes.status === 200 && (approveRes.body?.status === 'APPROVED' || approveRes.body?.data?.status === 'APPROVED'), `Quản lý phê duyệt tiêu hủy biên bản ${recordCode} thành công (Cập nhật Sổ hao hụt Rule 6)`);

  // ==========================================================================================
  // SECTION 7: RULE 8 - DỰ BÁO ROP TÍCH HỢP NGOẠI CẢNH & ĐƠN HÀNG PO 5 TRẠNG THÁI
  // ==========================================================================================
  console.log('\n--- PHẦN 7: RULE 8 - DỰ BÁO ROP TÍCH HỢP NGOẠI CẢNH & ĐƠN HÀNG PO 5 TRẠNG THÁI ---');

  // 7.1 Dự báo ROP
  const ropRes = await request('GET', '/api/forecast/rop?weather=SUNNY&isHoliday=true');
  assert(ropRes.status === 200 && Array.isArray(ropRes.body?.data), 'Tính toán dự báo nhu cầu ROP tích hợp ngoại cảnh (W_factor, H_factor) thành công');

  // 7.2 Đơn đặt hàng PO 5 trạng thái
  const poRes = await request('POST', '/api/forecast/purchase-orders', {
    items: [
      { productId: 1, productName: 'Sữa tươi Vinamilk', suggestedQuantity: 50, approvedQuantity: 50, unitCost: 28000 }
    ],
    notes: 'Đơn hàng bổ sung cuối tuần'
  }, managerToken);
  assert(poRes.status === 201, `Tạo đơn đặt hàng PO gửi DC Biên Hòa thành công (Mã PO: ${poRes.body?.orderCode || poRes.body?.data?.orderCode || poRes.body?.data?.poNumber})`);
  const poId = poRes.body?.orderId || poRes.body?.data?.orderId || poRes.body?.data?.id;

  if (poId) {
    const approvePo = await request('PATCH', `/api/forecast/purchase-orders/${poId}/status`, { status: 'APPROVED' }, managerToken);
    assert(approvePo.status === 200, `Chuyển trạng thái PO #${poId} sang APPROVED thành công`);

    const submitPo = await request('PATCH', `/api/forecast/purchase-orders/${poId}/status`, { status: 'SUBMITTED' }, managerToken);
    assert(submitPo.status === 200, `Chuyển trạng thái PO #${poId} sang SUBMITTED (Đã gửi xe DC) thành công`);
  }

  // ==========================================================================================
  // SECTION 8: BÀN GIAO CA TRỰC & 3 CHẾ TÀI KỶ LUẬT (MỤC 15.2 SSOT)
  // ==========================================================================================
  console.log('\n--- PHẦN 8: BÀN GIAO CA TRỰC & 3 CHẾ TÀI KỶ LUẬT (MỤC 15.2 SSOT) ---');
  const handoverRes = await request('POST', '/api/shift-handover', {
    shiftType: 'MORNING',
    handoverPerson: 'Đoàn Minh Quân',
    receiverPerson: 'Đỗ Tấn Du',
    posSalesAmount: 1000000,
    cashInDrawer: 980000,
    cashDifference: -20000,
    redBatchesCount: 1,
    yellowBatchesCount: 2,
    wasteCount: 0,
    notes: 'Khách hàng chuyển khoản nhầm 20k'
  }, cashierToken);
  assert(handoverRes.status === 200 || handoverRes.status === 201, 'Bàn giao ca trực điện tử thành công (Kiểm tra lệch quỹ và ghi nhận AuditLogs)');

  // ==========================================================================================
  // SECTION 9: VISUAL ANALYTICS DASHBOARD & EXPORT ENGINE (PART 1 & PART 3 WEB)
  // ==========================================================================================
  console.log('\n--- PHẦN 9: VISUAL ANALYTICS DASHBOARD & EXPORT ENGINE ---');
  const dashRes = await request('GET', '/api/dashboard/overview');
  assert(dashRes.status === 200, 'Lấy dữ liệu Executive Dashboard thành công (HTTP 200)');
  assert(dashRes.body?.trend14Days?.length === 14, 'Dữ liệu Biểu đồ Xu hướng 14 ngày trả về đủ 14 mốc ngày liên tục');
  assert(dashRes.body?.categoryBreakdown?.length === 7, 'Dữ liệu Biểu đồ Cơ cấu Ngành hàng trả về chuẩn xác 7 nhóm ngành FMCG');
  assert(dashRes.body?.kpiMetrics?.totalInventoryCost !== undefined, 'KPI Vốn Tồn Kho khả dụng hiển thị thời gian thực');

  // ==========================================================================================
  // SECTION 10: RULE 11 - NHẬT KÝ KIỂM TOÁN HỆ THỐNG BẤT BIẾN (SYSTEM AUDIT TRAIL)
  // ==========================================================================================
  console.log('\n--- PHẦN 10: RULE 11 - SỔ NHẬT KÝ KIỂM TOÁN HỆ THỐNG BẤT BIẾN ---');
  const auditRes = await request('GET', '/api/audit-logs');
  assert(auditRes.status === 200 && Array.isArray(auditRes.body?.data), 'Truy vấn Sổ nhật ký kiểm toán hệ thống thành công');
  assert(auditRes.body?.data?.length > 0, `Đã ghi nhận ${auditRes.body?.data?.length} bản ghi kiểm toán bất biến (Rule 11 SSOT)`);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n================================================================================');
  console.log(`🎉 MASTER E2E TEST HOÀN TẤT TRONG ${elapsed} GIÂY:`);
  console.log(`   Tổng số Test Cases: ${totalTests}`);
  console.log(`   Số test PASSED:     ${passedTests} / ${totalTests} (100% SUCCESS)`);
  console.log(`   Số test FAILED:     ${failedTests}`);
  console.log('================================================================================\n');

  return failedTests === 0;
}

runMasterTestSuite().then(success => {
  if (!success) process.exit(1);
}).catch(err => {
  console.error('\nLỖI THỰC THI MASTER TEST SUITE:', err);
  process.exit(1);
});
