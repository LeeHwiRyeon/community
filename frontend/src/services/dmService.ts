import axios from 'axios';
import io, { Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API 인스턴스
const api = axios.create({
    baseURL: `${API_BASE_URL}/dm`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터 (JWT 토큰 자동 추가)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// DM Service 인터페이스
export interface DMConversation {
    id: number;
    participant: {
        id: number;
        username: string;
        email: string;
        is_online: boolean;
    };
    last_message: {
        id: number;
        content: string;
        sender_id: number;
        message_type: string;
        created_at: string;
        is_read: boolean;
    } | null;
    unread_count: number;
    created_at: string;
    updated_at: string;
}

export interface DMMessage {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    message_type: 'text' | 'image' | 'file' | 'emoji';
    attachment_url?: string;
    attachment_name?: string;
    attachment_size?: number;
    attachment_type?: string;
    is_read: boolean;
    read_at?: string;
    reply_to_id?: number;
    created_at: string;
    updated_at: string;
}

export interface ConversationsResponse {
    success: boolean;
    data: {
        conversations: DMConversation[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    };
}

export interface MessagesResponse {
    success: boolean;
    data: {
        conversation_id: number;
        participant: {
            id: number;
            username: string;
            email: string;
            is_online: boolean;
        };
        messages: DMMessage[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            has_more: boolean;
        };
    };
}

export interface SendMessageRequest {
    receiver_id: number;
    content: string;
    message_type?: 'text' | 'image' | 'file' | 'emoji';
    reply_to_id?: number;
    attachment?: {
        url: string;
        name: string;
        size: number;
        type: string;
    };
}

// DM API 함수들
class DMService {
    private socket: Socket | null = null;

    /**
     * 대화 목록 조회
     */
    async getConversations(page = 1, limit = 20, search = ''): Promise<ConversationsResponse> {
        const response = await api.get('/conversations', {
            params: { page, limit, search },
        });
        return response.data;
    }

    /**
     * 특정 대화의 메시지 조회
     */
    async getMessages(conversationId: number, page = 1, limit = 50, before?: number): Promise<MessagesResponse> {
        const response = await api.get(`/messages/${conversationId}`, {
            params: { page, limit, before },
        });
        return response.data;
    }

    /**
     * 메시지 전송
     */
    async sendMessage(data: SendMessageRequest) {
        const response = await api.post('/send', data);
        return response.data;
    }

    /**
     * 메시지 읽음 처리
     */
    async markMessageAsRead(messageId: number) {
        const response = await api.put(`/read/${messageId}`);
        return response.data;
    }

    /**
     * 대화의 모든 메시지 읽음 처리
     */
    async markAllMessagesAsRead(conversationId: number) {
        const response = await api.put(`/read-all/${conversationId}`);
        return response.data;
    }

    /**
     * 메시지 삭제
     */
    async deleteMessage(messageId: number) {
        const response = await api.delete(`/message/${messageId}`);
        return response.data;
    }

    /**
     * 메시지 검색
     */
    async searchMessages(query: string, page = 1, limit = 20) {
        const response = await api.get('/search', {
            params: { q: query, page, limit },
        });
        return response.data;
    }

    /**
     * 읽지 않은 메시지 수 조회
     */
    async getUnreadCount() {
        const response = await api.get('/unread-count');
        return response.data;
    }

    /**
     * 특정 사용자와의 대화방 조회/생성
     */
    async getOrCreateConversation(userId: number) {
        const response = await api.get(`/conversation/${userId}`);
        return response.data;
    }

    /**
     * WebSocket 연결 초기화
     */
    initSocket(userId: number): Socket {
        if (this.socket && this.socket.connected) {
            return this.socket;
        }

        this.socket = io(API_BASE_URL, {
            path: '/socket.io/',
            transports: ['websocket', 'polling'],
        });

        // 인증
        this.socket.on('connect', () => {
            console.log('[DM Socket] Connected');
            this.socket?.emit('dm:authenticate', { user_id: userId });
        });

        this.socket.on('disconnect', () => {
            console.log('[DM Socket] Disconnected');
        });

        return this.socket;
    }

    /**
     * 대화방 참여
     */
    joinConversation(conversationId: number) {
        if (this.socket) {
            this.socket.emit('dm:join_conversation', { conversation_id: conversationId });
        }
    }

    /**
     * 대화방 나가기
     */
    leaveConversation(conversationId: number) {
        if (this.socket) {
            this.socket.emit('dm:leave_conversation', { conversation_id: conversationId });
        }
    }

    /**
     * 타이핑 상태 전송
     */
    sendTypingStatus(conversationId: number, isTyping: boolean) {
        if (this.socket) {
            this.socket.emit('dm:typing', {
                conversation_id: conversationId,
                is_typing: isTyping,
            });
        }
    }

    /**
     * 새 메시지 이벤트 리스너
     */
    onNewMessage(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('dm:new_message', callback);
        }
    }

    /**
     * 메시지 읽음 이벤트 리스너
     */
    onMessagesRead(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('dm:messages_read', callback);
        }
    }

    /**
     * 타이핑 상태 이벤트 리스너
     */
    onTyping(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('dm:typing', callback);
        }
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
}

// Singleton 인스턴스 export
export const dmService = new DMService();
export default dmService;
