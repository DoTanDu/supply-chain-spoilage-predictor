# 11. TIẾP NHẬN LÔ HÀNG TỪ KHO TỔNG (DC GOODS INTAKE)

---

### 1. Luồng nghiệp vụ
1. Xe tải từ Kho tổng (DC) giao hàng đến cửa hàng bán lẻ kèm phiếu giao hàng.
2. Nhân viên kho / Nhân viên bán hàng mở phân hệ **"Nhập lô hàng (DC Intake)"**.
3. Chọn sản phẩm từ danh mục có sẵn (hoặc quét mã vạch).
4. Nhập thông tin lô: Mã lô, Ngày sản xuất (MFG), Hạn sử dụng (EXP), Số lượng nhập, Giá vốn nhập.
5. Hệ thống kiểm tra hợp lệ:
   - $EXP > MFG$ và $EXP > \text{Ngày hiện tại}$.
   - Số lượng $> 0$ và Giá vốn $> 0$.
6. Nhấn **"Xác nhận nhập kho"** $\rightarrow$ Bản ghi được lưu vào bảng `batches`, cập nhật tổng tồn sản phẩm và ghi Audit Log.
