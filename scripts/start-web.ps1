Set-Location $PSScriptRoot\..

$envFile = "apps\web\.env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "Missing apps/web/.env.local — run scripts\setup.ps1 first" -ForegroundColor Red
    exit 1
}

$content = Get-Content $envFile -Raw
if ($content -match "your-project|your-anon-key") {
    Write-Host "WARNING: apps/web/.env.local still has placeholder values." -ForegroundColor Yellow
    Write-Host "Add your Supabase URL and anon key before signing in." -ForegroundColor Yellow
}

Write-Host "Starting web app at http://localhost:3000 ..." -ForegroundColor Cyan
npm run web
