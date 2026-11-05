# KẾ HOẠCH NÂNG CẤP TOÀN DIỆN FRONTEND UI/UX

## HỆ THỐNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ (LHU MART)

**(Commercial-Grade UI/UX Overhaul & Visual Modernization Plan)**

* **Mục tiêu:** Lột xác toàn bộ giao diện từ mức "Khung kỹ thuật MVP thô sơ" lên mức "Sản phẩm Bán lẻ Thương mại Đẳng cấp Cao (Commercial-Grade SaaS)", loại bỏ triệt để tình trạng rối mắt, màu sắc lòe loẹt, mang lại trải nghiệm tinh tế, hiện đại (Clean, Sleek, Modern Dark Theme).
* **Tiêu chuẩn thiết kế:** Cảm hứng từ Linear, Stripe, Apple và hệ thống POS siêu thị Co.op Smile / Circle K.
* **Thời gian lập kế hoạch:** 12/10/2026.

---

## I. CHẨN ĐOÁN CÁC VẤN ĐỀ HIỆN TẠI CỦA GIAO DIỆN (ROOT CAUSE ANALYSIS)

| Vấn đề                                                  | Biểu hiện trên giao diện hiện tại                                                                                                                                 | Tác động tiêu cực                                                                                       | Giải pháp lột xác                                                                                                                                                                                                                                                                                                                                                                   |
| :--------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Màu sắc quá gắt & Nhấp nháy**             | Sử dụng các màu neon tương phản cực mạnh (đỏ chói, vàng nghệ, tím, xanh đập vào mắt), animation`pulse` nhấp nháy liên tục ở nhiều chỗ.      | Gây mỏi mắt (Visual Fatigue), cảm giác lộn xộn, thiếu sự sang trọng của phần mềm doanh nghiệp. | • Chuyển sang bảng màu**Slate & Emerald Dark Theme** dịu mắt.• Màu trạng thái dùng tone Pastel/Muted hiện đại (Rose `#f43f5e`, Amber `#f59e0b`, Emerald `#10b981`).• Bỏ toàn bộ hiệu ứng nhấp nháy giật mắt.                                                                                                                                        |
| **2. Mật độ chữ quá dày, thiếu khoảng thở** | Nhồi nhét quá nhiều dòng chữ mô tả, badge lồng ghép, giải thích dài dòng ở Header, Sidebar và các Card.                                                | Người dùng bị ngợp thông tin, không biết nhìn vào đâu trước (mất Visual Hierarchy).           | • Áp dụng nguyên tắc**Khoảng thở (White Space)**.• Lược bỏ các text hướng dẫn thừa thãi, chuyển thành tooltip hoặc icon tinh tế.• Phân cấp kiểu chữ (Typography) rõ ràng từ `font-size`, `font-weight` đến `color`.                                                                                                                          |
| **3. Header & Sidebar rối rắm**                    | Header có quá nhiều cụm nút (tên cửa hàng, nút sửa, thời tiết, ngày lễ, chuông báo, box admin lỉnh kỉnh). Sidebar có phụ đề và badge dài dòng. | Chiếm dụng diện tích màn hình, phân tán sự chú ý khỏi màn hình làm việc chính.              | •**Header tinh gọn:** Gom thanh thời tiết/ngày lễ thành 1 thanh status pill thanh lịch; avatar người dùng nhỏ gọn có dropdown menu.• **Sidebar thanh lịch:** Menu chuẩn phong cách Linear/Vercel (Icon + Tên ngắn gọn + Active Pill tinh tế).                                                                                                         |
| **4. Quầy POS chưa chuẩn siêu thị**             | Thẻ sản phẩm phẳng lì, giỏ hàng xếp dòng thô sơ, thiếu các thao tác thu ngân thiết yếu.                                                                | Không toát lên được nghiệp vụ bán lẻ thực tế của một cửa hàng tiện lợi.                    | •**Thiết kế lại 2 cột cân đối:** Trái là lưới sản phẩm có ảnh card sang trọng; Phải là giỏ hàng hóa đơn chuyên nghiệp.• Bổ sung ô **Nhập tiền khách đưa $\rightarrow$ Tự động tính tiền thối lại (tiền thừa)**.• Thêm Modal **In Phiếu Hóa đơn Bán lẻ mô phỏng bill in nhiệt chuẩn Co.op Smile / LHU Mart**. |
| **5. Thiếu biểu đồ trực quan**                  | Dashboard chỉ toàn thẻ số tĩnh, thiếu các biểu đồ đồ thị để lãnh đạo liếc nhìn là hiểu.                                                           | Khó thuyết phục Hội đồng chấm điểm về khả năng phân tích dữ liệu và BI.                     | • Tích hợp**Biểu đồ Donut Chart (SVG)** phân bổ 4 màu hạn dùng (Xanh/Vàng/Đỏ/Hết hạn).• Bổ sung **Biểu đồ Cột/Đường (SVG/Micro-chart)** xu hướng doanh số 7 ngày và tốc độ bán bình quân.                                                                                                                                               |
| **6. Thiếu các trang nghiệp vụ thực tế**       | Quản lý sản phẩm bị gộp vào nhập hàng; thiếu quy trình bàn giao ca trực.                                                                                   | Hệ thống chưa tạo cảm giác là một giải pháp chuỗi cung ứng toàn diện.                          | • Tách riêng trang**Quản lý Danh mục & Sản phẩm FMCG (Product Management CRUD)**.• Bổ sung trang **Bàn giao Ca trực 4 bước điện tử (Shift Handover)** theo Mục 15 SSOT.                                                                                                                                                                                   |

