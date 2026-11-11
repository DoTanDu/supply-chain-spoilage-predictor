# -*- coding: utf-8 -*-
"""
Script xây dựng BÁO CÁO TỔNG HỢP TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN HÀNG TUẦN (TUẦN 03 - TUẦN 11)
Đơn vị: Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU)
GVHD: ThS. Lê Minh Nhật
Nhóm SV: Đỗ Tấn Du (MSSV: 123001364) & Đoàn Minh Quân (MSSV: 123000946)
Đề tài: Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor)
"""

import os
import sys
import subprocess
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# --- Helper Functions for Formatting ---

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

def add_styled_heading(doc, text, level=1):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(6)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = "Arial"
    run.bold = True
    if level == 1:
        run.font.size = Pt(14)
        run.font.color.rgb = RGBColor(31, 73, 125) # Deep Blue
        # Add bottom border/accent effect via XML or style
    elif level == 2:
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(192, 0, 0) # Dark Red
    else:
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(50, 50, 50)
    return h

def add_bullet_item(doc, title, desc):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    
    r_bullet = p.add_run("• ")
    r_bullet.font.name = "Arial"
    r_bullet.font.size = Pt(10.5)
    r_bullet.font.bold = True
    r_bullet.font.color.rgb = RGBColor(31, 73, 125)

    r_title = p.add_run(title)
    r_title.font.name = "Arial"
    r_title.font.size = Pt(10.5)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(30, 30, 30)

    r_desc = p.add_run(desc)
    r_desc.font.name = "Arial"
    r_desc.font.size = Pt(10.5)
    r_desc.font.color.rgb = RGBColor(60, 60, 60)
    return p

