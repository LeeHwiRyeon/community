export const ROUTABLE_BOARD_SLUGS = new Set<string>([
  'news',
  'community',
  'broadcast',
  'cosplay',
  'ranking',
  'game',
  'free',
  'hot',
  'image',
  'qna'
])

export const resolveBoardRouteId = (boardId: string): string => {
  const base = (boardId ?? '').trim()

  if (base.length === 0) {
    return base
  }

  if (ROUTABLE_BOARD_SLUGS.has(base)) {
    return base
  }

  const normalized = base.replace(/_/g, '-').split(/[-/]/)
  const matched = normalized.find((segment) => ROUTABLE_BOARD_SLUGS.has(segment))

  return matched ?? base
}

export const buildPostLink = (boardId: string, postId: string): string => {
  const routeBoardId = resolveBoardRouteId(boardId)
  const normalizedBoard = routeBoardId.length > 0 ? routeBoardId : boardId

  return `/board/${encodeURIComponent(normalizedBoard)}/post/${encodeURIComponent(postId)}`
}
