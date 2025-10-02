import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    Button,
    Chip,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    LinearProgress,
    Divider
} from '@mui/material';
import {
    SportsEsports as GamesIcon,
    EmojiEvents as TrophyIcon,
    Leaderboard as LeaderboardIcon,
    PlayArrow as PlayIcon,
    Star as StarIcon,
    Timer as TimerIcon,
    People as PeopleIcon
} from '@mui/icons-material';

// 게임 데이터 타입 정의
interface Game {
    id: string;
    name: string;
    description: string;
    category: string;
    difficulty: string;
    maxPlayers: number;
    estimatedTime: number;
    thumbnail: string;
    gameUrl: string;
    isActive: boolean;
    stats: {
        totalPlays: number;
        highScore: number;
        averageScore: number;
        completionRate: number;
    };
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: string;
    points: number;
    rarity: string;
    unlockedBy: number;
}

interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    score: number;
    gameId: string;
    achievedAt: string;
}

const GameCenter: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [games, setGames] = useState<Game[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [gameDialogOpen, setGameDialogOpen] = useState(false);

    // 난이도별 색상
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return 'success';
            case 'medium': return 'warning';
            case 'hard': return 'error';
            default: return 'default';
        }
    };

    // 카테고리별 아이콘
    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'arcade': return '🕹️';
            case 'puzzle': return '🧩';
            case 'strategy': return '♟️';
            case 'action': return '⚡';
            case 'racing': return '🏎️';
            default: return '🎮';
        }
    };

    useEffect(() => {
        const loadGameData = async () => {
            try {
                setLoading(true);

                // 게임 목록 로딩
                const gamesResponse = await fetch('/api/community-games/games');
                if (gamesResponse.ok) {
                    const gamesData = await gamesResponse.json();
                    setGames(gamesData.data || []);
                } else {
                    // 모의 게임 데이터
                    setGames([
                        {
                            id: 'snake',
                            name: 'Snake Game',
                            description: '클래식 스네이크 게임 - 먹이를 먹고 길어져라!',
                            category: 'arcade',
                            difficulty: 'easy',
                            maxPlayers: 1,
                            estimatedTime: 300,
                            thumbnail: '/games/snake-thumbnail.png',
                            gameUrl: '/games/snake/index.html',
                            isActive: true,
                            stats: {
                                totalPlays: 1250,
                                highScore: 4850,
                                averageScore: 1200,
                                completionRate: 75
                            }
                        },
                        {
                            id: 'tetris',
                            name: 'Tetris',
                            description: '테트리스 블록 게임 - 라인을 완성하세요!',
                            category: 'puzzle',
                            difficulty: 'medium',
                            maxPlayers: 1,
                            estimatedTime: 600,
                            thumbnail: '/games/tetris-thumbnail.png',
                            gameUrl: '/games/tetris/index.html',
                            isActive: true,
                            stats: {
                                totalPlays: 890,
                                highScore: 125000,
                                averageScore: 25000,
                                completionRate: 60
                            }
                        },
                        {
                            id: 'pong',
                            name: 'Pong',
                            description: '클래식 핑퐁 게임 - 공을 놓치지 마세요!',
                            category: 'arcade',
                            difficulty: 'easy',
                            maxPlayers: 2,
                            estimatedTime: 180,
                            thumbnail: '/games/pong-thumbnail.png',
                            gameUrl: '/games/pong/index.html',
                            isActive: true,
                            stats: {
                                totalPlays: 650,
                                highScore: 21,
                                averageScore: 12,
                                completionRate: 85
                            }
                        },
                        {
                            id: 'breakout',
                            name: 'Breakout',
                            description: '벽돌깨기 게임 - 모든 벽돌을 부수세요!',
                            category: 'arcade',
                            difficulty: 'medium',
                            maxPlayers: 1,
                            estimatedTime: 420,
                            thumbnail: '/games/breakout-thumbnail.png',
                            gameUrl: '/games/breakout/index.html',
                            isActive: true,
                            stats: {
                                totalPlays: 420,
                                highScore: 15600,
                                averageScore: 5200,
                                completionRate: 45
                            }
                        }
                    ]);
                }

                // 업적 로딩
                const achievementsResponse = await fetch('/api/community-games/achievements');
                if (achievementsResponse.ok) {
                    const achievementsData = await achievementsResponse.json();
                    setAchievements(achievementsData.data || []);
                } else {
                    // 모의 업적 데이터
                    setAchievements([
                        {
                            id: 'first_game',
                            name: '첫 게임',
                            description: '첫 번째 게임을 플레이하세요',
                            icon: '🎮',
                            condition: 'play_any_game',
                            points: 10,
                            rarity: 'common',
                            unlockedBy: 1250
                        },
                        {
                            id: 'snake_master',
                            name: '스네이크 마스터',
                            description: '스네이크 게임에서 3000점 이상 획득',
                            icon: '🐍',
                            condition: 'snake_score_3000',
                            points: 50,
                            rarity: 'rare',
                            unlockedBy: 89
                        },
                        {
                            id: 'tetris_legend',
                            name: '테트리스 전설',
                            description: '테트리스에서 100,000점 이상 획득',
                            icon: '🧩',
                            condition: 'tetris_score_100000',
                            points: 100,
                            rarity: 'legendary',
                            unlockedBy: 12
                        },
                        {
                            id: 'daily_player',
                            name: '일일 플레이어',
                            description: '7일 연속 게임 플레이',
                            icon: '📅',
                            condition: 'play_7_days_streak',
                            points: 75,
                            rarity: 'epic',
                            unlockedBy: 156
                        }
                    ]);
                }

                // 리더보드 로딩
                const leaderboardResponse = await fetch('/api/community-games/leaderboard');
                if (leaderboardResponse.ok) {
                    const leaderboardData = await leaderboardResponse.json();
                    setLeaderboard(leaderboardData.data || []);
                } else {
                    // 모의 리더보드 데이터
                    setLeaderboard([
                        { rank: 1, userId: 'user_001', username: 'GameMaster', score: 4850, gameId: 'snake', achievedAt: '2024-10-01T15:30:00Z' },
                        { rank: 2, userId: 'user_002', username: 'TetrisKing', score: 125000, gameId: 'tetris', achievedAt: '2024-10-01T14:20:00Z' },
                        { rank: 3, userId: 'user_003', username: 'ArcadeHero', score: 21, gameId: 'pong', achievedAt: '2024-10-01T13:10:00Z' },
                        { rank: 4, userId: 'user_004', username: 'BlockBreaker', score: 15600, gameId: 'breakout', achievedAt: '2024-10-01T12:00:00Z' },
                        { rank: 5, userId: 'user_005', username: 'RetroGamer', score: 3200, gameId: 'snake', achievedAt: '2024-10-01T11:45:00Z' }
                    ]);
                }

            } catch (err) {
                setError('게임 데이터를 불러오는 중 오류가 발생했습니다.');
                console.error('게임 데이터 로딩 오류:', err);
            } finally {
                setLoading(false);
            }
        };

        loadGameData();
    }, []);

    // 게임 시작
    const startGame = (game: Game) => {
        setSelectedGame(game);
        setGameDialogOpen(true);
    };

    // 게임 실행
    const launchGame = () => {
        if (selectedGame) {
            // 새 창에서 게임 실행
            window.open(selectedGame.gameUrl, '_blank', 'width=800,height=600,scrollbars=no,resizable=no');
            setGameDialogOpen(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                {/* 헤더 */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h3" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GamesIcon sx={{ mr: 2, fontSize: 'inherit' }} />
                        🎮 Game Center
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        커뮤니티 게임을 즐기고 리더보드에서 경쟁하세요!
                    </Typography>
                </Box>

                {/* 탭 네비게이션 */}
                <Card sx={{ mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => setActiveTab(newValue)}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab icon={<GamesIcon />} label="게임 목록" />
                        <Tab icon={<LeaderboardIcon />} label="리더보드" />
                        <Tab icon={<TrophyIcon />} label="업적" />
                    </Tabs>
                </Card>

                {/* 게임 목록 탭 */}
                {activeTab === 0 && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 3 }}>
                        {games.map((game) => (
                            <Card key={game.id} sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
                                <CardContent>
                                    {/* 게임 아이콘 및 상태 */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="h2" component="div">
                                            {getCategoryIcon(game.category)}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Chip
                                                label={game.difficulty}
                                                color={getDifficultyColor(game.difficulty)}
                                                size="small"
                                            />
                                            {game.isActive ? (
                                                <Chip label="활성" color="success" size="small" />
                                            ) : (
                                                <Chip label="점검중" color="default" size="small" />
                                            )}
                                        </Box>
                                    </Box>

                                    {/* 게임 정보 */}
                                    <Typography variant="h5" component="h3" gutterBottom>
                                        {game.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                                        {game.description}
                                    </Typography>

                                    {/* 게임 통계 */}
                                    <Box sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                                                <PeopleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                                {game.stats.totalPlays.toLocaleString()} 플레이
                                            </Typography>
                                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                                                <TimerIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                                {Math.floor(game.estimatedTime / 60)}분
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="caption">최고점수:</Typography>
                                            <Typography variant="caption" fontWeight="bold">
                                                {game.stats.highScore.toLocaleString()}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="caption">완주율: {game.stats.completionRate}%</Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={game.stats.completionRate}
                                                sx={{ height: 4, borderRadius: 2 }}
                                            />
                                        </Box>
                                    </Box>

                                    {/* 플레이 버튼 */}
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        startIcon={<PlayIcon />}
                                        onClick={() => startGame(game)}
                                        disabled={!game.isActive}
                                    >
                                        {game.isActive ? '게임 시작' : '점검중'}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}

                {/* 리더보드 탭 */}
                {activeTab === 1 && (
                    <Card>
                        <CardContent>
                            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <LeaderboardIcon sx={{ mr: 1 }} />
                                🏆 리더보드
                            </Typography>

                            <List>
                                {leaderboard.map((entry, index) => (
                                    <React.Fragment key={`${entry.gameId}-${entry.rank}`}>
                                        <ListItem>
                                            <ListItemAvatar>
                                                <Avatar sx={{
                                                    bgcolor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'primary.main',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][index] : entry.rank}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="h6">{entry.username}</Typography>
                                                        <Typography variant="h6" color="primary.main">
                                                            {entry.score.toLocaleString()}점
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="caption">
                                                            {games.find(g => g.id === entry.gameId)?.name || entry.gameId}
                                                        </Typography>
                                                        <Typography variant="caption">
                                                            {new Date(entry.achievedAt).toLocaleDateString('ko-KR')}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                        {index < leaderboard.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                )}

                {/* 업적 탭 */}
                {activeTab === 2 && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
                        {achievements.map((achievement) => (
                            <Card key={achievement.id} variant="outlined">
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="h2" component="div">
                                            {achievement.icon}
                                        </Typography>
                                        <Chip
                                            label={achievement.rarity}
                                            color={
                                                achievement.rarity === 'legendary' ? 'warning' :
                                                    achievement.rarity === 'epic' ? 'secondary' :
                                                        achievement.rarity === 'rare' ? 'primary' : 'default'
                                            }
                                            size="small"
                                        />
                                    </Box>

                                    <Typography variant="h6" gutterBottom>{achievement.name}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {achievement.description}
                                    </Typography>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                            <StarIcon sx={{ fontSize: 16, mr: 0.5, color: 'warning.main' }} />
                                            {achievement.points}pt
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {achievement.unlockedBy.toLocaleString()}명 달성
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}

                {/* 게임 시작 다이얼로그 */}
                <Dialog open={gameDialogOpen} onClose={() => setGameDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h2" component="span" sx={{ mr: 2 }}>
                            {selectedGame && getCategoryIcon(selectedGame.category)}
                        </Typography>
                        {selectedGame?.name} 시작
                    </DialogTitle>
                    <DialogContent>
                        {selectedGame && (
                            <Box>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    {selectedGame.description}
                                </Typography>

                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                                    <Box>
                                        <Typography variant="caption" display="block">난이도</Typography>
                                        <Chip label={selectedGame.difficulty} color={getDifficultyColor(selectedGame.difficulty)} size="small" />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" display="block">예상 시간</Typography>
                                        <Typography variant="body2">{Math.floor(selectedGame.estimatedTime / 60)}분</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" display="block">최대 플레이어</Typography>
                                        <Typography variant="body2">{selectedGame.maxPlayers}명</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" display="block">최고 점수</Typography>
                                        <Typography variant="body2">{selectedGame.stats.highScore.toLocaleString()}</Typography>
                                    </Box>
                                </Box>

                                <Alert severity="info">
                                    게임이 새 창에서 실행됩니다. 팝업 차단을 해제해주세요.
                                </Alert>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setGameDialogOpen(false)}>취소</Button>
                        <Button variant="contained" onClick={launchGame} startIcon={<PlayIcon />}>
                            게임 시작
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* 푸터 */}
                <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        💡 게임 센터가 실제 API와 연결되었습니다!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        🚀 API 엔드포인트: /api/community-games/* 활용
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default GameCenter;