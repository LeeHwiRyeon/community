const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 커뮤니티 게임 시스템 클래스
class CommunityGameSystem {
    constructor() {
        this.games = new Map();
        this.gameSessions = new Map();
        this.leaderboards = new Map();
        this.achievements = new Map();
        this.gameIdCounter = 1;
        this.initializeDefaultGames();
        this.initializeAchievements();
    }

    // 기본 게임 초기화
    initializeDefaultGames() {
        const defaultGames = [
            {
                id: 'snake',
                name: 'Snake Game',
                description: '클래식 스네이크 게임',
                category: 'arcade',
                difficulty: 'easy',
                maxPlayers: 1,
                estimatedTime: 300, // 5분
                thumbnail: '/games/snake-thumbnail.png',
                gameUrl: '/games/snake/index.html',
                isActive: true,
                createdAt: new Date(),
                stats: {
                    totalPlays: 0,
                    highScore: 0,
                    averageScore: 0,
                    completionRate: 0
                }
            },
            {
                id: 'tetris',
                name: 'Tetris',
                description: '테트리스 블록 게임',
                category: 'puzzle',
                difficulty: 'medium',
                maxPlayers: 1,
                estimatedTime: 600, // 10분
                thumbnail: '/games/tetris-thumbnail.png',
                gameUrl: '/games/tetris/index.html',
                isActive: true,
                createdAt: new Date(),
                stats: {
                    totalPlays: 0,
                    highScore: 0,
                    averageScore: 0,
                    completionRate: 0
                }
            },
            {
                id: 'pong',
                name: 'Pong',
                description: '클래식 퐁 게임',
                category: 'arcade',
                difficulty: 'easy',
                maxPlayers: 2,
                estimatedTime: 180, // 3분
                thumbnail: '/games/pong-thumbnail.png',
                gameUrl: '/games/pong/index.html',
                isActive: true,
                createdAt: new Date(),
                stats: {
                    totalPlays: 0,
                    highScore: 0,
                    averageScore: 0,
                    completionRate: 0
                }
            },
            {
                id: 'memory',
                name: 'Memory Card Game',
                description: '기억력 테스트 카드 게임',
                category: 'puzzle',
                difficulty: 'easy',
                maxPlayers: 1,
                estimatedTime: 240, // 4분
                thumbnail: '/games/memory-thumbnail.png',
                gameUrl: '/games/memory/index.html',
                isActive: true,
                createdAt: new Date(),
                stats: {
                    totalPlays: 0,
                    highScore: 0,
                    averageScore: 0,
                    completionRate: 0
                }
            },
            {
                id: 'breakout',
                name: 'Breakout',
                description: '벽돌깨기 게임',
                category: 'arcade',
                difficulty: 'medium',
                maxPlayers: 1,
                estimatedTime: 300, // 5분
                thumbnail: '/games/breakout-thumbnail.png',
                gameUrl: '/games/breakout/index.html',
                isActive: true,
                createdAt: new Date(),
                stats: {
                    totalPlays: 0,
                    highScore: 0,
                    averageScore: 0,
                    completionRate: 0
                }
            },
            {
                id: 'quiz',
                name: 'Community Quiz',
                description: '커뮤니티 관련 퀴즈 게임',
                category: 'trivia',
                difficulty: 'medium',
                maxPlayers: 4,
                estimatedTime: 300, // 5분
                thumbnail: '/games/quiz-thumbnail.png',
                gameUrl: '/games/quiz/index.html',
                isActive: true,
                createdAt: new Date(),
                stats: {
                    totalPlays: 0,
                    highScore: 0,
                    averageScore: 0,
                    completionRate: 0
                }
            }
        ];

        defaultGames.forEach(game => {
            this.games.set(game.id, game);
        });
    }

