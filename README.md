# NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG CHỐNG LÃNG PHÍ
## (Supply Chain Spoilage Predictor - Retail Management)

* **Giảng viên hướng dẫn:** ThS. Lê Minh Nhật (Email: `nhatlm@lhu.edu.vn`)
* **Nhóm sinh viên thực hiện:**
  1. **Đỗ Tấn Du** (MSSV: 123001364) - Phụ trách Phân tích yêu cầu, Thiết kế UI/UX & Lập trình Frontend, Module Import Excel.
  2. **Đoàn Minh Quân** (MSSV: 123000946) - Phụ trách Lập trình Backend, Cơ sở dữ liệu & Thuật toán Dự báo nhu cầu.
* **Đơn vị:** Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng.

---

### 📂 Cấu trúc thư mục dự án

├── Skills/                      # Bộ 7 Kỹ năng Nghiệp vụ & Chuẩn Kỹ thuật (Agent Skills)
│   ├── spoilage-business-rules/ # Quy tắc FEFO, 3 Ngưỡng RSL & ROP
│   ├── sqlserver-database/      # Thiết kế CSDL 12 bảng 3NF & LocalDB
│   ├── clean-architecture/      # Cấu trúc Clean Architecture Controller - Service - Repo
│   ├── repository-pattern/      # Tách biệt tầng truy xuất CSDL
│   ├── api-controller-validation/# Chuẩn hóa REST API & validation
│   ├── code-review/             # Tiêu chuẩn thẩm định Clean Code
│   └── test-case-clean-architecture/ # Quy chuẩn Test Case tự động
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

### 🧠 Bộ Quy chuẩn Kỹ năng & Nghiệp vụ Dự án (Agent Skills)
Dự án được xây dựng theo chuẩn **Agent Skills** (tương thích các chuẩn AI Engineering như `addyosmani/agent-skills`, Antigravity IDE, Cursor, Claude Code). Toàn bộ quy tắc cốt lõi được lưu tại thư mục [Skills/](Skills/):
1. **[Quy tắc Nghiệp vụ Bán lẻ Chống lãng phí (FEFO & 3 Ngưỡng RSL)](Skills/spoilage-business-rules/SKILL.md)**
2. **[Chuẩn Cơ sở dữ liệu SQL Server LocalDB 3NF](Skills/sqlserver-database/SKILL.md)**
3. **[Kiến trúc phân tầng Clean Architecture](Skills/clean-architecture/SKILL.md)**
4. **[Mô hình Repository Pattern](Skills/repository-pattern/SKILL.md)**
5. **[Chuẩn hóa API Controller & Input Validation](Skills/api-controller-validation/SKILL.md)**
6. **[Tiêu chuẩn Thẩm định Mã nguồn (Code Review)](Skills/code-review/SKILL.md)**
7. **[Quy chuẩn Kiểm thử Test Case Clean Architecture](Skills/test-case-clean-architecture/SKILL.md)**

---

### 🚀 Hướng dẫn cài đặt Cơ sở dữ liệu (Dành cho thành viên nhóm)
1. Mở **SQL Server Management Studio (SSMS)**.
2. Kết nối vào Server: `(localdb)\mssqllocaldb` (hoặc `.\SQLEXPRESS`).
3. Mở file `Database/retail_spoilage_database.sql` và bấm **Execute (F5)**.
4. Kiểm tra dữ liệu mẫu tại bảng `dbo.batches` và các View cảnh báo `v_spoilage_alerts`.
