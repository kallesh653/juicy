@echo off
title ColdDrink Billing System
color 0A

echo.
echo ========================================
echo   ColdDrink Billing System Launcher
echo ========================================
echo.

:: Check if MongoDB is running
echo [1/4] Checking MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo       MongoDB is running
) else (
    echo       Starting MongoDB...
    start "MongoDB" /min mongod --dbpath "%USERPROFILE%\mongodb-data"
    timeout /t 3 /nobreak >nul
)

:: Start Backend
echo [2/4] Starting Backend Server...
cd /d "%~dp0backend"
start "Backend Server" /min cmd /c "npm start"

:: Wait for backend
echo [3/4] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

:: Start Frontend
echo [4/4] Starting Frontend...
cd /d "%~dp0frontend"
start "Frontend" cmd /c "npm run dev"

echo.
echo ========================================
echo   Application Started Successfully!
echo ========================================
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo.
echo   Default Login:
echo   Admin - admin / admin123
echo   User  - cashier / cashier123
echo.
echo   Access from Mobile/Tablet:
echo   Use your computer's IP address
echo   Example: http://192.168.1.100:3000
echo.
echo ========================================
echo.

pause
