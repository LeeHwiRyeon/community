# CSRF 토큰 구현 완료 보고서
**날짜**: 2025년 11월 9일  
**버전**: v1.0.0  
**우선순위**: 🔴 Critical

---

## 📋 구현 요약

CSRF(Cross-Site Request Forgery) 공격을 방지하기 위한 완전한 토큰 시스템을 구현했습니다.

### ✅ 완료된 작업

#### 1. **백엔드 - CSRF 유틸리티** (`server-backend/src/utils/csrf.js`)
**주요 기능**:
- ✅ 암호학적으로 안전한 토큰 생성 (32 bytes)
- ✅ Double Submit Cookie 패턴 구현
- ✅ 토큰 검증 (헤더, 쿠키, 세션 3중 확인)
- ✅ 토큰 자동 갱신 (만료 임박 시)
- ✅ 토큰 만료 시간 관리 (1시간)

**API**:
```javascript
// 토큰 생성
const token = generateCSRFToken(req, res);

// 토큰 검증
const validation = validateCSRFToken(req);
if (!validation.valid) {
    // 검증 실패 처리
}

// 토큰 갱신
const newToken = refreshCSRFToken(req, res);

// 토큰 정보 조회
const info = getCSRFTokenInfo(req);
```

#### 2. **백엔드 - CSRF 미들웨어** (`server-backend/src/middleware/csrf.js`)
**주요 기능**:
- ✅ CSRF 보호 미들웨어
- ✅ Safe 메서드 자동 제외 (GET, HEAD, OPTIONS)
- ✅ 예외 경로 설정 (웹훅, 공개 API)
- ✅ 자동 토큰 갱신 (80% 경과 시)
- ✅ 검증 실패 시 재시도 로직
- ✅ 통계 수집 기능

**사용 예시**:
```javascript
// 기본 사용
app.use(csrfProtection());

// 커스텀 설정
app.use(csrfProtection({
    autoRefresh: true,
    refreshThreshold: 0.8,
    onValidationFailed: (req, error) => {
        logger.warn(`CSRF failed: ${error}`);
    }
}));

// 조건부 적용
app.use(conditionalCSRFProtection(
    (req) => req.isAuthenticated()
));
```

#### 3. **백엔드 - 인증 엔드포인트 통합** (`server-backend/routes/auth.js`)
**추가된 엔드포인트**:

**3-1. CSRF 토큰 발급**
```javascript
GET /api/auth/csrf-token
Response: { success: true, data: { csrfToken: "..." } }
```

**3-2. CSRF 토큰 갱신**
```javascript
POST /api/auth/csrf-refresh
Response: { success: true, csrfToken: "..." }
```

**3-3. CSRF 토큰 정보**
```javascript
GET /api/auth/csrf-info
Response: {
    csrf: {
        exists: true,
        createdAt: 1699500000000,
        expiresAt: 1699503600000,
        remainingTime: 3600000,
        isExpiring: false,
        headerName: "x-csrf-token"
    }
}
```

**수정된 엔드포인트**:
- ✅ `POST /api/auth/login` - 로그인 시 CSRF 토큰 자동 발급
- ✅ `POST /api/auth/register` - 회원가입 시 CSRF 토큰 자동 발급
- ✅ `POST /api/auth/logout` - 로그아웃 시 CSRF 토큰 제거

#### 4. **백엔드 - 서버 통합** (`server-backend/src/server.js`)
**추가된 설정**:
- ✅ `express-session` 미들웨어 설정
- ✅ `cookie-parser` 미들웨어 추가
- ✅ CORS에 `X-CSRF-Token` 헤더 허용
- ✅ CSRF 미들웨어 보안 체인에 통합

**세션 설정**:
```javascript
app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60 * 60 * 1000, // 1시간
        sameSite: 'strict'
    }
}));
```

#### 5. **프론트엔드 - API 클라이언트** (`frontend/src/utils/apiClient.ts`)
**주요 기능**:
- ✅ CSRF 토큰 자동 관리
- ✅ 토큰 자동 가져오기 (첫 요청 시)
- ✅ 모든 POST/PUT/DELETE 요청에 토큰 자동 첨부
- ✅ 403 오류 시 토큰 갱신 및 재시도
- ✅ 서버에서 갱신된 토큰 자동 업데이트

