const logger = require('../../utils/logger');

class IntelligentSchedulerService {
    constructor() {
        this.schedules = new Map();
        this.taskQueue = [];
        this.resourcePool = new Map();
        this.performanceHistory = new Map();
        this.priorityWeights = {
            critical: 10,
            high: 8,
            medium: 5,
            low: 2,
            background: 1
        };

        this.initializeScheduler();
    }

    // 스케줄러 초기화
    initializeScheduler() {
        this.scheduler = {
            isRunning: false,
            interval: 10000, // 10초마다 실행
            lastRun: null,
            nextRun: null,
            maxConcurrentTasks: 20,
            currentTasks: 0
        };

        // 리소스 풀 초기화
        this.resourcePool.set('cpu', { total: 100, used: 0, available: 100 });
        this.resourcePool.set('memory', { total: 100, used: 0, available: 100 });
        this.resourcePool.set('network', { total: 100, used: 0, available: 100 });
        this.resourcePool.set('storage', { total: 100, used: 0, available: 100 });
    }

    // 작업 스케줄링
    async scheduleTask(task) {
        try {
            const scheduledTask = {
                id: this.generateTaskId(),
                ...task,
                status: 'scheduled',
                scheduledAt: new Date().toISOString(),
                priority: this.calculateTaskPriority(task),
                estimatedDuration: this.estimateTaskDuration(task),
                resourceRequirements: this.calculateResourceRequirements(task),
                dependencies: task.dependencies || [],
                deadline: task.deadline || null
            };

            // 의존성 확인
            if (scheduledTask.dependencies.length > 0) {
                const canSchedule = await this.checkDependencies(scheduledTask.dependencies);
                if (!canSchedule) {
                    scheduledTask.status = 'waiting_dependencies';
                }
            }

            // 작업 큐에 추가
            this.taskQueue.push(scheduledTask);
            this.taskQueue.sort((a, b) => b.priority - a.priority);

            logger.info(`Task scheduled: ${scheduledTask.id} - ${scheduledTask.type}`);
            return {
                success: true,
                data: scheduledTask
            };
        } catch (error) {
            logger.error('Schedule task error:', error);
            throw error;
        }
    }

    // 작업 우선순위 계산
    calculateTaskPriority(task) {
        let priority = 0;

        // 기본 우선순위
        priority += this.priorityWeights[task.priority] || 5;

        // 마감일 고려
        if (task.deadline) {
            const timeToDeadline = new Date(task.deadline) - new Date();
            const hoursToDeadline = timeToDeadline / (1000 * 60 * 60);

            if (hoursToDeadline < 1) priority += 20;
            else if (hoursToDeadline < 6) priority += 15;
            else if (hoursToDeadline < 24) priority += 10;
            else if (hoursToDeadline < 72) priority += 5;
        }

        // 작업 유형별 가중치
        const typeWeights = {
            'security_scan': 15,
            'backup': 12,
            'monitoring': 10,
            'analytics': 8,
            'cleanup': 6,
            'reporting': 4,
            'maintenance': 3
        };
        priority += typeWeights[task.type] || 5;

        // 리소스 요구사항 고려
        const resourceScore = this.calculateResourceScore(task);
        priority += resourceScore;

        return Math.max(1, Math.min(100, priority));
    }

    // 리소스 점수 계산
    calculateResourceScore(task) {
        const requirements = this.calculateResourceRequirements(task);
        let score = 0;

        // 리소스 사용량이 적을수록 높은 우선순위
        const totalResourceUsage = Object.values(requirements).reduce((sum, usage) => sum + usage, 0);
        score += (100 - totalResourceUsage) / 10;

        return Math.max(0, Math.min(10, score));
    }

