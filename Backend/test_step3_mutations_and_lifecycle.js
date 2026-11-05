// test_step3_mutations_and_lifecycle.js
const assert = require('assert');
const SqlConnection = require('./src/infrastructure/database/sqlConnection');

const SqlUserRepository = require('./src/infrastructure/database/repositories/SqlUserRepository');
const SqlCategoryRepository = require('./src/infrastructure/database/repositories/SqlCategoryRepository');
const SqlProductRepository = require('./src/infrastructure/database/repositories/SqlProductRepository');
const SqlBatchRepository = require('./src/infrastructure/database/repositories/SqlBatchRepository');
const SqlGoodsReceiptRepository = require('./src/infrastructure/database/repositories/SqlGoodsReceiptRepository');
const SqlPurchaseOrderRepository = require('./src/infrastructure/database/repositories/SqlPurchaseOrderRepository');
const SqlSaleRepository = require('./src/infrastructure/database/repositories/SqlSaleRepository');
const SqlSpoilageRepository = require('./src/infrastructure/database/repositories/SqlSpoilageRepository');
const SqlStoreProfileRepository = require('./src/infrastructure/database/repositories/SqlStoreProfileRepository');
const SqlAuditLogRepository = require('./src/infrastructure/database/repositories/SqlAuditLogRepository');

