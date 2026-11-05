# -*- coding: utf-8 -*-
import sys

def update_section_10_md():
    path = 'Docs/Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    target = """# 10. Điều kiện kiểm tra khi bán hàng & Xuất kho

Hệ thống phải kiểm tra các điều kiện sau trước khi thực thi xuất bán:

- Sản phẩm có đang ở trạng thái kinh doanh không (is\\_active = 1).
- Cửa hàng có đang mở cửa không (Status = 'OPEN').
- Số lượng mua phải là số nguyên dương (> 0).
- Tổng tồn kho khả dụng còn hạn của sản phẩm phải >= số lượng khách mua.
- Lô hàng xuất bán phải có DaysLeft > 0 (không được xuất lô đã hết hạn).
- Tuyệt đối không cho phép current\\_quantity của bất kỳ lô nào nhỏ hơn 0.
- Nếu phát sinh tranh chấp tồn kho giữa 2 quầy POS đồng thời, cơ chế khóa UPDLOCK
 sẽ buộc giao dịch đến sau chờ và báo lỗi nếu số lượng không còn đủ."""

    replacement = """# 10. Điều kiện kiểm tra khi bán hàng & Xuất kho (Sales & Inventory Dispatch Validation Boundaries)

Giao dịch bán lẻ tại quầy POS và xuất kho trực tiếp là điểm chạm tài chính tối quan trọng. Nhằm đảm bảo dữ liệu bán lẻ, mức tồn kho và giá vốn luôn chính xác 100%, hệ thống thiết lập cơ chế kiểm soát phòng thủ chiều sâu 3 tầng (**Defense-in-Depth Architecture**) gồm 7 điều kiện biên bắt buộc và danh mục mã lỗi kỹ thuật chuẩn hóa.

## 10.1 Kiến trúc Phòng thủ Chiều sâu 3 Tầng (3-Tier Defense-in-Depth Model)

```
[TẦNG 1: PRESENTATION / FRONTEND GUARD]
   ├── Xác thực giỏ hàng POS thời gian thực (Giỏ hàng không rỗng, quantity > 0)
   ├── Store Profile Guard: Vô hiệu hóa nút thanh toán (F9) khi StoreProfile.status != 'OPEN'
   └── Khóa cứng chọn lô thủ công: Thu ngân chỉ quét Barcode SKU, FEFO tự động
          │ (HTTP POST /api/sales kèm JWT Bearer Token)
          ▼
[TẦNG 2: APPLICATION & DOMAIN BUSINESS GUARD]
   ├── Store Operational Status Guard: Kiểm tra StoreProfile.status == 'OPEN' (ném ERR_STORE_CLOSED / ERR_STORE_INVENTORY)
   ├── Product Lifecycle Guard: Kiểm tra products.is_active == 1 (ném ERR_PRODUCT_INACTIVE)
   ├── Expiry Watchdog Pre-filter: Lọc bỏ toàn bộ lô có DaysLeft <= 0 (Rule 5)
   └── FefoAllocationPolicy: Kiểm tra SUM(current_quantity) >= requestedQuantity (ném ERR_INSUFFICIENT_STOCK)
          │ (Mở SQL Server Transaction: BEGIN TRANSACTION)
          ▼
[TẦNG 3: DATABASE & CONCURRENCY LOCK GUARD (SQL SERVER LOCALDB)]
   ├── Transaction Concurrency Lock: Khóa dòng WITH (UPDLOCK, ROWLOCK) trên từng lô hàng
   ├── Invariant Zero-Negative Check: UPDATE batches WHERE current_quantity >= @qty (@@ROWCOUNT = 0 -> THROW 50001)
   ├── DDL CHECK Constraint: CONSTRAINT CK_batches_quantity CHECK (current_quantity >= 0)
   └── Atomic Commit & AuditLog: Ghi sales_history + system_audit_logs -> COMMIT TRANSACTION
```

## 10.2 Chi tiết 7 Điều kiện Biên Bắt buộc Khi Bán hàng & Xuất kho

### 1. Điều kiện 1: Trạng thái Hoạt động của Cửa hàng (Store Operational Status Guard - Rule 1 SSOT)
* **Quy chuẩn:** Cửa hàng chỉ được phép bán lẻ khi `StoreProfile.status === 'OPEN'`.
* **Trường hợp vi phạm:**
  * `CLOSED` (Đóng ca đêm): Cửa hàng hết giờ phục vụ, khóa sổ ca cuối ngày.
  * `INVENTORY` (Kiểm kê kho định kỳ): Toàn bộ kho hàng bị đóng băng số liệu vật lý để nhân viên đối soát thực tế.
  * `SUSPENDED` (Tạm đình chỉ vận hành): Kiểm tra vệ sinh ATTP hoặc bảo trì hệ thống.
