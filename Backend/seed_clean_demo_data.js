// seed_clean_demo_data.js
// Script dọn dẹp và chuẩn hóa dữ liệu CSDL phục vụ demo và bảo vệ đồ án
const SqlConnection = require('./src/infrastructure/database/sqlConnection');
const LoginUseCase = require('./src/application/use-cases/auth/LoginUseCase');
const backupDatabase = require('./backup_database');

async function cleanDemoData() {
  console.log('================================================================');
  console.log('🧹 BẮT ĐẦU DỌN DẸP & CHUẨN HÓA DỮ LIỆU CSDL DEMO LHU MART');
  console.log('================================================================\n');

  try {
    // 1. Xóa người dùng test brute-force
    console.log('1. Xóa các tài khoản tạm phát sinh khi chạy test...');
    await SqlConnection.executeSql(`
      DELETE FROM users WHERE username LIKE 'test_%' OR id > 3;
      DELETE FROM roles WHERE id > 3 OR code = 'WAREHOUSE_STAFF';
      UPDATE users SET is_active = 1 WHERE username IN ('admin', 'manager', 'cashier');
    `);
    // Reset cache brute-force
    LoginUseCase.resetFailedAttempts('admin');
    LoginUseCase.resetFailedAttempts('manager');
    LoginUseCase.resetFailedAttempts('cashier');
    console.log('   ✅ Đã kích hoạt 3 tài khoản chuẩn (admin, manager, cashier) và xóa user test.');

    // 2. Chuẩn hóa Store Profile
    console.log('\n2. Đồng bộ chuẩn thông tin cửa hàng RETAIL-STORE-01 (Rule 1 SSOT)...');
    await SqlConnection.executeSql(`
      UPDATE store_profile 
      SET store_code = 'RETAIL-STORE-01',
          store_name = N'Cửa hàng Bán lẻ Tiện lợi LHU Mart (Cơ sở Huỳnh Văn Nghệ)',
          address = N'Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai',
          phone = '0251 3952 778',
          default_dc_supplier_name = N'Trung tâm Phân phối Kho tổng DC Biên Hòa',
          min_inbound_rsl_percent = 70,
          lead_time_days = 1,
          shelf_capacity_skus = 1500,
          shelf_capacity_units = 5000,
          status = 'OPEN'
      WHERE id = 1;
    `);
    console.log('   ✅ Hồ sơ cửa hàng: RETAIL-STORE-01, DC Biên Hòa, RSL >= 70%, Status: OPEN.');

    // 3. Dọn dẹp ngành hàng & nhà cung cấp thử nghiệm
    console.log('\n3. Dọn dẹp ngành hàng & nhà cung cấp thử nghiệm...');
    await SqlConnection.executeSql(`
      DELETE FROM categories 
      WHERE code LIKE 'CAT_%' 
        AND id NOT IN (SELECT DISTINCT category_id FROM products);
      
      DELETE FROM suppliers
      WHERE (code LIKE 'SUP-TEST-%' OR code LIKE 'SUP-INVALID-%' OR code LIKE 'SUP-%')
        AND id NOT IN (SELECT DISTINCT default_supplier_id FROM products)
        AND id NOT IN (SELECT DISTINCT supplier_id FROM purchase_orders);
    `);
    console.log('   ✅ Danh mục ngành hàng sạch sẽ (7 nhóm FMCG) & Nhà cung cấp đối tác chuẩn.');

    // 4. Kích hoạt toàn bộ sản phẩm chuẩn
    console.log('\n4. Kích hoạt và dọn dẹp sản phẩm FMCG...');
    await SqlConnection.executeSql(`
      UPDATE products SET is_active = 1 WHERE id <= 46;
      DELETE FROM products WHERE sku LIKE 'SKU-TEST-%' OR sku LIKE 'SKU-UNIT-%' OR name LIKE N'Sản phẩm thử nghiệm%';
    `);
    console.log('   ✅ Toàn bộ 40+ sản phẩm bán lẻ đã được kích hoạt hoạt động.');

    // 5. Kiểm tra và bổ sung 1 biên bản tiêu hủy PENDING để Cửa hàng trưởng demo phê duyệt
    console.log('\n5. Kiểm tra biên bản tiêu hủy PENDING chờ Cửa hàng trưởng phê duyệt...');
    const pendingCheck = await SqlConnection.queryJson(`
      SELECT COUNT(*) as pendingCount FROM spoilage_records WHERE approved_by IS NULL
    `);
    if (!pendingCheck[0] || pendingCheck[0].pendingCount === 0) {
      const targetBatch = await SqlConnection.queryJson(`
        SELECT TOP 1 id, batch_code, import_price, current_quantity 
        FROM batches 
        WHERE current_quantity >= 3 
        ORDER BY expiry_date ASC
      `);
      if (targetBatch && targetBatch.length > 0) {
        const b = targetBatch[0];
        const recCode = `SPOIL-DEMO-${Date.now().toString().slice(-4)}`;
        const costLoss = 3 * b.import_price;
        await SqlConnection.executeSql(`
          INSERT INTO spoilage_records (
            record_code, batch_id, quantity_disposed, cost_loss, reason, notes, performed_by, approved_by, disposed_date, created_at
          ) VALUES (
            '${recCode}', ${b.id}, 3, ${costLoss}, 'DAMAGED', N'Bao bì móp méo rách seal trong quá trình xếp dỡ lên kệ (Chờ quản lý duyệt)', 3, NULL, GETDATE(), GETDATE()
          );
        `);
        console.log(`   ✅ Đã tạo biên bản [${recCode}] trạng thái PENDING chờ demo phê duyệt!`);
      }
    } else {
      console.log(`   ℹ️ Hiện đã có ${pendingCheck[0].pendingCount} biên bản PENDING sẵn sàng chờ demo.`);
    }

    // 6. Kiểm tra và bổ sung 1 đơn hàng PO DRAFT để Quản lý demo duyệt và gửi DC
    console.log('\n6. Kiểm tra đơn đặt hàng PO trạng thái DRAFT chờ phê duyệt...');
    const poCheck = await SqlConnection.queryJson(`
      SELECT COUNT(*) as draftCount FROM purchase_orders WHERE status = 'DRAFT'
    `);
    if (!poCheck[0] || poCheck[0].draftCount === 0) {
      const poCode = `PO-DEMO-${Date.now().toString().slice(-4)}`;
      await SqlConnection.executeSql(`
        INSERT INTO purchase_orders (
          order_code, supplier_id, created_by, status, total_estimated_cost, notes, order_date, created_at
        ) VALUES (
          '${poCode}', 1, 2, 'DRAFT', 1400000, N'Đơn đặt hàng bổ sung cuối tuần cho kho tổng DC Biên Hòa (Chờ quản lý duyệt)', GETDATE(), GETDATE()
        );
        DECLARE @NewPoId INT = SCOPE_IDENTITY();
        INSERT INTO purchase_order_items (
          order_id, product_id, current_stock_at_order, suggested_quantity, approved_quantity, unit_cost
        ) VALUES (
          @NewPoId, 1, 10, 50, 50, 28000
        );
      `);
      console.log(`   ✅ Đã tạo đơn đặt hàng [${poCode}] trạng thái DRAFT chờ demo phê duyệt!`);
    } else {
      console.log(`   ℹ️ Hiện đã có ${poCheck[0].draftCount} đơn hàng DRAFT sẵn sàng chờ demo.`);
    }

    // 7. Tự động sao lưu dữ liệu sạch vào file snapshot .bak
    console.log('\n7. Tự động sao lưu dữ liệu sạch vào file snapshot...');
    await backupDatabase();

    console.log('\n================================================================');
    console.log('🎉 HOÀN TẤT CHUẨN HÓA DỮ LIỆU DEMO SẴN SÀNG CHO BÁO CÁO & BẢO VỆ!');
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khi dọn dẹp dữ liệu demo:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  cleanDemoData();
}

module.exports = cleanDemoData;

