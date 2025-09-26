export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 120 },
  { level: 3, xp: 300 },
  { level: 4, xp: 520 },
  { level: 5, xp: 780 },
  { level: 6, xp: 1080 },
  { level: 7, xp: 1420 },
  { level: 8, xp: 1800 },
  { level: 9, xp: 2220 },
  { level: 10, xp: 2680 }
];

export const XP_EVENT_RULES = {
  'post.created': { xp: 40, statIncrements: { posts_count: 1 } },
  'post.updated.major': { xp: 10 },
  'comment.created': { xp: 15, statIncrements: { comments_count: 1 } },
  'comment.received_upvote': { xp: 5, statIncrements: { likes_received: 1 } },
  'reaction.received': { xp: 2, statIncrements: { likes_received: 1 } },
  'post.trending': { xp: 120 },
  'report.cleared': { xp: 30 }
};

export function resolveXpAward(eventType, metadata = {}) {
  const rule = XP_EVENT_RULES[eventType];
  if (!rule) return 0;
  if (typeof rule.xp === 'function') {
    return rule.xp(metadata) ?? 0;
  }
  return rule.xp ?? 0;
}

export function calculateLevelFromXp(totalXp) {
  const xp = Math.max(0, Math.floor(totalXp || 0));
  let candidate = LEVEL_THRESHOLDS[0].level;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i += 1) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) {
      candidate = LEVEL_THRESHOLDS[i].level;
    } else {
      break;
    }
  }
  return candidate;
}

export function calculateNextLevelProgress(totalXp) {
  const xp = Math.max(0, Math.floor(totalXp || 0));
  const currentLevel = calculateLevelFromXp(xp);
  const currentIdx = LEVEL_THRESHOLDS.findIndex((item) => item.level === currentLevel);
  const currentThreshold = LEVEL_THRESHOLDS[currentIdx]?.xp ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[currentIdx + 1]?.xp ?? null;
  const xpIntoLevel = xp - currentThreshold;
  const xpForNext = nextThreshold == null ? null : nextThreshold - currentThreshold;
  const progress = nextThreshold == null ? 100 : Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100));
  return {
    currentLevel,
    currentXp: xp,
    nextLevel: nextThreshold == null ? currentLevel : LEVEL_THRESHOLDS[currentIdx + 1].level,
    nextLevelXp: nextThreshold,
    progressPercent: progress
  };
}
