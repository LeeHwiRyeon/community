# 🚀 운영 매뉴얼

## 📋 개요

커뮤니티 플랫폼 v2.0.0의 운영 및 관리 매뉴얼입니다.

## 🖥️ 시스템 관리

### 서버 관리

#### 서버 상태 확인
```bash
# 시스템 리소스 확인
htop
free -h
df -h

# 서비스 상태 확인
systemctl status community-backend
systemctl status community-frontend
systemctl status mariadb
systemctl status redis-server

# 포트 사용 확인
netstat -tulpn | grep :50000
netstat -tulpn | grep :3000
netstat -tulpn | grep :3306
netstat -tulpn | grep :6379
```

#### 서버 시작/중지
```bash
# 백엔드 서버
systemctl start community-backend
systemctl stop community-backend
systemctl restart community-backend

# 프론트엔드 서버
systemctl start community-frontend
systemctl stop community-frontend
systemctl restart community-frontend

# 데이터베이스
systemctl start mariadb
systemctl stop mariadb
systemctl restart mariadb

# Redis
systemctl start redis-server
systemctl stop redis-server
systemctl restart redis-server
```

#### 로그 확인
```bash
# 애플리케이션 로그
tail -f /var/log/community/backend.log
tail -f /var/log/community/frontend.log

# 시스템 로그
journalctl -u community-backend -f
journalctl -u community-frontend -f

# 데이터베이스 로그
tail -f /var/log/mysql/error.log
tail -f /var/log/mysql/slow.log

# Redis 로그
tail -f /var/log/redis/redis-server.log
```

### 데이터베이스 관리

#### 백업
```bash
# 전체 데이터베이스 백업
mysqldump -u root -p --all-databases > backup_$(date +%Y%m%d_%H%M%S).sql

# 특정 데이터베이스 백업
mysqldump -u root -p community_db > community_backup_$(date +%Y%m%d_%H%M%S).sql

# 압축 백업
mysqldump -u root -p community_db | gzip > community_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# 자동 백업 스크립트
#!/bin/bash
BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mysqldump -u root -p community_db | gzip > $BACKUP_DIR/community_$DATE.sql.gz
find $BACKUP_DIR -name "community_*.sql.gz" -mtime +7 -delete
```

#### 복원
```bash
# 전체 데이터베이스 복원
mysql -u root -p < backup_20240729_120000.sql

# 특정 데이터베이스 복원
mysql -u root -p community_db < community_backup_20240729_120000.sql

# 압축 파일 복원
gunzip < community_backup_20240729_120000.sql.gz | mysql -u root -p community_db
```

#### 성능 최적화
```sql
-- 쿼리 성능 분석
EXPLAIN SELECT * FROM posts WHERE author_id = ? ORDER BY created_at DESC;

-- 인덱스 생성
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at);

-- 테이블 최적화
OPTIMIZE TABLE posts;
OPTIMIZE TABLE comments;
OPTIMIZE TABLE users;

-- 통계 업데이트
ANALYZE TABLE posts;
ANALYZE TABLE comments;
ANALYZE TABLE users;
```

### Redis 관리

#### Redis 상태 확인
```bash
# Redis 연결 확인
redis-cli ping

# Redis 정보 확인
redis-cli info

# 메모리 사용량 확인
redis-cli info memory

# 키 개수 확인
redis-cli dbsize
```

#### Redis 백업
```bash
# RDB 백업
redis-cli bgsave

# AOF 백업
redis-cli bgrewriteaof

# 백업 파일 확인
ls -la /var/lib/redis/
```

#### Redis 정리
```bash
# 만료된 키 정리
redis-cli --scan --pattern "*" | xargs redis-cli del

# 특정 패턴 키 삭제
redis-cli --scan --pattern "session:*" | xargs redis-cli del

# 메모리 정리
redis-cli memory purge
```

## 📊 모니터링

### 성능 모니터링

#### 시스템 리소스 모니터링
```bash
# CPU 사용률
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1

# 메모리 사용률
free | grep Mem | awk '{printf "%.2f%%", $3/$2 * 100.0}'

# 디스크 사용률
df -h | grep -E '^/dev/' | awk '{print $5}' | sed 's/%//'

# 네트워크 사용량
cat /proc/net/dev | grep eth0 | awk '{print $2, $10}'
```

#### 애플리케이션 모니터링
```bash
# API 응답 시간 확인
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:50000/api/health"

# curl-format.txt 내용:
#      time_namelookup:  %{time_namelookup}\n
#         time_connect:  %{time_connect}\n
#      time_appconnect:  %{time_appconnect}\n
#     time_pretransfer:  %{time_pretransfer}\n
#        time_redirect:  %{time_redirect}\n
#   time_starttransfer:  %{time_starttransfer}\n
#                      ----------\n
#           time_total:  %{time_total}\n

# 데이터베이스 연결 확인
mysql -u root -p -e "SHOW PROCESSLIST;"

# Redis 연결 확인
redis-cli info clients
```

### 로그 모니터링

