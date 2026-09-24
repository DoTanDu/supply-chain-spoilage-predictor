# 01. ĐẶC TẢ VAI TRÒ VÀ MA TRẬN PHÂN QUYỀN (RBAC)

---

### 1. Danh sách Vai trò Người dùng
| Mã vai trò | Tên vai trò | Mô tả phạm vi trách nhiệm |
| :--- | :--- | :--- |
| `STORE_MANAGER` | Cửa hàng trưởng | Toàn quyền kiểm soát cửa hàng, xem báo cáo tài chính, duyệt tiêu hủy hàng hỏng, điều chỉnh ngưỡng cảnh báo, duyệt đề xuất tái đặt hàng. |
| `STORE_STAFF` | Nhân viên bán lẻ / Thu kho | Thao tác nhập lô hàng từ DC, quét bán lẻ POS tại quầy, kiểm kê đảo date trên kệ, lập phiếu đề xuất tiêu hủy hàng hỏng. |

---

### 2. Ma trận Phân quyền Chức năng (Permission Matrix)
| Chức năng / Hành động | Store Staff | Store Manager | Ghi chú nghiệp vụ |
| :--- | :---: | :---: | :--- |
| Xem Dashboard KPI doanh thu & hao hụt | Chỉ xem cảnh báo hạn | Toàn quyền xem số liệu tài chính | Nhân viên chỉ cần biết việc cần làm |
| Nhập lô hàng mới từ DC | Có | Có | Tạo mới `batches` |
| Quét bán hàng tại quầy POS | Có | Có | Tự động trừ kho theo FEFO |
| Xem danh sách hạn sử dụng lô (FEFO) | Có | Có | Xem chỉ số RSL và màu cảnh báo |
| Lập phiếu tiêu hủy hàng hỏng | Có | Có | Chuyển trạng thái `PENDING_APPROVAL` |
| Phê duyệt phiếu tiêu hủy | **Không** | **Có** | Trừ kho chính thức và hạch toán lỗ |
| Đặt lại ngưỡng ROP & Tồn an toàn SS | Không | Có | Cấu hình tham số cung ứng |
| Xem lịch sử Audit Log hệ thống | Không | Có | Kiểm soát gian lận nội bộ |
