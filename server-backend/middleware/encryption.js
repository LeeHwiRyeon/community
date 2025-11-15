// Advanced Encryption and Key Management
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// 암호화 설정
const encryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyLength: 32, // 256 bits
    ivLength: 16,  // 128 bits
    tagLength: 16, // 128 bits
    saltRounds: 12,
    keyRotationInterval: 24 * 60 * 60 * 1000, // 24시간
    maxKeyAge: 7 * 24 * 60 * 60 * 1000 // 7일
};

// 키 저장소 (실제 환경에서는 안전한 키 관리 시스템 사용)
const keyStore = new Map();
let currentKeyId = null;

// 키 생성
function generateKey() {
    const keyId = crypto.randomUUID();
    const key = crypto.randomBytes(encryptionConfig.keyLength);
    const createdAt = Date.now();

    keyStore.set(keyId, {
        key,
        createdAt,
        lastUsed: createdAt,
        usageCount: 0
    });

    return { keyId, key };
}

// 현재 키 가져오기 또는 생성
function getCurrentKey() {
    if (!currentKeyId || !keyStore.has(currentKeyId)) {
        const { keyId } = generateKey();
        currentKeyId = keyId;
    }

    const keyData = keyStore.get(currentKeyId);
    keyData.lastUsed = Date.now();
    keyData.usageCount++;

    return { keyId: currentKeyId, key: keyData.key };
}

// 키 회전
function rotateKey() {
    const oldKeyId = currentKeyId;
    const { keyId: newKeyId } = generateKey();
    currentKeyId = newKeyId;

    // 오래된 키 정리 (7일 후)
    setTimeout(() => {
        keyStore.delete(oldKeyId);
    }, encryptionConfig.maxKeyAge);

    return { oldKeyId, newKeyId };
}

// AES-256-GCM 암호화
function encrypt(text, keyId = null) {
    const { keyId: currentKeyId, key } = keyId ?
        { keyId, key: keyStore.get(keyId).key } :
        getCurrentKey();

    const iv = crypto.randomBytes(encryptionConfig.ivLength);
    const cipher = crypto.createCipheriv(encryptionConfig.algorithm, key, iv);
    cipher.setAAD(Buffer.from(keyId || currentKeyId, 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        keyId: currentKeyId,
        algorithm: encryptionConfig.algorithm
    };
}

// AES-256-GCM 복호화
function decrypt(encryptedData) {
    const { encrypted, iv, tag, keyId, algorithm } = encryptedData;

    if (!keyStore.has(keyId)) {
        throw new Error('Key not found');
    }

    const key = keyStore.get(keyId).key;
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    decipher.setAAD(Buffer.from(keyId, 'utf8'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

// 비밀번호 해싱 (bcrypt)
async function hashPassword(password) {
    return await bcrypt.hash(password, encryptionConfig.saltRounds);
}

// 비밀번호 검증
async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// 민감한 데이터 암호화 (DB 저장용)
function encryptSensitiveData(data) {
    if (typeof data !== 'string') {
        data = JSON.stringify(data);
    }

    const encrypted = encrypt(data);
    return JSON.stringify(encrypted);
}

// 민감한 데이터 복호화 (DB에서 읽기용)
function decryptSensitiveData(encryptedData) {
    try {
        const parsed = JSON.parse(encryptedData);
        return decrypt(parsed);
    } catch (error) {
        throw new Error('Failed to decrypt sensitive data');
    }
}

// 파일 암호화
function encryptFile(fileBuffer, keyId = null) {
    const { keyId: currentKeyId, key } = keyId ?
        { keyId, key: keyStore.get(keyId).key } :
        getCurrentKey();

    const iv = crypto.randomBytes(encryptionConfig.ivLength);
    const cipher = crypto.createCipheriv(encryptionConfig.algorithm, key, iv);
    cipher.setAAD(Buffer.from(keyId || currentKeyId, 'utf8'));

    const encrypted = Buffer.concat([
        cipher.update(fileBuffer),
        cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        keyId: currentKeyId,
        algorithm: encryptionConfig.algorithm
    };
}

// 파일 복호화
function decryptFile(encryptedFileData) {
    const { encrypted, iv, tag, keyId, algorithm } = encryptedFileData;

    if (!keyStore.has(keyId)) {
        throw new Error('Key not found');
    }

    const key = keyStore.get(keyId).key;
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    decipher.setAAD(Buffer.from(keyId, 'utf8'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);

    return decrypted;
}

// 해시 생성 (무결성 검증용)
function createHash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(data).digest('hex');
}

// HMAC 생성 (인증용)
function createHMAC(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

// 랜덤 토큰 생성
function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

// 안전한 랜덤 문자열 생성
function generateSecureString(length = 16) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
        result += charset[randomBytes[i] % charset.length];
    }

    return result;
}

// 키 상태 확인
function getKeyStatus() {
    const now = Date.now();
    const keys = Array.from(keyStore.entries()).map(([keyId, keyData]) => ({
        keyId,
        createdAt: keyData.createdAt,
        lastUsed: keyData.lastUsed,
        usageCount: keyData.usageCount,
        age: now - keyData.createdAt,
        isExpired: now - keyData.createdAt > encryptionConfig.maxKeyAge
    }));

    return {
        currentKeyId,
        totalKeys: keys.length,
        keys: keys.sort((a, b) => b.createdAt - a.createdAt)
    };
}

// 키 정리 (만료된 키 제거)
function cleanupExpiredKeys() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [keyId, keyData] of keyStore.entries()) {
        if (now - keyData.createdAt > encryptionConfig.maxKeyAge) {
            expiredKeys.push(keyId);
        }
    }

    expiredKeys.forEach(keyId => keyStore.delete(keyId));

    return {
        cleaned: expiredKeys.length,
        remaining: keyStore.size
    };
}

// 정기 키 회전
setInterval(() => {
    const { oldKeyId, newKeyId } = rotateKey();
    console.log(`[Encryption] Key rotated: ${oldKeyId} -> ${newKeyId}`);
}, encryptionConfig.keyRotationInterval);

// 정기 키 정리
setInterval(() => {
    const result = cleanupExpiredKeys();
    if (result.cleaned > 0) {
        console.log(`[Encryption] Cleaned up ${result.cleaned} expired keys`);
    }
}, 60 * 60 * 1000); // 1시간마다

// 초기 키 생성
if (keyStore.size === 0) {
    const { keyId } = generateKey();
    currentKeyId = keyId;
}

export {
    // 암호화/복호화
    encrypt,
    decrypt,
    encryptSensitiveData,
    decryptSensitiveData,
    encryptFile,
    decryptFile,

    // 비밀번호
    hashPassword,
    verifyPassword,

    // 해시 및 토큰
    createHash,
    createHMAC,
    generateToken,
    generateSecureString,

    // 키 관리
    getCurrentKey,
    rotateKey,
    getKeyStatus,
    cleanupExpiredKeys,

    // 설정
    encryptionConfig
};
