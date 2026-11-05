# -*- coding: utf-8 -*-
"""
SƠ ĐỒ USE CASE TỔNG THỂ HỆ THỐNG SMARTSUPPLY AI (LIGHT MODE - ĐƯỜNG NỐI VUÔNG GÓC ORTHOGONAL)
Chuẩn hóa theo góp ý của GVHD ThS. Lê Minh Nhật:
- 3 Actor nội bộ cốt lõi: OWNER (10 nhóm), MANAGER (9 nhóm), STAFF (7 nhóm - gộp Thu ngân & Kho kệ)
- 1 Actor ngoại cảnh: KHO TỔNG DC BIÊN HÒA (Distribution Center)
- Tích hợp Dự báo AI LightGBM 7 ngày & Tối ưu Đặt hàng/Điều chuyển liên cửa hàng bằng Google OR-Tools
"""
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch

plt.rcParams['font.sans-serif'] = ['Segoe UI', 'Arial', 'Tahoma', 'Calibri']
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['axes.unicode_minus'] = False

def draw_full_use_case_diagram():
    fig, ax = plt.subplots(figsize=(32, 36), dpi=220)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    # =========================================================================
    # 1. TIÊU ĐỀ SƠ ĐỒ CHÍNH
    # =========================================================================
    ax.text(50, 98.8, "SƠ ĐỒ USE CASE TỔNG THỂ HỆ THỐNG QUẢN TRỊ CHUỖI CUNG ỨNG THÔNG MINH (SMARTSUPPLY AI)", 
            ha='center', va='center', fontsize=21, fontweight='bold', color='#0F172A')
    ax.text(50, 97.2, "Mô hình Chuỗi Cửa hàng Bán lẻ (3-30 Chi nhánh) liên kết Kho tổng DC | Chuẩn hóa 3 Actor (OWNER · MANAGER · STAFF) - 26 Nhóm Nghiệp vụ", 
            ha='center', va='center', fontsize=13.5, fontweight='bold', color='#1D4ED8')

    # =========================================================================
    # 2. KHUNG SYSTEM BOUNDARY
    # =========================================================================
    sys_box = FancyBboxPatch((16, 1.8), 68, 93.5, boxstyle="round,pad=0.8,rounding_size=1.2", 
                             facecolor='#FFFFFF', edgecolor='#2563EB', linewidth=2.5, zorder=1)
    ax.add_patch(sys_box)
    
    sys_header = FancyBboxPatch((16, 92.6), 68, 2.7, boxstyle="round,pad=0.2,rounding_size=0.4",
                                facecolor='#EFF6FF', edgecolor='#2563EB', linewidth=1.8, zorder=2)
    ax.add_patch(sys_header)
    ax.text(50, 93.95, "PHẠM VI HỆ THỐNG: NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG THỰC PHẨM ỨNG DỤNG AI (SMARTSUPPLY AI)", 
            ha='center', va='center', fontsize=13.2, fontweight='bold', color='#1E3A8A', zorder=3)

    # =========================================================================
    # 3. HÀM VẼ ACTOR (Chuẩn UML)
    # =========================================================================
    def draw_actor(x, y, label, role_code, sub_desc, color='#1E40AF', bg_badge='#DBEAFE'):
        circle = plt.Circle((x, y + 2.3), 0.95, color=color, fill=False, linewidth=2.4, zorder=4)
        ax.add_patch(circle)
        ax.plot([x, x], [y + 1.35, y - 0.95], color=color, linewidth=2.4, zorder=4)
        ax.plot([x - 1.5, x + 1.5], [y + 0.65, y + 0.65], color=color, linewidth=2.4, zorder=4)
        ax.plot([x, x - 1.3], [y - 0.95, y - 2.8], color=color, linewidth=2.4, zorder=4)
        ax.plot([x, x + 1.3], [y - 0.95, y - 2.8], color=color, linewidth=2.4, zorder=4)
        badge = FancyBboxPatch((x - 6.8, y - 6.0), 13.6, 2.8, boxstyle="round,pad=0.2,rounding_size=0.4",
                               facecolor=bg_badge, edgecolor=color, linewidth=1.6, zorder=4)
        ax.add_patch(badge)
        ax.text(x, y - 4.2, label, ha='center', va='center', fontsize=10.5, fontweight='bold', color=color, zorder=5)
        ax.text(x, y - 5.3, f"[{role_code}] {sub_desc}", ha='center', va='center', fontsize=8.3, fontweight='bold', color='#1E293B', zorder=5)

    # Bên TRÁI: Actor 3 - STAFF (7 nhóm nghiệp vụ)
    draw_actor(8, 52, "NHÂN VIÊN CỬA HÀNG", "STAFF", "7 Nhóm (POS, Kho, Đảo kệ)", '#059669', '#D1FAE5')

    # Bên PHẢI: Actor 1 (OWNER - 10 nhóm), Actor 2 (MANAGER - 9 nhóm), External (KHO TỔNG DC)
    draw_actor(92, 80, "CHỦ CHUỖI / ADMIN", "OWNER", "10 Nhóm (Toàn chuỗi)", '#7C3AED', '#EDE9FE')
    draw_actor(92, 48, "QUẢN LÝ CỬA HÀNG", "MANAGER", "9 Nhóm (Chi nhánh)", '#DC2626', '#FEE2E2')
    draw_actor(92, 14, "KHO TỔNG (DC)", "DC SUPPLIER", "Cung ứng & Giao nhận", '#2563EB', '#DBEAFE')

    # =========================================================================
    # 4. HÀM VẼ USE CASE & ĐƯỜNG KẺ VUÔNG GÓC (ORTHOGONAL ROUTING)
    # =========================================================================
    def draw_uc(x, y, w, h, text, uc_id="", bg_color='#F0FDF4', border_color='#16A34A', is_sub=False):
        edge_style = '--' if is_sub else '-'
        lw = 1.5 if is_sub else 2.0
        ellipse = patches.Ellipse((x, y), w, h, facecolor=bg_color, edgecolor=border_color, 
                                  linewidth=lw, linestyle=edge_style, zorder=5)
        ax.add_patch(ellipse)
        if uc_id:
            ax.text(x, y + (h * 0.22), f"«{uc_id}»", ha='center', va='center', fontsize=7.8, 
                    fontweight='bold', color='#334155', zorder=6)
            ax.text(x, y - (h * 0.08), text, ha='center', va='center', fontsize=8.6, 
                    fontweight='bold' if not is_sub else 'medium', color='#0F172A', zorder=6, multialignment='center')
        else:
            ax.text(x, y, text, ha='center', va='center', fontsize=8.6, 
                    fontweight='bold' if not is_sub else 'medium', color='#0F172A', zorder=6, multialignment='center')

    def draw_ortho_link(pts, color='#64748B', lw=1.6):
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        ax.plot(xs, ys, color=color, linewidth=lw, solid_capstyle='round', zorder=3)

    def draw_relation(x1, y1, x2, y2, rel_type="<<include>>", color='#0284C7'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", color=color, lw=1.5, ls='--'), zorder=4)
        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        ax.text(mid_x, mid_y + 0.35, rel_type, ha='center', va='center', fontsize=7.3, 
                fontweight='bold', color=color, zorder=7, 
                bbox=dict(boxstyle="round,pad=0.1", fc="#FFFFFF", ec="none", alpha=0.92))

    # =========================================================================
    # 5. USE CASE DÙNG CHUNG: ĐĂNG NHẬP JWT 3 ACTOR
    # =========================================================================
    draw_uc(50, 90.2, 16, 3.2, "Đăng nhập & Phân quyền RBAC\n(OWNER · MANAGER · STAFF)", "UC-00", '#FEF3C7', '#D97706')
    # Orthogonal links to UC-00 via top channel y=90.2
    draw_ortho_link([(8.0, 55.5), (8.0, 90.2), (42.0, 90.2)], color='#059669')
    draw_ortho_link([(92.0, 83.5), (92.0, 90.2), (58.0, 90.2)], color='#7C3AED')
    draw_ortho_link([(85.2, 49.5), (83.4, 49.5), (83.4, 89.6), (57.8, 89.6)], color='#DC2626')

    # =========================================================================
    # CỘT TRÁI (LEFT COLUMN): NHẬP KHO DC, BÁN LẺ POS FEFO, GIÁM SÁT HSD & ĐẢO KỆ
    # =========================================================================

    # --- KHỐI 2: TIẾP NHẬN HÀNG TỪ KHO TỔNG DC (STAFF & MANAGER) ---
    box2 = FancyBboxPatch((17.8, 68.5), 31.0, 19.2, boxstyle="round,pad=0.4,rounding_size=0.8",
                          facecolor='#F0FDFA', edgecolor='#0D9488', linewidth=1.4, linestyle=':', zorder=2)
    ax.add_patch(box2)
    ax.text(18.6, 86.8, "PHÂN HỆ 2: TIẾP NHẬN HÀNG KHO TỔNG DC (INBOUND)", fontsize=9.6, fontweight='bold', color='#0F766E')

    draw_uc(26, 81.5, 13.5, 3.8, "Tiếp nhận hàng\ntừ xe tải DC (US-STF-03)", "UC-06", '#CCFBF1', '#0D9488')
    draw_uc(41, 83.2, 12.8, 3.4, "Kiểm định đạt chuẩn\nRSL >= 70% (Rule 7)", "UC-06.1", '#F0FDFA', '#14B8A6', is_sub=True)
    draw_uc(41, 78.5, 12.8, 3.4, "Từ chối nhận hàng\n(Nếu RSL < 70%)", "UC-06.2", '#FEF2F2', '#EF4444', is_sub=True)
    draw_uc(26, 73.0, 13.5, 3.6, "Sinh mã lô LOT-DC &\nKích hoạt theo dõi HSD", "UC-06.3", '#F0FDFA', '#14B8A6', is_sub=True)
    draw_uc(41, 73.0, 12.5, 3.2, "In nhãn tem mã vạch\nlô hàng lưu kho", "UC-06.4", '#F0FDFA', '#14B8A6', is_sub=True)

    # STAFF -> UC-06 via left gutter x=16.8
    draw_ortho_link([(14.8, 53.0), (16.8, 53.0), (16.8, 81.5), (19.25, 81.5)], color='#059669')
    draw_relation(32.7, 82.3, 34.6, 83.0, "<<include>>", color='#0D9488')
    draw_relation(32.7, 80.7, 34.6, 79.2, "<<extend>>", color='#EF4444')
    draw_relation(26.0, 79.6, 26.0, 74.8, "<<include>>", color='#0D9488')
    draw_relation(32.7, 73.0, 34.8, 73.0, "<<extend>>", color='#0284C7')

    # --- KHỐI 3: BÁN LẺ POS THEO NGUYÊN TẮC FEFO (STAFF) ---
    box3 = FancyBboxPatch((17.8, 43.5), 31.0, 23.2, boxstyle="round,pad=0.4,rounding_size=0.8",
                          facecolor='#FEF2F2', edgecolor='#E11D48', linewidth=1.4, linestyle=':', zorder=2)
    ax.add_patch(box3)
    ax.text(18.6, 65.8, "PHÂN HỆ 3: BÁN LẺ POS & XUẤT KHO FEFO (STAFF)", fontsize=9.6, fontweight='bold', color='#BE123C')

    draw_uc(26, 58.5, 13.5, 4.0, "Bán lẻ tại quầy POS\n(US-STF-02: Xuất FEFO)", "UC-07", '#FFE4E6', '#E11D48')
    draw_uc(41, 62.0, 13.0, 3.5, "Tự động xuất lô hạn\ngần nhất (Rule 2 FEFO)", "UC-07.1", '#FFF1F2', '#F43F5E', is_sub=True)
    draw_uc(41, 56.5, 13.0, 3.5, "Tự động bẻ đơn qua\nnhiều lô (Split Order)", "UC-07.2", '#FFF1F2', '#F43F5E', is_sub=True)
    draw_uc(41, 51.0, 13.0, 3.5, "Áp dụng giá giảm xả\n(Nếu lô có Markdown)", "UC-07.3", '#FFF1F2', '#F43F5E', is_sub=True)
    draw_uc(26, 49.5, 13.5, 3.6, "Lưu cờ ngữ cảnh bán\n(Thời tiết & Ngày lễ)", "UC-07.4", '#FFF1F2', '#F43F5E', is_sub=True)
    draw_uc(41, 45.8, 12.5, 3.0, "Tra cứu SP & In hóa đơn\nkèm mã lô (US-STF-01)", "UC-07.5", '#FFF1F2', '#F43F5E', is_sub=True)

    # STAFF -> UC-07 via left gutter x=16.8
    draw_ortho_link([(14.8, 52.5), (16.8, 52.5), (16.8, 58.5), (19.25, 58.5)], color='#059669')
    draw_relation(32.7, 59.8, 34.5, 61.5, "<<include>>", color='#E11D48')
    draw_relation(32.7, 58.0, 34.5, 57.0, "<<include>>", color='#E11D48')
    draw_relation(32.7, 56.5, 34.5, 52.5, "<<include>>", color='#E11D48')
    draw_relation(26.0, 56.5, 26.0, 51.3, "<<include>>", color='#E11D48')
    draw_relation(32.7, 49.0, 35.0, 46.8, "<<extend>>", color='#0284C7')

    # --- KHỐI 4: GIÁM SÁT HSD, QUICK MARKDOWN & ĐẢO KỆ ---
    box4 = FancyBboxPatch((17.8, 3.0), 31.0, 38.2, boxstyle="round,pad=0.4,rounding_size=0.8",
                          facecolor='#FEFCE8', edgecolor='#CA8A04', linewidth=1.4, linestyle=':', zorder=2)
    ax.add_patch(box4)
    ax.text(18.6, 40.3, "PHÂN HỆ 4: GIÁM SÁT HSD, XẢ HÀNG & ĐẢO KỆ SOP", fontsize=9.6, fontweight='bold', color='#A16207')

    draw_uc(26, 33.5, 13.5, 4.0, "Giám sát hạn dùng 3 vùng\n(US-OWN-06 / MGR-02 / STF-05)", "UC-08", '#FEF08A', '#CA8A04')
    draw_uc(41, 35.5, 12.8, 3.6, "Khóa cứng xuất bán POS\n(DaysLeft <= 0 - Rule 5)", "UC-08.1", '#FEF2F2', '#EF4444', is_sub=True)
    draw_uc(26, 23.5, 13.8, 4.2, "Kích hoạt giảm giá xả hàng\nQuick Markdown (US-MGR-06)", "UC-09", '#FEF08A', '#CA8A04')
    draw_uc(26, 13.5, 13.8, 4.2, "Thực hiện SOP đảo kệ 5 bước\n& Xác nhận (US-STF-06)", "UC-10", '#FEF08A', '#CA8A04')
    draw_uc(41, 18.5, 12.8, 3.5, "In & dán tem nhãn giảm giá\nlên bao bì sản phẩm", "UC-10.1", '#FEFCE8', '#EAB308', is_sub=True)

    # STAFF -> UC-08 & UC-10 via left gutter x=16.8
    draw_ortho_link([(14.8, 51.5), (16.8, 51.5), (16.8, 33.5), (19.25, 33.5)], color='#059669')
    draw_ortho_link([(16.8, 33.5), (16.8, 13.5), (19.1, 13.5)], color='#059669')
    # MANAGER -> UC-08 & UC-09 via horizontal gap y=42.3 and center gutter x=49.8
    draw_ortho_link([(85.2, 48.0), (83.0, 48.0), (83.0, 42.3), (49.8, 42.3), (49.8, 23.5), (32.9, 23.5)], color='#DC2626')
    draw_ortho_link([(49.8, 31.5), (26.0, 31.5)], color='#DC2626')

    draw_relation(32.7, 34.2, 34.6, 35.2, "<<include>>", color='#EF4444')
    draw_relation(32.7, 15.0, 34.6, 17.5, "<<extend>>", color='#0284C7')

    # =========================================================================
    # CỘT PHẢI (RIGHT COLUMN): QUẢN TRỊ CHUỖI, TIÊU HỦY SoD, AI DỰ BÁO & ĐIỀU CHUYỂN
    # =========================================================================

    # --- KHỐI 1: QUẢN TRỊ CHUỖI CỬA HÀNG & HỆ THỐNG (OWNER & MANAGER) ---
    box1 = FancyBboxPatch((51.2, 68.5), 31.0, 19.2, boxstyle="round,pad=0.4,rounding_size=0.8",
                          facecolor='#F5F3FF', edgecolor='#7C3AED', linewidth=1.4, linestyle=':', zorder=2)
    ax.add_patch(box1)
    ax.text(52.0, 86.8, "PHÂN HỆ 1: QUẢN TRỊ CHUỖI CỬA HÀNG & RBAC (OWNER)", fontsize=9.6, fontweight='bold', color='#6D28D9')

    draw_uc(59, 82.0, 13.0, 3.8, "Quản lý tài khoản &\nPhân quyền 3 Actor (OWN-01)", "UC-01", '#EDE9FE', '#7C3AED')
    draw_uc(73.5, 82.0, 13.5, 3.8, "Quản lý chuỗi chi nhánh\n3-30 cửa hàng (US-OWN-02)", "UC-02", '#EDE9FE', '#7C3AED')
    draw_uc(59, 74.0, 13.0, 3.8, "Quản lý Danh mục SP, NCC\n& Chống trùng (OWN-03/MGR-04)", "UC-03", '#EDE9FE', '#7C3AED')
    draw_uc(73.5, 74.0, 13.5, 3.8, "Giám sát AuditLog & Cấu hình\nhệ thống (US-OWN-10)", "UC-04", '#EDE9FE', '#7C3AED')

    # OWNER -> UC-01, UC-02, UC-03, UC-04 via right gutter x=83.0 and horizontal gap y=78.0
    draw_ortho_link([(85.2, 82.0), (80.25, 82.0)], color='#7C3AED')
    draw_ortho_link([(83.0, 82.0), (83.0, 85.0), (59.0, 85.0), (59.0, 83.9)], color='#7C3AED')
    draw_ortho_link([(83.0, 82.0), (83.0, 74.0), (80.25, 74.0)], color='#7C3AED')
    draw_ortho_link([(83.0, 78.0), (59.0, 78.0), (59.0, 75.9)], color='#7C3AED')

    # --- KHỐI 5: TIÊU HỦY HÀNG HỎNG & SỔ HAO HỤT TÀI CHÍNH (SoD) ---
    box5 = FancyBboxPatch((51.2, 47.0), 31.0, 19.7, boxstyle="round,pad=0.4,rounding_size=0.8",
                          facecolor='#FAF5FF', edgecolor='#9333EA', linewidth=1.4, linestyle=':', zorder=2)
    ax.add_patch(box5)
    ax.text(52.0, 65.8, "PHÂN HỆ 5: TIÊU HỦY BẤT KIÊM NHIỆM (SoD) & SỔ HAO HỤT", fontsize=9.6, fontweight='bold', color='#7E22CE')

    draw_uc(59, 58.5, 13.0, 4.0, "Lập đề xuất tiêu hủy\nhàng hỏng/quá date (STF-06)", "UC-11", '#F3E8FF', '#9333EA')
    draw_uc(73.5, 58.5, 13.5, 4.0, "Phê duyệt tiêu hủy (SoD)\n& Chốt Sổ hao hụt (MGR-06)", "UC-12", '#F3E8FF', '#9333EA')
    draw_uc(73.5, 51.5, 13.0, 3.5, "Tính tổn thất tài chính\nCostLoss = Qty * GiaVon", "UC-12.1", '#FAF5FF', '#A855F7', is_sub=True)
    draw_uc(59, 51.5, 13.0, 3.5, "Trừ kho về 0 & Đổi trạng\nthái lô sang DISPOSED", "UC-12.2", '#FAF5FF', '#A855F7', is_sub=True)

    # STAFF -> UC-11 via horizontal gap y=67.6 and center gutter x=50.2
    draw_ortho_link([(16.8, 67.6), (50.2, 67.6), (50.2, 58.5), (52.5, 58.5)], color='#059669')
    # MANAGER -> UC-12 via right gutter x=83.0
    draw_ortho_link([(85.2, 49.0), (83.0, 49.0), (83.0, 58.5), (80.25, 58.5)], color='#DC2626')
    draw_relation(65.5, 58.5, 66.8, 58.5, "<<include>>", color='#9333EA')
    draw_relation(73.5, 56.5, 73.5, 53.3, "<<include>>", color='#9333EA')
    draw_relation(70.0, 56.8, 63.5, 53.3, "<<include>>", color='#9333EA')

    # --- KHỐI 6: DỰ BÁO AI LIGHTGBM, TỐI ƯU ĐẶT HÀNG & ĐIỀU CHUYỂN OR-TOOLS ---
    box6 = FancyBboxPatch((51.2, 3.0), 31.0, 42.2, boxstyle="round,pad=0.4,rounding_size=0.8",
                          facecolor='#EFF6FF', edgecolor='#2563EB', linewidth=1.4, linestyle=':', zorder=2)
    ax.add_patch(box6)
    ax.text(52.0, 44.3, "PHÂN HỆ 6: DỰ BÁO AI (LIGHTGBM) & ĐIỀU CHUYỂN (OR-TOOLS)", fontsize=9.6, fontweight='bold', color='#1D4ED8')

    draw_uc(59, 37.5, 13.2, 4.0, "Dự báo nhu cầu 7 ngày bằng\nLightGBM (OWN-05 / MGR-05)", "UC-13", '#DBEAFE', '#2563EB')
    draw_uc(73.5, 37.5, 13.5, 4.0, "Tối ưu đặt hàng ROP & Điều\nchuyển bằng OR-Tools", "UC-14", '#DBEAFE', '#2563EB')
    draw_uc(59, 28.5, 13.2, 4.0, "Lập & Duyệt đơn nhập PO\ngửi Kho tổng DC (OWN-07/MGR-07)", "UC-15", '#DBEAFE', '#2563EB')
    draw_uc(73.5, 28.5, 13.5, 4.0, "Đề xuất, Duyệt & Giao nhận\nĐiều chuyển kho (OWN-08/MGR-08/STF-07)", "UC-16", '#DBEAFE', '#2563EB')
    draw_uc(59, 18.0, 13.2, 4.0, "Xem Dashboard & Báo cáo\ntoàn chuỗi/chi nhánh (OWN-09/MGR-09)", "UC-17", '#DBEAFE', '#2563EB')
    draw_uc(73.5, 18.0, 13.5, 4.0, "Bàn giao ca trực điện tử 4 bước\n& Đối soát két (MGR-03/STF-04)", "UC-18", '#DBEAFE', '#2563EB')

    draw_relation(65.6, 37.5, 66.8, 37.5, "<<include>>", color='#2563EB')
    draw_relation(69.0, 35.5, 62.0, 30.5, "<<include>>", color='#2563EB')
    draw_relation(73.5, 35.5, 73.5, 30.5, "<<include>>", color='#2563EB')

    # OWNER -> Khối 6 via right gutter x=83.8
    draw_ortho_link([(85.2, 78.5), (83.8, 78.5), (83.8, 37.5), (80.25, 37.5)], color='#7C3AED')
    draw_ortho_link([(83.8, 37.5), (83.8, 29.2), (80.25, 29.2)], color='#7C3AED')

    # MANAGER -> Khối 6 via right gutter x=83.0 and internal gap y=23.2 / y=33.0
    draw_ortho_link([(83.0, 48.0), (83.0, 36.8), (80.25, 36.8)], color='#DC2626')
    draw_ortho_link([(83.0, 36.8), (83.0, 28.0), (80.25, 28.0)], color='#DC2626')
    draw_ortho_link([(83.0, 33.0), (59.0, 33.0), (59.0, 30.5)], color='#DC2626')
    draw_ortho_link([(83.0, 28.0), (83.0, 18.0), (80.25, 18.0)], color='#DC2626')
    draw_ortho_link([(83.0, 23.2), (59.0, 23.2), (59.0, 20.0)], color='#DC2626')

    # DC SUPPLIER -> UC-15 via bottom channel y=12.0 and center gutter x=50.5
    draw_ortho_link([(85.2, 14.0), (83.4, 14.0), (83.4, 12.0), (50.5, 12.0), (50.5, 28.5), (52.4, 28.5)], color='#2563EB')

    # STAFF -> UC-16 & UC-18 via bottom channel y=2.4 and right-side internal route
    draw_ortho_link([(16.8, 13.5), (16.8, 2.4), (73.5, 2.4), (73.5, 16.0)], color='#059669')
    draw_ortho_link([(50.2, 58.5), (50.2, 23.8), (73.5, 23.8), (73.5, 26.5)], color='#059669')

    # =========================================================================
    # 6. BẢNG CHÚ THÍCH UML (LEGEND)
    # =========================================================================
    leg_box = FancyBboxPatch((1.5, 1.8), 13.5, 18.5, boxstyle="round,pad=0.4,rounding_size=0.4",
                             facecolor='#FFFFFF', edgecolor='#94A3B8', linewidth=1.4, zorder=4)
    ax.add_patch(leg_box)
    ax.text(8.2, 18.8, "CHÚ THÍCH KÝ HIỆU UML", ha='center', fontsize=9.5, fontweight='bold', color='#0F172A', zorder=5)
    
    ax.plot([2.5, 5.5], [16.5, 16.5], color='#2563EB', lw=1.8, zorder=5)
    ax.text(6.2, 16.5, "Đường liên kết Actor", va='center', fontsize=8.2, fontweight='medium', color='#1E293B', zorder=5)

    ax.plot([2.5, 5.5], [14.0, 14.0], color='#0284C7', lw=1.6, ls='--', zorder=5)
    ax.text(6.2, 14.0, "«include» / «extend»", va='center', fontsize=8.2, fontweight='medium', color='#1E293B', zorder=5)

    el_leg1 = patches.Ellipse((4.0, 11.2), 2.8, 1.5, fc='#CCFBF1', ec='#0D9488', lw=1.8, zorder=5)
    ax.add_patch(el_leg1)
    ax.text(6.2, 11.2, "Use Case chính (Core)", va='center', fontsize=8.2, fontweight='medium', color='#1E293B', zorder=5)

    el_leg2 = patches.Ellipse((4.0, 8.4), 2.8, 1.5, fc='#F0FDFA', ec='#14B8A6', lw=1.4, ls='--', zorder=5)
    ax.add_patch(el_leg2)
    ax.text(6.2, 8.4, "Sub-Use Case", va='center', fontsize=8.2, fontweight='medium', color='#1E293B', zorder=5)

    ax.text(8.2, 5.5, "Chuẩn đồ án tốt nghiệp\nKhoa CNTT - ĐH Lạc Hồng", ha='center', fontsize=8.2, 
            fontweight='bold', color='#1E40AF', zorder=5)
    ax.text(8.2, 3.2, "GVHD: ThS. Lê Minh Nhật\nSV: Đỗ Tấn Du & Đoàn Minh Quân", ha='center', fontsize=7.6, 
            fontstyle='italic', color='#334155', zorder=5)

    out_img_path = r"c:\thuyet minh\Docs\Diagram_Images\use_case.png"
    plt.tight_layout()
    plt.savefig(out_img_path, dpi=220, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Generated orthogonal 3-Actor Use Case Diagram: {out_img_path}")

if __name__ == "__main__":
    draw_full_use_case_diagram()
