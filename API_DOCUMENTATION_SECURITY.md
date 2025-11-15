# 🔐 Community Platform API 문서 - 보안 API

**버전**: 2.0.0  
**최종 업데이트**: 2025년 11월 9일  
**Base URL**: `http://localhost:5000/api`

---

## 📋 목차

1. [인증 API](#1-인증-api)
2. [토큰 블랙리스트 API](#2-토큰-블랙리스트-api)
3. [CSRF 토큰 API](#3-csrf-토큰-api)
4. [보안 헤더](#4-보안-헤더)
5. [에러 코드](#5-에러-코드)

---

## 1. 인증 API

### 1.1 로그인

**Endpoint**: `POST /api/auth/login`

**요청**:
```json
{
    "username": "testuser",
    "password": "password123"
}
```

**응답** (200 OK):
```json
{
    "access": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 123,
        "username": "testuser",
        "role": "user"
    }
}
```

**에러** (401 Unauthorized):
```json
{
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password"
}
```

---

### 1.2 토큰 갱신

**Endpoint**: `POST /api/auth/refresh`

**요청**:
```json
{
    "refresh": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**응답** (200 OK):
```json
{
    "access": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**에러** (401 Unauthorized):
```json
{
    "code": "TOKEN_EXPIRED",
    "message": "Refresh token has expired"
}
```

---

### 1.3 로그아웃

**Endpoint**: `POST /api/auth/logout`

**헤더**:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
x-csrf-token: csrf_token_here
```

**요청**:
```json
{
    "refresh": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**응답** (200 OK):
```json
{
    "message": "Logout successful",
    "blacklisted": {
        "access": true,
        "refresh": true
    }
}
```

**설명**:
- Access Token과 Refresh Token을 블랙리스트에 추가
- Redis에 저장 (TTL: 토큰 만료 시간까지)
- 즉시 토큰 무효화

---

### 1.4 회원가입

**Endpoint**: `POST /api/auth/register`

**요청**:
```json
{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "SecurePassword123!",
    "confirmPassword": "SecurePassword123!"
}
```

**응답** (201 Created):
```json
{
    "message": "User registered successfully",
    "user": {
        "id": 124,
        "username": "newuser",
        "email": "newuser@example.com"
    }
}
```

**에러** (400 Bad Request):
```json
{
    "code": "USERNAME_EXISTS",
    "message": "Username already exists"
}
```

---

## 2. 토큰 블랙리스트 API

### 2.1 강제 로그아웃 (관리자용)

**Endpoint**: `POST /api/admin/force-logout`

**헤더**:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
x-csrf-token: csrf_token_here
```

**요청**:
```json
{
    "userId": 123,
    "reason": "security_violation"
}
```

**응답** (200 OK):
```json
{
    "message": "User logged out successfully",
    "userId": 123,
    "tokensBlacklisted": 2
}
```

**권한**: `admin` 역할 필요

---

### 2.2 블랙리스트 확인

**Endpoint**: `GET /api/admin/blacklist/:jti`

**헤더**:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답** (200 OK):
```json
{
    "blacklisted": true,
    "details": {
        "userId": 123,
        "reason": "user_logout",
        "tokenExp": 1699999999,
        "blacklistedAt": 1699990000
    }
}
```

**권한**: `admin` 역할 필요

---

## 3. CSRF 토큰 API

### 3.1 CSRF 토큰 발급

**Endpoint**: `GET /api/auth/csrf`

**응답** (200 OK):
```json
{
    "csrf_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

**쿠키 설정**:
```
Set-Cookie: csrf_token=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
```

**설명**:
- 1시간 유효기간
- HttpOnly 쿠키로 설정
- Double Submit Cookie 패턴

---

### 3.2 CSRF 토큰 검증

**모든 POST/PUT/DELETE 요청에 필요**:

**헤더**:
```
x-csrf-token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**에러** (403 Forbidden):
```json
{
    "code": "CSRF_VALIDATION_FAILED",
    "message": "CSRF token validation failed"
}
```

**에러 코드**:
- `CSRF_TOKEN_MISSING`: CSRF 토큰이 없음
- `CSRF_VALIDATION_FAILED`: CSRF 토큰 검증 실패
- `CSRF_INVALID`: 유효하지 않은 CSRF 토큰

---

## 4. 보안 헤더

### 4.1 인증 헤더

**Authorization**:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

- JWT Access Token 필요
- 모든 보호된 엔드포인트에 필수

---

### 4.2 CSRF 헤더

**x-csrf-token**:
```
x-csrf-token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

- POST/PUT/DELETE 요청에 필수
- GET 요청은 불필요

---

### 4.3 응답 헤더

서버는 다음 보안 헤더를 자동으로 설정합니다:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
```

---

## 5. 에러 코드

### 5.1 인증 에러 (401)

| 코드                  | 설명                       | 해결 방법               |
| --------------------- | -------------------------- | ----------------------- |
| `TOKEN_MISSING`       | Authorization 헤더 없음    | 로그인 필요             |
| `TOKEN_INVALID`       | 유효하지 않은 토큰         | 로그인 재시도           |
| `TOKEN_EXPIRED`       | 토큰 만료                  | 토큰 갱신 또는 재로그인 |
| `TOKEN_REVOKED`       | 토큰이 블랙리스트에 추가됨 | 재로그인 필요           |
| `INVALID_CREDENTIALS` | 로그인 정보 오류           | 정보 확인 후 재시도     |

---

### 5.2 CSRF 에러 (403)

| 코드                     | 설명                    | 해결 방법           |
| ------------------------ | ----------------------- | ------------------- |
| `CSRF_TOKEN_MISSING`     | CSRF 토큰 없음          | CSRF 토큰 발급      |
| `CSRF_VALIDATION_FAILED` | CSRF 토큰 검증 실패     | 토큰 갱신 후 재시도 |
| `CSRF_INVALID`           | 유효하지 않은 CSRF 토큰 | 새 토큰 발급        |

---

### 5.3 권한 에러 (403)

| 코드                       | 설명      | 해결 방법       |
| -------------------------- | --------- | --------------- |
| `FORBIDDEN`                | 권한 없음 | 관리자에게 문의 |
| `INSUFFICIENT_PERMISSIONS` | 권한 부족 | 권한 요청       |

---

### 5.4 Rate Limiting (429)

| 코드                  | 설명           | 해결 방법      |
| --------------------- | -------------- | -------------- |
| `RATE_LIMIT_EXCEEDED` | 요청 횟수 초과 | 잠시 후 재시도 |

**기본 설정**:
- 로그인: 15분에 5회
- 일반 API: 15분에 100회

---

## 📚 사용 예시

### JavaScript (Fetch)

```javascript
// 로그인
const login = async (username, password) => {
    const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    return data;
};

// CSRF 토큰 가져오기
const getCSRFToken = async () => {
    const response = await fetch('http://localhost:5000/api/auth/csrf', {
        credentials: 'include',
    });
    const data = await response.json();
    return data.csrf_token;
};

// 보호된 POST 요청
const createPost = async (title, content) => {
    const accessToken = localStorage.getItem('access_token');
    const csrfToken = await getCSRFToken();
    
    const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ title, content }),
    });
    
    return await response.json();
};

// 로그아웃
const logout = async () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const csrfToken = await getCSRFToken();
    
    await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ refresh: refreshToken }),
    });
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};
```

---

### TypeScript (apiClient)

```typescript
import apiClient from './utils/apiClient';

// 로그인
const login = async (username: string, password: string) => {
    const response = await apiClient.post('/auth/login', {
        username,
        password,
    });
    return response.data;
};

// 게시물 생성 (자동 Authorization + CSRF)
const createPost = async (title: string, content: string) => {
    const response = await apiClient.post('/posts', {
        title,
        content,
    });
    return response.data;
};

// 로그아웃
const logout = async () => {
    await logoutApi(); // authApiService.ts
};
```

---

## 🔗 관련 문서

- [보안 구현 가이드](./SECURITY_IMPLEMENTATION_GUIDE.md)
- [보안 구현 완료 보고서](./SECURITY_IMPLEMENTATION_COMPLETED_REPORT.md)
- [E2E 테스트 가이드](./frontend/tests/e2e/README.md)
- [배포 체크리스트](./DEPLOYMENT_CHECKLIST.md)

---

**작성자**: GitHub Copilot  
**최종 검토**: 2025년 11월 9일
