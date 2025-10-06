/**
 * 👥 커뮤니티 관리자 컴포넌트
 * 
 * 커뮤니티 생성, 관리, 멤버 관리, 활동 모니터링 기능
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Grid,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Avatar,
    Badge,
    Divider,
    Switch,
    FormControlLabel,
    LinearProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    People as PeopleIcon,
    Chat as ChatIcon,
    TrendingUp as TrendingIcon,
    AdminPanelSettings as AdminIcon,
    Block as BlockIcon,
    CheckCircle as ApproveIcon,
    Warning as WarningIcon,
    Group as GroupIcon,
    Forum as ForumIcon,
    Event as EventIcon
} from '@mui/icons-material';

interface Community {
    id: string;
    name: string;
    description: string;
    category: string;
    memberCount: number;
    postCount: number;
    createdAt: string;
    status: 'active' | 'inactive' | 'suspended';
    privacy: 'public' | 'private' | 'restricted';
    tags: string[];
    moderators: string[];
    rules: string[];
    featured: boolean;
    imageUrl?: string;
}

interface CommunityMember {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'moderator' | 'member';
    joinDate: string;
    lastActive: string;
    postCount: number;
    status: 'active' | 'banned' | 'pending';
    avatar?: string;
}

interface CommunityActivity {
    id: string;
    type: 'post' | 'comment' | 'join' | 'leave';
    user: string;
    community: string;
    content: string;
    timestamp: string;
    status: 'approved' | 'pending' | 'rejected';
}

const CommunityManager: React.FC = () => {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [members, setMembers] = useState<CommunityMember[]>([]);
    const [activities, setActivities] = useState<CommunityActivity[]>([]);
    const [selectedTab, setSelectedTab] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // 폼 상태
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        privacy: 'public' as 'public' | 'private' | 'restricted',
        tags: [] as string[],
        rules: [] as string[],
        featured: false,
        imageUrl: ''
    });

    // 초기 데이터 로드
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = () => {
        // 모의 커뮤니티 데이터
        const mockCommunities: Community[] = [
            {
                id: '1',
                name: '게임 개발자 커뮤니티',
                description: '게임 개발에 관심있는 개발자들의 모임',
                category: '개발',
                memberCount: 1250,
                postCount: 340,
                createdAt: '2024-12-01',
                status: 'active',
                privacy: 'public',
                tags: ['게임', '개발', '프로그래밍'],
                moderators: ['admin1', 'mod1'],
                rules: ['건전한 토론', '스팸 금지', '개발 관련 내용만'],
                featured: true,
                imageUrl: '/images/game-dev.jpg'
            },
            {
                id: '2',
                name: 'AI 연구소',
                description: '인공지능 연구 및 개발 커뮤니티',
                category: '연구',
                memberCount: 890,
                postCount: 156,
                createdAt: '2024-11-15',
                status: 'active',
                privacy: 'restricted',
                tags: ['AI', '머신러닝', '연구'],
                moderators: ['admin2'],
                rules: ['학술적 토론', '연구 자료 공유'],
                featured: false
            }
        ];

        // 모의 멤버 데이터
        const mockMembers: CommunityMember[] = [
            {
                id: '1',
                username: '개발자김',
                email: 'dev@example.com',
                role: 'admin',
                joinDate: '2024-12-01',
                lastActive: '2025-01-02',
                postCount: 45,
                status: 'active',
                avatar: '/avatars/dev-kim.jpg'
            },
            {
                id: '2',
                username: '게이머박',
                email: 'gamer@example.com',
                role: 'moderator',
                joinDate: '2024-12-05',
                lastActive: '2025-01-01',
                postCount: 23,
                status: 'active'
            },
            {
                id: '3',
                username: '스팸유저',
                email: 'spam@example.com',
                role: 'member',
                joinDate: '2024-12-20',
                lastActive: '2024-12-25',
                postCount: 0,
                status: 'banned'
            }
        ];

        // 모의 활동 데이터
        const mockActivities: CommunityActivity[] = [
            {
                id: '1',
                type: 'post',
                user: '개발자김',
                community: '게임 개발자 커뮤니티',
                content: '새로운 게임 엔진에 대한 포스트',
                timestamp: '2025-01-02T10:30:00Z',
                status: 'approved'
            },
            {
                id: '2',
                type: 'join',
                user: '신규유저',
                community: 'AI 연구소',
                content: '새로운 멤버 가입',
                timestamp: '2025-01-02T09:15:00Z',
                status: 'pending'
            }
        ];

        setCommunities(mockCommunities);
        setMembers(mockMembers);
        setActivities(mockActivities);
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue);
    };

    const handleOpenDialog = (community?: Community) => {
        if (community) {
            setEditingCommunity(community);
            setFormData({
                name: community.name,
                description: community.description,
                category: community.category,
                privacy: community.privacy,
                tags: community.tags,
                rules: community.rules,
                featured: community.featured,
                imageUrl: community.imageUrl || ''
            });
        } else {
            setEditingCommunity(null);
            setFormData({
                name: '',
                description: '',
                category: '',
                privacy: 'public',
                tags: [],
                rules: [],
                featured: false,
                imageUrl: ''
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingCommunity(null);
        setFormData({
            name: '',
            description: '',
            category: '',
            privacy: 'public',
            tags: [],
            rules: [],
            featured: false,
            imageUrl: ''
        });
    };

    const handleSaveCommunity = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (editingCommunity) {
                // 편집
                setCommunities(prev => prev.map(community =>
                    community.id === editingCommunity.id
                        ? { ...community, ...formData }
                        : community
                ));
                setAlert({ type: 'success', message: '커뮤니티가 성공적으로 수정되었습니다.' });
            } else {
                // 새로 생성
                const newCommunity: Community = {
                    id: Date.now().toString(),
                    ...formData,
                    memberCount: 0,
                    postCount: 0,
                    createdAt: new Date().toISOString().split('T')[0],
                    status: 'active',
                    moderators: []
                };
                setCommunities(prev => [newCommunity, ...prev]);
                setAlert({ type: 'success', message: '새 커뮤니티가 성공적으로 생성되었습니다.' });
            }

            handleCloseDialog();
        } catch (error) {
            setAlert({ type: 'error', message: '오류가 발생했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCommunity = async (id: string) => {
        if (window.confirm('정말로 이 커뮤니티를 삭제하시겠습니까?')) {
            setLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                setCommunities(prev => prev.filter(community => community.id !== id));
                setAlert({ type: 'success', message: '커뮤니티가 삭제되었습니다.' });
            } catch (error) {
                setAlert({ type: 'error', message: '삭제 중 오류가 발생했습니다.' });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleToggleStatus = async (id: string, status: 'active' | 'inactive' | 'suspended') => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            setCommunities(prev => prev.map(community =>
                community.id === id
                    ? { ...community, status }
                    : community
            ));
            setAlert({ type: 'success', message: '커뮤니티 상태가 변경되었습니다.' });
        } catch (error) {
            setAlert({ type: 'error', message: '상태 변경 중 오류가 발생했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    const handleMemberAction = async (memberId: string, action: 'ban' | 'unban' | 'promote' | 'demote') => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            setMembers(prev => prev.map(member => {
                if (member.id === memberId) {
                    switch (action) {
                        case 'ban':
                            return { ...member, status: 'banned' as const };
                        case 'unban':
                            return { ...member, status: 'active' as const };
                        case 'promote':
                            return { ...member, role: member.role === 'member' ? 'moderator' as const : 'admin' as const };
                        case 'demote':
                            return { ...member, role: member.role === 'admin' ? 'moderator' as const : 'member' as const };
                        default:
                            return member;
                    }
                }
                return member;
            }));

            setAlert({ type: 'success', message: '멤버 상태가 변경되었습니다.' });
        } catch (error) {
            setAlert({ type: 'error', message: '멤버 상태 변경 중 오류가 발생했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'inactive': return '#f59e0b';
            case 'suspended': return '#ef4444';
            case 'banned': return '#ef4444';
            case 'pending': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return '활성';
            case 'inactive': return '비활성';
            case 'suspended': return '정지됨';
            case 'banned': return '차단됨';
            case 'pending': return '대기중';
            default: return status;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return '#ef4444';
            case 'moderator': return '#f59e0b';
            case 'member': return '#3b82f6';
            default: return '#6b7280';
        }
    };

    const getRoleText = (role: string) => {
        switch (role) {
            case 'admin': return '관리자';
            case 'moderator': return '모더레이터';
            case 'member': return '멤버';
            default: return role;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3, color: '#2d3748' }}>
                👥 커뮤니티 관리자
            </Typography>

            {alert && (
                <Alert
                    severity={alert.type}
                    onClose={() => setAlert(null)}
                    sx={{ mb: 2 }}
                >
                    {alert.message}
                </Alert>
            )}

            <Paper sx={{ mb: 3 }}>
                <Tabs value={selectedTab} onChange={handleTabChange}>
                    <Tab label="커뮤니티 목록" />
                    <Tab label="멤버 관리" />
                    <Tab label="활동 모니터링" />
                    <Tab label="통계" />
                </Tabs>
            </Paper>

            {selectedTab === 0 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">커뮤니티 ({communities.length}개)</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                            sx={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                }
                            }}
                        >
                            새 커뮤니티 생성
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {communities.map((community) => (
                            <Box sx={{ flex: '1 1 300px', minWidth: 300 }} key={community.id}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    {community.imageUrl && (
                                        <Box
                                            sx={{
                                                height: 200,
                                                backgroundImage: `url(${community.imageUrl})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}
                                        />
                                    )}
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Chip
                                                label={community.category}
                                                size="small"
                                                sx={{ mr: 1 }}
                                            />
                                            <Chip
                                                label={getStatusText(community.status)}
                                                size="small"
                                                sx={{
                                                    backgroundColor: getStatusColor(community.status),
                                                    color: 'white',
                                                    mr: 1
                                                }}
                                            />
                                            {community.featured && (
                                                <Chip
                                                    label="추천"
                                                    size="small"
                                                    color="primary"
                                                    icon={<TrendingIcon />}
                                                />
                                            )}
                                        </Box>
                                        <Typography variant="h6" gutterBottom>
                                            {community.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {community.description}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                            {community.tags.map((tag, index) => (
                                                <Chip key={index} label={tag} size="small" variant="outlined" />
                                            ))}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <PeopleIcon fontSize="small" />
                                                {community.memberCount}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <ForumIcon fontSize="small" />
                                                {community.postCount}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AdminIcon fontSize="small" />
                                                {community.moderators.length}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small" startIcon={<ViewIcon />}>
                                            보기
                                        </Button>
                                        <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenDialog(community)}>
                                            편집
                                        </Button>
                                        <Button
                                            size="small"
                                            color={community.status === 'active' ? 'warning' : 'success'}
                                            onClick={() => handleToggleStatus(community.id, community.status === 'active' ? 'inactive' : 'active')}
                                        >
                                            {community.status === 'active' ? '비활성화' : '활성화'}
                                        </Button>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteCommunity(community.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {selectedTab === 1 && (
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                        멤버 관리
                    </Typography>
                    <List>
                        {members.map((member) => (
                            <React.Fragment key={member.id}>
                                <ListItem>
                                    <Avatar src={member.avatar} sx={{ mr: 2 }}>
                                        {member.username.charAt(0)}
                                    </Avatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle1">{member.username}</Typography>
                                                <Chip
                                                    label={getRoleText(member.role)}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: getRoleColor(member.role),
                                                        color: 'white'
                                                    }}
                                                />
                                                <Chip
                                                    label={getStatusText(member.status)}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: getStatusColor(member.status),
                                                        color: 'white'
                                                    }}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {member.email} • 가입일: {member.joinDate} • 마지막 활동: {member.lastActive}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    게시물: {member.postCount}개
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            {member.status === 'banned' ? (
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={() => handleMemberAction(member.id, 'unban')}
                                                >
                                                    <ApproveIcon />
                                                </IconButton>
                                            ) : (
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleMemberAction(member.id, 'ban')}
                                                >
                                                    <BlockIcon />
                                                </IconButton>
                                            )}
                                            {member.role !== 'admin' && (
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleMemberAction(member.id, 'promote')}
                                                >
                                                    <TrendingIcon />
                                                </IconButton>
                                            )}
                                            {member.role !== 'member' && (
                                                <IconButton
                                                    size="small"
                                                    color="warning"
                                                    onClick={() => handleMemberAction(member.id, 'demote')}
                                                >
                                                    <WarningIcon />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                    </List>
                </Box>
            )}

            {selectedTab === 2 && (
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                        활동 모니터링
                    </Typography>
                    <List>
                        {activities.map((activity) => (
                            <React.Fragment key={activity.id}>
                                <ListItem>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle1">
                                                    {activity.type === 'post' ? '📝 포스트' :
                                                        activity.type === 'comment' ? '💬 댓글' :
                                                            activity.type === 'join' ? '👋 가입' : '👋 탈퇴'}
                                                </Typography>
                                                <Chip
                                                    label={activity.status === 'approved' ? '승인됨' :
                                                        activity.status === 'pending' ? '대기중' : '거부됨'}
                                                    size="small"
                                                    color={activity.status === 'approved' ? 'success' :
                                                        activity.status === 'pending' ? 'warning' : 'error'}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    사용자: {activity.user} • 커뮤니티: {activity.community}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    내용: {activity.content}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    시간: {new Date(activity.timestamp).toLocaleString('ko-KR')}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        {activity.status === 'pending' && (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton size="small" color="success">
                                                    <ApproveIcon />
                                                </IconButton>
                                                <IconButton size="small" color="error">
                                                    <BlockIcon />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </ListItemSecondaryAction>
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                    </List>
                </Box>
            )}

            {selectedTab === 3 && (
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                        커뮤니티 통계
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h4" color="primary">
                                        {communities.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        총 커뮤니티 수
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h4" color="success.main">
                                        {communities.filter(c => c.status === 'active').length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        활성 커뮤니티
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h4" color="info.main">
                                        {communities.reduce((sum, community) => sum + community.memberCount, 0)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        총 멤버 수
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h4" color="warning.main">
                                        {activities.filter(a => a.status === 'pending').length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        대기 중인 활동
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* 커뮤니티 편집 다이얼로그 */}
            <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingCommunity ? '커뮤니티 편집' : '새 커뮤니티 생성'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label="커뮤니티 이름"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            sx={{ mb: 2 }}
                        />
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>카테고리</InputLabel>
                            <Select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            >
                                <MenuItem value="개발">개발</MenuItem>
                                <MenuItem value="연구">연구</MenuItem>
                                <MenuItem value="게임">게임</MenuItem>
                                <MenuItem value="기술">기술</MenuItem>
                                <MenuItem value="일반">일반</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>프라이버시</InputLabel>
                            <Select
                                value={formData.privacy}
                                onChange={(e) => setFormData(prev => ({ ...prev, privacy: e.target.value as any }))}
                            >
                                <MenuItem value="public">공개</MenuItem>
                                <MenuItem value="private">비공개</MenuItem>
                                <MenuItem value="restricted">제한적</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="설명"
                            multiline
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="이미지 URL"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                            sx={{ mb: 2 }}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.featured}
                                    onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                                />
                            }
                            label="추천 커뮤니티"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>취소</Button>
                    <Button
                        onClick={handleSaveCommunity}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? '저장 중...' : '저장'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CommunityManager;
