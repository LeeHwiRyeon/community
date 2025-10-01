import React, { useEffect, useRef, ReactNode } from 'react';

interface FocusTrapProps {
    children: ReactNode;
    active: boolean;
    onEscape?: () => void;
    initialFocus?: React.RefObject<HTMLElement>;
}

const FocusTrap: React.FC<FocusTrapProps> = ({
    children,
    active,
    onEscape,
    initialFocus
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!active) return;

        // 현재 포커스된 요소 저장
        previousActiveElement.current = document.activeElement as HTMLElement;

        // 초기 포커스 설정
        if (initialFocus?.current) {
            initialFocus.current.focus();
        } else if (containerRef.current) {
            const focusableElements = containerRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0] as HTMLElement;
            if (firstElement) {
                firstElement.focus();
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && onEscape) {
                onEscape();
                return;
            }

            if (event.key === 'Tab') {
                if (!containerRef.current) return;

                const focusableElements = containerRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );

                const firstElement = focusableElements[0] as HTMLElement;
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                if (event.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstElement) {
                        event.preventDefault();
                        lastElement?.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        event.preventDefault();
                        firstElement?.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);

            // 이전 포커스된 요소로 복원
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
        };
    }, [active, onEscape, initialFocus]);

    if (!active) {
        return <>{children}</>;
    }

    return (
        <div ref={containerRef} style={{ outline: 'none' }}>
            {children}
        </div>
    );
};

export default FocusTrap;
