# Community Platform 개발자 가이드

## 📖 목차

1. [개발 환경 설정](#개발-환경-설정)
2. [프로젝트 구조](#프로젝트-구조)
3. [API 문서](#api-문서)
4. [데이터베이스 스키마](#데이터베이스-스키마)
5. [프론트엔드 개발](#프론트엔드-개발)
6. [백엔드 개발](#백엔드-개발)
7. [테스트](#테스트)
8. [배포](#배포)
9. [성능 최적화](#성능-최적화)
10. [보안](#보안)

---

## 🛠️ 개발 환경 설정

### 필수 요구사항

- **Node.js**: v18.0.0 이상
- **npm**: v8.0.0 이상
- **MySQL**: v8.0 이상
- **Redis**: v6.0 이상
- **Git**: v2.30 이상

### 개발 도구

- **IDE**: VS Code (권장)
- **데이터베이스 클라이언트**: MySQL Workbench, DBeaver
- **API 테스트**: Postman, Insomnia
- **버전 관리**: Git, GitHub

### 환경 설정

1. **저장소 클론**
   ```bash
   git clone https://github.com/your-org/community-platform.git
   cd community-platform
   ```

2. **의존성 설치**
   ```bash
   # 백엔드 의존성
   cd server-backend
   npm install

   # 프론트엔드 의존성
   cd ../frontend
   npm install
   ```

3. **환경 변수 설정**
   ```bash
   # 백엔드 환경 변수
   cp server-backend/.env.example server-backend/.env
   
   # 프론트엔드 환경 변수
   cp frontend/.env.example frontend/.env
   ```

4. **데이터베이스 설정**
   ```bash
   # MySQL 데이터베이스 생성
   mysql -u root -p
   CREATE DATABASE community_platform;
   
   # 스키마 마이그레이션
   cd server-backend
   npm run migrate
   ```

5. **개발 서버 실행**
   ```bash
   # 백엔드 서버 (터미널 1)
   cd server-backend
   npm run dev

   # 프론트엔드 서버 (터미널 2)
   cd frontend
   npm start
   ```

---

## 📁 프로젝트 구조

```
community-platform/
├── frontend/                 # React 프론트엔드
│   ├── public/              # 정적 파일
│   ├── src/
│   │   ├── components/      # 재사용 가능한 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── services/       # API 서비스
│   │   ├── utils/          # 유틸리티 함수
│   │   ├── contexts/       # React Context
│   │   ├── types/          # TypeScript 타입 정의
│   │   └── styles/         # 스타일 파일
│   ├── package.json
│   └── tsconfig.json
├── server-backend/          # Node.js 백엔드
│   ├── api-server/         # API 서버
│   │   ├── routes/         # API 라우트
│   │   ├── middleware/     # 미들웨어
│   │   ├── models/         # 데이터 모델
│   │   ├── services/       # 비즈니스 로직
│   │   └── utils/          # 유틸리티
│   ├── config/             # 설정 파일
│   ├── scripts/            # 스크립트
│   ├── tests/              # 테스트 파일
│   └── package.json
├── docs/                   # 문서
├── monitoring/             # 모니터링 도구
├── docker/                 # Docker 설정
├── scripts/                # 배포 스크립트
└── README.md
```

---

## 🔌 API 문서

### 기본 정보

- **Base URL**: `http://localhost:5000/api`
- **인증**: JWT Bearer Token
- **응답 형식**: JSON
- **에러 처리**: HTTP 상태 코드 + JSON 에러 메시지

### 인증 API

#### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "사용자",
      "role": "user"
    }
  }
}
```

#### 회원가입
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "사용자",
  "confirmPassword": "password123"
}
```

### 게시글 API

#### 게시글 목록 조회
```http
GET /api/posts?page=1&limit=10&category=technology
Authorization: Bearer <token>
```

**응답:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post_123",
        "title": "게시글 제목",
        "content": "게시글 내용",
        "author": {
          "id": "user_123",
          "name": "작성자"
        },
        "category": "technology",
        "tags": ["react", "javascript"],
        "views": 100,
        "likes": 25,
        "comments": 10,
        "createdAt": "2024-09-28T10:00:00Z",
        "updatedAt": "2024-09-28T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

#### 게시글 작성
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "게시글 제목",
  "content": "게시글 내용",
  "category": "technology",
  "tags": ["react", "javascript"]
}
```

### 댓글 API

#### 댓글 목록 조회
```http
GET /api/posts/:postId/comments?page=1&limit=20
Authorization: Bearer <token>
```

#### 댓글 작성
```http
POST /api/posts/:postId/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "댓글 내용",
  "parentId": null
}
```

### 사용자 API

#### 프로필 조회
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### 프로필 수정
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "새로운 이름",
  "bio": "자기소개",
  "avatar": "avatar_url"
}
```

---

## 🗄️ 데이터베이스 스키마

### 주요 테이블

#### users (사용자)
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(500),
  role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
  status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

#### posts (게시글)
```sql
CREATE TABLE posts (
  id VARCHAR(36) PRIMARY KEY,
  author_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  tags JSON,
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_author_id (author_id),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at),
  INDEX idx_views (views),
  INDEX idx_likes (likes),
  FULLTEXT idx_content (title, content)
);
```

#### comments (댓글)
```sql
CREATE TABLE comments (
  id VARCHAR(36) PRIMARY KEY,
  post_id VARCHAR(36) NOT NULL,
  author_id VARCHAR(36) NOT NULL,
  parent_id VARCHAR(36) NULL,
  content TEXT NOT NULL,
  likes INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id),
  INDEX idx_author_id (author_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_created_at (created_at)
);
```

#### sessions (세션)
```sql
CREATE TABLE sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

### 관계도

```
users (1) ──── (N) posts
users (1) ──── (N) comments
posts (1) ──── (N) comments
comments (1) ──── (N) comments (self-reference)
users (1) ──── (N) sessions
```

---

## ⚛️ 프론트엔드 개발

### 기술 스택

- **React**: v18.2.0
- **TypeScript**: v4.9.0
- **Chakra UI**: v2.8.0
- **React Query**: v4.32.0
- **React Router**: v6.8.0
- **Socket.IO Client**: v4.7.0

### 컴포넌트 구조

#### 페이지 컴포넌트
```typescript
// src/pages/PostsPage.tsx
import React from 'react';
import { Box, VStack } from '@chakra-ui/react';
import { PostList } from '../components/PostList';
import { PostFilters } from '../components/PostFilters';

export const PostsPage: React.FC = () => {
  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <PostFilters />
        <PostList />
      </VStack>
    </Box>
  );
};
```

#### 재사용 가능한 컴포넌트
```typescript
// src/components/PostCard.tsx
import React from 'react';
import { Card, CardBody, CardHeader, Heading, Text } from '@chakra-ui/react';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    author: {
      name: string;
    };
    createdAt: string;
    views: number;
    likes: number;
  };
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <Card>
      <CardHeader>
        <Heading size="md">{post.title}</Heading>
      </CardHeader>
      <CardBody>
        <Text>{post.content}</Text>
        <Text fontSize="sm" color="gray.500">
          {post.author.name} • {new Date(post.createdAt).toLocaleDateString()}
        </Text>
      </CardBody>
    </Card>
  );
};
```

### 상태 관리

#### React Query 사용
```typescript
// src/hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '../services/postService';

export const usePosts = (filters: PostFilters) => {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: () => postService.getPosts(filters),
    staleTime: 5 * 60 * 1000, // 5분
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: postService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
```

#### Context API 사용
```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string) => {
    // 로그인 로직
  };

  const logout = () => {
    // 로그아웃 로직
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### API 서비스

```typescript
// src/services/apiService.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// 요청 인터셉터
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🖥️ 백엔드 개발

### 기술 스택

- **Node.js**: v18.0.0
- **Express.js**: v4.18.0
- **TypeScript**: v4.9.0
- **MySQL**: v8.0
- **Redis**: v6.0
- **Socket.IO**: v4.7.0
- **JWT**: v9.0.0

### 프로젝트 구조

```
server-backend/
├── api-server/
│   ├── routes/              # API 라우트
│   │   ├── auth.js         # 인증 관련
│   │   ├── posts.js        # 게시글 관련
│   │   ├── comments.js     # 댓글 관련
│   │   └── users.js        # 사용자 관련
│   ├── middleware/         # 미들웨어
│   │   ├── auth.js         # 인증 미들웨어
│   │   ├── validation.js   # 유효성 검사
│   │   └── rateLimit.js    # 요청 제한
│   ├── models/             # 데이터 모델
│   │   ├── User.js         # 사용자 모델
│   │   ├── Post.js         # 게시글 모델
│   │   └── Comment.js      # 댓글 모델
│   ├── services/           # 비즈니스 로직
│   │   ├── authService.js  # 인증 서비스
│   │   ├── postService.js  # 게시글 서비스
│   │   └── emailService.js # 이메일 서비스
│   └── utils/              # 유틸리티
│       ├── logger.js       # 로깅
│       ├── database.js     # 데이터베이스 연결
│       └── validation.js   # 유효성 검사
├── config/                 # 설정 파일
│   ├── database.js         # 데이터베이스 설정
│   ├── redis.js           # Redis 설정
│   └── jwt.js             # JWT 설정
└── tests/                 # 테스트 파일
    ├── unit/              # 단위 테스트
    ├── integration/       # 통합 테스트
    └── e2e/              # E2E 테스트
```

### API 라우트 예시

```javascript
// routes/posts.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validatePost } = require('../middleware/validation');
const postService = require('../services/postService');

// 게시글 목록 조회
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const posts = await postService.getPosts({
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      search
    });
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 게시글 작성
router.post('/', authenticateToken, validatePost, async (req, res) => {
  try {
    const post = await postService.createPost({
      ...req.body,
      authorId: req.user.id
    });
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

### 미들웨어 예시

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '토큰이 필요합니다.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warning('유효하지 않은 토큰:', err.message);
      return res.status(403).json({ success: false, message: '유효하지 않은 토큰입니다.' });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
```

### 서비스 레이어

```javascript
// services/postService.js
const { Post } = require('../models/Post');
const { logger } = require('../utils/logger');

class PostService {
  async getPosts(filters) {
    try {
      const { page, limit, category, search } = filters;
      const offset = (page - 1) * limit;
      
      let query = Post.query();
      
      if (category) {
        query = query.where('category', category);
      }
      
      if (search) {
        query = query.whereRaw('MATCH(title, content) AGAINST(? IN BOOLEAN MODE)', [search]);
      }
      
      const posts = await query
        .withGraphFetched('author')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);
      
      const total = await Post.query().resultSize();
      
      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('게시글 조회 실패:', error);
      throw error;
    }
  }

  async createPost(postData) {
    try {
      const post = await Post.query().insertAndFetch({
        ...postData,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      logger.info('게시글 생성:', post.id);
      return post;
    } catch (error) {
      logger.error('게시글 생성 실패:', error);
      throw error;
    }
  }
}

module.exports = new PostService();
```

---

## 🧪 테스트

### 테스트 전략

1. **단위 테스트**: 개별 함수/메서드 테스트
2. **통합 테스트**: 모듈 간 상호작용 테스트
3. **E2E 테스트**: 전체 사용자 시나리오 테스트

### 테스트 도구

- **Jest**: JavaScript 테스트 프레임워크
- **Supertest**: HTTP 테스트
- **React Testing Library**: React 컴포넌트 테스트
- **Cypress**: E2E 테스트

### 단위 테스트 예시

```javascript
// tests/unit/services/postService.test.js
const postService = require('../../api-server/services/postService');
const { Post } = require('../../api-server/models/Post');

jest.mock('../../api-server/models/Post');

describe('PostService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    it('should return posts with pagination', async () => {
      const mockPosts = [
        { id: '1', title: 'Test Post 1' },
        { id: '2', title: 'Test Post 2' }
      ];
      
      Post.query.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        withGraphFetched: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockPosts)
      });
      
      Post.query.mockResolvedValueOnce({ resultSize: 2 });
      
      const result = await postService.getPosts({ page: 1, limit: 10 });
      
      expect(result.posts).toEqual(mockPosts);
      expect(result.pagination.total).toBe(2);
    });
  });
});
```

### 통합 테스트 예시

```javascript
// tests/integration/posts.test.js
const request = require('supertest');
const app = require('../../api-server/app');