    // 업적 시스템 초기화
    initializeAchievements() {
        const achievements = [
            {
                id: 'first_game',
                name: '첫 게임',
                description: '첫 번째 게임을 완주하세요',
                icon: '🎮',
                points: 10,
                requirement: { type: 'games_played', value: 1 }
            },
            {
                id: 'high_scorer',
                name: '고득점자',
                description: '게임에서 높은 점수를 달성하세요',
                icon: '🏆',
                points: 50,
                requirement: { type: 'high_score', value: 1000 }
            },
            {
                id: 'speed_demon',
                name: '스피드 데몬',
                description: '빠른 시간 내에 게임을 완주하세요',
                icon: '⚡',
                points: 30,
                requirement: { type: 'fast_completion', value: 60 }
            },
            {
                id: 'perfectionist',
                name: '완벽주의자',
                description: '게임을 완벽하게 완주하세요',
                icon: '💎',
                points: 100,
                requirement: { type: 'perfect_score', value: 1 }
            },
            {
                id: 'social_gamer',
                name: '소셜 게이머',
                description: '다른 플레이어와 함께 게임하세요',
                icon: '👥',
                points: 25,
                requirement: { type: 'multiplayer_games', value: 5 }
            }
        ];

        achievements.forEach(achievement => {
            this.achievements.set(achievement.id, achievement);
        });
    }

    // 게임 세션 시작
    startGameSession(gameId, userId, playerCount = 1) {
        const game = this.games.get(gameId);
        if (!game || !game.isActive) {
            return null;
        }

        const sessionId = uuidv4();
        const session = {
            id: sessionId,
            gameId,
            userId,
            playerCount,
            status: 'active',
            startTime: new Date(),
            endTime: null,
            score: 0,
            level: 1,
            lives: game.maxPlayers === 1 ? 3 : 1,
            isMultiplayer: playerCount > 1,
            players: [{ userId, score: 0, isActive: true }],
            gameData: this.initializeGameData(gameId),
            chat: [],
            spectators: []
        };

        this.gameSessions.set(sessionId, session);
        return session;
    }

    // 게임 데이터 초기화
    initializeGameData(gameId) {
        switch (gameId) {
            case 'snake':
                return {
                    snake: [{ x: 10, y: 10 }],
                    direction: 'right',
                    food: { x: 15, y: 15 },
                    score: 0,
                    speed: 150
                };
            case 'tetris':
                return {
                    board: Array(20).fill().map(() => Array(10).fill(0)),
                    currentPiece: null,
                    nextPiece: null,
                    score: 0,
                    lines: 0,
                    level: 1
                };
            case 'pong':
                return {
                    ball: { x: 400, y: 300, dx: 5, dy: 5 },
                    paddle1: { x: 50, y: 250, width: 20, height: 100 },
                    paddle2: { x: 730, y: 250, width: 20, height: 100 },
                    score1: 0,
                    score2: 0
                };
            case 'memory':
                return {
                    cards: this.generateMemoryCards(),
                    flippedCards: [],
                    matchedPairs: 0,
                    moves: 0,
                    time: 0
                };
            case 'breakout':
                return {
                    ball: { x: 400, y: 300, dx: 3, dy: 3 },
                    paddle: { x: 350, y: 550, width: 100, height: 20 },
                    bricks: this.generateBricks(),
                    score: 0,
                    lives: 3
                };
            case 'quiz':
                return {
                    questions: this.generateQuizQuestions(),
                    currentQuestion: 0,
                    answers: [],
                    score: 0,
                    timeLeft: 30
                };
            default:
                return {};
        }
    }

    // 메모리 카드 생성
    generateMemoryCards() {
        const symbols = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
        const cards = [];
        symbols.forEach(symbol => {
            cards.push({ id: Math.random(), symbol, isFlipped: false });
            cards.push({ id: Math.random(), symbol, isFlipped: false });
        });
        return cards.sort(() => Math.random() - 0.5);
    }

