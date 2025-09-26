import React, { useState, useEffect } from 'react';
import { Box, VStack, Text, Button, Badge, useToast, HStack } from '@chakra-ui/react';

interface Notification {
    id: string;
    type: string;
    message: string;
    postId?: string;
    commentId?: string;
    timestamp: number;
    read: boolean;
}

const NotificationCenter: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const toast = useToast();

    useEffect(() => {
        // Connect to WebSocket
        const userId = '1'; // Replace with actual user ID
        const websocket = new WebSocket(`ws://localhost:50000?userId=${userId}`);

        websocket.onopen = () => {
            console.log('WebSocket connected');
        };

        websocket.onmessage = (event) => {
            const notification: Notification = JSON.parse(event.data);
            setNotifications(prev => [notification, ...prev]);
            toast({
                title: '새 알림',
                description: notification.message,
                status: 'info',
                duration: 5000,
                isClosable: true,
            });
        };

        websocket.onclose = () => {
            console.log('WebSocket disconnected');
        };

        setWs(websocket);

        return () => {
            websocket.close();
        };
    }, [toast]);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <Box p={4} borderWidth={1} borderRadius="md">
            <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                    <Text fontSize="lg" fontWeight="bold">알림</Text>
                    <Button size="sm" onClick={clearAll}>모두 지우기</Button>
                </HStack>
                {notifications.length === 0 ? (
                    <Text>새 알림이 없습니다.</Text>
                ) : (
                    notifications.map(notification => (
                        <Box key={notification.id} p={3} bg={notification.read ? 'gray.50' : 'blue.50'} borderRadius="md">
                            <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                    <Text fontWeight="bold">{notification.type}</Text>
                                    <Text>{notification.message}</Text>
                                    <Text fontSize="sm" color="gray.500">
                                        {new Date(notification.timestamp).toLocaleString()}
                                    </Text>
                                </VStack>
                                {!notification.read && (
                                    <Badge colorScheme="blue">새</Badge>
                                )}
                            </HStack>
                            {!notification.read && (
                                <Button size="sm" mt={2} onClick={() => markAsRead(notification.id)}>
                                    읽음으로 표시
                                </Button>
                            )}
                        </Box>
                    ))
                )}
            </VStack>
        </Box>
    );
};

export default NotificationCenter;