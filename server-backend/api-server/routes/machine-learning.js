const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const machineLearningService = require('../services/machineLearningService');

// 모델 목록 조회
router.get('/models', (req, res) => {
    try {
        const models = machineLearningService.getModels();

        res.json({
            success: true,
            data: models
        });
    } catch (error) {
        logger.error('Get models error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get models',
            error: error.message
        });
    }
});

// 특정 모델 조회
router.get('/models/:modelId', (req, res) => {
    try {
        const { modelId } = req.params;
        const model = machineLearningService.getModel(modelId);

        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Model not found'
            });
        }

        res.json({
            success: true,
            data: model
        });
    } catch (error) {
        logger.error('Get model error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get model',
            error: error.message
        });
    }
});

// 예측 실행
router.post('/predict', async (req, res) => {
    try {
        const { modelId, inputData } = req.body;

        if (!modelId || !inputData) {
            return res.status(400).json({
                success: false,
                message: 'Model ID and input data are required'
            });
        }

        const prediction = await machineLearningService.makePrediction(modelId, inputData);

        res.json({
            success: true,
            message: 'Prediction completed successfully',
            data: prediction
        });
    } catch (error) {
        logger.error('Prediction error:', error);
        res.status(500).json({
            success: false,
            message: 'Prediction failed',
            error: error.message
        });
    }
});

// 배치 예측 실행
router.post('/predict/batch', async (req, res) => {
    try {
        const { modelId, inputDataArray } = req.body;

        if (!modelId || !inputDataArray || !Array.isArray(inputDataArray)) {
            return res.status(400).json({
                success: false,
                message: 'Model ID and input data array are required'
            });
        }

        const predictions = await machineLearningService.makeBatchPredictions(modelId, inputDataArray);

        res.json({
            success: true,
            message: `Batch prediction completed: ${predictions.length} predictions`,
            data: predictions
        });
    } catch (error) {
        logger.error('Batch prediction error:', error);
        res.status(500).json({
            success: false,
            message: 'Batch prediction failed',
            error: error.message
        });
    }
});

// 모델 훈련
router.post('/models/:modelId/train', async (req, res) => {
    try {
        const { modelId } = req.params;
        const { trainingData } = req.body;

        const result = await machineLearningService.trainModel(modelId, trainingData);

        res.json({
            success: true,
            message: 'Model training completed successfully',
            data: result
        });
    } catch (error) {
        logger.error('Model training error:', error);
        res.status(500).json({
            success: false,
            message: 'Model training failed',
            error: error.message
        });
    }
});

// 특성 중요도 분석
router.get('/models/:modelId/features/importance', (req, res) => {
    try {
        const { modelId } = req.params;
        const importance = machineLearningService.analyzeFeatureImportance(modelId);

        res.json({
            success: true,
            data: importance
        });
    } catch (error) {
        logger.error('Feature importance analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Feature importance analysis failed',
            error: error.message
        });
    }
});

// 모델 성능 평가
router.post('/models/:modelId/evaluate', (req, res) => {
    try {
        const { modelId } = req.params;
        const { testData } = req.body;

        if (!testData) {
            return res.status(400).json({
                success: false,
                message: 'Test data is required'
            });
        }

        const evaluation = machineLearningService.evaluateModel(modelId, testData);

        res.json({
            success: true,
            message: 'Model evaluation completed successfully',
            data: evaluation
        });
    } catch (error) {
        logger.error('Model evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Model evaluation failed',
            error: error.message
        });
    }
});

// 예측 히스토리 조회
router.get('/predictions', (req, res) => {
    try {
        const { modelId, limit = 100 } = req.query;
        const predictions = machineLearningService.getPredictionHistory(modelId, parseInt(limit));

        res.json({
            success: true,
            data: predictions
        });
    } catch (error) {
        logger.error('Get prediction history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get prediction history',
            error: error.message
        });
    }
});

// 모델 통계
router.get('/stats', (req, res) => {
    try {
        const stats = machineLearningService.getModelStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Get model stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get model stats',
            error: error.message
        });
    }
});

