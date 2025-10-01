# 🔌 API 문서

## 📋 개요

커뮤니티 플랫폼 v2.0.0의 REST API 및 WebSocket API 문서입니다.

### 기본 정보
- **Base URL**: `http://localhost:50000/api`
- **API 버전**: v1.0.0
- **인증 방식**: JWT (JSON Web Token)
- **응답 형식**: JSON

### 공통 응답 형식

#### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "요청이 성공적으로 처리되었습니다.",
  "timestamp": "2024-07-29T12:00:00.000Z"
}
```

#### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": { ... }
  },
  "timestamp": "2024-07-29T12:00:00.000Z"
}
```

## 🔐 인증 API

### POST /api/auth/register
회원가입

#### 요청
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "User"
}
```

#### 응답
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "testuser",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "user",
      "status": "pending"
    },
    "message": "회원가입이 완료되었습니다. 이메일 인증을 완료해주세요."
  }
}
```

### POST /api/auth/login
로그인

#### 요청
```json
{
  "username": "testuser",
  "password": "password123"
}
```

#### 응답
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "testuser",
      "email": "test@example.com",
      "role": "user",
      "status": "active"
    },
    "token": "jwt_token_here",
    "expiresIn": 3600
  }
}
```

### POST /api/auth/logout
로그아웃

#### 헤더
```
Authorization: Bearer <jwt_token>
```

#### 응답
```json
{
  "success": true,
  "message": "로그아웃이 완료되었습니다."
}
```

### POST /api/auth/refresh
토큰 갱신

#### 헤더
```
Authorization: Bearer <jwt_token>
```

#### 응답
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "expiresIn": 3600
  }
}
```

## 👥 사용자 API

### GET /api/users
사용자 목록 조회

#### 쿼리 파라미터
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)
- `search`: 검색어
- `role`: 역할 필터
- `status`: 상태 필터

#### 헤더
```
Authorization: Bearer <jwt_token>
```

#### 응답
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "username": "testuser",
        "email": "test@example.com",
        "firstName": "Test",
        "lastName": "User",
        "role": "user",
        "status": "active",
        "createdAt": "2024-07-29T12:00:00.000Z",
        "lastLoginAt": "2024-07-29T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "itemsPerPage": 20
    }
  }
}
```

### GET /api/users/:id
특정 사용자 조회

#### 헤더
```
Authorization: Bearer <jwt_token>
```

#### 응답
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "testuser",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "user",
      "status": "active",
      "profile": {
        "bio": "사용자 소개",
        "avatar": "avatar_url",
        "website": "https://example.com"
      },
      "stats": {
        "postCount": 10,
        "commentCount": 50,
        "likeCount": 100
      },
      "createdAt": "2024-07-29T12:00:00.000Z"
    }
  }
}
```

### PUT /api/users/:id
사용자 정보 수정

#### 헤더
```
Authorization: Bearer <jwt_token>
```

#### 요청
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "profile": {
    "bio": "업데이트된 소개",
    "website": "https://updated.com"
  }
}
```

#### 응답
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "Updated",
      "lastName": "Name",
      "profile": {
        "bio": "업데이트된 소개",
        "website": "https://updated.com"
      }
    }
  },
  "message": "사용자 정보가 업데이트되었습니다."
}
```

## 📝 게시글 API

### GET /api/posts
게시글 목록 조회

#### 쿼리 파라미터
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)
- `boardId`: 게시판 ID
- `search`: 검색어
- `sort`: 정렬 방식 (createdAt, updatedAt, viewCount, likeCount)
- `order`: 정렬 순서 (asc, desc)

