@echo off
echo 🚀 TheNewsPaper 로컬 호스팅 시작...

REM 로그 디렉토리 생성
if not exist logs mkdir logs

REM PM2로 서비스 시작
echo 📦 PM2로 서비스 시작...
pm2 start ecosystem.config.js

REM 상태 확인
echo 📊 서비스 상태 확인...
pm2 status

echo ✅ TheNewsPaper 로컬 호스팅 완료!
echo 🌐 프론트엔드: http://localhost:3000
echo 🔧 백엔드 API: http://localhost:5000
echo 📊 PM2 모니터링: pm2 monit
echo 🛑 서비스 중지: pm2 stop all
pause