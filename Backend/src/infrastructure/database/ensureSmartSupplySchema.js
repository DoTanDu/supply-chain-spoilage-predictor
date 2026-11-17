// src/infrastructure/database/ensureSmartSupplySchema.js
const SqlConnection = require('./sqlConnection');

let schemaReadyPromise = null;

/**
 * Đảm bảo các bảng & cột mở rộng theo Đặc tả SmartSupply AI (9 trang & 3 Actor) tồn tại an toàn.
 */
async function ensureSmartSupplySchema() {
  if (schemaReadyPromise) return schemaReadyPromise;

  schemaReadyPromise = (async () => {
    const migrationSql = `
      IF COL_LENGTH('dbo.products', 'pack_size') IS NULL
      BEGIN
        ALTER TABLE dbo.products ADD pack_size INT NOT NULL CONSTRAINT DF_products_pack_size DEFAULT 1;
      END;

      IF OBJECT_ID('dbo.enterprise_config', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.enterprise_config (
          id INT PRIMARY KEY,
          enterprise_name NVARCHAR(200) NOT NULL,
          has_central_warehouse BIT NOT NULL DEFAULT 1,
          central_warehouse_name NVARCHAR(200) NOT NULL DEFAULT N'Kho trung tâm',
          manager_po_approval_limit DECIMAL(18, 2) NOT NULL DEFAULT 5000000,
          updated_at DATETIME NOT NULL DEFAULT GETDATE()
        );
      END;

      IF NOT EXISTS (SELECT 1 FROM dbo.enterprise_config WHERE id = 1)
      BEGIN
        INSERT INTO dbo.enterprise_config (
          id, enterprise_name, has_central_warehouse, central_warehouse_name, manager_po_approval_limit, updated_at
        ) VALUES (
          1, N'SmartSupply AI Retail Chain', 1, N'Kho trung tâm (DC)', 5000000, GETDATE()
        );
      END;

      IF OBJECT_ID('dbo.inventory_adjustments', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.inventory_adjustments (
          id INT IDENTITY(1, 1) PRIMARY KEY,
          adjustment_code NVARCHAR(60) NOT NULL,
          store_id INT NOT NULL,
          batch_id INT NOT NULL,
          product_id INT NOT NULL,
          adjustment_type NVARCHAR(30) NOT NULL,
          system_quantity INT NOT NULL,
          actual_quantity INT NOT NULL,
          quantity_delta INT NOT NULL,
          reason NVARCHAR(300) NULL,
          performed_by INT NULL,
          created_at DATETIME NOT NULL DEFAULT GETDATE()
        );
      END;

      UPDATE dbo.roles
      SET name = N'Chủ chuỗi (OWNER)',
          description = N'Quản trị toàn chuỗi cửa hàng, tài khoản, phân quyền 9 trang & phê duyệt tổng thể'
      WHERE code = 'ADMIN';

      UPDATE dbo.roles
      SET name = N'Quản lý cửa hàng (MANAGER)',
          description = N'Quản lý vận hành kho, đặt hàng, điều phối và báo cáo trong phạm vi chi nhánh được giao'
      WHERE code = 'STORE_MANAGER';

      UPDATE dbo.roles
      SET name = N'Nhân viên cửa hàng (STAFF)',
          description = N'Nhập kho, xuất bán FEFO, kiểm kê lô, đảo kệ cận hạn & giao nhận điều chuyển'
      WHERE code = 'CASHIER';

      -- Loại bỏ hoàn toàn dữ liệu dự báo giả lập cũ sinh từ tệp JSON/CSV mẫu
      IF OBJECT_ID('dbo.ai_forecasts', 'U') IS NOT NULL
      BEGIN
        DELETE FROM dbo.ai_forecasts
        WHERE model_name = N'LightGBM-HistGBT-v2.1';
      END
    `;

    await SqlConnection.executeSql(migrationSql);
    return true;
  })().catch((err) => {
    schemaReadyPromise = null;
    throw err;
  });

  return schemaReadyPromise;
}

module.exports = ensureSmartSupplySchema;
