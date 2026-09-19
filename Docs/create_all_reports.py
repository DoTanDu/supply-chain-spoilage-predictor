# -*- coding: utf-8 -*-
import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="A0A0A0", sz="4", val="single"):
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

def add_boxed_paragraph(doc, content_paragraphs, bg_color="FAFAFA", border_color="B0B0B0"):
    """Tạo bảng 1 ô đóng khung giống hệt file đăng ký thuyết minh mẫu"""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    cell = tbl.rows[0].cells[0]
    cell.width = Inches(6.7)
    set_table_borders(tbl, color=border_color, sz="6")
    if bg_color:
        set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=100, bottom=100, left=140, right=140)

    # First paragraph in cell
    p_first = cell.paragraphs[0]
    first_data = content_paragraphs[0]
    fill_p_data(p_first, first_data)

    for data in content_paragraphs[1:]:
        p = cell.add_paragraph()
        fill_p_data(p, data)

    # Khoảng cách sau bảng
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_after = Pt(4)
    p_after.paragraph_format.space_before = Pt(0)

def fill_p_data(p, data):
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    if isinstance(data, str):
        r = p.add_run(data)
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)
    elif isinstance(data, (list, tuple)):
        for item in data:
            if isinstance(item, str):
                r = p.add_run(item)
                r.font.name = "Times New Roman"
                r.font.size = Pt(11)
            elif isinstance(item, (list, tuple)):
                text = str(item[0])
                bold = item[1] if len(item) > 1 and isinstance(item[1], (bool, type(None))) else False
                italic = item[2] if len(item) > 2 and isinstance(item[2], (bool, type(None))) else False
                color = item[3] if len(item) > 3 and not isinstance(item[3], (bool, type(None))) else None
                r = p.add_run(text)
                r.font.name = "Times New Roman"
                r.font.size = Pt(11)
                if bold is not None:
                    r.font.bold = bold
                if italic is not None:
                    r.font.italic = italic
                if color:
                    r.font.color.rgb = color

def add_heading(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.font.name = "Times New Roman"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0, 0, 0)
    return p

def format_grid_table(table, col_widths, headers, data, header_bg="EAECEE", alt_bg="F9FAFB"):
    set_table_borders(table, color="7F8C8D", sz="4")
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    # Header
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], header_bg)
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=100, right=100)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(10.5)
            r.font.bold = True
            r.font.color.rgb = RGBColor(20, 20, 20)

    # Data Rows
    for row_idx, row_data in enumerate(data):
        row_cells = table.add_row().cells
        bg_color = alt_bg if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            row_cells[col_idx].text = str(text)
            set_cell_background(row_cells[col_idx], bg_color)
            set_cell_margins(row_cells[col_idx], top=80, bottom=80, left=100, right=100)
            p = row_cells[col_idx].paragraphs[0]
            if col_idx in [0, 4] or len(str(text)) <= 6:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.name = "Times New Roman"
                r.font.size = Pt(10)
                r.font.color.rgb = RGBColor(30, 30, 30)

    for row in table.rows:
        for i, w in enumerate(col_widths):
            row.cells[i].width = Inches(w)

def add_signatures_block(doc, sign_date_str="Ngày 19 tháng 09 năm 2026"):
    """Bảng chữ ký chuẩn trang trọng của 3 người: GVHD, SV1 (Du), SV2 (Quân)"""
    # Dòng ngày tháng căn phải
    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_date.paragraph_format.space_before = Pt(14)
    p_date.paragraph_format.space_after = Pt(4)
    r_date = p_date.add_run(f"Đồng Nai, {sign_date_str}")
    r_date.font.name = "Times New Roman"
    r_date.font.size = Pt(11)
    r_date.font.italic = True

    # Tạo bảng 3 cột viền ẩn
    sig_tbl = doc.add_table(rows=2, cols=3)
    sig_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_tbl.autofit = False
    set_table_no_borders(sig_tbl)

    col_widths = [2.25, 2.25, 2.2]
    headers_sig = [
        [("GIẢNG VIÊN HƯỚNG DẪN", True), ("\n(Ký và ghi rõ họ tên)", False, True)],
        [("SINH VIÊN THỰC HIỆN", True), ("\n(Ký và ghi rõ họ tên)", False, True)],
        [("SINH VIÊN THỰC HIỆN", True), ("\n(Ký và ghi rõ họ tên)", False, True)]
    ]

    # Row 0: Chức danh
    for i, h_cell in enumerate(sig_tbl.rows[0].cells):
        h_cell.width = Inches(col_widths[i])
        p = h_cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(2)
        for item in headers_sig[i]:
            text = item[0]
            bold = item[1]
            italic = item[2] if len(item) > 2 else False
            r = p.add_run(text)
            r.font.name = "Times New Roman"
            r.font.size = Pt(11)
            r.font.bold = bold
            r.font.italic = italic

    # Row 1: Khoảng trống ký tên & Họ tên
    names = [
        [("\n\n\n\n", False), ("ThS. Lê Minh Nhật", True)],
        [("\n\n\n\n", False), ("Đỗ Tấn Du", True), ("\nMSSV: 123001364", False)],
        [("\n\n\n\n", False), ("Đoàn Minh Quân", True), ("\nMSSV: 123000946", False)]
    ]

    for i, n_cell in enumerate(sig_tbl.rows[1].cells):
        n_cell.width = Inches(col_widths[i])
        p = n_cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(6)
        for item in names[i]:
            text = item[0]
            bold = item[1]
            r = p.add_run(text)
            r.font.name = "Times New Roman"
            r.font.size = Pt(11)
            r.font.bold = bold

