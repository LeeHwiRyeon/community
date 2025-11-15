# 암호화 키 관리 가이드

**버전**: 1.0  
**작성일**: 2025년 11월 9일  
**대상**: 개발자, 보안 담당자

---

## 📋 목차

1. [개요](#개요)
2. [키 유형](#키-유형)
3. [키 생성](#키-생성)
4. [키 저장](#키-저장)
5. [키 교환](#키-교환)
6. [키 로테이션](#키-로테이션)
7. [키 폐기](#키-폐기)
8. [보안 모범 사례](#보안-모범-사례)
9. [문제 해결](#문제-해결)

---

## 1. 개요

### 1.1 암호화 아키텍처

```
[클라이언트 A]                [서버]                [클라이언트 B]
     |                          |                          |
개인키 (저장 안함)         공개키만 저장            개인키 (저장 안함)
ECDH P-256               데이터베이스              ECDH P-256
     |                          |                          |
  AES-256-GCM              메타데이터만              AES-256-GCM
  평문 암호화               암호문 저장               암호문 복호화
```

### 1.2 보안 원칙

✅ **제로 지식 (Zero Knowledge)**: 서버는 개인키를 절대 알 수 없음  
✅ **엔드-투-엔드 (E2EE)**: 클라이언트 간 직접 암호화  
✅ **포워드 시크리시**: 이전 메시지는 새 키로 복호화 불가  
✅ **키 격리**: 각 사용자의 키는 완전히 독립적

---

## 2. 키 유형

### 2.1 비대칭 키 (ECDH P-256)

#### 용도
- 안전한 키 교환
- 공유 비밀 생성

#### 특징
| 항목          | 내용                                   |
| ------------- | -------------------------------------- |
| **알고리즘**  | ECDH (Elliptic Curve Diffie-Hellman)   |
| **곡선**      | P-256 (NIST P-256, secp256r1)          |
| **키 길이**   | 256 bits                               |
| **용도**      | Key Agreement                          |
| **저장 위치** | 공개키: 서버 DB / 개인키: 클라이언트만 |

#### 생성
```javascript
// Web Crypto API 사용
const keyPair = await window.crypto.subtle.generateKey(
    {
        name: 'ECDH',
        namedCurve: 'P-256'
    },
    true,  // extractable
    ['deriveKey', 'deriveBits']
);

// 공개키 내보내기
const publicKeyJwk = await window.crypto.subtle.exportKey(
    'jwk',
    keyPair.publicKey
);

// ⚠️ 개인키는 절대 내보내지 않음!
```

### 2.2 대칭 키 (AES-256-GCM)

#### 용도
- 메시지 암호화/복호화
- 데이터 무결성 검증

#### 특징
| 항목          | 내용                          |
| ------------- | ----------------------------- |
| **알고리즘**  | AES-GCM (Galois/Counter Mode) |
| **키 길이**   | 256 bits                      |
| **IV 길이**   | 12 bytes (96 bits)            |
| **Tag 길이**  | 16 bytes (128 bits)           |
| **용도**      | Encryption + Authentication   |
| **저장 위치** | 클라이언트만 (임시)           |

#### 생성 (ECDH로부터 유도)
```javascript
// 1. ECDH로 공유 비밀 생성
const sharedSecret = await window.crypto.subtle.deriveBits(
    {
        name: 'ECDH',
        public: recipientPublicKey
    },
    myPrivateKey,
    256  // bits
);

// 2. HKDF로 AES 키 유도
const aesKey = await window.crypto.subtle.deriveKey(
    {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(32),
        info: new TextEncoder().encode('message-encryption')
    },
    await window.crypto.subtle.importKey(
        'raw',
        sharedSecret,
        'HKDF',
        false,
        ['deriveKey']
    ),
    {
        name: 'AES-GCM',
        length: 256
    },
    false,  // not extractable
    ['encrypt', 'decrypt']
);
```

---

## 3. 키 생성

### 3.1 사용자 등록 시

```javascript
// frontend/src/services/messageEncryptionService.ts

/**
 * 사용자 키 쌍 생성 및 등록
 */
export async function initializeUserEncryption(userId: string): Promise<void> {
    try {
        // 1. ECDH 키 쌍 생성
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: 'ECDH',
                namedCurve: 'P-256'
            },
            true,
            ['deriveKey', 'deriveBits']
        );

        // 2. 공개키 내보내기 (JWK 형식)
        const publicKeyJwk = await window.crypto.subtle.exportKey(
            'jwk',
            keyPair.publicKey
        );

        // 3. 서버에 공개키 등록
        await fetch('/api/encryption/keys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            },
            body: JSON.stringify({
                user_id: userId,
                public_key: JSON.stringify(publicKeyJwk),
                key_algorithm: 'ECDH-P256',
                key_version: '1.0'
            })
        });

        // 4. 개인키를 안전하게 저장 (IndexedDB)
        await storePrivateKey(userId, keyPair.privateKey);

        console.log('✅ 암호화 키 생성 및 등록 완료');
    } catch (error) {
        console.error('❌ 키 생성 실패:', error);
        throw error;
    }
}
```

### 3.2 체크리스트

- [x] ECDH P-256 알고리즘 사용
- [x] Web Crypto API 사용 (안전한 난수)
- [x] 공개키만 서버 전송
- [x] 개인키는 클라이언트에만 저장
- [x] 키 버전 관리
- [x] 에러 처리

---

## 4. 키 저장

### 4.1 개인키 저장 (클라이언트)

#### ⚠️ 중요: 개인키는 절대 서버로 전송하지 않음!

```javascript
/**
 * 개인키를 IndexedDB에 안전하게 저장
 */
async function storePrivateKey(
    userId: string, 
    privateKey: CryptoKey
): Promise<void> {
    const db = await openDB('EncryptionKeys', 1, {
        upgrade(db) {
            db.createObjectStore('privateKeys');
        }
    });

    await db.put('privateKeys', privateKey, userId);
}

/**
 * 개인키 불러오기
 */
async function loadPrivateKey(userId: string): Promise<CryptoKey | null> {
    try {
        const db = await openDB('EncryptionKeys', 1);
        return await db.get('privateKeys', userId);
    } catch (error) {
        console.error('개인키 로드 실패:', error);
        return null;
    }
}
```

#### 저장 옵션 비교

| 방법               | 보안  | 지속성   | 권장     |
| ------------------ | ----- | -------- | -------- |
| **IndexedDB**      | ⭐⭐⭐⭐  | ✅ 영구   | ✅ 권장   |
| **SessionStorage** | ⭐⭐⭐   | ❌ 세션만 | ⚠️ 주의   |
| **LocalStorage**   | ⭐⭐    | ✅ 영구   | ❌ 비권장 |
| **메모리**         | ⭐⭐⭐⭐⭐ | ❌ 휘발성 | ℹ️ 임시용 |

### 4.2 공개키 저장 (서버)

```sql
-- user_encryption_keys 테이블
CREATE TABLE user_encryption_keys (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,           -- JWK 형식
    key_algorithm VARCHAR(20) NOT NULL, -- 'ECDH-P256'
    key_version VARCHAR(10),            -- '1.0'
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_active (is_active),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### API: 공개키 등록

```javascript
// POST /api/encryption/keys
router.post('/keys', authenticateToken, async (req, res) => {
    try {
        const { user_id, public_key, key_algorithm } = req.body;

        // 1. 권한 확인
        if (req.user.sub !== user_id) {
            return res.status(403).json({ error: 'FORBIDDEN' });
        }

        // 2. 기존 키 비활성화
        await query(
            'UPDATE user_encryption_keys SET is_active = 0 WHERE user_id = ?',
            [user_id]
        );

        // 3. 새 키 저장
        const result = await query(
            `INSERT INTO user_encryption_keys 
             (user_id, public_key, key_algorithm, key_version) 
             VALUES (?, ?, ?, ?)`,
            [user_id, public_key, key_algorithm, '1.0']
        );

        // 4. 감사 로그
        await logEncryptionAudit({
            user_id,
            action: 'KEY_REGISTERED',
            status: 'success'
        });

        res.json({ 
            message: 'Public key registered',
            key_id: result.insertId 
        });
    } catch (error) {
        console.error('공개키 등록 실패:', error);
        res.status(500).json({ error: 'KEY_REGISTRATION_FAILED' });
    }
});
```

---

## 5. 키 교환

### 5.1 ECDH 키 교환 프로토콜

```
[Alice]                          [Server]                          [Bob]
   |                                |                                |
   | 1. 공개키 등록 (Alice_Pub)        |                                |
   |-------------------------------->|                                |
   |                                |                                |
   |                                | 2. 공개키 등록 (Bob_Pub)          |
   |                                |<-------------------------------|
   |                                |                                |
   | 3. Bob의 공개키 요청              |                                |
   |-------------------------------->|                                |
   |<--------------------------------|                                |
   |        Bob_Pub                 |                                |
   |                                |                                |
   | 4. ECDH 수행                     |                                |
   |    SharedSecret =              |                                |
   |    ECDH(Alice_Priv, Bob_Pub)   |                                |
   |                                |                                |
   | 5. AES 키 유도 (HKDF)            |                                |
   |    AES_Key = HKDF(SharedSecret)|                                |
   |                                |                                |
   | 6. 메시지 암호화                  |                                |
   |    Ciphertext = AES-GCM(Msg)   |                                |
   |                                |                                |
   | 7. 암호문 전송                    |                                |
   |-------------------------------->|                                |
   |                                | 8. 암호문 저장 및 전달             |
   |                                |------------------------------->|
   |                                |                                |
   |                                |                                | 9. ECDH 수행
   |                                |                                |    ECDH(Bob_Priv, Alice_Pub)
   |                                |                                |
   |                                |                                | 10. 복호화
   |                                |                                |     Msg = Decrypt(Ciphertext)
```

### 5.2 구현

```javascript
/**
 * 수신자의 공개키 가져오기
 */
async function getRecipientPublicKey(recipientId: string): Promise<CryptoKey> {
    // 1. 서버에서 공개키 조회
    const response = await fetch(`/api/encryption/keys/${recipientId}`, {
        headers: {
            'Authorization': `Bearer ${getAccessToken()}`
        }
    });

    if (!response.ok) {
        throw new Error('PUBLIC_KEY_NOT_FOUND');
    }

    const { public_key } = await response.json();
    const publicKeyJwk = JSON.parse(public_key);

    // 2. JWK를 CryptoKey로 변환
    return await window.crypto.subtle.importKey(
        'jwk',
        publicKeyJwk,
        {
            name: 'ECDH',
            namedCurve: 'P-256'
        },
        true,
        []  // 키 교환만 사용
    );
}

/**
 * 공유 비밀 생성
 */
async function deriveSharedSecret(
    myPrivateKey: CryptoKey,
    theirPublicKey: CryptoKey
): Promise<ArrayBuffer> {
    return await window.crypto.subtle.deriveBits(
        {
            name: 'ECDH',
            public: theirPublicKey
        },
        myPrivateKey,
        256  // 256 bits
    );
}

/**
 * AES 키 유도
 */
async function deriveAESKey(
    sharedSecret: ArrayBuffer
): Promise<CryptoKey> {
    // 1. SharedSecret을 HKDF 키로 import
    const hkdfKey = await window.crypto.subtle.importKey(
        'raw',
        sharedSecret,
        'HKDF',
        false,
        ['deriveKey']
    );

    // 2. HKDF로 AES 키 유도
    return await window.crypto.subtle.deriveKey(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: new Uint8Array(32),  // 고정 salt (실제로는 메시지마다 다르게)
            info: new TextEncoder().encode('message-encryption-v1')
        },
        hkdfKey,
        {
            name: 'AES-GCM',
            length: 256
        },
        false,  // not extractable (보안)
        ['encrypt', 'decrypt']
    );
}
```

---

## 6. 키 로테이션

### 6.1 언제 키를 교체해야 하나?

✅ **필수 교체 시점**
- 개인키 유출 의심
- 계정 해킹
- 비밀번호 변경
- 긴급 보안 사고

⚠️ **권장 교체 시점**
- 정기 로테이션 (예: 90일)
- 다량의 메시지 교환 후 (예: 10,000건)
- 디바이스 변경

### 6.2 키 로테이션 프로세스

```javascript
/**
 * 키 로테이션 (새 키 쌍 생성 및 등록)
 */
async function rotateEncryptionKeys(userId: string): Promise<void> {
    try {
        // 1. 새 키 쌍 생성
        const newKeyPair = await window.crypto.subtle.generateKey(
            {
                name: 'ECDH',
                namedCurve: 'P-256'
            },
            true,
            ['deriveKey', 'deriveBits']
        );

        // 2. 공개키 내보내기
        const newPublicKeyJwk = await window.crypto.subtle.exportKey(
            'jwk',
            newKeyPair.publicKey
        );

        // 3. 서버에 새 공개키 등록 (기존 키는 자동 비활성화)
        await fetch('/api/encryption/keys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            },
            body: JSON.stringify({
                user_id: userId,
                public_key: JSON.stringify(newPublicKeyJwk),
                key_algorithm: 'ECDH-P256',
                key_version: '2.0'  // 버전 증가
            })
        });

        // 4. 기존 개인키 삭제
        await deletePrivateKey(userId);

        // 5. 새 개인키 저장
        await storePrivateKey(userId, newKeyPair.privateKey);

        console.log('✅ 키 로테이션 완료');
    } catch (error) {
        console.error('❌ 키 로테이션 실패:', error);
        throw error;
    }
}
```

### 6.3 이전 메시지 처리

⚠️ **중요**: 키 로테이션 후 이전 메시지는 복호화할 수 없습니다!

**해결 방법**:
1. **키 아카이빙**: 이전 개인키를 안전하게 보관 (선택적)
2. **재암호화**: 모든 메시지를 새 키로 재암호화 (비용 높음)
3. **포기**: 이전 메시지는 읽을 수 없음 (포워드 시크리시)

```javascript
// 옵션 1: 키 아카이빙 (보안 위험 존재)
async function archiveOldKey(
    userId: string, 
    oldPrivateKey: CryptoKey,
    keyVersion: string
): Promise<void> {
    const db = await openDB('EncryptionKeys', 1);
    await db.put('archivedKeys', oldPrivateKey, `${userId}_v${keyVersion}`);
    
    // ⚠️ 주의: 키가 많이 쌓이면 보안 위험
}
```

---

## 7. 키 폐기

### 7.1 계정 삭제 시

```javascript
/**
 * 사용자 키 완전 삭제
 */
async function deleteUserKeys(userId: string): Promise<void> {
    try {
        // 1. 클라이언트: 개인키 삭제
        await deletePrivateKey(userId);
        await deleteArchivedKeys(userId);

        // 2. 서버: 공개키 삭제
        await fetch(`/api/encryption/keys/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAccessToken()}`
            }
        });

        // 3. 모든 암호화된 메시지 삭제
        await fetch(`/api/encryption/messages/user/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAccessToken()}`
            }
        });

        console.log('✅ 모든 키와 데이터 삭제 완료');
    } catch (error) {
        console.error('❌ 키 삭제 실패:', error);
        throw error;
    }
}

/**
 * IndexedDB에서 개인키 삭제
 */
async function deletePrivateKey(userId: string): Promise<void> {
    const db = await openDB('EncryptionKeys', 1);
    await db.delete('privateKeys', userId);
}

/**
 * 아카이브된 키 모두 삭제
 */
async function deleteArchivedKeys(userId: string): Promise<void> {
    const db = await openDB('EncryptionKeys', 1);
    const allKeys = await db.getAllKeys('archivedKeys');
    
    for (const key of allKeys) {
        if (key.toString().startsWith(userId)) {
            await db.delete('archivedKeys', key);
        }
    }
}
```

### 7.2 서버 측 삭제

```javascript
// DELETE /api/encryption/keys/:userId
router.delete('/keys/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // 권한 확인
        if (req.user.sub !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'FORBIDDEN' });
        }

        // 공개키 삭제
        await query(
            'DELETE FROM user_encryption_keys WHERE user_id = ?',
            [userId]
        );

        // 감사 로그
        await logEncryptionAudit({
            user_id: userId,
            action: 'KEY_DELETED',
            status: 'success',
            ip_address: req.ip
        });

        res.json({ message: 'Keys deleted' });
    } catch (error) {
        console.error('키 삭제 실패:', error);
        res.status(500).json({ error: 'KEY_DELETION_FAILED' });
    }
});
```

---

## 8. 보안 모범 사례

### 8.1 DO ✅

1. **Web Crypto API 사용**
   ```javascript
   // ✅ 좋음: Web Crypto API
   await window.crypto.subtle.generateKey(...)
   
   // ❌ 나쁨: 서드파티 라이브러리 (보안 검증 필요)
   const key = SomeLibrary.generateKey()
   ```

2. **개인키는 절대 전송하지 않음**
   ```javascript
   // ✅ 좋음
   const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
   await sendToServer(publicKeyJwk);
   
   // ❌ 절대 금지
   const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
   await sendToServer(privateKeyJwk);  // 🚨 위험!
   ```

3. **키를 extractable=false로 생성**
   ```javascript
   // ✅ 좋음: AES 키는 추출 불가
   const aesKey = await crypto.subtle.deriveKey(
       ...,
       false,  // not extractable
       ['encrypt', 'decrypt']
   );
   ```

4. **정기 키 로테이션**
   ```javascript
   // ✅ 좋음: 90일마다 자동 로테이션
   setInterval(async () => {
       await rotateEncryptionKeys(userId);
   }, 90 * 24 * 60 * 60 * 1000);
   ```

### 8.2 DON'T ❌

1. **개인키를 LocalStorage에 저장 금지**
   ```javascript
   // ❌ 절대 금지: XSS 공격에 취약
   localStorage.setItem('privateKey', JSON.stringify(privateKeyJwk));
   ```

2. **키를 평문으로 로깅 금지**
   ```javascript
   // ❌ 절대 금지
   console.log('Private Key:', privateKey);
   console.log('Shared Secret:', sharedSecret);
   ```

3. **약한 알고리즘 사용 금지**
   ```javascript
   // ❌ 절대 금지
   const keyPair = await crypto.subtle.generateKey(
       { name: 'RSA-OAEP', modulusLength: 1024 },  // 너무 약함!
       ...
   );
   ```

---

## 9. 문제 해결

### 9.1 일반적인 오류

#### PUBLIC_KEY_NOT_FOUND
```javascript
// 원인: 수신자가 키를 등록하지 않음
// 해결: 수신자에게 키 등록 요청

