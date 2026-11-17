# GIẢI THÍCH CHI TIẾT: THAM SỐ VẬN HÀNH & NGƯỠNG AN TOÀN CHI NHÁNH

**Vị trí trên giao diện:** Trang **02. Store Management** → Bấm **`Thêm Chi nhánh mới`** hoặc **`Sửa`** trên thẻ cửa hàng → Khung **`Tham số Vận hành & Ngưỡng An toàn`**.  
**Quyền thao tác:** Chỉ **OWNER (Admin)** mới thấy và chỉnh sửa được 4 tham số này. Nếu tài khoản **MANAGER (Cửa hàng trưởng)** cố gửi yêu cầu API thay đổi 4 ngưỡng này, hệ thống sẽ chặn lỗi **`403`** theo nguyên tắc phân tách nhiệm vụ (**SoD**).

---

## Bảng tóm tắt nhanh 4 tham số

| Tham số trên UI | Mặc định | Giới hạn hợp lệ | Cột CSDL (`store_profile`) | Tác dụng chính |
| :--- | :---: | :---: | :--- | :--- |
| **Min RSL DC (%)** | `70` % | `50% – 95%` | `min_inbound_rsl_percent` | Chặn nhập hàng nếu date còn lại khi giao nhỏ hơn tỷ lệ % này |
| **Lead Time (ngày)** | `1` ngày | `1 – 14` ngày | `default_lead_time_days` | Số ngày chờ xe giao hàng; dùng tính **Điểm đặt hàng (ROP)** & ngày về dự kiến |
| **Ngưỡng Vàng (ngày)** | `7` ngày | `3 – 30` ngày *(giá trị nhập phải lớn hơn Ngưỡng Đỏ)* | `default_warning_days` | Mốc chuẩn báo cận date mức **Cảnh báo (Vàng)** để giảm giá `15–30%` & đảo kệ |
| **Ngưỡng Đỏ (ngày)** | `3` ngày | `1 – 5` ngày *(giá trị nhập phải nhỏ hơn Ngưỡng Vàng)* | `critical_warning_days` | Mốc chuẩn báo cận date mức **Nguy kịch (Đỏ)** để xả sâu `40–50%` trong ngày |

> **Giải thích nhanh để tránh nhầm:** Con số ở đây là **số ngày CÒN LẠI đếm ngược tới lúc hết hạn (`0 ngày`)**.
> - **Ngưỡng Vàng (`3–30` ngày, mặc định `7`):** Báo **sớm** khi còn nhiều ngày (ví dụ còn `7` ngày mới hết hạn).
> - **Ngưỡng Đỏ (`1–5` ngày, mặc định `3`):** Báo **gấp** khi sắp hết hạn (ví dụ chỉ còn `3` ngày hoặc `1–2` ngày nữa là vứt bỏ).
> - Vì đi qua **Vàng trước rồi mới tới Đỏ** khi đếm ngược về `0`, nên số ngày của **Ngưỡng Vàng** bắt buộc phải **lớn hơn** **Ngưỡng Đỏ** (ví dụ `7 > 3`). Nếu đặt `Ngưỡng Đỏ = 3`, thì `Ngưỡng Vàng` phải nhập từ `4` đến `30`.

---

## Giải thích chi tiết từng tham số

### 1. Min RSL DC (%) — Tuổi thọ Hạn sử dụng Tối thiểu khi Nhập kho
- **RSL là gì?** Là viết tắt của **Remaining Shelf-Life** (tỷ lệ **% hạn sử dụng còn lại** của lô hàng tại thời điểm xe tải Kho tổng DC / Nhà cung cấp giao tới cửa hàng).
- **Công thức tính khi nhập kho:**
  $$\text{RSL}_{\text{inbound}} = \frac{\text{Hạn sử dụng (HSD)} - \text{Ngày nhận hàng}}{\text{Hạn sử dụng (HSD)} - \text{Ngày sản xuất (NSX)}} \times 100\%$$
