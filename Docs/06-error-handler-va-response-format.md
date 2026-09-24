# 06. ERROR HANDLER VÀ RESPONSE FORMAT CHUẨN HÓA

---

### 1. Định dạng JSON Response thống nhất
```typescript
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  errors?: Array<{ field?: string; message: string }>;
  timestamp: string;
}
```

---

### 2. Danh mục Mã lỗi Nghiệp vụ Cốt lõi
- `INSUFFICIENT_STOCK_ERROR (400)`: Số lượng bán vượt quá tổng tồn kho còn hạn.
- `BATCH_EXPIRED_ERROR (400)`: Lô hàng đã hết hạn sử dụng, cấm xuất bán.
- `INVALID_EXPIRY_DATE (422)`: Ngày hết hạn phải lớn hơn ngày nhập hàng từ DC.
- `UNAUTHORIZED_DISPOSAL (403)`: Chỉ Quản lý cửa hàng mới có quyền phê duyệt phiếu tiêu hủy.
- `DUPLICATE_BATCH_CODE (409)`: Mã lô hàng đã tồn tại trong hệ thống.
