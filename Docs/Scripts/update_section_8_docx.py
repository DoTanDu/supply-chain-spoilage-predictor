# -*- coding: utf-8 -*-
import os
import shutil
import docx
from docx.shared import Pt, RGBColor

def update_docx_section_8():
    doc_path = 'c:/thuyet minh/Docs/Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx'
    bak_path = 'c:/thuyet minh/Docs/Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx.bak_sec8'
    
    # 1. Sao lưu file an toàn trước khi chỉnh sửa
    shutil.copyfile(doc_path, bak_path)
    print(f"Safety backup created at: {bak_path}")

    doc = docx.Document(doc_path)

    start_idx = None
    end_idx = None

    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if '8. Chức năng bán lẻ POS' in txt:
            start_idx = i
        elif '9. Quy trình kiểm soát hạn dùng' in txt:
            end_idx = i
            break

    if start_idx is None or end_idx is None:
        raise ValueError(f"Could not locate Section 8 or Section 9 boundaries: start={start_idx}, end={end_idx}")

    print(f"Located Section 8 at P{start_idx} to P{end_idx-1} (Total: {end_idx - start_idx} paragraphs)")

    # Danh sách các đoạn văn bản mới chi tiết chuẩn mực kỹ thuật
    new_paragraphs = [
        ("8. Chức năng bán lẻ POS theo nguyên tắc FEFO (First Expired, First Out)", True, 13),
        ("Bán lẻ tại quầy POS là điểm chạm nghiệp vụ trực tiếp với người tiêu dùng và là điểm khởi đầu cho toàn bộ luồng dữ liệu của hệ thống. Tại Cửa hàng Bán lẻ LHU Mart, hệ thống áp dụng nguyên tắc cốt lõi: Bán hàng tại quầy POS = Xuất kho trực tiếp. Mỗi giao dịch thanh toán thành công lập tức khấu trừ tồn kho khả dụng theo lô và ghi nhận lịch sử bất biến.", False, 11),
        ("8.1 Nguyên tắc FEFO tuyệt đối trong bán lẻ POS (Rule 2 SSOT)", True, 12),
        ("• Xuất kho tự động theo hạn sử dụng: Hệ thống tự động truy vấn toàn bộ các lô hàng còn tồn khả dụng (current_quantity > 0, status IN ('ACTIVE', 'WARNING') và DaysLeft > 0) của sản phẩm được quét, sau đó sắp xếp theo thứ tự ưu tiên: expiry_date ASC, id ASC. Lô có hạn sử dụng gần nhất bắt buộc phải được xuất trước.", False, 10.5),
        ("• Cấm can thiệp chọn lô thủ công: Thu ngân (CASHIER) tuyệt đối không có quyền can thiệp chọn mã lô trên giao diện POS. Điều này ngăn chặn tình trạng ưu ái giữ date mới cho người quen, đảm bảo tính công bằng và tuân thủ nghiêm ngặt chuẩn mực vận hành chống lãng phí (tham chiếu phân định trách nhiệm trong SmartSupply AI — Phân tích nghiệp vụ 3 Actor).", False, 10.5),
        ("• Tự động áp dụng giá xả hàng Quick Markdown: Nếu lô hàng cận date đang được hưởng chính sách chiết khấu xả hàng (discount_percent > 0), hệ thống tự động áp dụng đơn giá khuyến mãi ưu đãi cho đúng số lượng lấy từ lô đó, khuyến khích khách hàng tiêu thụ các sản phẩm cận date.", False, 10.5),
        ("8.2 Thuật toán phân bổ lô FEFO & bẻ nhỏ đơn hàng tự động (Split Order Algorithm)", True, 12),
        ("Khi khách hàng mua số lượng lớn hơn lượng hàng tồn của lô cận date nhất, hệ thống tự động kích hoạt thuật toán bẻ đơn hàng (Split Order Scenario) qua nhiều lô kế tiếp nhau theo chuẩn FEFO trong cùng một giao dịch nguyên tử:", False, 11),
        ("Mã giả thuật toán allocateFefo:", True, 11),
        ("1. Sắp xếp danh sách lô khả dụng theo: (expiry_date ASC, id ASC)", False, 10.5),
        ("2. Khởi tạo: remainingToAllocate = requestedQuantity, allocations = []", False, 10.5),
        ("3. Vòng lặp duyệt từng lô hàng trong danh sách khả dụng:", False, 10.5),
        ("   - Nếu remainingToAllocate <= 0: Kết thúc vòng lặp.", False, 10.5),
        ("   - qtyFromBatch = min(batch.current_quantity, remainingToAllocate)", False, 10.5),
        ("   - unitPrice = sellingPrice * (1 - batch.discount_percent / 100)", False, 10.5),
        ("   - lineTotal = qtyFromBatch * unitPrice", False, 10.5),
        ("   - allocations.append({ batchId, batchCode, expiryDate, daysLeft, qtyFromBatch, discountPercent, unitPrice, lineTotal })", False, 10.5),
        ("   - remainingToAllocate -= qtyFromBatch", False, 10.5),
        ("4. Kiểm tra an toàn tồn kho: Nếu remainingToAllocate > 0 -> Ném ngoại lệ InsufficientStockError ('Tổng tồn kho khả dụng còn hạn không đủ đáp ứng số lượng yêu cầu!')", False, 10.5),
        ("5. Trả về kết quả: allocations, isSplitOrder = (allocations.length > 1), totalAmount", False, 10.5),
        ("8.3 Kịch bản minh họa bẻ nhỏ đơn hàng thực tế với số liệu tài chính chi tiết", True, 12),
        ("Ví dụ thực tế minh họa tính toán chiết khấu và bẻ đơn:", False, 11),
        ("• Nhu cầu khách hàng: Mua 5 hộp Sữa Tươi Tiệt Trùng Vinamilk 100ml (Đơn giá niêm yết: 10.000 đ/hộp).", False, 10.5),
        ("• Hiện trạng tồn kho theo chuẩn FEFO (expiry_date ASC):", False, 10.5),
        ("   - Lô 1 (LOT-DC-MILK-001): ExpiryDate còn 2 ngày (Vùng Đỏ), tồn 3 hộp, đang kích hoạt Quick Markdown giảm giá 30% -> Đơn giá ưu đãi: 7.000 đ/hộp.", False, 10.5),
        ("   - Lô 2 (LOT-DC-MILK-002): ExpiryDate còn 45 ngày (Vùng Xanh), tồn 10 hộp, nguyên giá niêm yết (giảm 0%) -> Đơn giá: 10.000 đ/hộp.", False, 10.5),
        ("• Hệ thống tự động bẻ đơn thành 2 dòng phân bổ chi tiết trên cùng 1 hóa đơn POS:", False, 10.5),
        ("   - Dòng 1: Trừ 3 hộp từ Lô LOT-DC-MILK-001 x 7.000 đ = 21.000 đ (Tồn kho Lô 1 về 0).", False, 10.5),
        ("   - Dòng 2: Trừ 2 hộp từ Lô LOT-DC-MILK-002 x 10.000 đ = 20.000 đ (Tồn kho Lô 2 còn lại 8 hộp).", False, 10.5),
        ("• Tổng tiền hóa đơn khách trả: 41.000 đ (Khách hàng tiết kiệm được 9.000 đ nhờ chính sách xả hàng chống lãng phí).", False, 10.5),
        ("• Hạch toán cơ sở dữ liệu: Ghi nhận 2 bản ghi độc lập vào bảng sales_history đích danh theo từng batch_id (id=1 và id=2) nhằm đảm bảo số liệu doanh thu, giá vốn và định mức tồn kho khớp đúng 100% với Sổ cái tài chính.", False, 10.5),
        ("8.4 Quy trình 7 bước bán lẻ chuẩn hóa tại quầy POS", True, 12),
        ("1. Bước 1 — Kiểm tra trạng thái hoạt động cửa hàng (Store Profile Guard): Hệ thống kiểm tra StoreProfile.status == 'OPEN'. Nếu cửa hàng ở trạng thái CLOSED (đóng cửa đêm), INVENTORY (tạm dừng kiểm kê) hoặc SUSPENDED (tạm ngừng), nút thanh toán bị khóa cứng và hiển thị cảnh báo từ chối thanh toán.", False, 10.5),
        ("2. Bước 2 — Quét Barcode SKU / Thêm sản phẩm vào giỏ hàng: Thu ngân sử dụng đầu đọc Barcode USB hoặc camera thiết bị quét mã vạch sản phẩm. Hệ thống kiểm tra tính khả dụng (is_active = 1) và thêm sản phẩm vào giỏ hàng.", False, 10.5),
        ("3. Bước 3 — Hiển thị FEFO Preview thời gian thực: Trên từng dòng sản phẩm của giỏ hàng, hệ thống trực quan hóa chi tiết các lô hàng sẽ bị xuất kho, số ngày còn lại (DaysLeft), mức chiết khấu Quick Markdown và giá tiền dự kiến để thu ngân và khách hàng cùng đối soát.", False, 10.5),
        ("4. Bước 4 — Thu thập Ngữ cảnh Bán hàng (AI Context Inputs): Thu ngân chọn cờ Thời tiết (SUNNY, RAINY, NORMAL) và Ngày lễ (is_holiday = 0 / 1). Đây là nguồn dữ liệu bắt buộc phục vụ huấn luyện mô hình dự báo nhu cầu tiêu thụ AI 1 (Demand Forecasting).", False, 10.5),
        ("5. Bước 5 — Mở Transaction SQL Server & Khóa dòng Concurrency (Rule 3): Khi thu ngân bấm 'Thanh toán & Xuất kho FEFO', Backend mở SQL Transaction nguyên khối có khóa dòng WITH (UPDLOCK, ROWLOCK) trên từng bản ghi lô hàng liên quan.", False, 10.5),
        ("6. Bước 6 — Khấu trừ Tồn kho & Kiểm tra Ràng buộc Âm kho: Trừ current_quantity tương ứng với từng dòng lô đã bẻ. Nếu có bất kỳ vi phạm nào (current_quantity < 0 hoặc bị quầy POS khác tranh chấp), hệ thống lập tức ROLLBACK Transaction và thông báo lỗi.", False, 10.5),
        ("7. Bước 7 — Lưu Lịch sử Bán lẻ, Xuất Hóa đơn & Ghi AuditLog (Rule 11): Chèn các bản ghi vào sales_history, tạo mã hóa đơn TXN-POS-[YYYYMMDD]-[RANDOM], ghi nhật ký kiểm toán POS_CHECKOUT_FEFO và xuất biên lai in nhiệt K80 chi tiết cho khách hàng.", False, 10.5),
        ("8.5 Dữ liệu ngữ cảnh bán hàng phục vụ AI Dự báo Sức mua (AI 1 - Demand Forecasting)", True, 12),
        ("Mỗi giao dịch bán lẻ tại quầy POS không chỉ là hành động thương mại đơn thuần mà còn là trạm thu thập dữ liệu huấn luyện cho trí tuệ nhân tạo (tham chiếu tài liệu SmartSupply AI — Định hướng dự án & Triển khai hệ thống):", False, 11),
        ("• Yếu tố Thời tiết (weather): Nắng nóng (SUNNY) làm tăng vọt sức mua nước giải khát, kem, sữa chua; Mưa gió ngập lụt (RAINY) làm giảm lượng khách trực tiếp nhưng tăng nhu cầu tích trữ thực phẩm khô, mì gói, bánh mì.", False, 10.5),
        ("• Yếu tố Ngày lễ / Cuối tuần (is_holiday): Ngày nghỉ lễ và cuối tuần có sức mua tăng từ 30% - 70% so với ngày thường trong tuần.", False, 10.5),
        ("• Yếu tố Thứ trong tuần (day_of_week): Lưu trữ từ MONDAY đến SUNDAY để bắt trọn chu kỳ mua sắm định kỳ theo tuần.", False, 10.5),
        ("• Yếu tố Giảm giá xả hàng (discount_percent): Ghi nhận độ nhạy cảm của khách hàng đối với các mức giảm giá Quick Markdown 15%, 30%, 40%, 50%.", False, 10.5),
        ("8.6 Bảy (7) Điều kiện biên bắt buộc khi xuất bán POS & Kiểm soát tranh chấp (Validation Boundaries)", True, 12),
        ("Giao dịch xuất bán lẻ tại quầy POS chỉ được phép hoàn tất khi thỏa mãn đồng thời 7 điều kiện biên:", False, 11),
        ("1. StoreProfile.status == 'OPEN' (Cửa hàng đang trong ca mở cửa phục vụ).", False, 10.5),
        ("2. products.is_active == 1 (Sản phẩm đang lưu hành hợp lệ, không bị ngừng kinh doanh).", False, 10.5),
        ("3. quantity_sold > 0 (Số lượng mua là số nguyên dương).", False, 10.5),
        ("4. DaysLeft > 0 và status IN ('ACTIVE', 'WARNING') (Lô hàng xuất bán bắt buộc chưa quá hạn; Expiry Watchdog tự động khóa các lô quá hạn trước khi phân bổ).", False, 10.5),
        ("5. SUM(current_quantity) >= quantity_sold (Tổng tồn kho khả dụng còn hạn của sản phẩm đủ đáp ứng nhu cầu).", False, 10.5),
        ("6. Tuyệt đối không cho phép tồn kho âm (current_quantity >= 0 được bảo vệ bằng CHECK constraint và logic Domain).", False, 10.5),
        ("7. Giao dịch thực thi an toàn trong SQL Server Transaction có khóa dòng WITH (UPDLOCK, ROWLOCK).", False, 10.5),
        ("8.7 Ma trận Phân định Trách nhiệm (SoD Matrix 4 Actor) tại Quầy POS", True, 12),
        ("Bảng phân quyền 4 vai trò tham chiếu từ tài liệu định hướng SmartSupply AI — Phân tích nghiệp vụ 3 Actor:", False, 11),
        ("• Quét Barcode SKU & Thêm giỏ hàng POS: CASHIER (Tác nghiệp chính), WAREHOUSE_STAFF, STORE_MANAGER, ADMIN (Cho phép).", False, 10.5),
        ("• Can thiệp chọn lô xuất kho thủ công: TUYỆT ĐỐI CẤM với tất cả các vai trò (CASHIER, WAREHOUSE_STAFF, STORE_MANAGER, ADMIN).", False, 10.5),
        ("• Chọn cờ ngữ cảnh Thời tiết & Ngày lễ: CASHIER (Thực hiện chính), WAREHOUSE_STAFF, STORE_MANAGER, ADMIN (Cho phép).", False, 10.5),
        ("• Thu tiền mặt, tính tiền thối, thanh toán POS: CASHIER (Tác nghiệp chính), WAREHOUSE_STAFF, STORE_MANAGER, ADMIN (Cho phép).", False, 10.5),
        ("• In lại hóa đơn lịch sử bán lẻ (reprint): Mọi vai trò có quyền xem hóa đơn đều được in lại.", False, 10.5),
        ("• Hủy hóa đơn đã thanh toán hoàn tất: CASHIER và WAREHOUSE_STAFF bị chặn; STORE_MANAGER cần duyệt lý do; ADMIN có toàn quyền.", False, 10.5),
        ("• Xem lịch sử bán lẻ & Doanh số trong ca: CASHIER (Xem ca trực), WAREHOUSE_STAFF (Xem phục vụ kho), STORE_MANAGER (Xem toàn cửa hàng), ADMIN (Toàn quyền).", False, 10.5),
        ("8.8 Quy chuẩn Biên lai Hóa đơn In nhiệt K80/K57 (Thermal Receipt Standards)", True, 12),
        ("Hệ thống hỗ trợ xuất biên lai in nhiệt tiêu chuẩn K80 (80mm) và K57 (57mm), gồm 4 phần:", False, 11),
        ("1. Phần Đầu (Header): Tên thương hiệu ('Cửa hàng Bán lẻ Tiện lợi LHU Mart'), Mã cửa hàng (RETAIL-STORE-01), Địa chỉ (Số 10 Huỳnh Văn Nghệ, Biên Hòa), Số điện thoại hotline, Mã hóa đơn (TXN-POS-[YYYYMMDD]-[XXXX]), Thời gian in (giờ:phút:giây ngày/tháng/năm), Tên thu ngân phụ trách ca.", False, 10.5),
        ("2. Ngữ cảnh Giao dịch: Thời tiết (Nắng ráo / Mưa / Ôn hòa), Cờ sự kiện (Ngày thường / Ngày lễ tết).", False, 10.5),
        ("3. Bảng Phân bổ FEFO Chi tiết: Tên sản phẩm, Số lượng tổng; Danh sách chi tiết từng lô đã bẻ (Mã lô batch_code, HSD, Số lượng trừ, Đơn giá gốc, % Giảm giá Quick Markdown, Thành tiền dòng).", False, 10.5),
        ("4. Phần Đuôi (Footer): Tổng tiền thanh toán (VNĐ), Tiền khách đưa, Tiền thừa trả khách, Lời cảm ơn ('LHU Mart chân thành cảm ơn Quý khách! Chung tay chống lãng phí thực phẩm'), Mã vạch Barcode hóa đơn dùng tra cứu đối soát khi khách đổi trả.", False, 10.5)
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
    print(f"Successfully updated Section 8 in {doc_path} with {len(new_paragraphs)} rich paragraphs!")

if __name__ == '__main__':
    update_docx_section_8()

