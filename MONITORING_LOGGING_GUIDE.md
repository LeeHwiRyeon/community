# 모니터링 & 로깅 가이드 (Monitoring & Logging Guide)

## 📋 목차
- [1. 개요](#1-개요)
- [2. 현재 로깅 현황](#2-현재-로깅-현황)
- [3. Winston 로거 구현](#3-winston-로거-구현)
- [4. Sentry 에러 추적](#4-sentry-에러-추적)
- [5. 성능 모니터링](#5-성능-모니터링)
- [6. 로그 집계 및 분석](#6-로그-집계-및-분석)
- [7. 알림 및 경고](#7-알림-및-경고)
- [8. 헬스 체크](#8-헬스-체크)
- [9. 메트릭 수집](#9-메트릭-수집)
- [10. 대시보드 구성](#10-대시보드-구성)
- [11. 체크리스트](#11-체크리스트)
- [12. 구현 로드맵](#12-구현-로드맵)

---

## 1. 개요

### 1.1 목표
프로덕션 환경에서 애플리케이션의 **안정성, 성능, 가용성**을 보장하기 위한 종합 모니터링 및 로깅 시스템 구축

### 1.2 주요 도구
- **Winston**: 구조화된 로깅
- **Sentry**: 에러 추적 및 성능 모니터링
- **New Relic / DataDog**: APM (Application Performance Monitoring)
- **Prometheus + Grafana**: 메트릭 수집 및 시각화
- **ELK Stack**: 로그 집계 및 분석 (선택 사항)

### 1.3 모니터링 목표
| 항목           | 현재        | 목표          |
| -------------- | ----------- | ------------- |
| 에러 탐지 시간 | 수동 확인   | 실시간 (<1분) |
| 로그 구조화    | console.log | JSON 구조화   |
| 에러 추적      | 미흡        | 100% 캡처     |
| 성능 모니터링  | 없음        | APM 실시간    |
| 알림 시스템    | 없음        | Slack/Email   |
| 업타임         | 미측정      | 99.9%         |

---

## 2. 현재 로깅 현황

### 2.1 ❌ 현재 문제점

#### console.log 남용
```javascript
// server-backend/app.js (현재 상태)
console.log('✅ MySQL 데이터베이스 연결 성공');
console.error('❌ 데이터베이스 연결 실패:', error);
console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
```

**문제점:**
- 구조화되지 않은 로그
- 로그 레벨 없음 (info, warn, error 구분 불가)
- 로그 집계 어려움
- 프로덕션에서 console.log 성능 이슈
- 검색 및 필터링 불가능

### 2.2 개선 필요 영역

1. **구조화된 로깅**
   - JSON 형식
   - 타임스탬프, 로그 레벨, 메시지, 메타데이터

2. **로그 레벨 분리**
   - ERROR: 에러 발생
   - WARN: 경고 (주의 필요)
   - INFO: 정보성 메시지
   - DEBUG: 디버깅 정보 (개발 환경만)

3. **에러 추적**
   - 스택 트레이스 보존
   - 컨텍스트 정보 (사용자 ID, 요청 ID)
   - 에러 그룹핑

4. **성능 메트릭**
   - API 응답 시간
   - 데이터베이스 쿼리 시간
   - 외부 API 호출 시간

---

## 3. Winston 로거 구현

### 3.1 Winston 설치

```bash
cd server-backend
npm install winston winston-daily-rotate-file
```

### 3.2 Logger 설정

```javascript
// server-backend/src/config/logger.js
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// 로그 디렉토리
const logDir = process.env.LOG_DIR || 'logs';

// 커스텀 로그 포맷 (사람이 읽기 쉬운 형식)
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // 메타데이터 추가
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
});

// 프로덕션용 JSON 포맷
const productionFormat = combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // 에러 스택 트레이스 포함
    json()
);

// 개발용 포맷 (색상 포함)
const developmentFormat = combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    consoleFormat
);

// Transport 설정
const transports = [
    // 콘솔 출력
    new winston.transports.Console({
        format: process.env.NODE_ENV === 'production' 
            ? productionFormat 
            : developmentFormat,
        level: process.env.LOG_LEVEL || 'info'
    }),

    // 일반 로그 파일 (daily rotation)
    new DailyRotateFile({
        filename: path.join(logDir, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d', // 14일간 보관
        format: productionFormat,
        level: 'info'
    }),

    // 에러 로그 파일 (별도 저장)
    new DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d', // 30일간 보관
        format: productionFormat,
        level: 'error'
    })
];

// Logger 생성
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: productionFormat,
    transports,
    exitOnError: false // 에러 발생 시 프로세스 종료 방지
});

// Stream for Morgan HTTP logger
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

export default logger;
```

### 3.3 Logger 사용 예시

```javascript
// server-backend/app.js 업데이트
import logger from './config/logger.js';

// ❌ Before
console.log('✅ MySQL 데이터베이스 연결 성공');
console.error('❌ 데이터베이스 연결 실패:', error);

// ✅ After
logger.info('MySQL database connected successfully', {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME
});

logger.error('Database connection failed', {
    error: error.message,
    stack: error.stack,
    host: process.env.DB_HOST
});
```

### 3.4 HTTP 요청 로깅 (Morgan)

```bash
npm install morgan
```

```javascript
// server-backend/app.js
import morgan from 'morgan';
import logger from './config/logger.js';

// Morgan 설정 (Winston과 통합)
app.use(morgan('combined', { 
    stream: logger.stream,
    skip: (req, res) => res.statusCode < 400 // 에러만 로깅
}));

// 또는 상세 로깅
app.use(morgan(':method :url :status :response-time ms - :res[content-length]', {
    stream: logger.stream
}));
```

### 3.5 요청 ID 추적

```javascript
// server-backend/middleware/requestLogger.js
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger.js';

export const requestLogger = (req, res, next) => {
    // 고유 요청 ID 생성
    req.id = uuidv4();
    
    // 요청 시작 시간
    const startTime = Date.now();
    
    // 요청 정보 로깅
    logger.info('Incoming request', {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.id
    });
    
    // 응답 완료 시 로깅
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        logger.info('Request completed', {
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req.user?.id
        });
    });
    
    next();
};

// app.js에서 사용
import { requestLogger } from './middleware/requestLogger.js';
app.use(requestLogger);
```

---

## 4. Sentry 에러 추적

### 4.1 Sentry 설정

```bash
# Backend
cd server-backend
npm install @sentry/node @sentry/profiling-node

# Frontend
cd frontend
npm install @sentry/react @sentry/tracing
```

### 4.2 Backend Sentry 설정

```javascript
// server-backend/src/config/sentry.js
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export const initSentry = (app) => {
    if (!process.env.SENTRY_DSN) {
        console.warn('⚠️ Sentry DSN not configured, error tracking disabled');
        return;
    }

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        
        // 트랜잭션 샘플링 (성능 모니터링)
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        
        // 프로파일링 샘플링
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        
        integrations: [
            // Express 통합
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app }),
            new ProfilingIntegration(),
        ],
        
        // 민감 정보 제외
        beforeSend(event, hint) {
            // 비밀번호, 토큰 등 제거
            if (event.request) {
                delete event.request.cookies;
                delete event.request.headers?.authorization;
            }
            return event;
        },
    });

    // Request handler (먼저 추가)
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
};

export const sentryErrorHandler = () => {
    // Error handler (마지막에 추가)
    return Sentry.Handlers.errorHandler({
        shouldHandleError(error) {
            // 4xx 에러는 제외 (클라이언트 에러)
            if (error.status >= 400 && error.status < 500) {
                return false;
            }
            return true;
        }
    });
};

export default Sentry;
```

```javascript
// server-backend/app.js
import { initSentry, sentryErrorHandler } from './config/sentry.js';

const app = express();

// Sentry 초기화 (가장 먼저)
initSentry(app);

// ... 미들웨어 및 라우트 ...

// Sentry 에러 핸들러 (에러 핸들러 전에)
app.use(sentryErrorHandler());

// 일반 에러 핸들러
app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        requestId: req.id,
        url: req.originalUrl
    });
    
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});
```

### 4.3 Frontend Sentry 설정

```typescript
// frontend/src/config/sentry.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export const initSentry = () => {
    if (!import.meta.env.VITE_SENTRY_DSN) {
        console.warn('⚠️ Sentry DSN not configured');
        return;
    }

    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        
        // 성능 모니터링
        integrations: [
            new BrowserTracing({
                // React Router 통합
                routingInstrumentation: Sentry.reactRouterV6Instrumentation(
                    React.useEffect,
                    useLocation,
                    useNavigationType,
                    createRoutesFromChildren,
                    matchRoutes
                ),
            }),
        ],
        
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
        
        // 세션 리플레이 (사용자 행동 녹화)
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        
        // 브레드크럼 설정
        beforeBreadcrumb(breadcrumb, hint) {
            // 민감한 정보 제거
            if (breadcrumb.category === 'console') {
                return null;
            }
            return breadcrumb;
        },
    });
};

// 에러 바운더리
export const SentryErrorBoundary = Sentry.ErrorBoundary;
```

```tsx
// frontend/src/main.tsx
import { initSentry, SentryErrorBoundary } from './config/sentry';

initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <SentryErrorBoundary fallback={<ErrorFallback />}>
            <App />
        </SentryErrorBoundary>
    </React.StrictMode>
);
```

### 4.4 수동 에러 캡처

```javascript
// Backend
import Sentry from '@sentry/node';

try {
    await processPayment(userId, amount);
} catch (error) {
    Sentry.captureException(error, {
        tags: {
            section: 'payment',
            userId: userId
        },
        extra: {
            amount: amount,
            timestamp: new Date().toISOString()
        }
    });
    
    logger.error('Payment processing failed', {
        error: error.message,
        userId,
        amount
    });
    
    throw error;
}
```

```typescript
// Frontend
import * as Sentry from '@sentry/react';

const handleError = (error: Error) => {
    Sentry.captureException(error, {
        tags: {
            component: 'PaymentForm'
        },
        extra: {
            formData: sanitizedFormData
        }
    });
};
```

---

## 5. 성능 모니터링

### 5.1 New Relic APM 설정

```bash
cd server-backend
npm install newrelic
```

```javascript
// server-backend/newrelic.js (프로젝트 루트)
'use strict';

exports.config = {
    app_name: ['Community Platform Backend'],
    license_key: process.env.NEW_RELIC_LICENSE_KEY,
    
    logging: {
        level: 'info',
        filepath: 'stdout'
    },
    
    // 트랜잭션 추적
    transaction_tracer: {
        enabled: true,
        transaction_threshold: 'apdex_f',
        record_sql: 'obfuscated',
        explain_threshold: 500
    },
    
    // 에러 수집
    error_collector: {
        enabled: true,
        ignore_status_codes: [404]
    },
    
    // 분산 추적
    distributed_tracing: {
        enabled: true
    },
    
    // 느린 쿼리 추적
    slow_sql: {
        enabled: true
    }
};
```

```javascript
// server-backend/src/index.js (맨 위에 추가)
import 'newrelic'; // 반드시 첫 줄!
import express from 'express';
// ... 나머지 import
```

### 5.2 커스텀 메트릭 추적

```javascript
// server-backend/middleware/performanceMonitor.js
import newrelic from 'newrelic';

export const performanceMonitor = (name) => {
    return (req, res, next) => {
        const startTime = Date.now();
        
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            
            // New Relic 커스텀 메트릭
            newrelic.recordMetric(`Custom/${name}/ResponseTime`, duration);
            newrelic.recordMetric(`Custom/${name}/StatusCode/${res.statusCode}`, 1);
            
            // 느린 요청 경고
            if (duration > 1000) {
                logger.warn('Slow request detected', {
                    endpoint: name,
                    duration: `${duration}ms`,
                    method: req.method,
                    url: req.originalUrl
                });
            }
        });
        
        next();
    };
};

// 사용 예시
import { performanceMonitor } from '../middleware/performanceMonitor.js';

app.use('/api/posts', performanceMonitor('Posts'), postsRouter);
app.use('/api/users', performanceMonitor('Users'), usersRouter);
```

### 5.3 데이터베이스 쿼리 모니터링

```javascript
// server-backend/config/database.js
import logger from './logger.js';
import newrelic from 'newrelic';

// 쿼리 실행 래퍼
export const executeQuery = async (query, params = []) => {
    const startTime = Date.now();
    
    try {
        const [results] = await pool.execute(query, params);
        
        const duration = Date.now() - startTime;
        
        // 느린 쿼리 로깅
        if (duration > 100) {
            logger.warn('Slow query detected', {
                query: query.substring(0, 100), // 첫 100자만
                duration: `${duration}ms`,
                params: params.length
            });
            
            // New Relic 커스텀 이벤트
            newrelic.recordCustomEvent('SlowQuery', {
                query: query.substring(0, 100),
                duration,
                timestamp: new Date().toISOString()
            });
        }
        
        return results;
    } catch (error) {
        logger.error('Query execution failed', {
            error: error.message,
            query: query.substring(0, 100)
        });
        throw error;
    }
};
```

---

## 6. 로그 집계 및 분석

### 6.1 ELK Stack (선택 사항)

#### Docker Compose 설정

```yaml
# docker-compose.elk.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - elk

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    volumes:
      - ./logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logs:/logs:ro
    ports:
      - "5044:5044"
      - "9600:9600"
    environment:
      LS_JAVA_OPTS: "-Xmx256m -Xms256m"
    networks:
      - elk
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_URL: http://elasticsearch:9200
      ELASTICSEARCH_HOSTS: '["http://elasticsearch:9200"]'
    networks:
      - elk
    depends_on:
      - elasticsearch

networks:
  elk:
    driver: bridge

volumes:
  elasticsearch-data:
    driver: local
```

#### Logstash 파이프라인

```ruby
# logstash/pipeline/logstash.conf
input {
  file {
    path => "/logs/application-*.log"
    start_position => "beginning"
    codec => json
  }
}

filter {
  if [level] == "error" {
    mutate {
      add_tag => ["error"]
    }
  }
  
  if [duration] {
    mutate {
      convert => { "duration" => "integer" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "app-logs-%{+YYYY.MM.dd}"
  }
  
  # 에러는 별도 인덱스
  if "error" in [tags] {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "app-errors-%{+YYYY.MM.dd}"
    }
  }
  
  stdout { codec => rubydebug }
}
```

### 6.2 Winston Elasticsearch Transport (대안)

```bash
npm install winston-elasticsearch
```

```javascript
// server-backend/config/logger.js
import { ElasticsearchTransport } from 'winston-elasticsearch';

const esTransport = new ElasticsearchTransport({
    level: 'info',
    clientOpts: {
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        auth: {
            username: process.env.ES_USERNAME,
            password: process.env.ES_PASSWORD
        }
    },
    index: 'app-logs'
});

// Logger에 추가
const logger = winston.createLogger({
    transports: [
        // ... 기존 transports
        esTransport
    ]
});
```

---

## 7. 알림 및 경고

### 7.1 Slack 알림

```bash
npm install @slack/webhook
```

```javascript
// server-backend/src/services/alertService.js
import { IncomingWebhook } from '@slack/webhook';
import logger from '../config/logger.js';

const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);

export const sendSlackAlert = async (message, level = 'info') => {
    if (!process.env.SLACK_WEBHOOK_URL) {
        logger.warn('Slack webhook not configured');
        return;
    }

    const colors = {
        error: '#FF0000',
        warn: '#FFA500',
        info: '#0000FF',
        success: '#00FF00'
    };

    try {
        await webhook.send({
            attachments: [{
                color: colors[level] || colors.info,
                title: `[${level.toUpperCase()}] Community Platform`,
                text: message,
                footer: process.env.NODE_ENV,
                ts: Math.floor(Date.now() / 1000)
            }]
        });
    } catch (error) {
        logger.error('Failed to send Slack alert', {
            error: error.message
        });
    }
};

// 사용 예시
export const notifyError = async (error, context) => {
    const message = `
🚨 *Error Detected*
*Message:* ${error.message}
*Context:* ${context}
*Stack:* \`\`\`${error.stack?.substring(0, 500)}\`\`\`
    `;
    
    await sendSlackAlert(message, 'error');
};

export const notifySlowQuery = async (query, duration) => {
    const message = `
⚠️ *Slow Query Detected*
*Duration:* ${duration}ms
*Query:* \`${query.substring(0, 200)}\`
    `;
    
    await sendSlackAlert(message, 'warn');
};
```

```javascript
// app.js에서 사용
import { notifyError } from './services/alertService.js';

app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack
    });
    
    // 프로덕션에서만 Slack 알림
    if (process.env.NODE_ENV === 'production') {
        notifyError(err, `${req.method} ${req.originalUrl}`);
    }
    
    res.status(err.status || 500).json({
        error: 'Internal server error'
    });
});
```

### 7.2 이메일 알림

```bash
npm install nodemailer
```

```javascript
// server-backend/src/services/emailAlertService.js
import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export const sendEmailAlert = async (subject, body) => {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.ALERT_EMAIL,
            subject: `[ALERT] ${subject}`,
            html: body
        });
    } catch (error) {
        logger.error('Failed to send email alert', {
            error: error.message
        });
    }
};
```

---

## 8. 헬스 체크

### 8.1 헬스 체크 엔드포인트

```javascript
// server-backend/routes/health.js
import express from 'express';
import { pool } from '../config/database.js';
import { redisClient } from '../config/redis.js';
import { esClient } from '../config/elasticsearch.js';

const router = express.Router();

// 기본 헬스 체크
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 상세 헬스 체크
router.get('/health/detailed', async (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {}
    };

    // MySQL 체크
    try {
        await pool.query('SELECT 1');
        health.services.mysql = { status: 'UP' };
    } catch (error) {
        health.services.mysql = { status: 'DOWN', error: error.message };
        health.status = 'DEGRADED';
    }

    // Redis 체크
    try {
        await redisClient.ping();
        health.services.redis = { status: 'UP' };
    } catch (error) {
        health.services.redis = { status: 'DOWN', error: error.message };
        health.status = 'DEGRADED';
    }

    // Elasticsearch 체크
    try {
        const esHealth = await esClient.cluster.health();
        health.services.elasticsearch = { 
            status: esHealth.status.toUpperCase(),
            nodes: esHealth.number_of_nodes
        };
    } catch (error) {
        health.services.elasticsearch = { status: 'DOWN', error: error.message };
        health.status = 'DEGRADED';
    }

    // 메모리 사용량
    const memUsage = process.memoryUsage();
    health.memory = {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
    };

    const statusCode = health.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(health);
});

// Readiness probe (K8s)
router.get('/ready', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'READY' });
    } catch (error) {
        res.status(503).json({ status: 'NOT_READY' });
    }
});

