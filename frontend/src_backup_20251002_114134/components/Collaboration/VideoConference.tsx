import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    VStack,
    HStack,
    Button,
    Text,
    Badge,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    IconButton,
    Tooltip,
    Flex,
    Spacer
} from '@chakra-ui/react';
import {
    PhoneIcon,
    PhoneOffIcon,
    VideoIcon,
    VideoOffIcon,
    MicrophoneIcon,
    MicrophoneOffIcon,
    SettingsIcon,
    ShareIcon,
    ChatIcon
} from '@chakra-ui/icons';

interface VideoConferenceProps {
    roomId: string;
    userId: string;
    onClose?: () => void;
}

interface Participant {
    userId: string;
    stream: MediaStream | null;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    isScreenSharing: boolean;
}

const VideoConference: React.FC<VideoConferenceProps> = ({
    roomId,
    userId,
    onClose
}) => {
    const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const dataChannelRef = useRef<RTCDataChannel | null>(null);

    const toast = useToast();
    const { isOpen, onOpen, onClose: onSettingsClose } = useDisclosure();

    // Initialize local media stream
    const initializeLocalStream = useCallback(async () => {
        try {
            setIsConnecting(true);
            setError(null);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: true
            });

            setLocalStream(stream);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            toast({
                title: '미디어 스트림 초기화 완료',
                status: 'success',
                duration: 3000,
                isClosable: true
            });
        } catch (error) {
            console.error('Error accessing media devices:', error);
            setError('카메라나 마이크에 접근할 수 없습니다.');
            toast({
                title: '미디어 접근 실패',
                description: '카메라와 마이크 권한을 확인해주세요.',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        } finally {
            setIsConnecting(false);
        }
    }, [toast]);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !isVideoEnabled;
                setIsVideoEnabled(!isVideoEnabled);
            }
        }
    }, [localStream, isVideoEnabled]);

    // Toggle audio
    const toggleAudio = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !isAudioEnabled;
                setIsAudioEnabled(!isAudioEnabled);
            }
        }
    }, [localStream, isAudioEnabled]);

    // Start screen sharing
    const startScreenShare = useCallback(async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = screenStream;
            }

            setIsScreenSharing(true);

            // Replace video track in local stream
            if (localStream) {
                const videoTrack = screenStream.getVideoTracks()[0];
                const sender = peerConnectionsRef.current.values().next().value?.getSenders()
                    .find(s => s.track && s.track.kind === 'video');

                if (sender && videoTrack) {
                    await sender.replaceTrack(videoTrack);
                }
            }

            toast({
                title: '화면 공유 시작',
                status: 'success',
                duration: 3000,
                isClosable: true
            });
        } catch (error) {
            console.error('Error starting screen share:', error);
            toast({
                title: '화면 공유 실패',
                description: '화면 공유를 시작할 수 없습니다.',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        }
    }, [localStream, toast]);

    // Stop screen sharing
    const stopScreenShare = useCallback(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
        setIsScreenSharing(false);

        toast({
            title: '화면 공유 중지',
            status: 'info',
            duration: 3000,
            isClosable: true
        });
    }, [localStream, toast]);

    // Leave conference
    const leaveConference = useCallback(() => {
        // Stop all tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        // Close all peer connections
        peerConnectionsRef.current.forEach(pc => pc.close());
        peerConnectionsRef.current.clear();

        // Clear participants
        setParticipants(new Map());

        onClose?.();

        toast({
            title: '회의에서 나갔습니다',
            status: 'info',
            duration: 3000,
            isClosable: true
        });
    }, [localStream, onClose, toast]);

    // Initialize on mount
    useEffect(() => {
        initializeLocalStream();

        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [initializeLocalStream]);

    // Render participant video
    const renderParticipantVideo = (participant: Participant, participantId: string) => {
        const videoRef = (element: HTMLVideoElement | null) => {
            if (element) {
                remoteVideosRef.current.set(participantId, element);
                if (participant.stream) {
                    element.srcObject = participant.stream;
                }
            }
        };

        return (
            <Box
                key={participantId}
                position="relative"
                w="200px"
                h="150px"
                bg="gray.800"
                borderRadius="md"
                overflow="hidden"
            >
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={participantId === userId}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />

                {/* Participant info overlay */}
                <Box
                    position="absolute"
                    bottom="0"
                    left="0"
                    right="0"
                    bg="blackAlpha.700"
                    color="white"
                    p={2}
                >
                    <HStack justify="space-between" align="center">
                        <Text fontSize="sm" fontWeight="bold">
                            {participantId}
                        </Text>
                        <HStack spacing={1}>
                            {!participant.isVideoEnabled && (
                                <Badge colorScheme="red" size="sm">비디오 끔</Badge>
                            )}
                            {!participant.isAudioEnabled && (
                                <Badge colorScheme="red" size="sm">음소거</Badge>
                            )}
                            {participant.isScreenSharing && (
                                <Badge colorScheme="blue" size="sm">화면 공유</Badge>
                            )}
                        </HStack>
                    </HStack>
                </Box>
            </Box>
        );
    };

    if (error) {
        return (
            <Box p={4} textAlign="center">
                <Text color="red.500" mb={4}>{error}</Text>
                <Button onClick={initializeLocalStream} colorScheme="blue">
                    다시 시도
                </Button>
            </Box>
        );
    }

    return (
        <Box h="100%" bg="gray.900" color="white">
            {/* Header */}
            <Flex p={4} bg="gray.800" align="center">
                <Text fontWeight="bold" fontSize="lg">
                    화상 회의 - {roomId}
                </Text>
                <Spacer />
                <HStack spacing={2}>
                    <Badge colorScheme="green">참가자: {participants.size + 1}</Badge>
                    <Button size="sm" variant="ghost" onClick={onOpen}>
                        <SettingsIcon />
                    </Button>
                </HStack>
            </Flex>

            {/* Video Grid */}
            <Box p={4} h="calc(100% - 120px)" overflow="auto">
                <VStack spacing={4} align="stretch">
                    {/* Local video */}
                    <Box align="center">
                        <Text mb={2} fontSize="sm" color="gray.400">
                            나 ({userId})
                        </Text>
                        <Box
                            position="relative"
                            w="300px"
                            h="200px"
                            bg="gray.800"
                            borderRadius="md"
                            overflow="hidden"
                        >
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />

                            {/* Local video controls overlay */}
                            <Box
                                position="absolute"
                                bottom="0"
                                left="0"
                                right="0"
                                bg="blackAlpha.700"
                                p={2}
                            >
                                <HStack justify="center" spacing={2}>
                                    <IconButton
                                        size="sm"
                                        colorScheme={isVideoEnabled ? "green" : "red"}
                                        icon={isVideoEnabled ? <VideoIcon /> : <VideoOffIcon />}
                                        onClick={toggleVideo}
                                        aria-label="Toggle video"
                                    />
                                    <IconButton
                                        size="sm"
                                        colorScheme={isAudioEnabled ? "green" : "red"}
                                        icon={isAudioEnabled ? <MicrophoneIcon /> : <MicrophoneOffIcon />}
                                        onClick={toggleAudio}
                                        aria-label="Toggle audio"
                                    />
                                </HStack>
                            </Box>
                        </Box>
                    </Box>

                    {/* Remote videos */}
                    {participants.size > 0 && (
                        <Box>
                            <Text mb={2} fontSize="sm" color="gray.400">
                                다른 참가자들
                            </Text>
                            <HStack spacing={4} wrap="wrap" justify="center">
                                {Array.from(participants.entries()).map(([participantId, participant]) =>
                                    renderParticipantVideo(participant, participantId)
                                )}
                            </HStack>
                        </Box>
                    )}
                </VStack>
            </Box>

            {/* Controls */}
            <Box p={4} bg="gray.800" borderTop="1px" borderColor="gray.700">
                <HStack justify="center" spacing={4}>
                    <Tooltip label="비디오 토글">
                        <IconButton
                            colorScheme={isVideoEnabled ? "green" : "red"}
                            icon={isVideoEnabled ? <VideoIcon /> : <VideoOffIcon />}
                            onClick={toggleVideo}
                            aria-label="Toggle video"
                        />
                    </Tooltip>

                    <Tooltip label="오디오 토글">
                        <IconButton
                            colorScheme={isAudioEnabled ? "green" : "red"}
                            icon={isAudioEnabled ? <MicrophoneIcon /> : <MicrophoneOffIcon />}
                            onClick={toggleAudio}
                            aria-label="Toggle audio"
                        />
                    </Tooltip>

                    <Tooltip label={isScreenSharing ? "화면 공유 중지" : "화면 공유 시작"}>
                        <IconButton
                            colorScheme={isScreenSharing ? "blue" : "gray"}
                            icon={<ShareIcon />}
                            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                            aria-label="Toggle screen share"
                        />
                    </Tooltip>

                    <Tooltip label="채팅">
                        <IconButton
                            colorScheme="gray"
                            icon={<ChatIcon />}
                            onClick={() => { }}
                            aria-label="Open chat"
                        />
                    </Tooltip>

                    <Button
                        colorScheme="red"
                        leftIcon={<PhoneOffIcon />}
                        onClick={leaveConference}
                    >
                        나가기
                    </Button>
                </HStack>
            </Box>

            {/* Settings Modal */}
            <Modal isOpen={isOpen} onClose={onSettingsClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>회의 설정</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Text>설정 옵션들이 여기에 표시됩니다.</Text>
                            {/* Add settings options here */}
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default VideoConference;
