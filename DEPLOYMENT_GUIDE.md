# Phase 2 최종 배포 가이드

## 🎯 현재 상태

**개발 완료**: ✅ 100%  
**배포 준비**: ⏸️ Docker Desktop 설치 대기 중  
**다음 단계**: Docker 설치 → 마이그레이션 → 테스트 → 배포

---

## 📋 빠른 시작 (5분 안에 배포)

### 전제 조건
- ✅ Node.js 설치됨
- ✅ 모든 코드 작성 완료
- ⚠️ Docker Desktop 미설치

### 1단계: Docker Desktop 설치 (2분)

#### Windows 11/10
```powershell
# 1. Docker Desktop 다운로드
# https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

# 2. 설치 프로그램 실행 (관리자 권한)
# - "Use WSL 2 instead of Hyper-V" 체크
# - 설치 완료 후 재시작

# 3. Docker Desktop 실행 및 로그인 (선택)

# 4. 설치 확인
docker --version
# 예상 출력: Docker version 24.0.x

docker-compose --version
# 예상 출력: Docker Compose version v2.x.x
```

#### WSL 2 업데이트 (필요시)
```powershell
# 관리자 권한 PowerShell에서 실행
wsl --update
wsl --set-default-version 2

# WSL 버전 확인
wsl --list --verbose
```

---

### 2단계: MySQL 컨테이너 시작 (1분)

```powershell
# 프로젝트 디렉토리로 이동
cd C:\Users\hwi\Desktop\Projects\community

# MySQL 컨테이너만 시작 (데이터베이스만 필요)
docker-compose up -d database

# 컨테이너 상태 확인
docker-compose ps

# 예상 출력:
# NAME                    STATUS          PORTS
# community-database-1    Up (healthy)    0.0.0.0:3306->3306/tcp

# 헬스체크 대기 (약 30초)
docker-compose logs -f database

# "ready for connections" 메시지 확인 후 Ctrl+C
```

---

### 3단계: 데이터베이스 마이그레이션 (1분)

```powershell
# Backend 디렉토리로 이동
cd server-backend

# 마이그레이션 스크립트 실행
.\scripts\run-migrations.ps1

# 예상 출력:
# 🚀 데이터베이스 마이그레이션 시작...
# 
# ✅ 완료: add_online_status.sql
#    - 테이블: user_online_status
#    - 뷰: v_online_users
# 
# ✅ 완료: add_moderator_tools.sql
#    - 테이블: moderator_roles, user_warnings, user_bans_v2, ...
#    - 뷰: v_active_moderators, v_pending_reports
# 
# ✅ 완료: add_follow_system.sql
#    - 테이블: user_follows, board_follows
#    - 뷰: v_user_follow_stats, v_board_follow_stats, ...
# 
# ✅ 완료: add_bookmark_system.sql
#    - 테이블: bookmark_folders, bookmarks
#    - 뷰: v_bookmark_stats, v_folder_stats, ...
# 
# 📊 현재 데이터베이스 테이블:
# - bookmark_folders
# - bookmarks
# - board_follows
# - boards
# - comments
# - content_reports_v2
# - moderator_actions
# - moderator_roles
# - posts
# - user_bans_v2
# - user_follows
# - user_online_status
# - user_warnings
# - users
# - votes
# 
# 🎉 모든 마이그레이션이 성공적으로 완료되었습니다!
```

#### 마이그레이션 확인
```powershell
# MySQL 접속
docker exec -it community-database-1 mysql -uroot -ppassword1234 community

# 테이블 목록 확인
SHOW TABLES;

# 뷰 목록 확인
SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'community';

# 종료
exit;
```

---

### 4단계: Backend 서버 시작 (30초)

```powershell
# Backend 디렉토리 (이미 위치한 경우 생략)
cd C:\Users\hwi\Desktop\Projects\community\server-backend

# 환경 변수 확인 (.env 파일)
cat .env

# 예상 내용:
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=password1234
# DB_NAME=community
# JWT_SECRET=your-secret-key
# PORT=50000

# 의존성 설치 (처음 실행 시)
npm install

# 서버 시작
npm start

# 예상 출력:
# > server-backend@1.0.0 start
# > node server.js
# 
# ✅ Database connected successfully
# 🚀 Server running on port 50000
# 📡 Ready to accept requests
```

