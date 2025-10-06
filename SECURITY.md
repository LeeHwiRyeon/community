# 보안 가이드 (Security Guide)

## 🔒 구현된 보안 기능

### 1. 인증 및 인가 (Authentication & Authorization)
- **JWT 토큰 기반 인증**: 안전한 토큰 발급 및 검증
- **토큰 만료 시간**: Access Token 15분, Refresh Token 14일
- **토큰 회전**: Refresh Token 자동 갱신
- **역할 기반 접근 제어**: Admin, Moderator, User 권한 관리
- **OAuth 2.0 통합**: Google, Apple 소셜 로그인

### 2. 입력 검증 및 보안 (Input Validation & Security)
- **SQL 인젝션 방지**: 자동 패턴 감지 및 차단
- **XSS 방지**: 스크립트 태그 및 악성 코드 차단
- **입력 데이터 정제**: 모든 사용자 입력 자동 정제
- **요청 크기 제한**: 10MB 제한으로 DoS 공격 방지

### 3. 보안 헤더 (Security Headers)
- **Helmet.js**: 포괄적인 보안 헤더 설정
- **CSP (Content Security Policy)**: XSS 공격 방지
- **HSTS**: HTTPS 강제 사용
- **X-Frame-Options**: 클릭재킹 방지
- **X-Content-Type-Options**: MIME 타입 스니핑 방지

### 4. Rate Limiting (속도 제한)
- **API 요청 제한**: IP별 분당 요청 수 제한
- **쓰기 작업 제한**: 분당 120회 쓰기 작업 제한
- **검색 요청 제한**: 분당 180회 검색 요청 제한
- **Redis 백엔드**: 확장 가능한 Rate Limiting

### 5. CORS 설정
- **허용된 도메인**: 프론트엔드 도메인만 허용
- **자격 증명**: 쿠키 및 인증 헤더 지원
- **메서드 제한**: 필요한 HTTP 메서드만 허용

## 🛡️ 보안 미들웨어

### 자동 보안 검사
```javascript
// 모든 요청에 자동 적용되는 보안 미들웨어
app.use(securityHeaders);        // 보안 헤더
app.use(requestSizeLimiter);     // 요청 크기 제한
app.use(sanitizeInput);          // 입력 정제
app.use(preventSQLInjection);    // SQL 인젝션 방지
app.use(preventXSS);             // XSS 방지
```

### Rate Limiting
```javascript
// API 엔드포인트별 Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 최대 100 요청
    message: { error: 'Too many requests' }
});
```

## 🔧 환경 변수 설정

### 필수 보안 설정
```bash
# JWT 설정
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_ISSUER=community-platform
JWT_AUDIENCE=community-platform-users

# 보안 헤더
DISABLE_HELMET=0
DISABLE_CSP=0

# Rate Limiting
RATE_LIMIT_WRITE_PER_MIN=120
RATE_LIMIT_SEARCH_PER_MIN=180

# CORS
FRONTEND_URL=http://localhost:3000
```

## 🧪 보안 테스트

### 테스트 실행
```bash
# 포괄적인 보안 테스트
npm run test:security:comprehensive

# 기존 보안 테스트
npm run test:security
```

### 테스트 항목
- ✅ SQL 인젝션 방지 테스트
- ✅ XSS 방지 테스트
- ✅ Rate Limiting 테스트
- ✅ 보안 헤더 테스트
- ✅ 요청 크기 제한 테스트

## 📊 보안 모니터링

### 로깅
- 모든 보안 이벤트 자동 로깅
- 실패한 인증 시도 추적
- Rate Limiting 차단 이벤트 기록

### 메트릭
- 보안 이벤트 카운터
- Rate Limiting 통계
- 인증 성공/실패 비율

## 🚨 보안 사고 대응

### 자동 차단
- SQL 인젝션 시도 자동 차단
- XSS 공격 시도 자동 차단
- Rate Limiting 초과 시 자동 차단

### 수동 대응
1. 의심스러운 활동 감지 시 즉시 조사
2. IP 주소 기반 차단 (필요시)
3. 사용자 계정 일시 정지 (필요시)

## 🔄 정기 보안 점검

### 일일 점검
- [ ] 보안 로그 검토
- [ ] Rate Limiting 통계 확인
- [ ] 인증 실패 패턴 분석

### 주간 점검
- [ ] 의존성 보안 업데이트 확인
- [ ] 보안 테스트 실행
- [ ] 접근 로그 분석

### 월간 점검
- [ ] 전체 보안 감사
- [ ] 취약점 스캔
- [ ] 보안 정책 검토

## 📚 추가 보안 권장사항

### 프로덕션 환경
1. **HTTPS 강제 사용**: 모든 통신 암호화
2. **강력한 JWT 시크릿**: 최소 32자 이상
3. **데이터베이스 암호화**: 민감한 데이터 암호화
4. **정기적인 백업**: 데이터 복구 계획
5. **모니터링 시스템**: 실시간 보안 모니터링

### 개발 환경
1. **개발용 시크릿 사용**: 프로덕션과 분리
2. **테스트 데이터**: 실제 데이터 사용 금지
3. **코드 리뷰**: 보안 취약점 사전 검토

## 🆘 보안 문의

보안 관련 문제나 제안사항이 있으시면:
- 이슈 트래커에 보안 라벨로 등록
- 보안팀에 직접 연락 (보안 이슈의 경우)

---

**마지막 업데이트**: 2024년 10월
**보안 수준**: 높음 (High)
**다음 점검 예정일**: 2024년 11월
