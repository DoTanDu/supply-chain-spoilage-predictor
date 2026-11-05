# ĐẶC TẢ CHI TIẾT NHÓM NGƯỜI DÙNG & MA TRẬN PHÂN QUYỀN (RBAC)

> **Dự án:** Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor)
> **Đơn vị:** Khoa Công nghệ Thông tin – Trường Đại học Lạc Hồng (LHU)
> **Giảng viên hướng dẫn:** ThS. Lê Minh Nhật
> **Nhóm sinh viên thực hiện:** Đỗ Tấn Du (123001364) & Đoàn Minh Quân (123000946)
> **Mô hình triển khai:** Cửa hàng Bán lẻ Tinh gọn duy nhất (**LHU Mart** – `RETAIL-STORE-01`) liên kết Trung tâm Phân phối Kho tổng (**DC Biên Hòa**)

---

## 1. NGUYÊN TẮC THIẾT KẾ PHÂN QUYỀN (RBAC PRINCIPLES)

Hệ thống quản trị bán lẻ thực phẩm và hàng FMCG tươi sống đòi hỏi tính kỷ luật cao nhằm triệt tiêu lãng phí do hết hạn sử dụng. Cơ chế phân quyền dựa trên vai trò (**Role-Based Access Control - RBAC**) được thiết kế theo 3 nguyên tắc bất biến:

1. **Nguyên tắc Tách biệt Trách nhiệm (Separation of Duties - SoD):**
   * Người phát hiện hàng hỏng (Nhân viên kho / Thu ngân) **không được tự ý tiêu hủy**.
   * Người ra quyết định giảm giá và hủy hàng (Cửa hàng trưởng) **không thể xóa vết kiểm toán**.
   * Mọi quyết định tài chính đều có cơ chế đối soát chéo nhằm chống thất thoát và gian lận nội bộ.
2. **Nguyên tắc Quyền tối thiểu (Principle of Least Privilege):**
   * Nhân viên thu ngân chỉ thấy màn hình POS và lịch sử ca trực của mình, không được can thiệp vào giá vốn hay danh mục kho.
   * Nhân viên kho chỉ thấy phân hệ tiếp nhận hàng, giám sát date và đảo kệ.
3. **Nguyên tắc Bất biến Kiểm toán (Audit Immutability - Rule 11 SSOT):**
   * Toàn bộ thao tác phân quyền, đổi giá, đảo kệ, xuất kho FEFO và duyệt tiêu hủy đều gắn chặt với định danh tài khoản (`userId`), vai trò (`userRole`), địa chỉ IP thiết bị và thời điểm chính xác (`GETDATE()`) lưu vào bảng `system_audit_logs`.

---

## 2. CHI TIẾT 3 NHÓM NGƯỜI DÙNG (3 ACTOR = 3 VAI TRÒ RBAC) TRONG HỆ THỐNG

```
                    ┌────────────────────────────────────────┐
                    │       CHỦ CHUỖI / QUẢN TRỊ VIÊN        │
                    │               (ADMIN)                  │
                    └───────────────────┬────────────────────┘
                                        │ Cấu hình chuỗi 3 chi nhánh & RBAC
                                        ▼
                    ┌────────────────────────────────────────┐
                    │         QUẢN LÝ CỬA HÀNG               │
                    │         (STORE_MANAGER)                │
                    └───────────────────┬────────────────────┘
                                        │ Phê duyệt xả hàng/hủy hàng & Đơn DC
                                        ▼
                    ┌────────────────────────────────────────┐
                    │   NHÂN VIÊN CỬA HÀNG (POS & KHO KỆ)    │
                    │              (CASHIER)                 │
                    └────────────────────────────────────────┘
                      CỬA RA (POS FEFO) & CỬA VÀO (RSL >= 70% DC)
```

---

### 2.1. Quản trị viên hệ thống (Admin) — RoleCode: `ADMIN`

* **Mã vai trò CSDL:** `ADMIN`
* **Tài khoản mặc định:** `admin` | **Họ tên:** Quản trị viên (Admin)
* **Phạm vi thẩm quyền:** Toàn quyền kỹ thuật, bảo mật tài khoản, tham số cấu hình cửa hàng và cơ sở dữ liệu SQL Server LocalDB.

