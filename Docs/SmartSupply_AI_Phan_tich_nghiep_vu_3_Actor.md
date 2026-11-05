# SMARTSUPPLY AI — PHÂN TÍCH NGHIỆP VỤ 3 ACTOR

> **TÀI LIỆU ĐỊNH HƯỚNG TRIỂN KHAI ĐỒ ÁN**
> Hệ thống dự báo nhu cầu tiêu thụ và tối ưu điều phối hàng hóa nhằm giảm lãng phí thực phẩm trong chuỗi bán lẻ.
>
> - **03** ACTOR
> - **26** NHÓM NGHIỆP VỤ
> - **05** BƯỚC QUY TRÌNH
>
> **Phạm vi:** OWNER · MANAGER · STAFF
> *Tài liệu giao nhiệm vụ để sinh viên phân tích và triển khai chi tiết*

---

## 01 / TỔNG QUAN — Phạm vi nghiệp vụ và phân quyền

Website quản trị chuỗi cửa hàng thực phẩm, ứng dụng AI để dự báo nhu cầu, quản lý tồn kho, cảnh báo hàng sắp hết hạn, đề xuất nhập hàng và điều chuyển giữa các cửa hàng.

| Actor | Vai trò | Số nhóm nghiệp vụ |
| :--- | :--- | :-: |
| **OWNER** | Chủ chuỗi / Admin | **10** |
| **MANAGER** | Quản lý cửa hàng | **9** |
| **STAFF** | Nhân viên | **7** |

**Tổng cộng 26 nhóm nghiệp vụ** được phân công cho 3 Actor. Một số nghiệp vụ được chia sẻ giữa các Actor với phạm vi quyền khác nhau.

---

## 02 / OWNER – Chủ chuỗi / Quản trị hệ thống

**10 nhóm nghiệp vụ.** Là người có quyền cao nhất, quản lý toàn bộ chuỗi cửa hàng và hoạt động của hệ thống.

| STT | NGHIỆP VỤ | CHỨC NĂNG TỔNG QUAN |
| :-: | :--- | :--- |
| **1** | **Quản lý tài khoản và phân quyền** | Tạo tài khoản, khóa tài khoản, phân quyền Manager và Staff |
| **2** | **Quản lý chuỗi cửa hàng** | Thêm, sửa, quản lý các chi nhánh thuộc chuỗi |
| **3** | **Quản lý danh mục** | Quản lý sản phẩm, nhóm hàng và nhà cung cấp |
| **4** | **Giám sát kho và đơn hàng** | Theo dõi tồn kho, nhập/xuất và đơn hàng của toàn chuỗi |
| **5** | **Dự báo nhu cầu bằng AI** | Xem dự báo số lượng tiêu thụ theo sản phẩm và cửa hàng |
| **6** | **Quản lý rủi ro lãng phí** | Theo dõi thực phẩm sắp hết hạn, hàng dư thừa và cảnh báo |
| **7** | **Quản lý đề xuất nhập hàng** | Xem và phê duyệt số lượng nhập hàng do hệ thống đề xuất |
| **8** | **Quản lý điều phối hàng hóa** | Phê duyệt điều chuyển hàng giữa các chi nhánh |
| **9** | **Báo cáo và phân tích** | Theo dõi doanh thu, tồn kho, hàng hủy, hiệu quả dự báo và hiệu quả chống lãng phí |
| **10** | **Cấu hình và giám sát hệ thống** | Quản lý cấu hình, lịch sử hoạt động và các thiết lập chung |

> **MỤC TIÊU VAI TRÒ:** OWNER có thể nắm được tình hình toàn chuỗi, biết nơi nào đang dư hoặc thiếu hàng và quyết định phương án tối ưu.

---

## 03 / ACTOR 2: MANAGER – Quản lý cửa hàng

**9 nhóm nghiệp vụ.** Là người chịu trách nhiệm quản lý hoạt động kinh doanh, kho hàng và xử lý các đề xuất AI tại cửa hàng được phân công.

| STT | NGHIỆP VỤ | CHỨC NĂNG TỔNG QUAN |
| :-: | :--- | :--- |
| **1** | **Dashboard cửa hàng** | Xem tình hình kinh doanh và tồn kho của cửa hàng |
| **2** | **Quản lý tồn kho** | Theo dõi hàng nhập, hàng xuất, số lượng tồn và hạn sử dụng |
| **3** | **Quản lý đơn hàng** | Theo dõi, tạo và xử lý đơn hàng |
| **4** | **Quản lý thông tin sản phẩm** | Xem, cập nhật thông tin sản phẩm trong phạm vi được cấp quyền |
| **5** | **Xem dự báo AI** | Xem dự báo sức mua của từng sản phẩm tại cửa hàng |
| **6** | **Xử lý cảnh báo lãng phí** | Theo dõi và xử lý hàng sắp hết hạn, hàng tồn dư |
| **7** | **Quản lý nhập hàng** | Kiểm tra đề xuất AI và lập hoặc duyệt yêu cầu nhập hàng theo thẩm quyền |
| **8** | **Điều phối hàng giữa cửa hàng** | Đề xuất chuyển hàng dư, tiếp nhận yêu cầu và phê duyệt trong phạm vi được giao |
| **9** | **Báo cáo cửa hàng** | Xem doanh thu, tình hình tồn kho và hiệu quả hoạt động cửa hàng |

