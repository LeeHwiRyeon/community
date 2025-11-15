const crypto = require('crypto');
const logger = require('../utils/logger');

class ABTestService {
    constructor() {
        this.experiments = new Map();
        this.variants = new Map();
        this.allocations = new Map();
        this.events = new Map();
        this.results = new Map();
        this.segments = new Map();
        this.goals = new Map();

        this.initializeDefaultSegments();
        this.initializeDefaultGoals();
    }

    // 기본 세그먼트 초기화
    initializeDefaultSegments() {
        const defaultSegments = [
            {
                id: 'all_users',
                name: '모든 사용자',
                description: '전체 사용자 대상',
                criteria: {},
                isDefault: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'new_users',
                name: '신규 사용자',
                description: '가입 후 7일 이내 사용자',
                criteria: {
                    registrationDays: { $lte: 7 }
                },
                isDefault: false,
                createdAt: new Date().toISOString()
            },
            {
                id: 'premium_users',
                name: '프리미엄 사용자',
                description: '프리미엄 구독 사용자',
                criteria: {
                    subscriptionType: 'premium'
                },
                isDefault: false,
                createdAt: new Date().toISOString()
            },
            {
                id: 'mobile_users',
                name: '모바일 사용자',
                description: '모바일 디바이스 사용자',
                criteria: {
                    deviceType: 'mobile'
                },
                isDefault: false,
                createdAt: new Date().toISOString()
            },
            {
                id: 'high_engagement',
                name: '고참여 사용자',
                description: '높은 참여도를 보이는 사용자',
                criteria: {
                    engagementScore: { $gte: 0.7 }
                },
                isDefault: false,
                createdAt: new Date().toISOString()
            }
        ];

        defaultSegments.forEach(segment => {
            this.segments.set(segment.id, segment);
        });
    }

    // 기본 목표 초기화
    initializeDefaultGoals() {
        const defaultGoals = [
            {
                id: 'conversion_rate',
                name: '전환율',
                description: '사용자가 원하는 행동을 수행하는 비율',
                type: 'conversion',
                metric: 'conversion_rate',
                isDefault: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'click_through_rate',
                name: '클릭률',
                description: '링크나 버튼 클릭 비율',
                type: 'engagement',
                metric: 'ctr',
                isDefault: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'time_on_page',
                name: '페이지 체류 시간',
                description: '페이지에서 보낸 평균 시간',
                type: 'engagement',
                metric: 'avg_time_on_page',
                isDefault: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'bounce_rate',
                name: '이탈률',
                description: '페이지를 떠나는 비율',
                type: 'engagement',
                metric: 'bounce_rate',
                isDefault: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'revenue_per_user',
                name: '사용자당 수익',
                description: '사용자당 평균 수익',
                type: 'revenue',
                metric: 'arpu',
                isDefault: true,
                createdAt: new Date().toISOString()
            }
        ];

        defaultGoals.forEach(goal => {
            this.goals.set(goal.id, goal);
        });
    }

