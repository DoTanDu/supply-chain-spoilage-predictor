# -*- coding: utf-8 -*-
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

def format_table(table, col_widths, headers, data, header_bg="1F497D", alt_bg="F4F7FA"):
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
            if col_idx in [0, 1]:
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
    r.font.color.rgb = RGBColor(31, 73, 125)
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
    r.font.color.rgb = RGBColor(192, 0, 0)
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

def build_use_case_doc():
    doc = Document()
    for section in doc.sections:
        section.top_margin = Inches(0.79)
        section.bottom_margin = Inches(0.79)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(0.79)

    # Header
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_after = Pt(2)
    r_inst = p_inst.add_run("TRƯỜNG ĐẠI HỌC LẠC HỒNG\nKHOA CÔNG NGHỆ THÔNG TIN - BỘ MÔN KỸ THUẬT PHẦN MỀM")
    r_inst.font.name = "Times New Roman"
    r_inst.font.size = Pt(10.5)
    r_inst.font.bold = True
    r_inst.font.color.rgb = RGBColor(90, 90, 90)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("THUYẾT MINH CHI TIẾT SƠ ĐỒ USE CASE HỆ THỐNG")
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(15)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(31, 73, 125)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(12)
    r_sub = p_sub.add_run("Đề tài: NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG CHỐNG LÃNG PHÍ\n(SUPPLY CHAIN SPOILAGE PREDICTOR)\nGVHD: ThS. Lê Minh Nhật | SV thực hiện: Đỗ Tấn Du & Đoàn Minh Quân")
    r_sub.font.name = "Times New Roman"
    r_sub.font.size = Pt(11)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(192, 0, 0)

    # I. LỜI MỞ ĐẦU & NGUYÊN TẮC THIẾT KẾ
    add_heading_1(doc, "I. NGUYÊN TẮC THIẾT KẾ & TIẾP THU GÓP Ý CỦA GVHD")
    add_p(doc, "Tiếp thu chỉ đạo sâu sát của ThS. Lê Minh Nhật về việc Sơ đồ Use Case không được mô tả sơ sài hay dừng lại ở các bong bóng độc lập, nhóm sinh viên đã chuẩn hóa và phân rã chi tiết toàn bộ chuỗi tác nghiệp khép kín trong cửa hàng bán lẻ (Retail Store).")
    add_p(doc, "Mỗi hành động của người dùng (ví dụ: Tiếp nhận lô hàng từ Kho tổng) đều được làm rõ: 'Sau khi nhận hàng thì làm gì tiếp theo? Cần những tiến trình con nào (<<include>>) và có trường hợp ngoại lệ nào (<<extend>>)?'.")

    # II. HÌNH ẢNH SƠ ĐỒ USE CASE MỚI
    add_heading_1(doc, "II. SƠ ĐỒ USE CASE TỔNG THỂ HỆ THỐNG (CHẤT LƯỢNG CAO)")
    img_path = r"c:\thuyet minh\Docs\Diagram_Images\use_case.png"
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        p_img.add_run().add_picture(img_path, width=Inches(6.2))

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(12)
        r_cap = p_cap.add_run("Hình 1: Sơ đồ Use Case chi tiết hệ thống phân quyền Store Staff & Store Manager")
        r_cap.font.name = "Times New Roman"
        r_cap.font.size = Pt(10)
        r_cap.font.bold = True
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(60, 60, 60)

    # III. THUYẾT MINH CHI TIẾT 6 PHÂN HỆ NGHIỆP VỤ TÁC NGHIỆP
    add_heading_1(doc, "III. THUYẾT MINH CHI TIẾT TỪNG PHÂN HỆ TÁC NGHIỆP")

    # Phân hệ 1: Nhập lô hàng từ kho tổng
    add_heading_2(doc, "1. Phân hệ Tiếp nhận & Nhập lô hàng từ Kho tổng (DC Goods Receiving)")
    add_p(doc, "Khi nhân viên/thủ kho tiếp nhận chuyến xe hàng chuyển về từ Kho trung tâm (DC), chuỗi tác nghiệp diễn ra liên tục theo các bước sau:")
    add_bullet(doc, "Bước 1 (UC-01 - Tiếp nhận đợt hàng): ", "Nhân viên mở chức năng Nhập kho trên hệ thống, chọn mã đơn điều phối từ Kho tổng.")
    add_bullet(doc, "Bước 2 (UC-01.1 - Kiểm đếm & Đối chiếu HSD): ", "«include» Bắt buộc nhân viên kiểm đếm số lượng thực nhận, đồng thời kiểm tra ngày sản xuất (MFG) và hạn sử dụng (EXP) in trên từng bao bì thùng hàng.")
    add_bullet(doc, "Bước 3 (UC-01.2 - Nhập thông tin lô & Kích hoạt Shelf-Life): ", "«include» Nhập Mã lô (Batch Code), Ngày nhập, HSD và Số lượng vào CSDL. Hệ thống tự động tính số ngày vòng đời ban đầu và chuyển lô sang trạng thái ACTIVE.")
    add_bullet(doc, "Bước 4 (UC-01.3 - In tem nhãn kệ / Mã vạch lô): ", "«extend» Tùy chọn in mã QR/Barcode của lô để dán lên thùng kệ trưng bày, giúp nhận diện nhanh vị trí hàng khi xếp lên kệ.")

    # Phân hệ 2: Bán hàng lẻ & Trừ kho FEFO
    add_heading_2(doc, "2. Phân hệ Bán hàng lẻ & Xuất kho tự động FEFO (Sales Out)")
    add_p(doc, "Theo đúng bản chất bán lẻ mà Thầy Nhật đã chỉ ra, 'Xuất kho chính là Bán hàng ra cho khách':")
    add_bullet(doc, "Bước 1 (UC-02 - Bán hàng tại quầy POS): ", "Nhân viên quét mã vạch sản phẩm (SKU) khi khách hàng thanh toán tại quầy.")
    add_bullet(doc, "Bước 2 (UC-02.1 - Quét chọn lô HSD gần nhất FEFO): ", "«include» Thuật toán hệ thống tự động tìm trong kho lô hàng đang ACTIVE có HSD gần nhất (First Expired, First Out) để trừ.")
    add_bullet(doc, "Bước 3 (UC-02.2 - Tự động trừ tồn kho): ", "«include» Cập nhật giảm số lượng tồn kho của lô hàng đó theo số lượng khách mua. Nếu lô cũ hết hàng, hệ thống tự động trừ tiếp sang lô kế cận.")
    add_bullet(doc, "Bước 4 (UC-02.3 - Lưu lịch sử & Biến ngoại cảnh): ", "«include» Ghi nhận giao dịch vào bảng sales_history kèm điều kiện thời tiết (Nắng/Mưa) và cờ Ngày lễ/Cuối tuần để nạp dữ liệu cho mô hình dự báo.")

    # Phân hệ 3: Giám sát HSD & Cảnh báo Spoilage
    add_heading_2(doc, "3. Phân hệ Giám sát Hạn sử dụng & Cảnh báo Spoilage")
    add_p(doc, "Quy trình chủ động phát hiện hàng sắp hết hạn để xử lý trước khi bị quá date:")
    add_bullet(doc, "Bước 1 (UC-03.1 - Tự động quét đếm lùi ngày): ", "Hệ thống chạy ngầm hàng ngày, tính: Số ngày còn lại = Hạn sử dụng - Ngày hiện tại.")
    add_bullet(doc, "Bước 2 (UC-03.2 - Phân cấp cảnh báo RSL): ", "Phân loại 3 mức rủi ro: Xanh (An toàn > 20%), Vàng (Cận date nhẹ <= 20%), Đỏ (Khẩn cấp <= 10%), Tím (Hết hạn <= 0 ngày).")
    add_bullet(doc, "Bước 3 (UC-03.3 - Đảo hàng & Dán tem giảm giá): ", "«extend» Khi lô hàng rơi vào cảnh báo Đỏ, nhân viên nhận danh sách, tiến hành đảo hàng ra trước kệ và in tem giảm giá 20%-50% để kích cầu bán nhanh.")
    add_bullet(doc, "Bước 4 (UC-03.4 - Khóa mã vạch khi hết hạn): ", "«extend» Khi lô hàng rơi vào cảnh báo Tím (quá hạn), hệ thống tự động khóa mã, cấm nhân viên quét bán tại quầy thu ngân.")

    # Phân hệ 4: Tiêu hủy hàng hỏng
    add_heading_2(doc, "4. Phân hệ Tiêu hủy hàng hỏng & Ghi nhận hao hụt (Spoilage Disposal)")
    add_p(doc, "Quy trình xử lý đối với hàng hóa quá date hoặc bị hư hỏng, dập nát trên quầy kệ:")
    add_bullet(doc, "Bước 1 (UC-04 - Lập phiếu yêu cầu tiêu hủy): ", "Nhân viên tạo phiếu hủy, nhập mã lô, số lượng cần hủy và lý do (Quá hạn / Hư hỏng dập nát / Rách bao bì).")
    add_bullet(doc, "Bước 2 (UC-05 - Phê duyệt tiêu hủy): ", "Cửa hàng trưởng (Store Manager) nhận thông báo, kiểm tra hàng thực tế và duyệt phiếu hủy.")
    add_bullet(doc, "Bước 3 (UC-04.1 - Trừ sạch tồn kho): ", "«include» Hệ thống lập tức trừ tồn kho của lô về 0 và cập nhật trạng thái lô thành 'DISPOSED'.")
    add_bullet(doc, "Bước 4 (UC-04.2 - Hạch toán thiệt hại tài chính): ", "«include» Hệ thống tự động nhân số lượng hủy với giá vốn, lưu vào nhật ký lãng phí (spoilage_records) để phục vụ báo cáo tài chính.")

    # Phân hệ 5: Dự báo nhu cầu & Đề xuất đặt hàng
    add_heading_2(doc, "5. Phân hệ Dự báo Tiêu thụ & Đề xuất Đặt hàng Kho tổng (DC Reorder)")
    add_p(doc, "Quy trình cân bằng giữa rủi ro thiếu hàng và rủi ro hết hạn:")
    add_bullet(doc, "Bước 1 (UC-06 - Phân tích tốc độ bán & Hệ số K): ", "Hệ thống tính tốc độ bán trung bình ngày (d) kết hợp hệ số thời tiết (nắng nóng tăng đồ mát, mưa tăng đồ khô) và ngày lễ.")
    add_bullet(doc, "Bước 2 (UC-07 - Tính ROP & Đánh giá DOS > DUE): ", "Tính Điểm đặt hàng lại ROP = (d * L) + SS. Nếu tồn kho hiện tại bán quá chậm (DOS > DUE) thì cảnh báo nguy cơ ế hàng.")
    add_bullet(doc, "Bước 3 (UC-08 - Tự động sinh Đề xuất đặt hàng): ", "Hệ thống tự động tính ra số lượng tối ưu cần nhập thêm từ Kho tổng.")
    add_bullet(doc, "Bước 4 (UC-09 - Duyệt & Gửi đơn về Kho tổng): ", "Cửa hàng trưởng rà soát số lượng, chỉnh sửa nếu cần và bấm Duyệt gửi đơn điện tử về Kho tổng DC.")

    # Phân hệ 6: Quản trị & Dashboard
    add_heading_2(doc, "6. Phân hệ Quản trị & Dashboard Báo cáo (Store Manager)")
    add_bullet(doc, "UC-10 (Quản lý Danh mục & Cấu hình): ", "Thêm/sửa sản phẩm, thiết lập số ngày cảnh báo cận date riêng cho từng mặt hàng (rau củ 2 ngày, đồ hộp 30 ngày).")
    add_bullet(doc, "UC-11 (Import file Excel lịch sử): ", "Nạp dữ liệu bán hàng quá khứ từ file Excel để hệ thống học và dự báo.")
    add_bullet(doc, "UC-12 & UC-13 (Dashboard & Xuất báo cáo): ", "Hiển thị biểu đồ tỷ lệ hao hụt hàng hóa (Spoilage Rate %), Top sản phẩm cận date, và xuất báo cáo kiểm kê định kỳ.")

    # Bảng tổng hợp Use Case
    add_heading_1(doc, "IV. BẢNG DANH MỤC USE CASE HỆ THỐNG")
    tbl = doc.add_table(rows=1, cols=4)
    widths = [0.8, 2.2, 1.3, 2.4]
    headers = ["Mã UC", "Tên Use Case", "Tác Nhân", "Loại / Quan Hệ Nghiệp Vụ"]
    data = [
        ["UC-00", "Đăng nhập hệ thống (JWT)", "Staff, Manager", "Use Case cơ sở xác thực phân quyền"],
        ["UC-01", "Tiếp nhận lô hàng từ Kho tổng", "Staff", "Use Case tác nghiệp cốt lõi"],
        ["UC-01.1", "Kiểm đếm SL & Check HSD thực tế", "Staff", "«include» bắt buộc của UC-01"],
        ["UC-01.2", "Nhập thông tin lô & Kích hoạt Shelf-Life", "Staff", "«include» bắt buộc của UC-01"],
        ["UC-01.3", "In tem nhãn kệ / Mã vạch lô", "Staff", "«extend» tùy chọn của UC-01"],
        ["UC-02", "Bán hàng lẻ tại quầy (POS)", "Staff", "Use Case xuất kho bán hàng"],
        ["UC-02.1", "Quét chọn lô HSD gần nhất (FEFO)", "Hệ thống", "«include» tự động của UC-02"],
        ["UC-02.2", "Tự động trừ tồn kho của lô", "Hệ thống", "«include» tự động của UC-02"],
        ["UC-02.3", "Lưu lịch sử bán & Biến thời tiết, Lễ", "Hệ thống", "«include» tự động của UC-02"],
        ["UC-03", "Giám sát HSD & Cảnh báo Spoilage", "Staff, Manager", "Use Case giám sát hạn dùng"],
        ["UC-03.1", "Quét tự động đếm lùi ngày HSD", "Hệ thống", "«include» tự động của UC-03"],
        ["UC-03.2", "Phân loại 3 mức RSL (Xanh, Vàng, Đỏ)", "Hệ thống", "«include» tự động của UC-03"],
        ["UC-03.3", "Đảo hàng ra quầy & Dán tem giảm giá", "Staff", "«extend» khi chạm Cảnh báo Đỏ"],
        ["UC-03.4", "Khóa mã vạch POS khi hết hạn", "Hệ thống", "«extend» khi chạm Cảnh báo Tím (<=0 ngày)"],
        ["UC-04", "Lập phiếu yêu cầu tiêu hủy hàng", "Staff", "Use Case xử lý hàng hỏng"],
        ["UC-05", "Phê duyệt biên bản tiêu hủy hàng", "Manager", "Use Case quản lý phê duyệt"],
        ["UC-04.1", "Trừ sạch tồn kho (status='DISPOSED')", "Hệ thống", "«include» tự động sau khi UC-05 duyệt"],
        ["UC-04.2", "Hạch toán thiệt hại & Ghi Spoilage Log", "Hệ thống", "«include» tự động sau khi UC-05 duyệt"],
        ["UC-06", "Phân tích tốc độ bán (d) & Hệ số (K)", "Hệ thống", "«include» của quy trình dự báo"],
        ["UC-07", "Tính Reorder Point (ROP) & DOS>DUE", "Hệ thống", "«include» của quy trình dự báo"],
        ["UC-08", "Tự động sinh Đề xuất đặt hàng tối ưu", "Hệ thống", "«include» của quy trình dự báo"],
        ["UC-09", "Duyệt & Gửi đơn đặt về Kho tổng (DC)", "Manager, DC", "Use Case tương tác chuỗi cung ứng"],
        ["UC-10", "Quản lý Danh mục & Cấu hình ngưỡng", "Manager", "Use Case quản trị tham số"],
        ["UC-11", "Import file Excel bán lẻ & Đồng bộ", "Manager", "Use Case nạp dữ liệu ngoại tuyến"],
        ["UC-12", "Xem Dashboard trực quan & Tỷ lệ Spoilage", "Manager", "Use Case phân tích số liệu"],
        ["UC-13", "Xuất báo cáo kiểm kê & Chống lãng phí", "Manager", "«extend» của UC-12"]
    ]
    format_table(tbl, widths, headers, data)

    out_path = r"c:\thuyet minh\Docs\THUYET_MINH_CHI_TIET_SO_DO_USE_CASE.docx"
    doc.save(out_path)
    print(f"Generated detailed Use Case document: {out_path}")

if __name__ == "__main__":
    build_use_case_doc()
