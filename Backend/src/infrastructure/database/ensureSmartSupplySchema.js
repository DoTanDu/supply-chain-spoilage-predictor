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

      -- 3 Stored Procedures nghiệp vụ chuẩn hóa cho SSMS & báo cáo quản trị
      EXEC(N'
        CREATE OR ALTER PROCEDURE dbo.sp_GetStoreInventoryHealth
          @StoreId INT = NULL
        AS
        BEGIN
          SET NOCOUNT ON;
          SELECT
            COUNT(*) AS totalBatches,
            ISNULL(SUM(b.current_quantity), 0) AS totalUnits,
            ISNULL(SUM(b.current_quantity * ISNULL(b.import_price, 0)), 0) AS totalInventoryCost,
            ISNULL(SUM(CASE WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date) <= 0 THEN b.current_quantity ELSE 0 END), 0) AS expiredUnits,
            ISNULL(SUM(CASE WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date) BETWEEN 1 AND 3 THEN b.current_quantity ELSE 0 END), 0) AS criticalRedUnits,
            ISNULL(SUM(CASE WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date) BETWEEN 4 AND 7 THEN b.current_quantity ELSE 0 END), 0) AS warningYellowUnits,
            ISNULL(SUM(CASE WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date) > 7 THEN b.current_quantity ELSE 0 END), 0) AS safeGreenUnits
          FROM dbo.batches b
          WHERE b.current_quantity > 0
            AND b.status <> ''DISPOSED''
            AND (@StoreId IS NULL OR ISNULL(b.store_id, 1) = @StoreId);
        END
      ');

      EXEC(N'
        CREATE OR ALTER PROCEDURE dbo.sp_GetSpoilageFinancialSummary
          @StoreId INT = NULL,
          @Days INT = 30
        AS
        BEGIN
          SET NOCOUNT ON;
          SELECT
            ISNULL(sr.reason, N''EXP_SPOILAGE'') AS reason,
            COUNT(*) AS recordCount,
            ISNULL(SUM(sr.quantity_disposed), 0) AS totalDisposedUnits,
            ISNULL(SUM(sr.cost_loss), 0) AS totalCostLoss
          FROM dbo.spoilage_records sr
          INNER JOIN dbo.batches b ON sr.batch_id = b.id
          WHERE sr.approved_by IS NOT NULL
            AND sr.disposed_date >= DATEADD(day, -ISNULL(@Days, 30), CAST(GETDATE() AS DATE))
            AND (@StoreId IS NULL OR ISNULL(sr.store_id, b.store_id) = @StoreId)
          GROUP BY ISNULL(sr.reason, N''EXP_SPOILAGE'')
          ORDER BY SUM(sr.cost_loss) DESC;
        END
      ');

      EXEC(N'
        CREATE OR ALTER PROCEDURE dbo.sp_GetChainBalanceOverview
        AS
        BEGIN
          SET NOCOUNT ON;
          SELECT
            sp.id AS storeId,
            sp.store_code AS storeCode,
            sp.store_name AS storeName,
            ISNULL((SELECT COUNT(*) FROM dbo.batches b WHERE ISNULL(b.store_id, 1) = sp.id AND b.current_quantity > 0 AND b.status IN (''ACTIVE'', ''WARNING'')), 0) AS activeBatches,
            ISNULL((SELECT SUM(b.current_quantity) FROM dbo.batches b WHERE ISNULL(b.store_id, 1) = sp.id AND b.current_quantity > 0 AND b.status IN (''ACTIVE'', ''WARNING'')), 0) AS totalUnits,
            ISNULL((SELECT SUM(sh.total_amount) FROM dbo.sales_history sh WHERE ISNULL(sh.store_id, 1) = sp.id AND sh.sale_date >= DATEADD(day, -14, CAST(GETDATE() AS DATE))), 0) AS salesRevenue14d,
            ISNULL((SELECT SUM(sr.cost_loss) FROM dbo.spoilage_records sr INNER JOIN dbo.batches b ON sr.batch_id = b.id WHERE ISNULL(sr.store_id, b.store_id) = sp.id AND sr.approved_by IS NOT NULL AND sr.disposed_date >= DATEADD(day, -14, CAST(GETDATE() AS DATE))), 0) AS spoilageLoss14d
          FROM dbo.store_profile sp
          WHERE ISNULL(sp.status, ''OPEN'') <> ''SUSPENDED''
          ORDER BY sp.id ASC;
        END
      ');
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
