# 📘 Community Platform v1.0 - 기능 요약

**최종 업데이트**: 2025년 11월 9일  
**검증 방법**: 소스 코드 직접 검토 (270+ 파일)  
**검증 결과**: ✅ 35개 핵심 기능 + 2개 통합 기능 구현 완료

> 📖 **상세 명세서**: 각 기능의 상세한 구현 내역은 [FEATURES_DETAILED_v1.0.md](./FEATURES_DETAILED_v1.0.md)를 참조하세요.

---

## ✅ 구현 완료 기능 (36개)

### 🔒 인증 및 보안 (9개)
1. **JWT 토큰 인증** - Access Token (15분) + Refresh Token (14일) 이중 전략
2. **역할 기반 접근 제어 (RBAC)** - Admin, Moderator, User 권한 관리
3. **XSS 방어** - xss 라이브러리 기반 입력 정제
4. **SQL 인젝션 방어** - mongo-sanitize + 패턴 감지
5. **Rate Limiting** - 엔드포인트별 차별화된 속도 제한
6. **CORS 정책** - 화이트리스트 기반 Origin 검증
7. **보안 헤더 (Helmet.js)** - CSP, HSTS, X-Frame-Options 설정
8. **메시지 암호화** - AES-256-CBC 암호화 (⚠️ GCM 전환 필요)
9. **계정 잠금 시스템** - 5회 실패 시 15분 잠금

### 📋 게시판 및 콘텐츠 (8개)
11. **게시판 시스템** - 다중 게시판, 독립적 설정 지원
12. **게시물 CRUD** - 작성, 조회, 수정, 삭제
13. **게시물 조회수** - 자동 카운팅 및 중복 방지
14. **댓글 시스템** - 계층적 구조, 무한 깊이 답글
15. **투표 시스템** - 게시물/댓글 찬성/반대 투표
16. **태그 시스템** - 태그 자동 완성, 클라우드, 필터링
17. **검색 기능** - 키워드 검색, 다중 필터, 정렬
18. **임시 저장** - 자동/수동 저장, 초안 관리

### 👤 사용자 프로필 시스템 (6개)
19. **RPG 프로필 시스템** - 게임화 요소 적용
20. **레벨 시스템** - Lv.1~10, 활동 기반 경험치
21. **배지 및 칭호** - 활동 기반 자동 획득
22. **사용자 통계** - 게시물, 댓글, 조회수, 좋아요 추적
23. **프로필 카드** - 간단한 사용자 정보 표시
24. **프로필 페이지** - 상세 프로필 및 활동 내역

### 💬 소셜 기능 (4개)
25. **알림 시스템** - 실시간 알림 센터
26. **알림 설정** - 알림 선호도 관리
27. **실시간 댓글** - WebSocket 기반 실시간 업데이트
28. **스팸 방지 시스템** - 자동 스팸 감지 및 차단 (통합 완료)

### ⚡ 성능 및 UX (5개)
29. **성능 최적화 시스템** - 이미지 지연 로딩, 코드 스플리팅
30. **성능 모니터링** - 메트릭 수집 및 분석
31. **가상 스크롤** - 대량 데이터 효율적 렌더링
32. **접근성 도구** - 키보드 네비게이션, 스크린 리더 지원
33. **UI/UX v2 디자인 시스템** - 현대적 UI 컴포넌트 (통합 완료)

### 🧪 테스트 및 CI/CD (2개)
33. **E2E 테스트** - Playwright 기반 엔드투엔드 테스트
34. **단위 테스트** - Vitest 3.2.4 + React Testing Library

### 🚀 배포 및 인프라 (2개)
35. **CI/CD 파이프라인** - GitHub Actions 자동화
36. **Docker 컨테이너화** - docker-compose 개발 환경

---

## ⚠️ 긴급 보안 개선 필요 (4개)

다음 4개 항목은 긴급 보안 개선이 필요합니다. 상세 기획은 [SECURITY_URGENT_IMPROVEMENTS.md](./SECURITY_URGENT_IMPROVEMENTS.md)를 참조하세요.

1. **JWT Secret 환경 변수 필수화** - 현재 기본값 fallback 제거
2. **토큰 블랙리스트 구현** - 강제 로그아웃 지원
3. **메시지 암호화 강화 (AES-GCM)** - CBC → GCM 전환
4. **CSRF 토큰 완전 구현** - Double Submit Cookie 패턴

**예상 소요 시간**: 8일 (1.5주)

---

## 📝 Phase 2 계획 기능 (미구현)

다음 기능은 Phase 2 이후 개발 예정입니다. 로드맵은 [ROADMAP_v1.0.md](./ROADMAP_v1.0.md)를 참조하세요.

