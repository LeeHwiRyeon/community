# Phase 2 API 테스트 가이드

## 📋 개요

이 문서는 Phase 2에서 구현된 모든 API 엔드포인트를 테스트하는 방법을 설명합니다.

---

## 🛠 준비사항

### 1. API 컬렉션 임포트

#### Thunder Client (VS Code)
1. VS Code에서 Thunder Client 확장 설치
2. Thunder Client 패널 열기
3. Collections → Import
4. `server-backend/thunder-client-collection.json` 선택

#### Postman
1. Postman 실행
2. Import → File
3. `server-backend/postman-collection.json` 선택

### 2. 환경 설정

**Development 환경 변수:**
```
baseUrl: http://localhost:50000
token: (로그인 후 자동 설정)
```

---

## 🔐 인증 플로우

### 1단계: 로그인
```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "user",
    "email": "user@example.com"
  }
}
```

### 2단계: 토큰 저장
응답에서 받은 `token` 값을 환경 변수에 저장:
- Thunder Client: Environment → `token` 변수에 복사
- Postman: Environment → `token` 변수에 복사

---

## 📝 API 엔드포인트 테스트

### 1. 온라인 상태 API (5개)

#### 1.1 온라인 사용자 목록 조회
```http
GET {{baseUrl}}/api/online-status/users
Authorization: Bearer {{token}}
```

**예상 응답:**
```json
{
  "users": [
    {
      "userId": 1,
      "username": "user1",
      "status": "online",
      "lastSeen": "2025-11-11T10:30:00Z",
      "deviceType": "web"
    }
  ]
}
```

#### 1.2 하트비트 업데이트
```http
POST {{baseUrl}}/api/online-status/heartbeat
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "online",
  "deviceType": "web"
}
```

#### 1.3 특정 사용자 상태 조회
```http
GET {{baseUrl}}/api/online-status/user/1
Authorization: Bearer {{token}}
```

#### 1.4 대량 사용자 상태 조회
```http
POST {{baseUrl}}/api/online-status/bulk
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "userIds": [1, 2, 3, 4, 5]
}
```

#### 1.5 온라인 통계 조회
```http
GET {{baseUrl}}/api/online-status/statistics
Authorization: Bearer {{token}}
```

---

### 2. 모더레이터 도구 API (8개)

#### 2.1 모더레이터 역할 부여
```http
POST {{baseUrl}}/api/moderator/roles
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "userId": 2,
  "role": "moderator",
  "permissions": {
    "delete_posts": true,
    "ban_users": true,
    "manage_reports": true
  }
}
```

#### 2.2 경고 발급
```http
POST {{baseUrl}}/api/moderator/warnings
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "userId": 3,
  "reason": "Spam posting",
  "severity": "medium"
}
```

#### 2.3 사용자 차단
```http
POST {{baseUrl}}/api/moderator/bans-v2
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "userId": 3,
  "reason": "Repeated violations",
  "banType": "temporary",
  "duration": 7
}
```

**banType 옵션:**
- `temporary`: 임시 차단 (duration 일수 지정)
- `permanent`: 영구 차단
- `shadow`: 섀도우 차단 (사용자는 인지 못함)

#### 2.4 차단 해제
```http
DELETE {{baseUrl}}/api/moderator/bans-v2/1
Authorization: Bearer {{token}}
```

#### 2.5 콘텐츠 신고
```http
POST {{baseUrl}}/api/moderator/reports-v2
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "contentType": "post",
  "contentId": 10,
  "reason": "Inappropriate content",
  "description": "This post contains offensive language"
}
```

**contentType 옵션:**
- `post`: 게시물
- `comment`: 댓글
- `user`: 사용자 프로필

#### 2.6 신고 목록 조회
```http
GET {{baseUrl}}/api/moderator/reports-v2?status=pending
Authorization: Bearer {{token}}
```

**status 필터:**
- `pending`: 대기 중
- `approved`: 승인됨
- `rejected`: 거부됨

#### 2.7 신고 처리
```http
PUT {{baseUrl}}/api/moderator/reports-v2/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "action": "approved",
  "notes": "Removed inappropriate content"
}
```

