import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { transformPostToArticle, transformApiBoard, translateApiError } from '../utils/dataTransform';
import type { Post, Board } from '../types/api';

interface IntegratedDataProps {
    children: (data: {
        boards: any[];
        articles: any[];
        isLoading: boolean;
        error: string | null;
        refetch: () => void;
    }) => React.ReactNode;
}

export const IntegratedData: React.FC<IntegratedDataProps> = ({ children }) => {
    const [boards, setBoards] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // 게시판 목록 가져오기
            const boardsResponse = await api.boards.getAll();
            if (boardsResponse.error) {
                throw new Error(boardsResponse.error);
            }

            const apiBoards = boardsResponse.data || [];

            // 전체 게시판 추가
            const allBoard = {
                id: 'all',
                name: '전체',
                title: '전체',
                description: '모든 게시판',
                icon: '📋',
                type: 'text',
                color: 'bg-gray-100'
            };

            const transformedBoards = [allBoard, ...apiBoards.map(transformApiBoard)];
            setBoards(transformedBoards);

            // 게시글 맵 가져오기 (모든 게시판의 게시글)
            const postsMapResponse = await api.posts.getMap();
            if (postsMapResponse.error) {
                console.warn('Posts map fetch failed:', postsMapResponse.error);
                // 게시글 맵 실패는 치명적이지 않으므로 빈 배열로 계속 진행
                setArticles([]);
            } else {
                const postsMap = postsMapResponse.data || {};
                const allPosts: any[] = [];

                // 모든 게시판의 게시글을 하나의 배열로 합치기
                Object.keys(postsMap).forEach(boardId => {
                    const boardPosts = postsMap[boardId] || [];
                    const transformedPosts = boardPosts.map((post: Post) =>
                        transformPostToArticle(post, boardId)
                    );
                    allPosts.push(...transformedPosts);
                });

                // 최신순으로 정렬
                allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                setArticles(allPosts);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Data fetch failed';
            setError(translateApiError(errorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return children({
        boards,
        articles,
        isLoading,
        error,
        refetch: fetchData
    });
};

// 개별 게시판 데이터를 가져오는 컴포넌트
interface BoardDataProps {
    boardId: string;
    searchQuery?: string;
    children: (data: {
        posts: any[];
        isLoading: boolean;
        error: string | null;
        refetch: () => void;
    }) => React.ReactNode;
}

export const BoardData: React.FC<BoardDataProps> = ({ boardId, searchQuery, children }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const params = searchQuery ? { q: searchQuery } : undefined;
            const response = await api.posts.getByBoard(boardId, params);

            if (response.error) {
                throw new Error(response.error);
            }

            const apiPosts = response.data || [];
            const transformedPosts = apiPosts.map((post: Post) =>
                transformPostToArticle(post, boardId)
            );

            setPosts(transformedPosts);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Posts fetch failed';
            setError(translateApiError(errorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (boardId && boardId !== 'all') {
            fetchPosts();
        } else {
            // 'all' 게시판인 경우 IntegratedData를 사용
            setIsLoading(false);
            setPosts([]);
        }
    }, [boardId, searchQuery]);

    return children({
        posts,
        isLoading,
        error,
        refetch: fetchPosts
    });
};

// API 상태 확인 컴포넌트
interface ApiStatusProps {
    children: (data: {
        isApiConnected: boolean;
        isLoading: boolean;
        healthData: any;
    }) => React.ReactNode;
}

export const ApiStatus: React.FC<ApiStatusProps> = ({ children }) => {
    const [isApiConnected, setIsApiConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [healthData, setHealthData] = useState<any>(null);

    useEffect(() => {
        const checkApiStatus = async () => {
            try {
                const response = await api.metrics.health(true);
                if (response.data) {
                    setIsApiConnected(true);
                    setHealthData(response.data);
                } else {
                    setIsApiConnected(false);
                }
            } catch (err) {
                setIsApiConnected(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkApiStatus();

        // 30초마다 API 상태 확인
        const interval = setInterval(checkApiStatus, 30000);

        return () => clearInterval(interval);
    }, []);

    return children({
        isApiConnected,
        isLoading,
        healthData
    });
};