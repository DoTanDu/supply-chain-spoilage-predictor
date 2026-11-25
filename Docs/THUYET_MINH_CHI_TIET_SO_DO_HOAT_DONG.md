# THUYẾT MINH CHI TIẾT SƠ ĐỒ HOẠT ĐỘNG (UML ACTIVITY DIAGRAM)
## QUY TRÌNH THAO TÁC CHUẨN (SOP) VẬN HÀNH CHỐNG LÃNG PHÍ & ĐIỀU PHỐI CHUỖI

---

### THÔNG TIN ĐỀ TÀI & TÁC GIẢ
* **Đề tài:** SmartSupply AI – Hệ thống dự báo nhu cầu tiêu thụ và tối ưu điều phối hàng hóa nhằm giảm lãng phí thực phẩm trong chuỗi bán lẻ.
* **Đơn vị:** Khoa Công nghệ Thông tin – Trường Đại học Lạc Hồng (LHU).
* **Giảng viên hướng dẫn:** ThS. Lê Minh Nhật.
* **Sinh viên thực hiện:** Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946).
* **Tài liệu chuẩn đối chiếu:** [SmartSupply_AI_Phan_tich_nghiep_vu_3_Actor.md](file:///c:/thuyet%20minh/Docs/SmartSupply_AI_Phan_tich_nghiep_vu_3_Actor.md) & [SmartSupply_AI_Dinh_huong_va_Dac_ta_Trien_khai.md](file:///c:/thuyet%20minh/Docs/SmartSupply_AI_Dinh_huong_va_Dac_ta_Trien_khai.md).

---

## 1. GIỚI THIỆU TỔNG QUAN VỀ SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM)

Sơ đồ Hoạt động (UML Activity Diagram) chuẩn hóa luồng phối hợp phân làn trách nhiệm (Swimlanes) giữa **AI Engine**, **OWNER / MANAGER**, và **STAFF** qua 2 quy trình trọng tâm chống lãng phí thực phẩm:

1. **Quy trình 1:** Giảm giá Quick Markdown (15%–50%) & Đảo lô Mặt tiền Kệ theo nguyên tắc FEFO (5 bước SOP).
2. **Quy trình 2:** Điều phối Dư–Thiếu Liên Chi nhánh tối ưu bằng **Google OR-Tools MILP (`SCIP`/`CBC`)** theo vòng đời 5 trạng thái (`PROPOSED → PENDING → APPROVED → IN_TRANSIT → RECEIVED` / `CANCELLED`).

![Sơ đồ Hoạt động Quy trình Quick Markdown & Điều phối Dư–Thiếu Liên Chi nhánh](file:///c:/thuyet%20minh/Docs/Diagram_Images/activity_sop_workflows.png)

*(Ảnh độ phân giải cao lưu tại [activity_sop_workflows.png](file:///c:/thuyet%20minh/Docs/Diagram_Images/activity_sop_workflows.png).)*

---

## 2. QUY TRÌNH 1: GIẢM GIÁ QUICK MARKDOWN & ĐẢO LÔ MẶT TIỀN KỆ (5 BƯỚC SOP)

### 2.1. Mục tiêu Nghiệp vụ
* Giải phóng kịp thời các lô hàng chạm **Vùng Vàng** ($3 < DaysLeft \le WarningDays$) và **Vùng Đỏ** ($0 < DaysLeft \le 3$) trước thời điểm hết hạn sử dụng.
* Kích cầu bán lẻ tại quầy bằng mức giảm giá thuộc tập `{0%, 15%, 30%, 40%, 50%}`, tự động cập nhật ngay vào giá bán POS.
* Phân làn trách nhiệm (**Separation of Duties**):
  * **Làn 1 – Quản lý Cửa hàng (`MANAGER`):** Thẩm định rủi ro và kích hoạt mức giảm giá Quick Markdown (`STAFF` không được tự chỉnh giá).
  * **Làn 2 – Nhân viên Vận hành (`STAFF`):** Thực hiện đảo lô mặt tiền kệ, in & dán tem GS1-128 và xác nhận điện tử hoàn tất 5 bước SOP.

### 2.2. Bảng phân tích chi tiết 5 bước thao tác chuẩn (SOP Steps)

| Bước | Làn thực hiện | Tên hành động | Chi tiết thao tác & Ràng buộc kỹ thuật |
| :---: | :--- | :--- | :--- |
| **1** | `MANAGER` | **Quét cảnh báo cận hạn** | Mở `07. Spoilage Alerts`, lọc các lô chạm Vùng Vàng/Đỏ kèm chỉ số rủi ro ứ đọng `DOS > DUE` từ bộ máy AI. |
| **-** | `MANAGER` | **Nút quyết định (Decision)** | Đánh giá tuổi thọ còn lại ($DaysLeft$):<br>• Vùng Vàng (4–7 ngày): chọn mức giảm **15% – 30%**.<br>• Vùng Đỏ (1–3 ngày): chọn mức giảm **40% – 50%** xả kịch sàn trong ngày. |
| **2** | `MANAGER` | **Kích hoạt Quick Markdown** | Gửi `PATCH /api/batches/:id/discount`; hệ thống chặn lô `EXPIRED`/`DISPOSED`, cập nhật `discount_percent` hiệu lực tức thì tại quầy POS. |
| **3** | `STAFF` | **Đảo lô hàng mặt tiền** | Rút lô hạn xa lùi vào trong, đưa toàn bộ lô cận date ra hàng đầu mặt tiền kệ theo nguyên tắc FEFO. |
| **4** | `STAFF` | **Dán tem nhãn GS1-128** | In sticker Quick Markdown chứa chuỗi `(01)GTIN14(17)YYMMDD(10)BATCHCODE` từ modal in tem và dán lên bao bì sản phẩm. |
| **5** | `STAFF` | **Xác nhận điện tử trên app** | Tick đủ 5 bước SOP và gửi `PATCH /api/batches/:id/rotate`; hệ thống đặt `is_shelf_rotated = 1` và ghi `ROTATE_SHELF_FEFO` vào `system_audit_logs`. |

---

## 3. QUY TRÌNH 2: ĐIỀU PHỐI DƯ–THIẾU LIÊN CHI NHÁNH (OR-TOOLS MILP & 5 TRẠNG THÁI)

### 3.1. Mục tiêu Nghiệp vụ
* Giải quyết bài toán thực tế của chuỗi 3–30 chi nhánh: một SKU đang tồn đọng cận date ở Chi nhánh A (dư tồn) nhưng thiếu hàng tại Chi nhánh B.
* Kết hợp dự báo 7 ngày từ `LightGBM` và bộ giải tối ưu **Google OR-Tools MILP (`SCIP`/`CBC`)** để đề xuất phương án điều chuyển có giá trị cứu hàng lớn hơn chi phí vận chuyển.
* Khi hệ thống chạy chế độ 1 cửa hàng độc lập (`isSingleStore = true`), phân hệ điều chuyển `06. Stock Transfer` tự động ẩn trên giao diện.

### 3.2. Bảng phân tích chi tiết các bước vận hành

| Bước | Làn thực hiện | Tên hành động | Chi tiết thao tác & Ràng buộc kỹ thuật |
| :---: | :--- | :--- | :--- |
| **1** | `AI Engine & OWNER/MANAGER` | **Tối ưu Google OR-Tools MILP** | Gọi `GET /api/stock-transfers/ai-matrix`: tổng hợp dư–thiếu toàn chuỗi, chạy `optimize_transfer_cli.py` tính cặp ghép tối ưu ưu tiên lô FEFO. |
| **2** | `OWNER / MANAGER` | **Tạo đề xuất & Chờ duyệt** | Khởi tạo phiếu `PROPOSED` → gửi duyệt `PENDING` qua `POST /api/stock-transfers` (tồn kho nguồn chưa đổi; chặn `fromStoreId == toStoreId` hoặc vượt tồn lô). |
| **-** | `OWNER / MANAGER` | **Nút quyết định Phê duyệt** | • **Từ chối:** Chuyển `CANCELLED`, đóng phiếu.<br>• **Phê duyệt:** Chuyển `APPROVED` (`STAFF` bị chặn 403 không được tự duyệt bước này). |
| **3** | `STAFF` (CN xuất) | **Xuất kho vận chuyển (`IN_TRANSIT`)** | Đóng gói lô hàng và chuyển trạng thái `APPROVED → IN_TRANSIT` (`PATCH .../status`). Hệ thống dùng `UPDLOCK, ROWLOCK` trừ tồn kho lô chi nhánh nguồn. |
| **-** | `STAFF` (CN nhận) | **Nút quyết định Giao nhận** | • **Hủy giữa chừng (`CANCELLED`):** Hoàn nguyên chính xác số lượng đã trừ về lại lô nguồn.<br>• **Nhận hàng (`RECEIVED`):** Tạo lô mới `TRF-...` tại chi nhánh đích giữ nguyên hạn sử dụng gốc của lô nguồn. |
| **4** | `Hệ thống` | **Ghi nhận Audit Log bất biến** | Toàn bộ lịch sử 5 trạng thái, chi phí vận chuyển và giá trị hàng cứu được ghi bất biến vào `system_audit_logs`. |
