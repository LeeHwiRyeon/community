-- 🚀 Enhanced Database Schema for Community Platform v1.1
-- 
-- AI 기반 컨텐츠 분석, 개인화 추천, 실시간 기능을 지원하는
-- 최적화된 데이터베이스 스키마
-- 
-- @author AUTOAGENTS Manager
-- @version 2.0.0
-- @created 2025-10-02

-- ============================================================================
-- 1. 사용자 및 인증 관련 테이블
-- ============================================================================

-- 향상된 사용자 테이블
CREATE TABLE enhanced_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- 기본 정보
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    bio TEXT,
    
    -- 역할 및 상태
    role user_role_enum NOT NULL DEFAULT 'user',
    status user_status_enum NOT NULL DEFAULT 'pending',
    subscription_tier subscription_tier_enum NOT NULL DEFAULT 'free',
    
    -- 개인화 정보
    interests JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    
    -- 활동 통계
    activity_score INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    content_quality_score DECIMAL(3,2) DEFAULT 0.50,
    
    -- 보안 정보
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    login_count INTEGER DEFAULT 0,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- 인덱스
    CONSTRAINT chk_activity_score CHECK (activity_score >= 0),
    CONSTRAINT chk_reputation_score CHECK (reputation_score >= 0),
    CONSTRAINT chk_quality_score CHECK (content_quality_score >= 0 AND content_quality_score <= 1)
);

-- 사용자 프로필 확장 테이블
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES enhanced_users(id) ON DELETE CASCADE,
    
    -- 개인 정보
    birth_date DATE,
    gender gender_enum,
    location VARCHAR(100),
    timezone VARCHAR(50),
    language_preference VARCHAR(10) DEFAULT 'ko',
    
    -- 소셜 정보
    social_links JSONB DEFAULT '{}',
    website_url VARCHAR(500),
    
    -- 개인화 데이터
    reading_patterns JSONB DEFAULT '{}',
    engagement_history JSONB DEFAULT '[]',
    content_preferences JSONB DEFAULT '{}',
    
    -- AI 분석 데이터
    personality_traits JSONB DEFAULT '{}',
    behavior_patterns JSONB DEFAULT '{}',
    recommendation_feedback JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. 컨텐츠 관련 테이블
-- ============================================================================

-- 향상된 게시글 테이블
CREATE TABLE enhanced_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 기본 정보
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    slug VARCHAR(200) UNIQUE,
    
    -- 작성자 정보
    author_id UUID NOT NULL REFERENCES enhanced_users(id),
    author_name VARCHAR(100) NOT NULL,
    
    -- 분류 정보
    board_id UUID NOT NULL REFERENCES boards(id),
    category VARCHAR(50),
    subcategory VARCHAR(50),
    tags JSONB DEFAULT '[]',
    
    -- 상태 정보
    status post_status_enum NOT NULL DEFAULT 'draft',
    visibility visibility_enum NOT NULL DEFAULT 'public',
    priority priority_enum NOT NULL DEFAULT 'medium',
    
    -- 멀티미디어
    thumbnail_url VARCHAR(500),
    media_urls JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    
    -- 참여도 메트릭
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    bookmarks_count INTEGER DEFAULT 0,
    
    -- AI 분석 결과
    content_analysis JSONB DEFAULT '{}',
    quality_score DECIMAL(3,2) DEFAULT 0.50,
    sentiment_score DECIMAL(3,2) DEFAULT 0.00,
    difficulty_level difficulty_enum DEFAULT 'intermediate',
    reading_time INTEGER DEFAULT 0,
    
    -- SEO 정보
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    canonical_url VARCHAR(500),
    
    -- 상호작용 설정
    allow_comments BOOLEAN DEFAULT TRUE,
    allow_voting BOOLEAN DEFAULT TRUE,
    allow_sharing BOOLEAN DEFAULT TRUE,
    moderation_required BOOLEAN DEFAULT FALSE,
    
    -- 스케줄링
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- 제약조건
    CONSTRAINT chk_quality_score CHECK (quality_score >= 0 AND quality_score <= 1),
    CONSTRAINT chk_sentiment_score CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    CONSTRAINT chk_reading_time CHECK (reading_time >= 0)
);

