import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Textarea,
    Badge,
    Avatar,
    Tooltip,
    useToast,
    Spinner,
    Alert,
    AlertIcon,
    Divider
} from '@chakra-ui/react';
import { useCollaboration } from '../../hooks/useCollaboration';

interface RealTimeEditorProps {
    roomId: string;
    userId: string;
    initialContent?: string;
    onContentChange?: (content: string) => void;
}

interface User {
    userId: string;
    clientId: string;
    isOnline: boolean;
    cursor?: {
        position: number;
        timestamp: number;
    };
}

interface DocumentState {
    content: string;
    version: number;
    lastModified: number;
    lastModifiedBy: string;
}

const RealTimeEditor: React.FC<RealTimeEditorProps> = ({
    roomId,
    userId,
    initialContent = '',
    onContentChange
}) => {
    const [content, setContent] = useState(initialContent);
    const [users, setUsers] = useState<User[]>([]);
    const [cursors, setCursors] = useState<Map<string, { position: number; timestamp: number }>>(new Map());
    const [isConnected, setIsConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [documentState, setDocumentState] = useState<DocumentState | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const toast = useToast();

    const {
        connect,
        disconnect,
        joinRoom,
        leaveRoom,
        sendDocumentChange,
        sendCursorMove,
        sendTypingStatus,
        connectionState
    } = useCollaboration();

    // Connect to collaboration service
    useEffect(() => {
        const handleConnect = async () => {
            try {
                await connect();
                setIsConnected(true);
                await joinRoom(roomId, userId);

                toast({
                    title: '실시간 협업에 연결되었습니다',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
            } catch (error) {
                console.error('Failed to connect to collaboration service:', error);
                toast({
                    title: '실시간 협업 연결 실패',
                    description: '다시 시도해주세요.',
                    status: 'error',
                    duration: 5000,
                    isClosable: true
                });
            }
        };

        handleConnect();

        return () => {
            leaveRoom(roomId);
            disconnect();
        };
    }, [roomId, userId, connect, joinRoom, leaveRoom, disconnect, toast]);

    // Handle document changes
    const handleContentChange = useCallback((newContent: string) => {
        setContent(newContent);
        onContentChange?.(newContent);

        // Send document change
        sendDocumentChange(roomId, { content: newContent }, documentState?.version || 0);

        // Handle typing status
        setIsTyping(true);
        sendTypingStatus(roomId, true);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to stop typing status
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            sendTypingStatus(roomId, false);
        }, 1000);
    }, [roomId, documentState?.version, onContentChange, sendDocumentChange, sendTypingStatus]);

    // Handle cursor movement
    const handleCursorMove = useCallback((position: number) => {
        sendCursorMove(roomId, position);
    }, [roomId, sendCursorMove]);

    // Handle selection change
    const handleSelectionChange = useCallback(() => {
        if (textareaRef.current) {
            const position = textareaRef.current.selectionStart;
            handleCursorMove(position);
        }
    }, [handleCursorMove]);

    // Listen for collaboration events
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'document_state':
                    if (message.roomId === roomId) {
                        setDocumentState(message.state);
                        setContent(message.state.content);
                    }
                    break;

                case 'document_changed':
                    if (message.roomId === roomId && message.userId !== userId) {
                        setContent(message.changes.content);
                        setDocumentState(prev => prev ? {
                            ...prev,
                            content: message.changes.content,
                            version: message.version,
                            lastModified: message.timestamp,
                            lastModifiedBy: message.userId
                        } : null);
                    }
                    break;

                case 'user_joined':
                    if (message.roomId === roomId) {
                        setUsers(prev => [...prev.filter(u => u.userId !== message.userId), {
                            userId: message.userId,
                            clientId: message.clientId,
                            isOnline: true
                        }]);
                    }
                    break;

                case 'user_left':
                    if (message.roomId === roomId) {
                        setUsers(prev => prev.filter(u => u.userId !== message.userId));
                        setCursors(prev => {
                            const newCursors = new Map(prev);
                            newCursors.delete(message.userId);
                            return newCursors;
                        });
                    }
                    break;

                case 'cursor_moved':
                    if (message.roomId === roomId && message.userId !== userId) {
                        setCursors(prev => {
                            const newCursors = new Map(prev);
                            newCursors.set(message.userId, {
                                position: message.position,
                                timestamp: message.timestamp
                            });
                            return newCursors;
                        });
                    }
                    break;

                case 'user_typing':
                    if (message.roomId === roomId && message.userId !== userId) {
                        setTypingUsers(prev => {
                            const newTypingUsers = new Set(prev);
                            if (message.isTyping) {
                                newTypingUsers.add(message.userId);
                            } else {
                                newTypingUsers.delete(message.userId);
                            }
                            return newTypingUsers;
                        });
                    }
                    break;

                case 'error':
                    toast({
                        title: '협업 오류',
                        description: message.error,
                        status: 'error',
                        duration: 5000,
                        isClosable: true
                    });
                    break;
            }
        };

        // Add event listener for WebSocket messages
        window.addEventListener('collaboration_message', handleMessage);

        return () => {
            window.removeEventListener('collaboration_message', handleMessage);
        };
    }, [roomId, userId, toast]);

    // Render user cursors
    const renderCursors = () => {
        return Array.from(cursors.entries()).map(([userId, cursor]) => {
            const user = users.find(u => u.userId === userId);
            if (!user) return null;

            return (
                <Tooltip key={userId} label={`${user.userId} (${cursor.position})`}>
                    <Box
                        position="absolute"
                        left={`${cursor.position * 8}px`} // Approximate character width
                        top="0"
                        width="2px"
                        height="20px"
                        bg="blue.500"
                        zIndex={10}
                        pointerEvents="none"
                    />
                </Tooltip>
            );
        });
    };

    // Render typing indicators
    const renderTypingIndicators = () => {
        if (typingUsers.size === 0) return null;

        const typingUserNames = Array.from(typingUsers).join(', ');
        return (
            <Text fontSize="sm" color="gray.500" fontStyle="italic">
                {typingUserNames} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </Text>
        );
    };

    if (!isConnected) {
        return (
            <Box p={4} textAlign="center">
                <Spinner size="lg" />
                <Text mt={2}>실시간 협업에 연결 중...</Text>
            </Box>
        );
    }

    return (
        <VStack spacing={4} align="stretch" h="100%">
            {/* Header */}
            <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">실시간 협업 편집기</Text>
                    <Text fontSize="sm" color="gray.600">
                        Room: {roomId} | Users: {users.length}
                    </Text>
                </VStack>

                <HStack spacing={2}>
                    {users.map(user => (
                        <Tooltip key={user.userId} label={user.userId}>
                            <Avatar
                                size="sm"
                                name={user.userId}
                                bg={user.isOnline ? 'green.500' : 'gray.400'}
                            />
                        </Tooltip>
                    ))}
                </HStack>
            </HStack>

            {/* Typing indicators */}
            {renderTypingIndicators()}

            {/* Editor */}
            <Box position="relative" flex="1">
                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onSelect={handleSelectionChange}
                    placeholder="여기에 내용을 입력하세요..."
                    h="100%"
                    minH="300px"
                    resize="none"
                    fontFamily="mono"
                    fontSize="14px"
                    lineHeight="1.5"
                />
                {renderCursors()}
            </Box>

            {/* Status */}
            <HStack justify="space-between" p={2} bg="gray.50" borderRadius="md">
                <HStack spacing={4}>
                    <Badge colorScheme={isConnected ? 'green' : 'red'}>
                        {isConnected ? '연결됨' : '연결 끊김'}
                    </Badge>
                    <Text fontSize="sm" color="gray.600">
                        버전: {documentState?.version || 0}
                    </Text>
                    {isTyping && (
                        <Badge colorScheme="blue">입력 중...</Badge>
                    )}
                </HStack>

                <Text fontSize="sm" color="gray.600">
                    마지막 수정: {documentState?.lastModifiedBy || 'N/A'}
                </Text>
            </HStack>
        </VStack>
    );
};

export default RealTimeEditor;