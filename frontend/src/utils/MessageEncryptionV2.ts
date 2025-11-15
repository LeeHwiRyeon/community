/**
 * 메시지 암호화 v2.0 - Web Crypto API 기반
 * AES-256-GCM 암호화를 사용한 엔드투엔드 암호화
 * 
 * 개선사항:
 * - CryptoJS 대신 Web Crypto API 사용 (브라우저 네이티브)
 * - AES-CBC → AES-GCM (인증 암호화)
 * - PBKDF2 키 유도 개선
 * - 타입 안전성 강화
 * 
 * @version 2.0.0
 * @created 2025-11-09
 */

export interface EncryptedMessage {
    encryptedContent: string; // Base64 encoded ciphertext
    iv: string; // Base64 encoded IV
    tag: string; // Base64 encoded authentication tag
    timestamp: number;
    messageId: string;
    version: number; // Encryption version for backward compatibility
}

export interface DecryptedMessage {
    content: string;
    timestamp: number;
    messageId: string;
    isEncrypted: boolean;
    version: number;
}

export interface KeyMaterial {
    key: CryptoKey;
    salt: string; // Base64 encoded salt
}

export class MessageEncryptionV2 {
    private static readonly ALGORITHM = 'AES-GCM';
    private static readonly KEY_LENGTH = 256;
    private static readonly IV_LENGTH = 12; // 96 bits for GCM
    private static readonly TAG_LENGTH = 16; // 128 bits auth tag
    private static readonly PBKDF2_ITERATIONS = 100000;
    private static readonly VERSION = 2;

    /**
     * 채팅방별 암호화 키 생성 (PBKDF2)
     * @param roomId 채팅방 ID
     * @param masterKey 마스터 키 (사용자 비밀번호 등)
     * @returns KeyMaterial 객체 (암호화 키 + salt)
     */
    static async generateRoomKey(roomId: string, masterKey: string): Promise<KeyMaterial> {
        try {
            // Salt 생성 (roomId를 seed로 사용하여 deterministic하게)
            const encoder = new TextEncoder();
            const roomIdBuffer = encoder.encode(roomId);
            const saltBuffer = await crypto.subtle.digest('SHA-256', roomIdBuffer);
            const salt = this.arrayBufferToBase64(saltBuffer);

            // Master key를 CryptoKey로 변환
            const masterKeyBuffer = encoder.encode(masterKey);
            const importedKey = await crypto.subtle.importKey(
                'raw',
                masterKeyBuffer,
                { name: 'PBKDF2' },
                false,
                ['deriveKey']
            );

            // PBKDF2로 AES 키 유도
            const derivedKey = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: saltBuffer,
                    iterations: this.PBKDF2_ITERATIONS,
                    hash: 'SHA-256'
                },
                importedKey,
                { name: 'AES-GCM', length: this.KEY_LENGTH },
                false, // Not extractable for security
                ['encrypt', 'decrypt']
            );

