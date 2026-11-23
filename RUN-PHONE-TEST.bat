@echo off
chcp 65001 >nul
cd /d "%~dp0"
title GoAround - Phone test (same Wi-Fi)
rem Tommy (2026-11-23): start the server so phones on the SAME home Wi-Fi can open it.
rem Only private addresses (192.168.x.x / 10.x.x.x) are accepted. Admin still works only on this computer.
rem Google sign-in does not work on these addresses - use email + password on the phone.
cls
echo ======================================================================
echo   GoAround - ทดสอบบนมือถือ (มือถือต้องต่อ Wi-Fi เดียวกับคอมเครื่องนี้)
echo ======================================================================
echo.
echo  1. ถ้า Windows ถามเรื่อง Firewall ให้กด "Allow" (เลือก Private networks)
echo  2. ดูที่อยู่ [PHONE TEST] ด้านล่าง แล้วพิมพ์ในเบราว์เซอร์ของมือถือ
echo  3. ใช้ Wi-Fi ที่บ้านเท่านั้น ห้ามเปิดแบบนี้ใน Wi-Fi สาธารณะ
echo  4. กด Ctrl + C เพื่อหยุด
echo.
set TRAVAL_LAN_TEST=1
node backend/server.js
if errorlevel 1 (
    echo.
    echo [ERROR] เริ่มเซิร์ฟเวอร์ไม่ได้ - ปิดหน้าต่าง run.bat อื่นก่อน แล้วลองใหม่
    pause
)
