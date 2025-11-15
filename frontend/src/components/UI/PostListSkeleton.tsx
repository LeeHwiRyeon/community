import React from 'react';
import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material';

interface PostListSkeletonProps {
    count?: number;
}

const PostListSkeleton: React.FC<PostListSkeletonProps> = ({ count = 5 }) => {
    return (
        <Stack spacing={2}>
            {Array.from({ length: count }).map((_, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                        {/* 제목 */}
                        <Skeleton
                            variant="text"
                            width="70%"
                            height={32}
                            sx={{ mb: 1 }}
                        />

                        {/* 내용 미리보기 */}
                        <Skeleton
                            variant="text"
                            width="100%"
                            height={20}
                            sx={{ mb: 0.5 }}
                        />
                        <Skeleton
                            variant="text"
                            width="90%"
                            height={20}
                            sx={{ mb: 2 }}
                        />

                        {/* 하단 정보 (작성자, 날짜, 통계) */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Skeleton variant="circular" width={24} height={24} />
                                <Skeleton variant="text" width={80} height={20} />
                                <Skeleton variant="text" width={100} height={20} />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Skeleton variant="text" width={60} height={20} />
                                <Skeleton variant="text" width={60} height={20} />
                                <Skeleton variant="text" width={60} height={20} />
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </Stack>
    );
};

export default PostListSkeleton;
