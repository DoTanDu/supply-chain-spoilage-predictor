# -*- coding: utf-8 -*-
"""
Docs/Scripts/update_section_14_md.py
Nâng cấp và chuẩn hóa Mục 14 trong tài liệu Đặc tả Markdown SSOT:
Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md
"""
import sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

md_path = 'Docs/Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md'

with open(md_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '# 14. Quản lý tiêu hủy & Sổ hao hụt tài chính (Spoilage Loss Ledger)'
end_marker = '# 15. Quản lý lịch trực và bàn giao ca làm việc'

if start_marker not in content or end_marker not in content:
    print('Lỗi: Không tìm thấy điểm đánh dấu bắt đầu hoặc kết thúc của Mục 14!')
    sys.exit(1)

pre = content.split(start_marker)[0]
post = content.split(end_marker)[1]

new_sec14 = """# 14. Quản lý tiêu hủy & Sổ hao hụt tài chính (Spoilage Loss Ledger – Rule 6 SSOT)

Sổ hao hụt tài chính (Spoilage Loss Ledger) là công cụ pháp lý và hạch toán kế toán cốt lõi của nền tảng Bán lẻ Chống Lãng phí LHU Mart (`RETAIL-STORE-01`). Mọi số lượng hàng hóa rút khỏi lưu thông tại quầy kệ do hư hỏng, quá date hoặc biến chất bắt buộc phải lập biên bản tiêu hủy, đối chiếu tồn kho vật lý tại khu cách ly và ghi nhận bất biến vào Sổ hao hụt theo giá vốn gốc. Quy trình này đảm bảo tính minh bạch tài chính tuyệt đối, phục vụ thanh tra An toàn Thực phẩm (ATTP) và quyết toán thuế Thu nhập Doanh nghiệp (TNDN) theo đúng **Quy tắc Nghiệp vụ Rule 6**.

---

## 14.1 Nguyên tắc Kế toán Tài chính & Bộ Công thức Đo lường Thiệt hại Vốn (CostLoss)

### 14.1.1 Nguyên tắc định giá theo giá vốn nhập kho
Theo chuẩn mực kế toán hàng tồn kho (VAS 02 / IFRS 2), tổn thất hàng hư hỏng rút khỏi lưu thông được ghi nhận theo **Đơn giá vốn nhập kho ($ImportPrice$)**, tuyệt đối **không sử dụng giá bán lẻ niêm yết ($SellingPrice$)**. Việc ghi nhận đúng giá vốn giúp loại trừ doanh thu giả định và biên lợi nhuận chưa thực hiện, phản ánh chính xác dòng vốn lưu động thực tế bị chôn vùi hoặc mất trắng của cửa hàng bán lẻ.

### 14.1.2 Bộ công thức toán học đo lường thiệt hại và tỷ lệ hao hụt

1. **Công thức tính thiệt hại vốn của từng biên bản tiêu hủy ($CostLoss$):**
   $$CostLoss_r = QuantityDisposed_r \times ImportPrice_r$$
   *Trong đó:*
   - $QuantityDisposed_r$: Số lượng sản phẩm thực tế bị tiêu hủy trong biên bản $r$ ($QuantityDisposed \in \mathbb{N}^+$).
   - $ImportPrice_r$: Đơn giá vốn thực tế của lô hàng đó được kế thừa bất biến từ bảng `batches` khi xe tải DC Biên Hòa giao đến cửa hàng.

2. **Tổng thiệt hại vốn tích lũy trong kỳ kế toán ($T$):**
   $$TotalCostLoss = \sum_{r \in Records_T} CostLoss_r = \sum_{r \in Records_T} (QuantityDisposed_r \times ImportPrice_r)$$

3. **Tỷ lệ hao hụt lãng phí toàn diện ($SpoilageRate\%$):**
   $$SpoilageRate (\%) = \frac{TotalCostLoss}{TotalRevenue + TotalCostLoss} \times 100\%$$
   *Trong đó:*
   - $TotalRevenue$: Tổng doanh thu thực tế thu được tại quầy POS trong kỳ kế toán ($TotalRevenue = \sum SalesTotal$).
   - *Ngưỡng kiểm soát mục tiêu:* Duy trì $SpoilageRate < 1.5\%$. Nếu tỷ lệ vượt ngưỡng báo động $2.5\%$, hệ thống kích hoạt cảnh báo đỏ trên Dashboard và yêu cầu Cửa hàng trưởng rà soát lại quy trình bảo quản, kích hoạt sớm Quick Markdown hoặc giảm sản lượng đặt hàng ROP gửi DC Biên Hòa.

---

## 14.2 Danh mục 3 Lý do Tiêu hủy Chuẩn hóa & Quy chuẩn Phân loại

Nhằm phục vụ phân tích nguyên nhân gốc rễ (Root Cause Analysis - RCA) và hạch toán chứng từ thuế, hệ thống cố định danh mục 3 lý do tiêu hủy chuẩn hóa:

| Mã Lý Do (`Reason`) | Tên Hiển Thị | Tiêu Chuẩn Nhận Diện Nghiệp Vụ | Biện Pháp Khắc Phục & Ngăn Ngừa |
| :---: | :--- | :--- | :--- |
| **`EXPIRED`** | **Hàng Hết Hạn Sử Dụng** | Lô hàng có $DaysLeft \le 0$ trên quầy kệ; hệ thống tự động kích hoạt Expiry Watchdog khóa cứng xuất bán POS (Rule 5). | Tăng tốc độ đảo kệ mặt tiền (Rule 10), kích hoạt Quick Markdown sâu ($40\% - 50\%$) từ Vùng Đỏ, hiệu chỉnh giảm hệ số ngoại cảnh trong dự báo ROP. |
| **`DAMAGED`** | **Hư Hỏng Bao Bì Vật Lý** | Sản phẩm bị móp méo vỏ hộp, rách seal, nứt vỡ bao bì trong quá trình bốc xếp dỡ từ xe tải DC hoặc do khách hàng làm rơi vỡ tại quầy kệ. | Huấn luyện lại thao tác xếp dỡ của nhân viên kho; lập biên bản từ chối nhận hàng DC nếu phát hiện rách vỡ ngay tại cửa kho xe tải. |
| **`SPOILED`** | **Biến Chất / Hư Hỏng Sinh Học** | Sản phẩm bị chua, lên men sớm, nổi bọt hoặc đóng váng dù còn hạn sử dụng in trên bao bì (thường gặp ở nhóm Sữa tươi, Sữa chua, Bánh tươi). | Kiểm tra nhiệt độ tủ mát bảo quản ($2 - 4^\circ\text{C}$); kiểm tra nhiệt độ thùng xe tải lạnh DC Biên Hòa lúc giao nhận. |

---

## 14.3 Quy trình Phê duyệt 2 Bước & Tách biệt Trách nhiệm (Two-Phase Approval SOP & SoD)

Nhằm ngăn chặn triệt để hành vi tiêu cực, thất thoát nội bộ hoặc tự ý vứt bỏ hàng hóa trên quầy kệ, hệ thống áp dụng cơ chế phê duyệt 2 pha khép kín với ma trận tách biệt trách nhiệm (Separation of Duties - SoD):

```mermaid
sequenceDiagram
    autonumber
    actor NV as Nhân viên (Thu ngân / Kho)
    participant UI as Giao diện Tiêu Hủy (DisposalFormModal)
    participant BE as Backend Use Case (Create / Approve)
    participant DB as SQL Server LocalDB
    actor QL as Cửa hàng trưởng (Store Manager)

    NV->>UI: Phát hiện hàng hỏng/quá date -> Nhập số lượng & Lý do
    NV->>UI: Bấm "Lập Đề Xuất Tiêu Hủy" (POST /api/spoilage)
    UI->>BE: CreateDisposalRecordUseCase
    BE->>DB: INSERT spoilage_records (Trạng thái: PENDING, approved_by = NULL)
    Note over DB: Tồn kho batches CHƯA BỊ TRỪ (Bảo vệ tài sản)
    BE-->>UI: Cấp mã phiếu SPOIL-xxxx (Chờ duyệt)

    QL->>QL: Đến Khu cách ly kiểm tra số lượng thực tế & bao bì
    QL->>UI: Mở Sổ Hao Hụt -> Bấm "Phê Duyệt & Chốt Sổ" (POST /api/spoilage/:id/approve)
    UI->>BE: ApproveDisposalRecordUseCase
    BE->>DB: BEGIN TRANSACTION (UPDLOCK, ROWLOCK)
    BE->>DB: UPDATE batches SET current_quantity = current_quantity - Qty
    BE->>DB: UPDATE spoilage_records SET approved_by = QL.id
    opt Nếu current_quantity = 0
        BE->>DB: UPDATE batches SET status = 'DISPOSED'
    end
    BE->>DB: INSERT system_audit_logs (SPOILAGE_DISPOSAL / APPROVE_DISPOSAL)
    BE->>DB: COMMIT TRANSACTION
    BE-->>UI: Xác nhận chốt Sổ hao hụt & Mở Modal In Biên Bản K80 / A4
```

### Chi tiết 2 Pha Xử lý:

1. **Pha 1 – Lập Đề xuất Tiêu hủy (Pending Draft Phase):**
   * Người thực hiện: `CASHIER`, `WAREHOUSE_STAFF` (hoặc `STORE_MANAGER`, `ADMIN`).
   * Nhân viên kiểm đếm số lượng hàng hỏng thực tế, mang vào **Khu vực Cách ly Tiêu hủy** của cửa hàng, mở [`DisposalFormModal.jsx`](file:///c:/thuyet%20minh/Frontend/src/components/DisposalFormModal.jsx) chọn đúng lô hàng, nhập số lượng đề xuất hủy ($QuantityDisposed \le CurrentQuantity$) và chọn lý do chuẩn hóa.
   * Bản ghi được chèn vào bảng `spoilage_records` với trường `approved_by = NULL` (Trạng thái `PENDING`).
   * **Ràng buộc an toàn:** Tồn kho trong bảng `batches` **tuyệt đối chưa bị khấu trừ** ở pha này để tránh trường hợp nhân viên tự ý xóa sổ hàng hóa mà không có sự kiểm tra thực tế của quản lý.

2. **Pha 2 – Kiểm tra Thực tế & Phê duyệt Chốt Sổ (Approval & Ledger Closing Phase):**
   * Người thực hiện: Chỉ `STORE_MANAGER` hoặc `ADMIN` có thẩm quyền phê duyệt.
   * Cửa hàng trưởng trực tiếp đối chiếu hàng thực tế trong thùng cách ly với thông tin đề xuất trên phần mềm.
   * Khi quản lý bấm **"Phê duyệt & Chốt sổ"**, hệ thống mở **SQL Server Transaction** thực thi:
     * Cập nhật `approved_by = ManagerId` và `approved_at = GETDATE()`.
     * Khấu trừ trực tiếp số lượng tồn: `current_quantity = current_quantity - quantity_disposed`.
     * Nếu tồn kho chạm mức $0$, cập nhật trạng thái lô thành `DISPOSED` (kết thúc vòng đời).
     * Ghi nhận dòng kiểm toán bất biến `APPROVE_DISPOSAL` vào bảng `system_audit_logs`.
   * *Ngoại lệ xử lý nhanh:* Nếu người trực tiếp lập phiếu là `STORE_MANAGER` hoặc `ADMIN`, hệ thống tự động gán `approved_by` ngay khi tạo và kích hoạt trừ kho trong cùng một giao dịch nguyên tử.

---

## 14.4 Quy chuẩn Vòng đời Lô Hàng: Chuyển Trạng thái DISPOSED (Rule 6 & Rule 5)

Trạng thái `DISPOSED` là trạng thái cuối cùng (Terminal State) trong máy trạng thái vòng đời của một lô hàng FMCG:

1. **Ràng buộc kiểm tra tồn kho:**
   $$\text{QuantityDisposed} \le \text{CurrentQuantity}$$
   Hệ thống ném mã lỗi HTTP `400 ERR_DISPOSAL_EXCEEDS_STOCK` nếu nhân viên nhập số lượng tiêu hủy lớn hơn lượng tồn kho thực tế của lô.
2. **Kích hoạt trạng thái DISPOSED:**
   * Khi $\text{QuantityDisposed} = \text{CurrentQuantity}$ (tiêu hủy toàn bộ lượng tồn còn lại), hệ thống cập nhật:
     ```sql
     UPDATE batches
     SET current_quantity = 0,
         status = 'DISPOSED'
     WHERE id = @BatchId;
     ```
   * Lô hàng ở trạng thái `DISPOSED` vĩnh viễn bị loại khỏi mọi truy vấn xuất bán POS, không xuất hiện trong gợi ý FEFO, không cho phép kích hoạt Quick Markdown và chỉ xuất hiện trong báo cáo lịch sử và Sổ hao hụt tài chính.

---

## 14.5 Quy chuẩn Chứng từ Biên bản Tiêu hủy Điện tử & In Phiếu K80 / A4

Mọi nghiệp vụ tiêu hủy sau khi được phê duyệt đều phải sinh chứng từ kế toán điện tử đầy đủ tính pháp lý:

1. **Cấu trúc Mã Biên bản Tiêu hủy chuẩn hệ thống:**
   $$\text{RecordCode} = \text{SPOIL}-\text{[YYYYMMDD]}-\text{[Mã 4 số ngẫu nhiên]}$$
   *Ví dụ:* `SPOIL-20261105-5367`. Mã biên bản là khóa định danh duy nhất (UNIQUE) trên toàn hệ thống.
2. **Nội dung hiển thị trên Biên bản Tiêu hủy:**
   - Tiêu đề: `CỬA HÀNG BÁN LẺ TIỆN LỢI LHU MART - BIÊN BẢN TIÊU HỦY HÀNG HỎNG & HAO HỤT`
   - Mã biên bản, Thời gian thực hiện, Tên sản phẩm, Mã vạch SKU, Đơn vị tính.
   - Mã lô chuẩn hệ thống (`LOT-DC-xxxx`), Ngày sản xuất, Hạn sử dụng.
   - Số lượng tiêu hủy thực tế, Đơn giá vốn nhập kho ($ImportPrice$).
   - **Tổng thiệt hại vốn tổn thất ($CostLoss = Quantity \times ImportPrice$).**
   - Lý do tiêu hủy (`EXPIRED` / `DAMAGED` / `SPOILED`) kèm ghi chú mô tả chi tiết hiện trạng bao bì.
   - Định danh và chữ ký điện tử của **Người lập đề xuất** và **Cửa hàng trưởng ký duyệt**.
3. **Mẫu in biên bản chuyên biệt:**
   - Hỗ trợ xem trước và in tức thì qua [`PrintSpoilageReceiptModal.jsx`](file:///c:/thuyet%20minh/Frontend/src/components/PrintSpoilageReceiptModal.jsx) trên máy in nhiệt K80 hoặc máy in văn phòng A4 kẹp hồ sơ kế toán quyết toán thuế.

---

## 14.6 Ma trận Phân quyền SoD & Nhật ký Kiểm toán Bất biến (Rule 11)

### 14.6.1 Ma trận phân quyền 4 vai trò (RBAC / SoD Matrix)

| Tác Vụ Nghiệp Vụ Tiêu Hủy | Quản Trị Viên (`ADMIN`) | Cửa Hàng Trưởng (`STORE_MANAGER`) | Nhân Viên Thu Ngân (`CASHIER`) | Nhân Viên Kho & Kệ (`WAREHOUSE_STAFF`) |
| :--- | :---: | :---: | :---: | :---: |
| **Lập đề xuất tiêu hủy hàng hỏng (Tạo phiếu PENDING)** | Toàn quyền (Duyệt ngay) | Toàn quyền (Duyệt ngay) | **Được phép** (Chờ quản lý duyệt) | **Được phép** (Chờ quản lý duyệt) |
| **Trực tiếp kiểm tra hàng cách ly & Phê duyệt chốt sổ** | Toàn quyền phê duyệt | **Thẩm quyền chính** | ❌ Cấm tuyệt đối (`403 Forbidden`) | ❌ Cấm tuyệt đối (`403 Forbidden`) |
| **Từ chối / Hủy bỏ phiếu đề xuất không hợp lệ** | Toàn quyền hủy | **Thẩm quyền chính** | ❌ Cấm tuyệt đối | ❌ Cấm tuyệt đối |
| **Xem Sổ hao hụt tài chính & Thiệt hại vốn ($CostLoss$)** | Toàn quyền xem | Toàn quyền xem | ❌ Bị che dữ liệu tài chính | ❌ Bị che dữ liệu tài chính |
| **In Biên bản Tiêu hủy K80 / A4** | Được phép | Được phép | In phiếu do mình lập | In phiếu do mình lập |

### 14.6.2 Nhật ký kiểm toán bất biến (Rule 11 SSOT)
Bảng `system_audit_logs` lưu giữ 2 mốc vết giao dịch không thể tẩy xóa:
1. `SPOILAGE_DISPOSAL`: Ghi nhận khi phiếu được lập, lưu rõ người đề xuất, số lượng, lô hàng và lý do.
2. `APPROVE_DISPOSAL`: Ghi nhận khi Cửa hàng trưởng ký duyệt, lưu rõ người duyệt, tổng giá trị vốn tổn thất ($CostLoss$) và số lượng thực trừ kho.

---

"""

updated_content = pre + new_sec14 + "# 15. Quản lý lịch trực và bàn giao ca làm việc" + post

with open(md_path, 'w', encoding='utf-8') as f:
    f.write(updated_content)

print("Đã nâng cấp và cập nhật thành công Mục 14 trong file Markdown SSOT!")

