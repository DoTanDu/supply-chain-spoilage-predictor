# -*- coding: utf-8 -*-
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch
import numpy as np

# Cấu hình font chữ chuẩn Unicode tiếng Việt của Windows (Arial / Segoe UI)
plt.rcParams['font.sans-serif'] = ['Arial', 'Segoe UI', 'Tahoma', 'Calibri']
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['axes.unicode_minus'] = False

def draw_use_case_diagram():
    # Kích thước canvas 24 x 28 inches, độ phân giải 200 DPI
    fig, ax = plt.subplots(figsize=(24, 28), dpi=200)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Background
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    # 1. TIÊU ĐỀ SƠ ĐỒ
    ax.text(50, 98, "SƠ ĐỒ USE CASE CHI TIẾT HỆ THỐNG QUẢN TRỊ BÁN LẺ CHỐNG LÃNG PHÍ", 
            ha='center', va='center', fontsize=21, fontweight='bold', color='#1E3A8A')
    ax.text(50, 96, "Mô hình phân quyền Store Staff & Store Manager | Chuỗi quy trình tác nghiệp khép kín", 
            ha='center', va='center', fontsize=13.5, fontstyle='italic', color='#475569')

    # 2. KHUNG SYSTEM BOUNDARY
    system_box = FancyBboxPatch((18, 2), 64, 92, boxstyle="round,pad=1,rounding_size=1.5", 
                                facecolor='#FFFFFF', edgecolor='#3B82F6', linewidth=2.5, linestyle='-')
    ax.add_patch(system_box)
    
    # Header của System Boundary
    sys_header = FancyBboxPatch((18, 91.5), 64, 2.5, boxstyle="round,pad=0.2,rounding_size=0.5",
                                facecolor='#EFF6FF', edgecolor='#3B82F6', linewidth=1.5)
    ax.add_patch(sys_header)
    ax.text(50, 92.7, "HỆ THỐNG QUẢN TRỊ BÁN LẺ CHỐNG LÃNG PHÍ (RETAIL SPOILAGE PREDICTOR)", 
            ha='center', va='center', fontsize=13, fontweight='bold', color='#1D4ED8')

    # 3. VẼ ACTOR (Người que chuẩn UML)
    def draw_actor(x, y, label, role_desc, color='#1E40AF'):
        # Head
        circle = plt.Circle((x, y + 2.8), 1.2, color=color, fill=False, linewidth=2.5)
        ax.add_patch(circle)
        # Body
        ax.plot([x, x], [y + 1.6, y - 1.2], color=color, linewidth=2.5)
        # Arms
        ax.plot([x - 2.0, x + 2.0], [y + 0.8, y + 0.8], color=color, linewidth=2.5)
        # Legs
        ax.plot([x, x - 1.8], [y - 1.2, y - 3.8], color=color, linewidth=2.5)
        ax.plot([x, x + 1.8], [y - 1.2, y - 3.8], color=color, linewidth=2.5)
        # Label Box
        lbl_box = FancyBboxPatch((x - 7.5, y - 7.2), 15, 2.8, boxstyle="round,pad=0.3,rounding_size=0.6",
                                 facecolor='#DBEAFE', edgecolor=color, linewidth=1.5)
        ax.add_patch(lbl_box)
        ax.text(x, y - 5.2, label, ha='center', va='center', fontsize=11.5, fontweight='bold', color=color)
        ax.text(x, y - 6.5, role_desc, ha='center', va='center', fontsize=9.5, fontstyle='italic', color='#334155')

    # Vẽ 2 Actor chính
    draw_actor(8.5, 62, "NHÂN VIÊN / THỦ KHO", "(Store Staff / Cashier)", '#0D9488')
    draw_actor(91.5, 62, "CỬA HÀNG TRƯỞNG", "(Store Manager / Admin)", '#B91C1C')

    # Vẽ Actor Kho tổng DC (Secondary Actor ở góc dưới phải)
    draw_actor(91.5, 18, "KHO TỔNG (DC)", "(Distribution Center)", '#4F46E5')

    # 4. HÀM VẼ USE CASE (Hình elip chuẩn UML)
    def draw_uc(x, y, w, h, text, uc_id="", bg_color='#F0FDF4', border_color='#16A34A', is_sub=False):
        edge_style = '--' if is_sub else '-'
        lw = 1.5 if is_sub else 2.0
        ellipse = patches.Ellipse((x, y), w, h, facecolor=bg_color, edgecolor=border_color, 
                                  linewidth=lw, linestyle=edge_style, zorder=3)
        ax.add_patch(ellipse)
        if uc_id:
            ax.text(x, y + (h * 0.22), f"«{uc_id}»", ha='center', va='center', fontsize=8.5, 
                    fontweight='bold', color='#475569', zorder=4)
            ax.text(x, y - (h * 0.08), text, ha='center', va='center', fontsize=9.5, 
                    fontweight='bold' if not is_sub else 'normal', color='#0F172A', zorder=4, multialignment='center')
        else:
            ax.text(x, y, text, ha='center', va='center', fontsize=9.5, 
                    fontweight='bold' if not is_sub else 'normal', color='#0F172A', zorder=4, multialignment='center')

    # HÀM NỐI ĐƯỜNG KẺ
    def draw_actor_link(x1, y1, x2, y2, color='#64748B'):
        ax.plot([x1, x2], [y1, y2], color=color, linewidth=1.5, zorder=2)

    def draw_relation(x1, y1, x2, y2, rel_type="<<include>>", color='#0284C7'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", color=color, lw=1.5, ls='--'), zorder=2)
        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        ax.text(mid_x, mid_y + 0.6, rel_type, ha='center', va='center', fontsize=8, 
                fontweight='bold', color=color, zorder=5, 
                bbox=dict(boxstyle="round,pad=0.15", fc="#FFFFFF", ec="none", alpha=0.9))

    # =========================================================================
    # CÁC CỤM PHÂN HỆ NGHIỆP VỤ
    # =========================================================================

    # --- KHỐI 1: TIẾP NHẬN & NHẬP LÔ TỪ KHO TỔNG ---
    box1 = FancyBboxPatch((20, 74), 28, 16, boxstyle="round,pad=0.8,rounding_size=1",
                          facecolor='#F0FDFA', edgecolor='#0D9488', linewidth=1.2, linestyle=':')
    ax.add_patch(box1)
    ax.text(21, 88.5, "PHÂN HỆ 1: TIẾP NHẬN & NHẬP LÔ TỪ KHO TỔNG", fontsize=10.5, fontweight='bold', color='#0F766E')

    # UC 1.1: Tiếp nhận lô hàng từ kho tổng
    draw_uc(30, 83.5, 16, 4.5, "Tiếp nhận lô hàng\ntừ Kho tổng (DC)", "UC-01", '#CCFBF1', '#0D9488')
    # Sub-UC 1.2: Kiểm đếm số lượng & Kiểm tra HSD thực tế
    draw_uc(42, 85.5, 14, 3.8, "Kiểm đếm số lượng &\nKiểm tra HSD thực tế", "UC-01.1", '#F0FDFA', '#14B8A6', is_sub=True)
    # Sub-UC 1.3: Nhập thông tin lô & Kích hoạt theo dõi HSD
    draw_uc(42, 79.5, 14, 4.0, "Nhập thông tin lô &\nKích hoạt theo dõi HSD", "UC-01.2", '#F0FDFA', '#14B8A6', is_sub=True)
    # Sub-UC 1.4: In nhãn kệ / Mã vạch lô hàng
    draw_uc(28, 76.5, 13, 3.5, "In nhãn kệ /\nMã vạch lô hàng", "UC-01.3", '#F0FDFA', '#14B8A6', is_sub=True)

    # Quan hệ Khối 1
    draw_actor_link(14, 65, 22, 83.5, color='#0D9488') # Staff -> UC-01
    draw_relation(38, 84.5, 42, 85.5, "<<include>>", color='#0D9488')
    draw_relation(37, 82.5, 42, 79.5, "<<include>>", color='#0D9488')
    draw_relation(29, 81.2, 28, 78.3, "<<extend>>", color='#0284C7')

    # --- KHỐI 2: BÁN HÀNG LẺ & XUẤT KHO FEFO ---
    box2 = FancyBboxPatch((20, 52), 28, 20, boxstyle="round,pad=0.8,rounding_size=1",
                          facecolor='#FEF2F2', edgecolor='#E11D48', linewidth=1.2, linestyle=':')
    ax.add_patch(box2)
    ax.text(21, 70.5, "PHÂN HỆ 2: BÁN HÀNG LẺ & XUẤT KHO FEFO", fontsize=10.5, fontweight='bold', color='#BE123C')

    # UC 2.1: Bán lẻ tại quầy
    draw_uc(30, 64.5, 16, 4.5, "Bán hàng lẻ\ntại quầy (POS)", "UC-02", '#FFE4E6', '#E11D48')
    # Sub-UC 2.2: Quét chọn lô HSD gần nhất (FEFO)
    draw_uc(42, 66.5, 14, 4.0, "Quét chọn lô HSD\ngần nhất (FEFO)", "UC-02.1", '#FFF1F2', '#F43F5E', is_sub=True)
    # Sub-UC 2.3: Tự động trừ tồn kho của lô
    draw_uc(42, 60.5, 14, 3.8, "Tự động trừ\ntồn kho của lô", "UC-02.2", '#FFF1F2', '#F43F5E', is_sub=True)
    # Sub-UC 2.4: Lưu lịch sử bán & Thời tiết, Ngày lễ
    draw_uc(30, 55.5, 16, 4.0, "Lưu lịch sử bán &\nThời tiết, Ngày lễ", "UC-02.3", '#FFF1F2', '#F43F5E', is_sub=True)

    # Quan hệ Khối 2
    draw_actor_link(14, 63, 22, 64.5, color='#E11D48') # Staff -> UC-02
    draw_relation(38, 65.5, 42, 66.5, "<<include>>", color='#E11D48')
    draw_relation(37, 63.5, 42, 60.5, "<<include>>", color='#E11D48')
    draw_relation(30, 62.2, 30, 57.5, "<<include>>", color='#E11D48')

    # --- KHỐI 3: THEO DÕI HSD & CẢNH BÁO HẾT HẠN ---
    box3 = FancyBboxPatch((20, 26), 28, 24, boxstyle="round,pad=0.8,rounding_size=1",
                          facecolor='#FEFCE8', edgecolor='#CA8A04', linewidth=1.2, linestyle=':')
    ax.add_patch(box3)
    ax.text(21, 48.5, "PHÂN HỆ 3: THEO DÕI HSD & CẢNH BÁO HẾT HẠN", fontsize=10.5, fontweight='bold', color='#A16207')

    # UC 3.1: Theo dõi HSD & Nhận cảnh báo đa cấp
    draw_uc(30, 42.5, 16, 4.5, "Giám sát hạn dùng &\nCảnh báo đa cấp", "UC-03", '#FEF08A', '#CA8A04')
    # Sub-UC 3.2: Quét tự động đếm lùi ngày HSD
    draw_uc(42, 44.5, 14, 3.8, "Quét tự động\nđếm lùi ngày HSD", "UC-03.1", '#FEFCE8', '#EAB308', is_sub=True)
    # Sub-UC 3.3: Phân cấp cảnh báo RSL (Xanh, Vàng, Đỏ)
    draw_uc(42, 38.5, 14, 4.0, "Phân loại 3 mức RSL\n(Xanh - Vàng - Đỏ)", "UC-03.2", '#FEFCE8', '#EAB308', is_sub=True)
    # Sub-UC 3.4: Đảo hàng ra trước kệ & Dán tem giảm giá
    draw_uc(28, 33.5, 14, 4.0, "Đảo hàng ra trước kệ\n& Dán tem giảm giá", "UC-03.3", '#FEFCE8', '#EAB308', is_sub=True)
    # Sub-UC 3.5: Khóa mã sản phẩm POS khi hết hạn
    draw_uc(42, 30.5, 14, 3.8, "Khóa mã sản phẩm POS\n(Khi hết hạn <= 0 ngày)", "UC-03.4", '#FEFCE8', '#EAB308', is_sub=True)

    # Quan hệ Khối 3
    draw_actor_link(14, 60, 22, 43.5, color='#CA8A04') # Staff -> UC-03
    draw_actor_link(86, 60, 38, 43.5, color='#CA8A04') # Manager -> UC-03
    draw_relation(38, 43.5, 42, 44.5, "<<include>>", color='#CA8A04')
    draw_relation(37, 41.5, 42, 38.5, "<<include>>", color='#CA8A04')
    draw_relation(29, 40.2, 28, 35.5, "<<extend>>", color='#0284C7')
    draw_relation(35, 40.5, 42, 31.5, "<<extend>>", color='#0284C7')

    # --- KHỐI 4: QUY TRÌNH TIÊU HỦY HÀNG HỎNG / QUÁ HẠN ---
    box4 = FancyBboxPatch((20, 4), 28, 20, boxstyle="round,pad=0.8,rounding_size=1",
                          facecolor='#FAF5FF', edgecolor='#9333EA', linewidth=1.2, linestyle=':')
    ax.add_patch(box4)
    ax.text(21, 22.5, "PHÂN HỆ 4: TIÊU HỦY HÀNG HỎNG & GHI NHẬN HAO HỤT", fontsize=10.5, fontweight='bold', color='#7E22CE')

    # UC 4.1: Lập phiếu yêu cầu tiêu hủy hàng
    draw_uc(28, 16.5, 14, 4.5, "Lập phiếu yêu cầu\ntiêu hủy hàng hỏng", "UC-04", '#F3E8FF', '#9333EA')
    # UC 4.2: Phê duyệt phiếu tiêu hủy (Manager)
    draw_uc(42, 16.5, 14, 4.5, "Phê duyệt phiếu\ntiêu hủy hàng", "UC-05", '#F3E8FF', '#9333EA')
    # Sub-UC 4.3: Trừ tồn kho về 0 (Đã tiêu hủy)
    draw_uc(30, 9.5, 15, 3.8, "Trừ tồn kho về 0\n(Đã tiêu hủy)", "UC-04.1", '#FAF5FF', '#A855F7', is_sub=True)
    # Sub-UC 4.4: Hạch toán thiệt hại & Ghi sổ lãng phí
    draw_uc(43, 9.5, 14, 4.0, "Hạch toán thiệt hại &\nGhi sổ lãng phí", "UC-04.2", '#FAF5FF', '#A855F7', is_sub=True)

    # Quan hệ Khối 4 (Chuẩn UML: UC-05 include cả việc trừ tồn và hạch toán)
    draw_actor_link(14, 58, 22, 17.5, color='#9333EA') # Staff -> UC-04
    draw_actor_link(86, 58, 48, 17.5, color='#9333EA') # Manager -> UC-05
    draw_relation(35, 16.5, 36, 16.5, "<<include>>", color='#9333EA') # Duyệt phiếu bao gồm kiểm tra phiếu yêu cầu
    draw_relation(42, 14.2, 34, 11.4, "<<include>>", color='#9333EA')
    draw_relation(42, 14.2, 43, 11.5, "<<include>>", color='#9333EA')

    # --- KHỐI 5: DỰ BÁO NHU CẦU & ĐẶT HÀNG KHO TỔNG ---
    box5 = FancyBboxPatch((52, 52), 28, 28, boxstyle="round,pad=0.8,rounding_size=1",
                          facecolor='#EFF6FF', edgecolor='#2563EB', linewidth=1.2, linestyle=':')
    ax.add_patch(box5)
    ax.text(53, 78.5, "PHÂN HỆ 5: DỰ BÁO TIÊU THỤ & ĐẶT HÀNG KHO TỔNG", fontsize=10.5, fontweight='bold', color='#1D4ED8')

    # UC 5.1: Phân tích tốc độ bán & Hệ số K
    draw_uc(66, 73.5, 16, 4.2, "Phân tích tốc độ bán (d)\n& Hệ số ngoại cảnh (K)", "UC-06", '#DBEAFE', '#2563EB')
    # UC 5.2: Tính ROP & Đánh giá DOS > DUE
    draw_uc(66, 66.5, 16, 4.2, "Tính điểm đặt hàng (ROP)\n& Đánh giá DOS > DUE", "UC-07", '#DBEAFE', '#2563EB')
    # UC 5.3: Tự động đề xuất số lượng đặt hàng
    draw_uc(66, 59.5, 16, 4.2, "Tự động đề xuất\nsố lượng đặt hàng", "UC-08", '#DBEAFE', '#2563EB')
    # UC 5.4: Duyệt & Gửi đơn đặt hàng về Kho tổng
    draw_uc(66, 54.5, 16, 4.0, "Duyệt & Gửi đơn đặt hàng\nvề Kho tổng (DC)", "UC-09", '#DBEAFE', '#2563EB')

    # Quan hệ Khối 5
    draw_relation(66, 71.4, 66, 68.6, "<<include>>", color='#2563EB')
    draw_relation(66, 64.4, 66, 61.6, "<<include>>", color='#2563EB')
    draw_relation(66, 57.4, 66, 56.5, "<<include>>", color='#2563EB')
    draw_actor_link(86, 64, 74, 55.5, color='#2563EB') # Manager -> UC-09
    draw_actor_link(86, 22, 74, 54.5, color='#4F46E5') # DC receives order

    # --- KHỐI 6: QUẢN TRỊ HỆ THỐNG & DASHBOARD BÁO CÁO ---
    box6 = FancyBboxPatch((52, 22), 28, 28, boxstyle="round,pad=0.8,rounding_size=1",
                          facecolor='#F8FAFC', edgecolor='#475569', linewidth=1.2, linestyle=':')
    ax.add_patch(box6)
    ax.text(53, 48.5, "PHÂN HỆ 6: QUẢN TRỊ & DASHBOARD BÁO CÁO", fontsize=10.5, fontweight='bold', color='#334155')

    # UC 6.1: Quản lý danh mục & Cấu hình ngưỡng cảnh báo
    draw_uc(66, 43.5, 16, 4.5, "Quản lý Danh mục &\nCấu hình ngưỡng date", "UC-10", '#E2E8F0', '#475569')
    # UC 6.2: Import file Excel bán hàng & Đồng bộ
    draw_uc(66, 36.5, 16, 4.5, "Import file Excel bán hàng\n& Đồng bộ dữ liệu POS", "UC-11", '#E2E8F0', '#475569')
    # UC 6.3: Xem Dashboard phân tích & Tỷ lệ lãng phí
    draw_uc(66, 29.5, 16, 4.5, "Xem Dashboard trực quan\n& Tỷ lệ lãng phí (%)", "UC-12", '#E2E8F0', '#475569')
    # UC 6.4: Xuất báo cáo kiểm kê & Báo cáo lãng phí
    draw_uc(66, 24.5, 15, 3.5, "Xuất báo cáo kiểm kê\n& Báo cáo lãng phí", "UC-13", '#F1F5F9', '#64748B', is_sub=True)

    # Quan hệ Khối 6
    draw_actor_link(86, 66, 74, 43.5, color='#475569') # Manager -> UC-10
    draw_actor_link(86, 65, 74, 36.5, color='#475569') # Manager -> UC-11
    draw_actor_link(86, 63, 74, 29.5, color='#475569') # Manager -> UC-12
    draw_relation(66, 27.2, 66, 26.3, "<<extend>>", color='#475569')

    # Đăng nhập hệ thống (Chung cho cả 2 Actor ở đầu)
    draw_uc(50, 87.5, 14, 4.0, "Đăng nhập hệ thống\n(Xác thực JWT)", "UC-00", '#FEF3C7', '#D97706')
    draw_actor_link(14, 67, 43, 87.5, color='#D97706')
    draw_actor_link(86, 67, 57, 87.5, color='#D97706')

    # Chú thích (Legend)
    leg_box = FancyBboxPatch((2, 2), 14, 18, boxstyle="round,pad=0.5,rounding_size=0.5",
                             facecolor='#FFFFFF', edgecolor='#94A3B8', linewidth=1)
    ax.add_patch(leg_box)
    ax.text(9, 18.5, "CHÚ THÍCH UML", ha='center', fontsize=9.5, fontweight='bold', color='#1E293B')
    
    # Legend items
    ax.plot([3, 6], [16, 16], color='#0D9488', lw=1.5)
    ax.text(7, 16, "Liên kết Actor", va='center', fontsize=8.5, color='#334155')

    ax.plot([3, 6], [13.5, 13.5], color='#0284C7', lw=1.5, ls='--')
    ax.text(7, 13.5, "«include» / «extend»", va='center', fontsize=8.5, color='#334155')

    el_leg1 = patches.Ellipse((4.5, 10.8), 3, 1.6, fc='#CCFBF1', ec='#0D9488', lw=1.5)
    ax.add_patch(el_leg1)
    ax.text(7, 10.8, "Use Case chính", va='center', fontsize=8.5, color='#334155')

    el_leg2 = patches.Ellipse((4.5, 7.8), 3, 1.6, fc='#F0FDFA', ec='#14B8A6', lw=1, ls='--')
    ax.add_patch(el_leg2)
    ax.text(7, 7.8, "Sub-Use Case", va='center', fontsize=8.5, color='#334155')

    ax.text(9, 4.5, "Mô hình chuẩn hóa\nKhoa CNTT - ĐH Lạc Hồng", ha='center', fontsize=8, fontstyle='italic', color='#64748B')

    # Lưu ảnh độ phân giải cao
    out_img_path = r"c:\thuyet minh\Docs\Diagram_Images\use_case.png"
    plt.tight_layout()
    plt.savefig(out_img_path, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Generated crystal-clear Use Case Diagram: {out_img_path}")

if __name__ == "__main__":
    draw_use_case_diagram()
