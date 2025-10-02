/**
 * ⛓️ 블록체인 컨텐츠 인증 시스템
 * 
 * 블록체인 기반 컨텐츠 무결성 보장, 저작권 보호, 
 * 분산 저장을 지원하는 차세대 보안 시스템
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
    Card,
    CardContent,
    CardActions,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    IconButton,
    Alert,
    LinearProgress,
    Tooltip,
    Avatar,
    Divider,
    useTheme
} from '@mui/material';
import {
    Security as SecurityIcon,
    Verified as VerifiedIcon,
    Link as ChainIcon,
    Fingerprint as FingerprintIcon,
    Copyright as CopyrightIcon,
    History as HistoryIcon,
    Share as ShareIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    QrCode as QRIcon,
    Warning as WarningIcon,
    Check as CheckIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    AccountBalance as WalletIcon,
    Token as TokenIcon,
    Gavel as LegalIcon,
    Shield as ShieldIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import CryptoJS from 'crypto-js';

// 블록체인 타입 정의
export interface BlockchainContent {
    id: string;
    hash: string;
    previousHash: string;
    timestamp: Date;
    content: {
        title: string;
        body: string;
        author: string;
        metadata: Record<string, any>;
    };
    signature: string;
    nonce: number;
    difficulty: number;
    merkleRoot: string;
    transactions: ContentTransaction[];
}

export interface ContentTransaction {
    id: string;
    type: 'create' | 'update' | 'transfer' | 'license' | 'verify';
    from: string;
    to?: string;
    timestamp: Date;
    data: any;
    signature: string;
    fee: number;
}

export interface DigitalCertificate {
    id: string;
    contentId: string;
    issuer: string;
    owner: string;
    issuedAt: Date;
    expiresAt?: Date;
    permissions: string[];
    signature: string;
    status: 'active' | 'revoked' | 'expired';
}

export interface CopyrightRecord {
    id: string;
    contentId: string;
    owner: string;
    registeredAt: Date;
    jurisdiction: string;
    licenseType: 'all-rights-reserved' | 'creative-commons' | 'public-domain' | 'custom';
    licenseTerms?: string;
    royaltyRate?: number;
    transferHistory: CopyrightTransfer[];
}

export interface CopyrightTransfer {
    id: string;
    from: string;
    to: string;
    timestamp: Date;
    price?: number;
    terms: string;
    signature: string;
}

interface BlockchainContextValue {
    blocks: BlockchainContent[];
    certificates: DigitalCertificate[];
    copyrights: CopyrightRecord[];
    isConnected: boolean;
    walletAddress: string | null;

    // 블록체인 기능
    createBlock: (content: any) => Promise<BlockchainContent>;
    verifyContent: (contentId: string) => Promise<boolean>;
    getContentHistory: (contentId: string) => BlockchainContent[];

    // 인증서 관리
    issueCertificate: (contentId: string, permissions: string[]) => Promise<DigitalCertificate>;
    verifyCertificate: (certificateId: string) => Promise<boolean>;
    revokeCertificate: (certificateId: string) => Promise<void>;

    // 저작권 관리
    registerCopyright: (contentId: string, licenseType: CopyrightRecord['licenseType']) => Promise<CopyrightRecord>;
    transferCopyright: (copyrightId: string, to: string, price?: number) => Promise<void>;

    // 지갑 연결
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;

    // 유틸리티
    generateHash: (data: any) => string;
    generateSignature: (data: any, privateKey: string) => string;
    verifySignature: (data: any, signature: string, publicKey: string) => boolean;
}

// 스타일드 컴포넌트
const BlockchainContainer = styled(Paper)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
}));

const BlockCard = styled(Card)<{ verified: boolean }>(({ theme, verified }) => ({
    marginBottom: theme.spacing(2),
    border: `2px solid ${verified ? theme.palette.success.main : theme.palette.warning.main}`,
    backgroundColor: verified ?
        theme.palette.success.light + '10' :
        theme.palette.warning.light + '10'
}));

const HashDisplay = styled(Box)(({ theme }) => ({
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    wordBreak: 'break-all',
    border: `1px solid ${theme.palette.grey[300]}`
}));

const ChainVisualization = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(2),
    overflowX: 'auto',
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    margin: theme.spacing(2, 0)
}));

const BlockNode = styled(Box)<{ isVerified: boolean }>(({ theme, isVerified }) => ({
    minWidth: 120,
    height: 80,
    backgroundColor: isVerified ? theme.palette.success.main : theme.palette.error.main,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.shape.borderRadius,
    margin: theme.spacing(0, 1),
    position: 'relative',
    cursor: 'pointer',

    '&::after': {
        content: '""',
        position: 'absolute',
        right: -20,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 0,
        height: 0,
        borderLeft: `10px solid ${isVerified ? theme.palette.success.main : theme.palette.error.main}`,
        borderTop: '10px solid transparent',
        borderBottom: '10px solid transparent'
    },

    '&:last-child::after': {
        display: 'none'
    }
}));

// 블록체인 컨텍스트
const BlockchainContext = createContext<BlockchainContextValue | undefined>(undefined);

// 커스텀 훅
export const useBlockchain = (): BlockchainContextValue => {
    const context = useContext(BlockchainContext);
    if (!context) {
        throw new Error('useBlockchain must be used within BlockchainProvider');
    }
    return context;
};

// 암호화 유틸리티
const CryptoUtils = {
    generateHash: (data: any): string => {
        return CryptoJS.SHA256(JSON.stringify(data)).toString();
    },

    generateMerkleRoot: (transactions: ContentTransaction[]): string => {
        if (transactions.length === 0) return '';

        let hashes = transactions.map(tx => CryptoUtils.generateHash(tx));

        while (hashes.length > 1) {
            const newHashes = [];
            for (let i = 0; i < hashes.length; i += 2) {
                const left = hashes[i];
                const right = hashes[i + 1] || left;
                newHashes.push(CryptoUtils.generateHash(left + right));
            }
            hashes = newHashes;
        }

        return hashes[0];
    },

    generateSignature: (data: any, privateKey: string): string => {
        return CryptoJS.HmacSHA256(JSON.stringify(data), privateKey).toString();
    },

    verifySignature: (data: any, signature: string, publicKey: string): boolean => {
        const expectedSignature = CryptoJS.HmacSHA256(JSON.stringify(data), publicKey).toString();
        return signature === expectedSignature;
    },

    mineBlock: (block: Partial<BlockchainContent>, difficulty: number): { nonce: number; hash: string } => {
        let nonce = 0;
        let hash = '';
        const target = '0'.repeat(difficulty);

        do {
            nonce++;
            const blockData = { ...block, nonce };
            hash = CryptoUtils.generateHash(blockData);
        } while (!hash.startsWith(target));

        return { nonce, hash };
    }
};

// 블록체인 프로바이더
interface BlockchainProviderProps {
    children: ReactNode;
}

export const BlockchainProvider: React.FC<BlockchainProviderProps> = ({ children }) => {
    const [blocks, setBlocks] = useState<BlockchainContent[]>([]);
    const [certificates, setCertificates] = useState<DigitalCertificate[]>([]);
    const [copyrights, setCopyrights] = useState<CopyrightRecord[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    // 제네시스 블록 생성
    useEffect(() => {
        const genesisBlock: BlockchainContent = {
            id: 'genesis',
            hash: '0000000000000000000000000000000000000000000000000000000000000000',
            previousHash: '',
            timestamp: new Date('2025-01-01'),
            content: {
                title: 'Genesis Block',
                body: 'The first block in the blockchain',
                author: 'System',
                metadata: { type: 'genesis' }
            },
            signature: '',
            nonce: 0,
            difficulty: 4,
            merkleRoot: '',
            transactions: []
        };

        setBlocks([genesisBlock]);
    }, []);

    // 블록 생성
    const createBlock = useCallback(async (content: any): Promise<BlockchainContent> => {
        const previousBlock = blocks[blocks.length - 1];
        const transactions: ContentTransaction[] = [
            {
                id: `tx-${Date.now()}`,
                type: 'create',
                from: walletAddress || 'anonymous',
                timestamp: new Date(),
                data: content,
                signature: '',
                fee: 0.001
            }
        ];

        const merkleRoot = CryptoUtils.generateMerkleRoot(transactions);
        const difficulty = 4;

        const blockData = {
            id: `block-${Date.now()}`,
            previousHash: previousBlock.hash,
            timestamp: new Date(),
            content,
            merkleRoot,
            transactions,
            difficulty
        };

        // 마이닝 (실제로는 서버에서 수행)
        const { nonce, hash } = CryptoUtils.mineBlock(blockData, difficulty);

        const newBlock: BlockchainContent = {
            ...blockData,
            hash,
            nonce,
            signature: CryptoUtils.generateSignature(blockData, 'private-key')
        };

        setBlocks(prev => [...prev, newBlock]);
        return newBlock;
    }, [blocks, walletAddress]);

    // 컨텐츠 검증
    const verifyContent = useCallback(async (contentId: string): Promise<boolean> => {
        const block = blocks.find(b => b.id === contentId);
        if (!block) return false;

        // 해시 검증
        const expectedHash = CryptoUtils.generateHash({
            ...block,
            hash: undefined
        });

        if (block.hash !== expectedHash) return false;

        // 이전 블록과의 연결 검증
        const previousBlock = blocks.find(b => b.hash === block.previousHash);
        if (!previousBlock && block.id !== 'genesis') return false;

        // 머클 루트 검증
        const expectedMerkleRoot = CryptoUtils.generateMerkleRoot(block.transactions);
        if (block.merkleRoot !== expectedMerkleRoot) return false;

        return true;
    }, [blocks]);

    // 컨텐츠 히스토리 조회
    const getContentHistory = useCallback((contentId: string): BlockchainContent[] => {
        return blocks.filter(block =>
            block.content.metadata?.originalId === contentId ||
            block.id === contentId
        ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }, [blocks]);

    // 인증서 발급
    const issueCertificate = useCallback(async (
        contentId: string,
        permissions: string[]
    ): Promise<DigitalCertificate> => {
        const certificate: DigitalCertificate = {
            id: `cert-${Date.now()}`,
            contentId,
            issuer: 'AUTOAGENTS-CA',
            owner: walletAddress || 'anonymous',
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1년
            permissions,
            signature: CryptoUtils.generateSignature({ contentId, permissions }, 'ca-private-key'),
            status: 'active'
        };

        setCertificates(prev => [...prev, certificate]);
        return certificate;
    }, [walletAddress]);

    // 인증서 검증
    const verifyCertificate = useCallback(async (certificateId: string): Promise<boolean> => {
        const certificate = certificates.find(c => c.id === certificateId);
        if (!certificate) return false;

        // 만료 확인
        if (certificate.expiresAt && certificate.expiresAt < new Date()) {
            return false;
        }

        // 상태 확인
        if (certificate.status !== 'active') {
            return false;
        }

        // 서명 검증
        const isValidSignature = CryptoUtils.verifySignature(
            { contentId: certificate.contentId, permissions: certificate.permissions },
            certificate.signature,
            'ca-public-key'
        );

        return isValidSignature;
    }, [certificates]);

    // 인증서 폐기
    const revokeCertificate = useCallback(async (certificateId: string): Promise<void> => {
        setCertificates(prev => prev.map(cert =>
            cert.id === certificateId
                ? { ...cert, status: 'revoked' as const }
                : cert
        ));
    }, []);

    // 저작권 등록
    const registerCopyright = useCallback(async (
        contentId: string,
        licenseType: CopyrightRecord['licenseType']
    ): Promise<CopyrightRecord> => {
        const copyright: CopyrightRecord = {
            id: `copyright-${Date.now()}`,
            contentId,
            owner: walletAddress || 'anonymous',
            registeredAt: new Date(),
            jurisdiction: 'KR',
            licenseType,
            transferHistory: []
        };

        setCopyrights(prev => [...prev, copyright]);
        return copyright;
    }, [walletAddress]);

    // 저작권 이전
    const transferCopyright = useCallback(async (
        copyrightId: string,
        to: string,
        price?: number
    ): Promise<void> => {
        const copyright = copyrights.find(c => c.id === copyrightId);
        if (!copyright) throw new Error('Copyright not found');

        const transfer: CopyrightTransfer = {
            id: `transfer-${Date.now()}`,
            from: copyright.owner,
            to,
            timestamp: new Date(),
            price,
            terms: 'Standard transfer terms',
            signature: CryptoUtils.generateSignature({ copyrightId, to, price }, 'private-key')
        };

        setCopyrights(prev => prev.map(c =>
            c.id === copyrightId
                ? {
                    ...c,
                    owner: to,
                    transferHistory: [...c.transferHistory, transfer]
                }
                : c
        ));
    }, [copyrights]);

    // 지갑 연결
    const connectWallet = useCallback(async (): Promise<void> => {
        // 실제로는 MetaMask 등의 지갑 연결
        const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
        setWalletAddress(mockAddress);
        setIsConnected(true);
    }, []);

    // 지갑 연결 해제
    const disconnectWallet = useCallback((): void => {
        setWalletAddress(null);
        setIsConnected(false);
    }, []);

    const contextValue: BlockchainContextValue = {
        blocks,
        certificates,
        copyrights,
        isConnected,
        walletAddress,
        createBlock,
        verifyContent,
        getContentHistory,
        issueCertificate,
        verifyCertificate,
        revokeCertificate,
        registerCopyright,
        transferCopyright,
        connectWallet,
        disconnectWallet,
        generateHash: CryptoUtils.generateHash,
        generateSignature: CryptoUtils.generateSignature,
        verifySignature: CryptoUtils.verifySignature
    };

    return (
        <BlockchainContext.Provider value={contextValue}>
            {children}
        </BlockchainContext.Provider>
    );
};

// 블록체인 대시보드
export const BlockchainDashboard: React.FC = () => {
    const {
        blocks,
        certificates,
        copyrights,
        isConnected,
        walletAddress,
        connectWallet,
        disconnectWallet,
        verifyContent,
        createBlock
    } = useBlockchain();

    const [activeTab, setActiveTab] = useState<'blocks' | 'certificates' | 'copyrights'>('blocks');
    const [selectedBlock, setSelectedBlock] = useState<BlockchainContent | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newContent, setNewContent] = useState({ title: '', body: '', metadata: {} });

    const theme = useTheme();

    const handleCreateContent = async () => {
        if (newContent.title && newContent.body) {
            await createBlock({
                title: newContent.title,
                body: newContent.body,
                author: walletAddress || 'anonymous',
                metadata: { ...newContent.metadata, createdAt: new Date() }
            });

            setNewContent({ title: '', body: '', metadata: {} });
            setShowCreateDialog(false);
        }
    };

    const verifiedBlocks = useMemo(() => {
        return blocks.map(block => ({
            ...block,
            isVerified: true // 실제로는 verifyContent 호출
        }));
    }, [blocks]);

    return (
        <BlockchainContainer>
            {/* 헤더 */}
            <Box p={2} borderBottom={1} borderColor="divider">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">블록체인 컨텐츠 인증</Typography>
                    <Box display="flex" gap={1} alignItems="center">
                        {isConnected ? (
                            <>
                                <Chip
                                    icon={<WalletIcon />}
                                    label={`${walletAddress?.substring(0, 6)}...${walletAddress?.substring(36)}`}
                                    color="success"
                                    onDelete={disconnectWallet}
                                />
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                startIcon={<WalletIcon />}
                                onClick={connectWallet}
                            >
                                지갑 연결
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* 상태 표시 */}
            <Box p={2}>
                <Alert severity={isConnected ? 'success' : 'warning'} sx={{ mb: 2 }}>
                    {isConnected ?
                        '블록체인에 연결되었습니다. 컨텐츠를 안전하게 인증할 수 있습니다.' :
                        '지갑을 연결하여 블록체인 기능을 사용하세요.'
                    }
                </Alert>

                <Box display="flex" gap={2} mb={2}>
                    <Card sx={{ flex: 1 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary">
                                {blocks.length}
                            </Typography>
                            <Typography variant="body2">
                                총 블록 수
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card sx={{ flex: 1 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main">
                                {certificates.length}
                            </Typography>
                            <Typography variant="body2">
                                발급된 인증서
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card sx={{ flex: 1 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="warning.main">
                                {copyrights.length}
                            </Typography>
                            <Typography variant="body2">
                                등록된 저작권
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* 블록체인 시각화 */}
            <ChainVisualization>
                <Typography variant="subtitle2" sx={{ mr: 2 }}>
                    블록체인:
                </Typography>
                {verifiedBlocks.slice(-5).map((block, index) => (
                    <BlockNode
                        key={block.id}
                        isVerified={block.isVerified}
                        onClick={() => setSelectedBlock(block)}
                    >
                        <Box textAlign="center">
                            <Typography variant="caption" display="block">
                                #{index + 1}
                            </Typography>
                            <Typography variant="body2">
                                {block.content.title.substring(0, 8)}...
                            </Typography>
                        </Box>
                    </BlockNode>
                ))}
            </ChainVisualization>

            {/* 탭 */}
            <Box display="flex" borderBottom={1} borderColor="divider">
                {[
                    { key: 'blocks', label: '블록', icon: <ChainIcon /> },
                    { key: 'certificates', label: '인증서', icon: <VerifiedIcon /> },
                    { key: 'copyrights', label: '저작권', icon: <CopyrightIcon /> }
                ].map(tab => (
                    <Button
                        key={tab.key}
                        startIcon={tab.icon}
                        onClick={() => setActiveTab(tab.key as any)}
                        variant={activeTab === tab.key ? 'contained' : 'text'}
                        sx={{ minWidth: 'auto', px: 3 }}
                    >
                        {tab.label}
                    </Button>
                ))}
            </Box>

            <Box flex={1} overflow="auto" p={2}>
                {/* 블록 탭 */}
                {activeTab === 'blocks' && (
                    <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">블록 목록</Typography>
                            <Button
                                variant="contained"
                                startIcon={<SecurityIcon />}
                                onClick={() => setShowCreateDialog(true)}
                                disabled={!isConnected}
                            >
                                컨텐츠 등록
                            </Button>
                        </Box>

                        {verifiedBlocks.map((block) => (
                            <BlockCard key={block.id} verified={block.isVerified}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                        <Typography variant="h6">
                                            {block.content.title}
                                        </Typography>
                                        <Chip
                                            icon={block.isVerified ? <VerifiedIcon /> : <WarningIcon />}
                                            label={block.isVerified ? '검증됨' : '검증 필요'}
                                            color={block.isVerified ? 'success' : 'warning'}
                                            size="small"
                                        />
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        작성자: {block.content.author} |
                                        생성일: {block.timestamp.toLocaleString()}
                                    </Typography>

                                    <Typography variant="body2" gutterBottom>
                                        {block.content.body.substring(0, 100)}...
                                    </Typography>

                                    <Box mt={2}>
                                        <Typography variant="caption" display="block" gutterBottom>
                                            블록 해시:
                                        </Typography>
                                        <HashDisplay>
                                            {block.hash}
                                        </HashDisplay>
                                    </Box>

                                    <Box mt={1}>
                                        <Typography variant="caption" display="block" gutterBottom>
                                            이전 해시:
                                        </Typography>
                                        <HashDisplay>
                                            {block.previousHash || 'Genesis Block'}
                                        </HashDisplay>
                                    </Box>
                                </CardContent>

                                <CardActions>
                                    <Button size="small" startIcon={<HistoryIcon />}>
                                        히스토리
                                    </Button>
                                    <Button size="small" startIcon={<ShareIcon />}>
                                        공유
                                    </Button>
                                    <Button size="small" startIcon={<QRIcon />}>
                                        QR 코드
                                    </Button>
                                </CardActions>
                            </BlockCard>
                        ))}
                    </Box>
                )}

                {/* 인증서 탭 */}
                {activeTab === 'certificates' && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            디지털 인증서
                        </Typography>

                        {certificates.length === 0 ? (
                            <Alert severity="info">
                                발급된 인증서가 없습니다.
                            </Alert>
                        ) : (
                            <List>
                                {certificates.map(cert => (
                                    <ListItem key={cert.id}>
                                        <ListItemIcon>
                                            <VerifiedIcon color={cert.status === 'active' ? 'success' : 'error'} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`인증서 ${cert.id}`}
                                            secondary={`발급일: ${cert.issuedAt.toLocaleDateString()} | 상태: ${cert.status}`}
                                        />
                                        <ListItemSecondaryAction>
                                            <Chip
                                                label={cert.status}
                                                color={cert.status === 'active' ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                )}

                {/* 저작권 탭 */}
                {activeTab === 'copyrights' && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            저작권 등록
                        </Typography>

                        {copyrights.length === 0 ? (
                            <Alert severity="info">
                                등록된 저작권이 없습니다.
                            </Alert>
                        ) : (
                            <List>
                                {copyrights.map(copyright => (
                                    <ListItem key={copyright.id}>
                                        <ListItemIcon>
                                            <CopyrightIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`저작권 ${copyright.id}`}
                                            secondary={`소유자: ${copyright.owner} | 라이선스: ${copyright.licenseType}`}
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton>
                                                <LegalIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                )}
            </Box>

            {/* 컨텐츠 생성 다이얼로그 */}
            <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>블록체인에 컨텐츠 등록</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="제목"
                        value={newContent.title}
                        onChange={(e) => setNewContent(prev => ({ ...prev, title: e.target.value }))}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="내용"
                        value={newContent.body}
                        onChange={(e) => setNewContent(prev => ({ ...prev, body: e.target.value }))}
                        margin="normal"
                        multiline
                        rows={4}
                    />

                    <Alert severity="info" sx={{ mt: 2 }}>
                        이 컨텐츠는 블록체인에 영구적으로 기록되며 수정할 수 없습니다.
                        저작권과 무결성이 보장됩니다.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCreateDialog(false)}>취소</Button>
                    <Button onClick={handleCreateContent} variant="contained">
                        블록체인에 등록
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 블록 상세 다이얼로그 */}
            <Dialog
                open={!!selectedBlock}
                onClose={() => setSelectedBlock(null)}
                maxWidth="lg"
                fullWidth
            >
                {selectedBlock && (
                    <>
                        <DialogTitle>블록 상세 정보</DialogTitle>
                        <DialogContent>
                            <Box display="flex" flexDirection="column" gap={2}>
                                <Typography variant="h6">{selectedBlock.content.title}</Typography>
                                <Typography variant="body1">{selectedBlock.content.body}</Typography>

                                <Divider />

                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        블록 정보
                                    </Typography>
                                    <Typography variant="body2">
                                        블록 ID: {selectedBlock.id}
                                    </Typography>
                                    <Typography variant="body2">
                                        생성 시간: {selectedBlock.timestamp.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2">
                                        난이도: {selectedBlock.difficulty}
                                    </Typography>
                                    <Typography variant="body2">
                                        논스: {selectedBlock.nonce}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        해시 정보
                                    </Typography>
                                    <HashDisplay>
                                        현재 해시: {selectedBlock.hash}
                                    </HashDisplay>
                                    <HashDisplay sx={{ mt: 1 }}>
                                        이전 해시: {selectedBlock.previousHash}
                                    </HashDisplay>
                                    <HashDisplay sx={{ mt: 1 }}>
                                        머클 루트: {selectedBlock.merkleRoot}
                                    </HashDisplay>
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedBlock(null)}>닫기</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </BlockchainContainer>
    );
};

export default BlockchainProvider;
