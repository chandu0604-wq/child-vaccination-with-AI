@echo off
title Child Vaccination Management
color 0A

echo.
echo ========================================
echo   Child Vaccination Management System
echo ========================================
echo.

echo [1/4] Stopping any existing servers...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/4] Starting Backend Server (Port 8080)...
start "Backend Server" cmd /k "cd /d %~dp0server && echo Backend Server Starting... && node server.js"

echo [3/4] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo [4/4] Starting Frontend Server (Port 3000)...
start "Frontend Server" cmd /k "cd /d %~dp0 && echo Frontend Server Starting... && npx serve . --listen 3000"

echo.
echo Waiting for frontend to start...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   Application is now running!
echo ========================================
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8080
echo ========================================
echo.

echo Opening application in your default browser...
start http://localhost:3000

echo.
echo Press any key to close this window...
pause >nul

