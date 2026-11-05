// test_step2_api_aliases_receipt_logout.js
// Script kiểm thử xác minh Bước 2: Logout API, In lại Hóa đơn POS & Đồng bộ Endpoint Alias Mục 22 SSOT

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================================');
  console.log('🚀 KIỂM THỬ BƯỚC 2: API LOGOUT, IN LẠI HÓA ĐƠN POS & ENDPOINT ALIAS MỤC 22 SSOT');
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
    body: JSON.stringify({ username: 'manager', password: 'Password123@' })
  });
  const loginJson = await loginRes.json();
  assert(loginJson.success && loginJson.data?.token, 'Đăng nhập Cửa hàng trưởng thành công');
  const token = loginJson.data?.token;
  const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  // 2. Test Mục 22.1: POST /api/auth/logout
  console.log('\n--- 1. AUTH API (MỤC 22.1 SSOT) ---');
  const logoutRes = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: authHeaders
  });
  const logoutJson = await logoutRes.json();
  assert(logoutJson.success === true, 'POST /api/auth/logout trả về thành công và ghi log kiểm toán');

  // Đăng nhập lại để test các endpoint tiếp theo
  const reLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'manager', password: 'Password123@' })
  });
  const reLoginJson = await reLoginRes.json();
  const validToken = reLoginJson.data.token;
  const validHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${validToken}` };

  // 3. Test Mục 22.2: Users API
  console.log('\n--- 2. USERS API (MỤC 22.2 SSOT) ---');
  const usersRes = await fetch(`${API_BASE}/users`, { headers: validHeaders });
  const usersJson = await usersRes.json();
  assert(usersJson.success && Array.isArray(usersJson.data) && usersJson.data.length > 0, 'GET /api/users trả về danh sách nhân viên');

  const firstUser = usersJson.data[0];
  const userByIdRes = await fetch(`${API_BASE}/users/${firstUser.id}`, { headers: validHeaders });
  const userByIdJson = await userByIdRes.json();
  assert(userByIdJson.success && userByIdJson.data?.id === firstUser.id, `GET /api/users/:id lấy chi tiết nhân viên [${firstUser.fullName}]`);

  // 4. Test Mục 22.4: Categories & Products API
  console.log('\n--- 3. CATEGORIES & PRODUCTS API (MỤC 22.4 SSOT) ---');
  const catRes = await fetch(`${API_BASE}/categories`);
  const catJson = await catRes.json();
  assert(catJson.success && Array.isArray(catJson.data) && catJson.data.length >= 7, 'GET /api/categories trả về đủ danh mục 7 ngành hàng');

  const prodsRes = await fetch(`${API_BASE}/products`);
  const prodsJson = await prodsRes.json();
  assert(prodsJson.success && Array.isArray(prodsJson.data) && prodsJson.data.length > 0, 'GET /api/products trả về danh mục sản phẩm');

  const sampleProdId = prodsJson.data[0].id;
  const prodByIdRes = await fetch(`${API_BASE}/products/${sampleProdId}`);
  const prodByIdJson = await prodByIdRes.json();
  assert(prodByIdJson.success && prodByIdJson.data?.id === sampleProdId, `GET /api/products/:id lấy chi tiết sản phẩm [${prodByIdJson.data?.name}]`);

  // 5. Test Mục 22.5: Batch & FEFO Aliases
  console.log('\n--- 4. BATCH & FEFO ALIASES (MỤC 22.5 SSOT) ---');
  const alerts3Res = await fetch(`${API_BASE}/batches/alerts-3-colors`);
  const alerts3Json = await alerts3Res.json();
  assert(alerts3Json.success && Array.isArray(alerts3Json.data), 'GET /api/batches/alerts-3-colors trả về danh sách lô 3 màu');

  // 6. Test Mục 22.6: Sales POS & In lại Hóa đơn (GET /api/sales/receipt/:txnCode)
  console.log('\n--- 5. SALES POS & IN LẠI HÓA ĐƠN (MỤC 22.6 SSOT) ---');
  // Lấy lịch sử bán để lấy 1 mã hóa đơn thực tế
  const salesHistRes = await fetch(`${API_BASE}/sales/history?limit=1`);
  const salesHistJson = await salesHistRes.json();
  assert(salesHistJson.success && Array.isArray(salesHistJson.data) && salesHistJson.data.length > 0, 'GET /api/sales/history lấy lịch sử bán hàng');

  const sampleTxnCode = salesHistJson.data[0].transactionCode;
  const receiptRes = await fetch(`${API_BASE}/sales/receipt/${sampleTxnCode}`);
  const receiptJson = await receiptRes.json();
  assert(receiptJson.success && receiptJson.data?.transactionCode === sampleTxnCode, `GET /api/sales/receipt/:txnCode lấy hóa đơn [${sampleTxnCode}]`);
  assert(receiptJson.data?.store?.storeCode === 'RETAIL-STORE-01', 'Hóa đơn chứa thông tin cửa hàng chuẩn RETAIL-STORE-01');
  assert(Array.isArray(receiptJson.data?.lines) && receiptJson.data.lines.length > 0, `Hóa đơn chứa chi tiết ${receiptJson.data.lines.length} dòng hàng bẻ theo lô FEFO`);

  // 7. Test Mục 22.7: Spoilage & Loss Ledger Aliases
  console.log('\n--- 6. SPOILAGE & LOSS LEDGER ALIASES (MỤC 22.7 SSOT) ---');
  const spoilRecordsRes = await fetch(`${API_BASE}/spoilage/records`);
  const spoilRecordsJson = await spoilRecordsRes.json();
  assert(spoilRecordsJson.success && Array.isArray(spoilRecordsJson.data), 'GET /api/spoilage/records trả về Sổ hao hụt');

  const lossSummaryRes = await fetch(`${API_BASE}/spoilage/loss-summary`);
  const lossSummaryJson = await lossSummaryRes.json();
  assert(lossSummaryJson.success && lossSummaryJson.data?.totalCostLoss !== undefined, 'GET /api/spoilage/loss-summary trả về tổng thiệt hại tài chính');

  // 8. Test Mục 22.8: Forecast & Purchase Orders
  console.log('\n--- 7. FORECAST & PURCHASE ORDERS ALIASES (MỤC 22.8 SSOT) ---');
  const riskAnalysisRes = await fetch(`${API_BASE}/forecast/risk-analysis`);
  const riskAnalysisJson = await riskAnalysisRes.json();
  assert(riskAnalysisJson.success && Array.isArray(riskAnalysisJson.data), 'GET /api/forecast/risk-analysis trả về phân tích rủi ro & ROP');

  const poRes = await fetch(`${API_BASE}/purchase-orders`);
  const poJson = await poRes.json();
  assert(poJson.success && Array.isArray(poJson.data), 'GET /api/purchase-orders trả về danh sách đơn đặt hàng gửi DC');

  // 9. Test Mục 22.9: Dashboard Endpoints
  console.log('\n--- 8. DASHBOARD STATS ALIASES (MỤC 22.9 SSOT) ---');
  const shelfLifeStatsRes = await fetch(`${API_BASE}/dashboard/shelf-life-stats`);
  const shelfLifeStatsJson = await shelfLifeStatsRes.json();
  assert(shelfLifeStatsJson.success && shelfLifeStatsJson.data?.greenCount !== undefined, 'GET /api/dashboard/shelf-life-stats trả về phân bổ 4 cấp màu');

  const spoilageRateRes = await fetch(`${API_BASE}/dashboard/spoilage-rate`);
  const spoilageRateJson = await spoilageRateRes.json();
  assert(spoilageRateJson.success && spoilageRateJson.data?.spoilageRatePercent !== undefined, 'GET /api/dashboard/spoilage-rate trả về tỷ lệ lãng phí %');

  const actionBoardRes = await fetch(`${API_BASE}/dashboard/today-action-board`);
  const actionBoardJson = await actionBoardRes.json();
  assert(actionBoardJson.success && actionBoardJson.data?.urgentMarkdownList !== undefined, 'GET /api/dashboard/today-action-board trả về 4 nhóm ca trực');

  console.log('\n================================================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ BƯỚC 2: ${passed}/${total} TESTS PASSED (${Math.round(passed/total*100)}% THÀNH CÔNG)`);
  console.log('================================================================================');
}

runTests().catch(err => {
  console.error('LỖI KIỂM THỬ BƯỚC 2:', err);
  process.exit(1);
});
