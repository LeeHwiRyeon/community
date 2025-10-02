import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Board, Post } from '../api'
import { apiService } from '../api'

const DEFAULT_STALE_TIME_MS = 1000 * 60 * 5

export const boardKeys = {
  root: ['boards'] as const,
  boardPosts: (boardId: string, paramsKey: string) => ['board', boardId, 'posts', paramsKey] as const
}

const buildParamsKey = (params: Record<string, string>) => {
  const entries = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
  return JSON.stringify(entries)
}

export const useBoardsCatalog = () =>
  useQuery({
    queryKey: boardKeys.root,
    queryFn: () => apiService.getBoards(),
    staleTime: DEFAULT_STALE_TIME_MS
  })

export const useBoardPosts = (boardId: string | undefined, params: Record<string, string>) => {
  const paramsKey = useMemo(() => buildParamsKey(params), [params])

  return useQuery<Post[]>({
    queryKey: boardId ? boardKeys.boardPosts(boardId, paramsKey) : ['board', 'unknown', 'posts', paramsKey],
    queryFn: () => {
      if (!boardId) {
        return Promise.resolve([])
      }
      return apiService.getPosts(boardId, params)
    },
    enabled: Boolean(boardId),
    staleTime: DEFAULT_STALE_TIME_MS
  })
}