- **온라인 상태 표시** - 사용자 온라인/오프라인 상태
- **모더레이터 도구** - 게시물 신고/차단, 사용자 경고/밴
- **커뮤니티 규칙** - 게시판별 자동화된 규칙 적용
- **사용자 신고 시스템** - 콘텐츠/사용자 신고 및 검토 프로세스
- **자동 모더레이션** - AI 기반 스팸/부적절 콘텐츠 필터링
- **콘텐츠 추천** - 사용자 관심사 기반 알고리즘 추천
- **팔로우 시스템** - 사용자/게시판 팔로우 및 맞춤 피드
- **북마크/저장** - 관심 콘텐츠 개인 저장

---

## 🔧 기술 스택

### 프론트엔드
- React 18.2.0, TypeScript, Vite 4.5.14
- Chakra UI 2.8.2, TanStack Query 5.51.3, React Router 7.9.1

### 백엔드
- Express.js 4.x, REST API, MySQL 8.x
- JWT, bcrypt 패스워드 해싱

### 보안
- Helmet.js, express-validator, xss, mongo-sanitize, CORS, Rate Limiting

### 테스트
- Playwright (E2E), Vitest 3.2.4, React Testing Library, @vitest/coverage-v8

### CI/CD
- GitHub Actions, Docker, docker-compose

---

## 📚 참고 문서

### 기능 문서
- **[FEATURES_DETAILED_v1.0.md](./FEATURES_DETAILED_v1.0.md)** ⭐ - 각 기능의 상세 구현 내역 (API, 스펙, 예시 코드)
- **[CODE_VERIFICATION_MATRIX.md](./CODE_VERIFICATION_MATRIX.md)** - 기능별 코드 검증 매트릭스

### 보안 문서
- **[SECURITY_URGENT_IMPROVEMENTS.md](./SECURITY_URGENT_IMPROVEMENTS.md)** ⭐ - 긴급 보안 개선 상세 기획서
- **[SECURITY_DETAILED_PLAN.md](./SECURITY_DETAILED_PLAN.md)** - 보안 기능 상세 설명
- **[SECURITY.md](./SECURITY.md)** - 보안 가이드 및 정책

### 프로젝트 관리
- **[PROJECT_OVERVIEW_v1.0.md](./PROJECT_OVERVIEW_v1.0.md)** - 프로젝트 전체 기술 문서
- **[ROADMAP_v1.0.md](./ROADMAP_v1.0.md)** - Phase 1-4 개발 로드맵
- **[DOCUMENTS_INDEX_v1.0.md](./DOCUMENTS_INDEX_v1.0.md)** - 문서 네비게이션 인덱스

### 기술 문서
- **[DB_SCHEMA.md](./DB_SCHEMA.md)** - 데이터베이스 스키마
- **[API_REFERENCE.md](./API_REFERENCE.md)** - REST API 엔드포인트

---

**문서 버전**: v1.0  
**최종 검증**: 2025년 11월 9일  
**검증 방법**: 소스 코드 직접 검토 (270+ 파일)

*이 문서는 Community Platform v1.0의 실제 구현된 기능만을 요약한 것입니다.*  
*Firebase는 사용하지 않으며, JWT 기반 인증만 사용합니다.*  
*상세 내역은 FEATURES_DETAILED_v1.0.md를 참조하세요.*



### 1.2 구현 현황
- ✅ **35개 핵심 기능 구현** (코드 검증 완료)
- ✅ **2개 고급 기능 통합** (UIUXV2DesignSystem, SpamPreventionSystem)
- ⚠️ **5개 긴급 보안 개선 필요** (SECURITY_URGENT_IMPROVEMENTS.md 참조)
- 📝 **Phase 2 계획 기능**: 온라인 상태 표시, 모더레이터 도구 (ROADMAP_v1.0.md 참조)

---

## 2. 인증 및 보안

Community Platform은 다층 보안 아키텍처를 통해 사용자 데이터와 시스템 무결성을 보호합니다.

### 2.1 JWT 토큰 인증 시스템

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

### 2.2 Firebase 인증

#### 개요
Firebase Authentication을 통해 Google OAuth 및 익명 로그인을 지원합니다.

#### 구현 파일
- **프론트엔드**: `frontend/src/services/AuthService.ts`
- **타입 정의**: `frontend/src/types/auth.ts`

#### 지원 인증 방법
1. **Google OAuth 로그인**
   - Google 계정 연동
   - 프로필 정보 자동 가져오기 (이름, 이메일, 사진)
   
2. **익명 로그인**
   - 회원가입 없이 임시 사용자 생성
   - 게시물 읽기, 댓글 작성 등 제한적 기능 제공
   - 추후 정식 계정 전환 가능

