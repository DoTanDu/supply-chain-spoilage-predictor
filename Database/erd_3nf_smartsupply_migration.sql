-- =============================================================================
-- SCRIPT CHUẨN HÓA CƠ SỞ DỮ LIỆU 3NF TOÀN DIỆN (SMARTSUPPLY AI - 15 BẢNG)
-- Hệ quản trị CSDL: Microsoft SQL Server LocalDB (retail_spoilage_db)
-- Mục tiêu:
--   1. Loại bỏ bảng rác (system_settings) và cột dư thừa phi 3NF (users.role).
--   2. Mở rộng mô hình Chuỗi Cửa hàng (3 chi nhánh MVP + hỗ trợ 1 cửa hàng độc lập).
--   3. Nối khóa ngoại store_id từ toàn bộ bảng nghiệp vụ về store_profile(id).
--   4. Nối khóa ngoại purchase_order_id từ goods_receipts về purchase_orders(id).
--   5. Bổ sung 2 bảng mới chuẩn 3NF: ai_forecasts & stock_transfers.
--   6. Chuẩn hóa tên toàn bộ Foreign Keys & Khởi tạo SSMS Database Diagrams.
-- =============================================================================

USE [retail_spoilage_db];
GO

SET NOCOUNT ON;
GO

-- -----------------------------------------------------------------------------
-- 1. XÓA BẢNG RÁC CÔ LẬP (system_settings)
-- -----------------------------------------------------------------------------
IF OBJECT_ID('dbo.system_settings', 'U') IS NOT NULL
BEGIN
    DROP TABLE [dbo].[system_settings];
    PRINT N'✓ Đã xóa bảng cô lập dbo.system_settings';
END
GO

-- -----------------------------------------------------------------------------
-- 2. MỞ RỘNG BẢNG store_profile HỖ TRỢ CHUỖI 3 CHI NHÁNH MVP
-- -----------------------------------------------------------------------------
-- Gỡ bỏ ràng buộc khóa 1 dòng duy nhất nếu có
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_single_store_row')
BEGIN
    ALTER TABLE [dbo].[store_profile] DROP CONSTRAINT [chk_single_store_row];
END
GO

-- Đảm bảo Chi nhánh 2 và Chi nhánh 3 tồn tại cho mô hình Chuỗi 3 Cửa hàng MVP
IF NOT EXISTS (SELECT 1 FROM [dbo].[store_profile] WHERE [store_code] = N'RETAIL-STORE-02')
BEGIN
    INSERT INTO [dbo].[store_profile] (
        [store_code], [store_name], [address], [phone], [manager_id], [default_dc_supplier_id],
        [default_lead_time_days], [min_inbound_rsl_percent], [default_warning_days], [critical_warning_days],
        [status], [open_time], [close_time], [shelf_capacity_skus], [shelf_capacity_units]
    )
    VALUES (
        N'RETAIL-STORE-02',
        N'Cửa hàng LHU Mart - Chi nhánh Tân Phong (Cửa hàng B)',
        N'Số 120 Đồng Khởi, P. Tân Phong, TP. Biên Hòa, Đồng Nai',
        N'02513888902',
        2,
        1,
        1, 70.00, 7, 3, N'OPEN', N'06:00', N'22:00', 1200, 4000
    );
END

IF NOT EXISTS (SELECT 1 FROM [dbo].[store_profile] WHERE [store_code] = N'RETAIL-STORE-03')
BEGIN
    INSERT INTO [dbo].[store_profile] (
        [store_code], [store_name], [address], [phone], [manager_id], [default_dc_supplier_id],
        [default_lead_time_days], [min_inbound_rsl_percent], [default_warning_days], [critical_warning_days],
        [status], [open_time], [close_time], [shelf_capacity_skus], [shelf_capacity_units]
    )
    VALUES (
        N'RETAIL-STORE-03',
        N'Cửa hàng LHU Mart - Chi nhánh Trảng Dài (Cửa hàng C)',
        N'Số 45 Nguyễn Khuyến, P. Trảng Dài, TP. Biên Hòa, Đồng Nai',
        N'02513888903',
        4,
        1,
        1, 70.00, 7, 3, N'OPEN', N'06:00', N'22:00', 1200, 4000
    );
