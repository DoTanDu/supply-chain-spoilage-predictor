# 04. DATABASE MIGRATION VÀ SEED DATA (SQL SERVER)

---

### 1. Kiến trúc Cơ sở dữ liệu (12 Bảng cốt lõi)
Hệ thống sử dụng cơ sở dữ liệu `SupplyChain_SpoilageDB` chạy trên `(localdb)\mssqllocaldb`.

1. `stores`: Thông tin cửa hàng bán lẻ (Tên, Địa chỉ, Quản lý).
2. `users`: Tài khoản người dùng phân quyền (`STORE_MANAGER`, `STORE_STAFF`).
3. `categories`: Danh mục sản phẩm ngành hàng tiêu dùng nhanh (FMCG).
4. `products`: Thông tin sản phẩm, đơn vị tính, giá bán, giá vốn, điểm đặt hàng $ROP$, tồn an toàn $SS$.
5. `batches`: Quản lý từng lô hàng nhập từ DC: `batch_code`, `import_date`, `expiry_date`, `initial_quantity`, `quantity`, `cost_price`, `status`.
6. `sales_orders`: Đơn bán hàng tại quầy POS thu ngân.
7. `sale_items`: Chi tiết sản phẩm bán ra kèm liên kết trừ kho FEFO.
8. `spoilage_records`: Phiếu ghi nhận hàng hỏng, lý do tiêu hủy và giá trị thiệt hại tài chính.
9. `purchase_orders`: Đề xuất đặt hàng mới từ Kho tổng (DC).
10. `reorder_alerts`: Bảng lưu vết các cảnh báo chạm ngưỡng ROP và nguy cơ hư hỏng $DOS > DUE$.
11. `weather_external_factors`: Yếu tố ngoại cảnh (Nhiệt độ, Thời tiết, Ngày lễ) ảnh hưởng đến sức mua.
12. `audit_logs`: Nhật ký kiểm toán mọi hành động trọng yếu trên hệ thống.

---

### 2. Ràng buộc toàn vẹn & Kỹ thuật Chống Tồn kho Âm
- Check Constraint trên `batches`: `CHECK (quantity >= 0)`.
- Trigger `trg_prevent_negative_batch_stock`: Ngăn chặn mọi thao tác `UPDATE` làm tồn kho lô bị âm.
- Index trên `batches (expiry_date ASC, status, quantity)` giúp truy vấn FEFO nhanh tức thì (dưới 5ms).
