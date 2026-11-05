-- ==============================================================================
-- BƯỚC 2: MIGRATION & CHUẨN HÓA CƠ SỞ DỮ LIỆU THEO ĐẶC TẢ CHUẨN MỰC (SSOT)
-- Database: retail_spoilage_db (Microsoft SQL Server LocalDB)
-- Tham chiếu: Mục 17 & Mục 18 Đặc tả hệ thống (Supply Chain Spoilage Predictor)
-- ==============================================================================

USE [retail_spoilage_db];
GO

-- ------------------------------------------------------------------------------
-- 1. BỔ SUNG CỘT CHO BẢNG sales_history (Liên kết Thu ngân POS)
-- ------------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.sales_history') AND name = 'cashier_id')
BEGIN
    ALTER TABLE [dbo].[sales_history] ADD [cashier_id] INT NULL;
    ALTER TABLE [dbo].[sales_history] ADD CONSTRAINT FK_Sales_Cashier FOREIGN KEY ([cashier_id]) REFERENCES [dbo].[users]([id]);
    PRINT N'[OK] Đã thêm cột cashier_id và FK_Sales_Cashier vào sales_history.';
END
GO

-- ------------------------------------------------------------------------------
-- 2. BỔ SUNG CỘT CHO BẢNG spoilage_records (Phê duyệt của Cửa hàng trưởng)
-- ------------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.spoilage_records') AND name = 'approved_by')
BEGIN
    ALTER TABLE [dbo].[spoilage_records] ADD [approved_by] INT NULL;
    ALTER TABLE [dbo].[spoilage_records] ADD CONSTRAINT FK_Spoilage_ApprovedBy FOREIGN KEY ([approved_by]) REFERENCES [dbo].[users]([id]);
    PRINT N'[OK] Đã thêm cột approved_by và FK_Spoilage_ApprovedBy vào spoilage_records.';
END
GO

-- ------------------------------------------------------------------------------
-- 3. BỔ SUNG CỘT CHO BẢNG system_audit_logs (Đối tượng & ID nghiệp vụ)
-- ------------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.system_audit_logs') AND name = 'entity_name')
BEGIN
    ALTER TABLE [dbo].[system_audit_logs] ADD [entity_name] NVARCHAR(100) NULL;
    PRINT N'[OK] Đã thêm cột entity_name vào system_audit_logs.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.system_audit_logs') AND name = 'entity_id')
BEGIN
    ALTER TABLE [dbo].[system_audit_logs] ADD [entity_id] NVARCHAR(100) NULL;
    PRINT N'[OK] Đã thêm cột entity_id vào system_audit_logs.';
END
GO

-- ------------------------------------------------------------------------------
-- 3.1 BỔ SUNG CỘT CHO BẢNG store_profile (Sức chứa quầy kệ theo Mục 3.1 SSOT)
-- ------------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.store_profile') AND name = 'shelf_capacity_skus')
BEGIN
    ALTER TABLE [dbo].[store_profile] ADD [shelf_capacity_skus] INT NULL DEFAULT 1500;
    ALTER TABLE [dbo].[store_profile] ADD [shelf_capacity_units] INT NULL DEFAULT 5000;
    PRINT N'[OK] Đã thêm cột shelf_capacity_skus và shelf_capacity_units vào store_profile.';
END
GO
UPDATE [dbo].[store_profile] SET [shelf_capacity_skus] = 1500, [shelf_capacity_units] = 5000 WHERE [shelf_capacity_skus] IS NULL;
GO

-- ------------------------------------------------------------------------------
-- 4. TỐI ƯU HÓA CHỈ MỤC (INDEX COVERED & INCLUDE) THEO MỤC 18 ĐẶC TẢ
-- ------------------------------------------------------------------------------

-- 4.1 Index FEFO: Hỗ trợ truy vấn quầy POS bóc tách lô nhanh nhất
IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.batches') AND name = 'idx_batches_fefo')
BEGIN
    DROP INDEX [idx_batches_fefo] ON [dbo].[batches];
END
GO

CREATE NONCLUSTERED INDEX [IX_Batches_FEFO]
ON [dbo].[batches]([product_id] ASC, [status] ASC, [expiry_date] ASC)
INCLUDE ([current_quantity], [discount_percent], [import_price], [is_shelf_rotated]);
PRINT N'[OK] Đã tạo IX_Batches_FEFO có INCLUDE columns.';
GO