def add_caption(doc, caption_text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(10)
    r = p.add_run(caption_text)
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.italic = True
    r.font.color.rgb = RGBColor(80, 80, 80)
    return p

def convert_docx_to_pdf(docx_path):
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

# --- Main Master Builder ---

def build_master_weekly_report(output_docx_path):
    doc = Document()
    
    # 0. Page setup
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.8)

    # 1. Header: Trường & Khoa
    p_school = doc.add_paragraph()
    p_school.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_school.paragraph_format.space_before = Pt(0)
    p_school.paragraph_format.space_after = Pt(2)
    r_sch = p_school.add_run("TRƯỜNG ĐẠI HỌC LẠC HỒNG\n")
    r_sch.font.name = "Arial"
    r_sch.font.size = Pt(13)
    r_sch.font.bold = True
    r_fac = p_school.add_run("KHOA CÔNG NGHỆ THÔNG TIN")
    r_fac.font.name = "Arial"
    r_fac.font.size = Pt(12)
    r_fac.font.bold = True
    r_fac.font.color.rgb = RGBColor(31, 73, 125)

    p_div = doc.add_paragraph()
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_div.paragraph_format.space_before = Pt(0)
    p_div.paragraph_format.space_after = Pt(10)
    r_div = p_div.add_run("------------------***------------------")
    r_div.font.name = "Arial"
    r_div.font.size = Pt(10)
    r_div.font.color.rgb = RGBColor(128, 128, 128)

    # 2. Main Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(6)
    p_title.paragraph_format.space_after = Pt(4)
    r_t1 = p_title.add_run("BÁO CÁO TỔNG HỢP TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN HÀNG TUẦN\n")
    r_t1.font.name = "Arial"
    r_t1.font.size = Pt(16)
    r_t1.font.bold = True
    r_t1.font.color.rgb = RGBColor(31, 73, 125)
    r_t2 = p_title.add_run("GIAI ĐOẠN: TUẦN 03 ĐẾN TUẦN 11 (HỌC KỲ I - NĂM HỌC 2026-2027)")
    r_t2.font.name = "Arial"
    r_t2.font.size = Pt(12)
    r_t2.font.bold = True
    r_t2.font.color.rgb = RGBColor(192, 0, 0)

    # 3. Administrative Information Table
    tbl_info = doc.add_table(rows=5, cols=2)
    tbl_info.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_info, color="1F497D", sz="6", val="single")

    info_data = [
        ("Giảng viên hướng dẫn:", "ThS. Lê Minh Nhật"),
        ("Nhóm sinh viên thực hiện:", "1. Đỗ Tấn Du - MSSV: 123001364\n2. Đoàn Minh Quân - MSSV: 123000946"),
        ("Lớp / Đơn vị quản lý:", "Học phần Phát triển ứng dụng chuyên nghiệp - Khoa Công nghệ Thông tin"),
        ("Tên đề tài:", "Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor)"),
        ("Mô hình & Phạm vi nghiệp vụ:", "Cửa hàng Bán lẻ tinh gọn LHU Mart (RETAIL-STORE-01) liên kết Trung tâm Phân phối Kho tổng DC Biên Hòa")
    ]

    for idx, (label, val) in enumerate(info_data):
        row = tbl_info.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.5)
        set_cell_background(c0, "F2F5F9")
        set_cell_margins(c0, top=100, bottom=100, left=140, right=140)
        set_cell_margins(c1, top=100, bottom=100, left=140, right=140)

        p0 = c0.paragraphs[0]
        p0.text = ""
        r0 = p0.add_run(label)
        r0.font.name = "Arial"; r0.font.size = Pt(10.5); r0.font.bold = True
        r0.font.color.rgb = RGBColor(31, 73, 125)

        p1 = c1.paragraphs[0]
        p1.text = ""
        r1 = p1.add_run(val)
        r1.font.name = "Arial"; r1.font.size = Pt(10.5)
        if idx in [0, 3]:
            r1.font.bold = True

    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_before = Pt(8)
    p_space.paragraph_format.space_after = Pt(4)

    # 4. Summary Matrix Table
    add_styled_heading(doc, "BẢNG MA TRẬN TỔNG HỢP TIẾN ĐỘ & KẾT QUẢ GẶP GVHD (TUẦN 03 – TUẦN 11)", level=1)
    
    tbl_matrix = doc.add_table(rows=6, cols=5)
    tbl_matrix.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_matrix, color="1F497D", sz="6", val="single")

    matrix_headers = ["Tuần & Giai đoạn", "Ngày gặp GVHD", "Trọng tâm kỹ thuật thực hiện", "Minh chứng kỹ thuật bàn giao", "Kết quả"]
    for col_idx, h_text in enumerate(matrix_headers):
        c = tbl_matrix.rows[0].cells[col_idx]
        set_cell_background(c, "1F497D")
        set_cell_margins(c, top=120, bottom=120, left=100, right=100)
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h_text)
        r.font.name = "Arial"; r.font.size = Pt(10); r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    matrix_rows = [
        ("Tuần 03\n(07/09 - 13/09/2026)", "09/09/2026", "Khảo sát yêu cầu, định hình mô hình bán lẻ tinh gọn 1 shop + 1 DC, chuẩn hóa 3 ngưỡng hạn sử dụng (FEFO/RSL).", "Sơ đồ Use Case tổng thể, DFD Mức 0, DFD Mức 1.", "100% Đạt"),
        ("Tuần 06\n(28/09 - 04/10/2026)", "Thứ 6, 02/10/2026", "Thiết lập khung Clean Architecture 4 tầng cho Backend, thiết kế 13 bảng CSDL SQL Server 3NF, Repository Pattern.", "Sơ đồ Clean Architecture, Sơ đồ ERD 13 bảng 3NF, Ảnh họp GVHD.", "100% Đạt"),
        ("Tuần 09\n(05/10 - 11/10/2026)", "Thứ 6, 09/10/2026", "Chuẩn hóa tài liệu Single Source of Truth (SSOT), 11 Quy tắc nghiệp vụ cốt lõi, rà soát đối chiếu kiến trúc.", "Tài liệu SSOT, Kế hoạch triển khai, Ảnh bút tích dặn dò của GVHD.", "100% Đạt"),
        ("Tuần 10\n(12/10 - 18/10/2026)", "Thứ 6, 16/10/2026", "Phát triển luồng POS FEFO tự động bẻ lô, kiểm soát xe tải DC chuẩn RSL >= 70%, khóa cứng hàng quá hạn.", "Flow of Events, Wireframe Hero Section & Dashboard, Ảnh làm việc với GVHD.", "100% Đạt"),
        ("Tuần 11\n(19/10 - 25/10/2026)", "Thứ 6, 23/10/2026", "Hoàn thành trọn vẹn 7 module: Auth/JWT, Xuất Excel, Bàn giao ca trực, VietQR, Tiêu hủy, Dự báo ROP, Audit Log.", "Source code 11 quy tắc, 39 E2E test suites passed, Bút tích & Ảnh họp GVHD.", "100% Đạt")
    ]

    col_widths = [Inches(1.2), Inches(1.1), Inches(2.2), Inches(1.7), Inches(0.8)]
    for r_idx, row_data in enumerate(matrix_rows):
        row = tbl_matrix.rows[r_idx + 1]
        bg_col = "FFFFFF" if r_idx % 2 == 0 else "F7FAFC"
        for c_idx, val in enumerate(row_data):
            c = row.cells[c_idx]
            c.width = col_widths[c_idx]
            set_cell_background(c, bg_col)
            set_cell_margins(c, top=90, bottom=90, left=90, right=90)
            p = c.paragraphs[0]
            p.text = ""
            if c_idx in [0, 1, 4]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.name = "Arial"; r.font.size = Pt(9.5)
            if c_idx == 4:
                r.font.bold = True
                r.font.color.rgb = RGBColor(0, 128, 0) # Green

    doc.add_page_break()

    # =========================================================================
    # PHẦN 1: BÁO CÁO TIẾN ĐỘ CHI TIẾT TUẦN 03
    # =========================================================================
    add_styled_heading(doc, "I. BÁO CÁO TIẾN ĐỘ TUẦN 03 (07/09/2026 – 13/09/2026)", level=1)
    
    p_t3_meta = doc.add_paragraph()
    r = p_t3_meta.add_run("Thời gian thực hiện: ")
    r.font.name = "Arial"; r.font.bold = True
    r = p_t3_meta.add_run("07/09/2026 – 13/09/2026 | ")
    r.font.name = "Arial"
    r = p_t3_meta.add_run("Ngày làm việc với GVHD: ")
    r.font.name = "Arial"; r.font.bold = True
    r = p_t3_meta.add_run("Thứ Tư, 09/09/2026 (Trực tiếp tại Văn phòng Khoa CNTT)")
    r.font.name = "Arial"

    add_styled_heading(doc, "1. Nội dung đã thực hiện trong Tuần 03:", level=2)
    tasks_t3_done = [
        ("Tiếp thu & tinh gọn nghiệp vụ theo chỉ đạo của GVHD ThS. Lê Minh Nhật: ",
         "Khoanh vùng trọng tâm vào mô hình Bán lẻ Retail Store tinh gọn (Kho tổng DC -> Cửa hàng LHU Mart -> Khách hàng). Loại bỏ triệt để các tính năng phức tạp ngoài phạm vi như luân chuyển ngang giữa các shop hoặc quy trình hoàn trả nhà cung cấp không cần thiết."),
        ("Chuẩn hóa bộ công thức định lượng & 3 ngưỡng an toàn cốt lõi: ",
         "Xây dựng công thức tính Vòng đời còn lại của lô hàng (RSL). Phân loại 3 mức cảnh báo: Vùng Xanh (RSL > 20% - An toàn bán nguyên giá), Vùng Vàng (10% < RSL <= 20% - Cảnh báo, giảm giá 15%-30% và đảo kệ mặt tiền), Vùng Đỏ (RSL <= 10% - Nguy cơ hư hỏng cao, xả hàng 40%-50%), và Vùng Hết hạn (DaysLeft <= 0 - Khóa cứng trên POS, chuyển tiêu hủy)."),
        ("Thiết kế hoàn thiện Sơ đồ Use Case tổng thể hệ thống: ",
         "Xây dựng hoàn chỉnh Sơ đồ Use Case gồm 6 phân hệ tác nghiệp khép kín (Nhập hàng từ DC chuẩn RSL >= 70%, Quản lý HSD từng lô FEFO, Bán lẻ POS tự động bẻ lô, Đảo kệ & Xả hàng Markdown, Tiêu hủy & Sổ hao hụt tài chính, Dự báo ROP & Đơn hàng DC)."),
        ("Thiết kế Sơ đồ luồng dữ liệu DFD Mức 0 (Context) và DFD Mức 1: ",
         "Hoàn thành Sơ đồ ngữ cảnh DFD Mức 0 và phân rã DFD Mức 1 thể hiện rõ ràng các dòng dữ liệu luân chuyển giữa các thực thể ngoài (DC Kho tổng, Cửa hàng trưởng, Nhân viên thu ngân, Khách hàng) và kho dữ liệu trung tâm."),
        ("Thiết kế Cơ sở dữ liệu quan hệ chuẩn 3NF: ",
         "Xây dựng thiết kế dữ liệu chuẩn hóa gồm 12 bảng thực thể liên kết chặt chẽ (Users, Roles, StoreProfile, Suppliers, Categories, Products, Batches, SalesHistory, SpoilageRecords, PurchaseOrders, PurchaseOrderItems, GoodsReceipts, AuditLogs) có khóa chính, khóa ngoại và ràng buộc CHECK chống âm kho."),
        ("Cài đặt CSDL Microsoft SQL Server & Kịch bản T-SQL: ",
         "Khởi tạo Database retail_spoilage_db trên SQL Server LocalDB, tạo lập bảng, thiết lập các chỉ mục tối ưu hiệu năng truy vấn FEFO (IX_Batches_FEFO, IX_Batches_ExpiryWatchdog)."),
        ("Kiểm thử tự động logic CSDL: ",
         "Viết kịch bản kiểm tra tính toàn vẹn khóa ngoại, thuật toán xuất hàng FEFO và các ràng buộc nghiệp vụ không để xảy ra sai sót dữ liệu.")
    ]
    for title, desc in tasks_t3_done:
        add_bullet_item(doc, title, desc)

    add_styled_heading(doc, "2. Nội dung dự kiến tiếp theo:", level=2)
    tasks_t3_next = [
        ("Khởi tạo khung kiến trúc Clean Architecture cho Backend: ", "Tách biệt Domain, Application, Infrastructure và Presentation."),
        ("Hiện thực hóa Tầng Data Access (Repository Pattern): ", "Kết nối an toàn CSDL qua module db.js với Transaction xử lý đồng thời."),
        ("Xây dựng Service tiếp nhận lô hàng từ Kho tổng DC: ", "Tự động thẩm định điều kiện RSL >= 70% trước khi lưu kho.")
    ]
    for title, desc in tasks_t3_next:
        add_bullet_item(doc, title, desc)

    add_styled_heading(doc, "3. Minh chứng Kỹ thuật Sản phẩm Tuần 03:", level=2)
    
    img_dir = "Docs/Diagram_Images"
    img_usecase = os.path.join(img_dir, "use_case.png")
    img_dfd0 = os.path.join(img_dir, "dfd_0.png")
    img_dfd1 = os.path.join(img_dir, "dfd_1.png")

    if os.path.exists(img_usecase):
        doc.add_paragraph().alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.paragraphs[-1].paragraph_format.space_before = Pt(6)
        doc.paragraphs[-1].paragraph_format.space_after = Pt(2)
        doc.paragraphs[-1].add_run().add_picture(img_usecase, width=Inches(6.0))
        add_caption(doc, "Hình 1.1: Sơ đồ Use Case Tổng thể Hệ thống Quản trị Chuỗi cung ứng Chống lãng phí (Tuần 03)")

    if os.path.exists(img_dfd0):
        doc.add_paragraph().alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.paragraphs[-1].paragraph_format.space_before = Pt(6)
        doc.paragraphs[-1].paragraph_format.space_after = Pt(2)
        doc.paragraphs[-1].add_run().add_picture(img_dfd0, width=Inches(5.8))
        add_caption(doc, "Hình 1.2: Sơ đồ Luồng Dữ liệu Ngữ cảnh DFD Mức 0 (Tuần 03)")

    if os.path.exists(img_dfd1):
        doc.add_paragraph().alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.paragraphs[-1].paragraph_format.space_before = Pt(6)
        doc.paragraphs[-1].paragraph_format.space_after = Pt(2)
        doc.paragraphs[-1].add_run().add_picture(img_dfd1, width=Inches(6.0))
        add_caption(doc, "Hình 1.3: Sơ đồ Phân rã Luồng Dữ liệu DFD Mức 1 - 5 Tiến trình Cốt lõi (Tuần 03)")

    doc.add_page_break()

    # =========================================================================
    # PHẦN 2: BÁO CÁO TIẾN ĐỘ CHI TIẾT TUẦN 06
    # =========================================================================
    add_styled_heading(doc, "II. BÁO CÁO TIẾN ĐỘ TUẦN 06 (28/09/2026 – 04/10/2026)", level=1)
    
    p_t6_meta = doc.add_paragraph()
    r = p_t6_meta.add_run("Thời gian thực hiện: ")
    r.font.name = "Arial"; r.font.bold = True
    r = p_t6_meta.add_run("28/09/2026 – 04/10/2026 | ")
    r.font.name = "Arial"
    r = p_t6_meta.add_run("Ngày làm việc với GVHD: ")
    r.font.name = "Arial"; r.font.bold = True
    r = p_t6_meta.add_run("Thứ Sáu, 02/10/2026 (Phòng Nghiên cứu Khoa CNTT - Đại học Lạc Hồng)")
    r.font.name = "Arial"

    add_styled_heading(doc, "1. Nội dung đã thực hiện trong Tuần 06:", level=2)
    tasks_t6_done = [
        ("Khởi tạo Khung Kiến trúc Clean Architecture cho Backend Node.js/Express: ",
         "Thiết lập cấu trúc phân tầng nghiêm ngặt: Presentation Layer (Controllers, Middlewares), Business Logic / Application Layer (Services), Data Access Layer (Repositories), và Domain Models. Đảm bảo quy tắc phụ thuộc Dependency Rule một chiều hướng vào tâm."),
        ("Hiện thực hóa Tầng Data Access (Repository Pattern) & Kết nối SQL Server LocalDB: ",
         "Xây dựng module Backend/src/infrastructure/database/sqlConnection.js kết nối Microsoft SQL Server LocalDB. Cấu hình Connection Pool an toàn, hỗ trợ cơ chế bọc Transaction với mức cô lập SERIALIZABLE / UPDLOCK, ROWLOCK chống xung đột ghi dữ liệu đồng thời."),
        ("Phát triển Module Tiếp nhận Lô hàng từ Kho tổng DC (/api/batches/inbound): ",
         "Lập trình Service tiếp nhận lô hàng vận chuyển từ DC: Tự động thẩm định điều kiện nhập kho đạt chuẩn RSL >= 70%. Nếu RSL < 70%, hệ thống tự động khóa lưu dữ liệu và trả về cảnh báo vi phạm chất lượng, từ chối nhập kho."),
        ("Khởi tạo Ứng dụng Frontend React (Vite) + TailwindCSS & Khung Giao diện Quản trị: ",
         "Khởi tạo Single Page Application với React 18, Vite và TailwindCSS. Xây dựng Layout tổng thể hoàn chỉnh gồm Sidebar điều hướng các phân hệ nghiệp vụ, Header hiển thị thông tin ca trực và khu vực nội dung chính phản hồi nhanh."),
        ("Xây dựng Màn hình Giám sát Hạn sử dụng theo lô (FEFO Monitor Screen): ",
         "Thiết kế bảng quản lý lô hàng trực quan với thẻ phân loại 3 màu cảnh báo: Vùng Xanh (RSL > 20% - An toàn), Vùng Vàng (10% < RSL <= 20% - Cảnh báo cận hạn), Vùng Đỏ (RSL <= 10% - Nguy cơ hư hỏng cao) và nhãn EXPIRED cho các lô đã quá hạn."),
        ("Quản lý mã nguồn trên Git/GitHub & Phân chia trách nhiệm phát triển: ",
         "Chuẩn hóa cấu trúc thư mục modular dự án (Backend, Frontend, Database, Docs). Thiết lập nhánh độc lập: main, dotandu_git, minh_quan và quy trình Merge Request kiểm duyệt chéo trước khi hợp nhất mã nguồn.")
    ]
    for title, desc in tasks_t6_done:
        add_bullet_item(doc, title, desc)

    add_styled_heading(doc, "2. Nội dung dự kiến tiếp theo:", level=2)
    tasks_t6_next = [
        ("Xây dựng Màn hình Bán lẻ POS & Thuật toán Khấu trừ kho FEFO Tự động: ", "Tự động chọn lô cận date nhất xuất trước; tự động chia tách đơn hàng (bẻ lô) nếu 1 lô không đủ số lượng."),
        ("Xây dựng Tính năng Xả hàng Giảm giá Nhanh (Quick Markdown): ", "Cho phép áp dụng chiết khấu 15% - 50% cho các lô hàng thuộc Vùng Vàng và Vùng Đỏ."),
        ("Phát triển Module Đề xuất & Phê duyệt Tiêu hủy Hàng hỏng (Spoilage Disposal): ", "Tự động hạch toán chi phí thiệt hại vào Sổ hao hụt tài chính bất biến.")
    ]
    for title, desc in tasks_t6_next:
        add_bullet_item(doc, title, desc)

    add_styled_heading(doc, "3. Minh chứng Kỹ thuật & Hình ảnh Họp với GVHD Tuần 06:", level=2)
    
    img_clean = os.path.join(img_dir, "clean_architecture.png")
    img_erd = os.path.join(img_dir, "erd_database_3nf.png")
    img_meeting6 = os.path.join(img_dir, "meeting_gvhd_tuan_06.png")

    if os.path.exists(img_clean):
        doc.add_paragraph().alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.paragraphs[-1].paragraph_format.space_before = Pt(6)
        doc.paragraphs[-1].paragraph_format.space_after = Pt(2)
        doc.paragraphs[-1].add_run().add_picture(img_clean, width=Inches(5.8))
        add_caption(doc, "Hình 2.1: Sơ đồ Kiến trúc Phân tầng Clean Architecture 4 Tầng của Hệ thống (Tuần 06)")

    if os.path.exists(img_erd):
        doc.add_paragraph().alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.paragraphs[-1].paragraph_format.space_before = Pt(6)
        doc.paragraphs[-1].paragraph_format.space_after = Pt(2)
        doc.paragraphs[-1].add_run().add_picture(img_erd, width=Inches(6.0))
        add_caption(doc, "Hình 2.2: Sơ đồ Cơ sở Dữ liệu Quan hệ Chuẩn 3NF gồm 13 Thực thể Liên kết (Tuần 06)")

    if os.path.exists(img_meeting6):
        doc.add_paragraph().alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.paragraphs[-1].paragraph_format.space_before = Pt(6)
        doc.paragraphs[-1].paragraph_format.space_after = Pt(2)
        doc.paragraphs[-1].add_run().add_picture(img_meeting6, width=Inches(5.5))
        add_caption(doc, "Hình 2.3: Hình ảnh Buổi làm việc Báo cáo Tiến độ Tuần 06 với GVHD ThS. Lê Minh Nhật (02/10/2026)")

    doc.add_page_break()

    # =========================================================================
    # PHẦN 3: BÁO CÁO TIẾN ĐỘ CHI TIẾT TUẦN 09
    # =========================================================================
    add_styled_heading(doc, "III. BÁO CÁO TIẾN ĐỘ TUẦN 09 (05/10/2026 – 11/10/2026)", level=1)
    
    p_t9_meta = doc.add_paragraph()
    r = p_t9_meta.add_run("Thời gian thực hiện: ")
    r.font.name = "Arial"; r.font.bold = True
    r = p_t9_meta.add_run("05/10/2026 – 11/10/2026 | ")
    r.font.name = "Arial"
    r = p_t9_meta.add_run("Ngày làm việc với GVHD: ")
    r.font.name = "Arial"; r.font.bold = True
    r = p_t9_meta.add_run("Thứ Sáu, 09/10/2026 (Phòng Nghiên cứu Khoa CNTT - Đại học Lạc Hồng)")
    r.font.name = "Arial"

    add_styled_heading(doc, "1. Nội dung đã thực hiện trong Tuần 09:", level=2)
    tasks_t9_done = [
        ("Đưa kiến trúc triển khai các module vào văn bản Word Đặc tả hệ thống hoàn chỉnh: ",
         "Tổng hợp toàn bộ cấu trúc kiến trúc phân tầng Clean Architecture, danh mục các ca sử dụng trọng tâm và quy cách kỹ thuật vào tài liệu chuẩn mực của đồ án."),
        ("Triển khai lại bộ tài liệu Markdown kỹ thuật và rà soát đối chiếu nghiệp vụ: ",
         "Rà soát và chuẩn hóa đồng bộ 15 file Markdown kỹ thuật trong thư mục Docs/; hợp nhất thành văn bản nguồn chuẩn xác duy nhất (Single Source of Truth - SSOT) để bảo đảm mọi thành viên phát triển tuân thủ tuyệt đối quy tắc nghiệp vụ."),
        ("Triển khai phân kỳ theo cụm, hoàn thiện 3 đến 4 module cốt lõi trọng tâm: ",
         "Tập trung nguồn lực phát triển và kiểm thử dứt điểm 4 module bản lề: 1) Nhận hàng DC chuẩn RSL >= 70%; 2) Giám sát Date & Phân loại 3 Vùng cảnh báo; 3) Quầy POS FEFO tự động bẻ lô; 4) Tiêu hủy hàng hỏng gắn liền Sổ hao hụt tài chính."),
        ("Thiết kế giao diện tham khảo quy chuẩn Skills kết hợp AI phác thảo bản vẽ: ",
         "Áp dụng chuẩn thiết kế giao diện từ các bộ Skill hệ thống (clean-architecture, spoilage-business-rules) nhằm tinh giản thông tin, tăng độ trực quan cho màn hình ca trực."),
        ("Rà soát và loại bỏ các thành phần dư thừa không thuộc phạm vi: ",
         "Khóa cứng quy mô hệ thống: Đúng 1 cửa hàng bán lẻ duy nhất (RETAIL-STORE-01) liên kết Trung tâm Phân phối DC Biên Hòa; loại bỏ các thủ tục chuyển hàng giữa các shop không thực tế.")
    ]
    for title, desc in tasks_t9_done:
        add_bullet_item(doc, title, desc)

    add_styled_heading(doc, "2. Ý kiến Chỉ đạo của GVHD ThS. Lê Minh Nhật tại buổi làm việc ngày 09/10/2026:", level=2)
    tasks_t9_next = [
        ("Kiểm tra lại toàn diện các Quy tắc nghiệp vụ (Business Rules) trong file Word Đặc tả: ",
         "Rà soát và làm rõ 10 Quy tắc nghiệp vụ cốt lõi, loại bỏ xung đột logic, thể hiện rõ công thức tính toán và ràng buộc dữ liệu."),
        ("Bổ sung người chịu trách nhiệm quản lý khi tiếp nhận nhập kho từ Kho tổng (DC): ",
         "Quy định rõ ràng vai trò Cửa hàng trưởng (Store Manager) trong biên bản giao nhận hàng từ xe tải DC, chịu trách nhiệm thẩm định chất lượng và ký xác nhận điện tử."),
        ("Phân tích chi tiết chức năng người dùng và viết Luồng sự kiện (Flow of Events): ",
         "Mô tả chi tiết luồng nghiệp vụ cho các chức năng then chốt (Nhận hàng DC, Bán lẻ POS, Đảo kệ, Tiêu hủy, Dự báo ROP)."),
        ("Thiết kế giao diện UI/UX trực quan cho Hero Section và Executive Dashboard: ",
         "Bố trí giao diện chuyên nghiệp, hiển thị nổi bật 6 chỉ số KPI tài chính chống lãng phí và Action Board xử lý khẩn cấp trong ca trực.")
    ]
    for title, desc in tasks_t9_next:
        add_bullet_item(doc, title, desc)

    add_styled_heading(doc, "3. Minh chứng Kỹ thuật & Bút tích Chỉ đạo của GVHD Tuần 09:", level=2)
    
    img_note9 = os.path.join(img_dir, "note_gvhd_tuan_09.png")
    if os.path.exists(img_note9):
        doc.add_paragraph().alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.paragraphs[-1].paragraph_format.space_before = Pt(6)
        doc.paragraphs[-1].paragraph_format.space_after = Pt(2)
        doc.paragraphs[-1].add_run().add_picture(img_note9, width=Inches(4.2))
        add_caption(doc, "Hình 3.1: Bút tích Ghi nhận Ý kiến Chỉ đạo Trực tiếp của GVHD ThS. Lê Minh Nhật (09/10/2026)")

    doc.add_page_break()

    # =========================================================================
    # PHẦN 4: BÁO CÁO TIẾN ĐỘ CHI TIẾT TUẦN 10
    # =========================================================================
    add_styled_heading(doc, "IV. BÁO CÁO TIẾN ĐỘ TUẦN 10 (12/10/2026 – 18/10/2026)", level=1)
    
    p_t10_meta = doc.add_paragraph()
    r = p_t10_meta.add_run("Thời gian thực hiện: ")
    r.font.name = "Arial"; r.font.bold = True
    r = p_t10_meta.add_run("12/10/2026 – 18/10/2026 | ")
    r.font.name = "Arial"
    r = p_t10_meta.add_run("Ngày làm việc với GVHD: ")
    r.font.name = "Arial"; r.font.bold = True
    r = p_t10_meta.add_run("Thứ Sáu, 16/10/2026 (Phòng Nghiên cứu Khoa CNTT - Đại học Lạc Hồng)")
    r.font.name = "Arial"

    add_styled_heading(doc, "1. Nội dung đã thực hiện trong Tuần 10:", level=2)
    tasks_t10_done = [
        ("Kiểm tra lại toàn diện các Quy tắc nghiệp vụ (Business Rules) trong file Word Đặc tả: ",
         "Rà soát và chuẩn hóa 10 Quy tắc cốt lõi (BR-01 đến BR-10), loại bỏ triệt để các xung đột logic giữa khâu kiểm soát HSD và khâu xuất kho."),
        ("Bổ sung người chịu trách nhiệm quản lý khi tiếp nhận nhập kho từ Kho tổng (DC): ",
         "Quy định rõ ràng vai trò và trách nhiệm pháp lý của Cửa hàng trưởng (Store Manager) trong biên bản tiếp nhận hàng DC, bổ sung trường receiver_id và chữ ký điện tử."),
        ("Phân tích chi tiết chức năng người dùng và thiết kế luồng sự kiện (Flow of Events): ",
         "Hoàn thành tài liệu phân tích chi tiết cho 8 ca sử dụng trọng tâm của hệ thống (Nhập kho DC, Kiểm tra RSL, Giám sát lô hàng 3 vùng màu, Bán hàng POS FEFO, Áp dụng Quick Markdown, Tiêu hủy hàng hỏng, Tính điểm ROP, Xem nhật ký kiểm toán)."),
        ("Thiết kế giao diện UI/UX bằng khung Wireframe Hero Section: ",
         "Xây dựng bản vẽ khung giao diện trực quan dạng Hero Section cho Landing Page cổng thông tin chuỗi cung ứng, thể hiện tầm nhìn và cam kết bảo vệ môi trường, giảm thiểu lãng phí thực phẩm."),
        ("Xây dựng khung Dashboard hoàn chỉnh bằng Text-Based Wireframe: ",
         "Phác thảo toàn diện bố cục giao diện Executive Dashboard đa chiều, phân chia khu vực khoa học: 6 thẻ KPI tài chính, Biểu đồ cơ cấu hao hụt, Bảng hành động khẩn cấp (Action Board) theo ca trực."),
        ("Bố trí và hoàn thiện Bảng quy chuẩn Business Rules ở cuối tài liệu: ",
         "Tổng hợp toàn bộ 10 Quy tắc nghiệp vụ kèm công thức toán học định lượng, điều kiện kích hoạt, hành động cưỡng chế của hệ thống và bảng dữ liệu chịu tác động."),
        ("Xây dựng hồ sơ người dùng (User Persona) trước khi phân tích quyền hạn: ",
         "Xây dựng hồ sơ chi tiết 2 Persona người dùng cốt lõi: Cửa hàng trưởng (Store Manager - Quản trị vận hành) và Nhân viên Thu ngân / Bán hàng (Cashier/Store Staff - Thực thi nghiệp vụ quầy).")
    ]
    for title, desc in tasks_t10_done:
        add_bullet_item(doc, title, desc)

    add_styled_heading(doc, "2. Ý kiến Chỉ đạo của GVHD ThS. Lê Minh Nhật tại buổi làm việc ngày 16/10/2026:", level=2)
    tasks_t10_next = [
        ("Tạo trang Lock-in / Đăng nhập hệ thống: ", "Bảo vệ hệ thống bằng xác thực JWT, phân quyền vai trò (RBAC) rõ ràng."),
        ("Danh sách hàng hóa & tính năng Xuất Excel: ", "Hiển thị đầy đủ danh mục, tồn kho theo từng lô, bao gồm cả các lô đã tiêu hủy."),
        ("Tìm hiểu cấu hình Cửa hàng bán lẻ và Kho tổng DC: ", "Cấu hình Lead Time giao nhận, sức chứa kho, tiêu chuẩn RSL tối thiểu."),
        ("Sửa lại tính năng Bàn giao ca trực: ", "Hoàn thiện Shift Handover Banner & Checklist bàn giao tiền mặt và tình trạng date."),
        ("Nghiên cứu sâu và tối ưu hóa kiến trúc Backend: ", "Ứng dụng SQL Transaction chặt chẽ, chống âm kho tuyệt đối khi bán đồng thời."),
        ("Sửa lại giao diện & luồng nghiệp vụ Trang Tiêu hủy hàng hỏng: ", "Đồng bộ lô chọn từ màn hình giám sát date, hạch toán tự động vào Sổ hao hụt."),
        ("Xem lại vai trò Thu ngân POS & tích hợp Thanh toán quét mã QR: ", "Tích hợp mã VietQR động theo từng đơn hàng POS.")
    ]
    for title, desc in tasks_t10_next:
        add_bullet_item(doc, title, desc)

    add_styled_heading(doc, "3. Minh chứng Kỹ thuật, Bút tích & Hình ảnh Họp Tuần 10:", level=2)
    
    img_meeting10 = os.path.join(img_dir, "meeting_gvhd_tuan_10_16_10_2026.png")
    img_note10 = os.path.join(img_dir, "note_gvhd_tuan_10.png")

    if os.path.exists(img_note10):
        doc.add_paragraph().alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.paragraphs[-1].paragraph_format.space_before = Pt(6)
        doc.paragraphs[-1].paragraph_format.space_after = Pt(2)
        doc.paragraphs[-1].add_run().add_picture(img_note10, width=Inches(4.2))
        add_caption(doc, "Hình 4.1: Bút tích Ghi chép 7 Chỉ đạo Trọng tâm của GVHD ThS. Lê Minh Nhật (16/10/2026)")

    if os.path.exists(img_meeting10):
        doc.add_paragraph().alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.paragraphs[-1].paragraph_format.space_before = Pt(6)
        doc.paragraphs[-1].paragraph_format.space_after = Pt(2)
        doc.paragraphs[-1].add_run().add_picture(img_meeting10, width=Inches(5.5))
        add_caption(doc, "Hình 4.2: Hình ảnh Buổi làm việc Trực tiếp Báo cáo Tiến độ Tuần 10 với GVHD (16/10/2026)")

    doc.add_page_break()

    # =========================================================================
    # PHẦN 5: BÁO CÁO TIẾN ĐỘ CHI TIẾT TUẦN 11
    # =========================================================================
    add_styled_heading(doc, "V. BÁO CÁO TIẾN ĐỘ TUẦN 11 (19/10/2026 – 25/10/2026)", level=1)
    
    p_t11_meta = doc.add_paragraph()
    r = p_t11_meta.add_run("Thời gian thực hiện: ")
    r.font.name = "Arial"; r.font.bold = True
    r = p_t11_meta.add_run("19/10/2026 – 25/10/2026 | ")
    r.font.name = "Arial"
    r = p_t11_meta.add_run("Ngày làm việc với GVHD: ")
    r.font.name = "Arial"; r.font.bold = True
    r = p_t11_meta.add_run("Thứ Sáu, 23/10/2026 (Phòng Nghiên cứu Khoa CNTT - Đại học Lạc Hồng)")
    r.font.name = "Arial"

    add_styled_heading(doc, "1. Nội dung đã hoàn thành xuất sắc trong Tuần 11 (Bám sát 7 chỉ đạo ngày 16/10 của GVHD):", level=2)
    tasks_t11_done = [
        ("Xây dựng Trang Đăng nhập (Lock-in / Authentication Screen) bảo mật hệ thống: ",
         "Thiết kế giao diện đăng nhập hiện đại với nhận diện thương hiệu LHU Mart; tích hợp cơ chế xác thực JWT Token và phân quyền vai trò (Role-Based Access Control - RBAC) nghiêm ngặt gồm 3 Actor chuẩn mực (ADMIN, STORE_MANAGER, CASHIER)."),
        ("Phát triển Module Danh sách Hàng hóa & Tính năng Xuất Báo cáo Excel: ",
         "Xây dựng bảng dữ liệu hiển thị toàn diện danh mục hàng hóa, số lượng tồn thực tế theo từng lô và danh sách lịch sử các lô đã tiêu hủy. Tích hợp thư viện xlsx/exceljs xuất file Excel chuyên nghiệp với đầy đủ tiêu đề, màu sắc nhận diện và định dạng số tiền VND."),
        ("Thiết lập Module Cấu hình Tham số Cửa hàng Bán lẻ & Kho tổng DC: ",
         "Xây dựng trang quản trị tham số hệ thống: Cấu hình thông tin Cửa hàng tiện lợi duy nhất (RETAIL-STORE-01), thông tin Kho tổng DC Biên Hòa, thời gian vận chuyển Lead Time (mặc định 2 ngày), sức chứa kho và ngưỡng RSL tối thiểu khi tiếp nhận hàng (>= 70%)."),
        ("Cải tiến Tính năng Bàn giao Ca trực (Shift Handover Banner & Checklist): ",
         "Tái cấu trúc biểu ngữ điều hành ca trực đầu ngày trên Dashboard: Hiển thị tự động thông tin nhân viên ca trước, số dư tiền mặt đầu ca - cuối ca, doanh thu tạm tính trong ca và danh sách các lô hàng cận date cần bàn giao chú ý đặc biệt."),
        ("Nghiên cứu sâu & Tối ưu hóa Kiến trúc Backend Service (Clean Architecture): ",
         "Tối ưu toàn diện tầng nghiệp vụ Backend theo Clean Architecture: Áp dụng cơ chế Transaction bọc nhiều câu lệnh SQL đồng thời với mức cô lập nghiêm ngặt, sử dụng khóa UPDLOCK, ROWLOCK chống hiện tượng Race Condition và ngăn chặn triệt để nguy cơ âm kho khi nhiều quầy POS thanh toán cùng lúc."),
        ("Cải tiến Giao diện & Luồng nghiệp vụ Trang Tiêu hủy Hàng hỏng (Spoilage Disposal View): ",
         "Nâng cấp màn hình tiêu hủy: Tự động điền thông tin lô hàng được chọn khi nhấn 'Hủy Lô' từ bảng cảnh báo; tính toán tự động số tiền thiệt hại CostLoss = Số lượng hủy * Đơn giá nhập; lưu vết bất biến vào bảng SpoilageRecords và cập nhật số tồn lô về 0 kèm trạng thái DISPOSED."),
        ("Nâng cấp Vai trò Thu ngân POS & Tích hợp Thanh toán Quét mã QR (VietQR): ",
         "Tối ưu giao diện bán hàng tại quầy: Hỗ trợ tìm kiếm nhanh theo SKU/Barcode, tự động xuất kho theo FEFO (bẻ đơn qua nhiều lô nếu cần); tích hợp cổng sinh mã VietQR động theo chuẩn Napas 247 kèm số tiền chính xác, giúp khách hàng quét mã thanh toán chuyển khoản tức thì."),
        ("Kiểm thử E2E Toàn diện 11 Quy tắc Nghiệp vụ Cốt lõi: ",
         "Xây dựng kịch bản kiểm thử tự động test_master_e2e_11_rules_full_web.js gồm 39 ca kiểm thử liên thông (Full E2E). Kết quả: 39/39 bài test đều PASSED 100%, bảo đảm hệ thống vận hành mượt mà, không phát sinh lỗi.")
    ]
    for title, desc in tasks_t11_done:
        add_bullet_item(doc, title, desc)

    add_styled_heading(doc, "2. Kế hoạch Hoàn thiện và Nghiệm thu Bảo vệ Đồ án:", level=2)
    tasks_t11_next = [
        ("Tinh gọn giao diện & Tối ưu trải nghiệm người dùng (UX Polish): ", "Lược bỏ các nhãn thừa, làm gọn thanh trạng thái, tối ưu phông chữ tiếng Việt Unicode UTF-8 toàn hệ thống."),
        ("Hoàn thiện Thuyết minh Đồ án & Slide Báo cáo Cuối kỳ: ", "Đóng gói toàn bộ hồ sơ kỹ thuật, tài liệu bàn giao, kịch bản demo 15 phút và kịch bản vấn đáp bảo vệ đồ án trước Hội đồng chấm thi."),
        ("Nghiệm thu toàn diện mã nguồn & Triển khai môi trường mẫu: ", "Sao lưu CSDL chuẩn mực, kiểm tra tính toàn vẹn dữ liệu trên môi trường production của LHU Mart.")
    ]
    for title, desc in tasks_t11_next:
        add_bullet_item(doc, title, desc)

    add_styled_heading(doc, "3. Minh chứng Kỹ thuật, Bút tích & Hình ảnh Họp Tuần 11:", level=2)
    
    img_meeting11 = os.path.join(img_dir, "meeting_gvhd_tuan_11.png")
    img_note11 = os.path.join(img_dir, "note_gvhd_tuan_11.png")

    # Table to place note and meeting side-by-side or stacked cleanly
    if os.path.exists(img_note11):
        doc.add_paragraph().alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.paragraphs[-1].paragraph_format.space_before = Pt(6)
        doc.paragraphs[-1].paragraph_format.space_after = Pt(2)
        doc.paragraphs[-1].add_run().add_picture(img_note11, width=Inches(3.8))
        add_caption(doc, "Hình 5.1: Bút tích Nhận xét và Đánh giá Tiến độ của GVHD ThS. Lê Minh Nhật (Tuần 11)")

    if os.path.exists(img_meeting11):
        doc.add_paragraph().alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.paragraphs[-1].paragraph_format.space_before = Pt(6)
        doc.paragraphs[-1].paragraph_format.space_after = Pt(2)
        doc.paragraphs[-1].add_run().add_picture(img_meeting11, width=Inches(5.0))
        add_caption(doc, "Hình 5.2: Hình ảnh Buổi làm việc Báo cáo Nghiệm thu Tiến độ Tuần 11 với GVHD (23/10/2026)")

    doc.add_page_break()

    # =========================================================================
    # PHẦN 6: ĐÁNH GIÁ CỦA GVHD & BẢNG KÝ TÊN 3 BÊN
    # =========================================================================
    add_styled_heading(doc, "VI. ĐÁNH GIÁ TỔNG KẾT CỦA GVHD & KHUNG XÁC NHẬN 3 BÊN", level=1)

    p_danhgia_intro = doc.add_paragraph()
    p_danhgia_intro.paragraph_format.space_before = Pt(4)
    p_danhgia_intro.paragraph_format.space_after = Pt(8)
    r = p_danhgia_intro.add_run("Sau quá trình hướng dẫn, theo dõi và đánh giá định kỳ từ Tuần 03 đến Tuần 11, Giảng viên Hướng dẫn ghi nhận tinh thần làm việc, kết quả thực hiện đồ án của nhóm sinh viên như sau:")
    r.font.name = "Arial"; r.font.size = Pt(10.5)

    tbl_eval = doc.add_table(rows=4, cols=3)
    tbl_eval.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_eval, color="1F497D", sz="6", val="single")

    eval_headers = ["Tiêu chí Đánh giá", "Nội dung Nhận xét Chi tiết", "Mức độ Đạt"]
    for col_idx, h_text in enumerate(eval_headers):
        c = tbl_eval.rows[0].cells[col_idx]
        set_cell_background(c, "1F497D")
        set_cell_margins(c, top=100, bottom=100, left=100, right=100)
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h_text)
        r.font.name = "Arial"; r.font.size = Pt(10); r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    eval_items = [
        ("1. Thái độ & Tinh thần làm việc:", "Sinh viên nghiêm túc, tích cực, tham gia các buổi họp định kỳ đúng giờ, tiếp thu đầy đủ và triển khai nhanh chóng các ý kiến chỉ đạo của GVHD.", "Xuất sắc\n(100%)"),
        ("2. Tiến độ & Khối lượng công việc:", "Hoàn thành 100% các đầu mục công việc được giao qua từng tuần theo đúng đề cương đồ án. Không bị trễ hạn hoặc dồn ứ công việc.", "Đúng hạn\n(100%)"),
        ("3. Chất lượng Kỹ thuật & Sản phẩm:", "Hệ thống đáp ứng trọn vẹn 11 Quy tắc nghiệp vụ cốt lõi, kiến trúc Clean Architecture sạch sẽ, CSDL chuẩn 3NF, giao diện mượt mà và kiểm thử E2E tự động toàn diện đạt 39/39 bài test.", "Đạt chuẩn xuất sắc")
    ]

    for r_idx, (c0_text, c1_text, c2_text) in enumerate(eval_items):
        row = tbl_eval.rows[r_idx + 1]
        c0, c1, c2 = row.cells[0], row.cells[1], row.cells[2]
        c0.width = Inches(2.0)
        c1.width = Inches(3.8)
        c2.width = Inches(1.2)
        set_cell_background(c0, "F2F5F9")
        set_cell_margins(c0, top=80, bottom=80, left=100, right=100)
        set_cell_margins(c1, top=80, bottom=80, left=100, right=100)
        set_cell_margins(c2, top=80, bottom=80, left=100, right=100)

        p0 = c0.paragraphs[0]; p0.text = ""
        r0 = p0.add_run(c0_text); r0.font.name = "Arial"; r0.font.size = Pt(10); r0.font.bold = True
        r0.font.color.rgb = RGBColor(31, 73, 125)

        p1 = c1.paragraphs[0]; p1.text = ""
        r1 = p1.add_run(c1_text); r1.font.name = "Arial"; r1.font.size = Pt(10)

        p2 = c2.paragraphs[0]; p2.text = ""; p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r2 = p2.add_run(c2_text); r2.font.name = "Arial"; r2.font.size = Pt(10); r2.font.bold = True
        r2.font.color.rgb = RGBColor(0, 128, 0)

    p_space2 = doc.add_paragraph()
    p_space2.paragraph_format.space_before = Pt(14)
    p_space2.paragraph_format.space_after = Pt(4)

    # Official Tripartite Signature Table
    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_date.paragraph_format.space_before = Pt(0)
    p_date.paragraph_format.space_after = Pt(6)
    r_date = p_date.add_run("Đồng Nai, Ngày 24 tháng 10 năm 2026\n")
    r_date.font.name = "Arial"; r_date.font.size = Pt(11); r_date.font.italic = True

    tbl_sign = doc.add_table(rows=3, cols=3)
    tbl_sign.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_no_borders(tbl_sign)

    sig_headers = [
        ("GIẢNG VIÊN HƯỚNG DẪN\n", "(Ký và ghi rõ họ tên)"),
        ("SINH VIÊN THỰC HIỆN 1\n", "(Ký và ghi rõ họ tên)"),
        ("SINH VIÊN THỰC HIỆN 2\n", "(Ký và ghi rõ họ tên)")
    ]

    for c_idx, (t_top, t_sub) in enumerate(sig_headers):
        c = tbl_sign.rows[0].cells[c_idx]
        c.width = Inches(2.3)
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r1 = p.add_run(t_top)
        r1.font.name = "Arial"; r1.font.size = Pt(11); r1.font.bold = True
        r1.font.color.rgb = RGBColor(31, 73, 125)
        r2 = p.add_run(t_sub)
        r2.font.name = "Arial"; r2.font.size = Pt(9.5); r2.font.italic = True

    # Row 1: Spacing for signature
    for c_idx in range(3):
        c = tbl_sign.rows[1].cells[c_idx]
        p = c.paragraphs[0]
        p.text = "\n\n\n\n"

    # Row 2: Names
    sig_names = [
        ("ThS. Lê Minh Nhật", "Giảng viên Hướng dẫn"),
        ("Đỗ Tấn Du", "MSSV: 123001364"),
        ("Đoàn Minh Quân", "MSSV: 123000946")
    ]
    for c_idx, (name, role) in enumerate(sig_names):
        c = tbl_sign.rows[2].cells[c_idx]
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r1 = p.add_run(f"{name}\n")
        r1.font.name = "Arial"; r1.font.size = Pt(11); r1.font.bold = True
        r2 = p.add_run(role)
        r2.font.name = "Arial"; r2.font.size = Pt(9.5); r2.font.italic = True

    # Save DOCX
    doc.save(output_docx_path)
    print(f"[DOCX BUILD] Hoàn tất tạo tài liệu báo cáo tổng hợp tại: {output_docx_path}")

if __name__ == "__main__":
    out_docx = r"Docs/BAO_CAO_TIEN_DO_HANG_TUAN_TONG_HOP_LE_MINH_NHAT.docx"
    build_master_weekly_report(out_docx)
    pdf_path = convert_docx_to_pdf(out_docx)
    print(f"[SUCCESS] File PDF tạo thành công tại: {pdf_path}")
