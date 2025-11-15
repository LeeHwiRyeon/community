/**
 * Group Chat WebSocket Events Handler
 * 실시간 그룹 채팅을 위한 Socket.IO 이벤트 핸들러
 */

import { query } from '../db.js';
import logger from '../logger.js';

/**
 * Check if user is member of a group
 */
async function isGroupMember(groupId, userId) {
    try {
        const [members] = await query(
            'SELECT * FROM group_members WHERE group_id = ? AND user_id = ? AND is_banned = FALSE',
            [groupId, userId]
        );
        return members.length > 0;
    } catch (error) {
        logger.error('[group-chat-socket] Error checking membership:', error);
        return false;
    }
}

/**
 * Socket.IO를 위한 그룹 채팅 이벤트 핸들러 초기화
 */
export function initGroupChatSocketHandlers(io) {
    // 그룹 채팅 전용 네임스페이스 사용
    const groupChatNamespace = io.of('/group-chat');

    groupChatNamespace.on('connection', (socket) => {
        let userId = null;
        let currentGroups = new Set();

        logger.info(`[GroupChat Socket] New connection: ${socket.id}`);

        // ========================================
        // 1. 사용자 인증
        // ========================================
        socket.on('gc:authenticate', async (data) => {
            try {
                userId = data.user_id;
                if (userId) {
                    // 사용자별 room에 join
                    socket.join(`user_${userId}`);
                    logger.info(`[GroupChat Socket] User ${userId} authenticated`);

                    // 사용자가 속한 모든 그룹 조회
                    const [groups] = await query(`
                        SELECT group_id FROM group_members 
                        WHERE user_id = ? AND is_banned = FALSE
                    `, [userId]);

                    // 자동으로 모든 그룹 room에 join
                    for (const group of groups) {
                        const roomName = `group_${group.group_id}`;
                        socket.join(roomName);
                        currentGroups.add(group.group_id);
                    }

                    socket.emit('gc:authenticated', {
                        user_id: userId,
                        groups: Array.from(currentGroups)
                    });
                }
            } catch (error) {
                logger.error('[GroupChat Socket] Authentication error:', error);
                socket.emit('gc:error', { message: 'Authentication failed' });
            }
        });

        // ========================================
        // 2. 그룹 입장/퇴장
        // ========================================
        socket.on('gc:join_group', async (data) => {
            try {
                const { group_id } = data;

                if (!userId) {
                    socket.emit('gc:error', { message: 'Not authenticated' });
                    return;
                }

                // 멤버십 확인
                if (!await isGroupMember(group_id, userId)) {
                    socket.emit('gc:error', { message: 'Not a member of this group' });
                    return;
                }

                const roomName = `group_${group_id}`;
                socket.join(roomName);
                currentGroups.add(group_id);

                logger.info(`[GroupChat Socket] User ${userId} joined group ${group_id}`);

                // 그룹 멤버들에게 join 알림
                socket.to(roomName).emit('gc:user_joined', {
                    group_id,
                    user_id: userId,
                    timestamp: new Date()
                });

                socket.emit('gc:joined_group', { group_id });
            } catch (error) {
                logger.error('[GroupChat Socket] Join group error:', error);
                socket.emit('gc:error', { message: 'Failed to join group' });
            }
        });

        socket.on('gc:leave_group', (data) => {
            try {
                const { group_id } = data;
                const roomName = `group_${group_id}`;

                socket.leave(roomName);
                currentGroups.delete(group_id);

                logger.info(`[GroupChat Socket] User ${userId} left group ${group_id}`);

                // 그룹 멤버들에게 leave 알림
                socket.to(roomName).emit('gc:user_left', {
                    group_id,
                    user_id: userId,
                    timestamp: new Date()
                });

                socket.emit('gc:left_group', { group_id });
            } catch (error) {
                logger.error('[GroupChat Socket] Leave group error:', error);
            }
        });

        // ========================================
        // 3. 메시지 전송 (서버에서 저장 후 브로드캐스트)
        // ========================================
        socket.on('gc:send_message', async (data) => {
            try {
                const { group_id, content, message_type = 'text', reply_to } = data;

                if (!userId) {
                    socket.emit('gc:error', { message: 'Not authenticated' });
                    return;
                }

                // 멤버십 및 뮤트 상태 확인
                const [members] = await query(
                    'SELECT is_muted FROM group_members WHERE group_id = ? AND user_id = ? AND is_banned = FALSE',
                    [group_id, userId]
                );

                if (members.length === 0) {
                    socket.emit('gc:error', { message: 'Not a member of this group' });
                    return;
                }

                if (members[0].is_muted) {
                    socket.emit('gc:error', { message: 'You are muted in this group' });
                    return;
                }

                // 메시지 저장
                const [result] = await query(`
                    INSERT INTO group_messages (group_id, user_id, content, message_type, reply_to)
                    VALUES (?, ?, ?, ?, ?)
                `, [group_id, userId, content, message_type, reply_to || null]);

                const messageId = result.insertId;

                // 메시지 정보 조회
                const [messages] = await query(`
                    SELECT 
                        gm.*,
                        u.display_name as sender_name,
                        u.email as sender_email
                    FROM group_messages gm
                    JOIN users u ON gm.user_id = u.id
                    WHERE gm.id = ?
                `, [messageId]);

                const message = messages[0];

                // 그룹 멤버들에게 브로드캐스트 (본인 포함)
                groupChatNamespace.to(`group_${group_id}`).emit('gc:new_message', message);

                logger.info(`[GroupChat Socket] Message sent: group ${group_id}, user ${userId}`);
            } catch (error) {
                logger.error('[GroupChat Socket] Send message error:', error);
                socket.emit('gc:error', { message: 'Failed to send message' });
            }
        });

        // ========================================
        // 4. 타이핑 인디케이터
        // ========================================
        socket.on('gc:typing', (data) => {
            try {
                const { group_id, is_typing } = data;

                if (!userId) return;

                // 본인 제외하고 그룹 멤버들에게 전송
                socket.to(`group_${group_id}`).emit('gc:typing', {
                    group_id,
                    user_id: userId,
                    is_typing,
                    timestamp: new Date()
                });
            } catch (error) {
                logger.error('[GroupChat Socket] Typing event error:', error);
            }
        });

        // ========================================
        // 5. 읽음 상태
        // ========================================
        socket.on('gc:mark_read', async (data) => {
            try {
                const { group_id, message_id } = data;

                if (!userId) return;

                // 읽음 상태 저장
                await query(`
                    INSERT INTO group_message_reads (message_id, user_id)
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE read_at = NOW()
                `, [message_id, userId]);

                // last_read_at 업데이트
                await query(
                    'UPDATE group_members SET last_read_at = NOW() WHERE group_id = ? AND user_id = ?',
                    [group_id, userId]
                );

                // 그룹 멤버들에게 읽음 상태 브로드캐스트
                socket.to(`group_${group_id}`).emit('gc:message_read', {
                    group_id,
                    message_id,
                    user_id: userId,
                    read_at: new Date()
                });
            } catch (error) {
                logger.error('[GroupChat Socket] Mark read error:', error);
            }
        });

        // ========================================
        // 6. 메시지 삭제
        // ========================================
        socket.on('gc:delete_message', async (data) => {
            try {
                const { group_id, message_id } = data;

                if (!userId) {
                    socket.emit('gc:error', { message: 'Not authenticated' });
                    return;
                }

                // 권한 확인 (작성자 또는 admin/moderator)
                const [messages] = await query(
                    'SELECT user_id FROM group_messages WHERE id = ? AND group_id = ?',
                    [message_id, group_id]
                );

                if (messages.length === 0) {
                    socket.emit('gc:error', { message: 'Message not found' });
                    return;
                }

                const isAuthor = messages[0].user_id === userId;

                const [members] = await query(
                    'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
                    [group_id, userId]
                );

                const isAdmin = members.length > 0 && ['admin', 'moderator'].includes(members[0].role);

                if (!isAuthor && !isAdmin) {
                    socket.emit('gc:error', { message: 'Insufficient permissions' });
                    return;
                }

                // 메시지 삭제 (soft delete)
                await query(
                    'UPDATE group_messages SET deleted_at = NOW() WHERE id = ?',
                    [message_id]
                );

                // 그룹 멤버들에게 브로드캐스트
                groupChatNamespace.to(`group_${group_id}`).emit('gc:message_deleted', {
                    group_id,
                    message_id,
                    deleted_by: userId,
                    timestamp: new Date()
                });

                logger.info(`[GroupChat Socket] Message deleted: ${message_id} by user ${userId}`);
            } catch (error) {
                logger.error('[GroupChat Socket] Delete message error:', error);
                socket.emit('gc:error', { message: 'Failed to delete message' });
            }
        });

        // ========================================
        // 7. 온라인 상태 확인
        // ========================================
        socket.on('gc:get_online_members', async (data) => {
            try {
                const { group_id } = data;

                if (!await isGroupMember(group_id, userId)) {
                    socket.emit('gc:error', { message: 'Not a member of this group' });
                    return;
                }

                // 현재 그룹 room에 연결된 소켓들의 userId 추출
                const roomName = `group_${group_id}`;
                const socketsInRoom = await groupChatNamespace.in(roomName).fetchSockets();

                const onlineUserIds = new Set();
                for (const s of socketsInRoom) {
                    // socket data에서 userId 추출 (authenticate 시 설정 필요)
                    if (s.data?.userId) {
                        onlineUserIds.add(s.data.userId);
                    }
                }

                socket.emit('gc:online_members', {
                    group_id,
                    online_user_ids: Array.from(onlineUserIds)
                });
            } catch (error) {
                logger.error('[GroupChat Socket] Get online members error:', error);
            }
        });

        // ========================================
        // 8. 연결 해제
        // ========================================
        socket.on('disconnect', () => {
            if (userId) {
                // 모든 가입한 그룹에 offline 알림
                for (const groupId of currentGroups) {
                    socket.to(`group_${groupId}`).emit('gc:user_offline', {
                        group_id: groupId,
                        user_id: userId,
                        timestamp: new Date()
                    });
                }
                logger.info(`[GroupChat Socket] User ${userId} disconnected`);
            }
        });

        // userId를 socket data에 저장 (온라인 상태 확인용)
        socket.use((packet, next) => {
            if (userId && !socket.data.userId) {
                socket.data.userId = userId;
            }
            next();
        });
    });

    logger.info('[GroupChat Socket] Handler initialized');
}

