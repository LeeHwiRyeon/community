import React, { useEffect, useState } from "react";
import type { ProfileProgress, ProfileStats, ProfileUser } from "./ProfileCard";

type TooltipProfile = {
  user: ProfileUser;
  stats: ProfileStats;
  progress: ProfileProgress;
};

type UserTooltipProps = {
  userId: string;
  label: React.ReactNode;
};

const UserTooltip: React.FC<UserTooltipProps> = ({ userId, label }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<TooltipProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || profile || loading) return;
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/profile/${userId}/progress`);
        if (!res.ok) throw new Error('프로필을 불러오지 못했습니다.');
        const data = await res.json();
        if (!cancelled) {
          setProfile({
            user: data.user,
            stats: data.stats,
            progress: data.progress
          });
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [open, profile, loading, userId]);

  return (
    <span
      className="user-tooltip"
      onMouseEnter={() => setOpen(true)}
      onFocus={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {label}
      {open && (
        <span className="user-tooltip__panel" role="tooltip">
          {loading && <span className="user-tooltip__status">로딩 중...</span>}
          {error && <span className="user-tooltip__status user-tooltip__status--error">{error}</span>}
          {profile && (
            <>
              <strong className="user-tooltip__name">{profile.user.display_name}</strong>
              <span className="user-tooltip__level">Lv.{profile.progress.currentLevel}</span>
              <span className="user-tooltip__xp">
                {profile.progress.currentXp.toLocaleString()} XP
              </span>
              <div className="user-tooltip__stats">
                <span>게시물 {profile.stats.posts_count}</span>
                <span>댓글 {profile.stats.comments_count}</span>
              </div>
            </>
          )}
        </span>
      )}
    </span>
  );
};

export default UserTooltip;
