# THUYẾT MINH CHI TIẾT SƠ ĐỒ TUẦN TỰ (UML SEQUENCE DIAGRAMS)
## HỆ THỐNG QUẢN LÝ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ (SUPPLY CHAIN SPOILAGE PREDICTOR)

---

### THÔNG TIN ĐỀ TÀI & TÁC GIẢ
* **Đề tài:** Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor).
* **Đơn vị:** Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU).
* **Giảng viên hướng dẫn:** ThS. Lê Minh Nhật.
* **Sinh viên thực hiện:**
  * Đỗ Tấn Du - MSSV: 123001364
  * Đoàn Minh Quân - MSSV: 123000946
* **Mô hình triển khai:** Cửa hàng Bán lẻ Tinh gọn duy nhất (*LHU Mart - RETAIL-STORE-01*) liên kết Kho tổng DC Biên Hòa (*DC-BIENHOA*).

---

## 1. GIỚI THIỆU TỔNG QUAN VỀ SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAM)

Trong mô hình kiến trúc phần mềm Clean Architecture, Sơ đồ Tuần tự (UML Sequence Diagram) giữ vai trò minh chứng tính khả thi và tính đồng bộ giữa các tầng kiến trúc. Sơ đồ mô tả trực quan dòng thông điệp (Message Flow) tương tác theo trục thời gian giữa Tác nhân bên ngoài (Actor) xuyên qua các tầng:
1. **Presentation Layer:** Giao diện SPA (React / Tailwind) và Bộ điều phối (Controller / Route Middleware).
2. **Application Layer:** Khối xử lý ca sử dụng nghiệp vụ (UseCase Interactor / Transaction Handler).
3. **Domain Layer:** Thực thể nghiệp vụ và quy tắc logic lõi bất biến (Domain Entity / Business Rule Validator).
4. **Infrastructure Layer:** Cổng truy xuất dữ liệu (Repository / SQL Server LocalDB with `UPDLOCK, ROWLOCK`).

Hai ca sử dụng cốt lõi mang tính sống còn đối với bài toán chống lãng phí và bảo toàn dòng tiền bán lẻ được thiết kế sơ đồ tuần tự chi tiết gồm:
* **Use Case 1 (Mục 21.1 & Rule 2, 3):** Luồng Bán lẻ POS Trừ kho FEFO & Tự động bẻ nhỏ đơn hàng qua nhiều lô (`ProcessFefoSaleUseCase`).
* **Use Case 2 (Mục 21.2 & Rule 7):** Luồng Tiếp nhận hàng từ Kho tổng DC kiểm định chuẩn $RSL_{inbound} \ge 70\%$ (`ReceiveDCBatchUseCase`).

---

## 2. SƠ ĐỒ TUẦN TỰ 1: BÁN LẺ POS XUẤT KHO FEFO (PROCESS FEFO SALE)

### 2.1. Hình ảnh Sơ đồ Tuần tự 1
*(Sơ đồ chi tiết được lưu trữ tại file ảnh chất lượng cao: `Docs/Diagram_Images/sequence_fefo_sale.png`)*

### 2.2. Mục tiêu Nghiệp vụ
* Đảm bảo nguyên tắc xuất kho **FEFO (First Expired, First Out)**: Các sản phẩm có hạn dùng gần nhất bắt buộc phải được xuất bán trước.
* Cơ chế **Bẻ lô tự động (Batch Splitting)**: Khi khách mua số lượng lớn hơn lượng tồn của lô cận date nhất, hệ thống tự động trừ cạn lô này và lấy tiếp lượng thiếu hụt từ các lô kế tiếp.
* Áp dụng tự động mức chiết khấu **Quick Markdown (15% - 50%)** nếu lô hàng đang trong diện xả hàng.
* Bảo vệ tính toàn vẹn dữ liệu: Ngăn chặn tuyệt đối hiện tượng **Tồn kho âm (Rule 3)** thông qua Transaction và khóa dòng `UPDLOCK, ROWLOCK`.

### 2.3. Bảng phân tích các đối tượng tham gia (Lifelines)

