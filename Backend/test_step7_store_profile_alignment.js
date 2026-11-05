// test_step7_store_profile_alignment.js
// Kịch bản Kiểm thử Tự động Giai đoạn 5: Chuẩn hóa Thông tin Cửa hàng Bán lẻ Duy nhất
// Tuân thủ Mục 5 & 11 Quy tắc Nghiệp vụ Cốt lõi (Rule 1, Rule 3, Rule 7, Rule 11 & SoD)

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

async function runStoreProfileAlignmentTests() {
  console.log('================================================================================');
  console.log('🚀 KIỂM THỬ GIAI ĐOẠN 5: ĐỒNG BỘ CỬA HÀNG DUY NHẤT & PHÂN QUYỀN SOD (MỤC 5 SSOT)');
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
    // BƯỚC 0: ĐĂNG NHẬP LẤY BEARER TOKEN CHO CÁC VAI TRÒ
    // ---------------------------------------------------------
    console.log('--- PHẦN 0: XÁC THỰC DANH TÍNH ADMIN & STORE_MANAGER ---');
    const adminLogin = await request('POST', '/auth/login', { username: 'admin', password: 'Password123@' });
    assert(adminLogin.status === 200 && adminLogin.body?.data?.token, 'Đăng nhập vai trò Quản trị viên (ADMIN) thành công');
    const adminToken = adminLogin.body?.data?.token;

    const managerLogin = await request('POST', '/auth/login', { username: 'manager', password: 'Password123@' });
    assert(managerLogin.status === 200 && managerLogin.body?.data?.token, 'Đăng nhập vai trò Cửa hàng trưởng (STORE_MANAGER) thành công');
    const managerToken = managerLogin.body?.data?.token;

    const cashierLogin = await request('POST', '/auth/login', { username: 'cashier', password: 'Password123@' });
    assert(cashierLogin.status === 200 && cashierLogin.body?.data?.token, 'Đăng nhập vai trò Thu ngân POS (CASHIER) thành công');
    const cashierToken = cashierLogin.body?.data?.token;

    // ---------------------------------------------------------
    // TEST 1: TRUY VẤN GET /api/store-profile ĐẦY ĐỦ 16 TRƯỜNG 3NF
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 1: TRUY VẤN GET /api/store-profile ĐẦY ĐỦ 16 TRƯỜNG THÔNG TIN ---');
    // Chuẩn hóa trạng thái ban đầu về tiêu chuẩn SSOT
    await request('PUT', '/store-profile', {
      shelfCapacitySkus: 1500,
      shelfCapacityUnits: 5000,
      status: 'OPEN',
      openTime: '06:00',
      closeTime: '22:00'
    }, adminToken);

    const getRes = await request('GET', '/store-profile');
    assert(getRes.status === 200 && getRes.body?.success, 'Truy vấn GET /api/store-profile thành công (HTTP 200)');
    const profile = getRes.body?.data;

    assert(profile?.storeCode === 'RETAIL-STORE-01', 'Mã cửa hàng bán lẻ duy nhất là RETAIL-STORE-01 (Rule 1 SSOT)');
    assert(typeof profile?.storeName === 'string' && profile.storeName.length > 0, `Tên cửa hàng: [${profile?.storeName}]`);
    assert(typeof profile?.address === 'string' && profile.address.length > 0, `Địa chỉ cửa hàng: [${profile?.address}]`);
    assert(typeof profile?.phone === 'string' && profile.phone.length > 0, `Số điện thoại liên hệ: [${profile?.phone}]`);
    assert(profile?.managerName && profile.managerName.length > 0, `Cửa hàng trưởng phụ trách: [${profile?.managerName}]`);
    assert(Number(profile?.minInboundRslPercent) >= 70, `Ngưỡng nhận date DC tối thiểu Min RSL = ${profile?.minInboundRslPercent}% (Rule 7 SSOT)`);
    assert(Number(profile?.defaultWarningDays) === 7, `Ngưỡng cảnh báo Vàng mặc định = ${profile?.defaultWarningDays} ngày (Rule 4 SSOT)`);
    assert(Number(profile?.criticalWarningDays) === 3, `Ngưỡng cảnh báo Đỏ nguy kịch = ${profile?.criticalWarningDays} ngày (Rule 4 SSOT)`);
    assert(Number(profile?.defaultLeadTimeDays) >= 1, `Lead Time vận chuyển xe tải DC = ${profile?.defaultLeadTimeDays} ngày (Rule 8 SSOT)`);
    assert(profile?.defaultDcSupplierName?.includes('DC Biên Hòa'), `Kho tổng phân phối nguồn: [${profile?.defaultDcSupplierName}]`);
    assert(['OPEN', 'CLOSED', 'INVENTORY', 'SUSPENDED'].includes(profile?.status), `Trạng thái vận hành hợp lệ: [${profile?.status}]`);
    assert(/^\d{2}:\d{2}$/.test(profile?.openTime) && /^\d{2}:\d{2}$/.test(profile?.closeTime), `Khung giờ mở/đóng cửa chuẩn HH:mm: [${profile?.openTime} - ${profile?.closeTime}]`);
    assert(Number(profile?.shelfCapacitySkus) === 1500, `Sức chứa quầy kệ SKU tiêu chuẩn: ${profile?.shelfCapacitySkus} SKU (Mục 3.1 & Mục 5 SSOT)`);
    assert(Number(profile?.shelfCapacityUnits) === 5000, `Sức chứa đơn vị sản phẩm tiêu chuẩn: ${profile?.shelfCapacityUnits} đơn vị (Mục 3.1 & Mục 5 SSOT)`);
    assert(profile?.isOpen === true, 'Thuộc tính domain isOpen = true khi status là OPEN');

    // ---------------------------------------------------------
    // TEST 2: STORE_MANAGER CẬP NHẬT STATUS & GIỜ HOẠT ĐỘNG
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 2: STORE_MANAGER ĐIỀU CHỈNH TRẠNG THÁI CA TRỰC HỢP LỆ (SOD) ---');
    const updateShiftRes = await request('PUT', '/store-profile', {
      status: 'OPEN',
      openTime: '06:15',
      closeTime: '22:15'
    }, managerToken);

    assert(updateShiftRes.status === 200 && updateShiftRes.body?.success, 'Cửa hàng trưởng cập nhật giờ ca trực thành công (HTTP 200)');
    assert(updateShiftRes.body?.data?.openTime === '06:15', 'Giờ mở cửa mới đã cập nhật thành 06:15');
    assert(updateShiftRes.body?.data?.closeTime === '22:15', 'Giờ đóng cửa mới đã cập nhật thành 22:15');

    // ---------------------------------------------------------
    // TEST 3: STORE_MANAGER CỐ Ý SỬA NGƯỠNG KỸ THUẬT LÕI (BỊ CHẶN BỞI SOD)
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 3: BẢO VỆ RANH GIỚI PHÂN QUYỀN (SOD - MỤC 4.2 & MỤC 5 SSOT) ---');
    // Thử 3.1: Nới lỏng Min RSL
    const violateRsl = await request('PUT', '/store-profile', { minInboundRslPercent: 65 }, managerToken);
    assert(violateRsl.status === 400 && violateRsl.body?.message?.includes('Vi phạm Ranh giới Phân quyền (SoD'),
      'Chặn STORE_MANAGER tự ý hạ ngưỡng Min RSL nhận hàng DC (Lỗi 400 SoD)');

    // Thử 3.2: Thay đổi Sức chứa SKU
    const violateSkus = await request('PUT', '/store-profile', { shelfCapacitySkus: 2500 }, managerToken);
    assert(violateSkus.status === 400 && violateSkus.body?.message?.includes('Vi phạm Ranh giới Phân quyền (SoD'),
      'Chặn STORE_MANAGER tự ý sửa Sức chứa quầy kệ SKU (Lỗi 400 SoD)');

    // Thử 3.3: Thay đổi Sức chứa đơn vị sản phẩm
    const violateUnits = await request('PUT', '/store-profile', { shelfCapacityUnits: 8000 }, managerToken);
    assert(violateUnits.status === 400 && violateUnits.body?.message?.includes('Vi phạm Ranh giới Phân quyền (SoD'),
      'Chặn STORE_MANAGER tự ý sửa Sức chứa quầy kệ Units (Lỗi 400 SoD)');

    // ---------------------------------------------------------
    // TEST 4: ADMIN CẬP NHẬT THAM SỐ SỨC CHỨA & GHI NHẬN AUDIT LOGS
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 4: ADMIN CẬP NHẬT THAM SỐ KỸ THUẬT & GHI NHẬN AUDIT LOGS ---');
    const adminUpdate = await request('PUT', '/store-profile', {
      shelfCapacitySkus: 1800,
      shelfCapacityUnits: 6000
    }, adminToken);
    assert(adminUpdate.status === 200 && adminUpdate.body?.success, 'ADMIN cập nhật sức chứa quầy kệ thành công');
    assert(Number(adminUpdate.body?.data?.shelfCapacitySkus) === 1800, 'Sức chứa SKU cập nhật lên 1800');
    assert(Number(adminUpdate.body?.data?.shelfCapacityUnits) === 6000, 'Sức chứa Units cập nhật lên 6000');

    // Kiểm tra AuditLogs
    const auditRes = await request('GET', '/audit-logs', null, adminToken);
    const storeProfileLogs = auditRes.body?.data?.filter(l => (l.actionType === 'UPDATE_STORE_PROFILE' || l.action === 'UPDATE_STORE_PROFILE'));
    assert(storeProfileLogs && storeProfileLogs.length > 0, 'Hệ thống đã ghi nhận AuditLog bất biến cho hành vi UPDATE_STORE_PROFILE (Rule 11 SSOT)');

    // Khôi phục lại thông số chuẩn mực 1500 SKU / 5000 Units
    const revertRes = await request('PUT', '/store-profile', {
      shelfCapacitySkus: 1500,
      shelfCapacityUnits: 5000,
      openTime: '06:00',
      closeTime: '22:00',
      status: 'OPEN'
    }, adminToken);
    assert(revertRes.status === 200 && Number(revertRes.body?.data?.shelfCapacitySkus) === 1500,
      'Khôi phục hoàn toàn cấu hình tiêu chuẩn: 1500 SKU / 5000 Units (Mục 5 SSOT)');

    // ---------------------------------------------------------
    // TEST 5: POS TỪ CHỐI XUẤT BÁN KHI CỬA HÀNG ĐANG CLOSED HOẶC INVENTORY
    // ---------------------------------------------------------
    console.log('\n--- PHẦN 5: KHÓA CỨNG QUẦY POS KHI CỬA HÀNG CLOSED HOẶC INVENTORY ---');
    // Lấy 1 sản phẩm có sẵn để test checkout
    const productsRes = await request('GET', '/catalog/products');
    const firstProduct = productsRes.body?.data?.[0];
    assert(firstProduct && firstProduct.id, `Lấy mẫu sản phẩm thử nghiệm POS: [${firstProduct?.name || 'Sản phẩm'}] (ID: ${firstProduct?.id})`);

    // 5.1 Đặt trạng thái cửa hàng thành INVENTORY (Kiểm kê)
    await request('PUT', '/store-profile', { status: 'INVENTORY' }, managerToken);
    const checkInventoryProfile = await request('GET', '/store-profile');
    assert(checkInventoryProfile.body?.data?.status === 'INVENTORY', 'Đã chuyển cửa hàng sang trạng thái [INVENTORY]');

    // 5.2 Thực hiện thanh toán POS trong lúc kiểm kê -> Kỳ vọng BỊ TỪ CHỐI
    const blockedCheckout = await request('POST', '/sales/checkout', {
      items: [{ productId: firstProduct.id, quantity: 1 }],
      weather: 'NORMAL',
      isHoliday: false
    }, cashierToken);

    assert(
      blockedCheckout.status >= 400 &&
      (blockedCheckout.body?.message?.includes('INVENTORY') || blockedCheckout.body?.message?.includes('tạm khóa')),
      'Quầy POS từ chối xuất bán khi cửa hàng đang ở trạng thái INVENTORY (Bảo vệ toàn vẹn kiểm kê)'
    );

    // 5.3 Đặt trạng thái cửa hàng thành CLOSED (Đóng cửa)
    await request('PUT', '/store-profile', { status: 'CLOSED' }, managerToken);
    const checkClosedProfile = await request('GET', '/store-profile');
    assert(checkClosedProfile.body?.data?.status === 'CLOSED', 'Đã chuyển cửa hàng sang trạng thái [CLOSED]');

    // 5.4 Thực hiện thanh toán POS trong lúc đóng cửa -> Kỳ vọng BỊ TỪ CHỐI
    const blockedClosedCheckout = await request('POST', '/sales/checkout', {
      items: [{ productId: firstProduct.id, quantity: 1 }],
      weather: 'NORMAL',
      isHoliday: false
    }, cashierToken);

    assert(
      blockedClosedCheckout.status >= 400 &&
      (blockedClosedCheckout.body?.message?.includes('CLOSED') || blockedClosedCheckout.body?.message?.includes('tạm khóa')),
      'Quầy POS từ chối xuất bán khi cửa hàng đang ở trạng thái CLOSED (Ngoài giờ mở cửa)'
    );

    // 5.5 Khôi phục trạng thái cửa hàng về OPEN
    const restoreOpen = await request('PUT', '/store-profile', { status: 'OPEN' }, managerToken);
    assert(restoreOpen.status === 200 && restoreOpen.body?.data?.status === 'OPEN',
      'Đã mở lại cửa hàng về trạng thái [OPEN] - Quầy POS sẵn sàng hoạt động bình thường');

    // ---------------------------------------------------------
    // TỔNG KẾT BÀI KIỂM THỬ
    // ---------------------------------------------------------
    console.log('\n================================================================================');
    console.log(`🎉 KẾT QUẢ TEST GIAI ĐOẠN 5:`);
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

runStoreProfileAlignmentTests();
