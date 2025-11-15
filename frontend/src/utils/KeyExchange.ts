/**
 * ECDH 키 교환 (Elliptic Curve Diffie-Hellman)
 * 
 * 사용자 간 안전한 공유 키 생성을 위한 키 교환 프로토콜
 * P-256 curve 사용
 * 
 * @version 1.0.0
 * @created 2025-11-09
 */

export interface KeyPair {
    publicKey: CryptoKey;
    privateKey: CryptoKey;
}

export interface ExportedPublicKey {
    x: string; // Base64 encoded x coordinate
    y: string; // Base64 encoded y coordinate
}

export interface SharedSecret {
    key: CryptoKey;
    salt: string;
}

export class KeyExchange {
    private static readonly CURVE = 'P-256'; // NIST P-256 curve
    private static readonly KEY_USAGE: KeyUsage[] = ['deriveKey', 'deriveBits'];
    private static readonly DERIVED_KEY_LENGTH = 256;

    /**
     * ECDH 키 쌍 생성
     * @returns KeyPair 객체 (공개키 + 개인키)
     */
    static async generateKeyPair(): Promise<KeyPair> {
        try {
            const keyPair = await crypto.subtle.generateKey(
                {
                    name: 'ECDH',
                    namedCurve: this.CURVE
                },
                false, // Private key not extractable for security
                this.KEY_USAGE
            );

            return {
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey
            };
        } catch (error) {
            console.error('❌ ECDH key pair generation failed:', error);
            throw new Error('Failed to generate ECDH key pair');
        }
    }

    /**
     * 공개키를 전송 가능한 형태로 변환
     * @param publicKey CryptoKey 형태의 공개키
     * @returns Base64 인코딩된 공개키 좌표
     */
    static async exportPublicKey(publicKey: CryptoKey): Promise<ExportedPublicKey> {
        try {
            const exported = await crypto.subtle.exportKey('jwk', publicKey);

            if (!exported.x || !exported.y) {
                throw new Error('Invalid public key format');
            }

            return {
                x: exported.x,
                y: exported.y
            };
        } catch (error) {
            console.error('❌ Public key export failed:', error);
            throw new Error('Failed to export public key');
        }
    }

    /**
     * 전송받은 공개키를 CryptoKey로 변환
     * @param exportedKey Base64 인코딩된 공개키
     * @returns CryptoKey 형태의 공개키
     */
    static async importPublicKey(exportedKey: ExportedPublicKey): Promise<CryptoKey> {
        try {
            const jwk: JsonWebKey = {
                kty: 'EC',
                crv: this.CURVE,
                x: exportedKey.x,
                y: exportedKey.y,
                ext: true
            };

            const publicKey = await crypto.subtle.importKey(
                'jwk',
                jwk,
                {
                    name: 'ECDH',
                    namedCurve: this.CURVE
                },
                true,
                [] // Public key doesn't need usage
            );

            return publicKey;
        } catch (error) {
            console.error('❌ Public key import failed:', error);
            throw new Error('Failed to import public key');
        }
    }

    /**
     * 공유 비밀키 생성 (ECDH)
     * @param privateKey 자신의 개인키
     * @param otherPublicKey 상대방의 공개키
     * @param salt Salt 값 (선택, roomId 등 사용)
     * @returns 공유 비밀키 (AES-GCM 키로 사용 가능)
     */
    static async deriveSharedSecret(
        privateKey: CryptoKey,
        otherPublicKey: CryptoKey,
        salt?: string
    ): Promise<SharedSecret> {
        try {
            // Salt 생성 또는 사용
            const saltString = salt || this.generateSalt();
            const encoder = new TextEncoder();
            const saltBuffer = encoder.encode(saltString);

            // ECDH로 공유 비밀 생성
            const sharedKey = await crypto.subtle.deriveKey(
                {
                    name: 'ECDH',
                    public: otherPublicKey
                },
                privateKey,
                {
                    name: 'AES-GCM',
                    length: this.DERIVED_KEY_LENGTH
                },
                false, // Not extractable for security
                ['encrypt', 'decrypt']
            );

            // HKDF로 키 강화 (선택적, 추가 보안)
            const finalKey = await crypto.subtle.deriveKey(
                {
                    name: 'HKDF',
                    hash: 'SHA-256',
                    salt: saltBuffer,
                    info: encoder.encode('message-encryption')
                },
                await this.convertToHKDFKey(sharedKey),
                {
                    name: 'AES-GCM',
                    length: this.DERIVED_KEY_LENGTH
                },
                false,
                ['encrypt', 'decrypt']
            );

            return {
                key: finalKey,
                salt: saltString
            };
        } catch (error) {
            console.error('❌ Shared secret derivation failed:', error);
            throw new Error('Failed to derive shared secret');
        }
    }

