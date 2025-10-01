import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { UserFeedback, Issue } from '@/types';

export class FeedbackAnalyzer {
    private openai: OpenAI;
    private projectPath: string;

    constructor(apiKey: string, projectPath: string = './generated-projects') {
        this.openai = new OpenAI({ apiKey });
        this.projectPath = projectPath;
    }

    /**
     * 피드백 분석 실행
     */
    async analyzeFeedback(feedbackData: any): Promise<FeedbackAnalysisResult> {
        console.log('🔍 피드백 분석 시작...');

        try {
            // 1. 감정 분석
            const sentimentAnalysis = await this.performSentimentAnalysis(feedbackData);

            // 2. 주제 분석
            const topicAnalysis = await this.performTopicAnalysis(feedbackData);

            // 3. 우선순위 분석
            const priorityAnalysis = await this.performPriorityAnalysis(feedbackData);

            // 4. 트렌드 분석
            const trendAnalysis = await this.performTrendAnalysis(feedbackData);

            // 5. 패턴 분석
            const patternAnalysis = await this.performPatternAnalysis(feedbackData);

            // 6. 상관관계 분석
            const correlationAnalysis = await this.performCorrelationAnalysis(feedbackData);

            // 7. 예측 분석
            const predictionAnalysis = await this.performPredictionAnalysis(feedbackData);

            // 8. 인사이트 생성
            const insights = await this.generateInsights({
                sentimentAnalysis,
                topicAnalysis,
                priorityAnalysis,
                trendAnalysis,
                patternAnalysis,
                correlationAnalysis,
                predictionAnalysis
            });

            // 9. 분석 리포트 생성
            const report = await this.generateAnalysisReport({
                sentimentAnalysis,
                topicAnalysis,
                priorityAnalysis,
                trendAnalysis,
                patternAnalysis,
                correlationAnalysis,
                predictionAnalysis,
                insights
            });

            console.log('✅ 피드백 분석 완료');

            return {
                sentimentAnalysis,
                topicAnalysis,
                priorityAnalysis,
                trendAnalysis,
                patternAnalysis,
                correlationAnalysis,
                predictionAnalysis,
                insights,
                report,
                summary: this.generateAnalysisSummary(insights)
            };

        } catch (error) {
            console.error('❌ 피드백 분석 실패:', error);
            throw error;
        }
    }

    /**
     * 감정 분석 수행
     */
    private async performSentimentAnalysis(feedbackData: any): Promise<SentimentAnalysisResult> {
        console.log('😊 감정 분석 중...');

        const analysis: SentimentAnalysisResult = {
            overall: {
                positive: 0,
                negative: 0,
                neutral: 0,
                score: 0
            },
            byCategory: {},
            bySource: {},
            trends: [],
            insights: []
        };

        // 전체 감정 분석
        analysis.overall = await this.analyzeOverallSentiment(feedbackData);

        // 카테고리별 감정 분석
        analysis.byCategory = await this.analyzeSentimentByCategory(feedbackData);

        // 소스별 감정 분석
        analysis.bySource = await this.analyzeSentimentBySource(feedbackData);

        // 감정 트렌드 분석
        analysis.trends = await this.analyzeSentimentTrends(feedbackData);

        // 감정 인사이트 생성
        analysis.insights = await this.generateSentimentInsights(analysis);

        return analysis;
    }

    /**
     * 주제 분석 수행
     */
    private async performTopicAnalysis(feedbackData: any): Promise<TopicAnalysisResult> {
        console.log('📝 주제 분석 중...');

        const analysis: TopicAnalysisResult = {
            topics: [],
            topicDistribution: {},
            topicTrends: [],
            topicSentiment: {},
            insights: []
        };

        // 주제 추출
        analysis.topics = await this.extractTopics(feedbackData);

        // 주제 분포 분석
        analysis.topicDistribution = await this.analyzeTopicDistribution(analysis.topics);

        // 주제 트렌드 분석
        analysis.topicTrends = await this.analyzeTopicTrends(analysis.topics);

        // 주제별 감정 분석
        analysis.topicSentiment = await this.analyzeTopicSentiment(analysis.topics);

        // 주제 인사이트 생성
        analysis.insights = await this.generateTopicInsights(analysis);

        return analysis;
    }

