# 🔌 Community Platform v1.1 API Reference

**Community Platform v1.1**의 완전한 API 문서입니다. 모든 엔드포인트가 UTF-8을 완벽 지원하며 최적화된 성능을 제공합니다.

## 📋 **v1.1 업데이트 내용**
- ✅ **UTF-8 완전 지원**: 모든 API 응답 UTF-8 인코딩
- ✅ **최적화된 엔드포인트**: 성능 향상 및 응답 시간 단축  
- ✅ **완벽한 매핑**: Frontend ↔ Backend 완전 연동

## 🌐 기본 URL
- **개발**: `http://localhost:50000`
- **프로덕션**: `https://api.communityhub.com`

## 인증

API는 인증을 위해 JWT(JSON Web Tokens)를 사용합니다. Authorization 헤더에 토큰을 포함하세요:

```
Authorization: Bearer <your-jwt-token>
```

## 응답 형식

모든 API 응답은 일관된 형식을 따릅니다:

### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "작업이 성공적으로 완료되었습니다"
}
```

### 오류 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사람이 읽을 수 있는 오류 메시지",
    "details": { ... }
  }
}
```

## 상태 코드

- `200` - 성공
- `201` - 생성됨
- `400` - 잘못된 요청
- `401` - 인증되지 않음
- `403` - 금지됨
- `404` - 찾을 수 없음
- `500` - 내부 서버 오류

## 엔드포인트

### 인증

#### 로그인
```http
POST /api/auth/login
```

**요청 본문:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "username",
      "profile": { ... }
    }
  }
}
```

#### 회원가입
```http
POST /api/auth/register
```

**요청 본문:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "displayName": "표시 이름"
}
```

#### 로그아웃
```http
POST /api/auth/logout
```

**헤더:**
```
Authorization: Bearer <token>
```

### 커뮤니티

#### 커뮤니티 목록 조회
```http
GET /api/communities
```

**쿼리 매개변수:**
- `page` (선택사항): 페이지 번호 (기본값: 1)
- `limit` (선택사항): 페이지당 항목 수 (기본값: 20)
- `search` (선택사항): 검색어

