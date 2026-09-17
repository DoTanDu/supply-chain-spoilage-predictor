# HƯỚNG DẪN SỬ DỤNG VÀ THUYẾT MINH CƠ SỞ DỮ LIỆU HOÀN CHỈNH
**Đề tài:** Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí (Supply Chain Spoilage Predictor)
**File mã nguồn SQL:** `retail_spoilage_database.sql` (683 dòng code chuẩn hóa)
**Hệ quản trị CSDL:** MySQL 8.0+ / MariaDB

---

## 1. CÁCH IMPORT VÀO HỆ THỐNG
* **Qua phpMyAdmin (XAMPP):**
  1. Khởi động Apache & MySQL trong XAMPP Control Panel.
  2. Mở trình duyệt vào `http://localhost/phpmyadmin`.
  3. Chọn tab **Import (Nhập)** -> Chọn file `retail_spoilage_database.sql`.
  4. Bấm **Go (Thực hiện)**. Hệ thống sẽ tự động khởi tạo CSDL `retail_spoilage_db` cùng 12 bảng, 4 views, 1 trigger, 3 stored procedures, 1 function và dữ liệu mẫu đầy đủ.
* **Qua DBeaver / MySQL Workbench:**
  1. Mở file `retail_spoilage_database.sql`.
  2. Nhấn `Ctrl + Alt + X` (hoặc Execute Script) để nạp toàn bộ.

---

## 2. BẢN ĐẶC TẢ CHI TIẾT 12 BẢNG DỮ LIỆU CỐT LÕI (FULL 3NF)

| STT | Tên Bảng | Mục Đích Nghiệp Vụ Cốt Lõi |
| :---: | :--- | :--- |
| 1 | `system_settings` | Quản lý tham số cấu hình hệ thống: Tên shop, hotline, tỷ lệ % ngưỡng cảnh báo đệm... |
| 2 | `users` | Tài khoản người dùng, phân quyền `MANAGER` (Cửa hàng trưởng) và `STAFF` (Nhân viên), avatar URL. |
| 3 | `suppliers` | Kho tổng trung tâm (DC Biên Hòa, DC Thủ Đức) kèm thời gian giao hàng (`lead_time_days`). |
| 4 | `categories` | Danh mục ngành hàng (Sữa, Bánh tươi, Đồ khô, Nước ngọt...) và số ngày cảnh báo cận date mặc định. |
| 5 | `products` | Thông tin sản phẩm, mã vạch SKU, link ảnh (`image_url`), giá vốn, giá bán, ngưỡng tồn min/max. |
| 6 | `goods_receipts` | Quản lý Phiếu nhập kho từ Kho tổng DC về cửa hàng (ngày nhập, tổng tiền, nhân viên nhận). |
| 7 | `batches` | **Cốt lõi bài toán:** Quản lý từng lô hàng, NSX, HSD, số lượng tồn, mức % chiết khấu xả hàng (`discount_percent`), trạng thái `ACTIVE`, `WARNING`, `EXPIRED`, `DISPOSED`. Đánh chỉ mục tối ưu cho giải thuật FEFO. |
| 8 | `sales_history` | Lịch sử bán lẻ trừ kho FEFO, lưu trữ yếu tố ngoại cảnh phục vụ dự báo (`weather`, `is_holiday`). |
| 9 | `purchase_orders` | **Đóng kín Use Case 7:** Đơn đề xuất đặt hàng gửi Kho tổng DC (trạng thái `DRAFT`, `SUBMITTED`, `APPROVED`). |
| 10 | `purchase_order_items` | Chi tiết số lượng hệ thống gợi ý và số lượng Cửa hàng trưởng duyệt đặt cho từng món. |
| 11 | `spoilage_records` | **Minh chứng lãng phí:** Nhật ký tiêu hủy hàng quá date/hỏng kèm số tiền thiệt hại quy ra VNĐ. |
| 12 | `system_audit_logs` | Ghi vết kiểm toán tự động các thao tác quan trọng (nhập hàng, bán hàng, tiêu hủy, sinh đơn đặt). |

---

## 3. CÁC VIEW THÔNG MINH CHO FRONTEND & DASHBOARD
1. **`v_spoilage_alerts`**: Tự động tính số ngày còn lại (`days_left`), gán nhãn màu cảnh báo (Đỏ/Vàng/Xanh/Đen), tính giá khuyến mãi xả hàng (`promotional_price`) và giá trị thiệt hại tiềm năng.
2. **`v_active_inventory`**: Tổng hợp tồn kho toàn cửa hàng theo từng SKU, tính tổng giá trị vốn tồn kho và hạn dùng sớm nhất.
3. **`v_reorder_recommendations`**: Tự động lọc các món tụt dưới ngưỡng tồn an toàn ROP và tính số lượng cần xin cấp.
4. **`v_spoilage_financial_loss`**: Báo cáo tổng hợp số lượng hàng bị hủy và tổng tiền thiệt hại theo từng tháng.

---

## 4. TRIGGERS, PROCEDURES & FUNCTIONS
* **Trigger `trg_after_spoilage_insert`:** Tự động trừ tồn kho về 0, chuyển trạng thái lô sang `DISPOSED` và ghi audit log khi tạo biên bản hủy.
* **Function `fn_calculate_spoilage_risk(batch_id)`:** Hàm tính toán Chỉ số Rủi ro Lãng phí ($\text{Risk Score} = \text{DOS} / \text{DUE}$). Nếu $> 1.0 \rightarrow$ Nguy cơ cao hàng bị hết hạn trước khi kịp bán hết.
* **Procedure `sp_fefo_sales_deduction`:** Dùng con trỏ CURSOR tự động duyệt các lô còn hạn, ưu tiên trừ tồn lô có HSD gần nhất trước (chuẩn FEFO), tự động tính giá chiết khấu xả hàng nếu có.
* **Procedure `sp_daily_spoilage_scan`:** Tự động quét cập nhật trạng thái các lô sang `EXPIRED` hoặc `WARNING` mỗi ngày.
* **Procedure `sp_auto_generate_purchase_order`:** Tự động gom các món thiếu trong View ROP tạo thành Đơn đề xuất đặt hàng (`purchase_orders`) nháp để Quản lý chỉ việc bấm duyệt.

---

## 5. CÁC CÂU LỆNH SQL DEMO ĐẮT GIÁ KHI GẶP THẦY

```sql
-- 1. Xem màn hình Cảnh báo Cận Date (Có sẵn giá giảm để xả hàng):
SELECT product_name, batch_code, current_quantity, days_left, discount_percent, promotional_price, alert_level 
FROM v_spoilage_alerts 
WHERE alert_level IN ('CRITICAL', 'WARNING');

-- 2. Kiểm tra chỉ số rủi ro lãng phí của lô hàng (Hàm fn_calculate_spoilage_risk):
SELECT batch_code, fn_calculate_spoilage_risk(id) AS risk_score 
FROM batches 
WHERE current_quantity > 0;

-- 3. Xem các mặt hàng đang thiếu cần đặt từ Kho tổng:
SELECT product_name, total_quantity_in_stock, min_stock_level, suggested_order_qty, estimated_cost 
FROM v_reorder_recommendations;

-- 4. Xem Đơn đề xuất đặt hàng (Purchase Order) vừa được hệ thống tự động sinh:
SELECT po.order_code, po.status, po.total_estimated_cost, poi.suggested_quantity, p.name 
FROM purchase_orders po
JOIN purchase_order_items poi ON po.id = poi.order_id
JOIN products p ON poi.product_id = p.id;
```