    // 벽돌 생성
    generateBricks() {
        const bricks = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 10; col++) {
                bricks.push({
                    x: col * 80 + 10,
                    y: row * 30 + 50,
                    width: 70,
                    height: 20,
                    color: `hsl(${row * 45}, 70%, 50%)`,
                    isDestroyed: false
                });
            }
        }
        return bricks;
    }

    // 퀴즈 문제 생성
    generateQuizQuestions() {
        return [
            {
                question: 'Community Platform 2.0의 주요 특징은?',
                options: ['AI 최적화', '실시간 모니터링', '게임 시스템', '모든 것'],
                correct: 3
            },
            {
                question: '스네이크 게임에서 먹이를 먹으면?',
                options: ['점수 증가', '속도 증가', '길이 증가', '모든 것'],
                correct: 3
            },
            {
                question: '테트리스에서 한 줄을 완성하면?',
                options: ['점수 획득', '줄 제거', '레벨업', '모든 것'],
                correct: 3
            }
        ];
    }

    // 게임 업데이트
    updateGameSession(sessionId, gameData) {
        const session = this.gameSessions.get(sessionId);
        if (!session) return null;

        session.gameData = { ...session.gameData, ...gameData };
        session.score = gameData.score || session.score;
        session.level = gameData.level || session.level;
        session.lives = gameData.lives || session.lives;

        return session;
    }

    // 게임 종료
    endGameSession(sessionId, finalScore, completionTime) {
        const session = this.gameSessions.get(sessionId);
        if (!session) return null;

        session.status = 'completed';
        session.endTime = new Date();
        session.score = finalScore;
        session.completionTime = completionTime;

        // 통계 업데이트
        this.updateGameStats(session.gameId, finalScore, completionTime);

        // 리더보드 업데이트
        this.updateLeaderboard(session.gameId, session.userId, finalScore);

        // 업적 확인
        this.checkAchievements(session.userId, session);

        return session;
    }

    // 게임 통계 업데이트
    updateGameStats(gameId, score, completionTime) {
        const game = this.games.get(gameId);
        if (!game) return;

        game.stats.totalPlays++;
        if (score > game.stats.highScore) {
            game.stats.highScore = score;
        }
        game.stats.averageScore = (game.stats.averageScore + score) / 2;
        if (completionTime < 60) { // 1분 이내 완주
            game.stats.completionRate = (game.stats.completionRate + 1) / 2;
        }
    }

    // 리더보드 업데이트
    updateLeaderboard(gameId, userId, score) {
        if (!this.leaderboards.has(gameId)) {
            this.leaderboards.set(gameId, []);
        }

        const leaderboard = this.leaderboards.get(gameId);
        const existingEntry = leaderboard.find(entry => entry.userId === userId);

        if (existingEntry) {
            if (score > existingEntry.score) {
                existingEntry.score = score;
                existingEntry.updatedAt = new Date();
            }
        } else {
            leaderboard.push({
                userId,
                score,
                rank: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // 순위 재정렬
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });
    }

    // 업적 확인
    checkAchievements(userId, session) {
        const userAchievements = this.getUserAchievements(userId);

        this.achievements.forEach(achievement => {
            if (userAchievements.has(achievement.id)) return;

            let isEarned = false;
            switch (achievement.requirement.type) {
                case 'games_played':
                    isEarned = this.getUserGameCount(userId) >= achievement.requirement.value;
                    break;
                case 'high_score':
                    isEarned = session.score >= achievement.requirement.value;
                    break;
                case 'fast_completion':
                    isEarned = session.completionTime <= achievement.requirement.value;
                    break;
                case 'perfect_score':
                    isEarned = session.score >= 1000; // 완벽한 점수 기준
                    break;
                case 'multiplayer_games':
                    isEarned = this.getUserMultiplayerCount(userId) >= achievement.requirement.value;
                    break;
            }

            if (isEarned) {
                this.awardAchievement(userId, achievement);
            }
        });
    }

    // 업적 수여
    awardAchievement(userId, achievement) {
        const userAchievements = this.getUserAchievements(userId);
        userAchievements.set(achievement.id, {
            ...achievement,
            earnedAt: new Date(),
            points: achievement.points
        });
    }

    // 사용자 업적 조회
    getUserAchievements(userId) {
        if (!this.userAchievements) {
            this.userAchievements = new Map();
        }
        if (!this.userAchievements.has(userId)) {
            this.userAchievements.set(userId, new Map());
        }
        return this.userAchievements.get(userId);
    }

    // 사용자 게임 수 조회
    getUserGameCount(userId) {
        return Array.from(this.gameSessions.values())
            .filter(session => session.userId === userId && session.status === 'completed').length;
    }

    // 사용자 멀티플레이어 게임 수 조회
    getUserMultiplayerCount(userId) {
        return Array.from(this.gameSessions.values())
            .filter(session => session.userId === userId && session.isMultiplayer && session.status === 'completed').length;
    }

    // 게임 목록 조회
    getGames(filters = {}) {
        let games = Array.from(this.games.values());

        if (filters.category) {
            games = games.filter(game => game.category === filters.category);
        }

        if (filters.difficulty) {
            games = games.filter(game => game.difficulty === filters.difficulty);
        }

        if (filters.isActive !== undefined) {
            games = games.filter(game => game.isActive === filters.isActive);
        }

        return games.sort((a, b) => b.stats.totalPlays - a.stats.totalPlays);
    }

    // 리더보드 조회
    getLeaderboard(gameId, limit = 10) {
        const leaderboard = this.leaderboards.get(gameId) || [];
        return leaderboard.slice(0, limit);
    }

    // 게임 통계 조회
    getGameStats() {
        const games = Array.from(this.games.values());
        const sessions = Array.from(this.gameSessions.values());

        return {
            totalGames: games.length,
            activeGames: games.filter(g => g.isActive).length,
            totalSessions: sessions.length,
            activeSessions: sessions.filter(s => s.status === 'active').length,
            completedSessions: sessions.filter(s => s.status === 'completed').length,
            totalPlayers: new Set(sessions.map(s => s.userId)).size,
            averageScore: sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length || 0,
            topGames: games
                .sort((a, b) => b.stats.totalPlays - a.stats.totalPlays)
                .slice(0, 5)
        };
    }
}

