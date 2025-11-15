# 백업 & 복구 전략 가이드 (Backup & Recovery Strategy)

## 📋 목차
- [1. 개요](#1-개요)
- [2. 백업 전략](#2-백업-전략)
- [3. 자동 백업 시스템](#3-자동-백업-시스템)
- [4. 데이터 복구 절차](#4-데이터-복구-절차)
- [5. 재해 복구 계획 (DRP)](#5-재해-복구-계획-drp)
- [6. 데이터 무결성 검증](#6-데이터-무결성-검증)
- [7. 백업 모니터링](#7-백업-모니터링)
- [8. 복구 테스트](#8-복구-테스트)
- [9. 체크리스트](#9-체크리스트)
- [10. 구현 로드맵](#10-구현-로드맵)

---

## 1. 개요

### 1.1 목표

데이터 손실을 방지하고 재해 발생 시 빠른 복구를 보장하는 종합적인 백업 & 복구 시스템 구축

### 1.2 핵심 지표

| 지표                               | 목표   | 설명                         |
| ---------------------------------- | ------ | ---------------------------- |
| **RPO** (Recovery Point Objective) | 1시간  | 허용 가능한 최대 데이터 손실 |
| **RTO** (Recovery Time Objective)  | 4시간  | 목표 복구 시간               |
| **백업 빈도**                      | 일 4회 | 데이터베이스 백업 주기       |
| **백업 보관**                      | 30일   | 백업 데이터 보관 기간        |
| **복구 성공률**                    | 99.9%  | 복구 테스트 성공률 목표      |

### 1.3 백업 대상

- **MySQL 데이터베이스**: 사용자, 게시글, 댓글, 알림
- **파일 시스템**: 프로필 이미지, 첨부 파일
- **Redis 데이터**: 캐시, 세션
- **Elasticsearch 인덱스**: 검색 데이터
- **애플리케이션 코드**: 소스 코드, 설정 파일
- **로그 파일**: 애플리케이션 로그, 액세스 로그

---

## 2. 백업 전략

### 2.1 백업 유형

#### 전체 백업 (Full Backup)

**특징**:
- 모든 데이터 완전 백업
- 복구 시간 최소화
- 스토리지 공간 많이 사용

**스케줄**: 매일 자정 (00:00)

**구현**:
```bash
#!/bin/bash
# full-backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/full"
DB_NAME="community_db"
DB_USER="backup_user"
DB_PASS="secure_password"

# MySQL 전체 백업
mysqldump --single-transaction \
    --routines \
    --triggers \
    --events \
    -u${DB_USER} \
    -p${DB_PASS} \
    ${DB_NAME} | gzip > ${BACKUP_DIR}/mysql_full_${DATE}.sql.gz

# 파일 시스템 백업
tar -czf ${BACKUP_DIR}/files_full_${DATE}.tar.gz /var/www/uploads

# Redis 백업
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb ${BACKUP_DIR}/redis_full_${DATE}.rdb

# Elasticsearch 백업
curl -X PUT "localhost:9200/_snapshot/my_backup/snapshot_${DATE}?wait_for_completion=true"

echo "Full backup completed: ${DATE}"
```

#### 증분 백업 (Incremental Backup)

**특징**:
- 마지막 백업 이후 변경된 데이터만
- 스토리지 공간 효율적
- 복구 시 여러 백업 필요

**스케줄**: 6시간마다 (06:00, 12:00, 18:00)

**구현**:
```bash
#!/bin/bash
# incremental-backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/incremental"
LAST_BACKUP=$(ls -t /backups/full/*.sql.gz | head -1)

# MySQL 바이너리 로그 백업
mysqlbinlog --read-from-remote-server \
    --host=localhost \
    --user=${DB_USER} \
    --password=${DB_PASS} \
    --raw \
    --result-file=${BACKUP_DIR}/binlog_${DATE}

# 최근 변경 파일만 백업
find /var/www/uploads -mmin -360 -type f \
    | tar -czf ${BACKUP_DIR}/files_incr_${DATE}.tar.gz -T -

echo "Incremental backup completed: ${DATE}"
```

#### 차등 백업 (Differential Backup)

**특징**:
- 마지막 전체 백업 이후 모든 변경사항
- 증분 백업보다 복구 간단
- 스토리지 사용량 중간

**스케줄**: 매일 정오 (12:00)

### 2.2 3-2-1 백업 규칙

```
3개의 복사본: 원본 + 백업 2개
2가지 매체: 로컬 디스크 + 클라우드
1개의 오프사이트: 다른 물리적 위치
```

**구현 예시**:
- **복사본 1**: 운영 서버 (원본)
- **복사본 2**: 로컬 NAS (백업 1)
- **복사본 3**: AWS S3 (백업 2, 오프사이트)

---

## 3. 자동 백업 시스템

### 3.1 Cron 스케줄 설정

```bash
# /etc/crontab

# 전체 백업 - 매일 자정
0 0 * * * root /opt/scripts/full-backup.sh >> /var/log/backup/full.log 2>&1

# 증분 백업 - 6시간마다
0 */6 * * * root /opt/scripts/incremental-backup.sh >> /var/log/backup/incremental.log 2>&1

# 백업 검증 - 매일 새벽 2시
0 2 * * * root /opt/scripts/verify-backup.sh >> /var/log/backup/verify.log 2>&1

# 오래된 백업 정리 - 매일 새벽 3시
0 3 * * * root /opt/scripts/cleanup-old-backups.sh >> /var/log/backup/cleanup.log 2>&1

# S3 동기화 - 매일 새벽 4시
0 4 * * * root /opt/scripts/sync-to-s3.sh >> /var/log/backup/s3-sync.log 2>&1
```

### 3.2 MySQL 백업 스크립트

```bash
#!/bin/bash
# mysql-backup.sh

set -e

# 설정
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="community_db"
DB_USER="backup_user"
DB_PASS="${MYSQL_BACKUP_PASSWORD}"
BACKUP_DIR="/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# 백업 디렉토리 생성
mkdir -p ${BACKUP_DIR}

# mysqldump 실행
echo "[$(date)] Starting MySQL backup..."

mysqldump \
    --host=${DB_HOST} \
    --port=${DB_PORT} \
    --user=${DB_USER} \
    --password=${DB_PASS} \
    --single-transaction \
    --quick \
    --lock-tables=false \
    --routines \
    --triggers \
    --events \
    --databases ${DB_NAME} \
    | gzip -9 > ${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz

# 백업 파일 크기 확인
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz"
FILE_SIZE=$(du -h ${BACKUP_FILE} | cut -f1)

echo "[$(date)] Backup completed: ${BACKUP_FILE} (${FILE_SIZE})"

# 체크섬 생성
md5sum ${BACKUP_FILE} > ${BACKUP_FILE}.md5

# 오래된 백업 삭제
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find ${BACKUP_DIR} -name "*.md5" -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Old backups cleaned up (older than ${RETENTION_DAYS} days)"

# 백업 성공 알림
curl -X POST https://api.slack.com/your-webhook \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"✅ MySQL Backup Successful: ${FILE_SIZE}\"}"
```

### 3.3 파일 시스템 백업

```bash
#!/bin/bash
# filesystem-backup.sh

set -e

UPLOAD_DIR="/var/www/uploads"
BACKUP_DIR="/backups/files"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

echo "[$(date)] Starting filesystem backup..."

# tar를 사용한 백업 (압축)
tar -czf ${BACKUP_DIR}/uploads_${DATE}.tar.gz \
    --exclude='*.tmp' \
    --exclude='cache/*' \
    ${UPLOAD_DIR}

# 백업 파일 크기
FILE_SIZE=$(du -h ${BACKUP_DIR}/uploads_${DATE}.tar.gz | cut -f1)

echo "[$(date)] Backup completed: ${FILE_SIZE}"

# 체크섬 생성
sha256sum ${BACKUP_DIR}/uploads_${DATE}.tar.gz > ${BACKUP_DIR}/uploads_${DATE}.tar.gz.sha256

# 오래된 백업 삭제
find ${BACKUP_DIR} -name "uploads_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Filesystem backup completed"
```

### 3.4 AWS S3 동기화

```bash
#!/bin/bash
# sync-to-s3.sh

set -e

BACKUP_DIR="/backups"
S3_BUCKET="s3://your-backup-bucket"
AWS_PROFILE="backup"

echo "[$(date)] Starting S3 sync..."

# AWS CLI를 사용한 동기화
aws s3 sync ${BACKUP_DIR} ${S3_BUCKET} \
    --profile ${AWS_PROFILE} \
    --storage-class GLACIER_IR \
    --exclude "*.log" \
    --exclude "tmp/*"

echo "[$(date)] S3 sync completed"

# 동기화 상태 확인
SYNCED_FILES=$(aws s3 ls ${S3_BUCKET} --recursive --profile ${AWS_PROFILE} | wc -l)

echo "[$(date)] Total files in S3: ${SYNCED_FILES}"

# Slack 알림
curl -X POST https://api.slack.com/your-webhook \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"☁️ S3 Sync Completed: ${SYNCED_FILES} files\"}"
```

### 3.5 Redis 백업

```bash
#!/bin/bash
# redis-backup.sh

set -e

REDIS_HOST="localhost"
REDIS_PORT="6379"
BACKUP_DIR="/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)

echo "[$(date)] Starting Redis backup..."

# Redis BGSAVE 트리거
redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT} BGSAVE

# BGSAVE 완료 대기
while [ $(redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT} LASTSAVE) -eq $(redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT} LASTSAVE) ]; do
    sleep 1
done

# dump.rdb 복사
cp /var/lib/redis/dump.rdb ${BACKUP_DIR}/dump_${DATE}.rdb

# 압축
gzip ${BACKUP_DIR}/dump_${DATE}.rdb

echo "[$(date)] Redis backup completed"
```

### 3.6 Elasticsearch 스냅샷

```bash
#!/bin/bash
# elasticsearch-backup.sh

set -e

ES_HOST="localhost:9200"
SNAPSHOT_REPO="backup_repository"
DATE=$(date +%Y%m%d_%H%M%S)
SNAPSHOT_NAME="snapshot_${DATE}"

echo "[$(date)] Starting Elasticsearch snapshot..."

# 스냅샷 생성
curl -X PUT "${ES_HOST}/_snapshot/${SNAPSHOT_REPO}/${SNAPSHOT_NAME}?wait_for_completion=true" \
    -H 'Content-Type: application/json' \
    -d'{
        "indices": "*",
        "ignore_unavailable": true,
        "include_global_state": false
    }'

echo "[$(date)] Elasticsearch snapshot completed: ${SNAPSHOT_NAME}"

# 오래된 스냅샷 삭제 (30일 이상)
SNAPSHOTS=$(curl -s "${ES_HOST}/_snapshot/${SNAPSHOT_REPO}/_all" | jq -r '.snapshots[].snapshot')

for snapshot in ${SNAPSHOTS}; do
    SNAPSHOT_DATE=$(echo $snapshot | grep -oP '\d{8}')
    DAYS_OLD=$(( ($(date +%s) - $(date -d $SNAPSHOT_DATE +%s)) / 86400 ))
    
    if [ $DAYS_OLD -gt 30 ]; then
        curl -X DELETE "${ES_HOST}/_snapshot/${SNAPSHOT_REPO}/${snapshot}"
        echo "[$(date)] Deleted old snapshot: ${snapshot}"
    fi
done
```

---

## 4. 데이터 복구 절차

### 4.1 MySQL 복구

#### 전체 복구

```bash
#!/bin/bash
# mysql-restore.sh

set -e

BACKUP_FILE="/backups/mysql/community_db_20251112_000000.sql.gz"
DB_NAME="community_db"
DB_USER="root"
DB_PASS="${MYSQL_ROOT_PASSWORD}"

echo "[$(date)] Starting MySQL restore from ${BACKUP_FILE}"

# 백업 파일 무결성 검증
echo "Verifying backup integrity..."
md5sum -c ${BACKUP_FILE}.md5

# 기존 데이터베이스 백업 (안전장치)
echo "Creating safety backup of current database..."
mysqldump -u${DB_USER} -p${DB_PASS} ${DB_NAME} | gzip > /tmp/pre_restore_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql.gz

# 복구 실행
echo "Restoring database..."
gunzip < ${BACKUP_FILE} | mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME}

echo "[$(date)] MySQL restore completed successfully"

# 데이터 검증
TABLES_COUNT=$(mysql -u${DB_USER} -p${DB_PASS} -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}'" -s -N)
echo "Tables count after restore: ${TABLES_COUNT}"
```

#### Point-in-Time 복구

```bash
#!/bin/bash
# mysql-pitr.sh

set -e

FULL_BACKUP="/backups/mysql/community_db_20251112_000000.sql.gz"
BINLOG_DIR="/backups/incremental"
TARGET_TIME="2025-11-12 14:30:00"

echo "Starting Point-in-Time Recovery to ${TARGET_TIME}"

# 1. 전체 백업 복구
echo "Step 1: Restoring full backup..."
gunzip < ${FULL_BACKUP} | mysql -uroot -p${MYSQL_ROOT_PASSWORD} community_db

# 2. 바이너리 로그 적용
echo "Step 2: Applying binary logs..."
mysqlbinlog --stop-datetime="${TARGET_TIME}" \
    ${BINLOG_DIR}/mysql-bin.* | mysql -uroot -p${MYSQL_ROOT_PASSWORD}

echo "Point-in-Time Recovery completed"
```

### 4.2 파일 시스템 복구

```bash
#!/bin/bash
# filesystem-restore.sh

set -e

BACKUP_FILE="/backups/files/uploads_20251112_000000.tar.gz"
RESTORE_DIR="/var/www/uploads"

echo "[$(date)] Starting filesystem restore"

# 체크섬 검증
sha256sum -c ${BACKUP_FILE}.sha256

# 기존 파일 백업
mv ${RESTORE_DIR} ${RESTORE_DIR}.bak_$(date +%Y%m%d_%H%M%S)

# 복구 실행
mkdir -p ${RESTORE_DIR}
tar -xzf ${BACKUP_FILE} -C /var/www/

# 권한 복원
chown -R www-data:www-data ${RESTORE_DIR}
chmod -R 755 ${RESTORE_DIR}

echo "[$(date)] Filesystem restore completed"
```

### 4.3 Redis 복구

```bash
#!/bin/bash
# redis-restore.sh

set -e

BACKUP_FILE="/backups/redis/dump_20251112_000000.rdb.gz"
REDIS_DATA_DIR="/var/lib/redis"

echo "[$(date)] Starting Redis restore"

# Redis 중지
systemctl stop redis-server

# 기존 dump.rdb 백업
if [ -f ${REDIS_DATA_DIR}/dump.rdb ]; then
    mv ${REDIS_DATA_DIR}/dump.rdb ${REDIS_DATA_DIR}/dump.rdb.bak_$(date +%Y%m%d_%H%M%S)
fi

# 복구 실행
gunzip -c ${BACKUP_FILE} > ${REDIS_DATA_DIR}/dump.rdb

# 권한 복원
chown redis:redis ${REDIS_DATA_DIR}/dump.rdb

# Redis 재시작
systemctl start redis-server

# 복구 확인
redis-cli ping

echo "[$(date)] Redis restore completed"
```

### 4.4 Elasticsearch 복구

```bash
#!/bin/bash
# elasticsearch-restore.sh

set -e

ES_HOST="localhost:9200"
SNAPSHOT_REPO="backup_repository"
SNAPSHOT_NAME="snapshot_20251112_000000"

echo "[$(date)] Starting Elasticsearch restore from ${SNAPSHOT_NAME}"

# 모든 인덱스 닫기
curl -X POST "${ES_HOST}/_all/_close"

# 스냅샷 복구
curl -X POST "${ES_HOST}/_snapshot/${SNAPSHOT_REPO}/${SNAPSHOT_NAME}/_restore" \
    -H 'Content-Type: application/json' \
    -d'{
        "indices": "*",
        "ignore_unavailable": true,
        "include_global_state": false
    }'

# 복구 진행 상황 모니터링
while true; do
    STATUS=$(curl -s "${ES_HOST}/_snapshot/${SNAPSHOT_REPO}/${SNAPSHOT_NAME}/_status" | jq -r '.snapshots[0].state')
    if [ "$STATUS" == "SUCCESS" ]; then
        break
    fi
    echo "Restore in progress... Status: ${STATUS}"
    sleep 10
done

# 모든 인덱스 열기
curl -X POST "${ES_HOST}/_all/_open"

echo "[$(date)] Elasticsearch restore completed"
```

---

## 5. 재해 복구 계획 (DRP)

### 5.1 재해 시나리오

#### 시나리오 1: 데이터베이스 손상

**영향**: 모든 사용자 데이터 접근 불가

**복구 절차**:
1. **즉시 조치** (0-15분)
   - 서비스 점검 모드 전환
   - 문제 원인 파악
   - 백업 팀 소집

2. **복구 실행** (15-60분)
   - 최신 전체 백업 확인
   - PITR(Point-in-Time Recovery) 준비
   - 복구 실행

3. **검증** (60-90분)
   - 데이터 무결성 검증
   - 기능 테스트
   - 성능 모니터링

4. **서비스 재개** (90-120분)
   - 점검 모드 해제
   - 사용자 공지
   - 모니터링 강화

**목표 RTO**: 2시간

#### 시나리오 2: 전체 서버 장애

**영향**: 전체 서비스 다운

**복구 절차**:
1. **즉시 조치** (0-30분)
   - DR 사이트 활성화
   - DNS 전환 준비

2. **DR 사이트 구동** (30-120분)
   - 백업 서버 부팅
   - 최신 백업 복구
   - 로드 밸런서 설정

3. **서비스 전환** (120-180분)
   - DNS 레코드 변경
   - SSL 인증서 확인
   - 서비스 정상화 확인

**목표 RTO**: 3시간

#### 시나리오 3: 랜섬웨어 공격

**영향**: 데이터 암호화

**복구 절차**:
1. **격리** (0-15분)
   - 감염 서버 네트워크 차단
   - 확산 방지

2. **평가** (15-60분)
   - 피해 범위 파악
   - 클린 백업 식별

3. **복구** (60-240분)
   - 감염 이전 백업 복구
   - 시스템 재구축
   - 보안 패치 적용

**목표 RTO**: 4시간

### 5.2 DR 사이트 구성

```yaml
# docker-compose-dr.yml
version: '3.8'

services:
  mysql-dr:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DR_MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: community_db
    volumes:
      - /dr/mysql-data:/var/lib/mysql
      - /dr/mysql-backup:/backups
    command: --default-authentication-plugin=mysql_native_password
    networks:
      - dr-network

  redis-dr:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - /dr/redis-data:/data
    networks:
      - dr-network

  elasticsearch-dr:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - /dr/elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - dr-network

  app-dr:
    image: community-platform:latest
    environment:
      NODE_ENV: production
      DB_HOST: mysql-dr
      REDIS_HOST: redis-dr
      ELASTICSEARCH_HOST: elasticsearch-dr
    depends_on:
      - mysql-dr
      - redis-dr
      - elasticsearch-dr
    networks:
      - dr-network

networks:
  dr-network:
    driver: bridge
```

### 5.3 복구 우선순위

| 우선순위      | 서비스               | 목표 RTO | 복구 순서 |
| ------------- | -------------------- | -------- | --------- |
| **P0 (긴급)** | 데이터베이스         | 1시간    | 1순위     |
| **P1 (중요)** | 인증 시스템          | 2시간    | 2순위     |
| **P1 (중요)** | 코어 API             | 2시간    | 3순위     |
| **P2 (일반)** | 검색 (Elasticsearch) | 4시간    | 4순위     |
| **P2 (일반)** | 채팅                 | 4시간    | 5순위     |
| **P3 (낮음)** | 알림 시스템          | 8시간    | 6순위     |

---

## 6. 데이터 무결성 검증

### 6.1 백업 검증 스크립트

```bash
#!/bin/bash
# verify-backup.sh

set -e

BACKUP_DIR="/backups/mysql"
LATEST_BACKUP=$(ls -t ${BACKUP_DIR}/*.sql.gz | head -1)
TEST_DB="backup_test_db"
DB_USER="root"
DB_PASS="${MYSQL_ROOT_PASSWORD}"

echo "[$(date)] Starting backup verification: ${LATEST_BACKUP}"

# 1. 파일 무결성 검증
echo "Step 1: Verifying file integrity..."
if md5sum -c ${LATEST_BACKUP}.md5; then
    echo "✅ Checksum verified"
else
    echo "❌ Checksum verification failed"
    exit 1
fi

# 2. 압축 파일 검증
echo "Step 2: Verifying gzip integrity..."
if gunzip -t ${LATEST_BACKUP}; then
    echo "✅ Gzip integrity verified"
else
    echo "❌ Gzip integrity check failed"
    exit 1
fi

# 3. SQL 복구 테스트
echo "Step 3: Testing database restore..."

# 테스트 데이터베이스 생성
mysql -u${DB_USER} -p${DB_PASS} -e "DROP DATABASE IF EXISTS ${TEST_DB}"
mysql -u${DB_USER} -p${DB_PASS} -e "CREATE DATABASE ${TEST_DB}"

# 백업 복구 시도
if gunzip < ${LATEST_BACKUP} | mysql -u${DB_USER} -p${DB_PASS} ${TEST_DB}; then
    echo "✅ Database restore successful"
else
    echo "❌ Database restore failed"
    mysql -u${DB_USER} -p${DB_PASS} -e "DROP DATABASE IF EXISTS ${TEST_DB}"
    exit 1
fi

# 4. 데이터 검증
echo "Step 4: Verifying data..."

# 테이블 수 확인
TABLES_COUNT=$(mysql -u${DB_USER} -p${DB_PASS} -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${TEST_DB}'" -s -N)
echo "Tables count: ${TABLES_COUNT}"

# 사용자 수 확인
USERS_COUNT=$(mysql -u${DB_USER} -p${DB_PASS} ${TEST_DB} -e "SELECT COUNT(*) FROM users" -s -N)
echo "Users count: ${USERS_COUNT}"

# 게시글 수 확인
POSTS_COUNT=$(mysql -u${DB_USER} -p${DB_PASS} ${TEST_DB} -e "SELECT COUNT(*) FROM posts" -s -N)
echo "Posts count: ${POSTS_COUNT}"

# 테스트 데이터베이스 삭제
mysql -u${DB_USER} -p${DB_PASS} -e "DROP DATABASE ${TEST_DB}"

echo "[$(date)] ✅ Backup verification completed successfully"

# Slack 알림
curl -X POST https://api.slack.com/your-webhook \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"✅ Backup Verification Passed: ${LATEST_BACKUP}\n- Tables: ${TABLES_COUNT}\n- Users: ${USERS_COUNT}\n- Posts: ${POSTS_COUNT}\"}"
```

### 6.2 데이터 일관성 체크

```bash
#!/bin/bash
# check-data-consistency.sh

DB_NAME="community_db"
DB_USER="root"
DB_PASS="${MYSQL_ROOT_PASSWORD}"

echo "[$(date)] Starting data consistency check"

# 외래 키 제약 조건 확인
echo "Checking foreign key constraints..."
mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -e "
    SELECT 
        TABLE_NAME, 
        CONSTRAINT_NAME, 
        CONSTRAINT_TYPE 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = '${DB_NAME}' 
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
"

# 고아 레코드 찾기
echo "Checking for orphaned records..."

# 게시글 없는 댓글
ORPHANED_COMMENTS=$(mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -s -N -e "
    SELECT COUNT(*) 
    FROM comments c 
    LEFT JOIN posts p ON c.post_id = p.id 
    WHERE p.id IS NULL
")
echo "Orphaned comments: ${ORPHANED_COMMENTS}"

# 사용자 없는 게시글
ORPHANED_POSTS=$(mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -s -N -e "
    SELECT COUNT(*) 
    FROM posts p 
    LEFT JOIN users u ON p.author_id = u.id 
    WHERE u.id IS NULL
")
echo "Orphaned posts: ${ORPHANED_POSTS}"

# 중복 데이터 확인
echo "Checking for duplicate data..."
DUPLICATE_USERS=$(mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -s -N -e "
    SELECT email, COUNT(*) 
    FROM users 
    GROUP BY email 
    HAVING COUNT(*) > 1
")

if [ -z "$DUPLICATE_USERS" ]; then
    echo "✅ No duplicate users found"
else
    echo "⚠️ Duplicate users detected:"
    echo "$DUPLICATE_USERS"
fi

echo "[$(date)] Data consistency check completed"
```

---

## 7. 백업 모니터링

### 7.1 백업 상태 모니터링

```javascript
// server-backend/services/backupMonitorService.js

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stat = promisify(fs.stat);

class BackupMonitorService {
    constructor() {
        this.backupDir = '/backups';
        this.maxBackupAge = 24 * 60 * 60 * 1000; // 24 hours
    }

    async checkLatestBackup() {
        try {
            const mysqlBackupDir = path.join(this.backupDir, 'mysql');
            const files = await fs.promises.readdir(mysqlBackupDir);
            
            // 최신 백업 파일 찾기
            const backupFiles = files
                .filter(f => f.endsWith('.sql.gz'))
                .map(f => path.join(mysqlBackupDir, f));

            if (backupFiles.length === 0) {
                return {
                    status: 'error',
                    message: 'No backup files found'
                };
            }

            // 최신 파일 통계
            const latestFile = backupFiles[backupFiles.length - 1];
            const stats = await stat(latestFile);
            const ageMs = Date.now() - stats.mtime.getTime();

            if (ageMs > this.maxBackupAge) {
                return {
                    status: 'warning',
                    message: `Latest backup is ${Math.floor(ageMs / (60 * 60 * 1000))} hours old`,
                    file: latestFile,
                    age: ageMs
                };
            }

            return {
                status: 'success',
                message: 'Backup is up to date',
                file: latestFile,
                size: stats.size,
                age: ageMs
            };
        } catch (error) {
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    async getBackupMetrics() {
        const metrics = {
            mysql: await this.getDirectoryMetrics(path.join(this.backupDir, 'mysql')),
            files: await this.getDirectoryMetrics(path.join(this.backupDir, 'files')),
            redis: await this.getDirectoryMetrics(path.join(this.backupDir, 'redis'))
        };

        return metrics;
    }

    async getDirectoryMetrics(dir) {
        try {
            const files = await fs.promises.readdir(dir);
            let totalSize = 0;
            let fileCount = 0;

            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = await stat(filePath);
                if (stats.isFile()) {
                    totalSize += stats.size;
                    fileCount++;
                }
            }

            return {
                fileCount,
                totalSize,
                totalSizeGB: (totalSize / (1024 ** 3)).toFixed(2)
            };
        } catch (error) {
            return {
                fileCount: 0,
                totalSize: 0,
                error: error.message
            };
        }
    }
}

module.exports = new BackupMonitorService();
```

### 7.2 백업 알림 설정

```javascript
// server-backend/services/backupAlertService.js

const axios = require('axios');

class BackupAlertService {
    constructor() {
        this.slackWebhook = process.env.SLACK_BACKUP_WEBHOOK;
        this.emailRecipients = process.env.BACKUP_ALERT_EMAILS?.split(',') || [];
    }

    async sendBackupSuccessAlert(backupInfo) {
        const message = {
            text: '✅ Backup Successful',
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '✅ Backup Completed Successfully'
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*Type:*\n${backupInfo.type}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Size:*\n${backupInfo.size}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Duration:*\n${backupInfo.duration}s`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Time:*\n${new Date().toISOString()}`
                        }
                    ]
                }
            ]
        };

        await this.sendSlackMessage(message);
    }

    async sendBackupFailureAlert(error) {
        const message = {
            text: '❌ Backup Failed',
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '❌ Backup Failed'
                    }
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Error:*\n\`\`\`${error.message}\`\`\``
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*Time:*\n${new Date().toISOString()}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Severity:*\nCritical`
                        }
                    ]
                }
            ]
        };

        await this.sendSlackMessage(message);
    }

    async sendOldBackupWarning(ageHours) {
        const message = {
            text: '⚠️ Old Backup Warning',
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '⚠️ Backup is Outdated'
                    }
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `Latest backup is *${ageHours} hours* old. Expected: < 24 hours`
                    }
                }
            ]
        };

        await this.sendSlackMessage(message);
    }

    async sendSlackMessage(message) {
        if (!this.slackWebhook) {
            console.log('Slack webhook not configured');
            return;
        }

        try {
            await axios.post(this.slackWebhook, message);
        } catch (error) {
            console.error('Failed to send Slack notification:', error.message);
        }
    }
}

module.exports = new BackupAlertService();
```

---

## 8. 복구 테스트

### 8.1 정기 복구 테스트 계획

| 빈도     | 테스트 유형            | 범위               |
| -------- | ---------------------- | ------------------ |
| **주간** | 단일 테이블 복구       | 무작위 테이블 선택 |
| **월간** | 전체 데이터베이스 복구 | 모든 데이터        |
| **분기** | DR 사이트 전환         | 전체 시스템        |
| **연간** | 재해 복구 훈련         | 전사적 훈련        |

### 8.2 복구 테스트 체크리스트

```markdown
## 복구 테스트 체크리스트

### 사전 준비
- [ ] 테스트 환경 준비 완료
- [ ] 백업 파일 확인 (최신, 무결성)
- [ ] 테스트 팀 소집
- [ ] 타임라인 설정

### 복구 실행
- [ ] 백업 파일 복사
- [ ] 복구 스크립트 실행
- [ ] 진행 상황 모니터링
- [ ] 에러 로그 확인

### 검증
- [ ] 데이터베이스 연결 확인
- [ ] 테이블 수 확인
- [ ] 레코드 수 확인
- [ ] 외래 키 무결성 확인
- [ ] 샘플 쿼리 실행
- [ ] 애플리케이션 기능 테스트

### 문서화
- [ ] 복구 시간 기록 (RTO)
- [ ] 데이터 손실 확인 (RPO)
- [ ] 문제점 기록
- [ ] 개선 사항 도출

### 정리
- [ ] 테스트 데이터 정리
- [ ] 보고서 작성
- [ ] 팀 피드백
```

### 8.3 복구 테스트 보고서 템플릿

```markdown
# 백업 복구 테스트 보고서

**테스트 날짜**: 2025-11-12  
**테스트 담당자**: [이름]  
**테스트 유형**: 전체 데이터베이스 복구

## 1. 테스트 개요

- **백업 파일**: community_db_20251112_000000.sql.gz
- **백업 날짜**: 2025-11-12 00:00:00
- **백업 크기**: 2.3 GB
- **테스트 환경**: 스테이징 서버

## 2. 테스트 결과

### 2.1 복구 시간

| 단계              | 소요 시간 | 누적 시간 |
| ----------------- | --------- | --------- |
| 백업 파일 복사    | 5분       | 5분       |
| 데이터베이스 복구 | 25분      | 30분      |
| 인덱스 재구축     | 10분      | 40분      |
| 검증              | 5분       | 45분      |
| **총 시간**       | -         | **45분**  |

**RTO 목표**: 2시간 ✅ **달성**

### 2.2 데이터 무결성

| 항목      | 예상   | 실제   | 상태 |
| --------- | ------ | ------ | ---- |
| 테이블 수 | 25     | 25     | ✅    |
| 사용자 수 | 1,523  | 1,523  | ✅    |
| 게시글 수 | 8,742  | 8,742  | ✅    |
| 댓글 수   | 23,456 | 23,456 | ✅    |
| 파일 수   | 3,421  | 3,421  | ✅    |

### 2.3 기능 테스트

- ✅ 로그인
- ✅ 게시글 작성
- ✅ 댓글 작성
- ✅ 검색
- ✅ 파일 업로드

## 3. 문제점 및 개선사항

### 문제점
1. 인덱스 재구축 시간이 예상보다 5분 길었음
2. 테스트 환경 디스크 공간 부족 경고

### 개선사항
1. 인덱스 최적화 검토 필요
2. 테스트 환경 디스크 용량 증설 계획

## 4. 결론

전체 복구 테스트 **성공**. RTO 목표 시간 내 복구 완료.
정기적인 테스트로 복구 절차 숙련도 향상 필요.

---

**검토자**: [이름]  
**승인**: [이름]
```

---

## 9. 체크리스트

### 9.1 백업 시스템

- [ ] MySQL 자동 백업 설정 완료
- [ ] 파일 시스템 백업 설정 완료
- [ ] Redis 백업 설정 완료
- [ ] Elasticsearch 스냅샷 설정 완료
- [ ] Cron 스케줄 등록 완료
- [ ] 백업 로그 확인 가능
- [ ] 백업 알림 설정 완료

### 9.2 복구 시스템

- [ ] 복구 스크립트 작성 완료
- [ ] 복구 절차 문서화 완료
- [ ] PITR 설정 완료
- [ ] DR 사이트 구축 완료
- [ ] DNS 전환 계획 수립
- [ ] 복구 우선순위 정의 완료

### 9.3 검증 및 테스트

- [ ] 백업 무결성 검증 자동화
- [ ] 데이터 일관성 체크 스크립트
- [ ] 주간 복구 테스트 스케줄
- [ ] 월간 DR 테스트 계획
- [ ] 복구 테스트 보고서 템플릿

### 9.4 모니터링

- [ ] 백업 상태 대시보드
- [ ] 백업 실패 알림
- [ ] 오래된 백업 경고
- [ ] 스토리지 용량 모니터링
- [ ] 백업 성능 메트릭

---

## 10. 구현 로드맵

### Week 1: 기본 백업 시스템

**목표**: 핵심 데이터 백업 자동화

- **Day 1-2**: MySQL 백업
  - [ ] mysqldump 스크립트 작성
  - [ ] 전체 백업 Cron 설정
  - [ ] 백업 디렉토리 구조 설계

- **Day 3**: 파일 시스템 백업
  - [ ] tar 백업 스크립트
  - [ ] 증분 백업 로직 구현
  - [ ] 백업 압축 최적화

- **Day 4**: Redis & Elasticsearch
  - [ ] Redis BGSAVE 자동화
  - [ ] Elasticsearch 스냅샷 설정
  - [ ] 스냅샷 리포지토리 구성

- **Day 5**: 테스트 및 검증
  - [ ] 모든 백업 스크립트 테스트
  - [ ] 로그 확인
  - [ ] 문제 수정

### Week 2: 고급 백업 기능

**목표**: 증분 백업 및 원격 백업

- **Day 1-2**: 증분 백업
  - [ ] MySQL 바이너리 로그 백업
  - [ ] 파일 시스템 증분 백업
  - [ ] 백업 체인 관리

- **Day 3-4**: AWS S3 동기화
  - [ ] AWS CLI 설정
  - [ ] S3 버킷 생성
  - [ ] 동기화 스크립트 작성
  - [ ] Glacier 정책 설정

- **Day 5**: 백업 정리
  - [ ] 오래된 백업 삭제 스크립트
  - [ ] 보관 정책 구현
  - [ ] 스토리지 최적화

### Week 3: 복구 시스템

**목표**: 복구 절차 확립 및 DR 사이트

- **Day 1-2**: 복구 스크립트
  - [ ] MySQL 복구 스크립트
  - [ ] 파일 시스템 복구 스크립트
  - [ ] PITR 스크립트
  - [ ] 복구 절차 문서화

- **Day 3-4**: DR 사이트
  - [ ] DR 서버 프로비저닝
  - [ ] Docker Compose 설정
  - [ ] 네트워크 구성
  - [ ] DNS 전환 계획

- **Day 5**: 복구 테스트
  - [ ] 전체 복구 테스트
  - [ ] DR 사이트 전환 테스트
  - [ ] RTO/RPO 측정
  - [ ] 개선사항 도출

### Week 4: 모니터링 및 최적화

**목표**: 백업 모니터링 및 자동화 개선

- **Day 1-2**: 모니터링 시스템
  - [ ] 백업 상태 API
  - [ ] Grafana 대시보드
  - [ ] Prometheus 메트릭
  - [ ] 알림 설정

- **Day 3**: 검증 자동화
  - [ ] 백업 무결성 검증
  - [ ] 데이터 일관성 체크
  - [ ] 자동 복구 테스트

- **Day 4**: 문서화
  - [ ] 백업 가이드 완성
  - [ ] 복구 매뉴얼
  - [ ] DRP 문서
  - [ ] 운영 가이드

- **Day 5**: 최종 검토 및 배포
  - [ ] 전체 시스템 테스트
  - [ ] 팀 교육
  - [ ] 프로덕션 배포
  - [ ] 모니터링 확인

---

## 11. 참고 자료

### 11.1 도구 및 서비스

| 도구                       | 용도             | 링크              |
| -------------------------- | ---------------- | ----------------- |
| **mysqldump**              | MySQL 백업       | docs.oracle.com   |
| **AWS S3**                 | 원격 백업        | aws.amazon.com/s3 |
| **Elasticsearch Snapshot** | 검색 데이터 백업 | elastic.co        |
| **restic**                 | 증분 백업 도구   | restic.net        |
| **BorgBackup**             | 중복 제거 백업   | borgbackup.org    |

### 11.2 모범 사례

- **3-2-1 규칙** 준수
- **암호화** 백업 데이터
- **정기적인 복구 테스트**
- **자동화된 검증**
- **문서화**

---

**작성일**: 2025-11-12  
**작성자**: AUTOAGENTS  
**버전**: 1.0