- **Ví dụ dễ hiểu:**
  - Một hộp sữa có **NSX `01/11`** và **HSD `11/11`** (tổng vòng đời = **10 ngày**).
  - Cửa hàng cài **Min RSL DC = `70%`** → Khi giao tới cửa hàng, hộp sữa bắt buộc còn tối thiểu `70% × 10 = 7 ngày`.
  - Nếu xe giao hàng vào **`04/11`** (còn `7/10 ngày = 70%`) → **ĐẠT**, hệ thống cho nhập kho.
  - Nếu xe giao hàng vào **`06/11`** (chỉ còn `5/10 ngày = 50% < 70%`) → **KHÔNG ĐẠT**, hệ thống hiểu kho tổng đang "đẩy hàng cận date" về cửa hàng.
- **Tác động trực tiếp trên web:**
  - Tại trang **03. Inventory Management** → nút **`Nhập kho`**: ngay khi chọn NSX/HSD, hệ thống lấy đúng `Min RSL DC (%)` của chi nhánh đó để kiểm tra. Nếu `< Min RSL DC (%)`, API **khóa lưu phiếu nhập** theo Rule 7 và hiển thị nút lập **Biên bản từ chối nhận hàng (`REJECT_DC_INBOUND`)** ghi vào `AuditLogs`.
- **Khi nào nên chỉnh?**
  - **Tăng lên `75% – 85%`:** với chi nhánh bán chậm hoặc hàng siêu tươi cần giữ lâu trên kệ.
  - **Giảm xuống `55% – 65%`:** chỉ dùng khi chi nhánh bán cực nhanh hết trong 1–2 ngày hoặc nguồn hàng đặc thù.

---

### 2. Lead Time (ngày) — Thời gian Chờ Giao hàng
- **Ý nghĩa:** Là số ngày trung bình kể từ lúc quản lý bấm **lập/duyệt đơn đặt hàng (PO)** đến khi xe chở hàng về tới cửa hàng và xếp lên kệ bán được.
- **Tác động trực tiếp đến công thức Đặt hàng Thông minh (ROP):**
  $$\text{ROP} = \lceil (\text{Tốc độ bán/ngày} \times \text{Lead Time}) + \text{Tồn an toàn (Safety Stock)} \rceil$$
- **Ví dụ dễ hiểu:**
  - Sản phẩm A bán trung bình **`10 hộp/ngày`**, mức tồn an toàn tối thiểu (`Safety Stock`) là **`15 hộp`**.
  - **Nếu `Lead Time = 1 ngày`:** Điểm đặt hàng `ROP = (10 × 1) + 15 = 25 hộp`. Khi tồn giảm xuống `≤ 25 hộp` hệ thống mới báo cần đặt hàng.
  - **Nếu chi nhánh ở xa, đổi `Lead Time = 3 ngày`:** Điểm đặt hàng tăng lên `ROP = (10 × 3) + 15 = 45 hộp`. Hệ thống sẽ **báo đặt sớm hơn** ngay khi tồn còn 45 hộp (vì trong 3 ngày chờ xe chạy, cửa hàng bán mất thêm 30 hộp, hàng vừa tới là vừa chạm 15 hộp an toàn chứ không bị đứt hàng).
- **Nơi sử dụng con số này trên web:**
  1. **01. Dashboard & 05. Smart Ordering:** Tính mốc `ROP` cảnh báo thiếu hàng và gợi ý số lượng đặt bù.
  2. **05. Smart Ordering (tạo đơn PO):** Tự điền **Ngày dự kiến giao hàng** = `Hôm nay + Lead Time (ngày)` và tính giờ giao ước tính trên 3 phương án (`Kho DC: max(12, LeadTime × 24) giờ`; `NCC ngoài: (LeadTime + 1) × 24 giờ`).
  3. **08. Reports & Analytics:** Hiển thị thời gian giao chuẩn khi so sánh hiệu quả các chi nhánh.

---

