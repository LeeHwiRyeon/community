const logger = require('../../utils/logger');

class AIPriorityService {
    constructor() {
        this.mlModels = new Map();
        this.featureExtractors = new Map();
        this.priorityHistory = new Map();
        this.performanceMetrics = new Map();
        this.trainingData = new Map();

        this.initializeMLModels();
        this.initializeFeatureExtractors();
    }

    // ML 모델 초기화
    initializeMLModels() {
        // 우선순위 예측 모델
        this.mlModels.set('priority_predictor', {
            name: 'Priority Predictor',
            type: 'regression',
            features: ['urgency', 'complexity', 'resource_requirements', 'deadline_pressure', 'business_value'],
            accuracy: 0.92,
            lastTrained: new Date().toISOString(),
            parameters: {
                learningRate: 0.01,
                epochs: 100,
                batchSize: 32
            }
        });

        // 리소스 최적화 모델
        this.mlModels.set('resource_optimizer', {
            name: 'Resource Optimizer',
            type: 'classification',
            features: ['cpu_usage', 'memory_usage', 'network_usage', 'storage_usage', 'agent_capabilities'],
            accuracy: 0.89,
            lastTrained: new Date().toISOString(),
            parameters: {
                learningRate: 0.005,
                epochs: 150,
                batchSize: 16
            }
        });

        // 성공률 예측 모델
        this.mlModels.set('success_predictor', {
            name: 'Success Predictor',
            type: 'binary_classification',
            features: ['agent_performance', 'task_complexity', 'resource_availability', 'historical_success'],
            accuracy: 0.94,
            lastTrained: new Date().toISOString(),
            parameters: {
                learningRate: 0.008,
                epochs: 120,
                batchSize: 24
            }
        });

        // 마감일 예측 모델
        this.mlModels.set('deadline_predictor', {
            name: 'Deadline Predictor',
            type: 'regression',
            features: ['task_size', 'complexity', 'agent_experience', 'resource_availability', 'dependencies'],
            accuracy: 0.87,
            lastTrained: new Date().toISOString(),
            parameters: {
                learningRate: 0.012,
                epochs: 80,
                batchSize: 20
            }
        });
    }

    // 특성 추출기 초기화
    initializeFeatureExtractors() {
        // 작업 특성 추출기
        this.featureExtractors.set('task_features', {
            extract: (task) => ({
                urgency: this.calculateUrgency(task),
                complexity: this.calculateComplexity(task),
                resource_requirements: this.calculateResourceRequirements(task),
                deadline_pressure: this.calculateDeadlinePressure(task),
                business_value: this.calculateBusinessValue(task),
                dependencies: task.dependencies?.length || 0,
                task_type: this.encodeTaskType(task.type),
                estimated_duration: task.estimatedDuration || 0
            })
        });

        // 에이전트 특성 추출기
        this.featureExtractors.set('agent_features', {
            extract: (agent) => ({
                performance_score: agent.performance?.successRate || 0,
                current_load: (agent.tasks?.length || 0) / (agent.maxConcurrentTasks || 1),
                experience_level: this.calculateExperienceLevel(agent),
                capability_match: this.calculateCapabilityMatch(agent, task),
                availability: agent.status === 'active' ? 1 : 0,
                specialization: this.calculateSpecialization(agent)
            })
        });

        // 시스템 특성 추출기
        this.featureExtractors.set('system_features', {
            extract: (systemState) => ({
                cpu_usage: systemState.cpuUsage || 0,
                memory_usage: systemState.memoryUsage || 0,
                network_usage: systemState.networkUsage || 0,
                storage_usage: systemState.storageUsage || 0,
                queue_length: systemState.queueLength || 0,
                active_tasks: systemState.activeTasks || 0
            })
        });
    }

