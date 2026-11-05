USE [retail_spoilage_db];

-- 1. BẢNG ROLES
IF OBJECT_ID('dbo.roles', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[roles] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [code] NVARCHAR(50) NOT NULL UNIQUE,
        [name] NVARCHAR(100) NOT NULL,
        [description] NVARCHAR(255) NULL,
        [created_at] DATETIME DEFAULT GETDATE()
    );
END

MERGE [dbo].[roles] AS target
USING (VALUES 
    ('ADMIN', N'Chủ chuỗi / Quản trị viên', N'Quản trị hệ thống, cấu hình chuỗi chi nhánh và nhân sự'),
    ('STORE_MANAGER', N'Quản lý cửa hàng (Cửa hàng trưởng)', N'Điều hành KPI, giảm giá Quick Markdown, duyệt tiêu hủy & đặt hàng DC'),
    ('CASHIER', N'Nhân viên cửa hàng (POS & Kho kệ)', N'Bán lẻ POS chuẩn FEFO, tiếp nhận hàng DC, đảo kệ mặt tiền & bàn giao ca trực')
) AS source ([code], [name], [description])
ON (target.[code] = source.[code])
WHEN MATCHED THEN
    UPDATE SET [name] = source.[name], [description] = source.[description]
WHEN NOT MATCHED THEN
    INSERT ([code], [name], [description]) VALUES (source.[code], source.[name], source.[description]);

-- 2. CỘT ROLE_ID CHO USERS
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'role_id')
BEGIN
    ALTER TABLE [dbo].[users] ADD [role_id] INT NULL;
END

-- Cập nhật role_id cho các users
DECLARE @AdminId INT = (SELECT id FROM [dbo].[roles] WHERE [code] = 'ADMIN');
DECLARE @ManagerId INT = (SELECT id FROM [dbo].[roles] WHERE [code] = 'STORE_MANAGER');
DECLARE @CashierId INT = (SELECT id FROM [dbo].[roles] WHERE [code] = 'CASHIER');

-- Tạo hoặc cập nhật 3 users chuẩn (3 Actors)
DECLARE @PassHash NVARCHAR(255) = N'$2b$10$utBHyz0fZU7KTV1BSIEF5exBMNUbmlDzOIc9OUDfbSQtQtKxs96qS';

MERGE [dbo].[users] AS target
USING (VALUES
    ('admin', @PassHash, N'Quản trị viên (Admin)', 'admin@lhumart.edu.vn', '0901112233', @AdminId, 1),
    ('manager', @PassHash, N'Đỗ Tấn Du (Cửa Hàng Trưởng)', 'manager@lhumart.edu.vn', '0902223344', @ManagerId, 1),
    ('cashier', @PassHash, N'Đoàn Minh Quân (Nhân Viên Cửa Hàng)', 'cashier@lhumart.edu.vn', '0903334455', @CashierId, 1)
) AS source ([username], [password_hash], [full_name], [email], [phone], [role_id], [is_active])
ON (target.[username] = source.[username])
WHEN MATCHED THEN
    UPDATE SET 
        [password_hash] = source.[password_hash],
        [full_name] = source.[full_name],
        [role_id] = source.[role_id],
        [is_active] = 1,
        [updated_at] = GETDATE()
WHEN NOT MATCHED THEN
    INSERT ([username], [password_hash], [full_name], [email], [phone], [role_id], [is_active], [created_at], [updated_at])
    VALUES (source.[username], source.[password_hash], source.[full_name], source.[email], source.[phone], source.[role_id], source.[is_active], GETDATE(), GETDATE());

-- Dọn dẹp toàn bộ khóa ngoại trỏ tới user > 3 hoặc role > 3 (WAREHOUSE_STAFF)
IF OBJECT_ID('dbo.store_profile', 'U') IS NOT NULL
    UPDATE [dbo].[store_profile] SET [manager_id] = @ManagerId WHERE [manager_id] NOT IN (@AdminId, @ManagerId, @CashierId);
IF OBJECT_ID('dbo.stock_transfers', 'U') IS NOT NULL
BEGIN
    UPDATE [dbo].[stock_transfers] SET [requested_by] = @CashierId WHERE [requested_by] > 3;
    UPDATE [dbo].[stock_transfers] SET [approved_by] = @ManagerId WHERE [approved_by] > 3;
END
IF OBJECT_ID('dbo.sales_history', 'U') IS NOT NULL
    UPDATE [dbo].[sales_history] SET [cashier_id] = @CashierId WHERE [cashier_id] > 3;
IF OBJECT_ID('dbo.spoilage_records', 'U') IS NOT NULL
BEGIN
    UPDATE [dbo].[spoilage_records] SET [performed_by] = @CashierId WHERE [performed_by] > 3;
    UPDATE [dbo].[spoilage_records] SET [approved_by] = @ManagerId WHERE [approved_by] > 3;
END
IF OBJECT_ID('dbo.goods_receipts', 'U') IS NOT NULL
    UPDATE [dbo].[goods_receipts] SET [received_by] = @CashierId WHERE [received_by] > 3;
IF OBJECT_ID('dbo.purchase_orders', 'U') IS NOT NULL
BEGIN
    UPDATE [dbo].[purchase_orders] SET [created_by] = @ManagerId WHERE [created_by] > 3;
    UPDATE [dbo].[purchase_orders] SET [approved_by] = @AdminId WHERE [approved_by] > 3;
END
IF OBJECT_ID('dbo.system_audit_logs', 'U') IS NOT NULL
    UPDATE [dbo].[system_audit_logs] SET [user_id] = @ManagerId WHERE [user_id] > 3;

DELETE FROM [dbo].[users] WHERE [id] > 3 OR [username] NOT IN ('admin', 'manager', 'cashier');
DELETE FROM [dbo].[roles] WHERE [id] > 3 OR [code] = 'WAREHOUSE_STAFF';

-- 3. BẢNG STORE_PROFILE
IF OBJECT_ID('dbo.store_profile', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[store_profile] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [store_code] NVARCHAR(50) NOT NULL UNIQUE,
        [store_name] NVARCHAR(255) NOT NULL,
        [address] NVARCHAR(255) NOT NULL,
        [phone] NVARCHAR(50) NULL,
        [manager_id] INT NULL,
        [default_dc_supplier_id] INT NULL,
        [default_lead_time_days] INT NOT NULL DEFAULT 1,
        [min_inbound_rsl_percent] DECIMAL(5,2) NOT NULL DEFAULT 70.00,
        [default_warning_days] INT NOT NULL DEFAULT 7,
        [critical_warning_days] INT NOT NULL DEFAULT 3,
        [status] NVARCHAR(50) NOT NULL DEFAULT 'OPEN',
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE()
    );

    INSERT INTO [dbo].[store_profile] (
        [store_code], [store_name], [address], [phone], [manager_id], 
        [default_dc_supplier_id], [default_lead_time_days], [min_inbound_rsl_percent], 
        [default_warning_days], [critical_warning_days], [status]
    ) VALUES (
        'RETAIL-STORE-01', N'Cửa hàng Bán lẻ Tiện lợi LHU Mart (Cơ sở Huỳnh Văn Nghệ)',
        N'Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai', '0251 3952 778',
        @ManagerId, 1, 1, 70.00, 7, 3, 'OPEN'
    );
END

SELECT 'ROLES_COUNT' = (SELECT COUNT(*) FROM roles), 'USERS_COUNT' = (SELECT COUNT(*) FROM users);