### 3. Ngưỡng Vàng (ngày) — Mốc Cảnh báo Cận hạn Sớm
- **Ý nghĩa nghiệp vụ (Rule 4):** Khi số ngày còn lại trước hạn sử dụng nằm trong khoảng **`Ngưỡng Đỏ < Số ngày còn lại ≤ Ngưỡng Vàng`** (mặc định `3 < DaysLeft ≤ 7`), lô hàng chuyển từ **Vùng Xanh (An toàn)** sang **Vùng Vàng (Cảnh báo)**.
- **Hành động đi kèm:** Đây là "khoảng đệm" đủ sớm để nhân viên thực hiện **SOP Đảo kệ 5 bước** (kéo lô cận date ra mép ngoài kệ bán trước theo FEFO) và bật **Quick Markdown giảm nhẹ `15% – 30%`** nhằm đẩy hết hàng êm đẹp mà không phải chịu lỗ nặng.
- **Ràng buộc dữ liệu:** Cho phép từ **`3` đến `30` ngày** và bắt buộc phải **lớn hơn `Ngưỡng Đỏ`** (`Ngưỡng Đỏ < Ngưỡng Vàng`).
- **Tại sao dải này lại rộng tới `3 – 30` ngày?** Vùng Vàng chỉ là cảnh báo sớm (đảo kệ, điều chuyển hoặc giảm nhẹ `15–30%`) nên cần độ co giãn lớn theo từng loại hàng hóa: hàng tươi/bánh ngắn ngày chỉ cần báo trước `3–5` ngày, hàng sữa mát báo trước `7–14` ngày, còn hàng khô/đồ hộp quay vòng chậm cần báo sớm tới `15–30` ngày để kịp lên kế hoạch xả. Mức tối thiểu là `3` ngày vì luôn phải lớn hơn `Ngưỡng Đỏ` ít nhất là trên `1–2` ngày để kịp có "khoảng đệm Vàng".
- **Lưu ý đúng theo hiện trạng mã nguồn:**
  - Tham số này được lưu vào cấu hình chuẩn chi nhánh (`store_profile.default_warning_days`) và ghi vào `AuditLogs` khi Owner thay đổi.
  - Khi tô màu Vàng cho từng lô hàng trong kho (`vw_Batches_ShelfLife_Alerts`), hệ thống hiện ưu tiên dùng ngưỡng riêng của từng **Sản phẩm** hoặc **Ngành hàng** (`COALESCE(p.custom_warning_days, c.default_warning_days, 7)` — chỉnh tại **Trang 03 → Tab `Sản phẩm & Nhóm hàng`**) để phù hợp đặc thù từng mặt hàng (ví dụ: bánh tươi cảnh báo trước 2–3 ngày, đồ khô/đồ hộp cảnh báo trước 15–30 ngày). Vì vậy `Ngưỡng Vàng` tại chi nhánh là **mốc cấu hình chuẩn cấp chi nhánh**, không tự động ghi đè các ngưỡng riêng đã đặt theo sản phẩm/ngành hàng.

---

### 4. Ngưỡng Đỏ (ngày) — Mốc Cảnh báo Nguy kịch / Xả gấp
- **Ý nghĩa nghiệp vụ (Rule 4):** Khi số ngày còn lại trước hạn sử dụng nằm trong khoảng **`0 < Số ngày còn lại ≤ Ngưỡng Đỏ`** (mặc định `1–3 ngày` cuối), lô hàng rơi vào **Vùng Đỏ (Nguy kịch)**.
- **Hành động đi kèm:** Cửa hàng phải gom xả hàng kịch sàn **`40% – 50%`** (hoặc điều chuyển ngay sang chi nhánh đang thiếu nếu còn `≥ 2 ngày` và chuỗi có nhiều chi nhánh) để thu hồi vốn tối đa trước thời điểm **`DaysLeft ≤ 0`** — khi đó hệ thống tự động khóa bán POS tuyệt đối (**`EXPIRED`** - Rule 5) và bắt buộc lập biên bản **Tiêu hủy** ghi nhận lỗ vốn (`CostLoss = Số lượng hủy × Giá nhập`).
- **Ràng buộc dữ liệu:** Cho phép từ **`1` đến `5` ngày** và bắt buộc **nhỏ hơn `Ngưỡng Vàng`** (`Ngưỡng Đỏ < Ngưỡng Vàng`).
- **Tại sao lại khóa chặt chỉ trong `1 – 5` ngày?** Vì Vùng Đỏ đi kèm xả giá kịch sàn `40–50%` (rất sát hoặc dưới giá vốn):
  - Không thể nhập `0` ngày (vì `≤ 0` ngày là đã hết hạn `EXPIRED`, cấm bán tuyệt đối).
  - Khóa trần tối đa `5` ngày để tránh trường hợp đặt quá cao (ví dụ 15–20 ngày) làm hàng còn dài hạn bị ép giảm sâu `50%`, gây thiệt hại biên lợi nhuận oan. Trong bán lẻ FMCG, chỉ `1–5` ngày cuối trước hạn mới thực sự là ngưỡng khẩn cấp.