// Liveness probe (K8s)
router.get('/alive', (req, res) => {
    res.status(200).json({ status: 'ALIVE' });
});

export default router;
```

```javascript
// app.js
import healthRouter from './routes/health.js';
app.use('/api', healthRouter);
```

### 8.2 외부 모니터링 (UptimeRobot, Pingdom)

```javascript
// 헬스 체크 URL 설정
// https://api.yourdomain.com/api/health (1분마다 체크)
// https://api.yourdomain.com/api/health/detailed (5분마다 체크)
```

---

## 9. 메트릭 수집

### 9.1 Prometheus 메트릭

```bash
npm install prom-client
```

```javascript
// server-backend/src/config/metrics.js
import { register, Counter, Histogram, Gauge } from 'prom-client';

// HTTP 요청 카운터
export const httpRequestCounter = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

// HTTP 요청 지연 시간
export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// 데이터베이스 연결 풀
export const dbPoolGauge = new Gauge({
    name: 'db_pool_connections',
    help: 'Number of database pool connections',
    labelNames: ['state'] // active, idle
});

// 활성 사용자 수
export const activeUsersGauge = new Gauge({
    name: 'active_users_total',
    help: 'Number of currently active users'
});

// 메트릭 엔드포인트
export const metricsEndpoint = (req, res) => {
    res.set('Content-Type', register.contentType);
    register.metrics().then(data => res.send(data));
};
```

```javascript
// server-backend/middleware/metricsMiddleware.js
import { httpRequestCounter, httpRequestDuration } from '../config/metrics.js';

