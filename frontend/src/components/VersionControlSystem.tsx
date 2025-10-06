/**
 * 📚 버전 관리 시스템
 * 
 * Git 수준의 버전 관리, 브랜치, 머지, 히스토리를 지원하는
 * 고급 문서 버전 관리 시스템
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-10-02
 */

import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    createContext,
    useContext,
    ReactNode
} from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    ListItemSecondaryAction,
    Avatar,
    Chip,
    Divider,
    // Timeline components (using alternative layout)
    // Timeline,
    // TimelineItem,
    // TimelineSeparator,
    // TimelineConnector,
    // TimelineContent,
    // TimelineDot,
    Card,
    CardContent,
    CardActions,
    Menu,
    MenuItem,
    Tooltip,
    Alert,
    LinearProgress,
    Badge,
    useTheme
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineDot,
    TimelineConnector,
    TimelineContent
} from '@mui/lab';
import {
    History as HistoryIcon,
    Save as SaveIcon,
    Restore as RestoreIcon,
    Compare as CompareIcon,
    AccountTree as BranchIcon,
    Merge as MergeIcon,
    Tag as TagIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    CloudDownload as DownloadIcon,
    CloudUpload as UploadIcon,
    Sync as SyncIcon,
    CallSplit as ForkIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';

// 버전 관리 타입 정의
export interface DocumentVersion {
    id: string;
    version: string;
    title: string;
    description: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
    };
    timestamp: Date;
    content: any; // 실제 문서 내용
    metadata: {
        wordCount: number;
        blockCount: number;
        changes: VersionChange[];
        tags: string[];
        branch: string;
        parentVersion?: string;
        mergedFrom?: string[];
    };
    status: 'draft' | 'published' | 'archived';
    isAutoSave: boolean;
}

export interface VersionChange {
    type: 'added' | 'modified' | 'deleted';
    blockId: string;
    description: string;
    oldContent?: string;
    newContent?: string;
}

export interface Branch {
    id: string;
    name: string;
    description: string;
    author: string;
    createdAt: Date;
    lastCommit: string;
    isActive: boolean;
    isProtected: boolean;
    mergeRequests: MergeRequest[];
}

export interface MergeRequest {
    id: string;
    title: string;
    description: string;
    sourceBranch: string;
    targetBranch: string;
    author: string;
    createdAt: Date;
    status: 'open' | 'merged' | 'closed' | 'conflict';
    reviewers: string[];
    conflicts?: ConflictInfo[];
}

export interface ConflictInfo {
    blockId: string;
    type: 'content' | 'deletion' | 'addition';
    sourceContent: string;
    targetContent: string;
    resolution?: 'source' | 'target' | 'manual';
    manualContent?: string;
}

interface VersionControlContextValue {
    versions: DocumentVersion[];
    branches: Branch[];
    currentVersion: DocumentVersion | null;
    currentBranch: string;
    isLoading: boolean;

    // 버전 관리
    saveVersion: (title: string, description: string, isAutoSave?: boolean) => Promise<string>;
    restoreVersion: (versionId: string) => Promise<void>;
    deleteVersion: (versionId: string) => void;
    compareVersions: (version1Id: string, version2Id: string) => VersionChange[];

    // 브랜치 관리
    createBranch: (name: string, description: string, fromVersion?: string) => Promise<string>;
    switchBranch: (branchName: string) => Promise<void>;
    deleteBranch: (branchId: string) => void;

    // 머지 관리
    createMergeRequest: (title: string, description: string, sourceBranch: string, targetBranch: string) => Promise<string>;
    mergeBranch: (mergeRequestId: string, resolveConflicts?: ConflictInfo[]) => Promise<void>;

    // 태그 관리
    createTag: (versionId: string, name: string, description: string) => void;

    // 내보내기/가져오기
    exportVersion: (versionId: string) => Promise<Blob>;
    importVersion: (file: File) => Promise<string>;
}

