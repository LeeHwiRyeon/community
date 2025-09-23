@echo off
setlocal enabledelayedexpansion

REM ===== Config =====
set ROOT=%~dp0
set LOGDIR=%ROOT%logs
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
set LOGFILE=%LOGDIR%\session-%DATE:~0,4%%DATE:~5,2%%DATE:~8,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%.log
set LOGFILE=%LOGFILE: =0%

call :log "Session start in %ROOT%"

REM Quick argument handling (moved after ROOT init)
if /I "%1"=="--quick" set MODE=quick& goto quick_entry
if /I "%1"=="--quick-ro" set MODE=quick_ro& goto quick_entry
if /I "%1"=="--quick-nobrowser" set MODE=quick_nb& goto quick_entry
if /I "%1"=="--quick-ro-nobrowser" set MODE=quick_ro_nb& goto quick_entry
if /I "%1"=="--quick-test" set MODE=quick_test& goto quick_entry
if /I "%1"=="--quick-test-ro" set MODE=quick_test_ro& goto quick_entry
if /I "%1"=="--quick-follow" set MODE=quick_follow& goto quick_entry

:quick_entry
REM 통합 퀵 스타트 진입점
if defined MODE (
	if /I "%MODE%"=="quick_ro" set READONLY=1
	if /I "%MODE%"=="quick_ro_nb" (set READONLY=1 & set NO_BROWSER=1)
	if /I "%MODE%"=="quick_nb" set NO_BROWSER=1
	if /I "%MODE%"=="quick_test" (set NO_BROWSER=1 & set TESTPROFILE=1)
	if /I "%MODE%"=="quick_test_ro" (set NO_BROWSER=1 & set TESTPROFILE=1 & set READONLY=1)
	if /I "%MODE%"=="quick_follow" (set NO_BROWSER=1 & set LOG_FOLLOW=1)
	goto quick_start
)

REM ===== Backend Env Defaults (only set if not already defined in user env) =====
if not defined PORT set PORT=50000
if not defined DB_HOST set DB_HOST=localhost
if not defined DB_USER set DB_USER=root
if not defined DB_PASS set DB_PASS=
if not defined DB_NAME set DB_NAME=community
if not defined VIEW_FLUSH_INTERVAL_MS set VIEW_FLUSH_INTERVAL_MS=1500
if not defined VIEW_MAX_PENDING set VIEW_MAX_PENDING=20
if not defined VIEW_BUFFER_MAX_TOTAL set VIEW_BUFFER_MAX_TOTAL=10000
if not defined VIEW_MAX_BACKOFF_MS set VIEW_MAX_BACKOFF_MS=8000
if not defined SEARCH_FULLTEXT_MIN_SCORE set SEARCH_FULLTEXT_MIN_SCORE=0

REM Show effective backend env (brief)
call :log "ENV PORT=%PORT% DB_HOST=%DB_HOST% DB_USER=%DB_USER% DB_NAME=%DB_NAME% VIEW_FLUSH_INTERVAL_MS=%VIEW_FLUSH_INTERVAL_MS%"

:menu
cls
ECHO =====================================
ECHO Community Hub Runner
ECHO Log: %LOGFILE%
ECHO =====================================
ECHO 1) Open site (home.html)
ECHO 2) Open board page (board.html?board=free)
ECHO 3) Clear menu/posts cache (localStorage) - manual instruction
ECHO 4) Open search page
ECHO 5) Start static local server (:8000) and open (frontend-only)
ECHO 6) Start backend API server (Node) and open health
ECHO 7) Start backend in READONLY mode (defensive)
ECHO 8) Canary smoke test (server must be running)
ECHO 9)  Quick start (backend RW)
ECHO 10) Quick start (backend RO)
ECHO 11) Quick start (RW - no browser)
ECHO 12) Quick start (RO - no browser)
ECHO 13) Quick start (RW - test browser profile)
ECHO 14) Quick start (RO - test browser profile)
ECHO 15) Exit
ECHO =====================================
set /p choice=Select [1-15]: 
if "%choice%"=="1" goto open_site
if "%choice%"=="2" goto open_board
if "%choice%"=="3" goto clear_cache
if "%choice%"=="4" goto open_search
if "%choice%"=="5" goto start_server
if "%choice%"=="6" goto start_backend
if "%choice%"=="7" goto start_readonly
if "%choice%"=="8" goto canary_smoke
if "%choice%"=="9" goto quick_start
if "%choice%"=="10" goto quick_start_ro
if "%choice%"=="11" goto quick_start_nobrowser
if "%choice%"=="12" goto quick_start_ro_nobrowser
if "%choice%"=="13" goto quick_start_test
if "%choice%"=="14" goto quick_start_test_ro
if "%choice%"=="15" goto end
ECHO Invalid choice
pause
goto menu

