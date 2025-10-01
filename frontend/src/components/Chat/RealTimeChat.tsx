import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Avatar,
    Badge,
    IconButton,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    useColorModeValue,
    Menu,
    MenuButton,
    MenuList,
    MenuItem
} from '@chakra-ui/react';
import io, { Socket } from 'socket.io-client';

interface Message {
    id: string;
    communityId: string;
    channelId: string;
    userId: string;
    username: string;
    avatar: string;
    content: string;
    type: string;
    metadata: any;
    replyTo?: string;
    mentions: string[];
    reactions: { [emoji: string]: string[] };
    isEdited: boolean;
    editedAt?: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

interface Channel {
    id: string;
    communityId: string;
    name: string;
    description: string;
    type: string;
    isPrivate: boolean;
    members: string[];
    moderators: string[];
    settings: {
        allowFileUpload: boolean;
        allowReactions: boolean;
        allowMentions: boolean;
        slowMode: number;
        maxMessageLength: number;
        autoDelete: number;
    };
    createdAt: Date;
    createdBy: string;
}

interface OnlineUser {
    userId: string;
    username: string;
    avatar: string;
    status: string;
    lastSeen: Date;
}

interface RealtimeChatProps {
    communityId: string;
    currentUserId: string;
    currentUsername: string;
    currentUserAvatar: string;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({
    communityId,
    currentUserId,
    currentUsername,
    currentUserAvatar
}) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [replyTo, setReplyTo] = useState<Message | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { isOpen: isChannelOpen, onOpen: onChannelOpen, onClose: onChannelClose } = useDisclosure();
    const { isOpen: isUsersOpen, onOpen: onUsersOpen, onClose: onUsersClose } = useDisclosure();

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // Socket.IO 연결
    useEffect(() => {
        const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
        setSocket(newSocket);

        // 연결 이벤트
        newSocket.on('connect', () => {
            setIsConnected(true);
            console.log('Socket.IO 연결됨');
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Socket.IO 연결 해제됨');
        });

        // 인증
        newSocket.emit('authenticate', {
            userId: currentUserId,
            username: currentUsername,
            avatar: currentUserAvatar
        });

        // 커뮤니티 참여
        newSocket.emit('join_community', { communityId });

        // 메시지 이벤트
        newSocket.on('new_message', (message: Message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        });

        newSocket.on('message_updated', (message: Message) => {
            setMessages(prev => prev.map(m => m.id === message.id ? message : m));
        });

        newSocket.on('message_deleted', (data: { messageId: string }) => {
            setMessages(prev => prev.map(m =>
                m.id === data.messageId ? { ...m, isDeleted: true, deletedAt: new Date() } : m
            ));
        });

        newSocket.on('reaction_updated', (data: { messageId: string; reactions: any }) => {
            setMessages(prev => prev.map(m =>
                m.id === data.messageId ? { ...m, reactions: data.reactions } : m
            ));
        });

        newSocket.on('user_typing', (data: { userId: string; username: string; channelId: string }) => {
            if (data.channelId === currentChannel?.id) {
                setTypingUsers(prev => {
                    if (!prev.includes(data.userId)) {
                        return [...prev, data.userId];
                    }
                    return prev;
                });
            }
        });

        newSocket.on('user_stopped_typing', (data: { userId: string; channelId: string }) => {
            if (data.channelId === currentChannel?.id) {
                setTypingUsers(prev => prev.filter(id => id !== data.userId));
            }
        });

        newSocket.on('user_status_change', (data: { userId: string; status: string; username: string; avatar: string }) => {
            setOnlineUsers(prev => {
                const existingUser = prev.find(u => u.userId === data.userId);
                if (existingUser) {
                    return prev.map(u => u.userId === data.userId ? { ...u, status: data.status } : u);
                } else if (data.status === 'online') {
                    return [...prev, { userId: data.userId, username: data.username, avatar: data.avatar, status: data.status, lastSeen: new Date() }];
                }
                return prev;
            });
        });

        newSocket.on('error', (error: { message: string }) => {
            toast({
                title: '오류',
                description: error.message,
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        });

        return () => {
            newSocket.close();
        };
    }, [communityId, currentUserId, currentUsername, currentUserAvatar]);

    // 채널 목록 조회
    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const response = await fetch(`/api/realtime-chat/channels/${communityId}`);
                const data = await response.json();
                if (data.success) {
                    setChannels(data.data);
                    if (data.data.length > 0) {
                        setCurrentChannel(data.data[0]);
                        joinChannel(data.data[0].id);
                    }
                }
            } catch (error) {
                console.error('채널 목록 조회 오류:', error);
            }
        };

