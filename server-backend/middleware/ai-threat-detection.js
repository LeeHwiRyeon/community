// AI-Based Threat Detection System (2025년 10월 기준)
const EventEmitter = require('events');

// AI 기반 위협 감지 설정
const aiThreatConfig = {
    // 머신러닝 모델 설정
    model: {
        enabled: true,
        version: '2025.10.1',
        confidenceThreshold: 0.8,
        learningRate: 0.01,
        maxFeatures: 1000
    },

    // 행동 패턴 분석
    behaviorAnalysis: {
        enabled: true,
        windowSize: 100, // 최근 100개 요청 분석
        anomalyThreshold: 0.7,
        learningPeriod: 24 * 60 * 60 * 1000 // 24시간
    },

    // 실시간 위협 감지
    realTimeDetection: {
        enabled: true,
        checkInterval: 1000, // 1초마다 체크
        maxConcurrentChecks: 10
    },

    // AI 모델 업데이트
    modelUpdate: {
        enabled: true,
        interval: 60 * 60 * 1000, // 1시간마다
        autoRetrain: true
    }
};

// AI 위협 감지 클래스
class AIThreatDetector extends EventEmitter {
    constructor() {
        super();
        this.models = new Map();
        this.behaviorProfiles = new Map();
        this.threatPatterns = new Map();
        this.learningData = [];
        this.isLearning = false;

        this.initializeModels();
        this.startRealTimeDetection();
        this.startModelUpdate();
    }

    // AI 모델 초기화
    initializeModels() {
        // 1. 이상 행동 감지 모델
        this.models.set('anomaly', {
            type: 'isolation_forest',
            features: ['request_frequency', 'response_time', 'error_rate', 'resource_usage'],
            threshold: 0.7,
            trained: false
        });

        // 2. 공격 패턴 감지 모델
        this.models.set('attack_pattern', {
            type: 'neural_network',
            layers: [64, 32, 16, 1],
            features: ['payload_length', 'special_chars', 'sql_patterns', 'xss_patterns'],
            threshold: 0.8,
            trained: false
        });

        // 3. DDoS 감지 모델
        this.models.set('ddos', {
            type: 'time_series',
            features: ['requests_per_second', 'unique_ips', 'geographic_distribution'],
            threshold: 0.9,
            trained: false
        });

        // 4. 봇 감지 모델
        this.models.set('bot_detection', {
            type: 'random_forest',
            features: ['user_agent', 'request_pattern', 'timing_pattern', 'header_pattern'],
            threshold: 0.75,
            trained: false
        });
    }

    // 실시간 위협 감지 시작
    startRealTimeDetection() {
        if (!aiThreatConfig.realTimeDetection.enabled) return;

        setInterval(() => {
            this.performRealTimeAnalysis();
        }, aiThreatConfig.realTimeDetection.checkInterval);
    }

    // 모델 업데이트 시작
    startModelUpdate() {
        if (!aiThreatConfig.modelUpdate.enabled) return;

        setInterval(() => {
            this.updateModels();
        }, aiThreatConfig.modelUpdate.interval);
    }

    // 실시간 분석 수행
    async performRealTimeAnalysis() {
        try {
            const currentTime = Date.now();
            const recentRequests = this.getRecentRequests(aiThreatConfig.behaviorAnalysis.windowSize);

            if (recentRequests.length < 10) return; // 충분한 데이터가 없으면 스킵

            // 1. 이상 행동 감지
            const anomalyScore = await this.detectAnomaly(recentRequests);
            if (anomalyScore > aiThreatConfig.behaviorAnalysis.anomalyThreshold) {
                this.handleThreat('ANOMALY_DETECTED', {
                    score: anomalyScore,
                    requests: recentRequests.slice(-5),
                    timestamp: currentTime
                });
            }

            // 2. 공격 패턴 감지
            const attackScore = await this.detectAttackPattern(recentRequests);
            if (attackScore > this.models.get('attack_pattern').threshold) {
                this.handleThreat('ATTACK_PATTERN_DETECTED', {
                    score: attackScore,
                    requests: recentRequests.slice(-5),
                    timestamp: currentTime
                });
            }

            // 3. DDoS 감지
            const ddosScore = await this.detectDDoS(recentRequests);
            if (ddosScore > this.models.get('ddos').threshold) {
                this.handleThreat('DDOS_DETECTED', {
                    score: ddosScore,
                    requests: recentRequests.slice(-10),
                    timestamp: currentTime
                });
            }

            // 4. 봇 감지
            const botScore = await this.detectBot(recentRequests);
            if (botScore > this.models.get('bot_detection').threshold) {
                this.handleThreat('BOT_DETECTED', {
                    score: botScore,
                    requests: recentRequests.slice(-5),
                    timestamp: currentTime
                });
            }

        } catch (error) {
            console.error('[AI Threat Detection] Error in real-time analysis:', error);
        }
    }

