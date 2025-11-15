/**
 * SQLite Database Configuration
 * Lightweight database for development without requiring MariaDB/MySQL
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path
const DB_PATH = join(__dirname, '../../data/community.db');

// Ensure data directory exists
const dataDir = dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeSchema() {
    db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT,
      bio TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'user',
      is_online INTEGER DEFAULT 0,
      last_seen DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Posts table
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Post reactions (likes)
    CREATE TABLE IF NOT EXISTS post_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reaction_type TEXT DEFAULT 'like',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(post_id, user_id)
    );

    -- Bookmarks table
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      UNIQUE(user_id, post_id)
    );

    -- Follows table
    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follower_id) REFERENCES users(id),
      FOREIGN KEY (following_id) REFERENCES users(id),
      UNIQUE(follower_id, following_id)
    );

    -- Direct messages table
    CREATE TABLE IF NOT EXISTS direct_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      related_id INTEGER,
      related_type TEXT,
      actor_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Blocked users table
    CREATE TABLE IF NOT EXISTS blocked_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blocker_id INTEGER NOT NULL,
      blocked_id INTEGER NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (blocker_id) REFERENCES users(id),
      FOREIGN KEY (blocked_id) REFERENCES users(id),
      UNIQUE(blocker_id, blocked_id)
    );

    -- Boards table (게시판)
    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Comments table
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    );

    -- Comment likes table
    CREATE TABLE IF NOT EXISTS comment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(comment_id, user_id)
    );

    -- Group chats table
    CREATE TABLE IF NOT EXISTS group_chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- Group chat members table
    CREATE TABLE IF NOT EXISTS group_chat_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_chat_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_chat_id) REFERENCES group_chats(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(group_chat_id, user_id)
    );

    -- Group chat messages table
    CREATE TABLE IF NOT EXISTS group_chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_chat_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_chat_id) REFERENCES group_chats(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Chat rooms table
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      is_private INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Chat messages table
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Events table (for analytics)
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      body TEXT,
      starts_at DATETIME,
      ends_at DATETIME,
      location TEXT,
      status TEXT DEFAULT 'draft',
      meta_json TEXT,
      event_type TEXT,
      event_data TEXT,
      user_id INTEGER,
      session_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Post drafts table (게시글 임시저장)
    CREATE TABLE IF NOT EXISTS post_drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      board_id INTEGER,
      title TEXT,
      content TEXT,
      category TEXT,
      tags TEXT,
      metadata TEXT,
      version INTEGER DEFAULT 1,
      last_saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME DEFAULT (datetime('now', '+30 days')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Draft attachments table (초안 첨부파일)
    CREATE TABLE IF NOT EXISTS draft_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draft_id INTEGER,
      post_id INTEGER,
      user_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      thumbnail_path TEXT,
      upload_status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (draft_id) REFERENCES post_drafts(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
    CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_posts_views ON posts(views);
    CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_post_reactions_deleted_at ON post_reactions(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks(post_id);
    CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
    CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
    CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_dm_is_read ON direct_messages(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications(actor_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
    CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
    CREATE INDEX IF NOT EXISTS idx_comments_deleted_at ON comments(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
    CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
    CREATE INDEX IF NOT EXISTS idx_group_chat_members_group ON group_chat_members(group_chat_id);
    CREATE INDEX IF NOT EXISTS idx_group_chat_messages_group ON group_chat_messages(group_chat_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
    CREATE INDEX IF NOT EXISTS idx_post_drafts_user ON post_drafts(user_id);
    CREATE INDEX IF NOT EXISTS idx_post_drafts_expires ON post_drafts(expires_at);
    CREATE INDEX IF NOT EXISTS idx_post_drafts_last_saved ON post_drafts(last_saved_at);
    CREATE INDEX IF NOT EXISTS idx_draft_attachments_draft ON draft_attachments(draft_id);
    CREATE INDEX IF NOT EXISTS idx_draft_attachments_post ON draft_attachments(post_id);
    CREATE INDEX IF NOT EXISTS idx_draft_attachments_user ON draft_attachments(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);

    -- Post metadata table for SEO and OG tags
    CREATE TABLE IF NOT EXISTS post_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER UNIQUE NOT NULL,
      og_title TEXT,
      og_description TEXT,
      og_image TEXT,
      og_url TEXT,
      meta_keywords TEXT,
      meta_description TEXT,
      auto_generated INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_post_metadata_post ON post_metadata(post_id);
  `);

    console.log('✓ SQLite database schema initialized');
}

// MySQL-compatible query wrapper
class SQLiteAdapter {
    constructor(database) {
        this.db = database;
    }

    // Execute query (for INSERT, UPDATE, DELETE)
    execute(sql, params = []) {
        try {
            const stmt = this.db.prepare(sql);
            const result = stmt.run(...params);
            return [result];
        } catch (error) {
            console.error('SQLite execute error:', error);
            throw error;
        }
    }

    // Query (for SELECT)
    query(sql, params = []) {
        try {
            const stmt = this.db.prepare(sql);
            const rows = stmt.all(...params);
            return [rows];
        } catch (error) {
            console.error('SQLite query error:', error);
            throw error;
        }
    }

    // Begin transaction
    beginTransaction() {
        this.db.exec('BEGIN TRANSACTION');
    }

    // Commit transaction
    commit() {
        this.db.exec('COMMIT');
    }

    // Rollback transaction
    rollback() {
        this.db.exec('ROLLBACK');
    }

    // Close connection
    end() {
        this.db.close();
    }
}

// Initialize schema on startup
initializeSchema();

// Export MySQL-compatible adapter
const connection = new SQLiteAdapter(db);

export default connection;
export { db, initializeSchema };

