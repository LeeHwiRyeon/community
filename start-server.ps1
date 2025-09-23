cd server-backend
$env:REDIS_URL="redis://localhost:6379"
$env:LOG_JSON="1"
node src/index.js
pause