* **Cơ chế xử lý:** Hệ thống lập tức từ chối xuất bán, ném mã lỗi HTTP 400 `ERR_STORE_CLOSED` hoặc `ERR_STORE_INVENTORY`. Nút bấm "Thanh toán POS" trên Frontend bị mờ và hiển thị thông điệp cảnh báo.

### 2. Điều kiện 2: Trạng thái Kinh doanh của Sản phẩm (Product Active Lifecycle Guard)
* **Quy chuẩn:** Sản phẩm phải đang ở trạng thái kinh doanh hợp lệ (`products.is_active = 1`).
* **Trường hợp vi phạm:** Sản phẩm bị tạm dừng lưu hành do nhà cung cấp thu hồi chất lượng, ngừng kinh doanh hoặc chưa hoàn tất thủ tục đăng ký tem nhãn.
* **Cơ chế xử lý:** Máy quét Barcode và ô tìm kiếm POS từ chối nhận diện sản phẩm này. Nếu cố tình gửi request qua API, hệ thống trả về HTTP 400 `ERR_PRODUCT_INACTIVE`.

### 3. Điều kiện 3: Ràng buộc Số lượng Mua là Số nguyên Dương (Positive Integer Quantity Boundary)
* **Quy chuẩn:** $quantity\_sold \in \\mathbb{Z}^+$ ($quantity\_sold > 0$ và `Number.isInteger(qty) === true`).
* **Trường hợp vi phạm:** Số lượng $\\le 0$, số lượng là số thập phân (đối với hàng tiêu dùng nhanh FMCG tính theo gói, hộp, lon, chai), chuỗi ký tự, `NaN`, `null`, `undefined`.
* **Cơ chế xử lý:** Middleware xác thực dữ liệu đầu vào chặn ngay tại tầng API Presentation, ném mã lỗi HTTP 400 `ERR_INVALID_QUANTITY`.

### 4. Điều kiện 4: Khóa cứng Hàng hết hạn & Lọc trước Phân bổ (Expiry Watchdog Pre-filter - Rule 5 SSOT)
* **Quy chuẩn:** Tuyệt đối không cho phép xuất bán bất kỳ sản phẩm nào thuộc lô hàng đã quá hạn sử dụng:
  $$\\text{DaysLeft} = \\text{DATEDIFF}(\\text{DAY}, \\text{CAST}(\\text{GETDATE()} \\text{ AS DATE}), \\text{expiry\\_date}) \\le 0$$
* **Cơ chế xử lý:** Trước khi phân bổ FEFO, truy vấn cơ sở dữ liệu và Entity `ShelfLife` tự động áp dụng bộ lọc nghiêm ngặt:
  $$\\text{WHERE expiry\\_date} > \\text{CAST(GETDATE() AS DATE) AND status IN ('ACTIVE', 'WARNING')}$$
  Mọi lô hàng $DaysLeft \\le 0$ bị loại trừ khỏi danh sách khả dụng, chuyển sang trạng thái `EXPIRED` để chuyển vào khu cách ly tiêu hủy. Nếu cố tình ép mã lô hết hạn, hệ thống ném lỗi HTTP 400 `ERR_BATCH_EXPIRED`.

### 5. Điều kiện 5: Kiểm tra Tổng Tồn kho Khả dụng còn hạn (Available Stock Availability Boundary)
* **Quy chuẩn:** Tổng số lượng tồn của tất cả các lô khả dụng còn hạn của sản phẩm phải lớn hơn hoặc bằng số lượng khách hàng mua:
  $$\\sum_{\\text{lô còn hạn}} current\\_quantity \\ge quantity\\_sold$$
* **Cơ chế xử lý:** Nếu tổng tồn kho khả dụng không đủ đáp ứng, tầng Domain ném ngoại lệ `InsufficientStockError`, API trả về HTTP 400 `ERR_INSUFFICIENT_STOCK`. Hệ thống tuyệt đối không tiến hành bẻ lô dở dang và không trừ kho bất kỳ đơn vị nào.

