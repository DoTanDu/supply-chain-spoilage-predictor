# THUYẾT MINH CHI TIẾT SƠ ĐỒ USE CASE HỆ THỐNG
**Đề tài:** Nền tảng Quản trị Chuỗi cung ứng Bán lẻ Chống lãng phí (Supply Chain Spoilage Predictor)  
**Đơn vị:** Khoa Công nghệ Thông tin - Đại học Lạc Hồng (LHU)  
**GVHD:** ThS. Lê Minh Nhật  
**Nhóm sinh viên thực hiện:** Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946)  
**Tài liệu chuẩn mực (SSOT):** [Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md](file:///c:/thuyet%20minh/Docs/Dac%20Ta%20He%20Thong%20Quan%20Ly%20Chuoi%20Cung%20Ung%20Chong%20Lang%20Phi%20-%20Supply%20Chain%20Spoilage%20Predictor.md)

---

## I. NGUYÊN TẮC THIẾT KẾ & TIẾP THU GÓP Ý CỦA GVHD

Tiếp thu chỉ đạo sâu sát của **ThS. Lê Minh Nhật** về việc sơ đồ Use Case không được mô tả sơ sài hay dừng lại ở các bong bóng độc lập, nhóm sinh viên đã chuẩn hóa toàn bộ chuỗi tác nghiệp khép kín của Cửa hàng bán lẻ tinh gọn LHU Mart liên kết với Kho tổng DC Biên Hòa:

1. **Phân định rõ ràng 4 vai trò người dùng (Separation of Duties):**
   * Tuyệt đối không gộp chung người dùng. 
   * Hệ thống chia tách rõ 4 Roles:
     * `Admin` (Quản trị viên hệ thống)
     * `Store Manager` (Cửa hàng trưởng)
     * `Cashier` (Nhân viên thu ngân)
     * `Warehouse Staff` (Nhân viên kho & quầy kệ)
   * Tác nhân bên ngoài: `Kho tổng (DC Biên Hòa)`.
2. **Chuỗi tác nghiệp liên hoàn khép kín:**
   * Tiếp nhận hàng DC (Kiểm định $RSL \ge 70\%$) $\rightarrow$ Bán lẻ POS tự động trừ kho FEFO & bẻ lô $\rightarrow$ Giám sát hạn dùng 3 vùng màu $\rightarrow$ Xả hàng Quick Markdown & Đảo kệ 5 bước $\rightarrow$ Tiêu hủy chốt Sổ hao hụt tài chính $\rightarrow$ Dự báo ROP & Tạo đơn đặt hàng gửi DC.
3. **Tuân thủ nghiêm ngặt 11 Quy tắc nghiệp vụ cốt lõi:**
   * Mọi ràng buộc kiểm tra ($RSL \ge 70\%$, chống âm kho, khóa hàng hết hạn, tự động bẻ lô, Sổ hao hụt tài chính, Audit Log) đều được thể hiện rõ ràng qua các quan hệ `<<include>>` và `<<extend>>`.

---

## II. HÌNH ẢNH SƠ ĐỒ USE CASE CHUẨN HÓA

Ảnh độ phân giải cao được lưu tại: [use_case.png](file:///c:/thuyet%20minh/Docs/Diagram_Images/use_case.png)

![Sơ đồ Use Case Tổng Thể Hệ Thống Quản Trị Bán Lẻ Chống Lãng Phí](file:///c:/thuyet%20minh/Docs/Diagram_Images/use_case.png)

---

## III. MA TRẬN PHÂN QUYỀN 4 VAI TRÒ NGƯỜI DÙNG (RBAC MATRIX)

| Nghiệp vụ hệ thống | Admin | Cửa hàng trưởng | Thu ngân | Nhân viên kho |
| :--- | :---: | :---: | :---: | :---: |
| **Đăng nhập hệ thống (JWT)** | Có | Có | Có | Có |
| **Quản lý tài khoản & Phân quyền** | Có | Không | Không | Không |
| **Cấu hình Cửa hàng duy nhất StoreProfile** | Có | Tùy quyền | Không | Không |
| **Quản lý danh mục FMCG & Chống trùng SP** | Có | Có | Chỉ xem | Chỉ xem |
| **Xem danh sách lô & Cảnh báo 3 màu** | Có | Có | Có | Có |
| **Bán lẻ POS trừ kho FEFO & Bẻ lô** | Có | Có | Có | Không |
| **Kích hoạt Quick Markdown (15% - 50%)** | Có | Có | Không | Không |
| **Tiếp nhận hàng DC (Kiểm định RSL $\ge$ 70%)** | Có | Có | Không | Có |
| **Xác nhận SOP đảo kệ mặt tiền 5 bước** | Có | Có | Không | Có |
| **Lập đề xuất tiêu hủy hàng hỏng/date** | Có | Có | Có | Có |
| **Phê duyệt tiêu hủy & Chốt Sổ hao hụt** | Có | Có | Không | Không |
| **Xem dự báo ROP & Tạo đơn PO gửi DC** | Có | Có | Không | Tùy quyền |
| **Xem Dashboard 6 KPI tài chính điều hành** | Có | Có | Không | Không |
| **Bàn giao ca trực điện tử 4 bước** | Có | Có | Có | Có |
| **Tra cứu Nhật ký kiểm toán AuditLog** | Có | Tùy quyền | Không | Không |

---

## IV. THUYẾT MINH CHI TIẾT 6 PHÂN HỆ TÁC NGHIỆP

### 1. Phân hệ 1: Quản trị hệ thống & Cấu hình Cửa hàng duy nhất
* **UC-01 (Quản lý người dùng & Phân quyền):** Admin tạo tài khoản nhân viên, cấp vai trò trong 4 nhóm, khóa tài khoản nhân viên thôi việc.
* **UC-02 (Cấu hình Cửa hàng duy nhất):** Quản lý thông tin LHU Mart (`RETAIL-STORE-01`), thời gian giao hàng chuẩn (Lead Time = 1 ngày), ngưỡng nhận date tối thiểu 70%. Bảng chỉ có 1 bản ghi duy nhất (**Rule 1**).
* **UC-03 (Quản lý Danh mục & Chống trùng sản phẩm):** Thiết lập ngành hàng FMCG, nhiệt độ bảo quản. Khi tạo sản phẩm mới, thuật toán tự động chuẩn hóa chuỗi và chặn trùng SKU / tên tương đồng $\ge 85\%$ (**Rule 9**).
* **UC-04 (Tra cứu Nhật ký kiểm toán AuditLog):** Lưu vết bất biến toàn bộ hoạt động can thiệp kho, đổi giá, tiêu hủy và phân quyền (**Rule 11**).

### 2. Phân hệ 2: Tiếp nhận hàng từ Kho tổng DC (Inbound)
* **Bước 1 (UC-06 - Tiếp nhận hàng DC):** Nhân viên kho mở phiếu tiếp nhận chuyến xe tải từ DC Biên Hòa.
* **Bước 2 (UC-06.1 - Kiểm định RSL $\ge$ 70%):** `«include»` Nhập Ngày sản xuất và HSD. Hệ thống tính:  
  $$RSL_{inbound} = \frac{ExpiryDate - ImportDate}{ExpiryDate - ManufactureDate} \times 100\%$$  
  Nếu $RSL \ge 70\%$ mới cho phép nhập số lượng và giá vốn (**Rule 7**).
* **Bước 3 (UC-06.2 - Khóa lưu & Lập biên bản từ chối nhận hàng DC):** `«extend»` Nếu $RSL < 70\%$, hệ thống khóa cứng nút lưu và hiển thị nút **'Lập Biên Bản Từ Chối Nhận Hàng DC'** để ghi vết `REJECT_DC_INBOUND` vào `AuditLogs` (**Rule 7, 11**), ngăn chặn hành vi đùn đẩy hàng cận date từ DC về cửa hàng.
* **Bước 4 (UC-06.3 - Sinh mã lô & Kích hoạt Shelf-Life):** `«include»` Hệ thống tự động sinh mã lô `LOT-DC-[Mã SP]-[Ngày Nhập]`, khởi tạo `CurrentQuantity = InitialQuantity`.
* **Bước 5 (UC-06.4 - In tem mã vạch lô):** `«extend»` In mã Barcode dán lên kiện hàng lưu kho.

### 3. Phân hệ 3: Bán lẻ POS theo nguyên tắc FEFO (Cashier)
* **Bước 1 (UC-07 - Bán lẻ tại quầy POS):** Thu ngân quét mã Barcode SKU sản phẩm và nhập số lượng mua. Bán hàng = Xuất kho trực tiếp.
* **Bước 2 (UC-07.1 - Tự động chọn lô hạn gần nhất):** `«include»` Thuật toán tự động bóc tách các lô khả dụng theo thứ tự `ExpiryDate ASC, id ASC` (**Rule 2**).
* **Bước 3 (UC-07.2 - Tự động bẻ đơn qua nhiều lô):** `«include»` Nếu khách mua vượt quá số lượng của lô thứ nhất, hệ thống tự động bẻ dòng hóa đơn sang lô tiếp theo, đảm bảo không âm kho (**Rule 3**).
* **Bước 4 (UC-07.3 - Áp dụng giá sau chiết khấu):** `«include»` Nếu lô đang gắn Quick Markdown, POS tự động tính giá sau giảm mà thu ngân không cần can thiệp thủ công.
* **Bước 5 (UC-07.4 - Lưu cờ ngữ cảnh bán hàng):** `«include»` Thu ngân chọn cờ Thời tiết (Nắng/Mưa/Bình thường) và Cờ ngày lễ để nạp dữ liệu cho mô hình dự báo ROP.
* **Bước 6 (UC-07.5 - In hóa đơn chi tiết):** `«extend»` In hóa đơn chi tiết từng mã lô đã xuất cho khách hàng.

### 4. Phân hệ 4: Giám sát HSD, Quick Markdown & Đảo kệ mặt tiền
* **UC-08 (Giám sát hạn dùng 3 màu):** Phân loại lô hàng thành Vùng Xanh (An toàn), Vùng Vàng ($3 < DaysLeft \le WarningDays$), Vùng Đỏ ($0 < DaysLeft \le 3$) (**Rule 4**).
* **UC-08.1 (Khóa cứng xuất bán POS):** `«include»` Lô có $DaysLeft \le 0$ ngày tự động chuyển sang `EXPIRED`, cấm xuất bán POS hoàn toàn (**Rule 5**).
* **UC-09 (Kích hoạt Quick Markdown 15%-50%):** Cửa hàng trưởng phê duyệt mức giảm giá xả hàng; giá mới lập tức có hiệu lực tại POS (**Rule 10**).
* **UC-10 (SOP đảo kệ 5 bước & Xác nhận điện tử):** Nhân viên kho đưa lô date xa lùi vào trong, đưa lô cận date ra mặt tiền mép kệ trưng bày; bấm nút xác nhận trên hệ thống để lưu vết và xóa cảnh báo trên Action Board (**Rule 10**).
* **UC-10.1 (Dán tem nhãn giảm giá):** `«extend»` Dán tem chiết khấu lên bao bì tại quầy kệ.

### 5. Phân hệ 5: Tiêu hủy hàng hỏng & Sổ hao hụt tài chính
* **Bước 1 (UC-11 - Lập đề xuất tiêu hủy):** Nhân viên kho gom hàng hỏng vào khu cách ly và tạo phiếu đề xuất hủy kèm lý do (`EXPIRED`, `DAMAGED`, `SPOILED`).
* **Bước 2 (UC-12 - Phê duyệt tiêu hủy & Chốt Sổ hao hụt):** Cửa hàng trưởng kiểm tra hàng thực tế và bấm duyệt biên bản (**Rule 6**).
* **Bước 3 (UC-12.1 - Tính tổn thất tài chính):** `«include»` Hệ thống tự động tính:  
  $$CostLoss = QuantityDisposed \times ImportPrice$$  
  và ghi nhận bất biến vào bảng `SpoilageRecords`.
* **Bước 4 (UC-12.2 - Trừ kho & Cập nhật DISPOSED):** `«include»` Khấu trừ số lượng tồn về 0 và chuyển trạng thái lô thành `DISPOSED`.

### 6. Phân hệ 6: Dự báo ROP, Đơn đặt hàng DC & Điều hành ca trực
* **UC-13 (Phân tích tốc độ bán 14 ngày & Cảnh báo $DOS > DUE$):** Tính tốc độ bán trung bình ngày $d_{base}$, so sánh Ngày tồn kho (DOS) với Hạn dùng ngắn nhất (DUE). Nếu $DOS > DUE$, cảnh báo nguy cơ hàng bị ứ đọng hết hạn trước khi bán hết (**Rule 8**).
* **UC-14 (Tính ROP & Đề xuất số lượng đặt):**  
  $$ROP = (d_{adjusted} \times LeadTime) + SafetyStock$$  
  với $d_{adjusted} = d_{base} \times W_{factor} \times H_{factor}$.
* **UC-15 (Phê duyệt & Gửi đơn PO về Kho tổng DC):** Cửa hàng trưởng duyệt đơn `PurchaseOrders` và gửi dữ liệu điện tử sang Kho tổng DC Biên Hòa.
* **UC-16 (Xem Dashboard 6 KPI tài chính & Action Board):** Giám sát tổng vốn tồn kho, giá trị rủi ro cận date, tỷ lệ lãng phí Spoilage Rate %, doanh thu hôm nay và các hành động khẩn cấp trong ca.
* **UC-17 (Bàn giao ca trực điện tử 4 bước):** Thu ngân và nhân viên kho chốt ca POS, rà soát lô Đỏ/Vàng, bàn giao thùng hủy, và ký xác nhận điện tử.

---

## V. DANH MỤC CHI TIẾT TOÀN BỘ USE CASE

| Mã UC | Tên Use Case | Tác nhân thực hiện | Phân loại & Quan hệ |
| :--- | :--- | :--- | :--- |
| **UC-00** | Đăng nhập hệ thống (JWT) | Admin, Manager, Cashier, Warehouse | Xác thực danh tính theo Role |
| **UC-01** | Quản trị người dùng & Phân quyền | Admin | Quản trị 4 vai trò hệ thống |
| **UC-02** | Cấu hình Cửa hàng duy nhất | Admin, Manager | `StoreProfile` LHU Mart (Rule 1) |
| **UC-03** | Quản lý SP FMCG & Chống trùng lặp | Admin, Manager | Chặn trùng $\ge 85\%$ (Rule 9) |
| **UC-04** | Tra cứu Nhật ký kiểm toán AuditLog | Admin, Manager | AuditLog bất biến (Rule 11) |
| **UC-06** | Tiếp nhận hàng từ xe tải DC | Warehouse Staff | Nghiệp vụ tác nghiệp Inbound |
| **UC-06.1**| Kiểm định đạt chuẩn RSL $\ge$ 70% | Warehouse Staff | `«include»` của UC-06 (Rule 7) |
| **UC-06.2**| Từ chối nhận hàng (Nếu RSL < 70%) | Warehouse Staff | `«extend»` của UC-06 |
| **UC-06.3**| Sinh mã lô LOT-DC & Theo dõi HSD | Hệ thống | `«include»` của UC-06 |
| **UC-06.4**| In nhãn tem mã vạch lô lưu kho | Warehouse Staff | `«extend»` của UC-06 |
| **UC-07** | Bán lẻ tại quầy POS | Cashier | Xuất kho bán hàng FEFO (Rule 2) |
| **UC-07.1**| Tự động xuất lô hạn gần nhất | Hệ thống | `«include»` của UC-07 |
| **UC-07.2**| Tự động bẻ đơn qua nhiều lô | Hệ thống | `«include»` của UC-07 (Split Order) |
| **UC-07.3**| Áp dụng giá giảm xả Quick Markdown | Hệ thống | `«include»` của UC-07 |
| **UC-07.4**| Lưu cờ ngữ cảnh Thời tiết & Lễ | Cashier | `«include»` của UC-07 (Biến ngoại cảnh) |
| **UC-07.5**| In hóa đơn chi tiết kèm mã lô | Cashier | `«extend»` của UC-07 |
| **UC-08** | Giám sát hạn dùng 3 vùng màu | Manager, Warehouse Staff | Kiểm soát Shelf-Life (Rule 4) |
| **UC-08.1**| Khóa cứng xuất bán POS (Hết hạn) | Hệ thống | `«include»` của UC-08 (Rule 5) |
| **UC-09** | Kích hoạt Quick Markdown (15%-50%) | Store Manager | Phê duyệt xả hàng cận date (Rule 10) |
| **UC-10** | Thực hiện SOP đảo kệ 5 bước | Warehouse Staff | Đảo kệ mặt tiền FEFO (Rule 10) |
| **UC-10.1**| Dán tem nhãn giảm giá lên bao bì | Warehouse Staff | `«extend»` của UC-10 |
| **UC-11** | Lập đề xuất tiêu hủy hàng hỏng | Warehouse Staff | Tạo phiếu cách ly hàng hủy |
| **UC-12** | Phê duyệt tiêu hủy & Chốt Sổ hao hụt | Store Manager | Chốt Sổ hao hụt tài chính (Rule 6) |
| **UC-12.1**| Tính tổn thất CostLoss = Qty * GiáVốn | Hệ thống | `«include»` của UC-12 |
| **UC-12.2**| Trừ kho về 0 & Cập nhật DISPOSED | Hệ thống | `«include»` của UC-12 |
| **UC-13** | Phân tích tốc độ bán & Cảnh báo DOS>DUE | Hệ thống, Manager | Đánh giá nguy cơ ứ đọng (Rule 8) |
| **UC-14** | Tính điểm đặt hàng ROP đa yếu tố | Hệ thống, Manager | ROP có thời tiết và lễ |
| **UC-15** | Phê duyệt & Gửi đơn PO về DC | Store Manager, DC Supplier | Đặt hàng bổ sung gửi Kho tổng |
| **UC-16** | Xem Dashboard KPI 6 thẻ & Action Board | Store Manager, Admin | Giám sát tài chính và việc khẩn |
| **UC-17** | Bàn giao ca trực điện tử 4 bước | Cashier, Warehouse, Manager | Bàn giao tiền, lô, hàng hủy, ký số |
