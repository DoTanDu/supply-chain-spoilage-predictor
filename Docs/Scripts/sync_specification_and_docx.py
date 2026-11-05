# -*- coding: utf-8 -*-
"""
Script Đồng bộ Tài liệu Thuyết minh Đồ án (SSOT Markdown & File Word Báo cáo 27 Mục)
Chuẩn hóa theo góp ý của ThS. Lê Minh Nhật:
1. Chuỗi Cửa hàng Bán lẻ Tinh gọn (3 Chi nhánh MVP: Bửu Long, Tân Phong, Trảng Dài + Kho tổng DC Biên Hòa)
2. CSDL 15 bảng chuẩn 3NF (Thêm ai_forecasts & stock_transfers, store_id, 36 FKs named, sysdiagrams)
3. 3 Actor cốt lõi (OWNER, MANAGER, STAFF) & 26 Nhóm User Stories (DAC_TA_USER_STORIES_3_ACTOR_26_NHOM_NGHIEP_VU.md)
4. Động cơ AI 3 bước: LightGBM (1.824 dòng dataset mẫu, MAE=1.508) + Google OR-Tools MILP Ma trận Điều phối Liên Cửa hàng
5. Giao diện 100% Light Mode (Chuẩn máy chiếu giảng đường) + Phân hệ StockTransferView.jsx
"""

import os
import sys
import io
import shutil

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DOCS_DIR = r"c:\thuyet minh\Docs"
MD_SSOT_PATH = os.path.join(DOCS_DIR, "Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md")
DOCX_PATH = os.path.join(DOCS_DIR, "Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx")
WORD_DOCS_MIRROR = os.path.join(DOCS_DIR, "Word_Documents", "Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.docx")
BUILD_DOCX_SCRIPT = os.path.join(DOCS_DIR, "Scripts", "build_docx_27muc.py")

print("[SYNC] Bắt đầu đồng bộ Tài liệu Thuyết minh Đồ án & File Word Báo cáo...")

# ─── 1. CẬP NHẬT FILE PYTHON BUILD_DOCX_27MUC.PY ─────────────────────────────
with open(BUILD_DOCX_SCRIPT, "r", encoding="utf-8") as f:
    code_text = f.read()

# 1.1 Cập nhật Tiêu đề & Giới thiệu Mục 1, 2, 3
old_sec1_target = '''    sec(doc, 1, "Mục tiêu hệ thống")
    body(doc,
        "Xây dựng website quản lý một cửa hàng bán lẻ tinh gọn (Single Retail Store – Cửa hàng "
        "Bán lẻ Tiện lợi LHU Mart, mã: RETAIL-STORE-01) thuộc đề tài 'Nền tảng Quản trị Chuỗi "
        "cung ứng Chống lãng phí (Supply Chain Spoilage Predictor)'. Hệ thống cho phép quản lý "
        "việc tiếp nhận hàng theo đợt từ Trung tâm Phân phối Kho tổng (DC Biên Hòa), quản lý "
        "danh mục sản phẩm FMCG (chống trùng lặp >= 85%), kiểm soát hạn sử dụng từng lô "
        "(Shelf-Life), cảnh báo cận date 3 cấp màu (Xanh / Vàng / Đỏ), bán lẻ tại quầy POS "
        "theo nguyên tắc FEFO (First Expired, First Out – Bán hàng = Xuất kho trực tiếp, tự động "
        "bẻ lô), giảm giá xả hàng Quick Markdown (15%, 30%, 40%, 50%), đảo kệ mặt tiền 5 bước "
        "SOP, tiêu hủy hàng quá date gắn liền Sổ hao hụt tài chính bất biến, dự báo nhu cầu "
        "tiêu thụ ROP dựa trên tốc độ bán 14 ngày + thời tiết + ngày lễ để đề xuất đơn đặt hàng "
        "bổ sung gửi về Kho tổng DC, và bàn giao ca trực điện tử 4 bước.")
    body(doc,
        "Hệ thống sử dụng Microsoft SQL Server LocalDB (retail_spoilage_db) làm cơ sở dữ "
        "liệu chính và kiến trúc Clean Architecture 4 tầng (Domain, Application, Infrastructure, Presentation).")
    body(doc,
        "Do chỉ quản lý 1 cửa hàng bán lẻ duy nhất (RETAIL-STORE-01), hệ thống tuyệt đối không phát "
        "triển chức năng luân chuyển ngang giữa các shop hoặc thủ tục hoàn trả nhà cung cấp phức tạp. "
        "Tất cả các đợt hàng, lô hàng, bán lẻ POS, sổ hao hụt, dự báo ROP và dashboard đều xoay quanh "
        "một hồ sơ cửa hàng cố định (StoreProfile) liên kết với Kho tổng DC Biên Hòa.")'''

