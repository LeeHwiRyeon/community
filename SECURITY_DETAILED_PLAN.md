# 🔒 Community Platform v1.0 - 보안 상세 기획서

**작성일**: 2025년 1월 9일  
**버전**: v1.0  
**상태**: 코드 검증 완료

---

## 📋 목차
1. [구현된 보안 기능 상세](#1-구현된-보안-기능-상세)
2. [보안 아키텍처](#2-보안-아키텍처)
3. [취약점 분석 및 개선 계획](#3-취약점-분석-및-개선-계획)
4. [보안 로드맵](#4-보안-로드맵)

---

## 1. 구현된 보안 기능 상세

### 1.1 인증 및 인가 시스템

#### ✅ JWT 토큰 기반 인증
**구현 파일**: `server-backend/src/auth/jwt.js`

**핵심 기능**:
```javascript
- Access Token: 15분 만료 (900초)
- Refresh Token: 14일 만료 (1,209,600초)
- 알고리즘: HS256 (HMAC-SHA256)
- Issuer/Audience: 커뮤니티 플랫폼 도메인
```

**보안 강점**:
- ✅ 짧은 Access Token 만료 시간 (15분) - 탈취 시 피해 최소화
- ✅ Refresh Token 회전 (Rotation) - 재사용 방지
- ✅ Redis 기반 Refresh Token 저장 (분산 환경 지원)
- ✅ JTI (JWT ID) 사용 - 토큰 추적 및 무효화 가능
- ✅ In-memory fallback (Redis 미사용 시)

**코드 예시**:
```javascript
export async function issueTokens(user) {
    const jti = 'r_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    
    const accessPayload = {
        sub: String(user.id),
        role: user.role,
        typ: 'access',
        iat: now,
        iss: process.env.JWT_ISSUER || 'community-platform',
        aud: process.env.JWT_AUDIENCE || 'community-platform-users'
    };
    
    // Access Token: 15분, Refresh Token: 14일
    const access = jwt.sign(accessPayload, SECRET, {
        algorithm: 'HS256',
        expiresIn: ACCESS_TTL_SEC
    });
}
```

**개선 필요 사항**:
- ⚠️ JWT_SECRET이 환경 변수로 설정되지 않을 경우 기본값 사용 (보안 위험)
- ⚠️ 토큰 블랙리스트 기능 없음 (강제 로그아웃 어려움)

---

#### ✅ Firebase 인증 (프론트엔드)
**구현 파일**: `frontend/src/services/AuthService.ts`

**핵심 기능**:
```typescript
- 익명 로그인 (signInAnonymously)
- Google OAuth 로그인 (signInWithPopup)
- 인증 상태 관리 (onAuthStateChanged)
- 프로필 업데이트 (updateProfile)
```

**보안 강점**:
- ✅ Firebase SDK 활용 - 검증된 인증 프로토콜
- ✅ 싱글톤 패턴 - 인스턴스 중복 방지
- ✅ 리스너 기반 상태 관리 - 실시간 인증 상태 동기화

**개선 필요 사항**:
- ⚠️ Firebase API Key가 하드코딩되어 있음 (환경 변수 권장)
- ⚠️ 에러 처리 개선 필요 (사용자 친화적 메시지)

---

#### ✅ 역할 기반 접근 제어 (RBAC)
**구현 파일**: `server-backend/src/middleware/security.js`, `server-backend/api-server/middleware/advancedSecurity.js`

**역할 종류**:
```javascript
- admin: 모든 권한
- moderator: 콘텐츠 관리 권한
- user: 기본 사용자 권한
```

**코드 예시**:
```javascript
// security.js
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

// advancedSecurity.js
roleBasedAccess(roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: '인증이 필요합니다.' });
        }
        if (!roles.includes(req.user.role)) {
            this.logSuspiciousActivity(req, 'UNAUTHORIZED_ACCESS');
            return res.status(403).json({ error: '접근 권한이 없습니다.' });
        }
        next();
    };
}
```

**보안 강점**:
- ✅ 미들웨어 기반 권한 검증 - 코드 재사용성 높음
- ✅ 의심스러운 활동 로깅 - 보안 모니터링 가능

---

### 1.2 입력 검증 및 XSS/SQL 인젝션 방지

#### ✅ 입력 검증 (Input Validation)
**구현 파일**: `server-backend/src/middleware/security.js`, `server-backend/api-server/middleware/advancedSecurity.js`

**검증 라이브러리**: `express-validator`

**검증 규칙**:
```javascript
// 이메일 검증
body('email').isEmail().normalizeEmail()

// 비밀번호 검증
body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    
// 사용자명 검증
body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)

// 게시물 제목 검증
body('title')
    .isLength({ min: 1, max: 200 })
    .escape()

// 콘텐츠 검증
body('content')
    .isLength({ min: 1, max: 10000 })
    .escape()
```

**보안 강점**:
- ✅ 화이트리스트 기반 검증 - 안전한 문자만 허용
- ✅ 길이 제한 - DoS 공격 방지
- ✅ HTML 이스케이프 - XSS 공격 차단

---

#### ✅ XSS 방어
**구현 파일**: `server-backend/src/middleware/security.js`

**방어 메커니즘**:
```javascript
// XSS 라이브러리 사용
const xss = require('xss');

const xssProtection = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    next();
};

const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
        return xss(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }
    return obj;
};
```

**보안 강점**:
- ✅ 재귀적 객체 정제 - 중첩된 데이터 보호
- ✅ 모든 입력 포인트 보호 (body, query)

---

#### ✅ SQL 인젝션 방어
**구현 파일**: `server-backend/src/middleware/security.js`, `server-backend/api-server/middleware/advancedSecurity.js`

**방어 메커니즘**:
```javascript
// MongoDB 전용: express-mongo-sanitize
const mongoSanitize = require('express-mongo-sanitize');
const sqlInjectionProtection = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`SQL injection attempt detected: ${key} in ${req.originalUrl}`);
    }
});

// 패턴 기반 감지 (advancedSecurity.js)
const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
    /(\b(OR|AND)\s+['"]\s*LIKE\s*['"])/gi,
    // ... 더 많은 패턴
];
```

**보안 강점**:
- ✅ 다층 방어 (MongoDB Sanitize + 패턴 감지)
- ✅ 의심스러운 입력 로깅
- ✅ 특수문자 치환 방식 - 무해화

---

### 1.3 Rate Limiting (속도 제한)

#### ✅ 엔드포인트별 Rate Limiting
**구현 파일**: `server-backend/src/middleware/security.js`, `server-backend/api-server/middleware/advancedSecurity.js`

**Rate Limit 설정**:
```javascript
// security.js
const securityRateLimits = {
    // 일반 API: 15분에 1000 요청
    api: rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }),
    
    // 인증: 15분에 5회 시도
    auth: rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }),
    
    // 비밀번호 재설정: 1시간에 3회
    passwordReset: rateLimit({ windowMs: 60 * 60 * 1000, max: 3 }),
    
    // 파일 업로드: 1시간에 50회
    upload: rateLimit({ windowMs: 60 * 60 * 1000, max: 50 }),
    
    // TODO 작업: 15분에 500회
    todo: rateLimit({ windowMs: 15 * 60 * 1000, max: 500 })
};

// advancedSecurity.js
getRateLimitConfig() {
    return rateLimit({
        windowMs: 15 * 60 * 1000, // 15분
        max: 100, // 최대 100 요청
        handler: (req, res) => {
            this.logSuspiciousActivity(req, 'RATE_LIMIT_EXCEEDED');
            res.status(429).json({
                error: '너무 많은 요청이 발생했습니다.',
                retryAfter: '15분'
            });
        }
    });
}

getStrictRateLimitConfig() {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5, // 로그인/회원가입: 15분에 5회
        skipSuccessfulRequests: true
    });
}
```

**보안 강점**:
- ✅ 엔드포인트별 차별화된 제한
- ✅ 브루트 포스 공격 방지
- ✅ DoS 공격 완화
- ✅ 429 에러 코드 반환 - 표준 준수

---

### 1.4 보안 헤더 (Security Headers)

#### ✅ Helmet.js 기반 보안 헤더
**구현 파일**: `server-backend/src/middleware/security.js`, `server-backend/api-server/middleware/advancedSecurity.js`

**설정된 헤더**:
```javascript
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000, // 1년
        includeSubDomains: true,
        preload: true
    }
});
```

**보안 효과**:
- ✅ CSP (Content Security Policy) - XSS 공격 차단
- ✅ HSTS (HTTP Strict Transport Security) - HTTPS 강제
- ✅ X-Frame-Options - 클릭재킹 방지
- ✅ X-Content-Type-Options - MIME 스니핑 방지

---

### 1.5 CORS (Cross-Origin Resource Sharing)

#### ✅ CORS 정책
**구현 파일**: `server-backend/api-server/middleware/advancedSecurity.js`

**설정**:
```javascript
getCorsConfig() {
    return cors({
        origin: (origin, callback) => {
            const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || 
                ['http://localhost:3000'];
            
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('CORS 정책에 의해 차단되었습니다.'));
            }
        },
        credentials: true,
        optionsSuccessStatus: 200
    });
}
```

**보안 강점**:
- ✅ 화이트리스트 기반 Origin 검증
- ✅ Credentials 지원 (쿠키, 인증 헤더)
- ✅ 환경 변수 기반 설정 - 배포 환경별 관리 용이

---

### 1.6 메시지 암호화

#### ✅ AES-256 암호화
**구현 파일**: `frontend/src/utils/MessageEncryption.ts`

**암호화 메커니즘**:
```typescript
class MessageEncryption {
    private static readonly ALGORITHM = 'AES';
    private static readonly KEY_SIZE = 256;
    private static readonly IV_SIZE = 16;
    
    static encryptMessage(content: string, roomKey: string): EncryptedMessage {
        const iv = CryptoJS.lib.WordArray.random(this.IV_SIZE);
        const messageId = CryptoJS.lib.WordArray.random(8).toString();
        const timestamp = Date.now();
        
        const messageData = JSON.stringify({
            content,
            timestamp,
            messageId
        });
        
        const encrypted = CryptoJS.AES.encrypt(messageData, roomKey, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        
        return {
            encryptedContent: encrypted.toString(),
            iv: iv.toString(),
            timestamp,
            messageId
        };
    }
}
```

**보안 강점**:
- ✅ AES-256-CBC 암호화 - 업계 표준
- ✅ 랜덤 IV 생성 - 동일 메시지도 다른 암호문
- ✅ 메시지 ID 및 타임스탬프 - 재생 공격 방지
- ✅ 채팅방별 암호화 키 - 격리된 보안

**개선 필요 사항**:
- ⚠️ GCM 모드 미사용 (CBC 대신 GCM 권장 - 인증 포함)
- ⚠️ 키 교환 메커니즘 없음 (현재 roomKey 공유 방식 불명확)

---

### 1.7 계정 잠금 및 보안 이벤트 로깅

#### ✅ 계정 잠금 (Account Lockout)
**구현 파일**: `server-backend/src/middleware/security.js`

**메커니즘**:
```javascript
const SECURITY_CONFIG = {
    MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    LOCKOUT_TIME: parseInt(process.env.LOCKOUT_TIME) || 15 * 60 * 1000 // 15분
};

const failedLoginAttempts = new Map();

const trackFailedAttempts = (identifier) => {
    const attempts = failedLoginAttempts.get(identifier) || { count: 0, lockedUntil: null };
    
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
        return { locked: true, remainingTime: attempts.lockedUntil - Date.now() };
    }
    
    attempts.count++;
    
    if (attempts.count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
        attempts.lockedUntil = Date.now() + SECURITY_CONFIG.LOCKOUT_TIME;
        attempts.count = 0;
    }
    
    failedLoginAttempts.set(identifier, attempts);
    
    return { locked: false, remainingAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - attempts.count };
};
```

**보안 강점**:
- ✅ 5회 실패 후 15분 잠금 - 브루트 포스 방지
- ✅ IP 또는 사용자명 기반 추적
- ✅ 시간 기반 자동 잠금 해제

---

#### ✅ 보안 이벤트 로깅
**구현 파일**: `server-backend/api-server/middleware/advancedSecurity.js`

**로깅 메커니즘**:
```javascript
logSuspiciousActivity(req, activityType) {
    const activity = {
        type: activityType,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date(),
        url: req.originalUrl,
        method: req.method
    };
    
    this.suspiciousActivities.set(Date.now(), activity);
    console.warn('⚠️ Suspicious activity detected:', activity);
}
```

**로깅 이벤트**:
- `RATE_LIMIT_EXCEEDED` - 속도 제한 초과
- `STRICT_RATE_LIMIT_EXCEEDED` - 엄격한 속도 제한 초과
- `INVALID_JWT` - 잘못된 JWT 토큰
- `UNAUTHORIZED_ACCESS` - 권한 없는 접근
- `INVALID_INPUT` - 유효하지 않은 입력
- `SQL_INJECTION_ATTEMPT` - SQL 인젝션 시도

---

## 2. 보안 아키텍처

### 2.1 다층 방어 (Defense in Depth)

```
┌─────────────────────────────────────────────────────────────┐
│                       클라이언트                              │
│  - Firebase Auth (Google OAuth)                             │
│  - MessageEncryption (AES-256-CBC)                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    네트워크 계층                              │
│  - HTTPS/TLS 암호화                                          │
│  - CORS 정책 (Origin 화이트리스트)                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    웹 서버 계층                               │
│  - Helmet.js (CSP, HSTS, X-Frame-Options)                   │
│  - Rate Limiting (엔드포인트별 차별화)                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   애플리케이션 계층                            │
│  - JWT 인증 (15분 Access, 14일 Refresh)                      │
│  - 역할 기반 권한 (Admin, Moderator, User)                    │
│  - 입력 검증 (express-validator)                             │
│  - XSS 방어 (xss 라이브러리)                                  │
│  - SQL 인젝션 방어 (mongo-sanitize, 패턴 감지)                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     데이터 계층                               │
│  - 파라미터화된 쿼리                                           │
│  - 데이터베이스 권한 분리                                      │
│  - 민감 데이터 암호화 (bcrypt 패스워드)                        │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.2 인증 흐름

```
┌──────────┐                 ┌───────────┐                 ┌──────────┐
│ 클라이언트 │                 │ API 서버  │                 │  Redis   │
└─────┬────┘                 └─────┬─────┘                 └─────┬────┘
      │                            │                              │
      │ 1. POST /api/auth/login    │                              │
      │ (email, password)          │                              │
      ├───────────────────────────>│                              │
      │                            │                              │
      │                            │ 2. 사용자 검증 (DB)           │
      │                            │                              │
      │                            │ 3. JWT 생성                  │
      │                            │ (Access: 15m, Refresh: 14d)  │
      │                            │                              │
      │                            │ 4. Refresh Token 저장        │
      │                            ├─────────────────────────────>│
      │                            │                              │
      │ 5. { access, refresh }     │                              │
      │<───────────────────────────┤                              │
      │                            │                              │
      │ 6. API 요청                │                              │
      │ (Authorization: Bearer     │                              │
      │  <access_token>)           │                              │
      ├───────────────────────────>│                              │
      │                            │                              │
      │                            │ 7. JWT 검증                  │
      │                            │                              │
      │ 8. 응답                    │                              │
      │<───────────────────────────┤                              │
      │                            │                              │
      │ 9. Access Token 만료 후    │                              │
      │ POST /api/auth/refresh     │                              │
      │ (refresh_token)            │                              │
      ├───────────────────────────>│                              │
      │                            │                              │
      │                            │ 10. Refresh Token 검증       │
      │                            ├─────────────────────────────>│
      │                            │                              │
      │                            │ 11. 새로운 토큰 쌍 발급      │
      │                            │                              │
      │ 12. { access, refresh }    │                              │
      │<───────────────────────────┤                              │
      │                            │                              │
```

---

## 3. 취약점 분석 및 개선 계획

### 3.1 현재 취약점 (Priority: High)

#### 🔴 1. JWT Secret 관리
**현재 상태**:
```javascript
const SECRET = process.env.JWT_SECRET || 'dev_insecure_secret_change_me';
```

**문제점**:
- 환경 변수 미설정 시 기본값 사용
- 소스 코드에 노출

**개선 계획** (Priority: P0):
- [ ] 환경 변수 필수화 (JWT_SECRET 없으면 서버 시작 실패)
- [ ] Secret 강도 검증 (최소 32자, 복잡도 체크)
- [ ] Secret 주기적 회전 메커니즘 추가
- [ ] AWS Secrets Manager 또는 Vault 연동

**예상 일정**: 1주일

---

#### 🔴 2. Firebase API Key 노출
**현재 상태**:
```typescript
const firebaseConfig = {
    apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // 하드코딩
    authDomain: "thenewspaper-platform.firebaseapp.com",
    // ...
};
```

**문제점**:
- 클라이언트 코드에 API Key 하드코딩
- Git 저장소에 노출

**개선 계획** (Priority: P0):
- [ ] `.env` 파일로 이동 (Vite: `VITE_FIREBASE_API_KEY`)
- [ ] Firebase Security Rules 강화
- [ ] `.gitignore`에 `.env` 추가 확인
- [ ] CI/CD 파이프라인에서 환경 변수 주입

**예상 일정**: 2일

---

#### 🔴 3. 토큰 블랙리스트 부재
**현재 상태**:
- 강제 로그아웃 불가능
- 탈취된 토큰 무효화 불가능

**개선 계획** (Priority: P1):
- [ ] Redis 기반 블랙리스트 구현
- [ ] 로그아웃 시 Refresh Token 삭제 + Access Token 블랙리스트 추가
- [ ] 블랙리스트 TTL 설정 (Access Token 만료 시간만큼)
- [ ] 블랙리스트 체크 미들웨어 추가

**예상 일정**: 3일

---

#### 🟡 4. 메시지 암호화 취약점
**현재 상태**:
- AES-CBC 모드 사용 (인증 미포함)
- 키 교환 메커니즘 불명확

**개선 계획** (Priority: P1):
- [ ] AES-GCM 모드로 변경 (인증 포함)
- [ ] Diffie-Hellman 키 교환 구현
- [ ] End-to-End Encryption 명확화
- [ ] 암호화된 메시지 무결성 검증

**예상 일정**: 1주일

---

#### 🟡 5. CSRF 토큰 검증 불완전
**현재 상태**:
```javascript
const csrfProtection = (req, res, next) => {
    if (req.method === 'GET') {
        return next(); // GET 요청 제외
    }
    const csrfToken = req.headers['x-csrf-token'];
    const sessionToken = req.session?.csrfToken;
    
    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next();
};
```

**문제점**:
- CSRF 토큰 생성 로직 누락
- 세션 기반 검증만 있음 (JWT 사용 시 세션 없을 수 있음)

**개선 계획** (Priority: P2):
- [ ] CSRF 토큰 생성 엔드포인트 추가 (`GET /api/csrf-token`)
- [ ] SameSite 쿠키 속성 활용 (JWT 사용 시)
- [ ] Double Submit Cookie 패턴 구현
- [ ] CSRF 토큰 검증 테스트 추가

**예상 일정**: 3일

---

### 3.2 권장 개선 사항 (Priority: Medium)

#### 🟢 6. 2FA (Two-Factor Authentication)
**현재 상태**: 미구현

**개선 계획** (Priority: P2):
- [ ] TOTP (Time-based One-Time Password) 구현
- [ ] QR 코드 생성 (Google Authenticator 연동)
- [ ] 백업 코드 생성
- [ ] 2FA 필수화 옵션 (관리자 계정)

**예상 일정**: 2주

---

#### 🟢 7. 비밀번호 정책 강화
**현재 상태**:
```javascript
body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
```

**개선 계획** (Priority: P2):
- [ ] 최소 길이 10자로 증가
- [ ] 비밀번호 이력 저장 (최근 5개 재사용 방지)
- [ ] 일반적인 비밀번호 블랙리스트 (rockyou.txt 등)
- [ ] 비밀번호 강도 점수 표시 (zxcvbn 라이브러리)

**예상 일정**: 1주일

---

#### 🟢 8. 보안 감사 로그 (Audit Log)
**현재 상태**: 콘솔 로그만 있음

**개선 계획** (Priority: P2):
- [ ] 데이터베이스 기반 감사 로그 테이블
- [ ] 로그 필드: 사용자 ID, IP, User-Agent, 행위, 타임스탬프, 결과
- [ ] 로그 검색 및 필터링 API
- [ ] 관리자 대시보드에서 로그 조회

**예상 일정**: 1주일

---

#### 🟢 9. IP 화이트리스트/블랙리스트
**현재 상태**: 미구현

**개선 계획** (Priority: P3):
- [ ] IP 기반 접근 제어 미들웨어
- [ ] 관리자 페이지 IP 화이트리스트
- [ ] 악의적 IP 자동 블랙리스트 (5분 내 10회 실패 시)
- [ ] GeoIP 기반 국가별 차단

**예상 일정**: 3일

---

#### 🟢 10. 파일 업로드 보안
**현재 상태**: 업로드 로직 확인 필요

**개선 계획** (Priority: P2):
- [ ] 파일 타입 검증 (Magic Number 체크)
- [ ] 파일 크기 제한 (최대 10MB)
- [ ] 바이러스 스캔 (ClamAV 연동)
- [ ] 업로드된 파일 격리 저장 (CDN 또는 S3)
- [ ] 파일명 무작위화

**예상 일정**: 1주일

---

### 3.3 장기 개선 계획 (Priority: Low)

#### 🔵 11. 웹 애플리케이션 방화벽 (WAF)
**계획**:
- [ ] AWS WAF 또는 Cloudflare 연동
- [ ] OWASP Top 10 룰셋 적용
- [ ] DDoS 방어 설정

**예상 일정**: 2주

---

#### 🔵 12. 침투 테스트 (Penetration Testing)
**계획**:
- [ ] OWASP ZAP 자동화 스캔
- [ ] 외부 보안 업체 컨설팅
- [ ] 버그 바운티 프로그램 운영

**예상 일정**: 진행 중 (연중)

---

#### 🔵 13. 보안 헤더 강화
**계획**:
- [ ] Permissions-Policy 추가
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Expect-CT 헤더

**예상 일정**: 1일

---

## 4. 보안 로드맵

### Phase 1: 긴급 보안 강화 (1-2주)
**목표**: 치명적 취약점 제거

- [x] JWT 인증 시스템 구현
- [x] Rate Limiting 적용
- [x] XSS/SQL 인젝션 방어
- [ ] JWT Secret 환경 변수 필수화
- [ ] Firebase API Key 환경 변수 이동
- [ ] 토큰 블랙리스트 구현

---

### Phase 2: 보안 기능 확장 (3-4주)
**목표**: 추가 보안 계층 구축

- [ ] 메시지 암호화 강화 (AES-GCM)
- [ ] CSRF 토큰 완전 구현
- [ ] 2FA (Two-Factor Authentication)
- [ ] 비밀번호 정책 강화
- [ ] 보안 감사 로그

---

### Phase 3: 인프라 보안 (5-8주)
**목표**: 네트워크 및 인프라 보안

- [ ] WAF 연동 (AWS WAF 또는 Cloudflare)
- [ ] DDoS 방어 설정
- [ ] IP 화이트리스트/블랙리스트
- [ ] 파일 업로드 보안 강화

---

### Phase 4: 지속적인 보안 개선 (진행 중)
**목표**: 보안 모니터링 및 개선

- [ ] 자동화된 보안 스캔 (OWASP ZAP)
- [ ] 침투 테스트 정기 실시
- [ ] 보안 교육 및 가이드라인 문서화
- [ ] 버그 바운티 프로그램

---

## 5. 보안 체크리스트

### 개발자 체크리스트
- [ ] 모든 환경 변수 `.env`에서 관리 (`JWT_SECRET`, `FIREBASE_API_KEY`)
- [ ] `.env` 파일 `.gitignore`에 포함
- [ ] 비밀번호 bcrypt로 해싱 (salt rounds: 12)
- [ ] API 엔드포인트에 인증 미들웨어 적용
- [ ] 민감한 데이터 클라이언트 로그 금지
- [ ] SQL 쿼리 파라미터화 (Prepared Statements)
- [ ] 파일 업로드 시 타입 및 크기 검증

---

### 운영 체크리스트
- [ ] HTTPS 강제 적용 (HSTS 헤더)
- [ ] 방화벽 설정 (불필요한 포트 차단)
- [ ] 정기적인 보안 패치 적용
- [ ] 데이터베이스 백업 암호화
- [ ] 로그 파일 보안 저장
- [ ] 비상 대응 절차 문서화

---

## 6. 참고 자료

### 보안 표준
- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE Top 25](https://cwe.mitre.org/top25/)

### 라이브러리 문서
- [express-validator](https://express-validator.github.io/docs/)
- [helmet.js](https://helmetjs.github.io/)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)

---

**문서 작성자**: AUTOAGENTS  
**검토자**: -  
**다음 검토 예정일**: 2025년 2월 9일
