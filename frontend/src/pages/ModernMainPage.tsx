import React, { useState, useEffect } from 'react';
import ModernCard from '../components/ModernUI/ModernCard';
import ModernButton from '../components/ModernUI/ModernButton';
import ModernInput from '../components/ModernUI/ModernInput';
import { DesignSystem } from '../styles/design-system';

const ModernMainPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeCommunities: 0,
        postsToday: 0,
        onlineUsers: 0,
    });

    useEffect(() => {
        // 통계 데이터 로딩 시뮬레이션
        const loadStats = async () => {
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setStats({
                totalUsers: 12543,
                activeCommunities: 89,
                postsToday: 1247,
                onlineUsers: 342,
            });
            setIsLoading(false);
        };

        loadStats();
    }, []);

    const features = [
        {
            title: '커뮤니티 허브',
            description: '다양한 커뮤니티를 탐색하고 참여하세요',
            icon: '🏘️',
            color: DesignSystem.colors.primary[500],
            gradient: DesignSystem.colors.gradients.primary,
        },
        {
            title: '게임 센터',
            description: '멀티플레이어 게임과 리더보드를 즐기세요',
            icon: '🎮',
            color: DesignSystem.colors.secondary[500],
            gradient: DesignSystem.colors.gradients.secondary,
        },
        {
            title: 'VIP 대시보드',
            description: '프리미엄 사용자 전용 기능을 경험하세요',
            icon: '👑',
            color: DesignSystem.colors.accent.warning,
            gradient: DesignSystem.colors.gradients.warning,
        },
        {
            title: '스트리밍 스테이션',
            description: '실시간 스트리밍과 인터랙션을 즐기세요',
            icon: '📺',
            color: DesignSystem.colors.accent.error,
            gradient: DesignSystem.colors.gradients.error,
        },
    ];

    const recentActivities = [
        { user: 'Alice', action: '새 게시물을 작성했습니다', time: '2분 전', avatar: '👩' },
        { user: 'Bob', action: '게임에서 새로운 기록을 달성했습니다', time: '5분 전', avatar: '👨' },
        { user: 'Charlie', action: '커뮤니티에 가입했습니다', time: '10분 전', avatar: '🧑' },
        { user: 'Diana', action: 'VIP 멤버십을 구매했습니다', time: '15분 전', avatar: '👩‍💼' },
    ];

    return (
        <div
            style={{
                minHeight: '100vh',
                background: DesignSystem.colors.gradients.primary,
                padding: DesignSystem.spacing[6],
            }}
        >
            {/* Header */}
            <div
                style={{
                    textAlign: 'center',
                    marginBottom: DesignSystem.spacing[12],
                    color: 'white',
                }}
            >
                <h1
                    style={{
                        fontSize: DesignSystem.typography.fontSize['6xl'],
                        fontWeight: DesignSystem.typography.fontWeight.bold,
                        margin: 0,
                        marginBottom: DesignSystem.spacing[4],
                        background: 'linear-gradient(45deg, #ffffff, #f0f4ff)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Community Platform v3.0
                </h1>
                <p
                    style={{
                        fontSize: DesignSystem.typography.fontSize.xl,
                        opacity: 0.9,
                        margin: 0,
                    }}
                >
                    AUTOAGENTS 고도화 플랫폼 - 현대적 UI/UX
                </p>
            </div>

            {/* Search Bar */}
            <ModernCard
                variant="glass"
                padding="md"
                style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    marginBottom: DesignSystem.spacing[8],
                }}
            >
                <ModernInput
                    placeholder="커뮤니티, 게임, 사용자를 검색하세요..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    size="lg"
                    icon="🔍"
                    iconPosition="left"
                />
            </ModernCard>

            {/* Stats Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: DesignSystem.spacing[6],
                    marginBottom: DesignSystem.spacing[12],
                }}
            >
                {[
                    { label: '총 사용자', value: stats.totalUsers, icon: '👥', color: DesignSystem.colors.primary[500] },
                    { label: '활성 커뮤니티', value: stats.activeCommunities, icon: '🏘️', color: DesignSystem.colors.secondary[500] },
                    { label: '오늘 게시물', value: stats.postsToday, icon: '📝', color: DesignSystem.colors.accent.success },
                    { label: '온라인 사용자', value: stats.onlineUsers, icon: '🟢', color: DesignSystem.colors.accent.info },
                ].map((stat, index) => (
                    <ModernCard
                        key={index}
                        variant="glass"
                        padding="lg"
                        style={{
                            textAlign: 'center',
                            color: 'white',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '3rem',
                                marginBottom: DesignSystem.spacing[4],
                            }}
                        >
                            {stat.icon}
                        </div>
                        <div
                            style={{
                                fontSize: DesignSystem.typography.fontSize['4xl'],
                                fontWeight: DesignSystem.typography.fontWeight.bold,
                                marginBottom: DesignSystem.spacing[2],
                            }}
                        >
                            {isLoading ? '...' : stat.value.toLocaleString()}
                        </div>
                        <div
                            style={{
                                fontSize: DesignSystem.typography.fontSize.lg,
                                opacity: 0.9,
                            }}
                        >
                            {stat.label}
                        </div>
                    </ModernCard>
                ))}
            </div>

            {/* Features Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: DesignSystem.spacing[6],
                    marginBottom: DesignSystem.spacing[12],
                }}
            >
                {features.map((feature, index) => (
                    <ModernCard
                        key={index}
                        variant="elevated"
                        padding="lg"
                        style={{
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${feature.color}10, ${feature.color}05)`,
                        }}
                    >
                        <div
                            style={{
                                fontSize: '4rem',
                                marginBottom: DesignSystem.spacing[4],
                            }}
                        >
                            {feature.icon}
                        </div>
                        <h3
                            style={{
                                fontSize: DesignSystem.typography.fontSize['2xl'],
                                fontWeight: DesignSystem.typography.fontWeight.bold,
                                marginBottom: DesignSystem.spacing[3],
                                color: DesignSystem.colors.neutral[800],
                            }}
                        >
                            {feature.title}
                        </h3>
                        <p
                            style={{
                                fontSize: DesignSystem.typography.fontSize.base,
                                color: DesignSystem.colors.neutral[600],
                                marginBottom: DesignSystem.spacing[6],
                                lineHeight: DesignSystem.typography.lineHeight.relaxed,
                            }}
                        >
                            {feature.description}
                        </p>
                        <ModernButton
                            variant="primary"
                            size="md"
                            style={{
                                background: feature.gradient,
                                width: '100%',
                            }}
                        >
                            시작하기
                        </ModernButton>
                    </ModernCard>
                ))}
            </div>

            {/* Recent Activities */}
            <ModernCard
                variant="elevated"
                padding="lg"
                style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                }}
            >
                <h2
                    style={{
                        fontSize: DesignSystem.typography.fontSize['2xl'],
                        fontWeight: DesignSystem.typography.fontWeight.bold,
                        marginBottom: DesignSystem.spacing[6],
                        color: DesignSystem.colors.neutral[800],
                        textAlign: 'center',
                    }}
                >
                    최근 활동
                </h2>

                <div style={{ gap: DesignSystem.spacing[4] }}>
                    {recentActivities.map((activity, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: DesignSystem.spacing[4],
                                borderRadius: DesignSystem.borderRadius.lg,
                                background: DesignSystem.colors.neutral[50],
                                marginBottom: DesignSystem.spacing[3],
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = DesignSystem.colors.neutral[100];
                                e.currentTarget.style.transform = 'translateX(8px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = DesignSystem.colors.neutral[50];
                                e.currentTarget.style.transform = 'translateX(0)';
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '2rem',
                                    marginRight: DesignSystem.spacing[4],
                                }}
                            >
                                {activity.avatar}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontWeight: DesignSystem.typography.fontWeight.medium,
                                        color: DesignSystem.colors.neutral[800],
                                    }}
                                >
                                    {activity.user}
                                </div>
                                <div
                                    style={{
                                        color: DesignSystem.colors.neutral[600],
                                        fontSize: DesignSystem.typography.fontSize.sm,
                                    }}
                                >
                                    {activity.action}
                                </div>
                            </div>
                            <div
                                style={{
                                    color: DesignSystem.colors.neutral[400],
                                    fontSize: DesignSystem.typography.fontSize.sm,
                                }}
                            >
                                {activity.time}
                            </div>
                        </div>
                    ))}
                </div>
            </ModernCard>

            {/* Footer */}
            <div
                style={{
                    textAlign: 'center',
                    marginTop: DesignSystem.spacing[12],
                    color: 'white',
                    opacity: 0.8,
                }}
            >
                <p style={{ margin: 0 }}>
                    © 2025 Community Platform v3.0 - AUTOAGENTS 고도화 플랫폼
                </p>
            </div>
        </div>
    );
};

export default ModernMainPage;
