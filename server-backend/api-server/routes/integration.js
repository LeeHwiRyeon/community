const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const integrationService = require('../services/integrationService');

// 통합 서비스 목록 조회
router.get('/services', (req, res) => {
    try {
        const integrations = integrationService.getIntegrations();

        res.json({
            success: true,
            data: integrations
        });
    } catch (error) {
        logger.error('Get integrations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get integrations',
            error: error.message
        });
    }
});

// 특정 통합 서비스 조회
router.get('/services/:integrationId', (req, res) => {
    try {
        const { integrationId } = req.params;
        const integration = integrationService.getIntegration(integrationId);

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Integration not found'
            });
        }

        res.json({
            success: true,
            data: integration
        });
    } catch (error) {
        logger.error('Get integration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get integration',
            error: error.message
        });
    }
});

// 통합 서비스 상태 업데이트
router.put('/services/:integrationId/status', (req, res) => {
    try {
        const { integrationId } = req.params;
        const { status } = req.body;

        if (!status || !['active', 'inactive', 'error'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: active, inactive, error'
            });
        }

        integrationService.updateIntegrationStatus(integrationId, status);

        res.json({
            success: true,
            message: 'Integration status updated successfully'
        });
    } catch (error) {
        logger.error('Update integration status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update integration status',
            error: error.message
        });
    }
});

// Discord 메시지 전송
router.post('/discord/send', async (req, res) => {
    try {
        const { channelId, message, options } = req.body;

        if (!channelId || !message) {
            return res.status(400).json({
                success: false,
                message: 'Channel ID and message are required'
            });
        }

        const result = await integrationService.sendDiscordMessage(channelId, message, options);

        res.json({
            success: result.success,
            message: result.success ? 'Discord message sent successfully' : 'Failed to send Discord message',
            data: result.data,
            error: result.error
        });
    } catch (error) {
        logger.error('Send Discord message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send Discord message',
            error: error.message
        });
    }
});

// Slack 메시지 전송
router.post('/slack/send', async (req, res) => {
    try {
        const { channel, message, options } = req.body;

        if (!channel || !message) {
            return res.status(400).json({
                success: false,
                message: 'Channel and message are required'
            });
        }

        const result = await integrationService.sendSlackMessage(channel, message, options);

        res.json({
            success: result.success,
            message: result.success ? 'Slack message sent successfully' : 'Failed to send Slack message',
            data: result.data,
            error: result.error
        });
    } catch (error) {
        logger.error('Send Slack message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send Slack message',
            error: error.message
        });
    }
});

// GitHub 이슈 생성
router.post('/github/issues', async (req, res) => {
    try {
        const { repo, title, body, labels } = req.body;

        if (!repo || !title || !body) {
            return res.status(400).json({
                success: false,
                message: 'Repository, title, and body are required'
            });
        }

        const result = await integrationService.createGitHubIssue(repo, title, body, labels);

        res.json({
            success: result.success,
            message: result.success ? 'GitHub issue created successfully' : 'Failed to create GitHub issue',
            data: result.data,
            error: result.error
        });
    } catch (error) {
        logger.error('Create GitHub issue error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create GitHub issue',
            error: error.message
        });
    }
});

// Google Analytics 데이터 조회
router.get('/google-analytics/data', async (req, res) => {
    try {
        const { startDate, endDate, metrics, dimensions } = req.query;

        if (!startDate || !endDate || !metrics) {
            return res.status(400).json({
                success: false,
                message: 'Start date, end date, and metrics are required'
            });
        }

        const metricsArray = metrics.split(',');
        const dimensionsArray = dimensions ? dimensions.split(',') : [];

        const result = await integrationService.getGoogleAnalyticsData(
            startDate,
            endDate,
            metricsArray,
            dimensionsArray
        );

        res.json({
            success: result.success,
            message: result.success ? 'Google Analytics data retrieved successfully' : 'Failed to retrieve Google Analytics data',
            data: result.data,
            error: result.error
        });
    } catch (error) {
        logger.error('Get Google Analytics data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Google Analytics data',
            error: error.message
        });
    }
});

