# 03. TẠO KHUNG CLEAN ARCHITECTURE (BACKEND)

---

### 1. Phân tầng Kiến trúc (Layered Architecture)
```text
Backend/
├── src/
│   ├── domain/               # Enterprise Business Rules (Entities, Value Objects)
│   │   ├── Product.js
│   │   ├── Batch.js
│   │   └── SpoilageRecord.js
│   ├── use-cases/            # Application Business Rules (Services)
│   │   ├── ReceiveBatchUseCase.js
│   │   ├── ProcessFefoSaleUseCase.js
│   │   ├── EvaluateShelfLifeUseCase.js
│   │   ├── ApproveSpoilageUseCase.js
│   │   └── PredictReorderPointUseCase.js
│   ├── interfaces/           # Interface Adapters
│   │   ├── controllers/      # REST API Controllers
│   │   ├── middlewares/      # Error handler, Auth JWT, Role check
│   │   └── repositories/     # Abstract Repository Contracts
│   └── infrastructure/       # Frameworks & Drivers
│       ├── database/         # SQL Server Connection Pool & Queries
│       └── webserver/        # Express app & route definitions
```

---

### 2. Nguyên tắc Bất biến
- Quy tắc phụ thuộc (Dependency Inversion Principle): Tầng trong cùng (`domain`) không được phụ thuộc vào tầng ngoài (`infrastructure`).
- Tầng `use-cases` chỉ gọi Repository thông qua interface trừu tượng.
- Trả về mã lỗi thống nhất qua Global Error Handler.
