-- ==============================================================================
-- BỔ SUNG 40 SẢN PHẨM & 60+ LÔ HÀNG BÁN LẺ THỰC TẾ ĐA DẠNG
-- CSDL: Microsoft SQL Server LocalDB [retail_spoilage_db]
-- ==============================================================================
USE [retail_spoilage_db];
GO

-- Lấy ID các danh mục
DECLARE @catDairy INT = (SELECT id FROM categories WHERE code = 'DAIRY');
DECLARE @catBakery INT = (SELECT id FROM categories WHERE code = 'BAKERY');
DECLARE @catBeverage INT = (SELECT id FROM categories WHERE code = 'BEVERAGE');
DECLARE @catDryFood INT = (SELECT id FROM categories WHERE code = 'DRY_FOOD');
DECLARE @catProcessedMeat INT = (SELECT id FROM categories WHERE code = 'PROCESSED_MEAT');
DECLARE @catMeat INT = (SELECT id FROM categories WHERE code = 'MEAT_POULTRY');
DECLARE @catProduce INT = (SELECT id FROM categories WHERE code = 'FRESH_PRODUCE');

-- ==============================================================================
-- 1. BỔ SUNG CÁC SẢN PHẨM MỚI VÀO BẢNG PRODUCTS
-- ==============================================================================

-- 1.1 Thêm nhóm Sữa & Chế phẩm từ sữa
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890107')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890107', N'Sữa đặc có đường Ông Thọ đỏ lon 380g', @catDairy, 1, N'Lon', 21000, 27500, 365, 20, 100, 15);

IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890108')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890108', N'Sữa chua uống tiệt trùng Betagen tự nhiên 400ml', @catDairy, 1, N'Chai', 17000, 23500, 45, 15, 60, 5);

IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890109')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890109', N'Kem ốc quế Merino socola đậu phộng 65g', @catDairy, 1, N'Cây', 11000, 16000, 180, 25, 80, 10);

IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890110')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890110', N'Sữa hạt óc chó Vinamilk Super Nut lốc 4 hộp 180ml', @catDairy, 1, N'Lốc', 32000, 41000, 180, 15, 70, 10);

-- 1.2 Thêm nhóm Bánh mì & Đồ ăn nhanh
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890205')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890205', N'Bánh mì tươi chà bông gà cay Orion C''est Bon 105g', @catBakery, 1, N'Gói', 17500, 24000, 15, 20, 80, 3);

IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890206')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890206', N'Bánh sandwich kẹp thịt nguội pate tươi LHU Mart', @catBakery, 1, N'Cái', 15000, 22000, 2, 25, 75, 1);

IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890207')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890207', N'Bánh su kem tươi Vanilla hộp 4 cái 120g', @catBakery, 1, N'Hộp', 18000, 26000, 3, 15, 50, 1);

IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890208')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890208', N'Bánh giò nóng thịt mộc nhĩ truyền thống 150g', @catBakery, 1, N'Cái', 10000, 15000, 3, 20, 60, 1);

-- 1.3 Thêm nhóm Nước giải khát
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890306')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890306', N'Cà phê sữa đá Highlands Coffee lon 185ml', @catBeverage, 1, N'Lon', 12500, 17500, 365, 30, 120, 15);

IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890307')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890307', N'Trà đào hạt chia C2 thanh mát chai 455ml', @catBeverage, 1, N'Chai', 7500, 11500, 365, 25, 100, 15);

IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890308')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890308', N'Bia Heineken Sleek lon cao 330ml', @catBeverage, 1, N'Lon', 17000, 22500, 365, 40, 180, 20);

IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890309')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890309', N'Nước bù khoáng thể thao Pocari Sweat chai 500ml', @catBeverage, 1, N'Chai', 10500, 15000, 365, 20, 80, 15);

-- 1.4 Thêm nhóm Thực phẩm khô đóng gói
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890403')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890403', N'Mì Omachi xốt bò hầm gói 80g', @catDryFood, 1, N'Gói', 6800, 9500, 180, 40, 200, 15);

IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890404')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890404', N'Tương ớt Chinsu cay nồng chai 250g', @catDryFood, 1, N'Chai', 11000, 15000, 365, 20, 80, 20);

IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890405')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890405', N'Bánh ChocoPie Orion hộp 12 cái 396g', @catDryFood, 1, N'Hộp', 42000, 56000, 365, 15, 60, 20);

IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890406')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890406', N'Hạt điều rang muối Bình Phước hộp 200g', @catDryFood, 1, N'Hộp', 48000, 65000, 180, 10, 40, 15);

-- 1.5 Thêm nhóm Thực phẩm chế biến sẵn
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890702')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890702', N'Xúc xích xông khói CP Vealz gói 500g', @catProcessedMeat, 1, N'Gói', 42000, 56000, 60, 15, 60, 7);

IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890703')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890703', N'Chả lụa heo sạch CP gói 250g', @catProcessedMeat, 1, N'Cây', 28000, 38000, 30, 12, 50, 4);

-- 1.6 Thêm nhóm Rau củ & Trái cây sạch
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890603')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890603', N'Chuối già Nam Mỹ sạch nải 1kg', @catProduce, 1, N'Nải', 21000, 30000, 5, 15, 45, 1);

IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890604')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890604', N'Táo Envy New Zealand khay 3 quả 600g', @catProduce, 1, N'Khay', 65000, 85000, 14, 10, 35, 2);

-- 1.7 Thêm nhóm Thịt cá tươi
IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '8934567890504')
INSERT INTO products (sku, name, category_id, default_supplier_id, unit, cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days)
VALUES ('8934567890504', N'Cá hồi phi lê tươi Nauy khay 200g', @catMeat, 1, N'Khay', 75000, 99000, 3, 8, 25, 1);

GO

-- ==============================================================================
-- 2. CẤP PHÁT CÁC LÔ HÀNG THỰC TẾ (BATCHES) CHO CÁC SẢN PHẨM MỚI VÀ SẢN PHẨM CŨ
-- ==============================================================================

-- Bổ sung lô hàng cho các mặt hàng vừa tạo
DECLARE @today DATE = '2026-09-24';

-- 1. Mì Hảo Hảo (cũ bị hết hàng, nay cấp 2 lô mới)
DECLARE @pHaoHao INT = (SELECT id FROM products WHERE sku = '8934567890401');
IF @pHaoHao IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-HH-401')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-HH-401', @pHaoHao, @today, @today, DATEADD(day, 150, @today), 100, 95, 3800, 0, 'ACTIVE');

-- 2. Phô mai Con Bò Cười
DECLARE @pPhoMai INT = (SELECT id FROM products WHERE sku = '8934567890106');
IF @pPhoMai IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-PM-101')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-PM-101', @pPhoMai, DATEADD(day, -10, @today), DATEADD(day, -10, @today), DATEADD(day, 120, @today), 40, 38, 31000, 0, 'ACTIVE');

-- 3. Bánh mì hoa cúc
DECLARE @pHoaCuc INT = (SELECT id FROM products WHERE sku = '8934567890203');
IF @pHoaCuc IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-HC-201')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-HC-201', @pHoaCuc, DATEADD(day, -1, @today), DATEADD(day, -1, @today), DATEADD(day, 6, @today), 30, 24, 18000, 0, 'ACTIVE');

-- 4. Trà xanh Không Độ
DECLARE @pTraXanh INT = (SELECT id FROM products WHERE sku = '8934567890303');
IF @pTraXanh IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-TX-301')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-TX-301', @pTraXanh, @today, @today, DATEADD(day, 300, @today), 60, 56, 7500, 0, 'ACTIVE');

-- 5. Nước khoáng La Vie
DECLARE @pLavie INT = (SELECT id FROM products WHERE sku = '8934567890304');
IF @pLavie IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-LV-301')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-LV-301', @pLavie, @today, @today, DATEADD(day, 600, @today), 80, 80, 4200, 0, 'ACTIVE');

-- 6. Yomost Cam
DECLARE @pYomost INT = (SELECT id FROM products WHERE sku = '8934567890305');
IF @pYomost IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-YM-301')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-YM-301', @pYomost, DATEADD(day, -5, @today), DATEADD(day, -5, @today), DATEADD(day, 120, @today), 48, 44, 6200, 0, 'ACTIVE');

-- 7. Cá hộp Ba Cô Gái
DECLARE @pCaHop INT = (SELECT id FROM products WHERE sku = '8934567890402');
IF @pCaHop IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-CH-401')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-CH-401', @pCaHop, @today, @today, DATEADD(day, 650, @today), 50, 48, 14000, 0, 'ACTIVE');

