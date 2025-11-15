import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';

interface CommentSkeletonProps {
    count?: number;
    nested?: boolean;
}

const CommentSkeleton: React.FC<CommentSkeletonProps> = ({
    count = 3,
    nested = false
}) => {
    return (
        <Stack spacing={2} sx={{ pl: nested ? 4 : 0 }}>
            {Array.from({ length: count }).map((_, index) => (
                <Box key={index}>
                    {/* 댓글 헤더 (아바타, 작성자, 날짜) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Skeleton variant="circular" width={32} height={32} />
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Skeleton variant="text" width={100} height={20} />
                                <Skeleton variant="text" width={120} height={16} />
                            </Box>
                        </Box>
                    </Box>

                    {/* 댓글 내용 */}
                    <Box sx={{ pl: 5 }}>
                        <Skeleton variant="text" width="95%" height={20} />
                        <Skeleton variant="text" width="80%" height={20} />

                        {/* 액션 버튼 */}
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <Skeleton variant="text" width={60} height={20} />
                            <Skeleton variant="text" width={60} height={20} />
                        </Box>
                    </Box>
                </Box>
            ))}
        </Stack>
    );
};

export default CommentSkeleton;
