/**
 * Action Plan Automation Service
 * 액션플랜 자동화 시스템
 * 
 * 기능:
 * - 액션플랜 자동 생성
 * - 우선순위 기반 실행
 * - 의존성 관리
 * - 진행률 추적
 * - 자동 알림
 */

const { logger } = require('../utils/logger');
const { performanceMonitor } = require('../utils/performance-monitor');

class ActionPlanAutomation {
    constructor() {
        this.actionPlans = new Map();
        this.actionTemplates = new Map();
        this.dependencies = new Map();
        this.executionQueue = [];
        this.notificationRules = new Map();
        this.performanceMetrics = {
            totalPlans: 0,
            completedPlans: 0,
            failedPlans: 0,
            averageExecutionTime: 0,
            successRate: 0,
            activePlans: 0
        };

        this.initializeActionTemplates();
        this.initializeNotificationRules();
        this.startExecutionEngine();
    }

    /**
     * 액션 템플릿 초기화
     */
    initializeActionTemplates() {
        // 시스템 점검 액션 템플릿
        this.actionTemplates.set('SYSTEM_CHECK', {
            id: 'SYSTEM_CHECK',
            name: '시스템 점검',
            category: 'maintenance',
            priority: 'high',
            estimatedDuration: 300, // 5분
            actions: [
                {
                    id: 'check_server_health',
                    name: '서버 상태 확인',
                    type: 'health_check',
                    timeout: 30,
                    retryAttempts: 2
                },
                {
                    id: 'check_database_connection',
                    name: '데이터베이스 연결 확인',
                    type: 'connection_check',
                    timeout: 15,
                    retryAttempts: 2
                },
                {
                    id: 'check_disk_space',
                    name: '디스크 공간 확인',
                    type: 'resource_check',
                    timeout: 10,
                    retryAttempts: 1
                },
                {
                    id: 'check_memory_usage',
                    name: '메모리 사용량 확인',
                    type: 'resource_check',
                    timeout: 10,
                    retryAttempts: 1
                }
            ],
            dependencies: [],
            successCriteria: {
                serverHealth: 'healthy',
                databaseConnection: 'connected',
                diskSpace: '>10%',
                memoryUsage: '<80%'
            }
        });

        // 보안 점검 액션 템플릿
        this.actionTemplates.set('SECURITY_AUDIT', {
            id: 'SECURITY_AUDIT',
            name: '보안 점검',
            category: 'security',
            priority: 'critical',
            estimatedDuration: 600, // 10분
            actions: [
                {
                    id: 'vulnerability_scan',
                    name: '취약점 스캔',
                    type: 'security_scan',
                    timeout: 300,
                    retryAttempts: 1
                },
                {
                    id: 'check_ssl_certificates',
                    name: 'SSL 인증서 확인',
                    type: 'certificate_check',
                    timeout: 60,
                    retryAttempts: 2
                },
                {
                    id: 'audit_user_permissions',
                    name: '사용자 권한 감사',
                    type: 'permission_audit',
                    timeout: 120,
                    retryAttempts: 2
                },
                {
                    id: 'check_firewall_rules',
                    name: '방화벽 규칙 확인',
                    type: 'firewall_check',
                    timeout: 60,
                    retryAttempts: 1
                }
            ],
            dependencies: ['SYSTEM_CHECK'],
            successCriteria: {
                vulnerabilities: 0,
                sslCertificates: 'valid',
                userPermissions: 'compliant',
                firewallRules: 'secure'
            }
        });

        // 성능 최적화 액션 템플릿
        this.actionTemplates.set('PERFORMANCE_OPTIMIZATION', {
            id: 'PERFORMANCE_OPTIMIZATION',
            name: '성능 최적화',
            category: 'optimization',
            priority: 'medium',
            estimatedDuration: 900, // 15분
            actions: [
                {
                    id: 'analyze_performance_metrics',
                    name: '성능 메트릭 분석',
                    type: 'analysis',
                    timeout: 180,
                    retryAttempts: 2
                },
                {
                    id: 'optimize_database_queries',
                    name: '데이터베이스 쿼리 최적화',
                    type: 'optimization',
                    timeout: 300,
                    retryAttempts: 2
                },
                {
                    id: 'clear_cache',
                    name: '캐시 정리',
                    type: 'maintenance',
                    timeout: 60,
                    retryAttempts: 1
                },
                {
                    id: 'optimize_memory_usage',
                    name: '메모리 사용량 최적화',
                    type: 'optimization',
                    timeout: 120,
                    retryAttempts: 2
                }
            ],
            dependencies: ['SYSTEM_CHECK'],
            successCriteria: {
                responseTime: '<200ms',
                memoryUsage: '<70%',
                cacheHitRate: '>80%',
                databaseQueryTime: '<100ms'
            }
        });

        // 배포 액션 템플릿
        this.actionTemplates.set('DEPLOYMENT', {
            id: 'DEPLOYMENT',
            name: '배포',
            category: 'deployment',
            priority: 'high',
            estimatedDuration: 1200, // 20분
            actions: [
                {
                    id: 'backup_current_version',
                    name: '현재 버전 백업',
                    type: 'backup',
                    timeout: 300,
                    retryAttempts: 2
                },
                {
                    id: 'deploy_new_version',
                    name: '새 버전 배포',
                    type: 'deployment',
                    timeout: 600,
                    retryAttempts: 3
                },
                {
                    id: 'run_tests',
                    name: '테스트 실행',
                    type: 'testing',
                    timeout: 180,
                    retryAttempts: 2
                },
                {
                    id: 'verify_deployment',
                    name: '배포 검증',
                    type: 'verification',
                    timeout: 120,
                    retryAttempts: 2
                }
            ],
            dependencies: ['SYSTEM_CHECK', 'SECURITY_AUDIT'],
            successCriteria: {
                backupCreated: true,
                deploymentSuccessful: true,
                testsPassed: true,
                verificationPassed: true
            }
        });
    }

