# 🎮 Community Platform v1.3 - 게임 커뮤니티 제작 문서

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
Community Platform v1.3의 게임 커뮤니티 모듈로, 게이머들이 게임 정보를 공유하고, 팀을 구성하며, 토론할 수 있는 통합 플랫폼을 제공합니다.

### 핵심 가치
- **연결성**: 게이머들 간의 소통과 협력
- **정보성**: 게임 공략, 뉴스, 리뷰 제공
- **경쟁성**: 랭킹, 토너먼트, 도전 과제
- **커뮤니티**: 길드, 파티, 친구 시스템

---

## 🔧 기능 요구사항

### 1. 게임 정보 관리

#### 게임 목록
- [ ] 게임 카탈로그
- [ ] 장르별 분류
- [ ] 플랫폼별 필터링
- [ ] 인기 게임 순위
- [ ] 신작 게임 소개

#### 게임 상세
- [ ] 게임 정보 표시
- [ ] 스크린샷 갤러리
- [ ] 트레일러 영상
- [ ] 리뷰 및 평점
- [ ] 관련 게시글

### 2. 커뮤니티 기능

#### 게시판 시스템
- [ ] 공략 게시판
- [ ] 질문/답변 게시판
- [ ] 스크린샷 갤러리
- [ ] 자유 게시판
- [ ] 거래 게시판

#### 길드 시스템
- [ ] 길드 생성/가입
- [ ] 길드 관리
- [ ] 길드 채팅
- [ ] 길드 이벤트
- [ ] 길드 랭킹

#### 파티 매칭
- [ ] 파티 생성/참가
- [ ] 실시간 매칭
- [ ] 음성 채팅
- [ ] 게임 내 연동

### 3. 경쟁 기능

#### 랭킹 시스템
- [ ] 개인 랭킹
- [ ] 길드 랭킹
- [ ] 게임별 랭킹
- [ ] 시즌별 랭킹

#### 토너먼트
- [ ] 토너먼트 생성
- [ ] 참가 신청
- [ ] 대진표 관리
- [ ] 결과 기록

---

## 📄 페이지 구조

### 1. 게임 커뮤니티 메인 (`/games`)

```
┌─────────────────────────────────────────────────────────┐
│                    🎮 게임 커뮤니티                     │
├─────────────────────────────────────────────────────────┤
│ [전체] [PC] [모바일] [콘솔] [인디] [VR]                │
├─────────────────────────────────────────────────────────┤
│ 🔍 [게임 검색]                    [인기순 ▼] [최신순]   │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │   게임 1    │ │   게임 2    │ │   게임 3    │        │
│ │ [스크린샷]  │ │ [스크린샷]  │ │ [스크린샷]  │        │
│ │ 게임명      │ │ 게임명      │ │ 게임명      │        │
│ │ 장르        │ │ 장르        │ │ 장르        │        │
│ │ 평점 | 리뷰 │ │ 평점 | 리뷰 │ │ 평점 | 리뷰 │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    🔥 인기 게시글                       │
│ • 게임 공략: 보스전 가이드                              │
│ • 질문: 이 아이템 어디서 구하나요?                      │
│ • 스크린샷: 멋진 장면 캡처                             │
└─────────────────────────────────────────────────────────┘
```

### 2. 게임 상세 페이지 (`/games/:id`)