def create_base_document():
    doc = Document()
    for section in doc.sections:
        section.top_margin = Inches(0.79)
        section.bottom_margin = Inches(0.79)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(0.79)
    return doc

def add_header_block(doc, week_num, date_str):
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_after = Pt(2)
    r1 = p_inst.add_run("TRƯỜNG ĐẠI HỌC LẠC HỒNG\nKHOA CÔNG NGHỆ THÔNG TIN")
    r1.font.name = "Times New Roman"
    r1.font.size = Pt(11)
    r1.font.bold = True

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(6)
    p_title.paragraph_format.space_after = Pt(2)
    r_t = p_title.add_run(f"BÁO CÁO TIẾN ĐỘ THỰC HIỆN ĐỀ TÀI (TUẦN {week_num})")
    r_t.font.name = "Times New Roman"
    r_t.font.size = Pt(14)
    r_t.font.bold = True

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(2)
    r_s = p_sub.add_run("Học phần: Phát triển ứng dụng\nThời gian: " + date_str)
    r_s.font.name = "Times New Roman"
    r_s.font.size = Pt(11)
    r_s.font.italic = True

    p_div = doc.add_paragraph()
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_div.paragraph_format.space_after = Pt(8)
    r_div = p_div.add_run("— OoO —")
    r_div.font.name = "Times New Roman"
    r_div.font.size = Pt(11)

def add_common_info_sections(doc):
    # 1. Thông tin sinh viên
    add_heading(doc, "1.  Thông tin sinh viên")
    add_boxed_paragraph(doc, [
        [("MSSV (Đại diện) : ", True), ("123001364            ", False), ("Họ và tên (Đại diện) : ", True), ("Đỗ Tấn Du", False)],
        [("Danh sách sinh viên trong nhóm:", True)],
        [("1. Đỗ Tấn Du          - MSSV: 123001364       - Email: 123001364@lhu.edu.vn", False)],
        [("2. Đoàn Minh Quân - MSSV: 123000946       - Email: 123000946@lhu.edu.vn", False)]
    ])

    # 2. Thông tin giáo viên hướng dẫn
    add_heading(doc, "2.  Thông tin giáo viên hướng dẫn")
    add_boxed_paragraph(doc, [
        [("Họ và tên GV: ", True), ("ThS. Lê Minh Nhật", False)],
        [("Điện thoại: ", True), ("0389571228          ", False), ("Email: ", True), ("nhatlm@lhu.edu.vn", False)]
    ])

    # 3. Tên đề tài
    add_heading(doc, "3.  Tên dự án/ đề tài thực hiện trong học phần")
    add_boxed_paragraph(doc, [
        [("Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor)", True)]
    ])


