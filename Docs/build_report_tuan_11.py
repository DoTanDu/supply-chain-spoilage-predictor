# -*- coding: utf-8 -*-
"""
Script tạo Báo cáo Tiến độ Tuần 11 gặp GVHD ThS. Lê Minh Nhật (ngày 23/10/2026)
Chuẩn theo mẫu chính thức của Khoa CNTT - Đại học Lạc Hồng (LHU).
Bám sát 100% nội dung chỉ đạo trong Note ngày 16/10 của thầy và hình ảnh làm việc thực tế:
- Tạo trang Lock-in / Đăng nhập hệ thống (JWT, RBAC).
- Danh sách hàng hóa & tính năng Xuất Excel (bao gồm cả hàng đã tiêu hủy).
- Tìm hiểu cấu hình cửa hàng bán lẻ và Kho tổng DC (Lead Time, sức chứa).
- Sửa lại tính năng Bàn giao ca trực (Shift Handover Banner & Checklist).
- Nghiên cứu sâu và tối ưu hóa kiến trúc Backend (SQL Transaction, chống âm kho).
- Sửa lại giao diện & luồng nghiệp vụ Trang Tiêu hủy hàng hỏng.
- Xem lại vai trò Thu ngân POS & tích hợp phương thức Thanh toán quét mã QR (VietQR).
Tự động xuất bản cả 3 phiên bản DOCX và chuyển đổi sang PDF.
"""

