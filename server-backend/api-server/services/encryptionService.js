const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class EncryptionService {
    constructor() {
        this.encryptionKeys = new Map();
        this.keyRotationSchedule = new Map();
        this.encryptionStats = new Map();
        this.dataClassification = new Map();
        this.accessLogs = new Map();
        this.piiData = new Map();

        this.initializeEncryptionKeys();
        this.initializeDataClassification();
        this.initializePIIPatterns();
    }

    // 암호화 키 초기화
    initializeEncryptionKeys() {
        // AES-256 키 생성
        this.encryptionKeys.set('aes256', {
            key: crypto.randomBytes(32),
            algorithm: 'aes-256-gcm',
            createdAt: new Date().toISOString(),
            version: 1
        });

        // RSA 키 쌍 생성
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        this.encryptionKeys.set('rsa', {
            publicKey,
            privateKey,
            algorithm: 'rsa',
            createdAt: new Date().toISOString(),
            version: 1
        });

        // HMAC 키 생성
        this.encryptionKeys.set('hmac', {
            key: crypto.randomBytes(64),
            algorithm: 'sha256',
            createdAt: new Date().toISOString(),
            version: 1
        });
    }

    // 데이터 분류 초기화
    initializeDataClassification() {
        const classifications = [
            {
                level: 'public',
                name: '공개',
                description: '공개 가능한 데이터',
                encryptionRequired: false,
                retentionDays: 365,
                accessLevel: 1
            },
            {
                level: 'internal',
                name: '내부',
                description: '내부 사용 데이터',
                encryptionRequired: true,
                retentionDays: 180,
                accessLevel: 2
            },
            {
                level: 'confidential',
                name: '기밀',
                description: '기밀 데이터',
                encryptionRequired: true,
                retentionDays: 90,
                accessLevel: 3
            },
            {
                level: 'restricted',
                name: '제한',
                description: '제한된 데이터',
                encryptionRequired: true,
                retentionDays: 30,
                accessLevel: 4
            },
            {
                level: 'pii',
                name: '개인정보',
                description: '개인식별정보',
                encryptionRequired: true,
                retentionDays: 30,
                accessLevel: 5,
                gdprCompliant: true
            }
        ];

        classifications.forEach(classification => {
            this.dataClassification.set(classification.level, classification);
        });
    }

    // PII 패턴 초기화
    initializePIIPatterns() {
        this.piiPatterns = {
            email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            phone: /(\+?82|0)?[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}/g,
            ssn: /\d{6}-\d{7}/g,
            creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
            ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
            macAddress: /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/g
        };
    }

    // 데이터 암호화
    async encryptData(data, classification = 'internal', userId = null) {
        try {
            const classificationInfo = this.dataClassification.get(classification);
            if (!classificationInfo) {
                throw new Error('Invalid data classification');
            }

            // PII 데이터 감지 및 분류 업데이트
            const detectedPII = this.detectPII(data);
            if (detectedPII.length > 0) {
                classification = 'pii';
            }

            // 암호화가 필요한 경우
            if (classificationInfo.encryptionRequired) {
                const key = this.encryptionKeys.get('aes256');
                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipherGCM(key.algorithm, key.key, iv);

                let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
                encrypted += cipher.final('hex');
                const authTag = cipher.getAuthTag();

                const encryptedData = {
                    data: encrypted,
                    iv: iv.toString('hex'),
                    authTag: authTag.toString('hex'),
                    algorithm: key.algorithm,
                    keyVersion: key.version,
                    classification: classification,
                    encryptedAt: new Date().toISOString()
                };

                // 접근 로그 기록
                this.logAccess('encrypt', userId, classification, encryptedData);

                // 암호화 통계 업데이트
                this.updateEncryptionStats('encrypt', classification);

                return {
                    success: true,
                    encryptedData: encryptedData,
                    classification: classification,
                    piiDetected: detectedPII
                };
            } else {
                // 암호화가 필요하지 않은 경우
                return {
                    success: true,
                    data: data,
                    classification: classification,
                    encrypted: false
                };
            }

        } catch (error) {
            logger.error('Data encryption error:', error);
            throw error;
        }
    }

    // 데이터 복호화
    async decryptData(encryptedData, userId = null) {
        try {
            if (!encryptedData.encrypted) {
                return {
                    success: true,
                    data: encryptedData.data
                };
            }

            const key = this.encryptionKeys.get('aes256');
            const decipher = crypto.createDecipherGCM(
                encryptedData.algorithm,
                key.key,
                Buffer.from(encryptedData.iv, 'hex')
            );

            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

            let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            const data = JSON.parse(decrypted);

            // 접근 로그 기록
            this.logAccess('decrypt', userId, encryptedData.classification, encryptedData);

            // 암호화 통계 업데이트
            this.updateEncryptionStats('decrypt', encryptedData.classification);

            return {
                success: true,
                data: data,
                classification: encryptedData.classification
            };

        } catch (error) {
            logger.error('Data decryption error:', error);
            throw error;
        }
    }

    // PII 데이터 감지
    detectPII(data) {
        const detectedPII = [];
        const dataString = JSON.stringify(data);

        Object.entries(this.piiPatterns).forEach(([type, pattern]) => {
            const matches = dataString.match(pattern);
            if (matches) {
                detectedPII.push({
                    type: type,
                    matches: matches,
                    count: matches.length
                });
            }
        });

        return detectedPII;
    }

    // PII 데이터 마스킹
    maskPII(data, maskChar = '*') {
        const maskedData = JSON.parse(JSON.stringify(data));
        const dataString = JSON.stringify(maskedData);

        let maskedString = dataString;
        Object.entries(this.piiPatterns).forEach(([type, pattern]) => {
            maskedString = maskedString.replace(pattern, (match) => {
                if (type === 'email') {
                    const [local, domain] = match.split('@');
                    return local.charAt(0) + maskChar.repeat(local.length - 2) + local.charAt(local.length - 1) + '@' + domain;
                } else if (type === 'phone') {
                    return match.replace(/\d/g, maskChar);
                } else if (type === 'ssn') {
                    return maskChar.repeat(match.length);
                } else if (type === 'creditCard') {
                    return match.replace(/\d/g, maskChar);
                } else {
                    return maskChar.repeat(match.length);
                }
            });
        });

        return JSON.parse(maskedString);
    }

    // 데이터 익명화
    anonymizeData(data, anonymizationLevel = 'medium') {
        const anonymizedData = JSON.parse(JSON.stringify(data));

        switch (anonymizationLevel) {
            case 'low':
                // 이메일 도메인만 마스킹
                return this.maskEmailDomain(anonymizedData);
            case 'medium':
                // PII 데이터 마스킹
                return this.maskPII(anonymizedData);
            case 'high':
                // 완전 익명화
                return this.completeAnonymization(anonymizedData);
            default:
                return anonymizedData;
        }
    }

    // 이메일 도메인 마스킹
    maskEmailDomain(data) {
        const dataString = JSON.stringify(data);
        const maskedString = dataString.replace(this.piiPatterns.email, (match) => {
            const [local, domain] = match.split('@');
            return local + '@' + domain.charAt(0) + '*'.repeat(domain.length - 1);
        });
        return JSON.parse(maskedString);
    }

    // 완전 익명화
    completeAnonymization(data) {
        const anonymizedData = {};
        let counter = 1;

        Object.keys(data).forEach(key => {
            if (typeof data[key] === 'object' && data[key] !== null) {
                anonymizedData[key] = this.completeAnonymization(data[key]);
            } else {
                anonymizedData[key] = `ANONYMIZED_${counter++}`;
            }
        });

        return anonymizedData;
    }

    // 파일 암호화
    async encryptFile(fileBuffer, filename, classification = 'internal') {
        try {
            const key = this.encryptionKeys.get('aes256');
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipherGCM(key.algorithm, key.key, iv);

            let encrypted = cipher.update(fileBuffer);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            const authTag = cipher.getAuthTag();

            const encryptedFile = {
                data: encrypted,
                iv: iv,
                authTag: authTag,
                algorithm: key.algorithm,
                keyVersion: key.version,
                originalFilename: filename,
                classification: classification,
                encryptedAt: new Date().toISOString()
            };

            return {
                success: true,
                encryptedFile: encryptedFile
            };

        } catch (error) {
            logger.error('File encryption error:', error);
            throw error;
        }
    }

    // 파일 복호화
    async decryptFile(encryptedFile) {
        try {
            const key = this.encryptionKeys.get('aes256');
            const decipher = crypto.createDecipherGCM(
                encryptedFile.algorithm,
                key.key,
                encryptedFile.iv
            );

            decipher.setAuthTag(encryptedFile.authTag);

            let decrypted = decipher.update(encryptedFile.data);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            return {
                success: true,
                fileBuffer: decrypted,
                filename: encryptedFile.originalFilename
            };

        } catch (error) {
            logger.error('File decryption error:', error);
            throw error;
        }
    }

    // 키 로테이션
    async rotateKeys() {
        try {
            const newAESKey = {
                key: crypto.randomBytes(32),
                algorithm: 'aes-256-gcm',
                createdAt: new Date().toISOString(),
                version: this.encryptionKeys.get('aes256').version + 1
            };

            const newRSAKeys = crypto.generateKeyPairSync('rsa', {
                modulusLength: 4096,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });

            const newHMACKey = {
                key: crypto.randomBytes(64),
                algorithm: 'sha256',
                createdAt: new Date().toISOString(),
                version: this.encryptionKeys.get('hmac').version + 1
            };

            // 이전 키 백업
            this.encryptionKeys.set('aes256_old', this.encryptionKeys.get('aes256'));
            this.encryptionKeys.set('rsa_old', this.encryptionKeys.get('rsa'));
            this.encryptionKeys.set('hmac_old', this.encryptionKeys.get('hmac'));

            // 새 키 적용
            this.encryptionKeys.set('aes256', newAESKey);
            this.encryptionKeys.set('rsa', {
                publicKey: newRSAKeys.publicKey,
                privateKey: newRSAKeys.privateKey,
                algorithm: 'rsa',
                createdAt: new Date().toISOString(),
                version: this.encryptionKeys.get('rsa').version + 1
            });
            this.encryptionKeys.set('hmac', newHMACKey);

            // 키 로테이션 스케줄 업데이트
            this.keyRotationSchedule.set('lastRotation', new Date().toISOString());
            this.keyRotationSchedule.set('nextRotation', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString());

            logger.info('Encryption keys rotated successfully');
            return {
                success: true,
                message: 'Keys rotated successfully',
                newKeyVersions: {
                    aes256: newAESKey.version,
                    rsa: this.encryptionKeys.get('rsa').version,
                    hmac: newHMACKey.version
                }
            };

        } catch (error) {
            logger.error('Key rotation error:', error);
            throw error;
        }
    }

    // 접근 로그 기록
    logAccess(action, userId, classification, data) {
        const logEntry = {
            id: this.generateLogId(),
            action: action,
            userId: userId,
            classification: classification,
            timestamp: new Date().toISOString(),
            dataId: data.id || 'unknown',
            ipAddress: data.ipAddress || 'unknown',
            userAgent: data.userAgent || 'unknown'
        };

        this.accessLogs.set(logEntry.id, logEntry);
    }

    // 암호화 통계 업데이트
    updateEncryptionStats(action, classification) {
        const stats = this.encryptionStats.get(classification) || {
            encryptCount: 0,
            decryptCount: 0,
            lastActivity: null
        };

        if (action === 'encrypt') {
            stats.encryptCount++;
        } else if (action === 'decrypt') {
            stats.decryptCount++;
        }

        stats.lastActivity = new Date().toISOString();
        this.encryptionStats.set(classification, stats);
    }

    // 데이터 분류 조회
    getDataClassifications() {
        return Array.from(this.dataClassification.values());
    }

    // 접근 로그 조회
    getAccessLogs(filters = {}, limit = 100) {
        let logs = Array.from(this.accessLogs.values());

        if (filters.userId) {
            logs = logs.filter(log => log.userId === filters.userId);
        }
        if (filters.action) {
            logs = logs.filter(log => log.action === filters.action);
        }
        if (filters.classification) {
            logs = logs.filter(log => log.classification === filters.classification);
        }
        if (filters.startDate) {
            logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
        }

        return logs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // 암호화 통계 조회
    getEncryptionStats() {
        const stats = {};
        this.encryptionStats.forEach((value, key) => {
            stats[key] = value;
        });

        return {
            classifications: stats,
            totalEncryptions: Object.values(stats).reduce((sum, stat) => sum + stat.encryptCount, 0),
            totalDecryptions: Object.values(stats).reduce((sum, stat) => sum + stat.decryptCount, 0),
            keyVersions: {
                aes256: this.encryptionKeys.get('aes256').version,
                rsa: this.encryptionKeys.get('rsa').version,
                hmac: this.encryptionKeys.get('hmac').version
            },
            lastKeyRotation: this.keyRotationSchedule.get('lastRotation'),
            nextKeyRotation: this.keyRotationSchedule.get('nextRotation')
        };
    }

    // PII 데이터 정리 (GDPR 준수)
    async cleanupPIIData(userId, retentionDays = 30) {
        try {
            const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
            const logs = Array.from(this.accessLogs.values())
                .filter(log => log.userId === userId && new Date(log.timestamp) < cutoffDate);

            // PII 데이터 삭제
            logs.forEach(log => {
                this.accessLogs.delete(log.id);
            });

            // PII 데이터 무효화
            this.piiData.set(userId, {
                status: 'deleted',
                deletedAt: new Date().toISOString(),
                retentionDays: retentionDays
            });

            logger.info(`PII data cleaned up for user ${userId}`);
            return {
                success: true,
                message: 'PII data cleaned up successfully',
                deletedLogs: logs.length
            };

        } catch (error) {
            logger.error('PII cleanup error:', error);
            throw error;
        }
    }

    // 데이터 무결성 검증
    verifyDataIntegrity(data, expectedHash) {
        const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
        return hash === expectedHash;
    }

    // 디지털 서명 생성
    createDigitalSignature(data) {
        const key = this.encryptionKeys.get('rsa');
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(JSON.stringify(data));
        const signature = sign.sign(key.privateKey, 'hex');

        return {
            signature: signature,
            algorithm: 'RSA-SHA256',
            timestamp: new Date().toISOString()
        };
    }

    // 디지털 서명 검증
    verifyDigitalSignature(data, signature, publicKey) {
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(JSON.stringify(data));
        return verify.verify(publicKey, signature, 'hex');
    }

    // 유틸리티 메서드들
    generateLogId() {
        return 'log_' + crypto.randomBytes(8).toString('hex');
    }

    // 보안 강화를 위한 추가 메서드들
    generateSecureRandom(length = 32) {
        return crypto.randomBytes(length);
    }

    hashPassword(password, saltRounds = 12) {
        return bcrypt.hash(password, saltRounds);
    }

    verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }

    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
}

module.exports = new EncryptionService();

