# 👥 그룹 채팅 시스템 설계 문서

**작성일**: 2025년 11월 10일 16:50  
**버전**: 1.0  
**예상 개발 기간**: 3일 (Backend 2일 + Frontend 1일)

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
다수의 사용자가 참여하는 실시간 그룹 채팅 시스템 구현

### 주요 기능
- ✅ 그룹 생성/수정/삭제
- ✅ 멤버 초대/추방/역할 관리
- ✅ 실시간 그룹 메시지 송수신
- ✅ 그룹 설정 (공개/비공개, 최대 인원)
- ✅ 멤버 목록 및 온라인 상태
- ✅ 메시지 검색
- ✅ 첨부파일 지원
- ✅ 알림 통합
- ✅ 읽음 확인 (선택적)

### 기술 스택
- **Backend**: Node.js, Express, MySQL, Socket.IO
- **Frontend**: React, TypeScript, Socket.IO Client
- **Database**: MariaDB/MySQL
- **Real-time**: Socket.IO (Room 기능 활용)

---

## 데이터베이스 스키마

### 1. `chat_groups` 테이블
그룹 정보

```sql
CREATE TABLE chat_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    avatar_url VARCHAR(500) DEFAULT NULL,
    
    -- 소유자 및 권한
    owner_id INT NOT NULL,
    
    -- 그룹 설정
    is_private BOOLEAN DEFAULT FALSE,
    max_members INT DEFAULT 100,
    allow_invite BOOLEAN DEFAULT TRUE,
    
    -- 통계
    member_count INT DEFAULT 1,
    message_count INT DEFAULT 0,
    
    -- 메타데이터
    last_message_id INT DEFAULT NULL,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Indexes
    INDEX idx_owner (owner_id),
    INDEX idx_private (is_private),
    INDEX idx_active (deleted_at),
    INDEX idx_last_message (last_message_at DESC),
    FULLTEXT INDEX ft_name_desc (name, description),
    
    -- Foreign Keys
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2. `group_members` 테이블
그룹 멤버 정보

```sql
CREATE TABLE group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- 역할: owner, admin, member
    role ENUM('owner', 'admin', 'member') DEFAULT 'member',
    
    -- 권한
    can_invite BOOLEAN DEFAULT TRUE,
    can_kick BOOLEAN DEFAULT FALSE,
    can_manage BOOLEAN DEFAULT FALSE,
    
    -- 알림 설정
    muted BOOLEAN DEFAULT FALSE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    
    -- 읽음 상태
    last_read_message_id INT DEFAULT NULL,
    last_read_at TIMESTAMP NULL DEFAULT NULL,
    unread_count INT DEFAULT 0,
    
    -- 메타데이터
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL DEFAULT NULL,
    invited_by INT DEFAULT NULL,
    
    -- Indexes
    INDEX idx_group (group_id),
    INDEX idx_user (user_id),
    INDEX idx_role (group_id, role),
    INDEX idx_active (group_id, left_at),
    
    -- Foreign Keys
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique constraint: 같은 그룹에 중복 가입 방지
    UNIQUE KEY unique_member (group_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 3. `group_messages` 테이블
그룹 메시지

```sql
CREATE TABLE group_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- 메시지 내용
    content TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'system', 'announcement') DEFAULT 'text',
    
    -- 첨부파일 정보
    attachment_url VARCHAR(500) DEFAULT NULL,
    attachment_name VARCHAR(255) DEFAULT NULL,
    attachment_size INT DEFAULT NULL,
    attachment_type VARCHAR(100) DEFAULT NULL,
    
    -- 메시지 상태
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    deleted_by INT DEFAULT NULL,
    
    -- 메타데이터
    reply_to_id INT DEFAULT NULL,
    edited_at TIMESTAMP NULL DEFAULT NULL,
    
    -- 멘션 (JSON 배열)
    mentioned_users JSON DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_group (group_id, created_at DESC),
    INDEX idx_user (user_id),
    INDEX idx_deleted (is_deleted),
    INDEX idx_type (message_type),
    FULLTEXT INDEX ft_content (content),
    
    -- Foreign Keys
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES group_messages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 4. `group_invitations` 테이블
그룹 초대

```sql
CREATE TABLE group_invitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    inviter_id INT NOT NULL,
    invitee_id INT NOT NULL,
    
    -- 초대 상태: pending, accepted, rejected, expired
    status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
    
    -- 메시지
    message TEXT DEFAULT NULL,
    
    -- 만료 시간
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 7 DAY),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Indexes
    INDEX idx_group (group_id),
    INDEX idx_invitee (invitee_id, status),
    INDEX idx_status (status, expires_at),
    
    -- Foreign Keys
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint: 같은 사용자에게 중복 초대 방지
    UNIQUE KEY unique_invitation (group_id, invitee_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 5. `group_read_receipts` 테이블 (선택적)
읽음 확인

```sql
CREATE TABLE group_read_receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    group_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_message (message_id),
    INDEX idx_user_group (user_id, group_id),
    
    FOREIGN KEY (message_id) REFERENCES group_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_read (message_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Backend API 명세

### Base URL
```
http://localhost:3001/api/chat/groups
```

---

### 1. 그룹 생성
**POST** `/api/chat/groups`

**Request Body**:
```json
{
  "name": "개발자 모임",
  "description": "개발 관련 이야기를 나누는 그룹입니다.",
  "is_private": false,
  "max_members": 100,
  "avatar_url": "/uploads/groups/avatar.jpg"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "group": {
      "id": 1,
      "name": "개발자 모임",
      "description": "개발 관련 이야기를 나누는 그룹입니다.",
      "owner_id": 1,
      "is_private": false,
      "max_members": 100,
      "member_count": 1,
      "created_at": "2025-11-10T10:00:00Z"
    }
  }
}
```

---

### 2. 그룹 목록 조회
**GET** `/api/chat/groups`

**Query Parameters**:
- `page` (optional): 페이지 번호
- `limit` (optional): 페이지당 개수
- `search` (optional): 검색어
- `type` (optional): `my` (내 그룹), `public` (공개 그룹)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "id": 1,
        "name": "개발자 모임",
        "description": "개발 관련 이야기...",
        "avatar_url": "/uploads/groups/avatar.jpg",
        "owner": {
          "id": 1,
          "username": "admin"
        },
        "is_private": false,
        "member_count": 25,
        "message_count": 1234,
        "my_role": "member",
        "unread_count": 5,
        "last_message": {
          "content": "Hello!",
          "created_at": "2025-11-10T10:30:00Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  }
}
```