export const metricsMiddleware = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path;

        httpRequestCounter.inc({
            method: req.method,
            route: route,
            status_code: res.statusCode
        });

        httpRequestDuration.observe({
            method: req.method,
            route: route,
            status_code: res.statusCode
        }, duration);
    });

    next();
};
```

```javascript
// app.js
import { metricsMiddleware, metricsEndpoint } from './config/metrics.js';

app.use(metricsMiddleware);

// 메트릭 엔드포인트 (보안 필요)
app.get('/metrics', metricsEndpoint);
```

### 9.2 Prometheus 설정

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'community-backend'
    static_configs:
      - targets: ['localhost:50000']
    metrics_path: '/metrics'
```

---

## 10. 대시보드 구성

### 10.1 Grafana 대시보드

#### Key Metrics
- **System Health**: CPU, Memory, Disk
- **Application**: Request rate, Error rate, Latency (P50, P95, P99)
- **Database**: Query time, Connection pool, Slow queries
- **Cache**: Hit rate, Miss rate, Evictions
- **Business**: Active users, New registrations, Posts created

#### Grafana Dashboard JSON (예시)

```json
{
  "dashboard": {
    "title": "Community Platform Monitoring",
    "panels": [
      {
        "title": "HTTP Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Response Time (P95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)"
          }
        ]
      }
    ]
  }
}
```

