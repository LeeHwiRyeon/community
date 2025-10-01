# 외장 하드 데이터베이스 설정 스크립트
# 사용자 추적 및 캐시 데이터를 외장 하드에 저장

param(
    [string]$ExternalDrive = "E:",
    [string]$DatabasePath = "AnalyticsDB",
    [switch]$Force = $false
)

Write-Host "🗄️ 외장 하드 데이터베이스 설정을 시작합니다..." -ForegroundColor Green

# 외장 하드 경로 확인
$ExternalPath = Join-Path $ExternalDrive $DatabasePath
Write-Host "📁 데이터베이스 경로: $ExternalPath" -ForegroundColor Cyan

# 외장 하드 존재 확인
if (-not (Test-Path $ExternalDrive)) {
    Write-Host "❌ 외장 하드가 연결되지 않았습니다: $ExternalDrive" -ForegroundColor Red
    Write-Host "💡 외장 하드를 연결하고 다시 시도해주세요." -ForegroundColor Yellow
    exit 1
}

# 데이터베이스 디렉토리 생성
if (Test-Path $ExternalPath) {
    if ($Force) {
        Write-Host "🗑️ 기존 데이터베이스 디렉토리를 제거합니다..." -ForegroundColor Yellow
        Remove-Item -Path $ExternalPath -Recurse -Force
    }
    else {
        Write-Host "⚠️ 데이터베이스 디렉토리가 이미 존재합니다: $ExternalPath" -ForegroundColor Yellow
        $response = Read-Host "덮어쓰시겠습니까? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Host "❌ 설정이 취소되었습니다." -ForegroundColor Red
            exit 1
        }
        Remove-Item -Path $ExternalPath -Recurse -Force
    }
}

Write-Host "📁 데이터베이스 디렉토리를 생성합니다..." -ForegroundColor Cyan
New-Item -Path $ExternalPath -ItemType Directory -Force | Out-Null

# 하위 디렉토리 생성
$subdirs = @(
    "analytics",
    "cache", 
    "sessions",
    "events",
    "backups",
    "logs",
    "temp"
)

foreach ($subdir in $subdirs) {
    $subdirPath = Join-Path $ExternalPath $subdir
    New-Item -Path $subdirPath -ItemType Directory -Force | Out-Null
    Write-Host "  ✅ $subdir 디렉토리 생성" -ForegroundColor Green
}

# 데이터베이스 스키마 파일 생성
Write-Host "📋 데이터베이스 스키마를 생성합니다..." -ForegroundColor Cyan

$schemaContent = @"
-- 사용자 추적 및 캐시 분석 데이터베이스 스키마
-- 생성일: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- 위치: $ExternalPath

-- 세션 테이블
CREATE TABLE IF NOT EXISTS sessions (
    sessionId TEXT PRIMARY KEY,
    userId TEXT,
    startTime DATETIME,
    endTime DATETIME,
    duration INTEGER,
    deviceInfo TEXT,
    locationInfo TEXT,
    referrer TEXT,
    utmParams TEXT,
    isActive BOOLEAN,
    lastActivity DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 페이지 뷰 테이블
CREATE TABLE IF NOT EXISTS pageViews (
    id TEXT PRIMARY KEY,
    sessionId TEXT,
    url TEXT,
    title TEXT,
    timestamp DATETIME,
    duration INTEGER,
    scrollDepth REAL,
    timeOnPage INTEGER,
    exitPage BOOLEAN,
    entryPage BOOLEAN,
    referrer TEXT,
    metadata TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sessionId) REFERENCES sessions(sessionId)
);

-- 이벤트 테이블
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    sessionId TEXT,
    type TEXT,
    element TEXT,
    value TEXT,
    timestamp DATETIME,
    page TEXT,
    metadata TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sessionId) REFERENCES sessions(sessionId)
);

-- 분석 결과 테이블
CREATE TABLE IF NOT EXISTS analytics (
    sessionId TEXT PRIMARY KEY,
    userId TEXT,
    engagement TEXT,
    journey TEXT,
    dropoffPoints TEXT,
    recommendations TEXT,
    insights TEXT,
    score TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sessionId) REFERENCES sessions(sessionId)
);

