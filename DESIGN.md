---
name: Supply Chain Spoilage Predictor
description: Nền tảng Quản trị Chuỗi cung ứng Chống lãng phí theo chuẩn Impeccable Operate Mode (Minimalist Clean Indigo)
colors:
  bg-canvas: "#f8fafc"
  surface-card: "#ffffff"
  surface-card-subtle: "#f1f5f9"
  border-subtle: "#e2e8f0"
  border-muted: "#cbd5e1"
  text-primary: "#0f172a"
  text-secondary: "#334155"
  text-muted: "#64748b"
  primary: "#4f46e5"
  primary-hover: "#4338ca"
  warning: "#d97706"
  warning-hover: "#b45309"
  critical: "#e11d48"
  critical-hover: "#be123c"
  info: "#2563eb"
  info-hover: "#1d4ed8"
typography:
  display:
    fontFamily: "Be Vietnam Pro, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Be Vietnam Pro, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Be Vietnam Pro, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Be Vietnam Pro, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Be Vietnam Pro, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.04em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "#ffffff"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card-default:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: Supply Chain Spoilage Predictor

## Overview

**Creative North Star: "The Royal Indigo Store"**

Một không gian bán lẻ hiện đại, đĩnh đạc và thanh lịch theo phong cách tối giản cao cấp (tương tự thiết kế chuẩn mực của Stripe & Apple). Toàn bộ ngôn ngữ thiết kế tuân thủ triệt để chế độ **Operate Mode** của Impeccable kết hợp với trường phái **Minimalist Clean Indigo**: kết hợp giữa nền trắng ngà dịu mát và sắc Xanh Chàm Indigo hoàng gia đầy quyền uy, tinh tế và loại bỏ triệt để mọi dấu hiệu sáo rỗng của AI.

Giao diện sử dụng nền trắng ngà dịu mắt (`#f8fafc`) kết hợp bề mặt các khối thẻ trắng tinh khôi (`#ffffff`) và đường viền phân cách xám nhạt thanh mảnh (`#e2e8f0`). Màu nhấn chủ đạo là **Royal Indigo** (`#4f46e5`) cho các nút bấm tác vụ trọng yếu, logo và điều hướng menu. Các màu sắc cảnh báo hạn dùng (Vàng Hổ Phách `#d97706`, Đỏ Hoa Hồng `#e11d48`) được bảo tồn trọn vẹn theo đúng quy tắc kiểm soát date.

**Key Characteristics:**
- **Sắc cạnh & Đẳng cấp (Royal Indigo Precision):** Màu xanh chàm `#4f46e5` nổi bật dứt khoát trên nền trắng tinh, tôn dáng thanh lịch của toàn bộ hệ thống.
- **Tương phản chuẩn mực (WCAG AAA Contrast):** Chữ đen than `#0f172a` trên nền trắng tinh khiết, loại bỏ hoàn toàn mờ nhạt.
- **Typography thuần Việt thượng hạng:** Sử dụng font `Be Vietnam Pro` chuẩn mực tiếng Việt, tinh tế và dứt khoát.

## Colors

Bảng màu tươi sáng, dịu mắt, độ tương phản cao, tối ưu cho việc quan sát dữ liệu biểu đồ và ca trực bán lẻ liên tục.

### Primary
- **Royal Indigo** (`#4f46e5`): Nút hành động chính (Bán POS, Xác nhận thanh toán), logo nhận diện LHU Mart, menu điều hướng active, doanh thu bán lẻ.

### Secondary
- **Amber Warning** (`#d97706`): Cảnh báo Vùng Vàng (3 < DaysLeft <= WarningDays), nguy cơ đọng vốn (DOS > DUE), đề xuất giảm giá 15%-30%.
- **Rose Critical** (`#e11d48`): Nguy kịch Vùng Đỏ (DaysLeft <= 3), tiêu hủy hàng quá hạn, thất thoát chi phí.
- **Cobalt DC Signal** (`#2563eb`): Tiếp nhận xe tải DC, dữ liệu tổng tồn kho, thông tin hệ thống.