new_sec1_content = '''    sec(doc, 1, "Mục tiêu hệ thống")
    body(doc,
        "Xây dựng nền tảng website quản lý Chuỗi Cửa hàng Bán lẻ Tinh gọn (Chuỗi 3 Chi nhánh LHU Mart: "
        "Store A Bửu Long RETAIL-STORE-01, Store B Tân Phong RETAIL-STORE-02, Store C Trảng Dài RETAIL-STORE-03) "
        "thuộc đề tài 'Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor)'. "
        "Hệ thống cho phép quản lý toàn diện việc tiếp nhận hàng theo đợt từ Trung tâm Phân phối Kho tổng "
        "(DC Biên Hòa), kiểm định date nghiêm ngặt (RSL >= 70%), quản lý danh mục FMCG (chống trùng >= 85%), "
        "kiểm soát hạn dùng từng lô (Shelf-Life), cảnh báo 3 cấp màu (Xanh / Vàng / Đỏ), bán lẻ tại quầy POS "
        "theo nguyên tắc FEFO tuyệt đối (Bán hàng = Xuất kho tự động bẻ lô), giảm giá xả hàng Quick Markdown "
        "(15%, 30%, 40%, 50%), quy trình SOP 5 bước đảo kệ mặt tiền, tiêu hủy hàng quá date gắn liền Sổ hao hụt "
        "tài chính bất biến, bàn giao ca trực điện tử 4 bước, và Động cơ AI 3 bước chuẩn GVHD (Mô hình LightGBM "
        "dự báo sức mua 7 ngày + Bộ giải Tối ưu có Ràng buộc Google OR-Tools MILP cân bằng tồn kho và điều chuyển "
        "nội bộ giữa các chi nhánh trước khi đặt thêm từ DC).")
    body(doc,
        "Hệ thống sử dụng Microsoft SQL Server LocalDB (retail_spoilage_db – 15 bảng chuẩn 3NF, 36 Foreign Keys, "
        "sysdiagrams) làm cơ sở dữ liệu chính và tuân thủ Kiến trúc Clean Architecture 4 tầng (Domain, Application, "
        "Infrastructure, Presentation).")
    body(doc,
        "Mô hình chuỗi liên kết tập trung: Cửa hàng liên kết trực tiếp với Kho tổng DC Biên Hòa và hỗ trợ điều phối "
        "hàng tồn cận date giữa 3 chi nhánh nhằm tối ưu hóa vòng đời thực phẩm, giải quyết triệt để tình trạng 'Cửa hàng "
        "A dư thừa sắp hủy – Cửa hàng B thiếu hụt đứt hàng' trước khi phát sinh đơn đặt hàng bổ sung mới từ DC.")'''

if old_sec1_target in code_text:
    code_text = code_text.replace(old_sec1_target, new_sec1_content)
    print("  ✓ Đã cập nhật Mục 1 trong build_docx_27muc.py (Mô hình Chuỗi 3 Chi nhánh & AI Điều phối)")

# 1.2 Cập nhật Mục 2 Phạm vi hệ thống (19 nhóm nghiệp vụ)
old_sec2_target = '''        "16. Dashboard điều hành thời gian thực (6 chỉ số KPI tài chính, Top 5 Bán chạy/Hao hụt, 4-Tab Action Board)",
        "17. Nhật ký kiểm toán hệ thống bất biến (System Audit Logs – Rule 11)",
    ])'''

new_sec2_content = '''        "16. Dashboard điều hành thời gian thực (6 chỉ số KPI tài chính, Top 5 Bán chạy/Hao hụt, 4-Tab Action Board)",
        "17. Động cơ AI 3 bước: Mô hình LightGBM dự báo nhu cầu 7 ngày + Bộ giải OR-Tools MILP tối ưu điều phối",
        "18. Phân hệ Điều phối Tồn kho Liên Cửa hàng (Stock Transfers 5 bước: PROPOSED -> APPROVED -> IN_TRANSIT -> RECEIVED)",
        "19. Nhật ký kiểm toán hệ thống bất biến (System Audit Logs – Rule 11)",
    ])'''

if old_sec2_target in code_text:
    code_text = code_text.replace(old_sec2_target, new_sec2_content)
    print("  ✓ Đã cập nhật Mục 2 trong build_docx_27muc.py (19 phân hệ nghiệp vụ)")

# 1.3 Cập nhật Mục 3.1
old_sec3_target = '''    sub(doc, "3.1  Chỉ quản lý một cửa hàng bán lẻ duy nhất (Rule 1)")
    body(doc, "Vì chỉ quản lý một cửa hàng bán lẻ duy nhất, hệ thống loại bỏ hoàn toàn các chức năng ngoài phạm vi:")
    bul(doc, [
        "Không tạo nhiều chi nhánh hoặc chuỗi siêu thị đa điểm",
        "Không điều chuyển hàng ngang giữa các cửa hàng (Inter-store Transfer)",
        "Không so sánh doanh số và tồn kho giữa nhiều shop",
        "Không xây dựng thủ tục hoàn trả nhà cung cấp phức tạp (RTV)",
        "Không phân quyền dữ liệu theo từng chi nhánh riêng biệt",
    ])
    body(doc, "Thay vào đó, hệ thống sử dụng bảng chuyên biệt store_profile (StoreProfile) chỉ chứa 1 bản ghi duy nhất:")'''

