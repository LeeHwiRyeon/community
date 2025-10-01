import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { AutoDevOrchestrator } from '@/core/orchestrator';
import { Goal } from '@/types';

// 환경 변수 로드
dotenv.config();

class AutoDevSystem {
    private app: express.Application;
    private orchestrator: AutoDevOrchestrator;
    private port: number;

    constructor() {
        this.app = express();
        this.port = parseInt(process.env.PORT || '3000');

        // OpenAI API 키 검증
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            throw new Error('OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
        }

        this.orchestrator = new AutoDevOrchestrator(openaiApiKey);
        this.setupMiddleware();
        this.setupRoutes();
    }

    /**
     * 미들웨어 설정
     */
    private setupMiddleware(): void {
        // 보안 미들웨어
        this.app.use(helmet());

        // CORS 설정
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true
        }));

        // 로깅 미들웨어
        this.app.use(morgan('combined'));

        // JSON 파싱
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
    }

    /**
     * 라우트 설정
     */
    private setupRoutes(): void {
        // 헬스 체크
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });

        // API 라우트
        this.app.use('/api', this.createAPIRoutes());

        // 정적 파일 서빙 (대시보드)
        this.app.use(express.static('public'));

        // 404 핸들러
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: '요청한 리소스를 찾을 수 없습니다.',
                path: req.originalUrl
            });
        });
    }

    /**
     * API 라우트 생성
     */
    private createAPIRoutes(): express.Router {
        const router = express.Router();

        // 목표 기반 자동 개발 시작
        router.post('/develop', async (req, res) => {
            try {
                const goal: Goal = req.body;

                // 목표 유효성 검사
                if (!goal.description || !goal.category) {
                    return res.status(400).json({
                        error: 'Bad Request',
                        message: '목표 설명과 카테고리는 필수입니다.'
                    });
                }

                // 목표 ID 생성
                goal.id = this.generateId();
                goal.createdAt = new Date();
                goal.updatedAt = new Date();

                console.log(`🎯 새로운 개발 목표: ${goal.description}`);

                // 자동 개발 시작
                const workflow = await this.orchestrator.startAutoDevelopment(goal);

                res.json({
                    success: true,
                    workflow,
                    message: '자동 개발이 시작되었습니다.'
                });

            } catch (error) {
                console.error('자동 개발 시작 실패:', error);
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
                });
            }
        });

        // 워크플로우 상태 조회
        router.get('/workflows', (req, res) => {
            try {
                const workflows = this.orchestrator.getActiveWorkflows();
                res.json({
                    success: true,
                    workflows,
                    count: workflows.length
                });
            } catch (error) {
                console.error('워크플로우 조회 실패:', error);
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: '워크플로우 조회 중 오류가 발생했습니다.'
                });
            }
        });

        // 특정 워크플로우 상태 조회
        router.get('/workflows/:id', (req, res) => {
            try {
                const { id } = req.params;
                const workflow = this.orchestrator.getWorkflowStatus(id);

                if (!workflow) {
                    return res.status(404).json({
                        error: 'Not Found',
                        message: '워크플로우를 찾을 수 없습니다.'
                    });
                }

                res.json({
                    success: true,
                    workflow
                });
            } catch (error) {
                console.error('워크플로우 조회 실패:', error);
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: '워크플로우 조회 중 오류가 발생했습니다.'
                });
            }
        });

        // 워크플로우 중지
        router.post('/workflows/:id/stop', (req, res) => {
            try {
                const { id } = req.params;
                const success = this.orchestrator.stopWorkflow(id);

                if (!success) {
                    return res.status(400).json({
                        error: 'Bad Request',
                        message: '워크플로우를 중지할 수 없습니다.'
                    });
                }

                res.json({
                    success: true,
                    message: '워크플로우가 중지되었습니다.'
                });
            } catch (error) {
                console.error('워크플로우 중지 실패:', error);
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: '워크플로우 중지 중 오류가 발생했습니다.'
                });
            }
        });

        // 워크플로우 재시작
        router.post('/workflows/:id/resume', async (req, res) => {
            try {
                const { id } = req.params;
                const success = await this.orchestrator.resumeWorkflow(id);

                if (!success) {
                    return res.status(400).json({
                        error: 'Bad Request',
                        message: '워크플로우를 재시작할 수 없습니다.'
                    });
                }

                res.json({
                    success: true,
                    message: '워크플로우가 재시작되었습니다.'
                });
            } catch (error) {
                console.error('워크플로우 재시작 실패:', error);
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: '워크플로우 재시작 중 오류가 발생했습니다.'
                });
            }
        });

        // 시스템 상태 조회
        router.get('/status', (req, res) => {
            try {
                const workflows = this.orchestrator.getActiveWorkflows();
                const runningWorkflows = workflows.filter(w => w.status === 'running');
                const completedWorkflows = workflows.filter(w => w.status === 'completed');
                const failedWorkflows = workflows.filter(w => w.status === 'failed');

                res.json({
                    success: true,
                    status: {
                        total: workflows.length,
                        running: runningWorkflows.length,
                        completed: completedWorkflows.length,
                        failed: failedWorkflows.length,
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (error) {
                console.error('시스템 상태 조회 실패:', error);
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: '시스템 상태 조회 중 오류가 발생했습니다.'
                });
            }
        });

        // 목표 템플릿 조회
        router.get('/templates', (req, res) => {
            try {
                const templates = this.getGoalTemplates();
                res.json({
                    success: true,
                    templates
                });
            } catch (error) {
                console.error('템플릿 조회 실패:', error);
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: '템플릿 조회 중 오류가 발생했습니다.'
                });
            }
        });

        return router;
    }

    /**
     * 목표 템플릿 조회
     */
    private getGoalTemplates(): any[] {
        return [
            {
                id: 'web-app-basic',
                name: '기본 웹 애플리케이션',
                description: 'React + Node.js 기반의 기본적인 웹 애플리케이션',
                category: 'web-app',
                complexity: 'simple',
                estimatedDuration: 7,
                features: ['사용자 인증', 'CRUD 기능', '반응형 디자인']
            },
            {
                id: 'ecommerce-platform',
                name: '전자상거래 플랫폼',
                description: '상품 관리, 주문 처리, 결제 시스템을 포함한 전자상거래 플랫폼',
                category: 'web-app',
                complexity: 'complex',
                estimatedDuration: 30,
                features: ['상품 관리', '장바구니', '결제 시스템', '주문 관리', '관리자 대시보드']
            },
            {
                id: 'mobile-app',
                name: '모바일 애플리케이션',
                description: 'React Native 기반의 크로스 플랫폼 모바일 애플리케이션',
                category: 'mobile-app',
                complexity: 'medium',
                estimatedDuration: 14,
                features: ['네이티브 성능', '푸시 알림', '오프라인 지원']
            },
            {
                id: 'api-service',
                name: 'REST API 서비스',
                description: '마이크로서비스 아키텍처 기반의 REST API 서비스',
                category: 'api',
                complexity: 'medium',
                estimatedDuration: 10,
                features: ['RESTful API', '인증/인가', '데이터베이스 연동', 'API 문서화']
            },
            {
                id: 'enterprise-system',
                name: '엔터프라이즈 시스템',
                description: '대규모 엔터프라이즈를 위한 마이크로서비스 기반 시스템',
                category: 'web-app',
                complexity: 'enterprise',
                estimatedDuration: 60,
                features: ['마이크로서비스', '로드밸런싱', '모니터링', '보안', '확장성']
            }
        ];
    }

    /**
     * 서버 시작
     */
    public async start(): Promise<void> {
        try {
            this.app.listen(this.port, () => {
                console.log(`🚀 자동 개발 시스템이 포트 ${this.port}에서 실행 중입니다.`);
                console.log(`📊 대시보드: http://localhost:${this.port}`);
                console.log(`🔗 API 문서: http://localhost:${this.port}/api`);
                console.log(`❤️  헬스 체크: http://localhost:${this.port}/health`);
            });
        } catch (error) {
            console.error('서버 시작 실패:', error);
            process.exit(1);
        }
    }

    /**
     * 서버 중지
     */
    public async stop(): Promise<void> {
        console.log('🛑 자동 개발 시스템을 중지합니다...');
        process.exit(0);
    }

    /**
     * 고유 ID 생성
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 애플리케이션 시작
const autoDevSystem = new AutoDevSystem();

// Graceful shutdown 처리
process.on('SIGINT', async () => {
    console.log('\n🛑 SIGINT 신호를 받았습니다. 서버를 중지합니다...');
    await autoDevSystem.stop();
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM 신호를 받았습니다. 서버를 중지합니다...');
    await autoDevSystem.stop();
});

// 예외 처리
process.on('uncaughtException', (error) => {
    console.error('❌ 처리되지 않은 예외:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 처리되지 않은 Promise 거부:', reason);
    process.exit(1);
});

// 서버 시작
autoDevSystem.start().catch((error) => {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
});

export default AutoDevSystem;
