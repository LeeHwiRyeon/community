const winston = require('winston');
const path = require('path');

// 로그 레벨 정의
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// 로그 레벨별 색상 정의
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
};

winston.addColors(colors);

// 로그 포맷 정의
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// 파일별 로그 포맷 (색상 없음)
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// 로그 파일 경로
const logDir = path.join(__dirname, '../../logs');

// Winston 로거 설정
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format: fileFormat,
    transports: [
        // 에러 로그 파일
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // 모든 로그 파일
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

// 개발 환경에서는 콘솔에도 출력
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: format
    }));
}

// HTTP 요청 로그를 위한 별도 로거
const httpLogger = winston.createLogger({
    level: 'http',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, message }) => `${timestamp} HTTP: ${message}`)
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, 'http.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 3,
        })
    ]
});

// 에러 로그 헬퍼 함수
const logError = (error, context = '') => {
    const errorMessage = context ? `${context}: ${error.message}` : error.message;
    logger.error(errorMessage, {
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
    });
};

// 성능 로그 헬퍼 함수
const logPerformance = (operation, duration, metadata = {}) => {
    logger.info(`Performance: ${operation} completed in ${duration}ms`, {
        operation,
        duration,
        ...metadata,
        timestamp: new Date().toISOString()
    });
};

// 보안 로그 헬퍼 함수
const logSecurity = (event, details = {}) => {
    logger.warn(`Security: ${event}`, {
        event,
        ...details,
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    logger,
    httpLogger,
    logError,
    logPerformance,
    logSecurity
};
