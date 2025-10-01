@echo off
echo 웹 대시보드 시작 중...
echo ================================================================================

cd /d "%~dp0"

echo 1. Cursor 통합 서버 시작...
start "Cursor Server" cmd /c "node core/cursor-integration-manager.js"

timeout /t 3 /nobreak >nul

echo 2. 간단한 웹 대시보드 시작...
start "Simple Web Dashboard" cmd /c "node visualization/simple-web-server.js"

timeout /t 2 /nobreak >nul

echo 3. 워크플로우 시각화 서버 시작...
start "Workflow Visualization" cmd /c "node visualization/workflow-visualization-server.js"

timeout /t 2 /nobreak >nul

echo 4. 고급 분석 대시보드 시작...
start "Advanced Dashboard" cmd /c "node visualization/advanced-workflow-dashboard.js"

timeout /t 2 /nobreak >nul

echo 5. 3D 시각화 도구 시작...
start "3D Visualizer" cmd /c "node visualization/3d-workflow-visualizer.js"

timeout /t 3 /nobreak >nul

echo.
echo ================================================================================
echo 웹 대시보드가 시작되었습니다!
echo.
echo 접속 주소:
echo   간단한 대시보드: http://localhost:55550
echo   기본 시각화:     http://localhost:55551
echo   고급 분석:       http://localhost:55552
echo   3D 시각화:       http://localhost:55553
echo.
echo 브라우저에서 위 주소로 접속하세요.
echo ================================================================================

pause
