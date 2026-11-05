# -*- coding: utf-8 -*-
"""
TỰ ĐỘNG XUẤT TÀI LIỆU THUYẾT MINH CHI TIẾT SƠ ĐỒ CSDL ERD (13 BẢNG CHUẨN 3NF) RA ĐỊNH DẠNG MICROSOFT WORD (.DOCX)
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

def format_table(table, col_widths, headers, data, header_bg="1E40AF", alt_bg="F8FAFC"):
    set_table_borders(table)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    # Header
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], header_bg)
        set_cell_margins(hdr_cells[i], 120, 120, 120, 120)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(10)
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    # Data rows
    for row_idx, row_data in enumerate(data):
        row_cells = table.rows[row_idx + 1].cells
        bg = alt_bg if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            row_cells[col_idx].text = str(text)
            set_cell_background(row_cells[col_idx], bg)
            set_cell_margins(row_cells[col_idx], 80, 80, 100, 100)
            p = row_cells[col_idx].paragraphs[0]
            if col_idx in (0, 1):
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.name = "Times New Roman"
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(30, 41, 59)

    for row in table.rows:
        for i, w in enumerate(col_widths):
            row.cells[i].width = Inches(w)

def build_erd_doc():
    doc = Document()

    # Khổ giấy A4 và lề chuẩn đồ án
    section = doc.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(0.8)

    # Style chuẩn
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    font.color.rgb = RGBColor(30, 41, 59)

    # Tiêu đề tài liệu
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = title_p.add_run("THUYẾT MINH THIẾT KẾ CƠ SỞ DỮ LIỆU CHUẨN 3NF\n(ERD - 13 BẢNG QUAN HỆ)")
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(17)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(30, 58, 138)

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = sub_p.add_run("Đề tài: Nền tảng Quản trị Chuỗi cung ứng Bán lẻ Chống lãng phí (LHU Mart & DC Biên Hòa)\n"
                          "GVHD: ThS. Lê Minh Nhật | Nhóm sinh viên: Đỗ Tấn Du & Đoàn Minh Quân\n"
                          "Hệ quản trị CSDL: Microsoft SQL Server LocalDB (retail_spoilage_db)")
    r_sub.font.name = 'Times New Roman'
    r_sub.font.size = Pt(10.5)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph("─" * 65)

    # I. NGUYÊN TẮC THIẾT KẾ
    h1 = doc.add_paragraph()
    r = h1.add_run("I. NGUYÊN TẮC THIẾT KẾ CSDL CHUẨN 3NF & RÀNG BUỘC TOÀN VẸN")
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(30, 64, 175)

    p1 = doc.add_paragraph(
        "Theo định hướng của ThS. Lê Minh Nhật, hệ thống tập trung vào một Cửa hàng bán lẻ tinh gọn duy nhất "
        "(RETAIL-STORE-01) liên kết với Trung tâm Phân phối Kho tổng (DC Biên Hòa). Cơ sở dữ liệu được thiết kế "
        "đạt chuẩn chuẩn hóa 3NF trên Microsoft SQL Server với 4 nguyên tắc kỹ thuật cốt lõi:"
    )
    p1.paragraph_format.line_spacing = 1.15

    principles = [
        ("Khóa chính duy nhất toàn cầu (Primary Key):", " Sử dụng kiểu UNIQUEIDENTIFIER kết hợp DEFAULT NEWID() cho toàn bộ 13 bảng."),
        ("Bảo vệ toàn vẹn tham chiếu (Foreign Keys):", " Liên kết khóa ngoại chặt chẽ. Đơn đặt hàng PO và PO Items dùng ON DELETE CASCADE."),
        ("Chống tồn kho âm & Lỗi dữ liệu (CHECK Constraints):", " Ràng buộc CurrentQuantity >= 0 (Rule 3), ExpiryDate > ManufactureDate, và QuantitySold > 0."),
        ("Nhật ký kiểm toán bất biến (Audit Trail):", " Mọi can thiệp trừ kho FEFO, đổi giá xả hàng, hủy hàng, phân quyền đều lưu vết tại AuditLogs (Rule 11).")
    ]
    for b_title, b_desc in principles:
        bp = doc.add_paragraph(style='List Bullet')
        r1 = bp.add_run(b_title)
        r1.bold = True
        r1.font.color.rgb = RGBColor(15, 23, 42)
        r2 = bp.add_run(b_desc)
        bp.paragraph_format.line_spacing = 1.15

    # II. HÌNH ẢNH SƠ ĐỒ ERD
    h2 = doc.add_paragraph()
    r = h2.add_run("II. HÌNH ẢNH SƠ ĐỒ THỰC THỂ QUAN HỆ ERD (13 BẢNG)")
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(30, 64, 175)

    img_path = "c:/thuyet minh/Docs/Diagram_Images/erd_database_3nf.png"
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Inches(6.4))

        caption = doc.add_paragraph()
        caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap = caption.add_run("Hình 1: Sơ đồ Thực thể Quan hệ CSDL 13 Bảng Chuẩn 3NF (retail_spoilage_db)")
        r_cap.font.size = Pt(9.5)
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(100, 116, 139)

    # III. MA TRẬN 13 BẢNG DỮ LIỆU
    h3 = doc.add_paragraph()
    r = h3.add_run("III. MA TRẬN 13 BẢNG VÀ PHÂN HỆ NGHIỆP VỤ")
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(30, 64, 175)

    matrix_headers = ["STT", "Tên bảng", "Phân hệ chức năng", "Khóa chính (PK)", "Khóa ngoại (FK)", "Ý nghĩa nghiệp vụ"]
    matrix_widths = [0.45, 1.25, 1.35, 0.75, 1.0, 1.6]
    matrix_data = [
        ["1", "Suppliers", "DC & Đối tác", "Id", "Không", "Kho tổng DC Biên Hòa duy nhất (DC-BIENHOA)"],
        ["2", "GoodsReceipts", "Inbound DC", "Id", "SupplierId, ReceivedBy", "Phiếu nhập hàng DC (Kiểm định RSL >= 70%)"],
        ["3", "PurchaseOrders", "Đặt hàng DC", "Id", "SupplierId, CreatedBy, ApprovedBy", "Đơn đặt hàng DC 5 trạng thái (DRAFT/APPROVED/SUBMITTED/DELIVERED/CANCELLED)"],
        ["4", "PurchaseOrderItems", "Đặt hàng DC", "Id", "OrderId, ProductId", "Chi tiết dòng hàng đặt ROP (ON DELETE CASCADE)"],
        ["5", "Categories", "Danh mục FMCG", "Id", "Không", "5 ngành hàng FMCG, ngưỡng cảnh báo mặc định"],
        ["6", "Products", "Sản phẩm", "Id", "CategoryId, SupplierId", "Mặt hàng bán lẻ, giá vốn, giá niêm yết, chặn trùng SKU & tên >= 85%"],
        ["7", "Batches", "Lô hàng FEFO", "Id", "ProductId, ShelfRotatedBy", "Trọng tâm FEFO: HSD, giá vốn, tồn kho, Quick Markdown, SOP đảo kệ"],
        ["8", "SalesHistory", "Giao dịch POS", "Id", "ProductId, BatchId, CashierId", "Lịch sử bán lẻ POS, tự động bẻ lô FEFO, cờ thời tiết & lễ"],
        ["9", "SpoilageRecords", "Sổ Hao hụt", "Id", "BatchId, PerformedBy, ApprovedBy", "Sổ hao hụt tài chính bất biến, tách biệt Lập - Duyệt (SoD)"],
        ["10", "Roles", "Phân quyền", "Id", "Không", "4 nhóm vai trò RBAC: Admin, Manager, Cashier, Warehouse"],
        ["11", "Users", "Tài khoản", "Id", "RoleCode", "Tài khoản nhân sự, phân quyền RBAC, chống Brute-Force lockout"],
        ["12", "StoreProfile", "Cửa hàng", "Id", "ManagerId", "Thông tin LHU Mart duy nhất (RETAIL-STORE-01), giờ mở 06:00-22:00, Min RSL 70%"],
        ["13", "AuditLogs", "Kiểm toán", "Id", "UserId", "Nhật ký kiểm toán hệ thống bất biến (Rule 11)"]
    ]

    tbl_matrix = doc.add_table(rows=len(matrix_data) + 1, cols=6)
    format_table(tbl_matrix, matrix_widths, matrix_headers, matrix_data, header_bg="1E40AF")

    # IV. INDEXES TỐI ƯU
    doc.add_paragraph().paragraph_format.space_before = Pt(12)
    h4 = doc.add_paragraph()
    r = h4.add_run("IV. CHIẾN LƯỢC ĐÁNH CHỈ MỤC (SQL SERVER INDEXES)")
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(30, 64, 175)

    indexes = [
        ("IX_Batches_FEFO (ProductId, ExpiryDate ASC, CurrentQuantity):", " Tối ưu hóa truy vấn bóc tách lô cận date nhất khi xuất bán tại POS."),
        ("IX_Batches_ExpiryWatchdog (Status, ExpiryDate, CurrentQuantity):", " Tối ưu hóa bộ lọc phân loại 3 vùng màu (Xanh/Vàng/Đỏ) trên Dashboard."),
        ("IX_Products_Sku (Sku):", " Tăng tốc tìm kiếm barcode và chặn trùng lặp sản phẩm (Rule 9)."),
        ("IX_SalesHistory_Product_Date (ProductId, SaleDate DESC):", " Tối ưu thuật toán tính tốc độ bán bình quân 14 ngày (d_base) cho ROP."),
        ("IX_SpoilageRecords_Batch (BatchId, DisposedDate):", " Tổng hợp báo cáo hao hụt tài chính thời gian thực.")
    ]
    for idx_title, idx_desc in indexes:
        ip = doc.add_paragraph(style='List Bullet')
        r1 = ip.add_run(idx_title)
        r1.bold = True
        r1.font.color.rgb = RGBColor(15, 23, 42)
        r2 = ip.add_run(idx_desc)
        ip.paragraph_format.line_spacing = 1.15

    # Lưu file Word
    out_docx = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Word_Documents", "THUYET_MINH_CHI_TIET_SO_DO_ERD.docx"))
    doc.save(out_docx)
    sys.stdout.buffer.write(f"Đã xuất thành công tài liệu Word tại: {out_docx}\n".encode('utf-8'))

if __name__ == '__main__':
    build_erd_doc()
