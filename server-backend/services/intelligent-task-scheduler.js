/**
 * Intelligent Task Scheduler Service
 * 지능형 작업 스케줄러 서비스
 * 
 * 기능:
 * - AI 기반 작업 우선순위 결정
 * - 예측적 작업 관리
 * - 동적 리소스 할당
 * - 성능 최적화
 */

const { logger } = require('../utils/logger');
const { performanceMonitor } = require('../utils/performance-monitor');

class IntelligentTaskScheduler {
    constructor() {
        this.taskQueue = [];
        this.runningTasks = new Map();
        this.completedTasks = [];
        this.failedTasks = [];
        
        // AI 모델 시뮬레이션 (실제 구현에서는 TensorFlow.js 등 사용)
        this.aiModel = new TaskPriorityAI();
        this.learningData = new Map();
        this.predictiveAnalytics = new PredictiveAnalytics();
        
        // 성능 메트릭
        this.metrics = {
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            averageProcessingTime: 0,
            averageWaitTime: 0,
            throughput: 0,
            successRate: 0,
            resourceUtilization: 0
        };

        // 설정
        this.config = {
            maxConcurrentTasks: 10,
            taskTimeout: 300000, // 5분
            retryAttempts: 3,
            learningEnabled: true,
            predictiveMode: true,
            optimizationInterval: 60000 // 1분
        };

        this.initializeScheduler();
    }

    /**
     * 스케줄러 초기화
     */
    initializeScheduler() {
        logger.info('지능형 작업 스케줄러 초기화 시작');
        
        // 주기적 최적화 실행
        setInterval(() => {
            this.optimizeScheduling();
        }, this.config.optimizationInterval);

        // 성능 모니터링 시작
        this.startPerformanceMonitoring();
        
        logger.info('지능형 작업 스케줄러 초기화 완료');
    }

    /**
     * 작업 추가
     */
    async addTask(task) {
        try {
            // 작업 ID 생성
            const taskId = this.generateTaskId();
            
            // 작업 정보 보강
            const enhancedTask = {
                id: taskId,
                ...task,
                createdAt: new Date(),
                status: 'pending',
                priority: await this.calculateAIPriority(task),
                estimatedDuration: await this.estimateTaskDuration(task),
                resourceRequirements: await this.analyzeResourceRequirements(task),
                dependencies: task.dependencies || [],
                retryCount: 0,
                metadata: {
                    originalPriority: task.priority || 'medium',
                    source: task.source || 'manual',
                    category: task.category || 'general'
                }
            };

            // 큐에 추가 (우선순위 순으로 정렬)
            this.taskQueue.push(enhancedTask);
            this.taskQueue.sort((a, b) => b.priority - a.priority);

            // 메트릭 업데이트
            this.metrics.totalTasks++;

            logger.info(`작업 추가됨: ${taskId}, 우선순위: ${enhancedTask.priority}`);

            // 즉시 스케줄링 시도
            await this.scheduleNextTasks();

            return {
                success: true,
                taskId: taskId,
                estimatedStartTime: await this.estimateStartTime(enhancedTask),
                queuePosition: this.getQueuePosition(taskId)
            };

        } catch (error) {
            logger.error('작업 추가 실패:', error);
            throw error;
        }
    }

    /**
     * AI 기반 우선순위 계산
     */
    async calculateAIPriority(task) {
        try {
            const factors = {
                // 긴급도 (0-1)
                urgency: task.deadline ? this.calculateUrgency(task.deadline) : 0.5,
                
                // 복잡도 (0-1)
                complexity: await this.analyzeComplexity(task.description || ''),
                
                // 의존성 (0-1)
                dependencies: this.analyzeDependencies(task.dependencies || []),
                
                // 리소스 가용성 (0-1)
                resourceAvailability: await this.checkResourceAvailability(),
                
                // 과거 성능 데이터 (0-1)
                historicalPerformance: await this.getHistoricalPerformance(task.type || 'general'),
                
                // 비즈니스 영향도 (0-1)
                businessImpact: this.calculateBusinessImpact(task.category || 'general'),
                
                // 사용자 우선순위 (0-1)
                userPriority: this.normalizeUserPriority(task.priority || 'medium')
            };

            // AI 모델로 우선순위 예측
            const aiPriority = await this.aiModel.predict(factors);
            
            // 학습 데이터 저장
            if (this.config.learningEnabled) {
                this.storeLearningData(task, factors, aiPriority);
            }

            return Math.max(0, Math.min(1, aiPriority));

        } catch (error) {
            logger.error('AI 우선순위 계산 실패:', error);
            // 폴백: 기본 우선순위 계산
            return this.calculateBasicPriority(task);
        }
    }

