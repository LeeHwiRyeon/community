import { logger } from '../utils/logger.js';
import nodemailer from 'nodemailer';
import webpush from 'web-push';
import axios from 'axios';

/**
 * 고급 알림 시스템
 * - 다중 채널 알림 (이메일, 푸시, SMS, 슬랙, 디스코드)
 * - 스마트 필터링 및 우선순위
 * - 알림 템플릿 관리
 * - 실시간 알림 전송
 * - 알림 분석 및 최적화
 */

class AdvancedNotificationService {
    constructor() {
        this.channels = new Map();
        this.templates = new Map();
        this.rules = new Map();
        this.analytics = {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            failed: 0
        };

        this.initializeChannels();
        this.initializeTemplates();
        this.initializeRules();
    }

    /**
     * 알림 채널 초기화
     */
    initializeChannels() {
        // 이메일 채널
        this.channels.set('email', {
            enabled: true,
            config: {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            },
            transporter: null
        });

        // 푸시 알림 채널
        this.channels.set('push', {
            enabled: true,
            config: {
                vapidKeys: {
                    publicKey: process.env.VAPID_PUBLIC_KEY,
                    privateKey: process.env.VAPID_PRIVATE_KEY,
                    subject: process.env.VAPID_SUBJECT || 'mailto:admin@community.com'
                }
            }
        });

        // SMS 채널 (Twilio)
        this.channels.set('sms', {
            enabled: true,
            config: {
                accountSid: process.env.TWILIO_ACCOUNT_SID,
                authToken: process.env.TWILIO_AUTH_TOKEN,
                from: process.env.TWILIO_FROM_NUMBER
            }
        });

        // 슬랙 채널
        this.channels.set('slack', {
            enabled: true,
            config: {
                webhookUrl: process.env.SLACK_WEBHOOK_URL,
                channel: process.env.SLACK_CHANNEL || '#alerts'
            }
        });

        // 디스코드 채널
        this.channels.set('discord', {
            enabled: true,
            config: {
                webhookUrl: process.env.DISCORD_WEBHOOK_URL
            }
        });

        // 웹훅 채널
        this.channels.set('webhook', {
            enabled: true,
            config: {
                endpoints: process.env.WEBHOOK_ENDPOINTS ? JSON.parse(process.env.WEBHOOK_ENDPOINTS) : []
            }
        });
    }

