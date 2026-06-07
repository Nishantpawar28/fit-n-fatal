# Fit N Fatal - First-time setup script
Set-Location $PSScriptRoot\..

Write-Host "=== Fit N Fatal Setup ===" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found. Install from https://nodejs.org (v18+)" -ForegroundColor Red
    exit 1
}

Write-Host "Node: $(node -v)" -ForegroundColor Gray
Write-Host "npm:  $(npm -v)" -ForegroundColor Gray

Write-Host "`nInstalling dependencies (may take a few minutes)..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host "`nCreating mobile assets..." -ForegroundColor Cyan
node scripts/create-mobile-assets.js

if (-not (Test-Path "apps\mobile\.env")) {
    Copy-Item "apps\mobile\.env.example" "apps\mobile\.env"
    Write-Host "Created apps/mobile/.env" -ForegroundColor Yellow
}

if (-not (Test-Path "apps\web\.env.local")) {
    Copy-Item "apps\web\.env.example" "apps\web\.env.local"
    Write-Host "Created apps/web/.env.local" -ForegroundColor Yellow
}

# Check if env files still have placeholders
$mobileEnv = Get-Content "apps\mobile\.env" -Raw -ErrorAction SilentlyContinue
$webEnv = Get-Content "apps\web\.env.local" -Raw -ErrorAction SilentlyContinue
$needsKeys = ($mobileEnv -match "your-project") -or ($webEnv -match "your-project")

Write-Host "`n=== Setup complete ===" -ForegroundColor Green

if ($needsKeys) {
    Write-Host "`nACTION REQUIRED: Add your Supabase keys to:" -ForegroundColor Yellow
    Write-Host "  apps/mobile/.env"
    Write-Host "  apps/web/.env.local"
    Write-Host "`nGet keys from: Supabase Dashboard -> Project Settings -> API"
    Write-Host "  - Project URL"
    Write-Host "  - anon public key"
} else {
    Write-Host "`nSupabase keys detected in .env files." -ForegroundColor Green
}

Write-Host "`nStart the apps:" -ForegroundColor Cyan
Write-Host "  npm run web       # Web dashboard at http://localhost:3000"
Write-Host "  npm run mobile    # Expo app (scan QR with Expo Go)"