**API**:
```typescript
// 초기화 (앱 시작 시)
await initCSRFToken();

// 토큰 설정 (로그인 시)
setCSRFToken(token);

// 토큰 제거 (로그아웃 시)
clearCSRFToken();

// 자동 처리 (사용자는 신경 쓸 필요 없음)
await apiClient.post('/api/data', { ... });
```

**자동 처리 흐름**:
1. POST/PUT/DELETE 요청 시 CSRF 토큰 자동 첨부
2. 토큰이 없으면 자동으로 가져오기
3. 검증 실패 시 자동 갱신 및 재시도
4. 서버에서 갱신한 토큰 자동 업데이트

#### 6. **프론트엔드 - 인증 API 서비스** (`frontend/src/services/authApiService.ts`)
**주요 기능**:
- ✅ 로그인 API (`login`)
- ✅ 회원가입 API (`register`)
- ✅ 로그아웃 API (`logout`)
- ✅ 토큰 검증 API (`verifyToken`)
- ✅ CSRF 토큰 수동 갱신 (`refreshCSRF`)

**사용 예시**:
```typescript
import { authApiService } from './services/authApiService';

// 로그인
const response = await authApiService.login({
    email: 'user@example.com',
    password: 'password123'
});

// 회원가입
await authApiService.register({
    email: 'new@example.com',
    password: 'pass123',
    username: 'newuser'
});

// 로그아웃
await authApiService.logout();
```

---

## 🔐 보안 강화 상세

### 1. Double Submit Cookie 패턴

**구현 방식**:
1. 서버가 CSRF 토큰 생성
2. 세션에 저장 (서버 측)
3. 쿠키에 저장 (클라이언트 측)
4. 응답 바디에 포함 (클라이언트 메모리 저장)

**검증 방식**:
- 헤더 토큰 (`x-csrf-token`)
- 쿠키 토큰 (`csrf_token`)
- 세션 토큰 (`req.session.csrfToken`)
- **3개 모두 일치해야 통과**

**장점**:
- ✅ 동일 출처 정책 활용
- ✅ 쿠키 탈취만으로는 공격 불가
- ✅ 세션 탈취만으로도 공격 불가

### 2. 토큰 만료 및 갱신

**만료 시간**: 1시간

**자동 갱신**:
- 토큰 80% 경과 시 자동 갱신
- 서버가 응답 헤더에 새 토큰 포함
- 클라이언트가 자동으로 업데이트

**만료 확인**:
```javascript
if (isTokenExpiring(req, 0.8)) {
    const newToken = refreshCSRFToken(req, res);
    res.setHeader('X-CSRF-Token-Refreshed', newToken);
}
```

### 3. 예외 처리

**CSRF 검증 제외 대상**:
- Safe 메서드: `GET`, `HEAD`, `OPTIONS`
- 예외 경로:
  - `/api/webhooks/*` (외부 서비스 콜백)
  - `/api/public/*` (공개 API)
  - `/health`, `/api/health` (헬스 체크)
  - `/api/auth/csrf-token` (토큰 발급 엔드포인트)

### 4. 에러 처리

**검증 실패 시**:
1. 403 Forbidden 응답
2. 에러 코드 반환 (`CSRF_VALIDATION_FAILED`)
3. 로깅 (보안 모니터링)
4. 클라이언트 자동 재시도 (토큰 갱신 후)

**재시도 흐름**:
```typescript
// 1차 시도
POST /api/data (with CSRF token)
↓
403 CSRF_VALIDATION_FAILED
↓
// 토큰 갱신
POST /api/auth/csrf-refresh
↓
// 2차 시도
POST /api/data (with new CSRF token)
↓
200 OK
```

---

## 📊 구현 파일 목록

### 백엔드 (3개)
1. `server-backend/src/utils/csrf.js` (363 lines)
   - 토큰 생성, 검증, 갱신 유틸리티
   
2. `server-backend/src/middleware/csrf.js` (366 lines)
   - CSRF 보호 미들웨어
   - 조건부 적용, 통계 수집
   
3. `server-backend/routes/auth.js` (수정)
   - CSRF 토큰 발급/갱신 엔드포인트 추가
   - 로그인/회원가입 시 토큰 자동 발급

### 프론트엔드 (2개)
1. `frontend/src/utils/apiClient.ts` (수정)
   - CSRF 토큰 자동 관리
   - 자동 가져오기, 갱신, 재시도
   