#### 2.8 모더레이터 통계
```http
GET {{baseUrl}}/api/moderator/statistics
Authorization: Bearer {{token}}
```

---

### 3. 팔로우 시스템 API (14개)

#### 3.1 사용자 팔로우
```http
POST {{baseUrl}}/api/follow/user/2
Authorization: Bearer {{token}}
```

#### 3.2 사용자 언팔로우
```http
DELETE {{baseUrl}}/api/follow/user/2
Authorization: Bearer {{token}}
```

#### 3.3 팔로워 목록
```http
GET {{baseUrl}}/api/follow/user/1/followers?page=1&limit=20
Authorization: Bearer {{token}}
```

#### 3.4 팔로잉 목록
```http
GET {{baseUrl}}/api/follow/user/1/following?page=1&limit=20
Authorization: Bearer {{token}}
```

#### 3.5 팔로우 상태 확인
```http
GET {{baseUrl}}/api/follow/user/2/check
Authorization: Bearer {{token}}
```

#### 3.6 팔로우 통계
```http
GET {{baseUrl}}/api/follow/user/1/stats
Authorization: Bearer {{token}}
```

#### 3.7 게시판 팔로우
```http
POST {{baseUrl}}/api/follow/board/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "notificationEnabled": true
}
```

#### 3.8 게시판 언팔로우
```http
DELETE {{baseUrl}}/api/follow/board/1
Authorization: Bearer {{token}}
```

#### 3.9 팔로우한 게시판 목록
```http
GET {{baseUrl}}/api/follow/boards
Authorization: Bearer {{token}}
```

#### 3.10 게시판 팔로우 상태 확인
```http
GET {{baseUrl}}/api/follow/board/1/check
Authorization: Bearer {{token}}
```

#### 3.11 게시판 알림 설정
```http
PUT {{baseUrl}}/api/follow/board/1/notification
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "enabled": false
}
```

#### 3.12 인기 게시판
```http
GET {{baseUrl}}/api/follow/boards/popular?limit=10
Authorization: Bearer {{token}}
```

#### 3.13 사용자 팔로우 피드
```http
GET {{baseUrl}}/api/follow/feed/users?page=1&limit=20
Authorization: Bearer {{token}}
```

#### 3.14 게시판 팔로우 피드
```http
GET {{baseUrl}}/api/follow/feed/boards?page=1&limit=20
Authorization: Bearer {{token}}
```

---

### 4. 북마크 시스템 API (10개)

#### 4.1 폴더 목록 조회
```http
GET {{baseUrl}}/api/bookmarks/folders
Authorization: Bearer {{token}}
```

#### 4.2 폴더 생성
```http
POST {{baseUrl}}/api/bookmarks/folders
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Tech Articles",
  "description": "Technology and programming articles",
  "color": "#3182CE",
  "is_private": false
}
```

**색상 코드 예시:**
- Blue: `#3182CE`
- Green: `#38A169`
- Yellow: `#D69E2E`
- Red: `#E53E3E`
- Purple: `#805AD5`
- Orange: `#DD6B20`

#### 4.3 폴더 수정
```http
PUT {{baseUrl}}/api/bookmarks/folders/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Tech & Programming",
  "color": "#38A169"
}
```

#### 4.4 폴더 삭제
```http
DELETE {{baseUrl}}/api/bookmarks/folders/1
Authorization: Bearer {{token}}
```

**참고:** 'default' 폴더는 삭제할 수 없습니다.

#### 4.5 북마크 추가
```http
POST {{baseUrl}}/api/bookmarks
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "postId": 10,
  "folder": "Tech Articles",
  "notes": "Great article about React hooks"
}
```

#### 4.6 북마크 목록 조회
```http
GET {{baseUrl}}/api/bookmarks?page=1&limit=20&folder=Tech Articles
Authorization: Bearer {{token}}
```

**쿼리 파라미터:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지 크기 (기본값: 20)
- `folder`: 폴더 이름으로 필터링 (선택)

