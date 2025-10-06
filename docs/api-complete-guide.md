# Community Platform v1.3 API 완전 가이드

## 📋 개요
Community Platform v1.3의 모든 API 엔드포인트에 대한 완전한 가이드입니다. 개발팀이 바로 사용할 수 있도록 상세한 예제와 함께 제공합니다.

## 🔐 인증 시스템

### JWT 토큰 기반 인증
```typescript
// 인증 헤더
Authorization: Bearer <JWT_TOKEN>

// 토큰 갱신
POST /api/auth/refresh
{
  "refreshToken": "string"
}

// 응답
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiresIn": 3600
  }
}
```

### OAuth 2.0 소셜 로그인
```typescript
// Google 로그인
GET /api/auth/google
// 리다이렉트: https://accounts.google.com/oauth/authorize?...

// Google 콜백
GET /api/auth/google/callback?code=...
{
  "success": true,
  "data": {
    "user": User,
    "tokens": {
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
}
```

## 📰 뉴스 시스템 API

### 뉴스 CRUD
```typescript
// 뉴스 목록 조회
GET /api/news
Query Parameters:
- page: number (기본값: 1)
- limit: number (기본값: 20)
- category: string
- tag: string
- search: string
- sortBy: 'newest' | 'popular' | 'trending'

Response:
{
  "success": true,
  "data": {
    "news": NewsItem[],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}

// 뉴스 상세 조회
GET /api/news/:id
Response:
{
  "success": true,
  "data": {
    "news": NewsDetail,
    "relatedNews": NewsItem[],
    "comments": Comment[]
  }
}

// 뉴스 생성
POST /api/news
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "title": "뉴스 제목",
  "content": "뉴스 내용",
  "excerpt": "요약",
  "category": "tech",
  "tags": ["AI", "기술"],
  "featuredImage": "https://example.com/image.jpg",
  "publishedAt": "2024-10-01T00:00:00Z"
}

// 뉴스 수정
PUT /api/news/:id
Headers: { "Authorization": "Bearer <token>" }
Body: Partial<NewsCreateRequest>

// 뉴스 삭제
DELETE /api/news/:id
Headers: { "Authorization": "Bearer <token>" }
```

### 뉴스 카테고리 관리
```typescript
// 카테고리 목록
GET /api/news/categories
Response:
{
  "success": true,
  "data": [
    {
      "id": "tech",
      "name": "기술",
      "slug": "tech",
      "description": "기술 관련 뉴스",
      "color": "#2196F3",
      "icon": "computer",
      "newsCount": 150
    }
  ]
}

// 카테고리 생성
POST /api/news/categories
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "name": "기술",
  "slug": "tech",
  "description": "기술 관련 뉴스",
  "color": "#2196F3",
  "icon": "computer"
}
```

## 💬 커뮤니티 시스템 API

### 게시판 관리
```typescript
// 게시판 목록
GET /api/community/boards
Response:
{
  "success": true,
  "data": [
    {
      "id": "general",
      "name": "자유게시판",
      "description": "자유롭게 글을 작성할 수 있는 게시판",
      "category": "general",
      "isPublic": true,
      "memberCount": 1250,
      "postCount": 5430,
      "lastPost": {
        "id": "post123",
        "title": "최신 게시글",
        "author": "user123",
        "createdAt": "2024-10-01T12:00:00Z"
      }
    }
  ]
}

// 게시판 생성
POST /api/community/boards
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "name": "새 게시판",
  "description": "게시판 설명",
  "category": "general",
  "isPublic": true,
  "rules": ["규칙1", "규칙2"]
}
```

