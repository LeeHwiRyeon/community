-- Database Optimization Script
-- This script creates indexes and optimizes the database for better performance

-- Use the community database
USE community_hub;

-- Create indexes for posts table
CREATE INDEX IF NOT EXISTS idx_posts_board_id ON posts(board_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at);
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_posts_is_draft ON posts(is_draft);
CREATE INDEX IF NOT EXISTS idx_posts_is_locked ON posts(is_locked);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_posts_board_published ON posts(board_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_published ON posts(author_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category_published ON posts(category_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_board_pinned ON posts(board_id, is_pinned DESC, published_at DESC);

-- Full-text search index for posts
CREATE FULLTEXT INDEX IF NOT EXISTS idx_posts_fulltext ON posts(title, content);

-- Create indexes for comments table
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_updated_at ON comments(updated_at);

-- Composite indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_author_created ON comments(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_created ON comments(parent_id, created_at ASC);

-- Create indexes for votes table
CREATE INDEX IF NOT EXISTS idx_votes_post_id ON votes(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_comment_id ON votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_type ON votes(type);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);

-- Composite indexes for votes
CREATE INDEX IF NOT EXISTS idx_votes_post_user ON votes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_votes_comment_user ON votes(comment_id, user_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_type ON votes(user_id, type);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);

-- Create indexes for boards table
CREATE INDEX IF NOT EXISTS idx_boards_is_public ON boards(is_public);
CREATE INDEX IF NOT EXISTS idx_boards_is_active ON boards(is_active);
CREATE INDEX IF NOT EXISTS idx_boards_created_at ON boards(created_at);

-- Create indexes for categories table
CREATE INDEX IF NOT EXISTS idx_categories_board_id ON categories(board_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_created_at ON categories(created_at);

-- Create indexes for tags table
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tags_created_at ON tags(created_at);

-- Create indexes for post_tags table
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_tags_unique ON post_tags(post_id, tag_id);

-- Create indexes for attachments table
CREATE INDEX IF NOT EXISTS idx_attachments_post_id ON attachments(post_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_at ON attachments(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_attachments_mime_type ON attachments(mime_type);

-- Create indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Composite indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type, created_at DESC);

-- Create indexes for drafts table
CREATE INDEX IF NOT EXISTS idx_drafts_author_id ON drafts(author_id);
CREATE INDEX IF NOT EXISTS idx_drafts_board_id ON drafts(board_id);
CREATE INDEX IF NOT EXISTS idx_drafts_created_at ON drafts(created_at);
CREATE INDEX IF NOT EXISTS idx_drafts_updated_at ON drafts(updated_at);
CREATE INDEX IF NOT EXISTS idx_drafts_is_archived ON drafts(is_archived);

-- Composite indexes for drafts
CREATE INDEX IF NOT EXISTS idx_drafts_author_updated ON drafts(author_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_drafts_board_updated ON drafts(board_id, updated_at DESC);

-- Create indexes for user_sessions table
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at);

-- Create indexes for read_status table
CREATE INDEX IF NOT EXISTS idx_read_status_user_id ON read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_read_status_post_id ON read_status(post_id);
CREATE INDEX IF NOT EXISTS idx_read_status_read_at ON read_status(read_at);

-- Composite index for read status
CREATE UNIQUE INDEX IF NOT EXISTS idx_read_status_unique ON read_status(user_id, post_id);

-- Create indexes for user_follows table
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created_at ON user_follows(created_at);

-- Composite index for user follows
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_follows_unique ON user_follows(follower_id, following_id);

-- Create indexes for user_preferences table
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(key);

-- Composite index for user preferences
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferences_unique ON user_preferences(user_id, key);

-- Create indexes for translation_cache table
CREATE INDEX IF NOT EXISTS idx_translation_cache_source_text ON translation_cache(source_text_hash);
CREATE INDEX IF NOT EXISTS idx_translation_cache_target_lang ON translation_cache(target_language);
CREATE INDEX IF NOT EXISTS idx_translation_cache_created_at ON translation_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_translation_cache_expires_at ON translation_cache(expires_at);

-- Composite index for translation cache
CREATE UNIQUE INDEX IF NOT EXISTS idx_translation_cache_unique ON translation_cache(source_text_hash, target_language);

-- Create indexes for audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Composite indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON audit_logs(action, created_at DESC);

-- Analyze tables to update statistics
ANALYZE TABLE posts;
ANALYZE TABLE comments;
ANALYZE TABLE votes;
ANALYZE TABLE users;
ANALYZE TABLE boards;
ANALYZE TABLE categories;
ANALYZE TABLE tags;
ANALYZE TABLE post_tags;
ANALYZE TABLE attachments;
ANALYZE TABLE notifications;
ANALYZE TABLE drafts;
ANALYZE TABLE user_sessions;
ANALYZE TABLE read_status;
ANALYZE TABLE user_follows;
ANALYZE TABLE user_preferences;
ANALYZE TABLE translation_cache;
ANALYZE TABLE audit_logs;

-- Show index usage statistics
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    CARDINALITY,
    SUB_PART,
    PACKED,
    NULLABLE,
    INDEX_TYPE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'community_hub'
ORDER BY TABLE_NAME, INDEX_NAME;

-- Show table sizes
SELECT 
    TABLE_NAME,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Size (MB)',
    TABLE_ROWS
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'community_hub'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;
