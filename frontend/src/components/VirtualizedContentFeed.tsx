/**
 * ⚡ 가상화된 컨텐츠 피드
 * 
 * 대용량 컨텐츠 목록을 위한 고성능 가상화 스크롤링 컴포넌트
 * 무한 스크롤, 지연 로딩, 메모리 최적화를 지원
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-10-02
 */

import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
    memo,
    Suspense
} from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Skeleton,
    Fab,
    Zoom,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    FixedSizeList as List,
    VariableSizeList,
    areEqual
} from 'react-window';
// react-window-infinite-loader 타입 정의
interface InfiniteLoaderProps {
    isItemLoaded: (index: number) => boolean;
    loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void>;
    itemCount: number;
    children: (props: any) => React.ReactElement;
}
import AutoSizer from 'react-virtualized-auto-sizer';
import {
    KeyboardArrowUp as ScrollTopIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';

// 지연 로딩을 위한 동적 임포트
const EnhancedPostCard = React.lazy(() => import('./EnhancedPostCard'));
const OptimizedPostCard = React.lazy(() => import('./OptimizedPostCard'));

// 스타일드 컴포넌트
const VirtualizedContainer = styled(Box)(({ theme }) => ({
    height: '100vh',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.default,
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(4),
    minHeight: 200,
}));

const ScrollToTopFab = styled(Fab)(({ theme }) => ({
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 1000,
}));

// 인터페이스 정의
interface PostData {
    id: string;
    title: string;
    content: string;
    author: {
        name: string;
        avatar?: string;
        verified?: boolean;
    };
    community?: string;
    timestamp?: string;
    stats?: {
        views: number;
        likes: number;
        comments: number;
    };
    metadata: {
        created_at: string;
        views: number;
        likes: number;
        comments: number;
    };
    aiAnalysis?: {
        sentiment: string;
        quality_score: number;
        trend_score: number;
    };
    thumbnail?: string;
    type: 'enhanced' | 'standard';
}

interface VirtualizedContentFeedProps {
    posts?: PostData[];
    loading?: boolean;
    hasNextPage?: boolean;
    loadNextPage?: () => Promise<void>;
    onPostClick?: (post: PostData) => void;
    itemHeight?: number;
    overscan?: number;
    cacheSize?: number;
    enableVirtualization?: boolean;
    enableInfiniteScroll?: boolean;
    refreshOnMount?: boolean;
}

// 메모화된 포스트 아이템 컴포넌트
const VirtualizedPostItem = memo<{
    index: number;
    style: React.CSSProperties;
    data: {
        posts: PostData[];
        onPostClick?: (post: PostData) => void;
        isItemLoaded: (index: number) => boolean;
        loadMoreItems: () => Promise<void>;
    };
}>(({ index, style, data }) => {
    const { posts, onPostClick, isItemLoaded } = data;
    const post = posts[index];

    // 아이템이 로드되지 않은 경우 스켈레톤 표시
    if (!isItemLoaded(index)) {
        return (
            <div style={style}>
                <Box sx={{ p: 2 }}>
                    <Skeleton variant="rectangular" width="100%" height={200} />
                    <Skeleton variant="text" width="80%" height={30} sx={{ mt: 1 }} />
                    <Skeleton variant="text" width="60%" height={20} sx={{ mt: 0.5 }} />
                </Box>
            </div>
        );
    }

    // 포스트가 없는 경우 로딩 표시
    if (!post) {
        return (
            <div style={style}>
                <LoadingContainer>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ ml: 2 }}>
                        컨텐츠 로딩 중...
                    </Typography>
                </LoadingContainer>
            </div>
        );
    }

    return (
        <div style={style}>
            <Box sx={{ p: 1 }}>
                <Suspense fallback={
                    <Skeleton variant="rectangular" width="100%" height={200} />
                }>
                    {post.type === 'enhanced' ? (
                        <EnhancedPostCard
                            post={post}
                            index={index}
                            onClick={onPostClick}
                        />
                    ) : (
                        <OptimizedPostCard
                            post={post}
                            index={index}
                            onClick={onPostClick}
                        />
                    )}
                </Suspense>
            </Box>
        </div>
    );
}, areEqual);

