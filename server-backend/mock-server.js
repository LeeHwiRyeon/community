import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  buildMockHierarchy,
  generatePostForBoard,
  generateRandomMessage,
  randomMessages
} from './random-data.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DEFAULT_PORT = Number(process.env.PORT || 50000)
const DEFAULT_HOST = process.env.HOST || '127.0.0.1'

const app = express()

const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173'
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(null, false)
      }
    },
    credentials: true
  })
)

app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  next()
})

const hierarchy = buildMockHierarchy({ postsPerBoard: 30 })
const boardMap = hierarchy.boardMap
const communities = hierarchy.communities
let chatMessages = [...randomMessages]

const mockUsers = [
  {
    id: 1,
    display_name: 'TestUser',
    email: 'test@example.com',
    role: 'user',
    status: 'active'
  }
]

function boardList() {
  return Array.from(boardMap.values()).filter((board) => board.deleted !== 1)
}

function activePosts(board) {
  return board.posts.filter((post) => post.deleted !== 1)
}

function getAllPosts() {
  return boardList().flatMap((board) => activePosts(board))
}

function sanitizeBoard(board) {
  return {
    id: board.id,
    title: board.title,
    summary: board.summary,
    category: board.category,
    format: board.format,
    preview_format: board.previewFormat,
    community: board.communityId,
    community_title: board.communityTitle,
    ordering: board.ordering,
    rank: board.rank,
    deleted: board.deleted ?? 0
  }
}

function summarizePost(post) {
  return {
    id: post.id,
    title: post.title,
    author: post.author ?? null,
    views: post.views,
    comments_count: post.comments_count ?? 0,
    created_at: post.created_at,
    updated_at: post.updated_at,
    date: post.date ?? null,
    thumb: post.thumb ?? null,
    mediaType: post.mediaType ?? post.preview?.type ?? 'article',
    preview: post.preview ?? null,
    stream_url: post.stream_url ?? null,
    category: post.category ?? null
  }
}

function fullPost(post) {
  return {
    ...summarizePost(post),
    board_id: post.board_id,
    content: post.content ?? '',
    deleted: post.deleted ?? 0
  }
}

function findPostById(postId) {
  for (const board of boardMap.values()) {
    const match = board.posts.find((post) => post.id === postId)
    if (match) {
      return { board, post: match }
    }
  }
  return null
}

function toTitleCase(value) {
  return value
    .toString()
    .split(/[-_\\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function slugify(value) {
  return value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

}

function loadMenuData() {
  try {
    const categoriesPath = path.resolve(__dirname, '../..', 'data', 'categories', 'game.json')
    const raw = fs.readFileSync(categoriesPath, 'utf8')
    const parsed = JSON.parse(raw)
    const children = Array.isArray(parsed.children) ? parsed.children : []

    return [
      {
        id: 'home',
        label: 'Home',
        href: '/',
        children: []
      },
      {
        id: 'boards',
        label: 'Boards',
        children: [
          { id: 'news', label: 'News', href: '/board/news' },
          { id: 'community', label: 'Community', href: '/board/community' },
          { id: 'broadcast', label: 'Broadcast', href: '/board/broadcast' },
          {
            id: 'game',
            label: 'Games',
            children: children.map((entry) => ({
              id: entry.id,
              label: entry.label,
              children: Array.isArray(entry.children)
                ? entry.children.map((sub) => ({ id: sub.id, label: sub.label }))
                : []
            }))
          }
        ]
      }
    ]
  } catch (error) {
    console.warn('[mock-server] Failed to load menu data:', error.message)
    return [
      {
        id: 'home',
        label: 'Home',
        href: '/',
        children: []
      },
      {
        id: 'boards',
        label: 'Boards',
        children: [
          { id: 'news', label: 'News', href: '/board/news' },
          { id: 'game', label: 'Games', href: '/board/game' }
        ]
      }
    ]
  }
}

function ensureCommunity(communityId, communityTitle, summary) {
  let community = communities.find((entry) => entry.id === communityId)
  if (!community) {
    community = {
      id: communityId,
      title: communityTitle,
      description: summary ?? `${communityTitle} community`,
      rank: communities.length + 1,
      totalViews: 0,
      boards: []
    }
    communities.push(community)
  }
  return community
}

function computeCommunitySummaries() {
  return communities.map((community) => {
    const boards = community.boards.filter((board) => board.deleted !== 1)
    const totalViews = boards.reduce(
      (sum, board) => sum + activePosts(board).reduce((acc, post) => acc + post.views, 0),
      0
    )

    return {
      id: community.id,
      title: community.title,
      description: community.description,
      rank: community.rank,
      totalViews,
      boards: boards.map((board) => ({
        id: board.id,
        title: board.title,
        summary: board.summary,
        category: board.category,
        rank: board.rank,
        ordering: board.ordering,
        format: board.format,
        preview_format: board.previewFormat,
        posts: activePosts(board)
          .slice(0, 8)
          .map((post) => summarizePost(post))
      }))
    }
  })
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'mock',
    timestamp: Date.now(),
    boards: boardList().length,
    posts: getAllPosts().length
  })
})

