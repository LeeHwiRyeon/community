import React, { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import ProfileCard, { type ProfileUser, type ProfileStats, type ProfileBadge, type ProfileProgress } from "../components/ProfileCard"
import UserTooltip from "../components/UserTooltip"
import ToastStack, { type ToastNotification } from "../components/ToastStack"
import "./ProfilePage.css"

interface ProfileOverview {
  user: ProfileUser
  stats: ProfileStats
  badges: ProfileBadge[]
  progress: ProfileProgress
}

interface FeatureSnapshot {
  rpgEnabled: boolean
  rpgBetaCohort?: boolean
  rpgFeedbackFormUrl?: string | null
}

interface ProfileProgressResponse extends ProfileOverview {
  notifications?: ToastNotification[]
  features?: FeatureSnapshot
}

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const [profile, setProfile] = useState<ProfileOverview | null>(null)
  const [features, setFeatures] = useState<FeatureSnapshot | null>(null)
  const [notifications, setNotifications] = useState<ToastNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const ackNotifications = useCallback(async (ids?: string[]) => {
    if (!userId) return
    if (features?.rpgEnabled === false) return
    try {
      await fetch(`/api/profile/${userId}/notifications/ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids && ids.length ? { ids } : {})
      })
    } catch {
      /* ignore */
    }
  }, [userId, features?.rpgEnabled])

  useEffect(() => {
    if (!userId) {
      setError("유효한 사용자 ID가 필요합니다.")
      setLoading(false)
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/profile/${userId}/progress`)
        if (!res.ok) {
          if (res.status === 404) throw new Error("프로필을 찾을 수 없습니다.")
          throw new Error("프로필 정보를 불러오는 중 오류가 발생했습니다.")
        }
        const data: ProfileProgressResponse = await res.json()
        if (cancelled) return

        setProfile({ user: data.user, stats: data.stats, badges: data.badges, progress: data.progress })
        setFeatures(data.features ?? null)
        const nextNotifications = data.features?.rpgEnabled ? (data.notifications ?? []) : []
        setNotifications(nextNotifications)
      } catch (err) {
        if (!cancelled) setError((err as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [userId])

  const handleDismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id))
    ackNotifications([id])
  }, [ackNotifications])

  if (loading) {
    return <div className="profile-page__state">로딩 중...</div>
  }

  if (error) {
    return <div className="profile-page__state profile-page__state--error">{error}</div>
  }

  if (!profile) {
    return <div className="profile-page__state">프로필 데이터를 불러오지 못했습니다.</div>
  }

  const isRpgEnabled = features?.rpgEnabled ?? true
  const isBetaMember = features?.rpgBetaCohort ?? false
  const feedbackUrl = features?.rpgFeedbackFormUrl ?? null

  if (!isRpgEnabled) {
    return (
      <div className="profile-page profile-page--gated">
        <nav className="profile-page__breadcrumb">
          <a href="/">홈</a>
          <span aria-hidden>›</span>
          <span>프로필</span>
          <React.Fragment>
            <span aria-hidden>›</span>
            <UserTooltip userId={profile.user.id} label={<strong>{profile.user.display_name}</strong>} />
          </React.Fragment>
        </nav>
        <section className="profile-page__state profile-page__state--info">
          <h1>RPG 프로필 베타 진행 중</h1>
          <p>
            {isBetaMember
              ? "현재 베타 피드백 라운드에 참여 중입니다. 최신 개선 사항이 순차적으로 적용될 예정입니다."
              : "RPG 프로필은 선택된 베타 사용자에게 먼저 제공되고 있습니다. 정식 공개 전까지 기본 프로필 정보를 제공해 드립니다."}
          </p>
          {feedbackUrl ? (
            <p>
              <a href={feedbackUrl} target="_blank" rel="noreferrer">
                피드백 남기기
              </a>
            </p>
          ) : null}
        </section>
        <section className="profile-page__summary" aria-label="기본 활동 정보">
          <div className="profile-page__summary-card">
            <h2>커뮤니티 활동</h2>
            <ul>
              <li>게시글 {profile.stats.posts_count.toLocaleString()}개</li>
              <li>댓글 {profile.stats.comments_count.toLocaleString()}개</li>
              <li>받은 좋아요 {profile.stats.likes_received.toLocaleString()}개</li>
            </ul>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <ToastStack notifications={notifications} onDismiss={handleDismissNotification} />
      <nav className="profile-page__breadcrumb">
        <a href="/">홈</a>
        <span aria-hidden>›</span>
        <span>프로필</span>
        <span aria-hidden>›</span>
        <UserTooltip userId={profile.user.id} label={<strong>{profile.user.display_name}</strong>} />
      </nav>

      <ProfileCard
        user={profile.user}
        stats={profile.stats}
        progress={profile.progress}
        badges={profile.badges}
      />

      <section className="profile-page__summary" aria-label="진척도 요약">
        <div className="profile-page__summary-card">
          <h2>레벨 진척도</h2>
          <dl>
            <div>
              <dt>현재 XP</dt>
              <dd>{profile.progress.currentXp.toLocaleString()}</dd>
            </div>
            <div>
              <dt>다음 레벨</dt>
              <dd>
                {profile.progress.nextLevel === null
                  ? "최고 레벨"
                  : `Lv.${profile.progress.nextLevel}`}
              </dd>
            </div>
            <div>
              <dt>진척률</dt>
              <dd>{profile.progress.progressPercent}%</dd>
            </div>
          </dl>
        </div>
        <div className="profile-page__summary-card">
          <h2>활동 현황</h2>
          <ul>
            <li>게시물 {profile.stats.posts_count.toLocaleString()}개</li>
            <li>댓글 {profile.stats.comments_count.toLocaleString()}개</li>
            <li>받은 좋아요 {profile.stats.likes_received.toLocaleString()}개</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export default ProfilePage