---

## II. MA TRẬN NỘI DUNG: CẦN SỬA GÌ - THÊM GÌ - BỚT GÌ TỪNG PHÂN HỆ

```
┌────────────────────────────────────────────────────────────────────────┐
│               MA TRẬN NÂNG CẤP GIAO DIỆN LHU MART 2.0                  │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ PHÂN HỆ GIAO DIỆN  │ BỚT ĐI (REMOVE)    │ SỬA & THÊM MỚI (ADD & REFINE)│
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 1. Hệ thống Style  │ • Bỏ màu neon gắt  │ • Bảng màu Modern Slate Dark  │
│    (index.css)     │ • Bỏ animation giật│ • Font Plus Jakarta Sans mượt│
│                    │ • Bỏ border dày    │ • Card Glassmorphism 12-16px │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 2. Header          │ • Bớt chữ dài dòng │ • Status Pill thời tiết gọn  │
│    (Header.jsx)    │ • Bỏ nút cồng kềnh │ • User Avatar Profile gọn    │
│                    │ • Bỏ modal popup đỏ│ • Chuông thông báo drop-down │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 3. Sidebar         │ • Bỏ phụ đề rối mắt│ • Menu Icon + Title tối giản │
│    (Sidebar.jsx)   │ • Bỏ badge thừa    │ • Active Indicator thanh lịch│
│                    │                    │ • Tag quyền hạn gọn gàng     │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 4. Quầy Bán lẻ POS │ • Bỏ lưới nút thô  │ • Lưới Card sản phẩm có ảnh  │
│    (PosView.jsx)   │ • Bỏ text lỗi đỏ   │ • Ô tìm kiếm & Tabs ngành hàng│
│                    │   ngang giỏ hàng   │ • Ô nhập tiền khách đưa      │
│                    │                    │ • Tự động tính tiền thối lại │
│                    │                    │ • Modal In Hóa đơn nhiệt xịn │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 5. Dashboard       │ • Bỏ bảng chữ dài  │ • Biểu đồ Donut Hạn dùng     │
│    (DashboardView) │ • Bớt card phẳng   │ • Biểu đồ Xu hướng Doanh số  │
│                    │                    │ • Action Board dạng checklist│
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 6. Tiếp nhận DC    │ • Bỏ giao diện thô │ • Freshness Gauge mượt mà    │
│    (DcIntakeView)  │ • Bỏ cảnh báo gắt  │ • Form 2 cột cân đối, thanh  │
│                    │                    │   lịch, có nhãn đạt/không đạt│
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 7. Giám sát FEFO   │ • Bỏ bảng thô      │ • Tab phân vùng màu mượt mà  │
│    (FefoMonitor)   │ • Bỏ nút to chiếm  │ • Nút Markdown & Đảo kệ mini │
│                    │   diện tích        │ • Thanh timeline hạn sử dụng │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 8. Sản phẩm FMCG   │ (Trước đây chưa có │ • TRANG MỚI: Quản lý danh mục│
│    (MỚI BỔ SUNG)   │  trang độc lập)    │   46 sản phẩm, thêm/sửa/xóa, │
│                    │                    │   tìm kiếm, lọc ngành hàng   │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 9. Bàn giao Ca     │ (Trước đây chưa có │ • TRANG MỚI: Bàn giao ca 4   │
│    (MỚI BỔ SUNG)   │  giao diện)        │   bước theo Mục 15 của SSOT  │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

---

## III. THIẾT KẾ CHI TIẾT CỦA CÁC PHÂN HỆ NÂNG CẤP

### 1. Chuẩn hóa Hệ thống Thiết kế (Design Tokens & Color Palette)

* **Background chính:** `#0b0f19` (Deep Slate) kết hợp nền phụ `#111827` (Card Surface) và `#1e293b` (Card Hover).
* **Màu nhận diện thương hiệu:**
  - `Primary / Success (Xanh Ngọc):` `#10b981` (Emerald), nền mờ `rgba(16, 185, 129, 0.12)`.
  - `Warning (Vàng Hổ Phách):` `#f59e0b` (Amber), nền mờ `rgba(245, 158, 11, 0.12)`.
  - `Danger / Critical (Đỏ San Hô):` `#f43f5e` (Rose), nền mờ `rgba(244, 63, 94, 0.12)`.
  - `Accent / Info (Xanh Lam):` `#3b82f6` (Blue) & `#6366f1` (Indigo).