    /**
     * 알림 규칙 초기화
     */
    initializeNotificationRules() {
        this.notificationRules.set('PLAN_STARTED', {
            id: 'PLAN_STARTED',
            name: '액션플랜 시작 알림',
            triggers: ['plan_started'],
            channels: ['email', 'slack'],
            template: 'action_plan_started',
            recipients: ['admin', 'manager']
        });

        this.notificationRules.set('PLAN_COMPLETED', {
            id: 'PLAN_COMPLETED',
            name: '액션플랜 완료 알림',
            triggers: ['plan_completed'],
            channels: ['email', 'slack'],
            template: 'action_plan_completed',
            recipients: ['admin', 'manager']
        });

        this.notificationRules.set('PLAN_FAILED', {
            id: 'PLAN_FAILED',
            name: '액션플랜 실패 알림',
            triggers: ['plan_failed'],
            channels: ['email', 'slack', 'sms'],
            template: 'action_plan_failed',
            recipients: ['admin', 'manager', 'oncall']
        });

        this.notificationRules.set('ACTION_FAILED', {
            id: 'ACTION_FAILED',
            name: '액션 실패 알림',
            triggers: ['action_failed'],
            channels: ['slack'],
            template: 'action_failed',
            recipients: ['admin']
        });
    }

    /**
     * 액션플랜 생성
     */
    createActionPlan(templateId, data = {}) {
        const template = this.actionTemplates.get(templateId);
        if (!template) {
            throw new Error(`액션 템플릿을 찾을 수 없습니다: ${templateId}`);
        }

        const plan = {
            id: `plan_${Date.now()}`,
            templateId,
            name: template.name,
            category: template.category,
            priority: template.priority,
            status: 'pending',
            createdAt: new Date().toISOString(),
            startedAt: null,
            completedAt: null,
            estimatedDuration: template.estimatedDuration,
            actualDuration: 0,
            actions: template.actions.map(action => ({
                ...action,
                status: 'pending',
                startedAt: null,
                completedAt: null,
                attempts: 0,
                error: null
            })),
            dependencies: template.dependencies || [],
            successCriteria: template.successCriteria,
            data,
            progress: 0,
            currentActionIndex: 0,
            retryAttempts: 0,
            maxRetryAttempts: 3
        };

        this.actionPlans.set(plan.id, plan);
        this.performanceMetrics.totalPlans++;
        this.performanceMetrics.activePlans++;

        logger.info(`액션플랜 생성됨: ${plan.id} - ${plan.name}`);
        return plan;
    }

