# 실시간 알림 시스템 통합 가이드

## 작성일: 2025년 11월 9일

이 문서는 WebSocket 기반 실시간 알림 시스템을 기존 Express 서버에 통합하는 방법을 설명합니다.

## 1. 서버 시작 파일 (index.js 또는 server.js) 수정

```javascript
const express = require('express');
const http = require('http');
const notificationSocket = require('./sockets/notification-socket');

const app = express();

// HTTP 서버 생성 (Socket.IO를 위해 필요)
const server = http.createServer(app);

// 기존 라우트 및 미들웨어 설정
// ... (기존 코드)

// Socket.IO 초기화
notificationSocket.initialize(server).then(() => {
  console.log('✅ Socket.IO initialized');
}).catch((error) => {
  console.error('❌ Socket.IO initialization failed:', error);
});

// 알림 라우트 등록
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

// 서버 시작 (app.listen 대신 server.listen 사용)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 2. 데이터베이스 마이그레이션 실행

```bash
# MySQL 클라이언트로 마이그레이션 실행
mysql -u root -p community < server-backend/migrations/007_create_notifications_table.sql
```

또는 Node.js 스크립트로 실행:

```javascript
const mysql = require('mysql2/promise');
const fs = require('fs');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  const sql = fs.readFileSync('./migrations/007_create_notifications_table.sql', 'utf8');
  await connection.query(sql);
  
  console.log('✅ Notifications tables created');
  await connection.end();
}

runMigration().catch(console.error);
```

## 3. 환경 변수 설정 (.env)

```env
# WebSocket 설정
FRONTEND_URL=http://localhost:3000

# Redis 설정 (멀티 서버 지원)
REDIS_HOST=localhost
REDIS_PORT=6379
# 또는
REDIS_URL=redis://localhost:6379
```

## 4. 다른 서비스에서 알림 전송하기

### 예시 1: 댓글 작성 시 알림

```javascript
// routes/comments.js
const notificationService = require('../services/notification-service');
const notificationSocket = require('../sockets/notification-socket');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { postId, content } = req.body;
    const userId = req.user.userId;

    // 댓글 저장
    const comment = await commentService.createComment(postId, userId, content);

    // 게시물 작성자에게 알림 전송
    const post = await postService.getPostById(postId);
    if (post.author_id !== userId) {
      const notification = await notificationService.notifyComment(
        post.author_id,
        req.user.username,
        post.title,
        postId
      );

      // 실시간 전송
      if (notification) {
        notificationSocket.sendNotificationToUser(post.author_id, notification);
      }
    }

    res.json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 예시 2: 좋아요 시 알림

```javascript
// routes/likes.js
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // 좋아요 저장
    await likeService.addLike(postId, userId);

    // 게시물 작성자에게 알림
    const post = await postService.getPostById(postId);
    if (post.author_id !== userId) {
      const notification = await notificationService.notifyLike(
        post.author_id,
        req.user.username,
        post.title,
        postId
      );

      if (notification) {
        notificationSocket.sendNotificationToUser(post.author_id, notification);
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 예시 3: 시스템 알림 (전체 브로드캐스트)

```javascript
// admin/system.js
router.post('/announce', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, message } = req.body;

    // 모든 사용자에게 시스템 알림
    const users = await userService.getAllUsers();
    
    for (const user of users) {
      const notification = await notificationService.notifySystem(
        user.id,
        title,
        message,
        null
      );

      if (notification) {
        notificationSocket.sendNotificationToUser(user.id, notification);
      }
    }

    res.json({ success: true, message: `${users.length}명에게 알림 전송` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 5. 테스트

### 개발 환경에서 테스트 알림 전송

```bash
# 서버 실행
cd server-backend
npm run dev

# 다른 터미널에서 테스트 요청
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "system",
    "title": "테스트 알림",
    "message": "WebSocket 테스트입니다!"
  }'
```

### WebSocket 연결 테스트 (Browser Console)

```javascript
// Browser Developer Console에서 실행
const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN'
  }
});

socket.on('connected', (data) => {
  console.log('✅ Connected:', data);
});

socket.on('notification', (notification) => {
  console.log('🔔 New notification:', notification);
});

socket.on('unread-count', (data) => {
  console.log('📊 Unread count:', data.count);
});
```

## 6. API 엔드포인트

| Method | Endpoint                         | 설명                      |
| ------ | -------------------------------- | ------------------------- |
| GET    | `/api/notifications`             | 알림 목록 조회            |
| GET    | `/api/notifications/count`       | 읽지 않은 알림 개수       |
| GET    | `/api/notifications/:id`         | 특정 알림 조회            |
| PUT    | `/api/notifications/:id/read`    | 알림 읽음 처리            |
| PUT    | `/api/notifications/read-all`    | 모든 알림 읽음 처리       |
| DELETE | `/api/notifications/:id`         | 알림 삭제                 |
| GET    | `/api/notifications/settings/me` | 알림 설정 조회            |
| PUT    | `/api/notifications/settings/me` | 알림 설정 업데이트        |
| POST   | `/api/notifications/test`        | 테스트 알림 전송 (개발용) |

## 7. WebSocket 이벤트

### Client → Server
- `ping`: 연결 확인

### Server → Client
- `connected`: 연결 성공
- `notification`: 새 알림
- `unread-count`: 읽지 않은 알림 개수 업데이트
- `pong`: ping 응답

## 8. 트러블슈팅

### Redis 연결 오류
```
Redis adapter setup failed, using in-memory adapter
```
→ Redis가 실행 중이 아니거나 연결 정보가 잘못되었습니다. 개발 환경에서는 in-memory로 동작합니다.

### JWT 인증 오류
```
Authentication token required
```
→ Socket.IO 연결 시 `auth.token`에 올바른 JWT 토큰을 전달해야 합니다.

### CORS 오류
```
CORS policy blocked
```
→ `.env` 파일의 `FRONTEND_URL`이 올바른지 확인하세요.

## 9. 다음 단계

- Frontend에 NotificationContext 구현
- NotificationBell 컴포넌트 구현
- NotificationCenter UI 구현
- E2E 테스트 작성

---

**작성자**: AUTOAGENTS  
**날짜**: 2025년 11월 9일
