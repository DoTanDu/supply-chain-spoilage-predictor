# AGENTS.MD - HƯỚNG DẪN DÀNH CHO AI AGENT TRONG DỰ ÁN

## 1. Bối cảnh & Phạm vi Dự án (Project Scope)
* **Tên đề tài:** Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor).
* **Đơn vị:** Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU).
* **GVHD:** ThS. Lê Minh Nhật.
* **Nhóm sinh viên thực hiện:** Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946).
* **Phạm vi bắt buộc:** Mô hình Cửa hàng Bán lẻ tinh gọn (Retail Store):
  * Cửa hàng nhận hàng theo đợt từ Kho tổng (DC).
  * Kiểm soát hạn sử dụng từng lô (Shelf-Life) và cảnh báo cận date đa cấp.
  * Bán hàng lẻ ra cho người tiêu dùng theo nguyên tắc **FEFO (First Expired, First Out)**. Bán hàng = Xuất kho.
  * Tiêu hủy hàng hư hỏng/quá date và ghi nhận sổ hao hụt tài chính.
  * Dự báo nhu cầu tiêu thụ dựa trên tốc độ bán + thời tiết + ngày lễ để đề xuất đơn nhập hàng mới gửi về Kho tổng DC.
  * *Tuyệt đối không phát triển luân chuyển ngang giữa các shop hoặc thủ tục hoàn trả nhà cung cấp phức tạp.*

## 2. Quy chuẩn Kỹ thuật (Technical Guidelines)
* **Cơ sở dữ liệu:** Microsoft SQL Server LocalDB `(localdb)\mssqllocaldb`, database `retail_spoilage_db`. Toàn bộ chuỗi tiếng Việt phải dùng `N'...'` và mã hóa `utf-8-sig`.
* **Giao diện Frontend:** Thiết kế hiện đại, cao cấp (Rich Aesthetics), hỗ trợ Dark mode, bảng biểu tương tác, thẻ cảnh báo màu sắc rõ ràng (Xanh/Vàng/Đỏ), Responsive.
* **Quy chuẩn mã nguồn:**
  * Clean Architecture, phân tầng rõ ràng (Controller -> Service -> Repository).
  * Không bao giờ để xảy ra lỗi tồn kho âm.
  * Xử lý ngoại lệ toàn diện, trả về thông báo lỗi tiếng Việt dễ hiểu.
