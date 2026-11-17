# TÀI LIỆU TÁC DỤNG NGHIỆP VỤ & KỊCH BẢN TEST THỰC TẾ (SMARTSUPPLY AI)

Tài liệu này tổng hợp đầy đủ **tác dụng**, **quy tắc kiểm soát**, và **các bước tự kiểm thử (test) trên web** cho toàn bộ 3 vai trò và 9 trang chức năng hiện có của hệ thống.

---

## A. THÔNG TIN ĐĂNG NHẬP & PHẠM VI 3 ACTORS

Mở trình duyệt tại `http://127.0.0.1:5173` (Backend API chạy tại `http://localhost:5000`). Mật khẩu mặc định của 3 tài khoản mẫu trong CSDL là **`123456`**:

| Vai trò (Actor) | Tên đăng nhập | Phạm vi dữ liệu | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **OWNER** (Chủ chuỗi / Admin) | `admin` | Toàn chuỗi (`ALL`) hoặc lọc từng chi nhánh | Xem tổng thể chuỗi, mở/sửa/ngừng chi nhánh, duyệt PO vượt hạn mức Manager, cấu hình chuỗi & phân quyền 9 trang |
| **MANAGER** (Quản lý cửa hàng) | `manager` | Cô lập chặt trong chi nhánh được giao | Vận hành kho, xem dự báo 7 ngày & báo cáo, tạo/duyệt PO trong hạn mức, duyệt giảm giá/tiêu hủy/điều chuyển |
| **STAFF** (Nhân viên cửa hàng) | `cashier` | Cô lập chặt trong chi nhánh được giao | Nhập kho (`RSL ≥ 70%`), ghi nhận xuất bán FEFO, kiểm kê & xuất kho, đảo kệ mặt tiền, giao/nhận điều chuyển, lập đề xuất hủy chờ duyệt |

---

## B. THANH HEADER: THỜI TIẾT, LỊCH LỄ THỰC TẾ & CHỌN PHẠM VI

### Tác dụng nghiệp vụ
- Lấy **thời tiết thực ngoài đời** tại địa chỉ chi nhánh (hoặc theo **vị trí GPS** của người dùng) qua Open-Meteo API: nhiệt độ thực (`°C`), độ ẩm (`%`), lượng mưa (`mm`), gió (`km/h`), trạng thái WMO (`Trời quang`, `Ít mây`, `Mưa nhỏ`, `Mưa vừa`, `Mưa dông`...) và dự báo **7 ngày tới**.
- Tự động đối chiếu **lịch ngày lễ chính thức Việt Nam** (`Nager.Date VN`) + cuối tuần (Thứ 7 / Chủ Nhật).
- Với `OWNER`: cho phép chuyển nhanh giữa **`Toàn chuỗi`** và **từng chi nhánh** ở góc trái Header; với `MANAGER`/`STAFF`: hiển thị khóa cố định chi nhánh được phân công.

### Cách test
1. Đăng nhập `admin` → Quan sát góc phải Header thấy nhiệt độ thực, mô tả thời tiết và trạng thái lịch Việt Nam.
2. Bấm vào cụm nhiệt độ trên Header → Kiểm tra thông số thực (`độ ẩm`, `lượng mưa`, `gió`, dự báo 3 ngày tới).
3. Bấm **`Vị trí GPS`** (cho phép trình duyệt truy cập vị trí) → Nhiệt độ và tên vị trí cập nhật theo vị trí thực tế hiện tại.
4. Bấm **`Phạm vi`** chuyển từ `Toàn chuỗi` sang `Chi nhánh #2` → Toàn bộ số liệu Dashboard, Tồn kho, Dự báo, Cảnh báo tự lọc theo Chi nhánh #2.

---

## C. CHI TIẾT TÁC DỤNG & KỊCH BẢN TEST 9 TRANG NGHIỆP VỤ

