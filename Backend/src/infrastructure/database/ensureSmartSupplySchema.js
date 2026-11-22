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

      -- Đảm bảo cột store_id trên spoilage_records và đồng bộ ngược từ batches.store_id
      IF COL_LENGTH('dbo.spoilage_records', 'store_id') IS NULL
      BEGIN
        ALTER TABLE dbo.spoilage_records ADD store_id INT NOT NULL CONSTRAINT DF_SpoilageRecords_StoreId DEFAULT 1;
      END;

      UPDATE sr
      SET sr.store_id = ISNULL(b.store_id, 1)
      FROM dbo.spoilage_records sr
      INNER JOIN dbo.batches b ON sr.batch_id = b.id
      WHERE ISNULL(sr.store_id, 1) <> ISNULL(b.store_id, 1);

      -- Đảm bảo cột purchase_order_id trên goods_receipts
      IF COL_LENGTH('dbo.goods_receipts', 'purchase_order_id') IS NULL
      BEGIN
        ALTER TABLE dbo.goods_receipts ADD purchase_order_id INT NULL;
      END;

      -- Đồng bộ Trigger TR_Batches_PreventNegativeStock theo Rule 5 (DaysLeft <= 0 => EXPIRED)
      IF OBJECT_ID('dbo.TR_Batches_PreventNegativeStock', 'TR') IS NOT NULL
      BEGIN
        EXEC(N'
          ALTER TRIGGER [dbo].[TR_Batches_PreventNegativeStock]
          ON [dbo].[batches]
          AFTER UPDATE
          AS
          BEGIN
              SET NOCOUNT ON;
              IF EXISTS (SELECT 1 FROM inserted WHERE [current_quantity] < 0)
              BEGIN
                  RAISERROR (N''LỖI NGHIỆP VỤ (RULE 3): Số lượng tồn kho không được phép nhỏ hơn 0!'', 16, 1);
                  ROLLBACK TRANSACTION;
                  RETURN;
              END

              IF EXISTS (
                  SELECT 1 FROM inserted
                  WHERE [expiry_date] <= CAST(GETDATE() AS DATE)
                    AND [status] IN (''ACTIVE'', ''WARNING'')
              )
              BEGIN
                  UPDATE b
                  SET b.[status] = ''EXPIRED''
                  FROM [dbo].[batches] b
                  INNER JOIN inserted i ON b.[id] = i.[id]
                  WHERE i.[expiry_date] <= CAST(GETDATE() AS DATE)
                    AND b.[status] IN (''ACTIVE'', ''WARNING'');
              END
          END
        ');
      END;

      -- Loại bỏ hoàn toàn dữ liệu dự báo giả lập cũ sinh từ tệp JSON/CSV mẫu
      IF OBJECT_ID('dbo.ai_forecasts', 'U') IS NOT NULL
      BEGIN
        DELETE FROM dbo.ai_forecasts
        WHERE model_name = N'LightGBM-HistGBT-v2.1';
      END

      -- Đồng bộ ràng buộc CHECK cột reason trên spoilage_records cho đủ 3 mã cũ + 5 mã ReFED
      IF OBJECT_ID('dbo.spoilage_records', 'U') IS NOT NULL
      BEGIN
        DECLARE @dropReasonCkSql NVARCHAR(MAX) = N'';
        SELECT @dropReasonCkSql = @dropReasonCkSql +
          N'ALTER TABLE dbo.spoilage_records DROP CONSTRAINT [' + cc.name + N']; '
        FROM sys.check_constraints cc
        WHERE cc.parent_object_id = OBJECT_ID('dbo.spoilage_records')
          AND cc.definition LIKE '%reason%'
          AND cc.name <> 'CK_SpoilageRecords_Reason';

        IF LEN(@dropReasonCkSql) > 0
          EXEC sp_executesql @dropReasonCkSql;

        IF NOT EXISTS (
          SELECT 1 FROM sys.check_constraints
          WHERE parent_object_id = OBJECT_ID('dbo.spoilage_records')
            AND name = 'CK_SpoilageRecords_Reason'
        )
        BEGIN
          ALTER TABLE dbo.spoilage_records
          ADD CONSTRAINT CK_SpoilageRecords_Reason CHECK (
            [reason] IN (
              'EXPIRED', 'DAMAGED', 'SPOILED',
              'EXP_SPOILAGE', 'PKG_DAMAGE', 'TEMP_ABUSE', 'INTERNAL_SHRINK', 'DONATION'
            )
          );
        END;
      END;
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
