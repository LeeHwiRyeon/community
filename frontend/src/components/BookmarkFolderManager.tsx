import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Heading,
    Button,
    IconButton,
    Input,
    Textarea,
    Badge,
    useColorModeValue,
    Spinner,
    Center,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    FormControl,
    FormLabel,
    Switch,
    Select
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiFolder } from 'react-icons/fi';
import { apiClient } from '../utils/apiClient';

interface Folder {
    id: number;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    is_private: boolean;
    bookmark_count: number;
    created_at: string;
}

/**
 * 북마크 폴더 관리 컴포넌트
 */
const BookmarkFolderManager: React.FC = () => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#3182CE',
        icon: 'bookmark',
        is_private: false
    });

    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    // 폴더 목록 조회
    const fetchFolders = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/bookmarks/folders');
            setFolders(response.folders || []);
        } catch (error) {
            console.error('폴더 목록 조회 실패:', error);
            toast({
                title: '오류 발생',
                description: '폴더 목록을 불러오지 못했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFolders();
    }, []);

    // 폼 초기화
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            color: '#3182CE',
            icon: 'bookmark',
            is_private: false
        });
        setEditingFolder(null);
    };

    // 새 폴더 추가 시작
    const handleStartCreate = () => {
        resetForm();
        onOpen();
    };

    // 폴더 수정 시작
    const handleStartEdit = (folder: Folder) => {
        setEditingFolder(folder);
        setFormData({
            name: folder.name,
            description: folder.description || '',
            color: folder.color || '#3182CE',
            icon: folder.icon || 'bookmark',
            is_private: folder.is_private
        });
        onOpen();
    };

    // 폴더 저장 (생성 또는 수정)
    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast({
                title: '오류',
                description: '폴더 이름을 입력해주세요.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return;
        }

        try {
            if (editingFolder) {
                // 수정
                await apiClient.put(`/api/bookmarks/folders/${editingFolder.id}`, formData);
                toast({
                    title: '폴더 수정',
                    description: '폴더가 수정되었습니다.',
                    status: 'success',
                    duration: 2000,
                    isClosable: true
                });
            } else {
                // 생성
                await apiClient.post('/api/bookmarks/folders', formData);
                toast({
                    title: '폴더 생성',
                    description: '새 폴더가 생성되었습니다.',
                    status: 'success',
                    duration: 2000,
                    isClosable: true
                });
            }

            fetchFolders();
            onClose();
            resetForm();
        } catch (error: any) {
            console.error('폴더 저장 실패:', error);
            toast({
                title: '오류 발생',
                description: error.response?.data?.error || '폴더 저장 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 폴더 삭제
    const handleDelete = async (folder: Folder) => {
        if (folder.name === 'default') {
            toast({
                title: '삭제 불가',
                description: '기본 폴더는 삭제할 수 없습니다.',
                status: 'warning',
                duration: 3000,
                isClosable: true
            });
            return;
        }

        if (!window.confirm(`"${folder.name}" 폴더를 삭제하시겠습니까?\n폴더 내 북마크는 기본 폴더로 이동됩니다.`)) {
            return;
        }

        try {
            await apiClient.delete(`/api/bookmarks/folders/${folder.id}`);
            setFolders(folders.filter(f => f.id !== folder.id));

            toast({
                title: '폴더 삭제',
                description: '폴더가 삭제되었습니다.',
                status: 'info',
                duration: 3000,
                isClosable: true
            });
        } catch (error: any) {
            console.error('폴더 삭제 실패:', error);
            toast({
                title: '오류 발생',
                description: error.response?.data?.error || '폴더 삭제 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    if (loading) {
        return (
            <Center py={10}>
                <Spinner size="xl" />
            </Center>
        );
    }

    return (
        <VStack spacing={4} align="stretch">
            {/* 헤더 */}
            <HStack justify="space-between">
                <Heading size="md">북마크 폴더</Heading>
                <Button
                    leftIcon={<FiPlus />}
                    colorScheme="blue"
                    size="sm"
                    onClick={handleStartCreate}
                >
                    새 폴더
                </Button>
            </HStack>

            {/* 폴더 목록 */}
            {folders.length === 0 ? (
                <Center py={10}>
                    <VStack spacing={3}>
                        <FiFolder size={48} color="gray" />
                        <Text color="gray.500">폴더가 없습니다</Text>
                        <Button
                            leftIcon={<FiPlus />}
                            colorScheme="blue"
                            variant="outline"
                            onClick={handleStartCreate}
                        >
                            첫 폴더 만들기
                        </Button>
                    </VStack>
                </Center>
            ) : (
                <VStack spacing={3} align="stretch">
                    {folders.map(folder => (
                        <Box
                            key={folder.id}
                            p={4}
                            bg={bgColor}
                            borderWidth="1px"
                            borderColor={borderColor}
                            borderRadius="md"
                            borderLeftWidth="4px"
                            borderLeftColor={folder.color || '#3182CE'}
                        >
                            <HStack justify="space-between" align="start">
                                <VStack align="start" flex={1} spacing={1}>
                                    <HStack>
                                        <Text fontWeight="bold" fontSize="lg">
                                            {folder.name}
                                        </Text>
                                        <Badge colorScheme="blue">
                                            {folder.bookmark_count}개
                                        </Badge>
                                        {folder.is_private && (
                                            <Badge colorScheme="purple">비공개</Badge>
                                        )}
                                    </HStack>
                                    {folder.description && (
                                        <Text fontSize="sm" color="gray.600">
                                            {folder.description}
                                        </Text>
                                    )}
                                </VStack>

                                <HStack>
                                    <IconButton
                                        aria-label="폴더 수정"
                                        icon={<FiEdit />}
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleStartEdit(folder)}
                                    />
                                    {folder.name !== 'default' && (
                                        <IconButton
                                            aria-label="폴더 삭제"
                                            icon={<FiTrash2 />}
                                            size="sm"
                                            variant="ghost"
                                            colorScheme="red"
                                            onClick={() => handleDelete(folder)}
                                        />
                                    )}
                                </HStack>
                            </HStack>
                        </Box>
                    ))}
                </VStack>
            )}

            {/* 폴더 생성/수정 모달 */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {editingFolder ? '폴더 수정' : '새 폴더 만들기'}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>폴더 이름</FormLabel>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="예: 나중에 읽기"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>설명</FormLabel>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="폴더 설명 (선택사항)"
                                    rows={3}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>색상</FormLabel>
                                <HStack>
                                    <Input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        width="80px"
                                    />
                                    <Select
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    >
                                        <option value="#3182CE">파란색</option>
                                        <option value="#38A169">초록색</option>
                                        <option value="#D69E2E">노란색</option>
                                        <option value="#E53E3E">빨간색</option>
                                        <option value="#805AD5">보라색</option>
                                        <option value="#DD6B20">주황색</option>
                                    </Select>
                                </HStack>
                            </FormControl>

                            <FormControl>
                                <HStack justify="space-between">
                                    <FormLabel mb={0}>비공개 폴더</FormLabel>
                                    <Switch
                                        isChecked={formData.is_private}
                                        onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                                    />
                                </HStack>
                            </FormControl>

                            <HStack width="100%" justify="flex-end" pt={4}>
                                <Button variant="ghost" onClick={onClose}>
                                    취소
                                </Button>
                                <Button colorScheme="blue" onClick={handleSave}>
                                    {editingFolder ? '수정' : '생성'}
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </VStack>
    );
};

export default BookmarkFolderManager;
