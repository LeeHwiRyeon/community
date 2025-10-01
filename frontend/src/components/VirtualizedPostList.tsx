import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Box, Text } from '@chakra-ui/react';
import { Post } from '../api';

interface PostWithBoard {
    boardId: string;
    boardTitle: string;
    boardFormat: string | null;
    communityId?: string;
    communityTitle?: string;
    post: Post;
}

interface VirtualizedPostListProps {
    posts: PostWithBoard[];
    onPostClick: (postId: string, boardId: string) => void;
    height?: number;
    itemHeight?: number;
}

interface PostItemProps {
    index: number;
    style: React.CSSProperties;
    data: {
        posts: PostWithBoard[];
        onPostClick: (postId: string, boardId: string) => void;
    };
}

const PostItem: React.FC<PostItemProps> = ({ index, style, data }) => {
    const { posts, onPostClick } = data;
    const postWithBoard = posts[index];

    if (!postWithBoard) return null;

    const { post, boardTitle, boardFormat, communityTitle } = postWithBoard;

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const toExcerpt = (content: string, maxLength: number) => {
        if (!content) return '';
        const cleanContent = content.replace(/<[^>]*>/g, '');
        return cleanContent.length > maxLength
            ? cleanContent.substring(0, maxLength) + '...'
            : cleanContent;
    };

    const safeDate = (date: string | number | Date | undefined) => {
        if (!date) return '';
        try {
            return new Date(date).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return '';
        }
    };

    return (
        <div style={style}>
            <div
                className="community-hub__post-item"
                onClick={() => onPostClick(post.id, postWithBoard.boardId)}
                style={{
                    cursor: 'pointer',
                    margin: '8px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
            >
                <div className="community-hub__post-header">
                    <div className="community-hub__post-meta">
                        <span className="community-hub__post-board">{boardTitle}</span>
                        {boardFormat && (
                            <span className="community-hub__post-format">{boardFormat}</span>
                        )}
                        {communityTitle && (
                            <span className="community-hub__post-community">{communityTitle}</span>
                        )}
                    </div>
                    <div className="community-hub__post-stats">
                        <span>{formatNumber(post.views || 0)} views</span>
                        <span>{formatNumber(post.likes || 0)} likes</span>
                        <span>{safeDate(post.created_at)}</span>
                    </div>
                </div>
                <div className="community-hub__post-content">
                    <h4 className="community-hub__post-title">{post.title}</h4>
                    <p className="community-hub__post-excerpt">
                        {toExcerpt(post.content || '', 120)}
                    </p>
                </div>
                <div className="community-hub__post-footer">
                    <span className="community-hub__post-author">{post.author || 'Anonymous'}</span>
                </div>
            </div>
        </div>
    );
};

const VirtualizedPostList: React.FC<VirtualizedPostListProps> = ({
    posts,
    onPostClick,
    height = 600,
    itemHeight = 150
}) => {
    const itemData = useMemo(() => ({
        posts,
        onPostClick
    }), [posts, onPostClick]);

    if (posts.length === 0) {
        return (
            <Box p={4} textAlign="center">
                <Text color="gray.500">No posts available</Text>
            </Box>
        );
    }

    return (
        <Box>
            <List
                height={height}
                itemCount={posts.length}
                itemSize={itemHeight}
                itemData={itemData}
                overscanCount={3} // Render 3 extra items outside visible area for smooth scrolling
            >
                {PostItem}
            </List>
        </Box>
    );
};

export default VirtualizedPostList;