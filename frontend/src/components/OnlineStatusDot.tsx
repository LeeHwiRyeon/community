import React, { useEffect, useState } from 'react';
import { Box, Tooltip } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { apiClient } from '../utils/apiClient';

// 펄스 애니메이션
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
`;

const StatusBadge = styled(Box)<{
    status: string;
    size: string;
    showpulse: string;
}>(({ status, size, showpulse }) => {
    const sizeMap = {
        xs: 6,
        sm: 8,
        md: 10,
        lg: 12
    };

    const colorMap = {
        online: '#4CAF50',
        away: '#FFC107',
        busy: '#F44336',
        offline: '#9E9E9E'
    };

    const actualSize = sizeMap[size as keyof typeof sizeMap] || 10;
    const color = colorMap[status as keyof typeof colorMap] || '#9E9E9E';

    return {
        width: actualSize,
        height: actualSize,
        borderRadius: '50%',
        backgroundColor: color,
        border: '2px solid white',
        animation: status === 'online' && showpulse === 'true' ? `${pulse} 2s infinite` : 'none'
    };
});

interface OnlineStatusDotProps {
    userId: number;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    showTooltip?: boolean;
    showPulse?: boolean;
    position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

const OnlineStatusDot: React.FC<OnlineStatusDotProps> = ({
    userId,
    size = 'sm',
    showTooltip = true,
    showPulse = true,
    position = 'bottom-right'
}) => {
    const [status, setStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('offline');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatus();

        // 30초마다 자동 갱신
        const interval = setInterval(loadStatus, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    const loadStatus = async () => {
        try {
            const response = await apiClient.get(`/api/online-status/user/${userId}`);
            if (response.data.success) {
                setStatus(response.data.status || 'offline');
            }
        } catch (error) {
            console.error('온라인 상태 로드 실패:', error);
            setStatus('offline');
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = () => {
        const labels = {
            online: '온라인',
            away: '자리비움',
            busy: '다른 용무 중',
            offline: '오프라인'
        };
        return labels[status];
    };

    const getPositionStyles = () => {
        const positions = {
            'top-right': { top: 0, right: 0 },
            'bottom-right': { bottom: 0, right: 0 },
            'top-left': { top: 0, left: 0 },
            'bottom-left': { bottom: 0, left: 0 }
        };
        return positions[position];
    };

    if (loading) {
        return null;
    }

    const badge = (
        <Box
            sx={{
                position: 'absolute',
                ...getPositionStyles(),
                zIndex: 1
            }}
        >
            <StatusBadge
                status={status}
                size={size}
                showpulse={showPulse ? 'true' : 'false'}
            />
        </Box>
    );

    if (showTooltip) {
        return (
            <Tooltip title={getStatusLabel()} arrow placement="top">
                {badge}
            </Tooltip>
        );
    }

    return badge;
};

export default OnlineStatusDot;
