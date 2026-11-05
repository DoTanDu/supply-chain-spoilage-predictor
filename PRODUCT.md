# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary Users:**
  - **Nhân viên thu ngân (Cashier POS):** Thao tác tại quầy bán lẻ ca trực, tìm kiếm sản phẩm và quét mã siêu tốc (< 1s), hệ thống tự động bẻ lô và trừ kho theo nguyên tắc FEFO (First Expired, First Out) mà không cần can thiệp thủ công.
  - **Quản lý cửa hàng (Store Manager):** Giám sát thời gian thực trên Action Board ca trực khẩn cấp, theo dõi cảnh báo hạn sử dụng 3 cấp màu (Xanh/Vàng/Đỏ), quyết định kích hoạt xả hàng nhanh (Quick Markdown 15%-50%), phê duyệt tiêu hủy và duyệt đơn ROP gửi Trung tâm Phân phối (DC).
- **Secondary Users:**
  - **Thủ kho (Warehouse Staff):** Kiểm soát nghiêm ngặt xe tải giao từ DC Biên Hòa với điều kiện RSL >= 70%, lập phiếu nhập kho.
  - **Kế toán (Financial Auditor):** Kiểm toán sổ hao hụt tài chính bất biến (Spoilage Records), đối soát doanh thu, giá vốn và chi phí tiêu hủy.

## Product Purpose

Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor) dành cho mô hình Cửa hàng Bán lẻ tinh gọn duy nhất (LHU Mart) kết nối Trung tâm Phân phối Kho tổng (DC Biên Hòa). Mục đích cốt lõi là triệt tiêu lãng phí thực phẩm và hàng cận date thông qua quản trị vòng đời hạn sử dụng từng lô (Shelf-Life), xuất bán tự động theo FEFO, xả hàng kịp thời và dự báo điểm đặt hàng lại (ROP) chuẩn xác.

## Positioning

Hệ thống bán lẻ & kho vận chuyên biệt đầu tiên kết hợp chặt chẽ giữa:
1. Thuật toán trừ kho FEFO tự động bẻ lô tại thời điểm bán POS,
2. Cơ chế cảnh báo sớm 3 cấp màu theo Shelf-Life còn lại,
3. Tiêu hủy gắn liền Sổ hao hụt tài chính bất biến tính theo giá vốn nhập,
4. Dự báo ROP tích hợp ngoại cảnh (thời tiết, ngày lễ) và cảnh báo nguy cơ ứ đọng (DOS > DUE) trước khi đặt hàng mới.

## Operating Context

- **Môi trường:** Quầy thu ngân bán lẻ màn hình cảm ứng / máy tính để bàn (POS) và bàn làm việc quản lý cửa hàng (Dashboard, Action Board).
- **Nhịp độ làm việc:** Thao tác liên tục theo ca trực, cần tốc độ thao tác bán hàng < 1 giây tại quầy POS, khả năng nhận diện ngay các lô cận hạn để hướng dẫn nhân viên đảo hàng mặt tiền kệ trưng bày.

## Capabilities and Constraints

- **Tuân thủ 11 Quy tắc Nghiệp vụ cốt lõi (11 Core Business Rules):**
  - Rule 1: Một cửa hàng duy nhất (`StoreProfile` có ID `RETAIL-STORE-01`).
  - Rule 2: FEFO tuyệt đối tại POS, tự động bẻ đơn qua nhiều lô nếu cần.
  - Rule 3: Chống tồn kho âm (`current_quantity >= 0`), bảo vệ bằng ràng buộc CHECK và khóa giao dịch `UPDLOCK, ROWLOCK`.
  - Rule 4: Cảnh báo 3 cấp màu (Xanh: `DaysLeft > WarningDays`, Vàng: `3 < DaysLeft <= WarningDays`, Đỏ: `0 < DaysLeft <= 3`).
  - Rule 5: Khóa cứng hàng hết hạn (`DaysLeft <= 0` chuyển sang `EXPIRED`, cấm xuất bán POS).
  - Rule 6: Sổ hao hụt tài chính bắt buộc tính `CostLoss = QuantityDisposed * ImportPrice`.
  - Rule 7: Tiêu chuẩn nhận hàng DC: Xe tải DC giao đến phải có `RSL_inbound >= 70%`.
  - Rule 8: Dự báo ROP tích hợp ngoại cảnh: `ROP = (d_adjusted * LeadTime) + SafetyStock`, cảnh báo `DOS > DUE`.
  - Rule 9: Chống trùng lặp sản phẩm (chuẩn hóa chuỗi và chặn trùng SKU / tên tương đồng >= 85%).
  - Rule 10: Xả hàng Quick Markdown có hiệu lực tức thì ở POS; quy trình đảo kệ 5 bước.
  - Rule 11: Nhật ký kiểm toán bất biến ghi vào `AuditLogs`.
- **Ràng buộc công nghệ:** Kiến trúc Clean Architecture 4 tầng, Backend Node.js Express, Frontend React (Vite), CSDL Microsoft SQL Server LocalDB (`retail_spoilage_db`).

## Brand Commitments

- **Tên nền tảng:** Supply Chain Spoilage Predictor (Quản trị Chuỗi Cung ứng Chống Lãng phí).
- **Đơn vị phát triển:** Trường Đại học Lạc Hồng (LHU) - Nhóm Đỗ Tấn Du & Đoàn Minh Quân.
- **Phong cách thị giác (Design Language):** Chuẩn Impeccable Operate Mode. Không dùng AI cliches, không gradient text, không emoji/unicode glyphs rẻ tiền thay icon, không hào quang phát sáng (zero-offset glow), độ tương phản cao, tập trung dữ liệu chính xác, chuyên nghiệp.

## Evidence on Hand

- Đặc tả hệ thống chuẩn mực SSOT tại `Docs/Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md`.
- Hướng dẫn nguyên tắc AI Agent tại `AGENTS.md`.
- CSDL SQL Server 13 bảng chuẩn 3NF đã triển khai với đầy đủ dữ liệu mẫu thực tế.

## Product Principles

1. **Dữ liệu là sự thật duy nhất (Zero Inventory Hallucination):** Tồn kho và số lô phải khớp tuyệt đối theo thời gian thực; không bao giờ âm kho.
2. **Hành động đón đầu trước khi quá hạn (Proactive Markdown over Spoilage):** Ưu tiên phát hiện lô vùng Vàng/Đỏ để đảo kệ và kích hoạt giảm giá trước khi hàng trở thành rác thải tiêu hủy.
3. **Thao tác không độ trễ tại quầy bán lẻ (Sub-second POS Frictionless):** Bán hàng tại quầy phải nhanh gọn, tự động tính giá khuyến mãi và trừ lô theo FEFO mà nhân viên không phải suy nghĩ chọn lô.
4. **Minh bạch tài chính & Bất biến kiểm toán (Immutable Financial Audit):** Mọi thất thoát, tiêu hủy, điều chỉnh giá đều lưu lại vết tích kiểm toán kèm giá vốn thiệt hại thực tế.

## Accessibility & Inclusion

- Chuẩn WCAG 2.1 AA về độ tương phản văn bản trên nền tối (`#0b0f17` và cards `#131c2e`).
- Trực quan hóa màu sắc kết hợp nhãn trạng thái văn bản rõ ràng (không chỉ dựa vào màu sắc mà có chữ "An toàn", "Cảnh báo", "Khẩn cấp").
