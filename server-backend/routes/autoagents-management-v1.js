/**
 * AutoAgents Management API v1
 * 오토에이전트 관리 API v1 릴리즈
 * 
 * 기능:
 * - 워커 플로우 자동화
 * - 액션플랜 자동화
 * - 자동 복구 시스템
 * - 통합 관리 API
 */

const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const WorkerWorkflowAutomation = require('../services/worker-workflow-automation');
const ActionPlanAutomation = require('../services/action-plan-automation');
const AutoRecoverySystem = require('../services/auto-recovery-system');

// 서비스 인스턴스 생성
const workerAutomation = new WorkerWorkflowAutomation();
const actionPlanAutomation = new ActionPlanAutomation();
const autoRecoverySystem = new AutoRecoverySystem();

// 기본 헬스 체크 등록
autoRecoverySystem.registerHealthCheck({
    id: 'server_health',
    name: '서버 상태 확인',
    type: 'server',
    interval: 30000,
    timeout: 10000,
    threshold: 3,
    checkFunction: async () => {
        // 실제 구현에서는 서버 상태 확인
        return { status: 'healthy', timestamp: new Date().toISOString() };
    }
});

autoRecoverySystem.registerHealthCheck({
    id: 'database_health',
    name: '데이터베이스 상태 확인',
    type: 'database',
    interval: 60000,
    timeout: 15000,
    threshold: 2,
    checkFunction: async () => {
        // 실제 구현에서는 데이터베이스 연결 확인
        return { status: 'connected', timestamp: new Date().toISOString() };
    }
});

// ==================== 워커 관리 API ====================

/**
 * 워커 등록
 * POST /api/autoagents-management/v1/workers
 */
