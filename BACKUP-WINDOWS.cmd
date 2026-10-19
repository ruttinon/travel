@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 (
 echo Please install Node.js 24 LTS from https://nodejs.org/
 pause
 exit /b 1
)
node backup.js
pause
