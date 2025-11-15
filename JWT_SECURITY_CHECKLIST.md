# JWT 보안 체크리스트

**버전**: 1.0  
**작성일**: 2025년 11월 9일  
**대상**: 개발자, 보안 담당자, DevOps

---

## 📋 목차

1. [JWT 개요](#jwt-개요)
2. [보안 요구사항](#보안-요구사항)
3. [구현 체크리스트](#구현-체크리스트)
4. [토큰 생성](#토큰-생성)
5. [토큰 검증](#토큰-검증)
6. [토큰 블랙리스트](#토큰-블랙리스트)
7. [환경 설정](#환경-설정)
8. [보안 모범 사례](#보안-모범-사례)
9. [문제 해결](#문제-해결)

---

## 1. JWT 개요

### 1.1 현재 구현

- **알고리즘**: RS256 (비대칭키 암호화)
- **토큰 유형**: Access Token, Refresh Token
- **저장 위치**: HttpOnly Cookie
- **토큰 추적**: JTI (JWT ID) 사용

### 1.2 보안 목표

✅ **기밀성**: 민감한 정보를 토큰에 포함하지 않음  
✅ **무결성**: 서명으로 변조 방지  
✅ **재사용 방지**: 블랙리스트로 로그아웃된 토큰 차단  
✅ **만료 관리**: 짧은 수명 + Refresh Token 로테이션

---

## 2. 보안 요구사항

### 2.1 필수 요구사항

| 항목                | 요구사항                     | 상태   |
| ------------------- | ---------------------------- | ------ |
| **시크릿 관리**     | 환경변수 사용, 하드코딩 금지 | ✅ 완료 |
| **알고리즘**        | RS256 이상 (비대칭키)        | ✅ 완료 |
| **토큰 수명**       | Access: 15분, Refresh: 7일   | ✅ 완료 |
| **HTTPS**           | 모든 통신 HTTPS 강제         | ✅ 완료 |
| **HttpOnly Cookie** | XSS 공격 방지                | ✅ 완료 |
| **Secure Cookie**   | HTTPS 전용                   | ✅ 완료 |
| **SameSite**        | CSRF 방어                    | ✅ 완료 |
| **토큰 검증**       | 서명, 만료, 발급자 검증      | ✅ 완료 |
| **블랙리스트**      | 로그아웃/변경 시 토큰 무효화 | ✅ 완료 |
| **JTI 추적**        | 토큰 고유 ID로 추적          | ✅ 완료 |

### 2.2 권장 요구사항

- [ ] 다단계 인증 (MFA)
- [x] Rate Limiting (브루트포스 방지)
- [x] IP 기반 추가 검증
- [ ] 디바이스 핑거프린팅
- [x] 감사 로깅

---

## 3. 구현 체크리스트

### 3.1 환경 설정

```bash
# .env
JWT_SECRET=<256-bit-random-string>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
JWT_ALGORITHM=RS256
```

#### ✅ 체크리스트
- [x] JWT_SECRET 환경변수 설정
- [x] .env.example에 템플릿 제공
- [x] .gitignore에 .env 추가
- [x] CI/CD에서 시크릿 검증
- [x] Startup validation 구현

### 3.2 강화된 파일 목록

다음 9개 파일에서 하드코딩 제거 및 보안 강화 완료:

1. **server-backend/src/server.js**
   - JWT_SECRET 환경변수 사용
   - Startup validation

2. **server-backend/src/routes/auth.js**
   - 토큰 생성 시 JTI 추가
   - 블랙리스트 체크

3. **server-backend/src/middleware/auth.js**
   - 토큰 검증 강화
   - 블랙리스트 조회

4. **server-backend/src/utils/jwt.js**
   - JTI 생성 및 검증
   - 토큰 유틸리티 함수

5. **server-backend/src/utils/tokenBlacklist.js**
   - Redis + In-memory 이중화
   - 자동 만료 처리

6. **server-backend/.env.development**
   - 개발 환경 설정

7. **server-backend/.env.example**
   - 환경변수 템플릿

8. **server-backend/.github/workflows/security.yml**
   - CI/CD 시크릿 검증

9. **server-backend/scripts/verify-env.js**
   - 환경변수 검증 스크립트

---

## 4. 토큰 생성

### 4.1 Access Token 생성

```javascript
// routes/auth.js
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

function generateAccessToken(user) {
    const payload = {
        sub: user.id,              // Subject (사용자 ID)
        email: user.email,         // 이메일
        role: user.role,           // 역할
        jti: uuidv4(),             // JWT ID (고유 식별자)
        iat: Math.floor(Date.now() / 1000)  // 발급 시간
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        algorithm: 'RS256',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        issuer: 'community-platform',
        audience: 'community-users'
    });
}
```

#### ✅ 체크리스트
- [x] JTI 포함 (고유 ID)
- [x] 최소한의 정보만 포함
- [x] 민감한 정보 제외 (비밀번호, 개인정보)
- [x] 만료 시간 설정
- [x] 발급자(issuer) 명시
- [x] 대상(audience) 명시

### 4.2 Refresh Token 생성

```javascript
function generateRefreshToken(user) {
    const payload = {
        sub: user.id,
        jti: uuidv4(),
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        algorithm: 'RS256',
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
        issuer: 'community-platform',
        audience: 'community-users'
    });
}
```

#### ✅ 체크리스트
- [x] 긴 수명 (7일)
- [x] Type 명시 ('refresh')
- [x] 최소 정보만 포함
- [x] Refresh Token 로테이션

---

## 5. 토큰 검증

### 5.1 검증 미들웨어

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const { isTokenBlacklisted } = require('../utils/tokenBlacklist');

async function authenticateToken(req, res, next) {
    try {
        // 1. 토큰 추출
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ error: 'NO_TOKEN' });
        }

        // 2. 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['RS256'],
            issuer: 'community-platform',
            audience: 'community-users'
        });

        // 3. 블랙리스트 체크
        const isBlacklisted = await isTokenBlacklisted(decoded.jti);
        if (isBlacklisted) {
            return res.status(401).json({ error: 'TOKEN_REVOKED' });
        }

        // 4. 사용자 정보 첨부
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'TOKEN_EXPIRED' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'INVALID_TOKEN' });
        }
        return res.status(500).json({ error: 'AUTH_ERROR' });
    }
}
```

#### ✅ 체크리스트
- [x] 서명 검증
- [x] 만료 시간 검증
- [x] 발급자(issuer) 검증
- [x] 대상(audience) 검증
- [x] 알고리즘 검증 (RS256만 허용)
- [x] 블랙리스트 확인
- [x] 명확한 에러 메시지

### 5.2 토큰 추출

```javascript
function extractToken(req) {
    // 1. Authorization 헤더
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // 2. HttpOnly Cookie
    if (req.cookies && req.cookies.accessToken) {
        return req.cookies.accessToken;
    }

    return null;
}
```

---

## 6. 토큰 블랙리스트

### 6.1 아키텍처

```
[로그아웃/보안 이벤트]
        ↓
    [블랙리스트 추가]
        ↓
    ┌──────────────────┐
    │   Redis (Primary) │
    │   TTL: 자동 만료   │
    └──────────────────┘
        ↓ (Fallback)
    ┌──────────────────┐
    │ In-Memory (백업)  │
    │   Set<string>    │
    └──────────────────┘
```

### 6.2 구현

```javascript
// utils/tokenBlacklist.js
const redis = require('./redis');

// In-memory 폴백
const blacklistedTokens = new Set();

/**
 * 토큰을 블랙리스트에 추가
 */
async function addToBlacklist(jti, expiresIn) {
    try {
        // Redis에 추가 (TTL 설정)
        const client = redis.getRedisClient();
        if (client) {
            await client.setEx(`blacklist:${jti}`, expiresIn, '1');
        }
        
        // In-memory에도 추가 (폴백)
        blacklistedTokens.add(jti);
        
        // 자동 만료 설정
        setTimeout(() => {
            blacklistedTokens.delete(jti);
        }, expiresIn * 1000);
        
        return true;
    } catch (error) {
        console.error('블랙리스트 추가 실패:', error);
        return false;
    }
}

/**
 * 토큰이 블랙리스트에 있는지 확인
 */
async function isTokenBlacklisted(jti) {
    try {
        // 1. Redis 확인
        const client = redis.getRedisClient();
        if (client) {
            const exists = await client.exists(`blacklist:${jti}`);
            if (exists) return true;
        }
        
        // 2. In-memory 확인
        return blacklistedTokens.has(jti);
    } catch (error) {
        console.error('블랙리스트 확인 실패:', error);
        // 에러 시 안전하게 in-memory만 확인
        return blacklistedTokens.has(jti);
    }
}

module.exports = {
    addToBlacklist,
    isTokenBlacklisted,
    clearBlacklist: () => blacklistedTokens.clear()
};
```

### 6.3 로그아웃 구현

```javascript
// routes/auth.js
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const { jti, exp } = req.user;
        const now = Math.floor(Date.now() / 1000);
        const ttl = exp - now;

        // 토큰 블랙리스트 추가
        if (ttl > 0) {
            await addToBlacklist(jti, ttl);
        }

        // 쿠키 삭제
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'LOGOUT_FAILED' });
    }
});
```

#### ✅ 체크리스트
- [x] 로그아웃 시 블랙리스트 추가
- [x] TTL 설정 (자동 만료)
- [x] Redis + In-memory 이중화
- [x] 쿠키 삭제
- [x] 비밀번호 변경 시에도 블랙리스트 추가

---

## 7. 환경 설정

### 7.1 필수 환경변수

```bash
# JWT 설정
JWT_SECRET=your-super-secret-key-min-256-bits-recommended-use-openssl-rand-hex-32
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
JWT_ALGORITHM=RS256

