@echo off
title ColdDrink Billing System
color 0A

echo.
echo   ╔═══════════════════════════════════════════╗
echo   ║     ColdDrink Billing System              ║
echo   ║     Starting... Please wait               ║
echo   ╚═══════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: Start Backend (with embedded MongoDB)
echo   Starting server...
cd backend
start /min cmd /c "node server.js"

:: Wait for server
timeout /t 8 /nobreak >nul

:: Start Frontend
echo   Starting application...
cd ..\frontend
start /min cmd /c "npm run dev"

:: Wait and open browser
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo   ╔═══════════════════════════════════════════╗
echo   ║   Application is running!                 ║
echo   ║                                           ║
echo   ║   Open: http://localhost:3000             ║
echo   ║                                           ║
echo   ║   Login: admin / admin123                 ║
echo   ║                                           ║
echo   ║   Close this window to stop.              ║
echo   ╚═══════════════════════════════════════════╝
echo.

pause
taskkill /f /im node.exe >nul 2>&1