# ==============================================================================
# BÁO CÁO TUẦN 1 (24/08/2026 – 30/08/2026)
# ==============================================================================
def build_report_week_1():
    doc = create_base_document()
    add_header_block(doc, "1", "24/08/2026 – 30/08/2026")
    add_common_info_sections(doc)

    # 4. Mục tiêu
    add_heading(doc, "4.  Mục tiêu đặt ra trong tuần (Khớp STT 1 Kế hoạch đề tài)")
    add_boxed_paragraph(doc, [
        [("Mục tiêu tuần 1: ", True), ("Khảo sát nhu cầu thực tế và thu thập các yêu cầu nghiệp vụ về quản trị chuỗi cung ứng chống lãng phí trong bán lẻ.")],
        [("- Khảo sát thực trạng quy trình quản lý hạn sử dụng, hàng cận date tại các chuỗi siêu thị/cửa hàng tiện lợi (Bách Hóa Xanh, WinMart, GS25).")],
        [("- Xác định bài toán cốt lõi: Tình trạng nhập dư dẫn đến hư hỏng phải tiêu hủy và nhập thiếu làm đứt gãy doanh thu.")],
        [("- Xác định đối tượng sử dụng hệ thống và định hình phạm vi đề tài phù hợp với thời lượng học phần.")]
    ])

    # 5. Nội dung công việc
    add_heading(doc, "5.  Nội dung công việc và kết quả thực hiện")
    tbl = doc.add_table(rows=1, cols=5)
    headers = ["STT", "Nội Dung Công Việc", "Người Thực Hiện", "Sản Phẩm Đạt Được", "Tiến Độ"]
    data = [
        ["1", "Khảo sát thực trạng quản lý hạn sử dụng và xử lý hàng hỏng tại các đơn vị bán lẻ thực phẩm.", "Đỗ Tấn Du", "Bản ghi nhận thực trạng nghiệp vụ bán lẻ thực tế.", "100%"],
        ["2", "Thu thập và tổng hợp các yêu cầu nghiệp vụ về chống lãng phí, cảnh báo sớm nguy cơ hư hỏng.", "Đoàn Minh Quân", "Bản tổng hợp yêu cầu bài toán Spoilage Predictor.", "100%"],
        ["3", "Xác định các vai trò người dùng (Cửa hàng trưởng, Nhân viên bán hàng/kho) và luồng hoạt động chính.", "Đỗ Tấn Du", "Bảng phân tích vai trò người dùng và phạm vi hệ thống.", "100%"],
        ["4", "Hoàn thiện đề cương chi tiết và hồ sơ đăng ký thuyết minh đề tài nộp Khoa CNTT & GVHD.", "Cả nhóm", "File đăng ký thuyết minh hoàn chỉnh nộp GVHD phê duyệt.", "100%"]
    ]
    format_grid_table(tbl, [0.45, 2.55, 1.2, 1.9, 0.65], headers, data)

    # 6. Khó khăn & Giải pháp
    add_heading(doc, "6.  Khó khăn, vướng mắc và giải pháp xử lý")
    add_boxed_paragraph(doc, [
        [("Khó khăn: ", True), ("Phạm vi chuỗi cung ứng ban đầu nhóm tiếp cận quá rộng (bao gồm sản xuất, vận tải liên tỉnh, kho tổng trung chuyển và các thủ tục hoàn trả nhà cung cấp phức tạp), dễ dẫn đến quá tải khối lượng.")],
        [("Giải pháp: ", True), ("Thảo luận và xin ý kiến định hướng từ GVHD ThS. Lê Minh Nhật để khoanh vùng trọng tâm vào mắt xích Cửa hàng bán lẻ (Retail Store) – nơi trực tiếp tiếp xúc người tiêu dùng và chịu tỷ lệ hao hụt hạn dùng cao nhất.")]
    ])

    # 7. Kế hoạch tuần tới
    add_heading(doc, "7.  Kế hoạch thực hiện tuần tiếp theo (31/08/2026 – 06/09/2026)")
    add_boxed_paragraph(doc, [
        [("Theo đúng Kế hoạch thực hiện (mục STT 2 & 3), nhóm phân công tuần 2:")],
        [("- ", False), ("Đoàn Minh Quân: ", True), ("Phân tích nghiệp vụ quản lý kho cửa hàng, theo dõi hạn sử dụng theo lô và quy trình trừ tồn kho bán hàng theo nguyên tắc FEFO.")],
        [("- ", False), ("Đỗ Tấn Du: ", True), ("Phân tích các yếu tố ngoại cảnh tác động đến sức mua (thời tiết, ngày lễ, mùa vụ) và chuẩn hóa danh mục yêu cầu hệ thống.")]
    ])

    # 8. Đánh giá & Chữ ký
    add_heading(doc, "8.  Đánh giá và xác nhận của các bên")
    add_boxed_paragraph(doc, [
        [("Tự đánh giá tiến độ: ", True), ("Hoàn thành 100% mục tiêu đề ra cho Tuần 1. Đề tài đã được GVHD phê duyệt hướng đi và thống nhất kế hoạch triển khai.")]
    ])
    add_signatures_block(doc, "Ngày 30 tháng 08 năm 2026")

    path = r"c:\thuyet minh\Docs\BAO_CAO_TIEN_DO_TUAN_1.docx"
    doc.save(path)
    print(f"Generated: {path}")


