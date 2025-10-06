# API 문서

## 📋 개요
Community Platform v1.3의 API 문서입니다. 실시간 채팅, 파일 공유, 보안, 성능 모니터링 등의 API를 포함합니다.

## 🔗 기본 정보

### Base URL
```
Production: https://api.community.com/v1.3
Staging: https://staging-api.community.com/v1.3
Development: http://localhost:3000/api/v1.3
```

### 인증
모든 API 요청은 JWT 토큰을 포함해야 합니다.

```http
Authorization: Bearer <jwt_token>
```

### 응답 형식
모든 API 응답은 JSON 형식입니다.

```json
{
  "success": true,
  "data": {},
  "message": "Success",
  "timestamp": "2024-10-05T10:30:00Z"
}
```

## 🚀 실시간 채팅 API

### WebSocket 연결

#### 연결 URL
```
wss://api.community.com/v1.3/chat
```

#### 연결 파라미터
```typescript
interface WebSocketConfig {
  perMessageDeflate: boolean;
  handshakeTimeout: number;
  maxPayload: number;
}
```

#### 연결 예시
```javascript
const socket = io('wss://api.community.com/v1.3/chat', {
  auth: {
    token: 'jwt_token'
  },
  transports: ['websocket']
});
```

### 채팅방 입장

#### 이벤트: `join_room`
```typescript
interface JoinRoomData {
  roomId: string;
  token: string;
  timestamp: number;
}
```

#### 요청 예시
```javascript
socket.emit('join_room', {
  roomId: 'room_123',
  token: 'jwt_token',
  timestamp: Date.now()
});
```

#### 응답 예시
```json
{
  "success": true,
  "data": {
    roomId: "room_123",
    userId: "user_456",
    joinedAt: "2024-10-05T10:30:00Z"
  }
}
```

### 메시지 전송

#### 이벤트: `send_message`
```typescript
interface SendMessageData {
  roomId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'encrypted';
  fileMetadata?: FileMetadata;
  replyTo?: string;
  mentions?: string[];
}
```

#### 요청 예시
```javascript
socket.emit('send_message', {
  roomId: 'room_123',
  content: 'Hello World!',
  type: 'text',
  mentions: ['user_789']
});
```

#### 응답 예시
```json
{
  "success": true,
  "data": {
    messageId: "msg_789",
    roomId: "room_123",
    userId: "user_456",
    content: "Hello World!",
    type: "text",
    timestamp: "2024-10-05T10:30:00Z",
    status: "sent"
  }
}
```

### 메시지 수신

#### 이벤트: `message_received`
```typescript
interface MessageData {
  messageId: string;
  roomId: string;
  userId: string;
  userName: string;
  content: string;
  type: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isEncrypted?: boolean;
  fileMetadata?: FileMetadata;
  replyTo?: string;
  mentions?: string[];
  reactions?: { [emoji: string]: string[] };
}
```

#### 수신 예시
```javascript
socket.on('message_received', (message) => {
  console.log('New message:', message);
});
```

### 타이핑 상태

#### 이벤트: `typing_start`
```javascript
socket.emit('typing_start', {
  roomId: 'room_123'
});
```

#### 이벤트: `typing_stop`
```javascript
socket.emit('typing_stop', {
  roomId: 'room_123'
});
```

#### 이벤트: `user_typing`
```javascript
socket.on('user_typing', (data) => {
  console.log('User typing:', data.userName);
});
```

## 📁 파일 공유 API

### 파일 업로드

#### POST `/api/v1.3/files/upload`
```typescript
interface UploadFileRequest {
  file: File;
  roomId: string;
  metadata?: {
    description?: string;
    tags?: string[];
  };
}
```

#### 요청 예시
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('roomId', 'room_123');
formData.append('metadata', JSON.stringify({
  description: 'Important document',
  tags: ['document', 'important']
}));

const response = await fetch('/api/v1.3/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer jwt_token'
  },
  body: formData
});
```

#### 응답 예시
```json
{
  "success": true,
  "data": {
    fileId: "file_789",
    fileName: "document.pdf",
    fileSize: 1024000,
    mimeType: "application/pdf",
    uploadUrl: "https://storage.community.com/files/file_789",
    encrypted: true,
    uploadedAt: "2024-10-05T10:30:00Z"
  }
}
```

### 파일 다운로드

#### GET `/api/v1.3/files/{fileId}/download`
```typescript
interface DownloadFileResponse {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  expiresAt: string;
}
```

#### 요청 예시
```javascript
const response = await fetch('/api/v1.3/files/file_789/download', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer jwt_token'
  }
});

