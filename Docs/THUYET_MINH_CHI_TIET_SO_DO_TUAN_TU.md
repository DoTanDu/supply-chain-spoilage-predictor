# THUYẾT MINH CHI TIẾT SƠ ĐỒ TUẦN TỰ (UML SEQUENCE DIAGRAMS)
## HỆ THỐNG DỰ BÁO NHU CẦU & ĐIỀU PHỐI HÀNG HÓA CHUỖI BÁN LẺ CHỐNG LÃNG PHÍ (SMARTSUPPLY AI)

---

### THÔNG TIN ĐỀ TÀI & TÁC GIẢ
* **Đề tài:** SmartSupply AI – Hệ thống dự báo nhu cầu tiêu thụ và tối ưu điều phối hàng hóa nhằm giảm lãng phí thực phẩm trong chuỗi bán lẻ.
* **Đơn vị:** Khoa Công nghệ Thông tin – Trường Đại học Lạc Hồng (LHU).
* **Giảng viên hướng dẫn:** ThS. Lê Minh Nhật.
* **Sinh viên thực hiện:** Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946).
* **Mô hình triển khai:** Chuỗi cửa hàng bán lẻ thực phẩm quy mô 3–30 chi nhánh (MVP 3 chi nhánh LHU Mart `RETAIL-STORE-01..03` + Kho trung tâm tùy chọn; hỗ trợ chế độ 1 cửa hàng độc lập `isSingleStore`).
* **Tài liệu chuẩn đối chiếu:** [SmartSupply_AI_Phan_tich_nghiep_vu_3_Actor.md](file:///c:/thuyet%20minh/Docs/SmartSupply_AI_Phan_tich_nghiep_vu_3_Actor.md) & [SmartSupply_AI_Dinh_huong_va_Dac_ta_Trien_khai.md](file:///c:/thuyet%20minh/Docs/SmartSupply_AI_Dinh_huong_va_Dac_ta_Trien_khai.md).

---

## 1. GIỚI THIỆU TỔNG QUAN VỀ SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAM)

Trong kiến trúc **Clean Architecture 4 tầng**, Sơ đồ Tuần tự (UML Sequence Diagram) mô tả chính xác dòng thông điệp tương tác giữa tác nhân và các lớp thành phần thực tế của hệ thống:
1. **Presentation Layer:** Giao diện React Vite (`InventoryManagementView`, `DcIntakeModal`) và REST Controllers (`SalesController`, `BatchController`) kèm `authMiddleware` / `roleMiddleware`.
2. **Application Layer:** Các Use Case điều phối giao dịch (`ProcessFefoSaleUseCase`, `ReceiveDCBatchUseCase`).
3. **Domain Layer:** Thực thể & quy tắc nghiệp vụ bất biến (`FefoAllocationPolicy`, `ShelfLife`).
4. **Infrastructure Layer:** Repository SQL Server LocalDB (`SqlSaleRepository`, `SqlBatchRepository`, `retail_spoilage_db` với khóa `UPDLOCK, ROWLOCK`).

Hai ca sử dụng cốt lõi bảo toàn tồn kho và vòng đời hạn sử dụng gồm:
* **Sơ đồ 1:** Bán lẻ POS trừ kho FEFO, quét tem GS1-128 & bẻ nhỏ đơn hàng qua nhiều lô (`ProcessFefoSaleUseCase`).
* **Sơ đồ 2:** Tiếp nhận hàng từ Kho tổng DC/NCC kiểm định chuẩn $RSL_{inbound} \ge 70\%$ (`ReceiveDCBatchUseCase`).

---

## 2. SƠ ĐỒ TUẦN TỰ 1: BÁN LẺ POS XUẤT KHO FEFO (PROCESS FEFO SALE)

### 2.1. Hình ảnh Sơ đồ Tuần tự 1
![Sơ đồ Tuần tự Bán lẻ POS Trừ kho FEFO & Quét tem GS1-128](file:///c:/thuyet%20minh/Docs/Diagram_Images/sequence_fefo_sale.png)

*(Ảnh độ phân giải cao lưu tại [sequence_fefo_sale.png](file:///c:/thuyet%20minh/Docs/Diagram_Images/sequence_fefo_sale.png).)*

### 2.2. Mục tiêu Nghiệp vụ
* Đảm bảo nguyên tắc **FEFO (First Expired, First Out)**: ưu tiên xuất bán lô có hạn dùng gần nhất; hoặc trừ đúng lô được quét từ tem giảm giá **GS1-128** (`batchCode` + `strictBatch`).
* **Bẻ lô tự động (Batch Splitting):** Khi số lượng mua vượt tồn lô thứ nhất, tự động khấu trừ tiếp ở các lô còn hạn kế theo.
* Áp dụng tự động chiết khấu **Quick Markdown (0%–50%)** gắn trên từng lô và ghi nhận ngữ cảnh thời tiết/ngày lễ phục vụ bộ máy AI `LightGBM`.
* Chống tồn kho âm tuyệt đối (`UPDLOCK, ROWLOCK`) và khóa cứng lô quá hạn `EXPIRED`.

### 2.3. Bảng phân tích các đối tượng tham gia (Lifelines)

| Tên Lifeline | Tầng Kiến trúc | Vai trò & Trách nhiệm kỹ thuật |
| :--- | :--- | :--- |
| **Nhân viên (`STAFF`)** | Tác nhân ngoài | Chọn sản phẩm, quét mã vạch/tem giảm giá GS1-128 và xác nhận thanh toán tại quầy. |
| **Modal Bán hàng POS** | Presentation (`InventoryManagementView.jsx`) | Hiển thị giỏ hàng, ô quét GS1-128/chọn lô, xem trước phân bổ FEFO và hóa đơn chi tiết. |
| **`SalesController`** | Presentation Layer | Tiếp nhận `POST /api/sales`, kiểm tra `authMiddleware`, `roleMiddleware` và phạm vi chi nhánh `storeScope`. |
| **`ProcessFefoSaleUseCase`** | Application Layer | Kiểm tra trạng thái `OPEN` của chi nhánh, xác thực lô chỉ định GS1 (`404 ERR_BATCH_NOT_FOUND` nếu sai), điều phối giao dịch. |
| **`FefoAllocationPolicy`** | Domain Service | Lọc bỏ lô `EXPIRED`/`DISPOSED`, ưu tiên lô GS1 (nếu có) hoặc sắp xếp `expiry_date ASC`, thực hiện thuật toán bẻ đa lô. |
| **`SqlSaleRepository`** | Infrastructure Layer | Chạy Transaction SQL Server khóa `UPDLOCK, ROWLOCK`, cập nhật `batches`, ghi `sales_history`, xóa cache LightGBM và ghi `system_audit_logs`. |
| **SQL Server LocalDB** | Database Storage | Lưu trữ vật lý `retail_spoilage_db`, đảm bảo tính nguyên tử (Atomicity) và ràng buộc `current_quantity >= 0`. |

### 2.4. Diễn giải chi tiết từng bước thực thi

1. **Bước 1–2 (`POST /api/sales`):** Nhân viên chọn sản phẩm, số lượng (hoặc quét chuỗi tem GS1-128 `(01)...(17)...(10)BATCHCODE`), chọn cờ thời tiết/ngày lễ. Giao diện gửi payload `{ storeId, items: [{ productId, quantity, batchCode?, strictBatch? }], weather, isHoliday }` về `SalesController`.
2. **Bước 3–6 (Truy vấn khóa dòng FEFO):** `ProcessFefoSaleUseCase` kiểm tra chi nhánh đang `OPEN` rồi truy vấn các lô khả dụng với `UPDLOCK, ROWLOCK` theo thứ tự `expiry_date ASC`.
3. **Bước 7–10 (Phân bổ `FefoAllocationPolicy`):**
   * Chặn bán nếu toàn bộ lô đã `EXPIRED` (`400 ERR_BATCH_EXPIRED`) hoặc tổng tồn khả dụng nhỏ hơn lượng mua (`400 ERR_INSUFFICIENT_STOCK`).
   * Đưa lô GS1 chỉ định lên đầu (nếu có) hoặc tự động bẻ lô qua nhiều lô (ví dụ Lô 1 trừ 3, Lô 2 trừ 2) kèm giá sau chiết khấu.
4. **Bước 11–14 (Transaction & Clear Cache):** `SqlSaleRepository` thực thi `BEGIN TRAN` → `UPDATE batches` (`WHERE current_quantity >= qty`) → `INSERT sales_history` → `INSERT system_audit_logs` → `COMMIT TRAN`, sau đó gọi `LightGbmForecastEngine.clearCache()`.
5. **Bước 15–17 (`HTTP 201 Created`):** Controller trả `201 Created` kèm `transactionCode` và chi tiết từng dòng lô đã bẻ để quầy POS in hóa đơn và cập nhật tồn tức thì.

---

## 3. SƠ ĐỒ TUẦN TỰ 2: TIẾP NHẬN HÀNG TỪ KHO TỔNG DC / NCC (RECEIVE DC BATCH)

### 3.1. Hình ảnh Sơ đồ Tuần tự 2
![Sơ đồ Tuần tự Tiếp nhận hàng DC & Kiểm định độ tươi RSL >= 70%](file:///c:/thuyet%20minh/Docs/Diagram_Images/sequence_dc_intake.png)

*(Ảnh độ phân giải cao lưu tại [sequence_dc_intake.png](file:///c:/thuyet%20minh/Docs/Diagram_Images/sequence_dc_intake.png).)*

### 3.2. Mục tiêu Nghiệp vụ
* Kiểm soát chất lượng hàng nhập qua chỉ số **Vòng đời Sử dụng Còn lại ($RSL_{inbound}$)**:
  $$\text{RSL}_{\text{inbound}} = \frac{\text{ExpiryDate} - \text{ImportDate}}{\text{ExpiryDate} - \text{ManufactureDate}} \times 100\% \ge 70\%$$
* Nếu $RSL < 70\%$: khóa cứng nút lưu và hỗ trợ lập **Biên bản Từ chối Nhận hàng DC** (`POST /api/batches/reject-inbound`) ghi `REJECT_DC_INBOUND`.
* Nếu $RSL \ge 70\%$: tự động giải mã GS1-128 (nếu quét mã), tạo phiếu nhập `goods_receipts`, khởi tạo lô mới và cập nhật liên kết đơn đặt hàng PO.

### 3.3. Bảng phân tích các đối tượng tham gia (Lifelines)

| Tên Lifeline | Tầng Kiến trúc | Vai trò & Trách nhiệm kỹ thuật |
| :--- | :--- | :--- |
| **Nhân viên (`STAFF`)** | Tác nhân ngoài | Kiểm đếm hàng từ xe tải DC/NCC, quét mã GS1-128 hoặc nhập NSX, HSD, số lượng, giá vốn. |
| **`DcIntakeModal`** | Presentation (`InventoryManagementView.jsx`) | Giải mã chuỗi GS1-128 bằng `gs1Parser.js`, hiển thị đồng hồ RSL % trực quan và nút lập biên bản từ chối khi dưới chuẩn. |
| **`BatchController`** | Presentation Layer | Tiếp nhận `POST /api/batches/receive-inbound` và `POST /api/batches/reject-inbound` qua `authMiddleware`/`roleMiddleware`. |
| **`ReceiveDCBatchUseCase`** | Application Layer | Kiểm tra ràng buộc ngày (`EXP > MFG`, `MFG <= ImportDate`, `EXP > ImportDate`), thẩm định chuẩn RSL chi nhánh và điều phối lưu DB. |
| **`ShelfLife / Freshness`** | Domain Entity / Policy | Tính toán `RSL %`, từ chối lô cận date `< 70%`, sinh mã lô chuẩn hóa `LOT-DC-{SKU}-{Date}`. |
| **`SqlBatchRepository`** | Infrastructure Layer | Lưu `goods_receipts`, `batches`, `system_audit_logs` trong 1 Transaction SQL Server và xóa cache LightGBM. |
| **SQL Server LocalDB** | Database Storage | Đảm bảo toàn vẹn khóa ngoại `store_id`, `product_id`, `supplier_id` và `batch_code UNIQUE`. |

### 3.4. Diễn giải chi tiết từng bước thực thi

1. **Bước 1–5 (Gửi kiểm định):** Nhân viên quét mã GS1-128 hoặc nhập thông tin lô trên `DcIntakeModal` → `gs1Parser` tách sẵn SKU/HSD/BatchCode và tính preview RSL % → gửi `POST /api/batches/receive-inbound`.
2. **Nhánh Rẽ 1 — `RSL < 70%` (Bước 6a–10a):**
   * Tầng Domain phát hiện `RSL < minInboundRslPercent` (mặc định 70%) → trả `HTTP 400 Bad Request` và không ghi bất kỳ dòng nào vào `batches`.
   * Giao diện cho phép nhân viên bấm lập biên bản từ chối (`POST /api/batches/reject-inbound`) để ghi bất biến sự kiện `REJECT_DC_INBOUND` vào `system_audit_logs`.
3. **Nhánh Rẽ 2 — `RSL >= 70%` (Bước 6b–14b):**
   * Khởi tạo lô hợp lệ (`current_quantity = initial_quantity`, `discount_percent = 0`, `is_shelf_rotated = 0`).
   * `SqlBatchRepository` thực thi Transaction ghi đồng thời `goods_receipts`, `batches`, `system_audit_logs` (và cập nhật trạng thái PO nếu có), xóa cache LightGBM.
   * Trả `HTTP 201 Created` về giao diện để hiển thị thông báo thành công và in tem mã vạch dán lên kiện hàng.