| Tên Lifeline | Tầng Kiến trúc | Vai trò & Trách nhiệm kỹ thuật |
| :--- | :--- | :--- |
| **Cashier (Actor)** | Người dùng bên ngoài | Thu ngân tại quầy POS quét mã barcode sản phẩm và bấm Thanh toán. |
| **POS View (Boundary)** | Presentation Layer | Giao diện React hiển thị giỏ hàng, thông tin chiết khấu lô cận date và nút xác nhận hóa đơn. |
| **SalesController** | Presentation Layer | Tiếp nhận payload HTTP `POST /api/sales`, xác thực JWT token và phân quyền thu ngân. |
| **ProcessFefoSaleUseCase** | Application Layer | Điều phối toàn bộ luồng nghiệp vụ FEFO, quản lý chu kỳ sống Transaction (Begin / Commit / Rollback). |
| **BatchRepository** | Infrastructure Layer | Thực thi truy vấn SQL Server, áp dụng khóa bản ghi và cập nhật `CurrentQuantity` của các lô. |
| **SalesRepository** | Infrastructure Layer | Ghi nhận chi tiết hóa đơn thanh toán vào bảng `SalesHistory` kèm các cờ ngoại cảnh (thời tiết, ngày lễ). |
| **AuditLogRepository** | Infrastructure Layer | Lưu vết kiểm toán bất biến phục vụ công tác thanh tra kế toán và bàn giao ca trực. |
| **SQL Server LocalDB** | Database Storage | Cơ sở dữ liệu vật lý `retail_spoilage_db`, thực thi ràng buộc CHECK, FOREIGN KEY và COMMIT dữ liệu. |

### 2.4. Diễn giải chi tiết từng bước thực thi (Step-by-Step Flow)

1. **Bước 1 - Gửi yêu cầu:** Thu ngân quét mã vạch sản phẩm, nhập số lượng mua $Q$ và bấm nút "Thanh toán". Giao diện POS gửi request `POST /api/sales` kèm danh sách mặt hàng `{items: [{productId, quantity}]}` về `SalesController`.
2. **Bước 2 - Điều phối Use Case:** `SalesController` kiểm tra định dạng dữ liệu đầu vào (DTO Validation) rồi chuyển giao yêu cầu cho `ProcessFefoSaleUseCase.execute()`.
3. **Bước 3 - Khởi tạo Transaction & Khóa dữ liệu:**
   * UseCase yêu cầu `BatchRepository` mở giao dịch `BEGIN TRANSACTION`.
   * Truy vấn các lô hàng hợp lệ của sản phẩm theo câu lệnh:
     ```sql
     SELECT * FROM Batches WITH (UPDLOCK, ROWLOCK)
     WHERE product_id = @productId AND current_quantity > 0 AND expiry_date > GETDATE()
     ORDER BY expiry_date ASC, id ASC;
     ```
   * Khóa `UPDLOCK, ROWLOCK` đảm bảo không có giao dịch thanh toán hoặc điều chỉnh kho song song nào có thể đọc/ghi đè lên cùng các bản ghi lô này.
4. **Bước 4 - Kiểm tra Tồn kho khả dụng (Guard Clause):**
   * UseCase tính tổng tồn kho khả dụng $\sum current\_quantity$.
   * **Nhánh Rẽ (alt - Tồn kho không đủ):** Nếu $\sum current\_quantity < Q$, hệ thống lập tức thực hiện `ROLLBACK TRANSACTION`, trả lỗi HTTP 400 *"Tồn kho không đủ đáp ứng số lượng yêu cầu"* về POS View.
5. **Bước 5 - Vòng lặp Bẻ lô xuất kho theo FEFO (loop - Allocate FIFO):**
   * Khi tồn kho khả dụng đáp ứng đủ, UseCase duyệt danh sách lô theo thứ tự hạn dùng gần nhất:
     * Lô 1: Lấy số lượng xuất $q_1 = \min(Q_{cần}, CurrentQuantity_1)$. Cập nhật `CurrentQuantity = CurrentQuantity - q1`.
     * Nếu lô 1 đang có gắn nhãn Quick Markdown, áp dụng đơn giá sau giảm: $Price_{sale} = Price \times (1 - DiscountPercent / 100)$.
     * Giảm $Q_{cần} = Q_{cần} - q_1$.
     * Nếu $Q_{cần} > 0$: Tiếp tục duyệt sang Lô 2, Lô 3 cho đến khi đáp ứng đủ toàn bộ số lượng mua.
6. **Bước 6 - Ghi nhận Lịch sử Giao dịch & Audit Log:**
   * Gọi `SalesRepository.insertRecord()` để ghi lại hóa đơn thanh toán vào `SalesHistory` kèm theo mã giao dịch duy nhất `TXN-...`, hệ số thời tiết và ngày lễ.
   * Gọi `AuditLogRepository.logAction()` ghi nhận thao tác xuất kho FEFO của tài khoản thu ngân.
7. **Bước 7 - Hoàn tất Giao dịch:**
   * Thực thi lệnh `COMMIT TRANSACTION` ghi nhận vĩnh viễn dữ liệu xuống SQL Server.
   * Trả DTO kết quả về Controller, Controller phản hồi HTTP 200 kèm chi tiết các lô đã bóc tách. POS View in hóa đơn thanh toán cho khách hàng và cập nhật lại giỏ hàng.

