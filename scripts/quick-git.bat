@echo off
REM Quick Git Workflow Batch Script
REM 빠른 Git 작업을 위한 배치 스크립트

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo 사용법: quick-git.bat "커밋 메시지" [파일패턴] [푸시여부]
    echo 예시: quick-git.bat "기능 추가" . true
    exit /b 1
)

set "COMMIT_MESSAGE=%~1"
set "FILES=%~2"
set "PUSH=%~3"

if "%FILES%"=="" set "FILES=."
if "%PUSH%"=="" set "PUSH=false"

echo [%time%] 빠른 Git 워크플로우 시작...

echo [%time%] 1. 상태 확인
git status --porcelain
if errorlevel 1 (
    echo [%time%] 상태 확인 실패
    exit /b 1
)

echo [%time%] 2. 파일 추가
git add %FILES%
if errorlevel 1 (
    echo [%time%] 파일 추가 실패
    exit /b 1
)

echo [%time%] 3. 커밋 생성
git commit -m "%COMMIT_MESSAGE%"
if errorlevel 1 (
    echo [%time%] 커밋 실패
    exit /b 1
)

if "%PUSH%"=="true" (
    echo [%time%] 4. 변경사항 푸시
    git push
    if errorlevel 1 (
        echo [%time%] 푸시 실패
        exit /b 1
    )
)

echo [%time%] 빠른 Git 워크플로우 완료!
