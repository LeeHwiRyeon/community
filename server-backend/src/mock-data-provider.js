import { applyActivityEvent } from './services/profile/profile-progress-service.js';
import 'seedrandom'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  SAMPLE_TITLES,
  SAMPLE_SNIPPETS,
  SAMPLE_AUTHORS,
  SAMPLE_CATEGORIES,
  SAMPLE_THUMBS,
  mockRandInt,
  mockPick,
  mockRandomId
} from './mock-samples.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '../../data')
export const BOARD_ICON_MAP = {
  news: '📰',
  free: '💬',
  image: '🖼️',
  qna: '❓',
  game: '🎮',
  broadcast: '📺',
  cosplay: '🧵'
}


let store = null

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const toIso = (value, fallback = new Date()) => {
  if (!value) return fallback.toISOString()
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return fallback.toISOString()
  return date.toISOString()
}

const loadJson = (fileName, fallback) => {
  const filePath = path.join(dataDir, fileName)
  if (!fs.existsSync(filePath)) {
    return fallback
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return fallback
  }
}

function ensureStore() {
  if (store) return store
  const boardsRaw = loadJson('boards.json', [])
  const postsRaw = loadJson('posts.json', {})
  const now = Date.now()

  const boards = boardsRaw.map((board, index) => ({
    id: board.id,
    title: board.title,
    ordering: board.order ?? 1000 + index,
    deleted: 0,
    created_at: new Date(now - (boardsRaw.length - index) * 120000).toISOString(),
    updated_at: new Date(now - (boardsRaw.length - index) * 120000).toISOString()
  }))

  const posts = []
  Object.entries(postsRaw).forEach(([boardId, items]) => {
    if (!Array.isArray(items)) return
    items.forEach((post, idx) => {
      const created = toIso(post.date, new Date(now - (idx + 1) * 7200000))
      posts.push({
        id: post.id || `${boardId}_${idx}`,
        board_id: boardId,
        title: post.title || 'Untitled',
        content: post.content || SAMPLE_SNIPPETS[idx % SAMPLE_SNIPPETS.length],
        date: created.slice(0, 10),
        tag: post.tag || '',
        thumb: post.thumb || '',
        author: post.author || 'Guest',
        category: post.category || null,
        deleted: 0,
        created_at: created,
        updated_at: created,
        views: clamp(post.views ?? mockRandInt(20, 500), 0, 100000),
        source: post.source || 'seed'
      })
    })
  })

  store = {
    boards,
    posts,
    announcements: [],
    events: [],
    readers: new Map()
  }
  return store
}

export const isMockDatabaseEnabled = () => process.env.USE_MOCK_DB === '1'

export function listBoards() {
  const data = ensureStore()
  return data.boards.map((board) => ({ ...board }))
}

export function countBoards() {
  const data = ensureStore()
  return data.boards.length
}

export function listCategories() {
  const data = ensureStore()
  const categories = new Set()
  data.posts.forEach((post) => {
    if (!post.deleted && post.category) categories.add(post.category)
  })
  return Array.from(categories).sort()
}

