# -*- coding: utf-8 -*-
"""
TỰ ĐỘNG XUẤT TÀI LIỆU THUYẾT MINH SƠ ĐỒ CLEAN ARCHITECTURE RA MICROSOFT WORD (.DOCX)
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

    for row_idx, row_data in enumerate(data):
        row_cells = table.rows[row_idx + 1].cells
        bg = alt_bg if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            row_cells[col_idx].text = str(text)
            set_cell_background(row_cells[col_idx], bg)
            set_cell_margins(row_cells[col_idx], 80, 80, 100, 100)
            p = row_cells[col_idx].paragraphs[0]
            if col_idx in (0,):
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

def build_clean_arch_doc():
    doc = Document()

    section = doc.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(0.8)

    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    font.color.rgb = RGBColor(30, 41, 59)

    # Tiêu đề
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = title_p.add_run("THUYẾT MINH KIẾN TRÚC HỆ THỐNG CLEAN ARCHITECTURE\n(4 TẦNG & QUY TẮC PHỤ THUỘC)")
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(17)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(30, 58, 138)

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = sub_p.add_run("Đề tài: Nền tảng Quản trị Chuỗi cung ứng Bán lẻ Chống lãng phí (Supply Chain Spoilage Predictor)\n"
                          "GVHD: ThS. Lê Minh Nhật | Nhóm sinh viên: Đỗ Tấn Du & Đoàn Minh Quân\n"
                          "Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU)")
    r_sub.font.name = 'Times New Roman'
    r_sub.font.size = Pt(10.5)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph("─" * 65)

    # I. NGUYÊN LÝ THIẾT KẾ
    h1 = doc.add_paragraph()
    r = h1.add_run("I. NGUYÊN TẮC THIẾT KẾ CLEAN ARCHITECTURE & ĐẢO NGƯỢC PHỤ THUỘC (DIP)")
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(30, 64, 175)

    p1 = doc.add_paragraph(
        "Theo chỉ đạo của ThS. Lê Minh Nhật, hệ thống được thiết kế tuân thủ nghiêm ngặt mô hình Clean Architecture "
        "(Kiến trúc Sạch) gồm 4 tầng độc lập. Mục tiêu cốt lõi là bảo vệ các quy tắc nghiệp vụ quan trọng "
        "(Bán lẻ FEFO bẻ lô, Tiếp nhận DC kiểm định RSL >= 70%, Dự báo ROP tích hợp ngoại cảnh) không bị phụ thuộc vào "
        "bất kỳ giao diện đồ họa hay hệ quản trị cơ sở dữ liệu cụ thể nào."
    )
    p1.paragraph_format.line_spacing = 1.15

    principles = [
        ("Quy tắc phụ thuộc một chiều hướng tâm (The Dependency Rule):", " Tầng bên ngoài phụ thuộc tầng bên trong. Lõi Domain không chứa bất kỳ phụ thuộc nào."),
        ("Nguyên tắc Đảo ngược Phụ thuộc (DIP):", " Domain định nghĩa các Interface/Ports (IBatchRepository). Tầng Infrastructure kế thừa và hiện thực hóa (Adapters)."),
        ("Tách biệt rõ ràng Trách nhiệm (Separation of Concerns):", " Controller chỉ nhận Request/trả Response; Use Case điều phối luồng; Entity thực thi logic; Repository chỉ lo I/O CSDL."),
        ("Dễ dàng Kiểm thử Tự động (Testability):", " Tầng Application và Domain có thể viết Unit Test 100% bằng cách truyền Mock Repository mà không cần bật SQL Server.")
    ]
    for b_title, b_desc in principles:
        bp = doc.add_paragraph(style='List Bullet')
        r1 = bp.add_run(b_title)
        r1.bold = True
        r1.font.color.rgb = RGBColor(15, 23, 42)
        r2 = bp.add_run(b_desc)
        bp.paragraph_format.line_spacing = 1.15

    # II. HÌNH ẢNH SƠ ĐỒ KIẾN TRÚC
    h2 = doc.add_paragraph()
    r = h2.add_run("II. HÌNH ẢNH SƠ ĐỒ KIẾN TRÚC CLEAN ARCHITECTURE TỔNG THỂ")
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(30, 64, 175)

    img_path = "c:/thuyet minh/Docs/Diagram_Images/clean_architecture.png"
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Inches(6.4))

        caption = doc.add_paragraph()
        caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap = caption.add_run("Hình 1: Sơ đồ Kiến trúc Clean Architecture 4 Tầng & Ánh xạ Mã nguồn Thực tế")
        r_cap.font.size = Pt(9.5)
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(100, 116, 139)

    # III. BẢNG PHÂN BỔ 4 TẦNG TRONG CODEBASE
    h3 = doc.add_paragraph()
    r = h3.add_run("III. MA TRẬN 4 TẦNG VÀ DANH MỤC THÀNH PHẦN MÃ NGUỒN")
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(30, 64, 175)

    matrix_headers = ["Tầng kiến trúc", "Thư mục mã nguồn", "Trách nhiệm chính", "Thành phần tiêu biểu"]
    matrix_widths = [1.3, 1.4, 2.0, 1.7]
    matrix_data = [
        [
            "Presentation\n(Tầng 1)",
            "Backend/src/presentation/\nFrontend/src/",
            "Giao diện SPA React 19 Vite (10 màn hình) và REST API Controllers nhận request từ client.",
            "LoginView, DashboardView, PosCheckoutView, DcIntakeView, ExpiryMonitorView, SpoilageLogView, ReorderPredictorView, ShiftHandoverView, SalesController, BatchController, authMiddleware"
        ],
        [
            "Application\n(Tầng 2)",
            "Backend/src/application/",
            "Điều phối luồng thực thi ca sử dụng, chuyển đổi DTO và bảo vệ toàn vẹn.",
            "ProcessFefoSaleUseCase, ReceiveDCBatchUseCase, RejectDCBatchUseCase, ApplyQuickMarkdownUseCase, RotateShelfFefoUseCase, DisposeSpoiledGoodsUseCase, ApproveSpoilageRecordUseCase, CalculateROPForecastUseCase"
        ],
        [
            "Domain\n(Tầng 3 - Lõi)",
            "Backend/src/domain/",
            "Chứa các thực thể bất biến, quy tắc nghiệp vụ lõi (11 Rules) và các cổng Interface.",
            "Batch, Product, StoreProfile, SpoilageRecord, PurchaseOrder, FefoAllocationPolicy, RopCalculationService, ProductDeduplicationService, IBatchRepository, ISaleRepository"
        ],
        [
            "Infrastructure\n(Tầng 4)",
            "Backend/src/infrastructure/",
            "Hiện thực hóa truy xuất CSDL SQL Server LocalDB, mã hóa và bảo mật.",
            "SqlBatchRepository, SqlSaleRepository, SqlSpoilageRepository, SqlPurchaseOrderRepository, TokenService, PasswordHasher, sqlConnection.js"
        ]
    ]

    tbl_matrix = doc.add_table(rows=len(matrix_data) + 1, cols=4)
    format_table(tbl_matrix, matrix_widths, matrix_headers, matrix_data, header_bg="1E40AF")

    # IV. LUỒNG XỬ LÝ REQUEST LIFECYCLE
    doc.add_paragraph().paragraph_format.space_before = Pt(12)
    h4 = doc.add_paragraph()
    r = h4.add_run("IV. LUỒNG THỰC THI GIAO DỊCH ĐIỂN HÌNH: BÁN LẺ POS BẺ LÔ FEFO")
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(30, 64, 175)

    steps = [
        ("Bước 1 - Client Trigger:", " Thu ngân quét Barcode, bấm 'Thanh toán' trên PosCheckoutView.jsx -> Gửi HTTP POST /api/sales kèm JWT token."),
        ("Bước 2 - Controller Adapter:", " SalesController tiếp nhận, authMiddleware kiểm tra JWT và gọi ProcessFefoSaleUseCase.execute(dto)."),
        ("Bước 3 - Use Case Interactor:", " Use Case gọi IBatchRepository.findAvailableByProduct(productId) để lấy danh sách lô còn tồn khả dụng."),
        ("Bước 4 - Database I/O:", " SqlBatchRepository khóa dòng (UPDLOCK, ROWLOCK) truy vấn SQL Server LocalDB theo ExpiryDate ASC, id ASC."),
        ("Bước 5 - Domain Policy:", " FefoAllocationPolicy bóc tách số lượng, tự động bẻ dòng hóa đơn nếu khách mua vượt tồn 1 lô."),
        ("Bước 6 - Commit Transaction:", " Cập nhật CurrentQuantity, lưu SalesHistory kèm cờ thời tiết & lễ, ghi AuditLogs và commit transaction."),
        ("Bước 7 - Response Render:", " Trả kết quả JSON hóa đơn thành công về màn hình POS in biên lai kèm chi tiết từng lô đã xuất.")
    ]
    for s_title, s_desc in steps:
        sp = doc.add_paragraph(style='List Bullet')
        r1 = sp.add_run(s_title)
        r1.bold = True
        r1.font.color.rgb = RGBColor(15, 23, 42)
        r2 = sp.add_run(s_desc)
        sp.paragraph_format.line_spacing = 1.15

    out_docx = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Word_Documents", "THUYET_MINH_CHI_TIET_SO_DO_CLEAN_ARCHITECTURE.docx"))
    doc.save(out_docx)
    sys.stdout.buffer.write(f"Đã xuất thành công tài liệu Word tại: {out_docx}\n".encode('utf-8'))

if __name__ == '__main__':
    build_clean_arch_doc()
