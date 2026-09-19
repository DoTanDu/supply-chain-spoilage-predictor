# -*- coding: utf-8 -*-
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch
import numpy as np

def draw_dfd_0_diagram():
    # Kích thước lớn, độ phân giải cao 200 DPI
    fig, ax = plt.subplots(figsize=(22, 16), dpi=200)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Background
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    # 1. TIÊU ĐỀ SƠ ĐỒ
    ax.text(50, 96.5, "SƠ ĐỒ LUỒNG DỮ LIỆU DFD MỨC 0 (CONTEXT DIAGRAM)", 
            ha='center', va='center', fontsize=20, fontweight='bold', color='#1E3A8A', fontfamily='sans-serif')
    ax.text(50, 94.0, "Mô hình ngữ cảnh tương tác giữa Hệ thống Bán lẻ Chống lãng phí và các Thực thể ngoài", 
            ha='center', va='center', fontsize=12.5, fontstyle='italic', color='#475569', fontfamily='sans-serif')

    # 2. HÀM VẼ THỰC THỂ NGOÀI (EXTERNAL ENTITY - HÌNH CHỮ NHẬT GÓC BO)
    def draw_entity(x, y, w, h, label, sub_label, color='#0D9488', bg_color='#CCFBF1'):
        box = FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="round,pad=0.5,rounding_size=0.8",
                             facecolor=bg_color, edgecolor=color, linewidth=2.2, zorder=3)
        ax.add_patch(box)
        ax.text(x, y + 1.2, label, ha='center', va='center', fontsize=12, fontweight='bold', color=color, zorder=4)
        ax.text(x, y - 1.2, sub_label, ha='center', va='center', fontsize=9.5, fontstyle='italic', color='#334155', zorder=4)

    # 3. HÀM VẼ TIẾN TRÌNH TRUNG TÂM (CENTRAL PROCESS - HÌNH TRÒN HOẶC OVAL BO TRÒN LỚN)
    def draw_central_process(x, y, w, h):
        proc_box = FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="round,pad=1.0,rounding_size=3.0",
                                  facecolor='#EFF6FF', edgecolor='#2563EB', linewidth=3.0, zorder=3)
        ax.add_patch(proc_box)
        # Process ID Header
        ax.text(x, y + 6.0, "0.0", ha='center', va='center', fontsize=16, fontweight='bold', color='#1D4ED8', zorder=4)
        ax.text(x, y + 2.0, "HỆ THỐNG QUẢN TRỊ BÁN LẺ", ha='center', va='center', fontsize=14, fontweight='bold', color='#0F172A', zorder=4)
        ax.text(x, y - 1.2, "CHỐNG LÃNG PHÍ HÀNG HÓA", ha='center', va='center', fontsize=14, fontweight='bold', color='#0F172A', zorder=4)
        ax.text(x, y - 4.5, "(Retail Spoilage Predictor System)", ha='center', va='center', fontsize=11, fontstyle='italic', color='#475569', zorder=4)

    # VẼ CÁC THỰC THỂ NGOÀI
    # Thực thể 1: Nhân viên / Thủ kho cửa hàng (Bên trái)
    draw_entity(13, 50, 18, 14, "NHÂN VIÊN / THỦ KHO", "(Store Staff / Cashier)", color='#0D9488', bg_color='#E6FFFA')

    # Thực thể 2: Cửa hàng trưởng / Quản lý (Bên phải trên)
    draw_entity(87, 72, 20, 14, "CỬA HÀNG TRƯỞNG", "(Store Manager / Admin)", color='#B91C1C', bg_color='#FEF2F2')

    # Thực thể 3: Kho trung tâm / Kho tổng (Bên phải dưới)
    draw_entity(87, 28, 20, 14, "KHO TỔNG (DC)", "(Distribution Center)", color='#4F46E5', bg_color='#EEF2FF')

    # VẼ TIẾN TRÌNH TRUNG TÂM
    draw_central_process(50, 50, 28, 24)

    # 4. HÀM VẼ LUỒNG DỮ LIỆU (DATA FLOW ARROWS)
    def draw_flow(x_start, y_start, x_end, y_end, label, label_pos_ratio=0.5, offset_y=1.0, color='#0284C7'):
        ax.annotate('', xy=(x_end, y_end), xytext=(x_start, y_start),
                    arrowprops=dict(arrowstyle="->", color=color, lw=1.8, shrinkA=3, shrinkB=3), zorder=2)
        lx = x_start + (x_end - x_start) * label_pos_ratio
        ly = y_start + (y_end - y_start) * label_pos_ratio + offset_y
        ax.text(lx, ly, label, ha='center', va='center', fontsize=8.5, fontweight='bold', color=color, zorder=5,
                bbox=dict(boxstyle="round,pad=0.2", fc="#FFFFFF", ec="#CBD5E1", alpha=0.95))

    # ==================== LUỒNG VỚI NHÂN VIÊN (BÊN TRÁI) ====================
    # Nhân viên -> Hệ thống
    draw_flow(22, 55, 36, 57, "1. Thông tin lô nhập (Mã lô, NSX, HSD, SL thực nhận)", 0.5, 1.2, '#0D9488')
    draw_flow(22, 51, 36, 52, "2. Giao dịch bán hàng lẻ tại quầy POS", 0.5, 1.1, '#0D9488')
    draw_flow(22, 47, 36, 47, "3. Phiếu yêu cầu tiêu hủy hàng hỏng/quá date", 0.5, 1.1, '#0D9488')

    # Hệ thống -> Nhân viên
    draw_flow(36, 43, 22, 43, "4. Cảnh báo cận date đa cấp (Xanh, Vàng, Đỏ) & Lệnh đảo hàng", 0.5, -1.2, '#0284C7')
    draw_flow(36, 39, 22, 39, "5. Lệnh khóa mã bán POS (Khi hàng hết hạn <= 0 ngày)", 0.5, -1.2, '#0284C7')
    draw_flow(36, 35, 22, 35, "6. Hóa đơn thanh toán bán lẻ & Nhãn tem kệ", 0.5, -1.2, '#0284C7')

    # ==================== LUỒNG VỚI CỬA HÀNG TRƯỞNG (GÓC TRÊN PHẢI) ====================
    # Quản lý -> Hệ thống
    draw_flow(77, 76, 64, 61, "1. Cấu hình sản phẩm, ngưỡng date & Tồn an toàn (SS)", 0.5, 1.3, '#B91C1C')
    draw_flow(77, 72, 64, 57, "2. File Excel/CSV dữ liệu bán hàng lịch sử", 0.5, 1.2, '#B91C1C')
    draw_flow(77, 68, 64, 53, "3. Lệnh duyệt phiếu tiêu hủy & Duyệt đơn đặt hàng", 0.5, 1.2, '#B91C1C')

    # Hệ thống -> Quản lý
    draw_flow(64, 49, 77, 64, "4. Bảng đề xuất đặt hàng tối ưu (Reorder Suggestion)", 0.5, -1.3, '#0284C7')
    draw_flow(64, 45, 77, 60, "5. Cảnh báo nguy cơ lãng phí (DOS > DUE)", 0.5, -1.3, '#0284C7')
    draw_flow(64, 41, 77, 56, "6. Dashboard Spoilage Rate % & Báo cáo kiểm kê", 0.5, -1.3, '#0284C7')

    # ==================== LUỒNG VỚI KHO TỔNG DC (GÓC DƯỚI PHẢI) ====================
    # Kho tổng DC -> Hệ thống
    draw_flow(77, 32, 64, 43, "1. Thông tin đợt hàng điều phối (Mã lô, NSX, HSD, SL)", 0.5, 1.3, '#4F46E5')

    # Hệ thống -> Kho tổng DC
    draw_flow(64, 38, 77, 25, "2. Đơn đặt hàng bổ sung (Reorder Order đã duyệt)", 0.5, -1.3, '#4F46E5')

    # CHÚ THÍCH (LEGEND)
    leg_box = FancyBboxPatch((2, 2), 24, 16, boxstyle="round,pad=0.5,rounding_size=0.5",
                             facecolor='#FFFFFF', edgecolor='#94A3B8', linewidth=1)
    ax.add_patch(leg_box)
    ax.text(14, 16.2, "QUY ƯỚC KÝ HIỆU DFD (GANE & SARSON)", ha='center', fontsize=9.5, fontweight='bold', color='#1E293B')
    
    # Entity symbol
    ax.add_patch(FancyBboxPatch((3.5, 12), 4, 2.2, boxstyle="round,pad=0.2", fc='#CCFBF1', ec='#0D9488', lw=1.2))
    ax.text(8.5, 13.1, "Thực thể ngoài (External Entity)", va='center', fontsize=8.5, color='#334155')

    # Process symbol
    ax.add_patch(FancyBboxPatch((3.5, 8.5), 4, 2.2, boxstyle="round,pad=0.3", fc='#EFF6FF', ec='#2563EB', lw=1.5))
    ax.text(8.5, 9.6, "Tiến trình xử lý (Process)", va='center', fontsize=8.5, color='#334155')

    # Flow symbol
    ax.plot([3.5, 7.5], [6.2, 6.2], color='#0284C7', lw=1.8)
    ax.annotate('', xy=(7.5, 6.2), xytext=(3.5, 6.2), arrowprops=dict(arrowstyle="->", color='#0284C7', lw=1.8))
    ax.text(8.5, 6.2, "Luồng dữ liệu (Data Flow)", va='center', fontsize=8.5, color='#334155')

    ax.text(14, 3.5, "Chuẩn hóa theo giáo trình Phân tích Thiết kế Hệ thống LHU", ha='center', fontsize=7.8, fontstyle='italic', color='#64748B')

    # Save
    out_path = r"c:\thuyet minh\Docs\Diagram_Images\dfd_0.png"
    plt.tight_layout()
    plt.savefig(out_path, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Generated standardized DFD Level 0: {out_path}")

if __name__ == "__main__":
    draw_dfd_0_diagram()
