# Social Features API Reference
# 소셜 기능 API 레퍼런스

**버전**: 2.0  
**Base URL**: `/api/social`  
**최종 업데이트**: 2025-11-10

---

## 📋 목차

1. [개요](#개요)
2. [인증](#인증)
3. [팔로우 API](#팔로우-api)
4. [멘션 API](#멘션-api)
5. [공유 API](#공유-api)
6. [차단 API](#차단-api)
7. [에러 코드](#에러-코드)
8. [Rate Limiting](#rate-limiting)

---

## 🎯 개요

### API 특징

- **RESTful**: REST 아키텍처 원칙 준수
- **JSON**: 모든 요청/응답은 JSON 형식
- **JWT 인증**: Bearer 토큰 기반 인증
- **Rate Limiting**: API 호출 제한 적용
- **Pagination**: 커서 기반 페이지네이션

### 공통 헤더

모든 API 요청에 다음 헤더가 필요합니다:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
Accept: application/json
```

### 응답 형식

#### 성공 응답

```json
{
  "success": true,
  "data": { /* 응답 데이터 */ },
  "message": "작업이 완료되었습니다"
}
```

#### 에러 응답

```json
{
  "success": false,
  "error": "에러 메시지",
  "code": "ERROR_CODE",
  "details": { /* 추가 정보 */ }
}
```

---

## 🔐 인증

### JWT 토큰 발급

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "username": "john_doe",
    "email": "user@example.com"
  }
}
```

### 토큰 사용

```http
GET /api/social/followers/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 👥 팔로우 API

### 1. 사용자 팔로우

사용자를 팔로우합니다.

```http
POST /api/social/follow/:userId
```

**Parameters**:
- `userId` (path, required): 팔로우할 사용자 ID

**Request**:
```http
POST /api/social/follow/456
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "팔로우 성공",
  "data": {
    "id": 789,
    "follower_id": 123,
    "following_id": 456,
    "created_at": "2025-11-10T10:30:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: 자기 자신을 팔로우하려고 시도
  ```json
  {
    "success": false,
    "error": "자기 자신을 팔로우할 수 없습니다",
    "code": "SELF_FOLLOW_ERROR"
  }
  ```
- `409 Conflict`: 이미 팔로우 중
  ```json
  {
    "success": false,
    "error": "이미 팔로우 중입니다",
    "code": "ALREADY_FOLLOWING"
  }
  ```
- `404 Not Found`: 사용자를 찾을 수 없음

---

### 2. 언팔로우

사용자를 언팔로우합니다.

```http
DELETE /api/social/follow/:userId
```

**Parameters**:
- `userId` (path, required): 언팔로우할 사용자 ID

**Request**:
```http
DELETE /api/social/follow/456
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "언팔로우 성공"
}
```

**Error Responses**:
- `404 Not Found`: 팔로우 관계가 존재하지 않음
  ```json
  {
    "success": false,
    "error": "팔로우 관계가 없습니다",
    "code": "NOT_FOLLOWING"
  }
  ```

---

### 3. 팔로우 상태 확인

두 사용자 간 팔로우 관계를 확인합니다.

```http
GET /api/social/follow/check/:userId
```

**Parameters**:
- `userId` (path, required): 확인할 사용자 ID

**Request**:
```http
GET /api/social/follow/check/456
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "isFollowing": true,
    "isFollowedBy": false,
    "isMutual": false
  }
}
```

**Response Fields**:
- `isFollowing`: 내가 상대방을 팔로우 중인지 여부
- `isFollowedBy`: 상대방이 나를 팔로우 중인지 여부
- `isMutual`: 서로 팔로우 중인지 여부

---

### 4. 팔로워 목록 조회

특정 사용자의 팔로워 목록을 조회합니다.

```http
GET /api/social/followers/:userId
```

**Parameters**:
- `userId` (path, required): 사용자 ID
- `cursor` (query, optional): 페이지네이션 커서
- `limit` (query, optional): 한 번에 가져올 항목 수 (기본값: 20, 최대: 100)

**Request**:
```http
GET /api/social/followers/456?limit=20
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "followers": [
      {
        "id": 1,
        "follower_id": 123,
        "follower": {
          "id": 123,
          "username": "john_doe",
          "profile_image": "https://example.com/avatar/123.jpg",
          "bio": "Developer"
        },
        "created_at": "2025-11-10T10:30:00Z"
      },
      {
        "id": 2,
        "follower_id": 789,
        "follower": {
          "id": 789,
          "username": "jane_smith",
          "profile_image": "https://example.com/avatar/789.jpg",
          "bio": "Designer"
        },
        "created_at": "2025-11-09T15:20:00Z"
      }
    ],
    "pagination": {
      "nextCursor": 2,
      "hasMore": true,
      "total": 150
    }
  }
}
```

---

### 5. 팔로잉 목록 조회

특정 사용자가 팔로우 중인 사용자 목록을 조회합니다.

```http
GET /api/social/following/:userId
```

**Parameters**:
- `userId` (path, required): 사용자 ID
- `cursor` (query, optional): 페이지네이션 커서
- `limit` (query, optional): 한 번에 가져올 항목 수 (기본값: 20, 최대: 100)

**Request**:
```http
GET /api/social/following/123?limit=20
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "following": [
      {
        "id": 1,
        "following_id": 456,
        "following": {
          "id": 456,
          "username": "alice_wonder",
          "profile_image": "https://example.com/avatar/456.jpg",
          "bio": "Content Creator"
        },
        "created_at": "2025-11-08T09:15:00Z"
      }
    ],
    "pagination": {
      "nextCursor": 1,
      "hasMore": true,
      "total": 85
    }
  }
}
```

---

### 6. 팔로우 통계

특정 사용자의 팔로우 통계를 조회합니다.

```http
GET /api/social/follow/stats/:userId
```

**Parameters**:
- `userId` (path, required): 사용자 ID

**Request**:
```http
GET /api/social/follow/stats/123
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "followerCount": 150,
    "followingCount": 85,
    "mutualFollowCount": 42,
    "growthRate": {
      "daily": 3,
      "weekly": 18,
      "monthly": 45
    }
  }
}
```

**Response Fields**:
- `followerCount`: 팔로워 수
- `followingCount`: 팔로잉 수
- `mutualFollowCount`: 서로 팔로우 수
- `growthRate`: 증가율 (일/주/월)

---

### 7. 팔로우 추천

추천 팔로우 목록을 조회합니다.

```http
GET /api/social/follow/suggestions
```

**Parameters**:
- `limit` (query, optional): 추천 수 (기본값: 10, 최대: 50)
- `algorithm` (query, optional): 추천 알고리즘 (`popular`, `active`, `similar`) (기본값: `popular`)

**Request**:
```http
GET /api/social/follow/suggestions?limit=10&algorithm=popular
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "user": {
          "id": 789,
          "username": "influencer_one",
          "profile_image": "https://example.com/avatar/789.jpg",
          "bio": "Tech enthusiast",
          "followerCount": 10500
        },
        "reason": "인기 사용자",
        "mutualFollowers": 12,
        "score": 95
      },
      {
        "user": {
          "id": 321,
          "username": "content_creator",
          "profile_image": "https://example.com/avatar/321.jpg",
          "bio": "Daily tech tips",
          "followerCount": 8200
        },
        "reason": "활발한 활동",
        "mutualFollowers": 8,
        "score": 88
      }
    ],
    "algorithm": "popular"
  }
}
```

**Algorithm Options**:
- `popular`: 팔로워가 많은 인기 사용자
- `active`: 최근 활동이 활발한 사용자
- `similar`: 관심사가 비슷한 사용자

---

### 8. 상호 팔로우 확인

여러 사용자와의 팔로우 관계를 일괄 확인합니다.

```http
POST /api/social/follow/check-multiple
```

**Request Body**:
```json
{
  "userIds": [456, 789, 321, 654]
}
```

**Request**:
```http
POST /api/social/follow/check-multiple
Authorization: Bearer <token>
Content-Type: application/json

{
  "userIds": [456, 789, 321, 654]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "relationships": [
      {
        "userId": 456,
        "isFollowing": true,
        "isFollowedBy": false,
        "isMutual": false
      },
      {
        "userId": 789,
        "isFollowing": true,
        "isFollowedBy": true,
        "isMutual": true
      },
      {
        "userId": 321,
        "isFollowing": false,
        "isFollowedBy": true,
        "isMutual": false
      },
      {
        "userId": 654,
        "isFollowing": false,
        "isFollowedBy": false,
        "isMutual": false
      }
    ]
  }
}
```

**Validation**:
- `userIds`: 배열, 1~100개의 사용자 ID

---

## 💬 멘션 API

### 1. 멘션 생성

게시물이나 댓글에서 사용자를 멘션합니다.

```http
POST /api/social/mentions
```

**Request Body**:
```json
{
  "mentionedUserId": 456,
  "postId": 789,
  "commentId": null
}
```

**Request**:
```http
POST /api/social/mentions
Authorization: Bearer <token>
Content-Type: application/json

{
  "mentionedUserId": 456,
  "postId": 789,
  "commentId": null
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "멘션 생성 완료",
  "data": {
    "id": 123,
    "mentioner_id": 123,
    "mentioned_user_id": 456,
    "post_id": 789,
    "comment_id": null,
    "is_read": false,
    "created_at": "2025-11-10T11:00:00Z"
  }
}
```

**Validation**:
- `mentionedUserId`: 필수, 정수
- `postId`: 선택, 정수 (postId 또는 commentId 중 하나는 필수)
- `commentId`: 선택, 정수

**Error Responses**:
- `400 Bad Request`: 필수 필드 누락
- `404 Not Found`: 멘션된 사용자 또는 게시물을 찾을 수 없음
- `409 Conflict`: 중복 멘션 (이미 동일한 멘션 존재)

---

### 2. 내 멘션 목록 조회

현재 사용자가 받은 멘션 목록을 조회합니다.

```http
GET /api/social/mentions
```

**Parameters**:
- `isRead` (query, optional): 읽음 상태 필터 (`true`, `false`, `all`) (기본값: `all`)
- `cursor` (query, optional): 페이지네이션 커서
- `limit` (query, optional): 한 번에 가져올 항목 수 (기본값: 20, 최대: 100)

**Request**:
```http
GET /api/social/mentions?isRead=false&limit=20
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "mentions": [
      {
        "id": 123,
        "mentioner": {
          "id": 789,
          "username": "alice_wonder",
          "profile_image": "https://example.com/avatar/789.jpg"
        },
        "post": {
          "id": 456,
          "title": "멘션된 게시물",
          "content": "@john_doe 이거 확인해보세요!",
          "created_at": "2025-11-10T10:30:00Z"
        },
        "comment": null,
        "is_read": false,
        "created_at": "2025-11-10T10:30:00Z"
      },
      {
        "id": 124,
        "mentioner": {
          "id": 321,
          "username": "bob_builder",
          "profile_image": "https://example.com/avatar/321.jpg"
        },
        "post": {
          "id": 457,
          "title": "Another post",
          "content": "Hey @john_doe, what do you think?",
          "created_at": "2025-11-09T15:00:00Z"
        },
        "comment": {
          "id": 890,
          "content": "@john_doe Great idea!"
        },
        "is_read": false,
        "created_at": "2025-11-09T15:00:00Z"
      }
    ],
    "pagination": {
      "nextCursor": 124,
      "hasMore": true,
      "total": 45
    }
  }
}
```

---

### 3. 멘션 읽음 처리

특정 멘션을 읽음 상태로 변경합니다.

```http
PUT /api/social/mentions/:mentionId/read
```

**Parameters**:
- `mentionId` (path, required): 멘션 ID

**Request**:
```http
PUT /api/social/mentions/123/read
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "멘션을 읽음 처리했습니다",
  "data": {
    "id": 123,
    "is_read": true,
    "read_at": "2025-11-10T11:30:00Z"
  }
}
```

**Error Responses**:
- `404 Not Found`: 멘션을 찾을 수 없음
- `403 Forbidden`: 본인의 멘션이 아님

---

### 4. 멘션 일괄 읽음 처리

여러 멘션을 한 번에 읽음 처리합니다.

```http
PUT /api/social/mentions/read-multiple
```

**Request Body**:
```json
{
  "mentionIds": [123, 124, 125]
}
```

**Request**:
```http
PUT /api/social/mentions/read-multiple
Authorization: Bearer <token>
Content-Type: application/json

{
  "mentionIds": [123, 124, 125]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "3개의 멘션을 읽음 처리했습니다",
  "data": {
    "updatedCount": 3,
    "mentionIds": [123, 124, 125]
  }
}
```

**Validation**:
- `mentionIds`: 배열, 1~100개의 멘션 ID

---

### 5. 멘션 통계

현재 사용자의 멘션 통계를 조회합니다.

```http
GET /api/social/mentions/stats
```

**Request**:
```http
GET /api/social/mentions/stats
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalCount": 150,
    "unreadCount": 12,
    "readCount": 138,
    "todayCount": 5,
    "weekCount": 28,
    "monthCount": 89,
    "topMentioners": [
      {
        "userId": 789,
        "username": "alice_wonder",
        "count": 15
      },
      {
        "userId": 321,
        "username": "bob_builder",
        "count": 12
      }
    ]
  }
}
```

---

### 6. 사용자 검색 (멘션용)

멘션 자동완성을 위한 사용자 검색입니다.

```http
GET /api/social/mentions/search-users
```

**Parameters**:
- `query` (query, required): 검색 쿼리 (최소 2자)
- `limit` (query, optional): 결과 수 (기본값: 10, 최대: 20)

**Request**:
```http
GET /api/social/mentions/search-users?query=joh&limit=10
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 123,
        "username": "john_doe",
        "displayName": "John Doe",
        "profile_image": "https://example.com/avatar/123.jpg",
        "bio": "Developer",
        "followerCount": 150,
        "isFollowing": true
      },
      {
        "id": 456,
        "username": "johnny_appleseed",
        "displayName": "Johnny Appleseed",
        "profile_image": "https://example.com/avatar/456.jpg",
        "bio": "Designer",
        "followerCount": 89,
        "isFollowing": false
      }
    ],
    "query": "joh"
  }
}
```

**Search Algorithm**:
1. 내가 팔로우하는 사용자 우선
2. Username 매칭
3. Display name 매칭
4. 팔로워 수 기준 정렬

---

### 7. 멘션 삭제

특정 멘션을 삭제합니다.

```http
DELETE /api/social/mentions/:mentionId
```

**Parameters**:
- `mentionId` (path, required): 멘션 ID

**Request**:
```http
DELETE /api/social/mentions/123
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "멘션이 삭제되었습니다"
}
```

**Error Responses**:
- `404 Not Found`: 멘션을 찾을 수 없음
- `403 Forbidden`: 삭제 권한 없음 (멘션을 만든 사용자 또는 멘션된 사용자만 삭제 가능)

---

## 📤 공유 API

### 1. 게시물 공유

게시물을 외부 플랫폼으로 공유합니다.

```http
POST /api/social/share
```

**Request Body**:
```json
{
  "postId": 789,
  "platform": "twitter"
}
```

**Request**:
```http
POST /api/social/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "postId": 789,
  "platform": "twitter"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "공유가 기록되었습니다",
  "data": {
    "id": 456,
    "post_id": 789,
    "user_id": 123,
    "platform": "twitter",
    "shared_at": "2025-11-10T12:00:00Z",
    "shareUrl": "https://twitter.com/intent/tweet?text=..."
  }
}
```

**Validation**:
- `postId`: 필수, 정수
- `platform`: 필수, 열거형 (`twitter`, `facebook`, `linkedin`, `clipboard`)

**Error Responses**:
- `400 Bad Request`: 잘못된 플랫폼
- `404 Not Found`: 게시물을 찾을 수 없음
- `429 Too Many Requests`: Rate limit 초과 (시간당 최대 100회)

---

### 2. 공유 통계 조회

특정 게시물의 공유 통계를 조회합니다.

```http
GET /api/social/share/stats/:postId
```

**Parameters**:
- `postId` (path, required): 게시물 ID

**Request**:
```http
GET /api/social/share/stats/789
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "postId": 789,
    "totalShares": 245,
    "platforms": {
      "twitter": 120,
      "facebook": 85,
      "linkedin": 30,
      "clipboard": 10
    },
    "recentShares": [
      {
        "user": {
          "id": 123,
          "username": "john_doe",
          "profile_image": "https://example.com/avatar/123.jpg"
        },
        "platform": "twitter",
        "shared_at": "2025-11-10T11:55:00Z"
      },
      {
        "user": {
          "id": 456,
          "username": "alice_wonder",
          "profile_image": "https://example.com/avatar/456.jpg"
        },
        "platform": "facebook",
        "shared_at": "2025-11-10T11:50:00Z"
      }
    ],
    "trend": {
      "hourly": 12,
      "daily": 89,
      "weekly": 245
    }
  }
}
```

---

### 3. 인기 게시물 조회 (공유 기준)

공유가 많은 인기 게시물을 조회합니다.

```http
GET /api/social/share/trending
```

**Parameters**:
- `period` (query, optional): 기간 (`day`, `week`, `month`, `all`) (기본값: `week`)
- `limit` (query, optional): 결과 수 (기본값: 10, 최대: 50)
- `platform` (query, optional): 플랫폼 필터 (선택 시 해당 플랫폼 공유만 집계)

**Request**:
```http
GET /api/social/share/trending?period=week&limit=10
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "post": {
          "id": 789,
          "title": "인기 게시물 제목",
          "content": "게시물 내용...",
          "author": {
            "id": 456,
            "username": "alice_wonder",
            "profile_image": "https://example.com/avatar/456.jpg"
          },
          "created_at": "2025-11-08T09:00:00Z"
        },
        "shareCount": 245,
        "platforms": {
          "twitter": 120,
          "facebook": 85,
          "linkedin": 30,
          "clipboard": 10
        },
        "rank": 1
      },
      {
        "post": {
          "id": 790,
          "title": "두 번째 인기 게시물",
          "content": "내용...",
          "author": {
            "id": 321,
            "username": "bob_builder",
            "profile_image": "https://example.com/avatar/321.jpg"
          },
          "created_at": "2025-11-09T14:00:00Z"
        },
        "shareCount": 189,
        "platforms": {
          "twitter": 95,
          "facebook": 64,
          "linkedin": 25,
          "clipboard": 5
        },
        "rank": 2
      }
    ],
    "period": "week",
    "totalPosts": 10
  }
}
```

---

### 4. 내 공유 기록 조회

현재 사용자의 공유 기록을 조회합니다.

```http
GET /api/social/share/my-shares
```

**Parameters**:
- `platform` (query, optional): 플랫폼 필터
- `cursor` (query, optional): 페이지네이션 커서
- `limit` (query, optional): 한 번에 가져올 항목 수 (기본값: 20, 최대: 100)

**Request**:
```http
GET /api/social/share/my-shares?platform=twitter&limit=20
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "shares": [
      {
        "id": 456,
        "post": {
          "id": 789,
          "title": "공유한 게시물",
          "content": "게시물 내용...",
          "author": {
            "id": 123,
            "username": "john_doe"
          }
        },
        "platform": "twitter",
        "shared_at": "2025-11-10T11:30:00Z"
      }
    ],
    "pagination": {
      "nextCursor": 456,
      "hasMore": true,
      "total": 78
    },
    "stats": {
      "totalShares": 78,
      "platforms": {
        "twitter": 45,
        "facebook": 20,
        "linkedin": 10,
        "clipboard": 3
      }
    }
  }
}
```

---

### 5. 플랫폼별 공유 URL 생성

각 소셜 미디어 플랫폼의 공유 URL을 생성합니다.

```http
GET /api/social/share/url/:postId
```

**Parameters**:
- `postId` (path, required): 게시물 ID
- `platform` (query, required): 플랫폼 (`twitter`, `facebook`, `linkedin`)

**Request**:
```http
GET /api/social/share/url/789?platform=twitter
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "platform": "twitter",
    "shareUrl": "https://twitter.com/intent/tweet?text=인기%20게시물%20제목&url=https://community.example.com/posts/789",
    "postUrl": "https://community.example.com/posts/789"
  }
}
```

**URL Formats**:
- **Twitter**: `https://twitter.com/intent/tweet?text={title}&url={postUrl}`
- **Facebook**: `https://www.facebook.com/sharer/sharer.php?u={postUrl}`
- **LinkedIn**: `https://www.linkedin.com/sharing/share-offsite/?url={postUrl}`

---

### 6. 공유 삭제

공유 기록을 삭제합니다. (통계에서 제외됨)

```http
DELETE /api/social/share/:shareId
```

**Parameters**:
- `shareId` (path, required): 공유 ID

**Request**:
```http
DELETE /api/social/share/456
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "공유 기록이 삭제되었습니다"
}
```

**Error Responses**:
- `404 Not Found`: 공유 기록을 찾을 수 없음
- `403 Forbidden`: 본인의 공유 기록이 아님

---

## 🚫 차단 API

### 1. 사용자 차단

특정 사용자를 차단합니다.

```http
POST /api/social/block/:userId
```

**Parameters**:
- `userId` (path, required): 차단할 사용자 ID

**Request Body** (optional):
```json
{
  "reason": "스팸 게시물"
}
```

**Request**:
```http
POST /api/social/block/456
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "스팸 게시물"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "사용자를 차단했습니다",
  "data": {
    "id": 789,
    "blocker_id": 123,
    "blocked_id": 456,
    "reason": "스팸 게시물",
    "created_at": "2025-11-10T13:00:00Z"
  }
}
```

**Validation**:
- `reason`: 선택, 문자열 (최대 255자)

**Error Responses**:
- `400 Bad Request`: 자기 자신을 차단하려고 시도
  ```json
  {
    "success": false,
    "error": "자기 자신을 차단할 수 없습니다",
    "code": "SELF_BLOCK_ERROR"
  }
  ```
- `409 Conflict`: 이미 차단 중
  ```json
  {
    "success": false,
    "error": "이미 차단된 사용자입니다",
    "code": "ALREADY_BLOCKED"
  }
  ```

**Side Effects**:
- 차단된 사용자는 차단자의 게시물을 볼 수 없음
- 서로의 팔로우 관계가 자동으로 해제됨
- 과거 댓글은 "[차단된 사용자]"로 표시됨
- 멘션 및 알림이 차단됨

---

### 2. 차단 해제

차단된 사용자를 해제합니다.

```http
DELETE /api/social/block/:userId
```

**Parameters**:
- `userId` (path, required): 차단 해제할 사용자 ID

**Request**:
```http
DELETE /api/social/block/456
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "차단을 해제했습니다"
}
```

**Error Responses**:
- `404 Not Found`: 차단 관계가 존재하지 않음
  ```json
  {
    "success": false,
    "error": "차단 관계가 없습니다",
    "code": "NOT_BLOCKED"
  }
  ```

---

### 3. 차단 상태 확인

특정 사용자와의 차단 관계를 확인합니다.

```http
GET /api/social/block/check/:userId
```

**Parameters**:
- `userId` (path, required): 확인할 사용자 ID

**Request**:
```http
GET /api/social/block/check/456
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "isBlocked": true,
    "isBlockedBy": false,
    "isBidirectional": false,
    "blockInfo": {
      "blockedAt": "2025-11-10T13:00:00Z",
      "reason": "스팸 게시물"
    }
  }
}
```

**Response Fields**:
- `isBlocked`: 내가 상대방을 차단했는지 여부
- `isBlockedBy`: 상대방이 나를 차단했는지 여부
- `isBidirectional`: 서로 차단했는지 여부
- `blockInfo`: 차단 정보 (내가 차단한 경우에만 표시)

---

### 4. 차단 목록 조회

현재 사용자가 차단한 사용자 목록을 조회합니다.

```http
GET /api/social/blocked-users
```

**Parameters**:
- `search` (query, optional): 검색 쿼리 (username 검색)
- `sortBy` (query, optional): 정렬 기준 (`date`, `username`) (기본값: `date`)
- `cursor` (query, optional): 페이지네이션 커서
- `limit` (query, optional): 한 번에 가져올 항목 수 (기본값: 20, 최대: 100)

**Request**:
```http
GET /api/social/blocked-users?sortBy=date&limit=20
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "blockedUsers": [
      {
        "id": 789,
        "blocked_user": {
          "id": 456,
          "username": "spam_user",
          "profile_image": "https://example.com/avatar/456.jpg",
          "bio": "Spammer"
        },
        "reason": "스팸 게시물",
        "created_at": "2025-11-10T13:00:00Z"
      },
      {
        "id": 790,
        "blocked_user": {
          "id": 321,
          "username": "troll_account",
          "profile_image": "https://example.com/avatar/321.jpg",
          "bio": "Troll"
        },
        "reason": "부적절한 댓글",
        "created_at": "2025-11-09T10:30:00Z"
      }
    ],
    "pagination": {
      "nextCursor": 790,
      "hasMore": true,
      "total": 15
    }
  }
}
```

---

### 5. 차단 통계

현재 사용자의 차단 통계를 조회합니다.

```http
GET /api/social/block/stats
```

**Request**:
```http
GET /api/social/block/stats
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalBlocked": 15,
    "blockedByCount": 2,
    "recentBlocks": 3,
    "topReasons": [
      {
        "reason": "스팸",
        "count": 8
      },
      {
        "reason": "부적절한 댓글",
        "count": 4
      },
      {
        "reason": "괴롭힘",
        "count": 3
      }
    ],
    "timeline": {
      "thisWeek": 3,
      "thisMonth": 7,
      "total": 15
    }
  }
}
```

**Response Fields**:
- `totalBlocked`: 내가 차단한 사용자 수
- `blockedByCount`: 나를 차단한 사용자 수 (추정치)
- `recentBlocks`: 최근 7일간 차단 수
- `topReasons`: 차단 사유 상위 3개
- `timeline`: 시간대별 차단 수

---

## ❌ 에러 코드

### HTTP 상태 코드

| 코드 | 설명                  | 예시                             |
| ---- | --------------------- | -------------------------------- |
| 200  | OK                    | 성공적인 GET, PUT, DELETE 요청   |
| 201  | Created               | 성공적인 POST 요청 (리소스 생성) |
| 400  | Bad Request           | 잘못된 요청 파라미터             |
| 401  | Unauthorized          | 인증 실패 또는 토큰 누락         |
| 403  | Forbidden             | 권한 없음                        |
| 404  | Not Found             | 리소스를 찾을 수 없음            |
| 409  | Conflict              | 중복 또는 충돌                   |
| 429  | Too Many Requests     | Rate limit 초과                  |
| 500  | Internal Server Error | 서버 오류                        |

### 커스텀 에러 코드

#### 팔로우 관련

| 코드                    | 설명                          |
| ----------------------- | ----------------------------- |
| `SELF_FOLLOW_ERROR`     | 자기 자신을 팔로우하려고 시도 |
| `ALREADY_FOLLOWING`     | 이미 팔로우 중                |
| `NOT_FOLLOWING`         | 팔로우 관계가 없음            |
| `FOLLOW_LIMIT_EXCEEDED` | 팔로우 한도 초과 (일일 100명) |

#### 멘션 관련

| 코드                     | 설명                |
| ------------------------ | ------------------- |
| `DUPLICATE_MENTION`      | 중복 멘션           |
| `INVALID_MENTION_TARGET` | 잘못된 멘션 대상    |
| `MENTION_NOT_FOUND`      | 멘션을 찾을 수 없음 |

#### 공유 관련

| 코드                   | 설명                              |
| ---------------------- | --------------------------------- |
| `INVALID_PLATFORM`     | 지원하지 않는 플랫폼              |
| `SHARE_LIMIT_EXCEEDED` | 공유 한도 초과 (시간당 100회)     |
| `POST_NOT_SHAREABLE`   | 공유할 수 없는 게시물 (비공개 등) |

#### 차단 관련

| 코드                   | 설명                         |
| ---------------------- | ---------------------------- |
| `SELF_BLOCK_ERROR`     | 자기 자신을 차단하려고 시도  |
| `ALREADY_BLOCKED`      | 이미 차단된 사용자           |
| `NOT_BLOCKED`          | 차단 관계가 없음             |
| `BLOCK_LIMIT_EXCEEDED` | 차단 한도 초과 (최대 1000명) |

### 에러 응답 예시

```json
{
  "success": false,
  "error": "이미 팔로우 중입니다",
  "code": "ALREADY_FOLLOWING",
  "details": {
    "userId": 456,
    "followedAt": "2025-11-08T10:00:00Z"
  },
  "timestamp": "2025-11-10T14:00:00Z",
  "path": "/api/social/follow/456"
}
```

---

## 🚦 Rate Limiting

### 제한 정책

| 엔드포인트       | 제한  | 윈도우 | 초과 시  |
| ---------------- | ----- | ------ | -------- |
| 팔로우 생성/삭제 | 60회  | 1시간  | 429 에러 |
| 멘션 생성        | 100회 | 1시간  | 429 에러 |
| 공유 생성        | 100회 | 1시간  | 429 에러 |
| 차단 생성/삭제   | 20회  | 1시간  | 429 에러 |
| 조회 API         | 300회 | 1시간  | 429 에러 |

### Rate Limit 헤더

모든 응답에 다음 헤더가 포함됩니다:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699614000
```

### Rate Limit 초과 응답

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 60,
    "remaining": 0,
    "resetAt": "2025-11-10T15:00:00Z"
  },
  "retryAfter": 3600
}
```

---

## 📚 데이터 타입

### User 객체

```typescript
interface User {
  id: number;
  username: string;
  displayName?: string;
  email?: string;
  profile_image?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  created_at: string;
}
```

### Follow 객체

```typescript
interface Follow {
  id: number;
  follower_id: number;
  following_id: number;
  follower?: User;
  following?: User;
  created_at: string;
}
```

### Mention 객체

```typescript
interface Mention {
  id: number;
  mentioner_id: number;
  mentioned_user_id: number;
  post_id?: number;
  comment_id?: number;
  mentioner?: User;
  mentioned_user?: User;
  post?: Post;
  comment?: Comment;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}
```

### Share 객체

```typescript
interface Share {
  id: number;
  post_id: number;
  user_id?: number;
  platform: 'twitter' | 'facebook' | 'linkedin' | 'clipboard';
  post?: Post;
  user?: User;
  shared_at: string;
}
```

### Block 객체

```typescript
interface Block {
  id: number;
  blocker_id: number;
  blocked_id: number;
  reason?: string;
  blocker?: User;
  blocked_user?: User;
  created_at: string;
}
```

### Pagination 객체

```typescript
interface Pagination {
  nextCursor?: number | string;
  prevCursor?: number | string;
  hasMore: boolean;
  total?: number;
  limit: number;
}
```

---

## 🔄 버전 관리

### API 버전

현재 버전: **v2.0**

Base URL에 버전 포함: `/api/v2/social/*`

### 버전 정책

- **Major 버전** (v2.0 → v3.0): Breaking changes
- **Minor 버전** (v2.0 → v2.1): 새로운 기능 추가 (하위 호환)
- **Patch 버전** (v2.0.0 → v2.0.1): 버그 수정

### Deprecation 정책

- 최소 6개월 전 deprecation 공지
- 응답 헤더에 deprecation 경고 포함
- 문서에 대체 API 명시

---

## 📞 지원

### 문의

- **API 문서**: https://docs.community.example.com
- **이슈 트래커**: https://github.com/community/issues
- **이메일**: api-support@community.example.com
- **Slack**: #api-support

### 변경 로그

변경 사항은 [CHANGELOG.md](./CHANGELOG.md)를 참조하세요.

---

**API 버전**: 2.0  
**최종 업데이트**: 2025-11-10  
**담당자**: Backend Team
