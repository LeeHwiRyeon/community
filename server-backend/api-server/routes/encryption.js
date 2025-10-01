const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const encryptionService = require('../services/encryptionService');
const privacyService = require('../services/privacyService');

// 데이터 암호화
router.post('/encrypt', async (req, res) => {
    try {
        const { data, classification = 'internal', userId } = req.body;

        if (!data) {
            return res.status(400).json({
                success: false,
                message: '암호화할 데이터가 필요합니다.'
            });
        }

        const result = await encryptionService.encryptData(data, classification, userId);

        res.json(result);
    } catch (error) {
        logger.error('Data encryption error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 데이터 복호화
router.post('/decrypt', async (req, res) => {
    try {
        const { encryptedData, userId } = req.body;

        if (!encryptedData) {
            return res.status(400).json({
                success: false,
                message: '복호화할 암호화된 데이터가 필요합니다.'
            });
        }

        const result = await encryptionService.decryptData(encryptedData, userId);

        res.json(result);
    } catch (error) {
        logger.error('Data decryption error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// PII 데이터 감지
router.post('/detect-pii', (req, res) => {
    try {
        const { data } = req.body;

        if (!data) {
            return res.status(400).json({
                success: false,
                message: '분석할 데이터가 필요합니다.'
            });
        }

        const detectedPII = encryptionService.detectPII(data);

        res.json({
            success: true,
            detectedPII: detectedPII,
            hasPII: detectedPII.length > 0
        });
    } catch (error) {
        logger.error('PII detection error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// PII 데이터 마스킹
router.post('/mask-pii', (req, res) => {
    try {
        const { data, maskChar = '*' } = req.body;

        if (!data) {
            return res.status(400).json({
                success: false,
                message: '마스킹할 데이터가 필요합니다.'
            });
        }

        const maskedData = encryptionService.maskPII(data, maskChar);

        res.json({
            success: true,
            maskedData: maskedData
        });
    } catch (error) {
        logger.error('PII masking error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 데이터 익명화
router.post('/anonymize', (req, res) => {
    try {
        const { data, anonymizationLevel = 'medium' } = req.body;

        if (!data) {
            return res.status(400).json({
                success: false,
                message: '익명화할 데이터가 필요합니다.'
            });
        }

        const anonymizedData = encryptionService.anonymizeData(data, anonymizationLevel);

        res.json({
            success: true,
            anonymizedData: anonymizedData
        });
    } catch (error) {
        logger.error('Data anonymization error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 파일 암호화
router.post('/encrypt-file', async (req, res) => {
    try {
        const { fileBuffer, filename, classification = 'internal' } = req.body;

        if (!fileBuffer || !filename) {
            return res.status(400).json({
                success: false,
                message: '파일 버퍼와 파일명이 필요합니다.'
            });
        }

        const result = await encryptionService.encryptFile(fileBuffer, filename, classification);

        res.json(result);
    } catch (error) {
        logger.error('File encryption error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 파일 복호화
router.post('/decrypt-file', async (req, res) => {
    try {
        const { encryptedFile } = req.body;

        if (!encryptedFile) {
            return res.status(400).json({
                success: false,
                message: '복호화할 암호화된 파일이 필요합니다.'
            });
        }

        const result = await encryptionService.decryptFile(encryptedFile);

        res.json(result);
    } catch (error) {
        logger.error('File decryption error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 키 로테이션
router.post('/rotate-keys', async (req, res) => {
    try {
        const result = await encryptionService.rotateKeys();

        res.json(result);
    } catch (error) {
        logger.error('Key rotation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 데이터 분류 조회
router.get('/classifications', (req, res) => {
    try {
        const classifications = encryptionService.getDataClassifications();

        res.json({
            success: true,
            data: classifications
        });
    } catch (error) {
        logger.error('Get classifications error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 접근 로그 조회
router.get('/access-logs', (req, res) => {
    try {
        const { userId, action, classification, startDate, endDate, limit = 100 } = req.query;

        const filters = {
            userId,
            action,
            classification,
            startDate,
            endDate
        };

        const logs = encryptionService.getAccessLogs(filters, parseInt(limit));

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        logger.error('Get access logs error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 암호화 통계 조회
router.get('/stats', (req, res) => {
    try {
        const stats = encryptionService.getEncryptionStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Get encryption stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// PII 데이터 정리
router.post('/cleanup-pii', async (req, res) => {
    try {
        const { userId, retentionDays = 30 } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID가 필요합니다.'
            });
        }

        const result = await encryptionService.cleanupPIIData(userId, retentionDays);

        res.json(result);
    } catch (error) {
        logger.error('PII cleanup error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 데이터 무결성 검증
router.post('/verify-integrity', (req, res) => {
    try {
        const { data, expectedHash } = req.body;

        if (!data || !expectedHash) {
            return res.status(400).json({
                success: false,
                message: '데이터와 예상 해시가 필요합니다.'
            });
        }

        const isValid = encryptionService.verifyDataIntegrity(data, expectedHash);

        res.json({
            success: true,
            isValid: isValid
        });
    } catch (error) {
        logger.error('Data integrity verification error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 디지털 서명 생성
router.post('/create-signature', (req, res) => {
    try {
        const { data } = req.body;

        if (!data) {
            return res.status(400).json({
                success: false,
                message: '서명할 데이터가 필요합니다.'
            });
        }

        const signature = encryptionService.createDigitalSignature(data);

        res.json({
            success: true,
            signature: signature
        });
    } catch (error) {
        logger.error('Create signature error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 디지털 서명 검증
router.post('/verify-signature', (req, res) => {
    try {
        const { data, signature, publicKey } = req.body;

        if (!data || !signature || !publicKey) {
            return res.status(400).json({
                success: false,
                message: '데이터, 서명, 공개키가 모두 필요합니다.'
            });
        }

        const isValid = encryptionService.verifyDigitalSignature(data, signature, publicKey);

        res.json({
            success: true,
            isValid: isValid
        });
    } catch (error) {
        logger.error('Verify signature error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 개인정보 보호 관련 엔드포인트들

// 동의 기록 생성
router.post('/consent', async (req, res) => {
    try {
        const { userId, consentType, purpose, legalBasis, granted, ipAddress, userAgent } = req.body;

        if (!userId || !consentType || !purpose || !legalBasis) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다.'
            });
        }

        const result = await privacyService.createConsentRecord(userId, {
            consentType,
            purpose,
            legalBasis,
            granted,
            ipAddress,
            userAgent
        });

        res.json(result);
    } catch (error) {
        logger.error('Create consent error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 동의 철회
router.post('/consent/withdraw', async (req, res) => {
    try {
        const { userId, consentId } = req.body;

        if (!userId || !consentId) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID와 동의 ID가 필요합니다.'
            });
        }

        const result = await privacyService.withdrawConsent(userId, consentId);

        res.json(result);
    } catch (error) {
        logger.error('Withdraw consent error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 데이터 주체 권리 요청
router.post('/data-subject-request', async (req, res) => {
    try {
        const { userId, requestType, requestData = {} } = req.body;

        if (!userId || !requestType) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID와 요청 유형이 필요합니다.'
            });
        }

        const result = await privacyService.processDataSubjectRequest(userId, requestType, requestData);

        res.json(result);
    } catch (error) {
        logger.error('Data subject request error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 데이터 유출 신고
router.post('/breach-report', async (req, res) => {
    try {
        const { type, severity, description, affectedUsers, containmentActions = [] } = req.body;

        if (!type || !severity || !description || !affectedUsers) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다.'
            });
        }

        const result = await privacyService.reportDataBreach({
            type,
            severity,
            description,
            affectedUsers,
            containmentActions
        });

        res.json(result);
    } catch (error) {
        logger.error('Breach report error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 개인정보 영향평가
router.post('/pia', async (req, res) => {
    try {
        const { projectName, dataTypes, processingPurposes, legalBasis, dataSubjects, dataRetention, conductedBy } = req.body;

        if (!projectName || !dataTypes || !processingPurposes || !legalBasis) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다.'
            });
        }

        const result = await privacyService.conductPrivacyImpactAssessment({
            projectName,
            dataTypes,
            processingPurposes,
            legalBasis,
            dataSubjects,
            dataRetention,
            conductedBy
        });

        res.json(result);
    } catch (error) {
        logger.error('PIA error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 개인정보 설정 조회
router.get('/privacy-settings/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const settings = privacyService.getPrivacySettings(userId);

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        logger.error('Get privacy settings error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 개인정보 설정 업데이트
router.put('/privacy-settings/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { settings } = req.body;

        if (!settings) {
            return res.status(400).json({
                success: false,
                message: '설정 데이터가 필요합니다.'
            });
        }

        privacyService.updatePrivacySettings(userId, settings);

        res.json({
            success: true,
            message: '개인정보 설정이 업데이트되었습니다.'
        });
    } catch (error) {
        logger.error('Update privacy settings error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 감사 추적 조회
router.get('/audit-trails', (req, res) => {
    try {
        const { userId, action, startDate, endDate, limit = 100 } = req.query;

        const filters = {
            userId,
            action,
            startDate,
            endDate
        };

        const trails = privacyService.getAuditTrails(filters, parseInt(limit));

        res.json({
            success: true,
            data: trails
        });
    } catch (error) {
        logger.error('Get audit trails error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 개인정보 보호 통계
router.get('/privacy-stats', (req, res) => {
    try {
        const stats = privacyService.getPrivacyStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Get privacy stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 자동 데이터 정리
router.post('/cleanup', async (req, res) => {
    try {
        const result = await privacyService.performAutomaticDataCleanup();

        res.json(result);
    } catch (error) {
        logger.error('Automatic cleanup error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