    /**
     * 우선순위 분석 수행
     */
    private async performPriorityAnalysis(feedbackData: any): Promise<PriorityAnalysisResult> {
        console.log('⚡ 우선순위 분석 중...');

        const analysis: PriorityAnalysisResult = {
            priorityDistribution: {},
            highPriorityItems: [],
            priorityFactors: {},
            recommendations: []
        };

        // 우선순위 분포 분석
        analysis.priorityDistribution = await this.analyzePriorityDistribution(feedbackData);

        // 고우선순위 항목 식별
        analysis.highPriorityItems = await this.identifyHighPriorityItems(feedbackData);

        // 우선순위 결정 요인 분석
        analysis.priorityFactors = await this.analyzePriorityFactors(feedbackData);

        // 우선순위 권장사항 생성
        analysis.recommendations = await this.generatePriorityRecommendations(analysis);

        return analysis;
    }

    /**
     * 트렌드 분석 수행
     */
    private async performTrendAnalysis(feedbackData: any): Promise<TrendAnalysisResult> {
        console.log('📈 트렌드 분석 중...');

        const analysis: TrendAnalysisResult = {
            trends: [],
            trendPatterns: [],
            seasonalPatterns: [],
            anomalies: [],
            predictions: []
        };

        // 트렌드 식별
        analysis.trends = await this.identifyTrends(feedbackData);

        // 트렌드 패턴 분석
        analysis.trendPatterns = await this.analyzeTrendPatterns(analysis.trends);

        // 계절성 패턴 분석
        analysis.seasonalPatterns = await this.analyzeSeasonalPatterns(feedbackData);

        // 이상치 탐지
        analysis.anomalies = await this.detectAnomalies(feedbackData);

        // 트렌드 예측
        analysis.predictions = await this.predictTrends(analysis.trends);

        return analysis;
    }

    /**
     * 패턴 분석 수행
     */
    private async performPatternAnalysis(feedbackData: any): Promise<PatternAnalysisResult> {
        console.log('🔍 패턴 분석 중...');

        const analysis: PatternAnalysisResult = {
            patterns: [],
            patternFrequency: {},
            patternCorrelations: [],
            patternInsights: []
        };

        // 패턴 식별
        analysis.patterns = await this.identifyPatterns(feedbackData);

        // 패턴 빈도 분석
        analysis.patternFrequency = await this.analyzePatternFrequency(analysis.patterns);

        // 패턴 상관관계 분석
        analysis.patternCorrelations = await this.analyzePatternCorrelations(analysis.patterns);

        // 패턴 인사이트 생성
        analysis.patternInsights = await this.generatePatternInsights(analysis);

        return analysis;
    }

    /**
     * 상관관계 분석 수행
     */
    private async performCorrelationAnalysis(feedbackData: any): Promise<CorrelationAnalysisResult> {
        console.log('🔗 상관관계 분석 중...');

        const analysis: CorrelationAnalysisResult = {
            correlations: [],
            strongCorrelations: [],
            weakCorrelations: [],
            insights: []
        };

        // 상관관계 계산
        analysis.correlations = await this.calculateCorrelations(feedbackData);

        // 강한 상관관계 식별
        analysis.strongCorrelations = await this.identifyStrongCorrelations(analysis.correlations);

        // 약한 상관관계 식별
        analysis.weakCorrelations = await this.identifyWeakCorrelations(analysis.correlations);

        // 상관관계 인사이트 생성
        analysis.insights = await this.generateCorrelationInsights(analysis);

        return analysis;
    }

    /**
     * 예측 분석 수행
     */
    private async performPredictionAnalysis(feedbackData: any): Promise<PredictionAnalysisResult> {
        console.log('🔮 예측 분석 중...');

        const analysis: PredictionAnalysisResult = {
            predictions: [],
            confidence: 0,
            accuracy: 0,
            recommendations: []
        };

        // 예측 모델 생성
        const predictions = await this.generatePredictions(feedbackData);
        analysis.predictions = predictions;

        // 신뢰도 계산
        analysis.confidence = await this.calculatePredictionConfidence(predictions);

        // 정확도 계산
        analysis.accuracy = await this.calculatePredictionAccuracy(predictions);

        // 예측 권장사항 생성
        analysis.recommendations = await this.generatePredictionRecommendations(analysis);

        return analysis;
    }