new_sec3_content = '''    sub(doc, "3.1  Mô hình Chuỗi Cửa hàng Bán lẻ Tinh gọn & Điều phối Cứu hàng Cận Date (Rule 1)")
    body(doc,
        "Theo định hướng nâng cấp của GVHD (ThS. Lê Minh Nhật), hệ thống áp dụng mô hình Chuỗi Cửa hàng Bán lẻ Tinh gọn "
        "(MVP gồm 3 Chi nhánh: Store A Bửu Long RETAIL-STORE-01, Store B Tân Phong RETAIL-STORE-02, Store C Trảng Dài "
        "RETAIL-STORE-03) liên kết trực tiếp với Trung tâm Phân phối DC Biên Hòa:")
    bul(doc, [
        "Mỗi chi nhánh vận hành độc lập tại quầy thu ngân POS theo chuẩn FEFO tuyệt đối và tự quản lý kho quầy kệ.",
        "Toàn chuỗi dùng chung Danh mục Sản phẩm FMCG chuẩn và liên kết chung nguồn nhập hàng từ Kho tổng DC Biên Hòa.",
        "Hỗ trợ phân hệ Điều phối Tồn kho Liên Cửa hàng (Inter-Store Stock Transfer – bảng stock_transfers) nhằm giải bài toán Cung – Cầu nội bộ.",
        "Quy trình điều chuyển 5 bước khép kín kiểm soát bằng khóa ngoại store_id và bảo vệ bằng phân quyền SoD giữa OWNER, MANAGER và STAFF.",
        "Loại bỏ các thủ tục hoàn trả nhà cung cấp (RTV) phức tạp ngoài phạm vi cửa hàng tiện lợi.",
    ])
    body(doc, "Cấu hình 3 chi nhánh trong bảng store_profile:")'''

if old_sec3_target in code_text:
    code_text = code_text.replace(old_sec3_target, new_sec3_content)
    print("  ✓ Đã cập nhật Mục 3.1 trong build_docx_27muc.py")

# 1.4 Cập nhật Mục 4: 3 Actor cốt lõi & 26 User Stories
old_sec4_target = '''    sec(doc, 4, "Nhóm người dùng trong hệ thống")
    body(doc,
        "Hệ thống áp dụng mô hình phân quyền dựa trên vai trò (RBAC) với 4 nhóm người dùng chuẩn "
        "(chi tiết hóa từ 3 Actor cốt lõi: OWNER -> ADMIN, MANAGER -> STORE_MANAGER, và STAFF tách biệt "
        "trách nhiệm thành CASHIER & WAREHOUSE_STAFF), đảm bảo tính tách biệt trách nhiệm (Separation of "
        "Duties – SoD), quyền tối thiểu (Least Privilege) và lưu vết kiểm toán bất biến (Rule 11).")'''

new_sec4_content = '''    sec(doc, 4, "Nhóm người dùng trong hệ thống (3 Actor Cốt lõi & 26 Nhóm User Stories)")
    body(doc,
        "Tiếp thu góp ý của ThS. Lê Minh Nhật, hệ thống chuẩn hóa cấu trúc người dùng xoay quanh 3 Actor cốt lõi "
        "(chi tiết hóa thành 4 vai trò RBAC kỹ thuật: OWNER -> ADMIN, MANAGER -> STORE_MANAGER, STAFF -> CASHIER & WAREHOUSE_STAFF) "
        "với 26 nhóm User Stories hoàn chỉnh đã được đặc tả chi tiết tại tài liệu DAC_TA_USER_STORIES_3_ACTOR_26_NHOM_NGHIEP_VU.md. "
        "Kiến trúc phân quyền đảm bảo nguyên tắc Tách biệt trách nhiệm (SoD), Quyền tối thiểu (Least Privilege) và Kiểm toán bất biến (Rule 11).")'''

if old_sec4_target in code_text:
    code_text = code_text.replace(old_sec4_target, new_sec4_content)
    print("  ✓ Đã cập nhật Mục 4 trong build_docx_27muc.py (3 Actor & 26 User Stories)")

# 1.5 Cập nhật Mục 17: CSDL 15 bảng chuẩn 3NF
old_sec17_title = '    sec(doc, 17, "Thiết kế Database SQL Server (retail_spoilage_db – 13 bảng chuẩn 3NF)")'
new_sec17_title = '    sec(doc, 17, "Thiết kế Database SQL Server (retail_spoilage_db – 15 bảng chuẩn 3NF)")'
code_text = code_text.replace(old_sec17_title, new_sec17_title)

old_sec17_intro = '    body(doc,\n        "Cơ sở dữ liệu gồm 13 bảng chuẩn hóa 3NF trên Microsoft SQL Server LocalDB "'
new_sec17_intro = '    body(doc,\n        "Cơ sở dữ liệu gồm 15 bảng chuẩn hóa 3NF nghiêm ngặt, 36 Foreign Keys named trên Microsoft SQL Server LocalDB "'
code_text = code_text.replace(old_sec17_intro, new_sec17_intro)