-- 8. Trà Ô Long TEA+
DECLARE @pTeaPlus INT = (SELECT id FROM products WHERE sku = '8935001234567');
IF @pTeaPlus IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-TP-301')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-TP-301', @pTeaPlus, @today, @today, DATEADD(day, 320, @today), 48, 48, 8500, 0, 'ACTIVE');

-- 9. Sữa đặc Ông Thọ
DECLARE @pOngTho INT = (SELECT id FROM products WHERE sku = '8934567890107');
IF @pOngTho IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-OT-101')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-OT-101', @pOngTho, @today, @today, DATEADD(day, 330, @today), 40, 36, 21000, 0, 'ACTIVE');

-- 10. Betagen
DECLARE @pBetagen INT = (SELECT id FROM products WHERE sku = '8934567890108');
IF @pBetagen IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-BG-101')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-BG-101', @pBetagen, DATEADD(day, -3, @today), DATEADD(day, -3, @today), DATEADD(day, 35, @today), 30, 27, 17000, 0, 'ACTIVE');

-- 11. Kem Merino
DECLARE @pMerino INT = (SELECT id FROM products WHERE sku = '8934567890109');
IF @pMerino IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-MR-101')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-MR-101', @pMerino, @today, @today, DATEADD(day, 160, @today), 50, 46, 11000, 0, 'ACTIVE');

-- 12. Sữa hạt Super Nut
DECLARE @pSuperNut INT = (SELECT id FROM products WHERE sku = '8934567890110');
IF @pSuperNut IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-SN-101')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-SN-101', @pSuperNut, @today, @today, DATEADD(day, 150, @today), 35, 32, 32000, 0, 'ACTIVE');

-- 13. C'est Bon
DECLARE @pCestBon INT = (SELECT id FROM products WHERE sku = '8934567890205');
IF @pCestBon IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-CB-201')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-CB-201', @pCestBon, DATEADD(day, -1, @today), DATEADD(day, -1, @today), DATEADD(day, 10, @today), 40, 36, 17500, 0, 'ACTIVE');

-- 14. Sandwich tươi LHU Mart (CẬN DATE: còn 2 ngày -> VÀNG / ĐỎ)
DECLARE @pSandwichLHU INT = (SELECT id FROM products WHERE sku = '8934567890206');
IF @pSandwichLHU IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-SW-LHU-01')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-SW-LHU-01', @pSandwichLHU, @today, @today, DATEADD(day, 2, @today), 25, 20, 15000, 0, 'ACTIVE');

-- 15. Su kem tươi (CẬN DATE KHẨN CẤP: còn 1 ngày -> ĐỎ)
DECLARE @pSuKem INT = (SELECT id FROM products WHERE sku = '8934567890207');
IF @pSuKem IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-SUKEM-01')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-SUKEM-01', @pSuKem, DATEADD(day, -1, @today), DATEADD(day, -1, @today), DATEADD(day, 1, @today), 20, 12, 18000, 0, 'ACTIVE');

-- 16. Bánh giò nóng
DECLARE @pBanhGio INT = (SELECT id FROM products WHERE sku = '8934567890208');
IF @pBanhGio IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-BG-201')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-BG-201', @pBanhGio, @today, @today, DATEADD(day, 2, @today), 30, 25, 10000, 0, 'ACTIVE');

-- 17. Highlands Coffee
DECLARE @pHighlands INT = (SELECT id FROM products WHERE sku = '8934567890306');
IF @pHighlands IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-HL-301')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-HL-301', @pHighlands, @today, @today, DATEADD(day, 300, @today), 50, 48, 12500, 0, 'ACTIVE');

-- 18. Trà đào C2
DECLARE @pTraDao INT = (SELECT id FROM products WHERE sku = '8934567890307');
IF @pTraDao IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-C2-301')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-C2-301', @pTraDao, @today, @today, DATEADD(day, 310, @today), 45, 42, 7500, 0, 'ACTIVE');

-- 19. Heineken Sleek
DECLARE @pKen INT = (SELECT id FROM products WHERE sku = '8934567890308');
IF @pKen IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-KEN-301')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-KEN-301', @pKen, @today, @today, DATEADD(day, 300, @today), 72, 68, 17000, 0, 'ACTIVE');

