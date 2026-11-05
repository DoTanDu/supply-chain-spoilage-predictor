# Docs/Scripts/update_section_12_docx.py
import docx, sys, io
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc_path = 'Docs/Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx'
doc = docx.Document(doc_path)

start_idx = None
end_idx = None

for i, p in enumerate(doc.paragraphs):
    if p.text.strip().startswith('12. Quản lý tiếp nhận hàng từ Kho tổng DC'):
        start_idx = i
    if p.text.strip().startswith('13. Quản lý xả hàng giảm giá'):
        end_idx = i
        break

print(f"Found Section 12 from P{start_idx} to P{end_idx}")

if start_idx is None or end_idx is None:
    print("Error: Could not locate Section 12 boundaries!")
    sys.exit(1)

# Danh sách các đoạn văn bản mới cho Mục 12
new_paragraphs_data = [
    ("12. Quản lý tiếp nhận hàng từ Kho tổng DC (DC Inbound & Date Inspection – Rule 7)", "HEADING_1", True),
    ("Cửa hàng bán lẻ tiện lợi LHU Mart (RETAIL-STORE-01) vận hành theo mô hình chuỗi cung ứng tinh gọn, chỉ tiếp nhận hàng bổ sung từ một nguồn duy nhất là Trung tâm Phân phối Kho tổng DC Biên Hòa (DC-BIENHOA). Quy trình tiếp nhận hàng đóng vai trò là 'chốt chặn chất lượng' đầu vào then chốt, kiểm soát nghiêm ngặt độ tươi mới của từng lô hàng và ngăn chặn triệt để rủi ro tồn đọng hàng cận date ngay từ cửa kho.", "NORMAL", False),
    
    ("12.1  Tiêu chuẩn nhận date nghiêm ngặt (Inbound Freshness Rule >= 70% – Rule 7 SSOT)", "HEADING_2", True),
    ("Hạn sử dụng còn lại khi xe tải DC giao đến cửa hàng bán lẻ phải đạt tối thiểu 70.0% tổng vòng đời sản phẩm:", "NORMAL", False),
    ("Công thức tính tỷ lệ tươi mới tiếp nhận: RSL_inbound (%) = ((ExpiryDate - ImportDate) / (ExpiryDate - ManufactureDate)) * 100 >= 70.0%", "NORMAL", True),
    ("Trong đó: ManufactureDate (NSX in trên bao bì), ExpiryDate (HSD in trên bao bì; bắt buộc ExpiryDate > ManufactureDate), ImportDate (Thời điểm tiếp nhận tại kho), và ngưỡng RSL_min được cấu hình linh hoạt trong bảng store_profile (trường min_inbound_rsl_percent, mặc định 70.0%).", "NORMAL", False),
    ("1. Trường hợp RSL_inbound >= 70% (Đạt Chuẩn): Hệ thống hiển thị huy hiệu Xanh lá 'ĐẠT CHUẨN TIẾP NHẬN (>= 70%)', cho phép nhập số lượng thực nhận, đơn giá vốn và mở khóa nút 'Lưu Phiếu Nhập Kho'.", "BULLET", False),
    ("2. Trường hợp RSL_inbound < 70% (Dưới Chuẩn - Vi phạm Rule 7): Hệ thống KHÓA CỨNG nút 'Lưu Phiếu Nhập Kho' (Disabled), hiển thị cảnh báo đỏ vi phạm quy chuẩn tươi mới, tự động kích hoạt nút 'Lập Biên Bản Từ Chối Nhận Hàng DC' và yêu cầu tài xế xe tải nhận lại toàn bộ kiện hàng vi phạm.", "BULLET", False),

    ("12.2  Quy trình tiếp nhận hàng chuẩn hóa 6 bước (Inbound SOP) & Liên kết Đơn PO", "HEADING_2", True),
    ("Quy trình nhập kho từ xe tải DC Biên Hòa được chuẩn hóa qua 6 bước khép kín đảm bảo đối soát đơn hàng và toàn vẹn dữ liệu:", "NORMAL", False),
    ("Bước 1 – Tiếp nhận xe tải DC & Chọn Đơn PO liên kết: Nhân viên kho đối chiếu biên bản giao nhận với Đơn đặt hàng PO đang ở trạng thái APPROVED hoặc SUBMITTED; hệ thống tự động nạp danh mục mặt hàng dự kiến và số lượng đặt để đối chiếu sai lệch.", "BULLET", False),
    ("Bước 2 – Kiểm tra cảm quan & Quét mã vạch SKU: Kiểm tra độ nguyên vẹn của bao bì, niêm phong và nhiệt độ bảo quản; quét mã vạch SKU bằng máy đọc để xác thực sản phẩm trong danh mục hệ thống.", "BULLET", False),
    ("Bước 3 – Nhập Ngày sản xuất (NSX) và Hạn sử dụng (HSD): Nhập chính xác thông tin in nổi trên bao bì; hệ thống kiểm tra ràng buộc biên bắt buộc ExpiryDate > ManufactureDate và ImportDate <= ExpiryDate.", "BULLET", False),
    ("Bước 4 – Máy tính RSL_inbound thời gian thực: Động cơ Shelf-Life tính toán tức thời chỉ số RSL_inbound; nếu >= 70% cho phép chuyển bước 5, nếu < 70% kích hoạt quy trình từ chối.", "BULLET", False),
    ("Bước 5 – Nhập số lượng thực nhận và Đơn giá vốn: Đếm thực tế số lượng kiện/thùng (QuantityReceived > 0) và xác nhận đơn giá vốn thực tế (ImportPrice).", "BULLET", False),
    ("Bước 6 – Xác nhận Lưu kho & Kích hoạt chuỗi xử lý giao dịch nguyên tử: Kích hoạt Transaction SQL Server tạo phiếu goods_receipts (GR-DC-xxxx), sinh mã lô chuẩn LOT-DC-[SKU]-[YYYYMMDD]-[STT]-[Suffix], chèn batches, cập nhật cost_price vào products, chuyển PO sang DELIVERED, ghi nhật ký DC_INBOUND và mở modal in tem nhãn lô hàng.", "BULLET", False),

    ("12.3  Quy trình Xử lý Từ chối Nhận hàng & Lập Biên bản REJECT_DC_INBOUND (Rule 7 & Rule 11)", "HEADING_2", True),
    ("Khi hàng hóa do xe tải DC giao có chỉ số RSL_inbound < 70%, hệ thống áp dụng cơ chế bảo vệ nghiêm ngặt:", "NORMAL", False),
    ("1. Khóa cứng tính năng lưu kho: Nút 'Lưu Phiếu Nhập Kho' bị vô hiệu hóa; API Backend ReceiveDCBatchUseCase ném lỗi và từ chối ghi dữ liệu vào bảng batches.", "BULLET", False),
    ("2. Mẫu Biên bản Từ chối Nhận hàng Điện tử: Tự động cấp mã REJ-DC-[Mã 6 số], ghi nhận đầy đủ SKU, tên sản phẩm, NSX, HSD, chỉ số RSL_inbound vi phạm, lý do từ chối và chữ ký điện tử của Nhân viên kho.", "BULLET", False),
    ("3. Nhật ký kiểm toán bất biến REJECT_DC_INBOUND: Lưu vết vĩnh viễn vào bảng system_audit_logs để làm bằng chứng pháp lý đối soát hàng lỗi/cận date với Kho tổng DC Biên Hòa.", "BULLET", False),
    ("4. Bàn giao hoàn trả: Nhân viên kho xuất file biên bản từ chối, ký biên bản cùng tài xế xe tải DC và trả hàng về xe tải ngay tại cửa kho.", "BULLET", False),

    ("12.4  Quy chuẩn In Tem Nhãn Lô Hàng Barcode / QR Code & Lưu kho", "HEADING_2", True),
    ("Toàn bộ các lô hàng tiếp nhận đạt chuẩn phải được in tem nhãn định danh dán trực tiếp lên pallet hoặc thùng carton trước khi chuyển vào kho hoặc kệ trưng bày:", "NORMAL", False),
    ("1. Tiêu chuẩn kỹ thuật: Khổ tem nhiệt 100mm x 75mm hoặc 80mm x 50mm, in trên máy in nhãn nhiệt chuyên dụng; chống phai màu trong môi trường kho mát.", "BULLET", False),
    ("2. Nội dung hiển thị: Tiêu đề 'LHU MART - TEM ĐỊNH DANH LÔ HÀNG TIẾP NHẬN DC'; Mã lô chuẩn hệ thống; Tên sản phẩm & SKU; Ngày sản xuất; Hạn sử dụng nổi bật font lớn; Tỷ lệ tươi mới lúc nhận (kèm biểu tượng Vùng Xanh).", "BULLET", False),
    ("3. Mã vạch tích hợp: Barcode Code 128 hoặc QR Code 2D mã hóa chuỗi: BATCH:[batchCode]|SKU:[productSku]|EXP:[YYYY-MM-DD]|QTY:[initialQuantity].", "BULLET", False),

    ("12.5  Ma trận Phân quyền & Tách biệt Trách nhiệm (SoD Matrix 4 Actor – Rule 7)", "HEADING_2", True),
    ("Nghiệp vụ tiếp nhận hàng hóa từ Kho tổng DC tuân thủ ma trận phân quyền phân định trách nhiệm rõ ràng giữa các vai trò trong cửa hàng:", "NORMAL", False),
    ("- Quản Trị Viên (ADMIN): Cấu hình ngưỡng RSL_min của cửa hàng, toàn quyền xem nhật ký kiểm toán nhập kho và tỷ lệ từ chối DC.", "BULLET", False),
    ("- Cửa Hàng Trưởng (STORE_MANAGER): Duyệt đơn đặt hàng PO trước đó, có quyền tiếp nhận hàng và giám sát đối soát biên bản từ chối DC.", "BULLET", False),
    ("- Nhân Viên Kho (WAREHOUSE_STAFF): Vai trò chủ trì thực thi trực tiếp kiểm tra date, nhập số lượng, lưu kho, in tem nhãn và lập biên bản từ chối nhận hàng.", "BULLET", False),
    ("- Thu Ngân Bán Lẻ (CASHIER): BỊ CHẶN TUYỆT ĐỐI (Khóa quyền truy cập giao diện Tiếp nhận hàng DC và API nhập kho nhằm tuân thủ nguyên tắc Tách biệt Trách nhiệm SoD; quầy thu ngân và tiếp nhận kho tách biệt độc lập).", "BULLET", False)
]

# Xóa các đoạn cũ từ start_idx đến end_idx - 1
for k in range(start_idx, end_idx):
    p_to_del = doc.paragraphs[start_idx]
    p_elem = p_to_del._element
    p_elem.getparent().remove(p_elem)

# Chèn các đoạn mới vào trước P{start_idx} (nay là vị trí của Section 13)
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
print(f"Successfully updated Section 12 with {len(new_paragraphs_data)} paragraphs!")

