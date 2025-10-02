import React, { memo, useMemo } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Avatar,
    IconButton,
    Skeleton
} from '@mui/material';
import {
    Visibility as ViewIcon,
    ThumbUp as LikeIcon,
    Forum as CommentIcon,
    Share as ShareIcon,
    Bookmark as BookmarkIcon
} from '@mui/icons-material';

// 포스트 타입 정의
interface PostData {
    id: number;
    title: string;
    content: string;
    author: {
        name: string;
        avatar?: string;
    };
    community: {
        name: string;
        color: string;
        icon: string;
        category: 'news' | 'game' | 'streaming' | 'cosplay';
    };
    timestamp: string;
    stats: {
        views: number;
        likes: number;
        comments: number;
    };
    type: 'discussion' | 'guide' | 'showcase' | 'question' | 'live' | 'review';
    priority?: 'high' | 'medium' | 'low';
    tags?: string[];
    thumbnail?: string;
}

interface OptimizedPostCardProps {
    post: PostData;
    index: number;
    style?: React.CSSProperties;
    isLoading?: boolean;
    onClick?: (post: PostData) => void;
    onLike?: (postId: number) => void;
    onBookmark?: (postId: number) => void;
    onShare?: (post: PostData) => void;
}

// 포스트 타입별 색상 매핑
const POST_TYPE_COLORS = {
    discussion: '#2196f3',
    guide: '#4caf50',
    showcase: '#ff9800',
    question: '#9c27b0',
    live: '#f44336',
    review: '#795548'
} as const;

// 포스트 타입별 아이콘 매핑
const POST_TYPE_ICONS = {
    discussion: '💬',
    guide: '📚',
    showcase: '🎨',
    question: '❓',
    live: '🔴',
    review: '⭐'
} as const;

// 커뮤니티별 특화 스타일
const getCommunityStyle = (category: string) => {
    switch (category) {
        case 'news':
            return {
                borderLeft: '4px solid #1976d2',
                background: 'linear-gradient(135deg, #f8fbff 0%, #e7edff 100%)'
            };
        case 'game':
            return {
                borderLeft: '4px solid #9c27b0',
                background: 'linear-gradient(135deg, #faf8ff 0%, #f0e7ff 100%)'
            };
        case 'streaming':
            return {
                borderLeft: '4px solid #f44336',
                background: 'linear-gradient(135deg, #fff8f8 0%, #ffe7e7 100%)'
            };
        case 'cosplay':
            return {
                borderLeft: '4px solid #e91e63',
                background: 'linear-gradient(135deg, #fff8fb 0%, #ffe7f0 100%)'
            };
        default:
            return {
                borderLeft: '4px solid #gray',
                background: '#ffffff'
            };
    }
};

// 숫자 포맷팅 함수
const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
};

// 로딩 스켈레톤 컴포넌트
const PostCardSkeleton: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
    <Card sx={{ mb: 2, ...style }}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={32} height={32} sx={{ mr: 1 }} />
                <Skeleton variant="text" width={120} height={20} sx={{ mr: 1 }} />
                <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} />
            </Box>
            <Skeleton variant="text" width="90%" height={28} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton variant="text" width={150} height={16} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Skeleton variant="text" width={40} height={16} />
                    <Skeleton variant="text" width={40} height={16} />
                    <Skeleton variant="text" width={40} height={16} />
                </Box>
            </Box>
        </CardContent>
    </Card>
);

// 메인 포스트 카드 컴포넌트
const OptimizedPostCard: React.FC<OptimizedPostCardProps> = memo(({
    post,
    index,
    style,
    isLoading = false,
    onClick,
    onLike,
    onBookmark,
    onShare
}) => {
    // 로딩 상태일 때 스켈레톤 표시
    if (isLoading) {
        return <PostCardSkeleton style={style} />;
    }

    // 커뮤니티 스타일 메모이제이션
    const communityStyle = useMemo(
        () => getCommunityStyle(post.community.category),
        [post.community.category]
    );

    // 포스트 타입 색상 메모이제이션
    const typeColor = useMemo(
        () => POST_TYPE_COLORS[post.type],
        [post.type]
    );

    // 포스트 타입 아이콘 메모이제이션
    const typeIcon = useMemo(
        () => POST_TYPE_ICONS[post.type],
        [post.type]
    );

    // 클릭 핸들러
    const handleCardClick = () => {
        onClick?.(post);
    };

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onLike?.(post.id);
    };

    const handleBookmarkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onBookmark?.(post.id);
    };

    const handleShareClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onShare?.(post);
    };

    return (
        <Card
            sx={{
                mb: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                ...communityStyle,
                '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                },
                ...style
            }}
            onClick={handleCardClick}
        >
            <CardContent>
                {/* 헤더: 커뮤니티 정보 및 포스트 타입 */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                        sx={{
                            bgcolor: post.community.color,
                            width: 32,
                            height: 32,
                            mr: 1,
                            fontSize: '1rem'
                        }}
                    >
                        {post.community.icon}
                    </Avatar>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mr: 1, fontWeight: 'medium' }}
                    >
                        {post.community.name}
                    </Typography>
                    <Chip
                        label={`${typeIcon} ${post.type.toUpperCase()}`}
                        size="small"
                        sx={{
                            bgcolor: typeColor,
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 22,
                            fontWeight: 'bold'
                        }}
                    />
                    {post.priority === 'high' && (
                        <Chip
                            label="🔥 HOT"
                            size="small"
                            color="error"
                            sx={{ ml: 1, fontSize: '0.7rem', height: 22 }}
                        />
                    )}
                </Box>

                {/* 제목 */}
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                        fontWeight: 'bold',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
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
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.4
                    }}
                >
                    {post.content}
                </Typography>

                {/* 태그 */}
                {post.tags && post.tags.length > 0 && (
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {post.tags.slice(0, 3).map((tag, tagIndex) => (
                            <Chip
                                key={tagIndex}
                                label={`#${tag}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                        ))}
                        {post.tags.length > 3 && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                +{post.tags.length - 3} more
                            </Typography>
                        )}
                    </Box>
                )}

                {/* 푸터: 작성자 정보 및 통계 */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                            src={post.author.avatar}
                            sx={{ width: 24, height: 24, mr: 1, fontSize: '0.8rem' }}
                        >
                            {post.author.name.charAt(0)}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                            {post.author.name} • {post.timestamp}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* 조회수 */}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ViewIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                                {formatNumber(post.stats.views)}
                            </Typography>
                        </Box>

                        {/* 좋아요 */}
                        <IconButton size="small" onClick={handleLikeClick}>
                            <LikeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                {formatNumber(post.stats.likes)}
                            </Typography>
                        </IconButton>

                        {/* 댓글 */}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CommentIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                                {formatNumber(post.stats.comments)}
                            </Typography>
                        </Box>

                        {/* 북마크 */}
                        <IconButton size="small" onClick={handleBookmarkClick}>
                            <BookmarkIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        </IconButton>

                        {/* 공유 */}
                        <IconButton size="small" onClick={handleShareClick}>
                            <ShareIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        </IconButton>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
});

OptimizedPostCard.displayName = 'OptimizedPostCard';

export default OptimizedPostCard;
export type { PostData, OptimizedPostCardProps };