app.get('/api/boards', (req, res) => {
  const boards = boardList().map((board) => sanitizeBoard(board))
  if (req.query.grouped === 'true') {
    const grouped = boards.reduce((acc, board) => {
      const category = board.category || 'general'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(board)
      return acc
    }, {})
    res.json(grouped)
    return
  }

  res.json(boards)
})

app.get('/api/board-categories', (req, res) => {
  const categories = Array.from(
    new Set(boardList().map((board) => board.category || 'general'))
  ).map((id) => ({
    id,
    label: toTitleCase(id),
    description: `Sample posts from the ${toTitleCase(id)} category.`
  }))
  res.json(categories)
})

app.get('/api/communities', (req, res) => {
  res.json(computeCommunitySummaries())
})

app.get('/api/posts', (req, res) => {
  const boardId = req.query.board_id
  const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 20, 100))
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0)
  const sort = req.query.sort === 'views' ? 'views' : 'date'
  const search = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : ''

  let posts = getAllPosts()
  if (boardId) {
    posts = posts.filter((post) => post.board_id === boardId)
  }
  if (search) {
    posts = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(search) ||
        (post.content ?? '').toLowerCase().includes(search)
    )
  }
  if (sort === 'views') {
    posts = posts.sort((a, b) => b.views - a.views)
  } else {
    posts = posts.sort((a, b) => {
      const aDate = a.date || a.created_at
      const bDate = b.date || b.created_at
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
  }

  const slice = posts.slice(offset, offset + limit + 1)
  const hasMore = slice.length > limit
  const items = (hasMore ? slice.slice(0, limit) : slice).map((post) => fullPost(post))

  res.json({
    items,
    total: posts.length,
    offset,
    limit,
    hasMore
  })
})

app.get('/api/posts/:id', (req, res) => {
  const result = findPostById(req.params.id)
  if (!result) {
    res.status(404).json({ error: 'post_not_found' })
    return
  }
  res.json(fullPost(result.post))
})

app.get('/api/boards/:boardId/posts', (req, res) => {
  const board = boardMap.get(req.params.boardId)
  if (!board || board.deleted === 1) {
    res.status(404).json({ error: 'board_not_found' })
    return
  }

  const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 20, 100))
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0)
  const sort = req.query.sort === 'views' ? 'views' : 'date'
  const search = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : ''

  let posts = activePosts(board)
  if (search) {
    posts = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(search) ||
        (post.content ?? '').toLowerCase().includes(search)
    )
  }
  if (sort === 'views') {
    posts = posts.sort((a, b) => b.views - a.views)
  } else {
    posts = posts.sort((a, b) => {
      const aDate = a.date || a.created_at
      const bDate = b.date || b.created_at
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
  }

  const slice = posts.slice(offset, offset + limit + 1)
  const hasMore = slice.length > limit
  const items = (hasMore ? slice.slice(0, limit) : slice).map((post) => fullPost(post))

  res.json({
    items,
    total: posts.length,
    offset,
    limit,
    hasMore
  })
})

