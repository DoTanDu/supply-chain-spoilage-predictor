# -*- coding: utf-8 -*-
"""
TỰ ĐỘNG XUẤT TÀI LIỆU THUYẾT MINH SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM) RA MICROSOFT WORD (.DOCX)
HỆ THỐNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ (SUPPLY CHAIN SPOILAGE PREDICTOR)
Đại học Lạc Hồng (LHU) - GVHD: ThS. Lê Minh Nhật
Sinh viên: Đỗ Tấn Du & Đoàn Minh Quân
"""

import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
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

def format_table(table, col_widths, headers, data, header_bg="6366F1", alt_bg="EEF2FF"):
    set_table_borders(table)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], header_bg)
        set_cell_margins(hdr_cells[i], 120, 120, 120, 120)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.font.name = "Times New Roman"
            run.font.size = Pt(11)
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)

    for row_idx, row_data in enumerate(data):
        row = table.rows[row_idx + 1]
        bg = alt_bg if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, cell_value in enumerate(row_data):
            cell = row.cells[col_idx]
            cell.text = str(cell_value)
            set_cell_background(cell, bg)
            set_cell_margins(cell, 80, 80, 100, 100)
            p = cell.paragraphs[0]
            if col_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = "Times New Roman"
                run.font.size = Pt(10.5)
                run.font.color.rgb = RGBColor(30, 41, 59)

    for row in table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = Inches(width)