    /**
     * 작업 지속 시간 예측
     */
    async estimateTaskDuration(task) {
        try {
            // 과거 유사 작업 데이터 조회
            const similarTasks = await this.findSimilarTasks(task);
            
            if (similarTasks.length > 0) {
                // 유사 작업 평균 시간 계산
                const avgDuration = similarTasks.reduce((sum, t) => sum + t.duration, 0) / similarTasks.length;
                
                // 복잡도에 따른 조정
                const complexityFactor = await this.analyzeComplexity(task.description || '');
                
                return Math.round(avgDuration * (1 + complexityFactor));
            }

            // 기본 예상 시간 (작업 유형별)
            const defaultDurations = {
                'analysis': 300000,      // 5분
                'processing': 600000,    // 10분
                'integration': 900000,   // 15분
                'monitoring': 180000,    // 3분
                'security': 1200000,     // 20분
                'general': 300000        // 5분
            };

            return defaultDurations[task.type] || defaultDurations['general'];

        } catch (error) {
            logger.error('작업 시간 예측 실패:', error);
            return 300000; // 기본 5분
        }
    }

    /**
     * 다음 작업들 스케줄링
     */
    async scheduleNextTasks() {
        try {
            // 실행 가능한 작업 수 계산
            const availableSlots = this.config.maxConcurrentTasks - this.runningTasks.size;
            
            if (availableSlots <= 0) {
                return;
            }

            // 실행 가능한 작업 찾기
            const executableTasks = await this.findExecutableTasks(availableSlots);
            
            // 작업 실행
            for (const task of executableTasks) {
                await this.executeTask(task);
            }

        } catch (error) {
            logger.error('작업 스케줄링 실패:', error);
        }
    }

    /**
     * 실행 가능한 작업 찾기
     */
    async findExecutableTasks(maxCount) {
        const executableTasks = [];
        
        for (const task of this.taskQueue) {
            if (executableTasks.length >= maxCount) {
                break;
            }

            // 의존성 확인
            if (await this.checkDependencies(task)) {
                // 리소스 가용성 확인
                if (await this.checkResourceAvailability(task)) {
                    executableTasks.push(task);
                }
            }
        }

        return executableTasks;
    }

    /**
     * 작업 실행
     */
    async executeTask(task) {
        try {
            // 큐에서 제거
            const index = this.taskQueue.findIndex(t => t.id === task.id);
            if (index !== -1) {
                this.taskQueue.splice(index, 1);
            }

            // 실행 중 목록에 추가
            task.status = 'running';
            task.startedAt = new Date();
            this.runningTasks.set(task.id, task);

            logger.info(`작업 실행 시작: ${task.id}`);

            // 작업 실행 (실제 구현에서는 해당 에이전트에게 위임)
            const result = await this.performTask(task);

            // 성공 처리
            await this.handleTaskSuccess(task, result);

        } catch (error) {
            // 실패 처리
            await this.handleTaskFailure(task, error);
        }
    }

    /**
     * 작업 수행 (시뮬레이션)
     */
    async performTask(task) {
        return new Promise((resolve, reject) => {
            // 실제 구현에서는 해당 에이전트의 작업 수행 메서드 호출
            const duration = task.estimatedDuration || 5000;
            
            setTimeout(() => {
                // 90% 성공률 시뮬레이션
                if (Math.random() > 0.1) {
                    resolve({
                        success: true,
                        result: `작업 ${task.id} 완료`,
                        executionTime: duration
                    });
                } else {
                    reject(new Error(`작업 ${task.id} 실행 실패`));
                }
            }, duration);
        });
    }

