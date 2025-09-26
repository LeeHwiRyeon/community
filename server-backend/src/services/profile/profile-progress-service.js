import { getPool, query } from '../../db.js';
import { queueNotification, listNotifications, acknowledgeNotifications } from '../../notifications.js';
import { XP_EVENT_RULES, resolveXpAward, calculateLevelFromXp, calculateNextLevelProgress } from './xp-config.js';
import { evaluateBadgeRules } from './badge-rules.js';
import { recordRpgProgressEvent } from '../../metrics-rpg.js';
import { getFeatureSnapshotForUser, isRpgEnabledForUser } from '../../config/feature-flags.js';

const defaultAdapters = {
  getPool,
  query,
  queueNotification,
  listNotifications,
  acknowledgeNotifications
};

const adapters = { ...defaultAdapters };

function isMockMode() {
  return process.env.USE_MOCK_DB === '1' || process.env.ENV_ALLOW_MOCK === '1';
}

async function ensureUserExists(userId) {
  const rows = await adapters.query('SELECT id, rpg_level, rpg_xp FROM users WHERE id = ?', [userId]);
  if (!rows || rows.length === 0) {
    throw new Error('User not found');
  }
  return rows[0];
}

async function ensureUserStatsRow(userId) {
  await adapters.query('INSERT IGNORE INTO user_stats(user_id) VALUES(?)', [userId]);
}

async function loadUserStats(userId) {
  const stats = await adapters.query(
    'SELECT posts_count, comments_count, likes_received, badges_count, activity_score FROM user_stats WHERE user_id = ?',
    [userId]
  );
  return stats && stats[0]
    ? stats[0]
    : { posts_count: 0, comments_count: 0, likes_received: 0, badges_count: 0, activity_score: 0 };
}

function buildStatsUpdate(rule) {
  const increments = rule?.statIncrements;
  if (!increments) return null;
  const clauses = [];
  const params = [];
  Object.entries(increments).forEach(([column, delta]) => {
    if (!delta) return;
    clauses.push(`${column} = ${column} + ?`);
    params.push(delta);
  });
  if (!clauses.length) return null;
  clauses.push('updated_at = CURRENT_TIMESTAMP');
  return { sql: `UPDATE user_stats SET ${clauses.join(', ')} WHERE user_id = ?`, params };
}

async function awardBadges(userId, stats, context) {
  const candidates = evaluateBadgeRules(stats, context);
  if (!candidates.length) return [];

  const existingRows = await adapters.query('SELECT badge_code FROM user_badges WHERE user_id = ?', [userId]);
  const existing = new Set(existingRows.map((row) => row.badge_code));
  const newlyUnlocked = [];

  for (const badge of candidates) {
    if (existing.has(badge)) continue;
    const result = await adapters.query('INSERT IGNORE INTO user_badges(user_id, badge_code) VALUES(?, ?)', [userId, badge]);
    if (result?.affectedRows) {
      newlyUnlocked.push(badge);
    }
  }

  if (newlyUnlocked.length) {
    await adapters.query('UPDATE user_stats SET badges_count = badges_count + ? WHERE user_id = ?', [newlyUnlocked.length, userId]);
  }

  return newlyUnlocked;
}