// 전역 게임 시스템 인스턴스
const gameSystem = new CommunityGameSystem();

// 미들웨어: 인증 확인
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
    }
    req.user = { id: 'user1', role: 'user' };
    next();
};

// 게임 목록 조회
router.get('/games', async (req, res) => {
    try {
        const { category, difficulty, isActive } = req.query;
        const games = gameSystem.getGames({ category, difficulty, isActive });

        res.json({
            success: true,
            data: games
        });
    } catch (error) {
        console.error('게임 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '게임 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 게임 상세 조회
router.get('/games/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const game = gameSystem.games.get(id);

        if (!game) {
            return res.status(404).json({
                success: false,
                message: '게임을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: game
        });
    } catch (error) {
        console.error('게임 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '게임 상세 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 게임 세션 시작
router.post('/games/:id/start', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { playerCount = 1 } = req.body;

        const session = gameSystem.startGameSession(id, req.user.id, playerCount);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: '게임을 찾을 수 없거나 비활성화되어 있습니다.'
            });
        }

        res.status(201).json({
            success: true,
            message: '게임 세션이 시작되었습니다.',
            data: session
        });
    } catch (error) {
        console.error('게임 세션 시작 오류:', error);
        res.status(500).json({
            success: false,
            message: '게임 세션 시작 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 게임 업데이트
router.put('/sessions/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { gameData } = req.body;

        const session = gameSystem.updateGameSession(id, gameData);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: '게임 세션을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '게임이 업데이트되었습니다.',
            data: session
        });
    } catch (error) {
        console.error('게임 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '게임 업데이트 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 게임 종료
router.post('/sessions/:id/end', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { finalScore, completionTime } = req.body;

        const session = gameSystem.endGameSession(id, finalScore, completionTime);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: '게임 세션을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '게임이 종료되었습니다.',
            data: session
        });
    } catch (error) {
        console.error('게임 종료 오류:', error);
        res.status(500).json({
            success: false,
            message: '게임 종료 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 리더보드 조회
router.get('/leaderboard/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const { limit = 10 } = req.query;

        const leaderboard = gameSystem.getLeaderboard(gameId, parseInt(limit));

        res.json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        console.error('리더보드 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '리더보드 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 업적 조회
router.get('/achievements', authenticateUser, async (req, res) => {
    try {
        const userAchievements = gameSystem.getUserAchievements(req.user.id);
        const achievements = Array.from(userAchievements.values());

        res.json({
            success: true,
            data: achievements
        });
    } catch (error) {
        console.error('업적 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '업적 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 게임 통계 조회
router.get('/stats', async (req, res) => {
    try {
        const stats = gameSystem.getGameStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('게임 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '게임 통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router;
