/**
 * DM (Direct Message) Service
 * 1:1 실시간 메시지 시스템
 */

import { query, getPool } from '../db.js';

/**
 * INSERT 쿼리 실행 (insertId 반환용)
 */
async function executeInsert(sql, params) {
    const pool = getPool();
    const [result] = await pool.execute(sql, params);
    return result;
}

/**
 * 대화방 찾기 또는 생성
 */
export async function findOrCreateConversation(user1Id, user2Id) {
    // 정렬하여 일관성 보장
    const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    // 기존 대화방 찾기
    const [conversations] = await query(`
        SELECT * FROM dm_conversations 
        WHERE (participant1_id = ? AND participant2_id = ?)
           OR (participant1_id = ? AND participant2_id = ?)
        LIMIT 1
    `, [smallerId, largerId, largerId, smallerId]);

    if (conversations.length > 0) {
        return conversations[0];
    }

    // 새 대화방 생성
    const result = await executeInsert(`
        INSERT INTO dm_conversations (participant1_id, participant2_id)
        VALUES (?, ?)
    `, [smallerId, largerId]);

    return {
        id: result.insertId,
        participant1_id: smallerId,
        participant2_id: largerId,
        created_at: new Date()
    };
}

/**
 * 대화 목록 조회
 */
export async function getConversations(userId, options = {}) {
    const { page = 1, limit = 20, search = '' } = options;
    const offset = (page - 1) * limit;

    let whereClause = `WHERE (c.participant1_id = ? OR c.participant2_id = ?)`;
    const params = [userId, userId];

    if (search) {
        whereClause += ` AND (u.display_name LIKE ? OR u.email LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    // 전체 개수 조회
    const [countResult] = await query(`
        SELECT COUNT(DISTINCT c.id) as total
        FROM dm_conversations c
        LEFT JOIN users u ON (
            CASE 
                WHEN c.participant1_id = ? THEN c.participant2_id
                ELSE c.participant1_id
            END = u.id
        )
        ${whereClause}
    `, [userId, ...params]);

    const total = countResult[0].total;

    // 대화 목록 조회
    const [conversations] = await query(`
        SELECT 
            c.id,
            c.created_at,
            c.updated_at,
            c.last_message_at,
            
            -- 상대방 정보
            CASE 
                WHEN c.participant1_id = ? THEN c.participant2_id
                ELSE c.participant1_id
            END as participant_id,
            u.display_name as participant_name,
            u.email as participant_email,
            u.status as participant_status,
            
            -- 마지막 메시지
            m.id as last_message_id,
            m.content as last_message_content,
            m.sender_id as last_message_sender_id,
            m.message_type as last_message_type,
            m.created_at as last_message_created_at,
            m.is_read as last_message_is_read,
            
            -- 읽지 않은 메시지 수
            (
                SELECT COUNT(*)
                FROM direct_messages dm
                WHERE dm.conversation_id = c.id
                  AND dm.receiver_id = ?
                  AND dm.is_read = FALSE
                  AND dm.is_deleted = FALSE
            ) as unread_count
            
        FROM dm_conversations c
        LEFT JOIN direct_messages m ON c.last_message_id = m.id
        LEFT JOIN users u ON (
            CASE 
                WHEN c.participant1_id = ? THEN c.participant2_id
                ELSE c.participant1_id
            END = u.id
        )
        ${whereClause}
        ORDER BY c.last_message_at DESC
        LIMIT ? OFFSET ?
    `, [userId, userId, userId, ...params, limit, offset]);

    return {
        conversations: conversations.map(conv => ({
            id: conv.id,
            participant: {
                id: conv.participant_id,
                username: conv.participant_name,
                email: conv.participant_email,
                is_online: conv.participant_status === 'online'
            },
            last_message: conv.last_message_id ? {
                id: conv.last_message_id,
                content: conv.last_message_content,
                sender_id: conv.last_message_sender_id,
                message_type: conv.last_message_type,
                created_at: conv.last_message_created_at,
                is_read: conv.last_message_is_read
            } : null,
            unread_count: conv.unread_count,
            created_at: conv.created_at,
            updated_at: conv.updated_at
        })),
        pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit)
        }
    };
}

/**
 * 메시지 목록 조회
 */
export async function getMessages(conversationId, userId, options = {}) {
    const { page = 1, limit = 50, before = null } = options;
    const offset = (page - 1) * limit;

    // 대화방 접근 권한 확인
    const [conversations] = await query(`
        SELECT * FROM dm_conversations
        WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)
    `, [conversationId, userId, userId]);

    if (conversations.length === 0) {
        throw new Error('Conversation not found or access denied');
    }

    const conversation = conversations[0];
    const participantId = conversation.participant1_id === userId
        ? conversation.participant2_id
        : conversation.participant1_id;

    // 메시지 조회
    let whereClause = 'WHERE m.conversation_id = ? AND m.is_deleted = FALSE';
    const params = [conversationId];

    if (before) {
        whereClause += ' AND m.id < ?';
        params.push(before);
    }

    const [messages] = await query(`
        SELECT 
            m.*,
            u.display_name as sender_name,
            u.email as sender_email
        FROM direct_messages m
        LEFT JOIN users u ON m.sender_id = u.id
        ${whereClause}
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // 전체 메시지 수
    const [countResult] = await query(`
        SELECT COUNT(*) as total
        FROM direct_messages
        WHERE conversation_id = ? AND is_deleted = FALSE
    `, [conversationId]);

    const total = countResult[0].total;

    // 상대방 정보 조회
    const [participants] = await query(`
        SELECT id, display_name, email, status
        FROM users
        WHERE id = ?
    `, [participantId]);

    return {
        conversation_id: conversationId,
        participant: participants[0] ? {
            id: participants[0].id,
            username: participants[0].display_name,
            email: participants[0].email,
            is_online: participants[0].status === 'online'
        } : null,
        messages: messages.reverse().map(msg => ({
            id: msg.id,
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            content: msg.content,
            message_type: msg.message_type,
            attachment_url: msg.attachment_url,
            attachment_name: msg.attachment_name,
            attachment_size: msg.attachment_size,
            attachment_type: msg.attachment_type,
            is_read: msg.is_read,
            read_at: msg.read_at,
            reply_to_id: msg.reply_to_id,
            created_at: msg.created_at,
            updated_at: msg.updated_at
        })),
        pagination: {
            page,
            limit,
            total,
            has_more: offset + messages.length < total
        }
    };
}