### 게시글 관리
```typescript
// 게시글 목록
GET /api/community/boards/:boardId/posts
Query Parameters:
- page: number
- limit: number
- sortBy: 'newest' | 'popular' | 'trending'
- search: string
- tags: string[]

Response:
{
  "success": true,
  "data": {
    "posts": PostItem[],
    "pagination": PaginationInfo
  }
}

// 게시글 상세
GET /api/community/posts/:id
Response:
{
  "success": true,
  "data": {
    "post": PostDetail,
    "comments": Comment[],
    "relatedPosts": PostItem[]
  }
}

// 게시글 작성
POST /api/community/boards/:boardId/posts
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "title": "게시글 제목",
  "content": "게시글 내용",
  "tags": ["태그1", "태그2"],
  "images": ["https://example.com/image1.jpg"],
  "isAnonymous": false
}
```

### 댓글 시스템
```typescript
// 댓글 목록
GET /api/community/posts/:postId/comments
Query Parameters:
- page: number
- limit: number
- sortBy: 'newest' | 'oldest' | 'popular'

Response:
{
  "success": true,
  "data": {
    "comments": Comment[],
    "pagination": PaginationInfo
  }
}

// 댓글 작성
POST /api/community/posts/:postId/comments
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "content": "댓글 내용",
  "parentId": "comment123", // 대댓글인 경우
  "isAnonymous": false
}

// 댓글 수정
PUT /api/community/comments/:id
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "content": "수정된 댓글 내용"
}

// 댓글 삭제
DELETE /api/community/comments/:id
Headers: { "Authorization": "Bearer <token>" }
```

## 🎥 방송 시스템 API

### 스트리밍 관리
```typescript
// 스트림 시작
POST /api/streaming/start
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "title": "방송 제목",
  "description": "방송 설명",
  "category": "gaming",
  "isPublic": true,
  "thumbnail": "https://example.com/thumb.jpg",
  "tags": ["게임", "실시간"]
}

Response:
{
  "success": true,
  "data": {
    "streamId": "stream123",
    "rtmpUrl": "rtmp://stream.example.com/live",
    "streamKey": "abc123def456",
    "hlsUrl": "https://stream.example.com/hls/stream123.m3u8",
    "chatRoomId": "chat123"
  }
}

// 스트림 종료
POST /api/streaming/:streamId/stop
Headers: { "Authorization": "Bearer <token>" }

Response:
{
  "success": true,
  "data": {
    "duration": 3600,
    "viewCount": 1250,
    "recordingUrl": "https://recordings.example.com/stream123.mp4"
  }
}

// 라이브 스트림 목록
GET /api/streaming/live
Query Parameters:
- category: string
- page: number
- limit: number
- sortBy: 'newest' | 'popular' | 'viewers'

Response:
{
  "success": true,
  "data": {
    "streams": StreamInfo[],
    "pagination": PaginationInfo
  }
}
```

### 채팅 시스템
```typescript
// 채팅방 참여
POST /api/streaming/:streamId/chat/join
Headers: { "Authorization": "Bearer <token>" }

// 채팅 메시지 전송
POST /api/streaming/:streamId/chat/message
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "message": "안녕하세요!",
  "type": "text" | "emoji" | "donation"
}

// 채팅 메시지 조회
GET /api/streaming/:streamId/chat/messages
Query Parameters:
- page: number
- limit: number
- since: timestamp

Response:
{
  "success": true,
  "data": {
    "messages": ChatMessage[],
    "pagination": PaginationInfo
  }
}
```

### 도네이션 시스템
```typescript
// 도네이션 전송
POST /api/streaming/:streamId/donations
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "amount": 1000,
  "message": "응원합니다!",
  "isAnonymous": false
}

Response:
{
  "success": true,
  "data": {
    "donationId": "donation123",
    "amount": 1000,
    "message": "응원합니다!",
    "donor": User,
    "timestamp": "2024-10-01T12:00:00Z"
  }
}

// 도네이션 목록
GET /api/streaming/:streamId/donations
Query Parameters:
- page: number
- limit: number
- sortBy: 'newest' | 'amount'

Response:
{
  "success": true,
  "data": {
    "donations": Donation[],
    "totalAmount": 50000,
    "donationCount": 25
  }
}
```

## 👗 코스프레 시스템 API