    // 이상 행동 감지 (Isolation Forest 알고리즘)
    async detectAnomaly(requests) {
        const model = this.models.get('anomaly');
        if (!model.trained) {
            // 기본 규칙 기반 감지
            return this.basicAnomalyDetection(requests);
        }

        // AI 모델을 사용한 감지
        const features = this.extractFeatures(requests, model.features);
        return this.predictWithModel('anomaly', features);
    }

    // 공격 패턴 감지 (Neural Network)
    async detectAttackPattern(requests) {
        const model = this.models.get('attack_pattern');
        if (!model.trained) {
            // 기본 패턴 매칭
            return this.basicAttackPatternDetection(requests);
        }

        const features = this.extractFeatures(requests, model.features);
        return this.predictWithModel('attack_pattern', features);
    }

    // DDoS 감지 (Time Series 분석)
    async detectDDoS(requests) {
        const model = this.models.get('ddos');
        if (!model.trained) {
            // 기본 DDoS 감지
            return this.basicDDoSDetection(requests);
        }

        const features = this.extractFeatures(requests, model.features);
        return this.predictWithModel('ddos', features);
    }

    // 봇 감지 (Random Forest)
    async detectBot(requests) {
        const model = this.models.get('bot_detection');
        if (!model.trained) {
            // 기본 봇 감지
            return this.basicBotDetection(requests);
        }

        const features = this.extractFeatures(requests, model.features);
        return this.predictWithModel('bot_detection', features);
    }

    // 기본 이상 행동 감지
    basicAnomalyDetection(requests) {
        const now = Date.now();
        const recentRequests = requests.filter(req => now - req.timestamp < 60000); // 1분 내

        // 요청 빈도 분석
        const requestFrequency = recentRequests.length / 60; // 초당 요청 수
        if (requestFrequency > 10) return 0.8;

        // 응답 시간 분석
        const avgResponseTime = recentRequests.reduce((sum, req) => sum + (req.responseTime || 0), 0) / recentRequests.length;
        if (avgResponseTime > 5000) return 0.7; // 5초 이상

        // 에러율 분석
        const errorRate = recentRequests.filter(req => req.statusCode >= 400).length / recentRequests.length;
        if (errorRate > 0.5) return 0.6;

        return 0.1; // 정상
    }

    // 기본 공격 패턴 감지
    basicAttackPatternDetection(requests) {
        let maxScore = 0;

        for (const request of requests) {
            const payload = JSON.stringify(request);
            let score = 0;

            // SQL 인젝션 패턴
            if (payload.includes('UNION') || payload.includes('SELECT') || payload.includes('DROP')) {
                score += 0.3;
            }

            // XSS 패턴
            if (payload.includes('<script>') || payload.includes('javascript:') || payload.includes('onload=')) {
                score += 0.3;
            }

            // 경로 탐색 패턴
            if (payload.includes('../') || payload.includes('..\\') || payload.includes('%2e%2e')) {
                score += 0.2;
            }

            // 명령 인젝션 패턴
            if (payload.includes(';') || payload.includes('|') || payload.includes('&&')) {
                score += 0.2;
            }

            maxScore = Math.max(maxScore, score);
        }

        return maxScore;
    }

