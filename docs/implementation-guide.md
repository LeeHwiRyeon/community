# Community Platform v1.3 구현 가이드

## 📋 개요
Community Platform v1.3의 모든 기능을 단계별로 구현하는 완전한 가이드입니다. 개발팀이 바로 작업에 들어갈 수 있도록 상세한 구현 방법을 제공합니다.

## 🏗️ 프로젝트 설정

### 1. 개발 환경 구성
```bash
# Node.js 버전 확인
node --version  # v18.0.0 이상 필요
npm --version   # v8.0.0 이상 필요

# 프로젝트 클론
git clone https://github.com/community/platform.git
cd community-platform

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
```

### 2. 환경 변수 설정
```env
# .env 파일
# 데이터베이스
DATABASE_URL=postgresql://username:password@localhost:5432/community_platform
REDIS_URL=redis://localhost:6379
MONGODB_URL=mongodb://localhost:27017/community_platform

# 인증
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# 파일 저장
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# AI 서비스
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key

# 블록체인
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your_project_id
PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=your_contract_address

# 이메일
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 모니터링
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
```

### 3. 데이터베이스 설정
```sql
-- PostgreSQL 데이터베이스 생성
CREATE DATABASE community_platform;
CREATE USER community_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE community_platform TO community_user;

-- Redis 설정
# redis.conf
bind 127.0.0.1
port 6379
requirepass your_redis_password
maxmemory 256mb
maxmemory-policy allkeys-lru

-- MongoDB 설정
# mongod.conf
storage:
  dbPath: /var/lib/mongodb
net:
  port: 27017
  bindIp: 127.0.0.1
```

## 🎯 핵심 기능 구현

### 1. 뉴스 시스템 구현

#### 1.1 데이터베이스 스키마
```sql
-- 뉴스 테이블
CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category_id UUID REFERENCES news_categories(id),
    author_id UUID REFERENCES users(id),
    featured_image VARCHAR(500),
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 뉴스 카테고리 테이블
CREATE TABLE news_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#2196F3',
    icon VARCHAR(50) DEFAULT 'article',
    news_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 뉴스 태그 테이블
CREATE TABLE news_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    news_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 뉴스-태그 관계 테이블
CREATE TABLE news_tag_relations (
    news_id UUID REFERENCES news(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES news_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (news_id, tag_id)
);

-- 인덱스 생성
CREATE INDEX idx_news_published_at ON news(published_at);
CREATE INDEX idx_news_category_id ON news(category_id);
CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_title ON news USING gin(to_tsvector('korean', title));
CREATE INDEX idx_news_content ON news USING gin(to_tsvector('korean', content));
```

#### 1.2 백엔드 API 구현
```typescript
// server-backend/api-server/routes/news.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const NewsService = require('../services/NewsService');
const AuthMiddleware = require('../middleware/AuthMiddleware');

// 뉴스 목록 조회
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      tag,
      search,
      sortBy = 'newest'
    } = req.query;

    const news = await NewsService.getNewsList({
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      tag,
      search,
      sortBy
    });

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// 뉴스 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const news = await NewsService.getNewsById(id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '뉴스를 찾을 수 없습니다'
        }
      });
    }

    // 조회수 증가
    await NewsService.incrementViewCount(id);

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// 뉴스 생성
router.post('/', 
  AuthMiddleware.authenticate,
  [
    body('title').notEmpty().withMessage('제목은 필수입니다'),
    body('content').notEmpty().withMessage('내용은 필수입니다'),
    body('category').notEmpty().withMessage('카테고리는 필수입니다')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력 데이터가 유효하지 않습니다',
            details: errors.array()
          }
        });
      }

      const newsData = {
        ...req.body,
        authorId: req.user.id
      };

      const news = await NewsService.createNews(newsData);

      res.status(201).json({
        success: true,
        data: news
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }
);

module.exports = router;
```