const data = await response.json();
window.open(data.downloadUrl);
```

### 파일 미리보기

#### GET `/api/v1.3/files/{fileId}/preview`
```typescript
interface PreviewFileResponse {
  previewUrl: string;
  thumbnailUrl?: string;
  fileType: 'image' | 'document' | 'video' | 'audio' | 'other';
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
  };
}
```

## 🔒 보안 API

### 보안 이벤트 조회

#### GET `/api/v1.3/security/events`
```typescript
interface SecurityEventsRequest {
  page?: number;
  limit?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  type?: string;
  startDate?: string;
  endDate?: string;
}
```

#### 요청 예시
```javascript
const response = await fetch('/api/v1.3/security/events?page=1&limit=20&severity=high', {
  headers: {
    'Authorization': 'Bearer jwt_token'
  }
});
```

#### 응답 예시
```json
{
  "success": true,
  "data": {
    events: [
      {
        id: "event_123",
        type: "suspicious_login",
        severity: "high",
        description: "Multiple failed login attempts",
        timestamp: "2024-10-05T10:30:00Z",
        source: {
          ip: "192.168.1.100",
          userAgent: "Mozilla/5.0...",
          location: "Seoul, Korea"
        },
        resolved: false
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 150,
      totalPages: 8
    }
  }
}
```

### 보안 설정

#### GET `/api/v1.3/security/settings`
```typescript
interface SecuritySettings {
  encryption: {
    enabled: boolean;
    algorithm: string;
    keyRotationInterval: number;
  };
  monitoring: {
    enabled: boolean;
    alertThresholds: {
      failedLogins: number;
      suspiciousActivity: number;
    };
  };
  accessControl: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    enable2FA: boolean;
  };
}
```

#### PUT `/api/v1.3/security/settings`
```javascript
const response = await fetch('/api/v1.3/security/settings', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    encryption: {
      enabled: true,
      algorithm: 'AES-256-GCM',
      keyRotationInterval: 86400000
    },
    monitoring: {
      enabled: true,
      alertThresholds: {
        failedLogins: 5,
        suspiciousActivity: 3
      }
    }
  })
});
```

## 📊 성능 모니터링 API

### 성능 메트릭 조회

#### GET `/api/v1.3/performance/metrics`
```typescript
interface PerformanceMetricsRequest {
  timeRange?: '1h' | '24h' | '7d' | '30d';
  metrics?: string[];
  granularity?: '1m' | '5m' | '15m' | '1h';
}
```

#### 요청 예시
```javascript
const response = await fetch('/api/v1.3/performance/metrics?timeRange=24h&metrics=cpu,memory,responseTime', {
  headers: {
    'Authorization': 'Bearer jwt_token'
  }
});
```

#### 응답 예시
```json
{
  "success": true,
  "data": {
    metrics: {
      cpu: {
        current: 15.5,
        average: 12.3,
        max: 25.8,
        trend: "stable"
      },
      memory: {
        current: 245.6,
        average: 230.1,
        max: 280.3,
        trend: "increasing"
      },
      responseTime: {
        current: 245,
        average: 230,
        max: 450,
        trend: "stable"
      }
    },
    timestamp: "2024-10-05T10:30:00Z"
  }
}
```

### 성능 이슈 조회

#### GET `/api/v1.3/performance/issues`
```typescript
interface PerformanceIssuesRequest {
  status?: 'identified' | 'analyzing' | 'optimizing' | 'completed' | 'failed';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  type?: 'bundle_size' | 'loading_time' | 'memory_usage' | 'api_latency';
}
```

#### 응답 예시
```json
{
  "success": true,
  "data": {
    issues: [
      {
        id: "issue_123",
        type: "bundle_size",
        severity: "high",
        title: "JavaScript 번들 크기 과다",
        description: "메인 JavaScript 번들이 2.5MB로 권장 크기를 초과합니다.",
        currentValue: 2.5,
        targetValue: 1.0,
        unit: "MB",
        status: "identified",
        autoFixable: true,
        detectedAt: "2024-10-05T10:30:00Z"
      }
    ]
  }
}
```

## 🧪 베타 테스트 API

### 테스터 관리

#### GET `/api/v1.3/beta/testers`
```typescript
interface TestersResponse {
  testers: BetaTester[];
  total: number;
  active: number;
  completed: number;
}
```

#### POST `/api/v1.3/beta/testers`
```javascript
const response = await fetch('/api/v1.3/beta/testers', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: '김테스터',
    email: 'tester@example.com',
    role: 'tester',
    deviceType: 'desktop',
    browserInfo: 'Chrome 120.0',
    location: 'Seoul, Korea'
  })
});
```

### 테스트 시나리오

#### GET `/api/v1.3/beta/scenarios`
```typescript
interface TestScenariosResponse {
  scenarios: TestScenario[];
  total: number;
  completed: number;
  inProgress: number;
}
```

#### POST `/api/v1.3/beta/scenarios`
```javascript
const response = await fetch('/api/v1.3/beta/scenarios', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: '로그인 플로우 테스트',
    description: '사용자 로그인 및 인증 프로세스 테스트',
    category: 'functionality',
    priority: 'high',
    steps: [
      '로그인 페이지 접속',
      '이메일/비밀번호 입력',
      '로그인 버튼 클릭',
      '대시보드 페이지 이동 확인'
    ],
    expectedResult: '성공적으로 로그인되어 대시보드가 표시됨'
  })
});
```

## 💬 피드백 API

### 피드백 조회

#### GET `/api/v1.3/feedback`
```typescript
interface FeedbackRequest {
  type?: 'bug_report' | 'feature_request' | 'general_feedback' | 'performance_issue';
  status?: 'new' | 'analyzing' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  page?: number;
  limit?: number;
}
```

#### 응답 예시
```json
{
  "success": true,
  "data": {
    feedbacks: [
      {
        id: "feedback_123",
        userId: "user_456",
        userName: "김사용자",
        type: "bug_report",
        title: "채팅 메시지가 깨져서 표시됨",
        description: "특정 상황에서 채팅 메시지가 깨져서 표시되는 문제가 발생합니다.",
        rating: 2,
        priority: "high",
        status: "in_progress",
        votes: 8,
        comments: 3,
        timestamp: "2024-10-05T10:30:00Z",
        tags: ["chat", "ui", "bug"]
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 150,
      totalPages: 8
    }
  }
}
```

### 피드백 생성

#### POST `/api/v1.3/feedback`
```javascript
const response = await fetch('/api/v1.3/feedback', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'bug_report',
    category: 'UI/UX',
    title: '새로운 버그 리포트',
    description: '버그에 대한 상세 설명',
    rating: 3,
    priority: 'medium',
    tags: ['bug', 'ui']
  })
});
```

## 🚀 배포 API

### 배포 상태 조회

#### GET `/api/v1.3/deployment/status`
```typescript
interface DeploymentStatusResponse {
  status: 'pending' | 'running' | 'completed' | 'failed';
  stages: DeploymentStage[];
  currentStage?: string;
  progress: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
}
```

#### 응답 예시
```json
{
  "success": true,
  "data": {
    status: "running",
    stages: [
      {
        id: "1",
        name: "코드 빌드",
        status: "completed",
        progress: 100,
        duration: 120
      },
      {
        id: "2",
        name: "테스트 실행",
        status: "running",
        progress: 60,
        duration: 80
      }
    ],
    currentStage: "테스트 실행",
    progress: 40,
    startTime: "2024-10-05T10:00:00Z"
  }
}
```

### 배포 시작

#### POST `/api/v1.3/deployment/start`
```javascript
const response = await fetch('/api/v1.3/deployment/start', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    version: '1.3.0',
    environment: 'production',
    targetServers: ['web-server-1', 'web-server-2']
  })
});
```

## 📊 에러 코드

### HTTP 상태 코드
- `200` - 성공
- `201` - 생성됨
- `400` - 잘못된 요청
- `401` - 인증 실패
- `403` - 권한 없음
- `404` - 리소스 없음
- `429` - 요청 한도 초과
- `500` - 서버 오류

### 에러 응답 형식
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "요청이 잘못되었습니다.",
    "details": "roomId는 필수입니다."
  },
  "timestamp": "2024-10-05T10:30:00Z"
}
```