    // 작업 리소스 요구사항 계산
    calculateResourceRequirements(task) {
        const baseRequirements = {
            cpu: 10,
            memory: 10,
            network: 5,
            storage: 5
        };

        // 작업 유형별 리소스 요구사항 조정
        const typeMultipliers = {
            'security_scan': { cpu: 2.0, memory: 1.5, network: 1.0, storage: 1.2 },
            'backup': { cpu: 1.0, memory: 1.0, network: 2.0, storage: 3.0 },
            'monitoring': { cpu: 0.5, memory: 0.5, network: 0.5, storage: 0.5 },
            'analytics': { cpu: 1.5, memory: 2.0, network: 1.0, storage: 1.5 },
            'cleanup': { cpu: 0.8, memory: 0.8, network: 0.5, storage: 1.0 },
            'reporting': { cpu: 1.2, memory: 1.2, network: 0.8, storage: 1.0 },
            'maintenance': { cpu: 1.0, memory: 1.0, network: 0.5, storage: 0.8 }
        };

        const multipliers = typeMultipliers[task.type] || { cpu: 1.0, memory: 1.0, network: 1.0, storage: 1.0 };

        return {
            cpu: Math.min(100, Math.round(baseRequirements.cpu * multipliers.cpu)),
            memory: Math.min(100, Math.round(baseRequirements.memory * multipliers.memory)),
            network: Math.min(100, Math.round(baseRequirements.network * multipliers.network)),
            storage: Math.min(100, Math.round(baseRequirements.storage * multipliers.storage))
        };
    }

    // 작업 예상 소요 시간 계산
    estimateTaskDuration(task) {
        const baseDuration = 60000; // 1분

        const typeDurations = {
            'security_scan': 300000, // 5분
            'backup': 600000, // 10분
            'monitoring': 30000, // 30초
            'analytics': 180000, // 3분
            'cleanup': 120000, // 2분
            'reporting': 90000, // 1.5분
            'maintenance': 240000 // 4분
        };

        const duration = typeDurations[task.type] || baseDuration;

        // 복잡도에 따른 조정
        const complexityMultiplier = task.complexity || 1;
        return Math.round(duration * complexityMultiplier);
    }

    // 의존성 확인
    async checkDependencies(dependencies) {
        for (const depId of dependencies) {
            const depTask = this.taskQueue.find(t => t.id === depId);
            if (!depTask || depTask.status !== 'completed') {
                return false;
            }
        }
        return true;
    }

    // 스케줄러 실행
    async runScheduler() {
        try {
            if (this.scheduler.isRunning) {
                return { success: true, message: 'Scheduler already running' };
            }

            this.scheduler.isRunning = true;
            this.scheduler.lastRun = new Date().toISOString();

            // 실행 가능한 작업 찾기
            const executableTasks = this.taskQueue.filter(task =>
                task.status === 'scheduled' ||
                (task.status === 'waiting_dependencies' && this.checkDependencies(task.dependencies))
            );

            // 리소스 확인 및 작업 실행
            const executedTasks = [];
            for (const task of executableTasks) {
                if (this.scheduler.currentTasks >= this.scheduler.maxConcurrentTasks) {
                    break;
                }

                if (this.canAllocateResources(task.resourceRequirements)) {
                    await this.executeTask(task);
                    executedTasks.push(task);
                }
            }

            // 다음 실행 시간 설정
            this.scheduler.nextRun = new Date(Date.now() + this.scheduler.interval).toISOString();

            logger.info(`Scheduler executed: ${executedTasks.length} tasks`);
            return {
                success: true,
                data: {
                    executedTasks: executedTasks.length,
                    totalTasks: this.taskQueue.length,
                    nextRun: this.scheduler.nextRun
                }
            };
        } catch (error) {
            logger.error('Run scheduler error:', error);
            throw error;
        }
    }

    // 리소스 할당 가능 여부 확인
    canAllocateResources(requirements) {
        for (const [resource, required] of Object.entries(requirements)) {
            const pool = this.resourcePool.get(resource);
            if (!pool || pool.available < required) {
                return false;
            }
        }
        return true;
    }

    // 리소스 할당
    allocateResources(requirements) {
        for (const [resource, required] of Object.entries(requirements)) {
            const pool = this.resourcePool.get(resource);
            if (pool) {
                pool.used += required;
                pool.available -= required;
            }
        }
    }

    // 리소스 해제
    releaseResources(requirements) {
        for (const [resource, required] of Object.entries(requirements)) {
            const pool = this.resourcePool.get(resource);
            if (pool) {
                pool.used = Math.max(0, pool.used - required);
                pool.available = Math.min(pool.total, pool.available + required);
            }
        }
    }

