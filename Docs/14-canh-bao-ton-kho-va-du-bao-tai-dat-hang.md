# 14. CẢNH BÁO TỒN KHO VÀ DỰ BÁO TÁI ĐẶT HÀNG (REORDER PREDICTOR)

---

### 1. Thuật toán Ngưỡng Đặt hàng Lại (Reorder Point - ROP)
$$\text{ROP} = (d \times L) + SS$$
- $d$: Nhu cầu bán bình quân 1 ngày của sản phẩm (tính từ lịch sử 14 ngày gần nhất).
- $L$: Lead time giao hàng từ Kho tổng (mặc định 2 ngày).
- $SS$: Lượng tồn kho an toàn chống đứt gãy nguồn cung.

*Khi Tổng tồn kho $\le \text{ROP}$: Hệ thống hiển thị cảnh báo Vàng "Sắp cạn hàng, cần đặt từ DC".*

---

### 2. Thuật toán Dự báo Nguy cơ Hư hỏng (Spoilage Risk: DOS > DUE)
- $\text{Days of Supply (DOS)} = \frac{\text{Tồn kho hiện tại}}{d}$ (Số ngày để bán hết tồn kho hiện tại).
- $\text{Days Until Expiry (DUE)} = \text{expiry\_date} - \text{Hôm nay}$ (Số ngày còn lại đến khi hết hạn).

*Nếu $\text{DOS} > \text{DUE}$:*
- Có nghĩa là với tốc độ bán hiện tại, hàng sẽ hết hạn **trước khi** bán hết!
- Hệ thống phát tín hiệu cảnh báo Đỏ khẩn cấp: **"Nguy cơ lãng phí cao! Đề xuất giảm giá kích cầu 20% - 30% ngay hôm nay"**.
