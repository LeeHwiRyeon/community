import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Post } from '../api'
import { apiService } from '../api'

const DEFAULT_STALE_TIME_MS = 1000 * 60 * 5

export const postKeys = {
  detail: (postId: string | undefined) => ['posts', 'detail', postId ?? 'missing'] as const
}

export const usePostDetail = (postId: string | undefined) =>
  useQuery<Post>({
    queryKey: postKeys.detail(postId),
    queryFn: () => {
      if (!postId) {
        return Promise.reject(new Error('missing post id'))
      }
      return apiService.getPost(postId)
    },
    enabled: Boolean(postId),
    staleTime: DEFAULT_STALE_TIME_MS
  })
