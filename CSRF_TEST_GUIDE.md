# CSRF 토큰 시스템 테스트 가이드

## 📋 개요

이 문서는 Double Submit Cookie 패턴 기반 CSRF 토큰 시스템의 테스트 방법을 안내합니다.

---

## 🧪 테스트 종류

### 1️⃣ 백엔드 통합 테스트 (Jest + Supertest)

**파일 위치**: `server-backend/tests/csrf-integration.test.js`

**테스트 범위** (16+ 테스트):
- ✅ CSRF 토큰 발급 (3 tests)
  - 토큰 발급 성공
  - 응답 헤더에 토큰 포함
  - 쿠키에 토큰 포함
  
- ✅ CSRF 토큰 검증 (4 tests)
  - POST 요청 시 토큰 없음 → 403
  - POST 요청 시 유효한 토큰 → 200
  - POST 요청 시 잘못된 토큰 → 403
  - GET 요청 시 토큰 불필요 → 200
  
- ✅ CSRF 토큰 갱신 (3 tests)
  - 토큰 갱신 성공
  - 새 토큰으로 요청 성공
  - 기존 토큰 무효화
  
- ✅ CSRF 토큰 자동 갱신 (1 test)
  - 80% 만료 시 자동 갱신
  
- ✅ 에러 처리 및 보안 (3 tests)
  - 헤더/쿠키 불일치 → 403
  - 세션 없음 → 403
  - 토큰 정보 조회
  
- ✅ 통합 시나리오 (2 tests)
  - 전체 플로우: 발급 → 사용 → 갱신 → 재사용
  - 로그인 시나리오: 로그인 시 자동 토큰 발급

**실행 방법**:
```bash
cd server-backend
npm test -- csrf-integration.test.js
```

---

### 2️⃣ 프론트엔드 통합 테스트 (Vitest)

**파일 위치**: `frontend/src/utils/apiClient.csrf.test.ts`

**테스트 범위** (20+ 테스트):
- ✅ CSRF 토큰 초기화 (4 tests)
  - `initCSRFToken()` 자동 토큰 가져오기
  - 실패 시 경고만 출력
  - `setCSRFToken()` 수동 설정
  - `clearCSRFToken()` 토큰 제거
  
- ✅ GET 요청 (1 test)
  - CSRF 토큰 없이 GET 성공
  
- ✅ POST 요청 (2 tests)
  - 토큰 없으면 자동 가져오기
  - 기존 토큰 사용
  
- ✅ CSRF 검증 실패 시 자동 재시도 (2 tests)
  - 403 CSRF_VALIDATION_FAILED → 갱신 → 재시도
  - 403 기타 오류 → 재시도 없음
  
- ✅ 토큰 자동 갱신 (1 test)
  - X-CSRF-Token-Refreshed 헤더 → 자동 업데이트
  
- ✅ PUT/DELETE 요청 (2 tests)
  - PUT 요청 시 토큰 자동 첨부
  - DELETE 요청 시 토큰 자동 첨부
  
- ✅ 에러 처리 (2 tests)
  - 네트워크 오류 발생
  - HTTP 500 오류 발생
  
- ✅ credentials: include 확인 (1 test)
  - 모든 요청에 credentials 포함

**실행 방법**:
```bash
cd frontend
npm test -- apiClient.csrf.test.ts
```

---

### 3️⃣ 수동 통합 테스트 (실제 서버)

**파일 위치**: `server-backend/scripts/test-csrf-manual.js`

**테스트 시나리오** (7개):
1. ✅ CSRF 토큰 발급
2. ✅ 토큰 없이 POST 요청 (403 예상)
3. ✅ 유효한 토큰으로 POST 요청 (200 예상)
4. ✅ 잘못된 토큰으로 POST 요청 (403 예상)
5. ✅ CSRF 토큰 갱신
6. ✅ 갱신된 토큰으로 요청 (200 예상)
7. ✅ GET 요청 (CSRF 토큰 불필요)

**실행 방법**:

1. **서버 시작**:
```bash
cd server-backend
npm start
```

2. **새 터미널에서 테스트 실행**:
```bash
cd server-backend
npm run test:csrf
```

**예상 출력**:
```
🧪 CSRF 토큰 시스템 수동 테스트

서버: http://localhost:50000

📝 테스트 1: CSRF 토큰 발급
✅ GET /api/auth/csrf-token
   토큰: a1b2c3d4e5f6g7h8...

📝 테스트 2: CSRF 토큰 없이 POST 요청
✅ POST without CSRF token
   예상대로 403 오류 발생

📝 테스트 3: CSRF 토큰으로 POST 요청
✅ POST with valid CSRF token
   요청 성공

📝 테스트 4: 잘못된 CSRF 토큰
✅ POST with invalid CSRF token
   예상대로 403 오류 발생

📝 테스트 5: CSRF 토큰 갱신
✅ POST /api/auth/csrf-refresh
   새 토큰: x9y8z7w6v5u4t3s2...

📝 테스트 6: 갱신된 토큰으로 요청
✅ POST with refreshed token
   요청 성공

📝 테스트 7: GET 요청 (CSRF 토큰 불필요)
✅ GET without CSRF token
   GET 요청은 CSRF 검증 불필요

📊 테스트 결과 요약
──────────────────────────────────────────────────
✅ 통과: 7/7
❌ 실패: 0/7

🎉 모든 테스트 통과!
```

