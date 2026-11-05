// Backend/test_step3_comprehensive_audit.js
// Bộ kiểm thử & Rà soát chuyên biệt 100% Bước 3 (Domain Entities, Value Objects, Domain Services & Repositories)

const assert = (condition, msg) => {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`  ✅ PASSED: ${msg}`);
};

async function runStep3Audit() {
  console.log('================================================================');
  console.log('🔍 KIỂM THỬ & RÀ SOÁT TOÀN DIỆN BƯỚC 3: DOMAIN LAYER & REPOSITORIES');
  console.log('================================================================\n');

  // ============================================================================
  // PHẦN 1: VALUE OBJECTS
  // ============================================================================
  console.log('📦 PHẦN 1: KIỂM THỬ CÁC VALUE OBJECTS');
  
  const AlertLevel = require('./src/domain/value-objects/AlertLevel');
  assert(AlertLevel.GREEN === 'GREEN', 'AlertLevel.GREEN = "GREEN"');
  assert(AlertLevel.YELLOW === 'YELLOW', 'AlertLevel.YELLOW = "YELLOW"');
  assert(AlertLevel.RED === 'RED', 'AlertLevel.RED = "RED"');
  assert(AlertLevel.EXPIRED === 'EXPIRED', 'AlertLevel.EXPIRED = "EXPIRED"');
  assert(AlertLevel.isValid('RED') === true, 'AlertLevel.isValid("RED") = true');
  assert(AlertLevel.isValid('BLUE') === false, 'AlertLevel.isValid("BLUE") = false');
  assert(AlertLevel.getBadgeColor('RED') === '#EF4444', 'AlertLevel badge color cho RED = #EF4444');

  const ShelfLife = require('./src/domain/value-objects/ShelfLife');
  const today = new Date();
  const mfg = new Date(today);
  mfg.setDate(mfg.getDate() - 10); // SX cách đây 10 ngày
  const exp = new Date(today);
  exp.setDate(exp.getDate() + 20); // HSD còn 20 ngày
  const sl = new ShelfLife(mfg, exp, today);
  assert(sl.getTotalDays() === 30, 'Tổng vòng đời TotalDays = 30 ngày');
  assert(sl.getDaysLeft() === 20, 'Số ngày còn lại DaysLeft = 20 ngày');
  assert(sl.getRslPercent() === 66.67, 'Tỷ lệ RSL = 66.67%');

  // Kiểm định Rule 7: Tiếp nhận date Inbound DC
  const badImp = new Date(today);
  badImp.setDate(badImp.getDate() + 15); // Giao trễ, còn 5/30 ngày = 16.67% < 70%
  const freshCheckFail = sl.validateInboundFreshness(badImp, 70.0);
  assert(freshCheckFail.isAcceptable === false, 'Rule 7: Từ chối đợt hàng có RSL Inbound < 70%');
  
  const goodImp = new Date(today);
  goodImp.setDate(goodImp.getDate() - 5); // Giao sớm, còn 25/30 ngày = 83.33% >= 70%
  const freshCheckPass = sl.validateInboundFreshness(goodImp, 70.0);
  assert(freshCheckPass.isAcceptable === true, 'Rule 7: Chấp nhận đợt hàng có RSL Inbound >= 70%');

  // Kiểm định Rule 4 & 5: Đánh giá 3 cấp màu cảnh báo
  const expRed = new Date(today); expRed.setDate(expRed.getDate() + 2);
  const slRed = new ShelfLife(mfg, expRed, today);
  assert(slRed.evaluateAlertLevel(7) === AlertLevel.RED, 'Rule 4: DaysLeft <= 3 rơi vào Vùng Đỏ');

  const expExpired = new Date(today); expExpired.setDate(expExpired.getDate() - 1);
  const slExpired = new ShelfLife(mfg, expExpired, today);
  assert(slExpired.evaluateAlertLevel(7) === AlertLevel.EXPIRED, 'Rule 5: DaysLeft <= 0 rơi vào EXPIRED');

  const WeatherCondition = require('./src/domain/value-objects/WeatherCondition');
  const wSunny = new WeatherCondition('SUNNY');
  assert(wSunny.getDemandFactor('BEVERAGE') === 1.30, 'Weather SUNNY: Nước giải khát tăng 30%');
  assert(wSunny.getDemandFactor('DAIRY') === 1.15, 'Weather SUNNY: Sữa mát tăng 15%');
  const wRainy = new WeatherCondition('RAINY');
  assert(wRainy.getDemandFactor('BAKERY') === 1.25, 'Weather RAINY: Bánh mì tăng 25%');
  assert(wRainy.getDemandFactor('BEVERAGE') === 0.80, 'Weather RAINY: Nước giải khát giảm 20%');

  const Money = require('./src/domain/value-objects/Money');
  const m1 = new Money(50000);
  const m2 = new Money(25000);
  assert(m1.add(m2).amount === 75000, 'Money.add: 50.000 + 25.000 = 75.000');
  assert(m1.subtract(m2).amount === 25000, 'Money.subtract: 50.000 - 25.000 = 25.000');
  assert(m2.multiply(2).amount === 50000, 'Money.multiply: 25.000 * 2 = 50.000');

  const Sku = require('./src/domain/value-objects/Sku');
  const skuObj = new Sku('  8934567890101  ');
  assert(skuObj.toString() === '8934567890101', 'Sku: Chuẩn hóa trim và toString đúng');
  let skuErrorThrown = false;
  try { new Sku(''); } catch (e) { skuErrorThrown = true; }
  assert(skuErrorThrown === true, 'Sku: Bắt lỗi khi mã SKU rỗng');

  // ============================================================================
  // PHẦN 2: DOMAIN ENTITIES
  // ============================================================================
  console.log('\n📦 PHẦN 2: KIỂM THỬ CÁC DOMAIN ENTITIES');

  const Batch = require('./src/domain/entities/Batch');
  const batchExp = new Date(today); batchExp.setDate(batchExp.getDate() + 15);
  const testBatch = new Batch({
    batchCode: 'LOT-TEST-001',
    productId: 1,
    importDate: today,
    manufactureDate: mfg,
    expiryDate: batchExp,
    initialQuantity: 100,
    currentQuantity: 100,
    importPrice: 20000
  });
  assert(testBatch.isAvailableForSale() === true, 'Lô hàng mới khởi tạo khả dụng để bán POS');
  testBatch.deductQuantity(30);
  assert(testBatch.currentQuantity === 70, 'Deduct 30 SP -> Tồn kho còn 70');
  testBatch.applyQuickMarkdown(30);
  assert(testBatch.discountPercent === 30, 'Áp dụng Quick Markdown 30% thành công');
  testBatch.confirmShelfRotation();
  assert(testBatch.isShelfRotated === true, 'Xác nhận đảo kệ mặt tiền thành công');

  const SaleOrder = require('./src/domain/entities/SaleOrder');
  const saleOrder = new SaleOrder({
    cashierId: 3,
    weather: 'RAINY',
    isHoliday: true
  });
  saleOrder.addItem({
    productId: 1,
    batchId: 10,
    batchCode: 'LOT-TEST-001',
    productName: 'Sữa tươi',
    quantitySold: 4,
    salePrice: 15000,
    originalPrice: 20000,
    discountPercent: 25
  });
  assert(saleOrder.getTotalQuantity() === 4, 'SaleOrder tổng số lượng = 4');
  assert(saleOrder.getTotalAmount() === 60000, 'SaleOrder tổng tiền = 60.000 đ');
  assert(saleOrder.weather === 'RAINY', 'SaleOrder ghi nhận ngữ cảnh thời tiết RAINY');

  const SpoilageRecord = require('./src/domain/entities/SpoilageRecord');
  const spoilRecord = new SpoilageRecord({
    batchId: 10,
    quantityDisposed: 5,
    importPrice: 20000,
    reason: 'EXPIRED',
    performedBy: 4
  });
  assert(spoilRecord.costLoss === 100000, 'Rule 6: CostLoss tự động tính = 5 * 20.000 = 100.000 đ');
  spoilRecord.approve(2);
  assert(spoilRecord.approvedBy === 2, 'Ký duyệt Sổ hao hụt bởi Store Manager ID = 2');

  const PurchaseOrder = require('./src/domain/entities/PurchaseOrder');
  const po = new PurchaseOrder({
    supplierId: 1,
    createdBy: 2,
    notes: 'Đơn đặt hàng tự động'
  });
  po.addItem({
    productId: 1,
    productName: 'Sữa tươi Vinamilk',
    currentStockAtOrder: 10,
    suggestedQuantity: 50,
    unitCost: 20000
  });
  assert(po.totalEstimatedCost === 1000000, 'PO tổng dự toán = 50 * 20.000 = 1.000.000 đ');
  po.approve(2);
  assert(po.status === 'APPROVED', 'PO chuyển trạng thái sang APPROVED');
  po.submitToDC();
  assert(po.status === 'SUBMITTED', 'PO chuyển trạng thái sang SUBMITTED (Đã gửi DC)');

  const Product = require('./src/domain/entities/Product');
  const prodTest = new Product({
    id: 1,
    sku: '8934567890101',
    name: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
    categoryId: 1,
    supplierId: 1,
    costPrice: 20000,
    sellingPrice: 30000,
    standardShelfLifeDays: 180,
    customWarningDays: 10
  });
  assert(Product.normalize('Sữa tươi tiệt trùng 100%') === 'sua tuoi tiet trung 100', 'Product: Normalize chuỗi tiếng Việt không dấu');
  assert(prodTest.getEffectiveWarningDays(7) === 10, 'Product: Ưu tiên ngưỡng cảnh báo customWarningDays');

  const StoreProfile = require('./src/domain/entities/StoreProfile');
  const storeTest = new StoreProfile({
    storeCode: 'RETAIL-STORE-01',
    storeName: 'LHU Mart',
    minInboundRslPercent: 70.0,
    status: 'OPEN'
  });
  assert(storeTest.isOpenForSales() === true, 'StoreProfile: Cửa hàng đang mở cửa bán hàng (OPEN)');
  const rslCheck = storeTest.validateInboundRsl(batchExp, mfg, today);
  assert(rslCheck.rslPercent !== undefined, 'StoreProfile: Tính toán hợp lệ tỷ lệ Inbound RSL');

  const Role = require('./src/domain/entities/Role');
  const adminRole = new Role({ code: 'ADMIN', name: 'Quản trị viên' });
  const cashierRole = new Role({ code: 'CASHIER', name: 'Thu ngân' });
  assert(adminRole.isAdmin() === true, 'Role: ADMIN role xác nhận isAdmin = true');
  assert(cashierRole.isAdmin() === false, 'Role: CASHIER role xác nhận isAdmin = false');

  const User = require('./src/domain/entities/User');
  const testUser = new User({
    id: 1,
    username: 'admin',
    fullName: 'Quản Trị Viên',
    roleCode: 'ADMIN'
  });
  assert(testUser.hasRole(['ADMIN', 'STORE_MANAGER']) === true, 'User: Kiểm tra quyền hasRole hợp lệ');
  assert(testUser.toSafeProfile().passwordHash === undefined, 'User: toSafeProfile bảo mật loại bỏ password');

  const Category = require('./src/domain/entities/Category');
  const catTest = new Category({ code: 'DAIRY', name: 'Sữa tươi', storageTemperature: '2-4°C', defaultWarningDays: 5 });
  assert(catTest.defaultWarningDays === 5, 'Category: Khởi tạo ngưỡng cảnh báo 5 ngày');

  const Supplier = require('./src/domain/entities/Supplier');
  const supTest = new Supplier({ id: 1, code: 'DC-BIENHOA', name: 'Kho Tổng DC Biên Hòa', leadTimeDays: 1 });
  assert(supTest.isDistributionCenter() === true, 'Supplier: Nhận diện chính xác Trung tâm phân phối DC');
  assert(supTest.getLeadTime() === 1, 'Supplier: LeadTime chuẩn 1 ngày');

  const GoodsReceipt = require('./src/domain/entities/GoodsReceipt');
  const expGoodBatch = new Date(today);
  expGoodBatch.setDate(expGoodBatch.getDate() + 30); // Còn 30 ngày / tổng 40 ngày = 75% >= 70%

  const grTest = new GoodsReceipt({
    receiptNumber: 'REC-DC-001',
    supplierId: 1,
    receivedBy: 4,
    batches: [
      { batchCode: 'B-GOOD', manufactureDate: mfg, expiryDate: expGoodBatch, initialQuantity: 50, importPrice: 20000 },
      { batchCode: 'B-BAD', manufactureDate: mfg, expiryDate: badImp, initialQuantity: 20, importPrice: 20000 }
    ]
  });
  assert(grTest.getTotalQuantity() === 70, 'GoodsReceipt: Tổng số lượng 2 lô = 70');
  const grFreshCheck = grTest.validateInboundFreshness(70.0);
  assert(grFreshCheck.isAcceptable === false, 'Rule 7: GoodsReceipt từ chối nhận nếu có lô RSL < 70%');
  assert(grFreshCheck.rejectedCount === 1, 'GoodsReceipt: Phát hiện chính xác 1 lô bị từ chối');

  // ============================================================================
  // PHẦN 3: DOMAIN SERVICES
  // ============================================================================
  console.log('\n📦 PHẦN 3: KIỂM THỬ CÁC DOMAIN SERVICES CỐT LÕI');

  // 1. FefoAllocationPolicy (Rule 2 & 3: FEFO bẻ lô & Chống âm kho)
  const FefoAllocationPolicy = require('./src/domain/services/FefoAllocationPolicy');
  const expNear = new Date(today); expNear.setDate(expNear.getDate() + 2); // 2 ngày nữa hết hạn
  const expFar = new Date(today); expFar.setDate(expFar.getDate() + 25);  // 25 ngày nữa hết hạn

  const mockBatches = [
    { id: 2, batchCode: 'LOT-FAR', expiryDate: expFar, currentQuantity: 50, discountPercent: 0 },
    { id: 1, batchCode: 'LOT-NEAR', expiryDate: expNear, currentQuantity: 10, discountPercent: 30 }
  ];

  // Khách mua 15 sản phẩm -> FEFO bẻ 10 SP từ LOT-NEAR (giá giảm 30%) + 5 SP từ LOT-FAR (nguyên giá)
  const allocation = FefoAllocationPolicy.allocate({
    productId: 1,
    productName: 'Sữa tươi Vinamilk',
    requestedQuantity: 15,
    sellingPrice: 30000,
    availableBatches: mockBatches
  });
  assert(allocation.isSplitOrder === true, 'FEFO tự động bẻ đơn qua 2 lô (Split Order Scenario)');
  assert(allocation.allocations[0].batchCode === 'LOT-NEAR', 'Lô cận date (LOT-NEAR) được xuất trước tiên');
  assert(allocation.allocations[0].quantityAllocated === 10, 'LOT-NEAR xuất hết 10 SP');
  assert(allocation.allocations[0].unitPrice === 21000, 'LOT-NEAR áp đúng giá giảm 30%: 21.000 đ');
  assert(allocation.allocations[1].batchCode === 'LOT-FAR', 'LOT-FAR xuất tiếp 5 SP bù thiếu');
  assert(allocation.allocations[1].unitPrice === 30000, 'LOT-FAR bán theo giá nguyên 30.000 đ');
  assert(allocation.totalAmount === (10 * 21000 + 5 * 30000), 'Tổng tiền hóa đơn = 360.000 đ');

  // Thử mua vượt tồn kho -> Chống âm kho
  let errorCaught = false;
  try {
    FefoAllocationPolicy.allocate({
      productId: 1,
      requestedQuantity: 9999,
      sellingPrice: 30000,
      availableBatches: mockBatches
    });
  } catch (e) {
    errorCaught = true;
  }
  assert(errorCaught === true, 'Rule 3: Chặn đứng giao dịch khi khách mua vượt tổng tồn khả dụng');

  // 2. MarkdownPricingPolicy (Rule 10: 4 mức chiết khấu chuẩn)
  const MarkdownPricingPolicy = require('./src/domain/services/MarkdownPricingPolicy');
  assert(MarkdownPricingPolicy.isAllowedPercent(15) === true, 'Cho phép giảm 15%');
  assert(MarkdownPricingPolicy.isAllowedPercent(30) === true, 'Cho phép giảm 30%');
  assert(MarkdownPricingPolicy.isAllowedPercent(40) === true, 'Cho phép giảm 40%');
  assert(MarkdownPricingPolicy.isAllowedPercent(50) === true, 'Cho phép giảm 50%');
  assert(MarkdownPricingPolicy.isAllowedPercent(25) === false, 'Chặn các mức giảm khác (ví dụ: 25%)');

  const recRed = MarkdownPricingPolicy.recommendMarkdown(2, 7);
  assert(recRed.recommendedPercent === 50 && recRed.alertLevel === 'RED', 'Vùng Đỏ (<= 3 ngày): Gợi ý xả kịch sàn 50%');
  const recYellow = MarkdownPricingPolicy.recommendMarkdown(5, 7);
  assert(recYellow.recommendedPercent === 30 && recYellow.alertLevel === 'YELLOW', 'Vùng Vàng (<= 7 ngày): Gợi ý xả 30%');

  // 3. RopCalculationService (Rule 8: ROP đa biến & Cảnh báo DOS > DUE)
  const RopCalculationService = require('./src/domain/services/RopCalculationService');
  const ropResult = RopCalculationService.calculateROP({
    productId: 1,
    productName: 'Bánh tươi Sandwich',
    categoryCode: 'BAKERY',
    currentStock: 10,
    minStockLevel: 15,
    maxStockLevel: 60,
    leadTimeDays: 1,
    salesHistory14Days: [10, 12, 10, 11, 14, 15, 12, 11, 10, 13, 12, 11, 12, 13], // TB ~ 12 SP/ngày
    weather: 'RAINY', // Hệ số bánh mì trời mưa = 1.25
    isHoliday: true,  // Hệ số ngày lễ = 1.30
    earliestBatchDaysLeft: 4 // DUE = 4 ngày
  });
  assert(ropResult.weatherFactor === 1.25, 'Hệ số thời tiết mưa cho Bakery = 1.25');
  assert(ropResult.holidayFactor === 1.30, 'Hệ số ngày lễ = 1.30');
  assert(ropResult.isReorderNeeded === true, 'Tồn hiện tại (10) <= ROP -> Bật cờ đặt hàng bổ sung');
  assert(ropResult.suggestedOrderQuantity > 0, 'Có đề xuất số lượng đặt hàng gửi DC');

  // Test cảnh báo DOS > DUE (Nguy cơ ứ đọng date)
  const ropStagnant = RopCalculationService.calculateROP({
    productId: 2,
    productName: 'Sữa chua',
    categoryCode: 'DAIRY',
    currentStock: 100, // Tồn rất nhiều
    minStockLevel: 20,
    maxStockLevel: 150,
    leadTimeDays: 1,
    salesHistory14Days: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], // Bán chậm 2 SP/ngày -> DOS = 50 ngày
    weather: 'NORMAL',
    isHoliday: false,
    earliestBatchDaysLeft: 5 // DUE chỉ còn 5 ngày! DOS (50) > DUE (5)
  });
  assert(ropStagnant.isRiskOfSpoilage === true, 'Rule 8: Phát hiện chính xác rủi ro ứ đọng quá hạn (DOS > DUE)');

  // 4. ProductDeduplicationService (Rule 9: Chống trùng lặp sản phẩm >= 85%)
  const ProductDeduplicationService = require('./src/domain/services/ProductDeduplicationService');
  const existingList = [
    { id: 1, sku: '8934567890101', name: 'Sữa tươi tiệt trùng Vinamilk 100% Không đường 1L', normalizedName: 'sua tuoi tiet trung vinamilk 100% khong duong 1l' }
  ];
  // Thử trùng SKU
  const dupSku = ProductDeduplicationService.checkDuplicate({ sku: '8934567890101', name: 'Sữa khác' }, existingList);
  assert(dupSku.isDuplicate === true, 'Rule 9: Chặn trùng mã SKU');

  // Thử tên tương đồng >= 85%
  const dupName = ProductDeduplicationService.checkDuplicate(
    { sku: '8939999999999', name: 'Sữa tươi tiệt trùng Vinamilk 100% Không đường 1 lít' },
    existingList
  );
  assert(dupName.isDuplicate === true, 'Rule 9: Chặn tên tương đồng >= 85% ("1L" vs "1 lít")');

  // ============================================================================
  // PHẦN 4: 10 REPOSITORIES & TRUY XUẤT SQL SERVER LOCALDB
  // ============================================================================
  console.log('\n📦 PHẦN 4: KIỂM THỬ TRUY XUẤT THỰC TẾ 10 SQL REPOSITORIES');

  const SqlUserRepository = require('./src/infrastructure/database/repositories/SqlUserRepository');
  const userRepo = new SqlUserRepository();
  const adminUser = await userRepo.findByUsername('admin');
  assert(adminUser !== null && adminUser.username === 'admin', 'SqlUserRepository: Lấy đúng user admin');

  const SqlStoreProfileRepository = require('./src/infrastructure/database/repositories/SqlStoreProfileRepository');
  const storeRepo = new SqlStoreProfileRepository();
  const store = await storeRepo.getProfile();
  assert(store !== null && store.storeCode === 'RETAIL-STORE-01', 'SqlStoreProfileRepository: Cửa hàng RETAIL-STORE-01 (Rule 1)');

  const SqlCategoryRepository = require('./src/infrastructure/database/repositories/SqlCategoryRepository');
  const catRepo = new SqlCategoryRepository();
  const cats = await catRepo.findAll();
  assert(Array.isArray(cats) && cats.length > 0, `SqlCategoryRepository: Tìm thấy ${cats.length} ngành hàng FMCG`);

  const SqlProductRepository = require('./src/infrastructure/database/repositories/SqlProductRepository');
  const prodRepo = new SqlProductRepository();
  const prods = await prodRepo.findAll();
  assert(Array.isArray(prods) && prods.length > 0, `SqlProductRepository: Tìm thấy ${prods.length} sản phẩm`);

  const SqlBatchRepository = require('./src/infrastructure/database/repositories/SqlBatchRepository');
  const batchRepo = new SqlBatchRepository();
  const batches = await batchRepo.findAllWithAlerts();
  assert(Array.isArray(batches) && batches.length > 0, `SqlBatchRepository: Tìm thấy ${batches.length} lô qua View 3 màu`);

  const SqlSaleRepository = require('./src/infrastructure/database/repositories/SqlSaleRepository');
  const saleRepo = new SqlSaleRepository();
  const todaySales = await saleRepo.getTodaySalesSummary();
  assert(todaySales !== null && todaySales.todayTotalRevenue !== undefined, 'SqlSaleRepository: Tổng kết doanh số hôm nay');

  const SqlSpoilageRepository = require('./src/infrastructure/database/repositories/SqlSpoilageRepository');
  const spoilRepo = new SqlSpoilageRepository();
  const lossSummary = await spoilRepo.getLossSummary();
  assert(lossSummary !== null && lossSummary.totalCostLoss !== undefined, 'SqlSpoilageRepository: Thống kê Sổ hao hụt tài chính');

  const SqlPurchaseOrderRepository = require('./src/infrastructure/database/repositories/SqlPurchaseOrderRepository');
  const poRepo = new SqlPurchaseOrderRepository();
  const pos = await poRepo.findAll();
  assert(Array.isArray(pos), 'SqlPurchaseOrderRepository: Lấy danh sách PO qua findAll()');

  const SqlGoodsReceiptRepository = require('./src/infrastructure/database/repositories/SqlGoodsReceiptRepository');
  const grRepo = new SqlGoodsReceiptRepository();
  const grs = await grRepo.findRecent(10);
  assert(Array.isArray(grs), 'SqlGoodsReceiptRepository: Lấy danh sách phiếu nhập DC');

  const SqlAuditLogRepository = require('./src/infrastructure/database/repositories/SqlAuditLogRepository');
  const auditRepo = new SqlAuditLogRepository();
  const logs = await auditRepo.findRecent(10);
  assert(Array.isArray(logs) && logs.length > 0, `SqlAuditLogRepository: Lấy ${logs.length} bản ghi nhật ký kiểm toán (Rule 11)`);

  const SqlSupplierRepository = require('./src/infrastructure/database/repositories/SqlSupplierRepository');
  const supRepo = new SqlSupplierRepository();
  const sups = await supRepo.findAll();
  assert(Array.isArray(sups) && sups.length > 0, `SqlSupplierRepository: Lấy danh sách ${sups.length} nhà cung cấp / DC`);
  const dcBienHoa = await supRepo.findByCode('DC-BIENHOA');
  assert(dcBienHoa !== null && dcBienHoa.code === 'DC-BIENHOA', 'SqlSupplierRepository: Lấy đúng Kho tổng DC Biên Hòa');

  console.log('\n================================================================');
  console.log('🎉 TOÀN BỘ 83/83 KIỂM THỬ BƯỚC 3 ĐÃ PASS HOÀN TOÀN 100%!');
  console.log('================================================================');
}

runStep3Audit().catch(err => {
  console.error('\n❌ KIỂM THỬ BƯỚC 3 THẤT BẠI:', err.message);
  process.exitCode = 1;
});