if (error.code === 'PUBLIC_KEY_NOT_FOUND') {
    showNotification('수신자가 암호화를 활성화하지 않았습니다.');
    // 암호화 없이 전송 또는 전송 중단
}
```

#### DECRYPTION_FAILED
```javascript
// 원인: 잘못된 키, 변조된 데이터, 키 불일치
// 해결: 키 확인 및 재동기화

if (error.code === 'DECRYPTION_FAILED') {
    // 1. 키 재동기화 시도
    await resyncKeys(userId);
    
    // 2. 재시도
    try {
        const decrypted = await decryptMessage(ciphertext);
    } catch {
        // 3. 실패 시 사용자에게 알림
        showError('메시지를 복호화할 수 없습니다.');
    }
}
```

### 9.2 키 복구

```javascript
/**
 * 키가 손실된 경우 복구 불가
 * 새 키 생성만 가능
 */
async function recoverKeys(userId: string): Promise<void> {
    // ⚠️ 경고: 이전 메시지는 복호화 불가
    const confirmRecovery = confirm(
        '새 키를 생성하면 이전 메시지를 읽을 수 없습니다. 계속하시겠습니까?'
    );

    if (!confirmRecovery) {
        return;
    }

    // 새 키 생성
    await initializeUserEncryption(userId);
    
    showNotification('새 암호화 키가 생성되었습니다.');
}
```

---

## 10. 감사 및 모니터링

### 10.1 감사 로그

```sql
-- encryption_audit_log 테이블
CREATE TABLE encryption_audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    action VARCHAR(50) NOT NULL,  -- 'KEY_REGISTERED', 'KEY_ROTATED', 'MESSAGE_ENCRYPTED'
    status VARCHAR(20) NOT NULL,  -- 'success', 'failed'
    error_message TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);
```

### 10.2 모니터링 대상

- ✅ 키 등록 빈도 (비정상적으로 많은 등록)
- ✅ 복호화 실패율 (키 불일치 가능성)
- ✅ 키 로테이션 주기
- ✅ 암호화 작업 성능

---

## 11. 참고 자료

### 11.1 내부 문서
- [SECURITY_FINAL_REPORT.md](./SECURITY_FINAL_REPORT.md)
- [ENCRYPTION_BACKEND_INTEGRATION_GUIDE.md](./ENCRYPTION_BACKEND_INTEGRATION_GUIDE.md)

### 11.2 외부 자료
- [Web Crypto API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [NIST P-256](https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=2515)
- [ECDH - RFC 6090](https://tools.ietf.org/html/rfc6090)

---

**작성자**: GitHub Copilot Security Team  
**검토일**: 2025년 11월 9일  
**다음 검토**: 2026년 2월 9일
