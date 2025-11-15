# 🔐 보안 기능 구현 가이드

**버전**: 1.0  
**최종 업데이트**: 2025년 11월 9일  
**대상**: Backend/Frontend 개발자

---

## 📋 목차

1. [JWT 인증 시스템](#1-jwt-인증-시스템)
2. [토큰 블랙리스트](#2-토큰-블랙리스트)
3. [AES-GCM 암호화](#3-aes-gcm-암호화)
4. [CSRF 보호](#4-csrf-보호)
5. [보안 모범 사례](#5-보안-모범-사례)
6. [트러블슈팅](#6-트러블슈팅)

---

## 1. JWT 인증 시스템

### 1.1 개요

Community Platform은 RS256 알고리즘을 사용한 비대칭 JWT 인증을 구현합니다.

**구성 요소**:
- Access Token: 15분 유효기간
- Refresh Token: 14일 유효기간
- JTI (JWT ID): UUID v4

### 1.2 환경 변수 설정

**필수 환경 변수**:
```bash
# JWT Secrets (최소 32자)
JWT_ACCESS_SECRET=your_64_byte_base64_encoded_secret_here
JWT_REFRESH_SECRET=your_64_byte_base64_encoded_secret_here

# JWT 설정
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=14d
JWT_ISSUER=community-platform
```

**Secret 생성**:
```bash
cd server-backend
node scripts/generate-jwt-secret.js
```

### 1.3 백엔드 사용법

**토큰 생성**:
```javascript
const jwt = require('./auth/jwt');

// Access Token 생성
const accessToken = jwt.generateAccessToken({
    userId: user.id,
    username: user.username,
    role: user.role
});

// Refresh Token 생성
const refreshToken = jwt.generateRefreshToken({
    userId: user.id
});
```

**토큰 검증**:
```javascript
const jwt = require('./auth/jwt');

try {
    const payload = jwt.verifyAccessToken(token);
    console.log('User ID:', payload.userId);
} catch (error) {
    console.error('Token invalid:', error.message);
}
```

**미들웨어 적용**:
```javascript
const { authenticateJWT } = require('./middleware/security');

// 보호된 라우트
router.get('/api/profile', authenticateJWT, (req, res) => {
    res.json({ user: req.user });
});
```

### 1.4 프론트엔드 사용법

**토큰 저장**:
```typescript
// authApiService.ts
export function saveTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
}
```

**자동 Authorization 헤더**:
```typescript
// apiClient.ts
const accessToken = getAccessToken();
headers: {
    'Authorization': `Bearer ${accessToken}`,
    ...config?.headers,
}
```

**토큰 갱신**:
```typescript
// authApiService.ts
export async function refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await apiClient.post('/api/auth/refresh', {
        refresh: refreshToken
    });
    const { access: newAccessToken } = response.data;
    localStorage.setItem('access_token', newAccessToken);
    return newAccessToken;
}
```

---

## 2. 토큰 블랙리스트

### 2.1 개요

로그아웃된 토큰을 즉시 무효화하는 Redis 기반 블랙리스트 시스템입니다.

**특징**:
- Redis 우선, In-memory 폴백
- Access Token & Refresh Token 지원
- 자동 TTL 관리
- 강제 로그아웃 지원

### 2.2 Redis 설정

**환경 변수**:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password  # 선택
REDIS_DB=0
```

**Redis 스키마**:
```
Key: blacklist:access:{jti}
Value: {
    "userId": "123",
    "reason": "user_logout",
    "tokenExp": 1699999999,
    "blacklistedAt": 1699990000
}
TTL: tokenExp - currentTime
```

### 2.3 백엔드 사용법

**토큰 블랙리스트 추가**:
```javascript
const tokenBlacklist = require('./services/token-blacklist');

// 로그아웃 시
await tokenBlacklist.addToBlacklist(
    'access',
    jti,
    userId,
    tokenExp,
    'user_logout'
);
```

**블랙리스트 확인**:
```javascript
// JWT 검증 미들웨어에서 자동 확인
const isBlacklisted = await tokenBlacklist.isBlacklisted('access', jti);
if (isBlacklisted) {
    return res.status(401).json({
        code: 'TOKEN_REVOKED',
        message: 'Token has been revoked'
    });
}
```

**강제 로그아웃**:
```javascript
// 관리자용 API
router.post('/api/admin/force-logout', authenticateJWT, async (req, res) => {
    const { userId } = req.body;
    await tokenBlacklist.forceLogoutUser(userId);
    res.json({ message: 'User logged out' });
});
```

### 2.4 프론트엔드 사용법

**로그아웃**:
```typescript
// authApiService.ts
export async function logoutApi(): Promise<void> {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    try {
        if (accessToken) {
            await apiClient.post('/api/auth/logout', {
                refresh: refreshToken
            });
        }
    } catch (error) {
        console.error('Logout API failed:', error);
    } finally {
        clearTokens();
        clearCSRFToken();
    }
}
```

**401 자동 로그아웃**:
```typescript
// apiClient.ts
async function handleUnauthorized(error: any): Promise<void> {
    if (error?.response?.status === 401) {
        let userMessage = '인증이 만료되었습니다. 다시 로그인해 주세요.';
        
        if (errorData.code === 'TOKEN_REVOKED') {
            userMessage = '보안을 위해 로그아웃되었습니다. 다시 로그인해 주세요.';
        }
        
        window.alert(userMessage);
        clearTokens();
        window.location.href = '/login';
    }
}
```

---

## 3. AES-GCM 암호화

### 3.1 개요

채팅 메시지의 End-to-End 암호화를 위한 AES-256-GCM + ECDH P-256 시스템입니다.

**특징**:
- AES-256-GCM (Authenticated Encryption)
- ECDH P-256 키 교환
- Web Crypto API 사용
- 96-bit Nonce, 128-bit Tag

### 3.2 프론트엔드 사용법

**키 교환**:
```typescript
import { KeyExchange } from './utils/KeyExchange';

// ECDH 키 쌍 생성
const keyExchange = new KeyExchange();
await keyExchange.generateKeyPair();

// 공개키 내보내기
const publicKey = await keyExchange.exportPublicKey();

// 상대방 공개키로 공유 비밀 생성
const sharedSecret = await keyExchange.deriveSharedSecret(otherPublicKey);
```

**메시지 암호화**:
```typescript
import { MessageEncryptionV2 } from './utils/MessageEncryptionV2';

// 암호화
const encrypted = await MessageEncryptionV2.encrypt(
    'Hello, World!',
    sharedSecret
);

// encrypted = {
//     ciphertext: 'base64_encrypted_data',
//     iv: 'base64_nonce',
//     tag: 'base64_auth_tag'
// }
```

**메시지 복호화**:
```typescript
import { MessageEncryptionV2 } from './utils/MessageEncryptionV2';

try {
    const decrypted = await MessageEncryptionV2.decrypt(
        encrypted.ciphertext,
        encrypted.iv,
        encrypted.tag,
        sharedSecret
    );
    console.log('Decrypted:', decrypted);
} catch (error) {
    console.error('Decryption failed:', error);
}
```

**EncryptedChatService 사용**:
```typescript
import { EncryptedChatService } from './services/EncryptedChatService';

const chatService = new EncryptedChatService();

// 암호화 활성화
await chatService.enableEncryption(otherUserId, otherPublicKey);

// 메시지 전송
const encryptedMessage = await chatService.encryptMessage('Hello!');

// 메시지 수신
const decryptedMessage = await chatService.decryptMessage(encryptedMessage);
```

### 3.3 UI 통합

**암호화 토글**:
```tsx
// ChatSystem.tsx
<IconButton
    data-testid="encryption-toggle"
    onClick={handleEncryptionToggle}
    color={isEncrypted ? 'success' : 'default'}
>
    {isEncrypted ? <Lock /> : <LockOpen />}
</IconButton>
```

**키 교환 다이얼로그**:
```tsx
<Dialog open={keyExchangeInProgress} data-testid="key-exchange-dialog">
    <DialogTitle>키 교환 중...</DialogTitle>
    <DialogContent>
        <CircularProgress />
        <Typography>안전한 연결을 설정하고 있습니다.</Typography>
    </DialogContent>
</Dialog>
```

---

## 4. CSRF 보호

### 4.1 개요

Double Submit Cookie 패턴을 사용한 CSRF 보호 시스템입니다.

**특징**:
- 1시간 토큰 유효기간
- POST/PUT/DELETE 자동 보호
- 프론트엔드 1시간 캐싱 (5분 버퍼)
- 자동 재시도 로직

### 4.2 백엔드 사용법

**CSRF 미들웨어 적용**:
```javascript
const { validateCSRFToken } = require('./middleware/csrf');

// 보호된 라우트
router.post('/api/posts', authenticateJWT, validateCSRFToken, (req, res) => {
    // POST 요청 처리
});

router.put('/api/posts/:id', authenticateJWT, validateCSRFToken, (req, res) => {
    // PUT 요청 처리
});

router.delete('/api/posts/:id', authenticateJWT, validateCSRFToken, (req, res) => {
    // DELETE 요청 처리
});
```

**CSRF 토큰 발급 API**:
```javascript
// routes/auth.js
router.get('/api/auth/csrf', (req, res) => {
    const token = generateCSRFToken();
    res.cookie('csrf_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000 // 1시간
    });
    res.json({ csrf_token: token });
});
```

### 4.3 프론트엔드 사용법

**자동 CSRF 토큰 관리**:
```typescript
// apiClient.ts
let csrfToken: string | null = null;
let csrfTokenExpiry: number = 0;

async function fetchCSRFToken(): Promise<string> {
    // 캐시 확인
    if (isCSRFTokenValid()) {
        return csrfToken!;
    }

    // 새로 발급
    const response = await fetch(`${API_BASE_URL}/api/auth/csrf`, {
        credentials: 'include'
    });
    const data = await response.json();
    csrfToken = data.csrf_token;
    csrfTokenExpiry = Date.now() + (60 * 60 * 1000); // 1시간
    return csrfToken;
}
```

**POST 요청에 자동 포함**:
```typescript
// apiClient.ts
async post(url: string, data?: any, config?: any) {
    if (!csrfToken) {
        await fetchCSRFToken();
    }

    const response = await fetchWithErrorHandling(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken || '',
            ...config?.headers,
        },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    // CSRF 검증 실패 시 재시도
    if (response.status === 403) {
        await refreshCSRFToken();
        // 재시도 로직...
    }
}
```

**에러 처리**:
```typescript
async function handleCSRFError(error: any): Promise<void> {
    if (error?.response?.status === 403) {
        if (errorData.code === 'CSRF_VALIDATION_FAILED') {
            window.alert('보안 검증에 실패했습니다. 페이지를 새로고침하고 다시 시도해 주세요.');
        }
    }
}
```

---

## 5. 보안 모범 사례

### 5.1 환경 변수 관리

**❌ 하지 말아야 할 것**:
```javascript
// 하드코딩 금지!
const JWT_SECRET = 'my-secret-key';
```

**✅ 올바른 방법**:
```javascript
// 환경 변수 사용
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_ACCESS_SECRET is required');
}
```

### 5.2 토큰 저장

**❌ 하지 말아야 할 것**:
```typescript
// 쿠키에 토큰 저장 금지 (XSS 위험)
document.cookie = `token=${accessToken}`;
```

**✅ 올바른 방법**:
```typescript
// localStorage 사용 (HttpOnly 쿠키는 백엔드에서 관리)
localStorage.setItem('access_token', accessToken);
```

### 5.3 에러 메시지

**❌ 하지 말아야 할 것**:
```javascript
// 상세한 에러 노출 금지
res.status(401).json({
    error: 'Invalid token: signature expired at 2025-11-09 12:34:56'
});
```

**✅ 올바른 방법**:
```javascript
// 일반적인 에러 메시지
res.status(401).json({
    code: 'TOKEN_EXPIRED',
    message: 'Token has expired'
});
```

### 5.4 Rate Limiting

**추천 설정**:
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 5, // 최대 5회
    message: 'Too many login attempts, please try again later'
});

app.post('/api/auth/login', loginLimiter, loginHandler);
```

### 5.5 HTTPS 사용

**프로덕션 필수**:
```javascript
// Helmet.js 설정
const helmet = require('helmet');
app.use(helmet({
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
```

---

## 6. 트러블슈팅

### 6.1 JWT 검증 실패

**증상**: `JsonWebTokenError: invalid signature`

**원인**:
- JWT Secret 불일치
- 환경 변수 미설정

**해결책**:
```bash
# Secret 확인
echo $JWT_ACCESS_SECRET

# Secret 재생성
node scripts/generate-jwt-secret.js

# 환경 변수 설정
export JWT_ACCESS_SECRET=your_secret_here
```

### 6.2 토큰 블랙리스트 동작 안 함

**증상**: 로그아웃 후에도 토큰 사용 가능

**원인**:
- Redis 연결 실패
- In-memory 폴백 미작동

**해결책**:
```bash
# Redis 상태 확인
redis-cli ping

# Redis 로그 확인
tail -f /var/log/redis/redis-server.log

# 블랙리스트 확인
redis-cli KEYS "blacklist:*"
```

### 6.3 CSRF 토큰 검증 실패

**증상**: `CSRF_VALIDATION_FAILED` 에러

**원인**:
- 쿠키와 헤더 토큰 불일치
- 토큰 만료

**해결책**:
```typescript
// 프론트엔드에서 토큰 갱신
await refreshCSRFToken();

// 브라우저 쿠키 확인
console.log(document.cookie);

// 헤더 확인
console.log(request.headers['x-csrf-token']);
```

### 6.4 암호화/복호화 실패

**증상**: `OperationError: Decryption failed`

**원인**:
- 키 불일치
- 데이터 손상
- Nonce/Tag 오류

**해결책**:
```typescript
// 키 교환 재시도
await chatService.resetEncryption();
await chatService.enableEncryption(userId, publicKey);

// 암호화 버전 확인
console.log('Encryption version:', message.version);

// v1 → v2 마이그레이션
const decrypted = await EncryptedChatService.decryptMessage(message);
```

---

## 📚 추가 리소스

- [JWT 공식 문서](https://jwt.io/)
- [OWASP CSRF 가이드](https://owasp.org/www-community/attacks/csrf)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Redis 문서](https://redis.io/documentation)

---

## 📝 관련 문서

- [보안 구현 완료 보고서](./SECURITY_IMPLEMENTATION_COMPLETED_REPORT.md)
- [보안 상세 계획](./SECURITY_DETAILED_PLAN.md)
- [E2E 테스트 가이드](./frontend/tests/e2e/README.md)
- [배포 체크리스트](./DEPLOYMENT_CHECKLIST.md)

---

**작성자**: GitHub Copilot  
**최종 검토**: 2025년 11월 9일