    /**
     * 인사이트 생성
     */
    private async generateInsights(analysisData: any): Promise<Insight[]> {
        console.log('💡 인사이트 생성 중...');

        const insights: Insight[] = [];

        // 감정 인사이트
        if (analysisData.sentimentAnalysis.overall.negative > 0.6) {
            insights.push({
                id: this.generateId(),
                type: 'sentiment',
                title: '부정적 피드백 증가',
                description: '사용자들의 부정적 피드백이 증가하고 있습니다.',
                impact: 'high',
                confidence: 0.8,
                recommendations: ['사용자 경험 개선', '문제 해결 우선순위 조정']
            });
        }

        // 주제 인사이트
        const topTopics = Object.entries(analysisData.topicAnalysis.topicDistribution)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 3);

        for (const [topic, count] of topTopics) {
            insights.push({
                id: this.generateId(),
                type: 'topic',
                title: `주요 주제: ${topic}`,
                description: `${topic}에 대한 피드백이 ${count}건으로 가장 많습니다.`,
                impact: 'medium',
                confidence: 0.7,
                recommendations: [`${topic} 관련 기능 개선`]
            });
        }

        // 트렌드 인사이트
        const increasingTrends = analysisData.trendAnalysis.trends.filter((t: any) => t.direction === 'up');
        if (increasingTrends.length > 0) {
            insights.push({
                id: this.generateId(),
                type: 'trend',
                title: '증가하는 트렌드 감지',
                description: `${increasingTrends.length}개의 증가하는 트렌드가 감지되었습니다.`,
                impact: 'medium',
                confidence: 0.6,
                recommendations: ['트렌드 모니터링 강화', '대응 전략 수립']
            });
        }

        // 패턴 인사이트
        const frequentPatterns = Object.entries(analysisData.patternAnalysis.patternFrequency)
            .filter(([, freq]) => (freq as number) > 5)
            .slice(0, 3);

        for (const [pattern, freq] of frequentPatterns) {
            insights.push({
                id: this.generateId(),
                type: 'pattern',
                title: `빈번한 패턴: ${pattern}`,
                description: `${pattern} 패턴이 ${freq}번 반복되었습니다.`,
                impact: 'low',
                confidence: 0.5,
                recommendations: [`${pattern} 패턴 분석`, '자동화 가능성 검토']
            });
        }

