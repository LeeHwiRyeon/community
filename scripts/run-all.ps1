# Community Full Stack Development Server
Write-Host "Starting Community Full Stack Application..." -ForegroundColor Green
Write-Host ""

# Start Backend Server
Write-Host "Starting Backend Server (Port 50000)..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location "server-backend"
    node mock-server.js
} -Name "BackendServer"

# Start Frontend Server
Write-Host "Starting Frontend Server (Port 5000)..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "frontend"
    npm run dev
} -Name "FrontendServer"

# Wait for servers to start
Write-Host "Waiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if servers are running
$backendHealthy = $false
$frontendHealthy = $false

try {
    $response = Invoke-WebRequest -Uri "http://localhost:50000/api/health" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $backendHealthy = $true
    }
}
catch {
    Write-Host "Backend server not ready yet" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $frontendHealthy = $true
    }
}
catch {
    Write-Host "Frontend server not ready yet" -ForegroundColor Red
}

Write-Host ""
Write-Host "Servers status:" -ForegroundColor Green
Write-Host "Backend: http://localhost:50000 - $(if ($backendHealthy) { "Running" } else { "Starting..." })" -ForegroundColor $(if ($backendHealthy) { "Green" } else { "Yellow" })
Write-Host "Frontend: http://localhost:5000 - $(if ($frontendHealthy) { "Running" } else { "Starting..." })" -ForegroundColor $(if ($frontendHealthy) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers..." -ForegroundColor Yellow

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Red
    Stop-Job -Name "BackendServer" -ErrorAction SilentlyContinue
    Stop-Job -Name "FrontendServer" -ErrorAction SilentlyContinue
    Remove-Job -Name "BackendServer" -ErrorAction SilentlyContinue
    Remove-Job -Name "FrontendServer" -ErrorAction SilentlyContinue
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "All servers stopped." -ForegroundColor Green
}