#### 1.3 프론트엔드 컴포넌트 구현
```typescript
// frontend/src/components/News/NewsList.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Pagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Search,
  FilterList,
  ThumbUp,
  Comment,
  Visibility
} from '@mui/icons-material';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: {
    name: string;
    color: string;
  };
  author: {
    name: string;
    avatar: string;
  };
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  featuredImage?: string;
}

const NewsList: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadNews();
  }, [page, search, category, sortBy]);

  const loadNews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        search,
        category,
        sortBy
      });

      const response = await fetch(`/api/news?${params}`);
      const data = await response.json();

      if (data.success) {
        setNews(data.data.news);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('뉴스 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleCategoryChange = (event: any) => {
    setCategory(event.target.value);
    setPage(1);
  };

  const handleSortChange = (event: any) => {
    setSortBy(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event: any, value: number) => {
    setPage(value);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 검색 및 필터 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="뉴스 검색..."
          value={search}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1 }} />
          }}
          sx={{ flexGrow: 1 }}
        />
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>카테고리</InputLabel>
          <Select
            value={category}
            onChange={handleCategoryChange}
            label="카테고리"
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="tech">기술</MenuItem>
            <MenuItem value="business">비즈니스</MenuItem>
            <MenuItem value="lifestyle">라이프스타일</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>정렬</InputLabel>
          <Select
            value={sortBy}
            onChange={handleSortChange}
            label="정렬"
          >
            <MenuItem value="newest">최신순</MenuItem>
            <MenuItem value="popular">인기순</MenuItem>
            <MenuItem value="trending">트렌딩</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 뉴스 목록 */}
      <Grid container spacing={3}>
        {news.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              {item.featuredImage && (
                <Box
                  component="img"
                  src={item.featuredImage}
                  alt={item.title}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover'
                  }}
                />
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip
                    label={item.category.name}
                    size="small"
                    sx={{
                      backgroundColor: item.category.color,
                      color: 'white',
                      mr: 1
                    }}
                  />
                </Box>

                <Typography
                  variant="h6"
                  component="h2"
                  sx={{
                    mb: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {item.title}
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {item.excerpt}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={item.author.avatar}
                    sx={{ width: 24, height: 24, mr: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {item.author.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Visibility fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {item.viewCount}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ThumbUp fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {item.likeCount}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Comment fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {item.commentCount}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 페이지네이션 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
          size="large"
        />
      </Box>
    </Box>
  );
};

export default NewsList;
```

### 2. 커뮤니티 시스템 구현

#### 2.1 WebSocket 서버 설정
```typescript
// server-backend/api-server/websocket/ChatServer.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import ChatService from '../services/ChatService';

class ChatServer {
  private io: SocketIOServer;
  private chatService: ChatService;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    
    this.chatService = new ChatService();
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // 인증 미들웨어
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('인증 토큰이 필요합니다'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.data.user = decoded;
        next();
      } catch (error) {
        next(new Error('인증 실패'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`사용자 연결: ${socket.data.user.id}`);

      // 채팅방 참여
      socket.on('join_room', async (data) => {
        try {
          const { roomId } = data;
          await socket.join(roomId);
          
          // 참여자 목록 업데이트
          const participants = await this.chatService.getRoomParticipants(roomId);
          socket.to(roomId).emit('user_joined', {
            user: socket.data.user,
            participants
          });

          socket.emit('joined_room', { roomId, participants });
        } catch (error) {
          socket.emit('error', { message: '채팅방 참여 실패' });
        }
      });

      // 채팅방 나가기
      socket.on('leave_room', async (data) => {
        try {
          const { roomId } = data;
          await socket.leave(roomId);
          
          const participants = await this.chatService.getRoomParticipants(roomId);
          socket.to(roomId).emit('user_left', {
            user: socket.data.user,
            participants
          });
        } catch (error) {
          socket.emit('error', { message: '채팅방 나가기 실패' });
        }
      });

      // 메시지 전송
      socket.on('send_message', async (data) => {
        try {
          const { roomId, message, type = 'text' } = data;
          
          const messageData = {
            id: this.generateMessageId(),
            roomId,
            userId: socket.data.user.id,
            user: socket.data.user,
            message,
            type,
            timestamp: new Date()
          };

          // 메시지 저장
          await this.chatService.saveMessage(messageData);

          // 모든 참여자에게 메시지 전송
          this.io.to(roomId).emit('new_message', messageData);
        } catch (error) {
          socket.emit('error', { message: '메시지 전송 실패' });
        }
      });

      // 타이핑 상태 전송
      socket.on('typing', (data) => {
        const { roomId, isTyping } = data;
        socket.to(roomId).emit('user_typing', {
          user: socket.data.user,
          isTyping
        });
      });

      // 연결 해제
      socket.on('disconnect', () => {
        console.log(`사용자 연결 해제: ${socket.data.user.id}`);
      });
    });
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default ChatServer;
```

