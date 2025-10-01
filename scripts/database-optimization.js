#!/usr/bin/env node

/**
 * 🚀 데이터베이스 성능 최적화 스크립트
 * 
 * 이 스크립트는 다음 작업을 수행합니다:
 * 1. 데이터베이스 인덱스 분석 및 최적화
 * 2. 쿼리 성능 분석
 * 3. 연결 풀 설정 최적화
 * 4. 캐싱 전략 구현
 */

const mysql = require('mysql2/promise');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// 데이터베이스 설정
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'community',
    connectionLimit: 20,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// 색상 정의
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

// 최적화할 테이블과 인덱스 정의
const optimizationQueries = [
    // 사용자 테이블 최적화
    {
        name: '사용자 테이블 인덱스 최적화',
        queries: [
            'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
            'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
            'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)'
        ]
    },

    // 게시판 테이블 최적화
    {
        name: '게시판 테이블 인덱스 최적화',
        queries: [
            'CREATE INDEX IF NOT EXISTS idx_boards_name ON boards(name)',
            'CREATE INDEX IF NOT EXISTS idx_boards_created_at ON boards(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_boards_is_active ON boards(is_active)'
        ]
    },

    // 게시글 테이블 최적화
    {
        name: '게시글 테이블 인덱스 최적화',
        queries: [
            'CREATE INDEX IF NOT EXISTS idx_posts_board_id ON posts(board_id)',
            'CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)',
            'CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at)',
            'CREATE INDEX IF NOT EXISTS idx_posts_is_published ON posts(is_published)',
            'CREATE INDEX IF NOT EXISTS idx_posts_view_count ON posts(view_count)',
            'CREATE INDEX IF NOT EXISTS idx_posts_like_count ON posts(like_count)',
            'CREATE INDEX IF NOT EXISTS idx_posts_title ON posts(title(100))',
            'CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)',
            'CREATE INDEX IF NOT EXISTS idx_posts_board_created ON posts(board_id, created_at)',
            'CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at)'
        ]
    },

    // 댓글 테이블 최적화
    {
        name: '댓글 테이블 인덱스 최적화',
        queries: [
            'CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)',
            'CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id)',
            'CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)',
            'CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted)',
            'CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at)'
        ]
    },

    // 채팅 테이블 최적화
    {
        name: '채팅 테이블 인덱스 최적화',
        queries: [
            'CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_at ON chat_rooms(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_chat_rooms_is_active ON chat_rooms(is_active)',
            'CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id)',
            'CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id)',
            'CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at)'
        ]
    },

    // 파일 첨부 테이블 최적화
    {
        name: '파일 첨부 테이블 인덱스 최적화',
        queries: [
            'CREATE INDEX IF NOT EXISTS idx_post_attachments_post_id ON post_attachments(post_id)',
            'CREATE INDEX IF NOT EXISTS idx_post_attachments_file_type ON post_attachments(file_type)',
            'CREATE INDEX IF NOT EXISTS idx_post_attachments_created_at ON post_attachments(created_at)'
        ]
    }
];

// 쿼리 성능 분석 쿼리
const performanceQueries = [
    {
        name: '느린 쿼리 분석',
        query: `
      SELECT 
        query_time,
        lock_time,
        rows_sent,
        rows_examined,
        sql_text
      FROM mysql.slow_log 
      WHERE start_time > DATE_SUB(NOW(), INTERVAL 1 DAY)
      ORDER BY query_time DESC 
      LIMIT 10
    `
    },
    {
        name: '테이블 통계',
        query: `
      SELECT 
        table_name,
        table_rows,
        data_length,
        index_length,
        (data_length + index_length) as total_size,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      ORDER BY total_size DESC
    `
    },
    {
        name: '인덱스 사용률',
        query: `
      SELECT 
        table_name,
        index_name,
        cardinality,
        ROUND((cardinality / table_rows) * 100, 2) as selectivity
      FROM information_schema.statistics s
      JOIN information_schema.tables t ON s.table_name = t.table_name
      WHERE s.table_schema = DATABASE()
      ORDER BY selectivity DESC
    `
    }
];

async function createConnection() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        log('✅ 데이터베이스 연결 성공', 'green');
        return connection;
    } catch (error) {
        log(`❌ 데이터베이스 연결 실패: ${error.message}`, 'red');
        throw error;
    }
}

async function executeOptimization(connection) {
    log('\n🚀 데이터베이스 최적화 시작...', 'cyan');

    let totalQueries = 0;
    let successQueries = 0;
    let failedQueries = 0;

    for (const optimization of optimizationQueries) {
        log(`\n📊 ${optimization.name}`, 'yellow');

        for (const query of optimization.queries) {
            totalQueries++;
            try {
                const startTime = performance.now();
                await connection.execute(query);
                const endTime = performance.now();
                const duration = (endTime - startTime).toFixed(2);

                log(`  ✅ 인덱스 생성 완료 (${duration}ms)`, 'green');
                successQueries++;
            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME') {
                    log(`  ⚠️  인덱스 이미 존재: ${query.split(' ')[5]}`, 'yellow');
                    successQueries++; // 이미 존재하는 인덱스는 성공으로 간주
                } else {
                    log(`  ❌ 쿼리 실패: ${error.message}`, 'red');
                    failedQueries++;
                }
            }
        }
    }

    log(`\n📈 최적화 결과:`, 'cyan');
    log(`  총 쿼리: ${totalQueries}개`, 'blue');
    log(`  성공: ${successQueries}개`, 'green');
    log(`  실패: ${failedQueries}개`, 'red');

    return { totalQueries, successQueries, failedQueries };
}

