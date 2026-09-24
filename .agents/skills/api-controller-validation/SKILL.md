---
name: api-controller-validation
description: Chuẩn hóa xây dựng Controller, Validation dữ liệu đầu vào và định dạng chuẩn JSON Response cho API
---

# API CONTROLLER & VALIDATION STANDARDS

Bộ kỹ năng này quy định quy chuẩn thiết kế các API Controller, cơ chế kiểm tra tính hợp lệ dữ liệu (Validation) và cấu trúc phản hồi chuẩn hóa (Uniform Response).

---

### 1. Cấu trúc chuẩn của JSON Response
Mọi API trả về cho Frontend bắt buộc tuân theo định dạng:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Thao tác thành công",
  "data": { ... },
  "errors": null,
  "timestamp": "2026-09-24T20:00:00Z"
}
```

Khi có lỗi (4xx, 5xx):
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Dữ liệu đầu vào không hợp lệ hoặc vi phạm nghiệp vụ",
  "data": null,
  "errors": [
    { "field": "expiry_date", "message": "Hạn sử dụng phải lớn hơn ngày nhập" }
  ],
  "timestamp": "2026-09-24T20:00:00Z"
}
```

---

### 2. Bộ quy tắc HTTP Status Code
- `200 OK`: Truy vấn danh sách, chi tiết thành công (`GET`), hoặc cập nhật thành công (`PUT/PATCH`).
- `201 Created`: Tạo mới thành công (Nhập lô hàng `POST /api/batches`, Giao dịch POS `POST /api/sales`).
- `400 Bad Request`: Lỗi nghiệp vụ (ví dụ: tồn kho không đủ để xuất FEFO, vi phạm ràng buộc âm).
- `401 Unauthorized`: Chưa đăng nhập hoặc Token JWT hết hạn.
- `403 Forbidden`: Không có quyền truy cập (ví dụ: Nhân viên cố phê duyệt tiêu hủy).
- `404 Not Found`: Không tìm thấy tài nguyên (Sản phẩm, Lô hàng không tồn tại).
- `422 Unprocessable Entity`: Dữ liệu gửi lên sai định dạng cú pháp validation.
- `500 Internal Server Error`: Lỗi máy chủ không mong muốn (kèm mã tracking log).

---

### 3. Nguyên tắc Validation theo Domain
1. **Tiếp nhận Lô hàng (`POST /api/batches`):**
   - `product_id`: Bắt buộc, phải tồn tại trong CSDL.
   - `batch_code`: Chuỗi không rỗng, duy nhất trong hệ thống.
   - `import_date`: Ngày hợp lệ, mặc định là ngày hiện tại.
   - `expiry_date`: Bắt buộc > `import_date`.
   - `initial_quantity`: Số nguyên > 0.
   - `cost_price`: Số thực > 0.

2. **Bán hàng lẻ FEFO (`POST /api/sales`):**
   - `items`: Mảng ít nhất 1 sản phẩm.
   - `product_id`: Phải tồn tại.
   - `quantity`: Số nguyên > 0.
   - Không truyền `batch_id` từ client: Backend **tự động phân bổ FEFO** theo hạn gần nhất.
   - Kiểm tra `quantity <= tổng tồn kho khả dụng`. Nếu vượt quá, ném lỗi 400.

3. **Tiêu hủy Hàng hỏng (`POST /api/spoilage`):**
   - `batch_id`: Phải tồn tại và còn tồn > 0.
   - `disposed_quantity`: Số nguyên > 0 và <= tồn hiện tại của lô.
   - `reason`: Bắt buộc chọn từ danh mục: `EXPIRED`, `DAMAGED_TRANSIT`, `DAMAGED_SHELF`, `DEFECTIVE_PACKAGING`.
   - `approved_by`: Phải là người có vai trò Cửa hàng trưởng (`STORE_MANAGER`).
