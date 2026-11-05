# -*- coding: utf-8 -*-
import os
import shutil
import docx
from docx.shared import Pt, RGBColor

def update_docx_section_10():
    doc_path = 'c:/thuyet minh/Docs/Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx'
    bak_path = 'c:/thuyet minh/Docs/Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx.bak_sec10'
    
    # 1. Sao lưu file an toàn trước khi chỉnh sửa
    shutil.copyfile(doc_path, bak_path)
    print(f"Safety backup created at: {bak_path}")

    doc = docx.Document(doc_path)

    start_idx = None
    end_idx = None

    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if '10. Điều kiện kiểm tra' in txt:
            start_idx = i
        elif '11. Dashboard hệ thống' in txt:
            end_idx = i
            break

    if start_idx is None or end_idx is None:
        raise ValueError(f"Could not locate Section 10 or Section 11 boundaries: start={start_idx}, end={end_idx}")

    print(f"Located Section 10 at P{start_idx} to P{end_idx-1} (Total: {end_idx - start_idx} paragraphs to replace)")

    # Danh sách các đoạn văn bản mới chi tiết chuẩn mực kỹ thuật cho Mục 10
    new_paragraphs = [
        ("10. Điều kiện kiểm tra khi bán hàng & Xuất kho (Sales & Inventory Dispatch Validation Boundaries)", True, 13),
        ("Giao dịch bán lẻ tại quầy POS và xuất kho trực tiếp là điểm chạm tài chính tối quan trọng. Nhằm đảm bảo dữ liệu bán lẻ, mức tồn kho và giá vốn luôn chính xác 100%, hệ thống thiết lập cơ chế kiểm soát phòng thủ chiều sâu 3 tầng (3-Tier Defense-in-Depth Architecture) gồm 7 điều kiện biên bắt buộc và danh mục mã lỗi kỹ thuật chuẩn hóa.", False, 11),
        
        ("10.1 Kiến trúc Phòng thủ Chiều sâu 3 Tầng (3-Tier Defense-in-Depth Model)", True, 12),
        ("Hệ thống bảo vệ toàn vẹn giao dịch và tồn kho qua 3 lớp phòng thủ liên hoàn:", False, 11),
        ("• Tầng 1 — Presentation / Frontend Guard: Xác thực giỏ hàng POS thời gian thực (giỏ không rỗng, quantity > 0); Store Profile Guard vô hiệu hóa nút thanh toán F9 khi StoreProfile.status != 'OPEN'; khóa cứng chọn lô thủ công, thu ngân chỉ quét Barcode SKU để FEFO tự động bẻ lô.", False, 10.5),
        ("• Tầng 2 — Application & Domain Business Guard: Store Operational Status Guard kiểm tra StoreProfile.status == 'OPEN' (ném ERR_STORE_CLOSED / ERR_STORE_INVENTORY); Product Lifecycle Guard kiểm tra products.is_active == 1 (ném ERR_PRODUCT_INACTIVE); Expiry Watchdog Pre-filter loại bỏ toàn bộ lô DaysLeft <= 0 (Rule 5); FefoAllocationPolicy kiểm tra SUM(current_quantity) >= requestedQuantity (ném ERR_INSUFFICIENT_STOCK).", False, 10.5),
        ("• Tầng 3 — Database & Concurrency Lock Guard (SQL Server LocalDB): Mở SQL Transaction nguyên khối; áp dụng gợi ý khóa dòng WITH (UPDLOCK, ROWLOCK) trên từng lô hàng; Invariant Zero-Negative Check cập nhật có điều kiện UPDATE batches WHERE current_quantity >= @qty (nếu @@ROWCOUNT = 0 lập tức THROW 50001); DDL CHECK Constraint CK_batches_quantity CHECK (current_quantity >= 0); Ghi sales_history + system_audit_logs bất biến trước khi COMMIT TRANSACTION.", False, 10.5),
        
        ("10.2 Chi tiết Bảy (7) Điều kiện Biên Bắt buộc Khi Bán hàng & Xuất kho", True, 12),
        ("1. Điều kiện 1 — Trạng thái Hoạt động của Cửa hàng (Store Operational Status Guard - Rule 1 SSOT): Cửa hàng chỉ được phép bán lẻ khi StoreProfile.status === 'OPEN'. Nếu cửa hàng ở trạng thái CLOSED (Đóng ca đêm), INVENTORY (Kiểm kê kho định kỳ) hoặc SUSPENDED (Tạm đình chỉ), hệ thống lập tức từ chối xuất bán, ném mã lỗi HTTP 400 ERR_STORE_CLOSED hoặc ERR_STORE_INVENTORY; nút bấm Thanh toán POS trên Frontend bị mờ và hiển thị thông điệp cảnh báo.", False, 10.5),
        ("2. Điều kiện 2 — Trạng thái Kinh doanh của Sản phẩm (Product Active Lifecycle Guard): Sản phẩm phải đang ở trạng thái kinh doanh hợp lệ (products.is_active = 1). Nếu sản phẩm bị tạm dừng lưu hành do nhà cung cấp thu hồi chất lượng hoặc ngừng kinh doanh, máy quét Barcode và ô tìm kiếm POS từ chối nhận diện; nếu cố tình gửi request qua API, hệ thống trả về HTTP 400 ERR_PRODUCT_INACTIVE.", False, 10.5),
        ("3. Điều kiện 3 — Ràng buộc Số lượng Mua là Số nguyên Dương (Positive Integer Quantity Boundary): quantity_sold bắt buộc phải là số nguyên dương (> 0). Chặn triệt để các giá trị số lượng <= 0, số thập phân (đối với hàng FMCG tính theo gói, hộp, lon, chai), chuỗi ký tự, NaN, null, undefined; middleware xác thực dữ liệu đầu vào chặn ngay tại tầng API Presentation, ném mã lỗi HTTP 400 ERR_INVALID_QUANTITY.", False, 10.5),
        ("4. Điều kiện 4 — Khóa cứng Hàng hết hạn & Lọc trước Phân bổ (Expiry Watchdog Pre-filter - Rule 5 SSOT): Tuyệt đối không cho phép xuất bán bất kỳ sản phẩm nào thuộc lô hàng đã quá hạn sử dụng (DaysLeft <= 0). Trước khi phân bổ FEFO, truy vấn cơ sở dữ liệu và Entity ShelfLife tự động áp dụng bộ lọc nghiêm ngặt WHERE expiry_date > CAST(GETDATE() AS DATE) AND status IN ('ACTIVE', 'WARNING'); mọi lô quá hạn bị loại trừ khỏi danh sách khả dụng, chuyển sang trạng thái EXPIRED để cách ly tiêu hủy. Nếu cố tình ép mã lô hết hạn, hệ thống ném lỗi HTTP 400 ERR_BATCH_EXPIRED.", False, 10.5),
        ("5. Điều kiện 5 — Kiểm tra Tổng Tồn kho Khả dụng còn hạn (Available Stock Availability Boundary): Tổng số lượng tồn của tất cả các lô khả dụng còn hạn của sản phẩm phải lớn hơn hoặc bằng số lượng khách hàng mua. Nếu tổng tồn khả dụng không đủ đáp ứng, tầng Domain ném ngoại lệ InsufficientStockError, API trả về HTTP 400 ERR_INSUFFICIENT_STOCK; hệ thống tuyệt đối không tiến hành bẻ lô dở dang và không trừ kho bất kỳ đơn vị nào.", False, 10.5),
        ("6. Điều kiện 6 — Tuyệt đối Chống Tồn kho Âm (Zero-Negative Inventory Invariant - Rule 3 SSOT): Tồn kho hiện tại của bất kỳ lô hàng nào không bao giờ được phép nhỏ hơn 0 (current_quantity >= 0 tại mọi thời điểm). Được bảo vệ kép: Lớp 1 (Domain Policy) chỉ bẻ tối đa số lượng tồn của từng lô qtyFromBatch = min(batch.current_quantity, remainingToAllocate); Lớp 2 (SQL Constraint & Atomic Update) cập nhật có điều kiện UPDATE batches WITH (UPDLOCK, ROWLOCK) SET current_quantity = current_quantity - @qty WHERE id = @batchId AND current_quantity >= @qty (nếu @@ROWCOUNT = 0 -> THROW 50001), kết hợp CONSTRAINT CK_batches_quantity CHECK (current_quantity >= 0).", False, 10.5),
        ("7. Điều kiện 7 — Kiểm soát Tranh chấp Đồng thời & Khóa Dòng (Concurrency Lock WITH UPDLOCK, ROWLOCK): Khi có nhiều quầy POS thanh toán đồng thời cùng 1 sản phẩm tại cùng 1 thời điểm mili-giây, hoặc khi quầy POS đang bán hàng trong lúc nhân viên kho đang lập phiếu tiêu hủy cùng một lô hàng: hệ thống mở SQL Transaction có gợi ý khóa dòng WITH (UPDLOCK, ROWLOCK). Khóa cập nhật (UPDLOCK) giữ độc quyền đến khi giao dịch thứ nhất hoàn tất (COMMIT), buộc giao dịch thứ hai phải chờ. Nếu số lượng tồn kho sau giao dịch 1 không còn đủ đáp ứng cho giao dịch 2, lệnh THROW 50001 được kích hoạt và ROLLBACK TRANSACTION an toàn, tuyệt đối không gây Over-selling hay Deadlock.", False, 10.5),
        
        ("10.3 Bảng Danh mục Mã Lỗi Kỹ thuật Chuẩn hóa (Error Code Catalog)", True, 12),
        ("Hệ thống định dạng chuẩn JSON cho mọi phản hồi lỗi: { success: false, statusCode: 400, code: 'MÃ_LỖI', message: 'Thông báo kỹ thuật' }. Bảng mã lỗi chuẩn hóa gồm:", False, 11),
        ("• ERR_STORE_CLOSED (HTTP 400): Cửa hàng LHU Mart hiện đang đóng cửa [CLOSED]. Hướng xử lý: Quản lý mở ca trực qua giao diện Thiết lập cửa hàng.", False, 10.5),
        ("• ERR_STORE_INVENTORY (HTTP 400): Cửa hàng đang trong phiên kiểm kê kho [INVENTORY]. Hướng xử lý: Tạm dừng bán lẻ, đợi quản lý hoàn tất chốt biên bản kiểm kê.", False, 10.5),
        ("• ERR_PRODUCT_INACTIVE (HTTP 400): Sản phẩm hiện đang tạm ngừng lưu hành kinh doanh! Hướng xử lý: Kiểm tra danh mục sản phẩm, kích hoạt lại is_active = 1 nếu hợp lệ.", False, 10.5),
        ("• ERR_INVALID_QUANTITY (HTTP 400): Số lượng mua không hợp lệ. Phải là số nguyên dương (> 0)! Hướng xử lý: Kiểm tra lại số lượng quét từ giỏ hàng hoặc thiết bị Barcode.", False, 10.5),
        ("• ERR_BATCH_EXPIRED (HTTP 400): Lô hàng đã hết hạn sử dụng (DaysLeft <= 0). Khóa cứng bán POS! Hướng xử lý: Rút hàng khỏi kệ, chuyển sang khu cách ly và lập biên bản tiêu hủy.", False, 10.5),
        ("• ERR_INSUFFICIENT_STOCK (HTTP 400): Tồn kho khả dụng còn hạn không đủ đáp ứng số lượng yêu cầu! Hướng xử lý: Giảm số lượng bán theo tồn thực tế hoặc đặt hàng bổ sung từ DC.", False, 10.5),
        ("• ERR_CONCURRENCY_CONFLICT (HTTP 400 / 409): Tranh chấp tồn kho đồng thời giữa các quầy giao dịch! Hướng xử lý: Giao dịch tự động ROLLBACK an toàn; thu ngân quét lại giỏ hàng.", False, 10.5),
        ("• ERR_UNAUTHORIZED_ROLE (HTTP 403): Vai trò người dùng không có thẩm quyền bán lẻ xuất kho! Hướng xử lý: Chỉ vai trò CASHIER, STORE_MANAGER, ADMIN mới được thực hiện xuất bán.", False, 10.5),
        
        ("10.4 Trình tự Kiểm định 7 Bước Giao dịch Bán lẻ & Xuất kho (Validation Sequence Flow)", True, 12),
        ("Luồng kiểm soát tuần tự khi thu ngân bấm Thanh toán (F9):", False, 11),
        ("1. Bước 1: Validate đầu vào tại quầy POS (giỏ hàng có sản phẩm, số lượng nguyên dương, phương thức thanh toán hợp lệ).", False, 10.5),
        ("2. Bước 2: Xác thực danh tính JWT Bearer Token & Kiểm tra thẩm quyền vai trò (CASHIER, STORE_MANAGER, ADMIN).", False, 10.5),
        ("3. Bước 3: Truy vấn StoreProfile kiểm tra trạng thái hoạt động (bắt buộc status == 'OPEN').", False, 10.5),
        ("4. Bước 4: Lấy danh sách lô hàng khả dụng còn hạn của sản phẩm (expiry_date > GETDATE() và status IN ('ACTIVE','WARNING')).", False, 10.5),
        ("5. Bước 5: Gọi FefoAllocationPolicy phân bổ đơn hàng tự động (expiry_date ASC, id ASC); kiểm tra tổng tồn khả dụng.", False, 10.5),
        ("6. Bước 6: Mở SQL Server Transaction có khóa dòng WITH (UPDLOCK, ROWLOCK) trừ kho từng lô; ném THROW 50001 nếu phát sinh xung đột.", False, 10.5),
        ("7. Bước 7: Chèn dữ liệu sales_history kèm ngữ cảnh AI (thời tiết, ngày lễ), ghi nhật ký kiểm toán POS_CHECKOUT_FEFO, COMMIT Transaction và in biên lai nhiệt K80.", False, 10.5)
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
    print(f"Successfully updated Section 10 in DOCX: inserted {len(new_paragraphs)} detailed paragraphs.")

if __name__ == '__main__':
    update_docx_section_10()

