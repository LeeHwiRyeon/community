# Production Deployment Script
# This script deploys the Community Hub application to production

param(
    [string]$Environment = "production",
    [switch]$SkipBackup,
    [switch]$SkipTests,
    [switch]$Force
)

Write-Host "🚀 Starting Community Hub Production Deployment" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Check if running as administrator
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Blue

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose is not installed" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "docker-compose.production.yml")) {
    Write-Host "❌ Production Docker Compose file not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Backup existing data
if (-not $SkipBackup) {
    Write-Host "💾 Creating backup..." -ForegroundColor Blue
    
    $backupDir = "backups/$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    # Backup database
    Write-Host "Backing up database..." -ForegroundColor Yellow
    docker exec community-mysql mysqldump -u root -p$env:DB_ROOT_PASSWORD community_hub > "$backupDir/database.sql"
    
    # Backup uploads
    Write-Host "Backing up uploads..." -ForegroundColor Yellow
    if (Test-Path "uploads") {
        Copy-Item -Path "uploads" -Destination "$backupDir/uploads" -Recurse
    }
    
    # Backup configuration
    Write-Host "Backing up configuration..." -ForegroundColor Yellow
    Copy-Item -Path "server-backend/.env" -Destination "$backupDir/.env" -ErrorAction SilentlyContinue
    Copy-Item -Path "nginx.conf" -Destination "$backupDir/nginx.conf" -ErrorAction SilentlyContinue
    
    Write-Host "✅ Backup created: $backupDir" -ForegroundColor Green
}

# Run tests
if (-not $SkipTests) {
    Write-Host "🧪 Running tests..." -ForegroundColor Blue
    
    # Frontend tests
    Write-Host "Running frontend tests..." -ForegroundColor Yellow
    Set-Location frontend
    npm test -- --coverage --watchAll=false
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend tests failed" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
    
    # Backend tests
    Write-Host "Running backend tests..." -ForegroundColor Yellow
    Set-Location server-backend
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend tests failed" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
    
    Write-Host "✅ All tests passed" -ForegroundColor Green
}

# Build application
Write-Host "🔨 Building application..." -ForegroundColor Blue

# Build frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Build Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -f Dockerfile.production -t community-hub:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Application built successfully" -ForegroundColor Green

# Stop existing services
Write-Host "🛑 Stopping existing services..." -ForegroundColor Blue
docker-compose -f docker-compose.production.yml down

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Blue
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Blue
Start-Sleep -Seconds 30

# Health check
Write-Host "🏥 Performing health check..." -ForegroundColor Blue

$maxRetries = 10
$retryCount = 0

do {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost/api/health" -Method GET -TimeoutSec 10
        if ($response.status -eq "healthy") {
            Write-Host "✅ Health check passed" -ForegroundColor Green
            break
        }
    }
    catch {
        Write-Host "Health check attempt $($retryCount + 1) failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    $retryCount++
    if ($retryCount -lt $maxRetries) {
        Start-Sleep -Seconds 10
    }
} while ($retryCount -lt $maxRetries)

if ($retryCount -eq $maxRetries) {
    Write-Host "❌ Health check failed after $maxRetries attempts" -ForegroundColor Red
    Write-Host "Checking service logs..." -ForegroundColor Yellow
    
    # Show service logs
    docker-compose -f docker-compose.production.yml logs --tail=50
    
    exit 1
}

# Performance test
Write-Host "⚡ Running performance test..." -ForegroundColor Blue
try {
    $perfResponse = Invoke-RestMethod -Uri "http://localhost/api/metrics" -Method GET -TimeoutSec 10
    Write-Host "✅ Performance test passed" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Performance test failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Show deployment summary
Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "Application URL: http://localhost" -ForegroundColor White
Write-Host "API URL: http://localhost/api" -ForegroundColor White
Write-Host "Monitoring: http://localhost:3000 (Grafana)" -ForegroundColor White
Write-Host "Metrics: http://localhost:9090 (Prometheus)" -ForegroundColor White

# Show service status
Write-Host "`n📊 Service Status:" -ForegroundColor Blue
docker-compose -f docker-compose.production.yml ps

# Show resource usage
Write-Host "`n💻 Resource Usage:" -ForegroundColor Blue
docker stats --no-stream

Write-Host "`n✅ Production deployment completed!" -ForegroundColor Green
