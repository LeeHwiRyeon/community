/**
 * MentionInput Component
 * @username 자동완성 기능이 있는 입력 필드
 */

import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import {
    TextField,
    Paper,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Box,
    Typography,
    CircularProgress
} from '@mui/material';
import { searchUsernames } from '../../services/socialService';
import type { UserSearchResult } from '../../types/social';
import './MentionInput.css';

interface MentionInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
    maxRows?: number;
    disabled?: boolean;
    fullWidth?: boolean;
    label?: string;
}

const MentionInput: React.FC<MentionInputProps> = ({
    value,
    onChange,
    placeholder = '내용을 입력하세요...',
    multiline = true,
    rows = 4,
    maxRows,
    disabled = false,
    fullWidth = true,
    label
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [mentionStart, setMentionStart] = useState<number>(-1);
    const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

    /**
     * @ 입력 감지 및 자동완성 트리거
     */
    const handleInputChange = async (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        const cursorPosition = e.target.selectionStart || 0;

        // @ 기호 찾기
        const textBeforeCursor = newValue.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

            // @ 이후 공백이 없고, 유효한 검색어일 때
            if (!textAfterAt.includes(' ') && textAfterAt.length >= 1) {
                setMentionStart(lastAtIndex);
                setLoading(true);

                try {
                    const result = await searchUsernames(textAfterAt, 10);
                    setSuggestions(result.users);
                    setShowSuggestions(result.users.length > 0);
                    setSelectedIndex(0);
                } catch (error) {
                    console.error('Failed to search users:', error);
                    setSuggestions([]);
                    setShowSuggestions(false);
                } finally {
                    setLoading(false);
                }
            } else {
                setShowSuggestions(false);
                setSuggestions([]);
            }
        } else {
            setShowSuggestions(false);
            setSuggestions([]);
        }
    };

    /**
     * 사용자 선택 처리
     */
    const handleSelectUser = (user: UserSearchResult) => {
        if (mentionStart === -1) return;

        const cursorPosition = inputRef.current?.selectionStart || 0;
        const textBeforeMention = value.substring(0, mentionStart);
        const textAfterCursor = value.substring(cursorPosition);

        const newValue = `${textBeforeMention}@${user.username} ${textAfterCursor}`;
        onChange(newValue);

        setShowSuggestions(false);
        setSuggestions([]);
        setMentionStart(-1);

        // 포커스 복원
        setTimeout(() => {
            if (inputRef.current) {
                const newCursorPosition = mentionStart + user.username.length + 2;
                inputRef.current.focus();
                inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
            }
        }, 0);
    };

    /**
     * 키보드 네비게이션 처리
     */
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % suggestions.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
                break;
            case 'Enter':
                if (showSuggestions) {
                    e.preventDefault();
                    handleSelectUser(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setShowSuggestions(false);
                setSuggestions([]);
                break;
        }
    };

    /**
     * 외부 클릭 시 자동완성 닫기
     */
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.mention-input-container')) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <Box className="mention-input-container" sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
            <TextField
                inputRef={inputRef}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                multiline={multiline}
                rows={rows}
                maxRows={maxRows}
                disabled={disabled}
                fullWidth={fullWidth}
                label={label}
                variant="outlined"
                className="mention-input"
            />

            {showSuggestions && (
                <Paper
                    className="mention-suggestions"
                    elevation={4}
                    sx={{
                        position: 'absolute',
                        zIndex: 1000,
                        width: '100%',
                        maxHeight: '300px',
                        overflow: 'auto',
                        mt: 0.5
                    }}
                >
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : (
                        <List>
                            {suggestions.map((user, index) => (
                                <ListItem
                                    key={user.id}
                                    onClick={() => handleSelectUser(user)}
                                    className={`mention-suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'action.hover' },
                                        ...(index === selectedIndex && { bgcolor: 'action.selected' })
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar
                                            src={user.profile_picture}
                                            alt={user.username}
                                        >
                                            {user.username.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body1" component="span">
                                                    @{user.username}
                                                </Typography>
                                                {user.display_name && (
                                                    <Typography variant="body2" color="text.secondary" component="span">
                                                        {user.display_name}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                        secondary={`평판: ${user.reputation.toLocaleString()}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default MentionInput;
