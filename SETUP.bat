@echo off
echo ========================================
echo  Cold Drink Shop Billing System Setup
echo ========================================
echo.

echo [1/4] Installing Backend Dependencies...
cd backend
call npm install
echo.

echo [2/4] Installing Frontend Dependencies...
cd ..\frontend
call npm install
echo.

echo [3/4] Setting up Admin User...
cd ..\backend
call npm run seed
echo.

echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Make sure MongoDB is running
echo 2. Start Backend:  cd backend  and  npm run dev
echo 3. Start Frontend: cd frontend and  npm run dev
echo 4. Open http://localhost:3000
echo 5. Login with:
echo    Username: admin
echo    Password: admin123
echo.
pause
