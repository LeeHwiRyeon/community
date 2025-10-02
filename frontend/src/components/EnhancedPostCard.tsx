/**
 * 🎨 향상된 포스트 카드 컴포넌트
 * 
 * AI 기반 컨텐츠 분석, 개인화 추천, 실시간 상호작용을 지원하는
 * 차세대 포스트 카드 컴포넌트
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-10-02
 */

import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Box,
    Chip,
    Avatar,
    IconButton,
    Button,
    Skeleton,
    LinearProgress,
    Tooltip,
    Badge,
    Fade,
    Zoom,
    Collapse,
    Rating,
    Divider
} from '@mui/material';
import {
    Visibility as ViewIcon,
    ThumbUp as LikeIcon,
    ThumbDown as DislikeIcon,
    Forum as CommentIcon,
    Share as ShareIcon,
    Bookmark as BookmarkIcon,
    BookmarkBorder as BookmarkBorderIcon,
    MoreVert as MoreIcon,
    TrendingUp as TrendingIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    LocalOffer as TagIcon,
    Psychology as AIIcon,
    Favorite as FavoriteIcon,
    FavoriteBorder as FavoriteBorderIcon,
    PlayArrow as PlayIcon,
    VolumeUp as AudioIcon,
    Image as ImageIcon,
    AttachFile as AttachIcon,
    Verified as VerifiedIcon,
    Star as StarIcon,
    EmojiEvents as AwardIcon,
    Speed as SpeedIcon,
    Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// 향상된 포스트 데이터 타입
interface EnhancedPostData {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    author: {
        id: string;
        name: string;
        avatar: string;
        level: number;
        badges: string[];
        verified: boolean;
        reputation: number;
    };
    metadata: {
        createdAt: string;
        updatedAt: string;
        publishedAt: string;
        status: 'draft' | 'published' | 'archived';
        visibility: 'public' | 'members' | 'vip';
    };
    engagement: {
        views: number;
        likes: number;
        dislikes: number;
        comments: number;
        shares: number;
        bookmarks: number;
        reactions: Record<string, number>;
    };
    content_analysis: {
        readingTime: number;
        sentiment: 'positive' | 'neutral' | 'negative';
        sentimentScore: number;
        topics: string[];
        keywords: string[];
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        quality_score: number;
        engagement_potential: number;
    };
    multimedia: {
        thumbnail: string;
        images: string[];
        videos: string[];
        audio: string[];
        attachments: string[];
    };
    categorization: {
        board: string;
        category: string;
        subcategory: string;
        tags: string[];
        priority: 'low' | 'medium' | 'high' | 'urgent';
    };
    interaction: {
        allowComments: boolean;
        allowVoting: boolean;
        allowSharing: boolean;
        moderationRequired: boolean;
    };
    personalization: {
        relevance_score: number;
        recommendation_reason: string;
        user_interest_match: number;
        trending_score: number;
    };
    realtime: {
        live_viewers: number;
        recent_activity: string[];
        hot_comments: number;
        viral_potential: number;
    };
}

interface EnhancedPostCardProps {
    post: EnhancedPostData;
    index: number;
    viewMode: 'card' | 'list' | 'grid' | 'magazine';
    showAnalytics?: boolean;
    showPersonalization?: boolean;
    enableRealtime?: boolean;
    onInteraction?: (type: string, postId: string) => void;
    onViewPost?: (postId: string) => void;
    className?: string;
}

const EnhancedPostCard: React.FC<EnhancedPostCardProps> = memo(({
    post,
    index,
    viewMode = 'card',
    showAnalytics = false,
    showPersonalization = false,
    enableRealtime = true,
    onInteraction,
    onViewPost,
    className
}) => {
    const theme = useTheme();
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [localEngagement, setLocalEngagement] = useState(post.engagement);
    const [isVisible, setIsVisible] = useState(false);
    const [loadingInteraction, setLoadingInteraction] = useState<string | null>(null);

    // 컴포넌트 마운트 시 애니메이션
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), index * 100);
        return () => clearTimeout(timer);
    }, [index]);

    // 실시간 데이터 업데이트 시뮬레이션
    useEffect(() => {
        if (!enableRealtime) return;

        const interval = setInterval(() => {
            // 실시간 조회수 업데이트 시뮬레이션
            setLocalEngagement(prev => ({
                ...prev,
                views: prev.views + Math.floor(Math.random() * 3)
            }));
        }, 30000); // 30초마다 업데이트

        return () => clearInterval(interval);
    }, [enableRealtime]);

    // 상호작용 핸들러
    const handleInteraction = useCallback(async (type: string) => {
        setLoadingInteraction(type);

        try {
            // API 호출 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 500));

            switch (type) {
                case 'like':
                    setIsLiked(!isLiked);
                    setLocalEngagement(prev => ({
                        ...prev,
                        likes: isLiked ? prev.likes - 1 : prev.likes + 1
                    }));
                    break;
                case 'bookmark':
                    setIsBookmarked(!isBookmarked);
                    setLocalEngagement(prev => ({
                        ...prev,
                        bookmarks: isBookmarked ? prev.bookmarks - 1 : prev.bookmarks + 1
                    }));
                    break;
                case 'share':
                    setLocalEngagement(prev => ({
                        ...prev,
                        shares: prev.shares + 1
                    }));
                    break;
            }

            onInteraction?.(type, post.id);
        } catch (error) {
            console.error('상호작용 처리 실패:', error);
        } finally {
            setLoadingInteraction(null);
        }
    }, [isLiked, isBookmarked, onInteraction, post.id]);

    // 포스트 클릭 핸들러
    const handlePostClick = useCallback(() => {
        onViewPost?.(post.id);
        setLocalEngagement(prev => ({
            ...prev,
            views: prev.views + 1
        }));
    }, [onViewPost, post.id]);

    // 감정 분석 색상
    const getSentimentColor = useMemo(() => {
        switch (post.content_analysis.sentiment) {
            case 'positive': return theme.palette.success.main;
            case 'negative': return theme.palette.error.main;
            default: return theme.palette.grey[500];
        }
    }, [post.content_analysis.sentiment, theme]);

    // 우선순위 색상
    const getPriorityColor = useMemo(() => {
        switch (post.categorization.priority) {
            case 'urgent': return theme.palette.error.main;
            case 'high': return theme.palette.warning.main;
            case 'medium': return theme.palette.info.main;
            default: return theme.palette.grey[500];
        }
    }, [post.categorization.priority, theme]);

    // 개인화 점수 표시
    const PersonalizationIndicator = useMemo(() => {
        if (!showPersonalization) return null;

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <AIIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                <Typography variant="caption" color="primary">
                    {Math.round(post.personalization.relevance_score * 100)}% 관련성
                </Typography>
                <Chip
                    size="small"
                    label={post.personalization.recommendation_reason}
                    sx={{ fontSize: 10, height: 20 }}
                />
            </Box>
        );
    }, [showPersonalization, post.personalization, theme]);

    // 분석 정보 표시
    const AnalyticsIndicator = useMemo(() => {
        if (!showAnalytics) return null;

        return (
            <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SpeedIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption">
                            {post.content_analysis.readingTime}분 읽기
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AnalyticsIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption">
                            품질: {Math.round(post.content_analysis.quality_score * 100)}%
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrendingIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption">
                            트렌딩: {Math.round(post.realtime.viral_potential * 100)}%
                        </Typography>
                    </Box>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={post.content_analysis.engagement_potential * 100}
                    sx={{ mt: 1, height: 4, borderRadius: 2 }}
                />
                <Typography variant="caption" color="text.secondary">
                    참여도 예측: {Math.round(post.content_analysis.engagement_potential * 100)}%
                </Typography>
            </Box>
        );
    }, [showAnalytics, post]);

    // 실시간 활동 표시
    const RealtimeActivity = useMemo(() => {
        if (!enableRealtime || post.realtime.live_viewers === 0) return null;

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <Badge
                    badgeContent={post.realtime.live_viewers}
                    color="error"
                    sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}
                >
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'error.main',
                            animation: 'pulse 2s infinite'
                        }}
                    />
                </Badge>
                <Typography variant="caption" color="error">
                    실시간 활동 중
                </Typography>
            </Box>
        );
    }, [enableRealtime, post.realtime]);

    // 멀티미디어 표시
    const MultimediaIndicators = useMemo(() => {
        const indicators = [];

        if (post.multimedia.images.length > 0) {
            indicators.push(
                <Tooltip key="images" title={`${post.multimedia.images.length}개 이미지`}>
                    <Chip
                        size="small"
                        icon={<ImageIcon />}
                        label={post.multimedia.images.length}
                        sx={{ fontSize: 10, height: 20 }}
                    />
                </Tooltip>
            );
        }

        if (post.multimedia.videos.length > 0) {
            indicators.push(
                <Tooltip key="videos" title={`${post.multimedia.videos.length}개 동영상`}>
                    <Chip
                        size="small"
                        icon={<PlayIcon />}
                        label={post.multimedia.videos.length}
                        sx={{ fontSize: 10, height: 20 }}
                    />
                </Tooltip>
            );
        }

        if (post.multimedia.audio.length > 0) {
            indicators.push(
                <Tooltip key="audio" title={`${post.multimedia.audio.length}개 오디오`}>
                    <Chip
                        size="small"
                        icon={<AudioIcon />}
                        label={post.multimedia.audio.length}
                        sx={{ fontSize: 10, height: 20 }}
                    />
                </Tooltip>
            );
        }

        if (post.multimedia.attachments.length > 0) {
            indicators.push(
                <Tooltip key="attachments" title={`${post.multimedia.attachments.length}개 첨부파일`}>
                    <Chip
                        size="small"
                        icon={<AttachIcon />}
                        label={post.multimedia.attachments.length}
                        sx={{ fontSize: 10, height: 20 }}
                    />
                </Tooltip>
            );
        }

        return indicators.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                {indicators}
            </Box>
        ) : null;
    }, [post.multimedia]);

    return (
        <Fade in={isVisible} timeout={300 + index * 100}>
            <Card
                className={className}
                sx={{
                    mb: 2,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[8],
                    },
                    border: post.categorization.priority === 'urgent' ?
                        `2px solid ${theme.palette.error.main}` : 'none',
                    position: 'relative',
                    overflow: 'visible'
                }}
                onClick={handlePostClick}
            >
                {/* 우선순위 표시 */}
                {post.categorization.priority !== 'low' && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -8,
                            right: 16,
                            bgcolor: getPriorityColor,
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: 10,
                            fontWeight: 'bold',
                            zIndex: 1
                        }}
                    >
                        {post.categorization.priority.toUpperCase()}
                    </Box>
                )}

                {/* 썸네일 이미지 */}
                {post.multimedia.thumbnail && (
                    <CardMedia
                        component="img"
                        height="200"
                        image={post.multimedia.thumbnail}
                        alt={post.title}
                        sx={{
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                                transform: 'scale(1.05)'
                            }
                        }}
                    />
                )}

                <CardContent>
                    {/* 개인화 정보 */}
                    {PersonalizationIndicator}

                    {/* 실시간 활동 */}
                    {RealtimeActivity}

                    {/* 작성자 정보 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                            src={post.author.avatar}
                            alt={post.author.name}
                            sx={{ width: 40, height: 40, mr: 1 }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    {post.author.name}
                                </Typography>
                                {post.author.verified && (
                                    <VerifiedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                )}
                                <Chip
                                    size="small"
                                    label={`Lv.${post.author.level}`}
                                    sx={{ fontSize: 10, height: 18 }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(post.metadata.publishedAt).toLocaleDateString()}
                                </Typography>
                                <Rating
                                    value={post.author.reputation / 20}
                                    precision={0.1}
                                    size="small"
                                    readOnly
                                    sx={{ fontSize: 12 }}
                                />
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {post.author.badges.map((badge, idx) => (
                                <Tooltip key={idx} title={badge}>
                                    <AwardIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                </Tooltip>
                            ))}
                        </Box>
                    </Box>

                    {/* 제목 */}
                    <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                            mb: 1,
                            fontWeight: 'bold',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}
                    >
                        {post.title}
                    </Typography>

                    {/* 내용 미리보기 */}
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: isExpanded ? 'none' : 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}
                    >
                        {post.excerpt}
                    </Typography>

                    {/* 멀티미디어 표시 */}
                    {MultimediaIndicators}

                    {/* 태그 */}
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                        {post.categorization.tags.slice(0, 3).map((tag, idx) => (
                            <Chip
                                key={idx}
                                size="small"
                                label={tag}
                                variant="outlined"
                                sx={{ fontSize: 10, height: 20 }}
                            />
                        ))}
                        {post.categorization.tags.length > 3 && (
                            <Chip
                                size="small"
                                label={`+${post.categorization.tags.length - 3}`}
                                variant="outlined"
                                sx={{ fontSize: 10, height: 20 }}
                            />
                        )}
                    </Box>

                    {/* 감정 분석 표시 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Box
                            sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: getSentimentColor
                            }}
                        />
                        <Typography variant="caption">
                            {post.content_analysis.sentiment === 'positive' ? '긍정적' :
                                post.content_analysis.sentiment === 'negative' ? '부정적' : '중립적'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            ({Math.round(Math.abs(post.content_analysis.sentimentScore) * 100)}%)
                        </Typography>
                    </Box>

                    {/* 상호작용 버튼 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                size="small"
                                startIcon={<ViewIcon />}
                                sx={{ minWidth: 'auto', fontSize: 12 }}
                            >
                                {localEngagement.views.toLocaleString()}
                            </Button>

                            <Button
                                size="small"
                                startIcon={isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleInteraction('like');
                                }}
                                disabled={loadingInteraction === 'like'}
                                color={isLiked ? 'error' : 'inherit'}
                                sx={{ minWidth: 'auto', fontSize: 12 }}
                            >
                                {localEngagement.likes.toLocaleString()}
                            </Button>

                            <Button
                                size="small"
                                startIcon={<CommentIcon />}
                                sx={{ minWidth: 'auto', fontSize: 12 }}
                            >
                                {localEngagement.comments.toLocaleString()}
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleInteraction('share');
                                }}
                                disabled={loadingInteraction === 'share'}
                            >
                                <ShareIcon fontSize="small" />
                            </IconButton>

                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleInteraction('bookmark');
                                }}
                                disabled={loadingInteraction === 'bookmark'}
                                color={isBookmarked ? 'primary' : 'default'}
                            >
                                {isBookmarked ?
                                    <BookmarkIcon fontSize="small" /> :
                                    <BookmarkBorderIcon fontSize="small" />
                                }
                            </IconButton>
                        </Box>
                    </Box>

                    {/* 분석 정보 */}
                    {AnalyticsIndicator}
                </CardContent>
            </Card>
        </Fade>
    );
});

EnhancedPostCard.displayName = 'EnhancedPostCard';

export default EnhancedPostCard;
