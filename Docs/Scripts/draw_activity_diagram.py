# -*- coding: utf-8 -*-
"""
VẼ SƠ ĐỒ HOẠT ĐỘNG (UML ACTIVITY DIAGRAM - LIGHT MODE RÕ NÉT TRÊN MÁY CHIẾU)
CHO 2 QUY TRÌNH NGHIỆP VỤ VẬN HÀNH CỐT LÕI (SOP WORKFLOWS)
1. Quy trình SOP 5 bước: Quick Markdown & Đảo lô mặt tiền kệ trưng bày
2. Quy trình SOP 4 bước: Bàn giao ca trực & Đối soát tài chính hao hụt
Dự án: SmartSupply AI - ĐH Lạc Hồng (LHU)
"""

import os
import sys
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def create_activity_diagram():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(32, 22), facecolor='#F8FAFC')
    plt.subplots_adjust(left=0.04, right=0.96, top=0.92, bottom=0.04, wspace=0.08)

    def draw_action_box(ax, x, y, w, h, step_title, step_desc, box_color, border_color, title_color='#0F172A', desc_color='#334155'):
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.3", facecolor=box_color, edgecolor=border_color, linewidth=2.2, zorder=3)
        ax.add_patch(box)
        ax.text(x + w/2, y + h*0.68, step_title, fontsize=11.5, fontweight='bold', color=title_color, ha='center', va='center', zorder=4)
        ax.text(x + w/2, y + h*0.30, step_desc, fontsize=9.5, fontweight='medium', color=desc_color, ha='center', va='center', zorder=4)

    def draw_decision_node(ax, cx, cy, w_half, h_half, label):
        pts = [[cx, cy + h_half], [cx + w_half, cy], [cx, cy - h_half], [cx - w_half, cy]]
        poly = patches.Polygon(pts, closed=True, facecolor='#FEF3C7', edgecolor='#D97706', linewidth=2.2, zorder=3)
        ax.add_patch(poly)
        ax.text(cx, cy, label, fontsize=10.2, fontweight='bold', color='#92400E', ha='center', va='center', zorder=4)

    def draw_ortho_arrow(ax, pts, color='#1D4ED8', lw=2.4):
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        if len(pts) > 2:
            ax.plot(xs[:-1], ys[:-1], color=color, linewidth=lw, solid_capstyle='round', zorder=5)
        ax.annotate('', xy=pts[-1], xytext=pts[-2],
                    arrowprops=dict(arrowstyle="-|>", mutation_scale=16, color=color, lw=lw),
                    zorder=6)

    # -------------------------------------------------------------
    # PANEL 1: QUY TRÌNH ĐẢO KỆ & QUICK MARKDOWN (5 BƯỚC SOP - LIGHT MODE)
    # -------------------------------------------------------------
    ax1.set_facecolor('#F8FAFC')
    ax1.set_xlim(0, 100)
    ax1.set_ylim(0, 100)
    ax1.axis('off')

    ax1.text(50, 97, "QUY TRÌNH 1: GIẢM GIÁ QUICK MARKDOWN & ĐẢO LÔ MẶT TIỀN KỆ", 
             fontsize=17, fontweight='bold', color='#0F172A', ha='center', va='center')
    ax1.text(50, 94.5, "Chuẩn thao tác vận hành (SOP) xử lý hàng cận date Vàng/Đỏ theo Rule 4 & Rule 10", 
             fontsize=12, fontweight='bold', color='#1D4ED8', ha='center', va='center')

    # Swimlanes (Gap ở x = 47..53 để đi đường nối vuông góc không cắt qua hộp)
    ax1.add_patch(FancyBboxPatch((3, 6), 43.5, 86, boxstyle="round,pad=0.2", facecolor='#FFFFFF', edgecolor='#CBD5E1', linewidth=1.8, linestyle='--', zorder=1))
    ax1.add_patch(FancyBboxPatch((53.5, 6), 43.5, 86, boxstyle="round,pad=0.2", facecolor='#FFFFFF', edgecolor='#CBD5E1', linewidth=1.8, linestyle='--', zorder=1))
    
    # Header Swimlane 1 & 2
    ax1.add_patch(FancyBboxPatch((5, 87), 39.5, 4.5, boxstyle="round,pad=0.2", facecolor='#1E3A8A', edgecolor='#1D4ED8', linewidth=1.8, zorder=3))
    ax1.text(24.75, 89.2, "LÀN 1: QUẢN LÝ CỬA HÀNG (MANAGER)", fontsize=12.5, fontweight='bold', color='#FFFFFF', ha='center', va='center', zorder=4)

    ax1.add_patch(FancyBboxPatch((55.5, 87), 39.5, 4.5, boxstyle="round,pad=0.2", facecolor='#065F46', edgecolor='#059669', linewidth=1.8, zorder=3))
    ax1.text(75.25, 89.2, "LÀN 2: NHÂN VIÊN VẬN HÀNH (STAFF)", fontsize=12.5, fontweight='bold', color='#FFFFFF', ha='center', va='center', zorder=4)

    # Điểm bắt đầu
    start1 = patches.Circle((24.75, 83), 1.8, facecolor='#059669', edgecolor='#047857', linewidth=2, zorder=4)
    ax1.add_patch(start1)
    ax1.text(24.75, 83, "START", fontsize=8, fontweight='bold', color='#FFFFFF', ha='center', va='center', zorder=5)

    draw_ortho_arrow(ax1, [(24.75, 81.2), (24.75, 76.0)], '#1D4ED8')

    # Bước 1
    draw_action_box(ax1, 6.75, 68.5, 36, 7.2, "BƯỚC 1: QUÉT CẢNH BÁO CA TRỰC", 
                    "Kiểm tra Action Board: Lô chạm Vùng Vàng\n(3 < DaysLeft <= WarningDays) hoặc Vùng Đỏ", 
                    '#EFF6FF', '#2563EB', '#1E3A8A', '#1E293B')

    draw_ortho_arrow(ax1, [(24.75, 68.5), (24.75, 62.5)], '#1D4ED8')

    # Decision Node 1
    draw_decision_node(ax1, 24.75, 58.0, 7.5, 4.2, "Đánh giá Vùng\nHạn dùng?")

    # Nhánh Vàng -> Giảm 15%-30% (Vuông góc sang trái x=14.5)
    draw_ortho_arrow(ax1, [(17.25, 58.0), (14.5, 58.0), (14.5, 47.0)], '#D97706')
    ax1.text(14.5, 52.5, "Vùng Vàng\n(4-7 ngày)", fontsize=8.8, fontweight='bold', color='#B45309', ha='center', va='center',
             bbox=dict(boxstyle="round,pad=0.2", facecolor='#FFFBEB', edgecolor='#F59E0B', lw=1.0), zorder=7)
    draw_action_box(ax1, 5.25, 39.0, 18.5, 7.5, "MỨC GIẢM 15% - 30%", "Áp dụng hàng cận date\nƯu tiên kích cầu vừa phải",
                    '#FFFBEB', '#D97706', '#92400E', '#334155')

    # Nhánh Đỏ -> Giảm 40%-50% (Vuông góc sang phải x=35.0)
    draw_ortho_arrow(ax1, [(32.25, 58.0), (35.0, 58.0), (35.0, 47.0)], '#E11D48')
    ax1.text(35.0, 52.5, "Vùng Đỏ\n(1-3 ngày)", fontsize=8.8, fontweight='bold', color='#BE123C', ha='center', va='center',
             bbox=dict(boxstyle="round,pad=0.2", facecolor='#FFF1F2', edgecolor='#F43F5E', lw=1.0), zorder=7)
    draw_action_box(ax1, 25.75, 39.0, 18.5, 7.5, "MỨC GIẢM 40% - 50%", "Xả hàng kịch sàn trong ngày\nTránh mất trắng 100% vốn",
                    '#FFF1F2', '#E11D48', '#9F1239', '#334155')

    # Gộp 2 nhánh về Bước 2
    draw_ortho_arrow(ax1, [(14.5, 39.0), (14.5, 33.5), (24.75, 33.5), (24.75, 29.5)], '#1D4ED8')
    draw_ortho_arrow(ax1, [(35.0, 39.0), (35.0, 33.5), (24.75, 33.5), (24.75, 29.5)], '#1D4ED8')

    draw_action_box(ax1, 6.75, 22.0, 36, 7.2, "BƯỚC 2: KÍCH HOẠT QUICK MARKDOWN", 
                    "Quản lý duyệt đổi giá trên hệ thống\nAPI tự động đồng bộ giá mới tức thì tại POS", 
                    '#ECFDF5', '#059669', '#065F46', '#1E293B')

    # Chuyển làn sang Nhân viên (Bước 3) đi theo rãnh giữa x=50.0 (Không cắt qua bất kỳ hộp nào)
    draw_ortho_arrow(ax1, [(43.0, 25.6), (50.0, 25.6), (50.0, 79.5), (75.25, 79.5), (75.25, 76.0)], '#7C3AED', lw=2.5)
    ax1.text(50.0, 52.0, "Lệnh đảo kệ\nFEFO", fontsize=9.0, fontweight='bold', color='#6D28D9', ha='center', va='center',
             bbox=dict(boxstyle="round,pad=0.25", facecolor='#FAF5FF', edgecolor='#7C3AED', lw=1.2), zorder=8)

    # Bước 3
    draw_action_box(ax1, 57.25, 68.5, 36, 7.2, "BƯỚC 3: ĐẢO LÔ HÀNG MẶT TIỀN", 
                    "Rút các sản phẩm hạn xa vào sâu bên trong\nĐưa toàn bộ lô cận date ra hàng đầu mặt kệ", 
                    '#ECFDF5', '#059669', '#065F46', '#1E293B')

    draw_ortho_arrow(ax1, [(75.25, 68.5), (75.25, 53.0)], '#059669')

    # Bước 4
    draw_action_box(ax1, 57.25, 45.5, 36, 7.2, "BƯỚC 4: DÁN TEM NHÃN GIẢM GIÁ", 
                    "Dán sticker 'Khuyến mãi đặc biệt 15%-50%'\nĐặt bảng cảnh báo ưu đãi tại line hàng", 
                    '#FFFBEB', '#D97706', '#92400E', '#1E293B')

    draw_ortho_arrow(ax1, [(75.25, 45.5), (75.25, 29.5)], '#059669')

    # Bước 5
    draw_action_box(ax1, 57.25, 22.0, 36, 7.2, "BƯỚC 5: XÁC NHẬN ĐIỆN TỬ TRÊN APP", 
                    "Nhân viên bấm nút 'Đã hoàn tất đảo kệ'\nHệ thống gỡ cờ cảnh báo & ghi vết AuditLog", 
                    '#EFF6FF', '#2563EB', '#1E3A8A', '#1E293B')

    draw_ortho_arrow(ax1, [(75.25, 22.0), (75.25, 13.5)], '#059669')

    end1_outer = patches.Circle((75.25, 11), 2.2, facecolor='none', edgecolor='#059669', linewidth=2.5, zorder=4)
    end1_inner = patches.Circle((75.25, 11), 1.4, facecolor='#059669', zorder=4)
    ax1.add_patch(end1_outer)
    ax1.add_patch(end1_inner)
    ax1.text(75.25, 7.2, "HOÀN TẤT SOP ĐẢO KỆ", fontsize=10, fontweight='bold', color='#047857', ha='center', va='center')


    # -------------------------------------------------------------
    # PANEL 2: QUY TRÌNH BÀN GIAO CA TRỰC (4 BƯỚC SOP - LIGHT MODE)
    # -------------------------------------------------------------
    ax2.set_facecolor('#F8FAFC')
    ax2.set_xlim(0, 100)
    ax2.set_ylim(0, 100)
    ax2.axis('off')

    ax2.text(50, 97, "QUY TRÌNH 2: BÀN GIAO CA TRỰC & ĐỐI SOÁT TÀI CHÍNH HAO HỤT", 
             fontsize=17, fontweight='bold', color='#0F172A', ha='center', va='center')
    ax2.text(50, 94.5, "Chuẩn thao tác chốt ca thu ngân, quỹ tiền mặt và hao hụt tài chính giữa 2 ca", 
             fontsize=12, fontweight='bold', color='#6D28D9', ha='center', va='center')

    ax2.add_patch(FancyBboxPatch((3, 6), 43.5, 86, boxstyle="round,pad=0.2", facecolor='#FFFFFF', edgecolor='#CBD5E1', linewidth=1.8, linestyle='--', zorder=1))
    ax2.add_patch(FancyBboxPatch((53.5, 6), 43.5, 86, boxstyle="round,pad=0.2", facecolor='#FFFFFF', edgecolor='#CBD5E1', linewidth=1.8, linestyle='--', zorder=1))

    ax2.add_patch(FancyBboxPatch((5, 87), 39.5, 4.5, boxstyle="round,pad=0.2", facecolor='#581C87', edgecolor='#7E22CE', linewidth=1.8, zorder=3))
    ax2.text(24.75, 89.2, "LÀN 1: NHÂN VIÊN KẾT CA (Outgoing Staff)", fontsize=12.5, fontweight='bold', color='#FFFFFF', ha='center', va='center', zorder=4)

    ax2.add_patch(FancyBboxPatch((55.5, 87), 39.5, 4.5, boxstyle="round,pad=0.2", facecolor='#1E3A8A', edgecolor='#1D4ED8', linewidth=1.8, zorder=3))
    ax2.text(75.25, 89.2, "LÀN 2: NHÂN VIÊN NHẬN CA & QUẢN LÝ", fontsize=12.5, fontweight='bold', color='#FFFFFF', ha='center', va='center', zorder=4)

    start2 = patches.Circle((24.75, 83), 1.8, facecolor='#7E22CE', edgecolor='#6B21A8', linewidth=2, zorder=4)
    ax2.add_patch(start2)
    ax2.text(24.75, 83, "START", fontsize=8, fontweight='bold', color='#FFFFFF', ha='center', va='center', zorder=5)

    draw_ortho_arrow(ax2, [(24.75, 81.2), (24.75, 76.0)], '#7E22CE')

    # Bước 1
    draw_action_box(ax2, 6.75, 68.5, 36, 7.2, "BƯỚC 1: KIỂM ĐẾM TIỀN MẶT KÉT", 
                    "Nhân viên đếm thực tế tiền mặt tại quầy POS\nKê khai số tiền vào form Chốt ca điện tử", 
                    '#FAF5FF', '#9333EA', '#581C87', '#1E293B')

    draw_ortho_arrow(ax2, [(24.75, 68.5), (24.75, 61.0)], '#7E22CE')

    # Bước 2
    draw_action_box(ax2, 6.75, 53.5, 36, 7.2, "BƯỚC 2: ĐỐI SOÁT DOANH THU POS", 
                    "Hệ thống so khớp Tiền thực tế vs Doanh thu máy\nTự động tính chênh lệch thừa/thiếu (Discrepancy)", 
                    '#EFF6FF', '#2563EB', '#1E3A8A', '#1E293B')

    draw_ortho_arrow(ax2, [(24.75, 53.5), (24.75, 47.0)], '#7E22CE')

    # Decision Node 2
    draw_decision_node(ax2, 24.75, 42.5, 7.5, 4.2, "Chênh lệch\nquỹ tiền?")

    # Nhánh có lệch (Vuông góc sang trái x=14.5)
    draw_ortho_arrow(ax2, [(17.25, 42.5), (14.5, 42.5), (14.5, 31.5)], '#E11D48')
    ax2.text(14.5, 37.0, "Lệch > 0đ", fontsize=8.8, fontweight='bold', color='#BE123C', ha='center', va='center',
             bbox=dict(boxstyle="round,pad=0.2", facecolor='#FFF1F2', edgecolor='#F43F5E', lw=1.0), zorder=7)
    draw_action_box(ax2, 5.25, 23.5, 18.5, 7.5, "GIẢI TRÌNH LÝ DO", "Nhập ghi chú giải trình\nChờ Quản lý phê duyệt",
                    '#FFF1F2', '#E11D48', '#9F1239', '#334155')

    # Nhánh khớp 100% (Vuông góc sang phải x=35.0)
    draw_ortho_arrow(ax2, [(32.25, 42.5), (35.0, 42.5), (35.0, 31.5)], '#059669')
    ax2.text(35.0, 37.0, "Khớp 100%", fontsize=8.8, fontweight='bold', color='#047857', ha='center', va='center',
             bbox=dict(boxstyle="round,pad=0.2", facecolor='#ECFDF5', edgecolor='#10B981', lw=1.0), zorder=7)
    draw_action_box(ax2, 25.75, 23.5, 18.5, 7.5, "KHỚP CHUẨN KÉT", "Chuyển tiếp kiểm kê kho\nvà bàn giao trực tiếp",
                    '#ECFDF5', '#059669', '#065F46', '#334155')

    # Gộp 2 nhánh đi theo rãnh giữa x=50.0 sang Làn 2 (Không cắt qua bất kỳ hộp nào)
    draw_ortho_arrow(ax2, [(14.5, 23.5), (14.5, 18.0), (50.0, 18.0), (50.0, 79.5), (75.25, 79.5), (75.25, 76.0)], '#D97706', lw=2.5)
    ax2.plot([35.0, 35.0], [23.5, 18.0], color='#D97706', linewidth=2.5, zorder=5)
    ax2.text(50.0, 50.0, "Bàn giao kho\n& Sổ hao hụt", fontsize=9.0, fontweight='bold', color='#B45309', ha='center', va='center',
             bbox=dict(boxstyle="round,pad=0.25", facecolor='#FFFBEB', edgecolor='#D97706', lw=1.2), zorder=8)

    # Bước 3
    draw_action_box(ax2, 57.25, 68.5, 36, 7.2, "BƯỚC 3: KIỂM ĐẾM HÀNG CẬN DATE", 
                    "Hai bên cùng rà soát số lượng hàng Vàng/Đỏ\nĐối soát số lượng đã tiêu hủy ghi Sổ hao hụt", 
                    '#FFFBEB', '#D97706', '#92400E', '#1E293B')

    draw_ortho_arrow(ax2, [(75.25, 68.5), (75.25, 53.0)], '#1D4ED8')

    # Bước 4
    draw_action_box(ax2, 57.25, 45.5, 36, 7.2, "BƯỚC 4: KÝ BIÊN BẢN ĐIỆN TỬ", 
                    "Nhân viên nhận ca & Quản lý cửa hàng ký số\nChốt phiên làm việc và bàn giao quyền hạn POS", 
                    '#ECFDF5', '#059669', '#065F46', '#1E293B')

    draw_ortho_arrow(ax2, [(75.25, 45.5), (75.25, 37.0)], '#1D4ED8')

    # Lưu AuditLog & Chốt ca
    draw_action_box(ax2, 57.25, 30.0, 36, 6.8, "GHI NHẬN AUDIT LOG BẤT BIẾN", 
                    "Lưu toàn bộ biên bản chốt ca vào system_audit_logs\nKhóa phiên giao dịch cũ, mở ca mới an toàn", 
                    '#EFF6FF', '#2563EB', '#1E3A8A', '#1E293B')

    draw_ortho_arrow(ax2, [(75.25, 30.0), (75.25, 19.0)], '#059669')

    # End Node Panel 2
    end2_outer = patches.Circle((75.25, 16), 2.2, facecolor='none', edgecolor='#7E22CE', linewidth=2.5, zorder=4)
    end2_inner = patches.Circle((75.25, 16), 1.4, facecolor='#7E22CE', zorder=4)
    ax2.add_patch(end2_outer)
    ax2.add_patch(end2_inner)
    ax2.text(75.25, 11.8, "HOÀN TẤT BÀN GIAO CA", fontsize=10, fontweight='bold', color='#6B21A8', ha='center', va='center')

    # Footer chung
    fig.text(0.5, 0.015, 
             "HỆ THỐNG QUẢN LÝ CHUỖI CUNG ỨNG THỰC PHẨM THÔNG MINH ỨNG DỤNG AI (SMARTSUPPLY AI) | ĐẠI HỌC LẠC HỒNG (LHU) - THS. LÊ MINH NHẬT",
             fontsize=12, fontweight='bold', color='#334155', ha='center', va='center')

    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Diagram_Images"))
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "activity_sop_workflows.png")
    plt.savefig(out_path, dpi=240, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"XUAT THANH CONG ANH SO DO HOAT DONG (LIGHT MODE ORTHOGONAL): {out_path}")

if __name__ == "__main__":
    create_activity_diagram()
