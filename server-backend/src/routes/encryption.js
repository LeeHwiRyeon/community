/**
 * 암호화 API 라우터
 * 
 * @description
 * 엔드-투-엔드 암호화 메시지 관련 API 엔드포인트
 * - 공개키 교환
 * - 암호화된 메시지 전송/수신
 * - 암호화 메타데이터 관리
 */

import express from 'express';
import { query } from '../db.js';
import logger from '../logger.js';
import { authenticateToken } from '../auth/jwt.js';

const router = express.Router();

/**
 * 공개키 등록/업데이트
 * POST /api/encryption/keys
 * 
 * @body {string} publicKey - Base64로 인코딩된 ECDH 공개키
 * @body {string} [keyAlgorithm='ECDH-P256'] - 키 알고리즘
 * @body {string} [keyVersion='v1'] - 키 버전
 */
router.post('/keys', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { publicKey, keyAlgorithm = 'ECDH-P256', keyVersion = 'v1' } = req.body;

    try {
        // 입력 검증
        if (!publicKey || typeof publicKey !== 'string') {
            return res.status(400).json({
                error: 'INVALID_PUBLIC_KEY',
                message: '유효한 공개키를 제공해야 합니다'
            });
        }

        // 기존 키 비활성화
        await query(
            'UPDATE user_encryption_keys SET is_active = 0 WHERE user_id = ?',
            [userId]
        );

        // 새 키 등록
        const result = await query(
            `INSERT INTO user_encryption_keys 
            (user_id, public_key, key_algorithm, key_version, is_active)
            VALUES (?, ?, ?, ?, 1)`,
            [userId, publicKey, keyAlgorithm, keyVersion]
        );

        // 감사 로그
        await query(
            `INSERT INTO encryption_audit_log 
            (user_id, action, resource_type, status, algorithm)
            VALUES (?, 'key_register', 'public_key', 'success', ?)`,
            [userId, keyAlgorithm]
        );

        logger.info(`✅ [Encryption] User ${userId} registered new public key (${keyAlgorithm})`);

        res.json({
            success: true,
            message: '공개키가 등록되었습니다',
            data: {
                keyId: result.insertId,
                keyVersion,
                keyAlgorithm
            }
        });

    } catch (error) {
        logger.error('❌ [Encryption] Failed to register public key:', error);

        // 감사 로그 (실패)
        await query(
            `INSERT INTO encryption_audit_log 
            (user_id, action, resource_type, status, error_message)
            VALUES (?, 'key_register', 'public_key', 'failure', ?)`,
            [userId, error.message]
        );

        res.status(500).json({
            error: 'KEY_REGISTRATION_FAILED',
            message: '공개키 등록에 실패했습니다'
        });
    }
});

/**
 * 공개키 조회
 * GET /api/encryption/keys/:userId
 * 
 * @param {number} userId - 조회할 사용자 ID
 */
router.get('/keys/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const requestUserId = req.user.id;

    try {
        // 공개키 조회
        const [keys] = await query(
            `SELECT id, public_key, key_algorithm, key_version, created_at
            FROM user_encryption_keys
            WHERE user_id = ? AND is_active = 1
            ORDER BY created_at DESC
            LIMIT 1`,
            [userId]
        );

        if (!keys) {
            return res.status(404).json({
                error: 'PUBLIC_KEY_NOT_FOUND',
                message: '사용자의 공개키를 찾을 수 없습니다'
            });
        }

        // 감사 로그
        await query(
            `INSERT INTO encryption_audit_log 
            (user_id, action, resource_type, resource_id, status)
            VALUES (?, 'key_fetch', 'public_key', ?, 'success')`,
            [requestUserId, userId]
        );

        res.json({
            success: true,
            data: {
                userId: parseInt(userId),
                publicKey: keys.public_key,
                keyAlgorithm: keys.key_algorithm,
                keyVersion: keys.key_version,
                createdAt: keys.created_at
            }
        });

    } catch (error) {
        logger.error('❌ [Encryption] Failed to fetch public key:', error);

        res.status(500).json({
            error: 'KEY_FETCH_FAILED',
            message: '공개키 조회에 실패했습니다'
        });
    }
});

/**
 * 여러 사용자의 공개키 일괄 조회
 * POST /api/encryption/keys/batch
 * 
 * @body {number[]} userIds - 조회할 사용자 ID 배열
 */
