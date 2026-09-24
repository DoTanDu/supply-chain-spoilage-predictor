# 12. BÁN HÀNG LẺ TẠI QUẦY POS VÀ TỰ ĐỘNG TRỪ KHO FEFO

---

### 1. Luồng Bán lẻ tại Quầy (POS Retail Checkout)
1. Thu ngân chọn sản phẩm hoặc quét mã vạch sản phẩm khách mua.
2. Thêm vào giỏ hàng: điều chỉnh số lượng mua.
3. Hệ thống hiển thị: Đơn giá, Thành tiền, Chiết khấu cận date (nếu có chương trình xả hàng).
4. Khi nhấn **"Thanh toán & Xuất hóa đơn"**:
   - Backend quét các lô còn hạn của sản phẩm theo thứ tự `expiry_date ASC`.
   - Lô có hạn gần nhất bị trừ số lượng trước.
   - Nếu số lượng mua lớn hơn tồn của lô thứ nhất, hệ thống tự động trừ tiếp sang lô thứ hai.
   - Ghi nhận đơn hàng vào `sales_orders`, chi tiết vào `sale_items`.
   - Tự động gắn nhãn cờ thời tiết hiện tại (Nắng/Mưa) và ngày lễ để phục vụ phân tích máy học.
5. In hóa đơn hoặc hiển thị thông báo thành công kèm chi tiết các lô vừa được trừ kho.
