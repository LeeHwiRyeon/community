import React from 'react';
import {
    IconButton,
    useColorMode,
    useColorModeValue,
    Tooltip,
    Box,
    Text,
    HStack,
    Switch,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
    variant?: 'icon' | 'switch' | 'button';
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
    variant = 'icon',
    showLabel = false,
    size = 'md',
}) => {
    const { colorMode, toggleColorMode, isDark } = useTheme();
    const { toggleColorMode: chakraToggle } = useColorMode();

    const handleToggle = () => {
        toggleColorMode();
        chakraToggle();
    };

    const icon = useColorModeValue(<SunIcon />, <MoonIcon />);
    const label = useColorModeValue('다크 모드', '라이트 모드');
    const tooltipLabel = useColorModeValue('다크 모드로 전환', '라이트 모드로 전환');

    if (variant === 'switch') {
        return (
            <HStack spacing={3}>
                <Text fontSize="sm" color="gray.500">
                    {isDark ? '다크' : '라이트'}
                </Text>
                <Switch
                    isChecked={isDark}
                    onChange={handleToggle}
                    colorScheme="brand"
                    size={size}
                />
                {showLabel && (
                    <Text fontSize="sm" color="gray.500">
                        모드
                    </Text>
                )}
            </HStack>
        );
    }

    if (variant === 'button') {
        return (
            <Box
                as="button"
                onClick={handleToggle}
                p={3}
                borderRadius="md"
                bg={useColorModeValue('gray.100', 'gray.700')}
                _hover={{
                    bg: useColorModeValue('gray.200', 'gray.600'),
                    transform: 'translateY(-1px)',
                }}
                transition="all 0.2s"
                cursor="pointer"
                display="flex"
                alignItems="center"
                gap={2}
            >
                {icon}
                {showLabel && (
                    <Text fontSize="sm" fontWeight="medium">
                        {label}
                    </Text>
                )}
            </Box>
        );
    }

    return (
        <Tooltip label={tooltipLabel} placement="bottom">
            <IconButton
                aria-label={tooltipLabel}
                icon={icon}
                onClick={handleToggle}
                size={size}
                variant="ghost"
                _hover={{
                    bg: useColorModeValue('gray.100', 'gray.700'),
                    transform: 'scale(1.1)',
                }}
                _active={{
                    transform: 'scale(0.95)',
                }}
                transition="all 0.2s"
            />
        </Tooltip>
    );
};

export default ThemeToggle;
