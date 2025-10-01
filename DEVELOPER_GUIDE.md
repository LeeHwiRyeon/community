# 👨‍💻 개발자 가이드

## 🎯 개발 환경 설정

### 필수 요구사항
- **Node.js**: v18.0.0 이상
- **npm**: v8.0.0 이상
- **MySQL**: v8.0.0 이상
- **Redis**: v6.0.0 이상
- **Git**: v2.30.0 이상

### 개발 도구
- **IDE**: VS Code, WebStorm, 또는 선호하는 에디터
- **브라우저**: Chrome, Firefox, Safari (최신 버전)
- **API 테스트**: Postman, Insomnia, 또는 curl
- **데이터베이스 관리**: MySQL Workbench, phpMyAdmin

---

## 🏗️ 프로젝트 구조

```
community/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── contexts/       # React Context
│   │   ├── utils/          # 유틸리티 함수
│   │   └── styles/         # CSS 스타일
│   ├── public/             # 정적 파일
│   └── package.json
├── server-backend/          # Node.js 백엔드
│   ├── api-server/         # API 서버
│   │   ├── routes/         # API 라우트
│   │   ├── middleware/     # 미들웨어
│   │   ├── services/       # 비즈니스 로직
│   │   └── models/         # 데이터 모델
│   ├── src/                # 소스 코드
│   └── package.json
├── scripts/                # 유틸리티 스크립트
├── tests/                  # 테스트 파일
├── docs/                   # 문서
└── docker-compose.yml      # Docker 설정
```

---

## 🚀 시작하기

### 1. 저장소 클론
```bash
git clone https://github.com/your-org/community-platform.git
cd community-platform
```

### 2. 의존성 설치
```bash
# 루트 의존성 설치
npm install

# 백엔드 의존성 설치
cd server-backend
npm install

# 프론트엔드 의존성 설치
cd ../frontend
npm install
```

### 3. 환경 변수 설정
```bash
# 백엔드 환경 변수
cp server-backend/.env.example server-backend/.env

# 프론트엔드 환경 변수
cp frontend/.env.example frontend/.env
```

### 4. 데이터베이스 설정
```bash
# MySQL 데이터베이스 생성
mysql -u root -p
CREATE DATABASE community_dev;
CREATE DATABASE community_test;

# 데이터베이스 마이그레이션
cd server-backend
npm run migrate
```

### 5. 개발 서버 시작
```bash
# 백엔드 서버 시작
cd server-backend
npm run dev

# 프론트엔드 서버 시작 (새 터미널)
cd frontend
npm run dev
```

---

## 🏛️ 아키텍처 개요

### 백엔드 아키텍처
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│   Auth Service  │────│  User Service   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│  Content Service│──────────────┘
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │  Chat Service   │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │  Search Service │
                        └─────────────────┘
```

### 프론트엔드 아키텍처
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │────│  Context API    │────│  Custom Hooks   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│  Component Tree │──────────────┘
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │  State Management│
                        └─────────────────┘
```

---

## 🔧 API 개발

### API 설계 원칙
1. **RESTful 설계**: REST 원칙을 따르는 API 설계
2. **일관된 응답 형식**: 모든 API는 일관된 응답 형식 사용
3. **적절한 HTTP 상태 코드**: 의미있는 상태 코드 사용
4. **API 버전 관리**: 버전별 API 관리
5. **문서화**: 모든 API는 문서화

### API 응답 형식
```json
{
  "success": true,
  "data": {
    // 실제 데이터
  },
  "message": "성공적으로 처리되었습니다.",
  "timestamp": "2024-07-29T10:00:00Z"
}
```

