# 📖 Community Platform v1.1 - API 사용 가이드

## 📋 목차
1. 프로바이더 목록 조회
2. 로그인 (Mock / Google)
3. 현재 사용자 조회 (/me)
4. Refresh 토큰 회전 (Body/쿠키)
5. 계정 링크 (Account Linking)
6. Boards & Posts 기본 CRUD + 검색
7. Announcements / Events (Moderator & Admin)
8. Moderator 승격
9. Metrics & Prometheus
10. 게임 센터 API
11. VIP 시스템 API
12. 채팅 시스템 API
13. 투표 시스템 API
14. TODO 관리 API

---

## 1. 프로바이더 목록 조회

### GET /api/auth/providers

**응답:**
```json
{
  "providers": [
    {
      "id": "mock",
      "name": "Mock Provider",
      "enabled": true
    },
    {
      "id": "google",
      "name": "Google",
      "enabled": true
    }
  ]
}
```

## 2. 로그인 (Mock / Google)

### POST /api/auth/login

**요청 본문:**
```json
{
  "provider": "mock",
  "email": "admin@example.com"
}
```

**응답:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "admin@example.com",
    "name": "관리자",
    "role": "admin"
  },
  "tokens": {
    "access_token": "eyJ...",
    "refresh_token": "refresh_..."
  }
}
```

## 3. 현재 사용자 조회 (/me)

### GET /api/auth/me

**헤더:**
```
Authorization: Bearer eyJ...
```

**응답:**
```json
{
  "id": "user_123",
  "email": "admin@example.com",
  "name": "관리자",
  "role": "admin",
  "created_at": "2025-01-01T00:00:00Z"
}
```

## 4. Refresh 토큰 회전

### POST /api/auth/refresh

**요청 본문:**
```json
{
  "refresh_token": "refresh_..."
}
```

**응답:**
```json
{
  "access_token": "new_eyJ...",
  "refresh_token": "new_refresh_..."
}
```

## 5. 계정 링크 (Account Linking)

### POST /api/auth/link

**요청 본문:**
```json
{
  "provider": "google",
  "provider_token": "google_token_..."
}
```

## 6. Boards & Posts 기본 CRUD + 검색

### GET /api/boards
게시판 목록 조회

### GET /api/boards/:id/posts
특정 게시판의 게시글 목록

### POST /api/posts
새 게시글 작성

### GET /api/posts/:id
게시글 상세 조회

### PUT /api/posts/:id
게시글 수정

### DELETE /api/posts/:id
게시글 삭제

### GET /api/search
게시글 검색

## 7. Announcements / Events (Moderator & Admin)

### GET /api/announcements
공지사항 목록

### POST /api/announcements
공지사항 작성 (관리자 전용)

### GET /api/events
이벤트 목록

### POST /api/events
이벤트 작성 (관리자 전용)

## 8. Moderator 승격

### POST /api/admin/promote-moderator
사용자를 모더레이터로 승격 (관리자 전용)

## 9. Metrics & Prometheus

### GET /metrics
Prometheus 메트릭 엔드포인트

## 10. 게임 센터 API

### GET /api/community-games
게임 목록 조회

### POST /api/community-games/score
게임 점수 제출

### GET /api/community-games/leaderboard
리더보드 조회

## 11. VIP 시스템 API

### GET /api/vip-system
VIP 시스템 정보 조회

### POST /api/vip-system/upgrade
VIP 등급 업그레이드

### GET /api/vip-system/benefits
VIP 혜택 조회

## 12. 채팅 시스템 API

### GET /api/chat/rooms
채팅방 목록

### POST /api/chat/rooms
새 채팅방 생성

### GET /api/chat/messages/:roomId
채팅 메시지 조회

### POST /api/chat/messages
메시지 전송

## 13. 투표 시스템 API

### GET /api/voting
투표 목록 조회

### POST /api/voting
새 투표 생성

### POST /api/voting/:id/vote
투표 참여

### GET /api/voting/:id/results
투표 결과 조회

## 14. TODO 관리 API

### GET /api/todos
TODO 목록 조회

### POST /api/todos
새 TODO 생성

### PUT /api/todos/:id
TODO 수정

### DELETE /api/todos/:id
TODO 삭제

---

## 🔒 인증 및 권한

모든 API는 JWT 토큰 기반 인증을 사용합니다:

```
Authorization: Bearer <access_token>
```

### 권한 레벨:
- **user**: 일반 사용자
- **moderator**: 모더레이터 
- **admin**: 관리자

## 📊 응답 형식

모든 API 응답은 UTF-8 인코딩을 사용하며, 다음 형식을 따릅니다:

### 성공 응답:
```json
{
  "success": true,
  "data": { ... },
  "message": "성공 메시지"
}
```

### 오류 응답:
```json
{
  "success": false,
  "error": "오류 코드",
  "message": "오류 메시지"
}
```

## 🌐 엔드포인트 정보

- **기본 URL**: `http://localhost:50000`
- **API 버전**: v1.1
- **인코딩**: UTF-8
- **응답 형식**: JSON