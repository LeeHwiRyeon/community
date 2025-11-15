import { useState, useCallback } from 'react';

interface OptimisticState<T> {
    data: T;
    isOptimistic: boolean;
    error?: string;
}

interface UseOptimisticUpdateOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: Error, rollbackData: T) => void;
}

/**
 * 낙관적 업데이트를 위한 커스텀 훅
 * 즉시 UI를 업데이트하고, 에러 발생 시 자동 롤백
 */
export function useOptimisticUpdate<T>(
    initialData: T,
    options: UseOptimisticUpdateOptions<T> = {}
) {
    const [state, setState] = useState<OptimisticState<T>>({
        data: initialData,
        isOptimistic: false,
    });

    const update = useCallback(
        async (
            optimisticData: T,
            apiCall: () => Promise<T>
        ) => {
            // 이전 데이터 저장 (롤백용)
            const previousData = state.data;

            // 즉시 UI 업데이트 (낙관적)
            setState({
                data: optimisticData,
                isOptimistic: true,
            });

            try {
                // 실제 API 호출
                const result = await apiCall();

                // 성공 시 확정
                setState({
                    data: result,
                    isOptimistic: false,
                });

                options.onSuccess?.(result);

                return result;
            } catch (error) {
                // 실패 시 롤백
                setState({
                    data: previousData,
                    isOptimistic: false,
                    error: error instanceof Error ? error.message : '알 수 없는 오류',
                });

                options.onError?.(
                    error instanceof Error ? error : new Error('알 수 없는 오류'),
                    previousData
                );

                throw error;
            }
        },
        [state.data, options]
    );

    const reset = useCallback(() => {
        setState({
            data: initialData,
            isOptimistic: false,
        });
    }, [initialData]);

    return {
        data: state.data,
        isOptimistic: state.isOptimistic,
        error: state.error,
        update,
        reset,
    };
}

/**
 * 투표 낙관적 업데이트 헬퍼
 */
export function useOptimisticVote(initialVoteCount: number, initialUserVote: 'up' | 'down' | null) {
    const [voteCount, setVoteCount] = useState(initialVoteCount);
    const [userVote, setUserVote] = useState<'up' | 'down' | null>(initialUserVote);
    const [isOptimistic, setIsOptimistic] = useState(false);

    const handleVote = useCallback(
        async (
            newVote: 'up' | 'down',
            apiCall: (vote: 'up' | 'down') => Promise<{ voteCount: number; userVote: 'up' | 'down' | null }>
        ) => {
            // 이전 상태 저장
            const prevVoteCount = voteCount;
            const prevUserVote = userVote;

            // 즉시 UI 업데이트 (낙관적)
            let newVoteCount = voteCount;
            let newUserVote: 'up' | 'down' | null = newVote;

            if (userVote === newVote) {
                // 같은 투표 취소
                newVoteCount = newVote === 'up' ? voteCount - 1 : voteCount + 1;
                newUserVote = null;
            } else if (userVote === null) {
                // 새로운 투표
                newVoteCount = newVote === 'up' ? voteCount + 1 : voteCount - 1;
            } else {
                // 반대 투표로 변경
                newVoteCount = newVote === 'up' ? voteCount + 2 : voteCount - 2;
            }

            setVoteCount(newVoteCount);
            setUserVote(newUserVote);
            setIsOptimistic(true);

            try {
                // 실제 API 호출
                const result = await apiCall(newVote);

                // 서버 결과로 확정
                setVoteCount(result.voteCount);
                setUserVote(result.userVote);
                setIsOptimistic(false);

                return result;
            } catch (error) {
                // 실패 시 롤백
                setVoteCount(prevVoteCount);
                setUserVote(prevUserVote);
                setIsOptimistic(false);

                throw error;
            }
        },
        [voteCount, userVote]
    );

    return {
        voteCount,
        userVote,
        isOptimistic,
        handleVote,
    };
}

/**
 * 북마크 낙관적 업데이트 헬퍼
 */
export function useOptimisticBookmark(initialIsBookmarked: boolean) {
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
    const [isOptimistic, setIsOptimistic] = useState(false);

    const toggleBookmark = useCallback(
        async (apiCall: (bookmarked: boolean) => Promise<boolean>) => {
            // 이전 상태 저장
            const prevBookmarked = isBookmarked;

            // 즉시 UI 업데이트 (낙관적)
            setIsBookmarked(!isBookmarked);
            setIsOptimistic(true);

            try {
                // 실제 API 호출
                const result = await apiCall(!isBookmarked);

                // 서버 결과로 확정
                setIsBookmarked(result);
                setIsOptimistic(false);

                return result;
            } catch (error) {
                // 실패 시 롤백
                setIsBookmarked(prevBookmarked);
                setIsOptimistic(false);

                throw error;
            }
        },
        [isBookmarked]
    );

    return {
        isBookmarked,
        isOptimistic,
        toggleBookmark,
    };
}

/**
 * 좋아요 카운트 낙관적 업데이트 헬퍼
 */
export function useOptimisticLike(initialLikeCount: number, initialIsLiked: boolean) {
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [isOptimistic, setIsOptimistic] = useState(false);

    const toggleLike = useCallback(
        async (apiCall: (liked: boolean) => Promise<{ likeCount: number; isLiked: boolean }>) => {
            // 이전 상태 저장
            const prevLikeCount = likeCount;
            const prevIsLiked = isLiked;

            // 즉시 UI 업데이트 (낙관적)
            const newIsLiked = !isLiked;
            const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;

            setLikeCount(newLikeCount);
            setIsLiked(newIsLiked);
            setIsOptimistic(true);

            try {
                // 실제 API 호출
                const result = await apiCall(newIsLiked);

                // 서버 결과로 확정
                setLikeCount(result.likeCount);
                setIsLiked(result.isLiked);
                setIsOptimistic(false);

                return result;
            } catch (error) {
                // 실패 시 롤백
                setLikeCount(prevLikeCount);
                setIsLiked(prevIsLiked);
                setIsOptimistic(false);

                throw error;
            }
        },
        [likeCount, isLiked]
    );

    return {
        likeCount,
        isLiked,
        isOptimistic,
        toggleLike,
    };
}
