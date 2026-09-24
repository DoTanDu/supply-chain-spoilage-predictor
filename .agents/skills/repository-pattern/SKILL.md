---
name: repository-pattern
description: Kiến trúc tầng truy xuất dữ liệu (Data Access Layer) tách biệt logic nghiệp vụ khỏi CSDL SQL Server
---

# REPOSITORY PATTERN GUIDELINES

Bộ kỹ năng này định nghĩa nguyên tắc xây dựng tầng Data Access Layer (Repository) cho toàn bộ hệ thống Supply Chain Spoilage Predictor.

---

### 1. Mục tiêu kiến trúc
- Tách rời hoàn toàn nghiệp vụ tính toán (FEFO, RSL, ROP, Spoilage Loss) khỏi các câu lệnh SQL trực tiếp.
- Cho phép hoán đổi nguồn dữ liệu hoặc mock dữ liệu phục vụ Unit Test mà không sửa đổi Business Service.
- Quản lý Database Transaction tập trung, đảm bảo tính toàn vẹn (ACID).

---

### 2. Danh mục Repositories cốt lõi
1. **`ProductRepository`:**
   - `findAll(filter)`: Tìm kiếm sản phẩm theo danh mục, tên, SKU.
   - `findById(id)`: Lấy thông tin chi tiết kèm lịch sử bán và tồn kho.
   - `updateReorderPoint(id, rop)`: Cập nhật ngưỡng đặt hàng tính toán.

2. **`BatchRepository`:**
   - `findAvailableBatchesByProduct(productId)`: Lấy các lô đang `ACTIVE`, còn `quantity > 0`, sắp xếp `ORDER BY expiry_date ASC` (phục vụ thuật toán FEFO).
   - `createBatch(batchData)`: Ghi nhận tiếp nhận lô hàng mới.
   - `deductQuantity(batchId, quantity)`: Trừ tồn kho lô hàng an toàn, không bao giờ âm.
   - `getExpiringBatches(daysThreshold)`: Lấy danh sách lô sắp hết hạn phục vụ cảnh báo RSL.
   - `markDisposed(batchId, quantity)`: Cập nhật trạng thái tiêu hủy.

3. **`SalesRepository`:**
   - `createSale(saleData, saleItems)`: Lưu đơn hàng POS kèm các đợt trừ kho theo FEFO trong cùng 1 Transaction.
   - `getHistoricalDailyDemand(productId, daysBack)`: Tính toán tốc độ bán trung bình ngày $d$.

4. **`SpoilageRepository`:**
   - `createDisposalRecord(disposalData)`: Ghi nhận phiếu tiêu hủy hàng hỏng.
   - `getDisposalSummary(startDate, endDate)`: Thống kê tổng thiệt hại tài chính và tỷ lệ hao hụt.

---

### 3. Nguyên tắc Giao dịch (Transaction)
- Bắt buộc dùng Transaction khi:
  - Bán lẻ POS (Tạo `sales_order` + Tạo `sale_items` + Trừ kho nhiều `batches`).
  - Tiêu hủy (Ghi `spoilage_records` + Trừ kho `batches` + Cập nhật `products.total_stock`).
- Nếu có bất kỳ bước nào lỗi hoặc tồn kho không đủ $\rightarrow$ `ROLLBACK` toàn bộ.
