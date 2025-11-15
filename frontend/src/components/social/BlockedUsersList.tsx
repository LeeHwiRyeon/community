/**
 * BlockedUsersList Component
 * 차단한 사용자 목록 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Button,
    CircularProgress,
    Alert,
    TextField,
    InputAdornment,
    Pagination,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Search as SearchIcon,
    Block as BlockIcon,
    CalendarToday as CalendarIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { getBlockedUsers, unblockUser } from '../../services/socialService';
import type { BlockedUser } from '../../types/social';
import './BlockedUsersList.css';

interface BlockedUsersListProps {
    onUnblock?: (userId: number) => void;
}

export const BlockedUsersList: React.FC<BlockedUsersListProps> = ({ onUnblock }) => {
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [unblockingUserId, setUnblockingUserId] = useState<number | null>(null);

    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        loadBlockedUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [blockedUsers, searchQuery]);

    const loadBlockedUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getBlockedUsers(100, 0); // 최대 100명
            setBlockedUsers(response.blocked);
            setTotalPages(Math.ceil(response.blocked.length / ITEMS_PER_PAGE));
        } catch (err: any) {
            console.error('차단 목록 로드 실패:', err);
            setError(err.response?.data?.error || '차단 목록을 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        if (!searchQuery.trim()) {
            setFilteredUsers(blockedUsers);
            setTotalPages(Math.ceil(blockedUsers.length / ITEMS_PER_PAGE));
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = blockedUsers.filter(user =>
            user.username.toLowerCase().includes(query) ||
            user.display_name?.toLowerCase().includes(query) ||
            user.reason?.toLowerCase().includes(query)
        );
        setFilteredUsers(filtered);
        setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
        setPage(1); // 검색 시 첫 페이지로
    };

    const handleUnblock = async (userId: number) => {
        try {
            setUnblockingUserId(userId);
            setError(null);
            await unblockUser(userId);

            // 목록에서 제거
            setBlockedUsers(prev => prev.filter(user => user.blocked_id !== userId));

            if (onUnblock) {
                onUnblock(userId);
            }
        } catch (err: any) {
            console.error('차단 해제 실패:', err);
            setError(err.response?.data?.error || '차단 해제에 실패했습니다.');
        } finally {
            setUnblockingUserId(null);
        }
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    };

    const getPaginatedUsers = () => {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredUsers.slice(startIndex, endIndex);
    };

    if (loading) {
        return (
            <Box className="blocked-users-loading">
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                    차단 목록을 불러오는 중...
                </Typography>
            </Box>
        );
    }

    return (
        <Box className="blocked-users-container">
            {/* Header */}
            <Box className="blocked-users-header">
                <Box>
                    <Typography variant="h5" gutterBottom>
                        차단한 사용자
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        총 {blockedUsers.length}명의 사용자를 차단했습니다
                    </Typography>
                </Box>
            </Box>

            {/* Search */}
            <TextField
                fullWidth
                placeholder="사용자 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    )
                }}
                sx={{ mb: 3 }}
            />

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Empty State */}
            {filteredUsers.length === 0 && (
                <Card className="blocked-users-empty">
                    <CardContent>
                        <BlockIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            {searchQuery ? '검색 결과가 없습니다' : '차단한 사용자가 없습니다'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {searchQuery ? '다른 검색어를 시도해보세요' : '차단한 사용자가 여기에 표시됩니다'}
                        </Typography>
                    </CardContent>
                </Card>
            )}

            {/* User List */}
            {filteredUsers.length > 0 && (
                <>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {getPaginatedUsers().map((user) => (
                            <Box sx={{ width: '100%' }} key={user.id}>
                                <Card className="blocked-user-card">
                                    <CardContent>
                                        <Box className="blocked-user-content">
                                            {/* User Info */}
                                            <Box className="blocked-user-info">
                                                <Avatar
                                                    src={user.profile_picture}
                                                    alt={user.username}
                                                    sx={{ width: 56, height: 56 }}
                                                />
                                                <Box className="blocked-user-details">
                                                    <Typography variant="h6">
                                                        {user.display_name || user.username}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        @{user.username}
                                                    </Typography>
                                                    {user.bio && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                            {user.bio}
                                                        </Typography>
                                                    )}

                                                    {/* Block Date */}
                                                    <Box className="blocked-user-meta">
                                                        <Chip
                                                            icon={<CalendarIcon />}
                                                            label={`차단일: ${formatDate(user.created_at)}`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </Box>

                                                    {/* Block Reason */}
                                                    {user.reason && (
                                                        <Box className="blocked-user-reason">
                                                            <Tooltip title="차단 이유">
                                                                <InfoIcon fontSize="small" color="action" />
                                                            </Tooltip>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {user.reason}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>

                                            {/* Unblock Button */}
                                            <Box className="blocked-user-actions">
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={() => handleUnblock(user.blocked_id)}
                                                    disabled={unblockingUserId === user.blocked_id}
                                                    startIcon={unblockingUserId === user.blocked_id ? <CircularProgress size={16} /> : <BlockIcon />}
                                                >
                                                    {unblockingUserId === user.blocked_id ? '처리 중...' : '차단 해제'}
                                                </Button>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Box>
                        ))}
                    </Box>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Box className="blocked-users-pagination">
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default BlockedUsersList;
