/**
 * 🎮 커뮤니티 게임 시스템 고도화
 * 
 * 멀티플레이어 게임, 리더보드, 업적 시스템
 * 실시간 게임 대전, 토너먼트, 팀 경쟁
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-01-02
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, CardActions, Button,
    Avatar, Badge, Chip, LinearProgress, Alert, Snackbar, Tooltip,
    Tabs, Tab, List, ListItem, ListItemText, ListItemAvatar, ListItemSecondaryAction,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
    Accordion, AccordionSummary, AccordionDetails, Paper, Stack,
    IconButton, Divider, Rating, Skeleton, CircularProgress, Fab,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
    SportsEsports as GameIcon, EmojiEvents as TrophyIcon,
    Leaderboard as LeaderboardIcon, Group as GroupIcon,
    Timer as TimerIcon, Star as StarIcon, StarBorder as StarBorderIcon,
    PlayArrow as PlayIcon, Pause as PauseIcon, Stop as StopIcon,
    Refresh as RefreshIcon, Settings as SettingsIcon,
    ExpandMore as ExpandMoreIcon, Close as CloseIcon,
    Add as AddIcon, Remove as RemoveIcon, Share as ShareIcon,
    Notifications as NotificationsIcon, Chat as ChatIcon,
    VideoCall as VideoCallIcon, Phone as PhoneIcon
} from '@mui/icons-material';

// 타입 정의
interface Player {
    id: string;
    name: string;
    avatar: string;
    level: number;
    experience: number;
    rank: number;
    totalScore: number;
    gamesPlayed: number;
    winRate: number;
    achievements: Achievement[];
    stats: {
        totalPlayTime: number;
        bestScore: number;
        averageScore: number;
        streak: number;
        lastPlayed: string;
    };
    status: 'online' | 'offline' | 'playing' | 'away';
    currentGame?: string;
}

interface Game {
    id: string;
    name: string;
    description: string;
    type: 'single' | 'multiplayer' | 'tournament' | 'team';
    category: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    maxPlayers: number;
    minPlayers: number;
    duration: number; // in minutes
    rules: string[];
    rewards: {
        experience: number;
        coins: number;
        achievements: string[];
    };
    isActive: boolean;
    currentPlayers: number;
    waitingList: Player[];
    leaderboard: PlayerScore[];
}

interface PlayerScore {
    player: Player;
    score: number;
    rank: number;
    time: number;
    accuracy: number;
    bonus: number;
    total: number;
    timestamp: string;
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'score' | 'time' | 'streak' | 'social' | 'special';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    points: number;
    unlockedAt?: string;
    progress: number;
    maxProgress: number;
    isUnlocked: boolean;
}

interface Tournament {
    id: string;
    name: string;
    description: string;
    game: Game;
    startDate: string;
    endDate: string;
    maxParticipants: number;
    currentParticipants: number;
    entryFee: number;
    prize: {
        first: number;
        second: number;
        third: number;
    };
    status: 'upcoming' | 'active' | 'finished' | 'cancelled';
    participants: Player[];
    bracket: TournamentMatch[];
    winner?: Player;
}

interface TournamentMatch {
    id: string;
    round: number;
    players: Player[];
    winner?: Player;
    score: number[];
    timestamp: string;
    status: 'pending' | 'active' | 'finished';
}

interface CommunityGameSystemProps {
    currentPlayer: Player;
    onGameStart?: (game: Game) => void;
    onGameJoin?: (gameId: string) => void;
    onGameLeave?: (gameId: string) => void;
    onTournamentJoin?: (tournamentId: string) => void;
    onAchievementUnlock?: (achievement: Achievement) => void;
}

const CommunityGameSystem: React.FC<CommunityGameSystemProps> = ({
    currentPlayer,
    onGameStart,
    onGameJoin,
    onGameLeave,
    onTournamentJoin,
    onAchievementUnlock
}) => {
    const [selectedTab, setSelectedTab] = useState(0);
    const [games, setGames] = useState<Game[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [leaderboard, setLeaderboard] = useState<PlayerScore[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);
    const [isTournamentDialogOpen, setIsTournamentDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

    const gameCanvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number>();

    // 게임 데이터 로드
    useEffect(() => {
        loadGameData();
    }, []);

    const loadGameData = useCallback(() => {
        // 실제로는 API에서 데이터를 가져오지만, 여기서는 시뮬레이션
        const mockGames: Game[] = [
            {
                id: 'game_1',
                name: 'Snake Master',
                description: '클래식 스네이크 게임의 고도화 버전',
                type: 'multiplayer',
                category: 'Arcade',
                difficulty: 'medium',
                maxPlayers: 4,
                minPlayers: 1,
                duration: 5,
                rules: ['사과를 먹으면 점수가 올라갑니다', '벽이나 자신의 몸에 부딪히면 게임이 끝납니다'],
                rewards: {
                    experience: 100,
                    coins: 50,
                    achievements: ['first_win', 'high_score']
                },
                isActive: true,
                currentPlayers: 2,
                waitingList: [],
                leaderboard: []
            },
            {
                id: 'game_2',
                name: 'Word Puzzle Challenge',
                description: '단어 퍼즐을 풀어보세요',
                type: 'single',
                category: 'Puzzle',
                difficulty: 'easy',
                maxPlayers: 1,
                minPlayers: 1,
                duration: 10,
                rules: ['주어진 단어를 완성하세요', '시간 내에 더 많은 단어를 만드세요'],
                rewards: {
                    experience: 80,
                    coins: 40,
                    achievements: ['word_master']
                },
                isActive: true,
                currentPlayers: 0,
                waitingList: [],
                leaderboard: []
            }
        ];

        const mockTournaments: Tournament[] = [
            {
                id: 'tournament_1',
                name: 'Snake Championship 2025',
                description: '최고의 스네이크 플레이어를 찾아라!',
                game: mockGames[0],
                startDate: '2025-01-15T10:00:00Z',
                endDate: '2025-01-15T18:00:00Z',
                maxParticipants: 32,
                currentParticipants: 16,
                entryFee: 100,
                prize: {
                    first: 1000,
                    second: 500,
                    third: 250
                },
                status: 'upcoming',
                participants: [],
                bracket: []
            }
        ];

        const mockAchievements: Achievement[] = [
            {
                id: 'achievement_1',
                name: '첫 승리',
                description: '첫 번째 게임에서 승리하세요',
                icon: '🏆',
                category: 'score',
                rarity: 'common',
                points: 10,
                progress: 0,
                maxProgress: 1,
                isUnlocked: false
            },
            {
                id: 'achievement_2',
                name: '연속 승리',
                description: '5번 연속으로 승리하세요',
                icon: '🔥',
                category: 'streak',
                rarity: 'rare',
                points: 50,
                progress: 2,
                maxProgress: 5,
                isUnlocked: false
            }
        ];

        setGames(mockGames);
        setTournaments(mockTournaments);
        setAchievements(mockAchievements);
    }, []);

    // 게임 시작
    const handleGameStart = useCallback((game: Game) => {
        setSelectedGame(game);
        setIsGameDialogOpen(true);
        onGameStart?.(game);
    }, [onGameStart]);

    // 게임 참여
    const handleGameJoin = useCallback((gameId: string) => {
        onGameJoin?.(gameId);
        setSnackbar({ open: true, message: '게임에 참여했습니다!', severity: 'success' });
    }, [onGameJoin]);

    // 토너먼트 참여
    const handleTournamentJoin = useCallback((tournamentId: string) => {
        onTournamentJoin?.(tournamentId);
        setSnackbar({ open: true, message: '토너먼트에 참여했습니다!', severity: 'success' });
    }, [onTournamentJoin]);

    // 게임 카드 컴포넌트
    const GameCard: React.FC<{ game: Game }> = ({ game }) => (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        <GameIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h3">
                            {game.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {game.category} • {game.difficulty}
                        </Typography>
                    </Box>
                    <Chip
                        label={game.type}
                        size="small"
                        color={game.type === 'multiplayer' ? 'primary' : 'default'}
                    />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {game.description}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            플레이어
                        </Typography>
                        <Typography variant="h6">
                            {game.currentPlayers}/{game.maxPlayers}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            시간
                        </Typography>
                        <Typography variant="h6">
                            {game.duration}분
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            보상
                        </Typography>
                        <Typography variant="h6">
                            {game.rewards.experience} XP
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {game.rules.slice(0, 2).map((rule, index) => (
                        <Chip key={index} label={rule} size="small" variant="outlined" />
                    ))}
                </Box>
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box>
                    <IconButton size="small">
                        <ShareIcon />
                    </IconButton>
                </Box>
                <Button
                    size="small"
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={() => handleGameStart(game)}
                    disabled={!game.isActive}
                >
                    {game.currentPlayers >= game.maxPlayers ? '대기열' : '참여'}
                </Button>
            </CardActions>
        </Card>
    );

    // 리더보드 컴포넌트
    const LeaderboardTable: React.FC = () => (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>순위</TableCell>
                        <TableCell>플레이어</TableCell>
                        <TableCell>점수</TableCell>
                        <TableCell>승률</TableCell>
                        <TableCell>레벨</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {leaderboard.map((playerScore, index) => (
                        <TableRow key={playerScore.player.id}>
                            <TableCell>
                                <Typography variant="h6" color="primary">
                                    #{index + 1}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar src={playerScore.player.avatar} sx={{ width: 32, height: 32 }}>
                                        {playerScore.player.name.charAt(0)}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body2" fontWeight="medium">
                                            {playerScore.player.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {playerScore.player.totalScore.toLocaleString()}점
                                        </Typography>
                                    </Box>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                    {playerScore.score.toLocaleString()}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2">
                                    {(playerScore.player.winRate * 100).toFixed(1)}%
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={`Lv.${playerScore.player.level}`}
                                    size="small"
                                    color="primary"
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    // 업적 컴포넌트
    const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => (
        <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            opacity: achievement.isUnlocked ? 1 : 0.6
        }}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h2" sx={{ mb: 1 }}>
                    {achievement.icon}
                </Typography>
                <Typography variant="h6" component="h3" gutterBottom>
                    {achievement.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {achievement.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                    <LinearProgress
                        variant="determinate"
                        value={(achievement.progress / achievement.maxProgress) * 100}
                        sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                        {achievement.progress}/{achievement.maxProgress}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Chip
                        label={achievement.rarity}
                        size="small"
                        color={achievement.rarity === 'legendary' ? 'warning' : 'default'}
                    />
                    <Chip
                        label={`${achievement.points}점`}
                        size="small"
                        variant="outlined"
                    />
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        🎮 커뮤니티 게임 시스템
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        멀티플레이어 게임, 리더보드, 업적 시스템
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadGameData}
                    >
                        새로고침
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                    >
                        설정
                    </Button>
                </Box>
            </Box>

            {/* 플레이어 정보 */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
                <Typography variant="h6" gutterBottom>
                    플레이어 정보
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={currentPlayer.avatar} sx={{ width: 48, height: 48 }}>
                                {currentPlayer.name.charAt(0)}
                            </Avatar>
                            <Box>
                                <Typography variant="h6">
                                    {currentPlayer.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    레벨 {currentPlayer.level}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                            경험치
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={(currentPlayer.experience % 1000) / 10}
                            sx={{ mb: 1 }}
                        />
                        <Typography variant="body2">
                            {currentPlayer.experience} XP
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                            총 점수
                        </Typography>
                        <Typography variant="h6">
                            {currentPlayer.totalScore.toLocaleString()}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                            승률
                        </Typography>
                        <Typography variant="h6">
                            {(currentPlayer.winRate * 100).toFixed(1)}%
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* 탭 네비게이션 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
                    <Tab label="게임 목록" />
                    <Tab label="리더보드" />
                    <Tab label="업적" />
                    <Tab label="토너먼트" />
                </Tabs>
            </Box>

            {/* 탭 컨텐츠 */}
            {selectedTab === 0 && (
                <Grid container spacing={3}>
                    {games.map((game) => (
                        <Grid item xs={12} sm={6} md={4} key={game.id}>
                            <GameCard game={game} />
                        </Grid>
                    ))}
                </Grid>
            )}

            {selectedTab === 1 && (
                <Box>
                    <Typography variant="h5" gutterBottom>
                        리더보드
                    </Typography>
                    <LeaderboardTable />
                </Box>
            )}

            {selectedTab === 2 && (
                <Box>
                    <Typography variant="h5" gutterBottom>
                        업적 시스템
                    </Typography>
                    <Grid container spacing={3}>
                        {achievements.map((achievement) => (
                            <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                                <AchievementCard achievement={achievement} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {selectedTab === 3 && (
                <Box>
                    <Typography variant="h5" gutterBottom>
                        토너먼트
                    </Typography>
                    <Grid container spacing={3}>
                        {tournaments.map((tournament) => (
                            <Grid item xs={12} sm={6} md={4} key={tournament.id}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {tournament.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {tournament.description}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="body2">
                                                참가자: {tournament.currentParticipants}/{tournament.maxParticipants}
                                            </Typography>
                                            <Typography variant="body2">
                                                상금: {tournament.prize.first}코인
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            onClick={() => handleTournamentJoin(tournament.id)}
                                        >
                                            참여하기
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* 게임 다이얼로그 */}
            <Dialog open={isGameDialogOpen} onClose={() => setIsGameDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedGame?.name}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            게임을 시작하시겠습니까?
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {selectedGame?.description}
                        </Typography>
                        <canvas
                            ref={gameCanvasRef}
                            width={400}
                            height={300}
                            style={{ border: '1px solid #ccc', borderRadius: '8px' }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsGameDialogOpen(false)}>취소</Button>
                    <Button variant="contained" onClick={() => {
                        setIsGameDialogOpen(false);
                        handleGameJoin(selectedGame?.id || '');
                    }}>
                        시작
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 스낵바 */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CommunityGameSystem;



