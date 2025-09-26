import { query } from '../../db.js';

const defaultAdapters = {
  query
};

const adapters = { ...defaultAdapters };

function toIso(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function parseMetadata(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function serializeMetadata(metadata) {
  if (metadata == null) return null;
  if (typeof metadata === 'string') {
    try {
      JSON.parse(metadata);
      return metadata;
    } catch {
      return JSON.stringify({ value: metadata });
    }
  }
  if (typeof metadata === 'object') {
    try {
      return JSON.stringify(metadata);
    } catch {
      return null;
    }
  }
  return JSON.stringify({ value: metadata });
}

const BASE_SELECT = `id, post_id, author_id, title, content, metadata, status, created_at, updated_at, expires_at`;

function mapDraft(row) {
  return {
    id: row.id,
    post_id: row.post_id,
    author_id: row.author_id,
    title: row.title ?? '',
    content: row.content ?? '',
    metadata: parseMetadata(row.metadata),
    status: row.status,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    expires_at: toIso(row.expires_at),
    conflict_warning: row.status === 'conflict'
  };
}

function clampLimit(value, fallback = 10, max = 20) {
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num) || num <= 0) return fallback;
  return Math.min(num, max);
}

function sanitizeDraftInput(payload = {}) {
  const title = typeof payload.title === 'string' ? payload.title : '';
  const content = typeof payload.content === 'string' ? payload.content : '';
  const metadata = serializeMetadata(payload.metadata ?? null);
  const postId = payload.post_id != null && payload.post_id !== '' ? String(payload.post_id).slice(0, 64) : null;
  return { title, content, metadata, postId };
}

export async function listDraftsForAuthor(authorId, { limit = 10, offset = 0 } = {}) {
  const lim = clampLimit(limit);
  const off = Math.max(0, Number.parseInt(offset, 10) || 0);
  const rows = await adapters.query(
    `SELECT ${BASE_SELECT} FROM post_drafts WHERE author_id = ? AND status != 'archived' ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
    [authorId, lim, off]
  );
  return rows.map(mapDraft);
}

export async function getDraftById(id) {
  const rows = await adapters.query(`SELECT ${BASE_SELECT} FROM post_drafts WHERE id = ?`, [id]);
  if (!rows.length) return null;
  return mapDraft(rows[0]);
}

export async function createDraftForAuthor(authorId, payload) {
  const { title, content, metadata, postId } = sanitizeDraftInput(payload);
  const result = await adapters.query(
    `INSERT INTO post_drafts (post_id, author_id, title, content, metadata, status) VALUES (?, ?, ?, ?, ?, 'active')`,
    [postId, authorId, title, content, metadata]
  );
  const insertedId = result?.insertId;
  if (!insertedId) {
    throw new Error('draft_insert_failed');
  }
  const rows = await adapters.query(`SELECT ${BASE_SELECT} FROM post_drafts WHERE id = ?`, [insertedId]);
  return rows.length ? mapDraft(rows[0]) : null;
}

export async function updateDraftForAuthor(id, authorId, payload, ifUnmodifiedSince) {
  const currentRows = await adapters.query(`SELECT ${BASE_SELECT} FROM post_drafts WHERE id = ?`, [id]);
  if (!currentRows.length) {
    return { notFound: true };
  }
  const current = currentRows[0];
  if (current.status === 'archived') {
    return { notFound: true };
  }
  if (current.author_id !== authorId) {
    return { forbidden: true };
  }

  if (ifUnmodifiedSince) {
    const headerDate = new Date(ifUnmodifiedSince);
    if (!Number.isNaN(headerDate.getTime())) {
      const updatedAt = new Date(current.updated_at);
      if (!Number.isNaN(updatedAt.getTime()) && updatedAt > headerDate) {
        return { conflict: true, draft: mapDraft(current) };
      }
    }
  }

  const { title, content, metadata, postId } = sanitizeDraftInput(payload);
  await adapters.query(
    `UPDATE post_drafts SET post_id = ?, title = ?, content = ?, metadata = ?, status = 'active' WHERE id = ? AND author_id = ?`,
    [postId, title, content, metadata, id, authorId]
  );
  const rows = await adapters.query(`SELECT ${BASE_SELECT} FROM post_drafts WHERE id = ?`, [id]);
  return { draft: rows.length ? mapDraft(rows[0]) : null };
}

export async function archiveDraftForAuthor(id, authorId) {
  const result = await adapters.query(`UPDATE post_drafts SET status = 'archived' WHERE id = ? AND author_id = ?`, [id, authorId]);
  return { archived: result?.affectedRows > 0 };
}

export function setPostDraftAdaptersForTest(overrides = {}) {
  Object.assign(adapters, overrides);
}

export function resetPostDraftAdaptersForTest() {
  Object.assign(adapters, defaultAdapters);
}

