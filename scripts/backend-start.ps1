# Community Backend Server PowerShell Script
# Purpose: Backend server execution (for PowerShell environment)
# Usage: .\backend-start.ps1 [-ReadOnly] [-Port port_number] [-RedisUrl URL]

param(
    [switch]$ReadOnly,
    [int]$Port = 50000,
    [string]$RedisUrl = "",
    [switch]$NoBrowser,
    [switch]$JsonLog
)

# Set root directory based on script location
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir "server-backend"

Write-Host "===============================" -ForegroundColor Cyan
Write-Host "Community Backend Server" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "Port: $Port"
Write-Host "Mode: $(if ($ReadOnly) { 'Read Only' } else { 'Read/Write' })"
Write-Host "Directory: $BackendDir"
if ($RedisUrl) { Write-Host "Redis: $RedisUrl" }
else { Write-Host "Redis: In-memory mode" }
Write-Host "===============================" -ForegroundColor Cyan

# Check and terminate existing processes
Write-Host "[INFO] Checking processes using port $Port..." -ForegroundColor Yellow
try {
    $existingProcesses = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($existingProcesses) {
        foreach ($connection in $existingProcesses) {
            $processId = $connection.OwningProcess
            Write-Host "[INFO] Found existing process (PID: $processId), terminating..." -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
    } else {
        Write-Host "[INFO] No process using port $Port" -ForegroundColor Green
    }
} catch {
    Write-Host "[WARNING] Error checking processes: $_" -ForegroundColor Yellow
}

# Check backend directory exists
if (-not (Test-Path $BackendDir)) {
    Write-Error "Backend directory not found: $BackendDir"
    Read-Host "Press Enter to exit"
    exit 1
}

# Set directory
Set-Location $BackendDir

# Set environment variables
$env:PORT = $Port
$env:TZ = "Asia/Seoul"  # Korean timezone
if ($ReadOnly) { $env:READONLY = "1" }
if ($RedisUrl) { $env:REDIS_URL = $RedisUrl }
if ($JsonLog) { $env:LOG_JSON = "1" }

Write-Host "[INFO] Starting backend server..." -ForegroundColor Green

try {
    # Run Node.js server
    node src/index.js
}
catch {
    Write-Error "Failed to start server: $_"
    Read-Host "Press Enter to exit"
    exit 1
}

# Open browser (optional)
if (-not $NoBrowser) {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:$Port/api/health"
}

Read-Host "Press Enter to exit"