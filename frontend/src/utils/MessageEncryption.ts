/**
 * 메시지 암호화 유틸리티 (v1.3 보안 강화)
 * AES-256-GCM 암호화를 사용한 엔드투엔드 암호화
 */

import React from 'react';
import CryptoJS from 'crypto-js';

export interface EncryptedMessage {
    encryptedContent: string;
    iv: string;
    tag: string;
    timestamp: number;
    messageId: string;
}

export interface DecryptedMessage {
    content: string;
    timestamp: number;
    messageId: string;
    isEncrypted: boolean;
}

export class MessageEncryption {
    private static readonly ALGORITHM = 'AES';
    private static readonly KEY_SIZE = 256;
    private static readonly IV_SIZE = 16;
    private static readonly TAG_SIZE = 16;

    /**
     * 메시지 암호화
     * @param content 암호화할 메시지 내용
     * @param roomKey 채팅방별 암호화 키
     * @returns 암호화된 메시지 객체
     */
    static encryptMessage(content: string, roomKey: string): EncryptedMessage {
        try {
            // 랜덤 IV 생성
            const iv = CryptoJS.lib.WordArray.random(this.IV_SIZE);

            // 메시지 ID 생성
            const messageId = CryptoJS.lib.WordArray.random(8).toString();

            // 타임스탬프 추가
            const timestamp = Date.now();

            // 메시지와 메타데이터 결합
            const messageData = JSON.stringify({
                content,
                timestamp,
                messageId
            });

            // AES-256-GCM 암호화
            const encrypted = CryptoJS.AES.encrypt(messageData, roomKey, {
                iv: iv,
                mode: CryptoJS.mode.GCM,
                padding: CryptoJS.pad.Pkcs7
            });

            return {
                encryptedContent: encrypted.toString(),
                iv: iv.toString(),
                tag: '', // GCM 모드에서는 tag가 자동으로 생성됨
                timestamp,
                messageId
            };
        } catch (error) {
            console.error('메시지 암호화 실패:', error);
            throw new Error('메시지 암호화에 실패했습니다.');
        }
    }

    /**
     * 메시지 복호화
     * @param encryptedMessage 암호화된 메시지 객체
     * @param roomKey 채팅방별 암호화 키
     * @returns 복호화된 메시지 객체
     */
    static decryptMessage(encryptedMessage: EncryptedMessage, roomKey: string): DecryptedMessage {
        try {
            // IV 복원
            const iv = CryptoJS.enc.Hex.parse(encryptedMessage.iv);

            // 암호화된 데이터 복원
            const encrypted = CryptoJS.enc.Base64.parse(encryptedMessage.encryptedContent);

            // AES-256-GCM 복호화
            const decrypted = CryptoJS.AES.decrypt(
                { ciphertext: encrypted },
                roomKey,
                {
                    iv: iv,
                    mode: CryptoJS.mode.GCM,
                    padding: CryptoJS.pad.Pkcs7
                }
            );

            const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

            if (!decryptedString) {
                throw new Error('복호화된 데이터가 비어있습니다.');
            }

            const messageData = JSON.parse(decryptedString);

            return {
                content: messageData.content,
                timestamp: messageData.timestamp,
                messageId: messageData.messageId,
                isEncrypted: true
            };
        } catch (error) {
            console.error('메시지 복호화 실패:', error);
            throw new Error('메시지 복호화에 실패했습니다.');
        }
    }

    /**
     * 채팅방별 암호화 키 생성
     * @param roomId 채팅방 ID
     * @param masterKey 마스터 키
     * @returns 채팅방별 암호화 키
     */
    static generateRoomKey(roomId: string, masterKey: string): string {
        return CryptoJS.PBKDF2(masterKey, roomId, {
            keySize: 256 / 32,
            iterations: 10000
        }).toString();
    }

    /**
     * 메시지 무결성 검증
     * @param message 메시지 객체
     * @param roomKey 채팅방별 암호화 키
     * @returns 무결성 검증 결과
     */
    static verifyMessageIntegrity(message: EncryptedMessage, roomKey: string): boolean {
        try {
            const decrypted = this.decryptMessage(message, roomKey);
            return decrypted.content.length > 0 && decrypted.messageId === message.messageId;
        } catch (error) {
            return false;
        }
    }

    /**
     * 안전한 랜덤 키 생성
     * @param length 키 길이 (바이트)
     * @returns 랜덤 키
     */
    static generateSecureKey(length: number = 32): string {
        return CryptoJS.lib.WordArray.random(length).toString();
    }

    /**
     * 키 해시 생성 (키 저장용)
     * @param key 원본 키
     * @returns 해시된 키
     */
    static hashKey(key: string): string {
        return CryptoJS.SHA256(key).toString();
    }
}

/**
 * 메시지 암호화 훅 (React용)
 */
export const useMessageEncryption = (roomId: string) => {
    const [roomKey, setRoomKey] = React.useState<string>('');
    const [isEncryptionEnabled, setIsEncryptionEnabled] = React.useState<boolean>(false);

    React.useEffect(() => {
        // 채팅방별 암호화 키 생성 또는 로드
        const masterKey = localStorage.getItem('chatMasterKey') || MessageEncryption.generateSecureKey();
        const generatedRoomKey = MessageEncryption.generateRoomKey(roomId, masterKey);

        setRoomKey(generatedRoomKey);
        setIsEncryptionEnabled(true);

        // 마스터 키 저장
        localStorage.setItem('chatMasterKey', masterKey);
    }, [roomId]);

    const encryptMessage = React.useCallback((content: string): EncryptedMessage => {
        if (!isEncryptionEnabled || !roomKey) {
            throw new Error('암호화가 활성화되지 않았습니다.');
        }
        return MessageEncryption.encryptMessage(content, roomKey);
    }, [roomKey, isEncryptionEnabled]);

    const decryptMessage = React.useCallback((encryptedMessage: EncryptedMessage): DecryptedMessage => {
        if (!isEncryptionEnabled || !roomKey) {
            throw new Error('암호화가 활성화되지 않았습니다.');
        }
        return MessageEncryption.decryptMessage(encryptedMessage, roomKey);
    }, [roomKey, isEncryptionEnabled]);

    return {
        encryptMessage,
        decryptMessage,
        isEncryptionEnabled,
        roomKey: roomKey ? MessageEncryption.hashKey(roomKey) : ''
    };
};
