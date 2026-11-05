# -*- coding: utf-8 -*-
"""
Script to generate the complete Word specification document for
'Hệ Thống Quản Lý Chuỗi Cung Ứng Bán Lẻ Chống Lãng Phí (Supply Chain Spoilage Predictor)'
matching 100% the exact 27-section structure, style, and tone of 'Website Quản Lý Phòng Lab CNTT.docx'.
"""
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

REF_FILE = "Website Quản Lý Phòng Lab CNTT.docx"
OUTPUT_FILE = "Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.docx"

def build_document():
    # Load base document to inherit all styles, fonts, margins, headers, footers
    doc = Document(REF_FILE)
    
    # Remove existing paragraphs and tables from reference file
    for p in list(doc.paragraphs):
        p._element.getparent().remove(p._element)
    for t in list(doc.tables):
        t._element.getparent().remove(t._element)
        
    def add_h1(text):
        return doc.add_paragraph(text, style='Heading 1')
        
    def add_h2(text):
        return doc.add_paragraph(text, style='Heading 2')
        
    def add_first(text):
        return doc.add_paragraph(text, style='First Paragraph')
        
    def add_body(text):
        return doc.add_paragraph(text, style='Body Text')
        
    def add_code(text):
        return doc.add_paragraph(text, style='Source Code')
        
    # --- TITLE ---
    p_title = add_h1("ĐẶC TẢ WEBSITE QUẢN LÝ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ")
    p_sub = add_h2("Theo Clean Architecture và sử dụng SQL Server (Supply Chain Spoilage Predictor)")

    # --- 1. MỤC TIÊU HỆ THỐNG ---
    add_h1("1. Mục tiêu hệ thống")
    add_first(
        "Xây dựng website quản lý một cửa hàng bán lẻ tinh gọn (Retail Store) duy nhất của ngành FMCG và thực phẩm tiện lợi, "
        "thuộc đề tài 'Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor)'. "
        "Hệ thống cho phép quản lý việc tiếp nhận hàng theo đợt từ Kho tổng (DC Biên Hòa), quản lý danh mục sản phẩm, "
        "kiểm soát hạn sử dụng từng lô (Shelf-Life), cảnh báo cận date đa cấp (Xanh/Vàng/Đỏ), bán lẻ tại quầy POS theo "
        "nguyên tắc FEFO (First Expired, First Out - Bán hàng = Xuất kho), giảm giá xả hàng Quick Markdown, đảo kệ mặt tiền, "
        "tiêu hủy hàng quá date ghi nhận sổ hao hụt tài chính, dự báo nhu cầu tiêu thụ ROP dựa trên tốc độ bán thực tế + "
        "thời tiết + ngày lễ để đề xuất đơn nhập hàng bổ sung gửi về Kho tổng DC, và thống kê tình hình thất thoát lãng phí."
    )
    add_body("Hệ thống sử dụng Microsoft SQL Server làm cơ sở dữ liệu chính.")
    add_body(
        "Do chỉ quản lý 1 cửa hàng bán lẻ duy nhất, hệ thống không cần chức năng luân chuyển ngang giữa các shop hoặc "
        "thủ tục hoàn trả nhà cung cấp phức tạp. Tất cả các đợt hàng, lô hàng, bán lẻ POS, sổ hao hụt, dự báo ROP và "
        "dashboard đều xoay quanh một cửa hàng bán lẻ cố định liên kết với Kho tổng DC Biên Hòa."
    )

    # --- 2. PHẠM VI HỆ THỐNG ---
    add_h1("2. Phạm vi hệ thống")
    add_first("Hệ thống quản lý các nhóm dữ liệu chính:")
    add_code(
        "1. Thông tin cửa hàng bán lẻ duy nhất\n"
        "2. Kho tổng cung ứng liên kết (DC Biên Hòa)\n"
        "3. Danh mục ngành hàng FMCG và thực phẩm\n"
        "4. Sản phẩm hàng hóa bán lẻ\n"
        "5. Lô hàng và vòng đời hạn sử dụng (Shelf-Life)\n"
        "6. Người dùng và phân quyền (Admin, Cửa hàng trưởng, Thu ngân, Nhân viên kho)\n"
        "7. Phiếu tiếp nhận hàng từ Kho tổng DC (Goods Receipts)\n"
        "8. Đơn bán lẻ tại quầy POS (Bán hàng = Xuất kho FEFO)\n"
        "9. Giám sát hạn dùng và cảnh báo 3 cấp màu (Xanh / Vàng / Đỏ)\n"
        "10. Kích hoạt giảm giá xả hàng Quick Markdown\n"
        "11. Nhật ký xác nhận đảo lô hàng mặt tiền kệ trưng bày\n"
        "12. Biên bản tiêu hủy hàng hỏng & Sổ hao hụt tài chính\n"
        "13. Dự báo nhu cầu bán hàng & Điểm đặt hàng bổ sung (ROP Forecast)\n"
        "14. Đơn đặt hàng bổ sung gửi về Kho tổng DC (Purchase Orders)\n"
        "15. Lịch trực và bàn giao ca làm việc\n"
        "16. Dashboard thống kê điều hành thời gian thực\n"
        "17. Nhật ký thao tác hệ thống (Audit Log)"
    )

    # --- 3. ĐẶC ĐIỂM QUAN TRỌNG CỦA HỆ THỐNG ---
    add_h1("3. Đặc điểm quan trọng của hệ thống")
    add_h2("3.1 Chỉ quản lý một cửa hàng bán lẻ duy nhất")
    add_first("Vì chỉ có một cửa hàng bán lẻ, hệ thống sẽ không cần các chức năng như:")
    add_code(
        "- Tạo nhiều chi nhánh hoặc chuỗi siêu thị\n"
        "- Điều chuyển hàng ngang giữa các cửa hàng (Inter-store Transfer)\n"
        "- So sánh doanh số và tồn kho giữa nhiều shop\n"
        "- Thủ tục hoàn trả nhà cung cấp phức tạp (RTV)\n"
        "- Phân quyền dữ liệu theo từng chi nhánh"
    )
    add_first("Thay vào đó, hệ thống chỉ cần một phần cấu hình thông tin cửa hàng bán lẻ duy nhất.")
    add_body("Ví dụ:")
    add_code(
        "Tên cửa hàng: Cửa hàng Bán lẻ Tiện lợi LHU Mart\n"
        "Mã cửa hàng: RETAIL-STORE-01\n"
        "Vị trí: Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai\n"
        "Kho tổng liên kết: Trung tâm Phân phối DC Biên Hòa (Mã: DC-BIENHOA)\n"
        "Thời gian giao hàng chuẩn (Lead Time): 1 ngày\n"
        "Sức chứa quầy kệ: 1,500 SKU / 5,000 đơn vị sản phẩm\n"
        "Ngành hàng chính: Sữa, Bánh tươi, Nước giải khát, Thực phẩm mát, Đồ khô FMCG\n"
        "Trạng thái: Đang hoạt động"
    )

    add_h2("3.2 Sử dụng SQL Server")
    add_first("Cơ sở dữ liệu dùng Microsoft SQL Server LocalDB với tên retail_spoilage_db.")
    add_body("Các yêu cầu khi thiết kế database:")
    add_code(
        "- Dùng bảng quan hệ rõ ràng, đạt chuẩn chuẩn hóa 3NF\n"
        "- Có khóa chính (IDENTITY hoặc UNIQUEIDENTIFIER), khóa ngoại toàn vẹn\n"
        "- Có ràng buộc CHECK chống tồn kho âm (current_quantity >= 0)\n"
        "- Có trạng thái cho các nghiệp vụ quan trọng (ACTIVE, WARNING, EXPIRED, DISPOSED)\n"
        "- Có CreatedAt, UpdatedAt cho các bảng chính\n"
        "- Có AuditLog để lưu lịch sử thao tác bất biến\n"
        "- Có transaction khi xuất bán lẻ POS FEFO, nhập kho DC, tiêu hủy hàng hỏng\n"
        "- Có index cho các bảng lô hàng, sản phẩm, lịch sử bán hàng, nhật ký kiểm toán"
    )

    # --- 4. NHÓM NGƯỜI DÙNG TRONG HỆ THỐNG ---
    add_h1("4. Nhóm người dùng trong hệ thống")
    add_h2("4.1 Admin (Quản trị viên hệ thống)")
    add_first("Admin có quyền cao nhất trong hệ thống.")
    add_body("Chức năng chính:")
    add_code(
        "- Quản lý tài khoản nhân viên\n"
        "- Phân quyền người dùng\n"
        "- Cấu hình tham số cửa hàng và thông tin Kho tổng DC\n"
        "- Cấu hình ngưỡng cảnh báo cận date mặc định\n"
        "- Xem dashboard tổng điều hành\n"
        "- Xem toàn bộ nhật ký thao tác hệ thống (Audit Log)\n"
        "- Sao lưu và bảo trì dữ liệu SQL Server"
    )

    add_h2("4.2 Cửa hàng trưởng (Store Manager)")
    add_first("Cửa hàng trưởng chịu trách nhiệm điều hành toàn diện doanh số, tồn kho và kiểm soát hao hụt tại cửa hàng.")
    add_body("Chức năng chính:")
    add_code(
        "- Quản lý danh mục ngành hàng và sản phẩm\n"
        "- Theo dõi tình trạng hạn sử dụng các lô hàng trên Dashboard\n"
        "- Phê duyệt kích hoạt giảm giá xả hàng Quick Markdown (15%, 30%, 40%, 50%)\n"
        "- Phê duyệt biên bản tiêu hủy hàng hỏng/quá hạn và chốt Sổ hao hụt tài chính\n"
        "- Xem dự báo nhu cầu bán hàng và tính điểm đặt hàng ROP\n"
        "- Phê duyệt đơn đặt hàng bổ sung gửi về Kho tổng DC\n"
        "- Quản lý phân công ca trực và giám sát bàn giao ca\n"
        "- Xem báo cáo tài chính, doanh thu và tỷ lệ lãng phí Spoilage Rate"
    )

    add_h2("4.3 Nhân viên thu ngân (Cashier)")
    add_first("Nhân viên thu ngân trực tiếp thực hiện bán lẻ tại quầy POS cho người tiêu dùng.")
    add_body("Chức năng chính:")
    add_code(
        "- Quét mã vạch Barcode / SKU sản phẩm tại quầy POS\n"
        "- Xem giá bán niêm yết và giá khuyến mãi tự động nếu lô đang xả hàng\n"
        "- Lựa chọn ngữ cảnh bán hàng: Thời tiết (Nắng/Mưa/Bình thường) và Cờ ngày lễ\n"
        "- Thực hiện thanh toán và in hóa đơn bán lẻ (Hệ thống tự động trừ kho FEFO)\n"
        "- Báo cáo nhanh sản phẩm móp méo hoặc phát hiện cận date tại quầy\n"
        "- Thực hiện chốt ca thu ngân và bàn giao doanh số tiền mặt"
    )

    add_h2("4.4 Nhân viên kho & quầy kệ (Warehouse Staff)")
    add_first("Nhân viên kho phụ trách tiếp nhận hàng từ xe tải DC, sắp xếp quầy kệ và theo dõi hạn sử dụng thực tế.")
    add_body("Chức năng chính:")
    add_code(
        "- Kiểm tra date thực tế của xe tải DC giao đến (kiểm tra RSL >= 70%)\n"
        "- Nhập phiếu tiếp nhận hàng từ Kho tổng DC (tạo lô hàng mới)\n"
        "- Xem danh sách các lô hàng Vùng Vàng và Vùng Đỏ cần xử lý\n"
        "- Thực hiện đảo lô hàng cận date ra mặt tiền quầy kệ theo chuẩn FEFO\n"
        "- Xác nhận đã đảo kệ trên hệ thống phần mềm\n"
        "- Dán tem nhãn giảm giá xả hàng lên bao bì theo phê duyệt của Quản lý\n"
        "- Thu gom hàng hỏng, rách bao bì, hết hạn vào khu cách ly và lập đề xuất hủy\n"
        "- Tham gia kiểm kê định kỳ và bàn giao ca kho"
    )

    # --- 5. QUẢN LÝ THÔNG TIN CỬA HÀNG BÁN LẺ DUY NHẤT ---
    add_h1("5. Quản lý thông tin cửa hàng bán lẻ duy nhất")
    add_first("Do chỉ có một cửa hàng bán lẻ, hệ thống cần một bảng cấu hình cố định StoreProfile để lưu thông tin cửa hàng.")
    add_body("Thông tin cần quản lý:")
    add_code(
        "- Mã cửa hàng: RETAIL-STORE-01\n"
        "- Tên cửa hàng: Cửa hàng Bán lẻ Tiện lợi LHU Mart\n"
        "- Địa chỉ: Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai\n"
        "- Số điện thoại liên hệ\n"
        "- Cửa hàng trưởng phụ trách\n"
        "- Kho tổng DC mặc định: Kho Phân Phối DC Biên Hòa\n"
        "- Thời gian giao hàng tiêu chuẩn (Lead Time): 1 ngày\n"
        "- Tỷ lệ hạn sử dụng tối thiểu khi nhận hàng từ DC (Min RSL): 70%\n"
        "- Ngưỡng cảnh báo cận date mặc định: 7 ngày\n"
        "- Ngưỡng cảnh báo nguy kịch: 3 ngày\n"
        "- Giờ mở cửa / Giờ đóng cửa\n"
        "- Trạng thái hoạt động cửa hàng"
    )
    add_first("Trạng thái cửa hàng:")
    add_code(
        "OPEN       - Đang mở cửa bán hàng\n"
        "CLOSED     - Đang đóng cửa ca đêm\n"
        "INVENTORY  - Tạm ngưng để kiểm kê kho\n"
        "SUSPENDED  - Tạm ngừng hoạt động"
    )
    add_first("Điều kiện:")
    add_code(
        "- Nếu cửa hàng ở trạng thái INVENTORY hoặc SUSPENDED thì quầy POS khóa chức năng thanh toán.\n"
        "- Mọi phiếu nhập hàng, xuất kho FEFO và sổ hao hụt đều tự động gán với cửa hàng duy nhất này."
    )

    # --- 6. QUẢN LÝ DANH MỤC NGÀNH HÀNG FMCG & SẢN PHẨM ---
    add_h1("6. Quản lý danh mục ngành hàng FMCG & Sản phẩm")
    add_first("Phân loại hàng hóa theo đặc thù thời hạn sử dụng và điều kiện bảo quản thực tế.")
    add_body("Danh mục ngành hàng chính:")
    add_code(
        "1. Sữa & Chế phẩm từ sữa (HSD: 30 - 180 ngày, Ngưỡng cảnh báo: 7 ngày, Vùng mát 2-4°C)\n"
        "2. Bánh tươi & Thực phẩm chế biến sẵn (HSD: 3 - 7 ngày, Ngưỡng cảnh báo: 2 ngày, Nhiệt độ phòng)\n"
        "3. Nước giải khát & Nước ép (HSD: 180 - 365 ngày, Ngưỡng cảnh báo: 15 ngày, Nhiệt độ phòng)\n"
        "4. Thực phẩm đông lạnh & Thịt mát (HSD: 15 - 45 ngày, Ngưỡng cảnh báo: 5 ngày, Đông lạnh -18°C)\n"
        "5. Đồ khô & Gia vị đóng gói (HSD: 180 - 720 ngày, Ngưỡng cảnh báo: 30 ngày, Nhiệt độ phòng)"
    )
    add_first("Thông tin sản phẩm hàng hóa:")
    add_code(
        "- Mã SKU sản phẩm (duy nhất, dùng quét Barcode tại POS)\n"
        "- Tên sản phẩm\n"
        "- Danh mục ngành hàng\n"
        "- Nhà cung ứng mặc định (Kho tổng DC Biên Hòa)\n"
        "- Đơn vị tính (Hộp, Chai, Gói, Hũ, Khay)\n"
        "- Giá vốn nhập chuẩn (Cost Price)\n"
        "- Giá bán lẻ niêm yết (Selling Price)\n"
        "- Vòng đời hạn sử dụng tiêu chuẩn (Standard Shelf-life Days)\n"
        "- Ngưỡng tồn kho an toàn tối thiểu (Min Stock Level - Safety Stock)\n"
        "- Ngưỡng tồn kho tối đa (Max Stock Level)\n"
        "- Ngưỡng ngày cảnh báo cận date tùy biến (Custom Warning Days)\n"
        "- Hình ảnh sản phẩm\n"
        "- Trạng thái kinh doanh (ACTIVE / DISCONTINUED)"
    )
    add_first("Thuật toán chống trùng lặp sản phẩm (Product Deduplication):")
    add_code(
        "- Khi thêm mới sản phẩm, hệ thống tự động chuẩn hóa chuỗi (bỏ dấu tiếng Việt, viết thường, xóa khoảng trắng thừa).\n"
        "- Kiểm tra so khớp trùng mã SKU hoặc độ tương đồng tên sản phẩm >= 85%.\n"
        "- Nếu phát hiện trùng, hệ thống cảnh báo và từ chối tạo mới để tránh phân tán số liệu lô hàng."
    )

    # --- 7. QUẢN LÝ LÔ HÀNG & VÒNG ĐỜI HẠN SỬ DỤNG (SHELF-LIFE) ---
    add_h1("7. Quản lý lô hàng & Vòng đời hạn sử dụng (Shelf-Life Management)")
    add_first("Mỗi sản phẩm có thể có nhiều lô hàng khác nhau tương ứng với từng đợt nhập từ DC.")
    add_body("Thông tin lô hàng (Product Batch):")
    add_code(
        "- Mã lô hàng (BatchCode - duy nhất, ví dụ: LOT-DC-MILK-001)\n"
        "- Sản phẩm liên kết\n"
        "- Phiếu nhập kho nguồn (Goods Receipt)\n"
        "- Ngày nhập kho (Import Date)\n"
        "- Ngày sản xuất (Manufacture Date)\n"
        "- Ngày hết hạn sử dụng (Expiry Date)\n"
        "- Số lượng ban đầu (Initial Quantity)\n"
        "- Số lượng tồn hiện tại (Current Quantity)\n"
        "- Đơn giá nhập thực tế\n"
        "- Tỷ lệ giảm giá xả hàng hiện tại (Discount Percent: 0%, 15%, 30%, 40%, 50%)\n"
        "- Trạng thái lô hàng\n"
        "- Ghi chú"
    )
    add_first("Trạng thái lô hàng:")
    add_code(
        "ACTIVE    - Đang lưu kho và đủ điều kiện bán lẻ bình thường\n"
        "WARNING   - Cận date, đang áp dụng giảm giá xả hàng hoặc đảo kệ\n"
        "EXPIRED   - Đã hết hạn sử dụng, tự động khóa bán hoàn toàn trên POS\n"
        "DISPOSED  - Đã xuất tiêu hủy hoàn tất, ghi nhận sổ hao hụt"
    )
    add_first("Công thức toán học tính toán vòng đời hạn sử dụng:")
    add_code(
        "1. Số ngày còn lại (DaysLeft):\n"
        "   DaysLeft = DATEDIFF(day, CAST(GETDATE() AS DATE), ExpiryDate)\n\n"
        "2. Tỷ lệ hạn sử dụng còn lại (Remaining Shelf-Life - RSL %):\n"
        "   TotalLife = DATEDIFF(day, ManufactureDate, ExpiryDate)\n"
        "   RSL = (DaysLeft / TotalLife) * 100%"
    )
    add_first("Điều kiện quản lý lô hàng:")
    add_code(
        "- Ngày hết hạn bắt buộc phải lớn hơn Ngày sản xuất (ExpiryDate > ManufactureDate).\n"
        "- Ngày nhập kho phải nhỏ hơn hoặc bằng Ngày hết hạn.\n"
        "- Số lượng tồn hiện tại không bao giờ được nhỏ hơn 0 (CurrentQuantity >= 0).\n"
        "- Lô hàng có DaysLeft <= 0 tự động chuyển sang trạng thái EXPIRED và cấm xuất bán."
    )

    # --- 8. CHỨC NĂNG BÁN LẺ POS THEO NGUYÊN TẮC FEFO ---
    add_h1("8. Chức năng bán lẻ POS theo nguyên tắc FEFO (First Expired, First Out)")
    add_first(
        "Nguyên tắc cốt lõi: Bán hàng tại quầy POS = Xuất kho trực tiếp. "
        "Thu ngân chỉ cần quét mã SKU sản phẩm và nhập số lượng khách mua, hệ thống tự động bóc tách "
        "các lô có hạn sử dụng gần nhất ra trước để khấu trừ số lượng."
    )
    add_h2("8.1 Quy trình bán lẻ tại quầy POS")
    add_code(
        "Thu ngân quét Barcode SKU sản phẩm\n"
        "→ Hệ thống tìm kiếm các lô hàng còn tồn khả dụng của sản phẩm đó\n"
        "→ Tự động sắp xếp các lô theo thứ tự: expiry_date ASC, id ASC (Chuẩn FEFO)\n"
        "→ Nếu lô cận date đang có chính sách xả hàng, tự động hiển thị giá giảm (Promotional Price)\n"
        "→ Thu ngân chọn cờ ngữ cảnh: Thời tiết (Nắng/Mưa/Bình thường) và Cờ ngày lễ\n"
        "→ Bấm nút Thanh toán: Hệ thống mở Transaction SQL Server\n"
        "→ Khấu trừ current_quantity của lô có hạn gần nhất\n"
        "→ Nếu khách mua nhiều hơn tồn của lô thứ nhất, tự động bẻ sang lô tiếp theo\n"
        "→ Ghi nhận lịch sử bán lẻ vào sales_history đích danh theo từng lô đã bẻ\n"
        "→ In hóa đơn chi tiết cho khách hàng kèm mã lô đã trừ"
    )

    add_h2("8.2 Bẻ nhỏ đơn hàng qua nhiều lô (Split Order Scenario)")
    add_body("Ví dụ:")
    add_code(
        "Khách mua: 5 hộp sữa Vinamilk 100ml\n"
        "Hiện trạng tồn kho theo FEFO:\n"
        "+ Lô LOT-01: HSD còn 2 ngày, tồn 3 hộp, đang giảm giá 30% -> Giá: 6,650 đ\n"
        "+ Lô LOT-02: HSD còn 45 ngày, tồn 10 hộp, nguyên giá 0%   -> Giá: 9,500 đ\n\n"
        "Hệ thống tự động tách thành 2 dòng hóa đơn:\n"
        "- Dòng 1: 3 hộp từ Lô LOT-01 x 6,650 đ = 19,950 đ (Trừ hết lô LOT-01)\n"
        "- Dòng 2: 2 hộp từ Lô LOT-02 x 9,500 đ = 19,000 đ (Lô LOT-02 còn lại 8 hộp)\n"
        "Tổng tiền hóa đơn: 38,950 đ. Không xảy ra tranh chấp hoặc âm kho."
    )

    # --- 9. QUY TRÌNH KIỂM SOÁT HẠN DÙNG, CẢNH BÁO 3 CẤP MÀU & TIÊU HỦY ---
    add_h1("9. Quy trình kiểm soát hạn dùng, cảnh báo 3 cấp màu & Tiêu hủy")
    add_first("Hệ thống tự động phân loại rủi ro hạn dùng của toàn bộ lô hàng theo 3 vùng màu trực quan:")
    add_code(
        "1. VÙNG XANH (An toàn - SAFE):\n"
        "   - Điều kiện: DaysLeft > Ngưỡng cảnh báo (Category/Product Warning Days)\n"
        "   - Hành động: Lưu kho và bán lẻ bình thường theo giá niêm yết 100%.\n\n"
        "2. VÙNG VÀNG (Cảnh báo cận date - WARNING):\n"
        "   - Điều kiện: 3 ngày < DaysLeft <= Ngưỡng cảnh báo\n"
        "   - Hành động: Kích hoạt giảm giá nhẹ 15% - 30%, đảo lô ra mặt tiền kệ.\n\n"
        "3. VÙNG ĐỎ (Nguy kịch - CRITICAL):\n"
        "   - Điều kiện: 0 < DaysLeft <= 3 ngày\n"
        "   - Hành động: Giảm giá kịch sàn 40% - 50% (Quick Markdown), ưu tiên gom xả hàng trong ngày.\n\n"
        "4. QUÁ HẠN (Hết hạn - EXPIRED):\n"
        "   - Điều kiện: DaysLeft <= 0\n"
        "   - Hành động: TỰ ĐỘNG KHÓA CỨNG BÁN LẺ POS. Rút hàng khỏi kệ, chuyển sang khu cách ly để tiêu hủy."
    )

    # --- 10. ĐIỀU KIỆN KIỂM TRA KHI BÁN HÀNG & XUẤT KHO ---
    add_h1("10. Điều kiện kiểm tra khi bán hàng & Xuất kho")
    add_first("Hệ thống phải kiểm tra các điều kiện sau trước khi thực thi xuất bán:")
    add_code(
        "- Sản phẩm có đang ở trạng thái kinh doanh không (is_active = 1).\n"
        "- Cửa hàng có đang mở cửa không (Status = 'OPEN').\n"
        "- Số lượng mua phải là số nguyên dương (> 0).\n"
        "- Tổng tồn kho khả dụng còn hạn của sản phẩm phải >= số lượng khách mua.\n"
        "- Lô hàng xuất bán phải có DaysLeft > 0 (không được xuất lô đã hết hạn).\n"
        "- Tuyệt đối không cho phép current_quantity của bất kỳ lô nào nhỏ hơn 0.\n"
        "- Nếu phát sinh tranh chấp tồn kho giữa 2 quầy POS đồng thời, cơ chế khóa UPDLOCK\n"
        "  sẽ buộc giao dịch đến sau chờ và báo lỗi nếu số lượng không còn đủ."
    )

    # --- 11. DASHBOARD HỆ THỐNG ---
    add_h1("11. Dashboard hệ thống")
    add_h2("11.1 Dashboard tổng quan cho Cửa hàng trưởng")
    add_first("Các chỉ số KPI tài chính điều hành cần có:")
    add_code(
        "- Tổng giá trị vốn hàng tồn kho hiện tại (VNĐ)\n"
        "- Tổng giá trị vốn cận date có rủi ro mất mát (Vùng Vàng + Vùng Đỏ)\n"
        "- Tỷ lệ hao hụt lãng phí (Spoilage Rate % = Giá trị hủy / Doanh thu)\n"
        "- Doanh số bán hàng hôm nay (VNĐ)\n"
        "- Số lượng lô hàng cần đảo kệ trong ca trực hôm nay\n"
        "- Số lượng lô hàng đã hết hạn đang chờ phê duyệt tiêu hủy\n"
        "- Tỷ lệ tuân thủ bán hàng FEFO của nhân viên"
    )

    add_h2("11.2 Biểu đồ nên có")
    add_code(
        "- Biểu đồ phân bổ hạn sử dụng theo 3 màu (Xanh / Vàng / Đỏ / Hết hạn)\n"
        "- Biểu đồ doanh thu bán lẻ theo ngày trong tuần\n"
        "- Biểu đồ so sánh giá trị bán lẻ và giá trị hàng hủy theo tháng\n"
        "- Biểu đồ top sản phẩm có tốc độ bán nhanh nhất\n"
        "- Biểu đồ top sản phẩm phát sinh hao hụt nhiều nhất"
    )

    add_h2("11.3 Action Board khẩn cấp cho ca trực")
    add_first("Nhân viên ca trực cần thấy nhanh các hành động cần làm ngay:")
    add_code(
        "- Danh sách các lô hàng Vùng Đỏ (còn <= 3 ngày) cần dán tem giảm giá ngay\n"
        "- Danh sách các lô hàng cận date cần đảo ra mặt tiền kệ trưng bày\n"
        "- Danh sách các lô hàng đã hết hạn hôm nay cần gom vào thùng chờ hủy\n"
        "- Cảnh báo các mặt hàng có tồn kho chạm điểm đặt hàng ROP"
    )

    # --- 12. QUẢN LÝ TIẾP NHẬN HÀNG TỪ KHO TỔNG DC ---
    add_h1("12. Quản lý tiếp nhận hàng từ Kho tổng DC (DC Inbound & Date Inspection)")
    add_first("Cửa hàng chỉ nhận hàng bổ sung từ một nguồn duy nhất là Kho tổng DC Biên Hòa.")
    add_h2("12.1 Tiêu chuẩn nhận date nghiêm ngặt (Inbound Freshness Rule)")
    add_code(
        "- Hạn sử dụng còn lại khi xe tải DC giao đến cửa hàng phải đạt tối thiểu 70% vòng đời chuẩn:\n"
        "  RSL_inbound = (ExpiryDate - ImportDate) / (ExpiryDate - ManufactureDate) >= 70%\n"
        "- Nếu RSL_inbound < 70%: Hệ thống KHÓA nút Lưu phiếu nhập, yêu cầu nhân viên lập biên bản từ chối nhận hàng.\n"
        "- Ngăn chặn triệt để tình trạng Kho tổng DC đẩy hàng cận date về cửa hàng bán lẻ."
    )
    add_h2("12.2 Quy trình tiếp nhận hàng")
    add_code(
        "Nhân viên kho mở giao diện Tiếp nhận hàng DC\n"
        "→ Chọn sản phẩm FMCG nhập về\n"
        "→ Nhập ngày sản xuất (Manufacture Date) và hạn sử dụng (Expiry Date) in trên bao bì\n"
        "→ Hệ thống tự động tính toán RSL_inbound:\n"
        "  + Đạt chuẩn (>= 70%): Cho phép nhập số lượng và đơn giá vốn\n"
        "  + Không đạt chuẩn (< 70%): Báo lỗi đỏ, từ chối nhận hàng\n"
        "→ Tự động sinh mã lô: LOT-DC-[Mã SP]-[Ngày Nhập]\n"
        "→ Lưu bản ghi vào goods_receipts và batches\n"
        "→ Cập nhật giá vốn chuẩn mới nhất vào products\n"
        "→ In mã tem lô hàng để dán lên thùng lưu kho"
    )

    # --- 13. QUẢN LÝ XẢ HÀNG GIẢM GIÁ & ĐẢO KỆ THEO FEFO ---
    add_h1("13. Quản lý xả hàng giảm giá (Quick Markdown) & Đảo kệ theo FEFO")
    add_h2("13.1 Kích hoạt giảm giá xả hàng Quick Markdown")
    add_first("Công cụ hỗ trợ Cửa hàng trưởng giải phóng nhanh hàng cận date để thu hồi vốn:")
    add_code(
        "- Mức chiết khấu chuẩn: 15%, 30%, 40%, 50%.\n"
        "- Khi Cửa hàng trưởng chọn mức giảm giá cho một lô hàng, giá khuyến mãi lập tức có hiệu lực tại quầy POS.\n"
        "- Quầy thu ngân tự động áp dụng giá mới cho khách hàng mua đúng lô đó mà không cần can thiệp thủ công."
    )
    add_h2("13.2 Quy trình 5 bước đảo kệ mặt tiền (Shelf Rotation SOP)")
    add_code(
        "Bước 1: Nhân viên kho mở danh sách 'Lô hàng cần đảo kệ' trên phần mềm.\n"
        "Bước 2: Đến quầy kệ vật lý, dời các lô hàng date xa (Vùng Xanh) tạm thời ra phía ngoài.\n"
        "Bước 3: Đưa lô hàng cận date (Vùng Vàng / Vùng Đỏ) xếp ra sát mép mặt tiền trưng bày để khách dễ lấy.\n"
        "Bước 4: Xếp các lô date xa trở lại phía sau lưng lô cận date.\n"
        "Bước 5: Bấm nút 'Xác nhận đảo kệ' trên phần mềm để lưu vết thời gian và tên nhân viên thực hiện."
    )

    # --- 14. QUẢN LÝ TIÊU HỦY & SỔ HAO HỤT TÀI CHÍNH ---
    add_h1("14. Quản lý tiêu hủy & Sổ hao hụt tài chính (Spoilage Loss Ledger)")
    add_first("Mọi số lượng hàng hóa rút khỏi quầy kệ do hư hỏng hoặc quá hạn đều phải hạch toán minh bạch vào Sổ hao hụt.")
    add_body("Thông tin biên bản tiêu hủy:")
    add_code(
        "- Mã biên bản tiêu hủy (Record Code - duy nhất)\n"
        "- Lô hàng bị hủy\n"
        "- Ngày thực hiện tiêu hủy\n"
        "- Số lượng tiêu hủy thực tế\n"
        "- Đơn giá vốn của lô hàng\n"
        "- Giá trị vốn tổn thất: CostLoss = QuantityDisposed * ImportPrice\n"
        "- Lý do tiêu hủy: EXPIRED (Hết hạn), DAMAGED (Móp méo/vỡ bao bì), SPOILED (Biến chất/chua hỏng)\n"
        "- Ghi chú mô tả\n"
        "- Người lập đề xuất\n"
        "- Cửa hàng trưởng ký duyệt"
    )
    add_first("Điều kiện:")
    add_code(
        "- Số lượng tiêu hủy không được vượt quá số lượng tồn hiện tại của lô.\n"
        "- Hệ thống tự động trừ kho của lô, nếu hết hàng thì cập nhật trạng thái lô thành DISPOSED.\n"
        "- Dữ liệu Sổ hao hụt được lưu trữ bất biến phục vụ quyết toán thuế TNDN và thanh tra ATTP."
    )

    # --- 15. QUẢN LÝ LỊCH TRỰC VÀ BÀN GIAO CA LÀM VIỆC ---
    add_h1("15. Quản lý lịch trực và bàn giao ca làm việc")
    add_first("Cửa hàng vận hành 2 ca mỗi ngày (Ca sáng: 06:00 - 14:00, Ca chiều: 14:00 - 22:00).")
    add_h2("15.1 Quy trình bàn giao ca trực 4 bước")
    add_code(
        "Bước 1: Chốt ca POS & Kiểm đếm tiền mặt: Thu ngân ca trước in báo cáo doanh số, hai bên đếm tiền trong két.\n"
        "Bước 2: Rà soát danh sách lô Đỏ và Vàng: Hai nhân viên cùng kiểm tra các lô cận date trên kệ.\n"
        "Bước 3: Bàn giao thùng hàng chờ tiêu hủy: Kiểm đếm số lượng hàng hỏng phát sinh trong ca tại khu cách ly.\n"
        "Bước 4: Ký biên bản bàn giao điện tử: Bấm nút 'Xác nhận bàn giao ca' trên phần mềm để lưu vết trách nhiệm."
    )
    add_h2("15.2 Quy định trách nhiệm và chế tài")
    add_code(
        "- Sơ suất để lọt hàng hết hạn bán cho khách: Khiển trách, bồi thường 100% đơn hàng.\n"
        "- Không thực hiện đảo lô cận date ra mặt tiền: Trừ điểm chuyên cần tháng.\n"
        "- Tự ý vứt bỏ hàng không lập phiếu trên phần mềm: Bồi thường 100% giá trị vốn thất thoát."
    )

    # --- 16. PHÂN QUYỀN CHỨC NĂNG (BẢNG RBAC CHUẨN) ---
    add_h1("16. Phân quyền chức năng")
    add_first("Bảng ma trận phân quyền chi tiết cho 3 vai trò người dùng trong hệ thống:")
    
    rbac_data = [
        ["Chức năng", "Admin", "Cửa hàng trưởng", "Thu ngân", "Nhân viên kho"],
        ["Đăng nhập hệ thống", "Có", "Có", "Có", "Có"],
        ["Quản lý tài khoản & phân quyền", "Có", "Không", "Không", "Không"],
        ["Cấu hình thông tin cửa hàng duy nhất", "Có", "Tùy quyền", "Không", "Không"],
        ["Quản lý danh mục & sản phẩm FMCG", "Có", "Có", "Không", "Không"],
        ["Xem danh sách lô hàng & cảnh báo 3 màu", "Có", "Có", "Có", "Có"],
        ["Bán lẻ POS trừ kho FEFO", "Có", "Có", "Có", "Không"],
        ["Áp dụng giảm giá xả hàng Quick Markdown", "Có", "Có", "Không", "Không"],
        ["Tiếp nhận hàng từ Kho tổng DC", "Có", "Có", "Không", "Có"],
        ["Xác nhận đảo lô hàng mặt tiền kệ", "Có", "Có", "Không", "Có"],
        ["Lập đề xuất tiêu hủy hàng hỏng", "Có", "Có", "Có", "Có"],
        ["Phê duyệt tiêu hủy & chốt Sổ hao hụt", "Có", "Có", "Không", "Không"],
        ["Xem dự báo nhu cầu bán hàng & ROP", "Có", "Có", "Không", "Tùy quyền"],
        ["Tạo đơn đặt hàng bổ sung gửi DC", "Có", "Có", "Không", "Không"],
        ["Xem dashboard tổng điều hành", "Có", "Có", "Không", "Không"],
        ["Bàn giao ca trực điện tử", "Có", "Có", "Có", "Có"],
        ["Xem nhật ký kiểm toán (Audit Log)", "Có", "Tùy quyền", "Không", "Không"]
    ]
    t_rbac = doc.add_table(rows=len(rbac_data), cols=5)
    t_rbac.style = 'Table'
    t_rbac.alignment = WD_TABLE_ALIGNMENT.CENTER
    for r_idx, row in enumerate(rbac_data):
        for c_idx, val in enumerate(row):
            cell = t_rbac.cell(r_idx, c_idx)
            cell.text = val
            p = cell.paragraphs[0]
            p.style = 'Compact'
            if r_idx == 0:
                for r in p.runs:
                    r.font.bold = True

    # --- 17. THIẾT KẾ DATABASE SQL SERVER ---
    add_h1("17. Thiết kế database SQL Server")
    add_first("Toàn bộ bảng dữ liệu thiết kế chuẩn hóa 3NF trên Microsoft SQL Server:")
    
    add_h2("17.1 Bảng Users")
    add_code(
        "CREATE TABLE Users (\n"
        "    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),\n"
        "    FullName NVARCHAR(150) NOT NULL,\n"
        "    Email NVARCHAR(150) NOT NULL UNIQUE,\n"
        "    Phone NVARCHAR(50) NULL,\n"
        "    Username NVARCHAR(50) NOT NULL UNIQUE,\n"
        "    PasswordHash NVARCHAR(MAX) NOT NULL,\n"
        "    RoleCode NVARCHAR(50) NOT NULL,\n"
        "    Status NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE',\n"
        "    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),\n"
        "    UpdatedAt DATETIME2 NULL\n"
        ");"
    )

    add_h2("17.2 Bảng Roles")
    add_code(
        "CREATE TABLE Roles (\n"
        "    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),\n"
        "    Code NVARCHAR(50) NOT NULL UNIQUE,\n"
        "    Name NVARCHAR(100) NOT NULL,\n"
        "    Description NVARCHAR(255) NULL\n"
        ");\n\n"
        "-- Role mặc định: ADMIN, MANAGER, CASHIER, CASHIER"
    )

    add_h2("17.3 Bảng StoreProfile")
    add_first("Vì chỉ quản lý một cửa hàng bán lẻ duy nhất, dùng bảng StoreProfile để lưu thông tin cửa hàng.")
    add_code(
        "CREATE TABLE StoreProfile (\n"
        "    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),\n"
        "    StoreCode NVARCHAR(50) NOT NULL UNIQUE,\n"
        "    StoreName NVARCHAR(255) NOT NULL,\n"
        "    Address NVARCHAR(255) NOT NULL,\n"
        "    Phone NVARCHAR(50) NULL,\n"
        "    ManagerId UNIQUEIDENTIFIER NULL,\n"
        "    DefaultDcSupplierId UNIQUEIDENTIFIER NULL,\n"
        "    DefaultLeadTimeDays INT NOT NULL DEFAULT 1,\n"
        "    MinInboundRslPercent DECIMAL(5,2) NOT NULL DEFAULT 70.00,\n"
        "    Status NVARCHAR(50) NOT NULL DEFAULT 'OPEN',\n"
        "    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),\n"
        "    UpdatedAt DATETIME2 NULL,\n"
        "    CONSTRAINT FK_StoreProfile_Manager FOREIGN KEY (ManagerId) REFERENCES Users(Id)\n"
        ");\n\n"
        "-- Ghi chú: hệ thống chỉ có một bản ghi duy nhất trong bảng này."
    )

    add_h2("17.4 Bảng Suppliers (Kho tổng DC)")
    add_code(
        "CREATE TABLE Suppliers (\n"
        "    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),\n"
        "    Code NVARCHAR(50) NOT NULL UNIQUE,\n"
        "    Name NVARCHAR(200) NOT NULL,\n"
        "    Address NVARCHAR(255) NULL,\n"
        "    Phone NVARCHAR(50) NULL,\n"
        "    LeadTimeDays INT NOT NULL DEFAULT 1,\n"
        "    Status NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE',\n"
        "    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()\n"
        ");"
    )

    add_h2("17.5 Bảng Categories")
    add_code(
        "CREATE TABLE Categories (\n"
        "    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),\n"
        "    Code NVARCHAR(50) NOT NULL UNIQUE,\n"
        "    Name NVARCHAR(100) NOT NULL,\n"
        "    DefaultWarningDays INT NOT NULL DEFAULT 7,\n"
        "    Description NVARCHAR(255) NULL,\n"
        "    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()\n"
        ");"
    )

    add_h2("17.6 Bảng Products")
    add_code(
        "CREATE TABLE Products (\n"
        "    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),\n"
        "    Sku NVARCHAR(50) NOT NULL UNIQUE,\n"
        "    Name NVARCHAR(200) NOT NULL,\n"
        "    CategoryId UNIQUEIDENTIFIER NOT NULL,\n"
        "    SupplierId UNIQUEIDENTIFIER NOT NULL,\n"
        "    Unit NVARCHAR(20) NOT NULL,\n"
        "    CostPrice DECIMAL(12,2) NOT NULL DEFAULT 0.00,\n"
        "    SellingPrice DECIMAL(12,2) NOT NULL DEFAULT 0.00,\n"
        "    StandardShelfLifeDays INT NOT NULL,\n"
        "    MinStockLevel INT NOT NULL DEFAULT 15,\n"
        "    MaxStockLevel INT NOT NULL DEFAULT 150,\n"
        "    CustomWarningDays INT NULL,\n"
        "    ImageUrl NVARCHAR(MAX) NULL,\n"
        "    Status NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE',\n"
        "    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),\n"
        "    UpdatedAt DATETIME2 NULL,\n"
        "    CONSTRAINT FK_Products_Category FOREIGN KEY (CategoryId) REFERENCES Categories(Id),\n"
        "    CONSTRAINT FK_Products_Supplier FOREIGN KEY (SupplierId) REFERENCES Suppliers(Id)\n"
        ");"
    )

    add_h2("17.7 Bảng Batches (Lô hàng & Vòng đời Hạn sử dụng - Trọng tâm FEFO)")
    add_code(
        "CREATE TABLE Batches (\n"
        "    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),\n"
        "    BatchCode NVARCHAR(50) NOT NULL UNIQUE,\n"
        "    ProductId UNIQUEIDENTIFIER NOT NULL,\n"
        "    ImportDate DATE NOT NULL,\n"
        "    ManufactureDate DATE NOT NULL,\n"
        "    ExpiryDate DATE NOT NULL,\n"
        "    InitialQuantity INT NOT NULL,\n"
        "    CurrentQuantity INT NOT NULL DEFAULT 0,\n"
        "    ImportPrice DECIMAL(12,2) NOT NULL,\n"
        "    DiscountPercent INT NOT NULL DEFAULT 0,\n"
        "    Status NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE',\n"
        "    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),\n"
        "    CONSTRAINT FK_Batches_Product FOREIGN KEY (ProductId) REFERENCES Products(Id),\n"
        "    CONSTRAINT CK_Batches_Quantity CHECK (CurrentQuantity >= 0 AND CurrentQuantity <= InitialQuantity),\n"
        "    CONSTRAINT CK_Batches_Dates CHECK (ExpiryDate > ManufactureDate),\n"
        "    CONSTRAINT CK_Batches_Discount CHECK (DiscountPercent BETWEEN 0 AND 100)\n"
        ");"
    )

    add_h2("17.8 Bảng SalesHistory (Lịch sử Bán lẻ POS)")
    add_code(
        "CREATE TABLE SalesHistory (\n"
        "    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),\n"
        "    TransactionCode NVARCHAR(50) NOT NULL,\n"
        "    ProductId UNIQUEIDENTIFIER NOT NULL,\n"
        "    BatchId UNIQUEIDENTIFIER NOT NULL,\n"
        "    QuantitySold INT NOT NULL,\n"
        "    SalePrice DECIMAL(12,2) NOT NULL,\n"
        "    TotalAmount DECIMAL(12,2) NOT NULL,\n"
        "    SaleDate DATE NOT NULL,\n"
        "    DayOfWeek NVARCHAR(20) NOT NULL,\n"
        "    Weather NVARCHAR(20) NOT NULL DEFAULT 'NORMAL',\n"
        "    IsHoliday BIT NOT NULL DEFAULT 0,\n"
        "    CashierId UNIQUEIDENTIFIER NULL,\n"
        "    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),\n"
        "    CONSTRAINT FK_Sales_Product FOREIGN KEY (ProductId) REFERENCES Products(Id),\n"
        "    CONSTRAINT FK_Sales_Batch FOREIGN KEY (BatchId) REFERENCES Batches(Id),\n"
        "    CONSTRAINT FK_Sales_Cashier FOREIGN KEY (CashierId) REFERENCES Users(Id),\n"
        "    CONSTRAINT CK_Sales_Quantity CHECK (QuantitySold > 0)\n"
        ");"
    )

    add_h2("17.9 Bảng SpoilageRecords (Biên bản Tiêu hủy & Sổ Hao hụt Tài chính)")
    add_code(
        "CREATE TABLE SpoilageRecords (\n"
        "    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),\n"
        "    RecordCode NVARCHAR(50) NOT NULL UNIQUE,\n"
        "    BatchId UNIQUEIDENTIFIER NOT NULL,\n"
        "    DisposedDate DATE NOT NULL,\n"
        "    QuantityDisposed INT NOT NULL,\n"
        "    CostLoss DECIMAL(12,2) NOT NULL,\n"
        "    Reason NVARCHAR(50) NOT NULL DEFAULT 'EXPIRED',\n"
        "    Notes NVARCHAR(MAX) NULL,\n"
        "    PerformedBy UNIQUEIDENTIFIER NOT NULL,\n"
        "    ApprovedBy UNIQUEIDENTIFIER NULL,\n"
        "    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),\n"
        "    CONSTRAINT FK_Spoilage_Batch FOREIGN KEY (BatchId) REFERENCES Batches(Id),\n"
        "    CONSTRAINT FK_Spoilage_PerformedBy FOREIGN KEY (PerformedBy) REFERENCES Users(Id),\n"
        "    CONSTRAINT FK_Spoilage_ApprovedBy FOREIGN KEY (ApprovedBy) REFERENCES Users(Id),\n"
        "    CONSTRAINT CK_Spoilage_Quantity CHECK (QuantityDisposed > 0)\n"
        ");"
    )

    add_h2("17.10 Bảng PurchaseOrders (Đơn Đặt hàng Gửi Kho tổng DC)")
    add_code(
        "CREATE TABLE PurchaseOrders (\n"
        "    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),\n"
        "    OrderCode NVARCHAR(50) NOT NULL UNIQUE,\n"
        "    SupplierId UNIQUEIDENTIFIER NOT NULL,\n"
        "    CreatedBy UNIQUEIDENTIFIER NOT NULL,\n"
        "    Status NVARCHAR(50) NOT NULL DEFAULT 'DRAFT',\n"
        "    TotalEstimatedCost DECIMAL(14,2) NOT NULL DEFAULT 0.00,\n"
        "    ExpectedDeliveryDate DATE NULL,\n"
        "    Notes NVARCHAR(MAX) NULL,\n"
        "    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),\n"
        "    UpdatedAt DATETIME2 NULL,\n"
        "    CONSTRAINT FK_PO_Supplier FOREIGN KEY (SupplierId) REFERENCES Suppliers(Id),\n"
        "    CONSTRAINT FK_PO_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(Id)\n"
        ");"
    )

    add_h2("17.11 Bảng PurchaseOrderItems (Chi tiết Sản phẩm Đặt hàng ROP)")
    add_code(
        "CREATE TABLE PurchaseOrderItems (\n"
        "    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),\n"
        "    OrderId UNIQUEIDENTIFIER NOT NULL,\n"
        "    ProductId UNIQUEIDENTIFIER NOT NULL,\n"
        "    CurrentStockAtOrder INT NOT NULL,\n"
        "    SuggestedQuantity INT NOT NULL,\n"
        "    ApprovedQuantity INT NOT NULL,\n"
        "    UnitCost DECIMAL(12,2) NOT NULL,\n"
        "    TotalLineCost DECIMAL(14,2) NOT NULL,\n"
        "    CONSTRAINT FK_POItems_Order FOREIGN KEY (OrderId) REFERENCES PurchaseOrders(Id) ON DELETE CASCADE,\n"
        "    CONSTRAINT FK_POItems_Product FOREIGN KEY (ProductId) REFERENCES Products(Id)\n"
        ");"
    )

    add_h2("17.12 Bảng GoodsReceipts (Phiếu Nhập Hàng từ DC)")
    add_code(
        "CREATE TABLE GoodsReceipts (\n"
        "    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),\n"
        "    ReceiptNumber NVARCHAR(50) NOT NULL UNIQUE,\n"
        "    SupplierId UNIQUEIDENTIFIER NOT NULL,\n"
        "    ReceivedBy UNIQUEIDENTIFIER NOT NULL,\n"
        "    ReceiptDate DATE NOT NULL,\n"
        "    TotalCost DECIMAL(14,2) NOT NULL DEFAULT 0.00,\n"
        "    Status NVARCHAR(50) NOT NULL DEFAULT 'COMPLETED',\n"
        "    Notes NVARCHAR(MAX) NULL,\n"
        "    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),\n"
        "    CONSTRAINT FK_GR_Supplier FOREIGN KEY (SupplierId) REFERENCES Suppliers(Id),\n"
        "    CONSTRAINT FK_GR_ReceivedBy FOREIGN KEY (ReceivedBy) REFERENCES Users(Id)\n"
        ");"
    )

    add_h2("17.13 Bảng AuditLogs (Nhật ký Kiểm toán Bất biến)")
    add_code(
        "CREATE TABLE AuditLogs (\n"
        "    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),\n"
        "    UserId UNIQUEIDENTIFIER NULL,\n"
        "    Action NVARCHAR(100) NOT NULL,\n"
        "    EntityName NVARCHAR(100) NOT NULL,\n"
        "    EntityId NVARCHAR(100) NULL,\n"
        "    Description NVARCHAR(MAX) NOT NULL,\n"
        "    IpAddress NVARCHAR(50) NULL,\n"
        "    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),\n"
        "    CONSTRAINT FK_AuditLogs_User FOREIGN KEY (UserId) REFERENCES Users(Id)\n"
        ");"
    )

    # --- 18. INDEX SQL SERVER NÊN CÓ ---
    add_h1("18. Index SQL Server nên có")
    add_first("Để tăng tốc truy vấn bán lẻ POS, tìm kiếm lô FEFO và hiển thị dashboard, nên tạo index:")
    add_code(
        "CREATE INDEX IX_Batches_FEFO\n"
        "ON Batches(ProductId, Status, ExpiryDate ASC)\n"
        "INCLUDE (CurrentQuantity, DiscountPercent, ImportPrice);\n\n"
        "CREATE INDEX IX_Batches_ExpiryWatchdog\n"
        "ON Batches(ExpiryDate ASC, Status)\n"
        "INCLUDE (BatchCode, CurrentQuantity, ProductId);\n\n"
        "CREATE INDEX IX_Products_Sku\n"
        "ON Products(Sku);\n\n"
        "CREATE INDEX IX_SalesHistory_Product_Date\n"
        "ON SalesHistory(ProductId, SaleDate DESC)\n"
        "INCLUDE (QuantitySold, SalePrice);\n\n"
        "CREATE INDEX IX_SpoilageRecords_Batch\n"
        "ON SpoilageRecords(BatchId, DisposedDate DESC);\n\n"
        "CREATE INDEX IX_PurchaseOrders_Status\n"
        "ON PurchaseOrders(Status, CreatedAt DESC);\n\n"
        "CREATE INDEX IX_AuditLogs_CreatedAt\n"
        "ON AuditLogs(CreatedAt DESC, UserId);"
    )

    # --- 19. CLEAN ARCHITECTURE ĐỀ XUẤT ---
    add_h1("19. Clean Architecture đề xuất")
    add_first("Hệ thống được thiết kế theo Clean Architecture gồm 4 lớp chính:")
    add_code(
        "1. Domain Layer\n"
        "2. Application Layer\n"
        "3. Infrastructure Layer\n"
        "4. Presentation Layer"
    )
    add_first("Quy tắc phụ thuộc:")
    add_code(
        "Presentation → Application → Domain\n"
        "Infrastructure → Application/Domain\n"
        "Domain không phụ thuộc vào database, framework hoặc giao diện"
    )
    add_first("SQL Server chỉ nằm ở tầng Infrastructure.")

    # --- 20. CẤU TRÚC THƯ MỤC BACKEND ĐỀ XUẤT ---
    add_h1("20. Cấu trúc thư mục backend đề xuất")
    add_first("Ví dụ với Node.js + JavaScript/TypeScript + SQL Server:")
    add_code(
        "src/\n"
        "├── domain/\n"
        "│   ├── entities/\n"
        "│   │   ├── User.ts\n"
        "│   │   ├── StoreProfile.ts\n"
        "│   │   ├── Product.ts\n"
        "│   │   ├── Batch.ts\n"
        "│   │   ├── SaleOrder.ts\n"
        "│   │   ├── SpoilageRecord.ts\n"
        "│   │   └── PurchaseOrder.ts\n"
        "│   ├── value-objects/\n"
        "│   │   ├── ShelfLife.ts\n"
        "│   │   ├── AlertLevel.ts\n"
        "│   │   ├── Money.ts\n"
        "│   │   └── WeatherCondition.ts\n"
        "│   ├── repositories/\n"
        "│   │   ├── IUserRepository.ts\n"
        "│   │   ├── IProductRepository.ts\n"
        "│   │   ├── IBatchRepository.ts\n"
        "│   │   ├── ISaleRepository.ts\n"
        "│   │   ├── ISpoilageRepository.ts\n"
        "│   │   └── IPurchaseOrderRepository.ts\n"
        "│   └── services/\n"
        "│       ├── FefoAllocationPolicy.ts\n"
        "│       ├── RopCalculationService.ts\n"
        "│       └── MarkdownPricingPolicy.ts\n"
        "│\n"
        "├── application/\n"
        "│   ├── use-cases/\n"
        "│   │   ├── auth/\n"
        "│   │   │   ├── LoginUseCase.ts\n"
        "│   │   │   └── GetCurrentUserUseCase.ts\n"
        "│   │   ├── product/\n"
        "│   │   │   ├── CreateProductUseCase.ts\n"
        "│   │   │   └── UpdateProductUseCase.ts\n"
        "│   │   ├── batch/\n"
        "│   │   │   ├── ReceiveDCBatchUseCase.ts\n"
        "│   │   │   ├── EvaluateAlertsUseCase.ts\n"
        "│   │   │   ├── ApplyQuickMarkdownUseCase.ts\n"
        "│   │   │   └── RotateShelfFefoUseCase.ts\n"
        "│   │   ├── sales/\n"
        "│   │   │   └── ProcessFefoSaleUseCase.ts\n"
        "│   │   ├── spoilage/\n"
        "│   │   │   ├── DisposeSpoiledGoodsUseCase.ts\n"
        "│   │   │   └── GetSpoilageLedgerUseCase.ts\n"
        "│   │   ├── forecast/\n"
        "│   │   │   ├── CalculateROPForecastUseCase.ts\n"
        "│   │   │   └── CreatePurchaseOrderUseCase.ts\n"
        "│   │   └── dashboard/\n"
        "│   │       └── GetDashboardOverviewUseCase.ts\n"
        "│   ├── dto/\n"
        "│   └── ports/\n"
        "│       └── INotificationService.ts\n"
        "│\n"
        "├── infrastructure/\n"
        "│   ├── database/\n"
        "│   │   ├── sqlserver/\n"
        "│   │   │   ├── connection.ts\n"
        "│   │   │   └── repositories/\n"
        "│   │   │       ├── SqlUserRepository.ts\n"
        "│   │   │       ├── SqlProductRepository.ts\n"
        "│   │   │       ├── SqlBatchRepository.ts\n"
        "│   │   │       ├── SqlSaleRepository.ts\n"
        "│   │   │       └── SqlSpoilageRepository.ts\n"
        "│   └── auth/\n"
        "│\n"
        "├── presentation/\n"
        "│   ├── controllers/\n"
        "│   │   ├── AuthController.ts\n"
        "│   │   ├── ProductController.ts\n"
        "│   │   ├── BatchController.ts\n"
        "│   │   ├── SalesController.ts\n"
        "│   │   ├── SpoilageController.ts\n"
        "│   │   └── DashboardController.ts\n"
        "│   ├── middlewares/\n"
        "│   │   ├── authMiddleware.ts\n"
        "│   │   ├── roleMiddleware.ts\n"
        "│   │   └── validationMiddleware.ts\n"
        "│   └── routes/\n"
        "│\n"
        "└── main.ts"
    )

    # --- 21. CÁC USE CASE QUAN TRỌNG ---
    add_h1("21. Các use case quan trọng")
    add_h2("21.1 ProcessFefoSaleUseCase")
    add_first("Nhiệm vụ:")
    add_code(
        "- Nhận giỏ hàng từ quầy thu ngân POS.\n"
        "- Kiểm tra người dùng có quyền bán hàng không.\n"
        "- Kiểm tra cửa hàng có đang mở cửa không.\n"
        "- Kiểm tra các sản phẩm có đang kinh doanh không.\n"
        "- Truy vấn các lô hàng còn tồn theo thứ tự expiry_date ASC, id ASC (Chuẩn FEFO).\n"
        "- Kiểm tra tổng tồn kho khả dụng có đủ số lượng bán không.\n"
        "- Khấu trừ số lượng tồn của từng lô tương ứng.\n"
        "- Áp dụng giá sau chiết khấu nếu lô đang có tag giảm giá xả hàng.\n"
        "- Ghi nhận lịch sử giao dịch vào SalesHistory kèm cờ thời tiết và ngày lễ.\n"
        "- Ghi AuditLog.\n"
        "- Trả về chi tiết hóa đơn thanh toán cho khách hàng."
    )

    add_h2("21.2 ReceiveDCBatchUseCase")
    add_first("Nhiệm vụ:")
    add_code(
        "- Nhận thông tin đợt hàng giao từ xe tải DC Biên Hòa.\n"
        "- Kiểm tra quyền nhân viên kho.\n"
        "- Kiểm tra tính hợp lệ của ngày sản xuất và hạn sử dụng.\n"
        "- Kiểm tra tiêu chuẩn tiếp nhận: RSL_inbound >= 70%.\n"
        "- Nếu RSL < 70%, từ chối nhận hàng và báo lỗi.\n"
        "- Sinh mã lô hàng duy nhất theo quy chuẩn LOT-DC-[Mã SP]-[Ngày].\n"
        "- Tạo bản ghi lô hàng mới với InitialQuantity = CurrentQuantity.\n"
        "- Cập nhật lại giá vốn chuẩn trong bảng Products.\n"
        "- Ghi AuditLog."
    )

    add_h2("21.3 ApplyQuickMarkdownUseCase")
    add_first("Nhiệm vụ:")
    add_code(
        "- Nhận yêu cầu kích hoạt giảm giá xả hàng cho một lô hàng.\n"
        "- Kiểm tra người duyệt có quyền Cửa hàng trưởng không.\n"
        "- Kiểm tra lô hàng còn tồn tại và chưa hết hạn (DaysLeft > 0).\n"
        "- Cập nhật tỷ lệ giảm giá DiscountPercent (15%, 30%, 40%, 50%).\n"
        "- Đổi trạng thái lô sang WARNING để cảnh báo nhân viên.\n"
        "- Giá ưu đãi lập tức có hiệu lực ngay tại quầy POS.\n"
        "- Ghi AuditLog."
    )

    add_h2("21.4 RotateShelfFefoUseCase")
    add_first("Nhiệm vụ:")
    add_code(
        "- Nhận xác nhận đã thực hiện đảo kệ từ nhân viên kho.\n"
        "- Kiểm tra lô hàng đang ở Vùng Vàng hoặc Vùng Đỏ.\n"
        "- Ghi nhận thời gian và người thực hiện đảo lô ra mặt tiền kệ.\n"
        "- Gỡ bỏ cờ cảnh báo 'Chưa đảo kệ' trên Dashboard tác nghiệp.\n"
        "- Ghi AuditLog."
    )

    add_h2("21.5 DisposeSpoiledGoodsUseCase")
    add_first("Nhiệm vụ:")
    add_code(
        "- Nhận đề xuất tiêu hủy hàng hỏng/quá hạn.\n"
        "- Kiểm tra quyền Cửa hàng trưởng phê duyệt.\n"
        "- Kiểm tra số lượng hủy không vượt quá số lượng tồn hiện tại của lô.\n"
        "- Trừ số lượng tồn của lô hàng.\n"
        "- Nếu tồn về 0, chuyển trạng thái lô thành DISPOSED.\n"
        "- Tính giá trị vốn tổn thất: CostLoss = QuantityDisposed * ImportPrice.\n"
        "- Tạo bản ghi vào SpoilageRecords.\n"
        "- Cập nhật Sổ hao hụt tài chính.\n"
        "- Ghi AuditLog."
    )

    add_h2("21.6 CalculateROPForecastUseCase")
    add_first("Nhiệm vụ:")
    add_code(
        "- Tính tốc độ bán bình quân ngày trong 14 ngày gần nhất (d_base).\n"
        "- Điều chỉnh theo hệ số thời tiết (W_factor) và cờ ngày lễ (H_factor) ra d_adjusted.\n"
        "- Tính Điểm đặt hàng ROP = (d_adjusted * LeadTime) + SafetyStock.\n"
        "- So sánh Ngày tồn kho (DOS) với Hạn dùng ngắn nhất (DUE).\n"
        "- Nếu DOS > DUE, cảnh báo nguy cơ hàng bị ứ đọng hết hạn trước khi bán hết.\n"
        "- Nếu tồn hiện tại <= ROP, tự động đề xuất số lượng đặt hàng gửi Kho tổng DC."
    )

    add_h2("21.7 GetDashboardOverviewUseCase")
    add_first("Nhiệm vụ:")
    add_code(
        "- Tính tổng vốn tồn kho hiện tại.\n"
        "- Tính tổng giá trị vốn cận date có rủi ro mất mát.\n"
        "- Tính tỷ lệ hao hụt lãng phí Spoilage Rate %.\n"
        "- Tính doanh số bán hàng hôm nay.\n"
        "- Đếm số lượng lô cần đảo kệ.\n"
        "- Đếm số lượng lô quá hạn chờ tiêu hủy.\n"
        "- Trả dữ liệu thống kê cho Dashboard điều hành."
    )

    # --- 22. API ĐỀ XUẤT ---
    add_h1("22. API đề xuất")
    add_h2("22.1 Auth")
    add_code(
        "POST /api/auth/login\n"
        "POST /api/auth/logout\n"
        "GET  /api/auth/me"
    )

    add_h2("22.2 User")
    add_code(
        "GET    /api/users\n"
        "GET    /api/users/:id\n"
        "POST   /api/users\n"
        "PUT    /api/users/:id\n"
        "DELETE /api/users/:id"
    )

    add_h2("22.3 Store Profile")
    add_first("Vì chỉ có một cửa hàng bán lẻ, API chỉ cần lấy và cập nhật thông tin cửa hàng duy nhất.")
    add_code(
        "GET /api/store-profile\n"
        "PUT /api/store-profile"
    )

    add_h2("22.4 Product & Category")
    add_code(
        "GET    /api/categories\n"
        "POST   /api/categories\n"
        "GET    /api/products\n"
        "GET    /api/products/:id\n"
        "POST   /api/products\n"
        "PUT    /api/products/:id\n"
        "DELETE /api/products/:id"
    )

    add_h2("22.5 Batch & FEFO")
    add_code(
        "GET    /api/batches\n"
        "GET    /api/batches/:id\n"
        "POST   /api/batches/inbound\n"
        "PATCH  /api/batches/:id/discount\n"
        "PATCH  /api/batches/:id/rotate\n"
        "GET    /api/batches/alerts-3-colors"
    )

    add_h2("22.6 Sales POS")
    add_code(
        "POST /api/sales/checkout\n"
        "GET  /api/sales/history\n"
        "GET  /api/sales/receipt/:txnCode"
    )

    add_h2("22.7 Spoilage & Loss Ledger")
    add_code(
        "GET  /api/spoilage/records\n"
        "POST /api/spoilage/dispose\n"
        "GET  /api/spoilage/loss-summary"
    )

    add_h2("22.8 Forecast & Purchase Order")
    add_code(
        "GET  /api/forecast/rop\n"
        "GET  /api/forecast/risk-analysis\n"
        "GET  /api/purchase-orders\n"
        "POST /api/purchase-orders\n"
        "POST /api/purchase-orders/:id/send-to-dc"
    )

    add_h2("22.9 Dashboard")
    add_code(
        "GET /api/dashboard/overview\n"
        "GET /api/dashboard/shelf-life-stats\n"
        "GET /api/dashboard/spoilage-rate\n"
        "GET /api/dashboard/today-action-board"
    )

    # --- 23. GIAO DIỆN FRONTEND CẦN CÓ ---
    add_h1("23. Giao diện frontend cần có")
    add_h2("23.1 Trang đăng nhập")
    add_code(
        "- Đăng nhập bằng username và mật khẩu\n"
        "- Chọn nhanh tài khoản mẫu: Cửa hàng trưởng / Thu ngân / Nhân viên kho\n"
        "- Tự động điều hướng giao diện phù hợp theo vai trò sau đăng nhập"
    )

    add_h2("23.2 Dashboard tổng quan điều hành")
    add_first("Dashboard hiển thị:")
    add_code(
        "- 6 Thẻ KPI tài chính: Tổng vốn tồn kho, Giá trị rủi ro cận date, Tỷ lệ lãng phí %, Doanh thu hôm nay...\n"
        "- Biểu đồ phân bổ hạn dùng 3 màu (Xanh/Vàng/Đỏ)\n"
        "- Biểu đồ xu hướng doanh số và tổn thất hao hụt\n"
        "- Action Board khẩn cấp: Danh sách lô Đỏ cần dán tem giảm giá và đảo kệ ngay"
    )

    add_h2("23.3 Trang quầy thu ngân bán lẻ POS")
    add_first("Chức năng quầy thu ngân:")
    add_code(
        "- Ô tìm kiếm nhanh / Quét mã vạch SKU sản phẩm\n"
        "- Giỏ hàng trực quan hiển thị giá niêm yết và giá khuyến mãi nếu lô đang xả hàng\n"
        "- Chọn ngữ cảnh thời tiết (Nắng/Mưa/Bình thường) và Cờ ngày lễ\n"
        "- Tính tiền thối lại tự động cho khách\n"
        "- Nút 'Thanh toán & Xuất kho FEFO': Tự động bẻ lô và in hóa đơn chi tiết"
    )

    add_h2("23.4 Trang giám sát lô hàng & Hạn sử dụng")
    add_first("Chức năng theo dõi hạn sử dụng:")
    add_code(
        "- Bảng danh sách toàn bộ các lô hàng trong kho\n"
        "- Bộ lọc theo 4 trạng thái: Tất cả / An toàn / Cận date / Nguy kịch / Đã hết hạn\n"
        "- Badge màu đếm ngược DaysLeft sinh động\n"
        "- Menu thao tác nhanh: Áp dụng giảm giá xả hàng (15%-50%) và Nút 'Đảo kệ theo FEFO'"
    )

    add_h2("23.5 Trang tiếp nhận hàng từ Kho tổng DC")
    add_first("Chức năng nhập kho:")
    add_code(
        "- Form tiếp nhận hàng từ xe tải DC Biên Hòa\n"
        "- Chọn sản phẩm, nhập ngày sản xuất và hạn sử dụng\n"
        "- Máy tính RSL tự động: Đổi màu xanh nếu đạt chuẩn >= 70%, khóa nút lưu nếu < 70%\n"
        "- Nhập số lượng giao và đơn giá vốn\n"
        "- Lưu phiếu và in mã tem lô hàng"
    )

    add_h2("23.6 Trang tiêu hủy & Sổ hao hụt tài chính")
    add_first("Chức năng quản lý hao hụt:")
    add_code(
        "- Bảng theo dõi lịch sử Sổ hao hụt tài chính\n"
        "- Thẻ tóm tắt tổng số tiền mất mát do hàng hỏng/hết hạn\n"
        "- Form lập biên bản tiêu hủy: Chọn lô, nhập số lượng, chọn lý do, tự động tính tổng tiền thiệt hại\n"
        "- Nút Cửa hàng trưởng phê duyệt chốt sổ"
    )

    add_h2("23.7 Trang dự báo nhu cầu & Đề xuất đặt hàng DC")
    add_first("Chức năng dự báo ROP:")
    add_code(
        "- Bảng phân tích tốc độ bán thực tế 14 ngày của từng sản phẩm\n"
        "- Hệ số điều chỉnh thời tiết và ngày lễ\n"
        "- Hiển thị Điểm đặt hàng ROP và Tồn kho khả dụng\n"
        "- Cảnh báo rủi ro ứ đọng (DOS > DUE)\n"
        "- Nút 1-chạm tạo đơn đặt hàng bổ sung tự động gửi về Kho tổng DC"
    )

    add_h2("23.8 Trang nhật ký kiểm toán hệ thống (Audit Log)")
    add_first("Chức năng kiểm toán:")
    add_code(
        "- Dòng thời gian Timeline lưu vết mọi thao tác can thiệp vào kho và giá cả\n"
        "- Lọc theo thời gian, lọc theo loại hành động, lọc theo nhân viên thực hiện"
    )

    # --- 24. QUY TẮC NGHIỆP VỤ QUAN TRỌNG ---
    add_h1("24. Quy tắc nghiệp vụ quan trọng")
    add_h2("Rule 1: Chỉ có một cửa hàng bán lẻ duy nhất")
    add_first("Toàn bộ hàng hóa, giao dịch bán lẻ POS, sổ hao hụt và dự báo ROP mặc định gắn với cửa hàng duy nhất.")

    add_h2("Rule 2: FEFO tuyệt đối trong mọi giao dịch bán lẻ")
    add_first("Hệ thống luôn tự động bóc tách lô có hạn sử dụng gần nhất để xuất kho trước. Thu ngân không thể tùy tiện chọn lô hạn xa hơn.")

    add_h2("Rule 3: Chống tồn kho âm tại mọi thời điểm")
    add_first("Số lượng tồn hiện tại của lô hàng không bao giờ được phép nhỏ hơn 0. Nếu tồn kho không đủ, giao dịch bị từ chối ngay lập tức.")

    add_h2("Rule 4: Kiểm soát hạn sử dụng theo 3 ngưỡng an toàn")
    add_first("Phân loại trạng thái lô hàng thành An toàn (Xanh), Cận date (Vàng), và Nguy kịch (Đỏ) để áp dụng kịch bản xử lý tương ứng.")

    add_h2("Rule 5: Tự động khóa cứng bán lô hàng đã hết hạn")
    add_first("Bất kỳ lô hàng nào có DaysLeft <= 0 đều tự động chuyển trạng thái EXPIRED và bị khóa hoàn toàn trên POS để bảo vệ an toàn cho khách hàng.")

    add_h2("Rule 6: Hủy hàng phải gắn liền với Sổ hao hụt tài chính")
    add_first("Mọi số lượng hàng hóa rút khỏi kệ do hư hỏng hoặc quá hạn đều phải lập biên bản tiêu hủy, tính toán chính xác giá vốn tổn thất và lưu vào Sổ hao hụt.")

    add_h2("Rule 7: Kiểm tra hạn sử dụng tối thiểu khi tiếp nhận từ DC")
    add_first("Hàng nhận từ Kho tổng DC phải đạt tối thiểu 70% tổng vòng đời chuẩn (RSL >= 70%). Cửa hàng từ chối nhận hàng cận date từ DC.")

    add_h2("Rule 8: Dự báo ROP tích hợp đa yếu tố ngoại cảnh")
    add_first("Điểm đặt hàng ROP tự động điều chỉnh linh hoạt theo tốc độ bán thực tế 14 ngày, thời gian giao hàng DC, thời tiết (Nắng/Mưa) và cờ ngày lễ.")

    add_h2("Rule 9: Chống tạo trùng hoặc gần trùng sản phẩm")
    add_first("Hệ thống tự động chuẩn hóa chuỗi để chặn đứng việc nhân viên tạo nhiều sản phẩm trùng tên hoặc trùng SKU gây phân tán số liệu lô hàng.")

    add_h2("Rule 10: Kích hoạt xả hàng và đảo kệ mặt tiền")
    add_first("Đối với các lô thuộc ngưỡng cảnh báo, hệ thống ưu tiên giảm giá linh hoạt (15% - 50%) và hướng dẫn nhân viên đảo lô cận date ra mặt tiền kệ.")

    add_h2("Rule 11: Thao tác quan trọng phải ghi log kiểm toán")
    add_first("Các thao tác cần ghi AuditLog:")
    add_code(
        "- Tiếp nhận lô hàng mới từ DC\n"
        "- Xuất bán lẻ POS trừ kho FEFO\n"
        "- Kích hoạt giảm giá xả hàng\n"
        "- Xác nhận đảo lô hàng mặt tiền kệ\n"
        "- Lập đề xuất tiêu hủy hàng hỏng\n"
        "- Phê duyệt tiêu hủy và chốt Sổ hao hụt\n"
        "- Thêm/sửa sản phẩm và danh mục\n"
        "- Phân quyền tài khoản người dùng"
    )

    # --- 25. GIAO DỊCH SQL SERVER CẦN DÙNG TRANSACTION ---
    add_h1("25. Giao dịch SQL Server cần dùng transaction")
    add_first("Các nghiệp vụ cần dùng transaction:")
    add_code(
        "- Xuất bán lẻ tại quầy POS bẻ nhiều lô theo FEFO\n"
        "- Tiếp nhận lô hàng mới từ Kho tổng DC\n"
        "- Tiêu hủy hàng hỏng & hạch toán Sổ hao hụt\n"
        "- Kích hoạt giảm giá xả hàng Quick Markdown\n"
        "- Hủy đơn hàng hoặc điều chỉnh kho"
    )
    add_first("Ví dụ khi bán lẻ tại quầy POS theo nguyên tắc FEFO:")
    add_code(
        "BEGIN TRANSACTION\n"
        "1. Khóa các dòng lô hàng liên quan (UPDLOCK, ROWLOCK)\n"
        "2. Kiểm tra tổng tồn kho khả dụng còn hạn có đủ không\n"
        "3. Trừ CurrentQuantity của các lô theo thứ tự ExpiryDate ASC\n"
        "4. Ghi nhận chi tiết vào SalesHistory kèm cờ thời tiết/lễ\n"
        "5. Ghi AuditLog\n"
        "COMMIT\n\n"
        "Nếu có bất kỳ lỗi nào hoặc tồn kho âm:\n"
        "ROLLBACK"
    )

    # --- 26. PHIÊN BẢN MVP NÊN LÀM TRƯỚC ---
    add_h1("26. Phiên bản MVP nên làm trước")
    add_first("Phiên bản đầu tiên (MVP) đã hoàn thiện đầy đủ các chức năng cốt lõi:")
    add_code(
        "1. Đăng nhập và phân quyền 3 vai trò\n"
        "2. Cấu hình thông tin cửa hàng bán lẻ duy nhất\n"
        "3. Quản lý danh mục và sản phẩm FMCG (chống trùng lặp)\n"
        "4. Quản lý lô hàng và vòng đời hạn sử dụng (Shelf-Life)\n"
        "5. Quầy bán lẻ POS tự động trừ kho FEFO\n"
        "6. Giám sát hạn dùng và cảnh báo 3 cấp màu (Xanh/Vàng/Đỏ)\n"
        "7. Tự động khóa cứng bán lô hàng đã hết hạn\n"
        "8. Giảm giá xả hàng Quick Markdown (15% - 50%)\n"
        "9. Quy trình xác nhận đảo kệ mặt tiền\n"
        "10. Tiếp nhận hàng từ Kho tổng DC (kiểm tra RSL >= 70%)\n"
        "11. Tiêu hủy hàng hỏng và hạch toán Sổ hao hụt tài chính\n"
        "12. Dự báo ROP tích hợp thời tiết, ngày lễ và cảnh báo DOS > DUE\n"
        "13. Dashboard điều hành 6 thẻ KPI và biểu đồ trực quan\n"
        "14. Cơ sở dữ liệu SQL Server LocalDB chuẩn 3NF và Trigger chống âm kho"
    )
    add_first("Các chức năng nâng cao làm trong giai đoạn tiếp theo:")
    add_code(
        "1. Tích hợp máy quét mã vạch 2D / GS1 DataBar phần cứng tại quầy thu ngân\n"
        "2. Kết nối API thời tiết thời gian thực (OpenWeatherMap API)\n"
        "3. Ứng dụng mô hình Học máy (Machine Learning: LSTM, XGBoost) vào dự báo nhu cầu sâu\n"
        "4. Tích hợp máy in tem nhãn nhiệt di động dán nhãn xả hàng tại quầy kệ\n"
        "5. Ứng dụng Mobile App cho nhân viên kho quét date bằng camera"
    )

    # --- 27. KẾT LUẬN ĐẶC TẢ ---
    add_h1("27. Kết luận đặc tả")
    add_first(
        "Website quản lý chuỗi cung ứng bán lẻ chống lãng phí trong phạm vi này là hệ thống quản lý một cửa hàng bán lẻ "
        "tinh gọn duy nhất liên kết với Kho tổng DC Biên Hòa, tập trung vào:"
    )
    add_code(
        "- Quản lý thông tin cửa hàng bán lẻ duy nhất\n"
        "- Quản lý danh mục ngành hàng và sản phẩm FMCG\n"
        "- Quản lý lô hàng và hạn sử dụng từng lô (Shelf-Life)\n"
        "- Bán lẻ POS tự động trừ kho FEFO\n"
        "- Kiểm soát 3 vùng màu cảnh báo và khóa cứng hàng hết hạn\n"
        "- Giảm giá xả hàng Quick Markdown và đảo kệ mặt tiền\n"
        "- Tiếp nhận hàng từ Kho tổng DC đạt chuẩn date\n"
        "- Tiêu hủy hàng hỏng và ghi nhận Sổ hao hụt tài chính\n"
        "- Dự báo nhu cầu bán hàng và tính điểm đặt hàng ROP\n"
        "- Dashboard thống kê điều hành và nhật ký kiểm toán"
    )
    add_first("Luồng nghiệp vụ cốt lõi:")
    add_code(
        "Nhập hàng từ DC (RSL >= 70%)\n"
        "→ Lưu kho & Giám sát hạn dùng 3 màu\n"
        "→ Cận date: Giảm giá xả hàng & Đảo kệ mặt tiền\n"
        "→ Bán lẻ tại POS xuất kho theo FEFO\n"
        "→ Hết hạn: Khóa bán & Tiêu hủy ghi Sổ hao hụt\n"
        "→ Dự báo nhu cầu (Thời tiết + Lễ) & Đề xuất đơn đặt hàng DC (ROP)"
    )
    add_first("Kiến trúc triển khai:")
    add_code(
        "Clean Architecture\n"
        "+ Microsoft SQL Server LocalDB (retail_spoilage_db)\n"
        "+ Backend RESTful API\n"
        "+ Frontend SPA Dashboard & POS"
    )
    add_first("Tầng xử lý:")
    add_code(
        "Domain Layer: nghiệp vụ cốt lõi (FEFO, ROP, Shelf-Life, Money)\n"
        "Application Layer: use cases (ProcessFefoSale, ReceiveDCBatch, DisposeSpoilage...)\n"
        "Infrastructure Layer: SQL Server LocalDB, connection pool, repository\n"
        "Presentation Layer: RESTful API, controller, middleware, SPA frontend"
    )
    add_first(
        "Đặc tả này đóng vai trò là tài liệu kỹ thuật chuẩn mực, kế thừa trọn vẹn phong cách và cấu trúc của tài liệu mẫu, "
        "phục vụ hoàn hảo cho việc bảo vệ đồ án tốt nghiệp của nhóm sinh viên Đỗ Tấn Du (123001364) và Đoàn Minh Quân (123000946) "
        "dưới sự hướng dẫn khoa học của ThS. Lê Minh Nhật - Khoa Công nghệ Thông tin, Trường Đại học Lạc Hồng."
    )

    doc.save(OUTPUT_FILE)
    print("Successfully built matching specification document!")

if __name__ == "__main__":
    build_document()