### 에러 코드 목록
- `INVALID_REQUEST` - 잘못된 요청
- `UNAUTHORIZED` - 인증 실패
- `FORBIDDEN` - 권한 없음
- `NOT_FOUND` - 리소스 없음
- `RATE_LIMITED` - 요청 한도 초과
- `SERVER_ERROR` - 서버 오류
- `ENCRYPTION_ERROR` - 암호화 오류
- `FILE_TOO_LARGE` - 파일 크기 초과
- `INVALID_FILE_TYPE` - 잘못된 파일 타입

## 🔧 SDK 및 라이브러리

### JavaScript SDK
```javascript
import { CommunityAPI } from '@community/sdk';

const api = new CommunityAPI({
  baseURL: 'https://api.community.com/v1.3',
  token: 'jwt_token'
});

// 채팅방 입장
await api.chat.joinRoom('room_123');

// 메시지 전송
await api.chat.sendMessage('room_123', 'Hello World!');

// 파일 업로드
await api.files.upload(file, 'room_123');
```

### React Hook
```javascript
import { useChat } from '@community/react-hooks';

function ChatComponent() {
  const { messages, sendMessage, joinRoom } = useChat('room_123');
  
  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
}
```

## 📞 지원 및 문의

### API 지원
- **이메일**: api-support@community.com
- **슬랙**: #api-support
- **문서**: https://docs.community.com/api

### API 키 발급
- **개발자 포털**: https://developers.community.com
- **API 키 신청**: https://developers.community.com/apply

---

**API 문서 v1.3** - 2024년 10월 최신 버전
