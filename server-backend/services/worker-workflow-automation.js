/**
 * Worker Workflow Automation Service
 * 오토에이전트 워커 플로우 자동화 시스템
 * 
 * 기능:
 * - 워커 상태 모니터링
 * - 작업 자동 할당
 * - 실패 시 자동 복구
 * - 성능 최적화
 */

const { logger } = require('../utils/logger');
const { performanceMonitor } = require('../utils/performance-monitor');

class WorkerWorkflowAutomation {
    constructor() {
        this.workers = new Map();
        this.taskQueue = [];
        this.workflowTemplates = new Map();
        this.recoveryStrategies = new Map();
        this.performanceMetrics = {
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            averageProcessingTime: 0,
            successRate: 0,
            activeWorkers: 0,
            idleWorkers: 0
        };

        this.initializeWorkflowTemplates();
        this.initializeRecoveryStrategies();
        this.startHealthMonitoring();
    }

    /**
     * 워크플로우 템플릿 초기화
     */
    initializeWorkflowTemplates() {
        // TODO 에이전트 워크플로우
        this.workflowTemplates.set('TODO_WORKFLOW', {
            id: 'TODO_WORKFLOW',
            name: 'TODO 관리 워크플로우',
            steps: [
                {
                    id: 'task_analysis',
                    name: '작업 분석',
                    type: 'analysis',
                    timeout: 30,
                    retryAttempts: 2
                },
                {
                    id: 'task_planning',
                    name: '작업 계획 수립',
                    type: 'planning',
                    timeout: 60,
                    retryAttempts: 2
                },
                {
                    id: 'task_execution',
                    name: '작업 실행',
                    type: 'execution',
                    timeout: 300,
                    retryAttempts: 3
                },
                {
                    id: 'task_validation',
                    name: '작업 검증',
                    type: 'validation',
                    timeout: 30,
                    retryAttempts: 2
                }
            ],
            priority: 'high',
            estimatedDuration: 420 // 7분
        });

        // 보안 에이전트 워크플로우
        this.workflowTemplates.set('SECURITY_WORKFLOW', {
            id: 'SECURITY_WORKFLOW',
            name: '보안 관리 워크플로우',
            steps: [
                {
                    id: 'vulnerability_scan',
                    name: '취약점 스캔',
                    type: 'scan',
                    timeout: 180,
                    retryAttempts: 2
                },
                {
                    id: 'threat_analysis',
                    name: '위협 분석',
                    type: 'analysis',
                    timeout: 120,
                    retryAttempts: 2
                },
                {
                    id: 'incident_response',
                    name: '사고 대응',
                    type: 'response',
                    timeout: 300,
                    retryAttempts: 3
                },
                {
                    id: 'security_report',
                    name: '보안 보고서 생성',
                    type: 'reporting',
                    timeout: 60,
                    retryAttempts: 2
                }
            ],
            priority: 'critical',
            estimatedDuration: 660 // 11분
        });

        // 분석 에이전트 워크플로우
        this.workflowTemplates.set('ANALYTICS_WORKFLOW', {
            id: 'ANALYTICS_WORKFLOW',
            name: '분석 워크플로우',
            steps: [
                {
                    id: 'data_collection',
                    name: '데이터 수집',
                    type: 'collection',
                    timeout: 240,
                    retryAttempts: 2
                },
                {
                    id: 'data_processing',
                    name: '데이터 처리',
                    type: 'processing',
                    timeout: 300,
                    retryAttempts: 2
                },
                {
                    id: 'analysis_execution',
                    name: '분석 실행',
                    type: 'analysis',
                    timeout: 180,
                    retryAttempts: 2
                },
                {
                    id: 'report_generation',
                    name: '보고서 생성',
                    type: 'reporting',
                    timeout: 120,
                    retryAttempts: 2
                }
            ],
            priority: 'medium',
            estimatedDuration: 840 // 14분
        });
    }

    /**
     * 복구 전략 초기화
     */
    initializeRecoveryStrategies() {
        // 작업 실패 시 복구 전략
        this.recoveryStrategies.set('TASK_FAILURE', {
            id: 'TASK_FAILURE',
            name: '작업 실패 복구',
            strategies: [
                {
                    type: 'retry',
                    maxAttempts: 3,
                    backoffMultiplier: 2,
                    initialDelay: 1000
                },
                {
                    type: 'fallback',
                    fallbackWorker: 'BACKUP_WORKER',
                    timeout: 5000
                },
                {
                    type: 'escalation',
                    escalateTo: 'ADMIN',
                    timeout: 10000
                }
            ]
        });

        // 워커 장애 시 복구 전략
        this.recoveryStrategies.set('WORKER_FAILURE', {
            id: 'WORKER_FAILURE',
            name: '워커 장애 복구',
            strategies: [
                {
                    type: 'restart',
                    maxAttempts: 2,
                    delay: 2000
                },
                {
                    type: 'replacement',
                    replacementWorker: 'STANDBY_WORKER',
                    timeout: 5000
                },
                {
                    type: 'task_redistribution',
                    redistributeTo: 'AVAILABLE_WORKERS',
                    timeout: 10000
                }
            ]
        });
    }

