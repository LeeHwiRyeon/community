import fs from 'fs';

let cachedBetaUsers = null;
let cachedBetaEnvValue = null;
let cachedBetaFilePath = null;
let cachedFileMtime = null;

function parseBetaCsv(value) {
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function loadBetaUsersFromFile(filePath) {
  if (!filePath) return [];
  try {
    const stat = fs.statSync(filePath);
    cachedFileMtime = stat.mtimeMs;
    const raw = fs.readFileSync(filePath, 'utf8');
    return parseBetaCsv(raw);
  } catch (err) {
    cachedFileMtime = null;
    return [];
  }
}

function getBetaUserSet() {
  const envValue = process.env.FEATURE_RPG_BETA_USERS || '';
  const filePath = process.env.FEATURE_RPG_BETA_FILE || null;

  let needReload = false;

  if (!cachedBetaUsers) {
    needReload = true;
  }

  if (cachedBetaEnvValue !== envValue) {
    cachedBetaEnvValue = envValue;
    needReload = true;
  }

  if (cachedBetaFilePath !== filePath) {
    cachedBetaFilePath = filePath;
    cachedFileMtime = null;
    needReload = true;
  } else if (filePath) {
    try {
      const stat = fs.statSync(filePath);
      if (cachedFileMtime !== stat.mtimeMs) {
        needReload = true;
      }
    } catch (err) {
      cachedFileMtime = null;
      needReload = true;
    }
  }

  if (needReload) {
    const fromEnv = parseBetaCsv(envValue);
    const fromFile = loadBetaUsersFromFile(filePath);
    cachedBetaUsers = new Set([...fromEnv, ...fromFile]);
  }

  return cachedBetaUsers ?? new Set();
}

function isDevMode() {
  return (
    process.env.USE_MOCK_DB === '1' ||
    process.env.ENV_ALLOW_MOCK === '1' ||
    (process.env.NODE_ENV || '').toLowerCase() !== 'production'
  );
}

function isDevAutoEnabled() {
  return (process.env.FEATURE_RPG_DEV_ENABLE ?? '1') !== '0';
}

export function isRpgEnabledForUser(userId) {
  if (process.env.FEATURE_RPG_FORCE_OFF === '1') {
    return false;
  }
  if (process.env.FEATURE_RPG_GLOBAL === '1') {
    return true;
  }
  const betaUsers = getBetaUserSet();
  if (betaUsers.has('*')) {
    return true;
  }
  if (userId && betaUsers.has(userId.toString())) {
    return true;
  }
  if (isDevMode() && isDevAutoEnabled()) {
    return true;
  }
  return false;
}

export function isUserInRpgBetaCohort(userId) {
  if (!userId) return false;
  const betaUsers = getBetaUserSet();
  return betaUsers.has(userId.toString()) || betaUsers.has('*');
}

export function getFeatureSnapshotForUser(userId) {
  const enabled = isRpgEnabledForUser(userId);
  return {
    rpgEnabled: enabled,
    rpgBetaCohort: enabled && isUserInRpgBetaCohort(userId),
    rpgFeedbackFormUrl: process.env.FEATURE_RPG_BETA_FEEDBACK_URL || null
  };
}

export function resetFeatureFlagCacheForTest() {
  cachedBetaUsers = null;
  cachedBetaEnvValue = null;
  cachedBetaFilePath = null;
  cachedFileMtime = null;
}


