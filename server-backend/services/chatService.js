/**
 * Chat Service
 * 1:1 DM 및 그룹 채팅 비즈니스 로직
 * 
 * Phase 3 - Real-time Chat System
 * @author Phase 3 Development Team
 * @date 2025-11-12
 */

const mysql = require('mysql2/promise');

class ChatService {
    constructor(db) {
        this.db = db;
    }

    // ===================================
    // DM (Direct Message) 기능
    // ===================================

    /**
     * DM 대화방 생성 또는 조회
     */
    async getOrCreateConversation(user1Id, user2Id) {
        try {
            // 기존 대화방 조회
            const [conversations] = await this.db.query(`
                SELECT * FROM dm_conversations
                WHERE (participant1_id = ? AND participant2_id = ?)
                   OR (participant1_id = ? AND participant2_id = ?)
                LIMIT 1
            `, [user1Id, user2Id, user2Id, user1Id]);

            if (conversations.length > 0) {
                return { success: true, conversation: conversations[0], isNew: false };
            }

            // 새 대화방 생성
            const [result] = await this.db.query(`
                INSERT INTO dm_conversations (participant1_id, participant2_id)
                VALUES (?, ?)
            `, [user1Id, user2Id]);

            const [newConversation] = await this.db.query(`
                SELECT * FROM dm_conversations WHERE id = ?
            `, [result.insertId]);

            return {
                success: true,
                conversation: newConversation[0],
                isNew: true
            };
        } catch (error) {
            console.error('Error in getOrCreateConversation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * DM 메시지 전송
     */
    async sendDirectMessage(conversationId, senderId, receiverId, messageData) {
        try {
            const { content, messageType = 'text', attachment = null, replyToId = null } = messageData;

            const [result] = await this.db.query(`
                INSERT INTO direct_messages (
                    conversation_id, sender_id, receiver_id, content, message_type,
                    attachment_url, attachment_name, attachment_size, attachment_type,
                    reply_to_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                conversationId, senderId, receiverId, content, messageType,
                attachment?.url || null,
                attachment?.name || null,
                attachment?.size || null,
                attachment?.type || null,
                replyToId
            ]);

            // 대화방 업데이트
            await this.db.query(`
                UPDATE dm_conversations
                SET last_message_id = ?, last_message_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [result.insertId, conversationId]);

            // 메시지 조회
            const [messages] = await this.db.query(`
                SELECT dm.*,
                    sender.username as sender_username,
                    sender.avatar as sender_avatar
                FROM direct_messages dm
                JOIN users sender ON dm.sender_id = sender.id
                WHERE dm.id = ?
            `, [result.insertId]);

            return { success: true, message: messages[0] };
        } catch (error) {
            console.error('Error in sendDirectMessage:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * DM 대화방 목록 조회
     */
    async getUserConversations(userId, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;

            const [conversations] = await this.db.query(`
                SELECT 
                    conv.*,
                    CASE 
                        WHEN conv.participant1_id = ? THEN conv.participant2_id
                        ELSE conv.participant1_id
                    END as other_user_id,
                    CASE 
                        WHEN conv.participant1_id = ? THEN u2.username
                        ELSE u1.username
                    END as other_username,
                    CASE 
                        WHEN conv.participant1_id = ? THEN u2.avatar
                        ELSE u1.avatar
                    END as other_avatar,
                    dm.content as last_message_content,
                    dm.message_type as last_message_type,
                    (SELECT COUNT(*) 
                     FROM direct_messages 
                     WHERE conversation_id = conv.id 
                       AND receiver_id = ? 
                       AND is_read = FALSE
                       AND is_deleted = FALSE) as unread_count
                FROM dm_conversations conv
                LEFT JOIN users u1 ON conv.participant1_id = u1.id
                LEFT JOIN users u2 ON conv.participant2_id = u2.id
                LEFT JOIN direct_messages dm ON conv.last_message_id = dm.id
                WHERE conv.participant1_id = ? OR conv.participant2_id = ?
                ORDER BY conv.last_message_at DESC
                LIMIT ? OFFSET ?
            `, [userId, userId, userId, userId, userId, userId, limit, offset]);

            // 총 개수 조회
            const [countResult] = await this.db.query(`
                SELECT COUNT(*) as total
                FROM dm_conversations
                WHERE participant1_id = ? OR participant2_id = ?
            `, [userId, userId]);

            return {
                success: true,
                conversations,
                pagination: {
                    total: countResult[0].total,
                    page,
                    limit,
                    pages: Math.ceil(countResult[0].total / limit)
                }
            };
        } catch (error) {
            console.error('Error in getUserConversations:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * DM 메시지 목록 조회
     */
    async getConversationMessages(conversationId, userId, page = 1, limit = 50) {
        try {
            const offset = (page - 1) * limit;

            const [messages] = await this.db.query(`
                SELECT 
                    dm.*,
                    sender.username as sender_username,
                    sender.avatar as sender_avatar,
                    reply_msg.content as reply_to_content,
                    reply_msg.sender_id as reply_to_sender_id,
                    reply_sender.username as reply_to_sender_username
                FROM direct_messages dm
                JOIN users sender ON dm.sender_id = sender.id
                LEFT JOIN direct_messages reply_msg ON dm.reply_to_id = reply_msg.id
                LEFT JOIN users reply_sender ON reply_msg.sender_id = reply_sender.id
                WHERE dm.conversation_id = ?
                  AND dm.is_deleted = FALSE
                ORDER BY dm.created_at DESC
                LIMIT ? OFFSET ?
            `, [conversationId, limit, offset]);

            // 읽음 처리 (자신이 받은 메시지만)
            await this.db.query(`
                UPDATE direct_messages
                SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
                WHERE conversation_id = ?
                  AND receiver_id = ?
                  AND is_read = FALSE
            `, [conversationId, userId]);

            return { success: true, messages: messages.reverse() };
        } catch (error) {
            console.error('Error in getConversationMessages:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 메시지 읽음 처리
     */
    async markMessageAsRead(messageId, userId) {
        try {
            await this.db.query(`
                UPDATE direct_messages
                SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
                WHERE id = ? AND receiver_id = ?
            `, [messageId, userId]);

            return { success: true };
        } catch (error) {
            console.error('Error in markMessageAsRead:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 메시지 삭제
     */
    async deleteMessage(messageId, userId) {
        try {
            await this.db.query(`
                UPDATE direct_messages
                SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ?
                WHERE id = ? AND sender_id = ?
            `, [userId, messageId, userId]);

            return { success: true };
        } catch (error) {
            console.error('Error in deleteMessage:', error);
            return { success: false, error: error.message };
        }
    }

    // ===================================
    // 그룹 채팅 기능
    // ===================================

    /**
     * 그룹 채팅방 생성
     */
    async createGroupChat(ownerId, groupData) {
        try {
            const { name, description, isPrivate = false, maxMembers = 100 } = groupData;

            // 초대 코드 생성
            const inviteCode = this.generateInviteCode();

            const [result] = await this.db.query(`
                INSERT INTO group_chats (name, description, owner_id, is_private, max_members, invite_code)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [name, description, ownerId, isPrivate, maxMembers, inviteCode]);

            const groupId = result.insertId;

            // 소유자를 관리자로 추가
            await this.db.query(`
                INSERT INTO group_members (group_id, user_id, role)
                VALUES (?, ?, 'admin')
            `, [groupId, ownerId]);

            const [groups] = await this.db.query(`
                SELECT * FROM group_chats WHERE id = ?
            `, [groupId]);

            return { success: true, group: groups[0] };
        } catch (error) {
            console.error('Error in createGroupChat:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 그룹 멤버 추가
     */
    async addGroupMember(groupId, userId, addedBy, role = 'member') {
        try {
            // 권한 확인 (관리자만 추가 가능)
            const [adderRole] = await this.db.query(`
                SELECT role FROM group_members
                WHERE group_id = ? AND user_id = ?
            `, [groupId, addedBy]);

            if (!adderRole.length || (adderRole[0].role !== 'admin' && adderRole[0].role !== 'moderator')) {
                return { success: false, error: '권한이 없습니다' };
            }

            // 멤버 추가
            await this.db.query(`
                INSERT INTO group_members (group_id, user_id, role)
                VALUES (?, ?, ?)
            `, [groupId, userId, role]);

            return { success: true };
        } catch (error) {
            console.error('Error in addGroupMember:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 그룹 메시지 전송
     */
    async sendGroupMessage(groupId, userId, messageData) {
        try {
            // 멤버십 확인
            const [membership] = await this.db.query(`
                SELECT * FROM group_members
                WHERE group_id = ? AND user_id = ? AND is_banned = FALSE
            `, [groupId, userId]);

            if (!membership.length) {
                return { success: false, error: '그룹 멤버가 아닙니다' };
            }

            const { content, messageType = 'text', file = null, replyTo = null } = messageData;

            const [result] = await this.db.query(`
                INSERT INTO group_messages (
                    group_id, user_id, content, message_type,
                    file_url, file_name, file_size, reply_to
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                groupId, userId, content, messageType,
                file?.url || null,
                file?.name || null,
                file?.size || null,
                replyTo
            ]);

            // 메시지 조회
            const [messages] = await this.db.query(`
                SELECT 
                    gm.*,
                    u.username as sender_username,
                    u.avatar as sender_avatar,
                    gm_member.nickname as sender_nickname
                FROM group_messages gm
                JOIN users u ON gm.user_id = u.id
                LEFT JOIN group_members gm_member ON gm.group_id = gm_member.group_id AND gm.user_id = gm_member.user_id
                WHERE gm.id = ?
            `, [result.insertId]);

            return { success: true, message: messages[0] };
        } catch (error) {
            console.error('Error in sendGroupMessage:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 그룹 메시지 목록 조회
     */
    async getGroupMessages(groupId, userId, page = 1, limit = 50) {
        try {
            // 멤버십 확인
            const [membership] = await this.db.query(`
                SELECT * FROM group_members
                WHERE group_id = ? AND user_id = ?
            `, [groupId, userId]);

            if (!membership.length) {
                return { success: false, error: '그룹 멤버가 아닙니다' };
            }

            const offset = (page - 1) * limit;

            const [messages] = await this.db.query(`
                SELECT 
                    gm.*,
                    u.username as sender_username,
                    u.avatar as sender_avatar,
                    gm_member.nickname as sender_nickname,
                    reply_msg.content as reply_to_content,
                    reply_sender.username as reply_to_sender_username
                FROM group_messages gm
                JOIN users u ON gm.user_id = u.id
                LEFT JOIN group_members gm_member ON gm.group_id = gm_member.group_id AND gm.user_id = gm_member.user_id
                LEFT JOIN group_messages reply_msg ON gm.reply_to = reply_msg.id
                LEFT JOIN users reply_sender ON reply_msg.user_id = reply_sender.id
                WHERE gm.group_id = ? AND gm.deleted_at IS NULL
                ORDER BY gm.created_at DESC
                LIMIT ? OFFSET ?
            `, [groupId, limit, offset]);

            // 읽음 시간 업데이트
            await this.db.query(`
                UPDATE group_members
                SET last_read_at = CURRENT_TIMESTAMP
                WHERE group_id = ? AND user_id = ?
            `, [groupId, userId]);

            return { success: true, messages: messages.reverse() };
        } catch (error) {
            console.error('Error in getGroupMessages:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 사용자의 그룹 채팅방 목록 조회
     */
    async getUserGroups(userId, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;

            const [groups] = await this.db.query(`
                SELECT 
                    gc.*,
                    gm.role as my_role,
                    gm.nickname as my_nickname,
                    gm.last_read_at,
                    (SELECT COUNT(*) FROM group_members WHERE group_id = gc.id) as member_count,
                    (SELECT COUNT(*) 
                     FROM group_messages 
                     WHERE group_id = gc.id 
                       AND created_at > COALESCE(gm.last_read_at, '1970-01-01')
                       AND deleted_at IS NULL) as unread_count,
                    last_msg.content as last_message_content,
                    last_msg.created_at as last_message_at,
                    last_sender.username as last_sender_username
                FROM group_members gm
                JOIN group_chats gc ON gm.group_id = gc.id
                LEFT JOIN group_messages last_msg ON gc.id = last_msg.group_id
                LEFT JOIN users last_sender ON last_msg.user_id = last_sender.id
                WHERE gm.user_id = ? AND gc.deleted_at IS NULL
                ORDER BY last_msg.created_at DESC
                LIMIT ? OFFSET ?
            `, [userId, limit, offset]);

            return { success: true, groups };
        } catch (error) {
            console.error('Error in getUserGroups:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 초대 코드 생성
     */
    generateInviteCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 10; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return code;
    }
}

module.exports = ChatService;
