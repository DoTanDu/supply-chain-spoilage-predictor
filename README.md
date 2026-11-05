# NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ
## (Supply Chain Spoilage Predictor - LHU Mart)

[![Clean Architecture](https://img.shields.io/badge/Architecture-Clean%20Architecture%204--Tier-blue.svg)](file:///c:/thuyet%20minh/Backend/src/)
[![Database](https://img.shields.io/badge/Database-SQL%20Server%20LocalDB%203NF-green.svg)](file:///c:/thuyet%20minh/Database/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-purple.svg)](file:///c:/thuyet%20minh/Frontend/)
[![Tests](https://img.shields.io/badge/Integration%20Tests-11%2F11%20Rules%20PASS-brightgreen.svg)](file:///c:/thuyet%20minh/Backend/test_stage2_11_core_rules.js)

* **Đơn vị:** Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU).
* **Giảng viên hướng dẫn:** ThS. Lê Minh Nhật (Email: `nhatlm@lhu.edu.vn`)
* **Nhóm sinh viên thực hiện:**
  1. **Đỗ Tấn Du** (MSSV: 123001364) - Lớp 23CT111 - Nhóm trưởng (Phụ trách Phân tích nghiệp vụ, Thiết kế UI/UX & Lập trình Frontend SPA).
  2. **Đoàn Minh Quân** (MSSV: 123000946) - Lớp 23CT111 - Thành viên (Phụ trách Kiến trúc Clean Architecture, Cơ sở dữ liệu SQL Server & Thuật toán ROP).

---

## 📖 GIỚI THIỆU ĐỀ TÀI

Dự án nghiên cứu và phát triển giải pháp công nghệ quản trị chuỗi cung ứng bán lẻ tinh gọn cho cửa hàng **LHU Mart** (`RETAIL-STORE-01`) liên kết trực tiếp với Trung tâm Phân phối Kho tổng (**DC Biên Hòa**).  
Mục tiêu tối thượng là **triệt tiêu lãng phí thực phẩm FMCG** thông qua:
1. **Nguyên tắc FEFO tuyệt đối:** Bán lẻ tại quầy POS tự động xuất kho theo hạn sử dụng và bẻ đơn qua nhiều lô cận date trước.
2. **Cảnh báo 3 cấp màu Shelf-Life:** Giám sát vòng đời lô hàng (Xanh - Vàng - Đỏ - Tím khóa bán).
3. **Thước đo độ tươi RSL Freshness Gauge:** Chặn đứng các lô hàng từ DC Biên Hòa giao đến có $RSL < 70\%$.
4. **Dự báo Điểm đặt hàng ROP đa biến:** Tích hợp tốc độ bán 14 ngày, thời tiết, ngày lễ và cảnh báo nguy cơ ứ đọng $DOS > DUE$.
5. **Sổ hao hụt tài chính bất biến & Audit Trail:** Lưu vết 100% mọi nghiệp vụ trong ca trực.

---

## ⚡ HƯỚNG DẪN KHỞI CHẠY NHANH (QUICK START)

### 1. Yêu cầu môi trường
- **Node.js:** Phiên bản v18 trở lên (Khuyến nghị Node.js v20 hoặc v24).
- **Cơ sở dữ liệu:** Microsoft SQL Server LocalDB `(localdb)\mssqllocaldb` (hoặc SQL Server 2019/2022).

### 2. Khởi chạy Hệ thống trong 2 bước

#### Bước 2.1: Khởi động Backend API (Port 5000)
```powershell
cd "c:\thuyet minh\Backend"
npm install
node server.js
```
*API sẽ chạy tại: `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`)*

#### Bước 2.2: Khởi động Frontend SPA (Port 5173)
Mở một cửa sổ Terminal mới:
```powershell
cd "c:\thuyet minh\Frontend"
npm install
npm run dev
```
*Giao diện người dùng sẽ chạy tại: `http://localhost:5173`*

---

## 🛡️ CƠ CHẾ SAO LƯU & KHÔI PHỤC CSDL MẪU (DEMO SAFETY)

Để đảm bảo dữ liệu luôn ở trạng thái sạch và nguyên vẹn trước/sau mỗi buổi demo hoặc chạy test tự động, hệ thống cung cấp 2 script độc lập:

* **Khôi phục CSDL về trạng thái chuẩn ban đầu (1.2 giây):**
  ```powershell
  cd "c:\thuyet minh\Backend"
  node restore_database.js
  ```
  *(Script tự động khôi phục từ snapshot chuẩn: `Database/backups/retail_spoilage_db_master_seed.bak`)*

* **Tạo bản sao lưu mới nếu cần:**
  ```powershell
  cd "c:\thuyet minh\Backend"
  node backup_database.js
  ```

---

## 🧪 CHẠY BỘ KIỂM THỬ TỰ ĐỘNG 11 QUY TẮC CỐT LÕI (SSOT)

Thực thi bộ test tích hợp toàn diện kiểm chứng 11 Rules theo Đặc tả SSOT:
```powershell
cd "c:\thuyet minh\Backend"
node test_stage2_11_core_rules.js
```
*(Kết quả: 11/11 Rules PASS 100% và tự động khôi phục lại CSDL sạch sau khi chạy xong).*

---

## 👤 DANH SÁCH TÀI KHOẢN ĐĂNG NHẬP MẪU (3 ACTOR = 3 VAI TRÒ RBAC)

| Tên đăng nhập | Mật khẩu | Vai trò (`roleCode`) | Chức vụ & Họ tên | Quyền hạn chính |
| :--- | :--- | :--- | :--- | :--- |
| **admin** | `Password123@` | `ADMIN` | Chủ chuỗi / Quản trị viên | Toàn quyền quản trị chuỗi 3 chi nhánh, cấu hình tham số, danh mục 80 SP FMCG & nhân sự |
| **manager** | `Password123@` | `STORE_MANAGER` | Đỗ Tấn Du (Cửa Hàng Trưởng) | Điều hành 6 KPI tài chính, giảm giá Quick Markdown 15-50%, phê duyệt tiêu hủy & đặt hàng DC |
| **cashier** | `Password123@` | `CASHIER` | Đoàn Minh Quân (Nhân Viên Cửa Hàng) | Bán lẻ tại quầy POS tự động bẻ lô FEFO, tiếp nhận xe hàng DC ($RSL \ge 70\%$), đảo kệ 5 bước & bàn giao ca |

---

## 🏗️ KIẾN TRÚC HỆ THỐNG & CƠ SỞ DỮ LIỆU

### 1. Kiến trúc Clean Architecture 4 Tầng (Backend)
```
Backend/src/
├── domain/                      # Lõi nghiệp vụ độc lập (Entities, Value Objects, Domain Services)
│   ├── entities/                # Product, Batch, PurchaseOrder, SpoilageRecord, StoreProfile
│   ├── services/                # FefoAllocationPolicy, RopCalculationService, FreshnessStandardService
│   └── interfaces/              # IBatchRepository, IProductRepository, IAuditLogRepository...
├── application/                 # Các kịch bản ca sử dụng (Use Cases & DTOs)
│   ├── use-cases/sales/         # ProcessFefoSaleUseCase (Bẻ lô FEFO, trừ kho)
│   ├── use-cases/batch/         # ReceiveDCBatchUseCase (RSL >= 70%), ApplyQuickMarkdown, RotateShelf
│   ├── use-cases/forecast/      # CalculateROPForecastUseCase, CreatePurchaseOrderUseCase
│   └── use-cases/spoilage/      # RecordSpoilageUseCase (Tính CostLoss)
├── infrastructure/              # Tầng giao tiếp CSDL & Công nghệ ngoài
│   └── database/repositories/   # SqlBatchRepository, SqlProductRepository, SqlSaleRepository...
└── presentation/                # Tầng điều khiển & Định tuyến API
    ├── controllers/             # SalesController, BatchController, ForecastController...
    ├── routes/                  # salesRoutes, batchRoutes, catalogRoutes, forecastRoutes...
    └── middlewares/             # authMiddleware, roleMiddleware, errorHandler
```

### 2. Mô hình Dữ liệu Chuẩn 3NF (15 Bảng SQL Server LocalDB `retail_spoilage_db`)
- **Quản trị & Phân quyền (3 Actor):** `roles`, `users`, `store_profile`, `system_audit_logs`, `shift_handovers`.
- **Danh mục hàng hóa (80 SP FMCG - 7 ngành hàng):** `suppliers`, `categories`, `products`.
- **Vòng đời lô hàng & Luân chuyển:** `batches`, `stock_transfers`.
- **Giao dịch bán lẻ POS & Sổ hao hụt tài chính:** `sales_history`, `spoilage_records`.
- **Dự báo AI-ROP, Đơn đặt hàng & Nhận hàng DC:** `ai_forecasts`, `purchase_orders`, `purchase_order_items`, `goods_receipts`.

---

## 📑 HỒ SƠ TÀI LIỆU & BÁO CÁO NGHIỆM THU

* **Biên bản Nghiệm thu Kỹ thuật Toàn diện:** [Docs/BIEN_BAN_NGHIEM_THU_KY_THUAT_TOAN_DIEN.md](Docs/BIEN_BAN_NGHIEM_THU_KY_THUAT_TOAN_DIEN.md)
* **Kịch bản Thuyết trình Demo 15 phút:** [Docs/KICH_BAN_DEMO_THUYET_TRINH_15_PHUT.md](Docs/KICH_BAN_DEMO_THUYET_TRINH_15_PHUT.md)
* **Báo cáo Kiểm thử Toàn trình E2E trên Giao diện:** [stage3_e2e_verification_report.md](file:///C:/Users/ASUS/.gemini/antigravity-ide/brain/eaad8537-6b4a-48ee-8112-a52f8c7fb1f8/stage3_e2e_verification_report.md)
* **Tài liệu Đặc tả Hệ thống Gốc (SSOT):** [Docs/Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md](Docs/Dac%20Ta%20He%20Thong%20Quan%20Ly%20Chuoi%20Cung%20Ung%20Chong%20Lang%20Phi%20-%20Supply%20Chain%20Spoilage%20Predictor.md)

---
*(Bản quyền đề tài thuộc về Nhóm Nghiên cứu Sinh viên Khoa CNTT - Trường Đại học Lạc Hồng, 2026)*