/**
 * 메시지 전송
 */
export async function sendMessage(senderId, receiverId, messageData) {
    const { content, message_type = 'text', reply_to_id = null, attachment = null } = messageData;

    // 대화방 찾기 또는 생성
    const conversation = await findOrCreateConversation(senderId, receiverId);

    // 메시지 삽입
    const result = await executeInsert(`
        INSERT INTO direct_messages (
            conversation_id, sender_id, receiver_id, content, message_type,
            attachment_url, attachment_name, attachment_size, attachment_type,
            reply_to_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        conversation.id,
        senderId,
        receiverId,
        content,
        message_type,
        attachment?.url || null,
        attachment?.name || null,
        attachment?.size || null,
        attachment?.type || null,
        reply_to_id
    ]);

    const messageId = result.insertId;

    // 대화방 last_message 업데이트
    const pool = getPool();
    await pool.execute(`
        UPDATE dm_conversations
        SET last_message_id = ?, last_message_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [messageId, conversation.id]);

    // 메시지 조회
    const messages = await query(`
        SELECT * FROM direct_messages WHERE id = ?
    `, [messageId]); return {
        message: messages[0],
        conversation_id: conversation.id
    };
}

/**
 * 메시지 읽음 처리
 */
export async function markAsRead(messageId, userId) {
    const pool = getPool();
    const [result] = await pool.execute(`
        UPDATE direct_messages
        SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
        WHERE id = ? AND receiver_id = ? AND is_read = FALSE
    `, [messageId, userId]);

    if (result.affectedRows === 0) {
        throw new Error('Message not found or already read');
    }

    const messages = await query(`
        SELECT id, is_read, read_at FROM direct_messages WHERE id = ?
    `, [messageId]);

    return messages[0];
}

/**
 * 대화의 모든 메시지 읽음 처리
 */
export async function markAllAsRead(conversationId, userId) {
    const pool = getPool();
    const [result] = await pool.execute(`
        UPDATE direct_messages
        SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ? AND receiver_id = ? AND is_read = FALSE
    `, [conversationId, userId]);

    return {
        conversation_id: conversationId,
        marked_count: result.affectedRows
    };
}

/**
 * 메시지 삭제 (소프트 삭제)
 */
export async function deleteMessage(messageId, userId) {
    const pool = getPool();
    const [result] = await pool.execute(`
        UPDATE direct_messages
        SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ?
        WHERE id = ? AND sender_id = ?
    `, [userId, messageId, userId]);

    if (result.affectedRows === 0) {
        throw new Error('Message not found or unauthorized');
    }

    return { message_id: messageId, is_deleted: true };
}/**
 * 메시지 검색
 */
export async function searchMessages(userId, searchQuery, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const [messages] = await query(`
        SELECT 
            m.*,
            c.id as conversation_id,
            u.display_name as sender_name
        FROM direct_messages m
        JOIN dm_conversations c ON m.conversation_id = c.id
        JOIN users u ON m.sender_id = u.id
        WHERE (c.participant1_id = ? OR c.participant2_id = ?)
          AND m.is_deleted = FALSE
          AND MATCH(m.content) AGAINST(? IN BOOLEAN MODE)
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
    `, [userId, userId, searchQuery, limit, offset]);

    return {
        messages,
        pagination: { page, limit, total: messages.length }
    };
}

/**
 * 읽지 않은 메시지 수 조회
 */
export async function getUnreadCount(userId) {
    const [result] = await query(`
        SELECT COUNT(*) as unread_count
        FROM direct_messages
        WHERE receiver_id = ? AND is_read = FALSE AND is_deleted = FALSE
    `, [userId]);

    return result[0].unread_count;
}
