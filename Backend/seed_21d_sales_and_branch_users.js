// seed_21d_sales_and_branch_users.js
// Script idempotent bổ sung:
// 1. Tài khoản mẫu cho Chi nhánh 2 & Chi nhánh 3 (mật khẩu mặc định: 123456)
// 2. Lịch sử bán hàng 21 ngày gần nhất cho 3 chi nhánh x tối đa 30 sản phẩm chủ lực (không trừ tồn kho hiện tại)

const bcrypt = require('bcryptjs');
const SqlConnection = require('./src/infrastructure/database/sqlConnection');
const { formatLocalDateYMD, toVnDayStartMs } = require('./src/domain/utils/dateUtils');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEATHERS = ['NORMAL', 'SUNNY', 'RAINY'];

const BRANCH_USERS = [
  {
    username: 'manager2',
    fullName: 'Quản lý Chi nhánh Tân Phong',
    email: 'manager2@lhumart.edu.vn',
    phone: '0902223344',
    roleCode: 'STORE_MANAGER',
    storeId: 2
  },
  {
    username: 'staff2',
    fullName: 'Nhân viên Chi nhánh Tân Phong',
    email: 'staff2@lhumart.edu.vn',
    phone: '0902223345',
    roleCode: 'CASHIER',
    storeId: 2
  },
  {
    username: 'manager3',
    fullName: 'Quản lý Chi nhánh Trảng Dài',
    email: 'manager3@lhumart.edu.vn',
    phone: '0903334455',
    roleCode: 'STORE_MANAGER',
    storeId: 3
  },
  {
    username: 'staff3',
    fullName: 'Nhân viên Chi nhánh Trảng Dài',
    email: 'staff3@lhumart.edu.vn',
    phone: '0903334456',
    roleCode: 'CASHIER',
    storeId: 3
  }
];