### 01. Dashboard (`Tổng quan Toàn chuỗi`)
- **Tác dụng:** Cung cấp bức tranh vận hành thời gian thực dựa hoàn toàn trên số liệu thật trong SQL Server (không kẹp trần/sàn giả tạo):
  - **Nhóm KPI tài chính & vận hành:** Doanh số lũy kế/hôm nay, Tổng giá trị vốn tồn kho khả dụng, Vốn cận date rủi ro, Tỷ lệ lãng phí (`Spoilage Rate`), Tỷ lệ hao hụt (`Shrinkage`), Giá trị đã cứu qua giảm giá & điều chuyển (`Rescued Value`), Điểm đặt hàng ROP.
  - **Biểu đồ:** Phân bổ lô theo 4 vùng màu HSD (Xanh / Vàng / Đỏ / Quá hạn) và xu hướng Doanh thu vs Chi phí hủy 14 ngày.
  - **So sánh hiệu quả các chi nhánh** (Benchmark) & **Bảng hành động ưu tiên** gồm 4 tab: `Lô cận hạn cần xử lý`, `Phiếu điều chuyển chờ duyệt`, `Cảnh báo đặt hàng ROP`, `Hết hạn & Chờ duyệt hủy`.
- **Cách test:**
  1. Vào `01. Dashboard` bằng tài khoản `admin`.
  2. Chuyển 4 tab ở bảng hành động cuối trang → Kiểm tra có thể bấm xử lý nhanh **`Giảm giá`**, **`Đảo kệ`** ngay trên Dashboard.
  3. Đăng nhập `cashier` (`STAFF`) → Kiểm tra `01. Dashboard` mặc định bị ẩn khỏi Sidebar theo phân quyền `STAFF`.

---

