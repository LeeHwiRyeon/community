/**
 * 🏢 고급 커뮤니티 관리 시스템
 * 
 * 다중 커뮤니티 지원, 계층 구조, 고급 권한 관리
 * 실시간 모니터링, 자동화된 관리 기능
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-01-02
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, CardActions, Button,
    Chip, Avatar, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
    Tabs, Tab, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
    Switch, Slider, Alert, Snackbar, Tooltip, Badge, Divider,
    Accordion, AccordionSummary, AccordionDetails, Paper, Stack
} from '@mui/material';

import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Settings as SettingsIcon, People as PeopleIcon,
    Security as SecurityIcon, Analytics as AnalyticsIcon,
    ExpandMore as ExpandMoreIcon, Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon, Star as StarIcon,
    StarBorder as StarBorderIcon, Notifications as NotificationsIcon,
    Chat as ChatIcon, VideoCall as VideoCallIcon,
    Image as ImageIcon, AttachFile as AttachFileIcon
} from '@mui/icons-material';

// 타입 정의
interface Community {
    id: string;
    name: string;
    description: string;
    type: 'public' | 'private' | 'secret';
    category: string;
    memberCount: number;
    activeMembers: number;
    postsCount: number;
    createdAt: string;
    updatedAt: string;
    owner: {
        id: string;
        name: string;
        avatar: string;
    };
    moderators: Array<{
        id: string;
        name: string;
        avatar: string;
        permissions: string[];
    }>;
    settings: {
        allowGuestPosts: boolean;
        requireApproval: boolean;
        enableChat: boolean;
        enableVideo: boolean;
        enableFileUpload: boolean;
        maxFileSize: number;
        allowedFileTypes: string[];
        autoModeration: boolean;
        contentFiltering: boolean;
    };
    stats: {
        dailyActiveUsers: number;
        weeklyPosts: number;
        monthlyGrowth: number;
        engagementRate: number;
    };
    hierarchy?: {
        parentId?: string;
        children: string[];
        level: number;
    };
    tags: string[];
    isActive: boolean;
    isFeatured: boolean;
}

interface CommunityManagerProps {
    communities?: Community[];
    onCommunityUpdate?: (community: Community) => void;
    onCommunityCreate?: (community: Partial<Community>) => void;
    onCommunityDelete?: (communityId: string) => void;
}

const AdvancedCommunityManager: React.FC<CommunityManagerProps> = ({
    communities = [],
    onCommunityUpdate,
    onCommunityCreate,
    onCommunityDelete
}) => {
    const [selectedTab, setSelectedTab] = useState(0);
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

    // 새 커뮤니티 폼 상태
    const [newCommunity, setNewCommunity] = useState<Partial<Community>>({
        name: '',
        description: '',
        type: 'public',
        category: '',
        settings: {
            allowGuestPosts: true,
            requireApproval: false,
            enableChat: true,
            enableVideo: false,
            enableFileUpload: true,
            maxFileSize: 10,
            allowedFileTypes: ['jpg', 'png', 'pdf', 'doc'],
            autoModeration: true,
            contentFiltering: true
        }
    });

    // 커뮤니티 통계 계산
    const totalStats = communities.reduce((acc, community) => ({
        totalCommunities: acc.totalCommunities + 1,
        totalMembers: acc.totalMembers + community.memberCount,
        totalPosts: acc.totalPosts + community.postsCount,
        activeCommunities: acc.activeCommunities + (community.isActive ? 1 : 0)
    }), { totalCommunities: 0, totalMembers: 0, totalPosts: 0, activeCommunities: 0 });

    // 커뮤니티 생성
    const handleCreateCommunity = useCallback(() => {
        if (!newCommunity.name || !newCommunity.description) {
            setSnackbar({ open: true, message: '커뮤니티 이름과 설명을 입력해주세요.', severity: 'error' });
            return;
        }

        const community: Community = {
            id: `community_${Date.now()}`,
            name: newCommunity.name,
            description: newCommunity.description,
            type: newCommunity.type || 'public',
            category: newCommunity.category || 'general',
            memberCount: 0,
            activeMembers: 0,
            postsCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            owner: {
                id: 'current_user',
                name: 'Current User',
                avatar: '/avatars/default.jpg'
            },
            moderators: [],
            settings: newCommunity.settings || {
                allowGuestPosts: true,
                requireApproval: false,
                enableChat: true,
                enableVideo: false,
                enableFileUpload: true,
                maxFileSize: 10,
                allowedFileTypes: ['jpg', 'png', 'pdf', 'doc'],
                autoModeration: true,
                contentFiltering: true
            },
            stats: {
                dailyActiveUsers: 0,
                weeklyPosts: 0,
                monthlyGrowth: 0,
                engagementRate: 0
            },
            tags: [],
            isActive: true,
            isFeatured: false
        };

        onCommunityCreate?.(community);
        setSnackbar({ open: true, message: '커뮤니티가 성공적으로 생성되었습니다.', severity: 'success' });
        setIsCreateDialogOpen(false);
        setNewCommunity({
            name: '',
            description: '',
            type: 'public',
            category: '',
            settings: {
                allowGuestPosts: true,
                requireApproval: false,
                enableChat: true,
                enableVideo: false,
                enableFileUpload: true,
                maxFileSize: 10,
                allowedFileTypes: ['jpg', 'png', 'pdf', 'doc'],
                autoModeration: true,
                contentFiltering: true
            }
        });
    }, [newCommunity, onCommunityCreate]);

    // 커뮤니티 업데이트
    const handleUpdateCommunity = useCallback((community: Community) => {
        onCommunityUpdate?.(community);
        setSnackbar({ open: true, message: '커뮤니티가 성공적으로 업데이트되었습니다.', severity: 'success' });
        setIsEditDialogOpen(false);
    }, [onCommunityUpdate]);

    // 커뮤니티 삭제
    const handleDeleteCommunity = useCallback((communityId: string) => {
        if (window.confirm('정말로 이 커뮤니티를 삭제하시겠습니까?')) {
            onCommunityDelete?.(communityId);
            setSnackbar({ open: true, message: '커뮤니티가 삭제되었습니다.', severity: 'success' });
        }
    }, [onCommunityDelete]);

    // 커뮤니티 카드 컴포넌트
    const CommunityCard: React.FC<{ community: Community }> = ({ community }) => (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {community.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h2">
                            {community.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {community.category} • {community.type}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {community.isFeatured && <StarIcon color="warning" />}
                        <Chip
                            label={community.isActive ? '활성' : '비활성'}
                            color={community.isActive ? 'success' : 'default'}
                            size="small"
                        />
                    </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {community.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                            {community.memberCount.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            멤버
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="secondary">
                            {community.postsCount.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            게시글
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">
                            {community.stats.engagementRate.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            참여도
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {community.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" variant="outlined" />
                    ))}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                        {community.activeMembers}명 온라인
                    </Typography>
                </Box>
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box>
                    <IconButton
                        size="small"
                        onClick={() => {
                            setSelectedCommunity(community);
                            setIsEditDialogOpen(true);
                        }}
                    >
                        <EditIcon />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => {
                            setSelectedCommunity(community);
                            setIsSettingsDialogOpen(true);
                        }}
                    >
                        <SettingsIcon />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => handleDeleteCommunity(community.id)}
                        color="error"
                    >
                        <DeleteIcon />
                    </IconButton>
                </Box>
                <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                        setSelectedCommunity(community);
                        setSelectedTab(1);
                    }}
                >
                    관리
                </Button>
            </CardActions>
        </Card>
    );

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    🏢 고급 커뮤니티 관리 시스템
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setIsCreateDialogOpen(true)}
                >
                    새 커뮤니티 생성
                </Button>
            </Box>

            {/* 통계 카드 */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PeopleIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" color="primary">
                                        {totalStats.totalCommunities}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        총 커뮤니티
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
                <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ChatIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" color="secondary">
                                        {totalStats.totalMembers.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        총 멤버
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
                <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ImageIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" color="success.main">
                                        {totalStats.totalPosts.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        총 게시글
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
                <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AnalyticsIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" color="warning.main">
                                        {totalStats.activeCommunities}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        활성 커뮤니티
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* 탭 네비게이션 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
                    <Tab label="커뮤니티 목록" />
                    <Tab label="커뮤니티 관리" />
                    <Tab label="분석 및 인사이트" />
                    <Tab label="설정" />
                </Tabs>
            </Box>

            {/* 탭 컨텐츠 */}
            {selectedTab === 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {communities.map((community) => (
                        <Box key={community.id} sx={{ flex: '1 1 300px', minWidth: 300 }}>
                            <CommunityCard community={community} />
                        </Box>
                    ))}
                </Box>
            )}

            {selectedTab === 1 && selectedCommunity && (
                <Box>
                    <Typography variant="h5" gutterBottom>
                        {selectedCommunity.name} 관리
                    </Typography>
                    {/* 커뮤니티 관리 컨텐츠 */}
                </Box>
            )}

            {selectedTab === 2 && (
                <Box>
                    <Typography variant="h5" gutterBottom>
                        분석 및 인사이트
                    </Typography>
                    {/* 분석 컨텐츠 */}
                </Box>
            )}

            {selectedTab === 3 && (
                <Box>
                    <Typography variant="h5" gutterBottom>
                        시스템 설정
                    </Typography>
                    {/* 설정 컨텐츠 */}
                </Box>
            )}

            {/* 커뮤니티 생성 다이얼로그 */}
            <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>새 커뮤니티 생성</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            fullWidth
                            label="커뮤니티 이름"
                            value={newCommunity.name}
                            onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label="설명"
                            multiline
                            rows={3}
                            value={newCommunity.description}
                            onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>타입</InputLabel>
                                <Select
                                    value={newCommunity.type}
                                    onChange={(e) => setNewCommunity({ ...newCommunity, type: e.target.value as any })}
                                >
                                    <MenuItem value="public">공개</MenuItem>
                                    <MenuItem value="private">비공개</MenuItem>
                                    <MenuItem value="secret">비밀</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth
                                label="카테고리"
                                value={newCommunity.category}
                                onChange={(e) => setNewCommunity({ ...newCommunity, category: e.target.value })}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsCreateDialogOpen(false)}>취소</Button>
                    <Button onClick={handleCreateCommunity} variant="contained">생성</Button>
                </DialogActions>
            </Dialog>

            {/* 스낵바 */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdvancedCommunityManager;