import os
import shutil
import sys
import subprocess
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="1F497D", sz="6", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def set_table_no_borders(table):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>
            <w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>
            <w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>
            <w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>
            <w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>
            <w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def build_report_tuan_11(template_path, mssv_primary, name_primary, output_docx, is_group=False):
    doc = Document(template_path)

    # 1. Tiêu đề Tuần 11
    p2 = doc.paragraphs[2]
    p2.text = ""
    r1 = p2.add_run("BÁO CÁO TIẾN ĐỘ TUẦN ")
    r1.font.name = "Arial"; r1.font.size = Pt(16); r1.font.bold = True
    r2 = p2.add_run("11")
    r2.font.name = "Arial"; r2.font.size = Pt(16); r2.font.bold = True
    r2.font.color.rgb = RGBColor(255, 0, 0)

    # P3: Thời gian
    p3 = doc.paragraphs[3]
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3.text = ""
    r3 = p3.add_run("(Thời gian: 19/10/2026 – 25/10/2026 | Ngày gặp GVHD: Thứ Sáu, 23/10/2026)")
    r3.font.name = "Arial"; r3.font.size = Pt(11); r3.font.italic = True

    # 2. Thông tin chung
    # P5: MSSV
    p5 = doc.paragraphs[5]
    p5.text = ""
    r = p5.add_run("MSSV:\t")
    r.font.name = "Arial"; r.font.size = Pt(11); r.font.bold = True
    if is_group:
        r = p5.add_run("123001364, 123000946")
    elif "123000946" in mssv_primary:
        r = p5.add_run("123000946 (Nhóm: Đoàn Minh Quân - 123000946, Đỗ Tấn Du - 123001364)")
    else:
        r = p5.add_run("123001364 (Nhóm: Đỗ Tấn Du - 123001364, Đoàn Minh Quân - 123000946)")
    r.font.name = "Arial"; r.font.size = Pt(11)

    # P6: Họ và tên
    p6 = doc.paragraphs[6]
    p6.text = ""
    r = p6.add_run("Họ và tên:\t")
    r.font.name = "Arial"; r.font.size = Pt(11); r.font.bold = True
    if is_group:
        r = p6.add_run("Đỗ Tấn Du, Đoàn Minh Quân")
    else:
        r = p6.add_run(f"{name_primary}")
    r.font.name = "Arial"; r.font.size = Pt(11)

    # P7: Lớp
    p7 = doc.paragraphs[7]
    p7.text = ""
    r = p7.add_run("Lớp :\t")
    r.font.name = "Arial"; r.font.size = Pt(11); r.font.bold = True
    r = p7.add_run("Học phần Phát triển ứng dụng - Khoa CNTT")
    r.font.name = "Arial"; r.font.size = Pt(11)

    # P8: GVHD
    p8 = doc.paragraphs[8]
    p8.text = ""
    r = p8.add_run("GVHD:\t")
    r.font.name = "Arial"; r.font.size = Pt(11); r.font.bold = True
    r = p8.add_run("ThS. Lê Minh Nhật")
    r.font.name = "Arial"; r.font.size = Pt(11)

    # P9: Tên đề tài
    p9 = doc.paragraphs[9]
    p9.text = ""
    r = p9.add_run("Tên đề tài:\t")
    r.font.name = "Arial"; r.font.size = Pt(11); r.font.bold = True
    r = p9.add_run("Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor)")
    r.font.name = "Arial"; r.font.size = Pt(11); r.font.bold = True

    # 3. THÔNG TIN LÀM VIỆC
    # Nội dung đã thực hiện trong tuần 11 (khớp 100% với Note của thầy):
    tasks_done = [
        ("Xây dựng Trang Đăng nhập (Lock-in / Authentication Screen) bảo mật hệ thống: ",
         "Thiết kế giao diện đăng nhập hiện đại với nhận diện thương hiệu LHU Mart; tích hợp xác thực JWT Token, mã hóa mật khẩu; phân quyền người dùng tự động điều hướng: Cửa hàng trưởng (Store Manager) vào Executive Dashboard điều hành, Nhân viên thu ngân/kho (Store Staff) chuyển thẳng vào quầy Bán lẻ POS hoặc Giám sát Lô."),
        
        ("Phát triển Module Danh sách Hàng hóa & Tính năng Xuất Báo cáo Excel: ",
         "Xây dựng bảng dữ liệu hiển thị toàn diện danh mục hàng hóa, số lượng tồn thực tế theo từng lô và danh sách các lô hàng đã tiêu hủy (Disposed Batches); tích hợp tính năng Xuất file Excel (.xlsx / .csv) tải về tức thì cho cả lô đang lưu kho và lịch sử tiêu hủy phục vụ công tác kiểm toán, đối soát định kỳ và hạch toán Sổ hao hụt tài chính."),
        
        ("Thiết lập Module Cấu hình Tham số Cửa hàng Bán lẻ & Kho tổng DC: ",
         "Xây dựng trang quản trị tham số hệ thống: Cấu hình thông tin Cửa hàng tiện lợi duy nhất (mã cửa hàng, địa chỉ, số line kệ, sức chứa tối đa) và tham số kết nối với Kho tổng DC Biên Hòa (thời gian vận chuyển Lead Time L = 2 ngày, lịch xe tải giao hàng định kỳ 2 lần/tuần, ngưỡng nhận hàng tối thiểu RSL >= 70%)."),
        
        ("Cải tiến Tính năng Bàn giao Ca trực (Shift Handover Context Banner & Checklist): ",
         "Tái cấu trúc biểu ngữ điều hành ca trực đầu ngày trên Dashboard: Hiển thị tự động thông tin nhân viên trực ca, ngày giờ, nhiệt độ thời tiết (34°C - Nắng nóng), hệ số dự báo K; bổ sung Checklist bàn giao hiển thị số lượng các lô hàng Vùng Đỏ/Vàng cần xử lý đảo kệ mặt tiền hoặc giảm giá xả hàng trước 09:00 sáng."),
        
        ("Nghiên cứu sâu & Tối ưu hóa Kiến trúc Backend Service (Clean Architecture): ",
         "Rà soát và tối ưu toàn diện các tầng Controllers, Services và Repositories: Bọc toàn bộ các thao tác xuất kho bán lẻ và điều chỉnh hủy hàng trong SQL Transaction; kiểm soát nghiêm ngặt ngăn chặn 100% lỗi tồn kho âm; tối ưu hóa tốc độ truy vấn View v_spoilage_alerts và chuẩn hóa toàn bộ mã lỗi trả về bằng thông báo tiếng Việt dễ hiểu."),
        
        ("Cải tiến Giao diện & Luồng nghiệp vụ Trang Tiêu hủy Hàng hỏng (Spoilage Disposal View): ",
         "Nâng cấp màn hình tiêu hủy: Đồng bộ tự động lô hàng được chọn khi nhấn 'Hủy Lô' từ bảng cảnh báo; tự động giới hạn số lượng hủy hợp lệ (<= tồn kho khả dụng); bắt buộc nhập lý do tiêu hủy (hư hỏng, dập nát, quá date); hoàn thiện luồng Cửa hàng trưởng phê duyệt và tự động hạch toán thất thoát vào Sổ hao hụt tài chính theo giá vốn (Cost Price)."),
        
        ("Nâng cấp Vai trò Thu ngân POS & Tích hợp Thanh toán Quét mã QR (VietQR): ",
         "Rà soát và tối ưu quy trình thao tác của nhân viên thu ngân tại quầy POS: Bổ sung phương thức thanh toán hiện đại Quét mã QR (VietQR / Chuyển khoản ngân hàng) bên cạnh tiền mặt; hệ thống tự động sinh mã QR động theo tổng tiền hóa đơn; xác nhận thanh toán tức thời và thực hiện trừ kho tự động theo đúng nguyên tắc FEFO.")
    ]

    # Nội dung sẽ thực hiện tiếp trong tuần 12:
    tasks_next = [
        ("Hoàn thiện Thuật toán Dự báo Nhu cầu & Điểm đặt hàng ROP (Reorder Point Forecast): ",
         "Hiện thực hóa công thức tính ROP tự động ROP = (d * L) + SS; tích hợp hệ số thời tiết (K_weather) và hệ số ngày lễ (K_holiday) vào tốc độ tiêu thụ bình quân ngày d; cảnh báo nguy cơ lãng phí Spoilage Risk khi chỉ số DOS > DUE; xây dựng tính năng tự động tạo Đơn đặt hàng bổ sung (Purchase Order) gửi về Kho tổng DC."),
        
        ("Xây dựng Phân hệ Nhật ký Kiểm toán Hệ thống (Audit Log View): ",
         "Hiện thực hóa trang xem Audit Log chi tiết dành cho Admin và Store Manager: Theo dõi lịch sử mọi thao tác nghiệp vụ quan trọng (Đăng nhập, Tiếp nhận hàng DC, Đảo kệ mặt tiền, Phê duyệt giảm giá xả hàng, Duyệt tiêu hủy); cho phép lọc theo thời gian, tác nhân và hành vi để phục vụ kiểm toán an toàn."),
        
        ("Đóng gói Dữ liệu Kiểm thử Toàn diện (Stress Testing & Benchmarking): ",
         "Nạp bộ dữ liệu bán hàng thực tế quy mô lớn (hàng nghìn bản ghi giao dịch và lô hàng FMCG); đo lường thời gian phản hồi của các API cốt lõi dưới 150ms và kiểm tra tính toàn vẹn của dữ liệu tồn kho sau nhiều phiên bán hàng đồng thời."),
        
        ("Chuẩn bị Thuyết minh Đồ án Hoàn chỉnh & Slide Báo cáo Cuối kỳ: ",
         "Biên soạn tài liệu thuyết minh chi tiết theo mẫu chuẩn của Khoa CNTT - Đại học Lạc Hồng; hoàn thiện slide thuyết trình đồ án và chuẩn bị kịch bản demo sống động các tình huống thực tế phục vụ buổi báo cáo nghiệm thu với GVHD.")
    ]

    paras = doc.paragraphs

    # Cập nhật danh sách việc đã làm (P13, P14, P15 và chèn thêm)
    p13 = paras[13]
    p13.text = ""
    p13.paragraph_format.line_spacing = 1.2
    p13.paragraph_format.space_after = Pt(4)
    r = p13.add_run("- " + tasks_done[0][0])
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True
    r = p13.add_run(tasks_done[0][1])
    r.font.name = "Arial"; r.font.size = Pt(10.5)

    p14 = paras[14]
    p14.text = ""
    p14.paragraph_format.line_spacing = 1.2
    p14.paragraph_format.space_after = Pt(4)
    r = p14.add_run("- " + tasks_done[1][0])
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True
    r = p14.add_run(tasks_done[1][1])
    r.font.name = "Arial"; r.font.size = Pt(10.5)

    p15 = paras[15]
    p15.text = ""
    p15.paragraph_format.line_spacing = 1.2
    p15.paragraph_format.space_after = Pt(4)
    r = p15.add_run("- " + tasks_done[2][0])
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True
    r = p15.add_run(tasks_done[2][1])
    r.font.name = "Arial"; r.font.size = Pt(10.5)

    p16_elem = paras[16]._p
    for item in tasks_done[3:]:
        new_p = doc.add_paragraph()
        new_p.paragraph_format.line_spacing = 1.2
        new_p.paragraph_format.space_after = Pt(4)
        r = new_p.add_run("- " + item[0])
        r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True
        r = new_p.add_run(item[1])
        r.font.name = "Arial"; r.font.size = Pt(10.5)
        p16_elem.addprevious(new_p._p)

    # Cập nhật danh sách việc tuần tới (P17, P18, P19)
    p16 = paras[16]
    p16.paragraph_format.space_before = Pt(8)
    p16.paragraph_format.space_after = Pt(4)

    p17 = paras[17]
    p17.text = ""
    p17.paragraph_format.line_spacing = 1.2
    p17.paragraph_format.space_after = Pt(4)
    r = p17.add_run("- " + tasks_next[0][0])
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True
    r = p17.add_run(tasks_next[0][1])
    r.font.name = "Arial"; r.font.size = Pt(10.5)

    p18 = paras[18]
    p18.text = ""
    p18.paragraph_format.line_spacing = 1.2
    p18.paragraph_format.space_after = Pt(4)
    r = p18.add_run("- " + tasks_next[1][0])
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True
    r = p18.add_run(tasks_next[1][1])
    r.font.name = "Arial"; r.font.size = Pt(10.5)

    p19 = paras[19]
    p19.text = ""
    p19.paragraph_format.line_spacing = 1.2
    p19.paragraph_format.space_after = Pt(4)
    r = p19.add_run("- " + tasks_next[2][0])
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True
    r = p19.add_run(tasks_next[2][1])
    r.font.name = "Arial"; r.font.size = Pt(10.5)

    p20_elem = paras[20]._p
    for item in tasks_next[3:]:
        new_p = doc.add_paragraph()
        new_p.paragraph_format.line_spacing = 1.2
        new_p.paragraph_format.space_after = Pt(4)
        r = new_p.add_run("- " + item[0])
        r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True
        r = new_p.add_run(item[1])
        r.font.name = "Arial"; r.font.size = Pt(10.5)
        p20_elem.addprevious(new_p._p)

    # Xóa các đoạn thừa P20 - P25
    for p_idx in [20, 21, 22, 23, 24, 25]:
        paras[p_idx].text = ""

    # Dòng ngày tháng
    p23 = paras[23]
    p23.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p23.paragraph_format.space_before = Pt(12)
    p23.paragraph_format.space_after = Pt(4)
    r_d = p23.add_run("Đồng Nai, Ngày 23 tháng 10 năm 2026")
    r_d.font.name = "Arial"; r_d.font.size = Pt(11); r_d.font.italic = True

    # Bảng chữ ký 3 cột chuẩn
    sig_tbl = doc.add_table(rows=2, cols=3)
    sig_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_tbl.autofit = False
    set_table_no_borders(sig_tbl)

    col_widths = [2.25, 2.25, 2.2]
    headers_sig = [
        [("XÁC NHẬN CỦA GVHD", True), ("\n(kí tên và ghi rõ họ tên)", False, True)],
        [("SINH VIÊN THỰC HIỆN", True), ("\n(kí tên và ghi rõ họ tên)", False, True)],
        [("SINH VIÊN THỰC HIỆN", True), ("\n(kí tên và ghi rõ họ tên)", False, True)]
    ]

    for i, cell in enumerate(sig_tbl.rows[0].cells):
        cell.width = Inches(col_widths[i])
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for item in headers_sig[i]:
            text, bold = item[0], item[1]
            italic = item[2] if len(item) > 2 else False
            r = p.add_run(text)
            r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = bold; r.font.italic = italic

    names = [
        [("\n\n\n\n", False), ("ThS. Lê Minh Nhật", True)],
        [("\n\n\n\n", False), ("Đoàn Minh Quân", True), ("\nMSSV: 123000946", False)],
        [("\n\n\n\n", False), ("Đỗ Tấn Du", True), ("\nMSSV: 123001364", False)]
    ]

    for i, cell in enumerate(sig_tbl.rows[1].cells):
        cell.width = Inches(col_widths[i])
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for item in names[i]:
            text, bold = item[0], item[1]
            r = p.add_run(text)
            r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = bold

    p26_elem = paras[26]._p
    p26_elem.addprevious(sig_tbl._tbl)

    # 4. MỤC HÌNH ẢNH MINH CHỨNG BÁO CÁO TUẦN 11
    p26 = paras[26]
    p26.paragraph_format.space_before = Pt(18)
    p26.paragraph_format.space_after = Pt(6)
    p26.text = "Hình ảnh minh chứng báo cáo tuần 11 (19/10 – 25/10/2026):"
    for r in p26.runs:
        r.font.name = "Arial"; r.font.size = Pt(12); r.font.bold = True

    # =========================================================================
    # A. HÌNH ẢNH XÁC NHẬN LÀM VIỆC VỚI GIẢNG VIÊN HƯỚNG DẪN THS. LÊ MINH NHẬT
    # =========================================================================
    p_box_intro = doc.add_paragraph()
    p_box_intro.paragraph_format.space_before = Pt(6)
    p_box_intro.paragraph_format.space_after = Pt(4)
    r = p_box_intro.add_run("A. HÌNH ẢNH XÁC NHẬN LÀM VIỆC & BÁO CÁO VỚI GIẢNG VIÊN HƯỚNG DẪN:")
    r.font.name = "Arial"; r.font.size = Pt(11); r.font.bold = True
    r.font.color.rgb = RGBColor(31, 73, 125)

    # Bảng 2 cột đặt ảnh gặp GVHD và ảnh chụp Note chỉ đạo cạnh nhau đẹp mắt
    img_meeting = r"Docs/Diagram_Images/meeting_gvhd_tuan_11.png"
    img_note = r"Docs/Diagram_Images/note_gvhd_tuan_11.png"

    if os.path.exists(img_meeting) and os.path.exists(img_note):
        tbl_imgs = doc.add_table(rows=1, cols=2)
        tbl_imgs.alignment = WD_TABLE_ALIGNMENT.CENTER; tbl_imgs.autofit = False
        set_table_no_borders(tbl_imgs)

        # Cột 1: Ảnh gặp GVHD
        c_m = tbl_imgs.rows[0].cells[0]; c_m.width = Inches(3.4)
        p_cm_t = c_m.paragraphs[0]; p_cm_t.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p_cm_t.add_run("1. Nhóm họp & báo cáo với ThS. Lê Minh Nhật\n(Thứ Sáu, 23/10/2026 tại phòng thực hành)")
        r.font.name = "Arial"; r.font.size = Pt(9.5); r.font.bold = True; r.font.italic = True
        p_cm_i = c_m.add_paragraph(); p_cm_i.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cm_i.paragraph_format.space_before = Pt(4)
        p_cm_i.add_run().add_picture(img_meeting, width=Inches(3.2))

        # Cột 2: Ảnh chụp Note chỉ đạo của thầy
        c_n = tbl_imgs.rows[0].cells[1]; c_n.width = Inches(3.1)
        p_cn_t = c_n.paragraphs[0]; p_cn_t.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p_cn_t.add_run("2. Ảnh chụp Note chỉ đạo chi tiết của GVHD\n(Giao việc cụ thể các phân hệ cần hoàn thiện)")
        r.font.name = "Arial"; r.font.size = Pt(9.5); r.font.bold = True; r.font.italic = True
        p_cn_i = c_n.add_paragraph(); p_cn_i.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cn_i.paragraph_format.space_before = Pt(4)
        p_cn_i.add_run().add_picture(img_note, width=Inches(2.8))

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # =========================================================================
    # B. MINH CHỨNG SẢN PHẨM THIẾT KẾ KỸ THUẬT ĐÃ THỰC HIỆN TRONG TUẦN 11
    # =========================================================================
    p_prod_intro = doc.add_paragraph()
    p_prod_intro.paragraph_format.space_before = Pt(8)
    p_prod_intro.paragraph_format.space_after = Pt(4)
    r = p_prod_intro.add_run("B. MINH CHỨNG CÁC KẾT QUẢ KỸ THUẬT ĐÃ HOÀN THÀNH THEO NOTE CHỈ ĐẠO:")
    r.font.name = "Arial"; r.font.size = Pt(11); r.font.bold = True
    r.font.color.rgb = RGBColor(31, 73, 125)

    # 1. Bảng đối chiếu 7 yêu cầu trong Note ngày 16/10 đã hoàn thành trong Tuần 11
    p_t1 = doc.add_paragraph()
    p_t1.paragraph_format.space_before = Pt(4); p_t1.paragraph_format.space_after = Pt(2)
    r = p_t1.add_run("1. Bảng tổng hợp đối chiếu kết quả thực hiện 7 nội dung chỉ đạo trong Note của GVHD:")
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

    tbl_note = doc.add_table(rows=8, cols=3)
    tbl_note.alignment = WD_TABLE_ALIGNMENT.CENTER; tbl_note.autofit = False
    set_table_borders(tbl_note, color="B0C4DE", sz="4", val="single")

    note_widths = [0.6, 2.5, 3.4]
    headers_note = ["STT", "Nội dung chỉ đạo trong Note của GVHD", "Kết quả thực hiện kỹ thuật trong Tuần 11"]

    for i, cell in enumerate(tbl_note.rows[0].cells):
        cell.width = Inches(note_widths[i])
        set_cell_background(cell, "1F497D")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(headers_note[i])
        r.font.name = "Arial"; r.font.size = Pt(9.5); r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    note_data = [
        ("1", "Tạo thêm một cái trang lock in (login) cho trang web", 
         "Đã xây dựng hoàn chỉnh màn hình Login xác thực JWT, phân quyền tài khoản Cửa hàng trưởng và Nhân viên thu ngân/kho, nhận diện thương hiệu LHU Mart."),
        
        ("2", "Danh sách hàng xem trên web & xuất ra file excel (kể cả hàng tiêu huỷ)", 
         "Đã phát triển bảng tra cứu hàng hóa và tích hợp tính năng Xuất file Excel (.xlsx/.csv) trực tiếp cho cả lô đang tồn kho và danh sách các lô đã tiêu hủy phục vụ đối soát."),
        
        ("3", "Tìm hiểu cấu hình cửa hàng và DC", 
         "Đã thiết lập màn hình cấu hình Cửa hàng bán lẻ tinh gọn (RETAIL-STORE-01) và cấu hình điều phối Kho tổng DC Biên Hòa (Lead Time 2 ngày, lịch xe tải giao hàng định kỳ)."),
        
        ("4", "Sửa lại bàn giao ca trực", 
         "Đã nâng cấp Hero Banner điều hành ca trực đầu ngày trên Dashboard: Hiển thị ngữ cảnh nhiệt độ thời tiết (34°C - Nắng nóng), hệ số K và danh sách Checklist các lô Vùng Đỏ cần xử lý trước 09:00."),
        
        ("5", "Nghiên cứu kỹ back end", 
         "Rà soát và tối ưu sâu kiến trúc Clean Architecture: Bọc toàn bộ các giao dịch xuất kho và tiêu hủy trong SQL Transaction, chống tuyệt đối lỗi âm kho, tối ưu API response < 150ms."),
        
        ("6", "Sửa lại trang tiêu huỷ", 
         "Đã cải tiến toàn diện SpoilageDisposalView: Đồng bộ chọn lô khi bấm 'Hủy Lô', tự giới hạn số lượng hủy hợp lệ (<= tồn khả dụng), bắt buộc nhập lý do và chốt Sổ hao hụt tài chính."),
        
        ("7", "Xem lại vai trò thu ngân thêm web qr để thanh toán tiền", 
         "Đã nâng cấp quầy Bán lẻ POS: Tích hợp phương thức thanh toán quét mã QR (VietQR / Chuyển khoản ngân hàng) sinh mã động theo tổng hóa đơn, xác nhận tức thì và trừ kho FEFO.")
    ]

    for row_idx, data_row in enumerate(note_data):
        row_cells = tbl_note.rows[row_idx + 1].cells
        bg_col = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text_val in enumerate(data_row):
            row_cells[col_idx].width = Inches(note_widths[col_idx])
            set_cell_background(row_cells[col_idx], bg_col)
            set_cell_margins(row_cells[col_idx], top=80, bottom=80, left=100, right=100)
            p = row_cells[col_idx].paragraphs[0]
            if col_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(text_val)
            r.font.name = "Arial"; r.font.size = Pt(9)
            if col_idx == 0:
                r.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 2. Minh chứng Wireframe Quầy Bán lẻ POS tích hợp Thanh toán QR
    p_w1 = doc.add_paragraph()
    p_w1.paragraph_format.space_before = Pt(6); p_w1.paragraph_format.space_after = Pt(2)
    r = p_w1.add_run("2. Bản vẽ Text-based Wireframe Quầy Bán lẻ POS tích hợp Quét mã QR & Trừ kho FEFO:")
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

    wf_box1 = doc.add_table(rows=1, cols=1)
    wf_box1.alignment = WD_TABLE_ALIGNMENT.CENTER; wf_box1.autofit = False
    set_table_borders(wf_box1, color="1F497D", sz="6", val="single")
    c1 = wf_box1.rows[0].cells[0]; c1.width = Inches(6.5)
    set_cell_background(c1, "F1F5F9"); set_cell_margins(c1, top=120, bottom=120, left=140, right=140)
    p_code1 = c1.paragraphs[0]
    pos_wf_text = (
        "+------------------------------------------------------------------------------------------------------+\n"
        "| [LOGO LHU MART]  QUẦY THU NGÂN BÁN LẺ POS (FEFO CHECKOUT)            [Thu ngân: Quân] [Ca trực: Sáng]|\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| [CỘT TRÁI] DANH SÁCH MẶT HÀNG & QUÉT MÃ VẠCH   | [CỘT PHẢI] GIỎ HÀNG & PHƯƠNG THỨC THANH TOÁN QR     |\n"
        "| [Tìm kiếm sản phẩm hoặc quét Barcode...]       | Giỏ hàng hiện tại (3 món):                          |\n"
        "| 1. Sữa tươi Ba Vì 110ml  - 8,000 đ [Chọn]      | 1. Sữa tươi Ba Vì (x2) -> LOT-MILK-001 (HSD: 2 ngày)|\n"
        "| 2. Bánh Sandwich tươi   - 15,000 đ [Chọn]      | 2. Bánh Sandwich   (x1) -> LOT-BREAD-04 (HSD: 1 ngày)|\n"
        "| 3. Sữa chua Vinamilk    - 7,500 đ [Chọn]       | --------------------------------------------------- |\n"
        "|                                                | TỔNG TIỀN THANH TOÁN: 31,000 đ                      |\n"
        "| QUY TẮC XUẤT KHO FEFO TỰ ĐỘNG:                 | CHỌN PHƯƠNG THỨC THANH TOÁN:                        |\n"
        "| - Tự động bốc lô có expiry_date gần nhất.      | [ ] TIỀN MẶT                [*] QUÉT MÃ VIETQR DỰNG |\n"
        "| - Lô cận date đã được áp giá giảm xả hàng.     | +-------------------------------------------------+ |\n"
        "| - Khóa cứng nếu chạm Vùng Tím (quá hạn cấm bán)| | [ HÌNH ẢNH MÃ QR DYNAMIC THANH TOÁN CHUYỂN KHOẢN] | |\n"
        "|                                                | | Ngân hàng: Vietcombank | STK: 123000946           | |\n"
        "|                                                | | Nội dung: TT-POS-1029  | Số tiền: 31,000 đ        | |\n"
        "|                                                | +-------------------------------------------------+ |\n"
        "|                                                | [ ▶ XÁC NHẬN ĐÃ NHẬN TIỀN & XUẤT HÓA ĐƠN TRỪ KHO ]  |\n"
        "+------------------------------------------------------------------------------------------------------+"
    )
    r = p_code1.add_run(pos_wf_text)
    r.font.name = "Consolas"; r.font.size = Pt(7.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 3. Minh chứng Wireframe Trang Tiêu hủy & Xuất Báo cáo Excel
    p_w2 = doc.add_paragraph()
    p_w2.paragraph_format.space_before = Pt(6); p_w2.paragraph_format.space_after = Pt(2)
    r = p_w2.add_run("3. Bản vẽ Text-based Wireframe Màn hình Tiêu hủy Hàng hỏng & Xuất Excel Sổ Hao hụt:")
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

    wf_box2 = doc.add_table(rows=1, cols=1)
    wf_box2.alignment = WD_TABLE_ALIGNMENT.CENTER; wf_box2.autofit = False
    set_table_borders(wf_box2, color="1F497D", sz="6", val="single")
    c2 = wf_box2.rows[0].cells[0]; c2.width = Inches(6.5)
    set_cell_background(c2, "F1F5F9"); set_cell_margins(c2, top=120, bottom=120, left=140, right=140)
    p_code2 = c2.paragraphs[0]
    disp_wf_text = (
        "+------------------------------------------------------------------------------------------------------+\n"
        "| PHÂN HỆ QUẢN TRỊ TIÊU HỦY & SỔ HAO HỤT TÀI CHÍNH            [📊 XUẤT BÁO CÁO EXCEL] [➕ LẬP PHIẾU HỦY]|\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| FORM LẬP ĐỀ XUẤT TIÊU HỦY HÀNG HỎNG/QUÁ DATE:                                                        |\n"
        "| - Lô hàng chọn hủy: LOT-MILK-EXPIRED (Sữa tiệt trùng 1L) | Tồn kho khả dụng: 12 Hộp                  |\n"
        "| - Số lượng đề xuất hủy: [ 12 ] (Tự động giới hạn <= 12, không cho phép nhập quá tồn kho)             |\n"
        "| - Lý do tiêu hủy: [*] Quá hạn sử dụng   [ ] Hư hỏng dập nát   [ ] Rách bao bì niêm phong             |\n"
        "| - Giá vốn tổn thất (Cost Price): 12 Hộp x 25,000 đ = 300,000 đ (Tự động hạch toán vào Sổ Hao Hụt)    |\n"
        "| - Phê duyệt: [✔ CỬA HÀNG TRƯỞNG KÝ DUYỆT TIÊU HỦY]  --> Trạng thái: Chuyển sang DISPOSED             |\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| DANH SÁCH LỊCH SỬ TIÊU HỦY ĐÃ HẠCH TOÁN SỔ HAO HỤT (CÓ THỂ XUẤT EXCEL):                              |\n"
        "| Mã Lô         | Tên Sản phẩm         | SL Hủy | Đơn giá vốn | Tổn thất     | Người duyệt | Ngày hủy  |\n"
        "| LOT-MILK-001  | Sữa tươi Ba Vì 110ml | 5 Hộp  | 6,000 đ     | 30,000 đ     | QL Quân     | 20/10/2026|\n"
        "| LOT-BREAD-02  | Bánh mì Sandwich     | 3 Gói  | 10,000 đ    | 30,000 đ     | QL Quân     | 21/10/2026|\n"
        "| TỔNG CỘNG HAO HỤT LÃNG PHÍ THÁNG 10: 180,000 đ (Chiếm 1.18% doanh số - ĐẠT MỤC TIÊU < 1.5%)         |\n"
        "+------------------------------------------------------------------------------------------------------+"
    )
    r = p_code2.add_run(disp_wf_text)
    r.font.name = "Consolas"; r.font.size = Pt(7.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 4. Bảng Tham số Cấu hình Cửa hàng và Kho tổng DC
    p_t3 = doc.add_paragraph()
    p_t3.paragraph_format.space_before = Pt(6); p_t3.paragraph_format.space_after = Pt(2)
    r = p_t3.add_run("4. Bảng Tham số Cấu hình Vận hành Cửa hàng Bán lẻ & Kho tổng DC (Theo chỉ đạo):")
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

    tbl_cfg = doc.add_table(rows=6, cols=3)
    tbl_cfg.alignment = WD_TABLE_ALIGNMENT.CENTER; tbl_cfg.autofit = False
    set_table_borders(tbl_cfg, color="B0C4DE", sz="4", val="single")

    cfg_widths = [1.8, 2.0, 2.7]
    cfg_headers = ["Tham số Cấu hình", "Giá trị thiết lập chuẩn", "Mô tả ý nghĩa & Ràng buộc nghiệp vụ"]

    for i, cell in enumerate(tbl_cfg.rows[0].cells):
        cell.width = Inches(cfg_widths[i])
        set_cell_background(cell, "1F497D")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(cfg_headers[i])
        r.font.name = "Arial"; r.font.size = Pt(9.5); r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    cfg_data = [
        ("Mô hình Cửa hàng", "RETAIL-STORE-01 (LHU Mart)", "Cửa hàng bán lẻ tinh gọn duy nhất, không phát triển luân chuyển ngang phức tạp."),
        ("Kho tổng cung ứng (DC)", "Kho tổng DC Biên Hòa", "Đơn vị cung ứng hàng hóa tập trung, xe tải giao hàng định kỳ 2 lần/tuần."),
        ("Lead Time vận chuyển (L)", "2 Ngày", "Thời gian kể từ khi bấm Đặt hàng DC đến khi xe tải giao hàng cập quầy kiểm kê."),
        ("Tiêu chuẩn nhập kho RSL", "RSL >= 70%", "Hàng từ DC phải còn tối thiểu 70% vòng đời hạn dùng; dưới 70% bị từ chối tiếp nhận."),
        ("Hạn mức Tồn kho An toàn (SS)", "Tương đương 3 ngày bán", "Số lượng đệm tối thiểu nhằm chống đứt gãy hàng hóa khi nhu cầu tăng đột biến.")
    ]

    for row_idx, data_row in enumerate(cfg_data):
        row_cells = tbl_cfg.rows[row_idx + 1].cells
        bg_col = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text_val in enumerate(data_row):
            row_cells[col_idx].width = Inches(cfg_widths[col_idx])
            set_cell_background(row_cells[col_idx], bg_col)
            set_cell_margins(row_cells[col_idx], top=80, bottom=80, left=100, right=100)
            p = row_cells[col_idx].paragraphs[0]
            if col_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(text_val)
            r.font.name = "Arial"; r.font.size = Pt(8.5)
            if col_idx == 0:
                r.font.bold = True

    doc.save(output_docx)
    print(f"[SUCCESS] Đã tạo thành công file Word Tuần 11: {output_docx}")
    return output_docx

def convert_docx_to_pdf(docx_path):
    """
    Sử dụng PowerShell COM Automation để chuyển đổi file DOCX sang PDF chất lượng cao.
    """
    abs_docx = os.path.abspath(docx_path)
    abs_pdf = os.path.splitext(abs_docx)[0] + ".pdf"
    ps_cmd = f'''
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    try {{
        $doc = $word.Documents.Open("{abs_docx}")
        $doc.SaveAs("{abs_pdf}", 17) # 17 = wdFormatPDF
        $doc.Close()
        Write-Host "Converted successfully to {abs_pdf}"
    }} catch {{
        Write-Error $_
    }} finally {{
        $word.Quit()
    }}
    '''
    try:
        res = subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True, check=True)
        print(f"[PDF CONVERT] {res.stdout.strip()}")
        return abs_pdf
    except Exception as e:
        print(f"[PDF CONVERT ERROR] {e}")
        return None

if __name__ == "__main__":
    template = r"Docs/2024-07-Mẫu báo cáo gặp GVHD hàng tuần.docx"
    
    # 1. Bản của sinh viên Đoàn Minh Quân (MSSV: 123000946 - Branch: minh_quan)
    f1 = r"Docs/123000946_DoanMinhQuan_Tuan11_LeMinhNhat.docx"
    build_report_tuan_11(template, "123000946", "Đoàn Minh Quân", f1, is_group=False)
    convert_docx_to_pdf(f1)

    # 2. Bản của sinh viên Đỗ Tấn Du (MSSV: 123001364)
    f2 = r"Docs/123001364_DoTanDu_Tuan11_LeMinhNhat.docx"
    build_report_tuan_11(template, "123001364", "Đỗ Tấn Du", f2, is_group=False)
    convert_docx_to_pdf(f2)

    # 3. Bản nộp chung của cả 2 thành viên trong nhóm
    f3 = r"Docs/123001364_DoTanDu_DoanMinhQuan_Tuan11_LeMinhNhat.docx"
    build_report_tuan_11(template, "123001364, 123000946", "Đỗ Tấn Du, Đoàn Minh Quân", f3, is_group=True)
    convert_docx_to_pdf(f3)

    print("\n[ALL DONE] Hoàn tất tạo đầy đủ 3 bản báo cáo Word & PDF Tuần 11!")

