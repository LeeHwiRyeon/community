import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    VStack,
    HStack,
    Text,
    Badge,
    Button,
    Box,
    Divider,
    useColorModeValue,
    Alert,
    AlertIcon,
    Spinner,
    IconButton,
    Tooltip,
    Collapse,
    Code,
    useDisclosure
} from '@chakra-ui/react';
import {
    ChevronDownIcon,
    ChevronUpIcon,
    TimeIcon,
    EditIcon,
    DeleteIcon,
    RepeatIcon,
    ViewIcon,
    CopyIcon
} from '@chakra-ui/icons';

export interface CommentHistoryItem {
    id: string;
    commentId: string;
    version: number;
    content: string;
    previousContent?: string;
    changeType: 'create' | 'edit' | 'delete' | 'restore';
    changeReason?: string;
    editedBy?: number;
    editedByName?: string;
    createdAt: string;
    metadata?: any;
}

interface CommentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    commentId: string;
    onRestore?: (version: number) => void;
    currentUserId?: number;
}

const CommentHistoryModal: React.FC<CommentHistoryModalProps> = ({
    isOpen,
    onClose,
    commentId,
    onRestore,
    currentUserId
}) => {
    const [history, setHistory] = useState<CommentHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());
    const [selectedVersions, setSelectedVersions] = useState<{ v1: number | null, v2: number | null }>({
        v1: null,
        v2: null
    });
    const [comparison, setComparison] = useState<any>(null);
    const [comparing, setComparing] = useState(false);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

    // 댓글 수정 이력 조회
    const fetchCommentHistory = async () => {
        if (!commentId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/comment-history/comment/${commentId}`);
            const data = await response.json();

            if (data.success) {
                setHistory(data.data);
            } else {
                setError(data.message || 'Failed to fetch comment history');
            }
        } catch (err) {
            setError('Failed to fetch comment history');
            console.error('Error fetching comment history:', err);
        } finally {
            setLoading(false);
        }
    };

    // 버전 비교
    const compareVersions = async (version1: number, version2: number) => {
        setComparing(true);
        try {
            const response = await fetch(`/api/comment-history/compare/${commentId}?version1=${version1}&version2=${version2}`);
            const data = await response.json();

            if (data.success) {
                setComparison(data.data);
            } else {
                setError(data.message || 'Failed to compare versions');
            }
        } catch (err) {
            setError('Failed to compare versions');
            console.error('Error comparing versions:', err);
        } finally {
            setComparing(false);
        }
    };

    // 버전 복원
    const handleRestore = async (version: number) => {
        if (!onRestore) return;

        try {
            const response = await fetch(`/api/comment-history/restore/${commentId}/${version}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    editedBy: currentUserId,
                    editedByName: 'Current User',
                    changeReason: 'Version restored by user'
                }),
            });

            const data = await response.json();

            if (data.success) {
                onRestore(version);
                fetchCommentHistory(); // 이력 새로고침
            } else {
                setError(data.message || 'Failed to restore version');
            }
        } catch (err) {
            setError('Failed to restore version');
            console.error('Error restoring version:', err);
        }
    };

    // 버전 확장/축소
    const toggleVersion = (version: number) => {
        setExpandedVersions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(version)) {
                newSet.delete(version);
            } else {
                newSet.add(version);
            }
            return newSet;
        });
    };

    // 버전 선택
    const selectVersion = (version: number) => {
        if (selectedVersions.v1 === null) {
            setSelectedVersions({ v1: version, v2: null });
        } else if (selectedVersions.v2 === null && version !== selectedVersions.v1) {
            setSelectedVersions({ v1: selectedVersions.v1, v2: version });
            compareVersions(selectedVersions.v1, version);
        } else {
            setSelectedVersions({ v1: version, v2: null });
            setComparison(null);
        }
    };

    // 변경 타입에 따른 색상
    const getChangeTypeColor = (changeType: string) => {
        switch (changeType) {
            case 'create': return 'green';
            case 'edit': return 'blue';
            case 'delete': return 'red';
            case 'restore': return 'purple';
            default: return 'gray';
        }
    };

    // 변경 타입에 따른 아이콘
    const getChangeTypeIcon = (changeType: string) => {
        switch (changeType) {
            case 'create': return <ViewIcon />;
            case 'edit': return <EditIcon />;
            case 'delete': return <DeleteIcon />;
            case 'restore': return <RepeatIcon />;
            default: return <ViewIcon />;
        }
    };

    // 컴포넌트 마운트 시 이력 조회
    useEffect(() => {
        if (isOpen && commentId) {
            fetchCommentHistory();
        }
    }, [isOpen, commentId]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent maxH="80vh" overflow="hidden">
                <ModalHeader>
                    <HStack spacing={2}>
                        <Text>댓글 수정 이력</Text>
                        <Badge colorScheme="blue">{history.length}개 버전</Badge>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody overflowY="auto">
                    {loading ? (
                        <Box textAlign="center" py={8}>
                            <Spinner size="lg" />
                            <Text mt={2}>이력을 불러오는 중...</Text>
                        </Box>
                    ) : error ? (
                        <Alert status="error">
                            <AlertIcon />
                            {error}
                        </Alert>
                    ) : (
                        <VStack spacing={4} align="stretch">
                            {/* 버전 목록 */}
                            {history.map((item) => (
                                <Box
                                    key={item.id}
                                    p={4}
                                    bg={bgColor}
                                    border="1px solid"
                                    borderColor={borderColor}
                                    borderRadius="md"
                                    _hover={{ bg: hoverBgColor }}
                                >
                                    <VStack spacing={3} align="stretch">
                                        {/* 버전 헤더 */}
                                        <HStack justify="space-between" align="center">
                                            <HStack spacing={2}>
                                                <Badge colorScheme={getChangeTypeColor(item.changeType)}>
                                                    v{item.version}
                                                </Badge>
                                                <Text fontSize="sm" color="gray.500">
                                                    {getChangeTypeIcon(item.changeType)}
                                                </Text>
                                                <Text fontSize="sm" fontWeight="medium">
                                                    {item.changeType === 'create' ? '생성' :
                                                        item.changeType === 'edit' ? '수정' :
                                                            item.changeType === 'delete' ? '삭제' : '복원'}
                                                </Text>
                                                {item.changeReason && (
                                                    <Text fontSize="xs" color="gray.500">
                                                        ({item.changeReason})
                                                    </Text>
                                                )}
                                            </HStack>

                                            <HStack spacing={2}>
                                                <Text fontSize="xs" color="gray.500">
                                                    {new Date(item.createdAt).toLocaleString()}
                                                </Text>
                                                {item.editedByName && (
                                                    <Text fontSize="xs" color="gray.500">
                                                        by {item.editedByName}
                                                    </Text>
                                                )}
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    onClick={() => selectVersion(item.version)}
                                                    colorScheme={selectedVersions.v1 === item.version || selectedVersions.v2 === item.version ? 'blue' : 'gray'}
                                                >
                                                    {selectedVersions.v1 === item.version ? 'V1' :
                                                        selectedVersions.v2 === item.version ? 'V2' : '선택'}
                                                </Button>
                                                <IconButton
                                                    size="xs"
                                                    variant="ghost"
                                                    icon={expandedVersions.has(item.version) ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                                    onClick={() => toggleVersion(item.version)}
                                                    aria-label={expandedVersions.has(item.version) ? '축소' : '확장'}
                                                />
                                            </HStack>
                                        </HStack>

                                        {/* 버전 내용 */}
                                        <Collapse in={expandedVersions.has(item.version)}>
                                            <Box>
                                                <Divider my={2} />
                                                <VStack spacing={2} align="stretch">
                                                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                                                        댓글 내용:
                                                    </Text>
                                                    <Code
                                                        p={3}
                                                        borderRadius="md"
                                                        fontSize="sm"
                                                        whiteSpace="pre-wrap"
                                                        maxH="200px"
                                                        overflowY="auto"
                                                    >
                                                        {item.content}
                                                    </Code>

                                                    {item.previousContent && (
                                                        <>
                                                            <Text fontSize="sm" fontWeight="medium" color="gray.600">
                                                                이전 내용:
                                                            </Text>
                                                            <Code
                                                                p={3}
                                                                borderRadius="md"
                                                                fontSize="sm"
                                                                whiteSpace="pre-wrap"
                                                                maxH="200px"
                                                                overflowY="auto"
                                                                bg="gray.100"
                                                                color="gray.700"
                                                            >
                                                                {item.previousContent}
                                                            </Code>
                                                        </>
                                                    )}

                                                    {/* 액션 버튼 */}
                                                    <HStack spacing={2} justify="flex-end">
                                                        {item.changeType !== 'create' && onRestore && (
                                                            <Button
                                                                size="sm"
                                                                colorScheme="purple"
                                                                leftIcon={<RepeatIcon />}
                                                                onClick={() => handleRestore(item.version)}
                                                            >
                                                                이 버전으로 복원
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            leftIcon={<CopyIcon />}
                                                            onClick={() => navigator.clipboard.writeText(item.content)}
                                                        >
                                                            복사
                                                        </Button>
                                                    </HStack>
                                                </VStack>
                                            </Box>
                                        </Collapse>
                                    </VStack>
                                </Box>
                            ))}

                            {/* 버전 비교 결과 */}
                            {comparison && (
                                <Box p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                                    <Text fontSize="lg" fontWeight="bold" mb={3} color="blue.700">
                                        버전 비교 결과 (v{comparison.version1.version} vs v{comparison.version2.version})
                                    </Text>

                                    <VStack spacing={4} align="stretch">
                                        <HStack spacing={4}>
                                            <Box flex={1}>
                                                <Text fontSize="sm" fontWeight="medium" color="blue.600">
                                                    v{comparison.version1.version} ({comparison.version1.editedBy})
                                                </Text>
                                                <Code
                                                    p={2}
                                                    borderRadius="md"
                                                    fontSize="xs"
                                                    whiteSpace="pre-wrap"
                                                    maxH="150px"
                                                    overflowY="auto"
                                                    bg="white"
                                                >
                                                    {comparison.version1.content}
                                                </Code>
                                            </Box>

                                            <Box flex={1}>
                                                <Text fontSize="sm" fontWeight="medium" color="blue.600">
                                                    v{comparison.version2.version} ({comparison.version2.editedBy})
                                                </Text>
                                                <Code
                                                    p={2}
                                                    borderRadius="md"
                                                    fontSize="xs"
                                                    whiteSpace="pre-wrap"
                                                    maxH="150px"
                                                    overflowY="auto"
                                                    bg="white"
                                                >
                                                    {comparison.version2.content}
                                                </Code>
                                            </Box>
                                        </HStack>

                                        <Box p={3} bg="white" borderRadius="md">
                                            <Text fontSize="sm" fontWeight="medium" mb={2}>
                                                변경 사항:
                                            </Text>
                                            <VStack spacing={1} align="stretch">
                                                <Text fontSize="xs">
                                                    • 내용 변경: {comparison.changes.contentChanged ? '예' : '아니오'}
                                                </Text>
                                                <Text fontSize="xs">
                                                    • 길이 변화: {comparison.changes.contentLengthChange > 0 ? '+' : ''}{comparison.changes.contentLengthChange}자
                                                </Text>
                                            </VStack>
                                        </Box>
                                    </VStack>
                                </Box>
                            )}

                            {history.length === 0 && (
                                <Box textAlign="center" py={8}>
                                    <Text color="gray.500">수정 이력이 없습니다.</Text>
                                </Box>
                            )}
                        </VStack>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default CommentHistoryModal;
