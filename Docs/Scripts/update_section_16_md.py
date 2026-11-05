# -*- coding: utf-8 -*-
"""
Script chuẩn hóa Mục 16 trong file Markdown:
Docs/Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md
"""
import sys

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    md_path = r'c:\thuyet minh\Docs\Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.md'

    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    sec16_marker = '# 16. Phân quyền chức năng'
    sec17_marker = '# 17. Thiết kế database SQL Server'

    pos16 = content.find(sec16_marker)
    pos17 = content.find(sec17_marker)

    if pos16 == -1 or pos17 == -1:
        print(f"Lỗi: Không tìm thấy mốc đánh dấu Mục 16 hoặc Mục 17 (pos16={pos16}, pos17={pos17})")
        sys.exit(1)

    new_section_16 = """# 16. Phân quyền chức năng (RBAC Matrix & SoD Separation of Duties)

Hệ thống quản trị bán lẻ chống lãng phí LHU Mart vận hành theo mô hình phân quyền dựa trên vai trò (Role-Based Access Control - RBAC) kết hợp nguyên tắc tách biệt trách nhiệm nghiêm ngặt (Separation of Duties - SoD). Kiến trúc này triệt tiêu hoàn toàn rủi ro xung đột lợi ích, ngăn chặn hành vi trục lợi chiết khấu giá, đảm bảo tính toàn vẹn của sổ hao hụt tài chính và duy trì nhật ký kiểm toán bất biến (Rule 11).

---

## 16.1 Nguyên tắc Tách biệt Trách nhiệm (SoD Principles in FMCG Retail)

Trong vận hành chuỗi bán lẻ hàng tiêu dùng nhanh (FMCG) cận date, rủi ro thất thoát hàng hóa và trục lợi tài chính thường xuất phát từ việc một cá nhân kiêm nhiệm các khâu đối trọng. Hệ thống thiết lập 4 nguyên tắc SoD cốt lõi:

1. **Nguyên tắc Chống Tự Duyệt Giá (Anti-Collusion Markdown):**
   - Thu ngân (`CASHIER`) phụ trách thanh toán tiền mặt tại quầy POS **tuyệt đối không có thẩm quyền áp dụng Quick Markdown (15%–50%)**. Nếu cho phép thu ngân tự giảm giá, nhân viên có thể thông đồng với người mua để xả giá sàn rồi chiếm đoạt phần tiền chênh lệch.
   - Thẩm quyền kích hoạt Quick Markdown thuộc độc quyền của Cửa hàng trưởng (`STORE_MANAGER`) hoặc Quản trị viên (`ADMIN`), áp dụng đồng bộ toàn hệ thống.

2. **Nguyên tắc Phê duyệt Tiêu hủy Hai pha (Two-Phase Disposal Separation - Rule 6):**
   - Nhân viên kho (`WAREHOUSE_STAFF`) hoặc Thu ngân (`CASHIER`) khi phát hiện hàng hỏng chỉ có quyền lập biên bản đề xuất ở trạng thái chờ duyệt (`PENDING`) kèm hình ảnh và lý do kiểm định. Thao tác này **không được trừ tồn kho vật lý**.
   - Chỉ có Cửa hàng trưởng (`STORE_MANAGER`) hoặc Quản trị viên (`ADMIN`) sau khi đối soát trực tiếp mới được bấm nút phê duyệt (`APPROVED`), kích hoạt Transaction khóa dòng (`UPDLOCK, ROWLOCK`), trừ kho và chốt số liệu vào Sổ hao hụt tài chính (`SpoilageRecords`). Người lập đề xuất không thể tự phê duyệt đề xuất của chính mình.

3. **Nguyên tắc Tách biệt Nhận hàng DC và Mua hàng (Inbound vs Purchasing):**
   - Nhân viên kho (`WAREHOUSE_STAFF`) trực tiếp kiểm đếm xe tải giao hàng từ DC và kiểm soát tiêu chuẩn `RSL >= 70%`, nhưng **không có quyền tạo hoặc duyệt đơn đặt hàng bổ sung (`PO`)**.
   - Việc tính toán ROP và phát hành đơn PO gửi DC do Cửa hàng trưởng (`STORE_MANAGER`) phê duyệt dựa trên dự báo thuật toán bán hàng 14 ngày.

4. **Nguyên tắc Bảo mật & Che giấu Số liệu Tài chính Tác nghiệp (Financial Masking):**
   - Thu ngân và Nhân viên kho chỉ tiếp cận các trường dữ liệu phục vụ tác nghiệp (Tên SP, SKU, Hạn dùng, Màu cảnh báo, Vị trí kệ, Số lượng tồn).
   - Toàn bộ chỉ số tài chính nhạy cảm (Giá vốn nhập hàng `import_price`, Giá trị tổng hao hụt `cost_loss`, Biên độ lợi nhuận gộp `gross_margin`, Báo cáo P&L ca trực) được ẩn (masked) hoàn toàn trên giao diện của hai vai trò này.

---

## 16.2 Bảng Ma trận Phân quyền Toàn diện 4 Vai trò (RBAC Matrix)

Hệ thống chuẩn hóa 4 nhóm vai trò (`ADMIN`, `STORE_MANAGER`, `CASHIER`, `WAREHOUSE_STAFF`) kiểm soát trên toàn bộ 16 chức năng nghiệp vụ của cửa hàng LHU Mart:

| STT | Chức năng nghiệp vụ & Phân hệ | Admin | Cửa hàng trưởng (STORE_MANAGER) | Thu ngân (CASHIER) | Nhân viên kho (WAREHOUSE_STAFF) | Endpoint API Backend & Bảo vệ |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **1** | Đăng nhập hệ thống (/login) | Toàn quyền | Toàn quyền | Toàn quyền | Toàn quyền | `POST /api/auth/login` (Public) |
| **2** | Quản trị tài khoản, Khóa/Mở khóa nhân sự | Toàn quyền | Không | Không | Không | `PATCH /api/auth/users/:id/status` (ADMIN) |
| **3** | Cấu hình cửa hàng & DC (`StoreProfile`) | Toàn quyền | Được cập nhật | Không | Không | `PUT /api/store-profile` (ADMIN, STORE_MANAGER) |
| **4** | Quản lý danh mục & sản phẩm FMCG (Rule 9) | Toàn quyền | Toàn quyền | Chỉ xem | Chỉ xem | `POST/PUT/DELETE /api/products` (ADMIN, STORE_MANAGER) |
| **5** | Xem danh sách lô hàng & cảnh báo 3 màu | Toàn quyền | Toàn quyền | Toàn quyền | Toàn quyền | `GET /api/batches/alerts` (Tất cả vai trò đã login) |
| **6** | Bán lẻ POS tự động trừ kho FEFO (Rule 2) | Toàn quyền | Toàn quyền | Toàn quyền | **Chặn (403)** | `POST /api/sales` (ADMIN, STORE_MANAGER, CASHIER) |
| **7** | Áp dụng giảm giá Quick Markdown (15%–50%) | Toàn quyền | Toàn quyền | **Chặn (403)** | **Chặn (403)** | `POST /api/batches/:id/discount` (ADMIN, STORE_MANAGER) |
| **8** | Tiếp nhận hàng từ Kho tổng DC (RSL >= 70%) | Toàn quyền | Toàn quyền | **Chặn (403)** | Toàn quyền | `POST /api/batches/receive-dc` (ADMIN, MGR, WAREHOUSE) |
| **9** | Xác nhận SOP 5 bước đảo lô mặt tiền kệ | Toàn quyền | Toàn quyền | **Chặn (403)** | Toàn quyền | `POST /api/batches/:id/rotate` (ADMIN, MGR, WAREHOUSE) |
| **10** | Lập đề xuất tiêu hủy hàng hỏng (PENDING) | Toàn quyền | Toàn quyền | Toàn quyền | Toàn quyền | `POST /api/spoilage` (Tất cả nhân sự) |
| **11** | Phê duyệt tiêu hủy & chốt Sổ hao hụt (Rule 6) | Toàn quyền | Toàn quyền | **Chặn (403)** | **Chặn (403)** | `PATCH /api/spoilage/:id/approve` (ADMIN, STORE_MANAGER) |
| **12** | Xem dự báo nhu cầu bán hàng & ROP (Rule 8) | Toàn quyền | Toàn quyền | Không | Được xem ROP | `GET /api/forecast/demand` (ADMIN, MGR, WAREHOUSE) |
| **13** | Tạo & duyệt đơn đặt hàng PO gửi DC | Toàn quyền | Toàn quyền | **Chặn (403)** | Không | `POST /api/purchase-orders` (ADMIN, STORE_MANAGER) |
| **14** | Xem Dashboard 6 KPI tổng điều hành | Toàn quyền | Toàn quyền | Không | Không | `GET /api/batches/live-stats` (ADMIN, STORE_MANAGER) |
| **15** | Ký biên bản bàn giao ca trực điện tử 4 bước | Toàn quyền | Toàn quyền | Toàn quyền | Toàn quyền | `POST /api/shift-handover` (Tất cả nhân sự ca trực) |
| **16** | Tra cứu Nhật ký kiểm toán (Audit Log) | Toàn quyền | Được tra cứu | Không | Không | `GET /api/audit-logs` (ADMIN, STORE_MANAGER) |

---

## 16.3 Kiến trúc Xác thực & Phân quyền Kỹ thuật (Technical Enforcement Architecture)

Hệ thống bảo vệ phân quyền đa lớp (Multi-layer Defense) từ tầng Gateway/Route Backend đến tầng Trình diễn Frontend:

```mermaid
flowchart TD
    Client["Trình duyệt Client (Frontend SPA)"] -->|HTTP Request + Bearer JWT| AuthMW["authMiddleware (Xác thực Token)"]
    AuthMW -->|Token hợp lệ & isActive=1| RoleMW["roleMiddleware(allowedRoles)"]
    AuthMW -->|Token thiếu / Hết hạn / User bị khóa| Err401["401 Unauthorized / ERR_ACCOUNT_LOCKED"]
    
    RoleMW -->|RoleCode nằm trong allowedRoles hoặc ADMIN| Controller["Controller -> UseCase -> SQL Server"]
    RoleMW -->|RoleCode không khớp| Err403["403 Forbidden / ERR_UNAUTHORIZED_ROLE"]
```

### 16.3.1 Cơ chế Xác thực JWT Bearer Token (`authMiddleware`)
- **Thuật toán & Ký số:** Sử dụng HMAC-SHA256 (`HS256`) ký với bí mật môi trường `JWT_SECRET`.
- **Thời hạn sống Token:** Mặc định `8 giờ` (tương ứng đúng thời lượng 1 ca làm việc tiêu chuẩn của nhân viên).
- **Payload Token:** Chứa các thông tin danh tính tối thiểu: `{ userId, username, fullName, roleCode, storeId }`.
- **Xác thực trạng thái tài khoản thời gian thực:** Mỗi yêu cầu gửi đến API đều kiểm tra qua `IUserRepository.findById(userId)`. Nếu người dùng đã bị quản trị viên khóa (`isActive = 0`), yêu cầu lập tức bị ngắt với mã lỗi `401 Unauthorized: Tài khoản không tồn tại hoặc đã bị khóa`.

### 16.3.2 Cơ chế Phân quyền Tuyệt đối (`roleMiddleware`)
- **Cơ chế bọc Route:** Áp dụng `roleMiddleware(['ROLE_A', 'ROLE_B'])` trực tiếp trên từng Route Express.
- **Quyền tối cao của Quản trị viên:** Tài khoản có `roleCode === 'ADMIN'` được thiết kế bypass tự động toàn bộ mảng kiểm tra vai trò, có toàn quyền xử lý sự cố khẩn cấp.
- **Tương thích danh pháp:** Tự động chuẩn hóa song song giữa `WAREHOUSE_STAFF` và `INVENTORY_STAFF` để đảm bảo tính liên tục của dữ liệu lịch sử.
- **Định dạng lỗi chuẩn hóa khi vi phạm thẩm quyền:**
  ```json
  {
    "success": false,
    "statusCode": 403,
    "code": "ERR_UNAUTHORIZED_ROLE",
    "message": "Từ chối truy cập (403 Forbidden). Chức năng này yêu cầu quyền: [ADMIN, STORE_MANAGER]. Vai trò hiện tại của bạn là: [CASHIER]."
  }
  ```

### 16.3.3 Phân quyền Giao diện Người dùng (Client-Side UI Masking)
- **Lọc thực đơn điều hướng (Sidebar Navigation):** Component `Sidebar.jsx` tự động lọc mảng `allMenuItems` dựa trên `currentUser.roleCode`. Những mục không có thẩm quyền sẽ không hiển thị trên thanh điều hướng.
- **Ẩn nút tác vụ đặc quyền (Action Buttons Masking):** Nút *Phê duyệt tiêu hủy*, nút *Quick Markdown*, nút *Thêm mới sản phẩm* và bảng *Nhật ký kiểm toán* chỉ render khi vai trò thỏa mãn `['ADMIN', 'STORE_MANAGER']`.
- **Tự động chuyển hướng ca trực:** Ngay khi đăng nhập, hệ thống tự động đưa `CASHIER` về màn hình Bán lẻ POS (`/pos-checkout`), đưa `WAREHOUSE_STAFF` về màn hình Tiếp nhận DC (`/dc-intake`), và đưa Quản trị viên về Dashboard điều hành (`/dashboard`).

---

## 16.4 Quản trị Vòng đời Tài khoản Nhân sự (Staff Account Lifecycle & Security Guards)

Nhằm bảo đảm an ninh cửa hàng khi có biến động nhân sự ca trực, hệ thống cung cấp phân hệ Quản trị Người dùng (`UserManagementView.jsx`) với các cơ chế bảo vệ nghiêm ngặt:

1. **Khóa / Mở khóa Tài khoản Tức thì (Instant Account Lock):**
   - Quản trị viên có thể vô hiệu hóa tài khoản ngay lập tức thông qua endpoint `PATCH /api/auth/users/:id/status` với body `{ isActive: false }`.
   - Ngay sau khi bị khóa, mọi yêu cầu API tiếp theo của nhân sự đó đều bị chặn bởi `authMiddleware`.
2. **Cơ chế Chống Tự Khóa (Self-Lock Prevention):**
   - Quản trị viên tối cao đang đăng nhập **tuyệt đối không thể tự khóa tài khoản của chính mình** (`req.user.id === targetId && !isActive`). Hệ thống sẽ từ chối với thông báo: *"Quản trị viên không thể tự khóa tài khoản của chính mình"*, ngăn ngừa rủi ro mất quyền kiểm soát hệ thống.
3. **Cơ chế Chống Tấn công Dò Mật khẩu (Brute-Force Protection):**
   - Đăng nhập sai quá 5 lần liên tiếp sẽ tự động tạm khóa đăng nhập trong 15 phút.
   - Khi Quản trị viên bấm nút Mở khóa (`isActive: true`) hoặc Đặt lại mật khẩu (`ResetPassword`), hệ thống tự động reset bộ đếm `LoginUseCase.resetFailedAttempts(username)`.
4. **Mã hóa Mật khẩu Bất đối xứng (Bcrypt Hashing):**
   - Toàn bộ mật khẩu lưu trữ trong bảng `Users` được băm bằng thuật toán `bcrypt` với `salt rounds = 10`. Tuyệt đối không lưu mật khẩu dạng văn bản thô (plain-text).

---

## 16.5 Nhật ký Kiểm toán Bất biến Nghiệp vụ Phân quyền (Rule 11)

Mọi thao tác can thiệp vào tài khoản, phân quyền và bảo mật đều phải được ghi lại vĩnh viễn vào bảng `AuditLogs` / `system_audit_logs` với đầy đủ thông tin:
- `action`: `CREATE_USER`, `UPDATE_USER`, `LOCK_USER`, `UNLOCK_USER`, `RESET_PASSWORD`, `CHANGE_PASSWORD`, `LOGOUT`.
- `entity_name`: `'users'`.
- `entity_id`: Mã định danh người dùng bị tác động.
- `performed_by`: Tên và ID của Quản trị viên thực hiện hành động.
- `description`: Mô tả chi tiết hành động (ví dụ: `"[Admin] KHÓA tài khoản người dùng: [cashier01] (Nguyễn Văn Thu Ngân) - Vai trò: CASHIER"`).
- `ip_address`: Địa chỉ IP của máy trạm thực hiện giao dịch.

Dữ liệu kiểm toán phân quyền được bảo vệ bất biến (Append-only), không có bất kỳ API nào hỗ trợ thao tác sửa (`UPDATE`) hay xóa (`DELETE`) bản ghi kiểm toán.

---

"""

    updated_content = content[:pos16] + new_section_16 + content[pos17:]

    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)

    print("Đã cập nhật thành công Mục 16 trong file Markdown SSOT!")

if __name__ == '__main__':
    main()