### Neutral
- **Crisp Canvas** (`#f8fafc`): Nền tổng thể toàn bộ trang web (Slate 50).
- **Pure Surface Card** (`#ffffff`): Bề mặt thẻ KPI, bảng dữ liệu, Header và Sidebar.
- **Subtle Surface** (`#f1f5f9`): Khối con lồng nhau, nền hover và phân cách dòng bảng (Slate 100).
- **Subtle Border** (`#e2e8f0`): Viền phân cách nhẹ nhàng giữa các khối chức năng (Slate 200).
- **Text Primary** (`#0f172a`): Văn bản tiêu đề và chỉ số chính (Slate 900, tương phản WCAG AAA).
- **Text Secondary** (`#334155`): Nội dung phụ, bảng biểu (Slate 700).
- **Text Muted** (`#64748b`): Nhãn trường, đơn vị đo, metadata (Slate 500).

### Named Rules
**The Clean Canvas Rule.** Không dùng nền tối u ám hoặc màu nền loang lổ. Mọi bề mặt dữ liệu phải sạch sẽ, sáng sủa và trung tính.
**The No-Gradient-Text Rule.** Không bao giờ dùng `-webkit-background-clip: text` với gradient loang lổ trên bất kỳ tiêu đề hoặc nhãn nào.

## Typography