* **Typography:** Font Google Fonts `Plus Jakarta Sans` / `Inter`, kích thước chữ rõ ràng, độ tương phản chuẩn WCAG 2.1 AA.
* **Border & Glass:** Đường viền mảnh `1px solid rgba(255, 255, 255, 0.08)`, bo góc chuẩn `14px` - `16px`.

---

### 2. Quầy Bán Lẻ POS 2.0 (Supermarket Cashier Experience)

* **Cột trái (65% chiều rộng):**
  - **Thanh công cụ tìm kiếm & Tabs ngành hàng:** Tabs cuộn ngang mượt mà (Tất cả, Sữa tươi, Bánh tươi, Nước giải khát, Thực phẩm đông lạnh, Đồ khô).
  - **Lưới sản phẩm (Card Grid):** Mỗi sản phẩm có icon/hình ảnh sắc nét, tên sản phẩm nổi bật, giá niêm yết to rõ, tag tồn kho còn hạn. Khi bấm vào thẻ card sẽ có hiệu ứng nhấn nhẹ (Micro-bounce) và thêm ngay vào giỏ hàng.
* **Cột phải (35% chiều rộng - Giỏ hàng thông minh):**
  - **Danh sách món trong giỏ:** Tên món, số lượng (+/- / xóa), giá tiền.
  - **Phân bổ lô FEFO trực quan:** Huy hiệu nhỏ ghi rõ: *"Xuất từ Lô cận date: LOT-01 (15 SP) + Lô LOT-02 (4 SP)"*.
  - **Bộ tính tiền thông minh:**
    + Tổng tiền hàng (Tổng thanh toán).
    + Ô nhập: **"Tiền khách đưa"** (có các nút gợi ý tiền mặt nhanh: 50k, 100k, 200k, 500k, Đúng số tiền).
    + Dòng hiển thị: **"Tiền thối lại cho khách"** tự động tính toán (chữ to màu xanh Emerald).
  - **Nút bấm thanh toán nổi bật:** Nút to, màu Emerald phát sáng nhẹ, kèm âm thanh hoặc rung phản hồi.
  - **Modal Phiếu Hóa Đơn In Nhiệt (Receipt Modal):** Mô phỏng hóa đơn siêu thị LHU Mart thực tế với đầy đủ thông tin: Mã hóa đơn, Tên thu ngân, Giờ mua, Chi tiết từng lô FEFO đã bẻ, Tổng tiền, Tiền khách đưa, Tiền thừa, Mã vạch barcode. Có nút **"In Hóa Đơn"** và nút **"Đóng"**.

---

### 3. Dashboard Điều Hành 2.0 (Executive Visual Analytics)

* **Hàng trên - 4 Thẻ KPI Tinh Gọn:**
  - Vốn Tồn Kho Hiện Tại (VNĐ) kèm biểu đồ mini.
  - Vốn Nguy Kịch Cận Date (Vùng Đỏ) kèm tỷ lệ % rủi ro.
  - Doanh Thu Bán Lẻ Hôm Nay (VNĐ).
  - Tỷ Lệ Hao Hụt Spoilage Rate (%) với thanh tiến trình an toàn.
* **Hàng giữa - 2 Biểu Đồ Trực Quan Sinh Động:**
  - **Biểu đồ Donut Chart Hạn Dùng:** Biểu đồ tròn hiển thị trực quan tỷ lệ % 4 nhóm lô (Xanh / Vàng / Đỏ / Hết hạn) giúp người quản lý nhìn thấy ngay sức khỏe hạn dùng của kho.
  - **Biểu đồ Cột Doanh Số & Tốc Độ Bán:** Thống kê doanh số bán theo ngày và top sản phẩm bán chạy nhất.