### 갤러리 관리
```typescript
// 갤러리 업로드
POST /api/cosplay/gallery
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "title": "코스프레 제목",
  "description": "코스프레 설명",
  "character": "아스카",
  "series": "에반게리온",
  "images": ["https://example.com/image1.jpg"],
  "tags": ["코스프레", "에반게리온", "아스카"],
  "isPublic": true
}

Response:
{
  "success": true,
  "data": {
    "galleryId": "gallery123",
    "images": ["https://example.com/image1.jpg"],
    "thumbnail": "https://example.com/thumb.jpg"
  }
}

// 갤러리 목록
GET /api/cosplay/gallery
Query Parameters:
- page: number
- limit: number
- character: string
- series: string
- tags: string[]
- sortBy: 'newest' | 'popular' | 'rating'

Response:
{
  "success": true,
  "data": {
    "galleries": GalleryItem[],
    "pagination": PaginationInfo
  }
}

// 갤러리 상세
GET /api/cosplay/gallery/:id
Response:
{
  "success": true,
  "data": {
    "gallery": GalleryDetail,
    "comments": Comment[],
    "relatedGalleries": GalleryItem[]
  }
}
```

### 이벤트 관리
```typescript
// 이벤트 목록
GET /api/cosplay/events
Query Parameters:
- status: 'upcoming' | 'active' | 'ended'
- category: string
- page: number
- limit: number

Response:
{
  "success": true,
  "data": {
    "events": CosplayEvent[],
    "pagination": PaginationInfo
  }
}

// 이벤트 참가
POST /api/cosplay/events/:eventId/join
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "galleryId": "gallery123",
  "message": "참가 신청합니다!"
}

Response:
{
  "success": true,
  "data": {
    "participationId": "participation123",
    "status": "pending",
    "submittedAt": "2024-10-01T12:00:00Z"
  }
}

// 이벤트 결과 조회
GET /api/cosplay/events/:eventId/results
Response:
{
  "success": true,
  "data": {
    "event": CosplayEvent,
    "participants": EventParticipation[],
    "winners": EventParticipation[]
  }
}
```

## 🤖 AI/ML 시스템 API

### AI 콘텐츠 최적화
```typescript
// 콘텐츠 분석
POST /api/ai/content/analyze
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "content": "분석할 콘텐츠",
  "type": "text" | "image" | "video",
  "language": "ko"
}

Response:
{
  "success": true,
  "data": {
    "readability": 85,
    "engagement": 92,
    "seo": 78,
    "sentiment": 0.8,
    "quality": 88,
    "suggestions": [
      "제목을 더 매력적으로 만들어보세요",
      "이미지를 추가하면 좋겠습니다"
    ]
  }
}

// 콘텐츠 최적화
POST /api/ai/content/optimize
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "content": "최적화할 콘텐츠",
  "type": "text",
  "targetAudience": "20-30대",
  "goals": ["engagement", "seo"]
}

Response:
{
  "success": true,
  "data": {
    "optimizedContent": "최적화된 콘텐츠",
    "improvements": [
      "제목 개선",
      "키워드 추가"
    ],
    "score": 95
  }
}
```

### ML 개인화 엔진
```typescript
// 추천 생성
POST /api/ml/recommendations
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "type": "content" | "user" | "event",
  "limit": 10
}

Response:
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "content123",
        "type": "post",
        "title": "추천 게시글",
        "score": 0.95,
        "reason": "관심사 기반"
      }
    ],
    "confidence": 0.92,
    "reasoning": ["관심사 일치", "인기도 높음"]
  }
}

// 사용자 프로필 업데이트
POST /api/ml/profile/update
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "interactions": [
    {
      "type": "view",
      "contentId": "content123",
      "timestamp": "2024-10-01T12:00:00Z"
    }
  ]
}
```

### 음성 AI 시스템
```typescript
// 음성 인식
POST /api/voice/recognize
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "audio": "base64_encoded_audio",
  "language": "ko",
  "format": "wav"
}

Response:
{
  "success": true,
  "data": {
    "text": "인식된 텍스트",
    "confidence": 0.95,
    "language": "ko"
  }
}

// 음성 합성
POST /api/voice/synthesize
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "text": "합성할 텍스트",
  "voice": "female_ko",
  "language": "ko"
}

Response:
{
  "success": true,
  "data": {
    "audio": "base64_encoded_audio",
    "duration": 5.2
  }
}
```

