// Backend/seed_80_products_and_3_actors.js
const SqlConnection = require('./src/infrastructure/database/SqlConnection');

function stripVN(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

const newProducts = [
  // Cat 1: Sữa & Chế phẩm từ sữa (4 sản phẩm bổ sung -> 14 SP)
  { sku: '8934567890111', name: 'Sữa tươi thanh trùng Dalatmilk Không đường 950ml', catId: 1, supId: 1, unit: 'Hộp', cost: 34000, price: 43000, life: 12 },
  { sku: '8934567890112', name: 'Sữa chua ăn TH True Yogurt vị Dâu tự nhiên lốc 4 hộp', catId: 1, supId: 1, unit: 'Lốc', cost: 24000, price: 31000, life: 35 },
  { sku: '8934567890113', name: 'Bơ thực vật cao cấp Meizan hộp 200g', catId: 1, supId: 1, unit: 'Hộp', cost: 19000, price: 25000, life: 90 },
  { sku: '8934567890114', name: 'Váng sữa tươi Monte hương Vani lốc 4 hộp 55g', catId: 1, supId: 1, unit: 'Lốc', cost: 52000, price: 65000, life: 30 },

  // Cat 2: Bánh mì & Đồ ăn nhanh (5 sản phẩm bổ sung -> 13 SP)
  { sku: '8934567890209', name: 'Bánh sừng bò Croissant bơ Pháp nướng tươi 85g', catId: 2, supId: 1, unit: 'Cái', cost: 14000, price: 20000, life: 5 },
  { sku: '8934567890210', name: 'Bánh bông lan cuộn kem dâu Solite hộp 360g', catId: 2, supId: 1, unit: 'Hộp', cost: 35000, price: 45000, life: 120 },
  { sku: '8934567890211', name: 'Cơm cuộn Kimbap Hàn Quốc nhân bò nướng 220g', catId: 2, supId: 1, unit: 'Hộp', cost: 22000, price: 32000, life: 3 },
  { sku: '8934567890212', name: 'Bánh mì que Pate chà bông Hải Phòng hộp 2 cây', catId: 2, supId: 1, unit: 'Hộp', cost: 16000, price: 24000, life: 4 },
  { sku: '8934567890213', name: 'Bánh tráng trộn sa tế bò khô đóng hộp 150g', catId: 2, supId: 1, unit: 'Hộp', cost: 15000, price: 22000, life: 15 },

  // Cat 3: Nước giải khát (4 sản phẩm bổ sung -> 14 SP)
  { sku: '8934567890310', name: 'Nước ngọt Pepsi Không Calo vị Chanh lon 320ml', catId: 3, supId: 1, unit: 'Lon', cost: 8200, price: 11500, life: 180 },
  { sku: '8934567890311', name: 'Nước cam ép Vfresh 100% nguyên chất hộp 1L', catId: 3, supId: 1, unit: 'Hộp', cost: 36000, price: 46000, life: 120 },
  { sku: '8934567890312', name: 'Nước dừa tươi đóng hộp Cocoxim Xiêm Xanh 330ml', catId: 3, supId: 1, unit: 'Hộp', cost: 14000, price: 19000, life: 150 },
  { sku: '8934567890313', name: 'Trà sữa đóng chai Kirin Latte vị Matcha 345ml', catId: 3, supId: 1, unit: 'Chai', cost: 11000, price: 15000, life: 120 },

  // Cat 4: Thực phẩm khô đóng gói (5 sản phẩm bổ sung -> 11 SP)
  { sku: '8934567890407', name: 'Gạo thơm ST25 Ông Cua chính hãng túi 5kg', catId: 4, supId: 1, unit: 'Túi', cost: 145000, price: 175000, life: 180 },
  { sku: '8934567890408', name: 'Dầu ăn thực vật cao cấp Simply đậu nành chai 1L', catId: 4, supId: 1, unit: 'Chai', cost: 48000, price: 59000, life: 240 },
  { sku: '8934567890409', name: 'Nước mắm Nam Ngư Phú Quốc đạm cá cơm chai 750ml', catId: 4, supId: 1, unit: 'Chai', cost: 34000, price: 43000, life: 240 },
  { sku: '8934567890410', name: 'Hạt nêm Knorr thịt thăn xương ống & tủy gói 400g', catId: 4, supId: 1, unit: 'Gói', cost: 28000, price: 36000, life: 180 },
  { sku: '8934567890411', name: 'Phở bò Đệ Nhất Acecook gói 65g', catId: 4, supId: 1, unit: 'Gói', cost: 6800, price: 9500, life: 150 },

  // Cat 5: Thực phẩm chế biến sẵn (6 sản phẩm bổ sung -> 9 SP)
  { sku: '8934567890704', name: 'Há cảo tôm thịt Cầu Tre gói 300g', catId: 5, supId: 1, unit: 'Gói', cost: 32000, price: 42000, life: 30 },
  { sku: '8934567890705', name: 'Chả giò rế hải sản Cầu Tre gói 400g', catId: 5, supId: 1, unit: 'Gói', cost: 38000, price: 49000, life: 45 },
  { sku: '8934567890706', name: 'Kim chi cải thảo cắt lát Bibigo Ông Kim hộp 500g', catId: 5, supId: 1, unit: 'Hộp', cost: 35000, price: 45000, life: 25 },
  { sku: '8934567890707', name: 'Đậu hũ non trứng Ichiban cây 160g', catId: 5, supId: 1, unit: 'Cây', cost: 9500, price: 14000, life: 14 },
  { sku: '8934567890708', name: 'Thịt nguội Jambon vai xông khói Vissan gói 200g', catId: 5, supId: 1, unit: 'Gói', cost: 42000, price: 54000, life: 21 },
  { sku: '8934567890709', name: 'Cá viên tươi basa Tân Việt Sin gói 500g', catId: 5, supId: 1, unit: 'Gói', cost: 31000, price: 41000, life: 30 },

  // Cat 6: Thịt tươi & Thủy hải sản mát (5 sản phẩm bổ sung -> 9 SP)
  { sku: '8934567890505', name: 'Thịt nạc dăm heo MeatDeli khay 350g', catId: 6, supId: 1, unit: 'Khay', cost: 54000, price: 69000, life: 7 },
  { sku: '8934567890506', name: 'Thịt bò Úc ba chỉ thái lát nhúng lẩu khay 300g', catId: 6, supId: 1, unit: 'Khay', cost: 72000, price: 92000, life: 10 },
  { sku: '8934567890507', name: 'Tôm thẻ tươi bóc nõn CP hộp 250g', catId: 6, supId: 1, unit: 'Hộp', cost: 64000, price: 82000, life: 8 },
  { sku: '8934567890508', name: 'Cánh gà tươi giữa CP Fresh khay 500g', catId: 6, supId: 1, unit: 'Khay', cost: 48000, price: 62000, life: 6 },
  { sku: '8934567890509', name: 'Trứng vịt tươi sạch V.Food hộp 10 quả', catId: 6, supId: 1, unit: 'Hộp', cost: 28000, price: 36000, life: 14 },

  // Cat 7: Rau củ & Trái cây sạch (6 sản phẩm bổ sung -> 10 SP)
  { sku: '8934567890605', name: 'Bông cải xanh Baby Đà Lạt VietGAP 350g', catId: 7, supId: 1, unit: 'Khay', cost: 21000, price: 29000, life: 7 },
  { sku: '8934567890606', name: 'Nấm kim châm trắng Hàn Quốc gói 150g', catId: 7, supId: 1, unit: 'Gói', cost: 11000, price: 16000, life: 12 },
  { sku: '8934567890607', name: 'Cam sành Vĩnh Long mọng nước túi 1kg', catId: 7, supId: 1, unit: 'Túi', cost: 24000, price: 33000, life: 14 },
  { sku: '8934567890608', name: 'Dưa leo baby giống Nhật Đà Lạt khay 500g', catId: 7, supId: 1, unit: 'Khay', cost: 16000, price: 23000, life: 8 },
  { sku: '8934567890609', name: 'Khoai tây vàng Đà Lạt túi lưới 1kg', catId: 7, supId: 1, unit: 'Túi', cost: 26000, price: 35000, life: 25 },
  { sku: '8934567890610', name: 'Nho xanh không hạt Úc hộp 500g', catId: 7, supId: 1, unit: 'Hộp', cost: 75000, price: 98000, life: 14 }
];

async function run() {
  console.log('1. Chuẩn hóa triệt để 3 Actor - 3 Vai trò trong bảng roles & users...');
  await SqlConnection.executeSql(`
    BEGIN TRANSACTION;

    UPDATE store_profile SET manager_id = 2 WHERE manager_id IN (2, 4, 13);
    UPDATE stock_transfers SET requested_by = 2 WHERE requested_by IN (2, 4, 13);
    UPDATE stock_transfers SET requested_by = 3 WHERE requested_by IN (3, 5, 6, 9, 12);
    UPDATE stock_transfers SET approved_by = 2 WHERE approved_by IN (2, 4, 13);
    UPDATE sales_history SET cashier_id = 3 WHERE cashier_id IN (3, 5, 6, 9, 12);
    UPDATE spoilage_records SET performed_by = 2 WHERE performed_by IN (2, 4, 13);
    UPDATE spoilage_records SET performed_by = 3 WHERE performed_by IN (3, 5, 6, 9, 12);
    UPDATE spoilage_records SET approved_by = 2 WHERE approved_by IN (2, 4, 13);
    UPDATE goods_receipts SET received_by = 2 WHERE received_by IN (2, 4, 13);
    UPDATE goods_receipts SET received_by = 3 WHERE received_by IN (3, 5, 6, 9, 12);
    UPDATE purchase_orders SET created_by = 2 WHERE created_by IN (2, 4, 13);
    UPDATE purchase_orders SET created_by = 3 WHERE created_by IN (3, 5, 6, 9, 12);
    UPDATE purchase_orders SET approved_by = 2 WHERE approved_by IN (2, 4, 13);

    DELETE FROM system_audit_logs WHERE user_id >= 14;
    UPDATE system_audit_logs SET user_id = 2 WHERE user_id IN (2, 4, 13);
    UPDATE system_audit_logs SET user_id = 3 WHERE user_id IN (3, 5, 6, 9, 12);

    DELETE FROM users WHERE id > 3;

    DECLARE @PassHash NVARCHAR(255) = N'$2b$10$utBHyz0fZU7KTV1BSIEF5exBMNUbmlDzOIc9OUDfbSQtQtKxs96qS';

    UPDATE users SET 
      username = 'admin',
      password_hash = @PassHash,
      full_name = N'Quản trị viên (Admin)',
      email = 'admin@lhumart.edu.vn',
      phone = '0901112233',
      role_id = 1,
      store_id = NULL,
      is_active = 1,
      updated_at = GETDATE()
    WHERE id = 1;

    UPDATE users SET 
      username = 'manager',
      password_hash = @PassHash,
      full_name = N'Đỗ Tấn Du (Cửa Hàng Trưởng)',
      email = 'manager@lhumart.edu.vn',
      phone = '0902223344',
      role_id = 2,
      store_id = 1,
      is_active = 1,
      updated_at = GETDATE()
    WHERE id = 2;

    UPDATE users SET 
      username = 'cashier',
      password_hash = @PassHash,
      full_name = N'Đoàn Minh Quân (Nhân Viên Cửa Hàng)',
      email = 'cashier@lhumart.edu.vn',
      phone = '0903334455',
      role_id = 3,
      store_id = 1,
      is_active = 1,
      updated_at = GETDATE()
    WHERE id = 3;

    DELETE FROM roles WHERE id > 3 OR code = 'WAREHOUSE_STAFF';

    UPDATE roles SET code = 'ADMIN', name = N'Chủ chuỗi / Quản trị viên', description = N'Toàn quyền quản trị chuỗi chi nhánh, danh mục FMCG, tài khoản và cấu hình hệ thống' WHERE id = 1;
    UPDATE roles SET code = 'STORE_MANAGER', name = N'Quản lý Cửa hàng', description = N'Điều hành cửa hàng, giảm giá Quick Markdown 15-50%, phê duyệt tiêu hủy và đặt hàng DC' WHERE id = 2;
    UPDATE roles SET code = 'CASHIER', name = N'Nhân viên Cửa hàng (POS & Kho kệ)', description = N'Bán lẻ tại quầy POS theo chuẩn FEFO, tiếp nhận hàng DC, đảo kệ mặt tiền và kiểm date' WHERE id = 3;

    COMMIT TRANSACTION;
  `);

  console.log('2. Xóa các sản phẩm rác sinh ra từ test...');
  await SqlConnection.executeSql(`
    DELETE FROM stock_transfers WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'TEST_%' OR sku LIKE 'SKU999%');
    DELETE FROM purchase_order_items WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'TEST_%' OR sku LIKE 'SKU999%');
    DELETE FROM sales_history WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'TEST_%' OR sku LIKE 'SKU999%');
    DELETE FROM spoilage_records WHERE batch_id IN (SELECT id FROM batches WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'TEST_%' OR sku LIKE 'SKU999%'));
    DELETE FROM batches WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'TEST_%' OR sku LIKE 'SKU999%');
    DELETE FROM products WHERE sku LIKE 'TEST_%' OR sku LIKE 'SKU999%';
  `);

  console.log('3. Thêm 35 sản phẩm FMCG mới để nâng tổng số lên 80 sản phẩm...');
  for (const item of newProducts) {
    const norm = stripVN(item.name);
    await SqlConnection.executeSql(`
      IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '${item.sku}')
      BEGIN
        INSERT INTO products (sku, name, normalized_name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days, is_active)
        VALUES (
          '${item.sku}',
          ${SqlConnection.escapeSql(item.name)},
          ${SqlConnection.escapeSql(norm)},
          ${item.catId},
          ${item.supId},
          ${SqlConnection.escapeSql(item.unit)},
          ${item.cost},
          ${item.price},
          ${item.life},
          25,
          150,
          7,
          1
        );
      END
    `);
  }

  console.log('4. Kiểm tra và bơm các lô hàng còn hạn (ACTIVE) cho toàn bộ 80 sản phẩm...');
  const allProducts = await SqlConnection.queryJson(`
    SELECT p.id, p.sku, p.name, p.cost_price, p.standard_shelf_life_days,
      (SELECT ISNULL(SUM(b.current_quantity), 0) FROM batches b WHERE b.product_id = p.id AND b.expiry_date > CAST(GETDATE() AS DATE) AND b.status != 'EXPIRED') as activeStock
    FROM products p
    WHERE p.is_active = 1
    ORDER BY p.id ASC
  `);

  let seededBatchesCount = 0;
  for (let i = 0; i < allProducts.length; i++) {
    const p = allProducts[i];
    if (p.activeStock < 20) {
      const lifeDays = Math.max(7, Number(p.standard_shelf_life_days) || 14);
      // Tạo 1 lô Vùng Xanh dồi dào (DaysLeft từ 10 đến 45 ngày)
      const safeDaysLeft = Math.max(9, Math.min(lifeDays, 12 + (i % 25)));
      const qtySafe = 60 + ((i * 7) % 50);
      const batchCodeSafe = `LOT-DC-${p.sku.slice(-5)}-S${p.id}`;

      await SqlConnection.executeSql(`
        IF NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = '${batchCodeSafe}')
        BEGIN
          INSERT INTO batches (batch_code, product_id, store_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status, is_shelf_rotated)
          VALUES (
            '${batchCodeSafe}',
            ${p.id},
            1,
            DATEADD(day, -2, CAST(GETDATE() AS DATE)),
            DATEADD(day, -3, CAST(GETDATE() AS DATE)),
            DATEADD(day, ${safeDaysLeft}, CAST(GETDATE() AS DATE)),
            ${qtySafe},
            ${qtySafe},
            ${Number(p.cost_price) || 20000},
            0,
            'ACTIVE',
            1
          );
        END
        ELSE
        BEGIN
          UPDATE batches
          SET current_quantity = ${qtySafe},
              expiry_date = DATEADD(day, ${safeDaysLeft}, CAST(GETDATE() AS DATE)),
              status = 'ACTIVE'
          WHERE batch_code = '${batchCodeSafe}';
        END
      `);
      seededBatchesCount++;

      // Với một số sản phẩm tươi sống (mỗi 5 sản phẩm), tạo thêm 1 lô Vùng Vàng (5 ngày) giảm giá 20% để FEFO ưu tiên xuất trước
      if (i % 5 === 0) {
        const batchCodeWarn = `LOT-DC-${p.sku.slice(-5)}-W${p.id}`;
        await SqlConnection.executeSql(`
          IF NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = '${batchCodeWarn}')
          BEGIN
            INSERT INTO batches (batch_code, product_id, store_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status, is_shelf_rotated)
            VALUES (
              '${batchCodeWarn}',
              ${p.id},
              1,
              DATEADD(day, -5, CAST(GETDATE() AS DATE)),
              DATEADD(day, -6, CAST(GETDATE() AS DATE)),
              DATEADD(day, 5, CAST(GETDATE() AS DATE)),
              30,
              24,
              ${Number(p.cost_price) || 20000},
              20,
              'WARNING',
              1
            );
          END
        `);
        seededBatchesCount++;
      }
    }
  }

  const finalCheck = await SqlConnection.queryJson(`
    SELECT 
      (SELECT COUNT(*) FROM products WHERE is_active = 1) as totalProducts,
      (SELECT COUNT(DISTINCT b.product_id) FROM batches b INNER JOIN products p ON p.id = b.product_id WHERE p.is_active = 1 AND b.current_quantity > 0 AND b.expiry_date > CAST(GETDATE() AS DATE) AND b.status != 'EXPIRED') as sellableProducts
  `);

  console.log('================================================================');
  console.log(' HOÀN TẤT BƠM DỮ LIỆU 80 SẢN PHẨM & LÔ HÀNG TỒN KHO:');
  console.log(' - Tổng số sản phẩm đang kinh doanh:', finalCheck[0].totalProducts);
  console.log(' - Số sản phẩm sẵn sàng xuất bán tại POS:', finalCheck[0].sellableProducts);
  console.log(' - Số lô hàng mới được bổ sung:', seededBatchesCount);
  console.log('================================================================');
}

run().catch(console.error);
