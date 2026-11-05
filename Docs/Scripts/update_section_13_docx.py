# -*- coding: utf-8 -*-
"""
Docs/Scripts/update_section_13_docx.py
Cập nhật và chuẩn hóa Mục 13 trong file Word:
Docs/Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx
"""
import docx, sys, io
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc_path = 'Docs/Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx'
doc = docx.Document(doc_path)

start_idx = None
end_idx = None

for i, p in enumerate(doc.paragraphs):
    if p.text.strip().startswith('13. Quản lý xả hàng giảm giá'):
        start_idx = i
    if p.text.strip().startswith('14. Quản lý tiêu hủy'):
        end_idx = i
        break

print(f"Found Section 13 from P{start_idx} to P{end_idx}")

if start_idx is None or end_idx is None:
    print("Error: Could not locate Section 13 boundaries!")
    sys.exit(1)

# Danh sách các đoạn văn bản mới cho Mục 13
new_paragraphs_data = [
    ("13. Quản lý xả hàng giảm giá (Quick Markdown) & Đảo kệ theo FEFO (Rule 10 SSOT)", "HEADING_1", True),
    ("Nghiệp vụ Xả hàng Giảm giá (Quick Markdown) và Quy trình Đảo kệ Mặt tiền theo chuẩn FEFO đóng vai trò là 'chiến tuyến phòng ngự cuối cùng' trong chuỗi cung ứng bán lẻ chống lãng phí tại Cửa hàng Tiện lợi LHU Mart (RETAIL-STORE-01). Thay vì thụ động chờ lô hàng trượt sang trạng thái hết hạn (EXPIRED) dẫn đến tổn thất 100% giá vốn và phát sinh chi phí tiêu hủy, hệ thống chủ động trao công cụ điều hành giá linh hoạt theo thời gian thực (Dynamic Real-time Markdown) cho Cửa hàng trưởng kết hợp cùng kỷ luật trưng bày quầy kệ nghiêm ngặt của nhân viên kho.", "NORMAL", False),

    ("13.1  Ý nghĩa chiến lược & Cơ chế kích hoạt giảm giá xả hàng Quick Markdown", "HEADING_2", True),
    ("Hệ thống thiết lập cơ chế so sánh tài chính định lượng giữa 3 kịch bản quản trị nhằm khuyến khích hành vi giải phóng hàng sớm, bảo toàn tối đa dòng tiền vốn lưu động:", "NORMAL", False),
    ("1. Kịch bản 1: Bán nguyên giá niêm yết (Vùng Xanh - DaysLeft > WarningDays) – Thu hồi 100% doanh thu niêm yết, tổn thất tài chính bằng 0 VNĐ, biên lợi nhuận gộp đạt chuẩn định mức (25% - 35%).", "BULLET", False),
    ("2. Kịch bản 2: Quick Markdown xả hàng (Rule 10 - Vùng Vàng/Đỏ) – Thu hồi 50% - 85% doanh thu niêm yết, tổn thất vốn bằng 0 VNĐ (giảm biên lãi nhưng bảo toàn hoặc tiệm cận giá vốn nhập); giải phóng quầy kệ và triệt tiêu nguy cơ rác thải thực phẩm.", "BULLET", False),
    ("3. Kịch bản 3: Tiêu hủy quá date (Hao hụt) – Doanh thu bằng 0 VNĐ, tổn thất mất trắng 100% giá trị vốn (ImportPrice * Quantity), làm xói mòn lợi nhuận ròng và phát sinh chi phí lưu hủy, hạch toán Sổ hao hụt.", "BULLET", False),
    
    ("Danh mục 4 mức chiết khấu chuẩn hóa cố định (kèm tùy chọn 0% khôi phục nguyên giá):", "NORMAL", False),
    ("1. Mức giảm 15% (Vùng Vàng nhẹ: 3 < DaysLeft <= WarningDays): Giảm nhẹ tạo lực đẩy tiêu thụ ban đầu đối với khách mua sắm hàng ngày có kế hoạch sử dụng ngay trong tuần.", "BULLET", False),
    ("2. Mức giảm 30% (Vùng Vàng sát mép Vùng Đỏ: 3 < DaysLeft <= 5 ngày): Mức chiết khấu hấp dẫn kích thích người tiêu dùng săn deal tiết kiệm, tăng tốc độ giải phóng tồn kho.", "BULLET", False),
    ("3. Mức giảm 40% (Vùng Đỏ nguy kịch: 1 < DaysLeft <= 3 ngày): Cắt giảm sâu toàn bộ biên lợi nhuận để bảo toàn dòng tiền gốc; thu hút khách hàng nhạy cảm về giá.", "BULLET", False),
    ("4. Mức giảm 50% (Vùng Đỏ kịch sàn trong ngày: DaysLeft = 1 ngày): Bán hòa vốn hoặc chấp nhận lỗ nhẹ 5% - 10% để thu hồi vốn tức thì, tuyệt đối không để rớt sang ngày hôm sau.", "BULLET", False),
    ("5. Mức 0% (Khôi phục nguyên giá niêm yết): Áp dụng khi quản lý ấn nhầm hoặc lô hàng được điều chuyển vị trí trưng bày đặc biệt.", "BULLET", False),

    ("Bộ công thức toán học tính toán giá bán lẻ hiệu dụng và số tiền chiết khấu:", "NORMAL", False),
    ("Công thức tính đơn giá hiệu dụng: Price_effective = ROUND(Price_retail * (1 - DiscountPercent / 100), 0)", "NORMAL", True),
    ("Công thức tính số tiền tiết kiệm: DiscountAmount = Price_retail - Price_effective = ROUND(Price_retail * DiscountPercent / 100, 0)", "NORMAL", True),
    ("Ràng buộc kỹ thuật biên: DiscountPercent bắt buộc thuộc tập hợp {0, 15, 30, 40, 50}; Price_effective luôn lớn hơn 0; cấm tuyệt đối áp dụng Quick Markdown đối với các lô hàng đã hết hạn (DaysLeft <= 0) hoặc đã bị tiêu hủy (ném mã lỗi HTTP 400 ERR_BATCH_EXPIRED).", "NORMAL", False),

    ("13.2  Quy trình SOP 5 bước đảo kệ mặt tiền (Shelf Rotation SOP)", "HEADING_2", True),
    ("Tại cửa hàng bán lẻ, khách hàng có xu hướng tự nhiên rút những món hàng ở hàng đầu tiên sát mép ngoài của kệ. Quy tắc Rule 10 bắt buộc toàn bộ lô hàng Vàng và Đỏ phải được đảo ra mặt tiền kệ trưng bày kèm dán tem Sticker nổi bật:", "NORMAL", False),
    ("Bước 1 – Tra cứu danh sách lô cần đảo kệ: Nhân viên kho mở phân hệ Giám sát Hạn dùng (FEFO Monitor) hoặc Tab 2 Action Board, lọc danh sách các lô cảnh báo Vàng hoặc Đỏ đang có cờ is_shelf_rotated = 0.", "BULLET", False),
    ("Bước 2 – Dời tạm lô hàng date xa: Đến đúng kệ hàng thực tế, nhấc toàn bộ sản phẩm thuộc lô date xa (Vùng Xanh) tạm thời đặt vào khay chứa hoặc xe đẩy chuyên dụng.", "BULLET", False),
    ("Bước 3 – Đưa lô cận date ra mặt tiền: Kéo toàn bộ sản phẩm của lô cận date (Vùng Vàng / Vùng Đỏ) xếp dàn đều ra hàng đầu tiên sát mép ngoài cùng của quầy kệ, ngay tầm với mắt nhìn của khách hàng.", "BULLET", False),
    ("Bước 4 – Xếp lô date xa ra phía sau lưng: Xếp các sản phẩm date xa (Vùng Xanh) từ khay chứa trở lại kệ, đặt phía sau lưng của các lô cận date vừa đảo theo đúng trật tự expiry_date tăng dần.", "BULLET", False),
    ("Bước 5 – Xác nhận điện tử trên phần mềm: Mở Modal SOP Đảo Kệ trên ứng dụng, tích chọn hoàn tất 5 bước kiểm tra và bấm 'Xác nhận Hoàn tất Đảo Kệ' (PATCH /api/batches/:id/rotate), cập nhật is_shelf_rotated = 1, lưu vết nhân viên và ghi nhật ký kiểm toán.", "BULLET", False),

    ("13.3  Quy chuẩn Kỹ thuật Tem Sticker Xả Hàng & In Tem Nhiệt", "HEADING_2", True),
    ("Toàn bộ các sản phẩm sau khi được phê duyệt chiết khấu Quick Markdown đều bắt buộc phải dán Tem Sticker Giảm Giá lên mặt trước của từng bao bì trước khi trưng bày bán lẻ:", "NORMAL", False),
    ("1. Quy cách vật lý tem nhãn: Tem tròn đường kính 35mm màu vàng chanh dạ quang hoặc tem chữ nhật viền đỏ nổi bật; chất liệu decal cảm nhiệt bám dính tốt trên bề mặt lạnh (nhóm sữa và thực phẩm mát 2 - 4°C), không để lại keo bẩn.", "BULLET", False),
    ("2. Thông tin hiển thị bắt buộc: Dòng tiêu đề 'LHU MART - XẢ HÀNG CẬN DATE'; Huy hiệu giảm giá nổi bật font lớn (-15%, -30%, -40%, -50%); Giá gốc niêm yết in gạch ngang; Giá mới thanh toán in đậm font lớn; Mã lô chuẩn hệ thống (LOT-DC-xxxx) và HSD rõ ràng.", "BULLET", False),
    ("3. Mã vạch tích hợp & In tem nhiệt: In barcode 1D Code 128 hoặc QR Code hỗ trợ máy quét POS; Modal PrintDiscountStickerModal cho phép in hàng loạt theo số lượng tồn khả dụng của lô hàng.", "BULLET", False),

    ("13.4  Đồng bộ Thời gian thực tại Quầy POS & Bẻ Lô Chuẩn FEFO", "HEADING_2", True),
    ("Cơ chế kết nối giữa Phân hệ Điều hành Giá và Quầy Thu Ngân Bán Lẻ được thiết kế đồng bộ thời gian thực (Zero Latency):", "NORMAL", False),
    ("1. Hiệu lực tức thì: Ngay khi Cửa hàng trưởng phê duyệt chiết khấu, giá khuyến mãi Price_effective lập tức được lưu vào trường discount_percent của bảng batches trong SQL Server. Quầy POS tự động áp dụng giá mới mà không cần tải lại trang.", "BULLET", False),
    ("2. Xuất bán chuẩn FEFO & Bẻ lô tự động (Rule 2): Khi quét mã SKU, động cơ POS truy vấn các lô có expiry_date tăng dần; lô cận date đang giảm giá sẽ được ưu tiên bóc tách xuất trước; nếu số lượng mua vượt quá số tồn lô giảm giá, hệ thống tự động bẻ lô và tính đúng giá từng phần.", "BULLET", False),
    ("3. Hóa đơn bán lẻ (POS Receipt): Hóa đơn hiển thị minh bạch giá niêm yết, tỷ lệ chiết khấu, giá thực thu và dòng thông điệp 'Quý khách đã tiết kiệm được: XX.XXX VNĐ nhờ chương trình Chống Lãng Phí LHU Mart'.", "BULLET", False),

    ("13.5  Ma trận Phân quyền & Tách biệt Trách nhiệm (SoD Matrix 4 Actor – Rule 10)", "HEADING_2", True),
    ("Nghiệp vụ điều chỉnh giá bán và đảo kệ được kiểm soát chặt chẽ bằng ma trận phân quyền RBAC:", "NORMAL", False),
    ("1. Quản trị viên (ADMIN): Toàn quyền cấu hình tham số tỷ lệ chiết khấu, phê duyệt/hủy Quick Markdown, can thiệp xử lý sự cố và giám sát toàn diện AuditLogs.", "BULLET", False),
    ("2. Cửa hàng trưởng (STORE_MANAGER): Thẩm quyền chính phê duyệt kích hoạt và hủy Quick Markdown (15%, 30%, 40%, 50%), giám sát tiến độ đảo kệ ca trực và doanh thu xả hàng.", "BULLET", False),
    ("3. Nhân viên thu ngân (CASHIER): Tuyệt đối bị cấm tự ý sửa giá hoặc kích hoạt giảm giá (403 Forbidden); chỉ thực thi xuất bán tự động theo giá hệ thống qua máy quét POS.", "BULLET", False),
    ("4. Nhân viên kho & quầy kệ (WAREHOUSE_STAFF): Tuyệt đối bị cấm can thiệp giá (403 Forbidden); trực tiếp chịu trách nhiệm thực thi SOP 5 bước đảo kệ vật lý, in dán tem sticker và xác nhận điện tử trên phần mềm.", "BULLET", False),

    ("13.6  Nhật ký Kiểm toán Bất biến (Rule 11) & Hạch toán Tài chính", "HEADING_2", True),
    ("Mọi biến động liên quan đến việc thay đổi giá bán và xác nhận đảo kệ đều được ghi nhận vĩnh viễn vào bảng system_audit_logs trong SQL Server:", "NORMAL", False),
    ("1. Nhật ký Đổi giá Quick Markdown (QUICK_MARKDOWN): Ghi nhận đầy đủ mã lô, tỷ lệ giảm (%), đơn giá trước/sau giảm, định danh Cửa hàng trưởng phê duyệt và thời gian thực thi.", "BULLET", False),
    ("2. Nhật ký Xác nhận Đảo kệ Mặt tiền (ROTATE_SHELF_FEFO): Ghi nhận mã lô được đảo kệ, định danh Nhân viên kho thực hiện và dấu mốc thời gian hoàn tất.", "BULLET", False),
    ("3. Ý nghĩa hạch toán tài chính: Dữ liệu kiểm toán Quick Markdown là căn cứ pháp lý và kế toán đối soát báo cáo chênh lệch doanh thu khuyến mãi tại Cửa hàng LHU Mart, đồng thời chứng minh hiệu quả chống lãng phí trong việc bảo toàn tối đa dòng tiền vốn của cửa hàng.", "BULLET", False)
]