    /**
     * 액션플랜 실행
     */
    async executeActionPlan(planId) {
        const plan = this.actionPlans.get(planId);
        if (!plan) {
            throw new Error(`액션플랜을 찾을 수 없습니다: ${planId}`);
        }

        if (plan.status !== 'pending') {
            throw new Error(`액션플랜이 이미 실행 중이거나 완료되었습니다: ${planId}`);
        }

        // 의존성 확인
        const dependenciesMet = await this.checkDependencies(plan);
        if (!dependenciesMet) {
            logger.warn(`의존성이 충족되지 않아 실행 지연: ${planId}`);
            return { success: false, message: '의존성이 충족되지 않았습니다.' };
        }

        plan.status = 'running';
        plan.startedAt = new Date().toISOString();
        this.performanceMetrics.activePlans++;

        // 알림 전송
        await this.sendNotification('PLAN_STARTED', plan);

        logger.info(`액션플랜 실행 시작: ${planId}`);

        try {
            await this.executePlanActions(plan);
            plan.status = 'completed';
            plan.completedAt = new Date().toISOString();
            plan.actualDuration = (new Date() - new Date(plan.startedAt)) / 1000;
            plan.progress = 100;

            this.performanceMetrics.completedPlans++;
            this.performanceMetrics.activePlans--;

            // 성공 기준 확인
            const successCriteriaMet = await this.checkSuccessCriteria(plan);
            if (!successCriteriaMet) {
                plan.status = 'partially_completed';
                logger.warn(`액션플랜 부분 완료: ${planId} - 성공 기준 미충족`);
            }

            // 알림 전송
            await this.sendNotification('PLAN_COMPLETED', plan);

            logger.info(`액션플랜 완료: ${planId}`);
            return { success: true, plan };

        } catch (error) {
            plan.status = 'failed';
            plan.completedAt = new Date().toISOString();
            plan.actualDuration = (new Date() - new Date(plan.startedAt)) / 1000;
            plan.error = error.message;

            this.performanceMetrics.failedPlans++;
            this.performanceMetrics.activePlans--;

            // 알림 전송
            await this.sendNotification('PLAN_FAILED', plan);

            logger.error(`액션플랜 실패: ${planId} - ${error.message}`);
            return { success: false, error: error.message, plan };
        }
    }

    /**
     * 의존성 확인
     */
    async checkDependencies(plan) {
        for (const dependencyId of plan.dependencies) {
            const dependencyPlan = Array.from(this.actionPlans.values())
                .find(p => p.templateId === dependencyId && p.status === 'completed');

            if (!dependencyPlan) {
                return false;
            }
        }
        return true;
    }

    /**
     * 액션플랜 액션 실행
     */
    async executePlanActions(plan) {
        for (let i = 0; i < plan.actions.length; i++) {
            const action = plan.actions[i];
            plan.currentActionIndex = i;

            action.status = 'running';
            action.startedAt = new Date().toISOString();
            action.attempts++;

            try {
                await this.executeAction(action, plan.data);
                action.status = 'completed';
                action.completedAt = new Date().toISOString();

                // 진행률 업데이트
                plan.progress = Math.round(((i + 1) / plan.actions.length) * 100);

                logger.info(`액션 완료: ${plan.id} - ${action.name}`);
            } catch (error) {
                action.status = 'failed';
                action.error = error.message;
                action.completedAt = new Date().toISOString();

                logger.error(`액션 실패: ${plan.id} - ${action.name} - ${error.message}`);

                // 재시도 로직
                if (action.attempts < action.retryAttempts) {
                    logger.info(`액션 재시도: ${plan.id} - ${action.name} (${action.attempts}/${action.retryAttempts})`);
                    i--; // 현재 액션을 다시 실행
                    continue;
                }

                // 액션 실패 알림
                await this.sendNotification('ACTION_FAILED', { plan, action, error });

                throw error;
            }
        }
    }

    /**
     * 액션 실행
     */
    async executeAction(action, data) {
        const startTime = Date.now();

        try {
            // 실제 액션 실행 로직 (여기서는 시뮬레이션)
            await this.simulateActionExecution(action, data);

            const executionTime = Date.now() - startTime;
            logger.info(`액션 실행 완료: ${action.name} - ${executionTime}ms`);

        } catch (error) {
            logger.error(`액션 실행 실패: ${action.name} - ${error.message}`);
            throw error;
        }
    }

    /**
     * 액션 실행 시뮬레이션
     */
    async simulateActionExecution(action, data) {
        // 실제 구현에서는 각 액션 타입별 로직을 실행
        const delay = Math.random() * 1000 + 500; // 500-1500ms
        await new Promise(resolve => setTimeout(resolve, delay));

        // 10% 확률로 실패 (테스트용)
        if (Math.random() < 0.1) {
            throw new Error(`액션 실행 실패: ${action.name}`);
        }
    }

    /**
     * 성공 기준 확인
     */
    async checkSuccessCriteria(plan) {
        // 실제 구현에서는 각 성공 기준을 확인
        // 여기서는 시뮬레이션
        return Math.random() > 0.2; // 80% 확률로 성공
    }

    /**
     * 알림 전송
     */
    async sendNotification(ruleId, data) {
        const rule = this.notificationRules.get(ruleId);
        if (!rule) {
            logger.warn(`알림 규칙을 찾을 수 없습니다: ${ruleId}`);
            return;
        }

        // 실제 구현에서는 알림 서비스를 통해 전송
        logger.info(`알림 전송: ${rule.name} - ${data.plan?.id || 'N/A'}`);
    }

