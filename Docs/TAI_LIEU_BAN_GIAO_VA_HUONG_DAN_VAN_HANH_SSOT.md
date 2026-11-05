# TÀI LIỆU BÀN GIAO KỸ THUẬT & HƯỚNG DẪN VẬN HÀNH TOÀN DIỆN (SSOT)
## NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ (LHU MART)
**(Supply Chain Spoilage Predictor - System Administration & Operational Manual)**

---

## 1. THÔNG TIN CHUNG DỰ ÁN
* **Tên đề tài:** Nền tảng Quản trị Chuỗi cung ứng Bán lẻ Chống lãng phí (Supply Chain Spoilage Predictor).
* **Đơn vị chủ quản:** Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU).
* **Giảng viên hướng dẫn:** ThS. Lê Minh Nhật.
* **Nhóm sinh viên thực hiện:**
  - **Đỗ Tấn Du** (MSSV: 123001364)
  - **Đoàn Minh Quân** (MSSV: 123000946)
* **Tài liệu nguồn chuẩn mực (SSOT):** [Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md](file:///c:/thuyet%20minh/Docs/Dac%20Ta%20He%20Thong%20Quan%20Ly%20Chuoi%20Cung%20Ung%20Chong%20Lang%20Phi%20-%20Supply%20Chain%20Spoilage%20Predictor.md)

---

## 2. KIẾN TRÚC HỆ THỐNG TỔNG QUAN (CLEAN ARCHITECTURE 4 TẦNG)

Hệ thống được thiết kế theo đúng mô hình **Clean Architecture** tách biệt hoàn toàn giữa các tầng:

```
[Presentation Layer]  --> React 18 SPA (Vite) + Express REST Controllers
       │
[Application Layer]   --> Use Cases (Quy trình nghiệp vụ cụ thể)
       │
[Domain Layer]        --> Entities, Value Objects, Domain Services (Bất biến)
       ▲
[Infrastructure Layer]--> MSSQL LocalDB Repositories, Database Triggers, Covered Indexes
```

### Chi tiết các tầng trong mã nguồn:
1. **Domain Layer (`Backend/src/domain/`):**
   - **Entities:** [Product.js](file:///c:/thuyet%20minh/Backend/src/domain/entities/Product.js), [Batch.js](file:///c:/thuyet%20minh/Backend/src/domain/entities/Batch.js), [Supplier.js](file:///c:/thuyet%20minh/Backend/src/domain/entities/Supplier.js), [GoodsReceipt.js](file:///c:/thuyet%20minh/Backend/src/domain/entities/GoodsReceipt.js), [PurchaseOrder.js](file:///c:/thuyet%20minh/Backend/src/domain/entities/PurchaseOrder.js).
   - **Domain Services:**
     - [FefoAllocationPolicy.js](file:///c:/thuyet%20minh/Backend/src/domain/services/FefoAllocationPolicy.js): Thuật toán xuất kho FEFO và bẻ lô tự động.
     - [RopCalculationService.js](file:///c:/thuyet%20minh/Backend/src/domain/services/RopCalculationService.js): Dự báo điểm đặt hàng ROP đa biến tích hợp thời tiết, ngày lễ và cảnh báo ứ đọng $DOS > DUE$.
     - [FreshnessStandardService.js](file:///c:/thuyet%20minh/Backend/src/domain/services/FreshnessStandardService.js): Kiểm soát tỷ lệ hạn dùng còn lại $RSL_{inbound} \ge 70\%$.
2. **Application Layer (`Backend/src/application/usecases/`):**
   - Chứa các Use Case thực thi logic: `ProcessFefoSaleUseCase`, `ReceiveDCBatchUseCase`, `CalculateROPForecastUseCase`, `PerformShiftHandoverUseCase`, `DisposeExpiredBatchUseCase`.
3. **Infrastructure Layer (`Backend/src/infrastructure/`):**
   - **Database Connection:** [db.js](file:///c:/thuyet%20minh/Backend/src/infrastructure/database/db.js) kết nối Microsoft SQL Server LocalDB.
   - **Repositories:** `SqlProductRepository`, `SqlBatchRepository`, `SqlSupplierRepository`, `SqlGoodsReceiptRepository`, `SqlSalesRepository`, `SqlShiftHandoverRepository`, `SqlAuditLogRepository`.
4. **Presentation Layer:**
   - **Backend Controllers & Routes:** `Backend/src/presentation/controllers/` và `routes/`.
   - **Frontend React 18 SPA:** `Frontend/src/` với Dark mode, phím tắt quầy thu ngân F1-F9, Tablet responsive và giám sát mạng trực tuyến.

---

## 3. THÔNG SỐ KỸ THUẬT & TÀI KHOẢN ĐĂNG NHẬP MẶC ĐỊNH

### 3.1. Cổng mạng và Kết nối
* **Backend REST API:** `http://localhost:5000` (Node.js Express).
* **Frontend SPA:** `http://localhost:5173` (Vite React).
* **Database Engine:** Microsoft SQL Server LocalDB `(localdb)\mssqllocaldb`.
* **Tên Database:** `retail_spoilage_db` (chuẩn 3NF gồm 13 bảng).

### 3.2. Danh sách Tài khoản & Phân quyền (RBAC)
Tất cả tài khoản demo đều dùng mật khẩu mặc định: `Password123@`

| Tên đăng nhập | Họ và tên | Vai trò (Role) | Quyền hạn chính |
| :--- | :--- | :--- | :--- |
| **`admin`** | Quản trị Hệ thống | `ADMIN` | Toàn quyền kiểm soát, quản lý người dùng, cấu hình cửa hàng, audit logs. |
| **`manager`** | Trần Cửa Hàng Trưởng | `STORE_MANAGER` | Xem Dashboard KPI, duyệt đổi giá Markdown, tạo đơn PO gửi DC, duyệt biên bản giao ca. |
| **`cashier`** | Lê Thu Ngân | `CASHIER` | Thao tác Quầy Bán lẻ POS, áp dụng giảm giá tự động, thực hiện bàn giao ca trực. |
| **`warehouse`** | Nguyễn Thủ Kho | `WAREHOUSE` | Nhận hàng xe tải DC (RSL $\ge 70\%$), quản lý lô hàng, tiêu hủy hàng hỏng quá hạn. |

---

## 4. MA TRẬN 11 QUY TẮC NGHIỆP VỤ CỐT LÕI (11 CORE RULES)

| Quy tắc | Tên Quy tắc | File mã nguồn triển khai | Cơ chế bảo vệ & Ràng buộc |
| :---: | :--- | :--- | :--- |
| **Rule 1** | **Một cửa hàng duy nhất** | `SqlStoreRepository.js` | Bảng `StoreProfile` chỉ chứa 1 dòng duy nhất (`RETAIL-STORE-01`), mọi giao dịch tự động gắn mã này. |
| **Rule 2** | **FEFO tuyệt đối** | [FefoAllocationPolicy.js](file:///c:/thuyet%20minh/Backend/src/domain/services/FefoAllocationPolicy.js) | Sắp xếp `expiry_date ASC`, tự động xuất lô cận date trước, bẻ đơn qua nhiều lô nếu cần. |
| **Rule 3** | **Chống tồn kho âm** | `SqlBatchRepository.js`, `schema.sql` | Ràng buộc CHECK `current_quantity >= 0`, Trigger DB, SQL Transaction có `WITH (UPDLOCK, ROWLOCK)`. |
| **Rule 4** | **Cảnh báo 3 cấp màu** | `FreshnessStandardService.js` | Xanh ($DaysLeft > WarningDays$), Vàng ($3 < DaysLeft \le WarningDays$), Đỏ ($0 < DaysLeft \le 3$). |
| **Rule 5** | **Khóa cứng hàng hết date** | `SqlBatchRepository.js`, `Batch.js` | Khi $DaysLeft \le 0$, tự động chuyển trạng thái sang `EXPIRED`, cấm xuất bán POS tuyệt đối. |
| **Rule 6** | **Sổ hao hụt tài chính** | `SqlSpoilageRepository.js` | Tiêu hủy bắt buộc ghi nhận $CostLoss = Quantity \times ImportPrice$. Bảng `SpoilageRecords` bất biến. |
| **Rule 7** | **Tiêu chuẩn nhận hàng DC** | [FreshnessStandardService.js](file:///c:/thuyet%20minh/Backend/src/domain/services/FreshnessStandardService.js) | Lô xe tải giao đến bắt buộc $RSL_{inbound} \ge 70\%$. Nếu vi phạm, khóa nút lưu và từ chối nhận. |
| **Rule 8** | **Dự báo ROP đa biến** | [RopCalculationService.js](file:///c:/thuyet%20minh/Backend/src/domain/services/RopCalculationService.js) | $ROP = (d_{adj} \times LeadTime) + SafetyStock$. Cảnh báo ứ đọng $DOS > DUE$ tự động giảm 50% đề xuất PO. |
| **Rule 9** | **Chống trùng lặp sản phẩm** | `SqlProductRepository.js` | Chuẩn hóa chuỗi SKU, kiểm tra độ tương đồng tên sản phẩm $\ge 85\%$ tránh trùng lặp danh mục. |
| **Rule 10** | **Xả hàng & Đảo kệ 5 bước** | `ProductCatalogView.jsx`, POS | Quick Markdown (15%, 30%, 40%, 50%) có hiệu lực tức thì ở POS; quy trình đảo kệ 5 bước có xác nhận. |
| **Rule 11** | **Nhật ký kiểm toán** | `SqlAuditLogRepository.js` | Mọi hành động xuất, nhập, đổi giá, giao ca, tiêu hủy đều lưu vết bất biến vào `AuditLogs`. |

---

## 5. BẢNG TRA CỨU API ENDPOINTS VÀ ALIASES ĐẦY ĐỦ

Hệ thống cung cấp đầy đủ các chuẩn RESTful URL và các bí danh tương thích (Aliases):

### 5.1. Xác thực & Tài khoản (`/api/auth`)
* `POST /api/auth/login`: Đăng nhập, nhận JWT Token và thông tin phân quyền.
* `POST /api/auth/logout`: Đăng xuất an toàn, ghi nhận Audit Log.

### 5.2. Quầy Bán lẻ POS & Phân bổ FEFO (`/api/sales`)
* `POST /api/sales/checkout`: Thanh toán giỏ hàng, tự động xuất kho theo FEFO và bẻ lô.
* `GET /api/sales/history`: Xem lịch sử giao dịch bán lẻ.

### 5.3. Nhập kho DC & Biên bản (`/api/goods-receipts` & `/api/goods-receipt`)
* `POST /api/goods-receipts`: Tiếp nhận lô hàng mới từ DC Biên Hòa (Kiểm soát $RSL \ge 70\%$).
* `GET /api/goods-receipts`: Lấy danh sách biên bản nhận hàng đã lưu trong hệ thống.
* `GET /api/goods-receipts/:id`: Xem chi tiết 1 biên bản nhận hàng.

### 5.4. Bàn giao ca trực & Chế tài 15.2 (`/api/shift-handover`)
* `GET /api/shift-handover/current`: Lấy số liệu ca hiện tại (Tiền dự kiến, tổng số hóa đơn, hàng hủy trong ca).
* `POST /api/shift-handover/submit`: Nộp biên bản bàn giao ca trực, tính chênh lệch tiền mặt và áp dụng chế tài 3 cấp độ.
* `GET /api/shift-handover/history`: Xem lịch sử các biên bản bàn giao ca trực.

### 5.5. Danh mục Sản phẩm & Nhà cung ứng (`/api/products`, `/api/suppliers`)
* `GET /api/products`: Danh sách sản phẩm, lọc theo ngành hàng, trạng thái tồn kho.
* `POST /api/products`: Tạo mới sản phẩm với Đơn vị tính (ĐVT) chuẩn hóa FMCG.
* `PUT /api/products/:id`: Cập nhật thông tin sản phẩm.
* `GET /api/suppliers`: Danh sách nhà cung ứng và thông tin Kho tổng DC Biên Hòa.
* `POST /api/suppliers`: Thêm nhà cung ứng mới (ADMIN / STORE_MANAGER).
* `PUT /api/suppliers/:id`: Sửa thông tin nhà cung ứng.
* `DELETE /api/suppliers/:id`: Xóa an toàn (chặn xóa nếu đang có sản phẩm hoặc đơn PO).

### 5.6. Dự báo ROP & Đơn đặt hàng PO (`/api/purchase-orders`)
* `GET /api/purchase-orders/rop-forecast`: Lấy bảng tính dự báo ROP thích ứng ngoại cảnh (Thời tiết, Ngày lễ).
* `POST /api/purchase-orders`: Sinh đơn đặt hàng PO gửi về DC Biên Hòa.

### 5.7. Quản lý Lô hàng, Hạn dùng & Tiêu hủy (`/api/batches`, `/api/spoilage`)
* `GET /api/batches`: Xem toàn bộ lô hàng theo mã màu Xanh - Vàng - Đỏ.
* `POST /api/batches/:id/markdown`: Cập nhật giảm giá xả hàng Quick Markdown.
* `POST /api/spoilage/dispose`: Tiêu hủy lô hàng hỏng/quá date, tự động ghi sổ hao hụt tài chính.
* `GET /api/spoilage/history`: Xem sổ hao hụt tài chính bất biến.

### 5.8. Kiểm toán & Cấu hình Cửa hàng (`/api/audit-logs`, `/api/store-profile`)
* `GET /api/audit-logs`: Truy vấn nhật ký kiểm toán bất biến theo thời gian và người dùng.
* `GET /api/store-profile`: Lấy thông tin cửa hàng duy nhất `RETAIL-STORE-01` (LHU Mart).

---

## 6. QUY TRÌNH VẬN HÀNH 1 CHẠM (ONE-TOUCH SOP)

### 6.1. Khởi động Toàn bộ Hệ thống
Mở terminal PowerShell tại thư mục gốc dự án:
```powershell
# 1. Đảm bảo SQL Server LocalDB đang chạy
sqllocaldb start mssqllocaldb

# 2. Khởi động Backend (Port 5000)
cd "c:\thuyet minh\Backend"
node server.js

# 3. Khởi động Frontend (Port 5173 - mở ở terminal khác)
cd "c:\thuyet minh\Frontend"
npm run dev -- --host
```

### 6.2. Dọn dẹp & Tái lập Dữ liệu Mẫu Demo Chuẩn (Seed & Restore)
Khi muốn dọn sạch dữ liệu thử nghiệm phát sinh và khôi phục CSDL về trạng thái sạch sẽ hoàn hảo trước giờ bảo vệ:
```powershell
cd "c:\thuyet minh\Backend"
node seed_clean_demo_data.js
```
*Script sẽ tự động nạp dữ liệu chuẩn, tính toán date động theo ngày hiện tại và xuất snapshot backup `Database/backups/retail_spoilage_db_master_seed.bak` chỉ trong 1.5 giây.*

### 6.3. Chạy Kiểm định Bộ Test Tự Động (Master Automated Tests)
Để chứng minh với Giảng viên và Hội đồng về tính toàn vẹn 100% của hệ thống:
```powershell
cd "c:\thuyet minh\Backend"
node test_master_e2e_11_rules_full_web.js
```
*Kết quả chuẩn mực: **40/40 tests PASSED (100%)** không có bất kỳ lỗi nào.*

---

## 7. SỔ TAY XỬ LÝ SỰ CỐ KỸ THUẬT (TROUBLESHOOTING RUNBOOK)

| Hiện tượng | Nguyên nhân gốc rễ | Cách khắc phục triệt để |
| :--- | :--- | :--- |
| **Lỗi kết nối CSDL `Timeout error [258]`** | Instance `mssqllocaldb` bị Windows chuyển sang trạng thái Stopped sau khi máy Sleep/Restart. | Mở PowerShell chạy: `sqllocaldb start mssqllocaldb`, sau đó khởi động lại Backend. |
| **Port 5000 hoặc 5173 bị báo `EADDRINUSE`** | Tiến trình Node.js chạy ngầm trước đó chưa được giải phóng. | Mở PowerShell chạy: `Get-Process node \| Stop-Process -Force`, sau đó chạy lại lệnh khởi động. |
| **Không hiển thị nút Bàn giao ca trực** | Người dùng đang đăng nhập bằng tài khoản không có quyền thu ngân (ví dụ `warehouse`). | Đăng xuất và đăng nhập lại bằng tài khoản `cashier` hoặc `admin`. |
| **Không thể xóa Nhà cung ứng** | Nhà cung ứng đang được liên kết với ít nhất 1 sản phẩm hoặc 1 đơn PO trong CSDL. | Đây là tính năng an toàn (Rule toàn vẹn tham chiếu). Cần gỡ bỏ sản phẩm liên kết hoặc chuyển trạng thái nhà cung ứng sang Ngừng hoạt động (`is_active = 0`). |
| **Giao diện POS báo Mất kết nối Mạng** | Mạng LAN/Wifi bị ngắt kết nối vật lý hoặc trình duyệt mất mạng. | POS tự động hiển thị thanh cảnh báo màu vàng phía trên quầy, tự động kết nối lại ngay khi mạng phục hồi mà không mất dữ liệu giỏ hàng. |