#### 응답
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post_id",
        "title": "게시글 제목",
        "content": "게시글 내용",
        "author": {
          "id": "user_id",
          "username": "testuser",
          "firstName": "Test",
          "lastName": "User"
        },
        "board": {
          "id": "board_id",
          "name": "게시판 이름"
        },
        "tags": ["태그1", "태그2"],
        "viewCount": 100,
        "likeCount": 10,
        "commentCount": 5,
        "isPublished": true,
        "createdAt": "2024-07-29T12:00:00.000Z",
        "updatedAt": "2024-07-29T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "itemsPerPage": 20
    }
  }
}
```

### GET /api/posts/:id
특정 게시글 조회

#### 응답
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "post_id",
      "title": "게시글 제목",
      "content": "게시글 내용",
      "author": {
        "id": "user_id",
        "username": "testuser",
        "firstName": "Test",
        "lastName": "User"
      },
      "board": {
        "id": "board_id",
        "name": "게시판 이름"
      },
      "tags": ["태그1", "태그2"],
      "attachments": [
        {
          "id": "attachment_id",
          "filename": "image.jpg",
          "url": "attachment_url",
          "type": "image",
          "size": 1024000
        }
      ],
      "viewCount": 100,
      "likeCount": 10,
      "commentCount": 5,
      "isPublished": true,
      "createdAt": "2024-07-29T12:00:00.000Z",
      "updatedAt": "2024-07-29T12:00:00.000Z"
    }
  }
}
```

### POST /api/posts
게시글 작성

#### 헤더
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

#### 요청 (Form Data)
```
title: 게시글 제목
content: 게시글 내용
boardId: 게시판 ID
tags: 태그1,태그2
attachments: 파일1, 파일2
```

#### 응답
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "post_id",
      "title": "게시글 제목",
      "content": "게시글 내용",
      "author": {
        "id": "user_id",
        "username": "testuser"
      },
      "board": {
        "id": "board_id",
        "name": "게시판 이름"
      },
      "tags": ["태그1", "태그2"],
      "isPublished": true,
      "createdAt": "2024-07-29T12:00:00.000Z"
    }
  },
  "message": "게시글이 성공적으로 작성되었습니다."
}
```

### PUT /api/posts/:id
게시글 수정

#### 헤더
```
Authorization: Bearer <jwt_token>
```

#### 요청
```json
{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "tags": ["새태그1", "새태그2"]
}
```

#### 응답
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "post_id",
      "title": "수정된 제목",
      "content": "수정된 내용",
      "tags": ["새태그1", "새태그2"],
      "updatedAt": "2024-07-29T12:00:00.000Z"
    }
  },
  "message": "게시글이 성공적으로 수정되었습니다."
}
```

### DELETE /api/posts/:id
게시글 삭제

#### 헤더
```
Authorization: Bearer <jwt_token>
```

#### 응답
```json
{
  "success": true,
  "message": "게시글이 성공적으로 삭제되었습니다."
}
```

## 💬 댓글 API

### GET /api/comments
댓글 목록 조회

#### 쿼리 파라미터
- `postId`: 게시글 ID (필수)
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)