        fetchChannels();
    }, [communityId]);

    // 메시지 히스토리 조회
    useEffect(() => {
        if (currentChannel) {
            const fetchMessages = async () => {
                try {
                    const response = await fetch(`/api/realtime-chat/messages/${currentChannel.id}`);
                    const data = await response.json();
                    if (data.success) {
                        setMessages(data.data.messages);
                        scrollToBottom();
                    }
                } catch (error) {
                    console.error('메시지 히스토리 조회 오류:', error);
                }
            };

            fetchMessages();
        }
    }, [currentChannel]);

    // 채널 참여
    const joinChannel = (channelId: string) => {
        if (socket) {
            socket.emit('join_channel', { channelId });
        }
    };

    // 메시지 전송
    const sendMessage = () => {
        if (!socket || !currentChannel || !messageInput.trim()) return;

        const mentions = messageInput.match(/@(\w+)/g) || [];
        const mentionIds = mentions.map(mention => mention.substring(1));

        socket.emit('send_message', {
            communityId,
            channelId: currentChannel.id,
            content: messageInput,
            type: 'text',
            mentions: mentionIds,
            replyTo: replyTo?.id
        });

        setMessageInput('');
        setReplyTo(null);
        setIsTyping(false);
    };

    // 타이핑 상태 관리
    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageInput(e.target.value);

        if (!isTyping && currentChannel) {
            setIsTyping(true);
            socket?.emit('typing_start', { channelId: currentChannel.id });
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            if (currentChannel) {
                socket?.emit('typing_stop', { channelId: currentChannel.id });
            }
        }, 1000);
    };

    // 스크롤을 맨 아래로
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <Box h="100vh" display="flex" flexDirection="column">
            {/* 헤더 */}
            <Box p={4} borderBottom="1px solid" borderColor={borderColor} bg={bgColor}>
                <HStack justify="space-between">
                    <HStack spacing={4}>
                        <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" fontSize="lg">
                                {currentChannel?.name || '채널 선택'}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                                {currentChannel?.description}
                            </Text>
                        </VStack>
                        <Badge colorScheme={isConnected ? 'green' : 'red'}>
                            {isConnected ? '온라인' : '오프라인'}
                        </Badge>
                    </HStack>
                    <HStack spacing={2}>
                        <IconButton
                            icon={<SettingsIcon />}
                            aria-label="채널 설정"
                            size="sm"
                            onClick={onChannelOpen}
                        />
                        <IconButton
                            icon={<UserGroupIcon />}
                            aria-label="온라인 사용자"
                            size="sm"
                            onClick={onUsersOpen}
                        />
                    </HStack>
                </HStack>
            </Box>

            <Flex flex="1" overflow="hidden">
                {/* 채널 목록 */}
                <Box w="250px" borderRight="1px solid" borderColor={borderColor} bg={bgColor}>
                    <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold" mb={2}>채널</Text>
                        <Button size="sm" leftIcon={<AddIcon />} onClick={onChannelOpen}>
                            채널 추가
                        </Button>
                    </Box>
                    <VStack spacing={1} p={2} align="stretch">
                        {channels.map((channel) => (
                            <Button
                                key={channel.id}
                                variant={currentChannel?.id === channel.id ? 'solid' : 'ghost'}
                                colorScheme={currentChannel?.id === channel.id ? 'blue' : 'gray'}
                                justifyContent="start"
                                onClick={() => {
                                    setCurrentChannel(channel);
                                    joinChannel(channel.id);
                                }}
                            >
                                <HStack spacing={2}>
                                    <Text>#</Text>
                                    <Text>{channel.name}</Text>
                                </HStack>
                            </Button>
                        ))}
                    </VStack>
                </Box>

                {/* 메시지 영역 */}
                <Box flex="1" display="flex" flexDirection="column">
                    {/* 메시지 목록 */}
                    <Box flex="1" overflowY="auto" p={4}>
                        <VStack spacing={4} align="stretch">
                            {messages.map((message) => (
                                <Box key={message.id}>
                                    {message.isDeleted ? (
                                        <Text color="gray.500" fontStyle="italic">
                                            메시지가 삭제되었습니다.
                                        </Text>
                                    ) : (
                                        <HStack spacing={3} align="start">
                                            <Avatar size="sm" src={message.avatar} />
                                            <VStack align="start" spacing={1} flex="1">
                                                <HStack spacing={2}>
                                                    <Text fontWeight="bold" fontSize="sm">
                                                        {message.username}
                                                    </Text>
                                                    <Text fontSize="xs" color="gray.500">
                                                        {new Date(message.createdAt).toLocaleTimeString()}
                                                    </Text>
                                                    {message.isEdited && (
                                                        <Text fontSize="xs" color="gray.500">
                                                            (수정됨)
                                                        </Text>
                                                    )}
                                                </HStack>
                                                <Text>{message.content}</Text>
                                            </VStack>
                                        </HStack>
                                    )}
                                </Box>
                            ))}
                            {typingUsers.length > 0 && (
                                <Text fontSize="sm" color="gray.500" fontStyle="italic">
                                    {typingUsers.length}명이 입력 중...
                                </Text>
                            )}
                            <div ref={messagesEndRef} />
                        </VStack>
                    </Box>

                    {/* 메시지 입력 */}
                    <Box p={4} borderTop="1px solid" borderColor={borderColor} bg={bgColor}>
                        <HStack spacing={2}>
                            <Input
                                value={messageInput}
                                onChange={handleTyping}
                                placeholder="메시지를 입력하세요..."
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                            />
                            <Button
                                colorScheme="blue"
                                onClick={sendMessage}
                                isDisabled={!messageInput.trim()}
                            >
                                전송
                            </Button>
                        </HStack>
                    </Box>
                </Box>
            </Flex>

            {/* 채널 설정 모달 */}
            <Modal isOpen={isChannelOpen} onClose={onChannelClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>채널 설정</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>채널 설정 기능은 곧 추가될 예정입니다.</Text>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 온라인 사용자 모달 */}
            <Modal isOpen={isUsersOpen} onClose={onUsersClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>온라인 사용자</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={2} align="stretch">
                            {onlineUsers.map((user) => (
                                <HStack key={user.userId} spacing={3}>
                                    <Avatar size="sm" src={user.avatar} />
                                    <VStack align="start" spacing={0}>
                                        <Text fontWeight="bold" fontSize="sm">
                                            {user.username}
                                        </Text>
                                        <Text fontSize="xs" color="green.500">
                                            온라인
                                        </Text>
                                    </VStack>
                                </HStack>
                            ))}
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default RealtimeChat;