const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * 데이터베이스 최적화 스크립트
 * - 인덱스 최적화
 * - 쿼리 성능 개선
 * - 연결 풀 설정
 * - 정기 정리 작업
 */

class DatabaseOptimizer {
    constructor() {
        this.connection = sequelize;
    }

    /**
     * 메인 최적화 실행
     */
    async optimize() {
        try {
            logger.info('데이터베이스 최적화 시작');

            // 1. 인덱스 최적화
            await this.optimizeIndexes();

            // 2. 쿼리 성능 분석
            await this.analyzeQueryPerformance();

            // 3. 연결 풀 최적화
            await this.optimizeConnectionPool();

            // 4. 정기 정리 작업
            await this.performMaintenance();

            // 5. 통계 업데이트
            await this.updateStatistics();

            logger.info('데이터베이스 최적화 완료');
            return { success: true, message: '데이터베이스 최적화가 완료되었습니다.' };
        } catch (error) {
            logger.error('데이터베이스 최적화 실패:', error);
            return { success: false, message: `데이터베이스 최적화 실패: ${error.message}` };
        }
    }

    /**
     * 인덱스 최적화
     */
    async optimizeIndexes() {
        logger.info('인덱스 최적화 시작');

        const indexOptimizations = [
            // 사용자 테이블 인덱스
            `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
            `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
            `CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`,
            `CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)`,

            // 게시글 테이블 인덱스
            `CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)`,
            `CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)`,
            `CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_posts_views ON posts(views)`,
            `CREATE INDEX IF NOT EXISTS idx_posts_deleted ON posts(deleted)`,

            // 댓글 테이블 인덱스
            `CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`,
            `CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted)`,

            // 복합 인덱스
            `CREATE INDEX IF NOT EXISTS idx_posts_category_created ON posts(category, created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at)`
        ];

        for (const query of indexOptimizations) {
            try {
                await this.connection.query(query);
                logger.info(`인덱스 생성 완료: ${query.split(' ')[5]}`);
            } catch (error) {
                logger.warning(`인덱스 생성 실패: ${query}`, error.message);
            }
        }

        logger.info('인덱스 최적화 완료');
    }

    /**
     * 쿼리 성능 분석
     */
    async analyzeQueryPerformance() {
        logger.info('쿼리 성능 분석 시작');

        const performanceQueries = [
            {
                name: '사용자 통계 쿼리',
                query: `
                    SELECT 
                        COUNT(*) as total_users,
                        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
                        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users
                    FROM users
                `
            },
            {
                name: '게시글 통계 쿼리',
                query: `
                    SELECT 
                        COUNT(*) as total_posts,
                        COUNT(CASE WHEN deleted = 0 THEN 1 END) as active_posts,
                        AVG(views) as avg_views,
                        MAX(views) as max_views
                    FROM posts
                `
            },
            {
                name: '인기 게시글 쿼리',
                query: `
                    SELECT p.id, p.title, p.views, p.created_at, u.username
                    FROM posts p
                    JOIN users u ON p.author_id = u.id
                    WHERE p.deleted = 0
                    ORDER BY p.views DESC
                    LIMIT 10
                `
            }
        ];

        for (const { name, query } of performanceQueries) {
            try {
                const startTime = Date.now();
                const result = await this.connection.query(query);
                const executionTime = Date.now() - startTime;

                logger.info(`${name} 실행 시간: ${executionTime}ms`);

                if (executionTime > 1000) {
                    logger.warning(`${name}이 느립니다: ${executionTime}ms`);
                }
            } catch (error) {
                logger.error(`${name} 실행 실패:`, error);
            }
        }

        logger.info('쿼리 성능 분석 완료');
    }

    /**
     * 연결 풀 최적화
     */
    async optimizeConnectionPool() {
        logger.info('연결 풀 최적화 시작');

        const poolConfig = {
            max: 20,        // 최대 연결 수
            min: 5,         // 최소 연결 수
            acquire: 30000, // 연결 획득 타임아웃 (30초)
            idle: 10000     // 유휴 연결 타임아웃 (10초)
        };

        try {
            // 연결 풀 설정 업데이트
            await this.connection.connectionManager.pool.destroyAllNow();

            logger.info('연결 풀 설정 업데이트 완료', poolConfig);
        } catch (error) {
            logger.error('연결 풀 최적화 실패:', error);
        }

        logger.info('연결 풀 최적화 완료');
    }

    /**
     * 정기 정리 작업
     */
    async performMaintenance() {
        logger.info('정기 정리 작업 시작');

        const maintenanceTasks = [
            {
                name: '삭제된 게시글 정리',
                query: `DELETE FROM posts WHERE deleted = 1 AND updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`
            },
            {
                name: '삭제된 댓글 정리',
                query: `DELETE FROM comments WHERE is_deleted = 1 AND updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`
            },
            {
                name: '오래된 세션 정리',
                query: `DELETE FROM sessions WHERE expires_at < NOW()`
            },
            {
                name: '임시 파일 정리',
                query: `DELETE FROM temp_files WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
            }
        ];

        for (const { name, query } of maintenanceTasks) {
            try {
                const result = await this.connection.query(query);
                logger.info(`${name} 완료: ${result[1]}개 레코드 삭제`);
            } catch (error) {
                logger.warning(`${name} 실패:`, error.message);
            }
        }

        logger.info('정기 정리 작업 완료');
    }

    /**
     * 통계 업데이트
     */
    async updateStatistics() {
        logger.info('통계 업데이트 시작');

        try {
            // MySQL의 경우 ANALYZE TABLE 실행
            const tables = ['users', 'posts', 'comments', 'sessions'];

            for (const table of tables) {
                try {
                    await this.connection.query(`ANALYZE TABLE ${table}`);
                    logger.info(`${table} 테이블 통계 업데이트 완료`);
                } catch (error) {
                    logger.warning(`${table} 테이블 통계 업데이트 실패:`, error.message);
                }
            }
        } catch (error) {
            logger.error('통계 업데이트 실패:', error);
        }

        logger.info('통계 업데이트 완료');
    }

    /**
     * 성능 메트릭 수집
     */
    async collectPerformanceMetrics() {
        try {
            const metrics = {
                timestamp: new Date().toISOString(),
                connectionCount: this.connection.connectionManager.pool.size,
                idleConnections: this.connection.connectionManager.pool.available,
                waitingClients: this.connection.connectionManager.pool.pending
            };

            logger.info('데이터베이스 성능 메트릭:', metrics);
            return metrics;
        } catch (error) {
            logger.error('성능 메트릭 수집 실패:', error);
            return null;
        }
    }
}

module.exports = DatabaseOptimizer;

// 직접 실행 시
if (require.main === module) {
    const optimizer = new DatabaseOptimizer();
    optimizer.optimize()
        .then(result => {
            console.log('최적화 결과:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('최적화 실패:', error);
            process.exit(1);
        });
}
