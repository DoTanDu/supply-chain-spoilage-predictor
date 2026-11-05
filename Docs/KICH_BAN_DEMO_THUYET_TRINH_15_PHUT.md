# KỊCH BẢN THUYẾT TRÌNH DEMO TRỰC TIẾP 15 PHÚT
## HỆ THỐNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ (LHU MART)
**(Supply Chain Spoilage Predictor - Demonstration Protocol)**

* **Đơn vị:** Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU).
* **Giảng viên hướng dẫn:** ThS. Lê Minh Nhật.
* **Nhóm sinh viên thực hiện:**
  - **Đỗ Tấn Du** (MSSV: 123001364) - Trình bày UI/UX, Quầy POS (Phím tắt & Cảm ứng Tablet), Quy trình Tiếp nhận DC & Giám sát FEFO, Bàn giao ca trực.
  - **Đoàn Minh Quân** (MSSV: 123000946) - Trình bày Kiến trúc Clean Architecture, Cơ sở dữ liệu 3NF, Thuật toán ROP & Ngoại cảnh, Sổ hao hụt tài chính & Kiểm toán bất biến.
* **Tổng thời lượng:** 15 phút (12 phút Demo thực nghiệm tương tác trực tiếp + 3 phút Trả lời phản biện Q&A Hội đồng).

---

## ⏱️ MA TRẬN PHÂN BỔ THỜI GIAN & PHÂN VAI (TIME MATRIX)

```
[00:00 - 02:00] Mở đầu & Bối cảnh đề tài Chống lãng phí ........ Du (2.0 phút)
[02:00 - 04:00] Kiến trúc Clean Architecture & CSDL 3NF ....... Quân (2.0 phút)
[04:00 - 06:30] Demo Live: POS FEFO, Phím tắt F1-F9 & Tablet ... Du (2.5 phút)
[06:30 - 08:30] Demo Live: Tiếp nhận DC, RSL Gauge & Sổ GR .... Du (2.0 phút)
[08:30 - 10:30] Demo Live: Dự báo ROP Đa biến & Đơn PO ........ Quân (2.0 phút)
[10:30 - 12:00] Demo Live: Bàn giao ca trực, Sổ hao hụt & Audit .. Cả 2 (1.5 phút)
[12:00 - 15:00] Tổng kết & Bảo vệ phản biện trước Hội đồng ..... Cả 2 (3.0 phút)
```

---

## 🎬 KỊCH BẢN CHI TIẾT TỪNG PHÚT (STEP-BY-STEP PLAYBOOK)