def build_activity_word_doc():
    doc = Document()

    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # 1. Header Đề tài
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst = p_inst.add_run("TRƯỜNG ĐẠI HỌC LẠC HỒNG - KHOA CÔNG NGHỆ THÔNG TIN\n")
    r_inst.font.name = "Times New Roman"
    r_inst.font.size = Pt(12)
    r_inst.font.bold = True
    r_inst.font.color.rgb = RGBColor(30, 41, 59)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("THUYẾT MINH CHI TIẾT SƠ ĐỒ HOẠT ĐỘNG (UML ACTIVITY DIAGRAM)\nQUY TRÌNH THAO TÁC CHUẨN (SOP) VẬN HÀNH BÁN LẺ & CHỐNG LÃNG PHÍ")
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(16)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(67, 56, 202)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("Đề tài: Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor)\n"
                          "Mô hình: Cửa hàng Bán lẻ Tinh gọn LHU Mart liên kết Kho tổng DC Biên Hòa\n"
                          "GVHD: ThS. Lê Minh Nhật | Nhóm SV: Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946)")
    r_sub.font.name = "Times New Roman"
    r_sub.font.size = Pt(11)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 2. Phần 1: Giới thiệu
    h1 = doc.add_heading(level=1)
    r = h1.add_run("1. TỔNG QUAN VỀ SƠ ĐỒ HOẠT ĐỘNG TRONG QUẢN TRỊ BÁN LẺ")
    r.font.name = "Times New Roman"
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(67, 56, 202)

    p_intro = doc.add_paragraph()
    p_intro.paragraph_format.line_spacing = 1.2
    p_intro.paragraph_format.space_after = Pt(8)
    r_intro = p_intro.add_run(
        "Trong tài liệu đặc tả hệ thống thông tin và quản trị chuỗi cung ứng, Sơ đồ Hoạt động (UML Activity Diagram) "
        "đóng vai trò mô hình hóa quy trình nghiệp vụ (Business Process Modeling). Sơ đồ sử dụng kỹ thuật phân làn trách nhiệm (Swimlanes) "
        "nhằm quy định rõ ràng quyền hạn và nghĩa vụ của từng chủ thể tham gia, chỉ rõ từng trạng thái hành động, điểm rẽ nhánh quyết định (Decision Node), "
        "và cơ chế xác nhận điện tử hai chiều.\n\n"
        "Hệ thống chuẩn hóa 2 quy trình vận hành mang tính kỷ luật cốt lõi trong chuỗi bán lẻ LHU Mart:\n"
        "• Quy trình 1: SOP 5 bước Giảm giá xả hàng Quick Markdown & Đảo lô hàng mặt tiền kệ trưng bày (Rule 4 & Rule 10).\n"
        "• Quy trình 2: SOP 4 bước Bàn giao ca trực & Đối soát tài chính hao hụt giữa hai ca làm việc (Rule 6 & Rule 11)."
    )
    r_intro.font.name = "Times New Roman"
    r_intro.font.size = Pt(11.5)

    # 3. Phần 2: Chèn hình ảnh tổng thể
    h2 = doc.add_heading(level=1)
    r = h2.add_run("2. HÌNH ẢNH SƠ ĐỒ HOẠT ĐỘNG SONG SONG 2 QUY TRÌNH (DUAL-PANEL)")
    r.font.name = "Times New Roman"
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(67, 56, 202)

    img_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Diagram_Images", "activity_sop_workflows.png"))
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Inches(6.5))

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(12)
        r_cap = p_cap.add_run("Hình 1: Sơ đồ Hoạt động UML Swimlane cho 2 Quy trình Thao tác Chuẩn (SOP Workflows)")
        r_cap.font.name = "Times New Roman"
        r_cap.font.size = Pt(10)
        r_cap.font.bold = True
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(71, 85, 105)

    # 4. Phần 3: Thuyết minh Quy trình 1
    doc.add_page_break()
    h3 = doc.add_heading(level=1)
    r = h3.add_run("3. QUY TRÌNH 1: QUICK MARKDOWN & ĐẢO LÔ MẶT TIỀN KỆ (5 BƯỚC SOP)")
    r.font.name = "Times New Roman"
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(67, 56, 202)

    p_t1_title = doc.add_paragraph()
    r_t1_title = p_t1_title.add_run("Bảng 1: Phân tích 5 bước thao tác chuẩn Quy trình Đảo kệ & Giảm giá Quick Markdown")
    r_t1_title.font.name = "Times New Roman"
    r_t1_title.font.size = Pt(11)
    r_t1_title.font.bold = True

    t1_headers = ["Bước", "Chủ thể thực hiện", "Tên hành động", "Chi tiết thao tác & Ràng buộc kỹ thuật"]
    t1_widths = [0.8, 1.6, 1.8, 2.3]
    t1_data = [
        ["1", "Cửa hàng trưởng", "Quét cảnh báo ca trực", "Truy cập Action Board, lọc danh sách lô hàng chạm Vùng Vàng hoặc Vùng Đỏ cần xử lý khẩn cấp."],
        ["-", "Cửa hàng trưởng", "Quyết định mức giảm", "Đánh giá DaysLeft: Vùng Vàng chọn giảm 15%-30%; Vùng Đỏ chọn giảm 40%-50% xả hàng kịch sàn."],
        ["2", "Cửa hàng trưởng", "Kích hoạt Quick Markdown", "Duyệt tỷ lệ giảm giá trên hệ thống. API tự động cập nhật bảng Batches và đồng bộ giá bán POS."],
        ["3", "Nhân viên quầy kệ", "Đảo lô hàng mặt tiền", "Nhận thông báo lệnh đảo kệ. Rút sản phẩm date xa vào trong, xếp toàn bộ lô cận date ra hàng đầu."],
        ["4", "Nhân viên quầy kệ", "Dán tem nhãn giảm giá", "Dán nhãn sticker 'Khuyến mãi đặc biệt 15%-50%' và đặt bảng cảnh báo ưu đãi tại line hàng."],
        ["5", "Nhân viên quầy kệ", "Xác nhận điện tử trên app", "Bấm 'Đã hoàn tất đảo kệ'. Hệ thống gỡ cờ cảnh báo, chuyển is_shelf_rotated = 1 và ghi AuditLog ROTATE_SHELF_FEFO."]
    ]
    table1 = doc.add_table(rows=len(t1_data) + 1, cols=4)
    format_table(table1, t1_widths, t1_headers, t1_data, header_bg="4338CA", alt_bg="EEF2FF")

    # 5. Phần 4: Thuyết minh Quy trình 2
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    h4 = doc.add_heading(level=1)
    r = h4.add_run("4. QUY TRÌNH 2: BÀN GIAO CA TRỰC & ĐỐI SOÁT TÀI CHÍNH HAO HỤT (4 BƯỚC SOP)")
    r.font.name = "Times New Roman"
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(67, 56, 202)

    p_t2_title = doc.add_paragraph()
    r_t2_title = p_t2_title.add_run("Bảng 2: Phân tích 4 bước thao tác chuẩn Quy trình Bàn giao ca trực & Đối soát tài chính")
    r_t2_title.font.name = "Times New Roman"
    r_t2_title.font.size = Pt(11)
    r_t2_title.font.bold = True

    t2_headers = ["Bước", "Chủ thể thực hiện", "Tên hành động", "Chi tiết thao tác & Ràng buộc kỹ thuật"]
    t2_widths = [0.8, 1.6, 1.8, 2.3]
    t2_data = [
        ["1", "Thu ngân kết ca", "Kiểm đếm tiền két", "Kiểm đếm thực tế tiền mặt tại quầy (phân loại mệnh giá), nhập số tiền vào form Chốt ca điện tử."],
        ["2", "Hệ thống & Thu ngân", "Đối soát doanh thu POS", "Hệ thống so khớp Tiền thực tế vs Doanh thu máy tính. Tính chênh lệch Discrepancy. Nếu lệch, bắt buộc giải trình."],
        ["3", "Hai bên cùng làm", "Kiểm đếm hàng cận date", "Hai thu ngân cùng rà soát sản phẩm Vàng/Đỏ trên kệ. Đối soát số lượng hàng đã tiêu hủy với Sổ hao hụt."],
        ["4", "Thu ngân mới & Quản lý", "Ký biên bản điện tử", "Ký số biên bản bàn giao điện tử 2 bên có sự giám sát của Cửa hàng trưởng kèm cam kết tuân thủ 3 chế tài kỷ luật Mục 15.2."],
        ["-", "Hệ thống", "Ghi Audit Log bất biến", "Lưu trữ toàn bộ biên bản vào AuditLogs, đóng phiên ca cũ và mở quyền POS cho ca mới an toàn."]
    ]
    table2 = doc.add_table(rows=len(t2_data) + 1, cols=4)
    format_table(table2, t2_widths, t2_headers, t2_data, header_bg="6D28D9", alt_bg="F5F3FF")

    # 6. Phần 5: Kết luận
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    h5 = doc.add_heading(level=1)
    r = h5.add_run("5. KẾT LUẬN VÀ GIÁ TRỊ THỰC TIỄN")
    r.font.name = "Times New Roman"
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(67, 56, 202)

    p_conc = doc.add_paragraph()
    p_conc.paragraph_format.line_spacing = 1.2
    r_conc = p_conc.add_run(
        "Sơ đồ Hoạt động với kỹ thuật phân làn Swimlanes đã chuyển hóa toàn bộ 11 Quy tắc Nghiệp vụ cốt lõi "
        "thành hành động cụ thể, có trách nhiệm cá nhân rõ ràng và được giám sát điện tử 100%. "
        "Bộ tài liệu này tạo thành mảnh ghép hoàn hảo cho đồ án tốt nghiệp của nhóm sinh viên Đỗ Tấn Du & Đoàn Minh Quân, "
        "đáp ứng đầy đủ các tiêu chuẩn khắt khe về kỹ thuật phần mềm và ứng dụng thực tiễn."
    )
    r_conc.font.name = "Times New Roman"
    r_conc.font.size = Pt(11.5)

    out_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Word_Documents", "THUYET_MINH_CHI_TIET_SO_DO_HOAT_DONG.docx"))
    doc.save(out_file)
    print(f"XUAT THANH CONG FILE WORD: {out_file}")

if __name__ == "__main__":
    build_activity_word_doc()
