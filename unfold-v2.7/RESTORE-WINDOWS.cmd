@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 (
 echo Node.js 24 LTS required.
 pause
 exit /b 1
)
echo =====================================================
echo  UNFOLD RESTORE - CHECK BACKUP FIRST (DRY RUN)
echo =====================================================
echo Close unfold server before any restore.
echo Never select your live data folder.
set /p BACKUP_PATH=Paste the full path to your backup folder: 
if "%BACKUP_PATH%"=="" exit /b 1
node restore.js "%BACKUP_PATH%"
if errorlevel 1 (
 echo Validation failed - no changes made.
 pause
 exit /b 1
)
echo.
set /p ANSWER=Restore verified backup now? Type RESTORE to continue: 
if not "%ANSWER%"=="RESTORE" (
 echo Cancelled. Live data not changed.
 pause
 exit /b 0
)
node restore.js "%BACKUP_PATH%" --apply
pause