-- 컨텐츠 분석 결과 테이블
CREATE TABLE content_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES enhanced_posts(id) ON DELETE CASCADE,
    
    -- 감정 분석
    sentiment_analysis JSONB NOT NULL,
    emotion_scores JSONB DEFAULT '{}',
    
    -- 품질 분석
    quality_metrics JSONB NOT NULL,
    readability_score DECIMAL(3,2),
    engagement_potential DECIMAL(3,2),
    information_density DECIMAL(3,2),
    originality_score DECIMAL(3,2),
    
    -- 토픽 및 키워드
    extracted_topics JSONB DEFAULT '[]',
    keywords JSONB DEFAULT '[]',
    entities JSONB DEFAULT '[]',
    
    -- 추천 정보
    suggested_tags JSONB DEFAULT '[]',
    target_audience JSONB DEFAULT '[]',
    optimal_posting_time TIMESTAMP WITH TIME ZONE,
    improvement_suggestions JSONB DEFAULT '[]',
    
    -- 분석 메타데이터
    analysis_version VARCHAR(20) NOT NULL,
    processing_time INTEGER,
    confidence_score DECIMAL(3,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 인덱스
    CONSTRAINT chk_confidence_score CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

-- ============================================================================
-- 3. 참여도 및 상호작용 테이블
-- ============================================================================

-- 통합 참여도 추적 테이블
CREATE TABLE engagement_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 기본 정보
    user_id UUID REFERENCES enhanced_users(id),
    post_id UUID NOT NULL REFERENCES enhanced_posts(id) ON DELETE CASCADE,
    event_type engagement_type_enum NOT NULL,
    
    -- 상세 정보
    event_data JSONB DEFAULT '{}',
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    
    -- 컨텍스트 정보
    referrer_url VARCHAR(500),
    device_type device_type_enum,
    platform VARCHAR(50),
    
    -- 시간 정보
    duration INTEGER, -- 초 단위
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 개인화 정보
    recommendation_context JSONB DEFAULT '{}',
    personalization_score DECIMAL(3,2)
);

-- 실시간 메트릭 테이블
CREATE TABLE realtime_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES enhanced_posts(id) ON DELETE CASCADE,
    
    -- 실시간 데이터
    live_viewers INTEGER DEFAULT 0,
    recent_activity JSONB DEFAULT '[]',
    viral_potential DECIMAL(3,2) DEFAULT 0.00,
    trending_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- 시간별 통계
    hourly_views INTEGER DEFAULT 0,
    hourly_engagements INTEGER DEFAULT 0,
    
    -- 메타데이터
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT chk_viral_potential CHECK (viral_potential >= 0 AND viral_potential <= 1),
    CONSTRAINT chk_trending_score CHECK (trending_score >= 0 AND trending_score <= 1)
);

-- ============================================================================
-- 4. 개인화 및 추천 시스템 테이블
-- ============================================================================

-- 사용자 관심사 프로필
CREATE TABLE user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES enhanced_users(id) ON DELETE CASCADE,
    
    -- 관심사 정보
    interest_category VARCHAR(100) NOT NULL,
    interest_weight DECIMAL(3,2) NOT NULL DEFAULT 0.50,
    confidence_level DECIMAL(3,2) NOT NULL DEFAULT 0.50,
    
    -- 학습 데이터
    interaction_count INTEGER DEFAULT 0,
    positive_feedback INTEGER DEFAULT 0,
    negative_feedback INTEGER DEFAULT 0,
    
    -- 시간 정보
    first_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT chk_interest_weight CHECK (interest_weight >= 0 AND interest_weight <= 1),
    CONSTRAINT chk_confidence_level CHECK (confidence_level >= 0 AND confidence_level <= 1),
    CONSTRAINT uk_user_interest UNIQUE (user_id, interest_category)
);

