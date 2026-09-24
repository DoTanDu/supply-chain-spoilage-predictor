# 08. FRONTEND SHELL, LAYOUT & NAVIGATION

---

### 1. Cấu trúc Giao diện chính (Dashboard Shell)
* **Thanh điều hướng Sidebar (Trái):**
  - 📊 **Tổng quan (Executive Dashboard):** Các thẻ KPI, tỷ lệ hao hụt, cảnh báo khẩn.
  - ⏱️ **Giám sát FEFO & Cận Date:** Bảng trực quan các lô hàng với 3 màu RSL.
  - 🛒 **Bán lẻ tại Quầy (POS Retail):** Giao diện quét bán hàng trừ kho FEFO tức thì.
  - 📥 **Nhập lô hàng (DC Intake):** Tiếp nhận lô hàng mới từ Kho tổng.
  - 🗑️ **Tiêu hủy hàng hỏng (Disposal):** Lập phiếu và phê duyệt hủy hàng.
  - 🔮 **Dự báo Tái đặt hàng (AI Reorder):** Dự báo ROP và cảnh báo nguy cơ $DOS > DUE$.
  - 📜 **Nhật ký Audit Log:** Lịch sử kiểm toán các thao tác.
* **Thanh Header (Trên):**
  - Tên cửa hàng & Trạng thái kết nối CSDL LocalDB.
  - Widget thời tiết ngoại cảnh (Nhiệt độ, Nắng/Mưa, Ngày lễ).
  - Nút chuyển vai trò nhanh (Manager / Staff).
  - Huy hiệu thông báo số lượng lô đang cận date khẩn cấp (Badge đỏ).
* **Khu vực Nội dung trung tâm (Main Workspace):**
  - Bố cục lưới responsive, hiệu ứng chuyển trang mượt mà, hỗ trợ Dark Mode và Glassmorphism cao cấp.
