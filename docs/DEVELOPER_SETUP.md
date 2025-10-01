# 🛠️ 개발자 설정 가이드

## 📋 개요

커뮤니티 플랫폼 v2.0.0의 개발 환경 구축 가이드입니다.

## 🔧 시스템 요구사항

### 필수 소프트웨어
- **Node.js**: v18.0.0 이상
- **npm**: v8.0.0 이상
- **Git**: v2.30.0 이상
- **Docker**: v20.0.0 이상 (선택사항)

### 데이터베이스
- **MariaDB**: v10.6.0 이상
- **Redis**: v6.0.0 이상

### 권장 개발 도구
- **VS Code**: 최신 버전
- **Postman**: API 테스트용
- **Docker Desktop**: 컨테이너 관리용

## 🚀 로컬 개발 환경 구축

### 1. 저장소 클론
```bash
git clone https://github.com/your-org/community-platform.git
cd community-platform
```

### 2. 의존성 설치

#### 백엔드 의존성
```bash
cd server-backend
npm install
```

#### 프론트엔드 의존성
```bash
cd frontend
npm install
```

### 3. 환경 변수 설정

#### 백엔드 환경 변수 (.env)
```env
# 서버 설정
NODE_ENV=development
PORT=50000
HOST=localhost

# 데이터베이스 설정
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=community_db
DATABASE_USER=root
DATABASE_PASSWORD=your_password

# Redis 설정
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT 설정
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# 이메일 설정
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# 파일 업로드 설정
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# 보안 설정
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# 관리자 설정
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin_password
```

#### 프론트엔드 환경 변수 (.env.local)
```env
REACT_APP_API_URL=http://localhost:50000/api
REACT_APP_WS_URL=ws://localhost:50000
REACT_APP_VERSION=2.0.0
```

### 4. 데이터베이스 설정

#### MariaDB 설치 및 설정
```bash
# MariaDB 설치 (Ubuntu/Debian)
sudo apt update
sudo apt install mariadb-server

# MariaDB 시작
sudo systemctl start mariadb
sudo systemctl enable mariadb

# 보안 설정
sudo mysql_secure_installation

# 데이터베이스 생성
mysql -u root -p
CREATE DATABASE community_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'community_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON community_db.* TO 'community_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Redis 설치 및 설정
```bash
# Redis 설치 (Ubuntu/Debian)
sudo apt install redis-server

# Redis 시작
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Redis 설정 확인
redis-cli ping
```

### 5. 데이터베이스 마이그레이션
```bash
cd server-backend
npm run migrate
```

### 6. 초기 데이터 설정
```bash
npm run seed
```

## 🏃‍♂️ 개발 서버 실행

### 백엔드 서버 실행
```bash
cd server-backend
npm run dev
```

### 프론트엔드 서버 실행
```bash
cd frontend
npm start
```

### 동시 실행 (개발용)
```bash
# 프로젝트 루트에서
npm run dev
```

## 🐳 Docker를 사용한 개발 환경

### Docker Compose 설정
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  database:
    image: mariadb:10.6
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: community_db
      MYSQL_USER: community_user
      MYSQL_PASSWORD: community_password
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./server-backend
      dockerfile: Dockerfile.dev
    ports:
      - "50000:50000"
    environment:
      - NODE_ENV=development
      - DATABASE_HOST=database
      - REDIS_HOST=redis
    depends_on:
      - database
      - redis
    volumes:
      - ./server-backend:/app
      - /app/node_modules

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:50000/api
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  db_data:
  redis_data:
```

### Docker 개발 환경 실행
```bash
# 개발 환경 시작
docker-compose -f docker-compose.dev.yml up -d

# 로그 확인
docker-compose -f docker-compose.dev.yml logs -f

# 개발 환경 중지
docker-compose -f docker-compose.dev.yml down
```

## 🧪 테스트 환경 설정

### 테스트 데이터베이스 설정
```bash
# 테스트용 데이터베이스 생성
mysql -u root -p
CREATE DATABASE community_test_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON community_test_db.* TO 'community_user'@'localhost';
EXIT;
```

### 테스트 실행
```bash
# 백엔드 테스트
cd server-backend
npm test

# 프론트엔드 테스트
cd frontend
npm test

# E2E 테스트
npm run test:e2e

# 전체 테스트
npm run test:all
```

## 🔍 디버깅 설정

### VS Code 디버그 설정
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server-backend/api-server/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "node",
      "runtimeArgs": ["--inspect"]
    },
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

### 로그 설정
```javascript
// server-backend/api-server/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = { logger };
```

## 📦 빌드 및 배포

### 개발 빌드
```bash
# 백엔드 빌드
cd server-backend
npm run build

# 프론트엔드 빌드
cd frontend
npm run build
```

### 프로덕션 빌드
```bash
# 전체 프로덕션 빌드
npm run build:prod

# Docker 이미지 빌드
docker-compose -f docker-compose.production.yml build
```

## 🔧 개발 도구 및 스크립트

### 유용한 npm 스크립트
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd server-backend && npm run dev",
    "dev:frontend": "cd frontend && npm start",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd server-backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "lint": "npm run lint:backend && npm run lint:frontend",
    "lint:backend": "cd server-backend && npm run lint",
    "lint:frontend": "cd frontend && npm run lint",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "migrate": "cd server-backend && npm run migrate",
    "seed": "cd server-backend && npm run seed",
    "clean": "rm -rf node_modules server-backend/node_modules frontend/node_modules",
    "install:all": "npm install && cd server-backend && npm install && cd ../frontend && npm install"
  }
}
```

### Git Hooks 설정
```bash
# pre-commit hook 설정
npm install --save-dev husky lint-staged

# package.json에 추가
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

## 🐛 문제 해결

### 일반적인 문제들

#### 1. 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
netstat -tulpn | grep :50000
netstat -tulpn | grep :3000

# 프로세스 종료
kill -9 <PID>
```

#### 2. 데이터베이스 연결 오류
```bash
# MariaDB 상태 확인
sudo systemctl status mariadb

# Redis 상태 확인
sudo systemctl status redis-server

# 연결 테스트
mysql -u community_user -p -h localhost community_db
redis-cli ping
```

#### 3. 의존성 설치 오류
```bash
# 캐시 정리
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 4. 환경 변수 문제
```bash
# 환경 변수 확인
echo $NODE_ENV
echo $DATABASE_HOST

# .env 파일 확인
cat .env
```

### 성능 최적화

#### 1. 개발 서버 성능
```javascript
// webpack.config.js (프론트엔드)
module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};
```

#### 2. 데이터베이스 성능
```sql
-- 인덱스 생성
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);

-- 쿼리 최적화
EXPLAIN SELECT * FROM posts WHERE author_id = ? ORDER BY created_at DESC;
```

## 📚 추가 리소스

### 문서 링크
- [Node.js 공식 문서](https://nodejs.org/docs/)
- [React 공식 문서](https://reactjs.org/docs/)
- [Express.js 가이드](https://expressjs.com/guide/)
- [MariaDB 문서](https://mariadb.org/documentation/)
- [Redis 문서](https://redis.io/documentation)

### 유용한 도구
- [Postman](https://www.postman.com/) - API 테스트
- [Insomnia](https://insomnia.rest/) - API 클라이언트
- [DBeaver](https://dbeaver.io/) - 데이터베이스 관리
- [RedisInsight](https://redislabs.com/redis-enterprise/redis-insight/) - Redis 관리

---

*이 가이드는 커뮤니티 플랫폼 v2.0.0 개발 환경을 기준으로 작성되었습니다.*  
*최신 업데이트: 2024년 7월 29일*
