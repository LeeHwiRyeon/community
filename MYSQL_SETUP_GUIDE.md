# MySQL 설정 가이드

## 🚨 현재 상태
- MySQL 서버가 설치되어 있지 않음
- Docker도 설치되어 있지 않음
- Phase 2 마이그레이션 실행 대기 중

---

## 방법 1: Docker Desktop 사용 (권장)

### 1.1 Docker Desktop 설치
1. [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) 다운로드
2. 설치 후 재부팅
3. Docker Desktop 실행

### 1.2 MySQL 컨테이너 실행
```powershell
# MySQL 8.0 컨테이너 실행
docker run -d `
  --name community-mysql `
  -e MYSQL_ROOT_PASSWORD=password1234 `
  -e MYSQL_DATABASE=community `
  -p 3306:3306 `
  mysql:8.0

# 컨테이너 상태 확인
docker ps

# MySQL 접속 테스트
docker exec -it community-mysql mysql -uroot -ppassword1234
```

### 1.3 마이그레이션 실행
```powershell
# 프로젝트 루트로 이동
cd C:\Users\hwi\Desktop\Projects\community\server-backend

# 각 마이그레이션 파일 실행
docker exec -i community-mysql mysql -uroot -ppassword1234 community < migrations/add_online_status.sql
docker exec -i community-mysql mysql -uroot -ppassword1234 community < migrations/add_moderator_tools.sql
docker exec -i community-mysql mysql -uroot -ppassword1234 community < migrations/add_follow_system.sql
docker exec -i community-mysql mysql -uroot -ppassword1234 community < migrations/add_bookmark_system.sql
```

---

## 방법 2: MySQL Community Server 직접 설치

### 2.1 MySQL 설치
1. [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) 다운로드
2. MySQL Installer 실행
3. "Developer Default" 선택
4. Root 비밀번호: `password1234`
5. Windows Service로 실행 설정

### 2.2 환경 변수 설정
```powershell
# MySQL bin 폴더를 PATH에 추가 (보통 아래 경로)
C:\Program Files\MySQL\MySQL Server 8.0\bin
```

### 2.3 데이터베이스 생성
```powershell
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE community CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

### 2.4 마이그레이션 실행
```powershell
cd C:\Users\hwi\Desktop\Projects\community\server-backend

mysql -u root -p community < migrations/add_online_status.sql
mysql -u root -p community < migrations/add_moderator_tools.sql
mysql -u root -p community < migrations/add_follow_system.sql
mysql -u root -p community < migrations/add_bookmark_system.sql
```

---

## 방법 3: XAMPP 사용 (가장 간단)

### 3.1 XAMPP 설치
1. [XAMPP](https://www.apachefriends.org/download.html) 다운로드
2. 설치 (MySQL 선택)
3. XAMPP Control Panel 실행

### 3.2 MySQL 시작
1. XAMPP Control Panel에서 MySQL "Start" 클릭
2. "Admin" 클릭하여 phpMyAdmin 접속

### 3.3 데이터베이스 생성
phpMyAdmin에서:
1. 새 데이터베이스: `community`
2. Collation: `utf8mb4_unicode_ci`

### 3.4 .env 파일 수정
```properties
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=community
```

### 3.5 마이그레이션 실행
```powershell
cd C:\Users\hwi\Desktop\Projects\community\server-backend

# XAMPP의 mysql 사용 (보통 아래 경로)
C:\xampp\mysql\bin\mysql -u root community < migrations/add_online_status.sql
C:\xampp\mysql\bin\mysql -u root community < migrations/add_moderator_tools.sql
C:\xampp\mysql\bin\mysql -u root community < migrations/add_follow_system.sql
C:\xampp\mysql\bin\mysql -u root community < migrations/add_bookmark_system.sql
```

---

## 🔍 마이그레이션 검증

### 테이블 생성 확인
```sql
USE community;

-- 테이블 목록 확인
SHOW TABLES;

-- 각 시스템의 테이블 확인
DESCRIBE user_online_status;
DESCRIBE moderator_roles;
DESCRIBE user_follows;
DESCRIBE bookmarks;
DESCRIBE bookmark_folders;

-- 뷰 확인
SHOW FULL TABLES WHERE table_type = 'VIEW';
```

### 예상 테이블 목록
```
boards
bookmark_folders
bookmarks
comments
content_reports
messages
moderator_actions
moderator_roles
notifications
post_votes
posts
user_bans
user_follows
board_follows
user_online_status
user_warnings
users
votes
```

### 예상 뷰 목록
```
bookmark_stats
folder_bookmark_counts
moderator_statistics
online_users_summary
pending_reports_summary
popular_bookmarked_posts
popular_boards
user_bookmarks_feed
user_follow_feed
board_follow_feed
user_follow_stats
```

---

## 🚀 다음 단계

마이그레이션 완료 후:

### 1. 백엔드 서버 시작
```powershell
cd C:\Users\hwi\Desktop\Projects\community\server-backend
npm start
```

### 2. API 테스트
```powershell
# 온라인 상태 테스트
curl http://localhost:50000/api/online-status/users

# 북마크 폴더 테스트
curl http://localhost:50000/api/bookmarks/folders -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 프론트엔드 시작
```powershell
cd C:\Users\hwi\Desktop\Projects\community\frontend
npm start
```

### 4. E2E 테스트
- 로그인 후 게시물 북마크
- 다른 사용자 팔로우
- 온라인 상태 표시 확인
- 모더레이터 대시보드 접속 (권한 있는 경우)

---

## 🔧 트러블슈팅

### 포트 3306이 이미 사용 중
```powershell
# 포트 사용 프로세스 확인
netstat -ano | findstr :3306

# 프로세스 종료
taskkill /PID <프로세스ID> /F
```

### MySQL 서비스 시작 실패
```powershell
# Windows 서비스에서 MySQL 재시작
net stop MySQL80
net start MySQL80
```

### 연결 오류 (ECONNREFUSED)
1. MySQL 서비스가 실행 중인지 확인
2. .env 파일의 DB_HOST, DB_PORT 확인
3. 방화벽 설정 확인

---

## 📞 추가 도움

문제 발생 시:
1. Docker/MySQL 로그 확인
2. server-backend 로그 확인
3. .env 파일 설정 재확인
