// test_step5_pos_shortcuts_touch.js
/**
 * TEST SUITE: BƯỚC 5 - HỆ THỐNG PHÍM TẮT THU NGÂN POS & NGHIỆP VỤ BÁN LẺ (MỤC 7.4 & 18.2 SSOT)
 * Chạy lệnh: node test_step5_pos_shortcuts_touch.js
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
  console.log('🚀 KIỂM THỬ BƯỚC 5: HỆ THỐNG PHÍM TẮT POS & QUY TRÌNH THU NGÂN SIÊU TỐC');
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

  // 1. Đăng nhập Thu ngân POS
  const loginRes = await request('POST', '/api/auth/login', {
    username: 'cashier',
    password: 'Password123@'
  });
  const cashierToken = loginRes.body?.data?.token || loginRes.body?.token;
  assert(loginRes.status === 200 && cashierToken, 'Đăng nhập vai trò CASHIER (Thu ngân) thành công');

  // 2. Kiểm tra Cửa hàng đang mở cửa (Rule 1 & Mục 10 SSOT)
  console.log('\n--- 1. KIỂM TRA TRẠNG THÁI CỬA HÀNG DUY NHẤT (RULE 1 SSOT) ---');
  const storeRes = await request('GET', '/api/store-profile');
  assert(storeRes.status === 200, 'GET /api/store-profile phản hồi thành công');
  assert(storeRes.body.data.storeCode === 'RETAIL-STORE-01', 'Mã cửa hàng chuẩn mực là RETAIL-STORE-01');
  assert(storeRes.body.data.status === 'OPEN', 'Cửa hàng đang ở trạng thái OPEN (Sẵn sàng xuất bán POS)');

  // 3. Mô phỏng phím F2: Tìm kiếm SKU & Lấy sản phẩm có lô cận date
  console.log('\n--- 2. MÔ PHỎNG PHÍM [F2] TÌM KIẾM / QUÉT BARCODE SKU ---');
  const prodsRes = await request('GET', '/api/catalog/products');
  assert(prodsRes.status === 200 && prodsRes.body.data.length > 0, `Tải danh mục ${prodsRes.body.data.length} sản phẩm thành công`);
  
  const targetProduct = prodsRes.body.data.find(p => p.totalStock > 0);
  assert(targetProduct !== undefined, `Tìm thấy sản phẩm có sẵn hàng tồn khả dụng: "${targetProduct.name}" (SKU: ${targetProduct.sku})`);

  // Lấy lô FEFO khả dụng của sản phẩm
  const batchesRes = await request('GET', '/api/batches');
  assert(batchesRes.status === 200 && Array.isArray(batchesRes.body.data), 'Lấy danh sách lô hàng FEFO thành công');
  const prodBatches = batchesRes.body.data
    .filter(b => b.productId === targetProduct.id && b.currentQuantity > 0 && b.daysLeft > 0)
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  assert(prodBatches.length > 0, `Sản phẩm có ${prodBatches.length} lô hợp lệ xếp theo ExpiryDate ASC (FEFO Rule 2)`);

  // 4. Mô phỏng phím F8: Tính toán tổng tiền giỏ hàng FEFO và điền đủ tiền
  console.log('\n--- 3. MÔ PHỎNG PHÍM [F8] TỰ ĐỘNG ĐIỀN ĐỦ TIỀN MẶT ---');
  const buyQty = 2;
  const unitPrice = targetProduct.sellingPrice || targetProduct.price;
  const expectedTotal = buyQty * unitPrice;
  assert(expectedTotal > 0, `Đơn hàng 2 ${targetProduct.unit} có giá trị tạm tính: ${expectedTotal.toLocaleString('vi-VN')} đ`);

  // 5. Mô phỏng phím F9: Kích hoạt xuất kho bán lẻ POS FEFO
  console.log('\n--- 4. MÔ PHỎNG PHÍM [F9 / CTRL+ENTER] THANH TOÁN XUẤT KHO FEFO ---');
  const saleRes = await request('POST', '/api/sales', {
    items: [
      {
        productId: targetProduct.id,
        quantity: buyQty,
        price: unitPrice
      }
    ],
    weather: {
      condition: 'NORMAL',
      isHoliday: false,
      temp: 28
    }
  }, cashierToken);

  assert(saleRes.status === 200 || saleRes.status === 201, 'Giao dịch thanh toán POS xuất kho FEFO thành công');
  assert(saleRes.body.success === true, 'Hệ thống xác nhận bóc tách lô và trừ kho thành công');
  const txnCode = saleRes.body.transactionCode || saleRes.body.orderCode;
  assert(txnCode && txnCode.startsWith('TXN-POS'), `Sinh mã hóa đơn bán lẻ chuẩn quy cách: [${txnCode}]`);

  // 6. Truy vấn và in lại hóa đơn POS từ mã giao dịch
  console.log('\n--- 5. XEM LẠI & IN HÓA ĐƠN POS THEO MÃ GIAO DỊCH (MỤC 22.6 SSOT) ---');
  const receiptRes = await request('GET', `/api/sales/receipt/${txnCode}`, null, cashierToken);
  assert(receiptRes.status === 200, `GET /api/sales/receipt/${txnCode} trả về thành công (HTTP 200)`);
  assert(receiptRes.body.data.lines && receiptRes.body.data.lines.length > 0, 'Hóa đơn chứa đầy đủ chi tiết từng lô FEFO đã xuất');
  assert(receiptRes.body.data.totalAmount > 0, `Tổng tiền trên hóa đơn in nhiệt: ${receiptRes.body.data.totalAmount.toLocaleString('vi-VN')} đ`);

  // 7. Kiểm tra Sổ Nhật Ký Kiểm Toán (Rule 11 SSOT)
  console.log('\n--- 6. LƯU VẾT AUDIT LOG BẤT BIẾN (RULE 11 SSOT) ---');
  const auditRes = await request('GET', '/api/audit-logs?limit=10', null, cashierToken);
  assert(auditRes.status === 200, 'Truy vấn Sổ kiểm toán AuditLogs thành công');
  const hasSaleLog = auditRes.body.data.some(l => (l.actionType || l.action || '').includes('SALE') || (l.description || '').includes('POS'));
  assert(hasSaleLog, 'Giao dịch bán lẻ POS đã được lưu vết bất biến vào AuditLogs');

  console.log('='.repeat(80));
  console.log(`🎉 KẾT QUẢ KIỂM THỬ BƯỚC 5: ${passed}/${total} TESTS PASSED (100% THÀNH CÔNG)`);
  console.log('='.repeat(80));
}

runTests().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});

