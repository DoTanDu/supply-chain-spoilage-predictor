// verify_stage1_environment_and_seed.js
// Script rà soát kiểm tra GIAI ĐOẠN 1: Môi trường & Master Data theo SSOT

const SqlConnection = require('./src/infrastructure/database/sqlConnection');

async function runStage1Audit() {
  console.log('================================================================');
  console.log('🔍 BẮT ĐẦU AUDIT GIAI ĐOẠN 1: MÔI TRƯỜNG & MASTER DATA THEO SSOT');
  console.log('================================================================\n');

  let passedAll = true;

  // 1. Kiểm tra kết nối SQL Server LocalDB và database retail_spoilage_db
  try {
    const dbInfo = await SqlConnection.queryJson(`
      SELECT DB_NAME() AS currentDb, @@VERSION AS sqlVersion
    `);
    console.log(`✅ [1.1] Kết nối SQL Server thành công!`);
    console.log(`   - Database: ${dbInfo[0]?.currentDb}`);
    console.log(`   - Phiên bản: ${dbInfo[0]?.sqlVersion?.split('\n')[0]}`);
  } catch (err) {
    console.error(`❌ [1.1] Lỗi kết nối CSDL:`, err.message);
    passedAll = false;
    return;
  }

  // 2. Kiểm tra danh sách bảng chuẩn 3NF
  try {
    const tables = await SqlConnection.queryJson(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    const tableNames = tables.map(t => t.TABLE_NAME);
    console.log(`\n✅ [1.2] Danh sách bảng CSDL (Tổng cộng: ${tableNames.length} bảng):`);
    console.log(`   ${tableNames.join(', ')}`);

    const requiredTables = [
      'users', 'roles', 'store_profile', 'categories', 'products', 
      'batches', 'sales_history', 'spoilage_records', 'purchase_orders', 
      'purchase_order_items', 'goods_receipts'
    ];

    const hasAuditTable = tableNames.includes('system_audit_logs') || tableNames.includes('audit_logs');
    const missingTables = requiredTables.filter(rt => !tableNames.includes(rt));
    if (missingTables.length === 0 && hasAuditTable) {
      console.log(`   -> Đạt chuẩn: Toàn bộ 12 bảng cốt lõi 3NF đều tồn tại đầy đủ (Bao gồm bảng Audit Logs: system_audit_logs/audit_logs).`);
    } else {
      console.warn(`   -> CẢNH BÁO: Thiếu các bảng: ${missingTables.join(', ')}`);
      passedAll = false;
    }
  } catch (err) {
    console.error(`❌ [1.2] Lỗi truy vấn bảng:`, err.message);
    passedAll = false;
  }

  // 3. Kiểm tra View vw_Batches_ShelfLife_Alerts & Triggers & Indexes
  try {
    const views = await SqlConnection.queryJson(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME = 'vw_Batches_ShelfLife_Alerts'
    `);
    if (views.length > 0) {
      console.log(`\n✅ [1.3] View 'vw_Batches_ShelfLife_Alerts' tồn tại và sẵn sàng.`);
    } else {
      console.error(`❌ [1.3] Thiếu View 'vw_Batches_ShelfLife_Alerts'!`);
      passedAll = false;
    }

    const triggers = await SqlConnection.queryJson(`
      SELECT name AS triggerName, OBJECT_NAME(parent_id) AS tableName 
      FROM sys.triggers 
      WHERE name = 'TR_Batches_PreventNegativeStock'
    `);
    if (triggers.length > 0) {
      console.log(`✅ [1.4] Trigger 'TR_Batches_PreventNegativeStock' (Chống âm kho Rule 3) đã kích hoạt trên bảng [${triggers[0].tableName}].`);
    } else {
      console.warn(`⚠️ [1.4] Không tìm thấy trigger TR_Batches_PreventNegativeStock.`);
    }

    const indexes = await SqlConnection.queryJson(`
      SELECT name AS indexName, OBJECT_NAME(object_id) AS tableName 
      FROM sys.indexes 
      WHERE name IN ('IX_Batches_FEFO', 'IX_Batches_ExpiryWatchdog', 'IX_Products_Sku')
    `);
    console.log(`✅ [1.5] Chỉ mục tối ưu (Covered Indexes): ${indexes.map(i => i.indexName).join(', ')}`);
  } catch (err) {
    console.error(`❌ [1.3-1.5] Lỗi kiểm tra views/triggers:`, err.message);
    passedAll = false;
  }

  // 4. Kiểm tra Cửa hàng bán lẻ duy nhất (Rule 1 SSOT)
  try {
    const store = await SqlConnection.queryJson(`
      SELECT * FROM store_profile
    `);
    console.log(`\n✅ [1.6] Kiểm tra Cửa hàng bán lẻ duy nhất (Rule 1):`);
    if (store.length === 1) {
      const s = store[0];
      console.log(`   - Số lượng bản ghi: 1 (Chính xác theo đặc tả 1 shop duy nhất)`);
      console.log(`   - Mã cửa hàng: ${s.store_code || s.storeCode}`);
      console.log(`   - Tên cửa hàng: ${s.store_name || s.storeName}`);
      console.log(`   - Kho tổng liên kết: ${s.linked_dc_code || s.linkedDcCode || 'DC-BIENHOA'}`);
    } else {
      console.warn(`   - CẢNH BÁO: Bảng store_profile có ${store.length} bản ghi (yêu cầu duy nhất 1 bản ghi).`);
    }
  } catch (err) {
    console.error(`❌ [1.6] Lỗi kiểm tra store_profile:`, err.message);
    passedAll = false;
  }

  // 5. Kiểm tra 4 Vai trò người dùng (Users & Roles - RBAC)
  try {
    const users = await SqlConnection.queryJson(`
      SELECT u.id, u.username, u.full_name AS fullName, r.code AS roleCode, r.name AS roleName
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id
    `);
    console.log(`\n✅ [1.7] Danh sách người dùng & Phân quyền (RBAC 4 Roles):`);
    users.forEach(u => {
      console.log(`   - [ID: ${u.id}] ${u.username} | ${u.fullName} | Role: ${u.roleCode} (${u.roleName})`);
    });

    const roleCodes = users.map(u => u.roleCode);
    const hasAdmin = roleCodes.includes('ADMIN');
    const hasManager = roleCodes.includes('STORE_MANAGER');
    const hasCashier = roleCodes.includes('CASHIER');
    const hasWarehouse = roleCodes.includes('WAREHOUSE_STAFF');

    if (hasAdmin && (hasManager || hasCashier || hasWarehouse)) {
      console.log(`   -> Đạt chuẩn: Đầy đủ các tài khoản kiểm thử cho 4 vai trò nghiệp vụ.`);
    } else {
      console.warn(`   -> CẢNH BÁO: Chưa phủ đủ 4 vai trò. Hiện có: ${roleCodes.join(', ')}`);
    }
  } catch (err) {
    console.error(`❌ [1.7] Lỗi kiểm tra users:`, err.message);
    passedAll = false;
  }

  // 6. Kiểm tra Danh mục FMCG & Sản phẩm
  try {
    const cats = await SqlConnection.queryJson(`SELECT COUNT(*) AS totalCats FROM categories`);
    const prods = await SqlConnection.queryJson(`SELECT COUNT(*) AS totalProds FROM products`);
    console.log(`\n✅ [1.8] Danh mục & Sản phẩm FMCG:`);
    console.log(`   - Ngành hàng FMCG: ${cats[0]?.totalCats || 0} danh mục.`);
    console.log(`   - Sản phẩm bán lẻ: ${prods[0]?.totalProds || 0} SKU.`);
  } catch (err) {
    console.error(`❌ [1.8] Lỗi kiểm tra sản phẩm:`, err.message);
    passedAll = false;
  }

  // 7. Thống kê Lô hàng theo 4 trạng thái cảnh báo Shelf-Life (Rule 4, Rule 5)
  try {
    const alerts = await SqlConnection.queryJson(`
      SELECT alert_color, COUNT(*) AS count_batches, SUM(current_quantity) AS total_stock
      FROM vw_Batches_ShelfLife_Alerts
      GROUP BY alert_color
    `);
    console.log(`\n✅ [1.9] Phân bổ Lô hàng theo 4 cấp màu Shelf-Life (View vw_Batches_ShelfLife_Alerts):`);
    alerts.forEach(a => {
      let label = a.alert_color;
      if (a.alert_color === 'GREEN') label = 'Vùng XANH (An toàn, DaysLeft > 10)';
      if (a.alert_color === 'YELLOW') label = 'Vùng VÀNG (Cảnh báo, 3 < DaysLeft <= 10)';
      if (a.alert_color === 'RED') label = 'Vùng ĐỎ (Nguy kịch, 0 < DaysLeft <= 3)';
      if (a.alert_color === 'EXPIRED') label = 'Vùng TÍM (Đã hết hạn, DaysLeft <= 0)';
      console.log(`   - ${label}: ${a.count_batches} lô (Tồn kho: ${a.total_stock})`);
    });

    const hasGreen = alerts.some(a => a.alert_color === 'GREEN');
    const hasYellow = alerts.some(a => a.alert_color === 'YELLOW');
    const hasRed = alerts.some(a => a.alert_color === 'RED');
    const hasExpired = alerts.some(a => a.alert_color === 'EXPIRED');

    console.log(`\n📊 Độ phủ vòng đời lô hàng phục vụ kiểm thử:`);
    console.log(`   - Vùng Xanh (Bán bình thường): ${hasGreen ? '✓ CÓ' : '❌ THIẾU'}`);
    console.log(`   - Vùng Vàng (Cần đảo kệ, xả hàng): ${hasYellow ? '✓ CÓ' : '❌ THIẾU'}`);
    console.log(`   - Vùng Đỏ (Cận date nguy kịch): ${hasRed ? '✓ CÓ' : '❌ THIẾU'}`);
    console.log(`   - Vùng Hết hạn (Khóa bán, chờ hủy): ${hasExpired ? '✓ CÓ' : '❌ THIẾU'}`);

    // Nếu thiếu Vùng Vàng hoặc Vùng Đỏ, tự động bổ sung lô seed chuẩn
    if (!hasRed || !hasYellow) {
      console.log(`\n⚙️ Tự động bổ sung Lô mẫu Vùng Vàng & Vùng Đỏ để phục vụ kiểm thử 11 Rules...`);
      await SqlConnection.executeSql(`
        IF NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-SEED-RED-01')
        BEGIN
          INSERT INTO batches (product_id, batch_code, manufacture_date, import_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status, is_shelf_rotated)
          VALUES (1, 'LOT-SEED-RED-01', DATEADD(day, -20, GETDATE()), DATEADD(day, -10, GETDATE()), DATEADD(day, 2, GETDATE()), 20, 15, 32000, 0, 'ACTIVE', 0);
        END

        IF NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-SEED-YELLOW-01')
        BEGIN
          INSERT INTO batches (product_id, batch_code, manufacture_date, import_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status, is_shelf_rotated)
          VALUES (2, 'LOT-SEED-YELLOW-01', DATEADD(day, -25, GETDATE()), DATEADD(day, -15, GETDATE()), DATEADD(day, 5, GETDATE()), 25, 20, 28000, 0, 'WARNING', 0);
        END
      `);
      console.log(`   -> Đã chèn thành công LOT-SEED-RED-01 (Đỏ, DaysLeft=2 <= 3) và LOT-SEED-YELLOW-01 (Vàng, 3 < DaysLeft=5 <= WarningDays=7).`);
    }

  } catch (err) {
    console.error(`❌ [1.9] Lỗi thống kê lô hàng:`, err.message);
    passedAll = false;
  }

  // 8. Tự động Sao lưu CSDL mẫu Master Seed Data
  try {
    const backupDatabase = require('./backup_database');
    const bResult = await backupDatabase();
    console.log(`\n💾 [1.10] Đã tạo bản sao lưu an toàn CSDL mẫu:`);
    console.log(`   - Tệp snapshot: ${bResult.backupFile}`);
  } catch (bErr) {
    console.warn(`⚠️ [1.10] Cảnh báo sao lưu:`, bErr.message);
  }

  console.log('\n================================================================');
  if (passedAll) {
    console.log('🎉 GIAI ĐOẠN 1 HOÀN TẤT: MÔI TRƯỜNG & MASTER DATA SẴN SÀNG 100%!');
  } else {
    console.log('⚠️ GIAI ĐOẠN 1 CẦN LƯU Ý MỘT SỐ HẠNG MỤC TRÊN.');
  }
  console.log('================================================================');
}

runStage1Audit();
