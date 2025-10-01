import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface TodoSyncOptions {
    onTodoCreated?: (todo: any) => void;
    onTodoUpdated?: (todo: any) => void;
    onTodoDeleted?: (todoId: string) => void;
    onStatusChanged?: (todoId: string, status: string) => void;
    onCommentAdded?: (todoId: string, comment: any) => void;
    onSubtaskUpdated?: (todoId: string, subtasks: any[]) => void;
}

export const useTodoSync = (options: TodoSyncOptions = {}) => {
    const socketRef = useRef<Socket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (socketRef.current?.connected) return;

        const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:50000', {
            auth: {
                token: localStorage.getItem('token')
            },
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('TODO 동기화 연결됨');
            socket.emit('join', 'todos');
        });

        socket.on('disconnect', () => {
            console.log('TODO 동기화 연결 끊어짐');
            // 자동 재연결 시도
            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, 5000);
        });

        socket.on('connect_error', (error) => {
            console.error('TODO 동기화 연결 오류:', error);
        });

        // TODO 이벤트 리스너
        socket.on('todo:created', (todo) => {
            console.log('새 TODO 생성됨:', todo);
            options.onTodoCreated?.(todo);
        });

        socket.on('todo:updated', (todo) => {
            console.log('TODO 업데이트됨:', todo);
            options.onTodoUpdated?.(todo);
        });

        socket.on('todo:deleted', (todoId) => {
            console.log('TODO 삭제됨:', todoId);
            options.onTodoDeleted?.(todoId);
        });

        socket.on('todo:status_changed', (data) => {
            console.log('TODO 상태 변경됨:', data);
            options.onStatusChanged?.(data.todoId, data.status);
        });

        socket.on('todo:comment_added', (data) => {
            console.log('TODO 댓글 추가됨:', data);
            options.onCommentAdded?.(data.todoId, data.comment);
        });

        socket.on('todo:subtask_updated', (data) => {
            console.log('TODO 서브태스크 업데이트됨:', data);
            options.onSubtaskUpdated?.(data.todoId, data.subtasks);
        });

        socketRef.current = socket;
    }, [options]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }, []);

    const emitTodoUpdate = useCallback((todoId: string, updates: any) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('todo:update', { todoId, updates });
        }
    }, []);

    const emitStatusChange = useCallback((todoId: string, status: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('todo:change_status', { todoId, status });
        }
    }, []);

    const emitCommentAdd = useCallback((todoId: string, content: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('todo:add_comment', { todoId, content });
        }
    }, []);

    const emitSubtaskUpdate = useCallback((todoId: string, subtasks: any[]) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('todo:update_subtasks', { todoId, subtasks });
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected: socketRef.current?.connected || false,
        emitTodoUpdate,
        emitStatusChange,
        emitCommentAdd,
        emitSubtaskUpdate
    };
};