    /**
     * 작업 성공 처리
     */
    async handleTaskSuccess(task, result) {
        try {
            // 실행 중 목록에서 제거
            this.runningTasks.delete(task.id);

            // 완료 정보 업데이트
            task.status = 'completed';
            task.completedAt = new Date();
            task.result = result;
            task.executionTime = task.completedAt - task.startedAt;

            // 완료 목록에 추가
            this.completedTasks.push(task);

            // 메트릭 업데이트
            this.metrics.completedTasks++;
            this.updatePerformanceMetrics(task);

            // 학습 데이터 업데이트
            if (this.config.learningEnabled) {
                await this.updateLearningData(task, true);
            }

            logger.info(`작업 완료: ${task.id}, 실행시간: ${task.executionTime}ms`);

            // 다음 작업 스케줄링
            await this.scheduleNextTasks();

        } catch (error) {
            logger.error('작업 성공 처리 실패:', error);
        }
    }

    /**
     * 작업 실패 처리
     */
    async handleTaskFailure(task, error) {
        try {
            // 실행 중 목록에서 제거
            this.runningTasks.delete(task.id);

            // 재시도 가능한지 확인
            if (task.retryCount < this.config.retryAttempts) {
                task.retryCount++;
                task.status = 'pending';
                task.lastError = error.message;
                
                // 우선순위 조정 (실패한 작업은 우선순위 약간 감소)
                task.priority = Math.max(0, task.priority - 0.1);
                
                // 다시 큐에 추가
                this.taskQueue.push(task);
                this.taskQueue.sort((a, b) => b.priority - a.priority);

                logger.warn(`작업 재시도: ${task.id}, 시도 횟수: ${task.retryCount}`);

            } else {
                // 최종 실패
                task.status = 'failed';
                task.failedAt = new Date();
                task.error = error.message;

                // 실패 목록에 추가
                this.failedTasks.push(task);

                // 메트릭 업데이트
                this.metrics.failedTasks++;

                logger.error(`작업 최종 실패: ${task.id}, 오류: ${error.message}`);
            }

            // 학습 데이터 업데이트
            if (this.config.learningEnabled) {
                await this.updateLearningData(task, false);
            }

            // 다음 작업 스케줄링
            await this.scheduleNextTasks();

        } catch (processingError) {
            logger.error('작업 실패 처리 실패:', processingError);
        }
    }

    /**
     * 스케줄링 최적화
     */
    async optimizeScheduling() {
        try {
            logger.debug('스케줄링 최적화 시작');

            // 성능 분석
            const performance = await this.analyzePerformance();
            
            // 병목 지점 식별
            const bottlenecks = await this.identifyBottlenecks();
            
            // 최적화 제안 생성
            const optimizations = await this.generateOptimizations(performance, bottlenecks);
            
            // 최적화 적용
            await this.applyOptimizations(optimizations);

            logger.debug('스케줄링 최적화 완료');

        } catch (error) {
            logger.error('스케줄링 최적화 실패:', error);
        }
    }

    /**
     * 성능 모니터링 시작
     */
    startPerformanceMonitoring() {
        setInterval(() => {
            this.updateMetrics();
        }, 10000); // 10초마다 메트릭 업데이트
    }

    /**
     * 메트릭 업데이트
     */
    updateMetrics() {
        const now = new Date();
        const oneHourAgo = new Date(now - 3600000);

        // 최근 1시간 완료 작업
        const recentCompleted = this.completedTasks.filter(
            task => task.completedAt > oneHourAgo
        );

        // 처리량 계산 (작업/시간)
        this.metrics.throughput = recentCompleted.length;

        // 평균 처리 시간 계산
        if (recentCompleted.length > 0) {
            this.metrics.averageProcessingTime = 
                recentCompleted.reduce((sum, task) => sum + task.executionTime, 0) / 
                recentCompleted.length;
        }

        // 성공률 계산
        const totalRecent = recentCompleted.length + 
            this.failedTasks.filter(task => task.failedAt > oneHourAgo).length;
        
        if (totalRecent > 0) {
            this.metrics.successRate = (recentCompleted.length / totalRecent) * 100;
        }

        // 리소스 사용률 계산
        this.metrics.resourceUtilization = 
            (this.runningTasks.size / this.config.maxConcurrentTasks) * 100;

        // 성능 모니터링에 메트릭 전송
        performanceMonitor.recordMetrics('intelligent_scheduler', this.metrics);
    }

