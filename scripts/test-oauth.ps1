# OAuth Configuration Test Script
# Tests OAuth provider configuration and endpoints

param(
    [string]$BaseUrl = "http://localhost:50000"
)

Write-Host "OAuth Configuration Test" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

# Test 1: Check if server is running
Write-Host "[1/4] Testing server availability..." -ForegroundColor Green
try {
    $healthResponse = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method GET
    Write-Host "✅ Server is running" -ForegroundColor Green
    Write-Host "   Database: $($healthResponse.database)" -ForegroundColor Gray
    Write-Host "   Uptime: $($healthResponse.uptime)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Server is not running or not accessible" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Check OAuth providers
Write-Host "[2/4] Testing OAuth providers endpoint..." -ForegroundColor Green
try {
    $providersResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/providers" -Method GET
    Write-Host "✅ OAuth providers endpoint accessible" -ForegroundColor Green
    Write-Host "   Available providers:" -ForegroundColor Gray
    foreach ($provider in $providersResponse.providers) {
        Write-Host "   - $($provider.provider)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ OAuth providers endpoint failed" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check Google OAuth configuration
Write-Host "[3/4] Testing Google OAuth configuration..." -ForegroundColor Green
try {
    $googleLoginResponse = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login/google" -Method GET -MaximumRedirection 0 -ErrorAction SilentlyContinue
    if ($googleLoginResponse.StatusCode -eq 302) {
        $location = $googleLoginResponse.Headers.Location
        if ($location -like "*accounts.google.com*") {
            Write-Host "✅ Google OAuth redirect working" -ForegroundColor Green
            Write-Host "   Redirect URL: $location" -ForegroundColor Gray
        } else {
            Write-Host "⚠️  Unexpected redirect location" -ForegroundColor Yellow
            Write-Host "   Location: $location" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Google OAuth not properly configured" -ForegroundColor Red
        Write-Host "   Status: $($googleLoginResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Google OAuth configuration test failed" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 4: Environment variables check
Write-Host "[4/4] Checking environment variables..." -ForegroundColor Green
$envFile = Join-Path (Split-Path -Parent $PSScriptRoot) "server-backend\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $hasClientId = $envContent | Where-Object { $_ -like "*OAUTH_GOOGLE_CLIENT_ID*" -and $_ -notlike "*#*" }
    $hasClientSecret = $envContent | Where-Object { $_ -like "*OAUTH_GOOGLE_CLIENT_SECRET*" -and $_ -notlike "*#*" -and $_ -notlike "*YOUR_GOOGLE_CLIENT_SECRET_HERE*" }
    $hasAuthEnabled = $envContent | Where-Object { $_ -like "*AUTH_ENABLED=1*" -and $_ -notlike "*#*" }
    
    if ($hasClientId) {
        Write-Host "✅ OAUTH_GOOGLE_CLIENT_ID is set" -ForegroundColor Green
    } else {
        Write-Host "❌ OAUTH_GOOGLE_CLIENT_ID is missing" -ForegroundColor Red
    }
    
    if ($hasClientSecret) {
        Write-Host "✅ OAUTH_GOOGLE_CLIENT_SECRET is set" -ForegroundColor Green
    } else {
        Write-Host "⚠️  OAUTH_GOOGLE_CLIENT_SECRET needs to be configured" -ForegroundColor Yellow
    }
    
    if ($hasAuthEnabled) {
        Write-Host "✅ AUTH_ENABLED is set to 1" -ForegroundColor Green
    } else {
        Write-Host "⚠️  AUTH_ENABLED should be set to 1" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env file not found at $envFile" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "OAuth Test Complete" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure OAUTH_GOOGLE_CLIENT_SECRET in .env file" -ForegroundColor Gray
Write-Host "2. Set up Authorized JavaScript origins in Google Cloud Console:" -ForegroundColor Gray
Write-Host "   - http://localhost:50000" -ForegroundColor Gray
Write-Host "   - http://localhost:5500" -ForegroundColor Gray
Write-Host "3. Add Authorized redirect URIs:" -ForegroundColor Gray
Write-Host "   - http://localhost:50000/api/auth/callback/google" -ForegroundColor Gray
Write-Host "4. Test OAuth login in frontend: http://localhost:5500" -ForegroundColor Gray

Read-Host "`nPress Enter to exit"