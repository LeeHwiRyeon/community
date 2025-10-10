# 📺 Community Platform v1.3 - 방송 커뮤니티 제작 문서

**작성일**: 2024-10-06  
**버전**: v1.3.0  
**상태**: 📋 기획 완료

---

## 📋 목차

1. [개요](#개요)
2. [기능 요구사항](#기능-요구사항)
3. [페이지 구조](#페이지-구조)
4. [UI/UX 디자인](#uiux-디자인)
5. [데이터 모델](#데이터-모델)
6. [API 설계](#api-설계)
7. [개발 가이드라인](#개발-가이드라인)

---

## 🎯 개요

### 목표
Community Platform v1.3의 방송 커뮤니티 모듈로, 스트리머와 시청자가 실시간으로 소통하고, 콘텐츠를 공유할 수 있는 통합 플랫폼을 제공합니다.

### 핵심 가치
- **실시간성**: 라이브 스트리밍과 실시간 채팅
- **상호작용**: 시청자 참여와 피드백
- **커뮤니티**: 팬클럽과 구독자 관리
- **수익화**: 도네이션과 구독 시스템

---

## 🔧 기능 요구사항

### 1. 방송 관리 기능

#### 라이브 스트리밍
- [ ] 실시간 방송 송출
- [ ] 화질 설정 (720p, 1080p, 4K)
- [ ] 오디오 설정
- [ ] 화면 공유
- [ ] 카메라 전환

#### 방송 일정
- [ ] 방송 일정 등록
- [ ] 일정 공유
- [ ] 알림 설정
- [ ] 일정 수정/삭제

#### VOD 관리
- [ ] 방송 녹화
- [ ] VOD 업로드
- [ ] VOD 편집
- [ ] VOD 공유

### 2. 시청자 기능

#### 실시간 채팅
- [ ] 채팅 참여
- [ ] 이모티콘 사용
- [ ] 도네이션 메시지
- [ ] 채팅 모더레이션

#### 구독 시스템
- [ ] 채널 구독
- [ ] 구독 알림
- [ ] 구독자 혜택
- [ ] 구독 관리

#### 도네이션
- [ ] 실시간 도네이션
- [ ] 도네이션 메시지
- [ ] 도네이션 히스토리
- [ ] 수익 정산

### 3. 커뮤니티 기능

#### 팬클럽
- [ ] 팬클럽 생성
- [ ] 팬클럽 가입
- [ ] 팬클럽 채팅
- [ ] 팬클럽 이벤트

#### 스트리머 프로필
- [ ] 프로필 관리
- [ ] 방송 통계
- [ ] 수익 현황
- [ ] 팬 관리

---

## 📄 페이지 구조

### 1. 방송 메인 페이지 (`/broadcast`)

```
┌─────────────────────────────────────────────────────────┐
│                    📺 방송 섹션                        │
├─────────────────────────────────────────────────────────┤
│ [라이브] [일정] [VOD] [스트리머] [랭킹]                 │
├─────────────────────────────────────────────────────────┤
│ 🔍 [방송 검색]                    [인기순 ▼] [최신순]   │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │   라이브 1  │ │   라이브 2  │ │   라이브 3  │        │
│ │ [썸네일]    │ │ [썸네일]    │ │ [썸네일]    │        │
│ │ 방송 제목   │ │ 방송 제목   │ │ 방송 제목   │        │
│ │ 스트리머    │ │ 스트리머    │ │ 스트리머    │        │
│ │ 시청자 수   │ │ 시청자 수   │ │ 시청자 수   │        │
│ │ [시청하기]  │ │ [시청하기]  │ │ [시청하기]  │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    📅 오늘의 일정                      │
│ • 14:00 - 게임 방송 (스트리머A)                         │
│ • 16:00 - 토크쇼 (스트리머B)                           │
│ • 20:00 - 음악 방송 (스트리머C)                         │
└─────────────────────────────────────────────────────────┘
```

### 2. 라이브 방송 페이지 (`/broadcast/live/:id`)

```
┌─────────────────────────────────────────────────────────┐
│ ← 뒤로가기                    📺 라이브 방송            │
├─────────────────────────────────────────────────────────┤
│                    [방송 화면]                         │
│                                                         │
│                    [스트리머 화면]                      │
│                                                         │
│ [화질: 1080p ▼] [음소거] [전체화면] [공유] [신고]      │
├─────────────────────────────────────────────────────────┤
│ 시청자: 1,234명 | 좋아요: 5,678개 | 구독: 123명        │
├─────────────────────────────────────────────────────────┤
│ 💬 실시간 채팅                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 사용자1: 안녕하세요! 👋                            │ │
│ │ 사용자2: 정말 재미있네요! 😄                       │ │
│ │ 💰 사용자3: 도네이션 5,000원 - 화이팅! 💪         │ │
│ │ 사용자4: 다음에 뭐하실 예정인가요? 🤔              │ │
│ └─────────────────────────────────────────────────────┘ │
│ [채팅 입력창] [이모티콘] [도네이션] [구독]             │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    📊 방송 정보                        │
├─────────────────────────────────────────────────────────┤
│ 제목: "Community Platform v1.3 개발 과정"              │
│ 스트리머: 개발자A | 카테고리: 개발 | 시작: 14:00       │
│ 설명: 오늘은 Community Platform v1.3의 새로운 기능들을 │
│       소개하고 개발 과정을 공유합니다.                  │
└─────────────────────────────────────────────────────────┘
```

### 3. VOD 페이지 (`/broadcast/vod`)

```
┌─────────────────────────────────────────────────────────┐
│                    🎬 VOD 섹션                        │
├─────────────────────────────────────────────────────────┤
│ [전체] [게임] [토크] [음악] [교육] [기타]               │
├─────────────────────────────────────────────────────────┤
│ 🔍 [VOD 검색]                    [인기순 ▼] [최신순]   │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │   VOD 1     │ │   VOD 2     │ │   VOD 3     │        │
│ │ [썸네일]    │ │ [썸네일]    │ │ [썸네일]    │        │
│ │ VOD 제목    │ │ VOD 제목    │ │ VOD 제목    │        │
│ │ 스트리머    │ │ 스트리머    │ │ 스트리머    │        │
│ │ 조회수 | 시간│ │ 조회수 | 시간│ │ 조회수 | 시간│        │
│ │ [재생하기]  │ │ [재생하기]  │ │ [재생하기]  │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### 4. 스트리머 프로필 페이지 (`/broadcast/streamer/:id`)

```
┌─────────────────────────────────────────────────────────┐
│                    👤 스트리머 프로필                   │
├─────────────────────────────────────────────────────────┤
│ [프로필 이미지] 스트리머A | 구독자: 1,234명 | 팔로워: 5,678명 │
├─────────────────────────────────────────────────────────┤
│ [구독] [팔로우] [도네이션] [메시지] [공유]              │
├─────────────────────────────────────────────────────────┤
│ 소개: 게임과 개발에 관심이 많은 스트리머입니다.         │
│       매일 14:00에 방송을 진행합니다.                  │
├─────────────────────────────────────────────────────────┤
│ 📊 방송 통계                                            │
│ • 총 방송 시간: 1,234시간                              │
│ • 평균 시청자: 567명                                   │
│ • 총 조회수: 123,456회                                 │
│ • 구독자 수: 1,234명                                   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    📺 최근 방송                        │
├─────────────────────────────────────────────────────────┤
│ • Community Platform v1.3 개발 과정 (2시간 전)         │
│ • 게임 리뷰: 최신 RPG 게임 (1일 전)                    │
│ • 토크쇼: 개발자와의 대화 (3일 전)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX 디자인

### 1. 색상 팔레트

```css
:root {
  /* Primary Colors */
  --broadcast-primary: #e91e63;
  --broadcast-primary-light: #f06292;
  --broadcast-primary-dark: #c2185b;
  
  /* Secondary Colors */
  --broadcast-secondary: #ff5722;
  --broadcast-secondary-light: #ff8a65;
  --broadcast-secondary-dark: #d84315;
  
  /* Accent Colors */
  --broadcast-accent: #ffc107;
  --broadcast-accent-light: #ffd54f;
  --broadcast-accent-dark: #ff8f00;
  
  /* Status Colors */
  --broadcast-live: #f44336;
  --broadcast-offline: #9e9e9e;
  --broadcast-scheduled: #2196f3;
}
```

### 2. 방송 카드 컴포넌트

```css
.broadcast-card {
  background: var(--broadcast-bg-primary);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.broadcast-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.broadcast-card-thumbnail {
  width: 100%;
  height: 200px;
  position: relative;
  overflow: hidden;
}

.broadcast-card-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.broadcast-card:hover .broadcast-card-thumbnail img {
  transform: scale(1.05);
}

.broadcast-card-live-indicator {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--broadcast-live);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.broadcast-card-live-indicator::before {
  content: '';
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.broadcast-card-content {
  padding: 16px;
}

.broadcast-card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--broadcast-text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.broadcast-card-streamer {
  font-size: 0.875rem;
  color: var(--broadcast-text-secondary);
  margin-bottom: 8px;
}

.broadcast-card-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--broadcast-text-secondary);
}

.broadcast-card-viewers {
  display: flex;
  align-items: center;
  gap: 4px;
}

.broadcast-card-viewers::before {
  content: '👁️';
}
```

### 3. 채팅 컴포넌트

```css
.chat-container {
  height: 400px;
  display: flex;
  flex-direction: column;
  background: var(--broadcast-bg-primary);
  border-radius: 8px;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.chat-message:hover {
  background: var(--broadcast-bg-hover);
}

.chat-message-author {
  font-weight: 600;
  color: var(--broadcast-primary);
  min-width: 80px;
}

.chat-message-content {
  flex: 1;
  color: var(--broadcast-text-primary);
}

.chat-message-donation {
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  color: #000;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.chat-input {
  display: flex;
  padding: 16px;
  gap: 8px;
  border-top: 1px solid var(--broadcast-border);
}

.chat-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--broadcast-border);
  border-radius: 4px;
  font-size: 0.875rem;
}

.chat-input button {
  padding: 8px 16px;
  background: var(--broadcast-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.chat-input button:hover {
  background: var(--broadcast-primary-dark);
}
```

---

## 🗄️ 데이터 모델

### 1. 방송 모델

```typescript
interface Broadcast {
  id: string;
  title: string;
  description: string;
  streamer: Streamer;
  category: BroadcastCategory;
  status: BroadcastStatus;
  thumbnail: string;
  streamUrl: string;
  viewerCount: number;
  likeCount: number;
  startTime: Date;
  endTime?: Date;
  duration: number;
  tags: string[];
  isLive: boolean;
  isScheduled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

enum BroadcastCategory {
  GAMING = 'gaming',
  TALK = 'talk',
  MUSIC = 'music',
  EDUCATION = 'education',
  COOKING = 'cooking',
  FITNESS = 'fitness',
  ART = 'art',
  OTHER = 'other'
}

enum BroadcastStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}
```

### 2. 스트리머 모델

```typescript
interface Streamer {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  banner: string;
  bio: string;
  category: BroadcastCategory[];
  isVerified: boolean;
  isLive: boolean;
  currentBroadcast?: string;
  subscriberCount: number;
  followerCount: number;
  totalViewCount: number;
  totalBroadcastTime: number;
  averageViewerCount: number;
  createdAt: Date;
  lastActiveAt: Date;
}

interface StreamerStats {
  totalBroadcasts: number;
  totalViewTime: number;
  averageViewerCount: number;
  peakViewerCount: number;
  subscriberGrowth: number;
  revenue: number;
  topCategories: BroadcastCategory[];
}
```

### 3. 채팅 모델

```typescript
interface ChatMessage {
  id: string;
  broadcastId: string;
  user: User;
  content: string;
  type: ChatMessageType;
  isModerated: boolean;
  isDeleted: boolean;
  createdAt: Date;
}

enum ChatMessageType {
  NORMAL = 'normal',
  DONATION = 'donation',
  SUBSCRIPTION = 'subscription',
  MODERATOR = 'moderator',
  SYSTEM = 'system'
}
```

---

## 🔌 API 설계

### 1. 방송 API

```typescript
// 방송 목록 조회
GET /api/broadcasts
Query Parameters:
  - page: number
  - limit: number
  - category: BroadcastCategory
  - status: BroadcastStatus
  - search: string
  - sort: 'popular' | 'latest' | 'viewers'

// 라이브 방송 조회
GET /api/broadcasts/live

// 방송 상세 조회
GET /api/broadcasts/:id

// 방송 시작
POST /api/broadcasts
Body: {
  title: string;
  description: string;
  category: BroadcastCategory;
  thumbnail: string;
  tags: string[];
}

// 방송 종료
PUT /api/broadcasts/:id/end

// 방송 일정 등록
POST /api/broadcasts/schedule
Body: {
  title: string;
  description: string;
  category: BroadcastCategory;
  scheduledTime: Date;
  duration: number;
}
```

### 2. 채팅 API

```typescript
// 채팅 메시지 조회
GET /api/broadcasts/:id/chat
Query Parameters:
  - page: number
  - limit: number
  - since: Date

// 채팅 메시지 전송
POST /api/broadcasts/:id/chat
Body: {
  content: string;
  type: ChatMessageType;
}

// 채팅 메시지 삭제
DELETE /api/chat/:messageId
```

### 3. 구독 API

```typescript
// 구독
POST /api/streamers/:id/subscribe

// 구독 취소
DELETE /api/streamers/:id/subscribe

// 구독자 목록
GET /api/streamers/:id/subscribers

// 구독 상태 확인
GET /api/streamers/:id/subscription-status
```

---

## 🛠️ 개발 가이드라인

### 1. 컴포넌트 구조

```
src/
├── components/
│   ├── broadcast/
│   │   ├── BroadcastList/
│   │   ├── BroadcastCard/
│   │   ├── BroadcastPlayer/
│   │   ├── BroadcastInfo/
│   │   └── BroadcastSchedule/
│   ├── chat/
│   │   ├── ChatContainer/
│   │   ├── ChatMessage/
│   │   ├── ChatInput/
│   │   └── ChatModeration/
│   ├── streamer/
│   │   ├── StreamerProfile/
│   │   ├── StreamerStats/
│   │   └── StreamerSettings/
│   └── vod/
│       ├── VODList/
│       ├── VODCard/
│       └── VODPlayer/
```

### 2. 실시간 기능

```typescript
// WebSocket 연결 관리
class BroadcastWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect(broadcastId: string) {
    this.ws = new WebSocket(`wss://api.community.com/broadcast/${broadcastId}/ws`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
    
    this.ws.onclose = () => {
      this.handleReconnect();
    };
  }
  
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(broadcastId), 1000 * this.reconnectAttempts);
    }
  }
  
  sendMessage(message: ChatMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
```

---

## 🎯 다음 단계

### 1. 디자인 시스템 구축
- 방송 전용 컴포넌트 라이브러리
- 실시간 애니메이션 효과
- 방송 테마 색상 팔레트

### 2. 프로토타입 제작
- 라이브 방송 페이지 와이어프레임
- 채팅 시스템 프로토타입
- 스트리머 프로필 페이지 설계

### 3. 개발 시작
- 방송 목록 페이지 개발
- 라이브 방송 플레이어 개발
- 실시간 채팅 시스템 개발
- 구독 시스템 개발

---

**작성자**: AI Assistant  
**검토자**: 방송 팀  
**승인자**: 프로덕트 매니저  
**최종 업데이트**: 2024-10-06