#### Firebase 설정
```typescript
const firebaseConfig = {
    apiKey: "AIzaSy...",              // ⚠️ 환경 변수로 이동 필요
    authDomain: "thenewspaper-platform.firebaseapp.com",
    projectId: "thenewspaper-platform",
    storageBucket: "thenewspaper-platform.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdefghijklmnop"
};
```

#### ⚠️ 보안 개선 필요 사항
**Firebase API Key 환경 변수 이동** (현재 하드코딩)

자세한 내용: [SECURITY_URGENT_IMPROVEMENTS.md](./SECURITY_URGENT_IMPROVEMENTS.md)

---

### 2.3 역할 기반 접근 제어 (RBAC)

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

#### 권한 확인 로직
```javascript
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}
```

---

### 2.4 XSS 방어

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

### 2.5 SQL 인젝션 방어

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

### 2.6 Rate Limiting

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

#### Rate Limit 응답
```json
{
    "error": "Too many requests from this IP",
    "retryAfter": 900
}
```

---

### 2.7 CORS 정책

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

#### Preflight 요청 처리
```javascript
app.options('*', cors(corsOptions));
```

---

### 2.8 보안 헤더 (Helmet.js)

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

#### 보안 효과
- **CSP**: XSS 공격 방어 (신뢰할 수 있는 소스만 허용)
- **HSTS**: HTTPS 강제 적용 (1년)
- **X-Frame-Options**: Clickjacking 공격 방어
- **X-XSS-Protection**: 브라우저 XSS 필터 활성화
- **X-Content-Type-Options**: MIME 스니핑 방어
- **Referrer-Policy**: Referer 정보 제한

---

### 2.9 메시지 암호화

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

// 암호화 프로세스
1. 랜덤 IV 생성 (16 bytes)
2. 메시지 데이터 직렬화 (JSON)
3. AES-256-CBC 암호화
4. Base64 인코딩 (전송용)
```

#### 암호화/복호화 예시
```typescript
class MessageEncryption {
    static encryptMessage(content: string, roomKey: string): EncryptedMessage {
        const iv = CryptoJS.lib.WordArray.random(16);
        const messageData = JSON.stringify({
            content,
            timestamp: Date.now(),
            messageId: generateId()
        });

        const encrypted = CryptoJS.AES.encrypt(messageData, roomKey, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        return {
            encryptedContent: encrypted.toString(),
            iv: iv.toString(CryptoJS.enc.Base64),
            timestamp: Date.now()
        };
    }

    static decryptMessage(encrypted: EncryptedMessage, roomKey: string): string {
        const iv = CryptoJS.enc.Base64.parse(encrypted.iv);
        const decrypted = CryptoJS.AES.decrypt(encrypted.encryptedContent, roomKey, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
        const messageData = JSON.parse(decryptedString);
        return messageData.content;
    }
}
```

#### ⚠️ 보안 개선 필요 사항
**메시지 암호화 강화 (AES-GCM 전환)**
- 현재 CBC 모드는 메시지 인증 미제공
- GCM 모드로 전환하여 변조 탐지 기능 추가 필요

자세한 내용: [SECURITY_URGENT_IMPROVEMENTS.md](./SECURITY_URGENT_IMPROVEMENTS.md)

---

### 2.10 계정 잠금 시스템

#### 개요
반복적인 로그인 실패 시 계정을 일시적으로 잠금하여 무차별 대입 공격을 방어합니다.

#### 구현 파일
- **백엔드**: `server-backend/src/middleware/security.js`
- **데이터베이스**: `users` 테이블 (`failed_login_attempts`, `account_locked_until`)

#### 잠금 정책
```javascript
// 5회 로그인 실패 시 15분 잠금
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15분

// 로그인 실패 처리
async function handleFailedLogin(userId) {
    const user = await getUserById(userId);
    user.failed_login_attempts += 1;

    if (user.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
        user.account_locked_until = new Date(Date.now() + LOCK_DURATION);
        console.warn(`⚠️ Account locked: ${userId}`);
    }

    await updateUser(user);
}

// 로그인 성공 시 초기화
async function handleSuccessfulLogin(userId) {
    await dbQuery(
        'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE id = ?',
        [userId]
    );
}
```

#### 계정 잠금 확인
```javascript
function isAccountLocked(user) {
    if (!user.account_locked_until) return false;
    
    const now = new Date();
    if (now < user.account_locked_until) {
        const remainingMinutes = Math.ceil((user.account_locked_until - now) / 60000);
        return {
            locked: true,
            remainingMinutes
        };
    }
    
    return { locked: false };
}
```

---

## 3. 게시판 및 콘텐츠