# 💬 DM (Direct Message) 시스템 설계 문서

**작성일**: 2025년 11월 10일 16:40  
**버전**: 1.0  
**예상 개발 기간**: 2일 (Backend 1.5일 + Frontend 0.5일)

---

## 📋 목차

1. [개요](#개요)
2. [데이터베이스 스키마](#데이터베이스-스키마)
3. [Backend API 명세](#backend-api-명세)
4. [Frontend 컴포넌트](#frontend-컴포넌트)
5. [WebSocket 이벤트](#websocket-이벤트)
6. [구현 순서](#구현-순서)

---

## 개요

### 목적
사용자 간 1:1 실시간 메시지 시스템 구현

### 주요 기능
- ✅ 1:1 실시간 메시지 전송/수신
- ✅ 대화 목록 관리
- ✅ 읽음 확인 (Read Receipt)
- ✅ 타이핑 인디케이터
- ✅ 메시지 검색
- ✅ 첨부파일 지원 (이미지, 파일)
- ✅ 메시지 삭제 (소프트 삭제)
- ✅ 알림 통합

### 기술 스택
- **Backend**: Node.js, Express, MySQL, Socket.IO
- **Frontend**: React, TypeScript, Socket.IO Client
- **Database**: MariaDB/MySQL
- **Real-time**: Socket.IO

---

## 데이터베이스 스키마

### 1. `dm_conversations` 테이블
대화방 정보

```sql
CREATE TABLE dm_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant1_id INT NOT NULL,
    participant2_id INT NOT NULL,
    last_message_id INT DEFAULT NULL,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_participant1 (participant1_id),
    INDEX idx_participant2 (participant2_id),
    INDEX idx_participants (participant1_id, participant2_id),
    INDEX idx_last_message (last_message_at DESC),
    
    -- Foreign Keys
    FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint: 같은 사용자 간 대화방 중복 방지
    UNIQUE KEY unique_conversation (
        LEAST(participant1_id, participant2_id),
        GREATEST(participant1_id, participant2_id)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. `direct_messages` 테이블
실제 메시지 데이터

```sql
CREATE TABLE direct_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
    
    -- 첨부파일 정보
    attachment_url VARCHAR(500) DEFAULT NULL,
    attachment_name VARCHAR(255) DEFAULT NULL,
    attachment_size INT DEFAULT NULL,
    attachment_type VARCHAR(100) DEFAULT NULL,
    
    -- 상태 정보
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL DEFAULT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    deleted_by INT DEFAULT NULL,
    
    -- 메타데이터
    reply_to_id INT DEFAULT NULL,
    edited_at TIMESTAMP NULL DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_conversation (conversation_id, created_at DESC),
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_read_status (receiver_id, is_read),
    INDEX idx_deleted (is_deleted),
    FULLTEXT INDEX ft_content (content),
    
    -- Foreign Keys
    FOREIGN KEY (conversation_id) REFERENCES dm_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES direct_messages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. `dm_read_receipts` 테이블 (선택적)
읽음 확인 추적

```sql
CREATE TABLE dm_read_receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_message (message_id),
    INDEX idx_user (user_id),
    
    FOREIGN KEY (message_id) REFERENCES direct_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_read (message_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Backend API 명세

### Base URL
```
http://localhost:3001/api/dm
```

### 1. 대화 목록 조회
**GET** `/api/dm/conversations`

**Query Parameters**:
- `page` (optional): 페이지 번호 (default: 1)
- `limit` (optional): 페이지당 개수 (default: 20)
- `search` (optional): 검색어

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": 1,
        "participant": {
          "id": 2,
          "username": "john_doe",
          "avatar": "/uploads/avatars/john.jpg",
          "is_online": true
        },
        "last_message": {
          "id": 123,
          "content": "Hello!",
          "sender_id": 2,
          "created_at": "2025-11-10T10:30:00Z",
          "is_read": false
        },
        "unread_count": 3,
        "created_at": "2025-11-10T09:00:00Z",
        "updated_at": "2025-11-10T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  }
}
```

---

### 2. 메시지 목록 조회
**GET** `/api/dm/messages/:conversationId`

**Path Parameters**:
- `conversationId`: 대화방 ID

**Query Parameters**:
- `page` (optional): 페이지 번호 (default: 1)
- `limit` (optional): 페이지당 개수 (default: 50)
- `before` (optional): 특정 메시지 ID 이전 메시지 조회

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "conversation_id": 1,
    "participant": {
      "id": 2,
      "username": "john_doe",
      "avatar": "/uploads/avatars/john.jpg"
    },
    "messages": [
      {
        "id": 123,
        "sender_id": 1,
        "receiver_id": 2,
        "content": "Hello!",
        "message_type": "text",
        "is_read": true,
        "read_at": "2025-11-10T10:31:00Z",
        "created_at": "2025-11-10T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 234,
      "has_more": true
    }
  }
}
```

---

### 3. 메시지 전송
**POST** `/api/dm/send`

**Request Body**:
```json
{
  "receiver_id": 2,
  "content": "Hello!",
  "message_type": "text",
  "reply_to_id": null
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "message": {
      "id": 124,
      "conversation_id": 1,
      "sender_id": 1,
      "receiver_id": 2,
      "content": "Hello!",
      "message_type": "text",
      "is_read": false,
      "created_at": "2025-11-10T10:35:00Z"
    }
  }
}
```

---

### 4. 읽음 처리
**PUT** `/api/dm/read/:messageId`

**Path Parameters**:
- `messageId`: 메시지 ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message_id": 123,
    "is_read": true,
    "read_at": "2025-11-10T10:36:00Z"
  }
}
```

---

### 5. 대화의 모든 메시지 읽음 처리
**PUT** `/api/dm/read-all/:conversationId`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "conversation_id": 1,
    "marked_read": 5
  }
}
```

---

### 6. 메시지 삭제 (소프트 삭제)
**DELETE** `/api/dm/messages/:messageId`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message_id": 123,
    "deleted": true
  }
}
```

---

### 7. 첨부파일 업로드
**POST** `/api/dm/attachment`

**Request**: `multipart/form-data`
- `file`: 파일 (최대 10MB)
- `receiver_id`: 수신자 ID
- `conversation_id`: 대화방 ID (optional)

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "message": {
      "id": 125,
      "conversation_id": 1,
      "sender_id": 1,
      "receiver_id": 2,
      "message_type": "image",
      "attachment_url": "/uploads/dm/2025/11/image.jpg",
      "attachment_name": "image.jpg",
      "attachment_size": 1024000,
      "attachment_type": "image/jpeg",
      "created_at": "2025-11-10T10:40:00Z"
    }
  }
}
```

---

### 8. 메시지 검색
**GET** `/api/dm/search`

**Query Parameters**:
- `q`: 검색어 (required)
- `conversation_id` (optional): 특정 대화방 내 검색
- `page` (optional): 페이지 번호
- `limit` (optional): 페이지당 개수

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "query": "hello",
    "results": [
      {
        "message": {
          "id": 123,
          "content": "Hello!",
          "sender_id": 1,
          "created_at": "2025-11-10T10:30:00Z"
        },
        "conversation": {
          "id": 1,
          "participant": {
            "id": 2,
            "username": "john_doe"
          }
        }
      }
    ],
    "total": 12
  }
}
```