-- 4.2 Index Expiry Watchdog: Hỗ trợ rà soát hạn dùng đếm lùi hàng ngày
IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.batches') AND name = 'idx_batches_expiry')
BEGIN
    DROP INDEX [idx_batches_expiry] ON [dbo].[batches];
END
GO

CREATE NONCLUSTERED INDEX [IX_Batches_ExpiryWatchdog]
ON [dbo].[batches]([expiry_date] ASC, [status] ASC)
INCLUDE ([batch_code], [current_quantity], [product_id]);
PRINT N'[OK] Đã tạo IX_Batches_ExpiryWatchdog có INCLUDE columns.';
GO

-- 4.3 Index Lịch sử bán hàng: Hỗ trợ dự báo ROP trong 14 ngày
IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.sales_history') AND name = 'idx_sales_product_date')
BEGIN
    DROP INDEX [idx_sales_product_date] ON [dbo].[sales_history];
END
GO

CREATE NONCLUSTERED INDEX [IX_SalesHistory_Product_Date]
ON [dbo].[sales_history]([product_id] ASC, [sale_date] DESC)
INCLUDE ([quantity_sold], [sale_price], [weather], [is_holiday]);
PRINT N'[OK] Đã tạo IX_SalesHistory_Product_Date có INCLUDE columns.';
GO

-- 4.4 Index Sổ hao hụt: Hỗ trợ tra cứu theo Lô và Ngày hủy
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.spoilage_records') AND name = 'IX_SpoilageRecords_Batch')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_SpoilageRecords_Batch]
    ON [dbo].[spoilage_records]([batch_id] ASC, [disposed_date] DESC)
    INCLUDE ([quantity_disposed], [cost_loss], [reason]);
    PRINT N'[OK] Đã tạo IX_SpoilageRecords_Batch.';
END
GO

-- 4.5 Index Đơn đặt hàng PO: Hỗ trợ theo dõi trạng thái đơn gửi DC
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.purchase_orders') AND name = 'IX_PurchaseOrders_Status')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_PurchaseOrders_Status]
    ON [dbo].[purchase_orders]([status] ASC, [created_at] DESC);
    PRINT N'[OK] Đã tạo IX_PurchaseOrders_Status.';
END
GO

-- 4.6 Index Nhật ký kiểm toán: Hỗ trợ tra cứu timeline mới nhất
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.system_audit_logs') AND name = 'IX_AuditLogs_CreatedAt')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_AuditLogs_CreatedAt]
    ON [dbo].[system_audit_logs]([created_at] DESC, [user_id] ASC);
    PRINT N'[OK] Đã tạo IX_AuditLogs_CreatedAt.';
END
GO

-- ------------------------------------------------------------------------------
-- 5. TRIGGER BẢO VỆ CHỐNG TỒN KHO ÂM (RULE 3 CỐT LÕI)
-- ------------------------------------------------------------------------------
IF OBJECT_ID('dbo.TR_Batches_PreventNegativeStock', 'TR') IS NOT NULL
BEGIN
    DROP TRIGGER [dbo].[TR_Batches_PreventNegativeStock];
END
GO

