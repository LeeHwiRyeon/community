import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type {
    Board,
    Post,
    User,
    PostListParams,
    CreatePostData,
    UpdatePostData,
    CreateBoardData,
    UpdateBoardData,
    Announcement,
    Event,
} from '../types/api';

// Query keys for React Query
export const queryKeys = {
    boards: ['boards'] as const,
    board: (id: string) => ['boards', id] as const,
    posts: (boardId: string, params?: PostListParams) => ['posts', boardId, params] as const,
    post: (id: string) => ['posts', id] as const,
    postsMap: ['posts', 'map'] as const,
    announcements: (params?: { active?: boolean }) => ['announcements', params] as const,
    announcement: (id: number) => ['announcements', id] as const,
    events: (params?: { status?: string }) => ['events', params] as const,
    event: (id: number) => ['events', id] as const,
    authProviders: ['auth', 'providers'] as const,
    authMe: ['auth', 'me'] as const,
    metrics: ['metrics'] as const,
    health: (verbose?: boolean) => ['health', verbose] as const,
};

// 게시판 관련 훅
export const useBoards = () => {
    return useQuery({
        queryKey: queryKeys.boards,
        queryFn: async () => {
            const response = await api.boards.getAll();
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data || [];
        },
        staleTime: 5 * 60 * 1000, // 5분
    });
};

export const useCreateBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateBoardData) => {
            const response = await api.boards.create(data);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.boards });
        },
    });
};

export const useUpdateBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateBoardData }) => {
            const response = await api.boards.update(id, data);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.boards });
        },
    });
};

export const useDeleteBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.boards.delete(id);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.boards });
        },
    });
};

// 게시글 관련 훅
export const usePostsByBoard = (boardId: string, params?: PostListParams) => {
    return useQuery({
        queryKey: queryKeys.posts(boardId, params),
        queryFn: async () => {
            const response = await api.posts.getByBoard(boardId, params);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data || [];
        },
        enabled: !!boardId,
        staleTime: 2 * 60 * 1000, // 2분
    });
};

export const usePost = (postId: string) => {
    return useQuery({
        queryKey: queryKeys.post(postId),
        queryFn: async () => {
            const response = await api.posts.getById(postId);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data;
        },
        enabled: !!postId,
        staleTime: 5 * 60 * 1000, // 5분
    });
};

export const usePostsMap = () => {
    return useQuery({
        queryKey: queryKeys.postsMap,
        queryFn: async () => {
            const response = await api.posts.getMap();
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data || {};
        },
        staleTime: 10 * 60 * 1000, // 10분
    });
};

export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ boardId, data }: { boardId: string; data: CreatePostData }) => {
            const response = await api.posts.create(boardId, data);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data;
        },
        onSuccess: (_, { boardId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.posts(boardId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.postsMap });
        },
    });
};

export const useUpdatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            boardId,
            postId,
            data
        }: {
            boardId: string;
            postId: string;
            data: UpdatePostData
        }) => {
            const response = await api.posts.update(boardId, postId, data);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data;
        },
        onSuccess: (_, { boardId, postId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.posts(boardId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.postsMap });
        },
    });
};

export const useDeletePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ boardId, postId }: { boardId: string; postId: string }) => {
            const response = await api.posts.delete(boardId, postId);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data;
        },
        onSuccess: (_, { boardId, postId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.posts(boardId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.postsMap });
        },
    });
};

export const useIncrementPostView = () => {
    return useMutation({
        mutationFn: async (postId: string) => {
            const response = await api.posts.incrementView(postId);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data;
        },
        // 조회수 증가는 UI에 즉시 반영하지 않음 (서버에서 배치 처리)
    });
};

// 인증 관련 훅
export const useAuthProviders = () => {
    return useQuery({
        queryKey: queryKeys.authProviders,
        queryFn: async () => {
            const response = await api.auth.getProviders();
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data || [];
        },
        staleTime: 30 * 60 * 1000, // 30분
    });
};

export const useAuthMe = () => {
    return useQuery({
        queryKey: queryKeys.authMe,
        queryFn: async () => {
            const response = await api.auth.getMe();
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data;
        },
        enabled: api.tokenManager.isAuthenticated(),
        staleTime: 5 * 60 * 1000, // 5분
        retry: false, // 인증 실패 시 재시도하지 않음
    });
};

export const useLogout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            api.auth.logout();
        },
        onSuccess: () => {
            queryClient.clear(); // 모든 캐시 제거
        },
    });
};

// 공지사항 관련 훅
export const useAnnouncements = (params?: { active?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.announcements(params),
        queryFn: async () => {
            const response = await api.announcements.getAll(params);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data || [];
        },
        staleTime: 5 * 60 * 1000, // 5분
    });
};

export const useAnnouncement = (id: number) => {
    return useQuery({
        queryKey: queryKeys.announcement(id),
        queryFn: async () => {
            const response = await api.announcements.getById(id);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5분
    });
};

// 이벤트 관련 훅
export const useEvents = (params?: { status?: string }) => {
    return useQuery({
        queryKey: queryKeys.events(params),
        queryFn: async () => {
            const response = await api.events.getAll(params);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data || [];
        },
        staleTime: 5 * 60 * 1000, // 5분
    });
};

export const useEvent = (id: number) => {
    return useQuery({
        queryKey: queryKeys.event(id),
        queryFn: async () => {
            const response = await api.events.getById(id);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5분
    });
};

// 메트릭 관련 훅
export const useMetrics = () => {
    return useQuery({
        queryKey: queryKeys.metrics,
        queryFn: async () => {
            const response = await api.metrics.get();
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data || {};
        },
        staleTime: 30 * 1000, // 30초
        refetchInterval: 60 * 1000, // 1분마다 자동 갱신
    });
};

export const useHealthCheck = (verbose?: boolean) => {
    return useQuery({
        queryKey: queryKeys.health(verbose),
        queryFn: async () => {
            const response = await api.metrics.health(verbose);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data || {};
        },
        staleTime: 30 * 1000, // 30초
        refetchInterval: 60 * 1000, // 1분마다 자동 갱신
    });
};

// 클라이언트 메트릭 전송 훅
export const useSendClientMetrics = () => {
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.metrics.sendClientMetrics(data);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data;
        },
    });
};