    /**
     * 워커 등록
     */
    registerWorker(workerConfig) {
        const worker = {
            id: workerConfig.id,
            name: workerConfig.name,
            type: workerConfig.type,
            status: 'idle',
            capabilities: workerConfig.capabilities || [],
            currentTask: null,
            performance: {
                tasksCompleted: 0,
                successRate: 100,
                averageProcessingTime: 0,
                uptime: 100
            },
            lastActivity: new Date().toISOString(),
            health: 'healthy',
            registeredAt: new Date().toISOString()
        };

        this.workers.set(worker.id, worker);
        this.performanceMetrics.activeWorkers = this.workers.size;

        logger.info(`워커 등록됨: ${worker.id} - ${worker.name}`);
        return worker;
    }

    /**
     * 작업 할당
     */
    async assignTask(taskConfig) {
        const task = {
            id: taskConfig.id || `task_${Date.now()}`,
            type: taskConfig.type,
            priority: taskConfig.priority || 'medium',
            data: taskConfig.data,
            status: 'pending',
            createdAt: new Date().toISOString(),
            assignedWorker: null,
            workflow: taskConfig.workflow
        };

        // 적합한 워커 찾기
        const suitableWorker = this.findSuitableWorker(task);
        if (!suitableWorker) {
            // 대기열에 추가
            this.taskQueue.push(task);
            logger.warn(`적합한 워커를 찾을 수 없어 대기열에 추가: ${task.id}`);
            return { success: false, message: '적합한 워커를 찾을 수 없습니다.' };
        }

        // 작업 할당
        task.assignedWorker = suitableWorker.id;
        task.status = 'assigned';
        task.assignedAt = new Date().toISOString();

        suitableWorker.currentTask = task;
        suitableWorker.status = 'busy';

        this.performanceMetrics.totalTasks++;

        logger.info(`작업 할당됨: ${task.id} -> ${suitableWorker.id}`);
        return { success: true, task, worker: suitableWorker };
    }

    /**
     * 적합한 워커 찾기
     */
    findSuitableWorker(task) {
        const availableWorkers = Array.from(this.workers.values())
            .filter(worker =>
                worker.status === 'idle' &&
                worker.health === 'healthy' &&
                worker.capabilities.includes(task.type)
            );

        if (availableWorkers.length === 0) {
            return null;
        }

        // 우선순위 기반 선택
        const priorityOrder = ['critical', 'high', 'medium', 'low'];
        const taskPriority = priorityOrder.indexOf(task.priority);

        // 성능 기반 정렬
        availableWorkers.sort((a, b) => {
            const aScore = this.calculateWorkerScore(a, task);
            const bScore = this.calculateWorkerScore(b, task);
            return bScore - aScore;
        });

        return availableWorkers[0];
    }

    /**
     * 워커 점수 계산
     */
    calculateWorkerScore(worker, task) {
        let score = 0;

        // 성공률 가중치
        score += worker.performance.successRate * 0.4;

        // 처리 시간 가중치 (빠를수록 높은 점수)
        const avgTime = worker.performance.averageProcessingTime;
        score += (1000 - Math.min(avgTime, 1000)) * 0.3;

        // 가동률 가중치
        score += worker.performance.uptime * 0.2;

        // 최근 활동 가중치
        const lastActivity = new Date(worker.lastActivity);
        const now = new Date();
        const timeDiff = (now - lastActivity) / 1000 / 60; // 분
        score += Math.max(0, 60 - timeDiff) * 0.1;

        return score;
    }

