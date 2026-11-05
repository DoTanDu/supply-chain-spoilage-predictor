# -*- coding: utf-8 -*-
"""
SƠ ĐỒ KIẾN TRÚC HỆ THỐNG CLEAN ARCHITECTURE 4 TẦNG (LIGHT MODE - RÕ NÉT TRÊN MÁY CHIẾU)
HỆ THỐNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ (SMARTSUPPLY AI)
Đại học Lạc Hồng (LHU) - GVHD: ThS. Lê Minh Nhật
Sinh viên: Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946)
"""

import sys
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Circle

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

plt.rcParams['font.sans-serif'] = ['Segoe UI', 'Arial', 'Tahoma', 'Calibri']
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['axes.unicode_minus'] = False

def draw_clean_architecture():
    fig, ax = plt.subplots(figsize=(40, 26), dpi=240)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    bg_color = '#F8FAFC'
    fig.patch.set_facecolor(bg_color)
    ax.set_facecolor(bg_color)

    # =========================================================================
    # 1. TIÊU ĐỀ SƠ ĐỒ VÀ HEADER BANNER (LIGHT MODE)
    # =========================================================================
    header_box = FancyBboxPatch((2.0, 92.5), 96.0, 6.2, boxstyle="round,pad=0.3,rounding_size=0.8",
                               facecolor='#FFFFFF', edgecolor='#2563EB', linewidth=2.4)
    ax.add_patch(header_box)

    ax.text(50.0, 96.6, "SƠ ĐỒ KIẾN TRÚC HỆ THỐNG CLEAN ARCHITECTURE 4 TẦNG & QUY TẮC PHỤ THUỘC",
            ha='center', va='center', fontsize=21, fontweight='bold', color='#0F172A')
    ax.text(50.0, 94.2, "Hệ thống Quản lý Chuỗi Cung ứng Thực phẩm Thông minh Ứng dụng AI (SmartSupply AI) | Dependency Rule: Phụ thuộc một chiều hướng tâm",
            ha='center', va='center', fontsize=12.5, fontweight='bold', color='#1D4ED8')

    # =========================================================================
    # 2. KHU VỰC BÊN TRÁI: 4 TẦNG VÒNG TRÒN ĐỒNG TÂM (x = 2.0 đến 48.5)
    # =========================================================================
    left_container = FancyBboxPatch((2.0, 3.0), 46.5, 87.5, boxstyle="round,pad=0.3,rounding_size=0.8",
                                   facecolor='#FFFFFF', edgecolor='#CBD5E1', linewidth=1.8)
    ax.add_patch(left_container)

    ax.text(25.25, 88.2, "1. MÔ HÌNH VÒNG TRÒN ĐỒNG TÂM CLEAN ARCHITECTURE",
            ha='center', va='center', fontsize=13.5, fontweight='bold', color='#1E3A8A')
    ax.text(25.25, 86.2, "(Quy tắc phụ thuộc: Tầng ngoài phụ thuộc tầng trong | Lõi Domain độc lập hoàn toàn)",
            ha='center', va='center', fontsize=9.8, fontstyle='italic', color='#475569')

    center_x, center_y = 25.25, 48.0

    # Vòng 4: Frameworks & Drivers (Nền hồng nhạt, viền đỏ đậm)
    c4 = Circle((center_x, center_y), 20.0, facecolor='#FFF1F2', edgecolor='#E11D48', linewidth=2.6, zorder=2)
    ax.add_patch(c4)
    # Vòng 3: Interface Adapters (Nền xanh ngọc nhạt, viền xanh lá đậm)
    c3 = Circle((center_x, center_y), 15.0, facecolor='#ECFDF5', edgecolor='#059669', linewidth=2.6, zorder=3)
    ax.add_patch(c3)
    # Vòng 2: Application Business Rules (Use Cases - Nền xanh chàm nhạt, viền chàm đậm)
    c2 = Circle((center_x, center_y), 10.0, facecolor='#EEF2FF', edgecolor='#4F46E5', linewidth=2.6, zorder=4)
    ax.add_patch(c2)
    # Vòng 1: Enterprise Business Rules (Entities & Domain - Nền tím hồng nhạt, viền tím đậm)
    c1 = Circle((center_x, center_y), 5.2, facecolor='#FDF2F8', edgecolor='#DB2777', linewidth=2.8, zorder=5)
    ax.add_patch(c1)

    # Chữ Lõi Vòng 1 (Domain Core)
    ax.text(center_x, center_y + 1.3, "DOMAIN LAYER", ha='center', va='center',
            fontsize=10.5, fontweight='bold', color='#9D174D', zorder=6)
    ax.text(center_x, center_y - 0.1, "Entities & Value Objects", ha='center', va='center',
            fontsize=8.2, fontweight='bold', color='#0F172A', zorder=6)
    ax.text(center_x, center_y - 1.3, "Domain Policies (FEFO, ROP, AI)", ha='center', va='center',
            fontsize=7.6, fontstyle='italic', color='#BE185D', zorder=6)
    ax.text(center_x, center_y - 2.4, "Repository Ports (Interfaces)", ha='center', va='center',
            fontsize=7.4, color='#334155', zorder=6)

    # Chữ Vòng 2 (Application Layer)
    ax.text(center_x, center_y + 7.8, "APPLICATION LAYER (USE CASES)", ha='center', va='center',
            fontsize=10.2, fontweight='bold', color='#3730A3', zorder=6)
    ax.text(center_x, center_y + 6.5, "ProcessFefoSale | ReceiveDCBatch | DisposeSpoiledGoods", ha='center', va='center',
            fontsize=7.8, fontweight='bold', color='#1E293B', zorder=6)
    ax.text(center_x, center_y - 7.1, "CalculateROPForecast | OptimizeStockTransfer | QuickMarkdown", ha='center', va='center',
            fontsize=7.8, fontweight='bold', color='#1E293B', zorder=6)
    ax.text(center_x, center_y - 8.4, "DTOs, Input/Output Ports & UseCase Interactors", ha='center', va='center',
            fontsize=7.4, fontstyle='italic', color='#4338CA', zorder=6)

    # Chữ Vòng 3 (Interface Adapters)
    ax.text(center_x, center_y + 13.0, "INTERFACE ADAPTERS LAYER", ha='center', va='center',
            fontsize=10.2, fontweight='bold', color='#065F46', zorder=6)
    ax.text(center_x, center_y + 11.7, "REST Controllers (Batch, Sales, Spoilage, Forecast, Store, Audit)", ha='center', va='center',
            fontsize=7.8, fontweight='bold', color='#1E293B', zorder=6)
    ax.text(center_x, center_y - 12.4, "SqlRepositories (SqlBatchRepository, SqlSaleRepository, SqlUserRepository)", ha='center', va='center',
            fontsize=7.8, fontweight='bold', color='#1E293B', zorder=6)
    ax.text(center_x, center_y - 13.7, "Middlewares (JWT Auth, 3-Actor RBAC Role, Input Validation)", ha='center', va='center',
            fontsize=7.4, fontstyle='italic', color='#047857', zorder=6)

    # Chữ Vòng 4 (Frameworks & Drivers)
    ax.text(center_x, center_y + 18.2, "FRAMEWORKS & DRIVERS LAYER (EXTERNALS)", ha='center', va='center',
            fontsize=10.5, fontweight='bold', color='#9F1239', zorder=6)
    ax.text(center_x, center_y + 16.9, "SQL Server LocalDB (retail_spoilage_db - 15 Bảng 3NF) | Express API", ha='center', va='center',
            fontsize=8.0, fontweight='bold', color='#0F172A', zorder=6)
    ax.text(center_x, center_y - 17.3, "React Vite SPA Frontend (100% Light Mode) | LightGBM + Google OR-Tools", ha='center', va='center',
            fontsize=8.0, fontweight='bold', color='#0F172A', zorder=6)
    ax.text(center_x, center_y - 18.6, "External Actor: Trung tâm Phân phối Kho tổng DC Biên Hòa & Chuỗi Cửa hàng", ha='center', va='center',
            fontsize=7.5, fontstyle='italic', color='#BE123C', zorder=6)

    # Mũi tên Dependency Rule hướng tâm
    arrow_opts = dict(arrowstyle="-|>", mutation_scale=16, color='#D97706', linewidth=2.4, zorder=10)
    a1 = patches.FancyArrowPatch((7.5, center_y), (11.5, center_y), **arrow_opts)
    ax.add_patch(a1)
    ax.text(9.5, center_y + 1.3, "Phụ thuộc", ha='center', va='center', fontsize=8.0, fontweight='bold', color='#B45309')

    a2 = patches.FancyArrowPatch((12.0, center_y), (16.0, center_y), **arrow_opts)
    ax.add_patch(a2)

    a3 = patches.FancyArrowPatch((17.0, center_y), (20.5, center_y), **arrow_opts)
    ax.add_patch(a3)

    # Chú thích DIP ở chân Panel Trái
    dip_box = FancyBboxPatch((4.0, 4.5), 42.5, 12.0, boxstyle="round,pad=0.2,rounding_size=0.5",
                             facecolor='#FFFBEB', edgecolor='#D97706', linewidth=1.8)
    ax.add_patch(dip_box)
    ax.text(25.25, 14.8, "NGUYÊN TẮC ĐẢO NGƯỢC PHỤ THUỘC (DEPENDENCY INVERSION PRINCIPLE - DIP)",
            ha='center', va='center', fontsize=9.5, fontweight='bold', color='#92400E')
    dip_text = (
        "• Tầng Domain định nghĩa các Interface (Ports): IBatchRepository, ISaleRepository, IUserRepository...\n"
        "• Tầng Infrastructure (SqlRepositories) kế thừa và hiện thực hóa các Interface này (Adapters).\n"
        "• Tầng Application gọi các Interface mà hoàn toàn KHÔNG phụ thuộc vào cú pháp SQL Server cụ thể.\n"
        "• Kết quả: Dễ dàng mở rộng mô hình AI (LightGBM / OR-Tools) và kiểm thử độc lập từng tầng!"
    )
    ax.text(5.5, 9.8, dip_text, ha='left', va='center', fontsize=8.2, color='#1E293B', linespacing=1.45)

    # =========================================================================
    # 3. KHU VỰC BÊN PHẢI: CHI TIẾT 4 TẦNG & CODEBASE MAPPING (x = 51.5 đến 98.0)
    # =========================================================================
    right_container = FancyBboxPatch((51.5, 3.0), 46.5, 87.5, boxstyle="round,pad=0.3,rounding_size=0.8",
                                    facecolor='#FFFFFF', edgecolor='#CBD5E1', linewidth=1.8)
    ax.add_patch(right_container)

    ax.text(74.75, 88.2, "2. ÁNH XẠ KIẾN TRÚC VÀO CẤU TRÚC MÃ NGUỒN DỰ ÁN THỰC TẾ",
            ha='center', va='center', fontsize=13.5, fontweight='bold', color='#1E3A8A')
    ax.text(74.75, 86.2, "(Triển khai trên Frontend React Vite Light Mode + Backend Node.js + SQL Server 15 Bảng 3NF)",
            ha='center', va='center', fontsize=9.8, fontstyle='italic', color='#475569')

    layer_blocks = [
        {
            'title': 'TẦNG 1: PRESENTATION & CLIENT (GIAO DIỆN SÁNG & REST CONTROLLERS)',
            'sub': 'Frontend SPA (React Vite - 100% Light Mode) & Express REST Controllers (src/presentation/)',
            'color': '#E11D48',
            'bg': '#FFF1F2',
            'pos': (53.5, 68.0, 42.5, 16.5),
            'items': [
                "• Frontend (Vite + React Light Mode): Màn hình POS FEFO, DC Intake RSL>=70%, AI Forecast, Điều chuyển kho",
                "• Controllers: AuthController, CatalogController, BatchController, SalesController, SpoilageController",
                "• Middlewares: authMiddleware (JWT Bearer), roleMiddleware (3 Actors: OWNER, MANAGER, STAFF)",
                "• REST Endpoints: /api/auth, /api/batches, /api/sales, /api/spoilage, /api/forecast, /api/store"
            ]
        },
        {
            'title': 'TẦNG 2: APPLICATION LAYER (USE CASE INTERACTORS & DTO)',
            'sub': 'Quản lý Luồng Nghiệp vụ và Điều phối Tác vụ Ứng dụng (src/application/)',
            'color': '#4F46E5',
            'bg': '#EEF2FF',
            'pos': (53.5, 47.0, 42.5, 17.5),
            'items': [
                "• ProcessFefoSaleUseCase: Nhận giỏ hàng POS, bóc tách lô expiry_date ASC, tự động bẻ đơn qua nhiều lô",
                "• ReceiveDCBatchUseCase: Kiểm định xe tải DC, tính RSL_inbound >= 70%, từ chối nhận nếu cận date",
                "• ApplyQuickMarkdownUseCase: Kích hoạt giảm giá xả hàng (15%, 30%, 40%, 50%), đồng bộ tức thì tại POS",
                "• DisposeSpoiledGoodsUseCase: Duyệt biên bản hủy bất kiêm nhiệm (SoD), hạch toán Sổ hao hụt tài chính",
                "• ForecastAndOptimizationUseCase: Dự báo nhu cầu 7 ngày (LightGBM) & Tối ưu đặt hàng/điều chuyển (OR-Tools)"
            ]
        },
        {
            'title': 'TẦNG 3: DOMAIN LAYER (QUY TẮC NGHIỆP VỤ CỐT LÕI - ENTERPRISE RULES)',
            'sub': 'Trọng tâm Bất biến của Hệ thống - Hoàn toàn Độc lập (src/domain/)',
            'color': '#DB2777',
            'bg': '#FDF2F8',
            'pos': (53.5, 25.0, 42.5, 18.5),
            'items': [
                "• Entities: Product, Batch, StoreProfile (Chuỗi 3-30 cửa hàng), SaleOrder, SpoilageRecord, StockTransfer, User",
                "• Value Objects: ShelfLife (Vòng đời ngày), AlertZone (Xanh/Vàng/Đỏ), Money, WeatherContext (Nắng/Mưa/Lễ)",
                "• Domain Policies & Services:",
                "   - FefoAllocationPolicy: Thuật toán chọn lô xuất kho theo thứ tự ngày hết hạn tăng dần (Rule 2)",
                "   - RopAndAiOptimizationPolicy: Tính ROP & điều phối tồn kho liên cửa hàng bằng OR-Tools (Rule 8)",
                "   - MarkdownPricingPolicy: Ngưỡng giảm giá theo 3 cấp màu cảnh báo date (Rule 4, 10)",
                "• Repository Interfaces (Ports): IBatchRepository, ISaleRepository, ISpoilageRepository, IUserRepository"
            ]
        },
        {
            'title': 'TẦNG 4: INFRASTRUCTURE LAYER (HẠ TẦNG CSDL & AI ENGINE - ADAPTERS)',
            'sub': 'Hiện thực hóa Kết nối SQL Server 3NF và Mô hình AI (src/infrastructure/)',
            'color': '#059669',
            'bg': '#ECFDF5',
            'pos': (53.5, 4.5, 42.5, 17.5),
            'items': [
                "• Database: Microsoft SQL Server LocalDB (retail_spoilage_db) gồm 15 bảng chuẩn 3NF, 36 khóa ngoại FK",
                "• SqlRepositories: SqlBatchRepository, SqlSaleRepository, SqlSpoilageRepository, SqlUserRepository",
                "• Transactions & Concurrency: Ràng buộc khóa hàng UPDLOCK, ROWLOCK chống tồn kho âm (Rule 3)",
                "• Pre-trained AI Engine: Tích hợp mô hình dự báo LightGBM 7 ngày & bộ giải tối ưu Google OR-Tools",
                "• Audit Logger: Lưu vết bất biến mọi thao tác vào bảng system_audit_logs (Rule 11)"
            ]
        }
    ]

    for b in layer_blocks:
        bx, by, bw, bh = b['pos']
        card = FancyBboxPatch((bx, by), bw, bh, boxstyle="round,pad=0.2,rounding_size=0.6",
                              facecolor=b['bg'], edgecolor=b['color'], linewidth=1.8)
        ax.add_patch(card)

        header_badge = FancyBboxPatch((bx, by + bh - 3.2), bw, 3.2, boxstyle="round,pad=0.1,rounding_size=0.4",
                                      facecolor=b['color'], edgecolor=b['color'])
        ax.add_patch(header_badge)

        ax.text(bx + bw / 2, by + bh - 1.15, b['title'], ha='center', va='center',
                fontsize=9.8, fontweight='bold', color='#FFFFFF')
        ax.text(bx + bw / 2, by + bh - 2.35, b['sub'], ha='center', va='center',
                fontsize=7.8, fontstyle='italic', color='#F8FAFC')

        for idx, item in enumerate(b['items']):
            iy = by + bh - 4.4 - idx * 2.1
            ax.text(bx + 1.2, iy, item, ha='left', va='center', fontsize=8.1, color='#0F172A', fontweight='medium')

    # Các mũi tên liên tầng giữa các Block bên phải
    link_opts = dict(arrowstyle="-|>", mutation_scale=15, color='#D97706', linewidth=2.2, zorder=12)
    ax.add_patch(patches.FancyArrowPatch((74.75, 68.0), (74.75, 65.0), **link_opts))
    ax.text(78.5, 66.5, "Gọi UseCase (Controller -> Application)", ha='center', va='center',
            fontsize=7.5, fontweight='bold', color='#92400E',
            bbox=dict(boxstyle="round,pad=0.2", facecolor='#FFFBEB', edgecolor='#D97706', lw=1.0))

    ax.add_patch(patches.FancyArrowPatch((74.75, 47.0), (74.75, 44.0), **link_opts))
    ax.text(78.5, 45.5, "Thực thi Logic Lõi (UseCase -> Domain)", ha='center', va='center',
            fontsize=7.5, fontweight='bold', color='#92400E',
            bbox=dict(boxstyle="round,pad=0.2", facecolor='#FFFBEB', edgecolor='#D97706', lw=1.0))

    ax.add_patch(patches.FancyArrowPatch((74.75, 22.0), (74.75, 25.0), **link_opts))
    ax.text(78.5, 23.5, "Hiện thực hóa Interface (Infra -> Domain DIP)", ha='center', va='center',
            fontsize=7.5, fontweight='bold', color='#92400E',
            bbox=dict(boxstyle="round,pad=0.2", facecolor='#FFFBEB', edgecolor='#D97706', lw=1.0))

    # =========================================================================
    # 4. FOOTER THÔNG TIN ĐỒ ÁN
    # =========================================================================
    ax.text(50.0, 1.0, "Khoa CNTT - Trường Đại học Lạc Hồng (LHU) | Đồ án Tốt nghiệp: SmartSupply AI - Quản trị Chuỗi cung ứng Chống lãng phí | GVHD: ThS. Lê Minh Nhật",
            ha='center', va='center', fontsize=10.5, fontweight='bold', color='#334155')

    output_path = "c:/thuyet minh/Docs/Diagram_Images/clean_architecture.png"
    plt.tight_layout()
    plt.savefig(output_path, format='png', dpi=240, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()

    sys.stdout.buffer.write(f"Đã xuất sơ đồ Clean Architecture (Light Mode) thành công tại: {output_path}\n".encode('utf-8'))

if __name__ == '__main__':
    draw_clean_architecture()