# Thêm 2 bảng mới 17.14 và 17.15 vào ddl_list nếu chưa có
if "17.14  Bảng ai_forecasts" not in code_text:
    old_ddl_end = '''        ("17.13  Bảng system_audit_logs (Nhật ký kiểm toán hệ thống bất biến – Rule 11)",
"""CREATE TABLE [dbo].[system_audit_logs] (
    [id]          BIGINT IDENTITY(1,1) PRIMARY KEY,
    [user_id]     INT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [action_type] NVARCHAR(50)  NOT NULL,
    [description] NVARCHAR(MAX) NOT NULL,
    [ip_address]  NVARCHAR(45)  NULL,
    [created_at]  DATETIME DEFAULT GETDATE()
);
-- Bảng bất biến (Immutable): Chỉ cho phép INSERT, cấm UPDATE / DELETE."""),
    ]'''

    new_ddl_end = '''        ("17.13  Bảng system_audit_logs (Nhật ký kiểm toán hệ thống bất biến – Rule 11)",
"""CREATE TABLE [dbo].[system_audit_logs] (
    [id]          BIGINT IDENTITY(1,1) PRIMARY KEY,
    [user_id]     INT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [action_type] NVARCHAR(50)  NOT NULL,
    [entity_name] NVARCHAR(50)  NULL,
    [entity_id]   NVARCHAR(50)  NULL,
    [description] NVARCHAR(MAX) NOT NULL,
    [ip_address]  NVARCHAR(45)  NULL,
    [created_at]  DATETIME DEFAULT GETDATE()
);
-- Bảng bất biến (Immutable): Chỉ cho phép INSERT, cấm UPDATE / DELETE."""),
        ("17.14  Bảng ai_forecasts (Dự báo Nhu cầu 7 ngày & Rủi ro Lãng phí từ Mô hình LightGBM)",
"""CREATE TABLE [dbo].[ai_forecasts] (
    [id]                  INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_ai_forecasts] PRIMARY KEY,
    [store_id]            INT NOT NULL,
    [product_id]          INT NOT NULL,
    [forecast_date]       DATE NOT NULL,
    [predicted_sales]     DECIMAL(10,2) NOT NULL CONSTRAINT [CK_ai_forecasts_predicted] CHECK ([predicted_sales] >= 0),
    [lower_bound]         DECIMAL(10,2) NOT NULL,
    [upper_bound]         DECIMAL(10,2) NOT NULL,
    [spoilage_risk_qty]   INT NOT NULL CONSTRAINT [DF_ai_forecasts_risk] DEFAULT (0),
    [suggested_order_qty] INT NOT NULL CONSTRAINT [DF_ai_forecasts_order] DEFAULT (0),
    [model_name]          NVARCHAR(50) NOT NULL CONSTRAINT [DF_ai_forecasts_model] DEFAULT (N'LightGBM-HistGBT-v2.1'),
    [mae_metric]          DECIMAL(8,2) NULL,
    [created_at]          DATETIME NOT NULL CONSTRAINT [DF_ai_forecasts_created] DEFAULT (GETDATE()),
    CONSTRAINT [FK_AiForecasts_StoreProfile] FOREIGN KEY ([store_id]) REFERENCES [dbo].[store_profile]([id]),
    CONSTRAINT [FK_AiForecasts_Product] FOREIGN KEY ([product_id]) REFERENCES [dbo].[products]([id])
);
CREATE NONCLUSTERED INDEX [IX_AiForecasts_Store_Product_Date] ON [dbo].[ai_forecasts] ([store_id], [product_id], [forecast_date] DESC);"""),
        ("17.15  Bảng stock_transfers (Phiếu Điều phối Cân bằng Tồn kho Liên Cửa hàng từ Bộ giải OR-Tools MILP)",
"""CREATE TABLE [dbo].[stock_transfers] (
    [id]                     INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_stock_transfers] PRIMARY KEY,
    [transfer_code]          NVARCHAR(50) NOT NULL CONSTRAINT [UQ_stock_transfers_code] UNIQUE,
    [from_store_id]          INT NOT NULL,
    [to_store_id]            INT NOT NULL,
    [product_id]             INT NOT NULL,
    [source_batch_id]        INT NOT NULL,
    [transfer_quantity]      INT NOT NULL CONSTRAINT [CK_stock_transfers_qty] CHECK ([transfer_quantity] > 0),
    [shipping_cost]          DECIMAL(12,2) NOT NULL CONSTRAINT [DF_stock_transfers_cost] DEFAULT (0),
    [status]                 NVARCHAR(30) NOT NULL CONSTRAINT [DF_stock_transfers_status] DEFAULT (N'PROPOSED')
        CONSTRAINT [CK_stock_transfers_status] CHECK ([status] IN (N'PROPOSED', N'PENDING', N'APPROVED', N'IN_TRANSIT', N'RECEIVED', N'CANCELLED')),
    [ai_recommendation_note] NVARCHAR(500) NULL,
    [requested_by]           INT NOT NULL,
    [approved_by]            INT NULL,
    [created_at]             DATETIME NOT NULL CONSTRAINT [DF_stock_transfers_created] DEFAULT (GETDATE()),
    [received_at]            DATETIME NULL,
    CONSTRAINT [CK_stock_transfers_diff_stores] CHECK ([from_store_id] <> [to_store_id]),
    CONSTRAINT [FK_StockTransfers_FromStore] FOREIGN KEY ([from_store_id]) REFERENCES [dbo].[store_profile]([id]),
    CONSTRAINT [FK_StockTransfers_ToStore] FOREIGN KEY ([to_store_id]) REFERENCES [dbo].[store_profile]([id]),
    CONSTRAINT [FK_StockTransfers_Product] FOREIGN KEY ([product_id]) REFERENCES [dbo].[products]([id]),
    CONSTRAINT [FK_StockTransfers_SourceBatch] FOREIGN KEY ([source_batch_id]) REFERENCES [dbo].[batches]([id]),
    CONSTRAINT [FK_StockTransfers_RequestedBy] FOREIGN KEY ([requested_by]) REFERENCES [dbo].[users]([id]),
    CONSTRAINT [FK_StockTransfers_ApprovedBy] FOREIGN KEY ([approved_by]) REFERENCES [dbo].[users]([id])
);
CREATE NONCLUSTERED INDEX [IX_StockTransfers_Stores_Status] ON [dbo].[stock_transfers] ([from_store_id], [to_store_id], [status]);"""),
    ]'''

    code_text = code_text.replace(old_ddl_end, new_ddl_end)
    print("  ✓ Đã bổ sung Bảng 14 (ai_forecasts) & Bảng 15 (stock_transfers) vào Mục 17")

