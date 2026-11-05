# HƯỚNG DẪN TRẢI NGHIỆM & DEMO HỆ THỐNG LHU MART
### Nền tảng Quản trị Chuỗi cung ứng Bán lẻ Chống lãng phí (Supply Chain Spoilage Predictor)
### Đơn vị: Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU)
### Sinh viên thực hiện: Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946)

---

## 1. Cách Khởi Động & Tắt Hệ Thống 1-Click

* **Khởi động toàn bộ hệ thống:** Nhấp đúp chuột vào tập tin:
  ```bash
  start_lhu_mart.bat
  ```
  *(Hệ thống sẽ tự động bật SQL Server LocalDB, Backend API cổng 5000, Frontend Web cổng 5173 và tự động mở trình duyệt Chrome đến trang đăng nhập).*
* **Tắt toàn bộ hệ thống:** Nhấp đúp chuột vào tập tin:
  ```bash
  stop_lhu_mart.bat
  ```

---

## 2. Bảng 4 Tài Khoản Đăng Nhập Chuẩn (RBAC SSOT)

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn nghiệp vụ cốt lõi |
| :--- | :--- | :--- | :--- |
| **Quản trị viên Tối cao** (`ADMIN`) | `admin` | `Password123@` | Toàn quyền cấu hình cửa hàng, quản lý nhân sự, phân quyền RBAC, mở khóa tài khoản bị Brute-force, xem toàn bộ hệ thống. |
| **Cửa hàng trưởng** (`STORE_MANAGER`) | `manager` | `Password123@` | Xem Dashboard điều hành Visual Analytics 14 ngày, duyệt biên bản tiêu hủy Spoilage (SoD), duyệt đơn đặt hàng PO gửi DC Biên Hòa, áp dụng Quick Markdown. |
| **Thu ngân Quầy POS** (`CASHIER`) | `cashier` | `Password123@` | Bán lẻ xuất kho trực tiếp theo chuẩn FEFO (tự động bẻ lô cận date), in hóa đơn, tra cứu lịch sử bán hàng, thực hiện Bàn giao ca trực điện tử 4 bước. |
| **Nhân viên Kho & Kệ** (`CASHIER`) | `warehouse` | `Password123@` | Thẩm định tiếp nhận xe tải DC ($RSL \ge 70\%$), lập biên bản từ chối nhận hàng ($RSL < 70\%$), thực hiện SOP 5 bước đảo kệ mặt tiền, lập phiếu đề xuất tiêu hủy hàng hỏng. |

---

## 3. Kịch Bản 10 Phút Trải Nghiệm 11 Phân Hệ Cốt Lõi Trên Giao Diện

### Bước 1: Trải nghiệm Bảo mật Đăng nhập & Chống Brute-force (Mục 22.3)
1. Truy cập `http://localhost:5173/login`.
2. Nhập sai mật khẩu liên tiếp 5 lần đối với một tài khoản bất kỳ.
3. **Hiện tượng quan sát:** Hệ thống lập tức kích hoạt khóa cứng tài khoản, thông báo rõ số lần sai và ghi vết cảnh báo đỏ vào Sổ Nhật ký Kiểm toán `AuditLogs`.
4. Đăng nhập bằng tài khoản `admin` / `Password123@` $\to$ Vào mục **"Quản Trị Người Dùng"** $\to$ Bấm nút **"Mở khóa"** để phục hồi trạng thái hoạt động tức thì.

### Bước 2: Dashboard Điều Hành & Visual Analytics 14 Ngày
1. Đăng nhập bằng tài khoản `manager` $\to$ Màn hình mặc định là **Tổng Quan Dashboard**.
2. **Tab "Xu Hướng 14 Ngày":** Quan sát biểu đồ vùng Area Chart gradient kép so sánh Doanh thu POS và Chi phí hủy hàng Spoilage 14 ngày qua. Rê chuột vào các điểm nút để xem Tooltip tương tác hiển thị Doanh thu, Thất thoát và Lợi nhuận giữ lại ($RetainedProfit = Max(0, Sales - Spoilage)$).
3. **Tab "Cơ Cấu 7 Ngành FMCG":** Xem bảng cấu trúc 7 nhóm ngành hàng, nhiệt độ bảo quản, giá trị tồn kho và thanh tiến độ cảnh báo rủi ro 2 màu.

