# -*- coding: utf-8 -*-
"""
Script to generate the comprehensive Software Requirements Specification (SRS) Word Document (.docx)
for the Supply Chain Spoilage Predictor project, following Agile Scrum and Clean Architecture standards.
"""

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_styled_heading(doc, text, level):
    h = doc.add_heading(text, level=level)
    h.paragraph_format.keep_with_next = True
    h.paragraph_format.space_before = Pt(12)
    h.paragraph_format.space_after = Pt(4)
    run = h.runs[0]
    if level == 1:
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = RGBColor(15, 76, 129) # Classic Navy
    elif level == 2:
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = RGBColor(16, 185, 129) # Emerald Green
    elif level == 3:
        run.font.size = Pt(11.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(51, 65, 85) # Slate
    return h

def format_table(table, col_widths, headers, data):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    # Header Row
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "0F4C81") # Navy
        set_cell_margins(hdr_cells[i], 120, 120, 150, 150)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            r.font.size = Pt(9.5)

    # Data Rows
    for row_idx, row_data in enumerate(data):
        row_cells = table.add_row().cells
        bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, cell_value in enumerate(row_data):
            row_cells[col_idx].text = str(cell_value)
            row_cells[col_idx].width = col_widths[col_idx]
            set_cell_background(row_cells[col_idx], bg_color)
            set_cell_margins(row_cells[col_idx], 80, 80, 120, 120)
            p = row_cells[col_idx].paragraphs[0]
            for r in p.runs:
                r.font.size = Pt(9)
                r.font.color.rgb = RGBColor(30, 41, 59)