#### 로그 분석 스크립트
```bash
#!/bin/bash
# error_count.sh - 에러 로그 분석

LOG_FILE="/var/log/community/backend.log"
DATE=$(date +%Y-%m-%d)

# 오늘 발생한 에러 수
ERROR_COUNT=$(grep "$DATE" $LOG_FILE | grep -c "ERROR")

# 에러 유형별 분석
echo "=== 에러 유형별 분석 ==="
grep "$DATE" $LOG_FILE | grep "ERROR" | awk '{print $5}' | sort | uniq -c | sort -nr

# 가장 많이 발생한 에러
echo "=== 가장 많이 발생한 에러 ==="
grep "$DATE" $LOG_FILE | grep "ERROR" | awk -F'ERROR:' '{print $2}' | sort | uniq -c | sort -nr | head -10
```

#### 실시간 모니터링
```bash
# 실시간 에러 모니터링
tail -f /var/log/community/backend.log | grep --color=always "ERROR\|WARN"

# 실시간 접근 로그 모니터링
tail -f /var/log/nginx/access.log | grep --color=always "POST\|PUT\|DELETE"

# 실시간 데이터베이스 쿼리 모니터링
mysql -u root -p -e "SET GLOBAL general_log = 'ON';"
tail -f /var/lib/mysql/general.log
```

## 🔧 유지보수

### 정기 유지보수 작업

#### 일일 작업
```bash
#!/bin/bash
# daily_maintenance.sh

echo "=== 일일 유지보수 시작 ==="

# 1. 로그 파일 정리
find /var/log/community -name "*.log" -mtime +7 -delete

# 2. 임시 파일 정리
find /tmp -name "community_*" -mtime +1 -delete

# 3. 데이터베이스 최적화
mysql -u root -p -e "OPTIMIZE TABLE posts, comments, users;"

# 4. Redis 메모리 정리
redis-cli memory purge

# 5. 디스크 공간 확인
df -h | awk '$5 > 80 {print "경고: " $0}'

echo "=== 일일 유지보수 완료 ==="
```

#### 주간 작업
```bash
#!/bin/bash
# weekly_maintenance.sh

echo "=== 주간 유지보수 시작 ==="

# 1. 데이터베이스 백업
mysqldump -u root -p community_db | gzip > /backup/weekly/community_$(date +%Y%m%d).sql.gz

# 2. 로그 분석 및 보고서 생성
./log_analysis.sh > /reports/weekly_$(date +%Y%m%d).txt

# 3. 성능 통계 수집
./performance_stats.sh > /reports/performance_$(date +%Y%m%d).txt

# 4. 보안 업데이트 확인
apt list --upgradable | grep -E "(security|critical)"

echo "=== 주간 유지보수 완료 ==="
```

#### 월간 작업
```bash
#!/bin/bash
# monthly_maintenance.sh

echo "=== 월간 유지보수 시작 ==="

# 1. 전체 시스템 백업
tar -czf /backup/monthly/system_$(date +%Y%m).tar.gz /var/www/community /etc/community

# 2. 데이터베이스 통계 분석
mysql -u root -p -e "ANALYZE TABLE posts, comments, users;"

# 3. 오래된 백업 파일 정리
find /backup -name "*.sql.gz" -mtime +90 -delete

# 4. 로그 아카이브
tar -czf /backup/logs/logs_$(date +%Y%m).tar.gz /var/log/community

echo "=== 월간 유지보수 완료 ==="
```

### 업데이트 및 배포

#### 애플리케이션 업데이트
```bash
#!/bin/bash
# update_application.sh

echo "=== 애플리케이션 업데이트 시작 ==="

# 1. 현재 버전 백업
cp -r /var/www/community /var/www/community.backup.$(date +%Y%m%d_%H%M%S)

# 2. 코드 업데이트
cd /var/www/community
git pull origin main

# 3. 의존성 업데이트
cd server-backend
npm install --production

cd ../frontend
npm install --production

# 4. 데이터베이스 마이그레이션
cd ../server-backend
npm run migrate

# 5. 애플리케이션 재시작
systemctl restart community-backend
systemctl restart community-frontend

# 6. 상태 확인
sleep 10
curl -f http://localhost:50000/api/health || echo "백엔드 시작 실패"
curl -f http://localhost:3000 || echo "프론트엔드 시작 실패"

echo "=== 애플리케이션 업데이트 완료 ==="
```

#### 롤백 절차
```bash
#!/bin/bash
# rollback_application.sh

BACKUP_DIR="/var/www/community.backup.$1"

if [ -z "$1" ]; then
    echo "사용법: $0 <백업_디렉토리_이름>"
    exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
    echo "백업 디렉토리를 찾을 수 없습니다: $BACKUP_DIR"
    exit 1
fi

echo "=== 애플리케이션 롤백 시작 ==="

# 1. 현재 버전 중지
systemctl stop community-backend
systemctl stop community-frontend

# 2. 현재 버전 백업
mv /var/www/community /var/www/community.failed.$(date +%Y%m%d_%H%M%S)

# 3. 이전 버전 복원
cp -r $BACKUP_DIR /var/www/community

# 4. 서비스 재시작
systemctl start community-backend
systemctl start community-frontend

# 5. 상태 확인
sleep 10
curl -f http://localhost:50000/api/health || echo "롤백 실패"

echo "=== 애플리케이션 롤백 완료 ==="
```

