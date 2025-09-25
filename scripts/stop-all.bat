@echo off
chcp 65001 >nul
REM Stop all development servers batch file

REM 로그 파일 생성
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set TIMESTAMP=%datetime:~0,8%-%datetime:~8,6%
set LOGFILE=..\logs\stop-all-%TIMESTAMP%.log

echo [%date% %time%] ===== Starting stop-all.bat ===== >> %LOGFILE%
echo [%date% %time%] Log file: %LOGFILE% >> %LOGFILE%

echo [stop-all] Stopping all development servers...
echo [%date% %time%] Stopping all development servers... >> %LOGFILE%

REM Kill processes using ports 50000 (backend), 5000 (frontend), 9323 (playwright)
echo [stop-all] Checking and killing processes on ports 50000, 5000, 9323...
echo [%date% %time%] Checking and killing processes on ports 50000, 5000, 9323... >> %LOGFILE%
powershell -Command "try { $pids = netstat -ano | findstr ':50000\|:5000\|:9323' | ForEach-Object { $_.Split()[-1] } | Sort-Object -Unique; foreach ($pid in $pids) { if ($pid -and $pid -ne 0) { taskkill /PID $pid /F 2>$null; echo \"[%date% %time%] Killed process $pid\" >> %LOGFILE% } } } catch { echo \"[%date% %time%] Error killing processes: $_\" >> %LOGFILE% }"

REM Also kill Node.js processes
echo [stop-all] Killing any remaining Node.js processes...
echo [%date% %time%] Killing any remaining Node.js processes... >> %LOGFILE%
powershell -Command "try { Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; echo \"[%date% %time%] Killed Node.js processes\" >> %LOGFILE% } catch { echo \"[%date% %time%] Error killing Node.js processes: $_\" >> %LOGFILE% }"

REM Also kill .NET processes
echo [stop-all] Killing any remaining .NET processes...
echo [%date% %time%] Killing any remaining .NET processes... >> %LOGFILE%
powershell -Command "try { Get-Process dotnet -ErrorAction SilentlyContinue | Stop-Process -Force; echo \"[%date% %time%] Killed .NET processes\" >> %LOGFILE% } catch { echo \"[%date% %time%] Error killing .NET processes: $_\" >> %LOGFILE% }"

echo [stop-all] All servers stopped.
echo [%date% %time%] All servers stopped. >> %LOGFILE%
pause

echo [%date% %time%] ===== stop-all.bat finished ===== >> %LOGFILE%모든 개발 서버를 중지하는 배치 파일

echo [stop-all] Stopping all development servers...

REM 포트 50000 (백엔드), 5000 (프론트엔드), 9323(사용하는 포트)를 사용하는 프로세스를 죽임
echo [stop-all] Checking and killing processes on ports 50000, 5000, 9323...
powershell -Command "try { $pids = netstat -ano | findstr ':50000\|:5000\|:9323' | ForEach-Object { $_.Split()[-1] } | Sort-Object -Unique; foreach ($pid in $pids) { if ($pid -and $pid -ne 0) { taskkill /PID $pid /F 2>$null; Write-Host \"[stop-all] Killed process $pid\" } } } catch {}"

REM Node.js 프로세스도 죽임
echo [stop-all] Killing any remaining Node.js processes...
powershell -Command "try { Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; Write-Host '[stop-all] Killed Node.js processes' } catch {}"

echo [stop-all] All servers stopped.
pause
