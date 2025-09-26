import React from "react";

export type ProfileUser = {
  id: string;
  display_name: string;
  rpg_level: number;
  rpg_xp: number;
  last_levelup_at: string | null;
  created_at: string | null;
};

export type ProfileStats = {
  posts_count: number;
  comments_count: number;
  likes_received: number;
  badges_count: number;
  activity_score: number;
};

export type ProfileBadge = {
  badge_code: string;
  earned_at: string;
};

export type ProfileProgress = {
  currentLevel: number;
  currentXp: number;
  nextLevel: number | null;
  nextLevelXp: number | null;
  progressPercent: number;
};

const BADGE_METADATA: Record<string, { label: string; icon: string }> = {
  first_post: { label: "첫 게시물", icon: "📝" },
  first_comment: { label: "첫 댓글", icon: "💬" },
  first_like_received: { label: "첫 좋아요", icon: "❤️" },
  posts_50: { label: "게시물 50", icon: "📈" },
  posts_200: { label: "게시물 200", icon: "🚀" },
  posts_500: { label: "게시물 500", icon: "🏆" },
  comments_200: { label: "댓글 200", icon: "💬" },
  comments_1000: { label: "댓글 1000", icon: "🎯" },
  likes_1000: { label: "좋아요 1000", icon: "🔥" },
  trending_author: { label: "트렌딩 저자", icon: "🌟" },
  report_cleared: { label: "청정 사용자", icon: "🛡️" }
};

const formatBadge = (badge: ProfileBadge) => {
  const meta = BADGE_METADATA[badge.badge_code] ?? {
    label: badge.badge_code.replace(/_/g, ' '),
    icon: '✨'
  };
  return meta;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

interface ProfileCardProps {
  user: ProfileUser;
  stats: ProfileStats;
  progress: ProfileProgress;
  badges: ProfileBadge[];
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, stats, progress, badges }) => {
  const percent = Number.isFinite(progress.progressPercent)
    ? Math.min(Math.max(progress.progressPercent, 0), 100)
    : 0;
  const xpTarget = progress.nextLevelXp ?? progress.currentXp;
  return (
    <section className="profile-card">
      <header className="profile-card__header">
        <div className="profile-card__avatar" aria-hidden>
          {user.display_name.slice(0, 1).toUpperCase()}
        </div>
        <div className="profile-card__identity">
          <h1>{user.display_name}</h1>
          <p className="profile-card__meta">가입일 {formatDate(user.created_at)}</p>
          {user.last_levelup_at && (
            <p className="profile-card__meta">최근 레벨업 {formatDate(user.last_levelup_at)}</p>
          )}
        </div>
        <div className="profile-card__level">
          <span className="profile-card__level-badge">Lv.{progress.currentLevel}</span>
          <div className="profile-card__xp-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <div className="profile-card__xp-fill" style={{ width: `${percent}%` }} />
          </div>
          <span className="profile-card__xp-text">
            {progress.currentXp.toLocaleString()} XP
            {progress.nextLevelXp != null && ` / ${xpTarget.toLocaleString()} XP`}
          </span>
        </div>
      </header>

      <div className="profile-card__stats">
        <Stat label="게시물" value={stats.posts_count} />
        <Stat label="댓글" value={stats.comments_count} />
        <Stat label="받은 좋아요" value={stats.likes_received} />
        <Stat label="배지" value={stats.badges_count} />
        <Stat label="활동 점수" value={stats.activity_score} />
      </div>

      <div className="profile-card__badges">
        <h2>획득 배지</h2>
        {badges.length === 0 ? (
          <p className="profile-card__badges-empty">아직 획득한 배지가 없습니다.</p>
        ) : (
          <ul className="profile-card__badge-grid">
            {badges.slice(0, 12).map((badge) => {
              const meta = formatBadge(badge);
              return (
                <li key={badge.badge_code} className="profile-card__badge-item">
                  <span className="profile-card__badge-icon" aria-hidden>
                    {meta.icon}
                  </span>
                  <span className="profile-card__badge-name">{meta.label}</span>
                  <span className="profile-card__badge-date">{formatDate(badge.earned_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="profile-card__stat">
    <span className="profile-card__stat-value">{value.toLocaleString()}</span>
    <span className="profile-card__stat-label">{label}</span>
  </div>
);

export default ProfileCard;