---

### 3. 그룹 상세 조회
**GET** `/api/chat/groups/:groupId`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "group": {
      "id": 1,
      "name": "개발자 모임",
      "description": "개발 관련 이야기...",
      "avatar_url": "/uploads/groups/avatar.jpg",
      "owner_id": 1,
      "is_private": false,
      "max_members": 100,
      "member_count": 25,
      "message_count": 1234,
      "created_at": "2025-11-10T10:00:00Z",
      "my_role": "member",
      "my_permissions": {
        "can_invite": true,
        "can_kick": false,
        "can_manage": false
      }
    }
  }
}
```

---

### 4. 그룹 수정
**PUT** `/api/chat/groups/:groupId`

**Request Body**:
```json
{
  "name": "개발자 모임 (Updated)",
  "description": "새로운 설명",
  "max_members": 150
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "group": { /* updated group */ }
  }
}
```

---

### 5. 그룹 삭제
**DELETE** `/api/chat/groups/:groupId`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "group_id": 1,
    "deleted": true
  }
}
```

---

### 6. 멤버 목록 조회
**GET** `/api/chat/groups/:groupId/members`

**Query Parameters**:
- `page` (optional)
- `limit` (optional)
- `role` (optional): `owner`, `admin`, `member`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": 1,
        "user": {
          "id": 2,
          "username": "john_doe",
          "avatar": "/uploads/avatars/john.jpg",
          "is_online": true
        },
        "role": "admin",
        "permissions": {
          "can_invite": true,
          "can_kick": true,
          "can_manage": true
        },
        "joined_at": "2025-11-10T10:05:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25
    }
  }
}
```

---

### 7. 멤버 초대
**POST** `/api/chat/groups/:groupId/invite`

**Request Body**:
```json
{
  "user_id": 3,
  "message": "Join our group!"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "invitation": {
      "id": 1,
      "group_id": 1,
      "invitee_id": 3,
      "status": "pending",
      "expires_at": "2025-11-17T10:00:00Z"
    }
  }
}
```

---

### 8. 초대 응답
**PUT** `/api/chat/groups/invitations/:invitationId`

**Request Body**:
```json
{
  "status": "accepted"  // or "rejected"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "invitation": {
      "id": 1,
      "status": "accepted",
      "responded_at": "2025-11-10T10:35:00Z"
    },
    "member": { /* new member info */ }
  }
}
```

---

### 9. 멤버 추방
**DELETE** `/api/chat/groups/:groupId/members/:userId`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "group_id": 1,
    "user_id": 3,
    "kicked": true
  }
}
```

