const crypto = require('crypto');
const logger = require('../utils/logger');

class PrivacyService {
    constructor() {
        this.consentRecords = new Map();
        this.dataRetentionPolicies = new Map();
        this.gdprRights = new Map();
        this.dataBreachLogs = new Map();
        this.privacySettings = new Map();
        this.auditTrails = new Map();

        this.initializeGDPRRights();
        this.initializeDataRetentionPolicies();
        this.initializePrivacySettings();
    }

    // GDPR 권리 초기화
    initializeGDPRRights() {
        const gdprRights = [
            {
                id: 'access',
                name: '접근권',
                description: '개인정보 처리 현황에 대한 정보 제공',
                article: 'GDPR Article 15',
                responseTime: 30, // 일
                isActive: true
            },
            {
                id: 'rectification',
                name: '정정권',
                description: '부정확한 개인정보의 정정',
                article: 'GDPR Article 16',
                responseTime: 30,
                isActive: true
            },
            {
                id: 'erasure',
                name: '삭제권',
                description: '개인정보의 삭제 (잊혀질 권리)',
                article: 'GDPR Article 17',
                responseTime: 30,
                isActive: true
            },
            {
                id: 'portability',
                name: '이전권',
                description: '개인정보의 이전',
                article: 'GDPR Article 20',
                responseTime: 30,
                isActive: true
            },
            {
                id: 'objection',
                name: '이의제기권',
                description: '개인정보 처리에 대한 이의제기',
                article: 'GDPR Article 21',
                responseTime: 30,
                isActive: true
            },
            {
                id: 'restriction',
                name: '제한권',
                description: '개인정보 처리의 제한',
                article: 'GDPR Article 18',
                responseTime: 30,
                isActive: true
            }
        ];

        gdprRights.forEach(right => {
            this.gdprRights.set(right.id, right);
        });
    }

    // 데이터 보존 정책 초기화
    initializeDataRetentionPolicies() {
        const policies = [
            {
                id: 'user_profile',
                name: '사용자 프로필',
                dataType: 'personal',
                retentionDays: 365,
                autoDelete: true,
                legalBasis: 'consent',
                description: '사용자 프로필 정보는 1년간 보관'
            },
            {
                id: 'activity_logs',
                name: '활동 로그',
                dataType: 'behavioral',
                retentionDays: 90,
                autoDelete: true,
                legalBasis: 'legitimate_interest',
                description: '사용자 활동 로그는 90일간 보관'
            },
            {
                id: 'communication',
                name: '커뮤니케이션',
                dataType: 'personal',
                retentionDays: 180,
                autoDelete: true,
                legalBasis: 'consent',
                description: '메시지 및 채팅 데이터는 6개월간 보관'
            },
            {
                id: 'analytics',
                name: '분석 데이터',
                dataType: 'anonymized',
                retentionDays: 730,
                autoDelete: false,
                legalBasis: 'legitimate_interest',
                description: '익명화된 분석 데이터는 2년간 보관'
            },
            {
                id: 'financial',
                name: '금융 정보',
                dataType: 'sensitive',
                retentionDays: 2555, // 7년
                autoDelete: false,
                legalBasis: 'legal_obligation',
                description: '금융 관련 정보는 법적 의무에 따라 7년간 보관'
            }
        ];

        policies.forEach(policy => {
            this.dataRetentionPolicies.set(policy.id, policy);
        });
    }

    // 개인정보 설정 초기화
    initializePrivacySettings() {
        const defaultSettings = {
            dataProcessing: {
                analytics: true,
                marketing: false,
                personalization: true,
                thirdPartySharing: false
            },
            communication: {
                email: true,
                sms: false,
                push: true,
                marketing: false
            },
            dataSharing: {
                partners: false,
                advertisers: false,
                analytics: true,
                research: false
            },
            retention: {
                autoDelete: true,
                retentionPeriod: 365,
                anonymization: true
            }
        };

        this.privacySettings.set('default', defaultSettings);
    }

    // 동의 기록 생성
    async createConsentRecord(userId, consentData) {
        try {
            const consentId = this.generateConsentId();
            const consentRecord = {
                id: consentId,
                userId: userId,
                consentType: consentData.consentType,
                purpose: consentData.purpose,
                legalBasis: consentData.legalBasis,
                granted: consentData.granted,
                grantedAt: consentData.granted ? new Date().toISOString() : null,
                withdrawnAt: consentData.granted ? null : new Date().toISOString(),
                ipAddress: consentData.ipAddress,
                userAgent: consentData.userAgent,
                version: 1,
                createdAt: new Date().toISOString()
            };

            this.consentRecords.set(consentId, consentRecord);

            // 감사 추적 기록
            this.logAuditEvent('consent_created', userId, {
                consentId: consentId,
                consentType: consentData.consentType,
                granted: consentData.granted
            });

            logger.info(`Consent record created for user ${userId}: ${consentId}`);
            return {
                success: true,
                consentId: consentId,
                consentRecord: consentRecord
            };

        } catch (error) {
            logger.error('Create consent record error:', error);
            throw error;
        }
    }