---

### 9. 대화 삭제
**DELETE** `/api/dm/conversations/:conversationId`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "conversation_id": 1,
    "deleted": true
  }
}
```

---

### 10. 안읽은 메시지 개수
**GET** `/api/dm/unread-count`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total_unread": 12,
    "conversations": [
      {
        "conversation_id": 1,
        "unread_count": 5
      },
      {
        "conversation_id": 3,
        "unread_count": 7
      }
    ]
  }
}
```

---

## WebSocket 이벤트

### Client → Server

#### 1. `dm:send`
메시지 전송

```javascript
socket.emit('dm:send', {
  receiver_id: 2,
  content: 'Hello!',
  message_type: 'text',
  conversation_id: 1
});
```

#### 2. `dm:typing`
타이핑 중 알림

```javascript
socket.emit('dm:typing', {
  receiver_id: 2,
  conversation_id: 1,
  is_typing: true
});
```

#### 3. `dm:read`
메시지 읽음 처리

```javascript
socket.emit('dm:read', {
  message_id: 123,
  conversation_id: 1
});
```

---

### Server → Client

#### 1. `dm:new_message`
새 메시지 수신

```javascript
socket.on('dm:new_message', (data) => {
  console.log('New message:', data);
  // data: { message, conversation, sender }
});
```

#### 2. `dm:typing`
상대방 타이핑 중

```javascript
socket.on('dm:typing', (data) => {
  console.log('User typing:', data);
  // data: { user_id, conversation_id, is_typing }
});
```

#### 3. `dm:read_receipt`
읽음 확인

```javascript
socket.on('dm:read_receipt', (data) => {
  console.log('Message read:', data);
  // data: { message_id, read_at, user_id }
});
```

#### 4. `dm:message_deleted`
메시지 삭제됨

```javascript
socket.on('dm:message_deleted', (data) => {
  console.log('Message deleted:', data);
  // data: { message_id, conversation_id }
});
```

---

## Frontend 컴포넌트

### 1. `DMInbox.tsx` (150 lines)
DM 목록 컴포넌트

**Props**:
```typescript
interface DMInboxProps {
  userId: number;
  onSelectConversation: (conversationId: number) => void;
}
```

**주요 기능**:
- 대화 목록 표시
- 안읽은 메시지 개수 표시
- 최근 메시지 미리보기
- 온라인 상태 표시
- 검색 기능
- 무한 스크롤