---

### 10. 멤버 역할 변경
**PUT** `/api/chat/groups/:groupId/members/:userId/role`

**Request Body**:
```json
{
  "role": "admin"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "member": {
      "user_id": 3,
      "role": "admin",
      "permissions": {
        "can_invite": true,
        "can_kick": true,
        "can_manage": true
      }
    }
  }
}
```

---

### 11. 그룹 나가기
**POST** `/api/chat/groups/:groupId/leave`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "group_id": 1,
    "left": true
  }
}
```

---

### 12. 메시지 목록 조회
**GET** `/api/chat/groups/:groupId/messages`

**Query Parameters**:
- `page` (optional)
- `limit` (optional, default: 50)
- `before` (optional): 특정 메시지 ID 이전

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 123,
        "group_id": 1,
        "user": {
          "id": 2,
          "username": "john_doe",
          "avatar": "/uploads/avatars/john.jpg"
        },
        "content": "Hello everyone!",
        "message_type": "text",
        "is_deleted": false,
        "created_at": "2025-11-10T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1234,
      "has_more": true
    }
  }
}
```

---

### 13. 메시지 전송
**POST** `/api/chat/groups/:groupId/messages`

**Request Body**:
```json
{
  "content": "Hello everyone!",
  "message_type": "text",
  "reply_to_id": null,
  "mentioned_users": [3, 5]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "message": {
      "id": 124,
      "group_id": 1,
      "user_id": 1,
      "content": "Hello everyone!",
      "message_type": "text",
      "created_at": "2025-11-10T10:35:00Z"
    }
  }
}
```

---

### 14. 메시지 삭제
**DELETE** `/api/chat/groups/:groupId/messages/:messageId`

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

### 15. 그룹 설정 변경
**PUT** `/api/chat/groups/:groupId/settings`

**Request Body**:
```json
{
  "muted": false,
  "notification_enabled": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "settings": {
      "muted": false,
      "notification_enabled": true
    }
  }
}
```

---

### 16. 그룹 검색
**GET** `/api/chat/groups/search`