## 🎨 3D/AR/VR 시스템 API

### 3D 시각화
```typescript
// 3D 모델 업로드
POST /api/3d/models
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "name": "3D 모델명",
  "description": "모델 설명",
  "modelFile": "base64_encoded_model",
  "format": "glb",
  "thumbnail": "base64_encoded_image"
}

Response:
{
  "success": true,
  "data": {
    "modelId": "model123",
    "url": "https://models.example.com/model123.glb",
    "boundingBox": {
      "min": [0, 0, 0],
      "max": [10, 10, 10]
    },
    "materials": [
      {
        "name": "material1",
        "type": "PBR",
        "properties": {}
      }
    ]
  }
}

// 3D 씬 생성
POST /api/3d/scenes
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "name": "씬 이름",
  "description": "씬 설명",
  "models": [
    {
      "modelId": "model123",
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1]
    }
  ],
  "lighting": {
    "type": "directional",
    "color": "#ffffff",
    "intensity": 1.0
  },
  "camera": {
    "position": [0, 5, 10],
    "target": [0, 0, 0]
  }
}
```

### AR/VR 시스템
```typescript
// AR 마커 생성
POST /api/ar/markers
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "name": "AR 마커",
  "pattern": "base64_encoded_pattern",
  "content": {
    "type": "3d_model",
    "modelId": "model123",
    "scale": 1.0
  }
}

Response:
{
  "success": true,
  "data": {
    "markerId": "marker123",
    "patternUrl": "https://markers.example.com/pattern123.png",
    "qrCode": "https://qr.example.com/marker123.png"
  }
}

// VR 공간 생성
POST /api/vr/spaces
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "name": "VR 공간",
  "description": "공간 설명",
  "environment": {
    "skybox": "https://skybox.example.com/sky.jpg",
    "lighting": "daylight"
  },
  "objects": [
    {
      "type": "3d_model",
      "modelId": "model123",
      "position": [0, 0, 0]
    }
  ]
}
```

## ⛓️ 블록체인 시스템 API

### 블록체인 인증
```typescript
// 컨텐츠 인증
POST /api/blockchain/authenticate
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "contentId": "content123",
  "contentHash": "sha256_hash",
  "author": "user123",
  "metadata": {
    "title": "컨텐츠 제목",
    "type": "post",
    "createdAt": "2024-10-01T12:00:00Z"
  }
}

Response:
{
  "success": true,
  "data": {
    "transactionHash": "0x123...",
    "blockNumber": 12345678,
    "gasUsed": 21000,
    "certificate": "base64_certificate"
  }
}

// 인증 조회
GET /api/blockchain/verify/:contentId
Response:
{
  "success": true,
  "data": {
    "isAuthentic": true,
    "author": "user123",
    "timestamp": "2024-10-01T12:00:00Z",
    "blockNumber": 12345678,
    "transactionHash": "0x123..."
  }
}
```

### NFT 시스템
```typescript
// NFT 생성
POST /api/nft/mint
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "name": "NFT 이름",
  "description": "NFT 설명",
  "image": "https://example.com/image.jpg",
  "attributes": [
    {
      "trait_type": "Color",
      "value": "Blue"
    }
  ],
  "royalty": 2.5
}

Response:
{
  "success": true,
  "data": {
    "tokenId": "123",
    "contractAddress": "0x456...",
    "transactionHash": "0x789...",
    "openseaUrl": "https://opensea.io/assets/0x456.../123"
  }
}

// NFT 전송
POST /api/nft/transfer
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "tokenId": "123",
  "from": "0xabc...",
  "to": "0xdef..."
}

Response:
{
  "success": true,
  "data": {
    "transactionHash": "0x456...",
    "gasUsed": 50000
  }
}
```