```
┌─────────────────────────────────────────────────────────┐
│ ← 뒤로가기                    🎮 게임 상세              │
├─────────────────────────────────────────────────────────┤
│                    [게임 메인 이미지]                   │
├─────────────────────────────────────────────────────────┤
│ 게임명: "Community Platform v1.3"                      │
│ 장르: RPG | 플랫폼: PC | 개발사: AutoAgents            │
│ 평점: ⭐⭐⭐⭐⭐ (4.8/5) | 리뷰: 1,234개                │
├─────────────────────────────────────────────────────────┤
│ [좋아요 123] [북마크] [공유] [리뷰 작성] [길드 가입]    │
├─────────────────────────────────────────────────────────┤
│ 게임 소개...                                           │
│                                                         │
│ Community Platform v1.3은 최고의 커뮤니티 게임입니다... │
│                                                         │
│ [스크린샷 1] [스크린샷 2] [스크린샷 3]                 │
│                                                         │
│ 주요 특징:                                              │
│ • 실시간 멀티플레이어                                   │
│ • 커스터마이징 시스템                                   │
│ • 길드 시스템                                          │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    📝 최신 리뷰                        │
├─────────────────────────────────────────────────────────┤
│ 사용자1: ⭐⭐⭐⭐⭐ 정말 재미있는 게임이에요!            │
│ 사용자2: ⭐⭐⭐⭐ 그래픽이 정말 좋네요                   │
│ 사용자3: ⭐⭐⭐⭐⭐ 길드 시스템이 최고입니다!            │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    🏆 관련 게시글                       │
├─────────────────────────────────────────────────────────┤
│ • 공략: 초보자 가이드                                   │
│ • 질문: 이 퀘스트 어떻게 해결하나요?                    │
│ • 스크린샷: 멋진 장면들                                │
└─────────────────────────────────────────────────────────┘
```

### 3. 게시판 페이지 (`/games/board`)

```
┌─────────────────────────────────────────────────────────┐
│                    📋 게임 게시판                      │
├─────────────────────────────────────────────────────────┤
│ [공략] [질문] [스크린샷] [자유] [거래]                  │
├─────────────────────────────────────────────────────────┤
│ 🔍 [검색] [필터] [정렬: 최신순 ▼] [+ 글쓰기]           │
├─────────────────────────────────────────────────────────┤
│ 제목 | 작성자 | 게임 | 조회수 | 좋아요 | 작성일 | 액션   │
├─────────────────────────────────────────────────────────┤
│ 보스전 공략 가이드 | 사용자1 | 게임A | 1,234 | 45 | 10-06 │
│ 이 아이템 어디서? | 사용자2 | 게임B | 567 | 23 | 10-06  │
│ 멋진 스크린샷 | 사용자3 | 게임C | 890 | 67 | 10-05     │
└─────────────────────────────────────────────────────────┘
```

### 4. 길드 페이지 (`/games/guild`)

```
┌─────────────────────────────────────────────────────────┐
│                    🏰 길드 시스템                      │
├─────────────────────────────────────────────────────────┤
│ [내 길드] [길드 목록] [길드 생성] [길드 랭킹]           │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │   길드 1    │ │   길드 2    │ │   길드 3    │        │
│ │ [길드 로고] │ │ [길드 로고] │ │ [길드 로고] │        │
│ │ 길드명      │ │ 길드명      │ │ 길드명      │        │
│ │ 멤버: 45명  │ │ 멤버: 32명  │ │ 멤버: 28명  │        │
│ │ 레벨: 15    │ │ 레벨: 12    │ │ 레벨: 10    │        │
│ │ [가입신청]  │ │ [가입신청]  │ │ [가입신청]  │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX 디자인

### 1. 색상 팔레트

```css
:root {
  /* Primary Colors */
  --game-primary: #9c27b0;
  --game-primary-light: #ba68c8;
  --game-primary-dark: #7b1fa2;
  
  /* Secondary Colors */
  --game-secondary: #ff9800;
  --game-secondary-light: #ffb74d;
  --game-secondary-dark: #f57c00;
  
  /* Accent Colors */
  --game-accent: #00bcd4;
  --game-accent-light: #4dd0e1;
  --game-accent-dark: #0097a7;
  
  /* Status Colors */
  --game-success: #4caf50;
  --game-warning: #ff9800;
  --game-error: #f44336;
  --game-info: #2196f3;
}
```

### 2. 게임 카드 컴포넌트

```css
.game-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.game-card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  position: relative;
}

.game-card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.7) 100%
  );
}

.game-card-content {
  padding: 16px;
  color: white;
}

.game-card-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.game-card-genre {
  font-size: 0.875rem;
  opacity: 0.8;
  margin-bottom: 8px;
}

