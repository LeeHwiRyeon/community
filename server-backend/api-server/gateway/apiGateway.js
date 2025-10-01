const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const ServiceDiscovery = require('../services/serviceDiscovery');
const AlertService = require('../services/alertService');

class APIGateway {
    constructor() {
        this.app = express();
        this.serviceDiscovery = new ServiceDiscovery();
        this.alertService = new AlertService();
        this.routes = new Map();
        this.middleware = [];
        this.isInitialized = false;
    }

    // API 게이트웨이 초기화
    async initialize() {
        if (this.isInitialized) {
            console.log('API 게이트웨이가 이미 초기화되었습니다.');
            return;
        }

        // 기본 미들웨어 설정
        this.setupMiddleware();

        // 서비스 등록
        await this.registerServices();

        // 라우트 설정
        this.setupRoutes();

        // 에러 핸들링
        this.setupErrorHandling();

        this.isInitialized = true;
        console.log('API 게이트웨이가 초기화되었습니다.');
    }

    // 미들웨어 설정
    setupMiddleware() {
        // 보안 헤더
        this.app.use(helmet());

        // CORS 설정
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true,
        }));

        // 요청 파싱
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // 요청 로깅
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
            next();
        });

        // 전역 속도 제한
        const globalRateLimit = rateLimit({
            windowMs: 15 * 60 * 1000, // 15분
            max: 1000, // 최대 1000 요청
            message: {
                error: '너무 많은 요청이 발생했습니다.',
                retryAfter: '15분',
            },
        });
        this.app.use(globalRateLimit);
    }

    // 서비스 등록
    async registerServices() {
        // 사용자 서비스
        this.serviceDiscovery.registerService({
            name: 'user-service',
            host: process.env.USER_SERVICE_HOST || 'localhost',
            port: process.env.USER_SERVICE_PORT || 3001,
            healthCheck: '/health',
            metadata: {
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
            },
        });

        // 게시글 서비스
        this.serviceDiscovery.registerService({
            name: 'post-service',
            host: process.env.POST_SERVICE_HOST || 'localhost',
            port: process.env.POST_SERVICE_PORT || 3002,
            healthCheck: '/health',
            metadata: {
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
            },
        });

        // 채팅 서비스
        this.serviceDiscovery.registerService({
            name: 'chat-service',
            host: process.env.CHAT_SERVICE_HOST || 'localhost',
            port: process.env.CHAT_SERVICE_PORT || 3003,
            healthCheck: '/health',
            metadata: {
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
            },
        });

        // 검색 서비스
        this.serviceDiscovery.registerService({
            name: 'search-service',
            host: process.env.SEARCH_SERVICE_HOST || 'localhost',
            port: process.env.SEARCH_SERVICE_PORT || 3004,
            healthCheck: '/health',
            metadata: {
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
            },
        });

        // 알림 서비스
        this.serviceDiscovery.registerService({
            name: 'notification-service',
            host: process.env.NOTIFICATION_SERVICE_HOST || 'localhost',
            port: process.env.NOTIFICATION_SERVICE_PORT || 3005,
            healthCheck: '/health',
            metadata: {
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
            },
        });

        // 로드 밸런서 생성
        this.serviceDiscovery.createLoadBalancer('user-service', 'round-robin');
        this.serviceDiscovery.createLoadBalancer('post-service', 'round-robin');
        this.serviceDiscovery.createLoadBalancer('chat-service', 'round-robin');
        this.serviceDiscovery.createLoadBalancer('search-service', 'round-robin');
        this.serviceDiscovery.createLoadBalancer('notification-service', 'round-robin');

        // 서킷 브레이커 생성
        this.serviceDiscovery.createCircuitBreaker('user-service', {
            failureThreshold: 5,
            timeout: 60000,
            successThreshold: 3,
        });
        this.serviceDiscovery.createCircuitBreaker('post-service', {
            failureThreshold: 5,
            timeout: 60000,
            successThreshold: 3,
        });
        this.serviceDiscovery.createCircuitBreaker('chat-service', {
            failureThreshold: 3,
            timeout: 30000,
            successThreshold: 2,
        });
    }

    // 라우트 설정
    setupRoutes() {
        // 헬스 체크
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: this.serviceDiscovery.getDiscoveryStatus(),
            });
        });

        // API 문서
        this.app.get('/api/docs', (req, res) => {
            res.json({
                title: 'Community Platform API Gateway',
                version: '1.0.0',
                services: this.getServiceRoutes(),
            });
        });

        // 사용자 서비스 라우트
        this.app.use('/api/users', this.createServiceProxy('user-service', '/api/users'));
        this.app.use('/api/auth', this.createServiceProxy('user-service', '/api/auth'));

        // 게시글 서비스 라우트
        this.app.use('/api/posts', this.createServiceProxy('post-service', '/api/posts'));
        this.app.use('/api/boards', this.createServiceProxy('post-service', '/api/boards'));
        this.app.use('/api/comments', this.createServiceProxy('post-service', '/api/comments'));

        // 채팅 서비스 라우트
        this.app.use('/api/chat', this.createServiceProxy('chat-service', '/api/chat'));

        // 검색 서비스 라우트
        this.app.use('/api/search', this.createServiceProxy('search-service', '/api/search'));

        // 알림 서비스 라우트
        this.app.use('/api/notifications', this.createServiceProxy('notification-service', '/api/notifications'));

        // 관리자 라우트
        this.app.use('/api/admin', this.createAdminProxy());

        // 404 처리
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'API 엔드포인트를 찾을 수 없습니다.',
                path: req.originalUrl,
                method: req.method,
            });
        });
    }

    // 서비스 프록시 생성
    createServiceProxy(serviceName, path) {
        return createProxyMiddleware({
            target: `http://localhost:3000`, // 기본값, 실제로는 서비스 디스커버리에서 가져옴
            changeOrigin: true,
            pathRewrite: {
                [`^${path}`]: '',
            },
            onError: (err, req, res) => {
                console.error(`프록시 오류 (${serviceName}):`, err.message);
                res.status(503).json({
                    error: '서비스를 사용할 수 없습니다.',
                    service: serviceName,
                });
            },
            onProxyReq: (proxyReq, req, res) => {
                // 요청 헤더 추가
                proxyReq.setHeader('X-Forwarded-For', req.ip);
                proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
                proxyReq.setHeader('X-Forwarded-Host', req.get('host'));
            },
            onProxyRes: (proxyRes, req, res) => {
                // 응답 헤더 추가
                proxyRes.headers['X-Response-Time'] = Date.now() - req.startTime;
            },
            router: (req) => {
                // 동적 라우팅을 위한 서비스 선택
                const service = this.serviceDiscovery.selectService(serviceName);
                if (service) {
                    return `${service.protocol}://${service.host}:${service.port}`;
                }
                throw new Error(`서비스를 찾을 수 없습니다: ${serviceName}`);
            },
        });
    }

    // 관리자 프록시 생성
    createAdminProxy() {
        return createProxyMiddleware({
            target: `http://localhost:3000`,
            changeOrigin: true,
            pathRewrite: {
                '^/api/admin': '',
            },
            onError: (err, req, res) => {
                console.error('관리자 프록시 오류:', err.message);
                res.status(503).json({
                    error: '관리자 서비스를 사용할 수 없습니다.',
                });
            },
            router: (req) => {
                // 관리자 권한 확인
                const token = req.headers.authorization?.replace('Bearer ', '');
                if (!token) {
                    throw new Error('인증 토큰이 필요합니다.');
                }

                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
                        throw new Error('관리자 권한이 필요합니다.');
                    }
                } catch (error) {
                    throw new Error('유효하지 않은 토큰입니다.');
                }

                // 관리자 서비스 선택
                const service = this.serviceDiscovery.selectService('admin-service');
                if (service) {
                    return `${service.protocol}://${service.host}:${service.port}`;
                }
                throw new Error('관리자 서비스를 찾을 수 없습니다.');
            },
        });
    }

    // 서비스 라우트 정보 조회
    getServiceRoutes() {
        return {
            'user-service': {
                routes: ['/api/users', '/api/auth'],
                description: '사용자 관리 및 인증 서비스',
            },
            'post-service': {
                routes: ['/api/posts', '/api/boards', '/api/comments'],
                description: '게시글 및 댓글 관리 서비스',
            },
            'chat-service': {
                routes: ['/api/chat'],
                description: '실시간 채팅 서비스',
            },
            'search-service': {
                routes: ['/api/search'],
                description: '검색 서비스',
            },
            'notification-service': {
                routes: ['/api/notifications'],
                description: '알림 서비스',
            },
        };
    }

    // 에러 핸들링 설정
    setupErrorHandling() {
        this.app.use((err, req, res, next) => {
            console.error('API 게이트웨이 오류:', err);

            // 서비스 디스커버리 오류
            if (err.message.includes('서비스를 찾을 수 없습니다')) {
                return res.status(503).json({
                    error: '서비스를 사용할 수 없습니다.',
                    message: err.message,
                });
            }

            // 인증 오류
            if (err.message.includes('인증') || err.message.includes('토큰')) {
                return res.status(401).json({
                    error: '인증이 필요합니다.',
                    message: err.message,
                });
            }

            // 권한 오류
            if (err.message.includes('권한')) {
                return res.status(403).json({
                    error: '접근 권한이 없습니다.',
                    message: err.message,
                });
            }

            // 기본 오류
            res.status(500).json({
                error: '내부 서버 오류가 발생했습니다.',
                message: process.env.NODE_ENV === 'development' ? err.message : '서버 오류',
            });
        });
    }

    // 서비스 상태 조회
    getServiceStatus() {
        const services = this.serviceDiscovery.getAllServices();
        return services.map(service => ({
            name: service.name,
            status: service.status,
            host: service.host,
            port: service.port,
            lastHealthCheck: service.lastHealthCheck,
        }));
    }

    // 서비스 통계
    getServiceStats() {
        const services = this.serviceDiscovery.getAllServices();
        const statusCounts = services.reduce((acc, service) => {
            acc[service.status] = (acc[service.status] || 0) + 1;
            return acc;
        }, {});

        return {
            total: services.length,
            healthy: statusCounts.healthy || 0,
            unhealthy: statusCounts.unhealthy || 0,
            unknown: statusCounts.unknown || 0,
            services: this.getServiceStatus(),
        };
    }

    // 서버 시작
    start(port = process.env.PORT || 3000) {
        this.app.listen(port, () => {
            console.log(`API 게이트웨이가 포트 ${port}에서 실행 중입니다.`);
        });
    }

    // 서버 중지
    stop() {
        this.serviceDiscovery.cleanup();
        console.log('API 게이트웨이가 중지되었습니다.');
    }
}

module.exports = APIGateway;