### 에러 응답 형식
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 데이터가 유효하지 않습니다.",
    "details": [
      {
        "field": "email",
        "message": "유효한 이메일을 입력하세요."
      }
    ]
  },
  "timestamp": "2024-07-29T10:00:00Z"
}
```

### API 라우트 예시
```javascript
// GET /api/posts
router.get('/', async (req, res) => {
  try {
    const posts = await PostService.getPosts(req.query);
    res.json({
      success: true,
      data: posts,
      message: '게시글 목록을 성공적으로 조회했습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '서버 내부 오류가 발생했습니다.'
      }
    });
  }
});
```

---

## 🎨 프론트엔드 개발

### 컴포넌트 개발
```tsx
// 컴포넌트 예시
interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment
}) => {
  return (
    <Box p={4} borderWidth={1} borderRadius="md">
      <Heading size="md" mb={2}>
        {post.title}
      </Heading>
      <Text mb={4}>{post.content}</Text>
      <HStack spacing={4}>
        <Button
          leftIcon={<Icon as={FaHeart} />}
          onClick={() => onLike(post.id)}
        >
          {post.likeCount}
        </Button>
        <Button
          leftIcon={<Icon as={FaComment} />}
          onClick={() => onComment(post.id)}
        >
          {post.commentCount}
        </Button>
      </HStack>
    </Box>
  );
};
```

### 커스텀 훅 개발
```tsx
// 커스텀 훅 예시
export const usePosts = (filters: PostFilters) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/posts', { params: filters });
      setPosts(response.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, error, refetch: fetchPosts };
};
```

### 상태 관리
```tsx
// Context 예시
interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <AppContext.Provider value={{ user, setUser, theme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
};
```

---

## 🗄️ 데이터베이스 개발

### 데이터베이스 스키마
```sql
-- 사용자 테이블
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 게시글 테이블
CREATE TABLE posts (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author_id VARCHAR(36) NOT NULL,
  board_id VARCHAR(36) NOT NULL,
  category VARCHAR(50),
  tags JSON,
  is_published BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (board_id) REFERENCES boards(id)
);
```

### 마이그레이션
```javascript
// 마이그레이션 예시
exports.up = async (knex) => {
  await knex.schema.createTable('posts', (table) => {
    table.uuid('id').primary();
    table.string('title', 200).notNullable();
    table.text('content').notNullable();
    table.uuid('author_id').notNullable();
    table.uuid('board_id').notNullable();
    table.string('category', 50);
    table.json('tags');
    table.boolean('is_published').defaultTo(true);
    table.integer('view_count').defaultTo(0);
    table.integer('like_count').defaultTo(0);
    table.integer('comment_count').defaultTo(0);
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
    
    table.foreign('author_id').references('id').inTable('users');
    table.foreign('board_id').references('id').inTable('boards');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('posts');
};
```

---

## 🧪 테스트 개발

### 단위 테스트
```javascript
// Jest 단위 테스트 예시
describe('PostService', () => {
  let postService;
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: jest.fn(),
    };
    postService = new PostService(mockDb);
  });

  describe('getPosts', () => {
    it('should return posts with pagination', async () => {
      const mockPosts = [
        { id: '1', title: 'Test Post 1' },
        { id: '2', title: 'Test Post 2' },
      ];
      
      mockDb.execute.mockResolvedValue([mockPosts]);

      const result = await postService.getPosts({ page: 1, limit: 10 });

      expect(result).toEqual(mockPosts);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.any(Array)
      );
    });
  });
});
```

### 통합 테스트
```javascript
// Supertest 통합 테스트 예시
describe('POST /api/posts', () => {
  it('should create a new post', async () => {
    const newPost = {
      title: 'Test Post',
      content: 'This is a test post',
      boardId: 'test-board-id',
    };

    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send(newPost)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(newPost.title);
  });
});
```

### E2E 테스트
```javascript
// Playwright E2E 테스트 예시
test('should create and display a new post', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');

  await page.goto('/posts/new');
  await page.fill('[data-testid="post-title"]', 'E2E Test Post');
  await page.fill('[data-testid="post-content"]', 'This is an E2E test post');
  await page.click('[data-testid="submit-button"]');

  await expect(page.locator('[data-testid="post-title"]')).toContainText('E2E Test Post');
});
```

---

## 🔒 보안 개발

### 인증 및 인가
```javascript
// JWT 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '액세스 토큰이 필요합니다.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    }
    req.user = user;
    next();
  });
};

