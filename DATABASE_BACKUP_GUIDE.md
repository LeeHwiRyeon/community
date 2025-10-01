# 🗄️ 데이터베이스 백업 시스템 가이드

## 📋 개요

뉴스 페이퍼 VIP 관리 시스템의 데이터베이스 백업 시스템은 SQLite 데이터베이스를 자동으로 백업하고 관리하는 완전 자동화된 시스템입니다.

## 🚀 주요 기능

- ✅ **자동 백업**: 스케줄에 따른 자동 백업 실행
- ✅ **다중 백업 전략**: 일일, 증분, 주간, 월간 백업
- ✅ **압축 지원**: 백업 파일 자동 압축으로 저장 공간 절약
- ✅ **보존 정책**: 설정 가능한 백업 보존 기간
- ✅ **복원 기능**: 백업 파일로부터 데이터베이스 복원
- ✅ **모니터링**: 백업 상태 실시간 모니터링
- ✅ **API 지원**: RESTful API를 통한 백업 관리

## 📁 디렉토리 구조

```
D:/database/thenewspaper/
├── thenewspaperdata.db          # 메인 데이터베이스
└── Backups/                     # 백업 디렉토리
    ├── backup_2025-09-28_09-25-03.db
    ├── backup_2025-09-27_02-00-00.db.gz
    └── ...
```

## ⚙️ 백업 설정

### 환경 변수

```bash
# 데이터베이스 경로
DB_PATH=D:/database/thenewspaper/thenewspaperdata.db

# 백업 디렉토리
BACKUP_PATH=D:/database/thenewspaper/Backups

# 백업 보존 기간 (일)
BACKUP_RETENTION_DAYS=30

# 백업 압축 활성화
BACKUP_COMPRESSION=true
```

### 백업 스케줄

| 백업 유형     | 스케줄                     | 설명                   |
| ------------- | -------------------------- | ---------------------- |
| **일일 백업** | 매일 새벽 2시              | 전체 데이터베이스 백업 |
| **증분 백업** | 매 6시간 (8시, 14시, 20시) | 빠른 백업              |
| **주간 백업** | 매주 일요일 새벽 3시       | 주간 전체 백업         |
| **월간 백업** | 매월 1일 새벽 4시          | 월간 아카이브 백업     |

## 🔧 사용법

### 1. 자동 백업 (서비스 시작 시 자동 실행)

서버가 시작되면 백업 스케줄러가 자동으로 시작됩니다.

```bash
# 서버 시작 (백업 스케줄러 자동 시작)
node server.js
```

### 2. 수동 백업 실행

```bash
# CLI를 통한 수동 백업
node scripts/backup-database.js backup

# API를 통한 수동 백업
curl -X POST http://localhost:3001/api/backup/backup
```

### 3. 백업 상태 확인

```bash
# CLI를 통한 상태 확인
node scripts/backup-database.js status

# API를 통한 상태 확인
curl http://localhost:3001/api/backup/status
```

### 4. 백업 복원

```bash
# CLI를 통한 복원
node scripts/backup-database.js restore backup_2025-09-28_09-25-03.db

# API를 통한 복원
curl -X POST http://localhost:3001/api/backup/restore \
  -H "Content-Type: application/json" \
  -d '{"backupFileName": "backup_2025-09-28_09-25-03.db"}'
```

## 📊 API 엔드포인트

### 백업 관리

| 메서드   | 엔드포인트                       | 설명               |
| -------- | -------------------------------- | ------------------ |
| `GET`    | `/api/backup/status`             | 백업 상태 확인     |
| `POST`   | `/api/backup/backup`             | 수동 백업 실행     |
| `GET`    | `/api/backup/files`              | 백업 파일 목록     |
| `POST`   | `/api/backup/restore`            | 백업 복원          |
| `GET`    | `/api/backup/download/:filename` | 백업 파일 다운로드 |
| `DELETE` | `/api/backup/files/:filename`    | 백업 파일 삭제     |

### 스케줄러 관리

| 메서드 | 엔드포인트                    | 설명          |
| ------ | ----------------------------- | ------------- |
| `POST` | `/api/backup/scheduler/start` | 스케줄러 시작 |
| `POST` | `/api/backup/scheduler/stop`  | 스케줄러 중지 |

## 🔍 모니터링

### 백업 상태 확인

