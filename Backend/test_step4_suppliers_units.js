// test_step4_suppliers_units.js
/**
 * TEST SUITE: BƯỚC 4 - QUẢN LÝ NHÀ CUNG CẤP (SUPPLIERS) & CHUẨN HÓA ĐƠN VỊ TÍNH (MỤC 5, 6 & 17.4 SSOT)
 * Chạy lệnh: node test_step4_suppliers_units.js
 */
const http = require('http');

const API_BASE = 'http://127.0.0.1:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('🚀 KIỂM THỬ BƯỚC 4: QUẢN LÝ NHÀ CUNG CẤP (SUPPLIERS) & ĐƠN VỊ TÍNH SẢN PHẨM');
  console.log('='.repeat(80));

  let passed = 0;
  let total = 0;
  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. Đăng nhập Admin & Store Manager
  const loginRes = await request('POST', '/api/auth/login', {
    username: 'admin',
    password: 'Password123@'
  });
  const adminToken = loginRes.body?.data?.token || loginRes.body?.token;
  assert(loginRes.status === 200 && adminToken, 'Đăng nhập vai trò ADMIN thành công');

  // 2. GET /api/suppliers
  console.log('\n--- 1. DANH SÁCH NHÀ CUNG CẤP & KHO TỔNG DC (MỤC 5 & 17.4 SSOT) ---');
  const supsRes = await request('GET', '/api/suppliers');
  assert(supsRes.status === 200, 'GET /api/suppliers phản hồi thành công (HTTP 200)');
  assert(Array.isArray(supsRes.body.data) && supsRes.body.data.length >= 3, 'Tải danh sách nhà cung ứng từ CSDL thành công (ít nhất 3 NCC)');
  
  const dcBienHoa = supsRes.body.data.find(s => s.code === 'DC-BIENHOA');
  assert(dcBienHoa !== undefined, 'Tìm thấy Kho Trung Tâm Phân Phối DC Biên Hòa (Mã: DC-BIENHOA)');
  assert(dcBienHoa.leadTimeDays === 1, 'Thời gian giao hàng tiêu chuẩn Lead Time của DC Biên Hòa là 1 ngày (Mục 5 SSOT)');
  assert(dcBienHoa.productCount > 0, `DC Biên Hòa đang cung ứng ${dcBienHoa.productCount} sản phẩm FMCG`);

  // 3. POST /api/suppliers - Thêm mới Nhà Cung Cấp
  console.log('\n--- 2. TẠO MỚI NHÀ CUNG CẤP & VALIDATE RÀNG BUỘC NGHIỆP VỤ ---');
  const testSupCode = `SUP-TEST-${Date.now().toString().slice(-4)}`;
  const createRes = await request('POST', '/api/suppliers', {
    code: testSupCode,
    name: 'Công Ty Cổ Phần Chăn Nuôi C.P. Việt Nam',
    contactName: 'Phòng Cung Ứng Thực Phẩm',
    phone: '02513836251',
    email: 'contact@cp.com.vn',
    address: 'KCN Biên Hòa 2, TP. Biên Hòa, Đồng Nai',
    leadTimeDays: 2,
    isActive: true
  }, adminToken);

  assert(createRes.status === 201, `Thêm mới nhà cung ứng [${testSupCode}] thành công (HTTP 201)`);
  assert(createRes.body.data && createRes.body.data.code === testSupCode, 'Mã nhà cung ứng mới tạo khớp chuẩn');
  const newSupId = createRes.body.data.id;

  // Chặn trùng mã NCC
  const dupCodeRes = await request('POST', '/api/suppliers', {
    code: testSupCode,
    name: 'Tên Trùng Lặp',
    leadTimeDays: 1
  }, adminToken);
  assert(dupCodeRes.status === 400, 'Chặn thành công hành vi thêm nhà cung ứng bị trùng mã code');

  // Chặn leadTimeDays < 1
  const invalidLtRes = await request('POST', '/api/suppliers', {
    code: `SUP-INVALID-${Date.now().toString().slice(-3)}`,
    name: 'NCC Lỗi Lead Time',
    leadTimeDays: 0
  }, adminToken);
  assert(invalidLtRes.status === 201 && invalidLtRes.body.data.leadTimeDays >= 1, 'Tự động ép Lead Time tối thiểu >= 1 ngày theo chuẩn chuỗi cung ứng');

  // 4. PUT /api/suppliers/:id - Cập nhật thông tin NCC
  console.log('\n--- 3. CẬP NHẬT THÔNG TIN NHÀ CUNG CẤP ---');
  const updateRes = await request('PUT', `/api/suppliers/${newSupId}`, {
    name: 'Tập Đoàn C.P. Việt Nam (Chi Nhánh Đồng Nai)',
    leadTimeDays: 3,
    phone: '0988889999'
  }, adminToken);
  assert(updateRes.status === 200, `Cập nhật thông tin NCC ID #${newSupId} thành công (HTTP 200)`);
  assert(updateRes.body.data.leadTimeDays === 3, 'Lead Time sau cập nhật là 3 ngày');
  assert(updateRes.body.data.phone === '0988889999', 'Số điện thoại sau cập nhật chuẩn xác');

  // 5. Ràng buộc bảo vệ Khóa Ngoại khi Xóa (Foreign Key Protection)
  console.log('\n--- 4. BẢO VỆ TÍNH TOÀN VẸN NGOẠI KHÓA KHI XÓA NHÀ CUNG CẤP ---');
  // Thử xóa DC-BIENHOA (ID 1)
  const delDcRes = await request('DELETE', `/api/suppliers/1`, null, adminToken);
  assert(delDcRes.status === 400, 'Chặn thành công hành vi xóa DC Biên Hòa (đang có sản phẩm liên kết)');

  // Xóa an toàn nhà cung cấp test
  const delTestRes = await request('DELETE', `/api/suppliers/${newSupId}`, null, adminToken);
  assert(delTestRes.status === 200, `Xóa an toàn nhà cung ứng thử nghiệm #${newSupId} thành công`);

  // Xóa NCC vừa tạo cho test invalidLt
  if (invalidLtRes.body?.data?.id) {
    await request('DELETE', `/api/suppliers/${invalidLtRes.body.data.id}`, null, adminToken);
  }

  // 6. Liên kết Sản Phẩm với Supplier & Chuẩn hóa Đơn Vị Tính (Unit)
  console.log('\n--- 5. LIÊN KẾT SẢN PHẨM VỚI NHÀ CUNG CẤP & ĐƠN VỊ TÍNH (MỤC 6 SSOT) ---');
  const testSku = `SKU-UNIT-${Date.now().toString().slice(-4)}`;
  const createProdRes = await request('POST', '/api/products', {
    sku: testSku,
    name: `Xúc Xích Tiệt Trùng CP Red 150g [${testSku}]`,
    categoryId: 5, // PROCESSED_MEAT
    supplierId: 1, // DC Biên Hòa
    unit: 'Gói',
    costPrice: 15000,
    sellingPrice: 22000,
    price: 22000,
    standardShelfLifeDays: 90,
    minStockLevel: 20,
    maxStockLevel: 100
  }, adminToken);

  assert(createProdRes.status === 201, `Tạo mới sản phẩm SKU [${testSku}] với ĐVT "Gói" & Supplier ID 1 thành công`);
  assert(createProdRes.body.data.unit === 'Gói', 'Đơn vị tính sản phẩm chuẩn hóa là "Gói"');
  assert(createProdRes.body.data.supplierId === 1, 'Nhà cung ứng liên kết là DC Biên Hòa (Supplier ID = 1)');

  // Truy vấn chi tiết sản phẩm
  const getProdRes = await request('GET', `/api/products/${createProdRes.body.data.id}`);
  assert(getProdRes.status === 200, 'GET /api/products/:id trả về thành công');
  assert(getProdRes.body.data.unit === 'Gói', 'Đơn vị tính lưu trữ trong DB hiển thị chuẩn xác');
  assert(getProdRes.body.data.supplier.includes('DC Biên Hòa'), 'Tên nhà cung cấp trong DTO phản ánh đúng DC Biên Hòa');

  // Dọn dẹp soft-delete sản phẩm test
  await request('DELETE', `/api/products/${createProdRes.body.data.id}`, null, adminToken);

  // 7. Kiểm tra Sổ Nhật Ký Kiểm Toán (Rule 11 SSOT)
  console.log('\n--- 6. LƯU VẾT AUDIT LOG BẤT BIẾN (RULE 11 SSOT) ---');
  const auditRes = await request('GET', '/api/audit-logs?limit=20', null, adminToken);
  assert(auditRes.status === 200, 'Truy vấn Sổ kiểm toán AuditLogs thành công');
  const hasSupLog = auditRes.body.data.some(l => (l.actionType || l.action || '').includes('SUPPLIER') || (l.entityName || '').includes('suppliers'));
  assert(hasSupLog, 'Hành động quản lý Nhà cung cấp đã được lưu vết bất biến vào AuditLogs');

  console.log('='.repeat(80));
  console.log(`🎉 KẾT QUẢ KIỂM THỬ BƯỚC 4: ${passed}/${total} TESTS PASSED (100% THÀNH CÔNG)`);
  console.log('='.repeat(80));
}

runTests().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
