@echo off
title ColdDrink Billing - Installation
color 0B

echo.
echo ========================================
echo   ColdDrink Billing System Installer
echo ========================================
echo.

:: Check Node.js
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo       ERROR: Node.js not found!
    echo       Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo       Node.js OK

:: Check MongoDB
echo [2/5] Checking MongoDB...
mongod --version >nul 2>&1
if errorlevel 1 (
    echo       WARNING: MongoDB not found in PATH
    echo       Please install MongoDB Community Server
    echo       Download: https://www.mongodb.com/try/download/community
    pause
)
echo       MongoDB OK

:: Create MongoDB data directory
echo [3/5] Creating MongoDB data directory...
if not exist "%USERPROFILE%\mongodb-data" mkdir "%USERPROFILE%\mongodb-data"
echo       Directory created

:: Install Backend Dependencies
echo [4/5] Installing Backend dependencies...
cd /d "%~dp0backend"
call npm install
if errorlevel 1 (
    echo       ERROR: Backend installation failed!
    pause
    exit /b 1
)
echo       Backend dependencies installed

:: Install Frontend Dependencies
echo [5/5] Installing Frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (
    echo       ERROR: Frontend installation failed!
    pause
    exit /b 1
)
echo       Frontend dependencies installed

:: Install Root Dependencies (for Electron)
cd /d "%~dp0"
call npm install
echo       Root dependencies installed

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo   Next Steps:
echo   1. Run START.bat to launch the application
echo   2. Or run "npm run electron:dev" for desktop app
echo.
echo   First Time Setup:
echo   Run "npm run seed" to create default users
echo.

pause
