# Community Hub Development Guide

This guide provides comprehensive information for developers working on the Community Hub platform.

## Table of Contents
- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Development Environment](#development-environment)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Component Development](#component-development)
- [API Development](#api-development)
- [Database Management](#database-management)
- [Performance Optimization](#performance-optimization)
- [Security Guidelines](#security-guidelines)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites
- Node.js 18+ and npm 8+
- MariaDB/MySQL 10.3+
- Redis 6.0+
- Git
- VS Code (recommended)

### Initial Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd community
   
   # Install backend dependencies
   cd server-backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment template
   cp server-backend/.env.example server-backend/.env
   
   # Configure your environment variables
   # Edit server-backend/.env
   ```

3. **Database Setup**
   ```bash
   cd server-backend
   npm run import:init
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd server-backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Project Architecture

### Frontend Architecture

The frontend follows a modern React architecture with the following structure:

```
frontend/src/
├── components/          # Reusable UI components
│   ├── __tests__/      # Component tests
│   ├── editor/         # Rich text editor components
│   └── *.tsx           # Individual components
├── pages/              # Page-level components
│   ├── __tests__/      # Page tests
│   └── *.tsx           # Individual pages
├── hooks/              # Custom React hooks
├── contexts/           # React contexts for state management
├── api/                # API service functions
├── utils/              # Utility functions
├── store/              # Redux store configuration
└── assets/             # Static assets
```

### Backend Architecture

The backend follows a modular Express.js architecture:

```
server-backend/src/
├── routes/             # API route definitions
├── services/           # Business logic services
│   ├── posts/          # Post-related services
│   ├── profile/        # User profile services
│   └── attachments/    # File attachment services
├── auth/               # Authentication modules
├── config/             # Configuration files
├── optimizations/      # Performance optimizations
├── redis/              # Redis integration
└── tests/              # Test files
```

### Database Schema

The platform uses MariaDB/MySQL with the following main tables:

- `users` - User accounts and profiles
- `communities` - Community definitions
- `boards` - Community boards
- `posts` - User posts
- `comments` - Post comments
- `votes` - Voting data
- `tags` - Content tags
- `notifications` - User notifications
- `attachments` - File attachments
- `drafts` - Post drafts

## Development Environment

### VS Code Configuration

Recommended VS Code extensions:
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens
- Prettier - Code formatter
- ESLint

### Environment Variables

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=community_hub
DB_USER=root
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Server
PORT=50000
NODE_ENV=development

# Features
ENABLE_MOCK_DATA=true
ENABLE_ANALYTICS=true
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:50000
VITE_WS_URL=ws://localhost:50000
VITE_APP_NAME=Community Hub
```

### Development Scripts

#### Backend Scripts
```bash
npm run dev          # Start development server with watch
npm run start        # Start production server
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:api     # Run API tests
npm run test:e2e     # Run end-to-end tests
npm run mock         # Generate mock data
```

#### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

## Code Standards

### TypeScript Guidelines

1. **Strict Type Checking**
   ```typescript
   // Use strict types
   interface User {
     id: number;
     username: string;
     email: string;
     profile?: UserProfile;
   }

   // Avoid any type
   const user: User = getUserData(); // Good
   const user: any = getUserData(); // Bad
   ```

2. **Component Props**
   ```typescript
   interface PostCardProps {
     post: Post;
     onVote: (postId: number, type: 'up' | 'down') => void;
     showActions?: boolean;
   }

   const PostCard: React.FC<PostCardProps> = ({ 
     post, 
     onVote, 
     showActions = true 
   }) => {
     // Component implementation
   };
   ```

3. **API Response Types**
   ```typescript
   interface ApiResponse<T> {
     success: boolean;
     data: T;
     message?: string;
     error?: {
       code: string;
       message: string;
     };
   }

   interface PostListResponse {
     posts: Post[];
     pagination: PaginationInfo;
   }
   ```

### React Guidelines

1. **Functional Components with Hooks**
   ```typescript
   const PostList: React.FC<PostListProps> = ({ boardId }) => {
     const [posts, setPosts] = useState<Post[]>([]);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       fetchPosts(boardId).then(setPosts).finally(() => setLoading(false));
     }, [boardId]);
     
     if (loading) return <LoadingSpinner />;
     
     return (
       <div className="post-list">
         {posts.map(post => <PostCard key={post.id} post={post} />)}
       </div>
     );
   };
   ```

2. **Custom Hooks**
   ```typescript
   const usePosts = (boardId: number) => {
     const [posts, setPosts] = useState<Post[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     
     const fetchPosts = useCallback(async () => {
       try {
         setLoading(true);
         const response = await api.getPosts(boardId);
         setPosts(response.data.posts);
       } catch (err) {
         setError(err.message);
       } finally {
         setLoading(false);
       }
     }, [boardId]);
     
     useEffect(() => {
       fetchPosts();
     }, [fetchPosts]);
     
     return { posts, loading, error, refetch: fetchPosts };
   };
   ```

3. **Context Usage**
   ```typescript
   const AuthContext = createContext<AuthContextType | undefined>(undefined);

   export const useAuth = () => {
     const context = useContext(AuthContext);
     if (!context) {
       throw new Error('useAuth must be used within AuthProvider');
     }
     return context;
   };
   ```

### CSS Guidelines

1. **Use CSS Modules or Styled Components**
   ```typescript
   // CSS Modules
   import styles from './PostCard.module.css';

   const PostCard = () => (
     <div className={styles.postCard}>
       <h3 className={styles.title}>Post Title</h3>
     </div>
   );
   ```

2. **Responsive Design**
   ```css
   .post-card {
     padding: 1rem;
     margin-bottom: 1rem;
   }

   @media (max-width: 768px) {
     .post-card {
       padding: 0.5rem;
       margin-bottom: 0.5rem;
     }
   }
   ```

3. **CSS Variables for Theming**
   ```css
   :root {
     --primary-color: #0066cc;
     --secondary-color: #6c757d;
     --success-color: #28a745;
     --danger-color: #dc3545;
     --warning-color: #ffc107;
   }
   ```

## Testing Guidelines

### Unit Testing

1. **Component Testing**
   ```typescript
   import { render, screen, fireEvent } from '@testing-library/react';
   import { PostCard } from './PostCard';

   describe('PostCard', () => {
     const mockPost = {
       id: 1,
       title: 'Test Post',
       content: 'Test content',
       author: { id: 1, username: 'testuser' }
     };

     it('renders post title and content', () => {
       render(<PostCard post={mockPost} />);
       expect(screen.getByText('Test Post')).toBeInTheDocument();
       expect(screen.getByText('Test content')).toBeInTheDocument();
     });

     it('calls onVote when vote button is clicked', () => {
       const mockOnVote = jest.fn();
       render(<PostCard post={mockPost} onVote={mockOnVote} />);
       
       fireEvent.click(screen.getByText('Upvote'));
       expect(mockOnVote).toHaveBeenCalledWith(1, 'up');
     });
   });
   ```

2. **Hook Testing**
   ```typescript
   import { renderHook, act } from '@testing-library/react';
   import { usePosts } from './usePosts';

   describe('usePosts', () => {
     it('fetches posts on mount', async () => {
       const { result } = renderHook(() => usePosts(1));
       
       expect(result.current.loading).toBe(true);
       
       await act(async () => {
         await new Promise(resolve => setTimeout(resolve, 0));
       });
       
       expect(result.current.loading).toBe(false);
       expect(result.current.posts).toHaveLength(0);
     });
   });
   ```

### Integration Testing

1. **API Testing**
   ```typescript
   import request from 'supertest';
   import app from '../src/app';

   describe('POST /api/posts', () => {
     it('creates a new post', async () => {
       const postData = {
         title: 'Test Post',
         content: 'Test content',
         boardId: 1
       };

       const response = await request(app)
         .post('/api/posts')
         .set('Authorization', 'Bearer valid-token')
         .send(postData)
         .expect(201);

       expect(response.body.success).toBe(true);
       expect(response.body.data.title).toBe('Test Post');
     });
   });
   ```

### End-to-End Testing

1. **User Workflow Testing**
   ```typescript
   import { test, expect } from '@playwright/test';

   test('user can create and view a post', async ({ page }) => {
     // Login
     await page.goto('/login');
     await page.fill('[data-testid="email"]', 'test@example.com');
     await page.fill('[data-testid="password"]', 'password');
     await page.click('[data-testid="login-button"]');

     // Navigate to board
     await page.goto('/board/1');
     
     // Create post
     await page.click('[data-testid="create-post-button"]');
     await page.fill('[data-testid="post-title"]', 'Test Post');
     await page.fill('[data-testid="post-content"]', 'Test content');
     await page.click('[data-testid="submit-post"]');

     // Verify post appears
     await expect(page.locator('[data-testid="post-title"]')).toContainText('Test Post');
   });
   ```

## Component Development

### Component Structure

1. **File Organization**
   ```
   components/
   ├── PostCard/
   │   ├── PostCard.tsx
   │   ├── PostCard.module.css
   │   ├── PostCard.test.tsx
   │   └── index.ts
   ```

2. **Component Template**
   ```typescript
   import React from 'react';
   import styles from './ComponentName.module.css';

   interface ComponentNameProps {
     // Define props here
   }

   const ComponentName: React.FC<ComponentNameProps> = ({ 
     // Destructure props
   }) => {
     // Component logic here
     
     return (
       <div className={styles.container}>
         {/* JSX content */}
       </div>
     );
   };

   export default ComponentName;
   ```

### State Management

1. **Local State**
   ```typescript
   const [isOpen, setIsOpen] = useState(false);
   const [data, setData] = useState<DataType[]>([]);
   ```

2. **Global State (Redux)**
   ```typescript
   // store/slices/postsSlice.ts
   import { createSlice, PayloadAction } from '@reduxjs/toolkit';

   interface PostsState {
     posts: Post[];
     loading: boolean;
     error: string | null;
   }

   const postsSlice = createSlice({
     name: 'posts',
     initialState: {
       posts: [],
       loading: false,
       error: null
     } as PostsState,
     reducers: {
       setPosts: (state, action: PayloadAction<Post[]>) => {
         state.posts = action.payload;
       },
       setLoading: (state, action: PayloadAction<boolean>) => {
         state.loading = action.payload;
       }
     }
   });
   ```

3. **Server State (TanStack Query)**
   ```typescript
   const { data: posts, isLoading, error } = useQuery({
     queryKey: ['posts', boardId],
     queryFn: () => api.getPosts(boardId),
     staleTime: 5 * 60 * 1000, // 5 minutes
   });
   ```

## API Development

### Route Structure

1. **Route Organization**
   ```javascript
   // routes/posts.js
   import express from 'express';
   import { authenticateToken } from '../middleware/auth.js';
   import { validatePost } from '../middleware/validation.js';

   const router = express.Router();

   // GET /api/posts
   router.get('/', async (req, res) => {
     try {
       const posts = await postService.getPosts(req.query);
       res.json({ success: true, data: posts });
     } catch (error) {
       res.status(500).json({ success: false, error: error.message });
     }
   });

   // POST /api/posts
   router.post('/', authenticateToken, validatePost, async (req, res) => {
     try {
       const post = await postService.createPost(req.body, req.user.id);
       res.status(201).json({ success: true, data: post });
     } catch (error) {
       res.status(400).json({ success: false, error: error.message });
     }
   });

   export default router;
   ```

2. **Middleware Usage**
   ```javascript
   // middleware/validation.js
   export const validatePost = (req, res, next) => {
     const { title, content, boardId } = req.body;
     
     if (!title || title.trim().length === 0) {
       return res.status(400).json({
         success: false,
         error: { code: 'VALIDATION_ERROR', message: 'Title is required' }
       });
     }
     
     if (!content || content.trim().length === 0) {
       return res.status(400).json({
         success: false,
         error: { code: 'VALIDATION_ERROR', message: 'Content is required' }
       });
     }
     
     next();
   };
   ```

### Service Layer

1. **Service Structure**
   ```javascript
   // services/posts/post-service.js
   import db from '../../db.js';
   import { Post } from '../../models/Post.js';

   export class PostService {
     async getPosts(filters = {}) {
       const { boardId, page = 1, limit = 20, search } = filters;
       
       let query = `
         SELECT p.*, u.username, u.display_name
         FROM posts p
         JOIN users u ON p.author_id = u.id
         WHERE 1=1
       `;
       
       const params = [];
       
       if (boardId) {
         query += ' AND p.board_id = ?';
         params.push(boardId);
       }
       
       if (search) {
         query += ' AND (p.title LIKE ? OR p.content LIKE ?)';
         params.push(`%${search}%`, `%${search}%`);
       }
       
       query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
       params.push(limit, (page - 1) * limit);
       
       const posts = await db.query(query, params);
       return posts.map(row => new Post(row));
     }
     
     async createPost(postData, authorId) {
       const { title, content, boardId, tags } = postData;
       
       const result = await db.query(
         'INSERT INTO posts (title, content, board_id, author_id) VALUES (?, ?, ?, ?)',
         [title, content, boardId, authorId]
       );
       
       const postId = result.insertId;
       
       // Handle tags if provided
       if (tags && tags.length > 0) {
         await this.addTagsToPost(postId, tags);
       }
       
       return await this.getPostById(postId);
     }
   }
   ```

## Database Management

### Migration System

1. **Migration Structure**
   ```javascript
   // scripts/migrations/20240101_create_posts_table.js
   export async function up(db) {
     await db.query(`
       CREATE TABLE posts (
         id INT PRIMARY KEY AUTO_INCREMENT,
         title VARCHAR(255) NOT NULL,
         content TEXT NOT NULL,
         board_id INT NOT NULL,
         author_id INT NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         FOREIGN KEY (board_id) REFERENCES boards(id),
         FOREIGN KEY (author_id) REFERENCES users(id)
       )
     `);
   }
   
   export async function down(db) {
     await db.query('DROP TABLE posts');
   }
   ```

2. **Running Migrations**
   ```bash
   # Run all pending migrations
   npm run migrate
   
   # Rollback last migration
   npm run migrate:rollback
   
   # Check migration status
   npm run migrate:status
   ```

### Database Optimization

1. **Indexing Strategy**
   ```sql
   -- Indexes for common queries
   CREATE INDEX idx_posts_board_id ON posts(board_id);
   CREATE INDEX idx_posts_author_id ON posts(author_id);
   CREATE INDEX idx_posts_created_at ON posts(created_at);
   CREATE INDEX idx_posts_title ON posts(title);
   
   -- Composite indexes for complex queries
   CREATE INDEX idx_posts_board_created ON posts(board_id, created_at);
   ```

2. **Query Optimization**
   ```javascript
   // Use prepared statements
   const posts = await db.query(
     'SELECT * FROM posts WHERE board_id = ? AND created_at > ?',
     [boardId, sinceDate]
   );
   
   // Use pagination
   const posts = await db.query(
     'SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?',
     [limit, offset]
   );
   ```

## Performance Optimization

### Frontend Optimization

1. **Code Splitting**
   ```typescript
   import { lazy, Suspense } from 'react';
   
   const PostPage = lazy(() => import('./pages/PostPage'));
   
   const App = () => (
     <Suspense fallback={<LoadingSpinner />}>
       <PostPage />
     </Suspense>
   );
   ```

2. **Memoization**
   ```typescript
   const PostCard = React.memo(({ post, onVote }) => {
     // Component implementation
   });
   
   const MemoizedPostList = React.memo(({ posts }) => {
     return (
       <div>
         {posts.map(post => (
           <PostCard key={post.id} post={post} />
         ))}
       </div>
     );
   });
   ```

3. **Virtual Scrolling**
   ```typescript
   import { FixedSizeList as List } from 'react-window';
   
   const PostList = ({ posts }) => (
     <List
       height={600}
       itemCount={posts.length}
       itemSize={120}
       itemData={posts}
     >
       {({ index, style, data }) => (
         <div style={style}>
           <PostCard post={data[index]} />
         </div>
       )}
     </List>
   );
   ```

### Backend Optimization

1. **Caching Strategy**
   ```javascript
   import Redis from 'ioredis';
   
   const redis = new Redis(process.env.REDIS_URL);
   
   export const getCachedPosts = async (boardId) => {
     const cacheKey = `posts:board:${boardId}`;
     const cached = await redis.get(cacheKey);
     
     if (cached) {
       return JSON.parse(cached);
     }
     
     const posts = await postService.getPosts({ boardId });
     await redis.setex(cacheKey, 300, JSON.stringify(posts)); // 5 min cache
     
     return posts;
   };
   ```

2. **Database Connection Pooling**
   ```javascript
   import mysql from 'mysql2/promise';
   
   const pool = mysql.createPool({
     host: process.env.DB_HOST,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_NAME,
     waitForConnections: true,
     connectionLimit: 10,
     queueLimit: 0
   });
   ```

## Security Guidelines

### Input Validation

1. **Sanitization**
   ```javascript
   import DOMPurify from 'isomorphic-dompurify';
   
   const sanitizeInput = (input) => {
     return DOMPurify.sanitize(input, { 
       ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
       ALLOWED_ATTR: []
     });
   };
   ```

2. **Validation Middleware**
   ```javascript
   import Joi from 'joi';
   
   const postSchema = Joi.object({
     title: Joi.string().min(1).max(255).required(),
     content: Joi.string().min(1).max(10000).required(),
     boardId: Joi.number().integer().positive().required()
   });
   
   export const validatePost = (req, res, next) => {
     const { error } = postSchema.validate(req.body);
     if (error) {
       return res.status(400).json({
         success: false,
         error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
       });
     }
     next();
   };
   ```

### Authentication & Authorization

1. **JWT Implementation**
   ```javascript
   import jwt from 'jsonwebtoken';
   
   export const generateToken = (user) => {
     return jwt.sign(
       { id: user.id, email: user.email },
       process.env.JWT_SECRET,
       { expiresIn: process.env.JWT_EXPIRES_IN }
     );
   };
   
   export const verifyToken = (token) => {
     return jwt.verify(token, process.env.JWT_SECRET);
   };
   ```

2. **Rate Limiting**
   ```javascript
   import rateLimit from 'express-rate-limit';
   
   const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
     message: 'Too many requests from this IP'
   });
   
   app.use('/api/', apiLimiter);
   ```

## Deployment

### Docker Configuration

1. **Dockerfile**
   ```dockerfile
   # Backend Dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   EXPOSE 50000
   
   CMD ["npm", "start"]
   ```

2. **Docker Compose**
   ```yaml
   version: '3.8'
   services:
     backend:
       build: ./server-backend
       ports:
         - "50000:50000"
       environment:
         - NODE_ENV=production
         - DB_HOST=db
         - REDIS_HOST=redis
       depends_on:
         - db
         - redis
     
     frontend:
       build: ./frontend
       ports:
         - "5000:5000"
       depends_on:
         - backend
     
     db:
       image: mariadb:10.6
       environment:
         - MYSQL_ROOT_PASSWORD=password
         - MYSQL_DATABASE=community_hub
       volumes:
         - db_data:/var/lib/mysql
     
     redis:
       image: redis:6-alpine
       ports:
         - "6379:6379"
   
   volumes:
     db_data:
   ```

### Environment Configuration

1. **Production Environment**
   ```env
   NODE_ENV=production
   PORT=50000
   DB_HOST=production-db-host
   DB_USER=production-user
   DB_PASSWORD=secure-password
   JWT_SECRET=production-secret-key
   REDIS_HOST=production-redis-host
   ```

2. **Health Checks**
   ```javascript
   app.get('/health', (req, res) => {
     res.json({
       status: 'healthy',
       timestamp: new Date().toISOString(),
       uptime: process.uptime()
     });
   });
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database status
   systemctl status mariadb
   
   # Test connection
   mysql -h localhost -u root -p
   ```

2. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :50000
   
   # Kill process using port
   kill -9 <PID>
   ```

3. **Memory Issues**
   ```bash
   # Check memory usage
   free -h
   
   # Monitor Node.js memory
   node --inspect src/index.js
   ```

### Debugging

1. **Frontend Debugging**
   ```typescript
   // Use React DevTools
   // Add console.log for debugging
   console.log('Component rendered with props:', props);
   
   // Use debugger statement
   debugger;
   ```

2. **Backend Debugging**
   ```javascript
   // Use debug module
   import debug from 'debug';
   const log = debug('app:posts');
   
   log('Fetching posts for board:', boardId);
   
   // Use console.log for quick debugging
   console.log('Request body:', req.body);
   ```

### Performance Monitoring

1. **Frontend Monitoring**
   ```typescript
   // Use React DevTools Profiler
   // Monitor bundle size
   npm run build -- --analyze
   ```

2. **Backend Monitoring**
   ```javascript
   // Use performance monitoring
   import { performance } from 'perf_hooks';
   
   const start = performance.now();
   // ... operation
   const end = performance.now();
   console.log(`Operation took ${end - start} milliseconds`);
   ```

This development guide provides comprehensive information for working with the Community Hub platform. For specific implementation details, refer to the individual component and service files in the codebase.