**Display & Body Font:** `Be Vietnam Pro` (fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`)
**Character:** Rõ ràng, trung tính, hiện đại và hỗ trợ hoàn hảo hiển thị dấu tiếng Việt mà không bị lỗi chân chữ hay ngắt dòng lệch chuẩn.

### Hierarchy
- **Display** (700, 1.75rem, line-height 1.2, letter-spacing -0.02em): Tiêu đề chính màn hình (Dashboard, POS Bán Lẻ).
- **Headline** (700, 1.375rem, line-height 1.25, letter-spacing -0.015em): Tiêu đề các khối phân tích chính và số đo KPI trọng tâm.
- **Title** (600, 1.0625rem, line-height 1.3, letter-spacing -0.01em): Tiêu đề bảng biểu, tiêu đề card phân tích.
- **Body** (400, 0.875rem, line-height 1.5): Nội dung bảng dữ liệu, nhãn form, văn bản giải thích.
- **Label** (600, 0.6875rem, letter-spacing 0.04em, uppercase): Nhãn trạng thái (PILL BADGE), tiêu đề phụ trên thẻ KPI.

### Named Rules
**The Single Typeface Rule.** Chỉ dùng duy nhất một phông chữ chất lượng cao (`Be Vietnam Pro`) trong toàn bộ ứng dụng, tạo tính nhất quán tuyệt đối.

## Layout

- **Spatial Model:** Bố cục thanh điều hướng bên trái (Sidebar cố định 260px) kết hợp thanh tiêu đề trên cùng (Header cao 60px) và khu vực nội dung chính cuộn độc lập.
- **Grid & Container:** Mạng lưới 12 cột linh hoạt với khoảng cách `gap: 16px` giữa các thẻ, đảm bảo không gian chứa thông tin tối đa mà không gây ngột ngạt.
- **Rhythm & Spacing:** Sử dụng bội số 4px/8px (`gap: 8px`, `padding: 16px`, `margin-bottom: 20px`).

## Elevation & Depth

Toàn bộ hệ thống áp dụng triết lý phẳng có phân tầng nhẹ nhàng (Crisp Layered Surface). Chiều sâu được tạo ra thông qua viền mảnh `#e2e8f0` và bóng đổ mờ tự nhiên (`0 1px 3px rgba(0, 0, 0, 0.05)`), tuyệt đối không dùng hiệu ứng hào quang phát sáng neon.

### Shadow Vocabulary
- **Card Subtle** (`0 1px 3px rgba(0, 0, 0, 0.05)`): Bóng đổ tự nhiên phân tách card với nền canvas.
- **Dropdown / Modal** (`0 10px 25px -5px rgba(0, 0, 0, 0.1)`): Bóng đổ cho bảng chọn vai trò và cửa sổ xác nhận mật khẩu.

### Named Rules
**The Zero-Halo Rule.** Cấm hoàn toàn `box-shadow: 0 0 15px [màu]`. Mọi bóng đổ phải có tọa độ dời trục Y tự nhiên và sử dụng màu đen trong suốt.

## Shapes

- **Bán kính bo góc (Corner Radius):**
  - Nhãn trạng thái / Pills: `9999px` (Bo tròn dạng viên thuốc).
  - Thẻ KPI / Cards / Modal: `8px` - `12px` (Góc bo tinh gọn, dứt khoát).
  - Nút bấm / Ô nhập liệu: `6px`.
  - Checkbox / Tag nhỏ: `4px`.

## Components

### Buttons
- **Shape:** Bo góc 6px (`rounded.md`).
- **Primary:** Nền xanh chàm Indigo `#4f46e5`, chữ trắng, không viền, hover sáng màu `#4338ca`.
- **Secondary / Ghost:** Nền trắng `#ffffff`, viền `1px solid #cbd5e1`, chữ `#0f172a`, hover nền `#f8fafc`.

### Status Badges (Pills)
- **Shape:** Bo góc tròn đầy đủ (`rounded.full`), padding `3px 8px`, font chữ 11px đậm hoa.
- **An toàn (Indigo):** Nền `#eef2ff`, chữ `#4338ca`, viền `1px solid #c7d2fe`.
- **Cảnh báo (Vàng):** Nền `#fffbeb`, chữ `#b45309`, viền `1px solid #fde68a`.
- **Nguy kịch (Đỏ):** Nền `#fff1f2`, chữ `#be123c`, viền `1px solid #fecdd3`.

### Cards & Panels
- **Cấu trúc:** Nền trắng `#ffffff`, viền đồng nhất `1px solid #e2e8f0`, bóng đổ nhẹ `0 1px 3px rgba(0, 0, 0, 0.05)`.
- **Tuyệt đối không có viền đầu màu mè (No Top-Border Strips):** Không dùng `border-top: 3px solid #...`.

### Form Fields & Inputs
- **Style:** Nền `#ffffff`, viền `1px solid #cbd5e1`, chữ `#0f172a`, bo góc 6px.
- **Focus:** Viền chuyển sang `#4f46e5` tinh tế, bóng đổ nhẹ không neon.

## Do's and Don'ts

### Do:
- **Do** duy trì nền trắng sáng ngà dịu mắt (`#f8fafc`) và bề mặt thẻ trắng `#ffffff`.
- **Do** sử dụng chữ đen than `#0f172a` cho độ tương phản WCAG AAA vượt trội.
- **Do** sử dụng font `Be Vietnam Pro` cho toàn bộ giao diện để hiển thị tiếng Việt sắc nét.
- **Do** dùng màu nhấn Royal Indigo `#4f46e5` cho các nút bấm trọng tâm.

### Don't:
- **Don't** dùng gradient text (`-webkit-background-clip: text`) dưới bất kỳ hình thức nào.
- **Don't** dùng emoji hay Unicode ký tự ngộ nghĩnh thay cho biểu tượng SVG hoặc nhãn văn bản chuẩn mực.
- **Don't** dùng viền trên sặc sỡ dày `3px` trên các thẻ cards.
- **Don't** dùng hiệu ứng ánh sáng neon tỏa ra đều 4 phía.
- **Don't** thêm nhãn phụ "kicker / eyebrow" lơ lửng không cần thiết phía trên tiêu đề chính.