    /**
     * 실행 엔진 시작
     */
    startExecutionEngine() {
        setInterval(() => {
            this.processExecutionQueue();
        }, 5000); // 5초마다 큐 처리
    }

    /**
     * 실행 큐 처리
     */
    async processExecutionQueue() {
        const pendingPlans = Array.from(this.actionPlans.values())
            .filter(plan => plan.status === 'pending')
            .sort((a, b) => {
                const priorityOrder = ['critical', 'high', 'medium', 'low'];
                return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
            });

        for (const plan of pendingPlans) {
            try {
                await this.executeActionPlan(plan.id);
            } catch (error) {
                logger.error(`큐 처리 중 오류: ${plan.id} - ${error.message}`);
            }
        }
    }

    /**
     * 액션플랜 재시도
     */
    async retryActionPlan(planId) {
        const plan = this.actionPlans.get(planId);
        if (!plan) {
            throw new Error(`액션플랜을 찾을 수 없습니다: ${planId}`);
        }

        if (plan.status !== 'failed') {
            throw new Error(`재시도할 수 없는 상태입니다: ${plan.status}`);
        }

        plan.retryAttempts++;
        if (plan.retryAttempts > plan.maxRetryAttempts) {
            throw new Error(`최대 재시도 횟수를 초과했습니다: ${planId}`);
        }

        // 실패한 액션들을 다시 실행
        plan.status = 'pending';
        plan.actions.forEach(action => {
            if (action.status === 'failed') {
                action.status = 'pending';
                action.error = null;
            }
        });

        logger.info(`액션플랜 재시도: ${planId} (${plan.retryAttempts}/${plan.maxRetryAttempts})`);
        return await this.executeActionPlan(planId);
    }

    /**
     * 액션플랜 취소
     */
    async cancelActionPlan(planId) {
        const plan = this.actionPlans.get(planId);
        if (!plan) {
            throw new Error(`액션플랜을 찾을 수 없습니다: ${planId}`);
        }

        if (plan.status !== 'running') {
            throw new Error(`취소할 수 없는 상태입니다: ${plan.status}`);
        }

        plan.status = 'cancelled';
        plan.completedAt = new Date().toISOString();
        this.performanceMetrics.activePlans--;

        // 실행 중인 액션 중단
        const currentAction = plan.actions[plan.currentActionIndex];
        if (currentAction && currentAction.status === 'running') {
            currentAction.status = 'cancelled';
            currentAction.completedAt = new Date().toISOString();
        }

        logger.info(`액션플랜 취소됨: ${planId}`);
        return plan;
    }

    /**
     * 성능 메트릭 업데이트
     */
    updatePerformanceMetrics() {
        const totalPlans = this.performanceMetrics.totalPlans;
        const completedPlans = this.performanceMetrics.completedPlans;
        const failedPlans = this.performanceMetrics.failedPlans;

        this.performanceMetrics.successRate = totalPlans > 0 ? (completedPlans / totalPlans) * 100 : 0;

        // 평균 실행 시간 계산
        const completedPlansList = Array.from(this.actionPlans.values())
            .filter(plan => plan.status === 'completed' && plan.actualDuration > 0);

        if (completedPlansList.length > 0) {
            const totalDuration = completedPlansList.reduce((sum, plan) => sum + plan.actualDuration, 0);
            this.performanceMetrics.averageExecutionTime = totalDuration / completedPlansList.length;
        }
    }

    /**
     * 시스템 상태 조회
     */
    getSystemStatus() {
        this.updatePerformanceMetrics();

        return {
            actionPlans: Array.from(this.actionPlans.values()),
            actionTemplates: Array.from(this.actionTemplates.values()),
            notificationRules: Array.from(this.notificationRules.values()),
            performanceMetrics: this.performanceMetrics,
            executionQueue: this.executionQueue
        };
    }

    /**
     * 액션플랜 조회
     */
    getActionPlan(planId) {
        return this.actionPlans.get(planId);
    }

    /**
     * 액션플랜 목록 조회
     */
    getActionPlans(filter = {}) {
        let plans = Array.from(this.actionPlans.values());

        if (filter.status) {
            plans = plans.filter(plan => plan.status === filter.status);
        }

        if (filter.category) {
            plans = plans.filter(plan => plan.category === filter.category);
        }

        if (filter.priority) {
            plans = plans.filter(plan => plan.priority === filter.priority);
        }

        return plans;
    }
}

module.exports = ActionPlanAutomation;