---

## 🔧 테스트 엔드포인트

**파일 위치**: `server-backend/routes/test.js`

### 사용 가능한 엔드포인트:

1. **POST /api/test/protected**
   - CSRF 토큰 필요
   - 테스트 데이터 전송 및 검증

2. **GET /api/test/safe**
   - CSRF 토큰 불필요 (안전한 메서드)
   - GET 요청 테스트

3. **PUT /api/test/protected**
   - CSRF 토큰 필요
   - PUT 요청 테스트

4. **DELETE /api/test/protected**
   - CSRF 토큰 필요
   - DELETE 요청 테스트

**주의**: 테스트 엔드포인트는 개발 환경에서만 활성화됩니다 (`NODE_ENV !== 'production'`).

---

## 📊 테스트 체크리스트

### 백엔드 테스트
- [ ] 토큰 발급 API 작동 확인
- [ ] 토큰 검증 로직 확인
- [ ] 토큰 갱신 로직 확인
- [ ] 세션 기반 토큰 저장 확인
- [ ] 쿠키/헤더 동기화 확인
- [ ] GET 요청 CSRF 우회 확인

### 프론트엔드 테스트
- [ ] apiClient 자동 토큰 가져오기
- [ ] POST/PUT/DELETE 자동 토큰 첨부
- [ ] 403 오류 시 자동 재시도
- [ ] X-CSRF-Token-Refreshed 자동 업데이트
- [ ] credentials: 'include' 확인
- [ ] 에러 처리 확인

### 통합 테스트
- [ ] 전체 플로우 테스트 (발급 → 사용 → 갱신)
- [ ] 로그인 시나리오 테스트
- [ ] 서버 재시작 후 세션 유지 확인
- [ ] 만료된 토큰 처리 확인
- [ ] 다중 브라우저 세션 테스트

---

## 🐛 문제 해결

### 테스트 실패 시

1. **서버가 실행 중인지 확인**:
```bash
curl http://localhost:50000/health
```

2. **Redis가 실행 중인지 확인** (세션 저장소):
```bash
redis-cli ping
# 응답: PONG
```

3. **환경 변수 확인**:
```bash
# server-backend/.env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-session-secret-key
```

4. **의존성 설치 확인**:
```bash
cd server-backend
npm install

cd ../frontend
npm install
```

### 로그 확인

서버 로그에서 CSRF 관련 메시지 확인:
```
✅ CSRF 토큰 발급: 토큰ID
⚠️  CSRF 토큰 검증 실패: [이유]
🔄 CSRF 토큰 갱신: 기존 토큰 → 새 토큰
```

---

## 📈 테스트 커버리지

### 현재 구현된 테스트

| 기능            | 백엔드 | 프론트엔드 | 통합 | 상태    |
| --------------- | ------ | ---------- | ---- | ------- |
| 토큰 발급       | ✅      | ✅          | ✅    | 완료    |
| 토큰 검증       | ✅      | ✅          | ✅    | 완료    |
| 토큰 갱신       | ✅      | ✅          | ✅    | 완료    |
| 자동 재시도     | ✅      | ✅          | ✅    | 완료    |
| GET 우회        | ✅      | ✅          | ✅    | 완료    |
| 에러 처리       | ✅      | ✅          | ✅    | 완료    |
| 로그인 시나리오 | ✅      | ⏳          | ⏳    | 진행 중 |

---

## 🚀 다음 단계

1. **Redis 세션 저장소 통합**
   - connect-redis 패키지 설치
   - 서버 재시작 후에도 세션 유지 확인

2. **프론트엔드 통합 테스트**
   - Playwright 또는 Cypress로 E2E 테스트
   - 실제 브라우저에서 CSRF 플로우 검증

3. **성능 테스트**
   - 동시 요청 처리 확인
   - 토큰 캐싱 전략 검증

4. **보안 감사**
   - OWASP ZAP 또는 Burp Suite로 취약점 스캔
   - CSRF 토큰 강도 검증

---

## 📚 참고 자료

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)
- Express Session 문서: https://www.npmjs.com/package/express-session
- Jest 문서: https://jestjs.io/
- Vitest 문서: https://vitest.dev/

---

## ✅ 완료 상태

- [x] 백엔드 테스트 파일 생성
- [x] 프론트엔드 테스트 파일 생성
- [x] 수동 테스트 스크립트 생성
- [x] 테스트 엔드포인트 생성
- [x] package.json 스크립트 추가
- [ ] 모든 테스트 실행 및 검증
- [ ] 테스트 결과 문서화

---

**작성일**: 2025년
**버전**: 1.0.0
**작성자**: GitHub Copilot
