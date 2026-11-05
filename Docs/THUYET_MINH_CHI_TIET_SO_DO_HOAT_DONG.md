# THUYẾT MINH CHI TIẾT SƠ ĐỒ HOẠT ĐỘNG (UML ACTIVITY DIAGRAM)
## QUY TRÌNH THAO TÁC CHUẨN (SOP) VẬN HÀNH BÁN LẺ & CHỐNG LÃNG PHÍ

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

## 1. GIỚI THIỆU TỔNG QUAN VỀ SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM)

Trong tài liệu đặc tả hệ thống thông tin và quản trị chuỗi cung ứng, Sơ đồ Hoạt động (UML Activity Diagram) đóng vai trò chuẩn hóa quy trình công việc (Business Process Modeling). Sơ đồ phân làn trách nhiệm rõ ràng (Swimlanes) giữa các chủ thể tham gia, chỉ rõ từng hành động (Action State), nút rẽ nhánh quyết định (Decision Node), điểm bắt đầu (Initial Node) và điểm kết thúc (Activity Final Node).

Hệ thống Supply Chain Spoilage Predictor xây dựng Sơ đồ Hoạt động cho 2 quy trình vận hành mang tính kỷ luật cốt lõi:
1. **Quy trình 1: Quy trình 5 bước Giảm giá Quick Markdown & Đảo lô mặt tiền kệ trưng bày (Mục 10 & Rule 4, 10 trong Đặc tả SSOT).**
2. **Quy trình 2: Quy trình 4 bước Bàn giao Ca trực & Đối soát Tài chính Hao hụt (Mục 15 & Module Quản lý Ca trực).**

---

## 2. QUY TRÌNH 1: GIẢM GIÁ QUICK MARKDOWN & ĐẢO LÔ MẶT TIỀN KỆ TRƯNG BÀY (5 BƯỚC SOP)

### 2.1. Hình ảnh Sơ đồ Hoạt động Quy trình 1
*(Xem Panel 1 trong file ảnh chất lượng cao: `Docs/Diagram_Images/activity_sop_workflows.png`)*

### 2.2. Mục tiêu Nghiệp vụ
* Triệt để giải phóng các lô hàng chạm **Vùng Vàng** ($3 < DaysLeft \le WarningDays$) và **Vùng Đỏ** ($0 < DaysLeft \le 3$) trước khi hết hạn sử dụng.
* Kích cầu người tiêu dùng tại quầy kệ bằng mức chiết khấu linh hoạt 15%, 30%, 40%, 50% theo nguyên tắc: *"Thà bán giảm giá thu hồi vốn còn hơn để quá date mất trắng 100% chi phí nhập hàng"*.
* Phân làn trách nhiệm (Swimlanes):
  * **Làn 1 - Cửa hàng trưởng (Store Manager):** Thẩm định rủi ro, ra quyết định tỷ lệ giảm giá và kích hoạt Quick Markdown trên hệ thống.
  * **Làn 2 - Nhân viên quầy kệ (Floor Staff):** Thực thi đảo vị trí vật lý hàng hóa trên quầy kệ, dán tem nhãn khuyến mãi và xác nhận điện tử.

### 2.3. Bảng phân tích chi tiết 5 bước thao tác chuẩn (SOP Steps)

| Bước | Làn thực hiện | Tên hành động | Chi tiết thao tác & Ràng buộc kỹ thuật |
| :---: | :--- | :--- | :--- |
| **1** | Cửa hàng trưởng | **Quét cảnh báo ca trực** | Truy cập Action Board ca trực, lọc danh sách các lô hàng đang chạm Vùng Vàng hoặc Vùng Đỏ cần hành động khẩn cấp. |
| **-** | Cửa hàng trưởng | **Nút quyết định (Decision)** | Thẩm định số ngày còn lại ($DaysLeft$):<br>• Nếu Vùng Vàng (4-7 ngày): Chọn mức giảm 15% - 30%.<br>• Nếu Vùng Đỏ (1-3 ngày): Chọn mức giảm 40% - 50% để xả hàng kịch sàn trong ngày. |
| **2** | Cửa hàng trưởng | **Kích hoạt Quick Markdown** | Nhập tỷ lệ giảm giá trên giao diện và bấm xác nhận. Backend cập nhật `DiscountPercent` vào bảng `Batches`. API đồng bộ giá mới tức thì tại quầy thu ngân POS. |
| **3** | Nhân viên quầy kệ | **Đảo lô hàng mặt tiền** | Nhận thông báo lệnh đảo kệ trên thiết bị di động/màn hình tác nghiệp. Đến kệ hàng, rút các sản phẩm có date xa vào phía trong, xếp toàn bộ lô cận date ra hàng đầu mặt tiền để khách hàng tiếp cận trước. |
| **4** | Nhân viên quầy kệ | **Dán tem nhãn giảm giá** | Dán sticker màu bắt mắt *"Khuyến mãi xả hàng 15% - 50%"* lên bao bì sản phẩm và đặt wobbler ưu đãi tại kệ. |
| **5** | Nhân viên quầy kệ | **Xác nhận điện tử trên app** | Nhấn nút *"Đã hoàn tất đảo kệ"* trên ứng dụng. Hệ thống gỡ bỏ cờ cảnh báo *"Chưa đảo kệ"*, chuyển trạng thái `is_shelf_rotated = 1` và ghi nhận nhật ký kiểm toán `ROTATE_SHELF_FEFO` vào `AuditLogs`. |

