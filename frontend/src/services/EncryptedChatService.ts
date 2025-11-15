/**
 * 암호화 채팅 서비스
 * 
 * MessageEncryptionV2와 KeyExchange를 사용한 엔드투엔드 암호화 채팅
 * 
 * @version 2.0.0
 * @created 2025-11-09
 */

import { MessageEncryptionV2, EncryptedMessage, DecryptedMessage } from '../utils/MessageEncryptionV2';
import { KeyExchange, KeyExchangeSession, ExportedPublicKey } from '../utils/KeyExchange';

export interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: number;
    isEncrypted: boolean;
    version?: number;
}

export interface EncryptedChatMessage extends Omit<ChatMessage, 'content'> {
    encryptedData: EncryptedMessage;
}

export interface KeyExchangeRequest {
    roomId: string;
    userId: string;
    publicKey: ExportedPublicKey;
    timestamp: number;
}

export interface KeyExchangeResponse {
    roomId: string;
    userId: string;
    publicKey: ExportedPublicKey;
    accepted: boolean;
}

/**
 * 암호화 채팅 서비스
 */
export class EncryptedChatService {
    private roomKeys: Map<string, CryptoKey> = new Map(); // roomId -> shared key
    private keyExchangeSessions: Map<string, KeyExchangeSession> = new Map(); // roomId -> session
    private masterKey: string | null = null;

    /**
     * 마스터 키 설정 (사용자 비밀번호 기반)
     * @param password 사용자 비밀번호 또는 PIN
     */
    async setMasterKey(password: string): Promise<void> {
        if (password.length < 8) {
            throw new Error('Master key must be at least 8 characters');
        }
        this.masterKey = password;
    }

    /**
     * 채팅방 암호화 초기화 (PBKDF2 방식)
     * @param roomId 채팅방 ID
     */
    async initializeRoomEncryption(roomId: string): Promise<void> {
        if (!this.masterKey) {
            throw new Error('Master key not set. Call setMasterKey() first.');
        }

        const keyMaterial = await MessageEncryptionV2.generateRoomKey(roomId, this.masterKey);
        this.roomKeys.set(roomId, keyMaterial.key);

        console.log(`✅ Room encryption initialized for room: ${roomId}`);
    }

    /**
     * 채팅방 키 교환 시작 (ECDH 방식)
     * @param roomId 채팅방 ID
     * @returns 공개키 (상대방에게 전송할 것)
     */
    async startKeyExchange(roomId: string): Promise<ExportedPublicKey> {
        const session = new KeyExchangeSession();
        const publicKey = await session.initialize();

        this.keyExchangeSessions.set(roomId, session);

        console.log(`✅ Key exchange started for room: ${roomId}`);
        return publicKey;
    }

    /**
     * 상대방 공개키 수신 및 공유 비밀 생성
     * @param roomId 채팅방 ID
     * @param remotePublicKey 상대방 공개키
     */
    async completeKeyExchange(roomId: string, remotePublicKey: ExportedPublicKey): Promise<void> {
        const session = this.keyExchangeSessions.get(roomId);
        if (!session) {
            throw new Error(`Key exchange session not found for room: ${roomId}`);
        }

        await session.setRemotePublicKey(remotePublicKey, roomId);
        const sharedSecret = session.getSharedSecret();

        this.roomKeys.set(roomId, sharedSecret);

        console.log(`✅ Key exchange completed for room: ${roomId}`);
    }

    /**
     * 메시지 암호화 및 전송
     * @param content 메시지 내용
     * @param roomId 채팅방 ID
     * @param senderId 발신자 ID
     * @param senderName 발신자 이름
     * @returns 암호화된 메시지 객체
     */
    async encryptAndSendMessage(
        content: string,
        roomId: string,
        senderId: string,
        senderName: string
    ): Promise<EncryptedChatMessage> {
        const roomKey = this.roomKeys.get(roomId);
        if (!roomKey) {
            throw new Error(`Room encryption not initialized for room: ${roomId}`);
        }

        const encryptedData = await MessageEncryptionV2.encryptMessage(content, roomKey);

        const message: EncryptedChatMessage = {
            id: encryptedData.messageId,
            roomId,
            senderId,
            senderName,
            timestamp: encryptedData.timestamp,
            isEncrypted: true,
            version: encryptedData.version,
            encryptedData
        };

        return message;
    }

