/**
 * Custom hook for drag and drop functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseDragAndDropOptions<T> {
    data: T[];
    onReorder?: (fromIndex: number, toIndex: number) => void;
    onMove?: (item: T, fromIndex: number, toIndex: number) => void;
    onDrop?: (item: T, targetIndex: number) => void;
    dragThreshold?: number;
    disabled?: boolean;
}

export function useDragAndDrop<T>(
    options: UseDragAndDropOptions<T>
): {
    data: T[];
    draggedIndex: number | null;
    draggedOverIndex: number | null;
    isDragging: boolean;
    dragStart: (index: number) => void;
    dragEnd: () => void;
    dragOver: (index: number) => void;
    dragLeave: () => void;
    drop: (index: number) => void;
    reset: () => void;
} {
    const {
        data,
        onReorder,
        onMove,
        onDrop,
        dragThreshold = 5,
        disabled = false,
    } = options;

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);

    const dragRef = useRef<HTMLDivElement>(null);

    const dragStart = useCallback((index: number) => {
        if (disabled) return;

        setDraggedIndex(index);
        setIsDragging(true);
        setDragStartPosition({ x: 0, y: 0 });
    }, [disabled]);

    const dragEnd = useCallback(() => {
        setDraggedIndex(null);
        setDraggedOverIndex(null);
        setIsDragging(false);
        setDragStartPosition(null);
    }, []);

    const dragOver = useCallback((index: number) => {
        if (disabled || !isDragging || draggedIndex === null) return;

        setDraggedOverIndex(index);
    }, [disabled, isDragging, draggedIndex]);

    const dragLeave = useCallback(() => {
        if (disabled || !isDragging) return;

        setDraggedOverIndex(null);
    }, [disabled, isDragging]);

    const drop = useCallback((index: number) => {
        if (disabled || !isDragging || draggedIndex === null) return;

        if (draggedIndex !== index) {
            if (onReorder) {
                onReorder(draggedIndex, index);
            }

            if (onMove) {
                onMove(data[draggedIndex], draggedIndex, index);
            }

            if (onDrop) {
                onDrop(data[draggedIndex], index);
            }
        }

        dragEnd();
    }, [disabled, isDragging, draggedIndex, onReorder, onMove, onDrop, data, dragEnd]);

    const reset = useCallback(() => {
        setDraggedIndex(null);
        setDraggedOverIndex(null);
        setIsDragging(false);
        setDragStartPosition(null);
    }, []);

    // Handle mouse events
    useEffect(() => {
        if (!isDragging || !dragRef.current) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!dragStartPosition) return;

            const deltaX = Math.abs(e.clientX - dragStartPosition.x);
            const deltaY = Math.abs(e.clientY - dragStartPosition.y);

            if (deltaX > dragThreshold || deltaY > dragThreshold) {
                // Drag has started
                if (!isDragging) {
                    setIsDragging(true);
                }
            }
        };

        const handleMouseUp = () => {
            dragEnd();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStartPosition, dragThreshold, dragEnd]);

    return {
        data,
        draggedIndex,
        draggedOverIndex,
        isDragging,
        dragStart,
        dragEnd,
        dragOver,
        dragLeave,
        drop,
        reset,
    };
}

export default useDragAndDrop;
