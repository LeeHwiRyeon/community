/**
 * DM (Direct Message) Routes
 * REST API 엔드포인트
 */

import express from 'express';
import { authenticateToken } from '../auth/jwt.js';
import * as dmService from '../services/dm-service.js';

const router = express.Router();

// 모든 DM 엔드포인트는 인증 필요
router.use(authenticateToken);

/**
 * GET /api/dm/conversations
 * 대화 목록 조회
 */
router.get('/conversations', async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, search = '' } = req.query;

        const result = await dmService.getConversations(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            search
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('대화 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '대화 목록 조회 실패'
        });
    }
});

/**
 * GET /api/dm/messages/:conversationId
 * 특정 대화의 메시지 목록 조회
 */
router.get('/messages/:conversationId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const { page = 1, limit = 50, before = null } = req.query;

        const result = await dmService.getMessages(
            parseInt(conversationId),
            userId,
            {
                page: parseInt(page),
                limit: parseInt(limit),
                before: before ? parseInt(before) : null
            }
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('메시지 목록 조회 실패:', error);

        if (error.message === 'Conversation not found or access denied') {
            return res.status(403).json({
                success: false,
                error: '대화방 접근 권한이 없습니다'
            });
        }

        res.status(500).json({
            success: false,
            error: '메시지 목록 조회 실패'
        });
    }
});

/**
 * POST /api/dm/send
 * 메시지 전송
 */
router.post('/send', async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiver_id, content, message_type = 'text', reply_to_id = null, attachment = null } = req.body;

        // 유효성 검증
        if (!receiver_id) {
            return res.status(400).json({
                success: false,
                error: '수신자 ID가 필요합니다'
            });
        }

        if (!content && message_type === 'text') {
            return res.status(400).json({
                success: false,
                error: '메시지 내용이 필요합니다'
            });
        }

        // 자기 자신에게 메시지 전송 방지
        if (senderId === parseInt(receiver_id)) {
            return res.status(400).json({
                success: false,
                error: '자기 자신에게 메시지를 보낼 수 없습니다'
            });
        }

        const result = await dmService.sendMessage(senderId, parseInt(receiver_id), {
            content,
            message_type,
            reply_to_id,
            attachment
        });

        // WebSocket으로 실시간 전송 (io는 app.js에서 설정됨)
        if (req.app.get('io')) {
            const io = req.app.get('io');
            io.to(`user_${receiver_id}`).emit('dm:new_message', {
                message: result.message,
                conversation_id: result.conversation_id,
                sender: {
                    id: senderId,
                    username: req.user.display_name
                }
            });
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('메시지 전송 실패:', error);
        res.status(500).json({
            success: false,
            error: '메시지 전송 실패'
        });
    }
});

/**
 * PUT /api/dm/read/:messageId
 * 특정 메시지 읽음 처리
 */
router.put('/read/:messageId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;

        const result = await dmService.markAsRead(parseInt(messageId), userId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('메시지 읽음 처리 실패:', error);

        if (error.message === 'Message not found or already read') {
            return res.status(404).json({
                success: false,
                error: '메시지를 찾을 수 없거나 이미 읽은 메시지입니다'
            });
        }

        res.status(500).json({
            success: false,
            error: '메시지 읽음 처리 실패'
        });
    }
});

/**
 * PUT /api/dm/read-all/:conversationId
 * 대화의 모든 메시지 읽음 처리
 */
router.put('/read-all/:conversationId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;

        const result = await dmService.markAllAsRead(parseInt(conversationId), userId);

        // WebSocket으로 읽음 상태 전송
        if (req.app.get('io')) {
            const io = req.app.get('io');
            io.to(`conversation_${conversationId}`).emit('dm:messages_read', {
                conversation_id: conversationId,
                user_id: userId,
                marked_count: result.marked_count
            });
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('대화 읽음 처리 실패:', error);
        res.status(500).json({
            success: false,
            error: '대화 읽음 처리 실패'
        });
    }
});

/**
 * DELETE /api/dm/message/:messageId
 * 메시지 삭제
 */
router.delete('/message/:messageId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;

        const result = await dmService.deleteMessage(parseInt(messageId), userId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('메시지 삭제 실패:', error);

        if (error.message === 'Message not found or unauthorized') {
            return res.status(403).json({
                success: false,
                error: '메시지를 찾을 수 없거나 삭제 권한이 없습니다'
            });
        }

        res.status(500).json({
            success: false,
            error: '메시지 삭제 실패'
        });
    }
});

/**
 * GET /api/dm/search
 * 메시지 검색
 */
router.get('/search', async (req, res) => {
    try {
        const userId = req.user.id;
        const { q, page = 1, limit = 20 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: '검색어가 필요합니다'
            });
        }

        const result = await dmService.searchMessages(userId, q, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('메시지 검색 실패:', error);
        res.status(500).json({
            success: false,
            error: '메시지 검색 실패'
        });
    }
});

/**
 * GET /api/dm/unread-count
 * 읽지 않은 메시지 수 조회
 */
router.get('/unread-count', async (req, res) => {
    try {
        const userId = req.user.id;
        const unreadCount = await dmService.getUnreadCount(userId);

        res.json({
            success: true,
            data: { unread_count: unreadCount }
        });
    } catch (error) {
        console.error('읽지 않은 메시지 수 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '읽지 않은 메시지 수 조회 실패'
        });
    }
});

/**
 * GET /api/dm/conversation/:userId
 * 특정 사용자와의 대화방 ID 조회 또는 생성
 */
router.get('/conversation/:userId', async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { userId } = req.params;
        const targetUserId = parseInt(userId);

        if (currentUserId === targetUserId) {
            return res.status(400).json({
                success: false,
                error: '자기 자신과의 대화방을 생성할 수 없습니다'
            });
        }

        const conversation = await dmService.findOrCreateConversation(currentUserId, targetUserId);

        res.json({
            success: true,
            data: conversation
        });
    } catch (error) {
        console.error('대화방 조회/생성 실패:', error);
        res.status(500).json({
            success: false,
            error: '대화방 조회/생성 실패'
        });
    }
});

export default router;
