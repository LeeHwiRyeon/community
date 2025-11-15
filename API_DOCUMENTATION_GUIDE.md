# API 문서화 가이드 (API Documentation Guide)

## 📋 목차
- [1. 개요](#1-개요)
- [2. Swagger/OpenAPI 설정](#2-swaggeropenapi-설정)
- [3. API 엔드포인트 문서화](#3-api-엔드포인트-문서화)
- [4. 인증 시스템](#4-인증-시스템)
- [5. 주요 API 그룹](#5-주요-api-그룹)
- [6. 요청/응답 예제](#6-요청응답-예제)
- [7. 에러 코드](#7-에러-코드)
- [8. API 버전 관리](#8-api-버전-관리)
- [9. Rate Limiting](#9-rate-limiting)
- [10. 개발자 가이드](#10-개발자-가이드)
- [11. 체크리스트](#11-체크리스트)
- [12. 구현 로드맵](#12-구현-로드맵)

---

## 1. 개요

### 1.1 목표
커뮤니티 플랫폼의 모든 API 엔드포인트를 **Swagger/OpenAPI 3.0 표준**으로 문서화하여 개발자 경험 향상

### 1.2 API 기본 정보
- **Base URL**: `https://api.yourdomain.com`
- **Protocol**: HTTPS only
- **Format**: JSON
- **Authentication**: JWT Bearer Token
- **API Version**: v1

### 1.3 문서화 도구
| 도구               | 용도                        |
| ------------------ | --------------------------- |
| Swagger UI         | 인터랙티브 API 문서         |
| Redoc              | 정적 API 문서 (깔끔한 UI)   |
| Postman Collection | API 테스트 및 자동화        |
| swagger-jsdoc      | JSDoc 주석에서 Swagger 생성 |

---

## 2. Swagger/OpenAPI 설정

### 2.1 패키지 설치

```bash
cd server-backend
npm install swagger-jsdoc swagger-ui-express
npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-express
```

### 2.2 Swagger 설정 파일

```javascript
// server-backend/src/config/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Community Platform API',
            version: '1.0.0',
            description: '커뮤니티 플랫폼 REST API 문서',
            contact: {
                name: 'API Support',
                email: 'api@yourdomain.com',
                url: 'https://yourdomain.com/support'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:50000',
                description: 'Development server'
            },
            {
                url: 'https://api-staging.yourdomain.com',
                description: 'Staging server'
            },
            {
                url: 'https://api.yourdomain.com',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT 토큰을 입력하세요 (Bearer 접두사 제외)'
                },
                csrfToken: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-CSRF-Token',
                    description: 'CSRF 토큰 (로그인 후 받은 토큰 사용)'
                }
            },
            schemas: {
                // 공통 스키마 정의
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Error message'
                        },
                        error: {
                            type: 'string',
                            example: 'Detailed error description'
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            description: '사용자 고유 ID'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: '이메일 주소'
                        },
                        username: {
                            type: 'string',
                            description: '사용자명'
                        },
                        displayName: {
                            type: 'string',
                            description: '표시 이름'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: '가입 일시'
                        }
                    }
                },
                Post: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            description: '게시글 고유 ID'
                        },
                        title: {
                            type: 'string',
                            description: '게시글 제목'
                        },
                        content: {
                            type: 'string',
                            description: '게시글 내용'
                        },
                        authorId: {
                            type: 'string',
                            format: 'uuid',
                            description: '작성자 ID'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Notification: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        type: {
                            type: 'string',
                            enum: ['like', 'comment', 'follow', 'mention', 'system']
                        },
                        message: {
                            type: 'string'
                        },
                        isRead: {
                            type: 'boolean'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                }
            },
            responses: {
                UnauthorizedError: {
                    description: '인증 실패',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            },
                            example: {
                                success: false,
                                message: '인증이 필요합니다.'
                            }
                        }
                    }
                },
                ForbiddenError: {
                    description: '권한 없음',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                NotFoundError: {
                    description: '리소스를 찾을 수 없음',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                ValidationError: {
                    description: '입력 검증 실패',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        tags: [
            {
                name: 'Authentication',
                description: '인증 관련 API'
            },
            {
                name: 'Users',
                description: '사용자 관리 API'
            },
            {
                name: 'Posts',
                description: '게시글 관리 API'
            },
            {
                name: 'Comments',
                description: '댓글 관리 API'
            },
            {
                name: 'Notifications',
                description: '알림 시스템 API'
            },
            {
                name: 'Chat',
                description: '채팅 시스템 API'
            },
            {
                name: 'Search',
                description: '검색 API'
            },
            {
                name: 'Profile',
                description: '프로필 관리 API'
            },
            {
                name: 'Upload',
                description: '파일 업로드 API'
            }
        ]
    },
    apis: [
        './routes/*.js',
        './routes/**/*.js',
        './src/routes/*.js',
        './src/routes/**/*.js'
    ]
};

const specs = swaggerJsdoc(options);

export default specs;
```

### 2.3 Swagger UI 통합

```javascript
// server-backend/app.js
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger.js';

// Swagger UI 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Community Platform API Docs',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        syntaxHighlight: {
            theme: 'monokai'
        }
    }
}));

// JSON 스펙 엔드포인트
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpecs);
});

console.log('📚 API Documentation available at http://localhost:50000/api-docs');
```

---

## 3. API 엔드포인트 문서화

### 3.1 JSDoc 주석 작성 가이드

#### 인증 API 예시

```javascript
// routes/auth.js

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: 회원가입
 *     description: 새로운 사용자 계정을 생성합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: password123
 *               username:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 20
 *                 example: john_doe
 *               displayName:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 회원가입이 완료되었습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT 토큰
 *                     csrfToken:
 *                       type: string
 *                       description: CSRF 토큰
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: 이메일 또는 사용자명 중복
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 */
router.post('/register', async (req, res) => {
    // 구현...
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: 로그인
 *     description: 이메일과 비밀번호로 로그인합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                     csrfToken:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/login', async (req, res) => {
    // 구현...
});

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: 토큰 검증
 *     description: JWT 토큰의 유효성을 검증합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 유효한 토큰
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/verify', authenticateToken, async (req, res) => {
    // 구현...
});
```

#### 알림 API 예시

```javascript
// routes/notifications.js

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: 알림 목록 조회
 *     description: 사용자의 알림 목록을 페이지네이션으로 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 읽지 않은 알림만 조회
 *     responses:
 *       200:
 *         description: 알림 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authenticateToken, async (req, res) => {
    // 구현...
});

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: 읽지 않은 알림 개수
 *     description: 사용자의 읽지 않은 알림 개수를 반환합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 읽지 않은 알림 개수
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
    // 구현...
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: 알림 읽음 처리
 *     description: 특정 알림을 읽음 상태로 변경합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 알림 ID
 *     responses:
 *       200:
 *         description: 읽음 처리 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notification marked as read
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
    // 구현...
});

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: 모든 알림 읽음 처리
 *     description: 사용자의 모든 알림을 읽음 상태로 변경합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 모든 알림 읽음 처리 완료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 updatedCount:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/mark-all-read', authenticateToken, async (req, res) => {
    // 구현...
});
```

---

## 4. 인증 시스템

### 4.1 JWT 인증

#### 토큰 획득
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 응답
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "username": "john_doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "csrfToken": "csrf-token-here"
  }
}
```

#### 인증된 요청
```http
GET /api/notifications
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-CSRF-Token: csrf-token-here
```

### 4.2 CSRF 토큰

모든 상태 변경 요청(POST, PUT, DELETE)에는 CSRF 토큰이 필요합니다.

```http
POST /api/posts
Authorization: Bearer {jwt-token}
X-CSRF-Token: {csrf-token}
Content-Type: application/json

{
  "title": "My Post",
  "content": "Post content"
}
```

---

## 5. 주요 API 그룹

### 5.1 인증 (Authentication)

| Method | Endpoint               | Description    |
| ------ | ---------------------- | -------------- |
| POST   | `/api/auth/register`   | 회원가입       |
| POST   | `/api/auth/login`      | 로그인         |
| POST   | `/api/auth/logout`     | 로그아웃       |
| GET    | `/api/auth/verify`     | 토큰 검증      |
| GET    | `/api/auth/csrf-token` | CSRF 토큰 발급 |
| POST   | `/api/auth/refresh`    | 토큰 갱신      |

### 5.2 사용자 (Users)

| Method | Endpoint                  | Description      |
| ------ | ------------------------- | ---------------- |
| GET    | `/api/users/me`           | 내 정보 조회     |
| PUT    | `/api/users/me`           | 내 정보 수정     |
| DELETE | `/api/users/me`           | 계정 삭제        |
| GET    | `/api/users/:id`          | 특정 사용자 조회 |
| POST   | `/api/users/follow/:id`   | 사용자 팔로우    |
| DELETE | `/api/users/unfollow/:id` | 언팔로우         |

### 5.3 게시글 (Posts)

| Method | Endpoint                | Description |
| ------ | ----------------------- | ----------- |
| GET    | `/api/posts`            | 게시글 목록 |
| POST   | `/api/posts`            | 게시글 작성 |
| GET    | `/api/posts/:id`        | 게시글 조회 |
| PUT    | `/api/posts/:id`        | 게시글 수정 |
| DELETE | `/api/posts/:id`        | 게시글 삭제 |
| POST   | `/api/posts/:id/like`   | 좋아요      |
| DELETE | `/api/posts/:id/unlike` | 좋아요 취소 |

### 5.4 댓글 (Comments)

| Method | Endpoint                    | Description |
| ------ | --------------------------- | ----------- |
| GET    | `/api/comments?postId={id}` | 댓글 목록   |
| POST   | `/api/comments`             | 댓글 작성   |
| PUT    | `/api/comments/:id`         | 댓글 수정   |
| DELETE | `/api/comments/:id`         | 댓글 삭제   |
| POST   | `/api/comments/:id/like`    | 댓글 좋아요 |

### 5.5 알림 (Notifications)

| Method | Endpoint                              | Description         |
| ------ | ------------------------------------- | ------------------- |
| GET    | `/api/notifications`                  | 알림 목록           |
| GET    | `/api/notifications/unread-count`     | 읽지 않은 알림 개수 |
| GET    | `/api/notifications/statistics`       | 알림 통계           |
| PUT    | `/api/notifications/:id/read`         | 알림 읽음 처리      |
| PUT    | `/api/notifications/mark-all-read`    | 모든 알림 읽음 처리 |
| DELETE | `/api/notifications/:id`              | 알림 삭제           |
| GET    | `/api/notifications/settings/current` | 알림 설정 조회      |
| PUT    | `/api/notifications/settings`         | 알림 설정 변경      |

### 5.6 채팅 (Chat)

| Method | Endpoint                                  | Description      |
| ------ | ----------------------------------------- | ---------------- |
| GET    | `/api/chat/dm/conversations`              | DM 대화 목록     |
| POST   | `/api/chat/dm/conversations`              | DM 대화 시작     |
| GET    | `/api/chat/dm/conversations/:id/messages` | DM 메시지 조회   |
| POST   | `/api/chat/dm/messages`                   | DM 메시지 전송   |
| GET    | `/api/chat/groups`                        | 그룹 채팅 목록   |
| POST   | `/api/chat/groups`                        | 그룹 채팅 생성   |
| GET    | `/api/chat/groups/:id/messages`           | 그룹 메시지 조회 |
| POST   | `/api/chat/groups/:id/messages`           | 그룹 메시지 전송 |

### 5.7 검색 (Search)

| Method | Endpoint                        | Description      |
| ------ | ------------------------------- | ---------------- |
| GET    | `/api/search?q={query}`         | 통합 검색        |
| GET    | `/api/search/suggest?q={query}` | 검색 제안        |
| GET    | `/api/search/popular`           | 인기 검색어      |
| GET    | `/api/search/similar/:postId`   | 유사 게시글      |
| GET    | `/api/search/health`            | 검색 시스템 상태 |

### 5.8 프로필 (Profile)

| Method | Endpoint                        | Description |
| ------ | ------------------------------- | ----------- |
| GET    | `/api/profile/:userId`          | 프로필 조회 |
| PUT    | `/api/profile/:userId`          | 프로필 수정 |
| GET    | `/api/profile/:userId/stats`    | 프로필 통계 |
| GET    | `/api/profile/:userId/activity` | 활동 내역   |
| GET    | `/api/profile/:userId/badges`   | 배지 목록   |
| GET    | `/api/profile/top-contributors` | 상위 기여자 |
| GET    | `/api/profile/new-members`      | 신규 회원   |

### 5.9 파일 업로드 (Upload)

| Method | Endpoint                     | Description        |
| ------ | ---------------------------- | ------------------ |
| POST   | `/api/upload/image`          | 이미지 업로드      |
| POST   | `/api/upload/avatar`         | 프로필 사진 업로드 |
| POST   | `/api/upload/multiple`       | 다중 파일 업로드   |
| GET    | `/api/upload/images/:userId` | 사용자 이미지 목록 |
| DELETE | `/api/upload/image/:id`      | 이미지 삭제        |

---

## 6. 요청/응답 예제

### 6.1 게시글 작성

#### 요청
```http
POST /api/posts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-CSRF-Token: csrf-token-here
Content-Type: application/json

{
  "title": "안녕하세요",
  "content": "첫 게시글입니다.",
  "boardId": "board-uuid",
  "tags": ["인사", "소개"]
}
```

#### 응답 (201 Created)
```json
{
  "success": true,
  "message": "게시글이 작성되었습니다.",
  "data": {
    "id": "post-uuid",
    "title": "안녕하세요",
    "content": "첫 게시글입니다.",
    "authorId": "user-uuid",
    "boardId": "board-uuid",
    "tags": ["인사", "소개"],
    "viewCount": 0,
    "likeCount": 0,
    "commentCount": 0,
    "createdAt": "2025-11-12T10:30:00.000Z",
    "updatedAt": "2025-11-12T10:30:00.000Z"
  }
}
```

### 6.2 게시글 목록 조회

#### 요청
```http
GET /api/posts?page=1&limit=20&sort=latest&boardId=board-uuid
Authorization: Bearer {token}
```

#### 응답 (200 OK)
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post-uuid-1",
        "title": "게시글 1",
        "content": "내용...",
        "author": {
          "id": "user-uuid",
          "username": "john_doe",
          "displayName": "John Doe",
          "avatar": "https://..."
        },
        "likeCount": 10,
        "commentCount": 5,
        "viewCount": 100,
        "createdAt": "2025-11-12T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 98,
      "hasMore": true
    }
  }
}
```

### 6.3 댓글 작성

#### 요청
```http
POST /api/comments
Authorization: Bearer {token}
X-CSRF-Token: {csrf-token}
Content-Type: application/json

{
  "postId": "post-uuid",
  "content": "좋은 글 감사합니다!",
  "parentId": null
}
```

#### 응답 (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "comment-uuid",
    "postId": "post-uuid",
    "content": "좋은 글 감사합니다!",
    "authorId": "user-uuid",
    "parentId": null,
    "likeCount": 0,
    "createdAt": "2025-11-12T10:35:00.000Z"
  }
}
```

### 6.4 프로필 조회

#### 요청
```http
GET /api/profile/user-uuid
Authorization: Bearer {token}
```

#### 응답 (200 OK)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "username": "john_doe",
      "displayName": "John Doe",
      "bio": "개발자입니다.",
      "avatar": "https://...",
      "coverImage": "https://...",
      "location": "Seoul, Korea",
      "website": "https://johndoe.com",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    "stats": {
      "postCount": 50,
      "followerCount": 200,
      "followingCount": 150,
      "likeCount": 1000
    },
    "badges": [
      {
        "id": "badge-1",
        "name": "Early Adopter",
        "icon": "🌟",
        "earnedAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "isFollowing": false,
    "isMe": false
  }
}
```

---

## 7. 에러 코드

### 7.1 HTTP 상태 코드

| 코드 | 의미                  | 설명                  |
| ---- | --------------------- | --------------------- |
| 200  | OK                    | 요청 성공             |
| 201  | Created               | 리소스 생성 성공      |
| 204  | No Content            | 성공 (응답 본문 없음) |
| 400  | Bad Request           | 잘못된 요청           |
| 401  | Unauthorized          | 인증 실패             |
| 403  | Forbidden             | 권한 없음             |
| 404  | Not Found             | 리소스 없음           |
| 409  | Conflict              | 리소스 충돌           |
| 422  | Unprocessable Entity  | 검증 실패             |
| 429  | Too Many Requests     | 요청 제한 초과        |
| 500  | Internal Server Error | 서버 오류             |
| 503  | Service Unavailable   | 서비스 이용 불가      |

### 7.2 에러 응답 형식

```json
{
  "success": false,
  "message": "사용자 친화적 에러 메시지",
  "error": "개발자용 상세 에러 설명",
  "code": "ERROR_CODE",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/api/posts",
  "method": "POST"
}
```

### 7.3 주요 에러 코드

| 코드                       | HTTP | 설명               |
| -------------------------- | ---- | ------------------ |
| `AUTH_REQUIRED`            | 401  | 인증 필요          |
| `INVALID_TOKEN`            | 401  | 유효하지 않은 토큰 |
| `TOKEN_EXPIRED`            | 401  | 만료된 토큰        |
| `INSUFFICIENT_PERMISSIONS` | 403  | 권한 부족          |
| `RESOURCE_NOT_FOUND`       | 404  | 리소스 없음        |
| `VALIDATION_ERROR`         | 400  | 입력 검증 실패     |
| `DUPLICATE_EMAIL`          | 409  | 이메일 중복        |
| `DUPLICATE_USERNAME`       | 409  | 사용자명 중복      |
| `RATE_LIMIT_EXCEEDED`      | 429  | 요청 제한 초과     |
| `SERVER_ERROR`             | 500  | 서버 오류          |

---

## 8. API 버전 관리

### 8.1 버전 관리 전략

#### URL 경로 버전 (권장)
```
/api/v1/posts
/api/v2/posts
```

#### 헤더 버전
```http
GET /api/posts
Accept: application/vnd.api+json; version=1
```

### 8.2 버전 마이그레이션

```javascript
// server-backend/app.js

// V1 API (현재)
app.use('/api/v1/auth', authRouterV1);
app.use('/api/v1/posts', postsRouterV1);

// V2 API (향후)
app.use('/api/v2/auth', authRouterV2);
app.use('/api/v2/posts', postsRouterV2);

// Legacy support (기본은 v1)
app.use('/api/auth', authRouterV1);
app.use('/api/posts', postsRouterV1);
```

---

## 9. Rate Limiting

### 9.1 요청 제한

| 엔드포인트             | 제한   | 기간  |
| ---------------------- | ------ | ----- |
| `/api/auth/login`      | 5회    | 15분  |
| `/api/auth/register`   | 3회    | 1시간 |
| `/api/posts` (POST)    | 10회   | 1시간 |
| `/api/comments` (POST) | 30회   | 1시간 |
| `/api/search`          | 100회  | 1분   |
| 기타                   | 1000회 | 15분  |

### 9.2 Rate Limit 헤더

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699876543
```

### 9.3 제한 초과 응답

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
Content-Type: application/json

{
  "success": false,
  "message": "요청 제한을 초과했습니다. 잠시 후 다시 시도해주세요.",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

---

## 10. 개발자 가이드

### 10.1 빠른 시작

#### 1. 토큰 획득
```bash
curl -X POST http://localhost:50000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

#### 2. 토큰 저장
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export CSRF_TOKEN="csrf-token-here"
```

#### 3. 인증된 요청
```bash
curl -X GET http://localhost:50000/api/notifications \
  -H "Authorization: Bearer $TOKEN"
```

### 10.2 Postman Collection

#### Collection 생성
```json
{
  "info": {
    "name": "Community Platform API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "url": "{{base_url}}/api/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"password123\"\n}"
            }
          }
        }
      ]
    }
  ]
}
```

### 10.3 SDK 예제 (JavaScript)

```javascript
// api-client.js
class CommunityAPI {
    constructor(baseURL, token) {
        this.baseURL = baseURL;
        this.token = token;
        this.csrfToken = null;
    }

    async request(method, endpoint, data = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (this.csrfToken && ['POST', 'PUT', 'DELETE'].includes(method)) {
            headers['X-CSRF-Token'] = this.csrfToken;
        }

        const options = {
            method,
            headers
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, options);
        return response.json();
    }

    // Authentication
    async login(email, password) {
        const result = await this.request('POST', '/api/auth/login', {
            email,
            password
        });
        
        if (result.success) {
            this.token = result.data.token;
            this.csrfToken = result.data.csrfToken;
        }
        
        return result;
    }

    // Notifications
    async getNotifications(page = 1, limit = 20) {
        return this.request('GET', `/api/notifications?page=${page}&limit=${limit}`);
    }

    async markNotificationAsRead(notificationId) {
        return this.request('PUT', `/api/notifications/${notificationId}/read`);
    }

    // Posts
    async createPost(title, content, boardId, tags = []) {
        return this.request('POST', '/api/posts', {
            title,
            content,
            boardId,
            tags
        });
    }

    async getPosts(page = 1, limit = 20, sort = 'latest') {
        return this.request('GET', `/api/posts?page=${page}&limit=${limit}&sort=${sort}`);
    }
}

// 사용 예시
const api = new CommunityAPI('http://localhost:50000');

// 로그인
await api.login('user@example.com', 'password123');

// 알림 조회
const notifications = await api.getNotifications();

// 게시글 작성
const post = await api.createPost(
    'My Post',
    'Post content',
    'board-uuid',
    ['tag1', 'tag2']
);
```

---

## 11. 체크리스트

### 11.1 문서화

- [ ] Swagger/OpenAPI 3.0 설정 완료
- [ ] swagger-jsdoc 설치 및 설정
- [ ] Swagger UI 엔드포인트 구현 (`/api-docs`)
- [ ] 모든 인증 API 문서화 (6개)
- [ ] 모든 알림 API 문서화 (8개)
- [ ] 모든 채팅 API 문서화 (8개)
- [ ] 모든 게시글 API 문서화 (7개)
- [ ] 모든 댓글 API 문서화 (5개)
- [ ] 모든 검색 API 문서화 (5개)
- [ ] 모든 프로필 API 문서화 (7개)
- [ ] 모든 파일 업로드 API 문서화 (5개)
- [ ] 공통 스키마 정의 (User, Post, Notification 등)
- [ ] 에러 응답 스키마 정의
- [ ] 인증 보안 스키마 정의 (Bearer, CSRF)

### 11.2 예제 및 가이드

- [ ] 요청/응답 예제 작성
- [ ] cURL 명령어 예제
- [ ] Postman Collection 생성
- [ ] JavaScript SDK 예제
- [ ] Python SDK 예제 (선택)
- [ ] 빠른 시작 가이드
- [ ] 에러 코드 목록
- [ ] Rate Limiting 문서

### 11.3 배포

- [ ] API 문서 프로덕션 배포
- [ ] Redoc 정적 문서 생성 (선택)
- [ ] API 문서 CDN 호스팅 (선택)
- [ ] 변경 이력 (Changelog) 관리
- [ ] 버전 관리 전략 수립

---

## 12. 구현 로드맵

### Week 1: Swagger 설정 및 기본 API
**목표**: Swagger 설정 및 핵심 API 문서화

- **Day 1-2**: Swagger 설정
  - [ ] swagger-jsdoc, swagger-ui-express 설치
  - [ ] swagger.js 설정 파일 작성
  - [ ] Swagger UI 엔드포인트 구현
  - [ ] 기본 스키마 정의 (User, Error)

- **Day 3-4**: 인증 API 문서화
  - [ ] `/api/auth/register` 문서화
  - [ ] `/api/auth/login` 문서화
  - [ ] `/api/auth/verify` 문서화
  - [ ] `/api/auth/logout` 문서화
  - [ ] 인증 보안 스키마 추가

- **Day 5**: 알림 API 문서화
  - [ ] 알림 스키마 정의
  - [ ] 8개 알림 엔드포인트 문서화
  - [ ] 요청/응답 예제 추가

### Week 2: 주요 기능 API
**목표**: 게시글, 댓글, 채팅 API 문서화

- **Day 1-2**: 게시글 API
  - [ ] Post 스키마 정의
  - [ ] 7개 게시글 엔드포인트 문서화
  - [ ] 페이지네이션 파라미터 문서화
  - [ ] 정렬 옵션 문서화

- **Day 3**: 댓글 API
  - [ ] Comment 스키마 정의
  - [ ] 5개 댓글 엔드포인트 문서화
  - [ ] 대댓글 구조 문서화

- **Day 4-5**: 채팅 API
  - [ ] Conversation, Message 스키마
  - [ ] DM API 문서화 (4개)
  - [ ] 그룹 채팅 API 문서화 (4개)
  - [ ] 실시간 이벤트 문서화

### Week 3: 검색, 프로필, 업로드
**목표**: 나머지 주요 API 문서화

- **Day 1**: 검색 API
  - [ ] 검색 스키마 정의
  - [ ] 5개 검색 엔드포인트 문서화
  - [ ] 검색 필터 파라미터 문서화

- **Day 2-3**: 프로필 API
  - [ ] Profile 스키마 정의
  - [ ] 7개 프로필 엔드포인트 문서화
  - [ ] 배지 시스템 문서화
  - [ ] 통계 정보 문서화

- **Day 4**: 파일 업로드 API
  - [ ] multipart/form-data 문서화
  - [ ] 5개 업로드 엔드포인트 문서화
  - [ ] 파일 크기/타입 제한 명시

- **Day 5**: 에러 및 Rate Limiting
  - [ ] 에러 코드 목록 작성
  - [ ] Rate Limiting 문서
  - [ ] HTTP 상태 코드 가이드

### Week 4: 예제 및 최종화
**목표**: SDK, Collection, 최종 문서화

- **Day 1-2**: Postman Collection
  - [ ] Postman Collection JSON 생성
  - [ ] 환경 변수 설정
  - [ ] 모든 엔드포인트 추가
  - [ ] 테스트 스크립트 작성

- **Day 3**: SDK 예제
  - [ ] JavaScript SDK 예제 작성
  - [ ] Python SDK 예제 작성 (선택)
  - [ ] cURL 명령어 모음

- **Day 4**: 개발자 가이드
  - [ ] 빠른 시작 가이드
  - [ ] 인증 플로우 가이드
  - [ ] 페이지네이션 가이드
  - [ ] 에러 처리 가이드

- **Day 5**: 최종 검토 및 배포
  - [ ] 모든 API 문서 검증
  - [ ] Swagger UI 테스트
  - [ ] Redoc 정적 문서 생성
  - [ ] 프로덕션 배포

---

## 13. 추가 도구

### 13.1 Redoc 정적 문서

```bash
npm install --save-dev redoc-cli
```

```bash
# 정적 HTML 생성
redoc-cli bundle http://localhost:50000/api-docs.json \
  -o ./docs/api-documentation.html \
  --title "Community Platform API"
```

### 13.2 API 버전 변경 이력

```markdown
# API Changelog

## v1.1.0 (2025-11-12)

### Added
- 알림 설정 API 추가
- 그룹 채팅 멤버 관리 API 추가

### Changed
- 게시글 목록 API 응답에 작성자 정보 포함

### Deprecated
- `/api/users/profile` → `/api/profile/:userId` 사용 권장

### Fixed
- 댓글 페이지네이션 버그 수정
```

---

## 14. 결론

종합적인 API 문서화를 통해:

- 📚 **개발자 경험 향상**: Swagger UI로 인터랙티브 문서
- 🔍 **빠른 온보딩**: 명확한 예제와 가이드
- 🛠️ **테스트 간소화**: Postman Collection 제공
- 📖 **일관성 유지**: OpenAPI 표준 준수
- 🚀 **API 품질**: 명확한 스펙으로 구현 품질 향상

4주간의 체계적인 문서화로 완성도 높은 API 문서를 제공합니다.

---

**작성일**: 2025-11-12  
**작성자**: AUTOAGENTS  
**버전**: 1.0
