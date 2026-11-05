@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Traval - import OpenStreetMap places
rem Tommy: one-click import of the OpenStreetMap place list (see docs/tommy-2026-10-25.md, section 8).
echo ======================================================================
echo   Traval - import OpenStreetMap places for all of Thailand
echo ======================================================================
echo.
where node.exe >/dev/null 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed.
    echo Install the LTS version from https://nodejs.org/ then run this file again.
    echo.
    pause
    exit /b 1
)
if not exist "scripts\osm\thailand-places.ndjson.gz" (
    echo [ERROR] Place file not found: scripts\osm\thailand-places.ndjson.gz
    echo.
    pause
    exit /b 1
)
echo Importing... (if the Traval server is running and this fails, close the server window and run this again)
echo.
node scripts\osm\import_osm_places.js "scripts\osm\thailand-places.ndjson.gz"
if errorlevel 1 (
    echo.
    echo [ERROR] Import failed. Make sure the Traval server is closed and try again.
    pause
    exit /b 1
)
echo.
echo Done. Start Traval with run.bat, open the Map and zoom in to a city.
echo.
pause
