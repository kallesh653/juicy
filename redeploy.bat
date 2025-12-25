@echo off
echo ========================================
echo   Juicy Billing - Quick Redeployment
echo ========================================
echo.

set VPS_IP=72.61.238.39

echo [1/4] Creating archive...
tar -czf juicy-update.tar.gz --exclude=node_modules --exclude=.git --exclude=*.log --exclude=backend.pid --exclude=mongod --exclude=*.bat --exclude=*.vbs --exclude=*.ico --exclude=*.jpeg backend frontend package.json
if errorlevel 1 (
    echo ERROR: Failed to create archive
    pause
    exit /b 1
)

echo [2/4] Uploading to VPS...
scp -o StrictHostKeyChecking=no juicy-update.tar.gz root@%VPS_IP%:/root/
if errorlevel 1 (
    echo ERROR: Failed to upload to VPS
    pause
    exit /b 1
)

echo [3/4] Deploying on VPS...
ssh -o StrictHostKeyChecking=no root@%VPS_IP% "cd /root/juicy && tar -xzf /root/juicy-update.tar.gz && rm /root/juicy-update.tar.gz && cd backend && npm install && pm2 restart juicy-backend && cd ../frontend && npm install && npm run build && cp -r dist/* /var/www/juicy/ && pm2 list"
if errorlevel 1 (
    echo ERROR: Deployment failed
    pause
    exit /b 1
)

echo [4/4] Cleaning up local archive...
del juicy-update.tar.gz

echo.
echo ========================================
echo   Deployment Completed Successfully!
echo ========================================
echo.
echo Frontend: https://juicy.gentime.in
echo Backend:  https://juicyapi.gentime.in
echo.
echo Press any key to check logs...
pause > nul

ssh -o StrictHostKeyChecking=no root@%VPS_IP% "pm2 logs juicy-backend --lines 30 --nostream"

pause
