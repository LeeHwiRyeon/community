import { query } from '../../db.js';
import { isMockDatabaseEnabled } from '../../mock-data-provider.js';
import { resolveAttachmentQueueConfig, resolveBullConnection } from './worker-config.js';
import { Queue } from 'bullmq';

const useMockDb = isMockDatabaseEnabled();

const mockStore = {
    seq: 1,
    items: new Map()
};

let processQueue = null;

function mapDbRow(row) {
    if (!row) return null;
    return {
        id: String(row.id),
        fileKey: row.file_key,
        ownerUserId: row.owner_user_id == null ? null : Number(row.owner_user_id),
        status: row.status,
        mimeType: row.mime_type,
        sizeBytes: Number(row.size_bytes),
        checksum: row.checksum,
        originalName: row.original_name,
        sourceType: row.source_type,
        sourceId: row.source_id,
        metadata: parseJson(row.metadata),
        variants: parseJson(row.variants) || [],
        errorMessage: row.error_message,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
        updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
    };
}

function parseJson(value) {
    if (!value) return null;
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

export function resetAttachmentStoreForTest() {
    mockStore.seq = 1;
    mockStore.items.clear();
    processQueue = null;
}

export async function createAttachmentRecord({ fileKey, ownerUserId, status = 'queued', mimeType, sizeBytes, checksum, originalName, sourceType = 'temp', sourceId = null, metadata = null }) {
    if (!fileKey || !mimeType || !Number.isFinite(sizeBytes)) {
        throw new Error('invalid attachment record payload');
    }

    if (useMockDb) {
        const id = String(mockStore.seq++);
        const now = new Date().toISOString();
        const record = {
            id,
            fileKey,
            ownerUserId: ownerUserId == null ? null : Number(ownerUserId),
            status,
            mimeType,
            sizeBytes,
            checksum: checksum || null,
            originalName: originalName || null,
            sourceType,
            sourceId,
            metadata: metadata || null,
            variants: [],
            errorMessage: null,
            createdAt: now,
            updatedAt: now
        };
        mockStore.items.set(id, record);
        return record;
    }

    const result = await query(
        `INSERT INTO attachments (file_key, owner_user_id, status, mime_type, size_bytes, checksum, original_name, source_type, source_id, metadata, variants)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, JSON_ARRAY())`,
        [fileKey, ownerUserId ?? null, status, mimeType, sizeBytes, checksum || null, originalName || null, sourceType, sourceId || null, metadata ? JSON.stringify(metadata) : null]
    );
    const insertedId = result.insertId;
    const rows = await query('SELECT * FROM attachments WHERE id = ?', [insertedId]);
    return mapDbRow(rows[0]);
}

export async function getAttachmentById(id) {
    if (!id) return null;
    if (useMockDb) {
        return mockStore.items.get(String(id)) || null;
    }
    const rows = await query('SELECT * FROM attachments WHERE id = ?', [id]);
    return rows.length ? mapDbRow(rows[0]) : null;
}

async function getProcessQueue() {
    if (useMockDb) return null;
    const config = resolveAttachmentQueueConfig();
    if (!config.enabled) {
        return null;
    }
    if (!processQueue) {
        const connection = resolveBullConnection();
        processQueue = new Queue(`${config.prefix}:process`, { connection });
    }
    return processQueue;
}

export async function enqueueAttachmentProcessing(record, payload = {}) {
    if (!record) {
        return { enqueued: false, reason: 'missing_record' };
    }
    const queue = await getProcessQueue();
    if (!queue) {
        return { enqueued: false, reason: useMockDb ? 'mock-db' : 'disabled' };
    }
    const jobData = {
        attachmentId: record.id,
        fileKey: record.fileKey,
        mimeType: record.mimeType,
        sizeBytes: record.sizeBytes,
        sourceType: record.sourceType,
        sourceId: record.sourceId,
        originalName: record.originalName,
        ...payload
    };
    await queue.add('process', jobData, {
        removeOnComplete: true,
        attempts: payload.attempts ?? 3,
        backoff: { type: 'exponential', delay: 2000 }
    });
    return { enqueued: true };
}

