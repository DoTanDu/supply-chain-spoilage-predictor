# Docs/Scripts/update_section_11_docx.py
import docx, sys, io
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc_path = 'Docs/Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx'
doc = docx.Document(doc_path)

start_idx = None
end_idx = None

for i, p in enumerate(doc.paragraphs):
    if p.text.strip().startswith('11. Dashboard hệ thống'):
        start_idx = i
    if p.text.strip().startswith('12. Quản lý tiếp nhận hàng từ Kho tổng DC'):
        end_idx = i
        break

print(f"Found Section 11 from P{start_idx} to P{end_idx}")

if start_idx is None or end_idx is None:
    print("Error: Could not locate Section 11 boundaries!")
    sys.exit(1)

# Danh sách các đoạn văn bản mới cho Mục 11
new_paragraphs_data = [
    ("11. Dashboard hệ thống (Executive Dashboard, Visual Analytics & Shift Action Board)", "HEADING_1", True),
    ("Hệ thống Dashboard đóng vai trò trung tâm chỉ huy thời gian thực (Real-time Operations Command Center) cho Cửa hàng Bán lẻ LHU Mart, liên kết trực tiếp dữ liệu xuất bán POS, tiếp nhận kho DC, giám sát hạn sử dụng từng lô (Shelf-Life) và Sổ hao hụt tài chính. Giao diện được thiết kế theo phong cách hiện đại (Rich Aesthetics, Dark mode, bố cục Bento Grid), chia làm 3 phân hệ chính: Bộ 6 Thẻ KPI Tài chính Điều hành, Hệ thống Trực quan hóa Dữ liệu (Visual Analytics) và Bảng Hành động Ca trực Khẩn cấp 4 Tab (Shift Action Board).", "NORMAL", False),
    
    ("11.1  Bộ 6 Chỉ số KPI Tài chính Điều hành Cốt lõi (Financial & Operational KPIs)", "HEADING_2", True),
    ("Dashboard tổng hợp tức thì 6 chỉ số định lượng tài chính then chốt giúp Cửa hàng trưởng và Ban Giám đốc kiểm soát dòng tiền và triệt tiêu lãng phí:", "NORMAL", False),
    ("1. Tổng Giá Trị Vốn Tồn Kho Hiện Tại (VNĐ): V_inv = SUM(current_quantity * import_price). Phản ánh lượng vốn lưu động đang nằm trên quầy kệ; truy vấn từ bảng batches với điều kiện status IN ('ACTIVE', 'WARNING') và expiry_date >= GETDATE(). Không vượt quá hạn mức vốn tối đa 500.000.000 VNĐ.", "BULLET", False),
    ("2. Tổng Giá Trị Vốn Cận Date Có Rủi Ro (VNĐ): V_risk = SUM(current_quantity * import_price) với các lô thuộc Vùng Vàng và Vùng Đỏ (0 < DaysLeft <= WarningDays). Đo lường số vốn đứng trước nguy cơ tổn thất nếu không kịp thời kích hoạt Quick Markdown và đảo kệ mặt tiền.", "BULLET", False),
    ("3. Tỷ Lệ Hao Hụt Lãng Phí (Spoilage Rate %): Rate_spoilage = (SUM(CostLoss) / (SUM(Revenue_sales) + SUM(CostLoss))) * 100. Chỉ số sống còn đo lường hiệu quả chống lãng phí; mục tiêu duy trì < 1.5% (vượt 2.5% báo động đỏ cần can thiệp quy trình).", "BULLET", False),
    ("4. Doanh Số Bán Hàng Hôm Nay (VNĐ) & Số Đơn POS: Rev_today = SUM(total_amount) từ sales_history với sale_date = CAST(GETDATE() AS DATE). Đo lường doanh thu thực tế và tổng số lượng giao dịch thành công (N_orders) trong ca trực.", "BULLET", False),
    ("5. Số Lượng Lô Hàng Cần Đảo Kệ Trong Ca: N_rotate = COUNT(batches có is_shelf_rotated = 0 và alert_color IN ('YELLOW', 'RED')). Đo lường khối lượng công việc đảo hàng cận date ra mặt tiền quầy kệ theo quy chuẩn SOP 5 bước.", "BULLET", False),
    ("6. Số Lô Hết Hạn Chờ Tiêu Hủy: N_expired = COUNT(batches có DaysLeft <= 0 và current_quantity > 0) cùng số lượng biên bản tiêu hủy đang ở trạng thái PENDING chờ Cửa hàng trưởng phê duyệt.", "BULLET", False),
    ("7. Chỉ số phụ - Tỷ Lệ Tuân Thủ FEFO: Rate_FEFO (%) = (Số đơn xuất bán chuẩn FEFO / Tổng số đơn POS) * 100. Đảm bảo 100% nhân viên và động cơ POS tuân thủ bóc tách lô cận date nhất ra bán trước theo Rule 2.", "BULLET", False),

    ("11.2  Hệ thống Trực quan hóa Dữ liệu (Visual Analytics & Charts)", "HEADING_2", True),
    ("Dashboard cung cấp 4 cấu phần trực quan hóa đồ họa chuyên sâu được cập nhật phản ứng theo sự kiện:", "NORMAL", False),
    ("1. Biểu đồ Vành Khuyên Hạn Dùng (Shelf-Life Donut Chart): Phân tách tổng số lô hàng lưu kho thành 4 phân khúc màu tương ứng với động cơ cảnh báo Rule 4 & Rule 5: Vùng Xanh (An toàn: DaysLeft > WarningDays), Vùng Vàng (Cảnh báo: 3 < DaysLeft <= WarningDays), Vùng Đỏ (Nguy kịch: 0 < DaysLeft <= 3) và Vùng Quá Hạn (DaysLeft <= 0). Công thức SVG Donut: Bán kính R=66px, Chu vi C=414.69px, StrokeDasharray_i = (Count_i / TotalBatches) * C.", "BULLET", False),
    ("2. Biểu đồ Miền Xu Hướng 14 Ngày (Sales vs Spoilage Trend Area Chart): Trục X hiển thị 14 mốc ngày liên tục (D-13 đến D0); Trục Y đo lường giá trị VNĐ. So sánh đường cong Doanh thu Bán lẻ (Xanh Emerald) đối ứng Chi phí Tiêu hủy Hàng hỏng (Đỏ Crimson), hiển thị Lợi nhuận giữ lại: Profit_retained = SalesRevenue - SpoilageCost.", "BULLET", False),
    ("3. Biểu đồ Cơ Cấu Ngành Hàng FMCG (Category Breakdown Chart): Thống kê tỷ trọng giá trị vốn tồn kho và tỷ lệ hàng cận date phân bổ trên 7 nhóm ngành hàng thiết yếu: Sữa (DAIRY), Bánh mì (BAKERY), Đồ hộp (CANNED), Mì ăn liền (NOODLES), Nước giải khát (BEVERAGE), Gia vị (SPICES) và Chăm sóc cá nhân (PERSONAL_CARE).", "BULLET", False),
    ("4. Bảng Xếp Hạng Top 5 Phân Tích Kép (Dual Top 5 Leaderboard):", "BULLET", False),
    ("   - Cột 1: Top 5 Mặt Hàng Bán Chạy Nhất (Fast-Moving): Xếp hạng theo sản lượng tiêu thụ thực tế 14 ngày, hiển thị SKU, Tên, Ngành hàng, Sản lượng, Doanh thu và Vận tốc bán trung bình ngày (v_daily = Qty_14d / 14).", "NORMAL", False),
    ("   - Cột 2: Top 5 Mặt Hàng Phát Sinh Hao Hụt Cao Nhất (Highest Spoilage): Xếp hạng theo giá trị vốn tổn thất lũy kế trên Sổ hao hụt tài chính (CostLoss VNĐ), hiển thị SKU, Tên, Số lượng hủy và Tỷ lệ tổn thất trên tổng nhập.", "NORMAL", False),

    ("11.3  Action Board Khẩn Cấp 4 Tab Cho Ca Trực (Shift Action Board)", "HEADING_2", True),
    ("Nhằm chuyển đổi dữ liệu phân tích thành hành động cụ thể tại quầy kệ, Action Board phân loại toàn bộ rủi ro thành 4 nhóm công việc khẩn cấp yêu cầu nhân viên ca trực xử lý dứt điểm:", "NORMAL", False),
    ("Tab 1 – Lô Đỏ Cần Giảm Giá Ngay (Urgent Quick Markdown): Danh sách các lô có 0 < DaysLeft <= 3, còn tồn kho. Nhân viên kích hoạt nhanh Quick Markdown 40% hoặc 50% theo Rule 10, giá mới đồng bộ sang POS tức thì và in tem giảm giá dán đè bao bì.", "BULLET", False),
    ("Tab 2 – Lô Cần Đảo Kệ Mặt Tiền (Shelf Rotation Tasks): Danh sách các lô thuộc Vùng Vàng/Đỏ nhưng cờ is_shelf_rotated = 0. Nhân viên thực hiện SOP 5 bước vật lý tại quầy kệ và bấm nút xác nhận điện tử để cập nhật hệ thống.", "BULLET", False),
    ("Tab 3 – Hàng Quá Hạn Chờ Tiêu Hủy (Expired Quarantine & Disposal Ledger): Danh sách các lô có DaysLeft <= 0 hoặc biên bản tiêu hủy PENDING. Nhân viên gom hàng vào khu cách ly niêm phong, Cửa hàng trưởng phê duyệt để chốt Sổ hao hụt tài chính bất biến.", "BULLET", False),
    ("Tab 4 – Cảnh Báo Ngưỡng Đặt Hàng ROP & Nguy Cơ Ứ Đọng (Reorder Point & Overstock): Cảnh báo khi tồn kho chạm điểm đặt hàng ROP = (d_adjusted * LeadTime) + SafetyStock hoặc nguy cơ ứ đọng date DOS > DUE. Cho phép Cửa hàng trưởng tạo đơn PO gửi DC với 1 thao tác.", "BULLET", False),

    ("11.4  Cơ Chế Đồng Bộ Thời Gian Thực & Tối Ưu Hóa Hiệu Năng", "HEADING_2", True),
    ("1. Chu kỳ làm mới tự động (Polling & Reactive Refresh): Dashboard thiết lập Polling mỗi 30 giây để cập nhật trạng thái kho và doanh số mới nhất. Đồng thời kích hoạt sự kiện làm mới tức thì (Event-Driven Reactive Refresh) khi phát sinh giao dịch bán hàng, duyệt hủy, đổi giá hoặc nhập hàng DC.", "BULLET", False),
    ("2. Tối ưu hóa chỉ mục CSDL (Database Index Optimization): Toàn bộ truy vấn thống kê Dashboard được tối ưu qua các Covering Index: IX_Batches_FEFO, IX_Batches_ExpiryWatchdog, IX_SalesHistory_Product_Date, IX_SpoilageRecords_Batch. Thời gian phản hồi API GET /api/dashboard/overview đạt < 50ms trên SQL Server LocalDB.", "BULLET", False),

    ("11.5  Ma Trận Phân Quyền Truy Cập Dashboard Theo 4 Vai Trò (Dashboard RBAC Matrix)", "HEADING_2", True),
    ("Hệ thống phân quyền hiển thị Dashboard nghiêm ngặt theo 4 vai trò:", "NORMAL", False),
    ("- Quản Trị Viên (ADMIN): Toàn quyền xem 6 KPI tài chính, phân tích xu hướng 14 ngày, bảng xếp hạng Top 5, phê duyệt đơn PO và xem nhật ký kiểm toán hệ thống.", "BULLET", False),
    ("- Cửa Hàng Trưởng (STORE_MANAGER): Toàn quyền xem 6 KPI tài chính, duyệt biên bản tiêu hủy trên Action Board, áp dụng Quick Markdown và tạo đơn PO gửi DC.", "BULLET", False),
    ("- Thu Ngân Bán Lẻ (CASHIER): Xem nhanh KPI ca trực (Doanh số hôm nay, số đơn, FEFO), thực hiện xử lý Action Board (Tab 1, Tab 3), ẩn số liệu vốn tài chính nhạy cảm.", "BULLET", False),
    ("- Nhân Viên Kho (WAREHOUSE_STAFF): Xem danh mục đảo kệ (Tab 2), danh mục ROP (Tab 4), không can thiệp KPI tài chính và doanh số.", "BULLET", False)
]

