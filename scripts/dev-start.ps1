# Community Full Stack Development PowerShell Script
# Purpose: Frontend + Backend concurrent execution (for PowerShell environment)
# Usage: .\dev-start.ps1 [-BackendOnly] [-FrontendOnly] [-ReadOnly] [-NoBrowser] [-WindowStyle style]

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$ReadOnly,
    [switch]$NoBrowser,
    [int]$BackendPort = 50000,
    [int]$FrontendPort = 5173,
    [ValidateSet("Normal", "Minimized", "Maximized", "Hidden")]
    [string]$WindowStyle = "Normal",
    [switch]$SameWindow,
    [switch]$NoNewWindows
)

# Set root directory based on script location
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Service start flag setup
$StartBackend = $true
$StartFrontend = $true

if ($BackendOnly) { $StartFrontend = $false }
if ($FrontendOnly) { $StartBackend = $false }

Write-Host "===============================" -ForegroundColor Cyan
Write-Host "Community Full Stack Development" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
if ($StartBackend) { Write-Host "Backend: Port $BackendPort" }
if ($StartFrontend) { Write-Host "Frontend: Port $FrontendPort" }
if ($ReadOnly) { Write-Host "Mode: Read Only" }
if ($SameWindow) { Write-Host "Window: Execute in same window" }
elseif ($NoNewWindows) { Write-Host "Window: Execute in background without new windows" }
else { Write-Host "Window: Execute in new window ($WindowStyle)" }
Write-Host "===============================" -ForegroundColor Cyan

# Start backend
if ($StartBackend) {
    Write-Host "[INFO] Starting backend server..." -ForegroundColor Green
    
    $BackendArgs = @()
    if ($ReadOnly) { $BackendArgs += "-ReadOnly" }
    if ($NoBrowser) { $BackendArgs += "-NoBrowser" }
    $BackendArgs += "-Port", $BackendPort
    
    # Set timezone for Korean time display
    $env:TZ = "Asia/Seoul"
    
    if ($SameWindow -or $NoNewWindows) {
        # Execute in same window or background execution
        $BackendScript = Join-Path $ScriptDir "backend-start.ps1"
        if ($NoNewWindows) {
            # Execute as background Job
            $BackendJob = Start-Job -ScriptBlock {
                param($Script, $Port, $ReadOnly, $NoBrowser)
                $Args = @("-Port", $Port)
                if ($ReadOnly) { $Args += "-ReadOnly" }
                if ($NoBrowser) { $Args += "-NoBrowser" }
                & powershell -ExecutionPolicy Bypass -File $Script @Args
            } -ArgumentList $BackendScript, $BackendPort, $ReadOnly, $NoBrowser
            Write-Host "[INFO] Backend Job ID: $($BackendJob.Id)" -ForegroundColor Yellow
        } else {
            # Execute in same window (blocking)
            & powershell -ExecutionPolicy Bypass -File $BackendScript @BackendArgs
            return
        }
    } else {
        # Execute in new window
        $ProcessArgs = @(
            "-NoExit", 
            "-ExecutionPolicy", "Bypass",
            "-File", (Join-Path $ScriptDir "backend-start.ps1")
        )
        $ProcessArgs += $BackendArgs
        Start-Process -FilePath "powershell.exe" -ArgumentList $ProcessArgs -WindowStyle $WindowStyle
    }
    
    Start-Sleep -Seconds 3
}

# Start frontend
if ($StartFrontend) {
    Write-Host "[INFO] Starting frontend server..." -ForegroundColor Green
    
    if ($SameWindow -or $NoNewWindows) {
        # Execute in same window or background execution
        $FrontendScript = Join-Path $ScriptDir "frontend-start.ps1"
        if ($NoNewWindows) {
            # Execute as background Job
            $FrontendJob = Start-Job -ScriptBlock {
                param($Script, $Port)
                & powershell -ExecutionPolicy Bypass -File $Script -Port $Port
            } -ArgumentList $FrontendScript, $FrontendPort
            Write-Host "[INFO] Frontend Job ID: $($FrontendJob.Id)" -ForegroundColor Yellow
        } else {
            # Execute in same window (blocking)
            & powershell -ExecutionPolicy Bypass -File $FrontendScript -Port $FrontendPort
            return
        }
    } else {
        # Execute in new window
        Start-Process -FilePath "powershell.exe" -ArgumentList @(
            "-NoExit",
            "-ExecutionPolicy", "Bypass",
            "-File", (Join-Path $ScriptDir "frontend-start.ps1"),
            "-Port", $FrontendPort
        ) -WindowStyle $WindowStyle
    }
    
    Start-Sleep -Seconds 2
}

# Open browser (if frontend is enabled)
if ($StartFrontend -and -not $NoBrowser) {
    Write-Host "[INFO] Opening development environment in browser..." -ForegroundColor Green
    Start-Process "http://localhost:$FrontendPort"
}

Write-Host "===============================" -ForegroundColor Green
Write-Host "Development environment is ready!" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
if ($StartBackend) { Write-Host "Backend API: http://localhost:$BackendPort/api/health" }
if ($StartFrontend) { Write-Host "Frontend: http://localhost:$FrontendPort" }
Write-Host "===============================" -ForegroundColor Green

# Job management guide
if ($NoNewWindows -and (Get-Variable -Name "BackendJob" -ErrorAction SilentlyContinue) -or (Get-Variable -Name "FrontendJob" -ErrorAction SilentlyContinue)) {
    Write-Host "`nBackground Job Management:" -ForegroundColor Cyan
    if (Get-Variable -Name "BackendJob" -ErrorAction SilentlyContinue) {
        Write-Host "  Backend Job ID: $($BackendJob.Id)" -ForegroundColor Yellow
    }
    if (Get-Variable -Name "FrontendJob" -ErrorAction SilentlyContinue) {
        Write-Host "  Frontend Job ID: $($FrontendJob.Id)" -ForegroundColor Yellow
    }
    Write-Host "`n  Job status check: Get-Job" -ForegroundColor Gray
    Write-Host "  Job output check: Receive-Job -Id <JobID>" -ForegroundColor Gray
    Write-Host "  Job stop: Stop-Job -Id <JobID>; Remove-Job -Id <JobID>" -ForegroundColor Gray
    Write-Host "  Stop all Jobs: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Gray
}

Read-Host "`nPress Enter to exit"