import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Box, Text } from '@chakra-ui/react';

interface BoardSummary {
    id: string;
    title: string;
    summary: string;
    format: string | null;
    postCount: number;
    latestDateLabel: string;
    views: number;
    communityId?: string;
    communityTitle?: string;
}

interface VirtualizedBoardListProps {
    boardSummaries: BoardSummary[];
    selectedCommunityId: string | null;
    onBoardClick: (boardId: string) => void;
    height?: number;
    itemHeight?: number;
}

interface BoardItemProps {
    index: number;
    style: React.CSSProperties;
    data: {
        boards: BoardSummary[];
        selectedCommunityId: string | null;
        onBoardClick: (boardId: string) => void;
    };
}

const BoardItem: React.FC<BoardItemProps> = ({ index, style, data }) => {
    const { boards, selectedCommunityId, onBoardClick } = data;
    const board = boards[index];

    if (!board) return null;

    return (
        <div style={style}>
            <div
                className="board-card card-enter"
                onClick={() => onBoardClick(board.id)}
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
                <div className="board-card__header">
                    <div className="board-card__title-section">
                        <span className="board-card__title">{board.title}</span>
                        {board.format ? (
                            <span className="board-card__badge">{board.format}</span>
                        ) : null}
                        {selectedCommunityId === 'all' && board.communityTitle && (
                            <span className="board-card__community-badge">{board.communityTitle}</span>
                        )}
                    </div>
                    <span className="board-card__summary">
                        {board.summary || '게시판 설명이 없습니다.'}
                    </span>
                </div>
                <div className="board-card__body">
                    <span>게시물: {board.postCount.toLocaleString()}</span>
                    <span>조회수: {board.views.toLocaleString()}</span>
                    {board.latestDateLabel ? (
                        <span>최신: {board.latestDateLabel}</span>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

const VirtualizedBoardList: React.FC<VirtualizedBoardListProps> = ({
    boardSummaries,
    selectedCommunityId,
    onBoardClick,
    height = 400,
    itemHeight = 120
}) => {
    const itemData = useMemo(() => ({
        boards: boardSummaries,
        selectedCommunityId,
        onBoardClick
    }), [boardSummaries, selectedCommunityId, onBoardClick]);

    if (boardSummaries.length === 0) {
        return (
            <Box p={4} textAlign="center">
                <Text color="gray.500">No boards available</Text>
            </Box>
        );
    }

    return (
        <Box>
            <List
                height={height}
                itemCount={boardSummaries.length}
                itemSize={itemHeight}
                itemData={itemData}
                overscanCount={5} // Render 5 extra items outside visible area for smooth scrolling
            >
                {BoardItem}
            </List>
        </Box>
    );
};

export default VirtualizedBoardList;
