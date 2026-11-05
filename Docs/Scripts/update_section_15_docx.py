# -*- coding: utf-8 -*-
"""
Docs/Scripts/update_section_15_docx.py
Cập nhật và chuẩn hóa Mục 15 trong file Word:
Docs/Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx
"""
import docx, sys, io
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc_path = 'Docs/Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx'
doc = docx.Document(doc_path)

start_idx = None
end_idx = None

for i, p in enumerate(doc.paragraphs):
    if p.text.strip().startswith('15. Quản lý lịch trực'):
        start_idx = i
    if p.text.strip().startswith('16. Phân quyền chức năng'):
        end_idx = i
        break

print(f"Found Section 15 from P{start_idx} to P{end_idx}")

if start_idx is None or end_idx is None:
    print("Error: Could not locate Section 15 boundaries!")
    sys.exit(1)

# Danh sách các đoạn văn bản mới cho Mục 15
new_paragraphs_data = [
    ("15. Quản lý lịch trực và bàn giao ca làm việc (Shift Handover & Staff Scheduling SOP)", "HEADING_1", True),
    ("Quy trình bàn giao ca trực điện tử khép kín (Shift Handover SOP) là mắt xích vận hành quan trọng bảo vệ tính liên tục của chuỗi cung ứng chống lãng phí tại Cửa hàng Bán lẻ LHU Mart (RETAIL-STORE-01). Mọi số liệu doanh thu tiền két quầy POS, trạng thái các lô hàng cận date (Vùng Đỏ, Vùng Vàng) trên quầy kệ, tiến độ đảo kệ mặt tiền FEFO và số lượng hàng hỏng cách ly chờ tiêu hủy bắt buộc phải được kiểm đếm, đối chiếu thực tế và ký biên bản điện tử bàn giao giữa hai ca làm việc. Quy trình này gắn liền với 3 chế tài trách nhiệm nghiêm ngặt nhằm triệt tiêu tối đa rủi ro sót hàng quá hạn và thất thoát tài sản.", "NORMAL", False),

    ("15.1  Mô hình Ca Trực Chuẩn & Cơ Cấu Phân Công Ca (Store Shift Scheduling Model)", "HEADING_2", True),
    ("Cửa hàng mở cửa từ 06:00 đến 22:00 hàng ngày, phân chia thành 2 ca làm việc tiêu chuẩn 8 tiếng với định biên nhân sự tối thiểu:", "NORMAL", False),
    ("1. Ca Sáng (06:00 – 14:00): Mở cửa quầy bán lẻ POS; tiếp nhận đợt xe tải DC Biên Hòa giao hàng sáng sớm (kiểm soát RSL >= 70%); rà soát quầy kệ mát; kiểm kê hạn dùng đầu ngày.", "BULLET", False),
    ("2. Ca Chiều (14:00 – 22:00): Phục vụ khung giờ cao điểm mua sắm tan tầm; kích hoạt Quick Markdown sâu (40% - 50%) cho các lô Vùng Đỏ; hoàn tất đảo kệ mặt tiền; kiểm đếm tiền két và chốt ca đóng cửa.", "BULLET", False),
    ("3. Định biên 3 nhân sự tối thiểu mỗi ca (SoD Matrix): 1 Quản lý ca (STORE_MANAGER hoặc ADMIN) giám sát toàn diện; 1 Thu ngân chính (CASHIER) vận hành POS và kiểm đếm tiền két; 1 Nhân viên kho & kệ (WAREHOUSE_STAFF) bốc dỡ xe tải DC, đảo kệ FEFO và quản lý khu cách ly.", "BULLET", False),
    ("4. Nhận diện ca thời gian thực: Hệ thống tự động xác định ca trực theo giờ máy chủ (06:00 - 14:00 là Ca Sáng; 14:00 - 22:00 là Ca Chiều).", "BULLET", False),

    ("15.2  Quy trình Bàn giao Ca Trực Điện tử 4 Bước (Electronic Shift Handover SOP)", "HEADING_2", True),
    ("Quy trình bàn giao ca trực khép kín được thực thi theo 4 bước tuần tự trên phần mềm:", "NORMAL", False),
    ("1. Bước 1 – Chốt ca POS & Kiểm đếm Tiền mặt Két thu ngân: Hệ thống tự động truy vấn tổng doanh số POS thực tế trong ca (ExpectedPosCash). Thu ngân kiểm đếm chi tiết 6 mệnh giá polymer (500k, 200k, 100k, 50k, 20k, 10k) và tiền lẻ để tính ActualCash. Hệ thống tự động tính chênh lệch Delta Cash = ActualCash - ExpectedPosCash và phân loại 3 trạng thái: Khớp chuẩn (Delta = 0), Dư két (Delta > 0), Thiếu hụt (Delta < 0).", "BULLET", False),
    ("2. Bước 2 – Rà soát Danh sách Lô Cận Date trên Quầy kệ: Hệ thống lọc tự động danh sách các lô Vùng Đỏ (0 < DaysLeft <= 3) và Vùng Vàng (3 < DaysLeft <= WarningDays). Hai nhân sự ca trước và ca sau cùng đối chiếu thực tế trên kệ, xác nhận lô Vàng đã hoàn tất đảo mặt tiền (is_shelf_rotated = true) và lô Đỏ đã dán tem Quick Markdown (40% - 50%).", "BULLET", False),
    ("3. Bước 3 – Bàn giao Thùng hàng Chờ Tiêu hủy tại Khu vực Cách ly: Kiểm đếm thực tế số lượng hàng hỏng/quá date (QuantityDisposed) và tổng giá trị vốn tổn thất (CostLoss) của các đề xuất PENDING phát sinh trong ca chưa được phê duyệt, bảo đảm hàng hỏng đã rút hoàn toàn khỏi kệ trưng bày.", "BULLET", False),
    ("4. Bước 4 – Ký Biên bản Bàn giao Điện tử & Lưu vết Kiểm toán: Hai nhân sự giao - nhận ký xác nhận điện tử, cam kết tuân thủ 3 chế tài kỷ luật, bấm 'Ký Xác Nhận Bàn Giao Ca' (POST /api/shift-handover), sinh mã phiên bất biến SH-[YYYYMMDD]-[Mã số] và ghi nhận vào system_audit_logs.", "BULLET", False),

    ("15.3  Khung 3 Chế tài Trách nhiệm & Ràng buộc Kỷ luật (Hiển thị cố định tại Bước 4)", "HEADING_2", True),
    ("Nhằm đảm bảo tính nghiêm minh và trách nhiệm cá nhân, hệ thống hiển thị cố định và bắt buộc nhân viên cam kết 3 chế tài kỷ luật:", "NORMAL", False),
    ("1. Sơ suất để lọt hàng hết hạn bán cho khách (Vi phạm ATTP & Rule 5): Khiển trách bằng văn bản, đình chỉ quyền thu ngân; bồi thường 100% giá trị đơn hàng cho khách và chịu chi phí đổi trả.", "BULLET", False),
    ("2. Không thực hiện SOP đảo lô cận date ra mặt tiền (Vi phạm FEFO & Rule 10): Trừ điểm chuyên cần tháng của nhân viên kho & kệ phụ trách ca trực; yêu cầu đảo lại kệ ngay dưới sự giám sát của Quản lý.", "BULLET", False),
    ("3. Tự ý vứt bỏ hàng không lập phiếu trên phần mềm (Vi phạm Rule 6 & Thất thoát vốn): Buộc bồi thường 100% giá trị vốn thất thoát (CostLoss = Quantity * ImportPrice); nếu tái phạm chuyển hồ sơ xử lý kỷ luật lao động.", "BULLET", False),

    ("15.4  Quy chuẩn Chứng từ Biên bản Bàn giao Ca Điện tử & In Phiếu K80 / A4", "HEADING_2", True),
    ("Biên bản bàn giao ca điện tử sinh mã định danh duy nhất SH-[YYYYMMDD]-[Mã số ngẫu nhiên], hiển thị đầy đủ thông tin thời gian, tên 2 nhân sự giao - nhận, bảng đối soát doanh số POS & tiền mặt két, chênh lệch két, bảng kiểm soát lô cận date và hàng hủy cách ly, ghi chú ca trực và chữ ký điện tử. Hỗ trợ in tức thì trên máy in nhiệt K80 kẹp báo cáo Z-Report hoặc máy in A4 lưu hồ sơ kế toán.", "NORMAL", False),

    ("15.5  Ma trận Phân quyền SoD & Nhật ký Kiểm toán Bất biến (Rule 11)", "HEADING_2", True),
    ("Phân định rõ trách nhiệm 4 vai trò: CASHIER kiểm đếm tiền két và ký bàn giao tiền mặt; WAREHOUSE_STAFF bàn giao thùng hàng cách ly và rà soát đảo kệ; STORE_MANAGER giám sát đối soát, ký duyệt biên bản và xử lý giải trình chênh lệch két. Toàn bộ thông tin đối soát được lưu vết bất biến vào system_audit_logs với action_type = 'SHIFT_HANDOVER' chứa payload JSON chi tiết.", "NORMAL", False),
]

