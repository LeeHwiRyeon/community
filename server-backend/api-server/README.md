# 뉴스 페이퍼 VIP 관리 시스템 API 서버

## 📋 개요

뉴스 페이퍼 VIP 관리 시스템을 위한 RESTful API 서버입니다. Express.js 기반으로 구축되었으며, 사용자 관리, 등급별 권한 관리, 실시간 알림 등의 기능을 제공합니다.

## 🚀 주요 기능

- **사용자 인증 및 권한 관리**: JWT 기반 인증, 7단계 등급 시스템
- **RESTful API**: 표준 HTTP 메서드를 사용한 일관된 API 설계
- **실시간 알림**: Redis 기반 알림 시스템
- **캐싱**: Redis를 활용한 성능 최적화
- **로깅**: Winston을 사용한 구조화된 로깅
- **보안**: Helmet, Rate Limiting, CORS 등 보안 기능
- **데이터베이스**: MySQL/MariaDB 지원

## 🛠️ 기술 스택

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: MySQL/MariaDB with Sequelize ORM
- **Cache**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi, express-validator
- **Logging**: Winston
- **Security**: Helmet, bcryptjs, express-rate-limit

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# 서버 설정
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_NAME=news_paper_vip
DB_USER=root
DB_PASSWORD=your_password

# Redis 설정
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT 설정
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_REFRESH_EXPIRE=30d
```

### 3. 데이터베이스 설정

MySQL/MariaDB 데이터베이스를 생성하고 연결하세요.

### 4. 서버 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## 📚 API 엔드포인트

### 인증 (Authentication)

- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보
- `PUT /api/auth/change-password` - 비밀번호 변경

### 사용자 관리 (Users)

- `GET /api/users` - 사용자 목록 조회
- `GET /api/users/:id` - 특정 사용자 조회
- `PUT /api/users/:id` - 사용자 정보 수정
- `PUT /api/users/:id/role` - 사용자 등급 변경
- `PUT /api/users/:id/status` - 사용자 상태 변경
- `DELETE /api/users/:id` - 사용자 삭제

### 등급 관리 (Roles)

- `GET /api/roles` - 모든 등급 정보 조회
- `GET /api/roles/:role` - 특정 등급 정보 조회
- `GET /api/roles/:role/users` - 등급별 사용자 목록
- `GET /api/roles/permissions/matrix` - 권한 매트릭스
- `GET /api/roles/stats/summary` - 등급별 통계

### 대시보드 (Dashboard)

- `GET /api/dashboard/overview` - 대시보드 개요
- `GET /api/dashboard/users` - 사용자 관리 데이터
- `GET /api/dashboard/roles` - 등급별 통계
- `GET /api/dashboard/activity` - 실시간 활동 데이터
- `GET /api/dashboard/system-status` - 시스템 상태
- `POST /api/dashboard/clear-cache` - 캐시 초기화

### 알림 (Notifications)

- `GET /api/notifications` - 알림 목록 조회
- `PUT /api/notifications/:id/read` - 알림 읽음 처리
- `PUT /api/notifications/read-all` - 모든 알림 읽음 처리
- `DELETE /api/notifications/:id` - 알림 삭제
- `GET /api/notifications/settings` - 알림 설정 조회
- `PUT /api/notifications/settings` - 알림 설정 업데이트

## 🔐 인증 및 권한

### 등급 시스템

1. **Owner** (레벨 7) - 시스템 전체 관리
2. **Admin** (레벨 6) - 관리자 권한
3. **VIP** (레벨 5) - 특별 회원
4. **Streamer** (레벨 4) - 스트리머
5. **Cosplayer** (레벨 3) - 코스플레이어
6. **Manager** (레벨 2) - 매니저
7. **User** (레벨 1) - 일반 사용자

### 권한 확인

API 요청 시 JWT 토큰을 `Authorization: Bearer <token>` 헤더에 포함해야 합니다.

## 📊 데이터 모델

### User 모델

```javascript
{
  id: UUID,
  username: String(50),
  email: String(100),
  password: String(255),
  firstName: String(50),
  lastName: String(50),
  role: ENUM('owner', 'admin', 'vip', 'streamer', 'cosplayer', 'manager', 'user'),
  status: ENUM('active', 'inactive', 'suspended', 'pending'),
  avatar: String(255),
  phone: String(20),
  birthDate: DATEONLY,
  gender: ENUM('male', 'female', 'other', 'prefer_not_to_say'),
  bio: TEXT,
  website: String(255),
  socialLinks: JSON,
  preferences: JSON,
  lastLoginAt: DATE,
  lastLoginIp: String(45),
  loginCount: INTEGER,
  isEmailVerified: BOOLEAN,
  twoFactorEnabled: BOOLEAN,
  activityScore: INTEGER,
  subscriptionTier: ENUM('free', 'basic', 'premium', 'vip'),
  createdAt: DATE,
  updatedAt: DATE
}
```

## 🔧 개발 도구

### 스크립트

```bash
# 개발 서버 실행 (nodemon)
npm run dev

# 프로덕션 서버 실행
npm start

# 테스트 실행
npm test

# 코드 린팅
npm run lint

# TypeScript 빌드
npm run build

# 데이터베이스 마이그레이션
npm run migrate
```

### 로깅

로그는 `logs/` 디렉토리에 저장됩니다:

- `error.log` - 에러 로그
- `combined.log` - 모든 로그
- `http.log` - HTTP 요청 로그

## 🚀 배포

### Docker 배포

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### 환경 변수

프로덕션 환경에서는 다음 환경 변수들을 설정하세요:

- `NODE_ENV=production`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`

## 📝 API 문서

자세한 API 문서는 다음 엔드포인트에서 확인할 수 있습니다:

- `GET /api/docs` - API 문서
- `GET /api/health` - 서버 상태 확인

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.

---

**뉴스 페이퍼 VIP 관리 시스템 API 서버** - 커뮤니티 관리의 새로운 표준
