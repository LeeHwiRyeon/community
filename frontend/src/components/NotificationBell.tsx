/**
 * NotificationBell Component
 * 헤더에 표시되는 알림 벨 아이콘 (배지 포함)
 * 
 * @author AUTOAGENTS
 * @date 2025-11-09
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    IconButton,
    Badge,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Box,
    Tooltip,
    useColorModeValue
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationCenter from './NotificationCenter';

interface NotificationBellProps {
    /** 아이콘 크기 */
    size?: 'sm' | 'md' | 'lg';
    /** 커스텀 스타일 */
    variant?: 'ghost' | 'outline' | 'solid';
}

const NotificationBell: React.FC<NotificationBellProps> = ({
    size = 'md',
    variant = 'ghost'
}) => {
    const { unreadCount, isConnected } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const bellRef = useRef<HTMLButtonElement>(null);

    // 색상 테마
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const badgeColor = useColorModeValue('red.500', 'red.400');
    const iconColor = useColorModeValue('gray.600', 'gray.300');
    const hoverBg = useColorModeValue('gray.100', 'gray.700');

    // 새 알림이 올 때 애니메이션
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        if (unreadCount > 0 && !isOpen) {
            setIsShaking(true);
            const timer = setTimeout(() => setIsShaking(false), 500);
            return () => clearTimeout(timer);
        }
    }, [unreadCount, isOpen]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <Popover
            isOpen={isOpen}
            onClose={handleClose}
            placement="bottom-end"
            closeOnBlur={true}
            isLazy
        >
            <PopoverTrigger>
                <Tooltip
                    label={isConnected ? '알림' : '연결 끊김'}
                    placement="bottom"
                >
                    <IconButton
                        ref={bellRef}
                        aria-label="알림"
                        icon={
                            <Badge
                                colorScheme="red"
                                variant="solid"
                                position="absolute"
                                top="-1"
                                right="-1"
                                fontSize="0.7em"
                                borderRadius="full"
                                display={unreadCount > 0 ? 'flex' : 'none'}
                                minWidth="18px"
                                height="18px"
                                alignItems="center"
                                justifyContent="center"
                            >
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                        }
                        size={size}
                        variant={variant}
                        onClick={handleToggle}
                        position="relative"
                        color={iconColor}
                        _hover={{ bg: hoverBg }}
                        sx={{
                            animation: isShaking ? 'shake 0.5s ease-in-out' : 'none',
                            '@keyframes shake': {
                                '0%, 100%': { transform: 'rotate(0deg)' },
                                '10%, 30%, 50%, 70%, 90%': { transform: 'rotate(-10deg)' },
                                '20%, 40%, 60%, 80%': { transform: 'rotate(10deg)' }
                            }
                        }}
                    >
                        <BellIcon w={5} h={5} />
                    </IconButton>
                </Tooltip>
            </PopoverTrigger>

            <PopoverContent
                bg={bgColor}
                borderColor={borderColor}
                boxShadow="xl"
                width="400px"
                maxWidth="calc(100vw - 32px)"
                p={0}
                overflow="hidden"
            >
                <NotificationCenter onClose={handleClose} />
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell;