### 6. Điều kiện 6: Tuyệt đối Chống Tồn kho Âm (Zero-Negative Inventory Invariant - Rule 3 SSOT)
* **Quy chuẩn:** Tồn kho hiện tại của bất kỳ lô hàng nào không bao giờ được phép nhỏ hơn 0 ($current\\_quantity \\ge 0$ tại mọi thời điểm).
* **Cơ chế Bảo vệ Kép (Double Shield Protection):**
  * *Lớp 1 (Domain Policy):* Thuật toán `FefoAllocationPolicy` chỉ cho phép bẻ tối đa số lượng tồn của từng lô:
    $$qtyFromBatch = \\min(batch.current\\_quantity, remainingToAllocate)$$
  * *Lớp 2 (SQL Constraint & Atomic Update):* Câu lệnh SQL cập nhật tồn kho có điều kiện:
    ```sql
    UPDATE batches WITH (UPDLOCK, ROWLOCK)
    SET current_quantity = current_quantity - @deductQty
    WHERE id = @batchId AND current_quantity >= @deductQty;
    IF @@ROWCOUNT = 0 
      THROW 50001, N'Số lượng trừ kho vượt quá tồn kho khả dụng của lô hàng!', 1;
    ```
    Kết hợp ràng buộc toàn vẹn CSDL: `CONSTRAINT CK_batches_quantity CHECK (current_quantity >= 0)`.

### 7. Điều kiện 7: Kiểm soát Tranh chấp Đồng thời & Khóa Dòng (Concurrency Lock WITH UPDLOCK, ROWLOCK)
* **Quy chuẩn:** Khi có nhiều quầy POS thanh toán đồng thời cùng 1 sản phẩm tại cùng 1 thời điểm mili-giây, hoặc khi một quầy POS đang bán hàng trong lúc nhân viên kho đang lập phiếu tiêu hủy cùng một lô hàng:
* **Cơ chế xử lý:**
  * Hệ thống mở SQL Server Transaction ở mức cô lập cao: `BEGIN TRANSACTION ... COMMIT TRANSACTION`.
  * Áp dụng gợi ý khóa dòng: `WITH (UPDLOCK, ROWLOCK)` trên từng bản ghi lô hàng.
  * Khóa cập nhật (`UPDLOCK`) giữ độc quyền cho đến khi giao dịch thứ nhất hoàn tất (`COMMIT`). Giao dịch thứ hai đến sau buộc phải chờ (wait), sau đó đọc lại số lượng tồn kho mới nhất.
  * Nếu số lượng tồn kho sau khi trừ của giao dịch 1 không còn đủ đáp ứng cho giao dịch 2, câu lệnh `WHERE current_quantity >= @qty` sẽ có `@@ROWCOUNT = 0`, kích hoạt lệnh `THROW 50001` và `ROLLBACK TRANSACTION` an toàn cho giao dịch 2. Không bao giờ phát sinh tình trạng Over-selling hay Deadlock.

---

## 10.3 Bảng Danh mục Mã Lỗi Kỹ thuật Chuẩn hóa (Error Code Catalog)

Hệ thống trả về các mã lỗi và mã trạng thái HTTP chuẩn mực theo cấu trúc JSON:
```json
{
  "success": false,
  "statusCode": 400,
  "code": "ERR_INSUFFICIENT_STOCK",
  "message": "Tổng tồn kho khả dụng còn hạn không đủ đáp ứng số lượng khách mua!",
  "details": {
    "productId": 1,
    "requestedQuantity": 10,
    "availableQuantity": 6,
    "shortfall": 4
  }
}
```