# Xóa các đoạn cũ từ start_idx đến end_idx - 1
p_current = doc.paragraphs[start_idx]
for k in range(start_idx, end_idx):
    p_to_del = doc.paragraphs[start_idx]
    p_elem = p_to_del._element
    p_elem.getparent().remove(p_elem)

# Chèn các đoạn mới vào trước P{start_idx} (nay là vị trí của Section 12)
target_p = doc.paragraphs[start_idx]

for text, style, is_bold in new_paragraphs_data:
    new_p = target_p.insert_paragraph_before()
    run = new_p.add_run(text)
    run.bold = is_bold
    
    if style == "HEADING_1":
        run.font.size = Pt(15)
        run.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A) # Deep Navy
        new_p.paragraph_format.space_before = Pt(14)
        new_p.paragraph_format.space_after = Pt(6)
    elif style == "HEADING_2":
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(0x02, 0x84, 0xC7) # Sky Blue
        new_p.paragraph_format.space_before = Pt(10)
        new_p.paragraph_format.space_after = Pt(4)
    elif style == "BULLET":
        run.font.size = Pt(11)
        new_p.paragraph_format.space_before = Pt(2)
        new_p.paragraph_format.space_after = Pt(3)
        new_p.paragraph_format.left_indent = Pt(18)
    else:
        run.font.size = Pt(11)
        new_p.paragraph_format.space_before = Pt(2)
        new_p.paragraph_format.space_after = Pt(4)

doc.save(doc_path)
print(f"Successfully updated Section 11 in {doc_path} with {len(new_paragraphs_data)} formatted paragraphs!")