```bash
# 전체 백업 상태
curl http://localhost:3001/api/backup/status

# 응답 예시
{
  "success": true,
  "data": {
    "backup": {
      "totalBackups": 5,
      "totalSize": "2.5 MB",
      "latestBackup": {
        "name": "backup_2025-09-28_09-25-03.db",
        "size": "0.05 MB",
        "created": "2025-09-28T00:25:03.000Z",
        "isCompressed": false
      },
      "backups": [...]
    },
    "scheduler": {
      "isRunning": true,
      "activeSchedules": ["daily", "incremental", "weekly", "monthly"],
      "totalSchedules": 4
    }
  }
}
```

### 로그 모니터링

백업 관련 로그는 서버 로그에 기록됩니다:

```
2025-09-28 09:25:03:1727 info: 🔄 데이터베이스 백업 시작: D:/database/thenewspaper/thenewspaperdata.db
2025-09-28 09:25:03:1846 info: ✅ 백업 완료: D:\database\thenewspaper\Backups\backup_2025-09-28_09-25-03.db (0.05 MB)
```

## 🛠️ 문제 해결

### 일반적인 문제

#### 1. 백업 실패
```bash
# 원인: 데이터베이스 파일이 사용 중
# 해결: 서버를 일시 중지하고 백업 실행

# 원인: 디스크 공간 부족
# 해결: 오래된 백업 파일 삭제 또는 디스크 공간 확보
```

#### 2. 복원 실패
```bash
# 원인: 백업 파일이 손상됨
# 해결: 다른 백업 파일 사용

# 원인: 권한 부족
# 해결: 관리자 권한으로 실행
```

#### 3. 스케줄러가 시작되지 않음
```bash
# 원인: node-cron 패키지 누락
# 해결: npm install node-cron

# 원인: 시간대 설정 문제
# 해결: 시스템 시간대를 Asia/Seoul로 설정
```

### 로그 확인

```bash
# 서버 로그에서 백업 관련 로그 확인
tail -f logs/api-server.log | grep -i backup

# 백업 스케줄러 로그 확인
node scripts/backup-scheduler.js status
```

## 🔒 보안 고려사항

### 백업 파일 보안

1. **접근 권한**: 백업 디렉토리는 관리자만 접근 가능하도록 설정
2. **암호화**: 민감한 데이터가 포함된 경우 백업 파일 암호화 고려
3. **네트워크 전송**: 백업 파일 전송 시 HTTPS 사용

### 권한 관리

```bash
# 백업 디렉토리 권한 설정 (Windows)
icacls "D:\database\thenewspaper\Backups" /grant:r "Administrators:(OI)(CI)F"

# 백업 디렉토리 권한 설정 (Linux)
chmod 700 /path/to/backups
chown root:root /path/to/backups
```

## 📈 성능 최적화

### 백업 성능 향상

1. **압축 사용**: `BACKUP_COMPRESSION=true`로 설정
2. **보존 기간 조정**: 필요에 따라 `BACKUP_RETENTION_DAYS` 조정
3. **스케줄 최적화**: 시스템 부하가 적은 시간에 백업 실행

### 모니터링 설정

```bash
# 백업 성능 모니터링
curl http://localhost:3001/api/monitoring/metrics

# 디스크 사용량 확인
du -sh D:/database/thenewspaper/Backups/
```

## 🚨 알림 설정

### 백업 실패 알림

현재 시스템은 로그를 통한 알림을 제공합니다. 실제 운영 환경에서는 다음을 고려하세요:

1. **이메일 알림**: 백업 실패 시 관리자에게 이메일 전송
2. **슬랙 알림**: 실시간 알림을 위한 슬랙 웹훅 연동
3. **SMS 알림**: 긴급 상황 시 SMS 전송

### 알림 설정 예시

```javascript
// 이메일 알림 설정 (예시)
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'admin@thenewspaper.com',
    pass: 'your-password'
  }
});

// 백업 실패 시 이메일 전송
await transporter.sendMail({
  from: 'admin@thenewspaper.com',
  to: 'admin@thenewspaper.com',
  subject: '데이터베이스 백업 실패',
  text: `백업이 실패했습니다: ${error.message}`
});
```

## 📚 추가 리소스

- [SQLite 백업 문서](https://www.sqlite.org/backup.html)
- [Node-cron 스케줄링](https://www.npmjs.com/package/node-cron)
- [Express.js API 개발](https://expressjs.com/)

## 🆘 지원

백업 시스템 관련 문제가 발생하면 다음을 확인하세요:

1. 서버 로그 확인
2. 백업 디렉토리 권한 확인
3. 디스크 공간 확인
4. 데이터베이스 연결 상태 확인

---

**마지막 업데이트**: 2025-09-28  
**버전**: 1.0.0  
**작성자**: News Paper VIP Development Team
