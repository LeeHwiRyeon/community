import { test } from "node:test";
import assert from "node:assert/strict";
import { logger } from "../../src/logger.js";
import { runtimeMetrics } from "../../src/metrics-state.js";
import { getRpgDashboardSnapshot, resetRpgMetricsForTest } from "../../src/metrics-rpg.js";
import { resetFeatureFlagCacheForTest } from "../../src/config/feature-flags.js";
import {
  applyActivityEvent,
  calculateLevelFromXp,
  calculateNextLevelProgress,
  resolveXpAward,
  evaluateBadgeRules,
  setProfileServiceAdaptersForTest,
  resetProfileServiceAdaptersForTest
} from "../../src/services/profile/profile-progress-service.js";

test('calculateLevelFromXp follows defined thresholds', () => {
  assert.equal(calculateLevelFromXp(0), 1);
  assert.equal(calculateLevelFromXp(119), 1);
  assert.equal(calculateLevelFromXp(120), 2);
  assert.equal(calculateLevelFromXp(300), 3);
  assert.equal(calculateLevelFromXp(5000), 10);
});

test('calculateNextLevelProgress exposes thresholds and percent', () => {
  const progress = calculateNextLevelProgress(150);
  assert.equal(progress.currentLevel, 2);
  assert.equal(progress.nextLevel, 3);
  assert.equal(progress.nextLevelXp, 300);
  assert(progress.progressPercent > 0 && progress.progressPercent < 100);
});

test('resolveXpAward returns configured xp values', () => {
  assert.equal(resolveXpAward('post.created'), 40);
  assert.equal(resolveXpAward('comment.created'), 15);
  assert.equal(resolveXpAward('unknown.event'), 0);
});

test('evaluateBadgeRules unlocks badges based on stats and context', () => {
  const stats = { posts_count: 210, comments_count: 250, likes_received: 1200, badges_count: 0 };
  const context = { eventType: 'post.trending' };
  const badges = evaluateBadgeRules(stats, context);
  assert.ok(badges.includes('posts_200'));
  assert.ok(badges.includes('comments_200'));
  assert.ok(badges.includes('likes_1000'));
  assert.ok(badges.includes('trending_author'));
  assert.ok(!badges.includes('report_cleared'));
});

