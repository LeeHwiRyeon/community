const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const advancedAgentService = require('../services/advancedAgentService');

// 에이전트 상태 조회
router.get('/status', async (req, res) => {
    try {
        const { agentId } = req.query;
        const result = await advancedAgentService.getAgentStatus(agentId);

        res.json(result);
    } catch (error) {
        logger.error('Get agent status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 에이전트 작업 할당
router.post('/assign-task', async (req, res) => {
    try {
        const { agentId, task } = req.body;

        if (!agentId || !task) {
            return res.status(400).json({
                success: false,
                message: 'Agent ID and task data are required'
            });
        }

        const result = await advancedAgentService.assignTask(agentId, task);

        res.json(result);
    } catch (error) {
        logger.error('Assign task error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 에이전트 작업 실행
router.post('/execute-task', async (req, res) => {
    try {
        const { agentId, taskId } = req.body;

        if (!agentId || !taskId) {
            return res.status(400).json({
                success: false,
                message: 'Agent ID and task ID are required'
            });
        }

        const result = await advancedAgentService.executeTask(agentId, taskId);

        res.json(result);
    } catch (error) {
        logger.error('Execute task error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 에이전트 협업 설정
router.post('/collaboration', async (req, res) => {
    try {
        const { agentId1, agentId2, collaborationType } = req.body;

        if (!agentId1 || !agentId2 || !collaborationType) {
            return res.status(400).json({
                success: false,
                message: 'Agent IDs and collaboration type are required'
            });
        }

        const result = await advancedAgentService.setupAgentCollaboration(
            agentId1,
            agentId2,
            collaborationType
        );

        res.json(result);
    } catch (error) {
        logger.error('Setup collaboration error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 지능형 작업 스케줄링
router.post('/schedule-intelligent', async (req, res) => {
    try {
        const result = await advancedAgentService.scheduleIntelligentTasks();

        res.json(result);
    } catch (error) {
        logger.error('Intelligent scheduling error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 에이전트 메트릭 수집
router.get('/metrics', async (req, res) => {
    try {
        const result = await advancedAgentService.collectAgentMetrics();

        res.json(result);
    } catch (error) {
        logger.error('Collect metrics error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 에이전트 상태 변경
router.put('/status', async (req, res) => {
    try {
        const { agentId, status } = req.body;

        if (!agentId || !status) {
            return res.status(400).json({
                success: false,
                message: 'Agent ID and status are required'
            });
        }

        const result = await advancedAgentService.updateAgentStatus(agentId, status);

        res.json(result);
    } catch (error) {
        logger.error('Update agent status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 에이전트 작업 정리
router.post('/cleanup', async (req, res) => {
    try {
        const { agentId, olderThanHours = 24 } = req.body;

        if (!agentId) {
            return res.status(400).json({
                success: false,
                message: 'Agent ID is required'
            });
        }

        const result = await advancedAgentService.cleanupCompletedTasks(agentId, olderThanHours);

        res.json(result);
    } catch (error) {
        logger.error('Cleanup tasks error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 에이전트 성능 분석
router.get('/performance/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const result = await advancedAgentService.getAgentStatus(agentId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        const performance = result.data.performance;
        const tasks = result.data.tasks;

        // 성능 분석 데이터 생성
        const analysis = {
            agentId: agentId,
            performance: performance,
            taskStats: {
                total: tasks.length,
                completed: tasks.filter(t => t.status === 'completed').length,
                running: tasks.filter(t => t.status === 'running').length,
                failed: tasks.filter(t => t.status === 'failed').length,
                pending: tasks.filter(t => t.status === 'assigned').length
            },
            trends: {
                successRate: performance.successRate,
                averageExecutionTime: performance.averageExecutionTime,
                totalTasksCompleted: performance.totalTasksCompleted
            },
            recommendations: generatePerformanceRecommendations(performance, tasks)
        };

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        logger.error('Get performance analysis error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 성능 권장사항 생성
function generatePerformanceRecommendations(performance, tasks) {
    const recommendations = [];

    if (performance.successRate < 0.9) {
        recommendations.push({
            type: 'warning',
            message: '성공률이 낮습니다. 에이전트 설정을 검토하세요.',
            priority: 'high'
        });
    }

    if (performance.averageExecutionTime > 300) {
        recommendations.push({
            type: 'info',
            message: '평균 실행 시간이 길어 최적화가 필요할 수 있습니다.',
            priority: 'medium'
        });
    }

    const recentTasks = tasks.slice(-10);
    const recentSuccessRate = recentTasks.filter(t => t.status === 'completed' && t.result?.success).length / recentTasks.length;

    if (recentSuccessRate < 0.8) {
        recommendations.push({
            type: 'error',
            message: '최근 작업 성공률이 크게 떨어졌습니다. 즉시 조치가 필요합니다.',
            priority: 'critical'
        });
    }

    if (tasks.length === 0) {
        recommendations.push({
            type: 'info',
            message: '할당된 작업이 없습니다. 새로운 작업을 할당하세요.',
            priority: 'low'
        });
    }

    return recommendations;
}

// 에이전트 작업 히스토리
router.get('/history/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const { limit = 50, status, startDate, endDate } = req.query;

        const result = await advancedAgentService.getAgentStatus(agentId);
        if (!result.success) {
            return res.status(404).json(result);
        }

        let tasks = result.data.tasks;

        // 필터링
        if (status) {
            tasks = tasks.filter(t => t.status === status);
        }
        if (startDate) {
            tasks = tasks.filter(t => new Date(t.createdAt) >= new Date(startDate));
        }
        if (endDate) {
            tasks = tasks.filter(t => new Date(t.createdAt) <= new Date(endDate));
        }

        // 정렬 및 제한
        tasks = tasks
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            data: {
                agentId: agentId,
                tasks: tasks,
                total: tasks.length
            }
        });
    } catch (error) {
        logger.error('Get task history error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 에이전트 간 통신
router.post('/communication', async (req, res) => {
    try {
        const { fromAgentId, toAgentId, message, messageType = 'info' } = req.body;

        if (!fromAgentId || !toAgentId || !message) {
            return res.status(400).json({
                success: false,
                message: 'From agent ID, to agent ID, and message are required'
            });
        }

        // 통신 로그 생성
        const communication = {
            id: 'comm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            fromAgentId: fromAgentId,
            toAgentId: toAgentId,
            message: message,
            messageType: messageType,
            timestamp: new Date().toISOString(),
            status: 'sent'
        };

        // 실제로는 메시지 큐나 이벤트 시스템을 사용
        logger.info(`Agent communication: ${fromAgentId} -> ${toAgentId}: ${message}`);

        res.json({
            success: true,
            data: communication
        });
    } catch (error) {
        logger.error('Agent communication error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 에이전트 리소스 모니터링
router.get('/resources', async (req, res) => {
    try {
        const result = await advancedAgentService.collectAgentMetrics();

        if (!result.success) {
            return res.status(500).json(result);
        }

        const metrics = result.data;

        // 리소스 사용량 시뮬레이션
        const resourceUsage = Array.from(advancedAgentService.agents.keys()).map(agentId => ({
            agentId: agentId,
            cpuUsage: Math.random() * 100,
            memoryUsage: Math.random() * 100,
            diskUsage: Math.random() * 100,
            networkUsage: Math.random() * 100,
            timestamp: new Date().toISOString()
        }));

        res.json({
            success: true,
            data: {
                overall: {
                    totalAgents: metrics.totalAgents,
                    activeAgents: metrics.activeAgents,
                    totalTasks: metrics.totalTasks,
                    completedTasks: metrics.completedTasks,
                    failedTasks: metrics.failedTasks
                },
                resourceUsage: resourceUsage,
                performance: metrics.averagePerformance
            }
        });
    } catch (error) {
        logger.error('Get resource usage error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 에이전트 자동 복구
router.post('/auto-recovery', async (req, res) => {
    try {
        const { agentId } = req.body;

        if (!agentId) {
            return res.status(400).json({
                success: false,
                message: 'Agent ID is required'
            });
        }

        // 에이전트 상태 확인
        const result = await advancedAgentService.getAgentStatus(agentId);
        if (!result.success) {
            return res.status(404).json(result);
        }

        const agent = result.data.agent;
        const tasks = result.data.tasks;

        // 복구 로직
        const recoveryActions = [];

        // 실패한 작업 재시도
        const failedTasks = tasks.filter(t => t.status === 'failed');
        for (const task of failedTasks) {
            try {
                await advancedAgentService.executeTask(agentId, task.id);
                recoveryActions.push({
                    action: 'retry_task',
                    taskId: task.id,
                    success: true
                });
            } catch (error) {
                recoveryActions.push({
                    action: 'retry_task',
                    taskId: task.id,
                    success: false,
                    error: error.message
                });
            }
        }

        // 에이전트 상태 재설정
        if (agent.status !== 'active') {
            await advancedAgentService.updateAgentStatus(agentId, 'active');
            recoveryActions.push({
                action: 'reactivate_agent',
                success: true
            });
        }

        res.json({
            success: true,
            data: {
                agentId: agentId,
                recoveryActions: recoveryActions,
                recoveredAt: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Auto recovery error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

