-- ==============================================================================
-- ĐỀ TÀI: NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG CHỐNG LÃNG PHÍ (SUPPLY CHAIN SPOILAGE PREDICTOR)
-- GIẢNG VIÊN HƯỚNG DẪN: ThS. LÊ MINH NHẬT
-- NHÓM SINH VIÊN: ĐỖ TẤN DU (123001364) - ĐOÀN MINH QUÂN (123000946)
-- PHIÊN BẢN CHUẨN MICROSOFT SQL SERVER / SSMS (T-SQL)
-- ==============================================================================

-- 1. KHỞI TẠO DATABASE
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'retail_spoilage_db')
BEGIN
    CREATE DATABASE [retail_spoilage_db];
END
GO

USE [retail_spoilage_db];
GO

-- Xóa các bảng cũ nếu tồn tại (theo thứ tự khóa ngoại)
IF OBJECT_ID('dbo.system_audit_logs', 'U') IS NOT NULL DROP TABLE dbo.system_audit_logs;
IF OBJECT_ID('dbo.system_settings', 'U') IS NOT NULL DROP TABLE dbo.system_settings;
IF OBJECT_ID('dbo.spoilage_records', 'U') IS NOT NULL DROP TABLE dbo.spoilage_records;
IF OBJECT_ID('dbo.sales_history', 'U') IS NOT NULL DROP TABLE dbo.sales_history;
IF OBJECT_ID('dbo.purchase_order_items', 'U') IS NOT NULL DROP TABLE dbo.purchase_order_items;
IF OBJECT_ID('dbo.purchase_orders', 'U') IS NOT NULL DROP TABLE dbo.purchase_orders;
IF OBJECT_ID('dbo.batches', 'U') IS NOT NULL DROP TABLE dbo.batches;
IF OBJECT_ID('dbo.goods_receipts', 'U') IS NOT NULL DROP TABLE dbo.goods_receipts;
IF OBJECT_ID('dbo.products', 'U') IS NOT NULL DROP TABLE dbo.products;
IF OBJECT_ID('dbo.categories', 'U') IS NOT NULL DROP TABLE dbo.categories;
IF OBJECT_ID('dbo.suppliers', 'U') IS NOT NULL DROP TABLE dbo.suppliers;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
GO

-- ==============================================================================
-- 2. TẠO CÁC BẢNG DỮ LIỆU (TABLES)
-- ==============================================================================

-- BẢNG 1: system_settings
CREATE TABLE [dbo].[system_settings] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [setting_key] NVARCHAR(50) NOT NULL UNIQUE,
    [setting_value] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(255) NULL,
    [updated_at] DATETIME DEFAULT GETDATE()
);
GO

-- BẢNG 2: users
CREATE TABLE [dbo].[users] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [username] NVARCHAR(50) NOT NULL UNIQUE,
    [password_hash] NVARCHAR(255) NOT NULL,
    [full_name] NVARCHAR(100) NOT NULL,
    [email] NVARCHAR(100) NULL,
    [phone] NVARCHAR(20) NULL,
    [avatar_url] NVARCHAR(255) NULL,
    [role] NVARCHAR(20) NOT NULL DEFAULT 'STAFF' CHECK ([role] IN ('MANAGER', 'STAFF')),
    [is_active] BIT NOT NULL DEFAULT 1,
    [last_login] DATETIME NULL,
    [created_at] DATETIME DEFAULT GETDATE(),
    [updated_at] DATETIME DEFAULT GETDATE()
);
GO

-- BẢNG 3: suppliers
CREATE TABLE [dbo].[suppliers] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [code] NVARCHAR(30) NOT NULL UNIQUE,
    [name] NVARCHAR(150) NOT NULL,
    [contact_name] NVARCHAR(100) NULL,
    [phone] NVARCHAR(20) NULL,
    [email] NVARCHAR(100) NULL,
    [address] NVARCHAR(255) NULL,
    [lead_time_days] INT NOT NULL DEFAULT 1,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE()
);
GO

