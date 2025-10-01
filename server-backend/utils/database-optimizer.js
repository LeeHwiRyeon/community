const mysql = require('mysql2/promise');
const { performanceMonitor } = require('./performance-monitor');

// 데이터베이스 연결 풀 설정
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'community_platform',
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    idleTimeout: 300000,
    charset: 'utf8mb4',
    timezone: '+00:00'
};

// 연결 풀 생성
const pool = mysql.createPool(poolConfig);

// 데이터베이스 최적화 클래스
class DatabaseOptimizer {
    constructor() {
        this.pool = pool;
        this.queryCache = new Map();
        this.cacheTimeout = 300000; // 5분
    }

    // 최적화된 쿼리 실행
    async executeQuery(query, params = [], options = {}) {
        const {
            queryType = 'SELECT',
            table = 'unknown',
            useCache = false,
            cacheKey = null,
            cacheTTL = 300000
        } = options;

        // 캐시 확인
        if (useCache && cacheKey) {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // 쿼리 실행 및 시간 측정
        const result = await performanceMonitor.measureDatabaseQuery(
            queryType,
            table,
            () => this.pool.execute(query, params)
        );

        // 캐시 저장
        if (useCache && cacheKey) {
            this.setCache(cacheKey, result, cacheTTL);
        }

        return result;
    }

    // 캐시 관리
    getFromCache(key) {
        const cached = this.queryCache.get(key);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return cached.data;
        }
        this.queryCache.delete(key);
        return null;
    }

    setCache(key, data, ttl = this.cacheTimeout) {
        this.queryCache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    // 인덱스 최적화
    async optimizeIndexes() {
        const indexes = [
            // 게시글 관련 인덱스
            'CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_posts_board_id ON posts(board_id)',
            'CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)',
            'CREATE INDEX IF NOT EXISTS idx_posts_board_created ON posts(board_id, created_at)',
            'CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at)',

            // 댓글 관련 인덱스
            'CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)',
            'CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at)',

            // 사용자 관련 인덱스
            'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
            'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',

            // 게시판 관련 인덱스
            'CREATE INDEX IF NOT EXISTS idx_boards_created_at ON boards(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_boards_status ON boards(status)',

            // 파일 관련 인덱스
            'CREATE INDEX IF NOT EXISTS idx_files_post_id ON files(post_id)',
            'CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at)',

            // 채팅 관련 인덱스
            'CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id)',
            'CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at)',

            // 게임 관련 인덱스
            'CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_game_scores_game_type ON game_scores(game_type)',
            'CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score)',
            'CREATE INDEX IF NOT EXISTS idx_game_scores_created_at ON game_scores(created_at)',

            // VIP 관련 인덱스
            'CREATE INDEX IF NOT EXISTS idx_vip_users_tier ON vip_users(tier)',
            'CREATE INDEX IF NOT EXISTS idx_vip_users_created_at ON vip_users(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_vip_requirements_status ON vip_requirements(status)',
            'CREATE INDEX IF NOT EXISTS idx_vip_requirements_created_at ON vip_requirements(created_at)'
        ];

        console.log('🔧 데이터베이스 인덱스 최적화 시작...');

        for (const indexQuery of indexes) {
            try {
                await this.pool.execute(indexQuery);
                console.log(`✅ 인덱스 생성 완료: ${indexQuery.split(' ')[5]}`);
            } catch (error) {
                if (error.code !== 'ER_DUP_KEYNAME') {
                    console.error(`❌ 인덱스 생성 실패: ${error.message}`);
                }
            }
        }

        console.log('🎉 데이터베이스 인덱스 최적화 완료!');
    }

    // 쿼리 성능 분석
    async analyzeQueryPerformance() {
        console.log('📊 쿼리 성능 분석 시작...');

        // 슬로우 쿼리 로그 활성화
        await this.pool.execute('SET GLOBAL slow_query_log = "ON"');
        await this.pool.execute('SET GLOBAL long_query_time = 1');
        await this.pool.execute('SET GLOBAL log_queries_not_using_indexes = "ON"');

        // 테이블 통계 업데이트
        await this.pool.execute('ANALYZE TABLE posts, comments, users, boards, files, chat_messages, game_scores, vip_users, vip_requirements');

        // 인덱스 사용률 확인
        const indexUsage = await this.pool.execute(`
      SELECT 
        TABLE_NAME,
        INDEX_NAME,
        CARDINALITY,
        SUB_PART,
        PACKED,
        NULLABLE,
        INDEX_TYPE
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME, CARDINALITY DESC
    `, [process.env.DB_NAME || 'community_platform']);

        console.log('📈 인덱스 사용률:');
        console.table(indexUsage[0]);

        // 테이블 크기 확인
        const tableSizes = await this.pool.execute(`
      SELECT 
        TABLE_NAME,
        ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Size (MB)',
        TABLE_ROWS
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
    `, [process.env.DB_NAME || 'community_platform']);

        console.log('📊 테이블 크기:');
        console.table(tableSizes[0]);

        console.log('✅ 쿼리 성능 분석 완료!');
    }

    // 연결 풀 상태 확인
    async getPoolStatus() {
        const status = {
            totalConnections: this.pool.pool._allConnections.length,
            freeConnections: this.pool.pool._freeConnections.length,
            acquiringConnections: this.pool.pool._acquiringConnections.length,
            allConnections: this.pool.pool._allConnections.length,
            config: {
                connectionLimit: this.pool.pool.config.connectionLimit,
                acquireTimeout: this.pool.pool.config.acquireTimeout,
                timeout: this.pool.pool.config.timeout
            }
        };

        return status;
    }

    // 연결 풀 최적화
    async optimizePool() {
        console.log('🔧 연결 풀 최적화 시작...');

        // 현재 상태 확인
        const currentStatus = await this.getPoolStatus();
        console.log('현재 연결 풀 상태:', currentStatus);

        // 연결 풀 설정 조정
        const optimizedConfig = {
            ...poolConfig,
            connectionLimit: Math.min(100, Math.max(10, currentStatus.totalConnections * 2)),
            acquireTimeout: 30000,
            timeout: 30000,
            idleTimeout: 300000
        };

        console.log('최적화된 연결 풀 설정:', optimizedConfig);

        // 새로운 연결 풀 생성
        const newPool = mysql.createPool(optimizedConfig);

        // 기존 연결 풀 종료
        await this.pool.end();

        // 새로운 연결 풀 설정
        this.pool = newPool;

        console.log('✅ 연결 풀 최적화 완료!');
    }

    // 캐시 정리
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.queryCache.entries()) {
            if (now - value.timestamp > value.ttl) {
                this.queryCache.delete(key);
            }
        }
    }

    // 정기적인 캐시 정리
    startCacheCleanup() {
        setInterval(() => {
            this.cleanCache();
        }, 60000); // 1분마다
    }

    // 데이터베이스 연결 테스트
    async testConnection() {
        try {
            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();
            return { status: 'connected', message: '데이터베이스 연결 성공' };
        } catch (error) {
            return { status: 'error', message: `데이터베이스 연결 실패: ${error.message}` };
        }
    }

    // 연결 풀 종료
    async close() {
        await this.pool.end();
    }
}

// 싱글톤 인스턴스
const databaseOptimizer = new DatabaseOptimizer();

// 정기적인 캐시 정리 시작
databaseOptimizer.startCacheCleanup();

module.exports = {
    databaseOptimizer,
    pool
};
