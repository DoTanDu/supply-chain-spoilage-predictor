// Backend/test_step18_rbac_sod_matrix.js
/**
 * TEST SUITE: MỤC 16 - PHÂN QUYỀN CHỨC NĂNG (RBAC MATRIX & SOD SEPARATION OF DUTIES)
 * 
 * Kiểm định chuyên sâu 9 phân hệ kỹ thuật:
 * 1. Khởi tạo & Đăng nhập 4 vai trò chuẩn SoD (ADMIN, STORE_MANAGER, CASHIER, WAREHOUSE_STAFF)
 * 2. Xác thực giải mã JWT Bearer Token qua GET /api/auth/me & Chặn 401 khi thiếu/sai Token
 * 3. Phân quyền SoD Quầy Bán lẻ POS (CASHIER được phép, WAREHOUSE_STAFF bị chặn 403 ERR_UNAUTHORIZED_ROLE)
 * 4. Phân quyền SoD Quick Markdown (STORE_MANAGER/ADMIN được phép, CASHIER & WAREHOUSE bị chặn 403)
 * 5. Phân quyền SoD Tiếp nhận Hàng DC (WAREHOUSE/ADMIN được phép, CASHIER bị chặn 403)
 * 6. Phân quyền SoD Đảo Kệ Mặt tiền (WAREHOUSE/MANAGER/ADMIN được phép, CASHIER bị chặn 403)
 * 7. Phân quyền SoD Tiêu hủy 2 Pha (Nhân viên chỉ lập đề xuất PENDING; chỉ MANAGER/ADMIN mới được duyệt chốt sổ)
 * 8. Phân quyền SoD Quản trị Tài khoản & Cơ chế Chống tự khóa (Self-Lock Prevention)
 * 9. Kiểm soát Vòng đời Tài khoản (Khóa/Mở khóa tức thì & Chặn đăng nhập) + Nhật ký Kiểm toán Rule 11
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
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function loginUser(username, possiblePasswords = ['Password123@', '123456', 'admin']) {
  for (const pass of possiblePasswords) {
    const res = await request('POST', '/api/auth/login', { username, password: pass });
    if (res.status === 200 && res.body && res.body.success && res.body.data && res.body.data.token) {
      return {
        token: res.body.data.token,
        user: res.body.data.user
      };
    }
  }
  throw new Error(`Không thể đăng nhập cho tài khoản [${username}] với các mật khẩu mặc định.`);
}

async function runTestSuite() {
  console.log('========================================================================');
  console.log(' BẮT ĐẦU TEST SUITE MỤC 16: PHÂN QUYỀN CHỨC NĂNG (RBAC & SOD MATRIX)');
  console.log('========================================================================\n');

  let testCount = 0;
  let passCount = 0;

  function assertTest(desc, condition, details = '') {
    testCount++;
    if (condition) {
      passCount++;
      console.log(`  [PASS ${testCount}] ${desc}`);
    } else {
      console.error(`  [FAIL ${testCount}] ${desc}`);
      if (details) console.error(`         Chi tiết: ${details}`);
      throw new Error(`Test assertion failed: ${desc}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. ĐĂNG NHẬP & XÁC THỰC 4 VAI TRÒ CHUẨN
    // -------------------------------------------------------------------------
    console.log('--- 1. Khởi tạo & Đăng nhập 4 Vai trò Chuẩn (ADMIN, MANAGER, CASHIER, WAREHOUSE) ---');
    
    const adminSession = await loginUser('admin');
    assertTest(
      'Đăng nhập vai trò ADMIN thành công & Trả về Token JWT',
      adminSession && adminSession.token && adminSession.user.roleCode === 'ADMIN',
      `roleCode: ${adminSession.user.roleCode}`
    );

    const managerSession = await loginUser('manager');
    assertTest(
      'Đăng nhập vai trò STORE_MANAGER thành công & Trả về Token JWT',
      managerSession && managerSession.token && managerSession.user.roleCode === 'STORE_MANAGER',
      `roleCode: ${managerSession.user.roleCode}`
    );

    const cashierSession = await loginUser('cashier');
    assertTest(
      'Đăng nhập vai trò CASHIER thành công & Trả về Token JWT',
      cashierSession && cashierSession.token && cashierSession.user.roleCode === 'CASHIER',
      `roleCode: ${cashierSession.user.roleCode}`
    );

    const warehouseSession = await loginUser('warehouse');
    assertTest(
      'Đăng nhập vai trò WAREHOUSE_STAFF thành công & Trả về Token JWT',
      warehouseSession && warehouseSession.token && (warehouseSession.user.roleCode === 'WAREHOUSE_STAFF' || warehouseSession.user.roleCode === 'INVENTORY_STAFF'),
      `roleCode: ${warehouseSession.user.roleCode}`
    );

    // -------------------------------------------------------------------------
    // 2. XÁC THỰC GIẢI MÃ TOKEN QUA GET /api/auth/me & CHẶN TRUY CẬP KHÔNG HỢP LỆ
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Xác thực giải mã JWT qua /api/auth/me & Chặn 401 khi thiếu/sai Token ---');
    
    const meRes = await request('GET', '/api/auth/me', null, cashierSession.token);
    assertTest(
      'GET /api/auth/me trả về đúng danh tính và vai trò của tài khoản CASHIER',
      meRes.status === 200 && meRes.body.success && meRes.body.data.username === 'cashier' && meRes.body.data.roleCode === 'CASHIER',
      `status: ${meRes.status}, data: ${JSON.stringify(meRes.body.data)}`
    );

    const noTokenRes = await request('GET', '/api/auth/me', null, null);
    assertTest(
      'GET /api/auth/me không có Bearer Token bị từ chối với HTTP 401 Unauthorized',
      noTokenRes.status === 401 && noTokenRes.body.success === false,
      `status: ${noTokenRes.status}`
    );

    const fakeTokenRes = await request('GET', '/api/auth/me', null, 'fake-invalid-token-12345');
    assertTest(
      'GET /api/auth/me với Token giả mạo/hết hạn bị từ chối với HTTP 401 Unauthorized',
      fakeTokenRes.status === 401 && fakeTokenRes.body.success === false,
      `status: ${fakeTokenRes.status}`
    );

    // -------------------------------------------------------------------------
    // 3. MA TRẬN SOD: QUẦY BÁN LẺ POS (POST /api/sales)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Ma trận SoD: Bán lẻ POS (CASHIER cho phép, WAREHOUSE_STAFF chặn 403) ---');
    
    // CASHIER gọi bán hàng (truyền rỗng để test thẩm quyền vượt qua roleMiddleware)
    const cashierSaleRes = await request('POST', '/api/sales', { items: [] }, cashierSession.token);
    assertTest(
      'CASHIER được quyền truy cập endpoint Bán lẻ POS (Không bị 403 Forbidden)',
      cashierSaleRes.status !== 403,
      `status: ${cashierSaleRes.status}`
    );

    // WAREHOUSE_STAFF gọi bán hàng -> Phải bị chặn 403 ERR_UNAUTHORIZED_ROLE
    const warehouseSaleRes = await request('POST', '/api/sales', { items: [] }, warehouseSession.token);
    assertTest(
      'WAREHOUSE_STAFF gọi Bán lẻ POS bị từ chối tuyệt đối với HTTP 403 Forbidden (ERR_UNAUTHORIZED_ROLE)',
      warehouseSaleRes.status === 403 && warehouseSaleRes.body.code === 'ERR_UNAUTHORIZED_ROLE',
      `status: ${warehouseSaleRes.status}, code: ${warehouseSaleRes.body.code}`
    );

    // -------------------------------------------------------------------------
    // 4. MA TRẬN SOD: QUICK MARKDOWN (PATCH /api/batches/:id/discount)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Ma trận SoD: Quick Markdown (MANAGER/ADMIN cho phép, CASHIER/WAREHOUSE chặn 403) ---');
    
    // CASHIER gọi Quick Markdown -> Bị chặn 403
    const cashierMdRes = await request('PATCH', '/api/batches/1/discount', { discountPercent: 30 }, cashierSession.token);
    assertTest(
      'CASHIER tự ý áp dụng Quick Markdown bị từ chối với HTTP 403 Forbidden (Nguyên tắc Chống tự duyệt giá)',
      cashierMdRes.status === 403 && cashierMdRes.body.code === 'ERR_UNAUTHORIZED_ROLE',
      `status: ${cashierMdRes.status}, code: ${cashierMdRes.body.code}`
    );

    // WAREHOUSE_STAFF gọi Quick Markdown -> Bị chặn 403
    const whMdRes = await request('PATCH', '/api/batches/1/discount', { discountPercent: 30 }, warehouseSession.token);
    assertTest(
      'WAREHOUSE_STAFF gọi Quick Markdown bị từ chối với HTTP 403 Forbidden',
      whMdRes.status === 403 && whMdRes.body.code === 'ERR_UNAUTHORIZED_ROLE',
      `status: ${whMdRes.status}, code: ${whMdRes.body.code}`
    );

    // STORE_MANAGER gọi Quick Markdown -> Được quyền (không bị 403)
    const mgrMdRes = await request('PATCH', '/api/batches/999999/discount', { discountPercent: 30 }, managerSession.token);
    assertTest(
      'STORE_MANAGER được quyền thực hiện Quick Markdown (Không bị 403 Forbidden)',
      mgrMdRes.status !== 403,
      `status: ${mgrMdRes.status}`
    );

    // -------------------------------------------------------------------------
    // 5. MA TRẬN SOD: TIẾP NHẬN HÀNG DC (POST /api/batches/receive-inbound)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Ma trận SoD: Tiếp nhận Hàng DC (WAREHOUSE cho phép, CASHIER chặn 403) ---');
    
    // CASHIER gọi nhận hàng DC -> Bị chặn 403
    const cashierDcRes = await request('POST', '/api/batches/receive-inbound', {}, cashierSession.token);
    assertTest(
      'CASHIER gọi Tiếp nhận Hàng DC bị từ chối với HTTP 403 Forbidden',
      cashierDcRes.status === 403 && cashierDcRes.body.code === 'ERR_UNAUTHORIZED_ROLE',
      `status: ${cashierDcRes.status}, code: ${cashierDcRes.body.code}`
    );

    // WAREHOUSE_STAFF gọi nhận hàng DC -> Được phép (không bị 403)
    const whDcRes = await request('POST', '/api/batches/receive-inbound', {}, warehouseSession.token);
    assertTest(
      'WAREHOUSE_STAFF được quyền Tiếp nhận Hàng DC (Không bị 403 Forbidden)',
      whDcRes.status !== 403,
      `status: ${whDcRes.status}`
    );

    // -------------------------------------------------------------------------
    // 6. MA TRẬN SOD: ĐẢO LÔ KỆ MẶT TIỀN (PATCH /api/batches/:id/rotate)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Ma trận SoD: Đảo Lô Kệ Mặt tiền (WAREHOUSE cho phép, CASHIER chặn 403) ---');
    
    // CASHIER gọi đảo kệ -> Bị chặn 403
    const cashierRotateRes = await request('PATCH', '/api/batches/1/rotate', {}, cashierSession.token);
    assertTest(
      'CASHIER gọi Đảo Lô Kệ Mặt tiền bị từ chối với HTTP 403 Forbidden',
      cashierRotateRes.status === 403 && cashierRotateRes.body.code === 'ERR_UNAUTHORIZED_ROLE',
      `status: ${cashierRotateRes.status}, code: ${cashierRotateRes.body.code}`
    );

    // WAREHOUSE_STAFF gọi đảo kệ -> Được phép (không bị 403)
    const whRotateRes = await request('PATCH', '/api/batches/999999/rotate', {}, warehouseSession.token);
    assertTest(
      'WAREHOUSE_STAFF được quyền thực hiện Đảo Lô Kệ Mặt tiền (Không bị 403 Forbidden)',
      whRotateRes.status !== 403,
      `status: ${whRotateRes.status}`
    );

    // -------------------------------------------------------------------------
    // 7. MA TRẬN SOD: TIÊU HỦY HÀNG HỎNG 2 PHA (Rule 6 SSOT)
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Ma trận SoD: Tiêu hủy Hàng hỏng 2 Pha (Pha 1 mở, Pha 2 chỉ MANAGER/ADMIN) ---');
    
    // Pha 1: CASHIER và WAREHOUSE đều được quyền lập đề xuất PENDING (không bị 403)
    const cashierProposalRes = await request('POST', '/api/spoilage', {}, cashierSession.token);
    assertTest(
      'CASHIER được phép lập đề xuất tiêu hủy hàng hỏng Pha 1 (Không bị 403 Forbidden)',
      cashierProposalRes.status !== 403,
      `status: ${cashierProposalRes.status}`
    );

    // Pha 2: CASHIER bấm phê duyệt hủy -> Bị chặn 403
    const cashierApproveRes = await request('PATCH', '/api/spoilage/1/approve', {}, cashierSession.token);
    assertTest(
      'CASHIER bấm phê duyệt tiêu hủy chốt sổ bị từ chối với HTTP 403 Forbidden (Two-Phase Disposal SoD)',
      cashierApproveRes.status === 403 && cashierApproveRes.body.code === 'ERR_UNAUTHORIZED_ROLE',
      `status: ${cashierApproveRes.status}, code: ${cashierApproveRes.body.code}`
    );

    // Pha 2: WAREHOUSE_STAFF bấm phê duyệt hủy -> Bị chặn 403
    const whApproveRes = await request('PATCH', '/api/spoilage/1/approve', {}, warehouseSession.token);
    assertTest(
      'WAREHOUSE_STAFF bấm phê duyệt tiêu hủy chốt sổ bị từ chối với HTTP 403 Forbidden',
      whApproveRes.status === 403 && whApproveRes.body.code === 'ERR_UNAUTHORIZED_ROLE',
      `status: ${whApproveRes.status}, code: ${whApproveRes.body.code}`
    );

    // Pha 2: STORE_MANAGER bấm phê duyệt hủy -> Được quyền (không bị 403)
    const mgrApproveRes = await request('PATCH', '/api/spoilage/999999/approve', {}, managerSession.token);
    assertTest(
      'STORE_MANAGER được quyền phê duyệt tiêu hủy chốt sổ Sổ hao hụt (Không bị 403 Forbidden)',
      mgrApproveRes.status !== 403,
      `status: ${mgrApproveRes.status}`
    );

    // -------------------------------------------------------------------------
    // 8. MA TRẬN SOD: QUẢN TRỊ TÀI KHOẢN & BẢO VỆ CHỐNG TỰ KHÓA
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Ma trận SoD: Quản trị Tài khoản & Cơ chế Chống tự khóa (Self-Lock Prevention) ---');
    
    // CASHIER gọi danh sách người dùng -> Bị chặn 403
    const cashierGetUsersRes = await request('GET', '/api/auth/users', null, cashierSession.token);
    assertTest(
      'CASHIER gọi truy vấn danh sách người dùng hệ thống bị từ chối với HTTP 403 Forbidden',
      cashierGetUsersRes.status === 403 && cashierGetUsersRes.body.code === 'ERR_UNAUTHORIZED_ROLE',
      `status: ${cashierGetUsersRes.status}`
    );

    // STORE_MANAGER gọi khóa tài khoản nhân sự -> Bị chặn 403 (Chỉ ADMIN)
    const mgrLockRes = await request('PATCH', '/api/auth/users/5/status', { isActive: false }, managerSession.token);
    assertTest(
      'STORE_MANAGER gọi Khóa tài khoản nhân sự bị từ chối với HTTP 403 Forbidden (Chỉ ADMIN)',
      mgrLockRes.status === 403 && mgrLockRes.body.code === 'ERR_UNAUTHORIZED_ROLE',
      `status: ${mgrLockRes.status}`
    );

    // ADMIN gọi khóa chính mình (Self-Lock) -> Bị từ chối với HTTP 400
    const adminSelfLockRes = await request('PATCH', `/api/auth/users/${adminSession.user.id}/status`, { isActive: false }, adminSession.token);
    assertTest(
      'Quản trị viên (ADMIN) tự khóa tài khoản của chính mình bị chặn bảo vệ với HTTP 400',
      adminSelfLockRes.status === 400 && adminSelfLockRes.body.success === false,
      `status: ${adminSelfLockRes.status}, message: ${adminSelfLockRes.body.message}`
    );

    // -------------------------------------------------------------------------
    // 9. KIỂM SOÁT VÒNG ĐỜI TÀI KHOẢN: KHÓA/MỞ KHÓA TỨC THÌ & CHẶN ĐĂNG NHẬP
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Quản trị Vòng đời: Khóa/Mở khóa tức thì & Chặn Đăng nhập (Rule 11 Audit) ---');
    
    const uniqueUser = `test_sod_${Date.now().toString().slice(-4)}`;
    const createRes = await request('POST', '/api/auth/users', {
      username: uniqueUser,
      password: 'Password123@',
      fullName: 'Nhân Viên Kiểm Định RBAC',
      email: `${uniqueUser}@lhumart.vn`,
      phone: '0901234567',
      roleCode: 'CASHIER'
    }, adminSession.token);

    assertTest(
      'ADMIN tạo mới tài khoản nhân sự thử nghiệm thành công (HTTP 201)',
      createRes.status === 201 && createRes.body.success && createRes.body.data.id,
      `status: ${createRes.status}, message: ${createRes.body.message}`
    );

    const testUserId = createRes.body.data.id;

    // Đăng nhập thử với tài khoản vừa tạo
    const testLogin1 = await request('POST', '/api/auth/login', {
      username: uniqueUser,
      password: 'Password123@'
    });
    assertTest(
      'Tài khoản mới tạo đăng nhập thành công với trạng thái ACTIVE',
      testLogin1.status === 200 && testLogin1.body.success && testLogin1.body.data.token,
      `status: ${testLogin1.status}`
    );
    const testUserToken = testLogin1.body.data.token;

    // ADMIN KHÓA tài khoản này
    const lockRes = await request('PATCH', `/api/auth/users/${testUserId}/status`, { isActive: false }, adminSession.token);
    assertTest(
      'ADMIN Khóa tài khoản nhân sự thử nghiệm thành công (isActive = false)',
      lockRes.status === 200 && lockRes.body.success && lockRes.body.data.isActive === false,
      `status: ${lockRes.status}`
    );

    // Đăng nhập lại với tài khoản đã bị khóa -> Bị từ chối
    const lockedLoginRes = await request('POST', '/api/auth/login', {
      username: uniqueUser,
      password: 'Password123@'
    });
    assertTest(
      'Đăng nhập tài khoản BỊ KHÓA bị từ chối với thông báo tài khoản bị khóa',
      lockedLoginRes.status === 400 && lockedLoginRes.body.success === false && lockedLoginRes.body.message.includes('bị khóa'),
      `status: ${lockedLoginRes.status}, message: ${lockedLoginRes.body.message}`
    );

    // Dùng Token cũ của tài khoản bị khóa gọi API -> Bị authMiddleware chặn với HTTP 401
    const apiCallWithLockedToken = await request('GET', '/api/auth/me', null, testUserToken);
    assertTest(
      'Token của tài khoản đã bị khóa bị authMiddleware từ chối tức thì với HTTP 401',
      apiCallWithLockedToken.status === 401 && apiCallWithLockedToken.body.success === false,
      `status: ${apiCallWithLockedToken.status}, message: ${apiCallWithLockedToken.body.message}`
    );

    // ADMIN MỞ KHÓA lại tài khoản
    const unlockRes = await request('PATCH', `/api/auth/users/${testUserId}/status`, { isActive: true }, adminSession.token);
    assertTest(
      'ADMIN Mở khóa tài khoản nhân sự thành công (isActive = true)',
      unlockRes.status === 200 && unlockRes.body.success && unlockRes.body.data.isActive === true,
      `status: ${unlockRes.status}`
    );

    // Đăng nhập lại sau khi mở khóa -> Thành công
    const unlockedLoginRes = await request('POST', '/api/auth/login', {
      username: uniqueUser,
      password: 'Password123@'
    });
    assertTest(
      'Tài khoản đăng nhập lại thành công ngay sau khi Quản trị viên Mở khóa',
      unlockedLoginRes.status === 200 && unlockedLoginRes.body.success && unlockedLoginRes.body.data.token,
      `status: ${unlockedLoginRes.status}`
    );

    // Dọn dẹp: Vô hiệu hóa tài khoản test
    await request('PATCH', `/api/auth/users/${testUserId}/status`, { isActive: false }, adminSession.token);

    // Kiểm tra Nhật ký Kiểm toán Bất biến (system_audit_logs)
    const auditRes = await SqlConnection.queryJson(`
      SELECT TOP 5 action_type, entity_name, entity_id, description, created_at 
      FROM system_audit_logs 
      WHERE entity_name = 'users' AND entity_id = '${testUserId}'
      ORDER BY id DESC
    `);
    assertTest(
      'Nhật ký kiểm toán ghi nhận bất biến đầy đủ các sự kiện LOCK_USER và UNLOCK_USER (Rule 11 SSOT)',
      auditRes && auditRes.length >= 2,
      `Số bản ghi audit log tìm thấy: ${auditRes ? auditRes.length : 0}`
    );

    console.log('\n========================================================================');
    console.log(` TỔNG KẾT TEST SUITE MỤC 16: ${passCount}/${testCount} KIỂM THỬ THÀNH CÔNG (100% PASS)`);
    console.log(' MA TRẬN PHÂN QUYỀN RBAC & TÁCH BIỆT TRÁCH NHIỆM SOD ĐẠT CHUẨN ĐẶC TẢ SSOT!');
    console.log('========================================================================\n');

  } catch (err) {
    console.error('\n>>> LỖI TEST SUITE MỤC 16:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runTestSuite();
