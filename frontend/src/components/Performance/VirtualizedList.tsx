import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useVirtualization } from '../../hooks/usePerformanceOptimization';

interface VirtualizedListProps<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * 📊 가상화된 리스트 컴포넌트
 * 
 * 대량의 데이터를 효율적으로 렌더링
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */
function VirtualizedList<T>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    className = '',
    style = {}
}: VirtualizedListProps<T>) {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // 가상화 로직
    const visibleItems = useMemo(() => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(
            startIndex + Math.ceil(containerHeight / itemHeight) + 1,
            items.length
        );

        return items.slice(startIndex, endIndex).map((item, index) => ({
            item,
            index: startIndex + index,
            top: (startIndex + index) * itemHeight
        }));
    }, [items, itemHeight, containerHeight, scrollTop]);

    const totalHeight = items.length * itemHeight;

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    return (
        <div
            ref={containerRef}
            className={`virtualized-list ${className}`}
            style={{
                height: containerHeight,
                overflow: 'auto',
                position: 'relative',
                ...style
            }}
            onScroll={handleScroll}
        >
            {/* 전체 높이를 위한 스페이서 */}
            <div style={{ height: totalHeight, position: 'relative' }}>
                {/* 보이는 아이템들만 렌더링 */}
                {visibleItems.map(({ item, index, top }) => (
                    <div
                        key={index}
                        style={{
                            position: 'absolute',
                            top,
                            left: 0,
                            right: 0,
                            height: itemHeight
                        }}
                    >
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default VirtualizedList;
