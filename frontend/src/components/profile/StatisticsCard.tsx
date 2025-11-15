/**
 * 통계 카드 컴포넌트
 * 사용자 통계 정보 표시
 */

import React from 'react';
import type { UserStatistics } from '../../types/profile';
import './StatisticsCard.css';

interface StatisticsCardProps {
    statistics: UserStatistics;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({ statistics }) => {
    const getProgressToNextLevel = (): number => {
        const currentLevel = statistics.level;
        const currentXP = statistics.experience_points;

        // Level = floor(sqrt(XP / 100)) + 1
        // XP for level N = (N - 1)^2 * 100
        const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
        const xpForNextLevel = Math.pow(currentLevel, 2) * 100;

        const progress = ((currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
        return Math.min(Math.max(progress, 0), 100);
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    };

    const stats = [
        {
            icon: '📝',
            label: '게시글',
            value: formatNumber(statistics.total_posts),
            color: '#4A90E2',
        },
        {
            icon: '👀',
            label: '조회수',
            value: formatNumber(statistics.total_views),
            color: '#7B68EE',
        },
        {
            icon: '❤️',
            label: '받은 좋아요',
            value: formatNumber(statistics.total_likes_received),
            color: '#DC143C',
        },
        {
            icon: '💬',
            label: '받은 댓글',
            value: formatNumber(statistics.total_comments_received),
            color: '#50C878',
        },
        {
            icon: '💭',
            label: '작성 댓글',
            value: formatNumber(statistics.total_comments),
            color: '#87CEEB',
        },
        {
            icon: '👍',
            label: '준 좋아요',
            value: formatNumber(statistics.total_likes_given),
            color: '#FFD700',
        },
    ];

    const streakDays = statistics.current_streak || 0;
    const longestStreak = statistics.longest_streak || 0;

    return (
        <div className="statistics-card">
            {/* 레벨 & 경험치 */}
            <div className="level-section">
                <div className="level-header">
                    <div className="level-badge">
                        <span className="level-label">Lv</span>
                        <span className="level-number">{statistics.level}</span>
                    </div>
                    <div className="reputation">
                        <span className="reputation-icon">⭐</span>
                        <span className="reputation-value">{formatNumber(statistics.reputation_score)}</span>
                        <span className="reputation-label">평판</span>
                    </div>
                </div>
                <div className="xp-bar">
                    <div
                        className="xp-progress"
                        style={{ width: `${getProgressToNextLevel()}%` }}
                    />
                </div>
                <div className="xp-info">
                    <span className="xp-current">{formatNumber(statistics.experience_points)} XP</span>
                    <span className="xp-next">
                        다음 레벨까지 {formatNumber(Math.pow(statistics.level, 2) * 100 - statistics.experience_points)} XP
                    </span>
                </div>
            </div>

            {/* 통계 그리드 */}
            <div className="stats-grid">
                {stats.map((stat) => (
                    <div key={stat.label} className="stat-item">
                        <div className="stat-icon" style={{ color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-label">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 연속 활동 */}
            <div className="streak-section">
                <div className="streak-item">
                    <div className="streak-icon">🔥</div>
                    <div className="streak-content">
                        <div className="streak-value">{streakDays}일</div>
                        <div className="streak-label">현재 연속</div>
                    </div>
                </div>
                <div className="streak-divider"></div>
                <div className="streak-item">
                    <div className="streak-icon">🏆</div>
                    <div className="streak-content">
                        <div className="streak-value">{longestStreak}일</div>
                        <div className="streak-label">최장 연속</div>
                    </div>
                </div>
            </div>

            {/* 배지 & 업적 */}
            <div className="achievements-summary">
                <div className="achievement-count">
                    <span className="achievement-icon">🏅</span>
                    <span className="achievement-number">{statistics.total_badges}</span>
                    <span className="achievement-label">배지</span>
                </div>
                <div className="achievement-count">
                    <span className="achievement-icon">🎖️</span>
                    <span className="achievement-number">{statistics.total_achievements}</span>
                    <span className="achievement-label">업적</span>
                </div>
            </div>
        </div>
    );
};

export default StatisticsCard;
