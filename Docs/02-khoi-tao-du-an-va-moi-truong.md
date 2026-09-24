# 02. KHỞI TẠO DỰ ÁN VÀ THIẾT LẬP MÔI TRƯỜNG

---

### 1. Ngăn xếp Công nghệ (Technology Stack)
* **Frontend:** React 19 / Vite, TailwindCSS & Vanilla CSS Design Tokens, Lucide Icons, Chart.js / Recharts.
* **Backend:** Node.js / Express.js (hoặc Python FastAPI) tuân thủ Clean Architecture.
* **Database:** Microsoft SQL Server LocalDB `(localdb)\mssqllocaldb`.
* **Database Client:** `mssql` (Tedious driver) / `pyodbc`.
* **Dev Tools:** Git, VS Code, Google Antigravity IDE với bộ Agent Skills `.agent/skills/`.

---

### 2. Biến môi trường chuẩn (`.env`)
```env
PORT=5000
NODE_ENV=development
DB_SERVER=(localdb)\\mssqllocaldb
DB_NAME=SupplyChain_SpoilageDB
DB_TRUSTED_CONNECTION=true
JWT_SECRET=super_secret_spoilage_retail_key_2026
```

---

### 3. Cấu trúc thư mục dự án
```text
thuyet minh/
├── .agent/
│   ├── AGENTS.md
│   └── skills/
│       ├── api-controller-validation/
│       ├── clean-architecture/
│       ├── code-review/
│       ├── repository-pattern/
│       ├── spoilage-business-rules/
│       ├── sqlserver-database/
│       └── test-case-clean-architecture/
├── Backend/              # Tầng API và logic nghiệp vụ Clean Architecture
├── Database/             # DDL, Migration script, Stored Procedure, Seed Data
├── Docs/                 # Tài liệu đặc tả kỹ thuật từng sprint (00 -> 14)
├── Frontend/             # Giao diện người dùng Web Application SPA
└── README.md
```
