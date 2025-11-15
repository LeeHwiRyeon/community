import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Heading,
    Select,
    Badge,
    Avatar,
    Button,
    IconButton,
    Textarea,
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
    useDisclosure
} from '@chakra-ui/react';
import { FiTrash2, FiEdit, FiExternalLink, FiMessageSquare, FiEye, FiTrendingUp } from 'react-icons/fi';
import { apiClient } from '../utils/apiClient';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Bookmark {
    bookmark_id: number;
    post_id: number;
    folder: string;
    notes: string;
    bookmarked_at: string;
    post_title: string;
    post_content: string;
    author_id: number;
    author_username: string;
    author_display_name: string;
    author_avatar?: string;
    board_id: number;
    board_name: string;
    post_created_at: string;
    view_count: number;
    upvotes: number;
    downvotes: number;
    comment_count: number;
}

interface Folder {
    id: number;
    name: string;
    description?: string;
    color?: string;
    bookmark_count: number;
}

/**
 * 북마크 목록 컴포넌트
 */
const BookmarkList: React.FC = () => {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [editingNotes, setEditingNotes] = useState<number | null>(null);
    const [notesText, setNotesText] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const navigate = useNavigate();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const hoverBg = useColorModeValue('gray.50', 'gray.700');

    // 폴더 목록 조회
    const fetchFolders = async () => {
        try {
            const response = await apiClient.get('/api/bookmarks/folders');
            setFolders(response.folders || []);
        } catch (error) {
            console.error('폴더 목록 조회 실패:', error);
        }
    };

    // 북마크 목록 조회
    const fetchBookmarks = async (pageNum: number = 1, folder: string = '') => {
        try {
            setLoading(true);
            const folderParam = folder ? `&folder=${folder}` : '';
            const response = await apiClient.get(`/api/bookmarks?page=${pageNum}&limit=20${folderParam}`);

            if (pageNum === 1) {
                setBookmarks(response.bookmarks || []);
            } else {
                setBookmarks(prev => [...prev, ...(response.bookmarks || [])]);
            }

            setHasMore(response.bookmarks?.length === 20);
        } catch (error) {
            console.error('북마크 목록 조회 실패:', error);
            toast({
                title: '오류 발생',
                description: '북마크 목록을 불러오지 못했습니다.',
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
        fetchBookmarks(1, selectedFolder);
    }, [selectedFolder]);

    // 폴더 변경
    const handleFolderChange = (folder: string) => {
        setSelectedFolder(folder);
        setPage(1);
    };

    // 더 보기
    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchBookmarks(nextPage, selectedFolder);
    };

    // 북마크 삭제
    const handleDeleteBookmark = async (bookmarkId: number, postId: number, postTitle: string) => {
        if (!window.confirm(`"${postTitle}" 북마크를 삭제하시겠습니까?`)) {
            return;
        }

        try {
            await apiClient.delete(`/api/bookmarks/${postId}`);
            setBookmarks(bookmarks.filter(b => b.bookmark_id !== bookmarkId));

            toast({
                title: '북마크 삭제',
                description: '북마크가 삭제되었습니다.',
                status: 'info',
                duration: 3000,
                isClosable: true
            });
        } catch (error) {
            console.error('북마크 삭제 실패:', error);
            toast({
                title: '오류 발생',
                description: '북마크 삭제 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 메모 수정 시작
    const handleStartEditNotes = (bookmarkId: number, currentNotes: string) => {
        setEditingNotes(bookmarkId);
        setNotesText(currentNotes || '');
        onOpen();
    };

    // 메모 저장
    const handleSaveNotes = async () => {
        if (editingNotes === null) return;

        try {
            await apiClient.put(`/api/bookmarks/${editingNotes}/notes`, {
                notes: notesText
            });

            setBookmarks(bookmarks.map(b =>
                b.bookmark_id === editingNotes
                    ? { ...b, notes: notesText }
                    : b
            ));

            toast({
                title: '메모 저장',
                description: '메모가 저장되었습니다.',
                status: 'success',
                duration: 2000,
                isClosable: true
            });

            onClose();
        } catch (error) {
            console.error('메모 저장 실패:', error);
            toast({
                title: '오류 발생',
                description: '메모 저장 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 북마크 카드 렌더링
    const renderBookmarkCard = (bookmark: Bookmark) => (
        <Box
            key={bookmark.bookmark_id}
            p={4}
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
            _hover={{ bg: hoverBg, shadow: 'md' }}
            transition="all 0.2s"
        >
            <VStack align="stretch" spacing={3}>
                {/* 헤더 */}
                <HStack justify="space-between">
                    <HStack spacing={2}>
                        <Avatar
                            size="sm"
                            name={bookmark.author_display_name || bookmark.author_username}
                            src={bookmark.author_avatar}
                        />
                        <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" fontSize="sm">
                                {bookmark.author_display_name || bookmark.author_username}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                {format(new Date(bookmark.bookmarked_at), 'PPp', { locale: ko })}
                            </Text>
                        </VStack>
                    </HStack>

                    <HStack>
                        <Badge colorScheme="blue">{bookmark.board_name}</Badge>
                        <Badge>{bookmark.folder}</Badge>
                    </HStack>
                </HStack>

                {/* 제목 & 내용 */}
                <VStack align="start" spacing={1} cursor="pointer" onClick={() => navigate(`/posts/${bookmark.post_id}`)}>
                    <Heading size="sm" noOfLines={2}>
                        {bookmark.post_title}
                    </Heading>
                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                        {bookmark.post_content.replace(/<[^>]*>/g, '')}
                    </Text>
                </VStack>

                {/* 메모 */}
                {bookmark.notes && (
                    <Box p={2} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                        <Text fontSize="sm" fontStyle="italic" noOfLines={3}>
                            💭 {bookmark.notes}
                        </Text>
                    </Box>
                )}

                {/* 통계 & 액션 */}
                <HStack justify="space-between">
                    <HStack spacing={4} fontSize="sm" color="gray.500">
                        <HStack spacing={1}>
                            <FiEye />
                            <Text>{bookmark.view_count}</Text>
                        </HStack>
                        <HStack spacing={1}>
                            <FiTrendingUp color="green" />
                            <Text>{bookmark.upvotes}</Text>
                        </HStack>
                        <HStack spacing={1}>
                            <FiMessageSquare />
                            <Text>{bookmark.comment_count}</Text>
                        </HStack>
                    </HStack>

                    <HStack>
                        <IconButton
                            aria-label="메모 편집"
                            icon={<FiEdit />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEditNotes(bookmark.bookmark_id, bookmark.notes)}
                        />
                        <IconButton
                            aria-label="게시물 보기"
                            icon={<FiExternalLink />}
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/posts/${bookmark.post_id}`)}
                        />
                        <IconButton
                            aria-label="북마크 삭제"
                            icon={<FiTrash2 />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDeleteBookmark(bookmark.bookmark_id, bookmark.post_id, bookmark.post_title)}
                        />
                    </HStack>
                </HStack>
            </VStack>
        </Box>
    );

    if (loading && page === 1) {
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
                <Heading size="md">북마크</Heading>
                <Select
                    value={selectedFolder}
                    onChange={(e) => handleFolderChange(e.target.value)}
                    maxW="200px"
                >
                    <option value="">전체 폴더</option>
                    {folders.map(folder => (
                        <option key={folder.id} value={folder.name}>
                            {folder.name} ({folder.bookmark_count})
                        </option>
                    ))}
                </Select>
            </HStack>

            {/* 북마크 목록 */}
            {bookmarks.length === 0 ? (
                <Center py={10}>
                    <VStack spacing={3}>
                        <Text color="gray.500" fontSize="lg">
                            북마크가 없습니다
                        </Text>
                        <Text color="gray.400" fontSize="sm">
                            관심 있는 게시물을 북마크해보세요!
                        </Text>
                    </VStack>
                </Center>
            ) : (
                <>
                    <VStack spacing={3} align="stretch">
                        {bookmarks.map(renderBookmarkCard)}
                    </VStack>

                    {hasMore && (
                        <Center>
                            <Button
                                onClick={handleLoadMore}
                                isLoading={loading}
                                variant="outline"
                                colorScheme="blue"
                            >
                                더 보기
                            </Button>
                        </Center>
                    )}
                </>
            )}

            {/* 메모 편집 모달 */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>북마크 메모</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4}>
                            <Textarea
                                value={notesText}
                                onChange={(e) => setNotesText(e.target.value)}
                                placeholder="메모를 입력하세요..."
                                rows={5}
                            />
                            <HStack width="100%" justify="flex-end">
                                <Button variant="ghost" onClick={onClose}>
                                    취소
                                </Button>
                                <Button colorScheme="blue" onClick={handleSaveNotes}>
                                    저장
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </VStack>
    );
};

export default BookmarkList;