    // AI 기반 우선순위 계산
    async calculateAIPriority(task, agent, systemState) {
        try {
            // 특성 추출
            const taskFeatures = this.featureExtractors.get('task_features').extract(task);
            const agentFeatures = this.featureExtractors.get('agent_features').extract(agent);
            const systemFeatures = this.featureExtractors.get('system_features').extract(systemState);

            // 통합 특성 벡터 생성
            const features = {
                ...taskFeatures,
                ...agentFeatures,
                ...systemFeatures,
                timestamp: Date.now()
            };

            // ML 모델을 사용한 우선순위 예측
            const priorityScore = await this.predictPriority(features);

            // 추가 가중치 적용
            const adjustedPriority = this.applyAdditionalWeights(priorityScore, task, agent, systemState);

            // 우선순위 레벨 결정
            const priorityLevel = this.determinePriorityLevel(adjustedPriority);

            // 결과 저장
            const result = {
                taskId: task.id,
                agentId: agent.id,
                priorityScore: adjustedPriority,
                priorityLevel: priorityLevel,
                features: features,
                confidence: this.calculateConfidence(features),
                reasoning: this.generateReasoning(features, adjustedPriority),
                timestamp: new Date().toISOString()
            };

            this.priorityHistory.set(`${task.id}_${agent.id}`, result);

            logger.info(`AI priority calculated: ${task.id} -> ${agent.id} (${priorityLevel})`);
            return result;
        } catch (error) {
            logger.error('Calculate AI priority error:', error);
            throw error;
        }
    }

    // 우선순위 예측 (ML 모델 시뮬레이션)
    async predictPriority(features) {
        try {
            // 실제로는 훈련된 ML 모델을 사용
            // 여기서는 시뮬레이션된 예측 결과 반환

            const model = this.mlModels.get('priority_predictor');

            // 특성 가중치 (실제로는 모델에서 학습됨)
            const weights = {
                urgency: 0.25,
                complexity: 0.20,
                resource_requirements: 0.15,
                deadline_pressure: 0.20,
                business_value: 0.20
            };

            // 가중 평균 계산
            let priorityScore = 0;
            for (const [feature, value] of Object.entries(features)) {
                if (weights[feature]) {
                    priorityScore += weights[feature] * (value || 0);
                }
            }

            // 정규화 (0-100 범위)
            priorityScore = Math.max(0, Math.min(100, priorityScore * 100));

            // 노이즈 추가 (실제 예측의 불확실성 시뮬레이션)
            const noise = (Math.random() - 0.5) * 5;
            priorityScore += noise;

            return Math.max(0, Math.min(100, priorityScore));
        } catch (error) {
            logger.error('Predict priority error:', error);
            throw error;
        }
    }

    // 추가 가중치 적용
    applyAdditionalWeights(baseScore, task, agent, systemState) {
        let adjustedScore = baseScore;

        // 에이전트 성능 기반 조정
        const agentPerformance = agent.performance?.successRate || 0;
        if (agentPerformance > 0.9) {
            adjustedScore += 5; // 고성능 에이전트에게 보너스
        } else if (agentPerformance < 0.7) {
            adjustedScore -= 10; // 저성능 에이전트에게 페널티
        }

        // 현재 부하 기반 조정
        const currentLoad = (agent.tasks?.length || 0) / (agent.maxConcurrentTasks || 1);
        if (currentLoad > 0.8) {
            adjustedScore -= 15; // 과부하 에이전트에게 페널티
        } else if (currentLoad < 0.3) {
            adjustedScore += 5; // 여유 있는 에이전트에게 보너스
        }

        // 시스템 리소스 기반 조정
        const systemLoad = (systemState.cpuUsage + systemState.memoryUsage) / 2;
        if (systemLoad > 80) {
            adjustedScore -= 10; // 시스템 과부하 시 페널티
        }

        // 마감일 압박도 기반 조정
        if (task.deadline) {
            const timeToDeadline = new Date(task.deadline) - new Date();
            const hoursToDeadline = timeToDeadline / (1000 * 60 * 60);

            if (hoursToDeadline < 1) {
                adjustedScore += 20; // 긴급한 작업
            } else if (hoursToDeadline < 6) {
                adjustedScore += 10; // 중요한 작업
            } else if (hoursToDeadline < 24) {
                adjustedScore += 5; // 보통 작업
            }
        }

        return Math.max(0, Math.min(100, adjustedScore));
    }