---

## 3. SƠ ĐỒ TUẦN TỰ 2: TIẾP NHẬN HÀNG TỪ KHO TỔNG DC (RECEIVE DC BATCH)

### 3.1. Hình ảnh Sơ đồ Tuần tự 2
*(Sơ đồ chi tiết được lưu trữ tại file ảnh chất lượng cao: `Docs/Diagram_Images/sequence_dc_intake.png`)*

### 3.2. Mục tiêu Nghiệp vụ
* Kiểm soát chất lượng hàng hóa nhập từ Trung tâm Phân phối DC Biên Hòa (*DC-BIENHOA*) thông qua chỉ số **Vòng đời Sử dụng Còn lại ($RSL_{inbound}$ - Remaining Shelf Life)**.
* Triệt để thực thi **Rule 7 (Tiêu chuẩn nhận hàng DC)**: Xe tải DC giao đến cửa hàng phải đạt điều kiện:
  $$\text{RSL}_{\text{inbound}} = \frac{\text{ExpiryDate} - \text{ReceiptDate}}{\text{ExpiryDate} - \text{ManufactureDate}} \times 100\% \ge 70\%$$
* Nếu $RSL < 70\%$: Khóa cứng quy trình nhập, từ chối nhận hàng tại cửa bến và lập biên bản trả lại xe tải DC nhằm ngăn chặn hành vi đùn đẩy hàng cận date từ kho tổng về cửa hàng bán lẻ.
* Nếu $RSL \ge 70\%$: Sinh mã lô chuẩn hóa `LOT-DC-[Mã SP]-[Ngày]`, nhập kho an toàn, kích hoạt giám sát hạn dùng 3 màu.

### 3.3. Bảng phân tích các đối tượng tham gia (Lifelines)

| Tên Lifeline | Tầng Kiến trúc | Vai trò & Trách nhiệm kỹ thuật |
| :--- | :--- | :--- |
| **Warehouse Staff (Actor)** | Người dùng bên ngoài | Nhân viên kho kiểm đếm hàng thực tế tại cửa nhận hàng từ xe tải DC Biên Hòa. |
| **GoodsReceipt View (Boundary)** | Presentation Layer | Form tiếp nhận đợt hàng, nhập số lượng, ngày sản xuất (MFG), hạn sử dụng (EXP) và giá nhập. |
| **BatchController** | Presentation Layer | Tiếp nhận HTTP `POST /api/batches/receive-inbound` (nhận hàng) hoặc `POST /api/batches/reject-inbound` (từ chối), xác thực phân quyền nhân viên kho / cửa hàng trưởng. |
| **ReceiveDCBatchUseCase** | Application Layer | Điều phối nghiệp vụ kiểm định chất lượng đợt hàng và quy tắc tính toán RSL. |
| **RejectDCBatchUseCase** | Application Layer | Điều phối nghiệp vụ lập biên bản từ chối nhận hàng DC khi RSL < 70%. |
| **Batch Domain Entity** | Domain Layer | Chứa logic thuần túy: Công thức tính RSL %, kiểm tra hạn dùng hợp lệ ($EXP > MFG$). |
| **BatchRepository** | Infrastructure Layer | Lưu bản ghi lô hàng mới vào bảng `Batches` và cập nhật giá vốn tham chiếu trong `Products`. |
| **AuditLogRepository** | Infrastructure Layer | Lưu vết kiểm toán tiếp nhận đợt hàng phục vụ đối soát công nợ với DC Biên Hòa. |
| **SQL Server LocalDB** | Database Storage | Kiểm tra ràng buộc duy nhất (Unique SKU/BatchCode) và lưu trữ vật lý. |

### 3.4. Diễn giải chi tiết từng bước thực thi (Step-by-Step Flow)

1. **Bước 1 - Nhập dữ liệu phiếu giao nhận DC:**
   * Xe tải DC Biên Hòa bàn giao biên bản giao hàng. Nhân viên kho mở giao diện `GoodsReceipt View`, quét mã sản phẩm, nhập ngày sản xuất ($MFG$), hạn sử dụng ($EXP$), số lượng giao $Q$ và giá nhập vốn.
   * Nhấn nút *"Kiểm định & Nhập kho"*. Giao diện gửi request `POST /api/batches/receive-inbound` tới `BatchController`.
