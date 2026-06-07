# Test Supabase signup after running supabase/fix-auth.sql
Set-Location $PSScriptRoot\..

$envFile = "apps\web\.env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: apps/web/.env.local not found" -ForegroundColor Red
    exit 1
}

$url = (Select-String -Path $envFile -Pattern '^NEXT_PUBLIC_SUPABASE_URL=(.+)$').Matches.Groups[1].Value.Trim()
$key = (Select-String -Path $envFile -Pattern '^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$').Matches.Groups[1].Value.Trim()

if (-not $url -or -not $key) {
    Write-Host "ERROR: Supabase URL/key missing in apps/web/.env.local" -ForegroundColor Red
    exit 1
}

$email = "test-$(Get-Random)@example.com"
$body = @{ email = $email; password = "testpass123" } | ConvertTo-Json
$headers = @{
    apikey        = $key
    Authorization = "Bearer $key"
    "Content-Type" = "application/json"
}

Write-Host "Testing signup with $email ..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$url/auth/v1/signup" -Method POST -Headers $headers -Body $body -UseBasicParsing
    Write-Host "SUCCESS: Signup works (HTTP $($response.StatusCode))" -ForegroundColor Green
    Write-Host "You can now sign up in the app at http://localhost:3000/signup"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $detail = $reader.ReadToEnd()
    Write-Host "FAILED: HTTP $status" -ForegroundColor Red
    Write-Host $detail
    if ($detail -match "Database error saving new user") {
        Write-Host "`nRun supabase/fix-auth.sql in Supabase Dashboard -> SQL Editor" -ForegroundColor Yellow
    }
}