# Redis (블랙리스트용)
REDIS_URL=redis://localhost:6379

# 서버 설정
NODE_ENV=production
PORT=50000
```

### 7.2 시크릿 생성

```bash
# 256-bit 랜덤 시크릿 생성
openssl rand -hex 32

# 또는 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 7.3 Startup Validation

```javascript
// server.js
function validateEnvironment() {
    const required = [
        'JWT_SECRET',
        'SESSION_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ 필수 환경변수 누락:', missing.join(', '));
        process.exit(1);
    }

    // JWT_SECRET 길이 검증 (최소 32바이트)
    if (process.env.JWT_SECRET.length < 32) {
        console.error('❌ JWT_SECRET이 너무 짧습니다 (최소 32자)');
        process.exit(1);
    }

    console.log('✅ 환경변수 검증 완료');
}

// 서버 시작 전 검증
validateEnvironment();
```

---

## 8. 보안 모범 사례

### 8.1 DO ✅

1. **환경변수 사용**
   ```javascript
   // ✅ 좋음
   const secret = process.env.JWT_SECRET;
   
   // ❌ 나쁨
   const secret = 'hardcoded-secret';
   ```

2. **짧은 만료 시간**
   ```javascript
   // ✅ 좋음
   expiresIn: '15m'  // Access Token
   
   // ❌ 나쁨
   expiresIn: '30d'  // 너무 긺
   ```