---

## 3. QUY TRÌNH 2: BÀN GIAO CA TRỰC & ĐỐI SOÁT TÀI CHÍNH HAO HỤT (4 BƯỚC SOP)

### 3.1. Hình ảnh Sơ đồ Hoạt động Quy trình 2
*(Xem Panel 2 trong file ảnh chất lượng cao: `Docs/Diagram_Images/activity_sop_workflows.png`)*

### 3.2. Mục tiêu Nghiệp vụ
* Đảm bảo tính minh bạch, chống thất thoát quỹ tiền mặt và quy trách nhiệm rõ ràng giữa các ca làm việc.
* Đối soát độc lập giữa **Số tiền mặt thực tế trong két** với **Tổng doanh thu bán hàng ghi nhận trên hệ thống POS**.
* Bàn giao nguyên trạng tình trạng hàng hóa cận date, các lô đang áp dụng Quick Markdown và số lượng hàng hóa đã hủy ghi trong **Sổ hao hụt tài chính**.
* Phân làn trách nhiệm (Swimlanes):
  * **Làn 1 - Thu ngân kết ca (Outgoing Cashier):** Kiểm đếm tiền két, kê khai số liệu và giải trình chênh lệch (nếu có).
  * **Làn 2 - Thu ngân nhận ca & Quản lý (Incoming Cashier & Manager):** Kiểm tra đối soát hiện vật, tiếp nhận quỹ tiền và ký duyệt biên bản điện tử.

### 3.3. Bảng phân tích chi tiết 4 bước thao tác chuẩn (SOP Steps)

| Bước | Làn thực hiện | Tên hành động | Chi tiết thao tác & Ràng buộc kỹ thuật |
| :---: | :--- | :--- | :--- |
| **1** | Thu ngân kết ca | **Kiểm đếm tiền mặt két** | Thu ngân kiểm đếm thực tế tiền mặt tại quầy thu ngân (phân loại mệnh giá), nhập số tiền đếm được vào form Chốt ca điện tử. |
| **2** | Hệ thống & Thu ngân | **Đối soát doanh thu POS** | Hệ thống tự động so khớp Tiền thực tế vs Doanh thu máy tính. Tính toán độ lệch $Discrepancy = CashActual - SystemSales$.<br>• Nếu khớp ($= 0$đ): Chuyển tiếp sang bước 3.<br>• Nếu lệch ($\ne 0$đ): Thu ngân bắt buộc nhập lý do giải trình (ví dụ: trả nhầm tiền thừa, tiền rách đổi khách...). |
| **3** | Hai bên cùng làm | **Kiểm đếm hàng cận date & Sổ hao hụt** | Thu ngân ca cũ và ca mới cùng đi rà soát danh sách sản phẩm Vùng Vàng / Vùng Đỏ trên quầy kệ. Đối soát các mặt hàng đã lập biên bản tiêu hủy trong ca xem có khớp với Sổ hao hụt tài chính không. |
| **4** | Thu ngân mới & Quản lý | **Ký biên bản điện tử** | Cả hai nhân viên cùng Cửa hàng trưởng xác nhận ký số biên bản bàn giao điện tử, đồng thời cam kết tuân thủ 3 chế tài kỷ luật Mục 15.2 (bồi thường 100% nếu lọt hàng hết hạn cho khách, trừ điểm chuyên cần nếu không đảo kệ mặt tiền, đền 100% giá trị vốn nếu tự ý vứt bỏ hàng không lập phiếu). |
| **-** | Hệ thống | **Ghi nhận Audit Log bất biến** | Lưu trữ toàn bộ biên bản bàn giao ca vào bảng `AuditLogs`, đóng phiên làm việc của ca cũ, chuyển giao quyền truy cập POS cho ca mới an toàn. |

---

## 4. KẾT LUẬN VÀ GIÁ TRỊ THỰC TIỄN CỦA SƠ ĐỒ HOẠT ĐỘNG

1. **Chuẩn hóa kỷ luật vận hành bán lẻ:** Biến các quy tắc lý thuyết thành quy trình thao tác chuẩn (SOP) từng bước rõ ràng, giúp nhân viên cửa hàng không thể làm tắt hoặc bỏ sót bước đảo kệ/kiểm tiền.
2. **Minh bạch tài chính tuyệt đối:** Bất kỳ khoản chênh lệch tiền két hay sản phẩm tiêu hủy nào đều phải được giải trình và lưu vết bất biến trong Audit Log.
3. **Đóng góp học thuật đồ án tốt nghiệp:** Bộ sơ đồ hoạt động phân làn (Swimlane Activity Diagrams) hoàn thiện trọn vẹn bộ hồ sơ thiết kế kỹ thuật của đề tài, thể hiện tư duy quản trị vận hành kết hợp kỹ thuật phần mềm xuất sắc của 2 sinh viên Đỗ Tấn Du & Đoàn Minh Quân.
