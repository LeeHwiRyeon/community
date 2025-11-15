/**
 * Chat Service
 * 채팅 API 및 WebSocket 통신
 * 
 * Phase 3 - Real-time Chat System
 * @author Phase 3 Development Team
 * @date 2025-11-12
 */

import { io, Socket } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

interface Message {
    id: number;
    content: string;
    sender_id: number;
    sender_username: string;
    sender_avatar?: string;
    message_type: 'text' | 'image' | 'file' | 'system';
    created_at: string;
    is_read?: boolean;
    attachment_url?: string;
    reply_to_id?: number;
}

interface Conversation {
    id: number;
    other_user_id: number;
    other_username: string;
    other_avatar?: string;
    last_message_content?: string;
    last_message_at?: string;
    unread_count: number;
}

interface GroupChat {
    id: number;
    name: string;
    description?: string;
    avatar_url?: string;
    member_count: number;
    unread_count: number;
    last_message_content?: string;
    last_message_at?: string;
    my_role: 'admin' | 'moderator' | 'member';
}

class ChatService {
    private socket: Socket | null = null;
    private token: string | null = null;

    /**
     * WebSocket 연결 초기화
     */
    connectSocket(token: string) {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.token = token;
        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('[ChatService] Socket connected');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[ChatService] Socket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('[ChatService] Socket connection error:', error);
        });

        return this.socket;
    }

    /**
     * WebSocket 연결 해제
     */
    disconnectSocket() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Socket 인스턴스 반환
     */
    getSocket(): Socket | null {
        return this.socket;
    }

    // ===================================
    // DM (Direct Message) API
    // ===================================

    /**
     * DM 대화방 생성 또는 조회
     */
    async getOrCreateConversation(otherUserId: number): Promise<{ conversation: Conversation; isNew: boolean }> {
        const response = await fetch(`${API_BASE_URL}/chat/dm/conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({ otherUserId })
        });

        if (!response.ok) {
            throw new Error('Failed to create conversation');
        }

        const data = await response.json();
        return data;
    }

    /**
     * 내 DM 대화방 목록 조회
     */
    async getConversations(page = 1, limit = 20): Promise<{ conversations: Conversation[]; pagination: any }> {
        const response = await fetch(`${API_BASE_URL}/chat/dm/conversations?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch conversations');
        }

        const data = await response.json();
        return data;
    }

    /**
     * DM 메시지 전송
     */
    async sendDirectMessage(conversationId: number, receiverId: number, content: string, messageType = 'text', attachment?: any, replyToId?: number): Promise<{ message: Message }> {
        const response = await fetch(`${API_BASE_URL}/chat/dm/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({
                conversationId,
                receiverId,
                content,
                messageType,
                attachment,
                replyToId
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        const data = await response.json();
        return data;
    }

    /**
     * DM 메시지 목록 조회
     */
    async getConversationMessages(conversationId: number, page = 1, limit = 50): Promise<{ messages: Message[] }> {
        const response = await fetch(`${API_BASE_URL}/chat/dm/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        return data;
    }

    /**
     * 메시지 읽음 처리
     */
    async markMessageAsRead(messageId: number): Promise<void> {
        await fetch(`${API_BASE_URL}/chat/dm/messages/${messageId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
    }

    /**
     * 메시지 삭제
     */
    async deleteMessage(messageId: number): Promise<void> {
        await fetch(`${API_BASE_URL}/chat/dm/messages/${messageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
    }

    // ===================================
    // 그룹 채팅 API
    // ===================================

    /**
     * 그룹 채팅방 생성
     */
    async createGroup(name: string, description?: string, isPrivate = false, maxMembers = 100): Promise<{ group: GroupChat }> {
        const response = await fetch(`${API_BASE_URL}/chat/groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({
                name,
                description,
                isPrivate,
                maxMembers
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create group');
        }

        const data = await response.json();
        return data;
    }

    /**
     * 내 그룹 채팅방 목록 조회
     */
    async getGroups(page = 1, limit = 20): Promise<{ groups: GroupChat[] }> {
        const response = await fetch(`${API_BASE_URL}/chat/groups?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch groups');
        }

        const data = await response.json();
        return data;
    }

    /**
     * 그룹 멤버 추가
     */
    async addGroupMember(groupId: number, userId: number, role = 'member'): Promise<void> {
        await fetch(`${API_BASE_URL}/chat/groups/${groupId}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({ userId, role })
        });
    }

    /**
     * 그룹 메시지 전송
     */
    async sendGroupMessage(groupId: number, content: string, messageType = 'text', file?: any, replyTo?: number): Promise<{ message: Message }> {
        const response = await fetch(`${API_BASE_URL}/chat/groups/${groupId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({
                content,
                messageType,
                file,
                replyTo
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send group message');
        }

        const data = await response.json();
        return data;
    }

    /**
     * 그룹 메시지 목록 조회
     */
    async getGroupMessages(groupId: number, page = 1, limit = 50): Promise<{ messages: Message[] }> {
        const response = await fetch(`${API_BASE_URL}/chat/groups/${groupId}/messages?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch group messages');
        }

        const data = await response.json();
        return data;
    }

    // ===================================
    // WebSocket 이벤트
    // ===================================

    /**
     * DM 대화방 참가
     */
    joinDmRoom(conversationId: number) {
        this.socket?.emit('dm:join', { conversationId });
    }

    /**
     * DM 대화방 나가기
     */
    leaveDmRoom(conversationId: number) {
        this.socket?.emit('dm:leave', { conversationId });
    }

    /**
     * DM 타이핑 시작
     */
    startTypingInDm(conversationId: number) {
        this.socket?.emit('dm:typing', { conversationId });
    }

    /**
     * DM 타이핑 중지
     */
    stopTypingInDm(conversationId: number) {
        this.socket?.emit('dm:stop_typing', { conversationId });
    }

    /**
     * 그룹 채팅방 참가
     */
    joinGroupRoom(groupId: number) {
        this.socket?.emit('group:join', { groupId });
    }

    /**
     * 그룹 채팅방 나가기
     */
    leaveGroupRoom(groupId: number) {
        this.socket?.emit('group:leave', { groupId });
    }

    /**
     * 그룹 타이핑 시작
     */
    startTypingInGroup(groupId: number) {
        this.socket?.emit('group:typing', { groupId });
    }

    /**
     * 그룹 타이핑 중지
     */
    stopTypingInGroup(groupId: number) {
        this.socket?.emit('group:stop_typing', { groupId });
    }
}

export default new ChatService();
export type { Message, Conversation, GroupChat };
