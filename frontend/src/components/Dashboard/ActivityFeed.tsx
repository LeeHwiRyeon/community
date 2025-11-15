import React from 'react';
import type { ActivityFeedProps } from '../../types/dashboard';
import './ActivityFeed.css';

const ActivityFeed: React.FC<ActivityFeedProps> = ({
    activities,
    loading,
    onRefresh
}) => {
    if (loading) {
        return (
            <div className="activity-feed">
                <div className="feed-header">
                    <h3>실시간 활동</h3>
                </div>
                <div className="feed-skeleton">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="skeleton-activity"></div>
                    ))}
                </div>
            </div>
        );
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'post_created':
                return '📝';
            case 'comment_created':
                return '💬';
            case 'like_added':
                return '❤️';
            case 'post_viewed':
                return '👁️';
            case 'login':
                return '🔓';
            case 'logout':
                return '🔒';
            default:
                return '⭐';
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'post_created':
                return 'blue';
            case 'comment_created':
                return 'green';
            case 'like_added':
                return 'red';
            case 'post_viewed':
                return 'purple';
            case 'login':
                return 'orange';
            case 'logout':
                return 'gray';
            default:
                return 'default';
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;

        return date.toLocaleDateString('ko-KR');
    };

    return (
        <div className="activity-feed">
            <div className="feed-header">
                <h3>실시간 활동</h3>
                <button onClick={onRefresh} className="refresh-btn">
                    🔄 새로고침
                </button>
            </div>

            {activities.length === 0 ? (
                <div className="feed-empty">
                    <p>최근 활동이 없습니다</p>
                </div>
            ) : (
                <div className="feed-list">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className={`activity-item activity-${getActivityColor(activity.activity_type)}`}
                        >
                            <div className="activity-icon">
                                {getActivityIcon(activity.activity_type)}
                            </div>

                            <div className="activity-content">
                                <div className="activity-user">
                                    {activity.avatar_url ? (
                                        <img
                                            src={activity.avatar_url}
                                            alt={activity.username}
                                            className="user-avatar-small"
                                        />
                                    ) : (
                                        <div className="avatar-placeholder-small">
                                            {activity.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="username">{activity.username}</span>
                                </div>

                                <div className="activity-description">
                                    {activity.activity_description}
                                </div>

                                <div className="activity-time">
                                    {formatTimeAgo(activity.created_at)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActivityFeed;
