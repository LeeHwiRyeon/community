# 🚀 Phase 3 기능 개발 계획서

**버전**: 1.0  
**작성일**: 2025년 11월 12일  
**대상 릴리즈**: Community Platform v2.0  
**예상 개발 기간**: 8-12주

---

## 📋 목차

1. [개요](#개요)
2. [실시간 알림 시스템](#1-실시간-알림-시스템-websocket)
3. [채팅 시스템](#2-채팅-시스템)
4. [파일 업로드 시스템](#3-파일-업로드-시스템)
5. [고급 검색 (Elasticsearch)](#4-고급-검색-elasticsearch)
6. [다크 모드](#5-다크-모드)
7. [다국어 지원 (i18n)](#6-다국어-지원-i18n)
8. [개발 일정](#개발-일정)
9. [기술 스택](#기술-스택)
10. [성능 목표](#성능-목표)

---

## 개요

Phase 3는 Community Platform의 사용자 경험을 한 단계 업그레이드하는 **핵심 기능들을 추가**하는 단계입니다.

### 주요 목표
- 📱 **실시간 사용자 경험**: WebSocket 기반 즉각적인 피드백
- 💬 **커뮤니케이션 강화**: 1:1 및 그룹 채팅
- 📎 **콘텐츠 풍부화**: 이미지/파일 업로드
- 🔍 **검색 성능 개선**: 빠르고 정확한 전체 텍스트 검색
- 🎨 **UX 개선**: 다크 모드 및 다국어 지원

---

## 1. 실시간 알림 시스템 (WebSocket)

### 📌 기능 개요

사용자에게 **실시간으로 알림을 전달**하는 시스템으로, 새 댓글, 좋아요, 팔로우, 멘션 등의 이벤트를 즉시 알려줍니다.

### 🎯 핵심 기능

#### 1.1 알림 유형
```typescript
enum NotificationType {
  COMMENT = 'comment',           // 내 게시물에 댓글
  REPLY = 'reply',               // 내 댓글에 답글
  LIKE = 'like',                 // 게시물/댓글 좋아요
  MENTION = 'mention',           // 멘션 (@username)
  FOLLOW = 'follow',             // 새 팔로워
  BOOKMARK = 'bookmark',         // 북마크 (선택적)
  MODERATOR = 'moderator',       // 모더레이터 알림
  SYSTEM = 'system'              // 시스템 공지
}
```

#### 1.2 알림 데이터 구조
```typescript
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  sender: {
    id: number;
    username: string;
    avatar: string;
  };
  relatedContent: {
    type: 'post' | 'comment';
    id: number;
    preview: string;
  };
  createdAt: Date;
}
```

### 🏗️ 기술 설계

#### Backend (WebSocket Server)
```javascript
// server-backend/services/notificationService.js
class NotificationService {
  constructor() {
    this.wss = null;
    this.connections = new Map(); // userId -> WebSocket
    this.redisClient = null; // Redis pub/sub for scaling
  }

  initialize(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws/notifications'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.setupRedisPubSub(); // 다중 서버 지원
  }

  async sendNotification(userId, notification) {
    // 1. DB에 저장
    await this.saveToDatabase(notification);
    
    // 2. WebSocket으로 실시간 전송
    const ws = this.connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'notification',
        data: notification
      }));
    }
    
    // 3. Redis Pub/Sub으로 다른 서버에 전파
    await this.publishToRedis(userId, notification);
  }

  async getUnreadCount(userId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result[0].count;
  }
}
```

#### Frontend (React Hook)
```typescript
// frontend/src/hooks/useNotifications.ts
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const ws = new WebSocket(`ws://localhost:3001/ws/notifications?token=${token}`);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Notification WebSocket connected');
    };

    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      
      if (type === 'notification') {
        setNotifications(prev => [data, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // 브라우저 알림 표시
        if (Notification.permission === 'granted') {
          new Notification(data.title, {
            body: data.message,
            icon: data.sender.avatar
          });
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      // 재연결 로직
      setTimeout(() => {
        // 재연결 시도
      }, 3000);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    await api.put(`/notifications/${notificationId}/read`);
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead
  };
}
```

### 📊 데이터베이스 스키마

```sql
-- 이미 존재: 007_create_notifications_table.sql 활용
-- 추가 인덱스
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type, created_at DESC);

-- 알림 설정 테이블 (이미 존재)
-- notification_settings 테이블 활용
```

### 🎨 UI 컴포넌트

```typescript
// NotificationBell.tsx
export function NotificationBell() {
  const { unreadCount, notifications, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <IconButton onClick={() => setIsOpen(true)} position="relative">
      <BellIcon />
      {unreadCount > 0 && (
        <Badge colorScheme="red" position="absolute" top={-1} right={-1}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </IconButton>
  );
}
```

### 📋 API 엔드포인트

| Method | Endpoint                          | 설명                          |
| ------ | --------------------------------- | ----------------------------- |
| GET    | `/api/notifications`              | 알림 목록 조회 (페이지네이션) |
| GET    | `/api/notifications/unread-count` | 읽지 않은 알림 개수           |
| PUT    | `/api/notifications/:id/read`     | 알림 읽음 처리                |
| PUT    | `/api/notifications/read-all`     | 모든 알림 읽음 처리           |
| DELETE | `/api/notifications/:id`          | 알림 삭제                     |
| GET    | `/api/notifications/settings`     | 알림 설정 조회                |
| PUT    | `/api/notifications/settings`     | 알림 설정 변경                |

### ⏱️ 개발 일정: **2주**

---

## 2. 채팅 시스템

### 📌 기능 개요

사용자 간 **1:1 및 그룹 채팅**을 지원하는 실시간 메시징 시스템입니다.

### 🎯 핵심 기능

#### 2.1 채팅 유형
- **1:1 채팅 (Direct Message)**
- **그룹 채팅** (최대 50명)
- **온라인 상태 표시**
- **타이핑 인디케이터**
- **읽음 표시 (Read Receipts)**
- **파일 공유** (이미지, 문서)

#### 2.2 채팅 데이터 구조
```typescript
interface ChatRoom {
  id: string;
  type: 'direct' | 'group';
  name?: string; // 그룹 채팅만
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
  createdAt: Date;
}

interface Message {
  id: string;
  roomId: string;
  senderId: number;
  content: string;
  type: 'text' | 'image' | 'file';
  attachments?: Attachment[];
  isRead: boolean;
  readBy: number[]; // 읽은 사용자 ID 목록
  createdAt: Date;
}
```

### 🏗️ 기술 설계

#### Backend
```javascript
// server-backend/services/chatService.js
class ChatService {
  async createDirectChat(user1Id, user2Id) {
    // 기존 채팅방 확인
    const existing = await db.query(`
      SELECT room_id FROM chat_participants 
      WHERE user_id IN (?, ?) 
      GROUP BY room_id 
      HAVING COUNT(DISTINCT user_id) = 2
    `, [user1Id, user2Id]);

    if (existing.length > 0) {
      return existing[0].room_id;
    }

    // 새 채팅방 생성
    const roomId = uuidv4();
    await db.query('INSERT INTO chat_rooms (id, type) VALUES (?, ?)', [roomId, 'direct']);
    await db.query('INSERT INTO chat_participants (room_id, user_id) VALUES (?, ?), (?, ?)', 
      [roomId, user1Id, roomId, user2Id]);

    return roomId;
  }

  async sendMessage(roomId, senderId, content, type = 'text') {
    const messageId = uuidv4();
    
    await db.query(`
      INSERT INTO chat_messages (id, room_id, sender_id, content, type)
      VALUES (?, ?, ?, ?, ?)
    `, [messageId, roomId, senderId, content, type]);

    // WebSocket으로 실시간 전송
    const participants = await this.getRoomParticipants(roomId);
    participants.forEach(userId => {
      this.notifyUser(userId, {
        type: 'new_message',
        data: { messageId, roomId, senderId, content, type }
      });
    });

    return messageId;
  }
}
```

#### Frontend
```typescript
// frontend/src/hooks/useChat.ts
export function useChat(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<number[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = async (content: string) => {
    const message = await api.post(`/chat/rooms/${roomId}/messages`, { content });
    
    // WebSocket으로 즉시 전송
    wsRef.current?.send(JSON.stringify({
      type: 'message',
      roomId,
      content
    }));

    return message;
  };

  const sendTypingIndicator = () => {
    wsRef.current?.send(JSON.stringify({
      type: 'typing',
      roomId
    }));
  };

  return {
    messages,
    isTyping,
    sendMessage,
    sendTypingIndicator
  };
}
```

### 📊 데이터베이스 스키마

```sql
-- 채팅방 테이블
CREATE TABLE chat_rooms (
    id VARCHAR(36) PRIMARY KEY,
    type ENUM('direct', 'group') NOT NULL,
    name VARCHAR(100),
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
);

-- 참가자 테이블
CREATE TABLE chat_participants (
    room_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP NULL,
    PRIMARY KEY (room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- 메시지 테이블
CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    type ENUM('text', 'image', 'file') DEFAULT 'text',
    attachments JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_room_created (room_id, created_at DESC)
);

-- 읽음 표시 테이블
CREATE TABLE message_read_receipts (
    message_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 📋 API 엔드포인트

| Method | Endpoint                                       | 설명             |
| ------ | ---------------------------------------------- | ---------------- |
| GET    | `/api/chat/rooms`                              | 채팅방 목록      |
| POST   | `/api/chat/rooms/direct`                       | 1:1 채팅방 생성  |
| POST   | `/api/chat/rooms/group`                        | 그룹 채팅방 생성 |
| GET    | `/api/chat/rooms/:roomId/messages`             | 메시지 목록      |
| POST   | `/api/chat/rooms/:roomId/messages`             | 메시지 전송      |
| PUT    | `/api/chat/rooms/:roomId/read`                 | 읽음 처리        |
| POST   | `/api/chat/rooms/:roomId/participants`         | 참가자 추가      |
| DELETE | `/api/chat/rooms/:roomId/participants/:userId` | 참가자 제거      |

### ⏱️ 개발 일정: **3주**

---

## 3. 파일 업로드 시스템

### 📌 기능 개요

이미지, 문서 등 다양한 파일을 업로드하고 관리하는 시스템입니다.

### 🎯 핵심 기능

#### 3.1 지원 파일 유형
```typescript
const FILE_TYPES = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
  archive: ['zip', 'rar', '7z'],
  text: ['txt', 'md']
};

const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024,      // 10MB
  document: 20 * 1024 * 1024,   // 20MB
  archive: 50 * 1024 * 1024,    // 50MB
  text: 5 * 1024 * 1024         // 5MB
};
```

#### 3.2 이미지 처리
- **자동 리사이징** (썸네일 생성)
- **WebP 변환** (용량 최적화)
- **EXIF 데이터 제거** (프라이버시 보호)
- **워터마크 추가** (선택적)

### 🏗️ 기술 설계

#### Backend (Multer + Sharp)
```javascript
// server-backend/middleware/upload.js
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads', getUploadPath(file));
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('지원하지 않는 파일 형식입니다.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

// 이미지 최적화 미들웨어
async function optimizeImage(req, res, next) {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next();
  }

  try {
    const { filename, path: filePath } = req.file;
    
    // 썸네일 생성
    await sharp(filePath)
      .resize(300, 300, { fit: 'inside' })
      .webp({ quality: 80 })
      .toFile(filePath.replace(/\.[^.]+$/, '_thumb.webp'));

    // 원본 이미지 최적화
    await sharp(filePath)
      .webp({ quality: 90 })
      .toFile(filePath.replace(/\.[^.]+$/, '.webp'));

    // EXIF 데이터 제거
    await sharp(filePath)
      .rotate() // EXIF orientation 적용 후 제거
      .toFile(filePath + '.clean');

    fs.renameSync(filePath + '.clean', filePath);

    next();
  } catch (error) {
    next(error);
  }
}
```

#### Frontend (React Dropzone)
```typescript
// frontend/src/components/FileUpload.tsx
import { useDropzone } from 'react-dropzone';

export function FileUpload({ onUpload }: { onUpload: (files: File[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    
    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });

      onUpload(response.data.files);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf']
    },
    maxSize: 20 * 1024 * 1024
  });

  return (
    <Box
      {...getRootProps()}
      border="2px dashed"
      borderColor={isDragActive ? 'blue.500' : 'gray.300'}
      borderRadius="md"
      p={6}
      textAlign="center"
      cursor="pointer"
    >
      <input {...getInputProps()} />
      {uploading ? (
        <Progress value={progress} size="sm" colorScheme="blue" />
      ) : (
        <Text>파일을 드래그하거나 클릭하여 업로드</Text>
      )}
    </Box>
  );
}
```

### 📊 데이터베이스 스키마

```sql
CREATE TABLE file_uploads (
    id VARCHAR(36) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_uploaded (user_id, uploaded_at DESC)
);
```

### 📋 API 엔드포인트

| Method | Endpoint                        | 설명                    |
| ------ | ------------------------------- | ----------------------- |
| POST   | `/api/upload`                   | 파일 업로드 (multiple)  |
| GET    | `/api/uploads/:fileId`          | 파일 정보 조회          |
| GET    | `/api/uploads/:fileId/download` | 파일 다운로드           |
| DELETE | `/api/uploads/:fileId`          | 파일 삭제               |
| GET    | `/api/uploads/user/:userId`     | 사용자 업로드 파일 목록 |

### 🎨 CDN 통합 (선택사항)

```javascript
// AWS S3 or Cloudflare R2
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function uploadToS3(file) {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: `uploads/${Date.now()}_${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  const result = await s3.upload(params).promise();
  return result.Location; // CDN URL
}
```

### ⏱️ 개발 일정: **2주**

---

## 4. 고급 검색 (Elasticsearch)

### 📌 기능 개요

**빠르고 정확한 전체 텍스트 검색**을 위한 Elasticsearch 통합입니다.

### 🎯 핵심 기능

#### 4.1 검색 기능
- **전체 텍스트 검색** (제목, 내용, 댓글)
- **자동완성 (Autocomplete)**
- **검색어 하이라이팅**
- **검색어 제안 (Did you mean...?)**
- **패싯 검색** (카테고리, 태그, 날짜 필터링)
- **검색 결과 랭킹** (관련도 순)

### 🏗️ 기술 설계

#### Elasticsearch 인덱스 매핑
```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "title": {
        "type": "text",
        "analyzer": "korean",
        "fields": {
          "keyword": { "type": "keyword" },
          "suggest": {
            "type": "completion",
            "analyzer": "simple"
          }
        }
      },
      "content": {
        "type": "text",
        "analyzer": "korean"
      },
      "author": {
        "type": "keyword"
      },
      "category": {
        "type": "keyword"
      },
      "tags": {
        "type": "keyword"
      },
      "created_at": {
        "type": "date"
      },
      "views": {
        "type": "integer"
      },
      "likes": {
        "type": "integer"
      }
    }
  }
}
```

#### Backend (Elasticsearch Client)
```javascript
// server-backend/services/searchService.js
const { Client } = require('@elastic/elasticsearch');

class SearchService {
  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    });
  }

  async indexPost(post) {
    await this.client.index({
      index: 'posts',
      id: post.id.toString(),
      document: {
        id: post.id,
        title: post.title,
        content: post.content,
        author: post.author_name,
        category: post.category,
        tags: post.tags,
        created_at: post.created_at,
        views: post.views,
        likes: post.likes
      }
    });
  }

  async search(query, filters = {}) {
    const must = [
      {
        multi_match: {
          query,
          fields: ['title^3', 'content', 'tags^2'],
          fuzziness: 'AUTO'
        }
      }
    ];

    const filter = [];
    if (filters.category) {
      filter.push({ term: { category: filters.category } });
    }
    if (filters.tags && filters.tags.length > 0) {
      filter.push({ terms: { tags: filters.tags } });
    }
    if (filters.dateFrom || filters.dateTo) {
      filter.push({
        range: {
          created_at: {
            gte: filters.dateFrom,
            lte: filters.dateTo
          }
        }
      });
    }

    const response = await this.client.search({
      index: 'posts',
      body: {
        query: {
          bool: { must, filter }
        },
        highlight: {
          fields: {
            title: {},
            content: {}
          }
        },
        sort: [
          { _score: 'desc' },
          { created_at: 'desc' }
        ],
        from: filters.from || 0,
        size: filters.size || 20
      }
    });

    return {
      hits: response.hits.hits.map(hit => ({
        ...hit._source,
        score: hit._score,
        highlights: hit.highlight
      })),
      total: response.hits.total.value
    };
  }

  async suggest(query) {
    const response = await this.client.search({
      index: 'posts',
      body: {
        suggest: {
          title_suggest: {
            prefix: query,
            completion: {
              field: 'title.suggest',
              size: 5,
              skip_duplicates: true
            }
          }
        }
      }
    });

    return response.suggest.title_suggest[0].options.map(option => option.text);
  }
}
```

#### Frontend
```typescript
// frontend/src/components/AdvancedSearch.tsx
export function AdvancedSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [filters, setFilters] = useState({});

  const search = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery) return;

    const response = await api.get('/search', {
      params: { q: searchQuery, ...filters }
    });

    setResults(response.data.hits);
  }, 300);

  const getSuggestions = useDebouncedCallback(async (text: string) => {
    const response = await api.get('/search/suggest', {
      params: { q: text }
    });

    setSuggestions(response.data.suggestions);
  }, 200);

  return (
    <Box>
      <InputGroup>
        <Input
          placeholder="검색어를 입력하세요..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
            getSuggestions(e.target.value);
          }}
        />
        <InputRightElement>
          <SearchIcon />
        </InputRightElement>
      </InputGroup>

      {suggestions.length > 0 && (
        <List>
          {suggestions.map((suggestion, index) => (
            <ListItem key={index} onClick={() => setQuery(suggestion)}>
              {suggestion}
            </ListItem>
          ))}
        </List>
      )}

      <SearchResults results={results} />
    </Box>
  );
}
```

### 📋 API 엔드포인트

| Method | Endpoint              | 설명                  |
| ------ | --------------------- | --------------------- |
| GET    | `/api/search`         | 전체 검색             |
| GET    | `/api/search/suggest` | 자동완성 제안         |
| GET    | `/api/search/filters` | 사용 가능한 필터 목록 |

### ⏱️ 개발 일정: **2주**

---

## 5. 다크 모드

### 📌 기능 개요

사용자 선호에 따라 **라이트/다크 테마**를 전환하는 기능입니다.

### 🏗️ 기술 설계

#### Chakra UI Theme
```typescript
// frontend/src/theme/index.ts
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'system', // 'light' | 'dark' | 'system'
  useSystemColorMode: true,
};

const theme = extendTheme({
  config,
  colors: {
    brand: {
      light: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        500: '#0ea5e9',
        900: '#0c4a6e',
      },
      dark: {
        50: '#1e293b',
        100: '#334155',
        500: '#64748b',
        900: '#f1f5f9',
      }
    }
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      }
    })
  }
});

