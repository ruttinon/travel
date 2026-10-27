@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Traval v2.7 - Full Stack Platform

cls
echo ======================================================================
echo             🌏 TRAVAL (UNFOLD TRAVEL) v2.7 - ALL-IN-ONE
echo ======================================================================
echo.
echo [1/3] ตรวจสอบ Node.js Runtime...
where node.exe >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] ไม่พบ Node.js ในเครื่องของคุณ!
    echo กรุณาดาวน์โหลดและติดตั้ง Node.js จาก https://nodejs.org/
    echo เมื่อติดตั้งเสร็จแล้ว ให้ดับเบิ้ลคลิกไฟล์นี้ใหม่อีกครั้ง
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo       -> พบ Node.js: %NODE_VER% (พร้อมใช้งาน)

echo.
echo [2/3] บริการที่พร้อมทำงาน:
echo       * 🗺️  Traveler App:       http://127.0.0.1:5173/
echo       * 🧭 AI Planner:          http://127.0.0.1:5173/planner.html
echo       * 🏪 Business Portal:     http://127.0.0.1:5173/business.html
echo       * 📊 Admin Studio:        http://127.0.0.1:5173/admin.html
echo       * 🧪 Map Comparison POC:  http://127.0.0.1:5173/google-maps-poc.html
echo.
echo [3/3] กำลังเริ่มเซิร์ฟเวอร์ที่ http://127.0.0.1:5173/ ...
echo       (ระบบจะเปิดเว็บบราวเซอร์ให้อัตโนมัติ)
echo.
echo ======================================================================
echo   กด Ctrl + C ในหน้าต่างนี้เพื่อหยุดการทำงาน
echo ======================================================================
echo.

node backend/server.js
if errorlevel 1 (
    echo.
    echo [ERROR] ไม่สามารถเริ่มการทำงานของเซิร์ฟเวอร์ได้
    pause
)