## 🚨 장애 대응

### 일반적인 장애 유형

#### 1. 서비스 응답 없음
```bash
# 원인 진단
systemctl status community-backend
systemctl status community-frontend
journalctl -u community-backend --since "1 hour ago"
journalctl -u community-frontend --since "1 hour ago"

# 해결 방법
systemctl restart community-backend
systemctl restart community-frontend
```

#### 2. 데이터베이스 연결 오류
```bash
# 원인 진단
systemctl status mariadb
mysql -u root -p -e "SHOW PROCESSLIST;"
netstat -tulpn | grep :3306

# 해결 방법
systemctl restart mariadb
mysql -u root -p -e "FLUSH TABLES;"
```

#### 3. 메모리 부족
```bash
# 원인 진단
free -h
ps aux --sort=-%mem | head -10

# 해결 방법
# 1. 불필요한 프로세스 종료
pkill -f "node.*community"

# 2. 메모리 정리
echo 3 > /proc/sys/vm/drop_caches

# 3. 서비스 재시작
systemctl restart community-backend
```

#### 4. 디스크 공간 부족
```bash
# 원인 진단
df -h
du -sh /var/log/community/*
du -sh /var/lib/mysql/*

# 해결 방법
# 1. 로그 파일 정리
find /var/log/community -name "*.log" -mtime +7 -delete

# 2. 데이터베이스 정리
mysql -u root -p -e "PURGE BINARY LOGS BEFORE DATE_SUB(NOW(), INTERVAL 7 DAY);"

# 3. 임시 파일 정리
rm -rf /tmp/community_*
```

### 긴급 상황 대응

#### 1. 서비스 완전 중단
```bash
#!/bin/bash
# emergency_recovery.sh

echo "=== 긴급 복구 시작 ==="

# 1. 모든 서비스 중지
systemctl stop community-backend
systemctl stop community-frontend
systemctl stop nginx

# 2. 시스템 리소스 확인
free -h
df -h

# 3. 로그 확인
tail -100 /var/log/community/backend.log

# 4. 데이터베이스 상태 확인
mysql -u root -p -e "SHOW PROCESSLIST;"

# 5. 서비스 순차 재시작
systemctl start mariadb
sleep 5
systemctl start redis-server
sleep 5
systemctl start community-backend
sleep 10
systemctl start community-frontend
sleep 5
systemctl start nginx

# 6. 상태 확인
curl -f http://localhost:50000/api/health
curl -f http://localhost:3000

echo "=== 긴급 복구 완료 ==="
```

#### 2. 데이터 손실 상황
```bash
#!/bin/bash
# data_recovery.sh

echo "=== 데이터 복구 시작 ==="

# 1. 최신 백업 확인
ls -la /backup/daily/ | tail -5

# 2. 데이터베이스 중지
systemctl stop community-backend
systemctl stop mariadb

# 3. 현재 데이터 백업
cp -r /var/lib/mysql/community_db /var/lib/mysql/community_db.corrupted.$(date +%Y%m%d_%H%M%S)

# 4. 백업에서 복원
LATEST_BACKUP=$(ls -t /backup/daily/community_*.sql.gz | head -1)
gunzip < $LATEST_BACKUP | mysql -u root -p community_db

# 5. 서비스 재시작
systemctl start mariadb
systemctl start community-backend

echo "=== 데이터 복구 완료 ==="
```

## 📈 성능 최적화

### 데이터베이스 최적화
```sql
-- 쿼리 성능 분석
EXPLAIN SELECT p.*, u.username 
FROM posts p 
JOIN users u ON p.author_id = u.id 
WHERE p.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY p.created_at DESC;

-- 인덱스 최적화
CREATE INDEX idx_posts_created_author ON posts(created_at DESC, author_id);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at DESC);

-- 테이블 파티셔닝 (대용량 데이터)
ALTER TABLE posts PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### 애플리케이션 최적화
```javascript
// 캐싱 전략
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = redis.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      redis.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};

// 데이터베이스 연결 풀 최적화
const dbConfig = {
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};
```

## 📞 연락처 및 지원

### 내부 연락처
- **시스템 관리자**: admin@company.com
- **개발팀**: dev@company.com
- **긴급 연락처**: +82-10-1234-5678

### 외부 지원
- **클라우드 서비스**: AWS Support
- **데이터베이스**: MariaDB Community
- **캐시**: Redis Support

### 문서 및 리소스
- **내부 위키**: https://wiki.company.com/community
- **API 문서**: https://api.company.com/docs
- **모니터링 대시보드**: https://monitor.company.com

---

*이 매뉴얼은 커뮤니티 플랫폼 v2.0.0 운영 환경을 기준으로 작성되었습니다.*  
*최신 업데이트: 2024년 7월 29일*
