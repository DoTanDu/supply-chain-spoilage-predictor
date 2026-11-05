# -*- coding: utf-8 -*-
"""
Script to generate the Official Software Requirements Specification (SRS) Document (.docx)
Tailored 100% to the graduation project:
"NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ (SUPPLY CHAIN SPOILAGE PREDICTOR)"
Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU)
GVHD: ThS. Lê Minh Nhật
Sinh viên thực hiện: Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946)
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=70, bottom=70, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_header_inst(doc):
    p = doc.add_paragraph()
    r = p.add_run("TRƯỜNG ĐẠI HỌC LẠC HỒNG (LHU) - KHOA CÔNG NGHỆ THÔNG TIN\n---***---")
    r.font.bold = True
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(100, 116, 139)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

def add_doc_title(doc, title, subtitle):
    p1 = doc.add_paragraph()
    p1.paragraph_format.space_before = Pt(14)
    p1.paragraph_format.space_after = Pt(2)
    r1 = p1.add_run(title)
    r1.font.bold = True
    r1.font.size = Pt(16)
    r1.font.color.rgb = RGBColor(15, 76, 129)
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER

    p2 = doc.add_paragraph()
    p2.paragraph_format.space_after = Pt(16)
    r2 = p2.add_run(subtitle)
    r2.font.italic = True
    r2.font.size = Pt(10.5)
    r2.font.color.rgb = RGBColor(71, 85, 105)
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER

def add_part_header(doc, part_title):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(part_title)
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(180, 83, 9) # Amber 700
    return p

def add_sec(doc, title):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(13)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(title)
    r.font.bold = True
    r.font.size = Pt(11.5)
    r.font.color.rgb = RGBColor(15, 76, 129)
    return p

def add_subsec(doc, title):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(title)
    r.font.bold = True
    r.font.size = Pt(10.5)
    r.font.color.rgb = RGBColor(16, 140, 90)
    return p

def add_p(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run(text)
    r.font.size = Pt(10)
    return p

def add_code(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run(text)
    r.font.name = 'Consolas'
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor(30, 41, 59)
    return p

def add_bullet_list(doc, items):
    for item in items:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.12
        r = p.add_run(item)
        r.font.size = Pt(9.5)

def create_table(doc, headers, data, widths):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "0F4C81")
        set_cell_margins(hdr_cells[i], top=80, bottom=80, left=90, right=90)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            r.font.size = Pt(9)

    for row_idx, row_data in enumerate(data):
        row = table.add_row()
        bg_col = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, cell_value in enumerate(row_data):
            cell = row.cells[col_idx]
            cell.text = str(cell_value)
            set_cell_background(cell, bg_col)
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            if col_idx in (0, len(row_data)-1) and len(str(cell_value)) < 15:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.size = Pt(8.5)
                r.font.color.rgb = RGBColor(30, 41, 59)

    for i, width in enumerate(widths):
        for row in table.rows:
            row.cells[i].width = Inches(width)

    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_after = Pt(6)
    return table

def build_official_srs_document():
    doc = docx.Document()

    # Set page margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Header
    add_header_inst(doc)

    # Document Title
    add_doc_title(
        doc,
        "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)\nNỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ\n(SUPPLY CHAIN SPOILAGE PREDICTOR)",
        "Đề tài tốt nghiệp ngành Công nghệ Thông tin - Kiến trúc Clean Architecture, Cơ sở dữ liệu SQL Server LocalDB và Khung phát triển Agile Scrum\nGiảng viên hướng dẫn: ThS. Lê Minh Nhật | Nhóm sinh viên thực hiện: Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946)"
    )

    # Metadata Table
    meta_headers = ["Thông tin dự án", "Nội dung chi tiết"]
    meta_data = [
        ["Tên đề tài chính thức", "Nền tảng Quản trị Chuỗi cung ứng Bán lẻ Chống lãng phí (Supply Chain Spoilage Predictor)"],
        ["Đơn vị đào tạo", "Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU)"],
        ["Giảng viên hướng dẫn", "ThS. Lê Minh Nhật"],
        ["Nhóm sinh viên thực hiện", "Đỗ Tấn Du (MSSV: 123001364) & Đoàn Minh Quân (MSSV: 123000946)"],
        ["Mô hình nghiên cứu", "Cửa hàng bán lẻ tinh gọn (Retail Store) chuyên ngành FMCG và Thực phẩm tươi/mát"],
        ["Công nghệ nền tảng", "Backend: Node.js / Express (Clean Architecture) | Frontend: ReactJS / Vite | CSDL: Microsoft SQL Server LocalDB"],
        ["Quy chuẩn cơ sở dữ liệu", "Microsoft SQL Server LocalDB (localdb)\\mssqllocaldb, Database: retail_spoilage_db (12 bảng chuẩn 3NF)"],
        ["Phương pháp luận", "Agile Scrum (Sprint 1: Nền tảng & Cấu hình -> Sprint 2: Nghiệp vụ cốt lõi -> Sprint 3: Tiêu hủy & Điều hành -> Sprint 4: Dự báo AI)"]
    ]
    create_table(doc, meta_headers, meta_data, [2.3, 4.5])

    # =========================================================================
    # PHẦN I: TỔNG QUAN & BỐI CẢNH DỰ ÁN
    # =========================================================================
    add_part_header(doc, "PHẦN I: TỔNG QUAN & BỐI CẢNH DỰ ÁN")

    add_sec(doc, "1. Mục tiêu và Lý do phát triển hệ thống")
    add_p(doc, "Trong các chuỗi cửa hàng bán lẻ tiện lợi và siêu thị mini (như Bách Hóa Xanh, WinMart+, Co.op Food), lãng phí thực phẩm do hết hạn sử dụng (spoilage) gây thất thoát trung bình từ 4% đến 8% doanh thu. Nguyên nhân cốt lõi bao gồm:")
    add_bullet_list(doc, [
        "Quản lý hạn sử dụng thủ công bằng sổ sách hoặc trí nhớ nhân viên, dẫn đến bỏ quên các lô hàng nằm khuất sâu trong góc kệ.",
        "Thiếu cơ chế cảnh báo sớm đa cấp: Khi phát hiện hàng cận date thì chỉ còn 1-2 ngày, không kịp triển khai biện pháp xả hàng giảm giá.",
        "Xuất bán không tuân thủ nguyên tắc FEFO (First Expired, First Out): Thu ngân thường lấy tiện tay lô hàng mới nhập, khiến lô cũ bị tồn đọng và quá hạn.",
        "Quy trình tiêu hủy thiếu minh bạch, không hạch toán kịp thời vào sổ hao hụt tài chính để ban giám đốc nắm bắt tỷ lệ tổn thất."
    ])
    add_p(doc, "Mục tiêu của dự án là xây dựng một nền tảng quản trị chuỗi cung ứng bán lẻ chuyên sâu, ứng dụng Clean Architecture và cơ sở dữ liệu Microsoft SQL Server, nhằm giải quyết triệt để bài toán chống lãng phí thông qua: (1) Quản lý vòng đời lô hàng theo Shelf-Life, (2) Cơ chế cảnh báo cận date 3 tầng (Xanh - Vàng - Đỏ), (3) Bán lẻ tại quầy POS tích hợp tự động trừ kho FEFO, (4) Tiêu hủy hàng hỏng và hạch toán tài chính minh bạch, và (5) Đề xuất điểm tái đặt hàng ROP gửi Kho tổng DC.")

    add_sec(doc, "2. Phạm vi hệ thống (System Scope)")
    add_p(doc, "Theo định hướng chỉ đạo chiến lược của GVHD ThS. Lê Minh Nhật, hệ thống được khoanh vùng chuẩn xác vào mô hình Cửa hàng Bán lẻ tinh gọn (Single Retail Store) nhằm tối ưu hiệu quả và tránh lan man:")
    add_subsec(doc, "2.1 Phạm vi thực hiện (In-Scope)")
    add_bullet_list(doc, [
        "Tiếp nhận hàng theo từng đợt từ Kho tổng (DC - Distribution Center) và lưu trữ thông tin theo từng Lô hàng (Batch Code, Số lượng, NSX, HSD).",
        "Theo dõi vòng đời sử dụng (Shelf-life) và chỉ số phần trăm hạn dùng còn lại (% RSL - Remaining Shelf Life).",
        "Hệ thống cảnh báo cận date đa tầng thời gian thực theo bảng mã màu trực quan: Xanh (An toàn) -> Vàng (Lưu ý) -> Đỏ (Cận date khẩn cấp) -> Đen/Tím (Hết hạn).",
        "Quy trình bán lẻ tại quầy thu ngân (POS): Tự động trừ kho theo nguyên tắc FEFO (lô nào hết hạn trước thì ưu tiên trừ trước). Bán hàng ra chính là xuất kho.",
        "Quy trình ghi nhận tiêu hủy hàng hư hỏng/hết hạn và tự động hạch toán chi phí thiệt hại vào Sổ hao hụt tài chính của cửa hàng.",
        "Cơ chế tính toán Điểm đặt hàng lại (Reorder Point - ROP) và phát hiện nguy cơ hàng bán chậm (DOS > DUE) để đề xuất đơn hàng mới gửi Kho tổng DC.",
        "Dashboard điều hành tổng quan và hệ thống nhật ký kiểm toán (System Audit Logs) bất biến."
    ])
    add_subsec(doc, "2.2 Phạm vi loại trừ (Out-of-Scope)")
    add_bullet_list(doc, [
        "Tuyệt đối không xây dựng quy trình điều chuyển hàng hóa ngang giữa các cửa hàng vệ tinh (Inter-shop transfer).",
        "Không xây dựng thủ tục giấy tờ trả hàng ngược về nhà sản xuất/nhà cung cấp phức tạp (Return-to-Vendor paperwork).",
        "Chưa tích hợp mô hình Machine Learning dự báo nhu cầu sâu ngay từ đầu; tính năng AI dự báo sẽ được coi là một Module độc lập (Module 9) phát triển bổ sung sau khi toàn bộ quy trình quản lý bán lẻ cốt lõi đã chạy ổn định 100%."
    ])

    add_sec(doc, "3. Đặc điểm cốt lõi của bài toán Bán lẻ Chống lãng phí")
    add_bullet_list(doc, [
        "Mô hình Cửa hàng bán lẻ duy nhất (Single Store Profile): Tất cả sản phẩm, lô hàng, giao dịch POS và sổ hao hụt đều gắn liền với một cửa hàng cụ thể, không cần xử lý định tuyến đa chi nhánh phức tạp.",
        "Nguyên tắc 'Bán hàng = Xuất kho': Cửa hàng bán lẻ không có quy trình xuất kho nội bộ riêng. Mỗi hóa đơn thanh toán thành công tại POS tự động kích hoạt tiến trình xuất kho FEFO.",
        "Ràng buộc 'Tuyệt đối không để xảy ra âm kho': Hệ thống kiểm tra nghiêm ngặt số lượng tồn kho khả dụng trước khi trừ; nếu không đủ hàng thì giao dịch bị từ chối.",
        "Chuẩn hóa dữ liệu trên Microsoft SQL Server LocalDB: Sử dụng schema quan hệ chuẩn 3NF, kiểu dữ liệu NVARCHAR với N'...' tiếng Việt UTF-8 có dấu, ràng buộc khóa ngoại FOREIGN KEY, ràng buộc CHECK và kiểm soát giao dịch bằng Transaction T-SQL."
    ])

    # =========================================================================
    # PHẦN II: TỔ CHỨC VẬN HÀNH & PHÂN QUYỀN
    # =========================================================================
    add_part_header(doc, "PHẦN II: TỔ CHỨC VẬN HÀNH & PHÂN QUYỀN")

    add_sec(doc, "4. Đối tượng người dùng & Ma trận phân quyền (User Roles & Permissions)")
    add_p(doc, "Hệ thống phân định rõ 2 nhóm đối tượng người dùng chính trong cửa hàng bán lẻ:")
    add_subsec(doc, "4.1 Cửa hàng trưởng (Store Manager)")
    add_bullet_list(doc, [
        "Xem toàn bộ Dashboard điều hành kinh doanh và chỉ số hao hụt tài chính.",
        "Quản lý danh mục ngành hàng, sản phẩm và thiết lập ngưỡng cảnh báo date.",
        "Phê duyệt các biên bản tiêu hủy hàng hỏng/quá hạn và ký nhận sổ hao hụt.",
        "Kích hoạt chính sách xả hàng giảm giá (Quick Discount) cho các lô cận date.",
        "Xem xét và duyệt gửi đơn đề xuất đặt hàng mới (Purchase Order) về Kho tổng DC.",
        "Quản lý danh sách nhân viên, cấp tài khoản và tra cứu nhật ký kiểm toán hệ thống."
    ])
    add_subsec(doc, "4.2 Nhân viên bán hàng & Kho (Store Staff / Cashier)")
    add_bullet_list(doc, [
        "Thực hiện quét mã sản phẩm và thanh toán bán lẻ tại quầy POS.",
        "Tiếp nhận hàng từ Kho tổng DC: Kiểm tra ngoại quan, ngày sản xuất, hạn sử dụng và nhập lô vào phần mềm.",
        "Theo dõi danh sách cảnh báo FEFO để thực hiện đảo hàng (đưa lô cận date ra trước kệ trưng bày).",
        "Lập phiếu đề xuất tiêu hủy khi phát hiện hàng hỏng, bao bì rách nát hoặc quá hạn sử dụng.",
        "Xem lịch sử các ca bán hàng của cá nhân."
    ])

    add_subsec(doc, "4.3 Ma trận phân quyền chức năng chi tiết (RBAC)")
    perm_headers = ["Chức năng nghiệp vụ", "Store Manager", "Store Staff", "Ghi chú phân quyền"]
    perm_data = [
        ["Đăng nhập hệ thống", "Có", "Có", "Xác thực qua JWT Token"],
        ["Xem Dashboard điều hành & KPI", "Toàn quyền", "Giới hạn", "Staff chỉ thấy cảnh báo date và tồn kho"],
        ["Quản lý Danh mục & Sản phẩm", "Thêm/Sửa/Khóa", "Chỉ xem", "Chỉ Manager mới được sửa giá bán/giá vốn"],
        ["Tiếp nhận hàng từ Kho tổng DC", "Duyệt & Nhập", "Tạo phiếu nhập", "Staff kiểm đếm thực tế, Manager giám sát"],
        ["Giám sát Hạn sử dụng & Cảnh báo FEFO", "Toàn quyền", "Toàn quyền", "Hiển thị màu trực quan để đảo hàng"],
        ["Kích hoạt Giảm giá xả hàng (Flash Sale)", "Có", "Không", "Chiết khấu 20% - 50% cho lô cận date"],
        ["Bán hàng tại quầy POS", "Có", "Toàn quyền", "Tự động trừ kho FEFO theo lô cận date nhất"],
        ["Lập phiếu đề xuất tiêu hủy hàng hỏng", "Có", "Có", "Staff phát hiện lập phiếu biên bản sự cố"],
        ["Phê duyệt tiêu hủy & Hạch toán hao hụt", "Có", "Không", "Chỉ Manager mới có thẩm quyền hủy kho"],
        ["Tính toán ROP & Đề xuất đặt hàng DC", "Duyệt gửi đơn", "Chỉ xem", "Thuật toán ROP = (d x L) + SS"],
        ["Tra cứu Nhật ký kiểm toán (Audit Logs)", "Có", "Không", "Lưu vết IP, người thực hiện, thời gian"]
    ]
    create_table(doc, perm_headers, perm_data, [2.3, 1.2, 1.2, 2.1])

    # =========================================================================
    # PHẦN III: QUẢN LÝ DỮ LIỆU CỐT LÕI (MASTER DATA)
    # =========================================================================
    add_part_header(doc, "PHẦN III: QUẢN LÝ DỮ LIỆU CỐT LÕI (MASTER DATA)")

    add_sec(doc, "5. Cấu hình Cửa hàng & Tham số Vận hành (Store Profile & System Settings)")
    add_p(doc, "Hệ thống quản lý một cửa hàng bán lẻ duy nhất với cấu hình tham số tập trung lưu trong bảng system_settings:")
    add_bullet_list(doc, [
        "Mã cửa hàng: STORE-LHU-01 (Siêu thị Tiện lợi Bán lẻ Thực nghiệm LHU).",
        "Địa chỉ: Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai.",
        "Quản lý trưởng: Đỗ Tấn Du (Store Manager).",
        "DEFAULT_WARNING_DAYS: 7 ngày (Ngưỡng cảnh báo cận date mặc định nếu sản phẩm không có cấu hình riêng).",
        "YELLOW_RSL_THRESHOLD: 20% (Ngưỡng kích hoạt cảnh báo Vàng - Cần lưu ý đảo kệ).",
        "RED_RSL_THRESHOLD: 10% (Ngưỡng kích hoạt cảnh báo Đỏ - Khẩn cấp xả hàng).",
        "DEFAULT_LEAD_TIME_DAYS: 1 ngày (Thời gian giao hàng tiêu chuẩn từ Kho tổng DC về cửa hàng)."
    ])

    add_sec(doc, "6. Quản lý Danh mục Ngành hàng & Sản phẩm FMCG (Categories & Products)")
    add_p(doc, "Hệ thống phân loại sản phẩm bán lẻ theo 5 ngành hàng FMCG chủ lực có nguy cơ hư hỏng cao:")
    add_bullet_list(doc, [
        "DAIRY (Sữa & Chế phẩm từ sữa): Sữa chua, sữa tươi thanh trùng, phô mai (HSD ngắn: 14 - 45 ngày).",
        "BEVERAGE (Đồ uống & Giải khát): Nước ép trái cây tươi, trà sữa đóng chai, nước khoáng (HSD: 30 - 180 ngày).",
        "SNACK (Bánh kẹo & Ăn vặt): Bánh mì tươi, sandwich, snack khoai tây (HSD: 7 - 60 ngày).",
        "FRESH (Thực phẩm mát & Chế biến sẵn): Xúc xích tươi, cơm cuộn, salad đóng hộp (HSD cực ngắn: 3 - 7 ngày).",
        "CANNED (Đồ hộp & Gia vị bảo quản): Cá hộp, sốt cà chua đóng chai (HSD dài: 180 - 365 ngày)."
    ])
    add_p(doc, "Cơ sở dữ liệu mẫu hiện đang quản lý chính xác 23 sản phẩm thực tế, có đầy đủ SKU, đơn vị tính, giá vốn nhập, giá niêm yết bán lẻ, hạn sử dụng tiêu chuẩn và ngưỡng tồn kho an toàn Min/Max.")

    add_sec(doc, "7. Quản lý Kho tổng & Nhà cung cấp liên kết (DC Suppliers)")
    add_p(doc, "Cửa hàng nhận hàng từ Kho tổng DC chính và các nhà cung cấp phân phối uy tín:")
    add_bullet_list(doc, [
        "DC-CENTRAL: Kho Tổng Phân Phối Miền Đông (Lead time: 1 ngày).",
        "VINAMILK-DIST: Nhà phân phối sữa Vinamilk & TH True Milk (Lead time: 1 ngày).",
        "ORION-DIST: Nhà phân phối Bánh kẹo & Snack Orion / Kinh Đô (Lead time: 2 ngày).",
        "COCA-DIST: Nhà phân phối Nước giải khát Coca-Cola & Pepsi (Lead time: 1 ngày)."
    ])

    # =========================================================================
    # PHẦN IV: CÁC QUY TRÌNH NGHIỆP VỤ BÁN LẺ CHỐNG LÃNG PHÍ
    # =========================================================================
    add_part_header(doc, "PHẦN IV: CÁC QUY TRÌNH NGHIỆP VỤ BÁN LẺ CHỐNG LÃNG PHÍ")

    add_sec(doc, "8. Quản lý Lô hàng & Giám sát Hạn sử dụng Đa tầng (Batch & Shelf-Life Lifecycle)")
    add_p(doc, "Mỗi sản phẩm nhập về cửa hàng đều được quản lý độc lập theo từng Lô hàng (Batch). Đây là hạt nhân để giải quyết bài toán chống lãng phí.")
    add_subsec(doc, "8.1 Các trạng thái của Lô hàng (Batch Statuses)")
    add_bullet_list(doc, [
        "ACTIVE (Đang bán bình thường): Hạn dùng còn dài, chất lượng đảm bảo.",
        "WARNING (Cảnh báo cận date): Lô hàng chạm ngưỡng Vàng hoặc Đỏ. Cần ưu tiên đưa ra mặt tiền kệ hoặc giảm giá.",
        "EXPIRED (Đã hết hạn sử dụng): Số ngày còn lại <= 0. Khóa bán ngay lập tức trên hệ thống POS.",
        "DISPOSED (Đã tiêu hủy): Lô hàng đã được lập biên bản tiêu hủy và trừ sạch tồn kho về 0."
    ])

    add_subsec(doc, "8.2 Công thức tính Tỷ lệ Thời hạn Sử dụng Còn lại (% RSL)")
    add_p(doc, "Chỉ số Remaining Shelf Life (% RSL) đo lường chính xác tỷ lệ phần trăm tuổi thọ còn lại của lô hàng:")
    add_code(doc, "               (ExpiryDate - CurrentDate)\n   % RSL = ---------------------------------  x 100%\n            (ExpiryDate - ManufactureDate)\n\n   Trong đó:\n   - DaysRemaining = DATEDIFF(day, CurrentDate, ExpiryDate)\n   - TotalShelfLife = DATEDIFF(day, ManufactureDate, ExpiryDate)")

    add_subsec(doc, "8.3 Tiêu chí phân vùng Cảnh báo Cận date Đa tầng")
    rsl_headers = ["Vùng cảnh báo", "Điều kiện kích hoạt", "Trạng thái trên UI", "Hành động vận hành bắt buộc"]
    rsl_data = [
        ["VÙNG XANH (An toàn)", "% RSL > 20% VÀ DaysRemaining > 7", "Huy hiệu Xanh (Emerald)", "Trưng bày bán bình thường theo giá niêm yết."],
        ["VÙNG VÀNG (Lưu ý)", "10% < % RSL <= 20% HOẶC 4 <= DaysRemaining <= 7", "Huy hiệu Vàng (Amber)", "Nhân viên kiểm tra hạn, đảo lô hàng này ra phía trước kệ."],
        ["VÙNG ĐỎ (Khẩn cấp)", "% RSL <= 10% HOẶC 1 <= DaysRemaining <= 3", "Huy hiệu Đỏ (Rose/Red)", "Kích hoạt chính sách giảm giá (Quick Discount 20% - 50%)."],
        ["VÙNG HẾT HẠN (Quá date)", "DaysRemaining <= 0", "Huy hiệu Xám/Đen (Expired)", "Khóa bán trên POS, rút khỏi kệ trưng bày, lập phiếu tiêu hủy."]
    ]
    create_table(doc, rsl_headers, rsl_data, [1.5, 1.8, 1.4, 2.1])

    add_sec(doc, "9. Quy trình Tiếp nhận Hàng hóa từ Kho tổng DC (Goods Receipts)")
    add_p(doc, "Quy trình kiểm soát chất lượng đầu vào chặt chẽ khi xe giao hàng từ Kho tổng DC cập bến cửa hàng:")
    add_bullet_list(doc, [
        "Bước 1: Nhân viên đối chiếu Phiếu giao hàng của tài xế DC với số lượng thùng thực tế.",
        "Bước 2: Kiểm tra vật lý hạn sử dụng in trên bao bì sản phẩm (NSX và HSD).",
        "Bước 3: Mở màn hình 'Tiếp nhận DC' trên phần mềm, chọn Nhà cung cấp, nhập Mã lô, Ngày sản xuất, Hạn sử dụng, Số lượng và Đơn giá vốn.",
        "Bước 4: Hệ thống thực hiện kiểm tra ràng buộc: ExpiryDate phải lớn hơn ManufactureDate và ExpiryDate phải lớn hơn ReceiptDate.",
        "Bước 5: Bấm 'Xác nhận nhập kho': Hệ thống tạo bản ghi goods_receipts, chèn các lô mới vào bảng batches và ghi System Audit Log."
    ])

    add_sec(doc, "10. Quy trình Bán lẻ tại quầy POS & Thuật toán Tự động Xuất kho FEFO")
    add_p(doc, "Bán lẻ ra cho người tiêu dùng chính là hành động Xuất kho. Hệ thống loại bỏ hoàn toàn các phiếu xuất kho thủ công rườm rà.")
    add_subsec(doc, "10.1 Thuật toán Xuất kho FEFO Tự động (First Expired, First Out)")
    add_p(doc, "Khi khách hàng đem giỏ hàng đến quầy thu ngân:")
    add_bullet_list(doc, [
        "1. Thu ngân quét mã vạch SKU sản phẩm và nhập số lượng khách mua (Q_order).",
        "2. Hệ thống kiểm tra tổng tồn khả dụng của sản phẩm đó: SUM(current_quantity) của các lô có status IN ('ACTIVE', 'WARNING') và ExpiryDate >= Today. Nếu Tổng tồn < Q_order -> Báo lỗi chặn giao dịch (Không bao giờ để âm kho).",
        "3. Hệ thống tự động truy vấn các lô hàng khả dụng, sắp xếp ưu tiên theo hạn sử dụng tăng dần: ORDER BY expiry_date ASC, id ASC.",
        "4. Tiến hành vòng lặp trừ kho FEFO:",
        "   - Lấy lô có date gần nhất (Batch 1 có tồn Q1).",
        "   - Nếu Q1 >= Q_order: Trừ lô 1: Q1_new = Q1 - Q_order. Lưu bản ghi sales_history. Hoàn thành đơn hàng.",
        "   - Nếu Q1 < Q_order: Trừ sạch lô 1 về 0 (Q1_new = 0, status chuyển sang COMPLETED/EXHAUSTED). Số lượng còn thiếu Q_remain = Q_order - Q1 tiếp tục được trừ tự động sang Lô 2 có hạn kế tiếp.",
        "5. Giao dịch được thực thi trọn vẹn trong một SQL Transaction để đảm bảo tính toàn vẹn tuyệt đối."
    ])
    add_subsec(doc, "10.2 Ghi nhận Ngữ cảnh Bán hàng phục vụ Dự báo AI")
    add_p(doc, "Mỗi hóa đơn bán lẻ lưu trữ thêm 2 tham số quan trọng trong sales_history: weather (SUNNY, RAINY, NORMAL) và is_holiday (0 hoặc 1). Đây là dữ liệu sạch chuẩn bị sẵn để cung cấp cho Module 9 (AI Reorder Predictor) sau này.")

    add_sec(doc, "11. Quy trình Xử lý Hàng Cận date & Kích hoạt Xả hàng Giảm giá")
    add_p(doc, "Để chủ động kích cầu tiêu thụ trước khi hàng chạm ngưỡng quá hạn:")
    add_bullet_list(doc, [
        "Khi một lô hàng rơi vào Vùng Cảnh báo Đỏ (<= 3 ngày hoặc <= 10% RSL), phần mềm hiển thị nút 'Giảm giá xả hàng' (Quick Discount).",
        "Cửa hàng trưởng chọn mức chiết khấu phù hợp: 20%, 30% hoặc 50%.",
        "Hệ thống cập nhật discount_percent của lô hàng đó trong bảng batches.",
        "Tại quầy POS, khi bán sản phẩm từ lô này, giá bán được tự động tính theo công thức: Giá bán = Giá niêm yết x (100 - discount_percent) / 100.",
        "Trên kệ hàng, nhân viên in tem giá khuyến mãi dán lên sản phẩm để người mua ưu tiên lựa chọn."
    ])

    add_sec(doc, "12. Quy trình Tiêu hủy Hàng hỏng/Quá hạn & Hạch toán Hao hụt Tài chính (Spoilage Management)")
    add_p(doc, "Trường hợp hàng hóa không kịp bán hết trước khi hết date, hoặc bị hư hỏng trong quá trình vận hành (chuột cắn, rách bao bì, sữa chua bị phồng chua):")
    add_bullet_list(doc, [
        "1. Phát hiện & Lập biên bản: Nhân viên nhặt sản phẩm lỗi ra khỏi kệ, kiểm tra mã lô, nhập số lượng cần hủy và chọn lý do (EXPIRED: Hết hạn sử dụng, DAMAGED: Hư hỏng vật lý/rách nát, SPOILED: Biến chất do nhiệt độ bảo quản).",
        "2. Kiểm tra thẩm quyền: Biên bản tiêu hủy bắt buộc phải do Cửa hàng trưởng phê duyệt.",
        "3. Tự động tính tổn thất tài chính:\n   Chi phí thiệt hại (cost_loss) = quantity_disposed x Giá vốn nhập (import_price).",
        "4. Cập nhật kho: Trừ sạch số lượng tiêu hủy khỏi current_quantity của lô hàng. Nếu tồn về 0, chuyển status của lô sang DISPOSED.",
        "5. Lưu sổ hao hụt: Lưu bản ghi vào bảng spoilage_records và cập nhật chỉ số Spoilage Rate % trên Dashboard điều hành."
    ])

    add_sec(doc, "13. Cơ chế Đề xuất Tái đặt hàng (Reorder Point - ROP) & Module Dự báo Nhu cầu")
    add_p(doc, "Để đảm bảo cửa hàng không bị đứt gãy nguồn cung mà vẫn không bị ứ đọng hàng dẫn đến hết date, hệ thống áp dụng công thức ROP:")
    add_code(doc, "   ROP = (d x L) + SS\n\n   Trong đó:\n   - d : Tốc độ bán bình quân mỗi ngày (Daily Velocity = Tổng bán 14 ngày qua / 14)\n   - L : Lead time giao hàng từ Kho tổng DC (mặc định 1 - 2 ngày)\n   - SS : Tồn kho an toàn dự phòng (Safety Stock = 1.65 x Độ lệch chuẩn nhu cầu x sqrt(L))")
    add_p(doc, "Ngoài ra, hệ thống tích hợp Bộ cảnh báo Rủi ro Kép (Double Spoilage Check):")
    add_bullet_list(doc, [
        "Tính số ngày bán hết hàng tồn (Days of Supply): DOS = Tồn kho hiện tại / d.",
        "Tính số ngày còn lại đến hạn sử dụng của lô gần nhất: DUE = ExpiryDate - Today.",
        "Nếu DOS > DUE: Hệ thống phát tín hiệu CẢNH BÁO NGUY CƠ CAO (Tồn kho quá nhiều so với tốc độ bán, hàng sẽ bị quá hạn trước khi bán hết) và tự động giảm số lượng đề xuất đặt hàng mới từ DC."
    ])
    add_p(doc, "Ghi chú chiến lược: Theo đúng hướng dẫn của ThS. Lê Minh Nhật, tính năng AI Machine Learning dự báo nhu cầu sâu dựa trên thời tiết và ngày lễ sẽ được đóng gói thành Module 9 phát triển độc lập sau khi các module quản lý bán lẻ cơ bản hoàn thiện 100%.")

    # =========================================================================
    # PHẦN V: THIẾT KẾ CƠ SỞ DỮ LIỆU & KIẾN TRÚC KỸ THUẬT
    # =========================================================================
    add_part_header(doc, "PHẦN V: THIẾT KẾ CƠ SỞ DỮ LIỆU & KIẾN TRÚC KỸ THUẬT")

    add_sec(doc, "14. Thiết kế Cơ sở Dữ liệu SQL Server Chuẩn 3NF (12 Bảng Hoàn chỉnh)")
    add_p(doc, "Cơ sở dữ liệu Microsoft SQL Server LocalDB (retail_spoilage_db) được thiết kế chuẩn hóa 3NF, bảo đảm tính toàn vẹn dữ liệu:")

    tables_ddl = [
        ("14.1 Bảng system_settings (Cấu hình tham số cửa hàng)",
"""CREATE TABLE [dbo].[system_settings] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [setting_key] NVARCHAR(50) NOT NULL UNIQUE,
    [setting_value] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(255) NULL,
    [updated_at] DATETIME DEFAULT GETDATE()
);"""),
        ("14.2 Bảng users (Tài khoản người dùng & Phân quyền)",
"""CREATE TABLE [dbo].[users] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [username] NVARCHAR(50) NOT NULL UNIQUE,
    [password_hash] NVARCHAR(255) NOT NULL,
    [full_name] NVARCHAR(100) NOT NULL,
    [email] NVARCHAR(100) NULL,
    [phone] NVARCHAR(20) NULL,
    [avatar_url] NVARCHAR(255) NULL,
    [role] NVARCHAR(20) NOT NULL DEFAULT 'STAFF' CHECK ([role] IN ('MANAGER', 'STAFF')),
    [is_active] BIT NOT NULL DEFAULT 1,
    [last_login] DATETIME NULL,
    [created_at] DATETIME DEFAULT GETDATE(),
    [updated_at] DATETIME DEFAULT GETDATE()
);"""),
        ("14.3 Bảng suppliers (Kho tổng DC & Nhà cung cấp liên kết)",
"""CREATE TABLE [dbo].[suppliers] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [code] NVARCHAR(30) NOT NULL UNIQUE,
    [name] NVARCHAR(150) NOT NULL,
    [contact_name] NVARCHAR(100) NULL,
    [phone] NVARCHAR(20) NULL,
    [email] NVARCHAR(100) NULL,
    [address] NVARCHAR(255) NULL,
    [lead_time_days] INT NOT NULL DEFAULT 1,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE()
);"""),
        ("14.4 Bảng categories (Ngành hàng bán lẻ)",
"""CREATE TABLE [dbo].[categories] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [code] NVARCHAR(30) NOT NULL UNIQUE,
    [name] NVARCHAR(100) NOT NULL,
    [description] NVARCHAR(255) NULL,
    [default_warning_days] INT NOT NULL DEFAULT 7,
    [created_at] DATETIME DEFAULT GETDATE()
);"""),
        ("14.5 Bảng products (Sản phẩm bán lẻ)",
"""CREATE TABLE [dbo].[products] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [sku] NVARCHAR(50) NOT NULL UNIQUE,
    [name] NVARCHAR(150) NOT NULL,
    [category_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[categories]([id]),
    [default_supplier_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[suppliers]([id]),
    [unit] NVARCHAR(20) NOT NULL,
    [cost_price] DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    [selling_price] DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    [standard_shelf_life_days] INT NOT NULL,
    [min_stock_level] INT NOT NULL DEFAULT 15,
    [max_stock_level] INT NOT NULL DEFAULT 150,
    [custom_warning_days] INT NULL,
    [image_url] NVARCHAR(255) NULL,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE(),
    [updated_at] DATETIME DEFAULT GETDATE()
);"""),
        ("14.6 Bảng goods_receipts (Phiếu tiếp nhận hàng từ DC)",
"""CREATE TABLE [dbo].[goods_receipts] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [receipt_number] NVARCHAR(50) NOT NULL UNIQUE,
    [supplier_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[suppliers]([id]),
    [received_by] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [receipt_date] DATE NOT NULL,
    [total_cost] DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    [status] NVARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK ([status] IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    [notes] NVARCHAR(255) NULL,
    [created_at] DATETIME DEFAULT GETDATE()
);"""),
        ("14.7 Bảng batches (Lô hàng tại cửa hàng & Vòng đời Shelf-Life)",
"""CREATE TABLE [dbo].[batches] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [receipt_id] INT NULL FOREIGN KEY REFERENCES [dbo].[goods_receipts]([id]),
    [batch_code] NVARCHAR(50) NOT NULL UNIQUE,
    [product_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[products]([id]),
    [import_date] DATE NOT NULL,
    [manufacture_date] DATE NOT NULL,
    [expiry_date] DATE NOT NULL,
    [initial_quantity] INT NOT NULL,
    [current_quantity] INT NOT NULL DEFAULT 0,
    [import_price] DECIMAL(12, 2) NOT NULL,
    [discount_percent] INT NOT NULL DEFAULT 0 CHECK ([discount_percent] BETWEEN 0 AND 100),
    [status] NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK ([status] IN ('ACTIVE', 'WARNING', 'EXPIRED', 'DISPOSED')),
    [created_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [chk_batch_quantity] CHECK ([current_quantity] >= 0 AND [current_quantity] <= [initial_quantity]),
    CONSTRAINT [chk_batch_dates] CHECK ([expiry_date] > [manufacture_date])
);"""),
        ("14.8 Bảng sales_history (Lịch sử bán lẻ POS & Ngữ cảnh dự báo)",
"""CREATE TABLE [dbo].[sales_history] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [transaction_code] NVARCHAR(50) NOT NULL,
    [product_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[products]([id]),
    [batch_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[batches]([id]),
    [quantity_sold] INT NOT NULL CHECK ([quantity_sold] > 0),
    [sale_price] DECIMAL(12, 2) NOT NULL,
    [total_amount] DECIMAL(12, 2) NOT NULL,
    [sale_date] DATE NOT NULL,
    [day_of_week] NVARCHAR(10) NOT NULL,
    [weather] NVARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK ([weather] IN ('SUNNY', 'RAINY', 'NORMAL')),
    [is_holiday] BIT NOT NULL DEFAULT 0,
    [created_at] DATETIME DEFAULT GETDATE()
);"""),
        ("14.9 Bảng purchase_orders (Đơn đề xuất nhập hàng gửi Kho tổng DC)",
"""CREATE TABLE [dbo].[purchase_orders] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [order_code] NVARCHAR(50) NOT NULL UNIQUE,
    [supplier_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[suppliers]([id]),
    [created_by] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [approved_by] INT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [status] NVARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK ([status] IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'DELIVERED', 'CANCELLED')),
    [total_estimated_cost] DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    [expected_delivery_date] DATE NULL,
    [notes] NVARCHAR(255) NULL,
    [created_at] DATETIME DEFAULT GETDATE(),
    [updated_at] DATETIME DEFAULT GETDATE()
);"""),
        ("14.10 Bảng purchase_order_items (Chi tiết sản phẩm đề xuất đặt)",
"""CREATE TABLE [dbo].[purchase_order_items] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [order_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[purchase_orders]([id]) ON DELETE CASCADE,
    [product_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[products]([id]),
    [current_stock_at_order] INT NOT NULL,
    [suggested_quantity] INT NOT NULL,
    [approved_quantity] INT NOT NULL,
    [unit_cost] DECIMAL(12, 2) NOT NULL,
    [total_line_cost] DECIMAL(14, 2) NOT NULL
);"""),
        ("14.11 Bảng spoilage_records (Biên bản tiêu hủy & Sổ hao hụt tài chính)",
"""CREATE TABLE [dbo].[spoilage_records] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [record_code] NVARCHAR(50) NOT NULL UNIQUE,
    [batch_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[batches]([id]),
    [disposed_date] DATE NOT NULL,
    [quantity_disposed] INT NOT NULL CHECK ([quantity_disposed] > 0),
    [cost_loss] DECIMAL(12, 2) NOT NULL,
    [reason] NVARCHAR(20) NOT NULL DEFAULT 'EXPIRED' CHECK ([reason] IN ('EXPIRED', 'DAMAGED', 'SPOILED')),
    [notes] NVARCHAR(255) NULL,
    [performed_by] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [created_at] DATETIME DEFAULT GETDATE()
);"""),
        ("14.12 Bảng system_audit_logs (Nhật ký kiểm toán hệ thống bất biến)",
"""CREATE TABLE [dbo].[system_audit_logs] (
    [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [action_type] NVARCHAR(50) NOT NULL,
    [description] NVARCHAR(MAX) NOT NULL,
    [ip_address] NVARCHAR(45) NULL,
    [created_at] DATETIME DEFAULT GETDATE()
);""")
    ]

    for title, ddl in tables_ddl:
        add_subsec(doc, title)
        add_code(doc, ddl)

    add_sec(doc, "15. Chiến lược Đánh Chỉ mục (SQL Server Indexes)")
    add_p(doc, "Để đảm bảo tốc độ quét mã vạch POS mili-giây và tính toán FEFO tức thì, các Index chiến lược được tạo sẵn:")
    add_code(doc, """-- Tối ưu hóa quét mã vạch tại quầy POS:
CREATE INDEX [idx_products_sku] ON [dbo].[products] ([sku]);

-- Tối ưu hóa truy vấn FEFO (Lô còn hạn, còn tồn, xếp theo HSD tăng dần):
CREATE INDEX [idx_batches_fefo] ON [dbo].[batches] ([product_id], [status], [expiry_date]);

-- Tối ưu hóa quét tiến trình nền phát hiện lô cận date & hết hạn:
CREATE INDEX [idx_batches_expiry] ON [dbo].[batches] ([expiry_date], [status]);

-- Tối ưu hóa phân tích tốc độ bán hàng d (Velocity) theo ngày:
CREATE INDEX [idx_sales_product_date] ON [dbo].[sales_history] ([product_id], [sale_date]);""")

    add_sec(doc, "16. Quản trị Giao dịch Toàn vẹn (SQL Server Transactions)")
    add_p(doc, "Mọi thao tác thay đổi số lượng tồn kho (Bán lẻ POS, Nhập hàng DC, Tiêu hủy hàng hỏng) đều bắt buộc thực hiện trong Transaction để chống lỗi race condition hoặc mất mát dữ liệu:")
    add_subsec(doc, "16.1 Kịch bản Transaction Bán hàng POS tự động trừ kho FEFO đa lô")
    add_code(doc, """BEGIN TRANSACTION [Tran_POS_Checkout_FEFO];
BEGIN TRY
    -- 1. Khóa đọc dữ liệu lô hàng của sản phẩm để tránh bán trùng (WITH (UPDLOCK, HOLDLOCK))
    -- 2. Kiểm tra SUM(current_quantity) >= @RequestedQuantity
    -- 3. Cursor / Vòng lặp duyệt từng Lô theo ORDER BY expiry_date ASC:
    --    + Trừ current_quantity của lô cận date nhất
    --    + Ghi bản ghi vào sales_history
    --    + Nếu lô hết hàng -> Cập nhật status = 'EXHAUSTED'
    -- 4. Ghi bản ghi vào system_audit_logs
    COMMIT TRANSACTION [Tran_POS_Checkout_FEFO];
END TRY
BEGIN CATCH
    -- Bất kỳ lỗi nào (như không đủ tồn, lỗi hệ thống) đều hoàn nguyên toàn bộ
    ROLLBACK TRANSACTION [Tran_POS_Checkout_FEFO];
    THROW;
END CATCH;""")

    add_sec(doc, "17. Kiến trúc Phần mềm Clean Architecture")
    add_p(doc, "Hệ thống tuân thủ nghiêm ngặt nguyên lý Clean Architecture của Robert C. Martin với 4 phân tầng độc lập:")
    add_bullet_list(doc, [
        "1. Domain Layer (Hạt nhân): Chứa Entities (Product, Batch, SaleRecord), Value Objects (ShelfLifeStatus, Money), Domain Exceptions và Repositories Interfaces (IBatchRepository, IProductRepository). Hoàn toàn không phụ thuộc vào SQL Server hay framework.",
        "2. Application Layer (Nghiệp vụ): Chứa các Use Cases (CheckoutPosFefoUseCase, IntakeDcGoodsUseCase, DisposeSpoilageUseCase, CalculateRopForecastUseCase) và DTOs.",
        "3. Infrastructure Layer (Hạ tầng): Triển khai Repository bằng T-SQL tương tác trực tiếp với Microsoft SQL Server LocalDB, cấu hình kết nối mssql pool và xử lý logger.",
        "4. Presentation Layer (Giao diện & API): Cung cấp Controllers (PosController, BatchController, SpoilageController, DashboardController), Middlewares xác thực JWT, Role-based Access Control và định dạng JSON phản hồi chuẩn hóa."
    ])

    add_sec(doc, "18. Cấu trúc Thư mục Mã nguồn Chuẩn hóa (Source Code Tree)")
    add_p(doc, "Toàn bộ mã nguồn dự án được tổ chức theo sơ đồ cây chuẩn hóa phân tầng:")
    add_code(doc, """Backend/
├── src/
│   ├── domain/                         # TẦNG DOMAIN (HẠT NHÂN)
│   │   ├── entities/
│   │   │   ├── Product.js
│   │   │   ├── Batch.js
│   │   │   ├── GoodsReceipt.js
│   │   │   ├── SaleTransaction.js
│   │   │   └── SpoilageRecord.js
│   │   └── interfaces/
│   │       ├── IProductRepository.js
│   │       ├── IBatchRepository.js
│   │       └── ISalesRepository.js
│   │
│   ├── application/                    # TẦNG APPLICATION (USE CASES)
│   │   ├── use-cases/
│   │   │   ├── auth/LoginUseCase.js
│   │   │   ├── batch/IntakeDcGoodsUseCase.js
│   │   │   ├── batch/GetFefoAlertsUseCase.js
│   │   │   ├── pos/CheckoutFefoSaleUseCase.js
│   │   │   ├── spoilage/CreateDisposalUseCase.js
│   │   │   └── reorder/CalculateRopUseCase.js
│   │   └── dtos/
│   │
│   ├── infrastructure/                 # TẦNG INFRASTRUCTURE (SQL SERVER)
│   │   ├── database/
│   │   │   ├── sqlServerConnection.js  # Kết nối LocalDB (localdb)\\mssqllocaldb
│   │   │   └── seedData.js
│   │   └── repositories/
│   │       ├── SqlProductRepository.js
│   │       ├── SqlBatchRepository.js
│   │       ├── SqlSalesRepository.js
│   │       ├── SqlSpoilageRepository.js
│   │       └── SqlAuditLogRepository.js
│   │
│   ├── presentation/                   # TẦNG PRESENTATION (API & CONTROLLER)
│   │   ├── controllers/
│   │   │   ├── AuthController.js
│   │   │   ├── ProductController.js
│   │   │   ├── BatchController.js
│   │   │   ├── PosController.js
│   │   │   ├── SpoilageController.js
│   │   │   └── DashboardController.js
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js
│   │   │   └── errorHandlerMiddleware.js
│   │   └── routes/
│   │       └── apiRoutes.js
│   └── server.js
Frontend/
├── src/
│   ├── components/                     # REUSABLE UI COMPONENTS
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   └── StatusBadge.jsx
│   ├── views/                          # MÀN HÌNH CHỨC NĂNG
│   │   ├── DashboardView.jsx           # Dashboard điều hành & KPI
│   │   ├── FefoMonitorView.jsx         # Giám sát hạn dùng đa tầng
│   │   ├── DcIntakeView.jsx            # Tiếp nhận hàng từ DC
│   │   ├── PosTerminalView.jsx         # Bán lẻ POS thông minh
│   │   ├── SpoilageDisposalView.jsx    # Tiêu hủy hàng hỏng & Sổ hao hụt
│   │   ├── ProductCatalogView.jsx      # Danh mục 23 sản phẩm FMCG
│   │   ├── ReorderForecastView.jsx     # Đề xuất tái đặt hàng ROP
│   │   └── AuditLogsView.jsx           # Nhật ký hệ thống bất biến
│   └── App.jsx""")

    # =========================================================================
    # PHẦN VI: ĐẶC TẢ CHI TIẾT USE CASE & RESTFUL API
    # =========================================================================
    add_part_header(doc, "PHẦN VI: ĐẶC TẢ CHI TIẾT USE CASE & RESTFUL API")

    add_sec(doc, "19. Đặc tả Các Use Case Cốt lõi của Hệ thống")
    use_cases = [
        ("19.1 UC01: Tiếp nhận Hàng hóa từ Kho tổng DC (IntakeDcGoodsUseCase)",
         "Tác nhân chính: Store Staff (Nhân viên nhận hàng) | Tác nhân phụ: Store Manager\n"
         "Mục tiêu: Tiếp nhận lô hàng giao từ Kho tổng DC, kiểm tra điều kiện HSD, sinh mã lô mới và cập nhật tồn kho.\n"
         "Điều kiện tiên quyết: Nhân viên đã đăng nhập; thông tin nhà cung cấp và sản phẩm đã tồn tại trên hệ thống.\n"
         "Luồng xử lý chính (Main Flow):\n"
         "1. Nhân viên mở giao diện 'Tiếp nhận DC' và chọn Nhà cung cấp / Kho tổng giao hàng.\n"
         "2. Nhập thông tin từng mặt hàng: Sản phẩm, Mã lô (Batch Code), Ngày sản xuất, Hạn sử dụng, Số lượng nhận, Giá vốn.\n"
         "3. Hệ thống kiểm tra hợp lệ: ExpiryDate > ManufactureDate VÀ ExpiryDate > CurrentDate.\n"
         "4. Hệ thống mở Transaction SQL Server, lưu bảng goods_receipts và chèn các lô vào bảng batches với status = 'ACTIVE'.\n"
         "5. Hệ thống ghi nhật ký kiểm toán: Action 'DC_INTAKE', lưu mã phiếu nhập và IP.\n"
         "6. Thông báo thành công và cập nhật lại bảng tồn kho thời gian thực."),

        ("19.2 UC02: Bán hàng POS & Tự động Trừ kho FEFO (CheckoutFefoSaleUseCase)",
         "Tác nhân chính: Cashier / Store Staff (Thu ngân) | Tác nhân phụ: Khách hàng mua sắm\n"
         "Mục tiêu: Thực hiện thanh toán đơn hàng bán lẻ và tự động trừ tồn kho theo thứ tự lô hết hạn trước.\n"
         "Điều kiện tiên quyết: Thu ngân đăng nhập vào ca bán; sản phẩm còn tồn kho khả dụng.\n"
         "Luồng xử lý chính (Main Flow):\n"
         "1. Thu ngân quét mã vạch SKU sản phẩm hoặc tìm theo tên trên màn hình POS.\n"
         "2. Nhập số lượng mua (Q_req). Hệ thống tự động tính thành tiền dựa trên giá niêm yết (hoặc giá đã giảm xả hàng).\n"
         "3. Thu ngân bấm 'Thanh toán'.\n"
         "4. Hệ thống kiểm tra: Tổng tồn các lô khả dụng >= Q_req. Nếu không đủ -> Báo lỗi và hủy thanh toán.\n"
         "5. Hệ thống lấy danh sách lô theo ORDER BY expiry_date ASC và tự động trừ số lượng theo thuật toán FEFO.\n"
         "6. Lưu lịch sử bán hàng vào sales_history, lưu kèm thời tiết (weather) và ngày lễ (is_holiday).\n"
         "7. In hóa đơn cho khách và cập nhật doanh số ca."),

        ("19.3 UC03: Kích hoạt Giảm giá Xả hàng Cận date (ApplyQuickDiscountUseCase)",
         "Tác nhân chính: Store Manager (Cửa hàng trưởng)\n"
         "Mục tiêu: Áp dụng mức giảm giá (20% - 50%) cho các lô hàng trong Vùng Cảnh báo Đỏ để đẩy nhanh tốc độ bán.\n"
         "Điều kiện tiên quyết: Lô hàng có trạng thái WARNING hoặc có DaysRemaining <= 3 ngày.\n"
         "Luồng xử lý chính (Main Flow):\n"
         "1. Cửa hàng trưởng xem màn hình 'Giám sát FEFO' và lọc danh sách lô Cảnh báo Đỏ.\n"
         "2. Chọn lô hàng cần xả, chọn mức chiết khấu (ví dụ: Giảm 30%).\n"
         "3. Hệ thống cập nhật trường discount_percent = 30 trong bảng batches.\n"
         "4. Màn hình POS ngay lập tức nhận diện giá mới: SellingPrice_sale = SellingPrice_goc x 0.7.\n"
         "5. Ghi nhật ký kiểm toán: Action 'APPLY_DISCOUNT', lưu tỷ lệ giảm và mã lô."),

        ("19.4 UC04: Tiêu hủy Hàng hỏng/Hết hạn & Hạch toán Hao hụt (DisposeSpoilageUseCase)",
         "Tác nhân chính: Store Staff (Đề xuất) | Phê duyệt: Store Manager (Cửa hàng trưởng)\n"
         "Mục tiêu: Rút hàng hỏng/quá date khỏi kho, tiêu hủy an toàn và ghi nhận giá trị thiệt hại tài chính.\n"
         "Điều kiện tiên quyết: Lô hàng có số lượng hư hỏng hoặc đã hết hạn (DaysRemaining <= 0).\n"
         "Luồng xử lý chính (Main Flow):\n"
         "1. Nhân viên hoặc Quản lý mở màn hình 'Quản lý Tiêu hủy'.\n"
         "2. Chọn Lô hàng, nhập số lượng cần tiêu hủy (Q_disp <= current_quantity), chọn lý do (EXPIRED/DAMAGED/SPOILED).\n"
         "3. Hệ thống tự động tính: cost_loss = Q_disp x import_price.\n"
         "4. Cửa hàng trưởng bấm 'Phê duyệt tiêu hủy'.\n"
         "5. Hệ thống mở Transaction: Tạo bản ghi spoilage_records, trừ Q_disp khỏi current_quantity của lô; nếu tồn = 0 thì status = 'DISPOSED'.\n"
         "6. Ghi nhật ký kiểm toán: Action 'SPOILAGE_DISPOSAL'.\n"
         "7. Cập nhật tỷ lệ lãng phí Spoilage Rate % trên Dashboard điều hành.")
    ]

    for title, desc in use_cases:
        add_subsec(doc, title)
        add_p(doc, desc)

    add_sec(doc, "20. Danh mục RESTful API Chuẩn hóa")
    add_p(doc, "Toàn bộ giao tiếp giữa Frontend và Backend thực hiện qua chuẩn RESTful API, định dạng JSON và mã trạng thái HTTP chuẩn (200, 201, 400, 401, 403, 404, 500):")

    api_headers = ["Phương thức", "Endpoint API", "Mục đích nghiệp vụ", "Quyền truy cập"]
    api_data = [
        ["POST", "/api/auth/login", "Xác thực tài khoản người dùng, cấp phát JWT", "Công khai"],
        ["GET", "/api/auth/me", "Lấy thông tin người dùng đang đăng nhập", "Manager, Staff"],
        ["GET", "/api/store/profile", "Lấy thông tin cấu hình cửa hàng & tham số", "Manager, Staff"],
        ["GET", "/api/products", "Lấy danh mục 23 sản phẩm FMCG kèm tồn kho", "Manager, Staff"],
        ["POST", "/api/products", "Thêm mới sản phẩm vào danh mục", "Chỉ Manager"],
        ["GET", "/api/batches/fefo-monitor", "Lấy danh sách lô hàng phân loại theo 3 vùng cảnh báo date", "Manager, Staff"],
        ["POST", "/api/batches/discount", "Kích hoạt giảm giá xả hàng cho lô cận date", "Chỉ Manager"],
        ["POST", "/api/receipts/dc-intake", "Tiếp nhận lô hàng mới từ Kho tổng DC", "Manager, Staff"],
        ["POST", "/api/pos/checkout", "Thanh toán giỏ hàng, tự động trừ kho FEFO", "Manager, Staff"],
        ["GET", "/api/spoilage", "Lấy danh sách các biên bản tiêu hủy & sổ hao hụt", "Chỉ Manager"],
        ["POST", "/api/spoilage/dispose", "Lập biên bản tiêu hủy hàng hỏng/quá date", "Chỉ Manager"],
        ["GET", "/api/reorder/forecast", "Tính toán điểm đặt hàng ROP & cảnh báo DOS > DUE", "Chỉ Manager"],
        ["GET", "/api/dashboard/overview", "Lấy các chỉ số KPI: Doanh thu, Tồn kho, Lô cận date, Tỷ lệ hao hụt", "Manager, Staff"],
        ["GET", "/api/audit-logs", "Tra cứu lịch sử thao tác hệ thống bất biến", "Chỉ Manager"]
    ]
    create_table(doc, api_headers, api_data, [1.0, 2.2, 2.5, 1.1])

    # =========================================================================
    # PHẦN VII: ĐẶC TẢ GIAO DIỆN & QUY TẮC THIẾT KẾ (UI/UX)
    # =========================================================================
    add_part_header(doc, "PHẦN VII: ĐẶC TẢ GIAO DIỆN & QUY TẮC THIẾT KẾ (UI/UX)")

    add_sec(doc, "21. Nguyên tắc Thiết kế Giao diện (UI/UX Guidelines)")
    add_bullet_list(doc, [
        "Rich Aesthetics & Modern Enterprise Look: Sử dụng bảng màu cao cấp Slate/Emerald/Indigo kết hợp Dark Mode chuyên nghiệp, tối ưu độ tương phản cho nhân viên thu ngân làm việc liên tục.",
        "Quy chuẩn mã màu cảnh báo trực quan: Vùng Xanh (Emerald - An toàn), Vùng Vàng (Amber - Cần lưu ý), Vùng Đỏ (Rose/Red - Cận date khẩn cấp), Vùng Đen/Xám (Slate - Hết hạn sử dụng).",
        "Responsive & Touch-Friendly: Màn hình POS tối ưu các nút bấm to, hỗ trợ màn hình cảm ứng của máy bán hàng chuyên dụng và máy quét mã vạch USB.",
        "Zero Latency Feedback: Các thao tác thêm giỏ hàng, tính tiền, áp mã giảm giá phản hồi tức thì với thông báo toast tiếng Việt thân thiện."
    ])

    add_sec(doc, "22. Đặc tả Các Màn hình Chức năng Chính")
    screens = [
        ("22.1 Màn hình Dashboard Điều hành (Executive Dashboard)",
         "Bao gồm 4 thẻ KPI nổi bật trên cùng: (1) Tổng giá trị hàng tồn kho (VND), (2) Số lô hàng cận date cần xử lý khẩn cấp (Huy hiệu Đỏ nhấp nháy), (3) Tỷ lệ lãng phí Spoilage Rate % trong tháng, (4) Doanh thu bán lẻ hôm nay.\n"
         "Bên dưới là Biểu đồ cơ cấu hàng theo HSD (Bánh donut phân bổ Xanh/Vàng/Đỏ) và Danh sách cảnh báo khẩn cấp các mặt hàng có nguy cơ hết date trong 3 ngày tới."),

        ("22.2 Màn hình Giám sát Hạn sử dụng & Cảnh báo FEFO",
         "Giao diện bảng biểu chi tiết liệt kê toàn bộ các lô hàng trong cửa hàng. Mỗi dòng thể hiện: Mã lô, Tên sản phẩm, Ngày nhập, Ngày sản xuất, Hạn sử dụng, Số ngày còn lại (Days Remaining), Thanh tiến trình % RSL trực quan và Nút 'Giảm giá xả hàng'. Bộ lọc nhanh cho phép lọc riêng: Tất cả / An toàn / Cần lưu ý / Khẩn cấp / Đã quá hạn."),

        ("22.3 Màn hình Tiếp nhận Lô hàng từ Kho tổng DC (DC Intake)",
         "Giao diện biểu mẫu tiếp nhận hàng từ DC. Phía trên là thông tin phiếu nhập (Kho tổng giao, Ngày nhập, Ghi chú). Phía dưới là bảng nhập chi tiết: Chọn sản phẩm, sinh mã lô tự động (hoặc quét mã từ DC), lịch chọn NSX và HSD, số lượng nhận và giá vốn. Nút 'Lưu phiếu nhập' kích hoạt kiểm tra tính hợp lệ của date trước khi đẩy vào SQL Server."),

        ("22.4 Màn hình Bán lẻ tại quầy POS thông minh",
         "Bố cục 2 cột chuyên nghiệp: Cột trái là danh mục sản phẩm có ô tìm kiếm nhanh và lưới thẻ sản phẩm (ảnh, tên, giá niêm yết, tồn kho, nhãn giảm giá nếu có). Cột phải là Giỏ hàng thanh toán: Danh sách sản phẩm chọn mua, số lượng, đơn giá, tổng tiền, phương thức thanh toán và nút bấm lớn 'Thanh toán & Trừ kho FEFO'."),

        ("22.5 Màn hình Quản lý Tiêu hủy & Sổ hao hụt tài chính",
         "Dành riêng cho Quản lý. Hiển thị bảng tổng hợp các biên bản tiêu hủy hàng hư hỏng/hết hạn. Cung cấp nút 'Lập phiếu tiêu hủy mới', chọn lô, nhập số lượng, lý do và xem số tiền thiệt hại tự động tính. Có nút xuất báo cáo hao hụt tài chính phục vụ kiểm toán."),

        ("22.6 Màn hình Đề xuất Tái đặt hàng (Reorder Forecast)",
         "Hiển thị bảng phân tích tốc độ bán (d), số ngày bán hết hàng tồn (DOS), số ngày đến hạn (DUE) và Điểm đặt hàng ROP. Hệ thống tự động bôi đỏ các mặt hàng có DOS > DUE (nguy cơ ứ đọng hết date) và đề xuất số lượng đặt hàng tối ưu gửi về Kho tổng DC.")
    ]

    for title, desc in screens:
        add_subsec(doc, title)
        add_p(doc, desc)

    # =========================================================================
    # PHẦN VIII: BỘ QUY TẮC NGHIỆP VỤ BẤT DI BẤT DỊCH (BUSINESS RULES)
    # =========================================================================
    add_part_header(doc, "PHẦN VIII: BỘ QUY TẮC NGHIỆP VỤ BẤT DI BẤT DỊCH (BUSINESS RULES)")

    add_sec(doc, "23. 10 Quy tắc Nghiệp vụ Cốt lõi của Hệ thống Bán lẻ Chống lãng phí")
    rules = [
        ("Rule 1: Nguyên tắc Cửa hàng Đơn (Single Retail Store)",
         "Hệ thống vận hành xoay quanh một cửa hàng bán lẻ cố định. Toàn bộ cấu hình, danh mục, lô hàng và báo cáo đều quy về mã cửa hàng STORE-LHU-01."),

        ("Rule 2: Xuất kho = Bán lẻ cho Khách hàng",
         "Cửa hàng bán lẻ không duy trì quy trình xuất kho nội bộ riêng. Bán hàng thành công tại POS chính là hành động xuất kho và giảm tồn hàng hóa."),

        ("Rule 3: Quy tắc Xuất kho FEFO Tuyệt đối (First Expired, First Out)",
         "Khi bán hàng, hệ thống tự động tìm và trừ số lượng của lô có ngày hết hạn gần nhất trước (ORDER BY expiry_date ASC). Nhân viên thu ngân không được phép can thiệp chọn lô mới hơn để xuất."),

        ("Rule 4: Ràng buộc Tuyệt đối Không để Âm kho (Zero Negative Inventory)",
         "Không bao giờ cho phép số lượng tồn kho current_quantity < 0. Nếu tổng tồn khả dụng của tất cả các lô không đủ số lượng khách yêu cầu, hệ thống lập tức từ chối giao dịch."),

        ("Rule 5: Quy tắc 3 Ngưỡng Vòng đời Còn lại (% RSL Rule)",
         "Mọi lô hàng đều được đánh giá liên tục theo % RSL và số ngày còn lại để phân định ranh giới cảnh báo: Xanh (> 20%), Vàng (10% - 20%), Đỏ (<= 10% hoặc <= 3 ngày), Quá date (<= 0 ngày)."),

        ("Rule 6: Chặn Bán Tuyệt đối Hàng Đã Hết Hạn",
         "Khi DaysRemaining <= 0, hệ thống tự động khóa trạng thái lô sang 'EXPIRED'. Mã sản phẩm thuộc lô này bị chặn hoàn toàn tại POS, không thể thêm vào giỏ hàng dưới bất kỳ hình thức nào."),

        ("Rule 7: Bắt buộc Phê duyệt Khi Tiêu hủy Hàng hỏng",
         "Biên bản tiêu hủy và ghi nhận chi phí hao hụt tài chính bắt buộc phải được Cửa hàng trưởng (Store Manager) xác nhận và phê duyệt."),

        ("Rule 8: Bắt buộc Ghi nhận Ngữ cảnh Bán hàng",
         "Mọi giao dịch bán hàng POS bắt buộc ghi nhận trạng thái thời tiết (SUNNY, RAINY, NORMAL) và ngày lễ (is_holiday) để phục vụ làm sạch dữ liệu huấn luyện AI."),

        ("Rule 9: Ràng buộc Hạn sử dụng khi Tiếp nhận Hàng từ DC",
         "Cửa hàng chỉ chấp nhận lô hàng từ DC thỏa mãn đồng thời: ExpiryDate > ManufactureDate VÀ ExpiryDate > ReceiptDate. Tuyệt đối từ chối nhận hàng đã hết date từ kho tổng."),

        ("Rule 10: Toàn vẹn Nhật ký Kiểm toán (Immutable Audit Logging)",
         "Mọi thao tác thay đổi số liệu (nhập hàng DC, bán lẻ POS, giảm giá xả hàng, tiêu hủy hàng hỏng) đều bắt buộc ghi vết vào system_audit_logs kèm User ID, thời gian và địa chỉ IP.")
    ]

    for title, desc in rules:
        add_subsec(doc, title)
        add_p(doc, desc)

    # =========================================================================
    # PHẦN IX: KẾ HOẠCH PHÁT TRIỂN AGILE SCRUM & LỘ TRÌNH BÁO CÁO
    # =========================================================================
    add_part_header(doc, "PHẦN IX: KẾ HOẠCH PHÁT TRIỂN AGILE SCRUM & LỘ TRÌNH BÁO CÁO")

    add_sec(doc, "24. Kế hoạch Phát triển theo Agile Scrum")
    add_p(doc, "Dự án áp dụng khung làm việc Agile Scrum với các chu kỳ Sprint kéo dài từ 1 đến 2 tuần, kiểm thử liên tục và bàn giao sản phẩm tăng trưởng (Product Increment):")

    sprint_headers = ["Sprint", "Mục tiêu trọng tâm", "Hạng mục bàn giao (Deliverables)", "Trạng thái"]
    sprint_data = [
        ["Sprint 1", "Nền tảng kiến trúc & CSDL SQL Server", "Khởi tạo Clean Architecture, DDL 12 bảng LocalDB, Seed 23 sản phẩm FMCG, Cấu hình StoreProfile", "Hoàn tất 100%"],
        ["Sprint 2", "Các nghiệp vụ Cốt lõi Bán lẻ Chống lãng phí", "Module Tiếp nhận DC, Module Giám sát Hạn dùng & Cảnh báo FEFO đa tầng, Module Bán lẻ POS trừ kho tự động", "Hoàn tất 100% (Sẵn sàng Demo)"],
        ["Sprint 3", "Quản lý Tiêu hủy, Hạch toán & Điều hành", "Module Tiêu hủy hàng hỏng, Sổ hao hụt tài chính, Dashboard điều hành KPI, Giảm giá xả hàng, Audit Log", "Hoàn tất 100%"],
        ["Sprint 4", "Mở rộng Tái đặt hàng ROP & Dự báo AI", "Module 9: Tích hợp thuật toán Machine Learning dự báo nhu cầu dựa trên thời tiết, ngày lễ và đề xuất đơn đặt hàng DC", "Kế hoạch mở rộng"]
    ]
    create_table(doc, sprint_headers, sprint_data, [1.0, 2.0, 2.7, 1.1])

    add_sec(doc, "25. Nhiệm vụ Báo cáo Tuần tới theo Lời dặn của GVHD ThS. Lê Minh Nhật")
    add_p(doc, "Thực hiện đúng theo chỉ đạo tại buổi hướng dẫn của ThS. Lê Minh Nhật:")
    add_bullet_list(doc, [
        "1. Trình nộp Tài liệu Đặc tả Hệ thống (SRS Word Document) chi tiết, chuẩn chỉ về nghiệp vụ bán lẻ và kiến trúc Clean Architecture.",
        "2. Không trình chiếu dàn trải toàn bộ trang web mà tập trung demo sâu, chuẩn chỉnh từ 2 đến 3 Module trọng tâm thuộc Sprint 2:",
        "   + Module 1: Tiếp nhận Hàng hóa từ Kho tổng DC (Kiểm tra HSD, sinh mã lô, nhập kho thời gian thực).",
        "   + Module 2: Giám sát Hạn sử dụng & Cảnh báo FEFO Đa tầng (Trực quan hóa 3 vùng màu Xanh/Vàng/Đỏ, thanh % RSL, nút giảm giá xả hàng).",
        "   + Module 3: Bán lẻ tại quầy POS thông minh (Quét mã sản phẩm, tự động xuất kho theo FEFO, chặn triệt để âm kho).",
        "3. Chứng minh hệ thống cơ sở dữ liệu Microsoft SQL Server LocalDB đã seed đầy đủ dữ liệu thực tế (23 sản phẩm, 30 lô hàng) và chạy trơn tru."
    ])

    add_sec(doc, "26. Kết luận & Cam kết Chất lượng Đồ án")
    add_p(doc, "Tài liệu Đặc tả Yêu cầu Phần mềm (SRS) này phản ánh đầy đủ, trung thực và chi tiết 100% bài toán Chuỗi cung ứng Bán lẻ Chống lãng phí (Supply Chain Spoilage Predictor) của nhóm sinh viên Đỗ Tấn Du & Đoàn Minh Quân dưới sự hướng dẫn khoa học của ThS. Lê Minh Nhật. Hệ thống là giải pháp chuyển đổi số thiết thực, kết hợp giữa quản trị vận hành bán lẻ hiện đại (FEFO, RSL, ROP) với kỹ thuật phần mềm tiên tiến (Clean Architecture, Microsoft SQL Server LocalDB, React/Vite), sẵn sàng bước vào giai đoạn nghiệm thu và bảo vệ đồ án tốt nghiệp.")

    # Signatures
    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(20)
    p_sig.paragraph_format.keep_with_next = True
    r_sig = p_sig.add_run("TP. Biên Hòa, Ngày 02 tháng 10 năm 2026\nSINH VIÊN THỰC HIỆN ĐỀ TÀI\n\n\n\nĐỖ TẤN DU (123001364)           ĐOÀN MINH QUÂN (123000946)")
    r_sig.font.bold = True
    r_sig.font.size = Pt(10.5)
    r_sig.font.color.rgb = RGBColor(15, 76, 129)
    p_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    # Save to file
    out_dir = r"c:\thuyet minh\Docs"
    out_file = os.path.join(out_dir, "Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx")
    doc.save(out_file)
    print(f"SUCCESS: Document created at {out_file} (Size: {os.path.getsize(out_file)} bytes)")

if __name__ == "__main__":
    build_official_srs_document()
