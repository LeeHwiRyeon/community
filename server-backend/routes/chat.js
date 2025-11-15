/**
 * Chat Routes
 * 1:1 DM 및 그룹 채팅 REST API
 * 
 * Phase 3 - Real-time Chat System
 * @author Phase 3 Development Team
 * @date 2025-11-12
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

module.exports = (db) => {
    const ChatService = require('../services/chatService');
    const chatService = new ChatService(db);

    // ===================================
    // DM (Direct Message) API
    // ===================================

    /**
     * POST /api/chat/dm/conversations
     * DM 대화방 생성 또는 조회
     */
    router.post('/dm/conversations', authenticateToken, async (req, res) => {
        try {
            const { otherUserId } = req.body;
            const userId = req.user.userId;

            if (!otherUserId) {
                return res.status(400).json({ error: '상대방 ID가 필요합니다' });
            }

            if (otherUserId === userId) {
                return res.status(400).json({ error: '자기 자신과는 대화할 수 없습니다' });
            }

            const result = await chatService.getOrCreateConversation(userId, otherUserId);

            if (!result.success) {
                return res.status(500).json({ error: result.error });
            }

            res.json(result);
        } catch (error) {
            console.error('Error in POST /dm/conversations:', error);
            res.status(500).json({ error: '대화방 생성 중 오류가 발생했습니다' });
        }
    });

    /**
     * GET /api/chat/dm/conversations
     * 내 DM 대화방 목록 조회
     */
    router.get('/dm/conversations', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await chatService.getUserConversations(userId, page, limit);

            if (!result.success) {
                return res.status(500).json({ error: result.error });
            }

            res.json(result);
        } catch (error) {
            console.error('Error in GET /dm/conversations:', error);
            res.status(500).json({ error: '대화방 목록 조회 중 오류가 발생했습니다' });
        }
    });

    /**
     * POST /api/chat/dm/messages
     * DM 메시지 전송
     */
    router.post('/dm/messages', authenticateToken, async (req, res) => {
        try {
            const { conversationId, receiverId, content, messageType, attachment, replyToId } = req.body;
            const senderId = req.user.userId;

            if (!conversationId || !receiverId || !content) {
                return res.status(400).json({ error: '필수 정보가 누락되었습니다' });
            }

            const result = await chatService.sendDirectMessage(
                conversationId,
                senderId,
                receiverId,
                { content, messageType, attachment, replyToId }
            );

            if (!result.success) {
                return res.status(500).json({ error: result.error });
            }

            // WebSocket으로 실시간 전송 (socketServer에서 처리)
            if (req.app.locals.io) {
                req.app.locals.io.to(`user_${receiverId}`).emit('dm:new_message', result.message);
            }

            res.status(201).json(result);
        } catch (error) {
            console.error('Error in POST /dm/messages:', error);
            res.status(500).json({ error: '메시지 전송 중 오류가 발생했습니다' });
        }
    });

    /**
     * GET /api/chat/dm/conversations/:conversationId/messages
     * DM 메시지 목록 조회
     */
    router.get('/dm/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
        try {
            const { conversationId } = req.params;
            const userId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;

            const result = await chatService.getConversationMessages(conversationId, userId, page, limit);

            if (!result.success) {
                return res.status(500).json({ error: result.error });
            }

            res.json(result);
        } catch (error) {
            console.error('Error in GET /dm/conversations/:id/messages:', error);
            res.status(500).json({ error: '메시지 목록 조회 중 오류가 발생했습니다' });
        }
    });

    /**
     * PUT /api/chat/dm/messages/:messageId/read
     * 메시지 읽음 처리
     */
    router.put('/dm/messages/:messageId/read', authenticateToken, async (req, res) => {
        try {
            const { messageId } = req.params;
            const userId = req.user.userId;

            const result = await chatService.markMessageAsRead(messageId, userId);

            if (!result.success) {
                return res.status(500).json({ error: result.error });
            }

            res.json(result);
        } catch (error) {
            console.error('Error in PUT /dm/messages/:id/read:', error);
            res.status(500).json({ error: '읽음 처리 중 오류가 발생했습니다' });
        }
    });

    /**
     * DELETE /api/chat/dm/messages/:messageId
     * 메시지 삭제
     */
    router.delete('/dm/messages/:messageId', authenticateToken, async (req, res) => {
        try {
            const { messageId } = req.params;
            const userId = req.user.userId;

            const result = await chatService.deleteMessage(messageId, userId);

            if (!result.success) {
                return res.status(500).json({ error: result.error });
            }

            res.json(result);
        } catch (error) {
            console.error('Error in DELETE /dm/messages/:id:', error);
            res.status(500).json({ error: '메시지 삭제 중 오류가 발생했습니다' });
        }
    });

    // ===================================
    // 그룹 채팅 API
    // ===================================

    /**
     * POST /api/chat/groups
     * 그룹 채팅방 생성
     */
    router.post('/groups', authenticateToken, async (req, res) => {
        try {
            const ownerId = req.user.userId;
            const { name, description, isPrivate, maxMembers } = req.body;

            if (!name) {
                return res.status(400).json({ error: '그룹 이름이 필요합니다' });
            }

            const result = await chatService.createGroupChat(ownerId, {
                name,
                description,
                isPrivate,
                maxMembers
            });

            if (!result.success) {
                return res.status(500).json({ error: result.error });
            }

            res.status(201).json(result);
        } catch (error) {
            console.error('Error in POST /groups:', error);
            res.status(500).json({ error: '그룹 생성 중 오류가 발생했습니다' });
        }
    });

    /**
     * GET /api/chat/groups
     * 내 그룹 채팅방 목록
     */
    router.get('/groups', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await chatService.getUserGroups(userId, page, limit);

            if (!result.success) {
                return res.status(500).json({ error: result.error });
            }

            res.json(result);
        } catch (error) {
            console.error('Error in GET /groups:', error);
            res.status(500).json({ error: '그룹 목록 조회 중 오류가 발생했습니다' });
        }
    });

    /**
     * POST /api/chat/groups/:groupId/members
     * 그룹 멤버 추가
     */
    router.post('/groups/:groupId/members', authenticateToken, async (req, res) => {
        try {
            const { groupId } = req.params;
            const { userId: targetUserId, role } = req.body;
            const addedBy = req.user.userId;

            if (!targetUserId) {
                return res.status(400).json({ error: '추가할 사용자 ID가 필요합니다' });
            }

            const result = await chatService.addGroupMember(groupId, targetUserId, addedBy, role);

            if (!result.success) {
                return res.status(403).json({ error: result.error });
            }

            res.status(201).json(result);
        } catch (error) {
            console.error('Error in POST /groups/:id/members:', error);
            res.status(500).json({ error: '멤버 추가 중 오류가 발생했습니다' });
        }
    });

    /**
     * POST /api/chat/groups/:groupId/messages
     * 그룹 메시지 전송
     */
    router.post('/groups/:groupId/messages', authenticateToken, async (req, res) => {
        try {
            const { groupId } = req.params;
            const userId = req.user.userId;
            const { content, messageType, file, replyTo } = req.body;

            if (!content) {
                return res.status(400).json({ error: '메시지 내용이 필요합니다' });
            }

            const result = await chatService.sendGroupMessage(groupId, userId, {
                content,
                messageType,
                file,
                replyTo
            });

            if (!result.success) {
                return res.status(403).json({ error: result.error });
            }

            // WebSocket으로 실시간 전송
            if (req.app.locals.io) {
                req.app.locals.io.to(`group_${groupId}`).emit('group:new_message', result.message);
            }

            res.status(201).json(result);
        } catch (error) {
            console.error('Error in POST /groups/:id/messages:', error);
            res.status(500).json({ error: '메시지 전송 중 오류가 발생했습니다' });
        }
    });

    /**
     * GET /api/chat/groups/:groupId/messages
     * 그룹 메시지 목록 조회
     */
    router.get('/groups/:groupId/messages', authenticateToken, async (req, res) => {
        try {
            const { groupId } = req.params;
            const userId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;

            const result = await chatService.getGroupMessages(groupId, userId, page, limit);

            if (!result.success) {
                return res.status(403).json({ error: result.error });
            }

            res.json(result);
        } catch (error) {
            console.error('Error in GET /groups/:id/messages:', error);
            res.status(500).json({ error: '메시지 목록 조회 중 오류가 발생했습니다' });
        }
    });

    return router;
};
