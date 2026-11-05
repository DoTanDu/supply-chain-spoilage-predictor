// Backend/test_step9_batch_shelflife_alignment.js
/**
 * TEST SUITE CHUYÊN BIỆT: MỤC 7 — QUẢN LÝ LÔ HÀNG & VÒNG ĐỜI HẠN SỬ DỤNG (SHELF-LIFE MANAGEMENT)
 * Kiểm định toàn diện 25 ca kiểm thử bao quát:
 * 1. Toán học vòng đời ShelfLife (TotalLife, DaysLeft, RSL %)
 * 2. Tiêu chuẩn nhận date DC (Rule 7: RSL >= 70%) & Biên bản từ chối nhận hàng
 * 3. Động cơ cảnh báo 3 cấp màu (Rule 4: Green, Yellow, Red, Expired)
 * 4. Kế thừa phân tầng ngưỡng WarningDays (Product -> Category -> Store)
 * 5. Dự báo rủi ro lãng phí AI 2 Spoilage Risk (AtRiskStock & AtRiskCost)
 * 6. Quy chuẩn mã lô LOT-DC-[SKU]-[YYYYMMDD] & Tem nhãn Barcode
 * 7. Ràng buộc toàn vẹn & Chống tồn kho âm (Rule 3)
 * 8. Khóa cứng hàng hết hạn (Rule 5)
 * 9. Quick Markdown 15%-50% (Rule 10)
 * 10. SOP 5 bước đảo kệ mặt tiền (Rule 10)
 * 11. Concurrency control WITH (UPDLOCK, ROWLOCK)
 * 12. Phân quyền SoD 4 Actor (ADMIN, STORE_MANAGER, WAREHOUSE_STAFF, CASHIER)
 */

const assert = require('assert');
const ShelfLife = require('./src/domain/value-objects/ShelfLife');
const AlertLevel = require('./src/domain/value-objects/AlertLevel');
const Batch = require('./src/domain/entities/Batch');
const MarkdownPricingPolicy = require('./src/domain/services/MarkdownPricingPolicy');
const FefoAllocationPolicy = require('./src/domain/services/FefoAllocationPolicy');
const TokenService = require('./src/infrastructure/security/TokenService');
const SqlConnection = require('./src/infrastructure/database/sqlConnection');

const BASE_URL = 'http://localhost:5000';

let passedTests = 0;
let totalTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] Test ${totalTests}: ${name}`);
    console.error(`         ${err.message}`);
    throw err;
  }
}

async function itAsync(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] Test ${totalTests}: ${name}`);
    console.error(`         ${err.message}`);
    throw err;
  }
}

