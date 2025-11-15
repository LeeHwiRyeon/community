/**
 * Notification Context
 * 실시간 알림을 위한 React Context
 * 
 * @author AUTOAGENTS
 * @date 2025-11-09
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Notification {
    id: number;
    user_id: number;
    type: 'comment' | 'like' | 'mention' | 'follow' | 'reply' | 'system';
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    sender_id: number | null;
    sender_name: string | null;
    sender_avatar: string | null;
    related_type: string | null;
    related_id: number | null;
    action_url: string | null;
    created_at: string;
    read_at?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isConnected: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (notificationId: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
    children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const socketRef = useRef<Socket | null>(null);

    /**
     * Socket.IO 연결 초기화
     */
    const initializeSocket = useCallback(() => {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            console.warn('No access token found, skipping socket connection');
            return;
        }

        const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:50000';

        socketRef.current = io(SOCKET_URL, {
            auth: {
                token
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        const socket = socketRef.current;

        // 연결 이벤트
        socket.on('connected', (data) => {
            console.log('✅ Socket connected:', data);
            setIsConnected(true);
        });

        // 새 알림 수신
        socket.on('notification', (notification: Notification) => {
            console.log('🔔 New notification:', notification);
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // 브라우저 알림 표시
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/logo.png'
                });
            }
        });

        // 읽지 않은 알림 개수 업데이트
        socket.on('unread-count', (data: { count: number }) => {
            console.log('📊 Unread count updated:', data.count);
            setUnreadCount(data.count);
        });

        // 연결 해제
        socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            setIsConnected(false);
        });

        // 에러
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        // Ping-Pong (연결 유지)
        const pingInterval = setInterval(() => {
            if (socket.connected) {
                socket.emit('ping');
            }
        }, 30000); // 30초마다

        return () => {
            clearInterval(pingInterval);
            socket.disconnect();
        };
    }, []);

    /**
     * 알림 목록 조회
     */
    const fetchNotifications = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const API_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:50000';
            const response = await fetch(`${API_URL}/api/notifications?limit=50`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }

            const data = await response.json();

            // 백엔드 API 응답 형식에 맞게 수정
            if (data.success && data.data) {
                setNotifications(data.data.notifications || data.data);
                setUnreadCount(data.data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, []);

    /**
     * 알림 읽음 처리
     */
    const markAsRead = useCallback(async (notificationId: number) => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const API_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:50000';
            const response = await fetch(
                `${API_URL}/api/notifications/${notificationId}/read`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to mark notification as read');
            }

            // 로컬 상태 업데이트
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, []);

    /**
     * 모든 알림 읽음 처리
     */
    const markAllAsRead = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const API_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:50000';
            const response = await fetch(
                `${API_URL}/api/notifications/read-all`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to mark all notifications as read');
            }

            // 로컬 상태 업데이트
            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, []);

    /**
     * 알림 삭제
     */
    const deleteNotification = useCallback(async (notificationId: number) => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const API_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:50000';
            const response = await fetch(
                `${API_URL}/api/notifications/${notificationId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete notification');
            }

            // 로컬 상태 업데이트
            setNotifications(prev => prev.filter(n => n.id !== notificationId));

            // 읽지 않은 알림이었다면 카운트 감소
            const notification = notifications.find(n => n.id === notificationId);
            if (notification && !notification.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }, [notifications]);

    /**
     * 브라우저 알림 권한 요청
     */
    const requestNotificationPermission = useCallback(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('✅ Notification permission granted');
                }
            });
        }
    }, []);

    // 컴포넌트 마운트 시 초기화
    useEffect(() => {
        const token = localStorage.getItem('accessToken');

        if (token) {
            // Socket 연결
            const cleanup = initializeSocket();

            // 초기 알림 목록 가져오기
            fetchNotifications();

            // 브라우저 알림 권한 요청
            requestNotificationPermission();

            return cleanup;
        }
    }, [initializeSocket, fetchNotifications, requestNotificationPermission]);

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        isConnected,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

/**
 * Notification Context를 사용하는 Hook
 */
export const useNotifications = (): NotificationContextType => {
    const context = useContext(NotificationContext);

    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }

    return context;
};

export default NotificationContext;
