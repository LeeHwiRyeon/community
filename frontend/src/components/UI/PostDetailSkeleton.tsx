import React from 'react';
import { Box, Card, CardContent, Skeleton, Stack, Divider } from '@mui/material';

const PostDetailSkeleton: React.FC = () => {
    return (
        <Box>
            {/* 게시글 상세 카드 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    {/* 제목 */}
                    <Skeleton
                        variant="text"
                        width="80%"
                        height={40}
                        sx={{ mb: 2 }}
                    />

                    {/* 작성자 정보 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width={120} height={20} />
                            <Skeleton variant="text" width={150} height={16} />
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* 본문 내용 */}
                    <Stack spacing={1} sx={{ mb: 2 }}>
                        <Skeleton variant="text" width="100%" height={20} />
                        <Skeleton variant="text" width="100%" height={20} />
                        <Skeleton variant="text" width="95%" height={20} />
                        <Skeleton variant="text" width="100%" height={20} />
                        <Skeleton variant="text" width="85%" height={20} />
                        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2, mb: 2 }} />
                        <Skeleton variant="text" width="100%" height={20} />
                        <Skeleton variant="text" width="90%" height={20} />
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    {/* 하단 통계 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Skeleton variant="text" width={80} height={24} />
                        <Skeleton variant="text" width={80} height={24} />
                        <Skeleton variant="text" width={80} height={24} />
                    </Box>
                </CardContent>
            </Card>

            {/* 댓글 섹션 */}
            <Card>
                <CardContent>
                    <Skeleton variant="text" width={120} height={28} sx={{ mb: 2 }} />
                    <Divider sx={{ mb: 2 }} />

                    {/* 댓글 스켈레톤 */}
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Box key={index} sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Skeleton variant="circular" width={32} height={32} />
                                <Skeleton variant="text" width={100} height={20} />
                                <Skeleton variant="text" width={120} height={16} />
                            </Box>
                            <Skeleton variant="text" width="90%" height={20} />
                            <Skeleton variant="text" width="70%" height={20} />
                        </Box>
                    ))}
                </CardContent>
            </Card>
        </Box>
    );
};

export default PostDetailSkeleton;
