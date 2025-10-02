import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Typography } from '@mui/material';

interface VirtualizedListProps<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactElement;
    overscan?: number;
    onScroll?: (scrollTop: number) => void;
    className?: string;
}

function VirtualizedList<T>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 5,
    onScroll,
    className
}: VirtualizedListProps<T>) {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // 가시 영역 계산
    const visibleRange = useMemo(() => {
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const endIndex = Math.min(
            items.length - 1,
            Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
        );
        return { startIndex, endIndex };
    }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

    // 가시 영역의 아이템들
    const visibleItems = useMemo(() => {
        const { startIndex, endIndex } = visibleRange;
        return items.slice(startIndex, endIndex + 1).map((item, index) => ({
            item,
            index: startIndex + index,
            style: {
                position: 'absolute' as const,
                top: (startIndex + index) * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
            }
        }));
    }, [items, visibleRange, itemHeight]);

    // 스크롤 핸들러
    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
        const newScrollTop = event.currentTarget.scrollTop;
        setScrollTop(newScrollTop);
        onScroll?.(newScrollTop);
    }, [onScroll]);

    // 총 높이
    const totalHeight = items.length * itemHeight;

    return (
        <Box
            ref={containerRef}
            className={className}
            sx={{
                height: containerHeight,
                overflow: 'auto',
                position: 'relative',
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
            onScroll={handleScroll}
        >
            {/* 전체 높이를 위한 스페이서 */}
            <Box sx={{ height: totalHeight, position: 'relative' }}>
                {/* 가시 영역의 아이템들만 렌더링 */}
                {visibleItems.map(({ item, index, style }) => (
                    <Box key={index} style={style}>
                        {renderItem(item, index, style)}
                    </Box>
                ))}
            </Box>

            {/* 빈 상태 */}
            {items.length === 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        flexDirection: 'column',
                        gap: 2
                    }}
                >
                    <Typography variant="h6" color="text.secondary">
                        📝 표시할 항목이 없습니다
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        새로운 콘텐츠를 기다리고 있어요!
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default VirtualizedList;
