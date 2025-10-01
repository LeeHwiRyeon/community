import React from 'react';
import { Box, BoxProps, VStack } from '@chakra-ui/react';

interface MobileListProps extends BoxProps {
    children: React.ReactNode;
}

interface MobileListItemProps extends BoxProps {
    children: React.ReactNode;
    onClick?: () => void;
    interactive?: boolean;
}

const MobileList: React.FC<MobileListProps> = ({ children, ...props }) => {
    return (
        <Box className="mobile-list" {...props}>
            {children}
        </Box>
    );
};

const MobileListItem: React.FC<MobileListItemProps> = ({
    children,
    onClick,
    interactive = false,
    ...props
}) => {
    return (
        <Box
            className={`mobile-list-item ${interactive ? 'interactive' : ''}`}
            onClick={onClick}
            cursor={interactive ? 'pointer' : 'default'}
            transition="all 0.2s ease"
            _hover={interactive ? {
                backgroundColor: 'gray.50'
            } : {}}
            _active={interactive ? {
                backgroundColor: 'gray.100'
            } : {}}
            {...props}
        >
            {children}
        </Box>
    );
};

export { MobileList, MobileListItem };
