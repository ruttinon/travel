@echo off
chcp 65001 >nul
title Unfold Traval - Reset Admin Password
cls
echo ========================================================================
echo   UNFOLD / TRAVAL - ตั้งค่าหรือรีเซ็ตรหัสผ่านแอดมิน (Admin Reset)
echo ========================================================================
echo.
node "%~dp0reset-admin.js" %*
echo.
echo กดปุ่มใดก็ได้เพื่อปิดหน้าต่างนี้...
pause >nul
