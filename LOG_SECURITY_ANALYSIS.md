# 로그 관리 및 보안 분석

## 📊 현재 로깅 시스템 분석

### 현재 구조
- **로그 파일**: `server-backend/logs/runtime.log`
- **로그 모드**: JSON 모드 (`LOG_JSON=1`) 또는 일반 텍스트
- **로그 방식**: 동기 방식 (`fs.appendFileSync`)
- **로그 레벨**: info, warn, error, event

### 문제점 분석

#### 1. 성능 이슈
```javascript
// 현재: 동기 방식 - 매 로그마다 파일 I/O 블로킹
fs.appendFileSync(LOG_FILE, out + '\n');

// 문제: 높은 트래픽에서 성능 저하
```

#### 2. 보안 위험
- **민감 정보 노출**: 요청 파라미터, 인증 토큰 등이 로그에 남을 수 있음
- **로그 파일 크기**: 무제한 증가로 디스크 공간 부족 위험
- **로그 접근 제어**: 파일 권한 관리 부족

#### 3. 운영 이슈
- **로그 로테이션**: 자동 로그 순환 미구현
- **실시간 모니터링**: 실시간 로그 스트리밍 부족
- **로그 분석**: 구조화된 로그 검색/분석 도구 부족

## 🛡️ 보안 강화 개선안

### 1. 민감 정보 필터링 강화
```javascript
// 민감 정보 마스킹
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'key', 'auth', 'cookie'];
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key'];

function sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    
    for (const field of SENSITIVE_FIELDS) {
        if (sanitized[field]) {
            sanitized[field] = '***MASKED***';
        }
    }
    
    // 헤더 마스킹
    if (sanitized.headers) {
        for (const header of SENSITIVE_HEADERS) {
            if (sanitized.headers[header]) {
                sanitized.headers[header] = '***MASKED***';
            }
        }
    }
    
    return sanitized;
}
```

### 2. 실시간 로그 스트리밍
```javascript
// WebSocket 또는 Server-Sent Events를 통한 실시간 로그
class LogStreamer {
    constructor() {
        this.clients = new Set();
    }
    
    addClient(ws) {
        this.clients.add(ws);
    }
    
    removeClient(ws) {
        this.clients.delete(ws);
    }
    
    broadcast(logEntry) {
        const message = JSON.stringify(logEntry);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}
```

### 3. 로그 레벨 및 환경별 설정
```javascript
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];

function shouldLog(level) {
    return LOG_LEVELS[level] <= currentLevel;
}
```

## 🚀 개선된 로깅 시스템 제안

### 1. 비동기 로깅 with 버퍼링
```javascript
class AsyncLogger {
    constructor() {
        this.buffer = [];
        this.flushInterval = 1000; // 1초마다 플러시
        this.maxBufferSize = 100;
        this.startFlushTimer();
    }
    
    log(entry) {
        this.buffer.push(entry);
        
        if (this.buffer.length >= this.maxBufferSize) {
            this.flush();
        }
    }
    
    async flush() {
        if (this.buffer.length === 0) return;
        
        const entries = this.buffer.splice(0);
        const logText = entries.map(e => JSON.stringify(e)).join('\n') + '\n';
        
        try {
            await fs.promises.appendFile(LOG_FILE, logText);
        } catch (error) {
            console.error('Log write failed:', error);
        }
    }
}
```

### 2. 로그 로테이션
```javascript
class LogRotator {
    constructor(maxSize = 10 * 1024 * 1024, maxFiles = 5) { // 10MB, 5 files
        this.maxSize = maxSize;
        this.maxFiles = maxFiles;
    }
    
    async checkRotation(logFile) {
        try {
            const stats = await fs.promises.stat(logFile);
            if (stats.size > this.maxSize) {
                await this.rotate(logFile);
            }
        } catch (error) {
            // 파일이 없으면 무시
        }
    }
    
    async rotate(logFile) {
        const dir = path.dirname(logFile);
        const ext = path.extname(logFile);
        const base = path.basename(logFile, ext);
        
        // 기존 로그 파일들 이동
        for (let i = this.maxFiles - 1; i > 0; i--) {
            const oldFile = path.join(dir, `${base}.${i}${ext}`);
            const newFile = path.join(dir, `${base}.${i + 1}${ext}`);
            
            try {
                await fs.promises.rename(oldFile, newFile);
            } catch { /* 파일이 없으면 무시 */ }
        }
        
        // 현재 로그 파일을 .1로 이동
        const rotatedFile = path.join(dir, `${base}.1${ext}`);
        await fs.promises.rename(logFile, rotatedFile);
    }
}
```

### 3. 보안 이벤트 전용 로깅
```javascript
class SecurityLogger {
    constructor() {
        this.securityLogFile = path.join(LOG_DIR, 'security.log');
    }
    
    logSecurityEvent(event, details) {
        const entry = {
            timestamp: new Date().toISOString(),
            event,
            severity: this.getSeverity(event),
            details: this.sanitize(details),
            ip: details.ip,
            userAgent: details.userAgent
        };
        
        // 즉시 플러시 (보안 이벤트는 중요)
        this.writeSecurityLog(entry);
        
        // 심각한 보안 이벤트는 알림
        if (entry.severity === 'critical') {
            this.sendAlert(entry);
        }
    }
    
    getSeverity(event) {
        const criticalEvents = ['brute_force', 'sql_injection', 'xss_attempt'];
        const warningEvents = ['rate_limit_exceeded', 'invalid_token'];
        
        if (criticalEvents.includes(event)) return 'critical';
        if (warningEvents.includes(event)) return 'warning';
        return 'info';
    }
}
```

## 💡 권장 구현 전략

### Phase 1: 즉시 적용 (보안 우선)
1. **민감 정보 마스킹** 강화
2. **로그 레벨 설정** 환경별 분리
3. **보안 이벤트 로깅** 분리

### Phase 2: 성능 개선
1. **비동기 로깅** 구현
2. **로그 로테이션** 자동화
3. **실시간 스트리밍** 구현

### Phase 3: 운영 도구
1. **로그 분석 대시보드**
2. **알림 시스템**
3. **로그 백업/아카이브**

## 🎯 결론 및 권장사항

### 보안 관점
- ✅ **실시간 텍스트 로깅**: 좋은 아이디어, 모니터링에 유리
- ⚠️ **민감 정보 보호**: 반드시 마스킹 필요
- ✅ **보안 이벤트 분리**: 별도 로그 파일로 관리

### 성능 관점
- ✅ **비동기 처리**: 높은 트래픽에서 필수
- ✅ **버퍼링**: I/O 최적화
- ✅ **로그 로테이션**: 디스크 공간 관리

### 운영 관점
- ✅ **실시간 모니터링**: 문제 조기 발견
- ✅ **구조화된 로그**: JSON 형태로 검색/분석 용이
- ✅ **자동 정리**: 오래된 로그 자동 삭제

**"터질 때 로그 생성하고 죽으면 끝"**보다는 **지속적인 모니터링과 보안 강화**가 더 중요합니다!

### Search Query Logging Policy
- Keep `/api/search` requests at `logger.info` with truncated `q` (max 32 chars) to avoid storing full PII.
- Mask email-like patterns (`/@/`) before logging to runtime logs.
- Aggregate metrics via counts instead of raw query payloads.


### Dashboard Requirements
- Display daily search volume, top queries (masked), and rate-limit blocks.
- Alert when `rlSearchBlocked` spikes above baseline.
- Include error breakdown (429 vs 500) for `/api/search`.
