/**
 * ⚡ 실시간 서비스 v3.0
 * 
 * WebSocket 기반 실시간 업데이트 시스템
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

export interface RealtimeMessage {
    type: string;
    data: any;
    timestamp: number;
    userId?: string;
    roomId?: string;
}

export interface RealtimeConfig {
    url: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    heartbeatInterval: number;
}

export class RealtimeService {
    private static instance: RealtimeService;
    private ws: WebSocket | null = null;
    private config: RealtimeConfig;
    private reconnectAttempts = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private heartbeatTimer: NodeJS.Timeout | null = null;
    private listeners: Map<string, Set<(data: any) => void>> = new Map();
    private isConnected = false;

    constructor(config: RealtimeConfig) {
        this.config = config;
    }

    static getInstance(config?: RealtimeConfig): RealtimeService {
        if (!RealtimeService.instance) {
            if (!config) {
                throw new Error('RealtimeService 초기화 시 config가 필요합니다.');
            }
            RealtimeService.instance = new RealtimeService(config);
        }
        return RealtimeService.instance;
    }

    // 🔌 연결 시작
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.config.url);

                this.ws.onopen = () => {
                    console.log('🔌 WebSocket 연결 성공');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    this.emit('connected', {});
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message: RealtimeMessage = JSON.parse(event.data);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('메시지 파싱 오류:', error);
                    }
                };

                this.ws.onclose = (event) => {
                    console.log('🔌 WebSocket 연결 종료:', event.code, event.reason);
                    this.isConnected = false;
                    this.stopHeartbeat();
                    this.emit('disconnected', { code: event.code, reason: event.reason });

                    if (event.code !== 1000) { // 정상 종료가 아닌 경우
                        this.scheduleReconnect();
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket 오류:', error);
                    this.emit('error', error);
                    reject(error);
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    // 🔌 연결 종료
    disconnect(): void {
        if (this.ws) {
            this.ws.close(1000, '사용자 요청');
            this.ws = null;
        }
        this.stopHeartbeat();
        this.clearReconnectTimer();
    }

    // 📤 메시지 전송
    send(type: string, data: any, roomId?: string): boolean {
        if (!this.isConnected || !this.ws) {
            console.warn('WebSocket이 연결되지 않았습니다.');
            return false;
        }

        const message: RealtimeMessage = {
            type,
            data,
            timestamp: Date.now(),
            roomId
        };

        try {
            this.ws.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('메시지 전송 오류:', error);
            return false;
        }
    }

    // 📥 이벤트 리스너 등록
    on(eventType: string, callback: (data: any) => void): void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType)!.add(callback);
    }

    // 📥 이벤트 리스너 제거
    off(eventType: string, callback: (data: any) => void): void {
        const listeners = this.listeners.get(eventType);
        if (listeners) {
            listeners.delete(callback);
            if (listeners.size === 0) {
                this.listeners.delete(eventType);
            }
        }
    }

    // 🎯 이벤트 발생
    private emit(eventType: string, data: any): void {
        const listeners = this.listeners.get(eventType);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('이벤트 리스너 오류:', error);
                }
            });
        }
    }

    // 📨 메시지 처리
    private handleMessage(message: RealtimeMessage): void {
        console.log('📨 수신된 메시지:', message);
        this.emit(message.type, message.data);
    }

    // 🔄 재연결 스케줄링
    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.error('최대 재연결 시도 횟수 초과');
            this.emit('maxReconnectAttemptsReached', {});
            return;
        }

        this.reconnectAttempts++;
        const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`${delay}ms 후 재연결 시도 (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

        this.reconnectTimer = setTimeout(() => {
            this.connect().catch(error => {
                console.error('재연결 실패:', error);
            });
        }, delay);
    }

    // ⏰ 재연결 타이머 정리
    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    // 💓 하트비트 시작
    private startHeartbeat(): void {
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                this.send('ping', { timestamp: Date.now() });
            }
        }, this.config.heartbeatInterval);
    }

    // 💓 하트비트 중지
    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    // 🏠 룸 참여
    joinRoom(roomId: string): boolean {
        return this.send('join_room', { roomId });
    }

    // 🚪 룸 떠나기
    leaveRoom(roomId: string): boolean {
        return this.send('leave_room', { roomId });
    }

    // 📊 연결 상태 확인
    getConnectionState(): {
        isConnected: boolean;
        reconnectAttempts: number;
        url: string;
    } {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            url: this.config.url
        };
    }

    // 🔧 설정 업데이트
    updateConfig(newConfig: Partial<RealtimeConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }
}

// 기본 설정으로 인스턴스 생성
export const realtimeService = RealtimeService.getInstance({
    url: 'ws://localhost:3001/ws',
    reconnectInterval: 1000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000
});

// 실시간 기능별 서비스들
export class ChatService {
    private realtime: RealtimeService;
    private encryptionEnabled: boolean = false;

    constructor(realtime: RealtimeService) {
        this.realtime = realtime;
    }

    // 🔐 암호화 활성화/비활성화
    setEncryption(enabled: boolean): void {
        this.encryptionEnabled = enabled;
        console.log(`🔐 Chat encryption ${enabled ? 'enabled' : 'disabled'}`);
    }

    isEncryptionEnabled(): boolean {
        return this.encryptionEnabled;
    }

    // 💬 채팅 메시지 전송
    sendMessage(message: string, roomId: string, userId: string, encrypted?: any): boolean {
        return this.realtime.send('chat_message', {
            message,
            userId,
            roomId,
            encrypted: encrypted || null,
            isEncrypted: !!encrypted
        }, roomId);
    }

    // 💬 채팅 메시지 수신
    onMessage(callback: (data: { message: string; userId: string; timestamp: number; encrypted?: any; isEncrypted?: boolean }) => void): void {
        this.realtime.on('chat_message', callback);
    }

    // 👤 사용자 입장
    onUserJoin(callback: (data: { userId: string; username: string }) => void): void {
        this.realtime.on('user_join', callback);
    }

    // 👤 사용자 퇴장
    onUserLeave(callback: (data: { userId: string; username: string }) => void): void {
        this.realtime.on('user_leave', callback);
    }
}

export class NotificationService {
    private realtime: RealtimeService;

    constructor(realtime: RealtimeService) {
        this.realtime = realtime;
    }

    // 🔔 알림 전송
    sendNotification(userId: string, message: string, type: string = 'info'): boolean {
        return this.realtime.send('notification', {
            userId,
            message,
            type,
            timestamp: Date.now()
        });
    }

    // 🔔 알림 수신
    onNotification(callback: (data: { message: string; type: string; timestamp: number }) => void): void {
        this.realtime.on('notification', callback);
    }
}

export class PresenceService {
    private realtime: RealtimeService;

    constructor(realtime: RealtimeService) {
        this.realtime = realtime;
    }

    // 👥 온라인 상태 업데이트
    updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): boolean {
        return this.realtime.send('presence_update', {
            status,
            timestamp: Date.now()
        });
    }

    // 👥 사용자 상태 변경 수신
    onPresenceUpdate(callback: (data: { userId: string; status: string; timestamp: number }) => void): void {
        this.realtime.on('presence_update', callback);
    }

    // 👥 온라인 사용자 목록 수신
    onOnlineUsers(callback: (data: { users: Array<{ userId: string; username: string; status: string }> }) => void): void {
        this.realtime.on('online_users', callback);
    }
}

// 서비스 인스턴스들
export const chatService = new ChatService(realtimeService);
export const notificationService = new NotificationService(realtimeService);
export const presenceService = new PresenceService(realtimeService);
