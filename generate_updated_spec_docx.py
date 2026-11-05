# -*- coding: utf-8 -*-
"""
Script to generate the standardized, enriched, and cleaned Word specification document:
'ĐẶC TẢ NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ'
(Supply Chain Spoilage Predictor)
Được cập nhật toàn diện theo ĐÚNG 7 ĐIỂM TRONG 'NOTE MỚI NGÀY 2/10':
1. Kiểm tra lại các rule trong file word (BR-01 đến BR-10 nhất quán, chặt chẽ).
2. Bổ sung thêm người chịu trách nhiệm quản lý khi nhập kho (Cửa hàng trưởng - Store Manager phê duyệt và chịu trách nhiệm pháp lý/bồi thường).
3. Phân tích thêm mỗi chức năng người dùng sẽ làm cái gì và thêm luồng xem nó đi sao (8 chức năng trọng tâm).
4. Xây giao diện UI/UX bằng khung wireframe hero section (Landing page & Executive hero banner).
5. Xây dựng khung dashboard bằng text-based wireframe (Bố cục lưới đa chiều, 6 thẻ KPI, biểu đồ text, action board).
6. Thêm mấy cái rule ở phía dưới (Toàn bộ 10 Business Rules đặt ở cuối tài liệu phân tích).
7. Xây dựng từng user trước rồi phân tích user đó làm được cái gì cái gì (User Persona, Mục tiêu, Nỗi đau, Quyền hạn được làm và Bị cấm).
"""

import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import os
import shutil
import sys

BASE_TEMPLATE = "Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.docx"
OUTPUT_NEW = "Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor (Ban Hoan Thien Wireframe & Persona).docx"
OUTPUT_PRIMARY = "Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor (Ban Cap Nhat Theo Y Thay).docx"
OUTPUT_ORIGINAL = "Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.docx"

