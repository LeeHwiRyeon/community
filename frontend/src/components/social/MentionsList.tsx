/**
 * MentionsList Component
 * 사용자가 받은 멘션 목록을 표시
 */

import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Button,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Chip,
    CircularProgress,
    Alert,
    Pagination
} from '@mui/material';
import { CheckCircle, Article, Comment } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import {
    getMentions,
    markMentionAsRead,
    markAllMentionsAsRead
} from '../../services/socialService';
import type { Mention } from '../../types/social';
import './MentionsList.css';

interface MentionsListProps {
    pageSize?: number;
}

const MentionsList: React.FC<MentionsListProps> = ({ pageSize = 20 }) => {
    const [mentions, setMentions] = useState<Mention[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    /**
     * 멘션 목록 로드
     */
    const loadMentions = async (page: number) => {
        setLoading(true);
        setError(null);

        try {
            const offset = (page - 1) * pageSize;
            const result = await getMentions(pageSize, offset);

            setMentions(result.mentions);
            setTotal(result.total);
            setHasMore(result.hasMore);
        } catch (err) {
            console.error('Failed to load mentions:', err);
            setError('멘션 목록을 불러오는 데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMentions(currentPage);
    }, [currentPage]);

    /**
     * 멘션 읽음 처리
     */
    const handleMarkAsRead = async (mentionId: number) => {
        try {
            await markMentionAsRead(mentionId);

            // 로컬 상태 업데이트
            setMentions(prevMentions =>
                prevMentions.map(mention =>
                    mention.id === mentionId
                        ? { ...mention, is_read: true, read_at: new Date().toISOString() }
                        : mention
                )
            );
        } catch (err) {
            console.error('Failed to mark mention as read:', err);
        }
    };

    /**
     * 모든 멘션 읽음 처리
     */
    const handleMarkAllAsRead = async () => {
        try {
            await markAllMentionsAsRead();

            // 로컬 상태 업데이트
            setMentions(prevMentions =>
                prevMentions.map(mention => ({
                    ...mention,
                    is_read: true,
                    read_at: new Date().toISOString()
                }))
            );
        } catch (err) {
            console.error('Failed to mark all mentions as read:', err);
        }
    };

    /**
     * 페이지 변경
     */
    const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };

    /**
     * 멘션 타입에 따른 링크 생성
     */
    const getMentionLink = (mention: Mention) => {
        if (mention.post_id) {
            return `/posts/${mention.post_id}`;
        } else if (mention.comment_id) {
            return `/comments/${mention.comment_id}`;
        }
        return '#';
    };

    /**
     * 멘션 타입에 따른 아이콘
     */
    const getMentionIcon = (mention: Mention) => {
        return mention.post_id ? <Article /> : <Comment />;
    };

    /**
     * 시간 포맷팅
     */
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;

        return date.toLocaleDateString('ko-KR');
    };

    const totalPages = Math.ceil(total / pageSize);
    const unreadCount = mentions.filter(m => !m.is_read).length;

    if (loading && mentions.length === 0) {
        return (
            <Box className="mentions-list-loading">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box className="mentions-list-container">
            <Card className="mentions-list-card">
                <CardContent>
                    <Box className="mentions-list-header">
                        <Typography variant="h5" component="h2" gutterBottom>
                            멘션
                        </Typography>
                        {unreadCount > 0 && (
                            <Box className="mentions-list-actions">
                                <Chip
                                    label={`읽지 않음: ${unreadCount}`}
                                    color="primary"
                                    size="small"
                                    sx={{ mr: 2 }}
                                />
                                <Button
                                    size="small"
                                    startIcon={<CheckCircle />}
                                    onClick={handleMarkAllAsRead}
                                >
                                    모두 읽음
                                </Button>
                            </Box>
                        )}
                    </Box>

                    {mentions.length === 0 ? (
                        <Box className="mentions-list-empty">
                            <Typography color="text.secondary">
                                멘션이 없습니다.
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <List>
                                {mentions.map((mention) => (
                                    <ListItem
                                        key={mention.id}
                                        className={`mention-item ${!mention.is_read ? 'unread' : ''}`}
                                        component={Link}
                                        to={getMentionLink(mention)}
                                        sx={{
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            '&:hover': { bgcolor: 'action.hover' }
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                src={mention.mentioned_by_profile_picture}
                                                alt={mention.mentioned_by_username}
                                            >
                                                {mention.mentioned_by_username.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="subtitle2" component="span">
                                                        @{mention.mentioned_by_username}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" component="span">
                                                        님이 멘션했습니다
                                                    </Typography>
                                                    {getMentionIcon(mention)}
                                                    {!mention.is_read && (
                                                        <Chip label="NEW" color="primary" size="small" />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        {mention.context}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        {formatTime(mention.created_at)}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                        {!mention.is_read && (
                                            <Button
                                                size="small"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleMarkAsRead(mention.id);
                                                }}
                                            >
                                                읽음
                                            </Button>
                                        )}
                                    </ListItem>
                                ))}
                            </List>

                            {totalPages > 1 && (
                                <Box className="mentions-list-pagination">
                                    <Pagination
                                        count={totalPages}
                                        page={currentPage}
                                        onChange={handlePageChange}
                                        color="primary"
                                    />
                                </Box>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default MentionsList;
