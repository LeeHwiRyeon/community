/**
 * 실시간 통계 위젯
 * 최근 1시간 활동 및 현재 온라인 사용자 표시
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Chip,
    LinearProgress,
} from '@mui/material';
import {
    TrendingUp,
    People,
    Article,
    Comment,
    Refresh,
} from '@mui/icons-material';
import axios from 'axios';

interface RealTimeStatsData {
    lastHour: {
        posts: number;
        comments: number;
        newUsers: number;
    };
    current: {
        onlineUsers: number;
    };
    hourlyActivity: Array<{
        hour: string;
        count: number;
        type: string;
    }>;
    system: {
        totalRecords: number;
        dbSize: string;
    };
}

const RealTimeStats: React.FC = () => {
    const [stats, setStats] = useState<RealTimeStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/admin-simple/realtime-stats`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (response.data.success) {
                setStats(response.data.stats);
                setError(null);
            }
        } catch (err: any) {
            console.error('실시간 통계 조회 실패:', err);
            setError(err.response?.data?.message || '통계를 불러올 수 없습니다');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        // 자동 갱신 (30초마다)
        let interval: NodeJS.Timeout | null = null;
        if (autoRefresh) {
            interval = setInterval(fetchStats, 30000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    const handleRefresh = () => {
        setLoading(true);
        fetchStats();
    };

    if (loading && !stats) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
            </Box>
        );
    }

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
                    <TrendingUp color="primary" />
                    실시간 통계
                </Typography>
                <Box display="flex" gap={1} alignItems="center">
                    <Chip
                        label={autoRefresh ? '자동 갱신 ON' : '자동 갱신 OFF'}
                        color={autoRefresh ? 'success' : 'default'}
                        size="small"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    />
                    <Chip
                        label="새로고침"
                        icon={<Refresh />}
                        size="small"
                        onClick={handleRefresh}
                        disabled={loading}
                    />
                </Box>
            </Box>

            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={2}>
                {/* 온라인 사용자 */}
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="textSecondary" variant="caption">
                                    현재 온라인
                                </Typography>
                                <Typography variant="h4" color="success.main">
                                    {stats?.current.onlineUsers || 0}
                                </Typography>
                                <Typography variant="caption">사용자</Typography>
                            </Box>
                            <People sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* 최근 1시간 게시글 */}
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="textSecondary" variant="caption">
                                    최근 1시간
                                </Typography>
                                <Typography variant="h4" color="primary.main">
                                    {stats?.lastHour.posts || 0}
                                </Typography>
                                <Typography variant="caption">새 게시글</Typography>
                            </Box>
                            <Article sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* 최근 1시간 댓글 */}
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="textSecondary" variant="caption">
                                    최근 1시간
                                </Typography>
                                <Typography variant="h4" color="secondary.main">
                                    {stats?.lastHour.comments || 0}
                                </Typography>
                                <Typography variant="caption">새 댓글</Typography>
                            </Box>
                            <Comment sx={{ fontSize: 48, color: 'secondary.main', opacity: 0.3 }} />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* 신규 가입자 */}
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="textSecondary" variant="caption">
                                    최근 1시간
                                </Typography>
                                <Typography variant="h4" color="info.main">
                                    {stats?.lastHour.newUsers || 0}
                                </Typography>
                                <Typography variant="caption">신규 가입</Typography>
                            </Box>
                            <People sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* 시스템 상태 */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                            시스템 상태
                        </Typography>
                        <Box display="flex" gap={2} flexWrap="wrap">
                            <Box flex={1} minWidth={200}>
                                <Typography variant="caption" color="textSecondary">
                                    총 레코드 수
                                </Typography>
                                <Typography variant="h6">
                                    {stats?.system.totalRecords.toLocaleString() || 0}
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min((stats?.system.totalRecords || 0) / 100000 * 100, 100)}
                                    sx={{ mt: 1 }}
                                />
                            </Box>
                            <Box flex={1} minWidth={200}>
                                <Typography variant="caption" color="textSecondary">
                                    데이터베이스 크기
                                </Typography>
                                <Typography variant="h6">
                                    {stats?.system.dbSize || 'N/A'}
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
        </Box >
    );
};

export default RealTimeStats;