router.post('/workers', (req, res) => {
    try {
        const { id, name, type, capabilities } = req.body;

        if (!id || !name || !type) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다: id, name, type'
            });
        }

        const worker = workerAutomation.registerWorker({
            id,
            name,
            type,
            capabilities: capabilities || []
        });

        logger.info(`워커 등록됨: ${worker.id} - ${worker.name}`);

        res.json({
            success: true,
            data: worker,
            message: '워커가 성공적으로 등록되었습니다.'
        });
    } catch (error) {
        logger.error(`워커 등록 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '워커 등록 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 워커 목록 조회
 * GET /api/autoagents-management/v1/workers
 */
router.get('/workers', (req, res) => {
    try {
        const systemStatus = workerAutomation.getSystemStatus();

        res.json({
            success: true,
            data: {
                workers: systemStatus.workers,
                performanceMetrics: systemStatus.performanceMetrics
            }
        });
    } catch (error) {
        logger.error(`워커 목록 조회 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '워커 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 작업 할당
 * POST /api/autoagents-management/v1/tasks
 */
router.post('/tasks', async (req, res) => {
    try {
        const { type, priority, data, workflow } = req.body;

        if (!type) {
            return res.status(400).json({
                success: false,
                message: '작업 타입이 필요합니다.'
            });
        }

        const result = await workerAutomation.assignTask({
            type,
            priority: priority || 'medium',
            data: data || {},
            workflow: workflow || null
        });

        if (result.success) {
            logger.info(`작업 할당됨: ${result.task.id} -> ${result.worker.id}`);
        }

        res.json(result);
    } catch (error) {
        logger.error(`작업 할당 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '작업 할당 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// ==================== 액션플랜 관리 API ====================

/**
 * 액션플랜 생성
 * POST /api/autoagents-management/v1/action-plans
 */
router.post('/action-plans', (req, res) => {
    try {
        const { templateId, data } = req.body;

        if (!templateId) {
            return res.status(400).json({
                success: false,
                message: '템플릿 ID가 필요합니다.'
            });
        }

        const plan = actionPlanAutomation.createActionPlan(templateId, data || {});

        logger.info(`액션플랜 생성됨: ${plan.id} - ${plan.name}`);

        res.json({
            success: true,
            data: plan,
            message: '액션플랜이 성공적으로 생성되었습니다.'
        });
    } catch (error) {
        logger.error(`액션플랜 생성 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '액션플랜 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 액션플랜 실행
 * POST /api/autoagents-management/v1/action-plans/:planId/execute
 */
router.post('/action-plans/:planId/execute', async (req, res) => {
    try {
        const { planId } = req.params;

        const result = await actionPlanAutomation.executeActionPlan(planId);

        if (result.success) {
            logger.info(`액션플랜 실행됨: ${planId}`);
        } else {
            logger.warn(`액션플랜 실행 실패: ${planId} - ${result.message || result.error}`);
        }

        res.json(result);
    } catch (error) {
        logger.error(`액션플랜 실행 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '액션플랜 실행 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 액션플랜 목록 조회
 * GET /api/autoagents-management/v1/action-plans
 */
router.get('/action-plans', (req, res) => {
    try {
        const { status, category, priority } = req.query;

        const plans = actionPlanAutomation.getActionPlans({
            status,
            category,
            priority
        });

        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        logger.error(`액션플랜 목록 조회 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '액션플랜 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 액션플랜 재시도
 * POST /api/autoagents-management/v1/action-plans/:planId/retry
 */
router.post('/action-plans/:planId/retry', async (req, res) => {
    try {
        const { planId } = req.params;

        const result = await actionPlanAutomation.retryActionPlan(planId);

        if (result.success) {
            logger.info(`액션플랜 재시도됨: ${planId}`);
        } else {
            logger.warn(`액션플랜 재시도 실패: ${planId} - ${result.message || result.error}`);
        }

        res.json(result);
    } catch (error) {
        logger.error(`액션플랜 재시도 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '액션플랜 재시도 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// ==================== 자동 복구 시스템 API ====================

/**
 * 헬스 체크 등록
 * POST /api/autoagents-management/v1/health-checks
 */
router.post('/health-checks', (req, res) => {
    try {
        const { id, name, type, interval, timeout, threshold, checkFunction } = req.body;

        if (!id || !name || !type) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다: id, name, type'
            });
        }

        const healthCheck = autoRecoverySystem.registerHealthCheck({
            id,
            name,
            type,
            interval: interval || 30000,
            timeout: timeout || 10000,
            threshold: threshold || 3,
            checkFunction: checkFunction || (async () => ({ status: 'healthy' }))
        });

        logger.info(`헬스 체크 등록됨: ${healthCheck.id} - ${healthCheck.name}`);

        res.json({
            success: true,
            data: healthCheck,
            message: '헬스 체크가 성공적으로 등록되었습니다.'
        });
    } catch (error) {
        logger.error(`헬스 체크 등록 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '헬스 체크 등록 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 인시던트 목록 조회
 * GET /api/autoagents-management/v1/incidents
 */
router.get('/incidents', (req, res) => {
    try {
        const { status } = req.query;

        let incidents;
        if (status === 'active') {
            incidents = autoRecoverySystem.getActiveIncidents();
        } else {
            const systemStatus = autoRecoverySystem.getSystemStatus();
            incidents = systemStatus.incidents;
        }

        res.json({
            success: true,
            data: incidents
        });
    } catch (error) {
        logger.error(`인시던트 목록 조회 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '인시던트 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 인시던트 수동 해결
 * POST /api/autoagents-management/v1/incidents/:incidentId/resolve
 */
router.post('/incidents/:incidentId/resolve', async (req, res) => {
    try {
        const { incidentId } = req.params;
        const { resolution } = req.body;

        if (!resolution) {
            return res.status(400).json({
                success: false,
                message: '해결 방법이 필요합니다.'
            });
        }

        const incident = await autoRecoverySystem.resolveIncident(incidentId, resolution);

        logger.info(`인시던트 수동 해결됨: ${incidentId} - ${resolution}`);

        res.json({
            success: true,
            data: incident,
            message: '인시던트가 성공적으로 해결되었습니다.'
        });
    } catch (error) {
        logger.error(`인시던트 해결 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '인시던트 해결 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// ==================== 통합 관리 API ====================

/**
 * 시스템 상태 조회
 * GET /api/autoagents-management/v1/status
 */
router.get('/status', (req, res) => {
    try {
        const workerStatus = workerAutomation.getSystemStatus();
        const actionPlanStatus = actionPlanAutomation.getSystemStatus();
        const recoveryStatus = autoRecoverySystem.getSystemStatus();

        const systemStatus = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            components: {
                workerAutomation: {
                    status: 'running',
                    workers: workerStatus.workers.length,
                    activeTasks: workerStatus.performanceMetrics.activeWorkers,
                    performance: workerStatus.performanceMetrics
                },
                actionPlanAutomation: {
                    status: 'running',
                    totalPlans: actionPlanStatus.performanceMetrics.totalPlans,
                    activePlans: actionPlanStatus.performanceMetrics.activePlans,
                    performance: actionPlanStatus.performanceMetrics
                },
                autoRecoverySystem: {
                    status: 'running',
                    totalIncidents: recoveryStatus.performanceMetrics.totalIncidents,
                    activeIncidents: recoveryStatus.performanceMetrics.activeIncidents,
                    performance: recoveryStatus.performanceMetrics
                }
            },
            overall: {
                status: 'healthy',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            }
        };

        res.json({
            success: true,
            data: systemStatus
        });
    } catch (error) {
        logger.error(`시스템 상태 조회 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '시스템 상태 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 워크플로우 실행
 * POST /api/autoagents-management/v1/workflows/:workflowId/execute
 */
router.post('/workflows/:workflowId/execute', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { data } = req.body;

        const execution = await workerAutomation.executeWorkflow(workflowId, data || {});

        logger.info(`워크플로우 실행됨: ${execution.id} - ${workflowId}`);

        res.json({
            success: true,
            data: execution,
            message: '워크플로우가 성공적으로 실행되었습니다.'
        });
    } catch (error) {
        logger.error(`워크플로우 실행 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '워크플로우 실행 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 성능 메트릭 조회
 * GET /api/autoagents-management/v1/metrics
 */
router.get('/metrics', (req, res) => {
    try {
        const workerMetrics = workerAutomation.getSystemStatus().performanceMetrics;
        const actionPlanMetrics = actionPlanAutomation.getSystemStatus().performanceMetrics;
        const recoveryMetrics = autoRecoverySystem.getSystemStatus().performanceMetrics;

        const metrics = {
            timestamp: new Date().toISOString(),
            workerAutomation: workerMetrics,
            actionPlanAutomation: actionPlanMetrics,
            autoRecoverySystem: recoveryMetrics,
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                platform: process.platform,
                nodeVersion: process.version
            }
        };

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        logger.error(`성능 메트릭 조회 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '성능 메트릭 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// ==================== 에러 핸들링 ====================

// 404 핸들러
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '요청한 API 엔드포인트를 찾을 수 없습니다.',
        path: req.originalUrl,
        method: req.method
    });
});

// 에러 핸들러
router.use((error, req, res, next) => {
    logger.error(`API 오류: ${error.message}`, {
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params,
        stack: error.stack
    });

    res.status(500).json({
        success: false,
        message: '서버 내부 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
    });
});

module.exports = router;
