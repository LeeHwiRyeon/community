import { useQuery } from '@tanstack/react-query'
import { apiService, Broadcast } from '../api'

const DEFAULT_STALE_TIME_MS = 1000 * 60 * 5

export const broadcastKeys = {
    all: ['broadcasts'] as const,
    detail: (postId: string | undefined) => ['broadcasts', 'detail', postId ?? 'missing'] as const
}

export const useBroadcasts = () => {
    return useQuery({
        queryKey: broadcastKeys.all,
        queryFn: () => apiService.getBroadcasts(),
        staleTime: DEFAULT_STALE_TIME_MS
    })
}

export const useBroadcast = (postId: string | undefined) => {
    return useQuery({
        queryKey: broadcastKeys.detail(postId),
        queryFn: () => {
            if (!postId) {
                return Promise.reject(new Error('missing post id'))
            }
            return apiService.getBroadcast(postId)
        },
        enabled: Boolean(postId),
        staleTime: DEFAULT_STALE_TIME_MS
    })
}