### 10.2 주요 알림 규칙

```yaml
# prometheus/alerts.yml
groups:
  - name: application
    interval: 1m
    rules:
      # 에러율 5% 초과
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      # 응답 시간 2초 초과
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow response time"
          description: "P95 latency is {{ $value }}s"

      # 메모리 사용량 80% 초과
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / node_memory_MemTotal_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"

      # 데이터베이스 연결 실패
      - alert: DatabaseDown
        expr: up{job="mysql"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
```

---

## 11. 체크리스트

### 11.1 로깅

- [ ] Winston 로거 설정 완료
- [ ] 구조화된 로그 포맷 (JSON)
- [ ] 로그 레벨 분리 (ERROR, WARN, INFO, DEBUG)
- [ ] Daily log rotation 설정
- [ ] 요청 ID 추적
- [ ] HTTP 요청/응답 로깅 (Morgan)
- [ ] 민감 정보 마스킹 (비밀번호, 토큰)
- [ ] 로그 파일 보관 정책 (14일/30일)

### 11.2 에러 추적

- [ ] Sentry 설치 및 설정
- [ ] Backend 에러 캡처
- [ ] Frontend 에러 캡처
- [ ] 에러 바운더리 구현
- [ ] 소스맵 업로드 (프로덕션)
- [ ] 민감 정보 제외 (beforeSend)
- [ ] 성능 트랜잭션 추적
- [ ] 사용자 피드백 수집