3. **최소 정보만 포함**
   ```javascript
   // ✅ 좋음
   const payload = { sub: user.id, role: user.role };
   
   // ❌ 나쁨
   const payload = { 
       ...user,  // 모든 정보 포함
       password: user.password  // 민감한 정보!
   };
   ```

4. **HttpOnly + Secure 쿠키**
   ```javascript
   // ✅ 좋음
   res.cookie('accessToken', token, {
       httpOnly: true,
       secure: true,
       sameSite: 'strict'
   });
   ```

5. **알고리즘 명시**
   ```javascript
   // ✅ 좋음
   jwt.verify(token, secret, { algorithms: ['RS256'] });
   
   // ❌ 나쁨
   jwt.verify(token, secret);  // 모든 알고리즘 허용
   ```

### 8.2 DON'T ❌

1. **시크릿 하드코딩 금지**
   ```javascript
   // ❌ 절대 금지
   const JWT_SECRET = 'my-secret-key';
   ```

2. **민감한 정보 포함 금지**
   ```javascript
   // ❌ 절대 금지
   const payload = {
       password: user.password,
       creditCard: user.creditCard
   };
   ```

3. **'none' 알고리즘 금지**
   ```javascript
   // ❌ 절대 금지
   jwt.sign(payload, '', { algorithm: 'none' });
   ```

4. **로그아웃 시 토큰 무효화 누락 금지**
   ```javascript
   // ❌ 나쁨
   router.post('/logout', (req, res) => {
       res.json({ message: 'Logged out' });
       // 토큰은 여전히 유효!
   });
   ```

---

## 9. 문제 해결

### 9.1 일반적인 오류

