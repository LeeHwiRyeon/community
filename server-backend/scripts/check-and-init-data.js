/**
 * DB 초기 데이터 확인 및 생성 스크립트
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

async function checkAndInitializeData() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ DB 연결 성공\n');

        // 1. boards 테이블 확인
        console.log('='.repeat(60));
        console.log('📋 게시판 데이터 확인');
        console.log('='.repeat(60));

        const [boards] = await connection.execute('SELECT id, title, ordering FROM boards WHERE deleted = 0');

        if (boards.length === 0) {
            console.log('⚠️  게시판 데이터가 없습니다. 기본 게시판을 생성합니다...\n');

            const defaultBoards = [
                { id: 'gaming', title: 'Gaming Community', ordering: 1 },
                { id: 'tech', title: 'Tech Community', ordering: 2 },
                { id: 'free', title: 'Free Board', ordering: 3 },
                { id: 'qna', title: 'Q&A', ordering: 4 }
            ];

            for (const board of defaultBoards) {
                await connection.execute(
                    'INSERT INTO boards (id, title, ordering, deleted, created_at, updated_at) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
                    [board.id, board.title, board.ordering]
                );
                console.log(`✅ 게시판 생성: ${board.title} (${board.id})`);
            }
            console.log('');
        } else {
            console.log(`✅ 게시판 ${boards.length}개 존재:`);
            boards.forEach(board => {
                console.log(`   - ${board.title} (${board.id})`);
            });
            console.log('');
        }

        // 2. users 테이블 확인
        console.log('='.repeat(60));
        console.log('👥 사용자 데이터 확인');
        console.log('='.repeat(60));

        const [users] = await connection.execute('SELECT id, display_name, email, role FROM users LIMIT 5');

        if (users.length === 0) {
            console.log('⚠️  사용자 데이터가 없습니다. 테스트 사용자를 생성합니다...\n');

            await connection.execute(`
                INSERT INTO users (display_name, email, role, status, created_at, updated_at)
                VALUES ('Test User', 'test@example.com', 'user', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `);
            console.log('✅ 테스트 사용자 생성: Test User (test@example.com)\n');
        } else {
            console.log(`✅ 사용자 ${users.length}명 존재:`);
            users.forEach(user => {
                console.log(`   - ${user.display_name || 'Unnamed'} (ID: ${user.id}, Role: ${user.role})`);
            });
            console.log('');
        }

        // 3. posts 테이블 확인
        console.log('='.repeat(60));
        console.log('📝 게시물 데이터 확인');
        console.log('='.repeat(60));

        const [posts] = await connection.execute(`
            SELECT p.id, p.board_id, p.title, p.author, p.created_at
            FROM posts p
            WHERE p.deleted = 0
            ORDER BY p.created_at DESC
            LIMIT 5
        `);

        if (posts.length === 0) {
            console.log('⚠️  게시물이 없습니다.\n');
            console.log('💡 게시물은 API를 통해 생성할 수 있습니다:');
            console.log('   POST /api/boards/{boardId}/posts\n');
        } else {
            console.log(`✅ 게시물 ${posts.length}개 존재 (최근 5개):`);
            posts.forEach(post => {
                const date = new Date(post.created_at).toLocaleString('ko-KR');
                console.log(`   - [${post.board_id}] ${post.title}`);
                console.log(`     작성자: ${post.author}, 작성일: ${date}`);
            });
            console.log('');
        }

        // 4. 테이블 구조 확인
        console.log('='.repeat(60));
        console.log('🗄️  주요 테이블 존재 여부');
        console.log('='.repeat(60));

        const tables = ['boards', 'posts', 'users', 'comments', 'votes', 'follows', 'bookmark_folders', 'bookmarks'];

        for (const table of tables) {
            try {
                await connection.execute(`SELECT 1 FROM ${table} LIMIT 1`);
                console.log(`✅ ${table}`);
            } catch (error) {
                console.log(`❌ ${table} (테이블 없음)`);
            }
        }

        console.log('\n');
        console.log('='.repeat(60));
        console.log('✅ 데이터베이스 초기화 완료');
        console.log('='.repeat(60));
        console.log('\n💡 다음 단계:');
        console.log('   1. 서버 실행: node src/index.js');
        console.log('   2. 테스트 실행: node test-community-features.js');
        console.log('');

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.error('\n💡 테이블이 존재하지 않습니다. 마이그레이션을 먼저 실행하세요:');
            console.error('   node scripts/run-migrations.js');
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkAndInitializeData();