// Stripe 결제 처리
router.post('/stripe/payment', async (req, res) => {
    try {
        const { amount, currency, paymentMethodId, customerId } = req.body;

        if (!amount || !currency || !paymentMethodId) {
            return res.status(400).json({
                success: false,
                message: 'Amount, currency, and payment method ID are required'
            });
        }

        const result = await integrationService.processStripePayment(amount, currency, paymentMethodId, customerId);

        res.json({
            success: result.success,
            message: result.success ? 'Payment processed successfully' : 'Failed to process payment',
            data: result.data,
            error: result.error
        });
    } catch (error) {
        logger.error('Process Stripe payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process payment',
            error: error.message
        });
    }
});

// SendGrid 이메일 전송
router.post('/sendgrid/send', async (req, res) => {
    try {
        const { to, subject, content, templateId } = req.body;

        if (!to || !subject || !content) {
            return res.status(400).json({
                success: false,
                message: 'To, subject, and content are required'
            });
        }

        const result = await integrationService.sendEmail(to, subject, content, templateId);

        res.json({
            success: result.success,
            message: result.success ? 'Email sent successfully' : 'Failed to send email',
            data: result.data,
            error: result.error
        });
    } catch (error) {
        logger.error('Send email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: error.message
        });
    }
});

// AWS S3 파일 업로드
router.post('/aws-s3/upload', async (req, res) => {
    try {
        const { fileName, fileContent, contentType } = req.body;

        if (!fileName || !fileContent || !contentType) {
            return res.status(400).json({
                success: false,
                message: 'File name, content, and content type are required'
            });
        }

        const result = await integrationService.uploadToS3(fileName, fileContent, contentType);

        res.json({
            success: result.success,
            message: result.success ? 'File uploaded successfully' : 'Failed to upload file',
            data: result.data,
            error: result.error
        });
    } catch (error) {
        logger.error('Upload to S3 error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload file',
            error: error.message
        });
    }
});

// OpenAI 텍스트 생성
router.post('/openai/generate', async (req, res) => {
    try {
        const { prompt, maxTokens } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required'
            });
        }

        const result = await integrationService.generateText(prompt, maxTokens);

        res.json({
            success: result.success,
            message: result.success ? 'Text generated successfully' : 'Failed to generate text',
            data: result.data,
            error: result.error
        });
    } catch (error) {
        logger.error('Generate text error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate text',
            error: error.message
        });
    }
});

// 웹훅 등록
router.post('/webhooks', (req, res) => {
    try {
        const { integrationId, eventType, callbackUrl, secret } = req.body;

        if (!integrationId || !eventType || !callbackUrl) {
            return res.status(400).json({
                success: false,
                message: 'Integration ID, event type, and callback URL are required'
            });
        }

        const webhook = integrationService.registerWebhook(integrationId, eventType, callbackUrl, secret);

        res.json({
            success: true,
            message: 'Webhook registered successfully',
            data: webhook
        });
    } catch (error) {
        logger.error('Register webhook error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register webhook',
            error: error.message
        });
    }
});

// 웹훅 목록 조회
router.get('/webhooks', (req, res) => {
    try {
        const webhooks = Array.from(integrationService.webhooks.values());

        res.json({
            success: true,
            data: webhooks
        });
    } catch (error) {
        logger.error('Get webhooks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get webhooks',
            error: error.message
        });
    }
});

// 웹훅 트리거
router.post('/webhooks/:webhookId/trigger', async (req, res) => {
    try {
        const { webhookId } = req.params;
        const { payload } = req.body;

        const result = await integrationService.triggerWebhook(webhookId, payload);

        res.json({
            success: result.success,
            message: result.success ? 'Webhook triggered successfully' : 'Failed to trigger webhook',
            data: result.data,
            error: result.error
        });
    } catch (error) {
        logger.error('Trigger webhook error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger webhook',
            error: error.message
        });
    }
});

