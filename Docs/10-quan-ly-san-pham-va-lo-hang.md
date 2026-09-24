# 10. QUẢN LÝ SẢN PHẨM VÀ GIÁM SÁT LÔ HÀNG THEO HẠN DÙNG (FEFO)

---

### 1. Mô hình Dữ liệu Sản phẩm & Lô hàng
Mỗi sản phẩm có nhiều lô hàng (`1 : N`). Thông tin lô hàng quản lý chặt chẽ:
- `batch_code`: Mã vạch lô hàng in trên bao bì (VD: `BAT-2026-MILK-001`).
- `import_date`: Ngày nhập kho.
- `expiry_date`: Hạn sử dụng của lô hàng.
- `initial_quantity`: Số lượng nhập ban đầu.
- `quantity`: Số lượng tồn thực tế hiện tại.
- `cost_price`: Giá vốn mua từ DC.
- `status`: `ACTIVE` (đang bán), `NEAR_EXPIRY` (cận date), `EXPIRED` (hết hạn), `DISPOSED` (đã hủy).

---

### 2. Công thức Trực quan Hạn Dùng (FEFO Shelf Life)
$$\text{Days Remaining} = \text{DATEDIFF}(\text{day}, \text{GETDATE}(), \text{expiry\_date})$$
$$\text{RSL (\%)} = \frac{\text{Days Remaining}}{\text{DATEDIFF}(\text{day}, \text{import\_date}, \text{expiry\_date})} \times 100\%$$

Thanh tiến trình màu sắc hiển thị trên Web:
- 🟢 **Xanh lục (> 20%):** Hàng an toàn, thanh tiến trình đầy đặn.
- 🟡 **Vàng (10% - 20%):** Chú ý theo dõi, ưu tiên đẩy bán.
- 🔴 **Đỏ (<= 10% hoặc <= 3 ngày):** Khẩn cấp! Dán tem giảm giá xả hàng ngay.
- 🟣 **Xám / Tím (<= 0 ngày):** Đã hết hạn, khóa mã bán POS, chờ tiêu hủy.