#### A. Tại sao Admin phải quản lý tài khoản nhân viên? Có tác dụng gì?

* **Cấp phát đúng người, đúng việc:**
  Đảm bảo mỗi nhân sự vào làm việc tại cửa hàng chỉ được cấp đúng vai trò chuyên môn. Thu ngân không thể xem giá vốn hàng nhập; nhân viên kho không thể can thiệp vào doanh thu tiền mặt.
* **Khóa tài khoản khẩn cấp trong 1 giây (`is_active = 0`):**
  Khi có biến động nhân sự (nghỉ việc, đình chỉ công tác, phát hiện biển thủ hàng hóa), Admin lập tức khóa tài khoản trên hệ thống. Ngay lập tức, token xác thực của nhân viên đó bị vô hiệu hóa, không thể đăng nhập POS hay can thiệp vào bất kỳ dữ liệu nào.
* **Ngăn chặn tài khoản ma (Ghost Accounts):**
  Chỉ duy nhất Admin mới có quyền tạo mới hoặc phân quyền, ngăn chặn việc nhân viên tự ý tạo thêm tài khoản phụ để xuất hàng lậu.

#### B. Các tác dụng cốt lõi khác của Admin:

1. **Cấu hình "luật chơi" chống lãng phí cho toàn bộ cửa hàng:**
   * Cấu hình tỷ lệ hạn dùng tối thiểu khi nhận hàng từ DC: $\text{Min } RSL = 70\%$ (Rule 7).
   * Thiết lập số ngày cảnh báo 3 tầng màu: Vùng Vàng ($3 < \text{DaysLeft} \le 7$), Vùng Đỏ ($0 < \text{DaysLeft} \le 3$).
   * Nếu không có Admin cấu hình các tham số này, toàn bộ hệ thống cảnh báo tự động sẽ mất mốc tham chiếu để kích hoạt.
2. **Cấu hình hệ số ngoại cảnh cho thuật toán dự báo ROP (Rule 8):**
   * Cài đặt Trọng số Thời tiết ($W_{factor}$) và Trọng số Ngày lễ ($H_{factor}$) giúp thuật toán Machine Learning / Heuristic tính đúng điểm đặt hàng bổ sung.
3. **Giám sát Sổ Nhật ký Kiểm toán bất biến (System Audit Trail):**
   * Truy vết các hành vi bất thường: Ai đã duyệt đơn tiêu hủy 50 hộp sữa? Ai đã đổi giá xả hàng lúc 23h đêm? Địa chỉ IP nào can thiệp? Đảm bảo tính minh bạch tuyệt đối trước hội đồng quản trị và cơ quan thuế.

---

### 2.2. Cửa hàng trưởng (Store Manager) — RoleCode: `STORE_MANAGER`

* **Mã vai trò CSDL:** `STORE_MANAGER`
* **Tài khoản mặc định:** `manager` | **Họ tên:** Đỗ Tấn Du (Cửa Hàng Trưởng)
* **Phạm vi thẩm quyền:** Điều hành toàn diện hoạt động kinh doanh, chịu trách nhiệm tài chính, doanh thu, lợi nhuận và tỷ lệ hao hụt hàng hóa tại LHU Mart.

#### A. Mục đích và Tác dụng thực tế:

1. **Phê duyệt kích hoạt giảm giá xả hàng Quick Markdown (15%, 30%, 40%, 50% - Rule 4 & 10):**
   * *Tác dụng:* Khi một lô sữa chua hoặc bánh mì rơi vào Vùng Vàng/Đỏ (cận date) và thuật toán phát hiện nguy cơ hết hạn trước khi bán hết ($DOS > DUE$), Cửa hàng trưởng là người duy nhất có quyền bấm kích hoạt chiết khấu.
   * *Ý nghĩa tài chính:* Giúp thu hồi lại giá vốn (Cost Recovery) thay vì chần chừ để hàng quá hạn và phải vứt bỏ, gây thiệt hại 100% giá vốn nhập hàng.