-- BẢNG 4: categories
CREATE TABLE [dbo].[categories] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [code] NVARCHAR(30) NOT NULL UNIQUE,
    [name] NVARCHAR(100) NOT NULL,
    [description] NVARCHAR(255) NULL,
    [default_warning_days] INT NOT NULL DEFAULT 7,
    [created_at] DATETIME DEFAULT GETDATE()
);
GO

-- BẢNG 5: products
CREATE TABLE [dbo].[products] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [sku] NVARCHAR(50) NOT NULL UNIQUE,
    [name] NVARCHAR(150) NOT NULL,
    [category_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[categories]([id]),
    [default_supplier_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[suppliers]([id]),
    [unit] NVARCHAR(20) NOT NULL,
    [cost_price] DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    [selling_price] DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    [standard_shelf_life_days] INT NOT NULL,
    [min_stock_level] INT NOT NULL DEFAULT 15,
    [max_stock_level] INT NOT NULL DEFAULT 150,
    [custom_warning_days] INT NULL,
    [image_url] NVARCHAR(255) NULL,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE(),
    [updated_at] DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX [idx_products_sku] ON [dbo].[products] ([sku]);
GO

-- BẢNG 6: goods_receipts
CREATE TABLE [dbo].[goods_receipts] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [receipt_number] NVARCHAR(50) NOT NULL UNIQUE,
    [supplier_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[suppliers]([id]),
    [received_by] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [receipt_date] DATE NOT NULL,
    [total_cost] DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    [status] NVARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK ([status] IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    [notes] NVARCHAR(255) NULL,
    [created_at] DATETIME DEFAULT GETDATE()
);
GO

-- BẢNG 7: batches
CREATE TABLE [dbo].[batches] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [receipt_id] INT NULL FOREIGN KEY REFERENCES [dbo].[goods_receipts]([id]),
    [batch_code] NVARCHAR(50) NOT NULL UNIQUE,
    [product_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[products]([id]),
    [import_date] DATE NOT NULL,
    [manufacture_date] DATE NOT NULL,
    [expiry_date] DATE NOT NULL,
    [initial_quantity] INT NOT NULL,
    [current_quantity] INT NOT NULL DEFAULT 0,
    [import_price] DECIMAL(12, 2) NOT NULL,
    [discount_percent] INT NOT NULL DEFAULT 0 CHECK ([discount_percent] BETWEEN 0 AND 100),
    [status] NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK ([status] IN ('ACTIVE', 'WARNING', 'EXPIRED', 'DISPOSED')),
    [created_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [chk_batch_quantity] CHECK ([current_quantity] >= 0 AND [current_quantity] <= [initial_quantity]),
    CONSTRAINT [chk_batch_dates] CHECK ([expiry_date] > [manufacture_date])
);
GO

CREATE INDEX [idx_batches_fefo] ON [dbo].[batches] ([product_id], [status], [expiry_date]);
CREATE INDEX [idx_batches_expiry] ON [dbo].[batches] ([expiry_date], [status]);
GO

-- BẢNG 8: sales_history
CREATE TABLE [dbo].[sales_history] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [transaction_code] NVARCHAR(50) NOT NULL,
    [product_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[products]([id]),
    [batch_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[batches]([id]),
    [quantity_sold] INT NOT NULL CHECK ([quantity_sold] > 0),
    [sale_price] DECIMAL(12, 2) NOT NULL,
    [total_amount] DECIMAL(12, 2) NOT NULL,
    [sale_date] DATE NOT NULL,
    [day_of_week] NVARCHAR(10) NOT NULL,
    [weather] NVARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK ([weather] IN ('SUNNY', 'RAINY', 'NORMAL')),
    [is_holiday] BIT NOT NULL DEFAULT 0,
    [created_at] DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX [idx_sales_product_date] ON [dbo].[sales_history] ([product_id], [sale_date]);
GO

-- BẢNG 9: purchase_orders
CREATE TABLE [dbo].[purchase_orders] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [order_code] NVARCHAR(50) NOT NULL UNIQUE,
    [supplier_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[suppliers]([id]),
    [created_by] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [approved_by] INT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [status] NVARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK ([status] IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'DELIVERED', 'CANCELLED')),
    [total_estimated_cost] DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    [expected_delivery_date] DATE NULL,
    [notes] NVARCHAR(255) NULL,
    [created_at] DATETIME DEFAULT GETDATE(),
    [updated_at] DATETIME DEFAULT GETDATE()
);
GO

-- BẢNG 10: purchase_order_items
CREATE TABLE [dbo].[purchase_order_items] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [order_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[purchase_orders]([id]) ON DELETE CASCADE,
    [product_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[products]([id]),
    [current_stock_at_order] INT NOT NULL,
    [suggested_quantity] INT NOT NULL,
    [approved_quantity] INT NOT NULL,
    [unit_cost] DECIMAL(12, 2) NOT NULL,
    [total_line_cost] DECIMAL(14, 2) NOT NULL
);
GO

-- BẢNG 11: spoilage_records
CREATE TABLE [dbo].[spoilage_records] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [record_code] NVARCHAR(50) NOT NULL UNIQUE,
    [batch_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[batches]([id]),
    [disposed_date] DATE NOT NULL,
    [quantity_disposed] INT NOT NULL CHECK ([quantity_disposed] > 0),
    [cost_loss] DECIMAL(12, 2) NOT NULL,
    [reason] NVARCHAR(20) NOT NULL DEFAULT 'EXPIRED' CHECK ([reason] IN ('EXPIRED', 'DAMAGED', 'SPOILED')),
    [notes] NVARCHAR(255) NULL,
    [performed_by] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [created_at] DATETIME DEFAULT GETDATE()
);
GO

-- BẢNG 12: system_audit_logs
CREATE TABLE [dbo].[system_audit_logs] (
    [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [action_type] NVARCHAR(50) NOT NULL,
    [description] NVARCHAR(MAX) NOT NULL,
    [ip_address] NVARCHAR(45) NULL,
    [created_at] DATETIME DEFAULT GETDATE()
);
GO

-- ==============================================================================
-- 3. CÁC VIEW THỐNG KÊ (VIEWS)
-- ==============================================================================

-- VIEW 1: v_spoilage_alerts
CREATE OR ALTER VIEW [dbo].[v_spoilage_alerts] AS
SELECT 
    b.id AS batch_id,
    b.batch_code,
    p.id AS product_id,
    p.sku,
    p.name AS product_name,
    p.image_url,
    c.name AS category_name,
    b.current_quantity,
    p.unit,
    p.selling_price,
    b.discount_percent,
    ROUND(p.selling_price * (1.0 - (b.discount_percent / 100.0)), 0) AS promotional_price,
    b.expiry_date,
    DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date) AS days_left,
    COALESCE(p.custom_warning_days, c.default_warning_days) AS warning_threshold,
    CASE 
        WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date) <= 0 THEN 'EXPIRED'
        WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date) <= 3 THEN 'CRITICAL'
        WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), b.expiry_date) <= COALESCE(p.custom_warning_days, c.default_warning_days) THEN 'WARNING'
        ELSE 'SAFE'
    END AS alert_level,
    (b.current_quantity * b.import_price) AS potential_loss_value
FROM [dbo].[batches] b
JOIN [dbo].[products] p ON b.product_id = p.id
JOIN [dbo].[categories] c ON p.category_id = c.id
WHERE b.current_quantity > 0 AND b.status != 'DISPOSED';
GO

-- VIEW 2: v_active_inventory
CREATE OR ALTER VIEW [dbo].[v_active_inventory] AS
SELECT 
    p.id AS product_id,
    p.sku,
    p.name AS product_name,
    p.image_url,
    c.name AS category_name,
    p.unit,
    p.cost_price,
    p.selling_price,
    p.min_stock_level,
    p.max_stock_level,
    COUNT(b.id) AS active_batches_count,
    COALESCE(SUM(b.current_quantity), 0) AS total_quantity_in_stock,
    (COALESCE(SUM(b.current_quantity), 0) * p.cost_price) AS total_inventory_value,
    MIN(b.expiry_date) AS earliest_expiry_date
FROM [dbo].[products] p
JOIN [dbo].[categories] c ON p.category_id = c.id
LEFT JOIN [dbo].[batches] b ON p.id = b.product_id AND b.current_quantity > 0 AND b.status != 'DISPOSED'
GROUP BY p.id, p.sku, p.name, p.image_url, c.name, p.unit, p.cost_price, p.selling_price, p.min_stock_level, p.max_stock_level;
GO

-- VIEW 3: v_reorder_recommendations
CREATE OR ALTER VIEW [dbo].[v_reorder_recommendations] AS
SELECT 
    inv.product_id,
    inv.sku,
    inv.product_name,
    inv.category_name,
    inv.total_quantity_in_stock,
    inv.min_stock_level,
    inv.max_stock_level,
    inv.unit,
    inv.cost_price,
    s.id AS supplier_id,
    s.name AS supplier_name,
    s.lead_time_days,
    CASE 
        WHEN inv.total_quantity_in_stock <= inv.min_stock_level THEN N'CẦN ĐẶT HÀNG'
        ELSE N'TỒN AN TOÀN'
    END AS reorder_status,
    CASE 
        WHEN (inv.max_stock_level - inv.total_quantity_in_stock) > 0 THEN (inv.max_stock_level - inv.total_quantity_in_stock)
        ELSE 0 
    END AS suggested_order_qty,
    (CASE 
        WHEN (inv.max_stock_level - inv.total_quantity_in_stock) > 0 THEN (inv.max_stock_level - inv.total_quantity_in_stock)
        ELSE 0 
     END * inv.cost_price) AS estimated_cost
FROM [dbo].[v_active_inventory] inv
JOIN [dbo].[products] p ON inv.product_id = p.id
JOIN [dbo].[suppliers] s ON p.default_supplier_id = s.id
WHERE inv.total_quantity_in_stock <= inv.min_stock_level;
GO

-- ==============================================================================
-- 4. NẠP DỮ LIỆU MẪU (SEED DATA)
-- ==============================================================================

INSERT INTO [dbo].[system_settings] ([setting_key], [setting_value], [description]) VALUES
('STORE_NAME', N'Cửa Hàng Tiện Lợi Lạc Hồng Mart', N'Tên cửa hàng bán lẻ'),
('STORE_HOTLINE', '0389571228', N'Số điện thoại hỗ trợ'),
('DEFAULT_LEAD_TIME_DAYS', '1', N'Thời gian giao hàng từ Kho tổng (ngày)'),
('EXPIRY_WARNING_BUFFER_PERCENT', '20', N'Tỷ lệ % cảnh báo đệm');

INSERT INTO [dbo].[users] ([username], [password_hash], [full_name], [email], [role]) VALUES
('admin', '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', N'Cửa Hàng Trưởng', 'manager@cuahang.vn', 'MANAGER'),
('dotandu', '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', N'Đỗ Tấn Du', 'tandudev@cuahang.vn', 'STAFF'),
('doanminhquan', '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', N'Đoàn Minh Quân', 'minhquandev@cuahang.vn', 'STAFF');

INSERT INTO [dbo].[suppliers] ([code], [name], [contact_name], [phone], [email], [lead_time_days]) VALUES
('DC-BIENHOA', N'Kho Trung Tâm Phân Phối DC Biên Hòa', N'Nguyễn Văn Kho', '0901234567', 'dc_bienhoa@retail.vn', 1),
('DC-THUDUC', N'Kho Vận Trung Tâm DC Thủ Đức Logistics', N'Trần Thị Vận', '0912345678', 'dc_thuduc@retail.vn', 2),
('VNM-DIRECT', N'Công Ty Cổ Phần Sữa Việt Nam (Vinamilk)', N'Phòng Cung Ứng', '0987654321', 'sales@vinamilk.com.vn', 1);

INSERT INTO [dbo].[categories] ([code], [name], [description], [default_warning_days]) VALUES
('DAIRY', N'Sữa & Chế phẩm từ sữa', N'Sữa tươi, sữa chua, phô mai hạn ngắn', 5),
('BAKERY', N'Bánh mì & Đồ ăn nhanh', N'Bánh sandwich, bánh mì tươi ăn liền', 2),
('BEVERAGE', N'Nước giải khát', N'Nước ngọt có ga, nước suối, trà đóng chai', 15),
('DRY_FOOD', N'Thực phẩm khô đóng gói', N'Mì ăn liền, đồ hộp, gia vị', 30),
('PROCESSED_MEAT', N'Thực phẩm chế biến sẵn', N'Xúc xích tiệt trùng, giò chả', 7);

INSERT INTO [dbo].[products] ([sku], [name], [category_id], [default_supplier_id], [unit], [cost_price], [selling_price], [standard_shelf_life_days], [min_stock_level], [max_stock_level], [custom_warning_days]) VALUES
('8934567890101', N'Sữa tươi tiệt trùng Vinamilk 100% Không đường 1L', 1, 3, N'Hộp', 28000, 36000, 180, 20, 100, 7),
('8934567890102', N'Sữa tươi tiệt trùng Vinamilk 100% Có đường 1L', 1, 3, N'Hộp', 28000, 36000, 180, 25, 120, 7),
('8934567890103', N'Sữa chua ăn Vinamilk Nha Đam 100g', 1, 3, N'Hộp', 6000, 8500, 45, 30, 150, 4),
('8934567890104', N'Sữa chua uống men sống Probi 130ml', 1, 3, N'Chai', 7500, 10000, 50, 20, 100, 5),
('8934567890201', N'Bánh mì Sandwich tươi Kinh Đô 250g', 2, 1, N'Gói', 15000, 22000, 7, 15, 50, 2),
('8934567890301', N'Nước ngọt Coca-Cola Sleek lon 320ml', 3, 1, N'Lon', 8000, 11000, 365, 50, 200, 15),
('8934567890401', N'Mì Hảo Hảo Tôm chua cay 75g', 4, 1, N'Gói', 3500, 5000, 180, 80, 400, 20);

INSERT INTO [dbo].[goods_receipts] ([receipt_number], [supplier_id], [received_by], [receipt_date], [total_cost], [notes]) VALUES
('PN-20260901-001', 3, 2, DATEADD(day, -10, CAST(GETDATE() AS DATE)), 12400000, N'Đợt hàng từ nhà máy Vinamilk'),
('PN-20260902-001', 1, 3, DATEADD(day, -1, CAST(GETDATE() AS DATE)), 4200000, N'Đợt hàng bánh mì và đồ khô');

INSERT INTO [dbo].[batches] ([receipt_id], [batch_code], [product_id], [import_date], [manufacture_date], [expiry_date], [initial_quantity], [current_quantity], [import_price], [discount_percent], [status]) VALUES
-- Lô 1: BÁO ĐỎ (Còn 2 ngày -> Giảm 30% xả hàng)
(1, 'LOT-VNM-KDG-01', 1, DATEADD(day, -178, CAST(GETDATE() AS DATE)), DATEADD(day, -178, CAST(GETDATE() AS DATE)), DATEADD(day, 2, CAST(GETDATE() AS DATE)), 50, 16, 28000, 30, 'WARNING'),
-- Lô 2: AN TOÀN (Còn 60 ngày)
(1, 'LOT-VNM-KDG-02', 1, DATEADD(day, -10, CAST(GETDATE() AS DATE)), DATEADD(day, -10, CAST(GETDATE() AS DATE)), DATEADD(day, 60, CAST(GETDATE() AS DATE)), 80, 75, 28000, 0, 'ACTIVE'),
-- Lô 3: BÁO VÀNG (Còn 6 ngày -> Giảm 15%)
(1, 'LOT-VNM-CDG-01', 2, DATEADD(day, -174, CAST(GETDATE() AS DATE)), DATEADD(day, -174, CAST(GETDATE() AS DATE)), DATEADD(day, 6, CAST(GETDATE() AS DATE)), 60, 22, 28000, 15, 'WARNING'),
-- Lô 4: BÁO ĐỎ (Còn 3 ngày -> Giảm 40%)
(1, 'LOT-SC-ND-01', 3, DATEADD(day, -42, CAST(GETDATE() AS DATE)), DATEADD(day, -42, CAST(GETDATE() AS DATE)), DATEADD(day, 3, CAST(GETDATE() AS DATE)), 100, 28, 6000, 40, 'WARNING'),
-- Lô 5: ĐÃ HẾT HẠN HÔM QUA (Khóa bán)
(2, 'LOT-BM-SW-999', 5, DATEADD(day, -8, CAST(GETDATE() AS DATE)), DATEADD(day, -8, CAST(GETDATE() AS DATE)), DATEADD(day, -1, CAST(GETDATE() AS DATE)), 40, 7, 15000, 0, 'EXPIRED'),
-- Lô 6: MỚI NHẬP (Còn 6 ngày)
(2, 'LOT-BM-SW-101', 5, DATEADD(day, -1, CAST(GETDATE() AS DATE)), DATEADD(day, -1, CAST(GETDATE() AS DATE)), DATEADD(day, 6, CAST(GETDATE() AS DATE)), 50, 48, 15000, 0, 'ACTIVE'),
-- Lô 7: THIẾU HÀNG (Tồn 25 < min 80)
(2, 'LOT-HH-TOM-01', 7, DATEADD(day, -60, CAST(GETDATE() AS DATE)), DATEADD(day, -60, CAST(GETDATE() AS DATE)), DATEADD(day, 120, CAST(GETDATE() AS DATE)), 300, 25, 3500, 0, 'ACTIVE');

INSERT INTO [dbo].[sales_history] ([transaction_code], [product_id], [batch_id], [quantity_sold], [sale_price], [total_amount], [sale_date], [day_of_week], [weather], [is_holiday]) VALUES
('HD-260901-01', 1, 1, 8, 25200, 201600, DATEADD(day, -10, CAST(GETDATE() AS DATE)), 'MON', 'SUNNY', 0),
('HD-260903-01', 7, 7, 80, 5000, 400000, DATEADD(day, -8, CAST(GETDATE() AS DATE)), 'WED', 'RAINY', 0),
('HD-260905-01', 1, 1, 15, 25200, 378000, DATEADD(day, -5, CAST(GETDATE() AS DATE)), 'SAT', 'SUNNY', 1);

INSERT INTO [dbo].[spoilage_records] ([record_code], [batch_id], [disposed_date], [quantity_disposed], [cost_loss], [reason], [notes], [performed_by]) VALUES
('BBH-202609-001', 5, CAST(GETDATE() AS DATE), 7, 105000, 'EXPIRED', N'Bánh mì sandwich quá hạn 1 ngày, tiêu hủy', 2);
GO

PRINT '====================================================================';
PRINT 'DA KHOI TAO THANH CONG CSDL RETAIL_SPOILAGE_DB TRONG SQL SERVER!';
PRINT '====================================================================';
GO
