# Social Features Deployment Guide
# 소셜 기능 배포 가이드

**버전**: 2.0  
**최종 업데이트**: 2025-11-10  
**대상**: DevOps 엔지니어, 시스템 관리자

---

## 📋 목차

1. [사전 요구사항](#사전-요구사항)
2. [환경 설정](#환경-설정)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [애플리케이션 배포](#애플리케이션-배포)
5. [프록시 서버 설정](#프록시-서버-설정)
6. [모니터링 설정](#모니터링-설정)
7. [보안 설정](#보안-설정)
8. [배포 검증](#배포-검증)
9. [롤백 절차](#롤백-절차)
10. [문제 해결](#문제-해결)

---

## 🔧 사전 요구사항

### 하드웨어 요구사항

#### 최소 사양
- **CPU**: 2 코어
- **RAM**: 4GB
- **Disk**: 50GB SSD
- **Network**: 100Mbps

#### 권장 사양 (프로덕션)
- **CPU**: 4 코어 이상
- **RAM**: 8GB 이상
- **Disk**: 100GB SSD
- **Network**: 1Gbps

### 소프트웨어 요구사항

| 소프트웨어 | 버전            | 용도          |
| ---------- | --------------- | ------------- |
| Node.js    | 18.x 이상       | 백엔드 실행   |
| MySQL      | 8.0 이상        | 데이터베이스  |
| Redis      | 7.0 이상 (선택) | 캐싱          |
| Nginx      | 1.24 이상       | 리버스 프록시 |
| PM2        | 5.x 이상        | 프로세스 관리 |
| Git        | 2.x 이상        | 코드 배포     |

### 네트워크 요구사항

#### 포트 설정
- **3000**: Node.js 애플리케이션 (내부)
- **3306**: MySQL (내부)
- **6379**: Redis (내부)
- **80**: HTTP (외부)
- **443**: HTTPS (외부)

#### 방화벽 규칙

```bash
# HTTP/HTTPS 허용
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# SSH 허용
sudo ufw allow 22/tcp

# 방화벽 활성화
sudo ufw enable
```

---

## ⚙️ 환경 설정

### 1. 시스템 사용자 생성

```bash
# community 사용자 생성
sudo useradd -m -s /bin/bash community
sudo usermod -aG sudo community

# 디렉토리 생성
sudo mkdir -p /opt/community
sudo chown -R community:community /opt/community
```

### 2. Node.js 설치

```bash
# NodeSource 저장소 추가
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js 설치
sudo apt-get install -y nodejs

# 버전 확인
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 3. PM2 설치

```bash
# PM2 전역 설치
sudo npm install -g pm2

# 부팅 시 자동 시작 설정
pm2 startup systemd -u community --hp /home/community
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u community --hp /home/community
```

### 4. MySQL 설치

```bash
# MySQL Server 설치
sudo apt-get update
sudo apt-get install -y mysql-server

# MySQL 보안 설정
sudo mysql_secure_installation

# MySQL 서비스 시작
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 5. Redis 설치 (선택)

```bash
# Redis 설치
sudo apt-get install -y redis-server

# Redis 설정 파일 수정
sudo nano /etc/redis/redis.conf
# bind 127.0.0.1
# maxmemory 2gb
# maxmemory-policy allkeys-lru

# Redis 서비스 재시작
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### 6. Nginx 설치

```bash
# Nginx 설치
sudo apt-get install -y nginx

# Nginx 서비스 시작
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🗄️ 데이터베이스 설정

### 1. 데이터베이스 생성

```bash
# MySQL 접속
sudo mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE community CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'community_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON community.* TO 'community_user'@'localhost';
FLUSH PRIVILEGES;

# 연결 테스트
mysql -u community_user -p community
```

### 2. 스키마 마이그레이션

```bash
# 코드 디렉토리로 이동
cd /opt/community

# 마이그레이션 파일 확인
ls -l server-backend/migrations/

# 마이그레이션 실행
mysql -u community_user -p community < server-backend/migrations/001_social_features.sql
```

#### 마이그레이션 SQL

```sql
-- server-backend/migrations/001_social_features.sql

-- 팔로우 테이블
CREATE TABLE IF NOT EXISTS follows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_follow (follower_id, following_id),
    INDEX idx_follower (follower_id),
    INDEX idx_following (following_id),
    INDEX idx_created (created_at),
    
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    
    CHECK (follower_id <> following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 멘션 테이블
CREATE TABLE IF NOT EXISTS mentions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mentioner_id INT NOT NULL,
    mentioned_user_id INT NOT NULL,
    post_id INT,
    comment_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    
    INDEX idx_mentioned (mentioned_user_id, is_read),
    INDEX idx_mentioner (mentioner_id),
    INDEX idx_post (post_id),
    INDEX idx_comment (comment_id),
    INDEX idx_created (created_at),
    
    FOREIGN KEY (mentioner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 공유 테이블
CREATE TABLE IF NOT EXISTS post_shares (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT,
    platform ENUM('twitter', 'facebook', 'linkedin', 'clipboard') NOT NULL,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_post_platform (post_id, platform),
    INDEX idx_user (user_id),
    INDEX idx_shared_at (shared_at),
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 차단 테이블
CREATE TABLE IF NOT EXISTS blocked_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    blocker_id INT NOT NULL,
    blocked_id INT NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_block (blocker_id, blocked_id),
    INDEX idx_blocker (blocker_id),
    INDEX idx_blocked (blocked_id),
    INDEX idx_created (created_at),
    
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    
    CHECK (blocker_id <> blocked_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. 데이터베이스 최적화

```sql
-- 인덱스 통계 업데이트
ANALYZE TABLE follows;
ANALYZE TABLE mentions;
ANALYZE TABLE post_shares;
ANALYZE TABLE blocked_users;

-- 테이블 최적화
OPTIMIZE TABLE follows;
OPTIMIZE TABLE mentions;
OPTIMIZE TABLE post_shares;
OPTIMIZE TABLE blocked_users;
```

---

## 🚀 애플리케이션 배포

### 1. 코드 배포

```bash
# community 사용자로 전환
su - community

# 애플리케이션 디렉토리로 이동
cd /opt/community

# Git 저장소 클론 (최초 배포)
git clone https://github.com/your-org/community.git .

# 또는 최신 코드 가져오기 (업데이트)
git fetch origin
git checkout main
git pull origin main

# 의존성 설치
cd server-backend
npm ci --production

# 빌드 (필요한 경우)
npm run build
```

### 2. 환경 변수 설정

```bash
# .env 파일 생성
cd /opt/community/server-backend
nano .env
```

#### .env 파일 내용

```bash
# 환경 설정
NODE_ENV=production
PORT=3000

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_NAME=community
DB_USER=community_user
DB_PASSWORD=strong_password_here
DB_CONNECTION_LIMIT=100

# JWT 설정
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Redis 설정 (선택)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_ENABLED=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000  # 1시간
RATE_LIMIT_MAX_REQUESTS=300   # 시간당 300회

# CORS 설정
CORS_ORIGIN=https://community.example.com

# 로깅
LOG_LEVEL=info
LOG_FILE=/var/log/community/app.log

# 소셜 기능 설정
SOCIAL_FOLLOW_LIMIT=100        # 일일 팔로우 한도
SOCIAL_MENTION_LIMIT=100       # 시간당 멘션 한도
SOCIAL_SHARE_LIMIT=100         # 시간당 공유 한도
SOCIAL_BLOCK_LIMIT=20          # 시간당 차단 한도
SOCIAL_MAX_BLOCKS=1000         # 최대 차단 수

# 외부 서비스 URL
FRONTEND_URL=https://community.example.com
API_BASE_URL=https://api.community.example.com
```

### 3. PM2 설정

```bash
# PM2 ecosystem 파일 생성
cd /opt/community/server-backend
nano ecosystem.config.js
```

#### ecosystem.config.js

```javascript
module.exports = {
  apps: [
    {
      name: 'community-backend',
      script: './src/server.js',
      instances: 'max',  // CPU 코어 수만큼 인스턴스 생성
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/community/pm2-error.log',
      out_file: '/var/log/community/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};
```

### 4. 로그 디렉토리 생성

```bash
# 로그 디렉토리 생성
sudo mkdir -p /var/log/community
sudo chown -R community:community /var/log/community

# 로그 로테이션 설정
sudo nano /etc/logrotate.d/community
```

#### /etc/logrotate.d/community

```bash
/var/log/community/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 community community
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 5. 애플리케이션 시작

```bash
# PM2로 애플리케이션 시작
cd /opt/community/server-backend
pm2 start ecosystem.config.js

# 상태 확인
pm2 status

# 로그 확인
pm2 logs community-backend

# PM2 설정 저장 (부팅 시 자동 시작)
pm2 save
```

---

## 🔄 프록시 서버 설정

### Nginx 설정

```bash
# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/community
```

#### /etc/nginx/sites-available/community

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=social_limit:10m rate=5r/s;

# Upstream backend
upstream community_backend {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name community.example.com api.community.example.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name api.community.example.com;
    
    # SSL 설정
    ssl_certificate /etc/letsencrypt/live/community.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/community.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # 로깅
    access_log /var/log/nginx/community-access.log;
    error_log /var/log/nginx/community-error.log;
    
    # 최대 업로드 크기
    client_max_body_size 10M;
    
    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # API 엔드포인트
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://community_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 소셜 기능 API (더 낮은 rate limit)
    location /api/social/ {
        limit_req zone=social_limit burst=10 nodelay;
        
        proxy_pass http://community_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check
    location /health {
        proxy_pass http://community_backend;
        access_log off;
    }
}
```

### Nginx 활성화

```bash
# 설정 파일 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/community /etc/nginx/sites-enabled/

# 기본 설정 비활성화 (선택)
sudo rm /etc/nginx/sites-enabled/default

# 설정 파일 문법 검사
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

### SSL 인증서 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt-get install -y certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d community.example.com -d api.community.example.com

# 자동 갱신 설정 확인
sudo certbot renew --dry-run

# Cron으로 자동 갱신 (매일 실행)
echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'" | sudo crontab -
```

---

## 📊 모니터링 설정

### 1. PM2 Monitoring

```bash
# PM2 모니터링 대시보드
pm2 monit

# 메모리 사용량 확인
pm2 status

# 로그 실시간 확인
pm2 logs community-backend --lines 100
```

### 2. Health Check 엔드포인트

```javascript
// server-backend/src/routes/health.js
const express = require('express');
const router = express.Router();
const db = require('../database/database');

router.get('/health', async (req, res) => {
    try {
        // DB 연결 확인
        await db.query('SELECT 1');
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: 'connected'
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

module.exports = router;
```

### 3. 알림 설정 (선택)

```bash
# PM2 Plus 설정 (유료)
pm2 link <secret_key> <public_key>

# 또는 커스텀 알림 스크립트
nano /opt/community/scripts/health-check.sh
```

#### health-check.sh

```bash
#!/bin/bash

# Health check 스크립트
URL="https://api.community.example.com/health"
ALERT_EMAIL="admin@example.com"

response=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $response -ne 200 ]; then
    echo "Health check failed with status code: $response" | \
        mail -s "Community API Health Check Failed" $ALERT_EMAIL
fi
```

```bash
# 실행 권한 부여
chmod +x /opt/community/scripts/health-check.sh

# Cron 등록 (5분마다)
crontab -e
# */5 * * * * /opt/community/scripts/health-check.sh
```

---

## 🔒 보안 설정

### 1. 방화벽 설정

```bash
# UFW 방화벽 설정
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. Fail2Ban 설정

```bash
# Fail2Ban 설치
sudo apt-get install -y fail2ban

# Nginx용 jail 설정
sudo nano /etc/fail2ban/jail.local
```

#### /etc/fail2ban/jail.local

```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 600
```

```bash
# Fail2Ban 재시작
sudo systemctl restart fail2ban
```

### 3. 파일 권한 설정

```bash
# 애플리케이션 파일 권한
sudo chown -R community:community /opt/community
sudo chmod -R 755 /opt/community
sudo chmod 600 /opt/community/server-backend/.env

# 로그 파일 권한
sudo chown -R community:community /var/log/community
sudo chmod -R 640 /var/log/community
```

### 4. 데이터베이스 보안

```sql
-- MySQL 보안 설정
-- 원격 접속 비활성화 (필요한 경우만 허용)
UPDATE mysql.user SET Host='localhost' WHERE User='community_user';
FLUSH PRIVILEGES;

-- 불필요한 계정 삭제
DROP USER IF EXISTS ''@'localhost';
DROP USER IF EXISTS ''@'%';

-- 비밀번호 정책 설정
SET GLOBAL validate_password.policy=STRONG;
SET GLOBAL validate_password.length=12;
```

---

## ✅ 배포 검증

### 1. 서비스 상태 확인

```bash
# PM2 상태
pm2 status

# Nginx 상태
sudo systemctl status nginx

# MySQL 상태
sudo systemctl status mysql

# Redis 상태 (사용하는 경우)
sudo systemctl status redis-server
```

### 2. API 테스트

```bash
# Health check
curl https://api.community.example.com/health

# 팔로우 API 테스트 (인증 필요)
curl -X GET "https://api.community.example.com/api/social/follow/stats/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 응답 시간 측정
time curl -s https://api.community.example.com/health > /dev/null
```

### 3. 데이터베이스 테스트

```sql
-- 테이블 존재 확인
SHOW TABLES LIKE '%follow%';
SHOW TABLES LIKE '%mention%';
SHOW TABLES LIKE '%share%';
SHOW TABLES LIKE '%block%';

-- 인덱스 확인
SHOW INDEX FROM follows;
SHOW INDEX FROM mentions;
SHOW INDEX FROM post_shares;
SHOW INDEX FROM blocked_users;

-- 테스트 데이터 삽입
INSERT INTO follows (follower_id, following_id) VALUES (1, 2);
SELECT * FROM follows WHERE follower_id = 1;
DELETE FROM follows WHERE follower_id = 1 AND following_id = 2;
```

### 4. 로그 확인

```bash
# PM2 로그
pm2 logs community-backend --lines 50

# Nginx 로그
sudo tail -f /var/log/nginx/community-access.log
sudo tail -f /var/log/nginx/community-error.log

# 애플리케이션 로그
tail -f /var/log/community/app.log
```

### 5. 성능 테스트

```bash
# Apache Bench 설치
sudo apt-get install -y apache2-utils

# 간단한 부하 테스트 (100개 요청, 동시 10개)
ab -n 100 -c 10 https://api.community.example.com/health

# 소셜 API 부하 테스트
ab -n 100 -c 10 -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.community.example.com/api/social/follow/stats/1
```

---

## 🔄 롤백 절차

### 1. 코드 롤백

```bash
# 이전 커밋으로 롤백
cd /opt/community
git log --oneline -10  # 최근 커밋 확인
git checkout <previous_commit_hash>

# 의존성 재설치
cd server-backend
npm ci --production

# PM2 재시작
pm2 restart community-backend
```

### 2. 데이터베이스 롤백

```bash
# 백업에서 복원
mysql -u community_user -p community < /var/backups/mysql/community_YYYYMMDD.sql

# 또는 특정 테이블만 복원
mysql -u community_user -p community < /var/backups/mysql/social_tables_YYYYMMDD.sql
```

### 3. 설정 롤백

```bash
# .env 파일 롤백
cp /opt/community/server-backend/.env.backup /opt/community/server-backend/.env

# Nginx 설정 롤백
sudo cp /etc/nginx/sites-available/community.backup /etc/nginx/sites-available/community
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 전체 롤백 스크립트

```bash
#!/bin/bash
# rollback.sh

echo "Starting rollback..."

# 코드 롤백
cd /opt/community
git checkout $1  # 커밋 해시를 인자로 받음

# 의존성 재설치
cd server-backend
npm ci --production

# PM2 재시작
pm2 restart community-backend

# 상태 확인
sleep 5
pm2 status
curl https://api.community.example.com/health

echo "Rollback completed!"
```

---

## 🔧 문제 해결

### 일반적인 문제

#### 1. 애플리케이션이 시작되지 않음

**증상**: PM2에서 애플리케이션이 계속 재시작됨

**원인 확인**:
```bash
pm2 logs community-backend --err
```

**일반적인 원인**:
- 환경 변수 누락 또는 잘못된 값
- 데이터베이스 연결 실패
- 포트 충돌

**해결**:
```bash
# 환경 변수 확인
cat /opt/community/server-backend/.env

# 데이터베이스 연결 테스트
mysql -u community_user -p -e "SELECT 1"

# 포트 사용 확인
sudo netstat -tlnp | grep 3000
```

#### 2. 502 Bad Gateway

**증상**: Nginx가 502 에러 반환

**원인 확인**:
```bash
# Nginx 에러 로그
sudo tail -f /var/log/nginx/community-error.log

# Backend 상태
pm2 status
```

**해결**:
```bash
# Backend 재시작
pm2 restart community-backend

# Nginx 재시작
sudo systemctl restart nginx
```

#### 3. 느린 응답 속도

**증상**: API 응답이 2초 이상 걸림

**원인 확인**:
```sql
-- 느린 쿼리 확인
SELECT * FROM mysql.slow_log
WHERE db = 'community'
ORDER BY query_time DESC
LIMIT 10;
```

**해결**:
```sql
-- 인덱스 추가
CREATE INDEX idx_missing ON table_name(column_name);

-- 테이블 최적화
OPTIMIZE TABLE follows;
```

#### 4. 메모리 부족

**증상**: PM2가 자동으로 재시작, 서버 느려짐

**원인 확인**:
```bash
# 메모리 사용량
free -h
pm2 status
```

**해결**:
```bash
# PM2 메모리 제한 조정
pm2 delete community-backend
pm2 start ecosystem.config.js

# 시스템 스왑 증가 (임시)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📝 체크리스트

### 배포 전 체크리스트

- [ ] 모든 테스트 통과 확인
- [ ] 환경 변수 설정 완료
- [ ] 데이터베이스 백업 완료
- [ ] SSL 인증서 유효성 확인
- [ ] 방화벽 규칙 설정 완료
- [ ] 모니터링 알림 설정 완료
- [ ] 롤백 계획 수립 완료
- [ ] 팀원에게 배포 공지

### 배포 후 체크리스트

- [ ] Health check 엔드포인트 정상
- [ ] 모든 API 엔드포인트 테스트
- [ ] 데이터베이스 연결 확인
- [ ] Redis 연결 확인 (사용 시)
- [ ] 로그 정상 생성 확인
- [ ] 성능 테스트 통과
- [ ] 에러율 모니터링
- [ ] 사용자 피드백 모니터링

---

## 📞 지원

### 문의

- **DevOps 팀**: devops@community.example.com
- **긴급 연락처**: +82-10-1234-5678
- **Slack**: #deployments
- **문서**: https://docs.community.example.com/deployment

### 추가 리소스

- [API 문서](./SOCIAL_FEATURES_API_REFERENCE.md)
- [관리자 가이드](./SOCIAL_FEATURES_ADMIN_GUIDE.md)
- [사용자 가이드](./SOCIAL_FEATURES_USER_GUIDE.md)
- [테스팅 가이드](./TESTING_GUIDE.md)

---

**가이드 버전**: 2.0  
**최종 업데이트**: 2025-11-10  
**담당자**: DevOps Team