### 11.3 성능 모니터링

- [ ] New Relic 또는 DataDog 설정
- [ ] API 응답 시간 추적
- [ ] 데이터베이스 쿼리 모니터링
- [ ] 느린 쿼리 알림 (>100ms)
- [ ] 메모리 사용량 모니터링
- [ ] CPU 사용량 모니터링
- [ ] 외부 API 호출 추적
- [ ] 커스텀 메트릭 수집

### 11.4 알림

- [ ] Slack 웹훅 설정
- [ ] 이메일 알림 설정
- [ ] 에러 발생 시 실시간 알림
- [ ] 느린 쿼리 알림
- [ ] 서비스 다운 알림
- [ ] 높은 에러율 알림 (>5%)
- [ ] 메모리 부족 알림 (>80%)
- [ ] 디스크 부족 알림 (>90%)

### 11.5 헬스 체크

- [ ] `/health` 엔드포인트 구현
- [ ] `/health/detailed` 상세 체크
- [ ] MySQL 연결 체크
- [ ] Redis 연결 체크
- [ ] Elasticsearch 연결 체크
- [ ] `/ready` readiness probe (K8s)
- [ ] `/alive` liveness probe (K8s)
- [ ] UptimeRobot 또는 Pingdom 설정

### 11.6 메트릭

