/**
 * TEST BƯỚC 5 (STEP 19): KIỂM THỬ TOÀN DIỆN PRE-TRAINED AI MODEL (LIGHTGBM + OR-TOOLS)
 * VÀ ĐIỀU PHỐI LIÊN CỬA HÀNG (dbo.ai_forecasts & dbo.stock_transfers)
 */

const assert = require('assert');

const API_BASE = 'http://localhost:5000/api';

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function runTests() {
  console.log('======================================================================');
  console.log(' BẮT ĐẦU KIỂM THỬ BƯỚC 5: PRE-TRAINED LIGHTGBM + OR-TOOLS & TRANSFERS');
  console.log('======================================================================');

  // 1. Đăng nhập lấy token cho 3 Actor: OWNER (admin), MANAGER (manager), STAFF (cashier)
  const loginAdmin = await request('POST', '/auth/login', { username: 'admin', password: '123456' });
  assert.strictEqual(loginAdmin.status, 200, 'Admin login phải thành công');
  const adminToken = loginAdmin.json.data.token;

  const loginManager = await request('POST', '/auth/login', { username: 'manager', password: '123456' });
  assert.strictEqual(loginManager.status, 200, 'Manager login phải thành công');
  const managerToken = loginManager.json.data.token;

  const loginStaff = await request('POST', '/auth/login', { username: 'cashier', password: '123456' });
  assert.strictEqual(loginStaff.status, 200, 'Staff login phải thành công');
  const staffToken = loginStaff.json.data.token;
  console.log('✓ [TC-01] Đăng nhập thành công cả 3 Actor: OWNER (admin), MANAGER (manager), STAFF (cashier)');

  // 2. Kiểm thử Ma trận Cân bằng Cung - Cầu 3 Chi nhánh (GET /api/stock-transfers/ai-matrix)
  const matrixRes = await request('GET', '/stock-transfers/ai-matrix?weather=SUNNY&isHoliday=false', null, adminToken);
  assert.strictEqual(matrixRes.status, 200, 'GET /stock-transfers/ai-matrix phải trả về 200');
  assert.strictEqual(matrixRes.json.success, true);
  const matData = matrixRes.json.data;
  assert.strictEqual(matData.stores.length, 3, 'Chuỗi phải có đúng 3 chi nhánh (Store A, B, C)');
  assert.ok(matData.matrixByProduct.length >= 8, 'Ma trận phải dự báo cho tối thiểu 8 mặt hàng tươi sống/FMCG');
  assert.ok(matData.orToolsTransferProposals.length >= 1, 'OR-Tools phải phát hiện ít nhất 1 đề xuất điều chuyển khả thi');
  console.log(`✓ [TC-02] Ma trận AI 3 Chi nhánh hoạt động chuẩn (${matData.modelVersion} + ${matData.optimizerEngine}, ${matData.orToolsTransferProposals.length} đề xuất điều chuyển)`);

  // 3. Kiểm thử Chạy trực tiếp Pre-trained Model (.pkl) trên tập sample_retail_dataset.csv
  const infRes = await request('POST', '/stock-transfers/ai-inference', { limit: 6 }, adminToken);
  assert.strictEqual(infRes.status, 200, 'POST /stock-transfers/ai-inference phải trả về 200');
  assert.strictEqual(infRes.json.success, true);
  assert.strictEqual(infRes.json.data.totalDatasetRows, 1824, 'Dataset mẫu phải có đúng 1824 dòng');
  assert.strictEqual(infRes.json.data.testPredictions.length, 6, 'Phải trả về đúng 6 dòng kiểm thử thực nghiệm');
  console.log(`✓ [TC-03] Kiểm thử trực tiếp pretrained_lgbm_model.pkl trên sample_retail_dataset.csv thành công (MAE: ${infRes.json.data.metrics.mae}, Confidence: ${(infRes.json.data.metrics.confidence * 100).toFixed(2)}%)`);

  // 4. Tạo Phiếu đề xuất điều chuyển từ MANAGER (PROPOSED)
  const sampleProposal = matData.orToolsTransferProposals[0];
  const createRes = await request('POST', '/stock-transfers', {
    fromStoreId: sampleProposal.fromStoreId,
    toStoreId: sampleProposal.toStoreId,
    productId: sampleProposal.productId,
    sourceBatchId: sampleProposal.sourceBatchId,
    transferQuantity: sampleProposal.transferQuantity,
    shippingCost: 25000,
    aiRecommendationNote: sampleProposal.aiReason,
    autoApprove: false
  }, managerToken);
  assert.strictEqual(createRes.status, 201, 'MANAGER tạo đề xuất điều chuyển phải trả về 201');
  const createdTransfer = createRes.json.data;
  assert.strictEqual(createdTransfer.status, 'PROPOSED', 'Trạng thái khởi tạo từ MANAGER phải là PROPOSED');
  console.log(`✓ [TC-04] MANAGER khởi tạo thành công phiếu đề xuất điều chuyển ${createdTransfer.transferCode} (PROPOSED)`);

  // 5. Kiểm tra Chốt chặn Phân quyền RBAC: STAFF không được phép APPROVED lệnh điều chuyển (403 Forbidden)
  const staffApproveTry = await request('PATCH', `/stock-transfers/${createdTransfer.id}/status`, {
    status: 'APPROVED',
    notes: 'Staff cố tình duyệt'
  }, staffToken);
  assert.strictEqual(staffApproveTry.status, 403, 'STAFF duyệt lệnh điều chuyển phải bị chặn 403 Forbidden');
  console.log('✓ [TC-05] Chốt chặn RBAC/SoD hoạt động chuẩn: Chặn STAFF tự ý phê duyệt lệnh điều chuyển (403 Forbidden)');

  // 6. OWNER phê duyệt lệnh điều chuyển (PROPOSED -> APPROVED)
  const ownerApproveRes = await request('PATCH', `/stock-transfers/${createdTransfer.id}/status`, {
    status: 'APPROVED',
    notes: 'OWNER phê duyệt điều chuyển liên chi nhánh'
  }, adminToken);
  assert.strictEqual(ownerApproveRes.status, 200);
  assert.strictEqual(ownerApproveRes.json.data.status, 'APPROVED');
  console.log(`✓ [TC-06] OWNER phê duyệt thành công phiếu ${createdTransfer.transferCode} -> APPROVED`);

  // 7. STAFF tại Cửa hàng Xuất đóng gói & xuất hàng lên xe nội bộ (APPROVED -> IN_TRANSIT)
  const staffShipRes = await request('PATCH', `/stock-transfers/${createdTransfer.id}/status`, {
    status: 'IN_TRANSIT',
    notes: 'STAFF kho Store A đã xuất hàng lên xe nội bộ'
  }, staffToken);
  assert.strictEqual(staffShipRes.status, 200);
  assert.strictEqual(staffShipRes.json.data.status, 'IN_TRANSIT');
  console.log(`✓ [TC-07] STAFF Cửa hàng Xuất xác nhận xuất kho vận chuyển ${createdTransfer.transferCode} -> IN_TRANSIT`);

  // 8. STAFF tại Cửa hàng Nhận kiểm đếm & xác nhận nhận hàng (IN_TRANSIT -> RECEIVED)
  const staffReceiveRes = await request('PATCH', `/stock-transfers/${createdTransfer.id}/status`, {
    status: 'RECEIVED',
    notes: 'STAFF kho Store B đã nhận đủ hàng và trưng bày kệ FEFO'
  }, staffToken);
  assert.strictEqual(staffReceiveRes.status, 200);
  assert.strictEqual(staffReceiveRes.json.data.status, 'RECEIVED');
  assert.ok(staffReceiveRes.json.data.receivedAt, 'Phải ghi nhận thời điểm received_at');
  console.log(`✓ [TC-08] STAFF Cửa hàng Nhận xác nhận hoàn tất nhận hàng ${createdTransfer.transferCode} -> RECEIVED`);

  console.log('======================================================================');
  console.log(' TẤT CẢ 8 TEST CASES BƯỚC 5 ĐỀU PASS 100%!');
  console.log('======================================================================');
}

runTests().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