    // 동의 철회
    async withdrawConsent(userId, consentId) {
        try {
            const consentRecord = this.consentRecords.get(consentId);
            if (!consentRecord || consentRecord.userId !== userId) {
                throw new Error('Consent record not found');
            }

            consentRecord.granted = false;
            consentRecord.withdrawnAt = new Date().toISOString();
            consentRecord.version++;

            this.consentRecords.set(consentId, consentRecord);

            // 감사 추적 기록
            this.logAuditEvent('consent_withdrawn', userId, {
                consentId: consentId,
                consentType: consentRecord.consentType
            });

            logger.info(`Consent withdrawn for user ${userId}: ${consentId}`);
            return {
                success: true,
                message: 'Consent withdrawn successfully'
            };

        } catch (error) {
            logger.error('Withdraw consent error:', error);
            throw error;
        }
    }

    // 데이터 주체 권리 요청 처리
    async processDataSubjectRequest(userId, requestType, requestData = {}) {
        try {
            const requestId = this.generateRequestId();
            const gdprRight = this.gdprRights.get(requestType);

            if (!gdprRight) {
                throw new Error('Invalid request type');
            }

            const request = {
                id: requestId,
                userId: userId,
                requestType: requestType,
                status: 'pending',
                requestedAt: new Date().toISOString(),
                dueDate: new Date(Date.now() + gdprRight.responseTime * 24 * 60 * 60 * 1000).toISOString(),
                requestData: requestData,
                responseData: null,
                processedAt: null,
                processedBy: null
            };

            // 요청 유형별 처리
            switch (requestType) {
                case 'access':
                    request.responseData = await this.processAccessRequest(userId);
                    break;
                case 'rectification':
                    request.responseData = await this.processRectificationRequest(userId, requestData);
                    break;
                case 'erasure':
                    request.responseData = await this.processErasureRequest(userId);
                    break;
                case 'portability':
                    request.responseData = await this.processPortabilityRequest(userId);
                    break;
                case 'objection':
                    request.responseData = await this.processObjectionRequest(userId, requestData);
                    break;
                case 'restriction':
                    request.responseData = await this.processRestrictionRequest(userId, requestData);
                    break;
            }

            request.status = 'completed';
            request.processedAt = new Date().toISOString();
            request.processedBy = 'system';

            // 감사 추적 기록
            this.logAuditEvent('data_subject_request', userId, {
                requestId: requestId,
                requestType: requestType,
                status: request.status
            });

            logger.info(`Data subject request processed: ${requestId} for user ${userId}`);
            return {
                success: true,
                requestId: requestId,
                request: request
            };

        } catch (error) {
            logger.error('Process data subject request error:', error);
            throw error;
        }
    }

    // 접근권 요청 처리
    async processAccessRequest(userId) {
        const userData = {
            personalInfo: {
                userId: userId,
                email: 'user@example.com', // 실제로는 데이터베이스에서 조회
                name: 'User Name',
                createdAt: '2024-01-01T00:00:00Z'
            },
            processingActivities: [
                {
                    purpose: 'Service Provision',
                    legalBasis: 'Contract',
                    dataTypes: ['Personal Information', 'Usage Data'],
                    retentionPeriod: '1 year'
                }
            ],
            dataSharing: {
                thirdParties: [],
                internationalTransfers: []
            },
            rights: Object.keys(this.gdprRights).map(key => ({
                right: this.gdprRights.get(key).name,
                description: this.gdprRights.get(key).description
            }))
        };

        return userData;
    }

    // 정정권 요청 처리
    async processRectificationRequest(userId, requestData) {
        // 실제로는 데이터베이스에서 사용자 정보 업데이트
        return {
            message: 'Personal data has been rectified',
            updatedFields: Object.keys(requestData),
            updatedAt: new Date().toISOString()
        };
    }

    // 삭제권 요청 처리
    async processErasureRequest(userId) {
        // 실제로는 데이터베이스에서 사용자 데이터 삭제
        const deletedData = {
            userProfile: true,
            activityLogs: true,
            communications: true,
            analytics: false // 익명화된 데이터는 보관
        };

        return {
            message: 'Personal data has been erased',
            deletedData: deletedData,
            deletedAt: new Date().toISOString()
        };
    }