END
PRINT N'✓ Đã chuẩn hóa bảng dbo.store_profile (Hỗ trợ Chuỗi 3 chi nhánh A, B, C)';
GO

-- -----------------------------------------------------------------------------
-- 3. CHUẨN HÓA 3NF BẢNG users (Xóa cột dư thừa users.role & Thêm FK store_id)
-- -----------------------------------------------------------------------------
-- Đồng bộ role_id cho mọi dòng trước khi bỏ cột role
IF COL_LENGTH('dbo.users', 'role') IS NOT NULL
BEGIN
    EXEC('
        UPDATE u
        SET u.role_id = CASE 
            WHEN u.role = ''ADMIN'' OR u.role = ''OWNER'' THEN 1
            WHEN u.role = ''STORE_MANAGER'' OR u.role = ''MANAGER'' THEN 2
            WHEN u.role = ''WAREHOUSE_STAFF'' THEN 4
            ELSE 3
        END
        FROM [dbo].[users] u
        WHERE u.role_id IS NULL;
    ');

    -- Xóa Default Constraint gắn trên cột users.role
    DECLARE @df_role NVARCHAR(128);
    SELECT @df_role = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.users') AND c.name = 'role';

    IF @df_role IS NOT NULL
        EXEC('ALTER TABLE [dbo].[users] DROP CONSTRAINT [' + @df_role + ']');

    -- Xóa Check Constraint gắn trên cột users.role nếu có
    DECLARE @ck_role NVARCHAR(128);
    SELECT @ck_role = cc.name
    FROM sys.check_constraints cc
    WHERE cc.parent_object_id = OBJECT_ID('dbo.users') AND cc.definition LIKE '%role%';

    IF @ck_role IS NOT NULL
        EXEC('ALTER TABLE [dbo].[users] DROP CONSTRAINT [' + @ck_role + ']');

    ALTER TABLE [dbo].[users] DROP COLUMN [role];
    PRINT N'✓ Đã xóa cột dư thừa users.role (Đạt chuẩn 3NF với bảng roles)';
END
GO

-- Đặt role_id là NOT NULL
UPDATE [dbo].[users] SET [role_id] = 3 WHERE [role_id] IS NULL;
ALTER TABLE [dbo].[users] ALTER COLUMN [role_id] INT NOT NULL;
GO

-- Thêm cột store_id (FK -> store_profile.id) vào bảng users
IF COL_LENGTH('dbo.users', 'store_id') IS NULL
BEGIN
    ALTER TABLE [dbo].[users] ADD [store_id] INT NULL;
    ALTER TABLE [dbo].[users] ADD CONSTRAINT [FK_Users_StoreProfile]
        FOREIGN KEY ([store_id]) REFERENCES [dbo].[store_profile]([id]);
    
    -- Admin/Owner (role_id = 1) quản lý toàn chuỗi (store_id = NULL), các nhân sự khác gắn với Chi nhánh 1
    EXEC('UPDATE [dbo].[users] SET [store_id] = 1 WHERE [role_id] <> 1;');
    PRINT N'✓ Đã thêm khóa ngoại FK_Users_StoreProfile (users.store_id -> store_profile.id)';
END
GO

-- -----------------------------------------------------------------------------
-- 4. BỔ SUNG KHÓA NGOẠI store_id & purchase_order_id CHO CÁC BẢNG VẬN HÀNH
-- -----------------------------------------------------------------------------

-- 4.1 Bảng batches (Lô hàng thuộc chi nhánh nào)
IF COL_LENGTH('dbo.batches', 'store_id') IS NULL
BEGIN
    ALTER TABLE [dbo].[batches] ADD [store_id] INT NOT NULL CONSTRAINT [DF_Batches_StoreId] DEFAULT (1);
    ALTER TABLE [dbo].[batches] ADD CONSTRAINT [FK_Batches_StoreProfile]
        FOREIGN KEY ([store_id]) REFERENCES [dbo].[store_profile]([id]);
    PRINT N'✓ Đã thêm FK_Batches_StoreProfile (batches.store_id -> store_profile.id)';
END
GO

-- 4.2 Bảng sales_history (Giao dịch bán lẻ tại chi nhánh nào)
IF COL_LENGTH('dbo.sales_history', 'store_id') IS NULL
BEGIN
    ALTER TABLE [dbo].[sales_history] ADD [store_id] INT NOT NULL CONSTRAINT [DF_SalesHistory_StoreId] DEFAULT (1);
    ALTER TABLE [dbo].[sales_history] ADD CONSTRAINT [FK_SalesHistory_StoreProfile]
        FOREIGN KEY ([store_id]) REFERENCES [dbo].[store_profile]([id]);
    PRINT N'✓ Đã thêm FK_SalesHistory_StoreProfile (sales_history.store_id -> store_profile.id)';
END
GO

-- 4.3 Bảng purchase_orders (Đơn đặt hàng của chi nhánh nào)
IF COL_LENGTH('dbo.purchase_orders', 'store_id') IS NULL
BEGIN
    ALTER TABLE [dbo].[purchase_orders] ADD [store_id] INT NOT NULL CONSTRAINT [DF_PurchaseOrders_StoreId] DEFAULT (1);
    ALTER TABLE [dbo].[purchase_orders] ADD CONSTRAINT [FK_PurchaseOrders_StoreProfile]
        FOREIGN KEY ([store_id]) REFERENCES [dbo].[store_profile]([id]);
    PRINT N'✓ Đã thêm FK_PurchaseOrders_StoreProfile (purchase_orders.store_id -> store_profile.id)';
END
GO

-- 4.4 Bảng goods_receipts (Phiếu nhập của chi nhánh nào & thuộc đơn đặt hàng PO nào)
IF COL_LENGTH('dbo.goods_receipts', 'store_id') IS NULL
BEGIN
    ALTER TABLE [dbo].[goods_receipts] ADD [store_id] INT NOT NULL CONSTRAINT [DF_GoodsReceipts_StoreId] DEFAULT (1);
    ALTER TABLE [dbo].[goods_receipts] ADD CONSTRAINT [FK_GoodsReceipts_StoreProfile]
        FOREIGN KEY ([store_id]) REFERENCES [dbo].[store_profile]([id]);
    PRINT N'✓ Đã thêm FK_GoodsReceipts_StoreProfile (goods_receipts.store_id -> store_profile.id)';
END

IF COL_LENGTH('dbo.goods_receipts', 'purchase_order_id') IS NULL
BEGIN
    ALTER TABLE [dbo].[goods_receipts] ADD [purchase_order_id] INT NULL;
    ALTER TABLE [dbo].[goods_receipts] ADD CONSTRAINT [FK_GoodsReceipts_PurchaseOrder]
        FOREIGN KEY ([purchase_order_id]) REFERENCES [dbo].[purchase_orders]([id]);
    PRINT N'✓ Đã thêm FK_GoodsReceipts_PurchaseOrder (goods_receipts.purchase_order_id -> purchase_orders.id)';
END
GO

-- 4.5 Bảng spoilage_records (Biên bản hủy hàng tại chi nhánh nào)
IF COL_LENGTH('dbo.spoilage_records', 'store_id') IS NULL
BEGIN
    ALTER TABLE [dbo].[spoilage_records] ADD [store_id] INT NOT NULL CONSTRAINT [DF_SpoilageRecords_StoreId] DEFAULT (1);
    ALTER TABLE [dbo].[spoilage_records] ADD CONSTRAINT [FK_SpoilageRecords_StoreProfile]
        FOREIGN KEY ([store_id]) REFERENCES [dbo].[store_profile]([id]);
    PRINT N'✓ Đã thêm FK_SpoilageRecords_StoreProfile (spoilage_records.store_id -> store_profile.id)';
END
GO

-- -----------------------------------------------------------------------------
-- 5. TẠO 2 BẢNG MỚI CHUẨN 3NF: ai_forecasts & stock_transfers
-- -----------------------------------------------------------------------------

-- 5.1 Bảng ai_forecasts (Lưu kết quả dự báo sức mua 7 ngày & Rủi ro lãng phí)
IF OBJECT_ID('dbo.ai_forecasts', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[ai_forecasts] (
        [id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_ai_forecasts] PRIMARY KEY,
        [store_id] INT NOT NULL,
        [product_id] INT NOT NULL,
        [forecast_date] DATE NOT NULL,
        [predicted_sales] DECIMAL(10,2) NOT NULL CONSTRAINT [CK_ai_forecasts_predicted] CHECK ([predicted_sales] >= 0),
        [lower_bound] DECIMAL(10,2) NOT NULL,
        [upper_bound] DECIMAL(10,2) NOT NULL,
        [spoilage_risk_qty] INT NOT NULL CONSTRAINT [DF_ai_forecasts_risk] DEFAULT (0),
        [suggested_order_qty] INT NOT NULL CONSTRAINT [DF_ai_forecasts_order] DEFAULT (0),
        [model_name] NVARCHAR(50) NOT NULL CONSTRAINT [DF_ai_forecasts_model] DEFAULT (N'LightGBM-v1'),
        [mae_metric] DECIMAL(8,2) NULL,
        [created_at] DATETIME NOT NULL CONSTRAINT [DF_ai_forecasts_created] DEFAULT (GETDATE()),
        CONSTRAINT [FK_AiForecasts_StoreProfile] FOREIGN KEY ([store_id]) REFERENCES [dbo].[store_profile]([id]),
        CONSTRAINT [FK_AiForecasts_Product] FOREIGN KEY ([product_id]) REFERENCES [dbo].[products]([id])
    );

    CREATE NONCLUSTERED INDEX [IX_AiForecasts_Store_Product_Date]
        ON [dbo].[ai_forecasts] ([store_id], [product_id], [forecast_date] DESC);

    -- Seed dữ liệu mẫu dự báo AI 7 ngày tới
    INSERT INTO [dbo].[ai_forecasts] ([store_id], [product_id], [forecast_date], [predicted_sales], [lower_bound], [upper_bound], [spoilage_risk_qty], [suggested_order_qty], [model_name], [mae_metric])
    VALUES
        (1, 1, CAST(DATEADD(day, 1, GETDATE()) AS DATE), 45.0, 38.0, 52.0, 12, 0, N'LightGBM-M5-Pretrained', 2.15),
        (1, 2, CAST(DATEADD(day, 1, GETDATE()) AS DATE), 35.0, 28.0, 42.0, 40, 0, N'LightGBM-M5-Pretrained', 1.85),
        (2, 2, CAST(DATEADD(day, 1, GETDATE()) AS DATE), 60.0, 50.0, 70.0, 0, 35, N'LightGBM-M5-Pretrained', 1.92),
        (3, 1, CAST(DATEADD(day, 1, GETDATE()) AS DATE), 50.0, 42.0, 58.0, 0, 25, N'LightGBM-M5-Pretrained', 2.05);

    PRINT N'✓ Đã tạo bảng dbo.ai_forecasts và nạp dữ liệu dự báo mẫu';
END
GO

-- 5.2 Bảng stock_transfers (Phiếu điều phối hàng Dư – Thiếu giữa các chi nhánh)
IF OBJECT_ID('dbo.stock_transfers', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[stock_transfers] (
        [id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_stock_transfers] PRIMARY KEY,
        [transfer_code] NVARCHAR(50) NOT NULL CONSTRAINT [UQ_stock_transfers_code] UNIQUE,
        [from_store_id] INT NOT NULL,
        [to_store_id] INT NOT NULL,
        [product_id] INT NOT NULL,
        [source_batch_id] INT NOT NULL,
        [transfer_quantity] INT NOT NULL CONSTRAINT [CK_stock_transfers_qty] CHECK ([transfer_quantity] > 0),
        [shipping_cost] DECIMAL(12,2) NOT NULL CONSTRAINT [DF_stock_transfers_cost] DEFAULT (0),
        [status] NVARCHAR(30) NOT NULL CONSTRAINT [DF_stock_transfers_status] DEFAULT (N'PROPOSED')
            CONSTRAINT [CK_stock_transfers_status] CHECK ([status] IN (N'PROPOSED', N'PENDING', N'APPROVED', N'IN_TRANSIT', N'RECEIVED', N'CANCELLED')),
        [ai_recommendation_note] NVARCHAR(500) NULL,
        [requested_by] INT NOT NULL,
        [approved_by] INT NULL,
        [created_at] DATETIME NOT NULL CONSTRAINT [DF_stock_transfers_created] DEFAULT (GETDATE()),
        [received_at] DATETIME NULL,
        CONSTRAINT [CK_stock_transfers_diff_stores] CHECK ([from_store_id] <> [to_store_id]),
        CONSTRAINT [FK_StockTransfers_FromStore] FOREIGN KEY ([from_store_id]) REFERENCES [dbo].[store_profile]([id]),
        CONSTRAINT [FK_StockTransfers_ToStore] FOREIGN KEY ([to_store_id]) REFERENCES [dbo].[store_profile]([id]),
        CONSTRAINT [FK_StockTransfers_Product] FOREIGN KEY ([product_id]) REFERENCES [dbo].[products]([id]),
        CONSTRAINT [FK_StockTransfers_SourceBatch] FOREIGN KEY ([source_batch_id]) REFERENCES [dbo].[batches]([id]),
        CONSTRAINT [FK_StockTransfers_RequestedBy] FOREIGN KEY ([requested_by]) REFERENCES [dbo].[users]([id]),
        CONSTRAINT [FK_StockTransfers_ApprovedBy] FOREIGN KEY ([approved_by]) REFERENCES [dbo].[users]([id])
    );

    CREATE NONCLUSTERED INDEX [IX_StockTransfers_Stores_Status]
        ON [dbo].[stock_transfers] ([from_store_id], [to_store_id], [status]);

    -- Seed dữ liệu mẫu điều phối liên chi nhánh (Ví dụ thực tế từ tài liệu định hướng)
    DECLARE @sampleBatchId INT;
    SELECT TOP 1 @sampleBatchId = [id] FROM [dbo].[batches] WHERE [current_quantity] > 0 ORDER BY [id] ASC;
    IF @sampleBatchId IS NOT NULL
    BEGIN
        INSERT INTO [dbo].[stock_transfers] (
            [transfer_code], [from_store_id], [to_store_id], [product_id], [source_batch_id],
            [transfer_quantity], [shipping_cost], [status], [ai_recommendation_note], [requested_by], [approved_by]
        )
        VALUES (
            N'TRF-20261105-001',
            1, 2, 1, @sampleBatchId,
            15, 25000, N'APPROVED',
            N'[OR-Tools Optimization] Chi nhánh 1 dư 40 đơn vị cận date (dự báo bán 25), Chi nhánh 2 thiếu 15 đơn vị (dự báo bán 60). Đề xuất điều chuyển 15 đơn vị.',
            2, 1
        );
    END

    PRINT N'✓ Đã tạo bảng dbo.stock_transfers và nạp phiếu điều chuyển mẫu';
END
GO

-- -----------------------------------------------------------------------------
-- 6. ĐẶT LẠI TÊN CHUẨN MỰC CHO TOÀN BỘ KHÓA NGOẠI (FOREIGN KEYS) TRÊN SSMS
-- -----------------------------------------------------------------------------
DECLARE @oldFkName NVARCHAR(128);

-- batches -> products
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id WHERE fk.parent_object_id = OBJECT_ID('dbo.batches') AND fk.referenced_object_id = OBJECT_ID('dbo.products');
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_Batches_Product' EXEC sp_rename @oldFkName, 'FK_Batches_Product', 'OBJECT';

-- batches -> goods_receipts
SET @oldFkName = NULL;
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id WHERE fk.parent_object_id = OBJECT_ID('dbo.batches') AND fk.referenced_object_id = OBJECT_ID('dbo.goods_receipts');
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_Batches_GoodsReceipt' EXEC sp_rename @oldFkName, 'FK_Batches_GoodsReceipt', 'OBJECT';

-- goods_receipts -> suppliers
SET @oldFkName = NULL;
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk WHERE fk.parent_object_id = OBJECT_ID('dbo.goods_receipts') AND fk.referenced_object_id = OBJECT_ID('dbo.suppliers');
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_GoodsReceipts_Supplier' EXEC sp_rename @oldFkName, 'FK_GoodsReceipts_Supplier', 'OBJECT';

-- goods_receipts -> users
SET @oldFkName = NULL;
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk WHERE fk.parent_object_id = OBJECT_ID('dbo.goods_receipts') AND fk.referenced_object_id = OBJECT_ID('dbo.users');
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_GoodsReceipts_ReceivedBy' EXEC sp_rename @oldFkName, 'FK_GoodsReceipts_ReceivedBy', 'OBJECT';

-- products -> categories
SET @oldFkName = NULL;
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk WHERE fk.parent_object_id = OBJECT_ID('dbo.products') AND fk.referenced_object_id = OBJECT_ID('dbo.categories');
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_Products_Category' EXEC sp_rename @oldFkName, 'FK_Products_Category', 'OBJECT';

-- products -> suppliers
SET @oldFkName = NULL;
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk WHERE fk.parent_object_id = OBJECT_ID('dbo.products') AND fk.referenced_object_id = OBJECT_ID('dbo.suppliers');
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_Products_DefaultSupplier' EXEC sp_rename @oldFkName, 'FK_Products_DefaultSupplier', 'OBJECT';

-- purchase_order_items -> purchase_orders
SET @oldFkName = NULL;
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk WHERE fk.parent_object_id = OBJECT_ID('dbo.purchase_order_items') AND fk.referenced_object_id = OBJECT_ID('dbo.purchase_orders');
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_PurchaseOrderItems_Order' EXEC sp_rename @oldFkName, 'FK_PurchaseOrderItems_Order', 'OBJECT';

-- purchase_order_items -> products
SET @oldFkName = NULL;
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk WHERE fk.parent_object_id = OBJECT_ID('dbo.purchase_order_items') AND fk.referenced_object_id = OBJECT_ID('dbo.products');
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_PurchaseOrderItems_Product' EXEC sp_rename @oldFkName, 'FK_PurchaseOrderItems_Product', 'OBJECT';

-- purchase_orders -> suppliers
SET @oldFkName = NULL;
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk WHERE fk.parent_object_id = OBJECT_ID('dbo.purchase_orders') AND fk.referenced_object_id = OBJECT_ID('dbo.suppliers');
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_PurchaseOrders_Supplier' EXEC sp_rename @oldFkName, 'FK_PurchaseOrders_Supplier', 'OBJECT';

-- purchase_orders -> users (created_by)
SET @oldFkName = NULL;
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id WHERE fk.parent_object_id = OBJECT_ID('dbo.purchase_orders') AND c.name = 'created_by';
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_PurchaseOrders_CreatedBy' EXEC sp_rename @oldFkName, 'FK_PurchaseOrders_CreatedBy', 'OBJECT';

-- purchase_orders -> users (approved_by)
SET @oldFkName = NULL;
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id WHERE fk.parent_object_id = OBJECT_ID('dbo.purchase_orders') AND c.name = 'approved_by';
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_PurchaseOrders_ApprovedBy' EXEC sp_rename @oldFkName, 'FK_PurchaseOrders_ApprovedBy', 'OBJECT';

-- sales_history -> batches
SET @oldFkName = NULL;
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk WHERE fk.parent_object_id = OBJECT_ID('dbo.sales_history') AND fk.referenced_object_id = OBJECT_ID('dbo.batches');
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_SalesHistory_Batch' EXEC sp_rename @oldFkName, 'FK_SalesHistory_Batch', 'OBJECT';

-- sales_history -> products
SET @oldFkName = NULL;
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk WHERE fk.parent_object_id = OBJECT_ID('dbo.sales_history') AND fk.referenced_object_id = OBJECT_ID('dbo.products');
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_SalesHistory_Product' EXEC sp_rename @oldFkName, 'FK_SalesHistory_Product', 'OBJECT';

-- spoilage_records -> batches
SET @oldFkName = NULL;
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk WHERE fk.parent_object_id = OBJECT_ID('dbo.spoilage_records') AND fk.referenced_object_id = OBJECT_ID('dbo.batches');
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_SpoilageRecords_Batch' EXEC sp_rename @oldFkName, 'FK_SpoilageRecords_Batch', 'OBJECT';

-- spoilage_records -> users (performed_by)
SET @oldFkName = NULL;
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id WHERE fk.parent_object_id = OBJECT_ID('dbo.spoilage_records') AND c.name = 'performed_by';
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_SpoilageRecords_PerformedBy' EXEC sp_rename @oldFkName, 'FK_SpoilageRecords_PerformedBy', 'OBJECT';

-- system_audit_logs -> users
SET @oldFkName = NULL;
SELECT @oldFkName = fk.name FROM sys.foreign_keys fk WHERE fk.parent_object_id = OBJECT_ID('dbo.system_audit_logs') AND fk.referenced_object_id = OBJECT_ID('dbo.users');
IF @oldFkName IS NOT NULL AND @oldFkName <> 'FK_AuditLogs_User' EXEC sp_rename @oldFkName, 'FK_AuditLogs_User', 'OBJECT';

PRINT N'✓ Đã chuẩn hóa tên toàn bộ ràng buộc khóa ngoại (FOREIGN KEYS)';
GO

-- -----------------------------------------------------------------------------
-- 7. CẬP NHẬT VIEW vw_Batches_ShelfLife_Alerts (Kèm store_id & store_name)
-- -----------------------------------------------------------------------------
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
        WHEN b.[status] = 'DISPOSED' OR b.[current_quantity] = 0 THEN 'DISPOSED'
        WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.[expiry_date]) <= 0 THEN 'EXPIRED'
        WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.[expiry_date]) <= 3 THEN 'RED'
        WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.[expiry_date]) <= COALESCE(p.[custom_warning_days], c.[default_warning_days], 7) THEN 'YELLOW'
        ELSE 'GREEN'
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
GO

-- -----------------------------------------------------------------------------
-- 8. KÍCH HOẠT HỖ TRỢ DATABASE DIAGRAMS TRONG SSMS (dbo.sysdiagrams)
-- -----------------------------------------------------------------------------
IF OBJECT_ID('dbo.sysdiagrams', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[sysdiagrams] (
        [name] sysname NOT NULL,
        [principal_id] int NOT NULL,
        [diagram_id] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK__sysdiagrams] PRIMARY KEY,
        [version] int NULL,
        [definition] varbinary(max) NULL,
        CONSTRAINT [UK_principal_name] UNIQUE ([principal_id], [name])
    );

    EXEC sys.sp_addextendedproperty 
        @name = N'microsoft_database_tools_support', 
        @value = 1, 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE',  @level1name = N'sysdiagrams';

    PRINT N'✓ Đã kích hoạt bảng hệ thống dbo.sysdiagrams hỗ trợ SSMS Database Diagrams';
END
GO

