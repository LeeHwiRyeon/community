import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Avatar,
    LinearProgress,
    Chip,
    Button,
        Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Badge,
    Tooltip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';

import {
    Star as StarIcon,
    EmojiEvents as TrophyIcon,
    TrendingUp as LevelUpIcon,
    Person as PersonIcon,
    Chat as ChatIcon,
    ThumbUp as LikeIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Close as CloseIcon,
    CheckCircle as AchievementIcon,
    CheckCircle,
    LocalFireDepartment as FireIcon,
    Diamond as DiamondIcon,
    AutoAwesome as MagicIcon
} from '@mui/icons-material';

// RPG 프로필 타입 정의
interface RPGProfile {
    id: string;
    username: string;
    level: number;
    experience: number;
    experienceToNext: number;
    badges: Badge[];
    stats: UserStats;
    achievements: Achievement[];
    avatar: string;
    title: string;
    joinDate: string;
    lastActive: string;
}

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    earnedDate: string;
}

interface UserStats {
    posts: number;
    comments: number;
    likes: number;
    views: number;
    helpfulness: number;
    activity: number;
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    progress: number;
    maxProgress: number;
    completed: boolean;
    reward: string;
}

const RPGProfileSystem: React.FC = () => {
    const [profile, setProfile] = useState<RPGProfile | null>(null);
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    const [showBadgeDialog, setShowBadgeDialog] = useState(false);

    // 샘플 데이터 생성
    useEffect(() => {
        const sampleProfile: RPGProfile = {
            id: '1',
            username: 'AUTOAGENTS_User',
            level: 15,
            experience: 2450,
            experienceToNext: 500,
            avatar: '🎮',
            title: '커뮤니티 마스터',
            joinDate: '2024-01-15',
            lastActive: '2024-10-04',
            badges: [
                {
                    id: '1',
                    name: '첫 게시물',
                    description: '첫 번째 게시물을 작성했습니다.',
                    icon: '📝',
                    rarity: 'common',
                    earnedDate: '2024-01-15'
                },
                {
                    id: '2',
                    name: '댓글 마스터',
                    description: '100개의 댓글을 작성했습니다.',
                    icon: '💬',
                    rarity: 'rare',
                    earnedDate: '2024-03-20'
                },
                {
                    id: '3',
                    name: '인기 작성자',
                    description: '게시물이 1000번 조회되었습니다.',
                    icon: '🔥',
                    rarity: 'epic',
                    earnedDate: '2024-06-10'
                },
                {
                    id: '4',
                    name: '커뮤니티 레전드',
                    description: '레벨 10에 도달했습니다.',
                    icon: '👑',
                    rarity: 'legendary',
                    earnedDate: '2024-08-15'
                }
            ],
            stats: {
                posts: 45,
                comments: 156,
                likes: 892,
                views: 2340,
                helpfulness: 95,
                activity: 88
            },
            achievements: [
                {
                    id: '1',
                    name: '게시물 작성자',
                    description: '50개의 게시물을 작성하세요',
                    icon: '📝',
                    progress: 45,
                    maxProgress: 50,
                    completed: false,
                    reward: '경험치 +100'
                },
                {
                    id: '2',
                    name: '댓글 왕',
                    description: '200개의 댓글을 작성하세요',
                    icon: '💬',
                    progress: 156,
                    maxProgress: 200,
                    completed: false,
                    reward: '배지: 댓글 마스터'
                },
                {
                    id: '3',
                    name: '인기 인물',
                    description: '게시물이 5000번 조회되세요',
                    icon: '👀',
                    progress: 2340,
                    maxProgress: 5000,
                    completed: false,
                    reward: '경험치 +500'
                },
                {
                    id: '4',
                    name: '도움의 손길',
                    description: '도움됨 점수 100점 달성',
                    icon: '🤝',
                    progress: 95,
                    maxProgress: 100,
                    completed: false,
                    reward: '배지: 도움의 천사'
                }
            ]
        };
        setProfile(sampleProfile);
    }, []);

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return '#9E9E9E';
            case 'rare': return '#2196F3';
            case 'epic': return '#9C27B0';
            case 'legendary': return '#FF9800';
            default: return '#9E9E9E';
        }
    };

    const getLevelColor = (level: number) => {
        if (level >= 20) return '#FF9800'; // 골드
        if (level >= 15) return '#9C27B0'; // 퍼플
        if (level >= 10) return '#2196F3'; // 블루
        if (level >= 5) return '#4CAF50'; // 그린
        return '#9E9E9E'; // 그레이
    };

    const handleBadgeClick = (badge: Badge) => {
        setSelectedBadge(badge);
        setShowBadgeDialog(true);
    };

    if (!profile) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <Typography>프로필을 불러오는 중...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* 프로필 헤더 */}
            <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${getLevelColor(profile.level)}20 0%, ${getLevelColor(profile.level)}40 100%)` }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                                <Box
                                    sx={{
                                        bgcolor: getLevelColor(profile.level),
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: 24,
                                        height: 24,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {profile.level}
                                </Box>
                            }
                        >
                            <Avatar
                                sx={{
                                    width: 80,
                                    height: 80,
                                    fontSize: '2rem',
                                    bgcolor: getLevelColor(profile.level),
                                    border: `3px solid ${getLevelColor(profile.level)}`
                                }}
                            >
                                {profile.avatar}
                            </Avatar>
                        </Badge>
                        <Box sx={{ ml: 3 }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: getLevelColor(profile.level) }}>
                                {profile.username}
                            </Typography>
                            <Typography variant="h6" color="text.secondary">
                                {profile.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                가입일: {profile.joinDate} | 마지막 활동: {profile.lastActive}
                            </Typography>
                        </Box>
                    </Box>

                    {/* 경험치 바 */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                경험치: {profile.experience.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                다음 레벨까지: {profile.experienceToNext.toLocaleString()}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={(profile.experience / (profile.experience + profile.experienceToNext)) * 100}
                            sx={{
                                height: 12,
                                borderRadius: 6,
                                bgcolor: 'rgba(0,0,0,0.1)',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: getLevelColor(profile.level),
                                    borderRadius: 6
                                }
                            }}
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* 통계 카드 */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                            {profile.stats.posts}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            게시물
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="secondary">
                            {profile.stats.comments}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            댓글
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                            {profile.stats.likes}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            좋아요
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                            {profile.stats.views}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            조회수
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* 배지 섹션 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrophyIcon color="primary" />
                        획득한 배지 ({profile.badges.length}개)
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {profile.badges.map((badge) => (
                            <Tooltip key={badge.id} title={badge.description}>
                                <Chip
                                    icon={<span style={{ fontSize: '1.2rem' }}>{badge.icon}</span>}
                                    label={badge.name}
                                    onClick={() => handleBadgeClick(badge)}
                                    sx={{
                                        bgcolor: `${getRarityColor(badge.rarity)}20`,
                                        color: getRarityColor(badge.rarity),
                                        border: `2px solid ${getRarityColor(badge.rarity)}`,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            bgcolor: `${getRarityColor(badge.rarity)}30`
                                        }
                                    }}
                                />
                            </Tooltip>
                        ))}
                    </Box>
                </CardContent>
            </Card>

            {/* 업적 섹션 */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AchievementIcon color="primary" />
                        진행 중인 업적
                    </Typography>
                    <List>
                        {profile.achievements.map((achievement, index) => (
                            <React.Fragment key={achievement.id}>
                                <ListItem>
                                    <ListItemIcon>
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                bgcolor: achievement.completed ? 'success.main' : 'grey.300',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.5rem'
                                            }}
                                        >
                                            {achievement.completed ? '✅' : achievement.icon}
                                        </Box>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle1">
                                                    {achievement.name}
                                                </Typography>
                                                {achievement.completed && (
                                                    <Chip
                                                        label="완료"
                                                        size="small"
                                                        color="success"
                                                        icon={<CheckCircle />}
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {achievement.description}
                                                </Typography>
                                                <Box sx={{ mt: 1 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="caption">
                                                            {achievement.progress} / {achievement.maxProgress}
                                                        </Typography>
                                                        <Typography variant="caption" color="primary">
                                                            {achievement.reward}
                                                        </Typography>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={(achievement.progress / achievement.maxProgress) * 100}
                                                        sx={{ height: 6, borderRadius: 3 }}
                                                    />
                                                </Box>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < profile.achievements.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </CardContent>
            </Card>

            {/* 배지 상세 다이얼로그 */}
            <Dialog open={showBadgeDialog} onClose={() => setShowBadgeDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontSize: '1.5rem' }}>{selectedBadge?.icon}</span>
                    {selectedBadge?.name}
                    <Chip
                        label={selectedBadge?.rarity.toUpperCase()}
                        size="small"
                        sx={{
                            bgcolor: `${getRarityColor(selectedBadge?.rarity || 'common')}20`,
                            color: getRarityColor(selectedBadge?.rarity || 'common'),
                            ml: 'auto'
                        }}
                    />
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" paragraph>
                        {selectedBadge?.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        획득일: {selectedBadge?.earnedDate}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowBadgeDialog(false)}>닫기</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RPGProfileSystem;