# ==============================================================================
# BÁO CÁO TUẦN 2 (31/08/2026 – 06/09/2026)
# ==============================================================================
def build_report_week_2():
    doc = create_base_document()
    add_header_block(doc, "2", "31/08/2026 – 06/09/2026")
    add_common_info_sections(doc)

    # 4. Mục tiêu
    add_heading(doc, "4.  Mục tiêu đặt ra trong tuần (Khớp STT 2 & 3 Kế hoạch đề tài)")
    add_boxed_paragraph(doc, [
        [("Mục tiêu tuần 2: ", True), ("Phân tích sâu quy trình quản lý kho bán lẻ và các yếu tố ảnh hưởng tiêu thụ.")],
        [("- Phân tích chi tiết quy trình nhập lô hàng từ Kho tổng DC và theo dõi ngày hết hạn (Expiry Date).")],
        [("- Phân tích cơ chế xuất kho bán hàng tự động trừ theo nguyên tắc FEFO (First Expired, First Out).")],
        [("- Thiết lập bảng hệ số tác động tiêu thụ K (thời tiết nắng/mưa, ngày lễ/cuối tuần) làm cơ sở cho dự báo nhu cầu.")],
        [("- Chuẩn hóa 8 yêu cầu chức năng (FR1-FR8) và 4 yêu cầu phi chức năng (NFR1-NFR4).")]
    ])

    # 5. Nội dung công việc
    add_heading(doc, "5.  Nội dung công việc và kết quả thực hiện")
    tbl = doc.add_table(rows=1, cols=5)
    headers = ["STT", "Nội Dung Công Việc", "Người Thực Hiện", "Sản Phẩm Đạt Được", "Tiến Độ"]
    data = [
        ["1", "Phân tích quy trình quản lý hạn sử dụng theo lô hàng (Batch Tracking) và thuật toán trừ kho ưu tiên FEFO.", "Đoàn Minh Quân", "Tài liệu đặc tả luồng xuất kho bán lẻ chuẩn FEFO.", "100%"],
        ["2", "Xây dựng bảng hệ số tác động K theo điều kiện thời tiết (Nắng/Mưa) và ngày Lễ/Cuối tuần.", "Đỗ Tấn Du", "Bảng tham số hệ số tiêu thụ phục vụ giải thuật dự báo.", "100%"],
        ["3", "Chuẩn hóa chi tiết 8 yêu cầu chức năng (FR1-FR8) và 4 yêu cầu phi chức năng (NFR1-NFR4).", "Đỗ Tấn Du\nĐoàn Minh Quân", "Bản đặc tả yêu cầu phần mềm chi tiết (SRS sơ bộ).", "100%"],
        ["4", "Phác thảo sơ bộ luồng dữ liệu nghiệp vụ và các thực thể dữ liệu cốt lõi của hệ thống.", "Đoàn Minh Quân", "Sơ đồ luồng nghiệp vụ sơ bộ kết nối giữa Shop và DC.", "100%"]
    ]
    format_grid_table(tbl, [0.45, 2.55, 1.2, 1.9, 0.65], headers, data)

    # 6. Khó khăn & Giải pháp
    add_heading(doc, "6.  Khó khăn, vướng mắc và giải pháp xử lý")
    add_boxed_paragraph(doc, [
        [("Khó khăn: ", True), ("Việc lượng hóa tác động của thời tiết (trời mưa) lên sức mua là không giống nhau giữa các nhóm hàng (Ví dụ: trời mưa làm giảm tiêu thụ nước giải khát nhưng lại làm tăng sức mua mì ăn liền, thực phẩm chế biến nhanh).")],
        [("Giải pháp: ", True), ("Nhóm đã phân loại hệ số K theo từng danh mục hàng hóa cụ thể (Hàng tươi sống, Thực phẩm khô, Đồ uống), giúp giải thuật dự báo phản ánh đúng thực tế hành vi mua sắm.")]
    ])

    # 7. Kế hoạch tuần tới
    add_heading(doc, "7.  Kế hoạch thực hiện tuần tiếp theo (07/09/2026 – 20/09/2026)")
    add_boxed_paragraph(doc, [
        [("Theo đúng Kế hoạch thực hiện (mục STT 4 & 5 - giai đoạn 2 tuần), nhóm phân công:")],
        [("- ", False), ("Đoàn Minh Quân: ", True), ("Thiết kế cơ sở dữ liệu quan hệ (ERD, các bảng lưu trữ sản phẩm, lô hàng, bán hàng, tiêu hủy) và sơ đồ luồng dữ liệu DFD.")],
        [("- ", False), ("Đỗ Tấn Du: ", True), ("Thiết kế bộ sơ đồ Use Case, phác thảo giao diện UI/UX (Dashboard chuỗi cung ứng, màn hình theo dõi hạn dùng) và chuẩn hóa kiến trúc 3 tầng.")]
    ])

    # 8. Đánh giá & Chữ ký
    add_heading(doc, "8.  Đánh giá và xác nhận của các bên")
    add_boxed_paragraph(doc, [
        [("Tự đánh giá tiến độ: ", True), ("Hoàn thành 100% mục tiêu Tuần 2. Nghiệp vụ bán lẻ và mô hình toán học đã được làm rõ hoàn toàn, tạo tiền đề vững chắc cho khâu thiết kế hệ thống.")]
    ])
    add_signatures_block(doc, "Ngày 06 tháng 09 năm 2026")

    path = r"c:\thuyet minh\Docs\BAO_CAO_TIEN_DO_TUAN_2.docx"
    doc.save(path)
    print(f"Generated: {path}")


