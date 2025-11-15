# ⚡ 성능 최적화 가이드

**작성일:** 2025년 11월 12일  
**Phase:** 4 - Task 4 (성능 최적화)  
**목표:** Lighthouse 90+ 달성

---

## 📋 목차

1. [현재 성능 분석](#1-현재-성능-분석)
2. [번들 최적화](#2-번들-최적화)
3. [코드 스플리팅](#3-코드-스플리팅)
4. [이미지 최적화](#4-이미지-최적화)
5. [캐싱 전략](#5-캐싱-전략)
6. [백엔드 최적화](#6-백엔드-최적화)
7. [성능 측정](#7-성능-측정)

---

## 1. 현재 성능 분석

### 1.1 기존 최적화 현황

#### ✅ 이미 구현된 최적화
```
- Lazy Loading: 모든 페이지 컴포넌트 (30+ 페이지)
- Code Splitting: React.lazy() 적용
- PWA: Service Worker, 캐시 전략
- Redis 캐싱: API 응답 캐싱
- Gzip 압축: Express compression 미들웨어
- Image Optimization: Sharp 라이브러리
```

#### ⚠️ 추가 최적화 필요 영역
```
- 번들 크기: 대형 라이브러리 최적화 필요
- Tree Shaking: 사용하지 않는 코드 제거
- Font Loading: 폰트 최적화
- Critical CSS: 초기 렌더링 CSS 최적화
- Prefetching: 리소스 미리 로딩
```

### 1.2 성능 목표

| 지표                           | 현재   | 목표   | 우선순위 |
| ------------------------------ | ------ | ------ | -------- |
| Lighthouse Performance         | ~75    | 90+    | High     |
| First Contentful Paint (FCP)   | ~2.5s  | <1.8s  | High     |
| Largest Contentful Paint (LCP) | ~4.0s  | <2.5s  | High     |
| Time to Interactive (TTI)      | ~5.0s  | <3.8s  | Medium   |
| Cumulative Layout Shift (CLS)  | ~0.15  | <0.1   | Medium   |
| Total Blocking Time (TBT)      | ~500ms | <300ms | High     |
| Bundle Size                    | ~800KB | <500KB | High     |

---

## 2. 번들 최적화

### 2.1 의존성 분석

#### 번들 크기 분석

```powershell
# 번들 분석 실행
cd frontend
npm run build:analyze

# 또는 Vite 빌드 후 분석
npm run build
npx vite-bundle-visualizer
```

#### 대형 라이브러리 최적화

```typescript
// vite.config.ts

export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // React 관련
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    
                    // UI 라이브러리 분리
                    'mui': ['@mui/material', '@mui/icons-material', '@mui/lab'],
                    'chakra': ['@chakra-ui/react', '@chakra-ui/icons'],
                    
                    // 상태 관리
                    'redux': ['@reduxjs/toolkit', 'react-redux'],
                    
                    // Chart 라이브러리 (큰 용량)
                    'charts': ['chart.js', 'react-chartjs-2'],
                    
                    // Socket.io (실시간 기능)
                    'socket': ['socket.io-client'],
                    
                    // i18n
                    'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
                    
                    // 유틸리티
                    'utils': ['axios', 'date-fns', 'lodash-es'],
                }
            }
        },
        
        // 청크 크기 제한
        chunkSizeWarningLimit: 500, // 500KB
        
        // 최소화 설정
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // console.log 제거 (프로덕션)
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug']
            },
            format: {
                comments: false // 주석 제거
            }
        },
        
        // CSS 최적화
        cssCodeSplit: true,
        
        // Source map (프로덕션에서는 제거 가능)
        sourcemap: false
    },
    
    // 최적화 옵션
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            '@mui/material',
            '@mui/icons-material'
        ],
        exclude: ['@vite/client', '@vite/env']
    }
});
```

### 2.2 Tree Shaking

#### Lodash 최적화

```typescript
// ❌ 잘못된 방법 (전체 라이브러리 import)
import _ from 'lodash';
const result = _.debounce(fn, 300);

// ✅ 올바른 방법 (필요한 함수만 import)
import debounce from 'lodash-es/debounce';
const result = debounce(fn, 300);
```

#### Material-UI 최적화

```typescript
// ❌ 잘못된 방법
import { Button, TextField, Box } from '@mui/material';

// ✅ 올바른 방법 (자동 tree shaking 지원)
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
```

### 2.3 동적 Import

```typescript
// 조건부 로딩
const loadChartLibrary = async () => {
    if (needsChart) {
        const { Chart } = await import('chart.js');
        return Chart;
    }
};

// 사용자 상호작용 후 로딩
const handleEditClick = async () => {
    const { default: Editor } = await import('./components/RichTextEditor');
    setEditorComponent(Editor);
};
```

---

## 3. 코드 스플리팅

### 3.1 Route-based Splitting (이미 적용됨)

```typescript
// frontend/src/App.tsx

// ✅ 이미 적용됨
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const Profile = lazy(() => import('./pages/Profile'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
// ... 30+ pages

function App() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                {/* ... */}
            </Routes>
        </Suspense>
    );
}
```

### 3.2 Component-based Splitting

```typescript
// 대형 컴포넌트 지연 로딩
const HeavyChart = lazy(() => import('./components/HeavyChart'));
const RichTextEditor = lazy(() => import('./components/RichTextEditor'));
const VideoPlayer = lazy(() => import('./components/VideoPlayer'));

function Dashboard() {
    const [showChart, setShowChart] = useState(false);
    
    return (
        <div>
            <h1>Dashboard</h1>
            <button onClick={() => setShowChart(true)}>
                Show Chart
            </button>
            
            {showChart && (
                <Suspense fallback={<ChartSkeleton />}>
                    <HeavyChart />
                </Suspense>
            )}
        </div>
    );
}
```

### 3.3 Library Splitting

```typescript
// 무거운 라이브러리 지연 로딩
const loadMarkdownParser = () => import('marked');
const loadPDFGenerator = () => import('jspdf');
const loadExcelExporter = () => import('xlsx');

// 사용 예시
const exportToPDF = async () => {
    const jsPDF = await loadPDFGenerator();
    const doc = new jsPDF.default();
    // PDF 생성 로직
};
```

---

## 4. 이미지 최적화

### 4.1 이미지 포맷 최적화

#### WebP 변환

```javascript
// server-backend/services/imageProcessor.js

import sharp from 'sharp';

export async function optimizeImage(inputPath, outputPath) {
    await sharp(inputPath)
        .webp({ quality: 80 }) // WebP 변환
        .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .toFile(outputPath);
}

// 여러 크기 생성
export async function generateResponsiveImages(inputPath, baseName) {
    const sizes = [400, 800, 1200];
    
    const promises = sizes.map(size => 
        sharp(inputPath)
            .webp({ quality: 80 })
            .resize(size, size, { fit: 'inside' })
            .toFile(`${baseName}-${size}w.webp`)
    );
    
    await Promise.all(promises);
}
```

### 4.2 Lazy Loading Images

```typescript
// frontend/src/components/LazyImage.tsx

import { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
    src: string;
    alt: string;
    placeholder?: string;
}

export function LazyImage({ src, alt, placeholder }: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '50px' }
        );
        
        if (imgRef.current) {
            observer.observe(imgRef.current);
        }
        
        return () => observer.disconnect();
    }, []);
    
    return (
        <img
            ref={imgRef}
            src={isInView ? src : placeholder}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            loading="lazy"
            style={{
                opacity: isLoaded ? 1 : 0.5,
                transition: 'opacity 0.3s'
            }}
        />
    );
}
```

### 4.3 Responsive Images

```tsx
// srcset을 사용한 반응형 이미지
<img
    srcSet={`
        /images/hero-400w.webp 400w,
        /images/hero-800w.webp 800w,
        /images/hero-1200w.webp 1200w
    `}
    sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
    src="/images/hero-800w.webp"
    alt="Hero image"
    loading="lazy"
/>
```

---

## 5. 캐싱 전략

### 5.1 프론트엔드 캐싱

#### Service Worker 캐싱 (이미 적용됨)

```typescript
// vite.config.ts - PWA 설정 확인

VitePWA({
    workbox: {
        runtimeCaching: [
            {
                // API 캐싱 (Network First)
                urlPattern: /^https:\/\/api\./,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'api-cache',
                    networkTimeoutSeconds: 10,
                    expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 60 * 5 // 5분
                    }
                }
            },
            {
                // 이미지 캐싱 (Cache First)
                urlPattern: /\.(?:png|jpg|jpeg|webp|svg)$/,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'images-cache',
                    expiration: {
                        maxEntries: 200,
                        maxAgeSeconds: 60 * 60 * 24 * 7 // 7일
                    }
                }
            },
            {
                // 폰트 캐싱 (Cache First, 장기)
                urlPattern: /\.(?:woff|woff2)$/,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'fonts-cache',
                    expiration: {
                        maxAgeSeconds: 60 * 60 * 24 * 365 // 1년
                    }
                }
            }
        ]
    }
})
```

#### HTTP 캐싱 헤더

```javascript
// server-backend/app.js

// 정적 파일 캐싱
app.use('/uploads', express.static('uploads', {
    maxAge: '7d', // 7일
    etag: true,
    lastModified: true
}));

// API 응답 캐싱 헤더
app.use('/api/public/*', (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=300'); // 5분
    next();
});
```

### 5.2 백엔드 Redis 캐싱 (이미 적용됨)

```javascript
// server-backend/middleware/cache.js

import redisClient from '../config/redis.js';

export function cacheMiddleware(ttl = 300) {
    return async (req, res, next) => {
        const key = `cache:${req.originalUrl}`;
        
        try {
            const cached = await redisClient.get(key);
            
            if (cached) {
                return res.json(JSON.parse(cached));
            }
            
            // 원래 res.json을 래핑
            const originalJson = res.json.bind(res);
            res.json = (data) => {
                redisClient.setex(key, ttl, JSON.stringify(data));
                return originalJson(data);
            };
            
            next();
        } catch (error) {
            next();
        }
    };
}

// 사용
app.get('/api/posts', cacheMiddleware(300), getPostsHandler);
```

---

## 6. 백엔드 최적화

### 6.1 데이터베이스 최적화

#### 인덱스 추가

```sql
-- 자주 조회되는 컬럼에 인덱스 추가
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, is_read);

-- 복합 인덱스
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX idx_posts_category_created ON posts(category, created_at DESC);
```

#### 쿼리 최적화

```javascript
// ❌ N+1 쿼리 문제
async function getPostsWithAuthors() {
    const posts = await db.query('SELECT * FROM posts LIMIT 10');
    
    for (const post of posts) {
        // N번 추가 쿼리!
        post.author = await db.query('SELECT * FROM users WHERE id = ?', [post.user_id]);
    }
    
    return posts;
}

// ✅ JOIN 사용
async function getPostsWithAuthors() {
    return await db.query(`
        SELECT 
            p.*,
            u.username,
            u.avatar
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LIMIT 10
    `);
}
```

### 6.2 API 응답 최적화

#### 페이지네이션

```javascript
// server-backend/routes/posts.js

router.get('/posts', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const [posts, [{ total }]] = await Promise.all([
        db.query(`
            SELECT * FROM posts
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]),
        
        db.query('SELECT COUNT(*) as total FROM posts')
    ]);
    
    res.json({
        posts,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: offset + limit < total
        }
    });
});
```

#### 필드 선택

```javascript
// ❌ 모든 필드 반환
SELECT * FROM users;