2. **Phê duyệt Biên bản Tiêu hủy & Chốt Sổ hao hụt tài chính (Rule 6):**
   * *Tác dụng:* Ngăn chặn hành vi nhân viên tự ý vứt bỏ hàng hoặc báo khống "hàng hỏng" để chiếm đoạt. Cửa hàng trưởng phải trực tiếp kiểm tra hàng tại khu cách ly, ký duyệt điện tử. Hệ thống tự động hạch toán số tiền mất mát:
     $$
     \text{CostLoss} = \text{Số lượng hủy} \times \text{Giá vốn nhập}
     $$

     vào Sổ hao hụt tài chính bất biến (`SpoilageRecords`).
3. **Phê duyệt Đơn đặt hàng bổ sung gửi DC Biên Hòa (Purchase Orders - Rule 8):**
   * *Tác dụng:* Kiểm soát dòng tiền nhập hàng. Cửa hàng trưởng thẩm định gợi ý đặt hàng của ROP Forecast, cắt giảm những mặt hàng đang tồn đọng nhiều, và chỉ phê duyệt gửi đơn những mặt hàng thực sự có nguy cơ đứt gãy tồn kho an toàn ($Stock < ROP$).
4. **Ký duyệt số hóa Biên bản Bàn giao Ca trực 4 bước (Mục 15 SSOT):**
   * *Tác dụng:* Giám sát và ký chốt điện tử biên bản giao ca giữa ca sáng và ca chiều:
     * Đối soát số tiền mặt thu ngân thu được thực tế so với doanh thu POS tính toán.
     * Đối soát số lượng các lô hàng Vùng Đỏ/Vàng bàn giao trên quầy kệ.
     * Quy định trách nhiệm tài chính cụ thể nếu xảy ra thất thoát tiền két hoặc lệch tồn kho.
5. **Giám sát Dashboard 6 chỉ số KPI tài chính thời gian thực:**
   * Theo dõi: Tổng giá trị tồn kho, Doanh thu hôm nay, Số lô khẩn cấp, Tỷ lệ lãng phí Spoilage Rate %, và Top sản phẩm tiêu thụ mạnh.

---

### 2.3. Nhân viên Cửa hàng - POS & Kho kệ (Store Staff) — RoleCode: `CASHIER`

* **Mã vai trò CSDL:** `CASHIER`
* **Tài khoản mặc định:** `cashier` | **Họ tên:** Đoàn Minh Quân (Nhân Viên Cửa Hàng)
* **Phạm vi thẩm quyền:** Vận hành tác nghiệp toàn diện tại cửa hàng tiện lợi LHU Mart, hợp nhất nhiệm vụ Quầy Bán lẻ POS (cửa ra) và Tiếp nhận hàng DC – Đảo kệ mặt tiền FEFO (cửa vào & quầy kệ).

#### A. Mục đích và Tác dụng thực tế tại Quầy POS (Cửa ra):

1. **Thực thi Bán hàng = Xuất kho trực tiếp tự động theo FEFO (Rule 2 SSOT):**
   * *Tác dụng:* Nhân viên chỉ cần dùng máy quét mã vạch Barcode/SKU sản phẩm. Hệ thống tự động tìm các lô hàng có hạn sử dụng gần nhất (`expiry_date ASC`) để trừ tồn kho trước.
   * *Ý nghĩa chống lãng phí:* Nhân viên **không cần và không được quyền tự chọn lô hàng bằng tay**. Quy trình này loại bỏ hoàn toàn tình trạng bán các lô mới nhập trước và bỏ quên lô cũ dưới đáy kệ.
2. **Hàng rào khóa cứng lô hàng hết hạn (Rule 5 SSOT):**
   * *Tác dụng:* Nếu khách hàng vô tình mang một sản phẩm đã quá date (`DaysLeft <= 0`) ra quầy tính tiền, hệ thống POS **khóa cứng nút thanh toán**, phát âm thanh cảnh báo và hiển thị thông báo đỏ từ chối xuất bán.
   * *Ý nghĩa:* Bảo vệ 100% an toàn vệ sinh thực phẩm cho khách hàng và uy tín thương hiệu LHU Mart.