// 역할 기반 인가
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    next();
  };
};
```

### 입력 검증
```javascript
// 입력 검증 미들웨어
const validatePost = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('제목은 1-200자 사이여야 합니다.')
    .escape(),
  body('content')
    .isLength({ min: 1, max: 10000 })
    .withMessage('내용은 1-10000자 사이여야 합니다.')
    .escape(),
  body('boardId')
    .isUUID()
    .withMessage('유효한 게시판 ID가 필요합니다.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: errors.array()
      });
    }
    next();
  }
];
```

### SQL 인젝션 방지
```javascript
// Prepared Statement 사용
const getPostById = async (postId) => {
  const [rows] = await db.execute(
    'SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL',
    [postId]
  );
  return rows[0];
};

// 파라미터화된 쿼리
const searchPosts = async (query, filters) => {
  let sql = 'SELECT * FROM posts WHERE 1=1';
  const params = [];

  if (query) {
    sql += ' AND (title LIKE ? OR content LIKE ?)';
    params.push(`%${query}%`, `%${query}%`);
  }

  if (filters.category) {
    sql += ' AND category = ?';
    params.push(filters.category);
  }

  const [rows] = await db.execute(sql, params);
  return rows;
};
```

---

## 📊 성능 최적화

### 데이터베이스 최적화
```sql
-- 인덱스 생성
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_board_id ON posts(board_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_category ON posts(category);

-- 복합 인덱스
CREATE INDEX idx_posts_board_created ON posts(board_id, created_at);
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at);
```

### 캐싱 전략
```javascript
// Redis 캐싱
const getCachedPosts = async (key) => {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
};

const setCachedPosts = async (key, data, ttl = 300) => {
  await redis.setex(key, ttl, JSON.stringify(data));
};

// 캐시된 데이터 조회
const getPosts = async (filters) => {
  const cacheKey = `posts:${JSON.stringify(filters)}`;
  const cached = await getCachedPosts(cacheKey);
  
  if (cached) {
    return cached;
  }

  const posts = await PostService.getPosts(filters);
  await setCachedPosts(cacheKey, posts);
  return posts;
};
```

### 프론트엔드 최적화
```tsx
// React.memo를 사용한 컴포넌트 최적화
const PostCard = React.memo(({ post, onLike, onComment }) => {
  return (
    <Box p={4} borderWidth={1} borderRadius="md">
      <Heading size="md" mb={2}>
        {post.title}
      </Heading>
      <Text mb={4}>{post.content}</Text>
      <HStack spacing={4}>
        <Button onClick={() => onLike(post.id)}>
          {post.likeCount}
        </Button>
        <Button onClick={() => onComment(post.id)}>
          {post.commentCount}
        </Button>
      </HStack>
    </Box>
  );
});

// useMemo를 사용한 계산 최적화
const PostList = ({ posts, filters }) => {
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (filters.category && post.category !== filters.category) {
        return false;
      }
      if (filters.search && !post.title.includes(filters.search)) {
        return false;
      }
      return true;
    });
  }, [posts, filters]);

  return (
    <VStack spacing={4}>
      {filteredPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </VStack>
  );
};
```

---

## 🚀 배포 및 CI/CD

### Docker 설정
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Build
      run: npm run build
```

---

## 📚 추가 자료

### 유용한 링크
- [Node.js 공식 문서](https://nodejs.org/docs/)
- [React 공식 문서](https://reactjs.org/docs/)
- [Express.js 가이드](https://expressjs.com/guide/)
- [MySQL 문서](https://dev.mysql.com/doc/)
- [Redis 문서](https://redis.io/documentation)

### 개발 도구
- [VS Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/)
- [MySQL Workbench](https://www.mysql.com/products/workbench/)
- [Redis Desktop Manager](https://rdm.dev/)

### 테스트 도구
- [Jest](https://jestjs.io/)
- [Supertest](https://github.com/visionmedia/supertest)
- [Playwright](https://playwright.dev/)

---

*이 가이드는 커뮤니티 플랫폼 v2.0.0 개발자용으로 작성되었습니다.*
*최신 업데이트: 2024년 7월 29일*
