# -*- coding: utf-8 -*-
"""
Script tạo Báo cáo Tiến độ Tuần 09 gặp GVHD ThS. Lê Minh Nhật (ngày 09/10/2026)
Chuẩn theo mẫu chính thức của Khoa CNTT - Đại học Lạc Hồng (LHU).
Bám sát 100% nội dung chỉ đạo trong Note:
- Triển khai module rồi đưa vào file Word Đặc tả hết nội dung.
- Chuẩn hóa lại các file Markdown nghiệp vụ và rà soát lại đúng yêu cầu Bán lẻ tinh gọn.
- Triển khai phân kỳ 3 - 4 module trọng tâm trước (Nhập DC, Giám sát FEFO, POS, Quick Markdown).
- Thiết kế giao diện tham khảo quy chuẩn Skills/ và AI phác thảo khung giao diện.
Nội dung tuần tiếp theo (Tuần 10): Ghi lại chính xác toàn bộ các công việc tuần 10 theo yêu cầu người dùng.
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

def build_report_tuan_9(template_path, mssv_primary, name_primary, output_docx, is_group=False):
    doc = Document(template_path)

    # 1. Tiêu đề Tuần 09
    p2 = doc.paragraphs[2]
    p2.text = ""
    r1 = p2.add_run("BÁO CÁO TIẾN ĐỘ TUẦN ")
    r1.font.name = "Arial"; r1.font.size = Pt(16); r1.font.bold = True
    r2 = p2.add_run("09")
    r2.font.name = "Arial"; r2.font.size = Pt(16); r2.font.bold = True
    r2.font.color.rgb = RGBColor(255, 0, 0)

    # P3: Thời gian
    p3 = doc.paragraphs[3]
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3.text = ""
    r3 = p3.add_run("(Thời gian: 05/10/2026 – 11/10/2026 | Ngày gặp GVHD: Thứ Sáu, 09/10/2026)")
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
    # Nội dung đã thực hiện trong tuần 9 (khớp 100% với Note chỉ đạo ngày 25/9 của thầy):
    tasks_done = [
        ("Đưa kiến trúc triển khai các module vào văn bản Word Đặc tả hệ thống hoàn chỉnh: ",
         "Tổng hợp toàn bộ cấu trúc kiến trúc phân tầng Clean Architecture, danh mục các ca sử dụng trọng tâm và thiết kế RESTful API đưa vào tài liệu Word đặc tả chính thức ('ĐẶC TẢ NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ'); văn bản hóa chi tiết luồng dữ liệu và quy chuẩn kỹ thuật theo đúng định hướng của GVHD."),
        
        ("Triển khai lại bộ tài liệu Markdown kỹ thuật và rà soát đối chiếu nghiệp vụ: ",
         "Rà soát và chuẩn hóa đồng bộ 15 file Markdown nghiệp vụ trong thư mục Docs/ (từ 00-chot-yeu-cau-va-quyet-dinh-ky-thuat.md đến 14-canh-bao-ton-kho-va-du-bao-tai-dat-hang.md); kiểm tra kỹ lưỡng các ràng buộc cốt lõi: mô hình Bán lẻ tinh gọn (DC -> Cửa hàng -> Khách hàng), cơ chế xuất kho bán lẻ FEFO, 3 ngưỡng an toàn RSL % và loại bỏ triệt để các luồng điều chuyển ngang phức tạp."),
        
        ("Triển khai phân kỳ theo cụm, hoàn thiện 3 đến 4 module cốt lõi trọng tâm: ",
         "Thực hiện phương châm cuốn chiếu chất lượng cao, tập trung phát triển và kiểm thử dứt điểm 4 module then chốt của hệ thống: 1) Module Quản lý Sản phẩm & Tiếp nhận Lô hàng từ DC (thẩm định RSL >= 70%); 2) Module Giám sát Hạn sử dụng theo lô & Phân loại 3 vùng màu (FEFO Monitor); 3) Module Bán lẻ POS tự động trừ kho theo nguyên tắc FEFO; 4) Module Đảo kệ mặt tiền và Kích hoạt giảm giá xả hàng nhanh (Quick Markdown)."),
        
        ("Thiết kế giao diện tham khảo quy chuẩn Skills kết hợp AI phác thảo bản vẽ: ",
         "Tham khảo các tiêu chuẩn UI/UX từ bộ kỹ năng hệ thống (Skills/clean-architecture, Skills/spoilage-business-rules) kết hợp công cụ AI hỗ trợ phác thảo khung giao diện; từ đó xây dựng giao diện người dùng thực tế cho 4 module cốt lõi: Màn hình Dashboard điều hành, Bảng giám sát lô hàng FEFO, Quầy thu ngân POS cảm ứng và Hộp thoại xác nhận giảm giá xả hàng.")
    ]

    # Nội dung sẽ thực hiện tiếp trong tuần 10 (Ghi lại toàn bộ công việc tuần 10 theo yêu cầu):
    tasks_next = [
        ("Kiểm tra lại toàn diện các Quy tắc nghiệp vụ (Business Rules) trong file Word Đặc tả: ",
         "Rà soát và chuẩn hóa 10 Quy tắc cốt lõi (BR-01 đến BR-10), loại bỏ triệt để các xung đột logic giữa: nguyên tắc xuất kho FEFO (First Expired, First Out), 3 ngưỡng an toàn RSL (% Vòng đời còn lại: Vùng Xanh > 20%, Vùng Vàng 10% - 20%, Vùng Đỏ <= 10%, Vùng Tím <= 0 ngày - khóa bán tự động), ràng buộc kỹ thuật tuyệt đối không bao giờ để xảy ra âm kho, và quy trình xử lý hàng hư hỏng."),
        
        ("Bổ sung người chịu trách nhiệm quản lý khi tiếp nhận nhập kho từ Kho tổng (DC): ",
         "Quy định rõ ràng vai trò và trách nhiệm pháp lý của Cửa hàng trưởng (Store Manager) trong biên bản tiếp nhận giao hàng theo đợt từ DC. Cửa hàng trưởng là người trực tiếp kiểm tra niêm phong xe tải, kiểm định điều kiện hạn sử dụng tối thiểu khi nhập kho (RSL >= 70%), ký số biên bản nhập lô và chịu trách nhiệm giải trình bồi thường nếu để lọt hàng cận date hoặc sai lệch số lượng."),
        
        ("Phân tích chi tiết chức năng người dùng và thiết kế luồng sự kiện (Flow of Events): ",
         "Hoàn thành tài liệu phân tích chi tiết cho 8 ca sử dụng/chức năng trọng tâm của hệ thống (Nhập kho từ DC, Quét & Kiểm kê lô, Giám sát cận date FEFO, Bán lẻ POS trừ kho tự động, Kích hoạt Quick Markdown xả hàng, Lập đề xuất tiêu hủy, Dự báo đặt hàng ROP, Xem nhật ký kiểm toán Audit Log); mỗi chức năng đều mô tả chi tiết: Tác nhân (Actor), Mục đích (Goal), Tiền điều kiện (Precondition), Luồng sự kiện chính từng bước (Main Flow) và Luồng ngoại lệ/Rẽ nhánh (Alternative/Exception Flows)."),
        
        ("Thiết kế giao diện UI/UX bằng khung Wireframe Hero Section: ",
         "Xây dựng bản vẽ khung giao diện trực quan (Wireframe Layout) dạng Hero Section cho Landing Page cổng thông tin giới thiệu giải pháp chống lãng phí và Khung Hero Banner điều hành ca trực đầu ngày trên Dashboard Cửa hàng trưởng (tóm tắt ngữ cảnh nhiệt độ thời tiết, hệ số tiêu thụ K, và cảnh báo danh sách các lô đỏ cần xử lý khẩn cấp trước 09:00)."),
        
        ("Xây dựng khung Dashboard hoàn chỉnh bằng Text-Based Wireframe: ",
         "Phác thảo toàn diện bố cục giao diện Executive Dashboard bằng Text-based Wireframe đa chiều, phân chia khoa học thành 6 khối thẻ KPI tài chính & vận hành thời gian thực (Tổng vốn tồn kho, Vốn rủi ro cận date, Tỷ lệ lãng phí Spoilage Rate %, Doanh số hôm nay, Lô cần xử lý khẩn, Đơn hàng đề xuất DC), khung phân tích 2 cột gồm Biểu đồ trực quan và Action Board khẩn cấp theo từng lô hàng, cùng Bảng cảnh báo nguy cơ ứ đọng hàng (DOS > DUE)."),
        
        ("Bố trí và hoàn thiện Bảng quy chuẩn Business Rules ở cuối tài liệu: ",
         "Tổng hợp toàn bộ 10 Quy tắc nghiệp vụ (BR-01 đến BR-10) kèm công thức toán học định lượng, điều kiện kích hoạt, hành vi xử lý của hệ thống và ràng buộc CSDL đặt ở phần cuối tài liệu đặc tả, tạo căn cứ quy chuẩn đối chiếu cho lập trình Backend, Frontend và Database."),
        
        ("Xây dựng hồ sơ người dùng (User Persona) trước khi phân tích quyền hạn: ",
         "Xây dựng hồ sơ chi tiết 2 Persona người dùng cốt lõi: Cửa hàng trưởng (Store Manager - Quản trị vận hành vĩ mô, duyệt nhập DC, duyệt hủy, giám sát KPI lãng phí, xem Audit Log) và Nhân viên bán hàng / Thủ kho (Store Staff - Tác nghiệp vi mô: quét mã vạch POS, sắp xếp đảo kệ FEFO, lập đề xuất hủy hàng); phân định ma trận phân quyền RACI rõ ràng giữa việc được phép làm và danh mục hành vi bị nghiêm cấm (nghiêm cấm can thiệp sửa HSD lô, nghiêm cấm xuất âm kho).")
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
    r_d = p23.add_run("Đồng Nai, Ngày 09 tháng 10 năm 2026")
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

    # 4. MỤC HÌNH ẢNH MINH CHỨNG BÁO CÁO TUẦN 09
    p26 = paras[26]
    p26.paragraph_format.space_before = Pt(18)
    p26.paragraph_format.space_after = Pt(6)
    p26.text = "Hình ảnh minh chứng báo cáo tuần 09 (05/10 – 11/10/2026):"
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

    # Ảnh chụp Note chỉ đạo của thầy ngày 25/9
    img_note = r"Docs/Diagram_Images/note_gvhd_tuan_09.png"
    if os.path.exists(img_note):
        p_cap1 = doc.add_paragraph()
        p_cap1.paragraph_format.space_before = Pt(4); p_cap1.paragraph_format.space_after = Pt(2)
        r = p_cap1.add_run("1. Ảnh chụp Note chỉ đạo của ThS. Lê Minh Nhật về định hướng 'Triển khai module rồi đưa vào file word đặc tả':")
        r.font.name = "Arial"; r.font.size = Pt(10); r.font.bold = True; r.font.italic = True

        p_img1 = doc.add_paragraph()
        p_img1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img1.paragraph_format.space_after = Pt(10)
        p_img1.add_run().add_picture(img_note, width=Inches(3.2))

    # =========================================================================
    # B. MINH CHỨNG SẢN PHẨM THIẾT KẾ KỸ THUẬT ĐÃ THỰC HIỆN TRONG TUẦN 09
    # =========================================================================
    p_prod_intro = doc.add_paragraph()
    p_prod_intro.paragraph_format.space_before = Pt(8)
    p_prod_intro.paragraph_format.space_after = Pt(4)
    r = p_prod_intro.add_run("B. MINH CHỨNG CÁC KẾT QUẢ KỸ THUẬT ĐÃ HOÀN THÀNH TRONG TUẦN 09:")
    r.font.name = "Arial"; r.font.size = Pt(11); r.font.bold = True
    r.font.color.rgb = RGBColor(31, 73, 125)

    # 1. Bảng đối chiếu 4 nội dung chỉ đạo trong Note
    p_t1 = doc.add_paragraph()
    p_t1.paragraph_format.space_before = Pt(4); p_t1.paragraph_format.space_after = Pt(2)
    r = p_t1.add_run("1. Bảng đối chiếu kết quả triển khai 4 nội dung chỉ đạo trong Note của GVHD:")
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

    tbl_note = doc.add_table(rows=5, cols=3)
    tbl_note.alignment = WD_TABLE_ALIGNMENT.CENTER; tbl_note.autofit = False
    set_table_borders(tbl_note, color="B0C4DE", sz="4", val="single")

    note_widths = [0.6, 2.5, 3.4]
    headers_note = ["STT", "Nội dung chỉ đạo trong Note của GVHD", "Kết quả thực hiện kỹ thuật trong Tuần 09"]

    for i, cell in enumerate(tbl_note.rows[0].cells):
        cell.width = Inches(note_widths[i])
        set_cell_background(cell, "1F497D")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(headers_note[i])
        r.font.name = "Arial"; r.font.size = Pt(9.5); r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    note_data = [
        ("1", "Triển khai module rồi đưa cho file word đặc tả hết nội dung", 
         "Đã tổng hợp toàn bộ kiến trúc Clean Architecture, Use Case và danh mục RESTful API đưa vào văn bản Word Đặc tả hệ thống chính thức."),
        
        ("2", "Triển khai lại file markdown và rà soát lại coi đúng ý chưa", 
         "Đã chuẩn hóa và rà soát kỹ lưỡng 15 tài liệu Markdown trong thư mục Docs/ (00 đến 14), đảm bảo 100% tuân thủ mô hình Bán lẻ tinh gọn FEFO và 3 ngưỡng RSL %."),
        
        ("3", "Triển khai từng module rồi làm 3 đến 4 module trước ko làm hết một lúc", 
         "Đã tập trung hoàn thiện dứt điểm 4 module trọng tâm: Nhập hàng từ DC (RSL >= 70%), Giám sát lô hàng FEFO 3 vùng màu, Quầy bán lẻ POS trừ kho tự động, và Đảo kệ/Quick Markdown."),
        
        ("4", "Giao diện : tham khảo trên skills và nhờ AI vẽ giao diện, rồi xây giao diện triển khai khoảng 3 đến 4 module", 
         "Đã ứng dụng quy chuẩn UI/UX từ Skills/ kết hợp AI phác thảo bản vẽ, xây dựng giao diện trực quan cho 4 phân hệ lõi: Dashboard, FEFO Monitor, POS Screen và Markdown Modal.")
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

    # 2. Bảng phân rã 4 Module Cốt lõi đã triển khai trong Tuần 09
    p_t2 = doc.add_paragraph()
    p_t2.paragraph_format.space_before = Pt(6); p_t2.paragraph_format.space_after = Pt(2)
    r = p_t2.add_run("2. Bảng phân rã 4 Module Trọng tâm Cốt lõi đã triển khai hoàn thiện trong Tuần 09:")
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

    tbl_mod = doc.add_table(rows=5, cols=3)
    tbl_mod.alignment = WD_TABLE_ALIGNMENT.CENTER; tbl_mod.autofit = False
    set_table_borders(tbl_mod, color="B0C4DE", sz="4", val="single")

    mod_widths = [1.8, 2.2, 2.5]
    mod_headers = ["Tên Phân hệ Module", "Phạm vi chức năng cốt lõi", "Công nghệ & Ràng buộc kỹ thuật"]

    for i, cell in enumerate(tbl_mod.rows[0].cells):
        cell.width = Inches(mod_widths[i])
        set_cell_background(cell, "1F497D")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(mod_headers[i])
        r.font.name = "Arial"; r.font.size = Pt(9.5); r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    mod_data = [
        ("Module 1:\nTiếp nhận Lô DC", 
         "Tiếp nhận hàng từ Kho tổng DC, kiểm tra điều kiện RSL >= 70%, tự tính expiry_date và sinh mã lô batch_code.", 
         "POST /api/batches/inbound\nKiểm tra ràng buộc shelf_life_days."),
        
        ("Module 2:\nGiám sát Lô FEFO", 
         "Theo dõi hạn sử dụng từng lô, phân loại 4 trạng thái màu (Xanh, Vàng, Đỏ, Tím), cảnh báo số ngày còn lại.", 
         "GET /api/batches\nTruy vấn SQL View v_spoilage_alerts."),
        
        ("Module 3:\nBán lẻ POS FEFO", 
         "Quét mã vạch bán hàng, tự động dò tìm và trừ kho ở lô có expiry_date gần nhất; bẻ nhiều lô; khóa bán quá hạn.", 
         "POST /api/sales/checkout\nSQL Transaction chống âm kho."),
        
        ("Module 4:\nĐảo kệ & Quick Markdown", 
         "Ghi nhận cờ đảo kệ shelf_rotated = 1 cho lô cận date; Cửa hàng trưởng duyệt chiết khấu 15%-50% cập nhật POS.", 
         "PATCH /api/batches/:id/markdown\nPATCH /api/batches/:id/rotate")
    ]

    for row_idx, data_row in enumerate(mod_data):
        row_cells = tbl_mod.rows[row_idx + 1].cells
        bg_col = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text_val in enumerate(data_row):
            row_cells[col_idx].width = Inches(mod_widths[col_idx])
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

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 3. Minh chứng Sơ đồ Use Case tổng thể hệ thống
    img_usecase = r"Docs/Diagram_Images/use_case.png"
    if os.path.exists(img_usecase):
        p_t3 = doc.add_paragraph()
        p_t3.paragraph_format.space_before = Pt(6); p_t3.paragraph_format.space_after = Pt(2)
        r = p_t3.add_run("3. Sơ đồ Use Case tổng thể các Phân hệ cốt lõi đã đưa vào Văn bản Đặc tả Word:")
        r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

        p_img_uc = doc.add_paragraph()
        p_img_uc.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img_uc.paragraph_format.space_after = Pt(10)
        p_img_uc.add_run().add_picture(img_usecase, width=Inches(6.2))

    doc.save(output_docx)
    print(f"[SUCCESS] Đã tạo thành công file Word Tuần 09: {output_docx}")
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
    f1 = r"Docs/123000946_DoanMinhQuan_Tuan09_LeMinhNhat.docx"
    build_report_tuan_9(template, "123000946", "Đoàn Minh Quân", f1, is_group=False)
    convert_docx_to_pdf(f1)

    # 2. Bản của sinh viên Đỗ Tấn Du (MSSV: 123001364)
    f2 = r"Docs/123001364_DoTanDu_Tuan09_LeMinhNhat.docx"
    build_report_tuan_9(template, "123001364", "Đỗ Tấn Du", f2, is_group=False)
    convert_docx_to_pdf(f2)

    # 3. Bản nộp chung của cả 2 thành viên trong nhóm
    f3 = r"Docs/123001364_DoTanDu_DoanMinhQuan_Tuan09_LeMinhNhat.docx"
    build_report_tuan_9(template, "123001364, 123000946", "Đỗ Tấn Du, Đoàn Minh Quân", f3, is_group=True)
    convert_docx_to_pdf(f3)

    print("\n[ALL DONE] Hoàn tất tạo đầy đủ 3 bản báo cáo Word & PDF Tuần 09!")

