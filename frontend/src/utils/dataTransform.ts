import type { Post, Board } from '../types/api';

// 백엔드 API 데이터를 프론트엔드 Article 형식으로 변환
export const transformPostToArticle = (post: Post, boardName?: string): any => {
    return {
        id: post.id,
        title: post.title,
        content: post.content || '',
        author: post.author || '익명',
        timestamp: post.created_at || post.date || new Date().toISOString(),
        category: post.category || '',
        views: post.views || 0,
        comments: post.comments || 0,
        likes: post.likes || 0,
        image: post.thumb || '',
        isHot: (post.views || 0) > 10000,
        isNew: isRecentPost(post.created_at || post.date),
        boardId: post.board_id,
        board_id: post.board_id,
        tag: post.tag,
        thumb: post.thumb,
        deleted: post.deleted,
        created_at: post.created_at,
        updated_at: post.updated_at,
        date: post.date
    };
};

// 백엔드 Board 데이터를 프론트엔드 Board 형식으로 변환
export const transformApiBoard = (board: Board): any => {
    return {
        id: board.id,
        name: board.title || board.id,
        title: board.title || board.id,
        description: `${board.title} 게시판`,
        icon: getBoardIcon(board.id),
        type: getBoardType(board.id),
        color: getBoardColor(board.id),
        ordering: board.ordering,
        deleted: board.deleted,
        created_at: board.created_at,
        updated_at: board.updated_at
    };
};

// 최근 게시글 판별 (24시간 이내)
const isRecentPost = (dateString?: string): boolean => {
    if (!dateString) return false;

    const postDate = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);

    return diffHours <= 24;
};

// 게시판 아이콘 매핑
const getBoardIcon = (boardId: string): string => {
    const iconMap: Record<string, string> = {
        'all': '📋',
        'news': '📰',
        'free': '💬',
        'image': '📸',
        'qna': '❓',
        'game': '🎮',
        'strategy': '🎯',
        'cosplay': '📸',
        'streaming': '📺',
        'ranking': '🏆'
    };

    return iconMap[boardId] || '📋';
};

// 게시판 타입 매핑
const getBoardType = (boardId: string): 'text' | 'image' | 'stream' => {
    const typeMap: Record<string, 'text' | 'image' | 'stream'> = {
        'image': 'image',
        'cosplay': 'image',
        'streaming': 'stream'
    };

    return typeMap[boardId] || 'text';
};

// 게시판 색상 매핑
const getBoardColor = (boardId: string): string => {
    const colorMap: Record<string, string> = {
        'all': 'bg-gray-100',
        'news': 'bg-red-100',
        'free': 'bg-green-100',
        'image': 'bg-pink-100',
        'qna': 'bg-blue-100',
        'game': 'bg-purple-100',
        'strategy': 'bg-blue-100',
        'cosplay': 'bg-pink-100',
        'streaming': 'bg-purple-100',
        'ranking': 'bg-yellow-100'
    };

    return colorMap[boardId] || 'bg-gray-100';
};

// API 에러 메시지 한국어 변환
export const translateApiError = (error: string): string => {
    const errorMap: Record<string, string> = {
        'rate_limited_write': '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
        'rate_limited_search': '검색 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        'invalid_token': '인증 토큰이 유효하지 않습니다.',
        'token_expired': '인증 토큰이 만료되었습니다.',
        'admin_required': '관리자 권한이 필요합니다.',
        'moderator_or_admin_required': '중재자 또는 관리자 권한이 필요합니다.',
        'read_only_mode': '현재 읽기 전용 모드입니다.',
        'provider_disabled': '비활성화된 로그인 제공자입니다.',
        'invalid_state': 'OAuth 인증 상태가 유효하지 않습니다.',
        'invalid_refresh': '리프레시 토큰이 유효하지 않습니다.',
        'Network error': '네트워크 연결을 확인해주세요.',
        'Request failed': '요청이 실패했습니다.'
    };

    return errorMap[error] || error;
};

// 날짜 포맷팅
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
        return '방금 전';
    } else if (diffMinutes < 60) {
        return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
        return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
        return `${diffDays}일 전`;
    } else {
        return date.toLocaleDateString('ko-KR');
    }
};

// 숫자 포맷팅 (조회수, 좋아요 등)
export const formatNumber = (num: number): string => {
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
};