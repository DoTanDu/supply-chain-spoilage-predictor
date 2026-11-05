# -*- coding: utf-8 -*-
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch
import numpy as np

# Cấu hình font chữ chuẩn Unicode tiếng Việt của Windows (Arial / Segoe UI)
plt.rcParams['font.sans-serif'] = ['Arial', 'Segoe UI', 'Tahoma', 'Calibri']
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['axes.unicode_minus'] = False

def draw_dfd_1_diagram():
    # Kích thước rộng rãi, độ phân giải cao 200 DPI
    fig, ax = plt.subplots(figsize=(26, 32), dpi=200)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 120)
    ax.axis('off')

    # Background
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    # 1. TIÊU ĐỀ SƠ ĐỒ
    ax.text(50, 117.5, "SƠ ĐỒ LUỒNG DỮ LIỆU DFD MỨC 1 (FUNCTIONAL DECOMPOSITION)", 
            ha='center', va='center', fontsize=21, fontweight='bold', color='#1E3A8A', fontfamily='sans-serif')
    ax.text(50, 115.0, "Phân rã chức năng 6 Tiến trình nghiệp vụ cốt lõi & 3 Kho lưu trữ dữ liệu chuẩn 3NF", 
            ha='center', va='center', fontsize=13, fontstyle='italic', color='#475569', fontfamily='sans-serif')

    # 2. HÀM VẼ THỰC THỂ NGOÀI (EXTERNAL ENTITY)
    def draw_entity(x, y, w, h, label, sub_label, color='#0D9488', bg_color='#CCFBF1'):
        box = FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="round,pad=0.5,rounding_size=0.8",
                             facecolor=bg_color, edgecolor=color, linewidth=2.2, zorder=3)
        ax.add_patch(box)
        ax.text(x, y + 1.0, label, ha='center', va='center', fontsize=11.5, fontweight='bold', color=color, zorder=4)
        ax.text(x, y - 1.2, sub_label, ha='center', va='center', fontsize=9.5, fontstyle='italic', color='#334155', zorder=4)

    # 3. HÀM VẼ TIẾN TRÌNH (PROCESS)
    def draw_process(x, y, w, h, proc_id, name, sub_desc, color='#2563EB', bg_color='#EFF6FF'):
        box = FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="round,pad=0.6,rounding_size=1.2",
                             facecolor=bg_color, edgecolor=color, linewidth=2.0, zorder=3)
        ax.add_patch(box)
        # Process ID bar
        id_box = FancyBboxPatch((x - w/2 + 0.5, y + h/2 - 2.8), w - 1.0, 2.2, boxstyle="round,pad=0.1,rounding_size=0.4",
                                facecolor='#DBEAFE', edgecolor=color, linewidth=1.0, zorder=4)
        ax.add_patch(id_box)
        ax.text(x, y + h/2 - 1.7, proc_id, ha='center', va='center', fontsize=10.5, fontweight='bold', color=color, zorder=5)
        # Name
        ax.text(x, y + 0.3, name, ha='center', va='center', fontsize=11, fontweight='bold', color='#0F172A', zorder=5, multialignment='center')
        ax.text(x, y - 2.8, sub_desc, ha='center', va='center', fontsize=8.5, fontstyle='italic', color='#475569', zorder=5, multialignment='center')

    # 4. HÀM VẼ KHO DỮ LIỆU (DATA STORE - KHO 2 ĐẦU MỞ GANE & SARSON)
    def draw_datastore(x, y, w, h, ds_id, name, desc, color='#D97706', bg_color='#FFFBEB'):
        # Nền
        bg = FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="square,pad=0.0",
                            facecolor=bg_color, edgecolor='none', zorder=2)
        ax.add_patch(bg)
        # 2 đường kẻ trên và dưới (chuẩn DFD)
        ax.plot([x - w/2, x + w/2], [y + h/2, y + h/2], color=color, lw=2.2, zorder=3)
        ax.plot([x - w/2, x + w/2], [y - h/2, y - h/2], color=color, lw=2.2, zorder=3)
        # Đường kẻ chia cột mã kho
        ax.plot([x - w/2 + 3.5, x - w/2 + 3.5], [y - h/2, y + h/2], color=color, lw=1.5, zorder=3)
        # Text
        ax.text(x - w/2 + 1.75, y, ds_id, ha='center', va='center', fontsize=11, fontweight='bold', color=color, zorder=4)
        ax.text(x - w/2 + 4.5, y + 0.8, name, ha='left', va='center', fontsize=10.5, fontweight='bold', color='#1E293B', zorder=4)
        ax.text(x - w/2 + 4.5, y - 1.2, desc, ha='left', va='center', fontsize=8.5, fontstyle='italic', color='#64748B', zorder=4)

    # 5. HÀM VẼ LUỒNG DỮ LIỆU
    def draw_flow(x_start, y_start, x_end, y_end, label, label_pos=0.5, offset_y=1.0, color='#0284C7', curved=False, rad=0.2):
        if curved:
            connectionstyle = f"arc3,rad={rad}"
        else:
            connectionstyle = "arc3,rad=0"
        ax.annotate('', xy=(x_end, y_end), xytext=(x_start, y_start),
                    arrowprops=dict(arrowstyle="->", color=color, lw=1.6, shrinkA=3, shrinkB=3, connectionstyle=connectionstyle), zorder=2)
        lx = x_start + (x_end - x_start) * label_pos
        ly = y_start + (y_end - y_start) * label_pos + offset_y
        ax.text(lx, ly, label, ha='center', va='center', fontsize=8, fontweight='bold', color=color, zorder=6,
                bbox=dict(boxstyle="round,pad=0.2", fc="#FFFFFF", ec="#CBD5E1", alpha=0.95))

    # =========================================================================
    # VỊ TRÍ CÁC THỰC THỂ NGOÀI (ENTITIES)
    # =========================================================================
    # 1. Nhân viên / Thủ kho (Góc trên trái)
    draw_entity(12, 102, 18, 10, "NHÂN VIÊN / THỦ KHO", "(Store Staff)", color='#0D9488', bg_color='#E6FFFA')

    # 2. Cửa hàng trưởng (Góc trên phải)
    draw_entity(88, 102, 18, 10, "CỬA HÀNG TRƯỞNG", "(Store Manager)", color='#B91C1C', bg_color='#FEF2F2')

    # 3. Kho tổng DC (Góc dưới phải)
    draw_entity(88, 20, 18, 10, "KHO TỔNG (DC)", "(Distribution Center)", color='#4F46E5', bg_color='#EEF2FF')

    # =========================================================================
    # VỊ TRÍ 3 KHO DỮ LIỆU CHUẨN 3NF (DATA STORES - Ở TRỤC GIỮA ĐỂ DỄ TRUY XUẤT)
    # =========================================================================
    # D1: Sản phẩm & Lô hàng
    draw_datastore(50, 82, 28, 5.5, "D1", "Dữ liệu Sản phẩm & Lô hàng", "Bảng products, batches, categories", color='#D97706', bg_color='#FFFBEB')

    # D2: Lịch sử Giao dịch Bán hàng
    draw_datastore(50, 48, 28, 5.5, "D2", "Lịch sử Giao dịch Bán hàng", "Bảng sales_history (kèm weather, is_holiday)", color='#D97706', bg_color='#FFFBEB')

    # D3: Nhật ký Lãng phí & Tổn thất
    draw_datastore(50, 15, 28, 5.5, "D3", "Nhật ký Lãng phí & Tổn thất", "Bảng spoilage_records, disposal_loss", color='#D97706', bg_color='#FFFBEB')

    # =========================================================================
    # VỊ TRÍ 6 TIẾN TRÌNH NGHIỆP VỤ (PROCESSES)
    # =========================================================================
    # P 1.0: Tiếp nhận & Nhập lô từ Kho tổng (Bên trái trên)
    draw_process(22, 85, 22, 10, "1.0", "Tiếp nhận & Nhập lô\ntừ Kho tổng (DC)", "Kiểm đếm HSD, lưu lô, kích hoạt Shelf-Life", color='#0D9488', bg_color='#F0FDFA')

    # P 2.0: Bán hàng lẻ & Xuất kho FEFO (Bên trái giữa)
    draw_process(22, 62, 22, 10, "2.0", "Bán hàng lẻ &\nXuất kho FEFO", "Trừ lô date gần nhất, lưu sales & thời tiết", color='#E11D48', bg_color='#FFF1F2')

    # P 3.0: Quét HSD & Bắn cảnh báo Spoilage (Bên trái dưới)
    draw_process(22, 38, 22, 10, "3.0", "Quét Hạn sử dụng &\nCảnh báo Spoilage", "Đếm lùi ngày, phân cấp RSL, khóa mã hết hạn", color='#CA8A04', bg_color='#FEFCE8')

    # P 4.0: Xử lý Tiêu hủy Hàng hỏng (Góc dưới trái)
    draw_process(22, 15, 22, 10, "4.0", "Xử lý Tiêu hủy\nHàng hỏng / Quá date", "Lập phiếu, duyệt, trừ sạch tồn, tính loss", color='#9333EA', bg_color='#FAF5FF')

    # P 5.0: Dự báo Tiêu thụ & Đề xuất Đặt hàng (Bên phải giữa)
    draw_process(78, 48, 22, 10, "5.0", "Dự báo Tiêu thụ &\nĐề xuất Đặt hàng", "Tính ROP = d*L+SS, rủi ro DOS>DUE, sinh đề xuất", color='#2563EB', bg_color='#EFF6FF')

    # P 6.0: Quản trị Danh mục & Dashboard Báo cáo (Bên phải trên)
    draw_process(78, 78, 22, 10, "6.0", "Quản trị Danh mục &\nDashboard Báo cáo", "Cấu hình ngưỡng date, biểu đồ Spoilage Rate %", color='#475569', bg_color='#F1F5F9')

    # =========================================================================
    # VẼ CÁC LUỒNG DỮ LIỆU CHI TIẾT (DATA FLOWS)
    # =========================================================================

    # --- TIẾN TRÌNH 1.0 ---
    # Staff -> 1.0
    draw_flow(14, 97, 18, 90, "Xác nhận kiểm đếm & HSD", 0.5, 1.0, '#0D9488')
    # Kho tổng DC -> 1.0 (vòng qua phải hoặc nối trực tiếp)
    draw_flow(80, 25, 26, 80, "Thông tin chuyến hàng DC (Mã lô, HSD)", 0.6, 1.2, '#4F46E5', curved=True, rad=-0.3)
    # 1.0 -> D1 (Ghi thông tin lô)
    draw_flow(33, 85, 41, 84, "Lưu lô mới (ACTIVE, HSD, SL)", 0.5, 1.0, '#0D9488')
    # 1.0 -> Staff
    draw_flow(24, 90, 17, 97, "In tem nhãn kệ / Barcode", 0.5, -1.0, '#0D9488')

    # --- TIẾN TRÌNH 2.0 ---
    # Staff -> 2.0
    draw_flow(12, 97, 18, 67, "Quét mã vạch bán lẻ POS", 0.6, -1.0, '#E11D48')
    # 2.0 -> D1 (Truy vấn FEFO)
    draw_flow(33, 65, 42, 80, "Tìm lô cận date nhất & Trừ tồn", 0.5, 1.2, '#E11D48')
    # D1 -> 2.0 (Trả về tồn)
    draw_flow(40, 79, 31, 67, "Xác nhận trừ kho FEFO", 0.5, -1.2, '#E11D48')
    # 2.0 -> D2 (Ghi lịch sử bán)
    draw_flow(33, 59, 41, 51, "Ghi doanh số + Thời tiết, Lễ", 0.5, 1.0, '#E11D48')
    # 2.0 -> Staff
    draw_flow(18, 64, 10, 97, "Hóa đơn bán lẻ", 0.7, 1.0, '#E11D48')

    # --- TIẾN TRÌNH 3.0 ---
    # D1 -> 3.0 (Đọc ngày hết hạn)
    draw_flow(41, 80, 26, 43, "Đọc HSD & Số lượng tồn", 0.5, -1.2, '#CA8A04', curved=True, rad=0.2)
    # 3.0 -> Staff
    draw_flow(20, 43, 10, 97, "Cảnh báo Vàng/Đỏ (Lệnh đảo hàng FEFO)", 0.6, -1.2, '#CA8A04')
    # 3.0 -> 2.0 (Lệnh khóa bán)
    draw_flow(22, 43, 22, 57, "Khóa mã POS (Hàng hết hạn <= 0d)", 0.5, 1.1, '#B91C1C')
    # 3.0 -> Manager
    draw_flow(28, 43, 80, 99, "Báo cáo tổng hợp cận date", 0.7, 1.2, '#CA8A04', curved=True, rad=-0.25)

    # --- TIẾN TRÌNH 4.0 ---
    # Staff -> 4.0
    draw_flow(12, 97, 16, 20, "Phiếu yêu cầu tiêu hủy hàng", 0.8, -1.0, '#9333EA')
    # 4.0 -> Manager
    draw_flow(28, 19, 82, 98, "Chuyển phiếu tiêu hủy chờ duyệt", 0.7, 1.2, '#9333EA', curved=True, rad=-0.35)
    # Manager -> 4.0
    draw_flow(84, 97, 30, 17, "Lệnh phê duyệt tiêu hủy", 0.7, -1.2, '#B91C1C', curved=True, rad=0.35)
    # 4.0 -> D1 (Trừ tồn về 0)
    draw_flow(26, 20, 44, 79, "Trừ tồn về 0 (status='DISPOSED')", 0.4, 1.2, '#9333EA', curved=True, rad=-0.3)
    # 4.0 -> D3 (Ghi nhật ký hủy)
    draw_flow(33, 15, 41, 15, "Ghi sổ lãng phí & Chi phí thiệt hại", 0.5, -1.1, '#9333EA')

    # --- TIẾN TRÌNH 5.0 ---
    # D2 -> 5.0 (Đọc lịch sử bán)
    draw_flow(64, 48, 70, 48, "Lịch sử bán quá khứ", 0.5, 1.0, '#2563EB')
    # D1 -> 5.0 (Đọc tồn hiện tại)
    draw_flow(54, 79, 74, 53, "Số lượng tồn kho hiện tại", 0.5, 1.1, '#2563EB')
    # 5.0 -> Manager
    draw_flow(80, 53, 86, 97, "Đề xuất số lượng đặt hàng tối ưu", 0.5, -1.2, '#2563EB')
    # Manager -> 5.0
    draw_flow(88, 97, 82, 53, "Duyệt Đơn đặt hàng bổ sung", 0.5, 1.2, '#B91C1C')
    # 5.0 -> Kho tổng DC
    draw_flow(82, 43, 86, 25, "Gửi Đơn đặt hàng (Reorder Request)", 0.5, 1.2, '#4F46E5')

    # --- TIẾN TRÌNH 6.0 ---
    # Manager -> 6.0
    draw_flow(86, 97, 82, 83, "Cấu hình ngưỡng date & Lead Time", 0.5, 1.2, '#B91C1C')
    # Manager -> 6.0 (Import Excel)
    draw_flow(88, 97, 84, 83, "Upload file Excel bán hàng lịch sử", 0.5, -1.2, '#B91C1C')
    # 6.0 -> D1 (Cập nhật sản phẩm)
    draw_flow(67, 80, 64, 81, "Cập nhật sản phẩm & Ngưỡng", 0.5, 1.0, '#475569')
    # 6.0 -> D2 (Nạp Excel vào D2)
    draw_flow(72, 73, 58, 51, "Đồng bộ giao dịch bán", 0.5, -1.1, '#475569')
    # D1, D2, D3 -> 6.0 (Đọc tổng hợp)
    draw_flow(56, 18, 86, 73, "Số liệu tổn thất hạch toán", 0.6, 1.2, '#D97706', curved=True, rad=-0.25)
    # 6.0 -> Manager
    draw_flow(78, 83, 86, 97, "Dashboard Spoilage Rate % & Báo cáo", 0.5, 1.2, '#475569')

    # CHÚ THÍCH (LEGEND)
    leg_box = FancyBboxPatch((2, 2), 24, 18, boxstyle="round,pad=0.5,rounding_size=0.5",
                             facecolor='#FFFFFF', edgecolor='#94A3B8', linewidth=1)
    ax.add_patch(leg_box)
    ax.text(14, 18.2, "QUY ƯỚC KÝ HIỆU DFD MỨC 1", ha='center', fontsize=9.5, fontweight='bold', color='#1E293B')
    
    # Entity symbol
    ax.add_patch(FancyBboxPatch((3.5, 14.5), 4, 2.2, boxstyle="round,pad=0.2", fc='#CCFBF1', ec='#0D9488', lw=1.2))
    ax.text(8.5, 15.6, "Thực thể ngoài (Entity)", va='center', fontsize=8.5, color='#334155')

    # Process symbol
    ax.add_patch(FancyBboxPatch((3.5, 11), 4, 2.2, boxstyle="round,pad=0.3", fc='#EFF6FF', ec='#2563EB', lw=1.5))
    ax.text(8.5, 12.1, "Tiến trình (Process)", va='center', fontsize=8.5, color='#334155')

    # Data Store symbol
    ax.plot([3.5, 7.5], [8.8, 8.8], color='#D97706', lw=2)
    ax.plot([3.5, 7.5], [7.2, 7.2], color='#D97706', lw=2)
    ax.plot([4.8, 4.8], [7.2, 8.8], color='#D97706', lw=1.2)
    ax.text(8.5, 8.0, "Kho dữ liệu (Data Store)", va='center', fontsize=8.5, color='#334155')

    # Flow symbol
    ax.plot([3.5, 7.5], [5.2, 5.2], color='#0284C7', lw=1.8)
    ax.annotate('', xy=(7.5, 5.2), xytext=(3.5, 5.2), arrowprops=dict(arrowstyle="->", color='#0284C7', lw=1.8))
    ax.text(8.5, 5.2, "Luồng dữ liệu (Data Flow)", va='center', fontsize=8.5, color='#334155')

    ax.text(14, 3.2, "Khớp 100% CSDL 12 bảng SQL Server & Use Case", ha='center', fontsize=7.8, fontstyle='italic', color='#64748B')

    # Save
    out_path = r"c:\thuyet minh\Docs\Diagram_Images\dfd_1.png"
    plt.tight_layout()
    plt.savefig(out_path, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Generated standardized DFD Level 1: {out_path}")

if __name__ == "__main__":
    draw_dfd_1_diagram()