        return insights;
    }

    // 헬퍼 메서드들
    private async analyzeOverallSentiment(feedbackData: any): Promise<SentimentScore> {
        // 실제 구현에서는 AI 기반 감정 분석
        return {
            positive: 0.4,
            negative: 0.3,
            neutral: 0.3,
            score: 0.55
        };
    }

    private async analyzeSentimentByCategory(feedbackData: any): Promise<Record<string, SentimentScore>> {
        // 실제 구현에서는 카테고리별 감정 분석
        return {
            'usability': { positive: 0.3, negative: 0.5, neutral: 0.2, score: 0.4 },
            'performance': { positive: 0.2, negative: 0.6, neutral: 0.2, score: 0.3 },
            'design': { positive: 0.6, negative: 0.2, neutral: 0.2, score: 0.7 }
        };
    }

    private async analyzeSentimentBySource(feedbackData: any): Promise<Record<string, SentimentScore>> {
        // 실제 구현에서는 소스별 감정 분석
        return {
            'user_form': { positive: 0.5, negative: 0.3, neutral: 0.2, score: 0.6 },
            'twitter': { positive: 0.3, negative: 0.5, neutral: 0.2, score: 0.4 },
            'support_ticket': { positive: 0.2, negative: 0.6, neutral: 0.2, score: 0.3 }
        };
    }

    private async analyzeSentimentTrends(feedbackData: any): Promise<Trend[]> {
        // 실제 구현에서는 감정 트렌드 분석
        return [
            {
                name: 'positive_sentiment',
                direction: 'up',
                change: 0.1,
                period: 'last_30_days'
            },
            {
                name: 'negative_sentiment',
                direction: 'down',
                change: -0.05,
                period: 'last_30_days'
            }
        ];
    }

    private async generateSentimentInsights(analysis: SentimentAnalysisResult): Promise<string[]> {
        const insights: string[] = [];

        if (analysis.overall.negative > 0.5) {
            insights.push('부정적 피드백이 50%를 초과합니다. 즉시 개선이 필요합니다.');
        }

        if (analysis.overall.positive > 0.6) {
            insights.push('긍정적 피드백이 60%를 초과합니다. 현재 방향을 유지하세요.');
        }

        return insights;
    }

    private async extractTopics(feedbackData: any): Promise<Topic[]> {
        // 실제 구현에서는 AI 기반 주제 추출
        return [
            { name: 'usability', frequency: 15, sentiment: 'negative' },
            { name: 'performance', frequency: 12, sentiment: 'negative' },
            { name: 'design', frequency: 8, sentiment: 'positive' },
            { name: 'features', frequency: 6, sentiment: 'neutral' }
        ];
    }

    private async analyzeTopicDistribution(topics: Topic[]): Promise<Record<string, number>> {
        const distribution: Record<string, number> = {};

        for (const topic of topics) {
            distribution[topic.name] = topic.frequency;
        }

        return distribution;
    }

    private async analyzeTopicTrends(topics: Topic[]): Promise<TopicTrend[]> {
        // 실제 구현에서는 주제 트렌드 분석
        return [
            {
                topic: 'usability',
                direction: 'up',
                change: 0.2,
                period: 'last_30_days'
            }
        ];
    }

    private async analyzeTopicSentiment(topics: Topic[]): Promise<Record<string, SentimentScore>> {
        const sentiment: Record<string, SentimentScore> = {};

        for (const topic of topics) {
            sentiment[topic.name] = {
                positive: topic.sentiment === 'positive' ? 0.8 : 0.2,
                negative: topic.sentiment === 'negative' ? 0.8 : 0.2,
                neutral: topic.sentiment === 'neutral' ? 0.8 : 0.2,
                score: topic.sentiment === 'positive' ? 0.8 : topic.sentiment === 'negative' ? 0.2 : 0.5
            };
        }

        return sentiment;
    }

    private async generateTopicInsights(analysis: TopicAnalysisResult): Promise<string[]> {
        const insights: string[] = [];

        const topTopic = Object.entries(analysis.topicDistribution)
            .sort(([, a], [, b]) => (b as number) - (a as number))[0];

        if (topTopic) {
            insights.push(`${topTopic[0]}이 가장 많이 언급되는 주제입니다.`);
        }

        return insights;
    }

    private async analyzePriorityDistribution(feedbackData: any): Promise<Record<string, number>> {
        // 실제 구현에서는 우선순위 분포 분석
        return {
            'critical': 5,
            'high': 12,
            'medium': 25,
            'low': 8
        };
    }

    private async identifyHighPriorityItems(feedbackData: any): Promise<HighPriorityItem[]> {
        // 실제 구현에서는 고우선순위 항목 식별
        return [
            {
                id: 'item_1',
                type: 'bug',
                description: '로그인 기능 오류',
                priority: 'critical',
                impact: 'high',
                effort: 'medium'
            }
        ];
    }

    private async analyzePriorityFactors(feedbackData: any): Promise<Record<string, number>> {
        // 실제 구현에서는 우선순위 결정 요인 분석
        return {
            'user_impact': 0.4,
            'business_impact': 0.3,
            'technical_complexity': 0.2,
            'urgency': 0.1
        };
    }

    private async generatePriorityRecommendations(analysis: PriorityAnalysisResult): Promise<string[]> {
        const recommendations: string[] = [];

        if (analysis.priorityDistribution.critical > 5) {
            recommendations.push('긴급 항목이 많습니다. 즉시 대응이 필요합니다.');
        }

        return recommendations;
    }

    private async identifyTrends(feedbackData: any): Promise<Trend[]> {
        // 실제 구현에서는 트렌드 식별
        return [
            {
                name: 'user_complaints',
                direction: 'up',
                change: 0.15,
                period: 'last_30_days'
            }
        ];
    }

    private async analyzeTrendPatterns(trends: Trend[]): Promise<TrendPattern[]> {
        // 실제 구현에서는 트렌드 패턴 분석
        return [];
    }

    private async analyzeSeasonalPatterns(feedbackData: any): Promise<SeasonalPattern[]> {
        // 실제 구현에서는 계절성 패턴 분석
        return [];
    }

    private async detectAnomalies(feedbackData: any): Promise<Anomaly[]> {
        // 실제 구현에서는 이상치 탐지
        return [];
    }

    private async predictTrends(trends: Trend[]): Promise<TrendPrediction[]> {
        // 실제 구현에서는 트렌드 예측
        return [];
    }

    private async identifyPatterns(feedbackData: any): Promise<Pattern[]> {
        // 실제 구현에서는 패턴 식별
        return [
            {
                name: 'login_issues',
                frequency: 8,
                description: '로그인 관련 문제가 반복적으로 발생',
                confidence: 0.7
            }
        ];
    }

    private async analyzePatternFrequency(patterns: Pattern[]): Promise<Record<string, number>> {
        const frequency: Record<string, number> = {};

        for (const pattern of patterns) {
            frequency[pattern.name] = pattern.frequency;
        }

        return frequency;
    }

    private async analyzePatternCorrelations(patterns: Pattern[]): Promise<PatternCorrelation[]> {
        // 실제 구현에서는 패턴 상관관계 분석
        return [];
    }

    private async generatePatternInsights(analysis: PatternAnalysisResult): Promise<string[]> {
        const insights: string[] = [];

        const frequentPatterns = Object.entries(analysis.patternFrequency)
            .filter(([, freq]) => (freq as number) > 5);

        if (frequentPatterns.length > 0) {
            insights.push(`${frequentPatterns.length}개의 빈번한 패턴이 발견되었습니다.`);
        }

        return insights;
    }

    private async calculateCorrelations(feedbackData: any): Promise<Correlation[]> {
        // 실제 구현에서는 상관관계 계산
        return [
            {
                variable1: 'user_satisfaction',
                variable2: 'response_time',
                correlation: -0.7,
                significance: 0.05
            }
        ];
    }

    private async identifyStrongCorrelations(correlations: Correlation[]): Promise<Correlation[]> {
        return correlations.filter(c => Math.abs(c.correlation) > 0.7);
    }

    private async identifyWeakCorrelations(correlations: Correlation[]): Promise<Correlation[]> {
        return correlations.filter(c => Math.abs(c.correlation) < 0.3);
    }

    private async generateCorrelationInsights(analysis: CorrelationAnalysisResult): Promise<string[]> {
        const insights: string[] = [];

        if (analysis.strongCorrelations.length > 0) {
            insights.push(`${analysis.strongCorrelations.length}개의 강한 상관관계가 발견되었습니다.`);
        }

        return insights;
    }

    private async generatePredictions(feedbackData: any): Promise<Prediction[]> {
        // 실제 구현에서는 예측 모델 생성
        return [
            {
                metric: 'user_satisfaction',
                current: 0.6,
                predicted: 0.7,
                timeframe: 'next_30_days',
                confidence: 0.8
            }
        ];
    }

    private async calculatePredictionConfidence(predictions: Prediction[]): Promise<number> {
        if (predictions.length === 0) return 0;

        const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
        return avgConfidence;
    }

    private async calculatePredictionAccuracy(predictions: Prediction[]): Promise<number> {
        // 실제 구현에서는 예측 정확도 계산
        return 0.75;
    }

    private async generatePredictionRecommendations(analysis: PredictionAnalysisResult): Promise<string[]> {
        const recommendations: string[] = [];

        if (analysis.confidence < 0.7) {
            recommendations.push('예측 신뢰도가 낮습니다. 더 많은 데이터를 수집하세요.');
        }

        return recommendations;
    }

    private async generateAnalysisReport(analysisData: any): Promise<string> {
        const report = {
            summary: this.generateAnalysisSummary(analysisData.insights),
            ...analysisData,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'feedback-analysis-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    private generateAnalysisSummary(insights: Insight[]): FeedbackAnalysisSummary {
        return {
            totalInsights: insights.length,
            highImpactInsights: insights.filter(i => i.impact === 'high').length,
            averageConfidence: insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length,
            status: this.determineAnalysisStatus(insights)
        };
    }

    private determineAnalysisStatus(insights: Insight[]): 'excellent' | 'good' | 'fair' | 'poor' {
        const highImpactCount = insights.filter(i => i.impact === 'high').length;
        const avgConfidence = insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length;

        if (highImpactCount <= 2 && avgConfidence >= 0.7) return 'excellent';
        if (highImpactCount <= 5 && avgConfidence >= 0.5) return 'good';
        if (highImpactCount <= 10 && avgConfidence >= 0.3) return 'fair';
        return 'poor';
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface FeedbackAnalysisResult {
    sentimentAnalysis: SentimentAnalysisResult;
    topicAnalysis: TopicAnalysisResult;
    priorityAnalysis: PriorityAnalysisResult;
    trendAnalysis: TrendAnalysisResult;
    patternAnalysis: PatternAnalysisResult;
    correlationAnalysis: CorrelationAnalysisResult;
    predictionAnalysis: PredictionAnalysisResult;
    insights: Insight[];
    report: string;
    summary: FeedbackAnalysisSummary;
}

interface SentimentAnalysisResult {
    overall: SentimentScore;
    byCategory: Record<string, SentimentScore>;
    bySource: Record<string, SentimentScore>;
    trends: Trend[];
    insights: string[];
}

interface SentimentScore {
    positive: number;
    negative: number;
    neutral: number;
    score: number;
}

interface TopicAnalysisResult {
    topics: Topic[];
    topicDistribution: Record<string, number>;
    topicTrends: TopicTrend[];
    topicSentiment: Record<string, SentimentScore>;
    insights: string[];
}

interface Topic {
    name: string;
    frequency: number;
    sentiment: 'positive' | 'negative' | 'neutral';
}

interface TopicTrend {
    topic: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
    period: string;
}

interface PriorityAnalysisResult {
    priorityDistribution: Record<string, number>;
    highPriorityItems: HighPriorityItem[];
    priorityFactors: Record<string, number>;
    recommendations: string[];
}

interface HighPriorityItem {
    id: string;
    type: string;
    description: string;
    priority: string;
    impact: string;
    effort: string;
}

interface TrendAnalysisResult {
    trends: Trend[];
    trendPatterns: TrendPattern[];
    seasonalPatterns: SeasonalPattern[];
    anomalies: Anomaly[];
    predictions: TrendPrediction[];
}

interface Trend {
    name: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
    period: string;
}

interface TrendPattern {
    name: string;
    description: string;
    frequency: number;
}

interface SeasonalPattern {
    name: string;
    period: string;
    strength: number;
}

interface Anomaly {
    id: string;
    type: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    timestamp: Date;
}

interface TrendPrediction {
    metric: string;
    predicted: number;
    confidence: number;
    timeframe: string;
}

interface PatternAnalysisResult {
    patterns: Pattern[];
    patternFrequency: Record<string, number>;
    patternCorrelations: PatternCorrelation[];
    patternInsights: string[];
}

interface Pattern {
    name: string;
    frequency: number;
    description: string;
    confidence: number;
}

interface PatternCorrelation {
    pattern1: string;
    pattern2: string;
    correlation: number;
    significance: number;
}

interface CorrelationAnalysisResult {
    correlations: Correlation[];
    strongCorrelations: Correlation[];
    weakCorrelations: Correlation[];
    insights: string[];
}

interface Correlation {
    variable1: string;
    variable2: string;
    correlation: number;
    significance: number;
}

interface PredictionAnalysisResult {
    predictions: Prediction[];
    confidence: number;
    accuracy: number;
    recommendations: string[];
}

interface Prediction {
    metric: string;
    current: number;
    predicted: number;
    timeframe: string;
    confidence: number;
}

interface Insight {
    id: string;
    type: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number;
    recommendations: string[];
}

interface FeedbackAnalysisSummary {
    totalInsights: number;
    highImpactInsights: number;
    averageConfidence: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
}
