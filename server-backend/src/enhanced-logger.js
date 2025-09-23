import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.join(__dirname, '../logs');

// 로그 디렉터리 생성
if (!fs.existsSync(LOG_DIR)) {
    try {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    } catch (e) {
        console.warn('Failed to create log directory:', e.message);
    }
}

// 환경설정
const CONFIG = {
    logLevel: process.env.LOG_LEVEL || 'info',
    jsonMode: process.env.LOG_JSON === '1',
    enableRealtime: process.env.LOG_REALTIME === '1',
    flushInterval: parseInt(process.env.LOG_FLUSH_INTERVAL) || 1000,
    maxBufferSize: parseInt(process.env.LOG_BUFFER_SIZE) || 100,
    maxLogSize: parseInt(process.env.LOG_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
    maxLogFiles: parseInt(process.env.LOG_MAX_FILES) || 5
};

// 로그 레벨 정의
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

// 민감 정보 필드 정의
const SENSITIVE_FIELDS = [
    'password', 'token', 'secret', 'key', 'auth', 'cookie',
    'authorization', 'x-api-key', 'jwt', 'session'
];

const SENSITIVE_HEADERS = [
    'authorization', 'cookie', 'x-api-key', 'x-auth-token',
    'x-session-id', 'x-csrf-token'
];

class EnhancedLogger {
    constructor() {
        this.buffer = [];
        this.realtimeClients = new Set();
        this.logFile = path.join(LOG_DIR, 'runtime.log');
        this.securityLogFile = path.join(LOG_DIR, 'security.log');
        this.errorLogFile = path.join(LOG_DIR, 'error.log');

        this.startFlushTimer();
        this.setupGracefulShutdown();
    }

    // 로그 레벨 체크
    shouldLog(level) {
        return LOG_LEVELS[level] <= LOG_LEVELS[CONFIG.logLevel];
    }

    // 민감 정보 마스킹
    sanitizeData(data) {
        if (!data || typeof data !== 'object') return data;

        const sanitized = Array.isArray(data) ? [...data] : { ...data };

        // 재귀적으로 객체 순회
        for (const [key, value] of Object.entries(sanitized)) {
            const lowerKey = key.toLowerCase();

            // 민감 필드 마스킹
            if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
                sanitized[key] = '***MASKED***';
            }
            // 헤더 마스킹
            else if (key === 'headers' && typeof value === 'object') {
                sanitized[key] = this.sanitizeHeaders(value);
            }
            // 중첩 객체 재귀 처리
            else if (value && typeof value === 'object') {
                sanitized[key] = this.sanitizeData(value);
            }
            // 긴 문자열 자르기
            else if (typeof value === 'string' && value.length > 500) {
                sanitized[key] = value.slice(0, 500) + '...[TRUNCATED]';
            }
        }

        return sanitized;
    }

    sanitizeHeaders(headers) {
        const sanitized = { ...headers };

        for (const header of SENSITIVE_HEADERS) {
            if (sanitized[header]) {
                sanitized[header] = '***MASKED***';
            }
        }

        return sanitized;
    }

    // 로그 엔트리 생성
    createLogEntry(level, message, meta = {}) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            pid: process.pid,
            ...this.sanitizeData(meta)
        };
    }

    // 로그 기록
    log(level, message, meta) {
        if (!this.shouldLog(level)) return;

        const entry = this.createLogEntry(level, message, meta);

        // 콘솔 출력
        this.outputToConsole(entry);

        // 버퍼에 추가
        this.buffer.push(entry);

        // 실시간 클라이언트에 전송
        if (CONFIG.enableRealtime) {
            this.broadcastToRealtimeClients(entry);
        }

        // 에러는 즉시 파일에 기록
        if (level === 'error') {
            this.writeToFile(this.errorLogFile, entry);
        }

        // 버퍼 크기 체크
        if (this.buffer.length >= CONFIG.maxBufferSize) {
            this.flush();
        }
    }

    // 콘솔 출력
    outputToConsole(entry) {
        const timestamp = entry.timestamp;
        const level = entry.level.toUpperCase().padEnd(5);

        if (CONFIG.jsonMode) {
            console.log(JSON.stringify(entry));
        } else {
            const meta = Object.keys(entry).length > 4 ?
                ' ' + JSON.stringify(this.sanitizeData(entry)) : '';
            console.log(`[${timestamp}] ${level} ${entry.message}${meta}`);
        }
    }

    // 실시간 클라이언트에 브로드캐스트
    broadcastToRealtimeClients(entry) {
        if (this.realtimeClients.size === 0) return;

        const message = JSON.stringify(entry);
        this.realtimeClients.forEach(client => {
            try {
                if (client.readyState === 1) { // WebSocket.OPEN
                    client.send(message);
                }
            } catch (error) {
                this.realtimeClients.delete(client);
            }
        });
    }

    // 파일에 비동기 쓰기
    async writeToFile(filePath, entry) {
        const logLine = JSON.stringify(entry) + '\n';

        try {
            await fs.promises.appendFile(filePath, logLine);
        } catch (error) {
            console.error(`Failed to write to log file ${filePath}:`, error.message);
        }
    }

    // 버퍼 플러시
    async flush() {
        if (this.buffer.length === 0) return;

        const entries = this.buffer.splice(0);
        const logText = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';

        try {
            await fs.promises.appendFile(this.logFile, logText);

            // 로그 로테이션 체크
            await this.checkLogRotation();
        } catch (error) {
            console.error('Failed to flush log buffer:', error.message);
            // 실패한 로그는 다시 버퍼에 추가 (최대 1회)
            if (entries.length < CONFIG.maxBufferSize) {
                this.buffer.unshift(...entries.slice(0, CONFIG.maxBufferSize - this.buffer.length));
            }
        }
    }

    // 로그 로테이션 체크
    async checkLogRotation() {
        try {
            const stats = await fs.promises.stat(this.logFile);
            if (stats.size > CONFIG.maxLogSize) {
                await this.rotateLog(this.logFile);
            }
        } catch (error) {
            // 파일이 없으면 무시
        }
    }

    // 로그 로테이션 실행
    async rotateLog(logFile) {
        const dir = path.dirname(logFile);
        const ext = path.extname(logFile);
        const base = path.basename(logFile, ext);

        try {
            // 기존 로그 파일들 순환
            for (let i = CONFIG.maxLogFiles - 1; i > 0; i--) {
                const oldFile = path.join(dir, `${base}.${i}${ext}`);
                const newFile = path.join(dir, `${base}.${i + 1}${ext}`);

                try {
                    await fs.promises.access(oldFile);
                    await fs.promises.rename(oldFile, newFile);
                } catch { /* 파일이 없으면 무시 */ }
            }

            // 현재 로그 파일을 .1로 이동
            const rotatedFile = path.join(dir, `${base}.1${ext}`);
            await fs.promises.rename(logFile, rotatedFile);

            this.info('log.rotated', { file: logFile, rotatedTo: rotatedFile });
        } catch (error) {
            this.error('log.rotation.failed', { file: logFile, error: error.message });
        }
    }

    // 보안 이벤트 로깅
    async logSecurityEvent(event, details) {
        const entry = this.createLogEntry('security', event, {
            event,
            severity: this.getSecuritySeverity(event),
            ip: details.ip,
            userAgent: details.userAgent,
            details: this.sanitizeData(details)
        });

        // 보안 로그는 즉시 기록
        await this.writeToFile(this.securityLogFile, entry);

        // 콘솔과 실시간 클라이언트에도 전송
        this.outputToConsole(entry);
        if (CONFIG.enableRealtime) {
            this.broadcastToRealtimeClients(entry);
        }

        // 심각한 보안 이벤트는 에러 로그에도 기록
        if (entry.severity === 'critical') {
            await this.writeToFile(this.errorLogFile, entry);
        }
    }

    getSecuritySeverity(event) {
        const criticalEvents = ['brute_force', 'sql_injection', 'xss_attempt', 'unauthorized_access'];
        const warningEvents = ['rate_limit_exceeded', 'invalid_token', 'suspicious_request'];

        if (criticalEvents.includes(event)) return 'critical';
        if (warningEvents.includes(event)) return 'warning';
        return 'info';
    }

    // 실시간 클라이언트 관리
    addRealtimeClient(client) {
        this.realtimeClients.add(client);

        client.on('close', () => {
            this.realtimeClients.delete(client);
        });
    }

    // 플러시 타이머 시작
    startFlushTimer() {
        setInterval(() => {
            this.flush().catch(error => {
                console.error('Auto-flush failed:', error.message);
            });
        }, CONFIG.flushInterval);
    }

    // 우아한 종료 설정
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            console.log(`Received ${signal}, flushing logs before exit...`);
            await this.flush();
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        process.on('beforeExit', () => {
            this.flush().catch(() => { });
        });
    }

    // 로그 메서드들
    debug(message, meta) { this.log('debug', message, meta); }
    info(message, meta) { this.log('info', message, meta); }
    warn(message, meta) { this.log('warn', message, meta); }
    error(message, meta) { this.log('error', message, meta); }
    event(code, meta) { this.log('info', code, meta); }
    security(event, details) { this.logSecurityEvent(event, details); }
}

// 싱글톤 인스턴스 생성
const enhancedLogger = new EnhancedLogger();

export default enhancedLogger;
export { enhancedLogger as logger };