## 🔐 보안 시스템 API

### 보안 모니터링
```typescript
// 보안 이벤트 조회
GET /api/security/events
Query Parameters:
- startDate: timestamp
- endDate: timestamp
- severity: 'low' | 'medium' | 'high' | 'critical'
- type: string

Response:
{
  "success": true,
  "data": [
    {
      "id": "event123",
      "type": "suspicious_login",
      "severity": "medium",
      "description": "의심스러운 로그인 시도",
      "ipAddress": "192.168.1.100",
      "timestamp": "2024-10-01T12:00:00Z",
      "status": "investigating"
    }
  ]
}

// 위협 차단
POST /api/security/block
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "ipAddress": "192.168.1.100",
  "reason": "의심스러운 활동",
  "duration": 3600
}

Response:
{
  "success": true,
  "data": {
    "blockId": "block123",
    "expiresAt": "2024-10-01T13:00:00Z"
  }
}
```

### 양자 암호화
```typescript
// 양자 키 생성
POST /api/quantum/key/generate
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "keyLength": 256,
  "algorithm": "QKD"
}

Response:
{
  "success": true,
  "data": {
    "keyId": "key123",
    "publicKey": "base64_public_key",
    "keyStrength": 256
  }
}

// 양자 암호화
POST /api/quantum/encrypt
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "data": "암호화할 데이터",
  "keyId": "key123",
  "algorithm": "AES-256-GCM"
}

Response:
{
  "success": true,
  "data": {
    "encryptedData": "base64_encrypted_data",
    "iv": "base64_iv",
    "tag": "base64_tag"
  }
}
```

## 📊 성능 모니터링 API

### 성능 메트릭
```typescript
// 성능 메트릭 조회
GET /api/performance/metrics
Query Parameters:
- startTime: timestamp
- endTime: timestamp
- interval: '1m' | '5m' | '15m' | '1h'
- metric: string

Response:
{
  "success": true,
  "data": {
    "timestamps": ["2024-10-01T12:00:00Z"],
    "values": [85.5],
    "average": 85.5,
    "min": 80.0,
    "max": 90.0
  }
}

// 알림 설정
POST /api/performance/alerts
Headers: { "Authorization": "Bearer <token>" }
Body:
{
  "metric": "cpu_usage",
  "threshold": 80,
  "condition": "gt",
  "duration": 300,
  "channels": ["email", "slack"]
}

Response:
{
  "success": true,
  "data": {
    "alertId": "alert123",
    "status": "active"
  }
}
```

## 🌐 WebSocket 이벤트

### 실시간 이벤트
```typescript
// 연결
const socket = io('wss://api.communityplatform.com', {
  auth: {
    token: 'jwt_token'
  }
});

// 채팅 이벤트
socket.on('chat:message', (data) => {
  console.log('새 메시지:', data);
});

socket.emit('chat:message', {
  roomId: 'room123',
  message: '안녕하세요!',
  type: 'text'
});

// 알림 이벤트
socket.on('notification', (data) => {
  console.log('새 알림:', data);
});

// 실시간 업데이트
socket.on('realtime:update', (data) => {
  console.log('실시간 업데이트:', data);
});
```

## 🚀 에러 처리

### 에러 응답 형식
```typescript
// 에러 응답
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 데이터가 유효하지 않습니다",
    "details": [
      {
        "field": "title",
        "message": "제목은 필수입니다"
      }
    ],
    "timestamp": "2024-10-01T12:00:00Z",
    "requestId": "req123"
  }
}

// HTTP 상태 코드
200: 성공
201: 생성됨
400: 잘못된 요청
401: 인증 필요
403: 권한 없음
404: 찾을 수 없음
429: 요청 한도 초과
500: 서버 오류
```

### 에러 코드 목록
```typescript
enum ErrorCode {
  // 인증 관련
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  
  // 권한 관련
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // 유효성 검사
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // 리소스 관련
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // 서버 관련
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}
```

---

**Community Platform v1.3 API 완전 가이드** - 2024년 10월 최신 버전