app.post('/api/boards', (req, res) => {
  const {
    id: rawId,
    title,
    summary,
    category = 'custom',
    communityId = 'community-custom',
    communityTitle = 'Community Hub'
  } = req.body || {}

  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'title_required' })
    return
  }

  const id = rawId && typeof rawId === 'string' && rawId.trim() ? rawId.trim() : slugify(title)
  if (boardMap.has(id)) {
    res.status(409).json({ error: 'board_exists' })
    return
  }

  const ordering = boardMap.size + 1
  const board = {
    id,
    title: title.trim(),
    summary: summary ?? `${title.trim()} discussion board`,
    communityId,
    communityTitle,
    communitySize: 1,
    gameName: title.trim(),
    ordering,
    rank: ordering,
    weight: 1,
    category,
    previewFormat: 'article',
    format: 'article',
    previewSeed: {},
    seedHeadlines: [`${title.trim()} spotlight`],
    posts: [],
    deleted: 0
  }

  boardMap.set(board.id, board)
  const community = ensureCommunity(communityId, communityTitle, summary)
  community.boards.push(board)

  res.status(201).json(sanitizeBoard(board))
})

app.post('/api/boards/:boardId/posts', (req, res) => {
  const board = boardMap.get(req.params.boardId)
  if (!board || board.deleted === 1) {
    res.status(404).json({ error: 'board_not_found' })
    return
  }

  const seed = generatePostForBoard(board)
  const now = new Date()
  const title = typeof req.body?.title === 'string' && req.body.title.trim() ? req.body.title.trim() : seed.title
  const content = typeof req.body?.content === 'string' && req.body.content.trim() ? req.body.content.trim() : seed.content
  const author = typeof req.body?.author === 'string' && req.body.author.trim() ? req.body.author.trim() : seed.author
  const views = typeof req.body?.views === 'number' ? req.body.views : seed.views

  const post = {
    ...seed,
    id: Date.now().toString(),
    title,
    content,
    author,
    views,
    comments_count: 0,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    date: now.toISOString().slice(0, 10),
    deleted: 0
  }

  board.posts.unshift(post)
  res.status(201).json(fullPost(post))
})

app.patch('/api/posts/:pid', (req, res) => {
  const result = findPostById(req.params.pid)
  if (!result) {
    res.status(404).json({ error: 'post_not_found' })
    return
  }

  const { post } = result
  const { title, content, author, thumb, deleted, preview } = req.body || {}

  if (typeof title === 'string' && title.trim()) {
    post.title = title.trim()
  }
  if (typeof content === 'string' && content.trim()) {
    post.content = content.trim()
  }
  if (typeof author === 'string' && author.trim()) {
    post.author = author.trim()
  }
  if (typeof thumb === 'string' && thumb.trim()) {
    post.thumb = thumb.trim()
  }
  if (preview && typeof preview === 'object') {
    post.preview = preview
  }
  if (deleted !== undefined) {
    post.deleted = deleted ? 1 : 0
  }

  post.updated_at = new Date().toISOString()
  res.json(fullPost(post))
})

app.delete('/api/boards/:boardId/posts/:pid', (req, res) => {
  const board = boardMap.get(req.params.boardId)
  if (!board) {
    res.status(404).json({ error: 'board_not_found' })
    return
  }

  const index = board.posts.findIndex((post) => post.id === req.params.pid)
  if (index === -1) {
    res.status(404).json({ error: 'post_not_found' })
    return
  }

  board.posts.splice(index, 1)
  res.status(204).end()
})

app.delete('/api/boards/:boardId', (req, res) => {
  const board = boardMap.get(req.params.boardId)
  if (!board) {
    res.status(404).json({ error: 'board_not_found' })
    return
  }

  board.deleted = 1
  board.posts.forEach((post) => {
    post.deleted = 1
  })
  res.status(204).end()
})

app.post('/api/posts/:pid/view', (req, res) => {
  const result = findPostById(req.params.pid)
  if (!result) {
    res.status(404).json({ error: 'post_not_found' })
    return
  }

  result.post.views += 1
  result.post.updated_at = new Date().toISOString()
  res.json({ ok: true, views: result.post.views })
})