VirtualizedPostItem.displayName = 'VirtualizedPostItem';

// 무한 스크롤 훅
const useInfiniteScroll = (
    hasNextPage: boolean,
    loadNextPage: () => Promise<void>,
    threshold = 5
) => {
    const [isLoading, setIsLoading] = useState(false);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasNextPage) return;

        setIsLoading(true);
        try {
            await loadNextPage();
        } catch (error) {
            console.error('무한 스크롤 로딩 오류:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasNextPage, loadNextPage]);

    return { loadMore, isLoading };
};

// 성능 모니터링 훅
const usePerformanceMonitoring = () => {
    const [metrics, setMetrics] = useState({
        renderTime: 0,
        memoryUsage: 0,
        scrollFPS: 0,
        cacheHitRate: 0
    });

    const measureRenderTime = useCallback((startTime: number) => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        setMetrics(prev => ({
            ...prev,
            renderTime: Math.round(renderTime * 100) / 100
        }));
    }, []);

    const measureMemoryUsage = useCallback(() => {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            const memoryUsage = Math.round(
                (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
            );

            setMetrics(prev => ({
                ...prev,
                memoryUsage
            }));
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(measureMemoryUsage, 5000);
        return () => clearInterval(interval);
    }, [measureMemoryUsage]);

    return { metrics, measureRenderTime };
};

// 메인 컴포넌트
const VirtualizedContentFeed: React.FC<VirtualizedContentFeedProps> = ({
    posts = [],
    loading = false,
    hasNextPage = false,
    loadNextPage = async () => { },
    onPostClick,
    itemHeight = 300,
    overscan = 5,
    cacheSize = 50,
    enableVirtualization = true,
    enableInfiniteScroll = true,
    refreshOnMount = false
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // 상태 관리
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const listRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 커스텀 훅
    const { loadMore, isLoading: infiniteLoading } = useInfiniteScroll(
        hasNextPage,
        loadNextPage,
        3
    );
    const { metrics, measureRenderTime } = usePerformanceMonitoring();

    // 아이템 로드 상태 관리
    const isItemLoaded = useCallback((index: number) => {
        return !!posts[index];
    }, [posts]);

    // 동적 아이템 높이 계산
    const getItemSize = useCallback((index: number) => {
        const post = posts[index];
        if (!post) return itemHeight;

        // 컨텐츠 길이에 따른 동적 높이 계산
        const baseHeight = 200;
        const contentHeight = Math.min(post.content.length / 5, 100);
        const hasMedia = post.thumbnail ? 150 : 0;

        return baseHeight + contentHeight + hasMedia;
    }, [posts, itemHeight]);

    // 무한 스크롤 로더
    const loadMoreItems = useCallback(async (startIndex: number, stopIndex: number) => {
        if (startIndex >= posts.length - 3 && hasNextPage) {
            await loadMore();
        }
    }, [posts.length, hasNextPage, loadMore]);

    // 스크롤 이벤트 핸들러 (react-window 타입 호환)
    const handleScroll = useCallback((props: any) => {
        const scrollTop = props.scrollTop || 0;
        setShowScrollTop(scrollTop > 1000);

        // 성능 메트릭 업데이트
        const fps = 1000 / 16.67; // 60fps 기준
        // 실제로는 requestAnimationFrame을 사용하여 정확한 FPS 측정
    }, []);

    // 맨 위로 스크롤
    const scrollToTop = useCallback(() => {
        if (listRef.current) {
            listRef.current.scrollToItem(0, 'start');
        }
    }, []);

    // 새로고침
    const handleRefresh = useCallback(async () => {
        if (refreshOnMount && loadNextPage) {
            setError(null);
            try {
                await loadNextPage();
            } catch (err) {
                setError('컨텐츠를 새로고침하는 중 오류가 발생했습니다.');
            }
        }
    }, [refreshOnMount, loadNextPage]);

    // 가상화된 리스트 데이터
    const listData = useMemo(() => ({
        posts,
        onPostClick,
        isItemLoaded,
        loadMoreItems
    }), [posts, onPostClick, isItemLoaded, loadMoreItems]);

    // 렌더링 시간 측정
    useEffect(() => {
        const startTime = performance.now();
        measureRenderTime(startTime);
    });

    // 초기 로드
    useEffect(() => {
        if (refreshOnMount) {
            handleRefresh();
        }
    }, [refreshOnMount, handleRefresh]);

    // 에러 상태
    if (error) {
        return (
            <Alert
                severity="error"
                action={
                    <Fab size="small" onClick={handleRefresh}>
                        <RefreshIcon />
                    </Fab>
                }
                sx={{ m: 2 }}
            >
                {error}
            </Alert>
        );
    }

    // 로딩 상태
    if (loading && posts.length === 0) {
        return (
            <LoadingContainer>
                <CircularProgress size={40} />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    컨텐츠 로딩 중...
                </Typography>
            </LoadingContainer>
        );
    }

    // 빈 상태
    if (!loading && posts.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h6" color="text.secondary">
                    표시할 컨텐츠가 없습니다.
                </Typography>
                <Fab
                    variant="extended"
                    onClick={handleRefresh}
                    sx={{ mt: 2 }}
                >
                    <RefreshIcon sx={{ mr: 1 }} />
                    새로고침
                </Fab>
            </Box>
        );
    }

    return (
        <VirtualizedContainer ref={containerRef}>
            {/* 성능 메트릭 표시 (개발 모드) */}
            {process.env.NODE_ENV === 'development' && (
                <Box sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 1000,
                    bgcolor: 'background.paper',
                    p: 1,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    opacity: 0.8
                }}>
                    <div>렌더: {metrics.renderTime}ms</div>
                    <div>메모리: {metrics.memoryUsage}%</div>
                    <div>아이템: {posts.length}</div>
                </Box>
            )}

            {/* 가상화된 리스트 */}
            <AutoSizer>
                {({ height, width }) => (
                    enableVirtualization ? (
                        <VariableSizeList
                            ref={listRef}
                            height={height}
                            width={width}
                            itemCount={posts.length + (hasNextPage ? 1 : 0)}
                            itemSize={getItemSize}
                            itemData={{
                                posts,
                                onPostClick,
                                isItemLoaded: (index: number) => index < posts.length,
                                loadMoreItems: () => Promise.resolve()
                            }}
                            overscanCount={overscan}
                            onScroll={handleScroll}
                            style={{
                                overflowX: 'hidden',
                                scrollbarWidth: 'thin',
                            }}
                        >
                            {VirtualizedPostItem}
                        </VariableSizeList>
                    ) : (
                        <List
                            ref={listRef}
                            height={height}
                            width={width}
                            itemCount={posts.length}
                            itemSize={itemHeight}
                            itemData={{
                                posts,
                                onPostClick,
                                isItemLoaded: (index: number) => index < posts.length,
                                loadMoreItems: () => Promise.resolve()
                            }}
                            overscanCount={overscan}
                            onScroll={handleScroll}
                        >
                            {VirtualizedPostItem}
                        </List>
                    )
                )}
            </AutoSizer>

            {/* 무한 스크롤 로딩 인디케이터 */}
            {infiniteLoading && (
                <Box sx={{
                    position: 'absolute',
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    p: 2,
                    boxShadow: 2
                }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                        더 많은 컨텐츠 로딩 중...
                    </Typography>
                </Box>
            )}

            {/* 맨 위로 스크롤 버튼 */}
            <Zoom in={showScrollTop}>
                <ScrollToTopFab
                    color="primary"
                    size={isMobile ? "medium" : "large"}
                    onClick={scrollToTop}
                >
                    <ScrollTopIcon />
                </ScrollToTopFab>
            </Zoom>
        </VirtualizedContainer>
    );
};

export default memo(VirtualizedContentFeed);