# 1.6 Cập nhật Mục 22: Danh sách RESTful API (Thêm stock-transfers & ai)
if "/api/stock-transfers" not in code_text:
    old_api_target = '''        ("22.8  Dashboard điều hành & Action Board (Executive Dashboard)", [
            ("GET",   "/api/dashboard/overview",                 "Lấy 6 chỉ số KPI tài chính & Action Board 4 Tab khẩn cấp", "ADMIN, STORE_MANAGER"),
            ("GET",   "/api/dashboard/top-spoilage",             "Top 5 sản phẩm có giá trị hao hụt cao nhất",                "ADMIN, STORE_MANAGER"),
            ("GET",   "/api/dashboard/category-stats",           "Cơ cấu doanh thu và tổn thất theo ngành hàng FMCG",         "ADMIN, STORE_MANAGER"),
        ]),'''

    new_api_target = '''        ("22.8  Dashboard điều hành & Action Board (Executive Dashboard)", [
            ("GET",   "/api/dashboard/overview",                 "Lấy 6 chỉ số KPI tài chính & Action Board 4 Tab khẩn cấp", "ADMIN, STORE_MANAGER"),
            ("GET",   "/api/dashboard/top-spoilage",             "Top 5 sản phẩm có giá trị hao hụt cao nhất",                "ADMIN, STORE_MANAGER"),
            ("GET",   "/api/dashboard/category-stats",           "Cơ cấu doanh thu và tổn thất theo ngành hàng FMCG",         "ADMIN, STORE_MANAGER"),
        ]),
        ("22.9  Động cơ AI & Điều phối Tồn kho Liên Cửa hàng (Stock Transfers & Pre-trained LightGBM)", [
            ("GET",   "/api/stock-transfers/ai-matrix",          "Ma trận Cân bằng Cung – Cầu 3 Chi nhánh & Đề xuất OR-Tools", "Tất cả các vai trò"),
            ("POST",  "/api/stock-transfers/ai-inference",       "Chạy kiểm thử trực tiếp file .pkl trên sample_retail_dataset.csv", "Tất cả các vai trò"),
            ("GET",   "/api/stock-transfers",                    "Danh sách toàn bộ phiếu điều chuyển (lọc theo status, storeId)", "Tất cả các vai trò"),
            ("POST",  "/api/stock-transfers",                    "Khởi tạo phiếu đề xuất điều chuyển liên cửa hàng mới",      "ADMIN, STORE_MANAGER"),
            ("PATCH", "/api/stock-transfers/:id/status",         "Cập nhật trạng thái điều chuyển (PROPOSED -> APPROVED -> IN_TRANSIT -> RECEIVED)", "Phân quyền theo vai trò"),
        ]),'''

    code_text = code_text.replace(old_api_target, new_api_target)
    print("  ✓ Đã bổ sung Nhóm API 22.9 (/api/stock-transfers) vào Mục 22")

# 1.7 Cập nhật Mục 23: Giao diện Frontend 100% Light Mode & StockTransferView.jsx
if "StockTransferView.jsx" not in code_text:
    old_view_target = '''        ("23.8  Nhật ký kiểm toán hệ thống bất biến (AuditLogView.jsx)", [
            "• Bảng hiển thị danh sách nhật ký thao tác thời gian thực với phân trang và bộ lọc linh hoạt",
            "• Cột phân loại trực quan: Thời gian, Vai trò, Người thực hiện, Mã hành vi, Đối tượng, Địa chỉ IP và Nội dung chi tiết",
            "• Tự động làm mới và hiển thị huy hiệu mức độ cảnh báo (INFO, WARNING, CRITICAL, AUDIT)",
            "• Giao diện chỉ đọc (Read-only), ngăn chặn hoàn toàn mọi thao tác chỉnh sửa hoặc xóa dữ liệu kiểm toán",
        ]),'''

    new_view_target = '''        ("23.8  Nhật ký kiểm toán hệ thống bất biến (AuditLogView.jsx)", [
            "• Bảng hiển thị danh sách nhật ký thao tác thời gian thực với phân trang và bộ lọc linh hoạt",
            "• Cột phân loại trực quan: Thời gian, Vai trò, Người thực hiện, Mã hành vi, Đối tượng, Địa chỉ IP và Nội dung chi tiết",
            "• Tự động làm mới và hiển thị huy hiệu mức độ cảnh báo (INFO, WARNING, CRITICAL, AUDIT)",
            "• Giao diện chỉ đọc (Read-only), ngăn chặn hoàn toàn mọi thao tác chỉnh sửa hoặc xóa dữ liệu kiểm toán",
        ]),
        ("23.9  Điều phối Liên Cửa hàng & Tối ưu AI (StockTransferView.jsx – 100% Light Mode)", [
            "• Thiết kế 100% Light Mode: Phông nền sáng cao cấp (#f8fafc / #ffffff), độ tương phản cao, tối ưu tuyệt đối khi chiếu slide",
            "• Banner Kiến trúc AI 3 bước: Hiển thị trạng thái Pre-trained Model, độ tin cậy (89.05%), sai số thực nghiệm MAE = 1.508 ĐV",
            "• Nút Kiểm thử Trực tiếp (.pkl): Gọi Python CLI thực thi trên 1.824 dòng dữ liệu sample_retail_dataset.csv thời gian thực",
            "• Ma trận Cân bằng Cung – Cầu 3 Chi nhánh: Đối sánh tồn kho và sức mua 7 ngày giữa Store A, Store B, Store C dưới 3 kịch bản thời tiết",
            "• Bảng Quản lý Lệnh Điều chuyển 5 bước: Hỗ trợ duyệt lệnh (OWNER/MANAGER), xuất kho vận chuyển (STAFF), nhận hàng (STAFF)",
        ]),'''

    code_text = code_text.replace(old_view_target, new_view_target)
    print("  ✓ Đã bổ sung Phân hệ 23.9 (StockTransferView.jsx) vào Mục 23")

