@echo off
chcp 65001 >nul
title LHU Mart - Stop System
color 0C

echo ===============================================================================
echo   🛑 ĐANG DỪNG CÁC TIẾN TRÌNH HỆ THỐNG LHU MART
echo ===============================================================================
echo.

echo [1/2] Đang tắt Backend API Server trên cổng 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
    echo       -> Đã tắt tiến trình Backend PID: %%a
)

echo.
echo [2/2] Đang tắt Frontend Vite Server trên cổng 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
    echo       -> Đã tắt tiến trình Frontend PID: %%a
)

echo.
echo ===============================================================================
echo   ✅ TOÀN BỘ CÁC CỔNG DỊCH VỤ ĐÃ ĐƯỢC GIẢI PHÓNG AN TOÀN!
echo ===============================================================================
echo.
timeout /t 3

