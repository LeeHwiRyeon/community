import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Badge,
    Card,
    CardBody,
    CardHeader,
    SimpleGrid,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    IconButton,
    Tooltip,
    Alert,
    AlertIcon,
    Spinner
} from '@chakra-ui/react';
import {
    AddIcon,
    EditIcon,
    DeleteIcon,
    ViewIcon,
    SettingsIcon,
    UsersIcon,
    ChatIcon,
    VideoIcon
} from '@chakra-ui/icons';
import RealTimeEditor from './RealTimeEditor';
import VideoConference from './VideoConference';

interface CollaborationRoom {
    id: string;
    name: string;
    description: string;
    participants: number;
    isActive: boolean;
    createdAt: string;
    lastActivity: string;
}

interface CollaborationStats {
    totalRooms: number;
    activeRooms: number;
    totalParticipants: number;
    onlineUsers: number;
}

const CollaborationDashboard: React.FC = () => {
    const [rooms, setRooms] = useState<CollaborationRoom[]>([]);
    const [stats, setStats] = useState<CollaborationStats>({
        totalRooms: 0,
        activeRooms: 0,
        totalParticipants: 0,
        onlineUsers: 0
    });
    const [selectedRoom, setSelectedRoom] = useState<CollaborationRoom | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
    const { isOpen: isJoinOpen, onOpen: onJoinOpen, onClose: onJoinClose } = useDisclosure();
    const { isOpen: isRoomOpen, onOpen: onRoomOpen, onClose: onRoomClose } = useDisclosure();

    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomDescription, setNewRoomDescription] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [activeTab, setActiveTab] = useState(0);

    const toast = useToast();

    // Fetch rooms and stats
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch rooms
            const roomsResponse = await fetch('/api/collaboration/rooms/stats');
            const roomsData = await roomsResponse.json();

            if (roomsData.success) {
                const roomsList = Object.entries(roomsData.data).map(([id, roomData]: [string, any]) => ({
                    id,
                    name: `Room ${id}`,
                    description: 'Collaboration room',
                    participants: roomData.userCount || 0,
                    isActive: roomData.userCount > 0,
                    createdAt: new Date().toISOString(),
                    lastActivity: new Date().toISOString()
                }));

                setRooms(roomsList);

                // Calculate stats
                const totalParticipants = roomsList.reduce((sum, room) => sum + room.participants, 0);
                const activeRooms = roomsList.filter(room => room.isActive).length;

                setStats({
                    totalRooms: roomsList.length,
                    activeRooms,
                    totalParticipants,
                    onlineUsers: totalParticipants
                });
            }
        } catch (error) {
            console.error('Error fetching collaboration data:', error);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // Create new room
    const createRoom = async () => {
        try {
            if (!newRoomName.trim()) {
                toast({
                    title: '오류',
                    description: '방 이름을 입력해주세요.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });
                return;
            }

            const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const response = await fetch('/api/collaboration/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    roomId,
                    userId: 'current_user', // TODO: Get from auth context
                    documentContent: ''
                })
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: '방 생성 완료',
                    description: `방 "${newRoomName}"이 생성되었습니다.`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });

                setNewRoomName('');
                setNewRoomDescription('');
                onCreateClose();
                fetchData();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error creating room:', error);
            toast({
                title: '방 생성 실패',
                description: '방을 생성할 수 없습니다.',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        }
    };

    // Join room
    const joinRoom = async () => {
        try {
            if (!joinRoomId.trim()) {
                toast({
                    title: '오류',
                    description: '방 ID를 입력해주세요.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });
                return;
            }

            const room = rooms.find(r => r.id === joinRoomId);
            if (!room) {
                toast({
                    title: '오류',
                    description: '존재하지 않는 방입니다.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });
                return;
            }

            setSelectedRoom(room);
            onJoinClose();
            onRoomOpen();
        } catch (error) {
            console.error('Error joining room:', error);
            toast({
                title: '방 참여 실패',
                description: '방에 참여할 수 없습니다.',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        }
    };

    // Delete room
    const deleteRoom = async (roomId: string) => {
        try {
            const response = await fetch(`/api/collaboration/rooms/${roomId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: '방 삭제 완료',
                    description: '방이 삭제되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error deleting room:', error);
            toast({
                title: '방 삭제 실패',
                description: '방을 삭제할 수 없습니다.',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        }
    };

    // Load data on mount
    useEffect(() => {
        fetchData();

        // Refresh data every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading && rooms.length === 0) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>협업 데이터를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6}>
            {/* Header */}
            <VStack spacing={4} align="stretch" mb={8}>
                <HStack justify="space-between">
                    <Text fontSize="2xl" fontWeight="bold">
                        실시간 협업 대시보드
                    </Text>
                    <HStack spacing={2}>
                        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onCreateOpen}>
                            새 방 만들기
                        </Button>
                        <Button leftIcon={<ViewIcon />} colorScheme="green" onClick={onJoinOpen}>
                            방 참여하기
                        </Button>
                    </HStack>
                </HStack>

                {/* Stats */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    <Card>
                        <CardBody textAlign="center">
                            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                {stats.totalRooms}
                            </Text>
                            <Text fontSize="sm" color="gray.600">총 방 수</Text>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody textAlign="center">
                            <Text fontSize="2xl" fontWeight="bold" color="green.500">
                                {stats.activeRooms}
                            </Text>
                            <Text fontSize="sm" color="gray.600">활성 방</Text>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody textAlign="center">
                            <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                                {stats.totalParticipants}
                            </Text>
                            <Text fontSize="sm" color="gray.600">총 참가자</Text>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody textAlign="center">
                            <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                                {stats.onlineUsers}
                            </Text>
                            <Text fontSize="sm" color="gray.600">온라인 사용자</Text>
                        </CardBody>
                    </Card>
                </SimpleGrid>
            </VStack>

            {/* Error Alert */}
            {error && (
                <Alert status="error" mb={4}>
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            {/* Rooms List */}
            <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="bold">
                    활성 방 목록
                </Text>

                {rooms.length === 0 ? (
                    <Card>
                        <CardBody textAlign="center" py={8}>
                            <Text color="gray.500">아직 생성된 방이 없습니다.</Text>
                            <Button mt={4} colorScheme="blue" onClick={onCreateOpen}>
                                첫 번째 방 만들기
                            </Button>
                        </CardBody>
                    </Card>
                ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                        {rooms.map(room => (
                            <Card key={room.id} variant="outline">
                                <CardHeader pb={2}>
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold" fontSize="md">
                                            {room.name}
                                        </Text>
                                        <Badge colorScheme={room.isActive ? 'green' : 'gray'}>
                                            {room.isActive ? '활성' : '비활성'}
                                        </Badge>
                                    </HStack>
                                </CardHeader>
                                <CardBody pt={0}>
                                    <VStack spacing={3} align="stretch">
                                        <Text fontSize="sm" color="gray.600">
                                            {room.description}
                                        </Text>

                                        <HStack justify="space-between">
                                            <HStack spacing={4}>
                                                <HStack spacing={1}>
                                                    <UsersIcon />
                                                    <Text fontSize="sm">{room.participants}</Text>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.500">
                                                    ID: {room.id}
                                                </Text>
                                            </HStack>
                                        </HStack>

                                        <HStack spacing={2}>
                                            <Button
                                                size="sm"
                                                colorScheme="blue"
                                                leftIcon={<ViewIcon />}
                                                onClick={() => {
                                                    setSelectedRoom(room);
                                                    onRoomOpen();
                                                }}
                                            >
                                                참여
                                            </Button>
                                            <Button
                                                size="sm"
                                                colorScheme="red"
                                                leftIcon={<DeleteIcon />}
                                                onClick={() => deleteRoom(room.id)}
                                            >
                                                삭제
                                            </Button>
                                        </HStack>
                                    </VStack>
                                </CardBody>
                            </Card>
                        ))}
                    </SimpleGrid>
                )}
            </VStack>

            {/* Create Room Modal */}
            <Modal isOpen={isCreateOpen} onClose={onCreateClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>새 방 만들기</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <Input
                                placeholder="방 이름"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                            />
                            <Input
                                placeholder="방 설명 (선택사항)"
                                value={newRoomDescription}
                                onChange={(e) => setNewRoomDescription(e.target.value)}
                            />
                            <Button colorScheme="blue" onClick={createRoom} width="full">
                                방 만들기
                            </Button>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Join Room Modal */}
            <Modal isOpen={isJoinOpen} onClose={onJoinClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>방 참여하기</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <Input
                                placeholder="방 ID 입력"
                                value={joinRoomId}
                                onChange={(e) => setJoinRoomId(e.target.value)}
                            />
                            <Button colorScheme="green" onClick={joinRoom} width="full">
                                참여하기
                            </Button>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Room Modal */}
            <Modal isOpen={isRoomOpen} onClose={onRoomClose} size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <HStack justify="space-between">
                            <Text>{selectedRoom?.name}</Text>
                            <HStack spacing={2}>
                                <Badge colorScheme="green">
                                    {selectedRoom?.participants}명 참여 중
                                </Badge>
                                <IconButton
                                    size="sm"
                                    icon={<SettingsIcon />}
                                    aria-label="Settings"
                                />
                            </HStack>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Tabs index={activeTab} onChange={setActiveTab}>
                            <TabList>
                                <Tab>문서 편집</Tab>
                                <Tab>화상 회의</Tab>
                                <Tab>채팅</Tab>
                            </TabList>

                            <TabPanels>
                                <TabPanel p={0}>
                                    {selectedRoom && (
                                        <RealTimeEditor
                                            roomId={selectedRoom.id}
                                            userId="current_user" // TODO: Get from auth context
                                        />
                                    )}
                                </TabPanel>

                                <TabPanel p={0}>
                                    {selectedRoom && (
                                        <VideoConference
                                            roomId={selectedRoom.id}
                                            userId="current_user" // TODO: Get from auth context
                                            onClose={onRoomClose}
                                        />
                                    )}
                                </TabPanel>

                                <TabPanel>
                                    <Text>채팅 기능이 여기에 표시됩니다.</Text>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default CollaborationDashboard;
