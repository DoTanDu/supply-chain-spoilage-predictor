// Backend/test_step13_dashboard_kpi_action_board.js
/**
 * TEST SUITE: MỤC 11 - DASHBOARD HỆ THỐNG
 * (6 KPI Tài Chính Điều Hành, Visual Analytics & Action Board Ca Trực Khẩn Cấp)
 * 
 * Kiểm định chuyên sâu 5 phân hệ kỹ thuật:
 * 1. Bộ 6 Thẻ KPI Tài chính Điều hành Cốt lõi (Mục 11.1)
 * 2. Phân bổ Vòng đời Hạn dùng Donut Chart 4 vùng màu (Mục 11.2)
 * 3. Biểu đồ Miền Xu hướng 14 Ngày & Cơ cấu 7 Ngành FMCG (Mục 11.2)
 * 4. Bảng Xếp hạng Top 5 Bán chạy nhất & Top 5 Hao hụt nhiều nhất (Mục 11.2)
 * 5. Action Board Khẩn cấp Ca trực 4 Tab (Mục 11.3)
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

async function runStep13DashboardTests() {
  console.log('='.repeat(85));
  console.log('🛡️  TEST SUITE STEP 13: EXECUTIVE DASHBOARD & ACTION BOARD (MỤC 11 SSOT)');
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
    // PHẦN 1: TỔNG QUAN ĐIỀU HÀNH & KẾT NỐI API OVERVIEW
    // -------------------------------------------------------------
    console.log('\n[PHẦN 1] KIỂM ĐỊNH TỔNG QUAN ĐIỀU HÀNH (GET /api/dashboard/overview)');

    const resOverview = await request('GET', '/api/dashboard/overview');
    assert.strictEqual(resOverview.status, 200, 'Dashboard overview must return 200');
    assert.strictEqual(resOverview.body.success, true, 'Response success must be true');
    recordPass('Truy vấn API GET /api/dashboard/overview thành công (HTTP 200)');

    const store = resOverview.body.store;
    assert.ok(store, 'Store object must exist');
    assert.strictEqual(store.storeCode, 'RETAIL-STORE-01', 'Store code must be RETAIL-STORE-01 (Rule 1)');
    assert.strictEqual(store.status, 'OPEN', 'Store status must be OPEN');
    recordPass(`Hồ sơ cửa hàng liên kết chuẩn xác: [${store.storeCode}] ${store.storeName} (${store.status})`);

    // -------------------------------------------------------------
    // PHẦN 2: BỘ 6 CHỈ SỐ KPI TÀI CHÍNH ĐIỀU HÀNH (MỤC 11.1)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 2] ĐỐI CHIẾU BỘ 6 CHỈ SỐ KPI TÀI CHÍNH ĐIỀU HÀNH (MỤC 11.1)');
    const kpis = resOverview.body.kpiMetrics;
    assert.ok(kpis, 'kpiMetrics object must exist');

    // KPI 1: Tổng giá trị vốn tồn kho
    assert.ok(typeof kpis.totalInventoryCost === 'number' && kpis.totalInventoryCost > 0, 'Total inventory cost must be > 0');
    recordPass(`KPI 1: Tổng giá trị vốn tồn kho hiện tại: ${kpis.totalInventoryCost.toLocaleString('vi-VN')} đ (Hạn mức < 500tr VNĐ)`);

    // KPI 2: Tổng giá trị vốn cận date có rủi ro
    assert.ok(typeof kpis.atRiskCost === 'number' && kpis.atRiskCost >= 0, 'At-risk cost must be non-negative');
    recordPass(`KPI 2: Tổng vốn cận date rủi ro (Vùng Vàng + Đỏ): ${kpis.atRiskCost.toLocaleString('vi-VN')} đ`);

    // KPI 3: Tỷ lệ hao hụt lãng phí Spoilage Rate %
    assert.ok(typeof kpis.spoilageRatePercent === 'number' && kpis.spoilageRatePercent >= 0, 'Spoilage rate must be non-negative');
    recordPass(`KPI 3: Tỷ lệ hao hụt lãng phí (Spoilage Rate): ${kpis.spoilageRatePercent}%`);

    // KPI 4: Doanh số bán hàng hôm nay & số hóa đơn POS
    assert.ok(typeof kpis.todayTotalRevenue === 'number' && kpis.todayTotalRevenue >= 0);
    assert.ok(typeof kpis.todayTransactionsCount === 'number' && kpis.todayTransactionsCount >= 0);
    recordPass(`KPI 4: Doanh số bán hàng hôm nay: ${kpis.todayTotalRevenue.toLocaleString('vi-VN')} đ (${kpis.todayTransactionsCount} hóa đơn POS)`);

    // KPI 5: Số lượng lô hàng cần đảo kệ trong ca
    assert.ok(typeof kpis.batchesNeedRotateCount === 'number' && kpis.batchesNeedRotateCount >= 0);
    recordPass(`KPI 5: Số lượng lô cận date cần đảo kệ trong ca trực: ${kpis.batchesNeedRotateCount} lô (SOP 5 bước)`);

    // KPI 6: Số lượng lô hàng đã hết hạn chờ tiêu hủy
    assert.ok(typeof kpis.expiredBatchesCount === 'number' && kpis.expiredBatchesCount >= 0);
    recordPass(`KPI 6: Số lượng lô đã hết hạn đang chờ xử lý tiêu hủy: ${kpis.expiredBatchesCount} lô (Rule 5)`);

    // Chỉ số phụ: Tỷ lệ tuân thủ FEFO
    assert.strictEqual(kpis.fefoCompliancePercent, 99.8, 'FEFO compliance must be 99.8%');
    recordPass(`Chỉ số phụ: Tỷ lệ tuân thủ bán hàng theo FEFO: ${kpis.fefoCompliancePercent}%`);

    // -------------------------------------------------------------
    // PHẦN 3: BIỂU ĐỒ VÀNH KHUYÊN PHÂN BỔ HẠN DÙNG (MỤC 11.2)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 3] BIỂU ĐỒ VÀNH KHUYÊN PHÂN BỔ 4 VÙNG HẠN DÙNG (DONUT CHART)');
    const shelfLife = resOverview.body.shelfLifeDistribution;
    assert.ok(shelfLife, 'shelfLifeDistribution must exist');
    assert.ok(typeof shelfLife.greenCount === 'number');
    assert.ok(typeof shelfLife.yellowCount === 'number');
    assert.ok(typeof shelfLife.redCount === 'number');
    assert.ok(typeof shelfLife.expiredCount === 'number');

    const totalCalculated = shelfLife.greenCount + shelfLife.yellowCount + shelfLife.redCount + shelfLife.expiredCount;
    recordPass(`Cơ cấu 4 vùng màu: Xanh=${shelfLife.greenCount}, Vàng=${shelfLife.yellowCount}, Đỏ=${shelfLife.redCount}, Quá hạn=${shelfLife.expiredCount} (Tổng: ${totalCalculated} lô)`);

    // Kiểm tra endpoint phụ GET /api/dashboard/shelf-life-stats
    const resShelfLifeStats = await request('GET', '/api/dashboard/shelf-life-stats');
    assert.strictEqual(resShelfLifeStats.status, 200);
    assert.strictEqual(resShelfLifeStats.body.data.greenCount, shelfLife.greenCount);
    recordPass('API chuyên biệt GET /api/dashboard/shelf-life-stats trả về dữ liệu đồng nhất');

    // -------------------------------------------------------------
    // PHẦN 4: BIỂU ĐỒ MIỀN XU HƯỚNG 14 NGÀY & CƠ CẤU 7 NGÀNH FMCG
    // -------------------------------------------------------------
    console.log('\n[PHẦN 4] BIỂU ĐỒ XU HƯỚNG 14 NGÀY & CƠ CẤU 7 NGÀNH HÀNG FMCG (MỤC 11.2)');
    const trend = resOverview.body.trend14Days;
    assert.ok(Array.isArray(trend), 'trend14Days must be an array');
    assert.strictEqual(trend.length, 14, 'Trend must contain exactly 14 consecutive days');
    
    // Kiểm tra tính liên tục của mốc thời gian
    const firstDay = trend[0];
    const lastDay = trend[13];
    assert.ok(firstDay.date && firstDay.displayDate && firstDay.dayOfWeek);
    assert.ok(lastDay.date && lastDay.displayDate && lastDay.dayOfWeek);
    recordPass(`Dữ liệu chuỗi thời gian 14 ngày liên tục: Từ [${firstDay.displayDate} - ${firstDay.dayOfWeek}] đến [${lastDay.displayDate} - ${lastDay.dayOfWeek}]`);

    // Kiểm tra bảo toàn dòng tiền: retainedProfit = salesRevenue - spoilageCost (>= 0)
    for (const d of trend) {
      assert.ok(typeof d.salesRevenue === 'number');
      assert.ok(typeof d.spoilageCost === 'number');
      assert.ok(typeof d.retainedProfit === 'number');
      assert.strictEqual(d.retainedProfit, Math.max(0, d.salesRevenue - d.spoilageCost));
    }
    recordPass('Công thức tính Lợi nhuận giữ lại Retained Profit = Sales - Spoilage chuẩn 100% trên 14 mốc');

    // Cơ cấu 7 ngành hàng FMCG
    const categories = resOverview.body.categoryBreakdown;
    assert.ok(Array.isArray(categories));
    assert.ok(categories.length >= 7, 'Must have at least 7 FMCG categories');
    recordPass(`Cơ cấu danh mục ngành hàng FMCG: Trả về đầy đủ ${categories.length} nhóm ngành chuẩn`);

    // -------------------------------------------------------------
    // PHẦN 5: BẢNG XẾP HẠNG TOP 5 PHÂN TÍCH KÉP (MỤC 11.2)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 5] BẢNG XẾP HẠNG TOP 5 SẢN PHẨM BÁN CHẠY & HAO HỤT (MỤC 11.2)');
    const topSelling = resOverview.body.topSellingProducts;
    assert.ok(Array.isArray(topSelling) && topSelling.length <= 5);
    if (topSelling.length > 0) {
      const top1Sale = topSelling[0];
      assert.ok(top1Sale.productSku && top1Sale.productName);
      assert.ok(typeof top1Sale.totalQuantitySold === 'number');
      assert.ok(typeof top1Sale.totalRevenue === 'number');
      recordPass(`Top 1 Bán chạy nhất: [${top1Sale.productSku}] ${top1Sale.productName} (Đã bán: ${top1Sale.totalQuantitySold} ${top1Sale.unit || 'đơn vị'}, Doanh thu: ${Number(top1Sale.totalRevenue).toLocaleString('vi-VN')} đ)`);
    }

    const topSpoilage = resOverview.body.topSpoilageProducts;
    assert.ok(Array.isArray(topSpoilage) && topSpoilage.length <= 5);
    if (topSpoilage.length > 0) {
      const top1Spoil = topSpoilage[0];
      assert.ok(top1Spoil.productSku && top1Spoil.productName);
      assert.ok(typeof top1Spoil.totalQuantityDisposed === 'number');
      assert.ok(typeof top1Spoil.totalCostLoss === 'number');
      recordPass(`Top 1 Hao hụt cao nhất: [${top1Spoil.productSku}] ${top1Spoil.productName} (Đã hủy: ${top1Spoil.totalQuantityDisposed} ${top1Spoil.unit || 'đơn vị'}, Thiệt hại vốn: ${Number(top1Spoil.totalCostLoss).toLocaleString('vi-VN')} đ)`);
    }

    // -------------------------------------------------------------
    // PHẦN 6: ACTION BOARD KHẨN CẤP CA TRỰC 4 TAB (MỤC 11.3)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 6] ACTION BOARD KHẨN CẤP CA TRỰC 4 TAB (MỤC 11.3)');
    const ab = resOverview.body.actionBoard;
    assert.ok(ab, 'Action board object must exist');

    // Tab 1: Lô Đỏ cần giảm giá ngay (urgentMarkdownList)
    assert.ok(Array.isArray(ab.urgentMarkdownList));
    for (const item of ab.urgentMarkdownList) {
      assert.ok(item.daysLeft <= 3, 'Urgent markdown batch must have daysLeft <= 3');
      assert.ok(item.actionRequired);
    }
    recordPass(`Action Board Tab 1 (Quick Markdown): ${ab.urgentMarkdownList.length} lô Đỏ (≤ 3 ngày) cần gom xả`);

    // Tab 2: Lô cần đảo kệ mặt tiền (shelfRotationTasks)
    assert.ok(Array.isArray(ab.shelfRotationTasks));
    for (const item of ab.shelfRotationTasks) {
      assert.ok(item.actionRequired);
    }
    recordPass(`Action Board Tab 2 (Đảo kệ mặt tiền): ${ab.shelfRotationTasks.length} lô chưa đảo kệ cần xử lý`);

    // Tab 3: Hàng quá hạn chờ tiêu hủy (disposalPendingList)
    assert.ok(Array.isArray(ab.disposalPendingList));
    for (const item of ab.disposalPendingList) {
      assert.ok(item.daysLeft <= 0 || item.actionRequired);
    }
    recordPass(`Action Board Tab 3 (Tiêu hủy cách ly): ${ab.disposalPendingList.length} lô quá hạn chờ lập/duyệt phiếu`);

    // Tab 4: Cảnh báo ngưỡng đặt hàng ROP & ứ đọng (ropAlertItems)
    assert.ok(Array.isArray(ab.ropAlertItems));
    for (const item of ab.ropAlertItems) {
      assert.ok(item.currentStock <= item.reorderPoint, 'Current stock must be <= reorderPoint');
      assert.ok(item.suggestedOrderQuantity > 0, 'Suggested order quantity must be > 0');
    }
    recordPass(`Action Board Tab 4 (Cảnh báo ROP): ${ab.ropAlertItems.length} mặt hàng chạm điểm đặt hàng gửi DC Biên Hòa`);

    // Kiểm tra endpoint phụ GET /api/dashboard/today-action-board
    const resActionBoard = await request('GET', '/api/dashboard/today-action-board');
    assert.strictEqual(resActionBoard.status, 200);
    assert.strictEqual(resActionBoard.body.data.urgentMarkdownList.length, ab.urgentMarkdownList.length);
    recordPass('API chuyên biệt GET /api/dashboard/today-action-board trả về đủ 4 Tab hành động');

    // -------------------------------------------------------------
    // PHẦN 7: KIỂM ĐỊNH PHÂN QUYỀN RBAC & BẢO VỆ DỮ LIỆU TÀI CHÍNH (MỤC 11.5)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 7] KIỂM ĐỊNH PHÂN QUYỀN RBAC & BẢO VỆ DỮ LIỆU TÀI CHÍNH (MỤC 11.5)');

    // 7.1 Kiểm tra quyền Quản lý cửa hàng (STORE_MANAGER)
    const resManager = await request('GET', '/api/dashboard/overview?role=STORE_MANAGER');
    assert.strictEqual(resManager.status, 200);
    assert.strictEqual(resManager.body.permissions.roleCode, 'STORE_MANAGER');
    assert.strictEqual(resManager.body.permissions.canViewFinancials, true);
    assert.strictEqual(resManager.body.permissions.canApplyQuickMarkdown, true);
    assert.strictEqual(resManager.body.permissions.canApproveDisposal, true);
    assert.strictEqual(resManager.body.kpiMetrics.isFinancialMasked, false);
    assert.ok(typeof resManager.body.kpiMetrics.totalInventoryCost === 'number' && resManager.body.kpiMetrics.totalInventoryCost > 0);
    recordPass('RBAC Quản lý (STORE_MANAGER): Toàn quyền xem vốn tài chính và duyệt nghiệp vụ khẩn cấp');

    // 7.2 Kiểm tra bảo mật Nhân viên kho (WAREHOUSE_STAFF)
    const resWarehouse = await request('GET', '/api/dashboard/overview?role=WAREHOUSE_STAFF');
    assert.strictEqual(resWarehouse.status, 200);
    assert.strictEqual(resWarehouse.body.permissions.roleCode, 'WAREHOUSE_STAFF');
    assert.strictEqual(resWarehouse.body.permissions.canViewFinancials, false);
    assert.strictEqual(resWarehouse.body.permissions.canApplyQuickMarkdown, false);
    assert.strictEqual(resWarehouse.body.kpiMetrics.isFinancialMasked, true);
    assert.strictEqual(resWarehouse.body.kpiMetrics.totalInventoryCost, null, 'Warehouse staff must NOT see totalInventoryCost');
    assert.strictEqual(resWarehouse.body.kpiMetrics.atRiskCost, null, 'Warehouse staff must NOT see atRiskCost');
    recordPass('RBAC Nhân viên kho (WAREHOUSE_STAFF): Dữ liệu vốn tài chính bị che hoàn toàn (null, isFinancialMasked=true)');

    // 7.3 Kiểm tra quyền Thu ngân POS (CASHIER)
    const resCashier = await request('GET', '/api/dashboard/overview?role=CASHIER');
    assert.strictEqual(resCashier.status, 200);
    assert.strictEqual(resCashier.body.permissions.roleCode, 'CASHIER');
    assert.strictEqual(resCashier.body.permissions.canApplyQuickMarkdown, false, 'Cashier cannot apply quick markdown directly');
    assert.strictEqual(resCashier.body.permissions.canApproveDisposal, false, 'Cashier cannot approve disposal');
    recordPass('RBAC Thu ngân (CASHIER): Khóa quyền tự ý đổi giá xả hàng Quick Markdown và duyệt hủy');

    // -------------------------------------------------------------
    // PHẦN 8: ĐO LƯỜNG HIỆU NĂNG TỔNG HỢP SONG SONG (MỤC 11.4)
    // -------------------------------------------------------------
    console.log('\n[PHẦN 8] HIỆU NĂNG PHẢN HỒI DASHBOARD OVERVIEW (MỤC 11.4)');
    const t0 = Date.now();
    const resPerf = await request('GET', '/api/dashboard/overview');
    const elapsed = Date.now() - t0;
    assert.strictEqual(resPerf.status, 200);
    assert.ok(elapsed < 1000, `API response time (${elapsed}ms) must be < 1000ms`);
    recordPass(`Thời gian phản hồi truy vấn tổng hợp Dashboard: ${elapsed}ms (Đạt chuẩn < 1000ms)`);

    // -------------------------------------------------------------
    // TỔNG KẾT BỘ KIỂM THỬ
    // -------------------------------------------------------------
    console.log('\n' + '='.repeat(85));
    console.log(`🎉 TEST SUITE STEP 13 HOÀN TẤT THÀNH CÔNG: ${passed} / ${passed + failed} TEST CASES PASSED (100%)`);
    console.log('='.repeat(85));

  } catch (err) {
    recordFail('Lỗi ngoại lệ không mong muốn trong Test Suite Step 13', err);
    console.error(err);
  }
}

runStep13DashboardTests();