// ✅ 필요한 필드만 선택
SELECT id, username, avatar, created_at FROM users;
```

### 6.3 압축

```javascript
// server-backend/app.js

import compression from 'compression';

// Gzip 압축 (이미 적용됨)
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6 // 압축 레벨 (1-9, 기본값 6)
}));
```

---

## 7. 성능 측정

### 7.1 Lighthouse 테스트

```powershell
# Chrome DevTools에서 실행
# 1. F12 -> Lighthouse 탭
# 2. "Analyze page load" 클릭

# CLI에서 실행
npm install -g lighthouse
lighthouse https://yourdomain.com --view

# CI/CD에서 자동화
lighthouse https://yourdomain.com --output=json --output-path=./lighthouse-report.json
```

### 7.2 Web Vitals 모니터링

```typescript
// frontend/src/utils/webVitals.ts

import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
    onCLS(console.log);  // Cumulative Layout Shift
    onFID(console.log);  // First Input Delay
    onFCP(console.log);  // First Contentful Paint
    onLCP(console.log);  // Largest Contentful Paint
    onTTFB(console.log); // Time to First Byte
}

// Sentry에 전송
export function sendToAnalytics(metric: any) {
    const body = JSON.stringify(metric);
    const url = 'https://analytics.example.com/vitals';
    
    if (navigator.sendBeacon) {
        navigator.sendBeacon(url, body);
    } else {
        fetch(url, { body, method: 'POST', keepalive: true });
    }
}
```

```typescript
// frontend/src/main.tsx