| Mã Lỗi (Code) | HTTP Status | Thông báo Kỹ thuật (Tiếng Việt) | Nguyên nhân & Hướng giải quyết |
| :--- | :---: | :--- | :--- |
| `ERR_STORE_CLOSED` | 400 | Cửa hàng LHU Mart hiện đang đóng cửa [CLOSED]. | Kiểm tra lại ca trực, Cửa hàng trưởng mở ca qua giao diện Thiết lập cửa hàng. |
| `ERR_STORE_INVENTORY` | 400 | Cửa hàng đang trong phiên kiểm kê kho [INVENTORY]. | Tạm dừng bán lẻ tại quầy, đợi quản lý hoàn tất chốt biên bản kiểm kê. |
| `ERR_PRODUCT_INACTIVE` | 400 | Sản phẩm hiện đang tạm ngừng lưu hành kinh doanh! | Kiểm tra danh mục sản phẩm, kích hoạt lại `is_active = 1` nếu hợp lệ. |
| `ERR_INVALID_QUANTITY` | 400 | Số lượng mua không hợp lệ. Phải là số nguyên dương (> 0)! | Kiểm tra lại số lượng quét từ giỏ hàng hoặc thiết bị đọc mã vạch. |
| `ERR_BATCH_EXPIRED` | 400 | Lô hàng đã hết hạn sử dụng (DaysLeft <= 0). Khóa cứng bán POS! | Rút hàng khỏi kệ, chuyển sang khu cách ly và lập biên bản tiêu hủy (Rule 5). |
| `ERR_INSUFFICIENT_STOCK`| 400 | Tồn kho khả dụng còn hạn không đủ đáp ứng số lượng yêu cầu! | Giảm số lượng bán theo tồn thực tế hoặc đặt hàng bổ sung từ Kho tổng DC. |
| `ERR_CONCURRENCY_CONFLICT` | 400 / 409 | Tranh chấp tồn kho đồng thời giữa các quầy giao dịch! | Giao dịch tự động ROLLBACK an toàn; thu ngân quét lại giỏ hàng để lấy tồn mới. |
| `ERR_UNAUTHORIZED_ROLE` | 403 | Vai trò người dùng không có thẩm quyền bán lẻ xuất kho! | Chỉ vai trò `CASHIER`, `STORE_MANAGER`, `ADMIN` mới được thực hiện xuất bán. |

---

## 10.4 Lưu đồ Trình tự Kiểm định 7 Bước Giao dịch Bán lẻ & Xuất kho (Validation Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Cashier as Thu ngân (POS)
    participant UI as Giao diện POS Checkout
    participant API as SaleController
    participant UC as ProcessFefoSaleUseCase
    participant Policy as FefoAllocationPolicy
    participant DB as SQL Server (LocalDB)

    Cashier->>UI: Quét Barcode & Bấm "Thanh toán (F9)"
    UI->>UI: Bước 1: Validate đầu vào (qty > 0, cart not empty)
    UI->>API: POST /api/sales (items, weather, isHoliday)
    API->>API: Bước 2: Kiểm tra Token & Quyền (CASHIER / MANAGER)
    API->>UC: execute(salePayload)
    UC->>DB: Bước 3: Kiểm tra StoreProfile (Status == 'OPEN')
    alt Cửa hàng != 'OPEN'
        DB-->>UC: Status = 'CLOSED' hoặc 'INVENTORY'
        UC-->>API: Ném ERR_STORE_CLOSED (HTTP 400)
        API-->>UI: Báo lỗi từ chối thanh toán
    end
    UC->>DB: Bước 4: Lấy danh sách lô còn hạn (DaysLeft > 0, status != 'EXPIRED')
    DB-->>UC: Danh sách batches khả dụng
    UC->>Policy: Bước 5: allocateFefo(batches, requestedQty)
    alt Không đủ tồn khả dụng
        Policy-->>UC: Ném InsufficientStockError
        UC-->>API: Ném ERR_INSUFFICIENT_STOCK (HTTP 400)
        API-->>UI: Thông báo thiếu hàng chi tiết
    else Đủ tồn kho khả dụng
        Policy-->>UC: Trả về danh sách allocations (Mã lô, Số lượng bẻ, Đơn giá)
        UC->>DB: Bước 6: Mở Transaction WITH (UPDLOCK, ROWLOCK)
        Note over DB: UPDATE batches SET current_quantity -= qty WHERE current_quantity >= qty
        alt Vi phạm âm kho hoặc tranh chấp
            DB-->>UC: @@ROWCOUNT = 0 -> THROW 50001 (ROLLBACK)
            UC-->>API: Ném ERR_CONCURRENCY_CONFLICT (HTTP 400)
            API-->>UI: Báo lỗi tranh chấp tồn kho
        else Trừ kho thành công
            DB->>DB: INSERT sales_history + system_audit_logs
            DB-->>UC: COMMIT TRANSACTION thành công
            UC-->>API: Trả về transactionCode, receiptData
            API-->>UI: HTTP 201 Created (Kèm chi tiết biên lai K80)
            UI-->>Cashier: Mở Modal In Biên lai K80 & Xóa giỏ hàng
        end
    end
```"""

    if target not in content:
        print("Error: Target not found in markdown file!")
        sys.exit(1)

    new_content = content.replace(target, replacement, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated Section 10 in Markdown SSOT!")

if __name__ == '__main__':
    update_section_10_md()