    // 실험 생성
    async createExperiment(experimentData) {
        try {
            const {
                name,
                description,
                hypothesis,
                primaryGoal,
                secondaryGoals = [],
                segments = ['all_users'],
                trafficAllocation = 100,
                minSampleSize = 1000,
                maxDuration = 30, // 일
                variants = [],
                startDate = null,
                endDate = null
            } = experimentData;

            // 실험 ID 생성
            const experimentId = this.generateExperimentId();

            // 기본 변형 생성 (Control)
            const controlVariant = {
                id: 'control',
                name: 'Control',
                description: '기본 버전',
                weight: 50,
                configuration: {},
                isControl: true,
                createdAt: new Date().toISOString()
            };

            // 사용자 정의 변형들
            const experimentVariants = variants.map((variant, index) => ({
                id: variant.id || `variant_${index + 1}`,
                name: variant.name,
                description: variant.description || '',
                weight: variant.weight || (100 - 50) / variants.length,
                configuration: variant.configuration || {},
                isControl: false,
                createdAt: new Date().toISOString()
            }));

            // 모든 변형을 variants 맵에 저장
            const allVariants = [controlVariant, ...experimentVariants];
            allVariants.forEach(variant => {
                this.variants.set(`${experimentId}_${variant.id}`, variant);
            });

            // 실험 생성
            const experiment = {
                id: experimentId,
                name,
                description,
                hypothesis,
                primaryGoal,
                secondaryGoals,
                segments,
                trafficAllocation,
                minSampleSize,
                maxDuration,
                variants: allVariants.map(v => v.id),
                status: 'draft',
                startDate: startDate || new Date().toISOString(),
                endDate: endDate || new Date(Date.now() + maxDuration * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'system',
                stats: {
                    totalUsers: 0,
                    conversions: 0,
                    conversionRate: 0,
                    confidence: 0,
                    significance: false
                }
            };

            this.experiments.set(experimentId, experiment);

            logger.info(`A/B test experiment created: ${experimentId}`);
            return {
                success: true,
                experimentId,
                experiment
            };

        } catch (error) {
            logger.error('Create experiment error:', error);
            throw error;
        }
    }

    // 실험 시작
    async startExperiment(experimentId) {
        try {
            const experiment = this.experiments.get(experimentId);
            if (!experiment) {
                throw new Error('Experiment not found');
            }

            if (experiment.status !== 'draft') {
                throw new Error('Only draft experiments can be started');
            }

            experiment.status = 'running';
            experiment.actualStartDate = new Date().toISOString();
            experiment.updatedAt = new Date().toISOString();

            this.experiments.set(experimentId, experiment);

            logger.info(`A/B test experiment started: ${experimentId}`);
            return {
                success: true,
                message: 'Experiment started successfully'
            };

        } catch (error) {
            logger.error('Start experiment error:', error);
            throw error;
        }
    }

    // 실험 중지
    async stopExperiment(experimentId) {
        try {
            const experiment = this.experiments.get(experimentId);
            if (!experiment) {
                throw new Error('Experiment not found');
            }

            if (experiment.status !== 'running') {
                throw new Error('Only running experiments can be stopped');
            }

            experiment.status = 'stopped';
            experiment.actualEndDate = new Date().toISOString();
            experiment.updatedAt = new Date().toISOString();

            this.experiments.set(experimentId, experiment);

            logger.info(`A/B test experiment stopped: ${experimentId}`);
            return {
                success: true,
                message: 'Experiment stopped successfully'
            };

        } catch (error) {
            logger.error('Stop experiment error:', error);
            throw error;
        }
    }

    // 사용자 할당
    async allocateUser(experimentId, userId, userAttributes = {}) {
        try {
            const experiment = this.experiments.get(experimentId);
            if (!experiment) {
                throw new Error('Experiment not found');
            }

            if (experiment.status !== 'running') {
                return { variant: null, reason: 'experiment_not_running' };
            }

            // 사용자가 이미 할당되었는지 확인
            const existingAllocation = this.allocations.get(`${experimentId}_${userId}`);
            if (existingAllocation) {
                return {
                    variant: existingAllocation.variantId,
                    reason: 'already_allocated'
                };
            }

            // 세그먼트 확인
            const isEligible = this.checkUserEligibility(userId, userAttributes, experiment.segments);
            if (!isEligible) {
                return { variant: null, reason: 'not_eligible' };
            }

            // 트래픽 할당 확인
            const shouldAllocate = this.shouldAllocateTraffic(experiment.trafficAllocation);
            if (!shouldAllocate) {
                return { variant: null, reason: 'traffic_not_allocated' };
            }

            // 변형 선택 (가중치 기반)
            const variant = this.selectVariant(experimentId, experiment.variants);

            // 할당 저장
            const allocation = {
                experimentId,
                userId,
                variantId: variant.id,
                allocatedAt: new Date().toISOString(),
                userAttributes
            };

            this.allocations.set(`${experimentId}_${userId}`, allocation);

            // 실험 통계 업데이트
            this.updateExperimentStats(experimentId);

            return {
                variant: variant.id,
                reason: 'allocated',
                configuration: variant.configuration
            };

        } catch (error) {
            logger.error('Allocate user error:', error);
            throw error;
        }
    }

    // 이벤트 기록
    async recordEvent(experimentId, userId, eventType, eventData = {}) {
        try {
            const allocation = this.allocations.get(`${experimentId}_${userId}`);
            if (!allocation) {
                return { success: false, reason: 'user_not_allocated' };
            }

            const event = {
                id: this.generateEventId(),
                experimentId,
                userId,
                variantId: allocation.variantId,
                eventType,
                eventData,
                timestamp: new Date().toISOString()
            };

            this.events.set(event.id, event);

            // 실험 통계 업데이트
            this.updateExperimentStats(experimentId);

            logger.info(`A/B test event recorded: ${eventType} for user ${userId} in experiment ${experimentId}`);
            return { success: true, eventId: event.id };

        } catch (error) {
            logger.error('Record event error:', error);
            throw error;
        }
    }

    // 실험 결과 계산
    async calculateResults(experimentId) {
        try {
            const experiment = this.experiments.get(experimentId);
            if (!experiment) {
                throw new Error('Experiment not found');
            }

            const allocations = Array.from(this.allocations.values())
                .filter(a => a.experimentId === experimentId);

            const events = Array.from(this.events.values())
                .filter(e => e.experimentId === experimentId);

            const results = {};

            // 각 변형별 결과 계산
            experiment.variants.forEach(variantId => {
                const variant = this.variants.get(`${experimentId}_${variantId}`);
                const variantAllocations = allocations.filter(a => a.variantId === variantId);
                const variantEvents = events.filter(e => e.variantId === variantId);

                const primaryGoal = this.goals.get(experiment.primaryGoal);
                const primaryGoalEvents = variantEvents.filter(e => e.eventType === primaryGoal.metric);

                const conversionRate = variantAllocations.length > 0
                    ? (primaryGoalEvents.length / variantAllocations.length) * 100
                    : 0;

                results[variantId] = {
                    variant: variant,
                    totalUsers: variantAllocations.length,
                    conversions: primaryGoalEvents.length,
                    conversionRate: conversionRate,
                    events: variantEvents.length,
                    avgEventsPerUser: variantAllocations.length > 0
                        ? variantEvents.length / variantAllocations.length
                        : 0
                };
            });

            // 통계적 유의성 계산
            const controlResults = results['control'];
            const experimentResults = Object.values(results).filter(r => r.variant.id !== 'control');

            if (controlResults && experimentResults.length > 0) {
                experimentResults.forEach(result => {
                    const significance = this.calculateSignificance(
                        controlResults.totalUsers,
                        controlResults.conversions,
                        result.totalUsers,
                        result.conversions
                    );
                    result.significance = significance;
                    result.confidence = significance.confidence;
                });
            }

            // 결과 저장
            this.results.set(experimentId, {
                experimentId,
                calculatedAt: new Date().toISOString(),
                results,
                summary: this.generateSummary(results)
            });

            return {
                success: true,
                results: this.results.get(experimentId)
            };

        } catch (error) {
            logger.error('Calculate results error:', error);
            throw error;
        }
    }

    // 통계적 유의성 계산
    calculateSignificance(controlUsers, controlConversions, variantUsers, variantConversions) {
        const controlRate = controlUsers > 0 ? controlConversions / controlUsers : 0;
        const variantRate = variantUsers > 0 ? variantConversions / variantUsers : 0;

        const pooledRate = (controlConversions + variantConversions) / (controlUsers + variantUsers);
        const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / controlUsers + 1 / variantUsers));