# Ghi lại code đã cập nhật vào build_docx_27muc.py
with open(BUILD_DOCX_SCRIPT, "w", encoding="utf-8") as f:
    f.write(code_text)
print("  ✓ Đã lưu mã nguồn build_docx_27muc.py thành công!")

# ─── 2. THỰC THI BUILD_DOCX_27MUC.PY ĐỂ SINH FILE WORD CHUẨN ─────────────────
print("[BUILD] Đang chạy build_docx_27muc.py...")
import subprocess
result = subprocess.run([sys.executable, BUILD_DOCX_SCRIPT], capture_output=True, text=True, encoding="utf-8")
print(result.stdout)
if result.returncode != 0:
    print("❌ Lỗi biên dịch build_docx_27muc.py:", result.stderr)
else:
    print("✓ Đã sinh thành công file Word:", DOCX_PATH)
    if os.path.exists(WORD_DOCS_MIRROR):
        print("✓ Đã đồng bộ bản sao Word vào:", WORD_DOCS_MIRROR)

# ─── 3. ĐỒNG BỘ NỘI DUNG VÀO MASTER MARKDOWN SSOT ────────────────────────────
print("[SYNC MD] Đang đồng bộ Master Markdown SSOT...")
with open(MD_SSOT_PATH, "r", encoding="utf-8") as f:
    md_content = f.read()

# Cập nhật Mục 1 trong Markdown
old_md_sec1 = """# 1. Mục tiêu hệ thống

Xây dựng website quản lý một cửa hàng bán lẻ tinh gọn (Retail Store) duy nhất của ngành FMCG và thực phẩm tiện lợi, thuộc đề tài 'Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor)'. Hệ thống cho phép quản lý việc tiếp nhận hàng theo đợt từ Kho tổng (DC Biên Hòa), quản lý danh mục sản phẩm, kiểm soát hạn sử dụng từng lô (Shelf-Life), cảnh báo cận date đa cấp (Xanh/Vàng/Đỏ), bán lẻ tại quầy POS theo nguyên tắc FEFO (First Expired, First Out - Bán hàng = Xuất kho), giảm giá xả hàng Quick Markdown, đảo kệ mặt tiền, tiêu hủy hàng quá date ghi nhận sổ hao hụt tài chính, dự báo nhu cầu tiêu thụ ROP dựa trên tốc độ bán thực tế + thời tiết + ngày lễ để đề xuất đơn nhập hàng bổ sung gửi về Kho tổng DC, và thống kê tình hình thất thoát lãng phí.

Hệ thống sử dụng Microsoft SQL Server làm cơ sở dữ liệu chính.

Do chỉ quản lý 1 cửa hàng bán lẻ duy nhất, hệ thống không cần chức năng luân chuyển ngang giữa các shop hoặc thủ tục hoàn trả nhà cung cấp phức tạp. Tất cả các đợt hàng, lô hàng, bán lẻ POS, sổ hao hụt, dự báo ROP và dashboard đều xoay quanh một cửa hàng bán lẻ cố định liên kết với Kho tổng DC Biên Hòa."""

new_md_sec1 = """# 1. Mục tiêu hệ thống

Xây dựng nền tảng website quản lý Chuỗi Cửa hàng Bán lẻ Tinh gọn (Chuỗi 3 Chi nhánh LHU Mart: Store A Bửu Long `RETAIL-STORE-01`, Store B Tân Phong `RETAIL-STORE-02`, Store C Trảng Dài `RETAIL-STORE-03`) của ngành FMCG và thực phẩm tiện lợi, thuộc đề tài 'Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor)'. Hệ thống cho phép quản lý toàn diện việc tiếp nhận hàng theo đợt từ Kho tổng (DC Biên Hòa), kiểm định date nghiêm ngặt (RSL >= 70%), quản lý danh mục sản phẩm FMCG (chống trùng >= 85%), kiểm soát hạn sử dụng từng lô (Shelf-Life), cảnh báo 3 cấp màu (Xanh / Vàng / Đỏ), bán lẻ tại quầy POS theo nguyên tắc FEFO tuyệt đối (Bán hàng = Xuất kho trực tiếp tự động bẻ lô), giảm giá xả hàng Quick Markdown (15%, 30%, 40%, 50%), quy trình SOP 5 bước đảo kệ mặt tiền, tiêu hủy hàng quá date gắn liền Sổ hao hụt tài chính bất biến, bàn giao ca trực điện tử 4 bước, và Động cơ AI 3 bước chuẩn GVHD (Mô hình LightGBM dự báo nhu cầu 7 ngày + Bộ giải Tối ưu có Ràng buộc Google OR-Tools MILP cân bằng tồn kho và điều chuyển nội bộ giữa 3 chi nhánh trước khi đặt thêm từ DC).

Hệ thống sử dụng Microsoft SQL Server LocalDB (`retail_spoilage_db` – 15 bảng chuẩn 3NF, 36 Foreign Keys named, sysdiagrams) làm cơ sở dữ liệu chính và tuân thủ Kiến trúc Clean Architecture 4 tầng.

Mô hình chuỗi liên kết tập trung: Cửa hàng liên kết trực tiếp với Kho tổng DC Biên Hòa và hỗ trợ điều phối hàng tồn cận date giữa 3 chi nhánh (`dbo.stock_transfers`) nhằm tối ưu hóa vòng đời thực phẩm, giải quyết triệt để tình trạng 'Cửa hàng A dư thừa sắp hủy – Cửa hàng B thiếu hụt đứt hàng' trước khi phát sinh đơn đặt hàng bổ sung mới từ DC."""