function deterministicRand(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

async function seedBranchUsers() {
  const roles = await SqlConnection.queryJson(`SELECT id, code FROM dbo.roles`);
  const roleMap = new Map(roles.map(r => [String(r.code).toUpperCase(), Number(r.id)]));
  const passwordHash = bcrypt.hashSync('123456', 10);

  let created = 0;
  for (const u of BRANCH_USERS) {
    const roleId = roleMap.get(u.roleCode);
    if (!roleId) {
      throw new Error(`Không tìm thấy role ${u.roleCode} trong dbo.roles`);
    }
    const existing = await SqlConnection.queryJson(
      `SELECT TOP 1 id FROM dbo.users WHERE username = ${SqlConnection.escapeSql(u.username)}`
    );
    if (existing.length === 0) {
      await SqlConnection.executeSql(`
        INSERT INTO dbo.users (username, password_hash, full_name, email, phone, is_active, created_at, updated_at, role_id, store_id)
        VALUES (
          ${SqlConnection.escapeSql(u.username)},
          ${SqlConnection.escapeSql(passwordHash)},
          ${SqlConnection.escapeSql(u.fullName)},
          ${SqlConnection.escapeSql(u.email)},
          ${SqlConnection.escapeSql(u.phone)},
          1,
          GETDATE(),
          GETDATE(),
          ${roleId},
          ${Number(u.storeId)}
        );
      `);
      created++;
    } else {
      await SqlConnection.executeSql(`
        UPDATE dbo.users
        SET is_active = 1, store_id = ${Number(u.storeId)}, role_id = ${roleId}, updated_at = GETDATE()
        WHERE username = ${SqlConnection.escapeSql(u.username)};
      `);
    }
  }
  console.log(`[SEED USERS] Đã đồng bộ ${BRANCH_USERS.length} tài khoản CN2 & CN3 (tạo mới: ${created}).`);
}

async function seedBranchBatches() {
  const [stores, products, suppliers, users] = await Promise.all([
    SqlConnection.queryJson(`SELECT id, store_code AS storeCode FROM dbo.store_profile WHERE id IN (2, 3) AND ISNULL(status, 'OPEN') <> 'SUSPENDED' ORDER BY id ASC`),
    SqlConnection.queryJson(`
      SELECT TOP 20 p.id, p.sku, p.name,
             ISNULL(NULLIF(p.cost_price, 0), ROUND(p.selling_price * 0.75, 0)) AS costPrice,
             p.selling_price AS sellingPrice,
             ISNULL(p.standard_shelf_life_days, 30) AS shelfLife
      FROM dbo.products p
      WHERE p.is_active = 1
      ORDER BY CASE WHEN ISNULL(p.standard_shelf_life_days, 30) >= 14 THEN 0 ELSE 1 END, p.id ASC
    `),
    SqlConnection.queryJson(`SELECT TOP 1 id FROM dbo.suppliers ORDER BY id ASC`),
    SqlConnection.queryJson(`SELECT id, username, ISNULL(store_id, 1) AS storeId FROM dbo.users WHERE is_active = 1 ORDER BY id ASC`)
  ]);

  if (!stores.length || !products.length || !suppliers.length) {
    console.log('[SEED BATCHES] Bỏ qua do thiếu store 2/3, products hoặc suppliers.');
    return;
  }

  const supplierId = Number(suppliers[0].id);
  const todayStartMs = toVnDayStartMs(new Date());
  const todayYmd = formatLocalDateYMD(new Date(todayStartMs));

  // Dọn dữ liệu seed cũ theo đúng thứ tự FK (sales_history SEED21 -> batches không ràng buộc khác -> goods_receipts)
  await SqlConnection.executeSql(`
    DELETE FROM dbo.sales_history WHERE transaction_code LIKE 'SEED21-%';
    DELETE FROM dbo.batches
    WHERE batch_code LIKE 'LOT-SEED-S[23]-%'
      AND id NOT IN (SELECT DISTINCT batch_id FROM dbo.spoilage_records)
      AND id NOT IN (SELECT DISTINCT source_batch_id FROM dbo.stock_transfers)
      AND id NOT IN (SELECT DISTINCT batch_id FROM dbo.sales_history);
    DELETE FROM dbo.goods_receipts
    WHERE receipt_number IN ('GR-SEED-CN2', 'GR-SEED-CN3')
      AND id NOT IN (SELECT DISTINCT ISNULL(receipt_id, 0) FROM dbo.batches);
  `);

  // Sắp xếp lại: đặt 12 sản phẩm hạn dài lên đầu (Vùng Xanh), 8 sản phẩm còn lại (gồm hàng date ngắn) vào cuối (Vùng Vàng/Đỏ)
  const orderedProducts = [...products].sort((a, b) => Number(b.shelfLife) - Number(a.shelfLife));
  let totalBatchesCreated = 0;

  for (const st of stores) {
    const sid = Number(st.id);
    const receiverUser = users.find(u => Number(u.storeId) === sid) || users[0];
    const receivedById = Number(receiverUser.id);
    const receiptNumber = `GR-SEED-CN${sid}`;

    const existingReceipt = await SqlConnection.queryJson(
      `SELECT TOP 1 id FROM dbo.goods_receipts WHERE receipt_number = ${SqlConnection.escapeSql(receiptNumber)}`
    );

    const batchItems = [];
    let totalCost = 0;

    for (let idx = 0; idx < orderedProducts.length; idx++) {
      const prod = orderedProducts[idx];
      const batchCode = `LOT-SEED-S${sid}-P${prod.id}`;
      const existingBatch = await SqlConnection.queryJson(
        `SELECT TOP 1 id FROM dbo.batches WHERE batch_code = ${SqlConnection.escapeSql(batchCode)}`
      );
      if (existingBatch.length > 0) continue;

      const shelfLife = Math.max(5, Number(prod.shelfLife || 30));
      let daysLeft;
      let status;
      let discountPercent = 0;

      if (idx < 12) {
        // 12 lô Vùng Xanh
        daysLeft = Math.min(shelfLife - 2, 16 + ((idx * 3 + sid * 2) % 24));
        daysLeft = Math.max(9, daysLeft);
        status = 'ACTIVE';
      } else if (idx < 17) {
        // 5 lô Vùng Vàng (4..7 ngày)
        daysLeft = idx % 2 === 0 ? 5 : 6;
        status = 'WARNING';
        discountPercent = idx === 16 ? 15 : 0;
      } else {
        // 3 lô Vùng Đỏ (2..3 ngày)
        daysLeft = idx === 17 ? 2 : 3;
        status = 'WARNING';
        discountPercent = idx === 17 ? 30 : 15;
      }

      const qty = idx < 4
        ? 8 + (idx % 3) * 2
        : idx < 12
          ? 16 + ((idx + sid) % 5) * 4
          : idx < 17
            ? 12 + ((idx + sid) % 4) * 3
            : 8 + ((idx + sid) % 3) * 3;

      const importPrice = Math.max(1000, Math.round(Number(prod.costPrice || 15000)));
      const expMs = todayStartMs + daysLeft * 86400000;
      const effectiveShelf = Math.max(shelfLife, daysLeft + 3);
      const mfgMs = expMs - effectiveShelf * 86400000;
      const impMs = Math.min(todayStartMs, mfgMs + Math.max(1, Math.floor(effectiveShelf * 0.15)) * 86400000);

      totalCost += qty * importPrice;
      batchItems.push({
        storeId: sid,
        productId: Number(prod.id),
        batchCode,
        importDate: formatLocalDateYMD(new Date(impMs)),
        manufactureDate: formatLocalDateYMD(new Date(mfgMs)),
        expiryDate: formatLocalDateYMD(new Date(expMs)),
        qty,
        importPrice,
        discountPercent,
        status
      });
    }

    if (batchItems.length === 0) continue;

    let receiptId;
    if (existingReceipt.length > 0) {
      receiptId = Number(existingReceipt[0].id);
    } else {
      await SqlConnection.executeSql(`
        INSERT INTO dbo.goods_receipts (
          receipt_number, supplier_id, received_by, receipt_date, total_cost, status, notes, created_at, store_id
        )
        VALUES (
          ${SqlConnection.escapeSql(receiptNumber)},
          ${supplierId},
          ${receivedById},
          ${SqlConnection.escapeSql(todayYmd)},
          ${totalCost},
          'COMPLETED',
          ${SqlConnection.escapeSql(`Phiếu nhập kho khởi tạo dữ liệu mẫu Chi nhánh #${sid} (RSL >= 75%)`)},
          GETDATE(),
          ${sid}
        );
      `);
      const recRes = await SqlConnection.queryJson(
        `SELECT TOP 1 id FROM dbo.goods_receipts WHERE receipt_number = ${SqlConnection.escapeSql(receiptNumber)} ORDER BY id DESC;`
      );
      receiptId = Number(recRes[0].id);
    }

    const rowSqls = batchItems.map(item => `(
      ${SqlConnection.escapeSql(item.batchCode)},
      ${item.productId},
      ${SqlConnection.escapeSql(item.importDate)},
      ${SqlConnection.escapeSql(item.manufactureDate)},
      ${SqlConnection.escapeSql(item.expiryDate)},
      ${item.qty},
      ${item.qty},
      ${item.importPrice},
      ${item.discountPercent},
      ${SqlConnection.escapeSql(item.status)},
      0,
      ${receiptId},
      GETDATE(),
      ${item.storeId}
    )`);

    await SqlConnection.executeSql(`
      INSERT INTO dbo.batches (
        batch_code, product_id, import_date, manufacture_date, expiry_date,
        initial_quantity, current_quantity, import_price, discount_percent,
        status, is_shelf_rotated, receipt_id, created_at, store_id
      ) VALUES ${rowSqls.join(',\n')};
    `);
    totalBatchesCreated += batchItems.length;
  }

  console.log(`[SEED BATCHES] Đã khởi tạo ${totalBatchesCreated} lô tồn kho (Xanh/Vàng/Đỏ) cho CN #2 & CN #3.`);
}

async function seed21DaySales() {
  const [stores, products, batches, users] = await Promise.all([
    SqlConnection.queryJson(`SELECT id, store_code AS storeCode FROM dbo.store_profile WHERE ISNULL(status, 'OPEN') <> 'SUSPENDED' ORDER BY id ASC`),
    SqlConnection.queryJson(`
      SELECT TOP 30 p.id, p.sku, p.name, p.selling_price AS sellingPrice, ISNULL(p.standard_shelf_life_days, 14) AS shelfLife
      FROM dbo.products p
      WHERE p.is_active = 1
        AND EXISTS (SELECT 1 FROM dbo.batches b WHERE b.product_id = p.id)
      ORDER BY p.id ASC
    `),
    SqlConnection.queryJson(`
      SELECT id, product_id AS productId, ISNULL(store_id, 1) AS storeId
      FROM dbo.batches
      ORDER BY current_quantity DESC, id ASC
    `),
    SqlConnection.queryJson(`SELECT id, ISNULL(store_id, 1) AS storeId FROM dbo.users WHERE is_active = 1 ORDER BY id ASC`)
  ]);

  if (!stores.length || !products.length || !batches.length) {
    throw new Error('Thiếu dữ liệu store_profile, products hoặc batches để seed sales_history.');
  }

  // Ánh xạ batch_id ưu tiên đúng storeId, fallback batch đầu tiên của sản phẩm
  const batchByStoreProd = new Map();
  const batchFallbackByProd = new Map();
  for (const b of batches) {
    const spKey = `${b.storeId}_${b.productId}`;
    if (!batchByStoreProd.has(spKey)) batchByStoreProd.set(spKey, Number(b.id));
    if (!batchFallbackByProd.has(b.productId)) batchFallbackByProd.set(b.productId, Number(b.id));
  }

  const cashierByStore = new Map();
  for (const u of users) {
    if (!cashierByStore.has(u.storeId)) cashierByStore.set(u.storeId, Number(u.id));
  }
  const fallbackCashierId = Number(users[0]?.id || 1);

  // Dọn dữ liệu seed cũ (idempotent 100%, giữ nguyên giao dịch POS thật)
  await SqlConnection.executeSql(`DELETE FROM dbo.sales_history WHERE transaction_code LIKE 'SEED21-%';`);

  const todayStartMs = toVnDayStartMs(new Date());
  const valuesList = [];

  for (const st of stores) {
    const sid = Number(st.id);
    const cashierId = cashierByStore.get(sid) || fallbackCashierId;

    // Tạo độ lệch cung-cầu giữa 3 chi nhánh (CN 1 dư hàng bán vừa, CN 2 nhu cầu cao, CN 3 ổn định)
    const storeScale = sid === 1 ? 0.72 : sid === 2 ? 1.42 : 0.95;

    for (let pIdx = 0; pIdx < products.length; pIdx++) {
      const prod = products[pIdx];
      const batchId = batchByStoreProd.get(`${sid}_${prod.id}`) || batchFallbackByProd.get(prod.id);
      if (!batchId) continue;

      const baseDaily = Number(prod.shelfLife) <= 7 ? 10 : Number(prod.shelfLife) <= 45 ? 12 : 8;
      const salePrice = Math.max(1000, Number(prod.sellingPrice || 20000));

      for (let dAgo = 21; dAgo >= 1; dAgo--) {
        const dayDate = new Date(todayStartMs - dAgo * 86400000);
        const ymd = formatLocalDateYMD(dayDate);
        const dowIdx = dayDate.getUTCDay();
        const dayOfWeek = DAY_NAMES[dowIdx];
        const isWeekend = dowIdx === 0 || dowIdx === 6;
        const isHoliday = isWeekend ? 1 : 0;

        const r1 = deterministicRand(sid * 1000 + prod.id * 37 + dAgo * 13);
        const r2 = deterministicRand(sid * 500 + prod.id * 19 + dAgo * 29);
        const weather = WEATHERS[r1 < 0.58 ? 0 : r1 < 0.84 ? 1 : 2];
        const wFactor = weather === 'SUNNY' ? 1.15 : weather === 'RAINY' ? 0.84 : 1.0;
        const hFactor = isWeekend ? 1.25 : 1.0;
        const prodBias = prod.id % 3 === sid % 3 ? 1.15 : 0.92;

        const qty = Math.max(
          2,
          Math.round(baseDaily * storeScale * prodBias * wFactor * hFactor * (0.85 + r2 * 0.35))
        );
        const totalAmount = Math.round(qty * salePrice);
        const ymdCompact = ymd.replace(/-/g, '');
        const txnCode = `SEED21-S${sid}-P${prod.id}-${ymdCompact}`;

        valuesList.push(
          `(${SqlConnection.escapeSql(txnCode)}, ${prod.id}, ${batchId}, ${qty}, ${salePrice}, ${totalAmount}, ${SqlConnection.escapeSql(ymd)}, ${SqlConnection.escapeSql(dayOfWeek)}, ${SqlConnection.escapeSql(weather)}, ${isHoliday}, ${SqlConnection.escapeSql(ymd + 'T10:30:00')}, ${cashierId}, ${sid})`
        );
      }
    }
  }

  const CHUNK_SIZE = 50;
  for (let i = 0; i < valuesList.length; i += CHUNK_SIZE) {
    const chunk = valuesList.slice(i, i + CHUNK_SIZE);
    await SqlConnection.executeSql(`
      INSERT INTO dbo.sales_history (
        transaction_code, product_id, batch_id, quantity_sold, sale_price, total_amount,
        sale_date, day_of_week, weather, is_holiday, created_at, cashier_id, store_id
      ) VALUES ${chunk.join(',\n')};
    `);
  }

  console.log(`[SEED SALES] Đã chèn ${valuesList.length} giao dịch bán hàng trong 21 ngày gần nhất (${stores.length} chi nhánh x ${products.length} sản phẩm).`);
}

async function main() {
  try {
    await seedBranchUsers();
    await seedBranchBatches();
    await seed21DaySales();
    console.log('[SEED COMPLETE] Hoàn tất dữ liệu demo Mục 2.');
    process.exit(0);
  } catch (err) {
    console.error('[SEED ERROR]', err);
    process.exit(1);
  }
}

main();
