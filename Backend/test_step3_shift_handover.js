// test_step3_shift_handover.js
// Script kiểm thử xác minh Bước 3: Bàn giao Ca trực 4 Bước & In Biên bản Bàn giao Ca chuẩn Mục 15 SSOT

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================================');
  console.log('🚀 KIỂM THỬ BƯỚC 3: BÀN GIAO CA TRỰC 4 BƯỚC & 3 CHẾ TÀI KỶ LUẬT (MỤC 15 SSOT)');
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

  // 1. Đăng nhập để lấy Token
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'cashier', password: 'Password123@' })
  });
  const loginJson = await loginRes.json();
  assert(loginJson.success && loginJson.data?.token, 'Đăng nhập Thu ngân quầy POS thành công');
  const token = loginJson.data?.token;
  const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  // 2. Test GET /api/shift-handover/summary (Tự động nhận diện ca trực & thống kê thời gian thực)
  console.log('\n--- 1. TỔNG HỢP CA TRỰC THỜI GIAN THỰC (MỤC 15.1 SSOT) ---');
  const summaryRes = await fetch(`${API_BASE}/shift-handover/summary`);
  const summaryJson = await summaryRes.json();
  assert(summaryJson.success === true, 'GET /api/shift-handover/summary phản hồi thành công (HTTP 200)');
  assert(summaryJson.data?.shiftType === 'MORNING' || summaryJson.data?.shiftType === 'AFTERNOON', `Tự động nhận diện ca trực chuẩn xác: ${summaryJson.data?.shiftLabel}`);
  assert(summaryJson.data?.todaySalesRevenue !== undefined, `Đồng bộ doanh số POS thời gian thực: ${summaryJson.data?.todaySalesRevenue.toLocaleString('vi-VN')} đ`);
  assert(summaryJson.data?.redBatchesCount !== undefined && summaryJson.data?.yellowBatchesCount !== undefined, `Thống kê lô rủi ro: ${summaryJson.data?.redBatchesCount} Đỏ, ${summaryJson.data?.yellowBatchesCount} Vàng`);
  assert(Array.isArray(summaryJson.data?.activeStaff) && summaryJson.data.activeStaff.length > 0, `Danh sách nhân sự trực ban khả dụng: ${summaryJson.data.activeStaff.length} người`);

  // 3. Test POST /api/shift-handover (Ký biên bản bàn giao ca điện tử & Kiểm tra đối soát tiền két)
  console.log('\n--- 2. KÝ BIÊN BẢN BÀN GIAO CA ĐIỆN TỬ (MỤC 15.1 BƯỚC 4) ---');
  const handoverPayload = {
    shiftType: summaryJson.data.shiftType,
    handoverPerson: 'Đoàn Minh Quân (Thu ngân ca trước)',
    receiverPerson: 'Đỗ Tấn Du (Cửa hàng trưởng ca sau)',
    posSalesAmount: summaryJson.data.todaySalesRevenue || 5000000,
    cashInDrawer: (summaryJson.data.todaySalesRevenue || 5000000) - 10000,
    cashDifference: -10000, // Lệch két thiếu 10.000đ
    redBatchesCount: summaryJson.data.redBatchesCount || 1,
    yellowBatchesCount: summaryJson.data.yellowBatchesCount || 2,
    wasteCount: summaryJson.data.wasteItemsCount || 0,
    notes: 'Két tiền thiếu 10.000đ do tiền lẻ thối cho khách; đã dán tem giảm giá các lô Đỏ'
  };

  const submitRes = await fetch(`${API_BASE}/shift-handover`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(handoverPayload)
  });
  const submitJson = await submitRes.json();
  assert(submitJson.success === true, 'Ký xác nhận điện tử biên bản bàn giao ca thành công');
  assert(submitJson.data?.handoverCode && submitJson.data.handoverCode.startsWith('SH-'), `Sinh mã phiên bàn giao bất biến: [${submitJson.data?.handoverCode}]`);
  assert(submitJson.data?.cashDifference === -10000, 'Ghi nhận chính xác số tiền chênh lệch kiểm kê két');

  // 4. Test GET /api/shift-handover/history (Tra cứu lịch sử & đối soát biên bản)
  console.log('\n--- 3. LỊCH SỬ BÀN GIAO CA TRỰC & LƯU VẾT AUDIT LOG (RULE 11 SSOT) ---');
  const historyRes = await fetch(`${API_BASE}/shift-handover/history`);
  const historyJson = await historyRes.json();
  assert(historyJson.success === true && Array.isArray(historyJson.data), 'GET /api/shift-handover/history lấy danh sách biên bản đã ký');
  const foundRecent = historyJson.data.find(h => h.handoverCode === submitJson.data?.handoverCode);
  assert(foundRecent !== undefined, `Biên bản [${submitJson.data?.handoverCode}] đã được lưu vết và truy xuất thành công từ AuditLogs`);

  console.log('\n================================================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ BƯỚC 3: ${passed}/${total} TESTS PASSED (${Math.round(passed/total*100)}% THÀNH CÔNG)`);
  console.log('================================================================================');
}

runTests().catch(err => {
  console.error('LỖI KIỂM THỬ BƯỚC 3:', err);
  process.exit(1);
});

