@echo off
echo 🚀 Task 통신 서버 시작
echo ======================
echo.

echo 📡 WebSocket 서버 시작 중...
echo 포트: 3002
echo.

start "Task Communication Server" cmd /c "node task-communication-server.js"

echo ✅ 서버가 백그라운드에서 시작되었습니다!
echo.
echo 사용법:
echo   task-request.bat "요청 내용" [우선순위] [카테고리]
echo   node task-client.js (대화형 모드)
echo   node quick-task-client.js "요청 내용"
echo.
echo 서버 상태 확인: netstat -ano | findstr :3002
echo.