app.get('/api/trending', (req, res) => {
  const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 10, 50))
  const periodParam = typeof req.query.period === 'string' ? req.query.period : req.query.periodDays
  let periodDays = 7
  if (typeof periodParam === 'string') {
    const match = periodParam.match(/(\d+)/)
    if (match) {
      periodDays = parseInt(match[1], 10)
    }
  }

  const items = getAllPosts()
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
    .map((post, index) => ({
      id: post.id,
      board: post.board_id,
      title: post.title,
      category: post.category ?? null,
      image: post.thumb ?? null,
      author: post.author ?? null,
      views: post.views,
      created_at: post.created_at,
      updated_at: post.updated_at,
      rank: index + 1,
      isRising: index < 3
    }))

  res.json({ items, periodDays, limit })
})

app.get('/api/categories', (req, res) => {
  const categories = Array.from(
    new Set(boardList().map((board) => board.category || 'general'))
  ).map((id) => ({
    id,
    label: toTitleCase(id),
    boards: boardList()
      .filter((board) => (board.category || 'general') === id)
      .map((board) => sanitizeBoard(board))
  }))
  res.json(categories)
})

app.get('/api/menu', (req, res) => {
  res.json(loadMenuData())
})

app.get('/api/posts-map', (req, res) => {
  const map = {}
  boardList().forEach((board) => {
    map[board.id] = activePosts(board).map((post) => summarizePost(post))
  })
  res.json(map)
})

app.get('/api/chat/:room/messages', (req, res) => {
  const room = req.params.room || 'general'
  const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 50, 200))
  const messages = chatMessages
    .filter((message) => message.room_id === room)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
  res.json({ items: messages })
})

app.post('/api/chat/:room/messages', (req, res) => {
  const room = req.params.room || 'general'
  const message = generateRandomMessage(Date.now(), room)
  message.content = typeof req.body?.content === 'string' && req.body.content.trim()
    ? req.body.content.trim()
    : message.content
  message.username = typeof req.body?.username === 'string' && req.body.username.trim()
    ? req.body.username.trim()
    : message.username

  chatMessages.unshift(message)
  res.status(201).json(message)
})

app.get('/api/auth/me', (req, res) => {
  res.json({ user: mockUsers[0] })
})

app.post('/api/auth/google', (req, res) => {
  res.json({ token: 'mock-token', user: mockUsers[0] })
})

app.get('/api/metrics', (req, res) => {
  res.json({
    uptimeSeconds: Math.floor(process.uptime()),
    boards: boardList().length,
    posts: getAllPosts().length,
    chat: {
      rooms: new Set(chatMessages.map((message) => message.room_id)).size,
      totalMessages: chatMessages.length
    }
  })
})

app.get('/api/metrics-prom', (req, res) => {
  const lines = []
  const uptime = Math.floor(process.uptime())
  const boards = boardList().length
  const posts = getAllPosts().length

  lines.push('# HELP app_uptime_seconds Application uptime in seconds')
  lines.push('# TYPE app_uptime_seconds gauge')
  lines.push(`app_uptime_seconds ${uptime}`)

  lines.push('# HELP app_boards Boards count')
  lines.push('# TYPE app_boards gauge')
  lines.push(`app_boards ${boards}`)

  lines.push('# HELP app_posts Posts count')
  lines.push('# TYPE app_posts gauge')
  lines.push(`app_posts ${posts}`)

  lines.push('# HELP app_chat_messages Chat messages stored')
  lines.push('# TYPE app_chat_messages gauge')
  lines.push(`app_chat_messages ${chatMessages.length}`)

  res.setHeader('Content-Type', 'text/plain; version=0.0.4')
  res.send(lines.join('\n'))
})

app.get('/api/help', (req, res) => {
  res.json({
    endpoints: {
      health: 'GET /api/health',
      boards: 'GET /api/boards',
      posts: 'GET /api/posts',
      trending: 'GET /api/trending',
      communities: 'GET /api/communities',
      menu: 'GET /api/menu',
      chatMessages: 'GET /api/chat/:room/messages'
    }
  })
})

const server = app.listen(DEFAULT_PORT, DEFAULT_HOST, () => {
  console.log(`Mock server listening on http://${DEFAULT_HOST}:${DEFAULT_PORT}`)
})

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Mock server terminated')
    process.exit(0)
  })
})
