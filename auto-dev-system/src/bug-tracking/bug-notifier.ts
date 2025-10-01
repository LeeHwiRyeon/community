import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { Bug } from '@/types';

export class BugNotifier {
    private openai: OpenAI;
    private projectPath: string;
    private notificationChannels: NotificationChannel[];

    constructor(apiKey: string, projectPath: string = './generated-projects') {
        this.openai = new OpenAI({ apiKey });
        this.projectPath = projectPath;
        this.notificationChannels = this.initializeNotificationChannels();
    }

    /**
     * 버그 알림 실행
     */
    async sendBugNotifications(bugs: Bug[]): Promise<NotificationResult> {
        console.log('📢 버그 알림 전송 시작...');

        try {
            const result: NotificationResult = {
                sentNotifications: [],
                failedNotifications: [],
                notificationChannels: {},
                successRate: 0,
                recommendations: []
            };

            // 버그별 알림 전송
            for (const bug of bugs) {
                const notifications = await this.sendBugNotification(bug);
                result.sentNotifications.push(...notifications);
            }

            // 실패한 알림 수집
            result.failedNotifications = result.sentNotifications.filter(n => !n.success);

            // 성공률 계산
            result.successRate = result.sentNotifications.filter(n => n.success).length /
                result.sentNotifications.length;

            // 알림 채널별 통계
            result.notificationChannels = this.calculateChannelStatistics(result.sentNotifications);

            // 권장사항 생성
            result.recommendations = this.generateNotificationRecommendations(result);

            // 알림 리포트 생성
            const report = await this.generateNotificationReport(result);
            result.report = report;

            console.log(`✅ 버그 알림 완료 - 성공: ${result.sentNotifications.filter(n => n.success).length}, 실패: ${result.failedNotifications.length}`);

            return result;

        } catch (error) {
            console.error('❌ 버그 알림 실패:', error);
            throw error;
        }
    }

    /**
     * 개별 버그 알림 전송
     */
    private async sendBugNotification(bug: Bug): Promise<Notification[]> {
        console.log(`📢 버그 알림 전송: ${bug.title}`);

        const notifications: Notification[] = [];

        // 알림 대상 결정
        const recipients = this.determineRecipients(bug);

        // 각 수신자에게 알림 전송
        for (const recipient of recipients) {
            const notification = await this.sendNotificationToRecipient(bug, recipient);
            notifications.push(notification);
        }

        return notifications;
    }

    /**
     * 알림 대상 결정
     */
    private determineRecipients(bug: Bug): NotificationRecipient[] {
        const recipients: NotificationRecipient[] = [];

        // 심각도별 기본 수신자
        switch (bug.severity) {
            case 'critical':
                recipients.push(
                    { type: 'email', address: 'dev-team@company.com', priority: 'high' },
                    { type: 'slack', channel: '#critical-bugs', priority: 'high' },
                    { type: 'sms', phone: '+1234567890', priority: 'high' }
                );
                break;
            case 'high':
                recipients.push(
                    { type: 'email', address: 'dev-team@company.com', priority: 'medium' },
                    { type: 'slack', channel: '#bugs', priority: 'medium' }
                );
                break;
            case 'medium':
                recipients.push(
                    { type: 'email', address: 'dev-team@company.com', priority: 'low' },
                    { type: 'slack', channel: '#bugs', priority: 'low' }
                );
                break;
            case 'low':
                recipients.push(
                    { type: 'email', address: 'dev-team@company.com', priority: 'low' }
                );
                break;
        }

        // 카테고리별 추가 수신자
        switch (bug.category) {
            case 'security_vulnerability':
                recipients.push(
                    { type: 'email', address: 'security-team@company.com', priority: 'high' }
                );
                break;
            case 'performance_issue':
                recipients.push(
                    { type: 'email', address: 'performance-team@company.com', priority: 'medium' }
                );
                break;
            case 'memory_leak':
                recipients.push(
                    { type: 'email', address: 'backend-team@company.com', priority: 'medium' }
                );
                break;
        }

        return recipients;
    }

