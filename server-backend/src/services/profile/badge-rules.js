export const BADGE_RULES = [
  {
    code: 'first_post',
    predicate: (stats) => (stats.posts_count ?? 0) >= 1
  },
  {
    code: 'first_comment',
    predicate: (stats) => (stats.comments_count ?? 0) >= 1
  },
  {
    code: 'first_like_received',
    predicate: (stats) => (stats.likes_received ?? 0) >= 1
  },
  {
    code: 'posts_50',
    predicate: (stats) => (stats.posts_count ?? 0) >= 50
  },
  {
    code: 'posts_200',
    predicate: (stats) => (stats.posts_count ?? 0) >= 200
  },
  {
    code: 'posts_500',
    predicate: (stats) => (stats.posts_count ?? 0) >= 500
  },
  {
    code: 'comments_200',
    predicate: (stats) => (stats.comments_count ?? 0) >= 200
  },
  {
    code: 'comments_1000',
    predicate: (stats) => (stats.comments_count ?? 0) >= 1000
  },
  {
    code: 'likes_1000',
    predicate: (stats) => (stats.likes_received ?? 0) >= 1000
  },
  {
    code: 'trending_author',
    predicate: (_, context) => context?.eventType === 'post.trending'
  },
  {
    code: 'report_cleared',
    predicate: (_, context) => context?.eventType === 'report.cleared'
  }
];

export function evaluateBadgeRules(stats, context = {}) {
  const safeStats = {
    posts_count: stats?.posts_count ?? 0,
    comments_count: stats?.comments_count ?? 0,
    likes_received: stats?.likes_received ?? 0,
    badges_count: stats?.badges_count ?? 0
  };
  return BADGE_RULES.filter((rule) => {
    try {
      return Boolean(rule.predicate(safeStats, context));
    } catch (err) {
      return false;
    }
  }).map((rule) => rule.code);
}
