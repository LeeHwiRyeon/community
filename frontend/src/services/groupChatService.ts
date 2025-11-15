import axios from 'axios';
import io, { Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API 인스턴스
const api = axios.create({
    baseURL: `${API_BASE_URL}/group-chat`,
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

// 그룹 채팅 인터페이스
export interface GroupChat {
    id: number;
    name: string;
    description?: string;
    owner_id: number;
    max_members: number;
    is_private: boolean;
    invite_code?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
    member_count?: number;
    message_count?: number;
    last_message?: GroupMessage;
    unread_count?: number;
    my_role?: 'admin' | 'moderator' | 'member';
}

export interface GroupMember {
    id: number;
    group_id: number;
    user_id: number;
    username: string;
    email: string;
    avatar_url?: string;
    role: 'admin' | 'moderator' | 'member';
    last_read_at?: string;
    is_muted: boolean;
    is_banned: boolean;
    is_online?: boolean;
    joined_at: string;
}

export interface GroupMessage {
    id: number;
    group_id: number;
    sender_id: number;
    sender_username?: string;
    sender_avatar?: string;
    content: string;
    message_type: 'text' | 'image' | 'file' | 'system';
    attachment_url?: string;
    attachment_name?: string;
    attachment_size?: number;
    attachment_type?: string;
    reply_to_id?: number;
    is_edited: boolean;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    read_by?: number[];
}

export interface GroupInvitation {
    id: number;
    group_id: number;
    group_name: string;
    inviter_id: number;
    inviter_username: string;
    invitee_id: number;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    expires_at: string;
    created_at: string;
}

export interface GroupSettings {
    group_id: number;
    who_can_send_messages: 'all' | 'moderators' | 'admins';
    who_can_add_members: 'all' | 'moderators' | 'admins';
    who_can_edit_group: 'moderators' | 'admins';
    allow_file_upload: boolean;
    max_file_size_mb: number;
    message_retention_days: number;
}

// API 응답 인터페이스
export interface GroupListResponse {
    success: boolean;
    data: {
        groups: GroupChat[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    };
}

export interface GroupDetailsResponse {
    success: boolean;
    data: {
        group: GroupChat;
        members: GroupMember[];
        settings: GroupSettings;
    };
}

export interface MessagesResponse {
    success: boolean;
    data: {
        group_id: number;
        messages: GroupMessage[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            has_more: boolean;
        };
    };
}

export interface CreateGroupRequest {
    name: string;
    description?: string;
    is_private: boolean;
    max_members?: number;
}

export interface UpdateGroupRequest {
    name?: string;
    description?: string;
    avatar_url?: string;
    max_members?: number;
}

export interface SendMessageRequest {
    content: string;
    message_type?: 'text' | 'image' | 'file';
    reply_to_id?: number;
    attachment?: {
        url: string;
        name: string;
        size: number;
        type: string;
    };
}

// 그룹 채팅 서비스 클래스
class GroupChatService {
    private socket: Socket | null = null;

    // ========== 그룹 관리 API ==========

    /**
     * 그룹 생성
     */
    async createGroup(data: CreateGroupRequest) {
        const response = await api.post('/groups', data);
        return response.data;
    }

    /**
     * 내 그룹 목록 조회
     */
    async getMyGroups(page = 1, limit = 20): Promise<GroupListResponse> {
        const response = await api.get('/groups', {
            params: { page, limit },
        });
        return response.data;
    }

    /**
     * 그룹 상세 정보 조회
     */
    async getGroupDetails(groupId: number): Promise<GroupDetailsResponse> {
        const response = await api.get(`/groups/${groupId}`);
        return response.data;
    }

    /**
     * 그룹 정보 수정
     */
    async updateGroup(groupId: number, data: UpdateGroupRequest) {
        const response = await api.put(`/groups/${groupId}`, data);
        return response.data;
    }

    /**
     * 그룹 삭제 (소프트 삭제)
     */
    async deleteGroup(groupId: number) {
        const response = await api.delete(`/groups/${groupId}`);
        return response.data;
    }

    /**
     * 공개 그룹 검색
     */
    async searchPublicGroups(query: string, page = 1, limit = 20) {
        const response = await api.get('/search', {
            params: { q: query, page, limit },
        });
        return response.data;
    }

    // ========== 멤버 관리 API ==========

    /**
     * 멤버 초대
     */
    async inviteMember(groupId: number, userId: number) {
        const response = await api.post(`/groups/${groupId}/invite`, { user_id: userId });
        return response.data;
    }

    /**
     * 초대 응답 (수락/거절)
     */
    async respondToInvitation(invitationId: number, accept: boolean) {
        const response = await api.post(`/invitations/${invitationId}/respond`, { accept });
        return response.data;
    }

    /**
     * 그룹 가입 (공개 그룹 또는 초대 코드)
     */
    async joinGroup(groupId: number, inviteCode?: string) {
        const response = await api.post(`/groups/${groupId}/join`, { invite_code: inviteCode });
        return response.data;
    }

    /**
     * 그룹 나가기
     */
    async leaveGroup(groupId: number) {
        const response = await api.post(`/groups/${groupId}/leave`);
        return response.data;
    }

    /**
     * 멤버 추방
     */
    async kickMember(groupId: number, userId: number) {
        const response = await api.delete(`/groups/${groupId}/members/${userId}`);
        return response.data;
    }

    /**
     * 멤버 역할 변경
     */
    async changeMemberRole(groupId: number, userId: number, role: 'admin' | 'moderator' | 'member') {
        const response = await api.put(`/groups/${groupId}/members/${userId}/role`, { role });
        return response.data;
    }

    // ========== 메시지 API ==========

    /**
     * 그룹 메시지 조회
     */
    async getMessages(groupId: number, page = 1, limit = 50, before?: number): Promise<MessagesResponse> {
        const response = await api.get(`/groups/${groupId}/messages`, {
            params: { page, limit, before },
        });
        return response.data;
    }

    /**
     * 메시지 전송
     */
    async sendMessage(groupId: number, data: SendMessageRequest) {
        const response = await api.post(`/groups/${groupId}/messages`, data);
        return response.data;
    }

    /**
     * 메시지 삭제
     */
    async deleteMessage(messageId: number) {
        const response = await api.delete(`/messages/${messageId}`);
        return response.data;
    }

    // ========== 설정 API ==========

    /**
     * 그룹 설정 업데이트
     */
    async updateSettings(groupId: number, settings: Partial<GroupSettings>) {
        const response = await api.put(`/groups/${groupId}/settings`, settings);
        return response.data;
    }

    // ========== WebSocket 관련 ==========

    /**
     * WebSocket 연결 초기화 (/group-chat 네임스페이스)
     */
    initSocket(userId: number): Socket {
        if (this.socket && this.socket.connected) {
            return this.socket;
        }

        // /group-chat 네임스페이스로 연결
        this.socket = io(`${API_BASE_URL.replace('/api', '')}/group-chat`, {
            path: '/socket.io/',
            transports: ['websocket', 'polling'],
        });

        // 인증
        this.socket.on('connect', () => {
            console.log('[Group Chat Socket] Connected to /group-chat namespace');
            this.socket?.emit('gc:authenticate', { user_id: userId });
        });

        this.socket.on('disconnect', () => {
            console.log('[Group Chat Socket] Disconnected');
        });

        this.socket.on('gc:authenticated', (data) => {
            console.log('[Group Chat Socket] Authenticated:', data);
        });

        this.socket.on('gc:error', (error) => {
            console.error('[Group Chat Socket] Error:', error);
        });

        return this.socket;
    }

    /**
     * 그룹 채팅방 참여
     */
    joinRoom(groupId: number) {
        if (this.socket) {
            this.socket.emit('gc:join_group', { group_id: groupId });
        }
    }

    /**
     * 그룹 채팅방 나가기
     */
    leaveRoom(groupId: number) {
        if (this.socket) {
            this.socket.emit('gc:leave_group', { group_id: groupId });
        }
    }

    /**
     * WebSocket으로 메시지 전송
     */
    sendMessageViaSocket(groupId: number, content: string, messageType = 'text', replyToId?: number) {
        if (this.socket) {
            this.socket.emit('gc:send_message', {
                group_id: groupId,
                content,
                message_type: messageType,
                reply_to_id: replyToId,
            });
        }
    }

    /**
     * 타이핑 상태 전송
     */
    sendTypingStatus(groupId: number, isTyping: boolean) {
        if (this.socket) {
            this.socket.emit('gc:typing', {
                group_id: groupId,
                is_typing: isTyping,
            });
        }
    }

    /**
     * 메시지 읽음 처리
     */
    markAsRead(groupId: number, messageId: number) {
        if (this.socket) {
            this.socket.emit('gc:mark_read', {
                group_id: groupId,
                message_id: messageId,
            });
        }
    }

    /**
     * 온라인 멤버 조회
     */
    getOnlineMembers(groupId: number, callback: (data: any) => void) {
        if (this.socket) {
            this.socket.emit('gc:get_online_members', { group_id: groupId });
            this.socket.once('gc:online_members', callback);
        }
    }

    /**
     * WebSocket으로 메시지 삭제
     */
    deleteMessageViaSocket(groupId: number, messageId: number) {
        if (this.socket) {
            this.socket.emit('gc:delete_message', {
                group_id: groupId,
                message_id: messageId,
            });
        }
    }

    // ========== 이벤트 리스너 ==========

    /**
     * 새 메시지 이벤트 리스너
     */
    onNewMessage(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('gc:new_message', callback);
        }
    }

    /**
     * 메시지 읽음 이벤트 리스너
     */
    onMessageRead(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('gc:message_read', callback);
        }
    }

    /**
     * 타이핑 상태 이벤트 리스너
     */
    onTyping(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('gc:typing', callback);
        }
    }

    /**
     * 메시지 삭제 이벤트 리스너
     */
    onMessageDeleted(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('gc:message_deleted', callback);
        }
    }

    /**
     * 사용자 입장 이벤트 리스너
     */
    onUserJoined(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('gc:user_joined', callback);
        }
    }

    /**
     * 사용자 퇴장 이벤트 리스너
     */
    onUserLeft(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('gc:user_left', callback);
        }
    }

    /**
     * 멤버 추가 이벤트 리스너
     */
    onMemberAdded(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('gc:member_added', callback);
        }
    }

    /**
     * 멤버 제거 이벤트 리스너
     */
    onMemberRemoved(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('gc:member_removed', callback);
        }
    }

    /**
     * 역할 변경 이벤트 리스너
     */
    onRoleChanged(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('gc:role_changed', callback);
        }
    }

    /**
     * 설정 변경 이벤트 리스너
     */
    onSettingsUpdated(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('gc:settings_updated', callback);
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

    /**
     * 모든 이벤트 리스너 제거
     */
    removeAllListeners() {
        if (this.socket) {
            this.socket.removeAllListeners();
        }
    }
}

// Singleton 인스턴스 export
export const groupChatService = new GroupChatService();
export default groupChatService;
