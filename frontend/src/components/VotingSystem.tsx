import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    Alert,
    CircularProgress,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Checkbox,
    FormGroup,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import {
    ThumbUp as ThumbUpIcon,
    ThumbDown as ThumbDownIcon,
    Poll as PollIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    BarChart as ResultsIcon
} from '@mui/icons-material';

// 투표 데이터 타입 정의
interface VotingOption {
    id: string;
    text: string;
    votes: number;
    percentage: number;
}

interface VotingPoll {
    id: string;
    title: string;
    description: string;
    type: 'single' | 'multiple' | 'rating' | 'ranking';
    status: 'draft' | 'active' | 'ended' | 'cancelled';
    allowAnonymous: boolean;
    allowMultipleVotes: boolean;
    maxSelections?: number;
    startDate: string;
    endDate?: string;
    totalVotes: number;
    options: VotingOption[];
    userVoted: boolean;
    userVotes?: string[];
    createdBy: string;
    createdAt: string;
}

interface SimpleVote {
    postId: string;
    upvotes: number;
    downvotes: number;
    userVote?: 'up' | 'down' | null;
}

interface VotingSystemProps {
    postId?: string;
    pollId?: string;
    type?: 'simple' | 'poll';
    showCreatePoll?: boolean;
}

const VotingSystem: React.FC<VotingSystemProps> = ({
    postId,
    pollId,
    type = 'simple',
    showCreatePoll = false
}) => {
    const [simpleVote, setSimpleVote] = useState<SimpleVote | null>(null);
    const [poll, setPoll] = useState<VotingPoll | null>(null);
    const [polls, setPolls] = useState<VotingPoll[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    // 새 투표 생성 폼
    const [newPoll, setNewPoll] = useState({
        title: '',
        description: '',
        type: 'single' as VotingPoll['type'],
        options: ['', ''],
        endDate: ''
    });

    useEffect(() => {
        if (type === 'simple' && postId) {
            loadSimpleVote();
        } else if (type === 'poll' && pollId) {
            loadPoll();
        } else if (showCreatePoll) {
            loadPolls();
        }
    }, [type, postId, pollId, showCreatePoll]);

    // 간단 투표 로딩
    const loadSimpleVote = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/voting/posts/${postId}/votes`);
            if (response.ok) {
                const data = await response.json();
                setSimpleVote(data.data);
            } else {
                // 모의 간단 투표 데이터
                setSimpleVote({
                    postId: postId!,
                    upvotes: 15,
                    downvotes: 3,
                    userVote: null
                });
            }
        } catch (err) {
            setError('투표 데이터를 불러오는 중 오류가 발생했습니다.');
            console.error('투표 로딩 오류:', err);
        } finally {
            setLoading(false);
        }
    };

    // 투표 폴 로딩
    const loadPoll = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/voting/polls/${pollId}`);
            if (response.ok) {
                const data = await response.json();
                setPoll(data.data);
                setShowResults(data.data.userVoted || data.data.status === 'ended');
            } else {
                // 모의 투표 폴 데이터
                const mockPoll: VotingPoll = {
                    id: pollId!,
                    title: '다음 커뮤니티 이벤트는?',
                    description: '다음 주에 진행할 커뮤니티 이벤트를 선택해주세요.',
                    type: 'single',
                    status: 'active',
                    allowAnonymous: true,
                    allowMultipleVotes: false,
                    startDate: '2024-10-01T00:00:00Z',
                    endDate: '2024-10-07T23:59:59Z',
                    totalVotes: 156,
                    options: [
                        { id: 'opt_1', text: '코스프레 콘테스트', votes: 89, percentage: 57 },
                        { id: 'opt_2', text: '게임 토너먼트', votes: 45, percentage: 29 },
                        { id: 'opt_3', text: '스트리밍 이벤트', votes: 22, percentage: 14 }
                    ],
                    userVoted: false,
                    createdBy: 'admin',
                    createdAt: '2024-10-01T00:00:00Z'
                };
                setPoll(mockPoll);
            }
        } catch (err) {
            setError('투표 데이터를 불러오는 중 오류가 발생했습니다.');
            console.error('투표 로딩 오류:', err);
        } finally {
            setLoading(false);
        }
    };

    // 투표 목록 로딩
    const loadPolls = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/voting/polls');
            if (response.ok) {
                const data = await response.json();
                setPolls(data.data || []);
            } else {
                // 모의 투표 목록 데이터
                setPolls([
                    {
                        id: 'poll_001',
                        title: '다음 커뮤니티 이벤트는?',
                        description: '다음 주에 진행할 커뮤니티 이벤트를 선택해주세요.',
                        type: 'single',
                        status: 'active',
                        allowAnonymous: true,
                        allowMultipleVotes: false,
                        startDate: '2024-10-01T00:00:00Z',
                        endDate: '2024-10-07T23:59:59Z',
                        totalVotes: 156,
                        options: [
                            { id: 'opt_1', text: '코스프레 콘테스트', votes: 89, percentage: 57 },
                            { id: 'opt_2', text: '게임 토너먼트', votes: 45, percentage: 29 },
                            { id: 'opt_3', text: '스트리밍 이벤트', votes: 22, percentage: 14 }
                        ],
                        userVoted: false,
                        createdBy: 'admin',
                        createdAt: '2024-10-01T00:00:00Z'
                    },
                    {
                        id: 'poll_002',
                        title: '새로운 기능 우선순위',
                        description: '다음에 개발할 기능의 우선순위를 정해주세요.',
                        type: 'multiple',
                        status: 'active',
                        allowAnonymous: false,
                        allowMultipleVotes: false,
                        maxSelections: 2,
                        startDate: '2024-10-02T00:00:00Z',
                        endDate: '2024-10-09T23:59:59Z',
                        totalVotes: 89,
                        options: [
                            { id: 'opt_4', text: '모바일 앱', votes: 67, percentage: 75 },
                            { id: 'opt_5', text: '다크 모드', votes: 45, percentage: 51 },
                            { id: 'opt_6', text: '알림 시스템', votes: 34, percentage: 38 },
                            { id: 'opt_7', text: '검색 개선', votes: 23, percentage: 26 }
                        ],
                        userVoted: true,
                        userVotes: ['opt_4', 'opt_5'],
                        createdBy: 'admin',
                        createdAt: '2024-10-02T00:00:00Z'
                    }
                ]);
            }
        } catch (err) {
            setError('투표 목록을 불러오는 중 오류가 발생했습니다.');
            console.error('투표 목록 로딩 오류:', err);
        } finally {
            setLoading(false);
        }
    };

    // 간단 투표 (좋아요/싫어요)
    const handleSimpleVote = async (voteType: 'up' | 'down') => {
        if (!simpleVote) return;

        try {
            const response = await fetch(`/api/voting/posts/${postId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: voteType })
            });

            if (response.ok) {
                await loadSimpleVote();
            } else {
                // 모의 투표 처리
                const newVote = { ...simpleVote };

                // 기존 투표 취소
                if (newVote.userVote === 'up') newVote.upvotes--;
                if (newVote.userVote === 'down') newVote.downvotes--;

                // 새 투표 적용
                if (newVote.userVote === voteType) {
                    newVote.userVote = null; // 같은 투표 클릭시 취소
                } else {
                    newVote.userVote = voteType;
                    if (voteType === 'up') newVote.upvotes++;
                    if (voteType === 'down') newVote.downvotes++;
                }

                setSimpleVote(newVote);
            }
        } catch (err) {
            console.error('투표 처리 오류:', err);
        }
    };

    // 투표 폴 투표
    const handlePollVote = async () => {
        if (!poll || selectedOptions.length === 0) return;

        try {
            const response = await fetch(`/api/voting/polls/${pollId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ options: selectedOptions })
            });

            if (response.ok) {
                await loadPoll();
                setSelectedOptions([]);
            }
        } catch (err) {
            console.error('투표 처리 오류:', err);
        }
    };

    // 새 투표 생성
    const createPoll = async () => {
        try {
            const pollData = {
                ...newPoll,
                options: newPoll.options.filter(opt => opt.trim() !== '')
            };

            const response = await fetch('/api/voting/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pollData)
            });

            if (response.ok) {
                await loadPolls();
                setCreateDialogOpen(false);
                setNewPoll({
                    title: '',
                    description: '',
                    type: 'single',
                    options: ['', ''],
                    endDate: ''
                });
            }
        } catch (err) {
            console.error('투표 생성 오류:', err);
        }
    };

    // 옵션 선택 처리
    const handleOptionSelect = (optionId: string) => {
        if (!poll) return;

        if (poll.type === 'single') {
            setSelectedOptions([optionId]);
        } else if (poll.type === 'multiple') {
            const maxSelections = poll.maxSelections || poll.options.length;
            if (selectedOptions.includes(optionId)) {
                setSelectedOptions(selectedOptions.filter(id => id !== optionId));
            } else if (selectedOptions.length < maxSelections) {
                setSelectedOptions([...selectedOptions, optionId]);
            }
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 1 }}>
                {error}
            </Alert>
        );
    }

    // 간단 투표 렌더링
    if (type === 'simple' && simpleVote) {
        const total = simpleVote.upvotes + simpleVote.downvotes;
        const upPercentage = total > 0 ? (simpleVote.upvotes / total) * 100 : 0;

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                    size="small"
                    startIcon={<ThumbUpIcon />}
                    onClick={() => handleSimpleVote('up')}
                    color={simpleVote.userVote === 'up' ? 'primary' : 'inherit'}
                    variant={simpleVote.userVote === 'up' ? 'contained' : 'outlined'}
                >
                    {simpleVote.upvotes}
                </Button>
                <Button
                    size="small"
                    startIcon={<ThumbDownIcon />}
                    onClick={() => handleSimpleVote('down')}
                    color={simpleVote.userVote === 'down' ? 'error' : 'inherit'}
                    variant={simpleVote.userVote === 'down' ? 'contained' : 'outlined'}
                >
                    {simpleVote.downvotes}
                </Button>
                {total > 0 && (
                    <Typography variant="caption" color="text.secondary">
                        ({upPercentage.toFixed(0)}% 긍정)
                    </Typography>
                )}
            </Box>
        );
    }

    // 투표 폴 렌더링
    if (type === 'poll' && poll) {
        return (
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                            <PollIcon sx={{ mr: 1 }} />
                            {poll.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                                label={poll.status}
                                color={poll.status === 'active' ? 'success' : 'default'}
                                size="small"
                            />
                            <Chip
                                label={`${poll.totalVotes} 투표`}
                                variant="outlined"
                                size="small"
                            />
                        </Box>
                    </Box>

                    {poll.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {poll.description}
                        </Typography>
                    )}

                    {poll.endDate && (
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                            마감: {new Date(poll.endDate).toLocaleDateString('ko-KR')}
                        </Typography>
                    )}

                    {showResults ? (
                        // 결과 표시
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>투표 결과</Typography>
                            {poll.options.map((option) => (
                                <Box key={option.id} sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2">{option.text}</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {option.votes}표 ({option.percentage}%)
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={option.percentage}
                                        sx={{ height: 8, borderRadius: 4 }}
                                    />
                                </Box>
                            ))}
                            {poll.userVoted && (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    투표에 참여해주셔서 감사합니다!
                                </Alert>
                            )}
                        </Box>
                    ) : (
                        // 투표 폼
                        <Box>
                            <FormControl component="fieldset" fullWidth>
                                <FormLabel component="legend">옵션을 선택하세요</FormLabel>
                                {poll.type === 'single' ? (
                                    <RadioGroup
                                        value={selectedOptions[0] || ''}
                                        onChange={(e) => setSelectedOptions([e.target.value])}
                                    >
                                        {poll.options.map((option) => (
                                            <FormControlLabel
                                                key={option.id}
                                                value={option.id}
                                                control={<Radio />}
                                                label={option.text}
                                            />
                                        ))}
                                    </RadioGroup>
                                ) : (
                                    <FormGroup>
                                        {poll.options.map((option) => (
                                            <FormControlLabel
                                                key={option.id}
                                                control={
                                                    <Checkbox
                                                        checked={selectedOptions.includes(option.id)}
                                                        onChange={() => handleOptionSelect(option.id)}
                                                    />
                                                }
                                                label={option.text}
                                            />
                                        ))}
                                    </FormGroup>
                                )}
                            </FormControl>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<ViewIcon />}
                                    onClick={() => setShowResults(true)}
                                >
                                    결과 보기
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handlePollVote}
                                    disabled={selectedOptions.length === 0}
                                >
                                    투표하기
                                </Button>
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>
        );
    }

    // 투표 목록 렌더링
    if (showCreatePoll) {
        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                        <PollIcon sx={{ mr: 1 }} />
                        투표 관리
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        새 투표 생성
                    </Button>
                </Box>

                <List>
                    {polls.map((pollItem, index) => (
                        <React.Fragment key={pollItem.id}>
                            <ListItem>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Typography variant="h6">{pollItem.title}</Typography>
                                            <Chip
                                                label={pollItem.status}
                                                color={pollItem.status === 'active' ? 'success' : 'default'}
                                                size="small"
                                            />
                                            <Chip
                                                label={`${pollItem.totalVotes} 투표`}
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                {pollItem.description}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                생성일: {new Date(pollItem.createdAt).toLocaleDateString('ko-KR')}
                                                {pollItem.endDate && ` • 마감: ${new Date(pollItem.endDate).toLocaleDateString('ko-KR')}`}
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <IconButton>
                                    <ResultsIcon />
                                </IconButton>
                            </ListItem>
                            {index < polls.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>

                {/* 투표 생성 다이얼로그 */}
                <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>새 투표 생성</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <TextField
                                fullWidth
                                label="투표 제목"
                                value={newPoll.title}
                                onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                            />

                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="투표 설명"
                                value={newPoll.description}
                                onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                            />

                            <FormControl fullWidth>
                                <FormLabel>투표 유형</FormLabel>
                                <RadioGroup
                                    value={newPoll.type}
                                    onChange={(e) => setNewPoll({ ...newPoll, type: e.target.value as VotingPoll['type'] })}
                                    row
                                >
                                    <FormControlLabel value="single" control={<Radio />} label="단일 선택" />
                                    <FormControlLabel value="multiple" control={<Radio />} label="다중 선택" />
                                </RadioGroup>
                            </FormControl>

                            <Box>
                                <Typography variant="subtitle2" gutterBottom>투표 옵션</Typography>
                                {newPoll.options.map((option, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder={`옵션 ${index + 1}`}
                                            value={option}
                                            onChange={(e) => {
                                                const newOptions = [...newPoll.options];
                                                newOptions[index] = e.target.value;
                                                setNewPoll({ ...newPoll, options: newOptions });
                                            }}
                                        />
                                        {newPoll.options.length > 2 && (
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const newOptions = newPoll.options.filter((_, i) => i !== index);
                                                    setNewPoll({ ...newPoll, options: newOptions });
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </Box>
                                ))}
                                <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })}
                                >
                                    옵션 추가
                                </Button>
                            </Box>

                            <TextField
                                fullWidth
                                type="datetime-local"
                                label="마감일 (선택사항)"
                                value={newPoll.endDate}
                                onChange={(e) => setNewPoll({ ...newPoll, endDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCreateDialogOpen(false)}>취소</Button>
                        <Button variant="contained" onClick={createPoll}>생성</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    }

    return null;
};

export default VotingSystem;
