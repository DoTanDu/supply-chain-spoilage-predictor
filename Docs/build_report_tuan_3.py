# -*- coding: utf-8 -*-
"""
Script tạo Báo cáo Tiến độ Tuần 3 gặp GVHD chuẩn theo mẫu chính thức của Khoa/Trường LHU
File mẫu gốc: Docs/2024-07-Mẫu báo cáo gặp GVHD hàng tuần.docx
Tuân thủ đầy đủ quy định:
- Thông tin chung: MSSV, Họ tên, Lớp, GVHD ThS. Lê Minh Nhật, Tên đề tài
- Báo cáo nội dung chi tiết: Việc đã làm trong tuần, việc dự kiến tuần tiếp theo
- Khung xác nhận và chữ ký 3 bên (GVHD + 2 Sinh viên)
- Khung hình ảnh xác nhận làm việc với GVHD (chụp ảnh nhóm / màn hình họp online kèm tên và ngày tháng)
- Hình ảnh minh chứng sản phẩm kỹ thuật đã đạt được (Use Case, DFD 0, DFD 1)
- Xuất bản DOCX và chuyển đổi sang PDF theo quy cách tên file: MSSV_HoVaTenSinhVien_Tuanxx__HoVaTenGiaoVien.pdf
"""

import os
import docx
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

def set_table_borders(table, color="B0C4DE", sz="6", val="single"):
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

