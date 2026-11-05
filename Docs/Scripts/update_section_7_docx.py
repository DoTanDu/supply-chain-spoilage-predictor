# -*- coding: utf-8 -*-
import docx
from docx.shared import Pt, RGBColor

def update_docx_section_7():
    doc_path = 'c:/thuyet minh/Docs/Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx'
    doc = docx.Document(doc_path)

    start_idx = None
    end_idx = None

    for i, p in enumerate(doc.paragraphs):
        if '7. Quản lý lô hàng' in p.text:
            start_idx = i
        elif '8. Chức năng bán lẻ POS' in p.text:
            end_idx = i
            break

    if start_idx is None or end_idx is None:
        raise ValueError(f"Could not locate Section 7 or Section 8 boundaries: start={start_idx}, end={end_idx}")

    print(f"Located Section 7 at P{start_idx} to P{end_idx-1} (Total: {end_idx - start_idx} paragraphs)")

    # Danh sách các đoạn văn bản mới cần thay thế
    new_paragraphs = [
        ("7. Quản lý lô hàng & Vòng đời hạn sử dụng (Shelf-Life Management)", True, 13),
        ("Quản lý chi tiết theo từng lô hàng (Batch-Level Inventory Tracking) là hạt nhân then chốt của toàn bộ hệ thống bán lẻ chống lãng phí LHU Mart. Khác với mô hình bán lẻ thông thường chỉ quản lý tổng tồn kho theo sản phẩm, hệ thống bắt buộc phân rã tồn kho theo từng đợt hàng nhập thực tế nhằm phục vụ thuật toán xuất kho FEFO (Rule 2), cảnh báo 3 cấp màu (Rule 4), tự động khóa cứng hàng hết hạn (Rule 5) và dự báo nguy cơ lãng phí (AI 2 Spoilage Risk - tham chiếu tài liệu SmartSupply AI — Định hướng & Đặc tả triển khai).", False, 11),
        ("7.1 Cấu trúc dữ liệu hồ sơ lô hàng (Product Batch Profile)", True, 12),
        ("Mỗi sản phẩm FMCG có thể có nhiều lô hàng khác nhau lưu hành song song trên quầy kệ và trong kho. Bảng batches lưu giữ thông tin chi tiết của từng lô:", False, 11),
        ("batch_code       – Mã lô hàng duy nhất toàn hệ thống (chuẩn: LOT-DC-[SKU]-[YYYYMMDD])", False, 10.5),
        ("product_id       – Khóa ngoại liên kết danh mục sản phẩm FMCG (products)", False, 10.5),
        ("receipt_id       – Khóa ngoại liên kết phiếu tiếp nhận hàng DC (goods_receipts) để truy vết nguồn gốc 100%", False, 10.5),
        ("import_date      – Ngày nhập kho cửa hàng LHU Mart thực tế", False, 10.5),
        ("manufacture_date – Ngày sản xuất (NSX) in trên bao bì thùng hàng do nhà sản xuất công bố", False, 10.5),
        ("expiry_date      – Ngày hết hạn sử dụng (HSD / Best Before / Use By) in trên bao bì", False, 10.5),
        ("initial_quantity – Số lượng nhập ban đầu từ xe tải DC", False, 10.5),
        ("current_quantity – Số lượng tồn hiện tại trên kệ (Ràng buộc CHECK: 0 <= current_quantity <= initial_quantity)", False, 10.5),
        ("import_price     – Đơn giá vốn nhập thực tế của lô theo hợp đồng cung ứng", False, 10.5),
        ("discount_percent – Tỷ lệ giảm giá xả hàng Quick Markdown hiện tại (0%, 15%, 30%, 40%, 50%)", False, 10.5),
        ("is_shelf_rotated – Cờ xác nhận đã hoàn tất SOP 5 bước đảo lô cận date ra mặt tiền kệ (0 / 1)", False, 10.5),
        ("shelf_rotated_at, shelf_rotated_by – Dấu vết thời gian và nhân viên ký nhận đảo kệ điện tử", False, 10.5),
        ("status           – Trạng thái vòng đời lô hàng (ACTIVE, WARNING, EXPIRED, DISPOSED)", False, 10.5),
        ("created_at       – Dấu vết thời gian tạo bản ghi trong hệ thống", False, 10.5),
        ("7.2 Quy chuẩn định dạng mã lô hàng & mã vạch (Batch Coding & Labeling Standards)", True, 12),
        ("Cấu trúc mã lô tự động: BatchCode = LOT-DC-[SKU]-[YYYYMMDD]", False, 11),
        ("Trong đó LOT-DC là tiền tố kho tổng DC Biên Hòa; [SKU] là mã sản phẩm FMCG; [YYYYMMDD] là ngày nhập kho.", False, 11),
        ("Mỗi mã lô tương ứng với một mã vạch chuẩn Code 128 và QR Code được in trên tem nhãn dán khay/thùng hàng, cho phép nhân viên sử dụng máy quét mã vạch cầm tay hoặc camera smartphone quét truy xuất tức thì toàn bộ thông số vòng đời của lô hàng.", False, 11),
        ("7.3 Vòng đời trạng thái lô hàng (Batch Lifecycle State Machine)", True, 12),
        ("Vòng đời của từng lô hàng trải qua 5 trạng thái vận hành chặt chẽ:", False, 11),
        ("1. INBOUND_INSPECTING: Xe tải DC Biên Hòa giao hàng đến cửa hàng, nhân viên kho kiểm định RSL_inbound >= 70%. Nếu không đạt chuẩn (< 70%), hệ thống từ chối nhận và tự động lập Biên bản kiểm toán REJECT_DC_INBOUND.", False, 10.5),
        ("2. ACTIVE (Đang lưu hành bình thường): Lô hàng mới nhập, thuộc Vùng Xanh (DaysLeft > WarningDays), bán nguyên giá niêm yết theo nguyên tắc FEFO.", False, 10.5),
        ("3. WARNING (Cảnh báo cận date): Lô hàng rơi vào Vùng Vàng (3 < DaysLeft <= WarningDays) hoặc Vùng Đỏ (0 < DaysLeft <= 3), hoặc đang áp dụng giảm giá Quick Markdown, cần đảo kệ mặt tiền theo SOP 5 bước.", False, 10.5),
        ("4. EXPIRED (Khóa cứng quá hạn): Lô hàng có DaysLeft <= 0, tự động bị Expiry Watchdog khóa cứng, cấm xuất bán POS tuyệt đối (Rule 5), chuyển vào khu cách ly.", False, 10.5),
        ("5. DISPOSED (Đã tiêu hủy): Lô hàng đã hoàn tất thủ tục tiêu hủy, hạch toán thiệt hại vốn vào Sổ hao hụt tài chính bất biến (spoilage_records - Rule 6).", False, 10.5),
        ("7.4 Bộ công thức toán học đo lường vòng đời & dự báo nguy cơ lãng phí (Shelf-Life & Spoilage Risk Metrics)", True, 12),
        ("1. Số ngày còn lại (DaysLeft): DaysLeft = DATEDIFF(day, CAST(GETDATE() AS DATE), expiry_date)", False, 10.5),
        ("2. Tổng vòng đời chuẩn (TotalLife): TotalLife = DATEDIFF(day, manufacture_date, expiry_date)", False, 10.5),
        ("3. Tỷ lệ hạn sử dụng còn lại (% RSL – Remaining Shelf-Life): RSL (%) = (DaysLeft / TotalLife) * 100", False, 10.5),
        ("4. Tiêu chuẩn kiểm định đợt hàng tiếp nhận từ DC Biên Hòa (Rule 7): RSL_inbound = (DATEDIFF(day, import_date, expiry_date) / TotalLife) * 100 >= 70%", False, 10.5),
        ("5. Dự báo nguy cơ lãng phí (AI 2 - Spoilage Risk Metric từ tài liệu SmartSupply AI):", False, 11),
        ("   EstimatedSales = v_14d * DaysLeft", False, 10.5),
        ("   AtRiskStock = MAX(0, current_quantity - EstimatedSales)", False, 10.5),
        ("   AtRiskCost = AtRiskStock * import_price", False, 10.5),
        ("   Nếu AtRiskStock > 0, hệ thống phát cảnh báo nguy cơ ứ đọng date và kích hoạt đề xuất Quick Markdown / Đảo kệ ngay trên Action Board ca trực.", False, 10.5),
        ("6. Đơn giá bán lẻ hiệu dụng sau chiết khấu Quick Markdown: Price_effective = selling_price * (1 - discount_percent / 100)", False, 10.5),
        ("7.5 Động cơ cảnh báo 3 cấp màu động (Dynamic 3-Zone Alert Engine - Rule 4 & Rule 5)", True, 12),
        ("Ngưỡng ngày cảnh báo được hệ thống xác định linh hoạt theo thứ tự ưu tiên kế thừa phân tầng: WarningDays = COALESCE(Products.CustomWarningDays, Categories.DefaultWarningDays, StoreProfile.DefaultWarningDays, 7)", False, 11),
        ("Bảng phân loại rủi ro 4 phân vùng màu sắc:", False, 11),
        ("• Vùng Xanh (An toàn): DaysLeft > WarningDays -> Trạng thái ACTIVE, bán nguyên giá niêm yết, phân bổ xuất kho FEFO.", False, 10.5),
        ("• Vùng Vàng (Cảnh báo): 3 < DaysLeft <= WarningDays -> Trạng thái WARNING, tự động gắn cờ cần đảo kệ is_shelf_rotated = 0, đề xuất Quick Markdown 15% - 30%.", False, 10.5),
        ("• Vùng Đỏ (Nguy kịch): 0 < DaysLeft <= 3 -> Trạng thái CRITICAL/WARNING, bắt buộc đảo kệ mặt tiền ra vị trí vàng, kích hoạt Quick Markdown kịch sàn 40% - 50% gom xả gấp trong ngày.", False, 10.5),
        ("• Khóa Cứng (Hết hạn): DaysLeft <= 0 -> Trạng thái EXPIRED, Expiry Watchdog khóa cứng xuất bán POS 100% (Rule 5), chuyển danh sách cách ly chờ lập biên bản tiêu hủy.", False, 10.5),
        ("7.6 Quy tắc bảo vệ toàn vẹn dữ liệu & kiểm soát đồng thời (Rule 3 SSOT)", True, 12),
        ("Ràng buộc toàn vẹn thời gian: Bắt buộc expiry_date > manufacture_date và import_date <= expiry_date.", False, 10.5),
        ("Chống tồn kho âm tuyệt đối (Rule 3): Ràng buộc CHECK (current_quantity >= 0 AND current_quantity <= initial_quantity) ngăn chặn triệt để âm kho.", False, 10.5),
        ("Kiểm soát tranh chấp đồng thời (Concurrency Control): Mọi giao dịch xuất bán POS hoặc điều chỉnh trừ kho đều thực thi trong SQL Transaction với khóa dòng WITH (UPDLOCK, ROWLOCK) trên bản ghi lô hàng, loại trừ hoàn toàn nguy cơ race condition.", False, 10.5),
        ("Cơ chế Expiry Watchdog: Trước mỗi giao dịch xuất bán, kiểm kê hoặc truy vấn danh sách lô hàng, hệ thống tự động quét và cập nhật trạng thái EXPIRED cho tất cả các lô có DaysLeft <= 0.", False, 10.5),
        ("Tính bất biến của lịch sử (Immutability): Nghiêm cấm xóa vật lý (Hard Delete) bất kỳ lô hàng nào đã phát sinh giao dịch bán lẻ (sales_history) hoặc biên bản tiêu hủy (spoilage_records).", False, 10.5),
        ("7.7 Ma trận phân định trách nhiệm (SoD Matrix 4 Actor) cho nghiệp vụ lô hàng", True, 12),
        ("Bảng phân quyền 4 vai trò tham chiếu từ tài liệu định hướng SmartSupply AI — Phân tích nghiệp vụ 3 Actor:", False, 11),
        ("• Tiếp nhận lô hàng DC (RSL >= 70%): WAREHOUSE_STAFF (Tác nghiệp chính), STORE_MANAGER, ADMIN (Cho phép), CASHIER (Chặn).", False, 10.5),
        ("• Từ chối nhận hàng DC & lập biên bản: WAREHOUSE_STAFF (Tác nghiệp chính), STORE_MANAGER, ADMIN (Cho phép), CASHIER (Chặn).", False, 10.5),
        ("• In tem nhãn Barcode lô hàng dán kệ: WAREHOUSE_STAFF (Tác nghiệp chính), STORE_MANAGER, ADMIN (Cho phép), CASHIER (Chỉ xem).", False, 10.5),
        ("• Giám sát 3 vùng màu & Vốn rủi ro lãng phí: ADMIN, STORE_MANAGER (Toàn quyền); WAREHOUSE_STAFF, CASHIER (Xem phục vụ tác nghiệp).", False, 10.5),
        ("• Kích hoạt Quick Markdown (15%, 30%, 40%, 50%): Chỉ STORE_MANAGER và ADMIN có quyền duyệt; WAREHOUSE_STAFF và CASHIER bị chặn.", False, 10.5),
        ("• Thực hiện SOP 5 bước đảo kệ mặt tiền: WAREHOUSE_STAFF (Thực hiện chính), STORE_MANAGER, ADMIN (Giám sát), CASHIER (Chỉ xem).", False, 10.5),
        ("• In tem Sticker xả hàng giảm giá: Mọi vai trò.", False, 10.5),
        ("• Đề xuất tiêu hủy lô hàng quá hạn / hư hỏng: WAREHOUSE_STAFF, CASHIER, STORE_MANAGER (Đề xuất).", False, 10.5),
        ("• Phê duyệt chốt Sổ hao hụt tài chính: Chỉ STORE_MANAGER và ADMIN có quyền chốt sổ; WAREHOUSE_STAFF và CASHIER bị chặn.", False, 10.5),
        ("7.8 Tiêu chuẩn tem nhãn mã vạch & tem sticker xả hàng giảm giá", True, 12),
        ("1. Tem nhãn lô hàng tiếp nhận (Inbound Shelf Label): Kích thước nhiệt 75x50mm hoặc 100x60mm dán trên khay/thùng hàng tại kho: Tên cửa hàng (\"LHU Mart\"), Tên sản phẩm FMCG, Mã SKU, Mã lô (batch_code), Mã vạch Barcode Code 128 / QR Code, Ngày sản xuất, Hạn sử dụng, Tỷ lệ RSL %, Quy cách đóng gói.", False, 10.5),
        ("2. Tem Sticker xả hàng Quick Markdown: Kích thước tem tròn 35mm hoặc tem dạ quang màu vàng/đỏ dán trực tiếp lên bao bì sản phẩm cận date: Mức giảm giá (\"GIẢM 30%\", \"GIẢM 50%\"), Giá gốc niêm yết (gạch ngang), Giá khuyến mãi xả hàng mới, Lưu ý hạn dùng.", False, 10.5)
    ]

    target_para = doc.paragraphs[end_idx]

    # Xóa các đoạn cũ từ end_idx - 1 lùi về start_idx
    for p_idx in range(end_idx - 1, start_idx - 1, -1):
        p_to_del = doc.paragraphs[p_idx]
        p_to_del._element.getparent().remove(p_to_del._element)

    # Chèn các đoạn mới trước target_para
    for text, is_bold, size in new_paragraphs:
        new_p = target_para.insert_paragraph_before()
        run = new_p.add_run(text)
        run.bold = is_bold
        run.font.size = Pt(size)
        run.font.name = 'Times New Roman'

    doc.save(doc_path)
    print(f"Successfully updated Section 7 in {doc_path} with {len(new_paragraphs)} rich paragraphs!")

if __name__ == '__main__':
    update_docx_section_7()

