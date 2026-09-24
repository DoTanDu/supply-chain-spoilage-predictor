-- ==============================================================================
-- BỔ SUNG DANH MỤC & SẢN PHẨM PHONG PHÚ CHO SIÊU THỊ BÁN LẺ
-- ==============================================================================
USE [retail_spoilage_db];
GO

-- 1. Bổ sung các Danh mục mới nếu chưa có
IF NOT EXISTS (SELECT 1 FROM categories WHERE code = 'MEAT_POULTRY')
BEGIN
    INSERT INTO categories (code, name, description, default_warning_days)
    VALUES ('MEAT_POULTRY', N'Thịt tươi & Thủy hải sản mát', N'Thịt heo, gà, trứng hạn 3-5 ngày', 2);
END

IF NOT EXISTS (SELECT 1 FROM categories WHERE code = 'FRESH_PRODUCE')
BEGIN
    INSERT INTO categories (code, name, description, default_warning_days)
    VALUES ('FRESH_PRODUCE', N'Rau củ & Trái cây sạch', N'Rau củ hữu cơ, trái cây tươi', 2);
END
GO

-- 2. Bổ sung các Sản phẩm bán lẻ tiêu chuẩn
-- Lấy ID của danh mục
DECLARE @catDairy INT = (SELECT id FROM categories WHERE code = 'DAIRY');
DECLARE @catBakery INT = (SELECT id FROM categories WHERE code = 'BAKERY');
DECLARE @catBeverage INT = (SELECT id FROM categories WHERE code = 'BEVERAGE');
DECLARE @catDryFood INT = (SELECT id FROM categories WHERE code = 'DRY_FOOD');
DECLARE @catMeat INT = (SELECT id FROM categories WHERE code = 'PROCESSED_MEAT');
DECLARE @catFreshMeat INT = (SELECT id FROM categories WHERE code = 'MEAT_POULTRY');
DECLARE @catProduce INT = (SELECT id FROM categories WHERE code = 'FRESH_PRODUCE');

-- Sữa TH True Milk
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890105')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890105', N'Sữa tươi tiệt trùng TH True MILK Nguyên chất 1L', @catDairy, 1, N'Hộp', 29000, 37500, 180, 20, 100, 7);

-- Phô mai Con Bò Cười
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890106')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890106', N'Phô mai Con Bò Cười truyền thống 8 miếng 112g', @catDairy, 1, N'Hộp', 31000, 42000, 210, 15, 60, 10);

-- Bánh bao Thọ Phát
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890202')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890202', N'Bánh bao nhân thịt trứng cút Thọ Phát 120g', @catBakery, 1, N'Cái', 11000, 16000, 5, 20, 80, 2);

-- Bánh mì hoa cúc Kinh Đô
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890203')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890203', N'Bánh mì bơ sữa hoa cúc Kinh Đô 180g', @catBakery, 1, N'Gói', 18000, 26000, 10, 15, 60, 3);

-- Cơm nắm Onigiri
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890204')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890204', N'Cơm nắm Onigiri cá hồi sốt Mayo 110g', @catBakery, 1, N'Cái', 12000, 18000, 2, 25, 100, 1);

-- Red Bull
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890302')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890302', N'Nước tăng lực Red Bull lon vàng 250ml', @catBeverage, 1, N'Lon', 9500, 14000, 365, 40, 200, 15);

-- Trà xanh Không Độ
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890303')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890303', N'Trà xanh Không Độ vị chanh chai 455ml', @catBeverage, 1, N'Chai', 7500, 11000, 365, 30, 150, 15);

-- Nước suối La Vie
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890304')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890304', N'Nước khoáng thiên nhiên La Vie 500ml', @catBeverage, 1, N'Chai', 4200, 6500, 730, 50, 250, 20);

-- Sữa chua uống Yomost
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890305')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890305', N'Sữa chua uống tiệt trùng Yomost vị Cam 170ml', @catBeverage, 1, N'Hộp', 6200, 9000, 180, 30, 120, 10);

-- Thịt ức gà CP Fresh
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890501')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890501', N'Thịt ức gà tươi phi lê CP Fresh 500g', @catFreshMeat, 1, N'Khay', 34000, 45000, 5, 12, 40, 2);

-- Thịt ba rọi heo MeatDeli
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890502')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890502', N'Thịt ba rọi heo MeatDeli chuẩn sạch 400g', @catFreshMeat, 1, N'Khay', 62000, 79000, 4, 10, 35, 1);

-- Trứng gà Ba Huân
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890503')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890503', N'Trứng gà tươi tiệt trùng Ba Huân hộp 10 quả', @catFreshMeat, 1, N'Hộp', 24000, 31000, 30, 20, 80, 5);

-- Xà lách thủy canh Đà Lạt
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890601')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890601', N'Xà lách mỡ thủy canh sạch Đà Lạt 300g', @catProduce, 1, N'Túi', 14000, 21000, 4, 15, 45, 1);

-- Cà chua bi Farm Fresh
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890602')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890602', N'Cà chua bi ngọt Farm Fresh hộp 500g', @catProduce, 1, N'Hộp', 18000, 27000, 6, 12, 40, 2);

