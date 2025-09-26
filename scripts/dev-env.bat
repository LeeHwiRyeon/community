@echo off
REM 통합 개발 환경 관리 배치 파일
REM PowerShell 스크립트를 호출하여 개발 서버를 관리

setlocal enabledelayedexpansion

REM 로그 파일 생성
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set TIMESTAMP=%datetime:~0,8%-%datetime:~8,6%
set LOGFILE=..\logs\dev-env-%TIMESTAMP%.log

echo [%date% %time%] ===== Starting dev-env.bat ===== >> %LOGFILE%

REM 기본 액션 설정
set ACTION=%1
if "%ACTION%"=="" set ACTION=start

REM Verbose 플래그 확인
set VERBOSE_FLAG=
if "%2"=="--verbose" set VERBOSE_FLAG=-Verbose

REM PowerShell 스크립트 실행
echo [%date% %time%] Executing: powershell -ExecutionPolicy Bypass -File "%~dp0dev-env.ps1" -Action %ACTION% %VERBOSE_FLAG% >> %LOGFILE%
powershell -ExecutionPolicy Bypass -File "%~dp0dev-env.ps1" -Action %ACTION% %VERBOSE_FLAG%

set EXITCODE=%ERRORLEVEL%
echo [%date% %time%] ===== dev-env.bat finished with code %EXITCODE% ===== >> %LOGFILE%

endlocal
exit /b %EXITCODE%