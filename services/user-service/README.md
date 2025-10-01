# User Service

Community Hub의 사용자 관리를 담당하는 마이크로서비스입니다.

## 기능

- 사용자 등록/로그인/로그아웃
- JWT 기반 인증
- OAuth 로그인 (Google, GitHub 등)
- 사용자 프로필 관리
- 이메일 인증
- 비밀번호 변경
- 사용자 통계 조회
- Redis 캐싱
- SignalR 실시간 알림

## 기술 스택

- .NET 8
- Entity Framework Core
- MySQL
- Redis
- JWT Authentication
- AutoMapper
- FluentValidation
- Serilog
- SignalR

## API 엔드포인트

### 인증 (Auth)
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/oauth` - OAuth 로그인
- `POST /api/auth/validate` - 토큰 검증
- `GET /api/auth/me` - 현재 사용자 정보

### 사용자 (Users)
- `GET /api/users` - 사용자 목록 조회
- `GET /api/users/{id}` - 사용자 조회
- `POST /api/users` - 사용자 생성
- `PUT /api/users/{id}` - 사용자 정보 업데이트
- `DELETE /api/users/{id}` - 사용자 삭제
- `PUT /api/users/{id}/profile` - 프로필 업데이트
- `GET /api/users/{id}/stats` - 사용자 통계 조회
- `PUT /api/users/{id}/change-password` - 비밀번호 변경
- `POST /api/users/{id}/verify-email` - 이메일 인증
- `POST /api/users/{id}/resend-verification` - 인증 이메일 재전송

## 설정

### 환경 변수

```bash
# 데이터베이스
ConnectionStrings__DefaultConnection="Server=localhost;Database=community_users;Uid=root;Pwd=password;"

# Redis
ConnectionStrings__RedisConnection="localhost:6379"

# JWT
Jwt__Key="YourSuperSecretKeyThatIsAtLeast32CharactersLong!"
Jwt__Issuer="CommunityHub"
Jwt__Audience="CommunityHubUsers"

# 이메일
Email__SmtpHost="smtp.gmail.com"
Email__SmtpPort="587"
Email__SmtpUsername="your-email@gmail.com"
Email__SmtpPassword="your-app-password"
Email__FromEmail="noreply@communityhub.com"
Email__FromName="Community Hub"
```

## 실행 방법

### 로컬 개발

1. MySQL과 Redis 서버 실행
2. 환경 변수 설정
3. 애플리케이션 실행

```bash
dotnet run
```

### Docker

```bash
docker build -t user-service .
docker run -p 7001:80 user-service
```

### Docker Compose

```yaml
version: '3.8'
services:
  user-service:
    build: .
    ports:
      - "7001:80"
    environment:
      - ConnectionStrings__DefaultConnection=Server=mysql;Database=community_users;Uid=root;Pwd=password;
      - ConnectionStrings__RedisConnection=redis:6379
    depends_on:
      - mysql
      - redis
```

## 데이터베이스 마이그레이션

```bash
# 마이그레이션 생성
dotnet ef migrations add InitialCreate

# 데이터베이스 업데이트
dotnet ef database update
```

## 테스트

```bash
# 단위 테스트 실행
dotnet test

# 통합 테스트 실행
dotnet test --filter Category=Integration
```

## 모니터링

- Swagger UI: `https://localhost:7001`
- Health Check: `https://localhost:7001/health`
- Metrics: `https://localhost:7001/metrics`

## 로그

로그는 `logs/` 디렉토리에 저장되며, 콘솔과 파일에 동시에 출력됩니다.

## 보안

- JWT 토큰 기반 인증
- 비밀번호 해싱 (SHA256)
- CORS 설정
- 입력 검증 (FluentValidation)
- SQL 인젝션 방지 (Entity Framework)