### Bước 3: Giám Sát FEFO & SOP Đảo Kệ Mặt Tiền (Rule 4 & Rule 10)
1. Chuyển sang menu **"Giám Sát Hạn Dùng FEFO"**.
2. Quan sát 3 cấp màu cảnh báo: **Vùng Xanh** (An toàn), **Vùng Vàng** (Cảnh báo cận date), **Vùng Đỏ** (Nguy kịch $\le 3$ ngày), và **Vùng Tím** (Hết hạn).
3. Bấm **"⚡ Quick Markdown"** trên 1 lô hàng Vùng Vàng/Đỏ: Chọn mức giảm giá 15%, 30%, 40% hoặc 50% $\to$ Giá bán ưu đãi lập tức có hiệu lực ngay tại quầy POS.
4. Bấm **"🔄 Đảo Kệ Mặt Tiền"**: Xác nhận hoàn tất quy trình 5 bước đưa lô cận date ra sát mép kệ $\to$ Hệ thống cập nhật `is_shelf_rotated = 1` và ghi nhận Audit Log.
5. Bấm nút **"📥 Xuất Excel"** để tải file CSV UTF-8 BOM chuẩn tiếng Việt có dấu mở trực tiếp trên Excel.

### Bước 4: Bán Lẻ POS Xuất Kho FEFO & Chống Tồn Kho Âm (Rule 2 & Rule 3)
1. Đăng nhập tài khoản `cashier` $\to$ Màn hình **"Bán Hàng POS"**.
2. Bấm vào sản phẩm hoặc quét mã vạch Barcode.
3. Chọn số lượng lớn hơn tồn kho của lô cận date nhất $\to$ Bấm **"Thanh Toán (FEFO)"**.
4. **Hiện tượng quan sát:** Hệ thống tự động bóc tách đơn hàng thành nhiều dòng lô (`batchAllocations`), ưu tiên trừ sạch lô cận date trước, sau đó bẻ tiếp sang lô date xa hơn.
5. Thử nhập số lượng $999999$ $\to$ Hệ thống chặn cứng báo lỗi không đủ tồn kho và Rollback transaction, ngăn chặn hoàn toàn tồn kho âm ($CurrentQuantity \ge 0$).
6. Bấm xem **"Lịch sử ca trực"** và bấm nút **"📥 Xuất Excel"** để xuất lịch sử giao dịch.

### Bước 5: Tiếp Nhận Hàng DC Biên Hòa & Thẩm Định Freshness (Rule 7)
1. Đăng nhập tài khoản `warehouse` $\to$ Màn hình **"Tiếp Nhận Hàng DC"**.
2. **Trường hợp Đạt chuẩn ($RSL \ge 70\%$):** Nhập lô hàng có NSX cách đây 10 ngày, HSD còn 90 ngày ($RSL = 90\% \ge 70\%$) $\to$ Hệ thống tự động sinh mã lô `LOT-DC-...` và chèn vào CSDL thành công.
3. **Trường hợp Vi phạm ($RSL < 70\%$):** Nhập lô hàng có HSD chỉ còn 15 ngày trên tổng vòng đời 100 ngày ($RSL = 15\% < 70\%$) $\to$ Hệ thống khóa lưu, từ chối nhận hàng để bảo vệ cửa hàng không bị kho tổng đẩy hàng cận date.
4. Bấm **"Lập Biên Bản Từ Chối Nhận Hàng"** $\to$ Điền lý do và in biên bản `REJECT_DC_INBOUND` giao tài xế xe tải hoàn hàng về DC Biên Hòa.