import { reportWebVitals, sendToAnalytics } from './utils/webVitals';

// 앱 시작 후
reportWebVitals(sendToAnalytics);
```

### 7.3 성능 프로파일링

```typescript
// React DevTools Profiler 사용
import { Profiler } from 'react';

function onRenderCallback(
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
) {
    console.log({
        id,
        phase,
        actualDuration, // 렌더링 소요 시간
        baseDuration,   // 메모이제이션 없이 걸릴 시간
        startTime,
        commitTime
    });
}

function App() {
    return (
        <Profiler id="App" onRender={onRenderCallback}>
            <YourApp />
        </Profiler>
    );
}
```

---

## 8. 추가 최적화 기법

### 8.1 메모이제이션

```typescript
// React.memo로 불필요한 리렌더링 방지
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }: Props) => {
    // 복잡한 렌더링 로직
    return <div>{data}</div>;
});

// useMemo로 비싼 계산 캐싱
import { useMemo } from 'react';

function Component({ items }: Props) {
    const sortedItems = useMemo(() => {
        return items.sort((a, b) => a.value - b.value);
    }, [items]);
    
    return <List items={sortedItems} />;
}

// useCallback으로 함수 참조 유지
import { useCallback } from 'react';

function Parent() {
    const handleClick = useCallback(() => {
        console.log('Clicked');
    }, []);
    
    return <Child onClick={handleClick} />;
}
```

### 8.2 가상 스크롤링

```typescript
// react-window를 사용한 대량 리스트 렌더링
import { FixedSizeList } from 'react-window';