router.post('/keys/batch', authenticateToken, async (req, res) => {
    const { userIds } = req.body;
    const requestUserId = req.user.id;

    try {
        // 입력 검증
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                error: 'INVALID_USER_IDS',
                message: '유효한 사용자 ID 배열을 제공해야 합니다'
            });
        }

        if (userIds.length > 100) {
            return res.status(400).json({
                error: 'TOO_MANY_USERS',
                message: '최대 100명의 사용자 공개키만 조회할 수 있습니다'
            });
        }

        // 공개키 일괄 조회
        const placeholders = userIds.map(() => '?').join(',');
        const keys = await query(
            `SELECT user_id, public_key, key_algorithm, key_version, created_at
            FROM user_encryption_keys
            WHERE user_id IN (${placeholders}) AND is_active = 1`,
            userIds
        );

        // 결과를 Map으로 변환
        const keysMap = {};
        keys.forEach(key => {
            keysMap[key.user_id] = {
                publicKey: key.public_key,
                keyAlgorithm: key.key_algorithm,
                keyVersion: key.key_version,
                createdAt: key.created_at
            };
        });

        // 감사 로그
        await query(
            `INSERT INTO encryption_audit_log 
            (user_id, action, resource_type, status)
            VALUES (?, 'key_batch_fetch', 'public_key', 'success')`,
            [requestUserId]
        );

        res.json({
            success: true,
            data: {
                keys: keysMap,
                found: keys.length,
                requested: userIds.length
            }
        });

    } catch (error) {
        logger.error('❌ [Encryption] Failed to batch fetch public keys:', error);

        res.status(500).json({
            error: 'BATCH_FETCH_FAILED',
            message: '공개키 일괄 조회에 실패했습니다'
        });
    }
});

/**
 * 암호화된 메시지 저장
 * POST /api/encryption/messages
 * 
 * @body {number} messageId - 원본 메시지 ID
 * @body {string} roomId - 채팅방 ID
 * @body {number} [recipientId] - 수신자 ID (DM의 경우)
 * @body {string} encryptedContent - 암호화된 메시지 (Base64)
 * @body {string} iv - Initialization Vector (Base64)
 * @body {string} authTag - Authentication Tag (Base64)
 * @body {string} senderPublicKey - 발신자 공개키 (Base64)
 */