async function analyzePerformance(connection) {
    log('\n🔍 성능 분석 시작...', 'cyan');

    const results = {};

    for (const analysis of performanceQueries) {
        try {
            log(`\n📊 ${analysis.name}`, 'yellow');
            const [rows] = await connection.execute(analysis.query);

            if (rows.length === 0) {
                log('  데이터가 없습니다.', 'yellow');
            } else {
                results[analysis.name] = rows;

                // 결과를 테이블 형태로 출력
                if (rows.length > 0) {
                    const columns = Object.keys(rows[0]);
                    const maxLengths = columns.map(col => Math.max(col.length, ...rows.map(row => String(row[col] || '').length)));

                    // 헤더 출력
                    let header = '  |';
                    columns.forEach((col, i) => {
                        header += ` ${col.padEnd(maxLengths[i])} |`;
                    });
                    log(header, 'blue');

                    // 구분선
                    let separator = '  |';
                    maxLengths.forEach(length => {
                        separator += ` ${'-'.repeat(length)} |`;
                    });
                    log(separator, 'blue');

                    // 데이터 출력 (최대 10행)
                    rows.slice(0, 10).forEach(row => {
                        let rowStr = '  |';
                        columns.forEach((col, i) => {
                            rowStr += ` ${String(row[col] || '').padEnd(maxLengths[i])} |`;
                        });
                        log(rowStr, 'white');
                    });

                    if (rows.length > 10) {
                        log(`  ... 및 ${rows.length - 10}개 더`, 'yellow');
                    }
                }
            }
        } catch (error) {
            log(`  ❌ 분석 실패: ${error.message}`, 'red');
        }
    }

    return results;
}

async function optimizeConnectionPool(connection) {
    log('\n🔧 연결 풀 최적화...', 'cyan');

    try {
        // 현재 연결 설정 확인
        const [variables] = await connection.execute(`
      SELECT 
        @@max_connections as max_connections,
        @@max_connect_errors as max_connect_errors,
        @@connect_timeout as connect_timeout,
        @@wait_timeout as wait_timeout,
        @@interactive_timeout as interactive_timeout
    `);

        log('현재 연결 설정:', 'yellow');
        variables.forEach(variable => {
            Object.entries(variable).forEach(([key, value]) => {
                log(`  ${key}: ${value}`, 'blue');
            });
        });

        // 권장 설정 제안
        log('\n권장 설정:', 'green');
        log('  max_connections: 200-500 (서버 메모리에 따라)', 'green');
        log('  connect_timeout: 10', 'green');
        log('  wait_timeout: 28800 (8시간)', 'green');
        log('  interactive_timeout: 28800 (8시간)', 'green');

    } catch (error) {
        log(`❌ 연결 풀 분석 실패: ${error.message}`, 'red');
    }
}

async function generateOptimizationReport(results) {
    const report = {
        timestamp: new Date().toISOString(),
        optimization: {
            totalQueries: results.totalQueries,
            successQueries: results.successQueries,
            failedQueries: results.failedQueries,
            successRate: ((results.successQueries / results.totalQueries) * 100).toFixed(2) + '%'
        },
        recommendations: [
            '정기적인 ANALYZE TABLE 실행으로 통계 업데이트',
            '느린 쿼리 로그 모니터링 설정',
            '인덱스 사용률 모니터링',
            '테이블 파티셔닝 고려 (대용량 테이블)',
            '쿼리 캐시 활성화 검토'
        ]
    };

    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, `database-optimization-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    log(`\n📄 최적화 보고서 저장: ${reportPath}`, 'green');

    return report;
}

async function main() {
    log('🚀 데이터베이스 성능 최적화 스크립트 시작', 'bright');
    log('=' * 50, 'cyan');

    let connection;

    try {
        // 데이터베이스 연결
        connection = await createConnection();

        // 최적화 실행
        const optimizationResults = await executeOptimization(connection);

        // 성능 분석
        await analyzePerformance(connection);

        // 연결 풀 최적화
        await optimizeConnectionPool(connection);

        // 보고서 생성
        const report = await generateOptimizationReport(optimizationResults);

        log('\n🎉 데이터베이스 최적화 완료!', 'green');
        log(`성공률: ${report.optimization.successRate}`, 'green');

    } catch (error) {
        log(`\n❌ 최적화 실패: ${error.message}`, 'red');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            log('데이터베이스 연결 종료', 'yellow');
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    createConnection,
    executeOptimization,
    analyzePerformance,
    optimizeConnectionPool,
    generateOptimizationReport
};