function LargeList({ items }: Props) {
    return (
        <FixedSizeList
            height={600}
            itemCount={items.length}
            itemSize={50}
            width="100%"
        >
            {({ index, style }) => (
                <div style={style}>
                    {items[index].name}
                </div>
            )}
        </FixedSizeList>
    );
}
```

### 8.3 Debouncing & Throttling

```typescript
// 검색 입력 디바운싱
import { debounce } from 'lodash-es';
import { useCallback } from 'react';

function SearchInput() {
    const debouncedSearch = useCallback(
        debounce((query: string) => {
            // API 호출
            fetchResults(query);
        }, 300),
        []
    );
    
    return (
        <input
            onChange={(e) => debouncedSearch(e.target.value)}
            placeholder="Search..."
        />
    );
}

// 스크롤 이벤트 스로틀링
import { throttle } from 'lodash-es';

const handleScroll = throttle(() => {
    // 스크롤 처리
}, 100);

window.addEventListener('scroll', handleScroll);
```

---

## 9. 체크리스트

### 번들 최적화 ✅
- [ ] Vite 번들 분석 실행
- [ ] manualChunks 설정 (vendor, mui, charts 등)
- [ ] Terser 최소화 설정 (console.log 제거)
- [ ] Tree shaking 검증 (lodash-es, mui)
- [ ] 동적 import 적용 (대형 라이브러리)
- [ ] 번들 크기 < 500KB 달성

### 코드 스플리팅 ✅
- [x] Route-based splitting 적용됨 (30+ pages)
- [ ] Component-based splitting (HeavyChart, Editor)
- [ ] Library splitting (markdown, pdf, excel)
- [ ] Suspense fallback 최적화

### 이미지 최적화 ✅
- [ ] WebP 변환 구현
- [ ] Responsive images (srcset)
- [ ] Lazy loading images
- [ ] 이미지 압축 (quality: 80)
- [ ] 여러 크기 생성 (400w, 800w, 1200w)

### 캐싱 전략 ✅
- [x] Service Worker 캐싱 적용됨
- [x] Redis 캐싱 적용됨
- [ ] HTTP 캐싱 헤더 설정
- [ ] API 응답 캐싱 확대

### 백엔드 최적화 ✅
- [ ] 데이터베이스 인덱스 추가
- [ ] N+1 쿼리 문제 해결
- [ ] API 페이지네이션 적용
- [ ] 필드 선택 최적화
- [x] Gzip 압축 적용됨

### 성능 측정 ✅
- [ ] Lighthouse 테스트 실행
- [ ] Web Vitals 모니터링 구현
- [ ] React Profiler 사용
- [ ] 성능 리포트 작성

### 추가 최적화 ✅
- [ ] React.memo 적용 (주요 컴포넌트)
- [ ] useMemo/useCallback 적용
- [ ] 가상 스크롤링 (대량 리스트)
- [ ] Debounce/Throttle (검색, 스크롤)

---

## 10. 성능 목표 달성 로드맵

### Week 1: 번들 최적화
- Day 1-2: 번들 분석 및 manualChunks 설정
- Day 3-4: Tree shaking 검증 및 동적 import
- Day 5: 번들 크기 측정 및 최적화

### Week 2: 이미지 & 캐싱
- Day 1-2: WebP 변환 및 responsive images
- Day 3-4: Lazy loading 구현
- Day 5: 캐싱 전략 검증

### Week 3: 백엔드 최적화
- Day 1-2: 데이터베이스 인덱스 추가
- Day 3-4: 쿼리 최적화 (N+1 문제)
- Day 5: API 페이지네이션 적용

### Week 4: 측정 & 튜닝
- Day 1-2: Lighthouse 테스트 및 개선
- Day 3-4: Web Vitals 모니터링
- Day 5: 최종 성능 리포트

---

## 🎯 완료 기준

- ✅ Lighthouse Performance 90+
- ✅ First Contentful Paint < 1.8s
- ✅ Largest Contentful Paint < 2.5s
- ✅ Time to Interactive < 3.8s
- ✅ Total Blocking Time < 300ms
- ✅ Cumulative Layout Shift < 0.1
- ✅ Bundle Size < 500KB

---

**문서 버전:** 1.0.0  
**작성일:** 2025-11-12  
**작성자:** GitHub Copilot