-- 캐시 테이블
CREATE TABLE IF NOT EXISTS cache_items (
    key TEXT PRIMARY KEY,
    value TEXT,
    ttl INTEGER,
    createdAt DATETIME,
    lastAccessed DATETIME,
    accessCount INTEGER,
    size INTEGER,
    tags TEXT,
    priority TEXT,
    metadata TEXT,
    compression BOOLEAN DEFAULT 0,
    encryption BOOLEAN DEFAULT 0
);

-- 캐시 통계 테이블
CREATE TABLE IF NOT EXISTS cache_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    hits INTEGER,
    misses INTEGER,
    hitRate REAL,
    totalItems INTEGER,
    totalSize INTEGER,
    memoryUsage INTEGER,
    evictions INTEGER,
    errors INTEGER
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_startTime ON sessions(startTime);
CREATE INDEX IF NOT EXISTS idx_sessions_isActive ON sessions(isActive);
CREATE INDEX IF NOT EXISTS idx_pageViews_sessionId ON pageViews(sessionId);
CREATE INDEX IF NOT EXISTS idx_pageViews_timestamp ON pageViews(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_sessionId ON events(sessionId);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_cache_items_ttl ON cache_items(ttl);
CREATE INDEX IF NOT EXISTS idx_cache_items_lastAccessed ON cache_items(lastAccessed);
CREATE INDEX IF NOT EXISTS idx_cache_items_tags ON cache_items(tags);

-- 뷰 생성
CREATE VIEW IF NOT EXISTS session_summary AS
SELECT 
    s.sessionId,
    s.userId,
    s.startTime,
    s.endTime,
    s.duration,
    s.isActive,
    COUNT(pv.id) as pageViewCount,
    COUNT(e.id) as eventCount,
    AVG(pv.scrollDepth) as avgScrollDepth,
    AVG(pv.timeOnPage) as avgTimeOnPage
FROM sessions s
LEFT JOIN pageViews pv ON s.sessionId = pv.sessionId
LEFT JOIN events e ON s.sessionId = e.sessionId
GROUP BY s.sessionId;

CREATE VIEW IF NOT EXISTS daily_stats AS
SELECT 
    DATE(s.startTime) as date,
    COUNT(*) as totalSessions,
    COUNT(CASE WHEN s.isActive = 1 THEN 1 END) as activeSessions,
    AVG(s.duration) as avgDuration,
    COUNT(pv.id) as totalPageViews,
    AVG(pv.scrollDepth) as avgScrollDepth
FROM sessions s
LEFT JOIN pageViews pv ON s.sessionId = pv.sessionId
GROUP BY DATE(s.startTime)
ORDER BY date DESC;

-- 트리거 생성 (자동 정리)
CREATE TRIGGER IF NOT EXISTS cleanup_expired_sessions
AFTER INSERT ON sessions
BEGIN
    DELETE FROM sessions 
    WHERE isActive = 0 AND endTime < datetime('now', '-7 days');
END;

CREATE TRIGGER IF NOT EXISTS cleanup_expired_cache
AFTER INSERT ON cache_items
BEGIN
    DELETE FROM cache_items 
    WHERE ttl > 0 AND datetime(createdAt, '+' || ttl || ' seconds') < datetime('now');
END;
"@

$schemaPath = Join-Path $ExternalPath "schema.sql"
$schemaContent | Out-File -FilePath $schemaPath -Encoding UTF8
Write-Host "  ✅ 스키마 파일 생성: $schemaPath" -ForegroundColor Green

# 설정 파일 생성
Write-Host "⚙️ 설정 파일을 생성합니다..." -ForegroundColor Cyan

$configContent = @"
{
  "database": {
    "path": "$ExternalPath",
    "type": "sqlite",
    "filename": "analytics.db",
    "backup": {
      "enabled": true,
      "interval": 3600000,
      "retention": 7
    },
    "cleanup": {
      "enabled": true,
      "interval": 86400000,
      "sessionRetention": 30,
      "eventRetention": 90
    }
  },
  "cache": {
    "maxSize": 2147483648,
    "maxItems": 50000,
    "defaultTtl": 7200,
    "compression": {
      "enabled": true,
      "threshold": 1024
    },
    "encryption": {
      "enabled": false,
      "algorithm": "aes-256-gcm"
    }
  },
  "analytics": {
    "realTime": true,
    "batchSize": 1000,
    "flushInterval": 5000,
    "retention": {
      "sessions": 30,
      "events": 90,
      "analytics": 365
    }
  },
  "monitoring": {
    "enabled": true,
    "interval": 5000,
    "alerts": {
      "highMemoryUsage": 0.8,
      "lowHitRate": 0.7,
      "highErrorRate": 0.05
    }
  }
}
"@

$configPath = Join-Path $ExternalPath "config.json"
$configContent | Out-File -FilePath $configPath -Encoding UTF8
Write-Host "  ✅ 설정 파일 생성: $configPath" -ForegroundColor Green

# 데이터베이스 초기화
Write-Host "🗄️ 데이터베이스를 초기화합니다..." -ForegroundColor Cyan

$dbPath = Join-Path $ExternalPath "analytics.db"

# SQLite3가 설치되어 있는지 확인
try {
    $sqliteVersion = sqlite3 --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ SQLite3 발견: $sqliteVersion" -ForegroundColor Green
        
        # 데이터베이스 생성 및 스키마 적용
        sqlite3 $dbPath < $schemaPath
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ 데이터베이스 초기화 완료" -ForegroundColor Green
        }
        else {
            Write-Host "  ❌ 데이터베이스 초기화 실패" -ForegroundColor Red
        }
    }
    else {
        Write-Host "  ⚠️ SQLite3가 설치되지 않았습니다. 수동으로 데이터베이스를 생성해주세요." -ForegroundColor Yellow
        Write-Host "  💡 SQLite3 다운로드: https://www.sqlite.org/download.html" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "  ⚠️ SQLite3를 찾을 수 없습니다. 수동으로 데이터베이스를 생성해주세요." -ForegroundColor Yellow
}

