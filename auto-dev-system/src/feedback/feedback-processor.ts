import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { UserFeedback, Issue } from '@/types';

export class FeedbackProcessor {
    private openai: OpenAI;
    private projectPath: string;

    constructor(apiKey: string, projectPath: string = './generated-projects') {
        this.openai = new OpenAI({ apiKey });
        this.projectPath = projectPath;
    }

    /**
     * 피드백 처리 실행
     */
    async processFeedback(feedbackData: any, analysisData: any): Promise<FeedbackProcessingResult> {
        console.log('⚙️ 피드백 처리 시작...');

        try {
            // 1. 피드백 분류
            const classification = await this.classifyFeedback(feedbackData);

            // 2. 액션 아이템 생성
            const actionItems = await this.generateActionItems(classification, analysisData);

            // 3. 우선순위 결정
            const prioritization = await this.prioritizeActionItems(actionItems);

            // 4. 자동 해결 시도
            const autoResolution = await this.attemptAutoResolution(prioritization);

            // 5. 수동 처리 큐 생성
            const manualQueue = await this.createManualProcessingQueue(autoResolution);

            // 6. 알림 및 에스컬레이션
            const notifications = await this.sendNotifications(manualQueue);

            // 7. 진행 상황 추적
            const tracking = await this.setupProgressTracking(manualQueue);

            // 8. 처리 리포트 생성
            const report = await this.generateProcessingReport({
                classification,
                actionItems,
                prioritization,
                autoResolution,
                manualQueue,
                notifications,
                tracking
            });

            console.log('✅ 피드백 처리 완료');

            return {
                classification,
                actionItems,
                prioritization,
                autoResolution,
                manualQueue,
                notifications,
                tracking,
                report,
                summary: this.generateProcessingSummary(manualQueue, autoResolution)
            };

        } catch (error) {
            console.error('❌ 피드백 처리 실패:', error);
            throw error;
        }
    }

    /**
     * 피드백 분류
     */
    private async classifyFeedback(feedbackData: any): Promise<FeedbackClassification> {
        console.log('🏷️ 피드백 분류 중...');

        const classification: FeedbackClassification = {
            categories: {},
            types: {},
            priorities: {},
            sources: {},
            sentiments: {},
            classifications: []
        };

        // 피드백별 분류 수행
        for (const feedback of feedbackData.userFeedback || []) {
            const itemClassification = await this.classifyFeedbackItem(feedback);
            classification.classifications.push(itemClassification);

            // 카테고리별 집계
            classification.categories[itemClassification.category] =
                (classification.categories[itemClassification.category] || 0) + 1;

            // 타입별 집계
            classification.types[itemClassification.type] =
                (classification.types[itemClassification.type] || 0) + 1;

            // 우선순위별 집계
            classification.priorities[itemClassification.priority] =
                (classification.priorities[itemClassification.priority] || 0) + 1;

            // 소스별 집계
            classification.sources[itemClassification.source] =
                (classification.sources[itemClassification.source] || 0) + 1;

            // 감정별 집계
            classification.sentiments[itemClassification.sentiment] =
                (classification.sentiments[itemClassification.sentiment] || 0) + 1;
        }

        return classification;
    }

    /**
     * 개별 피드백 아이템 분류
     */
    private async classifyFeedbackItem(feedback: UserFeedback): Promise<FeedbackItemClassification> {
        const classification: FeedbackItemClassification = {
            id: feedback.id,
            category: this.determineCategory(feedback),
            type: this.determineType(feedback),
            priority: this.determinePriority(feedback),
            source: feedback.source,
            sentiment: this.determineSentiment(feedback),
            confidence: this.calculateClassificationConfidence(feedback),
            tags: this.extractTags(feedback),
            requiresAction: this.requiresAction(feedback),
            estimatedEffort: this.estimateEffort(feedback)
        };

        return classification;
    }