# Xóa các đoạn cũ từ start_idx đến end_idx - 1
for k in range(start_idx, end_idx):
    p_to_del = doc.paragraphs[start_idx]
    p_elem = p_to_del._element
    p_elem.getparent().remove(p_elem)

# Chèn các đoạn mới vào trước P{start_idx} (nay là vị trí của Section 14)
target_p = doc.paragraphs[start_idx]

for text, style, is_bold in new_paragraphs_data:
    new_p = target_p.insert_paragraph_before()
    run = new_p.add_run(text)
    run.bold = is_bold
    
    if style == "HEADING_1":
        run.font.size = Pt(15)
        run.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A) # Deep Navy
        new_p.paragraph_format.space_before = Pt(14)
        new_p.paragraph_format.space_after = Pt(6)
    elif style == "HEADING_2":
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(0x02, 0x84, 0xC7) # Sky Blue
        new_p.paragraph_format.space_before = Pt(10)
        new_p.paragraph_format.space_after = Pt(4)
    elif style == "BULLET":
        run.font.size = Pt(11)
        new_p.paragraph_format.space_before = Pt(2)
        new_p.paragraph_format.space_after = Pt(3)
        new_p.paragraph_format.left_indent = Pt(18)
    else:
        run.font.size = Pt(11)
        new_p.paragraph_format.space_before = Pt(3)
        new_p.paragraph_format.space_after = Pt(3)

doc.save(doc_path)
print(f"Successfully updated Section 13 in Word document with {len(new_paragraphs_data)} paragraphs!")

