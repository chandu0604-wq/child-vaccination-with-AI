@echo off
echo Starting Child Vaccination Management System...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0server && node server.js"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0 && npx serve . --listen 3000"

echo Waiting for frontend to start...
timeout /t 3 /nobreak > nul

echo Opening application in browser...
start http://localhost:3000

echo.
echo ========================================
echo Application is now running!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8080
echo ========================================
echo.
echo Press any key to exit...
pause > nul
