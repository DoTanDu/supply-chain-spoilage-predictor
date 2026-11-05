# -*- coding: utf-8 -*-
"""
Script tạo Báo cáo Tiến độ Tuần 06 gặp GVHD ThS. Lê Minh Nhật
Chuẩn theo mẫu chính thức của Khoa CNTT - Đại học Lạc Hồng (LHU).
Bao gồm:
- Thông tin chung, thời gian tuần 6 (28/09/2026 – 04/10/2026 | Ngày gặp GVHD: Thứ Sáu, 02/10/2026).
- Nội dung đã làm trong tuần (Khởi tạo Clean Architecture, Kết nối SQL Server LocalDB, API Tiếp nhận DC, Frontend Shell Layout, Màn hình FEFO Monitor).
- Nội dung tuần tiếp theo (Bán lẻ POS trừ kho FEFO, Quick Markdown xả hàng, Tiêu hủy hàng hỏng Spoilage, Kiểm thử tích hợp).
- Bảng chữ ký 3 bên (GVHD ThS. Lê Minh Nhật, Đoàn Minh Quân, Đỗ Tấn Du).
- Hình ảnh xác nhận làm việc với GVHD: chèn ảnh chụp nhóm thực tế (media_1793293497984_317f9998.jpg).
- Minh chứng kỹ thuật: Sơ đồ Clean Architecture, Bảng 12 bảng CSDL, Quy chuẩn 3 màu FEFO Monitor, Quy trình nhập DC.
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

def build_report_tuan_6(template_path, mssv_primary, name_primary, output_docx, is_group=False):
    doc = Document(template_path)

    # 1. Tiêu đề Tuần 06
    p2 = doc.paragraphs[2]
    p2.text = ""
    r1 = p2.add_run("BÁO CÁO TIẾN ĐỘ TUẦN ")
    r1.font.name = "Arial"; r1.font.size = Pt(16); r1.font.bold = True
    r2 = p2.add_run("06")
    r2.font.name = "Arial"; r2.font.size = Pt(16); r2.font.bold = True
    r2.font.color.rgb = RGBColor(255, 0, 0)

    # P3: Thời gian
    p3 = doc.paragraphs[3]
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3.text = ""
    r3 = p3.add_run("(Thời gian: 28/09/2026 – 04/10/2026 | Ngày gặp GVHD: Thứ Sáu, 02/10/2026)")
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
    # Nội dung đã thực hiện trong tuần 6
    tasks_done = [
        ("Khởi tạo Khung Kiến trúc Clean Architecture cho Backend Node.js/Express: ",
         "Thiết lập cấu trúc phân tầng nghiêm ngặt: Presentation Layer (Controllers, Middlewares), Business Logic Layer (Services xử lý FEFO, RSL %, ROP), Data Access Layer (Repositories kết nối SQL Server). Chuẩn hóa định dạng phản hồi API JSON Response thống nhất { success, data, message, timestamp } và bộ xử lý lỗi tập trung errorHandler bằng tiếng Việt."),
        
        ("Hiện thực hóa Tầng Data Access (Repository Pattern) & Kết nối SQL Server LocalDB: ",
         "Xây dựng module Backend/db.js kết nối Microsoft SQL Server LocalDB (localdb)\\mssqllocaldb database retail_spoilage_db qua thư viện mssql, hỗ trợ Connection Pool và Transaction an toàn. Hoàn thành ProductRepository và BatchRepository tích hợp View v_spoilage_alerts để tự động tính toán số ngày còn lại (DaysLeft) và tỷ lệ % hạn dùng còn lại (RSL %)."),
        
        ("Phát triển Module Tiếp nhận Lô hàng từ Kho tổng DC (/api/batches/inbound): ",
         "Lập trình Service tiếp nhận lô hàng vận chuyển từ DC: Thẩm định điều kiện nhập kho đạt chuẩn RSL >= 70%; tự động tính ngày hết hạn dựa trên thời hạn bảo quản của nhóm sản phẩm FMCG; sinh mã lô (batch_code) chuẩn hóa, lưu trữ giá vốn nhập (cost_price) và mã vạch sản phẩm."),
        
        ("Khởi tạo Ứng dụng Frontend React (Vite) + TailwindCSS & Khung Giao diện Quản trị: ",
         "Khởi tạo Single Page Application với React 18, Vite và TailwindCSS. Xây dựng Layout tổng thể hoàn chỉnh: Sidebar điều hướng trực quan, Header hiển thị thông tin ca trực cửa hàng và Trung tâm cảnh báo tương tác (Notification Center) chuông thông báo lô cận date; hỗ trợ Dark/Light mode và thiết kế Responsive."),
        
        ("Xây dựng Màn hình Giám sát Hạn sử dụng theo lô (FEFO Monitor Screen): ",
         "Thiết kế bảng quản lý lô hàng trực quan với thẻ phân loại 3 màu cảnh báo: Vùng Xanh (RSL > 20% - An toàn), Vùng Vàng (10% < RSL <= 20% - Cận date, đề xuất đảo kệ), Vùng Đỏ (RSL <= 10% - Nguy cấp, đề xuất xả hàng giảm giá) và Vùng Tím (RSL <= 0 ngày - Quá hạn khóa bán). Hỗ trợ tìm kiếm tiếng Việt không dấu và lọc theo ngành hàng."),
        
        ("Quản lý mã nguồn trên Git/GitHub & Phân chia trách nhiệm phát triển: ",
         "Chuẩn hóa cấu trúc thư mục modular dự án (Backend, Frontend, Database, Docs, Sample_Data), cấu hình .gitignore loại bỏ node_modules và file tạm. Phân công rõ ràng: Đỗ Tấn Du phụ trách UI/UX Frontend & Dashboard/FEFO Monitor; Đoàn Minh Quân phụ trách CSDL SQL Server & Backend Services/APIs.")
    ]

    # Nội dung sẽ thực hiện tiếp trong tuần 7
    tasks_next = [
        ("Xây dựng Màn hình Bán lẻ POS (Point of Sale) & Thuật toán Khấu trừ kho FEFO Tự động: ",
         "Thiết kế giao diện Quầy thu ngân POS: Quét mã vạch sản phẩm, giỏ hàng cảm ứng, tính toán tổng tiền thanh toán và in hóa đơn chi tiết thông tin lô hàng. Lập trình Service tự động bẻ tách lô theo nguyên tắc FEFO (ưu tiên xuất lô có hạn dùng gần nhất trước); khóa cứng không cho thanh toán sản phẩm quá hạn và chống tuyệt đối lỗi âm kho bằng SQL Transaction."),
        
        ("Xây dựng Tính năng Xả hàng Giảm giá Nhanh (Quick Markdown): ",
         "Cho phép Cửa hàng trưởng áp dụng mức chiết khấu 15% - 50% cho các lô hàng thuộc Vùng Vàng/Đỏ hoặc có nguy cơ lãng phí (DOS > DUE), lập tức đồng bộ giá bán khuyến mãi ra quầy POS nhằm giải phóng hàng trước khi hỏng."),
        
        ("Phát triển Module Đề xuất & Phê duyệt Tiêu hủy Hàng hỏng (Spoilage Disposal): ",
         "Cho phép nhân viên quét mã lô lập đề xuất tiêu hủy hàng quá hạn hoặc dập nát, Cửa hàng trưởng xét duyệt và tự động hạch toán vào Sổ hao hụt tài chính theo giá vốn (Cost Price)."),
        
        ("Kiểm thử Tích hợp Liên thông Toàn diện (Integration Testing): ",
         "Chạy kịch bản kiểm thử toàn trình từ Nhập lô DC -> Bán lẻ POS -> Cảnh báo cận date -> Tiêu hủy -> Báo cáo hao hụt, đảm bảo hệ thống vận hành trơn tru và không xảy ra lỗi xung đột dữ liệu hay âm kho.")
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
    r_d = p23.add_run("Đồng Nai, Ngày 02 tháng 10 năm 2026")
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

    # 4. MỤC HÌNH ẢNH MINH CHỨNG BÁO CÁO TUẦN 06
    p26 = paras[26]
    p26.paragraph_format.space_before = Pt(18)
    p26.paragraph_format.space_after = Pt(6)
    p26.text = "Hình ảnh minh chứng báo cáo tuần 06 (28/09 – 04/10/2026):"
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

    # Ảnh gặp trực tiếp GVHD Tuần 6
    img_meeting = r"Docs/Diagram_Images/meeting_gvhd_tuan_06.png"
    if os.path.exists(img_meeting):
        p_cap1 = doc.add_paragraph()
        p_cap1.paragraph_format.space_before = Pt(4); p_cap1.paragraph_format.space_after = Pt(2)
        r = p_cap1.add_run("1. Hình ảnh nhóm làm việc trực tiếp với ThS. Lê Minh Nhật tại phòng thực hành (Thứ Sáu, 02/10/2026):")
        r.font.name = "Arial"; r.font.size = Pt(10); r.font.bold = True; r.font.italic = True

        p_img1 = doc.add_paragraph()
        p_img1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img1.paragraph_format.space_after = Pt(10)
        p_img1.add_run().add_picture(img_meeting, width=Inches(5.8))

    # =========================================================================
    # B. MINH CHỨNG SẢN PHẨM THIẾT KẾ KỸ THUẬT ĐÃ THỰC HIỆN TRONG TUẦN 06
    # =========================================================================
    p_prod_intro = doc.add_paragraph()
    p_prod_intro.paragraph_format.space_before = Pt(8)
    p_prod_intro.paragraph_format.space_after = Pt(4)
    r = p_prod_intro.add_run("B. MINH CHỨNG CÁC KẾT QUẢ KỸ THUẬT ĐÃ HOÀN THÀNH TRONG TUẦN 06:")
    r.font.name = "Arial"; r.font.size = Pt(11); r.font.bold = True
    r.font.color.rgb = RGBColor(31, 73, 125)

    # 1. Bảng cấu trúc phân tầng Clean Architecture Backend
    p_t1 = doc.add_paragraph()
    p_t1.paragraph_format.space_before = Pt(4); p_t1.paragraph_format.space_after = Pt(2)
    r = p_t1.add_run("1. Cấu trúc phân tầng Clean Architecture Backend & Danh mục Tầng xử lý:")
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

    tbl_arch = doc.add_table(rows=5, cols=3)
    tbl_arch.alignment = WD_TABLE_ALIGNMENT.CENTER; tbl_arch.autofit = False
    set_table_borders(tbl_arch, color="B0C4DE", sz="4", val="single")

    arch_widths = [1.5, 2.2, 2.8]
    arch_headers = ["Phân tầng (Layer)", "Các thành phần kỹ thuật", "Nhiệm vụ & Trách nhiệm chính"]

    for i, cell in enumerate(tbl_arch.rows[0].cells):
        cell.width = Inches(arch_widths[i])
        set_cell_background(cell, "1F497D")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(arch_headers[i])
        r.font.name = "Arial"; r.font.size = Pt(9.5); r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    arch_data = [
        ("Presentation Layer\n(Tầng Giao tiếp)", 
         "AuthController, BatchController, ProductController, SalesController, errorHandler", 
         "Tiếp nhận HTTP Request, xác thực JWT Token, validate dữ liệu đầu vào và trả về JSON Response chuẩn hóa."),
        
        ("Business Logic Layer\n(Tầng Nghiệp vụ)", 
         "FefoSaleService, InboundService, MarkdownService, RopForecastService", 
         "Thực thi quy tắc FEFO, kiểm tra điều kiện RSL >= 70% khi nhập DC, tính toán điểm đặt hàng ROP tích hợp thời tiết."),
        
        ("Data Access Layer\n(Tầng Truy xuất)", 
         "ProductRepository, BatchRepository, SalesRepository, SpoilageRepository", 
         "Giao tiếp trực tiếp CSDL qua Stored Procedures, Views và câu lệnh T-SQL tham số hóa, bọc trong Transaction."),
        
        ("Database Layer\n(Tầng Cơ sở dữ liệu)", 
         "SQL Server LocalDB retail_spoilage_db (12 bảng 3NF, 4 Views, Triggers)", 
         "Lưu trữ dữ liệu toàn vẹn, tính toán DaysLeft tự động, đảm bảo ràng buộc kho không âm và ghi log kiểm toán.")
    ]

    for row_idx, data_row in enumerate(arch_data):
        row_cells = tbl_arch.rows[row_idx + 1].cells
        bg_col = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text_val in enumerate(data_row):
            row_cells[col_idx].width = Inches(arch_widths[col_idx])
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

    # 2. Bảng 4 trạng thái hạn sử dụng trên Màn hình FEFO Monitor
    p_t2 = doc.add_paragraph()
    p_t2.paragraph_format.space_before = Pt(6); p_t2.paragraph_format.space_after = Pt(2)
    r = p_t2.add_run("2. Chuẩn hóa 4 Trạng thái Hạn sử dụng trên Màn hình Giám sát Lô hàng (FEFO Monitor):")
    r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

    tbl_fefo = doc.add_table(rows=5, cols=4)
    tbl_fefo.alignment = WD_TABLE_ALIGNMENT.CENTER; tbl_fefo.autofit = False
    set_table_borders(tbl_fefo, color="B0C4DE", sz="4", val="single")

    fefo_widths = [1.2, 1.4, 2.0, 1.9]
    fefo_headers = ["Vùng Cảnh báo", "Điều kiện RSL %", "Hành động hệ thống đề xuất", "Quy tắc vận hành tại quầy"]

    for i, cell in enumerate(tbl_fefo.rows[0].cells):
        cell.width = Inches(fefo_widths[i])
        set_cell_background(cell, "1F497D")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(fefo_headers[i])
        r.font.name = "Arial"; r.font.size = Pt(9.5); r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    fefo_data = [
        ("🟢 VÙNG XANH\n(An toàn)", "RSL > 20%", "Lô hàng ổn định, ưu tiên bán theo trật tự expiry_date bình thường.", "Bán đúng giá niêm yết, xếp kệ theo tiêu chuẩn."),
        ("🟡 VÙNG VÀNG\n(Cận date)", "10% < RSL <= 20%", "Bắn thông báo ca trực: Yêu cầu nhân viên đảo lô này ra mặt tiền kệ trưng bày.", "Đảo kệ mặt tiền, sẵn sàng kích hoạt giảm giá nhẹ 15%."),
        ("🔴 VÙNG ĐỎ\n(Nguy cấp)", "0% < RSL <= 10%", "Cảnh báo khẩn cấp: Đề xuất Cửa hàng trưởng duyệt Quick Markdown 30%-50%.", "Dán tem xả hàng cận date, đẩy mạnh bán qua POS."),
        ("🟣 VÙNG TÍM\n(Quá hạn)", "RSL <= 0 ngày", "Hệ thống tự động KHÓA CỨNG trên quầy POS, tuyệt đối cấm quét mã thanh toán.", "Lập phiếu đề xuất tiêu hủy, chuyển sang trạng thái DISPOSED.")
    ]

    for row_idx, data_row in enumerate(fefo_data):
        row_cells = tbl_fefo.rows[row_idx + 1].cells
        bg_col = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text_val in enumerate(data_row):
            row_cells[col_idx].width = Inches(fefo_widths[col_idx])
            set_cell_background(row_cells[col_idx], bg_col)
            set_cell_margins(row_cells[col_idx], top=80, bottom=80, left=100, right=100)
            p = row_cells[col_idx].paragraphs[0]
            if col_idx in [0, 1]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(text_val)
            r.font.name = "Arial"; r.font.size = Pt(8.5)
            if col_idx == 0:
                r.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 3. Minh chứng Sơ đồ DFD Mức 1 (nếu có file ảnh)
    img_dfd1 = r"Docs/Diagram_Images/dfd_1.png"
    if os.path.exists(img_dfd1):
        p_t3 = doc.add_paragraph()
        p_t3.paragraph_format.space_before = Pt(6); p_t3.paragraph_format.space_after = Pt(2)
        r = p_t3.add_run("3. Sơ đồ Luồng Dữ liệu DFD Mức 1 (5 Tiến trình Bán lẻ & Quản trị Lô hàng cốt lõi):")
        r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

        p_img_dfd = doc.add_paragraph()
        p_img_dfd.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img_dfd.paragraph_format.space_after = Pt(10)
        p_img_dfd.add_run().add_picture(img_dfd1, width=Inches(6.2))

    doc.save(output_docx)
    print(f"[SUCCESS] Đã tạo thành công file Word Tuần 6: {output_docx}")
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
    f1 = r"Docs/123000946_DoanMinhQuan_Tuan06_LeMinhNhat.docx"
    build_report_tuan_6(template, "123000946", "Đoàn Minh Quân", f1, is_group=False)
    convert_docx_to_pdf(f1)

    # 2. Bản của sinh viên Đỗ Tấn Du (MSSV: 123001364)
    f2 = r"Docs/123001364_DoTanDu_Tuan06_LeMinhNhat.docx"
    build_report_tuan_6(template, "123001364", "Đỗ Tấn Du", f2, is_group=False)
    convert_docx_to_pdf(f2)

    # 3. Bản nộp chung của cả 2 thành viên trong nhóm
    f3 = r"Docs/123001364_DoTanDu_DoanMinhQuan_Tuan06_LeMinhNhat.docx"
    build_report_tuan_6(template, "123001364, 123000946", "Đỗ Tấn Du, Đoàn Minh Quân", f3, is_group=True)
    convert_docx_to_pdf(f3)

    print("\n[ALL DONE] Hoàn tất tạo đầy đủ 3 bản báo cáo Word & PDF Tuần 06!")

