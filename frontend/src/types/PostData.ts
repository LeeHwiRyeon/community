/**
 * 📝 PostData 공통 타입 정의
 * 
 * 모든 컴포넌트에서 사용하는 통일된 PostData 타입
 * VirtualizedContentFeed, EnhancedPostCard, OptimizedPostCard에서 공통 사용
 * 
 * @author AUTOAGENTS Manager
 * @version 1.0.0
 * @created 2025-10-02
 */

// 기본 PostData 인터페이스
export interface PostData {
    id: string | number;
    title: string;
    content: string;
    excerpt?: string;
    author: {
        name: string;
        avatar?: string;
        verified?: boolean;
    };
    community?: string;
    timestamp?: string;
    stats?: {
        views: number;
        likes: number;
        comments: number;
    };
    metadata: {
        created_at: string;
        views: number;
        likes: number;
        comments: number;
    };
    aiAnalysis?: {
        sentiment: string;
        quality_score: number;
        trend_score: number;
    };
    thumbnail?: string;
    type: 'enhanced' | 'standard';
    engagement?: number;
    content_analysis?: any;
    multimedia?: any;
}

// 확장된 PostData 인터페이스 (EnhancedPostCard용)
export interface EnhancedPostData extends PostData {
    excerpt: string;
    engagement: number;
    content_analysis: {
        readability: number;
        sentiment: string;
        keywords: string[];
        topics: string[];
    };
    multimedia: {
        images: string[];
        videos: string[];
        audio: string[];
    };
    social_proof: {
        shares: number;
        bookmarks: number;
        reactions: number;
    };
    trending_score: number;
    personalization_score: number;
}

// 최적화된 PostData 인터페이스 (OptimizedPostCard용)
export interface OptimizedPostData extends PostData {
    id: number; // OptimizedPostCard는 number 타입 사용
    performance_metrics: {
        load_time: number;
        render_time: number;
        memory_usage: number;
    };
    accessibility: {
        alt_text: string;
        aria_label: string;
        keyboard_navigable: boolean;
    };
    seo: {
        meta_title: string;
        meta_description: string;
        keywords: string[];
    };
}

// PostData 유니온 타입 (모든 컴포넌트에서 사용 가능)
export type UniversalPostData = PostData | EnhancedPostData | OptimizedPostData;

// PostData 타입 가드 함수들
export const isEnhancedPostData = (post: UniversalPostData): post is EnhancedPostData => {
    return 'excerpt' in post && 'engagement' in post && 'content_analysis' in post;
};

export const isOptimizedPostData = (post: UniversalPostData): post is OptimizedPostData => {
    return 'performance_metrics' in post && 'accessibility' in post && 'seo' in post;
};

export const isBasicPostData = (post: UniversalPostData): post is PostData => {
    return !isEnhancedPostData(post) && !isOptimizedPostData(post);
};

// PostData 변환 함수들
export const convertToEnhancedPostData = (post: PostData): EnhancedPostData => {
    return {
        ...post,
        excerpt: post.excerpt || post.content.substring(0, 150) + '...',
        engagement: post.engagement || (post.stats?.likes || 0) + (post.stats?.comments || 0),
        content_analysis: post.content_analysis || {
            readability: 0.8,
            sentiment: 'neutral',
            keywords: [],
            topics: []
        },
        multimedia: post.multimedia || {
            images: [],
            videos: [],
            audio: []
        },
        social_proof: {
            shares: 0,
            bookmarks: 0,
            reactions: 0
        },
        trending_score: 0,
        personalization_score: 0
    };
};

export const convertToOptimizedPostData = (post: PostData): OptimizedPostData => {
    return {
        ...post,
        id: typeof post.id === 'string' ? parseInt(post.id) : post.id,
        performance_metrics: {
            load_time: 0,
            render_time: 0,
            memory_usage: 0
        },
        accessibility: {
            alt_text: post.title,
            aria_label: `Post: ${post.title}`,
            keyboard_navigable: true
        },
        seo: {
            meta_title: post.title,
            meta_description: post.excerpt || post.content.substring(0, 160),
            keywords: []
        }
    };
};

// 기본 PostData 생성 함수
export const createPostData = (data: Partial<PostData>): PostData => {
    return {
        id: data.id || Date.now(),
        title: data.title || 'Untitled Post',
        content: data.content || '',
        author: data.author || { name: 'Anonymous' },
        metadata: data.metadata || {
            created_at: new Date().toISOString(),
            views: 0,
            likes: 0,
            comments: 0
        },
        type: data.type || 'standard',
        ...data
    };
};

// PostData 검증 함수
export const validatePostData = (post: any): post is PostData => {
    return (
        post &&
        typeof post === 'object' &&
        (typeof post.id === 'string' || typeof post.id === 'number') &&
        typeof post.title === 'string' &&
        typeof post.content === 'string' &&
        post.author &&
        typeof post.author.name === 'string' &&
        post.metadata &&
        typeof post.metadata.created_at === 'string'
    );
};

export default PostData;
