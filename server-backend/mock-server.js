// 완전한 목업 데이터 제공을 위한 스크립트
import express from 'express';
import cors from 'cors';
import { randomPosts, randomMessages, generateRandomPost, generateRandomMessage } from './random-data.js';

const app = express();
const PORT = 50000;

app.use(cors({
    origin: ['http://localhost:5000', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// 목업 데이터
const mockBoards = [
    { id: 'free', title: '자유게시판', ordering: 1, deleted: 0 },
    { id: 'news', title: '게임뉴스', ordering: 2, deleted: 0 },
    { id: 'game', title: '게임토론', ordering: 3, deleted: 0 },
    { id: 'image', title: '이미지', ordering: 4, deleted: 0 }
];

const mockPosts = [
    {
        id: '1',
        board_id: 'news',
        title: 'League of Legends 2024 World Championship Finals',
        content: 'T1이 4년 만에 월드 챔피언십 타이틀을 차지했습니다. Faker의 완벽한 게임플레이와 팀 조화가 토너먼트 전반에 걸쳐 빛을 발했습니다.',
        author: 'GameNews',
        category: 'LOL',
        date: '2024-01-15',
        views: 12543,
        comments_count: 89,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
    },
    {
        id: '2',
        board_id: 'news',
        title: 'StarCraft II 새로운 확장팩 발표',
        content: '블리자드가 공식적으로 StarCraft II의 새로운 확장팩을 발표했습니다. 프로토스, 테란, 저그에 이어 네 번째 종족이 도입될 것으로 예상됩니다.',
        author: 'Editorial Team',
        category: 'StarCraft',
        date: '2024-01-15',
        views: 8234,
        comments_count: 156,
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z'
    },
    {
        id: '3',
        board_id: 'news',
        title: 'Valorant 새 맵 스크린샷 공개',
        content: '라이엇 게임즈가 새로운 Valorant 맵의 공식 스크린샷을 공개했습니다. 이 맵은 도시와 자연 환경을 결합한 독특한 디자인이 특징입니다.',
        author: 'News Team',
        category: 'Valorant',
        date: '2024-01-15',
        views: 5678,
        comments_count: 78,
        created_at: '2024-01-15T08:00:00Z',
        updated_at: '2024-01-15T08:00:00Z'
    },
    {
        id: '4',
        board_id: 'game',
        title: 'Genshin Impact 새 캐릭터 아트워크',
        content: 'miHoYo가 다가오는 Genshin Impact 업데이트에서 등장할 새 캐릭터의 아트워크를 공개했습니다.',
        author: 'News Team',
        category: 'Genshin',
        date: '2024-01-15',
        views: 9876,
        comments_count: 234,
        created_at: '2024-01-15T07:00:00Z',
        updated_at: '2024-01-15T07:00:00Z'
    },
    ...randomPosts // 랜덤 생성된 100개 게시글 추가
];

const mockUsers = [
    {
        id: 1,
        display_name: 'TestUser',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
        identities: [
            { provider: 'google', provider_user_id: 'test123' }
        ]
    }
];

const mockMessages = [
    {
        id: 'msg1',
        room_id: 'test',
        username: 'TestUser',
        content: '안녕하세요! 테스트 메시지입니다.',
        created_at: new Date().toISOString()
    },
    {
        id: 'msg2',
        room_id: 'test',
        username: 'GameBot',
        content: '게임 커뮤니티에 오신 것을 환영합니다!',
        created_at: new Date(Date.now() - 60000).toISOString()
    },
    ...randomMessages // 랜덤 생성된 50개 메시지 추가
];

// API 엔드포인트들
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        ts: Date.now(),
        server: 'mock-server',
        mode: 'full-mock'
    });
});

app.get('/api/boards', (req, res) => {
    console.log('GET /api/boards called, mockBoards:', mockBoards.map(b => ({ id: b.id, deleted: b.deleted })));
    const activeBoards = mockBoards.filter(b => b.deleted === 0);
    console.log('GET /api/boards returning:', activeBoards.map(b => b.id));
    res.json(activeBoards);
});