* **Hàng dưới - Action Board Ca Trực Tinh Gọn:**
  - Danh sách công việc dạng thẻ task ngắn gọn (Ví dụ: *"Lô Sữa tươi LOT-01 còn 2 ngày -> Bấm giảm giá 30%"*, *"Lô Bánh mì LOT-02 -> Bấm đảo mặt tiền"*).
  - Mỗi việc có nút bấm 1 chạm xử lý ngay lập tức mà không cần chuyển trang.

---

### 4. Trang Quản Lý Sản Phẩm FMCG (Product Catalog Management - Bổ sung mới)

* Danh sách 46 sản phẩm hàng hóa được trình bày trong bảng hiện đại hoặc dạng thẻ.
* Tìm kiếm theo SKU / Tên, lọc theo ngành hàng FMCG.
* Modal **"Thêm mới Sản phẩm"** và **"Chỉnh sửa Sản phẩm"**:
  - Nhập mã SKU, tên sản phẩm, danh mục, đơn vị tính.
  - Cấu hình giá vốn, giá bán lẻ, hạn sử dụng chuẩn (ngày), mức tồn kho an toàn (`minStockLevel`).
  - Kiểm tra chống trùng SKU và tên tương đồng $\ge 85\%$ trực tiếp trên giao diện.

---

### 5. Trang Bàn Giao Ca Trực Điện Tử (Shift Handover - Bổ sung mới theo Mục 15 SSOT)

* Quy trình 4 bước tinh gọn cho nhân viên ca sáng bàn giao cho ca chiều:
  - **Bước 1: Chốt doanh số tiền mặt:** Nhập số tiền đếm được trong két, hệ thống tự đối soát với doanh số POS.
  - **Bước 2: Rà soát lô cận date:** Điểm danh các lô Vùng Đỏ và Vùng Vàng trên quầy kệ.
  - **Bước 3: Bàn giao hàng hủy:** Xác nhận số lượng hàng hỏng trong khu cách ly chờ tiêu hủy.
  - **Bước 4: Ký xác nhận điện tử:** Hai nhân viên bấm nút xác nhận, ghi nhận bản ghi bàn giao ca vào hệ thống.

---

## IV. LỘ TRÌNH THỰC THI TỪNG BƯỚC (STEP-BY-STEP EXECUTION)

```
[BƯỚC 1] ──> Nâng cấp Design Tokens & Reset CSS (index.css)
               • Bảng màu Slate & Emerald dịu mắt, typography, cards, button, form
[BƯỚC 2] ──> Sửa Header & Sidebar (Header.jsx, Sidebar.jsx)
               • Tinh gọn thanh công cụ, icon hiện đại, bỏ nhấp nháy, user avatar
[BƯỚC 3] ──> Nâng cấp toàn diện Quầy Bán lẻ POS (PosCheckoutView.jsx)
               • Lưới card sản phẩm, tabs ngành hàng, tiền thối lại, modal in bill
[BƯỚC 4] ──> Nâng cấp Dashboard với Biểu đồ trực quan (DashboardView.jsx)
               • Tích hợp biểu đồ Donut Chart hạn dùng, biểu đồ doanh số, Action Board
[BƯỚC 5] ──> Tinh chỉnh Tiếp nhận DC & Giám sát FEFO (DcIntakeView, FefoMonitorView)
               • Freshness Gauge thanh lịch, bộ lọc tab 3 màu, bảng dữ liệu sạch
[BƯỚC 6] ──> Xây dựng Màn hình Quản lý Sản phẩm (ProductCatalogView.jsx - MỚI)
               • CRUD sản phẩm, kiểm soát giá vốn/giá bán, chống trùng SKU
[BƯỚC 7] ──> Xây dựng Màn hình Bàn giao Ca trực (ShiftHandoverView.jsx - MỚI)
               • Quy trình 4 bước chốt ca thu ngân và bàn giao điện tử
[BƯỚC 8] ──> Kiểm thử trực quan trên Browser & Hoàn tất nghiệm thu Frontend
```

---

Bản kế hoạch này đảm bảo giải quyết triệt để vấn đề rối mắt, nâng tầm giao diện lên chuẩn mực phần mềm hiện đại và giữ vững 100% tính toàn vẹn của logic Clean Architecture và CSDL SQL Server LocalDB đã hoàn thiện bên dưới.
