# -*- coding: utf-8 -*-
"""
Docs/Scripts/update_section_15_md.py
Nâng cấp và chuẩn hóa Mục 15 trong tài liệu Đặc tả Markdown SSOT:
Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md
"""
import sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

md_path = 'Docs/Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md'

with open(md_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '# 15. Quản lý lịch trực và bàn giao ca làm việc'
end_marker = '# 16. Phân quyền chức năng (RBAC Matrix)'
if end_marker not in content:
    end_marker = '## 16.'
if end_marker not in content:
    end_marker = '# 16.'

if start_marker not in content:
    print('Lỗi: Không tìm thấy điểm đánh dấu bắt đầu của Mục 15!')
    sys.exit(1)

pre = content.split(start_marker)[0]

# Tìm phần sau Mục 15
remaining = content.split(start_marker)[1]
if '# 16.' in remaining:
    post = '# 16.' + remaining.split('# 16.', 1)[1]
elif '## 16.' in remaining:
    post = '## 16.' + remaining.split('## 16.', 1)[1]
else:
    print('Lỗi: Không tìm thấy điểm đánh dấu kết thúc của Mục 15!')
    sys.exit(1)

new_sec15 = """# 15. Quản lý lịch trực và bàn giao ca làm việc (Shift Handover & Staff Scheduling SOP)

Quy trình bàn giao ca trực điện tử khép kín (Shift Handover SOP) là mắt xích vận hành quan trọng bảo vệ tính liên tục của chuỗi cung ứng chống lãng phí tại Cửa hàng Bán lẻ LHU Mart (`RETAIL-STORE-01`). Mọi số liệu doanh thu tiền két quầy POS, trạng thái các lô hàng cận date (Vùng Đỏ, Vùng Vàng) trên quầy kệ, tiến độ đảo kệ mặt tiền FEFO và số lượng hàng hỏng cách ly chờ tiêu hủy bắt buộc phải được kiểm đếm, đối chiếu thực tế và ký biên bản điện tử bàn giao giữa hai ca làm việc. Quy trình này gắn liền với 3 chế tài trách nhiệm nghiêm ngặt nhằm triệt tiêu tối đa rủi ro sót hàng quá hạn và thất thoát tài sản.

---

## 15.1 Mô hình Ca Trực Chuẩn & Cơ Cấu Phân Công Ca (Store Shift Scheduling Model)

### 15.1.1 Khung giờ vận hành 2 ca tiêu chuẩn
Cửa hàng LHU Mart mở cửa phục vụ từ 06:00 đến 22:00 hàng ngày, được phân chia thành 2 ca làm việc tiêu chuẩn kéo dài 8 tiếng:

| Ca Trực (`ShiftType`) | Khung Giờ Làm Việc | Trọng Tâm Nghiệp Vụ Vận Hành |
| :--- | :---: | :--- |
| **Ca Sáng (`MORNING`)** | **06:00 – 14:00** | Mở cửa quầy bán lẻ POS; tiếp nhận đợt xe tải DC Biên Hòa giao hàng sáng sớm (kiểm soát RSL $\ge 70\%$); rà soát quầy kệ mát; kiểm kê hạn dùng đầu ngày. |
| **Ca Chiều (`AFTERNOON`)** | **14:00 – 22:00** | Phục vụ khung giờ cao điểm mua sắm tan tầm; kích hoạt Quick Markdown sâu ($40\% - 50\%$) cho các lô Vùng Đỏ; hoàn tất đảo kệ mặt tiền; kiểm đếm tiền két và chốt ca đóng cửa. |

Hệ thống tự động nhận diện ca trực thời gian thực dựa trên đồng hồ máy chủ:
$$\text{ShiftType} = \begin{cases} \text{MORNING} & \text{khi } 6 \le \text{CurrentHour} < 14 \\ \text{AFTERNOON} & \text{khi } 14 \le \text{CurrentHour} < 22 \text{ (hoặc ngoài giờ)} \end{cases}$$

### 15.1.2 Định biên nhân sự tối thiểu mỗi ca trực
Nhằm đảm bảo tuân thủ nguyên tắc Tách biệt Trách nhiệm (Separation of Duties - SoD), mỗi ca trực bắt buộc phải có mặt tối thiểu 3 nhân sự thuộc các vai trò nghiệp vụ:
1. **01 Cửa hàng trưởng / Quản lý ca trực (`STORE_MANAGER` hoặc `ADMIN`):** Giám sát chung, giải quyết sự cố, thẩm quyền phê duyệt nhận hàng DC, duyệt tiêu hủy và ký chốt Sổ hao hụt tài chính.
2. **01 Nhân viên Thu ngân chính (`CASHIER`):** Trực quầy bán lẻ POS, áp dụng chính sách giảm giá Quick Markdown, kiểm đếm tiền mặt két thu ngân khi hết ca.
3. **01 Nhân viên Kho & Quầy kệ (`WAREHOUSE_STAFF`):** Tiếp nhận bốc dỡ xe tải DC, rà soát hạn dùng, thực hiện SOP 5 bước đảo lô cận date ra sát mép mặt tiền kệ và chuyển hàng hư hỏng vào khu cách ly.

---

## 15.2 Quy trình 4 Bước Bàn giao Ca Trực Điện tử (Electronic Shift Handover SOP)

```mermaid
flowchart TD
    Start(["Bắt đầu hết ca trực"]) --> Step1["Bước 1: Chốt ca POS & Kiểm đếm Tiền mặt két<br/>(Đếm chi tiết 6 mệnh giá polymer, đối soát lệch két)"]
    Step1 --> Step2["Bước 2: Rà soát Danh sách Lô Cận Date<br/>(Kiểm tra tem Markdown lô Đỏ, xác nhận đảo kệ lô Vàng)"]
    Step2 --> Step3["Bước 3: Bàn giao Thùng Hàng Chờ Tiêu Hủy<br/>(Kiểm đếm SL & Tổng thiệt hại vốn khu cách ly)"]
    Step3 --> Step4["Bước 4: Ký Xác Nhận Biên Bản Điện Tử<br/>(Cam kết 3 chế tài, sinh mã SH-xxxxxx, lưu AuditLogs)"]
    Step4 --> PrintDoc["In Biên bản Bàn giao Ca K80 / A4<br/>(Kẹp chứng từ kế toán đối soát ca)"]
    PrintDoc --> Finish(["Hoàn tất giao ca & Chuyển giao trách nhiệm"])
```

### Bước 1 – Chốt ca POS & Kiểm đếm Tiền mặt Két thu ngân:
1. Hệ thống tự động truy vấn tổng doanh số bán lẻ thời gian thực phát sinh trong ca trực qua API `GET /api/shift-handover/summary`:
   $$ExpectedPosCash = \sum_{t \in ShiftSales} TotalAmount_t$$
2. Thu ngân ca trước thực hiện kiểm đếm tiền mặt vật lý trong két thu ngân theo bảng kê 6 mệnh giá tiền polymer VND lưu hành:
   - $500.000\text{ đ}, 200.000\text{ đ}, 100.000\text{ đ}, 50.000\text{ đ}, 20.000\text{ đ}, 10.000\text{ đ}$ kèm mục tiền lẻ/tiền xu khác ($OtherCash$).
3. Công thức tính tổng tiền mặt đếm thực tế ($ActualCash$):
   $$ActualCash = \sum_{i=1}^{6} (Denomination_i \times Count_i) + OtherCash$$
4. Công thức đối soát chênh lệch doanh số tiền két tự động:
   $$\Delta Cash = ActualCash - ExpectedPosCash$$
5. Phân loại 3 kịch bản đối soát:
   - $\Delta Cash = 0$: **Khớp chuẩn 100% (Balanced)** – Hệ thống hiển thị huy hiệu xanh an toàn.
   - $\Delta Cash > 0$: **Dư tiền két (Cash Surplus)** – Thu ngân ghi chú lý do (khách không lấy tiền lẻ thừa, tip...).
   - $\Delta Cash < 0$: **Thiếu hụt tiền két (Cash Deficit)** – Hệ thống kích hoạt cảnh báo đỏ; yêu cầu Thu ngân giải trình và bồi hoàn theo quy chế tài chính.

### Bước 2 – Rà soát Danh sách Lô Cận Date trên Quầy kệ (Vùng Đỏ & Vùng Vàng):
1. Hệ thống tự động lọc toàn bộ các lô thuộc Vùng Đỏ ($0 < DaysLeft \le 3$) và Vùng Vàng ($3 < DaysLeft \le WarningDays$).
2. Nhân viên giao ca và nhận ca cùng di chuyển ra quầy kệ thực tế kiểm tra:
   - Các lô Vùng Vàng đã hoàn tất SOP 5 bước đảo ra sát mép mặt tiền kệ (`is_shelf_rotated = true`) trước các lô date xa hay chưa.
   - Các lô Vùng Đỏ đã được dán tem chiết khấu Quick Markdown ($40\% - 50\%$) và gom về đầu kệ hoặc quầy xả hàng trong ngày hay chưa.
3. Nhân viên tick xác nhận từng lô trên giao diện [`ShiftHandoverView.jsx`](file:///c:/thuyet%20minh/Frontend/src/components/ShiftHandoverView.jsx) để chuyển giao trách nhiệm theo dõi.

### Bước 3 – Bàn giao Thùng hàng Chờ Tiêu hủy tại Khu vực Cách ly:
1. Hệ thống tự động tổng hợp danh sách các phiếu đề xuất tiêu hủy `PENDING` (chưa duyệt) phát sinh trong ca trực.
2. Kiểm đếm thực tế số lượng sản phẩm ($QuantityDisposed$) và đối chiếu tổng thiệt hại vốn ($\sum CostLoss$) tại thùng cách ly.
3. Cam kết toàn bộ hàng hóa hư hỏng, rách bao bì, quá date đã được rút khỏi kệ trưng bày, tuyệt đối không để lẫn lộn với hàng đang bán.

### Bước 4 – Ký Biên bản Bàn giao Điện tử & Lưu vết Kiểm toán Bất biến:
1. Người bàn giao (`handoverPerson`) và Người tiếp nhận (`receiverPerson`) cùng ký xác nhận điện tử trên phần mềm.
2. Hệ thống hiển thị rõ ràng thông báo cam kết tuân thủ 3 Chế tài kỷ luật (Mục 15.3).
3. Thu ngân bấm nút **"Ký Xác Nhận Bàn Giao Ca"** (`POST /api/shift-handover`), hệ thống cấp mã định danh phiên bàn giao bất biến `SH-[YYYYMMDD]-[Mã số ngẫu nhiên]` và lưu vết vĩnh viễn vào `system_audit_logs` (`action_type = 'SHIFT_HANDOVER'`).

---

## 15.3 Khung 3 Chế tài Trách nhiệm & Ràng buộc Kỷ luật (Disciplinary & Compliance Framework)

Nhằm đảm bảo tính nghiêm minh và trách nhiệm cá nhân trong việc chống lãng phí và bảo vệ an toàn thực phẩm, hệ thống hiển thị cố định và bắt buộc nhân viên cam kết 3 chế tài kỷ luật tại Bước 4 của quy trình bàn giao:

| STT | Hành Vi Vi Phạm Nghiệp Vụ | Mức Độ Rủi Ro | Chế Tài Xử Lý & Bồi Thường Trách Nhiệm |
| :---: | :--- | :---: | :--- |
| **1** | **Sơ suất để lọt hàng hết hạn bán cho khách** | **Đặc biệt nghiêm trọng** (Vi phạm ATTP & Rule 5) | Khiển trách bằng văn bản, đình chỉ quyền thu ngân quầy POS; bồi thường $100\%$ giá trị đơn hàng cho khách và chịu chi phí đổi trả/chăm sóc khách hàng. |
| **2** | **Không thực hiện đảo lô cận date ra mặt tiền** | **Nghiêm trọng** (Vi phạm FEFO & Rule 10) | Trừ điểm chuyên cần tháng của nhân viên kho & kệ phụ trách ca trực; yêu cầu thực hiện lại SOP đảo kệ ngay lập tức dưới sự giám sát của Cửa hàng trưởng. |
| **3** | **Tự ý vứt bỏ hàng không lập phiếu trên phần mềm** | **Nghiêm trọng** (Thất thoát vốn & Vi phạm Rule 6) | Buộc bồi thường $100\%$ giá trị vốn tổn thất ($CostLoss = Quantity \times ImportPrice$); nếu tái phạm chuyển hồ sơ xử lý kỷ luật lao động về hành vi làm thất thoát tài sản doanh nghiệp. |

---

## 15.4 Cấu trúc Chứng từ Biên bản Bàn giao Ca Điện tử & In Phiếu K80 / A4

Mọi phiên bàn giao ca sau khi hoàn tất Bước 4 đều tự động sinh chứng từ kế toán điện tử đầy đủ tính pháp lý:

1. **Cấu trúc Mã Phiên Bàn giao:**
   $$\text{HandoverCode} = \text{SH-}[\text{YYYYMMDD}]-[\text{Mã 4-6 số ngẫu nhiên}]$$
   *Ví dụ:* `SH-20261105-839210`.
2. **Nội dung hiển thị trên Biên bản Bàn giao:**
   - Tiêu đề: `CỬA HÀNG BÁN LẺ TIỆN LỢI LHU MART - BIÊN BẢN BÀN GIAO CA TRỰC ĐIỆN TỬ`
   - Mã phiên bàn giao, Thời gian thực hiện, Tên ca trực (Ca Sáng / Ca Chiều).
   - Họ tên và chức vụ của **Người Bàn Giao (Ca Trước)** và **Người Tiếp Nhận (Ca Sau)**.
   - **Bảng đối soát tài chính:** Doanh số POS ghi nhận, Tiền mặt thực tế kiểm đếm trong két, Chênh lệch tiền két ($\Delta Cash$).
   - **Bảng kiểm soát hàng cận date & hư hỏng:** Số lượng lô Đỏ, Số lượng lô Vàng, Số lượng sản phẩm chờ tiêu hủy cách ly, Tổng thiệt hại vốn chờ duyệt.
   - Ghi chú hiện trường ca trực và cam kết trách nhiệm tuân thủ 3 chế tài kỷ luật.
   - Chữ ký điện tử của hai nhân sự giao – nhận ca và xác nhận của Cửa hàng trưởng.
3. **Mẫu in biên bản chuyên biệt:**
   - Hỗ trợ in trực tiếp trên máy in nhiệt K80 (kẹp cùng báo cáo Z-Report của máy POS) hoặc in khổ A4 lưu trữ tại phòng quản lý.

---

## 15.5 Ma trận Phân quyền SoD & Nhật ký Kiểm toán Bất biến (Rule 11)

### 15.5.1 Ma trận phân quyền 4 vai trò đối với nghiệp vụ Bàn giao Ca

| Tác Vụ Nghiệp Vụ Bàn Giao Ca | Quản Trị Viên (`ADMIN`) | Cửa Hàng Trưởng (`STORE_MANAGER`) | Nhân Viên Thu Ngân (`CASHIER`) | Nhân Viên Kho & Kệ (`WAREHOUSE_STAFF`) |
| :--- | :---: | :---: | :---: | :---: |
| **Kiểm đếm tiền két & Ký giao ca POS** | Toàn quyền | Giám sát & Ký duyệt | **Thực hiện chính** (Ký giao) | ❌ Không tham gia đếm tiền |
| **Rà soát lô Đỏ/Vàng & Thùng cách ly** | Toàn quyền | Giám sát & Đối chiếu | Cùng kiểm tra | **Thực hiện chính** (Đối chiếu kệ) |
| **Ký xác nhận Biên bản Bàn giao ca** | Toàn quyền | Ký duyệt ca | **Ký nhận/giao ca** | **Ký nhận/giao ca** |
| **Xử lý giải trình chênh lệch két ($\Delta Cash \ne 0$)** | Toàn quyền | **Thẩm quyền chính** | Giải trình lý do | Không có thẩm quyền |
| **Tra cứu Lịch sử Biên bản Bàn giao ca** | Toàn quyền xem | Toàn quyền xem | Xem biên bản ca mình | Xem biên bản ca mình |

### 15.5.2 Nhật ký kiểm toán bất biến (Rule 11 SSOT)
Hành vi bàn giao ca trực được ghi nhận vĩnh viễn vào bảng `system_audit_logs`:
- `action_type = 'SHIFT_HANDOVER'`
- `entity_name = 'shifts'`
- `entity_id = [HandoverCode]`
- `description = 'HANDOVER_JSON:{...}'` lưu giữ toàn bộ snapshot đối soát tiền mặt, số lô cận date, số lượng hàng hủy và ghi chú của ca trực phục vụ thanh tra và truy vết trách nhiệm cá nhân bất kỳ lúc nào.

---

"""

full_content = pre + new_sec15 + post

with open(md_path, 'w', encoding='utf-8') as f:
    f.write(full_content)

print(f"Cập nhật thành công Mục 15 vào file Markdown SSOT: {md_path}")

