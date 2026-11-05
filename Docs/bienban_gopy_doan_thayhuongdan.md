# BIÊN BẢN GHI NHẬN Ý KIẾN & KẾ HOẠCH KHẮC PHỤC ĐỒ ÁN
*(Dựa trên buổi trao đổi trực tiếp với Thầy hướng dẫn)*

---

## 1. Giao diện & Trình bày Báo cáo (Slide / Demo)
* **Vấn đề:** Giao diện / slide hiện đang dùng tông màu tối.
* **Yêu cầu khắc phục:** 
  * Chuyển toàn bộ sang **tông màu sáng**.
  * **Lý do:** Khi trình chiếu hoặc thầy cô ngồi phía dưới nhìn lên màn chiếu sẽ rất khó quan sát nếu dùng tông tối.

---

## 2. Làm rõ Bài toán, Đối tượng & Phân quyền (Roles / Actors)
* **Xác định rõ đối tượng bài toán:**
  * Khách hàng mục tiêu là chuỗi cửa hàng (chuỗi $3 - 30$ chi nhánh).
  * Cần hình dung luồng hoạt động từ tổng quan đến chi tiết: nếu một cửa hàng đơn lẻ dùng thì sao, chuỗi nhiều cửa hàng dùng thì quản lý thế nào.
* **Rà soát lại danh sách Actor (Vai trò):**
  * Cần chốt rõ hệ thống có bao nhiêu vai trò chính, ví dụ:
    1. **Chủ hệ thống / Admin cấp cao:** Quản lý toàn bộ hệ sinh thái, phân quyền, khóa tài khoản, xem báo cáo tổng.
    2. **Quản lý cửa hàng (Store Manager):** Quản trị tại từng chi nhánh cụ thể.
    3. **Nhân viên:** Đơn giản hóa, có thể gộp nhân viên thu ngân và nhân viên bán lẻ/order thành một nhóm vai trò để tránh rườm rà.
* **Nghiên cứu nghiệp vụ thực tế (Supply Chain):**
  * Không học vẹt theo lý thuyết hay định nghĩa chung chung trên mạng.
  * Nghiên cứu xem thực tế ngoài doanh nghiệp người ta quản lý chuỗi cung ứng, xuất-nhập-tồn, doanh thu và vận hành thế nào để đưa vào hệ thống cho sát thực tế.

---

## 3. Danh sách Chức năng & Phân tích Nghiệp vụ
* Đọc lại toàn bộ danh sách chức năng tổng quan đã liệt kê.
* **Nhiệm vụ:** Viết **User Story** chi tiết cho từng chức năng:
  * Ai là người dùng chức năng đó?
  * Thao tác cái gì?
  * Mục đích / kết quả đạt được là gì?

---

## 4. Triển khai Phân hệ Trí tuệ Nhân tạo (AI)
* **Công nghệ mục tiêu:** Bám sát file mô tả công nghệ AI mà thầy đã gửi, nghiên cứu đúng 2 công nghệ/mô hình được chỉ định.
* **Quy trình triển khai từng bước (Tránh làm ngược):**
  1. **Bước 1 (Lấy mô hình có sẵn):** Tải pre-trained model và tập dữ liệu (dataset) chuẩn đi kèm của mô hình đó về trước.
  2. **Bước 2 (Tích hợp & Test nhanh):** Dùng luôn dữ liệu mẫu/sản phẩm có sẵn trong dataset để nhúng lên web/API kiểm tra xem mô hình dự đoán có ra kết quả đúng không.
  3. **Bước 3 (Thu thập & Re-train sau):** Không cắm đầu tự đi thu thập hay tự train model mới ngay từ đầu. Việc tinh chỉnh (fine-tune) hoặc train lại với bộ dữ liệu riêng của đồ án sẽ làm ở các bước sau khi khung kết nối đã chạy ổn định.

---

## 5. Kế hoạch & Phân công Công việc trong Tuần tới

| STT | Hạng mục công việc | Chi tiết thực hiện | Phân công dự kiến | Deadline |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Chốt Actor & User Story | Liệt kê toàn bộ Actor; viết User Story cho từng chức năng; làm rõ Actor quản lý cái gì. | Thành viên 1 | Báo cáo tuần sau |
| **2** | Nghiên cứu & Thử nghiệm AI | Đọc tài liệu 2 công nghệ AI chỉ định; tải model có sẵn và test thử nghiệm tích hợp. | Thành viên 2 | Báo cáo tuần sau |
| **3** | Chuẩn bị Báo cáo / Slide | Cập nhật slide/tài liệu sang tông sáng, rà soát lại bố cục trình bày theo góp ý của thầy. | Cả nhóm | Báo cáo tuần sau |