2. `frontend/src/services/authApiService.ts` (233 lines)
   - 인증 API 래퍼
   - CSRF 토큰 자동 처리

### 설정 (1개)
1. `server-backend/src/server.js` (수정)
   - 세션, 쿠키 파서 추가
   - CSRF 미들웨어 통합
   - CORS 헤더 설정

**총 라인 수**: ~1,200 lines (신규 + 수정)

---

## 🛠️ 사용 가이드

### 백엔드 설정

**1. 환경 변수 설정** (`.env`)
```bash
# 세션 시크릿 (선택)
SESSION_SECRET=your-secure-session-secret

# JWT 시크릿 (필수 - 세션 시크릿 대체 가능)
JWT_SECRET=your-jwt-secret

# 환경
NODE_ENV=production
```

**2. 서버 실행**
```bash
cd server-backend
npm install
npm start
```

**3. CSRF 엔드포인트 테스트**
```bash
# 토큰 발급
curl http://localhost:50000/api/auth/csrf-token

# 토큰 정보
curl http://localhost:50000/api/auth/csrf-info
```

### 프론트엔드 통합

**1. 앱 초기화 시 CSRF 토큰 가져오기**
```typescript
import { initCSRFToken } from './utils/apiClient';

// App.tsx 또는 main.tsx
useEffect(() => {
    initCSRFToken();
}, []);
```

**2. 로그인 시 자동 처리**
```typescript
import { authApiService } from './services/authApiService';

const handleLogin = async (email: string, password: string) => {
    try {
        const response = await authApiService.login({ email, password });
        // CSRF 토큰 자동 저장됨
        console.log('Logged in:', response.data.user);
    } catch (error) {
        console.error('Login failed:', error);
    }
};
```

**3. API 요청 시 자동 처리**
```typescript
import { apiClient } from './utils/apiClient';

// CSRF 토큰 자동 첨부
const createPost = async (data: any) => {
    return await apiClient.post('/api/posts', data);
    // 내부적으로 x-csrf-token 헤더 자동 추가
};
```

### React 컴포넌트 예시

```typescript
import React, { useState } from 'react';
import { authApiService } from '../services/authApiService';

export const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await authApiService.login({ email, password });
            
            // 성공
            console.log('✅ Login successful:', response.data.user);
            // 리다이렉트 또는 상태 업데이트
        } catch (err: any) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
            />
            {error && <div className="error">{error}</div>}
            <button type="submit">Login</button>
        </form>
    );
};
```

---

## 🔍 테스트 가이드

### 1. 수동 테스트

**토큰 발급 테스트**:
```bash
# 1. CSRF 토큰 가져오기
curl -c cookies.txt http://localhost:50000/api/auth/csrf-token

# 2. 응답 확인
{
  "success": true,
  "data": {
    "csrfToken": "abc123..."
  }
}
```

**토큰 검증 테스트**:
```bash
# 1. 토큰 없이 POST 요청 (실패해야 함)
curl -X POST http://localhost:50000/api/posts \
     -H "Content-Type: application/json" \
     -d '{"title": "Test"}'

# 응답: 403 CSRF validation failed

# 2. 토큰 포함 POST 요청 (성공해야 함)
curl -X POST http://localhost:50000/api/posts \
     -H "Content-Type: application/json" \
     -H "x-csrf-token: abc123..." \
     -b cookies.txt \
     -d '{"title": "Test"}'

# 응답: 200 OK
```

### 2. 자동 테스트

**Jest 테스트 예시**:
```javascript
describe('CSRF Protection', () => {
    let csrfToken;

    beforeAll(async () => {
        // 토큰 가져오기
        const response = await request(app)
            .get('/api/auth/csrf-token');
        csrfToken = response.body.data.csrfToken;
    });

    test('POST without CSRF token should fail', async () => {
        const response = await request(app)
            .post('/api/posts')
            .send({ title: 'Test' });
        
        expect(response.status).toBe(403);
        expect(response.body.code).toBe('CSRF_VALIDATION_FAILED');
    });

    test('POST with CSRF token should succeed', async () => {
        const response = await request(app)
            .post('/api/posts')
            .set('x-csrf-token', csrfToken)
            .send({ title: 'Test' });
        
        expect(response.status).toBe(200);
    });

    test('GET should not require CSRF token', async () => {
        const response = await request(app)
            .get('/api/posts');
        
        expect(response.status).toBe(200);
    });
});
```

