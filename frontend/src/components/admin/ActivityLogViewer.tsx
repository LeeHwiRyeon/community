/**
 * 활동 로그 뷰어
 * 사용자 활동을 시간순으로 시각화
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    TextField,
    MenuItem,
    CircularProgress,
    Pagination,
    Avatar,
    Tooltip,
    IconButton,
} from '@mui/material';
import {
    Person,
    Article,
    Comment,
    ThumbUp,
    FilterList,
    Refresh,
    Visibility,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Activity {
    id: number;
    entity_type: string;
    entity_id: number;
    action_type: string;
    user_id?: number;
    user_display_name: string;
    username?: string;
    title?: string;
    content?: string;
    post_title?: string;
    created_at: string;
}

const ActivityLogViewer: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterType, setFilterType] = useState('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(20);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const offset = (page - 1) * limit;

            const response = await axios.get(`${API_BASE_URL}/api/admin-simple/activity-log`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                params: {
                    limit,
                    offset,
                    type: filterType,
                },
            });

            if (response.data.success) {
                setActivities(response.data.activities);
                setTotal(response.data.total);
                setError(null);
            }
        } catch (err: any) {
            console.error('활동 로그 조회 실패:', err);
            setError(err.response?.data?.message || '활동 로그를 불러올 수 없습니다');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [filterType, page]);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'user':
                return <Person color="primary" />;
            case 'post':
                return <Article color="secondary" />;
            case 'comment':
                return <Comment color="success" />;
            case 'like':
                return <ThumbUp color="error" />;
            default:
                return <Article />;
        }
    };

    const getActionLabel = (actionType: string) => {
        const labels: Record<string, string> = {
            user_created: '가입',
            post_created: '게시글 작성',
            comment_created: '댓글 작성',
            like_added: '좋아요',
            post_edited: '게시글 수정',
            post_deleted: '게시글 삭제',
        };
        return labels[actionType] || actionType;
    };

    const getActionColor = (actionType: string): 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' => {
        if (actionType.includes('created')) return 'success';
        if (actionType.includes('deleted')) return 'error';
        if (actionType.includes('edited')) return 'warning';
        return 'default';
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss', { locale: ko });
        } catch {
            return dateString;
        }
    };

    const handleRefresh = () => {
        fetchActivities();
    };

    if (error) {
        return (
            <Card>
                <CardContent>
                    <Typography color="error">{error}</Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                    <FilterList color="primary" />
                    사용자 활동 로그
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                    <TextField
                        select
                        size="small"
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value);
                            setPage(1);
                        }}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="all">전체</MenuItem>
                        <MenuItem value="user">사용자</MenuItem>
                        <MenuItem value="post">게시글</MenuItem>
                        <MenuItem value="comment">댓글</MenuItem>
                    </TextField>
                    <IconButton onClick={handleRefresh} disabled={loading}>
                        <Refresh />
                    </IconButton>
                </Box>
            </Box>

            {loading && activities.length === 0 ? (
                <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell width={60}>타입</TableCell>
                                    <TableCell>사용자</TableCell>
                                    <TableCell>활동</TableCell>
                                    <TableCell>내용</TableCell>
                                    <TableCell width={180}>시간</TableCell>
                                    <TableCell width={80}>액션</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {activities.map((activity) => (
                                    <TableRow key={`${activity.entity_type}-${activity.id}`}>
                                        <TableCell>
                                            <Tooltip title={activity.entity_type}>
                                                {getActivityIcon(activity.entity_type)}
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ width: 32, height: 32 }}>
                                                    {activity.user_display_name?.[0] || '?'}
                                                </Avatar>
                                                <Typography variant="body2">
                                                    {activity.user_display_name || activity.username || 'Unknown'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getActionLabel(activity.action_type)}
                                                color={getActionColor(activity.action_type)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                                                {activity.title || activity.post_title ||
                                                    (activity.content ? activity.content.substring(0, 50) + '...' : '-')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="textSecondary">
                                                {formatDate(activity.created_at)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="상세 보기">
                                                <IconButton size="small">
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {total > limit && (
                        <Box display="flex" justifyContent="center" mt={3}>
                            <Pagination
                                count={Math.ceil(total / limit)}
                                page={page}
                                onChange={(_, value) => setPage(value)}
                                color="primary"
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default ActivityLogViewer;
