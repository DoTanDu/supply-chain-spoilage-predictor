# AGENTS.MD - HƯỚNG DẪN DÀNH CHO AI AGENT TRONG DỰ ÁN

## 1. TÀI LIỆU NGUỒN CHUẨN MỰC (SINGLE SOURCE OF TRUTH - SSOT)
* **Đặc tả hệ thống cốt lõi:** [Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md](file:///c:/thuyet%20minh/Docs/Dac%20Ta%20He%20Thong%20Quan%20Ly%20Chuoi%20Cung%20Ung%20Chong%20Lang%20Phi%20-%20Supply%20Chain%20Spoilage%20Predictor.md)
* **Nguyên tắc định hướng:** Toàn bộ kiến trúc, cơ sở dữ liệu, API, dịch vụ domain, giao diện POS & Dashboard, quy tắc nghiệp vụ của dự án **BẮT BUỘC XOAY QUANH VÀ TUÂN THỦ TẬP TIN ĐẶC TẢ NÀY**. Bất kỳ tính năng hoặc mã nguồn cũ nào chưa khớp sẽ được sửa đổi và chuẩn hóa dần dần theo đúng tài liệu này.

---

## 2. Bối cảnh & Phạm vi Dự án (Project Scope)
* **Tên đề tài:** Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor).
* **Đơn vị:** Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU).
* **GVHD:** ThS. Lê Minh Nhật.
* **Nhóm sinh viên thực hiện:** Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946).
* **Mô hình bắt buộc:** Cửa hàng Bán lẻ tinh gọn duy nhất (Retail Store - LHU Mart) liên kết với Trung tâm Phân phối Kho tổng (DC Biên Hòa):
  * Cửa hàng nhận hàng theo đợt từ DC (kiểm soát nghiêm ngặt RSL >= 70%).
  * Quản lý vòng đời hạn sử dụng từng lô (Shelf-Life) và cảnh báo 3 cấp màu (Xanh / Vàng / Đỏ).
  * Bán lẻ tại quầy POS theo nguyên tắc **FEFO (First Expired, First Out)**. Bán hàng = Xuất kho trực tiếp, tự động bẻ lô.
  * Giảm giá xả hàng Quick Markdown (15%, 30%, 40%, 50%) và SOP đảo lô mặt tiền kệ trưng bày.
  * Tiêu hủy hàng hư hỏng/quá date gắn liền Sổ hao hụt tài chính bất biến.
  * Dự báo nhu cầu tiêu thụ ROP dựa trên tốc độ bán 14 ngày + thời tiết + ngày lễ để đề xuất đơn đặt hàng gửi DC.
  * *Tuyệt đối không phát triển luân chuyển ngang giữa các shop hoặc thủ tục hoàn trả nhà cung cấp phức tạp.*

---

## 3. Quy chuẩn 11 Quy tắc Nghiệp vụ Cốt lõi (11 Core Business Rules)
1. **Rule 1 - Một cửa hàng duy nhất:** Bảng `StoreProfile` chỉ có 1 bản ghi duy nhất (`RETAIL-STORE-01`), mọi giao dịch tự động gắn với cửa hàng này.
2. **Rule 2 - FEFO tuyệt đối:** Bán lẻ POS tự động chọn các lô có `expiry_date ASC` ra xuất trước; tự động bẻ đơn qua nhiều lô nếu cần.
3. **Rule 3 - Chống tồn kho âm:** `current_quantity >= 0` tại mọi thời điểm, bảo vệ bằng ràng buộc CHECK và Transaction có khóa `UPDLOCK, ROWLOCK`.
4. **Rule 4 - Cảnh báo 3 cấp màu:**
   * **Vùng Xanh (An toàn):** `DaysLeft > WarningDays` (Bán nguyên giá).
   * **Vùng Vàng (Cảnh báo):** `3 < DaysLeft <= WarningDays` (Giảm 15%-30%, đảo kệ mặt tiền).
   * **Vùng Đỏ (Nguy kịch):** `0 < DaysLeft <= 3` (Giảm kịch sàn 40%-50%, gom xả trong ngày).
5. **Rule 5 - Khóa cứng hàng hết hạn:** `DaysLeft <= 0` tự động chuyển sang `EXPIRED`, cấm xuất bán POS tuyệt đối.
6. **Rule 6 - Sổ hao hụt tài chính:** Hủy hàng bắt buộc tính `CostLoss = QuantityDisposed * ImportPrice`, lưu bảng `SpoilageRecords`.
7. **Rule 7 - Tiêu chuẩn nhận hàng DC:** Xe tải DC giao đến phải có `RSL_inbound >= 70%`, nếu nhỏ hơn hệ thống khóa lưu và từ chối nhận.
8. **Rule 8 - Dự báo ROP tích hợp ngoại cảnh:** `ROP = (d_adjusted * LeadTime) + SafetyStock`, có hệ số thời tiết (W_factor), ngày lễ (H_factor) và cảnh báo nguy cơ ứ đọng `DOS > DUE`.
9. **Rule 9 - Chống trùng lặp sản phẩm:** Thuật toán chuẩn hóa chuỗi và chặn trùng SKU / tên tương đồng >= 85%.
10. **Rule 10 - Xả hàng & Đảo kệ mặt tiền:** Quick Markdown có hiệu lực tức thì ở POS; quy trình đảo kệ 5 bước có xác nhận điện tử.
11. **Rule 11 - Nhật ký kiểm toán bất biến:** Toàn bộ nghiệp vụ xuất, nhập, đổi giá, đảo kệ, hủy hàng, phân quyền đều ghi vào `AuditLogs`.

---

## 4. Kiến trúc & Kỹ thuật Chuẩn mực (Technical Guidelines)
* **Kiến trúc:** Clean Architecture 4 tầng (Domain -> Application -> Infrastructure -> Presentation).
* **Cơ sở dữ liệu:** Microsoft SQL Server LocalDB `(localdb)\mssqllocaldb`, database `retail_spoilage_db`.
  * Gồm 13 bảng chuẩn 3NF: `Users`, `Roles`, `StoreProfile`, `Suppliers`, `Categories`, `Products`, `Batches`, `SalesHistory`, `SpoilageRecords`, `PurchaseOrders`, `PurchaseOrderItems`, `GoodsReceipts`, `AuditLogs`.
  * Dùng index tối ưu: `IX_Batches_FEFO`, `IX_Batches_ExpiryWatchdog`, `IX_Products_Sku`, `IX_SalesHistory_Product_Date`, `IX_SpoilageRecords_Batch`.
  * Toàn bộ chuỗi tiếng Việt phải dùng `N'...'` và mã hóa `utf-8-sig`.
* **Giao diện Frontend:** Rich Aesthetics, Dark mode, Dashboard 6 chỉ số KPI tài chính, Action Board ca trực khẩn cấp, Responsive.
* **Chiến lược phát triển:** Nếu mã nguồn hiện tại có điểm sai lệch so với đặc tả, giữ vững tính ổn định của hệ thống và refactor/sửa đổi tuần tự từng module để đạt sự đồng nhất hoàn toàn với đặc tả.