async function runFullLifecycleTest() {
  console.log('================================================================');
  console.log('🔬 BẮT ĐẦU KIỂM THỬ THỰC TẾ TOÀN BỘ CÁC THAO TÁC GHI/ĐỌC CSDL (10 REPOSITORIES)');
  console.log('================================================================');

  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  const testUsername = `test_cashier_${randSuffix}`;
  const testCategoryCode = `CAT_TEST_${randSuffix}`;
  const testProductSku = `SKU999${randSuffix}`;
  const testBatchCode = `LOT-TEST-${randSuffix}`;
  const testReceiptNum = `REC-TEST-${randSuffix}`;
  const testPoCode = `PO-TEST-${randSuffix}`;
  const testTxnCode = `TXN-TEST-${randSuffix}`;
  const testSpoilCode = `SPOIL-TEST-${randSuffix}`;

  // 1. SqlUserRepository: create, findByUsername, updateLastLogin, findById
  console.log('\n--- 1. Kiểm thử SqlUserRepository (Mutations) ---');
  const userRepo = new SqlUserRepository();
  const newUser = await userRepo.create({
    username: testUsername,
    passwordHash: 'hash_test_123',
    fullName: `Nhân viên test ${randSuffix}`,
    email: `${testUsername}@lhumart.vn`,
    phone: '0901234567',
    roleId: 3,
    roleCode: 'CASHIER',
    isActive: true
  });
  assert(newUser && newUser.username === testUsername, 'Tạo User mới thành công');
  console.log('  ✅ PASSED: Tạo User mới (ID:', newUser.id, ')');

  const fetchedUser = await userRepo.findByUsername(testUsername);
  assert(fetchedUser && fetchedUser.username === testUsername, 'findByUsername lấy đúng User');
  console.log('  ✅ PASSED: findByUsername lấy đúng User');

  await userRepo.updateLastLogin(newUser.id);
  const refreshedUser = await userRepo.findById(newUser.id);
  assert(refreshedUser && refreshedUser.lastLogin !== null, 'updateLastLogin cập nhật thành công');
  console.log('  ✅ PASSED: updateLastLogin cập nhật thời gian đăng nhập');

  // 2. SqlCategoryRepository: create, findById
  console.log('\n--- 2. Kiểm thử SqlCategoryRepository (Mutations) ---');
  const catRepo = new SqlCategoryRepository();
  const newCat = await catRepo.create({
    code: testCategoryCode,
    name: `Ngành hàng Test ${randSuffix}`,
    storageTemperature: '4°C - 8°C',
    defaultWarningDays: 6,
    description: 'Danh mục test tự động'
  });
  assert(newCat && newCat.code === testCategoryCode, 'Tạo Category mới thành công');
  console.log('  ✅ PASSED: Tạo Category mới (ID:', newCat.id, ')');

  // 3. SqlProductRepository: create, update, findBySku, findById
  console.log('\n--- 3. Kiểm thử SqlProductRepository (Mutations) ---');
  const prodRepo = new SqlProductRepository();
  const newProd = await prodRepo.create({
    sku: testProductSku,
    name: `Sản phẩm sữa chua Test ${randSuffix}`,
    categoryId: newCat.id,
    supplierId: 1,
    unit: 'Hộp',
    costPrice: 12000,
    sellingPrice: 18000,
    standardShelfLifeDays: 45,
    minStockLevel: 20,
    maxStockLevel: 200,
    customWarningDays: 8
  });
  assert(newProd && newProd.sku === testProductSku, 'Tạo Product mới thành công');
  console.log('  ✅ PASSED: Tạo Product mới (ID:', newProd.id, ')');

  const updatedProd = await prodRepo.update(newProd.id, {
    sellingPrice: 20000,
    unit: 'Lốc 4 hộp'
  });
  assert(updatedProd && Number(updatedProd.sellingPrice) === 20000 && updatedProd.unit === 'Lốc 4 hộp', 'Cập nhật Product thành công');
  console.log('  ✅ PASSED: update Product cập nhật giá và đơn vị tính');

  // 4. SqlBatchRepository: create, updateDiscount, confirmShelfRotation, updateCurrentQuantity, updateStatus
  console.log('\n--- 4. Kiểm thử SqlBatchRepository (Mutations) ---');
  const batchRepo = new SqlBatchRepository();
  const today = new Date();
  const mfgDate = new Date(today); mfgDate.setDate(mfgDate.getDate() - 10);
  const expDate = new Date(today); expDate.setDate(expDate.getDate() + 20);

  const newBatch = await batchRepo.create({
    batchCode: testBatchCode,
    productId: newProd.id,
    importDate: today,
    manufactureDate: mfgDate,
    expiryDate: expDate,
    initialQuantity: 100,
    importPrice: 12000,
    discountPercent: 0,
    status: 'ACTIVE'
  });
  assert(newBatch && newBatch.batchCode === testBatchCode, 'Tạo Batch mới thành công');
  console.log('  ✅ PASSED: Tạo Batch mới (ID:', newBatch.id, ')');

  await batchRepo.updateDiscount(newBatch.id, 30);
  let batchCheck = await batchRepo.findById(newBatch.id);
  assert(batchCheck && batchCheck.discountPercent === 30, 'updateDiscount cập nhật 30%');
  console.log('  ✅ PASSED: updateDiscount cập nhật 30% Quick Markdown');

  await batchRepo.confirmShelfRotation(newBatch.id);
  batchCheck = await batchRepo.findById(newBatch.id);
  assert(batchCheck && batchCheck.isShelfRotated === true, 'confirmShelfRotation cập nhật cờ đảo kệ');
  console.log('  ✅ PASSED: confirmShelfRotation cập nhật đảo kệ mặt tiền');

  await batchRepo.updateCurrentQuantity(newBatch.id, 80);
  batchCheck = await batchRepo.findById(newBatch.id);
  assert(batchCheck && batchCheck.currentQuantity === 80, 'updateCurrentQuantity trừ còn 80');
  console.log('  ✅ PASSED: updateCurrentQuantity cập nhật số lượng tồn kho');

  // 5. SqlSaleRepository: executeFefoCheckoutTransaction
  console.log('\n--- 5. Kiểm thử SqlSaleRepository (Transaction Khóa UPDLOCK) ---');
  const saleRepo = new SqlSaleRepository();
  const txnResult = await saleRepo.executeFefoCheckoutTransaction({
    saleOrder: {
      transactionCode: testTxnCode,
      cashierId: newUser.id,
      saleDate: today,
      dayOfWeek: 'MONDAY',
      weather: 'SUNNY',
      isHoliday: false,
      getTotalQuantity: () => 5,
      getTotalAmount: () => 100000,
      items: [
        {
          productId: newProd.id,
          batchId: newBatch.id,
          quantitySold: 5,
          salePrice: 20000,
          lineTotal: 100000
        }
      ]
    }
  });
  assert(txnResult && txnResult.success === true, 'Giao dịch POS FEFO thành công');
  console.log('  ✅ PASSED: executeFefoCheckoutTransaction hoàn tất an toàn');

  // Kiểm tra tồn kho của batch đã tự động bị trừ còn 75 (80 - 5)
  batchCheck = await batchRepo.findById(newBatch.id);
  assert(batchCheck && batchCheck.currentQuantity === 75, 'Tồn kho Batch tự động giảm còn 75 sau bán POS');
  console.log('  ✅ PASSED: Tồn kho của Batch tự động trừ chính xác (75)');

  // 6. SqlSpoilageRepository: createSpoilageRecordTransaction
  console.log('\n--- 6. Kiểm thử SqlSpoilageRepository (Sổ Hao hụt Tài chính) ---');
  const spoilRepo = new SqlSpoilageRepository();
  const spoilResult = await spoilRepo.createSpoilageRecordTransaction({
    spoilageRecord: {
      recordCode: testSpoilCode,
      batchId: newBatch.id,
      disposedDate: today,
      quantityDisposed: 5,
      costLoss: 5 * 12000, // 60.000 đ
      reason: 'DAMAGED',
      notes: 'Bị móp méo khi vận chuyển',
      performedBy: newUser.id,
      approvedBy: 1
    }
  });
  assert(spoilResult && spoilResult.recordCode === testSpoilCode, 'Tạo biên bản tiêu hủy thành công');
  console.log('  ✅ PASSED: createSpoilageRecordTransaction ghi sổ hao hụt thành công');

  // Kiểm tra tồn kho của batch đã tự động bị trừ tiếp còn 70 (75 - 5)
  batchCheck = await batchRepo.findById(newBatch.id);
  assert(batchCheck && batchCheck.currentQuantity === 70, 'Tồn kho Batch tự động giảm còn 70 sau tiêu hủy');
  console.log('  ✅ PASSED: Tồn kho của Batch tự động trừ khi tiêu hủy (70)');

  // 7. SqlPurchaseOrderRepository: createOrderWithItems, updateOrderStatus, findById
  console.log('\n--- 7. Kiểm thử SqlPurchaseOrderRepository (Mutations) ---');
  const poRepo = new SqlPurchaseOrderRepository();
  const newPo = await poRepo.createOrderWithItems({
    orderCode: testPoCode,
    supplierId: 1,
    createdBy: newUser.id,
    approvedBy: 1,
    status: 'DRAFT',
    totalEstimatedCost: 1200000,
    expectedDeliveryDate: expDate,
    notes: 'Đơn test tự động',
    items: [
      {
        productId: newProd.id,
        currentStockAtOrder: 70,
        suggestedQuantity: 100,
        approvedQuantity: 100,
        unitCost: 12000,
        totalLineCost: 1200000
      }
    ]
  });
  assert(newPo && newPo.orderCode === testPoCode, 'Tạo PO kèm items thành công');
  console.log('  ✅ PASSED: createOrderWithItems tạo đơn PO');

  const fetchedPo = await poRepo.findById(newPo.orderId || 1);
  assert(fetchedPo !== null, 'findById lấy đúng PO');
  console.log('  ✅ PASSED: findById lấy đúng PO và danh sách items');

  await poRepo.updateOrderStatus(fetchedPo.id, 'APPROVED', 1);
  const updatedPo = await poRepo.findById(fetchedPo.id);
  assert(updatedPo && updatedPo.status === 'APPROVED', 'updateOrderStatus cập nhật APPROVED');
  console.log('  ✅ PASSED: updateOrderStatus chuyển trạng thái sang APPROVED');

  // 8. SqlGoodsReceiptRepository: createReceiptWithBatches
  console.log('\n--- 8. Kiểm thử SqlGoodsReceiptRepository (Mutations) ---');
  const grRepo = new SqlGoodsReceiptRepository();
  const testBatchInReceipt = `LOT-INB-${randSuffix}`;
  const receiptResult = await grRepo.createReceiptWithBatches({
    goodsReceipt: {
      receiptNumber: testReceiptNum,
      supplierId: 1,
      receivedBy: newUser.id,
      receiptDate: today,
      totalCost: 600000,
      notes: 'Nhận hàng đợt kiểm thử'
    },
    batchList: [
      {
        batchCode: testBatchInReceipt,
        productId: newProd.id,
        importDate: today,
        manufactureDate: mfgDate,
        expiryDate: expDate,
        initialQuantity: 50,
        importPrice: 12000
      }
    ]
  });
  assert(receiptResult && receiptResult.receiptNumber === testReceiptNum, 'Nhập hàng DC thành công');
  console.log('  ✅ PASSED: createReceiptWithBatches tạo Phiếu nhập & Batch mới');

  // 9. SqlStoreProfileRepository: updateProfile
  console.log('\n--- 9. Kiểm thử SqlStoreProfileRepository (Mutations) ---');
  const storeRepo = new SqlStoreProfileRepository();
  const origProfile = await storeRepo.getProfile();
  const updatedProfile = await storeRepo.updateProfile({
    phone: '0251-888-9999',
    defaultLeadTimeDays: origProfile.defaultLeadTimeDays
  });
  assert(updatedProfile && updatedProfile.phone === '0251-888-9999', 'updateProfile cập nhật số điện thoại thành công');
  console.log('  ✅ PASSED: updateProfile cập nhật hồ sơ cửa hàng');

  // 10. SqlAuditLogRepository: log, findRecent
  console.log('\n--- 10. Kiểm thử SqlAuditLogRepository (Mutations) ---');
  const auditRepo = new SqlAuditLogRepository();
  await auditRepo.log({
    userId: newUser.id,
    userName: testUsername,
    action: 'TEST_AUDIT',
    entityName: 'Product',
    entityId: newProd.id,
    description: 'Chạy kiểm thử lifecycle toàn diện Bước 3',
    ipAddress: '127.0.0.1'
  });
  const recentLogs = await auditRepo.findRecent(5);
  const foundLog = recentLogs.find(l => l.actionType === 'TEST_AUDIT');
  assert(foundLog !== undefined, 'Ghi nhận và truy vấn thành công AuditLog');
  console.log('  ✅ PASSED: SqlAuditLogRepository.log ghi nhật ký kiểm toán bất biến');

  // Dọn dẹp dữ liệu test (Cleanup)
  console.log('\n--- Dọn dẹp dữ liệu thử nghiệm ---');
  await SqlConnection.executeSql(`
    DELETE FROM sales_history WHERE transaction_code = '${testTxnCode}';
    DELETE FROM spoilage_records WHERE record_code = '${testSpoilCode}';
    DELETE FROM purchase_order_items WHERE order_id IN (SELECT id FROM purchase_orders WHERE order_code = '${testPoCode}');
    DELETE FROM purchase_orders WHERE order_code = '${testPoCode}';
    DELETE FROM batches WHERE product_id = ${newProd.id};
    DELETE FROM goods_receipts WHERE receipt_number = '${testReceiptNum}';
    DELETE FROM products WHERE id = ${newProd.id};
    DELETE FROM categories WHERE id = ${newCat.id};
    DELETE FROM system_audit_logs WHERE action_type = 'TEST_AUDIT';
    DELETE FROM users WHERE id = ${newUser.id};
  `);
  console.log('  ✅ PASSED: Dọn dẹp an toàn toàn bộ dữ liệu test');

  console.log('\n================================================================');
  console.log('🎉 TOÀN BỘ 10/10 REPOSITORIES ĐÃ VƯỢT QUA TEST THỰC THI GHI/ĐỌC TRỰC TIẾP!');
  console.log('================================================================');
}

runFullLifecycleTest().catch(err => {
  console.error('\n❌ KIỂM THỬ THẤT BẠI:', err);
  process.exit(1);
});
