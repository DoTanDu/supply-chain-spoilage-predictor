# -*- coding: utf-8 -*-
"""
Docs/Scripts/update_section_13_md.py
Nâng cấp và chuẩn hóa Mục 13 trong tài liệu Đặc tả Markdown SSOT:
Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md
"""
import sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

md_path = 'Docs/Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md'

with open(md_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '# 13. Quản lý xả hàng giảm giá (Quick Markdown) & Đảo kệ theo FEFO'
end_marker = '# 14. Quản lý tiêu hủy & Sổ hao hụt tài chính (Spoilage Loss Ledger)'

if start_marker not in content or end_marker not in content:
    print('Lỗi: Không tìm thấy điểm đánh dấu bắt đầu hoặc kết thúc của Mục 13!')
    sys.exit(1)

pre = content.split(start_marker)[0]
post = content.split(end_marker)[1]

new_sec13 = """# 13. Quản lý xả hàng giảm giá (Quick Markdown) & Đảo kệ theo FEFO (Rule 10 SSOT)

Nghiệp vụ Xả hàng Giảm giá (Quick Markdown) và Quy trình Đảo kệ Mặt tiền theo chuẩn FEFO đóng vai trò là "chiến tuyến phòng ngự cuối cùng" trong chuỗi cung ứng bán lẻ chống lãng phí tại Cửa hàng Tiện lợi LHU Mart (`RETAIL-STORE-01`). Thay vì thụ động chờ lô hàng trượt sang trạng thái hết hạn (`EXPIRED`) dẫn đến tổn thất $100\%$ giá vốn và phát sinh chi phí tiêu hủy, hệ thống chủ động trao công cụ điều hành giá linh hoạt theo thời gian thực (Dynamic Real-time Markdown) cho Cửa hàng trưởng kết hợp cùng kỷ luật trưng bày quầy kệ nghiêm ngặt của nhân viên kho.

---

## 13.1 Ý nghĩa chiến lược & Cơ chế kích hoạt giảm giá xả hàng Quick Markdown

### 13.1.1 Phân tích so sánh 3 kịch bản tài chính của lô hàng
Hệ thống thiết lập cơ chế so sánh tài chính định lượng nhằm khuyến khích hành vi xả hàng sớm thay vì để trôi date:

| Kịch bản Quản trị | Vùng Cảnh báo | Doanh thu Thu hồi ($Rev$) | Tổn thất Tài chính ($CostLoss$) | Tác động Dòng tiền & Sổ sách |
| :--- | :---: | :---: | :---: | :--- |
| **Kịch bản 1: Bán nguyên giá** | Vùng Xanh ($DaysLeft > WarningDays$) | $100\%$ Doanh thu niêm yết | $0$ VNĐ | Biên lợi nhuận gộp đạt chuẩn định mức ($25\% - 35\%$). |
| **Kịch bản 2: Quick Markdown xả hàng (Rule 10)** | Vùng Vàng / Đỏ ($0 < DaysLeft \\le WarningDays$) | $50\% - 85\%$ Doanh thu niêm yết | $0$ VNĐ (Giảm một phần biên lãi, vẫn thu hồi đủ hoặc tiệm cận giá vốn) | Thu hồi ngay lập tức $70\% - 100\%$ vốn lưu động, giải phóng quầy kệ, triệt tiêu nguy cơ rác thải thực phẩm. |
| **Kịch bản 3: Tiêu hủy quá date (Hao hụt)** | Hết hạn ($DaysLeft \\le 0$) | $0$ VNĐ | Mất trắng $100\\%$ giá trị vốn ($ImportPrice \\times Quantity$) | Chôn vốn, xói mòn lợi nhuận ròng, phát sinh chi phí đóng gói, lưu hủy và thủ tục biên bản. |

### 13.1.2 Danh mục 4 mức chiết khấu chuẩn hóa và ngưỡng kích hoạt
Nhằm ngăn chặn sự tùy tiện trong giảm giá và đảm bảo tính nhất quán trên toàn hệ thống POS, phần mềm cố định **4 mức chiết khấu chuẩn** (kèm tùy chọn $0\%$ để khôi phục nguyên giá):

| Mức Giảm Giá | Vùng Màu Áp Dụng | Điều Kiện Ngưỡng Hạn Dùng | Mục Tiêu Chiến Lược & Hành Vi Khách Hàng |
| :---: | :---: | :---: | :--- |
| **15%** | **VÙNG VÀNG** (Cảnh báo nhẹ) | $3 < DaysLeft \\le WarningDays$ | Giảm nhẹ tạo lực đẩy tiêu thụ ban đầu đối với khách mua sắm hàng ngày có kế hoạch sử dụng ngay trong tuần. |
| **30%** | **VÙNG VÀNG** (Cận kề Vùng Đỏ) | $3 < DaysLeft \\le 5$ ngày | Mức chiết khấu hấp dẫn kích thích người tiêu dùng săn deal tiết kiệm, tăng tốc độ giải phóng tồn kho. |
| **40%** | **VÙNG ĐỎ** (Nguy kịch) | $1 < DaysLeft \\le 3$ ngày | Cắt giảm sâu toàn bộ biên lợi nhuận để bảo toàn dòng tiền gốc; thu hút phân khúc khách hàng nhạy cảm về giá. |
| **50%** | **VÙNG ĐỎ** (Kịch sàn trong ngày) | $DaysLeft = 1$ ngày (hoặc ca cuối cùng) | Bán hòa vốn hoặc chấp nhận lỗ tối thiểu $5\% - 10\%$ để thu hồi vốn tức thì, tuyệt đối không để rớt sang ngày hôm sau. |
| **0%** | **VÙNG XANH** (Hủy giảm giá) | Khôi phục nguyên giá niêm yết | Áp dụng khi quản lý ấn nhầm hoặc lô hàng được điều chuyển vị trí trưng bày đặc biệt. |

### 13.1.3 Bộ công thức toán học tính toán giá bán lẻ hiệu dụng
Đơn giá bán lẻ hiệu dụng sau chiết khấu ($Price_{effective}$) và số tiền chiết khấu trên từng đơn vị sản phẩm ($DiscountAmount$) được tính toán tự động:

$$Price_{effective} = \\text{ROUND}\\left(Price_{retail} \\times \\left(1 - \\frac{DiscountPercent}{100}\\right), 0\\right)$$

$$DiscountAmount = Price_{retail} - Price_{effective} = \\text{ROUND}\\left(Price_{retail} \\times \\frac{DiscountPercent}{100}, 0\\right)$$

*Ràng buộc kỹ thuật biên:*
- $DiscountPercent \\in \\{0, 15, 30, 40, 50\\}$. Mọi giá trị khác đều bị Domain Service [`MarkdownPricingPolicy.js`](file:///c:/thuyet%20minh/Backend/src/domain/services/MarkdownPricingPolicy.js) chặn đứng và ném mã lỗi HTTP `400 ERR_INVALID_MARKDOWN`.
- $Price_{effective}$ luôn được làm tròn đến hàng đơn vị đồng và bắt buộc $Price_{effective} > 0$.
- Tuyệt đối cấm áp dụng Quick Markdown đối với các lô hàng đã hết hạn ($DaysLeft \\le 0$) hoặc đã bị tiêu hủy (`status = 'EXPIRED'` hoặc `'DISPOSED'`). Hệ thống ném lỗi HTTP `400 ERR_BATCH_EXPIRED`.

---

## 13.2 Quy trình SOP đảo kệ mặt tiền 5 bước (Shelf Rotation SOP)

### 13.2.1 Nguyên lý trưng bày FEFO tại quầy kệ vật lý
Tại cửa hàng bán lẻ, người mua hàng có xu hướng tự nhiên rút những món hàng ở hàng đầu tiên sát mép ngoài của kệ trưng bày. Nếu nhân viên chỉ đơn thuần xếp hàng mới nhập lên phía trước, các lô hàng cũ sẽ bị đẩy sâu vào bên trong góc kệ khuất tầm nhìn, dẫn đến tình trạng hàng hết hạn ngay trên kệ dù khách hàng vẫn có nhu cầu mua.

Do đó, **Quy tắc Nghiệp vụ Rule 10** bắt buộc: Tất cả các lô hàng rơi vào **Vùng Vàng** hoặc **Vùng Đỏ** phải được đảo ra vị trí mặt tiền (tiền cảnh) trưng bày của kệ, kèm dán tem Sticker giảm giá nổi bật.

```mermaid
flowchart TD
    A["Bước 1: Mở Bảng Hành Động Đảo Kệ<br/>(Lọc lô Vàng/Đỏ có is_shelf_rotated = 0)"] --> B["Bước 2: Dời Lô Date Xa (Vùng Xanh)<br/>Tạm thời đưa ra xe đẩy chuyên dụng"]
    B --> C["Bước 3: Đưa Lô Cận Date Ra Sát Mép Kệ<br/>(Vùng Vàng / Vùng Đỏ đặt tại mặt tiền)"]
    C --> D["Bước 4: Xếp Lô Date Xa Ra Phía Sau Lưng<br/>(Đúng trật tự expiry_date tăng dần)"]
    D --> E["Bước 5: Ký Xác Nhận Điện Tử Trên Phần Mềm<br/>(Cập nhật is_shelf_rotated = 1 & ghi AuditLog)"]
```

### 13.2.2 Chi tiết 5 bước chuẩn hóa vận hành (Shelf Rotation SOP)

| Thứ tự Bước | Tên Bước Thao Tác | Hành Động Cụ Thể Của Nhân Viên Kho / Quầy Kệ | Tiêu Chuẩn Nghiệm Thu Kỹ Thuật |
| :---: | :--- | :--- | :--- |
| **Bước 1** | **Tra cứu danh sách lô cần đảo kệ** | Nhân viên mở phân hệ Giám sát Hạn dùng (FEFO Monitor) hoặc Tab 2 trên Action Board, lọc danh sách các lô có cảnh báo Vàng hoặc Đỏ đang có cờ `is_shelf_rotated = 0`. | Phần mềm hiển thị chính xác Mã lô, Tên SP, Vị trí kệ, Số lượng tồn và Số ngày còn lại ($DaysLeft$). |
| **Bước 2** | **Dời tạm lô hàng date xa** | Đến đúng kệ hàng thực tế, nhấc toàn bộ các sản phẩm thuộc lô date xa (Vùng Xanh) tạm thời đặt vào khay chứa hoặc xe đẩy chuyên dụng. | Không làm dập nát, móp méo bao bì sản phẩm trong quá trình di chuyển. |
| **Bước 3** | **Đưa lô cận date ra mặt tiền** | Kéo toàn bộ sản phẩm của lô cận date (Vùng Vàng/Vùng Đỏ) xếp dàn đều ra hàng đầu tiên sát mép ngoài cùng của quầy kệ, ngay tầm với mắt nhìn của khách hàng. | Sản phẩm quay mặt logo chính diện ra ngoài; gắn kèm Tem Sticker Giảm Giá xả hàng. |
| **Bước 4** | **Xếp lô date xa ra phía sau** | Xếp các sản phẩm date xa (Vùng Xanh) từ khay chứa trở lại kệ, đặt phía sau lưng của các lô cận date vừa đảo. | Đảm bảo tính ngăn nắp, thẳng hàng, đúng sơ đồ phân bổ diện tích kệ (Planogram). |
| **Bước 5** | **Xác nhận điện tử trên phần mềm** | Mở Modal SOP Đảo Kệ trên ứng dụng, tích chọn hoàn tất 5 bước kiểm tra và bấm nút **"Xác nhận Hoàn tất Đảo Kệ"**. | Gửi `PATCH /api/batches/:id/rotate`, cập nhật `is_shelf_rotated = 1`, lưu `shelf_rotated_at = GETDATE()`, `shelf_rotated_by = CurrentUser` và ghi nhật ký kiểm toán. |

---

## 13.3 Quy chuẩn Kỹ thuật Tem Sticker Xả Hàng & In Tem Nhiệt

Mọi lô hàng sau khi được Cửa hàng trưởng phê duyệt mức chiết khấu Quick Markdown đều bắt buộc phải dán **Tem Sticker Giảm Giá** lên mặt trước của từng bao bì sản phẩm trước khi khách hàng chọn mua:

1. **Quy cách vật lý tem nhãn:**
   - Sử dụng tem tròn đường kính $35\\text{ mm}$ màu vàng chanh dạ quang hoặc tem chữ nhật viền đỏ nổi bật.
   - Chất liệu decal cảm nhiệt bám dính tốt trên bề mặt lạnh (đối với nhóm thực phẩm mát và sữa $2 - 4^\\circ\\text{C}$), không để lại keo bẩn khi bóc.
2. **Thông tin hiển thị bắt buộc trên tem:**
   - Dòng tiêu đề: `LHU MART - XẢ HÀNG CẬN DATE`
   - Huy hiệu giảm giá nổi bật font lớn: `-15%`, `-30%`, `-40%`, hoặc `-50%`.
   - Giá gốc niêm yết: In font gạch ngang (ví dụ: `~~45.000 đ~~`).
   - Giá mới thực thanh toán: In đậm font lớn màu tương phản (ví dụ: `22.500 đ`).
   - Mã lô chuẩn hệ thống (`LOT-DC-xxxx`) và Hạn sử dụng (`HSD: DD/MM/YYYY`).
   - Mã vạch phụ 1D Code 128 hoặc QR Code hỗ trợ đầu đọc tại quầy quét nhanh mã lô giảm giá.
3. **Cơ chế in tem nhiệt tích hợp:**
   - Phần mềm cung cấp cửa sổ bật ra [`PrintDiscountStickerModal.jsx`](file:///c:/thuyet%20minh/Frontend/src/components/PrintDiscountStickerModal.jsx) cho phép nhân viên chọn số lượng tem in tương ứng với số lượng tồn khả dụng của lô hàng và xuất lệnh in trực tiếp ra máy in tem nhãn nhiệt.

---

## 13.4 Đồng bộ Thời gian thực tại Quầy POS & Bẻ Lô Chuẩn FEFO

Cơ chế kết nối giữa Phân hệ Điều hành Giá (Markdown Engine) và Quầy Thu Ngân Bán Lẻ (POS Checkout Engine) được thiết kế theo thời gian thực (Zero Latency Synchronization):

1. **Hiệu lực tức thì:** Ngay khi Cửa hàng trưởng nhấn phê duyệt mức chiết khấu trên phần mềm, giá khuyến mãi $Price_{effective}$ lập tức được lưu vào trường `discount_percent` của bảng `batches` trong Microsoft SQL Server. Thu ngân tại quầy POS không cần tải lại trang hay khởi động lại thiết bị.
2. **Xuất bán chuẩn FEFO & Bẻ lô tự động (Rule 2):**
   - Khi quét mã vạch SKU sản phẩm, Động cơ POS truy vấn các lô có `expiry_date ASC`. Lô cận date nhất đang có chiết khấu Quick Markdown sẽ được ưu tiên bóc tách xuất kho trước.
   - Đơn giá trên dòng giỏ hàng POS tự động áp dụng giá $Price_{effective}$ kèm nhãn thông báo (Badge) `-30%` hoặc `-50%` màu vàng/đỏ.
   - Trường hợp khách mua số lượng lớn vượt quá số tồn của lô xả hàng, động cơ FEFO tự động bẻ đơn qua lô tiếp theo; lô cận date tính giá giảm, lô sau tính nguyên giá một cách minh bạch.
3. **Hóa đơn bán lẻ (POS Receipt):**
   - Hóa đơn in ra hiển thị rõ đơn giá niêm yết, tỷ lệ giảm giá, đơn giá sau giảm và dòng tổng kết: *"Quý khách đã tiết kiệm được: XX.XXX VNĐ nhờ chương trình Chống Lãng Phí LHU Mart"*.

---

## 13.5 Ma trận Phân quyền & Tách biệt Trách nhiệm (SoD Matrix 4 Actor)

Nghiệp vụ điều chỉnh giá bán và đảo kệ được kiểm soát chặt chẽ bằng ma trận phân quyền RBAC nhằm ngăn chặn tình trạng thất thoát doanh thu hoặc trục lợi chính sách giảm giá:

| Quyền Hạn / Tác Vụ Nghiệp Vụ | Quản Trị Viên (`ADMIN`) | Cửa Hàng Trưởng (`STORE_MANAGER`) | Nhân Viên Thu Ngân (`CASHIER`) | Nhân Viên Kho & Kệ (`WAREHOUSE_STAFF`) |
| :--- | :---: | :---: | :---: | :---: |
| **Kích hoạt Quick Markdown (15%, 30%, 40%, 50%)** | Toàn quyền (Phê duyệt & Can thiệp) | **Thẩm quyền chính** (Trực tiếp phê duyệt giá) | ❌ Cấm tuyệt đối (`403 Forbidden`) | ❌ Cấm tuyệt đối (`403 Forbidden`) |
| **Hủy chiết khấu xả hàng (Đưa về 0%)** | Toàn quyền | **Thẩm quyền chính** | ❌ Cấm tuyệt đối | ❌ Cấm tuyệt đối |
| **Thực hiện & Xác nhận SOP Đảo kệ 5 bước** | Kiểm tra & Giám sát | Phê duyệt & Đôn đốc ca trực | ❌ Không phụ trách quầy kệ | **Thẩm quyền chính** (Trực tiếp thực hiện) |
| **In Tem Sticker Giảm Giá xả hàng** | Hỗ trợ in ấn | Cho phép in tem | ❌ Không được cấp quyền | **Thẩm quyền chính** (In dán lên kệ) |
| **Thu ngân bán lẻ ghi nhận giá xả hàng** | Kiểm tra doanh thu | Giám sát báo cáo ca | **Thực thi tự động qua POS** | ❌ Không phụ trách quầy thu ngân |
| **Truy vết Nhật ký Kiểm toán (Audit Logs)** | Xem toàn diện hệ thống | Xem trong phạm vi cửa hàng | ❌ Không được xem | ❌ Không được xem |

---

## 13.6 Nhật ký Kiểm toán Bất biến (Rule 11) & Hạch toán Tài chính

Mọi biến động liên quan đến việc thay đổi giá bán và đảo kệ đều được ghi nhận vĩnh viễn vào bảng `system_audit_logs` trong CSDL Microsoft SQL Server, không thể sửa đổi hoặc xóa bỏ:

1. **Nhật ký Đổi giá Quick Markdown (`QUICK_MARKDOWN`):**
   - Cấu trúc bản ghi:
     ```json
     {
       "action": "QUICK_MARKDOWN",
       "entityName": "BATCHES",
       "entityId": "LOT-DC-MILK-20261028-01-V",
       "userId": 2,
       "userName": "Trần Thị Cửa Hàng Trưởng",
       "description": "Kích hoạt Quick Markdown giảm 30% cho Lô LOT-DC-MILK-20261028-01-V (HSD còn 4 ngày). Đơn giá điều chỉnh: 38.000 đ -> 26.600 đ.",
       "createdAt": "2026-10-29T16:45:00.000Z"
     }
     ```
2. **Nhật ký Xác nhận Đảo kệ Mặt tiền (`ROTATE_SHELF_FEFO`):**
   - Cấu trúc bản ghi:
     ```json
     {
       "action": "ROTATE_SHELF_FEFO",
       "entityName": "BATCHES",
       "entityId": "LOT-DC-MILK-20261028-01-V",
       "userId": 4,
       "userName": "Lê Văn Kho",
       "description": "Xác nhận hoàn tất SOP 5 bước đảo Lô LOT-DC-MILK-20261028-01-V ra sát mép mặt tiền kệ trưng bày.",
       "createdAt": "2026-10-29T16:50:12.000Z"
     }
     ```
3. **Ý nghĩa hạch toán tài chính:** Dữ liệu kiểm toán Quick Markdown là căn cứ pháp lý và kế toán đối soát báo cáo chênh lệch doanh thu khuyến mãi tại Cửa hàng LHU Mart, đồng thời chứng minh hiệu quả của giải pháp chống lãng phí trong việc bảo toàn tối đa dòng tiền vốn của cửa hàng.

---

"""

updated_content = pre + new_sec13 + "# 14. Quản lý tiêu hủy & Sổ hao hụt tài chính (Spoilage Loss Ledger)" + post

with open(md_path, 'w', encoding='utf-8') as f:
    f.write(updated_content)

print("Đã nâng cấp và cập nhật thành công Mục 13 trong file Markdown SSOT!")

