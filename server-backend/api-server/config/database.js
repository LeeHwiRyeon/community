const { Sequelize } = require('sequelize');
const path = require('path');

// 외장하드 SQLite 데이터베이스 연결 설정
const dbPath = process.env.DB_PATH || 'D:/database/thenewspaper/thenewspaperdata.db';

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: (msg) => console.log(msg),
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
    }
});

// 데이터베이스 연결 테스트
async function connectDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection has been established successfully.');

        // 개발 환경에서만 테이블 동기화
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('🔄 Database tables synchronized.');
        }

        return sequelize;
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        throw error;
    }
}

// 데이터베이스 연결 종료
async function closeDatabase() {
    try {
        await sequelize.close();
        console.log('🔌 Database connection closed.');
    } catch (error) {
        console.error('❌ Error closing database connection:', error);
        throw error;
    }
}

module.exports = {
    sequelize,
    connectDatabase,
    closeDatabase
};