- **Lưu ý đúng theo hiện trạng mã nguồn:**
  - Tham số này được validate chặt khi tạo/sửa chi nhánh (`1–5 ngày`, nhỏ hơn Ngưỡng Vàng), lưu vào `store_profile.critical_warning_days` và ghi log `AuditLogs`.
  - Hiện tại điều kiện phân loại `RED` trong SQL View `vw_Batches_ShelfLife_Alerts` và domain `ShelfLife.js` đang áp dụng thống nhất chuẩn SSOT là **`daysLeft <= 3`**, chưa đọc động theo từng dòng chi nhánh riêng lẻ.

---

## Tóm tắt dòng thời gian 1 lô hàng đi qua 4 tham số

```text
[NSX] ─────────► [Ngày nhập từ DC] ──────────────► [Còn ≤ Ngưỡng Vàng] ──► [Còn ≤ Ngưỡng Đỏ] ──► [HSD (≤ 0d)]
                     │                                     │                       │                   │
         Kiểm tra RSL ≥ Min RSL DC (%)             Vùng VÀNG (Cảnh báo)     Vùng ĐỎ (Nguy kịch)   EXPIRED (Khóa bán)
         (< 70% => Từ chối nhận hàng)              Đảo kệ + Giảm 15–30%     Xả sâu 40–50%         Tiêu hủy tính lỗ

Song song ở kho đặt bù hàng:
Khi [Tồn hiện có] chạm mốc  ROP = (Bán/ngày × Lead Time) + Safety Stock  ──►  Hệ thống báo đặt PO mới trước Lead Time ngày.
```

---

## Cách tự test nhanh trên web để thấy hiệu lực
1. **Test `Min RSL DC (%)`:**
   - Vào **02. Store Management** (tài khoản `admin`) → Sửa chi nhánh đang test, đổi **Min RSL DC = `80`**, bấm Lưu.
   - Sang **03. Inventory Management** → Bấm **`Nhập kho`**, chọn 1 sản phẩm, nhập ngày sao cho RSL tính ra khoảng `75%` → Hệ thống lập tức báo lỗi **không đạt chuẩn tối thiểu 80%** và mở nút lập Biên bản từ chối.
2. **Test `Lead Time (ngày)`:**
   - Đổi **Lead Time** của chi nhánh từ `1` lên `5` ngày, bấm Lưu.
   - Sang **05. Smart Ordering** → Tích chọn sản phẩm tạo đơn PO hoặc xem cột ROP: ngày dự kiến giao hàng tự dời thành `Hôm nay + 5 ngày` và ngưỡng `ROP` tăng lên tương ứng.
3. **Test ranh giới phân quyền (`SoD`):**
   - Đăng nhập bằng tài khoản `manager` (`123456`) vào **02. Store Management** → Khung `Tham số Vận hành & Ngưỡng An toàn` bị ẩn không cho sửa để tránh nhân sự cửa hàng tự hạ ngưỡng kiểm soát chất lượng nhập hàng.