if old_md_sec1 in md_content:
    md_content = md_content.replace(old_md_sec1, new_md_sec1)
    print("  ✓ Đã cập nhật Mục 1 trong Markdown SSOT")

# Cập nhật Mục 3.1 trong Markdown
old_md_sec3 = """## 3.1 Chỉ quản lý một cửa hàng bán lẻ duy nhất

Vì chỉ có một cửa hàng bán lẻ, hệ thống sẽ không cần các chức năng như:

- Tạo nhiều chi nhánh hoặc chuỗi siêu thị
- Điều chuyển hàng ngang giữa các cửa hàng (Inter-store Transfer)
- So sánh doanh số và tồn kho giữa nhiều shop
- Thủ tục hoàn trả nhà cung cấp phức tạp (RTV)
- Phân quyền dữ liệu theo từng chi nhánh

Thay vào đó, hệ thống chỉ cần một phần cấu hình thông tin cửa hàng bán lẻ duy nhất."""

new_md_sec3 = """## 3.1 Mô hình Chuỗi Cửa hàng Bán lẻ Tinh gọn & Điều phối Cứu Hàng Cận Date (Rule 1)

Theo định hướng nâng cấp của GVHD (ThS. Lê Minh Nhật), hệ thống áp dụng mô hình Chuỗi Cửa hàng Bán lẻ Tinh gọn (MVP gồm 3 Chi nhánh: Store A Bửu Long `RETAIL-STORE-01`, Store B Tân Phong `RETAIL-STORE-02`, Store C Trảng Dài `RETAIL-STORE-03`) liên kết trực tiếp với Trung tâm Phân phối DC Biên Hòa:

- Mỗi chi nhánh vận hành độc lập tại quầy thu ngân POS theo chuẩn FEFO tuyệt đối và tự quản lý kho quầy kệ.
- Toàn chuỗi dùng chung Danh mục Sản phẩm FMCG chuẩn và liên kết chung nguồn nhập hàng từ Kho tổng DC Biên Hòa.
- Hỗ trợ phân hệ Điều phối Tồn kho Liên Cửa hàng (Inter-Store Stock Transfer – bảng `dbo.stock_transfers`) nhằm giải bài toán Cung – Cầu nội bộ.
- Quy trình điều chuyển 5 bước khép kín (`PROPOSED` -> `APPROVED` -> `IN_TRANSIT` -> `RECEIVED` -> `CANCELLED`) kiểm soát bằng khóa ngoại `store_id` và bảo vệ bằng phân quyền SoD giữa OWNER, MANAGER và STAFF.
- Loại bỏ các thủ tục hoàn trả nhà cung cấp (RTV) phức tạp ngoài phạm vi cửa hàng tiện lợi."""

if old_md_sec3 in md_content:
    md_content = md_content.replace(old_md_sec3, new_md_sec3)
    print("  ✓ Đã cập nhật Mục 3.1 trong Markdown SSOT")

