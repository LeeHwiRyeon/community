import React from 'react';
import type { OverviewCardsProps } from '../../types/dashboard';
import './OverviewCards.css';

const OverviewCards: React.FC<OverviewCardsProps> = ({ overview, loading }) => {
    if (loading || !overview) {
        return (
            <div className="overview-cards">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="overview-card skeleton">
                        <div className="skeleton-text"></div>
                        <div className="skeleton-value"></div>
                    </div>
                ))}
            </div>
        );
    }

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const getChangeClass = (change: string): string => {
        const num = parseFloat(change);
        if (num > 0) return 'positive';
        if (num < 0) return 'negative';
        return 'neutral';
    };

    const cards = [
        {
            title: '전체 사용자',
            value: overview.totalUsers,
            today: null,
            change: overview.totalUsersChange,
            icon: '👥'
        },
        {
            title: '활성 사용자',
            value: overview.activeUsersToday,
            today: '오늘',
            change: overview.activeUsersChange,
            icon: '✨'
        },
        {
            title: '게시물',
            value: overview.totalPosts,
            today: `+${overview.postsToday} 오늘`,
            change: overview.postsChange,
            icon: '📝'
        },
        {
            title: '댓글',
            value: overview.totalComments,
            today: `+${overview.commentsToday} 오늘`,
            change: overview.commentsChange,
            icon: '💬'
        },
        {
            title: '좋아요',
            value: overview.totalLikes,
            today: `+${overview.likesToday} 오늘`,
            change: overview.likesChange,
            icon: '❤️'
        },
        {
            title: '조회수',
            value: overview.totalViews,
            today: `+${overview.viewsToday} 오늘`,
            change: overview.viewsChange,
            icon: '👁️'
        }
    ];

    return (
        <div className="overview-cards">
            {cards.map((card, index) => (
                <div key={index} className="overview-card">
                    <div className="card-header">
                        <span className="card-icon">{card.icon}</span>
                        <h3>{card.title}</h3>
                    </div>
                    <div className="card-body">
                        <div className="card-value">{formatNumber(card.value)}</div>
                        {card.today && (
                            <div className="card-today">{card.today}</div>
                        )}
                    </div>
                    <div className={`card-change ${getChangeClass(card.change)}`}>
                        {parseFloat(card.change) > 0 && '+'}
                        {card.change}% 어제 대비
                    </div>
                </div>
            ))}
        </div>
    );
};

export default OverviewCards;