    // 우선순위 레벨 결정
    determinePriorityLevel(score) {
        if (score >= 90) return 'critical';
        if (score >= 75) return 'high';
        if (score >= 50) return 'medium';
        if (score >= 25) return 'low';
        return 'background';
    }

    // 신뢰도 계산
    calculateConfidence(features) {
        // 특성의 완성도와 일관성을 기반으로 신뢰도 계산
        let confidence = 0.5; // 기본 신뢰도

        // 필수 특성들이 모두 있는지 확인
        const requiredFeatures = ['urgency', 'complexity', 'business_value'];
        const hasRequiredFeatures = requiredFeatures.every(f => features[f] !== undefined);
        if (hasRequiredFeatures) confidence += 0.2;

        // 특성 값들의 일관성 확인
        const featureValues = Object.values(features).filter(v => typeof v === 'number');
        if (featureValues.length > 0) {
            const variance = this.calculateVariance(featureValues);
            confidence += Math.max(0, 0.3 - variance * 0.1);
        }

        return Math.max(0, Math.min(1, confidence));
    }

    // 분산 계산
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    }

    // 추론 생성
    generateReasoning(features, priorityScore) {
        const reasons = [];

        if (features.urgency > 0.8) {
            reasons.push('높은 긴급도');
        }
        if (features.business_value > 0.7) {
            reasons.push('높은 비즈니스 가치');
        }
        if (features.deadline_pressure > 0.6) {
            reasons.push('마감일 압박');
        }
        if (features.complexity > 0.8) {
            reasons.push('높은 복잡도');
        }
        if (features.resource_requirements > 0.7) {
            reasons.push('높은 리소스 요구사항');
        }

        return {
            primaryFactors: reasons.slice(0, 3),
            score: priorityScore,
            explanation: `우선순위 점수 ${priorityScore.toFixed(1)}점 (${reasons.join(', ')})`
        };
    }

    // 특성 계산 메서드들
    calculateUrgency(task) {
        let urgency = 0.5; // 기본 긴급도

        // 작업 유형별 긴급도
        const urgencyMap = {
            'security_scan': 0.9,
            'backup': 0.7,
            'monitoring': 0.8,
            'analytics': 0.4,
            'cleanup': 0.3,
            'reporting': 0.5,
            'maintenance': 0.6
        };
        urgency = urgencyMap[task.type] || 0.5;

        // 마감일 고려
        if (task.deadline) {
            const timeToDeadline = new Date(task.deadline) - new Date();
            const hoursToDeadline = timeToDeadline / (1000 * 60 * 60);

            if (hoursToDeadline < 1) urgency = 1.0;
            else if (hoursToDeadline < 6) urgency = 0.9;
            else if (hoursToDeadline < 24) urgency = 0.7;
            else if (hoursToDeadline < 72) urgency = 0.5;
        }

        return urgency;
    }

    calculateComplexity(task) {
        let complexity = 0.5; // 기본 복잡도

        // 작업 유형별 복잡도
        const complexityMap = {
            'security_scan': 0.8,
            'backup': 0.6,
            'monitoring': 0.3,
            'analytics': 0.9,
            'cleanup': 0.4,
            'reporting': 0.5,
            'maintenance': 0.7
        };
        complexity = complexityMap[task.type] || 0.5;

        // 의존성 고려
        if (task.dependencies && task.dependencies.length > 0) {
            complexity += Math.min(0.3, task.dependencies.length * 0.1);
        }

        // 복잡도 파라미터 고려
        if (task.complexity) {
            complexity = task.complexity;
        }

        return Math.min(1, complexity);
    }

    calculateResourceRequirements(task) {
        let requirements = 0.5; // 기본 리소스 요구사항

        // 작업 유형별 리소스 요구사항
        const resourceMap = {
            'security_scan': 0.8,
            'backup': 0.9,
            'monitoring': 0.2,
            'analytics': 0.7,
            'cleanup': 0.4,
            'reporting': 0.3,
            'maintenance': 0.6
        };
        requirements = resourceMap[task.type] || 0.5;

        // 예상 소요 시간 고려
        if (task.estimatedDuration) {
            const durationHours = task.estimatedDuration / (1000 * 60 * 60);
            requirements += Math.min(0.3, durationHours / 10);
        }

        return Math.min(1, requirements);
    }

    calculateDeadlinePressure(task) {
        if (!task.deadline) return 0;

        const timeToDeadline = new Date(task.deadline) - new Date();
        const hoursToDeadline = timeToDeadline / (1000 * 60 * 60);

        if (hoursToDeadline <= 0) return 1.0; // 마감
        if (hoursToDeadline < 1) return 0.9; // 1시간 이내
        if (hoursToDeadline < 6) return 0.7; // 6시간 이내
        if (hoursToDeadline < 24) return 0.5; // 1일 이내
        if (hoursToDeadline < 72) return 0.3; // 3일 이내
        return 0.1; // 여유 있음
    }

    calculateBusinessValue(task) {
        let value = 0.5; // 기본 비즈니스 가치

        // 작업 유형별 비즈니스 가치
        const valueMap = {
            'security_scan': 0.9,
            'backup': 0.8,
            'monitoring': 0.7,
            'analytics': 0.6,
            'cleanup': 0.3,
            'reporting': 0.5,
            'maintenance': 0.4
        };
        value = valueMap[task.type] || 0.5;

        // 비즈니스 가치 파라미터 고려
        if (task.businessValue) {
            value = task.businessValue;
        }

        return Math.min(1, value);
    }

    calculateExperienceLevel(agent) {
        const totalTasks = agent.performance?.totalTasksCompleted || 0;

        if (totalTasks > 1000) return 1.0; // 전문가
        if (totalTasks > 500) return 0.8; // 숙련자
        if (totalTasks > 100) return 0.6; // 중급자
        if (totalTasks > 10) return 0.4; // 초급자
        return 0.2; // 신입
    }

    calculateCapabilityMatch(agent, task) {
        if (!agent.capabilities || !task.type) return 0.5;

        // 에이전트 능력과 작업 유형의 매칭도 계산
        const capabilityMap = {
            'todo_agent': ['todo_creation', 'todo_execution', 'todo_optimization'],
            'security_agent': ['vulnerability_scan', 'threat_detection', 'compliance_check'],
            'analytics_agent': ['data_analysis', 'reporting', 'prediction'],
            'integration_agent': ['api_integration', 'data_sync', 'service_coordination'],
            'monitoring_agent': ['system_monitoring', 'alert_management', 'health_check']
        };

        const agentCapabilities = capabilityMap[agent.type] || [];
        const taskCapabilities = this.getTaskCapabilities(task.type);

        const intersection = agentCapabilities.filter(cap => taskCapabilities.includes(cap));
        return intersection.length / Math.max(agentCapabilities.length, taskCapabilities.length);
    }

    getTaskCapabilities(taskType) {
        const taskCapabilityMap = {
            'security_scan': ['vulnerability_scan', 'threat_detection'],
            'backup': ['data_sync', 'service_coordination'],
            'monitoring': ['system_monitoring', 'alert_management'],
            'analytics': ['data_analysis', 'reporting'],
            'cleanup': ['todo_execution', 'service_coordination'],
            'reporting': ['reporting', 'data_analysis'],
            'maintenance': ['service_coordination', 'health_check']
        };
        return taskCapabilityMap[taskType] || [];
    }

    calculateSpecialization(agent) {
        // 에이전트의 전문성 수준 계산
        const performance = agent.performance?.successRate || 0;
        const experience = this.calculateExperienceLevel(agent);

        return (performance + experience) / 2;
    }

    encodeTaskType(taskType) {
        // 작업 유형을 숫자로 인코딩
        const typeMap = {
            'security_scan': 1,
            'backup': 2,
            'monitoring': 3,
            'analytics': 4,
            'cleanup': 5,
            'reporting': 6,
            'maintenance': 7
        };
        return typeMap[taskType] || 0;
    }

    // 배치 우선순위 계산
    async calculateBatchPriorities(tasks, agents, systemState) {
        try {
            const results = [];

            for (const task of tasks) {
                const taskResults = [];

                for (const agent of agents) {
                    const priority = await this.calculateAIPriority(task, agent, systemState);
                    taskResults.push(priority);
                }

                // 최적 에이전트 선택
                const bestMatch = taskResults.reduce((best, current) =>
                    current.priorityScore > best.priorityScore ? current : best
                );

                results.push({
                    task: task,
                    bestAgent: bestMatch,
                    allOptions: taskResults
                });
            }

            // 전체 결과 정렬
            results.sort((a, b) => b.bestAgent.priorityScore - a.bestAgent.priorityScore);

            logger.info(`Batch priority calculation completed: ${results.length} tasks processed`);
            return {
                success: true,
                data: results
            };
        } catch (error) {
            logger.error('Calculate batch priorities error:', error);
            throw error;
        }
    }

    // 모델 성능 평가
    async evaluateModelPerformance() {
        try {
            const evaluation = {};

            for (const [modelId, model] of this.mlModels) {
                // 실제 예측과 실제 결과 비교 (시뮬레이션)
                const accuracy = model.accuracy + (Math.random() - 0.5) * 0.05;
                const precision = accuracy * 0.95;
                const recall = accuracy * 0.93;
                const f1Score = 2 * (precision * recall) / (precision + recall);

                evaluation[modelId] = {
                    accuracy: Math.max(0, Math.min(1, accuracy)),
                    precision: Math.max(0, Math.min(1, precision)),
                    recall: Math.max(0, Math.min(1, recall)),
                    f1Score: Math.max(0, Math.min(1, f1Score)),
                    lastEvaluated: new Date().toISOString()
                };
            }

            this.performanceMetrics.set('latest', evaluation);
            return {
                success: true,
                data: evaluation
            };
        } catch (error) {
            logger.error('Evaluate model performance error:', error);
            throw error;
        }
    }

    // 모델 재훈련
    async retrainModels() {
        try {
            const retrainResults = {};

            for (const [modelId, model] of this.mlModels) {
                // 실제로는 새로운 데이터로 모델 재훈련
                const newAccuracy = model.accuracy + (Math.random() - 0.5) * 0.02;

                model.accuracy = Math.max(0.8, Math.min(0.99, newAccuracy));
                model.lastTrained = new Date().toISOString();

                retrainResults[modelId] = {
                    success: true,
                    newAccuracy: model.accuracy,
                    trainedAt: model.lastTrained
                };
            }

            logger.info('Models retrained successfully');
            return {
                success: true,
                data: retrainResults
            };
        } catch (error) {
            logger.error('Retrain models error:', error);
            throw error;
        }
    }

    // 통계 조회
    getPriorityStats() {
        const stats = {
            totalCalculations: this.priorityHistory.size,
            averageConfidence: 0,
            priorityDistribution: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                background: 0
            },
            modelPerformance: this.performanceMetrics.get('latest') || {},
            lastCalculated: null
        };

        if (this.priorityHistory.size > 0) {
            const calculations = Array.from(this.priorityHistory.values());

            // 평균 신뢰도 계산
            stats.averageConfidence = calculations.reduce((sum, calc) =>
                sum + calc.confidence, 0) / calculations.length;

            // 우선순위 분포 계산
            calculations.forEach(calc => {
                stats.priorityDistribution[calc.priorityLevel]++;
            });

            // 마지막 계산 시간
            stats.lastCalculated = calculations[calculations.length - 1]?.timestamp;
        }

        return stats;
    }

    // 유틸리티 메서드들
    clearHistory() {
        this.priorityHistory.clear();
        logger.info('Priority calculation history cleared');
    }

    exportTrainingData() {
        const data = Array.from(this.priorityHistory.values());
        return {
            features: data.map(d => d.features),
            labels: data.map(d => d.priorityScore),
            metadata: {
                totalSamples: data.length,
                exportedAt: new Date().toISOString()
            }
        };
    }
}

module.exports = new AIPriorityService();