    /**
     * 메시지 수신 및 복호화
     * @param encryptedMessage 암호화된 메시지 객체
     * @returns 복호화된 메시지 객체
     */
    async receiveAndDecryptMessage(encryptedMessage: EncryptedChatMessage): Promise<ChatMessage> {
        const roomKey = this.roomKeys.get(encryptedMessage.roomId);
        if (!roomKey) {
            throw new Error(`Room encryption not initialized for room: ${encryptedMessage.roomId}`);
        }

        const decryptedData = await MessageEncryptionV2.decryptMessage(
            encryptedMessage.encryptedData,
            roomKey
        );

        const message: ChatMessage = {
            id: encryptedMessage.id,
            roomId: encryptedMessage.roomId,
            senderId: encryptedMessage.senderId,
            senderName: encryptedMessage.senderName,
            content: decryptedData.content,
            timestamp: decryptedData.timestamp,
            isEncrypted: true,
            version: encryptedMessage.version
        };

        return message;
    }

    /**
     * 메시지 무결성 검증
     * @param encryptedMessage 암호화된 메시지
     * @returns 무결성 검증 결과
     */
    async verifyMessageIntegrity(encryptedMessage: EncryptedChatMessage): Promise<boolean> {
        const roomKey = this.roomKeys.get(encryptedMessage.roomId);
        if (!roomKey) {
            return false;
        }

        return await MessageEncryptionV2.verifyMessageIntegrity(
            encryptedMessage.encryptedData,
            roomKey
        );
    }

    /**
     * 채팅방 키 삭제 (퇴장 시)
     * @param roomId 채팅방 ID
     */
    clearRoomKey(roomId: string): void {
        this.roomKeys.delete(roomId);
        const session = this.keyExchangeSessions.get(roomId);
        if (session) {
            session.clear();
            this.keyExchangeSessions.delete(roomId);
        }
        console.log(`🗑️ Room key cleared for room: ${roomId}`);
    }

    /**
     * 모든 키 삭제 (로그아웃 시)
     */
    clearAllKeys(): void {
        this.roomKeys.clear();
        this.keyExchangeSessions.forEach(session => session.clear());
        this.keyExchangeSessions.clear();
        this.masterKey = null;
        console.log('🗑️ All encryption keys cleared');
    }

    /**
     * 채팅방 암호화 상태 확인
     * @param roomId 채팅방 ID
     * @returns 암호화 활성화 여부
     */
    isRoomEncrypted(roomId: string): boolean {
        return this.roomKeys.has(roomId);
    }

    /**
     * 키 교환 세션 상태 확인
     * @param roomId 채팅방 ID
     * @returns 키 교환 완료 여부
     */
    isKeyExchangeComplete(roomId: string): boolean {
        const session = this.keyExchangeSessions.get(roomId);
        return session ? session.isReady() : false;
    }

    /**
     * 암호화 통계
     */
    getEncryptionStats(): {
        totalRooms: number;
        encryptedRooms: number;
        activeSessions: number;
    } {
        return {
            totalRooms: this.roomKeys.size + this.keyExchangeSessions.size,
            encryptedRooms: this.roomKeys.size,
            activeSessions: Array.from(this.keyExchangeSessions.values()).filter(s => s.isReady()).length
        };
    }
}

/**
 * 암호화 마이그레이션 도우미
 * 기존 AES-CBC 메시지를 AES-GCM으로 마이그레이션
 */
export class EncryptionMigrationHelper {
    /**
     * v1 메시지를 v2로 변환 가능 여부 확인
     */
    static canMigrate(message: any): boolean {
        return (
            message.encryptedContent &&
            message.iv &&
            (!message.version || message.version === 1)
        );
    }

    /**
     * v1 메시지 감지 및 경고
     */
    static detectLegacyMessage(message: any): boolean {
        return !message.version || message.version === 1;
    }

    /**
     * 마이그레이션 가이드
     */
    static getMigrationGuide(): string {
        return `
메시지 암호화 v2 마이그레이션 가이드:

1. 기존 메시지는 읽기 전용으로 유지됩니다
2. 새 메시지는 자동으로 v2 (AES-GCM)으로 암호화됩니다
3. v1 메시지는 "⚠️ 구버전" 태그가 표시됩니다
4. 보안을 위해 중요한 메시지는 재전송을 권장합니다

기술적 차이:
- v1: CryptoJS + AES-CBC
- v2: Web Crypto API + AES-GCM (인증 암호화)

v2의 장점:
✅ 브라우저 네이티브 API (성능 향상)
✅ 인증 태그로 무결성 자동 검증
✅ 더 안전한 키 유도 (PBKDF2 100,000 iterations)
✅ ECDH 키 교환 지원
        `.trim();
    }
}
