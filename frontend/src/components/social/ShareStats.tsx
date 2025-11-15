/**
 * ShareStats Component
 * 게시물 공유 통계 표시
 */

import React, { useEffect, useState } from 'react';
import {
    Box,
    Chip,
    Tooltip,
    Typography,
    CircularProgress
} from '@mui/material';
import {
    Share as ShareIcon
} from '@mui/icons-material';
import {
    FaTwitter,
    FaFacebook,
    FaLinkedin,
    FaCopy
} from 'react-icons/fa';
import { getShareStats } from '../../services/socialService';
import type { ShareStats as ShareStatsType } from '../../types/social';
import './ShareStats.css';

interface ShareStatsProps {
    postId: number;
    compact?: boolean;
    showPlatformBreakdown?: boolean;
}

const ShareStats: React.FC<ShareStatsProps> = ({
    postId,
    compact = false,
    showPlatformBreakdown = true
}) => {
    const [stats, setStats] = useState<ShareStatsType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * 공유 통계 로드
     */
    useEffect(() => {
        loadStats();
    }, [postId]);

    const loadStats = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await getShareStats(postId);
            setStats(data);
        } catch (err) {
            console.error('Failed to load share stats:', err);
            setError('통계를 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 숫자 포맷팅
     */
    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    if (loading) {
        return (
            <Box className="share-stats-loading">
                <CircularProgress size={16} />
            </Box>
        );
    }

    if (error || !stats) {
        return null;
    }

    if (stats.total_shares === 0) {
        return compact ? null : (
            <Typography variant="body2" color="text.secondary">
                아직 공유되지 않았습니다
            </Typography>
        );
    }

    if (compact) {
        return (
            <Tooltip title={`${stats.total_shares.toLocaleString()}회 공유됨`}>
                <Chip
                    icon={<ShareIcon />}
                    label={formatNumber(stats.total_shares)}
                    size="small"
                    variant="outlined"
                    className="share-stats-chip"
                />
            </Tooltip>
        );
    }

    return (
        <Box className="share-stats-container">
            <Box className="share-stats-total">
                <ShareIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                    <strong>{stats.total_shares.toLocaleString()}</strong> 회 공유됨
                </Typography>
            </Box>

            {showPlatformBreakdown && (
                <Box className="share-stats-breakdown">
                    {stats.twitter_shares > 0 && (
                        <Tooltip title={`Twitter: ${stats.twitter_shares.toLocaleString()}회`}>
                            <Chip
                                icon={<FaTwitter color="#1DA1F2" />}
                                label={formatNumber(stats.twitter_shares)}
                                size="small"
                                variant="outlined"
                                className="platform-chip twitter"
                            />
                        </Tooltip>
                    )}

                    {stats.facebook_shares > 0 && (
                        <Tooltip title={`Facebook: ${stats.facebook_shares.toLocaleString()}회`}>
                            <Chip
                                icon={<FaFacebook color="#1877F2" />}
                                label={formatNumber(stats.facebook_shares)}
                                size="small"
                                variant="outlined"
                                className="platform-chip facebook"
                            />
                        </Tooltip>
                    )}

                    {stats.linkedin_shares > 0 && (
                        <Tooltip title={`LinkedIn: ${stats.linkedin_shares.toLocaleString()}회`}>
                            <Chip
                                icon={<FaLinkedin color="#0A66C2" />}
                                label={formatNumber(stats.linkedin_shares)}
                                size="small"
                                variant="outlined"
                                className="platform-chip linkedin"
                            />
                        </Tooltip>
                    )}

                    {stats.clipboard_shares > 0 && (
                        <Tooltip title={`링크 복사: ${stats.clipboard_shares.toLocaleString()}회`}>
                            <Chip
                                icon={<FaCopy />}
                                label={formatNumber(stats.clipboard_shares)}
                                size="small"
                                variant="outlined"
                                className="platform-chip clipboard"
                            />
                        </Tooltip>
                    )}
                </Box>
            )}

            {stats.last_shared_at && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    최근 공유: {new Date(stats.last_shared_at).toLocaleString('ko-KR')}
                </Typography>
            )}
        </Box>
    );
};

export default ShareStats;