-- 20. Pocari Sweat
DECLARE @pPocari INT = (SELECT id FROM products WHERE sku = '8934567890309');
IF @pPocari IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-PS-301')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-PS-301', @pPocari, @today, @today, DATEADD(day, 280, @today), 40, 36, 10500, 0, 'ACTIVE');

-- 21. Omachi bò hầm
DECLARE @pOmachi INT = (SELECT id FROM products WHERE sku = '8934567890403');
IF @pOmachi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-OM-401')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-OM-401', @pOmachi, @today, @today, DATEADD(day, 160, @today), 80, 75, 6800, 0, 'ACTIVE');

-- 22. Tương ớt Chinsu
DECLARE @pChinsu INT = (SELECT id FROM products WHERE sku = '8934567890404');
IF @pChinsu IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-CS-401')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-CS-401', @pChinsu, @today, @today, DATEADD(day, 300, @today), 35, 32, 11000, 0, 'ACTIVE');

-- 23. ChocoPie Orion
DECLARE @pChocopie INT = (SELECT id FROM products WHERE sku = '8934567890405');
IF @pChocopie IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-CP-401')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-CP-401', @pChocopie, @today, @today, DATEADD(day, 280, @today), 30, 28, 42000, 0, 'ACTIVE');

-- 24. Hạt điều rang muối
DECLARE @pHatDieu INT = (SELECT id FROM products WHERE sku = '8934567890406');
IF @pHatDieu IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-HD-401')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-HD-401', @pHatDieu, @today, @today, DATEADD(day, 150, @today), 25, 22, 48000, 0, 'ACTIVE');

-- 25. Xúc xích CP Vealz
DECLARE @pVealz INT = (SELECT id FROM products WHERE sku = '8934567890702');
IF @pVealz IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-VZ-701')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-VZ-701', @pVealz, DATEADD(day, -4, @today), DATEADD(day, -4, @today), DATEADD(day, 45, @today), 30, 26, 42000, 0, 'ACTIVE');

-- 26. Chả lụa CP
DECLARE @pChaLua INT = (SELECT id FROM products WHERE sku = '8934567890703');
IF @pChaLua IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-CL-701')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-CL-701', @pChaLua, DATEADD(day, -2, @today), DATEADD(day, -2, @today), DATEADD(day, 22, @today), 25, 22, 28000, 0, 'ACTIVE');

-- 27. Chuối già Nam Mỹ (CẬN DATE: còn 2 ngày -> ĐỎ)
DECLARE @pChuoi INT = (SELECT id FROM products WHERE sku = '8934567890603');
IF @pChuoi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-CHUOINM-01')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-CHUOINM-01', @pChuoi, DATEADD(day, -1, @today), DATEADD(day, -1, @today), DATEADD(day, 2, @today), 20, 15, 21000, 0, 'ACTIVE');

-- 28. Táo Envy
DECLARE @pTao INT = (SELECT id FROM products WHERE sku = '8934567890604');
IF @pTao IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-TAO-ENVY-01')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-TAO-ENVY-01', @pTao, @today, @today, DATEADD(day, 12, @today), 20, 18, 65000, 0, 'ACTIVE');

-- 29. Cá hồi phi lê tươi (CẬN DATE: còn 1 ngày -> ĐỎ)
DECLARE @pCaHoi INT = (SELECT id FROM products WHERE sku = '8934567890504');
IF @pCaHoi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = 'LOT-CAHOI-01')
INSERT INTO batches (receipt_id, batch_code, product_id, import_date, manufacture_date, expiry_date, initial_quantity, current_quantity, import_price, discount_percent, status)
VALUES (1, 'LOT-CAHOI-01', @pCaHoi, DATEADD(day, -1, @today), DATEADD(day, -1, @today), DATEADD(day, 1, @today), 15, 11, 75000, 0, 'ACTIVE');

GO

-- ==============================================================================
-- 3. TỰ ĐỘNG ĐỒNG BỘ TRẠNG THÁI LÔ HÀNG (STATUS) THEO RSL THỰC TẾ
-- ==============================================================================
UPDATE batches 
SET status = 'EXPIRED'
WHERE expiry_date < '2026-09-24' AND current_quantity > 0;

UPDATE batches 
SET status = 'ACTIVE'
WHERE expiry_date >= '2026-09-24' AND status != 'DISPOSED';
GO