app.post('/api/boards', (req, res) => {
    const { id, title } = req.body;
    const newBoard = {
        id,
        title,
        ordering: mockBoards.length + 1,
        deleted: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    mockBoards.push(newBoard);
    console.log('POST /api/boards created board:', newBoard.id);
    res.status(201).json(newBoard);
});

app.get('/api/posts', (req, res) => {
    const { board_id, limit = 20, offset = 0, sort = 'created_at' } = req.query;
    let posts = mockPosts;
    
    if (board_id) {
        posts = posts.filter(p => p.board_id === board_id);
    }
    
    if (sort === 'views') {
        posts = posts.sort((a, b) => b.views - a.views);
    } else {
        posts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    const total = posts.length;
    const start = parseInt(offset) || 0;
    const lim = parseInt(limit) || 20;
    posts = posts.slice(start, start + lim + 1); // +1 to check hasMore
    const hasMore = posts.length > lim;
    if (hasMore) posts = posts.slice(0, lim);
    
    res.json({ items: posts, total, offset: start, limit: lim, hasMore });
});

app.get('/api/posts/:id', (req, res) => {
    const post = mockPosts.find(p => p.id === req.params.id);
    if (post) {
        res.json(post);
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

app.get('/api/boards/:boardId/posts', (req, res) => {
    const { limit = 20, offset = 0, sort = 'created_at', q } = req.query;
    let posts = mockPosts.filter(p => p.board_id === req.params.boardId && p.deleted !== 1);
    
    // 검색 기능
    if (q && q.trim()) {
        const searchTerm = q.toLowerCase().trim();
        posts = posts.filter(p => 
            p.title.toLowerCase().includes(searchTerm) || 
            p.content.toLowerCase().includes(searchTerm)
        );
    }
    
    if (sort === 'views') {
        posts = posts.sort((a, b) => b.views - a.views);
    } else {
        posts = posts.sort((a, b) => {
            // 실제 서버처럼 date DESC, created_at DESC로 정렬
            const aDate = a.date || a.created_at;
            const bDate = b.date || b.created_at;
            if (aDate !== bDate) {
                return new Date(bDate) - new Date(aDate);
            }
            return new Date(b.created_at) - new Date(a.created_at);
        });
    }
    
    const total = posts.length;
    const start = parseInt(offset) || 0;
    const lim = parseInt(limit) || 20;
    posts = posts.slice(start, start + lim + 1); // +1 to check hasMore
    const hasMore = posts.length > lim;
    if (hasMore) posts = posts.slice(0, lim);
    
    res.json({ items: posts, total, offset: start, limit: lim, hasMore });
});

app.post('/api/boards/:boardId/posts', (req, res) => {
    const { title, content } = req.body;
    const newPost = {
        id: Date.now().toString(),
        board_id: req.params.boardId,
        title,
        content,
        author: 'TestUser',
        category: 'General',
        date: new Date().toISOString().split('T')[0],
        views: 0,
        comments_count: 0,
        deleted: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    mockPosts.unshift(newPost);
    res.status(201).json(newPost);
});

app.patch('/api/posts/:pid', (req, res) => {
    const { title, content } = req.body;
    const post = mockPosts.find(p => p.id === req.params.pid);
    if (post) {
        if (title !== undefined) post.title = title;
        if (content !== undefined) post.content = content;
        post.updated_at = new Date().toISOString();
        res.json(post);
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

app.post('/api/posts/:pid/view', (req, res) => {
    const post = mockPosts.find(p => p.id === req.params.pid);
    if (post) {
        post.views = (post.views || 0) + 1;
        res.json({ ok: true, buffered: true });
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

app.delete('/api/boards/:boardId/posts/:pid', (req, res) => {
    const post = mockPosts.find(p => p.id === req.params.pid);
    if (post) {
        post.deleted = 1;
        res.json({ ok: true });
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

app.delete('/api/boards/:boardId', (req, res) => {
    const board = mockBoards.find(b => b.id === req.params.boardId);
    if (board) {
        board.deleted = 1;
        res.json({ ok: true });
    } else {
        res.status(404).json({ error: 'Board not found' });
    }
});

app.get('/api/trending', (req, res) => {
    const trending = mockPosts
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
        .map(p => ({
            id: p.id,
            title: p.title,
            views: p.views,
            category: p.category
        }));
    
    res.json({
        source: 'mock',
        posts: trending,
        timestamp: Date.now()
    });
});

app.get('/api/categories', (req, res) => {
    res.json({
        categories: ['LOL', 'StarCraft', 'Valorant', 'Genshin', 'General']
    });
});

app.get('/api/posts-map', (req, res) => {
    const map = {};
    // 모든 보드에 대해 빈 배열 초기화
    mockBoards.forEach(board => {
        map[board.id] = [];
    });
    mockPosts.filter(p => p.deleted !== 1).forEach(p => {
        if (!map[p.board_id]) map[p.board_id] = [];
        map[p.board_id].push(p);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)));
    res.json(map);
});

// 채팅 API
app.get('/api/chat/:room/messages', (req, res) => {
    const roomMessages = mockMessages.filter(m => m.room_id === req.params.room || req.params.room === 'test');
    res.json({ messages: roomMessages });
});

app.post('/api/chat/:room/messages', (req, res) => {
    const { content, author } = req.body;
    const newMessage = {
        id: Date.now().toString(),
        room_id: req.params.room,
        username: author || 'Anonymous',
        content,
        created_at: new Date().toISOString()
    };
    mockMessages.unshift(newMessage);
    res.json({ message: newMessage });
});

// 인증 API
app.post('/api/auth/google', (req, res) => {
    res.json({
        access: 'mock-token-' + Date.now(),
        user: mockUsers[0]
    });
});

app.get('/api/auth/me', (req, res) => {
    res.json({
        user: mockUsers[0]
    });
});

// 메트릭스 API
app.get('/api/metrics', (req, res) => {
    res.json({
        ok: true,
        uptimeSec: Math.floor(Date.now() / 1000),
        boards: mockBoards.length,
        posts: mockPosts.length,
        rlWriteBlocked: 0,
        rlSearchBlocked: 0,
        keepaliveFail: 0,
        lastKeepaliveOk: null,
        lastKeepaliveError: null,
        dbSampleLatencyMs: 5,
        memory: process.memoryUsage(),
        viewBufferedAdds: 0,
        viewFlushBatches: 0,
        viewFlushRows: 0,
        viewFlushFailures: 0,
        viewForcedFlushes: 0,
        viewBackoffRetries: 0,
        viewFlushDropped: 0,
        chat: {
            posted: 0,
            fetched: 0,
            roomsListed: 0,
            communitiesListed: 0,
            clears: 0,
            redisTrim: 0
        },
        clientMetric: {
            attempts: 0,
            accepted: 0,
            rateLimited: 0,
            discardNoMetrics: 0,
            discardAllNull: 0,
            bytes: 0,
            exportAttempts: 0,
            exportSuccess: 0,
            exportFail: 0
        },
        clientSummary: {}
    });
});

// Prometheus 메트릭스 API (텍스트 포맷)
app.get('/api/metrics-prom', (req, res) => {
    const lines = [];
    const uptimeSec = Math.floor(Date.now() / 1000);

    // Uptime
    lines.push('# HELP app_uptime_seconds Application uptime in seconds');
    lines.push('# TYPE app_uptime_seconds gauge');
    lines.push(`app_uptime_seconds ${uptimeSec}`);

    // Boards count
    lines.push('# HELP app_boards Boards count');
    lines.push('# TYPE app_boards gauge');
    lines.push(`app_boards ${mockBoards.length}`);

    // Posts count
    lines.push('# HELP app_posts Posts count');
    lines.push('# TYPE app_posts gauge');
    lines.push(`app_posts ${mockPosts.length}`);

    // Rate limiting
    lines.push('# HELP app_rl_write_blocked Rate limited write requests');
    lines.push('# TYPE app_rl_write_blocked counter');
    lines.push('app_rl_write_blocked 0');

    lines.push('# HELP app_rl_search_blocked Rate limited search requests');
    lines.push('# TYPE app_rl_search_blocked counter');
    lines.push('app_rl_search_blocked 0');

    // Keepalive
    lines.push('# HELP app_keepalive_fail Keepalive failure count');
    lines.push('# TYPE app_keepalive_fail counter');
    lines.push('app_keepalive_fail 0');

    // View buffer metrics
    lines.push('# HELP app_view_buffered_adds Buffered view increments');
    lines.push('# TYPE app_view_buffered_adds counter');
    lines.push('app_view_buffered_adds 0');

    lines.push('# HELP app_view_flush_batches View flush batch count');
    lines.push('# TYPE app_view_flush_batches counter');
    lines.push('app_view_flush_batches 0');

    lines.push('# HELP app_view_flush_rows Distinct post rows flushed');
    lines.push('# TYPE app_view_flush_rows counter');
    lines.push('app_view_flush_rows 0');

    lines.push('# HELP app_view_flush_failures View flush batch failure count');
    lines.push('# TYPE app_view_flush_failures counter');
    lines.push('app_view_flush_failures 0');

    lines.push('# HELP app_view_forced_flushes Forced flush triggers due to total threshold');
    lines.push('# TYPE app_view_forced_flushes counter');
    lines.push('app_view_forced_flushes 0');

    lines.push('# HELP app_view_backoff_retries Backoff retry attempts for failed flush');
    lines.push('# TYPE app_view_backoff_retries counter');
    lines.push('app_view_backoff_retries 0');

    lines.push('# HELP app_view_flush_dropped Estimated dropped view increments');
    lines.push('# TYPE app_view_flush_dropped counter');
    lines.push('app_view_flush_dropped 0');

    // Auth counters
    lines.push('# HELP auth_login_success Authentication login success count');
    lines.push('# TYPE auth_login_success counter');
    lines.push('auth_login_success 0');

    lines.push('# HELP auth_login_fail Authentication login failure count');
    lines.push('# TYPE auth_login_fail counter');
    lines.push('auth_login_fail 0');

    lines.push('# HELP auth_refresh_success Authentication refresh success count');
    lines.push('# TYPE auth_refresh_success counter');
    lines.push('auth_refresh_success 0');

    lines.push('# HELP auth_link_success Account linking success count');
    lines.push('# TYPE auth_link_success counter');
    lines.push('auth_link_success 0');

    // Chat counters
    lines.push('# HELP chat_messages_posted Chat messages posted');
    lines.push('# TYPE chat_messages_posted counter');
    lines.push('chat_messages_posted 0');

    lines.push('# HELP chat_messages_fetched Chat message list fetches (db fallback path included)');
    lines.push('# TYPE chat_messages_fetched counter');
    lines.push('chat_messages_fetched 0');

    lines.push('# HELP chat_rooms_listed Chat rooms listed');
    lines.push('# TYPE chat_rooms_listed counter');
    lines.push('chat_rooms_listed 0');

    lines.push('# HELP chat_communities_listed Chat communities listed');
    lines.push('# TYPE chat_communities_listed counter');
    lines.push('chat_communities_listed 0');

    lines.push('# HELP chat_clears Chat history clear operations');
    lines.push('# TYPE chat_clears counter');
    lines.push('chat_clears 0');

    lines.push('# HELP chat_redis_trim Chat redis list trim operations');
    lines.push('# TYPE chat_redis_trim counter');
    lines.push('chat_redis_trim 0');

    // Client metric counters
    lines.push('# HELP client_metric_export_attempts Client metric export attempt count');
    lines.push('# TYPE client_metric_export_attempts counter');
    lines.push('client_metric_export_attempts 0');

    lines.push('# HELP client_metric_export_success Client metric export success count');
    lines.push('# TYPE client_metric_export_success counter');
    lines.push('client_metric_export_success 0');

    lines.push('# HELP client_metric_export_fail Client metric export failure count');
    lines.push('# TYPE client_metric_export_fail counter');
    lines.push('client_metric_export_fail 0');

    lines.push('# HELP client_metric_attempts Client metric ingestion attempts');
    lines.push('# TYPE client_metric_attempts counter');
    lines.push('client_metric_attempts 0');

    lines.push('# HELP client_metric_accepted Client metric accepted count');
    lines.push('# TYPE client_metric_accepted counter');
    lines.push('client_metric_accepted 0');

    lines.push('# HELP client_metric_rate_limited Client metric rate limited count');
    lines.push('# TYPE client_metric_rate_limited counter');
    lines.push('client_metric_rate_limited 0');

    lines.push('# HELP client_metric_discard_no_metrics Client metric discarded (no metrics field)');
    lines.push('# TYPE client_metric_discard_no_metrics counter');
    lines.push('client_metric_discard_no_metrics 0');

    lines.push('# HELP client_metric_discard_all_null Client metric discarded (all values null)');
    lines.push('# TYPE client_metric_discard_all_null counter');
    lines.push('client_metric_discard_all_null 0');

    lines.push('# HELP client_metric_bytes Client metric payload bytes cumulative');
    lines.push('# TYPE client_metric_bytes counter');
    lines.push('client_metric_bytes 0');

    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(lines.join('\n'));
});

app.get('/api/help', (req, res) => {
    res.json({
        endpoints: {
            '/api/health': 'GET - 서버 상태 확인',
            '/api/boards': 'GET - 게시판 목록',
            '/api/posts': 'GET - 게시글 목록',
            '/api/trending': 'GET - 인기 게시글',
            '/api/chat/:room/messages': 'GET/POST - 채팅'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Mock Server running at http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api/help`);
    console.log(`🎯 All endpoints return realistic mock data`);
});