-- 추천 로그 테이블
CREATE TABLE recommendation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES enhanced_users(id) ON DELETE CASCADE,
    
    -- 추천 정보
    recommended_posts JSONB NOT NULL,
    algorithm_used VARCHAR(50) NOT NULL,
    recommendation_context JSONB DEFAULT '{}',
    
    -- 성능 메트릭
    relevance_scores JSONB DEFAULT '{}',
    diversity_score DECIMAL(3,2),
    novelty_score DECIMAL(3,2),
    
    -- 피드백
    user_feedback JSONB DEFAULT '{}',
    click_through_rate DECIMAL(3,2),
    engagement_rate DECIMAL(3,2),
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 5. 트렌드 및 분석 테이블
-- ============================================================================

-- 트렌딩 토픽 테이블
CREATE TABLE trending_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 토픽 정보
    topic_name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    
    -- 트렌드 메트릭
    trend_score DECIMAL(5,2) NOT NULL,
    growth_rate DECIMAL(5,2) DEFAULT 0.00,
    velocity_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- 통계 정보
    mention_count INTEGER DEFAULT 0,
    engagement_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    
    -- 시간 정보
    time_window INTEGER NOT NULL, -- 시간 (시간 단위)
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT chk_velocity_score CHECK (velocity_score >= 0 AND velocity_score <= 1)
);

-- 컨텐츠 성과 분석 테이블
CREATE TABLE content_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES enhanced_posts(id) ON DELETE CASCADE,
    
    -- 성과 메트릭
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    retention_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- 시간별 분석
    peak_engagement_time TIMESTAMP WITH TIME ZONE,
    engagement_duration INTEGER, -- 분 단위
    
    -- 비교 메트릭
    performance_percentile INTEGER,
    category_rank INTEGER,
    
    -- 예측 데이터
    predicted_performance JSONB DEFAULT '{}',
    actual_vs_predicted JSONB DEFAULT '{}',
    
    -- 분석 기간
    analysis_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    analysis_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. 캐싱 및 성능 최적화 테이블
-- ============================================================================

-- 컨텐츠 캐시 테이블
CREATE TABLE content_cache (
    cache_key VARCHAR(200) PRIMARY KEY,
    content_data JSONB NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    
    -- 캐시 메타데이터
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- 캐시 태그 (무효화용)
    cache_tags JSONB DEFAULT '[]'
);

-- 검색 인덱스 테이블
CREATE TABLE search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES enhanced_posts(id) ON DELETE CASCADE,
    
    -- 검색 데이터
    search_vector tsvector,
    keywords_vector tsvector,
    content_tokens JSONB DEFAULT '[]',
    
    -- 가중치 정보
    title_weight DECIMAL(3,2) DEFAULT 1.00,
    content_weight DECIMAL(3,2) DEFAULT 0.50,
    tags_weight DECIMAL(3,2) DEFAULT 0.75,
    
    -- 인덱스 메타데이터
    last_indexed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    index_version INTEGER DEFAULT 1
);

-- ============================================================================
-- 7. ENUM 타입 정의
-- ============================================================================

-- 사용자 역할
CREATE TYPE user_role_enum AS ENUM (
    'owner', 'admin', 'vip', 'streamer', 'cosplayer', 'manager', 'user'
);

-- 사용자 상태
CREATE TYPE user_status_enum AS ENUM (
    'active', 'inactive', 'suspended', 'pending', 'banned'
);

-- 구독 등급
CREATE TYPE subscription_tier_enum AS ENUM (
    'free', 'basic', 'premium', 'vip', 'enterprise'
);

-- 성별
CREATE TYPE gender_enum AS ENUM (
    'male', 'female', 'other', 'prefer_not_to_say'
);

-- 게시글 상태
CREATE TYPE post_status_enum AS ENUM (
    'draft', 'published', 'archived', 'deleted', 'scheduled'
);

-- 가시성 설정
CREATE TYPE visibility_enum AS ENUM (
    'public', 'members', 'vip', 'private'
);

-- 우선순위
CREATE TYPE priority_enum AS ENUM (
    'low', 'medium', 'high', 'urgent'
);

-- 난이도
CREATE TYPE difficulty_enum AS ENUM (
    'beginner', 'intermediate', 'advanced', 'expert'
);

-- 참여 이벤트 타입
CREATE TYPE engagement_type_enum AS ENUM (
    'view', 'like', 'dislike', 'comment', 'share', 'bookmark', 
    'click', 'scroll', 'time_spent', 'download'
);

