# -*- coding: utf-8 -*-
"""
Script tạo Báo cáo Tiến độ Tuần 10 gặp GVHD ThS. Lê Minh Nhật (ngày 16/10/2026)
Chuẩn theo mẫu chính thức của Khoa CNTT - Đại học Lạc Hồng (LHU).
Bám sát 100% nội dung chỉ đạo trong 'Note ngày 16/10' của thầy và hình ảnh làm việc thực tế.
Tự động xuất bản cả 3 phiên bản DOCX và chuyển đổi sang PDF:
1. Bản cá nhân Đoàn Minh Quân (MSSV: 123000946)
2. Bản cá nhân Đỗ Tấn Du (MSSV: 123001364)
3. Bản chung nhóm cả 2 sinh viên
"""

import os
import shutil
import sys
import subprocess
import docx

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

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

def build_report_tuan_10(template_path, mssv_primary, name_primary, output_docx, is_group=False):
    doc = Document(template_path)

    # 1. Tiêu đề Tuần 10
    p2 = doc.paragraphs[2]
    p2.text = ""
    r1 = p2.add_run("BÁO CÁO TIẾN ĐỘ TUẦN ")
    r1.font.name = "Arial"; r1.font.size = Pt(16); r1.font.bold = True
    r2 = p2.add_run("10")
    r2.font.name = "Arial"; r2.font.size = Pt(16); r2.font.bold = True
    r2.font.color.rgb = RGBColor(255, 0, 0)

    # P3: Thời gian
    p3 = doc.paragraphs[3]
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3.text = ""
    r3 = p3.add_run("(Thời gian: 12/10/2026 – 18/10/2026 | Ngày gặp GVHD: Thứ Sáu, 16/10/2026)")
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
    # Nội dung đã thực hiện trong tuần 10 (khớp 100% với 7 điểm trong note của thầy giáo):
    tasks_done = [
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

    # Nội dung sẽ thực hiện tiếp trong tuần 11:
    tasks_next = [
        ("Hiện thực hóa giao diện Frontend theo Wireframe Hero Section & Dashboard: ",
         "Chuyển đổi các khung Wireframe dạng Text/Box Layout thành các component React chuẩn mực kết hợp TailwindCSS và Lucide Icons; tích hợp 6 thẻ KPI động kết nối dữ liệu thật từ Backend API; tối ưu giao diện Dark/Light mode và thiết kế Responsive phù hợp cả màn hình máy tính bàn, máy POS cảm ứng và máy tính bảng kiểm kho."),
        
        ("Lập trình hoàn thiện Module Bán lẻ POS & Thuật toán xuất kho FEFO tự động: ",
         "Hiện thực hóa luồng bán lẻ tại quầy POS: Nhân viên chọn sản phẩm hoặc quét mã vạch, hệ thống tự động dò tìm và ưu tiên trừ số lượng ở lô có hạn sử dụng gần nhất (FEFO); tự động bẻ nhiều lô nếu giỏ hàng lớn hơn tồn kho 1 lô; kích hoạt cơ chế khóa cứng không cho phép thanh toán sản phẩm quá hạn (RSL <= 0 ngày) và xuất hóa đơn chi tiết thông tin lô hàng."),
        
        ("Xây dựng Module Đề xuất & Phê duyệt Tiêu hủy (Spoilage Disposal Workflow): ",
         "Hoàn thiện quy trình nghiệp vụ 2 bước: Nhân viên kho lập phiếu đề xuất tiêu hủy đối với các lô hàng quá hạn hoặc dập nát hư hỏng trong quá trình bảo quản -> Cửa hàng trưởng tiếp nhận thông báo, kiểm tra thực tế và bấm nút duyệt tiêu hủy -> Hệ thống tự động chuyển trạng thái lô sang DISPOSED, khấu trừ tồn kho về 0 và hạch toán giá trị thất thoát vào Sổ hao hụt tài chính."),
        
        ("Kiểm thử liên thông tích hợp (Integration Testing) toàn hệ thống: ",
         "Tiến hành kiểm thử luồng nghiệp vụ khép kín từ khâu Nhập kho từ DC -> Quản lý đảo kệ FEFO -> Bán hàng POS -> Xả hàng giảm giá -> Tiêu hủy hàng hỏng -> Đối soát Sổ hao hụt và Nhật ký kiểm toán Audit Log; kiểm tra kỹ lưỡng các ràng buộc cơ sở dữ liệu trên SQL Server LocalDB, đảm bảo thời gian phản hồi API dưới 200ms và không xảy ra bất kỳ lỗi xung đột dữ liệu hay âm kho.")
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
    r_d = p23.add_run("Đồng Nai, Ngày 16 tháng 10 năm 2026")
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

    # 4. MỤC HÌNH ẢNH MINH CHỨNG BÁO CÁO TUẦN 10
    p26 = paras[26]
    p26.paragraph_format.space_before = Pt(18)
    p26.paragraph_format.space_after = Pt(6)
    p26.text = "Hình ảnh minh chứng báo cáo tuần 10 (12/10 – 18/10/2026):"
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

    # 1. Ảnh gặp trực tiếp GVHD (ảnh Zalo ngày 16/10/2026 15:05)
    img_meeting = r"Docs/Diagram_Images/meeting_gvhd_tuan_10_16_10_2026.png"
    if os.path.exists(img_meeting):
        p_cap1 = doc.add_paragraph()
        p_cap1.paragraph_format.space_before = Pt(4); p_cap1.paragraph_format.space_after = Pt(2)
        r = p_cap1.add_run("1. Hình ảnh nhóm làm việc trực tiếp với ThS. Lê Minh Nhật tại phòng thực hành (Thứ Sáu, 16/10/2026 - 15:05)")
        r.font.name = "Arial"; r.font.size = Pt(10); r.font.bold = True; r.font.italic = True

        p_img1 = doc.add_paragraph()
        p_img1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img1.paragraph_format.space_after = Pt(8)
        p_img1.add_run().add_picture(img_meeting, width=Inches(6.3))

    # 2. Ảnh Note nội dung chỉ đạo của thầy
    img_note = r"Docs/Diagram_Images/note_gvhd_tuan_10_clean.png"
    if os.path.exists(img_note):
        p_cap2 = doc.add_paragraph()
        p_cap2.paragraph_format.space_before = Pt(4); p_cap2.paragraph_format.space_after = Pt(2)
        r = p_cap2.add_run("2. Ảnh chụp ghi chép (Note) các yêu cầu & định hướng của ThS. Lê Minh Nhật giao cho nhóm trong buổi làm việc:")
        r.font.name = "Arial"; r.font.size = Pt(10); r.font.bold = True; r.font.italic = True

        p_img2 = doc.add_paragraph()
        p_img2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img2.paragraph_format.space_after = Pt(10)
        p_img2.add_run().add_picture(img_note, width=Inches(3.8))

    # =========================================================================
    # B. MINH CHỨNG SẢN PHẨM THIẾT KẾ KỸ THUẬT ĐÃ THỰC HIỆN TRONG TUẦN 10
    # =========================================================================
    p_prod_intro = doc.add_paragraph()
    p_prod_intro.paragraph_format.space_before = Pt(8)
    p_prod_intro.paragraph_format.space_after = Pt(4)
    r = p_prod_intro.add_run("B. MINH CHỨNG CÁC KẾT QUẢ KỸ THUẬT ĐÃ HOÀN THÀNH THEO NOTE CHỈ ĐẠO:")
    r.font.name = "Arial"; r.font.size = Pt(11); r.font.bold = True
    r.font.color.rgb = RGBColor(31, 73, 125)

    # 1. Bảng đối chiếu 7 yêu cầu trong Note đã hoàn thành
    p_t1 = doc.add_paragraph()
    p_t1.paragraph_format.space_before = Pt(4); p_t1.paragraph_format.space_after = Pt(2)
    r = p_t1.add_run("1. Bảng tổng hợp đối chiếu kết quả hoàn thành 7 yêu cầu chỉ đạo trong Note của GVHD:")
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

    tbl_note = doc.add_table(rows=8, cols=3)
    tbl_note.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_note.autofit = False
    set_table_borders(tbl_note, color="B0C4DE", sz="4", val="single")

    note_widths = [0.6, 2.5, 3.4]
    headers_note = ["STT", "Nội dung chỉ đạo trong Note của GVHD", "Kết quả thực hiện kỹ thuật của nhóm"]

    for i, cell in enumerate(tbl_note.rows[0].cells):
        cell.width = Inches(note_widths[i])
        set_cell_background(cell, "1F497D")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(headers_note[i])
        r.font.name = "Arial"; r.font.size = Pt(9.5); r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    note_data = [
        ("1", "Kiểm tra lại các rule trong file word", "Đã chuẩn hóa 10 Business Rules (BR-01 đến BR-10) nhất quán, triệt tiêu mọi xung đột giữa FEFO, 3 ngưỡng RSL, chống âm kho và thủ tục tiêu hủy."),
        ("2", "Bổ sung thêm người chịu trách nhiệm quản lý khi nhập kho", "Bổ sung vai trò Store Manager (Cửa hàng trưởng) là người kiểm tra niêm phong, thẩm định RSL >= 70%, ký duyệt biên bản nhập lô và chịu trách nhiệm pháp lý/giải trình bồi thường."),
        ("3", "Phân tích thêm mỗi chức năng người dùng sẽ làm cái gì và thêm luồng", "Hoàn thành phân tích chi tiết 8 ca sử dụng/chức năng trọng tâm kèm bảng đặc tả Actor, Goal, Precondition, Main Flow từng bước và Exception Flow."),
        ("4", "Xây giao diện uiux bằng khung wireframe hero section", "Thiết kế Khung Wireframe Hero Section cho Landing Page và Khung Hero Banner điều hành ca trực trên Executive Dashboard."),
        ("5", "Xây dựng khung dashboard bằng text based wireframe", "Xây dựng bản vẽ Executive Dashboard hoàn chỉnh bằng Text-Based Wireframe với 6 thẻ KPI tài chính, Two-Column Action Board và bảng cảnh báo DOS > DUE."),
        ("6", "Thêm mấy cái rule ở phía dưới", "Bố trí bảng chuẩn hóa toàn bộ 10 Business Rules ở cuối tài liệu đặc tả kèm công thức toán học và ràng buộc SQL Server để đội ngũ đối chiếu chuẩn mực."),
        ("7", "Xây dựng từng user trước rồi phân tích user đó làm được cái gì", "Xây dựng hồ sơ chi tiết 2 User Persona (Store Manager & Store Staff), ma trận phân quyền RACI và danh mục các hành vi nghiêm cấm (sửa HSD, xuất âm kho).")
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

    # 2. Minh chứng Wireframe Hero Section
    p_w1 = doc.add_paragraph()
    p_w1.paragraph_format.space_before = Pt(6); p_w1.paragraph_format.space_after = Pt(2)
    r = p_w1.add_run("2. Bản vẽ Khung Wireframe Hero Section UI/UX (Landing Page Cổng Thông Tin Giới Thiệu):")
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

    wf_box1 = doc.add_table(rows=1, cols=1)
    wf_box1.alignment = WD_TABLE_ALIGNMENT.CENTER; wf_box1.autofit = False
    set_table_borders(wf_box1, color="1F497D", sz="6", val="single")
    c1 = wf_box1.rows[0].cells[0]; c1.width = Inches(6.5)
    set_cell_background(c1, "F1F5F9"); set_cell_margins(c1, top=120, bottom=120, left=140, right=140)
    p_code1 = c1.paragraphs[0]
    hero_wf_text = (
        "+------------------------------------------------------------------------------------------------------+\n"
        "| [LOGO LHU MART]  VỀ ĐỀ TÀI    NGUYÊN TẮC FEFO    3 VÙNG MÀU    BÁO CÁO    [ ĐĂNG NHẬP HỆ THỐNG ]     |\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "|                                                                                                      |\n"
        "|      ★ ĐỒ ÁN TỐT NGHIỆP CNTT - ĐẠI HỌC LẠC HỒNG (LHU) - GVHD: THS. LÊ MINH NHẬT                      |\n"
        "|      ==================================================================================              |\n"
        "|      NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ (SUPPLY CHAIN SPOILAGE PREDICTOR)         |\n"
        "|      ==================================================================================              |\n"
        "|                                                                                                      |\n"
        "|      - Giám sát Vòng đời Hạn sử dụng (Shelf-Life) chi tiết theo từng Lô hàng nhập từ DC.             |\n"
        "|      - Bán lẻ tại quầy POS tự động khấu trừ kho theo nguyên tắc FEFO (First Expired, First Out).     |\n"
        "|      - Kích hoạt xả hàng Quick Markdown & Đảo kệ mặt tiền khi lô chạm Vùng Vàng / Vùng Đỏ.           |\n"
        "|      - Dự báo Điểm đặt hàng ROP tích hợp thời tiết & ngày lễ gửi về Kho tổng DC.                     |\n"
        "|                                                                                                      |\n"
        "|      +--------------------------------+       +------------------------------------+                 |\n"
        "|      |  [▶ VÀO QUẦY BÁN LẺ POS]       |       |  [📊 VÀO EXECUTIVE DASHBOARD]      |                 |\n"
        "|      +--------------------------------+       +------------------------------------+                 |\n"
        "|                                                                                                      |\n"
        "|      MÔ PHỎNG 3 VÙNG MÀU HẠN DÙNG TRỰC QUAN:                                                         |\n"
        "|      [ 🟢 VÙNG XANH (RSL>20%) ] ──> [ 🟡 VÙNG VÀNG (10-20%) ] ──> [ 🔴 VÙNG ĐỎ (<=10%) ] ──> [ 🟣 KHÓA]|\n"
        "|             Bán bình thường             Đảo kệ & Giảm nhẹ            Xả hàng sâu 50%          Quá hạn cấm bán|\n"
        "+------------------------------------------------------------------------------------------------------+"
    )
    r = p_code1.add_run(hero_wf_text)
    r.font.name = "Consolas"; r.font.size = Pt(7.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 3. Minh chứng Text-Based Executive Dashboard Wireframe
    p_w2 = doc.add_paragraph()
    p_w2.paragraph_format.space_before = Pt(6); p_w2.paragraph_format.space_after = Pt(2)
    r = p_w2.add_run("3. Bản vẽ Khung Executive Dashboard hoàn chỉnh bằng Text-Based Wireframe:")
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

    wf_box2 = doc.add_table(rows=1, cols=1)
    wf_box2.alignment = WD_TABLE_ALIGNMENT.CENTER; wf_box2.autofit = False
    set_table_borders(wf_box2, color="1F497D", sz="6", val="single")
    c2 = wf_box2.rows[0].cells[0]; c2.width = Inches(6.5)
    set_cell_background(c2, "F1F5F9"); set_cell_margins(c2, top=120, bottom=120, left=140, right=140)
    p_code2 = c2.paragraphs[0]
    dash_wf_text = (
        "+------------------------------------------------------------------------------------------------------+\n"
        "| [LOGO] LHU MART - EXECUTIVE DASHBOARD ĐIỀU HÀNH                         [User: Quản lý Quân] [Đăng xuất]|\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| THANH ĐIỀU HƯỚNG: [x] Dashboard  [ ] Bán lẻ POS  [ ] Quản lý Lô  [ ] Nhập DC  [ ] Sổ Hao Hụt  [ ] Dự báo|\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| 6 THẺ KPI TÀI CHÍNH & VẬN HÀNH THỜI GIAN THỰC (SUMMARY CARDS):                                       |\n"
        "| +--------------------+ +--------------------+ +--------------------+ +--------------------+          |\n"
        "| | TỔNG VỐN TỒN KHO   | | VỐN RỦI RO CẬN DATE| | TỶ LỆ LÃNG PHÍ SPOIL| | DOANH SỐ HÔM NAY   |          |\n"
        "| | 128,500,000 đ      | | 8,400,000 đ (6.5%) | | 1.2% (MỤC TIÊU<1.5%)| | 15,200,000 đ      |          |\n"
        "| | [▲ +2.1% tuần qua] | | [▼ -1.4% giảm tốt] | | [🟢 ĐẠT CHUẨN XANH] | | [42 Hóa đơn POS]   |          |\n"
        "| +--------------------+ +--------------------+ +--------------------+ +--------------------+          |\n"
        "| +-----------------------------------------+ +-----------------------------------------------------+  |\n"
        "| | SỐ LÔ CẦN XỬ LÝ KHẨN CẤP TRONG CA       | | ĐƠN HÀNG ĐỀ XUẤT ĐẶT KHO TỔNG DC (ROP)              |  |\n"
        "| | 4 Lô hàng (2 Đỏ, 2 Vàng)                | | 2 Đơn hàng bổ sung (Sữa tiệt trùng, Bánh mì tươi)   |  |\n"
        "| +-----------------------------------------+ +-----------------------------------------------------+  |\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| [CỘT TRÁI] BIỂU ĐỒ TRỰC QUAN TEXT-BASED        | [CỘT PHẢI] ACTION BOARD KHẨN CẤP TRONG CA           |\n"
        "| 1. Phân bổ Hạn dùng 3 Vùng Màu:                | 1. [LÔ ĐỎ] LOT-MILK-001 (Sữa tươi Ba Vì 110ml)      |\n"
        "|    🟢 Xanh (RSL>20%):  [████████████] 85%      |    - HSD: Còn 2 ngày (RSL: 8.5%) | Tồn: 15 Hộp      |\n"
        "|    🟡 Vàng (10-20%):   [██] 11%                |    - Hành động: [Duyệt giảm 50%] [Đã đảo mặt tiền]   |\n"
        "|    🔴 Đỏ (<=10%):      [█] 4%                  | 2. [LÔ ĐỎ] LOT-BREAD-04 (Bánh Sandwich tươi)        |\n"
        "|    🟣 Quá hạn:         [0%] (Đã khóa cứng POS) |    - HSD: Còn 1 ngày (RSL: 7.0%) | Tồn: 8 Gói       |\n"
        "| 2. Doanh số Bán lẻ vs Hao hụt Hủy hàng:        |    - Hành động: [Duyệt giảm 50%] [Chưa đảo kệ]      |\n"
        "|    Doanh số: [$$$$$$$$$$$$$$$$$$$$] 15.2 Tr    | 3. [LÔ VÀNG] LOT-YOGURT-02 (Sữa chua Vinamilk)      |\n"
        "|    Hao hụt:  [*] 0.18 Tr (Spoilage: 1.18%)     |    - HSD: Còn 4 ngày (RSL: 15%) | Tồn: 30 Hũ        |\n"
        "+------------------------------------------------------------------------------------------------------+"
    )
    r = p_code2.add_run(dash_wf_text)
    r.font.name = "Consolas"; r.font.size = Pt(7.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 4. Bảng phân quyền Persona
    p_t3 = doc.add_paragraph()
    p_t3.paragraph_format.space_before = Pt(6); p_t3.paragraph_format.space_after = Pt(2)
    r = p_t3.add_run("4. Bảng phân tích User Persona & Ma trận Phân quyền RACI theo chỉ đạo:")
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

    tbl_persona = doc.add_table(rows=3, cols=4)
    tbl_persona.alignment = WD_TABLE_ALIGNMENT.CENTER; tbl_persona.autofit = False
    set_table_borders(tbl_persona, color="B0C4DE", sz="4", val="single")

    per_widths = [1.2, 1.8, 1.8, 1.7]
    per_headers = ["Nhóm Persona", "Mục tiêu cốt lõi", "Quyền hạn được phép làm", "Hành vi bị nghiêm cấm"]

    for i, cell in enumerate(tbl_persona.rows[0].cells):
        cell.width = Inches(per_widths[i])
        set_cell_background(cell, "1F497D")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(per_headers[i])
        r.font.name = "Arial"; r.font.size = Pt(9.5); r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    per_data = [
        ("Store Manager\n(Cửa hàng trưởng)", 
         "Quản trị tỷ lệ lãng phí < 1.5%, tối ưu dòng vốn tồn kho và đảm bảo an toàn thực phẩm.", 
         "- Duyệt biên bản nhập hàng từ DC.\n- Duyệt giảm giá Quick Markdown.\n- Duyệt phiếu tiêu hủy hàng hỏng.\n- Xem Dashboard KPI & Audit Log.", 
         "❌ Không được tự ý điều chỉnh lùi hạn sử dụng của lô hàng trên hệ thống."),
        ("Store Staff\n(Nhân viên quầy/kho)", 
         "Thực hiện bán hàng POS nhanh chóng, chính xác theo FEFO và giữ quầy kệ ngăn nắp.", 
         "- Quét mã vạch bán hàng POS.\n- Tiếp nhận gợi ý đảo kệ FEFO.\n- Lập đề xuất tiêu hủy hàng hỏng.\n- Kiểm kê số lượng thực tế.", 
         "❌ Tuyệt đối không được bán hàng quá hạn (RSL <= 0) hoặc xuất âm kho.")
    ]

    for row_idx, data_row in enumerate(per_data):
        row_cells = tbl_persona.rows[row_idx + 1].cells
        bg_col = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text_val in enumerate(data_row):
            row_cells[col_idx].width = Inches(per_widths[col_idx])
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

    # 5. Bảng 10 Business Rules
    p_t4 = doc.add_paragraph()
    p_t4.paragraph_format.space_before = Pt(6); p_t4.paragraph_format.space_after = Pt(2)
    r = p_t4.add_run("5. Bảng chuẩn hóa 10 Business Rules (BR-01 đến BR-10) bố trí ở cuối tài liệu đặc tả:")
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

    tbl_br = doc.add_table(rows=11, cols=3)
    tbl_br.alignment = WD_TABLE_ALIGNMENT.CENTER; tbl_br.autofit = False
    set_table_borders(tbl_br, color="B0C4DE", sz="4", val="single")

    br_widths = [0.8, 1.8, 3.9]
    br_headers = ["Mã Rule", "Tên Quy tắc Nghiệp vụ", "Mô tả chuẩn mực & Ràng buộc Kỹ thuật"]

    for i, cell in enumerate(tbl_br.rows[0].cells):
        cell.width = Inches(br_widths[i])
        set_cell_background(cell, "1F497D")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(br_headers[i])
        r.font.name = "Arial"; r.font.size = Pt(9.5); r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    br_data = [
        ("BR-01", "Quản trị Vòng đời theo Lô", "Bắt buộc mọi SKU hàng hóa khi nhập kho phải gắn với mã lô (batch_code), ngày sản xuất và ngày hết hạn cụ thể."),
        ("BR-02", "Tiếp nhận Lô hàng từ DC", "Chỉ tiếp nhận hàng từ DC khi tỷ lệ hạn dùng còn lại RSL >= 70%. Cửa hàng trưởng là người ký duyệt biên bản giao nhận."),
        ("BR-03", "3 Ngưỡng Cảnh báo RSL", "Phân loại 4 trạng thái: Vùng Xanh (RSL > 20%), Vùng Vàng (10% < RSL <= 20%), Vùng Đỏ (0 < RSL <= 10%) và Vùng Tím (RSL <= 0 ngày - Hết hạn)."),
        ("BR-04", "Bán hàng Xuất kho FEFO", "Khi thanh toán tại POS, hệ thống tự động trừ kho ở lô có expiry_date gần nhất; tự động bẻ nhiều lô nếu giỏ hàng lớn hơn tồn 1 lô."),
        ("BR-05", "Khóa cứng Hàng quá hạn", "Hàng hóa khi chạm Vùng Tím (RSL <= 0 ngày) bị hệ thống khóa tự động trên giao diện POS, tuyệt đối cấm bán cho khách hàng."),
        ("BR-06", "Kích hoạt Xả hàng Markdown", "Khi lô hàng rơi vào Vùng Vàng/Đỏ hoặc có nguy cơ lãng phí (DOS > DUE), Cửa hàng trưởng được quyền duyệt giảm giá 15% - 50%."),
        ("BR-07", "Xác nhận Đảo kệ Mặt tiền", "Hệ thống thông báo cho nhân viên kho chuyển các lô cận date ra phía trước kệ trưng bày và ghi nhận cờ shelf_rotated = 1."),
        ("BR-08", "Quy trình Phê duyệt Tiêu hủy", "Hàng quá hạn hoặc hư hỏng phải được nhân viên lập đề xuất và Cửa hàng trưởng bấm duyệt; tự động hạch toán vào Sổ hao hụt theo giá vốn."),
        ("BR-09", "Dự báo Đặt hàng ROP", "Tính toán điểm đặt hàng bổ sung ROP = (d * L) + SS tích hợp hệ số thời tiết (K_weather) và ngày lễ (K_holiday) gửi về Kho tổng DC."),
        ("BR-10", "Tuyệt đối Chống Âm kho", "Mọi giao dịch bán hàng POS, điều chỉnh hoặc tiêu hủy đều được bọc trong SQL Transaction, nếu số lượng khả dụng < số lượng xuất sẽ Rollback ngay lập tức.")
    ]

    for row_idx, data_row in enumerate(br_data):
        row_cells = tbl_br.rows[row_idx + 1].cells
        bg_col = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text_val in enumerate(data_row):
            row_cells[col_idx].width = Inches(br_widths[col_idx])
            set_cell_background(row_cells[col_idx], bg_col)
            set_cell_margins(row_cells[col_idx], top=70, bottom=70, left=90, right=90)
            p = row_cells[col_idx].paragraphs[0]
            if col_idx in [0, 1]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(text_val)
            r.font.name = "Arial"; r.font.size = Pt(8.5)
            if col_idx == 0:
                r.font.bold = True

    doc.save(output_docx)
    print(f"[SUCCESS] Đã tạo thành công file Word: {output_docx}")
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
    f1 = r"Docs/123000946_DoanMinhQuan_Tuan10_LeMinhNhat.docx"
    build_report_tuan_10(template, "123000946", "Đoàn Minh Quân", f1, is_group=False)
    convert_docx_to_pdf(f1)

    # 2. Bản của sinh viên Đỗ Tấn Du (MSSV: 123001364)
    f2 = r"Docs/123001364_DoTanDu_Tuan10_LeMinhNhat.docx"
    build_report_tuan_10(template, "123001364", "Đỗ Tấn Du", f2, is_group=False)
    convert_docx_to_pdf(f2)

    # 3. Bản nộp chung của cả 2 thành viên trong nhóm
    f3 = r"Docs/123001364_DoTanDu_DoanMinhQuan_Tuan10_LeMinhNhat.docx"
    build_report_tuan_10(template, "123001364, 123000946", "Đỗ Tấn Du, Đoàn Minh Quân", f3, is_group=True)
    convert_docx_to_pdf(f3)

    print("\n[ALL DONE] Hoàn tất tạo đầy đủ 3 bản báo cáo Word & PDF Tuần 10!")
