# NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG CHỐNG LÃNG PHÍ
## (Supply Chain Spoilage Predictor - Retail Management)

* **Giảng viên hướng dẫn:** ThS. Lê Minh Nhật (Email: `nhatlm@lhu.edu.vn`)
* **Nhóm sinh viên thực hiện:**
  1. **Đỗ Tấn Du** (MSSV: 123001364) - Phụ trách Phân tích yêu cầu, Thiết kế UI/UX & Lập trình Frontend, Module Import Excel.
  2. **Đoàn Minh Quân** (MSSV: 123000946) - Phụ trách Lập trình Backend, Cơ sở dữ liệu & Thuật toán Dự báo nhu cầu.
* **Đơn vị:** Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng.

---

### 📂 Cấu trúc thư mục dự án

```text
├── Docs/                        # Chứa file Word, PDF báo cáo nộp giảng viên & hình ảnh sơ đồ
│   ├── BAO_CAO_NGHIEP_VU_VA_KIEN_TRUC_NOP_THAY.docx
│   ├── 123001364_DoTanDu.docx
│   └── Diagram_Images/
├── Database/                    # Cơ sở dữ liệu chuẩn Microsoft SQL Server (T-SQL)
│   ├── retail_spoilage_database.sql
│   ├── HUONG_DAN_DATABASE.md
│   └── test_database_runner.py
├── Sample_Data/                 # Dữ liệu bán hàng mẫu phục vụ kiểm thử tính năng Import Excel
│   └── mau_du_lieu_ban_hang_import.csv
├── Backend/                     # Mã nguồn Backend API (Phụ trách: Đoàn Minh Quân)
└── Frontend/                    # Mã nguồn Frontend Web Application (Phụ trách: Đỗ Tấn Du)
```

---

### 🚀 Hướng dẫn cài đặt Cơ sở dữ liệu (Dành cho thành viên nhóm)
1. Mở **SQL Server Management Studio (SSMS)**.
2. Kết nối vào Server: `(localdb)\mssqllocaldb` (hoặc `.\SQLEXPRESS`).
3. Mở file `Database/retail_spoilage_database.sql` và bấm **Execute (F5)**.
4. Kiểm tra dữ liệu mẫu tại bảng `dbo.batches` và các View cảnh báo `v_spoilage_alerts`.