    // 작업 실행
    async executeTask(task) {
        try {
            task.status = 'running';
            task.startedAt = new Date().toISOString();

            // 리소스 할당
            this.allocateResources(task.resourceRequirements);
            this.scheduler.currentTasks++;

            // 작업 실행 시뮬레이션
            const result = await this.simulateTaskExecution(task);

            // 작업 완료 처리
            task.status = result.success ? 'completed' : 'failed';
            task.completedAt = new Date().toISOString();
            task.result = result;

            // 리소스 해제
            this.releaseResources(task.resourceRequirements);
            this.scheduler.currentTasks--;

            // 성능 기록
            this.recordTaskPerformance(task, result);

            logger.info(`Task executed: ${task.id} - ${result.success ? 'Success' : 'Failed'}`);
            return result;
        } catch (error) {
            logger.error(`Task execution error: ${task.id}`, error);

            task.status = 'failed';
            task.completedAt = new Date().toISOString();
            task.error = error.message;

            this.releaseResources(task.resourceRequirements);
            this.scheduler.currentTasks--;

            throw error;
        }
    }

    // 작업 실행 시뮬레이션
    async simulateTaskExecution(task) {
        const startTime = Date.now();

        try {
            // 작업 유형별 실행 로직
            switch (task.type) {
                case 'security_scan':
                    return await this.simulateSecurityScan(task);
                case 'backup':
                    return await this.simulateBackup(task);
                case 'monitoring':
                    return await this.simulateMonitoring(task);
                case 'analytics':
                    return await this.simulateAnalytics(task);
                case 'cleanup':
                    return await this.simulateCleanup(task);
                case 'reporting':
                    return await this.simulateReporting(task);
                case 'maintenance':
                    return await this.simulateMaintenance(task);
                default:
                    return await this.simulateGenericTask(task);
            }
        } catch (error) {
            return {
                success: false,
                message: `Task execution failed: ${error.message}`,
                details: error.toString(),
                executionTime: Date.now() - startTime
            };
        }
    }

    // 보안 스캔 시뮬레이션
    async simulateSecurityScan(task) {
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

        return {
            success: Math.random() > 0.05, // 95% 성공률
            message: 'Security scan completed',
            details: {
                vulnerabilitiesFound: Math.floor(Math.random() * 10),
                scanDuration: '2-5 minutes',
                riskLevel: Math.random() > 0.8 ? 'high' : 'low'
            },
            executionTime: Date.now()
        };
    }

