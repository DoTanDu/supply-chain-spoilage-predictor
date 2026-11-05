-- ==============================================================================
-- CLEAN ARCHITECTURE MIGRATION & SEED SCRIPT FOR 3 FOUNDATION MODULES
-- Database: retail_spoilage_db (SQL Server LocalDB)
-- ==============================================================================

USE [retail_spoilage_db];
GO

-- 1. TẠO BẢNG ROLES NẾU CHƯA CÓ
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
GO

-- Seed 3 Roles (3 Actor: OWNER, MANAGER, STAFF)
MERGE [dbo].[roles] AS target
USING (VALUES 
    ('ADMIN', N'Chủ chuỗi / Quản trị viên', N'Toàn quyền quản trị chuỗi chi nhánh, danh mục FMCG, tài khoản và cấu hình hệ thống'),
    ('STORE_MANAGER', N'Quản lý Cửa hàng', N'Điều hành cửa hàng, giảm giá Quick Markdown 15-50%, phê duyệt tiêu hủy và đặt hàng DC'),
    ('CASHIER', N'Nhân viên Cửa hàng (POS & Kho kệ)', N'Bán lẻ tại quầy POS theo chuẩn FEFO, tiếp nhận hàng DC, đảo kệ mặt tiền và kiểm date')
) AS source ([code], [name], [description])
ON (target.[code] = source.[code])
WHEN MATCHED THEN
    UPDATE SET [name] = source.[name], [description] = source.[description]
WHEN NOT MATCHED THEN
    INSERT ([code], [name], [description]) VALUES (source.[code], source.[name], source.[description]);
GO

-- 2. CẬP NHẬT BẢNG USERS
-- Xóa Check Constraint cũ nếu có
DECLARE @ckName NVARCHAR(200);
SELECT @ckName = name FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('users') AND name LIKE '%role%';
IF @ckName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE [dbo].[users] DROP CONSTRAINT [' + @ckName + '];');
END
GO

-- Thêm cột role_id nếu chưa có
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'role_id')
BEGIN
    ALTER TABLE [dbo].[users] ADD [role_id] INT NULL;
    ALTER TABLE [dbo].[users] ADD CONSTRAINT FK_Users_Role FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles]([id]);
END
GO

-- Seed / Update 3 tài khoản người dùng chuẩn (3 Actor)
-- Password chuẩn: Password123@ -> Bcrypt Hash: $2b$10$utBHyz0fZU7KTV1BSIEF5exBMNUbmlDzOIc9OUDfbSQtQtKxs96qS
DECLARE @AdminRoleId INT = (SELECT id FROM [dbo].[roles] WHERE [code] = 'ADMIN');
DECLARE @ManagerRoleId INT = (SELECT id FROM [dbo].[roles] WHERE [code] = 'STORE_MANAGER');
DECLARE @CashierRoleId INT = (SELECT id FROM [dbo].[roles] WHERE [code] = 'CASHIER');
DECLARE @PassHash NVARCHAR(255) = N'$2b$10$utBHyz0fZU7KTV1BSIEF5exBMNUbmlDzOIc9OUDfbSQtQtKxs96qS';

MERGE [dbo].[users] AS target
USING (VALUES
    ('admin', @PassHash, N'Quản trị viên (Admin)', 'admin@lhumart.edu.vn', '0901112233', @AdminRoleId, 1),
    ('manager', @PassHash, N'Đỗ Tấn Du (Cửa Hàng Trưởng)', 'manager@lhumart.edu.vn', '0902223344', @ManagerRoleId, 1),
    ('cashier', @PassHash, N'Đoàn Minh Quân (Nhân Viên Cửa Hàng)', 'cashier@lhumart.edu.vn', '0903334455', @CashierRoleId, 1)
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
GO

-- 3. TẠO BẢNG STORE_PROFILE (CHỈ 1 BẢN GHI DUY NHẤT)
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
        [status] NVARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK ([status] IN ('OPEN', 'CLOSED', 'INVENTORY', 'SUSPENDED')),
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_StoreProfile_Manager FOREIGN KEY ([manager_id]) REFERENCES [dbo].[users]([id]),
        CONSTRAINT FK_StoreProfile_DC FOREIGN KEY ([default_dc_supplier_id]) REFERENCES [dbo].[suppliers]([id])
    );
END
GO

