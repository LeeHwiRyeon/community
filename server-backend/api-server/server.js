const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { performanceMonitor } = require('../../utils/performance-monitor');
const { cacheService } = require('../../utils/cache-service');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const performanceRoutes = require('../../routes/performance');
const monitoringRoutes = require('./routes/monitoring');
const backupRoutes = require('./routes/backup');
const boardRoutes = require('./routes/boards');
const communityRoutes = require('./routes/communities');
const votingRoutes = require('./routes/voting');
const commentRoutes = require('./routes/comments');
const commentReactionRoutes = require('./routes/comment-reactions');
const readStatusRoutes = require('./routes/read-status');
const commentHistoryRoutes = require('./routes/comment-history');
const commentReportRoutes = require('./routes/comment-reports');
const todoRoutes = require('./routes/todos');
const chatRoutes = require('./routes/chat');
const onlineStatusRoutes = require('./routes/online-status');
const chatHistoryRoutes = require('./routes/chat-history');
const contentManagementRoutes = require('./routes/content-management');
const analyticsRoutes = require('./routes/analytics');
const systemMonitoringRoutes = require('./routes/system-monitoring');
const metricsRoutes = require('./routes/metrics');
const agentRoutes = require('./routes/agent');
const accessibilityRoutes = require('./routes/accessibility');
const i18nRoutes = require('./routes/i18n');
const recommendationRoutes = require('./routes/recommendations');
const collaborationRoutes = require('./routes/collaboration');
const cosplayStoreRoutes = require('./routes/cosplay-store');
const streamingPlatformRoutes = require('./routes/streaming-platform');
const advancedSearchRoutes = require('./routes/advanced-search');
const gamificationRoutes = require('./routes/gamification');
const securityAuditRoutes = require('./routes/security-audit');
const businessIntelligenceRoutes = require('./routes/business-intelligence');
const integrationRoutes = require('./routes/integration');
const machineLearningRoutes = require('./routes/machine-learning');
const advancedAuthRoutes = require('./routes/advanced-auth');
const abTestingRoutes = require('./routes/ab-testing');
const encryptionRoutes = require('./routes/encryption'); // Added for SECURITY_002
const advancedAgentRoutes = require('./routes/advanced-agent'); // Added for AUTOAGENT_001
const aiPriorityRoutes = require('./routes/ai-priority'); // Added for AUTOAGENT_004
const contentManagementRoutes = require('./routes/content-management'); // Added for CONTENT_ENHANCEMENT_001
const aiContentRoutes = require('./routes/ai-content'); // Added for CONTENT_ENHANCEMENT_002
const communityManagementRoutes = require('./routes/community-management'); // Added for COMMUNITY_ENHANCEMENT_001
const { router: realtimeChatRoutes, initializeSocketIO } = require('./routes/realtime-chat'); // Added for COMMUNITY_ENHANCEMENT_002
const { router: realtimeNotificationRoutes, createNotification } = require('./routes/realtime-notifications'); // Added for COMMUNITY_ENHANCEMENT_002
const communityContentRoutes = require('./routes/community-content'); // Added for COMMUNITY_CONTENT_001
const releaseSiteRoutes = require('./routes/release-site'); // Added for RELEASE_SITE_001
const contentCurationRoutes = require('./routes/content-curation'); // Added for COMMUNITY_CONTENT_003
const advancedAgentManagementRoutes = require('./routes/advanced-agent-management'); // Added for AGENT_SYSTEM_UPGRADE
const intelligentTaskSchedulerRoutes = require('./routes/intelligent-task-scheduler'); // Added for AGENT_SYSTEM_UPGRADE
const unifiedTodoManagerRoutes = require('./routes/unified-todo-manager'); // Added for SIMPLIFIED_TODO_SYSTEM
const autoRecoverySystemRoutes = require('./routes/auto-recovery-system'); // Added for AGENT_SYSTEM_UPGRADE_005
const realtimeStreamingRoutes = require('./routes/realtime-streaming'); // Added for COMMUNITY_CONTENT_004
const contentMonitoringRoutes = require('./routes/content-monitoring'); // Added for COMMUNITY_CONTENT_005
const downloadManagementRoutes = require('./routes/download-management'); // Added for RELEASE_SITE_003
const releaseNotesManagementRoutes = require('./routes/release-notes-management'); // Added for RELEASE_SITE_004
const userFeedbackRoutes = require('./routes/user-feedback'); // Added for RELEASE_SITE_005
const aiOptimizationRoutes = require('./routes/ai-optimization'); // Added for ADVANCED_OPTIMIZATION_001
const advancedMonitoringRoutes = require('./routes/advanced-monitoring'); // Added for ADVANCED_OPTIMIZATION_002
const communityGamesRoutes = require('./routes/community-games'); // Added for COMMUNITY_GAMES_001
const vipSystemRoutes = require('./routes/vip-system'); // Added for VIP_SYSTEM_001
const vipRequirementsRoutes = require('./routes/vip-requirements'); // Added for VIP_ENHANCEMENT_001
const vipPersonalizedServiceRoutes = require('./routes/vip-personalized-service'); // Added for VIP_ENHANCEMENT_002
const communityHubRoutes = require('./routes/community-hub'); // Added for COMMUNITY_RELEASE_001
const autoAgentsManagementRoutes = require('./routes/autoagents-management'); // Added for RELEASE_PREP_004
const autoAgentsManagementV1Routes = require('./routes/autoagents-management-v1'); // Added for AUTOAGENT_V1_RELEASE
const bugManagementEnhancedRoutes = require('./routes/bug-management-enhanced'); // Added for BUG_LOOP_PREVENTION
const cosplayerStreamerIntegrationRoutes = require('./routes/cosplayer-streamer-integration'); // Added for COMMUNITY_INTEGRATION
const userFeedbackRoutes = require('../../routes/user-feedback'); // Added for RELEASE_PREP_008
const monitoringDashboardRoutes = require('../../routes/monitoring-dashboard'); // Added for RELEASE_PREP_009
const { metricsMiddleware } = require('./middleware/metricsMiddleware');
const performanceMonitoringService = require('./services/performanceMonitoringService');
const BackupScheduler = require('./scripts/backup-scheduler');
const VotingScheduler = require('./services/voting-scheduler');
const { connectDatabase } = require('./config/database');
const { initializeRedis } = require('./config/redis');
const { initializeWebSocket } = require('./config/websocket');
const { optimizeDatabase, optimizeQueries, optimizeIndexes } = require('./config/database-optimization');
const { optimizeMemory } = require('./config/memory-optimization');
const {
    optimizedCompression,
    optimizeResponse,
    optimizePagination,
    setCacheHeaders
} = require('./middleware/response-optimization');

