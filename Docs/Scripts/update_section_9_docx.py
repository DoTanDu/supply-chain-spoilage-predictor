# -*- coding: utf-8 -*-
import os
import shutil
import docx
from docx.shared import Pt, RGBColor

def update_docx_section_9():
    doc_path = 'c:/thuyet minh/Docs/Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx'
    bak_path = 'c:/thuyet minh/Docs/Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx.bak_sec9'
    
    # 1. Sao lưu file an toàn trước khi chỉnh sửa
    shutil.copyfile(doc_path, bak_path)
    print(f"Safety backup created at: {bak_path}")

    doc = docx.Document(doc_path)

    start_idx = None
    end_idx = None

    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if '9. Quy trình kiểm soát hạn dùng' in txt:
            start_idx = i
        elif '10. Điều kiện kiểm tra khi bán hàng' in txt:
            end_idx = i
            break

    if start_idx is None or end_idx is None:
        raise ValueError(f"Could not locate Section 9 or Section 10 boundaries: start={start_idx}, end={end_idx}")

    print(f"Located Section 9 at P{start_idx} to P{end_idx-1} (Total: {end_idx - start_idx} paragraphs to replace)")

    # Danh sách các đoạn văn bản mới chi tiết chuẩn mực kỹ thuật cho Mục 9
    new_paragraphs = [
        ("9. Quy trình kiểm soát hạn dùng, cảnh báo 3 cấp màu & Tiêu hủy (Shelf-Life Control & Spoilage Management)", True, 13),
        ("Cơ chế kiểm soát vòng đời hạn sử dụng (Shelf-life) và quản lý rủi ro lãng phí là hạt nhân điều hành của nền tảng Bán lẻ Chống lãng phí LHU Mart. Toàn bộ quy trình được thiết kế theo 8 chuẩn mực kỹ thuật khép kín, tự động hóa từ khâu phân loại màu sắc, kích hoạt giảm giá, đảo kệ mặt tiền, đến khóa cứng hết hạn và hạch toán Sổ hao hụt tài chính bất biến.", False, 11),
        
        ("9.1 Động cơ cảnh báo 3 cấp màu động (Dynamic 3-Zone Alert Engine - Rule 4 SSOT)", True, 12),
        ("Hệ thống liên tục phân loại mức độ rủi ro cận date của từng lô hàng theo thời gian thực dựa trên số ngày còn lại đến hạn sử dụng: DaysLeft = DATEDIFF(DAY, CAST(GETDATE() AS DATE), expiry_date). So sánh DaysLeft với ngưỡng cảnh báo của từng ngành hàng (WarningDays trong khoảng 7 đến 30 ngày cấu hình tại bảng categories hoặc đè riêng theo products.warning_threshold_days):", False, 11),
        ("• VÙNG XANH (An toàn - SAFE / GREEN ZONE): Điều kiện DaysLeft > WarningDays. Lô hàng còn rất xa hạn dùng, chất lượng cảm quan và dinh dưỡng đạt mức tối ưu. Bán lẻ bình thường theo giá niêm yết 100% tại quầy POS; xếp ở các tầng kệ bên trong hoặc phía sau các lô cận date (chuẩn FEFO vật lý).", False, 10.5),
        ("• VÙNG VÀNG (Cảnh báo cận date - WARNING / YELLOW ZONE): Điều kiện 3 < DaysLeft <= WarningDays. Hàng hóa bước vào giai đoạn tốc độ tiêu thụ suy giảm, có nguy cơ tồn đọng nếu giữ nguyên tốc độ bán. Kích hoạt giảm giá xả hàng nhẹ (Quick Markdown 15% – 30%), mở cờ cảnh báo trên màn hình điều hành và bắt buộc nhân viên thực hiện SOP 5 bước đảo lô ra mặt tiền kệ.", False, 10.5),
        ("• VÙNG ĐỎ (Nguy kịch - CRITICAL / RED ZONE): Điều kiện 0 < DaysLeft <= 3 ngày. Hàng hóa cận date nghiêm trọng, chỉ còn tối đa 72 giờ trước khi hết hạn. Kích hoạt giảm giá kịch sàn (Quick Markdown 40% – 50%), gom hàng về Kệ xả hàng chống lãng phí trong ngày đặt tại lối ra vào chính của quầy thu ngân và đưa ngay vào Tab 1 Action Board ca trực.", False, 10.5),
        
        ("9.2 Cơ chế Expiry Watchdog & Khóa cứng hàng hết hạn (Rule 5 SSOT)", True, 12),
        ("Hệ thống bảo vệ an toàn vệ sinh thực phẩm (ATTP) tuyệt đối cho người tiêu dùng thông qua cơ chế giám sát tự động Expiry Watchdog với 2 lớp bảo vệ:", False, 11),
        ("1. Lớp 1 (Cron Job nền tự động): Kích hoạt định kỳ lúc 00:00:00 mỗi ngày, quét toàn bộ lô hàng có current_quantity > 0 và DaysLeft <= 0 để tự động chuyển trạng thái status = 'EXPIRED'.", False, 10.5),
        ("2. Lớp 2 (Just-In-Time Guard): Trước mỗi giao dịch bán lẻ POS hoặc truy vấn tồn kho khả dụng, View vw_Batches_ShelfLife_Alerts và Use Case ProcessFefoSaleUseCase tự động lọc bỏ các lô DaysLeft <= 0, không cho phép xuất bán.", False, 10.5),
        ("3. Chế tài nghiêm ngặt: API /api/sales lập tức từ chối và ném lỗi HTTP 400 ERR_BATCH_EXPIRED nếu mã lô truyền vào đã hết hạn. Phần mềm yêu cầu nhân viên rút 100% sản phẩm thuộc lô này khỏi quầy kệ trưng bày, chuyển vào Khu cách ly chờ tiêu hủy (Quarantine Bin). Tuyệt đối nghiêm cấm bán giảm giá đối với hàng đã hết hạn.", False, 10.5),
        
        ("9.3 Tích hợp Mô hình AI 2 – Spoilage Risk (Dự báo Nguy cơ Lãng phí)", True, 12),
        ("Kế thừa kiến trúc từ đề án SmartSupply AI (Định hướng dự án & Phân tích nghiệp vụ 3 Actor), hệ thống ứng dụng mô hình toán học dự báo nguy cơ lãng phí (AI 2 Spoilage Risk) để hỗ trợ Cửa hàng trưởng ra quyết định xả hàng sớm:", False, 11),
        ("• Ước tính Sản lượng Tiêu thụ Khả dĩ trước hạn: ExpectedSales = d_adjusted * DaysLeft (trong đó d_adjusted là tốc độ bán trung bình ngày của sản phẩm đã điều chỉnh theo hệ số thời tiết W_factor và ngày lễ H_factor từ AI 1 Demand Forecasting).", False, 10.5),
        ("• Tồn dư Nguy cơ Lãng phí: ExcessStock = max(0, current_quantity - ExpectedSales).", False, 10.5),
        ("• Chỉ số Rủi ro Hao hụt Lô hàng: SpoilageRiskPercent = min(100, (ExcessStock / current_quantity) * 100%).", False, 10.5),
        ("• Ma trận Khuyến nghị Thông minh từ AI 2:", False, 10.5),
        ("   - Nếu SpoilageRiskPercent == 0%: Tồn kho sẽ được tiêu thụ hết tự nhiên trước hạn -> Bán nguyên giá, duy trì FEFO thông thường.", False, 10.5),
        ("   - Nếu 0% < SpoilageRiskPercent <= 30%: Khuyến nghị kích hoạt Quick Markdown 15% và đảo kệ mặt tiền.", False, 10.5),
        ("   - Nếu 30% < SpoilageRiskPercent <= 60%: Khuyến nghị tăng mức Markdown lên 30%–40%, đồng thời giảm sản lượng đề xuất trong đơn PO gửi DC.", False, 10.5),
        ("   - Nếu SpoilageRiskPercent > 60%: Nguy cơ hủy hàng cực cao -> Báo động đỏ trên Dashboard, kích hoạt Quick Markdown kịch sàn 50% gom xả khẩn cấp.", False, 10.5),
        
        ("9.4 Chính sách Giảm giá Xả hàng Quick Markdown & Quy trình SOP 5 bước Đảo kệ (Rule 10 SSOT)", True, 12),
        ("Để hạn chế tối đa việc phải tiêu hủy hàng hóa gây thiệt hại tài chính và lãng phí thực phẩm, hệ thống cung cấp công cụ xả hàng chủ động:", False, 11),
        ("9.4.1 Ma trận 4 mức chiết khấu Quick Markdown:", True, 11),
        ("• 15%: Dành cho hàng Vùng Vàng mới chạm ngưỡng cảnh báo, hạn dùng còn từ 5–7 ngày.", False, 10.5),
        ("• 30%: Dành cho hàng Vùng Vàng sát hạn, tốc độ bán thực tế chậm hơn kỳ vọng.", False, 10.5),
        ("• 40%: Dành cho hàng Vùng Đỏ (còn 2–3 ngày), cần giải phóng nhanh dòng vốn.", False, 10.5),
        ("• 50%: Dành cho hàng Vùng Đỏ cận date kịch sàn (còn 1 ngày), giá bán bằng hoặc tiệm cận giá vốn để thu hồi tiền mặt.", False, 10.5),
        ("• 0%: Khôi phục giá niêm yết ban đầu khi lô hàng được điều phối hoặc có sự kiện đặc biệt.", False, 10.5),
        ("Cơ chế đồng bộ thời gian thực: Khi Cửa hàng trưởng áp dụng mức giảm giá, discount_percent của lô hàng được cập nhật tức thì trong CSDL và có hiệu lực ngay lập tức tại quầy thu ngân POS mà không cần nhân viên gõ tay.", False, 10.5),
        ("9.4.2 Quy trình SOP 5 bước Đảo kệ mặt tiền (Shelf Rotation SOP):", True, 11),
        ("• Bước 1 (Tra cứu phần mềm): Nhân viên kho mở Tab 2 trên Action Board hoặc Fefo Monitor, lọc các lô có cờ is_shelf_rotated = 0.", False, 10.5),
        ("• Bước 2 (Dỡ lô date xa): Đến đúng vị trí quầy kệ vật lý, dời tạm thời các lô Vùng Xanh (date xa) ra ngoài hoặc sang bên cạnh.", False, 10.5),
        ("• Bước 3 (Đưa lô cận date ra sát mép ngoài): Lấy toàn bộ sản phẩm của lô Vùng Vàng / Vùng Đỏ xếp ra vị trí mặt tiền kệ (ngang tầm mắt hoặc tầm với thuận tiện nhất của khách hàng).", False, 10.5),
        ("• Bước 4 (Xếp lô date xa phía sau): Xếp các sản phẩm date xa trở lại phía sau lưng lô cận date, đảm bảo khách hàng tự nhiên lấy lô cận date trước.", False, 10.5),
        ("• Bước 5 (Xác nhận điện tử): Nhân viên quét mã barcode hoặc bấm nút 'Xác nhận đã đảo kệ' trên phần mềm. Hệ thống cập nhật is_shelf_rotated = 1, lưu vết ID nhân viên và thời gian hoàn thành vào system_audit_logs.", False, 10.5),
        
        ("9.5 Quy trình 4 bước Tiêu hủy Hàng hỏng & Sổ Hao hụt Tài chính Bất biến (Rule 6 SSOT)", True, 12),
        ("Khi hàng hóa bị quá hạn (DaysLeft <= 0) hoặc hư hỏng cơ học (móp méo, vỡ hộp, biến chất), quy trình tiêu hủy bắt buộc phải thực thi nghiêm ngặt để đảm bảo an toàn thực phẩm và tính minh bạch tài chính:", False, 11),
        ("1. Bước 1 (Thu gom & Cách ly): Nhân viên phát hiện hàng hỏng/hết hạn trên kệ hoặc kho, lập tức rút khỏi lưu hành và gom vào Thùng cách ly (Quarantine Bin).", False, 10.5),
        ("2. Bước 2 (Lập phiếu đề xuất PENDING): Nhân viên mở giao diện SpoilageDisposalView, chọn lô hàng, nhập số lượng thực tế cần hủy, chọn lý do và bấm 'Lập Đề Xuất Tiêu Hủy'. Phiếu được lưu ở trạng thái chờ duyệt (approved_by = NULL).", False, 10.5),
        ("3. Bước 3 (Thẩm định & Phê duyệt APPROVED): Cửa hàng trưởng trực tiếp kiểm đếm số lượng và tình trạng hàng tại khu cách ly. Nếu khớp, Cửa hàng trưởng bấm 'Phê Duyệt Tiêu Hủy' trên phần mềm (yêu cầu quyền STORE_MANAGER hoặc ADMIN).", False, 10.5),
        ("4. Bước 4 (Trừ kho & Chốt Sổ hao hụt): Hệ thống mở SQL Transaction, trừ số lượng tồn kho current_quantity của lô hàng, tự động hạch toán giá trị tổn thất vốn CostLoss = quantity_disposed * import_price, và lưu vết vĩnh viễn vào Sổ hao hụt tài chính.", False, 10.5),
        ("Tính bất biến của Sổ hao hụt: Bảng spoilage_records là bảng dữ liệu bất biến (Append-Only / Immutable). Nghiêm cấm mọi thao tác sửa hoặc xóa (UPDATE, DELETE) bản ghi đã duyệt. Dữ liệu phục vụ quyết toán thuế TNDN (Thông tư 96/2015/TT-BTC) và thanh tra ATTP.", False, 10.5),
        
        ("9.6 Ma trận Phân quyền & Tách biệt Trách nhiệm (SoD 4 Actor - Mục 16 SSOT)", True, 12),
        ("Nhằm triệt tiêu nguy cơ gian lận nội bộ (nhân viên tự ý tẩu tán hàng hóa rồi báo tiêu hủy ảo), hệ thống áp dụng nguyên tắc Tách biệt Trách nhiệm (Separation of Duties - SoD):", False, 11),
        ("• Xem cảnh báo 3 cấp màu & Quá hạn: CASHIER, WAREHOUSE_STAFF, STORE_MANAGER, ADMIN (Tất cả vai trò đều có quyền theo dõi).", False, 10.5),
        ("• Kích hoạt giảm giá Quick Markdown: CASHIER và WAREHOUSE_STAFF bị khóa quyền; STORE_MANAGER và ADMIN có toàn quyền kích hoạt.", False, 10.5),
        ("• Xác nhận SOP 5 bước Đảo kệ: WAREHOUSE_STAFF (Tác nghiệp chính), CASHIER, STORE_MANAGER, ADMIN (Cho phép xác nhận sau khi kiểm tra).", False, 10.5),
        ("• Lập phiếu đề xuất tiêu hủy (trạng thái PENDING): CASHIER và WAREHOUSE_STAFF (Tác nghiệp lập đề xuất khi phát hiện hàng hỏng/quá date).", False, 10.5),
        ("• Phê duyệt tiêu hủy (chuyển sang APPROVED) & Chốt Sổ: CASHIER và WAREHOUSE_STAFF bị KHÓA CỨNG (HTTP 403); chỉ STORE_MANAGER và ADMIN mới có thẩm quyền ký duyệt.", False, 10.5),
        ("• Xem Sổ hao hụt tài chính & Thống kê tổn thất: CASHIER và WAREHOUSE_STAFF chỉ xem các phiếu trong ca; STORE_MANAGER và ADMIN xem toàn bộ lịch sử và báo cáo phân tích.", False, 10.5),
        
        ("9.7 Bảy (7) Điều kiện Biên & Ràng buộc Toàn vẹn Giao dịch Tiêu hủy", True, 12),
        ("Mọi thao tác tiêu hủy đều được kiểm tra nghiêm ngặt ở cả tầng Domain và Database:", False, 11),
        ("1. Khóa dòng dữ liệu (Concurrency Guard): Sử dụng WITH (UPDLOCK, ROWLOCK) trong SQL Transaction khi kiểm tra và trừ kho lô hàng để chống xung đột với quầy POS hoặc ca trực khác.", False, 10.5),
        ("2. Kiểm tra số lượng hủy hợp lệ: Số lượng tiêu hủy phải là số nguyên dương (quantity_disposed > 0).", False, 10.5),
        ("3. Chống âm kho lô hàng: Số lượng tiêu hủy không được vượt quá tồn kho khả dụng hiện tại (quantity_disposed <= current_quantity).", False, 10.5),
        ("4. Chuẩn hóa lý do tiêu hủy: Chỉ chấp nhận 3 nhóm lý do chuẩn: EXPIRED (Hết hạn sử dụng), DAMAGED (Hư hỏng móp méo/vỡ bao bì), SPOILED (Biến chất/chua hỏng do đứt chuỗi lạnh).", False, 10.5),
        ("5. Cập nhật trạng thái lô hàng: Nếu current_quantity - quantity_disposed == 0 -> Hệ thống tự động chuyển status = 'DISPOSED'; nếu còn hàng -> Giữ trạng thái cũ và trừ tồn kho.", False, 10.5),
        ("6. Bảo vệ khóa ngoại và dữ liệu lịch sử: Không cho phép xóa vật lý bất kỳ lô hàng nào đã có bản ghi tiêu hủy tham chiếu (FK_spoilage_batch).", False, 10.5),
        ("7. Ghi nhật ký kiểm toán bất biến: Tự động ghi bản ghi vào system_audit_logs với action_type = 'SPOILAGE_DISPOSAL' hoặc 'APPROVE_SPOILAGE', lưu đầy đủ mã biên bản, số lượng, tổn thất vốn CostLoss, ID người lập và ID người duyệt.", False, 10.5),
        
        ("9.8 Quy chuẩn Mẫu Biên bản Tiêu hủy Điện tử (K80 & A4)", True, 12),
        ("Biên bản tiêu hủy sau khi được phê duyệt có thể in nhiệt khổ K80 tại quầy hoặc xuất định dạng A4 lưu trữ kế toán với 4 khối thông tin quy chuẩn:", False, 11),
        ("1. Khối Đầu (Header): Tên cửa hàng (Cửa hàng Bán lẻ Tiện lợi LHU Mart), Địa chỉ, Tiêu đề 'BIÊN BẢN TIÊU HỦY HÀNG HÓA & HAO HỤT TÀI CHÍNH', Mã biên bản (SPOIL-[YYYYMMDD]-[XXXX]), Thời gian lập và Trạng thái phê duyệt.", False, 10.5),
        ("2. Khối Thông tin Lô hàng: Mã lô hàng (batch_code), Tên sản phẩm FMCG, Nhóm ngành hàng, Ngày sản xuất và Hạn sử dụng in trên bao bì.", False, 10.5),
        ("3. Khối Tài chính & Lý do: Số lượng hủy thực tế, Đơn vị tính, Đơn giá vốn nhập (import_price), Lý do tiêu hủy chuẩn hóa (EXPIRED / DAMAGED / SPOILED), Ghi chú chi tiết, và Tổng vốn tổn thất CostLoss = QuantityDisposed * ImportPrice.", False, 10.5),
        ("4. Khối Ký duyệt & Tra cứu: Họ tên / Chữ ký số của Người đề xuất (Staff) và Người phê duyệt (Store Manager), kèm Mã QR Code tra cứu biên bản trên cổng nội bộ LHU Mart.", False, 10.5)
    ]

    # Xóa các đoạn cũ từ start_idx đến end_idx - 1 (ngược từ dưới lên)
    for idx in range(end_idx - 1, start_idx - 1, -1):
        p = doc.paragraphs[idx]._p
        p.getparent().remove(p)

    # Chèn các đoạn mới vào đúng vị trí start_idx
    ref_p = doc.paragraphs[start_idx]._p if start_idx < len(doc.paragraphs) else None

    for text, is_bold, font_size in new_paragraphs:
        if ref_p is not None:
            new_p = doc.add_paragraph()
            # Di chuyển new_p lên trước ref_p trong XML
            ref_p.addprevious(new_p._p)
        else:
            new_p = doc.add_paragraph()

        run = new_p.add_run(text)
        run.bold = is_bold
        run.font.size = Pt(font_size)
        run.font.name = 'Be Vietnam Pro'
        if is_bold and font_size >= 12:
            run.font.color.rgb = RGBColor(16, 185, 129) # Safe Green accent
        else:
            run.font.color.rgb = RGBColor(15, 23, 42)

    doc.save(doc_path)
    print(f"Successfully updated Section 9 in DOCX: inserted {len(new_paragraphs)} detailed paragraphs.")

if __name__ == '__main__':
    update_docx_section_9()

