/**
 * Socket Service
 * Socket.io 클라이언트 연결 및 이벤트 관리
 * 
 * Phase 3 - Real-time Notification System
 * @author Phase 3 Development Team
 * @date 2025-11-12
 */

import { io, Socket } from 'socket.io-client';

interface SocketConfig {
    url: string;
    token: string;
    onNotification?: (notification: any) => void;
    onUserOnline?: (userId: number) => void;
    onUserOffline?: (userId: number) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: any) => void;
}

class SocketService {
    private socket: Socket | null = null;
    private config: SocketConfig | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private heartbeatInterval: NodeJS.Timeout | null = null;

    /**
     * Socket.io 연결 초기화
     */
    public connect(config: SocketConfig): void {
        if (this.socket?.connected) {
            console.log('Socket already connected');
            return;
        }

        this.config = config;

        // Socket.io 클라이언트 생성
        this.socket = io(config.url, {
            auth: {
                token: config.token
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts,
            timeout: 10000
        });

        this.setupEventListeners();
        this.startHeartbeat();
    }

    /**
     * 이벤트 리스너 설정
     */
    private setupEventListeners(): void {
        if (!this.socket) return;

        // 연결 성공
        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket?.id);
            this.reconnectAttempts = 0;
            this.config?.onConnect?.();
        });

        // 연결 해제
        this.socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            this.config?.onDisconnect?.();

            // 자동 재연결 시도
            if (reason === 'io server disconnect') {
                // 서버에서 강제 종료한 경우 수동으로 재연결
                setTimeout(() => this.reconnect(), 1000);
            }
        });

        // 연결 에러
        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.reconnectAttempts++;
            this.config?.onError?.(error);

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
                this.disconnect();
            }
        });

        // 새 알림 수신
        this.socket.on('notification', (notification) => {
            console.log('🔔 New notification received:', notification);
            this.config?.onNotification?.(notification);

            // 브라우저 알림 표시
            this.showBrowserNotification(notification);
        });

        // 사용자 온라인 상태 변경
        this.socket.on('user:online', (data: { userId: number; username: string }) => {
            console.log('👋 User online:', data);
            this.config?.onUserOnline?.(data.userId);
        });

        this.socket.on('user:offline', (data: { userId: number; username: string }) => {
            console.log('👋 User offline:', data);
            this.config?.onUserOffline?.(data.userId);
        });

        // Heartbeat 응답
        this.socket.on('heartbeat:ack', () => {
            // console.log('💓 Heartbeat acknowledged');
        });

        // 에러
        this.socket.on('error', (error) => {
            console.error('❌ Socket error:', error);
            this.config?.onError?.(error);
        });
    }

    /**
     * 하트비트 시작 (연결 유지)
     */
    private startHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            if (this.socket?.connected) {
                this.socket.emit('heartbeat');
            }
        }, 60000); // 60초마다
    }

    /**
     * 하트비트 중지
     */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * 재연결 시도
     */
    private reconnect(): void {
        if (this.config && this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
            this.socket?.connect();
        }
    }

    /**
     * Socket.io 연결 해제
     */
    public disconnect(): void {
        this.stopHeartbeat();

        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }

        this.config = null;
        this.reconnectAttempts = 0;
        console.log('Socket disconnected and cleaned up');
    }

    /**
     * Socket 인스턴스 반환
     */
    public getSocket(): Socket | null {
        return this.socket;
    }

    /**
     * 연결 상태 확인
     */
    public isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    /**
     * 이벤트 발송
     */
    public emit(event: string, data?: any): void {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn(`Cannot emit '${event}': Socket not connected`);
        }
    }

    /**
     * 이벤트 리스너 등록
     */
    public on(event: string, callback: (...args: any[]) => void): void {
        this.socket?.on(event, callback);
    }

    /**
     * 이벤트 리스너 제거
     */
    public off(event: string, callback?: (...args: any[]) => void): void {
        if (callback) {
            this.socket?.off(event, callback);
        } else {
            this.socket?.off(event);
        }
    }

    /**
     * 브라우저 알림 표시
     */
    private showBrowserNotification(notification: any): void {
        // 브라우저 알림 권한 확인
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return;
        }

        if (Notification.permission === 'granted') {
            new Notification(notification.title || '새 알림', {
                body: notification.message || notification.content,
                icon: '/logo.png',
                badge: '/logo.png',
                tag: `notification-${notification.id}`,
                requireInteraction: false,
                silent: false
            });
        } else if (Notification.permission === 'default') {
            // 권한 요청
            this.requestNotificationPermission();
        }
    }

    /**
     * 브라우저 알림 권한 요청
     */
    public async requestNotificationPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission;
        }

        return Notification.permission;
    }
}

// 싱글톤 인스턴스
const socketService = new SocketService();

export default socketService;
