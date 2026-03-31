Write-Host "Stopping dev server and cleaning cache..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
Write-Host "Cache cleared. Starting fresh dev server..." -ForegroundColor Green
npm run dev