# 권한 설정
Write-Host "🔐 파일 권한을 설정합니다..." -ForegroundColor Cyan
try {
    # 읽기/쓰기 권한 설정
    $acl = Get-Acl $ExternalPath
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Everyone", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
    $acl.SetAccessRule($accessRule)
    Set-Acl -Path $ExternalPath -AclObject $acl
    Write-Host "  ✅ 권한 설정 완료" -ForegroundColor Green
}
catch {
    Write-Host "  ⚠️ 권한 설정 실패: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 백업 스크립트 생성
Write-Host "💾 백업 스크립트를 생성합니다..." -ForegroundColor Cyan

$backupScript = @"
#!/usr/bin/env powershell
# 데이터베이스 백업 스크립트

param(
    [string]`$BackupPath = "$ExternalPath\backups",
    [int]`$RetentionDays = 7
)

`$DatabasePath = "$dbPath"
`$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
`$BackupFile = Join-Path `$BackupPath "analytics_backup_`$Timestamp.db"

Write-Host "🗄️ 데이터베이스 백업을 시작합니다..." -ForegroundColor Green
Write-Host "📁 백업 파일: `$BackupFile" -ForegroundColor Cyan

# 백업 디렉토리 생성
if (-not (Test-Path `$BackupPath)) {
    New-Item -Path `$BackupPath -ItemType Directory -Force | Out-Null
}

# 데이터베이스 백업
try {
    Copy-Item -Path `$DatabasePath -Destination `$BackupFile -Force
    Write-Host "✅ 백업 완료: `$BackupFile" -ForegroundColor Green
    
    # 오래된 백업 파일 정리
    `$OldBackups = Get-ChildItem -Path `$BackupPath -Filter "analytics_backup_*.db" | 
                   Where-Object { `$_.CreationTime -lt (Get-Date).AddDays(-`$RetentionDays) }
    
    foreach (`$backup in `$OldBackups) {
        Remove-Item -Path `$backup.FullName -Force
        Write-Host "🗑️ 오래된 백업 삭제: `$(`$backup.Name)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ 백업 실패: `$(`$_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 백업 프로세스가 완료되었습니다!" -ForegroundColor Green
"@

$backupScriptPath = Join-Path $ExternalPath "backup-database.ps1"
$backupScript | Out-File -FilePath $backupScriptPath -Encoding UTF8
Write-Host "  ✅ 백업 스크립트 생성: $backupScriptPath" -ForegroundColor Green

# README 파일 생성
Write-Host "📖 README 파일을 생성합니다..." -ForegroundColor Cyan

$readmeContent = @"
# 사용자 추적 및 캐시 분석 데이터베이스

## 📁 디렉토리 구조
```
$DatabasePath/
├── analytics/          # 분석 데이터
├── cache/             # 캐시 데이터
├── sessions/          # 세션 데이터
├── events/            # 이벤트 데이터
├── backups/           # 백업 파일
├── logs/              # 로그 파일
├── temp/              # 임시 파일
├── analytics.db       # SQLite 데이터베이스
├── schema.sql         # 데이터베이스 스키마
├── config.json        # 설정 파일
└── backup-database.ps1 # 백업 스크립트
```

## 🚀 사용 방법

### 1. 데이터베이스 연결
```javascript
const dbPath = '$dbPath';
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbPath);
```

### 2. 설정 파일 로드
```javascript
const config = JSON.parse(fs.readFileSync('$configPath', 'utf8'));
```

### 3. 백업 실행
```powershell
.\backup-database.ps1
```

## 📊 주요 테이블

### sessions
- 사용자 세션 정보
- 세션 ID, 사용자 ID, 시작/종료 시간, 디바이스 정보

### pageViews  
- 페이지 뷰 데이터
- URL, 제목, 체류 시간, 스크롤 깊이

### events
- 사용자 이벤트 데이터
- 이벤트 타입, 요소, 값, 메타데이터

### analytics
- 분석 결과 데이터
- 참여도, 여정, 이탈점, 권장사항

### cache_items
- 캐시 항목 데이터
- 키, 값, TTL, 압축/암호화 정보

## ⚙️ 설정 옵션

### 데이터베이스
- **path**: 데이터베이스 경로
- **backup.interval**: 백업 간격 (밀리초)
- **cleanup.interval**: 정리 간격 (밀리초)

### 캐시
- **maxSize**: 최대 크기 (바이트)
- **maxItems**: 최대 항목 수
- **defaultTtl**: 기본 TTL (초)

### 분석
- **realTime**: 실시간 분석 활성화
- **batchSize**: 배치 크기
- **retention**: 데이터 보존 기간

## 🔧 유지보수

### 정기 작업
1. **일일 백업**: `.\backup-database.ps1`
2. **주간 정리**: 오래된 데이터 삭제
3. **월간 최적화**: 인덱스 재구성

### 모니터링
- 메모리 사용량 확인
- 디스크 공간 확인
- 성능 지표 모니터링

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 외장 하드 연결 상태
2. 디스크 공간 여유
3. 파일 권한 설정
4. SQLite3 설치 상태

생성일: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
위치: $ExternalPath
"@

$readmePath = Join-Path $ExternalPath "README.md"
$readmeContent | Out-File -FilePath $readmePath -Encoding UTF8
Write-Host "  ✅ README 파일 생성: $readmePath" -ForegroundColor Green

# 완료 메시지
Write-Host "`n🎉 외장 하드 데이터베이스 설정이 완료되었습니다!" -ForegroundColor Green
Write-Host "`n📊 설정 요약:" -ForegroundColor Cyan
Write-Host "  📁 데이터베이스 경로: $ExternalPath" -ForegroundColor White
Write-Host "  🗄️ 데이터베이스 파일: $dbPath" -ForegroundColor White
Write-Host "  ⚙️ 설정 파일: $configPath" -ForegroundColor White
Write-Host "  📋 스키마 파일: $schemaPath" -ForegroundColor White
Write-Host "  💾 백업 스크립트: $backupScriptPath" -ForegroundColor White
Write-Host "  📖 README: $readmePath" -ForegroundColor White

Write-Host "`n🚀 다음 단계:" -ForegroundColor Yellow
Write-Host "  1. SQLite3 설치 (https://www.sqlite.org/download.html)" -ForegroundColor White
Write-Host "  2. 데이터베이스 초기화: sqlite3 $dbPath < $schemaPath" -ForegroundColor White
Write-Host "  3. 애플리케이션에서 데이터베이스 연결 테스트" -ForegroundColor White
Write-Host "  4. 정기 백업 스케줄 설정" -ForegroundColor White

Write-Host "`n💡 팁:" -ForegroundColor Cyan
Write-Host "  • 외장 하드가 항상 연결되어 있는지 확인하세요" -ForegroundColor White
Write-Host "  • 정기적으로 백업을 실행하세요" -ForegroundColor White
Write-Host "  • 디스크 공간을 모니터링하세요" -ForegroundColor White
Write-Host "  • 성능 문제가 있으면 인덱스를 최적화하세요" -ForegroundColor White