---

### 2. `DMConversation.tsx` (200 lines)
대화 창 컴포넌트

**Props**:
```typescript
interface DMConversationProps {
  conversationId: number;
  participant: User;
  onClose?: () => void;
}
```

**주요 기능**:
- 메시지 목록 표시
- 실시간 메시지 수신
- 스크롤 자동 이동
- 읽음 확인 표시
- 타이핑 인디케이터
- 메시지 삭제

---

### 3. `DMMessageInput.tsx` (100 lines)
메시지 입력 컴포넌트

**Props**:
```typescript
interface DMMessageInputProps {
  conversationId: number;
  receiverId: number;
  onSendMessage: (message: Message) => void;
}
```

**주요 기능**:
- 텍스트 입력
- 첨부파일 업로드
- 타이핑 이벤트 발생
- Enter 전송 (Shift+Enter 줄바꿈)
- 이모지 선택기 (선택적)

---

### 4. `DMNotification.tsx` (50 lines)
DM 알림 컴포넌트

**Props**:
```typescript
interface DMNotificationProps {
  userId: number;
}
```

**주요 기능**:
- 안읽은 메시지 개수 표시
- 새 메시지 알림 (Toast)
- DM 목록으로 이동 버튼
- 실시간 업데이트

---

## 구현 순서

### Phase 1: Backend 기본 구조 (4시간)
1. ✅ DB 마이그레이션 파일 작성
2. ✅ `dm-service.js` 파일 생성
3. ✅ 기본 CRUD API 구현
   - 대화 목록 조회
   - 메시지 목록 조회
   - 메시지 전송

### Phase 2: Backend 고급 기능 (4시간)
4. ✅ 읽음 처리 API
5. ✅ 메시지 삭제 API
6. ✅ 첨부파일 업로드
7. ✅ 메시지 검색
8. ✅ 안읽은 메시지 개수

### Phase 3: WebSocket 통합 (4시간)
9. ✅ Socket.IO 이벤트 핸들러
10. ✅ 실시간 메시지 전송
11. ✅ 타이핑 인디케이터
12. ✅ 읽음 확인

### Phase 4: Frontend 기본 컴포넌트 (4시간)
13. ✅ `DMInbox.tsx` 구현
14. ✅ `DMConversation.tsx` 구현
15. ✅ `DMMessageInput.tsx` 구현
16. ✅ Socket.IO 클라이언트 연결

### Phase 5: 통합 및 테스트 (2시간)
17. ✅ E2E 테스트 실행
18. ✅ 버그 수정
19. ✅ UI/UX 개선
20. ✅ 성능 최적화

**총 예상 시간**: 18시간 (2.25일)

---

## 보안 고려사항

### 1. 인증 및 권한
- JWT 토큰 검증
- 본인 메시지만 조회/삭제 가능
- 차단된 사용자와 DM 불가

### 2. 입력 검증
- XSS 방어 (DOMPurify)
- SQL Injection 방어 (Prepared Statements)
- 파일 업로드 검증 (크기, 확장자)

### 3. Rate Limiting
- 메시지 전송: 60req/min
- 파일 업로드: 10req/min
- API 조회: 100req/min

### 4. 데이터 암호화
- 메시지 내용 암호화 (선택적)
- HTTPS 통신
- WebSocket Secure (WSS)

---

## 성능 최적화

### 1. Database
- 인덱스 최적화
- 페이지네이션
- 쿼리 최적화

### 2. Caching
- Redis 캐싱
  - 대화 목록
  - 안읽은 메시지 개수
  - 온라인 상태

### 3. Frontend
- 무한 스크롤
- 가상 스크롤 (react-window)
- 이미지 Lazy Loading
- WebSocket 연결 풀링

---

## 테스트 계획

### 1. Unit Tests
- Service 함수 테스트
- API 엔드포인트 테스트
- WebSocket 이벤트 테스트

### 2. E2E Tests
```typescript
// tests/e2e/dm.spec.ts (8 tests)
test('should send DM', async () => { /* ... */ });
test('should receive DM in real-time', async () => { /* ... */ });
test('should mark message as read', async () => { /* ... */ });
test('should show typing indicator', async () => { /* ... */ });
test('should upload attachment', async () => { /* ... */ });
test('should search messages', async () => { /* ... */ });
test('should delete message', async () => { /* ... */ });
test('should show unread count', async () => { /* ... */ });
```

---

## 다음 단계

1. ✅ 설계 문서 작성 완료
2. ⏳ MariaDB 시작 대기
3. ⏳ DB 마이그레이션 실행
4. ⏳ Backend 구현 시작
5. ⏳ Frontend 구현
6. ⏳ E2E 테스트

---

**작성자**: AUTOAGENTS  
**최종 수정**: 2025년 11월 10일 16:40

© 2025 LeeHwiRyeon. All rights reserved.