#### 2.2 프론트엔드 채팅 컴포넌트
```typescript
// frontend/src/components/ChatSystem.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Paper,
  Divider
} from '@mui/material';
import {
  Send,
  EmojiEmotions,
  AttachFile,
  MoreVert
} from '@mui/icons-material';
import io, { Socket } from 'socket.io-client';

interface Message {
  id: string;
  roomId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  message: string;
  type: 'text' | 'image' | 'file';
  timestamp: Date;
}

interface ChatSystemProps {
  roomId: string;
  currentUser: {
    id: string;
    name: string;
    avatar: string;
  };
}

const ChatSystem: React.FC<ChatSystemProps> = ({ roomId, currentUser }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Socket.IO 연결
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('accessToken')
      }
    });

    newSocket.on('connect', () => {
      console.log('Socket 연결됨');
      newSocket.emit('join_room', { roomId });
    });

    newSocket.on('joined_room', (data) => {
      console.log('채팅방 참여됨:', data);
    });

    newSocket.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('user_typing', (data) => {
      if (data.user.id !== currentUser.id) {
        setTypingUsers(prev => {
          if (data.isTyping) {
            return [...prev.filter(id => id !== data.user.id), data.user.id];
          } else {
            return prev.filter(id => id !== data.user.id);
          }
        });
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket 오류:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      socket.emit('send_message', {
        roomId,
        message: newMessage.trim(),
        type: 'text'
      });
      setNewMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(event.target.value);
    
    if (socket) {
      if (event.target.value.length > 0 && !isTyping) {
        setIsTyping(true);
        socket.emit('typing', { roomId, isTyping: true });
      } else if (event.target.value.length === 0 && isTyping) {
        setIsTyping(false);
        socket.emit('typing', { roomId, isTyping: false });
      }
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 메시지 목록 */}
      <Paper sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        <List>
          {messages.map((message) => (
            <ListItem
              key={message.id}
              sx={{
                flexDirection: message.userId === currentUser.id ? 'row-reverse' : 'row',
                alignItems: 'flex-start'
              }}
            >
              <ListItemAvatar>
                <Avatar src={message.user.avatar} />
              </ListItemAvatar>
              <Box
                sx={{
                  maxWidth: '70%',
                  backgroundColor: message.userId === currentUser.id ? 'primary.main' : 'grey.100',
                  color: message.userId === currentUser.id ? 'white' : 'text.primary',
                  borderRadius: 2,
                  p: 1,
                  ml: message.userId === currentUser.id ? 0 : 1,
                  mr: message.userId === currentUser.id ? 1 : 0
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {message.user.name}
                </Typography>
                <Typography variant="body1">
                  {message.message}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
            </ListItem>
          ))}
          
          {/* 타이핑 표시 */}
          {typingUsers.length > 0 && (
            <ListItem>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {typingUsers.join(', ')}이(가) 타이핑 중...
              </Typography>
            </ListItem>
          )}
          
          <div ref={messagesEndRef} />
        </List>
      </Paper>

      <Divider />

      {/* 메시지 입력 */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton>
          <AttachFile />
        </IconButton>
        <TextField
          fullWidth
          placeholder="메시지를 입력하세요..."
          value={newMessage}
          onChange={handleTyping}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={4}
          variant="outlined"
          size="small"
        />
        <IconButton>
          <EmojiEmotions />
        </IconButton>
        <IconButton onClick={handleSendMessage} disabled={!newMessage.trim()}>
          <Send />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatSystem;
```

### 3. AI/ML 시스템 구현

