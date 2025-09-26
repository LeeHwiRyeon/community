import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let pool;
// DB 鈺곕똻???? ??놁뱽 ????밴쉐??롫뮉 ????(筌ㅼ뮇??1??
export async function ensureDatabase() {
    // 筌뤴뫁???怨쀬뵠??筌뤴뫀諭??野껋럩??DB ?λ뜃由??椰꾨?瑗?怨뚮┛
    if (process.env.USE_MOCK_DB === '1' || process.env.ENV_ALLOW_MOCK === '1') {
        console.log('[db] Using mock mode, skipping database initialization');
        return;
    }
    
    const baseConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        multipleStatements: true
    };
    const dbName = process.env.DB_NAME;
    const tmp = await mysql.createConnection(baseConfig);
    try {
        await tmp.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
    } finally { await tmp.end(); }
}
export function getPool() {
    // 筌뤴뫁???怨쀬뵠??筌뤴뫀諭??野껋럩??null 獄쏆꼹??
    if (process.env.USE_MOCK_DB === '1' || process.env.ENV_ALLOW_MOCK === '1') {
        return null;
    }
    
    if (!pool) {
        // NOTE: auth_gssapi_client ??살첒 獄쏆뮇源?????뺤쒔 ?④쑴?????쑎域밸챷???mysql_native_password ?源놁몵嚥?癰궰野??袁⑹뒄.
        // ?袁⑹뒄 ??mysql2 authPlugins ?뚣끉??怨뺤춳??곸췅 揶쎛??(??由??뺣뮉 疫꿸퀡???쇱젟 ?醫?).
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            connectionLimit: 10,
            namedPlaceholders: true,
            charset: 'utf8mb4',
            collation: 'utf8mb4_general_ci',
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true
        });
    }
    return pool;
}

export async function query(sql, params) {
    // 筌뤴뫁???怨쀬뵠??筌뤴뫀諭??野껋럩????獄쏄퀣肉?獄쏆꼹??
    if (process.env.USE_MOCK_DB === '1' || process.env.ENV_ALLOW_MOCK === '1') {
        console.log('[db] Mock mode: query skipped -', sql.substring(0, 50));
        return [];
    }
    
    try {
        const p = getPool();
        if (!p) return [];
        const [rows] = await p.execute(sql, params);
        return rows;
    } catch (e) {
        console.error('[db.query.error]', e.message, 'SQL=', sql.slice(0, 120));
        throw e;
    }
}