def build_document():
    doc = docx.Document()

    # Page Margins: Normal 1 inch
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)

    # Set base font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(11)
    font.color.rgb = RGBColor(30, 41, 59)

    # Header section
    p_inst = doc.add_paragraph()
    r_inst = p_inst.add_run("TRƯỜNG ĐẠI HỌC LẠC HỒNG (LHU)\nKHOA CÔNG NGHỆ THÔNG TIN\n---***---")
    r_inst.font.bold = True
    r_inst.font.size = Pt(10.5)
    r_inst.font.color.rgb = RGBColor(71, 85, 105)
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Document Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(16)
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)\nNỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ")
    r_title.font.bold = True
    r_title.font.size = Pt(17)
    r_title.font.color.rgb = RGBColor(15, 76, 129)
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(20)
    r_sub = p_sub.add_run("Supply Chain Spoilage Predictor\nKiến trúc Clean Architecture - Hệ quản trị CSDL Microsoft SQL Server - Phương pháp luận Agile/Scrum")
    r_sub.font.italic = True
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = RGBColor(100, 116, 139)
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Metadata Box
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_after = Pt(16)
    r_meta = p_meta.add_run(
        "• Giảng viên hướng dẫn: ThS. Lê Minh Nhật\n"
        "• Nhóm sinh viên thực hiện: Đỗ Tấn Du (MSSV: 123001364) & Đoàn Minh Quân (MSSV: 123000946)\n"
        "• Phiên bản tài liệu: v2.0 (Cập nhật chuẩn theo định hướng Agile Scrum & Kiến trúc Module hóa)"
    )
    r_meta.font.size = Pt(10)
    r_meta.font.bold = True
    r_meta.font.color.rgb = RGBColor(15, 76, 129)

    doc.add_page_break()

    # 1. MỤC TIÊU VÀ TẦM NHÌN HỆ THỐNG
    add_styled_heading(doc, "1. MỤC TIÊU VÀ TẦM NHÌN HỆ THỐNG (SYSTEM OBJECTIVES)", 1)
    doc.add_paragraph(
        "Trong ngành bán lẻ thực phẩm và hàng tiêu dùng nhanh (FMCG), vấn đề thất thoát và lãng phí vốn do hàng hóa "
        "hết hạn sử dụng (spoilage/shrinkage) là một trong những thách thức nghiêm trọng nhất. Tại các điểm bán lẻ, "
        "việc quản lý hạn dùng từng lô bằng sổ sách thủ công thường dẫn đến các hệ lụy: xuất bán không đúng thứ tự ưu tiên, "
        "hàng cận date bị tồn dưới đáy kệ, phát hiện muộn và buộc phải đổ bỏ tiêu hủy, gây thiệt hại tài chính nặng nề."
    )
    doc.add_paragraph(
        "Mục tiêu cốt lõi của đề tài là xây dựng một nền tảng Web quản trị vận hành khép kín cho Cửa hàng Bán lẻ tinh gọn (Retail Store) nhằm:\n"
        "1. Quản lý chính xác vòng đời (Shelf-Life) của từng lô hàng nhập về từ Kho tổng DC.\n"
        "2. Tự động phân loại và cảnh báo sớm nguy cơ quá hạn theo mô hình 3 Ngưỡng an toàn (RSL - Remaining Shelf-Life).\n"
        "3. Tự động hóa quá trình xuất bán tại quầy thu ngân (POS) theo nguyên lý FEFO (First Expired, First Out).\n"
        "4. Chuẩn hóa thủ tục lập biên bản tiêu hủy hàng hỏng và hạch toán tự động vào sổ theo dõi thiệt hại tài chính.\n"
        "5. Cung cấp báo cáo điều hành trực quan thời gian thực (Executive Dashboard) đo lường chính xác Tỷ lệ hao hụt (Spoilage Rate)."
    )

    # 2. PHẠM VI HỆ THỐNG VÀ RANH GIỚI BÀI TOÁN
    add_styled_heading(doc, "2. PHẠM VI HỆ THỐNG VÀ RANH GIỚI BÀI TOÁN (SCOPE BOUNDARIES)", 1)
    doc.add_paragraph(
        "Tuân thủ triệt để tinh thần tinh gọn và thiết thực của đề tài tốt nghiệp, ranh giới bài toán được giới hạn cụ thể như sau:"
    )
    doc.add_paragraph(
        "• Phạm vi CHẤP THUẬN (IN-SCOPE):\n"
        "  + Mô hình Cửa hàng Bán lẻ tinh gọn đơn lẻ (Single Retail Store).\n"
        "  + Luồng chuỗi cung ứng dọc khép kín: Kho tổng (DC) → Cửa hàng bán lẻ (Store) → Quầy thu ngân (POS) → Khách hàng.\n"
        "  + Hạch toán tài chính nội bộ: Giá vốn nhập kho (Cost Price), Giá bán lẻ niêm yết (POS Retail Price), Thiệt hại tiêu hủy (Disposal Loss).\n"
        "  + Quản trị phân quyền 2 vai trò chuẩn: Cửa hàng trưởng (Store Manager) và Nhân viên / Thu ngân (Store Staff / Cashier).\n"
        "  + Hệ quản trị cơ sở dữ liệu: Microsoft SQL Server LocalDB với chuẩn hóa 3NF."
    )
    doc.add_paragraph(
        "• Phạm vi LOẠI TRỪ (OUT-OF-SCOPE - TUYỆT ĐỐI KHÔNG LÀM ĐỂ TRÁNH QUÁ TẢI PHẠM VI):\n"
        "  - Tuyệt đối không phát triển luân chuyển ngang giữa các chi nhánh cửa hàng (Store-to-Store transfer).\n"
        "  - Tuyệt đối không phát triển quy trình thương lượng hoàn trả nhà cung cấp (Return to Vendor - RTV phức tạp).\n"
        "  - Tuyệt đối không làm sàn thương mại điện tử trực tuyến B2C nhiều kho."
    )

    # 3. PHƯƠNG PHÁP LUẬN AGILE / SCRUM
    add_styled_heading(doc, "3. PHƯƠNG PHÁP LUẬN PHÁT TRIỂN AGILE / SCRUM", 1)
    doc.add_paragraph(
        "Dự án được tổ chức và phát triển nghiêm ngặt theo khung làm việc Agile Scrum. Quy trình phát triển chia thành "
        "các Sprint ngắn hạn (chu kỳ 1-2 tuần/sprint), tập trung bàn giao phần mềm hoạt động được (Working Software) "
        "theo mức độ ưu tiên nghiệp vụ."
    )

    add_styled_heading(doc, "3.1 Các vai trò trong mô hình Scrum (Scrum Roles)", 2)
    doc.add_paragraph(
        "• Product Owner (PO): Đại diện yêu cầu nghiệp vụ, định nghĩa User Story và nghiệm thu tính năng.\n"
        "• Scrum Master: Điều phối tiến độ, tổ chức Daily Standup, Sprint Planning và gỡ bỏ rào cản kỹ thuật.\n"
        "• Development Team: Phụ trách thiết kế Clean Architecture, cơ sở dữ liệu SQL Server, Backend API và giao diện Web Frontend."
    )

    add_styled_heading(doc, "3.2 Chiến lược phân chia Sprint (Sprint Roadmap)", 2)
    doc.add_paragraph(
        "Bám sát chỉ đạo từ Thầy: 'KHÔNG CẦN làm hết toàn bộ trang web cùng lúc, tập trung làm đúng chuẩn từ 2 đến 3 Module trọng tâm trước, "
        "tính năng AI sẽ tách thành Module độc lập bổ sung sau'."
    )

    sprint_table = doc.add_table(rows=1, cols=4)
    sprint_headers = ["Sprint", "Mục tiêu trọng tâm", "Module bàn giao", "Trạng thái nghiệm thu"]
    sprint_data = [
        ["Sprint 1 (Tuần 1-2)", "Thiết lập nền tảng, CSDL SQL Server 3NF, Xác thực và Danh mục hàng hóa", "Module 1: Auth & Roles\nModule 2: Quản lý Danh mục SP", "Hoàn thành 100%"],
        ["Sprint 2 (Tuần 3-4)\n* Báo cáo tuần tới", "Nghiệp vụ kho lõi: Nhập lô từ DC, Giám sát Date FEFO và Quầy bán lẻ POS", "Module 3: Nhập lô từ DC\nModule 4: Giám sát FEFO 3 Ngưỡng\nModule 5: Quầy Bán lẻ POS", "Trọng tâm Demo nghiệm thu"],
        ["Sprint 3 (Tuần 5-6)", "Quy trình tiêu hủy hư hỏng, Bảng điều hành KPI và Nhật ký kiểm toán", "Module 6: Tiêu hủy Hàng hỏng\nModule 7: Dashboard Điều hành\nModule 8: Nhật ký Audit Log", "Đã tích hợp và chuẩn hóa"],
        ["Sprint 4 (Tuần 7+)\n* Module độc lập", "Dự báo Tái đặt hàng ROP, phân tích kích cầu thời tiết/ngày lễ", "Module 9: AI Dự báo ROP & Khuyến nghị tái đặt hàng", "Module độc lập bổ sung sau"]
    ]
    format_table(sprint_table, [Inches(1.2), Inches(2.2), Inches(2.3), Inches(1.3)], sprint_headers, sprint_data)

    # 4. ĐỐI TƯỢNG NGƯỜI DÙNG & MA TRẬN PHÂN QUYỀN
    add_styled_heading(doc, "4. ĐỐI TƯỢNG NGƯỜI DÙNG & MA TRẬN PHÂN QUYỀN (USER ROLES & PERMISSIONS)", 1)
    doc.add_paragraph(
        "Hệ thống thiết lập 2 nhóm người dùng chính và 1 nhóm tiến trình tự động nền (Background System Worker):"
    )
    doc.add_paragraph(
        "1. Cửa hàng trưởng (Store Manager - Quản lý):\n"
        "   - Toàn quyền cấu hình chi nhánh, xem báo cáo doanh số, giá trị tồn kho, tỷ lệ hao hụt tài chính.\n"
        "   - Có thẩm quyền cao nhất trong việc PHÊ DUYỆT phiếu tiêu hủy hàng hỏng (Disposal Approval).\n"
        "   - Xem toàn bộ nhật ký hệ thống và truy vết lỗi (Audit Trail).\n"
        "2. Nhân viên Cửa hàng / Thu ngân (Store Staff / Cashier):\n"
        "   - Thao tác quét mã bán lẻ POS cho khách hàng (hệ thống tự động trừ kho FEFO).\n"
        "   - Tiếp nhận hàng từ Kho tổng DC, kiểm tra hạn dùng trên bao bì và nhập lô vào CSDL.\n"
        "   - Đảo hàng cận date ra mặt tiền kệ trưng bày.\n"
        "   - Lập phiếu đề xuất tiêu hủy hàng rách, vỡ bao bì hoặc quá hạn (trạng thái Chờ duyệt).\n"
        "3. Tiến trình Hệ thống Tự động (System / Background AI):\n"
        "   - Tự động quét hạn sử dụng hàng ngày, chuyển trạng thái sang EXPIRED khi quá date và khóa bán POS."
    )

    perm_table = doc.add_table(rows=1, cols=4)
    perm_headers = ["Chức năng / Nghiệp vụ", "Cửa hàng trưởng (Manager)", "Nhân viên (Cashier/Staff)", "Hệ thống Tự động"]
    perm_data = [
        ["Xem Dashboard tổng quan & KPI tài chính", "Toàn quyền (Doanh thu, Vốn, Hao hụt)", "Chỉ xem chỉ số vận hành cơ bản", "Cập nhật dữ liệu ngầm"],
        ["Tiếp nhận lô hàng mới từ Kho tổng (DC)", "Có (Quản trị & điều chỉnh giá)", "Có (Thao tác nhập số lượng, date)", "Không"],
        ["Giám sát Date & Đảo kệ hàng (FEFO)", "Có (Theo dõi toàn chuỗi)", "Có (Thao tác đảo ra đầu kệ)", "Tự động phân nhóm 3 ngưỡng"],
        ["Bán hàng quầy POS (Trừ kho tự động)", "Có quyền", "Thao tác chính (Quét mã, in hóa đơn)", "Tự động trừ theo hạn sớm nhất"],
        ["Lập phiếu tiêu hủy hàng hỏng", "Có quyền lập và tự duyệt", "Lập phiếu đề xuất (Chờ duyệt)", "Không"],
        ["Phê duyệt phiếu tiêu hủy (Trừ sạch kho)", "Toàn quyền phê duyệt", "Không có quyền", "Không"],
        ["Áp dụng xả hàng giảm giá 30%", "Có quyền quyết định", "Được phép thực thi theo quy định", "Đề xuất gợi ý kích cầu"],
        ["Xem Nhật ký Kiểm toán (Audit Trail)", "Toàn quyền kiểm tra vết lỗi", "Không có quyền", "Tự động ghi nhận log"]
    ]
    format_table(perm_table, [Inches(2.5), Inches(1.8), Inches(1.8), Inches(1.4)], perm_headers, perm_data)

    # 5. BỘ QUY TẮC THIẾT KẾ GIAO DIỆN (UI/UX GUIDELINES)
    add_styled_heading(doc, "5. BỘ QUY TẮC THIẾT KẾ GIAO DIỆN (UI/UX GUIDELINES)", 1)
    doc.add_paragraph(
        "Bám sát chỉ dẫn từ Thầy Lê Minh Nhật: 'Phải đưa khung nguyên tắc thiết kế cho AI bám vào, không để AI tự ý vẽ lung tung các thành phần'."
    )
    doc.add_paragraph(
        "1. Hệ màu chủ đạo (Color Palette):\n"
        "   - Nền tảng (Background): Dark Mode cao cấp (Deep Slate #0B1120 / #111827) tạo sự tập trung cao độ.\n"
        "   - Màu chủ đạo thương hiệu (Brand/Primary): Emerald Green (#10B981) biểu trưng cho chuỗi cung ứng tươi sạch, an toàn.\n"
        "   - Màu cảnh báo 3 cấp độ chuẩn:\n"
        "     + Xanh lá (#10B981): Lô hàng An toàn (RSL > 20%).\n"
        "     + Vàng cam (#F59E0B): Lô hàng Cận date nhẹ (10% < RSL ≤ 20%) - Cần đảo kệ.\n"
        "     + Đỏ thắm (#EF4444): Lô hàng Khẩn cấp (RSL ≤ 10% hoặc ≤ 3 ngày) - Cần kích hoạt xả hàng.\n"
        "     + Tím đậm (#A855F7): Lô hàng Đã hết hạn (Expired) - Khóa xuất bán POS, chờ tiêu hủy.\n"
        "2. Kiểu dáng thành phần (Component Design):\n"
        "   - Hiệu ứng kính bán trong suốt (Glassmorphism): border mờ mỏng, bóng đổ đa lớp tinh tế.\n"
        "   - Bảng biểu dữ liệu (Modern Interactive Tables): bo góc tròn, hover highlight từng dòng.\n"
        "   - Tìm kiếm linh hoạt: Tự động loại bỏ dấu tiếng Việt (strip diacritics) hỗ trợ gõ nhanh tại quầy.\n"
        "   - Khóa nút thông minh: Không hiển thị nút giảm giá hoặc đảo kệ khi lô hàng đã hết tồn kho (Quantity = 0)."
    )

    # 6. CHI TIẾT 9 MODULE NGHIỆP VỤ TRỌNG TÂM
    add_styled_heading(doc, "6. ĐẶC TẢ CHI TIẾT 9 MODULE NGHIỆP VỤ TRỌNG TÂM", 1)

    modules_info = [
        ("Module 1: Quản trị Người dùng & Phân quyền (Auth & User Roles)",
         "Cung cấp cơ chế đăng nhập bảo mật, cấp phát phiên làm việc (Session/Token) và phân quyền chặt chẽ giữa Quản lý và Nhân viên thu ngân. Đảm bảo toàn bộ thao tác nhạy cảm (duyệt hủy, xem lợi nhuận) đều được bảo vệ.",
         ["Đăng nhập hệ thống bằng tài khoản và mật khẩu mã hóa.", "Chuyển đổi vai trò nhanh (Role Switcher) phục vụ kiểm thử nghiệp vụ.", "Chặn trái phép các chức năng quản trị đối với nhân viên thường."]),

        ("Module 2: Quản lý Danh mục Hàng hóa (Product Catalog Management)",
         "Quản lý danh sách các mặt hàng bán lẻ trong cửa hàng. Mỗi sản phẩm lưu trữ đầy đủ: SKU/Barcode, Tên hàng, Đơn vị tính, Ngành hàng, Giá vốn, Giá bán lẻ, Hạn sử dụng tiêu chuẩn (Shelf-Life Days), và Tồn kho an toàn.",
         ["Hiển thị danh sách sản phẩm trực quan kèm hình ảnh nhận diện.", "Thêm mới sản phẩm có cơ chế ngăn chặn trùng lặp thông minh (Duplicate Prevention).", "Đồng bộ giá vốn nhập kho và giá bán lẻ niêm yết tại quầy POS."]),

        ("Module 3: Tiếp nhận Lô hàng từ Kho tổng DC (DC Stock Intake & Shelf-Life)",
         "Quản lý tiếp nhận hàng hóa theo từng đợt từ Kho tổng DC. Đây là phân hệ đầu vào của chuỗi cung ứng, ghi nhận Mã lô, Ngày nhập (Import Date), Hạn sử dụng (EXP Date), Số lượng và Đơn giá vốn.",
         ["Kiểm tra ràng buộc logic: Hạn sử dụng (EXP) bắt buộc phải lớn hơn Ngày nhập.", "Tự động đề xuất Hạn sử dụng theo số ngày tiêu chuẩn của từng loại hàng (VD: Bánh mì 7 ngày, Sữa 180 ngày).", "Cho phép tùy chọn đồng bộ giá bán lẻ mới ra quầy POS nếu giá nhập biến động."]),

        ("Module 4: Giám sát Date Đa cấp & Đảo Kệ FEFO (FEFO Monitoring & 3 RSL Thresholds)",
         "Trái tim của việc chống lãng phí. Giám sát tự động hạn sử dụng của từng lô hàng theo chỉ số Vòng đời còn lại RSL (Remaining Shelf-Life %). Phân loại màu sắc rõ ràng (Xanh/Vàng/Đỏ/Tím) để nhân viên xử lý kịp thời.",
         ["Hiển thị danh sách lô hàng sắp xếp theo thứ tự Hạn gần nhất lên trên cùng (FEFO).", "Bộ lọc nhanh theo 3 ngưỡng trạng thái và ô tìm kiếm tiếng Việt không dấu.", "Chức năng 'Đảo Kệ' (Shelf Rotation): Ghi nhận nhân viên đã đảo hàng cận date ra mặt tiền trưng bày.", "Chức năng 'Xả Hàng Giảm 30%': Kích thích bán tháo thu hồi vốn trước khi hàng bị hỏng."]),

        ("Module 5: Bán lẻ POS & Tự động xuất kho FEFO (Retail POS & Auto FEFO Deduction)",
         "Mô phỏng quầy thu ngân bán lẻ thực tế. Nhân viên chỉ cần quét mã sản phẩm và nhập số lượng, thuật toán FEFO bên dưới cơ sở dữ liệu sẽ tự động tìm kiếm và trừ kho vào các lô có hạn dùng gần nhất trước.",
         ["Giao diện POS trực quan, phân chia danh mục, tìm kiếm nhanh theo mã hoặc tên.", "Kiểm soát tồn kho khả dụng nghiêm ngặt: Tuyệt đối không cho phép bán âm kho.", "Chặn hoàn toàn các lô hàng đã quá hạn sử dụng (không bán hàng hết date cho khách).", "Sinh hóa đơn thanh toán chi tiết, thể hiện rõ từng lô hàng bị trừ kho theo FEFO."]),

        ("Module 6: Xử lý Tiêu hủy Hàng hỏng & Sổ hao hụt (Spoilage Disposal & Financial Loss)",
         "Xử lý dứt điểm các mặt hàng bị rách vỡ bao bì, sự cố bảo quản lạnh hoặc đã quá hạn sử dụng mà không thể bán được nữa. Thiết lập biên bản tiêu hủy chính xác và trừ sạch tồn kho vật lý.",
         ["Nhân viên lập phiếu đề xuất tiêu hủy ghi rõ lý do (Quá hạn, Lỗi lạnh, Rách bao bì).", "Tự động tính toán số tiền thiệt hại tài chính = Số lượng hủy × Giá vốn nhập kho của lô đó.", "Quy trình phê duyệt 2 bước: Cửa hàng trưởng bấm Duyệt thì lô hàng mới chính thức bị trừ hết kho.", "Lưu trữ Sổ theo dõi biên bản hao hụt phục vụ kiểm toán tài chính cửa hàng."]),

        ("Module 7: Tổng quan Điều hành & KPI Thời gian thực (Executive Dashboard)",
         "Màn hình tổng hợp toàn bộ bức tranh tài chính và vận hành của cửa hàng theo thời gian thực. Cung cấp các chỉ số then chốt giúp Cửa hàng trưởng đưa ra quyết định kinh doanh kịp thời.",
         ["5 Thẻ chỉ số KPI chính: Tổng tồn kho, Doanh thu POS, Số lô cận date đỏ, Thiệt hại tiêu hủy, Tỷ lệ hao hụt (%).", "Biểu đồ phân bổ 3 ngưỡng RSL theo tỷ lệ phần trăm trực quan.", "Bảng phân tích sản phẩm nguy cơ cao dựa trên điều kiện nghịch đảo DOS > DUE.", "Nút thao tác nhanh xử lý xả hàng trực tiếp từ màn hình tổng quan."]),

        ("Module 8: Nhật ký Kiểm toán & Truy vết Lỗi (System Audit Trail)",
         "Ghi nhận chi tiết từng biến động dữ liệu và hành động của nhân viên trên hệ thống (Ai làm gì, vào thời điểm nào, mã chứng từ, địa chỉ IP).",
         ["Lưu vết tự động các hành động: Nhập lô từ DC, Bán lẻ POS, Đảo kệ, Đề xuất hủy, Phê duyệt tiêu hủy.", "Hỗ trợ tìm kiếm, lọc vết lỗi và phục vụ công tác thanh tra nội bộ của chuỗi bán lẻ."]),

        ("Module 9: Dự báo Tái đặt hàng ROP & AI Kích cầu (Reorder Point & AI Forecast - Module độc lập)",
         "Tính năng nâng cao được thiết kế độc lập theo định hướng của Thầy (bổ sung sau khi các module quản lý đã chạy ổn định). Ứng dụng công thức ROP = (d × L) + SS kết hợp hệ số thời tiết và ngày lễ.",
         ["Tính toán Tốc độ bán hàng ngày (Daily Demand d) theo thời gian thực.", "Xác định Tồn kho an toàn (Safety Stock SS) và Điểm đặt hàng (ROP).", "Tự động đề xuất số lượng đặt hàng tối ưu gửi về Kho tổng DC khi tồn kho chạm ngưỡng ROP.", "Mô phỏng hệ số thời tiết nắng nóng (K=1.4) và ngày lễ (K=1.6) tác động đến nhu cầu tiêu thụ."])
    ]

    for title, desc, features in modules_info:
        add_styled_heading(doc, title, 2)
        doc.add_paragraph(desc)
        p_feat = doc.add_paragraph()
        p_feat.add_run("Các tính năng chính:\n").bold = True
        for f in features:
            p_feat.add_run(f"• {f}\n")

    # 7. QUY TẮC NGHIỆP VỤ CỐT LÕI (BUSINESS RULES)
    add_styled_heading(doc, "7. CÁC QUY TẮC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS RULES)", 1)
    doc.add_paragraph("Hệ thống tuân thủ 10 quy tắc nghiệp vụ bất di bất dịch sau:")
    rules = [
        ("Rule 1: Nguyên tắc FEFO", "Khi xuất bán tại quầy POS, hệ thống bắt buộc phải tự động phân bổ trừ kho vào lô có hạn sử dụng (EXP Date) gần nhất trước."),
        ("Rule 2: Tuyệt đối không âm kho", "Không bao giờ cho phép xuất bán hoặc tiêu hủy vượt quá số lượng tồn kho khả dụng hiện có."),
        ("Rule 3: Khóa bán hàng quá hạn", "Các lô hàng có hạn sử dụng nhỏ hơn ngày hiện tại (DATEDIFF < 0) tự động chuyển sang trạng thái EXPIRED và bị khóa hoàn toàn tại quầy POS."),
        ("Rule 4: Phân nhóm 3 Ngưỡng RSL", "Vòng đời còn lại RSL (%) = [(EXP - Hôm nay) / (EXP - Ngày nhập)] × 100%. An toàn (>20%), Cảnh báo vàng (10-20%), Khẩn cấp đỏ (≤10% hoặc ≤3 ngày)."),
        ("Rule 5: Hạch toán thiệt hại theo giá vốn", "Thiệt hại tài chính khi tiêu hủy = Số lượng hủy × Giá vốn nhập kho (Cost Price). Không tính theo giá bán lẻ."),
        ("Rule 6: Kiểm soát 2 bước khi tiêu hủy", "Nhân viên chỉ có quyền tạo phiếu đề xuất ở trạng thái PENDING. Chỉ khi Cửa hàng trưởng bấm PHÊ DUYỆT thì kho mới chính thức bị trừ."),
        ("Rule 7: Ràng buộc nhập hàng DC", "Hạn sử dụng (EXP) bắt buộc phải lớn hơn Ngày nhập hàng (Import Date)."),
        ("Rule 8: Điều kiện nguy cơ lãng phí (DOS > DUE)", "Nếu Số ngày cần để bán hết tồn kho (DOS) > Số ngày còn lại đến hạn dùng (DUE), hệ thống phát cờ cảnh báo nguy cơ đổ bỏ."),
        ("Rule 9: Kích cầu xả hàng", "Khi kích hoạt giảm giá 30% xả hàng, hệ số tốc độ bán được kích thích tăng 50% (K_discount = 1.5) để xả hàng kịp thời."),
        ("Rule 10: Ghi nhận vết kiểm toán (Audit)", "Toàn bộ các giao dịch nhập, xuất, hủy, đổi giá đều phải được ghi nhận tự động vào bảng system_audit_logs.")
    ]

    rule_table = doc.add_table(rows=1, cols=3)
    rule_headers = ["Mã quy tắc", "Tên quy tắc", "Nội dung ràng buộc chi tiết"]
    rule_data = [[r[0], r[0].split(':')[1].strip(), r[1]] for r in rules]
    format_table(rule_table, [Inches(1.5), Inches(2.0), Inches(3.5)], rule_headers, rule_data)

    # 8. THIẾT KẾ CƠ SỞ DỮ LIỆU SQL SERVER
    add_styled_heading(doc, "8. THIẾT KẾ CƠ SỞ DỮ LIỆU MICROSOFT SQL SERVER", 1)
    doc.add_paragraph(
        "Cơ sở dữ liệu được thiết kế trên Microsoft SQL Server theo chuẩn hóa 3NF, đảm bảo tính toàn vẹn dữ liệu, "
        "hỗ trợ bảng mã Unicode tiếng Việt (`NVARCHAR`), cơ chế Transaction (`BEGIN TRAN / COMMIT`) chống xung đột và Index tối ưu."
    )

    db_tables_summary = [
        ["1. users", "Lưu trữ tài khoản nhân sự, phân quyền (Quản lý / Thu ngân).", "id (PK), username, full_name, role_code, status"],
        ["2. categories", "Danh mục phân loại ngành hàng bán lẻ (Sữa, Bánh mì, Nước giải khát...).", "id (PK), category_code, name, description"],
        ["3. products", "Thông tin sản phẩm bán lẻ, mã vạch SKU, giá vốn, giá bán, hạn chuẩn.", "id (PK), sku, name, category_id (FK), cost_price, selling_price, shelf_life_days"],
        ["4. batches", "Quản lý từng lô hàng: ngày nhập, hạn sử dụng, số lượng tồn, giá vốn lô.", "id (PK), batch_code, product_id (FK), import_date, expiry_date, current_quantity, status"],
        ["5. goods_receipts", "Phiếu nhập kho tổng thể tiếp nhận từ Kho tổng DC.", "id (PK), receipt_number, received_by (FK), receipt_date, total_cost, status"],
        ["6. goods_receipt_items", "Chi tiết các mặt hàng và lô trong từng phiếu nhập DC.", "id (PK), receipt_id (FK), batch_id (FK), product_id (FK), quantity, unit_price"],
        ["7. sales_history", "Lịch sử giao dịch quầy POS, lưu vết trừ kho theo từng lô FEFO.", "id (PK), transaction_code, product_id (FK), batch_id (FK), quantity_sold, sale_price, total_amount"],
        ["8. spoilage_records", "Biên bản tiêu hủy hàng hỏng, hạch toán số tiền thiệt hại tài chính.", "id (PK), record_code, batch_id (FK), quantity_disposed, cost_loss, reason, status"],
        ["9. reorder_plans", "Kế hoạch đề xuất tái đặt hàng gửi về Kho tổng DC.", "id (PK), plan_code, product_id (FK), suggested_quantity, lead_time_days, status"],
        ["10. system_audit_logs", "Nhật ký kiểm toán hệ thống, lưu vết người dùng và IP.", "id (PK), user_id (FK), action_type, description, ip_address, created_at"],
        ["11. store_config", "Thông tin cấu hình chi nhánh cửa hàng bán lẻ duy nhất.", "id (PK), store_code, store_name, address, manager_id (FK)"],
        ["12. weather_holidays", "Bảng tra cứu hệ số tác động ngoại cảnh (thời tiết, ngày nghỉ lễ).", "id (PK), record_date, weather_condition, is_holiday, demand_factor"]
    ]

    db_table = doc.add_table(rows=1, cols=3)
    db_headers = ["Tên bảng (Table)", "Ý nghĩa nghiệp vụ", "Các trường chính (Key Columns)"]
    format_table(db_table, [Inches(1.8), Inches(2.7), Inches(2.5)], db_headers, db_tables_summary)

    # 9. KIẾN TRÚC CLEAN ARCHITECTURE & API RESTFUL
    add_styled_heading(doc, "9. KIẾN TRÚC CLEAN ARCHITECTURE & DANH MỤC API", 1)
    doc.add_paragraph(
        "Hệ thống tuân thủ mô hình Clean Architecture 4 phân tầng độc lập:\n"
        "• Domain Layer: Chứa Entities (Product, Batch, SaleOrder, SpoilageRecord) và Domain Business Rules (chặn âm kho, tính hạn RSL, tính ROP).\n"
        "• Application Layer: Chứa Use Cases (ProcessFefoSale, IntakeBatch, ApproveDisposal, CalculateForecast).\n"
        "• Infrastructure Layer: Triển khai kết nối Microsoft SQL Server LocalDB, Transaction runner, mã hóa bảo mật.\n"
        "• Presentation Layer: RESTful API Controllers và Frontend React/Vite SPA."
    )

    api_endpoints = [
        ["POST", "/api/auth/login", "Xác thực tài khoản và trả về vai trò người dùng (Manager/Staff)."],
        ["GET", "/api/products", "Lấy toàn bộ 23 sản phẩm danh mục kèm tồn kho thời gian thực."],
        ["POST", "/api/products", "Tạo mới sản phẩm (kèm kiểm tra trùng lặp thông minh)."],
        ["GET", "/api/batches", "Lấy danh sách lô hàng sắp xếp theo thứ tự FEFO (hạn gần nhất)."],
        ["POST", "/api/batches", "Tiếp nhận lô hàng mới từ Kho tổng DC vào SQL Server."],
        ["PATCH", "/api/batches/:id/discount", "Kích hoạt giảm giá 30% xả hàng cho lô cận date."],
        ["PATCH", "/api/batches/:id/rotate", "Ghi nhận thao tác đảo lô hàng ra mặt tiền kệ."],
        ["POST", "/api/sales", "Bán lẻ POS: Tự động phân bổ trừ kho FEFO vào SQL Server."],
        ["GET", "/api/disposals", "Lấy danh sách phiếu tiêu hủy và sổ hao hụt tài chính."],
        ["POST", "/api/spoilage", "Lập phiếu tiêu hủy hàng hỏng mới (trừ kho khi được duyệt)."],
        ["GET", "/api/dashboard/stats", "Lấy 5 chỉ số KPI điều hành thực tế từ SQL Server."],
        ["GET", "/api/audit-logs", "Truy xuất lịch sử kiểm toán thao tác toàn hệ thống."]
    ]

    api_table = doc.add_table(rows=1, cols=3)
    api_headers = ["Phương thức", "Đường dẫn API (Endpoint)", "Mô tả nghiệp vụ"]
    format_table(api_table, [Inches(1.2), Inches(2.3), Inches(3.5)], api_headers, api_endpoints)

    # 10. KẾT LUẬN & KẾ HOẠCH BÁO CÁO
    add_styled_heading(doc, "10. KẾT LUẬN & KẾ HOẠCH BÁO CÁO CHO BUỔI HỌC TỚI", 1)
    doc.add_paragraph(
        "Tài liệu đặc tả này đã chuẩn hóa toàn bộ phạm vi bài toán, phân rã rành mạch 9 Module nghiệp vụ, quy tắc nghiệp vụ "
        "bảo vệ tồn kho và cấu trúc CSDL SQL Server 3NF theo đúng chỉ dẫn của Thầy Lê Minh Nhật."
    )
    doc.add_paragraph(
        "Kế hoạch chuẩn bị cho buổi báo cáo tới của nhóm:\n"
        "1. Xuất trình file tài liệu đặc tả Word hoàn chỉnh này cho Thầy kiểm tra.\n"
        "2. Trình diễn Demo trọng tâm 3 Module cốt lõi của Sprint 2:\n"
        "   + Module Tiếp nhận hàng DC (nhập lô, kiểm soát hạn sử dụng).\n"
        "   + Module Giám sát Date & FEFO (cảnh báo 3 ngưỡng RSL, thao tác đảo kệ).\n"
        "   + Module Bán lẻ POS (quét mã, hệ thống tự động trừ kho FEFO theo hạn gần nhất).\n"
        "3. Lắng nghe góp ý của Thầy để hoàn thiện sản phẩm trước khi chuyển sang các module tiếp theo."
    )

    output_path = r"c:\thuyet minh\Docs\Dac_Ta_He_Thong_Supply_Chain_Spoilage_Predictor.docx"
    doc.save(output_path)
    print(f"SUCCESS: Document generated successfully at: {output_path}")

if __name__ == "__main__":
    build_document()