-- Xúc xích tiệt trùng Vissan
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890701')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890701', N'Xúc xích tiệt trùng Vissan Bò Tiêu gói 175g', @catMeat, 1, N'Gói', 18000, 24000, 90, 25, 100, 10);

-- Cá hộp Ba Cô Gái
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890402')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890402', N'Cá nục sốt cà chua Ba Cô Gái lon 155g', @catDryFood, 1, N'Lon', 14000, 19000, 730, 30, 150, 30);
GO

-- 3. Tạo các lô hàng mẫu (Batches) cho các sản phẩm mới
DECLARE @pThTrue INT = (SELECT id FROM products WHERE sku = '8934567890105');
DECLARE @pPhoMai INT = (SELECT id FROM products WHERE sku = '8934567890106');
DECLARE @pBanhBao INT = (SELECT id FROM products WHERE sku = '8934567890202');
DECLARE @pOnigiri INT = (SELECT id FROM products WHERE sku = '8934567890204');
DECLARE @pRedBull INT = (SELECT id FROM products WHERE sku = '8934567890302');
DECLARE @pGa INT = (SELECT id FROM products WHERE sku = '8934567890501');
DECLARE @pHeo INT = (SELECT id FROM products WHERE sku = '8934567890502');
DECLARE @pTrung INT = (SELECT id FROM products WHERE sku = '8934567890503');
DECLARE @pXaLach INT = (SELECT id FROM products WHERE sku = '8934567890601');
DECLARE @pCaChua INT = (SELECT id FROM products WHERE sku = '8934567890602');
DECLARE @pXucXich INT = (SELECT id FROM products WHERE sku = '8934567890701');

IF @pThTrue IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-TH-101')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-TH-101', @pThTrue, CAST(GETDATE() AS DATE), CAST(GETDATE() AS DATE), DATEADD(day, 175, CAST(GETDATE() AS DATE)), 60, 58, 29000, 0, 'ACTIVE');

IF @pBanhBao IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-TP-201')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-TP-201', @pBanhBao, DATEADD(day, -2, CAST(GETDATE() AS DATE)), DATEADD(day, -2, CAST(GETDATE() AS DATE)), DATEADD(day, 3, CAST(GETDATE() AS DATE)), 30, 22, 11000, 0, 'ACTIVE');

IF @pOnigiri IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-ONI-01')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-ONI-01', @pOnigiri, CAST(GETDATE() AS DATE), CAST(GETDATE() AS DATE), DATEADD(day, 2, CAST(GETDATE() AS DATE)), 20, 15, 12000, 0, 'ACTIVE');

IF @pRedBull IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-RB-301')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-RB-301', @pRedBull, DATEADD(day, -15, CAST(GETDATE() AS DATE)), DATEADD(day, -15, CAST(GETDATE() AS DATE)), DATEADD(day, 350, CAST(GETDATE() AS DATE)), 120, 110, 9500, 0, 'ACTIVE');

IF @pGa IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-GA-CP-01')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-GA-CP-01', @pGa, DATEADD(day, -2, CAST(GETDATE() AS DATE)), DATEADD(day, -2, CAST(GETDATE() AS DATE)), DATEADD(day, 3, CAST(GETDATE() AS DATE)), 25, 18, 34000, 0, 'ACTIVE');

IF @pHeo IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-HEO-MD-01')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-HEO-MD-01', @pHeo, DATEADD(day, -1, CAST(GETDATE() AS DATE)), DATEADD(day, -1, CAST(GETDATE() AS DATE)), DATEADD(day, 3, CAST(GETDATE() AS DATE)), 20, 14, 62000, 0, 'ACTIVE');

IF @pTrung IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-TRUNG-BH-01')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-TRUNG-BH-01', @pTrung, DATEADD(day, -5, CAST(GETDATE() AS DATE)), DATEADD(day, -5, CAST(GETDATE() AS DATE)), DATEADD(day, 25, CAST(GETDATE() AS DATE)), 40, 36, 24000, 0, 'ACTIVE');

IF @pXaLach IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-XALACH-DL-01')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-XALACH-DL-01', @pXaLach, CAST(GETDATE() AS DATE), CAST(GETDATE() AS DATE), DATEADD(day, 4, CAST(GETDATE() AS DATE)), 25, 25, 14000, 0, 'ACTIVE');

IF @pCaChua IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-CACHUA-FF-01')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-CACHUA-FF-01', @pCaChua, DATEADD(day, -1, CAST(GETDATE() AS DATE)), DATEADD(day, -1, CAST(GETDATE() AS DATE)), DATEADD(day, 5, CAST(GETDATE() AS DATE)), 30, 26, 18000, 0, 'ACTIVE');

IF @pXucXich IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-XX-VIS-01')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-XX-VIS-01', @pXucXich, DATEADD(day, -10, CAST(GETDATE() AS DATE)), DATEADD(day, -10, CAST(GETDATE() AS DATE)), DATEADD(day, 80, CAST(GETDATE() AS DATE)), 50, 45, 18000, 0, 'ACTIVE');
GO