// 모델 비교
router.post('/models/compare', (req, res) => {
    try {
        const { modelIds } = req.body;

        if (!modelIds || !Array.isArray(modelIds) || modelIds.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'At least 2 model IDs are required for comparison'
            });
        }

        const comparison = machineLearningService.compareModels(modelIds);

        res.json({
            success: true,
            data: comparison
        });
    } catch (error) {
        logger.error('Model comparison error:', error);
        res.status(500).json({
            success: false,
            message: 'Model comparison failed',
            error: error.message
        });
    }
});

// 모델 성능 모니터링
router.get('/models/:modelId/performance', (req, res) => {
    try {
        const { modelId } = req.params;
        const performance = machineLearningService.monitorModelPerformance(modelId);

        res.json({
            success: true,
            data: performance
        });
    } catch (error) {
        logger.error('Model performance monitoring error:', error);
        res.status(500).json({
            success: false,
            message: 'Model performance monitoring failed',
            error: error.message
        });
    }
});

// 사용자 리텐션 예측
router.post('/predict/retention', async (req, res) => {
    try {
        const { userId, features } = req.body;

        if (!userId || !features) {
            return res.status(400).json({
                success: false,
                message: 'User ID and features are required'
            });
        }

        const prediction = await machineLearningService.makePrediction('user_retention', features);

        res.json({
            success: true,
            message: 'User retention prediction completed',
            data: {
                userId: userId,
                willRetain: prediction.prediction,
                confidence: prediction.confidence,
                probability: prediction.confidence,
                recommendation: prediction.prediction ?
                    'User is likely to retain. Continue current engagement strategies.' :
                    'User is at risk of churning. Implement retention strategies.'
            }
        });
    } catch (error) {
        logger.error('User retention prediction error:', error);
        res.status(500).json({
            success: false,
            message: 'User retention prediction failed',
            error: error.message
        });
    }
});

// 수익 예측
router.post('/predict/revenue', async (req, res) => {
    try {
        const { period, features } = req.body;

        if (!period || !features) {
            return res.status(400).json({
                success: false,
                message: 'Period and features are required'
            });
        }

        const prediction = await machineLearningService.makePrediction('revenue_forecast', features);

        res.json({
            success: true,
            message: 'Revenue prediction completed',
            data: {
                period: period,
                predictedRevenue: prediction.prediction,
                confidence: prediction.confidence,
                accuracy: prediction.confidence,
                trend: prediction.prediction > 100000 ? 'increasing' : 'decreasing'
            }
        });
    } catch (error) {
        logger.error('Revenue prediction error:', error);
        res.status(500).json({
            success: false,
            message: 'Revenue prediction failed',
            error: error.message
        });
    }
});

// 이탈 예측
router.post('/predict/churn', async (req, res) => {
    try {
        const { userId, features } = req.body;

        if (!userId || !features) {
            return res.status(400).json({
                success: false,
                message: 'User ID and features are required'
            });
        }

        const prediction = await machineLearningService.makePrediction('churn_prediction', features);

        res.json({
            success: true,
            message: 'Churn prediction completed',
            data: {
                userId: userId,
                willChurn: prediction.prediction,
                confidence: prediction.confidence,
                riskLevel: prediction.confidence > 0.8 ? 'high' :
                    prediction.confidence > 0.6 ? 'medium' : 'low',
                recommendation: prediction.prediction ?
                    'User is at high risk of churning. Implement immediate retention strategies.' :
                    'User is stable. Continue current engagement strategies.'
            }
        });
    } catch (error) {
        logger.error('Churn prediction error:', error);
        res.status(500).json({
            success: false,
            message: 'Churn prediction failed',
            error: error.message
        });
    }
});

// 콘텐츠 성과 예측
router.post('/predict/content-performance', async (req, res) => {
    try {
        const { contentId, features } = req.body;

        if (!contentId || !features) {
            return res.status(400).json({
                success: false,
                message: 'Content ID and features are required'
            });
        }

        const prediction = await machineLearningService.makePrediction('content_performance', features);

        res.json({
            success: true,
            message: 'Content performance prediction completed',
            data: {
                contentId: contentId,
                predictedEngagement: prediction.prediction,
                confidence: prediction.confidence,
                performanceLevel: prediction.prediction > 500 ? 'high' :
                    prediction.prediction > 200 ? 'medium' : 'low',
                recommendation: prediction.prediction > 500 ?
                    'Content is predicted to perform well. Consider promoting it.' :
                    'Content may need optimization. Review content strategy.'
            }
        });
    } catch (error) {
        logger.error('Content performance prediction error:', error);
        res.status(500).json({
            success: false,
            message: 'Content performance prediction failed',
            error: error.message
        });
    }
});

