# 13. GHI NHẬN VÀ PHÊ DUYỆT TIÊU HỦY HÀNG HỎNG (SPOILAGE DISPOSAL)

---

### 1. Luồng Tiêu hủy Hàng hóa
1. **Phát hiện:** Nhân viên phát hiện sản phẩm hết hạn hoặc hư hỏng cơ học (móp méo, rách bao bì, sữa lên men, rau củ thối).
2. **Lập phiếu hủy:**
   - Chọn lô hàng bị lỗi.
   - Nhập số lượng hư hỏng cần hủy.
   - Chọn lý do: Hết hạn sử dụng, Rách/vỡ bao bì, Lỗi bảo quản lạnh, Hư hỏng do vận chuyển.
   - Trạng thái phiếu: `PENDING_APPROVAL`.
3. **Phê duyệt (Cửa hàng trưởng):**
   - Quản lý kiểm tra thực tế và nhấn **"Phê duyệt tiêu hủy"**.
   - Số tồn của lô bị trừ chính thức về mức tương ứng (hoặc chuyển thành 0).
   - Trạng thái lô chuyển thành `DISPOSED` nếu đã hủy sạch.
   - Hệ thống tự động tính toán số tiền thiệt hại:
     $$\text{Thiệt hại} = \text{Số lượng hủy} \times \text{Giá vốn (cost\_price)}$$
   - Cập nhật chỉ số Tỷ lệ hao hụt (%) trên Dashboard quản trị.