2. **Bước 2 - Ủy quyền cho Use Case:** `BatchController` xác thực quyền nhân viên kho và gọi `ReceiveDCBatchUseCase.execute(inboundDto)`.
3. **Bước 3 - Thẩm định tại Tầng Domain (Domain Entity Validation):**
   * UseCase khởi tạo đối tượng `Batch Domain Entity`.
   * Thực thể Domain tính toán chỉ số $RSL$:
     $$RSL = \frac{\text{ExpiryDate} - \text{Today}}{\text{ExpiryDate} - \text{ManufactureDate}} \times 100\%$$
4. **Bước 4 - Rẽ nhánh Kiểm soát Tiêu chuẩn RSL (alt - Check RSL >= 70%):**
   * **Trường hợp Từ chối (RSL < 70%):**
     * Domain Entity ném ngoại lệ nghiệp vụ `InboundQualityException("Hàng không đạt chuẩn tiếp nhận DC: RSL = {rsl}% < 70% quy định")`.
     * UseCase bắt lỗi, lập tức hủy quy trình nhập kho và không ghi nhận bất kỳ dữ liệu nào vào bảng `Batches`.
     * Nhân viên kho kích hoạt chức năng lập biên bản từ chối: Giao diện gửi `POST /api/batches/reject-inbound` kèm lý do vi phạm RSL. `RejectDCBatchUseCase` tiếp nhận, gọi `AuditLogRepository.logAction()` ghi nhận bản ghi kiểm toán bất biến với `action = 'REJECT_DC_INBOUND'`.
     * Trả thông báo từ chối thành công: *"Đã lập biên bản từ chối nhận hàng - Yêu cầu xe tải DC thu hồi lô hàng cận date"*.
   * **Trường hợp Chấp nhận (RSL >= 70%):**
     * Domain Entity phê chuẩn trạng thái hợp lệ.
     * UseCase tạo mã định danh lô hàng chuẩn hóa: `LOT-DC-{sku}-{yyyyMMdd}-{seq}`.
     * Khởi tạo các giá trị: `InitialQuantity = Q`, `CurrentQuantity = Q`, `DiscountPercent = 0%`, `is_shelf_rotated = 0`.
5. **Bước 5 - Lưu trữ Cơ sở Dữ liệu & Cập nhật Giá vốn:**
   * UseCase gọi `BatchRepository.saveNewBatch()` thực hiện lệnh INSERT vào bảng `Batches`.
   * Cập nhật giá vốn nhập mới nhất vào bảng `Products` (nếu có biến động giá nhập từ DC).
6. **Bước 6 - Ghi Audit Log & Hoàn tất:**
   * Gọi `AuditLogRepository.logAction()` ghi nhận sự kiện: *"Nhân viên kho tiếp nhận thành công lô {batch_code} số lượng {Q} đạt RSL {rsl}%"*.
   * Trả kết quả thành công HTTP 201 Created về giao diện.
   * Giao diện POS hiển thị thông báo tích cực màu xanh, cập nhật tồn kho tức thì và cho phép in tem mã vạch dán lên kiện hàng để xếp lên quầy kệ.

---

## 4. Ý NGHĨA KHOA HỌC VÀ ĐÓNG GÓP THỰC TIỄN CỦA BỘ SƠ ĐỒ TUẦN TỰ

1. **Minh chứng cấu trúc Clean Architecture chuẩn mực:** Các luồng thông điệp luôn tuân thủ nguyên tắc một chiều (Dependency Inversion Principle). Tầng Controller không bao giờ gọi trực tiếp Database mà luôn thông qua UseCase và Repository Interface.
2. **Loại bỏ hoàn toàn rủi ro thao tác sai lệch tại quầy bán lẻ:** Bằng việc tự động hóa thuật toán FEFO tại Use Case với khóa `UPDLOCK, ROWLOCK`, nhân viên thu ngân không thể bán nhầm các lô hạn xa hay gây ra lỗi tồn kho âm.
3. **Bảo vệ dòng vốn lưu động trước nguy cơ đùn đẩy hàng từ DC:** Thuật toán chặn cứng $RSL < 70\%$ bảo đảm cửa hàng luôn tiếp nhận hàng hóa có vòng đời đủ dài để xoay vòng tiêu thụ, giảm thiểu tối đa tỷ lệ hủy hàng cận date.
4. **Giá trị bảo vệ đồ án tốt nghiệp:** Bộ sơ đồ tuần tự thể hiện rõ năng lực phân tích, thiết kế hệ thống chuyên nghiệp của 2 sinh viên Đỗ Tấn Du & Đoàn Minh Quân, đáp ứng hoàn hảo các tiêu chí chấm điểm khắt khe của Hội đồng bảo vệ đồ án Trường Đại học Lạc Hồng.