const sortByDateDesc = (a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime()

function filterPosts({ boardId, search }) {
  const data = ensureStore()
  let items = data.posts.filter((post) => !post.deleted)
  if (boardId) {
    items = items.filter((post) => post.board_id === boardId)
  }
  if (search) {
    const lc = search.toLowerCase()
    const terms = lc.split(/\s+/).filter(Boolean)
    items = items.filter((post) => {
      const blob = [post.title, post.content, post.author, post.category].filter(Boolean).join(' ').toLowerCase()
      return terms.every((term) => blob.includes(term))
    })
  }
  return items.sort(sortByDateDesc)
}

export function getPostsPage({ boardId, limit = 30, offset = 0, search }) {
  const items = filterPosts({ boardId, search })
  const total = items.length
  const slice = items.slice(offset, offset + limit).map((post) => ({ ...post }))
  return { items: slice, total }
}

export function getAllPostsPage({ limit = 30, offset = 0, search }) {
  return getPostsPage({ boardId: undefined, limit, offset, search })
}

export function getPostById(postId) {
  const data = ensureStore()
  const found = data.posts.find((post) => post.id === postId && !post.deleted)
  return found ? { ...found } : null
}

export function incrementViews(postId, amount = 1) {
  const data = ensureStore()
  const target = data.posts.find((post) => post.id === postId && !post.deleted)
  if (target) {
    target.views = clamp((target.views || 0) + (amount || 1), 0, 1_000_000)
    target.updated_at = new Date().toISOString()
  }
}

export function getTrending({ limit = 10, periodDays = 7 }) {
  const data = ensureStore()
  const cutoff = Date.now() - periodDays * 86400000
  const items = data.posts
    .filter((post) => !post.deleted && new Date(post.created_at).getTime() >= cutoff)
    .sort((a, b) => {
      const viewDiff = (b.views || 0) - (a.views || 0)
      if (viewDiff !== 0) return viewDiff
      return sortByDateDesc(a, b)
    })
    .slice(0, limit)
    .map((post, index) => ({
      id: post.id,
      board: post.board_id,
      title: post.title,
      category: post.category,
      image: post.thumb || null,
      author: post.author || null,
      views: post.views || 0,
      created_at: post.created_at,
      updated_at: post.updated_at,
      rank: index + 1,
      isRising: Date.now() - new Date(post.created_at).getTime() < 2 * 86400000
    }))

  return { items, periodDays, limit }
}

export function getHomeAggregate({ latest = 20, trending = 10 } = {}) {
  const data = ensureStore()
  const latestItems = filterPosts({}).slice(0, latest)
  const trendingData = getTrending({ limit: trending, periodDays: 7 })
  return {
    announcements: [...data.announcements],
    events: [...data.events],
    latest: latestItems.map((post) => ({ ...post })),
    trending: trendingData.items,
    boards: listBoards()
  }
}

export function createPost(boardId, payload) {
  const data = ensureStore()
  const targetBoard = data.boards.find((board) => board.id === boardId)
  if (!targetBoard) {
    throw new Error('board_not_found')
  }
  const id = payload.id || mockRandomId()
  const created = new Date().toISOString()
  const post = {
    id,
    board_id: boardId,
    title: payload.title || 'Untitled',
    content: payload.content || '',
    date: payload.date ? payload.date.slice(0, 10) : created.slice(0, 10),
    tag: payload.tag || '',
    thumb: payload.thumb || '',
    author: payload.author || 'Guest',
    category: payload.category || null,
    deleted: 0,
    created_at: created,
    updated_at: created,
    views: 0,
    source: 'user'
  }
  data.posts.push(post)
  if (payload.author_id) {
    applyActivityEvent(payload.author_id, 'post.created', { boardId })
      .catch((err) => console.warn('[mock] applyActivityEvent post.created failed', err.message))
  }
  return { ...post }
}

export function updatePost(postId, patch) {
  const data = ensureStore()
  const target = data.posts.find((post) => post.id === postId && !post.deleted)
  if (!target) return null
  Object.assign(target, {
    title: patch.title ?? target.title,
    content: patch.content ?? target.content,
    date: patch.date ? patch.date.slice(0, 10) : target.date,
    tag: patch.tag ?? target.tag,
    thumb: patch.thumb ?? target.thumb,
    author: patch.author ?? target.author,
    category: patch.category ?? target.category,
    updated_at: new Date().toISOString()
  })
  if (patch.last_edited_by) {
    applyActivityEvent(patch.last_edited_by, 'post.updated.major', { postId: postId })
      .catch((err) => console.warn('[mock] applyActivityEvent post.updated.major failed', err.message))
  }
  return { ...target }
}

export function deletePost(postId) {
  const data = ensureStore()
  const target = data.posts.find((post) => post.id === postId)
  if (!target) return false
  target.deleted = 1
  target.updated_at = new Date().toISOString()
  if (target.author_id) {
    applyActivityEvent(target.author_id, 'post.deleted', { postId })
      .catch((err) => console.warn('[mock] applyActivityEvent post.deleted failed', err.message))
  }
  return true
}

export function mockSearch(query, limit = 20, offset = 0) {
  const trimmed = (query || '').trim()
  if (!trimmed) {
    return { query: trimmed, items: [], count: 0, total: 0, offset, limit }
  }
  const items = filterPosts({ search: trimmed })
  const total = items.length
  const boards = listBoards()
  const boardTitleMap = new Map(boards.map((board) => [board.id, board.title]))
  const slice = items.slice(offset, offset + limit).map((post) => ({
    id: post.id,
    board: post.board_id,
    title: post.title,
    author: post.author,
    category: post.category,
    created_at: post.created_at,
    updated_at: post.updated_at,
    board_title: boardTitleMap.get(post.board_id) ?? null,
    board_icon: BOARD_ICON_MAP[post.board_id] ?? null
  }))
  return { query: trimmed, count: slice.length, items: slice, total, offset, limit }
}
export function mockGeneratePosts(options = {}) {
  const data = ensureStore()
  const {
    count = 20,
    board,
    daysBack = 7,
    viewsMin = 0,
    viewsMax = 3000,
    thumbsRatio = 0.75,
    titlePrefix = '',
    categoryPool,
    authorPool,
    boardWeights,
    contentLengthMin = 120,
    contentLengthMax = 600,
    seed
  } = options

  if (seed) {
    try {
      Math.seedrandom?.(String(seed))
    } catch {
      // ignore
    }
  }

  const boards = board ? data.boards.filter((b) => b.id === board) : data.boards
  if (!boards.length) {
    return { ok: false, error: board ? 'board_not_found' : 'no_boards', generated: 0, items: [] }
  }

  let weighted = boards
  if (boardWeights && typeof boardWeights === 'object') {
    const expanded = []
    boards.forEach((b) => {
      const weight = Math.max(0, Number(boardWeights[b.id] ?? 1))
      for (let i = 0; i < Math.ceil(weight); i += 1) {
        expanded.push(b)
      }
    })
    if (expanded.length) weighted = expanded
  }

  const sanitizedPrefix = Array.isArray(titlePrefix) ? titlePrefix : String(titlePrefix || '').split('|').filter(Boolean)
  const generated = []
  const safeCount = clamp(parseInt(count, 10) || 20, 1, 1000)
  const safeDaysBack = clamp(parseInt(daysBack, 10) || 7, 0, 365)
  const minViews = clamp(parseInt(viewsMin, 10) || 0, 0, 1_000_000)
  const maxViews = clamp(parseInt(viewsMax, 10) || minViews, minViews, 1_000_000)
  const thumbsChance = clamp(Number(thumbsRatio) || 0, 0, 1)
  const minContent = clamp(parseInt(contentLengthMin, 10) || 120, 20, 5000)
  const maxContent = clamp(parseInt(contentLengthMax, 10) || 600, minContent, 20000)

  for (let i = 0; i < safeCount; i += 1) {
    const targetBoard = mockPick(weighted)
    const id = mockRandomId()
    const prefix = sanitizedPrefix.length ? mockPick(sanitizedPrefix) + ' ' : ''
    const title = `${prefix}${mockPick(SAMPLE_TITLES)} #${mockRandInt(1, 9999)}`
    const snippet = mockPick(SAMPLE_SNIPPETS)
    const bodyLength = mockRandInt(minContent, maxContent)
    const filler = Math.random().toString(36).repeat(20).slice(0, bodyLength)
    const daysAgo = mockRandInt(0, safeDaysBack)
    const created = new Date(Date.now() - daysAgo * 86400000)
    const authorPoolArr = Array.isArray(authorPool) && authorPool.length ? authorPool : SAMPLE_AUTHORS
    const categoryPoolArr = Array.isArray(categoryPool) && categoryPool.length ? categoryPool : SAMPLE_CATEGORIES
    const thumb = Math.random() < thumbsChance ? mockPick(SAMPLE_THUMBS.filter(Boolean)) : ''
    const post = {
      id,
      board_id: targetBoard.id,
      title,
      content: `${snippet}\n\n${filler}`,
      date: created.toISOString().slice(0, 10),
      tag: 'mock',
      thumb,
      author: mockPick(authorPoolArr),
      category: mockPick(categoryPoolArr),
      deleted: 0,
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
      views: mockRandInt(minViews, maxViews),
      source: 'mock'
    }
    data.posts.push(post)
    generated.push({ ...post, board: post.board_id })
  }

  generated.sort((a, b) => sortByDateDesc(a, b))
  return { ok: true, generated: generated.length, items: generated }
}

export function mockResetPosts() {
  const data = ensureStore()
  const before = data.posts.length
  data.posts = data.posts.filter((post) => post.tag !== 'mock')
  return { removed: before - data.posts.length }
}

export function mockStatus() {
  const data = ensureStore()
  const count = data.posts.filter((post) => post.tag === 'mock').length
  return { ok: true, count }
}

export function getMetricsSummary() {
  const boards = countBoards()
  const posts = filterPosts({}).length
  return { boards, posts }
}

