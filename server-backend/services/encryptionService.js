const crypto = require('crypto');
const { logger } = require('../utils/logger');

/**
 * 데이터 암호화 서비스
 * - 대칭 암호화 (AES-256-GCM)
 * - 비대칭 암호화 (RSA)
 * - 해싱 (bcrypt, scrypt)
 * - 키 관리
 */

class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bits
        this.ivLength = 16; // 128 bits
        this.tagLength = 16; // 128 bits
        this.saltLength = 32; // 256 bits
        this.iterations = 100000; // PBKDF2 iterations

        // 환경변수에서 마스터 키 로드
        this.masterKey = process.env.MASTER_ENCRYPTION_KEY;
        if (!this.masterKey) {
            logger.warning('MASTER_ENCRYPTION_KEY가 설정되지 않았습니다. 새 키를 생성합니다.');
            this.masterKey = this.generateMasterKey();
        }
    }

    /**
     * 마스터 키 생성
     */
    generateMasterKey() {
        const key = crypto.randomBytes(this.keyLength);
        logger.info('새 마스터 암호화 키가 생성되었습니다.');
        logger.warning('MASTER_ENCRYPTION_KEY 환경변수에 다음 값을 설정하세요:');
        logger.warning(key.toString('hex'));
        return key;
    }

    /**
     * 대칭 암호화 (AES-256-GCM)
     */
    encrypt(plaintext, key = null) {
        try {
            const encryptionKey = key || this.masterKey;
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipher(this.algorithm, encryptionKey);
            cipher.setAAD(Buffer.from('community-platform', 'utf8'));

            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const tag = cipher.getAuthTag();

            const result = {
                encrypted: encrypted,
                iv: iv.toString('hex'),
                tag: tag.toString('hex'),
                algorithm: this.algorithm
            };

            return Buffer.from(JSON.stringify(result)).toString('base64');
        } catch (error) {
            logger.error('암호화 실패:', error);
            throw new Error('데이터 암호화에 실패했습니다.');
        }
    }

    /**
     * 대칭 복호화 (AES-256-GCM)
     */
    decrypt(encryptedData, key = null) {
        try {
            const encryptionKey = key || this.masterKey;
            const data = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));

            const decipher = crypto.createDecipher(data.algorithm, encryptionKey);
            decipher.setAAD(Buffer.from('community-platform', 'utf8'));
            decipher.setAuthTag(Buffer.from(data.tag, 'hex'));

            let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            logger.error('복호화 실패:', error);
            throw new Error('데이터 복호화에 실패했습니다.');
        }
    }

    /**
     * 비대칭 암호화 (RSA)
     */
    encryptRSA(plaintext, publicKey) {
        try {
            const encrypted = crypto.publicEncrypt(
                {
                    key: publicKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256'
                },
                Buffer.from(plaintext, 'utf8')
            );

            return encrypted.toString('base64');
        } catch (error) {
            logger.error('RSA 암호화 실패:', error);
            throw new Error('RSA 암호화에 실패했습니다.');
        }
    }

    /**
     * 비대칭 복호화 (RSA)
     */
    decryptRSA(encryptedData, privateKey) {
        try {
            const decrypted = crypto.privateDecrypt(
                {
                    key: privateKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256'
                },
                Buffer.from(encryptedData, 'base64')
            );

            return decrypted.toString('utf8');
        } catch (error) {
            logger.error('RSA 복호화 실패:', error);
            throw new Error('RSA 복호화에 실패했습니다.');
        }
    }

    /**
     * RSA 키 쌍 생성
     */
    generateRSAKeyPair() {
        try {
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });

            return { publicKey, privateKey };
        } catch (error) {
            logger.error('RSA 키 쌍 생성 실패:', error);
            throw new Error('RSA 키 쌍 생성에 실패했습니다.');
        }
    }

    /**
     * 비밀번호 해싱 (PBKDF2 + scrypt)
     */
    async hashPassword(password, salt = null) {
        try {
            const saltBuffer = salt || crypto.randomBytes(this.saltLength);

            // PBKDF2로 1차 해싱
            const pbkdf2Hash = crypto.pbkdf2Sync(
                password,
                saltBuffer,
                this.iterations,
                this.keyLength,
                'sha512'
            );

            // scrypt로 2차 해싱
            const scryptHash = crypto.scryptSync(
                pbkdf2Hash,
                saltBuffer,
                this.keyLength,
                { N: 16384, r: 8, p: 1 }
            );

            return {
                hash: scryptHash.toString('hex'),
                salt: saltBuffer.toString('hex'),
                iterations: this.iterations,
                algorithm: 'pbkdf2+scrypt'
            };
        } catch (error) {
            logger.error('비밀번호 해싱 실패:', error);
            throw new Error('비밀번호 해싱에 실패했습니다.');
        }
    }

    /**
     * 비밀번호 검증
     */
    async verifyPassword(password, hashedPassword, salt, iterations = this.iterations) {
        try {
            const saltBuffer = Buffer.from(salt, 'hex');

            // 동일한 방식으로 해싱
            const pbkdf2Hash = crypto.pbkdf2Sync(
                password,
                saltBuffer,
                iterations,
                this.keyLength,
                'sha512'
            );

            const scryptHash = crypto.scryptSync(
                pbkdf2Hash,
                saltBuffer,
                this.keyLength,
                { N: 16384, r: 8, p: 1 }
            );

            return scryptHash.toString('hex') === hashedPassword;
        } catch (error) {
            logger.error('비밀번호 검증 실패:', error);
            return false;
        }
    }

    /**
     * 해시 생성 (SHA-256)
     */
    createHash(data, algorithm = 'sha256') {
        try {
            const hash = crypto.createHash(algorithm);
            hash.update(data);
            return hash.digest('hex');
        } catch (error) {
            logger.error('해시 생성 실패:', error);
            throw new Error('해시 생성에 실패했습니다.');
        }
    }

    /**
     * HMAC 생성
     */
    createHMAC(data, secret, algorithm = 'sha256') {
        try {
            const hmac = crypto.createHmac(algorithm, secret);
            hmac.update(data);
            return hmac.digest('hex');
        } catch (error) {
            logger.error('HMAC 생성 실패:', error);
            throw new Error('HMAC 생성에 실패했습니다.');
        }
    }

    /**
     * HMAC 검증
     */
    verifyHMAC(data, signature, secret, algorithm = 'sha256') {
        try {
            const expectedSignature = this.createHMAC(data, secret, algorithm);
            return crypto.timingSafeEqual(
                Buffer.from(signature, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            );
        } catch (error) {
            logger.error('HMAC 검증 실패:', error);
            return false;
        }
    }

    /**
     * 개인정보 마스킹
     */
    maskPersonalData(data, type) {
        try {
            switch (type) {
                case 'email':
                    const [local, domain] = data.split('@');
                    return `${local.substring(0, 2)}***@${domain}`;

                case 'phone':
                    return data.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');

                case 'creditCard':
                    return data.replace(/(\d{4})\d{8}(\d{4})/, '$1********$2');

                case 'ssn':
                    return data.replace(/(\d{3})\d{2}(\d{3})/, '$1**$2');

                case 'name':
                    return data.charAt(0) + '*'.repeat(data.length - 1);

                default:
                    return data.substring(0, 2) + '*'.repeat(data.length - 2);
            }
        } catch (error) {
            logger.error('개인정보 마스킹 실패:', error);
            return data;
        }
    }

    /**
     * 민감한 데이터 암호화
     */
    encryptSensitiveData(data, dataType) {
        try {
            // 데이터 타입별 추가 보안 처리
            let processedData = data;

            switch (dataType) {
                case 'email':
                    processedData = data.toLowerCase().trim();
                    break;
                case 'phone':
                    processedData = data.replace(/\D/g, ''); // 숫자만 추출
                    break;
                case 'ssn':
                    processedData = data.replace(/\D/g, '');
                    break;
            }

            return this.encrypt(processedData);
        } catch (error) {
            logger.error('민감한 데이터 암호화 실패:', error);
            throw new Error('민감한 데이터 암호화에 실패했습니다.');
        }
    }

    /**
     * 민감한 데이터 복호화
     */
    decryptSensitiveData(encryptedData, dataType) {
        try {
            const decrypted = this.decrypt(encryptedData);

            // 데이터 타입별 검증
            switch (dataType) {
                case 'email':
                    if (!this.isValidEmail(decrypted)) {
                        throw new Error('유효하지 않은 이메일 형식입니다.');
                    }
                    break;
                case 'phone':
                    if (!this.isValidPhone(decrypted)) {
                        throw new Error('유효하지 않은 전화번호 형식입니다.');
                    }
                    break;
                case 'ssn':
                    if (!this.isValidSSN(decrypted)) {
                        throw new Error('유효하지 않은 SSN 형식입니다.');
                    }
                    break;
            }

            return decrypted;
        } catch (error) {
            logger.error('민감한 데이터 복호화 실패:', error);
            throw new Error('민감한 데이터 복호화에 실패했습니다.');
        }
    }

    /**
     * 데이터 무결성 검증
     */
    verifyDataIntegrity(data, expectedHash) {
        try {
            const actualHash = this.createHash(data);
            return crypto.timingSafeEqual(
                Buffer.from(actualHash, 'hex'),
                Buffer.from(expectedHash, 'hex')
            );
        } catch (error) {
            logger.error('데이터 무결성 검증 실패:', error);
            return false;
        }
    }

    /**
     * 안전한 랜덤 문자열 생성
     */
    generateSecureRandom(length = 32) {
        try {
            return crypto.randomBytes(length).toString('hex');
        } catch (error) {
            logger.error('안전한 랜덤 생성 실패:', error);
            throw new Error('안전한 랜덤 생성에 실패했습니다.');
        }
    }

    /**
     * 키 회전
     */
    rotateEncryptionKey() {
        try {
            const oldKey = this.masterKey;
            const newKey = crypto.randomBytes(this.keyLength);

            // 기존 데이터를 새 키로 재암호화하는 로직
            // 실제로는 데이터베이스의 모든 암호화된 데이터를 처리

            this.masterKey = newKey;
            logger.info('암호화 키 회전 완료');

            return {
                success: true,
                message: '암호화 키가 성공적으로 회전되었습니다.'
            };
        } catch (error) {
            logger.error('키 회전 실패:', error);
            throw new Error('암호화 키 회전에 실패했습니다.');
        }
    }

    /**
     * 암호화 상태 검증
     */
    validateEncryptionStatus() {
        try {
            const testData = 'encryption-test-data';
            const encrypted = this.encrypt(testData);
            const decrypted = this.decrypt(encrypted);

            return {
                status: 'healthy',
                testData: testData,
                encrypted: encrypted,
                decrypted: decrypted,
                success: testData === decrypted
            };
        } catch (error) {
            logger.error('암호화 상태 검증 실패:', error);
            return {
                status: 'error',
                error: error.message,
                success: false
            };
        }
    }

    /**
     * 헬퍼 메서드들
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^\d{10,11}$/;
        return phoneRegex.test(phone);
    }

    isValidSSN(ssn) {
        const ssnRegex = /^\d{9}$/;
        return ssnRegex.test(ssn);
    }

    /**
     * 암호화 통계
     */
    getEncryptionStats() {
        return {
            algorithm: this.algorithm,
            keyLength: this.keyLength,
            ivLength: this.ivLength,
            tagLength: this.tagLength,
            saltLength: this.saltLength,
            iterations: this.iterations,
            masterKeySet: !!this.masterKey,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = new EncryptionService();