- [ ] Prometheus 메트릭 수집
- [ ] HTTP 요청 카운터
- [ ] HTTP 응답 시간 히스토그램
- [ ] 데이터베이스 연결 풀 게이지
- [ ] 활성 사용자 수 게이지
- [ ] 비즈니스 메트릭 (가입, 게시글)
- [ ] Grafana 대시보드 구성
- [ ] 알림 규칙 설정

---

## 12. 구현 로드맵

### Week 1: 로깅 시스템 (Foundation)
**목표**: Winston 로거 및 구조화된 로깅

- **Day 1-2**: Winston 설정
  - [ ] Winston 및 플러그인 설치
  - [ ] Logger 설정 파일 작성 (logger.js)
  - [ ] 콘솔 및 파일 transport 설정
  - [ ] Daily rotation 설정

- **Day 3-4**: 로깅 통합
  - [ ] app.js의 모든 console.log → logger로 교체
  - [ ] 모든 라우트/미들웨어에 로거 적용
  - [ ] 요청 ID 추적 미들웨어 구현
  - [ ] Morgan HTTP 로깅 통합

- **Day 5**: 테스트 및 검증
  - [ ] 로그 파일 생성 확인
  - [ ] 로그 포맷 검증 (JSON)
  - [ ] 로그 레벨 필터링 테스트
  - [ ] 로그 rotation 테스트