    /**
     * 알림 템플릿 초기화
     */
    initializeTemplates() {
        // 이메일 템플릿
        this.templates.set('email', {
            'welcome': {
                subject: '{{siteName}}에 오신 것을 환영합니다!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">{{siteName}}에 오신 것을 환영합니다!</h2>
                        <p>안녕하세요 {{userName}}님,</p>
                        <p>{{siteName}}에 가입해주셔서 감사합니다. 이제 다양한 기능을 이용하실 수 있습니다.</p>
                        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
                            <h3>시작하기</h3>
                            <ul>
                                <li>프로필을 완성해보세요</li>
                                <li>관심 있는 카테고리를 탐색해보세요</li>
                                <li>다른 사용자들과 소통해보세요</li>
                            </ul>
                        </div>
                        <p><a href="{{siteUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">지금 시작하기</a></p>
                        <p>감사합니다,<br>{{siteName}} 팀</p>
                    </div>
                `,
                text: '{{siteName}}에 오신 것을 환영합니다! {{userName}}님, 가입해주셔서 감사합니다.'
            },
            'post_comment': {
                subject: '{{postTitle}}에 새 댓글이 달렸습니다',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">새 댓글이 달렸습니다</h2>
                        <p>안녕하세요 {{userName}}님,</p>
                        <p><strong>{{commentAuthor}}</strong>님이 귀하의 게시글 "<strong>{{postTitle}}</strong>"에 댓글을 남겼습니다.</p>
                        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
                            <p style="margin: 0;">{{commentContent}}</p>
                        </div>
                        <p><a href="{{postUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">댓글 보기</a></p>
                    </div>
                `,
                text: '{{commentAuthor}}님이 {{postTitle}}에 댓글을 남겼습니다: {{commentContent}}'
            },
            'system_alert': {
                subject: '🚨 {{alertType}} - {{siteName}}',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #dc3545;">🚨 시스템 알림</h2>
                        <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; margin: 20px 0; border-radius: 5px;">
                            <h3 style="color: #721c24; margin-top: 0;">{{alertTitle}}</h3>
                            <p style="color: #721c24; margin-bottom: 0;">{{alertMessage}}</p>
                        </div>
                        <p><strong>시간:</strong> {{timestamp}}</p>
                        <p><strong>서버:</strong> {{serverName}}</p>
                        <p><a href="{{dashboardUrl}}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">대시보드 보기</a></p>
                    </div>
                `,
                text: '🚨 {{alertType}}: {{alertMessage}} ({{timestamp}})'
            }
        });

        // 푸시 알림 템플릿
        this.templates.set('push', {
            'welcome': {
                title: '{{siteName}}에 오신 것을 환영합니다!',
                body: '{{userName}}님, 가입해주셔서 감사합니다. 지금 시작해보세요!',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/badge-72x72.png',
                data: {
                    url: '{{siteUrl}}',
                    type: 'welcome'
                }
            },
            'post_comment': {
                title: '새 댓글',
                body: '{{commentAuthor}}님이 {{postTitle}}에 댓글을 남겼습니다',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/badge-72x72.png',
                data: {
                    url: '{{postUrl}}',
                    type: 'comment'
                }
            },
            'system_alert': {
                title: '🚨 {{alertType}}',
                body: '{{alertMessage}}',
                icon: '/icons/alert-192x192.png',
                badge: '/icons/badge-72x72.png',
                data: {
                    url: '{{dashboardUrl}}',
                    type: 'alert'
                }
            }
        });

        // SMS 템플릿
        this.templates.set('sms', {
            'welcome': '{{siteName}}에 오신 것을 환영합니다! {{userName}}님, 가입해주셔서 감사합니다.',
            'post_comment': '{{commentAuthor}}님이 {{postTitle}}에 댓글을 남겼습니다: {{commentContent}}',
            'system_alert': '🚨 {{alertType}}: {{alertMessage}} ({{timestamp}})'
        });

        // 슬랙 템플릿
        this.templates.set('slack', {
            'welcome': {
                text: '새 사용자 가입',
                attachments: [{
                    color: 'good',
                    fields: [{
                        title: '사용자',
                        value: '{{userName}} ({{userEmail}})',
                        short: true
                    }, {
                        title: '가입 시간',
                        value: '{{timestamp}}',
                        short: true
                    }]
                }]
            },
            'post_comment': {
                text: '새 댓글 알림',
                attachments: [{
                    color: '#36a64f',
                    fields: [{
                        title: '게시글',
                        value: '{{postTitle}}',
                        short: false
                    }, {
                        title: '댓글 작성자',
                        value: '{{commentAuthor}}',
                        short: true
                    }, {
                        title: '댓글 내용',
                        value: '{{commentContent}}',
                        short: false
                    }]
                }]
            },
            'system_alert': {
                text: '🚨 시스템 알림',
                attachments: [{
                    color: 'danger',
                    fields: [{
                        title: '알림 유형',
                        value: '{{alertType}}',
                        short: true
                    }, {
                        title: '서버',
                        value: '{{serverName}}',
                        short: true
                    }, {
                        title: '메시지',
                        value: '{{alertMessage}}',
                        short: false
                    }, {
                        title: '시간',
                        value: '{{timestamp}}',
                        short: true
                    }]
                }]
            }
        });
    }

    /**
     * 알림 규칙 초기화
     */
    initializeRules() {
        this.rules.set('user_preferences', {
            enabled: true,
            conditions: ['user_id', 'notification_type', 'channel'],
            action: 'filter_by_preferences'
        });

        this.rules.set('rate_limiting', {
            enabled: true,
            conditions: ['user_id', 'channel', 'time_window'],
            action: 'apply_rate_limit',
            config: {
                email: { max: 10, window: 3600 }, // 1시간에 최대 10개
                push: { max: 50, window: 3600 },  // 1시간에 최대 50개
                sms: { max: 5, window: 3600 }     // 1시간에 최대 5개
            }
        });

        this.rules.set('priority_routing', {
            enabled: true,
            conditions: ['priority', 'channel_availability'],
            action: 'route_by_priority',
            config: {
                critical: ['email', 'push', 'sms', 'slack'],
                high: ['email', 'push', 'slack'],
                medium: ['email', 'push'],
                low: ['email']
            }
        });

        this.rules.set('time_based_filtering', {
            enabled: true,
            conditions: ['user_timezone', 'notification_type'],
            action: 'filter_by_time',
            config: {
                quiet_hours: {
                    start: '22:00',
                    end: '08:00',
                    channels: ['push', 'sms'],
                    exceptions: ['critical', 'security']
                }
            }
        });
    }

    /**
     * 알림 전송
     */
    async sendNotification(notification) {
        try {
            const {
                userId,
                type,
                channels = ['email'],
                priority = 'medium',
                data = {},
                template = null,
                customMessage = null
            } = notification;

            // 알림 규칙 적용
            const processedNotification = await this.applyRules(notification);
            if (!processedNotification) {
                logger.info('알림이 규칙에 의해 필터링됨:', { userId, type });
                return { success: false, reason: 'filtered' };
            }

            // 템플릿 선택
            const selectedTemplate = template || this.selectTemplate(type, channels[0]);
            if (!selectedTemplate) {
                throw new Error(`템플릿을 찾을 수 없습니다: ${type}`);
            }

            // 채널별 전송
            const results = [];
            for (const channel of channels) {
                if (!this.channels.get(channel)?.enabled) {
                    logger.warning(`채널이 비활성화됨: ${channel}`);
                    continue;
                }

                try {
                    const result = await this.sendToChannel(channel, {
                        userId,
                        type,
                        priority,
                        data,
                        template: selectedTemplate,
                        customMessage
                    });

                    results.push({ channel, success: true, result });
                    this.analytics.sent++;
                } catch (error) {
                    logger.error(`채널 전송 실패: ${channel}`, error);
                    results.push({ channel, success: false, error: error.message });
                    this.analytics.failed++;
                }
            }

            // 결과 로깅
            logger.info('알림 전송 완료:', {
                userId,
                type,
                channels: results.map(r => ({ channel: r.channel, success: r.success }))
            });

            return {
                success: true,
                results,
                analytics: this.getAnalytics()
            };

        } catch (error) {
            logger.error('알림 전송 실패:', error);
            this.analytics.failed++;
            return { success: false, error: error.message };
        }
    }

    /**
     * 채널별 전송
     */
    async sendToChannel(channel, notification) {
        switch (channel) {
            case 'email':
                return await this.sendEmail(notification);
            case 'push':
                return await this.sendPush(notification);
            case 'sms':
                return await this.sendSMS(notification);
            case 'slack':
                return await this.sendSlack(notification);
            case 'discord':
                return await this.sendDiscord(notification);
            case 'webhook':
                return await this.sendWebhook(notification);
            default:
                throw new Error(`지원하지 않는 채널: ${channel}`);
        }
    }

    /**
     * 이메일 전송
     */
    async sendEmail(notification) {
        const { userId, type, data, template, customMessage } = notification;
        const channel = this.channels.get('email');

        if (!channel.transporter) {
            channel.transporter = nodemailer.createTransporter(channel.config);
        }

        const user = await this.getUser(userId);
        if (!user) {
            throw new Error('사용자를 찾을 수 없습니다');
        }

        const templateData = this.templates.get('email')[template];
        if (!templateData) {
            throw new Error(`이메일 템플릿을 찾을 수 없습니다: ${template}`);
        }

        const processedData = {
            ...data,
            userName: user.name,
            userEmail: user.email,
            siteName: process.env.SITE_NAME || 'Community Platform',
            siteUrl: process.env.SITE_URL || 'http://localhost:3000',
            timestamp: new Date().toLocaleString('ko-KR')
        };

        const subject = this.processTemplate(templateData.subject, processedData);
        const html = this.processTemplate(templateData.html, processedData);
        const text = this.processTemplate(templateData.text, processedData);

        const mailOptions = {
            from: process.env.SMTP_FROM || 'noreply@community.com',
            to: user.email,
            subject,
            html,
            text
        };

        const result = await channel.transporter.sendMail(mailOptions);
        this.analytics.delivered++;

        return {
            messageId: result.messageId,
            accepted: result.accepted,
            rejected: result.rejected
        };
    }

    /**
     * 푸시 알림 전송
     */
    async sendPush(notification) {
        const { userId, type, data, template, customMessage } = notification;
        const channel = this.channels.get('push');

        webpush.setVapidDetails(
            channel.config.vapidKeys.subject,
            channel.config.vapidKeys.publicKey,
            channel.config.vapidKeys.privateKey
        );

        const subscriptions = await this.getUserPushSubscriptions(userId);
        if (!subscriptions || subscriptions.length === 0) {
            throw new Error('푸시 구독이 없습니다');
        }

        const templateData = this.templates.get('push')[template];
        if (!templateData) {
            throw new Error(`푸시 템플릿을 찾을 수 없습니다: ${template}`);
        }

        const processedData = {
            ...data,
            timestamp: new Date().toLocaleString('ko-KR')
        };

        const payload = {
            title: this.processTemplate(templateData.title, processedData),
            body: this.processTemplate(templateData.body, processedData),
            icon: templateData.icon,
            badge: templateData.badge,
            data: this.processTemplateObject(templateData.data, processedData)
        };

        const results = [];
        for (const subscription of subscriptions) {
            try {
                const result = await webpush.sendNotification(
                    subscription,
                    JSON.stringify(payload)
                );
                results.push({ subscription: subscription.endpoint, success: true, result });
                this.analytics.delivered++;
            } catch (error) {
                logger.error('푸시 전송 실패:', error);
                results.push({ subscription: subscription.endpoint, success: false, error: error.message });
            }
        }

        return { results };
    }

    /**
     * SMS 전송
     */
    async sendSMS(notification) {
        const { userId, type, data, template, customMessage } = notification;
        const channel = this.channels.get('sms');

        const user = await this.getUser(userId);
        if (!user || !user.phone) {
            throw new Error('사용자 전화번호를 찾을 수 없습니다');
        }

        const templateData = this.templates.get('sms')[template];
        if (!templateData) {
            throw new Error(`SMS 템플릿을 찾을 수 없습니다: ${template}`);
        }

        const processedData = {
            ...data,
            userName: user.name,
            timestamp: new Date().toLocaleString('ko-KR')
        };

        const message = this.processTemplate(templateData, processedData);

        const response = await axios.post(
            `https://api.twilio.com/2010-04-01/Accounts/${channel.config.accountSid}/Messages.json`,
            new URLSearchParams({
                From: channel.config.from,
                To: user.phone,
                Body: message
            }),
            {
                auth: {
                    username: channel.config.accountSid,
                    password: channel.config.authToken
                }
            }
        );

        this.analytics.delivered++;
        return {
            sid: response.data.sid,
            status: response.data.status
        };
    }

    /**
     * 슬랙 전송
     */
    async sendSlack(notification) {
        const { userId, type, data, template, customMessage } = notification;
        const channel = this.channels.get('slack');

        const templateData = this.templates.get('slack')[template];
        if (!templateData) {
            throw new Error(`슬랙 템플릿을 찾을 수 없습니다: ${template}`);
        }

        const processedData = {
            ...data,
            timestamp: new Date().toLocaleString('ko-KR')
        };

        const payload = this.processTemplateObject(templateData, processedData);

        const response = await axios.post(channel.config.webhookUrl, payload);
        this.analytics.delivered++;

        return {
            status: response.status,
            data: response.data
        };
    }

    /**
     * 디스코드 전송
     */
    async sendDiscord(notification) {
        const { userId, type, data, template, customMessage } = notification;
        const channel = this.channels.get('discord');

        const processedData = {
            ...data,
            timestamp: new Date().toLocaleString('ko-KR')
        };

        const payload = {
            content: customMessage || this.processTemplate('{{alertMessage}}', processedData),
            embeds: [{
                title: this.processTemplate('{{alertType}}', processedData),
                description: this.processTemplate('{{alertMessage}}', processedData),
                color: 0xff0000,
                timestamp: new Date().toISOString(),
                fields: [
                    {
                        name: '서버',
                        value: this.processTemplate('{{serverName}}', processedData),
                        inline: true
                    },
                    {
                        name: '시간',
                        value: this.processTemplate('{{timestamp}}', processedData),
                        inline: true
                    }
                ]
            }]
        };

        const response = await axios.post(channel.config.webhookUrl, payload);
        this.analytics.delivered++;

        return {
            status: response.status,
            data: response.data
        };
    }

    /**
     * 웹훅 전송
     */
    async sendWebhook(notification) {
        const { userId, type, data, template, customMessage } = notification;
        const channel = this.channels.get('webhook');

        const payload = {
            userId,
            type,
            data,
            timestamp: new Date().toISOString(),
            message: customMessage
        };

        const results = [];
        for (const endpoint of channel.config.endpoints) {
            try {
                const response = await axios.post(endpoint, payload, {
                    timeout: 5000,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Community-Platform-Notifications/1.0'
                    }
                });

                results.push({ endpoint, success: true, status: response.status });
                this.analytics.delivered++;
            } catch (error) {
                logger.error('웹훅 전송 실패:', error);
                results.push({ endpoint, success: false, error: error.message });
            }
        }

        return { results };
    }

    /**
     * 알림 규칙 적용
     */
    async applyRules(notification) {
        // 사용자 선호도 필터링
        if (this.rules.get('user_preferences')?.enabled) {
            const userPreferences = await this.getUserNotificationPreferences(notification.userId);
            if (userPreferences && !userPreferences[notification.type]) {
                return null;
            }
        }

        // 속도 제한 적용
        if (this.rules.get('rate_limiting')?.enabled) {
            const isRateLimited = await this.checkRateLimit(notification);
            if (isRateLimited) {
                return null;
            }
        }

        // 시간 기반 필터링
        if (this.rules.get('time_based_filtering')?.enabled) {
            const isQuietTime = await this.checkQuietTime(notification);
            if (isQuietTime) {
                // 조용한 시간에는 중요한 알림만 전송
                if (!['critical', 'security'].includes(notification.priority)) {
                    return null;
                }
            }
        }

        return notification;
    }

    /**
     * 템플릿 선택
     */
    selectTemplate(type, channel) {
        const channelTemplates = this.templates.get(channel);
        if (!channelTemplates) {
            return null;
        }

        return channelTemplates[type] || channelTemplates['default'];
    }

    /**
     * 템플릿 처리
     */
    processTemplate(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] || match;
        });
    }

    /**
     * 객체 템플릿 처리
     */
    processTemplateObject(obj, data) {
        if (typeof obj === 'string') {
            return this.processTemplate(obj, data);
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.processTemplateObject(item, data));
        }

        if (typeof obj === 'object' && obj !== null) {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.processTemplateObject(value, data);
            }
            return result;
        }

        return obj;
    }

    /**
     * 헬퍼 메서드들
     */
    async getUser(userId) {
        // 실제로는 데이터베이스에서 사용자 정보 조회
        return {
            id: userId,
            name: 'Test User',
            email: 'test@example.com',
            phone: '+1234567890'
        };
    }

    async getUserPushSubscriptions(userId) {
        // 실제로는 데이터베이스에서 푸시 구독 정보 조회
        return [];
    }

    async getUserNotificationPreferences(userId) {
        // 실제로는 데이터베이스에서 사용자 알림 선호도 조회
        return {
            welcome: true,
            post_comment: true,
            system_alert: true
        };
    }

    async checkRateLimit(notification) {
        // 실제로는 Redis에서 속도 제한 확인
        return false;
    }

    async checkQuietTime(notification) {
        // 실제로는 사용자 시간대 기반 조용한 시간 확인
        const hour = new Date().getHours();
        return hour >= 22 || hour < 8;
    }

    /**
     * 분석 데이터 조회
     */
    getAnalytics() {
        return { ...this.analytics };
    }

    /**
     * 알림 통계 리셋
     */
    resetAnalytics() {
        this.analytics = {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            failed: 0
        };
    }
}

const advancedNotificationService = new AdvancedNotificationService();
export default advancedNotificationService;