def build_full_document():
    print(f"Loading template from {BASE_TEMPLATE}...")
    doc = Document(BASE_TEMPLATE)

    # Xóa toàn bộ nội dung cũ trong body nhưng giữ nguyên styles, fonts, margins
    for p in list(doc.paragraphs):
        p._element.getparent().remove(p._element)
    for t in list(doc.tables):
        t._element.getparent().remove(t._element)

    def add_h1(text):
        return doc.add_paragraph(text, style='Heading 1')

    def add_h2(text):
        return doc.add_paragraph(text, style='Heading 2')

    def add_h3(text):
        return doc.add_paragraph(text, style='Heading 3')

    def add_first(text):
        return doc.add_paragraph(text, style='First Paragraph')

    def add_body(text):
        return doc.add_paragraph(text, style='Body Text')

    def add_code(text):
        return doc.add_paragraph(text, style='Source Code')

    def add_custom_table(headers, rows_data):
        table = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
        table.style = 'Table'
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        
        # Header row
        for c_idx, h in enumerate(headers):
            cell = table.cell(0, c_idx)
            cell.text = h
            p = cell.paragraphs[0]
            p.style = 'Compact'
            for r in p.runs:
                r.font.bold = True
        
        # Data rows
        for r_idx, row in enumerate(rows_data):
            for c_idx, val in enumerate(row):
                cell = table.cell(r_idx + 1, c_idx)
                cell.text = str(val)
                p = cell.paragraphs[0]
                p.style = 'Compact'
        return table

    # =========================================================================
    # TIÊU ĐỀ TÀI LIỆU
    # =========================================================================
    add_h1("ĐẶC TẢ NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ")
    add_h2("Theo Clean Architecture và Cơ sở dữ liệu Microsoft SQL Server (Retail Store Spoilage Predictor)")

    # =========================================================================
    # 1. MỤC TIÊU HỆ THỐNG
    # =========================================================================
    add_h1("1. Mục tiêu hệ thống")
    add_first(
        "Đề tài: 'Nền tảng Quản trị Chuỗi cung ứng Bán lẻ Chống lãng phí (Supply Chain Spoilage Predictor)' "
        "được thực hiện bởi nhóm sinh viên Đỗ Tấn Du (MSSV: 123001364) và Đoàn Minh Quân (MSSV: 123000946) thuộc "
        "Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU), dưới sự hướng dẫn khoa học của ThS. Lê Minh Nhật."
    )
    add_body(
        "Trong ngành bán lẻ thực phẩm và hàng tiêu dùng nhanh (FMCG), vấn đề lãng phí do hàng hóa cận date, "
        "hết hạn sử dụng gây tổn thất tài chính khổng lồ cho các cửa hàng (trung bình từ 2% - 4% tổng doanh thu) "
        "và tạo gánh nặng rác thải lớn cho xã hội. Phần lớn các phần mềm bán lẻ hiện nay chỉ quản lý tồn kho chung chung "
        "theo số lượng tổng (SKU) mà bỏ quên hoàn toàn việc theo dõi hạn sử dụng chi tiết theo từng đợt nhập (Lô hàng - Batches). "
        "Do đó, đề tài ra đời nhằm giải quyết triệt để bài toán này bằng công nghệ quản trị chuỗi cung ứng thông minh."
    )
    add_body(
        "Hệ thống định vị là nền tảng quản trị một cửa hàng bán lẻ tinh gọn (Single Retail Store - ví dụ: LHU Mart), "
        "tiếp nhận hàng định kỳ từ Kho tổng trung tâm (Distribution Center - DC Biên Hòa), kiểm soát hạn sử dụng từng lô (Shelf-Life), "
        "cảnh báo cận date 3 cấp màu trực quan (Xanh/Vàng/Đỏ), bán lẻ tại quầy POS theo nguyên tắc FEFO (First Expired, First Out - "
        "Bán hàng chính là Xuất kho), giảm giá xả hàng Quick Markdown, đảo kệ mặt tiền, tiêu hủy hàng hỏng ghi nhận Sổ hao hụt tài chính, "
        "và dự báo nhu cầu ROP tích hợp thời tiết, ngày lễ để đề xuất đơn nhập hàng mới gửi về Kho tổng DC."
    )

    # =========================================================================
    # 2. PHẠM VI HỆ THỐNG
    # =========================================================================
    add_h1("2. Phạm vi hệ thống")
    add_first("Hệ thống quản lý các nhóm dữ liệu và chức năng trọng tâm:")
    add_code(
        "1. Thông tin cửa hàng bán lẻ tinh gọn duy nhất (StoreProfile: LHU Mart)\n"
        "2. Kho tổng cung ứng liên kết trực tiếp (DC Biên Hòa)\n"
        "3. Danh mục ngành hàng FMCG và thực phẩm tiện lợi\n"
        "4. Sản phẩm hàng hóa bán lẻ (Mã SKU/Barcode, giá vốn, giá niêm yết, tồn an toàn)\n"
        "5. Lô hàng và vòng đời hạn sử dụng (Shelf-Life Management)\n"
        "6. Người dùng và chuẩn hóa 4 nhóm vai trò (Admin, Quản lý, Nhân viên bán hàng, Nhân viên kho)\n"
        "7. Phiếu tiếp nhận hàng từ Kho tổng DC (Kiểm soát tiêu chuẩn RSL >= 70% và ký duyệt quản lý)\n"
        "8. Đơn bán lẻ tại quầy POS (Khấu trừ tồn kho tự động theo nguyên tắc FEFO)\n"
        "9. Giám sát hạn dùng và cảnh báo 3 cấp màu (Xanh: An toàn, Vàng: Cận date nhẹ, Đỏ: Nguy kịch)\n"
        "10. Kích hoạt giảm giá xả hàng linh hoạt Quick Markdown (15% - 50%)\n"
        "11. Quy trình đảo lô hàng cận date ra mặt tiền quầy kệ theo FEFO\n"
        "12. Biên bản tiêu hủy hàng hỏng/quá date & Sổ hao hụt tài chính (Spoilage Loss Ledger)\n"
        "13. Dự báo nhu cầu tiêu thụ ROP tích hợp đa yếu tố (Thời tiết, Ngày lễ, Lead Time)\n"
        "14. Đơn đề xuất đặt hàng gửi về Kho tổng DC (Purchase Orders)\n"
        "15. Executive Dashboard điều hành thời gian thực và Action Board khẩn cấp\n"
        "16. Nhật ký kiểm toán an toàn hệ thống (Audit Trail / Audit Logs)"
    )

    # =========================================================================
    # 3. ĐẶC ĐIỂM QUAN TRỌNG CỦA HỆ THỐNG
    # =========================================================================
    add_h1("3. Đặc điểm quan trọng của hệ thống")
    add_h2("3.1 Mô hình Cửa hàng Bán lẻ tinh gọn (Single Retail Store)")
    add_first(
        "Theo định hướng nghiệp vụ chuẩn mực của ThS. Lê Minh Nhật, hệ thống tập trung hoàn toàn vào "
        "bản chất thực tế của mô hình cửa hàng bán lẻ (Retail Store như Bách Hóa Xanh, Co.op Food, WinMart+):"
    )
    add_code(
        "- Không phát triển thủ tục xuất kho nội bộ riêng biệt: Bán hàng cho khách lẻ chính là Xuất kho (Sales Out = Inventory Issue).\n"
        "- Không làm chức năng luân chuyển hàng ngang giữa các chi nhánh (Inter-store Transfer).\n"
        "- Không làm thủ tục hoàn trả nhà cung cấp phức tạp (Return to Vendor - RTV).\n"
        "- Không quản lý chuỗi siêu thị đa cấp: Toàn bộ số liệu xoay quanh 1 cửa hàng bán lẻ liên kết trực tiếp với Kho tổng DC Biên Hòa."
    )
    add_first("Cấu hình thông tin cửa hàng thực tế mẫu:")
    add_code(
        "Tên cửa hàng: Cửa hàng Bán lẻ Tiện lợi LHU Mart\n"
        "Mã cửa hàng: RETAIL-STORE-01\n"
        "Địa chỉ: Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai\n"
        "Kho tổng liên kết: Trung tâm Phân phối DC Biên Hòa (Mã: DC-BIENHOA)\n"
        "Thời gian giao hàng chuẩn (Lead Time): 1 ngày\n"
        "Ngành hàng trọng tâm: Sữa, Bánh tươi, Nước giải khát, Thực phẩm mát, Đồ khô FMCG"
    )

    add_h2("3.2 Cơ sở dữ liệu Microsoft SQL Server & Kiến trúc Clean Architecture")
    add_first("Hệ thống vận hành trên Microsoft SQL Server LocalDB database retail_spoilage_db:")
    add_code(
        "- Chuẩn hóa CSDL đạt chuẩn 3NF với 13 bảng quan hệ rõ ràng.\n"
        "- Khóa chính UNIQUEIDENTIFIER (UUID) và khóa ngoại toàn vẹn dữ liệu.\n"
        "- Ràng buộc CHECK chống âm kho tuyệt đối: CHECK (CurrentQuantity >= 0).\n"
        "- Toàn bộ chuỗi tiếng Việt có dấu lưu trữ NVARCHAR với tiền tố N'...' và mã hóa UTF-8-sig.\n"
        "- Sử dụng ACID Database Transactions cho toàn bộ các nghiệp vụ biến động kho (bán FEFO, nhập DC, hủy hàng).\n"
        "- Kiến trúc phân tầng Clean Architecture: Tách biệt triệt để Domain Layer, Application Layer, Infrastructure Layer và Presentation Layer."
    )

    # =========================================================================
    # 4. XÂY DỰNG TỪNG USER TRƯỚC RỒI PHÂN TÍCH USER ĐÓ LÀM ĐƯỢC CÁI GÌ CÁI GÌ
    # =========================================================================
    add_h1("4. Xây dựng Từng User & Phân tích Chi tiết Quyền hạn 'User làm được cái gì'")
    add_first(
        "Tuân thủ nghiêm ngặt chỉ dẫn: 'Xây dựng từng user trước rồi phân tích user đó làm được cái gì cái gì', "
        "hệ thống tiến hành định hình cụ thể hồ sơ Persona, nhiệm vụ, danh mục chức năng được phép thực hiện, "
        "các hành vi bị nghiêm cấm và chế tài trách nhiệm cho từng vai trò người dùng trong cửa hàng bán lẻ."
    )

    # 4.1 Admin
    add_h2("4.1 User 1: Quản trị viên hệ thống (System Administrator / Admin)")
    add_first("Hồ sơ Persona đại diện:")
    add_code(
        "Tên đại diện:        Đỗ Tấn Du\n"
        "Chức danh:           Quản trị viên Hệ thống & Cơ sở Dữ liệu (System & DB Admin)\n"
        "Trình độ chuyên môn: Kỹ sư Phần mềm & Quản trị Mạng\n"
        "Thiết bị sử dụng:    Máy tính để bàn (Desktop / Laptop), trình duyệt Chrome/Edge"
    )
    add_body("Mục tiêu công việc (Goals):")
    add_code(
        "- Duy trì tính sẵn sàng cao của hệ thống (Uptime 99.9%), đảm bảo các quầy POS và kho vận hành thông suốt.\n"
        "- Bảo đảm an toàn an ninh dữ liệu, bảo mật mật khẩu và ngăn chặn các truy cập trái phép.\n"
        "- Giám sát toàn vẹn CSDL SQL Server, bảo đảm không bao giờ xảy ra lỗi xung đột hoặc âm tồn kho.\n"
        "- Lưu trữ và truy xuất tức thì các dòng nhật ký kiểm toán (Audit Trail) phục vụ điều tra sai lệch số liệu."
    )
    add_body("Nỗi đau & Thách thức trong vận hành (Pain Points):")
    add_code(
        "- Nhân viên tại quầy thường quên mật khẩu hoặc thao tác nhầm lẫn gây sai số liệu.\n"
        "- Khó khăn trong việc truy cứu trách nhiệm cá nhân nếu hệ thống thiếu nhật ký thao tác bất biến.\n"
        "- Rủi ro tranh chấp tài nguyên (Concurrency / Deadlock) khi nhiều nhân viên cùng thao tác tồn kho một lúc."
    )
    add_body("Danh mục cụ thể: Admin làm được cái gì trên hệ thống?")
    add_code(
        "1. Khởi tạo tài khoản nhân viên mới: Nhập Username, Họ tên, Role, sinh mật khẩu ban đầu băm Bcrypt.\n"
        "2. Khóa / Kích hoạt tài khoản nhân viên (toggle is_active): Chặn đăng nhập ngay lập tức khi nhân viên nghỉ việc.\n"
        "3. Thiết lập lại mật khẩu tài khoản khi nhân viên quên mật khẩu.\n"
        "4. Phân quyền vai trò chi tiết (Role-Based Access Control) cho từng nhóm chức năng.\n"
        "5. Cấu hình thông tin cửa hàng bán lẻ: Đổi tên điểm bán, địa chỉ, số hotline, giờ mở/đóng cửa.\n"
        "6. Cấu hình Kho tổng DC liên kết mặc định và thời gian giao hàng chuẩn (Lead Time).\n"
        "7. Cấu hình tham số ngưỡng cảnh báo hạn dùng hệ thống: Buffer %, Tỷ lệ tồn kho an toàn SS %.\n"
        "8. Giám sát tình trạng CSDL SQL Server LocalDB: Xem ping kết nối, kiểm tra ràng buộc CHECK chống âm kho.\n"
        "9. Tra cứu và xuất báo cáo toàn cảnh Nhật ký Kiểm toán (Full System Audit Logs) lọc theo User/IP/Thời gian."
    )
    add_body("Các hành vi Admin BỊ CẤM / RÀNG BUỘC TUYỆT ĐỐI:")
    add_code(
        "- Admin KHÔNG ĐƯỢC PHÉP trực tiếp quét bán lẻ tại quầy POS (tránh xung đột số liệu thu ngân).\n"
        "- Admin KHÔNG ĐƯỢC PHÉP tự ý chỉnh sửa số lượng tồn kho của các lô hàng trong CSDL.\n"
        "- Admin KHÔNG ĐƯỢC PHÉP thay mặt Cửa hàng trưởng bấm duyệt tiêu hủy hàng hóa hoặc duyệt xả hàng."
    )

    # 4.2 Cửa hàng trưởng (Store Manager)
    add_h2("4.2 User 2: Quản lý cửa hàng / Cửa hàng trưởng (Store Manager)")
    add_first("Hồ sơ Persona đại diện:")
    add_code(
        "Tên đại diện:        Đoàn Minh Quân\n"
        "Chức danh:           Cửa hàng trưởng Điều hành Điểm bán (Store Manager)\n"
        "Kinh nghiệm:         3 năm quản lý chuỗi bán lẻ FMCG và thực phẩm tiện lợi\n"
        "Thiết bị sử dụng:    Laptop quản lý, máy tính bảng điều hành di động tại cửa hàng"
    )
    add_body("Mục tiêu công việc (Goals):")
    add_code(
        "- Tối đa hóa doanh thu và lợi nhuận gộp của cửa hàng LHU Mart.\n"
        "- Kiểm soát và kéo giảm tỷ lệ lãng phí hư hỏng thực phẩm (Spoilage Rate) từ 3.5% xuống dưới 1.5% doanh thu.\n"
        "- Thu hồi tối đa vốn lưu động từ các lô hàng cận date thông qua chính sách giảm giá xả hàng linh hoạt.\n"
        "- Tối ưu hóa vòng quay tồn kho, không để xảy ra tình trạng đứt hàng các sản phẩm bán chạy (Out-of-Stock).\n"
        "- Chịu trách nhiệm pháp lý cao nhất về việc đảm bảo không có bất kỳ sản phẩm quá hạn nào bán ra cho người tiêu dùng."
    )
    add_body("Nỗi đau & Thách thức trong vận hành (Pain Points):")
    add_code(
        "- Không có công cụ cảnh báo sớm trực quan; khi phát hiện hàng cận date thì chỉ còn 1 ngày, không kịp bán xả lỗ.\n"
        "- Hàng hóa hết hạn phải vứt bỏ nhưng không có sổ sách hạch toán minh bạch số vốn bị thất thoát.\n"
        "- Việc đặt hàng về Kho tổng DC thường dựa trên cảm tính, dẫn đến khi thì thừa ế ôi thiu, khi thì cháy hàng.\n"
        "- Thiếu bảng điều khiển tổng hợp để nắm bắt bức tranh tài chính và tỷ lệ an toàn hạn dùng trong 1 phút."
    )
    add_body("Danh mục cụ thể: Cửa hàng trưởng làm được cái gì trên hệ thống?")
    add_code(
        "1. Giám sát Executive Dashboard: Xem 6 thẻ KPI tài chính, tỷ lệ lãng phí %, biểu đồ hạn dùng 3 màu.\n"
        "2. Kiểm tra Action Board khẩn cấp mỗi đầu ca để nắm bắt các lô Vùng Đỏ (<= 3 ngày) và Vùng Vàng.\n"
        "3. DUY NHẤT có quyền PHÊ DUYỆT kích hoạt giảm giá xả hàng Quick Markdown (15%, 30%, 40%, 50%) cho lô cận date.\n"
        "4. Chỉ đạo nhân viên kho thực hiện đảo hàng FEFO ra ngoài mặt tiền kệ và theo dõi xác nhận trên hệ thống.\n"
        "5. DUYỆT NHẬP KHO DC & KÝ BIÊN BẢN BÀN GIAO: Đối soát thực tế đợt hàng xe tải DC giao đến, ký duyệt nhập lô.\n"
        "6. DUY NHẤT có quyền PHÊ DUYỆT tiêu hủy hàng hỏng/quá hạn: Kích hoạt trừ kho DISPOSED và ký chốt Sổ hao hụt.\n"
        "7. Xem dự báo nhu cầu bán hàng ROP tích hợp thời tiết/ngày lễ; điều chỉnh và DUYỆT ĐƠN ĐẶT HÀNG gửi DC.\n"
        "8. Quản lý danh mục ngành hàng và sản phẩm (điều chỉnh giá niêm yết, giá vốn, định mức tồn kho an toàn SS).\n"
        "9. Phê duyệt điều chỉnh tồn kho sau các đợt kiểm kê định kỳ đối soát thực tế với phần mềm."
    )
    add_body("Trách nhiệm giải trình & Chế tài:")
    add_code(
        "- Chịu trách nhiệm cao nhất về Spoilage Rate của cửa hàng.\n"
        "- Nếu để xảy ra tình trạng bán lọt hàng quá hạn cho khách: Khiển trách và chịu trách nhiệm trước thanh tra ATTP.\n"
        "- Ký nhận đợt nhập DC có hàng cận date (< 70% RSL): Liên đới bồi thường thiệt hại cùng nhân viên kho."
    )

    # 4.3 Thu ngân (Cashier)
    add_h2("4.3 User 3: Nhân viên bán hàng & Thu ngân (Cashier / Sales Staff)")
    add_first("Hồ sơ Persona đại diện:")
    add_code(
        "Tên đại diện:        Lê Thu Ngân\n"
        "Chức danh:           Nhân viên Thu ngân Bán lẻ Quầy POS (Cashier)\n"
        "Độ tuổi:             22 tuổi, sinh viên làm việc theo ca\n"
        "Thiết bị sử dụng:    Máy bán hàng POS màn hình cảm ứng tích hợp đầu đọc Barcode và máy in hóa đơn nhiệt"
    )
    add_body("Mục tiêu công việc (Goals):")
    add_code(
        "- Thanh toán hóa đơn cho khách hàng nhanh chóng, chính xác (trung bình dưới 30 giây mỗi giao dịch).\n"
        "- Không tính sai tiền, thu đúng giá niêm yết hoặc giá khuyến mãi xả hàng đã được Quản lý phê duyệt.\n"
        "- Tuyệt đối không để xảy ra sai sót bán lọt sản phẩm hết hạn sử dụng cho người tiêu dùng.\n"
        "- Thu thập chính xác ngữ cảnh bán hàng (Thời tiết, Ngày lễ) phục vụ thuật toán học máy dự báo nhu cầu."
    )
    add_body("Nỗi đau & Thách thức trong vận hành (Pain Points):")
    add_code(
        "- Giờ tan tầm khách xếp hàng đông, áp lực thanh toán rất lớn, không có thời gian đứng kiểm tra từng hạn sử dụng.\n"
        "- Nếu phải tự nhìn bao bì rồi chọn lô hàng xuất kho thủ công thì rất dễ nhầm lẫn và chậm trễ.\n"
        "- Sợ bị khách hàng khiếu nại, la mắng nếu vô tình tính nhầm giá xả hàng hoặc đưa nhầm hộp sữa cận date."
    )
    add_body("Danh mục cụ thể: Thu ngân làm được cái gì trên hệ thống?")
    add_code(
        "1. Quét mã vạch Barcode/SKU sản phẩm tại quầy POS để đưa sản phẩm vào giỏ hàng.\n"
        "2. Điều chỉnh số lượng sản phẩm khách mua; hệ thống tự động bẻ lô FEFO và hiển thị giá chiết khấu nếu có.\n"
        "3. Tích chọn cờ ngữ cảnh tại quầy: Thời tiết (Nắng nóng / Mưa bão / Bình thường) và cờ Ngày lễ / Cuối tuần.\n"
        "4. Bấm nút [Thanh toán & Xuất kho FEFO]: Kích hoạt trừ kho tự động từ lô date gần nhất, in hóa đơn giao khách.\n"
        "5. Nhận cảnh báo tức thì từ hệ thống nếu quét phải sản phẩm quá hạn (Hệ thống khóa bán, cấm xuất hóa đơn).\n"
        "6. Tra cứu nhanh tồn kho khả dụng và giá bán của sản phẩm khi khách hỏi.\n"
        "7. Lập Phiếu báo cáo sự cố hàng hóa tại quầy (phát hiện móp méo, rách bao bì, khách đổi trả) chuyển cách ly.\n"
        "8. In báo cáo doanh số ca trực, kiểm đếm tiền mặt két và thực hiện bàn giao ca thu ngân."
    )
    add_body("Các hành vi Thu ngân BỊ CẤM TUYỆT ĐỐI:")
    add_code(
        "- Thu ngân KHÔNG ĐƯỢC PHÉP tự ý sửa giá bán niêm yết hoặc tự ý chiết khấu ngoài chính sách hệ thống.\n"
        "- Thu ngân KHÔNG ĐƯỢC PHÉP tự sửa số lượng tồn kho hoặc bỏ qua bước quét trừ kho FEFO.\n"
        "- Thu ngân KHÔNG ĐƯỢC PHÉP thanh toán các sản phẩm đã bị hệ thống đánh dấu EXPIRED."
    )

    # 4.4 Nhân viên kho (Warehouse Staff)
    add_h2("4.4 User 4: Nhân viên kho & Quản lý quầy kệ (Warehouse / Inventory Staff)")
    add_first("Hồ sơ Persona đại diện:")
    add_code(
        "Tên đại diện:        Trần Kho Vận\n"
        "Chức danh:           Nhân viên Kho vận & Quản lý Quầy kệ (Warehouse & Shelf Staff)\n"
        "Kinh nghiệm:         1 năm làm việc tại các cửa hàng tiện ích\n"
        "Thiết bị sử dụng:    Máy tính bảng kiểm kê kho, máy in tem nhãn nhiệt di động, máy tính kho"
    )
    add_body("Mục tiêu công việc (Goals):")
    add_code(
        "- Kiểm soát chặt chẽ chất lượng hạn sử dụng của xe tải DC khi giao đến, kiên quyết từ chối hàng cận date.\n"
        "- Nhập kho chuẩn xác 100% số lượng, mã lô, NSX, HSD vào phần mềm ngay khi tiếp nhận.\n"
        "- Duy trì trật tự quầy kệ trưng bày theo đúng chuẩn FEFO: Lô date gần xếp ngoài mặt tiền, lô mới xếp vào trong.\n"
        "- Dán tem nhãn giảm giá xả hàng kịp thời lên sản phẩm ngay sau khi Cửa hàng trưởng phê duyệt markdown.\n"
        "- Phát hiện, thu gom và cách ly vật lý kịp thời các sản phẩm dập nát, phồng rộp, hết hạn để lập đề xuất tiêu hủy."
    )
    add_body("Nỗi đau & Thách thức trong vận hành (Pain Points):")
    add_code(
        "- Kho tổng DC đôi khi giao kèm các thùng hàng cận date nếu nhân viên không kiểm đếm kỹ NSX/HSD trên bao bì.\n"
        "- Quầy kệ bán lẻ thường xuyên bị khách hàng bới móc làm xáo trộn vị trí giữa các lô date cũ và date mới.\n"
        "- Quên đảo hàng ra ngoài khiến hàng cận date bị khuất tầm nhìn, khách không mua dẫn đến quá hạn phải đổ bỏ."
    )
    add_body("Danh mục cụ thể: Nhân viên kho làm được cái gì trên hệ thống?")
    add_code(
        "1. Tiếp nhận hàng xe tải DC: Kiểm tra NSX, HSD trên bao bì, tính RSL; nhập form phiếu tiếp nhận hàng mới.\n"
        "2. Tạo lô hàng mới trong CSDL (hệ thống sinh mã batch_code tự động), in tem mã vạch dán lên thùng lưu kho.\n"
        "3. Rà soát Bảng Giám sát Hạn sử dụng theo lô, lọc danh sách các lô Vùng Vàng (Warning) và Vùng Đỏ (Critical).\n"
        "4. Đi kiểm tra vị trí thực tế trên quầy kệ, thực hiện nghiệp vụ ĐẢO HÀNG FEFO kéo hàng date gần ra sát mép mặt tiền.\n"
        "5. Bấm nút '[V] Xác nhận đã đảo kệ mặt tiền' trên phần mềm để ghi nhận nhật ký trách nhiệm vào CSDL.\n"
        "6. Lập Phiếu đề xuất xả hàng giảm giá (chọn mức chiết khấu 15%-50%) gửi Cửa hàng trưởng phê duyệt.\n"
        "7. Nhận lệnh phê duyệt giảm giá -> In tem nhãn khuyến mãi và dán trực tiếp lên bao bì sản phẩm tại kệ.\n"
        "8. Rà soát các lô quá hạn (DaysLeft <= 0) hoặc hàng dập nát, đưa vào khu cách ly và lập Phiếu đề xuất tiêu hủy.\n"
        "9. Tham gia kiểm kê kho định kỳ, quét đếm số lượng thực tế và đối soát sai lệch tồn kho với phần mềm."
    )
    add_body("Ràng buộc tác nghiệp:")
    add_code(
        "- Nhân viên kho chỉ có quyền ĐỀ XUẤT xả hàng và ĐỀ XUẤT tiêu hủy; bắt buộc phải chờ sự PHÊ DUYỆT chính thức "
        "của Cửa hàng trưởng trên hệ thống trước khi dán nhãn xả hàng hoặc mang hàng đi đổ bỏ."
    )

    # =========================================================================
    # 5. BỔ SUNG NGƯỜI CHỊU TRÁCH NHIỆM QUẢN LÝ KHI NHẬP KHO & MA TRẬN RACI
    # =========================================================================
    add_h1("5. Bổ sung Người Chịu Trách Nhiệm Quản Lý Khi Nhập Kho & Ma trận RACI")
    
    add_h2("5.1 Quy định Trách nhiệm Quản lý khi Nhập kho (Store Manager Inbound Accountability)")
    add_first(
        "Tuân thủ nghiêm ngặt yêu cầu: 'Bổ sung thêm người chịu trách nhiệm quản lý khi nhập kho', "
        "quy trình nhập hàng từ Kho tổng DC Biên Hòa được phân định rõ ràng giữa người thừa hành và người quản lý:"
    )
    add_code(
        "+------------------------------------------------------------------------------------------------------+\n"
        "| PHÂN CÔNG TRÁCH NHIỆM KHI XE TẢI KHO TỔNG DC BIÊN HÒA GIAO HÀNG ĐẾN CỬA HÀNG:                        |\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| 1. NGƯỜI THỰC HIỆN TRỰC TIẾP (RESPONSIBLE - R): NHÂN VIÊN KHO                                        |\n"
        "|    - Kiểm tra ngoại quan thùng hàng: Tem niêm phong, độ dập nát, nhiệt độ bảo quản xe lạnh.          |\n"
        "|    - Kiểm đếm số lượng thực tế đối chiếu với hóa đơn vận chuyển của tài xế xe tải DC.                |\n"
        "|    - Đọc Ngày sản xuất (NSX) và Hạn sử dụng (HSD) in trên bao bì sản phẩm.                          |\n"
        "|    - Tính toán tỷ lệ RSL_inbound = (HSD - Ngày nhập) / (HSD - NSX). Bắt buộc RSL >= 70%.            |\n"
        "|    - Nhập dữ liệu vào màn hình Tiếp nhận hàng DC trên phần mềm để khởi tạo lô hàng.                  |\n"
        "|                                                                                                      |\n"
        "| 2. NGƯỜI CHỊU TRÁCH NHIỆM QUẢN LÝ CAO NHẤT (ACCOUNTABLE - A): CỬA HÀNG TRƯỞNG (STORE MANAGER)       |\n"
        "|    - Cửa hàng trưởng là người DUY NHẤT chịu trách nhiệm quản lý toàn diện đợt nhập kho trước công ty.|\n"
        "|    - Trực tiếp đối soát số liệu tổng thể, kiểm tra chéo ngẫu nhiên date của các lô hàng nhạy cảm.    |\n"
        "|    - Ký xác nhận biên bản bàn giao hàng hóa với tài xế xe tải DC Biên Hòa.                           |\n"
        "|    - Bấm nút 'PHÊ DUYỆT XÁC NHẬN NHẬP KHO' trên phần mềm để chính thức ghi nhận tài sản vào CSDL.    |\n"
        "|    - XỬ LÝ SỰ CỐ: Nếu hàng bị rách vỡ hoặc RSL < 70%, Cửa hàng trưởng là người DUY NHẤT có thẩm     |\n"
        "|      quyền ký biên bản TỪ CHỐI TIẾP NHẬN và yêu cầu xe tải chở ngược về Kho tổng DC.                 |\n"
        "|                                                                                                      |\n"
        "| 3. CHẾ TÀI TRÁCH NHIỆM KỶ LUẬT & BỒI THƯỜNG:                                                         |\n"
        "|    - Nếu phát hiện cửa hàng tiếp nhận lô hàng có RSL < 70% dẫn đến hàng bị hư hỏng quá date sau đó:  |\n"
        "|      CỬA HÀNG TRƯỞNG VÀ NHÂN VIÊN KHO LIÊN ĐỚI CHỊU TRÁCH NHIỆM BỒI THƯỜNG 100% GIÁ TRỊ VỐN THẤT THOÁT.|\n"
        "+------------------------------------------------------------------------------------------------------+"
    )

    add_h2("5.2 Bảng Ma trận Phân công Trách nhiệm RACI Toàn diện")
    add_first(
        "Quy ước ma trận RACI:\n"
        "- R (Responsible): Người trực tiếp thực hiện thao tác.\n"
        "- A (Accountable): Người chịu trách nhiệm quản lý cao nhất và có quyền phê duyệt duy nhất.\n"
        "- C (Consulted): Người được tham vấn hoặc phối hợp cung cấp thông tin.\n"
        "- I (Informed): Người nhận thông báo kết quả sau khi thao tác hoàn tất."
    )

    raci_headers = ["Nghiệp vụ / Thao tác hệ thống", "Admin", "Quản lý (Store Manager)", "Thu ngân (POS)", "Nhân viên kho", "Người chịu trách nhiệm chính (A)", "Ràng buộc & Chế tài"]
    raci_rows = [
        [
            "1. Tiếp nhận hàng từ DC (Kiểm date, tạo lô)",
            "I", "A (Ký duyệt quản lý)", "I", "R (Kiểm & Nhập)",
            "Cửa hàng trưởng & Nhân viên kho",
            "Bắt buộc RSL >= 70%. Cửa hàng trưởng duyệt nhận. Liên đới bồi thường nếu lọt hàng date xấu."
        ],
        [
            "2. Kiểm kho & Đối soát số lượng thực tế",
            "I", "A (Chốt kiểm kê)", "C", "R (Đếm kho)",
            "Cửa hàng trưởng",
            "Lập biên bản chênh lệch. Giải trình nếu thất thoát."
        ],
        [
            "3. Đảo kệ FEFO ra mặt tiền trưng bày",
            "I", "A (Giám sát)", "C", "R (Thực hiện đảo)",
            "Nhân viên kho ca trực",
            "Bắt buộc bấm 'Xác nhận đảo kệ' trên hệ thống."
        ],
        [
            "4. Đề xuất xả hàng cận date (Quick Markdown)",
            "I", "A (Duyệt giá)", "R (Đề xuất)", "R (Đề xuất)",
            "Cửa hàng trưởng (Duyệt duy nhất)",
            "Chỉ giảm 15%, 30%, 50% khi lô rơi vào Vùng Vàng/Đỏ."
        ],
        [
            "5. Dán tem giảm giá xả hàng lên sản phẩm",
            "I", "I", "R", "R",
            "Nhân viên kho / Bán hàng ca trực",
            "Chỉ dán tem sau khi Quản lý đã duyệt trên hệ thống."
        ],
        [
            "6. Bán hàng tại quầy POS & Khấu trừ kho FEFO",
            "I", "I", "R (Bán hàng)", "I",
            "Thu ngân ca trực",
            "POS tự động trừ FEFO, chặn hàng hết hạn, cấm âm kho."
        ],
        [
            "7. Lập đề xuất tiêu hủy hàng hỏng/quá date",
            "I", "A (Duyệt hủy)", "R (Đề xuất)", "R (Đề xuất)",
            "Cửa hàng trưởng (Duyệt duy nhất)",
            "Cách ly vật lý hàng hỏng, chụp ảnh minh chứng."
        ],
        [
            "8. Phê duyệt tiêu hủy & Chốt Sổ hao hụt",
            "I", "R, A", "I", "I",
            "Cửa hàng trưởng",
            "Hệ thống trừ kho DISPOSED, tính tổn thất vào Sổ hao hụt."
        ],
        [
            "9. Dự báo ROP & Đặt hàng bổ sung gửi DC",
            "I", "R, A", "I", "C",
            "Cửa hàng trưởng",
            "ROP = (d * L) + SS. Tạm dừng nhập nếu DOS > DUE."
        ],
        [
            "10. Quản lý tài khoản, phân quyền & cấu hình",
            "R, A", "C", "I", "I",
            "Quản trị viên (Admin)",
            "Tuân thủ nguyên tắc đặc quyền tối thiểu (Least Privilege)."
        ]
    ]
    add_custom_table(raci_headers, raci_rows)

    # =========================================================================
    # 6. PHÂN TÍCH MỖI CHỨC NĂNG NGƯỜI DÙNG SẼ LÀM CÁI GÌ & LUỒNG ĐI CHI TIẾT
    # =========================================================================
    add_h1("6. Phân tích Mỗi Chức Năng 'Người Dùng Sẽ Làm Cái Gì' & Luồng Đi Chi Tiết")
    add_first(
        "Đáp ứng chuẩn xác yêu cầu: 'Phân tích thêm mỗi chức năng người dùng sẽ làm cái gì và thêm luồng xem nó đi sao', "
        "dưới đây là đặc tả chi tiết 8 chức năng cốt lõi của hệ thống bán lẻ chống lãng phí:"
    )

    # Chức năng 1: Nhập DC
    add_h2("6.1 Chức năng 1: Tiếp nhận Lô hàng từ Kho tổng DC (DC Inbound Reception)")
    add_first("Người dùng sẽ làm cái gì?")
    add_code(
        "- Nhân viên kho: Mở màn hình 'Tiếp nhận hàng DC', chọn sản phẩm, nhập Ngày sản xuất, Ngày hết hạn, Số lượng giao, Đơn giá vốn.\n"
        "- Cửa hàng trưởng: Mở danh sách phiếu tiếp nhận chờ duyệt, đối chiếu biên bản của tài xế DC, bấm nút 'Phê duyệt xác nhận nhập kho'."
    )
    add_first("Luồng quy trình xem nó đi sao (Step-by-Step Flow):")
    add_code(
        "[Bắt đầu: Xe tải DC giao hàng đến]\n"
        "  │\n"
        "  ├── Bước 1: Nhân viên kho kiểm tra HSD in trên vỏ hộp. Tính RSL = (HSD - Ngày nhập) / (HSD - NSX).\n"
        "  │     ├── Rẽ nhánh Nếu RSL < 70%: Báo Cửa hàng trưởng ký biên bản TỪ CHỐI NHẬN HÀNG (Hàng quay đầu về DC).\n"
        "  │     └── Rẽ nhánh Nếu RSL >= 70%: Hợp lệ, chuyển sang Bước 2.\n"
        "  │\n"
        "  ├── Bước 2: Nhân viên kho nhập thông tin vào Form Tiếp Nhận Hàng DC trên giao diện.\n"
        "  │     └── Hệ thống tự động sinh mã lô duy nhất: LOT-DC-[Mã SP]-[Ngày Nhập] và gán Status='PENDING_APPROVAL'.\n"
        "  │\n"
        "  ├── Bước 3: Cửa hàng trưởng kiểm tra số lượng và bấm nút [Phê duyệt xác nhận nhập kho].\n"
        "  │     └── SQL Server mở Transaction: Cập nhật Batches (Status='ACTIVE'), tăng tồn kho khả dụng, ghi GoodsReceipts.\n"
        "  │\n"
        "  └── Bước 4: Nhân viên kho in tem mã vạch dán lên kiện hàng và dời hàng vào kho lưu trữ. (Kết thúc)"
    )

    # Chức năng 2: Bán lẻ POS
    add_h2("6.2 Chức năng 2: Bán lẻ Quầy POS & Tự động Khấu trừ Kho FEFO (Sales POS Checkout)")
    add_first("Người dùng sẽ làm cái gì?")
    add_code(
        "- Thu ngân: Quét mã Barcode SKU sản phẩm vào giỏ hàng, điều chỉnh số lượng mua, "
        "chọn cờ Thời tiết (Nắng/Mưa/Bình thường) và cờ Ngày lễ, nhận tiền từ khách và bấm nút 'Thanh toán & Xuất kho FEFO'."
    )
    add_first("Luồng quy trình xem nó đi sao (Step-by-Step Flow):")
    add_code(
        "[Bắt đầu: Khách hàng đem sản phẩm ra quầy thu ngân]\n"
        "  │\n"
        "  ├── Bước 1: Thu ngân quét đầu đọc Barcode mã SKU sản phẩm.\n"
        "  │     ├── Hệ thống kiểm tra: Nếu sản phẩm có lô quá hạn (DaysLeft <= 0) --> BẬT CÒI ĐỎ, KHÓA CỨNG BÁN, BÁO LỖI.\n"
        "  │     └── Nếu sản phẩm hợp lệ: Đưa vào giỏ hàng. Nếu lô đang có Quick Markdown thì tự động hiển thị giá chiết khấu.\n"
        "  │\n"
        "  ├── Bước 2: Thu ngân chọn cờ ngữ cảnh tại góc màn hình: [Thời tiết: Nắng nóng] và [Cờ: Ngày lễ/Cuối tuần].\n"
        "  │\n"
        "  ├── Bước 3: Thu ngân bấm nút [Thanh toán & Xuất kho FEFO].\n"
        "  │     └── SQL Server kích hoạt Transaction với khóa UPDLOCK:\n"
        "  │           1. Quét tìm các lô ACTIVE: ORDER BY ExpiryDate ASC, Id ASC.\n"
        "  │           2. Kiểm tra tổng tồn kho khả dụng >= Số lượng mua (Nếu thiếu -> Hủy giao dịch, báo lỗi 'Không đủ tồn').\n"
        "  │           3. Trừ CurrentQuantity của lô date gần nhất (bẻ nhỏ nhiều lô nếu mua nhiều hơn tồn của lô thứ nhất).\n"
        "  │           4. Ghi chi tiết hóa đơn vào SalesHistory kèm cờ thời tiết và ngày lễ.\n"
        "  │           5. COMMIT TRANSACTION.\n"
        "  │\n"
        "  └── Bước 4: Máy in nhiệt in phiếu hóa đơn thanh toán cho khách, két tiền tự động mở. (Kết thúc)"
    )

    # Chức năng 3: Giám sát 3 màu
    add_h2("6.3 Chức năng 3: Giám sát Hạn sử dụng theo 3 Vùng Màu (3-Color Alert Engine)")
    add_first("Người dùng sẽ làm cái gì?")
    add_code(
        "- Hệ thống: Tự động tính toán số ngày còn lại (DaysLeft) và tỷ lệ % RSL cho tất cả các lô hàng mỗi ca trực.\n"
        "- Cửa hàng trưởng & Nhân viên kho: Mở bảng giám sát lô hàng, lọc theo màu Xanh/Vàng/Đỏ để nắm bắt nguy cơ."
    )
    add_first("Luồng quy trình xem nó đi sao (Step-by-Step Flow):")
    add_code(
        "[Bắt đầu: Hệ thống kích hoạt tính toán tự động mỗi ca trực]\n"
        "  │\n"
        "  ├── Bước 1: Quét toàn bộ bảng Batches có Status='ACTIVE'. Tính DaysLeft = ExpiryDate - Today, RSL = (DaysLeft/TotalLife)*100%.\n"
        "  │\n"
        "  ├── Bước 2: Phân loại trạng thái vào 3 vùng màu:\n"
        "  │     ├── Nếu RSL > 20%: Gán [🟢 VÙNG XANH - SAFE] --> Cho phép bán bình thường.\n"
        "  │     ├── Nếu 10% < RSL <= 20%: Gán [🟡 VÙNG VÀNG - WARNING] --> Bắn cảnh báo Vàng lên Dashboard.\n"
        "  │     ├── Nếu RSL <= 10% hoặc DaysLeft <= 3: Gán [🔴 VÙNG ĐỎ - CRITICAL] --> Bắn chuông đỏ khẩn cấp lên Action Board.\n"
        "  │     └── Nếu DaysLeft <= 0: Gán [🟣 QUÁ HẠN - EXPIRED] --> Cập nhật Status='EXPIRED', KHÓA CỨNG MÃ TRÊN POS.\n"
        "  │\n"
        "  └── Bước 3: Đồng bộ số liệu lên Executive Dashboard thời gian thực. (Kết thúc)"
    )

    # Chức năng 4: Đảo kệ mặt tiền
    add_h2("6.4 Chức năng 4: Đảo Lô Hàng ra Mặt tiền Kệ theo FEFO (Shelf Rotation SOP)")
    add_first("Người dùng sẽ làm cái gì?")
    add_code(
        "- Nhân viên kho: Xem danh sách lô Vùng Đỏ/Vàng cần đảo, ra quầy kệ dời hàng mới vào trong và kéo hàng cận date ra ngoài cùng, "
        "sau đó bấm nút '[V] Xác nhận đã đảo mặt tiền' trên phần mềm."
    )
    add_first("Luồng quy trình xem nó đi sao (Step-by-Step Flow):")
    add_code(
        "[Bắt đầu: Nhân viên kho mở ca làm việc]\n"
        "  │\n"
        "  ├── Bước 1: Mở màn hình 'Giám sát Lô hàng', bấm bộ lọc xem các lô đang gắn cờ [Cần đảo kệ mặt tiền].\n"
        "  │\n"
        "  ├── Bước 2: Nhân viên đi đến quầy kệ trưng bày thực tế tại siêu thị.\n"
        "  │     ├── Dời các sản phẩm thuộc lô date xa (Vùng Xanh) tạm thời sang bên.\n"
        "  │     ├── Kéo các sản phẩm thuộc lô cận date (Vùng Đỏ/Vàng) xếp ra ngoài sát mép kệ ngoài cùng.\n"
        "  │     └── Xếp các sản phẩm date xa trở lại phía sau lưng lô cận date.\n"
        "  │\n"
        "  ├── Bước 3: Nhân viên kho mở máy tính bảng, bấm nút [XÁC NHẬN ĐÃ ĐẢO MẶT TIỀN].\n"
        "  │     └── Hệ thống ghi nhận: Thời gian đảo kệ, UserId người thực hiện, gỡ bỏ cờ cảnh báo trên Dashboard.\n"
        "  │\n"
        "  └── Bước 4: Hoàn thành tác vụ đảo kệ. (Kết thúc)"
    )

    # Chức năng 5: Duyệt xả hàng giảm giá
    add_h2("6.5 Chức năng 5: Đề xuất & Duyệt Xả hàng Giảm giá Cận Date (Quick Markdown Approval)")
    add_first("Người dùng sẽ làm cái gì?")
    add_code(
        "- Nhân viên kho / Thu ngân: Phát hiện lô hàng rơi vào Vùng Vàng/Đỏ, bấm nút 'Đề xuất giảm giá' (chọn mức 15%, 30%, 50%).\n"
        "- Cửa hàng trưởng: Mở Action Board, xem xét số lượng tồn và thời gian còn lại, bấm nút 'Phê duyệt giảm giá'."
    )
    add_first("Luồng quy trình xem nó đi sao (Step-by-Step Flow):")
    add_code(
        "[Bắt đầu: Lô hàng có nguy cơ ế hỏng rơi vào Vùng Vàng/Đỏ]\n"
        "  │\n"
        "  ├── Bước 1: Nhân viên lập phiếu đề xuất xả hàng: Chọn lô, chọn mức chiết khấu (15%, 30%, 40%, 50%), gửi Quản lý.\n"
        "  │\n"
        "  ├── Bước 2: Cửa hàng trưởng nhận thông báo trên Executive Dashboard, kiểm tra tồn kho và hạn dùng.\n"
        "  │     ├── Nếu Từ chối: Nhập lý do từ chối, giữ nguyên giá bán niêm yết.\n"
        "  │     └── Nếu Phê duyệt: Bấm nút [PHÊ DUYỆT GIẢM GIÁ XẢ HÀNG].\n"
        "  │\n"
        "  ├── Bước 3: SQL Server cập nhật: Batches.DiscountPercent = Mức duyệt, Batches.Status = 'WARNING'.\n"
        "  │     └── Quầy thu ngân POS lập tức nhận diện giá mới (Promotional Price), tự động tính giá ưu đãi cho khách.\n"
        "  │\n"
        "  └── Bước 4: Nhân viên kho in tem nhãn giảm giá và dán trực tiếp lên bao bì sản phẩm tại quầy kệ. (Kết thúc)"
    )

    # Chức năng 6: Tiêu hủy & Sổ hao hụt
    add_h2("6.6 Chức năng 6: Tiêu hủy Hàng hỏng/Quá hạn & Chốt Sổ Hao hụt Tài chính")
    add_first("Người dùng sẽ làm cái gì?")
    add_code(
        "- Nhân viên kho: Thu gom hàng dập nát hoặc quá hạn vào khu cách ly, mở Form lập Phiếu đề xuất tiêu hủy.\n"
        "- Cửa hàng trưởng: Kiểm tra hàng thực tế tại khu cách ly, bấm nút 'Phê duyệt tiêu hủy & Chốt sổ hao hụt'."
    )
    add_first("Luồng quy trình xem nó đi sao (Step-by-Step Flow):")
    add_code(
        "[Bắt đầu: Phát hiện hàng hết hạn hoặc hư hỏng vật lý]\n"
        "  │\n"
        "  ├── Bước 1: Nhân viên kho cách ly vật lý hàng hóa ra khỏi kệ bán hàng.\n"
        "  │\n"
        "  ├── Bước 2: Nhân viên kho mở phần mềm lập Phiếu đề xuất tiêu hủy:\n"
        "  │     ├── Chọn Mã Lô (BatchCode), nhập Số lượng hủy thực tế, chọn Lý do (EXPIRED, DAMAGED, SPOILED).\n"
        "  │     └── Hệ thống tự động tính: Giá trị vốn tổn thất = Số lượng hủy * Đơn giá vốn (Cost Price).\n"
        "  │\n"
        "  ├── Bước 3: Cửa hàng trưởng trực tiếp kiểm tra hàng thực tế tại khu cách ly.\n"
        "  │     ├── Nếu đồng ý: Bấm nút [PHÊ DUYỆT TIÊU HỦY & CHỐT SỔ HAO HỤT].\n"
        "  │     └── SQL Server thực thi Transaction:\n"
        "  │           1. Cập nhật Batches: CurrentQuantity = 0, Status = 'DISPOSED'.\n"
        "  │           2. Ghi bản ghi vào SpoilageRecords kèm ApprovedBy = UserId của Cửa hàng trưởng.\n"
        "  │           3. Hạch toán số tiền tổn thất vào Sổ hao hụt tài chính (Spoilage Loss Ledger).\n"
        "  │           4. Tự động tính toán lại chỉ số Spoilage Rate % trên Dashboard.\n"
        "  │\n"
        "  └── Bước 4: Nhân viên kho tiến hành tiêu hủy hàng vật lý theo quy định bảo vệ môi trường. (Kết thúc)"
    )

    # Chức năng 7: Dự báo ROP & Đơn đặt hàng DC
    add_h2("6.7 Chức năng 7: Dự báo Nhu cầu Bán hàng & Lập Đơn Đặt hàng DC (ROP Forecast & PO)")
    add_first("Người dùng sẽ làm cái gì?")
    add_code(
        "- Hệ thống: Tự động phân tích tốc độ bán trung bình ngày d, nhân hệ số thời tiết/lễ K, tính Điểm đặt hàng ROP = (d*L)+SS.\n"
        "- Cửa hàng trưởng: Xem bảng khuyến nghị đặt hàng, kiểm tra cảnh báo DOS > DUE, phê duyệt Đơn đặt hàng (PO) gửi Kho tổng DC."
    )
    add_first("Luồng quy trình xem nó đi sao (Step-by-Step Flow):")
    add_code(
        "[Bắt đầu: Hệ thống chạy thuật toán dự báo ROP định kỳ]\n"
        "  │\n"
        "  ├── Bước 1: Tính tốc độ bán cơ sở d_base từ lịch sử bán lẻ 14 ngày gần nhất của từng sản phẩm.\n"
        "  │\n"
        "  ├── Bước 2: Nhân hệ số ngoại cảnh: d_adjusted = d_base * K_weather * K_holiday.\n"
        "  │\n"
        "  ├── Bước 3: Tính ROP = (d_adjusted * LeadTime) + SafetyStock và so sánh với Tổng tồn kho hiện tại:\n"
        "  │     ├── Nếu Tồn kho <= ROP: Hệ thống tự động tạo đề xuất Đơn đặt hàng bổ sung (Purchase Order).\n"
        "  │     └── Kiểm tra điều kiện DOS vs DUE: Nếu DOS > DUE --> Kích hoạt cảnh báo ĐỎ: NGUY CƠ Ứ ĐỌNG, CẤM NHẬP THÊM.\n"
        "  │\n"
        "  ├── Bước 4: Cửa hàng trưởng mở màn hình Quản lý Đặt hàng, duyệt số lượng và bấm [GỬI ĐƠN HÀNG VỀ KHO TỔNG DC].\n"
        "  │\n"
        "  └── Bước 5: Kho tổng DC Biên Hòa tiếp nhận đơn hàng PO để xếp lịch xe tải giao hàng ngày hôm sau. (Kết thúc)"
    )

    # Chức năng 8: Quản trị tài khoản & Phân quyền
    add_h2("6.8 Chức năng 8: Quản trị Tài khoản & Phân quyền Người dùng (RBAC Management)")
    add_first("Người dùng sẽ làm cái gì?")
    add_code(
        "- Admin: Thêm nhân viên mới, cấp tài khoản, gán vai trò (Role), khóa/mở khóa tài khoản khi có biến động nhân sự."
    )
    add_first("Luồng quy trình xem nó đi sao (Step-by-Step Flow):")
    add_code(
        "[Bắt đầu: Cửa hàng tiếp nhận nhân viên mới hoặc nhân viên nghỉ việc]\n"
        "  │\n"
        "  ├── Bước 1: Admin đăng nhập vào hệ thống, truy cập trang [Quản trị Tài khoản & Phân quyền].\n"
        "  │\n"
        "  ├── Bước 2: Bấm nút [+ Thêm nhân viên]: Nhập Username, Họ tên, Email, Số điện thoại, Mật khẩu ban đầu.\n"
        "  │\n"
        "  ├── Bước 3: Chọn Vai trò (Role): [STORE_MANAGER], [CASHIER], hoặc [WAREHOUSE_STAFF].\n"
        "  │     └── Hệ thống tự động gán tập quyền hạn tương ứng theo ma trận phân quyền RBAC.\n"
        "  │\n"
        "  ├── Bước 4: Bấm nút [Lưu tài khoản] --> CSDL băm mật khẩu Bcrypt, lưu vào bảng Users, ghi log vào AuditLogs.\n"
        "  │\n"
        "  └── Bước 5: Nhân viên đăng nhập vào hệ thống với đúng giao diện được phân quyền. (Kết thúc)"
    )

    # =========================================================================
    # 7. QUẢN LÝ THÔNG TIN CỬA HÀNG BÁN LẺ DUY NHẤT
    # =========================================================================
    add_h1("7. Quản lý thông tin cửa hàng bán lẻ duy nhất")
    add_first("Bảng StoreProfile lưu trữ cấu hình cố định của cửa hàng duy nhất:")
    add_code(
        "- StoreCode: RETAIL-STORE-01 (Mã điểm bán duy nhất)\n"
        "- StoreName: Cửa hàng Bán lẻ Tiện lợi LHU Mart\n"
        "- Address: Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai\n"
        "- ManagerId: Khóa ngoại liên kết với tài khoản Cửa hàng trưởng\n"
        "- DefaultDcSupplierId: Khóa ngoại liên kết với Kho tổng DC Biên Hòa\n"
        "- DefaultLeadTimeDays: 1 ngày (thời gian vận chuyển xe tải)\n"
        "- MinInboundRslPercent: 70.0% (tiêu chuẩn date tối thiểu khi nhận hàng từ DC)\n"
        "- Status: OPEN (Đang mở cửa bán hàng), CLOSED (Đóng cửa), INVENTORY (Đang kiểm kê kho)"
    )
    add_first("Ràng buộc nghiệp vụ:")
    add_code(
        "- Khi Status = 'INVENTORY' hoặc 'CLOSED', quầy thu ngân POS tự động khóa chức năng thanh toán.\n"
        "- Mọi giao dịch bán hàng, nhập kho và hủy hàng đều mặc định hạch toán vào cửa hàng này."
    )

    # =========================================================================
    # 8. QUẢN LÝ DANH MỤC NGÀNH HÀNG FMCG & SẢN PHẨM
    # =========================================================================
    add_h1("8. Quản lý danh mục ngành hàng FMCG & Sản phẩm")
    add_first("5 ngành hàng tiêu dùng nhanh trọng tâm tại cửa hàng:")
    add_code(
        "1. Sữa & Chế phẩm từ sữa: HSD chuẩn 30 - 180 ngày; Ngưỡng cảnh báo 7 ngày; Bảo quản 2-4°C.\n"
        "2. Bánh tươi & Thực phẩm chế biến: HSD chuẩn 3 - 7 ngày; Ngưỡng cảnh báo 2 ngày; Nhiệt độ phòng.\n"
        "3. Nước giải khát & Nước ép: HSD chuẩn 180 - 365 ngày; Ngưỡng cảnh báo 15 ngày; Nhiệt độ phòng.\n"
        "4. Thực phẩm đông lạnh & Thịt mát: HSD chuẩn 15 - 45 ngày; Ngưỡng cảnh báo 5 ngày; Bảo quản -18°C.\n"
        "5. Đồ khô & Gia vị đóng gói: HSD chuẩn 180 - 720 ngày; Ngưỡng cảnh báo 30 ngày; Nhiệt độ phòng."
    )
    add_first("Cơ chế chống tạo trùng lặp sản phẩm (Duplicate Shield):")
    add_code(
        "- Khi thêm mới sản phẩm, hệ thống tự động chuẩn hóa chuỗi (bỏ dấu tiếng Việt, viết thường, xóa khoảng trắng thừa).\n"
        "- Đối chiếu trùng lặp mã Barcode/SKU hoặc độ tương đồng tên sản phẩm >= 85%.\n"
        "- Nếu phát hiện trùng, hệ thống cảnh báo và từ chối tạo mới để tránh phân tán dữ liệu hạn sử dụng."
    )

    # =========================================================================
    # 9. QUẢN LÝ LÔ HÀNG & VÒNG ĐỜI HẠN SỬ DỤNG (SHELF-LIFE MANAGEMENT)
    # =========================================================================
    add_h1("9. Quản lý lô hàng & Vòng đời hạn sử dụng (Shelf-Life Management)")
    add_first("Mỗi sản phẩm có thể có nhiều lô hàng khác nhau tương ứng với từng đợt nhập từ DC Biên Hòa.")
    add_body("Thông tin lô hàng (Product Batch):")
    add_code(
        "- Mã lô hàng (BatchCode - duy nhất, ví dụ: LOT-DC-MILK-001)\n"
        "- Sản phẩm liên kết (ProductId)\n"
        "- Phiếu tiếp nhận hàng nguồn (GoodsReceiptId)\n"
        "- Ngày nhập kho (ImportDate)\n"
        "- Ngày sản xuất (ManufactureDate)\n"
        "- Ngày hết hạn sử dụng (ExpiryDate)\n"
        "- Số lượng ban đầu (InitialQuantity)\n"
        "- Số lượng tồn hiện tại (CurrentQuantity)\n"
        "- Đơn giá nhập vốn thực tế (ImportPrice)\n"
        "- Tỷ lệ giảm giá xả hàng hiện tại (DiscountPercent: 0%, 15%, 30%, 40%, 50%)\n"
        "- Trạng thái lô hàng (Status: ACTIVE, WARNING, EXPIRED, DISPOSED)"
    )
    add_first("Công thức tính toán vòng đời hạn sử dụng:")
    add_code(
        "1. Số ngày còn lại đến hạn (DaysLeft):\n"
        "   DaysLeft = DATEDIFF(day, CAST(GETDATE() AS DATE), ExpiryDate)\n\n"
        "2. Tổng vòng đời ban đầu (TotalLife):\n"
        "   TotalLife = DATEDIFF(day, ManufactureDate, ExpiryDate)\n\n"
        "3. Tỷ lệ hạn sử dụng còn lại (Remaining Shelf-Life - RSL %):\n"
        "   RSL (%) = (DaysLeft / TotalLife) * 100%"
    )

    # =========================================================================
    # 10. CHỨC NĂNG BÁN LẺ POS THEO NGUYÊN TẮC FEFO
    # =========================================================================
    add_h1("10. Chức năng bán lẻ POS theo nguyên tắc FEFO (First Expired, First Out)")
    add_first(
        "Nguyên tắc cốt lõi: Bán hàng tại quầy POS = Xuất kho trực tiếp. "
        "Thu ngân chỉ cần quét mã SKU sản phẩm và nhập số lượng khách mua, hệ thống tự động bóc tách "
        "các lô có hạn sử dụng gần nhất ra trước để khấu trừ số lượng."
    )
    add_h2("10.1 Kịch bản bẻ nhỏ đơn hàng qua nhiều lô (Split Order Scenario)")
    add_body("Ví dụ thực tế:")
    add_code(
        "Khách mua: 5 hộp sữa Vinamilk 100ml\n"
        "Hiện trạng tồn kho theo FEFO:\n"
        "+ Lô LOT-01: HSD còn 2 ngày, tồn 3 hộp, đang giảm giá 30% -> Giá: 6,650 đ\n"
        "+ Lô LOT-02: HSD còn 45 ngày, tồn 10 hộp, nguyên giá 0%   -> Giá: 9,500 đ\n\n"
        "Hệ thống tự động tách thành 2 dòng hóa đơn:\n"
        "- Dòng 1: 3 hộp từ Lô LOT-01 x 6,650 đ = 19,950 đ (Trừ hết lô LOT-01)\n"
        "- Dòng 2: 2 hộp từ Lô LOT-02 x 9,500 đ = 19,000 đ (Lô LOT-02 còn lại 8 hộp)\n"
        "Tổng tiền hóa đơn: 38,950 đ. Hệ thống ghi nhận chi tiết, tuyệt đối không âm kho."
    )

    # =========================================================================
    # 11. THIẾT KẾ CƠ SỞ DỮ LIỆU SQL SERVER
    # =========================================================================
    add_h1("11. Thiết kế Cơ sở Dữ liệu Microsoft SQL Server (13 Bảng chuẩn 3NF)")
    add_first("Toàn bộ 13 bảng CSDL được thiết kế chuẩn hóa 3NF trên SQL Server LocalDB retail_spoilage_db:")
    add_code(
        "1.  Users: Quản lý thông tin tài khoản người dùng và thông tin đăng nhập.\n"
        "2.  Roles: Định nghĩa 4 vai trò chuẩn (ADMIN, STORE_MANAGER, CASHIER, WAREHOUSE_STAFF).\n"
        "3.  StoreProfile: Cấu hình thông tin cửa hàng bán lẻ tinh gọn duy nhất.\n"
        "4.  Suppliers: Thông tin nhà cung cấp liên kết (Kho phân phối DC Biên Hòa).\n"
        "5.  Categories: Danh mục ngành hàng FMCG và ngưỡng cảnh báo cận date mặc định.\n"
        "6.  Products: Thông tin sản phẩm, mã SKU/Barcode, giá vốn, giá niêm yết, tồn an toàn SS.\n"
        "7.  Batches: Trọng tâm FEFO - Lưu trữ từng lô hàng, NSX, HSD, số lượng tồn, giá xả hàng.\n"
        "8.  SalesHistory: Lịch sử bán lẻ POS, lưu mã giao dịch, số lượng bán, cờ thời tiết, cờ ngày lễ.\n"
        "9.  SpoilageRecords: Biên bản tiêu hủy hàng hỏng/quá date, chi phí thiệt hại, người duyệt.\n"
        "10. PurchaseOrders: Đơn đặt hàng bổ sung gửi về Kho tổng DC theo dự báo ROP.\n"
        "11. PurchaseOrderItems: Chi tiết số lượng từng sản phẩm cần đặt hàng từ DC.\n"
        "12. GoodsReceipts: Phiếu tiếp nhận hàng thực tế từ xe tải DC theo từng đợt.\n"
        "13. AuditLogs: Nhật ký kiểm toán lưu vết bất biến mọi tác vụ biến động kho và giá cả."
    )
    add_first("Ràng buộc toàn vẹn và chống âm kho cốt lõi:")
    add_code(
        "-- Bảng Batches\n"
        "CONSTRAINT CK_Batches_Quantity CHECK (CurrentQuantity >= 0 AND CurrentQuantity <= InitialQuantity),\n"
        "CONSTRAINT CK_Batches_Dates CHECK (ExpiryDate > ManufactureDate),\n"
        "CONSTRAINT CK_Batches_Discount CHECK (DiscountPercent BETWEEN 0 AND 100)\n\n"
        "-- Bảng SalesHistory\n"
        "CONSTRAINT CK_Sales_Quantity CHECK (QuantitySold > 0)\n\n"
        "-- Bảng SpoilageRecords\n"
        "CONSTRAINT CK_Spoilage_Quantity CHECK (QuantityDisposed > 0)"
    )

    # =========================================================================
    # 12. KIẾN TRÚC CLEAN ARCHITECTURE & TỔ CHỨC MÃ NGUỒN
    # =========================================================================
    add_h1("12. Kiến trúc Clean Architecture & Cấu trúc Phân tầng")
    add_first("Hệ thống tuân thủ nguyên lý Dependency Inversion Principle (DIP) với 4 tầng phân lập rõ ràng:")
    add_code(
        "1. Domain Layer (Nghiệp vụ cốt lõi - Độc lập hoàn toàn):\n"
        "   - Entities: User, StoreProfile, Product, Batch, SaleTransaction, SpoilageRecord, PurchaseOrder.\n"
        "   - Value Objects: ShelfLife, AlertLevel, Money, WeatherCondition.\n"
        "   - Domain Policies: FefoAllocationPolicy, RopCalculatorPolicy, MarkdownPricingPolicy.\n"
        "   - Repository Interfaces: IUserRepository, IProductRepository, IBatchRepository, ISaleRepository...\n\n"
        "2. Application Layer (Điều phối Use Cases & Luồng công việc):\n"
        "   - Use Cases: ProcessFefoSaleUseCase, ReceiveDCBatchUseCase, ApplyQuickMarkdownUseCase, \n"
        "                RotateShelfFefoUseCase, DisposeSpoiledGoodsUseCase, CalculateROPForecastUseCase...\n"
        "   - DTOs & Validation Schemas: SaleCheckoutDto, InboundBatchDto, SpoilageRequestDto...\n\n"
        "3. Infrastructure Layer (Công nghệ cụ thể & CSDL SQL Server):\n"
        "   - Database: sqlserver connection pool, transaction manager, SqlBatchRepository, SqlSaleRepository...\n"
        "   - Security: bcrypt password hashing, JWT token generator.\n\n"
        "4. Presentation Layer (Giao diện & Cổng giao tiếp):\n"
        "   - RESTful API Controllers: AuthController, ProductController, BatchController, SalesController...\n"
        "   - Middleware: authMiddleware, requireRoleMiddleware, validationMiddleware, errorHandler.\n"
        "   - Frontend SPA: React/Vanilla JS components, POS Screen, Dashboard Charts, Batch Alert Board."
    )

    # =========================================================================
    # 13. CÁC USE CASE QUAN TRỌNG VÀ RESTFUL API
    # =========================================================================
    add_h1("13. Các Use Case Trọng Tâm & Thiết Kế RESTful API")
    add_h2("13.1 Các Use Case Trọng Tâm")
    add_code(
        "- ProcessFefoSaleUseCase: Nhận giỏ hàng POS, sắp xếp lô theo expiry_date ASC, bẻ nhiều lô tự động, trừ kho.\n"
        "- ReceiveDCBatchUseCase: Tiếp nhận lô hàng xe tải DC, thẩm định tiêu chuẩn RSL >= 70%, tạo lô mới.\n"
        "- ApplyQuickMarkdownUseCase: Cửa hàng trưởng phê duyệt chiết khấu 15%-50% cho lô cận date, cập nhật POS.\n"
        "- RotateShelfFefoUseCase: Nhân viên kho xác nhận đã đảo lô date gần ra mặt tiền kệ trưng bày.\n"
        "- DisposeSpoiledGoodsUseCase: Cửa hàng trưởng duyệt tiêu hủy hàng hỏng, chuyển DISPOSED, chốt Sổ hao hụt.\n"
        "- CalculateROPForecastUseCase: Dự báo ROP = (d * L) + SS tích hợp thời tiết, ngày lễ và cảnh báo DOS > DUE.\n"
        "- GetDashboardOverviewUseCase: Tính toán 6 thẻ KPI tài chính, tỷ lệ lãng phí Spoilage Rate %, phân bổ 3 màu."
    )
    add_h2("13.2 Danh mục RESTful API")
    add_code(
        "POST   /api/auth/login                  - Đăng nhập hệ thống & cấp JWT Token\n"
        "GET    /api/auth/me                     - Lấy thông tin phiên làm việc hiện tại\n"
        "GET    /api/store-profile               - Xem cấu hình cửa hàng bán lẻ duy nhất\n"
        "PUT    /api/store-profile               - Cập nhật thông tin cửa hàng (Admin)\n"
        "GET    /api/products                    - Danh sách sản phẩm FMCG\n"
        "POST   /api/products                    - Thêm mới sản phẩm (kèm bộ lọc chống trùng)\n"
        "GET    /api/batches                     - Danh sách các lô hàng kèm DaysLeft và RSL %\n"
        "POST   /api/batches/inbound             - Tiếp nhận lô hàng mới từ Kho tổng DC\n"
        "PATCH  /api/batches/:id/markdown        - Cửa hàng trưởng phê duyệt giảm giá xả hàng\n"
        "PATCH  /api/batches/:id/rotate          - Nhân viên kho xác nhận đảo kệ mặt tiền\n"
        "POST   /api/sales/checkout              - Bán hàng quầy POS khấu trừ kho FEFO\n"
        "GET    /api/sales/history               - Lịch sử bán lẻ kèm cờ thời tiết & ngày lễ\n"
        "POST   /api/spoilage/propose            - Lập đề xuất tiêu hủy hàng hỏng/quá date\n"
        "POST   /api/spoilage/approve/:id        - Cửa hàng trưởng duyệt tiêu hủy & chốt Sổ hao hụt\n"
        "GET    /api/forecast/rop                - Xem kết quả tính toán điểm đặt hàng ROP\n"
        "POST   /api/purchase-orders             - Phát hành đơn đặt hàng gửi về Kho tổng DC\n"
        "GET    /api/dashboard/overview          - Dữ liệu 6 KPI điều hành thời gian thực\n"
        "GET    /api/audit-logs                  - Nhật ký kiểm toán an toàn hệ thống (Admin)"
    )

    # =========================================================================
    # 14. BẢN VẼ WIREFRAME (HERO SECTION & TEXT-BASED DASHBOARD WIREFRAME)
    # =========================================================================
    add_h1("14. Thiết kế Khung Giao diện Wireframe (Hero Section & Text-Based Dashboard UI)")
    add_first(
        "Theo chỉ đạo kỹ thuật về thiết kế trải nghiệm người dùng (UI/UX) và nội dung 'Note mới ngày 2/10', "
        "hệ thống được phác thảo bằng các khung Wireframe dạng Text-based Box Layout chuẩn mực, bao gồm: "
        "Khung Wireframe Hero Section cho Cổng thông tin giới thiệu giải pháp, "
        "Khung Wireframe Hero Banner trong phân hệ điều hành, "
        "Khung Dashboard tổng quan hoàn chỉnh bằng Text-Based Wireframe và các màn hình tác nghiệp chi tiết."
    )

    # 14.1 Wireframe Hero Section (Landing Page)
    add_h2("14.1 Wireframe 1: Khung Hero Section UI/UX (Landing Page & Cổng Giới thiệu Giải pháp)")
    add_first(
        "Khung Hero Section đại diện cho màn hình ấn tượng đầu tiên (First Impression) của người dùng "
        "khi truy cập vào nền tảng Supply Chain Spoilage Predictor:"
    )
    add_code(
        "+------------------------------------------------------------------------------------------------------+\n"
        "| [LOGO LHU MART]  VỀ ĐỀ TÀI    NGUYÊN TẮC FEFO    3 VÙNG MÀU    BÁO CÁO    [ ĐĂNG NHẬP HỆ THỐNG ]     |\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "|                                                                                                      |\n"
        "|      ★ ĐỒ ÁN TỐT NGHIỆP CNTT - ĐẠI HỌC LẠC HỒNG (LHU) - GVHD: THS. LÊ MINH NHẬT                      |\n"
        "|                                                                                                      |\n"
        "|      ==================================================================================              |\n"
        "|      NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ                                          |\n"
        "|      (RETAIL SUPPLY CHAIN SPOILAGE PREDICTOR)                                                        |\n"
        "|      ==================================================================================              |\n"
        "|                                                                                                      |\n"
        "|      Giải pháp quản trị tinh gọn cho Cửa hàng tiện lợi FMCG:                                         |\n"
        "|      - Giám sát Vòng đời Hạn sử dụng (Shelf-Life) chi tiết theo từng Lô hàng nhập.                   |\n"
        "|      - Bán lẻ tại quầy POS tự động khấu trừ kho theo nguyên tắc FEFO (First Expired, First Out).     |\n"
        "|      - Kích hoạt xả hàng Quick Markdown & Đảo kệ mặt tiền khi lô chạm Vùng Vàng / Vùng Đỏ.           |\n"
        "|      - Dự báo Điểm đặt hàng ROP tích hợp thời tiết & ngày lễ gửi về Kho tổng DC Biên Hòa.            |\n"
        "|                                                                                                      |\n"
        "|      +--------------------------------+       +------------------------------------+                 |\n"
        "|      |  [▶ VÀO QUẦY BÁN LẺ POS]       |       |  [📊 VÀO EXECUTIVE DASHBOARD]      |                 |\n"
        "|      +--------------------------------+       +------------------------------------+                 |\n"
        "|                                                                                                      |\n"
        "|      ------------------------------------------------------------------------------------------      |\n"
        "|      3 CHỈ SỐ CAM KẾT ĐỊNH LƯỢNG (IMPACT METRICS):                                                   |\n"
        "|      +------------------------+  +------------------------+  +------------------------+              |\n"
        "|      |       TRIỆT TIÊU       |  |        DƯỚI 1.5%       |  |        TĂNG +40%       |              |\n"
        "|      | 100% Bán quá hạn ở POS |  |  Tỷ lệ Spoilage Loss   |  | Thu hồi vốn cận date   |              |\n"
        "|      +------------------------+  +------------------------+  +------------------------+              |\n"
        "|                                                                                                      |\n"
        "|      MÔ PHỎNG 3 VÙNG MÀU HẠN DÙNG TRỰC QUAN:                                                         |\n"
        "|      [ 🟢 VÙNG XANH (RSL>20%) ] ──> [ 🟡 VÙNG VÀNG (10-20%) ] ──> [ 🔴 VÙNG ĐỎ (<=10%) ] ──> [ 🟣 KHÓA]|\n"
        "|             Bán bình thường             Đảo kệ & Giảm nhẹ            Xả hàng sâu 50%          Quá hạn cấm bán|\n"
        "+------------------------------------------------------------------------------------------------------+"
    )

    # 14.2 Wireframe Hero Banner (Executive Dashboard)
    add_h2("14.2 Wireframe 2: Khung Hero Banner trong Phân hệ Điều hành (Executive Hero Section)")
    add_first("Khung biểu ngữ Hero Banner tóm tắt bối cảnh ca trực đầu ngày trên Dashboard Cửa hàng trưởng:")
    add_code(
        "+------------------------------------------------------------------------------------------------------+\n"
        "| [HERO BANNER ĐIỀU HÀNH]                                                         [Thứ 6, 09/10/2026]   |\n"
        "| Xin chào, Quản lý Đoàn Minh Quân! Cửa hàng: LHU Mart (RETAIL-STORE-01)          Trạng thái: [🟢 OPEN] |\n"
        "| Ngữ cảnh hôm nay: Nhiệt độ 34°C (NẮNG NÓNG GẮT) | Hệ số dự báo: K = 1.40 (Đồ uống giải khát tăng 40%)|\n"
        "| 🔔 CẢNH BÁO CA TRỰC: Có 4 lô hàng Vùng Đỏ (HSD <= 3 ngày) cần phê duyệt giảm giá và đảo kệ trước 09:00!|\n"
        "+------------------------------------------------------------------------------------------------------+"
    )

    # 14.3 Text-based Dashboard Wireframe
    add_h2("14.3 Wireframe 3: Khung Dashboard Tổng quan Hoàn chỉnh bằng Text-Based Wireframe")
    add_first(
        "Bố cục khung Executive Dashboard bằng Text-Based Wireframe phân bổ lưới đa chiều, "
        "kết hợp 6 thẻ KPI, biểu đồ phân tích hạn dùng và Action Board khẩn cấp:"
    )
    add_code(
        "+------------------------------------------------------------------------------------------------------+\n"
        "| [LOGO] LHU MART - EXECUTIVE DASHBOARD ĐIỀU HÀNH                         [User: Quản lý Quân] [Đăng xuất]|\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| THANH ĐIỀU HƯỚNG: [x] Dashboard  [ ] Bán lẻ POS  [ ] Quản lý Lô  [ ] Nhập DC  [ ] Sổ Hao Hụt  [ ] Dự báo|\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| 6 THẺ KPI TÀI CHÍNH & VẬN HÀNH THỜI GIAN THỰC (SUMMARY CARDS):                                       |\n"
        "| +--------------------+ +--------------------+ +--------------------+ +--------------------+          |\n"
        "| | TỔNG VỐN TỒN KHO   | | VỐN RỦI RO CẬN DATE| | TỶ LỆ LÃNG PHÍ SPOIL| | DOANH SỐ HÔM NAY   |          |\n"
        "| | 128,500,000 đ      | | 8,400,000 đ (6.5%) | | 1.2% (MỤC TIÊU<1.5%)| | 15,200,000 đ      |          |\n"
        "| | [▲ +2.1% tuần qua] | | [▼ -1.4% giảm tốt] | | [🟢 ĐẠT CHUẨN XANH] | | [42 Hóa đơn POS]   |          |\n"
        "| +--------------------+ +--------------------+ +--------------------+ +--------------------+          |\n"
        "| +-----------------------------------------+ +-----------------------------------------------------+  |\n"
        "| | SỐ LÔ CẦN XỬ LÝ KHẨN CẤP TRONG CA       | | ĐƠN HÀNG ĐỀ XUẤT ĐẶT KHO TỔNG DC (ROP)              |  |\n"
        "| | 4 Lô hàng (2 Đỏ, 2 Vàng)                | | 2 Đơn hàng bổ sung (Sữa tiệt trùng, Bánh mì tươi)   |  |\n"
        "| +-----------------------------------------+ +-----------------------------------------------------+  |\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| KHUNG PHÂN TÍCH 2 CỘT (TWO-COLUMN ANALYSIS GRID):                                                    |\n"
        "|                                                                                                      |\n"
        "| [CỘT TRÁI] BIỂU ĐỒ TRỰC QUAN TEXT-BASED        | [CỘT PHẢI] ACTION BOARD KHẨN CẤP TRONG CA           |\n"
        "| 1. Phân bổ Hạn dùng 3 Vùng Màu:                | 1. [LÔ ĐỎ] LOT-MILK-001 (Sữa tươi Ba Vì 110ml)      |\n"
        "|    🟢 Xanh (RSL>20%):  [████████████] 85%      |    - HSD: Còn 2 ngày (RSL: 8.5%) | Tồn: 15 Hộp      |\n"
        "|    🟡 Vàng (10-20%):   [██] 11%                |    - Hành động: [Duyệt giảm 50%] [Đã đảo mặt tiền]   |\n"
        "|    🔴 Đỏ (<=10%):      [█] 4%                  |                                                      |\n"
        "|    🟣 Quá hạn:         [0%] (Đã khóa cứng POS) | 2. [LÔ ĐỎ] LOT-BREAD-04 (Bánh Sandwich tươi)        |\n"
        "|                                                |    - HSD: Còn 1 ngày (RSL: 7.0%) | Tồn: 8 Gói       |\n"
        "| 2. Doanh số Bán lẻ vs Hao hụt Hủy hàng:        |    - Hành động: [Duyệt giảm 50%] [Chưa đảo kệ]      |\n"
        "|    Doanh số: [$$$$$$$$$$$$$$$$$$$$] 15.2 Tr    |                                                      |\n"
        "|    Hao hụt:  [*] 0.18 Tr (Spoilage: 1.18%)     | 3. [LÔ VÀNG] LOT-YOGURT-02 (Sữa chua Vinamilk)      |\n"
        "|                                                |    - HSD: Còn 4 ngày (RSL: 15%) | Tồn: 30 Hũ        |\n"
        "|                                                |    - Hành động: [Duyệt giảm 20%] [Đã đảo mặt tiền]   |\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| KHUNG BẢNG ĐIỀU KHIỂN CHI TIẾT (BOTTOM DATA TABLES):                                                 |\n"
        "| BẢNG CẢNH BÁO NGUY CƠ Ứ ĐỌNG HÀNG (DOS > DUE):                                                       |\n"
        "| [FMCG-MILK-01] Sữa chua dâu tây | Tồn: 60 Hộp | DOS: 12 ngày | DUE: Còn 4 ngày (DOS > DUE: NGUY CƠ)   |\n"
        "| --> Khuyến nghị hệ thống: TẠM DỪNG NHẬP THÊM, KÍCH HOẠT XẢ HÀNG GIẢM GIÁ 30% NGAY LẬP TỨC!            |\n"
        "+------------------------------------------------------------------------------------------------------+"
    )

    # 14.4 Wireframe Admin User & RBAC
    add_h2("14.4 Wireframe 4: Phân hệ Admin - Quản trị Tài khoản & Phân quyền Người dùng (RBAC)")
    add_first("Bố cục khung giao diện quản lý tài khoản nhân viên và phân quyền chức năng:")
    add_code(
        "+------------------------------------------------------------------------------------------------------+\n"
        "|  [LOGO] LHU MART - HỆ THỐNG QUẢN TRỊ BÁN LẺ CHỐNG LÃNG PHÍ                     [User: Admin] [Đăng xuất]  |\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| SIDEBAR:           | TRANG QUẢN TRỊ TÀI KHOẢN & PHÂN QUYỀN NGƯỜI DÙNG (RBAC)                         |\n"
        "|                    |---------------------------------------------------------------------------------|\n"
        "| [x] Dashboard      | [ Bộ lọc Vai trò: Tất cả (v) ] [ Trạng thái: Hoạt động (v) ] [ + Thêm nhân viên ]|\n"
        "| [*] Tài khoản & PQ |---------------------------------------------------------------------------------|\n"
        "| [ ] Cấu hình Store | DANH SÁCH TÀI KHOẢN NHÂN VIÊN:                                                  |\n"
        "| [ ] Audit Logs     | +----+-----------------+-------------+-----------------+------------+-----------+|\n"
        "| [ ] CSDL Health    | | STT| Tên nhân viên   | Tên đăng nhập| Vai trò (Role)  | Trạng thái | Thao tác  ||\n"
        "|                    | +----+-----------------+-------------+-----------------+------------+-----------+|\n"
        "|                    | |  1 | Đỗ Tấn Du       | admin_du    | Admin           | Hoạt động  | [Sửa][Khóa]||\n"
        "|                    | |  2 | Đoàn Minh Quân  | manager_quan| Cửa hàng trưởng | Hoạt động  | [Sửa][Khóa]||\n"
        "|                    | |  3 | Lê Thu Ngân     | cashier_01  | Thu ngân (POS)  | Hoạt động  | [Sửa][Khóa]||\n"
        "|                    | |  4 | Trần Kho Vận    | warehouse_01| Nhân viên kho   | Hoạt động  | [Sửa][Khóa]||\n"
        "|                    | +----+-----------------+-------------+-----------------+------------+-----------+|\n"
        "|                    |                                                                                 |\n"
        "|                    | MODAL: PHÂN QUYỀN CHI TIẾT CHO VAI TRÒ ĐƯỢC CHỌN:                               |\n"
        "|                    | [x] Quyền tiếp nhận hàng từ DC Biên Hòa       [x] Quyền lập phiếu tiêu hủy      |\n"
        "|                    | [ ] Quyền phê duyệt tiêu hủy (Chỉ Quản lý)    [x] Quyền bán hàng tại quầy POS   |\n"
        "|                    | [ ] Quyền phê duyệt giảm giá xả hàng          [x] Quyền xác nhận đảo kệ FEFO    |\n"
        "|                    |                                    [ Hủy bỏ ]  [ Lưu phân quyền ]               |\n"
        "+------------------------------------------------------------------------------------------------------+"
    )

    # 14.5 Wireframe Admin Store & DC Config
    add_h2("14.5 Wireframe 5: Phân hệ Admin - Cấu hình Tham số Cửa hàng & Kho tổng DC")
    add_first("Bố cục khung giao diện thiết lập thông tin điểm bán và ngưỡng cảnh báo:")
    add_code(
        "+------------------------------------------------------------------------------------------------------+\n"
        "|  [LOGO] LHU MART - HỆ THỐNG QUẢN TRỊ BÁN LẺ CHỐNG LÃNG PHÍ                     [User: Admin] [Đăng xuất]  |\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| SIDEBAR:           | CẤU HÌNH THÔNG TIN CỬA HÀNG & KHO TỔNG LIÊN KẾT                                  |\n"
        "|                    |---------------------------------------------------------------------------------|\n"
        "| [ ] Dashboard      | PHẦN 1: THÔNG TIN CỬA HÀNG BÁN LẺ TINH GỌN (STORE PROFILE)                      |\n"
        "| [ ] Tài khoản & PQ | - Mã cửa hàng:      [ RETAIL-STORE-01          ]                                |\n"
        "| [*] Cấu hình Store | - Tên cửa hàng:     [ Cửa hàng Tiện lợi LHU Mart ]                              |\n"
        "| [ ] Audit Logs     | - Địa chỉ điểm bán: [ Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa          ] |\n"
        "| [ ] CSDL Health    | - Trạng thái:       (o) Đang mở cửa (OPEN)  ( ) Kiểm kê kho (INVENTORY)          |\n"
        "|                    |---------------------------------------------------------------------------------|\n"
        "|                    | PHẦN 2: THÔNG TIN KHO TỔNG CUNG ỨNG LIÊN KẾT (DISTRIBUTION CENTER)              |\n"
        "|                    | - Kho tổng mặc định:[ Trung tâm Phân phối DC Biên Hòa (Mã: DC-BIENHOA)      ]    |\n"
        "|                    | - Thời gian giao chuẩn (Lead Time L): [ 1 ] ngày                                |\n"
        "|                    | - Ngưỡng HSD tối thiểu khi nhận (Min RSL): [ 70% ]                              |\n"
        "|                    |---------------------------------------------------------------------------------|\n"
        "|                    | PHẦN 3: CẤU HÌNH THAM SỐ CẢNH BÁO HẠN DÙNG MẶC ĐỊNH                             |\n"
        "|                    | - Ngưỡng Vàng (Warning): [ 20% ] RSL          - Ngưỡng Đỏ (Critical): [ 10% ]RSL|\n"
        "|                    | - Số ngày khẩn cấp tối đa: [ 3 ] ngày        - Tỷ lệ tồn an toàn SS: [ 20% ]    |\n"
        "|                    |                                             [ Khôi phục mặc định ] [ Lưu cấu hình ]|\n"
        "+------------------------------------------------------------------------------------------------------+"
    )

    # 14.6 Wireframe POS
    add_h2("14.6 Wireframe 6: Phân hệ Bán hàng - Quầy Thu ngân Bán lẻ POS (FEFO Checkout)")
    add_first("Bố cục khung màn hình bán lẻ quầy thu ngân cho nhân viên bán hàng:")
    add_code(
        "+------------------------------------------------------------------------------------------------------+\n"
        "|  [POS TERMINAL] QUẦY THU NGÂN BÁN LẺ                                     [Thu ngân: Thu Ngân] [Ca: 1]|\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| TÌM KIẾM: [ Quét mã Barcode / Nhập tên SKU...            ] [ + Thêm ]                                |\n"
        "| CỜ NGOẠI CẢNH DỰ BÁO: Thời tiết: (o) Nắng  ( ) Mưa  ( ) Thường | Cờ ngày lễ: [x] Nghỉ Lễ/Cuối tuần    |\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| GIỎ HÀNG BÁN LẺ (HỆ THỐNG TỰ ĐỘNG KHẤU TRỪ THEO THỨ TỰ FEFO DATE GẦN NHẤT):                         |\n"
        "| +----+----------------------+-------+-----------+--------------------+---------------+-----------+|\n"
        "| | STT| Tên sản phẩm hàng hóa| SL Mua| Lô xuất   | Đơn giá niêm yết   | Giá xả Markdown| Thành tiền||\n"
        "| +----+----------------------+-------+-----------+--------------------+---------------+-----------+|\n"
        "| |  1 | Sữa tươi tiệt trùng  |   2   | LOT-MILK-1| 35,000 đ           | 28,000 đ (-20%)| 56,000 đ  ||\n"
        "| |  2 | Bánh tươi Chocopie   |   1   | LOT-PIE-04| 50,000 đ           | 50,000 đ (Gốc) | 50,000 đ  ||\n"
        "| +----+----------------------+-------+-----------+--------------------+---------------+-----------+|\n"
        "| * CẢNH BÁO AN TOÀN: Hệ thống tự động chặn 100% nếu sản phẩm đã hết hạn.                              |\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| TỔNG CỘNG: 106,000 đ | Khách đưa: [ 200,000 đ ] | Tiền thối: 94,000 đ                                |\n"
        "|                           [ HỦY ĐƠN ]     [ IN HÓA ĐƠN & XUẤT KHO FEFO ]                             |\n"
        "+------------------------------------------------------------------------------------------------------+"
    )

    # 14.7 Wireframe Warehouse Shelf & Rotate
    add_h2("14.7 Wireframe 7: Phân hệ Kho - Giám sát Lô hàng & Xác nhận Đảo kệ Mặt tiền")
    add_first("Bố cục khung màn hình theo dõi hạn dùng và xác nhận đảo hàng ngoài kệ trưng bày:")
    add_code(
        "+------------------------------------------------------------------------------------------------------+\n"
        "|  [KHO & QUẦY KỆ] BẢNG GIÁM SÁT HẠN SỬ DỤNG THEO LÔ                      [Nhân viên: Kho Vận] [Ca trực]|\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| BỘ LỌC CẢNH BÁO:  [x] Tất cả (1,250)  [ ] 🟢 Xanh  [*] 🟡 Vàng (140)  [*] 🔴 Đỏ (50)  [ ] 🟣 Hết hạn  |\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| DANH SÁCH LÔ HÀNG CẦN XỬ LÝ DATE TRONG CA:                                                           |\n"
        "| +------------+--------------------+-----------+------------+----------+-------+---------------------+|\n"
        "| | Mã lô hàng | Tên sản phẩm       | Hạn dùng  | DaysLeft   | RSL %    | Tồn kho| Thao tác xử lý quầy ||\n"
        "| +------------+--------------------+-----------+------------+----------+-------+---------------------+|\n"
        "| | LOT-MK-001 | Sữa chua Vinamilk  | 11/10/2026| Còn 2 ngày | 8.5% (ĐỎ)| 15 Hộp| [V] ĐÃ ĐẢO MẶT TIỀN ||\n"
        "| |            |                    |           |            |          |       | [Đề xuất giảm 30%]  ||\n"
        "| | LOT-BN-004 | Bánh mì hoa cúc    | 13/10/2026| Còn 4 ngày | 18% (VÀNG| 22 Ổ  | [ ] Chưa đảo kệ     ||\n"
        "| |            |                    |           |            |          |       | [Đề xuất giảm 15%]  ||\n"
        "| +------------+--------------------+-----------+------------+----------+-------+---------------------+|\n"
        "| * HƯỚNG DẪN: Kéo lô hạn gần ra mặt tiền kệ, đẩy hàng mới vào trong, sau đó bấm nút 'Đã đảo mặt tiền'|\n"
        "+------------------------------------------------------------------------------------------------------+"
    )

    # 14.8 Wireframe Disposal Approval
    add_h2("14.8 Wireframe 8: Quản lý & Kho - Phiếu Duyệt Tiêu hủy & Sổ Hao hụt Tài chính")
    add_first("Bố cục khung duyệt tiêu hủy và hạch toán sổ hao hụt:")
    add_code(
        "+------------------------------------------------------------------------------------------------------+\n"
        "|  [TIÊU HỦY & SỔ HAO HỤT] BIÊN BẢN TIÊU HỦY HÀNG HÓA                       [Duyệt: Store Manager Quân]|\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| PHIẾU ĐỀ XUẤT TIÊU HỦY CHỜ PHÊ DUYỆT (MÃ PHIẾU: DISP-20261009-01):                                   |\n"
        "| - Lô hàng hủy:  LOT-MILK-99 (Sữa tiệt trùng Cô Gái Hà Lan 180ml)                                     |\n"
        "| - Số lượng hủy: 10 Hộp                                                                               |\n"
        "| - Lý do hủy:    (o) Quá hạn sử dụng (EXPIRED)  ( ) Rách vỡ bao bì (DAMAGED)  ( ) Ối thiu (SPOILED)   |\n"
        "| - Đơn vị vốn:   25,000 đ/hộp                                                                         |\n"
        "| - TỔNG THIỆT HẠI HẠCH TOÁN VÀO SỔ HAO HỤT: 250,000 đ                                                |\n"
        "| - Người lập đề xuất: warehouse_01 (Trần Kho Vận) lúc 08:30 ngày 09/10/2026                          |\n"
        "+------------------------------------------------------------------------------------------------------+\n"
        "| Ý kiến phê duyệt: [ Hàng đã kiểm tra thực tế, đồng ý tiêu hủy theo quy định                       ] |\n"
        "|                              [ TỪ CHỐI ]    [ PHÊ DUYỆT TIÊU HỦY & CHỐT SỔ HAO HỤT ]                 |\n"
        "+------------------------------------------------------------------------------------------------------+"
    )

    # =========================================================================
    # 15. HỆ THỐNG HÓA QUY TẮC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS RULES Ở PHÍA DƯỚI)
    # =========================================================================
    add_h1("15. Hệ thống hóa Quy tắc Nghiệp vụ Cốt lõi (Core Business Rules)")
    add_first(
        "Theo chỉ dẫn: 'Thêm mấy cái rule ở phía dưới' và 'Kiểm tra lại các rule trong file word', "
        "dưới đây là toàn bộ 10 quy tắc nghiệp vụ bất di bất dịch của nền tảng Bán lẻ Chống lãng phí "
        "được chuẩn hóa, kiểm tra chặt chẽ và ghi chú tập trung xuống cuối tài liệu phân tích nghiệp vụ:"
    )

    add_h2("BR-01: Quy tắc Tiếp nhận Lô hàng từ Kho tổng DC (DC Goods Receipt Rule)")
    add_first(
        "Mỗi đợt hàng từ xe tải Kho tổng DC Biên Hòa giao đến cửa hàng bắt buộc phải tạo theo Lô hàng (Batch). "
        "Điều kiện nghiệm thu kỹ thuật:"
    )
    add_code(
        "- ExpiryDate > ManufactureDate và ImportDate >= ManufactureDate.\n"
        "- InitialQuantity > 0 và CurrentQuantity = InitialQuantity khi khởi tạo.\n"
        "- Tỷ lệ hạn sử dụng còn lại khi tiếp nhận bắt buộc đạt chuẩn: RSL >= 70%.\n"
        "  RSL = ((ExpiryDate - ImportDate) / (ExpiryDate - ManufactureDate)) * 100%\n"
        "- Nếu RSL < 70%: Nhân viên kho báo cáo Cửa hàng trưởng lập biên bản TỪ CHỐI NHẬN HÀNG và trả về DC.\n"
        "- Cửa hàng trưởng là người ký duyệt biên bản giao nhận và bấm xác nhận nhập kho trên phần mềm."
    )

    add_h2("BR-02: Quy tắc Bán lẻ = Xuất kho & Thuật toán Khấu trừ FEFO Tuyệt đối (FEFO Sales Rule)")
    add_first(
        "Bán lẻ tại quầy POS chính là hành động Xuất kho duy nhất của cửa hàng. "
        "Không có quy trình xuất kho nội bộ riêng."
    )
    add_code(
        "- Thuật toán FEFO (First Expired, First Out): Khi khách mua số lượng Q sản phẩm P:\n"
        "  1. Quét tìm các lô của sản phẩm P có Status = 'ACTIVE' và CurrentQuantity > 0.\n"
        "  2. Sắp xếp ưu tiên tuyệt đối: ORDER BY ExpiryDate ASC, Id ASC.\n"
        "  3. Lô nào có ExpiryDate gần nhất sẽ tự động được khấu trừ trước.\n"
        "  4. Nếu lô đó không đủ số lượng Q, hệ thống tự động bẻ nhỏ và trừ tiếp ở lô kế cận (Split Allocation).\n"
        "- Thu ngân không cần chọn lô thủ công; hệ thống tự động gán BatchId vào hóa đơn để đảm bảo minh bạch."
    )

    add_h2("BR-03: Ràng buộc An toàn Chống Tồn kho Âm Tuyệt đối (Zero Negative Stock Guard)")
    add_first(
        "Tuyệt đối không bao giờ cho phép tồn kho âm tại bất kỳ thời điểm nào trong toàn bộ hệ thống."
    )
    add_code(
        "- Ràng buộc mức CSDL SQL Server: CHECK (CurrentQuantity >= 0).\n"
        "- Trước khi trừ kho, hệ thống kiểm tra: Tổng CurrentQuantity của tất cả các lô còn hạn >= Q.\n"
        "- Nếu không đủ, giao dịch thanh toán POS bị hủy bỏ tức thì với thông báo: 'Tồn kho không đủ để bán'.\n"
        "- Áp dụng khóa dòng hàng (ROWLOCK, UPDLOCK) trong SQL Server Transaction để ngăn chặn Race Condition."
    )

    add_h2("BR-04: Quy tắc 3 Ngưỡng An toàn Hạn sử dụng & Cảnh báo Đa cấp (Shelf-Life Safety Thresholds)")
    add_first("Công thức tính % Vòng đời còn lại tại thời điểm hiện tại:")
    add_code(
        "DaysLeft = ExpiryDate - CurrentDate\n"
        "TotalShelfLife = ExpiryDate - ImportDate\n"
        "RSL (%) = (DaysLeft / TotalShelfLife) * 100%"
    )
    add_first("Phân cấp 3 vùng màu hành động:")
    add_code(
        "🟢 VÙNG XANH (Safe - RSL > 20%): Hàng hóa tươi mới, an toàn. Bán bình thường theo FEFO.\n\n"
        "🟡 VÙNG VÀNG (Warning - 10% < RSL <= 20%): Cận date nhẹ. Bật cảnh báo Vàng trên Dashboard. "
        "Nhân viên kho theo dõi sát quầy kệ.\n\n"
        "🔴 VÙNG ĐỎ (Critical - RSL <= 10% hoặc DaysLeft <= 3 ngày): Nguy cơ hư hỏng cao. Bật cảnh báo Đỏ khẩn cấp. "
        "Kích hoạt hành động bắt buộc: Đảo hàng ra mặt tiền kệ và đề xuất Quản lý kích hoạt Quick Markdown 15%-50%.\n\n"
        "🟣 QUÁ HẠN (Expired - DaysLeft <= 0): Chuyển trạng thái sang EXPIRED. TỰ ĐỘNG KHÓA CỨNG MÃ VẠCH TRÊN POS, "
        "nghiêm cấm quét thanh toán tại quầy thu ngân. Chuyển sang khu cách ly để làm thủ tục tiêu hủy."
    )

    add_h2("BR-05: Quy tắc Điểm Đặt Hàng Lại (Reorder Point - ROP) & Tái Cung ứng từ DC")
    add_first("Công thức tính Điểm đặt hàng lại để tự động đề xuất đơn nhập hàng mới gửi Kho tổng DC Biên Hòa:")
    add_code(
        "ROP = (d * L) + SS\n"
        "- d (Daily Demand Velocity): Tốc độ bán trung bình 1 ngày (lấy từ dữ liệu lịch sử bán hàng).\n"
        "- L (Lead Time): Thời gian chờ giao hàng từ Kho tổng DC (mặc định 1 ngày).\n"
        "- SS (Safety Stock): Lượng tồn kho an toàn dự phòng rủi ro chậm hàng.\n"
        "- Quy tắc kích hoạt: Khi Tổng tồn kho trên kệ <= ROP --> Hệ thống tự động tạo gợi ý Đơn đặt hàng (Purchase Order)."
    )

    add_h2("BR-06: Quy tắc Cảnh báo Nguy cơ Lãng phí Tồn đọng (Spoilage Risk Index - DOS > DUE)")
    add_first("Chỉ số đo lường rủi ro hàng ế bị vứt bỏ:")
    add_code(
        "- DOS (Days of Supply) = Tổng tồn kho hiện tại / Tốc độ bán d (Số ngày cần để bán hết tồn kho hiện tại).\n"
        "- DUE (Days until Expiry) = ExpiryDate - CurrentDate (Số ngày còn lại đến khi hết hạn).\n"
        "- Quy tắc: Nếu DOS > DUE --> Kích hoạt cảnh báo NGUY CƠ HƯ HỎNG CHẮC CHẮN. Tốc độ bán hiện tại không kịp "
        "giải phóng hết hàng trước khi hết hạn. Hệ thống cảnh báo Quản lý không được nhập thêm hàng và bắt buộc xả hàng."
    )

    add_h2("BR-07: Quy tắc Tiêu hủy Hàng hỏng & Sổ Hao hụt Tài chính (Spoilage Loss Accounting)")
    add_first("Quy trình xử lý hàng quá hạn hoặc hư hỏng vật lý:")
    add_code(
        "1. Nhân viên gom hàng cách ly, lập phiếu đề xuất tiêu hủy trên phần mềm.\n"
        "2. Cửa hàng trưởng kiểm tra thực tế và bấm nút Phê duyệt tiêu hủy.\n"
        "3. CSDL cập nhật: CurrentQuantity = 0, Status = 'DISPOSED'.\n"
        "4. Hạch toán tổn thất tài chính vào Sổ hao hụt:\n"
        "   Chi phí thiệt hại = Số lượng hủy * Giá vốn nhập (Cost Price)\n"
        "5. Tự động tính chỉ số Spoilage Rate %:\n"
        "   Spoilage Rate (%) = (Tổng chi phí hàng hủy / Tổng chi phí hàng nhập) * 100%\n"
        "   Mục tiêu kinh doanh: Duy trì Spoilage Rate < 1.5%."
    )

    add_h2("BR-08: Quy tắc Biến Ngoại cảnh & Hệ số Nhân Dự báo (Contextual Multipliers - K Factor)")
    add_first("Tốc độ bán hàng d được tự động nhân với hệ số điều chỉnh K theo điều kiện thực tế:")
    add_code(
        "- Ngày thường: K = 1.0\n"
        "- Cuối tuần (Thứ 7, CN): K = 1.25 (sức mua thực phẩm & đồ uống tăng 25%)\n"
        "- Ngày Lễ / Tết: K = 1.60 (sức mua tăng 60%)\n"
        "- Trời nắng nóng (> 34°C): K = 1.40 (nhóm nước giải khát, kem, nước khoáng tăng mạnh)\n"
        "- Trời mưa bão: K = 0.75 (thực phẩm tươi giảm 25%, nhưng mì tôm & đồ hộp K = 1.30)."
    )

    add_h2("BR-09: Quy tắc Chống Tạo Trùng hoặc Gần Trùng Sản phẩm (Product Deduplication Shield)")
    add_first("Bộ lọc kiểm tra khi thêm sản phẩm mới vào danh mục:")
    add_code(
        "- Chuẩn hóa chuỗi ký tự tên sản phẩm: Bỏ dấu tiếng Việt, viết thường, loại bỏ khoảng trắng thừa.\n"
        "- Chặn tạo mới nếu trùng mã Barcode/SKU với sản phẩm đã có.\n"
        "- Cảnh báo nếu độ tương đồng tên sản phẩm >= 85% so với sản phẩm hiện hành trong danh mục."
    )

    add_h2("BR-10: Quy tắc Toàn vẹn Giao dịch ACID & Nhật ký Kiểm toán Bất biến (Audit Trail Rule)")
    add_first("Mọi thao tác thay đổi trạng thái tồn kho và giá cả đều phải có dấu vết kiểm toán:")
    add_code(
        "- Bọc trong Transaction của SQL Server (BEGIN TRANSACTION ... COMMIT / ROLLBACK).\n"
        "- Tự động ghi bản ghi vào AuditLogs: Bảng bị tác động, ID bản ghi, Giá trị cũ, Giá trị mới, UserId, Thời gian, Địa chỉ IP.\n"
        "- Dữ liệu trong AuditLogs là bất biến (Append-only, cấm UPDATE và DELETE)."
    )

    # =========================================================================
    # 16. KẾT LUẬN ĐẶC TẢ & LỜI CẢM ƠN
    # =========================================================================
    add_h1("16. Kết luận đặc tả & Lời cảm ơn")
    add_first(
        "Bản đặc tả yêu cầu hệ thống này đã được chuẩn hóa toàn diện theo các ý kiến chỉ đạo khoa học của ThS. Lê Minh Nhật "
        "và bám sát 100% nội dung 'Note mới ngày 2/10', tập trung sâu sắc vào mô hình Cửa hàng Bán lẻ tinh gọn (Single Store), "
        "bám sát nguyên tắc FEFO, 3 ngưỡng an toàn hạn dùng, hạch toán minh bạch Sổ hao hụt tài chính và dự báo điểm đặt hàng ROP."
    )
    add_body(
        "Tập thể nhóm sinh viên thực hiện: Đỗ Tấn Du (MSSV: 123001364) và Đoàn Minh Quân (MSSV: 123000946) "
        "xin bày tỏ lòng biết ơn chân thành và sâu sắc nhất đến ThS. Lê Minh Nhật - Giảng viên hướng dẫn, "
        "người đã tận tình chỉ dẫn phương pháp luận, định hướng nghiệp vụ thực tế và luôn đồng hành cùng nhóm."
    )
    add_body(
        "Nhóm cũng xin trân trọng cảm ơn Ban Giám hiệu, Quý Thầy Cô Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU) "
        "đã tạo điều kiện thuận lợi và trang bị kiến thức chuyên môn vững chắc để nhóm hoàn thiện xuất sắc đề tài này."
    )

    # Lưu file
    print(f"Saving document to {OUTPUT_NEW}...")
    doc.save(OUTPUT_NEW)
    print(f"Document saved successfully to: {OUTPUT_NEW}!")

    # Thử copy sang các file khác nếu không bị Word khóa
    for target in [OUTPUT_PRIMARY, OUTPUT_ORIGINAL]:
        try:
            shutil.copyfile(OUTPUT_NEW, target)
            print(f"Successfully copied to: {target}")
        except PermissionError:
            print(f"[NOTE] {target} is currently locked by Word.")

if __name__ == "__main__":
    build_full_document()
