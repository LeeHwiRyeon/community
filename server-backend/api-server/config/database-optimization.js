const { sequelize } = require('./database');

// 데이터베이스 연결 풀 최적화
const optimizeDatabase = async () => {
    try {
        // 연결 풀 설정 최적화
        await sequelize.connectionManager.pool.destroy();

        // 새로운 최적화된 설정으로 재연결
        sequelize.options.pool = {
            max: 20,        // 최대 연결 수 증가
            min: 5,         // 최소 연결 수 설정
            acquire: 60000, // 연결 획득 타임아웃 증가
            idle: 10000,    // 유휴 연결 타임아웃
            evict: 1000,    // 연결 정리 간격
            handleDisconnects: true
        };

        // 연결 재설정
        await sequelize.authenticate();
        console.log('Database connection pool optimized');
    } catch (error) {
        console.error('Database optimization error:', error);
    }
};

// 쿼리 최적화 설정
const optimizeQueries = () => {
    // Sequelize 설정 최적화
    sequelize.options.dialectOptions = {
        ...sequelize.options.dialectOptions,
        // SQLite 최적화 설정
        enableForeignKeys: true,
        journalMode: 'WAL',        // Write-Ahead Logging
        synchronous: 'NORMAL',     // 동기화 모드
        cacheSize: 10000,          // 캐시 크기
        tempStore: 'MEMORY',       // 임시 테이블을 메모리에 저장
        mmapSize: 268435456,       // 메모리 맵 크기 (256MB)
        pageSize: 4096,            // 페이지 크기
        lockingMode: 'NORMAL'      // 잠금 모드
    };
};

// 인덱스 최적화
const optimizeIndexes = async () => {
    try {
        // 테이블이 존재하는지 확인 후 인덱스 생성
        const tables = await sequelize.query(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='users'
        `);
        
        if (tables[0].length > 0) {
            // 자주 사용되는 쿼리에 대한 인덱스 생성
            await sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_users_email_status 
                ON users(email, status);
            `);
            
            await sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_users_role_created 
                ON users(role, created_at);
            `);
            
            await sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_users_last_login 
                ON users(last_login_at);
            `);
            
            console.log('Database indexes optimized');
        } else {
            console.log('Users table not found, skipping index optimization');
        }
    } catch (error) {
        console.error('Index optimization error:', error);
    }
};

// 데이터베이스 통계 업데이트
const updateStatistics = async () => {
    try {
        await sequelize.query('ANALYZE;');
        console.log('Database statistics updated');
    } catch (error) {
        console.error('Statistics update error:', error);
    }
};

// VACUUM 실행 (SQLite 최적화)
const vacuumDatabase = async () => {
    try {
        await sequelize.query('VACUUM;');
        console.log('Database vacuumed');
    } catch (error) {
        console.error('Vacuum error:', error);
    }
};

module.exports = {
    optimizeDatabase,
    optimizeQueries,
    optimizeIndexes,
    updateStatistics,
    vacuumDatabase
};