.game-card-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
}
```

---

## 🗄️ 데이터 모델

### 1. 게임 모델

```typescript
interface Game {
  id: string;
  name: string;
  description: string;
  genre: GameGenre;
  platform: Platform[];
  developer: string;
  publisher: string;
  releaseDate: Date;
  rating: number;
  reviewCount: number;
  images: string[];
  videos: string[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

enum GameGenre {
  RPG = 'rpg',
  FPS = 'fps',
  STRATEGY = 'strategy',
  PUZZLE = 'puzzle',
  SPORTS = 'sports',
  RACING = 'racing',
  SIMULATION = 'simulation',
  ADVENTURE = 'adventure',
  ACTION = 'action',
  OTHER = 'other'
}

enum Platform {
  PC = 'pc',
  MOBILE = 'mobile',
  PS5 = 'ps5',
  XBOX = 'xbox',
  NINTENDO = 'nintendo',
  VR = 'vr'
}
```

### 2. 길드 모델

```typescript
interface Guild {
  id: string;
  name: string;
  description: string;
  logo: string;
  banner: string;
  game: Game;
  leader: User;
  members: GuildMember[];
  maxMembers: number;
  level: number;
  experience: number;
  isPublic: boolean;
  isRecruiting: boolean;
  requirements: GuildRequirements;
  createdAt: Date;
  updatedAt: Date;
}

interface GuildMember {
  user: User;
  role: GuildRole;
  joinedAt: Date;
  contribution: number;
}

enum GuildRole {
  LEADER = 'leader',
  OFFICER = 'officer',
  MEMBER = 'member',
  RECRUIT = 'recruit'
}
```

---

## 🔌 API 설계

### 1. 게임 API

```typescript
// 게임 목록 조회
GET /api/games
Query Parameters:
  - page: number
  - limit: number
  - genre: GameGenre
  - platform: Platform
  - search: string
  - sort: 'popular' | 'latest' | 'rating'

// 게임 상세 조회
GET /api/games/:id

// 게임 리뷰 조회
GET /api/games/:id/reviews

// 게임 리뷰 작성
POST /api/games/:id/reviews
Body: {
  rating: number;
  content: string;
}
```

### 2. 길드 API

```typescript
// 길드 목록 조회
GET /api/guilds
Query Parameters:
  - gameId: string
  - isRecruiting: boolean
  - sort: 'level' | 'members' | 'created'

// 길드 상세 조회
GET /api/guilds/:id

// 길드 생성
POST /api/guilds
Body: {
  name: string;
  description: string;
  gameId: string;
  maxMembers: number;
  isPublic: boolean;
}

// 길드 가입 신청
POST /api/guilds/:id/apply
Body: {
  message: string;
}
```

---

## 🛠️ 개발 가이드라인

### 1. 컴포넌트 구조

```
src/
├── components/
│   ├── games/
│   │   ├── GameList/
│   │   ├── GameCard/
│   │   ├── GameDetail/
│   │   ├── GameReview/
│   │   └── GameGallery/
│   ├── guilds/
│   │   ├── GuildList/
│   │   ├── GuildCard/
│   │   ├── GuildDetail/
│   │   └── GuildMember/
│   └── boards/
│       ├── BoardList/
│       ├── PostCard/
│       ├── PostDetail/
│       └── PostEditor/
```

### 2. 상태 관리

```typescript
interface GameStore {
  games: Game[];
  currentGame: Game | null;
  loading: boolean;
  error: string | null;
  
  fetchGames: (params?: GameQueryParams) => Promise<void>;
  fetchGameById: (id: string) => Promise<void>;
  searchGames: (query: string) => Promise<void>;
  filterGames: (filters: GameFilters) => Promise<void>;
}
```

---

## 🎯 다음 단계

### 1. 디자인 시스템 구축
- 게임 전용 컴포넌트 라이브러리
- 게임 테마 색상 팔레트
- 게임 아이콘 세트

### 2. 프로토타입 제작
- 게임 목록/상세 페이지 와이어프레임
- 길드 시스템 프로토타입
- 게시판 인터페이스 설계

### 3. 개발 시작
- 게임 목록 페이지 개발
- 게임 상세 페이지 개발
- 길드 시스템 개발
- 게시판 시스템 개발

---

**작성자**: AI Assistant  
**검토자**: 게임 팀  
**승인자**: 프로덕트 매니저  
**최종 업데이트**: 2024-10-06