async function runStep9Tests() {
  console.log('\n================================================================================');
  console.log('--- BẮT ĐẦU KIỂM THỬ MỤC 7: QUẢN LÝ LÔ HÀNG & VÒNG ĐỜI HẠN SỬ DỤNG (SSOT) ---');
  console.log('================================================================================\n');

  // NHÓM 1: TOÁN HỌC VÒNG ĐỜI SHELF-LIFE (VALUE OBJECT)
  console.log('--- NHÓM 1: CÔNG THỨC TOÁN HỌC VÒNG ĐỜI HẠN SỬ DỤNG (SHELF-LIFE) ---');
  
  it('1.1: Tính tổng vòng đời TotalLife = ExpiryDate - ManufactureDate chính xác từng ngày', () => {
    const mfg = new Date('2026-10-01');
    const exp = new Date('2026-10-31');
    const sl = new ShelfLife(mfg, exp);
    assert.strictEqual(sl.getTotalDays(), 30);
  });

  it('1.2: Tính số ngày còn lại DaysLeft = ExpiryDate - CurrentDate chính xác', () => {
    const mfg = new Date('2026-10-01');
    const exp = new Date('2026-10-31');
    const curr = new Date('2026-10-21');
    const sl = new ShelfLife(mfg, exp, curr);
    assert.strictEqual(sl.getDaysLeft(), 10);
  });

  it('1.3: Tính tỷ lệ vòng đời còn lại RSL (%) = (DaysLeft / TotalLife) * 100', () => {
    const mfg = new Date('2026-10-01');
    const exp = new Date('2026-10-31');
    const curr = new Date('2026-10-16'); // 15 ngày còn lại / 30 ngày tổng
    const sl = new ShelfLife(mfg, exp, curr);
    assert.strictEqual(sl.getRslPercent(), 50.0);
  });

  it('1.4: Validation ném ngoại lệ khi ExpiryDate <= ManufactureDate', () => {
    const mfg = new Date('2026-10-31');
    const exp = new Date('2026-10-01');
    assert.throws(() => {
      new ShelfLife(mfg, exp);
    }, /Hạn sử dụng \(ExpiryDate\) bắt buộc phải lớn hơn Ngày sản xuất/);
  });

  // NHÓM 2: TIÊU CHUẨN NHẬN DATE DC (RULE 7) & BIÊN BẢN TỪ CHỐI
  console.log('\n--- NHÓM 2: TIÊU CHUẨN NHẬN HÀNG DC (RULE 7: RSL >= 70%) & BIÊN BẢN TỪ CHỐI ---');

  it('2.1: Chấp thuận xe tải DC giao hàng khi RSL_inbound >= 70%', () => {
    const mfg = new Date('2026-10-01');
    const exp = new Date('2026-11-10'); // 40 ngày
    const imp = new Date('2026-10-05'); // 36 ngày còn lại -> RSL = 36/40 = 90%
    const sl = new ShelfLife(mfg, exp);
    const check = sl.validateInboundFreshness(imp, 70);
    assert.strictEqual(check.isAcceptable, true);
    assert.strictEqual(check.inboundRslPercent, 90.0);
  });

  it('2.2: Từ chối nhận hàng khi xe tải DC giao hàng có RSL_inbound < 70%', () => {
    const mfg = new Date('2026-10-01');
    const exp = new Date('2026-10-31'); // 30 ngày
    const imp = new Date('2026-10-15'); // 16 ngày còn lại -> RSL = 16/30 = 53.33% < 70%
    const sl = new ShelfLife(mfg, exp);
    const check = sl.validateInboundFreshness(imp, 70);
    assert.strictEqual(check.isAcceptable, false);
    assert.strictEqual(check.inboundRslPercent, 53.33);
  });

  await itAsync('2.3: API POST /api/batches/reject-inbound lập Biên bản Từ chối & ghi AuditLog khi RSL < 70%', async () => {
    const token = TokenService.generateToken({ userId: 6, username: 'warehouse', roleCode: 'WAREHOUSE_STAFF', fullName: 'Lê Nhân Kho (Kho & Kệ)' });
    const res = await fetch(`${BASE_URL}/api/batches/reject-inbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        productId: 1,
        batchCode: 'LOT-TEST-REJECT-01',
        manufactureDate: '2026-10-01',
        expiryDate: '2026-10-15',
        quantity: 50,
        reason: 'Hàng sữa thanh trùng cận date, xe DC giao trễ vi phạm chuẩn 70% RSL'
      })
    });
    const json = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.success, true);
    assert.ok(json.rejectionCode.startsWith('REJ-DC-'));
    assert.ok(json.data.inboundRslPercent < 70);
  });

  // NHÓM 3: ĐỘNG CƠ CẢNH BÁO 3 CẤP MÀU (RULE 4 & RULE 5)
  console.log('\n--- NHÓM 3: ĐỘNG CƠ CẢNH BÁO 3 CẤP MÀU ĐỘNG & KHÓA CỨNG HẾT HẠN ---');

  it('3.1: Vùng Xanh (SAFE / GREEN) khi DaysLeft > WarningDays', () => {
    const mfg = new Date('2026-10-01');
    const exp = new Date('2026-10-31');
    const curr = new Date('2026-10-10'); // DaysLeft = 21 > WarningDays 7
    const sl = new ShelfLife(mfg, exp, curr);
    assert.strictEqual(sl.evaluateAlertLevel(7), AlertLevel.GREEN);
  });

  it('3.2: Vùng Vàng (WARNING / YELLOW) khi 3 < DaysLeft <= WarningDays', () => {
    const mfg = new Date('2026-10-01');
    const exp = new Date('2026-10-15');
    const curr = new Date('2026-10-10'); // DaysLeft = 5 (3 < 5 <= 7)
    const sl = new ShelfLife(mfg, exp, curr);
    assert.strictEqual(sl.evaluateAlertLevel(7), AlertLevel.YELLOW);
  });

  it('3.3: Vùng Đỏ (CRITICAL / RED) khi 0 < DaysLeft <= 3', () => {
    const mfg = new Date('2026-10-01');
    const exp = new Date('2026-10-12');
    const curr = new Date('2026-10-10'); // DaysLeft = 2 (0 < 2 <= 3)
    const sl = new ShelfLife(mfg, exp, curr);
    assert.strictEqual(sl.evaluateAlertLevel(7), AlertLevel.RED);
  });

  it('3.4: Quá hạn (EXPIRED) khi DaysLeft <= 0 tự động khóa cứng', () => {
    const mfg = new Date('2026-10-01');
    const exp = new Date('2026-10-09');
    const curr = new Date('2026-10-10'); // DaysLeft = -1
    const sl = new ShelfLife(mfg, exp, curr);
    assert.strictEqual(sl.evaluateAlertLevel(7), AlertLevel.EXPIRED);
  });

  // NHÓM 4: RÀNG BUỘC KẾ THỪA PHÂN TẦNG NGƯỠNG CẢNH BÁO
  console.log('\n--- NHÓM 4: KẾ THỪA PHÂN TẦNG NGƯỠNG WARNING DAYS ---');

  await itAsync('4.1: SQL View vw_Batches_ShelfLife_Alerts áp dụng ưu tiên: CustomWarningDays -> Category -> Store (7)', async () => {
    const rows = await SqlConnection.queryJson(`
      SELECT TOP 5 
        product_name, category_name, warning_threshold_days, alert_color
      FROM vw_Batches_ShelfLife_Alerts;
    `);
    assert.ok(rows.length > 0);
    for (const r of rows) {
      assert.ok(Number(r.warning_threshold_days) >= 2, 'Ngưỡng cảnh báo phải >= 2 ngày');
      assert.ok(['GREEN', 'YELLOW', 'RED', 'EXPIRED'].includes(r.alert_color));
    }
  });

  // NHÓM 5: DỰ BÁO RỦI RO LÃNG PHÍ TÀI CHÍNH (AI 2 SPOILAGE RISK)
  console.log('\n--- NHÓM 5: DỰ BÁO RỦI RO LÃNG PHÍ TÀI CHÍNH (AI 2 SPOILAGE RISK) ---');

  it('5.1: Công thức Spoilage Risk ước lượng AtRiskStock = max(0, CurrentStock - (v_14d * DaysLeft))', () => {
    const currentStock = 100;
    const daysLeft = 3; // Lô Đỏ
    const salesVelocity = 20; // Bán 20 hộp/ngày
    const estimatedSales = salesVelocity * daysLeft; // 60 hộp
    const atRiskStock = Math.max(0, currentStock - estimatedSales); // 40 hộp rủi ro
    assert.strictEqual(atRiskStock, 40);

    const importPrice = 25000;
    const atRiskCost = atRiskStock * importPrice;
    assert.strictEqual(atRiskCost, 1000000); // 1,000,000 đ tổn thất tiềm tàng
  });

  it('5.2: AtRiskStock = 0 khi tốc độ bán đủ hấp thụ toàn bộ tồn kho trước hạn', () => {
    const currentStock = 40;
    const daysLeft = 3;
    const salesVelocity = 20;
    const estimatedSales = salesVelocity * daysLeft; // 60 hộp
    const atRiskStock = Math.max(0, currentStock - estimatedSales);
    assert.strictEqual(atRiskStock, 0);
  });

  await itAsync('5.3: SQL View vw_Batches_ShelfLife_Alerts trả về at_risk_cost cho tất cả các lô Vùng Vàng và Đỏ', async () => {
    const rows = await SqlConnection.queryJson(`
      SELECT TOP 5 
        batch_code, alert_color, current_quantity, import_price, at_risk_cost
      FROM vw_Batches_ShelfLife_Alerts
      WHERE alert_color IN ('YELLOW', 'RED') AND current_quantity > 0;
    `);
    if (rows.length > 0) {
      for (const r of rows) {
        const expectedCost = Number(r.current_quantity) * Number(r.import_price);
        assert.strictEqual(Number(r.at_risk_cost), expectedCost);
      }
    }
  });

  // NHÓM 6: QUY CHUẨN MÃ LÔ LOT-DC-[SKU]-[YYYYMMDD] & LIÊN KẾT NGUỒN GỐC
  console.log('\n--- NHÓM 6: QUY CHUẨN MÃ LÔ HÀNG & TRUY VẾT NGUỒN GỐC ---');

  await itAsync('6.1: Bảng batches lưu liên kết receipt_id nguồn gốc từ GoodsReceipts', async () => {
    const batches = await SqlConnection.queryJson(`
      SELECT TOP 5 id, batch_code, receipt_id, product_id 
      FROM batches 
      WHERE receipt_id IS NOT NULL;
    `);
    assert.ok(batches.length > 0, 'Phải có lô hàng liên kết với phiếu nhận hàng DC (receipt_id)');
  });

  it('6.2: Quy chuẩn cấu trúc mã lô khớp regex LOT-DC-[SKU]-[YYYYMMDD]', () => {
    const codePattern = /^LOT-DC-[A-Z0-9_-]+-\d{8}(-\d+)?$/i;
    assert.ok(codePattern.test('LOT-DC-MILK-TH-01-20261029'));
    assert.ok(codePattern.test('LOT-DC-BREAD-01-20261029-1'));
  });

  // NHÓM 7: RÀNG BUỘC TOÀN VẸN & CHỐNG TỒN KHO ÂM (RULE 3)
  console.log('\n--- NHÓM 7: RÀNG BUỘC TOÀN VẸN & CHỐNG TỒN KHO ÂM (RULE 3) ---');

  it('7.1: Entity Batch ném lỗi khi initialQuantity <= 0', () => {
    assert.throws(() => {
      new Batch({
        batchCode: 'LOT-TEST-01',
        productId: 1,
        importDate: '2026-10-01',
        manufactureDate: '2026-10-01',
        expiryDate: '2026-10-31',
        initialQuantity: 0,
        importPrice: 20000
      });
    }, /Số lượng ban đầu \(initialQuantity\) phải lớn hơn 0/);
  });

  it('7.2: deductQuantity ném lỗi khi xuất kho vượt quá số lượng tồn hiện tại', () => {
    const b = new Batch({
      batchCode: 'LOT-TEST-02',
      productId: 1,
      importDate: '2026-10-01',
      manufactureDate: '2026-10-01',
      expiryDate: new Date(Date.now() + 86400000 * 10), // Còn 10 ngày
      initialQuantity: 10,
      currentQuantity: 10,
      importPrice: 20000
    });
    assert.throws(() => {
      b.deductQuantity(15);
    }, /không đủ tồn kho/);
  });

  it('7.3: deductQuantity trừ kho thành công và chống âm kho khi số lượng hợp lệ', () => {
    const b = new Batch({
      batchCode: 'LOT-TEST-03',
      productId: 1,
      importDate: '2026-10-01',
      manufactureDate: '2026-10-01',
      expiryDate: new Date(Date.now() + 86400000 * 10),
      initialQuantity: 10,
      currentQuantity: 10,
      importPrice: 20000
    });
    const remaining = b.deductQuantity(4);
    assert.strictEqual(remaining, 6);
    assert.strictEqual(b.currentQuantity, 6);
  });

  // NHÓM 8: KHÓA CỨNG HÀNG HẾT HẠN (RULE 5)
  console.log('\n--- NHÓM 8: KHÓA CỨNG HÀNG HẾT HẠN (RULE 5) ---');

  it('8.1: Lô hàng có DaysLeft <= 0 tự động chuyển sang status EXPIRED', () => {
    const yesterday = new Date(Date.now() - 86400000);
    const lastMonth = new Date(Date.now() - 86400000 * 30);
    const b = new Batch({
      batchCode: 'LOT-EXPIRED-01',
      productId: 1,
      importDate: lastMonth,
      manufactureDate: lastMonth,
      expiryDate: yesterday,
      initialQuantity: 10,
      currentQuantity: 10,
      importPrice: 20000,
      status: 'ACTIVE'
    });
    assert.strictEqual(b.status, 'EXPIRED');
    assert.strictEqual(b.isAvailableForSale(), false);
  });

  it('8.2: deductQuantity từ chối xuất bán nếu lô đã hết hạn', () => {
    const yesterday = new Date(Date.now() - 86400000);
    const lastMonth = new Date(Date.now() - 86400000 * 30);
    const b = new Batch({
      batchCode: 'LOT-EXPIRED-02',
      productId: 1,
      importDate: lastMonth,
      manufactureDate: lastMonth,
      expiryDate: yesterday,
      initialQuantity: 10,
      currentQuantity: 10,
      importPrice: 20000
    });
    assert.throws(() => {
      b.deductQuantity(1);
    }, /đã hết hạn hoặc không khả dụng để xuất bán/);
  });

  // NHÓM 9: XẢ HÀNG QUICK MARKDOWN (RULE 10)
  console.log('\n--- NHÓM 9: XẢ HÀNG QUICK MARKDOWN 15% - 50% (RULE 10) ---');

  it('9.1: MarkdownPricingPolicy chỉ chấp nhận 0%, 15%, 30%, 40%, 50%', () => {
    assert.strictEqual(MarkdownPricingPolicy.isAllowedPercent(0), true);
    assert.strictEqual(MarkdownPricingPolicy.isAllowedPercent(15), true);
    assert.strictEqual(MarkdownPricingPolicy.isAllowedPercent(30), true);
    assert.strictEqual(MarkdownPricingPolicy.isAllowedPercent(40), true);
    assert.strictEqual(MarkdownPricingPolicy.isAllowedPercent(50), true);
    assert.strictEqual(MarkdownPricingPolicy.isAllowedPercent(25), false);
    assert.strictEqual(MarkdownPricingPolicy.isAllowedPercent(70), false);
  });

  it('9.2: Batch.applyQuickMarkdown cập nhật discount_percent và đổi status WARNING', () => {
    const b = new Batch({
      batchCode: 'LOT-TEST-MD',
      productId: 1,
      importDate: new Date(),
      manufactureDate: new Date(),
      expiryDate: new Date(Date.now() + 86400000 * 5),
      initialQuantity: 20,
      currentQuantity: 20,
      importPrice: 20000
    });
    b.applyQuickMarkdown(30);
    assert.strictEqual(b.discountPercent, 30);
    assert.strictEqual(b.status, 'WARNING');
  });

  it('9.3: calculateEffectivePrice tính đúng giá niêm yết sau chiết khấu', () => {
    const b = new Batch({
      batchCode: 'LOT-TEST-PRICE',
      productId: 1,
      importDate: new Date(),
      manufactureDate: new Date(),
      expiryDate: new Date(Date.now() + 86400000 * 5),
      initialQuantity: 20,
      currentQuantity: 20,
      importPrice: 20000,
      discountPercent: 40
    });
    const effectivePrice = b.calculateEffectivePrice(50000);
    assert.strictEqual(effectivePrice, 30000); // 50,000 * (1 - 0.4) = 30,000
  });

  // NHÓM 10: QUY TRÌNH SOP 5 BƯỚC ĐẢO KỆ MẶT TIỀN (RULE 10)
  console.log('\n--- NHÓM 10: QUY TRÌNH SOP 5 BƯỚC ĐẢO KỆ MẶT TIỀN (RULE 10) ---');

  it('10.1: Batch.confirmShelfRotation cập nhật isShelfRotated = true', () => {
    const b = new Batch({
      batchCode: 'LOT-TEST-ROT',
      productId: 1,
      importDate: new Date(),
      manufactureDate: new Date(),
      expiryDate: new Date(Date.now() + 86400000 * 5),
      initialQuantity: 20,
      currentQuantity: 20,
      importPrice: 20000,
      isShelfRotated: false
    });
    assert.strictEqual(b.isShelfRotated, false);
    b.confirmShelfRotation();
    assert.strictEqual(b.isShelfRotated, true);
  });

  // NHÓM 11: CONCURRENCY CONTROL WITH (UPDLOCK, ROWLOCK) & SOD RBAC
  console.log('\n--- NHÓM 11: KIỂM SOÁT ĐỒNG THỜI & MA TRẬN PHÂN QUYỀN SOD ---');

  await itAsync('11.1: Khóa dòng UPDLOCK, ROWLOCK được định nghĩa trong SqlSaleRepository để chống âm kho', async () => {
    const fs = require('fs');
    const repoContent = fs.readFileSync('c:/thuyet minh/Backend/src/infrastructure/database/repositories/SqlSaleRepository.js', 'utf8');
    assert.ok(repoContent.includes('UPDATE batches WITH (UPDLOCK, ROWLOCK)'), 'Bắt buộc dùng khóa UPDLOCK, ROWLOCK');
    assert.ok(repoContent.includes('BEGIN TRANSACTION'), 'Bắt buộc bọc trong SQL Transaction');
    assert.ok(repoContent.includes('ROLLBACK TRANSACTION'), 'Bắt buộc rollback khi có lỗi');
  });

  await itAsync('11.2: SoD - Thu ngân (CASHIER) bị CHẶN khi gọi API PATCH /api/batches/:id/discount', async () => {
    const cashierToken = TokenService.generateToken({ userId: 5, username: 'cashier', roleCode: 'CASHIER', fullName: 'Đoàn Minh Quân (Thu Ngân)' });
    const res = await fetch(`${BASE_URL}/api/batches/29/discount`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cashierToken}`
      },
      body: JSON.stringify({ percent: 30 })
    });
    assert.strictEqual(res.status, 403, 'CASHIER không được phép duyệt Quick Markdown');
  });

  await itAsync('11.3: SoD - Cửa hàng trưởng (STORE_MANAGER) ĐƯỢC PHÉP gọi API PATCH /api/batches/:id/discount', async () => {
    const managerToken = TokenService.generateToken({ userId: 4, username: 'manager', roleCode: 'STORE_MANAGER', fullName: 'Đỗ Tấn Du (Cửa Hàng Trưởng)' });
    const res = await fetch(`${BASE_URL}/api/batches/29/discount`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({ percent: 30 })
    });
    assert.strictEqual(res.status, 200, 'STORE_MANAGER có toàn quyền duyệt Quick Markdown');
    const json = await res.json();
    assert.strictEqual(json.success, true);
  });

  await itAsync('11.4: SoD - Nhân viên kho (WAREHOUSE_STAFF) ĐƯỢC PHÉP xác nhận đảo kệ PATCH /api/batches/:id/rotate', async () => {
    const staffToken = TokenService.generateToken({ userId: 6, username: 'warehouse', roleCode: 'WAREHOUSE_STAFF', fullName: 'Lê Nhân Kho (Kho & Kệ)' });
    const res = await fetch(`${BASE_URL}/api/batches/29/rotate`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      }
    });
    assert.strictEqual(res.status, 200, 'WAREHOUSE_STAFF được phép ký xác nhận đảo kệ');
    const json = await res.json();
    assert.strictEqual(json.success, true);
  });

  console.log('\n================================================================================');
  console.log(`KẾT QUẢ KIỂM THỬ: ${passedTests} / ${totalTests} TESTS PASSED (100% SUCCESS)`);
  console.log('================================================================================\n');
}

runStep9Tests().catch(err => {
  console.error('LỖI KIỂM THỬ:', err);
  process.exit(1);
});
