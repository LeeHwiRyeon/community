// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Box,
    Container,
    Avatar,
    Typography,
    Button,
    Tabs,
    Tab,
    Card,
    CardContent,
    Grid,
    Chip,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    Badge as MuiBadge,
    Stack,
    Divider,
    Paper
} from '@mui/material';
import {
    Edit as EditIcon,
    LocationOn as LocationIcon,
    Language as WebsiteIcon,
    Twitter as TwitterIcon,
    GitHub as GitHubIcon,
    LinkedIn as LinkedInIcon,
    CalendarToday as CalendarIcon,
    TrendingUp as TrendingUpIcon,
    Article as ArticleIcon,
    Comment as CommentIcon,
    ThumbUp as ThumbUpIcon,
    Visibility as VisibilityIcon,
    EmojiEvents as TrophyIcon,
    People as PeopleIcon
} from '@mui/icons-material';
import { profileService } from '../services/profileService';
import { UserProfile, UserActivityStats, UserBadge, UserActivity } from '../types/profile';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`profile-tabpanel-${index}`}
            aria-labelledby={`profile-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

const ProfilePage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<UserActivityStats | null>(null);
    const [badges, setBadges] = useState<UserBadge[]>([]);
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);

    const currentUserId = Number(localStorage.getItem('userId'));
    const isOwnProfile = currentUserId === Number(userId);

    useEffect(() => {
        if (userId) {
            loadProfileData();
        }
    }, [userId]);

    const loadProfileData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [profileData, statsData, badgesData, activitiesData] = await Promise.all([
                profileService.getUserProfile(Number(userId)),
                profileService.getUserStats(Number(userId)),
                profileService.getUserBadges(Number(userId)),
                profileService.getUserActivity(Number(userId), 20)
            ]);

            setProfile(profileData);
            setStats(statsData);
            setBadges(badgesData.filter(b => b.isVisible));
            setActivities(activitiesData);
        } catch (err: any) {
            setError(err.response?.data?.error || '프로필을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const getBadgeColor = (level: string) => {
        const colors: Record<string, string> = {
            newbie: '#9e9e9e',
            member: '#2196f3',
            active: '#4caf50',
            expert: '#ff9800',
            admin: '#f44336'
        };
        return colors[level] || '#9e9e9e';
    };

    const getBadgeIcon = (badgeType: string) => {
        // Badge type에 따른 아이콘 매핑
        const icons: Record<string, React.ReactNode> = {
            new_member: '🎉',
            verified_email: '✅',
            first_post: '📝',
            active_contributor: '⭐',
            popular_author: '🔥',
            helpful_commenter: '💬',
            super_user: '👑',
            moderator: '🛡️',
            admin: '⚡'
        };
        return icons[badgeType] || '🏆';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatRelativeTime = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        return formatDate(dateString);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!profile || !stats) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="warning">프로필을 찾을 수 없습니다.</Alert>
            </Container>
        );
    }

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', pb: 4 }}>
            {/* Cover Image */}
            <Box
                sx={{
                    height: 250,
                    bgcolor: profile.coverImageUrl ? 'transparent' : '#1976d2',
                    backgroundImage: profile.coverImageUrl ? `url(${profile.coverImageUrl})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                }}
            >
                {isOwnProfile && (
                    <IconButton
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            bgcolor: 'rgba(255,255,255,0.9)',
                            '&:hover': { bgcolor: 'white' }
                        }}
                        onClick={() => navigate(`/profile/${userId}/edit`)}
                    >
                        <EditIcon />
                    </IconButton>
                )}
            </Box>

            <Container maxWidth="lg" sx={{ mt: -8, position: 'relative' }}>
                {/* Profile Header */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Grid container spacing={3} alignItems="flex-start">
                        <Grid item>
                            <MuiBadge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                badgeContent={
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            bgcolor: profile.status === 'online' ? '#4caf50' : '#9e9e9e',
                                            border: '3px solid white'
                                        }}
                                    />
                                }
                            >
                                <Avatar
                                    src={profile.profileImageUrl || profile.avatarUrl}
                                    sx={{
                                        width: 150,
                                        height: 150,
                                        border: '4px solid white',
                                        boxShadow: 3
                                    }}
                                />
                            </MuiBadge>
                        </Grid>

                        <Grid item xs>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                                        {profile.displayName || profile.username}
                                        <Chip
                                            label={profile.badgeLevel}
                                            size="small"
                                            sx={{
                                                ml: 2,
                                                bgcolor: getBadgeColor(profile.badgeLevel),
                                                color: 'white',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" gutterBottom>
                                        @{profile.username}
                                    </Typography>

                                    {profile.bio && (
                                        <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
                                            {profile.bio}
                                        </Typography>
                                    )}

                                    <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 2 }}>
                                        {profile.location && (
                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                <LocationIcon fontSize="small" color="action" />
                                                <Typography variant="body2" color="text.secondary">
                                                    {profile.location}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <CalendarIcon fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary">
                                                가입: {formatDate(profile.joinedAt)}
                                            </Typography>
                                        </Box>

                                        {profile.website && (
                                            <Tooltip title="웹사이트">
                                                <IconButton
                                                    size="small"
                                                    href={profile.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <WebsiteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {profile.twitterHandle && (
                                            <Tooltip title="Twitter">
                                                <IconButton
                                                    size="small"
                                                    href={`https://twitter.com/${profile.twitterHandle}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <TwitterIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {profile.githubUsername && (
                                            <Tooltip title="GitHub">
                                                <IconButton
                                                    size="small"
                                                    href={`https://github.com/${profile.githubUsername}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <GitHubIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {profile.linkedinUrl && (
                                            <Tooltip title="LinkedIn">
                                                <IconButton
                                                    size="small"
                                                    href={profile.linkedinUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <LinkedInIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>

                                    {profile.interests && profile.interests.length > 0 && (
                                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                                            {profile.interests.map((interest, index) => (
                                                <Chip key={index} label={interest} size="small" variant="outlined" />
                                            ))}
                                        </Stack>
                                    )}
                                </Box>

                                <Stack direction="row" spacing={2}>
                                    {isOwnProfile ? (
                                        <Button
                                            variant="outlined"
                                            startIcon={<EditIcon />}
                                            onClick={() => navigate(`/profile/${userId}/edit`)}
                                        >
                                            프로필 편집
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            onClick={() => navigate('/messages')}
                                        >
                                            메시지 보내기
                                        </Button>
                                    )}
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Stats Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <ArticleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h4" fontWeight="bold">
                                    {stats.postCount}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    게시물
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <CommentIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h4" fontWeight="bold">
                                    {stats.commentCount}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    댓글
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <ThumbUpIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h4" fontWeight="bold">
                                    {stats.receivedLikes}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    받은 좋아요
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <TrendingUpIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h4" fontWeight="bold">
                                    {stats.reputationScore}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    평판 점수
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <PeopleIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h4" fontWeight="bold">
                                    {stats.followerCount}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    팔로워
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <PeopleIcon sx={{ fontSize: 40, mb: 1, color: '#9c27b0' }} />
                                <Typography variant="h4" fontWeight="bold">
                                    {stats.followingCount}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    팔로잉
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Tabs */}
                <Paper sx={{ mb: 3 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
                        <Tab label="개요" />
                        <Tab label="활동" />
                        <Tab label={`배지 (${badges.length})`} />
                    </Tabs>

                    {/* Tab 0: Overview */}
                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    최근 활동
                                </Typography>
                                {activities.length === 0 ? (
                                    <Alert severity="info">아직 활동 내역이 없습니다.</Alert>
                                ) : (
                                    <Stack spacing={2}>
                                        {activities.slice(0, 5).map((activity) => (
                                            <Card key={`${activity.type}-${activity.id}`} variant="outlined">
                                                <CardContent>
                                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                        {activity.type === 'post' ? (
                                                            <ArticleIcon fontSize="small" color="primary" />
                                                        ) : (
                                                            <CommentIcon fontSize="small" color="info" />
                                                        )}
                                                        <Typography variant="caption" color="text.secondary">
                                                            {activity.type === 'post' ? '게시물 작성' : '댓글 작성'} •{' '}
                                                            {formatRelativeTime(activity.createdAt)}
                                                        </Typography>
                                                    </Box>

                                                    {activity.title && (
                                                        <Typography
                                                            variant="subtitle1"
                                                            fontWeight="bold"
                                                            gutterBottom
                                                            component={Link}
                                                            to={`/board/${activity.boardId}/post/${activity.postId}`}
                                                            sx={{ textDecoration: 'none', color: 'inherit' }}
                                                        >
                                                            {activity.title}
                                                        </Typography>
                                                    )}

                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical'
                                                        }}
                                                    >
                                                        {activity.content}
                                                    </Typography>

                                                    {activity.type === 'post' && (
                                                        <Stack direction="row" spacing={2} mt={1}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                <ThumbUpIcon fontSize="inherit" /> {activity.likeCount || 0}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                <CommentIcon fontSize="inherit" /> {activity.commentCount || 0}
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Stack>
                                )}
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab 1: Activity */}
                    <TabPanel value={tabValue} index={1}>
                        <Stack spacing={2}>
                            {activities.length === 0 ? (
                                <Alert severity="info">활동 내역이 없습니다.</Alert>
                            ) : (
                                activities.map((activity) => (
                                    <Card key={`${activity.type}-${activity.id}`} variant="outlined">
                                        <CardContent>
                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                {activity.type === 'post' ? (
                                                    <ArticleIcon fontSize="small" color="primary" />
                                                ) : (
                                                    <CommentIcon fontSize="small" color="info" />
                                                )}
                                                <Typography variant="caption" color="text.secondary">
                                                    {activity.type === 'post' ? '게시물' : '댓글'} • {activity.boardName} •{' '}
                                                    {formatRelativeTime(activity.createdAt)}
                                                </Typography>
                                            </Box>

                                            {activity.title && (
                                                <Typography
                                                    variant="subtitle1"
                                                    fontWeight="bold"
                                                    gutterBottom
                                                    component={Link}
                                                    to={`/board/${activity.boardId}/post/${activity.postId || activity.id}`}
                                                    sx={{ textDecoration: 'none', color: 'inherit' }}
                                                >
                                                    {activity.title}
                                                </Typography>
                                            )}

                                            <Typography variant="body2" color="text.secondary">
                                                {activity.content}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </Stack>
                    </TabPanel>

                    {/* Tab 2: Badges */}
                    <TabPanel value={tabValue} index={2}>
                        {badges.length === 0 ? (
                            <Alert severity="info">아직 획득한 배지가 없습니다.</Alert>
                        ) : (
                            <Grid container spacing={2}>
                                {badges.map((badge) => (
                                    <Grid item xs={12} sm={6} md={4} key={badge.badgeType}>
                                        <Card>
                                            <CardContent sx={{ textAlign: 'center' }}>
                                                <Box sx={{ fontSize: 48, mb: 1 }}>
                                                    {getBadgeIcon(badge.badgeType)}
                                                </Box>
                                                <Typography variant="h6" gutterBottom>
                                                    {badge.badgeName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    {badge.description}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    획득일: {formatDate(badge.earnedAt)}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </TabPanel>
                </Paper>
            </Container>
        </Box>
    );
};

export default ProfilePage;
