import { useState, useEffect, useRef, useCallback } from 'react';

interface CollaborationMessage {
    type: string;
    [key: string]: any;
}

interface CollaborationOptions {
    url?: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}

interface DocumentChange {
    content: string;
    [key: string]: any;
}

export const useCollaboration = (options: CollaborationOptions = {}) => {
    const {
        url = 'ws://localhost:5000/ws/collaboration',
        reconnectInterval = 3000,
        maxReconnectAttempts = 5
    } = options;

    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const messageHandlersRef = useRef<Map<string, (message: any) => void>>(new Map());

    // Connect to WebSocket
    const connect = useCallback(async (): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            setConnectionState('connecting');
            setError(null);

            try {
                const ws = new WebSocket(url);
                wsRef.current = ws;

                ws.onopen = () => {
                    setConnectionState('connected');
                    setIsConnected(true);
                    setError(null);
                    reconnectAttemptsRef.current = 0;
                    resolve();
                };

                ws.onclose = (event) => {
                    setConnectionState('disconnected');
                    setIsConnected(false);

                    if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
                        // Attempt to reconnect
                        reconnectAttemptsRef.current++;
                        reconnectTimeoutRef.current = setTimeout(() => {
                            connect().catch(console.error);
                        }, reconnectInterval);
                    }
                };

                ws.onerror = (error) => {
                    setConnectionState('error');
                    setError('WebSocket connection error');
                    reject(error);
                };

                ws.onmessage = (event) => {
                    try {
                        const message: CollaborationMessage = JSON.parse(event.data);

                        // Dispatch message to registered handlers
                        const handler = messageHandlersRef.current.get(message.type);
                        if (handler) {
                            handler(message);
                        }

                        // Dispatch custom event for global listeners
                        const customEvent = new CustomEvent('collaboration_message', {
                            detail: message
                        });
                        window.dispatchEvent(customEvent);
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };
            } catch (error) {
                setConnectionState('error');
                setError('Failed to create WebSocket connection');
                reject(error);
            }
        });
    }, [url, reconnectInterval, maxReconnectAttempts]);

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'User disconnected');
            wsRef.current = null;
        }

        setConnectionState('disconnected');
        setIsConnected(false);
        reconnectAttemptsRef.current = 0;
    }, []);

    // Send message
    const sendMessage = useCallback((message: CollaborationMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not connected');
        }
    }, []);

    // Join room
    const joinRoom = useCallback(async (roomId: string, userId: string) => {
        sendMessage({
            type: 'join_room',
            roomId,
            userId,
            timestamp: Date.now()
        });
    }, [sendMessage]);

    // Leave room
    const leaveRoom = useCallback((roomId: string) => {
        sendMessage({
            type: 'leave_room',
            roomId,
            timestamp: Date.now()
        });
    }, [sendMessage]);

    // Send document change
    const sendDocumentChange = useCallback((roomId: string, changes: DocumentChange, version: number) => {
        sendMessage({
            type: 'document_change',
            roomId,
            changes,
            version,
            timestamp: Date.now()
        });
    }, [sendMessage]);

    // Send cursor movement
    const sendCursorMove = useCallback((roomId: string, position: number) => {
        sendMessage({
            type: 'cursor_move',
            roomId,
            position,
            timestamp: Date.now()
        });
    }, [sendMessage]);

    // Send typing status
    const sendTypingStatus = useCallback((roomId: string, isTyping: boolean) => {
        sendMessage({
            type: 'user_typing',
            roomId,
            isTyping,
            timestamp: Date.now()
        });
    }, [sendMessage]);

    // Send ping
    const sendPing = useCallback(() => {
        sendMessage({
            type: 'ping',
            timestamp: Date.now()
        });
    }, [sendMessage]);

    // Register message handler
    const onMessage = useCallback((messageType: string, handler: (message: any) => void) => {
        messageHandlersRef.current.set(messageType, handler);

        return () => {
            messageHandlersRef.current.delete(messageType);
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    // Heartbeat mechanism
    useEffect(() => {
        if (!isConnected) return;

        const heartbeatInterval = setInterval(() => {
            sendPing();
        }, 30000); // 30 seconds

        return () => {
            clearInterval(heartbeatInterval);
        };
    }, [isConnected, sendPing]);

    return {
        // State
        connectionState,
        isConnected,
        error,

        // Actions
        connect,
        disconnect,
        sendMessage,

        // Room management
        joinRoom,
        leaveRoom,

        // Document collaboration
        sendDocumentChange,
        sendCursorMove,
        sendTypingStatus,

        // Utilities
        sendPing,
        onMessage
    };
};

export default useCollaboration;
