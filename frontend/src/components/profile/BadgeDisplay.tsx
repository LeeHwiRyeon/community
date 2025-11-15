/**
 * 배지 표시 컴포넌트
 * 사용자의 배지 컬렉션 표시
 */

import React from 'react';
import type { UserBadge } from '../../types/profile';
import './BadgeDisplay.css';

interface BadgeDisplayProps {
    badges: UserBadge[];
    isOwner?: boolean;
    onBadgeToggle?: (badgeType: string, isDisplayed: boolean) => void;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
    badges,
    isOwner = false,
    onBadgeToggle,
}) => {
    const displayedBadges = badges.filter((badge) => badge.is_displayed);
    const hiddenBadges = badges.filter((badge) => !badge.is_displayed);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getBadgeTitle = (badgeType: string): string => {
        const titles: Record<string, string> = {
            welcome: '환영합니다',
            first_post: '첫 게시글',
            verified: '인증됨',
            popular: '인기 작성자',
            influencer: '영향력 있는 사용자',
            commenter: '활발한 댓글러',
            helpful: '도움이 되는 답변',
            veteran: '베테랑',
            consistent: '꾸준한 활동',
            early_bird: '얼리버드',
            moderator: '모더레이터',
            contributor: '기여자',
            supporter: '서포터',
        };
        return titles[badgeType] || badgeType;
    };

    const getBadgeDescription = (badgeType: string): string => {
        const descriptions: Record<string, string> = {
            welcome: '커뮤니티에 가입했습니다',
            first_post: '첫 게시글을 작성했습니다',
            verified: '인증된 사용자입니다',
            popular: '100개 이상의 좋아요를 받았습니다',
            influencer: '1000개 이상의 좋아요를 받았습니다',
            commenter: '100개 이상의 댓글을 작성했습니다',
            helpful: '50개 이상의 채택된 답변이 있습니다',
            veteran: '1년 이상 활동했습니다',
            consistent: '30일 연속 활동했습니다',
            early_bird: '커뮤니티 초기 멤버입니다',
            moderator: '모더레이터 권한이 있습니다',
            contributor: '커뮤니티에 기여했습니다',
            supporter: '커뮤니티를 지원했습니다',
        };
        return descriptions[badgeType] || '';
    };

    return (
        <div className="badge-display">
            {displayedBadges.length > 0 && (
                <div className="badge-section">
                    <h3 className="badge-section-title">표시된 배지</h3>
                    <div className="badge-grid">
                        {displayedBadges.map((badge) => (
                            <div
                                key={badge.badge_type}
                                className="badge-card"
                                style={{ borderColor: badge.badge_color }}
                            >
                                <div className="badge-icon" style={{ color: badge.badge_color }}>
                                    {badge.badge_icon}
                                </div>
                                <div className="badge-info">
                                    <h4 className="badge-title">{getBadgeTitle(badge.badge_type)}</h4>
                                    <p className="badge-description">{getBadgeDescription(badge.badge_type)}</p>
                                    <p className="badge-date">획득: {formatDate(badge.earned_at)}</p>
                                </div>
                                {isOwner && onBadgeToggle && (
                                    <button
                                        className="badge-toggle-btn"
                                        onClick={() => onBadgeToggle(badge.badge_type, false)}
                                        title="배지 숨기기"
                                    >
                                        👁️
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isOwner && hiddenBadges.length > 0 && (
                <div className="badge-section">
                    <h3 className="badge-section-title">숨겨진 배지</h3>
                    <div className="badge-grid">
                        {hiddenBadges.map((badge) => (
                            <div
                                key={badge.badge_type}
                                className="badge-card badge-card--hidden"
                                style={{ borderColor: badge.badge_color }}
                            >
                                <div className="badge-icon" style={{ color: badge.badge_color }}>
                                    {badge.badge_icon}
                                </div>
                                <div className="badge-info">
                                    <h4 className="badge-title">{getBadgeTitle(badge.badge_type)}</h4>
                                    <p className="badge-description">{getBadgeDescription(badge.badge_type)}</p>
                                    <p className="badge-date">획득: {formatDate(badge.earned_at)}</p>
                                </div>
                                {onBadgeToggle && (
                                    <button
                                        className="badge-toggle-btn"
                                        onClick={() => onBadgeToggle(badge.badge_type, true)}
                                        title="배지 표시하기"
                                    >
                                        🚫
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {badges.length === 0 && (
                <div className="no-badges">
                    <p>아직 획득한 배지가 없습니다.</p>
                    <p className="no-badges-hint">활동하면서 다양한 배지를 획득해보세요!</p>
                </div>
            )}
        </div>
    );
};

export default BadgeDisplay;
