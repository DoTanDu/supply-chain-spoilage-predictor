---
name: sqlserver-database
description: Hướng dẫn kết nối và tương tác với Microsoft SQL Server LocalDB, cấu trúc 12 bảng chuẩn 3NF, Views, Stored Procedures và Triggers
---

# HƯỚNG DẪN CSDL MICROSOFT SQL SERVER (T-SQL)

Bộ kỹ năng này hướng dẫn Agent cách kết nối, truy vấn và duy trì Cơ sở dữ liệu chuẩn Microsoft SQL Server của dự án.

---

### 1. Thông số Kết nối Môi trường Local
* **Server Name:** `(localdb)\mssqllocaldb`
* **Database Name:** `retail_spoilage_db`
* **Authentication:** Windows Authentication (`Trusted_Connection=True; Integrated Security=SSPI;`)
* **Driver:** `ODBC Driver 17 for SQL Server` hoặc `ODBC Driver 18 for SQL Server (TrustServerCertificate=Yes)`
* **Charset:** UTF-8 (`utf-8-sig`) với tiền tố `N'...'` cho toàn bộ chuỗi Unicode tiếng Việt.

---

### 2. Cấu trúc 12 Bảng Chuẩn 3NF
1. `users`: Quản lý tài khoản đăng nhập (Admin, Store Manager, Store Staff).
2. `categories`: Danh mục ngành hàng (Thực phẩm tươi sống, Thực phẩm khô, Đồ uống...).
3. `products`: Thông tin sản phẩm, mã vạch SKU, đơn vị tính, ngưỡng tồn min/max, số ngày cảnh báo cận date.
4. `distribution_centers`: Thông tin Kho tổng (DC) cung ứng hàng hóa cho chuỗi.
5. `batches`: Lô hàng tại cửa hàng (Mã lô, ngày nhập, hạn sử dụng, số lượng tồn, giá nhập, trạng thái `ACTIVE/WARNING/EXPIRED/DISPOSED`).
6. `sales_history`: Lịch sử giao dịch bán lẻ kèm thời tiết (`SUNNY/RAINY/NORMAL`) và ngày lễ (`is_holiday`).
7. `spoilage_records`: Nhật ký hàng hư hỏng/hết hạn bị tiêu hủy, lý do và số tiền thiệt hại.
8. `reorder_suggestions`: Đề xuất đặt hàng tự động do hệ thống tính toán gửi lên Kho tổng.
9. `shelf_locations`: Quản lý vị trí trưng bày trên giá kệ tại cửa hàng.
10. `promotions`: Chương trình giảm giá kích cầu cho hàng cận date (Discount Stickers).
11. `system_configs`: Cấu hình tham số hệ thống (hệ số thời tiết, tỷ lệ an toàn SS, Lead time L).
12. `audit_logs`: Nhật ký kiểm toán mọi thao tác thay đổi dữ liệu quan trọng.

---

### 3. Các Views và Stored Procedures Sẵn Có
* **`vw_near_expiry_batches`**: View tự động quét các lô cận date (đếm lùi số ngày còn lại, phân cấp màu Xanh/Vàng/Đỏ).
* **`vw_spoilage_risk_analysis`**: View tính toán chỉ số rủi ro $DOS > DUE$ để cảnh báo nguy cơ ế hàng.
* **`vw_reorder_recommendations`**: View tự động tính ROP và đề xuất số lượng cần xin Kho tổng cấp hàng.
* **`sp_process_fefo_sale`**: Stored Procedure thực hiện trừ kho tự động theo nguyên tắc FEFO khi có giao dịch bán lẻ.
* **`trg_after_spoilage_insert`**: Trigger tự động cập nhật số lượng tồn của lô về 0 khi có bản ghi tiêu hủy được chèn vào.
