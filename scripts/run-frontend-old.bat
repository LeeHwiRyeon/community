@echo off
setlocal
REM frontend-old 디렉토리의 정적 서버를 실행합니다 (테스트용)

REM 기존 정적 서버 프로세스들을 이름으로 종료
echo [run-frontend-old] Killing existing static server processes...
powershell -Command "try { taskkill /FI \"WINDOWTITLE eq Static Test Server\" /F 2>$null; taskkill /IM node.exe /F 2>$null; } catch {}"

pushd "%~dp0frontend-old"

IF NOT EXIST _dev_static_server.js (
  echo [run-frontend-old] _dev_static_server.js missing.
  popd
  goto :eof
)

echo [run-frontend-old] Starting static test server...
echo [run-frontend-old] Access: http://localhost:5500/simple-test.html
start "Static Test Server" cmd /c "cd /d %~dp0frontend-old && node _dev_static_server.js"

echo [run-frontend-old] Static test server started in background

goto :eof
popd
endlocal