#### Backend 테스트
새 PowerShell 창에서:
```powershell
# Health Check
curl http://localhost:50000/api/health

# 예상 응답:
# {"status":"ok","database":"connected"}

# Auth Check (토큰 없이)
curl http://localhost:50000/api/online-status/users

# 예상 응답:
# {"error":"Authentication required"}
```

---

### 5단계: Frontend 서버 시작 (30초)

새 PowerShell 창에서:
```powershell
# Frontend 디렉토리로 이동
cd C:\Users\hwi\Desktop\Projects\community\frontend

# 의존성 설치 (처음 실행 시)
npm install

# 개발 서버 시작
npm start

# 예상 출력:
# Compiled successfully!
# 
# You can now view community-frontend in the browser.
# 
#   Local:            http://localhost:3000
#   On Your Network:  http://192.168.x.x:3000
# 
# Note that the development build is not optimized.
# To create a production build, use npm run build.

# 브라우저 자동 오픈: http://localhost:3000
```

---

## 🧪 Phase 2 기능 테스트

### 6단계: API 테스트 (10분)

#### Thunder Client 사용 (VS Code)

1. **컬렉션 임포트**
   ```
   VS Code → Thunder Client 아이콘 → Collections → Import
   → server-backend/thunder-client-collection.json 선택
   ```

2. **환경 설정**
   ```
   Environments → Development 선택
   baseUrl: http://localhost:50000
   token: (로그인 후 설정)
   ```

3. **로그인 및 토큰 획득**
   ```
   Authentication 폴더 → Login 요청
   Body:
   {
     "email": "admin@example.com",
     "password": "admin123"
   }
   
   Send → 응답에서 token 복사
   Environment → token 변수에 붙여넣기
   ```

4. **API 테스트 (순서대로)**
   ```
   ✅ Online Status (5개)
   1. GET /api/online-status/users
   2. POST /api/online-status/heartbeat
   3. GET /api/online-status/user/1
   4. POST /api/online-status/bulk
   5. GET /api/online-status/statistics
   
   ✅ Moderator Tools (8개)
   1. POST /api/moderator/roles
   2. POST /api/moderator/warnings
   3. POST /api/moderator/bans-v2
   4. GET /api/moderator/reports-v2
   ...
   
   ✅ Follow System (14개)
   ✅ Bookmark System (10개)
   ```

상세 테스트 가이드: `API_TEST_GUIDE.md` 참고

---

### 7단계: Frontend 기능 테스트 (15분)

#### 1. 사용자 등록 및 로그인
```
http://localhost:3000/register
- 새 계정 생성
- 로그인 테스트
```

#### 2. 온라인 상태 테스트
```
http://localhost:3000/online-users
- 현재 온라인 사용자 목록 확인
- 자신의 상태가 "online"으로 표시되는지 확인
- 다른 사용자의 마지막 접속 시간 확인
```

#### 3. 북마크 기능 테스트
```
1. 게시물 상세 페이지 접속
2. BookmarkButton 클릭 (하트 아이콘)
3. 폴더 선택 또는 새 폴더 생성
4. http://localhost:3000/bookmarks 접속
5. "내 북마크" 탭에서 저장된 북마크 확인
6. "폴더 관리" 탭에서 폴더 생성/수정/삭제
7. 북마크에 메모 추가
8. 북마크를 다른 폴더로 이동
```

#### 4. 팔로우 기능 테스트
```
1. 다른 사용자 프로필 접속
2. "팔로우" 버튼 클릭
3. http://localhost:3000/follow/feed 접속
4. "사용자 피드" 탭에서 팔로우한 사용자의 게시물 확인
5. http://localhost:3000/follow/followers 접속
6. 팔로워/팔로잉 목록 확인

게시판 팔로우:
1. 게시판 페이지 접속
2. "게시판 팔로우" 버튼 클릭
3. 알림 설정 토글
4. http://localhost:3000/follow/feed 접속
5. "게시판 피드" 탭에서 팔로우한 게시판 게시물 확인
```

