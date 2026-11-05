# Docs/Scripts/update_section_11_md.py
import sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

md_path = 'Docs/Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md'

with open(md_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '# 11. Dashboard hệ thống'
end_marker = '# 12. Quản lý tiếp nhận hàng từ Kho tổng DC (DC Inbound & Date Inspection)'

if start_marker not in content or end_marker not in content:
    print('Error: markers not found!')
    sys.exit(1)

pre = content.split(start_marker)[0]
post = content.split(end_marker)[1]

new_sec11 = """# 11. Dashboard hệ thống (Executive Dashboard, Visual Analytics & Shift Action Board)

Hệ thống Dashboard đóng vai trò trung tâm chỉ huy thời gian thực (Real-time Operations Command Center) cho Cửa hàng Bán lẻ LHU Mart, liên kết trực tiếp dữ liệu xuất bán POS, tiếp nhận kho DC, giám sát hạn sử dụng từng lô (Shelf-Life) và Sổ hao hụt tài chính. Giao diện được thiết kế theo phong cách hiện đại (Rich Aesthetics, Dark mode, bố cục Bento Grid), chia làm 3 phân hệ chính: **Bộ 6 Thẻ KPI Tài chính Điều hành**, **Hệ thống Trực quan hóa Dữ liệu (Visual Analytics)** và **Bảng Hành động Ca trực Khẩn cấp 4 Tab (Shift Action Board)**.

---

## 11.1 Bộ 6 Chỉ số KPI Tài chính Điều hành Cốt lõi (Financial & Operational KPIs)

Dashboard tổng hợp tức thì 6 chỉ số định lượng tài chính then chốt giúp Cửa hàng trưởng và Ban Giám đốc kiểm soát dòng tiền và triệt tiêu lãng phí:

| STT | Tên Chỉ Số KPI | Công Thức Toán Học / Thuật Toán | Đơn Vị | Nguồn Dữ Liệu SQL Server | Ý Nghĩa Điều Hành & Ngưỡng An Toàn |
| :---: | :--- | :--- | :---: | :--- | :--- |
| **1** | **Tổng Giá Trị Vốn Tồn Kho Hiện Tại** | $$V_{inv} = \\sum_{b \\in B_{active}} (current\\_quantity_b \\times import\\_price_b)$$ | VNĐ | Bảng `batches` (lọc `status IN ('ACTIVE', 'WARNING')` và `expiry_date >= GETDATE()`) | Phản ánh lượng vốn lưu động đang nằm trên kệ; không vượt quá hạn mức vốn 500.000.000 VNĐ. |
| **2** | **Tổng Giá Trị Vốn Cận Date Có Rủi Ro** | $$V_{risk} = \\sum_{b \\in B_{yellow} \\cup B_{red}} (current\\_quantity_b \\times import\\_price_b)$$ | VNĐ | Bảng `batches` (lọc `0 < daysLeft <= default_warning_days`) | Đo lường số vốn đứng trước nguy cơ tổn thất nếu không kịp thời kích hoạt Quick Markdown và đảo kệ mặt tiền. |
| **3** | **Tỷ Lệ Hao Hụt Lãng Phí (Spoilage Rate)** | $$Rate_{spoilage} (\\%) = \\frac{\\sum CostLoss}{\\sum Revenue_{sales} + \\sum CostLoss} \\times 100$$ | % | Bảng `spoilage_records` liên kết `sales_history` | Chỉ số sống còn đo lường hiệu quả chống lãng phí; mục tiêu kiểm soát $< 1.5\\%$ (vượt $2.5\\%$ báo động đỏ). |
| **4** | **Doanh Số Bán Hàng Hôm Nay** | $$Rev_{today} = \\sum_{sh \\in SH_{today}} total\\_amount_{sh}$$ | VNĐ | Bảng `sales_history` (`sale_date = CAST(GETDATE() AS DATE)`) | Doanh thu thực tế tại quầy POS trong ngày; đi kèm số lượng giao dịch thành công ($N_{orders}$). |
| **5** | **Số Lô Cần Đảo Kệ Trong Ca Trực** | $$N_{rotate} = COUNT(\\{b \\in B_{warn} \\mid is\\_shelf\\_rotated = 0\\})$$ | Lô | Bảng `batches` (`is_shelf_rotated = 0` và `alert_color IN ('YELLOW', 'RED')`) | Đo lường khối lượng công việc đảo hàng cận date ra mặt tiền quầy kệ theo quy chuẩn SOP 5 bước. |
| **6** | **Số Lô Hết Hạn Chờ Tiêu Hủy** | $$N_{expired} = COUNT(\\{b \\in B \\mid daysLeft \\le 0 \\land current\\_qty > 0\\})$$ | Lô | Bảng `batches` (`status = 'EXPIRED'` hoặc `DATEDIFF(day, GETDATE(), expiry_date) <= 0`) | Số lượng lô quá hạn trên kệ cần gom vào khu cách ly và số biên bản `PENDING` chờ Quản lý phê duyệt. |
| *Phụ* | **Tỷ Lệ Tuân Thủ Xuất Bán FEFO** | $$Rate_{FEFO} (\\%) = \\frac{N_{FEFO\\_Compliant\\_Orders}}{N_{Total\\_Orders}} \\times 100$$ | % | Đối chiếu `sales_history.batch_id` với thứ tự `expiry_date ASC` | Đảm bảo 100% nhân viên và động cơ POS tuân thủ bóc tách lô cận date nhất ra bán trước (Rule 2). |

---

## 11.2 Hệ thống Trực quan hóa Dữ liệu (Visual Analytics & Charts)

Dashboard cung cấp 4 cấu phần trực quan hóa đồ họa chuyên sâu được cập nhật phản ứng theo sự kiện:

### 1. Biểu đồ Vành Khuyên Phân Bổ Vòng Đời Hạn Sử Dụng (Shelf-Life Donut Chart)
- **Cấu trúc dữ liệu:** Phân tách tổng số lô hàng lưu kho thành 4 phân khúc màu tương ứng với động cơ cảnh báo Rule 4 & Rule 5:
  - **Vùng Xanh (Safe Zone - An toàn):** $DaysLeft > WarningDays$ (Bán nguyên giá niêm yết).
  - **Vùng Vàng (Warning Zone - Cảnh báo):** $3 < DaysLeft \\le WarningDays$ (Cần đảo kệ & Markdown 15%-30%).
  - **Vùng Đỏ (Critical Zone - Nguy kịch):** $0 < DaysLeft \\le 3$ (Xả hàng kịch sàn 40%-50%).
  - **Vùng Quá Hạn (Expired Zone):** $DaysLeft \\le 0$ (Khóa cứng xuất bán, chuyển sang cách ly).
- **Công thức SVG Donut:** Chu vi vòng tròn $C = 2 \\times \\pi \\times R$ ($R=66px, C \\approx 414.69px$). Độ dài cung nét vẽ cho từng phân khúc $i$:
  $$StrokeDasharray_i = \\left(\\frac{Count_i}{TotalBatches} \\times C\\right), \\quad StrokeDashoffset_i = - \\sum_{k=1}^{i-1} StrokeDasharray_k$$

### 2. Biểu đồ Miền Xu Hướng 14 Ngày (Sales vs Spoilage Trend Area Chart)
- **Trục hoành (X-Axis):** 14 mốc ngày liên tục từ quá khứ đến hiện tại ($D_{-13} \\rightarrow D_0$).
- **Trục tung (Y-Axis):** Giá trị tài chính bằng VNĐ (thang đo tuyến tính tự động điều chỉnh theo $Max(Sales, Spoilage)$).
- **Miền hiển thị:**
  - Đường cong Doanh thu Bán lẻ (Sales Revenue Curve - Màu Xanh Emerald gradient).
  - Cột/Miền Chi phí Tiêu hủy Hàng hỏng (Spoilage Cost Loss - Màu Đỏ Crimson).
  - Lợi nhuận giữ lại thu hồi sau chống lãng phí: $Profit_{retained} = SalesRevenue - SpoilageCost$.

### 3. Biểu đồ Cơ Cấu Ngành Hàng FMCG (Category Breakdown Chart)
- Thống kê tỷ trọng giá trị vốn tồn kho và tỷ lệ sản phẩm cận date phân bổ trên 7 nhóm ngành hàng thiết yếu: Sữa tươi & Chế phẩm sữa (`DAIRY`), Bánh mì tươi (`BAKERY`), Thực phẩm đóng hộp (`CANNED`), Mì & Đồ ăn liền (`NOODLES`), Nước giải khát (`BEVERAGE`), Gia vị & Đồ khô (`SPICES`), Chăm sóc cá nhân & Gia đình (`PERSONAL_CARE`).

### 4. Bảng Xếp Hạng Top 5 Phân Tích Kép (Dual Top 5 Leaderboard)
- **Cột 1: Top 5 Sản Phẩm Bán Chạy Nhất (Fast-Moving Items):**
  - Xếp hạng theo tổng sản lượng tiêu thụ thực tế tại quầy POS trong 14 ngày.
  - Hiển thị: SKU, Tên sản phẩm, Tên ngành hàng, Tổng số lượng xuất bán, Doanh thu thực tế, và Vận tốc bán trung bình ngày ($v_{daily} = \\frac{\\sum Qty_{14d}}{14}$).
- **Cột 2: Top 5 Sản Phẩm Phát Sinh Hao Hụt Cao Nhất (Highest Spoilage Items):**
  - Xếp hạng theo tổng giá trị vốn thiệt hại lũy kế trên Sổ hao hụt tài chính ($CostLoss$).
  - Hiển thị: SKU, Tên sản phẩm, Số lượng tiêu hủy, Tổng thiệt hại vốn (VNĐ), và Tỷ lệ tổn thất trên tổng nhập. Giúp Cửa hàng trưởng kiến nghị DC giảm quy mô đóng gói hoặc điều chỉnh chu kỳ nhập hàng.

---

## 11.3 Action Board Khẩn Cấp 4 Tab Cho Ca Trực (Shift Action Board)

Nhằm chuyển đổi dữ liệu phân tích thành hành động cụ thể tại quầy kệ, Action Board phân loại toàn bộ rủi ro thành 4 nhóm công việc khẩn cấp yêu cầu nhân viên ca trực xử lý dứt điểm:

```
[ACTION BOARD CA TRỰC KHẨN CẤP]
  ├── Tab 1: Lô Đỏ Cần Giảm Giá Ngay (Urgent Quick Markdown: DaysLeft <= 3)
  ├── Tab 2: Lô Cần Đảo Kệ Mặt Tiền (Shelf Rotation Tasks: is_shelf_rotated = 0)
  ├── Tab 3: Hàng Quá Hạn Chờ Tiêu Hủy (Expired Quarantine: DaysLeft <= 0 & Pending Approval)
  └── Tab 4: Cảnh Báo Ngưỡng Đặt Hàng ROP & Ứ Đọng (Reorder Point & Overstock DOS > DUE)
```

### 1. Tab 1 – Lô Đỏ Cần Giảm Giá Ngay (Urgent Quick Markdown)
- **Điều kiện kích hoạt:** Lô hàng có $0 < DaysLeft \\le 3$, trạng thái `WARNING` hoặc `CRITICAL`, tồn kho $current\\_quantity > 0$.
- **Hành động nghiệp vụ:** Nhân viên mở popup áp dụng Quick Markdown 40% hoặc 50% theo Rule 10. Giá mới lập tức đồng bộ sang máy POS, đồng thời hệ thống in tem mã vạch xả hàng dán đè lên bao bì sản phẩm.

### 2. Tab 2 – Lô Cần Đảo Kệ Mặt Tiền (Shelf Rotation Tasks)
- **Điều kiện kích hoạt:** Lô hàng thuộc Vùng Vàng ($3 < DaysLeft \\le WarningDays$) hoặc Vùng Đỏ, nhưng cờ đảo kệ $is\\_shelf\\_rotated = 0$.
- **Hành động nghiệp vụ:** Nhân viên thực hiện quy trình SOP 5 bước vật lý tại quầy kệ:
  1. Kiểm tra bao bì, hạn sử dụng trên kệ.
  2. Rút lô cận date ra phía trước mép ngoài kệ.
  3. Đẩy các lô có hạn dùng xa hơn lùi vào bên trong.
  4. Căn chỉnh tem nhãn, giá niêm yết hướng ra lối đi.
  5. Bấm nút "Xác nhận điện tử đã đảo kệ" trên Dashboard $\\rightarrow$ Ghi nhận $is\\_shelf\\_rotated = 1$ và lưu `system_audit_logs`.

### 3. Tab 3 – Hàng Quá Hạn Chờ Tiêu Hủy (Expired Quarantine & Disposal Ledger)
- **Điều kiện kích hoạt:** Lô hàng có $DaysLeft \\le 0$ còn tồn kho hoặc biên bản tiêu hủy đang ở trạng thái `PENDING` chờ phê duyệt.
- **Hành động nghiệp vụ:**
  - Thu gom toàn bộ sản phẩm hết hạn khỏi kệ trưng bày, chuyển vào thùng cách ly niêm phong.
  - Bấm nút "Lập Phiếu Tiêu Hủy" $\\rightarrow$ Nhập lý do (hết hạn, rách nát, biến chất).
  - Cửa hàng trưởng phê duyệt $\\rightarrow$ Trừ tồn kho về 0, chuyển trạng thái lô sang `DISPOSED`, hạch toán Sổ hao hụt tài chính bất biến $CostLoss = Quantity \\times ImportPrice$.

### 4. Tab 4 – Cảnh Báo Ngưỡng Đặt Hàng ROP & Nguy Cơ Ứ Đọng (Reorder Point & Overstock)
- **Điều kiện kích hoạt:**
  - Nguy cơ đứt hàng: Tồn kho hiện tại $\\le ROP$ ($ROP = (d_{adjusted} \\times LeadTime) + SafetyStock$).
  - Nguy cơ ứ đọng date (Overstock Spoilage Risk): Ngày tồn kho vượt ngày sử dụng ($DOS > DUE$).
- **Hành động nghiệp vụ:** Hiển thị số lượng đề xuất đặt hàng ($Q_{suggested}$), cho phép Cửa hàng trưởng bấm nút "Tạo Đơn Hàng PO Gửi DC" với 1 thao tác duy nhất.

---

## 11.4 Cơ Chế Đồng Bộ Thời Gian Thực & Tối Ưu Hóa Truy Vấn (Engine Performance)

1. **Chu kỳ làm mới (Polling & Reactive Refresh):**
   - Dashboard thiết lập cơ chế tự động thăm dò (Polling) mỗi **30 giây** để cập nhật trạng thái kho và doanh số mới nhất.
   - Kích hoạt sự kiện làm mới tức thì (Event-Driven Reactive Invalidation) ngay khi phát sinh các hành vi: Thanh toán POS hoàn tất, Duyệt biên bản tiêu hủy, Xác nhận đảo kệ, Đổi mức chiết khấu Quick Markdown, hoặc Nhập hàng mới từ DC.
2. **Tối ưu hóa chỉ mục CSDL (Database Index Optimization):**
   - Toàn bộ các truy vấn thống kê Dashboard được tối ưu qua các chỉ mục bao phủ (Covering Indexes):
     - `IX_Batches_FEFO` trên `batches(product_id, expiry_date, status, current_quantity)`.
     - `IX_Batches_ExpiryWatchdog` trên `batches(expiry_date, status, current_quantity)`.
     - `IX_SalesHistory_Product_Date` trên `sales_history(sale_date, product_id, total_amount)`.
     - `IX_SpoilageRecords_Batch` trên `spoilage_records(batch_id, cost_loss, created_at)`.
   - Thời gian phản hồi trung bình của API `GET /api/dashboard/overview` đạt $< 50ms$ trên SQL Server LocalDB.

---

## 11.5 Ma Trận Phân Quyền Truy Cập Dashboard Theo 4 Vai Trò (Dashboard RBAC Matrix)

| Chức Năng / Cấu Phần Dashboard | Quản Trị Viên (`ADMIN`) | Cửa Hàng Trưởng (`STORE_MANAGER`) | Thu Ngân Bán Lẻ (`CASHIER`) | Nhân Viên Kho (`WAREHOUSE_STAFF`) |
| :--- | :---: | :---: | :---: | :---: |
| **Xem 6 Thẻ KPI Tài Chính Điều Hành** | Toàn quyền | Toàn quyền | Giới hạn (Doanh số hôm nay & Số đơn) | Ẩn số liệu vốn tài chính |
| **Biểu đồ Vành khuyên Hạn dùng (Donut)** | Có | Có | Có | Có |
| **Biểu đồ Miền Xu hướng 14 Ngày** | Có | Có | Xem dạng tóm tắt | Ẩn |
| **Bảng Xếp hạng Top 5 Bán chạy & Hao hụt** | Có | Có | Xem Top Bán chạy | Ẩn |
| **Action Board: Tab 1 (Quick Markdown)** | Kích hoạt | Kích hoạt | Chỉ xem / Chờ quản lý duyệt | Ẩn |
| **Action Board: Tab 2 (Xác nhận Đảo kệ)** | Giám sát | Phân công ca trực | Thực hiện & Xác nhận | Thực hiện & Xác nhận |
| **Action Board: Tab 3 (Tiêu hủy & Sổ hao hụt)** | Phê duyệt tối cao | Phê duyệt & Chốt sổ | Lập phiếu đề xuất (PENDING) | Lập phiếu đề xuất (PENDING) |
| **Action Board: Tab 4 (Lập PO theo ROP)** | Phê duyệt PO | Lập & Ký duyệt PO | Ẩn | Xem đề xuất bổ sung kho |

---

"""

final_content = pre + new_sec11 + end_marker + post
with open(md_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print(f"Successfully updated Section 11 in {md_path}")

