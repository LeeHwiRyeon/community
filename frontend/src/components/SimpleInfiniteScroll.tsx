import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';

interface SimpleInfiniteScrollProps<T> {
    items: T[];
    hasNextPage: boolean;
    isLoading: boolean;
    loadNextPage: () => Promise<void>;
    renderItem: (item: T, index: number) => React.ReactElement;
    threshold?: number;
    className?: string;
    loadingComponent?: React.ReactElement;
    endMessage?: React.ReactElement;
}

function SimpleInfiniteScroll<T>({
    items,
    hasNextPage,
    isLoading,
    loadNextPage,
    renderItem,
    threshold = 200,
    className,
    loadingComponent,
    endMessage
}: SimpleInfiniteScrollProps<T>) {
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef<boolean>(false);

    // 스크롤 이벤트 핸들러
    const handleScroll = useCallback(async () => {
        if (!containerRef.current || loadingRef.current || !hasNextPage || isLoading) {
            return;
        }

        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        if (distanceFromBottom < threshold) {
            loadingRef.current = true;
            setIsLoadingMore(true);

            try {
                await loadNextPage();
            } catch (error) {
                console.error('Failed to load next page:', error);
            } finally {
                setIsLoadingMore(false);
                loadingRef.current = false;
            }
        }
    }, [hasNextPage, isLoading, loadNextPage, threshold]);

    // 스크롤 이벤트 리스너 등록
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // 디바운싱된 스크롤 핸들러
        let timeoutId: NodeJS.Timeout;
        const debouncedHandleScroll = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleScroll, 100);
        };

        container.addEventListener('scroll', debouncedHandleScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', debouncedHandleScroll);
            clearTimeout(timeoutId);
        };
    }, [handleScroll]);

    // 수동 로드 버튼 핸들러
    const handleManualLoad = async () => {
        if (loadingRef.current || !hasNextPage || isLoading) return;

        loadingRef.current = true;
        setIsLoadingMore(true);

        try {
            await loadNextPage();
        } catch (error) {
            console.error('Failed to load next page:', error);
        } finally {
            setIsLoadingMore(false);
            loadingRef.current = false;
        }
    };

    // 기본 로딩 컴포넌트
    const defaultLoadingComponent = (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                py: 3,
                gap: 2
            }}
        >
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
                더 많은 콘텐츠를 불러오는 중...
            </Typography>
        </Box>
    );

    // 기본 끝 메시지
    const defaultEndMessage = (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                py: 3
            }}
        >
            <Typography variant="body2" color="text.secondary">
                🎉 모든 콘텐츠를 확인했습니다!
            </Typography>
        </Box>
    );

    return (
        <Box className={className}>
            {/* 스크롤 컨테이너 */}
            <Box
                ref={containerRef}
                sx={{
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#c1c1c1',
                        borderRadius: '4px',
                        '&:hover': {
                            background: '#a8a8a8',
                        },
                    },
                }}
            >
                {/* 아이템 목록 */}
                <Box sx={{ pb: 2 }}>
                    {items.map((item, index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                            {renderItem(item, index)}
                        </Box>
                    ))}
                </Box>

                {/* 로딩 상태 */}
                {(isLoading || isLoadingMore) && (
                    loadingComponent || defaultLoadingComponent
                )}

                {/* 더 보기 버튼 (모바일 친화적) */}
                {!isLoading && !isLoadingMore && hasNextPage && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={handleManualLoad}
                            disabled={isLoadingMore}
                            sx={{
                                minWidth: '200px',
                                py: 1.5,
                                borderRadius: 2,
                                fontWeight: 'bold'
                            }}
                        >
                            더 많은 글 보기
                        </Button>
                    </Box>
                )}

                {/* 끝 메시지 */}
                {!hasNextPage && !isLoading && items.length > 0 && (
                    endMessage || defaultEndMessage
                )}
            </Box>

            {/* 빈 상태 */}
            {items.length === 0 && !isLoading && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 8,
                        textAlign: 'center'
                    }}
                >
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        📝 아직 게시글이 없습니다
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        첫 번째 글을 작성해보세요!
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default SimpleInfiniteScroll;
