// restore_database.js
// Script khôi phục CSDL retail_spoilage_db từ snapshot .bak trên SQL Server LocalDB

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

async function restoreDatabase() {
  const backupDir = path.resolve(__dirname, '..', 'Database', 'backups');
  const backupFile = path.join(backupDir, 'retail_spoilage_db_master_seed.bak');

  if (!fs.existsSync(backupFile)) {
    throw new Error(`Tệp sao lưu không tồn tại: ${backupFile}`);
  }

  console.log(`[RESTORE] Bắt đầu khôi phục CSDL từ: ${backupFile}`);
  const safePath = backupFile.replace(/'/g, "''");

  // Đóng các kết nối đang active vào database retail_spoilage_db và restore
  const sql = `
    USE master;
    ALTER DATABASE retail_spoilage_db SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    RESTORE DATABASE retail_spoilage_db FROM DISK = N'${safePath}' WITH REPLACE;
    ALTER DATABASE retail_spoilage_db SET MULTI_USER;
    USE retail_spoilage_db;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.store_profile') AND name = 'shelf_capacity_skus')
    BEGIN
      ALTER TABLE store_profile ADD shelf_capacity_skus INT DEFAULT 1500;
      ALTER TABLE store_profile ADD shelf_capacity_units INT DEFAULT 5000;
    END
    UPDATE store_profile SET shelf_capacity_skus = 1500, shelf_capacity_units = 5000 WHERE shelf_capacity_skus IS NULL;
    EXEC('
      CREATE OR ALTER VIEW [dbo].[vw_Batches_ShelfLife_Alerts]
      AS
      SELECT 
          b.[id] AS batch_id,
          b.[batch_code],
          b.[store_id],
          sp.[store_code],
          sp.[store_name],
          b.[product_id],
          p.[sku] AS product_sku,
          p.[name] AS product_name,
          c.[name] AS category_name,
          c.[code] AS category_code,
          b.[import_date],
          b.[manufacture_date],
          b.[expiry_date],
          b.[initial_quantity],
          b.[current_quantity],
          b.[import_price],
          p.[selling_price],
          b.[discount_percent],
          ROUND(p.[selling_price] * (1.0 - (CAST(b.[discount_percent] AS DECIMAL(5,2)) / 100.0)), 0) AS discounted_price,
          b.[is_shelf_rotated],
          b.[status],
          DATEDIFF(day, CAST(GETDATE() AS DATE), b.[expiry_date]) AS days_left,
          DATEDIFF(day, b.[manufacture_date], b.[expiry_date]) AS total_shelf_life_days,
          CASE 
              WHEN DATEDIFF(day, b.[manufacture_date], b.[expiry_date]) > 0 THEN
                  ROUND(
                      (CAST(DATEDIFF(day, CAST(GETDATE() AS DATE), b.[expiry_date]) AS FLOAT) / 
                       CAST(DATEDIFF(day, b.[manufacture_date], b.[expiry_date]) AS FLOAT)) * 100.0, 2
                  )
              ELSE 0.00
          END AS rsl_percent,
          COALESCE(p.[custom_warning_days], c.[default_warning_days], 7) AS warning_threshold_days,
          CASE 
              WHEN b.[status] = ''DISPOSED'' OR b.[current_quantity] = 0 THEN ''DISPOSED''
              WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.[expiry_date]) <= 0 THEN ''EXPIRED''
              WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.[expiry_date]) <= 3 THEN ''RED''
              WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.[expiry_date]) <= COALESCE(p.[custom_warning_days], c.[default_warning_days], 7) THEN ''YELLOW''
              ELSE ''GREEN''
          END AS alert_color,
          ROUND(b.[current_quantity] * b.[import_price], 2) AS total_inventory_cost,
          CASE 
              WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.[expiry_date]) <= COALESCE(p.[custom_warning_days], c.[default_warning_days], 7)
              THEN ROUND(b.[current_quantity] * b.[import_price], 2)
              ELSE 0.00
          END AS at_risk_cost
      FROM [dbo].[batches] b
      INNER JOIN [dbo].[products] p ON b.[product_id] = p.[id]
      INNER JOIN [dbo].[categories] c ON p.[category_id] = c.[id]
      LEFT JOIN [dbo].[store_profile] sp ON b.[store_id] = sp.[id];
    ');
  `;

  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      try { fs.mkdirSync(tempDir, { recursive: true }); } catch (e) {}
    }
    const tempFile = path.join(tempDir, `restore_${Date.now()}.sql`);
    fs.writeFileSync(tempFile, sql, 'utf8');

    const cmd = `sqlcmd -f 65001 -y 0 -S "(localdb)\\mssqllocaldb" -d master -i "${tempFile}"`;
    exec(cmd, { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 }, (error, stdout, stderr) => {
      try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (e) {}
      if (error) {
        console.error(`[RESTORE] Lỗi khôi phục CSDL:`, error.message);
        return reject(error);
      }
      console.log(`[RESTORE] Khôi phục CSDL mẫu thành công 100%! Dữ liệu đã trở về nguyên trạng.`);
      resolve({ success: true, output: stdout });
    });
  });
}

if (require.main === module) {
  restoreDatabase();
}

module.exports = restoreDatabase;
