@echo off
chcp 65001 >nul
title LHU Mart - Supply Chain Spoilage Predictor Launcher
color 0A

echo ===============================================================================
echo   🚀 NỀN TẢNG QUẢN TRỊ CHUỖI CUNG ỨNG BÁN LẺ CHỐNG LÃNG PHÍ (LHU MART)
echo      Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng (LHU)
echo      Đề tài: Supply Chain Spoilage Predictor (FEFO & AI-ROP)
echo ===============================================================================
echo.

echo [1/3] Đang kiểm tra và khởi động Microsoft SQL Server LocalDB...
sqllocaldb start mssqllocaldb >nul 2>&1
echo       -> SQL Server LocalDB (mssqllocaldb) đã sẵn sàng!
echo.

echo [2/3] Đang khởi động Backend API Server (Port 5000)...
start "LHU Mart - Backend API (Port 5000)" cmd /k "cd /d "%~dp0Backend" && npm start"
echo       -> Backend API: http://localhost:5000
echo.

echo [3/3] Đang khởi động Frontend Web Vite (Port 5173)...
start "LHU Mart - Frontend Web (Port 5173)" cmd /k "cd /d "%~dp0Frontend" && npm run dev"
echo       -> Frontend Web: http://localhost:5173
echo.

echo Đang chờ các dịch vụ kết nối (3 giây)...
timeout /t 3 /nobreak >nul

echo Đang mở trình duyệt vào trang đăng nhập LHU Mart...
start http://localhost:5173/login

cls
echo ===============================================================================
echo   🎉 HỆ THỐNG LHU MART ĐÃ KHỞI CHẠY THÀNH CÔNG!
echo ===============================================================================
echo.
echo   🌐 Địa chỉ Web:      http://localhost:5173
echo   🔌 Địa chỉ API:      http://localhost:5000
echo   🗄️  Cơ sở dữ liệu:    (localdb)\mssqllocaldb -> retail_spoilage_db
echo.
echo -------------------------------------------------------------------------------
echo   🔑 DANH SÁCH TÀI KHOẢN ĐĂNG NHẬP MẪU THEO 4 VAI TRÒ (RBAC SSOT):
echo -------------------------------------------------------------------------------
echo   1. Quản trị viên Tối cao (ADMIN):
echo      - Tài khoản: admin        Mật khẩu: Password123@
echo      - Quyền hạn: Toàn quyền hệ thống, quản lý người dùng, cấu hình cửa hàng.
echo.
echo   2. Cửa hàng trưởng (STORE_MANAGER):
echo      - Tài khoản: manager      Mật khẩu: Password123@
echo      - Quyền hạn: Duyệt tiêu hủy Spoilage, duyệt PO gửi DC, xem Dashboard 14 ngày.
echo.
echo   3. Thu ngân Quầy POS (CASHIER):
echo      - Tài khoản: cashier      Mật khẩu: Password123@
echo      - Quyền hạn: Bán lẻ xuất kho FEFO tự động bẻ lô, in hóa đơn, bàn giao ca.
echo.
echo   4. Nhân viên Kho & Kệ (WAREHOUSE_STAFF):
echo      - Tài khoản: warehouse    Mật khẩu: Password123@
echo      - Quyền hạn: Nhận hàng DC (RSL >= 70%), lập biên bản từ chối, đảo kệ FEFO.
echo -------------------------------------------------------------------------------
echo.
echo   ℹ️  Để tắt toàn bộ hệ thống, hãy chạy file: stop_lhu_mart.bat
echo ===============================================================================
echo.
pause