        const zScore = se > 0 ? (variantRate - controlRate) / se : 0;
        const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
        const confidence = (1 - pValue) * 100;

        return {
            isSignificant: pValue < 0.05,
            confidence: confidence,
            pValue: pValue,
            zScore: zScore,
            improvement: controlRate > 0 ? ((variantRate - controlRate) / controlRate) * 100 : 0
        };
    }

    // 정규분포 누적분포함수 근사
    normalCDF(x) {
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    // 오차함수 근사
    erf(x) {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    // 사용자 자격 확인
    checkUserEligibility(userId, userAttributes, segments) {
        if (segments.includes('all_users')) {
            return true;
        }

        return segments.some(segmentId => {
            const segment = this.segments.get(segmentId);
            if (!segment) return false;

            return this.evaluateSegmentCriteria(userAttributes, segment.criteria);
        });
    }

    // 세그먼트 기준 평가
    evaluateSegmentCriteria(userAttributes, criteria) {
        for (const [key, condition] of Object.entries(criteria)) {
            const userValue = userAttributes[key];

            if (condition.$gte && userValue < condition.$gte) return false;
            if (condition.$lte && userValue > condition.$lte) return false;
            if (condition.$gt && userValue <= condition.$gt) return false;
            if (condition.$lt && userValue >= condition.$lt) return false;
            if (condition.$eq && userValue !== condition.$eq) return false;
            if (condition.$ne && userValue === condition.$ne) return false;
            if (condition.$in && !condition.$in.includes(userValue)) return false;
            if (condition.$nin && condition.$nin.includes(userValue)) return false;
        }

        return true;
    }

    // 트래픽 할당 확인
    shouldAllocateTraffic(trafficAllocation) {
        return Math.random() * 100 < trafficAllocation;
    }

    // 변형 선택
    selectVariant(experimentId, variantIds) {
        const variants = variantIds.map(id => this.variants.get(`${experimentId}_${id}`));
        const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);

        let random = Math.random() * totalWeight;

        for (const variant of variants) {
            random -= variant.weight;
            if (random <= 0) {
                return variant;
            }
        }

        return variants[0]; // fallback
    }

    // 실험 통계 업데이트
    updateExperimentStats(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) return;

        const allocations = Array.from(this.allocations.values())
            .filter(a => a.experimentId === experimentId);

        const events = Array.from(this.events.values())
            .filter(e => e.experimentId === experimentId);

        experiment.stats.totalUsers = allocations.length;
        experiment.stats.conversions = events.length;
        experiment.stats.conversionRate = allocations.length > 0
            ? (events.length / allocations.length) * 100
            : 0;

        this.experiments.set(experimentId, experiment);
    }

    // 결과 요약 생성
    generateSummary(results) {
        const variants = Object.values(results);
        const control = variants.find(v => v.variant.isControl);
        const experiments = variants.filter(v => !v.variant.isControl);

        if (!control || experiments.length === 0) {
            return { message: 'Insufficient data for summary' };
        }

        const bestVariant = experiments.reduce((best, current) =>
            current.conversionRate > best.conversionRate ? current : best
        );

        const improvement = control.conversionRate > 0
            ? ((bestVariant.conversionRate - control.conversionRate) / control.conversionRate) * 100
            : 0;

        return {
            controlConversionRate: control.conversionRate,
            bestVariant: bestVariant.variant.name,
            bestConversionRate: bestVariant.conversionRate,
            improvement: improvement,
            isSignificant: bestVariant.significance?.isSignificant || false,
            confidence: bestVariant.confidence || 0
        };
    }

    // 실험 목록 조회
    getExperiments(filters = {}) {
        let experiments = Array.from(this.experiments.values());

        if (filters.status) {
            experiments = experiments.filter(e => e.status === filters.status);
        }

        if (filters.createdBy) {
            experiments = experiments.filter(e => e.createdBy === filters.createdBy);
        }

        return experiments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // 실험 상세 조회
    getExperiment(experimentId) {
        return this.experiments.get(experimentId);
    }

    // 실험 결과 조회
    getExperimentResults(experimentId) {
        return this.results.get(experimentId);
    }

    // 세그먼트 목록 조회
    getSegments() {
        return Array.from(this.segments.values());
    }

    // 목표 목록 조회
    getGoals() {
        return Array.from(this.goals.values());
    }

    // 실험 통계
    getExperimentStats() {
        const experiments = Array.from(this.experiments.values());

        return {
            totalExperiments: experiments.length,
            runningExperiments: experiments.filter(e => e.status === 'running').length,
            completedExperiments: experiments.filter(e => e.status === 'stopped').length,
            draftExperiments: experiments.filter(e => e.status === 'draft').length,
            totalUsers: experiments.reduce((sum, e) => sum + e.stats.totalUsers, 0),
            totalConversions: experiments.reduce((sum, e) => sum + e.stats.conversions, 0)
        };
    }

    // 유틸리티 메서드들
    generateExperimentId() {
        return 'exp_' + crypto.randomBytes(8).toString('hex');
    }

    generateEventId() {
        return 'evt_' + crypto.randomBytes(8).toString('hex');
    }
}

module.exports = new ABTestService();