:open_site
call :log "Open home.html"
start "Community" "home.html"
goto menu

:open_board
call :log "Open board.html?board=free"
start "Board" "board.html?board=free"
goto menu

:open_search
call :log "Open search.html"
start "Search" "search.html"
goto menu

:start_server
set PORT=
set /p PORT=Enter port [8000 static-only || 50000 backend]: 
if "%PORT%"=="" set PORT=8000
call :log "Start local server and open http://localhost:%PORT%/"
where python >nul 2>nul
if errorlevel 1 (
	where py >nul 2>nul
	if errorlevel 1 (
		ECHO Python not found. Opening file directly instead.
		call :log "Python not found - fallback to open home.html"
		start "Community" "home.html"
	) else (
		REM Start server with Python launcher
	start "Community Server" cmd /k "pushd ""%ROOT%"" && py -m http.server %PORT%"
		timeout /t 2 >nul
	start "Community" "http://localhost:%PORT%/"
	)
) else (
	REM Start server in new window, keep it open
	start "Community Server" cmd /k "pushd ""%ROOT%"" && python -m http.server %PORT%"
	timeout /t 2 >nul
	start "Community" "http://localhost:%PORT%/"
)
goto menu

:start_backend
call :log "Start backend API server (Node) on PORT=%PORT% (default now 50000)"
REM Ensure dependencies installed once
if not exist "%ROOT%server-backend\node_modules" (
	pushd "%ROOT%server-backend%"
	call :log "Installing backend dependencies (npm install)"
	npm install 1>>"%LOGFILE%" 2>>&1
	popd
)
start "Community Backend" cmd /k "pushd \"%ROOT%server-backend\" && node src/index.js"
REM allow a short warmup then open health endpoint
timeout /t 3 >nul
start "API Health" "http://localhost:%PORT%/api/health"
goto menu

:start_readonly
call :log "Start backend API server READONLY on PORT=%PORT%"
set READONLY=1
if not exist "%ROOT%server-backend\node_modules" (
	pushd "%ROOT%server-backend%"
	call :log "Installing backend dependencies (npm install)"
	npm install 1>>"%LOGFILE%" 2>>&1
	popd
)
start "Community Backend (RO)" cmd /k "pushd \"%ROOT%server-backend\" && set READONLY=1 && node src/index.js"
timeout /t 2 >nul
start "API Live" "http://localhost:%PORT%/api/live"
start "API Ready" "http://localhost:%PORT%/api/ready"
goto menu

:canary_smoke
call :log "Run canary smoke test"
pushd "%ROOT%server-backend"
node scripts/canary-smoke.js
popd
pause
goto menu

REM 공통 함수: 이미 떠있는 백엔드 창이 있으면 재사용 방지 위해 닫거나 안내

for /f "tokens=2 delims==" %%A in ('wmic process where "CommandLine like '%%node%%src/index.js%%'" get ProcessId /value 2^>nul ^| find "ProcessId="') do set EXISTING_NODE=%%A
if defined EXISTING_NODE (
  call :log "Existing backend process detected (PID=%EXISTING_NODE%) - leaving it running"
  goto quick_after_launch
)

:quick_start
if not defined PORT set PORT=50000
call :log "Quick start backend MODE=%MODE% PORT=%PORT% RO=%READONLY%"
echo [quick] ROOT=%ROOT% PORT=%PORT% MODE=%MODE% RO=%READONLY%
if not exist "%ROOT%server-backend\node_modules" (
	pushd "%ROOT%server-backend%"
	call :log "Installing backend dependencies (npm install)"
	npm install 1>>"%LOGFILE%" 2>>&1
	popd
)

set BACK_CMD=node src/index.js
if defined READONLY set BACK_CMD=set READONLY=1 ^& node src/index.js