const app = express();
const PORT = process.env.PORT || 50000;

// 보안 미들웨어
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS 설정
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 최적화된 압축 미들웨어
app.use(optimizedCompression);

// 요청 로깅
app.use(morgan('combined', {
    stream: { write: message => console.log(message.trim()) }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 최대 100 요청
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// 성능 모니터링 미들웨어
app.use(metricsMiddleware);
app.use(performanceMonitor.startRequest.bind(performanceMonitor));

// 캐시 미들웨어 (GET 요청만)
app.use('/api', cacheService.cacheMiddleware(600));

// Body parsing 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 서빙
app.use('/uploads', express.static('uploads'));

// 최적화 미들웨어 적용
app.use(optimizeResponse);
app.use(optimizePagination);
app.use(setCacheHeaders);

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/comment-reactions', commentReactionRoutes);
app.use('/api/read-status', readStatusRoutes);
app.use('/api/comment-history', commentHistoryRoutes);
app.use('/api/comment-reports', commentReportRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/online-status', onlineStatusRoutes);
app.use('/api/chat-history', chatHistoryRoutes);
app.use('/api/content-management', contentManagementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/system-monitoring', systemMonitoringRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/accessibility', accessibilityRoutes);
app.use('/api/i18n', i18nRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/cosplay-store', cosplayStoreRoutes);
app.use('/api/streaming-platform', streamingPlatformRoutes);
app.use('/api/advanced-search', advancedSearchRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/security-audit', securityAuditRoutes);
app.use('/api/business-intelligence', businessIntelligenceRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/machine-learning', machineLearningRoutes);
app.use('/api/advanced-auth', advancedAuthRoutes);
app.use('/api/ab-testing', abTestingRoutes);
app.use('/api/encryption', encryptionRoutes); // Added for SECURITY_002
app.use('/api/advanced-agent', advancedAgentRoutes); // Added for AUTOAGENT_001
app.use('/api/ai-priority', aiPriorityRoutes); // Added for AUTOAGENT_004
app.use('/api/content-management', contentManagementRoutes); // Added for CONTENT_ENHANCEMENT_001
app.use('/api/ai-content', aiContentRoutes); // Added for CONTENT_ENHANCEMENT_002
app.use('/api/community-management', communityManagementRoutes); // Added for COMMUNITY_ENHANCEMENT_001
app.use('/api/realtime-chat', realtimeChatRoutes); // Added for COMMUNITY_ENHANCEMENT_002
app.use('/api/realtime-notifications', realtimeNotificationRoutes); // Added for COMMUNITY_ENHANCEMENT_002
app.use('/api/community-content', communityContentRoutes); // Added for COMMUNITY_CONTENT_001
app.use('/api/release-site', releaseSiteRoutes); // Added for RELEASE_SITE_001
app.use('/api/content-curation', contentCurationRoutes); // Added for COMMUNITY_CONTENT_003
app.use('/api/advanced-agent-management', advancedAgentManagementRoutes); // Added for AGENT_SYSTEM_UPGRADE
app.use('/api/intelligent-task-scheduler', intelligentTaskSchedulerRoutes); // Added for AGENT_SYSTEM_UPGRADE
app.use('/api/unified-todo', unifiedTodoManagerRoutes); // Added for SIMPLIFIED_TODO_SYSTEM
app.use('/api/auto-recovery', autoRecoverySystemRoutes); // Added for AGENT_SYSTEM_UPGRADE_005
app.use('/api/realtime-streaming', realtimeStreamingRoutes); // Added for COMMUNITY_CONTENT_004
app.use('/api/content-monitoring', contentMonitoringRoutes); // Added for COMMUNITY_CONTENT_005
app.use('/api/download-management', downloadManagementRoutes); // Added for RELEASE_SITE_003
app.use('/api/release-notes', releaseNotesManagementRoutes); // Added for RELEASE_SITE_004
app.use('/api/user-feedback', userFeedbackRoutes); // Added for RELEASE_SITE_005
app.use('/api/ai-optimization', aiOptimizationRoutes); // Added for ADVANCED_OPTIMIZATION_001
app.use('/api/advanced-monitoring', advancedMonitoringRoutes); // Added for ADVANCED_OPTIMIZATION_002
app.use('/api/community-games', communityGamesRoutes); // Added for COMMUNITY_GAMES_001
app.use('/api/vip-system', vipSystemRoutes); // Added for VIP_SYSTEM_001
app.use('/api/vip-requirements', vipRequirementsRoutes); // Added for VIP_ENHANCEMENT_001
app.use('/api/vip-personalized-service', vipPersonalizedServiceRoutes); // Added for VIP_ENHANCEMENT_002
app.use('/api/community-hub', communityHubRoutes); // Added for COMMUNITY_RELEASE_001
app.use('/api/autoagents-management', autoAgentsManagementRoutes); // Added for RELEASE_PREP_004
app.use('/api/autoagents-management/v1', autoAgentsManagementV1Routes); // Added for AUTOAGENT_V1_RELEASE
app.use('/api/bug-management', bugManagementEnhancedRoutes); // Added for BUG_LOOP_PREVENTION
app.use('/api/community-integration', cosplayerStreamerIntegrationRoutes); // Added for COMMUNITY_INTEGRATION
app.use('/api/user-feedback', userFeedbackRoutes); // Added for RELEASE_PREP_008
app.use('/api/monitoring', monitoringDashboardRoutes); // Added for RELEASE_PREP_009

// Health check 엔드포인트 (간단한 버전)
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Health check 엔드포인트 (동일한 경로, 빠른 응답)
app.get('/api/health-check', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API 문서 엔드포인트
app.get('/api/docs', (req, res) => {
    res.json({
        title: '뉴스 페이퍼 VIP 관리 시스템 API',
        version: '1.0.0',
        description: '커뮤니티 관리 및 VIP 시스템을 위한 REST API',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            roles: '/api/roles',
            dashboard: '/api/dashboard',
            notifications: '/api/notifications',
            health: '/api/health'
        },
        documentation: 'https://github.com/news-paper-vip/api-docs'
    });
});

// 404 핸들러
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
    });
});

// 에러 핸들러
app.use(errorHandler);

// 서버 시작
async function startServer() {
    try {
        // 데이터베이스 연결
        await connectDatabase();
        console.log('Database connected successfully');

        // 데이터베이스 최적화
        optimizeQueries();
        await optimizeDatabase();
        await optimizeIndexes();
        console.log('Database optimization completed');

        // 메모리 최적화
        optimizeMemory();
        console.log('Memory optimization completed');

        // Redis 연결
        await initializeRedis();
        console.log('Redis connected successfully');

        // 서버 시작
        const server = app.listen(PORT, () => {
            console.log(`🚀 News Paper VIP API Server running on port ${PORT}`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        // WebSocket 초기화
        initializeWebSocket(server);

        // 실시간 채팅 Socket.IO 초기화
        initializeSocketIO(server);

        // 협업 서비스 초기화
        const collaborationService = require('./services/collaborationService');
        collaborationService.initialize(server);
        collaborationService.startHeartbeat();
        console.log('🤝 Collaboration service initialized');

        // 백업 스케줄러 시작
        const backupScheduler = new BackupScheduler();
        backupScheduler.startScheduler();
        console.log('🗄️ Database backup scheduler started');

        // 투표 스케줄러 시작
        VotingScheduler.start();
        console.log('🗳️ Voting scheduler started');
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Uncaught exception
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

startServer();

module.exports = app;