            return {
                key: derivedKey,
                salt
            };
        } catch (error) {
            console.error('❌ Room key generation failed:', error);
            throw new Error('Failed to generate room key');
        }
    }

    /**
     * 메시지 암호화 (AES-256-GCM)
     * @param content 암호화할 메시지 내용
     * @param roomKey 채팅방별 암호화 키
     * @returns 암호화된 메시지 객체
     */
    static async encryptMessage(content: string, roomKey: CryptoKey): Promise<EncryptedMessage> {
        try {
            // 랜덤 IV 생성 (96 bits for GCM)
            const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

            // 메시지 ID 생성
            const messageId = this.generateMessageId();

            // 타임스탬프
            const timestamp = Date.now();

            // 메시지와 메타데이터 결합
            const messageData = JSON.stringify({
                content,
                timestamp,
                messageId
            });

            // UTF-8 인코딩
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(messageData);

            // AES-256-GCM 암호화
            const encryptedBuffer = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                    tagLength: this.TAG_LENGTH * 8 // 128 bits
                },
                roomKey,
                dataBuffer
            );

            // GCM은 ciphertext + tag를 함께 반환
            // tag는 마지막 16 bytes
            const encryptedArray = new Uint8Array(encryptedBuffer);
            const ciphertextLength = encryptedArray.length - this.TAG_LENGTH;
            const ciphertext = encryptedArray.slice(0, ciphertextLength);
            const tag = encryptedArray.slice(ciphertextLength);

            return {
                encryptedContent: this.arrayBufferToBase64(ciphertext),
                iv: this.arrayBufferToBase64(iv),
                tag: this.arrayBufferToBase64(tag),
                timestamp,
                messageId,
                version: this.VERSION
            };
        } catch (error) {
            console.error('❌ Message encryption failed:', error);
            throw new Error('Failed to encrypt message');
        }
    }

    /**
     * 메시지 복호화 (AES-256-GCM)
     * @param encryptedMessage 암호화된 메시지 객체
     * @param roomKey 채팅방별 암호화 키
     * @returns 복호화된 메시지 객체
     */
    static async decryptMessage(
        encryptedMessage: EncryptedMessage,
        roomKey: CryptoKey
    ): Promise<DecryptedMessage> {
        try {
            // Base64 디코딩
            const iv = this.base64ToArrayBuffer(encryptedMessage.iv);
            const ciphertext = this.base64ToArrayBuffer(encryptedMessage.encryptedContent);
            const tag = this.base64ToArrayBuffer(encryptedMessage.tag);

            // GCM은 ciphertext + tag를 함께 전달
            const encryptedData = new Uint8Array(ciphertext.byteLength + tag.byteLength);
            encryptedData.set(new Uint8Array(ciphertext), 0);
            encryptedData.set(new Uint8Array(tag), ciphertext.byteLength);

            // AES-256-GCM 복호화
            const decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: new Uint8Array(iv),
                    tagLength: this.TAG_LENGTH * 8
                },
                roomKey,
                encryptedData
            );

            // UTF-8 디코딩
            const decoder = new TextDecoder();
            const decryptedString = decoder.decode(decryptedBuffer);

            if (!decryptedString) {
                throw new Error('Decrypted data is empty');
            }

            const messageData = JSON.parse(decryptedString);

            return {
                content: messageData.content,
                timestamp: messageData.timestamp,
                messageId: messageData.messageId,
                isEncrypted: true,
                version: encryptedMessage.version || 2
            };
        } catch (error) {
            console.error('❌ Message decryption failed:', error);
            throw new Error('Failed to decrypt message');
        }
    }

    /**
     * 메시지 무결성 검증
     * GCM 모드는 인증을 내장하고 있으므로, 복호화 성공 = 무결성 검증 성공
     * @param message 메시지 객체
     * @param roomKey 채팅방별 암호화 키
     * @returns 무결성 검증 결과
     */
    static async verifyMessageIntegrity(
        message: EncryptedMessage,
        roomKey: CryptoKey
    ): Promise<boolean> {
        try {
            const decrypted = await this.decryptMessage(message, roomKey);
            return (
                decrypted.content.length > 0 &&
                decrypted.messageId === message.messageId &&
                Math.abs(decrypted.timestamp - message.timestamp) < 1000 // 1초 허용 오차
            );
        } catch (error) {
            return false;
        }
    }

    /**
     * 메시지 ID 생성 (Cryptographically secure)
     * @returns 16바이트 hex 문자열
     */
    private static generateMessageId(): string {
        const buffer = crypto.getRandomValues(new Uint8Array(16));
        return Array.from(buffer)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * ArrayBuffer를 Base64로 인코딩
     */
    private static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
        const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Base64를 ArrayBuffer로 디코딩
     */
    private static base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * 안전한 랜덤 키 생성
     * @param length 키 길이 (바이트)
     * @returns Base64 인코딩된 랜덤 키
     */
    static generateSecureRandomKey(length: number = 32): string {
        const buffer = crypto.getRandomValues(new Uint8Array(length));
        return this.arrayBufferToBase64(buffer);
    }

    /**
     * 키 강도 검증
     * @param key 검증할 키
     * @returns 키가 충분히 강력한지 여부
     */
    static validateKeyStrength(key: string): boolean {
        // 최소 32자 이상
        if (key.length < 32) return false;

        // 엔트로피 검증 (간단한 휴리스틱)
        const uniqueChars = new Set(key).size;
        const entropyRatio = uniqueChars / key.length;

        // 최소 50% 이상의 고유 문자
        return entropyRatio >= 0.5;
    }
}