    /**
     * 작업 상태 조회
     */
    getTaskStatus(taskId) {
        // 실행 중 작업 확인
        if (this.runningTasks.has(taskId)) {
            return this.runningTasks.get(taskId);
        }

        // 대기 중 작업 확인
        const queuedTask = this.taskQueue.find(task => task.id === taskId);
        if (queuedTask) {
            return queuedTask;
        }

        // 완료된 작업 확인
        const completedTask = this.completedTasks.find(task => task.id === taskId);
        if (completedTask) {
            return completedTask;
        }

        // 실패한 작업 확인
        const failedTask = this.failedTasks.find(task => task.id === taskId);
        if (failedTask) {
            return failedTask;
        }

        return null;
    }

    /**
     * 시스템 상태 조회
     */
    getSystemStatus() {
        return {
            queue: {
                pending: this.taskQueue.length,
                running: this.runningTasks.size,
                completed: this.completedTasks.length,
                failed: this.failedTasks.length
            },
            metrics: this.metrics,
            config: this.config,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        };
    }

    // 헬퍼 메서드들
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    calculateUrgency(deadline) {
        const now = new Date();
        const timeToDeadline = new Date(deadline) - now;
        const maxUrgency = 24 * 60 * 60 * 1000; // 24시간
        
        return Math.max(0, Math.min(1, 1 - (timeToDeadline / maxUrgency)));
    }

    async analyzeComplexity(description) {
        // 실제 구현에서는 NLP 모델 사용
        const keywords = ['complex', 'difficult', 'advanced', 'integration', 'analysis'];
        const complexity = keywords.reduce((score, keyword) => {
            return score + (description.toLowerCase().includes(keyword) ? 0.2 : 0);
        }, 0.3);
        
        return Math.min(1, complexity);
    }

    analyzeDependencies(dependencies) {
        return Math.min(1, dependencies.length * 0.1);
    }

    async checkResourceAvailability() {
        // 시스템 리소스 확인 (CPU, 메모리 등)
        const usage = process.memoryUsage();
        const memoryUsage = usage.heapUsed / usage.heapTotal;
        
        return Math.max(0, 1 - memoryUsage);
    }

    calculateBusinessImpact(category) {
        const impacts = {
            'critical': 1.0,
            'security': 0.9,
            'user_facing': 0.8,
            'performance': 0.7,
            'maintenance': 0.5,
            'general': 0.4
        };
        
        return impacts[category] || impacts['general'];
    }

    normalizeUserPriority(priority) {
        const priorities = {
            'critical': 1.0,
            'high': 0.8,
            'medium': 0.5,
            'low': 0.2
        };
        
        return priorities[priority] || priorities['medium'];
    }
}

// AI 모델 시뮬레이션 클래스
class TaskPriorityAI {
    async predict(factors) {
        // 실제 구현에서는 훈련된 ML 모델 사용
        // 여기서는 가중 평균으로 시뮬레이션
        const weights = {
            urgency: 0.25,
            complexity: 0.15,
            dependencies: 0.1,
            resourceAvailability: 0.2,
            historicalPerformance: 0.1,
            businessImpact: 0.15,
            userPriority: 0.05
        };

        let priority = 0;
        for (const [factor, value] of Object.entries(factors)) {
            priority += (weights[factor] || 0) * value;
        }

        return Math.max(0, Math.min(1, priority));
    }
}

// 예측 분석 클래스
class PredictiveAnalytics {
    async predictWorkload(timeframe) {
        // 실제 구현에서는 시계열 예측 모델 사용
        return {
            expectedTasks: Math.floor(Math.random() * 50) + 10,
            peakHours: ['09:00', '14:00', '16:00'],
            resourceRequirements: {
                cpu: Math.random() * 0.8 + 0.2,
                memory: Math.random() * 0.7 + 0.3,
                network: Math.random() * 0.6 + 0.4
            }
        };
    }
}

module.exports = IntelligentTaskScheduler;