describe('Posts API', () => {
  let authToken;

  beforeAll(async () => {
    // 테스트 사용자 로그인
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = response.body.data.token;
  });

  describe('GET /api/posts', () => {
    it('should return posts list', async () => {
      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeDefined();
    });
  });

  describe('POST /api/posts', () => {
    it('should create a new post', async () => {
      const postData = {
        title: 'Test Post',
        content: 'Test Content',
        category: 'technology'
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(postData.title);
    });
  });
});
```

### E2E 테스트 예시

```javascript
// tests/e2e/posts.spec.js
describe('Posts E2E', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.login('test@example.com', 'password123');
  });

  it('should create and view a post', () => {
    cy.visit('/posts');
    cy.get('[data-testid="create-post-button"]').click();
    
    cy.get('[data-testid="post-title"]').type('E2E Test Post');
    cy.get('[data-testid="post-content"]').type('This is an E2E test post');
    cy.get('[data-testid="post-category"]').select('technology');
    cy.get('[data-testid="submit-post"]').click();
    
    cy.url().should('include', '/posts/');
    cy.get('[data-testid="post-title"]').should('contain', 'E2E Test Post');
  });
});
```

---

## 🚀 배포

### Docker 배포

#### Dockerfile
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

#### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: ./server-backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=community_platform
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app

volumes:
  mysql_data:
```

