Param(
    [int]$Port = 50000,
    [switch]$Mock,
    [switch]$Foreground
)

# Move to server-backend root
Set-Location "$PSScriptRoot\.." | Out-Null

# Kill any process listening on the port (avoid using $PID reserved variable name)
try {
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            try { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } catch {}
            if (Get-Process -Id $procId -ErrorAction SilentlyContinue) {
                # Fallback to taskkill if still alive
                cmd /c "taskkill /PID $procId /F >NUL 2>&1"
            }
        }
        Start-Sleep -Milliseconds 600
        # Wait (short) until port freed
        $waitMs = 0
        while ($waitMs -lt 4000) {
            $still = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
            if (-not $still) { break }
            Start-Sleep -Milliseconds 300
            $waitMs += 300
        }
        $remain = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($remain) { Write-Warning "Port ${Port} still in LISTEN state after kill attempts" } else { Write-Host "Killed processes on port ${Port}: $($pids -join ',')" }
    } else {
        Write-Host "No listener on port $Port"
    }
} catch {
    Write-Warning "Failed to query/kill by port: $($_.Exception.Message)"
}

# Optional mock env
if ($Mock.IsPresent) { $env:ENV_ALLOW_MOCK = '1' }

# Start server (uses .env inside server-backend)
if ($Foreground.IsPresent) {
    Write-Host "Starting server in foreground (Ctrl+C to stop)"
    node src/index.js
} else {
    Write-Host "Starting server in background"
    $proc = Start-Process -FilePath "node" -ArgumentList "src/index.js" -PassThru
    Start-Sleep -Seconds 1
    try {
        $listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($listening) { Write-Host "Server listening on ${Port} (PID $($proc.Id))" }
        else { Write-Warning "Process started (PID $($proc.Id)) but port ${Port} not yet in LISTEN state" }
    } catch {}
}
