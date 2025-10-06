/**
 * 가상화 스크롤 컴포넌트 (v1.3 성능 최적화)
 * 대용량 메시지 목록을 효율적으로 렌더링
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Box, CircularProgress, Typography } from '@mui/material';

export interface VirtualScrollProps<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (props: { index: number; style: React.CSSProperties; item: T }) => React.ReactNode;
    onLoadMore?: () => void;
    hasNextPage?: boolean;
    isLoading?: boolean;
    overscanCount?: number;
    className?: string;
}

export interface VirtualScrollItemProps {
    index: number;
    style: React.CSSProperties;
    data: {
        items: any[];
        renderItem: (props: { index: number; style: React.CSSProperties; item: any }) => React.ReactNode;
    };
}

/**
 * 가상화 스크롤 컴포넌트
 */
export const VirtualScroll = <T,>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    onLoadMore,
    hasNextPage = false,
    isLoading = false,
    overscanCount = 5,
    className
}: VirtualScrollProps<T>) => {
    const listRef = useRef<List>(null);
    const [isNearBottom, setIsNearBottom] = useState(true);

    // 아이템 데이터 준비
    const itemData = useMemo(() => ({
        items,
        renderItem
    }), [items, renderItem]);

    // 스크롤 이벤트 처리
    const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }: any) => {
        if (!scrollUpdateWasRequested) {
            const isAtBottom = scrollOffset + containerHeight >= items.length * itemHeight - 100;
            setIsNearBottom(isAtBottom);

            // 하단 근처에서 더 많은 데이터 로드
            if (isAtBottom && hasNextPage && !isLoading && onLoadMore) {
                onLoadMore();
            }
        }
    }, [items.length, itemHeight, containerHeight, hasNextPage, isLoading, onLoadMore]);

    // 아이템 렌더러
    const ItemRenderer = useCallback(({ index, style, data }: VirtualScrollItemProps) => {
        const item = data.items[index];
        if (!item) {
            return (
                <div style={style}>
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress size={24} />
                    </Box>
                </div>
            );
        }

        return (
            <div style={style}>
                {data.renderItem({ index, style: {}, item })}
            </div>
        );
    }, []);

    // 로딩 인디케이터
    const LoadingIndicator = useCallback(() => {
        if (!isLoading) return null;

        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                py={2}
                className="loading-indicator"
            >
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                    더 많은 메시지를 불러오는 중...
                </Typography>
            </Box>
        );
    }, [isLoading]);

    return (
        <Box className={className} position="relative">
            <List
                ref={listRef}
                height={containerHeight}
                width="100%"
                itemCount={items.length}
                itemSize={itemHeight}
                itemData={itemData}
                onScroll={handleScroll}
                overscanCount={overscanCount}
                className="virtual-scroll-list"
            >
                {ItemRenderer}
            </List>

            {/* 로딩 인디케이터 */}
            <LoadingIndicator />

            {/* 하단 여백 (스크롤 여유 공간) */}
            {hasNextPage && (
                <Box height={50} />
            )}
        </Box>
    );
};

/**
 * 채팅 메시지용 가상화 스크롤 훅
 */
export const useVirtualChatScroll = (messages: any[], containerHeight: number = 400) => {
    const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [scrollToIndex, setScrollToIndex] = useState<number | null>(null);

    // 메시지 로딩 시뮬레이션 (실제로는 API 호출)
    const loadMoreMessages = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);

        // 실제 구현에서는 API 호출
        setTimeout(() => {
            const newMessages = messages.slice(visibleMessages.length, visibleMessages.length + 20);
            setVisibleMessages(prev => [...prev, ...newMessages]);
            setHasMore(visibleMessages.length + newMessages.length < messages.length);
            setIsLoading(false);
        }, 500);
    }, [messages, visibleMessages.length, isLoading, hasMore]);

    // 초기 메시지 로드
    useEffect(() => {
        if (messages.length > 0 && visibleMessages.length === 0) {
            const initialMessages = messages.slice(-50); // 최근 50개 메시지
            setVisibleMessages(initialMessages);
            setHasMore(messages.length > 50);
        }
    }, [messages]);

    // 새 메시지 추가 시 자동 스크롤
    const addNewMessage = useCallback((message: any) => {
        setVisibleMessages(prev => [...prev, message]);
        setScrollToIndex(visibleMessages.length);
    }, [visibleMessages.length]);

    // 메시지 렌더러
    const renderMessage = useCallback(({ index, style, item }: any) => {
        return (
            <div style={style} className="chat-message-item">
                {/* 실제 메시지 컴포넌트 렌더링 */}
                <Box p={1} borderBottom="1px solid #eee">
                    <Typography variant="body2" color="text.secondary">
                        {item.username}
                    </Typography>
                    <Typography variant="body1">
                        {item.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(item.timestamp).toLocaleTimeString()}
                    </Typography>
                </Box>
            </div>
        );
    }, []);

    return {
        visibleMessages,
        hasMore,
        isLoading,
        loadMoreMessages,
        addNewMessage,
        renderMessage,
        scrollToIndex,
        setScrollToIndex
    };
};

/**
 * 성능 최적화된 채팅 메시지 리스트
 */
export const OptimizedChatList: React.FC<{
    messages: any[];
    height?: number;
    onLoadMore?: () => void;
}> = ({ messages, height = 400, onLoadMore }) => {
    const {
        visibleMessages,
        hasMore,
        isLoading,
        loadMoreMessages,
        renderMessage
    } = useVirtualChatScroll(messages, height);

    return (
        <VirtualScroll
            items={visibleMessages}
            itemHeight={80}
            containerHeight={height}
            renderItem={renderMessage}
            onLoadMore={onLoadMore || loadMoreMessages}
            hasNextPage={hasMore}
            isLoading={isLoading}
            overscanCount={10}
            className="optimized-chat-list"
        />
    );
};

export default VirtualScroll;