### Week 2: 에러 추적 (Error Tracking)
**목표**: Sentry 통합 및 에러 모니터링

- **Day 1-2**: Backend Sentry
  - [ ] Sentry 프로젝트 생성
  - [ ] Backend Sentry SDK 설치
  - [ ] Sentry 설정 파일 작성
  - [ ] 에러 핸들러 통합

- **Day 3-4**: Frontend Sentry
  - [ ] Frontend Sentry SDK 설치
  - [ ] Sentry 초기화 코드
  - [ ] 에러 바운더리 구현
  - [ ] React Router 통합

- **Day 5**: 알림 설정
  - [ ] Slack 웹훅 설정
  - [ ] alertService.js 구현
  - [ ] 에러 발생 시 Slack 알림
  - [ ] 이메일 알림 설정 (선택)

### Week 3: 성능 모니터링 (Performance)
**목표**: APM 및 메트릭 수집

- **Day 1-2**: New Relic 또는 DataDog
  - [ ] APM 서비스 가입
  - [ ] Agent 설치 및 설정
  - [ ] 트랜잭션 추적 확인
  - [ ] 커스텀 메트릭 추가

- **Day 3-4**: Prometheus + Grafana
  - [ ] prom-client 설치
  - [ ] 메트릭 수집 코드 작성
  - [ ] `/metrics` 엔드포인트 구현
  - [ ] Prometheus 설정 (Docker)