    /**
     * 수신자에게 알림 전송
     */
    private async sendNotificationToRecipient(
        bug: Bug,
        recipient: NotificationRecipient
    ): Promise<Notification> {
        console.log(`📧 ${recipient.type} 알림 전송: ${recipient.address || recipient.channel}`);

        try {
            // 알림 메시지 생성
            const message = await this.generateNotificationMessage(bug, recipient);

            // 알림 전송
            const success = await this.deliverNotification(recipient, message);

            return {
                id: this.generateId(),
                bugId: bug.id,
                recipient,
                message,
                success,
                timestamp: new Date(),
                error: success ? null : 'Failed to deliver notification'
            };

        } catch (error) {
            return {
                id: this.generateId(),
                bugId: bug.id,
                recipient,
                message: '',
                success: false,
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * 알림 메시지 생성
     */
    private async generateNotificationMessage(
        bug: Bug,
        recipient: NotificationRecipient
    ): Promise<NotificationMessage> {
        const prompt = `
    다음 버그에 대한 알림 메시지를 생성해주세요:
    
    버그 정보:
    - 제목: ${bug.title}
    - 설명: ${bug.description}
    - 심각도: ${bug.severity}
    - 파일: ${bug.file}
    - 라인: ${bug.line}
    - 카테고리: ${bug.category}
    - 신뢰도: ${bug.confidence}
    
    수신자 정보:
    - 타입: ${recipient.type}
    - 우선순위: ${recipient.priority}
    
    다음 형식으로 응답해주세요:
    {
      "subject": "알림 제목",
      "body": "알림 내용",
      "priority": "high|medium|low",
      "urgency": "immediate|urgent|normal|low",
      "actionRequired": true|false,
      "estimatedFixTime": "예상 수정 시간"
    }
    `;

        try {
            const chatCompletion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: "json_object" },
            });

            const content = chatCompletion.choices[0].message.content;
            if (!content) {
                throw new Error("No content received from OpenAI for notification message generation.");
            }

            const messageData = JSON.parse(content);

            return {
                subject: messageData.subject,
                body: messageData.body,
                priority: messageData.priority,
                urgency: messageData.urgency,
                actionRequired: messageData.actionRequired,
                estimatedFixTime: messageData.estimatedFixTime,
                bugInfo: {
                    id: bug.id,
                    title: bug.title,
                    severity: bug.severity,
                    file: bug.file,
                    line: bug.line,
                    category: bug.category
                }
            };

        } catch (error) {
            console.error("Error generating notification message with OpenAI:", error);

            // 폴백 메시지 생성
            return {
                subject: `Bug Alert: ${bug.title}`,
                body: `A ${bug.severity} severity bug has been detected:\n\n${bug.description}\n\nFile: ${bug.file}:${bug.line}`,
                priority: bug.severity === 'critical' ? 'high' : 'medium',
                urgency: bug.severity === 'critical' ? 'immediate' : 'normal',
                actionRequired: bug.severity === 'critical' || bug.severity === 'high',
                estimatedFixTime: this.estimateFixTime(bug),
                bugInfo: {
                    id: bug.id,
                    title: bug.title,
                    severity: bug.severity,
                    file: bug.file,
                    line: bug.line,
                    category: bug.category
                }
            };
        }
    }

    /**
     * 알림 전송
     */
    private async deliverNotification(
        recipient: NotificationRecipient,
        message: NotificationMessage
    ): Promise<boolean> {
        try {
            switch (recipient.type) {
                case 'email':
                    return await this.sendEmail(recipient.address!, message);
                case 'slack':
                    return await this.sendSlack(recipient.channel!, message);
                case 'sms':
                    return await this.sendSMS(recipient.phone!, message);
                case 'webhook':
                    return await this.sendWebhook(recipient.webhook!, message);
                default:
                    console.warn(`Unknown notification type: ${recipient.type}`);
                    return false;
            }
        } catch (error) {
            console.error(`Failed to deliver ${recipient.type} notification:`, error);
            return false;
        }
    }

    /**
     * 이메일 전송
     */
    private async sendEmail(address: string, message: NotificationMessage): Promise<boolean> {
        // 실제 구현에서는 이메일 서비스 사용 (SendGrid, AWS SES 등)
        console.log(`📧 Email sent to ${address}: ${message.subject}`);
        return true;
    }

    /**
     * Slack 전송
     */
    private async sendSlack(channel: string, message: NotificationMessage): Promise<boolean> {
        // 실제 구현에서는 Slack API 사용
        console.log(`💬 Slack message sent to ${channel}: ${message.subject}`);
        return true;
    }

    /**
     * SMS 전송
     */
    private async sendSMS(phone: string, message: NotificationMessage): Promise<boolean> {
        // 실제 구현에서는 SMS 서비스 사용 (Twilio, AWS SNS 등)
        console.log(`📱 SMS sent to ${phone}: ${message.subject}`);
        return true;
    }

    /**
     * Webhook 전송
     */
    private async sendWebhook(webhook: string, message: NotificationMessage): Promise<boolean> {
        // 실제 구현에서는 HTTP POST 요청
        console.log(`🔗 Webhook sent to ${webhook}: ${message.subject}`);
        return true;
    }