start "Community Backend" cmd /k "pushd \"%ROOT%server-backend\" && %BACK_CMD%"
timeout /t 2 >nul

:quick_after_launch
if "%NO_BROWSER%"=="1" goto skip_browser_quick
start "API Health" "http://localhost:%PORT%/api/health"
if defined TESTPROFILE (
  call :open_test_profile
) else (
  start "Community" "http://localhost:%PORT%/home.html"
)
:skip_browser_quick
if defined LOG_FOLLOW (
  echo --- Live log tail (Ctrl+C to stop follow only) ---
  powershell -Command "Get-Content -Path '%LOGFILE%' -Wait"
)
goto end

:quick_start_ro
call :log "Quick start backend READONLY PORT=%PORT%"
echo [quick-ro] ROOT=%ROOT% PORT=%PORT%
set READONLY=1
if not exist "%ROOT%server-backend\node_modules" (
	pushd "%ROOT%server-backend%"
	call :log "Installing backend dependencies (npm install)"
	npm install 1>>"%LOGFILE%" 2>>&1
	popd
)
start "Community Backend (quick RO)" cmd /k "pushd \"%ROOT%server-backend\" && set READONLY=1 && node src/index.js"
timeout /t 2 >nul
if "%NO_BROWSER%"=="1" goto skip_browser_quick_ro
start "API Ready" "http://localhost:%PORT%/api/ready"
start "Community" "http://localhost:%PORT%/home.html"
:skip_browser_quick_ro
goto end

:quick_start_nobrowser
set NO_BROWSER=1
goto quick_start

:quick_start_ro_nobrowser
set NO_BROWSER=1
goto quick_start_ro

REM Test profile helpers (Chrome/Edge detection)
:detect_browser
set BROWSER_CMD=
where chrome >nul 2>nul && set BROWSER_CMD=chrome
if not defined BROWSER_CMD where msedge >nul 2>nul && set BROWSER_CMD=msedge
if not defined BROWSER_CMD where "C:\Program Files\Google\Chrome\Application\chrome.exe" >nul 2>nul && set BROWSER_CMD="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not defined BROWSER_CMD where "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" >nul 2>nul && set BROWSER_CMD="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not defined BROWSER_CMD set BROWSER_CMD=start
goto :eof

:open_test_profile
call :detect_browser
set TEST_DIR=%TEMP%\community-test-profile
if not exist "%TEST_DIR%" mkdir "%TEST_DIR%" >nul 2>nul
if "%BROWSER_CMD%"=="start" (
  start "CommunityTest" "http://localhost:%PORT%/home.html"
) else (
  start "CommunityTest" %BROWSER_CMD% --user-data-dir="%TEST_DIR%" --new-window "http://localhost:%PORT%/home.html"
)
goto :eof

:quick_start_test
set NO_BROWSER=1
call :log "Quick start backend RW (test profile) PORT=%PORT%"
if not exist "%ROOT%server-backend\node_modules" (
	pushd "%ROOT%server-backend%"
	call :log "Installing backend dependencies (npm install)"
	npm install 1>>"%LOGFILE%" 2>>&1
	popd
)
start "Community Backend (quick test)" cmd /k "pushd \"%ROOT%server-backend\" && node src/index.js"
timeout /t 2 >nul
start "API Health" "http://localhost:%PORT%/api/health"
call :open_test_profile
goto end

:quick_start_test_ro
set NO_BROWSER=1
set READONLY=1
call :log "Quick start backend RO (test profile) PORT=%PORT%"
if not exist "%ROOT%server-backend\node_modules" (
	pushd "%ROOT%server-backend%"
	call :log "Installing backend dependencies (npm install)"
	npm install 1>>"%LOGFILE%" 2>>&1
	popd
)
start "Community Backend (quick test RO)" cmd /k "pushd \"%ROOT%server-backend\" && set READONLY=1 && node src/index.js"
timeout /t 2 >nul
start "API Ready" "http://localhost:%PORT%/api/ready"
call :open_test_profile
goto end


:clear_cache
call :log "Request clear cache (press any key after manual clear)"
ECHO Clear localStorage in your browser DevTools (Application > Local Storage)
pause
goto menu

:log
set now=%date% %time%
echo [%now%] %~1>>"%LOGFILE%"
goto :eof

:end
call :log "Session end"
echo Log saved to %LOGFILE%
endlocal
exit /b 0