    // 백업 시뮬레이션
    async simulateBackup(task) {
        await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));

        return {
            success: Math.random() > 0.02, // 98% 성공률
            message: 'Backup completed',
            details: {
                dataSize: Math.floor(Math.random() * 1000) + 100 + ' MB',
                backupLocation: 'secure_storage',
                compressionRatio: Math.random() * 0.5 + 0.3
            },
            executionTime: Date.now()
        };
    }

    // 모니터링 시뮬레이션
    async simulateMonitoring(task) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        return {
            success: Math.random() > 0.01, // 99% 성공률
            message: 'Monitoring check completed',
            details: {
                metricsCollected: Math.floor(Math.random() * 50) + 10,
                alertsGenerated: Math.floor(Math.random() * 3),
                systemHealth: Math.random() > 0.1 ? 'good' : 'warning'
            },
            executionTime: Date.now()
        };
    }

    // 분석 시뮬레이션
    async simulateAnalytics(task) {
        await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 4000));

        return {
            success: Math.random() > 0.08, // 92% 성공률
            message: 'Analytics processing completed',
            details: {
                dataPoints: Math.floor(Math.random() * 10000) + 1000,
                insightsGenerated: Math.floor(Math.random() * 20) + 5,
                accuracy: Math.random() * 0.3 + 0.7
            },
            executionTime: Date.now()
        };
    }

    // 정리 작업 시뮬레이션
    async simulateCleanup(task) {
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

        return {
            success: Math.random() > 0.05, // 95% 성공률
            message: 'Cleanup completed',
            details: {
                filesRemoved: Math.floor(Math.random() * 1000) + 100,
                spaceFreed: Math.floor(Math.random() * 500) + 50 + ' MB',
                itemsProcessed: Math.floor(Math.random() * 5000) + 500
            },
            executionTime: Date.now()
        };
    }

    // 리포팅 시뮬레이션
    async simulateReporting(task) {
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2500));

        return {
            success: Math.random() > 0.05, // 95% 성공률
            message: 'Report generated',
            details: {
                reportType: task.data?.reportType || 'standard',
                pagesGenerated: Math.floor(Math.random() * 20) + 5,
                dataSources: Math.floor(Math.random() * 10) + 1
            },
            executionTime: Date.now()
        };
    }

    // 유지보수 시뮬레이션
    async simulateMaintenance(task) {
        await new Promise(resolve => setTimeout(resolve, 4000 + Math.random() * 6000));

        return {
            success: Math.random() > 0.03, // 97% 성공률
            message: 'Maintenance completed',
            details: {
                componentsUpdated: Math.floor(Math.random() * 20) + 5,
                performanceImprovement: Math.random() * 0.2 + 0.05,
                issuesResolved: Math.floor(Math.random() * 10) + 1
            },
            executionTime: Date.now()
        };
    }

    // 일반 작업 시뮬레이션
    async simulateGenericTask(task) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        return {
            success: Math.random() > 0.1, // 90% 성공률
            message: 'Generic task completed',
            details: {
                taskType: task.type,
                data: task.data,
                processed: true
            },
            executionTime: Date.now()
        };
    }

    // 작업 성능 기록
    recordTaskPerformance(task, result) {
        const performance = {
            taskId: task.id,
            type: task.type,
            priority: task.priority,
            executionTime: result.executionTime,
            success: result.success,
            resourceUsage: task.resourceRequirements,
            timestamp: new Date().toISOString()
        };

        const history = this.performanceHistory.get(task.type) || [];
        history.push(performance);

        // 최근 100개 기록만 유지
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }

        this.performanceHistory.set(task.type, history);
    }

    // 스케줄러 상태 조회
    getSchedulerStatus() {
        return {
            isRunning: this.scheduler.isRunning,
            lastRun: this.scheduler.lastRun,
            nextRun: this.scheduler.nextRun,
            currentTasks: this.scheduler.currentTasks,
            maxConcurrentTasks: this.scheduler.maxConcurrentTasks,
            queueLength: this.taskQueue.length,
            resourcePool: Object.fromEntries(this.resourcePool),
            performanceHistory: Object.fromEntries(this.performanceHistory)
        };
    }

    // 작업 큐 조회
    getTaskQueue(filters = {}) {
        let tasks = [...this.taskQueue];

        if (filters.status) {
            tasks = tasks.filter(t => t.status === filters.status);
        }
        if (filters.type) {
            tasks = tasks.filter(t => t.type === filters.type);
        }
        if (filters.priority) {
            tasks = tasks.filter(t => t.priority >= filters.priority);
        }

        return tasks.sort((a, b) => b.priority - a.priority);
    }

    // 성능 통계
    getPerformanceStats() {
        const stats = {};

        for (const [taskType, history] of this.performanceHistory) {
            if (history.length === 0) continue;

            const successful = history.filter(h => h.success).length;
            const avgExecutionTime = history.reduce((sum, h) => sum + h.executionTime, 0) / history.length;
            const avgResourceUsage = history.reduce((sum, h) => {
                const total = Object.values(h.resourceUsage).reduce((s, v) => s + v, 0);
                return sum + total;
            }, 0) / history.length;

            stats[taskType] = {
                totalTasks: history.length,
                successRate: successful / history.length,
                averageExecutionTime: avgExecutionTime,
                averageResourceUsage: avgResourceUsage,
                lastExecution: history[history.length - 1]?.timestamp
            };
        }

        return stats;
    }

    // 스케줄러 중지
    stopScheduler() {
        this.scheduler.isRunning = false;
        this.scheduler.nextRun = null;
        logger.info('Scheduler stopped');
    }

    // 스케줄러 재시작
    restartScheduler() {
        this.scheduler.isRunning = true;
        this.scheduler.nextRun = new Date(Date.now() + this.scheduler.interval).toISOString();
        logger.info('Scheduler restarted');
    }

    // 유틸리티 메서드
    generateTaskId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

module.exports = new IntelligentSchedulerService();