router.post('/messages', authenticateToken, async (req, res) => {
    const senderId = req.user.id;
    const {
        messageId,
        roomId,
        recipientId,
        encryptedContent,
        iv,
        authTag,
        senderPublicKey
    } = req.body;

    try {
        // 입력 검증
        if (!messageId || !roomId || !encryptedContent || !iv || !authTag || !senderPublicKey) {
            return res.status(400).json({
                error: 'INVALID_ENCRYPTED_MESSAGE',
                message: '필수 암호화 필드가 누락되었습니다'
            });
        }

        // 암호화된 메시지 저장
        const result = await query(
            `INSERT INTO encrypted_messages 
            (message_id, room_id, sender_id, recipient_id, 
             encrypted_content, iv, auth_tag, sender_public_key)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [messageId, roomId, senderId, recipientId,
                encryptedContent, iv, authTag, senderPublicKey]
        );

        // 감사 로그
        await query(
            `INSERT INTO encryption_audit_log 
            (user_id, action, resource_type, resource_id, status, algorithm)
            VALUES (?, 'encrypt', 'message', ?, 'success', 'AES-256-GCM')`,
            [senderId, messageId]
        );

        logger.info(`✅ [Encryption] User ${senderId} sent encrypted message ${messageId}`);

        res.json({
            success: true,
            message: '암호화된 메시지가 저장되었습니다',
            data: {
                id: result.insertId,
                messageId,
                roomId
            }
        });

    } catch (error) {
        logger.error('❌ [Encryption] Failed to save encrypted message:', error);

        // 감사 로그 (실패)
        await query(
            `INSERT INTO encryption_audit_log 
            (user_id, action, resource_type, resource_id, status, error_message)
            VALUES (?, 'encrypt', 'message', ?, 'failure', ?)`,
            [senderId, messageId, error.message]
        );

        res.status(500).json({
            error: 'MESSAGE_ENCRYPTION_FAILED',
            message: '암호화된 메시지 저장에 실패했습니다'
        });
    }
});

/**
 * 암호화된 메시지 조회
 * GET /api/encryption/messages/:messageId
 * 
 * @param {number} messageId - 조회할 메시지 ID
 */
router.get('/messages/:messageId', authenticateToken, async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;

    try {
        // 암호화된 메시지 조회
        const [message] = await query(
            `SELECT id, message_id, room_id, sender_id, recipient_id,
                    encrypted_content, iv, auth_tag, sender_public_key,
                    encryption_version, key_algorithm, encryption_algorithm,
                    created_at
            FROM encrypted_messages
            WHERE message_id = ? AND is_deleted = 0`,
            [messageId]
        );

        if (!message) {
            return res.status(404).json({
                error: 'ENCRYPTED_MESSAGE_NOT_FOUND',
                message: '암호화된 메시지를 찾을 수 없습니다'
            });
        }

        // 권한 확인 (발신자 또는 수신자만 조회 가능)
        if (message.sender_id !== userId && message.recipient_id !== userId) {
            return res.status(403).json({
                error: 'ACCESS_DENIED',
                message: '이 메시지에 접근할 권한이 없습니다'
            });
        }

        // 감사 로그
        await query(
            `INSERT INTO encryption_audit_log 
            (user_id, action, resource_type, resource_id, status)
            VALUES (?, 'decrypt', 'message', ?, 'success')`,
            [userId, messageId]
        );

        res.json({
            success: true,
            data: {
                messageId: message.message_id,
                roomId: message.room_id,
                senderId: message.sender_id,
                recipientId: message.recipient_id,
                encryptedContent: message.encrypted_content,
                iv: message.iv,
                authTag: message.auth_tag,
                senderPublicKey: message.sender_public_key,
                encryptionVersion: message.encryption_version,
                keyAlgorithm: message.key_algorithm,
                encryptionAlgorithm: message.encryption_algorithm,
                createdAt: message.created_at
            }
        });

    } catch (error) {
        logger.error('❌ [Encryption] Failed to fetch encrypted message:', error);

        res.status(500).json({
            error: 'MESSAGE_FETCH_FAILED',
            message: '암호화된 메시지 조회에 실패했습니다'
        });
    }
});

/**
 * 채팅방의 암호화된 메시지 목록 조회
 * GET /api/encryption/messages/room/:roomId
 * 
 * @param {string} roomId - 채팅방 ID
 * @query {number} [limit=50] - 조회할 메시지 수
 * @query {number} [offset=0] - 오프셋
 */
router.get('/messages/room/:roomId', authenticateToken, async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    try {
        // 암호화된 메시지 목록 조회
        const messages = await query(
            `SELECT id, message_id, sender_id, recipient_id,
                    encrypted_content, iv, auth_tag, sender_public_key,
                    encryption_version, created_at
            FROM encrypted_messages
            WHERE room_id = ? AND is_deleted = 0
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`,
            [roomId, limit, offset]
        );

        // 총 메시지 수 조회
        const [countResult] = await query(
            'SELECT COUNT(*) as total FROM encrypted_messages WHERE room_id = ? AND is_deleted = 0',
            [roomId]
        );

        res.json({
            success: true,
            data: {
                messages: messages.map(msg => ({
                    messageId: msg.message_id,
                    senderId: msg.sender_id,
                    recipientId: msg.recipient_id,
                    encryptedContent: msg.encrypted_content,
                    iv: msg.iv,
                    authTag: msg.auth_tag,
                    senderPublicKey: msg.sender_public_key,
                    encryptionVersion: msg.encryption_version,
                    createdAt: msg.created_at
                })),
                pagination: {
                    total: countResult.total,
                    limit,
                    offset,
                    hasMore: offset + limit < countResult.total
                }
            }
        });

    } catch (error) {
        logger.error('❌ [Encryption] Failed to fetch room messages:', error);

        res.status(500).json({
            error: 'ROOM_MESSAGES_FETCH_FAILED',
            message: '채팅방 메시지 조회에 실패했습니다'
        });
    }
});

/**
 * 암호화 통계 조회
 * GET /api/encryption/stats
 */
router.get('/stats', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        // 사용자의 암호화 통계 조회
        const [stats] = await query(
            `SELECT 
                COUNT(*) as total_encrypted,
                COUNT(DISTINCT room_id) as rooms_with_encryption,
                MIN(created_at) as first_encrypted_at,
                MAX(created_at) as last_encrypted_at
            FROM encrypted_messages
            WHERE sender_id = ? AND is_deleted = 0`,
            [userId]
        );

        // 공개키 정보
        const [keyInfo] = await query(
            `SELECT key_algorithm, key_version, created_at
            FROM user_encryption_keys
            WHERE user_id = ? AND is_active = 1
            ORDER BY created_at DESC
            LIMIT 1`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                totalEncrypted: stats.total_encrypted || 0,
                roomsWithEncryption: stats.rooms_with_encryption || 0,
                firstEncryptedAt: stats.first_encrypted_at,
                lastEncryptedAt: stats.last_encrypted_at,
                publicKey: keyInfo ? {
                    algorithm: keyInfo.key_algorithm,
                    version: keyInfo.key_version,
                    registeredAt: keyInfo.created_at
                } : null
            }
        });

    } catch (error) {
        logger.error('❌ [Encryption] Failed to fetch encryption stats:', error);

        res.status(500).json({
            error: 'STATS_FETCH_FAILED',
            message: '암호화 통계 조회에 실패했습니다'
        });
    }
});

export default router;