// 이벤트 핸들러 등록
router.post('/events/handlers', (req, res) => {
    try {
        const { eventType, handler } = req.body;

        if (!eventType || !handler) {
            return res.status(400).json({
                success: false,
                message: 'Event type and handler are required'
            });
        }

        integrationService.registerEventHandler(eventType, handler);

        res.json({
            success: true,
            message: 'Event handler registered successfully'
        });
    } catch (error) {
        logger.error('Register event handler error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register event handler',
            error: error.message
        });
    }
});

// 이벤트 발생
router.post('/events/emit', async (req, res) => {
    try {
        const { eventType, data } = req.body;

        if (!eventType) {
            return res.status(400).json({
                success: false,
                message: 'Event type is required'
            });
        }

        const result = await integrationService.emitEvent(eventType, data);

        res.json({
            success: result.success,
            message: result.success ? 'Event emitted successfully' : 'Failed to emit event',
            data: result.results,
            error: result.error
        });
    } catch (error) {
        logger.error('Emit event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to emit event',
            error: error.message
        });
    }
});

// 동기화 작업 생성
router.post('/sync/jobs', (req, res) => {
    try {
        const { integrationId, syncType, config } = req.body;

        if (!integrationId || !syncType) {
            return res.status(400).json({
                success: false,
                message: 'Integration ID and sync type are required'
            });
        }

        const job = integrationService.createSyncJob(integrationId, syncType, config);

        res.json({
            success: true,
            message: 'Sync job created successfully',
            data: job
        });
    } catch (error) {
        logger.error('Create sync job error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create sync job',
            error: error.message
        });
    }
});

// 동기화 작업 실행
router.post('/sync/jobs/:jobId/execute', async (req, res) => {
    try {
        const { jobId } = req.params;

        const result = await integrationService.executeSyncJob(jobId);

        res.json({
            success: result.success,
            message: result.success ? 'Sync job executed successfully' : 'Failed to execute sync job',
            data: result.data,
            error: result.error
        });
    } catch (error) {
        logger.error('Execute sync job error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to execute sync job',
            error: error.message
        });
    }
});

// 동기화 작업 목록 조회
router.get('/sync/jobs', (req, res) => {
    try {
        const jobs = Array.from(integrationService.syncJobs.values());

        res.json({
            success: true,
            data: jobs
        });
    } catch (error) {
        logger.error('Get sync jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get sync jobs',
            error: error.message
        });
    }
});

// 통합 서비스 헬스 체크
router.get('/services/:integrationId/health', async (req, res) => {
    try {
        const { integrationId } = req.params;

        const result = await integrationService.checkIntegrationHealth(integrationId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Check integration health error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check integration health',
            error: error.message
        });
    }
});

// 통합 서비스 통계
router.get('/stats', (req, res) => {
    try {
        const stats = integrationService.getIntegrationStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Get integration stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get integration stats',
            error: error.message
        });
    }
});

// 통합 서비스 테스트
router.post('/services/:integrationId/test', async (req, res) => {
    try {
        const { integrationId } = req.params;
        const { testType, testData } = req.body;

        let result;
        switch (integrationId) {
            case 'discord':
                result = await integrationService.sendDiscordMessage(
                    testData.channelId || 'test',
                    testData.message || 'Test message',
                    testData.options
                );
                break;
            case 'slack':
                result = await integrationService.sendSlackMessage(
                    testData.channel || 'test',
                    testData.message || 'Test message',
                    testData.options
                );
                break;
            case 'github':
                result = await integrationService.createGitHubIssue(
                    testData.repo || 'test/repo',
                    testData.title || 'Test issue',
                    testData.body || 'Test issue body',
                    testData.labels || []
                );
                break;
            case 'openai':
                result = await integrationService.generateText(
                    testData.prompt || 'Test prompt',
                    testData.maxTokens || 100
                );
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Test not supported for this integration'
                });
        }

        res.json({
            success: result.success,
            message: result.success ? 'Integration test successful' : 'Integration test failed',
            data: result.data,
            error: result.error
        });
    } catch (error) {
        logger.error('Test integration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test integration',
            error: error.message
        });
    }
});

module.exports = router;

