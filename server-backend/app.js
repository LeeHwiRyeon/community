const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * 커뮤니티 백엔드 API 서버
 * Express 기반 RESTful API 서버
 */
class CommunityBackendServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 5000;
        this.db = null;
        this.redis = null;

        this.setupMiddleware();
        this.setupDatabase();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    /**
     * 미들웨어 설정
     */
    setupMiddleware() {
        // 보안 헤더
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));

        // CORS 설정
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // 압축
        this.app.use(compression());

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15분
            max: 100, // 최대 100 요청
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use('/api/', limiter);

        // JSON 파싱
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // 정적 파일 서빙
        this.app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
        this.app.use('/public', express.static(path.join(__dirname, 'public')));

        // 요청 로깅
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
            next();
        });
    }

    /**
     * 데이터베이스 설정
     */
    async setupDatabase() {
        try {
            // MySQL 연결
            this.db = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'community_db',
                charset: 'utf8mb4'
            });

            console.log('✅ MySQL 데이터베이스 연결 성공');

            // Redis 연결
            this.redis = redis.createClient({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || undefined
            });

            this.redis.on('error', (err) => {
                console.error('❌ Redis 연결 오류:', err);
            });

            this.redis.on('connect', () => {
                console.log('✅ Redis 연결 성공');
            });

            await this.redis.connect();

            // 데이터베이스 테이블 초기화
            await this.initializeTables();

        } catch (error) {
            console.error('❌ 데이터베이스 연결 실패:', error);
            // 데이터베이스 연결 실패 시에도 서버는 계속 실행
        }
    }

    /**
     * 데이터베이스 테이블 초기화
     */
    async initializeTables() {
        if (!this.db) return;

        const tables = [
            // 사용자 테이블
            `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255),
                username VARCHAR(100) UNIQUE NOT NULL,
                display_name VARCHAR(100),
                avatar_url VARCHAR(500),
                provider VARCHAR(50) DEFAULT 'local',
                provider_id VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_username (username),
                INDEX idx_provider (provider, provider_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

            // 게시판 테이블
            `CREATE TABLE IF NOT EXISTS boards (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                category VARCHAR(50),
                is_active BOOLEAN DEFAULT TRUE,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

            // 게시글 테이블
            `CREATE TABLE IF NOT EXISTS posts (
                id VARCHAR(50) PRIMARY KEY,
                board_id VARCHAR(50) NOT NULL,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                content_type ENUM('text', 'markdown', 'html') DEFAULT 'text',
                is_published BOOLEAN DEFAULT TRUE,
                is_pinned BOOLEAN DEFAULT FALSE,
                view_count INT DEFAULT 0,
                like_count INT DEFAULT 0,
                comment_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_board (board_id),
                INDEX idx_user (user_id),
                INDEX idx_published (is_published),
                INDEX idx_pinned (is_pinned),
                INDEX idx_created (created_at),
                FULLTEXT idx_content (title, content)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

            // 댓글 테이블
            `CREATE TABLE IF NOT EXISTS comments (
                id VARCHAR(50) PRIMARY KEY,
                post_id VARCHAR(50) NOT NULL,
                user_id INT NOT NULL,
                parent_id VARCHAR(50),
                content TEXT NOT NULL,
                is_deleted BOOLEAN DEFAULT FALSE,
                like_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
                INDEX idx_post (post_id),
                INDEX idx_user (user_id),
                INDEX idx_parent (parent_id),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

            // 첨부파일 테이블
            `CREATE TABLE IF NOT EXISTS attachments (
                id VARCHAR(50) PRIMARY KEY,
                post_id VARCHAR(50),
                comment_id VARCHAR(50),
                user_id INT NOT NULL,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size INT NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_post (post_id),
                INDEX idx_comment (comment_id),
                INDEX idx_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

            // 좋아요 테이블
            `CREATE TABLE IF NOT EXISTS likes (
                id VARCHAR(50) PRIMARY KEY,
                user_id INT NOT NULL,
                target_type ENUM('post', 'comment') NOT NULL,
                target_id VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_like (user_id, target_type, target_id),
                INDEX idx_target (target_type, target_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        ];

        for (const table of tables) {
            await this.db.execute(table);
        }

        // 기본 게시판 데이터 삽입
        await this.insertDefaultBoards();

        console.log('✅ 데이터베이스 테이블 초기화 완료');
    }

    /**
     * 기본 게시판 데이터 삽입
     */
    async insertDefaultBoards() {
        if (!this.db) return;

        const defaultBoards = [
            { id: 'news', name: '뉴스', description: '게임 뉴스 및 업데이트', category: 'main' },
            { id: 'community', name: '커뮤니티', description: '자유 게시판', category: 'main' },
            { id: 'free', name: '자유게시판', description: '자유로운 소통 공간', category: 'community' },
            { id: 'image', name: '이미지', description: '이미지 공유', category: 'media' },
            { id: 'game', name: '게임', description: '게임 관련 게시판', category: 'main' }
        ];

        for (const board of defaultBoards) {
            try {
                await this.db.execute(
                    'INSERT IGNORE INTO boards (id, name, description, category) VALUES (?, ?, ?, ?)',
                    [board.id, board.name, board.description, board.category]
                );
            } catch (error) {
                console.warn(`게시판 ${board.id} 삽입 실패:`, error.message);
            }
        }
    }

    /**
     * 라우트 설정
     */
    setupRoutes() {
        // 헬스 체크
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: this.db ? 'connected' : 'disconnected',
                redis: this.redis ? 'connected' : 'disconnected'
            });
        });

        // API 라우트
        this.app.use('/api/auth', require('./routes/auth')(this.db, this.redis));
        this.app.use('/api/boards', require('./routes/boards')(this.db, this.redis));
        this.app.use('/api/posts', require('./routes/posts')(this.db, this.redis));
        this.app.use('/api/comments', require('./routes/comments')(this.db, this.redis));
        this.app.use('/api/upload', require('./routes/upload')(this.db, this.redis));

        // 기본 라우트
        this.app.get('/', (req, res) => {
            res.json({
                message: 'Community Backend API Server',
                version: '1.0.0',
                endpoints: {
                    health: '/health',
                    auth: '/api/auth',
                    boards: '/api/boards',
                    posts: '/api/posts',
                    comments: '/api/comments',
                    upload: '/api/upload'
                }
            });
        });

        // 404 처리
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `Route ${req.originalUrl} not found`,
                timestamp: new Date().toISOString()
            });
        });
    }

    /**
     * 에러 처리
     */
    setupErrorHandling() {
        this.app.use((error, req, res, next) => {
            console.error('❌ 서버 오류:', error);

            const statusCode = error.statusCode || 500;
            const message = error.message || 'Internal Server Error';

            res.status(statusCode).json({
                error: true,
                message: message,
                timestamp: new Date().toISOString(),
                path: req.path,
                method: req.method
            });
        });
    }

    /**
     * 서버 시작
     */
    start() {
        this.app.listen(this.port, () => {
            console.log(`🚀 커뮤니티 백엔드 서버 시작됨: 포트 ${this.port}`);
            console.log(`🌐 API 엔드포인트: http://localhost:${this.port}/api`);
            console.log(`📊 헬스 체크: http://localhost:${this.port}/health`);
            console.log(`✅ CORS 활성화: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
        });
    }

    /**
     * 서버 종료
     */
    async stop() {
        if (this.db) {
            await this.db.end();
        }
        if (this.redis) {
            await this.redis.quit();
        }
        console.log('🛑 서버 종료됨');
    }
}

// CLI 실행
if (require.main === module) {
    const server = new CommunityBackendServer();

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 서버 종료 중...');
        await server.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 서버 종료 중...');
        await server.stop();
        process.exit(0);
    });

    server.start();
}

module.exports = CommunityBackendServer;