test('applyActivityEvent updates persistence, notifications, and metrics', async (t) => {
  const originalUseMock = process.env.USE_MOCK_DB;
  const originalAllowMock = process.env.ENV_ALLOW_MOCK;
  process.env.USE_MOCK_DB = '0';
  process.env.ENV_ALLOW_MOCK = '0';

  resetProfileServiceAdaptersForTest();
  resetRpgMetricsForTest();

  const userRow = { id: 'user-1', rpg_level: 1, rpg_xp: 100, last_levelup_at: null };
  const statsRow = { posts_count: 0, comments_count: 0, likes_received: 0, badges_count: 0, activity_score: 0 };
  const badgesTable = new Set();
  const notificationsSent = [];
  const loggerEvents = [];

  setProfileServiceAdaptersForTest({
    getPool: () => ({}),
    query: async (sql, params = []) => {
      if (sql.startsWith('SELECT id, rpg_level')) {
        return [userRow];
      }
      if (sql.startsWith('INSERT IGNORE INTO user_stats')) {
        return { affectedRows: 1 };
      }
      if (sql.startsWith('UPDATE user_stats SET') && sql.includes('posts_count = posts_count + ?')) {
        statsRow.posts_count += params[0];
        statsRow.activity_score = statsRow.posts_count * 4 + statsRow.comments_count * 2 + statsRow.likes_received;
        return { affectedRows: 1 };
      }
      if (sql.startsWith('SELECT posts_count')) {
        return [statsRow];
      }
      if (sql.startsWith('UPDATE users SET rpg_xp')) {
        userRow.rpg_xp = params[0];
        userRow.rpg_level = params[1];
        userRow.last_levelup_at = new Date().toISOString();
        return { affectedRows: 1 };
      }
      if (sql.startsWith('SELECT badge_code FROM user_badges')) {
        return Array.from(badgesTable).map((badge) => ({ badge_code: badge }));
      }
      if (sql.startsWith('INSERT IGNORE INTO user_badges')) {
        badgesTable.add(params[1]);
        return { affectedRows: 1 };
      }
      if (sql.startsWith('UPDATE user_stats SET badges_count')) {
        statsRow.badges_count += params[0];
        return { affectedRows: 1 };
      }
      return [];
    },
    queueNotification: (payload) => {
      notificationsSent.push(payload);
      return 'notif-' + notificationsSent.length;
    },
    listNotifications: () => [],
    acknowledgeNotifications: () => {}
  });

  t.mock.method(logger, 'event', (_, meta) => {
    loggerEvents.push(meta);
  });

  t.after(() => {
    process.env.USE_MOCK_DB = originalUseMock;
    process.env.ENV_ALLOW_MOCK = originalAllowMock;
    resetProfileServiceAdaptersForTest();
    resetRpgMetricsForTest();
  });

  const result = await applyActivityEvent('user-1', 'post.created');

  assert.equal(result.xpAward, 40);
  assert.equal(result.totalXp, 140);
  assert.equal(result.level, 2);
  assert.equal(result.leveledUp, true);
  assert.deepEqual(result.badgesUnlocked, ['first_post']);

  assert.equal(statsRow.posts_count, 1);
  assert.equal(statsRow.badges_count, 1);
  assert.equal(notificationsSent.length, 2);
  assert.ok(notificationsSent.some((item) => item.type === 'badge'));
  assert.ok(loggerEvents.length >= 1);

  assert.equal(runtimeMetrics.rpgXpEvents, 1);
  assert.equal(runtimeMetrics.rpgLevelUpCount, 1);
  assert.equal(runtimeMetrics.rpgBadgeUnlockCount, 1);
  assert.equal(runtimeMetrics.rpgXpAwardTotal, 40);
  assert.equal(runtimeMetrics.rpgXpAwardMax, 40);
  assert.notEqual(runtimeMetrics.rpgLastEventAt, null);

  const snapshot = getRpgDashboardSnapshot();
  assert.equal(snapshot.levelUps.total, 1);
  assert.equal(snapshot.badges.total, 1);
  assert.equal(snapshot.badges.distribution[0].badgeCode, 'first_post');
  assert.equal(snapshot.xp.summary.max, 40);
  assert.equal(snapshot.xp.summary.count, 1);
});




test('applyActivityEvent skips when RPG flag disabled', async (t) => {
  const originalUseMock = process.env.USE_MOCK_DB;
  const originalAllowMock = process.env.ENV_ALLOW_MOCK;
  const originalFeatureGlobal = process.env.FEATURE_RPG_GLOBAL;
  const originalFeatureDev = process.env.FEATURE_RPG_DEV_ENABLE;

  process.env.USE_MOCK_DB = '0';
  process.env.ENV_ALLOW_MOCK = '0';
  process.env.FEATURE_RPG_GLOBAL = '0';
  process.env.FEATURE_RPG_DEV_ENABLE = '0';
  resetFeatureFlagCacheForTest();
  resetRpgMetricsForTest();

  setProfileServiceAdaptersForTest({
    getPool: () => ({}),
    query: async (sql, params = []) => {
      if (sql.startsWith('SELECT id, rpg_level')) {
        return [{ id: 'user-2', rpg_level: 1, rpg_xp: 0 }];
      }
      if (sql.startsWith('INSERT IGNORE INTO user_stats')) {
        return { affectedRows: 1 };
      }
      return [];
    },
    queueNotification: () => {},
    listNotifications: () => [],
    acknowledgeNotifications: () => {}
  });

  t.after(() => {
    process.env.USE_MOCK_DB = originalUseMock;
    process.env.ENV_ALLOW_MOCK = originalAllowMock;
    process.env.FEATURE_RPG_GLOBAL = originalFeatureGlobal;
    process.env.FEATURE_RPG_DEV_ENABLE = originalFeatureDev;
    resetFeatureFlagCacheForTest();
    resetProfileServiceAdaptersForTest();
    resetRpgMetricsForTest();
  });

  const result = await applyActivityEvent('user-2', 'post.created');

  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'feature-disabled');
  assert.ok(result.features);
  assert.equal(result.features?.rpgEnabled, false);
  assert.equal(runtimeMetrics.rpgXpEvents, 0);
});
