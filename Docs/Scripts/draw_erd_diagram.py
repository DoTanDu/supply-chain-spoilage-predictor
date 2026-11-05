# -*- coding: utf-8 -*-
"""
SƠ ĐỒ THỰC THỂ QUAN HỆ (ERD - ENTITY RELATIONSHIP DIAGRAM) 15 BẢNG CHUẨN 3NF - TÔNG SÁNG (LIGHT MODE)
Đường nối Orthogonal (Vuông góc chuẩn SSMS Database Diagram - Tuyệt đối không cắt qua thân bảng)
RDBMS: Microsoft SQL Server LocalDB (retail_spoilage_db)
"""

import sys
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

plt.rcParams['font.sans-serif'] = ['Segoe UI', 'Arial', 'Tahoma', 'Calibri']
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['axes.unicode_minus'] = False

def draw_erd():
    fig, ax = plt.subplots(figsize=(44, 30), dpi=220)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    bg_color = '#F8FAFC'
    fig.patch.set_facecolor(bg_color)
    ax.set_facecolor(bg_color)

    # =========================================================================
    # 1. TIÊU ĐỀ SƠ ĐỒ VÀ HEADER BANNER (TÔNG SÁNG SẮC NÉT)
    # =========================================================================
    header_box = FancyBboxPatch((2.0, 93.4), 96.0, 5.4, boxstyle="round,pad=0.25,rounding_size=0.6",
                               facecolor='#FFFFFF', edgecolor='#1E40AF', linewidth=2.4, zorder=5)
    ax.add_patch(header_box)

    ax.text(50.0, 96.9, "SƠ ĐỒ THỰC THỂ QUAN HỆ CƠ SỞ DỮ LIỆU CHUẨN 3NF (ERD - 15 BẢNG & 36 KHÓA NGOẠI)",
            ha='center', va='center', fontsize=21, fontweight='bold', color='#1E3A8A', zorder=6)
    ax.text(50.0, 94.6, "Hệ thống SmartSupply AI (Chuỗi 3–30 Cửa hàng · Dự báo LightGBM · Điều phối OR-Tools) | RDBMS: SQL Server (retail_spoilage_db)",
            ha='center', va='center', fontsize=12.5, fontweight='bold', color='#475569', zorder=6)

    # =========================================================================
    # 2. BANNER TIÊU ĐỀ 4 CỘT PHÂN HỆ (Để khe hở rộng 3.6 đơn vị giữa các cột cho đường nối Orthogonal)
    # Cột 1: x = 2.0..23.0 (w=21.0) | Khe 1-2: 23.0..26.6
    # Cột 2: x = 26.6..47.6 (w=21.0) | Khe 2-3: 47.6..52.4
    # Cột 3: x = 52.4..73.4 (w=21.0) | Khe 3-4: 73.4..77.0
    # Cột 4: x = 77.0..98.0 (w=21.0)
    # =========================================================================
    col_banners = [
        (2.0, 90.0, 21.0, "PHÂN HỆ 1: NHÀ CUNG CẤP, ĐẶT HÀNG & NHẬP KHO", '#D97706', '#FFFBEB'),
        (26.6, 90.0, 21.0, "PHÂN HỆ 2: SẢN PHẨM, DỰ BÁO AI & ĐIỀU PHỐI", '#0284C7', '#F0F9FF'),
        (52.4, 90.0, 21.0, "PHÂN HỆ 3: LÔ HÀNG FEFO, BÁN LẺ POS & HỦY HÀNG", '#6D28D9', '#F5F3FF'),
        (77.0, 90.0, 21.0, "PHÂN HỆ 4: CHUỖI CỬA HÀNG, 3 ACTOR & KIỂM TOÁN", '#1D4ED8', '#EFF6FF')
    ]
    for bx, by, bw, btitle, bcol, bfill in col_banners:
        patch = FancyBboxPatch((bx, by), bw, 2.3, boxstyle="round,pad=0.1,rounding_size=0.35",
                               facecolor=bfill, edgecolor=bcol, linewidth=1.8, zorder=5)
        ax.add_patch(patch)
        ax.text(bx + bw / 2, by + 1.15, btitle, ha='center', va='center',
                fontsize=9.2, fontweight='bold', color=bcol, zorder=6)

    # =========================================================================
    # 3. ĐỊNH NGHĨA 15 BẢNG CHUẨN 3NF (KHỚP 100% VỚI SSMS)
    # =========================================================================
    tables = {
        # --- CỘT 1: x = 2.0, w = 21.0 ---
        'suppliers': {
            'name': 'suppliers',
            'sub': 'Kho tổng DC & Nhà cung cấp',
            'domain': 'CUNG ỨNG',
            'color': '#D97706',
            'pos': (2.0, 70.5, 21.0, 18.0),
            'cols': [
                ('id', 'INT IDENTITY(1,1)', 'PK'),
                ('code', 'NVARCHAR(50)', 'UQ'),
                ('name', 'NVARCHAR(200)', ''),
                ('contact_name', 'NVARCHAR(100)', ''),
                ('phone', 'NVARCHAR(50)', ''),
                ('lead_time_days', 'INT (Default = 1)', ''),
                ('is_active', 'BIT (Default = 1)', '')
            ]
        },
        'purchase_orders': {
            'name': 'purchase_orders',
            'sub': 'Đơn đặt hàng bổ sung gửi DC/NCC',
            'domain': 'ĐẶT HÀNG NHẬP',
            'color': '#B45309',
            'pos': (2.0, 47.0, 21.0, 20.5),
            'cols': [
                ('id', 'INT IDENTITY(1,1)', 'PK'),
                ('order_code', 'NVARCHAR(50)', 'UQ'),
                ('store_id', 'INT -> store_profile(id)', 'FK'),
                ('supplier_id', 'INT -> suppliers(id)', 'FK'),
                ('created_by', 'INT -> users(id)', 'FK'),
                ('approved_by', 'INT -> users(id)', 'FK'),
                ('status', 'NVARCHAR(30)', 'CK'),
                ('total_estimated_cost', 'DECIMAL(14,2)', ''),
                ('expected_delivery_date', 'DATE', '')
            ]
        },
        'purchase_order_items': {
            'name': 'purchase_order_items',
            'sub': 'Chi tiết mặt hàng đặt nhập',
            'domain': 'CHI TIẾT PO',
            'color': '#92400E',
            'pos': (2.0, 26.0, 21.0, 18.0),
            'cols': [
                ('id', 'INT IDENTITY(1,1)', 'PK'),
                ('order_id', 'INT -> purchase_orders(id)', 'FK'),
                ('product_id', 'INT -> products(id)', 'FK'),
                ('current_stock_at_order', 'INT', ''),
                ('suggested_quantity', 'INT', ''),
                ('approved_quantity', 'INT', ''),
                ('unit_cost', 'DECIMAL(12,2)', '')
            ]
        },
        'goods_receipts': {
            'name': 'goods_receipts',
            'sub': 'Phiếu tiếp nhận hàng vào kho',
            'domain': 'PHIẾU NHẬP KHO',
            'color': '#EA580C',
            'pos': (2.0, 3.5, 21.0, 19.5),
            'cols': [
                ('id', 'INT IDENTITY(1,1)', 'PK'),
                ('receipt_number', 'NVARCHAR(50)', 'UQ'),
                ('store_id', 'INT -> store_profile(id)', 'FK'),
                ('purchase_order_id', 'INT -> purchase_orders(id)', 'FK'),
                ('supplier_id', 'INT -> suppliers(id)', 'FK'),
                ('received_by', 'INT -> users(id)', 'FK'),
                ('receipt_date', 'DATE', ''),
                ('total_cost', 'DECIMAL(14,2)', ''),
                ('status', 'NVARCHAR(30)', 'CK')
            ]
        },

        # --- CỘT 2: x = 26.6, w = 21.0 ---
        'categories': {
            'name': 'categories',
            'sub': 'Ngành hàng Thực phẩm & FMCG',
            'domain': 'DANH MỤC',
            'color': '#0D9488',
            'pos': (26.6, 73.5, 21.0, 15.0),
            'cols': [
                ('id', 'INT IDENTITY(1,1)', 'PK'),
                ('code', 'NVARCHAR(50)', 'UQ'),
                ('name', 'NVARCHAR(100)', ''),
                ('default_warning_days', 'INT (Default = 7)', ''),
                ('storage_temperature', 'NVARCHAR(50)', '')
            ]
        },
        'products': {
            'name': 'products',
            'sub': 'Sản phẩm & Định mức hạn dùng',
            'domain': 'SẢN PHẨM',
            'color': '#0284C7',
            'pos': (26.6, 47.0, 21.0, 23.5),
            'cols': [
                ('id', 'INT IDENTITY(1,1)', 'PK'),
                ('sku', 'NVARCHAR(50)', 'UQ'),
                ('name', 'NVARCHAR(200)', ''),
                ('category_id', 'INT -> categories(id)', 'FK'),
                ('default_supplier_id', 'INT -> suppliers(id)', 'FK'),
                ('unit', 'NVARCHAR(20)', ''),
                ('cost_price', 'DECIMAL(12,2)', ''),
                ('selling_price', 'DECIMAL(12,2)', ''),
                ('standard_shelf_life_days', 'INT', ''),
                ('min_stock_level', 'INT', ''),
                ('is_active', 'BIT (Default = 1)', '')
            ]
        },
        'ai_forecasts': {
            'name': 'ai_forecasts',
            'sub': 'Dự báo nhu cầu 7 ngày (LightGBM)',
            'domain': 'AI 1 & AI 2 FORECAST',
            'color': '#4F46E5',
            'pos': (26.6, 25.0, 21.0, 19.0),
            'cols': [
                ('id', 'INT IDENTITY(1,1)', 'PK'),
                ('store_id', 'INT -> store_profile(id)', 'FK'),
                ('product_id', 'INT -> products(id)', 'FK'),
                ('forecast_date', 'DATE', ''),
                ('predicted_sales', 'DECIMAL(10,2)', 'CK'),
                ('lower_bound / upper_bound', 'DECIMAL(10,2)', ''),
                ('spoilage_risk_qty', 'INT (Nguy cơ hủy)', ''),
                ('suggested_order_qty', 'INT (Đề xuất nhập)', ''),
                ('model_name / mae_metric', 'NVARCHAR(50)', '')
            ]
        },
        'stock_transfers': {
            'name': 'stock_transfers',
            'sub': 'Điều phối Dư – Thiếu liên chi nhánh',
            'domain': 'AI 3 OR-TOOLS TRANSFER',
            'color': '#7C3AED',
            'pos': (26.6, 3.5, 21.0, 19.0),
            'cols': [
                ('id', 'INT IDENTITY(1,1)', 'PK'),
                ('transfer_code', 'NVARCHAR(50)', 'UQ'),
                ('from_store_id', 'INT -> store_profile(id)', 'FK'),
                ('to_store_id', 'INT -> store_profile(id)', 'FK'),
                ('product_id', 'INT -> products(id)', 'FK'),
                ('source_batch_id', 'INT -> batches(id)', 'FK'),
                ('transfer_quantity', 'INT (> 0)', 'CK'),
                ('status', 'NVARCHAR(30)', 'CK'),
                ('requested_by / approved_by', 'INT -> users(id)', 'FK')
            ]
        },

        # --- CỘT 3: x = 52.4, w = 21.0 ---
        'batches': {
            'name': 'batches',
            'sub': 'Tồn kho theo Lô & Hạn sử dụng',
            'domain': 'TRỌNG TÂM FEFO',
            'color': '#6D28D9',
            'pos': (52.4, 58.0, 21.0, 30.5),
            'cols': [
                ('id', 'INT IDENTITY(1,1)', 'PK'),
                ('batch_code', 'NVARCHAR(50)', 'UQ'),
                ('store_id', 'INT -> store_profile(id)', 'FK'),
                ('receipt_id', 'INT -> goods_receipts(id)', 'FK'),
                ('product_id', 'INT -> products(id)', 'FK'),
                ('manufacture_date', 'DATE', ''),
                ('expiry_date', 'DATE (> NSX)', 'CK'),
                ('initial_quantity', 'INT', ''),
                ('current_quantity', 'INT (>= 0)', 'CK'),
                ('import_price', 'DECIMAL(12,2)', ''),
                ('discount_percent', 'INT (0-100%)', 'CK'),
                ('is_shelf_rotated', 'BIT', ''),
                ('status', 'NVARCHAR(30)', 'CK')
            ]
        },
        'sales_history': {
            'name': 'sales_history',
            'sub': 'Giao dịch bán hàng POS trừ lô FEFO',
            'domain': 'BÁN HÀNG POS',
            'color': '#059669',
            'pos': (52.4, 29.5, 21.0, 25.0),
            'cols': [
                ('id', 'INT IDENTITY(1,1)', 'PK'),
                ('transaction_code', 'NVARCHAR(50)', ''),
                ('store_id', 'INT -> store_profile(id)', 'FK'),
                ('product_id', 'INT -> products(id)', 'FK'),
                ('batch_id', 'INT -> batches(id)', 'FK'),
                ('cashier_id', 'INT -> users(id)', 'FK'),
                ('quantity_sold', 'INT (> 0)', 'CK'),
                ('sale_price / total_amount', 'DECIMAL(12,2)', ''),
                ('sale_date', 'DATE', ''),
                ('weather / is_holiday', 'NVARCHAR / BIT', '')
            ]
        },
        'spoilage_records': {
            'name': 'spoilage_records',
            'sub': 'Biên bản tiêu hủy & Sổ hao hụt',
            'domain': 'SỔ HAO HỤT RULE 6',
            'color': '#E11D48',
            'pos': (52.4, 3.5, 21.0, 23.0),
            'cols': [
                ('id', 'INT IDENTITY(1,1)', 'PK'),
                ('record_code', 'NVARCHAR(50)', 'UQ'),
                ('store_id', 'INT -> store_profile(id)', 'FK'),
                ('batch_id', 'INT -> batches(id)', 'FK'),
                ('quantity_disposed', 'INT (> 0)', 'CK'),
                ('cost_loss', 'DECIMAL(12,2)', ''),
                ('reason', 'NVARCHAR(30)', 'CK'),
                ('performed_by', 'INT -> users(id)', 'FK'),
                ('approved_by', 'INT -> users(id)', 'FK'),
                ('disposed_date', 'DATE', '')
            ]
        },

        # --- CỘT 4: x = 77.0, w = 21.0 ---
        'roles': {
            'name': 'roles',
            'sub': 'Danh mục Vai trò (OWNER/MANAGER/STAFF)',
            'domain': 'PHÂN QUYỀN RBAC',
            'color': '#2563EB',
            'pos': (77.0, 74.5, 21.0, 14.0),
            'cols': [
                ('id', 'INT IDENTITY(1,1)', 'PK'),
                ('code', 'NVARCHAR(50)', 'UQ'),
                ('name', 'NVARCHAR(100)', ''),
                ('description', 'NVARCHAR(255)', '')
            ]
        },
        'users': {
            'name': 'users',
            'sub': 'Tài khoản Nhân sự Toàn chuỗi',
            'domain': '3 ACTOR USERS',
            'color': '#1D4ED8',
            'pos': (77.0, 48.0, 21.0, 23.5),
            'cols': [
                ('id', 'INT IDENTITY(1,1)', 'PK'),
                ('username', 'NVARCHAR(50)', 'UQ'),
                ('password_hash', 'NVARCHAR(255)', ''),
                ('full_name', 'NVARCHAR(150)', ''),
                ('email / phone', 'NVARCHAR(150)', ''),
                ('role_id', 'INT -> roles(id)', 'FK'),
                ('store_id', 'INT -> store_profile(id)', 'FK'),
                ('is_active', 'BIT (Default = 1)', ''),
                ('last_login', 'DATETIME', '')
            ]
        },
        'store_profile': {
            'name': 'store_profile',
            'sub': 'Danh sách Chi nhánh (Chuỗi 3–30 cửa hàng)',
            'domain': 'CHUỖI CHI NHÁNH',
            'color': '#1E40AF',
            'pos': (77.0, 23.0, 21.0, 22.0),
            'cols': [
                ('id', 'INT IDENTITY(1,1)', 'PK'),
                ('store_code', 'NVARCHAR(50)', 'UQ'),
                ('store_name', 'NVARCHAR(255)', ''),
                ('address / phone', 'NVARCHAR(255)', ''),
                ('manager_id', 'INT -> users(id)', 'FK'),
                ('default_dc_supplier_id', 'INT -> suppliers(id)', 'FK'),
                ('min_inbound_rsl_percent', 'DECIMAL (70%)', ''),
                ('status', 'NVARCHAR(30)', 'CK')
            ]
        },
        'system_audit_logs': {
            'name': 'system_audit_logs',
            'sub': 'Nhật ký Kiểm toán Bất biến (Rule 11)',
            'domain': 'AUDIT TRAIL',
            'color': '#334155',
            'pos': (77.0, 3.5, 21.0, 16.5),
            'cols': [
                ('id', 'BIGINT IDENTITY(1,1)', 'PK'),
                ('user_id', 'INT -> users(id)', 'FK'),
                ('action_type', 'NVARCHAR(100)', ''),
                ('entity_name / entity_id', 'NVARCHAR(100)', ''),
                ('description', 'NVARCHAR(MAX)', ''),
                ('ip_address', 'NVARCHAR(50)', ''),
                ('created_at', 'DATETIME', '')
            ]
        }
    }

    # =========================================================================
    # 4. VẼ 15 BẢNG
    # =========================================================================
    table_anchors = {}

    for t_key, t_info in tables.items():
        x, y, w, h = t_info['pos']
        header_h = 3.2
        body_h = h - header_h

        table_anchors[t_key] = {
            'left': (x, y + h / 2),
            'right': (x + w, y + h / 2),
            'top': (x + w / 2, y + h),
            'bottom': (x + w / 2, y),
            'x': x, 'y': y, 'w': w, 'h': h
        }

        shadow_box = FancyBboxPatch((x + 0.16, y - 0.16), w, h, boxstyle="round,pad=0.1,rounding_size=0.45",
                                    facecolor='#CBD5E1', edgecolor='none', alpha=0.5, zorder=1)
        ax.add_patch(shadow_box)

        table_box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1,rounding_size=0.45",
                                  facecolor='#FFFFFF', edgecolor=t_info['color'], linewidth=1.8, zorder=2)
        ax.add_patch(table_box)

        header_patch = FancyBboxPatch((x, y + body_h), w, header_h, boxstyle="round,pad=0.1,rounding_size=0.4",
                                      facecolor=t_info['color'], edgecolor=t_info['color'], linewidth=1.0, zorder=3)
        ax.add_patch(header_patch)

        ax.text(x + w / 2, y + body_h + 1.95, t_info['name'],
                ha='center', va='center', fontsize=12.2, fontweight='bold', color='#FFFFFF', zorder=4)
        ax.text(x + w / 2, y + body_h + 0.78, f"[{t_info['domain']}] {t_info['sub']}",
                ha='center', va='center', fontsize=8.0, fontweight='bold', color='#F1F5F9', zorder=4)

        col_count = len(t_info['cols'])
        row_h = body_h / max(col_count, 1)

        for i, (col_name, col_type, key_badge) in enumerate(t_info['cols']):
            row_y = y + body_h - (i + 0.5) * row_h

            if i % 2 == 1:
                stripe = patches.Rectangle((x + 0.15, y + body_h - (i + 1) * row_h), w - 0.3, row_h,
                                           facecolor='#F8FAFC', edgecolor='none', zorder=2)
                ax.add_patch(stripe)

            if i > 0:
                ax.plot([x + 0.4, x + w - 0.4], [y + body_h - i * row_h, y + body_h - i * row_h],
                        color='#E2E8F0', linewidth=0.8, zorder=3)

            if key_badge == 'PK':
                badge_bg = FancyBboxPatch((x + 0.55, row_y - 0.62), 1.95, 1.24,
                                         boxstyle="round,pad=0.04,rounding_size=0.18",
                                         facecolor='#F59E0B', edgecolor='#D97706', linewidth=0.8, zorder=4)
                ax.add_patch(badge_bg)
                ax.text(x + 1.52, row_y, "PK", ha='center', va='center', fontsize=7.5, fontweight='bold', color='#FFFFFF', zorder=5)
            elif key_badge == 'FK':
                badge_bg = FancyBboxPatch((x + 0.55, row_y - 0.62), 1.95, 1.24,
                                         boxstyle="round,pad=0.04,rounding_size=0.18",
                                         facecolor='#0284C7', edgecolor='#0369A1', linewidth=0.8, zorder=4)
                ax.add_patch(badge_bg)
                ax.text(x + 1.52, row_y, "FK", ha='center', va='center', fontsize=7.5, fontweight='bold', color='#FFFFFF', zorder=5)
            elif key_badge == 'UQ':
                badge_bg = FancyBboxPatch((x + 0.55, row_y - 0.62), 1.95, 1.24,
                                         boxstyle="round,pad=0.04,rounding_size=0.18",
                                         facecolor='#7C3AED', edgecolor='#6D28D9', linewidth=0.8, zorder=4)
                ax.add_patch(badge_bg)
                ax.text(x + 1.52, row_y, "UQ", ha='center', va='center', fontsize=7.5, fontweight='bold', color='#FFFFFF', zorder=5)
            elif key_badge == 'CK':
                badge_bg = FancyBboxPatch((x + 0.55, row_y - 0.62), 1.95, 1.24,
                                         boxstyle="round,pad=0.04,rounding_size=0.18",
                                         facecolor='#059669', edgecolor='#047857', linewidth=0.8, zorder=4)
                ax.add_patch(badge_bg)
                ax.text(x + 1.52, row_y, "CK", ha='center', va='center', fontsize=7.5, fontweight='bold', color='#FFFFFF', zorder=5)
            else:
                ax.plot(x + 1.52, row_y, marker='o', markersize=3.2, color='#64748B', zorder=4)

            is_key = key_badge in ('PK', 'FK')
            col_color = '#0F172A' if is_key else '#1E293B'
            col_weight = 'bold' if is_key else 'medium'
            ax.text(x + 2.85, row_y, col_name, ha='left', va='center',
                    fontsize=8.3, fontweight=col_weight, color=col_color, zorder=5)

            type_color = '#0369A1' if key_badge == 'FK' else '#475569'
            type_weight = 'bold' if key_badge == 'FK' else 'normal'
            ax.text(x + w - 0.5, row_y, col_type, ha='right', va='center',
                    fontsize=7.6, fontweight=type_weight, color=type_color, zorder=5)

    # =========================================================================
    # 5. VẼ ĐƯỜNG NỐI ORTHOGONAL (VUÔNG GÓC TRONG KHE HỞ GIỮA CÁC BẢNG & CỘT)
    # =========================================================================
    def draw_ortho(points, label="", label_pos=None, color="#0284C7", lw=1.8):
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        ax.plot(xs[:-1], ys[:-1], color=color, linewidth=lw, zorder=8)
        # Vẽ đầu mũi tên ở đoạn cuối cùng
        arrow = patches.FancyArrowPatch(points[-2], points[-1],
                                        arrowstyle="-|>", mutation_scale=15,
                                        color=color, linewidth=lw, zorder=9)
        ax.add_patch(arrow)
        if label and label_pos:
            ax.text(label_pos[0], label_pos[1], label, ha='center', va='center',
                    fontsize=7.6, fontweight='bold', color=color,
                    bbox=dict(boxstyle="round,pad=0.2", facecolor='#FFFFFF', edgecolor=color, lw=1.0),
                    zorder=11)

    # --- Cột 1 thẳng đứng ---
    draw_ortho([(12.5, 70.5), (12.5, 67.5)], "1:N (supplier_id)", (12.5, 69.0), color="#B45309")
    draw_ortho([(12.5, 47.0), (12.5, 44.0)], "1:N (order_id)", (12.5, 45.5), color="#92400E")
    # purchase_orders -> goods_receipts (đi dọc hành lang mép trái x = 0.7)
    draw_ortho([(2.0, 54.0), (0.7, 54.0), (0.7, 15.0), (2.0, 15.0)], "1:N (PO)", (0.7, 34.5), color="#EA580C")

    # --- Cột 2 thẳng đứng ---
    draw_ortho([(37.1, 73.5), (37.1, 70.5)], "1:N (category_id)", (37.1, 72.0), color="#0D9488")
    draw_ortho([(37.1, 47.0), (37.1, 44.0)], "1:N (product_id)", (37.1, 45.5), color="#4F46E5")

    # --- Khe 1-2 (x = 24.8) ---
    # suppliers -> products
    draw_ortho([(23.0, 76.0), (24.8, 76.0), (24.8, 60.0), (26.6, 60.0)], "1:N", (24.8, 68.0), color="#D97706")
    # products -> purchase_order_items
    draw_ortho([(26.6, 52.0), (24.8, 52.0), (24.8, 36.0), (23.0, 36.0)], "1:N", (24.8, 44.0), color="#0284C7")
    # goods_receipts -> batches (đi ngang khe y = 24.5 sang khe 2-3 x = 49.5 rồi lên batches)
    draw_ortho([(23.0, 18.0), (24.8, 18.0), (24.8, 24.0), (49.4, 24.0), (49.4, 72.0), (52.4, 72.0)],
               "1:N (receipt_id)", (37.1, 24.0), color="#EA580C")

    # --- Khe 2-3 (x = 50.3) ---
    # products -> batches (FEFO Core)
    draw_ortho([(47.6, 64.0), (50.3, 64.0), (50.3, 76.0), (52.4, 76.0)], "1:N (FEFO)", (50.3, 70.0), color="#6D28D9", lw=2.2)
    # batches -> stock_transfers (source_batch_id)
    draw_ortho([(52.4, 62.0), (50.3, 62.0), (50.3, 12.0), (47.6, 12.0)], "1:N (batch)", (50.3, 37.0), color="#7C3AED")

    # --- Cột 3 thẳng đứng ---
    draw_ortho([(62.9, 58.0), (62.9, 54.5)], "1:N (batch_id FEFO)", (62.9, 56.25), color="#059669", lw=2.2)
    # batches -> spoilage_records (đi dọc khe 3-4 x = 74.6)
    draw_ortho([(73.4, 64.0), (74.6, 64.0), (74.6, 18.0), (73.4, 18.0)], "1:N (batch_id)", (74.6, 28.0), color="#E11D48")

    # --- Cột 4 thẳng đứng ---
    draw_ortho([(87.5, 74.5), (87.5, 71.5)], "1:N (role_id)", (87.5, 73.0), color="#2563EB")
    draw_ortho([(87.5, 45.0), (87.5, 48.0)], "1:N (store_id)", (87.5, 46.5), color="#1E40AF")
    # users -> system_audit_logs (đi dọc hành lang mép phải x = 99.1)
    draw_ortho([(98.0, 56.0), (99.1, 56.0), (99.1, 12.0), (98.0, 12.0)], "1:N (user_id)", (99.1, 34.0), color="#334155")

    # --- Khe 3-4 (x = 75.6): store_profile -> batches & sales_history & spoilage_records ---
    draw_ortho([(77.0, 38.0), (75.6, 38.0), (75.6, 72.0), (73.4, 72.0)], "1:N (store_id)", (75.6, 56.5), color="#1E40AF")
    draw_ortho([(77.0, 34.0), (75.6, 34.0), (75.6, 42.0), (73.4, 42.0)], "", None, color="#1E40AF")
    draw_ortho([(77.0, 30.0), (75.6, 30.0), (75.6, 12.0), (73.4, 12.0)], "", None, color="#1E40AF")

    # =========================================================================
    # 6. THANH CHÚ DẪN QUY ƯỚC ERD 3NF (FOOTER LEGEND BAR NỀN SÁNG)
    # =========================================================================
    footer_leg = FancyBboxPatch((2.0, 0.6), 96.0, 1.9, boxstyle="round,pad=0.1,rounding_size=0.3",
                                facecolor='#FFFFFF', edgecolor='#CBD5E1', linewidth=1.4, zorder=5)
    ax.add_patch(footer_leg)

    ax.text(50.0, 1.55,
            "CHÚ DẪN CHUẨN 3NF (SSMS):   [PK] Khóa chính (INT IDENTITY)   |   [FK] 36 Khóa ngoại toàn vẹn (FOREIGN KEY)   |   [UQ] Ràng buộc duy nhất (UNIQUE)   |   [CK] Ràng buộc miền giá trị (CHECK)   |   Mọi bảng vận hành đều gắn FK store_id -> store_profile(id)",
            ha='center', va='center', fontsize=9.6, fontweight='bold', color='#1E293B', zorder=6)

    output_path = "c:/thuyet minh/Docs/Diagram_Images/erd_database_3nf.png"
    plt.tight_layout()
    plt.savefig(output_path, format='png', dpi=220, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()

    sys.stdout.buffer.write(f"Đã xuất sơ đồ ERD 15 bảng Orthogonal tông sáng tại: {output_path}\n".encode('utf-8'))

if __name__ == '__main__':
    draw_erd()
