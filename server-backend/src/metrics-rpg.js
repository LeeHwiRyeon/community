import { incMetric, runtimeMetrics } from './metrics-state.js';
import logger from './logger.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_HISTORY = Math.max(50, parseInt(process.env.RPG_METRICS_HISTORY || '200', 10));

const xpEvents = [];
const levelUpEvents = [];
const badgeEvents = [];

function pruneHistory(list, cutoff) {
  let index = 0;
  while (index < list.length && list[index].ts < cutoff) {
    index += 1;
  }
  if (index > 0) {
    list.splice(0, index);
  }
  if (list.length > MAX_HISTORY) {
    list.splice(0, list.length - MAX_HISTORY);
  }
}

function pushXpEvent(entry) {
  xpEvents.push(entry);
  if (xpEvents.length > MAX_HISTORY) {
    xpEvents.splice(0, xpEvents.length - MAX_HISTORY);
  }
}

export function recordRpgProgressEvent({ userId, eventType, xpAward = 0, totalXp = 0, level = 1, leveledUp = false, badgesUnlocked = [] }) {
  const ts = Date.now();
  const xpEntry = { ts, userId, eventType, xpAward, totalXp, level };
  pushXpEvent(xpEntry);

  runtimeMetrics.rpgLastEventAt = ts;
  incMetric('rpgXpEvents', 1);
  if (xpAward > 0) {
    incMetric('rpgXpAwardTotal', xpAward);
    runtimeMetrics.rpgXpAwardMax = Math.max(runtimeMetrics.rpgXpAwardMax || 0, xpAward);
  }

  if (leveledUp) {
    const levelEntry = { ts, userId, level };
    levelUpEvents.push(levelEntry);
    pruneHistory(levelUpEvents, ts - WEEK_MS);
    incMetric('rpgLevelUpCount', 1);
    logger.event('rpg.levelup', { userId, level });
  }

  if (badgesUnlocked && badgesUnlocked.length) {
    const entries = badgesUnlocked.map((badgeCode) => ({ ts, userId, badgeCode }));
    badgeEvents.push(...entries);
    pruneHistory(badgeEvents, ts - WEEK_MS);
    incMetric('rpgBadgeUnlockCount', badgesUnlocked.length);
    logger.event('rpg.badge.unlocked', { userId, badges: badgesUnlocked });
  }

  pruneHistory(xpEvents, ts - WEEK_MS);
}

function aggregateByDay(events) {
  const days = new Map();
  for (const evt of events) {
    const day = new Date(evt.ts).toISOString().slice(0, 10);
    days.set(day, (days.get(day) || 0) + 1);
  }
  return Array.from(days.entries()).map(([day, count]) => ({ day, count })).sort((a, b) => (a.day < b.day ? -1 : 1));
}

function badgeDistribution(events) {
  const dist = new Map();
  for (const evt of events) {
    dist.set(evt.badgeCode, (dist.get(evt.badgeCode) || 0) + 1);
  }
  return Array.from(dist.entries()).map(([badgeCode, count]) => ({ badgeCode, count })).sort((a, b) => b.count - a.count);
}

export function getRpgDashboardSnapshot() {
  const now = Date.now();
  const cutoff = now - WEEK_MS;
  pruneHistory(levelUpEvents, cutoff);
  pruneHistory(badgeEvents, cutoff);
  pruneHistory(xpEvents, cutoff);

  const levelUps = levelUpEvents.filter((evt) => evt.ts >= cutoff);
  const badges = badgeEvents.filter((evt) => evt.ts >= cutoff);
  const xpRecent = xpEvents.slice(-Math.min(xpEvents.length, MAX_HISTORY));

  const xpAwards = xpRecent.filter((evt) => evt.xpAward > 0).map((evt) => evt.xpAward);
  const xpSummary = xpAwards.length
    ? {
        count: xpAwards.length,
        average: Number((xpAwards.reduce((a, b) => a + b, 0) / xpAwards.length).toFixed(2)),
        median: xpAwards.slice().sort((a, b) => a - b)[Math.floor(xpAwards.length / 2)],
        max: Math.max(...xpAwards)
      }
    : { count: 0, average: 0, median: 0, max: 0 };

  return {
    generatedAt: new Date(now).toISOString(),
    windowDays: WEEK_MS / (24 * 60 * 60 * 1000),
    levelUps: {
      total: levelUps.length,
      byDay: aggregateByDay(levelUps)
    },
    badges: {
      total: badges.length,
      distribution: badgeDistribution(badges)
    },
    xp: {
      eventsTracked: xpRecent.length,
      summary: xpSummary
    }
  };
}




export function resetRpgMetricsForTest() {
  xpEvents.length = 0;
  levelUpEvents.length = 0;
  badgeEvents.length = 0;
  runtimeMetrics.rpgXpEvents = 0;
  runtimeMetrics.rpgXpAwardTotal = 0;
  runtimeMetrics.rpgXpAwardMax = 0;
  runtimeMetrics.rpgLevelUpCount = 0;
  runtimeMetrics.rpgBadgeUnlockCount = 0;
  runtimeMetrics.rpgLastEventAt = null;
}

