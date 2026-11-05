# -*- coding: utf-8 -*-
"""
TỰ ĐỘNG XUẤT TÀI LIỆU THUYẾT MINH SƠ ĐỒ TUẦN TỰ RA MICROSOFT WORD (.DOCX)
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

def format_table(table, col_widths, headers, data, header_bg="0D9488", alt_bg="F0FDFA"):
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

def build_sequence_word_doc():
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
    r_title = p_title.add_run("THUYẾT MINH CHI TIẾT SƠ ĐỒ TUẦN TỰ (UML SEQUENCE DIAGRAMS)\nCHO CÁC USE CASE CỐT LÕI HỆ THỐNG")
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(16)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(15, 118, 110)

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
    r = h1.add_run("1. TỔNG QUAN VỀ SƠ ĐỒ TUẦN TỰ TRONG CLEAN ARCHITECTURE")
    r.font.name = "Times New Roman"
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(15, 118, 110)

    p_intro = doc.add_paragraph()
    p_intro.paragraph_format.line_spacing = 1.2
    p_intro.paragraph_format.space_after = Pt(8)
    r_intro = p_intro.add_run(
        "Trong thiết kế phần mềm hiện đại theo chuẩn Clean Architecture, Sơ đồ Tuần tự (UML Sequence Diagram) "
        "đóng vai trò chứng minh tính khả thi của quy trình nghiệp vụ và tính tuân thủ quy tắc một chiều giữa các tầng kiến trúc. "
        "Sơ đồ mô tả dòng thông điệp (Message Flow) theo trục thời gian thẳng đứng, thể hiện rõ các ranh giới: "
        "Actor (Người dùng bên ngoài) ➔ Presentation Layer (SPA View & Controller) ➔ Application Layer (UseCase Interactor) ➔ "
        "Domain Layer (Entity & Business Validator) ➔ Infrastructure Layer (Repository & SQL Server LocalDB).\n\n"
        "Hệ thống tập trung mô hình hóa 2 Use Case then chốt nhất đối với chuỗi cung ứng bán lẻ chống lãng phí:\n"
        "• Use Case 1 (Mục 21.1 & Rule 2, 3): Bán lẻ POS xuất kho theo FEFO và tự động bẻ lô đơn hàng (ProcessFefoSaleUseCase).\n"
        "• Use Case 2 (Mục 21.2 & Rule 7): Tiếp nhận đợt hàng từ DC Biên Hòa và thẩm định tiêu chuẩn RSL >= 70% (ReceiveDCBatchUseCase)."
    )
    r_intro.font.name = "Times New Roman"
    r_intro.font.size = Pt(11.5)

    # 3. Phần 2: Sơ đồ tuần tự 1 - Bán lẻ POS FEFO
    h2 = doc.add_heading(level=1)
    r = h2.add_run("2. SƠ ĐỒ TUẦN TỰ 1: BÁN LẺ POS XUẤT KHO FEFO (PROCESS FEFO SALE)")
    r.font.name = "Times New Roman"
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(15, 118, 110)

    # Chèn ảnh 1
    img1_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Diagram_Images", "sequence_fefo_sale.png"))
    if os.path.exists(img1_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(img1_path, width=Inches(6.5))

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(12)
        r_cap = p_cap.add_run("Hình 1: Sơ đồ Tuần tự Luồng Bán lẻ POS Trừ kho FEFO & Bẻ Lô (UML Sequence Diagram)")
        r_cap.font.name = "Times New Roman"
        r_cap.font.size = Pt(10)
        r_cap.font.bold = True
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(71, 85, 105)

    # Bảng lifelines 1
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    p_t1_title = doc.add_paragraph()
    r_t1_title = p_t1_title.add_run("Bảng 1: Phân tích vai trò và trách nhiệm các Lifeline trong luồng Bán hàng FEFO")
    r_t1_title.font.name = "Times New Roman"
    r_t1_title.font.size = Pt(11)
    r_t1_title.font.bold = True

    t1_headers = ["Tên Lifeline", "Tầng Kiến trúc", "Vai trò & Trách nhiệm kỹ thuật"]
    t1_widths = [1.8, 1.8, 2.9]
    t1_data = [
        ["Cashier", "Actor", "Thu ngân quét mã vạch sản phẩm, nhập số lượng mua và bấm thanh toán hóa đơn."],
        ["POS View", "Presentation", "Giao diện React SPA hiển thị giỏ hàng, thông tin chiết khấu cận date và nút xác nhận."],
        ["SalesController", "Presentation", "Tiếp nhận HTTP POST /api/sales, xác thực JWT và phân quyền thu ngân."],
        ["ProcessFefoSaleUseCase", "Application", "Điều phối luồng FEFO, quản lý Transaction, tính toán bẻ lô và giá sau giảm."],
        ["BatchRepository", "Infrastructure", "Khóa UPDLOCK, ROWLOCK, đọc danh sách lô hợp lệ và trừ CurrentQuantity."],
        ["SalesRepository", "Infrastructure", "Lưu hóa đơn thanh toán vào SalesHistory kèm cờ thời tiết và ngày lễ."],
        ["AuditLogRepository", "Infrastructure", "Ghi nhật ký kiểm toán bất biến phục vụ đối soát tài chính."],
        ["SQL Server LocalDB", "Database", "Thực thi kiểm tra ràng buộc CHECK, FOREIGN KEY và COMMIT giao dịch an toàn."]
    ]
    table1 = doc.add_table(rows=len(t1_data) + 1, cols=3)
    format_table(table1, t1_widths, t1_headers, t1_data, header_bg="0D9488", alt_bg="F0FDFA")

    # Diễn giải 7 bước
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    p_desc1 = doc.add_paragraph()
    p_desc1.paragraph_format.line_spacing = 1.2
    r_desc1 = p_desc1.add_run(
        "Diễn giải quy trình thực thi nghiệp vụ chi tiết:\n"
        "1. Khởi tạo: Thu ngân chọn sản phẩm với số lượng Q. POS View gửi request POST /api/sales kèm mảng items.\n"
        "2. Kiểm soát giao dịch: SalesController ủy quyền cho ProcessFefoSaleUseCase mở BEGIN TRANSACTION.\n"
        "3. Khóa chống Race Condition: Truy vấn BatchRepository với gợi ý (UPDLOCK, ROWLOCK) theo thứ tự ExpiryDate ASC. "
        "Khóa dòng đảm bảo không có giao dịch thanh toán hoặc điều chỉnh kho song song nào có thể đọc/ghi đè cùng lô.\n"
        "4. Rẽ nhánh an toàn (alt): Nếu tổng tồn khả dụng < Q, UseCase kích hoạt ROLLBACK TRANSACTION và trả lỗi HTTP 400 "
        "ngăn chặn triệt để hiện tượng Tồn kho âm (Rule 3).\n"
        "5. Vòng lặp bẻ lô (loop): UseCase lặp qua các lô có hạn dùng gần nhất, xuất tối đa số lượng có thể của lô hiện tại, "
        "áp dụng đơn giá chiết khấu Quick Markdown (15% - 50%) nếu lô đang gắn tag xả hàng, và tiếp tục lấy lượng còn thiếu từ các lô kế tiếp.\n"
        "6. Hạch toán & Kiểm toán: Ghi nhận chi tiết vào SalesHistory kèm cờ ngoại cảnh và ghi nhật ký vào AuditLogs.\n"
        "7. Hoàn tất: COMMIT TRANSACTION xuống SQL Server, trả mã HTTP 200, POS View in hóa đơn cho khách hàng."
    )
    r_desc1.font.name = "Times New Roman"
    r_desc1.font.size = Pt(11)

    # 4. Phần 3: Sơ đồ tuần tự 2 - Tiếp nhận DC
    doc.add_page_break()
    h3 = doc.add_heading(level=1)
    r = h3.add_run("3. SƠ ĐỒ TUẦN TỰ 2: TIẾP NHẬN HÀNG TỪ KHO TỔNG DC (RECEIVE DC BATCH)")
    r.font.name = "Times New Roman"
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(15, 118, 110)

    # Chèn ảnh 2
    img2_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Diagram_Images", "sequence_dc_intake.png"))
    if os.path.exists(img2_path):
        p_img2 = doc.add_paragraph()
        p_img2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img2.paragraph_format.space_before = Pt(8)
        p_img2.paragraph_format.space_after = Pt(4)
        run_img2 = p_img2.add_run()
        run_img2.add_picture(img2_path, width=Inches(6.5))

        p_cap2 = doc.add_paragraph()
        p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap2.paragraph_format.space_after = Pt(12)
        r_cap2 = p_cap2.add_run("Hình 2: Sơ đồ Tuần tự Luồng Tiếp nhận Hàng DC Thẩm định Chuẩn RSL >= 70% (UML Sequence Diagram)")
        r_cap2.font.name = "Times New Roman"
        r_cap2.font.size = Pt(10)
        r_cap2.font.bold = True
        r_cap2.font.italic = True
        r_cap2.font.color.rgb = RGBColor(71, 85, 105)

    # Bảng lifelines 2
    p_t2_title = doc.add_paragraph()
    r_t2_title = p_t2_title.add_run("Bảng 2: Phân tích vai trò và trách nhiệm các Lifeline trong luồng Tiếp nhận hàng DC")
    r_t2_title.font.name = "Times New Roman"
    r_t2_title.font.size = Pt(11)
    r_t2_title.font.bold = True

    t2_headers = ["Tên Lifeline", "Tầng Kiến trúc", "Vai trò & Trách nhiệm kỹ thuật"]
    t2_widths = [1.8, 1.8, 2.9]
    t2_data = [
        ["Warehouse Staff", "Actor", "Nhân viên kho kiểm đếm hàng thực tế giao từ xe tải DC Biên Hòa."],
        ["GoodsReceipt View", "Presentation", "Giao diện web nhập MFG, EXP, số lượng giao Q và giá nhập vốn."],
        ["BatchController", "Presentation", "Tiếp nhận HTTP POST /api/batches/receive-inbound hoặc /reject-inbound, kiểm tra định dạng và phân quyền kho."],
        ["ReceiveDCBatchUseCase / RejectDCBatchUseCase", "Application", "Điều phối tiếp nhận hàng chuẩn RSL >= 70% hoặc lập biên bản từ chối nhận hàng DC."],
        ["Batch Domain Entity", "Domain", "Thực thể chứa logic nghiệp vụ thuần túy: tính RSL %, thẩm định ngưỡng >= 70%."],
        ["BatchRepository", "Infrastructure", "Thực thi INSERT lô hàng mới vào bảng Batches, cập nhật giá vốn Products."],
        ["AuditLogRepository", "Infrastructure", "Ghi vết kiểm toán nhập hàng (RECEIVE_DC_INBOUND / REJECT_DC_INBOUND) đối soát công nợ DC."],
        ["SQL Server LocalDB", "Database", "Kiểm tra ràng buộc duy nhất BatchCode, khóa CHECK và lưu trữ vật lý an toàn."]
    ]
    table2 = doc.add_table(rows=len(t2_data) + 1, cols=3)
    format_table(table2, t2_widths, t2_headers, t2_data, header_bg="0D9488", alt_bg="F0FDFA")

    # Diễn giải luồng tiếp nhận
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    p_desc2 = doc.add_paragraph()
    p_desc2.paragraph_format.line_spacing = 1.2
    r_desc2 = p_desc2.add_run(
        "Diễn giải quy trình kiểm soát chất lượng tiếp nhận hàng DC chi tiết:\n"
        "1. Kê khai thông tin: Nhân viên kho nhập MFG, EXP, Số lượng Q, Giá vốn trên GoodsReceipt View và bấm Kiểm định & Nhập kho (gửi request POST /api/batches/receive-inbound).\n"
        "2. Kiểm định tầng Domain: ReceiveDCBatchUseCase khởi tạo Batch Entity. Domain Entity tự động tính tỷ lệ Vòng đời sử dụng còn lại:\n"
        "       RSL_inbound = (ExpiryDate - ReceiptDate) / (ExpiryDate - ManufactureDate) * 100%\n"
        "3. Rẽ nhánh kiểm soát chất lượng (alt - Check RSL >= 70%):\n"
        "   • Nhánh BỊ TỪ CHỐI (RSL < 70%): Domain Entity ném ngoại lệ InboundQualityException. "
        "UseCase bắt lỗi, hủy quy trình nhập, trả HTTP 422 Unprocessable Entity kèm cảnh báo đỏ. "
        "Nhân viên kho gửi POST /api/batches/reject-inbound, RejectDCBatchUseCase lưu biên bản REJECT_DC_INBOUND vào AuditLogs. "
        "Cửa hàng kiên quyết từ chối nhận hàng để ngăn chặn việc DC đùn đẩy hàng cận date.\n"
        "   • Nhánh ĐƯỢC CHẤP NHẬN (RSL >= 70%): Domain Entity phê duyệt. UseCase tự động sinh mã định danh lô chuẩn hóa: "
        "LOT-DC-[SKU]-[YYYYMMDD]-[SEQ], gán InitialQuantity = CurrentQuantity = Q, is_shelf_rotated = 0.\n"
        "4. Lưu trữ & Cập nhật: BatchRepository lưu bản ghi lô mới vào bảng Batches, cập nhật giá vốn tham chiếu vào bảng Products.\n"
        "5. Kiểm toán: AuditLogRepository ghi sự kiện tiếp nhận thành công vào AuditLogs.\n"
        "6. Hoàn tất: Trả mã HTTP 201 Created. Giao diện hiển thị thông báo nhập kho thành công và cho phép in tem mã vạch dán kiện hàng."
    )
    r_desc2.font.name = "Times New Roman"
    r_desc2.font.size = Pt(11)

    # 5. Phần 4: Kết luận & Đóng góp
    h4 = doc.add_heading(level=1)
    r = h4.add_run("4. KẾT LUẬN VÀ GIÁ TRỊ THỰC TIỄN CỦA THIẾT KẾ")
    r.font.name = "Times New Roman"
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(15, 118, 110)

    p_conc = doc.add_paragraph()
    p_conc.paragraph_format.line_spacing = 1.2
    r_conc = p_conc.add_run(
        "Hai sơ đồ tuần tự được xây dựng chặt chẽ theo chuẩn UML 2.5 và Clean Architecture đã giải quyết triệt để "
        "những bài toán hóc búa nhất của mô hình bán lẻ tiện lợi chống lãng phí:\n"
        "1. Bảo toàn dòng tiền: Loại bỏ hoàn toàn thất thoát do bán nhầm hàng date xa hoặc tiếp nhận hàng cận date từ nhà cung ứng.\n"
        "2. Đảm bảo tính toàn vẹn hệ thống: Ứng dụng Transaction mức cơ sở dữ liệu kết hợp khóa UPDLOCK, ROWLOCK loại trừ race condition.\n"
        "3. Minh chứng học thuật xuất sắc: Thể hiện tư duy phân tích hệ thống bài bản, đáp ứng toàn diện các tiêu chí đánh giá đồ án tốt nghiệp "
        "ngành Công nghệ Thông tin tại Trường Đại học Lạc Hồng."
    )
    r_conc.font.name = "Times New Roman"
    r_conc.font.size = Pt(11.5)

    out_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Word_Documents", "THUYET_MINH_CHI_TIET_SO_DO_TUAN_TU.docx"))
    doc.save(out_file)
    print(f"XUAT THANH CONG FILE WORD: {out_file}")

if __name__ == "__main__":
    build_sequence_word_doc()
