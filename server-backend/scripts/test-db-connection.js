import { getPool } from '../src/db.js';

async function testConnection() {
    try {
        console.log('🔍 데이터베이스 연결 테스트 중...\n');

        const pool = getPool();
        const [result] = await pool.query('SELECT 1 as test');

        console.log('✅ 데이터베이스 연결 성공!');
        console.log('테스트 쿼리 결과:', result);

        // 현재 데이터베이스 확인
        const [dbInfo] = await pool.query('SELECT DATABASE() as current_db');
        console.log('\n현재 데이터베이스:', dbInfo[0].current_db);

        // 기존 테이블 목록
        const [tables] = await pool.query('SHOW TABLES');
        console.log('\n📋 기존 테이블 목록:');
        tables.forEach((table, index) => {
            console.log(`  ${index + 1}. ${Object.values(table)[0]}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ 데이터베이스 연결 실패:', error.message);
        console.error('\n상세 오류:', error);
        process.exit(1);
    }
}

testConnection();
