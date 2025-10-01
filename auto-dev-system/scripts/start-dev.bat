@echo off
REM 자동 개발 시스템 개발 환경 시작 스크립트

echo 🚀 자동 개발 시스템 개발 환경을 시작합니다...

REM 환경 변수 확인
if "%OPENAI_API_KEY%"=="" (
    echo ❌ OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.
    echo env.example 파일을 참조하여 .env 파일을 생성하고 API 키를 설정하세요.
    pause
    exit /b 1
)

REM Node.js 버전 확인
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo 📦 Node.js 버전: %NODE_VERSION%

REM 의존성 설치
echo 📥 의존성을 설치합니다...
call npm install

if %ERRORLEVEL% neq 0 (
    echo ❌ 의존성 설치에 실패했습니다.
    pause
    exit /b 1
)

REM TypeScript 컴파일
echo 🔨 TypeScript를 컴파일합니다...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ TypeScript 컴파일에 실패했습니다.
    pause
    exit /b 1
)

REM 개발 서버 시작
echo 🚀 개발 서버를 시작합니다...
echo 📊 대시보드: http://localhost:3000
echo 🔗 API: http://localhost:3000/api
echo ❤️  헬스 체크: http://localhost:3000/health
echo.
echo 서버를 중지하려면 Ctrl+C를 누르세요.

call npm run dev