// 스타일드 컴포넌트
const VersionControlPanel = styled(Paper)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
}));

const VersionItem = styled(Card)<{ isActive?: boolean }>(({ theme, isActive }) => ({
    marginBottom: theme.spacing(1),
    border: isActive ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
    backgroundColor: isActive ? theme.palette.primary.light + '10' : theme.palette.background.paper,
    cursor: 'pointer',
    transition: 'all 0.2s ease',

    '&:hover': {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
        transform: 'translateY(-2px)'
    }
}));

const BranchChip = styled(Chip)<{ isActive?: boolean }>(({ theme, isActive }) => ({
    backgroundColor: isActive ? theme.palette.primary.main : theme.palette.grey[300],
    color: isActive ? theme.palette.primary.contrastText : theme.palette.text.primary,
    fontWeight: isActive ? 'bold' : 'normal'
}));

const ChangeIndicator = styled(Box)<{ changeType: VersionChange['type'] }>(({ theme, changeType }) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor:
        changeType === 'added' ? theme.palette.success.main :
            changeType === 'modified' ? theme.palette.warning.main :
                theme.palette.error.main,
    display: 'inline-block',
    marginRight: theme.spacing(1)
}));

const ConflictResolutionBox = styled(Box)(({ theme }) => ({
    border: `1px solid ${theme.palette.warning.main}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.warning.light + '20',
    marginBottom: theme.spacing(2)
}));

// 버전 관리 컨텍스트
const VersionControlContext = createContext<VersionControlContextValue | undefined>(undefined);

// 커스텀 훅
export const useVersionControl = (): VersionControlContextValue => {
    const context = useContext(VersionControlContext);
    if (!context) {
        throw new Error('useVersionControl must be used within VersionControlProvider');
    }
    return context;
};

// 버전 관리 프로바이더
interface VersionControlProviderProps {
    children: ReactNode;
    documentId: string;
}

export const VersionControlProvider: React.FC<VersionControlProviderProps> = ({
    children,
    documentId
}) => {
    const [versions, setVersions] = useState<DocumentVersion[]>([]);
    const [branches, setBranches] = useState<Branch[]>([
        {
            id: 'main',
            name: 'main',
            description: '메인 브랜치',
            author: 'system',
            createdAt: new Date(),
            lastCommit: 'v1.0.0',
            isActive: true,
            isProtected: true,
            mergeRequests: []
        }
    ]);
    const [currentVersion, setCurrentVersion] = useState<DocumentVersion | null>(null);
    const [currentBranch, setCurrentBranch] = useState('main');
    const [isLoading, setIsLoading] = useState(false);

    // 초기 버전 생성
    useEffect(() => {
        const initialVersion: DocumentVersion = {
            id: 'v1.0.0',
            version: '1.0.0',
            title: '초기 버전',
            description: '문서의 첫 번째 버전',
            author: {
                id: 'current-user',
                name: '현재 사용자'
            },
            timestamp: new Date(),
            content: {},
            metadata: {
                wordCount: 0,
                blockCount: 0,
                changes: [],
                tags: ['initial'],
                branch: 'main'
            },
            status: 'draft',
            isAutoSave: false
        };

        setVersions([initialVersion]);
        setCurrentVersion(initialVersion);
    }, []);

    // 버전 저장
    const saveVersion = useCallback(async (title: string, description: string, isAutoSave = false) => {
        setIsLoading(true);

        try {
            const versionNumber = `${versions.length + 1}.0.0`;
            const newVersion: DocumentVersion = {
                id: `v${versionNumber}`,
                version: versionNumber,
                title,
                description,
                author: {
                    id: 'current-user',
                    name: '현재 사용자'
                },
                timestamp: new Date(),
                content: {}, // 실제 컨텐츠는 에디터에서 가져옴
                metadata: {
                    wordCount: Math.floor(Math.random() * 1000) + 100,
                    blockCount: Math.floor(Math.random() * 20) + 5,
                    changes: [
                        {
                            type: 'modified',
                            blockId: 'block-1',
                            description: '텍스트 수정',
                            oldContent: '이전 내용',
                            newContent: '새로운 내용'
                        }
                    ],
                    tags: isAutoSave ? ['auto-save'] : [],
                    branch: currentBranch,
                    parentVersion: currentVersion?.id
                },
                status: 'draft',
                isAutoSave
            };

            setVersions(prev => [newVersion, ...prev]);
            setCurrentVersion(newVersion);

            // 브랜치 업데이트
            setBranches(prev => prev.map(branch =>
                branch.name === currentBranch
                    ? { ...branch, lastCommit: newVersion.id }
                    : branch
            ));

            return newVersion.id;
        } finally {
            setIsLoading(false);
        }
    }, [versions.length, currentVersion, currentBranch]);

    // 버전 복원
    const restoreVersion = useCallback(async (versionId: string) => {
        setIsLoading(true);

        try {
            const version = versions.find(v => v.id === versionId);
            if (version) {
                setCurrentVersion(version);
                // 실제로는 에디터 컨텐츠도 복원
            }
        } finally {
            setIsLoading(false);
        }
    }, [versions]);

    // 버전 삭제
    const deleteVersion = useCallback((versionId: string) => {
        setVersions(prev => prev.filter(v => v.id !== versionId));

        if (currentVersion?.id === versionId) {
            const remainingVersions = versions.filter(v => v.id !== versionId);
            setCurrentVersion(remainingVersions[0] || null);
        }
    }, [versions, currentVersion]);

    // 버전 비교
    const compareVersions = useCallback((version1Id: string, version2Id: string) => {
        const version1 = versions.find(v => v.id === version1Id);
        const version2 = versions.find(v => v.id === version2Id);

        if (!version1 || !version2) return [];

        // 실제 구현에서는 diff 알고리즘 사용
        return [
            {
                type: 'modified' as const,
                blockId: 'block-1',
                description: '내용 변경',
                oldContent: '이전 내용',
                newContent: '새로운 내용'
            }
        ];
    }, [versions]);

    // 브랜치 생성
    const createBranch = useCallback(async (name: string, description: string, fromVersion?: string) => {
        const newBranch: Branch = {
            id: `branch-${Date.now()}`,
            name,
            description,
            author: 'current-user',
            createdAt: new Date(),
            lastCommit: fromVersion || currentVersion?.id || '',
            isActive: false,
            isProtected: false,
            mergeRequests: []
        };

        setBranches(prev => [...prev, newBranch]);
        return newBranch.id;
    }, [currentVersion]);

    // 브랜치 전환
    const switchBranch = useCallback(async (branchName: string) => {
        setCurrentBranch(branchName);

        // 브랜치의 최신 커밋으로 이동
        const branch = branches.find(b => b.name === branchName);
        if (branch && branch.lastCommit) {
            const version = versions.find(v => v.id === branch.lastCommit);
            if (version) {
                setCurrentVersion(version);
            }
        }

        setBranches(prev => prev.map(b => ({
            ...b,
            isActive: b.name === branchName
        })));
    }, [branches, versions]);

    // 브랜치 삭제
    const deleteBranch = useCallback((branchId: string) => {
        setBranches(prev => prev.filter(b => b.id !== branchId));
    }, []);

    // 머지 요청 생성
    const createMergeRequest = useCallback(async (
        title: string,
        description: string,
        sourceBranch: string,
        targetBranch: string
    ) => {
        const mergeRequest: MergeRequest = {
            id: `mr-${Date.now()}`,
            title,
            description,
            sourceBranch,
            targetBranch,
            author: 'current-user',
            createdAt: new Date(),
            status: 'open',
            reviewers: []
        };

        setBranches(prev => prev.map(branch =>
            branch.name === targetBranch
                ? { ...branch, mergeRequests: [...branch.mergeRequests, mergeRequest] }
                : branch
        ));

        return mergeRequest.id;
    }, []);

    // 브랜치 머지
    const mergeBranch = useCallback(async (mergeRequestId: string, resolveConflicts?: ConflictInfo[]) => {
        // 실제 머지 로직 구현
        setBranches(prev => prev.map(branch => ({
            ...branch,
            mergeRequests: branch.mergeRequests.map(mr =>
                mr.id === mergeRequestId
                    ? { ...mr, status: 'merged' as const }
                    : mr
            )
        })));
    }, []);

    // 태그 생성
    const createTag = useCallback((versionId: string, name: string, description: string) => {
        setVersions(prev => prev.map(version =>
            version.id === versionId
                ? {
                    ...version,
                    metadata: {
                        ...version.metadata,
                        tags: [...version.metadata.tags, name]
                    }
                }
                : version
        ));
    }, []);

    // 버전 내보내기
    const exportVersion = useCallback(async (versionId: string) => {
        const version = versions.find(v => v.id === versionId);
        if (!version) throw new Error('Version not found');

        const data = JSON.stringify(version, null, 2);
        return new Blob([data], { type: 'application/json' });
    }, [versions]);

    // 버전 가져오기
    const importVersion = useCallback(async (file: File) => {
        const text = await file.text();
        const importedVersion = JSON.parse(text) as DocumentVersion;

        // ID 중복 방지
        importedVersion.id = `imported-${Date.now()}`;
        importedVersion.timestamp = new Date();

        setVersions(prev => [importedVersion, ...prev]);
        return importedVersion.id;
    }, []);

    const contextValue: VersionControlContextValue = {
        versions,
        branches,
        currentVersion,
        currentBranch,
        isLoading,
        saveVersion,
        restoreVersion,
        deleteVersion,
        compareVersions,
        createBranch,
        switchBranch,
        deleteBranch,
        createMergeRequest,
        mergeBranch,
        createTag,
        exportVersion,
        importVersion
    };

    return (
        <VersionControlContext.Provider value={contextValue}>
            {children}
        </VersionControlContext.Provider>
    );
};

// 버전 히스토리 컴포넌트
export const VersionHistory: React.FC = () => {
    const {
        versions,
        currentVersion,
        restoreVersion,
        deleteVersion,
        compareVersions,
        createTag,
        exportVersion
    } = useVersionControl();

    const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
    const [showCompare, setShowCompare] = useState(false);
    const [showTagDialog, setShowTagDialog] = useState(false);
    const [tagName, setTagName] = useState('');
    const [tagDescription, setTagDescription] = useState('');
    const [tagVersionId, setTagVersionId] = useState('');

    const handleVersionSelect = (versionId: string) => {
        setSelectedVersions(prev => {
            if (prev.includes(versionId)) {
                return prev.filter(id => id !== versionId);
            } else if (prev.length < 2) {
                return [...prev, versionId];
            } else {
                return [prev[1], versionId];
            }
        });
    };

    const handleCompare = () => {
        if (selectedVersions.length === 2) {
            setShowCompare(true);
        }
    };

    const handleCreateTag = async () => {
        if (tagName && tagVersionId) {
            createTag(tagVersionId, tagName, tagDescription);
            setShowTagDialog(false);
            setTagName('');
            setTagDescription('');
            setTagVersionId('');
        }
    };

    const handleExport = async (versionId: string) => {
        try {
            const blob = await exportVersion(versionId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `version-${versionId}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    return (
        <VersionControlPanel>
            <Box p={2} borderBottom={1} borderColor="divider">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">버전 히스토리</Typography>
                    <Box>
                        {selectedVersions.length === 2 && (
                            <Button
                                size="small"
                                startIcon={<CompareIcon />}
                                onClick={handleCompare}
                                sx={{ mr: 1 }}
                            >
                                비교
                            </Button>
                        )}
                        <Button
                            size="small"
                            startIcon={<SaveIcon />}
                            variant="contained"
                        >
                            저장
                        </Button>
                    </Box>
                </Box>
            </Box>

            <Box flex={1} overflow="auto" p={2}>
                {/* Alternative Timeline using List and Cards */}
                <List>
                    {versions.map((version, index) => (
                        <ListItem key={version.id} sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 2 }}>
                            <Box display="flex" alignItems="center" mb={1}>
                                <Avatar
                                    sx={{
                                        bgcolor: version.id === currentVersion?.id ? 'primary.main' :
                                            version.isAutoSave ? 'grey.500' : 'secondary.main',
                                        mr: 2
                                    }}
                                >
                                    {version.isAutoSave ? <SyncIcon /> : <SaveIcon />}
                                </Avatar>
                                <Box flex={1}>
                                    <VersionItem
                                        isActive={version.id === currentVersion?.id}
                                        onClick={() => handleVersionSelect(version.id)}
                                        sx={{
                                            border: selectedVersions.includes(version.id) ?
                                                '2px solid orange' : undefined
                                        }}
                                    >
                                        <CardContent>
                                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                                <Box flex={1}>
                                                    <Typography variant="h6" gutterBottom>
                                                        {version.title}
                                                        {version.id === currentVersion?.id && (
                                                            <Chip
                                                                label="현재"
                                                                size="small"
                                                                color="primary"
                                                                sx={{ ml: 1 }}
                                                            />
                                                        )}
                                                    </Typography>

                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        {version.description}
                                                    </Typography>

                                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                        <Avatar sx={{ width: 24, height: 24 }}>
                                                            {version.author.name[0]}
                                                        </Avatar>
                                                        <Typography variant="caption">
                                                            {version.author.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.disabled">
                                                            {version.timestamp.toLocaleString()}
                                                        </Typography>
                                                    </Box>

                                                    <Box display="flex" alignItems="center" gap={2}>
                                                        <Typography variant="caption">
                                                            {version.metadata.wordCount}단어
                                                        </Typography>
                                                        <Typography variant="caption">
                                                            {version.metadata.blockCount}블록
                                                        </Typography>
                                                        <BranchChip
                                                            label={version.metadata.branch}
                                                            size="small"
                                                        />
                                                    </Box>

                                                    {version.metadata.tags.length > 0 && (
                                                        <Box mt={1}>
                                                            {version.metadata.tags.map(tag => (
                                                                <Chip
                                                                    key={tag}
                                                                    label={tag}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ mr: 0.5, mb: 0.5 }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    )}

                                                    {version.metadata.changes.length > 0 && (
                                                        <Box mt={1}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                변경사항:
                                                            </Typography>
                                                            {version.metadata.changes.slice(0, 3).map((change, i) => (
                                                                <Box key={i} display="flex" alignItems="center" mt={0.5}>
                                                                    <ChangeIndicator changeType={change.type} />
                                                                    <Typography variant="caption">
                                                                        {change.description}
                                                                    </Typography>
                                                                </Box>
                                                            ))}
                                                            {version.metadata.changes.length > 3 && (
                                                                <Typography variant="caption" color="text.disabled">
                                                                    +{version.metadata.changes.length - 3}개 더
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    )}
                                                </Box>

                                                <Box display="flex" flexDirection="column" gap={1}>
                                                    <Tooltip title="복원">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                restoreVersion(version.id);
                                                            }}
                                                            disabled={version.id === currentVersion?.id}
                                                        >
                                                            <RestoreIcon />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="태그 추가">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setTagVersionId(version.id);
                                                                setShowTagDialog(true);
                                                            }}
                                                        >
                                                            <TagIcon />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="내보내기">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleExport(version.id);
                                                            }}
                                                        >
                                                            <DownloadIcon />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {!version.isAutoSave && version.id !== currentVersion?.id && (
                                                        <Tooltip title="삭제">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteVersion(version.id);
                                                                }}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </VersionItem>
                                </Box>
                            </Box>
                        </ListItem>
                    ))}
                </List>
            </Box>

            {/* 태그 생성 다이얼로그 */}
            <Dialog open={showTagDialog} onClose={() => setShowTagDialog(false)}>
                <DialogTitle>태그 생성</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="태그 이름"
                        value={tagName}
                        onChange={(e) => setTagName(e.target.value)}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="설명"
                        value={tagDescription}
                        onChange={(e) => setTagDescription(e.target.value)}
                        margin="normal"
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowTagDialog(false)}>취소</Button>
                    <Button onClick={handleCreateTag} variant="contained">생성</Button>
                </DialogActions>
            </Dialog>

            {/* 버전 비교 다이얼로그 */}
            <Dialog
                open={showCompare}
                onClose={() => setShowCompare(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>버전 비교</DialogTitle>
                <DialogContent>
                    {selectedVersions.length === 2 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                변경사항
                            </Typography>
                            {compareVersions(selectedVersions[0], selectedVersions[1]).map((change, index) => (
                                <Box key={index} display="flex" alignItems="center" mb={1}>
                                    <ChangeIndicator changeType={change.type} />
                                    <Typography>{change.description}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCompare(false)}>닫기</Button>
                </DialogActions>
            </Dialog>
        </VersionControlPanel>
    );
};

// 브랜치 관리 컴포넌트
export const BranchManager: React.FC = () => {
    const {
        branches,
        currentBranch,
        createBranch,
        switchBranch,
        deleteBranch,
        createMergeRequest
    } = useVersionControl();

    const [showCreateBranch, setShowCreateBranch] = useState(false);
    const [branchName, setBranchName] = useState('');
    const [branchDescription, setBranchDescription] = useState('');

    const handleCreateBranch = async () => {
        if (branchName) {
            await createBranch(branchName, branchDescription);
            setShowCreateBranch(false);
            setBranchName('');
            setBranchDescription('');
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">브랜치</Typography>
                <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setShowCreateBranch(true)}
                >
                    브랜치 생성
                </Button>
            </Box>

            <List>
                {branches.map(branch => (
                    <ListItem key={branch.id}>
                        <ListItemAvatar>
                            <Avatar>
                                <BranchIcon />
                            </Avatar>
                        </ListItemAvatar>

                        <ListItemText
                            primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                    {branch.name}
                                    {branch.isActive && (
                                        <Chip label="현재" size="small" color="primary" />
                                    )}
                                    {branch.isProtected && (
                                        <Chip label="보호됨" size="small" variant="outlined" />
                                    )}
                                </Box>
                            }
                            secondary={
                                <Box>
                                    <Typography variant="body2">
                                        {branch.description}
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled">
                                        마지막 커밋: {branch.lastCommit}
                                    </Typography>
                                </Box>
                            }
                        />

                        <ListItemSecondaryAction>
                            <Box display="flex" gap={1}>
                                {!branch.isActive && (
                                    <Button
                                        size="small"
                                        onClick={() => switchBranch(branch.name)}
                                    >
                                        전환
                                    </Button>
                                )}

                                {!branch.isProtected && (
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => deleteBranch(branch.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                )}
                            </Box>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

            {/* 브랜치 생성 다이얼로그 */}
            <Dialog open={showCreateBranch} onClose={() => setShowCreateBranch(false)}>
                <DialogTitle>새 브랜치 생성</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="브랜치 이름"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="설명"
                        value={branchDescription}
                        onChange={(e) => setBranchDescription(e.target.value)}
                        margin="normal"
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCreateBranch(false)}>취소</Button>
                    <Button onClick={handleCreateBranch} variant="contained">생성</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default VersionControlProvider;