export async function applyActivityEvent(userId, eventType, metadata = {}) {
  const pool = adapters.getPool();
  if (isMockMode() || !pool) {
    return { skipped: true, reason: 'mock-mode' };
  }

  if (!userId) {
    throw new Error('userId is required');
  }

  const userSnapshot = await ensureUserExists(userId);
  const featureSnapshot = getFeatureSnapshotForUser(userId);
  if (!isRpgEnabledForUser(userId)) {
    return { skipped: true, reason: 'feature-disabled', features: featureSnapshot };
  }

  await ensureUserStatsRow(userId);

  const rule = XP_EVENT_RULES[eventType] || null;
  if (rule) {
    const update = buildStatsUpdate(rule);
    if (update) {
      await adapters.query(update.sql, [...update.params, userId]);
    }
  }

  const stats = await loadUserStats(userId);

  const xpAward = resolveXpAward(eventType, metadata);
  let totalXp = userSnapshot.rpg_xp || 0;
  let level = userSnapshot.rpg_level || 1;
  let leveledUp = false;

  if (xpAward > 0) {
    totalXp += xpAward;
    const nextLevel = calculateLevelFromXp(totalXp);
    leveledUp = nextLevel > level;
    level = nextLevel;
    await adapters.query(
      'UPDATE users SET rpg_xp = ?, rpg_level = ?, last_levelup_at = CASE WHEN ? > rpg_level THEN CURRENT_TIMESTAMP ELSE last_levelup_at END WHERE id = ?',
      [totalXp, level, level, userId]
    );
    if (leveledUp) {
      adapters.queueNotification({
        color: 'emerald',
        title: `Lv.${level} 달성!`,
        message: '새로운 칭호를 확인해 보세요.',
        userId
      });
    }
  }

  const badgeContext = { eventType, metadata };
  const newlyUnlockedBadges = await awardBadges(userId, stats, badgeContext);

  if (newlyUnlockedBadges.length) {
    newlyUnlockedBadges.forEach((badgeCode) => {
      adapters.queueNotification({
        userId,
        title: '새 배지 획득',
        message: `배지 ${badgeCode}을(를) 획득했습니다.`,
        color: 'sky',
        icon: '✨',
        type: 'badge',
        meta: { badgeCode }
      });
    });
  }

  recordRpgProgressEvent({
    userId,
    eventType,
    xpAward,
    totalXp,
    level,
    leveledUp,
    badgesUnlocked: newlyUnlockedBadges
  });

  const progress = calculateNextLevelProgress(totalXp);

  return {
    xpAward,
    totalXp,
    level,
    leveledUp,
    badgesUnlocked: newlyUnlockedBadges,
    progress,
    features: featureSnapshot
  };
}

export async function listEarnedBadges(userId) {
  const pool = adapters.getPool();
  if (isMockMode() || !pool) {
    return [];
  }
  const rows = await adapters.query('SELECT badge_code, earned_at FROM user_badges WHERE user_id = ? ORDER BY earned_at DESC', [userId]);
  return rows || [];
}

export { resolveXpAward, calculateLevelFromXp, calculateNextLevelProgress } from './xp-config.js';
export { evaluateBadgeRules } from './badge-rules.js';

export async function getProfileOverview(userId) {
  const pool = adapters.getPool();
  if (isMockMode() || !pool) {
    return {
      user: { id: userId, display_name: `사용자-${userId}`, rpg_level: 1, rpg_xp: 0, last_levelup_at: null, created_at: null },
      stats: { posts_count: 0, comments_count: 0, likes_received: 0, badges_count: 0, activity_score: 0 },
      badges: [],
      progress: calculateNextLevelProgress(0)
    };
  }

  const userRows = await adapters.query('SELECT id, display_name, rpg_level, rpg_xp, last_levelup_at, created_at FROM users WHERE id = ?', [userId]);
  if (!userRows || userRows.length === 0) {
    return null;
  }

  await ensureUserStatsRow(userId);
  const stats = await loadUserStats(userId);
  const badges = await listEarnedBadges(userId);
  const user = userRows[0];
  const progress = calculateNextLevelProgress(user.rpg_xp || 0);

  return {
    user,
    stats,
    badges,
    progress
  };
}

export async function getProfileProgress(userId) {
  const featureSnapshot = getFeatureSnapshotForUser(userId);
  const overview = await getProfileOverview(userId);
  if (!overview) return null;

  if (!featureSnapshot.rpgEnabled) {
    const sanitizedStats = {
      ...overview.stats,
      badges_count: 0
    };
    return {
      user: {
        ...overview.user,
        rpg_level: overview.user.rpg_level ?? 1,
        rpg_xp: 0,
        last_levelup_at: null
      },
      stats: sanitizedStats,
      badges: [],
      progress: calculateNextLevelProgress(0),
      features: featureSnapshot
    };
  }

  return {
    user: {
      id: overview.user.id,
      rpg_level: overview.user.rpg_level,
      rpg_xp: overview.user.rpg_xp,
      last_levelup_at: overview.user.last_levelup_at
    },
    stats: overview.stats,
    badges: overview.badges,
    progress: overview.progress,
    notifications: adapters.listNotifications(userId),
    features: featureSnapshot
  };
}

export function acknowledgeProfileNotifications(userId, ids) {
  if (!userId) return;
  if (!isRpgEnabledForUser(userId)) return;
  adapters.acknowledgeNotifications(userId, ids);
}

export function setProfileServiceAdaptersForTest(overrides = {}) {
  Object.assign(adapters, overrides);
}

export function resetProfileServiceAdaptersForTest() {
  Object.assign(adapters, defaultAdapters);
}
