# -*- coding: utf-8 -*-
"""
Script chuẩn hóa Mục 16 trong file Word Docx:
Docs/Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx
"""
import sys
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_run_font(run, name='Times New Roman', size_pt=12, bold=False, italic=False, color_rgb=(0, 0, 0)):
    run.font.name = name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor(*color_rgb)

def add_p_after(ref_element, text, bold=False, italic=False, size_pt=12, color_rgb=(0, 0, 0), space_after=6):
    new_p = OxmlElement('w:p')
    pPr = OxmlElement('w:pPr')
    sp = OxmlElement('w:spacing')
    sp.set(qn('w:after'), str(int(space_after * 20)))
    pPr.append(sp)
    new_p.append(pPr)
    
    new_r = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')
    rFonts = OxmlElement('w:rFonts')
    rFonts.set(qn('w:ascii'), 'Times New Roman')
    rFonts.set(qn('w:hAnsi'), 'Times New Roman')
    rFonts.set(qn('w:cs'), 'Times New Roman')
    rPr.append(rFonts)
    
    sz = OxmlElement('w:sz')
    sz.set(qn('w:val'), str(int(size_pt * 2)))
    rPr.append(sz)
    
    if bold:
        rPr.append(OxmlElement('w:b'))
    if italic:
        rPr.append(OxmlElement('w:i'))
        
    color_el = OxmlElement('w:color')
    color_el.set(qn('w:val'), f'{color_rgb[0]:02X}{color_rgb[1]:02X}{color_rgb[2]:02X}')
    rPr.append(color_el)
    
    new_r.append(rPr)
    t = OxmlElement('w:t')
    t.text = text
    t.set(qn('xml:space'), 'preserve')
    new_r.append(t)
    new_p.append(new_r)
    
    ref_element.addnext(new_p)
    return new_p

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    docx_path = r'c:\thuyet minh\Docs\Dac_Ta_Website_Quan_Ly_Ban_Le_Chong_Lang_Phi.docx'
    bak_path = docx_path + '.bak_sec16'

    shutil.copy2(docx_path, bak_path)
    print(f"Đã sao lưu sang: {bak_path}")

    doc = docx.Document(docx_path)
    body = doc._element.body

    # Tìm vị trí tiêu đề Mục 16 và Bảng RBAC (Table 2)
    sec16_p_idx = -1
    tbl_idx = -1
    for idx, el in enumerate(body):
        tag = el.tag.split('}')[-1]
        if tag == 'p' and el.text and '16. Phân quyền chức năng' in el.text:
            sec16_p_idx = idx
        elif tag == 'tbl' and sec16_p_idx != -1 and tbl_idx == -1:
            tbl_idx = idx

    if sec16_p_idx == -1 or tbl_idx == -1:
        print("Lỗi: Không tìm thấy tiêu đề Mục 16 hoặc bảng RBAC!")
        sys.exit(1)

    print(f"Tìm thấy: sec16_p_idx = {sec16_p_idx}, tbl_idx = {tbl_idx}")

    # 1. Cập nhật tiêu đề Mục 16
    sec16_p = body[sec16_p_idx]
    # Xóa các run cũ
    for r in list(sec16_p):
        if r.tag.split('}')[-1] == 'r':
            sec16_p.remove(r)
    # Thêm run mới
    new_r = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')
    rFonts = OxmlElement('w:rFonts')
    rFonts.set(qn('w:ascii'), 'Times New Roman')
    rFonts.set(qn('w:hAnsi'), 'Times New Roman')
    rPr.append(rFonts)
    sz = OxmlElement('w:sz')
    sz.set(qn('w:val'), '32') # 16pt
    rPr.append(sz)
    rPr.append(OxmlElement('w:b'))
    color_el = OxmlElement('w:color')
    color_el.set(qn('w:val'), '1E3A8A') # Navy
    rPr.append(color_el)
    new_r.append(rPr)
    t = OxmlElement('w:t')
    t.text = "16. Phân quyền chức năng (RBAC Matrix & SoD Separation of Duties)"
    new_r.append(t)
    sec16_p.append(new_r)

    # 2. Chèn nội dung 16.1 và đoạn dẫn trước bảng RBAC
    # Thao tác addnext ngược từ dưới lên hoặc tuần tự
    cur = sec16_p
    cur = add_p_after(cur, "Hệ thống quản trị bán lẻ chống lãng phí LHU Mart vận hành theo mô hình phân quyền dựa trên vai trò (Role-Based Access Control - RBAC) kết hợp nguyên tắc tách biệt trách nhiệm nghiêm ngặt (Separation of Duties - SoD). Kiến trúc này triệt tiêu hoàn toàn rủi ro xung đột lợi ích, ngăn chặn hành vi trục lợi chiết khấu giá, đảm bảo tính toàn vẹn của sổ hao hụt tài chính và duy trì nhật ký kiểm toán bất biến (Rule 11).", size_pt=12, space_after=6)
    
    cur = add_p_after(cur, "16.1  Nguyên tắc Tách biệt Trách nhiệm (SoD Principles in FMCG Retail)", bold=True, size_pt=13, color_rgb=(30, 58, 138), space_after=6)
    
    cur = add_p_after(cur, "Trong vận hành chuỗi bán lẻ hàng tiêu dùng nhanh (FMCG) cận date, rủi ro thất thoát hàng hóa và trục lợi tài chính thường xuất phát từ việc một cá nhân kiêm nhiệm các khâu đối trọng. Hệ thống thiết lập 4 nguyên tắc SoD cốt lõi:", size_pt=12, space_after=6)
    
    cur = add_p_after(cur, "1. Nguyên tắc Chống Tự Duyệt Giá (Anti-Collusion Markdown): Thu ngân (CASHIER) phụ trách thanh toán tiền mặt tại quầy POS tuyệt đối không có thẩm quyền áp dụng Quick Markdown (15%–50%). Nếu cho phép thu ngân tự giảm giá, nhân viên có thể thông đồng với người mua để xả giá sàn rồi chiếm đoạt phần tiền chênh lệch. Thẩm quyền kích hoạt Quick Markdown thuộc độc quyền của Cửa hàng trưởng (STORE_MANAGER) hoặc Quản trị viên (ADMIN), áp dụng đồng bộ toàn hệ thống.", size_pt=12, space_after=6)
    
    cur = add_p_after(cur, "2. Nguyên tắc Phê duyệt Tiêu hủy Hai pha (Two-Phase Disposal Separation - Rule 6): Nhân viên kho (WAREHOUSE_STAFF) hoặc Thu ngân (CASHIER) khi phát hiện hàng hỏng chỉ có quyền lập biên bản đề xuất ở trạng thái chờ duyệt (PENDING) kèm hình ảnh và lý do kiểm định mà không được trừ tồn kho vật lý. Chỉ có Cửa hàng trưởng (STORE_MANAGER) hoặc Quản trị viên (ADMIN) sau khi đối soát trực tiếp mới được bấm nút phê duyệt (APPROVED), kích hoạt Transaction khóa dòng (UPDLOCK, ROWLOCK), trừ kho và chốt số liệu vào Sổ hao hụt tài chính (SpoilageRecords).", size_pt=12, space_after=6)
    
    cur = add_p_after(cur, "3. Nguyên tắc Tách biệt Nhận hàng DC và Mua hàng (Inbound vs Purchasing): Nhân viên kho (WAREHOUSE_STAFF) trực tiếp kiểm đếm xe tải giao hàng từ DC và kiểm soát tiêu chuẩn RSL >= 70%, nhưng không có quyền tạo hoặc duyệt đơn đặt hàng bổ sung (PO). Việc tính toán ROP và phát hành đơn PO gửi DC do Cửa hàng trưởng (STORE_MANAGER) phê duyệt dựa trên dự báo thuật toán bán hàng 14 ngày.", size_pt=12, space_after=6)
    
    cur = add_p_after(cur, "4. Nguyên tắc Bảo mật & Che giấu Số liệu Tài chính Tác nghiệp (Financial Masking): Thu ngân và Nhân viên kho chỉ tiếp cận các trường dữ liệu phục vụ tác nghiệp (Tên SP, SKU, Hạn dùng, Màu cảnh báo, Vị trí kệ, Số lượng tồn). Toàn bộ chỉ số tài chính nhạy cảm (Giá vốn nhập hàng, Giá trị tổng hao hụt, Biên độ lợi nhuận gộp, Báo cáo P&L ca trực) được ẩn (masked) hoàn toàn trên giao diện của hai vai trò này.", size_pt=12, space_after=6)

    cur = add_p_after(cur, "16.2  Bảng Ma trận Phân quyền Toàn diện 4 Vai trò (RBAC Matrix)", bold=True, size_pt=13, color_rgb=(30, 58, 138), space_after=6)
    
    cur = add_p_after(cur, "Hệ thống chuẩn hóa 4 nhóm vai trò (ADMIN, STORE_MANAGER, CASHIER, WAREHOUSE_STAFF) kiểm soát trên toàn bộ 16 chức năng nghiệp vụ của cửa hàng LHU Mart:", size_pt=12, space_after=6)

    # 3. Chèn các tiểu mục 16.3, 16.4, 16.5 vào SAU Bảng RBAC (tbl_idx)
    # Tìm lại phần tử tbl trong body
    tbl_element = None
    for el in body:
        if el.tag.split('}')[-1] == 'tbl':
            tbl_obj = docx.table.Table(el, doc)
            row0 = [c.text.strip().replace('\n', ' ') for c in tbl_obj.rows[0].cells]
            if any('Chức năng' in c or 'Admin' in c for c in row0):
                tbl_element = el
                break

    if not tbl_element:
        print("Lỗi: Không tìm thấy tbl_element!")
        sys.exit(1)

    cur2 = tbl_element
    cur2 = add_p_after(cur2, "16.3  Kiến trúc Xác thực & Phân quyền Kỹ thuật (Technical Enforcement Architecture)", bold=True, size_pt=13, color_rgb=(30, 58, 138), space_after=6)
    
    cur2 = add_p_after(cur2, "Hệ thống bảo vệ phân quyền đa lớp (Multi-layer Defense) từ tầng Gateway/Route Backend đến tầng Trình diễn Frontend:", size_pt=12, space_after=6)

    cur2 = add_p_after(cur2, "16.3.1 Cơ chế Xác thực JWT Bearer Token (authMiddleware):", bold=True, size_pt=12, color_rgb=(17, 24, 39), space_after=4)
    cur2 = add_p_after(cur2, "Sử dụng HMAC-SHA256 (HS256) ký với bí mật môi trường JWT_SECRET. Thời hạn sống của token mặc định 8 giờ (tương ứng đúng thời lượng 1 ca làm việc tiêu chuẩn của nhân viên). Payload chứa các thông tin danh tính tối thiểu: { userId, username, fullName, roleCode, storeId }. Mỗi yêu cầu API đều được kiểm tra qua IUserRepository.findById(userId); nếu người dùng đã bị quản trị viên khóa (isActive = 0), yêu cầu lập tức bị chặn với mã lỗi 401 Unauthorized: Tài khoản không tồn tại hoặc đã bị khóa.", size_pt=12, space_after=6)

    cur2 = add_p_after(cur2, "16.3.2 Cơ chế Phân quyền Tuyệt đối (roleMiddleware):", bold=True, size_pt=12, color_rgb=(17, 24, 39), space_after=4)
    cur2 = add_p_after(cur2, "Áp dụng roleMiddleware(['ROLE_A', 'ROLE_B']) trực tiếp trên từng Route Express. Tài khoản có roleCode === 'ADMIN' được thiết kế bypass tự động toàn bộ mảng kiểm tra vai trò, có toàn quyền xử lý sự cố khẩn cấp. Hệ thống tự động chuẩn hóa song song giữa WAREHOUSE_STAFF và INVENTORY_STAFF. Khi vi phạm thẩm quyền, hệ thống trả về mã lỗi HTTP 403 Forbidden với mã lỗi chuẩn ERR_UNAUTHORIZED_ROLE kèm thông báo giải thích chi tiết.", size_pt=12, space_after=6)

    cur2 = add_p_after(cur2, "16.3.3 Phân quyền Giao diện Người dùng (Client-Side UI Masking):", bold=True, size_pt=12, color_rgb=(17, 24, 39), space_after=4)
    cur2 = add_p_after(cur2, "Component Sidebar.jsx tự động lọc mảng menu allMenuItems dựa trên currentUser.roleCode; những mục không có thẩm quyền sẽ bị ẩn hoàn toàn khỏi thanh điều hướng. Các nút tác vụ đặc quyền (Phê duyệt tiêu hủy, Quick Markdown, Thêm mới sản phẩm, Nhật ký kiểm toán) chỉ render khi vai trò thỏa mãn ['ADMIN', 'STORE_MANAGER']. Ngay khi đăng nhập, hệ thống tự động điều hướng CASHIER về màn hình Bán lẻ POS (/pos-checkout), WAREHOUSE_STAFF về màn hình Tiếp nhận DC (/dc-intake), và Quản trị viên về Dashboard điều hành (/dashboard).", size_pt=12, space_after=6)

    cur2 = add_p_after(cur2, "16.4  Quản trị Vòng đời Tài khoản Nhân sự (Staff Account Lifecycle & Security Guards)", bold=True, size_pt=13, color_rgb=(30, 58, 138), space_after=6)
    cur2 = add_p_after(cur2, "Nhằm bảo đảm an ninh cửa hàng khi có biến động nhân sự ca trực, hệ thống cung cấp phân hệ Quản trị Người dùng (UserManagementView.jsx) với các cơ chế bảo vệ nghiêm ngặt: (1) Khóa/Mở khóa tài khoản tức thì (Instant Account Lock) thông qua endpoint PATCH /api/auth/users/:id/status với body { isActive: false }; (2) Cơ chế Chống Tự Khóa (Self-Lock Prevention) ngăn Quản trị viên tối cao tự khóa tài khoản của chính mình; (3) Cơ chế Chống Tấn công Dò Mật khẩu (Brute-Force Protection) tự động tạm khóa đăng nhập khi nhập sai quá 5 lần và tự reset khi Quản trị viên mở khóa hoặc đặt lại mật khẩu; (4) Mã hóa Mật khẩu Bất đối xứng bằng thuật toán bcrypt với salt rounds = 10, tuyệt đối không lưu mật khẩu dạng văn bản thô.", size_pt=12, space_after=6)

    cur2 = add_p_after(cur2, "16.5  Nhật ký Kiểm toán Bất biến Nghiệp vụ Phân quyền (Rule 11 SSOT)", bold=True, size_pt=13, color_rgb=(30, 58, 138), space_after=6)
    cur2 = add_p_after(cur2, "Mọi thao tác can thiệp vào tài khoản, phân quyền và bảo mật đều phải được ghi lại vĩnh viễn vào bảng system_audit_logs với action_type tương ứng: CREATE_USER, UPDATE_USER, LOCK_USER, UNLOCK_USER, RESET_PASSWORD, CHANGE_PASSWORD, LOGOUT. Ghi nhận đầy đủ: table_name = 'users', record_id, performed_by, description chi tiết và địa chỉ ip_address của máy trạm thực hiện giao dịch. Dữ liệu kiểm toán phân quyền được bảo vệ bất biến (Append-only), không có bất kỳ API nào hỗ trợ thao tác sửa hoặc xóa bản ghi kiểm toán.", size_pt=12, space_after=6)

    doc.save(docx_path)
    print("Đã cập nhật thành công Mục 16 trong file Word Docx SSOT!")

if __name__ == '__main__':
    main()

