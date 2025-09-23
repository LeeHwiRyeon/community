# Redis 설치 및 설정 가이드

## 방법 1: Chocolatey 사용 (권장)
```powershell
# Chocolatey가 설치되어 있다면
choco install redis-64

# 서비스 시작
redis-server
```

## 방법 2: Docker 사용 (가장 쉬움)
```powershell
# Docker가 설치되어 있다면
docker run --name redis-server -p 6379:6379 -d redis:latest

# 확인
docker ps
```

## 방법 3: WSL2 사용
```bash
# WSL2 Ubuntu에서
sudo apt update
sudo apt install redis-server
redis-server --daemonize yes
```

## 방법 4: Windows용 Redis 직접 다운로드
1. https://github.com/microsoftarchive/redis/releases 에서 다운로드
2. 압축 해제 후 redis-server.exe 실행

## 설정 확인
Redis 서버가 실행되면:
```bash
# 연결 테스트
redis-cli ping

# 서버 정보
redis-cli info
```

## 환경 변수 설정
```powershell
# PowerShell에서 임시 설정
$env:REDIS_URL = "redis://localhost:6379"

# 또는 .env 파일에 추가
echo "REDIS_URL=redis://localhost:6379" >> .env
```

## 현재 상태
- ❌ Redis 서버 미설치
- ✅ In-memory fallback 모드로 정상 동작 중
- ✅ Redis 연결시 자동으로 Redis 모드로 전환됨