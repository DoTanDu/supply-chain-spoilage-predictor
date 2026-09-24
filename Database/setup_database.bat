@echo off
chcp 65001 > nul
echo ==============================================================================
echo [HE THONG QUAN TRI CHUOI CUNG UNG BAN LE CHONG LANG PHI]
echo DANG KHOI TAO CO SO DU LIEU retail_spoilage_db VAO SQL SERVER...
echo ==============================================================================

set SCRIPT_DIR=%~dp0
set SQL_FILE="%SCRIPT_DIR%retail_spoilage_database.sql"

REM Thu ket noi vao LocalDB truoc
sqlcmd -S "(localdb)\mssqllocaldb" -i %SQL_FILE%
IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ==============================================================================
    echo [THANH CONG] Da khoi tao CSDL vao (localdb)\mssqllocaldb thanh cong!
    echo ==============================================================================
    goto END
)

REM Neu may khong dung LocalDB, thu ket noi vao SQL Express mac dinh
echo Khong tim thay (localdb)\mssqllocaldb, dang thu ket noi .\SQLEXPRESS...
sqlcmd -S ".\SQLEXPRESS" -E -i %SQL_FILE%
IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ==============================================================================
    echo [THANH CONG] Da khoi tao CSDL vao .\SQLEXPRESS thanh cong!
    echo ==============================================================================
    goto END
)

REM Neu khong thanh cong, huong dan mo SSMS
echo.
echo ==============================================================================
echo [LUU Y] Neu chua cai sqlcmd, hay mo SQL Server Management Studio (SSMS):
echo 1. Nhan Ctrl + O trong SSMS
echo 2. Chon file: Database\retail_spoilage_database.sql
echo 3. Nhan F5 (Execute) de chay!
echo ==============================================================================

:END
pause
