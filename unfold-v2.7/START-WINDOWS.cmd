@echo off
setlocal
cd /d "%~dp0"
title unfold v2.7 - App and Admin Server
echo.
echo ===============================================
echo         unfold Travel App  v2.7
echo ===============================================
echo.
where node.exe >nul 2>nul
if errorlevel 1 (
 echo [ERROR] Node.js is required for the new database and Admin Studio.
 echo Please install Node.js 24 LTS from https://nodejs.org/
 echo Then double-click START-WINDOWS.cmd again.
 echo.
 pause
 exit /b 1
)
echo Node.js version:
node --version
echo.
echo Starting the local application and database...
echo The browser should open automatically.
echo Keep this window open while using unfold.
echo.
node server.js
if errorlevel 1 (
 echo.
 echo [ERROR] Could not start unfold. Please copy the error above.
 pause
)
