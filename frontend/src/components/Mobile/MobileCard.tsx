import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

interface MobileCardProps extends BoxProps {
    children: React.ReactNode;
    onClick?: () => void;
    interactive?: boolean;
}

const MobileCard: React.FC<MobileCardProps> = ({
    children,
    onClick,
    interactive = false,
    ...props
}) => {
    return (
        <Box
            className={`mobile-card ${interactive ? 'interactive' : ''}`}
            onClick={onClick}
            cursor={interactive ? 'pointer' : 'default'}
            transition="all 0.2s ease"
            _hover={interactive ? {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            } : {}}
            _active={interactive ? {
                transform: 'translateY(0)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            } : {}}
            {...props}
        >
            {children}
        </Box>
    );
};

export default MobileCard;