- **Day 5**: Grafana 대시보드
  - [ ] Grafana 설치 (Docker)
  - [ ] Prometheus 데이터소스 연결
  - [ ] 주요 대시보드 생성
  - [ ] 알림 규칙 설정

### Week 4: 헬스 체크 & 최종 검증
**목표**: 헬스 체크 및 전체 시스템 검증

- **Day 1-2**: 헬스 체크
  - [ ] `/health` 엔드포인트 구현
  - [ ] MySQL, Redis, ES 연결 체크
  - [ ] K8s probe 엔드포인트 (/ready, /alive)
  - [ ] UptimeRobot 설정

- **Day 3-4**: 통합 테스트
  - [ ] 에러 발생 시나리오 테스트
  - [ ] Slack 알림 동작 확인
  - [ ] 성능 메트릭 수집 확인
  - [ ] 대시보드 데이터 표시 확인

- **Day 5**: 문서화 및 최종 점검
  - [ ] 모니터링 운영 가이드 작성
  - [ ] 알림 대응 절차 문서화
  - [ ] 팀 교육 자료 준비
  - [ ] 프로덕션 배포 준비

---

## 13. 환경 변수 설정

```bash
# server-backend/.env.production

# Winston Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production

# New Relic
NEW_RELIC_LICENSE_KEY=your-license-key
NEW_RELIC_APP_NAME=Community Platform Backend

# Slack Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email Alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=alerts@yourdomain.com
SMTP_PASS=your-password
SMTP_FROM=alerts@yourdomain.com
ALERT_EMAIL=team@yourdomain.com

# Elasticsearch (로그 집계 - 선택)
ELASTICSEARCH_URL=http://localhost:9200
ES_USERNAME=elastic
ES_PASSWORD=changeme

# Prometheus
PROMETHEUS_PORT=9090
```

---

## 14. 주요 명령어

```bash
# 로그 확인
tail -f logs/application-2025-11-12.log
tail -f logs/error-2025-11-12.log

# JSON 로그 파싱
cat logs/application-2025-11-12.log | jq '.level, .message'

# 에러 로그만 필터링
cat logs/application-2025-11-12.log | jq 'select(.level=="error")'

# Prometheus 메트릭 확인
curl http://localhost:50000/metrics

# 헬스 체크
curl http://localhost:50000/api/health
curl http://localhost:50000/api/health/detailed

# ELK Stack 시작 (선택)
docker-compose -f docker-compose.elk.yml up -d

# Grafana 접속
open http://localhost:3000
```

---

## 15. 비용 추정

### 월간 예상 비용 (소규모 서비스 기준)

| 서비스         | 플랜               | 월간 비용    |
| -------------- | ------------------ | ------------ |
| Sentry         | Team (100K errors) | $26          |
| New Relic      | Standard           | $99          |
| UptimeRobot    | Free (50 monitors) | $0           |
| AWS CloudWatch | 10GB logs          | ~$10         |
| **Total**      |                    | **~$135/월** |

### 무료 대안
- **로깅**: Winston (로컬 파일)
- **에러 추적**: Sentry 무료 플랜 (5K errors)
- **모니터링**: Self-hosted Prometheus + Grafana
- **알림**: Slack 무료 플랜
- **헬스 체크**: UptimeRobot 무료 플랜

---

## 16. 결론

종합적인 모니터링 및 로깅 시스템을 통해:

- 🔍 **실시간 에러 탐지**: Sentry + Slack 알림
- 📊 **성능 가시성**: APM + Grafana 대시보드
- 📝 **구조화된 로깅**: Winston JSON 로그
- 🚨 **선제적 대응**: 알림 규칙 + 헬스 체크
- 📈 **데이터 기반 의사결정**: 메트릭 분석

4주간의 체계적인 구현으로 안정적인 프로덕션 환경을 구축합니다.

---

**작성일**: 2025-11-12  
**작성자**: AUTOAGENTS  
**버전**: 1.0