-- Seed thông tin Cửa hàng bán lẻ duy nhất LHU Mart
DECLARE @MgrId INT = (SELECT id FROM [dbo].[users] WHERE [username] = 'manager');
DECLARE @DcId INT = (SELECT TOP 1 id FROM [dbo].[suppliers] WHERE [code] = 'DC-BIENHOA' OR [name] LIKE N'%DC%');
IF @DcId IS NULL SET @DcId = (SELECT TOP 1 id FROM [dbo].[suppliers]);

IF NOT EXISTS (SELECT 1 FROM [dbo].[store_profile] WHERE [store_code] = 'RETAIL-LHU-01')
BEGIN
    INSERT INTO [dbo].[store_profile] (
        [store_code], [store_name], [address], [phone], [manager_id], 
        [default_dc_supplier_id], [default_lead_time_days], [min_inbound_rsl_percent], 
        [default_warning_days], [critical_warning_days], [status]
    ) VALUES (
        'RETAIL-LHU-01', N'Cửa hàng Bán lẻ Tiện lợi LHU Mart (Cơ sở Huỳnh Văn Nghệ)',
        N'Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai', '02513952952',
        @MgrId, @DcId, 1, 70.00, 7, 3, 'OPEN'
    );
END
ELSE
BEGIN
    UPDATE [dbo].[store_profile]
    SET [store_name] = N'Cửa hàng Bán lẻ Tiện lợi LHU Mart (Cơ sở Huỳnh Văn Nghệ)',
        [address] = N'Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai',
        [phone] = '02513952952',
        [manager_id] = @MgrId,
        [default_dc_supplier_id] = @DcId,
        [status] = 'OPEN',
        [updated_at] = GETDATE()
    WHERE [store_code] = 'RETAIL-LHU-01';
END
GO

-- 4. BỔ SUNG CỘT CHO CATEGORIES & PRODUCTS
-- Thêm storage_temperature vào categories nếu chưa có
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('categories') AND name = 'storage_temperature')
BEGIN
    ALTER TABLE [dbo].[categories] ADD [storage_temperature] NVARCHAR(50) NOT NULL DEFAULT N'Nhiệt độ phòng (25°C)';
END
GO

-- Cập nhật nhiệt độ bảo quản chuẩn cho các ngành hàng
UPDATE [dbo].[categories] SET [storage_temperature] = N'Mát (2 - 4°C)', [default_warning_days] = 7 WHERE [code] = 'DAIRY';
UPDATE [dbo].[categories] SET [storage_temperature] = N'Nhiệt độ phòng (25°C)', [default_warning_days] = 2 WHERE [code] = 'BAKERY';
UPDATE [dbo].[categories] SET [storage_temperature] = N'Nhiệt độ phòng (25°C)', [default_warning_days] = 15 WHERE [code] = 'BEVERAGE';
UPDATE [dbo].[categories] SET [storage_temperature] = N'Đông lạnh (-18°C)', [default_warning_days] = 5 WHERE [code] LIKE '%MEAT%';
UPDATE [dbo].[categories] SET [storage_temperature] = N'Mát (8 - 12°C)', [default_warning_days] = 3 WHERE [code] LIKE '%PRODUCE%';
UPDATE [dbo].[categories] SET [storage_temperature] = N'Khô ráo thoáng mát', [default_warning_days] = 30 WHERE [code] LIKE '%DRY%';
GO

-- Thêm normalized_name vào products nếu chưa có
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'normalized_name')
BEGIN
    ALTER TABLE [dbo].[products] ADD [normalized_name] NVARCHAR(200) NULL;
END
GO

-- Cập nhật normalized_name cho các sản phẩm hiện có
UPDATE [dbo].[products]
SET [normalized_name] = LOWER(
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        [name],
        N'á', 'a'), N'à', 'a'), N'ả', 'a'), N'ã', 'a'), N'ạ', 'a'),
        N'ă', 'a'), N'ắ', 'a'), N'ằ', 'a'), N'ẳ', 'a'), N'ẵ', 'a'), N'ặ', 'a'),
        N'â', 'a'), N'ấ', 'a'), N'ầ', 'a'), N'ẩ', 'a'), N'ẫ', 'a'), N'ậ', 'a'),
        N'é', 'e'), N'è', 'e'), N'ẻ', 'e'), N'ẽ', 'e'), N'ẹ', 'e'),
        N'ê', 'e'), N'ế', 'e'), N'ề', 'e'), N'ể', 'e'), N'ễ', 'e'), N'ệ', 'e'),
        N'í', 'i'), N'ì', 'i')
    )
)
WHERE [normalized_name] IS NULL;
GO

PRINT N'>>> Clean Architecture Migration & Seed Data Completed Successfully!';
