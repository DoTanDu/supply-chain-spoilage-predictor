# -*- coding: utf-8 -*-
"""
TỰ ĐỘNG SINH TÀI LIỆU THUYẾT MINH CHI TIẾT SƠ ĐỒ USE CASE
THEO ĐẶC TẢ NGUỒN CHUẨN MỰC (SSOT) & CHỈ ĐẠO CỦA THS. LÊ MINH NHẬT
4 NHÓM VAI TRÒ NGƯỜI DÙNG | 6 PHÂN HỆ NGHIỆP VỤ KHÉP KÍN
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

def set_cell_margins(cell, top=100, bottom=100, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="B0C4DE", sz="4", val="single"):
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

def format_table(table, col_widths, headers, data, header_bg="1E40AF", alt_bg="F1F5F9"):
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

    # Rows
    for row_idx, row_data in enumerate(data):
        row_cells = table.add_row().cells
        bg_color = alt_bg if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            row_cells[col_idx].text = str(text)
            set_cell_background(row_cells[col_idx], bg_color)
            set_cell_margins(row_cells[col_idx], 80, 80, 100, 100)
            p = row_cells[col_idx].paragraphs[0]
            if col_idx in [0, 1] or len(str(text)) < 8:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.name = "Times New Roman"
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(30, 30, 30)

    for row in table.rows:
        for i, w in enumerate(col_widths):
            row.cells[i].width = Inches(w)

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.font.name = "Times New Roman"
    r.font.size = Pt(13.5)
    r.font.bold = True
    r.font.color.rgb = RGBColor(30, 58, 138)
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.font.name = "Times New Roman"
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.color.rgb = RGBColor(185, 28, 28)
    return p

def add_p(doc, text, bold_prefix=""):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        rb = p.add_run(bold_prefix)
        rb.font.name = "Times New Roman"
        rb.font.size = Pt(10.5)
        rb.font.bold = True
    rt = p.add_run(text)
    rt.font.name = "Times New Roman"
    rt.font.size = Pt(10.5)
    return p

def add_bullet(doc, bold_prefix, text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        rb = p.add_run(bold_prefix)
        rb.font.name = "Times New Roman"
        rb.font.size = Pt(10.5)
        rb.font.bold = True
    rt = p.add_run(text)
    rt.font.name = "Times New Roman"
    rt.font.size = Pt(10.5)
    return p

def build_detailed_use_case_doc():
    doc = Document()
    for section in doc.sections:
        section.top_margin = Inches(0.79)
        section.bottom_margin = Inches(0.79)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(0.79)

    # Tiêu đề trường & Khoa
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_after = Pt(2)
    r_inst = p_inst.add_run("TRƯỜNG ĐẠI HỌC LẠC HỒNG\nKHOA CÔNG NGHỆ THÔNG TIN - BỘ MÔN KỸ THUẬT PHẦN MỀM")
    r_inst.font.name = "Times New Roman"
    r_inst.font.size = Pt(10.5)
    r_inst.font.bold = True
    r_inst.font.color.rgb = RGBColor(71, 85, 105)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("THUYẾT MINH CHI TIẾT SƠ ĐỒ USE CASE HỆ THỐNG")
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(15.5)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(30, 58, 138)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(12)
    r_sub = p_sub.add_run("Đề tài: NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ\n(SUPPLY CHAIN SPOILAGE PREDICTOR)\nGVHD: ThS. Lê Minh Nhật | Nhóm SV: Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946)")
    r_sub.font.name = "Times New Roman"
    r_sub.font.size = Pt(11)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(185, 28, 28)

    # I. NGUYÊN TẮC THIẾT KẾ & TIẾP THU GÓP Ý CỦA GVHD
    add_heading_1(doc, "I. NGUYÊN TẮC THIẾT KẾ & TIẾP THU GÓP Ý CỦA GVHD")
    add_p(doc, "Tiếp thu chỉ đạo sâu sát của ThS. Lê Minh Nhật về việc xây dựng tài liệu kỹ thuật chuẩn xác, nhóm sinh viên đã rà soát toàn diện và thiết kế lại Sơ đồ Use Case theo đúng tài liệu Đặc tả hệ thống chuẩn mực (Single Source of Truth - SSOT).")
    add_p(doc, "Các nguyên tắc cải tiến trọng tâm:", "Nguyên tắc thiết kế: ")
    add_bullet(doc, "1. Tách biệt rõ ràng 4 vai trò người dùng (Roles): ", "Tuyệt đối không gộp chung người dùng. Hệ thống chia rõ: Admin (Quản trị viên), Store Manager (Cửa hàng trưởng), Cashier (Thu ngân), và Warehouse Staff (Nhân viên kho & quầy kệ), cùng Actor ngoài Kho tổng DC Biên Hòa.")
    add_bullet(doc, "2. Chuỗi tác nghiệp liên hoàn khép kín: ", "Mỗi use case đều có sự nối kết hữu cơ từ Tiếp nhận hàng DC (kiểm định RSL >= 70%) -> Bán lẻ POS tự động trừ kho FEFO & bẻ lô -> Giám sát hạn dùng 3 màu -> Xả hàng Quick Markdown & Đảo kệ 5 bước -> Tiêu hủy chốt Sổ hao hụt -> Dự báo ROP gửi đơn đặt hàng DC.")
    add_bullet(doc, "3. Bám sát 11 Quy tắc nghiệp vụ cốt lõi: ", "Mọi ràng buộc kỹ thuật (FEFO, khóa âm kho, khóa hàng hết hạn, RSL 70%, DOS > DUE, AuditLog) đều được thể hiện tường minh trên sơ đồ qua quan hệ <<include>> và <<extend>>.")

    # II. HÌNH ẢNH SƠ ĐỒ USE CASE
    add_heading_1(doc, "II. SƠ ĐỒ USE CASE TỔNG THỂ HỆ THỐNG")
    img_path = r"c:\thuyet minh\Docs\Diagram_Images\use_case.png"
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(4)
        p_img.add_run().add_picture(img_path, width=Inches(6.4))

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(12)
        r_cap = p_cap.add_run("Hình 1: Sơ đồ Use Case chuẩn hóa 4 Vai trò và 6 Phân hệ nghiệp vụ khép kín (LHU Mart)")
        r_cap.font.name = "Times New Roman"
        r_cap.font.size = Pt(10)
        r_cap.font.bold = True
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(71, 85, 105)

    # III. MA TRẬN PHÂN QUYỀN 4 ROLES
    add_heading_1(doc, "III. MA TRẬN PHÂN QUYỀN 4 VAI TRÒ NGƯỜI DÙNG (RBAC)")
    add_p(doc, "Bảng ma trận phân quyền xác định ranh giới trách nhiệm của từng tác nhân trong hệ thống:")
    tbl_rbac = doc.add_table(rows=1, cols=5)
    rbac_widths = [2.4, 0.9, 1.2, 0.9, 1.2]
    rbac_headers = ["Nghiệp Vụ Hệ Thống", "Admin", "Cửa hàng trưởng", "Thu ngân", "Nhân viên kho"]
    rbac_data = [
        ["Đăng nhập & Xác thực hệ thống", "Có", "Có", "Có", "Có"],
        ["Quản lý tài khoản & Phân quyền", "Có", "Không", "Không", "Không"],
        ["Cấu hình Cửa hàng duy nhất StoreProfile", "Có", "Tùy quyền", "Không", "Không"],
        ["Quản lý danh mục FMCG & Chống trùng SP", "Có", "Có", "Chỉ xem", "Chỉ xem"],
        ["Xem danh sách lô & Cảnh báo 3 màu", "Có", "Có", "Có", "Có"],
        ["Bán lẻ quầy POS xuất kho FEFO", "Có", "Có", "Có", "Không"],
        ["Áp dụng Quick Markdown (15% - 50%)", "Có", "Có", "Không", "Không"],
        ["Tiếp nhận hàng DC (Kiểm định RSL >= 70%)", "Có", "Có", "Không", "Có"],
        ["Xác nhận SOP đảo kệ mặt tiền 5 bước", "Có", "Có", "Không", "Có"],
        ["Lập đề xuất tiêu hủy hàng hỏng/date", "Có", "Có", "Có", "Có"],
        ["Phê duyệt tiêu hủy & Chốt Sổ hao hụt", "Có", "Có", "Không", "Không"],
        ["Xem dự báo ROP & Tạo đơn PO gửi DC", "Có", "Có", "Không", "Tùy quyền"],
        ["Xem Dashboard 6 KPI tài chính điều hành", "Có", "Có", "Không", "Không"],
        ["Bàn giao ca trực điện tử 4 bước", "Có", "Có", "Có", "Có"],
        ["Tra cứu Nhật ký kiểm toán AuditLog", "Có", "Tùy quyền", "Không", "Không"]
    ]
    format_table(tbl_rbac, rbac_widths, rbac_headers, rbac_data, header_bg="1E40AF")

    # IV. THUYẾT MINH CHI TIẾT 6 PHÂN HỆ
    add_heading_1(doc, "IV. THUYẾT MINH CHI TIẾT 6 PHÂN HỆ TÁC NGHIỆP")

    # Phân hệ 1
    add_heading_2(doc, "1. Phân hệ Quản trị hệ thống & Cấu hình Cửa hàng duy nhất (Admin & Store Manager)")
    add_p(doc, "Phân hệ đảm bảo tính toàn vẹn và phân định quyền hạn:")
    add_bullet(doc, "UC-01 (Quản lý người dùng & Phân quyền): ", "Admin tạo tài khoản, cấp vai trò, khóa tài khoản nhân viên nghỉ việc.")
    add_bullet(doc, "UC-02 (Cấu hình Cửa hàng duy nhất): ", "Quản lý thông tin LHU Mart (RETAIL-STORE-01) liên kết Kho tổng DC Biên Hòa, thời gian giao hàng chuẩn (LeadTime = 1 ngày), ngưỡng RSL tối thiểu 70%. Bảng chỉ có duy nhất 1 bản ghi (Rule 1).")
    add_bullet(doc, "UC-03 (Quản lý Danh mục & Chống trùng sản phẩm): ", "Thiết lập danh mục FMCG, nhiệt độ bảo quản. Khi thêm mới, thuật toán chuẩn hóa chuỗi và chặn trùng SKU / tên tương đồng >= 85% (Rule 9).")
    add_bullet(doc, "UC-04 (Tra cứu Nhật ký kiểm toán AuditLog): ", "Ghi nhận mọi thao tác thay đổi kho, giá bán, tiêu hủy bất biến phục vụ thanh tra và truy vết trách nhiệm (Rule 11).")

    # Phân hệ 2
    add_heading_2(doc, "2. Phân hệ Tiếp nhận hàng từ Kho tổng DC (Warehouse Staff)")
    add_p(doc, "Kiểm soát nghiêm ngặt chất lượng và hạn sử dụng ngay từ cửa kho:")
    add_bullet(doc, "Bước 1 (UC-06 - Tiếp nhận hàng DC): ", "Nhân viên kho mở giao diện Tiếp nhận, chọn sản phẩm từ xe tải DC Biên Hòa.")
    add_bullet(doc, "Bước 2 (UC-06.1 - Kiểm định RSL >= 70%): ", "«include» Nhập Ngày sản xuất và HSD in trên bao bì. Hệ thống tính: RSL = (Expiry - Import) / (Expiry - Manufacture) * 100%. Nếu >= 70% mới cho phép nhập số lượng và giá vốn (Rule 7).")
    add_bullet(doc, "Bước 3 (UC-06.2 - Khóa lưu & Lập biên bản từ chối nhận hàng DC): ", "«extend» Nếu RSL < 70%, nút Lưu bị khóa cứng, hiển thị nút Lập biên bản từ chối nhận hàng DC để ghi vết REJECT_DC_INBOUND vào AuditLogs (Rule 7, 11).")
    add_bullet(doc, "Bước 4 (UC-06.3 - Sinh mã lô & Kích hoạt Shelf-Life): ", "«include» Hệ thống tự động sinh mã lô LOT-DC-[Mã SP]-[Ngày], tạo bản ghi Batches với InitialQuantity = CurrentQuantity.")
    add_bullet(doc, "Bước 5 (UC-06.4 - In tem mã vạch lô): ", "«extend» In tem barcode dán lên kiện hàng lưu kho.")

    # Phân hệ 3
    add_heading_2(doc, "3. Phân hệ Bán lẻ POS theo nguyên tắc FEFO (Cashier)")
    add_p(doc, "Nguyên tắc cốt lõi: 'Bán hàng = Xuất kho trực tiếp':")
    add_bullet(doc, "Bước 1 (UC-07 - Bán lẻ tại quầy POS): ", "Thu ngân quét mã Barcode/SKU sản phẩm và nhập số lượng khách mua.")
    add_bullet(doc, "Bước 2 (UC-07.1 - Tự động chọn lô hạn gần nhất FEFO): ", "«include» Hệ thống truy vấn các lô khả dụng theo ExpiryDate ASC, id ASC để xuất trước (Rule 2).")
    add_bullet(doc, "Bước 3 (UC-07.2 - Tự động bẻ đơn qua nhiều lô): ", "«include» Nếu khách mua vượt tồn của lô gần nhất, hệ thống tự động bẻ dòng hóa đơn sang lô tiếp theo, đảm bảo không âm kho (Rule 3).")
    add_bullet(doc, "Bước 4 (UC-07.3 - Áp dụng giá sau chiết khấu): ", "«include» Nếu lô đang có chính sách xả hàng Quick Markdown, tự động hiển thị giá giảm tương ứng.")
    add_bullet(doc, "Bước 5 (UC-07.4 - Lưu cờ ngữ cảnh bán hàng): ", "«include» Thu ngân chọn điều kiện thời tiết (Nắng/Mưa/Bình thường) và Cờ ngày lễ để nạp dữ liệu cho mô hình dự báo ROP.")
    add_bullet(doc, "Bước 6 (UC-07.5 - In hóa đơn chi tiết): ", "«extend» In hóa đơn hiển thị rõ số lượng trừ từ từng mã lô cho khách hàng.")

    # Phân hệ 4
    add_heading_2(doc, "4. Phân hệ Giám sát HSD, Quick Markdown & Đảo kệ mặt tiền (Store Manager & Warehouse Staff)")
    add_p(doc, "Kiểm soát chủ động hạn sử dụng theo 3 vùng màu (Rule 4):")
    add_bullet(doc, "UC-08 (Giám sát hạn dùng 3 màu): ", "Phân loại lô hàng thành Vùng Xanh (An toàn), Vàng (Cận date: 3 ngày < DaysLeft <= WarningDays), Đỏ (Nguy kịch: 0 < DaysLeft <= 3 ngày).")
    add_bullet(doc, "UC-08.1 (Khóa cứng xuất bán POS): ", "«include» Khi DaysLeft <= 0 ngày, tự động chuyển sang EXPIRED và cấm xuất bán trên POS tuyệt đối (Rule 5).")
    add_bullet(doc, "UC-09 (Kích hoạt Quick Markdown): ", "Cửa hàng trưởng phê duyệt mức giảm giá 15%, 30%, 40%, 50% cho lô cận date. Giá giảm lập tức đồng bộ sang POS (Rule 10).")
    add_bullet(doc, "UC-10 (Quy trình 5 bước đảo kệ & Xác nhận điện tử): ", "Nhân viên kho đưa lô date xa lùi vào trong, kéo lô cận date ra sát mép mặt tiền trưng bày, sau đó bấm 'Xác nhận đảo kệ' trên phần mềm để lưu vết thời gian và xóa cảnh báo trên Action Board.")
    add_bullet(doc, "UC-10.1 (Dán tem nhãn giảm giá): ", "«extend» Dán tem chiết khấu lên bao bì sản phẩm tương ứng.")

    # Phân hệ 5
    add_heading_2(doc, "5. Phân hệ Tiêu hủy hàng hỏng & Sổ hao hụt tài chính (Warehouse Staff & Store Manager)")
    add_p(doc, "Hạch toán minh bạch thiệt hại do hàng quá date hoặc hư hỏng vật lý:")
    add_bullet(doc, "Bước 1 (UC-11 - Lập đề xuất tiêu hủy): ", "Nhân viên kho gom hàng hỏng vào khu cách ly, tạo phiếu đề xuất hủy kèm lý do (EXPIRED / DAMAGED / SPOILED).")
    add_bullet(doc, "Bước 2 (UC-12 - Phê duyệt tiêu hủy & Chốt Sổ hao hụt): ", "Cửa hàng trưởng kiểm tra thực tế và bấm duyệt biên bản (Rule 6).")
    add_bullet(doc, "Bước 3 (UC-12.1 - Tính tổn thất tài chính): ", "«include» Tính chính xác CostLoss = QuantityDisposed * ImportPrice, ghi nhận bất biến vào bảng SpoilageRecords.")
    add_bullet(doc, "Bước 4 (UC-12.2 - Trừ kho & Cập nhật DISPOSED): ", "«include» Trừ CurrentQuantity của lô về 0, chuyển trạng thái sang DISPOSED.")

    # Phân hệ 6
    add_heading_2(doc, "6. Phân hệ Dự báo ROP, Đơn đặt hàng DC & Điều hành ca trực (Store Manager & Toàn bộ nhân viên)")
    add_p(doc, "Tối ưu hóa vòng quay hàng tồn kho và điều hành ca làm việc:")
    add_bullet(doc, "UC-13 (Phân tích tốc độ bán 14 ngày & Cảnh báo DOS > DUE): ", "Tính tốc độ bán trung bình ngày (d_base), so sánh Ngày tồn kho (DOS) với Hạn dùng ngắn nhất (DUE). Nếu DOS > DUE, cảnh báo nguy cơ ứ đọng hết hạn trước khi bán hết (Rule 8).")
    add_bullet(doc, "UC-14 (Tính ROP & Đề xuất số lượng đặt): ", "ROP = (d_adjusted * LeadTime) + SafetyStock với d_adjusted = d_base * W_factor * H_factor. Tự động đề xuất số lượng đặt hàng gửi DC.")
    add_bullet(doc, "UC-15 (Phê duyệt & Gửi đơn PO về Kho tổng DC): ", "Cửa hàng trưởng duyệt đơn đặt hàng PurchaseOrder và bấm gửi điện tử về DC Biên Hòa.")
    add_bullet(doc, "UC-16 (Xem Dashboard 6 KPI tài chính & Action Board): ", "Theo dõi tổng vốn tồn kho, vốn rủi ro cận date, tỷ lệ lãng phí Spoilage Rate %, doanh thu hôm nay và danh sách việc khẩn cấp trong ca.")
    add_bullet(doc, "UC-17 (Bàn giao ca trực điện tử 4 bước): ", "Hai nhân viên cùng ca thực hiện: Chốt ca POS & đếm tiền mặt -> Rà soát lô Đỏ/Vàng -> Bàn giao thùng hàng chờ hủy -> Ký biên bản điện tử trên phần mềm.")

    # V. BẢNG DANH MỤC CHI TIẾT USE CASE
    add_heading_1(doc, "V. BẢNG DANH MỤC CHI TIẾT TOÀN BỘ USE CASE HỆ THỐNG")
    tbl_uc = doc.add_table(rows=1, cols=4)
    uc_widths = [0.9, 2.3, 1.4, 2.2]
    uc_headers = ["Mã UC", "Tên Use Case", "Tác Nhân Thực Hiện", "Phân Loại & Quan Hệ"]
    uc_data = [
        ["UC-00", "Đăng nhập hệ thống (JWT)", "Admin, Manager, Cashier, Warehouse", "Xác thực danh tính theo Role"],
        ["UC-01", "Quản trị người dùng & Phân quyền", "Admin", "Quản trị 4 vai trò hệ thống"],
        ["UC-02", "Cấu hình Cửa hàng duy nhất", "Admin, Manager", "Cấu hình StoreProfile LHU Mart (Rule 1)"],
        ["UC-03", "Quản lý SP FMCG & Chống trùng lặp", "Admin, Manager", "Thuật toán chặn trùng >= 85% (Rule 9)"],
        ["UC-04", "Tra cứu Nhật ký kiểm toán AuditLog", "Admin, Manager", "AuditLog bất biến (Rule 11)"],
        ["UC-06", "Tiếp nhận hàng từ xe tải DC", "Warehouse Staff", "Use Case tác nghiệp Inbound"],
        ["UC-06.1", "Kiểm định đạt chuẩn RSL >= 70%", "Warehouse Staff", "«include» của UC-06 (Rule 7)"],
        ["UC-06.2", "Từ chối nhận hàng (Nếu RSL < 70%)", "Warehouse Staff", "«extend» của UC-06"],
        ["UC-06.3", "Sinh mã lô LOT-DC & Theo dõi HSD", "Hệ thống", "«include» của UC-06"],
        ["UC-06.4", "In nhãn tem mã vạch lô lưu kho", "Warehouse Staff", "«extend» của UC-06"],
        ["UC-07", "Bán lẻ tại quầy POS", "Cashier", "Xuất kho bán hàng FEFO"],
        ["UC-07.1", "Tự động xuất lô hạn gần nhất", "Hệ thống", "«include» của UC-07 (Rule 2)"],
        ["UC-07.2", "Tự động bẻ đơn qua nhiều lô", "Hệ thống", "«include» của UC-07 (Split Order)"],
        ["UC-07.3", "Áp dụng giá giảm xả Quick Markdown", "Hệ thống", "«include» của UC-07"],
        ["UC-07.4", "Lưu cờ ngữ cảnh Thời tiết & Lễ", "Cashier", "«include» của UC-07 (Dữ liệu ngoại cảnh)"],
        ["UC-07.5", "In hóa đơn chi tiết kèm mã lô", "Cashier", "«extend» của UC-07"],
        ["UC-08", "Giám sát hạn dùng 3 vùng màu", "Manager, Warehouse Staff", "Kiểm soát Shelf-Life (Rule 4)"],
        ["UC-08.1", "Khóa cứng xuất bán POS (Hết hạn)", "Hệ thống", "«include» của UC-08 (Rule 5)"],
        ["UC-09", "Kích hoạt Quick Markdown (15%-50%)", "Store Manager", "Phê duyệt xả hàng cận date (Rule 10)"],
        ["UC-10", "Thực hiện SOP đảo kệ 5 bước", "Warehouse Staff", "Đảo kệ mặt tiền FEFO (Rule 10)"],
        ["UC-10.1", "Dán tem nhãn giảm giá lên bao bì", "Warehouse Staff", "«extend» của UC-10"],
        ["UC-11", "Lập đề xuất tiêu hủy hàng hỏng", "Warehouse Staff", "Tạo phiếu cách ly hàng hủy"],
        ["UC-12", "Phê duyệt tiêu hủy & Chốt Sổ hao hụt", "Store Manager", "Chốt Sổ hao hụt tài chính (Rule 6)"],
        ["UC-12.1", "Tính tổn thất CostLoss = Qty * GiáVốn", "Hệ thống", "«include» của UC-12"],
        ["UC-12.2", "Trừ kho về 0 & Cập nhật DISPOSED", "Hệ thống", "«include» của UC-12"],
        ["UC-13", "Phân tích tốc độ bán & Cảnh báo DOS>DUE", "Hệ thống, Manager", "Đánh giá nguy cơ ứ đọng (Rule 8)"],
        ["UC-14", "Tính điểm đặt hàng ROP đa yếu tố", "Hệ thống, Manager", "Thuật toán ROP điều chỉnh thời tiết/lễ"],
        ["UC-15", "Phê duyệt & Gửi đơn PO về DC", "Store Manager, DC Supplier", "Đặt hàng bổ sung gửi Kho tổng"],
        ["UC-16", "Xem Dashboard KPI 6 thẻ & Action Board", "Store Manager, Admin", "Giám sát tài chính và việc khẩn cấp"],
        ["UC-17", "Bàn giao ca trực điện tử 4 bước", "Cashier, Warehouse, Manager", "Bàn giao tiền, lô, hàng hủy, ký số"]
    ]
    format_table(tbl_uc, uc_widths, uc_headers, uc_data, header_bg="1E40AF")

    out_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Word_Documents", "THUYET_MINH_CHI_TIET_SO_DO_USE_CASE.docx"))
    doc.save(out_path)
    print(f"Successfully generated detailed Use Case document: {out_path}")

if __name__ == "__main__":
    build_detailed_use_case_doc()