> **MỤC TIÊU VAI TRÒ:** MANAGER dựa vào dữ liệu và đề xuất của AI để ra quyết định nhập hàng, xử lý hàng tồn và giảm thực phẩm bị hủy.

---

## 04 / ACTOR 3: STAFF – Nhân viên cửa hàng

**7 nhóm nghiệp vụ.** Là người trực tiếp thao tác bán hàng, kiểm tra kho và thực hiện các công việc theo yêu cầu của quản lý.

| STT | NGHIỆP VỤ | CHỨC NĂNG TỔNG QUAN |
| :-: | :--- | :--- |
| **1** | **Xem sản phẩm** | Tra cứu danh sách sản phẩm, nhóm hàng và thông tin cơ bản |
| **2** | **Bán hàng** | Tạo đơn hàng và ghi nhận giao dịch bán hàng |
| **3** | **Nhập kho** | Tiếp nhận và ghi nhận hàng hóa nhập kho |
| **4** | **Xuất kho** | Thực hiện xuất hàng theo nghiệp vụ được phân quyền |
| **5** | **Kiểm tra tồn kho** | Xem số lượng tồn, thông tin lô hàng và hạn sử dụng |
| **6** | **Xử lý cảnh báo** | Xem cảnh báo, ghi nhận hàng hỏng, hàng sắp hết hạn và báo cáo quản lý |
| **7** | **Thực hiện điều chuyển** | Chuẩn bị hàng chuyển đi, xác nhận giao hoặc nhận hàng theo phiếu đã duyệt |

> **MỤC TIÊU VAI TRÒ:** STAFF đảm bảo dữ liệu bán hàng, nhập/xuất kho, hạn sử dụng và giao nhận hàng được cập nhật chính xác để AI có dữ liệu phục vụ dự báo.

---

## 05 / QUY TRÌNH TRỌNG TÂM — Quy trình nghiệp vụ cốt lõi

Sinh viên cần lấy quy trình này làm trung tâm khi phát triển dự án, thay vì chỉ tập trung vào các chức năng CRUD.

| Bước | Tên bước | Mô tả chi tiết |
| :-: | :--- | :--- |
| **01** | **Dữ liệu đầu vào** | STAFF ghi nhận bán hàng, nhập xuất kho, tồn kho và hạn sử dụng. |
| **02** | **AI phân tích và dự báo** | Dự báo nhu cầu, phát hiện hàng dư, hàng thiếu và nguy cơ lãng phí. |
| **03** | **AI đề xuất giải pháp** | Đề xuất nhập thêm, điều chuyển hoặc xử lý hàng sắp hết hạn. |
| **04** | **OWNER / MANAGER ra quyết định** | Kiểm tra, phê duyệt hoặc từ chối đề xuất theo thẩm quyền. |
| **05** | **STAFF thực hiện** | Nhập hàng, xuất hàng, giao nhận và cập nhật kết quả thực tế. |

---

## 06 / Yêu cầu triển khai dành cho sinh viên

Với phạm vi đồ án hiện tại, sinh viên triển khai các nhóm nghiệp vụ đã giao và tuân thủ ba nguyên tắc:

- **Phân quyền:** OWNER quản lý toàn chuỗi; MANAGER quản lý cửa hàng được giao; STAFF thực hiện nghiệp vụ tác nghiệp. Quyền phải được kiểm tra tại Backend, không chỉ ẩn nút trên giao diện.
- **SQL Server:** Các nghiệp vụ ghi dữ liệu quan trọng như tạo đơn hàng, nhập/xuất kho, xác nhận điều chuyển phải đảm bảo tính toàn vẹn dữ liệu bằng Transaction và cơ chế xử lý lỗi phù hợp. Không nên xóa trực tiếp lịch sử giao dịch đã hoàn tất.
- **AI:** Ngoài dự báo nhu cầu, cần triển khai chức năng hỗ trợ quyết định chống lãng phí, đặc biệt là cảnh báo nguy cơ hết hạn, đề xuất nhập hàng và đề xuất điều chuyển giữa các cửa hàng.

> **KẾT LUẬN / PHẠM VI BÀN GIAO**
> Chốt **3 Actor – 26 nhóm nghiệp vụ theo vai trò** (10 OWNER, 9 MANAGER, 7 STAFF). Đây là số nhóm nghiệp vụ để sinh viên phân tích và triển khai chi tiết, **không phải 26 Use Case độc lập hoặc 26 API**.
>
> Sinh viên tiếp tục xây dựng Use Case Diagram, đặc tả nghiệp vụ, thiết kế Database, Stored Procedure, API và giao diện tương ứng.