    // 이전권 요청 처리
    async processPortabilityRequest(userId) {
        const portableData = {
            personalData: {
                userId: userId,
                email: 'user@example.com',
                name: 'User Name'
            },
            dataFormat: 'JSON',
            downloadUrl: `/api/privacy/export/${userId}`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };

        return portableData;
    }

    // 이의제기권 요청 처리
    async processObjectionRequest(userId, requestData) {
        return {
            message: 'Objection has been recorded and processing will be reviewed',
            objectionReason: requestData.reason,
            recordedAt: new Date().toISOString()
        };
    }

    // 제한권 요청 처리
    async processRestrictionRequest(userId, requestData) {
        return {
            message: 'Data processing has been restricted',
            restrictedActivities: requestData.activities,
            restrictedAt: new Date().toISOString()
        };
    }

    // 데이터 유출 신고
    async reportDataBreach(breachData) {
        try {
            const breachId = this.generateBreachId();
            const breach = {
                id: breachId,
                type: breachData.type,
                severity: breachData.severity,
                description: breachData.description,
                affectedUsers: breachData.affectedUsers,
                discoveredAt: new Date().toISOString(),
                reportedAt: new Date().toISOString(),
                status: 'reported',
                containmentActions: breachData.containmentActions || [],
                notificationSent: false,
                authoritiesNotified: false
            };

            this.dataBreachLogs.set(breachId, breach);

            // 심각도에 따른 자동 조치
            if (breach.severity === 'high' || breach.severity === 'critical') {
                await this.initiateBreachResponse(breachId);
            }

            // 감사 추적 기록
            this.logAuditEvent('data_breach_reported', 'system', {
                breachId: breachId,
                severity: breach.severity,
                affectedUsers: breach.affectedUsers
            });

            logger.warn(`Data breach reported: ${breachId}`);
            return {
                success: true,
                breachId: breachId,
                breach: breach
            };

        } catch (error) {
            logger.error('Report data breach error:', error);
            throw error;
        }
    }

    // 데이터 유출 대응
    async initiateBreachResponse(breachId) {
        const breach = this.dataBreachLogs.get(breachId);
        if (!breach) return;

        // 영향받은 사용자에게 알림
        breach.notificationSent = true;
        breach.notificationSentAt = new Date().toISOString();

        // 관련 당국에 신고 (필요한 경우)
        if (breach.affectedUsers > 100) {
            breach.authoritiesNotified = true;
            breach.authoritiesNotifiedAt = new Date().toISOString();
        }

        breach.status = 'contained';
        this.dataBreachLogs.set(breachId, breach);

        logger.warn(`Breach response initiated for breach: ${breachId}`);
    }

    // 개인정보 영향평가 (PIA)
    async conductPrivacyImpactAssessment(assessmentData) {
        try {
            const piaId = this.generatePIAId();
            const assessment = {
                id: piaId,
                projectName: assessmentData.projectName,
                dataTypes: assessmentData.dataTypes,
                processingPurposes: assessmentData.processingPurposes,
                legalBasis: assessmentData.legalBasis,
                dataSubjects: assessmentData.dataSubjects,
                dataRetention: assessmentData.dataRetention,
                riskLevel: this.calculateRiskLevel(assessmentData),
                recommendations: this.generateRecommendations(assessmentData),
                conductedAt: new Date().toISOString(),
                conductedBy: assessmentData.conductedBy,
                status: 'completed'
            };

            // 감사 추적 기록
            this.logAuditEvent('pia_conducted', assessmentData.conductedBy, {
                piaId: piaId,
                projectName: assessmentData.projectName,
                riskLevel: assessment.riskLevel
            });

            logger.info(`Privacy Impact Assessment conducted: ${piaId}`);
            return {
                success: true,
                piaId: piaId,
                assessment: assessment
            };

        } catch (error) {
            logger.error('Conduct PIA error:', error);
            throw error;
        }
    }

    // 위험도 계산
    calculateRiskLevel(assessmentData) {
        let riskScore = 0;

        // 데이터 유형별 위험도
        const dataTypeRisk = {
            'personal': 1,
            'sensitive': 3,
            'special_categories': 5
        };

        assessmentData.dataTypes.forEach(type => {
            riskScore += dataTypeRisk[type] || 1;
        });

        // 처리 목적별 위험도
        const purposeRisk = {
            'marketing': 2,
            'profiling': 4,
            'automated_decision': 5
        };

        assessmentData.processingPurposes.forEach(purpose => {
            riskScore += purposeRisk[purpose] || 1;
        });

        // 데이터 주체 수
        if (assessmentData.dataSubjects > 10000) riskScore += 2;
        else if (assessmentData.dataSubjects > 1000) riskScore += 1;

        // 위험도 등급 결정
        if (riskScore >= 10) return 'high';
        if (riskScore >= 6) return 'medium';
        return 'low';
    }

