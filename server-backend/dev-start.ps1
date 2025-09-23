# PowerShell helper to start backend deterministically at port 50000 with +1 fallback
# Usage: ./dev-start.ps1  (optional args ignored)
# Kills existing process on base port if possible, then starts server and streams output.

param(
    [int]$BasePort = 50000,
    [int]$MaxAttempts = 20
)

Write-Host "[dev-start] base port = $BasePort" -ForegroundColor Cyan

function Stop-Port($port) {
    try {
        $pids = (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue) | Sort-Object -Unique
        if ($pids) {
            foreach ($p in $pids) {
                try { Write-Host "[dev-start] Stopping PID $p on port $port" -ForegroundColor Yellow; Stop-Process -Id $p -Force -ErrorAction SilentlyContinue } catch {}
            }
            Start-Sleep -Milliseconds 300
        }
    } catch { }
}

Stop-Port -port $BasePort

# Export common dev env vars here if needed (edit as required)
# $env:ENABLE_TEST_GOOGLE = "1"
# $env:LOG_JSON = "1"

$env:PORT = $BasePort

Write-Host "[dev-start] launching backend (attempt up to $MaxAttempts)" -ForegroundColor Cyan

# Use node directly so auto-increment fallback inside server.js takes effect if base occupied
node ./src/index.js