---

## ⚠️ 주의사항

### 1. 쿠키 설정

**프로덕션 환경**:
```javascript
cookie: {
    secure: true,      // HTTPS에서만
    httpOnly: true,    // JavaScript 접근 불가
    sameSite: 'strict' // CSRF 추가 방어
}
```

**개발 환경**:
```javascript
cookie: {
    secure: false,     // HTTP 허용
    httpOnly: true,
    sameSite: 'lax'    // 개발 편의성
}
```

### 2. CORS 설정

**프론트엔드와 백엔드가 다른 도메인인 경우**:
```javascript
corsOptions: {
    origin: 'https://your-frontend.com',
    credentials: true  // 쿠키 전송 허용
}
```

**프론트엔드에서**:
```typescript
fetch(url, {
    credentials: 'include'  // 쿠키 포함
});
```

### 3. 세션 스토어

**현재 구현**: 메모리 스토어 (개발용)

**프로덕션 권장**: Redis 세션 스토어
```javascript
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient();
redisClient.connect();

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    // ... 기타 옵션
}));
```

### 4. 토큰 저장

**절대 하지 말 것** ❌:
```typescript
// ❌ LocalStorage에 저장
localStorage.setItem('csrfToken', token);

// ❌ 전역 변수로 노출
window.csrfToken = token;
```

**권장 방법** ✅:
```typescript
// ✅ 모듈 스코프 변수 (메모리)
let csrfToken: string | null = null;

// ✅ apiClient에서 자동 관리
// 사용자는 신경 쓸 필요 없음
```

---

## 📈 다음 단계

### 즉시 가능
- [x] CSRF 토큰 시스템 (완료)
- [x] Double Submit Cookie 패턴 (완료)
- [x] 자동 갱신 (완료)

### 추가 개선 (선택)
- [ ] Redis 세션 스토어 통합
- [ ] CSRF 토큰 통계 대시보드
- [ ] 보안 감사 로그 강화
- [ ] Rate limiting CSRF 엔드포인트
- [ ] Captcha 통합 (무차별 대입 방지)

---

## 📞 문제 해결

### FAQ

**Q: "CSRF validation failed" 오류가 계속 발생합니다**
```
A: 다음을 확인하세요:
   1. 쿠키가 전송되는지 (credentials: 'include')
   2. 헤더 이름이 정확한지 (x-csrf-token)
   3. 세션이 유지되는지 (세션 쿠키 확인)
   4. CORS 설정이 올바른지
```

**Q: 로그인 후에도 토큰이 없다고 나옵니다**
```
A: 로그인 응답에서 csrfToken을 setCSRFToken()으로 저장했는지 확인
   authApiService.login()을 사용하면 자동으로 처리됩니다.
```

**Q: 개발 환경에서 쿠키가 작동하지 않습니다**
```
A: 쿠키 설정에서 secure: false로 설정하세요.
   또는 sameSite: 'lax'로 변경하세요.
```

**Q: 토큰이 너무 자주 만료됩니다**
```
A: csrf.js에서 TOKEN_EXPIRY를 조정하세요.
   현재 기본값: 1시간 (3600000ms)
```

---

## 📝 변경 이력

| 날짜       | 버전   | 변경 내용                  |
| ---------- | ------ | -------------------------- |
| 2025-11-09 | v1.0.0 | CSRF 토큰 시스템 완전 구현 |

---

**작성자**: AUTOAGENTS System  
**검토자**: Required (보안팀 확인 필요)  
**배포 상태**: ✅ 개발 환경 적용 완료, ⏳ 프로덕션 배포 대기

---

## 🎯 핵심 요약

### 보안 강화
- ✅ CSRF 공격 방지 (Double Submit Cookie)
- ✅ 토큰 자동 갱신 (만료 임박 시)
- ✅ 3중 검증 (헤더, 쿠키, 세션)

### 개발자 경험
- ✅ 자동 처리 (사용자 신경 쓸 필요 없음)
- ✅ 자동 재시도 (검증 실패 시)
- ✅ 완전한 TypeScript 지원

### 프로덕션 준비
- ✅ 에러 처리 완비
- ✅ 로깅 및 모니터링
- ✅ 성능 최적화 (중복 요청 방지)
