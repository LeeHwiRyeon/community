/**
 * 💬 채팅 기반 커뮤니티 시스템
 * 
 * 실시간 채팅으로 커뮤니티를 생성하고 관리하는 시스템
 * VIP 등급별 시크릿 페이지 접근 제어
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Avatar,
    Chip,
    Card,
    CardContent,
    CardActions,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Badge,
    Tooltip,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Send as SendIcon,
    Chat as ChatIcon,
    Groups as GroupsIcon,
    Star as StarIcon,
    Lock as LockIcon,
    Download as DownloadIcon,
    CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
    Psychology as AIIcon,
    Person as PersonIcon,
    Diamond as DiamondIcon,
    EmojiEvents as TrophyIcon,
    Security as SecurityIcon
} from '@mui/icons-material';

// 타입 정의
interface ChatMessage {
    id: string;
    userId: string;
    message: string;
    timestamp: Date;
    type: 'user' | 'ai' | 'system';
    communitySuggestions?: CommunitySuggestion[];
    userLevel: VIPLevel;
}

interface CommunitySuggestion {
    id: string;
    name: string;
    description: string;
    category: string;
    memberCount: number;
    isNew: boolean;
    vipLevel: VIPLevel;
    isSecret: boolean;
}

interface VIPLevel {
    level: 'normal' | 'vip' | 'premium' | 'diamond' | 'platinum';
    name: string;
    price: number;
    color: string;
    icon: React.ReactNode;
}

interface SecretPage {
    id: string;
    name: string;
    description: string;
    requiredLevel: VIPLevel['level'];
    content: string;
    features: string[];
}

const ChatBasedCommunity: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [currentUserLevel, setCurrentUserLevel] = useState<VIPLevel>({
        level: 'normal',
        name: '일반 사용자',
        price: 0,
        color: '#9e9e9e',
        icon: <PersonIcon />
    });
    const [suggestedCommunities, setSuggestedCommunities] = useState<CommunitySuggestion[]>([]);
    const [fixedCommunities, setFixedCommunities] = useState<CommunitySuggestion[]>([]);
    const [isAITyping, setIsAITyping] = useState(false);
    const [showSecretPages, setShowSecretPages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // VIP 등급 정의
    const vipLevels: VIPLevel[] = [
        { level: 'normal', name: '일반 사용자', price: 0, color: '#9e9e9e', icon: <PersonIcon /> },
        { level: 'vip', name: 'VIP', price: 9900, color: '#2196F3', icon: <StarIcon /> },
        { level: 'premium', name: 'Premium', price: 19900, color: '#9C27B0', icon: <TrophyIcon /> },
        { level: 'diamond', name: 'Diamond', price: 49900, color: '#00BCD4', icon: <DiamondIcon /> },
        { level: 'platinum', name: 'Platinum', price: 99900, color: '#FF9800', icon: <SecurityIcon /> }
    ];

    // 시크릿 페이지 정의
    const secretPages: SecretPage[] = [
        {
            id: 'vip-games',
            name: 'VIP 게임 라운지',
            description: 'VIP 전용 게임 커뮤니티',
            requiredLevel: 'vip',
            content: '고급 게임 토론 및 전용 이벤트',
            features: ['전용 게임 리뷰', '개발자 인터뷰', '베타 테스트']
        },
        {
            id: 'premium-cosplay',
            name: 'Premium 코스프레 갤러리',
            description: '프리미엄 코스프레 작품 전시',
            requiredLevel: 'premium',
            content: '고품질 코스프레 작품 및 튜토리얼',
            features: ['HD 갤러리', '전문가 튜토리얼', '의상 제작 가이드']
        },
        {
            id: 'diamond-secrets',
            name: 'Diamond 시크릿 랩',
            description: '다이아몬드 전용 비밀 공간',
            requiredLevel: 'diamond',
            content: '최고급 콘텐츠 및 독점 정보',
            features: ['독점 뉴스', '개발자 미팅', '커스텀 기능']
        },
        {
            id: 'platinum-exclusive',
            name: 'Platinum 독점 공간',
            description: '플래티넘 파트너 전용 공간',
            requiredLevel: 'platinum',
            content: '최고 수준의 독점 콘텐츠',
            features: ['파트너 혜택', '수익 공유', '브랜드 협업']
        }
    ];

    // 스크롤을 맨 아래로
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // AI 응답 시뮬레이션
    const generateAIResponse = (userMessage: string): { message: string; suggestions: CommunitySuggestion[] } => {
        const lowerMessage = userMessage.toLowerCase();

        // MMORPG 관련 응답
        if (lowerMessage.includes('mmorpg') || lowerMessage.includes('mmo')) {
            return {
                message: "뭐해보셨어요? 어떤 장르를 좋아하시나요?",
                suggestions: [
                    {
                        id: 'wow-community',
                        name: '월드 오브 워크래프트',
                        description: '클래식부터 리테일까지 모든 WoW 토론',
                        category: 'MMORPG',
                        memberCount: 15420,
                        isNew: false,
                        vipLevel: 'normal',
                        isSecret: false
                    },
                    {
                        id: 'ffxiv-community',
                        name: '파이널 판타지 XIV',
                        description: 'FFXIV 레이드, 길드, 스토리 토론',
                        category: 'MMORPG',
                        memberCount: 12890,
                        isNew: false,
                        vipLevel: 'normal',
                        isSecret: false
                    },
                    {
                        id: 'vip-games-lounge',
                        name: 'VIP 게임 라운지',
                        description: 'VIP 전용 게임 커뮤니티',
                        category: 'VIP',
                        memberCount: 2560,
                        isNew: true,
                        vipLevel: 'vip',
                        isSecret: true
                    }
                ]
            };
        }

        // 코스프레 관련 응답
        if (lowerMessage.includes('코스프레') || lowerMessage.includes('의상')) {
            return {
                message: "코스프레 의상 정보를 찾고 계시는군요! 어떤 캐릭터를 코스프레하실 건가요?",
                suggestions: [
                    {
                        id: 'cosplay-general',
                        name: '코스프레 일반',
                        description: '코스프레 작품 공유 및 정보',
                        category: 'Cosplay',
                        memberCount: 8750,
                        isNew: false,
                        vipLevel: 'normal',
                        isSecret: false
                    },
                    {
                        id: 'premium-cosplay-gallery',
                        name: 'Premium 코스프레 갤러리',
                        description: '프리미엄 코스프레 작품 전시',
                        category: 'Premium',
                        memberCount: 1890,
                        isNew: true,
                        vipLevel: 'premium',
                        isSecret: true
                    }
                ]
            };
        }

        // 기본 응답
        return {
            message: "어떤 주제에 관심이 있으신가요? 게임, 코스프레, 스트리밍 등 다양한 커뮤니티를 추천해드릴 수 있습니다!",
            suggestions: [
                {
                    id: 'general-gaming',
                    name: '일반 게임 토론',
                    description: '게임에 대한 자유로운 토론',
                    category: 'Gaming',
                    memberCount: 25600,
                    isNew: false,
                    vipLevel: 'normal',
                    isSecret: false
                }
            ]
        };
    };

    // 메시지 전송
    const handleSendMessage = () => {
        if (!inputMessage.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            userId: 'user',
            message: inputMessage,
            timestamp: new Date(),
            type: 'user',
            userLevel: currentUserLevel
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsAITyping(true);

        // AI 응답 시뮬레이션
        setTimeout(() => {
            const aiResponse = generateAIResponse(inputMessage);

            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                userId: 'ai',
                message: aiResponse.message,
                timestamp: new Date(),
                type: 'ai',
                communitySuggestions: aiResponse.suggestions,
                userLevel: currentUserLevel
            };

            setMessages(prev => [...prev, aiMessage]);
            setSuggestedCommunities(aiResponse.suggestions);
            setIsAITyping(false);
        }, 1500);
    };

    // 커뮤니티 고정
    const handleFixCommunity = (community: CommunitySuggestion) => {
        setFixedCommunities(prev => [...prev, community]);
        setSuggestedCommunities(prev => prev.filter(c => c.id !== community.id));
    };

    // 커뮤니티 고정 해제
    const handleUnfixCommunity = (communityId: string) => {
        setFixedCommunities(prev => prev.filter(c => c.id !== communityId));
    };

    // VIP 등급 변경
    const handleLevelChange = (newLevel: VIPLevel) => {
        setCurrentUserLevel(newLevel);
    };

    // 시크릿 페이지 접근 가능 여부
    const canAccessSecretPage = (requiredLevel: VIPLevel['level']): boolean => {
        const levelOrder = ['normal', 'vip', 'premium', 'diamond', 'platinum'];
        const currentIndex = levelOrder.indexOf(currentUserLevel.level);
        const requiredIndex = levelOrder.indexOf(requiredLevel);
        return currentIndex >= requiredIndex;
    };

    // 접근 가능한 시크릿 페이지
    const accessibleSecretPages = secretPages.filter(page =>
        canAccessSecretPage(page.requiredLevel)
    );

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* 헤더 */}
            <Paper elevation={2} sx={{ p: 2, borderRadius: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        💬 채팅 기반 커뮤니티
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>등급</InputLabel>
                            <Select
                                value={currentUserLevel.level}
                                label="등급"
                                onChange={(e) => {
                                    const level = vipLevels.find(l => l.level === e.target.value);
                                    if (level) handleLevelChange(level);
                                }}
                            >
                                {vipLevels.map(level => (
                                    <MenuItem key={level.level} value={level.level}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {level.icon}
                                            {level.name}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            variant="outlined"
                            startIcon={<LockIcon />}
                            onClick={() => setShowSecretPages(true)}
                            disabled={accessibleSecretPages.length === 0}
                        >
                            시크릿 페이지 ({accessibleSecretPages.length})
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* 채팅 영역 */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* 메시지 목록 */}
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                        <List>
                            {messages.map((message) => (
                                <ListItem key={message.id} sx={{ mb: 1 }}>
                                    <ListItemAvatar>
                                        <Avatar sx={{
                                            bgcolor: message.type === 'user' ? currentUserLevel.color : '#4CAF50',
                                            width: 40,
                                            height: 40
                                        }}>
                                            {message.type === 'user' ? currentUserLevel.icon : <AIIcon />}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle2">
                                                    {message.type === 'user' ? '사용자' : 'AI 어시스턴트'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {message.timestamp.toLocaleTimeString()}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body1" sx={{ mb: 1 }}>
                                                    {message.message}
                                                </Typography>
                                                {message.communitySuggestions && (
                                                    <Box sx={{ mt: 1 }}>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            추천 커뮤니티:
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                            {message.communitySuggestions.map(suggestion => (
                                                                <Card key={suggestion.id} sx={{ maxWidth: 300 }}>
                                                                    <CardContent sx={{ p: 1 }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                                            <Typography variant="subtitle2">
                                                                                {suggestion.name}
                                                                            </Typography>
                                                                            {suggestion.isNew && (
                                                                                <Chip label="NEW" size="small" color="primary" />
                                                                            )}
                                                                            {suggestion.isSecret && (
                                                                                <Chip
                                                                                    label={suggestion.vipLevel.toUpperCase()}
                                                                                    size="small"
                                                                                    color="secondary"
                                                                                    icon={<LockIcon />}
                                                                                />
                                                                            )}
                                                                        </Box>
                                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                                            {suggestion.description}
                                                                        </Typography>
                                                                        <Typography variant="caption">
                                                                            멤버: {suggestion.memberCount.toLocaleString()}명
                                                                        </Typography>
                                                                    </CardContent>
                                                                    <CardActions sx={{ p: 1 }}>
                                                                        <Button
                                                                            size="small"
                                                                            onClick={() => handleFixCommunity(suggestion)}
                                                                            disabled={!canAccessSecretPage(suggestion.vipLevel)}
                                                                        >
                                                                            고정하기
                                                                        </Button>
                                                                    </CardActions>
                                                                </Card>
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                            {isAITyping && (
                                <ListItem>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: '#4CAF50' }}>
                                            <AIIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary="AI 어시스턴트"
                                        secondary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CircularProgress size={16} />
                                                <Typography variant="body2">응답 중...</Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            )}
                        </List>
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* 입력 영역 */}
                    <Paper elevation={3} sx={{ p: 2, borderRadius: 0 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                placeholder="예: 여기는 MMORPG 없나요?"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={isAITyping}
                            />
                            <Button
                                variant="contained"
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim() || isAITyping}
                                startIcon={<SendIcon />}
                            >
                                전송
                            </Button>
                        </Box>
                    </Paper>
                </Box>

                {/* 사이드바 - 고정된 커뮤니티 */}
                <Paper elevation={2} sx={{ width: 300, p: 2, borderRadius: 0 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckBoxIcon color="primary" />
                        고정된 커뮤니티
                    </Typography>

                    {fixedCommunities.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            아직 고정된 커뮤니티가 없습니다.
                        </Typography>
                    ) : (
                        <List>
                            {fixedCommunities.map(community => (
                                <ListItem key={community.id} sx={{ px: 0 }}>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle2">
                                                    {community.name}
                                                </Typography>
                                                {community.isSecret && (
                                                    <Chip
                                                        label={community.vipLevel.toUpperCase()}
                                                        size="small"
                                                        color="secondary"
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Typography variant="caption">
                                                멤버: {community.memberCount.toLocaleString()}명
                                            </Typography>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleUnfixCommunity(community.id)}
                                        >
                                            <CheckBoxOutlineBlankIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}

                    {fixedCommunities.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<DownloadIcon />}
                            >
                                모든 데이터 다운로드
                            </Button>
                        </Box>
                    )}
                </Paper>
            </Box>

            {/* 시크릿 페이지 다이얼로그 */}
            <Dialog
                open={showSecretPages}
                onClose={() => setShowSecretPages(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    🔒 시크릿 페이지 ({currentUserLevel.name})
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        현재 등급: <strong>{currentUserLevel.name}</strong>
                    </Typography>

                    {accessibleSecretPages.length === 0 ? (
                        <Alert severity="info">
                            현재 등급으로는 접근 가능한 시크릿 페이지가 없습니다.
                            VIP 등급을 업그레이드하세요!
                        </Alert>
                    ) : (
                        <List>
                            {accessibleSecretPages.map(page => (
                                <ListItem key={page.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Typography variant="h6">{page.name}</Typography>
                                        <Chip
                                            label={page.requiredLevel.toUpperCase()}
                                            size="small"
                                            color="secondary"
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        {page.description}
                                    </Typography>
                                    <Typography variant="body2" paragraph>
                                        {page.content}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {page.features.map(feature => (
                                            <Chip key={feature} label={feature} size="small" variant="outlined" />
                                        ))}
                                    </Box>
                                    <Divider sx={{ width: '100%', mt: 2 }} />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSecretPages(false)}>닫기</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ChatBasedCommunity;
