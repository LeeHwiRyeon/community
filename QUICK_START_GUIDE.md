# 빠른 시작 가이드 - Docker로 MySQL 실행

## 🚀 단계별 가이드

### 1단계: Docker Desktop 설치 (아직 설치 안 된 경우)

1. **Docker Desktop 다운로드**
   - 링크: https://www.docker.com/products/docker-desktop/
   - Windows 버전 다운로드

2. **설치 및 실행**
   - 설치 프로그램 실행
   - 설치 완료 후 **재부팅** (필요한 경우)
   - Docker Desktop 실행
   - 우측 하단 Docker 아이콘이 초록색이 되면 준비 완료

3. **Docker 실행 확인**
   ```powershell
   docker --version
   # Docker version 24.0.x 이상이면 OK
   ```

---

### 2단계: MySQL 데이터베이스 시작 (자동 설정 완료!)

Docker Compose 설정이 이미 완료되었습니다! 다음 명령만 실행하세요:

```powershell
# 프로젝트 루트로 이동
cd C:\Users\hwi\Desktop\Projects\community

# MySQL 데이터베이스만 시작
docker-compose up -d database
```

**무슨 일이 일어나나요?**
- MySQL 8.0 컨테이너 다운로드 및 실행
- 데이터베이스 `community` 자동 생성
- 포트 3306으로 접속 가능
- 루트 비밀번호: `password1234`

**실행 확인:**
```powershell
# 컨테이너 상태 확인
docker ps

# 다음과 같이 표시되어야 합니다:
# CONTAINER ID   IMAGE       STATUS         PORTS
# xxxxxxxxx      mysql:8.0   Up X seconds   0.0.0.0:3306->3306/tcp
```

---

### 3단계: 마이그레이션 실행

#### 방법 A: PowerShell 스크립트 사용 (권장)

```powershell
cd C:\Users\hwi\Desktop\Projects\community\server-backend
.\scripts\run-migrations.ps1
```

#### 방법 B: 수동 실행

```powershell
$container = docker ps --filter "name=community-database" --format "{{.Names}}"

# 각 마이그레이션 실행
Get-Content migrations\add_online_status.sql | docker exec -i $container mysql -uroot -ppassword1234 community
Get-Content migrations\add_moderator_tools.sql | docker exec -i $container mysql -uroot -ppassword1234 community
Get-Content migrations\add_follow_system.sql | docker exec -i $container mysql -uroot -ppassword1234 community
Get-Content migrations\add_bookmark_system.sql | docker exec -i $container mysql -uroot -ppassword1234 community
```

**성공 메시지:**
```
✅ 완료: add_online_status.sql
✅ 완료: add_moderator_tools.sql
✅ 완료: add_follow_system.sql
✅ 완료: add_bookmark_system.sql
🎉 모든 마이그레이션 완료!
```

---

### 4단계: 데이터베이스 확인

```powershell
# MySQL 접속
docker exec -it community-database-1 mysql -uroot -ppassword1234 community

# 테이블 목록 확인
SHOW TABLES;

# 예상 테이블 (17개):
# - boards
# - bookmark_folders
# - bookmarks
# - comments
# - content_reports
# - messages
# - moderator_actions
# - moderator_roles
# - notifications
# - post_votes
# - posts
# - user_bans
# - user_follows
# - board_follows
# - user_online_status
# - user_warnings
# - users

# 뷰 확인
SHOW FULL TABLES WHERE table_type = 'VIEW';

# 종료
exit;
```

---

### 5단계: 백엔드 서버 시작

```powershell
cd C:\Users\hwi\Desktop\Projects\community\server-backend

# 환경 변수 확인 (.env 파일이 올바른지 확인)
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=password1234
# DB_NAME=community

# 서버 시작
npm start
```

**성공 메시지:**
```
✅ Database connected successfully
🚀 Server running on port 50000
```

---

### 6단계: 프론트엔드 시작

```powershell
cd C:\Users\hwi\Desktop\Projects\community\frontend
npm start
```

브라우저에서 http://localhost:3000 접속

---

## 🔧 문제 해결

### Docker Desktop이 시작되지 않음
- Windows를 재부팅
- WSL2가 설치되어 있는지 확인
- Hyper-V가 활성화되어 있는지 확인

### 포트 3306이 이미 사용 중
```powershell
# 포트 사용 프로세스 찾기
netstat -ano | findstr :3306

# 프로세스 종료 (관리자 권한)
taskkill /PID <프로세스ID> /F

# 또는 docker-compose.yml에서 포트 변경
# ports:
#   - "3307:3306"  # 외부 포트를 3307로 변경
```

### MySQL 컨테이너가 시작되지 않음
```powershell
# 로그 확인
docker logs community-database-1

# 컨테이너 재시작
docker-compose restart database

# 완전히 삭제 후 재생성
docker-compose down -v
docker-compose up -d database
```

### 마이그레이션 실패
```powershell
# 기존 데이터베이스 삭제 후 재생성
docker exec -it community-database-1 mysql -uroot -ppassword1234 -e "DROP DATABASE IF EXISTS community; CREATE DATABASE community CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 마이그레이션 재실행
.\scripts\run-migrations.ps1
```

---

## 📊 전체 시스템 실행 (선택사항)

모든 서비스를 Docker로 실행하려면:

```powershell
# 전체 스택 시작 (백엔드 + 프론트엔드 + DB + Elasticsearch)
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down

# 완전 삭제 (볼륨 포함)
docker-compose down -v
```

---

## ✅ 다음 단계

마이그레이션 완료 후:

1. ✅ **API 테스트**: Postman 또는 Thunder Client로 API 엔드포인트 테스트
2. ✅ **컴포넌트 통합**: 프론트엔드 라우팅에 새 컴포넌트 추가
3. ✅ **기능 테스트**: 
   - 게시물 북마크
   - 사용자 팔로우
   - 온라인 상태 확인
   - 모더레이터 대시보드

---

## 🎯 빠른 명령어 모음

```powershell
# MySQL 시작
docker-compose up -d database

# 마이그레이션 실행
cd server-backend
.\scripts\run-migrations.ps1

# 백엔드 시작
npm start

# 새 터미널에서 프론트엔드 시작
cd ..\frontend
npm start

# Docker 상태 확인
docker ps

# MySQL 접속
docker exec -it community-database-1 mysql -uroot -ppassword1234 community

# 로그 확인
docker logs community-database-1
```

---

준비 완료! 🚀
