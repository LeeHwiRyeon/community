const { EventEmitter } = require('events');
const nodemailer = require('nodemailer');
const axios = require('axios');

class AlertService extends EventEmitter {
    constructor() {
        super();
        this.alertChannels = {
            email: null,
            slack: null,
            webhook: null,
            sms: null,
        };
        this.alertRules = [];
        this.alertHistory = [];
        this.isEnabled = true;
    }

    // 알림 채널 설정
    setupEmailChannel(config) {
        this.alertChannels.email = nodemailer.createTransporter({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.user,
                pass: config.pass,
            },
        });
        console.log('이메일 알림 채널이 설정되었습니다.');
    }

    setupSlackChannel(config) {
        this.alertChannels.slack = {
            webhookUrl: config.webhookUrl,
            channel: config.channel || '#alerts',
            username: config.username || 'AlertBot',
        };
        console.log('Slack 알림 채널이 설정되었습니다.');
    }

    setupWebhookChannel(config) {
        this.alertChannels.webhook = {
            url: config.url,
            headers: config.headers || {},
            timeout: config.timeout || 5000,
        };
        console.log('Webhook 알림 채널이 설정되었습니다.');
    }

    setupSMSChannel(config) {
        this.alertChannels.sms = {
            apiKey: config.apiKey,
            from: config.from,
            provider: config.provider || 'twilio',
        };
        console.log('SMS 알림 채널이 설정되었습니다.');
    }

    // 알림 규칙 추가
    addAlertRule(rule) {
        const alertRule = {
            id: rule.id || `rule_${Date.now()}`,
            name: rule.name,
            condition: rule.condition,
            severity: rule.severity || 'warning',
            channels: rule.channels || ['email'],
            cooldown: rule.cooldown || 300000, // 5분
            enabled: rule.enabled !== false,
            lastTriggered: null,
            ...rule,
        };

        this.alertRules.push(alertRule);
        console.log(`알림 규칙이 추가되었습니다: ${alertRule.name}`);
    }

    // 알림 규칙 제거
    removeAlertRule(ruleId) {
        this.alertRules = this.alertRules.filter(rule => rule.id !== ruleId);
        console.log(`알림 규칙이 제거되었습니다: ${ruleId}`);
    }

    // 알림 규칙 업데이트
    updateAlertRule(ruleId, updates) {
        const ruleIndex = this.alertRules.findIndex(rule => rule.id === ruleId);
        if (ruleIndex !== -1) {
            this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
            console.log(`알림 규칙이 업데이트되었습니다: ${ruleId}`);
        }
    }

    // 알림 규칙 활성화/비활성화
    toggleAlertRule(ruleId, enabled) {
        const rule = this.alertRules.find(rule => rule.id === ruleId);
        if (rule) {
            rule.enabled = enabled;
            console.log(`알림 규칙이 ${enabled ? '활성화' : '비활성화'}되었습니다: ${ruleId}`);
        }
    }

    // 알림 처리
    async processAlert(alert) {
        if (!this.isEnabled) {
            console.log('알림 서비스가 비활성화되어 있습니다.');
            return;
        }

        // 알림 규칙 확인
        const triggeredRules = this.alertRules.filter(rule => {
            if (!rule.enabled) return false;

            // 쿨다운 확인
            if (rule.lastTriggered &&
                Date.now() - rule.lastTriggered < rule.cooldown) {
                return false;
            }

            // 조건 확인
            return this.evaluateCondition(rule.condition, alert);
        });

        if (triggeredRules.length === 0) {
            return;
        }

        // 알림 발송
        for (const rule of triggeredRules) {
            await this.sendAlert(alert, rule);
            rule.lastTriggered = Date.now();
        }

        // 알림 히스토리에 추가
        this.alertHistory.push({
            ...alert,
            triggeredRules: triggeredRules.map(rule => rule.id),
            timestamp: new Date().toISOString(),
        });

        // 최대 1000개 알림 히스토리만 유지
        if (this.alertHistory.length > 1000) {
            this.alertHistory = this.alertHistory.slice(-1000);
        }
    }

    // 조건 평가
    evaluateCondition(condition, alert) {
        try {
            // 간단한 조건 평가 (실제 구현에서는 더 복잡한 조건 지원)
            if (condition.type === 'threshold') {
                return alert.value > condition.value;
            }

            if (condition.type === 'equals') {
                return alert[condition.field] === condition.value;
            }

            if (condition.type === 'contains') {
                return alert[condition.field] &&
                    alert[condition.field].toString().includes(condition.value);
            }

            if (condition.type === 'custom') {
                // 커스텀 조건 함수 실행
                return condition.function(alert);
            }

            return false;
        } catch (error) {
            console.error('조건 평가 중 오류:', error);
            return false;
        }
    }

    // 알림 발송
    async sendAlert(alert, rule) {
        const alertMessage = this.formatAlertMessage(alert, rule);

        for (const channel of rule.channels) {
            try {
                switch (channel) {
                    case 'email':
                        await this.sendEmailAlert(alertMessage, rule);
                        break;
                    case 'slack':
                        await this.sendSlackAlert(alertMessage, rule);
                        break;
                    case 'webhook':
                        await this.sendWebhookAlert(alertMessage, rule);
                        break;
                    case 'sms':
                        await this.sendSMSAlert(alertMessage, rule);
                        break;
                    default:
                        console.warn(`알 수 없는 알림 채널: ${channel}`);
                }
            } catch (error) {
                console.error(`${channel} 알림 발송 실패:`, error);
            }
        }
    }

    // 알림 메시지 포맷팅
    formatAlertMessage(alert, rule) {
        const severity = alert.severity || rule.severity;
        const emoji = this.getSeverityEmoji(severity);

        return {
            title: `${emoji} ${rule.name}`,
            message: alert.message,
            severity: severity,
            timestamp: new Date().toISOString(),
            value: alert.value,
            threshold: alert.threshold,
            metadata: {
                ruleId: rule.id,
                ruleName: rule.name,
                alertType: alert.type,
                ...alert.metadata,
            },
        };
    }

    // 심각도별 이모지
    getSeverityEmoji(severity) {
        const emojis = {
            info: 'ℹ️',
            warning: '⚠️',
            critical: '🚨',
            error: '❌',
            success: '✅',
        };
        return emojis[severity] || '📢';
    }

    // 이메일 알림 발송
    async sendEmailAlert(alertMessage, rule) {
        if (!this.alertChannels.email) {
            console.warn('이메일 채널이 설정되지 않았습니다.');
            return;
        }

        const mailOptions = {
            from: process.env.ALERT_EMAIL_FROM || 'alerts@community-platform.com',
            to: rule.emailRecipients || process.env.ALERT_EMAIL_TO,
            subject: alertMessage.title,
            html: this.generateEmailTemplate(alertMessage),
        };

        await this.alertChannels.email.sendMail(mailOptions);
        console.log('이메일 알림이 발송되었습니다.');
    }

    // Slack 알림 발송
    async sendSlackAlert(alertMessage, rule) {
        if (!this.alertChannels.slack) {
            console.warn('Slack 채널이 설정되지 않았습니다.');
            return;
        }

        const payload = {
            channel: this.alertChannels.slack.channel,
            username: this.alertChannels.slack.username,
            text: alertMessage.title,
            attachments: [{
                color: this.getSeverityColor(alertMessage.severity),
                fields: [
                    { title: '메시지', value: alertMessage.message, short: false },
                    { title: '심각도', value: alertMessage.severity, short: true },
                    { title: '시간', value: alertMessage.timestamp, short: true },
                ],
            }],
        };

        await axios.post(this.alertChannels.slack.webhookUrl, payload);
        console.log('Slack 알림이 발송되었습니다.');
    }

    // Webhook 알림 발송
    async sendWebhookAlert(alertMessage, rule) {
        if (!this.alertChannels.webhook) {
            console.warn('Webhook 채널이 설정되지 않았습니다.');
            return;
        }

        const payload = {
            alert: alertMessage,
            rule: {
                id: rule.id,
                name: rule.name,
            },
        };

        await axios.post(this.alertChannels.webhook.url, payload, {
            headers: this.alertChannels.webhook.headers,
            timeout: this.alertChannels.webhook.timeout,
        });
        console.log('Webhook 알림이 발송되었습니다.');
    }

    // SMS 알림 발송
    async sendSMSAlert(alertMessage, rule) {
        if (!this.alertChannels.sms) {
            console.warn('SMS 채널이 설정되지 않았습니다.');
            return;
        }

        // Twilio 예시 (실제 구현에서는 선택한 SMS 제공업체 사용)
        if (this.alertChannels.sms.provider === 'twilio') {
            const twilio = require('twilio');
            const client = twilio(this.alertChannels.sms.apiKey, process.env.TWILIO_AUTH_TOKEN);

            await client.messages.create({
                body: `${alertMessage.title}: ${alertMessage.message}`,
                from: this.alertChannels.sms.from,
                to: rule.smsRecipients || process.env.ALERT_SMS_TO,
            });
        }

        console.log('SMS 알림이 발송되었습니다.');
    }

    // 심각도별 색상
    getSeverityColor(severity) {
        const colors = {
            info: 'good',
            warning: 'warning',
            critical: 'danger',
            error: 'danger',
            success: 'good',
        };
        return colors[severity] || 'good';
    }

    // 이메일 템플릿 생성
    generateEmailTemplate(alertMessage) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${alertMessage.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .alert { border-left: 4px solid #ff6b6b; padding: 20px; background: #f8f9fa; }
          .alert.critical { border-color: #dc3545; }
          .alert.warning { border-color: #ffc107; }
          .alert.info { border-color: #17a2b8; }
          .alert.success { border-color: #28a745; }
          .header { background: #343a40; color: white; padding: 15px; margin: -20px -20px 20px -20px; }
          .content { margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="alert ${alertMessage.severity}">
          <div class="header">
            <h2>${alertMessage.title}</h2>
          </div>
          <div class="content">
            <p><strong>메시지:</strong> ${alertMessage.message}</p>
            <p><strong>심각도:</strong> ${alertMessage.severity}</p>
            <p><strong>시간:</strong> ${alertMessage.timestamp}</p>
            ${alertMessage.value ? `<p><strong>값:</strong> ${alertMessage.value}</p>` : ''}
            ${alertMessage.threshold ? `<p><strong>임계값:</strong> ${alertMessage.threshold}</p>` : ''}
          </div>
          <div class="footer">
            <p>이 알림은 커뮤니티 플랫폼 모니터링 시스템에서 자동으로 발송되었습니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    // 알림 히스토리 조회
    getAlertHistory(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.alertHistory.filter(alert =>
            new Date(alert.timestamp) > cutoff
        );
    }

    // 알림 통계
    getAlertStats() {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const alerts24h = this.alertHistory.filter(alert =>
            new Date(alert.timestamp) > last24h
        );
        const alerts7d = this.alertHistory.filter(alert =>
            new Date(alert.timestamp) > last7d
        );

        const severityCounts = this.alertHistory.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
        }, {});

        return {
            total: this.alertHistory.length,
            last24h: alerts24h.length,
            last7d: alerts7d.length,
            bySeverity: severityCounts,
            activeRules: this.alertRules.filter(rule => rule.enabled).length,
            totalRules: this.alertRules.length,
        };
    }

    // 알림 서비스 활성화/비활성화
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`알림 서비스가 ${enabled ? '활성화' : '비활성화'}되었습니다.`);
    }

    // 알림 서비스 상태
    getStatus() {
        return {
            enabled: this.isEnabled,
            channels: Object.keys(this.alertChannels).filter(
                channel => this.alertChannels[channel] !== null
            ),
            rules: this.alertRules.length,
            activeRules: this.alertRules.filter(rule => rule.enabled).length,
            history: this.alertHistory.length,
        };
    }

    // 알림 규칙 목록
    getAlertRules() {
        return this.alertRules.map(rule => ({
            id: rule.id,
            name: rule.name,
            severity: rule.severity,
            channels: rule.channels,
            enabled: rule.enabled,
            lastTriggered: rule.lastTriggered,
        }));
    }
}

module.exports = AlertService;
