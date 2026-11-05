# KẾ HOẠCH CHI TIẾT HOÀN THIỆN TOÀN DIỆN TRANG WEB
## NỀN TẢNG QUẢN TRỊ BÁN LẺ CHỐNG LÃNG PHÍ - LHU MART (SUPPLY CHAIN SPOILAGE PREDICTOR)

* **Tài liệu căn cứ (SSOT):** [Docs/Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md](file:///c:/thuyet%20minh/Docs/Dac%20Ta%20He%20Thong%20Quan%20Ly%20Chuoi%20Cung%20Ung%20Chong%20Lang%20Phi%20-%20Supply%20Chain%20Spoilage%20Predictor.md)
* **Đối tượng hoàn thiện:** Toàn bộ hệ thống Web Application (Frontend React SPA, Backend Express REST API, CSDL Microsoft SQL Server).
* **Mục tiêu:** Nâng cấp trang web từ mức "chạy được MVP" lên mức "phần mềm thương mại thực chiến hoàn chỉnh", phục vụ thuyết trình và demo thực tế trước Hội đồng tốt nghiệp.
* **Tổng số bước thực hiện:** **ĐÚNG 6 BƯỚC TUẦN TỰ**.

---

## TỔNG QUAN 6 BƯỚC HOÀN THIỆN TRANG WEB

```mermaid
graph LR
    B1["BƯỚC 1<br/>Xuất Excel & In K80<br/>(POS & Sổ Hao Hụt)"] --> B2["BƯỚC 2<br/>Quét Barcode Camera<br/>(POS & Nhập Kho DC)"]
    B2 --> B3["BƯỚC 3<br/>In Tem Nhãn Lô &<br/>Sticker Giảm Giá Kệ"]
    B3 --> B4["BƯỚC 4<br/>Quản Lý Đơn PO &<br/>Nhập Kho Khớp Đơn"]
    B4 --> B5["BƯỚC 5<br/>Lịch Sử Giao Ca &<br/>Biên Bản Bàn Giao"]
    B5 --> B6["BƯỚC 6<br/>API Thời Tiết Thật &<br/>Khóa Bán Giờ Đóng Cửa"]
```

---

## CHI TIẾT TỪNG BƯỚC HOÀN THIỆN

### [BƯỚC 1] XUẤT DỮ LIỆU EXCEL & CHUẨN HÓA IN NHIỆT HÓA ĐƠN K80 (POS & SỔ HAO HỤT) — [ĐÃ HOÀN THÀNH 100% ✅]
* **1. Mục tiêu:**
  * Bổ sung tính năng xuất file bảng tính Excel (CSV mã hóa UTF-8 BOM chuẩn tiếng Việt có dấu) cho dữ liệu tài chính.
  * Tối ưu hóa lệnh in ấn hóa đơn bán lẻ POS: Khi bấm In, chỉ in đúng chiếc hóa đơn nhiệt 80mm (K80) chuẩn siêu thị, cô lập hoàn toàn không in thừa thanh menu hay nền web.
* **2. Căn cứ trong SSOT:**
  * Mục 8.1 & 8.2: In hóa đơn chi tiết bóc tách lô FEFO tại quầy POS.
  * Mục 14: Sổ hao hụt tài chính bất biến phục vụ quyết toán tài chính và kiểm toán.
* **3. File & Component tác động:**
  * `Frontend/src/utils/exportUtils.js` (Hàm xuất CSV Excel & tải file).
  * `Frontend/src/components/SpoilageDisposalView.jsx` (Thêm nút "Xuất Excel Sổ Hao Hụt").
  * `Frontend/src/components/PosCheckoutView.jsx` (Thêm nút "Xuất Excel Hóa Đơn" và gắn ID in ấn).
  * `Frontend/src/index.css` (Thêm bộ quy tắc in ấn `@media print`).
* **4. Kết quả nghiệm thu thực tế:**
  * Đã kiểm chứng trên trình duyệt: Nút "Xuất Excel" tại Sổ hao hụt tải về file CSV UTF-8 BOM chuẩn tiếng Việt.
  * Đã kiểm chứng tại Quầy POS: Modal hóa đơn thanh toán hiển thị đầy đủ 3 nút "In Hóa Đơn" K80, "Xuất Excel", và "Đơn Hàng Mới". Hoạt động trơn tru 100% không có lỗi console.
* **4. Chi tiết kỹ thuật:**
  * Nút "Xuất Excel Sổ Hao Hụt": Xuất bảng gồm Mã phiếu, Mã lô, Sản phẩm, Ngày hủy, Số lượng, Đơn giá vốn, Tổng thiệt hại CostLoss, Lý do, Trạng thái phê duyệt.
  * Hóa đơn POS K80: Header LHU Mart, Mã đơn hàng, Thu ngân, Ngày giờ, Chi tiết bẻ lô FEFO, Tổng thanh toán, Tiền khách đưa, Tiền thối lại, Mã vạch barcode.
* **5. Tiêu chí nghiệm thu (Acceptance Criteria):**
  * Bấm nút "Xuất Excel" ➔ Trình duyệt tải ngay file `.csv`, mở bằng Microsoft Excel hiển thị đầy đủ tiếng Việt, số tiền có định dạng chuẩn.
  * Bấm nút "In Hóa Đơn" ➔ Hộp thoại in trình duyệt hiện đúng mẫu hóa đơn nhỏ gọn K80, nền trắng chữ đen sắc nét.

---

### [BƯỚC 2] TÍCH HỢP CAMERA QUÉT MÃ VẠCH (BARCODE / QR SCANNER) TẠI QUẦY POS & TIẾP NHẬN DC - [ĐÃ HOÀN THÀNH 100%]
* **1. Mục tiêu:**
  * Tích hợp chức năng quét mã vạch trực tiếp qua Webcam/Camera máy tính hoặc điện thoại trên trình duyệt web, loại bỏ việc phải gõ tay hoặc click chuột thủ công.
* **2. Căn cứ trong SSOT:**
  * Mục 26.2 (Tính năng nâng cao số 1): Tích hợp máy quét mã vạch 2D / GS1 DataBar / Quét camera tại quầy thu ngân và nhân viên kho.
* **3. File & Component tác động:**
  * `Frontend/src/components/PosCheckoutView.jsx` (Thêm modal và nút quét camera tại quầy POS).
  * `Frontend/src/components/DcIntakeView.jsx` (Thêm modal và nút quét camera kiểm định date hàng DC).
  * `Frontend/src/components/BarcodeScannerModal.jsx` (Component quét mã vạch Camera WebRTC, hiệu ứng Reticle Laser, Native BarcodeDetector API, âm thanh Beep siêu thị 1200Hz và chế độ mô phỏng quét 1-click cho bảo vệ đồ án).
* **4. Kết quả nghiệm thu thực tế:**
  * Đã kiểm chứng tại Quầy POS: Bấm nút "Quét Barcode" mở modal camera, quét/chọn mã sản phẩm Vinamilk `8934567890101` tự động phát âm thanh Beep, đóng modal và đẩy ngay vào giỏ hàng POS, kèm thông báo xanh flash message.
  * Đã kiểm chứng tại Tiếp Nhận DC: Bấm nút "Quét Barcode" mở modal, quét/chọn mã kiện hàng tự động nạp chính xác vào biểu mẫu tiếp nhận bên trái và tính toán RSL 97% đạt chuẩn Rule 7.
* **5. Tiêu chí nghiệm thu (Acceptance Criteria):**
  * Nhận diện mã vạch trong $< 0.5\text{ s}$ ➔ Tự động thêm giỏ POS hoặc chọn hàng DC. Đã kiểm chứng thực tế 100% đạt yêu cầu.

---

### [BƯỚC 3] IN TEM NHÃN MÃ LÔ HÀNG (DC) & TEM STICKER GIẢM GIÁ XẢ HÀNG TRÊN KỆ (FEFO) - [ĐÃ HOÀN THÀNH 100%]
* **1. Mục tiêu:**
  * Cho phép in tem nhãn barcode lô hàng dán lên thùng hàng khi nhập từ DC.
  * Cho phép in tem sticker giảm giá xả hàng (15%, 30%, 40%, 50%) dán lên sản phẩm cận date trên quầy kệ theo chuẩn SOP đảo kệ.
* **2. Căn cứ trong SSOT:**
  * Mục 12.2: In mã tem lô hàng (`LOT-DC-...`) để dán lên thùng lưu kho khi tiếp nhận từ DC.
  * Mục 13.1 & 13.2 (SOP 5 bước đảo kệ): Bước 4 - Dán sticker giảm giá xả hàng lên sản phẩm cận date mặt tiền kệ.
* **3. File & Component tác động:**
  * `Frontend/src/components/PrintBatchLabelModal.jsx` (Modal xem trước & in tem nhãn barcode lô hàng DC chuẩn máy in nhiệt cầm tay Xprinter/Gprinter).
  * `Frontend/src/components/PrintDiscountStickerModal.jsx` (Modal xem trước & in sticker giảm giá xả hàng Quick Markdown 15% - 50%).
  * `Frontend/src/components/DcIntakeView.jsx` (Nút "In Tem" trong bảng Lịch sử nhận lô và nút In Tem nhanh khi tiếp nhận lô thành công).
  * `Frontend/src/components/FefoMonitorView.jsx` (Nút "In Sticker" tại mỗi hàng lô cảnh báo và nút in tại Bước 4 của checklist SOP Đảo kệ).
  * `Frontend/src/index.css` (Quy tắc `@media print` cách ly khung `#print-batch-label-container` và `#print-discount-sticker-container`).
* **4. Kết quả nghiệm thu thực tế:**
  * Đã kiểm chứng tại Tiếp Nhận DC: Bấm nút "In Tem" trên lô hàng mở modal xem trước tem nhãn chuẩn nhiệt $100 \times 60\text{ mm}$, hiển thị Mã lô `LOT-BM-SW-999`, Tên SP, MFG, EXP, RSL 97% và Barcode Code-128.
  * Đã kiểm chứng tại Giám Sát FEFO: Bấm nút "In Sticker" trên lô `LOT-SEED-YELLOW-01` mở modal sticker xả hàng, chọn mức giảm từ -30% sang -50% cập nhật giá mới ngay lập tức. Modal SOP Đảo kệ có nút in trực tiếp tại Bước 4.
* **5. Tiêu chí nghiệm thu (Acceptance Criteria):**
  * Hộp thoại in xuất hiện đúng khổ tem nhãn, sắc nét, hoạt động trơn tru không lỗi console. Đã kiểm chứng thực tế 100% đạt yêu cầu.

---

### [BƯỚC 4] QUẢN LÝ VÒNG ĐỜI ĐƠN ĐẶT HÀNG PO & NHẬP KHO LIÊN KẾT ĐƠN PO TỪ DC
* **1. Mục tiêu:**
  * Nâng cấp màn hình Dự báo ROP và Nhập kho DC thành một chuỗi liên kết khép kín: Dự báo ROP ➔ Tạo đơn PO gửi DC ➔ Quản lý trạng thái đơn PO ➔ Xe tải DC đến chỉ cần chọn đơn PO để nhập kho đối chiếu.
* **2. Căn cứ trong SSOT:**
  * Mục 14: Đơn đặt hàng bổ sung gửi về Kho tổng DC (Purchase Orders) dựa trên ROP.
  * Bảng CSDL: `PurchaseOrders` và `PurchaseOrderItems` (đã có trong CSDL nhưng chưa có giao diện quản lý chi tiết).
* **3. File & Component tác động:**
  * `Frontend/src/components/ReorderPredictorView.jsx` (Thêm tab "Lịch Sử Đơn Đặt Hàng PO Gửi DC").
  * `Frontend/src/components/DcIntakeView.jsx` (Thêm tùy chọn "Nhập kho theo Đơn PO đã đặt").
  * `Backend/src/presentation/controllers/ForecastController.js` (API tra cứu và cập nhật trạng thái đơn PO).
* **4. Chi tiết kỹ thuật:**
  * Tab Đơn PO: Xem danh sách các đơn đã đặt (`PO-DC-...`), ngày tạo, dự toán tiền, trạng thái (`PENDING` Chờ duyệt, `SHIPPING` Đang chuyển hàng, `COMPLETED` Đã nhập kho).
  * Khi xe tải DC đến: Nhân viên kho chọn mã đơn PO ➔ Hệ thống tự động điền danh sách sản phẩm và số lượng đặt, nhân viên chỉ việc kiểm tra date thực tế ($RSL \ge 70\%$) và bấm xác nhận nhập kho.
* **5. Tiêu chí nghiệm thu:**
  * Tạo đơn PO từ màn hình ROP ➔ Đơn xuất hiện trong danh sách Lịch sử PO.
  * Mở màn hình Nhập DC ➔ Chọn đơn PO vừa tạo ➔ Nhập kho thành công ➔ Đơn PO tự động chuyển trạng thái `COMPLETED`.

---

### [BƯỚC 5] LỊCH SỬ TRA CỨU BÀN GIAO CA TRỰC & IN BIÊN BẢN GIAO CA ĐIỆN TỬ
* **1. Mục tiêu:**
  * Cho phép Cửa hàng trưởng và Thu ngân tra cứu toàn bộ lịch sử các ca trực đã chốt (ca sáng, ca chiều) trong tuần, xem độ lệch tiền két và in biên bản bàn giao ca.
* **2. Căn cứ trong SSOT:**
  * Mục 15: Quản lý lịch trực và bàn giao ca làm việc (SOP 4 bước chốt ca thu ngân).
  * Mục 11: Bàn giao ca trực điện tử và đối soát tài chính hao hụt.
* **3. File & Component tác động:**
  * `Frontend/src/components/ShiftHandoverView.jsx` (Thêm tab "Lịch Sử Ca Trực Đã Chốt" và modal in biên bản).
  * Lưu trữ dữ liệu ca trực vào CSDL LocalDB (bảng `AuditLogs` hoặc endpoint ca trực).
* **4. Chi tiết kỹ thuật:**
  * Bảng lịch sử ca: Mã phiên ca, Tên ca (Ca sáng / Ca chiều), Thu ngân giao, Thu ngân nhận, Doanh thu hệ thống, Tiền mặt thực tế, Chênh lệch (0đ / Thừa / Thiếu), Số lượng hàng hủy trong ca, Trạng thái ký số.
  * Nút "In Biên Bản Bàn Giao": Xuất bản in khổ A4/A5 tóm tắt phiên làm việc, có chữ ký của Thu ngân cũ, Thu ngân mới và Cửa hàng trưởng phê duyệt.
* **5. Tiêu chí nghiệm thu:**
  * Chốt ca thu ngân xong ➔ Phiên ca được lưu vào Lịch sử.
  * Bấm "Xem Biên Bản" / "In Phiếu" ➔ Hiển thị bản in đối soát tài chính đầy đủ chữ ký 2 bên.

---

### [BƯỚC 6] KẾT NỐI API THỜI TIẾT THỜI GIAN THỰC & RÀNG BUỘC GIỜ ĐÓNG/MỞ CỬA HÀNG [ĐÃ HOÀN THÀNH 100% ✅]
* **1. Mục tiêu:**
  * Tự động lấy điều kiện thời tiết tại TP. Biên Hòa, Đồng Nai qua API thời tiết để tự động cập nhật hệ số $W_{factor}$ cho ROP và quầy POS.
  * Hiện thực hóa quy tắc: Khi cửa hàng ở trạng thái `CLOSED`, `INVENTORY` hoặc `SUSPENDED`, quầy POS tự động khóa chức năng thanh toán (tuân thủ triệt để Rule 1 & Mục 10 SSOT).
* **2. Căn cứ trong SSOT:**
  * Mục 5 & Mục 10: Ràng buộc trạng thái cửa hàng `StoreProfile` (OPEN / CLOSED / INVENTORY / SUSPENDED). Nếu không phải `OPEN` thì POS khóa thanh toán.
  * Mục 26.2 (Tính năng nâng cao số 2): Kết nối API thời tiết thời gian thực (Open-Meteo API trạm Biên Hòa $10.9574^\circ\text{N}, 106.8427^\circ\text{E}$).
* **3. File & Component tác động:**
  * `Frontend/src/utils/weatherService.js`: Kết nối Open-Meteo API thời gian thực, tự động map WMO code sang `SUNNY` ($K=1.4$), `RAINY` ($K=0.8$), `NORMAL` ($K=1.0$).
  * `Frontend/src/components/Header.jsx`: Badge trạng thái cửa hàng, nút đồng bộ Open-Meteo có hiệu ứng quay, dropdown kịch bản thời tiết, Modal chuyển đổi trạng thái cửa hàng dành cho Quản lý.
  * `Frontend/src/components/PosCheckoutView.jsx`: Banner cảnh báo toàn quầy khi cửa hàng đóng ca/kiểm kê; khóa cứng nút thanh toán POS với nhãn cảnh báo Rule 1 SSOT; chặn xuất bán FEFO ở biên logic.
  * `Frontend/src/App.jsx`: Tự động gọi đồng bộ thời tiết Open-Meteo khi tải trang và lưu trạng thái cửa hàng qua API `apiUpdateStoreProfile`.
* **4. Tiêu chí nghiệm thu [ĐÃ ĐẠT]:**
  * Tự động lấy thời tiết TP. Biên Hòa thời gian thực, nút đồng bộ cập nhật nhiệt độ và hệ số bán tức thì.
  * Chuyển trạng thái cửa hàng sang `CLOSED` / `INVENTORY` / `SUSPENDED` ➔ Màn hình POS hiện Banner cảnh báo màu đỏ/vàng, nút Thanh toán bị khóa cứng có icon Khóa và nhãn trạng thái.
  * Chuyển lại trạng thái `OPEN` ➔ Quầy POS mở khóa, bán hàng và trừ kho FEFO bình thường.

---

## TỔNG KẾT BẢNG TIẾN ĐỘ 6 BƯỚC HOÀN THIỆN TRANG WEB

| Bước | Tên Bước Hoàn Thiện | Màn hình tác động chính | Trọng tâm nghiệp vụ | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **Bước 1** | **Xuất Excel & In Hóa đơn K80** | POS & SpoilageDisposal | Xuất CSV UTF-8 Sổ hao hụt & In nhiệt K80 POS | **HOÀN THÀNH 100% ✅** |
| **Bước 2** | **Quét Barcode bằng Camera** | POS & DcIntake | WebRTC Camera Barcode Scanner + Laser reticle + Beep 1200Hz | **HOÀN THÀNH 100% ✅** |
| **Bước 3** | **In Tem Lô & Sticker Giảm Giá** | DcIntake & FefoMonitor | In tem nhãn kiện hàng DC 100x60mm + Sticker Quick Markdown 15%-50% | **HOÀN THÀNH 100% ✅** |
| **Bước 4** | **Quản Lý Đơn PO & Nhập Kho Theo Đơn** | ReorderPredictor & DcIntake | Vòng đời đơn PO gửi DC + Tiếp nhận xe tải DC 1-chạm liên kết đơn PO | **HOÀN THÀNH 100% ✅** |
| **Bước 5** | **Lịch Sử Giao Ca & In Biên Bản Giao Ca** | ShiftHandover | Tra cứu lịch sử ca trực, đối soát tiền két + Modal in biên bản bàn giao 3 chữ ký | **HOÀN THÀNH 100% ✅** |
| **Bước 6** | **API Thời Tiết & Khóa Bán Khi Đóng Cửa** | Header, POS, StoreProfile | Thời tiết TP. Biên Hòa thời gian thực + Khóa POS khi đóng cửa theo Rule 1 SSOT | **HOÀN THÀNH 100% ✅** |

---

> [!NOTE]
> **KẾT LUẬN TIẾN ĐỘ:** Toàn bộ **6/6 bước** trong kế hoạch hoàn thiện trang web đã được triển khai đầy đủ, build production thành công và kiểm thử thực tế trên trình duyệt bằng agent đạt 100% tiêu chí nghiệm thu. Hệ thống web app LHU Mart đã sẵn sàng toàn diện phục vụ demo đồ án tốt nghiệp!