-- 디바이스 타입
CREATE TYPE device_type_enum AS ENUM (
    'desktop', 'mobile', 'tablet', 'tv', 'other'
);

-- ============================================================================
-- 8. 인덱스 생성
-- ============================================================================

-- 사용자 테이블 인덱스
CREATE INDEX idx_users_email ON enhanced_users(email);
CREATE INDEX idx_users_username ON enhanced_users(username);
CREATE INDEX idx_users_role ON enhanced_users(role);
CREATE INDEX idx_users_status ON enhanced_users(status);
CREATE INDEX idx_users_activity_score ON enhanced_users(activity_score DESC);
CREATE INDEX idx_users_created_at ON enhanced_users(created_at DESC);

-- 게시글 테이블 인덱스
CREATE INDEX idx_posts_author_id ON enhanced_posts(author_id);
CREATE INDEX idx_posts_board_id ON enhanced_posts(board_id);
CREATE INDEX idx_posts_status ON enhanced_posts(status);
CREATE INDEX idx_posts_visibility ON enhanced_posts(visibility);
CREATE INDEX idx_posts_published_at ON enhanced_posts(published_at DESC);
CREATE INDEX idx_posts_quality_score ON enhanced_posts(quality_score DESC);
CREATE INDEX idx_posts_views_count ON enhanced_posts(views_count DESC);
CREATE INDEX idx_posts_likes_count ON enhanced_posts(likes_count DESC);

-- 복합 인덱스
CREATE INDEX idx_posts_status_visibility ON enhanced_posts(status, visibility);
CREATE INDEX idx_posts_board_published ON enhanced_posts(board_id, published_at DESC);
CREATE INDEX idx_posts_author_status ON enhanced_posts(author_id, status);

-- GIN 인덱스 (JSONB 컬럼용)
CREATE INDEX idx_posts_tags_gin ON enhanced_posts USING GIN(tags);
CREATE INDEX idx_posts_content_analysis_gin ON enhanced_posts USING GIN(content_analysis);
CREATE INDEX idx_users_interests_gin ON enhanced_users USING GIN(interests);
CREATE INDEX idx_users_preferences_gin ON enhanced_users USING GIN(preferences);

-- 참여도 이벤트 인덱스
CREATE INDEX idx_engagement_user_id ON engagement_events(user_id);
CREATE INDEX idx_engagement_post_id ON engagement_events(post_id);
CREATE INDEX idx_engagement_type ON engagement_events(event_type);
CREATE INDEX idx_engagement_timestamp ON engagement_events(timestamp DESC);
CREATE INDEX idx_engagement_user_post ON engagement_events(user_id, post_id);

-- 실시간 메트릭 인덱스
CREATE INDEX idx_realtime_post_id ON realtime_metrics(post_id);
CREATE INDEX idx_realtime_trending_score ON realtime_metrics(trending_score DESC);
CREATE INDEX idx_realtime_viral_potential ON realtime_metrics(viral_potential DESC);
CREATE INDEX idx_realtime_last_updated ON realtime_metrics(last_updated DESC);

-- 검색 인덱스
CREATE INDEX idx_search_vector ON search_index USING GIN(search_vector);
CREATE INDEX idx_keywords_vector ON search_index USING GIN(keywords_vector);
CREATE INDEX idx_search_post_id ON search_index(post_id);

-- 트렌딩 토픽 인덱스
CREATE INDEX idx_trending_score ON trending_topics(trend_score DESC);
CREATE INDEX idx_trending_category ON trending_topics(category);
CREATE INDEX idx_trending_window ON trending_topics(window_start, window_end);

-- ============================================================================
-- 9. 파티셔닝 (선택적)
-- ============================================================================

-- 참여도 이벤트 테이블 월별 파티셔닝
-- CREATE TABLE engagement_events_y2025m10 PARTITION OF engagement_events
-- FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- ============================================================================
-- 10. 뷰 생성
-- ============================================================================

-- 인기 컨텐츠 뷰
CREATE VIEW popular_content AS
SELECT 
    p.*,
    (p.views_count * 0.3 + p.likes_count * 0.4 + p.comments_count * 0.2 + p.shares_count * 0.1) AS popularity_score