export async function initSchema() {
    // 筌뤴뫁???怨쀬뵠??筌뤴뫀諭??野껋럩????쎄텕筌??λ뜃由??椰꾨?瑗?怨뚮┛
    if (process.env.USE_MOCK_DB === '1' || process.env.ENV_ALLOW_MOCK === '1') {
        console.log('[db] Mock mode: schema initialization skipped');
        return;
    }
    
    const ensureColumn = async (table, column, definition) => {
        try {
            const existing = await query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
            if (!existing || existing.length === 0) {
                await query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
                console.log(`[schema] added column ${column} to ${table}`);
            }
        } catch (err) {
            const msg = err && err.message ? err.message : String(err);
            console.warn(`[schema] column ensure failed for ${table}.${column}`, msg);
        }
    };

    // boards
    await query(`CREATE TABLE IF NOT EXISTS boards (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    ordering INT DEFAULT 1000,
    deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    // posts
    await query(`CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(64) PRIMARY KEY,
    board_id VARCHAR(64) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content MEDIUMTEXT,
    date DATE,
    tag VARCHAR(100),
    thumb VARCHAR(500),
    author VARCHAR(100),
    category VARCHAR(200),
    deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_posts_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    // views
    await query(`CREATE TABLE IF NOT EXISTS post_views (
    post_id VARCHAR(64) PRIMARY KEY,
    views INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_views_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    // indexes
    await query('CREATE INDEX IF NOT EXISTS idx_posts_board_date ON posts(board_id, date)');
    await query('CREATE INDEX IF NOT EXISTS idx_posts_board_deleted ON posts(board_id, deleted)');
    // FULLTEXT (best-effort) - ignore errors if engine/version unsupported
    try { await query('ALTER TABLE posts ADD FULLTEXT INDEX ft_posts_title_content (title, content)'); }
    catch (e) {
        const msg = (e && e.message) || '';
        if (/Duplicate key name/.test(msg)) {
            console.warn('[schema] FULLTEXT index already exists (ft_posts_title_content)');
        } else {
            console.warn('[schema] FULLTEXT index add skipped:', msg);
        }
    }

    await ensureColumn('posts', 'status', "status VARCHAR(32) DEFAULT 'published'");
    await ensureColumn('posts', 'excerpt', 'excerpt VARCHAR(600) NULL');
    await ensureColumn('posts', 'hero_media_id', 'hero_media_id BIGINT NULL');
    await ensureColumn('posts', 'last_edited_at', 'last_edited_at TIMESTAMP NULL');
    await ensureColumn('posts', 'last_edited_by', 'last_edited_by BIGINT NULL');
    await ensureColumn('posts', 'layout_settings', 'layout_settings JSON NULL');

    await query(`CREATE TABLE IF NOT EXISTS post_blocks (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            post_id VARCHAR(64) NOT NULL,
            ordering INT NOT NULL,
            type VARCHAR(32) NOT NULL,
            content_json JSON NOT NULL,
            text_content TEXT,
            media_alignment VARCHAR(32),
            width_ratio VARCHAR(32),
            background_style VARCHAR(32),
            metadata JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_post_blocks_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await query('CREATE INDEX IF NOT EXISTS idx_post_blocks_post_order ON post_blocks(post_id, ordering)');

    await query(`CREATE TABLE IF NOT EXISTS post_media (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            post_id VARCHAR(64) NOT NULL,
            file_key VARCHAR(255) NOT NULL,
            media_type VARCHAR(32) DEFAULT 'image',
            url VARCHAR(500) NOT NULL,
            thumbnail_url VARCHAR(500),
            width INT,
            height INT,
            dominant_color VARCHAR(32),
            alt_text VARCHAR(500),
            caption TEXT,
            metadata JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_post_media_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await query(`CREATE TABLE IF NOT EXISTS attachments (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            file_key VARCHAR(255) NOT NULL,
            owner_user_id BIGINT NULL,
            status ENUM('queued','processing','ready','failed') DEFAULT 'queued',
            mime_type VARCHAR(128) NOT NULL,
            size_bytes BIGINT NOT NULL,
            checksum VARCHAR(128) NULL,
            original_name VARCHAR(255) NULL,
            source_type ENUM('temp','draft','post') DEFAULT 'temp',
            source_id VARCHAR(64) NULL,
            metadata JSON NULL,
            variants JSON NULL,
            error_message TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_attachments_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await query('CREATE INDEX IF NOT EXISTS idx_attachments_file_key ON attachments(file_key)');
    await query('CREATE INDEX IF NOT EXISTS idx_attachments_source ON attachments(source_type, source_id)');

    await query('CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(post_id)');
    // --- New: users (basic) ---
    await query(`CREATE TABLE IF NOT EXISTS users (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            display_name VARCHAR(200),
            email VARCHAR(320) UNIQUE,
            role VARCHAR(32) DEFAULT 'user',
            status VARCHAR(32) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    // Safe alter: ensure role column exists (in case of older deployments) & backfill default
    try {
        const cols = await query("SHOW COLUMNS FROM users LIKE 'role'");
        if (!cols.length) {
            await query("ALTER TABLE users ADD COLUMN role VARCHAR(32) DEFAULT 'user'");
            console.log('[schema] added role column to users');
        }
    } catch (e) { console.warn('[schema] role column check failed', e.message); }

    await ensureColumn('users', 'password_hash', 'password_hash VARCHAR(255) NULL');
    await ensureColumn('users', 'primary_provider', 'primary_provider VARCHAR(32) NULL');
    await ensureColumn('users', 'primary_provider_user_id', 'primary_provider_user_id VARCHAR(190) NULL');
    await ensureColumn('users', 'last_login_at', 'last_login_at DATETIME NULL');
    await ensureColumn('users', 'rpg_level', 'rpg_level INT NOT NULL DEFAULT 1');
    await ensureColumn('users', 'rpg_xp', 'rpg_xp INT NOT NULL DEFAULT 0');
    await ensureColumn('users', 'last_levelup_at', 'last_levelup_at TIMESTAMP NULL');

    // user_social_identities: maps OAuth providers to users
    await query(`CREATE TABLE IF NOT EXISTS user_stats (
            user_id BIGINT PRIMARY KEY,
            posts_count INT DEFAULT 0,
            comments_count INT DEFAULT 0,
            likes_received INT DEFAULT 0,
            badges_count INT DEFAULT 0,
            activity_score INT GENERATED ALWAYS AS (posts_count * 4 + comments_count * 2 + likes_received) STORED,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_user_stats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await query('CREATE INDEX IF NOT EXISTS idx_user_stats_activity ON user_stats(activity_score)');

    await query(`CREATE TABLE IF NOT EXISTS user_badges (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            badge_code VARCHAR(32) NOT NULL,
            earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_user_badges_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY uq_user_badge (user_id, badge_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await query('CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at)');

    await query(`CREATE TABLE IF NOT EXISTS user_social_identities (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            provider VARCHAR(32) NOT NULL,
            provider_user_id VARCHAR(190) NOT NULL,
            email_at_provider VARCHAR(320),
            profile_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_user_social_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY uq_provider_user (provider, provider_user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    try {
        await query('ALTER TABLE posts ADD CONSTRAINT fk_posts_last_edited_by FOREIGN KEY (last_edited_by) REFERENCES users(id) ON DELETE SET NULL');
    } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        if (!/Duplicate key name/.test(msg)) {
            console.warn('[schema] fk_posts_last_edited_by ensure skipped', msg);
        }
    }

    await query(`CREATE TABLE IF NOT EXISTS post_versions (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            post_id VARCHAR(64) NOT NULL,
            version INT NOT NULL,
            status VARCHAR(32) DEFAULT 'draft',
            snapshot_json JSON NOT NULL,
            created_by BIGINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_post_versions_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
            CONSTRAINT fk_post_versions_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE KEY uq_post_version (post_id, version)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await query('CREATE INDEX IF NOT EXISTS idx_post_versions_post ON post_versions(post_id)');
    // announcements: time window controlled messages
    await query(`CREATE TABLE IF NOT EXISTS announcements (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(120) UNIQUE,
            title VARCHAR(300) NOT NULL,
            body MEDIUMTEXT,
            starts_at DATETIME,
            ends_at DATETIME NULL,
            priority INT DEFAULT 100,
        active TINYINT DEFAULT 1,
        deleted TINYINT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_ann_active_window (active, starts_at, ends_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // events: scheduled items
    await query(`CREATE TABLE IF NOT EXISTS events (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(300) NOT NULL,
            body MEDIUMTEXT,
            starts_at DATETIME,
            ends_at DATETIME,
            location VARCHAR(300),
            status VARCHAR(32) DEFAULT 'planned',
            meta_json TEXT,
            deleted TINYINT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_events_status_start (status, starts_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // --- History tables (append-only) ---
    await query(`CREATE TABLE IF NOT EXISTS announcement_history (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            announcement_id BIGINT,
            action VARCHAR(32),
            snapshot MEDIUMTEXT,
            actor_user_id BIGINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_ann_hist_announcement (announcement_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await query(`CREATE TABLE IF NOT EXISTS event_history (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            event_id BIGINT,
            action VARCHAR(32),
            snapshot MEDIUMTEXT,
            actor_user_id BIGINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_event_hist_event (event_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await query(`CREATE TABLE IF NOT EXISTS post_drafts (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            post_id VARCHAR(64) NULL,
            author_id BIGINT NOT NULL,
            title TEXT,
            content MEDIUMTEXT,
            metadata JSON NULL,
            status ENUM(''active'',''archived'',''conflict'') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            expires_at DATETIME GENERATED ALWAYS AS (DATE_ADD(updated_at, INTERVAL 30 DAY)) STORED,
            CONSTRAINT fk_post_drafts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await query('CREATE INDEX IF NOT EXISTS idx_post_drafts_author_updated ON post_drafts(author_id, updated_at DESC)');
    await query('CREATE INDEX IF NOT EXISTS idx_post_drafts_expires ON post_drafts(expires_at)');

    // --- Auth audit table ---
    await query(`CREATE TABLE IF NOT EXISTS auth_audit (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NULL,
            provider VARCHAR(32) NULL,
            event VARCHAR(64) NOT NULL,
            ip VARCHAR(100),
            user_agent VARCHAR(300),
            detail_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_auth_audit_user (user_id, created_at),
            INDEX idx_auth_audit_event (event, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // --- Chat messages table ---
    await query(`CREATE TABLE IF NOT EXISTS chat_messages (
            id VARCHAR(100) PRIMARY KEY,
            room_id VARCHAR(100) NOT NULL,
            user_id BIGINT NULL,
            username VARCHAR(200) NOT NULL,
            content TEXT NOT NULL,
            deleted TINYINT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_chat_room_time (room_id, created_at),
            INDEX idx_chat_user (user_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}













