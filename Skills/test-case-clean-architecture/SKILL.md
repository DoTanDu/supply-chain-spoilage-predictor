---
name: test-case-clean-architecture
description: Quy chuẩn viết Test Case theo kiến trúc phân tầng Clean Architecture cho hệ thống Bán lẻ Chống lãng phí
---

# TEST CASE & CLEAN ARCHITECTURE TESTING GUIDELINES

Bộ kỹ năng này hướng dẫn thiết kế và thực thi kiểm thử tự động cho hệ thống Supply Chain Spoilage Predictor theo phân tầng Clean Architecture.

---

### 1. Kim tự tháp kiểm thử (Test Pyramid)
1. **Unit Tests (Tầng Domain & Service):**
   - Kiểm tra logic thuần túy không phụ thuộc vào Database hay Network.
   - Mocking Repositories.
2. **Integration Tests (Tầng Repository & Database):**
   - Kiểm tra tương tác thực tế với SQL Server LocalDB.
   - Xác minh Trigger chặn tồn kho âm và Stored Procedure FEFO.
3. **End-to-End Tests (Tầng API & UI Flow):**
   - Giả lập luồng người dùng từ Nhập lô $\rightarrow$ Bán POS $\rightarrow$ Cảnh báo Hạn $\rightarrow$ Tiêu hủy.

---

### 2. Bộ Test Case Bắt buộc cho Nghiệp vụ Trọng yếu
1. **Test Case FEFO Deduction:**
   - *Given:* Sản phẩm A có Lô 1 (HSD: 01/10/2026, tồn: 5) và Lô 2 (HSD: 10/10/2026, tồn: 10).
   - *When:* Khách mua 8 hộp.
   - *Then:* Lô 1 còn tồn 0, Lô 2 còn tồn 7. Tổng bán thành công 8.
2. **Test Case Prevent Negative Stock:**
   - *Given:* Sản phẩm B có tổng tồn 3 hộp.
   - *When:* Khách yêu cầu mua 5 hộp.
   - *Then:* Hệ thống trả về lỗi 400 "InsufficientStockError", không có bản ghi nào bị trừ kho.
3. **Test Case RSL Threshold Calculation:**
   - *Given:* Lô hàng có HSD còn lại 3 ngày, tổng hạn ban đầu 30 ngày (RSL = 10%).
   - *Then:* Phân loại cảnh báo phải là `CRITICAL` (Màu Đỏ), gợi ý giảm giá xả hàng.
4. **Test Case Disposal Financial Loss:**
   - *Given:* Hủy 10 hộp bánh giá vốn 25.000 VNĐ.
   - *Then:* Tổng chi phí thiệt hại ghi nhận chính xác là 250.000 VNĐ.
