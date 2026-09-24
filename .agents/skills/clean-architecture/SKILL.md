---
name: clean-architecture
description: Hướng dẫn cấu trúc Clean Architecture cho Backend API và Component Structure cho Frontend SPA
---

# CLEAN ARCHITECTURE & PHÂN TẦNG HỆ THỐNG

### 1. Kiến trúc Backend 3 Tầng (3-Tier Layered Architecture)
```
Backend/
├── src/
│   ├── controllers/      # Tiếp nhận HTTP Request, gọi Services, trả về HTTP Response (DTO)
│   ├── services/         # Chứa Business Logic (FEFO, ROP, Spoilage calculation)
│   ├── repositories/     # Tương tác trực tiếp CSDL SQL Server (Data Access Layer)
│   ├── models/           # Định nghĩa cấu trúc Entities & Schemas
│   ├── middlewares/      # Xác thực JWT, xử lý phân quyền (Role Guard), Validation
│   ├── utils/            # Helper functions, format date, tính toán toán học
│   └── config/           # Cấu hình CSDL, biến môi trường .env
```

### 2. Nguyên tắc Bất di Bất dịch
* **Controller:** Không được viết câu lệnh SQL hoặc tính toán logic nghiệp vụ phức tạp trực tiếp trong Controller.
* **Service:** Chứa 100% logic nghiệp vụ (FEFO, ROP, K-factor).
* **Repository:** Đảm bảo toàn vẹn dữ liệu, sử dụng Transactions khi có nhiều thao tác ghi đồng thời.
* **Response DTO:** Mọi API phản hồi đều theo chuẩn:
  ```json
  {
    "success": true,
    "message": "Thông báo thân thiện",
    "data": { ... }
  }
  ```