### CI/CD 파이프라인

#### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # 배포 스크립트 실행
          ./scripts/deploy.sh
```

### 환경별 설정

#### 개발 환경
```bash
# .env.development
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=community_platform_dev
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=dev-secret
```

#### 프로덕션 환경
```bash
# .env.production
NODE_ENV=production
DB_HOST=prod-mysql.example.com
DB_PORT=3306
DB_NAME=community_platform
REDIS_HOST=prod-redis.example.com
REDIS_PORT=6379
JWT_SECRET=production-secret-key
```

---

## ⚡ 성능 최적화

### 프론트엔드 최적화

1. **코드 스플리팅**
   ```typescript
   // 동적 임포트
   const LazyComponent = React.lazy(() => import('./LazyComponent'));

   // 라우트 기반 스플리팅
   const PostsPage = React.lazy(() => import('./pages/PostsPage'));
   ```

2. **메모이제이션**
   ```typescript
   // React.memo
   const PostCard = React.memo(({ post }) => {
     return <div>{post.title}</div>;
   });

   // useMemo
   const expensiveValue = useMemo(() => {
     return computeExpensiveValue(data);
   }, [data]);
   ```

3. **이미지 최적화**
   ```typescript
   // 지연 로딩
   const LazyImage = ({ src, alt }) => {
     const [isLoaded, setIsLoaded] = useState(false);
     
     return (
       <img
         src={isLoaded ? src : placeholder}
         alt={alt}
         onLoad={() => setIsLoaded(true)}
         loading="lazy"
       />
     );
   };
   ```

### 백엔드 최적화

1. **데이터베이스 최적화**
   ```sql
   -- 인덱스 생성
   CREATE INDEX idx_posts_category_created ON posts(category, created_at);
   CREATE INDEX idx_posts_author_created ON posts(author_id, created_at);
   
   -- 쿼리 최적화
   EXPLAIN SELECT * FROM posts WHERE category = 'technology' ORDER BY created_at DESC;
   ```

2. **캐싱**
   ```javascript
   // Redis 캐싱
   const getCachedPosts = async (filters) => {
     const cacheKey = `posts:${JSON.stringify(filters)}`;
     const cached = await redis.get(cacheKey);
     
     if (cached) {
       return JSON.parse(cached);
     }
     
     const posts = await postService.getPosts(filters);
     await redis.setex(cacheKey, 300, JSON.stringify(posts)); // 5분 캐시
     
     return posts;
   };
   ```

3. **API 최적화**
   ```javascript
   // 페이지네이션
   const getPosts = async (req, res) => {
     const { page = 1, limit = 10 } = req.query;
     const offset = (page - 1) * limit;
     
     const posts = await Post.query()
       .limit(limit)
       .offset(offset);
     
     res.json({ posts, pagination: { page, limit } });
   };
   ```

---

## 🔒 보안

### 인증 및 권한

1. **JWT 토큰 관리**
   ```javascript
   // 토큰 생성
   const token = jwt.sign(
     { userId: user.id, email: user.email },
     process.env.JWT_SECRET,
     { expiresIn: '24h' }
   );

   // 토큰 검증
   const verifyToken = (req, res, next) => {
     const token = req.headers.authorization?.split(' ')[1];
     
     if (!token) {
       return res.status(401).json({ message: '토큰이 필요합니다.' });
     }
     
     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = decoded;
       next();
     } catch (error) {
       return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
     }
   };
   ```

2. **비밀번호 해싱**
   ```javascript
   const bcrypt = require('bcrypt');

   // 비밀번호 해싱
   const hashPassword = async (password) => {
     const saltRounds = 12;
     return await bcrypt.hash(password, saltRounds);
   };

   // 비밀번호 검증
   const verifyPassword = async (password, hash) => {
     return await bcrypt.compare(password, hash);
   };
   ```

### 입력 검증

1. **유효성 검사**
   ```javascript
   const Joi = require('joi');

   const postSchema = Joi.object({
     title: Joi.string().min(1).max(255).required(),
     content: Joi.string().min(1).max(10000).required(),
     category: Joi.string().valid('technology', 'gaming', 'learning').required(),
     tags: Joi.array().items(Joi.string().max(50)).max(10)
   });

   const validatePost = (req, res, next) => {
     const { error } = postSchema.validate(req.body);
     if (error) {
       return res.status(400).json({ message: error.details[0].message });
     }
     next();
   };
   ```

2. **SQL 인젝션 방지**
   ```javascript
   // 매개변수화된 쿼리 사용
   const getPost = async (id) => {
     return await Post.query()
       .where('id', id)
       .first();
   };

   // ORM 사용 (Objection.js)
   const getPosts = async (filters) => {
     let query = Post.query();
     
     if (filters.category) {
       query = query.where('category', filters.category);
     }
     
     return await query;
   };
   ```

### 보안 헤더

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## 📞 지원 및 커뮤니티

### 개발자 리소스

- **API 문서**: https://api.community.com/docs
- **GitHub 저장소**: https://github.com/your-org/community-platform
- **이슈 트래커**: https://github.com/your-org/community-platform/issues
- **위키**: https://github.com/your-org/community-platform/wiki

### 커뮤니티

- **개발자 포럼**: https://dev-forum.community.com
- **Discord**: https://discord.gg/community-dev
- **스택 오버플로우**: [community-platform] 태그
- **블로그**: https://dev-blog.community.com

### 기여하기

1. **Fork 저장소**
2. **브랜치 생성**: `git checkout -b feature/amazing-feature`
3. **변경사항 커밋**: `git commit -m 'Add amazing feature'`
4. **브랜치 푸시**: `git push origin feature/amazing-feature`
5. **Pull Request 생성**

---

*이 가이드는 Community Platform v2.0.0 개발 환경 기준으로 작성되었습니다.*
*최신 업데이트: 2024년 9월 28일*