# Bổ sung thông tin 15 bảng chuẩn 3NF vào Mục 17 của Markdown nếu chưa có
if "## 17.14 Bảng ai_forecasts" not in md_content:
    old_md_sec17_end = """## 17.13 Bảng AuditLogs (Nhật ký Kiểm toán Bất biến)

CREATE TABLE AuditLogs (
 Id BIGINT IDENTITY(1,1) PRIMARY KEY,
 UserId UNIQUEIDENTIFIER NULL,
 Action NVARCHAR(100) NOT NULL,
 TableName NVARCHAR(100) NOT NULL,
 RecordId NVARCHAR(100) NOT NULL,
 OldValues NVARCHAR(MAX) NULL,
 NewValues NVARCHAR(MAX) NULL,
 CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);"""

    new_md_sec17_end = """## 17.13 Bảng system_audit_logs (Nhật ký Kiểm toán Bất biến)

```sql
CREATE TABLE [dbo].[system_audit_logs] (
    [id]          BIGINT IDENTITY(1,1) PRIMARY KEY,
    [user_id]     INT NULL CONSTRAINT [FK_SystemAuditLogs_User] FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [action_type] NVARCHAR(50) NOT NULL,
    [entity_name] NVARCHAR(50) NULL,
    [entity_id]   NVARCHAR(50) NULL,
    [description] NVARCHAR(MAX) NOT NULL,
    [ip_address]  NVARCHAR(45) NULL,
    [created_at]  DATETIME NOT NULL CONSTRAINT [DF_SystemAuditLogs_Created] DEFAULT (GETDATE())
);
-- Bảng bất biến: Chỉ cho phép INSERT, cấm UPDATE / DELETE.
```

## 17.14 Bảng ai_forecasts (Dự báo Sức mua 7 ngày & Rủi ro Lãng phí từ Mô hình LightGBM)

```sql
CREATE TABLE [dbo].[ai_forecasts] (
    [id]                  INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_ai_forecasts] PRIMARY KEY,
    [store_id]            INT NOT NULL,
    [product_id]          INT NOT NULL,
    [forecast_date]       DATE NOT NULL,
    [predicted_sales]     DECIMAL(10,2) NOT NULL CONSTRAINT [CK_ai_forecasts_predicted] CHECK ([predicted_sales] >= 0),
    [lower_bound]         DECIMAL(10,2) NOT NULL,
    [upper_bound]         DECIMAL(10,2) NOT NULL,
    [spoilage_risk_qty]   INT NOT NULL CONSTRAINT [DF_ai_forecasts_risk] DEFAULT (0),
    [suggested_order_qty] INT NOT NULL CONSTRAINT [DF_ai_forecasts_order] DEFAULT (0),
    [model_name]          NVARCHAR(50) NOT NULL CONSTRAINT [DF_ai_forecasts_model] DEFAULT (N'LightGBM-HistGBT-v2.1'),
    [mae_metric]          DECIMAL(8,2) NULL,
    [created_at]          DATETIME NOT NULL CONSTRAINT [DF_ai_forecasts_created] DEFAULT (GETDATE()),
    CONSTRAINT [FK_AiForecasts_StoreProfile] FOREIGN KEY ([store_id]) REFERENCES [dbo].[store_profile]([id]),
    CONSTRAINT [FK_AiForecasts_Product] FOREIGN KEY ([product_id]) REFERENCES [dbo].[products]([id])
);
CREATE NONCLUSTERED INDEX [IX_AiForecasts_Store_Product_Date] ON [dbo].[ai_forecasts] ([store_id], [product_id], [forecast_date] DESC);
```

## 17.15 Bảng stock_transfers (Phiếu Điều phối Cân bằng Tồn kho Liên Cửa hàng từ Bộ giải OR-Tools MILP)

```sql
CREATE TABLE [dbo].[stock_transfers] (
    [id]                     INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_stock_transfers] PRIMARY KEY,
    [transfer_code]          NVARCHAR(50) NOT NULL CONSTRAINT [UQ_stock_transfers_code] UNIQUE,
    [from_store_id]          INT NOT NULL,
    [to_store_id]            INT NOT NULL,
    [product_id]             INT NOT NULL,
    [source_batch_id]        INT NOT NULL,
    [transfer_quantity]      INT NOT NULL CONSTRAINT [CK_stock_transfers_qty] CHECK ([transfer_quantity] > 0),
    [shipping_cost]          DECIMAL(12,2) NOT NULL CONSTRAINT [DF_stock_transfers_cost] DEFAULT (0),
    [status]                 NVARCHAR(30) NOT NULL CONSTRAINT [DF_stock_transfers_status] DEFAULT (N'PROPOSED')
        CONSTRAINT [CK_stock_transfers_status] CHECK ([status] IN (N'PROPOSED', N'PENDING', N'APPROVED', N'IN_TRANSIT', N'RECEIVED', N'CANCELLED')),
    [ai_recommendation_note] NVARCHAR(500) NULL,
    [requested_by]           INT NOT NULL,
    [approved_by]            INT NULL,
    [created_at]             DATETIME NOT NULL CONSTRAINT [DF_stock_transfers_created] DEFAULT (GETDATE()),
    [received_at]            DATETIME NULL,
    CONSTRAINT [CK_stock_transfers_diff_stores] CHECK ([from_store_id] <> [to_store_id]),
    CONSTRAINT [FK_StockTransfers_FromStore] FOREIGN KEY ([from_store_id]) REFERENCES [dbo].[store_profile]([id]),
    CONSTRAINT [FK_StockTransfers_ToStore] FOREIGN KEY ([to_store_id]) REFERENCES [dbo].[store_profile]([id]),
    CONSTRAINT [FK_StockTransfers_Product] FOREIGN KEY ([product_id]) REFERENCES [dbo].[products]([id]),
    CONSTRAINT [FK_StockTransfers_SourceBatch] FOREIGN KEY ([source_batch_id]) REFERENCES [dbo].[batches]([id]),
    CONSTRAINT [FK_StockTransfers_RequestedBy] FOREIGN KEY ([requested_by]) REFERENCES [dbo].[users]([id]),
    CONSTRAINT [FK_StockTransfers_ApprovedBy] FOREIGN KEY ([approved_by]) REFERENCES [dbo].[users]([id])
);
CREATE NONCLUSTERED INDEX [IX_StockTransfers_Stores_Status] ON [dbo].[stock_transfers] ([from_store_id], [to_store_id], [status]);
```"""

    md_content = md_content.replace(old_md_sec17_end, new_md_sec17_end)
    print("  ✓ Đã bổ sung Bảng 14 & 15 chuẩn 3NF vào Mục 17 của Markdown SSOT")

with open(MD_SSOT_PATH, "w", encoding="utf-8") as f:
    f.write(md_content)
print("  ✓ Đã lưu Master Markdown SSOT thành công!")
print("[SYNC] HOÀN TẤT ĐỒNG BỘ 100% CẢ MARKDOWN SSOT VÀ FILE WORD BÁO CÁO!")