**Query Parameters**:
- `q`: 검색어 (required)
- `page`, `limit`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "query": "개발",
    "results": [
      {
        "group": { /* group info */ },
        "relevance": 0.95
      }
    ],
    "total": 12
  }
}
```

---

## WebSocket 이벤트

### Client → Server

#### 1. `group:join`
그룹 채팅방 입장

```javascript
socket.emit('group:join', {
  group_id: 1
});
```

#### 2. `group:leave`
그룹 채팅방 퇴장

```javascript
socket.emit('group:leave', {
  group_id: 1
});
```

#### 3. `group:send_message`
메시지 전송

```javascript
socket.emit('group:send_message', {
  group_id: 1,
  content: 'Hello!',
  message_type: 'text'
});
```

#### 4. `group:typing`
타이핑 중

```javascript
socket.emit('group:typing', {
  group_id: 1,
  is_typing: true
});
```

---

### Server → Client

#### 1. `group:new_message`
새 메시지 수신

```javascript
socket.on('group:new_message', (data) => {
  // data: { message, group_id, sender }
});
```

#### 2. `group:member_joined`
새 멤버 입장

```javascript
socket.on('group:member_joined', (data) => {
  // data: { group_id, member, joined_at }
});
```

#### 3. `group:member_left`
멤버 퇴장

```javascript
socket.on('group:member_left', (data) => {
  // data: { group_id, user_id }
});
```

#### 4. `group:typing`
타이핑 중 알림

```javascript
socket.on('group:typing', (data) => {
  // data: { group_id, user_id, username, is_typing }
});
```

#### 5. `group:message_deleted`
메시지 삭제됨

```javascript
socket.on('group:message_deleted', (data) => {
  // data: { group_id, message_id }
});
```

#### 6. `group:updated`
그룹 정보 업데이트

```javascript
socket.on('group:updated', (data) => {
  // data: { group_id, updated_fields }
});
```

---

## Frontend 컴포넌트

### 1. `GroupChatList.tsx` (150 lines)
그룹 목록 컴포넌트

**Props**:
```typescript
interface GroupChatListProps {
  userId: number;
  onSelectGroup: (groupId: number) => void;
}
```

**주요 기능**:
- 내 그룹 목록
- 공개 그룹 탐색
- 안읽은 메시지 개수
- 그룹 생성 버튼
- 검색 기능

---

### 2. `GroupChatRoom.tsx` (250 lines)
그룹 채팅방 컴포넌트

**Props**:
```typescript
interface GroupChatRoomProps {
  groupId: number;
  onClose?: () => void;
}
```

**주요 기능**:
- 메시지 목록 표시
- 실시간 메시지 송수신
- 타이핑 인디케이터
- 멤버 온라인 상태
- 멘션 기능
- 첨부파일

---

### 3. `GroupChatSettings.tsx` (150 lines)
그룹 설정 컴포넌트

**Props**:
```typescript
interface GroupChatSettingsProps {
  groupId: number;
  onClose?: () => void;
}
```

**주요 기능**:
- 그룹 정보 수정
- 멤버 관리
- 알림 설정
- 그룹 나가기/삭제

---

### 4. `GroupMemberList.tsx` (100 lines)
멤버 목록 컴포넌트

**Props**:
```typescript
interface GroupMemberListProps {
  groupId: number;
  canManage: boolean;
}
```

**주요 기능**:
- 멤버 목록 표시
- 역할 표시 (owner/admin/member)
- 온라인 상태
- 멤버 추방 (관리자)
- 역할 변경 (관리자)

---

### 5. `CreateGroupDialog.tsx` (100 lines)
그룹 생성 다이얼로그

**Props**:
```typescript
interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (group: Group) => void;
}
```

**주요 기능**:
- 그룹 이름/설명 입력
- 아바타 업로드
- 공개/비공개 설정
- 최대 인원 설정

---

## 구현 순서

### Phase 1: Backend 기본 구조 (6시간)
1. ✅ DB 마이그레이션 파일 작성
2. ✅ `group-chat-service.js` 파일 생성
3. ✅ 그룹 CRUD API
   - 그룹 생성/조회/수정/삭제
   - 그룹 목록 조회

### Phase 2: Backend 멤버 관리 (4시간)
4. ✅ 멤버 관리 API
   - 멤버 목록/초대/추방
   - 역할 변경
   - 초대 응답

### Phase 3: Backend 메시지 (4시간)
5. ✅ 메시지 API
   - 메시지 전송/조회/삭제
   - 첨부파일
   - 검색

### Phase 4: WebSocket 통합 (4시간)
6. ✅ Socket.IO 이벤트 핸들러
7. ✅ 그룹 방 관리 (join/leave)
8. ✅ 실시간 메시지 브로드캐스트
9. ✅ 타이핑 인디케이터

### Phase 5: Frontend 컴포넌트 (8시간)
10. ✅ `GroupChatList.tsx`
11. ✅ `GroupChatRoom.tsx`
12. ✅ `GroupMemberList.tsx`
13. ✅ `GroupChatSettings.tsx`
14. ✅ `CreateGroupDialog.tsx`

### Phase 6: 통합 및 테스트 (2시간)
15. ✅ E2E 테스트 실행
16. ✅ 버그 수정
17. ✅ UI/UX 개선

**총 예상 시간**: 28시간 (3.5일)

---

## 보안 고려사항

### 1. 권한 검증
- 그룹 소유자만 삭제 가능
- 관리자만 멤버 추방 가능
- 멤버만 메시지 전송 가능

### 2. 입력 검증
- 그룹 이름 길이 제한 (100자)
- 최대 인원 제한 (100명)
- 멘션 남용 방지

### 3. Rate Limiting
- 그룹 생성: 5req/hour
- 메시지 전송: 60req/min
- 초대 발송: 10req/min

---

## 다음 단계

1. ✅ 설계 문서 작성 완료
2. ⏳ MariaDB 시작 대기
3. ⏳ DB 마이그레이션 실행
4. ⏳ Backend 구현 시작

---

**작성자**: AUTOAGENTS  
**최종 수정**: 2025년 11월 10일 16:50

© 2025 LeeHwiRyeon. All rights reserved.