**응답:**
```json
{
  "success": true,
  "data": {
    "communities": [
      {
        "id": 1,
        "name": "게임 커뮤니티",
        "description": "게이머들을 위한 커뮤니티",
        "memberCount": 1250,
        "postCount": 5432,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### 커뮤니티 상세 조회
```http
GET /api/communities/:id
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "게임 커뮤니티",
    "description": "게이머들을 위한 커뮤니티",
    "memberCount": 1250,
    "postCount": 5432,
    "boards": [
      {
        "id": 1,
        "name": "일반 토론",
        "description": "일반적인 게임 토론",
        "postCount": 1234
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 게시판

#### 게시판 목록 조회
```http
GET /api/boards
```

**쿼리 매개변수:**
- `communityId` (선택사항): 커뮤니티별 필터링
- `page` (선택사항): 페이지 번호
- `limit` (선택사항): 페이지당 항목 수

#### 게시판 상세 조회
```http
GET /api/boards/:id
```

#### 게시판 게시물 조회
```http
GET /api/boards/:id/posts
```

**쿼리 매개변수:**
- `page` (선택사항): 페이지 번호
- `limit` (선택사항): 페이지당 항목 수
- `sort` (선택사항): 정렬 순서 (newest, oldest, popular)
- `search` (선택사항): 검색어
- `tags` (선택사항): 태그별 필터링 (쉼표로 구분)

### 게시물

#### 게시물 목록 조회
```http
GET /api/posts
```

**쿼리 매개변수:**
- `boardId` (선택사항): 게시판별 필터링
- `userId` (선택사항): 작성자별 필터링
- `page` (선택사항): 페이지 번호
- `limit` (선택사항): 페이지당 항목 수
- `sort` (선택사항): 정렬 순서
- `search` (선택사항): 검색어
- `tags` (선택사항): 태그별 필터링

**응답:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "게시물 제목",
        "content": "게시물 내용...",
        "author": {
          "id": 1,
          "username": "author",
          "displayName": "작성자 이름"
        },
        "board": {
          "id": 1,
          "name": "일반 토론"
        },
        "tags": ["게임", "토론"],
        "voteCount": 15,
        "commentCount": 8,
        "viewCount": 150,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

#### 게시물 생성
```http
POST /api/posts
```

**헤더:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**요청 본문:**
```json
{
  "title": "게시물 제목",
  "content": "게시물 내용...",
  "boardId": 1,
  "tags": ["게임", "토론"],
  "isDraft": false
}
```

#### 게시물 상세 조회
```http
GET /api/posts/:id
```

#### 게시물 수정
```http
PUT /api/posts/:id
```

**헤더:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### 게시물 삭제
```http
DELETE /api/posts/:id
```

**헤더:**
```
Authorization: Bearer <token>
```

### 댓글

#### 댓글 목록 조회
```http
GET /api/posts/:postId/comments
```

**쿼리 매개변수:**
- `page` (선택사항): 페이지 번호
- `limit` (선택사항): 페이지당 항목 수
- `sort` (선택사항): 정렬 순서 (newest, oldest, popular)

#### 댓글 생성
```http
POST /api/posts/:postId/comments
```

**헤더:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**요청 본문:**
```json
{
  "content": "댓글 내용...",
  "parentId": null
}
```

#### 댓글 수정
```http
PUT /api/comments/:id
```

#### 댓글 삭제
```http
DELETE /api/comments/:id
```

### 사용자

#### 사용자 프로필 조회
```http
GET /api/users/:id
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "username",
    "displayName": "표시 이름",
    "email": "user@example.com",
    "profile": {
      "bio": "사용자 소개...",
      "avatar": "avatar-url",
      "level": 5,
      "experience": 1250,
      "badges": [
        {
          "id": 1,
          "name": "첫 게시물",
          "description": "첫 번째 게시물을 작성했습니다",
          "icon": "badge-icon-url"
        }
      ]
    },
    "stats": {
      "postCount": 25,
      "commentCount": 150,
      "voteCount": 500
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### 사용자 프로필 수정
```http
PUT /api/users/:id
```

**헤더:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

### 검색

#### 게시물 및 사용자 검색
```http
GET /api/search
```

**쿼리 매개변수:**
- `q` (필수): 검색 쿼리
- `type` (선택사항): 콘텐츠 유형 (posts, users, comments)
- `boardId` (선택사항): 게시판별 필터링
- `page` (선택사항): 페이지 번호
- `limit` (선택사항): 페이지당 항목 수

**응답:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "post",
        "id": 1,
        "title": "게시물 제목",
        "content": "게시물 내용...",
        "author": { ... },
        "board": { ... },
        "score": 0.95
      }
    ],
    "pagination": { ... }
  }
}
```

### 알림

#### 알림 목록 조회
```http
GET /api/notifications
```

**헤더:**
```
Authorization: Bearer <token>
```

**쿼리 매개변수:**
- `page` (선택사항): 페이지 번호
- `limit` (선택사항): 페이지당 항목 수
- `unread` (선택사항): 읽지 않은 알림 필터링

#### 알림 읽음 처리
```http
PUT /api/notifications/:id/read
```

#### 모든 알림 읽음 처리
```http
PUT /api/notifications/read-all
```

### 태그

#### 태그 목록 조회
```http
GET /api/tags
```

**쿼리 매개변수:**
- `popular` (선택사항): 인기 태그 조회
- `limit` (선택사항): 반환할 태그 수

#### 태그 상세 조회
```http
GET /api/tags/:name
```

### 투표

#### 게시물 투표
```http
POST /api/posts/:id/vote
```

**헤더:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**요청 본문:**
```json
{
  "type": "up" // 또는 "down"
}
```

#### 댓글 투표
```http
POST /api/comments/:id/vote
```

### 첨부파일

#### 파일 업로드
```http
POST /api/attachments/upload
```

**헤더:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**요청 본문:**
```
file: <file>
type: image|video|document
```

#### 첨부파일 조회
```http
GET /api/attachments/:id
```

### 임시저장

#### 임시저장 목록 조회
```http
GET /api/drafts
```

**헤더:**
```
Authorization: Bearer <token>
```

#### 임시저장 생성
```http
POST /api/drafts
```

**헤더:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**요청 본문:**
```json
{
  "title": "임시저장 제목",
  "content": "임시저장 내용...",
  "boardId": 1
}
```

#### 임시저장 수정
```http
PUT /api/drafts/:id
```

#### 임시저장 삭제
```http
DELETE /api/drafts/:id
```

## 오류 코드

| 코드                  | 설명                        |
| --------------------- | --------------------------- |
| `INVALID_CREDENTIALS` | 잘못된 이메일 또는 비밀번호 |
| `USER_NOT_FOUND`      | 사용자가 존재하지 않음      |
| `POST_NOT_FOUND`      | 게시물이 존재하지 않음      |
| `UNAUTHORIZED`        | 인증이 필요함               |
| `FORBIDDEN`           | 권한이 부족함               |
| `VALIDATION_ERROR`    | 요청 검증 실패              |
| `RATE_LIMITED`        | 너무 많은 요청              |
| `SERVER_ERROR`        | 내부 서버 오류              |

## 속도 제한

API 요청은 남용을 방지하기 위해 속도가 제한됩니다:

- **인증 엔드포인트**: 분당 5회 요청
- **일반 엔드포인트**: 분당 100회 요청
- **검색 엔드포인트**: 분당 20회 요청

속도 제한 헤더가 응답에 포함됩니다:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## WebSocket 이벤트

플랫폼은 WebSocket을 통한 실시간 업데이트를 지원합니다:

### 연결
```javascript
const ws = new WebSocket('ws://localhost:50000/ws');
```

### 이벤트

#### 새 게시물
```json
{
  "type": "new_post",
  "data": {
    "post": { ... },
    "boardId": 1
  }
}
```

#### 새 댓글
```json
{
  "type": "new_comment",
  "data": {
    "comment": { ... },
    "postId": 1
  }
}
```

#### 새 알림
```json
{
  "type": "new_notification",
  "data": {
    "notification": { ... }
  }
}
```

## SDK 예제

### JavaScript/TypeScript
```javascript
class CommunityHubAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    return response.json();
  }

  async getPosts(boardId, page = 1) {
    return this.request(`/api/posts?boardId=${boardId}&page=${page}`);
  }

  async createPost(postData) {
    return this.request('/api/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  }
}
```

### Python
```python
import requests

class CommunityHubAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def get_posts(self, board_id, page=1):
        response = requests.get(
            f'{self.base_url}/api/posts',
            params={'boardId': board_id, 'page': page},
            headers=self.headers
        )
        return response.json()

    def create_post(self, post_data):
        response = requests.post(
            f'{self.base_url}/api/posts',
            json=post_data,
            headers=self.headers
        )
        return response.json()
```

## 변경 로그

### 버전 1.0.0
- 초기 API 릴리스
- 인증 시스템
- 게시물 및 댓글 관리
- 사용자 프로필 및 RPG 시스템
- 실시간 알림
- 검색 기능
- 파일 첨부
- 임시저장 시스템