def build_report(template_path, mssv_primary, name_primary, output_docx, is_group=False):
    doc = Document(template_path)

    # 1. P2: BÁO CÁO TIẾN ĐỘ TUẦN 03
    p2 = doc.paragraphs[2]
    p2.text = ""
    r1 = p2.add_run("BÁO CÁO TIẾN ĐỘ TUẦN ")
    r1.font.name = "Arial"
    r1.font.size = Pt(16)
    r1.font.bold = True
    r2 = p2.add_run("03")
    r2.font.name = "Arial"
    r2.font.size = Pt(16)
    r2.font.bold = True
    r2.font.color.rgb = RGBColor(255, 0, 0)

    # P3: Thời gian
    p3 = doc.paragraphs[3]
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3.text = ""
    r3 = p3.add_run("(Thời gian: 07/09/2026 – 13/09/2026)")
    r3.font.name = "Arial"
    r3.font.size = Pt(11)
    r3.font.italic = True

    # 2. Thông tin chung
    # P5: MSSV
    p5 = doc.paragraphs[5]
    p5.text = ""
    r = p5.add_run("MSSV:\t")
    r.font.name = "Arial"; r.font.size = Pt(11); r.font.bold = True
    if is_group:
        r = p5.add_run("123001364, 123000946")
    else:
        r = p5.add_run(f"{mssv_primary} (Nhóm: 123001364 - Đỗ Tấn Du, 123000946 - Đoàn Minh Quân)")
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
    tasks_done = [
        ("Tiếp thu & tinh gọn nghiệp vụ theo chỉ đạo của GVHD ThS. Lê Minh Nhật: ", 
         "Khoanh vùng trọng tâm vào mô hình Bán lẻ Retail Store tinh gọn (Kho tổng DC -> Cửa hàng -> Khách hàng); xác định cơ chế xuất kho chính là Bán hàng ra (Sales Out) cho khách theo nguyên tắc FEFO (First Expired, First Out - Lô nào cận date thì ưu tiên xuất trừ trước); loại bỏ triệt để các quy trình thừa, cồng kềnh (luân chuyển ngang giữa các shop, thủ tục trả hàng NCC phức tạp)."),
        ("Chuẩn hóa bộ công thức định lượng & 3 ngưỡng an toàn cốt lõi: ", 
         "1) Ngưỡng cảnh báo cận date theo % Vòng đời còn lại (RSL: Vàng <= 20%, Đỏ <= 10%, Tím <= 0 ngày - khóa bán tự động); 2) Ngưỡng tồn kho tối thiểu theo mô hình ROP = d*L + SS để đề xuất nhập hàng từ kho tổng DC; 3) Ngưỡng nguy cơ lãng phí Spoilage Risk (khi chỉ số RSI = CurrentStock / (ADS * DaysLeft) > 1.0 hoặc DOS > DUE: cảnh báo tồn kho vượt quá tốc độ tiêu thụ, lập tức đề xuất giảm giá đẩy hàng). Bổ sung hệ số thời tiết (K_weather) và ngày lễ (K_holiday)."),
        ("Thiết kế hoàn thiện Sơ đồ Use Case tổng thể hệ thống: ", 
         "Xây dựng hoàn chỉnh Sơ đồ Use Case gồm 6 phân hệ nghiệp vụ tác nghiệp khép kín, phân định rõ ràng quyền hạn giữa 2 tác nhân Store Manager (Quản lý cửa hàng) và Store Staff (Nhân viên bán hàng/kho)."),
        ("Thiết kế Sơ đồ luồng dữ liệu DFD Mức 0 (Context) và DFD Mức 1: ", 
         "Hoàn thành Sơ đồ ngữ cảnh DFD Mức 0 và phân rã DFD Mức 1 thể hiện rõ 5 tiến trình nghiệp vụ cốt lõi: 1.0 Nhập hàng theo lô từ DC, 2.0 Bán hàng & Trừ kho FEFO, 3.0 Quét HSD & Bắn cảnh báo Spoilage, 4.0 Dự báo nhu cầu & Gợi ý nhập hàng, 5.0 Tiêu hủy hàng hỏng cùng 3 kho dữ liệu cốt lõi (Sản phẩm & Lô hàng, Lịch sử bán hàng, Nhật ký lãng phí)."),
        ("Thiết kế Cơ sở dữ liệu quan hệ chuẩn 3NF: ", 
         "Xây dựng thiết kế dữ liệu chuẩn hóa gồm 12 bảng thực thể liên kết chặt chẽ (users, categories, suppliers, products, batches, goods_receipts, sales_history, spoilage_records,...), đáp ứng đầy đủ nguyên tắc không cho phép tồn kho âm và kiểm soát hạn sử dụng từng lô hàng.")
    ]

    tasks_next = [
        ("Cài đặt CSDL Microsoft SQL Server & Kịch bản T-SQL: ", 
         "Khởi tạo database retail_spoilage_db, nạp kịch bản 12 bảng, tạo các Views cảnh báo cận date, Stored Procedures xuất kho FEFO và Trigger ghi nhận hao hụt tự động trên SSMS."),
        ("Kiểm thử tự động logic CSDL bằng Python: ", 
         "Viết kịch bản test runner (test_database_runner.py) để kiểm tra tính toàn vẹn khóa ngoại, thuật toán trừ kho FEFO và công thức cảnh báo lãng phí."),
        ("Khởi tạo khung kiến trúc Clean Architecture & Phân công phát triển: ", 
         "Tổ chức thư mục dự án modular, khởi tạo Git/GitHub; Đỗ Tấn Du phụ trách Frontend Dashboard & UI FEFO; Đoàn Minh Quân phụ trách Backend RESTful API & Database Service.")
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

    # Xóa các đoạn thừa P20 - P25
    for p_idx in [20, 21, 22, 23, 24, 25]:
        paras[p_idx].text = ""

    # Dòng ngày tháng
    p23 = paras[23]
    p23.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p23.paragraph_format.space_before = Pt(12)
    p23.paragraph_format.space_after = Pt(4)
    r_d = p23.add_run("Đồng Nai, Ngày 12 tháng 09 năm 2026")
    r_d.font.name = "Arial"
    r_d.font.size = Pt(11)
    r_d.font.italic = True

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
        [("\n\n\n\n", False), ("Đỗ Tấn Du", True), ("\nMSSV: 123001364", False)],
        [("\n\n\n\n", False), ("Đoàn Minh Quân", True), ("\nMSSV: 123000946", False)]
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

    # 4. MỤC HÌNH ẢNH MINH CHỨNG
    p26 = paras[26]
    p26.paragraph_format.space_before = Pt(18)
    p26.paragraph_format.space_after = Pt(6)
    p26.text = "Hình ảnh minh chứng báo cáo tuần 03:"
    for r in p26.runs:
        r.font.name = "Arial"; r.font.size = Pt(12); r.font.bold = True

    # -------------------------------------------------------------------------
    # A. KHUNG DÀNH CHO HÌNH ẢNH XÁC NHẬN GẶP GVHD (THEO YÊU CẦU CỦA TRƯỜNG)
    # -------------------------------------------------------------------------
    p_box_intro = doc.add_paragraph()
    p_box_intro.paragraph_format.space_before = Pt(6)
    p_box_intro.paragraph_format.space_after = Pt(4)
    r = p_box_intro.add_run("A. HÌNH ẢNH XÁC NHẬN LÀM VIỆC / HỌP VỚI GIẢNG VIÊN HƯỚNG DẪN:")
    r.font.name = "Arial"; r.font.size = Pt(11); r.font.bold = True
    r.font.color.rgb = RGBColor(31, 73, 125)

    # Tạo Khung Bordered Box đẹp mắt để dán ảnh xác nhận
    meeting_box = doc.add_table(rows=1, cols=1)
    meeting_box.alignment = WD_TABLE_ALIGNMENT.CENTER
    meeting_box.autofit = False
    set_table_borders(meeting_box, color="1F497D", sz="8", val="single")
    c_meet = meeting_box.rows[0].cells[0]
    c_meet.width = Inches(6.5)
    set_cell_background(c_meet, "F8FAFC")
    set_cell_margins(c_meet, top=200, bottom=200, left=240, right=240)

    p_box = c_meet.paragraphs[0]
    p_box.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_icon = p_box.add_run("[ KHUNG ĐẶT ẢNH MINH CHỨNG GẶP GVHD ]\n\n")
    r_icon.font.name = "Arial"; r_icon.font.size = Pt(11.5); r_icon.font.bold = True
    r_icon.font.color.rgb = RGBColor(31, 73, 125)

    r_guide = p_box.add_run(
        "📌 QUY ĐỊNH VỀ HÌNH ẢNH XÁC NHẬN LÀM VIỆC HÀNG TUẦN:\n"
        "• Ảnh chụp đầy đủ các thành viên trong nhóm và Giảng viên hướng dẫn.\n"
        "• Nếu họp Online (Google Meet, MS Teams, Zoom): Bắt buộc ảnh chụp màn hình hiển thị rõ mặt các thành viên, họ tên và ngày tháng buổi làm việc.\n"
        "• Buổi làm việc Tuần 03: ThS. Lê Minh Nhật cùng 2 sinh viên Đỗ Tấn Du & Đoàn Minh Quân.\n\n"
        "(Dán ảnh chụp minh chứng buổi họp của nhóm vào khung này trước khi in / nộp PDF)"
    )
    r_guide.font.name = "Arial"; r_guide.font.size = Pt(9.5); r_guide.font.italic = True
    r_guide.font.color.rgb = RGBColor(70, 70, 70)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # -------------------------------------------------------------------------
    # B. HÌNH ẢNH MINH CHỨNG KẾT QUẢ KỸ THUẬT ĐÃ HOÀN THÀNH TRONG TUẦN 3
    # -------------------------------------------------------------------------
    p_prod_intro = doc.add_paragraph()
    p_prod_intro.paragraph_format.space_before = Pt(8)
    p_prod_intro.paragraph_format.space_after = Pt(4)
    r = p_prod_intro.add_run("B. MINH CHỨNG SẢN PHẨM THIẾT KẾ KỸ THUẬT ĐÃ THỰC HIỆN:")
    r.font.name = "Arial"; r.font.size = Pt(11); r.font.bold = True
    r.font.color.rgb = RGBColor(31, 73, 125)

    # Ảnh 1: Use Case
    img_usecase = r"e:\supply-chain-spoilage-predictor\Docs\Diagram_Images\use_case.png"
    if os.path.exists(img_usecase):
        p_t1 = doc.add_paragraph()
        p_t1.paragraph_format.space_before = Pt(6); p_t1.paragraph_format.space_after = Pt(3)
        r = p_t1.add_run("1. Sơ đồ Use Case tổng thể hệ thống (Phân quyền Store Manager & Store Staff)")
        r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

        p_i1 = doc.add_paragraph()
        p_i1.alignment = WD_ALIGN_PARAGRAPH.CENTER; p_i1.paragraph_format.space_after = Pt(8)
        p_i1.add_run().add_picture(img_usecase, width=Inches(6.2))

    # Ảnh 2: DFD 0
    img_dfd0 = r"e:\supply-chain-spoilage-predictor\Docs\Diagram_Images\dfd_0.png"
    if os.path.exists(img_dfd0):
        p_t2 = doc.add_paragraph()
        p_t2.paragraph_format.space_before = Pt(6); p_t2.paragraph_format.space_after = Pt(3)
        r = p_t2.add_run("2. Sơ đồ luồng dữ liệu DFD Mức 0 (Context Diagram - Bán lẻ tinh gọn)")
        r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

        p_i2 = doc.add_paragraph()
        p_i2.alignment = WD_ALIGN_PARAGRAPH.CENTER; p_i2.paragraph_format.space_after = Pt(8)
        p_i2.add_run().add_picture(img_dfd0, width=Inches(6.2))

    # Ảnh 3: DFD 1
    img_dfd1 = r"e:\supply-chain-spoilage-predictor\Docs\Diagram_Images\dfd_1.png"
    if os.path.exists(img_dfd1):
        p_t3 = doc.add_paragraph()
        p_t3.paragraph_format.space_before = Pt(6); p_t3.paragraph_format.space_after = Pt(3)
        r = p_t3.add_run("3. Sơ đồ luồng dữ liệu DFD Mức 1 (5 Tiến trình nghiệp vụ bán lẻ cốt lõi & 3 Kho dữ liệu)")
        r.font.name = "Arial"; r.font.size = Pt(10.5); r.font.bold = True

        p_i3 = doc.add_paragraph()
        p_i3.alignment = WD_ALIGN_PARAGRAPH.CENTER; p_i3.paragraph_format.space_after = Pt(8)
        p_i3.add_run().add_picture(img_dfd1, width=Inches(6.2))

    doc.save(output_docx)
    print(f"[SUCCESS] Đã tạo file Word: {output_docx}")
    return output_docx

if __name__ == "__main__":
    template = r"e:\supply-chain-spoilage-predictor\Docs\2024-07-Mẫu báo cáo gặp GVHD hàng tuần.docx"
    
    # 1. Bản của sinh viên Đỗ Tấn Du
    f1 = r"e:\supply-chain-spoilage-predictor\Docs\123001364_DoTanDu_Tuan03_LeMinhNhat.docx"
    build_report(template, "123001364", "Đỗ Tấn Du", f1, is_group=False)

    # 2. Bản của sinh viên Đoàn Minh Quân
    f2 = r"e:\supply-chain-spoilage-predictor\Docs\123000946_DoanMinhQuan_Tuan03_LeMinhNhat.docx"
    build_report(template, "123000946", "Đoàn Minh Quân", f2, is_group=False)

    # 3. Bản chung nhóm
    f3 = r"e:\supply-chain-spoilage-predictor\Docs\123001364_DoTanDu_DoanMinhQuan_Tuan03_LeMinhNhat.docx"
    build_report(template, "123001364, 123000946", "Đỗ Tấn Du, Đoàn Minh Quân", f3, is_group=True)