#### 5. 모더레이터 기능 테스트 (권한 필요)
```
1. 모더레이터 역할 부여 (API 또는 DB 직접 수정)
   
   # MySQL에서 직접 실행
   docker exec -it community-database-1 mysql -uroot -ppassword1234 community
   
   INSERT INTO moderator_roles (user_id, role, permissions)
   VALUES (1, 'moderator', '{"delete_posts": true, "ban_users": true, "manage_reports": true}');

2. http://localhost:3000/moderator 접속
3. 대시보드 확인:
   - 대기 중인 신고
   - 최근 경고
   - 활성 차단
   - 통계

4. http://localhost:3000/moderator/reports 접속
5. 신고 처리:
   - 신고 승인/거부
   - 처리 노트 작성

6. http://localhost:3000/moderator/logs 접속
7. 모더레이터 활동 로그 확인
```

#### 6. 네비게이션 테스트
```
Navbar에서 확인:
✅ 홈
✅ 게시판
✅ 검색
✅ 북마크 (새로 추가)
✅ 팔로우 (새로 추가)
✅ 관리 시스템
✅ 프로필
```

---

## ✅ 배포 검증 체크리스트

### 인프라
- [ ] Docker Desktop 설치 완료
- [ ] MySQL 컨테이너 실행 중 (docker ps)
- [ ] 컨테이너 헬스체크 통과
- [ ] 데이터베이스 연결 성공

### 데이터베이스
- [ ] 4개 마이그레이션 파일 실행 완료
- [ ] 17개 테이블 생성 확인
- [ ] 11개 뷰 생성 확인
- [ ] 인덱스 생성 확인

### Backend API
- [ ] 서버 시작 성공 (포트 50000)
- [ ] Health check 응답 (200 OK)
- [ ] 데이터베이스 연결 확인
- [ ] JWT 인증 작동
- [ ] 43개 API 엔드포인트 테스트 완료

### Frontend
- [ ] 개발 서버 시작 성공 (포트 3000)
- [ ] 빌드 오류 없음
- [ ] 8개 새 라우트 접근 가능
- [ ] BookmarkButton 렌더링 확인
- [ ] Navbar 링크 작동

### 기능 테스트
- [ ] 온라인 상태 실시간 업데이트
- [ ] 북마크 추가/삭제/이동
- [ ] 폴더 생성/수정/삭제
- [ ] 사용자 팔로우/언팔로우
- [ ] 게시판 팔로우/언팔로우
- [ ] 팔로우 피드 조회
- [ ] 모더레이터 대시보드
- [ ] 신고 생성 및 처리

---

## 🐛 문제 해결

### Docker 관련

#### 문제: Docker 명령어 인식 안 됨
```powershell
docker: The term 'docker' is not recognized...
```

**해결:**
1. Docker Desktop 설치 확인
2. PowerShell 재시작
3. PATH 환경 변수 확인
4. Windows 재시작 (필요시)

#### 문제: WSL 2 설치 오류
```
WslRegisterDistribution failed with error: 0x800701bc
```

**해결:**
```powershell
# WSL 업데이트
wsl --update

# Linux 커널 업데이트 패키지 설치
# https://aka.ms/wsl2kernel

# 재시작
wsl --shutdown
```

#### 문제: Docker 컨테이너 시작 실패
```
Error response from daemon: Ports are not available
```

**해결:**
```powershell
# 3306 포트 사용 프로세스 확인
netstat -ano | findstr :3306

# 프로세스 종료
taskkill /PID <PID> /F

# 또는 docker-compose.yml에서 포트 변경
# ports:
#   - "3307:3306"  # 호스트 포트를 3307로 변경
```

---

### 마이그레이션 관련

#### 문제: 마이그레이션 스크립트 실행 실패
```
ERROR 2002 (HY000): Can't connect to MySQL server
```

**해결:**
```powershell
# 컨테이너 상태 확인
docker-compose ps

# 컨테이너 로그 확인
docker-compose logs database

# 컨테이너 재시작
docker-compose restart database

# 30초 대기 후 재시도
```

#### 문제: 테이블 이미 존재
```
ERROR 1050 (42S01): Table 'user_online_status' already exists
```