#### 4.7 북마크 상태 확인
```http
GET {{baseUrl}}/api/bookmarks/check/10
Authorization: Bearer {{token}}
```

**응답:**
```json
{
  "isBookmarked": true,
  "folder": "Tech Articles"
}
```

#### 4.8 북마크 메모 수정
```http
PUT {{baseUrl}}/api/bookmarks/1/notes
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "notes": "Updated notes: Excellent explanation of useEffect"
}
```

#### 4.9 북마크 폴더 이동
```http
PUT {{baseUrl}}/api/bookmarks/1/move
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "folder": "React Resources"
}
```

#### 4.10 북마크 삭제
```http
DELETE {{baseUrl}}/api/bookmarks/10
Authorization: Bearer {{token}}
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 사용자 온라인 상태
1. 로그인
2. 하트비트 업데이트 (5분마다)
3. 온라인 사용자 목록 조회
4. 특정 사용자 상태 확인

### 시나리오 2: 콘텐츠 모더레이션
1. 로그인 (모더레이터 계정)
2. 콘텐츠 신고 생성
3. 신고 목록 조회
4. 신고 처리 (승인/거부)
5. 필요시 사용자 경고/차단

### 시나리오 3: 사용자 팔로우
1. 로그인
2. 다른 사용자 팔로우
3. 팔로잉 목록 확인
4. 팔로우한 사용자의 게시물 피드 조회
5. 언팔로우

### 시나리오 4: 게시판 팔로우
1. 로그인
2. 게시판 팔로우 (알림 활성화)
3. 팔로우한 게시판 목록 확인
4. 게시판 피드 조회
5. 알림 설정 변경

### 시나리오 5: 북마크 관리
1. 로그인
2. 폴더 생성
3. 게시물 북마크 (폴더 지정)
4. 북마크 목록 조회
5. 메모 추가/수정
6. 다른 폴더로 이동
7. 북마크 삭제

---

## ✅ 성공 기준

### 각 API 엔드포인트는:
- [ ] 올바른 HTTP 상태 코드 반환 (200, 201, 204)
- [ ] 예상된 JSON 응답 구조
- [ ] 인증이 필요한 엔드포인트는 토큰 없이 401 반환
- [ ] 잘못된 데이터는 400/422 반환
- [ ] 권한 없는 작업은 403 반환
- [ ] 존재하지 않는 리소스는 404 반환

---

## 🐛 일반적인 오류

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```
**해결:** 로그인 후 토큰을 환경 변수에 설정하세요.

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```
**해결:** 모더레이터 권한이 필요한 엔드포인트입니다.

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```
**해결:** ID가 존재하는지 확인하세요.

### 422 Validation Error
```json
{
  "error": "Validation failed",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
```
**해결:** 요청 데이터 형식을 확인하세요.

---

## 📊 응답 시간 기준

모든 API는 다음 시간 내에 응답해야 합니다:
- GET 요청: < 200ms
- POST/PUT 요청: < 500ms
- DELETE 요청: < 300ms
- 페이지네이션 쿼리: < 300ms

---

## 🔍 데이터베이스 확인

테스트 후 MySQL에서 데이터 확인:

```sql
-- 온라인 상태
SELECT * FROM user_online_status WHERE user_id = 1;

-- 모더레이터 역할
SELECT * FROM moderator_roles WHERE user_id = 1;

-- 팔로우
SELECT * FROM user_follows WHERE follower_id = 1;
SELECT * FROM board_follows WHERE user_id = 1;

-- 북마크
SELECT * FROM bookmarks WHERE user_id = 1;
SELECT * FROM bookmark_folders WHERE user_id = 1;
```

---

## 📝 다음 단계

1. ✅ Thunder Client/Postman 컬렉션 임포트
2. ✅ 환경 변수 설정
3. ✅ 로그인 및 토큰 획득
4. ✅ 각 API 엔드포인트 순차 테스트
5. ✅ 시나리오 기반 통합 테스트
6. ✅ 프론트엔드와 연동 테스트

---

**작성자**: GitHub Copilot  
**작성일**: 2025년 11월 11일  
**API 엔드포인트 총 개수**: 43개