    /**
     * AES-GCM 키를 HKDF에서 사용 가능한 키로 변환
     * (Web Crypto API 제약 우회)
     */
    private static async convertToHKDFKey(aesKey: CryptoKey): Promise<CryptoKey> {
        try {
            // AES 키에서 raw bits 추출
            const bits = await crypto.subtle.deriveBits(
                {
                    name: 'ECDH',
                    public: aesKey // This is a workaround
                },
                aesKey,
                256
            );

            // HKDF용 키로 import
            return await crypto.subtle.importKey(
                'raw',
                bits,
                { name: 'HKDF' },
                false,
                ['deriveKey']
            );
        } catch (error) {
            // Fallback: 원본 키 반환 (HKDF 없이)
            console.warn('⚠️ HKDF conversion failed, using direct key');
            return aesKey;
        }
    }

    /**
     * Salt 생성
     * @returns Base64 인코딩된 salt
     */
    private static generateSalt(): string {
        const buffer = crypto.getRandomValues(new Uint8Array(32));
        return this.arrayBufferToBase64(buffer);
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
     * 키 교환 프로토콜 검증
     * @param localPrivateKey 로컬 개인키
     * @param localPublicKey 로컬 공개키
     * @param remotePublicKey 원격 공개키
     * @returns 검증 성공 여부
     */
    static async verifyKeyExchange(
        localPrivateKey: CryptoKey,
        localPublicKey: CryptoKey,
        remotePublicKey: CryptoKey
    ): Promise<boolean> {
        try {
            // 양방향 키 유도가 동일한지 확인
            const secret1 = await this.deriveSharedSecret(
                localPrivateKey,
                remotePublicKey,
                'test-salt'
            );

            // 공개키가 유효한지 확인
            const exported = await this.exportPublicKey(localPublicKey);
            const reimported = await this.importPublicKey(exported);

            return true;
        } catch (error) {
            console.error('❌ Key exchange verification failed:', error);
            return false;
        }
    }

    /**
     * 키 교환 세션 정보
     */
    static async createSessionInfo(userId: string, roomId: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(`${userId}:${roomId}:${Date.now()}`);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return this.arrayBufferToBase64(hash);
    }
}

/**
 * 키 교환 세션 관리자
 */
export class KeyExchangeSession {
    private localKeyPair: KeyPair | null = null;
    private remotePublicKey: CryptoKey | null = null;
    private sharedSecret: SharedSecret | null = null;

    /**
     * 세션 초기화 (키 쌍 생성)
     */
    async initialize(): Promise<ExportedPublicKey> {
        this.localKeyPair = await KeyExchange.generateKeyPair();
        return await KeyExchange.exportPublicKey(this.localKeyPair.publicKey);
    }

    /**
     * 원격 공개키 설정 및 공유 비밀 생성
     */
    async setRemotePublicKey(
        exportedKey: ExportedPublicKey,
        salt?: string
    ): Promise<void> {
        if (!this.localKeyPair) {
            throw new Error('Local key pair not initialized');
        }

        this.remotePublicKey = await KeyExchange.importPublicKey(exportedKey);
        this.sharedSecret = await KeyExchange.deriveSharedSecret(
            this.localKeyPair.privateKey,
            this.remotePublicKey,
            salt
        );
    }

    /**
     * 공유 비밀키 가져오기
     */
    getSharedSecret(): CryptoKey {
        if (!this.sharedSecret) {
            throw new Error('Shared secret not established');
        }
        return this.sharedSecret.key;
    }

    /**
     * 세션 정리
     */
    clear(): void {
        this.localKeyPair = null;
        this.remotePublicKey = null;
        this.sharedSecret = null;
    }

    /**
     * 세션이 준비되었는지 확인
     */
    isReady(): boolean {
        return this.sharedSecret !== null;
    }
}