3. **Áp dụng giá xả hàng tự động:**
   * *Tác dụng:* Nếu lô hàng đang được Cửa hàng trưởng áp dụng Quick Markdown (ví dụ giảm 30%), POS tự động tính giá ưu đãi cho khách mà nhân viên không cần bấm mã giảm giá thủ công.
4. **Ghi nhận ngữ cảnh ngoại cảnh bán lẻ:**
   * *Tác dụng:* Khi bắt đầu ca hoặc trong từng giao dịch, nhân viên xác nhận trạng thái thời tiết (Nắng/Mưa/Bình thường) và ngày lễ trên màn hình POS, cung cấp dữ liệu huấn luyện thực tế cho thuật toán dự báo ROP.

#### B. Mục đích và Tác dụng thực tế tại Kho & Quầy kệ (Cửa vào & Kệ):

1. **Người gác cổng chất lượng từ DC Biên Hòa (Inbound Gatekeeper - Rule 7 SSOT):**
   * *Tác dụng:* Khi xe tải của Kho tổng DC giao hàng đến cửa hàng, nhân viên cửa hàng trực tiếp kiểm tra hạn sử dụng và tính toán tỷ lệ độ tươi còn lại:
     $$
     RSL_{\text{inbound}} = \frac{\text{Expiry Date} - \text{Hôm nay}}{\text{Standard Shelf-Life}} \times 100\%
     $$
   * *Quyền từ chối nhận hàng:* Nếu $RSL < 70\%$, nhân viên **từ chối nhận hàng và hệ thống khóa không cho lập phiếu**. Tác dụng là chặn đứng nguy cơ Tổng kho DC đẩy hàng tồn cận date về cửa hàng bán lẻ.
2. **Nhập phiếu tiếp nhận hàng (Goods Receipts) và tự động tạo Lô mới:**
   * *Tác dụng:* Khi nghiệm thu lô hàng đạt chuẩn ($RSL \ge 70\%$), nhân viên nhập số lượng thực tế nhận được. Hệ thống tự động tạo mã lô mới (`BatchCode`) gắn hạn sử dụng chính xác vào CSDL SQL Server.
3. **Thực thi Quy trình SOP 5 bước đảo kệ mặt tiền (Rule 10 SSOT):**
   * *Tác dụng:* Khi Action Board báo lô hàng rơi vào Vùng Vàng/Đỏ, nhân viên thực hiện 5 bước đảo lô cận date ra sát mép ngoài cùng (mặt tiền kệ) và bấm nút **"Xác nhận đã đảo kệ"** trên phần mềm để lưu vết vào `system_audit_logs`.
4. **Cách ly hàng hỏng, Lập đề xuất tiêu hủy & Bàn giao ca trực:**
   * *Tác dụng:* Thu gom sản phẩm bị rách bao bì hoặc quá hạn vào khu cách ly riêng, lập phiếu đề xuất tiêu hủy (`PENDING`) gửi Cửa hàng trưởng phê duyệt, và thực hiện kiểm đếm tiền mặt két 6 mệnh giá khi bàn giao ca trực.

---

## 3. BẢNG MA TRẬN PHÂN QUYỀN CHỨC NĂNG 3 VAI TRÒ (RBAC MATRIX)

Bảng ma trận đối soát quyền hạn chi tiết giữa 3 vai trò (3 Actor) trên 15 nhóm phân hệ nghiệp vụ của hệ thống:

