# HƯỚNG DẪN LẤY CƠ SỞ DỮ LIỆU VỀ MÁY (DÀNH CHO ĐỒNG ĐỘI)

Chào Quân (hoặc thành viên trong nhóm), để đưa toàn bộ Cơ sở dữ liệu `retail_spoilage_db` (12 bảng, Triggers FEFO, Views, Seed Data) vào **SQL Server Management Studio (SSMS)** trên máy của bạn, bạn có 2 cách cực kỳ nhanh:

---

## CÁCH 1: MỞ TRỰC TIẾP TRONG SSMS (Khuyên dùng - Mất 10 giây)

1. Bạn tải/clone code từ GitHub về máy.
2. Mở phần mềm **SQL Server Management Studio (SSMS)** lên $\rightarrow$ Kết nối vào Server máy bạn (ví dụ: `(localdb)\mssqllocaldb` hoặc `.\SQLEXPRESS` hoặc `.` hoặc `localhost`).
3. Trong SSMS, bấm tổ hợp phím **`Ctrl + O`** (hoặc chọn menu `File` $\rightarrow$ `Open` $\rightarrow$ `File...`).
4. Tìm và chọn file:
   ```text
   Database/retail_spoilage_database.sql
   ```
5. Nhấn phím **`F5`** (hoặc nút **Execute** màu xanh trên thanh công cụ).
6. **Xong!** Nhìn sang cây thư mục bên trái (Object Explorer), chuột phải vào mục `Databases` $\rightarrow$ chọn **Refresh**, bạn sẽ thấy ngay database **`retail_spoilage_db`** đã xuất hiện với đầy đủ 12 bảng và dữ liệu mẫu!

---

## CÁCH 2: NHẤP ĐÚP CHUỘT 1-CLICK (Tự động 100%)

1. Vào thư mục `Database/`.
2. Nhấp đúp chuột vào file:
   ```text
   Database/setup_database.bat
   ```
3. Hệ thống sẽ tự động dùng lệnh `sqlcmd` nạp toàn bộ cấu trúc và dữ liệu vào SQL Server trên máy bạn.

---

## NẾU BẠN HỎI VỀ: "FILE ĐỂ KẾT NỐI VÀO SQL"

- Trong các dự án phần mềm, để ứng dụng Web / Backend kết nối được vào SQL Server của từng máy, người ta dùng file cấu hình môi trường **`.env`**.
- File `.env` mẫu nằm ở thư mục `Backend/.env.example` hoặc `Backend/.env`:
  ```env
  PORT=5000
  DB_SERVER=(localdb)\mssqllocaldb
  DB_NAME=retail_spoilage_db
  DB_USER=sa
  DB_PASSWORD=your_password
  ```
  *(Khi ai kéo code về máy mình, người đó chỉ cần sửa `DB_SERVER` theo đúng tên SQL Server trên máy người đó là Backend tự chạy mượt mà!)*
