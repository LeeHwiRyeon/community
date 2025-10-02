const DEFAULT_TTL_MS = 5 * 60 * 1000;

const notificationsByUser = new Map();

function now() {
  return Date.now();
}

function cleanup(userId) {
  if (!notificationsByUser.has(userId)) return;
  const list = notificationsByUser.get(userId).filter((item) => item.expiresAt > now());
  if (list.length) notificationsByUser.set(userId, list);
  else notificationsByUser.delete(userId);
}

export function queueNotification({ userId, title, message, color = 'indigo', icon = '✨', type = 'info', meta = {}, ttlMs = DEFAULT_TTL_MS }) {
  if (!userId) return null;
  const expiresAt = now() + Math.max(ttlMs, 1000);
  const entry = {
    id: `${now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    message,
    color,
    icon,
    type,
    meta,
    createdAt: new Date().toISOString(),
    expiresAt
  };
  const key = userId.toString();
  const list = notificationsByUser.get(key) || [];
  list.unshift(entry);
  notificationsByUser.set(key, list.slice(0, 20));
  return entry.id;
}

export function listNotifications(userId) {
  const key = userId?.toString();
  if (!key) return [];
  cleanup(key);
  return notificationsByUser.get(key)?.map(({ expiresAt, ...rest }) => rest) ?? [];
}

export function acknowledgeNotifications(userId, ids) {
  const key = userId?.toString();
  if (!key || !notificationsByUser.has(key)) return;
  if (!ids || ids.length === 0) {
    notificationsByUser.delete(key);
    return;
  }
  const idSet = new Set(ids.map((id) => id.toString()));
  const remaining = notificationsByUser.get(key).filter((item) => !idSet.has(item.id));
  if (remaining.length) notificationsByUser.set(key, remaining);
  else notificationsByUser.delete(key);
}
