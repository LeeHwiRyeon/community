import React from 'react';
import type { LeaderboardTableProps } from '../../types/dashboard';
import './LeaderboardTable.css';

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
    data,
    type,
    loading,
    onTypeChange
}) => {
    if (loading) {
        return (
            <div className="leaderboard-table">
                <div className="leaderboard-header">
                    <h3>리더보드</h3>
                </div>
                <div className="table-skeleton">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="skeleton-row"></div>
                    ))}
                </div>
            </div>
        );
    }

    const getColumnHeader = () => {
        switch (type) {
            case 'posts':
                return '게시물 수';
            case 'comments':
                return '댓글 수';
            case 'likes':
                return '좋아요 수';
            case 'reputation':
                return '평판 점수';
            default:
                return '활동';
        }
    };

    const getValueDisplay = (entry: any) => {
        switch (type) {
            case 'posts':
                return (
                    <div className="value-display">
                        <div className="primary-value">{entry.count} 게시물</div>
                        <div className="secondary-value">
                            조회 {entry.total_views?.toLocaleString()} ·
                            좋아요 {entry.total_likes?.toLocaleString()}
                        </div>
                    </div>
                );
            case 'comments':
                return (
                    <div className="value-display">
                        <div className="primary-value">{entry.count} 댓글</div>
                        <div className="secondary-value">
                            {entry.posts_commented}개 게시물에 참여
                        </div>
                    </div>
                );
            case 'likes':
                return (
                    <div className="value-display">
                        <div className="primary-value">{entry.count} 좋아요</div>
                        <div className="secondary-value">
                            {entry.posts_liked}개 게시물
                        </div>
                    </div>
                );
            case 'reputation':
                return (
                    <div className="value-display">
                        <div className="primary-value">
                            {entry.points?.toLocaleString()} 점 (Lv.{entry.level})
                        </div>
                        <div className="secondary-value">
                            게시물 {entry.post_count} · 댓글 {entry.comment_count}
                        </div>
                    </div>
                );
            default:
                return entry.count;
        }
    };

    const getMedalEmoji = (rank: number) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '';
        }
    };

    return (
        <div className="leaderboard-table">
            <div className="leaderboard-header">
                <h3>리더보드</h3>
                <select
                    value={type}
                    onChange={(e) => onTypeChange(e.target.value)}
                    className="leaderboard-type-select"
                >
                    <option value="posts">게시물</option>
                    <option value="comments">댓글</option>
                    <option value="likes">좋아요</option>
                    <option value="reputation">평판</option>
                </select>
            </div>

            {data.length === 0 ? (
                <div className="leaderboard-empty">
                    <p>데이터가 없습니다</p>
                </div>
            ) : (
                <div className="leaderboard-list">
                    {data.map((entry) => (
                        <div key={entry.user_id} className="leaderboard-item">
                            <div className="rank-section">
                                <span className="rank-number">
                                    {getMedalEmoji(entry.rank)}
                                    {entry.rank <= 3 ? '' : `#${entry.rank}`}
                                </span>
                            </div>

                            <div className="user-section">
                                <div className="user-avatar">
                                    {entry.avatar_url ? (
                                        <img src={entry.avatar_url} alt={entry.username} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {entry.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="user-info">
                                    <div className="username">{entry.username}</div>
                                    <div className="user-email">{entry.email}</div>
                                </div>
                            </div>

                            <div className="value-section">
                                {getValueDisplay(entry)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeaderboardTable;