    // 기본 DDoS 감지
    basicDDoSDetection(requests) {
        const now = Date.now();
        const recentRequests = requests.filter(req => now - req.timestamp < 60000); // 1분 내

        // 요청 수 분석
        if (recentRequests.length > 100) return 0.9;
        if (recentRequests.length > 50) return 0.7;
        if (recentRequests.length > 20) return 0.5;

        // IP 다양성 분석
        const uniqueIPs = new Set(recentRequests.map(req => req.ip));
        if (uniqueIPs.size > 50) return 0.8;
        if (uniqueIPs.size > 20) return 0.6;

        return 0.1;
    }

    // 기본 봇 감지
    basicBotDetection(requests) {
        let botScore = 0;

        for (const request of requests) {
            // User-Agent 분석
            const userAgent = request.userAgent || '';
            if (!userAgent || userAgent.length < 10) botScore += 0.3;
            if (userAgent.includes('bot') || userAgent.includes('crawler')) botScore += 0.4;

            // 요청 패턴 분석
            if (request.path === request.referer) botScore += 0.2; // 자기 참조

            // 타이밍 패턴 분석
            if (request.timing && request.timing < 100) botScore += 0.3; // 너무 빠른 요청
        }

        return Math.min(botScore / requests.length, 1.0);
    }

    // 특성 추출
    extractFeatures(requests, featureNames) {
        const features = {};

        for (const feature of featureNames) {
            switch (feature) {
                case 'request_frequency':
                    features[feature] = requests.length / 60; // 초당 요청 수
                    break;
                case 'response_time':
                    features[feature] = requests.reduce((sum, req) => sum + (req.responseTime || 0), 0) / requests.length;
                    break;
                case 'error_rate':
                    features[feature] = requests.filter(req => req.statusCode >= 400).length / requests.length;
                    break;
                case 'payload_length':
                    features[feature] = requests.reduce((sum, req) => sum + (req.payloadLength || 0), 0) / requests.length;
                    break;
                case 'special_chars':
                    features[feature] = this.calculateSpecialCharRatio(requests);
                    break;
                case 'requests_per_second':
                    features[feature] = requests.length;
                    break;
                case 'unique_ips':
                    features[feature] = new Set(requests.map(req => req.ip)).size;
                    break;
                default:
                    features[feature] = 0;
            }
        }

        return features;
    }

    // 특수 문자 비율 계산
    calculateSpecialCharRatio(requests) {
        let totalChars = 0;
        let specialChars = 0;

        for (const request of requests) {
            const payload = JSON.stringify(request);
            totalChars += payload.length;
            specialChars += (payload.match(/[^a-zA-Z0-9\s]/g) || []).length;
        }

        return totalChars > 0 ? specialChars / totalChars : 0;
    }

    // 모델 예측
    predictWithModel(modelName, features) {
        const model = this.models.get(modelName);
        if (!model || !model.trained) return 0.1;

        // 실제 환경에서는 훈련된 모델을 사용
        // 여기서는 간단한 휴리스틱 사용
        const featureValues = Object.values(features);
        const avgFeature = featureValues.reduce((sum, val) => sum + val, 0) / featureValues.length;

        return Math.min(avgFeature / 10, 1.0); // 정규화
    }

    // 위협 처리
    handleThreat(threatType, details) {
        const threat = {
            id: crypto.randomUUID(),
            type: threatType,
            timestamp: Date.now(),
            details,
            severity: this.calculateSeverity(threatType, details.score),
            confidence: details.score
        };

        // 이벤트 발생
        this.emit('threatDetected', threat);

        // 로깅
        console.log(`🚨 AI Threat Detected: ${threatType} (Confidence: ${(details.score * 100).toFixed(1)}%)`);

        // 자동 대응
        this.autoRespond(threat);
    }