// ========================================
// 외부에서 호출 가능한 emit 함수들
// ========================================

/**
 * 새 그룹 생성 알림
 */
export function emitGroupCreated(io, userId, groupData) {
    io.of('/group-chat').to(`user_${userId}`).emit('gc:group_created', groupData);
}

/**
 * 그룹 초대 알림
 */
export function emitGroupInvitation(io, inviteeId, invitationData) {
    io.of('/group-chat').to(`user_${inviteeId}`).emit('gc:group_invitation', invitationData);
}

/**
 * 멤버 추가 알림
 */
export function emitMemberAdded(io, groupId, memberData) {
    io.of('/group-chat').to(`group_${groupId}`).emit('gc:member_added', memberData);
}

/**
 * 멤버 제거 알림
 */
export function emitMemberRemoved(io, groupId, userId) {
    io.of('/group-chat').to(`group_${groupId}`).emit('gc:member_removed', {
        group_id: groupId,
        user_id: userId,
        timestamp: new Date()
    });
}

/**
 * 그룹 설정 변경 알림
 */
export function emitGroupSettingsUpdated(io, groupId, settings) {
    io.of('/group-chat').to(`group_${groupId}`).emit('gc:settings_updated', {
        group_id: groupId,
        settings,
        timestamp: new Date()
    });
}

/**
 * 역할 변경 알림
 */
export function emitRoleChanged(io, groupId, targetUserId, newRole) {
    io.of('/group-chat').to(`group_${groupId}`).emit('gc:role_changed', {
        group_id: groupId,
        user_id: targetUserId,
        new_role: newRole,
        timestamp: new Date()
    });
}

export default {
    initGroupChatSocketHandlers,
    emitGroupCreated,
    emitGroupInvitation,
    emitMemberAdded,
    emitMemberRemoved,
    emitGroupSettingsUpdated,
    emitRoleChanged
};
