import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Paper,
    InputAdornment,
    Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';

interface DMMessageInputProps {
    onSend: (content: string, attachment?: any) => void;
    onTyping: (isTyping: boolean) => void;
}

const DMMessageInput: React.FC<DMMessageInputProps> = ({ onSend, onTyping }) => {
    const [message, setMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(event.target.value);

        // 타이핑 상태 전송
        onTyping(true);

        // 타이핑 상태 자동 해제 (3초 후)
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
        }, 3000);
    };

    const handleSend = async () => {
        if (!message.trim() && !attachment) {
            return;
        }

        let attachmentData = null;

        if (attachment) {
            // 실제 환경에서는 파일 업로드 API를 호출해야 합니다
            // 여기서는 간단한 예시로 구현
            attachmentData = {
                url: URL.createObjectURL(attachment),
                name: attachment.name,
                size: attachment.size,
                type: attachment.type,
            };
        }

        onSend(message, attachmentData);

        // 입력 필드 초기화
        setMessage('');
        setAttachment(null);
        onTyping(false);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAttachment(file);
        }
    };

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <Paper elevation={0} sx={{ p: 2 }}>
            {attachment && (
                <Box sx={{ mb: 1, p: 1, backgroundColor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                        첨부파일: {attachment.name}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={() => setAttachment(null)}
                        sx={{ ml: 1 }}
                    >
                        ✕
                    </IconButton>
                </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf,.doc,.docx,.txt"
                />

                <IconButton
                    color="primary"
                    onClick={handleAttachClick}
                    sx={{ mb: 0.5 }}
                >
                    <AttachFileIcon />
                </IconButton>

                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="메시지를 입력하세요..."
                    value={message}
                    onChange={handleMessageChange}
                    onKeyPress={handleKeyPress}
                    variant="outlined"
                    size="small"
                    inputProps={{ 'data-testid': 'dm-input' }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        // 이모지 피커 구현 (향후 추가)
                                        console.log('Emoji picker');
                                    }}
                                >
                                    <EmojiEmotionsIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <IconButton
                    color="primary"
                    onClick={handleSend}
                    disabled={!message.trim() && !attachment}
                    sx={{ mb: 0.5 }}
                    data-testid="dm-send-button"
                >
                    <SendIcon />
                </IconButton>
            </Box>
        </Paper>
    );
};

export default DMMessageInput;
