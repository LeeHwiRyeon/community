# 성능 모니터링 스크립트
Write-Host "📊 커뮤니티 서버 성능 모니터링" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Cyan

# CPU 및 메모리 사용량 확인
Write-Host "`n💻 시스템 리소스 사용량:" -ForegroundColor Yellow
$cpu = Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average
$memory = Get-WmiObject -Class Win32_OperatingSystem
$totalMemory = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
$freeMemory = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
$usedMemory = $totalMemory - $freeMemory
$memoryPercent = [math]::Round(($usedMemory / $totalMemory) * 100, 2)

Write-Host "   CPU 사용률: $($cpu.Average)%" -ForegroundColor $(if($cpu.Average -gt 80) {"Red"} elseif($cpu.Average -gt 60) {"Yellow"} else {"Green"})
Write-Host "   메모리 사용률: $memoryPercent% ($usedMemory MB / $totalMemory MB)" -ForegroundColor $(if($memoryPercent -gt 80) {"Red"} elseif($memoryPercent -gt 60) {"Yellow"} else {"Green"})

# Node.js 프로세스 확인
Write-Host "`n🔧 Node.js 프로세스:" -ForegroundColor Yellow
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        $memoryMB = [math]::Round($proc.WorkingSet64 / 1MB, 2)
        Write-Host "   PID: $($proc.Id) | 메모리: $memoryMB MB | CPU: $($proc.CPU)" -ForegroundColor Cyan
    }
} else {
    Write-Host "   실행 중인 Node.js 프로세스가 없습니다." -ForegroundColor Red
}

# 포트 사용량 확인
Write-Host "`n🔌 포트 사용량:" -ForegroundColor Yellow
$ports = @("5002", "50000")
foreach ($port in $ports) {
    $connection = netstat -an | findstr ":$port"
    if ($connection) {
        Write-Host "   포트 $port: 사용 중 ✅" -ForegroundColor Green
    } else {
        Write-Host "   포트 $port: 사용 안함 ❌" -ForegroundColor Red
    }
}

# 디스크 사용량 확인
Write-Host "`n💾 디스크 사용량:" -ForegroundColor Yellow
$disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
$freeSpaceGB = [math]::Round($disk.FreeSpace / 1GB, 2)
$totalSpaceGB = [math]::Round($disk.Size / 1GB, 2)
$usedSpacePercent = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 2)

Write-Host "   C: 드라이브: $usedSpacePercent% 사용 ($freeSpaceGB GB 여유 / $totalSpaceGB GB 전체)" -ForegroundColor $(if($usedSpacePercent -gt 90) {"Red"} elseif($usedSpacePercent -gt 80) {"Yellow"} else {"Green"})

# 성능 권장사항
Write-Host "`n💡 성능 권장사항:" -ForegroundColor Magenta
if ($cpu.Average -gt 80) {
    Write-Host "   ⚠️ CPU 사용률이 높습니다. 불필요한 프로그램을 종료하세요." -ForegroundColor Red
}
if ($memoryPercent -gt 80) {
    Write-Host "   ⚠️ 메모리 사용률이 높습니다. 서버를 재시작하세요." -ForegroundColor Red
}
if ($usedSpacePercent -gt 90) {
    Write-Host "   ⚠️ 디스크 공간이 부족합니다. 임시 파일을 정리하세요." -ForegroundColor Red
}
if ($cpu.Average -le 60 -and $memoryPercent -le 60 -and $usedSpacePercent -le 80) {
    Write-Host "   ✅ 시스템 성능이 양호합니다!" -ForegroundColor Green
}

Write-Host "`n🔄 5초 후 자동 새로고침 (Ctrl+C로 종료)" -ForegroundColor Cyan
Start-Sleep -Seconds 5
Clear-Host
& $MyInvocation.MyCommand.Path