    /**
     * 액션 아이템 생성
     */
    private async generateActionItems(
        classification: FeedbackClassification,
        analysisData: any
    ): Promise<ActionItem[]> {
        console.log('📋 액션 아이템 생성 중...');

        const actionItems: ActionItem[] = [];

        // 분류된 피드백을 기반으로 액션 아이템 생성
        for (const itemClassification of classification.classifications) {
            if (itemClassification.requiresAction) {
                const actionItem = await this.createActionItem(itemClassification, analysisData);
                actionItems.push(actionItem);
            }
        }

        // 분석 데이터를 기반으로 추가 액션 아이템 생성
        const additionalActions = await this.generateAdditionalActionItems(analysisData);
        actionItems.push(...additionalActions);

        return actionItems;
    }

    /**
     * 액션 아이템 생성
     */
    private async createActionItem(
        classification: FeedbackItemClassification,
        analysisData: any
    ): Promise<ActionItem> {
        const actionItem: ActionItem = {
            id: this.generateId(),
            title: this.generateActionTitle(classification),
            description: this.generateActionDescription(classification),
            type: this.determineActionType(classification),
            priority: classification.priority,
            category: classification.category,
            assignedTo: this.determineAssignee(classification),
            estimatedEffort: classification.estimatedEffort,
            dueDate: this.calculateDueDate(classification),
            dependencies: this.identifyDependencies(classification),
            successCriteria: this.defineSuccessCriteria(classification),
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        return actionItem;
    }

    /**
     * 우선순위 결정
     */
    private async prioritizeActionItems(actionItems: ActionItem[]): Promise<ActionItemPrioritization> {
        console.log('⚡ 액션 아이템 우선순위 결정 중...');

        const prioritization: ActionItemPrioritization = {
            prioritizedItems: [],
            priorityFactors: {},
            conflicts: [],
            recommendations: []
        };

        // 우선순위 점수 계산
        for (const item of actionItems) {
            const priorityScore = this.calculatePriorityScore(item);
            item.priorityScore = priorityScore;
        }

        // 우선순위별 정렬
        prioritization.prioritizedItems = actionItems.sort((a, b) =>
            (b.priorityScore || 0) - (a.priorityScore || 0)
        );

        // 우선순위 결정 요인 분석
        prioritization.priorityFactors = this.analyzePriorityFactors(actionItems);

        // 충돌 식별
        prioritization.conflicts = this.identifyPriorityConflicts(prioritization.prioritizedItems);

        // 권장사항 생성
        prioritization.recommendations = this.generatePrioritizationRecommendations(prioritization);

        return prioritization;
    }

    /**
     * 자동 해결 시도
     */
    private async attemptAutoResolution(
        prioritization: ActionItemPrioritization
    ): Promise<AutoResolutionResult> {
        console.log('🤖 자동 해결 시도 중...');

        const result: AutoResolutionResult = {
            resolvedItems: [],
            failedItems: [],
            partialResolutions: [],
            autoResolutionRate: 0,
            recommendations: []
        };

        // 자동 해결 가능한 아이템 식별
        const autoResolvableItems = prioritization.prioritizedItems.filter(
            item => this.isAutoResolvable(item)
        );

        // 자동 해결 시도
        for (const item of autoResolvableItems) {
            try {
                const resolution = await this.attemptItemResolution(item);

                if (resolution.success) {
                    result.resolvedItems.push(resolution);
                    item.status = 'resolved';
                } else if (resolution.partial) {
                    result.partialResolutions.push(resolution);
                    item.status = 'in_progress';
                } else {
                    result.failedItems.push(resolution);
                    item.status = 'failed';
                }
            } catch (error) {
                result.failedItems.push({
                    itemId: item.id,
                    success: false,
                    partial: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    resolution: null
                });
                item.status = 'failed';
            }
        }

        // 자동 해결률 계산
        result.autoResolutionRate = result.resolvedItems.length / autoResolvableItems.length;

        // 권장사항 생성
        result.recommendations = this.generateAutoResolutionRecommendations(result);

        return result;
    }

    /**
     * 수동 처리 큐 생성
     */
    private async createManualProcessingQueue(
        autoResolution: AutoResolutionResult
    ): Promise<ManualProcessingQueue> {
        console.log('👥 수동 처리 큐 생성 중...');

        const queue: ManualProcessingQueue = {
            highPriority: [],
            mediumPriority: [],
            lowPriority: [],
            assignedItems: [],
            unassignedItems: [],
            estimatedWorkload: {},
            recommendations: []
        };

        // 자동 해결 실패한 아이템들을 우선순위별로 분류
        const failedItems = autoResolution.failedItems.map(f => f.itemId);
        const partialItems = autoResolution.partialResolutions.map(p => p.itemId);

        const allManualItems = [...failedItems, ...partialItems];

        for (const itemId of allManualItems) {
            // 실제 구현에서는 아이템 정보를 가져와서 분류
            const item = { id: itemId, priority: 'medium' }; // 임시 데이터

            switch (item.priority) {
                case 'critical':
                case 'high':
                    queue.highPriority.push(item);
                    break;
                case 'medium':
                    queue.mediumPriority.push(item);
                    break;
                case 'low':
                    queue.lowPriority.push(item);
                    break;
            }
        }

        // 할당된 아이템과 미할당 아이템 분류
        queue.assignedItems = queue.highPriority.filter(item => item.assignedTo);
        queue.unassignedItems = queue.highPriority.filter(item => !item.assignedTo);

        // 예상 작업량 계산
        queue.estimatedWorkload = this.calculateEstimatedWorkload(queue);

        // 권장사항 생성
        queue.recommendations = this.generateQueueRecommendations(queue);

        return queue;
    }

    /**
     * 알림 및 에스컬레이션
     */
    private async sendNotifications(queue: ManualProcessingQueue): Promise<NotificationResult> {
        console.log('📢 알림 및 에스컬레이션 중...');

        const result: NotificationResult = {
            sentNotifications: [],
            escalatedItems: [],
            notificationChannels: {},
            successRate: 0,
            recommendations: []
        };

        // 고우선순위 아이템에 대한 알림
        for (const item of queue.highPriority) {
            const notification = await this.sendItemNotification(item);
            result.sentNotifications.push(notification);
        }

        // 에스컬레이션 필요한 아이템 식별
        result.escalatedItems = queue.highPriority.filter(item =>
            this.requiresEscalation(item)
        );

        // 알림 채널별 성공률 계산
        result.notificationChannels = this.calculateNotificationChannels(result.sentNotifications);

        // 전체 성공률 계산
        result.successRate = result.sentNotifications.filter(n => n.success).length /
            result.sentNotifications.length;

        // 권장사항 생성
        result.recommendations = this.generateNotificationRecommendations(result);

        return result;
    }

    /**
     * 진행 상황 추적 설정
     */
    private async setupProgressTracking(queue: ManualProcessingQueue): Promise<ProgressTracking> {
        console.log('📊 진행 상황 추적 설정 중...');

        const tracking: ProgressTracking = {
            trackingItems: [],
            metrics: {},
            alerts: [],
            reports: [],
            recommendations: []
        };

        // 추적 아이템 설정
        tracking.trackingItems = queue.highPriority.concat(queue.mediumPriority);

        // 메트릭 설정
        tracking.metrics = {
            totalItems: tracking.trackingItems.length,
            completedItems: 0,
            inProgressItems: 0,
            pendingItems: tracking.trackingItems.length,
            averageResolutionTime: 0,
            successRate: 0
        };

        // 알림 설정
        tracking.alerts = this.setupTrackingAlerts(tracking);

        // 리포트 설정
        tracking.reports = this.setupTrackingReports(tracking);

        // 권장사항 생성
        tracking.recommendations = this.generateTrackingRecommendations(tracking);

        return tracking;
    }

    // 헬퍼 메서드들
    private determineCategory(feedback: UserFeedback): string {
        return feedback.category || 'general';
    }

    private determineType(feedback: UserFeedback): string {
        return feedback.type || 'comment';
    }

    private determinePriority(feedback: UserFeedback): string {
        return feedback.priority || 'medium';
    }

    private determineSentiment(feedback: UserFeedback): string {
        if (feedback.rating >= 4) return 'positive';
        if (feedback.rating <= 2) return 'negative';
        return 'neutral';
    }

    private calculateClassificationConfidence(feedback: UserFeedback): number {
        // 실제 구현에서는 AI 기반 신뢰도 계산
        return 0.8;
    }

    private extractTags(feedback: UserFeedback): string[] {
        // 실제 구현에서는 태그 추출
        return [];
    }

    private requiresAction(feedback: UserFeedback): boolean {
        return feedback.priority === 'critical' || feedback.priority === 'high' ||
            feedback.rating <= 2;
    }

    private estimateEffort(feedback: UserFeedback): string {
        switch (feedback.priority) {
            case 'critical': return 'high';
            case 'high': return 'medium';
            case 'medium': return 'low';
            default: return 'low';
        }
    }

    private generateActionTitle(classification: FeedbackItemClassification): string {
        return `해결: ${classification.category} 관련 ${classification.type} 피드백`;
    }

    private generateActionDescription(classification: FeedbackItemClassification): string {
        return `${classification.category} 카테고리의 ${classification.type} 피드백을 처리합니다.`;
    }

    private determineActionType(classification: FeedbackItemClassification): string {
        switch (classification.category) {
            case 'usability': return 'ui_improvement';
            case 'performance': return 'performance_optimization';
            case 'bug': return 'bug_fix';
            case 'feature': return 'feature_development';
            default: return 'general_improvement';
        }
    }

    private determineAssignee(classification: FeedbackItemClassification): string {
        switch (classification.category) {
            case 'usability': return 'ui_team';
            case 'performance': return 'backend_team';
            case 'bug': return 'qa_team';
            case 'feature': return 'product_team';
            default: return 'general_team';
        }
    }

    private calculateDueDate(classification: FeedbackItemClassification): Date {
        const now = new Date();
        const days = classification.priority === 'critical' ? 1 :
            classification.priority === 'high' ? 3 :
                classification.priority === 'medium' ? 7 : 14;

        return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }

    private identifyDependencies(classification: FeedbackItemClassification): string[] {
        // 실제 구현에서는 의존성 식별
        return [];
    }

    private defineSuccessCriteria(classification: FeedbackItemClassification): string[] {
        return [
            '피드백 내용 검토 완료',
            '해결 방안 구현 완료',
            '사용자 확인 완료'
        ];
    }

    private async generateAdditionalActionItems(analysisData: any): Promise<ActionItem[]> {
        // 실제 구현에서는 분석 데이터 기반 추가 액션 아이템 생성
        return [];
    }

    private calculatePriorityScore(item: ActionItem): number {
        let score = 0;

        // 우선순위 기반 점수
        switch (item.priority) {
            case 'critical': score += 100; break;
            case 'high': score += 75; break;
            case 'medium': score += 50; break;
            case 'low': score += 25; break;
        }

        // 카테고리 기반 점수
        switch (item.category) {
            case 'bug': score += 20; break;
            case 'performance': score += 15; break;
            case 'usability': score += 10; break;
            case 'feature': score += 5; break;
        }

        // 노력 기반 점수 (낮은 노력일수록 높은 점수)
        switch (item.estimatedEffort) {
            case 'low': score += 10; break;
            case 'medium': score += 5; break;
            case 'high': score += 0; break;
        }

        return score;
    }

    private analyzePriorityFactors(actionItems: ActionItem[]): Record<string, number> {
        // 실제 구현에서는 우선순위 결정 요인 분석
        return {
            'urgency': 0.4,
            'impact': 0.3,
            'effort': 0.2,
            'dependencies': 0.1
        };
    }

    private identifyPriorityConflicts(prioritizedItems: ActionItem[]): PriorityConflict[] {
        // 실제 구현에서는 우선순위 충돌 식별
        return [];
    }

    private generatePrioritizationRecommendations(prioritization: ActionItemPrioritization): string[] {
        const recommendations: string[] = [];

        if (prioritization.conflicts.length > 0) {
            recommendations.push('우선순위 충돌이 있습니다. 리소스 할당을 재검토하세요.');
        }

        return recommendations;
    }

    private isAutoResolvable(item: ActionItem): boolean {
        // 실제 구현에서는 자동 해결 가능성 판단
        return item.type === 'bug_fix' && item.estimatedEffort === 'low';
    }

    private async attemptItemResolution(item: ActionItem): Promise<ItemResolution> {
        // 실제 구현에서는 아이템 해결 시도
        return {
            itemId: item.id,
            success: false,
            partial: false,
            error: 'Not implemented',
            resolution: null
        };
    }

    private generateAutoResolutionRecommendations(result: AutoResolutionResult): string[] {
        const recommendations: string[] = [];

        if (result.autoResolutionRate < 0.3) {
            recommendations.push('자동 해결률이 낮습니다. 자동화 규칙을 개선하세요.');
        }

        return recommendations;
    }

    private calculateEstimatedWorkload(queue: ManualProcessingQueue): Record<string, number> {
        // 실제 구현에서는 예상 작업량 계산
        return {
            'high_priority': queue.highPriority.length,
            'medium_priority': queue.mediumPriority.length,
            'low_priority': queue.lowPriority.length
        };
    }

    private generateQueueRecommendations(queue: ManualProcessingQueue): string[] {
        const recommendations: string[] = [];

        if (queue.unassignedItems.length > 5) {
            recommendations.push('미할당 아이템이 많습니다. 담당자 배정을 진행하세요.');
        }

        return recommendations;
    }

    private async sendItemNotification(item: any): Promise<Notification> {
        // 실제 구현에서는 아이템별 알림 전송
        return {
            id: this.generateId(),
            itemId: item.id,
            type: 'email',
            recipient: item.assignedTo || 'team',
            message: `새로운 ${item.priority} 우선순위 작업이 할당되었습니다.`,
            success: true,
            timestamp: new Date()
        };
    }

    private requiresEscalation(item: any): boolean {
        // 실제 구현에서는 에스컬레이션 필요성 판단
        return item.priority === 'critical' && !item.assignedTo;
    }

    private calculateNotificationChannels(notifications: Notification[]): Record<string, number> {
        const channels: Record<string, number> = {};

        for (const notification of notifications) {
            channels[notification.type] = (channels[notification.type] || 0) + 1;
        }

        return channels;
    }

    private generateNotificationRecommendations(result: NotificationResult): string[] {
        const recommendations: string[] = [];

        if (result.successRate < 0.8) {
            recommendations.push('알림 전송 성공률이 낮습니다. 알림 시스템을 점검하세요.');
        }

        return recommendations;
    }

    private setupTrackingAlerts(tracking: ProgressTracking): Alert[] {
        // 실제 구현에서는 추적 알림 설정
        return [];
    }

    private setupTrackingReports(tracking: ProgressTracking): Report[] {
        // 실제 구현에서는 추적 리포트 설정
        return [];
    }

    private generateTrackingRecommendations(tracking: ProgressTracking): string[] {
        // 실제 구현에서는 추적 권장사항 생성
        return [];
    }

    private async generateProcessingReport(data: any): Promise<string> {
        const report = {
            summary: this.generateProcessingSummary(data.manualQueue, data.autoResolution),
            ...data,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'feedback-processing-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    private generateProcessingSummary(
        manualQueue: ManualProcessingQueue,
        autoResolution: AutoResolutionResult
    ): FeedbackProcessingSummary {
        return {
            totalItems: manualQueue.highPriority.length + manualQueue.mediumPriority.length + manualQueue.lowPriority.length,
            autoResolved: autoResolution.resolvedItems.length,
            manualQueue: manualQueue.highPriority.length + manualQueue.mediumPriority.length,
            autoResolutionRate: autoResolution.autoResolutionRate,
            status: this.determineProcessingStatus(manualQueue, autoResolution)
        };
    }

    private determineProcessingStatus(
        manualQueue: ManualProcessingQueue,
        autoResolution: AutoResolutionResult
    ): 'excellent' | 'good' | 'fair' | 'poor' {
        const autoRate = autoResolution.autoResolutionRate;
        const manualCount = manualQueue.highPriority.length + manualQueue.mediumPriority.length;

        if (autoRate >= 0.7 && manualCount <= 5) return 'excellent';
        if (autoRate >= 0.5 && manualCount <= 10) return 'good';
        if (autoRate >= 0.3 && manualCount <= 20) return 'fair';
        return 'poor';
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface FeedbackProcessingResult {
    classification: FeedbackClassification;
    actionItems: ActionItem[];
    prioritization: ActionItemPrioritization;
    autoResolution: AutoResolutionResult;
    manualQueue: ManualProcessingQueue;
    notifications: NotificationResult;
    tracking: ProgressTracking;
    report: string;
    summary: FeedbackProcessingSummary;
}

interface FeedbackClassification {
    categories: Record<string, number>;
    types: Record<string, number>;
    priorities: Record<string, number>;
    sources: Record<string, number>;
    sentiments: Record<string, number>;
    classifications: FeedbackItemClassification[];
}

interface FeedbackItemClassification {
    id: string;
    category: string;
    type: string;
    priority: string;
    source: string;
    sentiment: string;
    confidence: number;
    tags: string[];
    requiresAction: boolean;
    estimatedEffort: string;
}

interface ActionItem {
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    category: string;
    assignedTo?: string;
    estimatedEffort: string;
    dueDate: Date;
    dependencies: string[];
    successCriteria: string[];
    status: string;
    createdAt: Date;
    updatedAt: Date;
    priorityScore?: number;
}

interface ActionItemPrioritization {
    prioritizedItems: ActionItem[];
    priorityFactors: Record<string, number>;
    conflicts: PriorityConflict[];
    recommendations: string[];
}

interface PriorityConflict {
    item1: string;
    item2: string;
    conflict: string;
    resolution: string;
}

interface AutoResolutionResult {
    resolvedItems: ItemResolution[];
    failedItems: ItemResolution[];
    partialResolutions: ItemResolution[];
    autoResolutionRate: number;
    recommendations: string[];
}

interface ItemResolution {
    itemId: string;
    success: boolean;
    partial: boolean;
    error?: string;
    resolution?: any;
}

interface ManualProcessingQueue {
    highPriority: any[];
    mediumPriority: any[];
    lowPriority: any[];
    assignedItems: any[];
    unassignedItems: any[];
    estimatedWorkload: Record<string, number>;
    recommendations: string[];
}

interface NotificationResult {
    sentNotifications: Notification[];
    escalatedItems: any[];
    notificationChannels: Record<string, number>;
    successRate: number;
    recommendations: string[];
}

interface Notification {
    id: string;
    itemId: string;
    type: string;
    recipient: string;
    message: string;
    success: boolean;
    timestamp: Date;
}

interface ProgressTracking {
    trackingItems: any[];
    metrics: Record<string, number>;
    alerts: Alert[];
    reports: Report[];
    recommendations: string[];
}

interface Alert {
    id: string;
    type: string;
    condition: string;
    message: string;
    enabled: boolean;
}

interface Report {
    id: string;
    type: string;
    frequency: string;
    recipients: string[];
    enabled: boolean;
}

interface FeedbackProcessingSummary {
    totalItems: number;
    autoResolved: number;
    manualQueue: number;
    autoResolutionRate: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
}
