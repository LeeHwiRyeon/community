import crypto from 'node:crypto';
import path from 'node:path';

const DEFAULT_ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'application/pdf'
];
const DEFAULT_MAX_SIZE_MB = 25;
const DEFAULT_PRIVILEGED_MAX_SIZE_MB = 200;
const DEFAULT_UPLOAD_BASE_URL = 'https://mock-storage.local/upload';
const DEFAULT_BUCKET = 'community-attachments';
const DEFAULT_REGION = 'local-dev-1';
const DEFAULT_EXPIRES_SEC = 10 * 60;

const MIME_EXTENSION_MAP = new Map([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp'],
    ['image/gif', '.gif'],
    ['video/mp4', '.mp4'],
    ['video/webm', '.webm'],
    ['audio/mpeg', '.mp3'],
    ['audio/wav', '.wav'],
    ['application/pdf', '.pdf']
]);

const FILENAME_SANITIZE_REGEX = /[^a-zA-Z0-9._-]+/g;
const MULTIPLE_DOTS_REGEX = /\.+/g;
const MAX_SANITIZED_NAME_LENGTH = 80;

let cachedConfig = null;

function parseNumber(value, fallback) {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return parsed;
}

function parseAllowedTypes(value) {
    if (!value || typeof value !== 'string') return DEFAULT_ALLOWED_MIME_TYPES;
    return value
        .split(/[,\n\s]+/)
        .map(item => item.trim().toLowerCase())
        .filter(Boolean);
}

function buildMimeAllowList(entries) {
    const exact = new Set();
    const wildcard = new Set();
    for (const item of entries) {
        if (item.endsWith('/*')) {
            wildcard.add(item.slice(0, -2));
        } else {
            exact.add(item);
        }
    }
    return { exact, wildcard };
}

function sanitizeFilename(filename) {
    if (typeof filename !== 'string') return 'upload.bin';
    const base = filename.replace(/\\/g, '/').split('/').pop() || 'upload.bin';
    const collapsedDots = base.replace(MULTIPLE_DOTS_REGEX, '.');
    const cleaned = collapsedDots.replace(FILENAME_SANITIZE_REGEX, '-');
    const trimmed = cleaned.replace(/^-+|-+$/g, '') || 'file';
    if (trimmed.length <= MAX_SANITIZED_NAME_LENGTH) {
        return trimmed;
    }
    const ext = path.extname(trimmed);
    const stem = trimmed.slice(0, trimmed.length - ext.length);
    const truncatedStem = stem.slice(0, Math.max(1, MAX_SANITIZED_NAME_LENGTH - ext.length));
    return `${truncatedStem}${ext}`;
}

function resolveExtension(filename, mimeType) {
    const ext = path.extname(filename);
    if (ext) return ext.toLowerCase();
    const fromMime = MIME_EXTENSION_MAP.get(mimeType.toLowerCase());
    return fromMime || '';
}

function generateFileKey(userId, extension) {
    const safeExtension = extension && extension.startsWith('.') ? extension.toLowerCase() : '';
    const timestamp = new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14);
    const randomSegment = crypto.randomBytes(6).toString('hex');
    return `attachments/${userId}/${timestamp}-${randomSegment}${safeExtension}`;
}

function createMockSignaturePayload(fileKey, mimeType, config) {
    const uploadUrl = `${config.uploadBaseUrl}?key=${encodeURIComponent(fileKey)}`;
    const expiresAt = new Date(Date.now() + config.expiresInSec * 1000).toISOString();
    const signatureSeed = `${fileKey}:${config.bucket}:${config.region}`;
    const signature = crypto.createHash('sha256').update(signatureSeed).digest('hex').slice(0, 40);
    return {
        uploadUrl,
        method: 'PUT',
        headers: {
            'content-type': mimeType,
            'x-mock-signature': signature,
            'x-mock-bucket': config.bucket
        },
        expiresAt,
        scanRequired: Boolean(config.virusScanEndpoint)
    };
}

function resolveUserMaxSizeBytes(config, user) {
    if (!user) return config.maxSizeBytes;
    if (user.role === 'moderator' || user.role === 'admin') {
        return config.privilegedMaxSizeBytes;
    }
    return config.maxSizeBytes;
}

