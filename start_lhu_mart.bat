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
echo   🔑 DANH SÁCH TÀI KHOẢN ĐĂNG NHẬP MẪU THEO 3 VAI TRÒ (Mật khẩu chung: 123456):
echo -------------------------------------------------------------------------------
echo   1. Chủ chuỗi / Quản trị viên (OWNER - Toàn chuỗi 3 CN):
echo      - Tài khoản: admin        Mật khẩu: 123456
echo      - Quyền hạn: Toàn quyền chuỗi 3 chi nhánh, quản lý nhân sự, cấu hình hệ thống.
echo.
echo   2. Quản lý Cửa hàng (MANAGER - Cô lập theo chi nhánh):
echo      - CN #1 (Bửu Long):   manager   ^| CN #2 (Tân Phong): manager2  ^| CN #3 (Trảng Dài): manager3
echo      - Quyền hạn: Điều hành KPI, giảm giá 15-50%, duyệt tiêu hủy & đặt/điều phối hàng chi nhánh.
echo.
echo   3. Nhân viên Cửa hàng (STAFF - POS & Kho kệ):
echo      - CN #1 (Bửu Long):   cashier   ^| CN #2 (Tân Phong): staff2    ^| CN #3 (Trảng Dài): staff3
echo      - Quyền hạn: Bán lẻ POS tự động bẻ lô FEFO, nhận hàng DC (RSL >= 70%), đảo kệ & giao nhận điều chuyển.
echo -------------------------------------------------------------------------------
echo.
echo   ℹ️  Để tắt toàn bộ hệ thống, hãy chạy file: stop_lhu_mart.bat
echo ===============================================================================
echo.
pause