// 전환 예측
router.post('/predict/conversion', async (req, res) => {
    try {
        const { userId, features } = req.body;

        if (!userId || !features) {
            return res.status(400).json({
                success: false,
                message: 'User ID and features are required'
            });
        }

        const prediction = await machineLearningService.makePrediction('conversion_prediction', features);

        res.json({
            success: true,
            message: 'Conversion prediction completed',
            data: {
                userId: userId,
                willConvert: prediction.prediction,
                confidence: prediction.confidence,
                conversionProbability: prediction.confidence,
                recommendation: prediction.prediction ?
                    'User is likely to convert. Focus on closing the deal.' :
                    'User needs more nurturing. Continue lead nurturing activities.'
            }
        });
    } catch (error) {
        logger.error('Conversion prediction error:', error);
        res.status(500).json({
            success: false,
            message: 'Conversion prediction failed',
            error: error.message
        });
    }
});

// 예측 대시보드 데이터
router.get('/dashboard', (req, res) => {
    try {
        const stats = machineLearningService.getModelStats();
        const models = machineLearningService.getModels();
        const recentPredictions = machineLearningService.getPredictionHistory(null, 10);

        const dashboard = {
            stats: stats,
            models: models,
            recentPredictions: recentPredictions,
            topPerformingModels: models
                .filter(m => m.status === 'trained')
                .sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))
                .slice(0, 5),
            predictionTrends: {
                totalPredictions: stats.totalPredictions,
                predictionsToday: stats.predictionsToday,
                averageAccuracy: stats.averageAccuracy
            }
        };

        res.json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        logger.error('Get ML dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get ML dashboard',
            error: error.message
        });
    }
});

// 모델 성능 리포트 생성
router.get('/models/:modelId/report', (req, res) => {
    try {
        const { modelId } = req.params;
        const model = machineLearningService.getModel(modelId);

        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Model not found'
            });
        }

        const performance = machineLearningService.monitorModelPerformance(modelId);
        const featureImportance = machineLearningService.analyzeFeatureImportance(modelId);
        const predictions = machineLearningService.getPredictionHistory(modelId, 50);

        const report = {
            model: model,
            performance: performance,
            featureImportance: featureImportance,
            recentPredictions: predictions,
            generatedAt: new Date().toISOString(),
            recommendations: this.generateModelRecommendations(model, performance)
        };

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        logger.error('Generate model report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate model report',
            error: error.message
        });
    }
});

// 모델 권장사항 생성
function generateModelRecommendations(model, performance) {
    const recommendations = [];

    if (model.accuracy < 0.8) {
        recommendations.push({
            type: 'accuracy',
            priority: 'high',
            title: '모델 정확도 개선 필요',
            description: `현재 정확도가 ${(model.accuracy * 100).toFixed(1)}%입니다. 더 많은 훈련 데이터나 특성 엔지니어링을 고려하세요.`,
            action: 'retrain_model'
        });
    }

    if (performance.recentAccuracy < 0.75) {
        recommendations.push({
            type: 'performance',
            priority: 'medium',
            title: '최근 성능 저하 감지',
            description: '최근 예측 성능이 저하되었습니다. 모델을 재훈련하거나 데이터 품질을 검토하세요.',
            action: 'investigate_performance'
        });
    }

    if (performance.predictionTrend === 'declining') {
        recommendations.push({
            type: 'trend',
            priority: 'medium',
            title: '예측 트렌드 개선 필요',
            description: '예측 성능이 하락하는 추세입니다. 모델 업데이트를 고려하세요.',
            action: 'update_model'
        });
    }

    if (performance.confidenceDistribution.low > performance.confidenceDistribution.high) {
        recommendations.push({
            type: 'confidence',
            priority: 'low',
            title: '신뢰도 분포 개선',
            description: '낮은 신뢰도 예측이 많습니다. 모델의 불확실성을 줄이기 위한 조치가 필요합니다.',
            action: 'improve_confidence'
        });
    }

    return recommendations;
}

module.exports = router;

