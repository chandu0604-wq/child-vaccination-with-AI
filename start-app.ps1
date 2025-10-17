# Child Vaccination Management System Launcher
$Host.UI.RawUI.WindowTitle = "Child Vaccination Management"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Child Vaccination Management System" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Stopping any existing servers..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "[2/4] Starting Backend Server (Port 8080)..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "server"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$backendPath'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; node server.js"

Write-Host "[3/4] Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "[4/4] Starting Frontend Server (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$PSScriptRoot'; Write-Host 'Frontend Server Starting...' -ForegroundColor Green; npx serve . --listen 3000"

Write-Host ""
Write-Host "Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Application is now running!" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8080" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Opening application in your default browser..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

