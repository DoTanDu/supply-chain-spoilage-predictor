---
name: spoilage-business-rules
description: Quy tắc nghiệp vụ cốt lõi của nền tảng Bán lẻ Chống lãng phí (FEFO, 3 Ngưỡng an toàn, Trừ kho, Tiêu hủy, Dự báo ROP)
---

# QUY TẮC NGHIỆP VỤ BẤT DI BẤT DỊCH (SPOILAGE BUSINESS RULES)

Bộ kỹ năng này định nghĩa toàn bộ quy tắc nghiệp vụ chuẩn mực của hệ thống Quản trị Bán lẻ Chống lãng phí (*Supply Chain Spoilage Predictor*). Mọi dòng mã nguồn Backend, Frontend và Database đều phải tuân thủ nghiêm ngặt các quy tắc này.

---

### 1. Quy tắc Tiếp nhận Lô hàng từ Kho tổng (Goods Receipt)
* **Bắt buộc:** Mỗi đợt hàng về phải lưu theo Lô (`batch`).
* **Trường bắt buộc:** `product_id`, `batch_code`, `import_date`, `expiry_date`, `initial_quantity`, `quantity`, `cost_price`.
* **Ràng buộc toàn vẹn:** `expiry_date > import_date` và `quantity > 0`.
* **Trạng thái ban đầu:** Mặc định là `ACTIVE`.
* **Kích hoạt vòng đời:** Hệ thống tự động tính tổng số ngày hạn sử dụng ban đầu $\text{Total Shelf Life} = \text{expiry\_date} - \text{import\_date}$.

---

### 2. Quy tắc Bán hàng lẻ & Trừ kho FEFO (First Expired, First Out)
* **Nguyên tắc vàng:** Bán hàng ra cho khách chính là Xuất kho. Không có quy trình xuất kho nội bộ riêng.
* **Thuật toán FEFO:** Khi phát sinh giao dịch bán sản phẩm $P$ với số lượng $Q$:
  1. Quét tìm trong bảng `batches` các lô của sản phẩm $P$ có `status = 'ACTIVE'` và `quantity > 0`.
  2. Sắp xếp ưu tiên: `ORDER BY expiry_date ASC, id ASC`.
  3. Lô nào có hạn sử dụng gần nhất sẽ được trừ trước. Nếu số lượng lô đó không đủ $Q$, tiếp tục trừ phần còn lại ở lô kế cận.
* **Ràng buộc an toàn:** Tuyệt đối không cho phép tồn kho âm (`quantity >= 0`). Nếu tổng tồn kho của tất cả các lô không đủ $Q$, giao dịch phải bị từ chối với thông báo "Tồn kho không đủ".
* **Ghi nhận ngoại cảnh:** Mỗi giao dịch bán bắt buộc ghi nhận ngày bán, số lượng bán, thời tiết (`SUNNY`, `RAINY`, `NORMAL`) và cờ ngày lễ/cuối tuần (`is_holiday = true/false`).

---

### 3. Quy tắc 3 Ngưỡng An Toàn (Safety Thresholds)

#### A. Ngưỡng Cận Date theo % Vòng đời còn lại (RSL - Remaining Shelf Life)
$$\text{RSL} = \frac{\text{Số ngày còn lại đến HSD (DUE)}}{\text{Tổng hạn sử dụng ban đầu (Total Life)}} \times 100\%$$
* 🟢 **Bình thường (Safe):** $\text{RSL} > 20\% \rightarrow$ Bán bình thường, xếp trên kệ theo FEFO.
* 🟡 **Cận date nhẹ (Warning):** $10\% < \text{RSL} \le 20\% \rightarrow$ Bật cảnh báo Vàng trên Dashboard, nhân viên theo dõi sát.
* 🔴 **Cận date khẩn cấp (Critical):** $\text{RSL} \le 10\%$ (hoặc số ngày còn lại $\le 3$ ngày) $\rightarrow$ Bật cảnh báo Đỏ, kích hoạt hành động: Đảo hàng ra đầu kệ, dán tem giảm giá xả hàng kích cầu (10% - 50%).
* 🟣 **Hết hạn (Expired):** Số ngày còn lại $\le 0$ ngày $\rightarrow$ Chuyển trạng thái sang `EXPIRED`, tự động khóa mã vạch trên POS, cấm quét bán tại quầy thu ngân.

