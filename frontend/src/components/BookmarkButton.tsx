import React, { useState, useEffect } from 'react';
import {
    IconButton,
    Tooltip,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useToast,
    useColorModeValue
} from '@chakra-ui/react';
import { FiBookmark } from 'react-icons/fi';
import { FaBookmark } from 'react-icons/fa';
import { apiClient } from '../utils/apiClient';

interface BookmarkButtonProps {
    postId: number;
    postTitle?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    showFolderMenu?: boolean;
    onBookmarkChange?: (isBookmarked: boolean) => void;
}

interface Folder {
    id: number;
    name: string;
    color?: string;
    bookmark_count: number;
}

/**
 * 북마크 버튼 컴포넌트
 * 게시물을 북마크/북마크 해제하는 버튼
 */
const BookmarkButton: React.FC<BookmarkButtonProps> = ({
    postId,
    postTitle = '',
    size = 'md',
    showFolderMenu = true,
    onBookmarkChange
}) => {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const toast = useToast();

    const bookmarkedColor = useColorModeValue('yellow.500', 'yellow.400');
    const defaultColor = useColorModeValue('gray.500', 'gray.400');

    // 북마크 상태 확인
    useEffect(() => {
        const checkBookmarkStatus = async () => {
            try {
                setChecking(true);
                const response = await apiClient.get(`/api/bookmarks/check/${postId}`);
                setIsBookmarked(response.isBookmarked || false);
                setCurrentFolder(response.folder);
            } catch (error) {
                console.error('북마크 상태 확인 실패:', error);
            } finally {
                setChecking(false);
            }
        };

        checkBookmarkStatus();
    }, [postId]);

    // 폴더 목록 조회
    const loadFolders = async () => {
        try {
            const response = await apiClient.get('/api/bookmarks/folders');
            setFolders(response.folders || []);
        } catch (error) {
            console.error('폴더 목록 조회 실패:', error);
        }
    };

    // 북마크 추가
    const handleAddBookmark = async (folder: string = 'default') => {
        try {
            setLoading(true);

            await apiClient.post('/api/bookmarks', {
                postId,
                folder
            });

            setIsBookmarked(true);
            setCurrentFolder(folder);
            if (onBookmarkChange) onBookmarkChange(true);

            toast({
                title: '북마크 추가',
                description: `${postTitle || '게시물'}을 ${folder === 'default' ? '기본 폴더' : folder}에 저장했습니다.`,
                status: 'success',
                duration: 3000,
                isClosable: true
            });
        } catch (error: any) {
            console.error('북마크 추가 실패:', error);
            toast({
                title: '오류 발생',
                description: error.response?.data?.error || '북마크 추가 중 오류가 발생했습니다.',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    };

    // 북마크 제거
    const handleRemoveBookmark = async () => {
        try {
            setLoading(true);

            await apiClient.delete(`/api/bookmarks/${postId}`);

            setIsBookmarked(false);
            setCurrentFolder(null);
            if (onBookmarkChange) onBookmarkChange(false);

            toast({
                title: '북마크 제거',
                description: `${postTitle || '게시물'}의 북마크를 제거했습니다.`,
                status: 'info',
                duration: 3000,
                isClosable: true
            });
        } catch (error: any) {
            console.error('북마크 제거 실패:', error);
            toast({
                title: '오류 발생',
                description: error.response?.data?.error || '북마크 제거 중 오류가 발생했습니다.',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    };

    // 토글 처리
    const handleToggle = async () => {
        if (isBookmarked) {
            await handleRemoveBookmark();
        } else {
            await handleAddBookmark();
        }
    };

    // 폴더 메뉴가 있는 경우
    if (showFolderMenu && !isBookmarked) {
        return (
            <Menu onOpen={loadFolders}>
                <Tooltip label={isBookmarked ? '북마크 해제' : '북마크'}>
                    <MenuButton
                        as={IconButton}
                        aria-label={isBookmarked ? '북마크 해제' : '북마크'}
                        icon={isBookmarked ? <FaBookmark /> : <FiBookmark />}
                        size={size}
                        variant="ghost"
                        color={isBookmarked ? bookmarkedColor : defaultColor}
                        isLoading={loading || checking}
                    />
                </Tooltip>
                <MenuList>
                    <MenuItem onClick={() => handleAddBookmark('default')}>
                        기본 폴더에 저장
                    </MenuItem>
                    {folders.map(folder => (
                        <MenuItem
                            key={folder.id}
                            onClick={() => handleAddBookmark(folder.name)}
                        >
                            {folder.name} ({folder.bookmark_count})
                        </MenuItem>
                    ))}
                </MenuList>
            </Menu>
        );
    }

    // 일반 버튼
    return (
        <Tooltip label={isBookmarked ? `북마크 해제 (${currentFolder})` : '북마크'}>
            <IconButton
                aria-label={isBookmarked ? '북마크 해제' : '북마크'}
                icon={isBookmarked ? <FaBookmark /> : <FiBookmark />}
                size={size}
                variant="ghost"
                color={isBookmarked ? bookmarkedColor : defaultColor}
                isLoading={loading || checking}
                onClick={handleToggle}
            />
        </Tooltip>
    );
};

export default BookmarkButton;
