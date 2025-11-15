const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const aiPriorityService = require('../services/aiPriorityService');

// AI 기반 우선순위 계산
router.post('/calculate', async (req, res) => {
    try {
        const { task, agent, systemState } = req.body;

        if (!task || !agent) {
            return res.status(400).json({
                success: false,
                message: 'Task and agent data are required'
            });
        }

        const result = await aiPriorityService.calculateAIPriority(task, agent, systemState);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Calculate AI priority error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 배치 우선순위 계산
router.post('/calculate-batch', async (req, res) => {
    try {
        const { tasks, agents, systemState } = req.body;

        if (!tasks || !agents || !Array.isArray(tasks) || !Array.isArray(agents)) {
            return res.status(400).json({
                success: false,
                message: 'Tasks and agents arrays are required'
            });
        }

        const result = await aiPriorityService.calculateBatchPriorities(tasks, agents, systemState);

        res.json(result);
    } catch (error) {
        logger.error('Calculate batch priorities error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 모델 성능 평가
router.get('/evaluate-performance', async (req, res) => {
    try {
        const result = await aiPriorityService.evaluateModelPerformance();

        res.json(result);
    } catch (error) {
        logger.error('Evaluate model performance error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 모델 재훈련
router.post('/retrain-models', async (req, res) => {
    try {
        const result = await aiPriorityService.retrainModels();

        res.json(result);
    } catch (error) {
        logger.error('Retrain models error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 우선순위 통계 조회
router.get('/stats', (req, res) => {
    try {
        const stats = aiPriorityService.getPriorityStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Get priority stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 우선순위 히스토리 조회
router.get('/history', (req, res) => {
    try {
        const { limit = 100, taskId, agentId } = req.query;

        // 실제로는 데이터베이스에서 조회
        const history = Array.from(aiPriorityService.priorityHistory.values())
            .filter(entry => {
                if (taskId && entry.taskId !== taskId) return false;
                if (agentId && entry.agentId !== agentId) return false;
                return true;
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        logger.error('Get priority history error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 특성 분석
router.post('/analyze-features', (req, res) => {
    try {
        const { task, agent, systemState } = req.body;

        if (!task || !agent) {
            return res.status(400).json({
                success: false,
                message: 'Task and agent data are required'
            });
        }

        // 특성 추출
        const taskFeatures = aiPriorityService.featureExtractors.get('task_features').extract(task);
        const agentFeatures = aiPriorityService.featureExtractors.get('agent_features').extract(agent);
        const systemFeatures = aiPriorityService.featureExtractors.get('system_features').extract(systemState);

        const analysis = {
            taskFeatures: {
                ...taskFeatures,
                analysis: {
                    urgencyLevel: taskFeatures.urgency > 0.7 ? 'high' : taskFeatures.urgency > 0.4 ? 'medium' : 'low',
                    complexityLevel: taskFeatures.complexity > 0.7 ? 'high' : taskFeatures.complexity > 0.4 ? 'medium' : 'low',
                    resourceIntensive: taskFeatures.resource_requirements > 0.7,
                    deadlineCritical: taskFeatures.deadline_pressure > 0.7
                }
            },
            agentFeatures: {
                ...agentFeatures,
                analysis: {
                    performanceLevel: agentFeatures.performance_score > 0.9 ? 'excellent' :
                        agentFeatures.performance_score > 0.7 ? 'good' :
                            agentFeatures.performance_score > 0.5 ? 'average' : 'poor',
                    loadLevel: agentFeatures.current_load > 0.8 ? 'high' :
                        agentFeatures.current_load > 0.5 ? 'medium' : 'low',
                    isAvailable: agentFeatures.availability === 1,
                    specializationLevel: agentFeatures.specialization > 0.8 ? 'expert' :
                        agentFeatures.specialization > 0.6 ? 'skilled' : 'beginner'
                }
            },
            systemFeatures: {
                ...systemFeatures,
                analysis: {
                    systemLoad: (systemFeatures.cpu_usage + systemFeatures.memory_usage) / 2,
                    loadLevel: systemFeatures.cpu_usage > 80 || systemFeatures.memory_usage > 80 ? 'high' :
                        systemFeatures.cpu_usage > 60 || systemFeatures.memory_usage > 60 ? 'medium' : 'low',
                    queuePressure: systemFeatures.queue_length > 50 ? 'high' :
                        systemFeatures.queue_length > 20 ? 'medium' : 'low'
                }
            }
        };

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        logger.error('Analyze features error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 우선순위 시뮬레이션
router.post('/simulate', async (req, res) => {
    try {
        const { scenarios } = req.body;

        if (!scenarios || !Array.isArray(scenarios)) {
            return res.status(400).json({
                success: false,
                message: 'Scenarios array is required'
            });
        }

        const results = [];

        for (const scenario of scenarios) {
            const { task, agents, systemState } = scenario;

            if (!task || !agents || !Array.isArray(agents)) {
                continue;
            }

            const scenarioResults = [];

            for (const agent of agents) {
                try {
                    const priority = await aiPriorityService.calculateAIPriority(task, agent, systemState);
                    scenarioResults.push(priority);
                } catch (error) {
                    logger.error(`Simulation error for agent ${agent.id}:`, error);
                }
            }

            // 최적 에이전트 선택
            const bestMatch = scenarioResults.reduce((best, current) =>
                current.priorityScore > best.priorityScore ? current : best
            );

            results.push({
                scenario: scenario.name || `Scenario ${results.length + 1}`,
                task: task,
                bestAgent: bestMatch,
                allOptions: scenarioResults,
                recommendation: {
                    agentId: bestMatch.agentId,
                    priorityLevel: bestMatch.priorityLevel,
                    confidence: bestMatch.confidence,
                    reasoning: bestMatch.reasoning
                }
            });
        }

        res.json({
            success: true,
            data: {
                scenarios: results,
                summary: {
                    totalScenarios: results.length,
                    averageConfidence: results.reduce((sum, r) => sum + r.bestAgent.confidence, 0) / results.length,
                    priorityDistribution: results.reduce((dist, r) => {
                        dist[r.bestAgent.priorityLevel] = (dist[r.bestAgent.priorityLevel] || 0) + 1;
                        return dist;
                    }, {})
                }
            }
        });
    } catch (error) {
        logger.error('Simulate priorities error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 모델 정보 조회
router.get('/models', (req, res) => {
    try {
        const models = Array.from(aiPriorityService.mlModels.values());

        res.json({
            success: true,
            data: {
                models: models,
                totalModels: models.length,
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Get models error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 특성 추출기 정보 조회
router.get('/feature-extractors', (req, res) => {
    try {
        const extractors = Array.from(aiPriorityService.featureExtractors.keys());

        res.json({
            success: true,
            data: {
                extractors: extractors,
                totalExtractors: extractors.length,
                descriptions: {
                    task_features: '작업 관련 특성 추출 (긴급도, 복잡도, 비즈니스 가치 등)',
                    agent_features: '에이전트 관련 특성 추출 (성능, 부하, 전문성 등)',
                    system_features: '시스템 관련 특성 추출 (리소스 사용량, 큐 상태 등)'
                }
            }
        });
    } catch (error) {
        logger.error('Get feature extractors error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 훈련 데이터 내보내기
router.get('/export-training-data', (req, res) => {
    try {
        const trainingData = aiPriorityService.exportTrainingData();

        res.json({
            success: true,
            data: trainingData
        });
    } catch (error) {
        logger.error('Export training data error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 히스토리 초기화
router.delete('/history', (req, res) => {
    try {
        aiPriorityService.clearHistory();

        res.json({
            success: true,
            message: 'Priority calculation history cleared'
        });
    } catch (error) {
        logger.error('Clear history error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 실시간 우선순위 모니터링
router.get('/monitor', (req, res) => {
    try {
        const stats = aiPriorityService.getPriorityStats();
        const models = Array.from(aiPriorityService.mlModels.values());

        const monitoring = {
            timestamp: new Date().toISOString(),
            stats: stats,
            models: models.map(model => ({
                name: model.name,
                type: model.type,
                accuracy: model.accuracy,
                lastTrained: model.lastTrained,
                status: model.accuracy > 0.8 ? 'healthy' : 'needs_attention'
            })),
            systemHealth: {
                overall: stats.averageConfidence > 0.7 ? 'good' : 'fair',
                modelStatus: models.every(m => m.accuracy > 0.8) ? 'healthy' : 'degraded',
                dataQuality: stats.totalCalculations > 100 ? 'sufficient' : 'insufficient'
            }
        };

        res.json({
            success: true,
            data: monitoring
        });
    } catch (error) {
        logger.error('Monitor priorities error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