function readConfigFromEnv() {
    const allowedEntries = parseAllowedTypes(process.env.ATTACH_ALLOWED_TYPES);
    const allowList = buildMimeAllowList(allowedEntries);
    const maxSizeMb = parseNumber(process.env.ATTACH_MAX_SIZE_MB, DEFAULT_MAX_SIZE_MB);
    const privilegedMaxMb = parseNumber(process.env.ATTACH_PRIVILEGED_MAX_SIZE_MB, DEFAULT_PRIVILEGED_MAX_SIZE_MB);
    const expiresSec = Math.round(parseNumber(process.env.ATTACH_SIGNING_EXPIRES_SEC, DEFAULT_EXPIRES_SEC));

    return {
        allowedEntries,
        allowList,
        maxSizeBytes: Math.round(maxSizeMb * 1024 * 1024),
        privilegedMaxSizeBytes: Math.round(privilegedMaxMb * 1024 * 1024),
        uploadBaseUrl: process.env.ATTACH_UPLOAD_BASE_URL || DEFAULT_UPLOAD_BASE_URL,
        bucket: process.env.ATTACH_BUCKET || DEFAULT_BUCKET,
        region: process.env.ATTACH_REGION || DEFAULT_REGION,
        virusScanEndpoint: process.env.ATTACH_VSCAN_ENDPOINT || null,
        expiresInSec: expiresSec > 0 ? expiresSec : DEFAULT_EXPIRES_SEC
    };
}

export function getAttachmentConfig() {
    if (!cachedConfig) {
        cachedConfig = readConfigFromEnv();
    }
    return cachedConfig;
}

export function resetAttachmentConfigCacheForTest() {
    cachedConfig = null;
}

export function isAttachmentSigningEnabled() {
    if (process.env.FEATURE_ATTACH_SIGNING_FORCE_OFF === '1') {
        return false;
    }
    if (process.env.FEATURE_ATTACH_SIGNING_GLOBAL === '1') {
        return true;
    }
    if (process.env.FEATURE_ATTACH_SIGNING === '1') {
        return true;
    }
    const devAuto = (process.env.FEATURE_ATTACH_SIGNING_DEV_ENABLE ?? '1') !== '0';
    if (devAuto) {
        const env = (process.env.NODE_ENV || '').toLowerCase();
        if (process.env.USE_MOCK_DB === '1' || env !== 'production') {
            return true;
        }
    }
    return false;
}

function isMimeAllowed(mimeType, allowList) {
    const normalized = (mimeType || '').toLowerCase();
    if (!normalized) return false;
    if (allowList.exact.has(normalized)) {
        return true;
    }
    const slashIndex = normalized.indexOf('/');
    if (slashIndex === -1) {
        return false;
    }
    const category = normalized.slice(0, slashIndex);
    return allowList.wildcard.has(category);
}

export function validateAttachmentRequest({ filename, mimeType, size, user }) {
    const config = getAttachmentConfig();
    const sanitizedName = sanitizeFilename(filename);
    const normalizedMime = (mimeType || '').toLowerCase();
    const sizeNumber = typeof size === 'number' ? size : Number.parseInt(size, 10);

    if (!sanitizedName) {
        return { ok: false, error: 'invalid_filename' };
    }
    if (!normalizedMime || !isMimeAllowed(normalizedMime, config.allowList)) {
        return { ok: false, error: 'unsupported_type', allowed: config.allowedEntries };
    }
    if (!Number.isFinite(sizeNumber) || sizeNumber <= 0) {
        return { ok: false, error: 'invalid_size' };
    }
    const maxSize = resolveUserMaxSizeBytes(config, user);
    if (sizeNumber > maxSize) {
        return { ok: false, error: 'size_exceeded', maxSize };
    }

    const extension = resolveExtension(sanitizedName, normalizedMime);
    const fileKey = generateFileKey(user?.id ?? 'anonymous', extension);
    const signing = createMockSignaturePayload(fileKey, normalizedMime, config);

    return {
        ok: true,
        sanitizedName,
        mimeType: normalizedMime,
        fileKey,
        maxSize,
        signing
    };
}
