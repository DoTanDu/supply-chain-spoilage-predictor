# THUYẾT MINH CHI TIẾT SƠ ĐỒ KIẾN TRÚC CLEAN ARCHITECTURE 4 TẦNG
**Đề tài:** Nền tảng Quản trị Chuỗi cung ứng Bán lẻ Chống lãng phí (Supply Chain Spoilage Predictor)  
**Đơn vị:** Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU)  
**GVHD:** ThS. Lê Minh Nhật  
**Nhóm sinh viên thực hiện:** Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946)  
**Tài liệu chuẩn mực (SSOT):** [Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md](file:///c:/thuyet%20minh/Docs/Dac%20Ta%20He%20Thong%20Quan%20Ly%20Chuoi%20Cung%20Ung%20Chong%20Lang%20Phi%20-%20Supply%20Chain%20Spoilage%20Predictor.md)

---

## I. TỔNG QUAN VỀ KIẾN TRÚC CLEAN ARCHITECTURE

Tiếp thu sự chỉ đạo sâu sát của **ThS. Lê Minh Nhật**, hệ thống được xây dựng theo mô hình **Clean Architecture (Kiến trúc Sạch)** do Robert C. Martin (Uncle Bob) khởi xướng. Mục tiêu tối thượng của kiến trúc này là:

1. **Độc lập với Frameworks:** Kiến trúc không phụ thuộc vào sự tồn tại của bất kỳ thư viện hay framework bên ngoài nào (Express, React,...).
2. **Độc lập với Giao diện (UI-Independent):** Giao diện (Web SPA, Mobile, CLI) có thể thay đổi mà không làm thay đổi các quy tắc nghiệp vụ cốt lõi.
3. **Độc lập với Cơ sở dữ liệu (Database-Independent):** Nghiệp vụ bán hàng FEFO, kiểm định $RSL \ge 70\%$, tính toán $ROP$ không bị ràng buộc vào Microsoft SQL Server; hệ thống có thể thay thế bằng PostgreSQL hoặc Mock InMemory để viết Unit Test một cách dễ dàng.
4. **Độc lập với bất kỳ tác nhân bên ngoài (External Agencies):** Quy tắc nghiệp vụ hoàn toàn không biết gì về thế giới bên ngoài.

---

## II. HÌNH ẢNH SƠ ĐỒ KIẾN TRÚC CLEAN ARCHITECTURE

Ảnh độ phân giải cao được lưu tại: [clean_architecture.png](file:///c:/thuyet%20minh/Docs/Diagram_Images/clean_architecture.png)

![Sơ đồ Kiến trúc Hệ thống Clean Architecture 4 Tầng](file:///c:/thuyet%20minh/Docs/Diagram_Images/clean_architecture.png)

---

## III. QUY TẮC PHỤ THUỘC (THE DEPENDENCY RULE)

> **Quy tắc vàng:** *Mã nguồn chỉ được phép phụ thuộc theo một chiều duy nhất: từ các tầng bên ngoài hướng vào các tầng bên trong.*

```
[Presentation & UI] ──> [Application (Use Cases)] ──> [Domain Core (Entities)]
         │                                                      ▲
         ▼                                                      │ (DIP)
  [Infrastructure] ─────────────────────────────────────────────┘
```

* **Tầng Domain** nằm ở vị trí trung tâm, không chứa bất kỳ câu lệnh `import` nào từ tầng Application, Presentation hay Infrastructure.
* **Tầng Application** chỉ phụ thuộc vào tầng Domain.
* **Tầng Presentation** phụ thuộc vào tầng Application để kích hoạt các Use Case.
* **Tầng Infrastructure** (hiện thực hóa cơ sở dữ liệu SQL Server) phụ thuộc vào tầng Domain thông qua **Nguyên tắc đảo ngược phụ thuộc (Dependency Inversion Principle - DIP)**.

---

## IV. PHÂN TÍCH CHI TIẾT 4 TẦNG TRONG MÃ NGUỒN DỰ ÁN

### 1. Tầng 1: Domain Layer (Quy tắc nghiệp vụ cốt lõi - Enterprise Business Rules)
* **Thư mục mã nguồn:** `Backend/src/domain/`
* **Vai trò:** Là tài sản quý giá nhất của phần mềm, chứa đựng các khái niệm nghiệp vụ thuần túy của bài toán quản trị bán lẻ chống lãng phí.
* **Thành phần cấu thành:**
  * **Entities (`domain/entities/`):**
    * `Batch.js`: Đại diện cho một lô hàng với hạn dùng, ngày sản xuất, số lượng tồn, cờ đảo kệ và trạng thái 3 cấp màu (Xanh/Vàng/Đỏ).
    * `Product.js`: Hàng hóa FMCG, giá vốn, giá niêm yết, mã SKU chống trùng lặp (**Rule 9**).
    * `StoreProfile.js`: Cấu hình cửa hàng bán lẻ duy nhất `RETAIL-STORE-01` (**Rule 1**).
    * `SaleOrder.js`: Đơn hàng bán lẻ tại quầy POS.
    * `SpoilageRecord.js`: Bản ghi tổn thất tài chính khi tiêu hủy hàng (**Rule 6**).
    * `PurchaseOrder.js`: Đơn đặt hàng bổ sung gửi Kho tổng DC Biên Hòa (**Rule 8**).
  * **Value Objects (`domain/value-objects/`):**
    * `ShelfLife.js`: Tính toán tỷ lệ phần trăm hạn sử dụng còn lại $RSL$.
    * `AlertLevel.js`: Enum 3 cấp màu cảnh báo: `GREEN`, `YELLOW`, `RED`, `EXPIRED`.
    * `Money.js`: Định dạng tiền tệ VND an toàn.
    * `WeatherCondition.js`: Chuẩn hóa thời tiết và tính toán hệ số $W_{factor}$ cho từng ngành hàng.
  * **Domain Policies & Services (`domain/services/`):**
    * `FefoAllocationPolicy.js`: Thuật toán bóc tách lô hàng theo thứ tự `ExpiryDate ASC, id ASC` (**Rule 2**).
    * `RopCalculationService.js`: Công thức tính điểm đặt hàng $ROP = (d_{adjusted} \times LeadTime) + SafetyStock$ tích hợp hệ số thời tiết và ngày lễ (**Rule 8**).
    * `MarkdownPricingPolicy.js`: Quy tắc chiết khấu Quick Markdown (15%, 30%, 40%, 50%) theo cấp màu date (**Rule 10**).
    * `ProductDeduplicationService.js`: Thuật toán chuẩn hóa chuỗi và chặn trùng SKU / tên sản phẩm $\ge 85\%$ (**Rule 9**).
  * **Repository Interfaces / Ports (`domain/repositories/`):**
    * `IBatchRepository.js`: Khai báo các phương thức trừ kho, tìm lô theo FEFO mà không quan tâm SQL Server.
    * `ISaleRepository.js`, `ISpoilageRepository.js`, `IProductRepository.js`, `IPurchaseOrderRepository.js`, `IStoreProfileRepository.js`.

---

### 2. Tầng 2: Application Layer (Quy tắc nghiệp vụ ứng dụng - Use Cases)
* **Thư mục mã nguồn:** `Backend/src/application/`
* **Vai trò:** Điều phối luồng dữ liệu đến và đi từ các Entities của tầng Domain; hướng dẫn các Entities sử dụng các quy tắc của chúng để hoàn thành nghiệp vụ của ca sử dụng.
* **Các Use Case trọng điểm (`application/use-cases/`):**
  * `ProcessFefoSaleUseCase.js`:
    * Nhận giỏ hàng từ POS $\rightarrow$ Kiểm tra cửa hàng OPEN $\rightarrow$ Gọi `FefoAllocationPolicy` bóc tách lô $\rightarrow$ Tự động bẻ đơn qua nhiều lô nếu cần $\rightarrow$ Trừ tồn kho $\rightarrow$ Lưu `SalesHistory` $\rightarrow$ Ghi `AuditLog` (**Rule 2, 3, 5**).
  * `ReceiveDCBatchUseCase.js` & `RejectDCBatchUseCase.js`:
    * Tiếp nhận xe tải DC $\rightarrow$ Tính $RSL_{inbound} \ge 70\%$ $\rightarrow$ Khóa lưu từ chối nếu không đạt chuẩn (**Rule 7**) và ghi biên bản `REJECT_DC_INBOUND` $\rightarrow$ Đạt chuẩn thì sinh mã lô `LOT-DC-[Mã SP]-[Ngày]`.
  * `ApplyQuickMarkdownUseCase.js`:
    * Quản lý phê duyệt chiết khấu cận date (15%, 30%, 40%, 50%) $\rightarrow$ Đổi trạng thái lô sang `WARNING` $\rightarrow$ Giá mới lập tức đồng bộ sang quầy POS (**Rule 10**).
  * `RotateShelfFefoUseCase.js`:
    * Ghi nhận xác nhận hoàn tất quy trình 5 bước đảo kệ mặt tiền từ nhân viên kho $\rightarrow$ Cập nhật `is_shelf_rotated = 1` $\rightarrow$ Xóa cờ khẩn cấp trên Action Board.
  * `DisposeSpoiledGoodsUseCase.js` & `ApproveSpoilageRecordUseCase.js`:
    * Nhân viên lập phiếu đề xuất $\rightarrow$ Quản lý duyệt hủy hàng $\rightarrow$ Tính tổn thất tài chính $CostLoss = QuantityDisposed \times ImportPrice$ $\rightarrow$ Ghi sổ hao hụt $\rightarrow$ Trừ tồn về 0 và chuyển trạng thái `DISPOSED` (**Rule 6** - SoD).
  * `CalculateROPForecastUseCase.js` & `CreatePurchaseOrderUseCase.js`:
    * Phân tích tốc độ bán 14 ngày $\rightarrow$ Điều chỉnh thời tiết & lễ $\rightarrow$ Tính $ROP$ $\rightarrow$ So sánh $DOS > DUE$ để cảnh báo ứ đọng $\rightarrow$ Sinh đề xuất đơn đặt hàng PO gửi DC Biên Hòa (**Rule 8**).
  * `GetDashboardOverviewUseCase.js`:
    * Tổng hợp 6 chỉ số KPI tài chính, Tỷ lệ tuân thủ FEFO %, Top 5 Bán chạy, Top 5 Hao hụt và 4 danh sách khẩn cấp Action Board.

---

### 3. Tầng 3: Infrastructure Layer (Hiện thực hóa hạ tầng & Dữ liệu - Adapters)
* **Thư mục mã nguồn:** `Backend/src/infrastructure/`
* **Vai trò:** Chứa các chi tiết kỹ thuật cụ thể như kết nối cơ sở dữ liệu, gọi API bên thứ ba, bảo mật mã hóa mật khẩu và tạo token xác thực.
* **Thành phần cấu thành:**
  * **Database Connection (`infrastructure/database/sqlConnection.js`):**
    * Kết nối Microsoft SQL Server LocalDB `retail_spoilage_db` thông qua thư viện `mssql` với Connection Pool tối ưu và Transaction isolation.
  * **SqlRepositories (`infrastructure/database/repositories/`):**
    * `SqlBatchRepository.js`: Hiện thực hóa interface `IBatchRepository`. Sử dụng câu lệnh SQL với khóa giao dịch `UPDLOCK, ROWLOCK` để chống race condition và bảo vệ $CurrentQuantity \ge 0$ (**Rule 3**).
    * `SqlSaleRepository.js`, `SqlSpoilageRepository.js`, `SqlProductRepository.js`, `SqlPurchaseOrderRepository.js`, `SqlStoreProfileRepository.js`.
  * **Security & Auth Services (`infrastructure/security/`):**
    * `TokenService.js`: Tạo và xác minh chữ ký điện tử JSON Web Token (JWT).
    * `PasswordHasher.js`: Băm mật khẩu nhân viên an toàn bằng thuật toán bcrypt.
  * **Audit Logging (`infrastructure/database/repositories/SqlAuditLogRepository.js`):**
    * Ghi vết bất biến mọi hành động can thiệp dữ liệu vào bảng `AuditLogs` (**Rule 11**).

---

### 4. Tầng 4: Presentation Layer (Giao diện & Điểm tiếp nhận API)
* **Thư mục mã nguồn:** `Backend/src/presentation/` & `Frontend/src/`
* **Vai trò:** Tiếp nhận yêu cầu từ người dùng, chuyển đổi dữ liệu đầu vào thành DTO chuyển cho tầng Application, và định dạng kết quả trả về cho giao diện.
* **Backend Presentation (`Backend/src/presentation/`):**
  * **REST Controllers (`controllers/`):**
    * `AuthController.js`, `StoreProfileController.js`, `CatalogController.js`, `BatchController.js`, `SalesController.js`, `SpoilageController.js`, `ForecastController.js`, `DashboardController.js`, `ShiftHandoverController.js`, `AuditLogController.js`.
  * **Middlewares (`middlewares/`):**
    * `authMiddleware.js`: Trích xuất và xác thực JWT token từ Header HTTP, kiểm tra tài khoản bị khóa Brute-force.
    * `roleMiddleware.js`: Kiểm tra phân quyền truy cập theo 4 nhóm vai trò (Admin, Manager, Cashier, Warehouse).
    * `errorHandler.js`: Chuẩn hóa bắt lỗi và trả định dạng JSON `{ success: false, message }`.
* **Frontend SPA (`Frontend/src/` - React 19 + Vite):**
  * Giao diện SPA hiện đại, thẩm mỹ cao với 10 màn hình tác nghiệp độc lập:
    1. **Trang Đăng Nhập Riêng (`LoginView.jsx`):** Đăng nhập bảo mật JWT, chống Brute-Force lockout, 4 thẻ Quick Demo 1-Click cho 4 vai trò.
    2. **Dashboard Điều Hành (`DashboardView.jsx`):** 6 Thẻ KPI tài chính, Tỷ lệ tuân thủ FEFO %, Top 5 Bán chạy, Top 5 Hao hụt, Action Board ca trực 4 Tab.
    3. **Quầy Thu Ngân POS FEFO (`PosCheckoutView.jsx`):** Quét Barcode, xem trước phân bổ FEFO bẻ lô, áp dụng Quick Markdown, chọn cờ thời tiết/lễ.
    4. **Tiếp Nhận Hàng DC (`DcIntakeView.jsx`):** Thước đo $RSL \ge 70\%$, khóa lưu tự động, lập Biên bản từ chối nhận hàng DC & liên kết PO.
    5. **Giám Sát Hạn Dùng FEFO (`ExpiryMonitorView.jsx`):** Phân nhóm 3 màu Xanh/Vàng/Đỏ, Quick Markdown 15%-50% & SOP đảo kệ 5 bước.
    6. **Tiêu Hủy & Sổ Hao Hụt (`SpoilageLogView.jsx`):** Lập đề xuất, tính $CostLoss$, Cửa hàng trưởng phê duyệt và chốt Sổ hao hụt tài chính bất biến (SoD).
    7. **Danh Mục Sản Phẩm (`ProductCatalogView.jsx`):** CRUD hàng hóa, Live Margin, chống tạo trùng SKU & tên tương đồng $\ge 85\%$ (**Rule 9**).
    8. **Dự Báo Nhu Cầu ROP & Đơn DC (`ReorderPredictorView.jsx` & `PurchaseOrdersSubView.jsx`):** Mô phỏng Thời tiết/Lễ Tết, hiển thị $d_{adj}$ & giải thích AI, cảnh báo $DOS > DUE$, quản lý vòng đời đơn PO.
    9. **Hồ Sơ Cửa Hàng & Phân Quyền (`StoreSettingsView.jsx`):** Cấu hình `RETAIL-STORE-01`, Cửa hàng trưởng phụ trách, giờ mở 06:00-22:00, quản trị tài khoản RBAC.
    10. **Bàn Giao Ca Trực & Kiểm Toán (`ShiftHandoverView.jsx` & `AuditLogView.jsx`):** Quy trình 4 bước chốt ca POS, đối soát tiền két, rà soát lô cận date, ký nhận điện tử kèm 3 chế tài kỷ luật Mục 15.2.

---

## V. LUỒNG XỬ LÝ DỮ LIỆU ĐIỂN HÌNH (REQUEST LIFECYCLE)

Minh họa luồng thực thi khi Thu ngân bấm thanh toán đơn hàng tại quầy POS:

```
[1. Thu ngân bấm Thanh toán trên React POS View]
                      │ (HTTP POST /api/sales)
                      ▼
[2. SalesController tiếp nhận HTTP Request & authMiddleware kiểm tra JWT]
                      │ (Gọi ProcessFefoSaleUseCase.execute(dto))
                      ▼
[3. ProcessFefoSaleUseCase điều phối quy trình]
                      │ (Gọi IBatchRepository.findAvailableByProduct(productId))
                      ▼
[4. SqlBatchRepository truy vấn SQL Server LocalDB]
                      │ (Khóa UPDLOCK, ROWLOCK, SELECT ExpiryDate ASC)
                      ▼
[5. FefoAllocationPolicy (Domain) bẻ lô và trừ số lượng]
                      │ (CurrentQuantity = CurrentQuantity - SoldQuantity)
                      ▼
[6. SqlSaleRepository lưu SalesHistory & SqlAuditLogRepository ghi AuditLog]
                      │ (Commit SQL Transaction)
                      ▼
[7. Trả về kết quả JSON Response hóa đơn thành công cho POS Frontend]
```

---

## VI. KẾT LUẬN & ĐÁNH GIÁ

Kiến trúc Clean Architecture đã giúp hệ thống:
1. **Cô lập triệt để rủi ro:** Thay đổi giao diện CSS/React hay cấu trúc bảng trong SQL Server không bao giờ làm hỏng quy tắc tính toán FEFO hay công thức ROP.
2. **Dễ dàng bảo trì và mở rộng:** Các tính năng mới (như bàn giao ca trực, đảo kệ mặt tiền) được thêm vào theo từng Use Case độc lập mà không cần sửa đổi các Use Case cũ.
3. **Đạt chuẩn học thuật xuất sắc:** Đáp ứng hoàn toàn các tiêu chuẩn khắt khe của một đồ án tốt nghiệp ngành Công nghệ Thông tin tại Trường Đại học Lạc Hồng.
