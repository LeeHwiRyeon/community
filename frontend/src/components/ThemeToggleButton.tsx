import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleButtonProps {
    size?: 'small' | 'medium' | 'large';
    edge?: 'start' | 'end' | false;
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ size = 'medium', edge = false }) => {
    const { mode, toggleTheme } = useTheme();

    return (
        <Tooltip title={mode === 'light' ? '다크 모드' : '라이트 모드'}>
            <IconButton
                onClick={toggleTheme}
                color="inherit"
                size={size}
                edge={edge}
                aria-label="toggle theme"
            >
                {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
        </Tooltip>
    );
};

export default ThemeToggleButton;