| STT | Phân hệ / Chức năng nghiệp vụ | Chủ chuỗi / Admin (`ADMIN`) | Quản lý Cửa hàng (`STORE_MANAGER`) | Nhân viên Cửa hàng (`CASHIER`) | Ghi chú kỹ thuật & Nghiệp vụ |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **1** | Đăng nhập hệ thống & Đổi mật khẩu | **Có** | **Có** | **Có** | Xác thực qua JWT Token |
| **2** | Quản trị tài khoản & Khóa người dùng | **Có** | Không (Chặn 403) | Không (Chặn 403) | Ngăn chặn gian lận phân quyền |
| **3** | Cấu hình tham số cửa hàng & DC | **Có** | **Có** | Không (Chặn 403) | Thiết lập StoreProfile, Lead Time |
| **4** | Quản lý danh mục 80 sản phẩm FMCG | **Có** | **Có** | Chỉ xem | Thêm mới, sửa giá, ngừng bán |
| **5** | Giám sát Lô hàng & Cảnh báo 3 màu | **Có** | **Có** | **Có** | Màu Xanh / Vàng / Đỏ trực quan |
| **6** | Bán lẻ POS tự động trừ kho FEFO | **Có** | **Có** | **Có** | Tự động bẻ lô, chặn âm kho |
| **7** | Kích hoạt Quick Markdown xả hàng | **Có** | **Có** | Không (Chặn 403) | Duyệt chiết khấu 15% - 50% |
| **8** | Tiếp nhận hàng DC (Kiểm date RSL) | **Có** | **Có** | **Có** | Nghiệm thu và từ chối nếu $RSL < 70\%$ |
| **9** | Xác nhận SOP 5 bước đảo kệ FEFO | **Có** | **Có** | **Có** | Ký nhận điện tử đảo date mặt tiền |
| **10** | Lập phiếu đề xuất tiêu hủy hàng | **Có** | **Có** | **Có (`PENDING`)** | Thu gom hàng hỏng, gửi yêu cầu |
| **11** | Phê duyệt Tiêu hủy & Sổ hao hụt | **Có** | **Có** | Không (Chặn 403) | Chốt số tiền tổn thất vào Sổ hao hụt |
| **12** | Xem dự báo ROP & Tạo đơn đặt DC | **Có** | **Có** | Chỉ xem ROP | Tạo/duyệt PO chỉ dành cho Quản lý & Admin |
| **13** | Xem Dashboard 6 KPI điều hành | **Có** | **Có** | Không hiển thị | Giám sát Spoilage Rate % & Doanh thu |
| **14** | Ký duyệt Biên bản Bàn giao ca trực | **Có** | **Có** | **Có** | Quy trình bàn giao 4 bước điện tử |
| **15** | Tra cứu Nhật ký kiểm toán AuditLog | **Có** | **Có** | Không (Chặn 403) | Lưu vết bất biến IP, user, action |

---

## 4. QUY TRÌNH PHỐI HỢP LIÊN TỤC GIỮA 3 VAI TRÒ (VALUE CHAIN WORKFLOW)

Quy trình vòng đời của một sản phẩm từ khi nhập kho đến khi tiêu thụ/tiêu hủy minh họa sự phối hợp nhịp nhàng giữa 3 vai trò:

```
[XE TẢI DC BIÊN HÒA ĐẾN]
       │
       ▼
1. NHÂN VIÊN CỬA HÀNG (CASHIER): Kiểm tra RSL >= 70%. Đạt chuẩn -> Lập phiếu Goods Receipt -> Tạo lô mới.
       │
       ▼
2. HỆ THỐNG: Quản lý vòng đời Shelf-life theo thời gian thực (Đồng hồ đếm ngược DaysLeft).
       │
       ├─────────────────────────────────┬─────────────────────────────────┐
       ▼ (Nếu bình thường)               ▼ (Khi DaysLeft <= WarningDays)   ▼ (Khi phát hiện hỏng)
3. NHÂN VIÊN CỬA HÀNG:            4. CỬA HÀNG TRƯỞNG:              7. NHÂN VIÊN CỬA HÀNG:
   Khách mua tại POS.                Duyệt Quick Markdown (30%).      Lập đề xuất tiêu hủy (PENDING).
   Hệ thống tự động xuất FEFO.       │                                │
   Trừ kho không âm.                 ▼                                ▼
                                  5. NHÂN VIÊN CỬA HÀNG:           8. CỬA HÀNG TRƯỞNG:
                                     Đảo kệ 5 bước ra mặt tiền.       Trực tiếp thẩm định.
                                     Dán tem giảm giá 30%.            Ký duyệt tiêu hủy (APPROVED).
                                     │                                Hệ thống chốt Sổ hao hụt.
                                     ▼                                │
                                  6. NHÂN VIÊN CỬA HÀNG:              ▼
                                     Bán xả hàng tại POS (FEFO).   9. CHỦ CHUỖI / ADMIN:
                                     Thu hồi vốn thành công.          Giám sát Audit Logs toàn chuỗi.
```