### Bước 6: Đề Xuất & Phê Duyệt Tiêu Hủy Spoilage (Rule 5, Rule 6 & SoD)
1. Vẫn ở tài khoản `warehouse` $\to$ Vào màn hình **"Tiêu Hủy & Hao Hụt"**.
2. Lập phiếu đề xuất hủy 3 sản phẩm móp méo/hỏng $\to$ Trạng thái phiếu là `PENDING` (chờ duyệt).
3. Đăng nhập tài khoản `manager` (Cửa hàng trưởng) $\to$ Thấy phiếu `PENDING` hiển thị nút **"Phê duyệt"** $\to$ Bấm duyệt.
4. **Hiện tượng quan sát:** Trạng thái chuyển sang `APPROVED`, Sổ Hao hụt tự động ghi nhận thiệt hại tài chính $CostLoss = Quantity \times ImportPrice$.
5. Bấm nút **"📥 Xuất Báo Cáo Hao Hụt"** xuất file Excel nộp kế toán quyết toán thuế TNDN.

### Bước 7: Dự Báo Nhu Cầu ROP & Vòng Đời Đơn Hàng PO (Rule 8)
1. Đăng nhập `manager` $\to$ Vào **"Dự Báo & Đặt Hàng ROP"**.
2. Chọn điều kiện ngoại cảnh: Thời tiết `SUNNY` (nắng nóng), `RAINY` (mưa bão) và bật/tắt ngày lễ $\to$ Quan sát hệ số $W_{factor}$ và $H_{factor}$ làm thay đổi điểm đặt hàng ROP của các ngành giải khát, bánh mì.
3. Bấm **"Tạo Đơn Hàng PO"** $\to$ Chuyển sang Tab **"Đơn Hàng Gửi DC"**.
4. Trải nghiệm vòng đời 5 trạng thái: `DRAFT` (Dự thảo) $\to$ Bấm **"Phê Duyệt"** (`APPROVED`) $\to$ Bấm **"Gửi Xe DC"** (`SUBMITTED`) $\to$ Nhân viên kho nhận hàng chuyển thành `DELIVERED`.

### Bước 8: Bàn Giao Ca Trực Điện Tử 4 Bước (Mục 15 SSOT)
1. Đăng nhập `cashier` $\to$ Vào menu **"Bàn Giao Ca Trực"**.
2. Thực hiện 4 bước: Chọn ca trực, kiểm đếm doanh thu POS và tiền mặt thực tế trong két, kiểm kê các lô Vàng/Đỏ cận date trên quầy, giải trình lệch quỹ (nếu có).
3. Ký xác nhận điện tử $\to$ Lưu biên bản bàn giao thành công vào lịch sử ca và Audit Log.

### Bước 9: Quản Lý Danh Mục Ngành Hàng FMCG Động
1. Đăng nhập `admin` $\to$ Vào **"Danh Mục Sản Phẩm"** $\to$ Chọn Tab **"🏷️ Quản Lý Ngành Hàng FMCG"**.
2. Thao tác Thêm mới / Chỉnh sửa nhiệt độ bảo quản và ngưỡng cảnh báo ngày.
3. Thử xóa ngành ID 1 (DAIRY) $\to$ Hệ thống cảnh báo đỏ chặn xóa do đang có sản phẩm lưu hành để bảo vệ toàn vẹn khóa ngoại.
4. Trải nghiệm kiểm tra chống trùng sản phẩm Rule 9: Nhập thử sản phẩm trùng mã SKU hoặc tên tương đồng $\ge 85\%$ $\to$ Bị chặn ngay lập tức.

### Bước 10: Sổ Nhật Ký Kiểm Toán Bất Biến (Rule 11)
1. Vào mục **"Sổ Kiểm Toán Hệ Thống"**.
2. Quan sát toàn bộ các hành động từ Bước 1 đến Bước 9 đều được ghi nhận bất biến theo thời gian thực: Thời điểm, Tài khoản, Hành động, Bảng đối tượng, Mã chứng từ, Địa chỉ IP.
3. Bấm **"📥 Xuất Excel ({số lượng})"** để tải toàn bộ vết kiểm toán về máy tính.

