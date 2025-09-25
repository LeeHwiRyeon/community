@echo off
setlocal
REM 완전한 목업 데이터가 포함된 백엔드 서버를 실행합니다

REM 로그 파일 생성
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set TIMESTAMP=%datetime:~0,8%-%datetime:~8,6%
set LOGFILE=..\logs\run-mock-backend-%TIMESTAMP%.log

echo [%date% %time%] ===== Starting run-mock-backend.bat ===== >> %LOGFILE%
echo [%date% %time%] Log file: %LOGFILE% >> %LOGFILE%

echo [run-mock-backend] Starting full mock backend server...
echo [run-mock-backend] API will be available at: http://localhost:50000/api
echo [run-mock-backend] Help endpoint: http://localhost:50000/api/help
echo [%date% %time%] Starting full mock backend server... >> %LOGFILE%

REM 포트 50000을 사용하는 기존 프로세스들을 종료
echo [run-mock-backend] Checking and killing processes on port 50000...
echo [%date% %time%] Checking and killing processes on port 50000... >> %LOGFILE%
powershell -Command "try { $pids = netstat -ano | findstr ':50000' | ForEach-Object { $_.Split()[-1] } | Sort-Object -Unique; foreach ($pid in $pids) { if ($pid -and $pid -ne 0) { taskkill /PID $pid /F 2>$null; echo \"[%date% %time%] Killed process $pid\" >> %LOGFILE% } } } catch { echo \"[%date% %time%] Error killing processes: $_\" >> %LOGFILE% }"

pushd "%~dp0..\server-backend"

IF NOT EXIST mock-server.js (
  echo [run-mock-backend] mock-server.js missing.
  echo [%date% %time%] ERROR: mock-server.js missing >> %LOGFILE%
  popd
  exit /b 1
)

echo [run-mock-backend] Running mock server with complete test data...
echo [%date% %time%] Running mock server with complete test data... >> %LOGFILE%
node mock-server.js

echo [%date% %time%] ===== run-mock-backend.bat finished ===== >> %LOGFILE%

popd
endlocal