### 02. Store Management (`Quản lý Chi nhánh`)
- **Tác dụng:** Quản trị thông tin các điểm bán trong chuỗi (mã cửa hàng, tên, địa chỉ dùng để geocode thời tiết thực, giờ mở cửa, sức chứa SKU/Units, ngưỡng `Min Inbound RSL %`, số ngày cảnh báo Vàng/Đỏ, Lead Time giao hàng, trạng thái `OPEN`/`SUSPENDED`). Tự động kích hoạt chế độ **1 cửa hàng** (ẩn `06. Stock Transfer`) nếu chuỗi chỉ còn 1 chi nhánh hoạt động. *(Xem giải thích chi tiết từng tham số trong khung **Tham số Vận hành & Ngưỡng An toàn** tại [Giai_thich_Tham_so_Van_hanh_Chi_nhanh.md](file:///c:/thuyet%20minh/Docs/Giai_thich_Tham_so_Van_hanh_Chi_nhanh.md)).*
- **Cách test:**
  1. Với `admin`: Bấm **`Thêm Chi nhánh mới`**, điền thông tin (ví dụ địa chỉ ở `TP. Hồ Chí Minh` hoặc `Hà Nội`) và lưu → Chi nhánh mới xuất hiện ở thẻ lưới và trong dropdown `Phạm vi` trên Header.
  2. Bấm **`Sửa`** trên một chi nhánh, đổi `Min Inbound RSL` hoặc giờ mở/đóng → Lưu và kiểm tra thẻ cập nhật đúng.
  3. Chuyển sang `manager`: chỉ sửa được chi nhánh của mình, không thấy nút thêm chi nhánh mới hoặc vô hiệu hóa chi nhánh khác.

---

### 03. Inventory Management (`Tồn kho, Lô hàng & Hạn sử dụng`)
Trang nghiệp vụ kho cốt lõi của `STAFF` & `MANAGER`, gồm **4 tab** và **2 nút thao tác nhanh** ở đầu trang:

#### Tab 1: `Kho lô & HSD`
- **Tác dụng:** Theo dõi từng lô hàng theo tuổi thọ thực tế (`NSX → HSD`, `RSL %`, tồn hiện tại / đầu vào, giá vốn / giá bán sau giảm) với 4 mức cảnh báo màu: Vùng Xanh, Vùng Vàng, Vùng Đỏ (`≤ 3 ngày`), Quá hạn (`Khóa bán`), kèm nút **`In tem`** nhãn lô.
- **Cách test:** Lọc theo màu (`Vùng Đỏ`, `Quá hạn`) và ô tìm kiếm SKU/mã lô → Kiểm tra trạng thái hiển thị khớp số ngày còn lại; bấm **`In tem`** xem tem nhãn nhiệt lô hàng.

#### Tab 2: `Nhập & Xuất bán` + Nút `Nhập kho` + Nút `Ghi nhận xuất bán`
- **Tác dụng:**
  - **Nhập kho & Kiểm soát `RSL ≥ 70%`:** Tiếp nhận hàng từ NCC/Kho (theo đơn PO hoặc nhập tự do). Hỗ trợ **tách mã vạch chuẩn GS1-128** (VD dán: `(01)08934567890101(17)261231(10)LOT01` để tự điền SKU, HSD, Số lô) hoặc **quét camera/mã vạch**. Chặn lưu nếu `RSL_inbound < 70%` và cho phép lập **Biên bản từ chối nhận hàng**.
  - **Ghi nhận xuất bán (FEFO):** Thay cho màn hình thu ngân rườm rà, cho phép ghi nhận xuất bán trực tiếp một sản phẩm tại chi nhánh chọn. Hệ thống tự động trừ tồn theo đúng nguyên tắc **FEFO** (hết hạn sớm nhất xuất trước, tự bẻ qua nhiều lô nếu 1 lô không đủ), cấm xuất lô `EXPIRED`, cấm âm kho, và lưu vết vào `sales_history` đúng `store_id`.
- **Cách test:**
  1. Bấm **`Nhập kho`**: thử nhập ngày sản xuất/hạn sử dụng sao cho `RSL < 70%` → Hệ thống chặn và báo lỗi RSL không đạt. Đổi HSD dài ra để `RSL ≥ 70%` → Nhập thành công, xuất hiện phiếu trong bảng `Phiếu nhập kho` và tăng tồn ở Tab 1.
  2. Trong modal **`Nhập kho`**, dán chuỗi `(01)08934567890101(17)271231(10)LOT-TEST-GS1` vào ô GS1-128 → Kiểm tra tự chọn đúng SKU, tự điền `batchCode = LOT-TEST-GS1` và `HSD = 2027-12-31`.
  3. Bấm **`Ghi nhận xuất bán`**, chọn 1 sản phẩm còn tồn, nhập số lượng → Xác nhận; kiểm tra giao dịch mới hiện trong bảng `Lịch sử xuất bán FEFO`, bấm **`Hóa đơn`** để xem chi tiết từng lô FEFO đã trừ.

#### Tab 3: `Kiểm kê & Xuất kho`
- **Tác dụng:** Thực hiện 2 nghiệp vụ kho hàng ngày:
  - **`Kiểm kê tồn thực tế (STOCKTAKE)`:** Nhập số đếm thực tế trên kệ; hệ thống khóa dòng (`UPDLOCK, ROWLOCK`), cập nhật tồn và ghi lại chênh lệch (+/-).
  - **`Xuất kho khác (STOCK_OUT)`:** Xuất mẫu/xuất nội bộ theo lô; **chặn lỗi 400** nếu nhập số lượng xuất vượt quá tồn lô (chống âm kho).
- **Cách test:**
  1. Chọn 1 lô đang có tồn, chọn `Kiểm kê tồn thực tế`, nhập số thực tế mới và lý do → Bấm **`Cập nhật kho`**. Kiểm tra lịch sử hiển thị `Trước → Sau`, `Chênh lệch`, `Người thực hiện`.
  2. Thử chọn `Xuất kho khác` với số lượng lớn hơn tồn hiện có của lô → Hệ thống báo lỗi từ chối và không trừ âm kho.

#### Tab 4: `Sản phẩm & Nhóm hàng`
- **Tác dụng:** Quản lý danh mục SKU (có trường **Quy cách `packSize` ĐV/kiện**, giá vốn, giá bán, hạn chuẩn, Min/Max Stock, ngưỡng cảnh báo Vàng), **chống trùng lặp SKU hoặc tên giống ≥ 85%**, và modal CRUD **`Nhóm hàng`** (tên nhóm, nhiệt độ bảo quản, ngưỡng cảnh báo mặc định; chặn xóa nhóm hàng đang có sản phẩm).
- **Cách test:**
  1. Bấm **`Thêm Sản phẩm`**, thử nhập tên giống một sản phẩm đang có → Kiểm tra bị chặn chống trùng. Nhập sản phẩm hợp lệ với `Quy cách = 12` → Lưu và kiểm tra bảng hiển thị `(12 ĐV/kiện)`.
  2. Bấm **`Nhóm hàng`** → Thử tạo/sửa nhóm hàng mới và kiểm tra danh sách ngành hàng cập nhật; thử xóa nhóm hàng đang chứa sản phẩm → Bị chặn hợp lệ.

---

### 04. AI Forecast (`Dự báo Sức mua 7 ngày`)
- **Tác dụng:** Tính toán sức mua 7 ngày tới cho từng SKU theo **dữ liệu bán thực tế 14 ngày trong SQL Server** kết hợp **thời tiết & ngày lễ thực tế từng ngày của 7 ngày tới (Open-Meteo + Nager.Date VN)** và tùy chọn **`Khuyến mãi (+15%)`**.
  - Tuyệt đối **trung thực dữ liệu**: SKU nào có 0 giao dịch trong 14 ngày gần nhất trả `d_base = 0`, `predictedSales7d = 0`, gắn nhãn `0 giao dịch 14d` / `Thiếu dữ liệu` (không tự bịa số bán).
  - **`Lưu dự báo`:** Lưu snapshot dự báo ngày hiện tại vào `dbo.ai_forecasts` để phục vụ đối chiếu sai số sau này.
  - **`Kiểm thử Model`:** Chạy mô hình Python `.pkl` trực tiếp trên các giao dịch thực tế trong SQL Server kèm nhiệt độ thực Open-Meteo ngay thời điểm bấm.
- **Cách test:**
  1. Bấm vào 1 sản phẩm có chữ `Bán thật 14d` (hoặc sau khi vừa bấm `Ghi nhận xuất bán` ở trang 03) → Quan sát biểu đồ 7 ngày phía trên hiển thị sản lượng, khoảng dao động, nhiệt độ Min–Max và % mưa từng ngày.
  2. Bấm bật/tắt **`Khuyến mãi (+15%)`** → Số liệu dự báo tăng/giảm tương ứng.
  3. Bấm **`Lưu dự báo`** → Nhận thông báo đã lưu snapshot thành công.
  4. Bấm **`Kiểm thử Model`** (với `admin`/`manager`) → Xem bảng kết quả chạy `.pkl` trên dữ liệu SQL Server & nhiệt độ thực tế hiện tại.

---

### 05. Smart Ordering (`Đề xuất Nhập hàng & Duyệt Đơn`)
- **Tác dụng:** Tính điểm đặt hàng `ROP = (d_adjusted × LeadTime) + SafetyStock`, tự động làm tròn số lượng đặt theo bội số quy cách đóng gói (`packSize`), trừ đi hàng đang trên đường về (PO chờ giao / Điều chuyển đang chạy), và **so sánh 3 phương án**:
  - **Phương án A:** Nhập mới từ Nhà cung cấp.
  - **Phương án B:** Điều chuyển nội bộ từ chi nhánh dư tồn (tự ẩn khi chạy chế độ 1 cửa hàng).
  - **Phương án C:** Cấp hàng từ Kho trung tâm (bật/tắt tại trang 09).
  - **Phương án Dừng nhập & Xả hàng:** Gợi ý khi phát hiện `DOS > DUE` (hàng tồn bán không kịp trước hạn).
  - **Kiểm soát hạn mức duyệt PO:** Nếu `MANAGER` duyệt đơn có tổng giá trị vượt `manager_po_approval_limit`, hệ thống chặn (`403 ERR_PO_EXCEEDS_MANAGER_LIMIT`) và yêu cầu `OWNER` phê duyệt.
- **Cách test:**
  1. Ở tab `Gợi ý Nhập hàng & So sánh Phương án`, bấm **`Giải thích`** trên 1 sản phẩm → Kiểm tra phương án khuyến nghị, số `packSize`, và chi phí từng phương án.
  2. Tích chọn 1–2 sản phẩm → Bấm **`Tạo đơn PO`** để lập đơn nháp `DRAFT`.
  3. Chuyển sang tab **`Danh sách & Duyệt Đơn PO`**: dùng `manager` duyệt một đơn giá trị nhỏ (thành công), và thử duyệt một đơn có tổng giá trị lớn hơn hạn mức Manager cấu hình ở trang 09 (bị chặn, phải đổi sang `admin` mới duyệt được).

---

### 06. Stock Transfer (`Điều chuyển Hàng hóa Nội bộ`)
- **Tác dụng:** Phát hiện chi nhánh **dư hàng/cận hạn** và chi nhánh **thiếu hàng** dựa trên tồn kho & sức mua thực tế 7 ngày, tự động chọn lô **FEFO còn tối thiểu ≥ 2 ngày HSD** để đề xuất điều chuyển nội bộ thay vì nhập mới hoặc bỏ hủy. Vận hành chặt quy trình **5 trạng thái**:
  `PROPOSED (Đề xuất)` → `PENDING (Chờ duyệt)` → `APPROVED (Đã duyệt)` → `IN_TRANSIT (Đang vận chuyển)` → `RECEIVED (Đã nhận)`.
  Chỉ khi chuyển sang `IN_TRANSIT` mới trừ kho xuất, và khi chuyển sang `RECEIVED` mới cộng lô tương ứng vào kho nhận. Hỗ trợ xem/in **Chứng từ 3 liên** (`1. Phiếu Xuất kho`, `2. Phiếu Vận chuyển`, `3. Phiếu Nhận hàng FEFO`) kèm cảnh báo nhiệt độ bảo quản.
- **Cách test:**
  1. Đăng nhập `admin`: Bấm **`Tạo đề xuất điều chuyển`** (hoặc chọn 1 gợi ý ở ma trận trên đầu trang nếu có), kiểm tra phiếu mới ở trạng thái `PROPOSED` chưa làm đổi tồn kho.
  2. Lần lượt bấm **`Gửi duyệt`** → **`Duyệt`** → **`Xuất kho đi`** (`IN_TRANSIT`, tồn kho chi nhánh gửi giảm) → **`Xác nhận đã nhận`** (`RECEIVED`, tồn kho chi nhánh nhận tăng và giữ nguyên HSD gốc của lô).
  3. Bấm nút **`Chứng từ`** trên phiếu để kiểm tra đủ 3 tab phiếu và thông tin nhiệt độ bảo quản.

---

### 07. Spoilage Alerts (`Cảnh báo Hết hạn & Xử lý Hủy`)
- **Tác dụng:** Tập trung toàn bộ các lô rủi ro cận hạn (Đỏ / Vàng / Chưa đảo kệ) và các lô đã hết hạn để xử lý triệt để:
  - **Tab 1 (`Lô Nguy cơ Hủy & Phương án Xử lý`):**
    - **`Giảm giá` (Quick Markdown):** Kích hoạt giảm `15% / 30% / 40% / 50%` ngay lập tức (áp dụng vào giá bán FEFO và in **Sticker giảm giá**).
    - **`Đảo kệ` (SOP 5 bước):** Nhân viên xác nhận điện tử đã kéo lô cận hạn ra mép mặt tiền kệ.
    - **`Tiêu hủy`:** Lập phiếu rút hủy hàng hỏng/quá hạn với lý do chuẩn (`Quá hạn`, `Hỏng bao bì`, `Lỗi chuỗi lạnh`, `Hao hụt kiểm kê`...). Nếu `STAFF` lập thì phiếu ở trạng thái `PENDING` chờ `MANAGER`/`OWNER` phê duyệt; nếu `MANAGER`/`OWNER` lập thì duyệt trực tiếp và trừ tồn kho + ghi nhận `CostLoss = Số lượng × Giá nhập`.
  - **Tab 2 (`Biên bản Tiêu hủy & Sổ Hao hụt`):** Lưu bất biến toàn bộ tổn thất tài chính (`CostLoss`), duyệt/hủy phiếu chờ và in biên bản tiêu hủy.
- **Cách test:**
  1. Ở Tab 1, lọc các lô `Vùng Vàng` hoặc `Vùng Đỏ`: bấm **`Giảm giá`** chọn `30%` → Giá bán của lô giảm ngay 30%; bấm **`Đảo kệ`** và xác nhận 5 bước → Trạng thái chuyển `Đã đảo kệ`.
  2. Đăng nhập `cashier` (`STAFF`), bấm **`Tiêu hủy`** 1 đơn vị ở lô `Quá hạn` → Phiếu vào Tab 2 ở trạng thái `PENDING` (Chờ duyệt).
  3. Đăng nhập `manager`, vào Tab 2 bấm **`Duyệt hủy`** → Tồn kho lô giảm tương ứng và tổng thiệt hại `CostLoss` cập nhật.

---

### 08. Reports & Analytics (`Báo cáo & Phân tích Hiệu quả`)
- **Tác dụng:** Tổng hợp 5 trụ cột đánh giá hiệu quả vận hành theo kỳ `7 / 14 / 30 / 90 ngày` (dùng hoàn toàn số liệu SQL Server, hỗ trợ xuất CSV Excel):
  1. **Sai số dự báo AI:** Walk-forward MAE, RMSE, MAPE, độ phủ dữ liệu (trung thực `Chưa đủ dữ liệu` nếu chưa đạt tối thiểu 7 ngày lịch sử bán).
  2. **Giá trị & Khối lượng hàng hủy:** Tổng tiền mất, số đơn vị hủy, `Spoilage Rate %`, top sản phẩm & nguyên nhân hủy nhiều nhất.
  3. **Tỷ lệ thiếu hàng & Cứu hàng:** `Actual Stockout Rate %` (SKU hết sạch tồn = 0), tỷ lệ chạm Min, tổng giá trị cứu được nhờ Quick Markdown & Điều chuyển.
  4. **Hiệu quả lập đơn PO:** Tổng số đơn, tỷ lệ hoàn tất, thời gian xử lý trung bình thực tế, tổng ngân sách.
  5. **Kinh tế điều phối & So sánh từng chi nhánh:** Doanh thu, chi phí hủy, giá trị cứu và lợi ích ròng theo chi nhánh.
- **Cách test:**
  1. Kiểm tra cả `admin` và `manager` đều mở được trang `08. Reports & Analytics` (`manager` chỉ thấy chi nhánh của mình; `admin` chuyển được giữa Toàn chuỗi và từng chi nhánh).
  2. Đổi kỳ phân tích `7 ngày` ↔ `30 ngày` → Số liệu thay đổi theo ngày dữ liệu thật trong SQL.
  3. Bấm **`Xuất Báo cáo (.CSV)`** → Tải file CSV mở kiểm tra bằng Excel có đủ tiếng Việt chuẩn UTF-8.

---

### 09. Settings & Integration (`Cài đặt & Tích hợp Hệ thống`)
Hợp nhất toàn bộ cấu hình quản trị vào **4 tab gọn**:

1. **Tab `Kết nối POS (Excel/CSV)`:**
   - **Tác dụng:** Đồng bộ hàng loạt dữ liệu bán hàng từ máy POS bên ngoài thông qua upload file **Excel `.xlsx`** hoặc **`.csv`** (tải file mẫu ngay trên màn hình, kiểm tra hợp lệ từng dòng SKU/SL/Giá trước khi ghi nhận và trừ kho FEFO).
   - **Cách test:** Bấm **`Tải File Mẫu POS (.CSV)`** (hoặc lưu thành file `.xlsx`), chọn tệp tải lên → Xem trước bảng kiểm tra hợp lệ (`Hợp lệ` / `Lỗi SKU`) → Bấm **`Xác nhận Đồng bộ vào kho FEFO`** → Quay lại trang `03` kiểm tra tồn kho đã trừ và hóa đơn mới đã xuất hiện.
2. **Tab `Tài khoản & Phân quyền`:**
   - **Tác dụng:** Quản lý nhân sự (`Tạo tài khoản`, `Sửa thông tin / vai trò / chi nhánh / ma trận quyền 9 trang`, `Khóa/Mở khóa`, `Đặt lại mật khẩu`).
   - **Cách test:** Tạo 1 tài khoản `STAFF` thử nghiệm, tích bỏ quyền trang `04. AI Forecast`, sau đó đăng nhập tài khoản vừa tạo → Sidebar tự ẩn `04. AI Forecast` và API chặn truy cập trang bị bỏ quyền (`403`).
3. **Tab `Nhà cung cấp / Kho`:**
   - **Tác dụng:** Thêm/sửa/xóa danh sách nhà cung cấp và kho trung tâm cung ứng cho chuỗi (gắn tên liên hệ, SĐT, địa chỉ, Lead Time).
   - **Cách test:** Thêm mới 1 nhà cung cấp → Kiểm tra nhà cung cấp mới hiển thị trong danh sách và có thể chọn khi lập đơn đặt hàng PO.
4. **Tab `Chuỗi & Nhật ký`:**
   - **Tác dụng:** `OWNER` cấu hình **Tên doanh nghiệp/chuỗi**, bật/tắt **Kho trung tâm (`hasCentralWarehouse`)**, tên kho trung tâm, **Hạn mức tối đa `MANAGER` được tự duyệt PO (`managerPoApprovalLimit`)**, và theo dõi **Nhật ký kiểm toán bất biến (`AuditLogs`)** cho mọi nghiệp vụ nhạy cảm (đăng nhập, nhập/xuất kho, kiểm kê, đổi giá, duyệt hủy, sửa cấu hình, phân quyền).
   - **Cách test:** Đặt hạn mức Manager PO xuống `500.000 đ` và lưu → Sang trang `05` dùng `manager` duyệt 1 đơn PO `> 500.000 đ` → Xác nhận bị chặn theo đúng hạn mức vừa lưu; sau đó quay lại Tab 4 kiểm tra dòng log `UPDATE_ENTERPRISE_CONFIG` trong Nhật ký kiểm toán.