    /**
     * 워크플로우 실행
     */
    async executeWorkflow(workflowId, data) {
        const template = this.workflowTemplates.get(workflowId);
        if (!template) {
            throw new Error(`워크플로우 템플릿을 찾을 수 없습니다: ${workflowId}`);
        }

        const execution = {
            id: `execution_${Date.now()}`,
            workflowId,
            data,
            status: 'running',
            startedAt: new Date().toISOString(),
            steps: template.steps.map(step => ({
                ...step,
                status: 'pending',
                attempts: 0,
                lastAttempt: null
            })),
            currentStepIndex: 0
        };

        logger.info(`워크플로우 실행 시작: ${execution.id}`);

        try {
            await this.executeWorkflowSteps(execution);
            execution.status = 'completed';
            execution.completedAt = new Date().toISOString();
            this.performanceMetrics.completedTasks++;

            logger.info(`워크플로우 완료: ${execution.id}`);
        } catch (error) {
            execution.status = 'failed';
            execution.error = error.message;
            execution.failedAt = new Date().toISOString();
            this.performanceMetrics.failedTasks++;

            logger.error(`워크플로우 실패: ${execution.id} - ${error.message}`);

            // 자동 복구 시도
            await this.attemptRecovery(execution, error);
        }

        return execution;
    }

    /**
     * 워크플로우 단계 실행
     */
    async executeWorkflowSteps(execution) {
        for (let i = 0; i < execution.steps.length; i++) {
            const step = execution.steps[i];
            execution.currentStepIndex = i;

            step.status = 'running';
            step.startedAt = new Date().toISOString();
            step.attempts++;

            try {
                await this.executeStep(step, execution.data);
                step.status = 'completed';
                step.completedAt = new Date().toISOString();

                logger.info(`단계 완료: ${execution.id} - ${step.name}`);
            } catch (error) {
                step.status = 'failed';
                step.error = error.message;
                step.failedAt = new Date().toISOString();

                logger.error(`단계 실패: ${execution.id} - ${step.name} - ${error.message}`);

                // 재시도 로직
                if (step.attempts < step.retryAttempts) {
                    logger.info(`단계 재시도: ${execution.id} - ${step.name} (${step.attempts}/${step.retryAttempts})`);
                    i--; // 현재 단계를 다시 실행
                    continue;
                }

                throw error;
            }
        }
    }

    /**
     * 단계 실행
     */
    async executeStep(step, data) {
        const startTime = Date.now();

        try {
            // 실제 단계 실행 로직 (여기서는 시뮬레이션)
            await this.simulateStepExecution(step, data);

            const processingTime = Date.now() - startTime;
            logger.info(`단계 실행 완료: ${step.name} - ${processingTime}ms`);

        } catch (error) {
            logger.error(`단계 실행 실패: ${step.name} - ${error.message}`);
            throw error;
        }
    }

    /**
     * 단계 실행 시뮬레이션
     */
    async simulateStepExecution(step, data) {
        // 실제 구현에서는 각 단계별 로직을 실행
        const delay = Math.random() * 1000 + 500; // 500-1500ms
        await new Promise(resolve => setTimeout(resolve, delay));

        // 5% 확률로 실패 (테스트용)
        if (Math.random() < 0.05) {
            throw new Error(`단계 실행 실패: ${step.name}`);
        }
    }

    /**
     * 자동 복구 시도
     */
    async attemptRecovery(execution, error) {
        const recoveryStrategy = this.recoveryStrategies.get('TASK_FAILURE');
        if (!recoveryStrategy) {
            logger.error(`복구 전략을 찾을 수 없습니다: ${execution.id}`);
            return;
        }

        logger.info(`자동 복구 시도: ${execution.id}`);

        for (const strategy of recoveryStrategy.strategies) {
            try {
                switch (strategy.type) {
                    case 'retry':
                        await this.retryExecution(execution, strategy);
                        break;
                    case 'fallback':
                        await this.fallbackExecution(execution, strategy);
                        break;
                    case 'escalation':
                        await this.escalateExecution(execution, strategy);
                        break;
                }

                logger.info(`복구 성공: ${execution.id} - ${strategy.type}`);
                return;
            } catch (recoveryError) {
                logger.error(`복구 실패: ${execution.id} - ${strategy.type} - ${recoveryError.message}`);
            }
        }

        logger.error(`모든 복구 시도 실패: ${execution.id}`);
    }

    /**
     * 실행 재시도
     */
    async retryExecution(execution, strategy) {
        const delay = strategy.initialDelay * Math.pow(strategy.backoffMultiplier, execution.retryAttempts || 0);
        await new Promise(resolve => setTimeout(resolve, delay));

        execution.retryAttempts = (execution.retryAttempts || 0) + 1;
        await this.executeWorkflowSteps(execution);
    }

    /**
     * 폴백 실행
     */
    async fallbackExecution(execution, strategy) {
        // 폴백 워커로 작업 재할당
        const fallbackWorker = this.workers.get(strategy.fallbackWorker);
        if (fallbackWorker && fallbackWorker.status === 'idle') {
            execution.assignedWorker = fallbackWorker.id;
            await this.executeWorkflowSteps(execution);
        } else {
            throw new Error('폴백 워커를 사용할 수 없습니다');
        }
    }

