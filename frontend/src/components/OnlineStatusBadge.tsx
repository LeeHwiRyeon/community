import React from 'react';
import { Box, Tooltip, useColorModeValue } from '@chakra-ui/react';

interface OnlineStatusBadgeProps {
    isOnline: boolean;
    status?: 'online' | 'away' | 'busy' | 'offline';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    showTooltip?: boolean;
    position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

const statusColors = {
    online: 'green.500',
    away: 'yellow.500',
    busy: 'red.500',
    offline: 'gray.400'
};

const statusLabels = {
    online: '온라인',
    away: '자리 비움',
    busy: '다른 용무 중',
    offline: '오프라인'
};

const sizeMap = {
    xs: '6px',
    sm: '8px',
    md: '10px',
    lg: '12px'
};

const positionStyles = {
    'top-right': { top: 0, right: 0 },
    'bottom-right': { bottom: 0, right: 0 },
    'top-left': { top: 0, left: 0 },
    'bottom-left': { bottom: 0, left: 0 }
};

/**
 * 온라인 상태 뱃지 컴포넌트
 * 
 * @example
 * ```tsx
 * <Box position="relative">
 *   <Avatar src={user.avatar} />
 *   <OnlineStatusBadge isOnline={user.isOnline} status={user.status} />
 * </Box>
 * ```
 */
const OnlineStatusBadge: React.FC<OnlineStatusBadgeProps> = ({
    isOnline,
    status = isOnline ? 'online' : 'offline',
    size = 'md',
    showTooltip = true,
    position = 'bottom-right'
}) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const badgeSize = sizeMap[size];
    const color = statusColors[status];
    const label = statusLabels[status];
    const posStyle = positionStyles[position];

    const badge = (
        <Box
            position="absolute"
            {...posStyle}
            w={badgeSize}
            h={badgeSize}
            borderRadius="full"
            bg={color}
            border="2px solid"
            borderColor={bgColor}
            zIndex={1}
            transition="all 0.2s"
            _after={
                isOnline && status === 'online'
                    ? {
                        content: '""',
                        position: 'absolute',
                        top: '-25%',
                        left: '-25%',
                        right: '-25%',
                        bottom: '-25%',
                        borderRadius: 'full',
                        bg: color,
                        opacity: 0.3,
                        animation: 'pulse 2s ease-in-out infinite'
                    }
                    : undefined
            }
        />
    );

    if (!showTooltip) {
        return badge;
    }

    return (
        <Tooltip label={label} placement="top" hasArrow>
            {badge}
        </Tooltip>
    );
};

export default OnlineStatusBadge;