#### B. Ngưỡng Tồn kho Tối thiểu (Reorder Point - ROP)
$$\text{ROP} = (d \times L) + SS$$
* $d$ (Daily Demand): Tốc độ bán trung bình 1 ngày (lấy từ dữ liệu bán hàng lịch sử).
* $L$ (Lead Time): Thời gian chờ giao hàng từ Kho tổng về đến cửa hàng (mặc định 1 - 2 ngày).
* $SS$ (Safety Stock): Lượng tồn kho an toàn dự phòng rủi ro chậm hàng.
* **Quy tắc:** Khi tổng tồn kho trên kệ $\le \text{ROP} \rightarrow$ Hệ thống tự động bắn cảnh báo "Cần đặt thêm hàng từ Kho tổng".

#### C. Ngưỡng Nguy cơ Lãng phí (Spoilage Risk Index - DOS > DUE)
* Gọi $\text{DOS} = \frac{\text{Tổng tồn kho hiện tại}}{d}$ (Số ngày cần để bán hết số tồn hiện tại).
* Gọi $\text{DUE} = \text{expiry\_date} - \text{ngày hôm nay}$ (Số ngày còn lại đến khi hết hạn).
* **Quy tắc:** Nếu $\text{DOS} > \text{DUE} \rightarrow$ Kích hoạt cảnh báo **NGUY CƠ HƯ HỎNG CAO**. Chắc chắn sẽ có hàng bị vứt bỏ nếu không xả hàng ngay.

---

### 4. Quy tắc Tiêu hủy Hàng hỏng & Quá hạn (Spoilage Disposal)
* Khi phát hiện hàng hết hạn hoặc hư hỏng thực tế (dập nát, rách bao bì, ôi thiu):
  1. Nhân viên lập Phiếu tiêu hủy (`spoilage_records`): chọn lô, nhập số lượng hủy, chọn lý do.
  2. Cửa hàng trưởng phê duyệt phiếu tiêu hủy.
  3. Hệ thống trừ sạch số lượng tồn kho của lô tương ứng về 0 và chuyển trạng thái lô thành `DISPOSED`.
  4. Hệ thống hạch toán tự động số tiền thiệt hại tài chính:
     $$\text{Chi phí thiệt hại} = \text{Số lượng tiêu hủy} \times \text{Giá vốn (cost\_price)}$$
  5. Cập nhật tức thì vào chỉ số tỷ lệ hao hụt hàng hóa:
     $$\text{Tỷ lệ lãng phí (Spoilage Rate \%)} = \frac{\text{Tổng chi phí hàng hủy}}{\text{Tổng chi phí hàng nhập}} \times 100\%$$

---

### 5. Quy tắc Biến Ngoại cảnh & Dự báo Tiêu thụ (K Multipliers)
* Tốc độ bán hàng ngày $d$ được điều chỉnh theo hệ số $K$:
  * Ngày thường: $K = 1.0$
  * Cuối tuần (Thứ 7, CN): $K = 1.25$ (tăng 25% với đồ ăn, đồ uống)
  * Ngày Lễ / Tết: $K = 1.60$ (tăng 60% sức mua)
  * Trời nắng nóng ($>34^\circ\text{C}$): $K = 1.40$ (đồ uống, kem, nước giải khát tăng 40%)
  * Trời mưa bão: $K = 0.75$ (giảm 25% sức mua hàng tươi sống, nhưng mì tôm tăng $K = 1.30$).
