# -*- coding: utf-8 -*-
"""
Docs/Scripts/update_section_14_docx.py
Cập nhật và chuẩn hóa Mục 14 trong file Word:
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
    if p.text.strip().startswith('14. Quản lý tiêu hủy'):
        start_idx = i
    if p.text.strip().startswith('15. Quản lý lịch trực'):
        end_idx = i
        break

print(f"Found Section 14 from P{start_idx} to P{end_idx}")

if start_idx is None or end_idx is None:
    print("Error: Could not locate Section 14 boundaries!")
    sys.exit(1)

# Danh sách các đoạn văn bản mới cho Mục 14
new_paragraphs_data = [
    ("14. Quản lý tiêu hủy & Sổ hao hụt tài chính (Spoilage Loss Ledger – Rule 6 SSOT)", "HEADING_1", True),
    ("Sổ hao hụt tài chính (Spoilage Loss Ledger) là công cụ pháp lý và hạch toán kế toán cốt lõi của nền tảng Bán lẻ Chống Lãng phí LHU Mart (RETAIL-STORE-01). Mọi số lượng hàng hóa rút khỏi lưu thông tại quầy kệ do hư hỏng, quá date hoặc biến chất bắt buộc phải lập biên bản tiêu hủy, đối chiếu tồn kho vật lý tại khu cách ly và ghi nhận bất biến vào Sổ hao hụt theo giá vốn gốc. Quy trình này đảm bảo tính minh bạch tài chính tuyệt đối, phục vụ thanh tra An toàn Thực phẩm (ATTP) và quyết toán thuế Thu nhập Doanh nghiệp (TNDN) theo đúng Quy tắc Nghiệp vụ Rule 6.", "NORMAL", False),

    ("14.1  Nguyên tắc Kế toán Tài chính & Bộ Công thức Đo lường Thiệt hại Vốn (CostLoss)", "HEADING_2", True),
    ("Theo chuẩn mực kế toán hàng tồn kho (VAS 02 / IFRS 2), tổn thất hàng hư hỏng rút khỏi lưu thông được ghi nhận theo Đơn giá vốn nhập kho (ImportPrice), tuyệt đối không sử dụng giá bán lẻ niêm yết (SellingPrice) nhằm loại trừ doanh thu giả định và biên lợi nhuận chưa thực hiện, phản ánh đúng lượng vốn lưu động thực tế bị mất trắng:", "NORMAL", False),
    ("1. Công thức tính thiệt hại vốn của từng biên bản tiêu hủy: CostLoss = QuantityDisposed * ImportPrice (trong đó QuantityDisposed là số lượng hủy thực tế nguyên dương, ImportPrice là đơn giá vốn thực tế kế thừa bất biến từ bảng batches).", "BULLET", False),
    ("2. Tổng thiệt hại vốn tích lũy trong kỳ kế toán: TotalCostLoss = SUM(CostLoss) = SUM(QuantityDisposed * ImportPrice).", "BULLET", False),
    ("3. Tỷ lệ hao hụt lãng phí toàn diện: SpoilageRate (%) = (TotalCostLoss / (TotalRevenue + TotalCostLoss)) * 100. Mục tiêu kiểm soát SpoilageRate < 1.5%; nếu vượt ngưỡng 2.5% hệ thống kích hoạt cảnh báo đỏ trên Dashboard.", "BULLET", False),

    ("14.2  Danh mục 3 Lý do Tiêu hủy Chuẩn hóa & Quy chuẩn Phân loại", "HEADING_2", True),
    ("Nhằm phục vụ phân tích nguyên nhân gốc rễ (Root Cause Analysis) và hạch toán chứng từ thuế, hệ thống cố định danh mục 3 lý do tiêu hủy chuẩn hóa:", "NORMAL", False),
    ("1. EXPIRED (Hàng Hết Hạn Sử Dụng): Lô hàng có DaysLeft <= 0 trên quầy kệ; hệ thống tự động kích hoạt Expiry Watchdog khóa cứng xuất bán POS theo Rule 5 và yêu cầu nhân viên rút khỏi kệ gom vào khu cách ly chờ tiêu hủy.", "BULLET", False),
    ("2. DAMAGED (Hư Hỏng Bao Bì Vật Lý): Sản phẩm bị móp méo vỏ hộp, rách seal, nứt vỡ bao bì trong quá trình bốc dỡ từ xe tải DC hoặc do khách hàng vô tình làm rơi vỡ tại quầy kệ trưng bày.", "BULLET", False),
    ("3. SPOILED (Biến Chất / Hư Hỏng Sinh Học): Sản phẩm bị chua, lên men sớm, nổi bọt hoặc vón cục trước hạn sử dụng in trên bao bì do lỗi đứt gãy nhiệt độ bảo quản lạnh (thường gặp ở sữa tươi, thực phẩm mát 2 - 4°C).", "BULLET", False),

    ("14.3  Quy trình Phê duyệt 2 Bước & Tách biệt Trách nhiệm (Two-Phase Approval SOP & SoD)", "HEADING_2", True),
    ("Nhằm ngăn chặn triệt để hành vi tiêu cực, gian lận nội bộ hoặc tự ý vứt bỏ hàng hóa trên quầy kệ, hệ thống áp dụng cơ chế phê duyệt 2 pha khép kín với ma trận tách biệt trách nhiệm (Separation of Duties – SoD):", "NORMAL", False),
    ("1. Pha 1 – Lập Đề xuất Tiêu hủy (Pending Draft Phase): Thu ngân (CASHIER) hoặc Nhân viên kho (WAREHOUSE_STAFF) phát hiện hàng hỏng, kiểm đếm số lượng thực tế, đưa vào khu cách ly và mở DisposalFormModal chọn lô hàng, nhập số lượng và lý do; bản ghi được tạo ở trạng thái PENDING (approved_by = NULL). Ràng buộc bảo vệ: Tồn kho batches tuyệt đối CHƯA BỊ TRỪ ở pha này.", "BULLET", False),
    ("2. Pha 2 – Kiểm tra Thực tế & Phê duyệt Chốt Sổ (Approval Phase): Cửa hàng trưởng (STORE_MANAGER) hoặc Quản trị viên (ADMIN) trực tiếp đến khu cách ly đối chiếu hàng thực tế với thông tin trên phần mềm; bấm 'Phê duyệt & Chốt sổ' (POST /api/spoilage/:id/approve). Hệ thống mở SQL Transaction khấu trừ current_quantity, cập nhật approved_by, ghi nhận Sổ hao hụt bất biến và mở modal in chứng từ K80/A4.", "BULLET", False),
    ("3. Quy trình rút gọn cho Quản lý: Nếu người trực tiếp lập phiếu là STORE_MANAGER hoặc ADMIN, hệ thống tự động ký duyệt và chốt sổ trong cùng một giao dịch nguyên tử mà không cần bước phê duyệt trung gian.", "BULLET", False),

    ("14.4  Quy chuẩn Vòng đời Lô Hàng: Chuyển Trạng thái DISPOSED (Rule 6 & Rule 5)", "HEADING_2", True),
    ("Trạng thái DISPOSED là trạng thái kết thúc vòng đời (Terminal State) của một lô hàng FMCG:", "NORMAL", False),
    ("1. Ràng buộc kiểm tra tồn kho: Bắt buộc QuantityDisposed <= CurrentQuantity của lô hàng. Hệ thống ném lỗi HTTP 400 ERR_DISPOSAL_EXCEEDS_STOCK nếu số lượng tiêu hủy vượt quá tồn kho khả dụng hiện tại.", "BULLET", False),
    ("2. Kích hoạt trạng thái DISPOSED: Khi QuantityDisposed = CurrentQuantity (tiêu hủy toàn bộ lượng tồn còn lại), hệ thống tự động cập nhật current_quantity = 0 và chuyển status = 'DISPOSED'.", "BULLET", False),
    ("3. Khóa cứng toàn diện: Lô hàng ở trạng thái DISPOSED vĩnh viễn bị loại khỏi quầy bán lẻ POS, không xuất hiện trong gợi ý FEFO, không cho phép giảm giá Quick Markdown và chỉ xuất hiện trong báo cáo Sổ hao hụt tài chính.", "BULLET", False),

    ("14.5  Quy chuẩn Chứng từ Biên bản Tiêu hủy Điện tử & In Phiếu K80 / A4", "HEADING_2", True),
    ("Mọi nghiệp vụ tiêu hủy sau khi được phê duyệt đều phải sinh chứng từ kế toán điện tử đầy đủ tính pháp lý:", "NORMAL", False),
    ("1. Cấu trúc Mã Biên bản Tiêu hủy chuẩn hệ thống: SPOIL-[YYYYMMDD]-[Mã 4 số ngẫu nhiên] (Duy nhất, không trùng lặp; ví dụ: SPOIL-20261105-5367).", "BULLET", False),
    ("2. Nội dung hiển thị: Tiêu đề 'CỬA HÀNG BÁN LẺ TIỆN LỢI LHU MART - BIÊN BẢN TIÊU HỦY HÀNG HỎNG & HAO HỤT'; Thời gian thực hiện; Tên sản phẩm & SKU; Mã lô chuẩn hệ thống; Hạn sử dụng; Số lượng tiêu hủy; Đơn giá vốn nhập kho; Tổng thiệt hại vốn (CostLoss); Lý do tiêu hủy; Chữ ký điện tử của Người lập đề xuất và Cửa hàng trưởng ký duyệt.", "BULLET", False),
    ("3. Mẫu in biên bản chuyên biệt: Cung cấp cửa sổ xem trước và in tức thì qua PrintSpoilageReceiptModal trên máy in hóa đơn nhiệt K80 hoặc máy in văn phòng A4 kẹp hồ sơ kế toán quyết toán thuế TNDN.", "BULLET", False),

    ("14.6  Ma trận Phân quyền SoD & Nhật ký Kiểm toán Bất biến (Rule 11)", "HEADING_2", True),
    ("Ma trận phân quyền 4 vai trò kiểm soát chặt chẽ quy trình tiêu hủy hàng hóa:", "NORMAL", False),
    ("1. Quản trị viên (ADMIN) & Cửa hàng trưởng (STORE_MANAGER): Toàn quyền phê duyệt, chốt sổ hao hụt, hủy bỏ phiếu không hợp lệ và giám sát toàn diện số liệu thiệt hại tài chính.", "BULLET", False),
    ("2. Nhân viên thu ngân (CASHIER) & Nhân viên kho (WAREHOUSE_STAFF): Chỉ được phép lập đề xuất tiêu hủy (tạo phiếu PENDING); tuyệt đối bị cấm tự ý phê duyệt chốt sổ (HTTP 403 Forbidden); dữ liệu vốn tổn thất CostLoss trên giao diện bị che để bảo mật dòng tiền.", "BULLET", False),
    ("3. Nhật ký kiểm toán bất biến system_audit_logs: Tự động ghi nhận vĩnh viễn 2 hành động SPOILAGE_DISPOSAL (khi lập đề xuất) và APPROVE_DISPOSAL (khi Quản lý phê duyệt chốt sổ trừ kho) phục vụ thanh tra và kiểm toán độc lập.", "BULLET", False)
]

# Xóa các đoạn cũ từ start_idx đến end_idx - 1
for k in range(start_idx, end_idx):
    p_to_del = doc.paragraphs[start_idx]
    p_elem = p_to_del._element
    p_elem.getparent().remove(p_elem)

# Chèn các đoạn mới vào trước P{start_idx} (nay là vị trí của Section 15)
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
print(f"Successfully updated Section 14 in Word document with {len(new_paragraphs_data)} paragraphs!")