**해결:**
```powershell
# 기존 Phase 2 테이블 삭제 (주의!)
docker exec -it community-database-1 mysql -uroot -ppassword1234 community

DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS bookmark_folders;
DROP TABLE IF EXISTS board_follows;
DROP TABLE IF EXISTS user_follows;
DROP TABLE IF EXISTS moderator_actions;
DROP TABLE IF EXISTS content_reports_v2;
DROP TABLE IF EXISTS user_bans_v2;
DROP TABLE IF EXISTS user_warnings;
DROP TABLE IF EXISTS moderator_roles;
DROP TABLE IF EXISTS user_online_status;

exit;

# 마이그레이션 재실행
.\scripts\run-migrations.ps1
```

---

### Backend 관련

#### 문제: 서버 시작 실패 - 데이터베이스 연결
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**해결:**
```powershell
# MySQL 컨테이너 확인
docker-compose ps database

# .env 파일 확인
cat .env

# DB_HOST가 localhost인지 확인
# Docker 컨테이너 사용 시 "localhost" 또는 "127.0.0.1"

# 테스트 연결
docker exec -it community-database-1 mysql -uroot -ppassword1234 -e "SELECT 1;"
```

#### 문제: 포트 50000 이미 사용 중
```
Error: listen EADDRINUSE: address already in use :::50000
```

**해결:**
```powershell
# 포트 사용 프로세스 확인
netstat -ano | findstr :50000

# 프로세스 종료
taskkill /PID <PID> /F

# 또는 .env에서 포트 변경
# PORT=50001
```

---

### Frontend 관련

#### 문제: 컴파일 오류 - 모듈을 찾을 수 없음
```
Module not found: Can't resolve '@chakra-ui/react'
```

**해결:**
```powershell
# 의존성 재설치
rm -r node_modules
rm package-lock.json
npm install

# Chakra UI 수동 설치
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion
```

#### 문제: API 호출 실패 - CORS 오류
```
Access to fetch at 'http://localhost:50000' has been blocked by CORS policy
```

**해결:**
Backend에서 CORS 설정 확인:
```javascript
// server.js
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

### API 테스트 관련

#### 문제: 401 Unauthorized
```json
{"error": "Authentication required"}
```

**해결:**
1. Login API로 토큰 재발급
2. Thunder Client/Postman 환경 변수 업데이트
3. Authorization 헤더 확인: `Bearer <token>`

#### 문제: 404 Not Found
```json
{"error": "Resource not found"}
```

**해결:**
1. API 경로 확인 (오타 확인)
2. Backend 서버 실행 중인지 확인
3. 라우트 등록 확인 (server.js)

---

## 📊 성능 확인

### 응답 시간 모니터링
```powershell
# Thunder Client에서 각 API 테스트 후 확인
# Response Time 탭에서 시간 확인

# 목표:
# - GET 요청: < 200ms
# - POST/PUT 요청: < 500ms
# - 복잡한 쿼리: < 800ms
```

### 데이터베이스 쿼리 최적화
```sql
-- 느린 쿼리 확인
SHOW PROCESSLIST;

-- 인덱스 사용 확인
EXPLAIN SELECT * FROM user_follows WHERE follower_id = 1;

-- 테이블 통계 업데이트
ANALYZE TABLE user_follows;
```

---

## 🎉 배포 완료!

모든 단계를 완료했다면 Phase 2 배포 성공입니다!

### 🚀 다음 단계

1. **프로덕션 배포 준비**
   - 환경 변수 보안 강화
   - HTTPS 설정
   - 데이터베이스 백업 자동화
   - 로깅 및 모니터링 설정

2. **성능 최적화**
   - Redis 캐싱 추가
   - CDN 설정
   - 이미지 최적화
   - API 응답 압축

3. **보안 강화**
   - Rate Limiting
   - CSRF 토큰
   - SQL Injection 방어 검증
   - XSS 방어 검증

---

## 📚 참고 문서

- `MYSQL_SETUP_GUIDE.md` - MySQL 설치 상세 가이드
- `API_TEST_GUIDE.md` - API 테스트 상세 가이드
- `PHASE2_COMPONENT_INTEGRATION_REPORT.md` - 컴포넌트 통합 리포트
- `docker-compose.yml` - Docker 설정
- `thunder-client-collection.json` - Thunder Client 컬렉션
- `postman-collection.json` - Postman 컬렉션

---

**작성일**: 2025년 11월 11일  
**버전**: v1.2.0  
**상태**: 배포 준비 완료 ✅
