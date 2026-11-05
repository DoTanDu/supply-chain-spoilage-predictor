# -*- coding: utf-8 -*-
"""
Script sinh file Word: Đặc tả Website Quản lý Chuỗi Cung Ứng Bán Lẻ Chống Lãng Phí
Bám sát 100% cấu trúc 27 mục của tài liệu đặc tả gốc (SSOT) và hệ thống Web thực tế (Phần 1 -> Phần 6).
GVHD: ThS. Lê Minh Nhật | Nhóm SV: Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946)
"""

import os
import sys
import io
import shutil

# Đảm bảo stdout hỗ trợ UTF-8 trên Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

# ─── Helpers ─────────────────────────────────────────────────────────────────

def cell_bg(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>'))

def cell_mar(cell, top=80, bottom=80, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'))

def tbl_borders(table, color="CCCCCC"):
    tblPr = table._tbl.tblPr
    tblPr.append(parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'))

def sec(doc, num, title):
    """Tiêu đề cấp 1 – số + tên"""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(f"{num}. {title}")
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(10, 60, 130)

def sub(doc, title):
    """Tiêu đề cấp 2"""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(title)
    r.font.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(14, 130, 100)

def body(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run(text)
    r.font.size = Pt(10.5)

def bul(doc, items):
    for item in items:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(item)
        r.font.size = Pt(10)

def code(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(text)
    r.font.name = 'Consolas'
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor(20, 30, 50)

def mk_table(doc, headers, rows, widths):
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    tbl_borders(t)
    hcells = t.rows[0].cells
    for i, h in enumerate(headers):
        cell_bg(hcells[i], "0F3C81")
        cell_mar(hcells[i])
        hcells[i].text = h
        for r in hcells[i].paragraphs[0].runs:
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            r.font.size = Pt(9)
        hcells[i].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    for ri, row in enumerate(rows):
        rc = t.add_row().cells
        bg = "F5F8FC" if ri % 2 else "FFFFFF"
        for ci, val in enumerate(row):
            cell_bg(rc[ci], bg)
            cell_mar(rc[ci], top=60, bottom=60, left=80, right=80)
            rc[ci].text = str(val)
            for r in rc[ci].paragraphs[0].runs:
                r.font.size = Pt(9)
                r.font.color.rgb = RGBColor(30, 40, 55)
    for ci, w in enumerate(widths):
        for row in t.rows:
            row.cells[ci].width = Inches(w)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    return t


# ─── Main Builder ─────────────────────────────────────────────────────────────

def build():
    doc = docx.Document()
    for s in doc.sections:
        s.top_margin    = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin   = Inches(0.9)
        s.right_margin  = Inches(0.9)

    # ── Trang bìa ────────────────────────────────────────────────────────────
    ph = doc.add_paragraph()
    rh = ph.add_run(
        "TRƯỜNG ĐẠI HỌC LẠC HỒNG (LHU) – KHOA CÔNG NGHỆ THÔNG TIN\n"
        "───────────────────────────────")
    rh.font.bold = True
    rh.font.size = Pt(10)
    rh.font.color.rgb = RGBColor(100, 116, 139)
    ph.alignment = WD_ALIGN_PARAGRAPH.CENTER

    pt = doc.add_paragraph()
    pt.paragraph_format.space_before = Pt(14)
    pt.paragraph_format.space_after  = Pt(4)
    rt = pt.add_run(
        "ĐẶC TẢ WEBSITE QUẢN LÝ\n"
        "CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ\n"
        "(SUPPLY CHAIN SPOILAGE PREDICTOR)")
    rt.font.bold = True
    rt.font.size = Pt(16)
    rt.font.color.rgb = RGBColor(10, 60, 130)
    pt.alignment = WD_ALIGN_PARAGRAPH.CENTER

    ps = doc.add_paragraph()
    ps.paragraph_format.space_after = Pt(18)
    rs = ps.add_run(
        "Theo Kiến trúc Clean Architecture 4 tầng và Microsoft SQL Server LocalDB\n"
        "GVHD: ThS. Lê Minh Nhật  |  "
        "Nhóm SV: Đỗ Tấn Du (123001364)  &  Đoàn Minh Quân (123000946)")
    rs.font.italic = True
    rs.font.size = Pt(10)
    rs.font.color.rgb = RGBColor(71, 85, 105)
    ps.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # ════════════════════════════════════════════════════════════════════════
    # 1. MỤC TIÊU HỆ THỐNG
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 1, "Mục tiêu hệ thống")
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
        "A dư thừa sắp hủy – Cửa hàng B thiếu hụt đứt hàng' trước khi phát sinh đơn đặt hàng bổ sung mới từ DC.")

    # ════════════════════════════════════════════════════════════════════════
    # 2. PHẠM VI HỆ THỐNG
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 2, "Phạm vi hệ thống")
    body(doc, "Hệ thống quản lý 17 nhóm dữ liệu và nghiệp vụ cốt lõi:")
    bul(doc, [
        "1.  Thông tin cửa hàng bán lẻ duy nhất (StoreProfile – RETAIL-STORE-01)",
        "2.  Kho tổng cung ứng liên kết (Trung tâm Phân phối DC Biên Hòa – DC-BIENHOA)",
        "3.  Danh mục ngành hàng FMCG và thực phẩm tiện lợi",
        "4.  Sản phẩm hàng hóa bán lẻ (kèm thuật toán chống trùng SKU và tên tương đồng >= 85%)",
        "5.  Lô hàng và vòng đời hạn sử dụng (Batches & Shelf-Life Lifecycle)",
        "6.  Người dùng và phân quyền 4 vai trò RBAC (ADMIN, STORE_MANAGER, CASHIER, WAREHOUSE_STAFF)",
        "7.  Phiếu tiếp nhận hàng từ Kho tổng DC (Goods Receipts – kiểm chuẩn RSL_inbound >= 70%)",
        "8.  Đơn bán lẻ tại quầy POS (Bán hàng = Xuất kho FEFO tự động bẻ lô)",
        "9.  Giám sát hạn dùng và cảnh báo 3 cấp màu (Vùng Xanh / Vùng Vàng / Vùng Đỏ + Khóa cứng EXPIRED)",
        "10. Kích hoạt giảm giá xả hàng Quick Markdown (15%, 30%, 40%, 50%)",
        "11. Quy trình SOP 5 bước và nhật ký xác nhận đảo lô hàng mặt tiền kệ trưng bày",
        "12. Biên bản tiêu hủy hàng hỏng & Sổ hao hụt tài chính bất biến (tách biệt Người lập – Người duyệt)",
        "13. Dự báo nhu cầu bán hàng & Điểm đặt hàng bổ sung (ROP Forecast tích hợp Thời tiết & Lễ Tết)",
        "14. Đơn đặt hàng bổ sung gửi về Kho tổng DC (Purchase Orders: DRAFT -> APPROVED -> SUBMITTED -> DELIVERED)",
        "15. Lịch trực và quy trình bàn giao ca làm việc điện tử 4 bước (kèm 3 chế tài trách nhiệm)",
        "16. Dashboard điều hành thời gian thực (6 chỉ số KPI tài chính, Top 5 Bán chạy/Hao hụt, 4-Tab Action Board)",
        "17. Động cơ AI 3 bước: Mô hình LightGBM dự báo nhu cầu 7 ngày + Bộ giải OR-Tools MILP tối ưu điều phối",
        "18. Phân hệ Điều phối Tồn kho Liên Cửa hàng (Stock Transfers 5 bước: PROPOSED -> APPROVED -> IN_TRANSIT -> RECEIVED)",
        "19. Nhật ký kiểm toán hệ thống bất biến (System Audit Logs – Rule 11)",
    ])

    # ════════════════════════════════════════════════════════════════════════
    # 3. ĐẶC ĐIỂM QUAN TRỌNG
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 3, "Đặc điểm quan trọng của hệ thống")

    sub(doc, "3.1  Mô hình Chuỗi Cửa hàng Bán lẻ Tinh gọn & Điều phối Cứu hàng Cận Date (Rule 1)")
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
    body(doc, "Cấu hình 3 chi nhánh trong bảng store_profile:")
    bul(doc, [
        "Mã cửa hàng (store_code): RETAIL-STORE-01",
        "Tên cửa hàng (store_name): Cửa hàng Bán lẻ Tiện lợi LHU Mart",
        "Vị trí (address): Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai",
        "Kho tổng liên kết (dc_name): Trung tâm Phân phối DC Biên Hòa (Mã: DC-BIENHOA)",
        "Thời gian giao hàng chuẩn (default_lead_time_days): 1 ngày",
        "Tiêu chuẩn nhận hàng tối thiểu từ DC (min_inbound_rsl_percent): RSL >= 70%",
        "Ngưỡng cảnh báo Vàng mặc định (default_warning_days): 7 ngày",
        "Ngưỡng cảnh báo Đỏ nguy kịch (critical_days): 3 ngày",
        "Giờ hoạt động (opening_time – closing_time): 06:00 – 22:00",
        "Trạng thái vận hành (status): OPEN (Đang mở cửa bán hàng)",
    ])

    sub(doc, "3.2  Sử dụng Microsoft SQL Server LocalDB")
    body(doc,
        "Cơ sở dữ liệu dùng Microsoft SQL Server LocalDB "
        "– chuỗi kết nối: (localdb)\\mssqllocaldb, tên database: retail_spoilage_db.")
    body(doc, "Các yêu cầu kỹ thuật của cơ sở dữ liệu:")
    bul(doc, [
        "Thiết kế 13 bảng quan hệ rõ ràng, đạt chuẩn chuẩn hóa 3NF",
        "Có khóa chính (PRIMARY KEY) và khóa ngoại (FOREIGN KEY) toàn vẹn tham chiếu",
        "Có ràng buộc CHECK chống tồn kho âm (current_quantity >= 0 AND current_quantity <= initial_quantity)",
        "Có trạng thái rõ ràng cho các nghiệp vụ: batches (ACTIVE, WARNING, EXPIRED, DISPOSED), purchase_orders (DRAFT, APPROVED, SUBMITTED, DELIVERED, CANCELLED)",
        "Có dấu thời gian created_at, updated_at cho các bảng chính",
        "Có bảng system_audit_logs lưu lịch sử kiểm toán bất biến (chỉ INSERT, không UPDATE/DELETE)",
        "Sử dụng SQL Transaction kết hợp khóa dòng WITH (UPDLOCK, ROWLOCK) khi bán lẻ POS FEFO, nhập kho DC và tiêu hủy hàng hỏng",
        "Có hệ thống Index chuyên biệt cho truy vấn FEFO, quét HSD, phân tích tốc độ bán 14 ngày và tra cứu Audit Log",
        "Toàn bộ chuỗi tiếng Việt sử dụng kiểu NVARCHAR với tiền tố N'...' và mã hóa UTF-8",
    ])

    # ════════════════════════════════════════════════════════════════════════
    # 4. NHÓM NGƯỜI DÙNG TRONG HỆ THỐNG
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 4, "Nhóm người dùng trong hệ thống (3 Actor Cốt lõi & 26 Nhóm User Stories)")
    body(doc,
        "Tiếp thu góp ý của ThS. Lê Minh Nhật, hệ thống chuẩn hóa cấu trúc người dùng xoay quanh 3 Actor cốt lõi "
        "(chi tiết hóa thành 4 vai trò RBAC kỹ thuật: OWNER -> ADMIN, MANAGER -> STORE_MANAGER, STAFF -> CASHIER & WAREHOUSE_STAFF) "
        "với 26 nhóm User Stories hoàn chỉnh đã được đặc tả chi tiết tại tài liệu DAC_TA_USER_STORIES_3_ACTOR_26_NHOM_NGHIEP_VU.md. "
        "Kiến trúc phân quyền đảm bảo nguyên tắc Tách biệt trách nhiệm (SoD), Quyền tối thiểu (Least Privilege) và Kiểm toán bất biến (Rule 11).")

    mk_table(doc,
        ["Nhóm Actor gốc", "Vai trò (RoleCode)", "Tên hiển thị", "Thiết bị chính", "Màn hình mặc định"],
        [
            ["OWNER / ADMIN",      "ADMIN",           "Quản trị viên hệ thống",    "Desktop / Laptop",        "Dashboard Tổng điều hành (/dashboard)"],
            ["MANAGER",            "STORE_MANAGER",   "Cửa hàng trưởng",           "Desktop / Tablet quản lý", "Dashboard Tổng điều hành (/dashboard)"],
            ["STAFF (Cửa ra)",     "CASHIER",         "Nhân viên thu ngân POS",    "Máy POS + Đầu đọc Barcode","Quầy Bán lẻ POS (/pos-checkout)"],
            ["STAFF (Cửa vào/Kệ)", "WAREHOUSE_STAFF", "Nhân viên kho & quầy kệ",   "Tablet / Máy kiểm kho",    "Tiếp nhận hàng DC (/dc-intake)"],
        ],
        [1.3, 1.3, 1.5, 1.5, 1.7])

    sub(doc, "4.0  Quy chuẩn Trang Đăng nhập riêng (/login) & Bảo mật tài khoản chung")
    bul(doc, [
        "Xác thực danh tính (Authentication): Đăng nhập bằng Username và Password (băm bcrypt), cấp phát JWT Access Token và xác thực phiên qua GET /api/auth/me.",
        "Điều hướng thông minh theo vai trò (Role-based Redirect): Sau khi đăng nhập tại /login, hệ thống tự động chuyển hướng đến màn hình trọng tâm của vai trò đó và ẩn các menu không có quyền trên Sidebar.",
        "Chính sách chống dò mật khẩu (Brute-Force Lockout Policy): Nhập sai mật khẩu liên tiếp 5 lần sẽ tự động khóa cứng tài khoản nhân viên (is_active = 0) hoặc tạm khóa 15 phút đối với ADMIN, đồng thời ghi cảnh báo vào AuditLogs.",
        "Quản lý bảo mật cá nhân: Xem định danh ca trực hiện tại, tự đổi mật khẩu cá nhân (POST /api/auth/change-password), đăng xuất an toàn và hỗ trợ nút chọn nhanh 4 tài khoản mẫu phục vụ kiểm thử/Demo.",
    ])

    sub(doc, "4.1  Admin (Quản trị viên hệ thống) – Vai trò: ADMIN")
    bul(doc, [
        "Quản lý tài khoản nhân viên: Cấp mới, chỉnh sửa hồ sơ/vai trò, đặt lại mật khẩu và khóa/mở khóa tài khoản khẩn cấp",
        "Cấu hình hồ sơ cửa hàng duy nhất (StoreProfile – RETAIL-STORE-01) và tham số kết nối Kho tổng DC Biên Hòa",
        "Thiết lập ngưỡng cảnh báo date mặc định (Vùng Vàng: 7 ngày, Vùng Đỏ: 3 ngày, Min RSL nhận hàng DC >= 70%)",
        "Cấu hình hệ số ngoại cảnh thời tiết (W_factor) và ngày lễ (H_factor) cho thuật toán dự báo ROP (Rule 8)",
        "Xem Dashboard 6 KPI tổng điều hành và giám sát toàn bộ Nhật ký kiểm toán bất biến (System Audit Logs – Rule 11)",
        "Ranh giới bảo vệ (SoD): Không được xóa/sửa Nhật ký kiểm toán bất biến và không thể tự khóa tài khoản của chính mình",
    ])

    sub(doc, "4.2  Cửa hàng trưởng (Store Manager) – Vai trò: STORE_MANAGER")
    bul(doc, [
        "Quản lý danh mục ngành hàng FMCG và sản phẩm (thêm mới có kiểm tra chống trùng >= 85%, cập nhật giá vốn/giá bán, ngừng kinh doanh)",
        "Theo dõi tình trạng hạn sử dụng các lô hàng qua Dashboard 6 chỉ số KPI tài chính, Top 5 Bán chạy/Hao hụt và Action Board 4 tab",
        "Phê duyệt kích hoạt chính sách giảm giá xả hàng Quick Markdown (15%, 30%, 40%, 50%) theo Rule 4 & Rule 10",
        "Trực tiếp kiểm tra hàng tại khu cách ly, phê duyệt biên bản tiêu hủy (POST /api/spoilage/:id/approve) và chốt Sổ hao hụt tài chính bất biến (Rule 6)",
        "Xem dự báo nhu cầu bán hàng ROP tích hợp ngoại cảnh, tạo và phê duyệt đơn đặt hàng bổ sung gửi DC Biên Hòa (Rule 8)",
        "Quản lý phân công ca trực, đối soát tiền két và ký xác nhận Biên bản bàn giao ca trực điện tử 4 bước (Mục 15)",
        "Ranh giới bảo vệ (SoD): Không có quyền tạo mới/khóa tài khoản người dùng, không được xóa lịch sử bán hàng hoặc xóa vết kiểm toán",
    ])

    sub(doc, "4.3  Nhân viên thu ngân (Cashier) – Vai trò: CASHIER")
    bul(doc, [
        "Quét mã vạch Barcode / SKU sản phẩm tại quầy thu ngân POS",
        "Hệ thống tự động chọn lô cận date nhất xuất trước (FEFO tuyệt đối) và tự động bẻ lô nếu số lượng mua vượt tồn 1 lô (Rule 2)",
        "Tự động áp dụng giá chiết khấu nếu lô hàng đang trong chương trình Quick Markdown đã được Quản lý duyệt",
        "Hệ thống tự động khóa cứng và cấm xuất bán tuyệt đối đối với các lô hàng đã hết hạn (DaysLeft <= 0, EXPIRED – Rule 5)",
        "Ghi nhận ngữ cảnh bán hàng (thời tiết SUNNY/RAINY/NORMAL, cờ ngày lễ is_holiday) phục vụ dữ liệu thuật toán ROP",
        "Tra cứu danh mục sản phẩm (chế độ Read-only) và xem danh sách cảnh báo lô hàng 3 cấp màu để tư vấn khách hàng",
        "Lập phiếu đề xuất tiêu hủy nhanh khi phát hiện sản phẩm móp méo, rách bao bì tại quầy (trạng thái PENDING chờ Quản lý duyệt)",
        "Thực hiện chốt ca thu ngân, kiểm đếm tiền mặt và ký biên bản bàn giao ca trực điện tử 4 bước",
        "Ranh giới bảo vệ (SoD): Không được tự chọn lô xuất bán thủ công, không nhập kho DC, không tự kích hoạt Quick Markdown, không xác nhận đảo kệ và không tự duyệt tiêu hủy",
    ])

    sub(doc, "4.4  Nhân viên kho & quầy kệ (Warehouse Staff) – Vai trò: WAREHOUSE_STAFF")
    bul(doc, [
        "Kiểm tra date thực tế khi xe tải DC Biên Hòa giao đến: kiểm soát nghiêm ngặt RSL_inbound >= 70% (Rule 7)",
        "Từ chối tiếp nhận lô hàng DC nếu RSL < 70% và lập Biên bản từ chối nhận hàng DC điện tử (REJECT_DC_INBOUND)",
        "Nhập phiếu tiếp nhận hàng (Goods Receipts) từ DC (có hỗ trợ chọn từ đơn Purchase Order đã duyệt) và khởi tạo lô hàng mới",
        "Giám sát danh mục lô hàng Vùng Vàng và Vùng Đỏ trên Action Board khẩn cấp",
        "Thực hiện Quy trình SOP 5 bước đảo lô hàng cận date ra mặt tiền kệ trưng bày theo chuẩn FEFO (Rule 10) và xác nhận điện tử",
        "In và dán tem nhãn giảm giá xả hàng Quick Markdown lên bao bì theo tỷ lệ đã được Cửa hàng trưởng phê duyệt",
        "Thu gom hàng hư hỏng, quá date vào khu cách ly và lập đề xuất tiêu hủy (trạng thái PENDING chờ Quản lý duyệt)",
        "Ranh giới bảo vệ (SoD): Không có quyền bán lẻ POS, không tự ý sửa giá/duyệt Quick Markdown, không tạo/duyệt đơn PO và không tự duyệt tiêu hủy",
    ])

    # ════════════════════════════════════════════════════════════════════════
    # 5. QUẢN LÝ THÔNG TIN CỬA HÀNG BÁN LẺ DUY NHẤT (RULE 1)
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 5, "Quản lý thông tin cửa hàng bán lẻ duy nhất (StoreProfile – Rule 1)")
    body(doc,
        "Do chỉ quản lý một cửa hàng bán lẻ duy nhất, hệ thống sử dụng bảng chuyên biệt store_profile "
        "(StoreProfile) với ràng buộc chỉ lưu 1 bản ghi duy nhất (mã cố định: RETAIL-STORE-01). Không cần "
        "chức năng chọn chi nhánh ở bất kỳ màn hình nào.")
    body(doc, "Thông tin cấu hình trong bảng store_profile:")
    bul(doc, [
        "Mã cửa hàng (store_code): RETAIL-STORE-01 (Cố định – Rule 1)",
        "Tên cửa hàng (store_name): Cửa hàng Bán lẻ Tiện lợi LHU Mart",
        "Địa chỉ (address): Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai",
        "Số điện thoại (phone) & Email liên hệ (email)",
        "Cửa hàng trưởng phụ trách (manager_name) & Sức chứa kệ (capacity_info)",
        "Kho tổng liên kết mặc định (dc_name): Trung tâm Phân phối DC Biên Hòa (DC-BIENHOA)",
        "Thời gian giao hàng chuẩn từ DC (default_lead_time_days): 1 ngày",
        "Tỷ lệ hạn sử dụng tối thiểu khi nhận hàng từ DC (min_inbound_rsl_percent): 70%",
        "Ngưỡng cảnh báo Vàng mặc định (default_warning_days): 7 ngày",
        "Ngưỡng cảnh báo Đỏ nguy kịch (critical_days): 3 ngày",
        "Giờ mở cửa / Giờ đóng cửa (opening_time / closing_time): 06:00 – 22:00",
        "Trạng thái hoạt động của cửa hàng (status)",
    ])
    body(doc, "4 trạng thái hoạt động của cửa hàng (status):")
    code(doc,
        "OPEN       – Đang mở cửa bán hàng bình thường\n"
        "CLOSED     – Đang đóng cửa ca đêm\n"
        "INVENTORY  – Tạm ngưng giao dịch để kiểm kê kho\n"
        "SUSPENDED  – Tạm ngừng hoạt động khẩn cấp")
    body(doc, "Điều kiện kiểm soát:")
    bul(doc, [
        "Nếu cửa hàng ở trạng thái CLOSED, INVENTORY hoặc SUSPENDED (status != 'OPEN'), quầy thu ngân POS tự động khóa cứng nút Thanh toán và API trả mã lỗi 403 STORE_NOT_OPEN.",
        "Mọi phiếu tiếp nhận hàng DC, hóa đơn bán lẻ POS FEFO, biên bản tiêu hủy và đơn đặt hàng ROP đều tự động gắn với cửa hàng RETAIL-STORE-01.",
        "Mọi thay đổi cấu hình StoreProfile được ghi nhận tự động vào bảng system_audit_logs (action_type = 'UPDATE_STORE_PROFILE').",
    ])

    # ════════════════════════════════════════════════════════════════════════
    # 6. QUẢN LÝ NGÀNH HÀNG & SẢN PHẨM (RULE 9)
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 6, "Quản lý danh mục ngành hàng FMCG & Sản phẩm (Rule 9)")
    body(doc, "Hệ thống phân loại hàng hóa theo đặc thù thời hạn sử dụng và điều kiện bảo quản thực tế:")
    bul(doc, [
        "1. Sữa tươi & Sữa chua (DAIRY) – HSD: 14–45 ngày, Ngưỡng cảnh báo: 7 ngày, Bảo quản mát 2–4°C",
        "2. Bánh mì & Tráng miệng (BAKERY) – HSD: 3–7 ngày, Ngưỡng cảnh báo: 2–3 ngày, Nhiệt độ phòng/Mát",
        "3. Đồ uống & Giải khát (BEVERAGE) – HSD: 30–180 ngày, Ngưỡng cảnh báo: 15 ngày, Nhiệt độ phòng",
        "4. Thực phẩm Chế biến & Thịt mát (FRESH) – HSD: 7–30 ngày, Ngưỡng cảnh báo: 5 ngày, Bảo quản 0–4°C",
        "5. Gia vị & Đồ khô đóng gói (DRY) – HSD: 180–365 ngày, Ngưỡng cảnh báo: 30 ngày, Nhiệt độ phòng",
    ])
    body(doc, "Thông tin chi tiết mỗi sản phẩm (bảng products):")
    bul(doc, [
        "sku – Mã vạch / mã định danh duy nhất (dùng quét Barcode tại POS)",
        "name – Tên sản phẩm thương mại",
        "category_id – Liên kết danh mục ngành hàng",
        "default_supplier_id – Liên kết nhà cung ứng mặc định (Kho tổng DC Biên Hòa)",
        "unit – Đơn vị tính (Hộp, Chai, Gói, Lốc, Túi, Khay…)",
        "cost_price – Giá vốn nhập chuẩn (VNĐ)",
        "selling_price – Giá bán lẻ niêm yết (VNĐ)",
        "standard_shelf_life_days – Vòng đời hạn sử dụng tiêu chuẩn (ngày)",
        "min_stock_level – Ngưỡng tồn kho an toàn tối thiểu (Safety Stock)",
        "max_stock_level – Ngưỡng tồn kho tối đa trên kệ",
        "custom_warning_days – Ngưỡng ngày cảnh báo cận date tùy chỉnh riêng cho sản phẩm",
        "is_active – Trạng thái kinh doanh (1 = ACTIVE / 0 = DISCONTINUED)",
    ])
    sub(doc, "Thuật toán chống trùng lặp sản phẩm (Rule 9 – Product Deduplication)")
    bul(doc, [
        "Khi thêm mới hoặc cập nhật sản phẩm, hệ thống tự động chuẩn hóa chuỗi tiếng Việt (bỏ dấu thanh, chuyển chữ thường, loại bỏ ký tự đặc biệt và khoảng trắng thừa).",
        "Kiểm tra chặn trùng tuyệt đối mã SKU (case-insensitive) trên toàn hệ thống.",
        "Tính độ tương đồng tên sản phẩm bằng kết hợp Sørensen–Dice Bigram và khoảng cách chỉnh sửa Levenshtein: nếu độ tương đồng >= 85% với bất kỳ sản phẩm nào đã tồn tại, hệ thống từ chối tạo mới (HTTP 409) và hiển thị tên/SKU sản phẩm bị trùng để tránh phân tán dữ liệu lô hàng.",
        "Không cho phép ngừng kinh doanh (is_active = 0) nếu sản phẩm đang còn lô hàng khả dụng trong kho.",
    ])

    # ════════════════════════════════════════════════════════════════════════
    # 7. QUẢN LÝ LÔ HÀNG & VÒNG ĐỜI HẠN SỬ DỤNG
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 7, "Quản lý lô hàng & Vòng đời hạn sử dụng (Shelf-Life Management)")
    body(doc,
        "Mỗi sản phẩm có thể có nhiều lô hàng khác nhau tương ứng với từng đợt nhập từ Kho tổng DC. "
        "Quản lý chi tiết từng lô là hạt nhân để vận hành nguyên tắc FEFO và cảnh báo cận date.")
    body(doc, "Thông tin mỗi lô hàng (bảng batches):")
    bul(doc, [
        "batch_code       – Mã lô hàng duy nhất (chuẩn: LOT-DC-[SKU]-[YYYYMMDD])",
        "product_id       – Liên kết sản phẩm",
        "receipt_id       – Liên kết phiếu tiếp nhận hàng DC (goods_receipts)",
        "import_date      – Ngày nhập kho cửa hàng",
        "manufacture_date – Ngày sản xuất (NSX)",
        "expiry_date      – Ngày hết hạn sử dụng (HSD)",
        "initial_quantity – Số lượng nhập ban đầu",
        "current_quantity – Số lượng tồn hiện tại (Ràng buộc CHECK: 0 <= current_quantity <= initial_quantity)",
        "import_price     – Đơn giá vốn nhập thực tế của lô",
        "discount_percent – Tỷ lệ giảm giá xả hàng Quick Markdown hiện tại (0%, 15%, 30%, 40%, 50%)",
        "is_shelf_rotated – Cờ xác nhận đã đảo lô cận date ra mặt tiền kệ (0 / 1)",
        "shelf_rotated_at, shelf_rotated_by – Thời điểm và nhân viên xác nhận đảo kệ",
        "status           – Trạng thái vòng đời lô hàng (ACTIVE, WARNING, EXPIRED, DISPOSED)",
    ])
    body(doc, "Công thức toán học tính toán vòng đời hạn sử dụng:")
    code(doc,
        "1. Số ngày còn lại (DaysLeft):\n"
        "   DaysLeft = DATEDIFF(day, CAST(GETDATE() AS DATE), expiry_date)\n\n"
        "2. Tổng vòng đời chuẩn (TotalLife):\n"
        "   TotalLife = DATEDIFF(day, manufacture_date, expiry_date)\n\n"
        "3. Tỷ lệ hạn sử dụng còn lại (% RSL – Remaining Shelf-Life):\n"
        "   RSL (%) = (DaysLeft / TotalLife) * 100")

    # ════════════════════════════════════════════════════════════════════════
    # 8. CHỨC NĂNG BÁN LẺ POS THEO NGUYÊN TẮC FEFO (RULE 2, 3, 5)
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 8, "Chức năng bán lẻ POS theo nguyên tắc FEFO (First Expired, First Out)")
    body(doc,
        "Nguyên tắc cốt lõi: Bán hàng tại quầy POS = Xuất kho trực tiếp. Thu ngân chỉ cần quét mã "
        "SKU sản phẩm và nhập số lượng khách mua; hệ thống tự động chọn các lô có hạn sử dụng gần "
        "nhất (expiry_date ASC, id ASC) để khấu trừ tồn kho, thu ngân không được phép chọn lô thủ công.")

    sub(doc, "8.1  Quy trình bán lẻ tại quầy POS")
    bul(doc, [
        "Bước 1: Hệ thống kiểm tra trạng thái cửa hàng (StoreProfile.status == 'OPEN'). Nếu cửa hàng đang đóng hoặc kiểm kê thì khóa thanh toán.",
        "Bước 2: Thu ngân quét Barcode / SKU sản phẩm vào giỏ hàng POS. Hệ thống hiển thị bản xem trước phân bổ lô FEFO (FEFO Preview) ngay trên từng dòng giỏ hàng.",
        "Bước 3: Nếu lô cận date đang có chính sách xả hàng Quick Markdown (discount_percent > 0), POS tự động tính giá ưu đãi cho đúng số lượng lấy từ lô đó.",
        "Bước 4: Thu ngân chọn ngữ cảnh bán hàng: Thời tiết (SUNNY / RAINY / NORMAL) và Cờ ngày lễ (is_holiday = 0 / 1).",
        "Bước 5: Khi bấm 'Thanh toán & Xuất kho FEFO', Backend mở SQL Transaction với khóa dòng WITH (UPDLOCK, ROWLOCK), tự động khóa các lô hết hạn (DaysLeft <= 0 -> EXPIRED) và kiểm tra tổng tồn khả dụng.",
        "Bước 6: Thực thi vòng lặp khấu trừ current_quantity từ lô có expiry_date gần nhất; tự động bẻ đơn qua nhiều lô nếu lô đầu không đủ.",
        "Bước 7: Lưu lịch sử bán hàng vào sales_history đích danh theo từng lô đã bẻ, ghi AuditLog (POS_CHECKOUT_FEFO) và xuất biên lai chi tiết kèm danh sách mã lô.",
    ])

    sub(doc, "8.2  Kịch bản bẻ nhỏ đơn hàng qua nhiều lô (Split Order Scenario)")
    code(doc,
        "Ví dụ thực tế:\n"
        "Khách mua: 5 hộp Sữa Tươi Tiệt Trùng Vinamilk 1L\n"
        "Hiện trạng tồn kho theo thứ tự FEFO (expiry_date ASC):\n"
        "  + Lô LOT-01: HSD còn 2 ngày (Vùng Đỏ), tồn 3 hộp, đang giảm giá 30% -> Đơn giá: 24,500 đ\n"
        "  + Lô LOT-02: HSD còn 25 ngày (Vùng Xanh), tồn 10 hộp, nguyên giá 0% -> Đơn giá: 35,000 đ\n\n"
        "Hệ thống tự động bẻ thành 2 dòng phân bổ xuất kho trong 1 giao dịch:\n"
        "  - Dòng 1: Trừ 3 hộp từ Lô LOT-01 x 24,500 đ = 73,500 đ (Lô LOT-01 về 0)\n"
        "  - Dòng 2: Trừ 2 hộp từ Lô LOT-02 x 35,000 đ = 70,000 đ (Lô LOT-02 còn 8 hộp)\n"
        "Tổng tiền hóa đơn: 143,500 đ. Không xảy ra tranh chấp hoặc âm kho.")

    # ════════════════════════════════════════════════════════════════════════
    # 9. QUY TRÌNH KIỂM SOÁT HẠN DÙNG, CẢNH BÁO 3 CẤP MÀU & KHÓA HÀNG HẾT HẠN
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 9, "Quy trình kiểm soát hạn dùng, cảnh báo 3 cấp màu & Khóa cứng hàng hết hạn")
    body(doc,
        "Hệ thống tự động phân loại rủi ro hạn dùng của toàn bộ lô hàng theo 3 vùng màu cảnh báo "
        "(Rule 4) và 1 trạng thái khóa cứng khi quá hạn (Rule 5):")
    mk_table(doc,
        ["Phân vùng cảnh báo", "Điều kiện kích hoạt (DaysLeft)", "Màu hiển thị UI", "Hành động vận hành bắt buộc"],
        [
            ["1. VÙNG XANH\n(An toàn – SAFE)",
             "DaysLeft > WarningDays\n(Mặc định > 7 ngày)",
             "Emerald (Xanh lá)",
             "Lưu kho và bán lẻ bình thường theo giá niêm yết 100%."],
            ["2. VÙNG VÀNG\n(Cảnh báo – WARNING)",
             "3 < DaysLeft <= WarningDays\n(Từ 4 đến 7 ngày)",
             "Amber (Vàng cam)",
             "Kích hoạt giảm giá nhẹ 15% – 30%, thực hiện SOP 5 bước đảo lô ra mặt tiền kệ."],
            ["3. VÙNG ĐỎ\n(Nguy kịch – CRITICAL)",
             "0 < DaysLeft <= 3 ngày\n(Còn 1 đến 3 ngày)",
             "Rose / Red (Đỏ)",
             "Giảm giá kịch sàn 40% – 50% (Quick Markdown), ưu tiên gom xả hàng trong ngày."],
            ["4. QUÁ HẠN\n(Hết hạn – EXPIRED)",
             "DaysLeft <= 0\n(Đã chạm hoặc quá HSD)",
             "Slate (Xám / Đen)",
             "TỰ ĐỘNG KHÓA CỨNG BÁN LẺ POS. Rút hàng khỏi kệ, đưa vào khu cách ly chờ tiêu hủy."],
        ],
        [1.7, 2.0, 1.4, 2.2])

    # ════════════════════════════════════════════════════════════════════════
    # 10. ĐIỀU KIỆN KIỂM TRA KHI BÁN HÀNG & XUẤT KHO
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 10, "Điều kiện kiểm tra khi bán hàng & Xuất kho")
    body(doc, "Hệ thống kiểm tra nghiêm ngặt 7 điều kiện biên trước khi xác nhận giao dịch xuất bán POS:")
    bul(doc, [
        "1. Cửa hàng đang mở cửa hoạt động (StoreProfile.status == 'OPEN').",
        "2. Sản phẩm đang ở trạng thái kinh doanh hợp lệ (products.is_active == 1).",
        "3. Số lượng khách mua là số nguyên dương (quantity_sold > 0).",
        "4. Tự động quét và chuyển các lô có DaysLeft <= 0 sang trạng thái EXPIRED trước khi tính tồn khả dụng.",
        "5. Tổng tồn kho khả dụng còn hạn (DaysLeft > 0, status IN ('ACTIVE','WARNING')) phải >= số lượng khách mua.",
        "6. Tuyệt đối không cho phép current_quantity của bất kỳ lô nào nhỏ hơn 0 (bảo vệ kép ở cả tầng Domain và CHECK constraint SQL Server).",
        "7. Chống xung đột đồng thời (Concurrency Control): Khóa dòng WITH (UPDLOCK, ROWLOCK) trong Transaction buộc giao dịch đến sau phải đợi giao dịch trước hoàn tất.",
    ])

    # ════════════════════════════════════════════════════════════════════════
    # 11. DASHBOARD HỆ THỐNG
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 11, "Dashboard hệ thống")

    sub(doc, "11.1  Dashboard tổng quan cho Cửa hàng trưởng (6 chỉ số KPI tài chính & vận hành)")
    bul(doc, [
        "1. Tổng giá trị vốn hàng tồn kho hiện tại (VNĐ) = SUM(current_quantity * import_price)",
        "2. Tổng giá trị vốn cận date có rủi ro mất mát (Vùng Vàng + Vùng Đỏ)",
        "3. Tỷ lệ hao hụt lãng phí (Spoilage Rate % = Tổng giá trị hủy / Tổng giá trị vốn nhập hoặc Doanh thu)",
        "4. Doanh số bán hàng hôm nay (VNĐ) & Số đơn thanh toán POS trong ngày",
        "5. Số lượng lô hàng cận date cần đảo kệ trong ca trực hôm nay (is_shelf_rotated = 0)",
        "6. Số lượng lô hàng đã hết hạn chờ xử lý & Số phiếu tiêu hủy đang chờ Quản lý phê duyệt",
        "7. Chỉ số phụ: Tỷ lệ tuân thủ bán hàng chuẩn FEFO của nhân viên (FEFO Compliance Rate %)",
    ])

    sub(doc, "11.2  Biểu đồ trực quan & Bảng xếp hạng Top 5")
    bul(doc, [
        "Biểu đồ phân bổ hạn sử dụng lô hàng theo vùng màu (Vùng Xanh / Vùng Vàng / Vùng Đỏ / Quá hạn)",
        "Biểu đồ xu hướng doanh thu bán lẻ và giá trị hàng tiêu hủy theo ngày",
        "Bảng xếp hạng Top 5 Sản phẩm Bán chạy nhất (tổng sản lượng & doanh thu thực tế)",
        "Bảng xếp hạng Top 5 Sản phẩm Phát sinh Hao hụt Cao nhất (tổng số lượng hủy & thiệt hại vốn CostLoss VNĐ)",
    ])

    sub(doc, "11.3  Action Board khẩn cấp 4 Tab cho ca trực (Shift Action Board)")
    bul(doc, [
        "Tab 1 – Lô Đỏ cần giảm giá ngay: Danh sách các lô Vùng Đỏ (DaysLeft <= 3) kèm nút bấm kích hoạt nhanh Quick Markdown 40%–50%.",
        "Tab 2 – Lô cần đảo kệ mặt tiền: Danh sách các lô Vàng/Đỏ chưa đảo kệ (is_shelf_rotated = 0) kèm nút mở quy trình SOP 5 bước đảo kệ.",
        "Tab 3 – Lô hết hạn chờ tiêu hủy: Danh sách các lô có DaysLeft <= 0 cần thu gom vào khu cách ly và lập biên bản tiêu hủy ngay.",
        "Tab 4 – Chạm ngưỡng đặt hàng ROP: Danh sách các mặt hàng có tồn kho chạm ngưỡng ROP (cần đặt bổ sung từ DC) hoặc có nguy cơ ứ đọng DOS > DUE.",
    ])

    # ════════════════════════════════════════════════════════════════════════
    # 12. QUẢN LÝ TIẾP NHẬN HÀNG TỪ KHO TỔNG DC (RULE 7)
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 12, "Quản lý tiếp nhận hàng từ Kho tổng DC (DC Inbound & Date Inspection – Rule 7)")
    body(doc,
        "Cửa hàng chỉ nhận hàng bổ sung từ nguồn cung ứng chuẩn là Trung tâm Phân phối Kho tổng "
        "DC Biên Hòa (mã: DC-BIENHOA).")

    sub(doc, "12.1  Tiêu chuẩn nhận date nghiêm ngặt (Inbound Freshness Rule >= 70%)")
    code(doc,
        "RSL_inbound (%) = ((ExpiryDate - ImportDate) / (ExpiryDate - ManufactureDate)) * 100 >= 70%")
    bul(doc, [
        "Nếu RSL_inbound >= 70%: Hệ thống hiển thị huy hiệu Xanh 'ĐẠT CHUẨN NHẬN HÀNG (>= 70%)' và cho phép lưu phiếu nhập kho.",
        "Nếu RSL_inbound < 70%: Hệ thống KHÓA CỨNG nút 'Lưu phiếu nhập', hiển thị cảnh báo đỏ vi phạm Rule 7 và kích hoạt nút 'Lập Biên Bản Từ Chối Nhận Hàng DC' (POST /api/batches/reject-inbound) để lưu vết kiểm toán REJECT_DC_INBOUND.",
    ])

    sub(doc, "12.2  Quy trình tiếp nhận hàng & Liên kết Đơn đặt hàng PO")
    bul(doc, [
        "Bước 1: Nhân viên kho mở màn hình Tiếp nhận hàng DC, có thể chọn liên kết với Đơn đặt hàng PO đã được Cửa hàng trưởng duyệt (status = APPROVED / SUBMITTED).",
        "Bước 2: Chọn sản phẩm FMCG, nhập Ngày sản xuất (Manufacture Date) và Hạn sử dụng (Expiry Date) in trên bao bì thùng hàng.",
        "Bước 3: Máy tính RSL_inbound tự động kiểm tra ngưỡng >= 70% theo thời gian thực.",
        "Bước 4: Khi đạt chuẩn, hệ thống tự động sinh mã lô chuẩn LOT-DC-[SKU]-[YYYYMMDD], tạo bản ghi goods_receipts và batches, cập nhật giá vốn mới nhất vào products và tự động chuyển đơn PO liên kết sang trạng thái DELIVERED.",
    ])

    # ════════════════════════════════════════════════════════════════════════
    # 13. QUẢN LÝ XẢ HÀNG GIẢM GIÁ (QUICK MARKDOWN) & ĐẢO KỆ THEO FEFO (RULE 10)
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 13, "Quản lý xả hàng giảm giá (Quick Markdown) & Đảo kệ theo FEFO (Rule 10)")

    sub(doc, "13.1  Kích hoạt giảm giá xả hàng Quick Markdown (15%, 30%, 40%, 50%)")
    bul(doc, [
        "Các mức chiết khấu chuẩn trên giao diện: 15% (Vùng Vàng nhẹ), 30% (Vùng Vàng sát hạn), 40% (Vùng Đỏ khẩn cấp), 50% (Vùng Đỏ kịch sàn trong ngày) và 0% (Khôi phục giá niêm yết).",
        "Khi Cửa hàng trưởng chọn mức giảm giá (PATCH /api/batches/:id/markdown), hệ thống cập nhật discount_percent, chuyển trạng thái lô sang WARNING và áp dụng giá khuyến mãi tức thì tại quầy POS.",
        "Mọi thao tác đổi mức chiết khấu đều ghi vào system_audit_logs (action_type = 'APPLY_QUICK_MARKDOWN').",
    ])

    sub(doc, "13.2  Quy trình SOP 5 bước đảo kệ mặt tiền (Shelf Rotation SOP)")
    bul(doc, [
        "Bước 1: Nhân viên kho mở danh sách 'Lô hàng cần đảo kệ' (Vùng Vàng / Vùng Đỏ có is_shelf_rotated = 0) trên phần mềm.",
        "Bước 2: Đến quầy kệ vật lý, dời các lô hàng date xa (Vùng Xanh) tạm thời ra phía ngoài.",
        "Bước 3: Đưa lô hàng cận date (Vùng Vàng / Vùng Đỏ) xếp ra sát mép mặt tiền trưng bày để khách hàng dễ lấy nhất.",
        "Bước 4: Xếp các lô date xa trở lại phía sau lưng lô cận date theo đúng trật tự FEFO.",
        "Bước 5: Tick đủ 5 bước trên Modal SOP và bấm 'Xác nhận hoàn tất đảo kệ' (PATCH /api/batches/:id/rotate-shelf) để cập nhật is_shelf_rotated = 1 và ghi nhật ký kiểm toán ROTATE_SHELF_FEFO.",
    ])

    # ════════════════════════════════════════════════════════════════════════
    # 14. QUẢN LÝ TIÊU HỦY & SỔ HAO HỤT TÀI CHÍNH (RULE 6)
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 14, "Quản lý tiêu hủy & Sổ hao hụt tài chính (Spoilage Loss Ledger – Rule 6)")
    body(doc,
        "Mọi số lượng hàng hóa rút khỏi quầy kệ do hư hỏng hoặc quá hạn đều phải lập biên bản tiêu hủy "
        "và hạch toán minh bạch vào Sổ hao hụt tài chính bất biến theo cơ chế tách biệt trách nhiệm (SoD):")
    bul(doc, [
        "Mã biên bản tiêu hủy (record_code – duy nhất, tự sinh)",
        "Lô hàng bị hủy (batch_id) & Ngày thực hiện tiêu hủy (disposed_date)",
        "Số lượng tiêu hủy thực tế (quantity_disposed <= current_quantity của lô)",
        "Giá trị vốn tổn thất bắt buộc: CostLoss = QuantityDisposed * ImportPrice",
        "Lý do tiêu hủy chuẩn hóa: EXPIRED (Hết hạn sử dụng), DAMAGED (Móp méo/rách bao bì), SPOILED (Biến chất/hư hỏng chuỗi lạnh)",
        "Người lập đề xuất (performed_by – Thu ngân / Nhân viên kho / Quản lý)",
        "Người phê duyệt chốt sổ (approved_by – Bắt buộc là STORE_MANAGER hoặc ADMIN)",
    ])
    body(doc, "Quy trình 2 bước (Lập đề xuất -> Phê duyệt chốt sổ):")
    bul(doc, [
        "1. Khi CASHIER hoặc WAREHOUSE_STAFF lập phiếu (POST /api/spoilage), bản ghi được tạo ở trạng thái Chờ duyệt (approved_by = NULL), chưa trừ tồn kho để chờ Cửa hàng trưởng kiểm tra thực tế tại khu cách ly.",
        "2. Khi STORE_MANAGER hoặc ADMIN bấm 'Phê duyệt & Chốt sổ' (POST /api/spoilage/:id/approve), hệ thống mở SQL Transaction có khóa UPDLOCK, khấu trừ current_quantity của lô (nếu tồn về 0 thì đổi status = 'DISPOSED'), cập nhật approved_by và ghi AuditLog (APPROVE_SPOILAGE_DISPOSAL).",
    ])

    # ════════════════════════════════════════════════════════════════════════
    # 15. QUẢN LÝ LỊCH TRỰC VÀ BÀN GIAO CA LÀM VIỆC
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 15, "Quản lý lịch trực và bàn giao ca làm việc")
    body(doc, "Cửa hàng vận hành 2 ca tiêu chuẩn mỗi ngày (Ca Sáng: 06:00 – 14:00, Ca Chiều: 14:00 – 22:00).")

    sub(doc, "15.1  Quy trình bàn giao ca trực điện tử 4 bước")
    bul(doc, [
        "Bước 1 – Chốt ca POS & Kiểm đếm tiền mặt: Hệ thống tự động tổng hợp doanh số POS thực tế trong ngày; nhân viên nhập số tiền mặt kiểm đếm trong két để đối soát chênh lệch tự động.",
        "Bước 2 – Rà soát danh sách lô Đỏ và Vàng: Hai nhân viên giao – nhận ca cùng kiểm tra các lô cận date trên kệ và tiến độ đảo kệ mặt tiền.",
        "Bước 3 – Bàn giao thùng hàng chờ tiêu hủy: Kiểm đếm số lượng hàng hỏng/quá hạn phát sinh trong ca tại khu vực cách ly.",
        "Bước 4 – Ký biên bản bàn giao điện tử: Tick xác nhận cam kết và bấm 'Ký Xác Nhận Bàn Giao Ca' (POST /api/shift-handover) để lưu vết bất biến vào AuditLogs (action_type = 'SHIFT_HANDOVER').",
    ])

    sub(doc, "15.2  Quy định trách nhiệm và chế tài kỷ luật (Hiển thị trực tiếp tại Bước 4)")
    bul(doc, [
        "1. Sơ suất để lọt hàng hết hạn bán cho khách: Khiển trách, bồi thường 100% giá trị đơn hàng.",
        "2. Không thực hiện đảo lô cận date ra mặt tiền kệ trưng bày: Trừ điểm chuyên cần tháng.",
        "3. Tự ý vứt bỏ hàng hỏng/quá hạn không lập phiếu tiêu hủy trên phần mềm: Bồi thường 100% giá trị vốn thất thoát.",
    ])

    # ════════════════════════════════════════════════════════════════════════
    # 16. PHÂN QUYỀN CHỨC NĂNG (RBAC MATRIX)
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 16, "Phân quyền chức năng (RBAC Matrix)")
    body(doc, "Bảng ma trận phân quyền chi tiết cho 4 vai trò người dùng trong hệ thống:")
    mk_table(doc,
        ["Chức năng nghiệp vụ", "Admin", "Cửa hàng trưởng", "Thu ngân", "Nhân viên kho"],
        [
            ["Đăng nhập hệ thống (/login)",                  "Có", "Có",        "Có",       "Có"],
            ["Quản lý tài khoản & phân quyền RBAC",          "Có", "Không",     "Không",    "Không"],
            ["Cấu hình thông tin cửa hàng (StoreProfile)",   "Có", "Tùy quyền", "Không",    "Không"],
            ["Quản lý danh mục & sản phẩm FMCG (Rule 9)",    "Có", "Có",        "Chỉ xem",  "Chỉ xem"],
            ["Xem danh sách lô hàng & cảnh báo 3 màu",       "Có", "Có",        "Có",       "Có"],
            ["Bán lẻ POS tự động trừ kho FEFO (Rule 2)",     "Có", "Có",        "Có",       "Không"],
            ["Áp dụng giảm giá Quick Markdown (15%–50%)",    "Có", "Có",        "Không",    "Không"],
            ["Tiếp nhận hàng từ Kho tổng DC (RSL >= 70%)",   "Có", "Có",        "Không",    "Có"],
            ["Xác nhận SOP 5 bước đảo lô mặt tiền kệ",       "Có", "Có",        "Không",    "Có"],
            ["Lập đề xuất tiêu hủy hàng hỏng (PENDING)",     "Có", "Có",        "Có",       "Có"],
            ["Phê duyệt tiêu hủy & chốt Sổ hao hụt (Rule 6)","Có", "Có",        "Không",    "Không"],
            ["Xem dự báo nhu cầu bán hàng & ROP (Rule 8)",   "Có", "Có",        "Không",    "Tùy quyền"],
            ["Tạo & duyệt đơn đặt hàng PO gửi DC",           "Có", "Có",        "Không",    "Không"],
            ["Xem Dashboard 6 KPI tổng điều hành",           "Có", "Có",        "Không",    "Không"],
            ["Ký biên bản bàn giao ca trực điện tử 4 bước",  "Có", "Có",        "Có",       "Có"],
            ["Tra cứu Nhật ký kiểm toán (Audit Log)",        "Có", "Tùy quyền", "Không",    "Không"],
        ],
        [2.7, 0.9, 1.3, 1.0, 1.1])

    # ════════════════════════════════════════════════════════════════════════
    # 17. THIẾT KẾ DATABASE SQL SERVER (13 BẢNG CHUẨN 3NF)
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 17, "Thiết kế Database SQL Server (retail_spoilage_db – 15 bảng chuẩn 3NF)")
    body(doc,
        "Cơ sở dữ liệu gồm 15 bảng chuẩn hóa 3NF nghiêm ngặt, 36 Foreign Keys named trên Microsoft SQL Server LocalDB "
        "(chuỗi kết nối: (localdb)\\mssqllocaldb, database: retail_spoilage_db):")

    ddl_list = [
        ("17.1  Bảng roles (Danh mục vai trò phân quyền RBAC)",
"""CREATE TABLE [dbo].[roles] (
    [id]          INT IDENTITY(1,1) PRIMARY KEY,
    [code]        NVARCHAR(50)  NOT NULL UNIQUE, -- ADMIN, STORE_MANAGER, CASHIER, WAREHOUSE_STAFF
    [name]        NVARCHAR(100) NOT NULL,
    [description] NVARCHAR(255) NULL,
    [created_at]  DATETIME DEFAULT GETDATE()
);"""),
        ("17.2  Bảng users (Tài khoản người dùng & Trạng thái khóa bảo mật)",
"""CREATE TABLE [dbo].[users] (
    [id]                   INT IDENTITY(1,1) PRIMARY KEY,
    [username]             NVARCHAR(50)  NOT NULL UNIQUE,
    [password_hash]        NVARCHAR(255) NOT NULL,
    [full_name]            NVARCHAR(100) NOT NULL,
    [email]                NVARCHAR(100) NULL,
    [phone]                NVARCHAR(20)  NULL,
    [role]                 NVARCHAR(30)  NOT NULL DEFAULT 'CASHIER'
        CONSTRAINT chk_users_role CHECK ([role] IN ('ADMIN','STORE_MANAGER','CASHIER','WAREHOUSE_STAFF')),
    [is_active]            BIT           NOT NULL DEFAULT 1,
    [failed_login_attempts] INT          NOT NULL DEFAULT 0,
    [locked_until]         DATETIME      NULL,
    [last_login]           DATETIME      NULL,
    [created_at]           DATETIME      DEFAULT GETDATE(),
    [updated_at]           DATETIME      DEFAULT GETDATE()
);"""),
        ("17.3  Bảng store_profile (Hồ sơ cửa hàng bán lẻ duy nhất – Rule 1)",
"""CREATE TABLE [dbo].[store_profile] (
    [id]                      INT IDENTITY(1,1) PRIMARY KEY,
    [store_code]              NVARCHAR(50)  NOT NULL UNIQUE DEFAULT 'RETAIL-STORE-01',
    [store_name]              NVARCHAR(200) NOT NULL,
    [address]                 NVARCHAR(255) NOT NULL,
    [phone]                   NVARCHAR(50)  NULL,
    [email]                   NVARCHAR(100) NULL,
    [manager_name]            NVARCHAR(100) NULL,
    [dc_name]                 NVARCHAR(150) NOT NULL DEFAULT N'Trung tâm Phân phối DC Biên Hòa (DC-BIENHOA)',
    [default_lead_time_days]  INT           NOT NULL DEFAULT 1,
    [min_inbound_rsl_percent] DECIMAL(5,2)  NOT NULL DEFAULT 70.00,
    [default_warning_days]    INT           NOT NULL DEFAULT 7,
    [critical_days]           INT           NOT NULL DEFAULT 3,
    [opening_time]            NVARCHAR(10)  NOT NULL DEFAULT '06:00',
    [closing_time]            NVARCHAR(10)  NOT NULL DEFAULT '22:00',
    [capacity_info]           NVARCHAR(100) NULL,
    [status]                  NVARCHAR(30)  NOT NULL DEFAULT 'OPEN'
        CONSTRAINT chk_store_status CHECK ([status] IN ('OPEN','CLOSED','INVENTORY','SUSPENDED')),
    [updated_at]              DATETIME      DEFAULT GETDATE()
);"""),
        ("17.4  Bảng suppliers (Kho tổng DC Biên Hòa & Nhà cung ứng)",
"""CREATE TABLE [dbo].[suppliers] (
    [id]             INT IDENTITY(1,1) PRIMARY KEY,
    [code]           NVARCHAR(30)  NOT NULL UNIQUE,
    [name]           NVARCHAR(150) NOT NULL,
    [contact_name]   NVARCHAR(100) NULL,
    [phone]          NVARCHAR(20)  NULL,
    [address]        NVARCHAR(255) NULL,
    [lead_time_days] INT           NOT NULL DEFAULT 1,
    [is_active]      BIT           NOT NULL DEFAULT 1,
    [created_at]     DATETIME      DEFAULT GETDATE()
);"""),
        ("17.5  Bảng categories (Danh mục ngành hàng FMCG)",
"""CREATE TABLE [dbo].[categories] (
    [id]                   INT IDENTITY(1,1) PRIMARY KEY,
    [code]                 NVARCHAR(30)  NOT NULL UNIQUE,
    [name]                 NVARCHAR(100) NOT NULL,
    [description]          NVARCHAR(255) NULL,
    [default_warning_days] INT           NOT NULL DEFAULT 7,
    [storage_Temp]         NVARCHAR(50)  NULL,
    [created_at]           DATETIME      DEFAULT GETDATE()
);"""),
        ("17.6  Bảng products (Sản phẩm hàng hóa bán lẻ)",
"""CREATE TABLE [dbo].[products] (
    [id]                       INT IDENTITY(1,1) PRIMARY KEY,
    [sku]                      NVARCHAR(50)  NOT NULL UNIQUE,
    [name]                     NVARCHAR(150) NOT NULL,
    [category_id]              INT NOT NULL FOREIGN KEY REFERENCES [dbo].[categories]([id]),
    [default_supplier_id]      INT NOT NULL FOREIGN KEY REFERENCES [dbo].[suppliers]([id]),
    [unit]                     NVARCHAR(20)  NOT NULL,
    [cost_price]               DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    [selling_price]            DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    [standard_shelf_life_days] INT NOT NULL,
    [min_stock_level]          INT NOT NULL DEFAULT 15,
    [max_stock_level]          INT NOT NULL DEFAULT 150,
    [custom_warning_days]      INT NULL,
    [image_url]                NVARCHAR(255) NULL,
    [is_active]                BIT NOT NULL DEFAULT 1,
    [created_at]               DATETIME DEFAULT GETDATE(),
    [updated_at]               DATETIME DEFAULT GETDATE(),
    CONSTRAINT chk_products_price CHECK (selling_price > 0 AND cost_price >= 0)
);"""),
        ("17.7  Bảng goods_receipts (Phiếu tiếp nhận hàng từ Kho tổng DC)",
"""CREATE TABLE [dbo].[goods_receipts] (
    [id]             INT IDENTITY(1,1) PRIMARY KEY,
    [receipt_number] NVARCHAR(50)  NOT NULL UNIQUE,
    [supplier_id]    INT NOT NULL FOREIGN KEY REFERENCES [dbo].[suppliers]([id]),
    [received_by]    INT NOT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [receipt_date]   DATE NOT NULL,
    [total_cost]     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    [status]         NVARCHAR(20)  NOT NULL DEFAULT 'COMPLETED'
        CONSTRAINT chk_receipt_status CHECK ([status] IN ('PENDING','COMPLETED','CANCELLED')),
    [notes]          NVARCHAR(255) NULL,
    [created_at]     DATETIME DEFAULT GETDATE()
);"""),
        ("17.8  Bảng batches (Lô hàng & Vòng đời Hạn sử dụng – Trọng tâm FEFO)",
"""CREATE TABLE [dbo].[batches] (
    [id]               INT IDENTITY(1,1) PRIMARY KEY,
    [receipt_id]       INT NULL FOREIGN KEY REFERENCES [dbo].[goods_receipts]([id]),
    [batch_code]       NVARCHAR(50)  NOT NULL UNIQUE,
    [product_id]       INT NOT NULL FOREIGN KEY REFERENCES [dbo].[products]([id]),
    [import_date]      DATE NOT NULL,
    [manufacture_date] DATE NOT NULL,
    [expiry_date]      DATE NOT NULL,
    [initial_quantity] INT NOT NULL,
    [current_quantity] INT NOT NULL DEFAULT 0,
    [import_price]     DECIMAL(12,2) NOT NULL,
    [discount_percent] INT NOT NULL DEFAULT 0,
    [is_shelf_rotated] BIT NOT NULL DEFAULT 0,
    [shelf_rotated_at] DATETIME NULL,
    [shelf_rotated_by] INT NULL,
    [status]           NVARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT chk_batch_status CHECK ([status] IN ('ACTIVE','WARNING','EXPIRED','DISPOSED')),
    [created_at]       DATETIME DEFAULT GETDATE(),
    CONSTRAINT chk_batch_quantity CHECK (current_quantity >= 0 AND current_quantity <= initial_quantity),
    CONSTRAINT chk_batch_dates    CHECK (expiry_date > manufacture_date),
    CONSTRAINT chk_batch_discount CHECK (discount_percent BETWEEN 0 AND 100)
);"""),
        ("17.9  Bảng sales_history (Lịch sử bán lẻ POS & Ngữ cảnh dự báo ROP)",
"""CREATE TABLE [dbo].[sales_history] (
    [id]               INT IDENTITY(1,1) PRIMARY KEY,
    [transaction_code] NVARCHAR(50)  NOT NULL,
    [product_id]       INT NOT NULL FOREIGN KEY REFERENCES [dbo].[products]([id]),
    [batch_id]         INT NOT NULL FOREIGN KEY REFERENCES [dbo].[batches]([id]),
    [quantity_sold]    INT NOT NULL CONSTRAINT chk_sales_qty CHECK (quantity_sold > 0),
    [sale_price]       DECIMAL(12,2) NOT NULL,
    [total_amount]     DECIMAL(12,2) NOT NULL,
    [sale_date]        DATE NOT NULL,
    [day_of_week]      NVARCHAR(10)  NOT NULL,
    [weather]          NVARCHAR(20)  NOT NULL DEFAULT 'NORMAL'
        CONSTRAINT chk_sales_weather CHECK ([weather] IN ('SUNNY','RAINY','NORMAL')),
    [is_holiday]       BIT NOT NULL DEFAULT 0,
    [created_at]       DATETIME DEFAULT GETDATE()
);"""),
        ("17.10  Bảng spoilage_records (Biên bản tiêu hủy & Sổ hao hụt tài chính – Rule 6)",
"""CREATE TABLE [dbo].[spoilage_records] (
    [id]                INT IDENTITY(1,1) PRIMARY KEY,
    [record_code]       NVARCHAR(50)  NOT NULL UNIQUE,
    [batch_id]          INT NOT NULL FOREIGN KEY REFERENCES [dbo].[batches]([id]),
    [disposed_date]     DATE NOT NULL,
    [quantity_disposed] INT NOT NULL CONSTRAINT chk_spoil_qty CHECK (quantity_disposed > 0),
    [cost_loss]         DECIMAL(12,2) NOT NULL,
    [reason]            NVARCHAR(20)  NOT NULL DEFAULT 'EXPIRED'
        CONSTRAINT chk_spoil_reason CHECK ([reason] IN ('EXPIRED','DAMAGED','SPOILED')),
    [notes]             NVARCHAR(255) NULL,
    [performed_by]      INT NOT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [approved_by]       INT NULL     FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [created_at]        DATETIME DEFAULT GETDATE()
);"""),
        ("17.11  Bảng purchase_orders (Đơn đặt hàng bổ sung gửi Kho tổng DC)",
"""CREATE TABLE [dbo].[purchase_orders] (
    [id]                     INT IDENTITY(1,1) PRIMARY KEY,
    [order_code]             NVARCHAR(50)  NOT NULL UNIQUE,
    [supplier_id]            INT NOT NULL FOREIGN KEY REFERENCES [dbo].[suppliers]([id]),
    [created_by]             INT NOT NULL FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [approved_by]            INT NULL     FOREIGN KEY REFERENCES [dbo].[users]([id]),
    [status]                 NVARCHAR(20)  NOT NULL DEFAULT 'DRAFT'
        CONSTRAINT chk_po_status CHECK ([status] IN ('DRAFT','APPROVED','SUBMITTED','DELIVERED','CANCELLED')),
    [total_estimated_cost]   DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    [expected_delivery_date] DATE NULL,
    [notes]                  NVARCHAR(255) NULL,
    [created_at]             DATETIME DEFAULT GETDATE(),
    [updated_at]             DATETIME DEFAULT GETDATE()
);"""),
        ("17.12  Bảng purchase_order_items (Chi tiết mặt hàng đặt bổ sung theo ROP)",
"""CREATE TABLE [dbo].[purchase_order_items] (
    [id]                     INT IDENTITY(1,1) PRIMARY KEY,
    [order_id]               INT NOT NULL FOREIGN KEY REFERENCES [dbo].[purchase_orders]([id]) ON DELETE CASCADE,
    [product_id]             INT NOT NULL FOREIGN KEY REFERENCES [dbo].[products]([id]),
    [current_stock_at_order] INT NOT NULL,
    [suggested_quantity]     INT NOT NULL,
    [approved_quantity]      INT NOT NULL,
    [unit_cost]              DECIMAL(12,2) NOT NULL,
    [total_line_cost]        DECIMAL(14,2) NOT NULL,
    CONSTRAINT chk_poi_qty CHECK (approved_quantity >= 0)
);"""),
        ("17.13  Bảng system_audit_logs (Nhật ký kiểm toán hệ thống bất biến – Rule 11)",
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
    ]
    for title, ddl_text in ddl_list:
        sub(doc, title)
        code(doc, ddl_text)

    # ════════════════════════════════════════════════════════════════════════
    # 18. INDEX SQL SERVER NÊN CÓ
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 18, "Index SQL Server tối ưu hiệu năng")
    body(doc, "Để tăng tốc truy vấn bán lẻ POS FEFO, quét hạn dùng và tính toán dự báo ROP:")
    code(doc,
        "CREATE INDEX IX_Batches_FEFO\n"
        "    ON [dbo].[batches] (product_id, status, expiry_date ASC)\n"
        "    INCLUDE (current_quantity, discount_percent, import_price);\n\n"
        "CREATE INDEX IX_Batches_ExpiryWatchdog\n"
        "    ON [dbo].[batches] (expiry_date ASC, status)\n"
        "    INCLUDE (batch_code, current_quantity, product_id);\n\n"
        "CREATE INDEX IX_Products_Sku\n"
        "    ON [dbo].[products] (sku);\n\n"
        "CREATE INDEX IX_SalesHistory_Product_Date\n"
        "    ON [dbo].[sales_history] (product_id, sale_date DESC)\n"
        "    INCLUDE (quantity_sold, sale_price);\n\n"
        "CREATE INDEX IX_SpoilageRecords_Batch\n"
        "    ON [dbo].[spoilage_records] (batch_id, disposed_date DESC);\n\n"
        "CREATE INDEX IX_PurchaseOrders_Status\n"
        "    ON [dbo].[purchase_orders] (status, created_at DESC);\n\n"
        "CREATE INDEX IX_AuditLogs_CreatedAt\n"
        "    ON [dbo].[system_audit_logs] (created_at DESC, user_id);")

    # ════════════════════════════════════════════════════════════════════════
    # 19. CLEAN ARCHITECTURE
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 19, "Kiến trúc Clean Architecture 4 tầng")
    body(doc, "Hệ thống được thiết kế nghiêm ngặt theo Clean Architecture gồm 4 tầng:")
    bul(doc, [
        "1. Domain Layer (Tầng Hạt nhân Nghiệp vụ): Chứa Entities (User, StoreProfile, Product, Batch, SaleOrder, SpoilageRecord, PurchaseOrder), Value Objects (ShelfLife, AlertLevel, Money, WeatherCondition), Domain Services (FefoAllocationPolicy, RopCalculationService, MarkdownPricingPolicy, ProductDeduplicationService) và Repository Interfaces. Hoàn toàn độc lập, không phụ thuộc SQL Server hay Express.",
        "2. Application Layer (Tầng Ca sử dụng – Use Cases): Điều phối luồng nghiệp vụ thông qua các Use Case chuyên biệt (ProcessFefoSaleUseCase, ReceiveDCBatchUseCase, RejectDCBatchUseCase, EvaluateAlertsUseCase, ApplyQuickMarkdownUseCase, RotateShelfFefoUseCase, DisposeSpoiledGoodsUseCase, ApproveSpoilageRecordUseCase, CalculateROPForecastUseCase, CreatePurchaseOrderUseCase, GetDashboardOverviewUseCase).",
        "3. Infrastructure Layer (Tầng Hạ tầng Kỹ thuật): Thực thi kết nối Microsoft SQL Server LocalDB (sqlConnection.js), các Sql*Repository dùng T-SQL có khóa giao dịch ACID (UPDLOCK, ROWLOCK) và dịch vụ bảo mật JWT/Hash (TokenService, PasswordHasher).",
        "4. Presentation Layer (Tầng Giao diện & API): Hệ thống Express Controllers, Middlewares (authMiddleware, roleMiddleware, errorHandler) chuẩn hóa JSON Response và ứng dụng Frontend SPA (React + Vite).",
    ])
    code(doc,
        "Quy tắc phụ thuộc (Dependency Rule):\n"
        "Presentation  -->  Application  -->  Domain\n"
        "Infrastructure --> Application / Domain\n"
        "(Domain Layer tuyệt đối không phụ thuộc vào Database, Framework hay UI)")

    # ════════════════════════════════════════════════════════════════════════
    # 20. CẤU TRÚC THƯ MỤC BACKEND & FRONTEND THỰC TẾ
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 20, "Cấu trúc thư mục Backend & Frontend thực tế")
    code(doc,
        "Backend/ (Node.js + Express + Clean Architecture + SQL Server LocalDB)\n"
        "├── src/\n"
        "│   ├── domain/\n"
        "│   │   ├── entities/        (User, StoreProfile, Product, Batch, SaleOrder, SpoilageRecord, PurchaseOrder)\n"
        "│   │   ├── value-objects/   (ShelfLife, AlertLevel, Money, WeatherCondition)\n"
        "│   │   ├── services/        (FefoAllocationPolicy, RopCalculationService, MarkdownPricingPolicy,\n"
        "│   │   │                     ProductDeduplicationService)\n"
        "│   │   ├── repositories/    (IUserRepository, IStoreProfileRepository, IProductRepository,\n"
        "│   │   │                     IBatchRepository, ISaleRepository, ISpoilageRepository, IPurchaseOrderRepository)\n"
        "│   │   └── exceptions/      (DomainException, InsufficientStockException, InvalidRslException...)\n"
        "│   ├── application/\n"
        "│   │   └── use-cases/\n"
        "│   │       ├── auth/        (LoginUseCase, GetCurrentUserUseCase, ChangePasswordUseCase, ManageUsersUseCase)\n"
        "│   │       ├── store/       (GetStoreProfileUseCase, UpdateStoreProfileUseCase)\n"
        "│   │       ├── product/     (CreateProductUseCase, UpdateProductUseCase)\n"
        "│   │       ├── batch/       (ReceiveDCBatchUseCase, RejectDCBatchUseCase, EvaluateAlertsUseCase,\n"
        "│   │       │                 ApplyQuickMarkdownUseCase, RotateShelfFefoUseCase)\n"
        "│   │       ├── sales/       (ProcessFefoSaleUseCase)\n"
        "│   │       ├── spoilage/    (DisposeSpoiledGoodsUseCase, ApproveSpoilageRecordUseCase, GetSpoilageLedgerUseCase)\n"
        "│   │       ├── forecast/    (CalculateROPForecastUseCase, CreatePurchaseOrderUseCase, UpdatePurchaseOrderStatusUseCase)\n"
        "│   │       └── dashboard/   (GetDashboardOverviewUseCase)\n"
        "│   ├── infrastructure/\n"
        "│   │   ├── database/\n"
        "│   │   │   ├── sqlConnection.js\n"
        "│   │   │   └── repositories/ (SqlUserRepository, SqlStoreProfileRepository, SqlProductRepository,\n"
        "│   │   │                      SqlBatchRepository, SqlSaleRepository, SqlSpoilageRepository,\n"
        "│   │   │                      SqlPurchaseOrderRepository, SqlAuditLogRepository)\n"
        "│   │   └── security/        (TokenService.js, PasswordHasher.js)\n"
        "│   ├── presentation/\n"
        "│   │   ├── controllers/     (AuthController, StoreProfileController, CatalogController, BatchController,\n"
        "│   │   │                     SalesController, SpoilageController, ForecastController, DashboardController,\n"
        "│   │   │                     ShiftHandoverController, AuditLogController)\n"
        "│   │   ├── middlewares/     (authMiddleware.js, errorHandler.js)\n"
        "│   │   └── routes/          (index.js)\n"
        "│   └── container.js         (Dependency Injection Container)\n"
        "└── server.js\n\n"
        "Frontend/ (React 19 + Vite + Lucide Icons)\n"
        "├── src/\n"
        "│   ├── components/\n"
        "│   │   ├── LoginView.jsx            (Trang đăng nhập riêng /login & Quick Demo 4 vai trò)\n"
        "│   │   ├── DashboardView.jsx        (Dashboard 6 KPI, Biểu đồ, Top 5 & Action Board 4 Tab)\n"
        "│   │   ├── PosCheckoutView.jsx      (Quầy bán lẻ POS tự động bẻ lô FEFO)\n"
        "│   │   ├── ExpiryMonitorView.jsx    (Giám sát HSD 3 cấp màu, Quick Markdown & SOP 5 bước đảo kệ)\n"
        "│   │   ├── DcIntakeView.jsx         (Tiếp nhận hàng DC kiểm chuẩn RSL >= 70% & Biên bản từ chối)\n"
        "│   │   ├── SpoilageLogView.jsx      (Biên bản tiêu hủy & Sổ hao hụt tài chính SoD)\n"
        "│   │   ├── ReorderPredictorView.jsx (Dự báo ROP tích hợp Thời tiết/Lễ Tết & Cảnh báo DOS > DUE)\n"
        "│   │   ├── PurchaseOrdersSubView.jsx(Quản lý Đơn đặt hàng PO gửi DC Biên Hòa)\n"
        "│   │   ├── ProductCatalogView.jsx   (Danh mục FMCG & Sản phẩm chống trùng >= 85%)\n"
        "│   │   ├── StoreSettingsView.jsx    (Hồ sơ cửa hàng RETAIL-STORE-01 & Quản trị RBAC)\n"
        "│   │   ├── ShiftHandoverView.jsx    (Bàn giao ca trực điện tử 4 bước & 3 chế tài kỷ luật)\n"
        "│   │   └── AuditLogView.jsx         (Nhật ký kiểm toán hệ thống bất biến)\n"
        "│   └── App.jsx")

    # ════════════════════════════════════════════════════════════════════════
    # 21. CÁC USE CASE QUAN TRỌNG
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 21, "Các Use Case cốt lõi trong tầng Application")
    uc_list = [
        ("21.1  ProcessFefoSaleUseCase (Bán lẻ POS tự động bẻ lô FEFO)",
         "• Kiểm tra trạng thái cửa hàng (StoreProfile.status == 'OPEN') và quyền thu ngân.\n"
         "• Tự động đồng bộ khóa cứng các lô hết hạn (DaysLeft <= 0 -> EXPIRED).\n"
         "• Truy vấn các lô còn tồn khả dụng theo đúng thứ tự expiry_date ASC, id ASC.\n"
         "• Dùng FefoAllocationPolicy tự động bóc tách số lượng qua 1 hoặc nhiều lô, áp dụng giá Quick Markdown từng lô.\n"
         "• Thực thi Transaction SQL Server có khóa UPDLOCK, ROWLOCK: trừ current_quantity, lưu sales_history kèm weather & is_holiday, ghi AuditLog POS_CHECKOUT_FEFO."),
        ("21.2  ReceiveDCBatchUseCase & RejectDCBatchUseCase (Kiểm chuẩn nhận hàng DC – Rule 7)",
         "• Tính toán tỷ lệ độ tươi đầu vào: RSL_inbound = ((ExpiryDate - ImportDate) / (ExpiryDate - ManufactureDate)) * 100.\n"
         "• Nếu RSL_inbound < 70%: Khóa lưu kho và cho phép gọi RejectDCBatchUseCase để lập Biên bản từ chối nhận hàng DC (ghi AuditLog REJECT_DC_INBOUND).\n"
         "• Nếu RSL_inbound >= 70%: Sinh mã lô chuẩn LOT-DC-[SKU]-[YYYYMMDD], tạo goods_receipts + batches, cập nhật cost_price sản phẩm và chuyển đơn PO liên kết sang DELIVERED."),
        ("21.3  ApplyQuickMarkdownUseCase (Kích hoạt giảm giá xả hàng 15%, 30%, 40%, 50%)",
         "• Kiểm tra quyền STORE_MANAGER / ADMIN và lô hàng còn hạn (DaysLeft > 0).\n"
         "• Cập nhật discount_percent (0, 15, 30, 40, 50) và đổi trạng thái lô sang WARNING.\n"
         "• Giá ưu đãi có hiệu lực tức thì tại quầy thu ngân POS; ghi AuditLog APPLY_QUICK_MARKDOWN."),
        ("21.4  RotateShelfFefoUseCase (Xác nhận SOP 5 bước đảo kệ mặt tiền)",
         "• Nhận xác nhận hoàn tất 5 bước đảo lô cận date ra mặt tiền kệ từ WAREHOUSE_STAFF / STORE_MANAGER.\n"
         "• Cập nhật is_shelf_rotated = 1, shelf_rotated_at = GETDATE(), shelf_rotated_by = @userId.\n"
         "• Gỡ lô khỏi danh sách 'Chưa đảo kệ' trên Dashboard và ghi AuditLog ROTATE_SHELF_FEFO."),
        ("21.5  DisposeSpoiledGoodsUseCase & ApproveSpoilageRecordUseCase (Tiêu hủy & Sổ hao hụt – Rule 6)",
         "• Nhân viên lập phiếu đề xuất tiêu hủy (trạng thái PENDING) hoặc Quản lý lập và duyệt trực tiếp.\n"
         "• Khi STORE_MANAGER / ADMIN phê duyệt: Mở Transaction khóa dòng lô hàng, trừ current_quantity (nếu về 0 thì chuyển status = 'DISPOSED'), tính CostLoss = QuantityDisposed * ImportPrice, lưu approved_by và ghi AuditLog."),
        ("21.6  CalculateROPForecastUseCase (Dự báo nhu cầu ROP tích hợp Thời tiết & Lễ Tết – Rule 8)",
         "• Tính tốc độ bán bình quân 14 ngày gần nhất (d_base).\n"
         "• Nhân hệ số thời tiết W_factor (Nắng nóng / Mưa lớn theo từng ngành hàng) và hệ số ngày lễ H_factor (1.30) ra d_adjusted.\n"
         "• Tính ROP = CEILING(d_adjusted * LeadTime + SafetyStock), DOS = CurrentStock / d_adjusted, DUE = min(DaysLeft).\n"
         "• Cảnh báo nguy cơ ứ đọng nếu DOS > DUE và tự động đề xuất số lượng đặt hàng gửi Kho tổng DC nếu CurrentStock <= ROP."),
        ("21.7  GetDashboardOverviewUseCase (Tổng hợp Dashboard 6 KPI, Top 5 & Action Board 4 Tab)",
         "• Tổng hợp 6 KPI tài chính + FEFO Compliance Rate %, phân bổ lô theo vùng màu, xu hướng 7 ngày, Top 5 Bán chạy, Top 5 Hao hụt và 4 danh sách hành động khẩn cấp cho ca trực."),
    ]
    for title, desc in uc_list:
        sub(doc, title)
        code(doc, desc)

    # ════════════════════════════════════════════════════════════════════════
    # 22. DANH SÁCH RESTFUL API THỰC TẾ
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 22, "Danh sách RESTful API thực tế")
    body(doc,
        "Toàn bộ API được bảo vệ bằng JWT Middleware (authMiddleware) và phân quyền vai trò (authorizeRoles). "
        "Định dạng phản hồi chuẩn: { success: boolean, data: any, message: string }.")

    api_groups = [
        ("22.1  Xác thực & Quản trị tài khoản (Auth & Users)", [
            ("POST",  "/api/auth/login",            "Đăng nhập – kiểm tra Brute-Force & cấp JWT Token"),
            ("GET",   "/api/auth/me",               "Lấy thông tin phiên người dùng hiện tại"),
            ("POST",  "/api/auth/change-password",  "Đổi mật khẩu cá nhân"),
            ("GET",   "/api/users",                 "Danh sách tài khoản nhân viên (ADMIN)"),
            ("POST",  "/api/users",                 "Tạo tài khoản nhân viên mới (ADMIN)"),
            ("PUT",   "/api/users/:id",             "Cập nhật vai trò / thông tin nhân viên (ADMIN)"),
            ("PATCH", "/api/users/:id/toggle-lock", "Khóa / Mở khóa tài khoản khẩn cấp (ADMIN)"),
        ]),
        ("22.2  Hồ sơ cửa hàng duy nhất (StoreProfile – Rule 1)", [
            ("GET", "/api/store-profile", "Lấy cấu hình cửa hàng RETAIL-STORE-01"),
            ("PUT", "/api/store-profile", "Cập nhật thông số & trạng thái cửa hàng (ADMIN / STORE_MANAGER)"),
        ]),
        ("22.3  Danh mục FMCG & Sản phẩm (Catalog & Rule 9)", [
            ("GET",    "/api/catalog/categories",   "Danh sách ngành hàng FMCG & nhà cung cấp DC"),
            ("GET",    "/api/catalog/products",     "Danh sách sản phẩm kèm tổng tồn kho khả dụng"),
            ("POST",   "/api/catalog/products",     "Thêm sản phẩm mới – kiểm tra chống trùng >= 85%"),
            ("PUT",    "/api/catalog/products/:id", "Cập nhật thông tin & giá sản phẩm"),
            ("DELETE", "/api/catalog/products/:id", "Ngừng kinh doanh sản phẩm (nếu không còn lô tồn)"),
        ]),
        ("22.4  Lô hàng, Tiếp nhận DC, Cảnh báo 3 màu, Quick Markdown & Đảo kệ", [
            ("GET",   "/api/batches",                    "Danh sách lô hàng kèm DaysLeft, % RSL & Vùng màu"),
            ("GET",   "/api/batches/evaluate-alerts",    "Đồng bộ lô hết hạn & phân nhóm cảnh báo Xanh/Vàng/Đỏ"),
            ("POST",  "/api/batches/receive-inbound",    "Tiếp nhận lô hàng từ DC (kiểm chuẩn RSL >= 70%)"),
            ("POST",  "/api/batches/reject-inbound",     "Lập biên bản từ chối nhận hàng DC (khi RSL < 70%)"),
            ("PATCH", "/api/batches/:id/markdown",       "Kích hoạt Quick Markdown (0%, 15%, 30%, 40%, 50%)"),
            ("PATCH", "/api/batches/:id/rotate-shelf",   "Xác nhận hoàn tất SOP 5 bước đảo kệ mặt tiền"),
        ]),
        ("22.5  Bán lẻ POS FEFO (Sales)", [
            ("POST", "/api/sales", "Thanh toán giỏ hàng POS – tự động bẻ lô trừ kho FEFO"),
            ("GET",  "/api/sales", "Lịch sử giao dịch bán lẻ POS kèm chi tiết lô đã xuất"),
        ]),
        ("22.6  Tiêu hủy & Sổ hao hụt tài chính (Spoilage – Rule 6)", [
            ("GET",  "/api/spoilage",             "Danh sách biên bản tiêu hủy & thống kê Sổ hao hụt"),
            ("POST", "/api/spoilage",             "Lập biên bản tiêu hủy hàng hỏng / quá hạn"),
            ("POST", "/api/spoilage/:id/approve", "Cửa hàng trưởng phê duyệt & chốt Sổ hao hụt (SoD)"),
        ]),
        ("22.7  Dự báo ROP & Đơn đặt hàng DC (Forecast & Purchase Orders – Rule 8)", [
            ("GET",   "/api/forecast/rop",                        "Tính dự báo ROP, DOS, DUE theo Thời tiết & Lễ Tết"),
            ("GET",   "/api/forecast/purchase-orders",            "Danh sách đơn đặt hàng bổ sung gửi DC"),
            ("POST",  "/api/forecast/purchase-orders",            "Tạo đơn đặt hàng PO mới gửi Kho tổng DC"),
            ("PATCH", "/api/forecast/purchase-orders/:id/status", "Cập nhật trạng thái PO (APPROVED/SUBMITTED/DELIVERED)"),
        ]),
        ("22.8  Dashboard, Bàn giao ca & Nhật ký kiểm toán", [
            ("GET",  "/api/dashboard/overview", "Tổng hợp 6 KPI, Biểu đồ, Top 5 & Action Board 4 Tab"),
            ("GET",  "/api/shift-handover",     "Lấy dữ liệu đối soát ca trực & lịch sử bàn giao ca"),
            ("POST", "/api/shift-handover",     "Ký xác nhận Biên bản bàn giao ca trực điện tử 4 bước"),
            ("GET",  "/api/audit-logs",         "Tra cứu Nhật ký kiểm toán hệ thống bất biến (Rule 11)"),
        ]),
    ]
    for group_title, endpoints in api_groups:
        sub(doc, group_title)
        mk_table(doc,
            ["Method", "Endpoint", "Mục đích nghiệp vụ"],
            [[m, e, d] for m, e, d in endpoints],
            [0.8, 2.7, 3.2])

    # ════════════════════════════════════════════════════════════════════════
    # 23. GIAO DIỆN FRONTEND
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 23, "Giao diện Frontend đã triển khai")
    screens = [
        ("23.1  Trang đăng nhập riêng (/login – LoginView.jsx)",
         "• Form đăng nhập bảo mật bằng Username & Password, hỗ trợ hiển thị cảnh báo khóa Brute-Force.\n"
         "• Tích hợp 4 thẻ 'Đăng nhập nhanh Demo (1-Click)' cho 4 vai trò: ADMIN, STORE_MANAGER, CASHIER, WAREHOUSE_STAFF.\n"
         "• Tự động điều hướng thông minh về đúng màn hình chức năng chính của từng vai trò sau đăng nhập."),
        ("23.2  Dashboard tổng quan điều hành (DashboardView.jsx)",
         "• 6 Thẻ KPI tài chính & vận hành + Chỉ số Tỷ lệ tuân thủ FEFO %.\n"
         "• Biểu đồ phân bổ hạn dùng 3 cấp màu (Xanh / Vàng / Đỏ / Đã hết hạn) và xu hướng doanh thu – hao hụt.\n"
         "• Hai bảng xếp hạng song song: Top 5 Sản phẩm Bán chạy nhất & Top 5 Sản phẩm Hao hụt cao nhất.\n"
         "• Shift Action Board 4 Tab khẩn cấp: (1) Lô Đỏ cần Markdown, (2) Lô cần đảo kệ, (3) Lô hết hạn chờ hủy, (4) Chạm ngưỡng ROP."),
        ("23.3  Quầy thu ngân bán lẻ POS (PosCheckoutView.jsx)",
         "• Kiểm tra trạng thái cửa hàng OPEN; hỗ trợ quét Barcode / tìm nhanh SKU.\n"
         "• Hiển thị trực tiếp dự kiến bẻ lô FEFO (FEFO Allocation Preview) và giá giảm Quick Markdown ngay trong giỏ hàng.\n"
         "• Bộ chọn ngữ cảnh Thời tiết (Bình thường / Nắng nóng / Mưa lớn) và Cờ Ngày lễ.\n"
         "• Biên lai thanh toán in chi tiết từng lô đã bóc tách (batch_code, số lượng, đơn giá)."),
        ("23.4  Giám sát hạn dùng, Quick Markdown & Đảo kệ (ExpiryMonitorView.jsx)",
         "• Bảng giám sát toàn bộ lô hàng kèm thanh tiến trình % RSL và huy hiệu đếm ngược DaysLeft.\n"
         "• Nút chọn nhanh Quick Markdown (15%, 30%, 40%, 50%, Khôi phục 0%) cho Cửa hàng trưởng.\n"
         "• Modal tương tác Quy trình SOP 5 bước đảo kệ mặt tiền cho Nhân viên kho."),
        ("23.5  Tiếp nhận hàng từ Kho tổng DC (DcIntakeView.jsx)",
         "• Tích hợp bộ chọn Đơn đặt hàng PO đã duyệt để tự động điền thông tin mặt hàng.\n"
         "• Máy tính RSL_inbound tự động: Xanh nếu >= 70%, Đỏ và khóa cứng nút Lưu nếu < 70%.\n"
         "• Nút 'Lập Biên Bản Từ Chối Nhận Hàng DC' khi phát hiện hàng giao đến vi phạm chuẩn RSL < 70%."),
        ("23.6  Tiêu hủy & Sổ hao hụt tài chính (SpoilageLogView.jsx)",
         "• Bảng Sổ hao hụt tài chính bất biến hiển thị rõ Người lập đề xuất, Người phê duyệt và trạng thái Đã chốt sổ / Chờ duyệt.\n"
         "• Nút 'Phê duyệt & Chốt sổ' dành riêng cho STORE_MANAGER / ADMIN."),
        ("23.7  Dự báo nhu cầu ROP & Đơn đặt hàng DC (ReorderPredictorView.jsx & PurchaseOrdersSubView.jsx)",
         "• Thanh mô phỏng ngoại cảnh tương tác: Chọn Thời tiết (NORMAL / SUNNY / RAINY) và bật/tắt Cờ Ngày lễ (+30%).\n"
         "• Hiển thị công thức d0 x W x H -> d_adj, dòng giải thích '🤖 AI: ...', điểm đặt hàng ROP và cảnh báo ứ đọng DOS > DUE.\n"
         "• Quản lý trọn vòng đời Đơn đặt hàng PO: DRAFT -> APPROVED -> SUBMITTED -> DELIVERED."),
        ("23.8  Bàn giao ca trực 4 bước & Nhật ký kiểm toán (ShiftHandoverView.jsx & AuditLogView.jsx)",
         "• Giao diện 4 bước bàn giao ca trực điện tử kèm thẻ 'Mục 15.2 – Quy định trách nhiệm và chế tài kỷ luật'.\n"
         "• Trang tra cứu Nhật ký kiểm toán bất biến (AuditLogs) có bộ lọc theo hành động, nhân viên và thời gian."),
    ]
    for title, desc in screens:
        sub(doc, title)
        body(doc, desc)

    # ════════════════════════════════════════════════════════════════════════
    # 24. QUY TẮC NGHIỆP VỤ QUAN TRỌNG (11 CORE BUSINESS RULES)
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 24, "Quy chuẩn 11 Quy tắc Nghiệp vụ Cốt lõi (11 Core Business Rules)")
    rules = [
        ("Rule 1 – Chỉ có một cửa hàng bán lẻ duy nhất",
         "Bảng StoreProfile chỉ có 1 bản ghi duy nhất (RETAIL-STORE-01 – Cửa hàng Bán lẻ Tiện lợi LHU Mart). Toàn bộ hàng hóa, giao dịch POS, sổ hao hụt và dự báo ROP mặc định gắn với cửa hàng này."),
        ("Rule 2 – FEFO tuyệt đối trong mọi giao dịch bán lẻ",
         "Hệ thống luôn tự động chọn các lô có hạn sử dụng gần nhất (expiry_date ASC, id ASC) để xuất kho trước và tự động bẻ đơn qua nhiều lô nếu cần. Thu ngân không thể tự ý chọn lô thủ công."),
        ("Rule 3 – Chống tồn kho âm tại mọi thời điểm",
         "Số lượng tồn hiện tại của lô hàng (current_quantity) luôn >= 0, được bảo vệ bằng ràng buộc CHECK và SQL Transaction có khóa dòng WITH (UPDLOCK, ROWLOCK)."),
        ("Rule 4 – Kiểm soát hạn sử dụng theo 3 ngưỡng cảnh báo màu",
         "Vùng Xanh (DaysLeft > WarningDays: bán nguyên giá), Vùng Vàng (3 < DaysLeft <= WarningDays: giảm 15%–30%, đảo kệ mặt tiền), Vùng Đỏ (0 < DaysLeft <= 3: giảm kịch sàn 40%–50%, gom xả trong ngày)."),
        ("Rule 5 – Tự động khóa cứng bán lô hàng đã hết hạn",
         "Bất kỳ lô hàng nào có DaysLeft <= 0 đều tự động chuyển trạng thái EXPIRED và bị khóa cứng tuyệt đối trên quầy bán lẻ POS."),
        ("Rule 6 – Hủy hàng phải gắn liền với Sổ hao hụt tài chính bất biến",
         "Mọi số lượng hàng hóa rút khỏi kệ do hư hỏng hoặc quá hạn đều phải lập biên bản tiêu hủy, có Cửa hàng trưởng phê duyệt (SoD), tính chính xác CostLoss = QuantityDisposed * ImportPrice và lưu vào SpoilageRecords."),
        ("Rule 7 – Kiểm tra hạn sử dụng tối thiểu khi tiếp nhận từ DC",
         "Hàng nhận từ Kho tổng DC Biên Hòa phải đạt tối thiểu 70% vòng đời chuẩn (RSL_inbound >= 70%). Nếu nhỏ hơn 70%, hệ thống khóa nút lưu và yêu cầu lập biên bản từ chối nhận hàng."),
        ("Rule 8 – Dự báo ROP tích hợp đa yếu tố ngoại cảnh",
         "Điểm đặt hàng ROP = (d_adjusted * LeadTime) + SafetyStock tự động điều chỉnh theo tốc độ bán 14 ngày, hệ số thời tiết (W_factor), ngày lễ (H_factor) và cảnh báo nguy cơ ứ đọng DOS > DUE."),
        ("Rule 9 – Chống tạo trùng hoặc gần trùng sản phẩm",
         "Hệ thống tự động chuẩn hóa chuỗi tiếng Việt để chặn tạo trùng mã SKU hoặc tên sản phẩm có độ tương đồng >= 85%."),
        ("Rule 10 – Kích hoạt xả hàng Quick Markdown và đảo kệ mặt tiền",
         "Chính sách giảm giá Quick Markdown (15%, 30%, 40%, 50%) có hiệu lực tức thì tại POS; quy trình đảo kệ mặt tiền gồm 5 bước SOP có xác nhận điện tử."),
        ("Rule 11 – Nhật ký kiểm toán bất biến (Immutable Audit Trail)",
         "Toàn bộ nghiệp vụ đăng nhập, tiếp nhận/từ chối hàng DC, bán lẻ POS, đổi mức giảm giá, đảo kệ, lập/duyệt tiêu hủy, tạo/duyệt đơn PO, bàn giao ca và phân quyền đều ghi bất biến vào AuditLogs."),
    ]
    for title, desc in rules:
        sub(doc, title)
        body(doc, desc)

    # ════════════════════════════════════════════════════════════════════════
    # 25. GIAO DỊCH SQL SERVER DÙNG TRANSACTION
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 25, "Giao dịch SQL Server cần dùng Transaction")
    body(doc, "Các nghiệp vụ bắt buộc thực thi trong SQL Server Transaction để bảo đảm tính toàn vẹn ACID:")
    bul(doc, [
        "1. Xuất bán lẻ tại quầy POS tự động bẻ nhiều lô theo FEFO",
        "2. Tiếp nhận lô hàng mới từ Kho tổng DC và cập nhật trạng thái đơn PO",
        "3. Phê duyệt tiêu hủy hàng hỏng & chốt Sổ hao hụt tài chính",
        "4. Kích hoạt giảm giá xả hàng Quick Markdown và xác nhận đảo kệ",
    ])
    code(doc,
        "BEGIN TRANSACTION [Tran_POS_Checkout_FEFO];\n"
        "BEGIN TRY\n"
        "    -- 1. Khóa các dòng lô hàng liên quan (UPDLOCK, ROWLOCK) chống Race Condition\n"
        "    SELECT id, batch_code, current_quantity, expiry_date, import_price, discount_percent\n"
        "    FROM   batches WITH (UPDLOCK, ROWLOCK)\n"
        "    WHERE  product_id = @productId\n"
        "      AND  status IN ('ACTIVE', 'WARNING')\n"
        "      AND  DATEDIFF(day, CAST(GETDATE() AS DATE), expiry_date) > 0\n"
        "      AND  current_quantity > 0\n"
        "    ORDER BY expiry_date ASC, id ASC;\n\n"
        "    -- 2. Kiểm tra tổng tồn khả dụng >= số lượng khách mua\n"
        "    -- 3. Khấu trừ current_quantity theo thứ tự FEFO (tự bẻ qua nhiều lô nếu cần)\n"
        "    -- 4. INSERT vào sales_history đích danh theo từng lô đã bóc tách\n"
        "    -- 5. INSERT vào system_audit_logs (action_type = 'POS_CHECKOUT_FEFO')\n"
        "    COMMIT TRANSACTION [Tran_POS_Checkout_FEFO];\n"
        "END TRY\n"
        "BEGIN CATCH\n"
        "    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION [Tran_POS_Checkout_FEFO];\n"
        "    THROW;\n"
        "END CATCH;")

    # ════════════════════════════════════════════════════════════════════════
    # 26. PHIÊN BẢN MVP & LỘ TRÌNH AGILE SCRUM
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 26, "Phiên bản MVP & Kết quả triển khai Agile Scrum")
    body(doc,
        "Dự án được triển khai theo mô hình Agile Scrum qua 4 Sprint (tương ứng 6 Phần chức năng từ "
        "Mục 4 đến Mục 15 của đặc tả) và đã hoàn thành 100% toàn bộ hạng mục:")

    mk_table(doc,
        ["Sprint / Giai đoạn", "Mục tiêu trọng tâm", "Hạng mục bàn giao thực tế (Deliverables)", "Trạng thái"],
        [
            ["Sprint 1\n(Phần 1 & 2)",
             "Nền tảng CSDL, RBAC, StoreProfile & Danh mục",
             "DDL 13 bảng SQL Server LocalDB, Trang /login riêng + 4 vai trò RBAC, StoreProfile (RETAIL-STORE-01), Danh mục FMCG & chống trùng SP >= 85% (Rule 1, 9).",
             "Hoàn thành 100% ✓"],
            ["Sprint 2\n(Phần 3 & 4)",
             "Tiếp nhận DC & Bán lẻ POS FEFO bẻ lô",
             "Tiếp nhận hàng DC kiểm chuẩn RSL >= 70%, Biên bản từ chối DC, Bán lẻ POS tự động trừ kho FEFO & bẻ đơn đa lô, khóa cứng hàng hết hạn (Rule 2, 3, 5, 7).",
             "Hoàn thành 100% ✓"],
            ["Sprint 3\n(Phần 5)",
             "Cảnh báo 3 màu, Quick Markdown, Đảo kệ & Sổ hao hụt",
             "Giám sát HSD 3 cấp màu, Quick Markdown (15%/30%/40%/50%), SOP 5 bước đảo kệ mặt tiền, Sổ hao hụt tài chính tách biệt Lập – Duyệt (Rule 4, 6, 10, 11).",
             "Hoàn thành 100% ✓"],
            ["Sprint 4\n(Phần 6)",
             "Dự báo ROP ngoại cảnh, PO, Dashboard 6 KPI & Giao ca",
             "Dự báo ROP tích hợp Thời tiết/Ngày lễ & cảnh báo DOS > DUE, Đơn PO gửi DC, Dashboard 6 KPI + Top 5 + 4-Tab Action Board, Bàn giao ca 4 bước (Rule 8).",
             "Hoàn thành 100% ✓"],
        ],
        [1.2, 1.8, 3.0, 1.2])

    body(doc, "Định hướng mở rộng trong tương lai (Future Enhancements):")
    bul(doc, [
        "1. Tích hợp đầu đọc mã vạch 2D GS1 DataBar phần cứng tự động tách mã lô và hạn dùng khi quét",
        "2. Kết nối API thời tiết tự động thời gian thực (OpenWeatherMap API) tại khu vực TP. Biên Hòa",
        "3. Tích hợp máy in tem nhãn nhiệt di động (Bluetooth Thermal Label Printer) để in tem Quick Markdown tại kệ",
        "4. Xây dựng ứng dụng di động (PWA / React Native) hỗ trợ nhân viên kho kiểm kệ và quét date bằng camera",
    ])

    # ════════════════════════════════════════════════════════════════════════
    # 27. KẾT LUẬN ĐẶC TẢ
    # ════════════════════════════════════════════════════════════════════════
    sec(doc, 27, "Kết luận đặc tả")
    body(doc,
        "Website Quản lý Chuỗi cung ứng Bán lẻ Chống lãng phí (Supply Chain Spoilage Predictor) là "
        "nền tảng quản trị khép kín cho mô hình một cửa hàng bán lẻ tinh gọn duy nhất (Cửa hàng Bán lẻ "
        "Tiện lợi LHU Mart – RETAIL-STORE-01) liên kết trực tiếp với Trung tâm Phân phối Kho tổng DC Biên Hòa.")
    body(doc, "Chu trình nghiệp vụ khép kín của hệ thống:")
    code(doc,
        "Nhập hàng từ Kho tổng DC Biên Hòa (Kiểm chuẩn RSL_inbound >= 70%)\n"
        "  -> Lưu kho & Giám sát hạn dùng theo 3 vùng màu (Xanh / Vàng / Đỏ)\n"
        "  -> Cận date: Kích hoạt giảm giá Quick Markdown (15%–50%) & SOP 5 bước đảo kệ mặt tiền\n"
        "  -> Bán lẻ tại quầy POS: Xuất kho tự động theo FEFO (tự động bẻ lô, chống tồn kho âm)\n"
        "  -> Quá hạn / Hư hỏng: Tự động khóa bán POS & Phê duyệt tiêu hủy ghi Sổ hao hụt tài chính\n"
        "  -> Dự báo nhu cầu ROP (Tốc độ bán 14 ngày + Thời tiết + Ngày lễ) & Đề xuất đơn PO gửi DC\n"
        "  -> Đối soát & Ký nhận Bàn giao ca trực điện tử 4 bước kèm Nhật ký kiểm toán bất biến.")
    body(doc,
        "Đặc tả này đóng vai trò là Nguồn Chân Lý Duy Nhất (Single Source of Truth – SSOT), đồng bộ 100% "
        "giữa tài liệu thuyết minh, thiết kế cơ sở dữ liệu Microsoft SQL Server LocalDB (13 bảng 3NF), "
        "kiến trúc Clean Architecture 4 tầng và giao diện phần mềm thực tế, phục vụ báo cáo và bảo vệ "
        "đồ án của nhóm sinh viên Đỗ Tấn Du (123001364) và Đoàn Minh Quân (123000946) dưới sự hướng dẫn "
        "khoa học của ThS. Lê Minh Nhật – Khoa Công nghệ Thông tin, Trường Đại học Lạc Hồng.")

    # ── Chữ ký ─────────────────────────────────────────────────────────────
    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(24)
    r_sig = p_sig.add_run(
        "TP. Biên Hòa, tháng 10 năm 2026\n"
        "NHÓM SINH VIÊN THỰC HIỆN\n\n\n"
        "Đỗ Tấn Du  (123001364)                     Đoàn Minh Quân  (123000946)"
    )
    r_sig.font.bold = True
    r_sig.font.size = Pt(10.5)
    r_sig.font.color.rgb = RGBColor(10, 60, 130)
    p_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    # ── Lưu file ──────────────────────────────────────────────────────────
    out_path = r"c:\thuyet minh\Docs\Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx"
    doc.save(out_path)
    size = os.path.getsize(out_path)
    print(f"SUCCESS  ->  {out_path}")
    print(f"Paragraphs: {len(doc.paragraphs)}  |  Tables: {len(doc.tables)}  |  Size: {size:,} bytes")

    # Đồng bộ bản sao vào thư mục Word_Documents
    word_docs_dir = r"c:\thuyet minh\Docs\Word_Documents"
    if os.path.isdir(word_docs_dir):
        mirror_path = os.path.join(
            word_docs_dir,
            "Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.docx"
        )
        shutil.copy2(out_path, mirror_path)
        print(f"MIRRORED ->  {mirror_path}")

if __name__ == "__main__":
    build()
