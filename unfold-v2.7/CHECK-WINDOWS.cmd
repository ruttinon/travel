@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 (
 echo [FAIL] Install Node.js 24 LTS first.
 pause
 exit /b 1
)
node doctor.js
if errorlevel 1 (
 echo Readiness check failed. Save this output for diagnostics.
) else (
 echo Local database checks passed. This does not mean production is ready.
)
pause
