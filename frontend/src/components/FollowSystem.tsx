import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Avatar,
    Button,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Badge,
    Tooltip,
    Divider,
    Paper,
    Grid
} from '@mui/material';
import {
    PersonAdd as FollowIcon,
    PersonRemove as UnfollowIcon,
    Search as SearchIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    TrendingUp as TrendingIcon,
    Notifications as NotificationIcon,
    Settings as SettingsIcon,
    Close as CloseIcon,
    CheckCircle as VerifiedIcon,
    Star as StarIcon,
    Chat as ChatIcon,
    Visibility as ViewIcon,
    ThumbUp as LikeIcon
} from '@mui/icons-material';

interface User {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    bio: string;
    isVerified: boolean;
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    lastActive: string;
    joinDate: string;
    badges: string[];
    level: number;
}

interface FollowSystemProps {
    currentUserId: string;
}

const FollowSystem: React.FC<FollowSystemProps> = ({ currentUserId }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [followers, setFollowers] = useState<User[]>([]);
    const [following, setFollowing] = useState<User[]>([]);
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 샘플 데이터 생성
    useEffect(() => {
        const sampleFollowers: User[] = [
            {
                id: '1',
                username: 'gamer_pro',
                displayName: '게이머 프로',
                avatar: '🎮',
                bio: '게임 리뷰어 | 스트리머 | 게임 개발자',
                isVerified: true,
                isFollowing: false,
                followersCount: 15420,
                followingCount: 234,
                postsCount: 89,
                lastActive: '2시간 전',
                joinDate: '2023-01-15',
                badges: ['🔥', '⭐', '💎'],
                level: 15
            },
            {
                id: '2',
                username: 'cosplay_queen',
                displayName: '코스프레 퀸',
                avatar: '👑',
                bio: '코스프레 모델 | 의상 제작자 | 이벤트 참가자',
                isVerified: true,
                isFollowing: false,
                followersCount: 8750,
                followingCount: 156,
                postsCount: 234,
                lastActive: '1시간 전',
                joinDate: '2023-03-20',
                badges: ['👑', '⭐', '🎨'],
                level: 12
            },
            {
                id: '3',
                username: 'tech_writer',
                displayName: '테크 라이터',
                avatar: '💻',
                bio: '기술 블로거 | 개발자 | IT 컨설턴트',
                isVerified: false,
                isFollowing: false,
                followersCount: 3240,
                followingCount: 89,
                postsCount: 156,
                lastActive: '30분 전',
                joinDate: '2023-06-10',
                badges: ['💻', '📝'],
                level: 8
            }
        ];

        const sampleFollowing: User[] = [
            {
                id: '4',
                username: 'news_anchor',
                displayName: '뉴스 앵커',
                avatar: '📺',
                bio: '뉴스 앵커 | 기자 | 방송인',
                isVerified: true,
                isFollowing: true,
                followersCount: 25600,
                followingCount: 456,
                postsCount: 567,
                lastActive: '5분 전',
                joinDate: '2022-11-05',
                badges: ['📺', '⭐', '💎', '🏆'],
                level: 20
            },
            {
                id: '5',
                username: 'art_director',
                displayName: '아트 디렉터',
                avatar: '🎨',
                bio: 'UI/UX 디자이너 | 아트 디렉터 | 크리에이티브 디렉터',
                isVerified: true,
                isFollowing: true,
                followersCount: 12800,
                followingCount: 234,
                postsCount: 189,
                lastActive: '1시간 전',
                joinDate: '2023-02-14',
                badges: ['🎨', '⭐', '💎'],
                level: 16
            }
        ];

        const sampleSuggestions: User[] = [
            {
                id: '6',
                username: 'music_producer',
                displayName: '뮤직 프로듀서',
                avatar: '🎵',
                bio: '음악 프로듀서 | 작곡가 | 사운드 엔지니어',
                isVerified: true,
                isFollowing: false,
                followersCount: 18900,
                followingCount: 345,
                postsCount: 278,
                lastActive: '3시간 전',
                joinDate: '2022-09-12',
                badges: ['🎵', '⭐', '💎'],
                level: 18
            },
            {
                id: '7',
                username: 'fitness_coach',
                displayName: '피트니스 코치',
                avatar: '💪',
                bio: '피트니스 코치 | 헬스 트레이너 | 영양사',
                isVerified: false,
                isFollowing: false,
                followersCount: 5670,
                followingCount: 123,
                postsCount: 145,
                lastActive: '2시간 전',
                joinDate: '2023-04-08',
                badges: ['💪', '🏃'],
                level: 10
            }
        ];

        setFollowers(sampleFollowers);
        setFollowing(sampleFollowing);
        setSuggestions(sampleSuggestions);
    }, []);

    const handleFollow = async (userId: string) => {
        setIsLoading(true);
        try {
            // API 호출 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 팔로우 상태 업데이트
            setFollowers(prev =>
                prev.map(user =>
                    user.id === userId
                        ? { ...user, isFollowing: !user.isFollowing, followersCount: user.followersCount + (user.isFollowing ? -1 : 1) }
                        : user
                )
            );
            setFollowing(prev =>
                prev.map(user =>
                    user.id === userId
                        ? { ...user, isFollowing: !user.isFollowing, followersCount: user.followersCount + (user.isFollowing ? -1 : 1) }
                        : user
                )
            );
            setSuggestions(prev =>
                prev.map(user =>
                    user.id === userId
                        ? { ...user, isFollowing: !user.isFollowing, followersCount: user.followersCount + (user.isFollowing ? -1 : 1) }
                        : user
                )
            );
        } catch (error) {
            console.error('팔로우 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
        setShowUserDialog(true);
    };

    const filteredUsers = (users: User[]) => {
        if (!searchQuery) return users;
        return users.filter(user =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.bio.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const getLevelColor = (level: number) => {
        if (level >= 20) return '#FF9800'; // 골드
        if (level >= 15) return '#9C27B0'; // 퍼플
        if (level >= 10) return '#2196F3'; // 블루
        if (level >= 5) return '#4CAF50'; // 그린
        return '#9E9E9E'; // 그레이
    };

    const renderUserList = (users: User[], showFollowButton: boolean = true) => (
        <List>
            {filteredUsers(users).map((user, index) => (
                <React.Fragment key={user.id}>
                    <ListItem
                        button
                        onClick={() => handleUserClick(user)}
                        sx={{
                            '&:hover': {
                                bgcolor: 'action.hover'
                            }
                        }}
                    >
                        <ListItemAvatar>
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                badgeContent={
                                    <Box
                                        sx={{
                                            bgcolor: getLevelColor(user.level),
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: 20,
                                            height: 20,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {user.level}
                                    </Box>
                                }
                            >
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    {user.avatar}
                                </Avatar>
                            </Badge>
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle1">
                                        {user.displayName}
                                    </Typography>
                                    {user.isVerified && (
                                        <VerifiedIcon color="primary" fontSize="small" />
                                    )}
                                    <Typography variant="body2" color="text.secondary">
                                        @{user.username}
                                    </Typography>
                                </Box>
                            }
                            secondary={
                                <Box>
                                    <Typography variant="body2" color="text.secondary" noWrap>
                                        {user.bio}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                        <Chip
                                            label={`팔로워 ${user.followersCount.toLocaleString()}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={`팔로잉 ${user.followingCount.toLocaleString()}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={`게시물 ${user.postsCount}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>
                                </Box>
                            }
                        />
                        {showFollowButton && (
                            <ListItemSecondaryAction>
                                <Button
                                    variant={user.isFollowing ? "outlined" : "contained"}
                                    size="small"
                                    startIcon={user.isFollowing ? <UnfollowIcon /> : <FollowIcon />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFollow(user.id);
                                    }}
                                    disabled={isLoading}
                                >
                                    {user.isFollowing ? '언팔로우' : '팔로우'}
                                </Button>
                            </ListItemSecondaryAction>
                        )}
                    </ListItem>
                    {index < filteredUsers(users).length - 1 && <Divider />}
                </React.Fragment>
            ))}
        </List>
    );

    return (
        <Box sx={{ width: '100%' }}>
            {/* 헤더 */}
            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <PeopleIcon color="primary" fontSize="large" />
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            팔로우 시스템
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            사용자를 팔로우하고 새로운 사람들을 만나보세요
                        </Typography>
                    </Box>
                </Box>

                {/* 검색 바 */}
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
                />
            </Paper>

            {/* 탭 */}
            <Paper elevation={1}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant="fullWidth"
                >
                    <Tab
                        icon={<PersonIcon />}
                        label={`팔로워 (${followers.length})`}
                        iconPosition="start"
                    />
                    <Tab
                        icon={<PeopleIcon />}
                        label={`팔로잉 (${following.length})`}
                        iconPosition="start"
                    />
                    <Tab
                        icon={<TrendingIcon />}
                        label={`추천 (${suggestions.length})`}
                        iconPosition="start"
                    />
                </Tabs>

                {/* 탭 콘텐츠 */}
                <Box sx={{ p: 2 }}>
                    {activeTab === 0 && (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon color="primary" />
                                나를 팔로우하는 사용자
                            </Typography>
                            {renderUserList(followers, false)}
                        </Box>
                    )}
                    {activeTab === 1 && (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PeopleIcon color="primary" />
                                내가 팔로우하는 사용자
                            </Typography>
                            {renderUserList(following)}
                        </Box>
                    )}
                    {activeTab === 2 && (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TrendingIcon color="primary" />
                                추천 사용자
                            </Typography>
                            {renderUserList(suggestions)}
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* 사용자 상세 다이얼로그 */}
            <Dialog open={showUserDialog} onClose={() => setShowUserDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {selectedUser?.avatar}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6">
                                {selectedUser?.displayName}
                            </Typography>
                            {selectedUser?.isVerified && (
                                <VerifiedIcon color="primary" />
                            )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            @{selectedUser?.username}
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setShowUserDialog(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {selectedUser && (
                        <Box>
                            <Typography variant="body1" paragraph>
                                {selectedUser.bio}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h5" color="primary">
                                            {selectedUser.followersCount.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            팔로워
                                        </Typography>
                                    </Paper>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h5" color="secondary">
                                            {selectedUser.followingCount.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            팔로잉
                                        </Typography>
                                    </Paper>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h5" color="success.main">
                                            {selectedUser.postsCount}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            게시물
                                        </Typography>
                                    </Paper>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                {selectedUser.badges.map((badge, index) => (
                                    <Tooltip key={index} title={`배지 ${index + 1}`}>
                                        <Chip
                                            label={badge}
                                            size="small"
                                            sx={{ fontSize: '1.2rem' }}
                                        />
                                    </Tooltip>
                                ))}
                            </Box>

                            <Typography variant="body2" color="text.secondary">
                                가입일: {selectedUser.joinDate} | 마지막 활동: {selectedUser.lastActive}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowUserDialog(false)}>닫기</Button>
                    {selectedUser && (
                        <Button
                            variant={selectedUser.isFollowing ? "outlined" : "contained"}
                            startIcon={selectedUser.isFollowing ? <UnfollowIcon /> : <FollowIcon />}
                            onClick={() => {
                                handleFollow(selectedUser.id);
                                setShowUserDialog(false);
                            }}
                            disabled={isLoading}
                        >
                            {selectedUser.isFollowing ? '언팔로우' : '팔로우'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FollowSystem;
