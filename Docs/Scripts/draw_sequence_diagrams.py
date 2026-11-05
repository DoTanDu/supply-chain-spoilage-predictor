# -*- coding: utf-8 -*-
"""
SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS - LIGHT MODE RÕ NÉT TRÊN MÁY CHIẾU)
1. ProcessFefoSaleUseCase: Bán lẻ POS trừ kho FEFO & Tự động bẻ đơn qua nhiều lô (Rule 2, 3)
2. ReceiveDCBatchUseCase: Tiếp nhận xe tải DC kiểm định RSL >= 70% & Khóa lưu từ chối (Rule 7)
Đại học Lạc Hồng (LHU) - GVHD: ThS. Lê Minh Nhật
Sinh viên: Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946)
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

# =============================================================================
# SƠ ĐỒ 1: BÁN HÀNG POS FEFO BẺ LÔ (PROCESS FEFO SALE - LIGHT MODE)
# =============================================================================
def draw_sequence_fefo_sale():
    fig, ax = plt.subplots(figsize=(32, 22), dpi=240)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    bg_color = '#F8FAFC'
    fig.patch.set_facecolor(bg_color)
    ax.set_facecolor(bg_color)

    # 1. Header
    h_box = FancyBboxPatch((2.0, 93.0), 96.0, 5.8, boxstyle="round,pad=0.3,rounding_size=0.6",
                           facecolor='#FFFFFF', edgecolor='#059669', linewidth=2.2)
    ax.add_patch(h_box)
    ax.text(50.0, 96.6, "SƠ ĐỒ TUẦN TỰ: BÁN LẺ POS TRỪ KHO FEFO & BẺ NHỎ ĐƠN QUA NHIỀU LÔ",
            ha='center', va='center', fontsize=18, fontweight='bold', color='#0F172A')
    ax.text(50.0, 94.4, "ProcessFefoSaleUseCase | Tuân thủ Rule 2 (FEFO tuyệt đối) & Rule 3 (Chống tồn kho âm với UPDLOCK, ROWLOCK)",
            ha='center', va='center', fontsize=11.5, fontweight='bold', color='#047857')

    # 2. Định nghĩa Lifelines (7 thành phần)
    lifelines = [
        ("Nhân viên (STAFF)", "Actor quầy POS", '#1D4ED8', '#EFF6FF', 8.0),
        ("PosCheckoutView", "React SPA", '#0369A1', '#F0F9FF', 22.0),
        ("SalesController", "REST API", '#4338CA', '#EEF2FF', 36.0),
        ("ProcessFefoSale", "Use Case", '#7E22CE', '#FAF5FF', 50.0),
        ("FefoAllocationPolicy", "Domain Policy", '#BE185D', '#FDF2F8', 64.0),
        ("SqlBatchRepository", "Infrastructure", '#B45309', '#FFFBEB', 78.0),
        ("SQL Server LocalDB", "Database 3NF", '#B91C1C', '#FFF1F2', 92.0)
    ]

    top_y = 89.0
    bot_y = 6.0

    for name, sub, col, bg_card, lx in lifelines:
        # Hộp đối tượng trên đỉnh
        box = FancyBboxPatch((lx - 5.5, top_y - 3.8), 11.0, 3.8, boxstyle="round,pad=0.1,rounding_size=0.4",
                             facecolor=bg_card, edgecolor=col, linewidth=1.8, zorder=5)
        ax.add_patch(box)
        ax.text(lx, top_y - 1.4, name, ha='center', va='center', fontsize=9.2, fontweight='bold', color=col, zorder=6)
        ax.text(lx, top_y - 2.8, f"[{sub}]", ha='center', va='center', fontsize=7.6, fontstyle='italic', color='#334155', zorder=6)

        # Đường timeline nét đứt
        ax.plot([lx, lx], [top_y - 3.8, bot_y], color='#94A3B8', linestyle='--', linewidth=1.4, zorder=1)

        # Hộp đối tượng dưới đáy
        box_bot = FancyBboxPatch((lx - 5.5, bot_y - 3.5), 11.0, 3.5, boxstyle="round,pad=0.1,rounding_size=0.4",
                                 facecolor=bg_card, edgecolor=col, linewidth=1.6, zorder=5)
        ax.add_patch(box_bot)
        ax.text(lx, bot_y - 1.7, name, ha='center', va='center', fontsize=8.6, fontweight='bold', color=col, zorder=6)

    # 3. Hàm vẽ Message (Mũi tên gọi đồng bộ hoặc phản hồi)
    def msg(x1, x2, y, label, is_return=False, color='#1D4ED8', note=""):
        style = "--" if is_return else "-"
        arr_style = "-|>"
        ax.annotate("", xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle=arr_style, linestyle=style, color=color, lw=1.8),
                    zorder=8)
        mx = (x1 + x2) / 2
        ax.text(mx, y + 0.75, label, ha='center', va='center', fontsize=8.2, fontweight='bold', color=color,
                bbox=dict(boxstyle="round,pad=0.18", facecolor='#FFFFFF', edgecolor=color, lw=0.9),
                zorder=10)
        if note:
            ax.text(mx, y - 0.7, note, ha='center', va='center', fontsize=7.2, fontstyle='italic', color='#475569', zorder=10)

    # 4. Các bước tuần tự (Sequence Steps)
    msg(8.0, 22.0, 82.5, "1. Quét Barcode SKU + Nhập số lượng (vd: Mua 5 gói)", color='#1D4ED8')
    msg(8.0, 22.0, 78.5, "2. Chọn cờ Thời tiết & Lễ, bấm [Thanh toán]", color='#1D4ED8')
    msg(22.0, 36.0, 74.5, "3. POST /api/sales/checkout { items, weather, holiday } [JWT]", color='#4338CA')
    msg(36.0, 50.0, 70.5, "4. execute(checkoutDto)", color='#7E22CE')
    msg(50.0, 78.0, 66.5, "5. findAvailableBatches(productId, storeId)", color='#B45309')
    msg(78.0, 92.0, 62.5, "6. SELECT batches WHERE current_quantity > 0 ORDER BY expiry_date ASC (UPDLOCK)", color='#B91C1C')
    msg(92.0, 78.0, 58.5, "7. Trả danh sách lô [Lô 1: tồn 3, Lô 2: tồn 10]", is_return=True, color='#334155')
    msg(78.0, 50.0, 55.0, "8. Trả danh sách lô khả dụng", is_return=True, color='#334155')

    msg(50.0, 64.0, 51.0, "9. allocateBatches(batches, requestedQty = 5)", color='#BE185D')

    # Khung ALT: Bẻ đơn qua nhiều lô (Split Order Scenario)
    alt_box = FancyBboxPatch((46.0, 34.0), 48.5, 14.5, boxstyle="round,pad=0.2,rounding_size=0.4",
                             facecolor='#EFF6FF', edgecolor='#2563EB', linewidth=1.8, linestyle='--', zorder=3)
    ax.add_patch(alt_box)
    ax.text(47.5, 47.0, "FRAME: BẺ NHỎ ĐƠN HÀNG QUA NHIỀU LÔ (RULE 2 & RULE 3)",
            ha='left', va='center', fontsize=8.5, fontweight='bold', color='#1E40AF', zorder=4)

    ax.text(64.0, 44.0, "• Lô 1 (Hạn gần nhất): Khấu trừ 3 -> Tồn về 0, áp dụng Quick Markdown (nếu có)",
            ha='center', va='center', fontsize=8.0, fontweight='bold', color='#0F172A', zorder=5)
    ax.text(64.0, 41.5, "• Lô 2 (Hạn kế tiếp): Khấu trừ 2 -> Tồn còn 8 (Đảm bảo current_quantity >= 0)",
            ha='center', va='center', fontsize=8.0, fontweight='bold', color='#0F172A', zorder=5)

    msg(64.0, 50.0, 37.0, "10. Trả về kết quả phân bổ bẻ lô [{Lô 1, qty: 3}, {Lô 2, qty: 2}]", is_return=True, color='#BE185D')

    msg(50.0, 78.0, 31.0, "11. updateBatchQuantities & recordSales & writeAuditLog", color='#B45309')
    msg(78.0, 92.0, 27.0, "12. COMMIT TRANSACTION [Cập nhật batches, sales_history, system_audit_logs]", color='#B91C1C')
    msg(92.0, 78.0, 23.0, "13. Giao dịch thành công (0 ms)", is_return=True, color='#047857')
    msg(78.0, 50.0, 19.5, "14. Hoàn tất trừ kho FEFO", is_return=True, color='#047857')
    msg(50.0, 36.0, 16.0, "15. Trả về InvoiceDto (Chi tiết 2 dòng bẻ lô)", is_return=True, color='#7E22CE')
    msg(36.0, 22.0, 12.5, "16. 200 OK { success: true, invoice }", is_return=True, color='#4338CA')
    msg(22.0, 8.0, 9.0, "17. In hóa đơn chi tiết từng mã lô & Báo thành công", is_return=True, color='#1D4ED8')

    ax.text(50.0, 1.2, "Khoa CNTT - Trường Đại học Lạc Hồng (LHU) | Đồ án Tốt nghiệp: SmartSupply AI - Quản trị Bán lẻ Chống lãng phí | GVHD: ThS. Lê Minh Nhật",
            ha='center', va='center', fontsize=10.2, fontweight='bold', color='#334155')

    out_file = "c:/thuyet minh/Docs/Diagram_Images/sequence_fefo_sale.png"
    plt.tight_layout()
    plt.savefig(out_file, format='png', dpi=240, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    sys.stdout.buffer.write(f"Đã xuất sơ đồ Tuần tự Bán hàng FEFO (Light Mode) tại: {out_file}\n".encode('utf-8'))

# =============================================================================
# SƠ ĐỒ 2: TIẾP NHẬN DC KIỂM ĐỊNH RSL >= 70% (RECEIVE DC BATCH - LIGHT MODE)
# =============================================================================
def draw_sequence_dc_intake():
    fig, ax = plt.subplots(figsize=(32, 22), dpi=240)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    bg_color = '#F8FAFC'
    fig.patch.set_facecolor(bg_color)
    ax.set_facecolor(bg_color)

    # 1. Header
    h_box = FancyBboxPatch((2.0, 93.0), 96.0, 5.8, boxstyle="round,pad=0.3,rounding_size=0.6",
                           facecolor='#FFFFFF', edgecolor='#D97706', linewidth=2.2)
    ax.add_patch(h_box)
    ax.text(50.0, 96.6, "SƠ ĐỒ TUẦN TỰ: TIẾP NHẬN HÀNG DC & KIỂM ĐỊNH DATE ĐẦU VÀO (RSL >= 70%)",
            ha='center', va='center', fontsize=18, fontweight='bold', color='#0F172A')
    ax.text(50.0, 94.4, "ReceiveDCBatchUseCase | Tuân thủ Rule 7 (Inbound Freshness Rule: RSL >= 70% mới nhận) & Chặn đẩy date cũ từ DC",
            ha='center', va='center', fontsize=11.5, fontweight='bold', color='#B45309')

    lifelines = [
        ("Nhân viên (STAFF)", "Actor cổng kho", '#1D4ED8', '#EFF6FF', 8.0),
        ("DcIntakeView", "React SPA", '#0369A1', '#F0F9FF', 22.0),
        ("BatchController", "REST API", '#4338CA', '#EEF2FF', 36.0),
        ("ReceiveDCBatch", "Use Case", '#7E22CE', '#FAF5FF', 50.0),
        ("FreshnessPolicy", "Domain Policy", '#BE185D', '#FDF2F8', 64.0),
        ("SqlBatchRepository", "Infrastructure", '#B45309', '#FFFBEB', 78.0),
        ("SQL Server LocalDB", "Database 3NF", '#B91C1C', '#FFF1F2', 92.0)
    ]

    top_y = 89.0
    bot_y = 6.0

    for name, sub, col, bg_card, lx in lifelines:
        box = FancyBboxPatch((lx - 5.5, top_y - 3.8), 11.0, 3.8, boxstyle="round,pad=0.1,rounding_size=0.4",
                             facecolor=bg_card, edgecolor=col, linewidth=1.8, zorder=5)
        ax.add_patch(box)
        ax.text(lx, top_y - 1.4, name, ha='center', va='center', fontsize=9.2, fontweight='bold', color=col, zorder=6)
        ax.text(lx, top_y - 2.8, f"[{sub}]", ha='center', va='center', fontsize=7.6, fontstyle='italic', color='#334155', zorder=6)

        ax.plot([lx, lx], [top_y - 3.8, bot_y], color='#94A3B8', linestyle='--', linewidth=1.4, zorder=1)

        box_bot = FancyBboxPatch((lx - 5.5, bot_y - 3.5), 11.0, 3.5, boxstyle="round,pad=0.1,rounding_size=0.4",
                                 facecolor=bg_card, edgecolor=col, linewidth=1.6, zorder=5)
        ax.add_patch(box_bot)
        ax.text(lx, bot_y - 1.7, name, ha='center', va='center', fontsize=8.6, fontweight='bold', color=col, zorder=6)

    def msg(x1, x2, y, label, is_return=False, color='#1D4ED8'):
        style = "--" if is_return else "-"
        arr_style = "-|>"
        ax.annotate("", xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle=arr_style, linestyle=style, color=color, lw=1.8),
                    zorder=8)
        mx = (x1 + x2) / 2
        ax.text(mx, y + 0.75, label, ha='center', va='center', fontsize=8.2, fontweight='bold', color=color,
                bbox=dict(boxstyle="round,pad=0.18", facecolor='#FFFFFF', edgecolor=color, lw=0.9),
                zorder=10)

    # Các bước tuần tự
    msg(8.0, 22.0, 83.0, "1. Nhập SKU, Ngày SX, Hạn sử dụng, Số lượng kiện", color='#1D4ED8')
    msg(22.0, 22.0, 79.5, "2. Tính hiển thị Freshness Gauge trực quan", color='#0369A1')
    msg(8.0, 22.0, 76.0, "3. Bấm xác nhận tiếp nhận kiện hàng xe tải DC", color='#1D4ED8')
    msg(22.0, 36.0, 72.0, "4. POST /api/batches/receive-inbound { productId, mfg, exp, qty }", color='#4338CA')
    msg(36.0, 50.0, 68.0, "5. execute(inboundDto)", color='#7E22CE')
    msg(50.0, 64.0, 64.0, "6. calculateInboundRsl(mfgDate, expDate, importDate)", color='#BE185D')
    msg(64.0, 50.0, 60.5, "7. Trả kết quả RSL (%) = (HSD - Nhập)/(HSD - SX) * 100%", is_return=True, color='#BE185D')

    # KHUNG ALT RẼ NHÁNH: RSL < 70% vs RSL >= 70%
    fail_box = FancyBboxPatch((4.0, 44.5), 90.0, 13.5, boxstyle="round,pad=0.2,rounding_size=0.4",
                              facecolor='#FFF1F2', edgecolor='#E11D48', linewidth=1.8, linestyle='--', zorder=3)
    ax.add_patch(fail_box)
    ax.text(5.5, 56.5, "[ALT NHÁNH 1: RSL < 70% - KHÔNG ĐẠT CHUẨN ĐẦU VÀO (RULE 7)]",
            ha='left', va='center', fontsize=8.5, fontweight='bold', color='#9F1239', zorder=4)

    msg(50.0, 36.0, 52.5, "8a. Ném ngoại lệ InboundFreshnessViolationException (RSL < 70%)", is_return=True, color='#BE123C')
    msg(36.0, 22.0, 48.5, "9a. 400 Bad Request { error: 'Từ chối nhận: Hạn dùng chỉ còn < 70%' }", is_return=True, color='#BE123C')
    msg(22.0, 8.0, 45.0, "10a. Khóa nút lưu, hiển thị cảnh báo đỏ từ chối nhận xe tải DC", is_return=True, color='#BE123C')

    pass_box = FancyBboxPatch((4.0, 8.5), 90.0, 33.5, boxstyle="round,pad=0.2,rounding_size=0.4",
                              facecolor='#ECFDF5', edgecolor='#059669', linewidth=1.8, linestyle='--', zorder=3)
    ax.add_patch(pass_box)
    ax.text(5.5, 40.5, "[ALT NHÁNH 2: RSL >= 70% - ĐẠT CHUẨN TƯƠI MỚI (CHẤP NHẬN NHẬP KHO)]",
            ha='left', va='center', fontsize=8.5, fontweight='bold', color='#065F46', zorder=4)

    msg(50.0, 64.0, 37.0, "8b. generateBatchCode(productId, importDate) -> LOT-DC-SP01-20261012", color='#BE185D')
    msg(64.0, 50.0, 33.5, "9b. Trả về mã lô hợp chuẩn duy nhất", is_return=True, color='#BE185D')
    msg(50.0, 78.0, 30.0, "10b. createBatch & createGoodsReceipt & writeAuditLog", color='#B45309')
    msg(78.0, 92.0, 26.5, "11b. INSERT goods_receipts, batches, system_audit_logs", color='#B91C1C')
    msg(92.0, 78.0, 23.0, "12b. Commit SQL thành công", is_return=True, color='#047857')
    msg(78.0, 50.0, 19.5, "13b. Tạo lô thành công (current_quantity = initial_quantity)", is_return=True, color='#047857')
    msg(50.0, 36.0, 16.0, "14b. Trả về BatchDto kèm mã vạch Barcode", is_return=True, color='#7E22CE')
    msg(36.0, 22.0, 12.5, "15b. 201 Created { success: true, batch }", is_return=True, color='#4338CA')
    msg(22.0, 8.0, 9.5, "16b. Báo nhập thành công & Kích hoạt in tem Barcode dán lên kiện", is_return=True, color='#047857')

    ax.text(50.0, 1.2, "Khoa CNTT - Trường Đại học Lạc Hồng (LHU) | Đồ án Tốt nghiệp: SmartSupply AI - Quản trị Bán lẻ Chống lãng phí | GVHD: ThS. Lê Minh Nhật",
            ha='center', va='center', fontsize=10.2, fontweight='bold', color='#334155')

    out_file = "c:/thuyet minh/Docs/Diagram_Images/sequence_dc_intake.png"
    plt.tight_layout()
    plt.savefig(out_file, format='png', dpi=240, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    sys.stdout.buffer.write(f"Đã xuất sơ đồ Tuần tự Tiếp nhận DC (Light Mode) tại: {out_file}\n".encode('utf-8'))

if __name__ == '__main__':
    draw_sequence_fefo_sale()
    draw_sequence_dc_intake()