    /**
     * 수정 시간 추정
     */
    private estimateFixTime(bug: Bug): string {
        switch (bug.severity) {
            case 'critical':
                return '1-2 hours';
            case 'high':
                return '4-8 hours';
            case 'medium':
                return '1-2 days';
            case 'low':
                return '1 week';
            default:
                return 'Unknown';
        }
    }

    /**
     * 알림 채널 초기화
     */
    private initializeNotificationChannels(): NotificationChannel[] {
        return [
            {
                type: 'email',
                name: 'Email Notifications',
                enabled: true,
                config: {
                    smtp: {
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false
                    }
                }
            },
            {
                type: 'slack',
                name: 'Slack Notifications',
                enabled: true,
                config: {
                    webhook: 'https://hooks.slack.com/services/...',
                    channels: ['#bugs', '#critical-bugs']
                }
            },
            {
                type: 'sms',
                name: 'SMS Notifications',
                enabled: true,
                config: {
                    provider: 'twilio',
                    accountSid: 'AC...',
                    authToken: '...'
                }
            },
            {
                type: 'webhook',
                name: 'Webhook Notifications',
                enabled: true,
                config: {
                    endpoints: ['https://api.company.com/bug-notifications']
                }
            }
        ];
    }

    /**
     * 채널별 통계 계산
     */
    private calculateChannelStatistics(notifications: Notification[]): Record<string, ChannelStatistics> {
        const stats: Record<string, ChannelStatistics> = {};

        for (const notification of notifications) {
            const channel = notification.recipient.type;

            if (!stats[channel]) {
                stats[channel] = {
                    total: 0,
                    successful: 0,
                    failed: 0,
                    successRate: 0
                };
            }

            stats[channel].total++;
            if (notification.success) {
                stats[channel].successful++;
            } else {
                stats[channel].failed++;
            }
        }

        // 성공률 계산
        for (const channel in stats) {
            stats[channel].successRate = stats[channel].successful / stats[channel].total;
        }

        return stats;
    }

    /**
     * 알림 권장사항 생성
     */
    private generateNotificationRecommendations(result: NotificationResult): string[] {
        const recommendations: string[] = [];

        if (result.successRate < 0.8) {
            recommendations.push('알림 전송 성공률이 낮습니다. 알림 서비스를 점검하세요.');
        }

        for (const [channel, stats] of Object.entries(result.notificationChannels)) {
            if (stats.successRate < 0.7) {
                recommendations.push(`${channel} 채널의 성공률이 낮습니다. 설정을 확인하세요.`);
            }
        }

        if (result.failedNotifications.length > 0) {
            recommendations.push('실패한 알림들을 재전송하거나 대체 채널을 사용하세요.');
        }

        return recommendations;
    }

    /**
     * 알림 리포트 생성
     */
    private async generateNotificationReport(result: NotificationResult): Promise<string> {
        const report = {
            summary: {
                totalNotifications: result.sentNotifications.length,
                successfulNotifications: result.sentNotifications.filter(n => n.success).length,
                failedNotifications: result.failedNotifications.length,
                successRate: result.successRate
            },
            channelStatistics: result.notificationChannels,
            notifications: result.sentNotifications,
            recommendations: result.recommendations,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'bug-notification-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface NotificationResult {
    sentNotifications: Notification[];
    failedNotifications: Notification[];
    notificationChannels: Record<string, ChannelStatistics>;
    successRate: number;
    recommendations: string[];
    report?: string;
}

interface Notification {
    id: string;
    bugId: string;
    recipient: NotificationRecipient;
    message: NotificationMessage;
    success: boolean;
    timestamp: Date;
    error: string | null;
}

interface NotificationRecipient {
    type: 'email' | 'slack' | 'sms' | 'webhook';
    address?: string;
    channel?: string;
    phone?: string;
    webhook?: string;
    priority: 'high' | 'medium' | 'low';
}

interface NotificationMessage {
    subject: string;
    body: string;
    priority: 'high' | 'medium' | 'low';
    urgency: 'immediate' | 'urgent' | 'normal' | 'low';
    actionRequired: boolean;
    estimatedFixTime: string;
    bugInfo: {
        id: string;
        title: string;
        severity: string;
        file: string;
        line: number;
        category: string;
    };
}

interface NotificationChannel {
    type: string;
    name: string;
    enabled: boolean;
    config: Record<string, any>;
}

interface ChannelStatistics {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
}