CREATE TRIGGER [dbo].[TR_Batches_PreventNegativeStock]
ON [dbo].[batches]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Kiểm tra nếu có bất kỳ dòng nào sau khi update bị số lượng âm
    IF EXISTS (SELECT 1 FROM inserted WHERE [current_quantity] < 0)
    BEGIN
        RAISERROR (N'LỖI NGHIỆP VỤ (RULE 3): Số lượng tồn kho không được phép nhỏ hơn 0!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- Tự động chuyển trạng thái EXPIRED nếu hạn sử dụng đã qua
    -- (Ngày hiện tại lớn hơn ExpiryDate và trạng thái vẫn là ACTIVE hoặc WARNING)
    IF EXISTS (
        SELECT 1 FROM inserted 
        WHERE [expiry_date] < CAST(GETDATE() AS DATE) 
          AND [status] IN ('ACTIVE', 'WARNING')
    )
    BEGIN
        UPDATE b
        SET b.[status] = 'EXPIRED'
        FROM [dbo].[batches] b
        INNER JOIN inserted i ON b.[id] = i.[id]
        WHERE i.[expiry_date] < CAST(GETDATE() AS DATE) 
          AND b.[status] IN ('ACTIVE', 'WARNING');
    END
END
GO
PRINT N'[OK] Đã tạo Trigger TR_Batches_PreventNegativeStock bảo vệ Rule 3 & Rule 5.';
GO

-- ------------------------------------------------------------------------------
-- 6. VIEW CHUẨN HÓA VÒNG ĐỜI & CẢNH BÁO 3 MÀU (SHELF-LIFE WATCHDOG VIEW)
-- ------------------------------------------------------------------------------
IF OBJECT_ID('dbo.vw_Batches_ShelfLife_Alerts', 'V') IS NOT NULL
BEGIN
    DROP VIEW [dbo].[vw_Batches_ShelfLife_Alerts];
END
GO

CREATE VIEW [dbo].[vw_Batches_ShelfLife_Alerts]
AS
SELECT 
    b.[id] AS batch_id,
    b.[batch_code],
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
    -- Giá sau chiết khấu xả hàng
    ROUND(p.[selling_price] * (1.0 - (CAST(b.[discount_percent] AS DECIMAL(5,2)) / 100.0)), 0) AS discounted_price,
    b.[is_shelf_rotated],
    b.[status],
    
    -- Số ngày còn lại (DaysLeft)
    DATEDIFF(day, CAST(GETDATE() AS DATE), b.[expiry_date]) AS days_left,
    
    -- Tổng số ngày vòng đời chuẩn (TotalLife)
    DATEDIFF(day, b.[manufacture_date], b.[expiry_date]) AS total_shelf_life_days,
    
    -- Tỷ lệ hạn sử dụng còn lại (RSL %)
    CASE 
        WHEN DATEDIFF(day, b.[manufacture_date], b.[expiry_date]) > 0 THEN
            ROUND(
                (CAST(DATEDIFF(day, CAST(GETDATE() AS DATE), b.[expiry_date]) AS FLOAT) / 
                 CAST(DATEDIFF(day, b.[manufacture_date], b.[expiry_date]) AS FLOAT)) * 100.0, 2
            )
        ELSE 0.00
    END AS rsl_percent,
    
    -- Ngưỡng cảnh báo cận date áp dụng (ưu tiên CustomWarningDays của sản phẩm, nếu NULL thì lấy của Category)
    COALESCE(p.[custom_warning_days], c.[default_warning_days], 7) AS warning_threshold_days,
    
    -- Phân loại 3 Vùng màu chuẩn xác theo Đặc tả Mục 9
    CASE 
        WHEN b.[status] = 'DISPOSED' OR b.[current_quantity] = 0 THEN 'DISPOSED'
        WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.[expiry_date]) <= 0 THEN 'EXPIRED'   -- Hết hạn (Đen/Tím)
        WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.[expiry_date]) <= 3 THEN 'RED'        -- Nguy kịch (Đỏ <= 3 ngày)
        WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.[expiry_date]) <= COALESCE(p.[custom_warning_days], c.[default_warning_days], 7) THEN 'YELLOW' -- Cảnh báo (Vàng)
        ELSE 'GREEN' -- An toàn (Xanh)
    END AS alert_color,

    -- Đánh giá giá trị vốn tồn kho & rủi ro tổn thất
    ROUND(b.[current_quantity] * b.[import_price], 2) AS total_inventory_cost,
    CASE 
        WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.[expiry_date]) <= COALESCE(p.[custom_warning_days], c.[default_warning_days], 7)
        THEN ROUND(b.[current_quantity] * b.[import_price], 2)
        ELSE 0.00
    END AS at_risk_cost

FROM [dbo].[batches] b
INNER JOIN [dbo].[products] p ON b.[product_id] = p.[id]
INNER JOIN [dbo].[categories] c ON p.[category_id] = c.[id];
GO
PRINT N'[OK] Đã tạo View vw_Batches_ShelfLife_Alerts tự động tính DaysLeft, RSL% và 3 màu.';
GO

PRINT N'==============================================================================';
PRINT N'>>> BƯỚC 2: CHUẨN HÓA CƠ SỞ DỮ LIỆU SQL SERVER THEO SSOT ĐÃ HOÀN TẤT!';
PRINT N'==============================================================================';
GO
