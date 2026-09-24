# 07. AUTH LOGIN VÀ QUẢN LÝ PHIÊN ĐĂNG NHẬP

---

### 1. Luồng Xác thực (Authentication Flow)
1. Người dùng nhập `username` và `password` tại màn hình Đăng nhập.
2. Hệ thống kiểm tra trong bảng `users` $\rightarrow$ Xác thực hash mật khẩu.
3. Tạo JWT Token chứa `userId`, `username`, `role` (`STORE_MANAGER` hoặc `STORE_STAFF`), `storeId`.
4. Trả về Token và thông tin User cho Frontend lưu trữ tại `localStorage`.
5. Mọi request tiếp theo đính kèm Header: `Authorization: Bearer <token>`.

---

### 2. Trải nghiệm Chuyển đổi Nhanh Vai trò (Role Switcher)
- Để phục vụ chấm điểm và demo trực quan cho Giảng viên hướng dẫn:
- Frontend tích hợp nút chuyển đổi nhanh (1-Click Switch):
  - 🟢 **Cửa hàng trưởng (Đỗ Tấn Du):** Mở khóa toàn quyền, xem biểu đồ doanh số, KPI thất thoát, duyệt phiếu hủy.
  - 🔵 **Nhân viên thu ngân (Đoàn Minh Quân):** Chế độ bán lẻ POS, xem danh sách lô cần đảo date, form nhập hàng từ DC.