#### 응답
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment_id",
        "content": "댓글 내용",
        "author": {
          "id": "user_id",
          "username": "testuser",
          "firstName": "Test",
          "lastName": "User"
        },
        "parentId": null,
        "replies": [
          {
            "id": "reply_id",
            "content": "대댓글 내용",
            "author": {
              "id": "user_id2",
              "username": "testuser2"
            },
            "parentId": "comment_id",
            "createdAt": "2024-07-29T12:00:00.000Z"
          }
        ],
        "likeCount": 5,
        "createdAt": "2024-07-29T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20
    }
  }
}
```

### POST /api/comments
댓글 작성

#### 헤더
```
Authorization: Bearer <jwt_token>
```

#### 요청
```json
{
  "postId": "post_id",
  "content": "댓글 내용",
  "parentId": "parent_comment_id" // 대댓글인 경우
}
```

#### 응답
```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "comment_id",
      "content": "댓글 내용",
      "author": {
        "id": "user_id",
        "username": "testuser"
      },
      "postId": "post_id",
      "parentId": "parent_comment_id",
      "createdAt": "2024-07-29T12:00:00.000Z"
    }
  },
  "message": "댓글이 성공적으로 작성되었습니다."
}
```

## 💬 채팅 API

### WebSocket 연결
```
ws://localhost:50000/socket.io/?token=<jwt_token>
```

### 이벤트

#### join_room
채팅방 입장

```javascript
socket.emit('join_room', {
  roomId: 'room_id',
  userId: 'user_id'
});
```

#### leave_room
채팅방 퇴장

```javascript
socket.emit('leave_room', {
  roomId: 'room_id',
  userId: 'user_id'
});
```

#### send_message
메시지 전송

```javascript
socket.emit('send_message', {
  roomId: 'room_id',
  content: '메시지 내용',
  type: 'text', // text, image, file
  attachments: [] // 첨부파일
});
```

#### typing_start
타이핑 시작

```javascript
socket.emit('typing_start', {
  roomId: 'room_id',
  userId: 'user_id'
});
```

#### typing_stop
타이핑 종료

```javascript
socket.emit('typing_stop', {
  roomId: 'room_id',
  userId: 'user_id'
});
```

### 수신 이벤트

#### message_received
메시지 수신

```javascript
socket.on('message_received', (data) => {
  console.log('새 메시지:', data);
  // data: { id, content, author, roomId, createdAt, type, attachments }
});
```

#### user_joined
사용자 입장

```javascript
socket.on('user_joined', (data) => {
  console.log('사용자 입장:', data);
  // data: { userId, username, roomId }
});
```

#### user_left
사용자 퇴장

```javascript
socket.on('user_left', (data) => {
  console.log('사용자 퇴장:', data);
  // data: { userId, username, roomId }
});
```

#### typing_indicator
타이핑 표시

```javascript
socket.on('typing_indicator', (data) => {
  console.log('타이핑 중:', data);
  // data: { userId, username, roomId, isTyping }
});
```

## 📊 통계 API

### GET /api/analytics/overview
개요 통계

#### 헤더
```
Authorization: Bearer <jwt_token>
X-Admin-Token: <admin_token>
```

#### 응답
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1000,
      "active": 100,
      "newToday": 5
    },
    "posts": {
      "total": 5000,
      "published": 4500,
      "draft": 500
    },
    "comments": {
      "total": 20000,
      "today": 50
    },
    "system": {
      "uptime": 86400,
      "memoryUsage": 512,
      "cpuUsage": 25
    }
  }
}
```

## 🔧 시스템 API

### GET /api/health
헬스 체크

#### 응답
```json
{
  "status": "OK",
  "timestamp": "2024-07-29T12:00:00.000Z",
  "uptime": 86400,
  "environment": "production",
  "version": "2.0.0"
}
```

### GET /api/metrics
성능 메트릭

#### 응답
```json
{
  "success": true,
  "data": {
    "requests": {
      "total": 10000,
      "successful": 9500,
      "failed": 500,
      "averageResponseTime": 120
    },
    "database": {
      "queries": 50000,
      "averageQueryTime": 50,
      "slowQueries": 10
    },
    "cache": {
      "hitRate": 85.5,
      "hits": 8500,
      "misses": 1500
    }
  }
}
```

## 🚨 에러 코드

| 코드                     | HTTP 상태 | 설명                  |
| ------------------------ | --------- | --------------------- |
| INVALID_CREDENTIALS      | 401       | 잘못된 인증 정보      |
| TOKEN_EXPIRED            | 401       | 토큰 만료             |
| INSUFFICIENT_PERMISSIONS | 403       | 권한 부족             |
| RESOURCE_NOT_FOUND       | 404       | 리소스를 찾을 수 없음 |
| VALIDATION_ERROR         | 400       | 입력 데이터 검증 실패 |
| DUPLICATE_RESOURCE       | 409       | 중복된 리소스         |
| RATE_LIMIT_EXCEEDED      | 429       | 요청 한도 초과        |
| INTERNAL_SERVER_ERROR    | 500       | 서버 내부 오류        |

## 📝 예제 코드

### JavaScript (Fetch API)
```javascript
// 로그인
const login = async (username, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.data.token);
  }
  return data;
};

// 게시글 목록 조회
const getPosts = async (page = 1, limit = 20) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/posts?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

### Python (requests)
```python
import requests

# 로그인
def login(username, password):
    response = requests.post('http://localhost:50000/api/auth/login', json={
        'username': username,
        'password': password
    })
    return response.json()

# 게시글 목록 조회
def get_posts(token, page=1, limit=20):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'http://localhost:50000/api/posts?page={page}&limit={limit}', headers=headers)
    return response.json()
```

---

*이 문서는 커뮤니티 플랫폼 v2.0.0 API를 기준으로 작성되었습니다.*  
*최신 업데이트: 2024년 7월 29일*
