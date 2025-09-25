import { useMemo } from 'react'
import {
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryResult
} from '@tanstack/react-query'
import type {
  CommunityBoardSummary,
  CommunitySummary,
  Post,
  TrendingResponse
} from '../api'
import { apiService } from '../api'

const DEFAULT_STALE_TIME_MS = 1000 * 60 * 5
const NEWS_BOARD_ID = 'news'

export const leaderboardKeys = {
  root: ['leaderboard'] as const,
  news: () => ['leaderboard', 'news'] as const,
  trending: (limit: number, periodDays: number) => [
    'leaderboard',
    'trending',
    { limit, periodDays }
  ] as const,
  communities: () => ['leaderboard', 'communities'] as const,
  boardPosts: (boardId: string) => ['boards', boardId, 'posts'] as const
}

export const sortPostsByViews = <T extends Post>(posts: T[]): T[] =>
  [...posts].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))

export const useNewsPosts = () =>
  useQuery({
    queryKey: leaderboardKeys.news(),
    queryFn: () => apiService.getPosts(NEWS_BOARD_ID),
    staleTime: DEFAULT_STALE_TIME_MS,
    select: sortPostsByViews
  })

export const useTrendingList = (limit = 10, periodDays = 7) =>
  useQuery({
    queryKey: leaderboardKeys.trending(limit, periodDays),
    queryFn: () => apiService.getTrending(limit, periodDays),
    staleTime: DEFAULT_STALE_TIME_MS,
    select: (response: TrendingResponse) => ({
      ...response,
      items: [...response.items].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    })
  })

const normalizeCommunityBoards = (community: CommunitySummary): CommunitySummary => ({
  ...community,
  boards: community.boards.map((board) => ({
    ...board,
    posts: board.posts?.length ? sortPostsByViews(board.posts) : board.posts
  }))
})

export const useCommunities = () => {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: leaderboardKeys.communities(),
    queryFn: () => apiService.getCommunities(),
    staleTime: DEFAULT_STALE_TIME_MS,
    select: (communities: CommunitySummary[]) => communities.map(normalizeCommunityBoards),
    onSuccess: (communities) => {
      communities.forEach((community) => {
        community.boards.forEach((board) => {
          if (board.posts?.length) {
            queryClient.setQueryData<Post[]>(
              leaderboardKeys.boardPosts(board.id),
              board.posts
            )
          }
        })
      })
    }
  })
}

type CommunityBoardPostsResult = {
  postsByBoardId: Record<string, Post[]>,
  queries: UseQueryResult<Post[], unknown>[],
  isLoading: boolean,
  isFetching: boolean,
  isError: boolean,
  errors: unknown[]
}

export const useCommunityBoardPosts = (
  boards: CommunityBoardSummary[]
): CommunityBoardPostsResult => {
  const queries = useQueries({
    queries: boards.map((board) => ({
      queryKey: leaderboardKeys.boardPosts(board.id),
      queryFn: () => apiService.getPosts(board.id),
      enabled: board.id.length > 0,
      staleTime: DEFAULT_STALE_TIME_MS,
      initialData: board.posts?.length ? board.posts : undefined,
      select: sortPostsByViews
    }))
  }) as UseQueryResult<Post[], unknown>[]

  const postsByBoardId = useMemo(() => {
    const accumulator: Record<string, Post[]> = {}

    boards.forEach((board, index) => {
      const query = queries[index]
      if (query?.data?.length) {
        accumulator[board.id] = query.data
      } else if (board.posts?.length) {
        accumulator[board.id] = board.posts
      } else {
        accumulator[board.id] = []
      }
    })

    return accumulator
  }, [boards, queries])

  const isLoading = queries.some((query) => query.isLoading)
  const isFetching = queries.some((query) => query.isFetching)
  const isError = queries.some((query) => query.isError)
  const errors = queries.filter((query) => query.error).map((query) => query.error as unknown)

  return { postsByBoardId, queries, isLoading, isFetching, isError, errors }
}
