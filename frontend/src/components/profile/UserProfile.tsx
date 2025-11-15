/**
 * 사용자 프로필 페이지
 * 프로필 정보, 통계, 배지, 업적 표시
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BadgeDisplay from './BadgeDisplay';
import StatisticsCard from './StatisticsCard';
import ProfileEditor from './ProfileEditor';
import type { FullProfile, ProfileUpdateData } from '../../types/profile';
import * as profileService from '../../services/profileService';
import './UserProfile.css';

const UserProfile: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [profile, setProfile] = useState<FullProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'achievements'>('overview');
    const [isEditing, setIsEditing] = useState(false);

    // 현재 로그인한 사용자 ID (임시 - 실제로는 auth context에서 가져옴)
    const currentUserId = 1; // TODO: Get from auth context
    const isOwner = profile && currentUserId === profile.user.id;

    useEffect(() => {
        loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const id = parseInt(userId || '1');
            const data = await profileService.getFullProfile(id);
            setProfile(data);
        } catch (err: any) {
            setError(err.message || '프로필을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleBadgeToggle = async (badgeType: string, isDisplayed: boolean) => {
        if (!profile) return;

        try {
            const updatedBadges = await profileService.updateBadgeDisplay(
                profile.user.id,
                badgeType,
                isDisplayed
            );
            setProfile({
                ...profile,
                badges: updatedBadges,
            });
        } catch (err: any) {
            alert(err.message || '배지 설정 변경에 실패했습니다.');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return '오늘';
        if (diffDays === 1) return '어제';
        if (diffDays < 7) return `${diffDays}일 전`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
        return `${Math.floor(diffDays / 365)}년 전`;
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="spinner"></div>
                <p>프로필을 불러오는 중...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="profile-error">
                <h2>오류 발생</h2>
                <p>{error || '프로필을 찾을 수 없습니다.'}</p>
                <button onClick={loadProfile}>다시 시도</button>
            </div>
        );
    }

    return (
        <div className="user-profile">
            {/* 배너 */}
            <div
                className="profile-banner"
                style={{
                    backgroundImage: profile.user.banner_image
                        ? `url(${profile.user.banner_image})`
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
            >
                {isOwner && (
                    <button className="edit-banner-btn" title="배너 변경">
                        📷
                    </button>
                )}
            </div>

            {/* 프로필 헤더 */}
            <div className="profile-header">
                <div className="profile-avatar-section">
                    <img
                        src={profile.user.avatar_url || '/default-avatar.png'}
                        alt={profile.user.username}
                        className="profile-avatar"
                    />
                    {isOwner && (
                        <button className="edit-avatar-btn" title="아바타 변경">
                            📷
                        </button>
                    )}
                </div>

                <div className="profile-info">
                    <div className="profile-name-row">
                        <h1 className="profile-username">{profile.user.username}</h1>
                        {isOwner && (
                            <button
                                className="edit-profile-btn"
                                onClick={() => setIsEditing(true)}
                            >
                                ✏️ 프로필 수정
                            </button>
                        )}
                    </div>

                    {profile.user.bio && <p className="profile-bio">{profile.user.bio}</p>}

                    <div className="profile-meta">
                        {profile.user.location && (
                            <span className="meta-item">
                                📍 {profile.user.location}
                            </span>
                        )}
                        <span className="meta-item">
                            📅 가입일: {formatDate(profile.user.created_at)}
                        </span>
                        {profile.user.last_seen_at && (
                            <span className="meta-item">
                                🕒 마지막 활동: {formatDate(profile.user.last_seen_at)}
                            </span>
                        )}
                    </div>

                    {/* 소셜 링크 */}
                    {(profile.user.website || profile.user.github_url || profile.user.twitter_url || profile.user.linkedin_url) && (
                        <div className="profile-social">
                            {profile.user.website && (
                                <a href={profile.user.website} target="_blank" rel="noopener noreferrer" className="social-link">
                                    🔗 웹사이트
                                </a>
                            )}
                            {profile.user.github_url && (
                                <a href={profile.user.github_url} target="_blank" rel="noopener noreferrer" className="social-link">
                                    💻 GitHub
                                </a>
                            )}
                            {profile.user.twitter_url && (
                                <a href={profile.user.twitter_url} target="_blank" rel="noopener noreferrer" className="social-link">
                                    🐦 Twitter
                                </a>
                            )}
                            {profile.user.linkedin_url && (
                                <a href={profile.user.linkedin_url} target="_blank" rel="noopener noreferrer" className="social-link">
                                    💼 LinkedIn
                                </a>
                            )}
                        </div>
                    )}

                    {/* 표시된 배지 (상위 3개) */}
                    <div className="profile-badges-preview">
                        {profile.badges.filter(b => b.is_displayed).slice(0, 3).map((badge) => (
                            <span
                                key={badge.badge_type}
                                className="badge-preview"
                                style={{ color: badge.badge_color }}
                                title={badge.badge_type}
                            >
                                {badge.badge_icon}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="profile-tabs">
                <button
                    className={`tab ${activeTab === 'overview' ? 'tab--active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    개요
                </button>
                <button
                    className={`tab ${activeTab === 'badges' ? 'tab--active' : ''}`}
                    onClick={() => setActiveTab('badges')}
                >
                    배지 ({profile.statistics.total_badges})
                </button>
                <button
                    className={`tab ${activeTab === 'achievements' ? 'tab--active' : ''}`}
                    onClick={() => setActiveTab('achievements')}
                >
                    업적 ({profile.statistics.total_achievements})
                </button>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="profile-content">
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        <div className="overview-section">
                            <h2>통계</h2>
                            <StatisticsCard statistics={profile.statistics} />
                        </div>

                        <div className="overview-section">
                            <h2>최근 업적</h2>
                            {profile.achievements.length > 0 ? (
                                <div className="achievements-list">
                                    {profile.achievements.slice(0, 5).map((achievement, index) => (
                                        <div key={index} className="achievement-item">
                                            <span className="achievement-icon">{achievement.icon}</span>
                                            <div className="achievement-content">
                                                <h4>{achievement.title}</h4>
                                                <p>{achievement.description}</p>
                                                <span className="achievement-date">
                                                    {formatDate(achievement.achieved_at)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-data">아직 달성한 업적이 없습니다.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'badges' && (
                    <div className="badges-tab">
                        <BadgeDisplay
                            badges={profile.badges}
                            isOwner={isOwner || false}
                            onBadgeToggle={handleBadgeToggle}
                        />
                    </div>
                )}

                {activeTab === 'achievements' && (
                    <div className="achievements-tab">
                        {profile.achievements.length > 0 ? (
                            <div className="achievements-full-list">
                                {profile.achievements.map((achievement, index) => (
                                    <div key={index} className="achievement-card">
                                        <span className="achievement-icon-large">{achievement.icon}</span>
                                        <div className="achievement-details">
                                            <h3>{achievement.title}</h3>
                                            <p>{achievement.description}</p>
                                            <div className="achievement-meta">
                                                <span className="achievement-type">{achievement.achievement_type}</span>
                                                <span className="achievement-milestone">
                                                    {achievement.milestone_value}
                                                </span>
                                                <span className="achievement-date">
                                                    {formatDate(achievement.achieved_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-data">
                                <p>아직 달성한 업적이 없습니다.</p>
                                <p className="no-data-hint">활동하면서 다양한 업적을 달성해보세요!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 프로필 편집 모달 */}
            {isEditing && profile && (
                <ProfileEditor
                    profile={profile.user}
                    onSave={async (updates: ProfileUpdateData) => {
                        try {
                            await profileService.updateProfile(profile.user.id, updates);
                            await loadProfile();
                            setIsEditing(false);
                        } catch (err: any) {
                            alert(err.message || '프로필 업데이트에 실패했습니다.');
                        }
                    }}
                    onCancel={() => setIsEditing(false)}
                />
            )}
        </div>
    );
};

export default UserProfile;