    // 권장사항 생성
    generateRecommendations(assessmentData) {
        const recommendations = [];

        if (assessmentData.dataTypes.includes('special_categories')) {
            recommendations.push({
                type: 'consent',
                priority: 'high',
                description: '특별한 카테고리의 개인정보 처리에 대한 명시적 동의 필요'
            });
        }

        if (assessmentData.processingPurposes.includes('profiling')) {
            recommendations.push({
                type: 'transparency',
                priority: 'high',
                description: '프로파일링 활동에 대한 투명성 확보 및 설명 제공'
            });
        }

        if (assessmentData.dataSubjects > 1000) {
            recommendations.push({
                type: 'dpo',
                priority: 'medium',
                description: '데이터 보호 책임자(DPO) 지정 검토'
            });
        }

        return recommendations;
    }

    // 자동 데이터 정리
    async performAutomaticDataCleanup() {
        try {
            const now = new Date();
            let cleanedCount = 0;

            // 보존 정책에 따른 자동 삭제
            this.dataRetentionPolicies.forEach(policy => {
                if (policy.autoDelete) {
                    const cutoffDate = new Date(now.getTime() - policy.retentionDays * 24 * 60 * 60 * 1000);
                    // 실제로는 데이터베이스에서 해당 데이터 삭제
                    cleanedCount++;
                }
            });

            logger.info(`Automatic data cleanup completed: ${cleanedCount} records processed`);
            return {
                success: true,
                cleanedCount: cleanedCount,
                cleanedAt: now.toISOString()
            };

        } catch (error) {
            logger.error('Automatic data cleanup error:', error);
            throw error;
        }
    }

    // 감사 추적 기록
    logAuditEvent(action, userId, details) {
        const auditId = this.generateAuditId();
        const auditEntry = {
            id: auditId,
            action: action,
            userId: userId,
            details: details,
            timestamp: new Date().toISOString(),
            ipAddress: details.ipAddress || 'unknown',
            userAgent: details.userAgent || 'unknown'
        };

        this.auditTrails.set(auditId, auditEntry);
    }

    // 개인정보 설정 조회
    getPrivacySettings(userId) {
        return this.privacySettings.get(userId) || this.privacySettings.get('default');
    }

    // 개인정보 설정 업데이트
    updatePrivacySettings(userId, settings) {
        this.privacySettings.set(userId, {
            ...this.getPrivacySettings(userId),
            ...settings,
            updatedAt: new Date().toISOString()
        });
    }

    // 감사 추적 조회
    getAuditTrails(filters = {}, limit = 100) {
        let trails = Array.from(this.auditTrails.values());

        if (filters.userId) {
            trails = trails.filter(trail => trail.userId === filters.userId);
        }
        if (filters.action) {
            trails = trails.filter(trail => trail.action === filters.action);
        }
        if (filters.startDate) {
            trails = trails.filter(trail => new Date(trail.timestamp) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            trails = trails.filter(trail => new Date(trail.timestamp) <= new Date(filters.endDate));
        }

        return trails
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // 개인정보 보호 통계
    getPrivacyStats() {
        const consentCount = this.consentRecords.size;
        const activeConsents = Array.from(this.consentRecords.values()).filter(c => c.granted).length;
        const breachCount = this.dataBreachLogs.size;
        const activeBreaches = Array.from(this.dataBreachLogs.values()).filter(b => b.status === 'reported').length;

        return {
            totalConsents: consentCount,
            activeConsents: activeConsents,
            totalBreaches: breachCount,
            activeBreaches: activeBreaches,
            gdprRights: Object.keys(this.gdprRights).length,
            retentionPolicies: this.dataRetentionPolicies.size
        };
    }

    // 유틸리티 메서드들
    generateConsentId() {
        return 'consent_' + crypto.randomBytes(8).toString('hex');
    }

    generateRequestId() {
        return 'req_' + crypto.randomBytes(8).toString('hex');
    }

    generateBreachId() {
        return 'breach_' + crypto.randomBytes(8).toString('hex');
    }

    generatePIAId() {
        return 'pia_' + crypto.randomBytes(8).toString('hex');
    }

    generateAuditId() {
        return 'audit_' + crypto.randomBytes(8).toString('hex');
    }
}

module.exports = new PrivacyService();

