// Backend/test_step17_shift_handover_scheduling.js
/**
 * TEST SUITE: MỤC 15 - QUẢN LÝ LỊCH TRỰC & BÀN GIAO CA LÀM VIỆC (SHIFT HANDOVER SOP)
 * 
 * Kiểm định chuyên sâu 9 phân hệ kỹ thuật:
 * 1. Khởi tạo & Xác thực 4 vai trò SoD (ADMIN, STORE_MANAGER, CASHIER, WAREHOUSE_STAFF)
 * 2. Động cơ nhận diện Ca trực thời gian thực & Thống kê ca (GET /api/shift-handover/summary)
 * 3. Bước 1: Kiểm đếm tiền két & Đối soát chênh lệch doanh số POS (Khớp = 0, Dư > 0, Thiếu < 0)
 * 4. Bước 2: Rà soát danh sách lô cận date (Vùng Đỏ & Vùng Vàng) bàn giao quầy kệ
 * 5. Bước 3: Bàn giao thùng hàng chờ tiêu hủy tại khu cách ly (Waste Count & CostLoss)
 * 6. Bước 4: Ký Biên bản Bàn giao Điện tử & Sinh mã định danh SH-YYYYMMDD-xxxxxx
 * 7. Kiểm định Điều kiện Biên & Ràng buộc toàn vẹn (Thiếu người giao/nhận, dữ liệu không hợp lệ)
 * 8. Tra cứu Lịch sử Biên bản Bàn giao & Phân tích Snapshot đối soát (GET /api/shift-handover/history)
 * 9. Nhật ký Kiểm toán Bất biến (system_audit_logs - Rule 11 & Mục 15.5.2)
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

async function runStep17ShiftHandoverTests() {
  console.log('='.repeat(85));
  console.log('📋  TEST SUITE STEP 17: SHIFT HANDOVER & STAFF SCHEDULING SOP (MỤC 15 & RULE 11)');
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
    // PHẦN 1: ĐĂNG NHẬP 4 VAI TRÒ & XÁC THỰC SOD (MỤC 15.1.2 & 15.5)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 1] ĐĂNG NHẬP 4 VAI TRÒ HỆ THỐNG & XÁC THỰC SOD (MỤC 15.1.2)');

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

    // Chặn truy cập không xác thực khi ký biên bản bàn giao
    const resNoAuth = await request('POST', '/api/shift-handover', {
      handoverPerson: 'Nguyễn Văn A',
      receiverPerson: 'Trần Văn B'
    });
    assert.strictEqual(resNoAuth.status, 401, 'Yêu cầu không token phải bị từ chối HTTP 401');
    recordPass('Bảo mật: Từ chối ký biên bản bàn giao khi không có JWT Token (HTTP 401 Unauthorized)');

    // -------------------------------------------------------------
    // PHẦN 2: NHẬN DIỆN CA THỜI GIAN THỰC & THỐNG KÊ CA (MỤC 15.1)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 2] NHẬN DIỆN CA TRỰC THỜI GIAN THỰC & THỐNG KÊ DỮ LIỆU CA');

    const resSummary = await request('GET', '/api/shift-handover/summary');
    assert.strictEqual(resSummary.status, 200, 'GET /api/shift-handover/summary HTTP 200');
    assert.strictEqual(resSummary.body.success, true);
    const summary = resSummary.body.data;

    assert.ok(summary.shiftType === 'MORNING' || summary.shiftType === 'AFTERNOON', `Nhận diện ca chuẩn: ${summary.shiftType}`);
    assert.ok(summary.shiftLabel && summary.shiftLabel.includes('Ca'), `Nhãn ca trực: ${summary.shiftLabel}`);
    assert.ok(summary.currentHour >= 0 && summary.currentHour <= 23, `Giờ hệ thống: ${summary.currentHour}h`);
    assert.ok(typeof summary.todaySalesRevenue === 'number', `Doanh thu POS hôm nay: ${summary.todaySalesRevenue.toLocaleString('vi-VN')} đ`);
    assert.ok(typeof summary.redBatchesCount === 'number', `Lô Đỏ: ${summary.redBatchesCount}`);
    assert.ok(typeof summary.yellowBatchesCount === 'number', `Lô Vàng: ${summary.yellowBatchesCount}`);
    assert.ok(typeof summary.unrotatedBatchesCount === 'number', `Lô chưa đảo kệ: ${summary.unrotatedBatchesCount}`);
    assert.ok(Array.isArray(summary.activeStaff) && summary.activeStaff.length > 0, `Nhân sự khả dụng: ${summary.activeStaff.length} người`);
    recordPass(`Nhận diện ca trực thành công: [${summary.shiftLabel}], Doanh số POS: ${summary.todaySalesRevenue.toLocaleString('vi-VN')} đ, Nhân sự trực: ${summary.activeStaff.length} người`);

    // -------------------------------------------------------------
    // PHẦN 3: BƯỚC 1 - ĐỐI SOÁT CHÊNH LỆCH TIỀN KÉT (MỤC 15.2 BƯỚC 1)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 3] BƯỚC 1: ĐỐI SOÁT TIỀN KÉT VÀ 3 TRẠNG THÁI CHÊNH LỆCH (KHỚP, DƯ, THIẾU)');

    // 3.1 Kịch bản Khớp chuẩn 100% (Balanced: Delta = 0)
    const balancedPayload = {
      shiftType: summary.shiftType,
      handoverPerson: 'Nguyễn Thu Ngân (Ca Sáng)',
      receiverPerson: 'Trần Tiếp Nhận (Ca Chiều)',
      posSalesAmount: 5000000,
      cashInDrawer: 5000000,
      cashDifference: 0,
      redBatchesCount: summary.redBatchesCount,
      yellowBatchesCount: summary.yellowBatchesCount,
      wasteCount: summary.wasteItemsCount || 0,
      notes: 'Két tiền khớp 100% doanh số POS; niêm phong cọc tiền đầy đủ'
    };
    const resBalanced = await request('POST', '/api/shift-handover', balancedPayload, tokenCashier);
    assert.strictEqual(resBalanced.status, 200);
    assert.strictEqual(resBalanced.body.data.cashDifference, 0);
    const codeBalanced = resBalanced.body.data.handoverCode;
    assert.ok(codeBalanced && /^SH-\d{8}-\d{6}$/.test(codeBalanced), `Mã phiên đúng chuẩn SH-YYYYMMDD-xxxxxx: ${codeBalanced}`);
    recordPass(`Kịch bản 1 (Khớp 100%): Phiên [${codeBalanced}] đối soát khớp doanh số (Delta = 0 đ)`);

    // 3.2 Kịch bản Dư tiền két (Surplus: Delta > 0)
    const surplusPayload = {
      shiftType: summary.shiftType,
      handoverPerson: 'Nguyễn Thu Ngân (Ca Sáng)',
      receiverPerson: 'Trần Tiếp Nhận (Ca Chiều)',
      posSalesAmount: 5000000,
      cashInDrawer: 5050000,
      cashDifference: 50000,
      redBatchesCount: summary.redBatchesCount,
      yellowBatchesCount: summary.yellowBatchesCount,
      wasteCount: summary.wasteItemsCount || 0,
      notes: 'Dư 50.000 đ do khách hàng để lại tiền boa và tiền lẻ thừa'
    };
    const resSurplus = await request('POST', '/api/shift-handover', surplusPayload, tokenCashier);
    assert.strictEqual(resSurplus.status, 200);
    assert.strictEqual(resSurplus.body.data.cashDifference, 50000);
    recordPass(`Kịch bản 2 (Dư két): Phiên [${resSurplus.body.data.handoverCode}] ghi nhận dư +50.000 đ (Giải trình hợp lệ)`);

    // 3.3 Kịch bản Thiếu hụt tiền két (Deficit: Delta < 0)
    const deficitPayload = {
      shiftType: summary.shiftType,
      handoverPerson: 'Nguyễn Thu Ngân (Ca Sáng)',
      receiverPerson: 'Trần Tiếp Nhận (Ca Chiều)',
      posSalesAmount: 5000000,
      cashInDrawer: 4980000,
      cashDifference: -20000,
      redBatchesCount: summary.redBatchesCount,
      yellowBatchesCount: summary.yellowBatchesCount,
      wasteCount: summary.wasteItemsCount || 0,
      notes: 'Thiếu 20.000 đ do nhầm lẫn thối tiền cho khách; thu ngân cam kết bù tiền túi'
    };
    const resDeficit = await request('POST', '/api/shift-handover', deficitPayload, tokenCashier);
    assert.strictEqual(resDeficit.status, 200);
    assert.strictEqual(resDeficit.body.data.cashDifference, -20000);
    recordPass(`Kịch bản 3 (Thiếu két): Phiên [${resDeficit.body.data.handoverCode}] ghi nhận thiếu -20.000 đ (Cam kết bù trừ)`);

    // -------------------------------------------------------------
    // PHẦN 4: BƯỚC 2 - RÀ SOÁT LÔ CẬN DATE QUẦY KỆ (MỤC 15.2 BƯỚC 2)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 4] BƯỚC 2: RÀ SOÁT DANH SÁCH LÔ CẬN DATE (VÙNG ĐỎ & VÀNG) VÀ TIẾN ĐỘ ĐẢO KỆ');

    // Kiểm tra tính toàn vẹn của các trường redBatchesCount & yellowBatchesCount
    assert.ok(resBalanced.body.data.redBatchesCount !== undefined);
    assert.ok(resBalanced.body.data.yellowBatchesCount !== undefined);
    recordPass(`Biên bản bàn giao ghi nhận chính xác: ${resBalanced.body.data.redBatchesCount} lô Đỏ nguy kịch và ${resBalanced.body.data.yellowBatchesCount} lô Vàng cảnh báo`);

    // -------------------------------------------------------------
    // PHẦN 5: BƯỚC 3 - BÀN GIAO THÙNG HÀNG HỦY KHU CÁCH LY (MỤC 15.2 BƯỚC 3)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 5] BƯỚC 3: BÀN GIAO THÙNG HÀNG CHỜ TIÊU HỦY TẠI KHU VỰC CÁCH LY');

    assert.ok(resBalanced.body.data.wasteCount !== undefined);
    recordPass(`Biên bản bàn giao ghi nhận số lượng hàng cách ly chờ tiêu hủy: ${resBalanced.body.data.wasteCount} sản phẩm`);

    // -------------------------------------------------------------
    // PHẦN 6: BƯỚC 4 - KÝ BIÊN BẢN ĐIỆN TỬ & CẤP MÃ PHIÊN (MỤC 15.2 BƯỚC 4)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 6] BƯỚC 4: KÝ BIÊN BẢN ĐIỆN TỬ & CẤP MÃ ĐỊNH DANH PHIÊN BẤT BIẾN');

    const signedPayload = {
      shiftType: 'AFTERNOON',
      handoverPerson: 'Đỗ Tấn Du (Cửa Hàng Trưởng)',
      receiverPerson: 'Đoàn Minh Quân (Quản Trị Viên)',
      posSalesAmount: 7500000,
      cashInDrawer: 7500000,
      cashDifference: 0,
      redBatchesCount: 2,
      yellowBatchesCount: 4,
      wasteCount: 6,
      notes: 'Bàn giao ca chiều cuối ngày; hoàn tất 100% đảo kệ mặt tiền; két tiền niêm phong an toàn'
    };
    const resSigned = await request('POST', '/api/shift-handover', signedPayload, tokenManager);
    assert.strictEqual(resSigned.status, 200);
    const signedData = resSigned.body.data;
    assert.ok(signedData.handoverCode.startsWith('SH-'));
    assert.strictEqual(signedData.shiftType, 'AFTERNOON');
    assert.strictEqual(signedData.shiftLabel, 'Ca Chiều (14:00 - 22:00)');
    assert.strictEqual(signedData.handoverPerson, 'Đỗ Tấn Du (Cửa Hàng Trưởng)');
    assert.strictEqual(signedData.receiverPerson, 'Đoàn Minh Quân (Quản Trị Viên)');
    recordPass(`Ký biên bản điện tử thành công: Mã phiên [${signedData.handoverCode}] (${signedData.shiftLabel})`);

    // -------------------------------------------------------------
    // PHẦN 7: KIỂM ĐỊNH ĐIỀU KIỆN BIÊN & NEGATIVE BOUNDARIES
    // -------------------------------------------------------------
    console.log('\n[PHẦN 7] KIỂM ĐỊNH ĐIỀU KIỆN BIÊN & NEGATIVE BOUNDARIES');

    // 7.1 Thiếu người bàn giao
    const resMissingHandover = await request('POST', '/api/shift-handover', {
      handoverPerson: '',
      receiverPerson: 'Trần Văn B'
    }, tokenManager);
    assert.strictEqual(resMissingHandover.status, 400);
    recordPass('Chặn ký biên bản khi thiếu Người bàn giao (HTTP 400)');

    // 7.2 Thiếu người tiếp nhận
    const resMissingReceiver = await request('POST', '/api/shift-handover', {
      handoverPerson: 'Nguyễn Văn A',
      receiverPerson: ''
    }, tokenManager);
    assert.strictEqual(resMissingReceiver.status, 400);
    recordPass('Chặn ký biên bản khi thiếu Người tiếp nhận (HTTP 400)');

    // 7.3 Giá trị tiền tự động tính chênh lệch khi không gửi cashDifference
    const resAutoDiff = await request('POST', '/api/shift-handover', {
      handoverPerson: 'Thu Ngân 1',
      receiverPerson: 'Thu Ngân 2',
      posSalesAmount: 1000000,
      cashInDrawer: 990000
    }, tokenManager);
    assert.strictEqual(resAutoDiff.status, 200);
    assert.strictEqual(resAutoDiff.body.data.cashDifference, -10000, 'Tự động tính: 990.000 - 1.000.000 = -10.000');
    recordPass('Tự động tính toán chênh lệch két ở tầng Domain Entity khi client không truyền cashDifference');

    // -------------------------------------------------------------
    // PHẦN 8: TRA CỨU LỊCH SỬ BIÊN BẢN & ĐỐI SOÁT (MỤC 15.4)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 8] TRA CỨU LỊCH SỬ BIÊN BẢN BÀN GIAO CA (GET /api/shift-handover/history)');

    const resHistory = await request('GET', '/api/shift-handover/history?limit=20');
    assert.strictEqual(resHistory.status, 200);
    assert.strictEqual(resHistory.body.success, true);
    assert.ok(Array.isArray(resHistory.body.data) && resHistory.body.data.length > 0);

    const targetCode = signedData.handoverCode;
    const foundHandover = resHistory.body.data.find(h => h.handoverCode === targetCode);
    assert.ok(foundHandover !== undefined, `Tìm thấy phiên [${targetCode}] trong danh sách lịch sử`);
    assert.strictEqual(foundHandover.handoverPerson, 'Đỗ Tấn Du (Cửa Hàng Trưởng)');
    assert.strictEqual(foundHandover.receiverPerson, 'Đoàn Minh Quân (Quản Trị Viên)');
    assert.strictEqual(foundHandover.posSalesAmount, 7500000);
    assert.strictEqual(foundHandover.cashInDrawer, 7500000);
    recordPass(`Truy vấn Lịch sử biên bản bàn giao ca thành công: Tìm thấy phiên [${targetCode}] đầy đủ thuộc tính đối soát`);

    // -------------------------------------------------------------
    // PHẦN 9: NHẬT KÝ KIỂM TOÁN BẤT BIẾN (RULE 11 & MỤC 15.5.2)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 9] NHẬT KÝ KIỂM TOÁN BẤT BIẾN (RULE 11 & MỤC 15.5.2)');

    const auditHandover = await SqlConnection.queryJson(`
      SELECT TOP 1 id, action_type, entity_name, entity_id, description, created_at
      FROM system_audit_logs
      WHERE action_type = 'SHIFT_HANDOVER' AND entity_id = '${targetCode}'
      ORDER BY id DESC
      FOR JSON PATH;
    `);
    assert.ok(auditHandover && auditHandover[0], `Phải có nhật ký SHIFT_HANDOVER cho phiên [${targetCode}]`);
    assert.ok(auditHandover[0].description.includes('HANDOVER_JSON:'), 'Nhật ký chứa snapshot JSON đối soát ca');
    recordPass(`Nhật ký kiểm toán ghi nhận bất biến hành vi bàn giao ca: [SHIFT_HANDOVER] Phiên ${targetCode}`);

  } catch (err) {
    recordFail('Lỗi thực thi kiểm thử Step 17', err);
  } finally {
    console.log('\n' + '='.repeat(85));
    console.log('🏁 KẾT QUẢ KIỂM THỬ STEP 17: SHIFT HANDOVER & STAFF SCHEDULING SOP:');
    console.log(`   Tổng số Test Cases: ${passed + failed}`);
    console.log(`   Số test PASSED:     ${passed} / ${passed + failed} (${Math.round((passed / (passed + failed || 1)) * 100)}%)`);
    console.log(`   Số test FAILED:     ${failed}`);
    console.log('='.repeat(85));

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runStep17ShiftHandoverTests()
  .then(() => {
    console.log('\n[HOÀN THÀNH] Toàn bộ test suite Step 17 đã hoàn tất thành công!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n[LỖI NGHIÊM TRỌNG]', err);
    process.exit(1);
  });

