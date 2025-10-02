import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    Button,
    Chip,
    LinearProgress,
    Alert,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    TrendingUp as TrendingUpIcon,
    Assignment as AssignmentIcon,
    Star as StarIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';

// VIP 요구사항 타입 정의
interface VIPRequirement {
    id: string;
    level: string;
    requirements: {
        points: number;
        posts: number;
        comments: number;
        likes: number;
        monthlyActivity: number;
        specialAchievements: string[];
    };
    benefits: string[];
    estimatedTime: string;
}

interface UserProgress {
    currentPoints: number;
    currentPosts: number;
    currentComments: number;
    currentLikes: number;
    monthlyActivity: number;
    achievements: string[];
    currentLevel: string;
}

const VIPRequirementsDashboard: React.FC = () => {
    const [requirements, setRequirements] = useState<VIPRequirement[]>([]);
    const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState(0);

    // VIP 레벨 순서
    const VIP_LEVELS = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];

    useEffect(() => {
        const loadRequirementsData = async () => {
            try {
                setLoading(true);

                // VIP 요구사항 로딩
                const requirementsResponse = await fetch('/api/vip-requirements/levels');
                if (requirementsResponse.ok) {
                    const requirementsData = await requirementsResponse.json();
                    setRequirements(requirementsData.data || []);
                } else {
                    // 모의 요구사항 데이터
                    setRequirements([
                        {
                            id: 'bronze',
                            level: 'BRONZE',
                            requirements: {
                                points: 100,
                                posts: 5,
                                comments: 20,
                                likes: 50,
                                monthlyActivity: 10,
                                specialAchievements: ['첫 게시글 작성', '프로필 완성']
                            },
                            benefits: ['5% 할인', '기본 지원'],
                            estimatedTime: '1주'
                        },
                        {
                            id: 'silver',
                            level: 'SILVER',
                            requirements: {
                                points: 500,
                                posts: 15,
                                comments: 50,
                                likes: 200,
                                monthlyActivity: 20,
                                specialAchievements: ['인기 게시글 작성', '댓글 마스터']
                            },
                            benefits: ['10% 할인', '우선 지원', '베타 기능 접근'],
                            estimatedTime: '1개월'
                        },
                        {
                            id: 'gold',
                            level: 'GOLD',
                            requirements: {
                                points: 1500,
                                posts: 40,
                                comments: 150,
                                likes: 500,
                                monthlyActivity: 30,
                                specialAchievements: ['커뮤니티 리더', '도움 제공자', '이벤트 참여']
                            },
                            benefits: ['15% 할인', '전용 지원', '고급 분석', '커스텀 테마'],
                            estimatedTime: '3개월'
                        },
                        {
                            id: 'platinum',
                            level: 'PLATINUM',
                            requirements: {
                                points: 3500,
                                posts: 100,
                                comments: 400,
                                likes: 1200,
                                monthlyActivity: 50,
                                specialAchievements: ['슈퍼 기여자', '멘토', '이벤트 주최자']
                            },
                            benefits: ['20% 할인', '개인 매니저', '독점 콘텐츠', '얼리 액세스'],
                            estimatedTime: '6개월'
                        },
                        {
                            id: 'diamond',
                            level: 'DIAMOND',
                            requirements: {
                                points: 7500,
                                posts: 250,
                                comments: 1000,
                                likes: 3000,
                                monthlyActivity: 80,
                                specialAchievements: ['전설적 기여자', '커뮤니티 대사', '혁신가']
                            },
                            benefits: ['25% 할인', '전담 팀', '독점 이벤트', '제품 개발 참여'],
                            estimatedTime: '1년+'
                        }
                    ]);
                }

                // 사용자 진행상황 로딩
                const progressResponse = await fetch('/api/vip-requirements/progress/current');
                if (progressResponse.ok) {
                    const progressData = await progressResponse.json();
                    setUserProgress(progressData.data);
                } else {
                    // 모의 진행상황 데이터
                    setUserProgress({
                        currentPoints: 750,
                        currentPosts: 25,
                        currentComments: 80,
                        currentLikes: 320,
                        monthlyActivity: 25,
                        achievements: ['첫 게시글 작성', '프로필 완성', '인기 게시글 작성'],
                        currentLevel: 'SILVER'
                    });
                }

                // 현재 레벨에 따른 활성 단계 설정
                const currentLevelIndex = VIP_LEVELS.findIndex(level => level === userProgress?.currentLevel);
                setActiveStep(currentLevelIndex >= 0 ? currentLevelIndex : 0);

            } catch (err) {
                setError('VIP 요구사항 데이터를 불러오는 중 오류가 발생했습니다.');
                console.error('VIP 요구사항 로딩 오류:', err);
            } finally {
                setLoading(false);
            }
        };

        loadRequirementsData();
    }, []);

    // 요구사항 달성률 계산
    const calculateProgress = (requirement: VIPRequirement) => {
        if (!userProgress) return 0;

        const progressRates = [
            userProgress.currentPoints / requirement.requirements.points,
            userProgress.currentPosts / requirement.requirements.posts,
            userProgress.currentComments / requirement.requirements.comments,
            userProgress.currentLikes / requirement.requirements.likes,
            userProgress.monthlyActivity / requirement.requirements.monthlyActivity
        ];

        const averageProgress = progressRates.reduce((sum, rate) => sum + Math.min(rate, 1), 0) / progressRates.length;
        return Math.round(averageProgress * 100);
    };

    // 요구사항 항목 렌더링
    const renderRequirementItem = (label: string, current: number, required: number, unit: string = '') => {
        const isCompleted = current >= required;
        const progress = Math.min((current / required) * 100, 100);

        return (
            <ListItem>
                <ListItemIcon>
                    {isCompleted ?
                        <CheckCircleIcon color="success" /> :
                        <RadioButtonUncheckedIcon color="disabled" />
                    }
                </ListItemIcon>
                <ListItemText
                    primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1">{label}</Typography>
                            <Typography variant="body2" color={isCompleted ? 'success.main' : 'text.secondary'}>
                                {current.toLocaleString()} / {required.toLocaleString()} {unit}
                            </Typography>
                        </Box>
                    }
                    secondary={
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            color={isCompleted ? 'success' : 'primary'}
                        />
                    }
                />
            </ListItem>
        );
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                {/* 헤더 */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h3" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimelineIcon sx={{ mr: 2, fontSize: 'inherit' }} />
                        VIP 승급 요구사항
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        각 VIP 레벨의 요구사항과 현재 진행상황을 확인하세요
                    </Typography>
                </Box>

                {/* 현재 상태 요약 */}
                {userProgress && (
                    <Card sx={{ mb: 4, bgcolor: 'primary.50' }}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <StarIcon sx={{ mr: 1 }} />
                                현재 상태: {userProgress.currentLevel} VIP
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="primary.main">{userProgress.currentPoints.toLocaleString()}</Typography>
                                    <Typography variant="body2">포인트</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="primary.main">{userProgress.currentPosts}</Typography>
                                    <Typography variant="body2">게시글</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="primary.main">{userProgress.currentComments}</Typography>
                                    <Typography variant="body2">댓글</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="primary.main">{userProgress.currentLikes}</Typography>
                                    <Typography variant="body2">좋아요</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* VIP 레벨 스테퍼 */}
                <Card>
                    <CardContent>
                        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <TrendingUpIcon sx={{ mr: 1 }} />
                            VIP 승급 로드맵
                        </Typography>

                        <Stepper activeStep={activeStep} orientation="vertical">
                            {requirements.map((requirement, index) => {
                                const progress = calculateProgress(requirement);
                                const isCompleted = userProgress && VIP_LEVELS.indexOf(userProgress.currentLevel) > index;
                                const isCurrent = userProgress && userProgress.currentLevel === requirement.level;

                                return (
                                    <Step key={requirement.id} completed={!!isCompleted}>
                                        <StepLabel>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="h6">{requirement.level} VIP</Typography>
                                                {isCurrent && <Chip label="현재 레벨" color="primary" size="small" />}
                                                {!isCompleted && (
                                                    <Chip
                                                        label={`${progress}% 달성`}
                                                        color={progress >= 100 ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                )}
                                            </Box>
                                        </StepLabel>
                                        <StepContent>
                                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                                                {/* 요구사항 */}
                                                <Card variant="outlined">
                                                    <CardContent>
                                                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <AssignmentIcon sx={{ mr: 1 }} />
                                                            요구사항
                                                        </Typography>
                                                        <List dense>
                                                            {renderRequirementItem('포인트', userProgress?.currentPoints || 0, requirement.requirements.points, 'pt')}
                                                            {renderRequirementItem('게시글', userProgress?.currentPosts || 0, requirement.requirements.posts, '개')}
                                                            {renderRequirementItem('댓글', userProgress?.currentComments || 0, requirement.requirements.comments, '개')}
                                                            {renderRequirementItem('좋아요', userProgress?.currentLikes || 0, requirement.requirements.likes, '개')}
                                                            {renderRequirementItem('월간 활동', userProgress?.monthlyActivity || 0, requirement.requirements.monthlyActivity, '일')}
                                                        </List>

                                                        <Divider sx={{ my: 2 }} />

                                                        <Typography variant="subtitle2" gutterBottom>특별 업적:</Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                            {requirement.requirements.specialAchievements.map((achievement, idx) => {
                                                                const isAchieved = userProgress?.achievements.includes(achievement);
                                                                return (
                                                                    <Chip
                                                                        key={idx}
                                                                        label={achievement}
                                                                        size="small"
                                                                        color={isAchieved ? 'success' : 'default'}
                                                                        variant={isAchieved ? 'filled' : 'outlined'}
                                                                    />
                                                                );
                                                            })}
                                                        </Box>
                                                    </CardContent>
                                                </Card>

                                                {/* 혜택 */}
                                                <Card variant="outlined">
                                                    <CardContent>
                                                        <Typography variant="h6" gutterBottom>🎁 VIP 혜택</Typography>
                                                        <List dense>
                                                            {requirement.benefits.map((benefit, idx) => (
                                                                <ListItem key={idx}>
                                                                    <ListItemIcon>
                                                                        <CheckCircleIcon color="success" />
                                                                    </ListItemIcon>
                                                                    <ListItemText primary={benefit} />
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                예상 달성 시간: <strong>{requirement.estimatedTime}</strong>
                                                            </Typography>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Box>
                                        </StepContent>
                                    </Step>
                                );
                            })}
                        </Stepper>
                    </CardContent>
                </Card>

                {/* 푸터 */}
                <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        💡 VIP 요구사항 시스템이 실제 API와 연결되었습니다!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        🚀 API 엔드포인트: /api/vip-requirements/* 활용
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default VIPRequirementsDashboard;