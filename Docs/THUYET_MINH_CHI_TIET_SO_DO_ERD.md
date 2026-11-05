# THUYẾT MINH CHI TIẾT SƠ ĐỒ THỰC THỂ QUAN HỆ CSDL (ERD - 15 BẢNG CHUẨN 3NF)
**Đề tài:** Hệ thống Quản lý Chuỗi Cung ứng Thực phẩm Thông minh Ứng dụng AI (SmartSupply AI / Supply Chain Spoilage Predictor)  
**Đơn vị:** Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU)  
**GVHD:** ThS. Lê Minh Nhật  
**Nhóm sinh viên thực hiện:** Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946)  
**Hệ quản trị CSDL:** Microsoft SQL Server LocalDB `(localdb)\mssqllocaldb` (Database: `retail_spoilage_db`)  
**Script chuẩn hóa 3NF:** [erd_3nf_smartsupply_migration.sql](file:///c:/thuyet%20minh/Database/erd_3nf_smartsupply_migration.sql)  

---

## I. NGUYÊN TẮC THIẾT KẾ CƠ SỞ DỮ LIỆU CHUẨN 3NF TRONG SQL SERVER

Tiếp thu ý kiến góp ý của **ThS. Lê Minh Nhật** tại [Biên bản góp ý đồ án](file:///c:/thuyet%20minh/Docs/bienban_gopy_doan_thayhuongdan.md), cơ sở dữ liệu `retail_spoilage_db` trong Microsoft SQL Server được chuẩn hóa nghiêm ngặt theo dạng chuẩn **3NF (Third Normal Form)**, đồng bộ 100% giữa Schema thực tế trong SQL Server Management Studio (SSMS), mã nguồn Backend Clean Architecture và sơ đồ ERD:

1. **Quy ước định danh đồng nhất (`snake_case` & `INT IDENTITY`):**
   * Toàn bộ **15 bảng thực thể** và các cột trong SQL Server tuân thủ chuẩn `snake_case`, sử dụng khóa chính `id INT IDENTITY(1,1) PRIMARY KEY` giúp tối ưu kích thước Clustered Index (4 bytes/bản ghi) và tăng tốc độ `JOIN` trên các bảng giao dịch lớn (`sales_history`, `batches`, `ai_forecasts`).
2. **Loại bỏ hoàn toàn phụ thuộc bắc cầu (Strict 3NF) & Bảng mồ côi:**
   * Đã loại bỏ cột dư thừa `users.role` (chỉ liên kết duy nhất qua khóa ngoại `users.role_id -> roles.id`).
   * Đã loại bỏ bảng cấu hình rời rạc `system_settings` (không có khóa ngoại).
   * Đã bổ sung khóa ngoại liên kết quy trình khép kín giữa Đơn đặt hàng và Phiếu nhập kho (`goods_receipts.purchase_order_id -> purchase_orders.id`).
   * Đã bổ sung khóa ngoại định danh chi nhánh `store_id -> store_profile.id` cho toàn bộ các bảng nghiệp vụ cửa hàng (`users`, `batches`, `sales_history`, `goods_receipts`, `purchase_orders`, `spoilage_records`, `ai_forecasts`, `stock_transfers`), hỗ trợ linh hoạt từ 1 cửa hàng đến chuỗi 3–30 cửa hàng.
3. **36 Ràng buộc Khóa ngoại (`FOREIGN KEY`) đặt tên chuẩn mực:**
   * Toàn bộ 36 liên kết giữa 15 bảng đều được định nghĩa bằng `CONSTRAINT FK_[BảngCon]_[BảngCha]` tường minh, hiển thị đầy đủ đường nối 1-N trong công cụ **SSMS Database Diagrams**.
4. **Bảo vệ toàn vẹn nghiệp vụ bằng ràng buộc `CHECK`:**
   * `CK_Batches_Quantity`: Ngăn chặn tuyệt đối âm kho (`current_quantity >= 0 AND current_quantity <= initial_quantity`).
   * `CK_Batches_Dates`: Kiểm soát niên hạn hợp lệ (`expiry_date > manufacture_date`).
   * `CK_Batches_Discount`: Giới hạn mức giảm giá xả hàng Quick Markdown (`discount_percent BETWEEN 0 AND 100`).
   * `CK_Sales_Quantity` & `CK_Spoilage_Quantity`: Số lượng xuất bán/tiêu hủy bắt buộc `> 0`.
   * `CK_StockTransfers_DifferentStores`: Chặn luân chuyển trùng cửa hàng (`from_store_id <> to_store_id`).

---

## II. HÌNH ẢNH SƠ ĐỒ ERD 15 BẢNG CHUẨN 3NF (LIGHT MODE - RÕ NÉT TRÊN MÁY CHIẾU)

Hình ảnh sơ đồ ERD nền sáng (Light Mode, đường nối vuông góc Orthogonal chuẩn SSMS) được lưu tại: [erd_database_3nf.png](file:///c:/thuyet%20minh/Docs/Diagram_Images/erd_database_3nf.png)

![Sơ đồ Thực thể Quan hệ CSDL 15 Bảng Chuẩn 3NF](file:///c:/thuyet%20minh/Docs/Diagram_Images/erd_database_3nf.png)

### Hướng dẫn mở sơ đồ trực tiếp trong SQL Server Management Studio (SSMS):
1. Mở **SSMS**, kết nối vào Server: `(localdb)\mssqllocaldb`.
2. Mở rộng nhánh **Databases** $\rightarrow$ `retail_spoilage_db` (đã kích hoạt sẵn `dbo.sysdiagrams`).
3. Nhấp chuột phải vào **Database Diagrams** $\rightarrow$ chọn **New Database Diagram**.
4. Chọn tất cả **15 bảng** $\rightarrow$ nhấn **Add** $\rightarrow$ nhấp chuột phải vào vùng trống chọn **Arrange Tables** để xem toàn bộ 15 bảng và 36 đường khóa ngoại trực quan.

---

## III. PHÂN TÍCH CHI TIẾT 4 PHÂN HỆ VÀ 15 BẢNG DỮ LIỆU

Sơ đồ được tổ chức thành 4 phân hệ chức năng theo kiến trúc Clean Architecture:

```
[Phân hệ 1: DC & Đặt hàng] <───> [Phân hệ 2: Danh mục & AI] <───> [Phân hệ 3: Lô hàng FEFO, POS & Luân chuyển] <───> [Phân hệ 4: Chuỗi Cửa hàng & RBAC]
```

### 1. Phân hệ 1: Kho tổng DC & Chuỗi cung ứng Inbound (4 Bảng)

#### 1.1 Bảng `suppliers` (Kho tổng DC Biên Hòa & Nhà cung ứng)
* **Ý nghĩa:** Lưu trữ thông tin Trung tâm Phân phối Kho tổng (`DC-BIENHOA`) cấp hàng cho chuỗi cửa hàng.
* **Cấu trúc cột:**
  * `id` (`INT IDENTITY`, PK): Khóa chính.
  * `code` (`NVARCHAR(50)`, UQ): Mã định danh kho tổng (`DC-BIENHOA`).
  * `name` (`NVARCHAR(150)`): Tên kho tổng / nhà cung cấp.
  * `contact_person`, `phone`, `email`, `address`: Thông tin liên hệ điều phối.
  * `lead_time_days` (`INT`, Default = 1): Thời gian giao hàng chuẩn (Lead Time).
  * `status` (`NVARCHAR(20)`, Default = `'ACTIVE'`): Trạng thái hoạt động.

#### 1.2 Bảng `purchase_orders` (Đơn đặt hàng bổ sung gửi DC)
* **Ý nghĩa:** Lưu trữ đơn đặt hàng bổ sung được đề xuất từ mô hình dự báo AI / ROP và phê duyệt theo cơ chế bất kiêm nhiệm.
* **Cấu trúc cột:**
  * `id` (`INT IDENTITY`, PK): Khóa chính đơn đặt hàng.
  * `po_number` (`NVARCHAR(50)`, UQ): Mã đơn đặt hàng (VD: `PO-20261012-001`).
  * `supplier_id` (`INT`, FK $\rightarrow$ `suppliers.id`): Kho tổng tiếp nhận đơn.
  * `store_id` (`INT`, FK $\rightarrow$ `store_profile.id`): Chi nhánh cửa hàng đặt hàng.
  * `order_date` (`DATE`), `expected_delivery_date` (`DATE`), `actual_delivery_date` (`DATE`, NULL).
  * `total_amount` (`DECIMAL(15,2)`): Tổng giá trị đơn đặt hàng.
  * `status` (`NVARCHAR(30)`): Trạng thái vòng đời (`DRAFT`, `PENDING`, `APPROVED`, `SUBMITTED`, `DELIVERED`, `CANCELLED`).
  * `created_by` (`INT`, FK $\rightarrow$ `users.id`), `approved_by` (`INT`, FK $\rightarrow$ `users.id`, NULL).

#### 1.3 Bảng `purchase_order_items` (Chi tiết dòng sản phẩm đặt hàng)
* **Ý nghĩa:** Chi tiết từng mặt hàng SKU, số lượng hệ thống AI/ROP đề xuất và số lượng thực tế đặt trong đơn PO.
* **Cấu trúc cột:**
  * `id` (`INT IDENTITY`, PK): Khóa chính dòng chi tiết.
  * `purchase_order_id` (`INT`, FK $\rightarrow$ `purchase_orders.id` `ON DELETE CASCADE`): Đơn đặt hàng cha.
  * `product_id` (`INT`, FK $\rightarrow$ `products.id`): Sản phẩm cần nhập.
  * `current_stock_at_order` (`INT`), `suggested_quantity` (`INT`), `ordered_quantity` (`INT`), `received_quantity` (`INT`).
  * `unit_price` (`DECIMAL(12,2)`), `SubTotal` (`DECIMAL(15,2)`).

#### 1.4 Bảng `goods_receipts` (Phiếu tiếp nhận hàng từ DC - Kiểm soát RSL $\ge 70\%$)
* **Ý nghĩa:** Ghi nhận biên bản giao nhận từng chuyến hàng từ DC đến cửa hàng, liên kết trực tiếp với đơn `purchase_orders`.
* **Cấu trúc cột:**
  * `id` (`INT IDENTITY`, PK): Khóa chính phiếu nhập.
  * `receipt_number` (`NVARCHAR(50)`, UQ): Mã phiếu nhập (`GR-...`).
  * `purchase_order_id` (`INT`, FK $\rightarrow$ `purchase_orders.id`, NULL): Đơn đặt hàng gốc đối chiếu.
  * `supplier_id` (`INT`, FK $\rightarrow$ `suppliers.id`): Kho tổng giao hàng.
  * `store_id` (`INT`, FK $\rightarrow$ `store_profile.id`): Cửa hàng tiếp nhận.
  * `received_by` (`INT`, FK $\rightarrow$ `users.id`): Nhân viên kiểm nhận cổng Inbound.
  * `receipt_date` (`DATE`), `total_items` (`INT`), `total_Cost` (`DECIMAL(15,2)`), `status` (`NVARCHAR(30)`).

---

### 2. Phân hệ 2: Danh mục Sản phẩm FMCG & Dự báo AI (3 Bảng)

#### 2.1 Bảng `categories` (Ngành hàng FMCG & Thực phẩm tươi sống)
* **Ý nghĩa:** Phân nhóm ngành hàng và thiết lập ngưỡng cảnh báo cận date mặc định (`default_warning_days`).
* **Cấu trúc cột:** `id` (PK), `code` (UQ), `name`, `default_warning_days` (`INT`, Default = 7), `storage_temp_min`, `storage_temp_max`, `description`.

#### 2.2 Bảng `products` (Danh mục Sản phẩm bán lẻ)
* **Ý nghĩa:** Lưu trữ thông tin chuẩn của từng mặt hàng SKU, giá vốn, giá bán niêm yết, thời hạn sử dụng chuẩn và định mức tồn kho an toàn.
* **Cấu trúc cột:**
  * `id` (`INT IDENTITY`, PK), `sku` (`NVARCHAR(50)`, UQ), `barcode` (`NVARCHAR(50)`), `name` (`NVARCHAR(200)`).
  * `category_id` (`INT`, FK $\rightarrow$ `categories.id`), `supplier_id` (`INT`, FK $\rightarrow$ `suppliers.id`).
  * `unit` (`NVARCHAR(30)`), `import_price` (`DECIMAL(12,2)`), `selling_price` (`DECIMAL(12,2)`).
  * `shelf_life_days` (`INT`), `custom_warning_days` (`INT`, NULL), `min_stock_level` (`INT`), `max_stock_level` (`INT`), `is_active` (`BIT`).

#### 2.3 Bảng `ai_forecasts` (Dự báo Nhu cầu 7 Ngày & Rủi ro Hủy hàng bằng LightGBM + OR-Tools)
* **Ý nghĩa:** Lưu trữ kết quả chạy mô hình học máy **LightGBM** (dự báo sức mua 7 ngày tới và xác suất rủi ro hủy hàng `spoilage_risk_prob`) kết hợp bộ giải **Google OR-Tools** (tối ưu số lượng đặt hàng `recommended_order_qty` và số lượng cần điều chuyển `recommended_transfer_qty`).
* **Cấu trúc cột:**
  * `id` (`INT IDENTITY`, PK): Khóa chính bản ghi dự báo.
  * `store_id` (`INT`, FK $\rightarrow$ `store_profile.id`): Chi nhánh cửa hàng được dự báo.
  * `product_id` (`INT`, FK $\rightarrow$ `products.id`): Mặt hàng SKU được dự báo.
  * `batch_id` (`INT`, FK $\rightarrow$ `batches.id`, NULL): Lô hàng cụ thể đang có nguy cơ tồn đọng.
  * `forecast_date` (`DATE`): Ngày chạy mô hình dự báo.
  * `horizon_days` (`INT`, Default = 7): Chu kỳ dự báo (7 ngày).
  * `predicted_demand_qty` (`DECIMAL(12,2)`): Nhu cầu tiêu thụ dự báo trong 7 ngày tới.
  * `current_Push_stock` (`INT`): Tồn kho khả dụng tại thời điểm chạy AI.
  * `days_until_expiry` (`INT`, NULL): Số ngày hạn sử dụng còn lại.
  * `overstock_qty` (`DECIMAL(12,2)`): Lượng hàng dư thừa dự kiến không kịp bán trước khi hết hạn.
  * `spoilage_risk_prob` (`DECIMAL(5,4)`): Xác suất rủi ro hủy hàng ($0.0000 \rightarrow 1.0000$).
  * `recommended_action` (`NVARCHAR(30)`): Hành động đề xuất (`NORMAL_ORDER`, `MARKDOWN`, `TRANSFER_OUT`, `HOLD_ORDER`).
  * `recommended_markdown_pct` (`INT`), `recommended_order_qty` (`INT`), `recommended_transfer_qty` (`INT`).
  * `model_name` (`NVARCHAR(60)`, Default = `'LightGBM-v1 + OR-Tools'`), `confidence_score` (`DECIMAL(5,4)`), `created_at` (`DATETIME2`).

---

### 3. Phân hệ 3: Lô hàng FEFO, Bán lẻ POS, Tiêu hủy & Điều chuyển Liên Cửa hàng (4 Bảng)

#### 3.1 Bảng `batches` (Lô hàng & Vòng đời Hạn sử dụng - Trọng tâm FEFO)
* **Ý nghĩa:** Quản lý tách biệt từng lô nhập hàng theo hạn sử dụng (`expiry_date`), tỷ lệ hạn dùng còn lại khi nhập (`rsl_initial_percent >= 70%`), mức giảm giá xả hàng Quick Markdown và trạng thái đảo kệ mặt tiền.
* **Cấu trúc cột:**
  * `id` (`INT IDENTITY`, PK), `batch_code` (`NVARCHAR(50)`, UQ).
  * `product_id` (`INT`, FK $\rightarrow$ `products.id`), `goods_receipt_id` (`INT`, FK $\rightarrow$ `goods_receipts.id`, NULL), `store_id` (`INT`, FK $\rightarrow$ `store_profile.id`).
  * `manufacture_date` (`DATE`), `expiry_date` (`DATE`), `import_date` (`DATE`).
  * `initial_quantity` (`INT`), `current_quantity` (`INT`, CHECK $\ge 0$), `import_price` (`DECIMAL(12,2)`).
  * `rsl_initial_percent` (`DECIMAL(5,2)`), `discount_percent` (`INT`, Default = 0), `markdown_applied_at` (`DATETIME2`), `markdown_applied_by` (`INT`, FK $\rightarrow$ `users.id`, NULL).
  * `is_shelf_rotated` (`BIT`), `shelf_rotated_at` (`DATETIME2`), `shelf_rotated_by` (`INT`, FK $\rightarrow$ `users.id`, NULL).
  * `status` (`NVARCHAR(20)`): `ACTIVE`, `WARNING`, `EXPIRED`, `DISPOSED`, `DEPLETED`.

#### 3.2 Bảng `sales_history` (Giao dịch Xuất bán POS theo FEFO)
* **Ý nghĩa:** Ghi nhận từng dòng xuất bán tại quầy thu ngân POS; tự động trừ kho trên lô có `expiry_date ASC` gần nhất và bẻ lô khi cần.
* **Cấu trúc cột:**
  * `id` (`INT IDENTITY`, PK), `transaction_code` (`NVARCHAR(50)`).
  * `product_id` (`INT`, FK $\rightarrow$ `products.id`), `batch_id` (`INT`, FK $\rightarrow$ `batches.id`), `store_id` (`INT`, FK $\rightarrow$ `store_profile.id`).
  * `quantity_sold` (`INT`, CHECK $> 0$), `unit_price` (`DECIMAL(12,2)`), `discount_percent` (`INT`), `total_amount` (`DECIMAL(15,2)`), `cost_price` (`DECIMAL(12,2)`).
  * `sale_date` (`DATE`), `sale_timestamp` (`DATETIME2`), `weather_condition` (`NVARCHAR(30)`), `temperature_celsius` (`DECIMAL(4,1)`), `is_holiday` (`BIT`).
  * `cashier_id` (`INT`, FK $\rightarrow$ `users.id`, NULL).

#### 3.3 Bảng `spoilage_records` (Biên bản Tiêu hủy & Sổ Hao hụt Tài chính)
* **Ý nghĩa:** Lưu vết bất biến mọi nghiệp vụ xuất hủy lô hàng hết hạn hoặc hư hỏng, tự động tính tổn thất vốn `total_cost_loss = quantity_disposed * unit_cost` và bắt buộc tách biệt người lập (`reported_by`) với người duyệt (`approved_by`).
* **Cấu trúc cột:**
  * `id` (`INT IDENTITY`, PK), `record_code` (`NVARCHAR(50)`, UQ).
  * `batch_id` (`INT`, FK $\rightarrow$ `batches.id`), `product_id` (`INT`, FK $\rightarrow$ `products.id`), `store_id` (`INT`, FK $\rightarrow$ `store_profile.id`).
  * `quantity_disposed` (`INT`, CHECK $> 0$), `unit_cost` (`DECIMAL(12,2)`), `total_cost_loss` (`DECIMAL(15,2)`).
  * `reason_code` (`NVARCHAR(50)`), `reason_notes` (`NVARCHAR(500)`), `disposal_date` (`DATE`).
  * `reported_by` (`INT`, FK $\rightarrow$ `users.id`), `approved_by` (`INT`, FK $\rightarrow$ `users.id`, NULL).

#### 3.4 Bảng `stock_transfers` (Phiếu Điều chuyển Tồn kho Liên Cửa hàng - OR-Tools Optimization)
* **Ý nghĩa:** Quản lý luồng điều chuyển lô hàng cận date dư thừa từ cửa hàng bán chậm (`from_store_id`) sang cửa hàng tiêu thụ mạnh (`to_store_id`) theo đề xuất tối ưu của thuật toán **Google OR-Tools**.
* **Cấu trúc cột:**
  * `id` (`INT IDENTITY`, PK), `transfer_code` (`NVARCHAR(50)`, UQ).
  * `batch_id` (`INT`, FK $\rightarrow$ `batches.id`), `product_id` (`INT`, FK $\rightarrow$ `products.id`).
  * `from_store_id` (`INT`, FK $\rightarrow$ `store_profile.id`), `to_store_id` (`INT`, FK $\rightarrow$ `store_profile.id`).
  * `transfer_quantity` (`INT`, CHECK $> 0$), `unit_cost` (`DECIMAL(12,2)`), `logistics_cost` (`DECIMAL(12,2)`), `estimated_saved_value` (`DECIMAL(15,2)`).
  * `ai_forecast_id` (`INT`, FK $\rightarrow$ `ai_forecasts.id`, NULL): Liên kết trực tiếp với bản ghi dự báo AI đã đề xuất lệnh điều chuyển.
  * `status` (`NVARCHAR(30)`): `PROPOSED`, `APPROVED`, `IN_TRANSIT`, `RECEIVED`, `REJECTED`, `CANCELLED`.
  * `requested_by` (`INT`, FK $\rightarrow$ `users.id`), `approved_by` (`INT`, FK $\rightarrow$ `users.id`, NULL), `received_by` (`INT`, FK $\rightarrow$ `users.id`, NULL).

---

### 4. Phân hệ 4: Chuỗi Cửa hàng, Phân quyền RBAC & Kiểm toán Hệ thống (4 Bảng)

#### 4.1 Bảng `roles` (Danh mục Vai trò Phân quyền RBAC)
* **Ý nghĩa:** Định nghĩa nhóm quyền truy cập trong hệ thống (`ADMIN`/`OWNER` - Chủ chuỗi, `MANAGER` - Quản lý cửa hàng, `STAFF`/`CASHIER`/`CASHIER` - Nhân viên vận hành).
* **Cấu trúc cột:** `id` (`INT IDENTITY`, PK), `code` (`NVARCHAR(50)`, UQ), `name` (`NVARCHAR(100)`), `description` (`NVARCHAR(255)`), `created_at`.

#### 4.2 Bảng `users` (Hồ sơ Nhân sự & Tài khoản Đăng nhập - Chuẩn 3NF)
* **Ý nghĩa:** Quản lý tài khoản nhân sự, gắn chặt với vai trò qua `role_id` và chi nhánh công tác qua `store_id` (đã loại bỏ hoàn toàn cột lặp `role`).
* **Cấu trúc cột:**
  * `id` (`INT IDENTITY`, PK), `username` (`NVARCHAR(50)`, UQ), `password_hash` (`NVARCHAR(255)`), `full_name` (`NVARCHAR(100)`), `email` (`NVARCHAR(100)`, UQ), `phone` (`NVARCHAR(20)`).
  * `role_id` (`INT`, FK $\rightarrow$ `roles.id`): Khóa ngoại duy nhất xác định vai trò RBAC.
  * `store_id` (`INT`, FK $\rightarrow$ `store_profile.id`): Chi nhánh cửa hàng nơi nhân sự làm việc.
  * `status` (`NVARCHAR(20)`), `failed_login_attempts` (`INT`), `locked_until` (`DATETIME2`), `last_login_at` (`DATETIME2`).

#### 4.3 Bảng `store_profile` (Hồ sơ Chi nhánh Cửa hàng trong Chuỗi)
* **Ý nghĩa:** Lưu trữ thông tin cấu hình của từng cửa hàng trong chuỗi (mặc định MVP gồm 3 cửa hàng tại TP. Biên Hòa: `RETAIL-STORE-01` Bửu Long, `RETAIL-STORE-02` Tam Hiệp, `RETAIL-STORE-03` Trảng Dài; có thể mở rộng đến 30 cửa hàng).
* **Cấu trúc cột:**
  * `id` (`INT IDENTITY`, PK), `store_code` (`NVARCHAR(50)`, UQ), `store_name` (`NVARCHAR(150)`), `address` (`NVARCHAR(255)`), `phone` (`NVARCHAR(20)`), `email` (`NVARCHAR(100)`).
  * `manager_id` (`INT`, FK $\rightarrow$ `users.id`): Cửa hàng trưởng phụ trách chi nhánh.
  * `dc_supplier_id` (`INT`, FK $\rightarrow$ `suppliers.id`): Kho tổng DC cấp hàng mặc định.
  * `default_lead_time_days` (`INT`), `min_inbound_rsl_percent` (`DECIMAL(5,2)`), `standard_warning_days` (`INT`), `critical_days` (`INT`), `safety_stock_days` (`INT`).
  * `opening_time` (`NVARCHAR(10)`), `closing_time` (`NVARCHAR(10)`), `status` (`NVARCHAR(20)`).

#### 4.4 Bảng `system_audit_logs` (Nhật ký Kiểm toán & Bàn giao Ca Bất biến)
* **Ý nghĩa:** Lưu vết bất biến mọi thao tác nghiệp vụ quan trọng (bán hàng FEFO, nhập kho DC, giảm giá Quick Markdown, đảo kệ SOP, duyệt hủy hàng, điều chuyển liên cửa hàng, đối soát bàn giao ca).
* **Cấu trúc cột:**
  * `id` (`INT IDENTITY`, PK), `user_id` (`INT`, FK $\rightarrow$ `users.id`, NULL), `username` (`NVARCHAR(50)`).
  * `action_type` (`NVARCHAR(50)`), `entity_name` (`NVARCHAR(50)`), `entity_id` (`NVARCHAR(50)`).
  * `old_values` (`NVARCHAR(MAX)`), `new_values` (`NVARCHAR(MAX)`), `ip_address` (`NVARCHAR(50)`), `created_at` (`DATETIME2`).

---

## IV. MA TRẬN ĐẦY ĐỦ 36 RÀNG BUỘC KHÓA NGOẠI (`FOREIGN KEY`) TRONG SQL SERVER

Toàn bộ 36 khóa ngoại dưới đây đã được khởi tạo vật lý trong `sys.foreign_keys` của database `retail_spoilage_db`:

| STT | Tên Constraint Khóa Ngoại (FK Name) | Bảng Con (Child Table) | Cột FK | Bảng Cha (Parent Table) | Cột PK | Ý nghĩa Nghiệp vụ |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `FK_Users_Role` | `users` | `role_id` | `roles` | `id` | Phân quyền RBAC chuẩn 3NF |
| 2 | `FK_Users_StoreProfile` | `users` | `store_id` | `store_profile` | `id` | Nhân sự thuộc chi nhánh cửa hàng |
| 3 | `FK_StoreProfile_Manager` | `store_profile` | `manager_id` | `users` | `id` | Cửa hàng trưởng điều hành chi nhánh |
| 4 | `FK_StoreProfile_DC` | `store_profile` | `default_dc_supplier_id` | `suppliers` | `id` | Liên kết Kho tổng DC cấp hàng |
| 5 | `FK_Products_Category` | `products` | `category_id` | `categories` | `id` | Phân nhóm ngành hàng FMCG |
| 6 | `FK_Products_DefaultSupplier` | `products` | `default_supplier_id` | `suppliers` | `id` | Nguồn cung ứng chuẩn của SKU |
| 7 | `FK_PurchaseOrders_Supplier` | `purchase_orders` | `supplier_id` | `suppliers` | `id` | Đơn PO gửi về Kho tổng DC |
| 8 | `FK_PurchaseOrders_StoreProfile` | `purchase_orders` | `store_id` | `store_profile` | `id` | Chi nhánh cửa hàng phát hành PO |
| 9 | `FK_PurchaseOrders_CreatedBy` | `purchase_orders` | `created_by` | `users` | `id` | Người lập đề xuất đặt hàng |
| 10 | `FK_PurchaseOrders_ApprovedBy` | `purchase_orders` | `approved_by` | `users` | `id` | Quản lý/Chủ chuỗi phê duyệt PO |
| 11 | `FK_PurchaseOrderItems_Order` | `purchase_order_items` | `order_id` | `purchase_orders` | `id` | Chi tiết dòng hàng thuộc đơn PO |
| 12 | `FK_PurchaseOrderItems_Product` | `purchase_order_items` | `product_id` | `products` | `id` | Mặt hàng SKU được đặt |
| 13 | `FK_GoodsReceipts_Supplier` | `goods_receipts` | `supplier_id` | `suppliers` | `id` | Phiếu nhận hàng từ Kho tổng DC |
| 14 | `FK_GoodsReceipts_PurchaseOrder` | `goods_receipts` | `purchase_order_id` | `purchase_orders` | `id` | Đối chiếu phiếu nhập với đơn PO gốc |
| 15 | `FK_GoodsReceipts_StoreProfile` | `goods_receipts` | `store_id` | `store_profile` | `id` | Chi nhánh cửa hàng nhận hàng |
| 16 | `FK_GoodsReceipts_ReceivedBy` | `goods_receipts` | `received_by` | `users` | `id` | Nhân viên kiểm nhận cổng Inbound |
| 17 | `FK_Batches_Product` | `batches` | `product_id` | `products` | `id` | Lô hàng thuộc mặt hàng SKU |
| 18 | `FK_Batches_GoodsReceipt` | `batches` | `receipt_id` | `goods_receipts` | `id` | Lô hàng sinh ra từ phiếu nhập DC |
| 19 | `FK_Batches_StoreProfile` | `batches` | `store_id` | `store_profile` | `id` | Lô hàng đang lưu kho tại chi nhánh |
| 20 | `FK_SalesHistory_Product` | `sales_history` | `product_id` | `products` | `id` | Mặt hàng xuất bán tại POS |
| 21 | `FK_SalesHistory_Batch` | `sales_history` | `batch_id` | `batches` | `id` | Lô hàng cụ thể bị trừ kho FEFO |
| 22 | `FK_SalesHistory_StoreProfile` | `sales_history` | `store_id` | `store_profile` | `id` | Giao dịch phát sinh tại chi nhánh |
| 23 | `FK_Sales_Cashier` | `sales_history` | `cashier_id` | `users` | `id` | Nhân viên thu ngân thực hiện |
| 24 | `FK_SpoilageRecords_Batch` | `spoilage_records` | `batch_id` | `batches` | `id` | Lô hàng bị lập biên bản tiêu hủy |
| 25 | `FK_SpoilageRecords_StoreProfile`| `spoilage_records` | `store_id` | `store_profile` | `id` | Chi nhánh ghi nhận tổn thất |
| 26 | `FK_SpoilageRecords_PerformedBy` | `spoilage_records` | `performed_by` | `users` | `id` | Nhân viên lập đề xuất hủy (SoD) |
| 27 | `FK_Spoilage_ApprovedBy` | `spoilage_records` | `approved_by` | `users` | `id` | Quản lý phê duyệt tiêu hủy (SoD) |
| 28 | `FK_AuditLogs_User` | `system_audit_logs` | `user_id` | `users` | `id` | Người dùng thực hiện hành vi |
| 29 | `FK_AiForecasts_StoreProfile` | `ai_forecasts` | `store_id` | `store_profile` | `id` | Dự báo AI cho chi nhánh cửa hàng |
| 30 | `FK_AiForecasts_Product` | `ai_forecasts` | `product_id` | `products` | `id` | Dự báo AI cho mặt hàng SKU |
| 31 | `FK_StockTransfers_SourceBatch` | `stock_transfers` | `source_batch_id` | `batches` | `id` | Lô hàng cận date được điều chuyển |
| 32 | `FK_StockTransfers_Product` | `stock_transfers` | `product_id` | `products` | `id` | Mặt hàng SKU điều chuyển |
| 33 | `FK_StockTransfers_FromStore` | `stock_transfers` | `from_store_id` | `store_profile` | `id` | Cửa hàng xuất điều chuyển (tồn dư) |
| 34 | `FK_StockTransfers_ToStore` | `stock_transfers` | `to_store_id` | `store_profile` | `id` | Cửa hàng nhận điều chuyển (bán mạnh)|
| 35 | `FK_StockTransfers_RequestedBy` | `stock_transfers` | `requested_by` | `users` | `id` | Người tạo đề xuất điều chuyển |
| 36 | `FK_StockTransfers_ApprovedBy` | `stock_transfers` | `approved_by` | `users` | `id` | Chủ chuỗi/Quản lý duyệt điều chuyển |