FROM enhanced_posts p
WHERE p.status = 'published' 
  AND p.visibility = 'public'
  AND p.deleted_at IS NULL
ORDER BY popularity_score DESC;

-- 사용자 활동 요약 뷰
CREATE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.username,
    u.activity_score,
    COUNT(p.id) AS posts_count,
    AVG(p.quality_score) AS avg_quality_score,
    SUM(p.views_count) AS total_views,
    SUM(p.likes_count) AS total_likes
FROM enhanced_users u
LEFT JOIN enhanced_posts p ON u.id = p.author_id AND p.status = 'published'
WHERE u.status = 'active'
GROUP BY u.id, u.username, u.activity_score;

-- 트렌딩 컨텐츠 뷰
CREATE VIEW trending_content AS
SELECT 
    p.*,
    rm.trending_score,
    rm.viral_potential,
    rm.live_viewers
FROM enhanced_posts p
JOIN realtime_metrics rm ON p.id = rm.post_id
WHERE p.status = 'published' 
  AND p.visibility = 'public'
  AND p.deleted_at IS NULL
  AND rm.trending_score > 0.5
ORDER BY rm.trending_score DESC, rm.viral_potential DESC;

-- ============================================================================
-- 11. 트리거 및 함수
-- ============================================================================

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 시간 트리거
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON enhanced_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON enhanced_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 참여도 카운터 업데이트 함수
CREATE OR REPLACE FUNCTION update_engagement_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event_type = 'view' THEN
        UPDATE enhanced_posts SET views_count = views_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.event_type = 'like' THEN
        UPDATE enhanced_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.event_type = 'comment' THEN
        UPDATE enhanced_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.event_type = 'share' THEN
        UPDATE enhanced_posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.event_type = 'bookmark' THEN
        UPDATE enhanced_posts SET bookmarks_count = bookmarks_count + 1 WHERE id = NEW.post_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 참여도 카운터 트리거
CREATE TRIGGER update_engagement_counters_trigger 
    AFTER INSERT ON engagement_events
    FOR EACH ROW EXECUTE FUNCTION update_engagement_counters();

-- ============================================================================
-- 12. 초기 데이터 및 설정
-- ============================================================================

-- 기본 보드 데이터 (예시)
INSERT INTO boards (id, name, description, category) VALUES
('news', '뉴스', '최신 뉴스 및 소식', 'information'),
('tech', '기술', '기술 관련 토론', 'discussion'),
('community', '커뮤니티', '자유로운 소통 공간', 'social'),
('games', '게임', '게임 관련 컨텐츠', 'entertainment');

-- 기본 관리자 계정 (예시 - 실제 운영시 변경 필요)
INSERT INTO enhanced_users (username, email, password_hash, first_name, last_name, role, status, email_verified)
VALUES ('admin', 'admin@community.com', '$2b$10$hash', 'Admin', 'User', 'admin', 'active', TRUE);

-- ============================================================================
-- 성능 최적화 설정
-- ============================================================================

-- 통계 정보 자동 수집 설정
ALTER TABLE enhanced_posts SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE engagement_events SET (autovacuum_analyze_scale_factor = 0.01);

-- 병렬 처리 설정
SET max_parallel_workers_per_gather = 4;
SET parallel_tuple_cost = 0.1;

-- 메모리 설정 최적화
SET work_mem = '256MB';
SET shared_buffers = '1GB';
SET effective_cache_size = '4GB';

-- ============================================================================
-- 완료 메시지
-- ============================================================================

-- 스키마 생성 완료 로그
DO $$
BEGIN
    RAISE NOTICE '🎉 Enhanced Database Schema v2.0 생성 완료!';
    RAISE NOTICE '📊 총 테이블 수: 12개';
    RAISE NOTICE '🔍 총 인덱스 수: 25개+';
    RAISE NOTICE '👁️ 뷰 수: 3개';
    RAISE NOTICE '⚡ 트리거 및 함수: 3개';
    RAISE NOTICE '🚀 AI 기반 컨텐츠 분석 지원 완료';
    RAISE NOTICE '🎯 개인화 추천 시스템 지원 완료';
    RAISE NOTICE '📈 실시간 트렌드 분석 지원 완료';
END $$;
