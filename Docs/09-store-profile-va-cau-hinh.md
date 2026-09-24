# 09. CẤU HÌNH CỬA HÀNG VÀ THAM SỐ VẬN HÀNH

---

### 1. Cấu hình Cửa hàng Bán lẻ
- **Tên cửa hàng:** Siêu thị Tiện lợi VinMart+ / LHU Retail Store #01.
- **Mã định danh:** `STR-001`.
- **Địa chỉ:** Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai.
- **Cửa hàng trưởng phụ trách:** Đỗ Tấn Du.
- **Thời gian nhận hàng chuẩn từ DC (Lead Time $L$):** 2 ngày.

---

### 2. Cấu hình 3 Ngưỡng An Toàn
- **Ngưỡng Vàng (Warning):** $20\%$ vòng đời còn lại.
- **Ngưỡng Đỏ (Critical):** $10\%$ vòng đời còn lại (hoặc $\le 3$ ngày đến HSD).
- **Ngưỡng Khóa bán (Expired):** $\le 0$ ngày $\rightarrow$ Khóa mã quét POS ngay lập tức.
- **Mức tồn kho an toàn ($SS$):** Mặc định tương đương 1.5 ngày bán bình quân.
