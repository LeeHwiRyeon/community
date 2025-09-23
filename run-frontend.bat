@echo off
setlocal
REM React/Vite 프론트엔드 개발 서버를 실행합니다.
REM Requires Node.js installed and available in PATH.

pushd "%~dp0frontend"

IF NOT EXIST package.json (
  echo [run-frontend] package.json missing. Please make sure React app is properly set up.
  popd
  exit /b 1
)

IF NOT EXIST node_modules (
  echo [run-frontend] Installing dependencies...
  npm install
  IF ERRORLEVEL 1 (
    echo [run-frontend] Failed to install dependencies.
    popd
    exit /b 1
  )
)

echo [run-frontend] Starting React/Vite development server...
npm run dev

popd
endlocal