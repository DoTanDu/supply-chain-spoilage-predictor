# 00. CHỐT YÊU CẦU VÀ QUYẾT ĐỊNH KỸ THUẬT (MVP SPECIFICATION)

Dự án: **Nền tảng Quản trị Chuỗi cung ứng Bán lẻ Chống lãng phí (Supply Chain Spoilage Predictor)**  
Sinh viên thực hiện: **Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946)**  
GVHD: **ThS. Lê Minh Nhật**

---

### Quy trình nghiệp vụ chính của Cửa hàng
1. Nhân viên / Quản lý đăng nhập vào hệ thống theo vai trò.
2. Kiểm tra Dashboard: theo dõi tồn kho, doanh số, tỷ lệ lãng phí và các lô hàng sắp hết hạn (cận date).
3. Khi nhận hàng từ Kho tổng (DC): Nhân viên kiểm tra date, nhập mã lô, số lượng, giá vốn vào hệ thống.
4. Bán lẻ tại quầy thu ngân (POS): Thu ngân quét mã sản phẩm $\rightarrow$ Hệ thống tự động trừ kho theo nguyên tắc **FEFO (First Expired, First Out)** lô có hạn gần nhất.
5. Khi hàng chạm ngưỡng cận date:
   - Cảnh báo Vàng ($10\% - 20\%$ RSL): Theo dõi sát.
   - Cảnh báo Đỏ ($\le 10\%$ RSL hoặc $\le 3$ ngày): Kích hoạt xả hàng giảm giá, đảo hàng ra phía trước kệ.
   - Hết hạn ($\le 0$ ngày): Khóa mã bán trên POS, lập phiếu tiêu hủy.
6. Khi phát hiện hàng hỏng/hết hạn: Nhân viên lập phiếu tiêu hủy $\rightarrow$ Cửa hàng trưởng phê duyệt $\rightarrow$ Hạch toán thiệt hại tài chính.
7. Khi tồn kho xuống dưới ngưỡng ROP hoặc tốc độ bán chậm ($DOS > DUE$): Hệ thống cảnh báo đề xuất đặt hàng lại từ DC.
8. Dashboard thống kê và Audit Log được cập nhật thời gian thực.

---

### Phạm vi MVP gồm có:
* **Đăng nhập và phân quyền:** Hỗ trợ 2 vai trò chuẩn: *Cửa hàng trưởng (Store Manager)* và *Nhân viên bán hàng (Store Staff)*.
* **Cấu hình cửa hàng đơn (Single Store):** Tập trung sâu vào luồng vận hành của 1 siêu thị/cửa hàng tiện lợi bán lẻ.
* **Quản lý danh mục sản phẩm:** Phân loại theo ngành hàng (Sữa & Chế phẩm, Đồ uống, Bánh kẹo, Thực phẩm mát, Hàng hộp).
* **Quản lý Lô hàng & Giám sát FEFO:** Theo dõi hạn sử dụng chi tiết từng lô, chỉ số % vòng đời còn lại (RSL), 3 màu cảnh báo trực quan.
* **Tiếp nhận Lô hàng từ Kho tổng (DC):** Form nhập hàng trực quan, kiểm tra chặt chẽ `expiry_date > import_date`.
* **Bán lẻ POS thông minh:** Giao diện bán hàng nhanh, tự động trừ kho FEFO, ghi nhận cờ thời tiết (Nắng/Mưa) và ngày lễ để phục vụ AI dự báo.
* **Phiếu tiêu hủy & Hạch toán thiệt hại:** Ghi nhận lý do hư hỏng, phê duyệt và tự động tính tổng tiền thiệt hại và tỷ lệ hao hụt %.
* **Dự báo Điểm đặt hàng (ROP) & Cảnh báo Nguy cơ (DOS > DUE):** Thuật toán tự động tính $ROP = (d \times L) + SS$.
* **Dashboard điều hành cao cấp:** Biểu đồ tương tác, thẻ KPI, thanh cảnh báo khẩn cấp, xuất dữ liệu báo cáo.
* **Audit Log:** Ghi vết mọi hoạt động nhập lô, bán hàng, tiêu hủy.

---

### Chưa làm trong MVP (Out of Scope):
* Không làm luồng điều chuyển hàng qua lại giữa các cửa hàng vệ tinh (Inter-shop transfer).
* Không tích hợp cổng thanh toán thẻ ngân hàng / ví điện tử trực tuyến (chỉ ghi nhận tiền mặt/chuyển khoản quầy).
* Không làm thủ tục giấy tờ pháp lý trả hàng ngược về nhà máy sản xuất (Return-to-Vendor paperwork).
