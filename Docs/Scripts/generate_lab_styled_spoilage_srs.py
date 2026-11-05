# -*- coding: utf-8 -*-
"""
Script to generate the Software Requirements Specification (SRS) Word Document (.docx)
following the EXACT 27-section structure of 'Website Quản Lý Phòng Lab CNTT.docx',
tailored 100% to the Supply Chain Spoilage Predictor project.
"""

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=80, bottom=80, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_title(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(text)
    r.font.bold = True
    r.font.size = Pt(16)
    r.font.color.rgb = RGBColor(15, 76, 129)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    return p

def add_subtitle(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(18)
    r = p.add_run(text)
    r.font.italic = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(100, 116, 139)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    return p

def add_h1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(15, 76, 129)
    return p

def add_h2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.font.bold = True
    r.font.size = Pt(11.5)
    r.font.color.rgb = RGBColor(16, 185, 129)
    return p

def add_p(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run(text)
    r.font.size = Pt(10.5)
    return p

def add_code_block(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(text)
    r.font.name = 'Consolas'
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor(30, 41, 59)
    return p

def create_table(doc, headers, data, widths):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        hdr_cells[i].width = widths[i]
        set_cell_background(hdr_cells[i], "0F4C81")
        set_cell_margins(hdr_cells[i], 100, 100, 120, 120)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            r.font.size = Pt(9)

    for row_idx, row_data in enumerate(data):
        row_cells = table.add_row().cells
        bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, cell_value in enumerate(row_data):
            row_cells[col_idx].text = str(cell_value)
            row_cells[col_idx].width = widths[col_idx]
            set_cell_background(row_cells[col_idx], bg_color)
            set_cell_margins(row_cells[col_idx], 60, 60, 100, 100)
            p = row_cells[col_idx].paragraphs[0]
            for r in p.runs:
                r.font.size = Pt(8.5)
                r.font.color.rgb = RGBColor(30, 41, 59)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    return table

def generate_doc():
    doc = docx.Document()
    
    # Page setup
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.85)
        s.right_margin = Inches(0.85)

    style = doc.styles['Normal']
    style.font.name = 'Times New Roman'
    style.font.size = Pt(10.5)

    # University header
    p_uni = doc.add_paragraph()
    r_uni = p_uni.add_run("TRƯỜNG ĐẠI HỌC LẠC HỒNG (LHU) - KHOA CÔNG NGHỆ THÔNG TIN\n---***---")
    r_uni.font.bold = True
    r_uni.font.size = Pt(10)
    r_uni.font.color.rgb = RGBColor(100, 116, 139)
    p_uni.alignment = WD_ALIGN_PARAGRAPH.CENTER

    add_title(doc, "ĐẶC TẢ WEBSITE NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ\n(SUPPLY CHAIN SPOILAGE PREDICTOR)")
    add_subtitle(doc, "Theo Clean Architecture, sử dụng Microsoft SQL Server và Phương pháp luận Agile Scrum\nGVHD: ThS. Lê Minh Nhật | Nhóm SV: Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946)")

    # 1. Mục tiêu hệ thống
    add_h1(doc, "1. Mục tiêu hệ thống")
    add_p(doc, "Xây dựng website quản lý vận hành cho một Cửa hàng Bán lẻ tinh gọn (Retail Store) duy nhất trong chuỗi cung ứng thực phẩm và hàng tiêu dùng nhanh (FMCG).")
    add_p(doc, "Hệ thống tập trung giải quyết bài toán chống lãng phí, thất thoát vốn do hàng hóa cận date, quá hạn sử dụng thông qua các cơ chế chính:")
    add_p(doc, "- Quản lý tiếp nhận hàng hóa theo từng lô từ Kho tổng (Distribution Center - DC).\n"
              "- Kiểm soát vòng đời (Shelf-Life) từng lô hàng và tự động cảnh báo cận date đa cấp.\n"
              "- Tự động hóa quá trình xuất bán lẻ tại quầy thu ngân (POS) theo nguyên tắc FEFO (First Expired, First Out) - hàng cận date nhất luôn được ưu tiên xuất trước.\n"
              "- Lập biên bản tiêu hủy hàng hỏng, hạch toán số tiền thiệt hại theo giá vốn và trừ sạch tồn kho.\n"
              "- Báo cáo điều hành Dashboard đo lường chính xác Tỷ lệ hao hụt tài chính (Spoilage Rate %).\n"
              "- Đề xuất kế hoạch tái đặt hàng mới gửi về Kho tổng DC.")
    add_p(doc, "Hệ thống sử dụng Microsoft SQL Server LocalDB làm cơ sở dữ liệu chính.")
    add_p(doc, "Do chỉ quản lý 1 cửa hàng bán lẻ duy nhất, hệ thống không cần chức năng luân chuyển phức tạp giữa nhiều cửa hàng. Tất cả danh mục hàng hóa, lô hàng, quầy bán lẻ POS, biên bản tiêu hủy và dashboard đều xoay quanh một cửa hàng bán lẻ cố định.")

    # 2. Phạm vi hệ thống
    add_h1(doc, "2. Phạm vi hệ thống")
    add_p(doc, "Hệ thống quản lý các nhóm dữ liệu và nghiệp vụ chính:")
    add_p(doc, "1. Thông tin cửa hàng bán lẻ duy nhất (StoreProfile)\n"
              "2. Danh mục sản phẩm bán lẻ và mã vạch (SKU/Barcode)\n"
              "3. Danh mục nhà cung cấp & Kho tổng DC (Suppliers/DC)\n"
              "4. Tiếp nhận lô hàng từ Kho tổng DC (Goods Receipts & Batches)\n"
              "5. Người dùng và phân quyền (Cửa hàng trưởng, Thu ngân/Kho)\n"
              "6. Bán lẻ POS và xuất kho tự động theo FEFO (Sales History)\n"
              "7. Giám sát hạn dùng theo 3 ngưỡng an toàn RSL (FEFO Monitor)\n"
              "8. Thao tác nghiệp vụ Đảo kệ hàng cận date ra mặt tiền (Shelf Rotation)\n"
              "9. Thao tác Xả hàng giảm giá 30% kích cầu bán lẻ (Quick Discount)\n"
              "10. Quản lý lập phiếu đề xuất và phê duyệt tiêu hủy hàng hỏng (Spoilage Records)\n"
              "11. Dashboard điều hành trực quan & đo lường Tỷ lệ hao hụt tài chính\n"
              "12. Dự báo điểm đặt hàng ROP và đề xuất tái đặt hàng về Kho DC\n"
              "13. Quản lý sự cố chuỗi cung ứng tại cửa hàng (Hỏng lạnh, rách bao bì)\n"
              "14. Nhật ký kiểm toán và vết dữ liệu toàn hệ thống (System Audit Logs)")

    # 3. Đặc điểm quan trọng của hệ thống
    add_h1(doc, "3. Đặc điểm quan trọng của hệ thống")
    add_h2(doc, "3.1 Chỉ quản lý một cửa hàng bán lẻ duy nhất (Single Retail Store)")
    add_p(doc, "Vì mô hình tập trung vào một cửa hàng bán lẻ tinh gọn, hệ thống triệt để loại bỏ các tính năng gây phình to phạm vi như:")
    add_p(doc, "- Điều chuyển hàng hóa ngang giữa các chi nhánh cửa hàng (Store-to-Store transfer).\n"
              "- Thủ tục thương lượng hoàn trả nhà cung cấp phức tạp (Return to Vendor - RTV).\n"
              "- Phân quyền đa chi nhánh, so sánh doanh số giữa nhiều điểm bán.\n"
              "- Sàn thương mại điện tử trực tuyến B2C nhiều kho.")
    add_p(doc, "Thay vào đó, hệ thống chỉ cần cấu hình thông tin cửa hàng bán lẻ duy nhất. Ví dụ:\n"
              "Tên cửa hàng: VinMart+ LHU Store #01\n"
              "Mã cửa hàng: STORE-01\n"
              "Địa chỉ: Cơ sở Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai\n"
              "Người phụ trách: Cửa hàng trưởng (Store Manager)\n"
              "Trạng thái: Đang hoạt động")

    add_h2(doc, "3.2 Sử dụng Microsoft SQL Server")
    add_p(doc, "Cơ sở dữ liệu sử dụng Microsoft SQL Server LocalDB (retail_spoilage_db).")
    add_p(doc, "Các yêu cầu khi thiết kế database:\n"
              "- Chuẩn hóa 3NF với quan hệ khóa chính (PK), khóa ngoại (FK) chặt chẽ.\n"
              "- Toàn bộ chuỗi tiếng Việt có dấu dùng kiểu NVARCHAR và mã hóa utf-8-sig.\n"
              "- Sử dụng Transaction SQL (BEGIN TRANSACTION / COMMIT / ROLLBACK) cho nghiệp vụ trừ kho FEFO, tiếp nhận lô và duyệt tiêu hủy.\n"
              "- Bắt buộc có ràng buộc CHECK ([current_quantity] >= 0) để không bao giờ xảy ra lỗi tồn kho âm.\n"
              "- Có bảng system_audit_logs lưu lịch sử thao tác của nhân sự.\n"
              "- Thiết lập Index trên các cột tìm kiếm và lọc: sku, expiry_date, status, product_id.")

    add_h2(doc, "3.3 Phương pháp luận phát triển Agile Scrum")
    add_p(doc, "Dự án phát triển theo mô hình Agile Scrum gồm các Sprint ngắn hạn. Phân rã Product Backlog thành các User Stories rõ ràng. Tính năng AI (dự báo tái đặt hàng) được tách riêng thành một module độc lập bổ sung sau, ưu tiên hàng đầu là các module quản lý bán lẻ và kiểm soát date phải chạy ổn định, chính xác trước.")

    # 4. Nhóm người dùng trong hệ thống
    add_h1(doc, "4. Nhóm người dùng trong hệ thống")
    add_h2(doc, "4.1 Cửa hàng trưởng (Store Manager)")
    add_p(doc, "Cửa hàng trưởng có toàn quyền quản trị và chịu trách nhiệm cao nhất tại cửa hàng.")
    add_p(doc, "Chức năng chính:\n"
              "- Xem Dashboard tổng quan: Doanh thu POS, Giá trị tồn kho, Thiệt hại tiêu hủy, Tỷ lệ hao hụt (%).\n"
              "- Xem và phân tích các lô hàng cận date, sản phẩm có nguy cơ hư hỏng cao (DOS > DUE).\n"
              "- Phê duyệt phiếu tiêu hủy hàng hỏng (Chỉ Cửa hàng trưởng duyệt thì kho mới chính thức bị trừ).\n"
              "- Quản lý danh mục sản phẩm, điều chỉnh giá bán lẻ niêm yết tại quầy POS.\n"
              "- Xem và duyệt phiếu đề xuất đơn đặt hàng mới gửi về Kho tổng DC.\n"
              "- Kiểm tra Nhật ký kiểm toán hệ thống (Audit Trail) để truy vết lỗi.")

    add_h2(doc, "4.2 Nhân viên Cửa hàng / Thu ngân (Store Staff / Cashier)")
    add_p(doc, "Nhân viên trực tiếp đứng quầy thu ngân và phụ trách sắp xếp hàng hóa trên kệ.")
    add_p(doc, "Chức năng chính:\n"
              "- Thao tác bán lẻ tại quầy POS: Quét mã hàng, nhập số lượng, in hóa đơn (hệ thống tự động trừ kho FEFO).\n"
              "- Tiếp nhận lô hàng mới từ Kho tổng DC: Nhập mã lô, hạn dùng EXP, số lượng và giá vốn vào CSDL.\n"
              "- Xem danh sách lô hàng FEFO: Phát hiện các lô rơi vào ngưỡng Cảnh báo vàng hoặc Khẩn cấp đỏ.\n"
              "- Thao tác 'Đảo Kệ' (Shelf Rotation): Ghi nhận đã đảo hàng cận date ra mặt tiền trưng bày.\n"
              "- Lập phiếu đề xuất tiêu hủy hàng hỏng (rách bao bì, quá hạn) ở trạng thái Chờ duyệt (PENDING).\n"
              "- Áp dụng xả hàng giảm giá 30% theo sự phân công của Cửa hàng trưởng.")

    add_h2(doc, "4.3 Tiến trình Hệ thống Tự động (System Background Worker)")
    add_p(doc, "Tiến trình chạy nền định kỳ để bảo đảm dữ liệu luôn cập nhật thời gian thực.")
    add_p(doc, "Chức năng chính:\n"
              "- Tự động quét hạn sử dụng hàng ngày: Chuyển các lô có DATEDIFF(day, GETDATE(), expiry_date) < 0 sang trạng thái EXPIRED.\n"
              "- Khóa bán tại quầy POS đối với toàn bộ lô hàng EXPIRED.\n"
              "- Tự động tính toán phân nhóm 3 ngưỡng an toàn RSL (Xanh / Vàng / Đỏ).")

    # 5. Quản lý thông tin cửa hàng bán lẻ duy nhất
    add_h1(doc, "5. Quản lý thông tin cửa hàng bán lẻ duy nhất")
    add_p(doc, "Hệ thống sử dụng bảng store_config hoặc cấu hình hệ thống để lưu thông tin điểm bán lẻ duy nhất.")
    add_p(doc, "Thông tin cần quản lý:\n"
              "- Mã cửa hàng (Store Code): STORE-01\n"
              "- Tên cửa hàng (Store Name): VinMart+ LHU Store #01\n"
              "- Địa chỉ chi nhánh: Cơ sở Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Tỉnh Đồng Nai\n"
              "- Người quản lý chính: Cửa hàng trưởng\n"
              "- Trạng thái hoạt động: ACTIVE (Đang hoạt động), CLOSED (Tạm đóng cửa)\n"
              "- Thiết lập cảnh báo mặc định: Số ngày cảnh báo cận date mặc định (7 ngày), Tồn kho tối thiểu.")

    # 6. Quản lý danh mục hàng hóa bán lẻ
    add_h1(doc, "6. Quản lý danh mục hàng hóa bán lẻ")
    add_p(doc, "Mỗi mặt hàng bán lẻ được quản lý thông tin định danh và thuộc tính chuỗi cung ứng.")
    add_p(doc, "Thông tin sản phẩm:\n"
              "- Mã SKU / Barcode: Mã vạch định danh duy nhất (VD: 8934567890101, MILK-VNM-1L)\n"
              "- Tên sản phẩm: Tên hàng hóa chi tiết (VD: Sữa tươi Vinamilk Tiệt Trùng 100% Có đường 1L)\n"
              "- Ngành hàng (Category): Sữa & Chế phẩm, Bánh mì & Đồ ăn nhanh, Nước giải khát, Thực phẩm mát...\n"
              "- Đơn vị tính (Unit): Hộp, Hũ, Gói, Lon, Chai, Khay, Cái\n"
              "- Giá vốn nhập kho (Cost Price): Giá cửa hàng mua từ Kho tổng DC\n"
              "- Giá bán lẻ niêm yết (POS Selling Price): Giá bán cho khách hàng tại quầy thu ngân\n"
              "- Hạn sử dụng tiêu chuẩn (Standard Shelf-Life Days): Số ngày từ khi sản xuất đến khi hết hạn (VD: Bánh mì 7 ngày, Sữa 180 ngày)\n"
              "- Tồn kho an toàn (Safety Stock): Lượng hàng đệm tối thiểu chống đứt hàng\n"
              "- Điểm đặt hàng (Reorder Point - ROP): Ngưỡng kích hoạt lệnh đặt hàng về Kho DC\n"
              "- Trạng thái: ACTIVE (Đang kinh doanh), DISCONTINUED (Ngừng kinh doanh)")
    add_p(doc, "Cơ chế chống trùng lặp sản phẩm thông minh:\n"
              "Khi thêm mới sản phẩm, hệ thống tự động bóc tách từ khóa, loại bỏ dấu tiếng Việt và dung tích để kiểm tra trùng lặp với danh mục hiện có, ngăn chặn tình trạng tạo rác CSDL.")

    # 7. Quản lý lô hàng và hạn sử dụng (Shelf-Life & Batches)
    add_h1(doc, "7. Quản lý lô hàng và hạn sử dụng")
    add_p(doc, "Toàn bộ hàng hóa trong cửa hàng được quản lý chi tiết theo từng Lô hàng (Batch). Không quản lý gộp chung số lượng.")
    add_p(doc, "Thông tin lô hàng:\n"
              "- Mã Lô (Batch Code): In trên thùng hoặc bao bì (VD: BAT-DC-20260920, BAT-KD-250G)\n"
              "- Sản phẩm trực thuộc (Product ID)\n"
              "- Ngày nhập kho (Import Date)\n"
              "- Ngày sản xuất (Manufacture Date)\n"
              "- Hạn sử dụng (Expiry Date - EXP)\n"
              "- Số lượng nhập ban đầu (Initial Quantity)\n"
              "- Số lượng tồn hiện tại (Current Quantity)\n"
              "- Giá vốn nhập của lô (Import Price)\n"
              "- Phần trăm giảm giá (Discount Percent: 0% hoặc 30%)\n"
              "- Trạng thái đảo kệ (is_shelf_rotated: 0 hoặc 1)\n"
              "- Trạng thái lô hàng (Status)")
    add_p(doc, "Mô hình 3 Ngưỡng an toàn RSL (Remaining Shelf-Life %):\n"
              "Công thức tính: RSL % = [(Expiry Date - Ngày hiện tại) / (Expiry Date - Ngày nhập)] × 100%\n"
              "• SAFE (Xanh lá): RSL > 20% và Hạn dùng > 7 ngày → Hàng an toàn trên kệ.\n"
              "• WARNING (Vàng): 10% < RSL ≤ 20% hoặc Hạn dùng từ 4 đến 7 ngày → Cần đảo ra đầu kệ.\n"
              "• CRITICAL (Đỏ): RSL ≤ 10% hoặc Hạn dùng ≤ 3 ngày → Nguy cơ hư hỏng cao, kích hoạt xả hàng.\n"
              "• EXPIRED (Tím): Hạn dùng < Ngày hiện tại → Quá hạn, khóa bán POS, lập phiếu hủy.\n"
              "• DISPOSED (Xám): Tồn kho = 0 (Đã xuất bán hết hoặc đã tiêu hủy hoàn tất).")

    # 8. Tiếp nhận hàng từ Kho tổng DC
    add_h1(doc, "8. Tiếp nhận hàng từ Kho tổng DC")
    add_p(doc, "Quy trình đưa hàng hóa mới từ Kho tổng (DC) nhập kho cửa hàng bán lẻ.")
    add_p(doc, "Quy trình thực hiện:\n"
              "1. Nhân viên kiểm tra đơn giao hàng từ xe DC đến cửa hàng.\n"
              "2. Chọn sản phẩm từ danh mục có sẵn hoặc tạo sản phẩm mới.\n"
              "3. Hệ thống tự động đề xuất Hạn sử dụng (EXP Date) = Ngày nhập + Hạn tiêu chuẩn của sản phẩm.\n"
              "4. Nhân viên đối soát mã lô và hạn in thực tế trên bao bì, chỉnh sửa nếu có sai lệch.\n"
              "5. Nhập số lượng thực nhận và giá vốn của lô hàng.\n"
              "6. Tùy chọn: Đồng bộ cập nhật Giá bán lẻ POS mới nếu giá nhập biến động.\n"
              "7. Bấm 'Ghi nhận Lô hàng' → Hệ thống chạy Transaction SQL: thêm lô mới vào bảng batches, tăng tồn kho và ghi nhận system_audit_logs.")
    add_p(doc, "Điều kiện kiểm tra khi nhập hàng:\n"
              "- EXP Date bắt buộc phải lớn hơn Import Date.\n"
              "- Số lượng nhập và Giá vốn nhập phải lớn hơn 0.\n"
              "- Mã lô không được trùng lặp.")

    # 9. Quản lý bán lẻ POS và tự động xuất kho FEFO
    add_h1(doc, "9. Quản lý bán lẻ POS và tự động xuất kho FEFO")
    add_p(doc, "Mô phỏng quầy thu ngân bán lẻ thực tế. Xuất bán lẻ cho người tiêu dùng đồng nghĩa với Xuất kho cửa hàng.")
    add_p(doc, "Nguyên tắc xuất kho FEFO (First Expired, First Out):\n"
              "Thu ngân quét mã sản phẩm và chọn số lượng khách mua. Thu ngân hoàn toàn KHÔNG CẦN phải tự chọn lô bằng tay. Thuật toán FEFO chạy trên SQL Server sẽ tự động truy vấn các lô có hạn gần nhất trước và trừ dần số lượng.")
    add_p(doc, "Thuật toán truy vấn FEFO trên SQL Server:\n"
              "SELECT id, batch_code, current_quantity, expiry_date\n"
              "FROM batches\n"
              "WHERE product_id = @ProductId AND current_quantity > 0 AND status != 'EXPIRED' AND DATEDIFF(day, GETDATE(), expiry_date) >= 0\n"
              "ORDER BY expiry_date ASC, id ASC;")
    add_p(doc, "Điều kiện bảo vệ tồn kho:\n"
              "- Tuyệt đối không cho phép bán âm kho: Nếu tổng tồn khả dụng của các lô chưa hết hạn < Số lượng khách mua, hệ thống lập tức từ chối thanh toán và báo lỗi chi tiết.\n"
              "- Tuyệt đối không bán lô đã quá hạn (status = 'EXPIRED' hoặc DATEDIFF < 0).\n"
              "- Sinh mã hóa đơn duy nhất (VD: HD-0924-001) và in biên lai chi tiết thể hiện từng lô bị trừ.")

    # 10. Quản lý tiêu hủy hàng hỏng & Sổ hao hụt tài chính
    add_h1(doc, "10. Quản lý tiêu hủy hàng hỏng & Sổ hao hụt tài chính")
    add_p(doc, "Xử lý hàng hóa không còn khả năng bán (quá date, rách bao bì chân không, lỗi nhiệt độ bảo quản lạnh).")
    add_p(doc, "Quy trình kiểm soát 2 bước chuẩn mực:\n"
              "Bước 1 (Lập phiếu đề xuất): Nhân viên phát hiện hàng hỏng, chọn lô hàng (số lượng hủy tự động điền bằng số tồn của lô), chọn lý do (EXPIRED, DAMAGED, SPOILED) và gửi phiếu. Phiếu ở trạng thái Chờ duyệt (PENDING).\n"
              "Bước 2 (Phê duyệt thẩm quyền): Cửa hàng trưởng kiểm tra thực tế và bấm 'Duyệt Hủy'. Hệ thống thực thi Transaction SQL: chuyển trạng thái phiếu sang APPROVED, trừ sạch số lượng tồn của lô về 0 (chuyển status thành DISPOSED), ghi nhận số tiền thiệt hại tài chính và ghi AuditLog.")
    add_p(doc, "Công thức hạch toán thiệt hại tài chính:\n"
              "Thiệt hại tài chính (Cost Loss) = Số lượng tiêu hủy × Giá vốn nhập kho (Cost Price)\n"
              "Lưu ý: Hạch toán theo giá vốn, không tính theo giá bán lẻ niêm yết.")

    # 11. Dashboard hệ thống
    add_h1(doc, "11. Dashboard hệ thống")
    add_p(doc, "Cung cấp bức tranh toàn cảnh về vận hành và tài chính của cửa hàng bán lẻ.")
    add_h2(doc, "11.1 Các chỉ số KPI trọng tâm (Executive KPI Cards)")
    add_p(doc, "1. Tổng tồn kho trên kệ: Tổng số lượng hàng hóa khả dụng chưa hết hạn.\n"
              "2. Giá trị tồn kho theo giá vốn: Tổng tiền vốn đang lưu trên kệ hàng.\n"
              "3. Doanh thu bán lẻ POS: Tổng tiền thu được từ khách hàng qua quầy POS.\n"
              "4. Số lô cận date khẩn cấp (≤ 10%): Cảnh báo đỏ các lô cần xử lý ngay.\n"
              "5. Thiệt hại tiêu hủy: Tổng số tiền vốn bị mất do đổ bỏ hàng hỏng.\n"
              "6. Tỷ lệ hao hụt (Spoilage Rate %): Thước đo hiệu quả quản trị chuỗi cung ứng.")
    add_p(doc, "Công thức tính Tỷ lệ hao hụt:\n"
              "Spoilage Rate (%) = (Tổng thiệt hại tiêu hủy / Tổng giá trị hàng đã nhập kho) × 100%\n"
              "Mục tiêu chuẩn ngành bán lẻ FMCG: Spoilage Rate < 1.5% (Tối ưu).")

    add_h2(doc, "11.2 Bảng cảnh báo nguy cơ lãng phí (DOS > DUE)")
    add_p(doc, "Ứng dụng điều kiện nghịch đảo giữa Tốc độ bán và Hạn sử dụng:\n"
              "- Số ngày cần để bán hết tồn kho: DOS (Days of Supply) = Tồn kho khả dụng / Tốc độ bán ngày (d)\n"
              "- Số ngày còn lại đến hạn sử dụng của lô gần nhất: DUE (Days until Expiry)\n"
              "- Quy tắc cảnh báo: Nếu DOS > DUE (hàng không kịp bán hết trước khi quá hạn), hệ thống đánh dấu nguy cơ rủi ro CAO và khuyến nghị kích hoạt xả hàng giảm giá 30% ngay lập tức.")

    # 12. Quản lý đảo kệ hàng FEFO (Shelf Rotation)
    add_h1(doc, "12. Quản lý đảo kệ hàng FEFO")
    add_p(doc, "Nghiệp vụ thực tế tại điểm bán lẻ: Khách mua hàng có xu hướng với tay lấy sản phẩm bày ở mặt ngoài trước. Vì vậy, khi hệ thống cảnh báo một lô hàng rơi vào vùng Vàng (Cận date nhẹ), nhân viên phải ra kệ xếp lô đó ra mặt tiền đầu kệ.")
    add_p(doc, "Trên phần mềm, nhân viên bấm nút 'Đảo Kệ' → Hệ thống cập nhật is_shelf_rotated = 1 vào bảng batches trong SQL Server và ghi vết kiểm toán để Cửa hàng trưởng giám sát sự tuân thủ quy trình.")

    # 13. Quản lý xả hàng giảm giá kích cầu (Discount Clearance)
    add_h1(doc, "13. Quản lý xả hàng giảm giá kích cầu")
    add_p(doc, "Khi một lô hàng rơi vào vùng Đỏ (≤ 3 ngày) hoặc có DOS > DUE, việc giữ nguyên giá bán lẻ sẽ dẫn đến nguy cơ phải tiêu hủy mất trắng 100% giá vốn.")
    add_p(doc, "Cửa hàng trưởng hoặc Thu ngân bấm 'Giảm 30% Xả Hàng' → Hệ thống cập nhật discount_percent = 30 vào SQL Server. Lúc này:\n"
              "- Tốc độ bán lẻ dự kiến được kích cầu tăng 50% (Hệ số K_discount = 1.5).\n"
              "- Giúp giải phóng lượng tồn kho kịp thời trước khi quá hạn, thu hồi tối đa dòng vốn.")

    # 14. Quản lý đề xuất tái đặt hàng gửi Kho tổng DC (ROP Reorder Forecast)
    add_h1(doc, "14. Quản lý đề xuất tái đặt hàng gửi Kho tổng DC")
    add_p(doc, "Tính năng dự báo nâng cao được thiết kế thành một Module độc lập (bổ sung sau theo đúng chỉ dẫn của Thầy).")
    add_p(doc, "Nguyên lý tính toán Điểm đặt hàng ROP (Reorder Point):\n"
              "ROP = (d × L) + SS\n"
              "Trong đó:\n"
              "- d (Daily Demand): Tốc độ bán trung bình ngày của sản phẩm.\n"
              "- L (Lead Time): Thời gian giao hàng từ Kho tổng DC đến cửa hàng (mặc định L = 2 ngày).\n"
              "- SS (Safety Stock): Lượng tồn kho an toàn đệm dưới đáy kệ.\n"
              "Quy tắc kích hoạt: Khi Tồn kho khả dụng ≤ ROP, hệ thống tự động hiển thị nút 'Đặt DC' với số lượng gợi ý = ROP × 2. Lô hàng tái đặt mới sẽ được tự động gán hạn sử dụng chuẩn theo từng loại sản phẩm.")

    # 15. Quản lý sự cố chuỗi cung ứng tại cửa hàng
    add_h1(doc, "15. Quản lý sự cố chuỗi cung ứng tại cửa hàng")
    add_p(doc, "Quản lý các sự cố bất khả kháng xảy ra tại điểm bán lẻ dẫn đến hàng hóa bị hư hỏng trước hạn:")
    add_p(doc, "1. Lỗi đứt gãy chuỗi lạnh (Cold Chain Failure): Tủ mát, tủ đông mất điện hoặc quá nhiệt độ chuẩn (Sữa chua, Thịt tươi bị chua/hỏng sớm) → Lý do hủy: COLD_CHAIN_FAIL.\n"
              "2. Rách/vỡ bao bì trên kệ (Damaged Packaging): Khách làm rơi, bao bì hút chân không bị xì rách → Lý do hủy: DAMAGED_SHELF.\n"
              "3. Hư hỏng do vận chuyển (Transit Defect): Thùng hàng từ DC giao đến bị móp méo, dập nát → Lý do hủy: TRANSIT_DEFECT.")

    # 16. Phân quyền chức năng (Ma trận phân quyền)
    add_h1(doc, "16. Phân quyền chức năng")
    perm_headers = ["Chức năng / Nghiệp vụ", "Cửa hàng trưởng (Manager)", "Thu ngân / Nhân viên kho (Staff)", "Tiến trình Hệ thống"]
    perm_data = [
        ["Xem Dashboard tổng quan & KPI", "Có", "Có (xem chỉ số cơ bản)", "Cập nhật ngầm"],
        ["Tiếp nhận lô hàng mới từ DC", "Có", "Có", "Không"],
        ["Giám sát hạn sử dụng FEFO", "Có", "Có", "Tự động phân 3 ngưỡng"],
        ["Thao tác Đảo Kệ ra mặt tiền", "Có", "Có", "Không"],
        ["Áp dụng Xả hàng giảm giá 30%", "Có", "Có", "Đề xuất kích cầu"],
        ["Bán lẻ POS (Trừ kho tự động)", "Có", "Có (thao tác chính)", "Tự động trừ theo FEFO"],
        ["Lập phiếu đề xuất tiêu hủy", "Có (tự duyệt)", "Có (Chờ duyệt)", "Không"],
        ["Phê duyệt phiếu tiêu hủy (Trừ kho)", "Có (Thẩm quyền duyệt)", "Không có quyền", "Không"],
        ["Cấu hình sản phẩm & giá bán POS", "Có", "Không có quyền", "Không"],
        ["Xem Nhật ký Audit Trail", "Có", "Không có quyền", "Tự động ghi vết log"],
        ["Đặt hàng tái tiếp tế gửi Kho DC", "Có", "Không có quyền", "Tính toán gợi ý ROP"]
    ]
    create_table(doc, perm_headers, perm_data, [Inches(2.5), Inches(1.6), Inches(1.8), Inches(1.3)])

    # 17. Thiết kế database SQL Server
    add_h1(doc, "17. Thiết kế database SQL Server")
    add_p(doc, "Cơ sở dữ liệu Microsoft SQL Server (retail_spoilage_db) được chuẩn hóa 3NF gồm 12 bảng chi tiết:")

    ddl_scripts = [
        ("17.1 Bảng users (Nhân sự & Phân quyền)",
         "CREATE TABLE [dbo].[users] (\n"
         "    [id] INT IDENTITY(1,1) PRIMARY KEY,\n"
         "    [username] NVARCHAR(50) NOT NULL UNIQUE,\n"
         "    [password_hash] NVARCHAR(255) NOT NULL,\n"
         "    [full_name] NVARCHAR(100) NOT NULL,\n"
         "    [role] NVARCHAR(20) NOT NULL DEFAULT 'STAFF' CHECK ([role] IN ('MANAGER', 'STAFF')),\n"
         "    [is_active] BIT NOT NULL DEFAULT 1,\n"
         "    [created_at] DATETIME DEFAULT GETDATE()\n"
         ");"),

        ("17.2 Bảng categories (Ngành hàng bán lẻ)",
         "CREATE TABLE [dbo].[categories] (\n"
         "    [id] INT IDENTITY(1,1) PRIMARY KEY,\n"
         "    [code] NVARCHAR(30) NOT NULL UNIQUE,\n"
         "    [name] NVARCHAR(100) NOT NULL,\n"
         "    [description] NVARCHAR(255) NULL,\n"
         "    [default_warning_days] INT NOT NULL DEFAULT 7,\n"
         "    [created_at] DATETIME DEFAULT GETDATE()\n"
         ");"),

        ("17.3 Bảng suppliers (Nhà cung cấp & Kho tổng DC)",
         "CREATE TABLE [dbo].[suppliers] (\n"
         "    [id] INT IDENTITY(1,1) PRIMARY KEY,\n"
         "    [code] NVARCHAR(30) NOT NULL UNIQUE,\n"
         "    [name] NVARCHAR(150) NOT NULL,\n"
         "    [lead_time_days] INT NOT NULL DEFAULT 2,\n"
         "    [is_active] BIT NOT NULL DEFAULT 1,\n"
         "    [created_at] DATETIME DEFAULT GETDATE()\n"
         ");"),

        ("17.4 Bảng products (Sản phẩm bán lẻ)",
         "CREATE TABLE [dbo].[products] (\n"
         "    [id] INT IDENTITY(1,1) PRIMARY KEY,\n"
         "    [sku] NVARCHAR(50) NOT NULL UNIQUE,\n"
         "    [name] NVARCHAR(150) NOT NULL,\n"
         "    [category_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[categories]([id]),\n"
         "    [default_supplier_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[suppliers]([id]),\n"
         "    [unit] NVARCHAR(20) NOT NULL,\n"
         "    [cost_price] DECIMAL(12, 2) NOT NULL DEFAULT 0.00,\n"
         "    [selling_price] DECIMAL(12, 2) NOT NULL DEFAULT 0.00,\n"
         "    [standard_shelf_life_days] INT NOT NULL,\n"
         "    [min_stock_level] INT NOT NULL DEFAULT 15,\n"
         "    [max_stock_level] INT NOT NULL DEFAULT 150,\n"
         "    [is_active] BIT NOT NULL DEFAULT 1,\n"
         "    [created_at] DATETIME DEFAULT GETDATE()\n"
         ");"),

        ("17.5 Bảng goods_receipts (Đợt nhập hàng từ DC)",
         "CREATE TABLE [dbo].[goods_receipts] (\n"
         "    [id] INT IDENTITY(1,1) PRIMARY KEY,\n"
         "    [receipt_number] NVARCHAR(50) NOT NULL UNIQUE,\n"
         "    [supplier_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[suppliers]([id]),\n"
         "    [received_by] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),\n"
         "    [receipt_date] DATE NOT NULL,\n"
         "    [total_cost] DECIMAL(14, 2) NOT NULL DEFAULT 0.00,\n"
         "    [status] NVARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK ([status] IN ('PENDING', 'COMPLETED', 'CANCELLED')),\n"
         "    [created_at] DATETIME DEFAULT GETDATE()\n"
         ");"),

        ("17.6 Bảng batches (Lô hàng & Kiểm soát Shelf-Life)",
         "CREATE TABLE [dbo].[batches] (\n"
         "    [id] INT IDENTITY(1,1) PRIMARY KEY,\n"
         "    [receipt_id] INT NULL FOREIGN KEY REFERENCES [dbo].[goods_receipts]([id]),\n"
         "    [batch_code] NVARCHAR(50) NOT NULL UNIQUE,\n"
         "    [product_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[products]([id]),\n"
         "    [import_date] DATE NOT NULL,\n"
         "    [manufacture_date] DATE NOT NULL,\n"
         "    [expiry_date] DATE NOT NULL,\n"
         "    [initial_quantity] INT NOT NULL,\n"
         "    [current_quantity] INT NOT NULL DEFAULT 0,\n"
         "    [import_price] DECIMAL(12, 2) NOT NULL,\n"
         "    [discount_percent] INT NOT NULL DEFAULT 0 CHECK ([discount_percent] BETWEEN 0 AND 100),\n"
         "    [is_shelf_rotated] BIT NOT NULL DEFAULT 0,\n"
         "    [status] NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK ([status] IN ('ACTIVE', 'WARNING', 'CRITICAL', 'EXPIRED', 'DISPOSED')),\n"
         "    [created_at] DATETIME DEFAULT GETDATE(),\n"
         "    CONSTRAINT [chk_batch_quantity] CHECK ([current_quantity] >= 0 AND [current_quantity] <= [initial_quantity]),\n"
         "    CONSTRAINT [chk_batch_dates] CHECK ([expiry_date] > [import_date])\n"
         ");"),

        ("17.7 Bảng sales_history (Lịch sử bán lẻ POS & Vết trừ FEFO)",
         "CREATE TABLE [dbo].[sales_history] (\n"
         "    [id] INT IDENTITY(1,1) PRIMARY KEY,\n"
         "    [transaction_code] NVARCHAR(50) NOT NULL,\n"
         "    [product_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[products]([id]),\n"
         "    [batch_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[batches]([id]),\n"
         "    [quantity_sold] INT NOT NULL CHECK ([quantity_sold] > 0),\n"
         "    [sale_price] DECIMAL(12, 2) NOT NULL,\n"
         "    [total_amount] DECIMAL(12, 2) NOT NULL,\n"
         "    [sale_date] DATE NOT NULL,\n"
         "    [day_of_week] NVARCHAR(10) NOT NULL,\n"
         "    [weather] NVARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK ([weather] IN ('SUNNY', 'RAINY', 'NORMAL')),\n"
         "    [is_holiday] BIT NOT NULL DEFAULT 0,\n"
         "    [created_at] DATETIME DEFAULT GETDATE()\n"
         ");"),

        ("17.8 Bảng spoilage_records (Biên bản tiêu hủy & Hao hụt tài chính)",
         "CREATE TABLE [dbo].[spoilage_records] (\n"
         "    [id] INT IDENTITY(1,1) PRIMARY KEY,\n"
         "    [record_code] NVARCHAR(50) NOT NULL UNIQUE,\n"
         "    [batch_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[batches]([id]),\n"
         "    [disposed_date] DATE NOT NULL,\n"
         "    [quantity_disposed] INT NOT NULL CHECK ([quantity_disposed] > 0),\n"
         "    [cost_loss] DECIMAL(12, 2) NOT NULL,\n"
         "    [reason] NVARCHAR(20) NOT NULL DEFAULT 'EXPIRED' CHECK ([reason] IN ('EXPIRED', 'DAMAGED', 'SPOILED')),\n"
         "    [notes] NVARCHAR(255) NULL,\n"
         "    [performed_by] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),\n"
         "    [created_at] DATETIME DEFAULT GETDATE()\n"
         ");"),

        ("17.9 Bảng purchase_orders (Đơn đặt hàng gửi Kho tổng DC)",
         "CREATE TABLE [dbo].[purchase_orders] (\n"
         "    [id] INT IDENTITY(1,1) PRIMARY KEY,\n"
         "    [order_code] NVARCHAR(50) NOT NULL UNIQUE,\n"
         "    [supplier_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[suppliers]([id]),\n"
         "    [created_by] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),\n"
         "    [approved_by] INT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),\n"
         "    [status] NVARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK ([status] IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'DELIVERED', 'CANCELLED')),\n"
         "    [total_estimated_cost] DECIMAL(14, 2) NOT NULL DEFAULT 0.00,\n"
         "    [created_at] DATETIME DEFAULT GETDATE()\n"
         ");"),

        ("17.10 Bảng purchase_order_items (Chi tiết mặt hàng đặt DC)",
         "CREATE TABLE [dbo].[purchase_order_items] (\n"
         "    [id] INT IDENTITY(1,1) PRIMARY KEY,\n"
         "    [order_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[purchase_orders]([id]) ON DELETE CASCADE,\n"
         "    [product_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[products]([id]),\n"
         "    [current_stock_at_order] INT NOT NULL,\n"
         "    [suggested_quantity] INT NOT NULL,\n"
         "    [approved_quantity] INT NOT NULL,\n"
         "    [unit_cost] DECIMAL(12, 2) NOT NULL,\n"
         "    [total_line_cost] DECIMAL(14, 2) NOT NULL\n"
         ");"),

        ("17.11 Bảng system_audit_logs (Nhật ký kiểm toán hệ thống)",
         "CREATE TABLE [dbo].[system_audit_logs] (\n"
         "    [id] BIGINT IDENTITY(1,1) PRIMARY KEY,\n"
         "    [user_id] INT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),\n"
         "    [action_type] NVARCHAR(50) NOT NULL,\n"
         "    [description] NVARCHAR(MAX) NOT NULL,\n"
         "    [ip_address] NVARCHAR(45) NULL,\n"
         "    [created_at] DATETIME DEFAULT GETDATE()\n"
         ");"),

        ("17.12 Bảng system_settings (Cấu hình hệ thống cửa hàng)",
         "CREATE TABLE [dbo].[system_settings] (\n"
         "    [id] INT IDENTITY(1,1) PRIMARY KEY,\n"
         "    [setting_key] NVARCHAR(50) NOT NULL UNIQUE,\n"
         "    [setting_value] NVARCHAR(255) NOT NULL,\n"
         "    [description] NVARCHAR(255) NULL,\n"
         "    [updated_at] DATETIME DEFAULT GETDATE()\n"
         ");")
    ]

    for title, sql in ddl_scripts:
        add_h2(doc, title)
        add_code_block(doc, sql)

    # 18. Index SQL Server nên có
    add_h1(doc, "18. Index SQL Server nên có")
    add_p(doc, "Để đảm bảo tốc độ xuất kho FEFO và tổng hợp Dashboard nhanh chóng dưới 50ms, hệ thống thiết lập các chỉ mục tối ưu:")
    add_code_block(doc, 
        "CREATE INDEX [idx_products_sku] ON [dbo].[products] ([sku]);\n"
        "CREATE INDEX [idx_batches_fefo] ON [dbo].[batches] ([product_id], [status], [expiry_date]);\n"
        "CREATE INDEX [idx_batches_expiry] ON [dbo].[batches] ([expiry_date], [status]);\n"
        "CREATE INDEX [idx_sales_product_date] ON [dbo].[sales_history] ([product_id], [sale_date]);\n"
        "CREATE INDEX [idx_spoilage_batch] ON [dbo].[spoilage_records] ([batch_id], [disposed_date]);\n"
        "CREATE INDEX [idx_audit_created] ON [dbo].[system_audit_logs] ([created_at] DESC);"
    )

    # 19. Clean Architecture đề xuất
    add_h1(doc, "19. Clean Architecture đề xuất")
    add_p(doc, "Hệ thống được thiết kế theo mô hình Clean Architecture gồm 4 phân tầng độc lập:")
    add_p(doc, "1. Domain Layer: Chứa Enterprise Business Rules, Entities (Product, Batch, SaleOrder, SpoilageRecord) và Domain Services (FEFO Deduction Engine, Shelf-Life Evaluator). Lớp này hoàn toàn độc lập với database, framework hay UI.\n"
              "2. Application Layer: Chứa Use Cases điều phối luồng nghiệp vụ ứng dụng (ProcessFefoSale, IntakeBatch, ApproveDisposal, CalculateForecast).\n"
              "3. Infrastructure Layer: Triển khai kết nối Microsoft SQL Server LocalDB, Transaction Runner, Logger và File storage.\n"
              "4. Presentation Layer: RESTful API Controllers và giao diện người dùng React/Vite SPA.")
    add_p(doc, "Quy tắc phụ thuộc một chiều (Dependency Rule):\n"
              "Presentation → Application → Domain\n"
              "Infrastructure → Application / Domain\n"
              "Domain không phụ thuộc bất kỳ thư viện bên ngoài nào.")

    # 20. Cấu trúc thư mục backend đề xuất
    add_h1(doc, "20. Cấu trúc thư mục backend đề xuất")
    add_p(doc, "Cấu trúc thư mục theo Clean Architecture cho Backend:")
    backend_tree = (
        "Backend/\n"
        "├── domain/\n"
        "│   ├── entities/\n"
        "│   │   ├── User.js\n"
        "│   │   ├── Product.js\n"
        "│   │   ├── Batch.js\n"
        "│   │   ├── SaleTransaction.js\n"
        "│   │   └── SpoilageRecord.js\n"
        "│   ├── value-objects/\n"
        "│   │   ├── BatchStatus.js (ACTIVE, WARNING, CRITICAL, EXPIRED, DISPOSED)\n"
        "│   │   ├── RslThreshold.js (SAFE, WARNING, CRITICAL)\n"
        "│   │   └── Money.js\n"
        "│   └── services/\n"
        "│       ├── FefoAllocationEngine.js\n"
        "│       └── SpoilageRateCalculator.js\n"
        "├── application/\n"
        "│   ├── use-cases/\n"
        "│   │   ├── ProcessFefoSaleUseCase.js\n"
        "│   │   ├── IntakeBatchFromDcUseCase.js\n"
        "│   │   ├── ApproveDisposalUseCase.js\n"
        "│   │   ├── RotateShelfUseCase.js\n"
        "│   │   ├── ApplyQuickDiscountUseCase.js\n"
        "│   │   └── GetDashboardOverviewUseCase.js\n"
        "│   └── ports/\n"
        "│       ├── IProductRepository.js\n"
        "│       ├── IBatchRepository.js\n"
        "│       └── ISaleRepository.js\n"
        "├── infrastructure/\n"
        "│   ├── database/\n"
        "│   │   ├── sqlserver-connection.js\n"
        "│   │   ├── repositories/\n"
        "│   │   │   ├── SqlProductRepository.js\n"
        "│   │   │   ├── SqlBatchRepository.js\n"
        "│   │   │   └── SqlSaleRepository.js\n"
        "│   │   └── transactions/\n"
        "│   │       └── SqlTransactionManager.js\n"
        "├── presentation/\n"
        "│   ├── controllers/\n"
        "│   │   ├── ProductController.js\n"
        "│   │   ├── BatchController.js\n"
        "│   │   ├── PosSaleController.js\n"
        "│   │   ├── SpoilageController.js\n"
        "│   │   └── DashboardController.js\n"
        "│   └── routes/\n"
        "│       └── apiRoutes.js\n"
        "├── db.js (Data Access Layer - SQL Server LocalDB client)\n"
        "└── server.js (Express server entry point)"
    )
    add_code_block(doc, backend_tree)

    # 21. Các use case quan trọng
    add_h1(doc, "21. Các use case quan trọng")
    add_h2(doc, "21.1 ProcessFefoSaleUseCase (Bán hàng POS xuất kho FEFO)")
    add_p(doc, "Nhiệm vụ:\n"
              "1. Nhận giỏ hàng từ quầy POS (danh sách ProductId, Quantity, Price).\n"
              "2. Với từng sản phẩm, truy vấn các lô hàng chưa hết hạn sắp xếp theo expiry_date ASC.\n"
              "3. Kiểm tra tổng tồn kho khả dụng có đủ đáp ứng không (Nếu thiếu → Ném ngoại lệ, từ chối bán, bảo vệ không âm kho).\n"
              "4. Khởi chạy Transaction SQL: Trừ số lượng từng lô theo nguyên tắc FEFO.\n"
              "5. Ghi nhận giao dịch vào bảng sales_history.\n"
              "6. Ghi nhận nhật ký vào system_audit_logs.\n"
              "7. Commit Transaction và trả về mã hóa đơn kèm chi tiết các lô bị trừ kho.")

    add_h2(doc, "21.2 IntakeBatchFromDcUseCase (Tiếp nhận lô hàng từ DC)")
    add_p(doc, "Nhiệm vụ:\n"
              "1. Kiểm tra tính hợp lệ của ngày hết hạn: EXP Date > Import Date.\n"
              "2. Kiểm tra số lượng nhập và đơn giá vốn > 0.\n"
              "3. Chạy Transaction SQL: Chèn bản ghi lô mới vào bảng batches với status = 'ACTIVE'.\n"
              "4. Nếu người dùng chọn đồng bộ giá bán lẻ POS mới, cập nhật selling_price của sản phẩm trong bảng products.\n"
              "5. Ghi vết kiểm toán vào system_audit_logs và Commit Transaction.")

    add_h2(doc, "21.3 ApproveDisposalUseCase (Phê duyệt tiêu hủy hàng hỏng)")
    add_p(doc, "Nhiệm vụ:\n"
              "1. Xác thực thẩm quyền: Chỉ tài khoản Cửa hàng trưởng (MANAGER) mới được duyệt.\n"
              "2. Kiểm tra mã phiếu đề xuất trong bảng spoilage_records.\n"
              "3. Chạy Transaction SQL: Cập nhật status của phiếu sang 'APPROVED'.\n"
              "4. Trừ sạch số lượng tồn kho của lô hàng về 0 và chuyển status của lô sang 'DISPOSED'.\n"
              "5. Ghi vết kiểm toán ghi nhận Cửa hàng trưởng đã duyệt tiêu hủy và Commit Transaction.")

    add_h2(doc, "21.4 RotateShelfUseCase (Đảo kệ hàng FEFO)")
    add_p(doc, "Nhiệm vụ:\n"
              "1. Nhận BatchId cần đảo kệ.\n"
              "2. Cập nhật is_shelf_rotated = 1 trong bảng batches.\n"
              "3. Ghi nhận vào system_audit_logs: 'Nhân viên đã đảo Lô ... ra mặt tiền kệ hàng'.")

    # 22. API đề xuất
    add_h1(doc, "22. API đề xuất")
    api_headers = ["Phương thức (Method)", "Đường dẫn API (Endpoint)", "Nghiệp vụ chi tiết"]
    api_endpoints = [
        ["POST", "/api/auth/login", "Xác thực tài khoản và cấp quyền (Manager / Staff)"],
        ["GET", "/api/products", "Lấy danh sách 23 sản phẩm kèm tồn kho khả dụng thời gian thực"],
        ["POST", "/api/products", "Thêm sản phẩm mới (kèm chống trùng lặp tên/mã vạch)"],
        ["GET", "/api/batches", "Lấy toàn bộ các lô hàng sắp xếp theo thứ tự ưu tiên FEFO"],
        ["POST", "/api/batches", "Tiếp nhận lô hàng mới từ Kho tổng DC vào CSDL SQL Server"],
        ["PATCH", "/api/batches/:id/discount", "Kích hoạt giảm giá 30% xả hàng cho lô cận date"],
        ["PATCH", "/api/batches/:id/rotate", "Ghi nhận thao tác đảo lô hàng ra mặt tiền kệ"],
        ["POST", "/api/sales", "Bán lẻ POS: Tự động phân bổ trừ kho FEFO vào SQL Server"],
        ["GET", "/api/disposals", "Lấy danh sách phiếu tiêu hủy và sổ hao hụt tài chính"],
        ["POST", "/api/spoilage", "Lập phiếu đề xuất tiêu hủy hàng hỏng mới"],
        ["GET", "/api/dashboard/stats", "Lấy 5 chỉ số KPI điều hành thực tế từ SQL Server"],
        ["GET", "/api/audit-logs", "Truy xuất lịch sử kiểm toán thao tác toàn hệ thống"]
    ]
    create_table(doc, api_headers, api_endpoints, [Inches(1.5), Inches(2.2), Inches(3.5)])

    # 23. Giao diện frontend cần có
    add_h1(doc, "23. Giao diện frontend cần có")
    add_h2(doc, "23.1 Header toàn cục & Thanh chuyển đổi vai trò (Header)")
    add_p(doc, "Gồm logo hệ thống, tên cửa hàng (cho phép nhấp đổi chi nhánh), nút mô phỏng thời tiết / ngày lễ, chuông cảnh báo lô khẩn cấp đỏ, và nút chuyển vai trò chuẩn: 'Cửa hàng trưởng (Quản lý)' vs 'Nhân viên (Thu ngân)'.")

    add_h2(doc, "23.2 Màn hình Tổng quan điều hành (Executive Dashboard)")
    add_p(doc, "Hiển thị 5 thẻ KPI lớn (Tồn kho trên kệ, Doanh thu POS, Lô cận date đỏ, Thiệt hại tiêu hủy, Tỷ lệ hao hụt %), biểu đồ thanh tiến độ 3 ngưỡng RSL và bảng phân tích sản phẩm nguy cơ cao DOS > DUE kèm nút xả hàng nhanh.")

    add_h2(doc, "23.3 Màn hình Giám sát Date & FEFO (FEFO Monitoring)")
    add_p(doc, "Bảng danh sách toàn bộ các lô hàng, hiển thị rõ Mã lô, Tên hàng, Ngày nhập, EXP Date, Số ngày còn lại DUE, Thanh % RSL, Số lượng tồn, Badge trạng thái màu sắc, và cụm nút thao tác nghiệp vụ: 'Đảo Kệ', 'Giảm 30%', 'Hủy Lô'. Tích hợp lọc theo 4 tab trạng thái và ô tìm kiếm không dấu.")

    add_h2(doc, "23.4 Màn hình Bán lẻ POS (Retail POS Checkout)")
    add_p(doc, "Bên trái: Lưới sản phẩm trực quan, phân loại ngành hàng, hiển thị giá bán POS và tồn kho khả dụng. Chặn bấm thêm nếu tồn kho = 0.\n"
              "Bên phải: Giỏ hàng quầy thu ngân, tăng/giảm số lượng, kiểm tra vi phạm tồn kho thời gian thực, nút 'Thanh toán' chạy Transaction FEFO và modal hóa đơn thanh toán chi tiết.")

    add_h2(doc, "23.5 Màn hình Tiếp nhận lô hàng từ DC (DC Stock Intake)")
    add_p(doc, "Form tiếp nhận: Chọn sản phẩm, sinh mã lô tự động, ngày nhập, hạn sử dụng tự động tính theo shelfLifeDays, số lượng, giá vốn và tùy chọn cập nhật giá bán lẻ POS. Có modal thêm sản phẩm mới kèm cảnh báo trùng lặp.")

    add_h2(doc, "23.6 Màn hình Tiêu hủy hàng hỏng (Spoilage Disposal)")
    add_p(doc, "Form lập phiếu: Chọn lô cần hủy, số lượng tự động điền theo tồn kho của lô, chọn lý do (Quá hạn, Lỗi lạnh, Rách bao bì), tính tiền thiệt hại theo giá vốn.\n"
              "Bên phải: Sổ biên bản tiêu hủy, hiển thị danh sách phiếu và nút 'Duyệt Hủy' dành riêng cho Cửa hàng trưởng.")

    add_h2(doc, "23.7 Màn hình Dự báo Tái đặt hàng ROP (Reorder Forecast - Module độc lập)")
    add_p(doc, "Bảng phân tích ROP theo công thức chuẩn: Tốc độ bán d, Tồn an toàn SS, Điểm đặt hàng ROP, Tồn hiện tại, Số ngày bán DOS, Hạn gần nhất DUE, Đánh giá rủi ro và nút 'Đặt DC'.")

    add_h2(doc, "23.8 Màn hình Nhật ký kiểm toán (System Audit Trail)")
    add_p(doc, "Bảng danh sách toàn bộ thao tác hệ thống: Thời điểm, Người thực hiện, Loại hành động, Chi tiết giao dịch và IP.")

    # 24. Quy tắc nghiệp vụ quan trọng
    add_h1(doc, "24. Quy tắc nghiệp vụ quan trọng")
    add_p(doc, "Rule 1: Xuất kho bắt buộc theo FEFO\n"
              "Lô có hạn sử dụng sớm nhất bắt buộc phải được ưu tiên xuất bán trước.")
    add_p(doc, "Rule 2: Tuyệt đối không âm kho\n"
              "Ràng buộc CHECK ([current_quantity] >= 0) trên SQL Server đảm bảo không có bất kỳ giao dịch bán hoặc hủy nào làm âm kho.")
    add_p(doc, "Rule 3: Khóa bán hàng quá hạn\n"
              "Lô có expiry_date < GETDATE() bị khóa hoàn toàn, không xuất hiện trong danh sách khả dụng của quầy POS.")
    add_p(doc, "Rule 4: Phân loại 3 Ngưỡng RSL\n"
              "RSL > 20%: An toàn | 10% < RSL <= 20%: Cảnh báo vàng | RSL <= 10%: Khẩn cấp đỏ.")
    add_p(doc, "Rule 5: Hạch toán thiệt hại theo giá vốn\n"
              "Thiệt hại = Số lượng tiêu hủy × Giá vốn nhập kho của lô đó.")
    add_p(doc, "Rule 6: Kiểm soát 2 bước khi tiêu hủy\n"
              "Nhân viên tạo phiếu Chờ duyệt → Cửa hàng trưởng duyệt thì mới trừ tồn kho.")
    add_p(doc, "Rule 7: Ràng buộc nhập hàng\n"
              "Hạn sử dụng EXP bắt buộc phải lớn hơn Ngày nhập hàng.")
    add_p(doc, "Rule 8: Cảnh báo Spoilage DOS > DUE\n"
              "Nếu Số ngày bán hết tồn > Số ngày đến hạn dùng → Phát cờ nguy cơ hư hỏng cao.")
    add_p(doc, "Rule 9: Kích cầu xả hàng giảm giá 30%\n"
              "Giảm giá 30% xả hàng kích thích tốc độ bán tăng 50% (K_discount = 1.5).")
    add_p(doc, "Rule 10: Ghi nhận vết kiểm toán\n"
              "Toàn bộ các thao tác nghiệp vụ đều được ghi nhận tự động vào bảng system_audit_logs.")

    # 25. Giao dịch SQL Server cần dùng transaction
    add_h1(doc, "25. Giao dịch SQL Server cần dùng transaction")
    add_p(doc, "Các nghiệp vụ cốt lõi bắt buộc phải sử dụng Transaction SQL để đảm bảo tính toàn vẹn (ACID):")
    add_p(doc, "Ví dụ 1: Transaction Bán lẻ POS trừ kho theo FEFO:\n"
              "BEGIN TRANSACTION;\n"
              "  -- 1. Trừ số lượng lô hàng theo FEFO\n"
              "  UPDATE batches SET current_quantity = current_quantity - @DeductQty WHERE id = @BatchId;\n"
              "  -- 2. Ghi nhận hóa đơn bán lẻ\n"
              "  INSERT INTO sales_history (transaction_code, product_id, batch_id, quantity_sold, sale_price, total_amount, sale_date, weather) ...\n"
              "  -- 3. Ghi vết kiểm toán\n"
              "  INSERT INTO system_audit_logs (user_id, action_type, description) ...\n"
              "COMMIT TRANSACTION;\n"
              "-- Nếu có lỗi: ROLLBACK TRANSACTION;")
    add_p(doc, "Ví dụ 2: Transaction Phê duyệt tiêu hủy hàng hỏng:\n"
              "BEGIN TRANSACTION;\n"
              "  -- 1. Trừ sạch tồn kho của lô\n"
              "  UPDATE batches SET current_quantity = 0, status = 'DISPOSED' WHERE id = @BatchId;\n"
              "  -- 2. Cập nhật phiếu tiêu hủy thành APPROVED\n"
              "  UPDATE spoilage_records SET status = 'APPROVED' WHERE id = @DisposalId;\n"
              "  -- 3. Ghi vết kiểm toán\n"
              "  INSERT INTO system_audit_logs ...\n"
              "COMMIT TRANSACTION;")

    # 26. Phiên bản MVP nên làm trước & Kế hoạch Agile Scrum
    add_h1(doc, "26. Phiên bản MVP nên làm trước & Kế hoạch Agile Scrum")
    add_p(doc, "Tuân thủ định hướng từ Thầy Lê Minh Nhật: 'KHÔNG CẦN làm hết toàn bộ trang web. Triển khai demo từ 2 đến 3 Module trọng tâm đảm bảo đúng chuẩn từng màn hình, phần AI sẽ bổ sung sau'.")
    add_p(doc, "Chiến lược phân bổ Sprint:")
    add_p(doc, "• SPRINT 1 (Nền tảng & CSDL - Đã hoàn thành):\n"
              "  - Thiết kế CSDL SQL Server LocalDB chuẩn hóa 3NF gồm 12 bảng.\n"
              "  - Module 1: Quản trị tài khoản & Cơ chế chuyển quyền Store Manager / Store Staff.\n"
              "  - Module 2: Quản lý danh mục 23 sản phẩm chuẩn với cơ chế chống trùng lặp.")
    add_p(doc, "• SPRINT 2 (Nghiệp vụ Cốt lõi Bán lẻ & Date - TRỌNG TÂM BÁO CÁO BUỔI HỌC TỚI):\n"
              "  - Module 3: Tiếp nhận lô hàng từ Kho tổng DC (nhập lô, kiểm tra EXP > Import Date, gán shelfLifeDays).\n"
              "  - Module 4: Giám sát Date FEFO & 3 Ngưỡng an toàn RSL (thao tác Đảo kệ, Xả hàng giảm giá 30%).\n"
              "  - Module 5: Quầy bán lẻ POS tự động trừ kho FEFO theo hạn gần nhất (in hóa đơn, chặn âm kho).")
    add_p(doc, "• SPRINT 3 (Quản trị Hao hụt & Điều hành - Đã sẵn sàng):\n"
              "  - Module 6: Xử lý tiêu hủy hàng hỏng & Phê duyệt hao hụt tài chính 2 bước.\n"
              "  - Module 7: Dashboard điều hành thời gian thực đo lường Tỷ lệ hao hụt Spoilage Rate %.\n"
              "  - Module 8: Nhật ký kiểm toán System Audit Trail.")
    add_p(doc, "• SPRINT 4 (Tính năng AI Dự báo Nâng cao - Module độc lập bổ sung sau):\n"
              "  - Module 9: Thuật toán AI Dự báo điểm đặt hàng ROP = (d × L) + SS kết hợp mô phỏng thời tiết và ngày lễ.")

    # 27. Kết luận đặc tả
    add_h1(doc, "27. Kết luận đặc tả")
    add_p(doc, "Tài liệu đặc tả này đã chuẩn hóa toàn bộ yêu cầu phần mềm của đề tài Nền tảng Quản trị Chuỗi cung ứng Bán lẻ Chống lãng phí (Supply Chain Spoilage Predictor) cho mô hình một cửa hàng bán lẻ tinh gọn duy nhất.")
    add_p(doc, "Luồng nghiệp vụ cốt lõi:\n"
              "Kho tổng DC → Tiếp nhận lô hàng → Kiểm soát HSD 3 Ngưỡng RSL → Đảo kệ mặt tiền → Quầy bán lẻ POS tự động trừ kho FEFO → Tiêu hủy hàng quá hạn (nếu có) → Dashboard hạch toán Tỷ lệ hao hụt.")
    add_p(doc, "Kiến trúc triển khai:\n"
              "Clean Architecture 4 lớp + Microsoft SQL Server LocalDB + Node.js Backend API + React Vite Frontend.")
    add_p(doc, "Đặc tả này là cơ sở vững chắc để nhóm báo cáo tiến độ buổi học tới với Thầy Lê Minh Nhật, tập trung nghiệm thu trọn vẹn 3 Module trọng tâm của Sprint 2 trước khi phát triển các module tiếp theo.")

    output_path = r"c:\thuyet minh\Docs\Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx"
    doc.save(output_path)
    print(f"SUCCESS: Generated {output_path}")

if __name__ == "__main__":
    generate_doc()