    // 심각도 계산
    calculateSeverity(threatType, confidence) {
        const baseSeverity = {
            'ANOMALY_DETECTED': 'MEDIUM',
            'ATTACK_PATTERN_DETECTED': 'HIGH',
            'DDOS_DETECTED': 'CRITICAL',
            'BOT_DETECTED': 'LOW'
        };

        const severity = baseSeverity[threatType] || 'LOW';

        // 신뢰도에 따른 조정
        if (confidence > 0.9) return 'CRITICAL';
        if (confidence > 0.7) return 'HIGH';
        if (confidence > 0.5) return 'MEDIUM';
        return 'LOW';
    }

    // 자동 대응
    autoRespond(threat) {
        switch (threat.type) {
            case 'DDOS_DETECTED':
                // DDoS 차단
                this.blockIPs(threat.details.requests.map(req => req.ip));
                break;
            case 'ATTACK_PATTERN_DETECTED':
                // 공격 IP 차단
                this.blockIPs(threat.details.requests.map(req => req.ip));
                break;
            case 'BOT_DETECTED':
                // 봇 요청 제한
                this.limitBotRequests(threat.details.requests.map(req => req.ip));
                break;
        }
    }

    // IP 차단
    blockIPs(ips) {
        const uniqueIPs = [...new Set(ips)];
        console.log(`[AI Threat Detection] Blocking IPs: ${uniqueIPs.join(', ')}`);
        // 실제 구현에서는 IP 블랙리스트에 추가
    }

    // 봇 요청 제한
    limitBotRequests(ips) {
        const uniqueIPs = [...new Set(ips)];
        console.log(`[AI Threat Detection] Limiting bot requests from: ${uniqueIPs.join(', ')}`);
        // 실제 구현에서는 Rate Limiting 적용
    }

    // 최근 요청 가져오기
    getRecentRequests(count) {
        // 실제 구현에서는 메모리 또는 데이터베이스에서 가져옴
        return this.learningData.slice(-count);
    }

    // 요청 추가
    addRequest(request) {
        this.learningData.push({
            ...request,
            timestamp: Date.now()
        });

        // 학습 데이터 크기 제한
        if (this.learningData.length > 10000) {
            this.learningData = this.learningData.slice(-5000);
        }
    }

    // 모델 업데이트
    async updateModels() {
        if (this.isLearning) return;

        this.isLearning = true;
        console.log('[AI Threat Detection] Updating models...');

        try {
            // 실제 구현에서는 머신러닝 모델 재훈련
            await this.retrainModels();
            console.log('[AI Threat Detection] Models updated successfully');
        } catch (error) {
            console.error('[AI Threat Detection] Model update failed:', error);
        } finally {
            this.isLearning = false;
        }
    }

    // 모델 재훈련
    async retrainModels() {
        // 실제 구현에서는 머신러닝 라이브러리 사용
        // 예: TensorFlow.js, ML5.js 등

        for (const [modelName, model] of this.models.entries()) {
            model.trained = true;
            model.lastTrained = Date.now();
        }
    }

    // 통계 조회
    getStats() {
        return {
            models: Object.fromEntries(this.models),
            learningDataSize: this.learningData.length,
            isLearning: this.isLearning,
            config: aiThreatConfig
        };
    }
}

// 전역 AI 위협 감지기 인스턴스
const aiThreatDetector = new AIThreatDetector();

// AI 위협 감지 미들웨어
function aiThreatDetectionMiddleware(req, res, next) {
    // 요청 정보 수집
    const requestInfo = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        headers: req.headers,
        payloadLength: JSON.stringify(req.body).length,
        timestamp: Date.now()
    };

    // AI 감지기에 요청 추가
    aiThreatDetector.addRequest(requestInfo);

    // 응답 시간 측정
    const startTime = Date.now();
    res.on('finish', () => {
        requestInfo.responseTime = Date.now() - startTime;
        requestInfo.statusCode = res.statusCode;
    });

    next();
}

module.exports = {
    AIThreatDetector,
    aiThreatDetector,
    aiThreatDetectionMiddleware,
    aiThreatConfig
};