# Xóa các paragraph cũ từ start_idx đến end_idx - 1 (xóa ngược từ dưới lên)
p_elements = [doc.paragraphs[i]._p for i in range(start_idx, end_idx)]
parent_elm = doc.paragraphs[start_idx]._p.getparent()

# Tìm vị trí paragraph tiếp theo sau khối Section 15 để chèn vào trước nó
next_p_elm = doc.paragraphs[end_idx]._p

# Xóa các paragraph cũ
for p_elm in p_elements:
    parent_elm.remove(p_elm)

# Chèn các paragraph mới vào đúng vị trí
for text, style_type, is_bold in new_paragraphs_data:
    new_p = doc.add_paragraph()
    run = new_p.add_run(text)
    run.font.name = 'Times New Roman'
    run.bold = is_bold
    
    if style_type == 'HEADING_1':
        run.font.size = Pt(14)
        run.font.color.rgb = RGBColor(0, 51, 102)
        new_p.paragraph_format.space_before = Pt(12)
        new_p.paragraph_format.space_after = Pt(6)
    elif style_type == 'HEADING_2':
        run.font.size = Pt(12.5)
        run.font.color.rgb = RGBColor(0, 102, 153)
        new_p.paragraph_format.space_before = Pt(10)
        new_p.paragraph_format.space_after = Pt(4)
    elif style_type == 'BULLET':
        run.font.size = Pt(11)
        new_p.paragraph_format.left_indent = Pt(18)
        new_p.paragraph_format.space_before = Pt(2)
        new_p.paragraph_format.space_after = Pt(2)
        new_p.paragraph_format.line_spacing = 1.15
    else: # NORMAL
        run.font.size = Pt(11)
        new_p.paragraph_format.space_before = Pt(3)
        new_p.paragraph_format.space_after = Pt(4)
        new_p.paragraph_format.line_spacing = 1.15

    # Di chuyển paragraph mới vừa thêm về trước next_p_elm
    parent_elm.insert(parent_elm.index(next_p_elm), new_p._p)

doc.save(doc_path)
print(f"Cập nhật thành công Mục 15 vào file Word: {doc_path}")