# ==============================================================================
# BÁO CÁO TUẦN 3 (07/09/2026 – 20/09/2026 - GIAI ĐOẠN THIẾT KẾ CSDL & SƠ ĐỒ)
# ==============================================================================
def build_report_week_3():
    doc = create_base_document()
    add_header_block(doc, "3", "07/09/2026 – 20/09/2026")
    add_common_info_sections(doc)

    # 4. Mục tiêu
    add_heading(doc, "4.  Mục tiêu đặt ra trong tuần (Khớp STT 4 & 5 Kế hoạch đề tài)")
    add_boxed_paragraph(doc, [
        [("Mục tiêu tuần 3: ", True), ("Hoàn thiện thiết kế Cơ sở dữ liệu, bộ sơ đồ hệ thống và cấu trúc mã nguồn.")],
        [("- Tinh gọn mô hình hệ thống theo lời dặn của GVHD ThS. Lê Minh Nhật: Bán hàng ra = Xuất kho (Sales Out); bỏ luân chuyển ngang và trả hàng lỗi rườm rà.")],
        [("- Chuẩn hóa 3 ngưỡng an toàn khoa học: Ngưỡng cận date theo % Vòng đời còn lại (RSL), Ngưỡng tồn kho tối thiểu (ROP = d*L + SS) và Ngưỡng rủi ro hư hỏng (DOS > DUE).")],
        [("- Thiết kế hoàn chỉnh bộ Sơ đồ Use Case (phân quyền Quản lý/Nhân viên) và Sơ đồ DFD Mức 0, Mức 1 (5 tiến trình, 3 kho dữ liệu).")],
        [("- Xây dựng và nạp CSDL Microsoft SQL Server (12 bảng chuẩn 3NF, 4 Views tính hạn dùng & gợi ý nhập hàng động, Stored Procedures FEFO, Triggers).")],
        [("- Viết script kiểm thử CSDL tự động bằng Python; khởi tạo Git và đưa mã nguồn lên GitHub.")]
    ])

    # 5. Nội dung công việc
    add_heading(doc, "5.  Nội dung công việc và kết quả thực hiện")
    tbl = doc.add_table(rows=1, cols=5)
    headers = ["STT", "Nội Dung Công Việc", "Người Thực Hiện", "Sản Phẩm Đạt Được", "Tiến Độ"]
    data = [
        [
            "1",
            "Phân tích & tinh gọn quy trình bán lẻ theo dặn dò của GVHD. Chuẩn hóa 8 yêu cầu chức năng (FR), 4 phi chức năng (NFR) và 3 ngưỡng an toàn (RSL, ROP, Spoilage Risk).",
            "Đỗ Tấn Du\nĐoàn Minh Quân",
            "Tài liệu thuyết minh hoàn chỉnh: Docs/BAO_CAO_NGHIEP_VU_VA_KIEN_TRUC_NOP_THAY.docx",
            "100%"
        ],
        [
            "2",
            "Thiết kế Sơ đồ Use Case (9 chức năng) và Sơ đồ luồng dữ liệu DFD Mức 0 (Context), DFD Mức 1 (5 tiến trình, 3 kho dữ liệu cốt lõi).",
            "Đỗ Tấn Du",
            "Bộ ảnh sơ đồ hoàn chỉnh tại Docs/Diagram_Images/ (use_case.png, dfd_0.png, dfd_1.png)",
            "100%"
        ],
        [
            "3",
            "Hiện thực hóa CSDL Microsoft SQL Server (T-SQL): 12 bảng 3NF, 4 Views cảnh báo hạn & gợi ý nhập, Stored Procedures trừ kho FEFO, Function & Trigger tự động.",
            "Đoàn Minh Quân\nĐỗ Tấn Du",
            "File kịch bản Database/retail_spoilage_database.sql nạp thành công vào SSMS LocalDB",
            "100%"
        ],
        [
            "4",
            "Viết kịch bản kiểm thử CSDL tự động bằng Python, kiểm tra chính xác tính toàn vẹn dữ liệu, logic cảnh báo cận date và cơ chế xuất kho FEFO.",
            "Đỗ Tấn Du",
            "File Database/test_database_runner.py chạy pass 100% các ca kiểm thử",
            "100%"
        ],
        [
            "5",
            "Tổ chức cấu trúc dự án chuẩn modular (Docs, Database, Sample_Data, Backend, Frontend). Khởi tạo Git repository và đẩy lên GitHub.",
            "Đỗ Tấn Du",
            "Repo GitHub hoạt động: https://github.com/DoTanDu/supply-chain-spoilage-predictor",
            "100%"
        ]
    ]
    format_grid_table(tbl, [0.45, 2.55, 1.2, 1.9, 0.65], headers, data)

    # 6. Khó khăn & Giải pháp
    add_heading(doc, "6.  Khó khăn, vướng mắc và giải pháp xử lý")
    add_boxed_paragraph(doc, [
        [("Lệch bảng mã Tiếng Việt trên SQL Server: ", True), ("Khi nạp ban đầu bị lỗi hiển thị font dấu tiếng Việt trong SSMS. Nhóm đã xử lý triệt để bằng cách chuyển mã nguồn T-SQL sang UTF-8 with BOM (utf-8-sig) và khai báo tiền tố N'...' cho toàn bộ chuỗi Unicode.")],
        [("Cấu hình dịch vụ máy chủ SQL Server: ", True), ("Dịch vụ MSSQL$SQLEXPRESS bị lỗi đường dẫn tệp hệ thống trên máy local. Nhóm đã chuyển hướng cấu hình kết nối trực tiếp vào Microsoft SQL Server LocalDB ((localdb)\\mssqllocaldb) sẵn có, đảm bảo cả 2 thành viên đều thao tác thuận tiện trên SSMS.")],
        [("Đồng bộ môi trường làm việc nhóm: ", True), ("Để đảm bảo bạn Quân tải về máy là chạy được ngay, nhóm đã đóng gói tài liệu HUONG_DAN_DATABASE.md chi tiết từng bước kết nối SSMS và chia sẻ quyền cộng tác trên GitHub.")]
    ])

    # 7. Kế hoạch tuần tới
    add_heading(doc, "7.  Kế hoạch thực hiện tuần tiếp theo (21/09/2026 – 27/09/2026)")
    add_boxed_paragraph(doc, [
        [("Theo đúng Kế hoạch thực hiện (bắt đầu giai đoạn STT 6 & 7 từ 21/09 đến 18/10), nhóm phân công:")],
        [("- ", False), ("Đỗ Tấn Du (Frontend): ", True), ("Khởi tạo dự án React (Vite) + TailwindCSS trong thư mục Frontend/; xây dựng Layout Dashboard tổng thể (Sidebar, Header, Alert Badge); dựng màn hình Quản lý Lô hàng & Bảng cảnh báo hạn sử dụng (FEFO).")],
        [("- ", False), ("Đoàn Minh Quân (Backend): ", True), ("Khởi tạo dự án Backend API trong thư mục Backend/; cấu hình kết nối CSDL SQL Server LocalDB; viết các RESTful API xác thực người dùng (JWT) và API danh mục sản phẩm, nhập lô hàng.")]
    ])

    # 8. Đánh giá & Chữ ký
    add_heading(doc, "8.  Đánh giá và xác nhận của các bên")
    add_boxed_paragraph(doc, [
        [("Tự đánh giá tiến độ: ", True), ("Tiến độ đạt 100% mục tiêu giai đoạn Thiết kế & Khảo sát (STT 4 & 5 trong bảng Kế hoạch đề tài). Toàn bộ nền tảng nghiệp vụ, tài liệu học thuật, sơ đồ hệ thống và Cơ sở dữ liệu đã hoàn tất, sẵn sàng 100% bước vào giai đoạn lập trình mã nguồn.")]
    ])
    add_signatures_block(doc, "Ngày 19 tháng 09 năm 2026")

    path = r"c:\thuyet minh\Docs\BAO_CAO_TIEN_DO_TUAN_3.docx"
    doc.save(path)
    print(f"Generated: {path}")

    # Tạo thêm bản Tuần 4 với cùng nội dung chuẩn chỉ
    path4 = r"c:\thuyet minh\Docs\BAO_CAO_TIEN_DO_TUAN_4.docx"
    doc4 = create_base_document()
    add_header_block(doc4, "4", "14/09/2026 – 20/09/2026")
    add_common_info_sections(doc4)
    # 4. Mục tiêu
    add_heading(doc4, "4.  Mục tiêu đặt ra trong tuần (Hoàn thiện giai đoạn CSDL & Sơ đồ)")
    add_boxed_paragraph(doc4, [
        [("Mục tiêu tuần 4: ", True), ("Hoàn tất cài đặt CSDL thực tế trên máy chủ, kiểm thử tự động, tích hợp Git và chuẩn bị mã nguồn.")],
        [("- Tinh gọn CSDL theo góp ý của GVHD ThS. Lê Minh Nhật, tập trung vào luồng bán lẻ và 3 ngưỡng an toàn.")],
        [("- Nạp toàn bộ 12 bảng, 4 Views cảnh báo hạn dùng và Stored Procedure FEFO vào Microsoft SQL Server LocalDB.")],
        [("- Viết bộ test runner tự động bằng Python kiểm thử toàn bộ ràng buộc và views.")],
        [("- Đẩy toàn bộ cấu trúc dự án lên GitHub và kết nối thành viên nhóm.")]
    ])
    add_heading(doc4, "5.  Nội dung công việc và kết quả thực hiện")
    tbl4 = doc4.add_table(rows=1, cols=5)
    format_grid_table(tbl4, [0.45, 2.55, 1.2, 1.9, 0.65], headers, data)
    add_heading(doc4, "6.  Khó khăn, vướng mắc và giải pháp xử lý")
    add_boxed_paragraph(doc4, [
        [("Lệch bảng mã Tiếng Việt trên SQL Server: ", True), ("Đã xử lý bằng UTF-8 with BOM và N'...'.")],
        [("Cấu hình dịch vụ máy chủ SQL Server: ", True), ("Kết nối ổn định trên (localdb)\\mssqllocaldb sẵn có.")],
        [("Đồng bộ môi trường làm việc nhóm: ", True), ("Tạo tài liệu HUONG_DAN_DATABASE.md và đồng bộ qua GitHub.")]
    ])
    add_heading(doc4, "7.  Kế hoạch thực hiện tuần tiếp theo (21/09/2026 – 27/09/2026)")
    add_boxed_paragraph(doc4, [
        [("Bắt đầu giai đoạn STT 6 & 7: Lập trình Backend (Quân) & Frontend Dashboard (Du).")]
    ])
    add_heading(doc4, "8.  Đánh giá và xác nhận của các bên")
    add_boxed_paragraph(doc4, [
        [("Tự đánh giá tiến độ: ", True), ("Hoàn thành 100% mục tiêu Tuần 4. Sẵn sàng lập trình mã nguồn.")]
    ])
    add_signatures_block(doc4, "Ngày 19 tháng 09 năm 2026")
    doc4.save(path4)
    print(f"Generated: {path4}")

def main():
    build_report_week_1()
    build_report_week_2()
    build_report_week_3()

if __name__ == "__main__":
    main()
