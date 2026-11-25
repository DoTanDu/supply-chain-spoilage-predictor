# AGENTS.MD - HƯỚNG DẪN DÀNH CHO AI AGENT TRONG DỰ ÁN

## 1. Tài liệu chuẩn đối chiếu (Authoritative Docs)
* [SmartSupply_AI_Phan_tich_nghiep_vu_3_Actor.md](file:///c:/thuyet%20minh/Docs/SmartSupply_AI_Phan_tich_nghiep_vu_3_Actor.md) — **3 Actor – 26 nhóm nghiệp vụ** (OWNER: 10, MANAGER: 9, STAFF: 7) & quy trình trọng tâm 5 bước.
* [SmartSupply_AI_Dinh_huong_va_Dac_ta_Trien_khai.md](file:///c:/thuyet%20minh/Docs/SmartSupply_AI_Dinh_huong_va_Dac_ta_Trien_khai.md) — Định hướng sản phẩm SaaS B2B, 9 trang chuẩn (01–09), 4 Bộ máy AI, quy trình điều phối dư–thiếu giữa các chi nhánh.

---

## 2. Bối cảnh & Phạm vi Dự án (Project Scope)
* **Tên đề tài:** SmartSupply AI – Hệ thống dự báo nhu cầu tiêu thụ và tối ưu điều phối hàng hóa nhằm giảm lãng phí thực phẩm trong chuỗi bán lẻ.
* **Đơn vị:** Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU).
* **GVHD:** ThS. Lê Minh Nhật.
* **Nhóm sinh viên thực hiện:** Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946).
* **Mô hình hệ thống:** Chuỗi cửa hàng bán lẻ thực phẩm quy mô 3–30 chi nhánh (MVP gồm 3 chi nhánh LHU Mart: `RETAIL-STORE-01`, `RETAIL-STORE-02`, `RETAIL-STORE-03` + Kho trung tâm tùy chọn; đồng thời hỗ trợ chế độ 1 cửa hàng độc lập `isSingleStore` tự ẩn phân hệ điều chuyển `06. Stock Transfer`):
  * Quản lý danh mục sản phẩm FMCG (chống trùng SKU / tên tương đồng >= 85%) và tiếp nhận hàng theo đợt (`RSL_inbound >= 70%`).
  * Quản lý vòng đời hạn sử dụng từng lô (Shelf-Life) và cảnh báo 3 cấp màu (Xanh / Vàng / Đỏ) + khóa cứng hàng hết hạn (`EXPIRED`).
  * Bán lẻ tại quầy theo nguyên tắc **FEFO (First Expired, First Out)** (có hỗ trợ quét lô / tem giảm giá GS1-128), chống tồn kho âm (`UPDLOCK, ROWLOCK`), giảm giá Quick Markdown (`0%`, `15%`, `30%`, `40%`, `50%`), SOP đảo kệ 5 bước và đồng bộ dữ liệu bán hàng POS CSV/Excel trừ kho FEFO thật.
  * Tiêu hủy hàng hư hỏng/quá date gắn liền Sổ hao hụt tài chính bất biến (`CostLoss = QuantityDisposed * ImportPrice`).
  * **4 Bộ máy AI:**
    * **AI 1 – Demand Forecasting:** `LightGBM` (`pretrained_lgbm_model.pkl`) dự báo sức mua 7 ngày kết hợp dữ liệu bán 14 ngày + thời tiết + ngày lễ + khuyến mãi; chỉ xuất dự báo `0` khi chưa phát sinh lịch sử bán.
    * **AI 2 – Spoilage Risk:** Tính rủi ro ứ đọng quá hạn (`DOS > DUE`) và sản lượng có nguy cơ hỏng trước hạn.
    * **AI 3 – Inventory Optimization:** Tính ROP có trừ hàng đang giao (`incomingOrderQty + incomingTransferQty`) + giải bài toán điều phối dư–thiếu liên chi nhánh bằng **Google OR-Tools MILP (`SCIP`/`CBC`)** với 3 phương án (PO Nhà cung cấp / Điều chuyển nội bộ / Kho trung tâm).
    * **AI 4 – AI Assistant:** Gemini LLM truy vấn giải thích báo cáo theo đúng phạm vi quyền người dùng (không dùng LLM thay mô hình dự báo số học).
  * Điều chuyển nội bộ tuân thủ máy trạng thái 5 bước: `PROPOSED -> PENDING -> APPROVED -> IN_TRANSIT -> RECEIVED` (hoặc `CANCELLED`).

---

## 3. Ma trận 3 Actor & 9 Trang Chuẩn (Strict Role Defaults)
Kiểm tra quyền thực hiện tại Backend (`roleMiddleware` + `storeScope`), không chỉ ẩn trên UI:
1. **`01. Dashboard` (`dashboard`)**: `ADMIN`, `STORE_MANAGER`
2. **`02. Store Management` (`store-management`)**: `ADMIN`, `STORE_MANAGER`
3. **`03. Inventory Management` (`inventory-management`)**: `ADMIN`, `STORE_MANAGER`, `CASHIER`
4. **`04. AI Forecast` (`ai-forecast`)**: `ADMIN`, `STORE_MANAGER`
5. **`05. Smart Ordering` (`smart-ordering`)**: `ADMIN`, `STORE_MANAGER`
6. **`06. Stock Transfer` (`stock-transfer`)**: `ADMIN`, `STORE_MANAGER`, `CASHIER` (tự ẩn khi `isSingleStore = true`)
7. **`07. Spoilage Alerts` (`spoilage-alerts`)**: `ADMIN`, `STORE_MANAGER`, `CASHIER`
8. **`08. Reports & Analytics` (`reports-analytics`)**: `ADMIN`, `STORE_MANAGER`
9. **`09. Settings & Integration` (`settings-integration`)**: `ADMIN`

*(OWNER/ADMIN có thể cấp/thu hồi quyền linh hoạt từng trang qua `pagePermissions: { grant, revoke }`; toàn bộ nghiệp vụ ghi nhận bắt buộc ghi `system_audit_logs` bất biến.)*

---

## 4. Kiến trúc & Kỹ thuật Chuẩn mực (Technical Guidelines)
* **Kiến trúc:** Clean Architecture 4 tầng (`Domain -> Application -> Infrastructure -> Presentation`) ở Backend Node.js/Express + Python AI CLI (`predict_cli.py`, `optimize_transfer_cli.py`) + Frontend React (Vite, Light Theme).
* **Cơ sở dữ liệu:** Microsoft SQL Server LocalDB `(localdb)\mssqllocaldb`, database `retail_spoilage_db`.
* **Tính toàn vẹn:** Mọi giao dịch bán hàng, nhập kho, điều chuyển, tiêu hủy dùng Transaction SQL Server (`UPDLOCK, ROWLOCK`), chuỗi tiếng Việt dùng `N'...'` và mã hóa `utf-8-sig`.
