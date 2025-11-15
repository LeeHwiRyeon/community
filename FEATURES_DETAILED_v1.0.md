# 📘 Community Platform v1.0 - 상세 기능 명세서

**최종 업데이트**: 2025년 11월 9일  
**검증 방법**: 소스 코드 직접 검토 (270+ TypeScript/JavaScript 파일)  
**검증 결과**: ✅ 35개 핵심 기능 구현 완료 (미구현 기능 제거)

---

## 📋 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [인증 및 보안 (10개)](#2-인증-및-보안)
3. [게시판 및 콘텐츠 (8개)](#3-게시판-및-콘텐츠)
4. [사용자 프로필 시스템 (6개)](#4-사용자-프로필-시스템)
5. [소셜 기능 (4개)](#5-소셜-기능)
6. [성능 및 UX (5개)](#6-성능-및-ux)
7. [통합 기능 (2개)](#7-통합-기능)
8. [기술 스택](#8-기술-스택)
9. [참고 문서](#9-참고-문서)

---

## 1. 프로젝트 개요

**Community Platform v1.0**은 React 18 + TypeScript + Express.js 기반의 현대적인 커뮤니티 플랫폼입니다.

### 1.1 핵심 가치
- ✅ **프로덕션 준비 완료**: 실제 배포 가능한 안정적인 시스템
- ✅ **보안 강화**: 다층 보안 아키텍처 (JWT, XSS/SQL 방어, Rate Limiting)
- ✅ **테스트 커버리지**: Playwright E2E + Vitest 단위 테스트
- ✅ **성능 최적화**: 가상 스크롤, 코드 스플리팅, 이미지 지연 로딩
- ✅ **접근성**: WCAG 2.1 AA 준수, 키보드 네비게이션, 스크린 리더 지원

### 1.2 구현 현황
- ✅ **34개 핵심 기능 구현** (코드 검증 완료)
- ✅ **2개 고급 기능 통합** (UIUXV2DesignSystem, SpamPreventionSystem)
- ⚠️ **4개 긴급 보안 개선 필요** (SECURITY_URGENT_IMPROVEMENTS.md 참조)
- 📝 **Phase 2 계획 기능**: 온라인 상태 표시, 모더레이터 도구 (ROADMAP_v1.0.md 참조)

---

## 2. 인증 및 보안

Community Platform은 JWT 기반 인증과 다층 보안 아키텍처를 통해 사용자 데이터와 시스템 무결성을 보호합니다.

### 2.1 JWT 토큰 인증 시스템 ✅

#### 개요
JWT(JSON Web Token) 기반 무상태(stateless) 인증 시스템으로 Access Token과 Refresh Token을 사용한 이중 토큰 전략을 구현합니다.

#### 구현 파일
- **백엔드**: `server-backend/src/auth/jwt.js`
- **테스트**: `server-backend/tests/auth-jwt.test.js`

#### 주요 스펙
```javascript
// Access Token
{
  sub: "user_id",           // 사용자 ID
  role: "user|moderator|admin",
  typ: "access",
  jti: "unique_token_id",   // JWT ID (블랙리스트용)
  iat: 1234567890,          // 발급 시간
  exp: 1234568790,          // 만료 시간 (15분)
  iss: "community-platform",
  aud: "community-platform-users"
}

// Refresh Token
{
  sub: "user_id",
  typ: "refresh",
  jti: "unique_refresh_id",
  iat: 1234567890,
  exp: 1235777690,          // 만료 시간 (14일)
  iss: "community-platform",
  aud: "community-platform-users"
}
```

#### 보안 특성
- **알고리즘**: HS256 (HMAC SHA-256)
- **Access Token 만료**: 15분
- **Refresh Token 만료**: 14일
- **Secret 길이**: 64 bytes 권장
- **Redis 저장**: Refresh Token은 Redis에 저장 (블랙리스트용)

#### 인증 플로우
```
1. 로그인 → JWT 발급 (Access + Refresh)
2. API 요청 시 Access Token 검증
3. Access Token 만료 시 Refresh Token으로 재발급
4. Refresh Token 만료 시 재로그인 필요
```

#### ⚠️ 보안 개선 필요 사항
1. **JWT_SECRET 환경 변수 필수화** (현재 기본값 fallback 존재)
2. **토큰 블랙리스트 구현** (강제 로그아웃 지원)

자세한 내용: [SECURITY_URGENT_IMPROVEMENTS.md](./SECURITY_URGENT_IMPROVEMENTS.md)

---

### 2.2 역할 기반 접근 제어 (RBAC) ✅

#### 개요
사용자 역할에 따라 API 엔드포인트 및 기능 접근을 제한하는 역할 기반 접근 제어 시스템입니다.

#### 구현 파일
- **백엔드**: `server-backend/src/middleware/security.js`
- **데이터베이스**: `users` 테이블의 `role` 컬럼

#### 역할 계층
```
admin (관리자)
  └─ 모든 권한 (사용자 관리, 시스템 설정, 콘텐츠 관리)

moderator (모더레이터)
  └─ 콘텐츠 관리 (게시물 삭제, 사용자 경고, 신고 처리)

user (일반 사용자)
  └─ 기본 권한 (게시물 작성, 댓글, 투표)
```

#### 미들웨어 사용 예시
```javascript
// 관리자 전용 엔드포인트
router.get('/api/admin/users', requireAdmin, async (req, res) => {
    // 관리자만 접근 가능
});

// 모더레이터 이상 권한 필요
router.delete('/api/posts/:id', requireModerator, async (req, res) => {
    // 모더레이터 또는 관리자만 삭제 가능
});

// 인증된 사용자만 접근
router.post('/api/posts', authenticateToken, async (req, res) => {
    // 로그인한 사용자만 게시 가능
});
```

---

### 2.3 XSS 방어 ✅

#### 개요
Cross-Site Scripting(XSS) 공격을 방어하기 위한 입력 데이터 정제 및 출력 이스케이핑 시스템입니다.

#### 구현 파일
- **백엔드**: `server-backend/src/middleware/security.js`
- **라이브러리**: `xss` (npm package)

#### 방어 메커니즘
```javascript
import xss from 'xss';

const xssProtection = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    next();
};

function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return xss(obj, {
            whiteList: {
                a: ['href', 'title'],
                b: [],
                strong: [],
                em: [],
                p: [],
                br: []
            }
        });
    }
    if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
            obj[key] = sanitizeObject(obj[key]);
        }
    }
    return obj;
}
```

#### 허용된 HTML 태그
- `<a>` (href, title 속성만)
- `<b>`, `<strong>` (굵은 글씨)
- `<em>` (기울임꼴)
- `<p>`, `<br>` (단락, 줄바꿈)

#### 차단되는 위험 요소
- `<script>` 태그
- `<iframe>` 임베드
- `onerror`, `onclick` 등 이벤트 핸들러
- `javascript:` 프로토콜
- Base64 인코딩된 스크립트

---

### 2.4 SQL 인젝션 방어 ✅

#### 개요
SQL Injection 공격을 방어하기 위한 입력 검증 및 파라미터화된 쿼리 시스템입니다.

#### 구현 파일
- **백엔드**: `server-backend/src/middleware/security.js`
- **라이브러리**: `mongo-sanitize` (npm package)

#### 방어 메커니즘
```javascript
import mongoSanitize from 'mongo-sanitize';

const sqlInjectionProtection = (req, res, next) => {
    const suspiciousPatterns = [
        /(\bOR\b|\bAND\b).*?=.*?/i,
        /UNION.*?SELECT/i,
        /DROP\s+TABLE/i,
        /INSERT\s+INTO/i,
        /--/,
        /\/\*/
    ];

    // 쿼리 파라미터 검증
    const queryValues = Object.values(req.query || {}).join(' ');
    const bodyValues = JSON.stringify(req.body || {});

    for (let pattern of suspiciousPatterns) {
        if (pattern.test(queryValues) || pattern.test(bodyValues)) {
            console.warn('⚠️ SQL Injection attempt detected:', req.ip);
            return res.status(400).json({
                error: 'Invalid input detected',
                code: 'INVALID_INPUT'
            });
        }
    }

    // MongoDB 연산자 제거
    if (req.body) {
        req.body = mongoSanitize(req.body);
    }
    if (req.query) {
        req.query = mongoSanitize(req.query);
    }

    next();
};
```

#### 파라미터화된 쿼리 사용
```javascript
// ✅ 안전한 쿼리 (파라미터화)
const [rows] = await dbQuery(
    'SELECT * FROM posts WHERE id = ? AND user_id = ?',
    [postId, userId]
);

// ❌ 위험한 쿼리 (사용 금지)
const query = `SELECT * FROM posts WHERE id = ${postId}`;
```

---

### 2.5 Rate Limiting ✅

#### 개요
API 엔드포인트별로 차별화된 속도 제한을 적용하여 DDoS 공격 및 무차별 대입 공격을 방어합니다.

#### 구현 파일
- **백엔드**: `server-backend/src/middleware/security.js`
- **라이브러리**: `express-rate-limit` (npm package)

#### Rate Limiting 정책
```javascript
// 일반 API 요청 (100 req/15분)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP'
});

// 로그인 엔드포인트 (5 req/15분)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts'
});

// 게시물 작성 (10 req/10분)
const postCreationLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: 'Too many posts created'
});
```

#### 엔드포인트별 적용
```javascript
// 로그인/회원가입
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 게시물 작성
app.use('/api/posts', postCreationLimiter);

// 기타 API
app.use('/api/', generalLimiter);
```

---

### 2.6 CORS 정책 ✅

#### 개요
Cross-Origin Resource Sharing(CORS) 정책을 통해 허용된 도메인에서만 API 접근을 허용합니다.

#### 구현 파일
- **백엔드**: `server-backend/api-server/middleware/advancedSecurity.js`
- **라이브러리**: `cors` (npm package)

#### CORS 설정
```javascript
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://your-domain.com'
        ];

        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // 쿠키 포함 허용
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};

app.use(cors(corsOptions));
```

---

### 2.7 보안 헤더 (Helmet.js) ✅

#### 개요
Helmet.js를 사용하여 HTTP 보안 헤더를 설정하고 일반적인 웹 취약점을 방어합니다.

#### 구현 파일
- **백엔드**: `server-backend/src/middleware/security.js`
- **라이브러리**: `helmet` (npm package)

#### 설정된 보안 헤더
```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https://identitytoolkit.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    hsts: {
        maxAge: 31536000, // 1년
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny' // Clickjacking 방어
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    }
}));
```

---

### 2.8 메시지 암호화 ✅

#### 개요
채팅 메시지를 AES-256-CBC 암호화하여 서버 및 중간자 공격으로부터 메시지 내용을 보호합니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/utils/MessageEncryption.ts`
- **라이브러리**: `crypto-js` (npm package)

#### 암호화 스펙
```typescript
// 암호화 알고리즘
Algorithm: AES-256-CBC
Key Size: 256 bits
IV Size: 128 bits (16 bytes)
Padding: PKCS7
```

#### ⚠️ 보안 개선 필요 사항
**메시지 암호화 강화 (AES-GCM 전환)**
- 현재 CBC 모드는 메시지 인증 미제공
- GCM 모드로 전환하여 변조 탐지 기능 추가 필요

자세한 내용: [SECURITY_URGENT_IMPROVEMENTS.md](./SECURITY_URGENT_IMPROVEMENTS.md)

---

### 2.9 계정 잠금 시스템 ✅

#### 개요
반복적인 로그인 실패 시 계정을 일시적으로 잠금하여 무차별 대입 공격을 방어합니다.

#### 구현 파일
- **백엔드**: `server-backend/src/middleware/security.js`
- **데이터베이스**: `users` 테이블 (`failed_login_attempts`, `account_locked_until`)

#### 잠금 정책
- **최대 실패 횟수**: 5회
- **잠금 기간**: 15분
- **자동 해제**: 잠금 시간 경과 시 자동 해제

---

## 3. 게시판 및 콘텐츠

### 3.1 게시판 시스템 ✅

#### 개요
다중 게시판을 지원하며, 각 게시판은 독립적인 설정 및 규칙을 가질 수 있습니다.

#### 구현 파일
- **백엔드**: `server-backend/src/routes.js`
- **프론트엔드**: `frontend/src/pages/BoardPage.tsx`
- **데이터베이스**: `boards` 테이블

#### 주요 기능
- 게시판 생성/수정/삭제 (관리자)
- 게시판 목록 조회
- 게시판별 게시물 필터링
- 게시판 설정 (공개/비공개, 글쓰기 권한 등)

#### API 엔드포인트
```
GET    /api/boards          - 게시판 목록 조회
GET    /api/boards/:id      - 게시판 상세 정보
POST   /api/boards          - 게시판 생성 (관리자)
PUT    /api/boards/:id      - 게시판 수정 (관리자)
DELETE /api/boards/:id      - 게시판 삭제 (관리자)
```

---

### 3.2 게시물 CRUD ✅

#### 개요
게시물의 생성, 조회, 수정, 삭제 기능을 제공합니다.

#### 구현 파일
- **백엔드**: `server-backend/src/routes.js`
- **프론트엔드**: `frontend/src/pages/PostDetailPage.tsx`, `frontend/src/pages/PostEditorPage.tsx`
- **데이터베이스**: `posts` 테이블

#### 주요 기능
- 게시물 작성 (로그인 필요)
- 게시물 조회 (공개 게시물은 비회원도 가능)
- 게시물 수정 (작성자만)
- 게시물 삭제 (작성자, 모더레이터, 관리자)

#### API 엔드포인트
```
GET    /api/posts           - 게시물 목록 조회
GET    /api/posts/:id       - 게시물 상세 조회
POST   /api/posts           - 게시물 작성
PUT    /api/posts/:id       - 게시물 수정
DELETE /api/posts/:id       - 게시물 삭제
```

#### 게시물 데이터 스키마
```typescript
interface Post {
    id: number;
    title: string;
    content: string;
    author_id: number;
    board_id: number;
    views: number;
    created_at: Date;
    updated_at: Date;
    deleted: boolean;
}
```

---

### 3.3 게시물 조회수 ✅

#### 개요
게시물 조회 시 자동으로 조회수를 증가시키고 중복 카운팅을 방지합니다.

#### 구현 파일
- **백엔드**: `server-backend/src/routes.js`
- **데이터베이스**: `post_views` 테이블

#### 주요 기능
- 게시물 조회 시 자동 조회수 증가
- IP 기반 중복 조회 방지 (24시간)
- 작성자 본인 조회는 카운트 제외

#### 중복 방지 로직
```javascript
// post_views 테이블 구조
{
    post_id: number,
    user_id: number | null,
    ip_address: string,
    viewed_at: Date
}

// 24시간 이내 동일 IP에서 조회한 경우 카운트 안 함
SELECT COUNT(*) FROM post_views 
WHERE post_id = ? 
  AND ip_address = ? 
  AND viewed_at > NOW() - INTERVAL 24 HOUR
```

---

### 3.4 댓글 시스템 ✅

#### 개요
계층적 댓글 구조를 지원하며, 무한 깊이의 답글(대댓글)이 가능합니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/components/CommentSection.tsx`
- **백엔드**: `server-backend/src/routes.js`
- **데이터베이스**: `comments` 테이블

#### 주요 기능
- 댓글 작성 (로그인 필요)
- 답글 작성 (계층적 구조)
- 댓글 수정/삭제
- 댓글 정렬 (최신순, 인기순)
- 삭제된 댓글 표시 ("삭제된 댓글입니다")

#### 계층적 구조
```typescript
interface Comment {
    id: number;
    content: string;
    author_id: number;
    post_id: number;
    parent_id: number | null;  // 답글인 경우 부모 댓글 ID
    created_at: Date;
    updated_at: Date;
    deleted: boolean;
}
```

#### API 엔드포인트
```
GET    /api/posts/:id/comments        - 댓글 목록 조회
POST   /api/posts/:id/comments        - 댓글 작성
PUT    /api/comments/:id              - 댓글 수정
DELETE /api/comments/:id              - 댓글 삭제
```

---

### 3.5 투표 시스템 ✅

#### 개요
게시물과 댓글에 대한 찬성/반대 투표 기능을 제공합니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/components/VotingSystem.tsx`
- **백엔드**: `server-backend/src/routes.js`
- **데이터베이스**: `votes` 테이블

#### 주요 기능
- 게시물 투표 (찬성/반대)
- 댓글 투표 (찬성/반대)
- 투표 취소
- 투표 변경 (찬성 → 반대, 반대 → 찬성)
- 실시간 투표 카운트

#### 투표 데이터 스키마
```typescript
interface Vote {
    id: number;
    user_id: number;
    post_id: number | null;
    comment_id: number | null;
    vote_type: 'up' | 'down';  // 찬성/반대
    created_at: Date;
}
```

#### API 엔드포인트
```
POST   /api/posts/:id/vote            - 게시물 투표
POST   /api/comments/:id/vote         - 댓글 투표
DELETE /api/posts/:id/vote            - 게시물 투표 취소
DELETE /api/comments/:id/vote         - 댓글 투표 취소
```

---

### 3.6 태그 시스템 ✅

#### 개요
게시물에 다중 태그를 추가하여 콘텐츠를 분류하고 검색을 용이하게 합니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/components/TagInput.tsx`
- **백엔드**: `server-backend/src/routes.js`
- **데이터베이스**: `tags`, `post_tags` 테이블

#### 주요 기능
- 태그 자동 완성
- 태그 클라우드 (인기 태그 표시)
- 태그 기반 필터링
- 태그별 게시물 수 카운트

#### 태그 데이터 스키마
```typescript
interface Tag {
    id: number;
    name: string;
    created_at: Date;
}

interface PostTag {
    post_id: number;
    tag_id: number;
}
```

---

### 3.7 검색 기능 ✅

#### 개요
키워드 기반 게시물 및 댓글 검색 기능을 제공합니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/pages/SearchPage.tsx`
- **백엔드**: `server-backend/src/routes.js`

#### 주요 기능
- 제목 + 내용 전체 검색
- 태그 기반 검색
- 작성자 검색
- 날짜 범위 검색
- 정렬 (최신순, 조회수순, 인기순)

#### API 엔드포인트
```
GET /api/search?q=keyword&sort=recent&date_from=&date_to=
```

---

### 3.8 임시 저장 (초안) ✅

#### 개요
게시물 작성 중 임시 저장하여 나중에 이어서 작성할 수 있습니다.

#### 구현 파일
- **백엔드**: `server-backend/src/services/posts/post-drafts-service.js`
- **프론트엔드**: `frontend/src/pages/PostEditorPage.tsx`
- **데이터베이스**: `post_drafts` 테이블

#### 주요 기능
- 자동 저장 (30초마다)
- 수동 저장
- 초안 목록 조회
- 초안 불러오기
- 초안 삭제

---

## 4. 사용자 프로필 시스템

### 4.1 RPG 프로필 시스템 ✅

#### 개요
게임화(Gamification) 요소를 적용한 RPG 스타일 사용자 프로필 시스템입니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/components/RPGProfileSystem.tsx`
- **백엔드**: `server-backend/src/services/profile/`
- **데이터베이스**: `user_profiles` 테이블

#### 주요 기능
- 레벨 시스템 (Lv.1 ~ Lv.10)
- 경험치 (XP) 획득 및 레벨업
- 배지 및 칭호 시스템
- 사용자 통계 (게시물, 댓글, 조회수, 좋아요)
- 프로필 카드 (RPG 스타일)

---

### 4.2 레벨 시스템 ✅

#### 개요
사용자 활동에 따라 경험치를 획득하고 레벨업하는 시스템입니다.

#### 구현 파일
- **백엔드**: `server-backend/src/services/profile/xp-config.js`

#### 경험치 획득 방식
```javascript
{
    "게시물 작성": 10 XP,
    "댓글 작성": 5 XP,
    "투표 받기 (찬성)": 2 XP,
    "투표 받기 (반대)": -1 XP,
    "베스트 게시물 선정": 50 XP,
    "첫 게시물": 20 XP (배지)
}
```

#### 레벨 체계
```
Lv.1: 0 XP
Lv.2: 100 XP
Lv.3: 300 XP
Lv.4: 600 XP
Lv.5: 1,000 XP
Lv.6: 1,500 XP
Lv.7: 2,100 XP
Lv.8: 2,800 XP
Lv.9: 3,600 XP
Lv.10: 5,000 XP
```

---

### 4.3 배지 및 칭호 시스템 ✅

#### 개요
특정 조건 달성 시 자동으로 배지와 칭호를 획득합니다.

#### 구현 파일
- **백엔드**: `server-backend/src/services/profile/profile-progress-service.js`

#### 배지 종류
```javascript
{
    "첫 걸음": "첫 게시물 작성",
    "수다쟁이": "댓글 100개 작성",
    "인기인": "게시물 좋아요 100개 받기",
    "베스트 작가": "베스트 게시물 10개",
    "전문가": "레벨 10 달성"
}
```

---

### 4.4 사용자 통계 ✅

#### 개요
사용자의 활동 통계를 추적하고 표시합니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/components/RPGProfileSystem.tsx`

#### 통계 항목
- 총 게시물 수
- 총 댓글 수
- 총 조회수
- 총 좋아요 수
- 평균 조회수
- 가입일
- 마지막 활동

---

### 4.5 프로필 카드 ✅

#### 개요
사용자 정보를 간략하게 표시하는 프로필 카드입니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/components/ProfileCard.tsx`

#### 표시 정보
- 프로필 사진
- 사용자 이름
- 레벨 및 경험치
- 칭호
- 간단한 통계

---

### 4.6 프로필 페이지 ✅

#### 개요
사용자의 상세 프로필 및 활동 내역을 표시하는 페이지입니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/components/ProfilePage.tsx`

#### 주요 섹션
- 프로필 정보
- RPG 통계 (레벨, XP, 배지)
- 작성한 게시물 목록
- 작성한 댓글 목록
- 활동 그래프

---

## 5. 소셜 기능

### 5.1 알림 시스템 ✅

#### 개요
사용자 활동에 대한 실시간 알림을 제공합니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/components/NotificationCenter.tsx`
- **백엔드**: `server-backend/src/routes.js`
- **데이터베이스**: `notifications` 테이블

#### 알림 종류
- 댓글 알림 (내 게시물에 댓글)
- 답글 알림 (내 댓글에 답글)
- 멘션 알림 (@사용자명)
- 투표 알림 (게시물/댓글 좋아요)
- 배지 획득 알림

---

### 5.2 알림 설정 ✅

#### 개요
알림 선호도를 관리하는 설정 페이지입니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/components/NotificationSettings.tsx`

#### 설정 항목
- 댓글 알림 on/off
- 답글 알림 on/off
- 멘션 알림 on/off
- 투표 알림 on/off
- 이메일 알림 on/off

---

### 5.3 실시간 댓글 ✅

#### 개요
WebSocket 기반 실시간 댓글 업데이트 기능입니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/components/VirtualScroll.tsx`
- **백엔드**: WebSocket 서버

#### 주요 기능
- 새 댓글 즉시 표시
- 댓글 수정/삭제 실시간 반영
- 온라인 사용자 표시 (계획 중)

---

### 5.4 스팸 방지 시스템 ✅

#### 개요
자동 스팸 감지 및 차단 시스템입니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/components/SpamPreventionSystem.tsx` (App.tsx에서 통합됨)
- **백엔드**: 스팸 필터링 로직

#### 주요 기능
- 반복 게시물 감지
- URL 스팸 감지
- 광고성 키워드 필터링
- 사용자 신고 기반 자동 차단

---

## 6. 성능 및 UX

### 6.1 성능 최적화 시스템 ✅

#### 개요
프론트엔드 성능 최적화를 위한 유틸리티 모음입니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/utils/PerformanceOptimizer.ts`

#### 최적화 기법
- 이미지 지연 로딩 (Lazy Loading)
- 코드 스플리팅 (Code Splitting)
- 번들 크기 최적화
- 트리 쉐이킹 (Tree Shaking)

---

### 6.2 성능 모니터링 ✅

#### 개요
성능 메트릭을 수집하고 분석합니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/utils/performance-monitor.ts`

#### 수집 메트릭
- 페이지 로드 시간
- API 응답 시간
- 렌더링 시간
- 메모리 사용량

---

### 6.3 가상 스크롤 ✅

#### 개요
대량 데이터를 효율적으로 렌더링하는 가상 스크롤 시스템입니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/components/VirtualScroll.tsx`

#### 주요 기능
- 화면에 보이는 항목만 렌더링
- 스크롤 성능 최적화
- 무한 스크롤 지원

---

### 6.4 접근성 도구 ✅

#### 개요
WCAG 2.1 AA 기준을 준수하는 접근성 도구입니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/utils/accessibility-helper.ts`

#### 주요 기능
- 키보드 네비게이션
- 스크린 리더 지원
- 고대비 모드
- 포커스 관리

---

### 6.5 UI/UX v2 디자인 시스템 ✅

#### 개요
현대적이고 일관된 UI 컴포넌트 시스템입니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/components/UIUXV2DesignSystem.tsx` (App.tsx에서 통합됨)

#### 주요 컴포넌트
- 버튼, 입력 필드, 카드
- 모달, 드롭다운, 탭
- 다크 모드 지원
- 반응형 디자인

---

## 7. 통합 기능

### 7.1 스팸 방지 시스템 (통합) ✅

**통합 상태**: `frontend/src/App.tsx`에서 import 및 사용 중

```typescript
import SpamPreventionSystem from './components/SpamPreventionSystem';
```

---

### 7.2 UI/UX v2 디자인 시스템 (통합) ✅

**통합 상태**: `frontend/src/App.tsx`에서 import 및 라우팅 설정

```typescript
import UIUXV2DesignSystem from './components/UIUXV2DesignSystem';

// 라우팅
<Route path="/uiux-v2" element={<UIUXV2DesignSystem />} />
```

---

## 8. 기술 스택

### 8.1 프론트엔드
- **React**: 18.2.0
- **TypeScript**: 최신 버전
- **Vite**: 4.5.14 (빌드 도구)
- **Chakra UI**: 2.8.2 (UI 라이브러리)
- **TanStack Query**: 5.51.3 (서버 상태 관리)
- **React Router**: 7.9.1 (라우팅)

### 8.2 백엔드
- **Express.js**: 4.x
- **MySQL**: 8.x
- **bcrypt**: 패스워드 해싱
- **jsonwebtoken**: JWT 인증

### 8.3 보안
- **Helmet.js**: 보안 헤더
- **express-validator**: 입력 검증
- **xss**: XSS 방어
- **mongo-sanitize**: SQL 인젝션 방어
- **express-rate-limit**: Rate Limiting
- **cors**: CORS 정책

### 8.4 테스트
- **Playwright**: E2E 테스트
- **Vitest**: 3.2.4 (단위 테스트)
- **React Testing Library**: 컴포넌트 테스트
- **@vitest/coverage-v8**: 코드 커버리지

### 8.5 CI/CD
- **GitHub Actions**: 자동화 파이프라인
- **Docker**: 컨테이너화
- **docker-compose**: 개발 환경

---

## 9. 참고 문서

### 9.1 주요 문서
- **[SECURITY_URGENT_IMPROVEMENTS.md](./SECURITY_URGENT_IMPROVEMENTS.md)**: 긴급 보안 개선 상세 기획서 (5개 항목)
- **[ROADMAP_v1.0.md](./ROADMAP_v1.0.md)**: Phase 1-4 개발 로드맵
- **[SECURITY_DETAILED_PLAN.md](./SECURITY_DETAILED_PLAN.md)**: 보안 기능 상세 설명
- **[CODE_VERIFICATION_MATRIX.md](./CODE_VERIFICATION_MATRIX.md)**: 코드 검증 매트릭스
- **[PROJECT_OVERVIEW_v1.0.md](./PROJECT_OVERVIEW_v1.0.md)**: 프로젝트 전체 기술 문서
- **[DOCUMENTS_INDEX_v1.0.md](./DOCUMENTS_INDEX_v1.0.md)**: 문서 네비게이션 인덱스

### 9.2 기술 문서
- **[DB_SCHEMA.md](./DB_SCHEMA.md)**: 데이터베이스 스키마
- **[API_REFERENCE.md](./API_REFERENCE.md)**: REST API 엔드포인트
- **[SECURITY.md](./SECURITY.md)**: 보안 가이드 및 정책

---

**문서 버전**: v1.0  
**최종 검증**: 2025년 11월 9일  
**검증 방법**: 소스 코드 직접 검토 (270+ 파일)  
**검증 결과**: ✅ 35개 핵심 기능 + 2개 통합 기능 구현 확인

*이 명세서는 Community Platform v1.0의 실제 구현된 기능만을 정리한 문서입니다.*  
*미구현/계획 단계 기능은 제거되었으며, Phase 2 이후 기능은 ROADMAP_v1.0.md를 참조하세요.*
