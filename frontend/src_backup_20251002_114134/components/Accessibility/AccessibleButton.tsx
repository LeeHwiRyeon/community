import React, { forwardRef } from 'react';
import { Button, ButtonProps } from '@chakra-ui/react';

interface AccessibleButtonProps extends ButtonProps {
    ariaLabel?: string;
    ariaDescribedBy?: string;
    ariaExpanded?: boolean;
    ariaControls?: string;
    ariaPressed?: boolean;
    ariaCurrent?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
    onKeyDown?: (event: React.KeyboardEvent) => void;
    skipFocus?: boolean;
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
    ({
        children,
        ariaLabel,
        ariaDescribedBy,
        ariaExpanded,
        ariaControls,
        ariaPressed,
        ariaCurrent,
        onKeyDown,
        skipFocus = false,
        tabIndex,
        ...props
    }, ref) => {
        const handleKeyDown = (event: React.KeyboardEvent) => {
            // Enter와 Space 키로 버튼 활성화
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (props.onClick) {
                    props.onClick(event as any);
                }
            }

            // 커스텀 키보드 핸들러 실행
            if (onKeyDown) {
                onKeyDown(event);
            }
        };

        return (
            <Button
                ref={ref}
                aria-label={ariaLabel}
                aria-describedby={ariaDescribedBy}
                aria-expanded={ariaExpanded}
                aria-controls={ariaControls}
                aria-pressed={ariaPressed}
                aria-current={ariaCurrent}
                onKeyDown={handleKeyDown}
                tabIndex={skipFocus ? -1 : tabIndex}
                _focus={{
                    boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.6)',
                    outline: 'none',
                }}
                _focusVisible={{
                    boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.6)',
                }}
                {...props}
            >
                {children}
            </Button>
        );
    }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;