export default theme;
```

#### 테마 전환 버튼
```typescript
// ThemeToggle.tsx
import { useColorMode, IconButton } from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';

export function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
      onClick={toggleColorMode}
      aria-label="Toggle theme"
    />
  );
}
```

### ⏱️ 개발 일정: **1주**

---

## 6. 다국어 지원 (i18n)

### 📌 기능 개요

한국어, 영어 등 **다국어 인터페이스**를 제공합니다.

### 🏗️ 기술 설계

#### react-i18next
```typescript
// frontend/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ko: {
    translation: {
      welcome: '환영합니다',
      login: '로그인',
      register: '회원가입',
      post: {
        title: '제목',
        content: '내용',
        create: '게시물 작성'
      }
    }
  },
  en: {
    translation: {
      welcome: 'Welcome',
      login: 'Login',
      register: 'Sign Up',
      post: {
        title: 'Title',
        content: 'Content',
        create: 'Create Post'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ko',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

#### 사용 예시
```typescript
import { useTranslation } from 'react-i18next';

function PostForm() {
  const { t } = useTranslation();

  return (
    <Box>
      <Heading>{t('post.create')}</Heading>
      <Input placeholder={t('post.title')} />
      <Textarea placeholder={t('post.content')} />
    </Box>
  );
}
```

### ⏱️ 개발 일정: **1주**

---

## 개발 일정

### 전체 타임라인 (8-12주)

| 주차 | 작업                  | 담당               | 상태 |
| ---- | --------------------- | ------------------ | ---- |
| 1-2  | 실시간 알림 시스템    | Backend + Frontend | 계획 |
| 3-5  | 채팅 시스템           | Backend + Frontend | 계획 |
| 6-7  | 파일 업로드 시스템    | Backend + Frontend | 계획 |
| 8-9  | Elasticsearch 통합    | Backend + DevOps   | 계획 |
| 10   | 다크 모드             | Frontend           | 계획 |
| 11   | 다국어 지원           | Frontend           | 계획 |
| 12   | 통합 테스트 및 최적화 | 전체               | 계획 |

---

## 기술 스택

### 새로 추가되는 기술

| 기술                      | 용도              | 버전  |
| ------------------------- | ----------------- | ----- |
| **Socket.io / WebSocket** | 실시간 통신       | 4.x   |
| **Redis**                 | Pub/Sub, 캐싱     | 7.x   |
| **Elasticsearch**         | 전체 텍스트 검색  | 8.x   |
| **Sharp**                 | 이미지 처리       | 0.32+ |
| **Multer**                | 파일 업로드       | 1.4+  |
| **react-i18next**         | 다국어 지원       | 13.x  |
| **react-dropzone**        | 파일 드래그앤드롭 | 14.x  |

---

## 성능 목표

| 항목             | 목표    | 현재 | 개선     |
| ---------------- | ------- | ---- | -------- |
| 알림 지연 시간   | < 100ms | -    | -        |
| 메시지 전송 지연 | < 200ms | -    | -        |
| 파일 업로드 속도 | > 5MB/s | -    | -        |
| 검색 응답 시간   | < 300ms | > 1s | 70% 개선 |
| 페이지 로드 시간 | < 2s    | < 3s | 33% 개선 |

---

## 다음 단계

1. ✅ Phase 3 계획서 작성 완료
2. ⏳ 기술 스택 검토 및 승인
3. ⏳ 개발 환경 설정 (Redis, Elasticsearch)
4. ⏳ 실시간 알림 시스템부터 개발 시작

---

**작성자**: Community Platform 개발팀  
**검토자**: -  
**승인자**: -  
**버전**: 1.0  
**최종 수정일**: 2025년 11월 12일
