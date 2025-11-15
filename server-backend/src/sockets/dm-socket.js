/**
 * DM WebSocket Events Handler
 * 실시간 메시지 전송을 위한 Socket.IO 이벤트 핸들러
 */

import * as dmService from '../services/dm-service.js';

/**
 * Socket.IO를 위한 DM 이벤트 핸들러 초기화
 */
export function initDMSocketHandlers(io) {
    io.on('connection', (socket) => {
        let userId = null;

        // 사용자 인증
        socket.on('dm:authenticate', (data) => {
            userId = data.user_id;
            if (userId) {
                // 사용자별 room에 join
                socket.join(`user_${userId}`);
                console.log(`[DM Socket] User ${userId} authenticated and joined room`);
            }
        });

        // 대화방 join
        socket.on('dm:join_conversation', (data) => {
            const { conversation_id } = data;
            socket.join(`conversation_${conversation_id}`);
            console.log(`[DM Socket] User ${userId} joined conversation ${conversation_id}`);
        });

        // 대화방 leave
        socket.on('dm:leave_conversation', (data) => {
            const { conversation_id } = data;
            socket.leave(`conversation_${conversation_id}`);
            console.log(`[DM Socket] User ${userId} left conversation ${conversation_id}`);
        });

        // 타이핑 상태 전송
        socket.on('dm:typing', (data) => {
            const { conversation_id, is_typing } = data;
            socket.to(`conversation_${conversation_id}`).emit('dm:typing', {
                user_id: userId,
                conversation_id,
                is_typing
            });
        });

        // 읽음 상태 실시간 전송 (이미 REST API에서 처리되지만 추가 확인용)
        socket.on('dm:message_read', (data) => {
            const { message_id, conversation_id } = data;
            socket.to(`conversation_${conversation_id}`).emit('dm:message_read', {
                message_id,
                user_id: userId,
                read_at: new Date()
            });
        });

        // 연결 해제
        socket.on('disconnect', () => {
            if (userId) {
                console.log(`[DM Socket] User ${userId} disconnected`);
            }
        });
    });
}

/**
 * 새 메시지를 특정 사용자에게 전송 (외부에서 호출)
 */
export function emitNewMessage(io, receiverId, messageData) {
    io.to(`user_${receiverId}`).emit('dm:new_message', messageData);
}

/**
 * 읽음 상태를 대화방에 브로드캐스트 (외부에서 호출)
 */
export function emitMessagesRead(io, conversationId, data) {
    io.to(`conversation_${conversationId}`).emit('dm:messages_read', data);
}

/**
 * 타이핑 상태를 대화방에 브로드캐스트 (외부에서 호출)
 */
export function emitTyping(io, conversationId, userId, isTyping) {
    io.to(`conversation_${conversationId}`).emit('dm:typing', {
        user_id: userId,
        conversation_id: conversationId,
        is_typing: isTyping
    });
}