---

## 5. CÀI ĐẶT KỸ THUẬT VÀ BẢO VỆ DỮ LIỆU (TECHNICAL IMPLEMENTATION)

### 5.1. Cơ sở dữ liệu SQL Server LocalDB

* **Bảng `roles`:** Lưu trữ đúng 3 bản ghi vai trò chuẩn (`1: ADMIN`, `2: STORE_MANAGER`, `3: CASHIER`).
* **Bảng `users`:** Lưu thông tin tài khoản, mật khẩu băm bcrypt, email, số điện thoại và khóa ngoại `role_id` liên kết với bảng `roles`.
* **Ràng buộc toàn vẹn:** Khóa ngoại `FK_Users_Role` bảo đảm toàn vẹn tham chiếu 3NF.

### 5.2. Tầng Backend API (Clean Architecture)

* **Xác thực phiên (Authentication):** Sử dụng JSON Web Token (JWT) với mã hóa khóa bí mật `JWT_SECRET` và cơ chế kiểm tra trạng thái tài khoản thời gian thực.
* **Ủy quyền truy cập (Authorization):** Middleware `roleMiddleware(['ADMIN', 'STORE_MANAGER'])` chặn trực tiếp các yêu cầu không đủ thẩm quyền tại cổng vào API trước khi chạm đến cơ sở dữ liệu.
* **Ghi vết kiểm toán (Audit Trail):** Mọi hành động thêm, sửa, đổi giá, xóa mềm, tiêu hủy đều tự động kích hoạt `SqlAuditLogRepository.log()` ghi vào bảng `system_audit_logs`.

### 5.3. Tầng Giao diện Frontend (React SPA)

* **Điều hướng thông minh:**
  * `CASHIER` ➔ Tự động chuyển hướng vào quầy POS (`/pos-checkout`).
  * `ADMIN` / `STORE_MANAGER` ➔ Tự động mở Dashboard Tổng quan điều hành (`/dashboard`).
* **Menu Sidebar & Route Guard phân quyền động:** Ẩn hoàn toàn các phân hệ mà người dùng không có quyền truy cập và chặn truy cập trực tiếp qua URL.
* **Chuyển đổi ca trực trên Header (Quick Switch User):** Cung cấp hộp thoại chuyển đổi nhanh giữa 3 tài khoản ca làm việc (`admin`, `manager`, `cashier`), yêu cầu nhập mật khẩu xác thực bảo mật.

---

## 6. KẾT LUẬN

Việc thiết kế và chuẩn hóa **3 nhóm người dùng (3 Actor = 3 Vai trò RBAC)** trong hệ thống chính là **công cụ số hóa kỷ luật vận hành chuỗi cung ứng bán lẻ tinh gọn**. Mỗi vai trò tạo thành một mắt xích khép kín:

* **Chủ chuỗi / Admin (`ADMIN`)** tạo ra hành lang pháp lý, cấu hình chuỗi 3 chi nhánh và tham số kỹ thuật an toàn.
* **Cửa hàng trưởng (`STORE_MANAGER`)** bảo vệ dòng tiền, phê duyệt giá xả hàng, duyệt tiêu hủy và ra quyết định đặt hàng DC.
* **Nhân viên Cửa hàng (`CASHIER`)** trực tiếp thực thi chuẩn mực xuất bán POS theo FEFO, kiểm định $RSL \ge 70\%$ khi nhận hàng DC và đảo kệ mặt tiền.

Sự phân định rành mạch này đảm bảo hệ thống đạt được mục tiêu tối thượng của đề tài: **Giảm thiểu tối đa tỷ lệ hư hỏng lãng phí thực phẩm (Zero Spoilage Waste) tại Chuỗi Cửa hàng Bán lẻ Tiện lợi LHU Mart.**
