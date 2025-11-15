const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const abTestService = require('../services/abTestService');

// 실험 생성
router.post('/experiments', async (req, res) => {
    try {
        const experimentData = req.body;

        if (!experimentData.name || !experimentData.description || !experimentData.hypothesis) {
            return res.status(400).json({
                success: false,
                message: '실험명, 설명, 가설은 필수입니다.'
            });
        }

        const result = await abTestService.createExperiment(experimentData);

        res.status(201).json(result);
    } catch (error) {
        logger.error('Create experiment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 실험 목록 조회
router.get('/experiments', (req, res) => {
    try {
        const { status, createdBy } = req.query;
        const filters = { status, createdBy };

        const experiments = abTestService.getExperiments(filters);

        res.json({
            success: true,
            data: experiments
        });
    } catch (error) {
        logger.error('Get experiments error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 실험 상세 조회
router.get('/experiments/:experimentId', (req, res) => {
    try {
        const { experimentId } = req.params;
        const experiment = abTestService.getExperiment(experimentId);

        if (!experiment) {
            return res.status(404).json({
                success: false,
                message: '실험을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: experiment
        });
    } catch (error) {
        logger.error('Get experiment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 실험 시작
router.post('/experiments/:experimentId/start', async (req, res) => {
    try {
        const { experimentId } = req.params;
        const result = await abTestService.startExperiment(experimentId);

        res.json(result);
    } catch (error) {
        logger.error('Start experiment error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 실험 중지
router.post('/experiments/:experimentId/stop', async (req, res) => {
    try {
        const { experimentId } = req.params;
        const result = await abTestService.stopExperiment(experimentId);

        res.json(result);
    } catch (error) {
        logger.error('Stop experiment error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 사용자 할당
router.post('/experiments/:experimentId/allocate', async (req, res) => {
    try {
        const { experimentId } = req.params;
        const { userId, userAttributes = {} } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID가 필요합니다.'
            });
        }

        const result = await abTestService.allocateUser(experimentId, userId, userAttributes);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Allocate user error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 이벤트 기록
router.post('/experiments/:experimentId/events', async (req, res) => {
    try {
        const { experimentId } = req.params;
        const { userId, eventType, eventData = {} } = req.body;

        if (!userId || !eventType) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID와 이벤트 타입이 필요합니다.'
            });
        }

        const result = await abTestService.recordEvent(experimentId, userId, eventType, eventData);

        res.json(result);
    } catch (error) {
        logger.error('Record event error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 실험 결과 계산
router.post('/experiments/:experimentId/results', async (req, res) => {
    try {
        const { experimentId } = req.params;
        const result = await abTestService.calculateResults(experimentId);

        res.json(result);
    } catch (error) {
        logger.error('Calculate results error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 실험 결과 조회
router.get('/experiments/:experimentId/results', (req, res) => {
    try {
        const { experimentId } = req.params;
        const results = abTestService.getExperimentResults(experimentId);

        if (!results) {
            return res.status(404).json({
                success: false,
                message: '실험 결과를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        logger.error('Get experiment results error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 세그먼트 목록 조회
router.get('/segments', (req, res) => {
    try {
        const segments = abTestService.getSegments();

        res.json({
            success: true,
            data: segments
        });
    } catch (error) {
        logger.error('Get segments error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 목표 목록 조회
router.get('/goals', (req, res) => {
    try {
        const goals = abTestService.getGoals();

        res.json({
            success: true,
            data: goals
        });
    } catch (error) {
        logger.error('Get goals error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 실험 통계 조회
router.get('/stats', (req, res) => {
    try {
        const stats = abTestService.getExperimentStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Get experiment stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 실험 대시보드 데이터
router.get('/dashboard', (req, res) => {
    try {
        const experiments = abTestService.getExperiments();
        const stats = abTestService.getExperimentStats();
        const segments = abTestService.getSegments();
        const goals = abTestService.getGoals();

        // 최근 실험들
        const recentExperiments = experiments.slice(0, 5);

        // 실행 중인 실험들
        const runningExperiments = experiments.filter(e => e.status === 'running');

        // 완료된 실험들
        const completedExperiments = experiments.filter(e => e.status === 'stopped');

        const dashboard = {
            stats,
            recentExperiments,
            runningExperiments,
            completedExperiments,
            segments,
            goals
        };

        res.json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        logger.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 실험 복제
router.post('/experiments/:experimentId/clone', async (req, res) => {
    try {
        const { experimentId } = req.params;
        const { name, description } = req.body;

        const originalExperiment = abTestService.getExperiment(experimentId);
        if (!originalExperiment) {
            return res.status(404).json({
                success: false,
                message: '원본 실험을 찾을 수 없습니다.'
            });
        }

        const clonedData = {
            name: name || `${originalExperiment.name} (복사본)`,
            description: description || originalExperiment.description,
            hypothesis: originalExperiment.hypothesis,
            primaryGoal: originalExperiment.primaryGoal,
            secondaryGoals: originalExperiment.secondaryGoals,
            segments: originalExperiment.segments,
            trafficAllocation: originalExperiment.trafficAllocation,
            minSampleSize: originalExperiment.minSampleSize,
            maxDuration: originalExperiment.maxDuration,
            variants: originalExperiment.variants.map(variantId => {
                const variant = abTestService.variants.get(`${experimentId}_${variantId}`);
                return {
                    id: variant.id,
                    name: variant.name,
                    description: variant.description,
                    weight: variant.weight,
                    configuration: variant.configuration
                };
            })
        };

        const result = await abTestService.createExperiment(clonedData);

        res.json(result);
    } catch (error) {
        logger.error('Clone experiment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 실험 삭제
router.delete('/experiments/:experimentId', (req, res) => {
    try {
        const { experimentId } = req.params;
        const experiment = abTestService.getExperiment(experimentId);

        if (!experiment) {
            return res.status(404).json({
                success: false,
                message: '실험을 찾을 수 없습니다.'
            });
        }

        if (experiment.status === 'running') {
            return res.status(400).json({
                success: false,
                message: '실행 중인 실험은 삭제할 수 없습니다.'
            });
        }

        // 실험 삭제
        abTestService.experiments.delete(experimentId);

        // 관련 데이터 삭제
        const allocations = Array.from(abTestService.allocations.keys())
            .filter(key => key.startsWith(`${experimentId}_`));
        allocations.forEach(key => abTestService.allocations.delete(key));

        const events = Array.from(abTestService.events.keys())
            .filter(key => {
                const event = abTestService.events.get(key);
                return event && event.experimentId === experimentId;
            });
        events.forEach(key => abTestService.events.delete(key));

        abTestService.results.delete(experimentId);

        res.json({
            success: true,
            message: '실험이 삭제되었습니다.'
        });
    } catch (error) {
        logger.error('Delete experiment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 실험 업데이트
router.put('/experiments/:experimentId', (req, res) => {
    try {
        const { experimentId } = req.params;
        const updateData = req.body;

        const experiment = abTestService.getExperiment(experimentId);
        if (!experiment) {
            return res.status(404).json({
                success: false,
                message: '실험을 찾을 수 없습니다.'
            });
        }

        if (experiment.status === 'running') {
            return res.status(400).json({
                success: false,
                message: '실행 중인 실험은 수정할 수 없습니다.'
            });
        }

        // 실험 업데이트
        const updatedExperiment = {
            ...experiment,
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        abTestService.experiments.set(experimentId, updatedExperiment);

        res.json({
            success: true,
            data: updatedExperiment
        });
    } catch (error) {
        logger.error('Update experiment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 실험 분석 리포트 생성
router.get('/experiments/:experimentId/report', async (req, res) => {
    try {
        const { experimentId } = req.params;
        const experiment = abTestService.getExperiment(experimentId);

        if (!experiment) {
            return res.status(404).json({
                success: false,
                message: '실험을 찾을 수 없습니다.'
            });
        }

        // 결과 계산
        const results = await abTestService.calculateResults(experimentId);
        if (!results.success) {
            return res.status(400).json({
                success: false,
                message: '결과 계산에 실패했습니다.'
            });
        }

        const report = {
            experiment: experiment,
            results: results.results,
            insights: this.generateInsights(results.results),
            recommendations: this.generateRecommendations(results.results),
            generatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        logger.error('Generate report error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 인사이트 생성
function generateInsights(results) {
    const insights = [];
    const variants = Object.values(results.results);
    const control = variants.find(v => v.variant.isControl);
    const experiments = variants.filter(v => !v.variant.isControl);

    if (!control || experiments.length === 0) {
        return [{ type: 'info', message: '분석할 충분한 데이터가 없습니다.' }];
    }

    // 최고 성과 변형 찾기
    const bestVariant = experiments.reduce((best, current) =>
        current.conversionRate > best.conversionRate ? current : best
    );

    const improvement = control.conversionRate > 0
        ? ((bestVariant.conversionRate - control.conversionRate) / control.conversionRate) * 100
        : 0;

    if (improvement > 0) {
        insights.push({
            type: 'success',
            message: `${bestVariant.variant.name}이 Control 대비 ${improvement.toFixed(1)}% 개선되었습니다.`
        });
    } else if (improvement < 0) {
        insights.push({
            type: 'warning',
            message: `${bestVariant.variant.name}이 Control 대비 ${Math.abs(improvement).toFixed(1)}% 감소했습니다.`
        });
    }

    // 통계적 유의성
    if (bestVariant.significance?.isSignificant) {
        insights.push({
            type: 'success',
            message: `결과가 통계적으로 유의합니다 (신뢰도: ${bestVariant.confidence.toFixed(1)}%).`
        });
    } else {
        insights.push({
            type: 'warning',
            message: `결과가 통계적으로 유의하지 않습니다. 더 많은 데이터가 필요할 수 있습니다.`
        });
    }

    return insights;
}

// 권장사항 생성
function generateRecommendations(results) {
    const recommendations = [];
    const variants = Object.values(results.results);
    const control = variants.find(v => v.variant.isControl);
    const experiments = variants.filter(v => !v.variant.isControl);

    if (!control || experiments.length === 0) {
        return [{ type: 'info', message: '권장사항을 생성할 충분한 데이터가 없습니다.' }];
    }

    const bestVariant = experiments.reduce((best, current) =>
        current.conversionRate > best.conversionRate ? current : best
    );

    if (bestVariant.significance?.isSignificant && bestVariant.conversionRate > control.conversionRate) {
        recommendations.push({
            type: 'success',
            priority: 'high',
            message: `${bestVariant.variant.name}을 프로덕션에 적용하는 것을 권장합니다.`
        });
    } else if (!bestVariant.significance?.isSignificant) {
        recommendations.push({
            type: 'warning',
            priority: 'medium',
            message: '더 많은 데이터를 수집하거나 실험 기간을 연장하는 것을 고려하세요.'
        });
    }

    return recommendations;
}

module.exports = router;

