$ErrorActionPreference = 'Stop'

Write-Host "Starting Child Vaccination Management (backend + frontend)..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root 'server'

# Backend: install (if needed), migrate, start
Push-Location $backend
if (!(Test-Path 'node_modules')) {
  Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
  npm install | Write-Output
}
Write-Host "Running DB migrations..." -ForegroundColor Yellow
npm run migrate | Write-Output
Write-Host "Starting backend on http://localhost:8080" -ForegroundColor Green
Start-Process powershell -WorkingDirectory $backend -ArgumentList '-NoExit','-Command','npm run start'
Pop-Location

# Frontend: serve current directory on port 3000
Write-Host "Starting frontend on http://localhost:3000" -ForegroundColor Green
# Use non-interactive npx to avoid install prompts
Start-Process powershell -WorkingDirectory $root -ArgumentList '-NoExit','-Command','npx --yes serve@14.2.5 . --listen 3000'

Start-Sleep -Seconds 3
Start-Process 'http://localhost:3000'

Write-Host "Done. Frontend served at http://localhost:3000 (Settings → set API Base URL to http://localhost:8080)." -ForegroundColor Cyan