### PHẦN 1: MỞ ĐẦU & BỐI CẢNH BÀI TOÁN (00:00 - 02:00)
* **Người trình bày:** Đỗ Tấn Du
* **Màn hình hiển thị:** [Dashboard Điều hành](file:///c:/thuyet%20minh/Frontend/src/components/ExecutiveDashboardView.jsx) (URL: `http://localhost:5173/`)
* **Lời thoại kỹ thuật:**
  > *"Kính thưa Thầy Lê Minh Nhật và quý Thầy Cô trong Hội đồng phản biện. Hôm nay, nhóm chúng em xin được báo cáo và demo thực nghiệm đề tài: **Nền tảng Quản trị Chuỗi cung ứng Bán lẻ Chống lãng phí (LHU Mart)**.*  
  > *Trong ngành bán lẻ hàng tiêu dùng nhanh (FMCG), lãng phí thực phẩm và hàng cận date chiếm từ 3% đến 8% doanh thu. Nguyên nhân cốt lõi là các phần mềm POS truyền thống chỉ quản lý tồn kho theo số lượng tổng, không theo dõi vòng đời từng lô hàng (Shelf-Life), không xuất kho theo FEFO và không có công cụ tự động phát hiện rủi ro ứ đọng.*  
  > *Hệ thống LHU Mart được thiết kế theo mô hình **Một Cửa hàng Bán lẻ Tinh gọn duy nhất** (`RETAIL-STORE-01`) liên kết trực tiếp với **Trung tâm Phân phối Kho tổng DC Biên Hòa**, áp dụng triệt để **11 Quy tắc Nghiệp vụ Cốt lõi** nhằm chặn đứng lãng phí từ khâu nhập kho, bày kệ cho đến quầy tính tiền."*
* **Thao tác trên màn hình:**
  - Chỉ vào 6 thẻ chỉ số tài chính: **Vốn tồn kho**, **Vốn nguy kịch cận date (Vùng Đỏ)**, **Doanh thu trong ngày**, **Giá trị hủy hàng**.
  - Cuộn xuống khu vực **Action Board Ca trực khẩn cấp** để chứng minh tính thực tế trong việc tự động giao việc đầu ca cho nhân viên quầy kệ và thu ngân.

---

### PHẦN 2: KIẾN TRÚC CLEAN ARCHITECTURE & CƠ SỞ DỮ LIỆU (02:00 - 04:00)
* **Người trình bày:** Đoàn Minh Quân
* **Màn hình hiển thị:** Cấu trúc mã nguồn `Backend/src/` trong Antigravity IDE và Microsoft SQL Server LocalDB.
* **Lời thoại kỹ thuật:**
  > *"Về mặt công nghệ, dự án được xây dựng theo **Clean Architecture 4 tầng** chuẩn mực, tuân thủ nguyên lý Đảo ngược phụ thuộc (DIP):*  
  > *1. **Tầng Domain:** Chứa các Entity thuần túy (`Product`, `Batch`, `Supplier`, `GoodsReceipt`) và các Domain Services bất biến như `FefoAllocationPolicy` (chính sách phân bổ FEFO), `RopCalculationService` (dự báo điểm đặt hàng), `FreshnessStandardService` (kiểm định RSL DC).*  
  > *2. **Tầng Application:** Cung cấp Use Cases độc lập: `ProcessFefoSaleUseCase`, `ReceiveDCBatchUseCase`, `CalculateROPForecastUseCase`, `PerformShiftHandoverUseCase`.*  
  > *3. **Tầng Infrastructure:** Tương tác với Microsoft SQL Server LocalDB chuẩn 3NF (13 bảng), sử dụng Transaction có khóa `UPDLOCK, ROWLOCK`, Trigger chống âm kho và các Covered Indexes (`IX_Batches_FEFO`, `IX_Batches_ExpiryWatchdog`) đạt độ trễ truy vấn dưới 5ms.*  
  > *4. **Tầng Presentation:** Cung cấp RESTful API có hệ thống kiểm soát quyền hạn RBAC 4 cấp, bắt lỗi dữ liệu đầu vào và ghi log kiểm toán bất biến."*
* **Thao tác trên màn hình:**
  - Mở file [FefoAllocationPolicy.js](file:///c:/thuyet%20minh/Backend/src/domain/services/FefoAllocationPolicy.js) làm nổi bật thuật toán phân bổ lô cận date trước và bẻ đơn hàng.
  - Mở SSMS hoặc terminal chứng minh 13 bảng CSDL chuẩn 3NF và snapshot sao lưu tự động `Database/backups/retail_spoilage_db_master_seed.bak`.

---

### PHẦN 3: DEMO LIVE - QUẦY THU NGÂN POS: FEFO, PHÍM TẮT & CẢM ỨNG TABLET (04:00 - 06:30)
* **Người trình bày:** Đỗ Tấn Du
* **Màn hình hiển thị:** [Quầy Bán lẻ POS](file:///c:/thuyet%20minh/Frontend/src/components/PosCheckoutView.jsx) (`http://localhost:5173/`)
* **Lời thoại kỹ thuật:**
  > *"Em xin demo màn hình POS Bán lẻ tại quầy. POS LHU Mart thực thi nguyên tắc: **Bán hàng = Xuất kho trực tiếp theo FEFO (Rule 2)** kết hợp trải nghiệm thu ngân siêu tốc:*  
  > *1. **Thao tác hoàn toàn bằng Phím tắt (F1 - F9):** Thu ngân không cần dùng chuột:*  
  >   - *Bấm **F2**: Focus ngay vào ô quét mã SKU/BarCode.*  
  >   - *Bấm **F4**: Nhảy đến ô Tiền khách đưa.*  
  >   - *Bấm **F8**: Điền nhanh số tiền khách đưa vừa đủ.*  
  >   - *Bấm **F9** hoặc **Ctrl + Enter**: Thanh toán & Xuất kho FEFO tức thì.*  
  >   - *Bấm **F1**: Mở popup hướng dẫn phím tắt.*  
  > *2. **Tự động bẻ lô thông minh:** Em chọn mua sản phẩm **'Sữa tươi Vinamilk 100%'** với số lượng 19 hộp. Lô 1 cận date chỉ còn 15 hộp, Lô 2 còn 4 hộp. Hệ thống tự động phân bổ 15 hộp vào Lô 1 và bẻ 4 hộp còn lại qua Lô 2.*  
  > *3. **Hỗ trợ Máy tính bảng (Tablet Mode):** Giao diện tự động co giãn Responsive, kích thước nút bấm đạt chuẩn công thái học $\ge 48\text{px}$, tích hợp bàn phím số cảm ứng và thanh trạng thái giám sát kết nối mạng Online/Offline theo thời gian thực."*
* **Thao tác trên màn hình:**
  - Bấm phím **F1** để hiện bảng hướng dẫn phím tắt quầy thu ngân.
  - Bấm **F2**, quét/chọn sản phẩm Sữa tươi Vinamilk, tăng số lượng lên 19 hộp.
  - Rê chuột vào chi tiết phân bổ lô trong giỏ hàng để Hội đồng thấy hệ thống tự động bẻ lô.
  - Bấm **F4**, bấm **F8** (điền tiền đủ), bấm **F9** để thanh toán.
  - Thu nhỏ màn hình trình duyệt sang kích thước iPad/Tablet để biểu diễn giao diện cảm ứng và Shortcut Bar phía dưới.

---

### PHẦN 4: DEMO LIVE - TIẾP NHẬN DC, THƯỚC ĐO RSL & SỔ BIÊN BẢN (06:30 - 08:30)
* **Người trình bày:** Đỗ Tấn Du
* **Màn hình hiển thị:** [Tiếp nhận hàng DC & Sổ biên bản](file:///c:/thuyet%20minh/Frontend/src/components/GoodsReceiptView.jsx)
* **Lời thoại kỹ thuật:**
  > *"Tiếp theo là phân hệ **Tiếp nhận hàng từ Kho tổng DC Biên Hòa (Rule 7)**. Một vấn nạn lớn ở siêu thị là kho tổng hay đẩy hàng cận date về cửa hàng.*  
  > *Chúng em tích hợp **Thước đo độ tươi RSL Freshness Gauge** theo công thức đặc tả:*  
  > $$RSL_{inbound} = \frac{\text{HSD} - \text{Ngày nhập}}{\text{HSD} - \text{NSX}} \times 100\%$$  
  > *Nếu tài xế giao lô có HSD còn lại dưới 70%, thước đo chuyển màu đỏ, hệ thống khóa cứng nút tiếp nhận và hiển thị lý do từ chối để bảo vệ cửa hàng.*  
  > *Khi lô hàng đạt tiêu chuẩn trên 70% (ví dụ ở đây đạt 86%), thước đo báo xanh an toàn và cho phép bấm nhận hàng, tự động tạo mã biên bản `GR-DC-...` và nạp lô vào kho.*  
  > *Toàn bộ các lô tiếp nhận được lưu vào **Sổ Biên Bản Nhận Hàng**, hỗ trợ lọc theo trạng thái và xuất file CSV/Excel phục vụ thanh tra kho."*
* **Thao tác trên màn hình:**
  - Chọn sản phẩm, chỉnh ngày hết hạn gần để chứng minh $RSL < 70\%$ bị hệ thống chặn lưu kèm thông báo cảnh báo.
  - Chỉnh lại ngày HSD đạt chuẩn $RSL = 86\%$, bấm **"Tiếp nhận hàng"** thành công.
  - Chuyển sang Tab/Khu vực **Sổ Biên bản Nhận Hàng (Goods Receipts)**, chỉ vào biên bản `GR-DC-...` vừa tạo, bấm nút **"Xuất CSV"** tải về file đối soát.

---

### PHẦN 5: DEMO LIVE - DỰ BÁO ROP TÍCH HỢP NGOẠI CẢNH & ĐƠN ĐẶT HÀNG PO (08:30 - 10:30)
* **Người trình bày:** Đoàn Minh Quân
* **Màn hình hiển thị:** [Dự báo ROP & Đơn DC](file:///c:/thuyet%20minh/Frontend/src/components/RopForecastView.jsx)
* **Lời thoại kỹ thuật:**
  > *"Em xin trình bày phân hệ cốt lõi nhất của đề tài: **Thuật toán Dự báo Điểm đặt hàng ROP đa biến (Rule 8)**.*  
  > *Công thức tính toán của hệ thống:*  
  > $$ROP = (d_{adjusted} \times LeadTime) + SafetyStock$$  
  > *Trong đó, $d_{adjusted}$ là tốc độ bán bình quân 14 ngày được hiệu chỉnh bởi Hệ số Thời tiết ($W$) và Hệ số Ngày lễ ($H$).*  
  > *Đặc biệt, hệ thống tích hợp thuật toán phát hiện **Rủi ro ứ đọng quá hạn (DOS > DUE)**: Nếu số ngày cần để tiêu thụ hết tồn kho ($DOS$) lớn hơn số ngày còn lại của lô cận date ($DUE$), hệ thống sẽ bật cảnh báo đỏ nguy cơ ứ đọng và tự động giảm 50% số lượng đặt hàng đề xuất.*  
  > *Cửa hàng trưởng chỉ cần bấm 1 chạm **'Tạo Đơn Hàng PO'**, hệ thống tự động tổng hợp các sản phẩm dưới ngưỡng ROP gửi về DC Biên Hòa với thời gian giao hàng (Lead Time) được tính toán tự động từ danh mục Nhà cung ứng."*
* **Thao tác trên màn hình:**
  - Bật/tắt cờ Ngày lễ và chọn thời tiết Mưa/Nắng, chỉ vào sự biến thiên của $d_{adjusted}$ và cột $ROP$.
  - Trỏ vào dòng sản phẩm có nhãn cảnh báo màu đỏ $DOS > DUE$.
  - Bấm nút **"Tạo Đơn Đặt Hàng Gửi DC"**, hệ thống sinh mã đơn `PO-DC-...` và chuyển trạng thái sang `ORDERED`.

---

### PHẦN 6: DEMO LIVE - BÀN GIAO CA TRỰC, CHẾ TÀI 15.2, SỔ HAO HỤT & AUDIT LOGS (10:30 - 12:00)
* **Người trình bày:** Đỗ Tấn Du & Đoàn Minh Quân
* **Màn hình hiển thị:** [Bàn giao ca trực Shift Handover](file:///c:/thuyet%20minh/Frontend/src/components/ShiftHandoverModal.jsx), [Sổ Hao hụt](file:///c:/thuyet%20minh/Frontend/src/components/DisposalSpoilageView.jsx) và [Nhật ký kiểm toán](file:///c:/thuyet%20minh/Frontend/src/components/AuditLogView.jsx)
* **Lời thoại kỹ thuật:**
  > *"Để quản trị vận hành khép kín, hệ thống cung cấp 3 lớp giám sát minh bạch:*  
  > *1. **Bàn giao ca trực điện tử 4 bước & Chế tài Mục 15.2:** Cuối ca, thu ngân đối soát tiền mặt (`actualCash` vs `expectedCash`). Nếu có chênh lệch, hệ thống áp dụng chế tài tự động:*  
  >   - *Lệch $\le 50.000$đ: Cảnh báo nhắc nhở nội bộ.*  
  >   - *Lệch $50.000$đ - $200.000$đ: Bắt buộc lập biên bản giải trình.*  
  >   - *Lệch $> 200.000$đ: Chế tài mức 3 - Đình chỉ quầy thu ngân và lập phiếu bồi hoàn trừ lương.*  
  > *2. **Sổ hao hụt tài chính bất biến (Rule 6):** Khi một lô hàng bị hỏng hoặc hết hạn buộc phải tiêu hủy, hệ thống tính chính xác thiệt hại $CostLoss = Quantity \times ImportPrice$. Bảng `SpoilageRecords` được bảo vệ bất biến, không thể sửa/xóa.*  
  > *3. **Nhật ký kiểm toán bất biến (Rule 11):** Mọi thao tác từ bán hàng, nhập kho DC, giao ca, đổi giá Markdown đến tiêu hủy đều được lưu vào `AuditLogs` kèm User ID, thời gian và địa chỉ IP."*
* **Thao tác trên màn hình:**
  - Bấm vào nút **"Bàn giao ca trực"**, nhập thử số tiền thực tế lệch 75.000đ để Hội đồng thấy hệ thống bật Chế tài mức 2 (Yêu cầu giải trình).
  - Mở màn hình Sổ hao hụt, chỉ vào các dòng thiệt hại tài chính.
  - Mở Nhật ký kiểm toán, lọc theo các sự kiện vừa diễn ra trong buổi demo.

---

### PHẦN 7: TỔNG KẾT & BẢO VỆ PHẢN BIỆN TRƯỚC HỘI ĐỒNG (12:00 - 15:00)
* **Người trình bày:** Đỗ Tấn Du & Đoàn Minh Quân
* **Lời thoại kỹ thuật:**
  > *"Kính thưa Thầy Cô trong Hội đồng, toàn bộ kịch bản 12 phút vừa rồi đã chứng minh hệ thống LHU Mart vận hành 100% trên cơ sở dữ liệu Microsoft SQL Server LocalDB thật, vượt qua trọn vẹn bộ kiểm thử tự động **40/40 E2E tests** bao phủ 11 Quy tắc Nghiệp vụ Cốt lõi.*  
  > *Dự án không dừng lại ở mức đồ án lý thuyết mà có tính ứng dụng thực tế cao cho các chuỗi siêu thị vừa và nhỏ, mang lại giá trị kép: Tối đa hóa lợi nhuận cho nhà bán lẻ và bảo vệ môi trường nhờ giảm thiểu lãng phí thực phẩm.*  
  > *Chúng em xin chân thành cảm ơn ThS. Lê Minh Nhật đã tận tình hướng dẫn và xin trân trọng kính mời quý Thầy Cô trong Hội đồng đặt câu hỏi phản biện!"*

---

## ❓ DỰ BÁO CÁC CÂU HỎI HỘI ĐỒNG THƯỜNG HỎI & CÁCH TRẢ LỜI CHUẨN XÁC

| Câu hỏi của Hội đồng | Hướng trả lời kỹ thuật chuẩn xác |
| :--- | :--- |
| **Q1: Tại sao không dùng FIFO mà bắt buộc dùng FEFO?** | Trong bán lẻ FMCG, các lô nhập sau đôi khi lại có HSD ngắn hơn do nhà sản xuất hoặc xe giao hàng. Nếu xuất theo FIFO (nhập trước xuất trước) sẽ để sót các lô có HSD ngắn hơn ở phía sau kệ, dẫn đến hết hạn gây lãng phí. FEFO đảm bảo lô nào cận date nhất phải được bán ra trước tiên. |
| **Q2: Nếu khách hàng ở siêu thị tự ý bới lấy lô date xa ở phía sau kệ thì sao?** | Hệ thống giải quyết bằng Rule 10: **SOP Đảo kệ mặt tiền 5 bước** và **Quick Markdown (15% - 50%)**. Nhân viên đảo lô cận date ra sát mép kệ và dán nhãn giảm giá xả hàng để kích cầu người tiêu dùng mua lô cận date trước. |
| **Q3: Cơ chế chống âm kho hoạt động như thế nào khi nhiều quầy POS cùng bán?** | Backend sử dụng SQL Transaction với gợi ý khóa `WITH (UPDLOCK, ROWLOCK)` trên từng dòng lô hàng, kết hợp ràng buộc CHECK `current_quantity >= 0` và Trigger tại tầng CSDL. Nếu số lượng mua vượt tồn khả dụng còn hạn, Transaction sẽ rollback ngay lập tức và trả về HTTP 400. |
| **Q4: Làm sao hệ thống đảm bảo dữ liệu không bị sai lệch sau buổi demo?** | Nhóm đã xây dựng cơ chế sao lưu snapshot `retail_spoilage_db_master_seed.bak` và script tự động `seed_clean_demo_data.js`. Sau mỗi lượt kiểm thử hoặc demo, CSDL được khôi phục nguyên trạng 100% chỉ trong 1.5 giây. |
| **Q5: Xử lý thế nào khi thu ngân làm lệch tiền mặt cuối ca?** | Hệ thống áp dụng quy trình Bàn giao ca trực điện tử 4 bước và **3 chế tài kỷ luật tự động theo Mục 15.2 của Đặc tả**: Lệch $\le 50k$ nhắc nhở nội bộ; lệch $50k - 200k$ lập biên bản giải trình có chữ ký Cửa hàng trưởng; lệch $> 200k$ lập tức khóa quyền thu ngân và xuất phiếu trừ lương bồi hoàn. |
| **Q6: Giao diện POS có dùng được trên máy tính bảng hoặc khi rớt mạng không?** | POS LHU Mart được thiết kế theo chuẩn Responsive Tablet Touch với kích thước nút bấm tối thiểu 48px và phím số cảm ứng tích hợp. Đồng thời, hệ thống có thanh Shortcut Bar phím tắt nhanh (F1-F9) và module giám sát mạng liên tục hiển thị trạng thái Online/Offline. |
| **Q7: Tại sao hệ thống chặn không cho xóa Nhà cung ứng khi còn sản phẩm?** | Đây là cơ chế bảo vệ toàn vẹn tham chiếu (Referential Integrity) ở tầng Domain và Database. Nếu xóa nhà cung ứng đang cung cấp sản phẩm hoặc có đơn PO đang xử lý, toàn bộ chuỗi cung ứng và lịch sử truy xuất nguồn gốc (Traceability) sẽ bị đứt gãy. Do đó hệ thống bắt buộc chuyển trạng thái Inactive thay vì xóa cứng. |
