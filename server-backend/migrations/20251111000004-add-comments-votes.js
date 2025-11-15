/**
 * Comments 테이블 생성 마이그레이션
 * 댓글 시스템을 위한 테이블 생성
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'community'
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ DB 연결 성공\n');

        console.log('🔄 Comments 테이블 생성 중...\n');

        // Comments 테이블 생성 (Foreign Key 없이)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS comments (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                post_id VARCHAR(64) NOT NULL,
                user_id BIGINT NULL,
                parent_id BIGINT NULL,
                content TEXT NOT NULL,
                author VARCHAR(100) NULL,
                deleted TINYINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_comments_post_id (post_id),
                INDEX idx_comments_user_id (user_id),
                INDEX idx_comments_parent_id (parent_id),
                INDEX idx_comments_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Comments 테이블 생성 완료 (Foreign Key는 application level에서 관리)');

        // Votes 테이블 생성 (Foreign Key 없이)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS votes (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                target_type ENUM('post', 'comment') NOT NULL,
                target_id VARCHAR(64) NOT NULL,
                vote_type ENUM('up', 'down') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                UNIQUE KEY unique_vote (user_id, target_type, target_id),
                INDEX idx_votes_target (target_type, target_id),
                INDEX idx_votes_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Votes 테이블 생성 완료 (Foreign Key는 application level에서 관리)');

        // Post에 댓글 수 컬럼 추가 (이미 존재할 수 있음)
        console.log('\n🔄 Posts 테이블에 댓글 수 컬럼 추가 중...\n');

        try {
            await connection.execute(`
                ALTER TABLE posts 
                ADD COLUMN comment_count INT DEFAULT 0
            `);
            console.log('✅ comment_count 컬럼 추가 완료');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  comment_count 컬럼이 이미 존재합니다.');
            } else {
                throw error;
            }
        }

        // Post에 투표 수 컬럼 추가
        try {
            await connection.execute(`
                ALTER TABLE posts 
                ADD COLUMN vote_count INT DEFAULT 0
            `);
            console.log('✅ vote_count 컬럼 추가 완료');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  vote_count 컬럼이 이미 존재합니다.');
            } else {
                throw error;
            }
        }

        console.log('\n');
        console.log('='.repeat(60));
        console.log('✅ 마이그레이션 완료');
        console.log('='.repeat(60));
        console.log('\n생성된 테이블:');
        console.log('  - comments (댓글)');
        console.log('  - votes (투표)');
        console.log('\n추가된 컬럼:');
        console.log('  - posts.comment_count (댓글 수)');
        console.log('  - posts.vote_count (투표 수)');
        console.log('');

    } catch (error) {
        console.error('❌ 마이그레이션 실패:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Rollback 함수
async function rollback() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ DB 연결 성공\n');

        console.log('🔄 테이블 삭제 중...\n');

        await connection.execute('DROP TABLE IF EXISTS votes');
        console.log('✅ Votes 테이블 삭제 완료');

        await connection.execute('DROP TABLE IF EXISTS comments');
        console.log('✅ Comments 테이블 삭제 완료');

        try {
            await connection.execute('ALTER TABLE posts DROP COLUMN comment_count');
            console.log('✅ comment_count 컬럼 삭제 완료');
        } catch (error) {
            console.log('ℹ️  comment_count 컬럼이 없습니다.');
        }

        try {
            await connection.execute('ALTER TABLE posts DROP COLUMN vote_count');
            console.log('✅ vote_count 컬럼 삭제 완료');
        } catch (error) {
            console.log('ℹ️  vote_count 컬럼이 없습니다.');
        }

        console.log('\n✅ Rollback 완료\n');

    } catch (error) {
        console.error('❌ Rollback 실패:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 실행
const command = process.argv[2];

if (command === '--down' || command === 'down') {
    rollback();
} else {
    migrate();
}
