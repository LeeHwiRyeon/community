# 🌳 Community Platform 트리형 구조 설계

## 📋 개요
**홈페이지 → 커뮤니티 허브 → 커뮤니티 → 게시판 → 게시글** 구조로 계층적 네비게이션 구현

## 🎯 주요 4개 커뮤니티 (순서 고정)

### 1. 📰 뉴스 커뮤니티
- **게시판 구성:**
  - 📢 공지사항
  - 🔥 실시간 뉴스
  - 💬 뉴스 토론
  - 📝 뉴스레터
  - ⚙️ 알림 설정

### 2. 🎮 게임 커뮤니티  
- **게시판 구성:**
  - 🎯 게임 뉴스
  - 📝 게임 리뷰
  - 📖 공략 가이드
  - 🏆 e스포츠
  - 💬 자유 토론
  - 🎪 이벤트

### 3. 📺 방송국 커뮤니티
- **게시판 구성:**
  - 🔴 라이브 방송
  - 📅 방송 일정
  - 💬 실시간 채팅
  - 👥 구독자 관리
  - 💰 수익화 도구
  - 📊 방송 통계

### 4. 🎭 코스프레 커뮤니티
- **게시판 구성:**
  - 📸 포트폴리오 갤러리
  - 👗 의상 관리
  - 🎪 이벤트 참가
  - 📚 튜토리얼
  - 🛍️ 의상 상점
  - 🤖 AI 추천

## 🗂️ URL 구조

```
/ (홈페이지)
├── /communities (커뮤니티 허브)
│   ├── /communities/news (뉴스 커뮤니티)
│   │   ├── /communities/news/notice (공지사항)
│   │   ├── /communities/news/live-news (실시간 뉴스)
│   │   ├── /communities/news/discussion (뉴스 토론)
│   │   ├── /communities/news/newsletter (뉴스레터)
│   │   └── /communities/news/settings (알림 설정)
│   ├── /communities/games (게임 커뮤니티)
│   │   ├── /communities/games/news (게임 뉴스)
│   │   ├── /communities/games/reviews (게임 리뷰)
│   │   ├── /communities/games/guides (공략 가이드)
│   │   ├── /communities/games/esports (e스포츠)
│   │   ├── /communities/games/discussion (자유 토론)
│   │   └── /communities/games/events (이벤트)
│   ├── /communities/streaming (방송국 커뮤니티)
│   │   ├── /communities/streaming/live (라이브 방송)
│   │   ├── /communities/streaming/schedule (방송 일정)
│   │   ├── /communities/streaming/chat (실시간 채팅)
│   │   ├── /communities/streaming/subscribers (구독자 관리)
│   │   ├── /communities/streaming/monetization (수익화 도구)
│   │   └── /communities/streaming/analytics (방송 통계)
│   └── /communities/cosplay (코스프레 커뮤니티)
│       ├── /communities/cosplay/portfolio (포트폴리오 갤러리)
│       ├── /communities/cosplay/costumes (의상 관리)
│       ├── /communities/cosplay/events (이벤트 참가)
│       ├── /communities/cosplay/tutorials (튜토리얼)
│       ├── /communities/cosplay/shop (의상 상점)
│       └── /communities/cosplay/ai-recommendations (AI 추천)
└── /posts/:postId (게시글 상세)
```

## 🧭 네비게이션 구조

### 브레드크럼 네비게이션
```
홈 > 커뮤니티 허브 > 뉴스 커뮤니티 > 실시간 뉴스 > 게시글 제목
```

### 사이드바 네비게이션
```
📰 뉴스 커뮤니티
├── 📢 공지사항
├── 🔥 실시간 뉴스
├── 💬 뉴스 토론
├── 📝 뉴스레터
└── ⚙️ 알림 설정

🎮 게임 커뮤니티
├── 🎯 게임 뉴스
├── 📝 게임 리뷰
├── 📖 공략 가이드
├── 🏆 e스포츠
├── 💬 자유 토론
└── 🎪 이벤트
```

## 🎨 UI/UX 설계

### 커뮤니티 허브 페이지
- 4개 주요 커뮤니티 카드 형태로 표시
- 각 커뮤니티별 멤버 수, 게시물 수, 활성도 표시
- 클릭 시 해당 커뮤니티 메인 페이지로 이동

### 커뮤니티 메인 페이지
- 좌측 사이드바에 게시판 목록
- 우측 메인 영역에 최신 게시물, 인기 게시물 표시
- 상단에 커뮤니티 정보 및 통계

### 게시판 페이지
- 게시물 목록 (카드 형태)
- 필터링 및 정렬 옵션
- 검색 기능
- 페이지네이션

### 게시글 페이지
- 게시글 내용
- 댓글 시스템
- 관련 게시글 추천
- 공유 및 북마크 기능

## 🔧 기술 구현

### 라우팅 구조
```typescript
// App.tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/communities" element={<CommunityHub />} />
  <Route path="/communities/:communityId" element={<CommunityMain />} />
  <Route path="/communities/:communityId/:boardId" element={<BoardPage />} />
  <Route path="/posts/:postId" element={<PostDetail />} />
</Routes>
```

### 데이터 구조
```typescript
interface Community {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  boards: Board[];
  memberCount: number;
  activeUsers: number;
  dailyPosts: number;
}

interface Board {
  id: string;
  name: string;
  description: string;
  icon: string;
  postCount: number;
  recentPosts: Post[];
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  views: number;
  likes: number;
  comments: Comment[];
}
```

## 📱 반응형 디자인

### 모바일
- 햄버거 메뉴로 사이드바 토글
- 카드 형태의 게시물 목록
- 터치 친화적 인터페이스

### 태블릿
- 사이드바 축소 형태
- 2열 그리드 레이아웃
- 중간 크기 카드

### 데스크톱
- 전체 사이드바 표시
- 3열 그리드 레이아웃
- 상세 정보 표시

## 🚀 구현 우선순위

1. **Phase 1**: 기본 트리형 구조 구현
   - 커뮤니티 허브 페이지
   - 4개 주요 커뮤니티 페이지
   - 기본 게시판 구조

2. **Phase 2**: 게시판 기능 구현
   - 게시물 CRUD
   - 댓글 시스템
   - 검색 및 필터링

3. **Phase 3**: 고급 기능
   - 실시간 알림
   - AI 추천
   - 모바일 최적화

4. **Phase 4**: 성능 최적화
   - 캐싱 시스템
   - 무한 스크롤
   - 이미지 최적화
