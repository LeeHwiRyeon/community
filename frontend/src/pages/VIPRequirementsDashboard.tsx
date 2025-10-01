import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Assignment as AssignmentIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Error as ErrorIcon,
    Refresh as RefreshIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Priority as PriorityIcon,
    Category as CategoryIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';

interface Requirement {
    id: string;
    userId: string;
    category: string;
    title: string;
    description: string;
    priority: {
        name: string;
        color: string;
        processingTime: number;
    };
    status: string;
    expectedDate?: string;
    budget?: number;
    contactInfo?: string;
    createdAt: string;
    assignedTo?: string;
    estimatedCompletion?: string;
    actualCompletion?: string;
    progress: number;
    notes: Array<{
        timestamp: string;
        message: string;
        type: string;
        data?: any;
    }>;
    updates: Array<{
        timestamp: string;
        message: string;
        agent: string;
    }>;
}

const VIPRequirementsDashboard: React.FC = () => {
    const [currentTab, setCurrentTab] = useState(0);
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openDetailDialog, setOpenDetailDialog] = useState(false);
    const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterPriority, setFilterPriority] = useState('');

    const [newRequirement, setNewRequirement] = useState({
        category: '',
        title: '',
        description: '',
        priority: 'MEDIUM',
        expectedDate: '',
        budget: '',
        contactInfo: ''
    });

    useEffect(() => {
        fetchRequirements();
    }, []);

    const fetchRequirements = async () => {
        try {
            setLoading(true);
            // 실제로는 사용자 ID를 동적으로 가져와야 함
            const userId = 'vip_user_001';

            const response = await fetch(`http://localhost:5000/api/vip-requirements/requirements/user/${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setRequirements(data.data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const handleCreateRequirement = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/vip-requirements/requirements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'vip_user_001',
                    ...newRequirement,
                    budget: newRequirement.budget ? parseInt(newRequirement.budget) : undefined
                })
            });

            if (response.ok) {
                const data = await response.json();
                setRequirements([data.data, ...requirements]);
                setOpenCreateDialog(false);
                setNewRequirement({
                    category: '',
                    title: '',
                    description: '',
                    priority: 'MEDIUM',
                    expectedDate: '',
                    budget: '',
                    contactInfo: ''
                });
            }
        } catch (e) {
            console.error('요구사항 생성 실패:', e);
        }
    };

    const handleViewRequirement = (requirement: Requirement) => {
        setSelectedRequirement(requirement);
        setOpenDetailDialog(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'default';
            case 'IN_PROGRESS': return 'primary';
            case 'COMPLETED': return 'success';
            case 'ERROR': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <ScheduleIcon />;
            case 'IN_PROGRESS': return <TimelineIcon />;
            case 'COMPLETED': return <CheckCircleIcon />;
            case 'ERROR': return <ErrorIcon />;
            default: return <ScheduleIcon />;
        }
    };

    const filteredRequirements = requirements.filter(req => {
        if (filterStatus && req.status !== filterStatus) return false;
        if (filterCategory && req.category !== filterCategory) return false;
        if (filterPriority && req.priority.name !== filterPriority) return false;
        return true;
    });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Error: {error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ mr: 1 }} />
                VIP 요구사항 관리
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card raised>
                        <CardContent>
                            <Typography variant="h6" component="h2">총 요구사항</Typography>
                            <Typography variant="h4">{requirements.length}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card raised>
                        <CardContent>
                            <Typography variant="h6" component="h2">진행 중</Typography>
                            <Typography variant="h4" color="primary.main">
                                {requirements.filter(r => r.status === 'IN_PROGRESS').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card raised>
                        <CardContent>
                            <Typography variant="h6" component="h2">완료</Typography>
                            <Typography variant="h4" color="success.main">
                                {requirements.filter(r => r.status === 'COMPLETED').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card raised>
                        <CardContent>
                            <Typography variant="h6" component="h2">완료율</Typography>
                            <Typography variant="h4" color="info.main">
                                {requirements.length > 0 ?
                                    Math.round((requirements.filter(r => r.status === 'COMPLETED').length / requirements.length) * 100) : 0}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Tabs value={currentTab} onChange={handleTabChange} aria-label="VIP requirements tabs" sx={{ mb: 3 }}>
                <Tab label="요구사항 목록" />
                <Tab label="진행 상황" />
                <Tab label="통계" />
            </Tabs>

            {/* 요구사항 목록 탭 */}
            {currentTab === 0 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5">요구사항 목록</Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>상태</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    label="상태"
                                >
                                    <MenuItem value="">전체</MenuItem>
                                    <MenuItem value="PENDING">대기</MenuItem>
                                    <MenuItem value="IN_PROGRESS">진행중</MenuItem>
                                    <MenuItem value="COMPLETED">완료</MenuItem>
                                    <MenuItem value="ERROR">오류</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>카테고리</InputLabel>
                                <Select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    label="카테고리"
                                >
                                    <MenuItem value="">전체</MenuItem>
                                    <MenuItem value="PRODUCT_REQUEST">상품 요청</MenuItem>
                                    <MenuItem value="FEATURE_REQUEST">기능 요청</MenuItem>
                                    <MenuItem value="CUSTOMIZATION">맞춤화</MenuItem>
                                    <MenuItem value="SUPPORT">지원</MenuItem>
                                    <MenuItem value="INTEGRATION">연동</MenuItem>
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setOpenCreateDialog(true)}
                            >
                                새 요구사항
                            </Button>
                            <IconButton onClick={fetchRequirements}>
                                <RefreshIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    <Grid container spacing={2}>
                        {filteredRequirements.map((requirement) => (
                            <Grid item key={requirement.id} xs={12} md={6} lg={4}>
                                <Card raised sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                                                {requirement.title}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Tooltip title="상세보기">
                                                    <IconButton size="small" onClick={() => handleViewRequirement(requirement)}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {requirement.description}
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                            <Chip
                                                icon={getStatusIcon(requirement.status)}
                                                label={requirement.status}
                                                color={getStatusColor(requirement.status)}
                                                size="small"
                                            />
                                            <Chip
                                                icon={<PriorityIcon />}
                                                label={requirement.priority.name}
                                                size="small"
                                                sx={{ backgroundColor: requirement.priority.color, color: 'white' }}
                                            />
                                            <Chip
                                                icon={<CategoryIcon />}
                                                label={requirement.category}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                진행률: {requirement.progress}%
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={requirement.progress}
                                                sx={{ height: 8, borderRadius: 4 }}
                                            />
                                        </Box>

                                        <Typography variant="caption" color="text.secondary">
                                            생성일: {new Date(requirement.createdAt).toLocaleDateString()}
                                        </Typography>

                                        {requirement.assignedTo && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                담당자: {requirement.assignedTo}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* 진행 상황 탭 */}
            {currentTab === 1 && (
                <Box>
                    <Typography variant="h5" gutterBottom>진행 상황</Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>제목</TableCell>
                                    <TableCell>상태</TableCell>
                                    <TableCell>진행률</TableCell>
                                    <TableCell>담당자</TableCell>
                                    <TableCell>예상 완료</TableCell>
                                    <TableCell>액션</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRequirements.map((requirement) => (
                                    <TableRow key={requirement.id}>
                                        <TableCell>{requirement.title}</TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={getStatusIcon(requirement.status)}
                                                label={requirement.status}
                                                color={getStatusColor(requirement.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 100 }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={requirement.progress}
                                                        sx={{ height: 6, borderRadius: 3 }}
                                                    />
                                                </Box>
                                                <Typography variant="body2">{requirement.progress}%</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{requirement.assignedTo || '-'}</TableCell>
                                        <TableCell>
                                            {requirement.estimatedCompletion ?
                                                new Date(requirement.estimatedCompletion).toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton size="small" onClick={() => handleViewRequirement(requirement)}>
                                                <VisibilityIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* 통계 탭 */}
            {currentTab === 2 && (
                <Box>
                    <Typography variant="h5" gutterBottom>통계</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>상태별 분포</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ERROR'].map((status) => {
                                            const count = requirements.filter(r => r.status === status).length;
                                            const percentage = requirements.length > 0 ? (count / requirements.length) * 100 : 0;
                                            return (
                                                <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography>{status}</Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ width: 200, height: 8, backgroundColor: 'grey.200', borderRadius: 1 }}>
                                                            <Box
                                                                sx={{
                                                                    width: `${percentage}%`,
                                                                    height: '100%',
                                                                    backgroundColor: status === 'COMPLETED' ? 'success.main' :
                                                                        status === 'IN_PROGRESS' ? 'primary.main' :
                                                                            status === 'ERROR' ? 'error.main' : 'grey.500',
                                                                    borderRadius: 1
                                                                }}
                                                            />
                                                        </Box>
                                                        <Typography variant="body2">{count}개 ({percentage.toFixed(1)}%)</Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>카테고리별 분포</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {['PRODUCT_REQUEST', 'FEATURE_REQUEST', 'CUSTOMIZATION', 'SUPPORT', 'INTEGRATION'].map((category) => {
                                            const count = requirements.filter(r => r.category === category).length;
                                            return (
                                                <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography>{category}</Typography>
                                                    <Typography variant="body2">{count}개</Typography>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* 새 요구사항 생성 다이얼로그 */}
            <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>새 요구사항 등록</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>카테고리</InputLabel>
                                <Select
                                    value={newRequirement.category}
                                    onChange={(e) => setNewRequirement({ ...newRequirement, category: e.target.value })}
                                    label="카테고리"
                                >
                                    <MenuItem value="PRODUCT_REQUEST">상품 요청</MenuItem>
                                    <MenuItem value="FEATURE_REQUEST">기능 요청</MenuItem>
                                    <MenuItem value="CUSTOMIZATION">맞춤화</MenuItem>
                                    <MenuItem value="SUPPORT">지원</MenuItem>
                                    <MenuItem value="INTEGRATION">연동</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>우선순위</InputLabel>
                                <Select
                                    value={newRequirement.priority}
                                    onChange={(e) => setNewRequirement({ ...newRequirement, priority: e.target.value })}
                                    label="우선순위"
                                >
                                    <MenuItem value="LOW">낮음</MenuItem>
                                    <MenuItem value="MEDIUM">보통</MenuItem>
                                    <MenuItem value="HIGH">높음</MenuItem>
                                    <MenuItem value="URGENT">긴급</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="제목"
                                value={newRequirement.title}
                                onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="설명"
                                multiline
                                rows={4}
                                value={newRequirement.description}
                                onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="예상 완료일"
                                type="date"
                                value={newRequirement.expectedDate}
                                onChange={(e) => setNewRequirement({ ...newRequirement, expectedDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="예산 (원)"
                                type="number"
                                value={newRequirement.budget}
                                onChange={(e) => setNewRequirement({ ...newRequirement, budget: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="연락처"
                                value={newRequirement.contactInfo}
                                onChange={(e) => setNewRequirement({ ...newRequirement, contactInfo: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreateDialog(false)}>취소</Button>
                    <Button variant="contained" onClick={handleCreateRequirement}>
                        등록
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 요구사항 상세 다이얼로그 */}
            <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="lg" fullWidth>
                <DialogTitle>{selectedRequirement?.title}</DialogTitle>
                <DialogContent>
                    {selectedRequirement && (
                        <Box>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1" gutterBottom>상태</Typography>
                                    <Chip
                                        icon={getStatusIcon(selectedRequirement.status)}
                                        label={selectedRequirement.status}
                                        color={getStatusColor(selectedRequirement.status)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1" gutterBottom>진행률</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 200 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={selectedRequirement.progress}
                                                sx={{ height: 8, borderRadius: 4 }}
                                            />
                                        </Box>
                                        <Typography variant="body2">{selectedRequirement.progress}%</Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Typography variant="subtitle1" gutterBottom>설명</Typography>
                            <Typography variant="body1" paragraph>
                                {selectedRequirement.description}
                            </Typography>

                            <Typography variant="subtitle1" gutterBottom>진행 기록</Typography>
                            <List>
                                {selectedRequirement.notes.map((note, index) => (
                                    <ListItem key={index}>
                                        <ListItemText
                                            primary={note.message}
                                            secondary={`${new Date(note.timestamp).toLocaleString()} - ${note.type}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetailDialog(false)}>닫기</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default VIPRequirementsDashboard;
