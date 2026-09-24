---
name: code-review
description: Tiêu chuẩn thẩm định mã nguồn (Clean Code, Bảo mật, Hiệu năng, Kiểm tra ràng buộc nghiệp vụ)
---

# CODE REVIEW CHECKLIST & STANDARDS

Bộ kỹ năng này hướng dẫn việc rà soát chất lượng mã nguồn trước khi merge hoặc triển khai cho hệ thống Chống lãng phí bán lẻ.

---

### 1. Checklist Nghiệp vụ Cốt lõi (Business Integrity)
- [ ] **Quy tắc FEFO:** Việc trừ kho có sắp xếp chính xác `expiry_date ASC` không?
- [ ] **Chống Tồn kho Âm:** Có điều kiện chặn `quantity - deduct >= 0` ở cả Service và DB constraint không?
- [ ] **Hạn sử dụng Lô hàng:** Có kiểm tra `expiry_date > import_date` lúc tạo lô không?
- [ ] **Khóa Mã POS:** Lô hết hạn (`status = 'EXPIRED'`) có bị chặn tuyệt đối không cho phép quét thanh toán tại quầy không?
- [ ] **Thẩm quyền Tiêu hủy:** Phiếu tiêu hủy bắt buộc phải có `approved_by` thuộc vai trò Cửa hàng trưởng (`STORE_MANAGER`).

---

### 2. Checklist Kỹ thuật & Hiệu năng
- [ ] **Indexing Database:** Các cột hay dùng truy vấn lọc như `expiry_date`, `product_id`, `status` đã được tạo Index chưa?
- [ ] **N+1 Query:** Tránh vòng lặp query trong database khi duyệt qua danh sách sản phẩm và các lô liên quan.
- [ ] **Bảo mật:**
  - Không hardcode mật khẩu hay chuỗi kết nối nhạy cảm trong code.
  - Sử dụng parameterized queries để phòng chống triệt để SQL Injection.
  - Mã hóa mật khẩu người dùng bằng bcrypt/argon2.
- [ ] **Clean Code & Formatting:**
  - Tên hàm và biến rõ nghĩa (`calculateRemainingShelfLife()`, `isReorderNeeded()`).
  - Hàm xử lý đơn nhiệm (Single Responsibility Principle).
  - Có log lỗi chi tiết phục vụ việc giám sát và truy vết sự cố.