#### 3.1 AI 콘텐츠 최적화 서비스
```typescript
// server-backend/api-server/services/AIContentService.ts
import OpenAI from 'openai';
import { ContentAnalysis, ContentOptimization } from '../types/AITypes';

class AIContentService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyzeContent(content: string, type: 'text' | 'image' | 'video'): Promise<ContentAnalysis> {
    try {
      const prompt = `
        다음 ${type} 콘텐츠를 분석해주세요:
        
        ${content}
        
        다음 항목들을 0-100 점수로 평가해주세요:
        1. 가독성 (readability)
        2. 참여도 (engagement)
        3. SEO 최적화 (seo)
        4. 감정 (sentiment) - -1(부정) ~ 1(긍정)
        5. 품질 (quality)
        
        또한 개선 제안사항도 제공해주세요.
        
        JSON 형식으로 응답해주세요:
        {
          "readability": 85,
          "engagement": 92,
          "seo": 78,
          "sentiment": 0.8,
          "quality": 88,
          "suggestions": ["제목을 더 매력적으로 만들어보세요", "이미지를 추가하면 좋겠습니다"]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        readability: analysis.readability || 0,
        engagement: analysis.engagement || 0,
        seo: analysis.seo || 0,
        sentiment: analysis.sentiment || 0,
        quality: analysis.quality || 0,
        suggestions: analysis.suggestions || []
      };
    } catch (error) {
      console.error('AI 콘텐츠 분석 실패:', error);
      throw new Error('콘텐츠 분석에 실패했습니다');
    }
  }

  async optimizeContent(
    content: string,
    type: 'text' | 'image' | 'video',
    targetAudience: string,
    goals: string[]
  ): Promise<ContentOptimization> {
    try {
      const prompt = `
        다음 ${type} 콘텐츠를 최적화해주세요:
        
        원본 콘텐츠: ${content}
        대상: ${targetAudience}
        목표: ${goals.join(', ')}
        
        최적화된 콘텐츠와 개선사항을 제공해주세요.
        
        JSON 형식으로 응답해주세요:
        {
          "optimizedContent": "최적화된 콘텐츠",
          "improvements": ["개선사항1", "개선사항2"],
          "score": 95
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      });

      const optimization = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        optimizedContent: optimization.optimizedContent || content,
        improvements: optimization.improvements || [],
        score: optimization.score || 0
      };
    } catch (error) {
      console.error('AI 콘텐츠 최적화 실패:', error);
      throw new Error('콘텐츠 최적화에 실패했습니다');
    }
  }
}

export default AIContentService;
```

#### 3.2 ML 개인화 엔진
```typescript
// server-backend/api-server/services/MLPersonalizationService.ts
import { UserInteraction, Recommendation, UserProfile } from '../types/MLTypes';

class MLPersonalizationService {
  private userProfiles: Map<string, UserProfile> = new Map();
  private contentMatrix: Map<string, Map<string, number>> = new Map();

  async updateUserProfile(userId: string, interactions: UserInteraction[]): Promise<UserProfile> {
    const profile = this.userProfiles.get(userId) || this.createEmptyProfile(userId);
    
    // 상호작용 데이터로 프로필 업데이트
    for (const interaction of interactions) {
      this.updateProfileWithInteraction(profile, interaction);
    }

    this.userProfiles.set(userId, profile);
    return profile;
  }

  async generateRecommendations(
    userId: string,
    type: 'content' | 'user' | 'event',
    limit: number = 10
  ): Promise<Recommendation[]> {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      throw new Error('사용자 프로필을 찾을 수 없습니다');
    }

    const recommendations: Recommendation[] = [];

    switch (type) {
      case 'content':
        recommendations.push(...this.getContentRecommendations(profile, limit));
        break;
      case 'user':
        recommendations.push(...this.getUserRecommendations(profile, limit));
        break;
      case 'event':
        recommendations.push(...this.getEventRecommendations(profile, limit));
        break;
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private createEmptyProfile(userId: string): UserProfile {
    return {
      userId,
      interests: new Map(),
      behaviorPatterns: {
        activeHours: [],
        preferredCategories: [],
        engagementLevel: 0
      },
      demographics: {
        age: 0,
        gender: 'unknown',
        location: 'unknown'
      },
      lastUpdated: new Date()
    };
  }

  private updateProfileWithInteraction(profile: UserProfile, interaction: UserInteraction): void {
    const { type, contentId, category, timestamp } = interaction;
    
    // 관심사 업데이트
    if (category) {
      const currentInterest = profile.interests.get(category) || 0;
      const weight = this.getInteractionWeight(type);
      profile.interests.set(category, currentInterest + weight);
    }

    // 행동 패턴 업데이트
    const hour = new Date(timestamp).getHours();
    if (!profile.behaviorPatterns.activeHours.includes(hour)) {
      profile.behaviorPatterns.activeHours.push(hour);
    }

    // 참여도 업데이트
    profile.behaviorPatterns.engagementLevel += this.getEngagementScore(type);
    
    profile.lastUpdated = new Date();
  }

  private getInteractionWeight(type: string): number {
    const weights: { [key: string]: number } = {
      'view': 1,
      'like': 3,
      'comment': 5,
      'share': 4,
      'bookmark': 2
    };
    return weights[type] || 1;
  }

  private getEngagementScore(type: string): number {
    const scores: { [key: string]: number } = {
      'view': 0.1,
      'like': 0.3,
      'comment': 0.5,
      'share': 0.4,
      'bookmark': 0.2
    };
    return scores[type] || 0.1;
  }

  private getContentRecommendations(profile: UserProfile, limit: number): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // 관심사 기반 추천
    for (const [category, interest] of profile.interests) {
      if (interest > 0) {
        recommendations.push({
          id: `content_${category}_${Date.now()}`,
          type: 'content',
          title: `${category} 관련 콘텐츠`,
          score: interest / 10,
          reason: '관심사 기반'
        });
      }
    }

    return recommendations;
  }

  private getUserRecommendations(profile: UserProfile, limit: number): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // 유사한 관심사를 가진 사용자 추천
    for (const [userId, userProfile] of this.userProfiles) {
      if (userId === profile.userId) continue;
      
      const similarity = this.calculateUserSimilarity(profile, userProfile);
      if (similarity > 0.5) {
        recommendations.push({
          id: `user_${userId}`,
          type: 'user',
          title: `유사한 관심사 사용자`,
          score: similarity,
          reason: '관심사 유사도 기반'
        });
      }
    }

    return recommendations;
  }

  private getEventRecommendations(profile: UserProfile, limit: number): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // 관심사 기반 이벤트 추천
    for (const [category, interest] of profile.interests) {
      if (interest > 0) {
        recommendations.push({
          id: `event_${category}_${Date.now()}`,
          type: 'event',
          title: `${category} 관련 이벤트`,
          score: interest / 10,
          reason: '관심사 기반'
        });
      }
    }

    return recommendations;
  }

  private calculateUserSimilarity(profile1: UserProfile, profile2: UserProfile): number {
    const interests1 = Array.from(profile1.interests.keys());
    const interests2 = Array.from(profile2.interests.keys());
    
    const commonInterests = interests1.filter(interest => interests2.includes(interest));
    const totalInterests = new Set([...interests1, ...interests2]).size;
    
    return commonInterests.length / totalInterests;
  }
}

export default MLPersonalizationService;
```

## 🚀 배포 및 운영

### 1. Docker 설정
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```dockerfile
# server-backend/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### 2. Docker Compose 설정
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://localhost:5000

  backend:
    build: ./server-backend
    ports:
      - "5000:5000"
    depends_on:
      - postgres
      - redis
      - mongodb
    environment:
      - DATABASE_URL=postgresql://community_user:secure_password@postgres:5432/community_platform
      - REDIS_URL=redis://redis:6379
      - MONGODB_URL=mongodb://mongodb:27017/community_platform

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=community_platform
      - POSTGRES_USER=community_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass your_redis_password
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  mongodb:
    image: mongo:6
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

volumes:
  postgres_data:
  redis_data:
  mongodb_data:
```

### 3. Kubernetes 배포
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: community-platform

---
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: community-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: community-platform/frontend:latest
        ports:
        - containerPort: 80
        env:
        - name: REACT_APP_API_URL
          value: "https://api.communityplatform.com"

---
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: community-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: community-platform/backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
```

## 📊 모니터링 및 로깅

### 1. Prometheus 설정
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'community-platform'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'
    scrape_interval: 5s
```

### 2. Grafana 대시보드
```json
{
  "dashboard": {
    "title": "Community Platform Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

---

**Community Platform v1.3 구현 가이드** - 2024년 10월 최신 버전
