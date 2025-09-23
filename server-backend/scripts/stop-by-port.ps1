Param(
    [Parameter(Mandatory=$true)][int]$Port
)
try {
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $pids) {
            try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {}
        }
    Write-Host "Killed processes on port ${Port}: $($pids -join ',')"
    } else {
        Write-Host "No listener on port $Port"
    }
} catch {
    Write-Warning "Failed to kill processes by port ${Port}: $($_.Exception.Message)"
}