    /**
     * 에스컬레이션
     */
    async escalateExecution(execution, strategy) {
        // 관리자에게 알림
        logger.error(`에스컬레이션 필요: ${execution.id} -> ${strategy.escalateTo}`);

        // 실제 구현에서는 알림 시스템을 통해 관리자에게 통지
        throw new Error('에스컬레이션 처리 필요');
    }

    /**
     * 헬스 모니터링 시작
     */
    startHealthMonitoring() {
        setInterval(() => {
            this.performHealthCheck();
        }, 30000); // 30초마다 체크
    }

    /**
     * 헬스 체크 수행
     */
    performHealthCheck() {
        const now = new Date();

        for (const [workerId, worker] of this.workers) {
            const lastActivity = new Date(worker.lastActivity);
            const timeDiff = (now - lastActivity) / 1000 / 60; // 분

            // 5분 이상 비활성 상태면 비정상으로 간주
            if (timeDiff > 5 && worker.status === 'busy') {
                worker.health = 'unhealthy';
                logger.warn(`워커 비정상 상태 감지: ${workerId}`);

                // 자동 복구 시도
                this.attemptWorkerRecovery(worker);
            }
        }

        // 성능 메트릭 업데이트
        this.updatePerformanceMetrics();
    }

    /**
     * 워커 복구 시도
     */
    async attemptWorkerRecovery(worker) {
        const recoveryStrategy = this.recoveryStrategies.get('WORKER_FAILURE');
        if (!recoveryStrategy) return;

        for (const strategy of recoveryStrategy.strategies) {
            try {
                switch (strategy.type) {
                    case 'restart':
                        await this.restartWorker(worker, strategy);
                        break;
                    case 'replacement':
                        await this.replaceWorker(worker, strategy);
                        break;
                    case 'task_redistribution':
                        await this.redistributeTasks(worker, strategy);
                        break;
                }

                logger.info(`워커 복구 성공: ${worker.id} - ${strategy.type}`);
                return;
            } catch (error) {
                logger.error(`워커 복구 실패: ${worker.id} - ${strategy.type} - ${error.message}`);
            }
        }
    }

    /**
     * 워커 재시작
     */
    async restartWorker(worker, strategy) {
        worker.status = 'restarting';
        worker.health = 'recovering';

        // 실제 구현에서는 워커 프로세스를 재시작
        await new Promise(resolve => setTimeout(resolve, strategy.delay));

        worker.status = 'idle';
        worker.health = 'healthy';
        worker.lastActivity = new Date().toISOString();
    }

    /**
     * 워커 교체
     */
    async replaceWorker(worker, strategy) {
        const replacementWorker = this.workers.get(strategy.replacementWorker);
        if (replacementWorker && replacementWorker.status === 'idle') {
            // 현재 작업을 교체 워커로 이동
            if (worker.currentTask) {
                replacementWorker.currentTask = worker.currentTask;
                replacementWorker.status = 'busy';
                worker.currentTask = null;
            }

            worker.status = 'replaced';
            worker.health = 'unhealthy';
        }
    }

    /**
     * 작업 재분배
     */
    async redistributeTasks(worker, strategy) {
        if (worker.currentTask) {
            // 작업을 다른 워커로 재할당
            const availableWorkers = Array.from(this.workers.values())
                .filter(w => w.id !== worker.id && w.status === 'idle' && w.health === 'healthy');

            if (availableWorkers.length > 0) {
                const newWorker = availableWorkers[0];
                newWorker.currentTask = worker.currentTask;
                newWorker.status = 'busy';
                worker.currentTask = null;
            }
        }
    }

    /**
     * 성능 메트릭 업데이트
     */
    updatePerformanceMetrics() {
        const totalTasks = this.performanceMetrics.totalTasks;
        const completedTasks = this.performanceMetrics.completedTasks;
        const failedTasks = this.performanceMetrics.failedTasks;

        this.performanceMetrics.successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        this.performanceMetrics.activeWorkers = Array.from(this.workers.values()).filter(w => w.status === 'busy').length;
        this.performanceMetrics.idleWorkers = Array.from(this.workers.values()).filter(w => w.status === 'idle').length;
    }

    /**
     * 시스템 상태 조회
     */
    getSystemStatus() {
        return {
            workers: Array.from(this.workers.values()),
            taskQueue: this.taskQueue,
            performanceMetrics: this.performanceMetrics,
            workflowTemplates: Array.from(this.workflowTemplates.values()),
            recoveryStrategies: Array.from(this.recoveryStrategies.values())
        };
    }
}

module.exports = WorkerWorkflowAutomation;