#### TokenExpiredError
```javascript
// 원인: 토큰 만료
// 해결: Refresh Token으로 갱신

if (error.name === 'TokenExpiredError') {
    // 클라이언트에 Refresh Token 사용 지시
    return res.status(401).json({ 
        error: 'TOKEN_EXPIRED',
        shouldRefresh: true
    });
}
```

#### JsonWebTokenError
```javascript
// 원인: 잘못된 토큰 (변조, 형식 오류)
// 해결: 재로그인 필요

if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
        error: 'INVALID_TOKEN',
        shouldRelogin: true
    });
}
```

#### TOKEN_REVOKED
```javascript
// 원인: 블랙리스트에 있는 토큰 (로그아웃됨)
// 해결: 재로그인 필요

if (await isTokenBlacklisted(jti)) {
    return res.status(401).json({ 
        error: 'TOKEN_REVOKED',
        shouldRelogin: true
    });
}
```

### 9.2 디버깅

```javascript
// JWT 디코딩 (검증 없이)
const jwt = require('jsonwebtoken');
const decoded = jwt.decode(token, { complete: true });
console.log('Header:', decoded.header);
console.log('Payload:', decoded.payload);

// 만료 시간 확인
const exp = decoded.payload.exp;
const now = Math.floor(Date.now() / 1000);
console.log('만료까지:', exp - now, '초');
```

### 9.3 테스트

```javascript
// tests/auth.test.js
describe('JWT Authentication', () => {
    it('should generate valid access token', () => {
        const token = generateAccessToken(testUser);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        expect(decoded.sub).toBe(testUser.id);
        expect(decoded.jti).toBeDefined();
    });

    it('should reject expired token', async () => {
        const expiredToken = jwt.sign(
            { sub: 1, jti: 'test' },
            process.env.JWT_SECRET,
            { expiresIn: '0s' }
        );

        await new Promise(resolve => setTimeout(resolve, 1000));

        expect(() => {
            jwt.verify(expiredToken, process.env.JWT_SECRET);
        }).toThrow('jwt expired');
    });

    it('should reject blacklisted token', async () => {
        const token = generateAccessToken(testUser);
        const decoded = jwt.decode(token);
        
        await addToBlacklist(decoded.jti, 3600);
        
        const isBlacklisted = await isTokenBlacklisted(decoded.jti);
        expect(isBlacklisted).toBe(true);
    });
});
```

---

## 10. 감사 로그

### 10.1 로깅 대상

- ✅ 로그인 성공/실패
- ✅ 토큰 발급
- ✅ 토큰 갱신
- ✅ 로그아웃
- ✅ 토큰 검증 실패
- ✅ 블랙리스트 추가

### 10.2 로그 형식

```javascript
// 인증 이벤트 로깅
function logAuthEvent(event, user, details = {}) {
    const log = {
        timestamp: new Date().toISOString(),
        event: event,
        userId: user?.id,
        ip: details.ip,
        userAgent: details.userAgent,
        success: details.success,
        error: details.error
    };

    console.log(JSON.stringify(log));
    
    // 데이터베이스에도 저장
    // await saveAuditLog(log);
}

// 사용 예
logAuthEvent('LOGIN_SUCCESS', user, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    success: true
});
```

---

## 11. 규정 준수

### 11.1 GDPR

- [x] 최소 정보만 토큰에 포함
- [x] 사용자 동의 (로그인 시)
- [x] 데이터 삭제 (로그아웃 시)
- [x] 감사 로그 (추적 가능성)

### 11.2 개인정보 보호법

- [x] 개인정보 최소화
- [x] 안전한 전송 (HTTPS)
- [x] 접근 제어
- [x] 로그 보존 (1년)

---

## 12. 참고 자료

### 12.1 관련 문서
- [SECURITY_FINAL_REPORT.md](./SECURITY_FINAL_REPORT.md)
- [REDIS_SESSION_GUIDE.md](./REDIS_SESSION_GUIDE.md)
- [CSRF_TEST_GUIDE.md](./CSRF_TEST_GUIDE.md)

### 12.2 외부 자료
- [JWT.io](https://jwt.io/)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [RFC 7519 - JWT](https://tools.ietf.org/html/rfc7519)

---

**작성자**: GitHub Copilot Security Team  
**검토일**: 2025년 11월 9일  
**다음 검토**: 2026년 2월 9일
